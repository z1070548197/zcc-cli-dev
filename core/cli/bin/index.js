#! /usr/bin/env node

const importLocal = require('import-local');

if(importLocal(__filename)){
    require('npmlog').info('正在使用zcc-cli本地版本')
    require('../lib')(process.argv.slice(2))
}else{
    require('../lib')(process.argv.slice(2))
}