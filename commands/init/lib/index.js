'use strict';
const log = require("@zcc-cli-dev/log");
const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

function init(argv) {
  //console.log(projectName,cmdObj,process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}

const Command = require('@zcc-cli-dev/command');

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
      await this.prepare();
      //2.下载模板

      //3.安装模板
    } catch (e) {
      log.error(e.message);
    }

  }
  async prepare() {
    //1.判断当前目录是否为空
    const localPath = process.cwd(); //当前执行的目录
    if (!this.ifDirIsEmpty(localPath)) {
      let ifContinue = false;
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
          name: 'ifContinue',
          default: false,
          message: '目录下所有文件将清空?'
        }))
        if (confirmDelete) {
          //清空当前目录
          fse.emptyDirSync(localPath); //清空文件
        }
      }
    }
    return this.getProjectInfo();

  }
  async getProjectInfo() {
    const projeactInfo = {};
    //3.选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choides: [{
        name: '项目',
        value: TYPE_PROJECT
      },
      {
        name: '组件',
        value: TYPE_COMPONENT
      }
      ]
    })
    //4.获取项目的基本信息
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
}

module.exports = init;
module.exports.InitCommand = InitCommand;