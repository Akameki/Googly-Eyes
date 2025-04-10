chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "enable") {
    // chrome.action.setBadgeText({ tabId: message.tabId, text: "💤" });
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      files: ["src/ml5.min.js", "src/content.js"]
    });
  } else if (message.action === "badgeOff") {
    // chrome.action.setBadgeText({ tabId: message.tabId, text: "💤" });
  } else if (message.action === "badgeOn") {
    // chrome.action.setBadgeText({ tabId: message.tabId, text: "👁️👁️" });
  }
});

// Clear tab's selection when reloaded
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    chrome.storage.session.remove([`tab_${tabId}`]);
  }
});