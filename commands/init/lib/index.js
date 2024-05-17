'use strict';
const log = require("@zcc-cli-dev/log");
const { Spinners, sleep, execAsync } = require("@zcc-cli-dev/utils");
const fs = require('fs');
const path = require('path');
const { homedir } = require('os');
const fse = require('fs-extra');
const ejs = require('ejs');
const inquirer = require('inquirer');
const semver = require('semver');
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const TEMPLATE_TYPE_NORMAL = 'normal';//标准模板
const TEMPLATE_TYPE_CUSTOM = 'custom'; //自定义模板

const WHITE_COMMAND = ['npm', 'cnpm'];

const getProjectTemplate = require('./getProjectTemplate');

function init(argv) {
  //console.log(projectName,cmdObj,process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}

const Command = require('@zcc-cli-dev/command');
const Package = require("@zcc-cli-dev/package");

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }

  async exec() {
    try {
      //1.准备阶段
      const projeactInfo = await this.prepare();
      if (projeactInfo) {
        //2.下载模板
        this.projeactInfo = projeactInfo;
        await this.downloadTempate();
        //3.安装模板
        await this.installTemplate();
      }

    } catch (e) {
      log.error(e.message,'服务器错误');
    }
  }
  /**模板安装 */
  async installTemplate() {
    if (this.templateInfo) {
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        this.installNormalTemplate()
        return
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        this.installCustomTemplate()
        return
      }
      throw new Error('无模板类型');
    } else {
      throw new Error('模板信息不存在');
    }
  }
  //检查cmd命令是否正常
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }
  }
  //node多线程执行命令
  async execCommand(Command, errMag) {
    let Ret;
    if (Command) {
      const installCmd = Command.split(' ');
      const cmd = this.checkCommand(installCmd[0]);
      if (!cmd) {
        throw new Error('命令不存在！命令：' + command);
      }
      const args = installCmd.slice(1);
      Ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd(), //指向当前命令目录
      })
    }
    if (Ret !== 0) {
      throw new Error(errMag)
    }
  }
  //ejs格式化文件
  async ejsRender(options) {
    return new Promise((resolve, reject) => {
      const glob = require('glob')
      const dir = process.cwd();
      const fileList = glob.globSync('{,.}**', {
        cwd: dir,
        ignore: options.ignore || '',
        nodir: true,// 去除文件夹
      })
      Promise.all(fileList.map(file => {
        const filePath = path.join(dir, file);
        return new Promise((resolve1, reject1) => {
          ejs.renderFile(filePath, options.projeactInfo, { async: true }, async (err, result) => {
            if (err) {
              reject1(err);
            } else {
              const text = await result;
              fse.writeFile(filePath, text);
              resolve1(result)
            }
          })
        })
      })).then(e => {
        resolve(e)
      }).catch(e => {
        reject(e)
      })
    })
  }
  //标准模板安装
  async installNormalTemplate() {
    log.verbose('模板缓存信息', this.templateNpm);
    const spinnerObj = new Spinners('安装模板');
    try {
      spinnerObj.start();
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
      const targetPath = process.cwd();
      fse.ensureDirSync(targetPath);
      fse.ensureDirSync(templatePath);
      fse.copySync(templatePath, targetPath);
    } catch (e) {
      throw e
    } finally {
      spinnerObj.stop(true);
    }
    const templateiIgnore = this.templateInfo.ignore || [];
    const ignore = ['node_modules/**', 'public/**', 'src/assets/**', '*.png', ...templateiIgnore];
    const options = {
      ignore, projeactInfo: this.projeactInfo
    }
    await this.ejsRender(options);
    const { installCommand, startCommand } = this.templateInfo;
    //依赖安装
    await this.execCommand(installCommand, '依赖安装失败');
    //启动命令执行
    await this.execCommand(startCommand, '启动执行失败');
  }
  //自定义模板安装
  async installCustomTemplate() {

  }
  /**模板下载 */
  async downloadTempate() {
    const { projectTemplate } = this.projeactInfo;
    const templateInfo = this.template.find(item => item.npmName === projectTemplate);
    const userHome = homedir();
    let spinnerObj = null;
    const targetPath = path.resolve(userHome, '.zcc-cli-dev', 'template');
    const storeDir = path.resolve(userHome, '.zcc-cli-dev', 'template', 'node_modules');
    const { npmName, version } = templateInfo;
    const templateNpm = new Package({
      targetPath, storeDir, packageName: npmName, packageVersion: version
    })
    try {
      if (! await templateNpm.exists()) {
        spinnerObj = new Spinners('下载模板');
        spinnerObj.start();
        await templateNpm.install();
        await sleep();
      } else {
        spinnerObj = new Spinners('模板版本检查');
        spinnerObj.start();
        await templateNpm.update();
        await sleep();
      }
    } catch (e) {
      throw e
    } finally {
      spinnerObj.stop(true);
      this.templateNpm = templateNpm;
      this.templateInfo = templateInfo;
    }
  }

  /**前置检查 */
  async prepare() {
    //0.判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error('无项目模板,请联系检查数据库数据');
    }
    this.template = template;
    //1.判断当前目录是否为空
    const localPath = process.cwd(); //当前执行的目录
    if (!this.ifDirIsEmpty(localPath)) {
      let ifContinue = true;
      if (!this.force) {
        //不为空 询问
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目?'
        })).ifContinue
      }
      if (!ifContinue) {
        return
      }
      if (ifContinue || this.force) {
        const { confirmDelete } = (await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '目录下所有文件将清空?'
        }))
        if (!confirmDelete) {
          return
        }
        if (confirmDelete) {
          //清空当前目录
          fse.emptyDirSync(localPath); //清空文件
        }
      }
    }
    return this.getProjectInfo();
  }
  /**命令数据采集 */
  async getProjectInfo() {
    let projeactInfo = {};
    //3.选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [{
        name: '项目',
        value: TYPE_PROJECT
      },
      {
        name: '组件',
        value: TYPE_COMPONENT
      }
      ]
    })
    const title = type === TYPE_PROJECT ? '项目' : '组件'
    const project = await inquirer.prompt([{
      type: 'input',
      name: 'projectName',
      message: `请输入${title}名称`,
      default: '',
      validate(v) {
        const done = this.async();
        setTimeout(() => {
          if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
            done("请输入合法名称\n首字符必须为英文字符\n尾字符必须为英文或数字\n字符仅允许'-_'");
            return;
          }
          done(null, true);
        }, 0)
      },
      filter(v) {
        return v;
      },
    }, {
      type: 'input',
      name: 'projectChineseName',
      message: `请输入${title}中文名称 ${title==='项目'?'（后台将自动修改站点名称)':''}}`,
      validate(v) {
        const done = this.async();
        setTimeout(() => {
          if (!v) {
            done("请输入中文名称");
            return;
          }
          done(null, true);
        }, 0)
      },
      default: '',
    }, {
      type: 'input',
      name: 'version',
      message: '请输入项目版本号',
      default: '1.0.0',
      validate(v) {
        const done = this.async();
        if (!semver.valid(v)) {
          done('请输入合法版本号')
          return;
        }
        done(null, true);
        //验证版本是否规范
      },
      filter(v) {
        if (semver.valid(v)) {
          return semver.valid(v);
        } else {
          return v;
        }
      },
    }, {
      type: 'list',
      name: 'projectTemplate',
      message: '请选择模板',
      choices: this.createTemplateChoice(type)
    }
    ])
    //4.获取项目的基本信息
    projeactInfo = { type, ...project }
    if (projeactInfo.projectName) {
      projeactInfo.className = require('kebab-case')(projeactInfo.projectName);
    }
    log.verbose(JSON.stringify(projeactInfo))
    return projeactInfo
  }

  /** 检测文件目录里是否为空 */
  ifDirIsEmpty(localPath) {
    //console.log(path.resolve('.')) //也可以拿到执行目录
    let fileList = fs.readdirSync(localPath); //读取目录文件信息
    //文件过滤
    fileList = fileList.filter(file => {
      return !file.startsWith('.') && ['node_modules'].indexOf(file < 0)
    });
    return !fileList || fileList.length <= 0
  }
  /**模板数据格式化 */
  createTemplateChoice(type) {
    return this.template.filter(template => {
      return template.tag.includes(type)
    }).map(item => (
      {
        value: item.npmName,
        name: item.name
      }
    ))
  }
}

module.exports = init;
module.exports.InitCommand = InitCommand;