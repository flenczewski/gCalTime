function getPropertyFrom(body, key) {
    var sub1 = body.substring(body.indexOf(key + "=") + key.length + 1);
    return sub1.substring(0, sub1.indexOf("\n"));
}

function startAuth(){
  setStatus("connecting...");
  var liveUpdate_status = liveUpdate();
  
  if(liveUpdate_status==12007 || liveUpdate_status==12029 || liveUpdate_status==12009){
    offline();
    return false;
  }
  else{
    online();
  }
  
  if(liveUpdate_status==999999){
    /* updateAvailable(); */
  }
  
  if(System.Gadget.Settings.read("gMail")!='' && System.Gadget.Settings.read("gPassword")!='' &&  System.Gadget.Settings.read("gCalURL")!=''){
    auth(System.Gadget.Settings.read("gMail"), System.Gadget.Settings.read("gPassword"));
  }
  else{
    setStatus('Please edit settings.');
  }
}

function auth(emailAddress, password) {
  setStatus("login to Google...");
  xmlHttp = new XMLHttpRequest();
    
  var postData =
          "accountType=HOSTED_OR_GOOGLE&Email=" + emailAddress
        + "&Passwd=" + password
        + "&service=cl"
        + "&source=gCalTasks-1.0";
  msg("stringa post preparata");
    xmlHttp.open("POST", LOGIN_URL, false);
    xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp.send(postData);
  msg("richiesta inviata");
  
  if (xmlHttp.status == 200) {
        setStatus("connected.");
        authToken = getPropertyFrom(xmlHttp.responseText, "Auth");
        token=authToken;
        msg('risposta: ' + xmlHttp.responseText);
        document.getElementById('taskTitle').disabled=false;
        if(timerRunning!=1){
          document.getElementById('startButton').disabled=false;
          document.getElementById('stopButton').disabled=true;
          document.getElementById('cancelButton').disabled=true;
          }
        else{
          document.getElementById('startButton').disabled=true;
          document.getElementById('stopButton').disabled=false;
          document.getElementById('cancelButton').disabled=false;
        }
        return true;
  } else if (xmlHttp.status == 403) {
        setStatus('<span style="color:#ff0000">login failed: check e-mail/password</span>');
        document.getElementById('taskTitle').disabled=true;
        document.getElementById('startButton').disabled=true;
        document.getElementById('stopButton').disabled=true;
        document.getElementById('cancelButton').disabled=true;
        return false;
  } else {
        msg("HTTP " + xmlHttp.status + " " + xmlHttp.statusText + ": " + getPropertyFrom(xmlHttp.responseText, "Error"));
        return false;
  }
}

function makeAuthRequest_xml(url, xmlDoc) {
  xmlHttp.open("POST", url, false);
  xmlHttp.setRequestHeader("Authorization", "GoogleLogin auth=" + authToken);
  xmlHttp.setRequestHeader("Content-Type", "application/atom+xml");
  xmlHttp.send('<?xml version="1.0" ?>' + xmlDoc);
  if(xmlHttp.status==200 || xmlHttp.status==201){
    setStatus('Event sent.');
  }
  else{
    setStatus('ERR ' + xmlHttp.status + '. Try to stop again.');
    document.getElementById('stopButton').disabled=false;
    document.getElementById('startButton').disabled=true;
    document.getElementById('cancelButton').disabled=false;
    }
  return{
    responseText: xmlHttp.responseText,
    status: xmlHttp.status
  }
}

function createXMLevent(time_start, time_end){
msg('Creazione dell\'evento...');
var xmlData = "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005'>";
xmlData += "  <category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/g/2005#event'></category>";
// xmlData += "  <title type='text'>" + document.getElementById('taskTitle').value + "</title>";
xmlData += "  <title type='text'>" + timerValue + "</title>";
xmlData += "  <gd:transparency value='http://schemas.google.com/g/2005#event.opaque'></gd:transparency>";
xmlData += "  <gd:eventStatus value='http://schemas.google.com/g/2005#event.confirmed'></gd:eventStatus>";
xmlData += "  <gd:when startTime='" + formatToGcal(time_start) + "' endTime='" + formatToGcal(time_end) + "'></gd:when>";
xmlData += "</entry>";

return xmlData;
}

function startTimer(){
  if(timerRunning != 0) { return true; }
  startTime = System.Time.getLocalTime(System.Time.currentTimeZone);
//  setStatus(startTime);
  document.getElementById('startButton').disabled=true;
  document.getElementById('stopButton').disabled=false;
  document.getElementById('cancelButton').disabled=false;
  timer = setInterval("stopWatch(time(System.Time.getLocalTime(System.Time.currentTimeZone)-startTime))", 1000);
  timerRunning = 1;
  timerValue = document.getElementById('taskTitle').value ;
}

function stopTimer(){
  if(timerRunning != 1) { return true; }
  stopTime = System.Time.getLocalTime(System.Time.currentTimeZone);
  clearInterval(timer);
  document.getElementById('stopButton').disabled=true;
  document.getElementById('startButton').disabled=false;
  document.getElementById('cancelButton').disabled=true;
  setStatus('sending event to Google...');
  makeAuthRequest_xml('http://www.google.com/calendar/feeds/' + System.Gadget.Settings.read("gCalURL") + '/private/full', createXMLevent(startTime, stopTime));
  timerRunning = 0;
}

