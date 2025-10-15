/**
 * FILE: background.ts
 *
 * WHAT: Chrome extension background service worker
 *
 * WHY: Handles extension lifecycle, command shortcuts, and keeps extension alive
 *
 * HOW DATA FLOWS:
 *   1. Extension installed → initialize()
 *   2. Extension starts → initialize()
 *   3. User presses Cmd+Shift+L → closeRandomTab()
 *   4. Commands forward to TabManager
 *
 * SEAMS:
 *   IN: Chrome extension events
 *   OUT: TabManager (via bootstrap)
 *
 * GENERATED: 2025-10-13
 */

import { initializeExtension, getExtensionContext } from './bootstrap';

/**
 * Initialize extension when service worker starts
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[TabbyMcTabface] Extension starting up...');
  const result = await initializeExtension();
  
  if (result.ok) {
    console.log('[TabbyMcTabface] Ready!');
  } else {
    console.error('[TabbyMcTabface] Initialization failed:', result.error);
  }
});

/**
 * Initialize extension when installed
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[TabbyMcTabface] Installed:', details.reason);
  
  const result = await initializeExtension();
  
  if (result.ok) {
    console.log('[TabbyMcTabface] Ready!');
      
      // Show welcome notification on first install
      if (details.reason === 'install') {
        const context = getExtensionContext();
        if (context) {
          await context.chromeNotificationsAPI.create({
            type: 'basic',
            title: 'TabbyMcTabface Installed',
            message: 'Your tabs are now under passive-aggressive management. Try Cmd+Shift+L to close a random tab!',
            iconUrl: 'icons/icon128.png'
          });
        }
      }
  } else {
    console.error('[TabbyMcTabface] Initialization failed:', result.error);
  }
});

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[TabbyMcTabface] Command received:', command);
  
  const context = getExtensionContext();
  if (!context) {
    console.error('[TabbyMcTabface] Extension not initialized');
    return;
  }

  switch (command) {
    case 'feeling_lucky': {
      // Close random tab (Cmd+Shift+L)
      const result = await context.tabManager.closeRandomTab();
      
      if (result.ok) {
        console.log('[TabbyMcTabface] Closed tab:', result.value.closedTabTitle);
        // Humor notification already sent by TabManager
      } else {
        console.error('[TabbyMcTabface] Failed to close random tab:', result.error);
        
        // Show error notification
        await context.chromeNotificationsAPI.create({
          type: 'basic',
          title: 'TabbyMcTabface',
          message: result.error.details,
          iconUrl: 'icons/icon128.png'
        });
      }
      break;
    }
    
    default:
      console.warn('[TabbyMcTabface] Unknown command:', command);
  }
});

/**
 * Handle messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TabbyMcTabface] Message received:', message);
  
  const context = getExtensionContext();
  if (!context) {
    sendResponse({ error: 'Extension not initialized' });
    return;
  }

  // Handle async operations
  (async () => {
    try {
      switch (message.action) {
        case 'createGroup': {
          const result = await context.tabManager.createGroup(
            message.groupName,
            message.tabIds
          );
          sendResponse({ result: result });
          break;
        }
        
        case 'closeRandomTab': {
          const result = await context.tabManager.closeRandomTab(message.options);
          sendResponse({ result: result });
          break;
        }
        
        case 'getAllGroups': {
          const result = await context.tabManager.getAllGroups();
          sendResponse({ result: result });
          break;
        }
        
        case 'getBrowserContext': {
          const result = await context.tabManager.getBrowserContext();
          sendResponse({ result: result });
          break;
        }
        
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('[TabbyMcTabface] Message handler error:', error);
      sendResponse({ error: String(error) });
    }
  })();
  
  // Return true to indicate async response
  return true;
});

console.log('[TabbyMcTabface] Background service worker loaded');
