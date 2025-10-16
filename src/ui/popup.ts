/**
 * FILE: popup.ts
 *
 * WHAT: Type-safe popup UI controller for TabbyMcTabface extension
 *
 * WHY: Provides strongly-typed user interface for tab management features.
 *      Eliminates runtime errors through compile-time type checking.
 *
 * HOW DATA FLOWS:
 *   1. User clicks button in popup
 *   2. Send typed message to background script (SEAM-UI-01)
 *   3. Background script calls TabManager with proper contracts
 *   4. Result<T, E> returned to popup
 *   5. Update UI with type-safe result handling
 *
 * SEAMS:
 *   OUT: Popup → Background (SEAM-UI-01: chrome.runtime.sendMessage)
 *
 * CONTRACT: Popup UI Controller v1.0.0
 * GENERATED: 2025-01-16
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Tab statistics displayed in popup
 */
interface TabStats {
  tabCount: number;
  groupCount: number;
  quipCount: number;
}

/**
 * Browser context returned from background
 */
interface BrowserContext {
  tabCount: number;
  groupCount: number;
  tabs: chrome.tabs.Tab[];
  groups: chrome.tabGroups.TabGroup[];
}

/**
 * Message types sent to background script
 */
type BackgroundMessage =
  | { action: 'closeRandomTab' }
  | { action: 'createGroup'; groupName: string; tabIds: number[] }
  | { action: 'getBrowserContext' };

/**
 * Response from background script
 */
interface BackgroundResponse<T = unknown> {
  result?: {
    ok: boolean;
    value?: T;
    error?: {
      type: string;
      details: string;
    };
  };
  error?: string;
}

/**
 * Result from closeRandomTab action
 */
interface CloseRandomTabResult {
  closedTabTitle: string;
  closedTabId: number;
  quipDelivered: boolean;
}

/**
 * Result from createGroup action
 */
interface CreateGroupResult {
  groupId: number;
  groupName: string;
  tabCount: number;
  quipDelivered: boolean;
}

/**
 * Status message types
 */
type StatusType = 'success' | 'error' | 'warning' | 'loading' | 'info';

// ========================================
// STATE
// ========================================

let allTabs: chrome.tabs.Tab[] = [];
let selectedTabIds: number[] = [];

// ========================================
// DOM ELEMENTS (Type-Safe)
// ========================================

const feelingLuckyBtn = document.getElementById('feelingLuckyBtn') as HTMLButtonElement;
const createGroupBtn = document.getElementById('createGroupBtn') as HTMLButtonElement;
const groupCreator = document.getElementById('groupCreator') as HTMLDivElement;
const groupNameInput = document.getElementById('groupNameInput') as HTMLInputElement;
const tabList = document.getElementById('tabList') as HTMLDivElement;
const confirmGroupBtn = document.getElementById('confirmGroupBtn') as HTMLButtonElement;
const cancelGroupBtn = document.getElementById('cancelGroupBtn') as HTMLButtonElement;
const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
const tabCountEl = document.getElementById('tabCount') as HTMLSpanElement;
const groupCountEl = document.getElementById('groupCount') as HTMLSpanElement;
const quipCountEl = document.getElementById('quipCount') as HTMLSpanElement;

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize popup
 *
 * DATA IN: void
 * DATA OUT: Promise<void>
 *
 * FLOW:
 *   1. Load and display current stats
 *   2. Setup event listeners for all buttons
 *   3. Ready for user interaction
 */
async function init(): Promise<void> {
  // Load stats
  await updateStats();

  // Setup event listeners
  feelingLuckyBtn.addEventListener('click', handleFeelingLucky);
  createGroupBtn.addEventListener('click', handleCreateGroup);
  confirmGroupBtn.addEventListener('click', handleConfirmGroup);
  cancelGroupBtn.addEventListener('click', handleCancelGroup);
}

// ========================================
// STATS MANAGEMENT
// ========================================

/**
 * Update stats display
 *
 * DATA IN: void
 * DATA OUT: Promise<void>
 *
 * SEAM: SEAM-UI-01 (Popup → Background)
 *
 * FLOW:
 *   1. Request browser context from background
 *   2. Extract tab count, group count
 *   3. Update DOM elements with counts
 *
 * ERRORS:
 *   - Logs to console (non-critical, stats just won't update)
 */
