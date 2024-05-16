const { exec } = require('child_process');

// 执行 npm install
exec('npm install', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行 npm install 出错：${error}`);
    return;
  }
  console.log(`npm install 输出：${stdout}`);
  console.error(`npm install 错误：${stderr}`);
});