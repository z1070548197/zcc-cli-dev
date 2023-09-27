'use strict';

const log=require('npmlog')

log.level=process.env.LOG_LEVEL ? process.env.LOG_LEVEL :'info'; //读取环境 选择log输出类型
log.heading='zcc-cli';//log前缀
log.headingStyle={fg:'white',bg:'black'} //前缀样式

module.exports = log;