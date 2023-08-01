'use strict';
/** is对象 */
function isObject(e) {
  return Object.prototype.toString.call(e) === '[object Object]';
}

/** 加载显示 */
function Spinners(msg='loading..',SpinnerString='|/-\\') {
  const Spinner = require('cli-spinner').Spinner;

  const spinner = new Spinner(msg+' %s');
  spinner.setSpinnerString(SpinnerString);

  this.start = () => {
    spinner.start();
  }
  this.stop = (e) => {
    spinner.stop(e);
  }
}
/** 时间暂停术 */
function sleep(){
  return new Promise(resolve=>setTimeout(resolve,1000));
}
 //win or macos 兼容安装
function spawn(command,args,options){
  const cp =require('child_process');
  const win32 = process.platform ==='win32';
  const cmd = win32 ? cmd :command;
  const cmdArgs = win32 ? ['/c'].concat(command,args) :args;
  return cp.spawn(cmd,cmdArgs,options||{});
}
function execAsync(command,args,options){
    return new Promise((resolve, reject) => {
      const p = spawn(command,args,options);
      p.on('error',e=>{
        reject(e);
      })
      p.on('exit',c=>{
        resolve(c);
      })
    })
}
module.exports = {
  isObject ,Spinners,sleep,spawn,execAsync
};

