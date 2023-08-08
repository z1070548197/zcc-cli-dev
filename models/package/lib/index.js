'use strict';

const { isObject } = require('@zcc-cli-dev/utils');
const pkgDir = require('pkg-dir').sync;
const path = require('path');
const pathExists = require('path-exists').sync;
const formatPath = require('@zcc-cli-dev/format-path');
const npminstall = require('npminstall');
const fse = require('fs-extra');
const { getDefaultRegistry, getNpmLatestVersion } = require('@zcc-cli-dev/get-npm-info')
class Package {
  constructor(options) {
    if (!options || !isObject(options)) {
      throw new Error('package类的options参数错误！')
    }
    //package的路径
    this.targetPath = options.targetPath;
    //package的缓存路径
    this.storeDir = options.storeDir;
    //packagename
    this.packageName = options.packageName;
    //packageVersion
    this.packageVersion = options.packageVersion;
    //package缓存目录前缀
    this.cacheFilePathPrefix = this.packageName;
  }
  //设置包版本
  async prepare() {
    //没有读取到文件的情况下 自动创建好路径
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirSync(this.targetPath);
      fse.mkdirSync(this.storeDir);
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  get cacheFilePath() {
    return path.resolve(this.storeDir, `${this.cacheFilePathPrefix}`)
  }

  //判断当前Package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  //安装Package
  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(),
      pkgs: [
        { name: this.packageName, version: this.packageVersion }
      ]
    })
  }
  //更新package
  async update() {
    await this.prepare();
  }
  //获取入口文件的绝对路径
  getRootFile() {
    //1.获取package.json目录
    const dir = pkgDir(this.targetPath);
    if (dir) {
      //2.读取package.json
      const pkgFile = require(path.resolve(dir, 'package.json'))
      //3.寻找main/lib
      if (pkgFile && pkgFile.main) {
        //4.路径的兼容(macOS/windows)
        return formatPath(path.resolve(dir, pkgFile.main));
      }
    } else {
      return null
    }

  }
}
module.exports = Package;