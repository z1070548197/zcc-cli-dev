'use strict';
const log = require("@zcc-cli-dev/log");
const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

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
      }


      //3.安装模板
    } catch (e) {
      log.error(e.message);
    }
  }

  /**模板下载 */
  async downloadTempate() {
    const { projectTemplate } = this.projeactInfo;
    const templateInfo = this.template.find(item => item.npmName === projectTemplate);
    const targetPath = path.resolve(userHome, '.zcc-cli-dev', 'template');
    const storeDir = path.resolve(userHome, '.zcc-cli-dev', 'template', 'node_modules');
    const { npmName, version } = templateInfo;
    const templateNpm = new Package({
      targetPath, storeDir, packageName: npmName, packageVersion: version
    })
    if (! await templateNpm.exists()) {
      await templateNpm.install();
    }else{
      await templateNpm.update();
    }
  }

  /**前置检查 */
  async prepare() {
    //0.判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error('无项目模板,请联系检查数据库数据')
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
    const project = await inquirer.prompt([{
      type: 'input',
      name: 'projectName',
      message: '请输入项目名称',
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
      name: 'projectVersion',
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
      choices: this.createTemplateChoice()
    }
    ])
    projeactInfo = { type, ...project }
    //4.获取项目的基本信息
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
  createTemplateChoice() {
    return this.template.map(item => (
      {
        value: item.npmName,
        name: item.name
      }
    ))
  }
}

module.exports = init;
module.exports.InitCommand = InitCommand;