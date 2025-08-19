import themeEngine from './modules/themeEngine';
import { createNewGroup } from './modules/tabGrouper';
import { loadCategories, categorizeWebsite } from './modules/websiteCategorizer';
import * as timeTracker from './modules/timeTracker';

// --- Initialization ---

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default preferences on first install
    await themeEngine.saveUserPreferences({
      selectedThemeId: 'passive_aggressive',
      selectedIntensity: 'level1',
    });
  }
  // Load categories on install or update
  await loadCategories();
});

// --- Event Listeners ---

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) {
    timeTracker.startTracking(tab.id);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  timeTracker.startTracking(activeInfo.tabId);
  // In a more advanced version, we would stop tracking previous tabs.
  // For MVP, we'll keep it simple as per PRD.
});

chrome.tabs.onRemoved.addListener((tabId) => {
  timeTracker.cleanupTab(tabId);
});

// --- Trigger & Commentary Logic ---

async function getCommentaryForCurrentState(): Promise<string> {
  // This is a simplified example of trigger logic. A real implementation would be more complex.
  const tabs = await chrome.tabs.query({});

  // High Tab Count Trigger
  if (tabs.length > 15) {
    const quip = themeEngine.getQuip('highTabCount', { count: tabs.length });
    if (quip) return quip;
  }

  // Active Tab Triggers
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTabs.length > 0) {
    const activeTab = activeTabs[0];

    // Old Tab Trigger
    if (activeTab.id) {
      const elapsedTime = await timeTracker.getElapsedTime(activeTab.id);
      if (elapsedTime > 86400000) { // 24 hours
        const quip = themeEngine.getQuip('oldTab', { elapsedTimeMs: elapsedTime, url: activeTab.url });
        if (quip) return quip;
      }
    }

    // Category Visit Trigger
    if (activeTab.url) {
      const category = categorizeWebsite(activeTab.url);
      const quip = themeEngine.getQuip('categoryVisit', { category, url: activeTab.url });
      if (quip) return quip;
    }
  }

  // Default/Fallback message
  return themeEngine.getQuip('default', {}) || "What's on your mind?";
}


// --- Message Handling ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Return true to indicate you wish to send a response asynchronously
  if (message.action === 'getCurrentCommentary') {
    getCommentaryForCurrentState().then(sendResponse);
    return true;
  }

  if (message.action === 'createNewGroup') {
    // The popup sends the active tab ID, but a better implementation might group all tabs.
    // Following the popup's current flawed logic for now.
    if (message.tabIds && message.tabIds.length > 0) {
      createNewGroup(message.tabIds).then(groupId => {
        sendResponse({ success: true, groupId });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
  }

  if (message.action === 'getActiveThemeInfo') {
      const themeInfo = themeEngine.getActiveThemeInfo();
      sendResponse(themeInfo);
      return true;
  }

  if (message.action === 'getUserPreferences') {
      const prefs = themeEngine.getUserPreferences();
      sendResponse(prefs);
      return true;
  }

  if (message.action === 'saveUserPreferences') {
      themeEngine.saveUserPreferences(message.prefs).then(() => {
          sendResponse({success: true});
      });
      return true;
  }

  // Add other message handlers here as needed
});
