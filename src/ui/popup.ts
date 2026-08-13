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
 * CONTRACT: PopupController v1.2.0
 * GENERATED: 2026-08-12
 */

import type {
  PopupStats,
  RuntimeError,
  RuntimeRequest,
  RuntimeResponse
} from '../contracts/IRuntimeMessaging';
import type { BrowserEventName, GroupCreationSuccess, TabClosureResult } from '../contracts/ITabManager';
import { Result } from '../utils/Result';

export interface PopupDependencies {
  sendMessage: <T = unknown>(message: RuntimeRequest) => Promise<PopupRuntimeResponse<T>>;
  queryTabs: () => Promise<PopupRuntimeResponse<PopupTab[]>>;
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

export type PopupError =
  | { type: 'MissingElement'; details: string; selector: string }
  | { type: 'InitializationFailed'; details: string; originalError?: unknown };

export type PopupTransportError = {
  type: 'TransportTimeout' | 'TransportFailure' | 'MissingResponse';
  details: string;
};

export type PopupRuntimeResponse<T> = RuntimeResponse<T, RuntimeError | PopupTransportError>;

interface PopupElements {
  feelingLuckyBtn: HTMLButtonElement;
  createGroupBtn: HTMLButtonElement;
  groupCreator: HTMLElement;
  groupNameInput: HTMLInputElement;
  tabList: HTMLElement;
  confirmGroupBtn: HTMLButtonElement;
  cancelGroupBtn: HTMLButtonElement;
  statusMessage: HTMLElement;
  tabCountEl: HTMLElement;
  groupCountEl: HTMLElement;
  quipCountEl: HTMLElement;
}

const MESSAGE_TIMEOUT_MS = 5000;
const popupTransportErrorTypes = new Set<PopupTransportError['type']>([
  'TransportTimeout',
  'TransportFailure',
  'MissingResponse'
]);

function isPopupTransportError(error: RuntimeError | PopupTransportError): error is PopupTransportError {
  return popupTransportErrorTypes.has(error.type as PopupTransportError['type']);
}

export class PopupController {
  private selectedTabIds = new Set<number>();
  private luckyArmed = false;
  private mutationOutcomeUnknown = false;
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

  private constructor(
    private readonly document: Document,
    private readonly dependencies: PopupDependencies,
    elements: PopupElements
  ) {
    this.feelingLuckyBtn = elements.feelingLuckyBtn;
    this.createGroupBtn = elements.createGroupBtn;
    this.groupCreator = elements.groupCreator;
    this.groupNameInput = elements.groupNameInput;
    this.tabList = elements.tabList;
    this.confirmGroupBtn = elements.confirmGroupBtn;
    this.cancelGroupBtn = elements.cancelGroupBtn;
    this.statusMessage = elements.statusMessage;
    this.tabCountEl = elements.tabCountEl;
    this.groupCountEl = elements.groupCountEl;
    this.quipCountEl = elements.quipCountEl;
  }

  /** Resolve the popup DOM contract before constructing an interactive controller. */
  static create(
    documentRef: Document,
    dependencies: PopupDependencies
  ): Result<PopupController, PopupError> {
    const feelingLuckyBtn = documentRef.querySelector<HTMLButtonElement>('#feelingLuckyBtn');
    if (!feelingLuckyBtn) return PopupController.missingElement('#feelingLuckyBtn');
    const createGroupBtn = documentRef.querySelector<HTMLButtonElement>('#createGroupBtn');
    if (!createGroupBtn) return PopupController.missingElement('#createGroupBtn');
    const groupCreator = documentRef.querySelector<HTMLElement>('#groupCreator');
    if (!groupCreator) return PopupController.missingElement('#groupCreator');
    const groupNameInput = documentRef.querySelector<HTMLInputElement>('#groupNameInput');
    if (!groupNameInput) return PopupController.missingElement('#groupNameInput');
    const tabList = documentRef.querySelector<HTMLElement>('#tabList');
    if (!tabList) return PopupController.missingElement('#tabList');
    const confirmGroupBtn = documentRef.querySelector<HTMLButtonElement>('#confirmGroupBtn');
    if (!confirmGroupBtn) return PopupController.missingElement('#confirmGroupBtn');
    const cancelGroupBtn = documentRef.querySelector<HTMLButtonElement>('#cancelGroupBtn');
    if (!cancelGroupBtn) return PopupController.missingElement('#cancelGroupBtn');
    const statusMessage = documentRef.querySelector<HTMLElement>('#statusMessage');
    if (!statusMessage) return PopupController.missingElement('#statusMessage');
    const tabCountEl = documentRef.querySelector<HTMLElement>('#tabCount');
    if (!tabCountEl) return PopupController.missingElement('#tabCount');
    const groupCountEl = documentRef.querySelector<HTMLElement>('#groupCount');
    if (!groupCountEl) return PopupController.missingElement('#groupCount');
    const quipCountEl = documentRef.querySelector<HTMLElement>('#quipCount');
    if (!quipCountEl) return PopupController.missingElement('#quipCount');

    return Result.ok(new PopupController(documentRef, dependencies, {
      feelingLuckyBtn,
      createGroupBtn,
      groupCreator,
      groupNameInput,
      tabList,
      confirmGroupBtn,
      cancelGroupBtn,
      statusMessage,
      tabCountEl,
      groupCountEl,
      quipCountEl
    }));
  }

