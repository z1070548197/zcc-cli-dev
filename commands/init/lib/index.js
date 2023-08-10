'use strict';
const log = require("@zcc-cli-dev/log");

function init (argv){
  //console.log(projectName,cmdObj,process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}

const Command = require('@zcc-cli-dev/command');

class InitCommand extends Command {
    init(){
        this.projectName = this._argv[0] ||'';
        this.force =!!this._cmd.force;
        log.verbose('projectName',this.projectName);
        log.verbose('force',this.force);
    }
    exec(){

    }
}

module.exports =init;
module.exports.InitCommand = InitCommand;