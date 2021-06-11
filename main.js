const ipc =  require('electron').ipcRenderer;
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const HOST = require("ip").address();

var totle=0;
var body=[];
var bodymac=[];
var info = [];
var udpmsg={};
var nowpath='';
var nowfw = 'v1.28_682';
document.getElementById('progid').style.display='none';

/************************************ */
ipc.on('rescan', (event, arg) => {
  document.getElementById("grouplist").innerHTML='';
  scanip();
});

/******************************* */
function locs(d,event){
  d.style.position = "absolute";
  d.style.left = (event.clientX) +'px';
  d.style.top = (event.clientY-20)+'px';
  d.style.display="block";
}

/**************generate scan grouplist and click event****** */
function groupmsg(arg) {
  document.getElementById('progid').style.display='none';
  document.getElementById('grouplist').style.display='block';
  
  var groupinfo= '<div class="group">';
   function devicehtml(devinfo){
     return  '<div class="device" id="'+devinfo.mac+'" ><div class="MAC">'+devinfo.mac+
    '<br> '+devinfo.name+'<br> '+devinfo.ip+'<br>'+' DHCP:'+devinfo.dhcp+'<br> '+devinfo.ver+'</div>\
    <div id="s'+devinfo.mac+'" class="progbarsw" ><div class="progbar1"><div class="prog1"></div></div></div></div>';
   }

   for (var mac in arg) { groupinfo=groupinfo+devicehtml(arg[mac]);}
   document.getElementById("grouplist").innerHTML=groupinfo+'</div><div id="selscanid" class="selid"></div>';
   for (var mac in arg) 
   {  
     document.getElementById(mac).addEventListener('click', function (event2) {
   selid=document.getElementById("selscanid");

   locs(selid,event2);
   selid.innerHTML="<div id='macid1'>"+event2.path[1].id+"</div>"+
   "<div id='openweb1' class='butt1'> ⬇️WEB</div>"+
   "<div id='updatefw1' class='butt1'> ⬇️firmware</div>"+
   "<div id='clsselid1' class='butt1'>✔️Close</div>";
      document.getElementById('openweb1').addEventListener('click', function (event3) {
        var vid1 = event3.path[1].firstChild.innerText; 
        var ip1 = document.getElementById(vid1).innerHTML.split('<br>')[2].split(':')[0].trim();
        var prd1 = ip1.trim(); 
        require("electron").shell.openExternal('http://'+prd1);      
        selid.style.display="none";
      });   
      document.getElementById('updatefw1').addEventListener('click', function (event1) {
        if(nowpath == ''){
          alert('No File, Firmware->Open File');
        }
        else{
          var vid2 = event1.path[1].firstChild.innerText;
          var ip2 = document.getElementById(vid2).innerHTML.split('<br>')[2].split(':')[0].trim();
          var prd2 = ip2;       
          var yes = confirm('Firmware upgrade?');
          if (yes) {
            document.getElementById(vid2).className='device nows';
           ipc.send('uploadfw',prd2,'admin','12345678',vid2,1);
            selid.style.display="none";
          } else {
              return 0;
          }
        }             
      });
      document.getElementById('clsselid1').addEventListener('click', function () {
        selid.style.display="none";
      });
   })
  }
  
 }

function nowupload(){
    var listT = document.getElementsByClassName('MAC');
    
    for(var s=0; s < listT.length; s++)
    {
      
      var openx = listT[s].textContent;
      var vd = openx.split(' ');
      var macd = vd[0];
      var prd = vd[2].split(':')[0];
      var fw = vd[4];

      console.log(nowfw)
      if(fw != nowfw)
      {
        //document.getElementsByClassName('progbarsw')[s].style.display='block';
        body[s]=prd;
        bodymac[s]=macd;
      }
      else
      {
        body[s]='';
        bodymac[s]='';
      }

      
    }
    totle = 0;
    body = body.filter(el => el);
    bodymac = bodymac.filter(el => el);
    vloop(0);
}

/**************display menu**************************************************** */
ipc.on('dispscan', (event, arg) => {
  document.getElementById("grouplist").innerHTML='';
  document.getElementById('grouplist').style.display='none';
  document.getElementById('progid').style.display='block';
  scanip();
})

ipc.on('dispupdate', (event, arg) => { 
  if(nowpath == ''){
    alert('No File, Firmware->Open File');
  }
  else{
    var yes = confirm('Full upgrade?');
    if (yes) {
      nowupload();
    } else {
        return 0;
    } 
  }  

})

ipc.on('dispath', (event, arg) => { 
  nowpath = arg;
  let nowfw1=arg.split(/\/|\\/).pop()
  nowfw = 'v1.'+nowfw1.substring(13,nowfw1.length)
})

server.on('close',()=>{
  console.log('socket已關閉');
});

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

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
  setTimeout(function(){
    groupmsg(udpmsg);

  }, 3000 );  
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(9999, HOST);


ipc.on('asynchronous-reply', (event, arg) => {

  alert(arg);
})

function scanip(){
  udpmsg={};
  var bddgram = require("dgram");
  var client = bddgram.createSocket('udp4');
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
  
  var message = Buffer.from('IPQUERY,0');
  client.send(message, 0, message.length, 10000, '255.255.255.255', function(err, bytes) {
    client.close();
  });
    
}

//scanip();

function vloop(idx)
{
  for(totle=idx; totle < body.length; totle++)
  {
    if(totle == 0){
      sendfw(totle);
    }
    else{
      if(totle%4 == 0)
      {
        sendfw(totle);
        totle = totle+1;
        break;
      }
      else
      {
        sendfw(totle);
      }
    }
  }
  
  if(totle >= body.length)
  {
    console.log('END')
    return 0;
  }
  else
  {
    setTimeout(function(){vloop(totle);},60000);        
  }
}

function sendfw(idx)
{
  document.getElementById(bodymac[idx]).className='device nows';
  ipc.send('uploadfw',body[idx],'admin','12345678',bodymac[idx],body.length);
}


ipc.on('loading-reply', (event, arg) => {
  document.getElementById('s'+arg).style.display='block';
})

ipc.on("upload-pro", (event, data) => {
  alert(`${data.host} "Upload progress hanlder triggered. Data: ${data.data}. Progress: ${JSON.stringify(data.progress)}`);
})
