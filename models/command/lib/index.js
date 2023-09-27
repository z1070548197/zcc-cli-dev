'use strict';
const semver = require('semver');//用于版本号比对
const colors = require('colors');//用于版本号比对xw
const log =require('@zcc-cli-dev/log');
const LOWEST_NODE_VERSION = '14.0.0';

class Command {
  constructor(argv) {
    if(!argv){
      throw new Error('argv不能为空');
    }
    if(!Array.isArray(argv)){
      throw new Error('argv必须为数组')
    }
    if(argv.length<1 ){
      throw new Error('argv数组为空')
    }
    this._argv = argv;
    let runer = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(()=>this.init());
      chain = chain.then(()=>this.exec());
      chain.catch(err=>{
        log.error(err.message);
      });
    })
  }
  initArgs(){
      this._cmd= this._argv[this._argv.length -1];
      this.argv =this._argv.slice(0,this._argv.length-1);
  }
  checkNodeVersion() {
    //获取当前node版本号
    const currentVersion = process.version;
    //对比最低版本号
    const lowestVersion = LOWEST_NODE_VERSION;

    if (!semver.gte(currentVersion, lowestVersion)) {
      const text=`zcc-cli-dev 需要安装v${lowestVersion}以上的版本的 Node.js`
      //版本号没有大于设置版本号报错
      throw new Error(colors.red(text))
    }
  }
  init() {
    throw new Error('init必须实现');
  }
  exec() {
    throw new Error('init必须实现');
  }
}

module.exports = Command;

