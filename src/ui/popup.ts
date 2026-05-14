/**
 * FILE: popup.ts
 *
 * WHAT: Type-safe popup UI controller for TabbyMcTabface extension
 * CONTRACT: Popup UI Controller v1.0.0
 */


interface TabStats { tabCount: number; groupCount: number; quipCount: number; }
interface BrowserContext { tabCount: number; groupCount: number; tabs: chrome.tabs.Tab[]; groups: chrome.tabGroups.TabGroup[]; }
type BackgroundMessage = | { action: 'closeRandomTab' } | { action: 'createGroup'; groupName: string; tabIds: number[] } | { action: 'getBrowserContext' };
interface BackgroundResponse<T = unknown> { result?: { ok: boolean; value?: T; error?: { type: string; details: string; }; }; error?: string; }
interface CloseRandomTabResult { closedTabTitle: string; closedTabId: number; quipDelivered: boolean; }
interface CreateGroupResult { groupId: number; groupName: string; tabCount: number; quipDelivered: boolean; }
type StatusType = 'success' | 'error' | 'warning' | 'loading' | 'info';

let allTabs: chrome.tabs.Tab[] = [];
let selectedTabIds: number[] = [];

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

async function init(): Promise<void> {
  await updateStats();
  feelingLuckyBtn.addEventListener('click', handleFeelingLucky);
  createGroupBtn.addEventListener('click', handleCreateGroup);
  confirmGroupBtn.addEventListener('click', handleConfirmGroup);
  cancelGroupBtn.addEventListener('click', handleCancelGroup);
}

async function updateStats(): Promise<void> {
  try {
    const response = await sendMessage<BrowserContext>({ action: 'getBrowserContext' });
    if (response.result?.ok && response.result.value) {
      const context = response.result.value;
      tabCountEl.textContent = String(context.tabCount);
      groupCountEl.textContent = String(context.groupCount);
      // Quip count is not yet tracked in BrowserContext; default to 0
      quipCountEl.textContent = '0';
    }
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

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

async function handleCreateGroup(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    allTabs = tabs;
    selectedTabIds = [];
    tabList.innerHTML = '';
    tabs.forEach((tab) => { const tabItem = createTabItem(tab); tabList.appendChild(tabItem); });
    groupCreator.classList.remove('hidden');
    groupNameInput.value = '';
    groupNameInput.focus();
    createGroupBtn.style.display = 'none';
    feelingLuckyBtn.style.display = 'none';
  } catch (error) {
    setStatus('Failed to load tabs', 'error');
    console.error(error);
  }
}

function createTabItem(tab: chrome.tabs.Tab): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'tab-item';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tab-checkbox';
  checkbox.id = `tab-${tab.id}`;
  checkbox.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.checked && tab.id !== undefined) { selectedTabIds.push(tab.id); item.classList.add('selected'); }
    else if (tab.id !== undefined) { selectedTabIds = selectedTabIds.filter((id) => id !== tab.id); item.classList.remove('selected'); }
  });
  const info = document.createElement('div');
  info.className = 'tab-info';
  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || 'Untitled';
  const url = document.createElement('div');
  url.className = 'tab-url';
  try {
    if (tab.url) { url.textContent = new URL(tab.url).hostname; }
    else { url.textContent = 'No URL'; }
  } catch { url.textContent = tab.url || 'Invalid URL'; }
  info.appendChild(title);
  info.appendChild(url);
  item.appendChild(checkbox);
  item.appendChild(info);
  item.addEventListener('click', (event) => {
    if (event.target !== checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change')); }
  });
  return item;
}

async function handleConfirmGroup(): Promise<void> {
  const groupName = groupNameInput.value.trim();
  if (!groupName) { setStatus('Group name cannot be empty', 'error'); return; }
  if (groupName.length > 50) { setStatus('Group name too long (max 50 chars)', 'error'); return; }
  if (selectedTabIds.length === 0) { setStatus('Please select at least one tab', 'error'); return; }
  try {
    setStatus('Creating group...', 'loading');
    confirmGroupBtn.disabled = true;
    const response = await sendMessage<CreateGroupResult>({ action: 'createGroup', groupName, tabIds: selectedTabIds });
    if (response.result?.ok && response.result.value) {
      const result = response.result.value;
      setStatus(`Group "${result.groupName}" created with ${result.tabCount} tabs!`, 'success');
      handleCancelGroup();
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

function handleCancelGroup(): void {
  groupCreator.classList.add('hidden');
  createGroupBtn.style.display = '';
  feelingLuckyBtn.style.display = '';
  selectedTabIds = [];
}

function setStatus(message: string, type: StatusType = 'info'): void {
  const statusText = statusMessage.querySelector('.status-text') as HTMLDivElement;
  statusText.textContent = message;
  statusMessage.classList.remove('success', 'error', 'warning', 'loading', 'info');
  statusMessage.classList.add(type);
  const colors: Record<StatusType, string> = { success: '#2ecc71', error: '#e74c3c', warning: '#f39c12', loading: '#4a90e2', info: '#4a90e2' };
  statusMessage.style.borderLeftColor = colors[type];
  statusMessage.style.animation = 'none';
  setTimeout(() => { statusMessage.style.animation = ''; }, 10);
}

function sendMessage<T = unknown>(message: BackgroundMessage): Promise<BackgroundResponse<T>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse<T>) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(response);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
