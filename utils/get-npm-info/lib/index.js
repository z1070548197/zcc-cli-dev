'use strict';

const axios = require('axios');
const urlJoin = require('url-join'); //拼接网址
const semver = require('semver');//用于版本号比对

/**获取线上版本信息 */
function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null;
  }
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  return axios.get(npmInfoUrl).then(res => {
    if (res.status === 200) {
      return res.data;
    } else {
      return null;
    }
  }).catch(err => {
    return Promise.reject(err)
  })
}
/**获取镜像源 */
function getDefaultRegistry(isOriginal = false) {
  return  'https://registry.npmjs.org' 
}
/** 返回所有版本号 */
async function getNpmVerSions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions)
  } else {
    return [];
  }
}
/** 返回大于base版本的所有版本 */
function getNpmSemverVersions(baseVersion, versions) {
  return versions.filter(e =>
    //比对大于等于baseVersion的版本
    semver.satisfies(e, `^${baseVersion}`)
  ).sort((a, b) => {
    return semver.lt(b, a) ? -1 : 1
  });
}
/**返回大于当前版本的所有版本 */
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVerSions(npmName, registry);
  const newVersions = getNpmSemverVersions(baseVersion, versions);
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
}
/** 获取包最高版本 */
async function getNpmLatestVersion(npmName,registry){
  const versions= await getNpmVerSions(npmName,registry);
  if(versions){
    return versions.sort((a, b) => {
      return semver.lt(b, a) ? -1 : 1
    })[0]
  }else{
    return null;
  }
}

module.exports = {
  getNpmInfo, getNpmVerSions, getNpmSemverVersion,getDefaultRegistry,getNpmLatestVersion
}