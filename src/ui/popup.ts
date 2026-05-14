/**
 * FILE: popup.ts
 *
 * WHAT: Type-safe popup UI controller for TabbyMcTabface extension
 * CONTRACT: Popup UI Controller v1.0.0
 */

type Ok<T> = { readonly ok: true; readonly value: T };
type Err<E> = { readonly ok: false; readonly error: E };
type Result<T, E> = Ok<T> | Err<E>;

const Result = {
  ok<T>(value: T): Result<T, never> { return { ok: true, value }; },
  error<E>(error: E): Result<never, E> { return { ok: false, error }; }
};

interface TabStats { tabCount: number; groupCount: number; quipCount: number; }
interface BrowserContext { tabCount: number; groupCount: number; tabs: chrome.tabs.Tab[]; groups: chrome.tabGroups.TabGroup[]; }
type BackgroundMessage = | { action: 'closeRandomTab' } | { action: 'createGroup'; groupName: string; tabIds: number[] } | { action: 'getBrowserContext' };
interface BackgroundResponse<T = unknown> { result?: { ok: boolean; value?: T; error?: { type: string; details: string; }; }; error?: string; }
interface CloseRandomTabResult { closedTabTitle: string; closedTabId: number; quipDelivered: boolean; }
interface CreateGroupResult { groupId: number; groupName: string; tabCount: number; quipDelivered: boolean; }
type StatusType = 'success' | 'error' | 'warning' | 'loading' | 'info';
type PopupErrorType = 'ChromeRuntimeFailure' | 'ChromeTabsFailure' | 'BackgroundFailure' | 'InvalidUrl';
interface PopupError { type: PopupErrorType; details: string; }

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
  const responseResult = await sendMessage<BrowserContext>({ action: 'getBrowserContext' });
  if (responseResult.ok === false) {
    console.error('Failed to update stats:', responseResult.error);
    return;
  }

  const response = responseResult.value;
  if (response.result?.ok && response.result.value) {
    const context = response.result.value;
    tabCountEl.textContent = String(context.tabCount);
    groupCountEl.textContent = String(context.groupCount);
    // Quip count is not yet tracked in BrowserContext; default to 0
    quipCountEl.textContent = '0';
  }
}

async function handleFeelingLucky(): Promise<void> {
  setStatus('Closing random tab...', 'loading');
  feelingLuckyBtn.disabled = true;

  const responseResult = await sendMessage<CloseRandomTabResult>({ action: 'closeRandomTab' });
  if (responseResult.ok === false) {
    setStatus(`Error: ${responseResult.error.details}`, 'error');
    console.error(responseResult.error);
    feelingLuckyBtn.disabled = false;
    return;
  }

  const response = responseResult.value;
  if (response.result?.ok && response.result.value) {
    const result = response.result.value;
    setStatus(`Closed: ${result.closedTabTitle}`, 'success');
    await updateStats();
  } else if (response.result?.error) {
    setStatus(`Error: ${response.result.error.details}`, 'error');
  } else {
    setStatus(`Error: ${response.error || 'Unknown error'}`, 'error');
  }

  feelingLuckyBtn.disabled = false;
}

async function handleCreateGroup(): Promise<void> {
  const tabsResult = await queryCurrentWindowTabs();
  if (tabsResult.ok === false) {
    setStatus('Failed to load tabs', 'error');
    console.error(tabsResult.error);
    return;
  }

  const tabs = tabsResult.value;
  allTabs = tabs;
  selectedTabIds = [];
  tabList.innerHTML = '';
  tabs.forEach((tab) => { const tabItem = createTabItem(tab); tabList.appendChild(tabItem); });
  groupCreator.classList.remove('hidden');
  groupNameInput.value = '';
  groupNameInput.focus();
  createGroupBtn.style.display = 'none';
  feelingLuckyBtn.style.display = 'none';
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
  const hostnameResult = getHostname(tab.url);
  url.textContent = hostnameResult.ok === true ? hostnameResult.value : hostnameResult.error.details;
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

  setStatus('Creating group...', 'loading');
  confirmGroupBtn.disabled = true;

  const responseResult = await sendMessage<CreateGroupResult>({ action: 'createGroup', groupName, tabIds: selectedTabIds });
  if (responseResult.ok === false) {
    setStatus(`Error: ${responseResult.error.details}`, 'error');
    console.error(responseResult.error);
    confirmGroupBtn.disabled = false;
    return;
  }

  const response = responseResult.value;
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

  confirmGroupBtn.disabled = false;
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

function getHostname(url: string | undefined): Result<string, PopupError> {
  if (!url) return Result.error({ type: 'InvalidUrl', details: 'No URL' });

  const parser = document.createElement('a');
  parser.href = url;

  if (!parser.hostname) {
    return Result.error({ type: 'InvalidUrl', details: url || 'Invalid URL' });
  }

  return Result.ok(parser.hostname);
}

function queryCurrentWindowTabs(): Promise<Result<chrome.tabs.Tab[], PopupError>> {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        resolve(Result.error({ type: 'ChromeTabsFailure', details: lastError.message || 'Failed to query tabs' }));
        return;
      }

      resolve(Result.ok(tabs));
    });
  });
}

function sendMessage<T = unknown>(message: BackgroundMessage): Promise<Result<BackgroundResponse<T>, PopupError>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse<T>) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        resolve(Result.error({ type: 'ChromeRuntimeFailure', details: lastError.message || 'Background message failed' }));
        return;
      }

      if (response?.error) {
        resolve(Result.error({ type: 'BackgroundFailure', details: response.error }));
        return;
      }

      resolve(Result.ok(response));
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
