function createNewGroup(tabIds) {
  return new Promise((resolve, reject) => {
    chrome.tabs.group({ tabIds }, (groupId) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(groupId);
      }
    });
  });
}

export { createNewGroup };
