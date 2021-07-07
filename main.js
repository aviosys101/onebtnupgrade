//const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const electron = require('electron')

const {screen,dialog,shell,net } = require('electron')
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const app = electron.app
const FormData = require('form-data')
const fs = require('fs')

var pop=1;
var authfail=0;
var filepath,filepath1;

//var searcher = require('./searcher');
let win = null;
 
function createWindow () {
  const display = screen.getPrimaryDisplay();
  const dimensions = display.workAreaSize;	
   win = new BrowserWindow({
    width: parseInt(dimensions.width * 0.5),
    height: parseInt(dimensions.height * 0.5),
    minWidth: parseInt(300),
    minHeight: parseInt(400),
    maxWidth: dimensions.width,
    maxHeight: dimensions.height,
    backgroundColor: '#2e2c29',
    icon: 'css/ipc1.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

   // Set menu to window
   const menu = Menu.buildFromTemplate(template)
   Menu.setApplicationMenu(menu)

  //win.webContents.openDevTools()
  win.loadFile('index.html')
  //searcher.send_brocast_mtk();
}

var template = [{
  label: '🔍Search',
  submenu: [{
    label: 'Lan Search',
    accelerator: 'CmdOrCtrl+L',
//    click:()=>searcher.send_brocast()
      click:()=>win.webContents.send('lan_search', "searching from menu")
  },{
    type: 'separator'
  }
  /*,{
    label: 'Internet Search',
    accelerator: 'CmdOrCtrl+I',
    
  }*/
  ]
},
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
		console.log(filepath)
		win.webContents.send('dispath',filepath);
	  }).catch(err => {
		console.log(err)
	  })                    
	}},        
	{label:'Upgrade', click(){
	  win.webContents.send('dispupdate',0);
	}}
	]},
{label:'⏬Bootloader',
  submenu: [ 
	{label:'Open file',click(){
	  dialog.showOpenDialog({
		filters: [
		  { name: 'All Files', extensions: ['*'] }
		],
	  properties: ['openFile']
	  }).then(result => {
		filepath1 = result.filePaths[0];
		  console.log(filepath1)
		  win.webContents.send('dispath1',filepath1);
	  }).catch(err => {
		console.log(err)
	  })                    
	}},        
	{label:'Upgrade', click(){
	  win.webContents.send('dispupdate',1);
	}}
	]},	
 {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Help',
    click: function () {
      electron.shell.openExternal('http://www.aviosys.com')
    }	
  },
  {label:'🔧Debug', role:'toggleDevTools'}
  ]
}];


app.whenReady().then(() => {

  createWindow()
 
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('lan_search', "searchering from main star");
  })
  
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const { ipcMain } = require('electron')
let edit_win = null;
ipcMain.on('open_edit_window', (event, arg) => {
  console.log(arg);
  event.reply('open_edit_window', 'open edit window ok');

  //const { BrowserWindow } = require('electron');
  edit_win = new BrowserWindow({ 
    width: 500,
    height: 600,
    show: false ,
    webPreferences: {
      //preload: path.join(__dirname, 'edit_preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  edit_win.removeMenu();
  //edit_win.webContents.openDevTools()
  edit_win.loadFile('editor_mtk.html');
  edit_win.once('ready-to-show', () => {
    edit_win.webContents.send('load_data', arg);
    edit_win.show()
  })

})

ipcMain.on('close_edit_window', (event, arg) => {
  console.log(arg);
  edit_win.close();
})

/*
require('update-electron-app')({
  repo: 'aviosys101/ipedit_update',
  updateInterval: '20 minutes',
  //logger: require('electron-log')
})
*/

// ipcMain.on('synchronous-message', (event, arg) => {
//   console.log(arg) // prints "ping"
//   event.returnValue = 'pong'
// })


ipcMain.on('uploadfw', (event,arg,arg1,arg2,arg3,arg4,arg5,arg6) =>  {
  
  if(net.isOnline(arg) == false)
  {
    event.reply('asynchronous-reply', 'offonline')
    return;
  }
  
  const boundaryKey = '----WebKitFormBoundaryWdFFCdVh1ngt8UKf';
  var username = arg1;
  var password = arg2;

  const totles = arg4;
  const host = arg;
  const macid2 = arg3;
  const pathcgi = arg5
  var Msgt = '';
  const form = new FormData();
  if(arg6 == '0')
  {
	  console.log('firmware')
    Msgt = ' Upgrade firmware OK';
	  form.append('filename', fs.createReadStream(filepath));
  }
  else
  {
	  console.log('bootloader')
    Msgt = ' Upgrade bootloader OK';
	  form.append('filename', fs.createReadStream(filepath1));
  }  
  
  const requestApi = {
    method: 'POST',
    protocol: 'http:',
    hostname: host,
    path: pathcgi
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
    event.reply('loading-reply', macid2);
    console.log(pop)
    if(pop == totles){
      pop = 1;
      setTimeout(function(){
        event.reply('dispscan');
      },70000);
    }else{
      pop++
    }

    dialog.showMessageBox({
      type: 'info',
      title: 'MessageBox',
      message: host+Msgt
    })

    response.on('error', (error) => {
      console.log(`ERROR: ${JSON.stringify(error)}`);
    })
  })

  request.on('login', (authInfo, callback) => {
    var authhost = authInfo.host;
    authfail++;   
    if(authfail > 1)
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
      callback(username, password);
    }
  })

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
      ipcMain.once("form-submission", (event, username, password) => {
        authPromptWin.close();
        const credentials = {
          username,
          password
        };
        resolve(credentials);
      });
    });
  }
});

