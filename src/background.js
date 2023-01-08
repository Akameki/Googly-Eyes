// start each tab with badge "off"

// when clicked, switch to "👁️👁️" and run face-api.min.js and content.js
// when clicked while on, switch to "💤" and send message to content.js to pause
// when clocked while "💤", switch to "👁️👁️" and send message to content.js to resume

chrome.action.onClicked.addListener((tab) => {
  chrome.action.getBadgeText({ tabId: tab.id }, function(result) {
    if (result === "👁️👁️") {
      chrome.action.setBadgeText({ tabId: tab.id, text: "💤" });
      chrome.tabs.sendMessage(tab.id, {enabled: false});
    } else if (result === "💤") {
      chrome.action.setBadgeText({ tabId: tab.id, text: "👁️👁️" });
      chrome.tabs.sendMessage(tab.id, {enabled: true});
    } else { // first time
      chrome.action.setBadgeText({ tabId: tab.id, text: "👁️👁️" });
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/ml5.min.js", "src/content.js"]
      });
    }
  });
});