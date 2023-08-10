'use strict';

function init (projectName,cmdObj,a){
  //console.log(projectName,cmdObj,process.env.CLI_TARGET_PATH);
  return new InitCommand();
}

const Command = require('@zcc-cli-dev/command');

class InitCommand extends Command {
  
}

module.exports =init;
module.exports.InitCommand = InitCommand;