chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ userPrefs: { selectedThemeId: "passive_aggressive", selectedIntensity: "level1" } });
});

chrome.tabs.onCreated.addListener((tab) => {
  // Handle tab creation logic
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Handle tab removal logic
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  // Handle tab activation logic
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Handle tab update logic
});

function startTracking(tabId) {
  const startTime = Date.now();
  chrome.storage.local.get(["tabData"], (result) => {
    const tabData = result.tabData || {};
    tabData[tabId] = { startTime, lastActiveTime: startTime };
    chrome.storage.local.set({ tabData });
  });
}

function stopTracking(tabId) {
  const lastActiveTime = Date.now();
  chrome.storage.local.get(["tabData"], (result) => {
    const tabData = result.tabData || {};
    if (tabData[tabId]) {
      tabData[tabId].lastActiveTime = lastActiveTime;
      chrome.storage.local.set({ tabData });
    }
  });
}

function getElapsedTime(tabId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["tabData"], (result) => {
      const tabData = result.tabData || {};
      if (tabData[tabId]) {
        const { startTime, lastActiveTime } = tabData[tabId];
        const elapsedTime = lastActiveTime - startTime;
        resolve(elapsedTime);
      } else {
        reject(new Error("Tab data not found"));
      }
    });
  });
}

function categorizeWebsite(url) {
  return new Promise((resolve, reject) => {
    fetch(chrome.runtime.getURL("data/websiteCategories.json"))
      .then((response) => response.json())
      .then((categories) => {
        for (const [category, sites] of Object.entries(categories)) {
          if (sites.some((site) => url.includes(site))) {
            resolve(category);
            return;
          }
        }
        resolve("Other");
      })
      .catch((error) => reject(error));
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "createNewGroup") {
    chrome.tabs.group({ tabIds: message.tabIds }, (groupId) => {
      sendResponse({ groupId });
    });
    return true;
  }
});