  async init(): Promise<Result<void, PopupError>> {
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

    void this.recordBrowserEvent('PopupOpened');
    await this.updateStats();
    return Result.ok(undefined);
  }

  private async updateStats(): Promise<void> {
    const response = await this.dependencies.sendMessage<PopupStats>({ action: 'getStats' });
    if (!response.result.ok) {
      this.renderUnavailableStats();
      console.error('[TabbyMcTabface] Failed to update popup stats', response.result.error);
      return;
    }
    this.tabCountEl.textContent = String(response.result.value.browser.tabCount);
    this.groupCountEl.textContent = String(response.result.value.browser.groupCount);
    this.quipCountEl.textContent = String(response.result.value.usage.quipsDelivered);
  }

  private async handleFeelingLucky(): Promise<void> {
    if (this.mutationOutcomeUnknown || this.feelingLuckyBtn.disabled) return;
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
    const response = await this.dependencies.sendMessage<TabClosureResult>({ action: 'closeRandomTab' });
    if (!response.result.ok) {
      if (isPopupTransportError(response.result.error)) {
        this.renderIndeterminateMutation('the random tab close');
        return;
      }
      this.setStatus(`Could not close a tab: ${response.result.error.details}`, 'error');
      this.feelingLuckyBtn.disabled = false;
      return;
    }
    const result = response.result.value;
    this.feelingLuckyBtn.disabled = false;
    await this.updateStats();
    this.setStatus(`Closed “${result.closedTabTitle}”. ${result.remainingCount} tabs remain in this window.`, 'success');
  }

  private async handleCreateGroup(): Promise<void> {
    if (this.mutationOutcomeUnknown || this.createGroupBtn.disabled) return;
    this.disarmLucky();
    this.createGroupBtn.disabled = true;
    const response = await this.dependencies.queryTabs();
    if (!response.result.ok) {
      this.setStatus('Failed to load tabs from this window.', 'error');
      console.error('[TabbyMcTabface] Failed to query popup tabs', response.result.error);
      this.createGroupBtn.disabled = false;
      return;
    }
    const tabs = response.result.value;
    this.selectedTabIds.clear();
    this.tabList.replaceChildren(...tabs.map((tab, index) => this.createTabItem(tab, index)));
    this.groupCreator.classList.remove('hidden');
    this.groupCreator.setAttribute('aria-hidden', 'false');
    this.groupNameInput.value = '';
    this.groupNameInput.focus();
    this.createGroupBtn.classList.add('hidden');
    this.feelingLuckyBtn.classList.add('hidden');
    this.createGroupBtn.disabled = false;
  }

  private createTabItem(tab: PopupTab, renderIndex: number): HTMLElement {
    const item = this.document.createElement('div');
    item.className = 'tab-item';
    const checkbox = this.document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tab-checkbox';
    const checkboxSuffix = tab.id ?? `unknown-${renderIndex}`;
    checkbox.id = `tab-${checkboxSuffix}`;
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
    if (this.mutationOutcomeUnknown || this.confirmGroupBtn.disabled) return;
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
    const response = await this.dependencies.sendMessage<GroupCreationSuccess>({
      action: 'createGroup',
      groupName,
      tabIds: [...this.selectedTabIds]
    });
    if (!response.result.ok) {
      if (isPopupTransportError(response.result.error)) {
        this.renderIndeterminateMutation('group creation');
        return;
      }
      this.setStatus(`Could not create group: ${response.result.error.details}`, 'error');
      this.confirmGroupBtn.disabled = false;
      return;
    }
    const result = response.result.value;
    this.handleCancelGroup();
    this.confirmGroupBtn.disabled = false;
    await this.updateStats();
    this.setStatus(`Group “${result.groupName}” created with ${result.tabCount} ${result.tabCount === 1 ? 'tab' : 'tabs'}.`, 'success');
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
      void this.recordBrowserEvent('KonamiCodeEntered');
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
    const link = this.document.createElement('a');
    link.href = url;
    return link.hostname || url;
  }

