var LOGIN_URL = "https://www.google.com/accounts/ClientLogin";
var authToken;
var token;
var xmlHttp;

System.Gadget.onSettingsClosing = SettingsClosing;

if(System.Gadget.Settings.read("gMail")!='' && System.Gadget.Settings.read("gPassword")!=''){
  gMail.value = System.Gadget.Settings.read("gMail");
  gPassword.value = System.Gadget.Settings.read("gPassword");
  var gCalList = System.Gadget.Settings.read("gCalList");
  if(gCalList!=''){
    gCalList = gCalList.split(',');
    if(gCalList.length>0){
      var temp = '';
      var temp_selected = false;
      for(k=0;k<gCalList.length;k++){
        temp = gCalList[k].split('::');
        document.getElementById('comboList').options[k] = new Option(temp[0], temp[1]);
        document.getElementById('comboList').value = System.Gadget.Settings.read("gCalURL");
      }
    }
  }
}

function SettingsClosing(event) {
  if (event.closeAction == event.Action.commit){
    System.Gadget.Settings.writeString("gMail", gMail.value);
    System.Gadget.Settings.writeString("gPassword", gPassword.value);
    System.Gadget.Settings.writeString("gCalURL", document.getElementById('comboList').value);

    var gCalList = System.Gadget.Settings.read("gCalList");
    if(gCalList!=''){
        gCalList = gCalList.split(',');
        if(gCalList.length>0){
          var temp = '';
          for(k=0;k<gCalList.length;k++){
            temp = gCalList[k].split('::');
            if(System.Gadget.Settings.read("gCalURL") == temp[1]) {
                System.Gadget.Settings.writeString("gCalName", temp[0]);
            }        
          }
        }
      }
  }
  event.cancel = false;
}

function startAuth(mode){
  System.Gadget.Settings.writeString("gMail", gMail.value);
  System.Gadget.Settings.writeString("gPassword", gPassword.value);
  
  if(System.Gadget.Settings.read("gMail")!='' && System.Gadget.Settings.read("gPassword")!=''){
    auth(System.Gadget.Settings.read("gMail"), System.Gadget.Settings.read("gPassword"), mode);
  }
  else{
    setStatus('Please edit settings.');
  }
}

function auth(emailAddress, password, mode) {
    setStatus("connecting...");
    xmlHttp = new XMLHttpRequest();
    
    var postData =
          "accountType=HOSTED_OR_GOOGLE&Email=" + emailAddress
        + "&Passwd=" + password
        + "&service=cl"
        + "&source=EelkeSpaak-TheCalendar-2.0";
    xmlHttp.open("POST", LOGIN_URL, false);
    xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlHttp.send(postData);
    if (xmlHttp.status == 200) {
        setStatus("connected.");
        authToken = getPropertyFrom(xmlHttp.responseText, "Auth");
        msg('risposta: ' + xmlHttp.responseText);
        if(mode=='list'){
          RetrieveCalendars();
        }
        return true;
    } else if (xmlHttp.status == 403) {
        setStatus('<span style="color:#ff0000">login failed: check e-mail/password</span>');
        return false;
    } else {
        msg("HTTP " + xmlHttp.status + " " + xmlHttp.statusText + ": " + getPropertyFrom(xmlHttp.responseText, "Error"));
        return false;
    }
}

function makeAuthRequest(url){
  xmlHttp.open("GET", url, false);
  xmlHttp.setRequestHeader("Authorization", "GoogleLogin auth=" + authToken);
  xmlHttp.send(null);
  xmlHttp.open("GET", url, false);
  xmlHttp.setRequestHeader("Authorization", "GoogleLogin auth=" + authToken);
  xmlHttp.send(null);
  if (xmlHttp.status == 200) {
    msg('xml caricato (esito:' + xmlHttp.status + ')');
    msg('risultato: ' + xmlHttp.responseText);
    doc = new ActiveXObject("Microsoft.XMLDOM");
    doc.async="false";
    doc.loadXML(xmlHttp.responseText);
    return doc;
    }
  else{
    setStatus('Error while retrieving calendars. (code '+ xmlHttp.status + '). Please retry.');
    return false;
  }
}

function RetrieveCalendars(){
  msg('invio richiesta...');
  var calendarDoc = makeAuthRequest('http://www.google.com/calendar/feeds/default/allcalendars/full');
  msg('parsing...');
  var calendarList = calendarDoc.selectNodes('/feed/entry');
  var gCalList = '';
  for(i=0;i<calendarList.length;i++){
    document.getElementById('comboList').options[i] = new Option(calendarList[i].selectSingleNode('title').childNodes[0].nodeValue, calendarList[i].selectSingleNode('id').childNodes[0].nodeValue.replace('http://www.google.com/calendar/feeds/default/allcalendars/full/',''));
    gCalList += calendarList[i].selectSingleNode('title').childNodes[0].nodeValue + '::' + calendarList[i].selectSingleNode('id').childNodes[0].nodeValue.replace('http://www.google.com/calendar/feeds/default/allcalendars/full/', '') + ',';
  }
  System.Gadget.Settings.writeString("gCalList", gCalList.substring(0, gCalList.length-1));
}

function msg(string){
  document.getElementById('debug').innerText=string;
}

function setStatus(string){
  document.getElementById('status').innerHTML=string;
}

function getPropertyFrom(body, key) {
    var sub1 = body.substring(body.indexOf(key + "=") + key.length + 1);
    return sub1.substring(0, sub1.indexOf("\n"));
}