function cancelTimer(){
  stopTime = System.Time.getLocalTime(System.Time.currentTimeZone);
  clearInterval(timer);
  document.getElementById('stopButton').disabled=true;
  document.getElementById('startButton').disabled=false;
  document.getElementById('cancelButton').disabled=true;
  stopWatch('-:--:--:--');
}

function formatToGcal(strDate){
  var myDate = new Date(Date.parse(strDate));
  var myYear = myDate.getFullYear();
  var myMonth = leadingZero(myDate.getMonth()+1,2);
  var myDay = leadingZero(myDate.getDate(),2);
  var myHours = leadingZero(myDate.getHours(),2);
  var myMinutes = leadingZero(myDate.getMinutes(),2);
  var mySeconds = leadingZero(myDate.getSeconds(),2);
  
  var myTimeZone = myDate.getTimezoneOffset();
  var myTimeZone_sign = (myTimeZone + '').substring(0,1);
    if(myTimeZone_sign=='-'){
      myTimeZone_sign = '+';
    }
    else{
      myTimeZone_sign = '-';
    }
  var myTimeZone_hours = myDate.getTimezoneOffset()/60;
  if(myTimeZone_hours<0){ myTimeZone_hours = -myTimeZone_hours }
  myTimeZone_hours = leadingZero(myTimeZone_hours, 2);
  var myTimeZone_minutes = myDate.getTimezoneOffset()%60;
  if(myTimeZone_minutes<0){ myTimeZone_minutes = -myTimeZone_minutes }
  myTimeZone_minutes = leadingZero(myTimeZone_minutes, 2);
  return(myYear + '-' + myMonth + '-' + myDay + 'T' + myHours + ':' + myMinutes + ':' + mySeconds + myTimeZone_sign + myTimeZone_hours + ':' + myTimeZone_minutes);
}

function msg(string){
  document.getElementById('debug').innerHTML=string;
}

function setStatus(string){
    var message = '';
    if( System.Gadget.Settings.read("gCalName") ) {
        message = System.Gadget.Settings.read("gCalName") +': ';
    }
    document.getElementById('status').innerHTML=message + string;
}

function stopWatch(string){
  document.getElementById('stopWatch').innerHTML=string;
}

function liveUpdate(){
  /*
  xmlReq = new XMLHttpRequest();
  xmlReq.open("GET", 'http://www.raneri.it/liveupdate/gadget/gcaltasks.php?dummy=' + randomFromDate(), false);
  xmlReq.send(null);
  var status = xmlReq.status;
  
  if(status==200){
    if(xmlReq.responseText>rel){
      status = 999999;
    }
  }
  return status;
  */
}

function leadingZero(num,count){
  var numZeropad = num + '';
  while(numZeropad.length < count){
    numZeropad = "0" + numZeropad;
  }
  return numZeropad;
}

function two(x) {return ((x>9)?"":"0")+x}
function three(x) {return ((x>99)?"":"0")+((x>9)?"":"0")+x}

function time(ms) {
var sec = Math.floor(ms/1000)
ms = ms % 1000
t = three(ms)

var min = Math.floor(sec/60)
sec = sec % 60
t = two(sec)

var hr = Math.floor(min/60)
min = min % 60
t = two(min) + ":" + t

var day = Math.floor(hr/60)
hr = hr % 60
t = two(hr) + ":" + t
t = day + ":" + t

return t
}

function initializeTaskTitle(textInput){
if(textInput.value=='enter task title...'){
    textInput.value=''
  }
}

function online(){
  var blocker = document.getElementById('blocker');
  blocker.style.display='none';
  System.Gadget.settingsUI = "settings.html";
  setTimeout("checkStillOnline()", 30000);
}

function offline(){
  var blocker = document.getElementById('blocker');
  blocker.innerHTML = '<br /><br />Offline<br /><br /><a href="javascript:startAuth();"><img src="images/reload.png" onmouseover="this.src=\'images/reload_on.png\'" onmouseout="this.src=\'images/reload.png\'" alt="" /></a>';
  blocker.style.display='block';
  setStatus('no connection available.');
  System.Gadget.settingsUI = "";
  setTimeout("startAuth()", 30000);
}

function checkStillOnline(){
  /*
  var liveUpdate_status = liveUpdate();
  
  if(liveUpdate_status==12007 || liveUpdate_status==12029 || liveUpdate_status==12009){
    offline();
    return false;
  }
  else{
    setTimeout("checkStillOnline()", 30000);
  }
  */
}

function updateAvailable(){
    /*
  document.getElementById('update').innerHTML = 'New version: <a href="http://www.raneri.it/liveupdate/gadget/gcaltasks_lastrel.php" style="color:#000000">UPDATE NOW</a>';
  document.getElementById('update').style.background='#ff0000';
  */
}

function randomFromDate(){
  var Today = new Date();
  return Today.getTime();
}

function enterPress(e){
    var key=e.keyCode || e.which;
    if (key==13){
        stopTimer();
        startTimer();
    }
}
