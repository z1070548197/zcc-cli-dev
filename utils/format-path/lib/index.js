'use strict';

module.exports = formatPath;

const path=require('path')

function formatPath(p) {
  if(p && typeof p === 'string'){
    const sep=path.sep; //系统分隔符
    if(sep ==='/'){
      return p;
    }else{
      return p.replace('/\\/g','/');
    }
  }
  return p
}
