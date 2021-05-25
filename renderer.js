const ipc =  require('electron').ipcRenderer;
var nowfw = 'v1.28_682';
document.getElementById('progid').style.display='none';
/************************************ */
ipc.on('rescan', (event, arg) => {
  ipc.send('UDPGO');
});

/******************************* */
function locs(d,event){
  d.style.position = "absolute";
  d.style.left = (event.clientX) +'px';
  d.style.top = (event.clientY-20)+'px';
  d.style.display="block";
}

/**************generate scan grouplist and click event****** */
ipc.on('groupmsg', (event, arg) => {
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
   "<div id='updatefw1' class='butt1'> ⬇️firmware</div>"+
   "<div id='clsselid1' class='butt1'>✔️Close</div>";
      document.getElementById('updatefw1').addEventListener('click', function (event1) {
        var vid = event1.target.previousSibling.innerText; 
        var prd1 = document.getElementById(vid).innerHTML.split('<br>')[1].split(':')[0];
        console.log(prd1);
        ipc.send('uploadfw',prd1,1);
      });
      document.getElementById('clsselid1').addEventListener('click', function (event1) {
        selid.style.display="none";
      });
   })
  }
 });

function nowupload(){
  var listT = document.getElementsByClassName('device');
  for(var s=0; s < listT.length; s++)
  {
    var openx = listT[s].textContent;
    var vd = openx.split(' ');
    var prd = vd[2].split(':')[0];
    var fw = vd[4];

    ipc.send('uploadfw',prd,listT.length);
  }
}

/**************display menu**************************************************** */
ipc.on('dispscan', (event, arg) => {
  document.getElementById('grouplist').style.display='none';
  document.getElementById('progid').style.display='block';
  ipc.send('UDPGO');
})

ipc.on('dispupdate', (event, arg) => {
  
  nowupload();
})


