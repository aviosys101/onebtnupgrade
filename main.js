'use strict';

const { app, BrowserWindow,Menu,MenuItem,screen,dialog,shell,net } = require('electron');
const path = require('path');
const ipc = require('electron').ipcMain;
const os = require('os');
const fs = require('fs');
const FormData = require('form-data');
var HOST = require("ip").address();
var authhost;
var filepath;
var authfail=0;

function createWindow () {
// Create the browser window.grouplist

  var menu = Menu.buildFromTemplate(
  [
    {label: '🔍Scan',click(){ win.webContents.send('dispscan');}},
    {label:'⏬Firmware',
      submenu: [ 
        {label:'Open file',click(){
          dialog.showOpenDialog({
            filters: [
              { name: 'All Files', extensions: ['*'] }
            ],
          properties: ['openFile']
          }).then(result => {
            filepath = result.filePaths[0];
            win.webContents.send('dispath',filepath);
          }).catch(err => {
            console.log(err)
          })                    
        }},
        {label:'Upgrade', click(){
          win.webContents.send('dispupdate');
        }}
        ]},     
    {label:'🛠️About',
      submenu: [ 
        {label:'Ver:1.0.0'},
        {label:'Help', click(){
          shell.openExternal('http://www.aviosys.com');
        }},
        {label:'🔧Debug', role:'toggleDevTools'},
        {label:'❌Close', role:'quit'}
        ]}     
  ])

  Menu.setApplicationMenu(menu); 
  const display = screen.getPrimaryDisplay();
  const dimensions = display.workAreaSize;
  const win = new BrowserWindow({    
    width: parseInt(dimensions.width * 0.5),
    height: parseInt(dimensions.height * 0.5),
    minWidth: parseInt(260),
    minHeight: parseInt(300),
    maxWidth: dimensions.width,
    maxHeight: dimensions.height,
    backgroundColor: '#2e2c29',
    icon: 'css/ipc1.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

// Load the index.html of the app.
  win.loadFile('index.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// This method is equivalent to 'app.on('ready', function())'

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
// On macOS it is common for applications and their menu bar
// To stay active until the user quits explicitly with Cmd + Q
if (process.platform !== 'darwin') {
	app.quit()
}
})


ipc.on('uploadfw', (event,arg,arg1,arg2) =>  {
  
  const boundaryKey = '----WebKitFormBoundaryWdFFCdVh1ngt8UKf';
  var username = arg1;
  var password = arg2;

  const host = arg;   
  const form = new FormData();
  form.append('filename', fs.createReadStream(filepath));


  const requestApi = {
    method: 'POST',
    protocol: 'http:',
    hostname: host,
    path: '/cgi-bin/upload.cgi'
  };
  
  var request = net.request(requestApi);  
  request.setHeader("Content-Type",'multipart/form-data; boundary=' + boundaryKey);
  request.setHeader("Connection","keep-alive");
 
  form.pipe(request, { end: false });
  form.on('end', function () {
      console.log("end");  
      request.end('\r\n--' + boundaryKey + '--\r\n');        
  });

  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    dialog.showMessageBox({
      type: 'info',
      title: 'MessageBox',
      message: host+' Upgrade firmware OK'
    }) 
    response.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    })
    response.on('error', (error) => {
      console.log(`ERROR: ${JSON.stringify(error)}`);
    })
  })

  request.on('login', (authInfo, callback) => {
    authhost = authInfo.host;
    authfail++;
    if(authfail > 3)
    {
      authfail = 0;
      createAuthPrompt(authhost).then(credentials => {
        username = credentials.username;
        password = credentials.password;
       callback(username, password);
      });
    }
    else 
    {
      callback(username, password)      
    }
  })
});

function createAuthPrompt(host) {
  const authPromptWin = new BrowserWindow({
    width: 300,
    height: 300,
    minimizable: false,
    maximizable: false,
    icon: 'css/ipc1.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
});
authPromptWin.setTitle(host);
authPromptWin.setMenuBarVisibility(false);
authPromptWin.loadFile("auth-form.html"); // load your html form
  return new Promise((resolve, reject) => {
    ipc.once("form-submission", (event, username, password) => {
      authPromptWin.close();
      const credentials = {
        username,
        password
      };
      resolve(credentials);
    });
  });
}
