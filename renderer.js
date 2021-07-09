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
var nowpath1='';
var nowfw = 'v1.28_682';



/******************************* */
function nowupload(px){
    var listT = document.getElementsByClassName('dev_url');
	var listT1 = document.getElementsByClassName('dev_mac');
	var listT2 = document.getElementsByClassName('dev_ver');
	
    for(var s=0; s < listT.length; s++)
    {
      
      var openx = listT[s].innerText;
	    var macd = listT1[s].innerText;
	    var fw = listT2[s].innerText;
      var prd = openx.split(':')[0];

      if(px == 0)
      {
        if(fw != nowfw)
        {
          body[s]=prd;
          bodymac[s]=macd;
        }
        else
        {
          body[s]='';
          bodymac[s]='';
        }
      }
      else if(px == 1)
      {
        body[s]=prd;
        bodymac[s]=macd;
      }


      
    }
    totle = 0;
    body = body.filter(el => el);
    bodymac = bodymac.filter(el => el);
    vloop(0,px);
}



/**************display menu**************************************************** */
ipc.on('dispscan', (event, arg) => {

	var msg = Buffer.from('IPQUERY,0');
	send_brocast(msg);

})

ipc.on('dispupdate', (event, arg) => { 

	if(arg == 0)
	{
		if(nowpath == ''){
		alert('No File, Firmware->Open File');
		}
		else{
			var yes = confirm('Full upgrade?');
			if (yes) {
			  nowupload(arg);
			} else {
				return 0;
			} 
		}		
	}
	else if(arg == 1)
	{
		if(nowpath1 == ''){
			alert('No File, Firmware->Open File');
		}
		else{
			var yes = confirm('Full upgrade?');
			if (yes) {
			  nowupload(arg);
			} else {
				return 0;
			} 
		}		
	}
})


ipc.on('dispath', (event, arg) => { 
  nowpath = arg;
  let nowfw2=arg.split(/\/|\\/).pop()
  console.log(nowfw2.substring(0,11))
  if(nowfw2.substring(0,11) == 'root_uImage')
  {
    nowfw = 'v1.'+nowfw2.substring(13,nowfw2.length)
  }
  else
  {
    alert('File name error');
  }
})

ipc.on('dispath1', (event, arg) => { 
  nowpath1 = arg;
  let nowfw3=arg.split(/\/|\\/).pop()
  console.log(nowfw3.substring(0,5))
  if(nowfw3.substring(0,5) == 'uboot')
  {
    nowfw1 = nowfw3;
  }
  else
  {
    alert('File name error');
  }  
  
})

ipc.on('asynchronous-reply', (event, arg) => {

  alert(arg);
})


function vloop(idx,idx1)
{
  for(totle=idx; totle < body.length; totle++)
  {
    if(totle == 0){
      sendfw(totle,idx1);
    }
    else{
      if(totle%4 == 0)
      {
        sendfw(totle,idx1);
        totle = totle+1;
        break;
      }
      else
      {
        sendfw(totle,idx1);
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
    setTimeout(function(){vloop(totle,idx1);},70000);        
  }
}


function sendfw(idx,idx1)
{

	if(idx1 == '0')
	{
		ipc.send('uploadfw',body[idx],'admin','12345678',bodymac[idx],body.length,'/cgi-bin/upload.cgi','0');
	}
	else
	{
		ipc.send('uploadfw',body[idx],'admin','12345678',bodymac[idx],body.length,'/cgi-bin/upload_bootloader.cgi','1');
	}
}



ipc.on('loading-reply', (event, arg) => {
  
})

ipc.on("upload-pro", (event, data) => {
  alert(`${data.host} "Upload progress hanlder triggered. Data: ${data.data}. Progress: ${JSON.stringify(data.progress)}`);
})