  private renderUnavailableStats(): void {
    this.tabCountEl.textContent = '—';
    this.groupCountEl.textContent = '—';
    this.quipCountEl.textContent = '—';
    this.setStatus('Stats are temporarily unavailable. The wombat is taking notes.', 'warning');
  }

  private renderIndeterminateMutation(action: string): void {
    this.mutationOutcomeUnknown = true;
    this.feelingLuckyBtn.disabled = true;
    this.createGroupBtn.disabled = true;
    this.confirmGroupBtn.disabled = true;
    this.groupNameInput.disabled = true;
    this.setStatus(
      `Chrome did not confirm whether ${action} finished. Close and reopen this popup to verify before trying again.`,
      'warning'
    );
  }

  private async recordBrowserEvent(event: BrowserEventName): Promise<void> {
    const response = await this.dependencies.sendMessage({ action: 'recordBrowserEvent', event });
    if (!response.result.ok) {
      console.error(`[TabbyMcTabface] Failed to record ${event}`, response.result.error);
    }
  }

  private static missingElement(selector: string): Result<never, PopupError> {
    return Result.error({
      type: 'MissingElement',
      details: `Popup is missing required element ${selector}`,
      selector
    });
  }
}

function popupFailureResponse<T>(
  type: PopupTransportError['type'],
  details: string
): PopupRuntimeResponse<T> {
  return { result: { ok: false, error: { type, details } } };
}

export function createChromeDependencies(chromeApi: typeof chrome): PopupDependencies {
  const sendMessage = <T = unknown>(message: RuntimeRequest): Promise<PopupRuntimeResponse<T>> => (
    new Promise(resolve => {
      let settled = false;
      const finish = (response: PopupRuntimeResponse<T>): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(response);
      };
      const timeoutId = setTimeout(() => {
        finish(popupFailureResponse<T>(
          'TransportTimeout',
          `The extension worker did not respond within ${MESSAGE_TIMEOUT_MS / 1000} seconds`
        ));
      }, MESSAGE_TIMEOUT_MS);

      chromeApi.runtime.sendMessage(message, response => {
        const runtimeError = chromeApi.runtime.lastError;
        if (runtimeError) {
          finish(popupFailureResponse<T>(
            'TransportFailure',
            runtimeError.message ?? 'Chrome runtime messaging failed'
          ));
          return;
        }
        if (!response) {
          finish(popupFailureResponse<T>('MissingResponse', 'Background did not return a response'));
          return;
        }
        finish(response as PopupRuntimeResponse<T>);
      });
    })
  );
  return {
    sendMessage,
    queryTabs: () => sendMessage<PopupTab[]>({ action: 'getCurrentTabs' }),
    setTimer: (handler, timeout) => setTimeout(handler, timeout),
    clearTimer: timer => clearTimeout(timer)
  };
}

function renderPopupFailure(documentRef: Document, error: PopupError): void {
  console.error('[TabbyMcTabface] Popup initialization failed', error);
  const status = documentRef.querySelector<HTMLElement>('#statusMessage');
  if (status) {
    const statusText = status.querySelector<HTMLElement>('.status-text') ?? status;
    statusText.textContent = 'The popup failed to load. Please close and reopen it.';
    status.classList.remove('success', 'warning', 'loading', 'info');
    status.classList.add('error');
    status.setAttribute('role', 'alert');
    return;
  }

  const fallback = documentRef.createElement('p');
  fallback.setAttribute('role', 'alert');
  fallback.textContent = 'TabbyMcTabface failed to load. Please close and reopen the popup.';
  documentRef.body.prepend(fallback);
}

export function mountPopup(
  documentRef: Document,
  chromeApi: typeof chrome
): Result<PopupController, PopupError> {
  const created = PopupController.create(documentRef, createChromeDependencies(chromeApi));
  if (!created.ok) {
    renderPopupFailure(documentRef, created.error);
    return created;
  }

  void created.value.init().then(
    initialized => {
      if (!initialized.ok) renderPopupFailure(documentRef, initialized.error);
    },
    originalError => renderPopupFailure(documentRef, {
      type: 'InitializationFailed',
      details: 'Unexpected popup initialization failure',
      originalError
    })
  );
  return created;
}

if (typeof document !== 'undefined' && typeof chrome !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountPopup(document, chrome), { once: true });
  } else {
    mountPopup(document, chrome);
  }
}
