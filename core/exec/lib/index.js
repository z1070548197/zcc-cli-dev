'use strict';

module.exports = exec;

const Package = require("@zcc-cli-dev/package");
const log = require('@zcc-cli-dev/log');
const {execAsync} = require('@zcc-cli-dev/utils');
const path = require('path');
const SETTINGS = {
  init: '@zcc-cli-dev/init'
}

const CACHE_DIR = 'dependencies/';

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = '';
  let pkg = null;
  const cmdObj = arguments[arguments.length - 1];//获取cmd对象
  const cmdName = cmdObj.name(); //获取命令名称
  const packageName = SETTINGS[cmdName]; //获取脚手架名
  const packageVersion = 'latest';
  let rootFile='';
  //如果没有，自动生成缓存路径
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); //生成缓存路径
    storeDir = path.resolve(targetPath, 'node_modules');
    const options = { targetPath, homePath, packageName, packageVersion, storeDir };
    logs(targetPath, homePath, storeDir)
    pkg = new Package(options);
    //pkg存在情况
    if (await pkg.exists()) {
      await pkg.update()
    } else {
      // 安装package
      await pkg.install()
    }
    rootFile = pkg.getRootFile();
  } else {
    //命令传入targetPath路径
    const options = { targetPath, homePath, packageName, packageVersion, storeDir };
    logs(targetPath, homePath, storeDir)
    pkg = new Package(options);
    rootFile = pkg.getRootFile();
  }
  if (rootFile) {
    try{
      //同步方法执行
      //require(rootFile).call(null,Array.from(arguments));
      //使用node多进程执行
      const args = Array.from(arguments);//类数组转数组
      const cmd =args[args.length-1];//取参数最后一个
      const o = Object.create(null);//创建没有原型链的对象
      //剔除没用的属性
      Object.keys(cmd).forEach(key=>{
        if(cmd.hasOwnProperty(key) && !key.startsWith('_')&&key!=='parent'){
            o[key]=cmd[key];
        }
      })
      const options=cmd.opts()
      Object.keys(options).forEach(key=>{
        o[key]=  options[key]
      })
      args[args.length-1]=o;
      const code=`require('${rootFile}').call(null,${JSON.stringify(args)})`;
      //使用node多进程调用命令
      const child =execAsync('node',['-e',code],{
        cwd:process.cwd(),
        stdio:'inherit', //自动监听输出，直接输出至主进程里
      })
    }catch(e){
      log.error(e.message);
    }
    
  }
  function logs(targetPath, homePath, storeDir) {
    log.verbose('targetPath', targetPath);//debug提示commands路径
    log.verbose('homePath', homePath);//debug提示脚手架路径
    log.verbose('storeDir', storeDir);//debug提示脚手架路径
  }
 

}
