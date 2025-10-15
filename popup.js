/**
 * FILE: popup.js
 *
 * WHAT: Popup UI controller for TabbyMcTabface extension
 *
 * WHY: Provides user interface for tab management features
 *
 * HOW DATA FLOWS:
 *   1. User clicks button in popup
 *   2. Send message to background script
 *   3. Background script calls TabManager
 *   4. Result returned to popup
 *   5. Update UI with result
 *
 * SEAMS:
 *   OUT: Popup → Background (chrome.runtime.sendMessage)
 *
 * GENERATED: 2025-10-13
 */

// DOM Elements
const feelingLuckyBtn = document.getElementById('feelingLuckyBtn');
const createGroupBtn = document.getElementById('createGroupBtn');
const groupCreator = document.getElementById('groupCreator');
const groupNameInput = document.getElementById('groupNameInput');
const tabList = document.getElementById('tabList');
const confirmGroupBtn = document.getElementById('confirmGroupBtn');
const cancelGroupBtn = document.getElementById('cancelGroupBtn');
const statusMessage = document.getElementById('statusMessage');
const tabCountEl = document.getElementById('tabCount');
const groupCountEl = document.getElementById('groupCount');
const quipCountEl = document.getElementById('quipCount');

// State
let allTabs = [];
let selectedTabIds = [];

/**
 * Initialize popup
 */
async function init() {
  // Load stats
  await updateStats();
  
  // Setup event listeners
  feelingLuckyBtn.addEventListener('click', handleFeelingLucky);
  createGroupBtn.addEventListener('click', handleCreateGroup);
  confirmGroupBtn.addEventListener('click', handleConfirmGroup);
  cancelGroupBtn.addEventListener('click', handleCancelGroup);
}

/**
 * Update stats display
 */
async function updateStats() {
  try {
    // Get browser context
    const response = await sendMessage({ action: 'getBrowserContext' });
    
    if (response.result && response.result.ok) {
      const context = response.result.value;
      tabCountEl.textContent = context.tabCount;
      groupCountEl.textContent = context.groupCount;
      
      // Mock quip count for now (we'd need to add this to context)
      quipCountEl.textContent = '???';
    }
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

/**
 * Handle "I'm Feeling Lucky" click
 */
async function handleFeelingLucky() {
  try {
    setStatus('Closing random tab...', 'loading');
    feelingLuckyBtn.disabled = true;
    
    const response = await sendMessage({ action: 'closeRandomTab' });
    
    if (response.result && response.result.ok) {
      const result = response.result.value;
      setStatus(`Closed: ${result.closedTabTitle}`, 'success');
      await updateStats();
    } else if (response.result) {
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

/**
 * Handle "Create Tab Group" click - show group creator
 */
async function handleCreateGroup() {
  try {
    // Query current window tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    allTabs = tabs;
    selectedTabIds = [];
    
    // Populate tab list
    tabList.innerHTML = '';
    tabs.forEach(tab => {
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
 * Create a tab list item
 */
function createTabItem(tab) {
  const item = document.createElement('div');
  item.className = 'tab-item';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tab-checkbox';
  checkbox.id = `tab-${tab.id}`;
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedTabIds.push(tab.id);
      item.classList.add('selected');
    } else {
      selectedTabIds = selectedTabIds.filter(id => id !== tab.id);
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
    const urlObj = new URL(tab.url);
    url.textContent = urlObj.hostname;
  } catch {
    url.textContent = tab.url;
  }
  
  info.appendChild(title);
  info.appendChild(url);
  
  item.appendChild(checkbox);
  item.appendChild(info);
  
  // Click anywhere to toggle
  item.addEventListener('click', (e) => {
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    }
  });
  
  return item;
}

/**
 * Handle group creation confirmation
 */
async function handleConfirmGroup() {
  const groupName = groupNameInput.value.trim();
  
  // Validate
  if (!groupName) {
    setStatus('Group name cannot be empty', 'error');
    return;
  }
  
  if (groupName.length > 50) {
    setStatus('Group name too long (max 50 chars)', 'error');
    return;
  }
  
  if (selectedTabIds.length === 0) {
    setStatus('Please select at least one tab', 'error');
    return;
  }
  
  try {
    setStatus('Creating group...', 'loading');
    confirmGroupBtn.disabled = true;
    
    const response = await sendMessage({
      action: 'createGroup',
      groupName,
      tabIds: selectedTabIds
    });
    
    if (response.result && response.result.ok) {
      const result = response.result.value;
      setStatus(`Group "${result.groupName}" created with ${result.tabCount} tabs!`, 'success');
      
      // Hide group creator
      handleCancelGroup();
      
      // Update stats
      await updateStats();
    } else if (response.result) {
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
 */
function handleCancelGroup() {
  groupCreator.classList.add('hidden');
  createGroupBtn.style.display = '';
  feelingLuckyBtn.style.display = '';
  selectedTabIds = [];
}

/**
 * Set status message
 */
function setStatus(message, type = 'info') {
  const statusText = statusMessage.querySelector('.status-text');
  statusText.textContent = message;
  
  // Remove all type classes
  statusMessage.classList.remove('success', 'error', 'warning', 'loading', 'info');
  
  // Add current type class
  statusMessage.classList.add(type);
  
  // Update border color based on type
  const colors = {
    success: '#2ecc71',
    error: '#e74c3c',
    warning: '#f39c12',
    loading: '#4a90e2',
    info: '#4a90e2'
  };
  
  statusMessage.style.borderLeftColor = colors[type] || colors.info;
  
  // Add entrance animation
  statusMessage.style.animation = 'none';
  setTimeout(() => {
    statusMessage.style.animation = '';
  }, 10);
}

/**
 * Send message to background script
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
