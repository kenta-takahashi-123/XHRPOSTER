var myIndexURL = "chrome-extension://"+location.host+"/index.html";
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url: myIndexURL});
});