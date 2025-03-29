const timeTracker = {
  startTracking: function (tabId) {
    const startTime = Date.now();
    chrome.storage.local.get(["tabData"], (result) => {
      const tabData = result.tabData || {};
      tabData[tabId] = { startTime, lastActiveTime: startTime };
      chrome.storage.local.set({ tabData });
    });
  },

  stopTracking: function (tabId) {
    const lastActiveTime = Date.now();
    chrome.storage.local.get(["tabData"], (result) => {
      const tabData = result.tabData || {};
      if (tabData[tabId]) {
        tabData[tabId].lastActiveTime = lastActiveTime;
        chrome.storage.local.set({ tabData });
      }
    });
  },

  getElapsedTime: function (tabId) {
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
};

export default timeTracker;
