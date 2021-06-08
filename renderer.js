const ipc =  require('electron').ipcRenderer;
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const HOST = require("ip").address();

var totle=0;
var body=[];
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
    '</div> '+devinfo.name+'<br> '+devinfo.ip+'<br>'+' DHCP:'+devinfo.dhcp+'<br> ver'+devinfo.ver+'</div>';
   }

   for (var mac in arg) { groupinfo=groupinfo+devicehtml(arg[mac]);}
   document.getElementById("grouplist").innerHTML=groupinfo+'</div><div id="selscanid" class="selid"></div>';
   for (var mac in arg) 
   {  
     document.getElementById(mac).addEventListener('click', function (event2) {
     
   selid=document.getElementById("selscanid");

   locs(selid,event2);
   selid.innerHTML="<div id='macid1'>"+event2.target.id+"</div>"+
   "<div id='openweb1' class='butt1'> ⬇️WEB</div>"+
   "<div id='updatefw1' class='butt1'> ⬇️firmware</div>"+
   "<div id='clsselid1' class='butt1'>✔️Close</div>";
      document.getElementById('openweb1').addEventListener('click', function (event3) {
        var vid1 = event3.target.previousSibling.innerText; 
        var ip1 = document.getElementById(vid1).innerHTML.split('<br>')[1].split(':')[0].trim();
        var prd1 = ip1.trim(); 
        require("electron").shell.openExternal('http://'+prd1);      
        selid.style.display="none";
      });   
      document.getElementById('updatefw1').addEventListener('click', function (event1) {
        console.log(nowpath);
        if(nowpath == ''){
          alert('No File, Firmware->Open File');
        }
        else{
          var vid2 = event1.target.previousSibling.previousSibling.innerText;
          var ip2 = document.getElementById(vid2).innerHTML.split('<br>')[1].split(':')[0];
          console.log(ip2);
          var prd2 = ip2.trim();       
          var yes = confirm('Firmware upgrade?');
          if (yes) {
            document.getElementById(vid2).className='device nows';
           ipc.send('uploadfw',prd2,'admin','12345678');
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
    var listT = document.getElementsByClassName('device');

    for(var s=0; s < listT.length; s++)
    {
      listT[s].className='device nows';
      var openx = listT[s].textContent;
      var vd = openx.split(' ');
      var prd = vd[2].split(':')[0];
      var fw = vd[4];      
      body[s]=prd;     
    }
    totle = 0;
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

scanip();

function vloop(idx)
{
  for(totle=idx; totle < body.length; totle++)
  {
    if(totle == 0){
      ipc.send('uploadfw',body[totle],'admin','12345678');
    }
    else{
      if(totle%4 == 0)
      {
        ipc.send('uploadfw',body[totle],'admin','12345678');
        totle = totle+1;
        break;
      }
      else
      {
        ipc.send('uploadfw',body[totle],'admin','12345678');
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

ipc.on('inpfwver', (event,arg) =>  {
  
  var fwname = prompt('Please enter the version');

  //ipc.send('re-inpfwver', fwname)

});
