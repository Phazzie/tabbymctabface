document.addEventListener("DOMContentLoaded", () => {
  const quipElement = document.getElementById("quip");
  const createGroupButton = document.getElementById("create-group");

  // Request current commentary from background
  chrome.runtime.sendMessage({ action: "getCurrentCommentary" }, (response) => {
    if (response && response.commentary) {
      quipElement.textContent = response.commentary;
    } else {
      quipElement.textContent = "No commentary available.";
    }
  });

  // Handle create group button click
  createGroupButton.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const tabIds = tabs.map((tab) => tab.id);
      chrome.runtime.sendMessage({ action: "createNewGroup", tabIds }, (response) => {
        if (response && response.groupId) {
          console.log(`New group created with ID: ${response.groupId}`);
        } else {
          console.error("Failed to create new group.");
        }
      });
    });
  });

  // Apply theme-specific styles
  chrome.storage.local.get(["userPrefs"], (result) => {
    const { selectedThemeId } = result.userPrefs || {};
    if (selectedThemeId) {
      const themeCssPath = `themes/${selectedThemeId}/styles.css`;
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = themeCssPath;
      document.head.appendChild(linkElement);
    }
  });
});
