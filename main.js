'use strict';

const { app, BrowserWindow,Menu,MenuItem,screen } = require('electron');
const ipc = require('electron').ipcMain;
const os = require('os');
const {dialog} = require('electron');

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const { net } = require('electron');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
var info = [];
var totel=0;
var HOST = require("ip").address();

function createWindow () {
// Create the browser window.grouplist

  var menu = Menu.buildFromTemplate(
  [
    {label: '🔍Scan',click(){ win.webContents.send('dispscan');}},
    {label: '⏬Firmware',click(){win.webContents.send('dispupdate');}},
    {label:'🛠️About',
      submenu: [ 
        {label:'Ver:1.0.0'},
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
app.whenReady().then(createWindow)



// Quit when all windows are closed.
app.on('window-all-closed', () => {
// On macOS it is common for applications and their menu bar
// To stay active until the user quits explicitly with Cmd + Q
if (process.platform !== 'darwin') {
	app.quit()
}
})

app.on('activate', () => {
// On macOS it's common to re-create a window in the
// app when the dock icon is clicked and there are no
// other windows open.
if (BrowserWindow.getAllWindows().length === 0) {
	createWindow()
}
})



// In this file, you can include the rest of your
// app's specific main process code. You can also
// put them in separate files and require them here.


ipc.on('uploadfw', (event,arg,arg1) =>  {   
      
  const boundaryKey = '----WebKitFormBoundaryWdFFCdVh1ngt8UKf';
  const user = 'admin';
  const pw = '12345678';
  const host = arg;
  const cgi = '/cgi-bin/upload.cgi';   
  const form = new FormData();
  const dd='v1.28_682';
  form.append('filename', fs.createReadStream('root_uImage'));
  totel++;
 
  let request = net.request({
    method: 'POST',
    protocol: 'http:',
    hostname: host,
    path: cgi
  });
  request.setHeader("Content-Type",'multipart/form-data; boundary=' + boundaryKey);
  request.setHeader("Connection","keep-alive");

  request.on('login', (authInfo, callback) => {
      callback(user, pw);
    })
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'MessageBox',
      message: host+' Upgrade '+dd+' firmware OK'
    })  
    console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
    response.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    })
    response.on('error', (error) => {
      console.log(`ERROR: ${JSON.stringify(error)}`);
    })
  })
  
  form.pipe(request, { end: false });
  form.on('end', function () {
      console.log("end");  
      request.end('\r\n--' + boundaryKey + '--\r\n');        
  });
  console.log(totel);
  if(totel == arg1)
  {  
    var times=61000 * arg1;
    setTimeout(function(){
      totel = 0;
      event.reply('rescan');
    },times);
    if(arg1 == 1){ totel = 0;}
  }
});

function sendMsg(){
  var message = Buffer.from('IPQUERY,0');
  client.send(message, 0, message.length, 10000, '255.255.255.255', function(err, bytes) {
    client.close();
  });
}

server.on('close',()=>{
  console.log('socket已關閉');
});

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});
 
server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(9999, HOST);

ipc.on('UDPGO', (event, arg) =>  {
  const client = dgram.createSocket('udp4');
  client.on('close',()=>{
    console.log('client.socket已關閉');
  });
  
  client.on('error',(err)=>{
    console.log(err);
    client.close();
  });
  
  client.bind(42324,HOST,function () {
    client.setBroadcast(true);  
  });
  
  function sendMsg(){
    var message = Buffer.from('IPQUERY,0');
    client.send(message, 0, message.length, 10000, '255.255.255.255', function(err, bytes) {
      client.close();
    });
  } 

  sendMsg();
  var udpmsg={};
  setTimeout(function(){
    event.reply('groupmsg',udpmsg);

  }, 3000 );
  server.on('message', (msg, rinfo) => {   
    if(`${msg}`.indexOf('90-76') == -1)
    {  
      info = `${msg}`.split(",");
      var devinfo={};
      devinfo.mac=info[2];
      devinfo.ip=info[3];
      devinfo.nm=info[4];
      devinfo.gw=info[5];
      devinfo.name=info[6];
      devinfo.dhcp=info[7];
      devinfo.ver=info[8];
      udpmsg[devinfo.mac]=devinfo; 
    }
  });



});
