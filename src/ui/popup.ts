/**
 * FILE: popup.ts
 *
 * WHAT: Dependency-injected popup controller for safe tab actions and accessible feedback.
 *
 * WHY: Keeps DOM and Chrome APIs behind explicit seams so user flows can be tested without a browser.
 *
 * HOW DATA FLOWS:
 *   1. DOM events enter PopupController (SEAM-01, 06).
 *   2. Controller validates input and sends RuntimeRequest objects to background (SEAM-30).
 *   3. WireResult values update live-region status and durable statistics (SEAM-31).
 *
 * SEAMS:
 *   IN: Popup DOM -> PopupController (SEAM-01, 06)
 *   OUT: PopupController -> chrome.runtime/chrome.tabs (SEAM-30)
 *
 * CONTRACT: PopupController v1.1.0
 * GENERATED: 2026-08-12
 */

import type { PopupStats, RuntimeRequest, RuntimeResponse } from '../contracts/IRuntimeMessaging';
import type { GroupCreationSuccess, TabClosureResult } from '../contracts/ITabManager';

export interface PopupDependencies {
  sendMessage: <T = unknown>(message: RuntimeRequest) => Promise<RuntimeResponse<T>>;
  queryTabs: () => Promise<PopupTab[]>;
  setTimer: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
}

export interface PopupTab {
  id?: number;
  index?: number;
  url?: string;
  title?: string;
}

type StatusType = 'success' | 'error' | 'warning' | 'loading' | 'info';

export class PopupController {
  private selectedTabIds = new Set<number>();
  private luckyArmed = false;
  private luckyTimer: ReturnType<typeof setTimeout> | null = null;
  private konamiBuffer: string[] = [];
  private readonly konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  private readonly feelingLuckyBtn: HTMLButtonElement;
  private readonly createGroupBtn: HTMLButtonElement;
  private readonly groupCreator: HTMLElement;
  private readonly groupNameInput: HTMLInputElement;
  private readonly tabList: HTMLElement;
  private readonly confirmGroupBtn: HTMLButtonElement;
  private readonly cancelGroupBtn: HTMLButtonElement;
  private readonly statusMessage: HTMLElement;
  private readonly tabCountEl: HTMLElement;
  private readonly groupCountEl: HTMLElement;
  private readonly quipCountEl: HTMLElement;

  constructor(private readonly document: Document, private readonly dependencies: PopupDependencies) {
    this.feelingLuckyBtn = this.requireElement('#feelingLuckyBtn');
    this.createGroupBtn = this.requireElement('#createGroupBtn');
    this.groupCreator = this.requireElement('#groupCreator');
    this.groupNameInput = this.requireElement('#groupNameInput');
    this.tabList = this.requireElement('#tabList');
    this.confirmGroupBtn = this.requireElement('#confirmGroupBtn');
    this.cancelGroupBtn = this.requireElement('#cancelGroupBtn');
    this.statusMessage = this.requireElement('#statusMessage');
    this.tabCountEl = this.requireElement('#tabCount');
    this.groupCountEl = this.requireElement('#groupCount');
    this.quipCountEl = this.requireElement('#quipCount');
  }

