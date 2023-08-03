'use strict';

module.exports = core;
//require .js/.json/.node
//.js -> module.exports/exports
//.json => JSON.parse
// any -> .js
const semver = require('semver');//用于版本号比对
const log = require('@zcc-cli-dev/log');//自封装版本库
const pkg = require('../package.json');//导入package信息
const path = require('path');
const constant = require('./const')//全局变量
const colors = require('colors/safe'); //打印颜色
const userHome = require('user-home'); //获取用户主目录
const pathExists = require('path-exists').sync; //判断主目录

let args, config;
function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    checkEnv();
    checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }

}


/** 1.node版本判断 */
function checkNodeVersion() {
  //获取当前node版本号
  const currentVersion = process.version;
  //对比最低版本号
  const lowestVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestVersion)) {
    //版本号没有大于设置版本号报错
    throw new Error(colors.red(`zcc-cli-dev 需要安装v${lowestVersion}以上的版本的 Node.js`))
  }
}

/** 2.检查版本 */
function checkPkgVersion() {
  log.notice(pkg.version)
}
/** 3.切换node权限到普通用户权限 */
function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();//切换node权限到普通用户权限
  //process.getuid() 为0 ->超级管理员操作
}
/** 4.判断用户主目录是否一直 */
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前用户主目录不存在！'))
  }
}
/** 获取命令字符 */
function checkInputArgs() {
  const minimist = require('minimist');//获取命令字符
  args = minimist(process.argv.slice(2));
  checkArgs()
}
/** 判断是否debug模式切换log */
function checkArgs() {
  //log.verbose('213') debug模式 会输出verbose打印
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose';
  } else {
    process.env.LOG_LEVEL = 'info';
  }
  log.level = process.env.LOG_LEVEL;
}

/** 配置环境变量 */
function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env')//获取环境用户主目录的.env文件路径
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    }); //解析出来 放入 process.env里
  }
  createDefault() 
  log.verbose('环境变量路径',process.env.CLI_HOME_PATH)
}
/** 创建默认环境变量 */
function createDefault(){
  const cliConfig = {
    home:userHome,
  };
  if(process.env.CLI_HOME){
    cliConfig['cliHome']=path.join(userHome,process.env.CLI_HOME);
  }else{
    cliConfig['cliHome']=path.join(userHome,constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
  return cliConfig;
}

function checkGlobalUpdate(){
  //获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  //调用npm API，获取所有版本号
  //提取所有版本号
  //给出最新版本号
}