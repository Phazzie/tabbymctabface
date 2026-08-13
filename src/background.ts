/**
 * FILE: background.ts
 *
 * WHAT: MV3 service-worker listener registration and validated popup message routing.
 *
 * WHY: Every wake path must initialize the object graph, await work, and cross the runtime seam with clone-safe data.
 *
 * HOW DATA FLOWS:
 *   1. Chrome lifecycle, command, tab, and runtime events enter registered listeners (SEAM-30, 32).
 *   2. Listeners await the shared ensureInitialized promise.
 *   3. Runtime messages are validated before invoking contracts and converted to WireResult (SEAM-31).
 *
 * SEAMS:
 *   IN: chrome.runtime/commands/tabs -> Background (SEAM-30, 32)
 *   OUT: Background -> Bootstrap/TabManager/Popup response (SEAM-31)
 *
 * CONTRACT: Background runtime controller v1.1.0
 * GENERATED: 2026-08-12
 */

import {
  ensureInitialized,
  type ExtensionContext,
  type InitializationResult
} from './bootstrap';
import type {
  RuntimeError,
  RuntimeMessageError,
  RuntimeRequest,
  RuntimeResponse,
  WireResult
} from './contracts/IRuntimeMessaging';
import type { BrowserEventName, RandomTabOptions } from './contracts/ITabManager';

type EnsureInitialized = () => Promise<InitializationResult>;

const runtimeErrorTypes = new Set<RuntimeError['type']>([
  'InvalidMessage',
  'InitializationFailed',
  'UnexpectedFailure',
  'OperationFailed',
  'InvalidGroupName',
  'NoTabsSelected',
  'NoTabsToClose',
  'InvalidGroupId',
  'InvalidTabId',
  'PermissionDenied',
  'ChromeAPIFailure',
  'StorageReadFailed',
  'StorageWriteFailed'
]);

function isRuntimeErrorType(value: unknown): value is RuntimeError['type'] {
  return typeof value === 'string' && runtimeErrorTypes.has(value as RuntimeError['type']);
}

function wire<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): WireResult<T> {
  if (result.ok) return { ok: true, value: result.value };
  const candidate = isPlainObject(result.error) ? result.error : {};
  if (!isRuntimeErrorType(candidate.type)) {
    return { ok: false, error: { type: 'OperationFailed', details: 'The operation failed' } };
  }
  return {
    ok: false,
    error: {
      type: candidate.type,
      details: typeof candidate.details === 'string' ? candidate.details : 'The operation failed'
    }
  };
}