  async init(): Promise<void> {
    this.statusMessage.setAttribute('role', 'status');
    this.statusMessage.setAttribute('aria-live', 'polite');
    this.statusMessage.setAttribute('aria-atomic', 'true');
    this.feelingLuckyBtn.addEventListener('click', () => void this.handleFeelingLucky());
    this.createGroupBtn.addEventListener('click', () => void this.handleCreateGroup());
    this.confirmGroupBtn.addEventListener('click', () => void this.handleConfirmGroup());
    this.cancelGroupBtn.addEventListener('click', () => this.handleCancelGroup());
    this.groupNameInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.handleConfirmGroup();
      }
    });
    this.document.addEventListener('keydown', event => this.handleKeyboard(event));

    void this.dependencies.sendMessage({ action: 'recordBrowserEvent', event: 'PopupOpened' }).catch(() => undefined);
    await this.updateStats();
  }

  private async updateStats(): Promise<void> {
    try {
      const response = await this.dependencies.sendMessage<PopupStats>({ action: 'getStats' });
      if (!response.result.ok) throw new Error(response.result.error.details);
      this.tabCountEl.textContent = String(response.result.value.browser.tabCount);
      this.groupCountEl.textContent = String(response.result.value.browser.groupCount);
      this.quipCountEl.textContent = String(response.result.value.usage.quipsDelivered);
    } catch (error) {
      this.tabCountEl.textContent = '—';
      this.groupCountEl.textContent = '—';
      this.quipCountEl.textContent = '—';
      this.setStatus('Stats are temporarily unavailable. The wombat is taking notes.', 'warning');
      console.error('[TabbyMcTabface] Failed to update popup stats', error);
    }
  }

  private async handleFeelingLucky(): Promise<void> {
    if (!this.luckyArmed) {
      this.luckyArmed = true;
      this.feelingLuckyBtn.classList.add('armed');
      this.setLuckyButtonCopy('Confirm random close', 'Click again within 5 seconds');
      this.setStatus('One more click closes a random unpinned, inactive tab in this window.', 'warning');
      this.luckyTimer = this.dependencies.setTimer(() => this.disarmLucky(), 5000);
      return;
    }

    this.disarmLucky();
    this.feelingLuckyBtn.disabled = true;
    this.setStatus('Choosing a random tab…', 'loading');
    try {
      const response = await this.dependencies.sendMessage<TabClosureResult>({ action: 'closeRandomTab' });
      if (!response.result.ok) {
        this.setStatus(`Could not close a tab: ${response.result.error.details}`, 'error');
        return;
      }
      const result = response.result.value;
      this.setStatus(`Closed “${result.closedTabTitle}”. ${result.remainingCount} tabs remain in this window.`, 'success');
      this.feelingLuckyBtn.disabled = false;
      await this.updateStats();
    } catch (error) {
      this.setStatus('Could not reach the extension worker. Please try again.', 'error');
      console.error('[TabbyMcTabface] Lucky action failed', error);
    } finally {
      this.feelingLuckyBtn.disabled = false;
    }
  }

  private async handleCreateGroup(): Promise<void> {
    this.disarmLucky();
    this.createGroupBtn.disabled = true;
    try {
      const tabs = await this.dependencies.queryTabs();
      this.selectedTabIds.clear();
      this.tabList.replaceChildren(...tabs.map(tab => this.createTabItem(tab)));
      this.groupCreator.classList.remove('hidden');
      this.groupCreator.setAttribute('aria-hidden', 'false');
      this.groupNameInput.value = '';
      this.groupNameInput.focus();
      this.createGroupBtn.classList.add('hidden');
      this.feelingLuckyBtn.classList.add('hidden');
    } catch (error) {
      this.setStatus('Failed to load tabs from this window.', 'error');
      console.error('[TabbyMcTabface] Failed to query popup tabs', error);
    } finally {
      this.createGroupBtn.disabled = false;
    }
  }

  private createTabItem(tab: PopupTab): HTMLElement {
    const item = this.document.createElement('div');
    item.className = 'tab-item';
    const checkbox = this.document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tab-checkbox';
    checkbox.id = `tab-${tab.id ?? `unknown-${tab.index ?? 0}`}`;
    checkbox.disabled = tab.id === undefined;

    const label = this.document.createElement('label');
    label.className = 'tab-info';
    label.htmlFor = checkbox.id;
    const title = this.document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || 'Untitled';
    const url = this.document.createElement('span');
    url.className = 'tab-url';
    url.textContent = this.displayDomain(tab.url);
    label.append(title, url);

    checkbox.addEventListener('change', () => {
      if (tab.id === undefined) return;
      if (checkbox.checked) this.selectedTabIds.add(tab.id);
      else this.selectedTabIds.delete(tab.id);
      item.classList.toggle('selected', checkbox.checked);
    });
    item.append(checkbox, label);
    return item;
  }

  private async handleConfirmGroup(): Promise<void> {
    const groupName = this.groupNameInput.value.trim();
    if (!groupName) {
      this.setStatus('Group name cannot be empty.', 'error');
      this.groupNameInput.focus();
      return;
    }
    if (groupName.length > 50) {
      this.setStatus('Group name must be 50 characters or fewer.', 'error');
      this.groupNameInput.focus();
      return;
    }
    if (this.selectedTabIds.size === 0) {
      this.setStatus('Select at least one tab to create a group.', 'error');
      return;
    }

    this.confirmGroupBtn.disabled = true;
    this.setStatus('Creating group…', 'loading');
    try {
      const response = await this.dependencies.sendMessage<GroupCreationSuccess>({
        action: 'createGroup',
        groupName,
        tabIds: [...this.selectedTabIds]
      });
      if (!response.result.ok) {
        this.setStatus(`Could not create group: ${response.result.error.details}`, 'error');
        return;
      }
      const result = response.result.value;
      this.handleCancelGroup();
      this.setStatus(`Group “${result.groupName}” created with ${result.tabCount} ${result.tabCount === 1 ? 'tab' : 'tabs'}.`, 'success');
      this.confirmGroupBtn.disabled = false;
      await this.updateStats();
    } catch (error) {
      this.setStatus('Could not reach the extension worker. Please try again.', 'error');
      console.error('[TabbyMcTabface] Group creation failed', error);
    } finally {
      this.confirmGroupBtn.disabled = false;
    }
  }

  private handleCancelGroup(): void {
    this.disarmLucky();
    this.groupCreator.classList.add('hidden');
    this.groupCreator.setAttribute('aria-hidden', 'true');
    this.createGroupBtn.classList.remove('hidden');
    this.feelingLuckyBtn.classList.remove('hidden');
    this.selectedTabIds.clear();
    this.tabList.replaceChildren();
    this.createGroupBtn.focus();
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.groupCreator.classList.contains('hidden')) {
      this.handleCancelGroup();
      return;
    }

    this.konamiBuffer.push(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    this.konamiBuffer = this.konamiBuffer.slice(-this.konamiSequence.length);
    if (this.konamiBuffer.join('|') === this.konamiSequence.join('|')) {
      this.konamiBuffer = [];
      void this.dependencies.sendMessage({ action: 'recordBrowserEvent', event: 'KonamiCodeEntered' });
      this.setStatus('↑ ↑ ↓ ↓ ← → ← → B A. The wombat noticed.', 'success');
    }
  }

  private disarmLucky(): void {
    this.luckyArmed = false;
    this.feelingLuckyBtn.classList.remove('armed');
    if (this.luckyTimer !== null) {
      this.dependencies.clearTimer(this.luckyTimer);
      this.luckyTimer = null;
    }
    this.setLuckyButtonCopy("I'm Feeling Lucky", 'Close a random tab');
  }

  private setLuckyButtonCopy(title: string, hint: string): void {
    const titleElement = this.feelingLuckyBtn.querySelector('.btn-text');
    const hintElement = this.feelingLuckyBtn.querySelector('.btn-hint');
    if (titleElement) titleElement.textContent = title;
    if (hintElement) hintElement.textContent = hint;
  }

  private setStatus(message: string, type: StatusType): void {
    const statusText = this.statusMessage.querySelector('.status-text') ?? this.statusMessage;
    statusText.textContent = message;
    this.statusMessage.classList.remove('success', 'error', 'warning', 'loading', 'info');
    this.statusMessage.classList.add(type);
  }

  private displayDomain(url: string | undefined): string {
    if (!url) return 'Internal or unavailable URL';
    try {
      return new URL(url).hostname || url;
    } catch {
      return url;
    }
  }

  private requireElement<T extends Element>(selector: string): T {
    const element = this.document.querySelector<T>(selector);
    if (!element) throw new Error(`Popup is missing required element ${selector}`);
    return element;
  }
}

export function createChromeDependencies(chromeApi: typeof chrome): PopupDependencies {
  const sendMessage: PopupDependencies['sendMessage'] = message => new Promise((resolve, reject) => {
    chromeApi.runtime.sendMessage(message, response => {
      if (chromeApi.runtime.lastError) {
        reject(new Error(chromeApi.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error('Background did not return a response'));
        return;
      }
      resolve(response);
    });
  });
  return {
    sendMessage,
    queryTabs: async () => {
      const response = await sendMessage<PopupTab[]>({ action: 'getCurrentTabs' });
      if (!response.result.ok) throw new Error(response.result.error.details);
      return response.result.value;
    },
    setTimer: (handler, timeout) => setTimeout(handler, timeout),
    clearTimer: timer => clearTimeout(timer)
  };
}

export function mountPopup(documentRef: Document, chromeApi: typeof chrome): PopupController {
  const controller = new PopupController(documentRef, createChromeDependencies(chromeApi));
  void controller.init();
  return controller;
}

if (typeof document !== 'undefined' && typeof chrome !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountPopup(document, chrome), { once: true });
  } else {
    mountPopup(document, chrome);
  }
}
