'use strict';

module.exports = core;
//require .js/.json/.node
//.js -> module.exports/exports
//.json => JSON.parse
// any -> .js
const pkg =require('../package.json')
function core() {
  checkPkgVersion()
}
//检查版本
function checkPkgVersion(){
  console.log(pkg.version)
}