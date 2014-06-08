var LOGIN_URL = "https://www.google.com/accounts/ClientLogin";
var authToken;
var token;
var xmlHttp;
var timer;
var startTime;
var stopTime;
var online_status;
var rel;
var timerRunning;

function SettingsClosed(event){
  if(event.closeAction == event.Action.commit){
    startAuth();
  }
}

rel = '100';
timerRunning = 0;

System.Gadget.settingsUI = "settings.html";
System.Gadget.onSettingsClosed = SettingsClosed;