async function updateStats(): Promise<void> {
  try {
    const response = await sendMessage<BrowserContext>({ action: 'getBrowserContext' });

    if (response.result?.ok && response.result.value) {
      const context = response.result.value;
      tabCountEl.textContent = String(context.tabCount);
      groupCountEl.textContent = String(context.groupCount);

      // TODO: Add quip count to BrowserContext
      quipCountEl.textContent = '???';
    }
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

// ========================================
// FEELING LUCKY HANDLER
// ========================================

/**
 * Handle "I'm Feeling Lucky" button click
 *
 * DATA IN: void (button click event)
 * DATA OUT: Promise<void>
 *
 * SEAM: SEAM-UI-01 (Popup → Background)
 *
 * FLOW:
 *   1. Disable button, show loading status
 *   2. Send closeRandomTab message to background
 *   3. Handle result (success or error)
 *   4. Update stats if successful
 *   5. Re-enable button
 *
 * ERRORS:
 *   - Display user-friendly error message
 *   - Re-enable button for retry
 */
async function handleFeelingLucky(): Promise<void> {
  try {
    setStatus('Closing random tab...', 'loading');
    feelingLuckyBtn.disabled = true;

    const response = await sendMessage<CloseRandomTabResult>({ action: 'closeRandomTab' });

    if (response.result?.ok && response.result.value) {
      const result = response.result.value;
      setStatus(`Closed: ${result.closedTabTitle}`, 'success');
      await updateStats();
    } else if (response.result?.error) {
      setStatus(`Error: ${response.result.error.details}`, 'error');
    } else {
      setStatus(`Error: ${response.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    setStatus('Failed to close tab', 'error');
    console.error(error);
  } finally {
    feelingLuckyBtn.disabled = false;
  }
}

// ========================================
// GROUP CREATION HANDLERS
// ========================================

/**
 * Handle "Create Tab Group" button click - show group creator UI
 *
 * DATA IN: void (button click event)
 * DATA OUT: Promise<void>
 *
 * FLOW:
 *   1. Query current window tabs via Chrome API
 *   2. Populate tab list with checkboxes
 *   3. Show group creator form
 *   4. Hide main action buttons
 *
 * ERRORS:
 *   - Display error if tab query fails
 */
async function handleCreateGroup(): Promise<void> {
  try {
    // Query current window tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    allTabs = tabs;
    selectedTabIds = [];

    // Populate tab list
    tabList.innerHTML = '';
    tabs.forEach((tab) => {
      const tabItem = createTabItem(tab);
      tabList.appendChild(tabItem);
    });

    // Show group creator
    groupCreator.classList.remove('hidden');
    groupNameInput.value = '';
    groupNameInput.focus();

    // Hide main actions
    createGroupBtn.style.display = 'none';
    feelingLuckyBtn.style.display = 'none';
  } catch (error) {
    setStatus('Failed to load tabs', 'error');
    console.error(error);
  }
}

/**
 * Create a tab list item with checkbox
 *
 * DATA IN: Chrome tab object
 * DATA OUT: HTMLDivElement (tab item)
 *
 * FLOW:
 *   1. Create checkbox and info elements
 *   2. Setup change handler for selection tracking
 *   3. Add click-to-toggle interaction
 *   4. Return complete tab item element
 */
function createTabItem(tab: chrome.tabs.Tab): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'tab-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tab-checkbox';
  checkbox.id = `tab-${tab.id}`;
  checkbox.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.checked && tab.id !== undefined) {
      selectedTabIds.push(tab.id);
      item.classList.add('selected');
    } else if (tab.id !== undefined) {
      selectedTabIds = selectedTabIds.filter((id) => id !== tab.id);
      item.classList.remove('selected');
    }
  });

  const info = document.createElement('div');
  info.className = 'tab-info';

  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || 'Untitled';

  const url = document.createElement('div');
  url.className = 'tab-url';
  try {
    if (tab.url) {
      const urlObj = new URL(tab.url);
      url.textContent = urlObj.hostname;
    } else {
      url.textContent = 'No URL';
    }
  } catch {
    url.textContent = tab.url || 'Invalid URL';
  }

  info.appendChild(title);
  info.appendChild(url);

  item.appendChild(checkbox);
  item.appendChild(info);

  // Click anywhere to toggle
  item.addEventListener('click', (event) => {
    if (event.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  });

  return item;
}

/**
 * Handle group creation confirmation
 *
 * DATA IN: void (button click event)
 * DATA OUT: Promise<void>
 *
 * SEAM: SEAM-UI-01 (Popup → Background)
 *
 * FLOW:
 *   1. Validate group name (1-50 chars)
 *   2. Validate tab selection (at least one tab)
 *   3. Send createGroup message to background
 *   4. Handle result (success or error)
 *   5. Hide group creator, update stats
 *
 * ERRORS:
 *   - InvalidGroupName: Show error, keep form open
 *   - NoTabsSelected: Show error, keep form open
 *   - ChromeAPIFailure: Show error, allow retry
 */
async function handleConfirmGroup(): Promise<void> {
  const groupName = groupNameInput.value.trim();

  // Validate group name
  if (!groupName) {
    setStatus('Group name cannot be empty', 'error');
    return;
  }

  if (groupName.length > 50) {
    setStatus('Group name too long (max 50 chars)', 'error');
    return;
  }

  // Validate tab selection
  if (selectedTabIds.length === 0) {
    setStatus('Please select at least one tab', 'error');
    return;
  }

  try {
    setStatus('Creating group...', 'loading');
    confirmGroupBtn.disabled = true;

    const response = await sendMessage<CreateGroupResult>({
      action: 'createGroup',
      groupName,
      tabIds: selectedTabIds,
    });

    if (response.result?.ok && response.result.value) {
      const result = response.result.value;
      setStatus(`Group "${result.groupName}" created with ${result.tabCount} tabs!`, 'success');

      // Hide group creator
      handleCancelGroup();

      // Update stats
      await updateStats();
    } else if (response.result?.error) {
      setStatus(`Error: ${response.result.error.details}`, 'error');
    } else {
      setStatus(`Error: ${response.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    setStatus('Failed to create group', 'error');
    console.error(error);
  } finally {
    confirmGroupBtn.disabled = false;
  }
}

/**
 * Handle group creation cancellation
 *
 * DATA IN: void (button click event)
 * DATA OUT: void
 *
 * FLOW:
 *   1. Hide group creator form
 *   2. Show main action buttons
 *   3. Clear selection state
 */
function handleCancelGroup(): void {
  groupCreator.classList.add('hidden');
  createGroupBtn.style.display = '';
  feelingLuckyBtn.style.display = '';
  selectedTabIds = [];
}

// ========================================
// STATUS MESSAGING
// ========================================

/**
 * Set status message with type styling
 *
 * DATA IN: Message text, status type
 * DATA OUT: void
 *
 * FLOW:
 *   1. Update status text content
 *   2. Apply type-specific CSS class
 *   3. Update border color
 *   4. Trigger entrance animation
 */
function setStatus(message: string, type: StatusType = 'info'): void {
  const statusText = statusMessage.querySelector('.status-text') as HTMLDivElement;
  statusText.textContent = message;

  // Remove all type classes
  statusMessage.classList.remove('success', 'error', 'warning', 'loading', 'info');

  // Add current type class
  statusMessage.classList.add(type);

  // Update border color based on type
  const colors: Record<StatusType, string> = {
    success: '#2ecc71',
    error: '#e74c3c',
    warning: '#f39c12',
    loading: '#4a90e2',
    info: '#4a90e2',
  };

  statusMessage.style.borderLeftColor = colors[type];

  // Add entrance animation
  statusMessage.style.animation = 'none';
  setTimeout(() => {
    statusMessage.style.animation = '';
  }, 10);
}

// ========================================
// MESSAGING UTILITY
// ========================================

/**
 * Send type-safe message to background script
 *
 * DATA IN: Typed background message
 * DATA OUT: Promise<BackgroundResponse<T>>
 *
 * SEAM: SEAM-UI-01 (Popup → Background via chrome.runtime.sendMessage)
 *
 * FLOW:
 *   1. Send message via chrome.runtime.sendMessage
 *   2. Handle chrome.runtime.lastError
 *   3. Return typed response
 *
 * ERRORS:
 *   - Rejects promise with chrome.runtime.lastError
 *
 * @param message - Typed message to send
 * @returns Promise resolving to typed response
 */
function sendMessage<T = unknown>(message: BackgroundMessage): Promise<BackgroundResponse<T>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse<T>) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// ========================================
// INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