function invalid(details: string): RuntimeResponse<never, RuntimeMessageError> {
  return { result: { ok: false, error: { type: 'InvalidMessage', details } } };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptions(value: unknown): value is RandomTabOptions {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  return keys.every(key => key === 'excludePinned' || key === 'excludeActive')
    && (value.excludePinned === undefined || typeof value.excludePinned === 'boolean')
    && (value.excludeActive === undefined || typeof value.excludeActive === 'boolean');
}

const browserEventNames = new Set<BrowserEventName>([
  'PopupOpened',
  'KonamiCodeEntered',
  'TabOpened',
  'TabClosed',
  'TabActivated'
]);

export function validateRuntimeRequest(message: unknown): RuntimeRequest | null {
  if (!isPlainObject(message) || typeof message.action !== 'string') return null;
  switch (message.action) {
    case 'createGroup':
      if (
        typeof message.groupName === 'string'
        && Array.isArray(message.tabIds)
        && message.tabIds.every(tabId => Number.isSafeInteger(tabId) && (tabId as number) > 0)
        && new Set(message.tabIds).size === message.tabIds.length
      ) {
        return { action: 'createGroup', groupName: message.groupName, tabIds: message.tabIds as number[] };
      }
      return null;
    case 'closeRandomTab':
      if (message.options === undefined) return { action: 'closeRandomTab' };
      return isOptions(message.options) ? { action: 'closeRandomTab', options: message.options } : null;
    case 'getCurrentTabs':
    case 'getStats':
      return { action: message.action };
    case 'recordBrowserEvent':
      return typeof message.event === 'string' && browserEventNames.has(message.event as BrowserEventName)
        ? { action: 'recordBrowserEvent', event: message.event as BrowserEventName }
        : null;
    default:
      return null;
  }
}

export async function handleRuntimeRequest(
  message: unknown,
  context: ExtensionContext
): Promise<RuntimeResponse> {
  const request = validateRuntimeRequest(message);
  if (!request) return invalid('Message does not match a supported action contract');

  switch (request.action) {
    case 'createGroup':
      return { result: wire(await context.tabManager.createGroup(request.groupName, request.tabIds)) };
    case 'closeRandomTab':
      return { result: wire(await context.tabManager.closeRandomTab(request.options)) };
    case 'getCurrentTabs':
      return { result: wire(await context.chromeTabsAPI.queryTabs({ currentWindow: true })) };
    case 'getStats': {
      const [browser, usage] = await Promise.all([
        context.tabManager.getBrowserContext(),
        context.usageStats.get()
      ]);
      if (!browser.ok) return { result: wire(browser) };
      if (!usage.ok) return { result: wire(usage) };
      return {
        result: {
          ok: true,
          value: {
            browser: {
              tabCount: browser.value.tabCount,
              groupCount: browser.value.groupCount
            },
            usage: usage.value
          }
        }
      };
    }
    case 'recordBrowserEvent':
      await context.tabManager.recordBrowserEvent(request.event);
      return { result: { ok: true, value: null } };
  }
}

async function getInitializedContext(ensure: EnsureInitialized): Promise<ExtensionContext | null> {
  const result = await ensure();
  if (!result.ok) {
    console.error('[TabbyMcTabface] Initialization failed', result.error);
    return null;
  }
  return result.value;
}

export function registerBackgroundListeners(
  chromeApi: typeof chrome,
  ensure: EnsureInitialized = ensureInitialized
): void {
  chromeApi.runtime.onStartup.addListener(async () => {
    await getInitializedContext(ensure);
  });

  chromeApi.runtime.onInstalled.addListener(async details => {
    const context = await getInitializedContext(ensure);
    if (!context || details.reason !== 'install') return;
    await context.chromeNotificationsAPI.create({
      type: 'basic',
      title: 'TabbyMcTabface Installed',
      message: 'Your tab chaos is now under skeptical wombat supervision. Open the popup to get started.',
      iconUrl: 'icons/icon128.png'
    });
  });

  chromeApi.commands.onCommand.addListener(async command => {
    if (command === '_execute_action') await getInitializedContext(ensure);
  });

  chromeApi.tabs.onCreated.addListener(async () => {
    const context = await getInitializedContext(ensure);
    if (context) await context.tabManager.recordBrowserEvent('TabOpened');
  });
  chromeApi.tabs.onRemoved.addListener(async () => {
    const context = await getInitializedContext(ensure);
    if (context) await context.tabManager.recordBrowserEvent('TabClosed');
  });
  chromeApi.tabs.onActivated.addListener(async () => {
    const context = await getInitializedContext(ensure);
    if (context) await context.tabManager.recordBrowserEvent('TabActivated');
  });

  chromeApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (typeof chromeApi.runtime.id === 'string' && sender.id !== chromeApi.runtime.id) {
      sendResponse(invalid('Messages are accepted only from this extension'));
      return false;
    }
    void (async () => {
      const context = await getInitializedContext(ensure);
      if (!context) {
        sendResponse({
          result: {
            ok: false,
            error: { type: 'InitializationFailed', details: 'Extension could not initialize' }
          }
        });
        return;
      }
      try {
        sendResponse(await handleRuntimeRequest(message, context));
      } catch (error) {
        console.error('[TabbyMcTabface] Runtime message failed', error);
        sendResponse({
          result: {
            ok: false,
            error: { type: 'UnexpectedFailure', details: 'The requested action failed unexpectedly' }
          }
        });
      }
    })();
    return true;
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  registerBackgroundListeners(chrome);
  void ensureInitialized();
}
