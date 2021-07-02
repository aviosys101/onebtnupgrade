```bash
注意windows,mac和Linux系统下都是在终端执行同样的命令
# Clone this repository
1）git clone https://github.com/aviosys101/ipedit_electron.git

# Go into the repository
2）cd ipedit_electron

# Install dependencies
3)npm init -y
  npm i --save-dev electron
  
  安装自动更新需要的包：
  npm install update-electron-app
  
4)运行程序(Run the app)
npm start

5）打包并分发应用程序：
导入 Electron Forge 到应用文件夹：
npm install --save-dev @electron-forge/cli
npx electron-forge import

创建一个分发版本：
npm run make

Electron-forge 会创建 out 文件夹，您的软件包将在那里找到。
