/**
 * FILE: background.test.ts
 *
 * WHAT: Tests cold-worker listeners and validated wire messages.
 * WHY: Every MV3 event path must await initialization and return clone-safe data.
 * SEAMS: Chrome events/runtime messages -> bootstrap/core (SEAM-30, 31, 32)
 * CONTRACT: Background runtime controller v1.1.0
 * GENERATED: 2026-08-12
 */

import { describe, expect, it, vi } from 'vitest';
import { handleRuntimeRequest, registerBackgroundListeners, validateRuntimeRequest } from './background';
import type { ExtensionContext, InitializationResult } from './bootstrap';
import { Result } from './utils/Result';

function eventHook<T extends (...args: any[]) => any>() {
  const listeners: T[] = [];
  return { listeners, addListener: (listener: T) => listeners.push(listener) };
}

describe('background MV3 runtime', () => {
  it('rejects zero, negative, duplicate, non-integer, and unsafe tab IDs at the wire boundary', () => {
    for (const tabIds of [[0], [-1], [1, 1], [1.5], [Number.MAX_SAFE_INTEGER + 1]]) {
      expect(validateRuntimeRequest({ action: 'createGroup', groupName: 'Work', tabIds })).toBeNull();
    }
    expect(validateRuntimeRequest({ action: 'createGroup', groupName: 'Work', tabIds: [1, 2] }))
      .toEqual({ action: 'createGroup', groupName: 'Work', tabIds: [1, 2] });
  });

  it('rejects malformed messages without invoking core operations', async () => {
    const context = { tabManager: { closeRandomTab: vi.fn() } } as unknown as ExtensionContext;
    const response = await handleRuntimeRequest({ action: 'closeRandomTab', options: { excludePinned: 'yes' } }, context);
    expect(response.result).toEqual({
      ok: false,
      error: { type: 'InvalidMessage', details: expect.any(String) }
    });
    expect(context.tabManager.closeRandomTab).not.toHaveBeenCalled();
  });

  it('rejects messages from a different extension before initialization', () => {
    const startup = eventHook<() => void>();
    const installed = eventHook<(details: chrome.runtime.InstalledDetails) => void>();
    const command = eventHook<(name: string) => void>();
    const message = eventHook<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (value: unknown) => void) => boolean | undefined>();
    const created = eventHook<(tab: chrome.tabs.Tab) => void>();
    const removed = eventHook<(tabId: number, info: chrome.tabs.OnRemovedInfo) => void>();
    const activated = eventHook<(info: chrome.tabs.OnActivatedInfo) => void>();
    const ensure = vi.fn();
    registerBackgroundListeners({
      runtime: { id: 'tabby-extension', onStartup: startup, onInstalled: installed, onMessage: message },
      commands: { onCommand: command },
      tabs: { onCreated: created, onRemoved: removed, onActivated: activated }
    } as unknown as typeof chrome, ensure);
    const sendResponse = vi.fn();

    const keepPortOpen = message.listeners[0](
      { action: 'getStats' },
      { id: 'different-extension' } as chrome.runtime.MessageSender,
      sendResponse
    );

    expect(keepPortOpen).toBe(false);
    expect(ensure).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({
      result: {
        ok: false,
        error: { type: 'InvalidMessage', details: 'Messages are accepted only from this extension' }
      }
    });
  });

  it('serializes Result values without their isError function', async () => {
    const context = {
      chromeTabsAPI: { queryTabs: vi.fn(async () => Result.ok([{ id: 1, title: 'One' }])) }
    } as unknown as ExtensionContext;
    const response = await handleRuntimeRequest({ action: 'getCurrentTabs' }, context);
    expect(response.result).toEqual({ ok: true, value: [{ id: 1, title: 'One' }] });
    expect('isError' in response.result).toBe(false);
  });

  it('normalizes unknown domain errors instead of exposing uncontracted details', async () => {
    const context = {
      tabManager: {
        closeRandomTab: vi.fn(async () => Result.error({
          type: 'PrivateFailure', details: 'sensitive implementation details'
        }))
      }
    } as unknown as ExtensionContext;

    const response = await handleRuntimeRequest({ action: 'closeRandomTab' }, context);

    expect(response.result).toEqual({
      ok: false,
      error: { type: 'OperationFailed', details: 'The operation failed' }
    });
  });

  it('starts both getStats reads before awaiting either and preserves browser-error precedence', async () => {
    let releaseBrowser!: () => void;
    let releaseUsage!: () => void;
    const getBrowserContext = vi.fn(() => new Promise(resolve => {
      releaseBrowser = () => resolve(Result.error({
        type: 'ChromeAPIFailure',
        details: 'browser failed',
        originalError: null
      }));
    }));
    const getUsage = vi.fn(() => new Promise(resolve => {
      releaseUsage = () => resolve(Result.error({
        type: 'StorageReadFailed',
        details: 'usage failed',
        originalError: null
      }));
    }));
    const context = {
      tabManager: { getBrowserContext },
      usageStats: { get: getUsage }
    } as unknown as ExtensionContext;

    const pending = handleRuntimeRequest({ action: 'getStats' }, context);
    expect(getBrowserContext).toHaveBeenCalledOnce();
    expect(getUsage).toHaveBeenCalledOnce();
    releaseUsage();
    releaseBrowser();

    expect((await pending).result).toEqual({
      ok: false,
      error: { type: 'ChromeAPIFailure', details: 'browser failed' }
    });
  });

  it('ignores non-popup commands and awaits cold initialization before a message', async () => {
    const startup = eventHook<() => void>();
    const installed = eventHook<(details: chrome.runtime.InstalledDetails) => void>();
    const command = eventHook<(name: string) => void>();
    const message = eventHook<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (value: unknown) => void) => boolean | undefined>();
    const created = eventHook<(tab: chrome.tabs.Tab) => void>();
    const removed = eventHook<(tabId: number, info: chrome.tabs.OnRemovedInfo) => void>();
    const activated = eventHook<(info: chrome.tabs.OnActivatedInfo) => void>();
    const context = {
      tabManager: {
        recordBrowserEvent: vi.fn()
      },
      chromeTabsAPI: { queryTabs: vi.fn(async () => Result.ok([{ id: 1 }])) },
      chromeNotificationsAPI: { create: vi.fn(async () => Result.ok('id')) }
    } as unknown as ExtensionContext;
    const ensure = vi.fn(async (): Promise<InitializationResult> => Result.ok(context));
    registerBackgroundListeners({
      runtime: { onStartup: startup, onInstalled: installed, onMessage: message },
      commands: { onCommand: command },
      tabs: { onCreated: created, onRemoved: removed, onActivated: activated }
    } as unknown as typeof chrome, ensure);

    await command.listeners[0]('feeling_lucky');
    const sendResponse = vi.fn();
    expect(message.listeners[0]({ action: 'getCurrentTabs' }, {} as chrome.runtime.MessageSender, sendResponse)).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

    expect(ensure).toHaveBeenCalledOnce();
    expect(sendResponse).toHaveBeenCalledWith({
      result: { ok: true, value: [{ id: 1 }] }
    });
  });

  it('scrubs unexpected runtime failures before responding across the message seam', async () => {
    const startup = eventHook<() => void>();
    const installed = eventHook<(details: chrome.runtime.InstalledDetails) => void>();
    const command = eventHook<(name: string) => void>();
    const message = eventHook<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (value: unknown) => void) => boolean | undefined>();
    const created = eventHook<(tab: chrome.tabs.Tab) => void>();
    const removed = eventHook<(tabId: number, info: chrome.tabs.OnRemovedInfo) => void>();
    const activated = eventHook<(info: chrome.tabs.OnActivatedInfo) => void>();
    const context = {
      chromeTabsAPI: { queryTabs: vi.fn(async () => { throw new Error('private implementation detail'); }) }
    } as unknown as ExtensionContext;
    const ensure = vi.fn(async (): Promise<InitializationResult> => Result.ok(context));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerBackgroundListeners({
      runtime: { onStartup: startup, onInstalled: installed, onMessage: message },
      commands: { onCommand: command },
      tabs: { onCreated: created, onRemoved: removed, onActivated: activated }
    } as unknown as typeof chrome, ensure);

    const sendResponse = vi.fn();
    message.listeners[0]({ action: 'getCurrentTabs' }, {} as chrome.runtime.MessageSender, sendResponse);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

    expect(sendResponse).toHaveBeenCalledWith({
      result: {
        ok: false,
        error: { type: 'UnexpectedFailure', details: 'The requested action failed unexpectedly' }
      }
    });
    expect(JSON.stringify(sendResponse.mock.calls)).not.toContain('private implementation detail');
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('initializes before every lifecycle and tab-event path', async () => {
    const startup = eventHook<() => void>();
    const installed = eventHook<(details: chrome.runtime.InstalledDetails) => void>();
    const command = eventHook<(name: string) => void>();
    const message = eventHook<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (value: unknown) => void) => boolean | undefined>();
    const created = eventHook<(tab: chrome.tabs.Tab) => void>();
    const removed = eventHook<(tabId: number, info: unknown) => void>();
    const activated = eventHook<(info: unknown) => void>();
    const recordBrowserEvent = vi.fn(async (_event: string) => undefined);
    const context = {
      tabManager: { recordBrowserEvent },
      chromeNotificationsAPI: { create: vi.fn() }
    } as unknown as ExtensionContext;
    const ensure = vi.fn(async (): Promise<InitializationResult> => Result.ok(context));
    registerBackgroundListeners({
      runtime: { onStartup: startup, onInstalled: installed, onMessage: message },
      commands: { onCommand: command },
      tabs: { onCreated: created, onRemoved: removed, onActivated: activated }
    } as unknown as typeof chrome, ensure);

    await startup.listeners[0]();
    await installed.listeners[0]({ reason: 'update' } as chrome.runtime.InstalledDetails);
    await created.listeners[0]({} as chrome.tabs.Tab);
    await removed.listeners[0](7, {});
    await activated.listeners[0]({});

    expect(ensure).toHaveBeenCalledTimes(5);
    expect(recordBrowserEvent.mock.calls.map(([event]) => event)).toEqual(['TabOpened', 'TabClosed', 'TabActivated']);
  });

  it('never routes a manually supplied Lucky command to a destructive operation', async () => {
    const startup = eventHook<() => void>();
    const installed = eventHook<(details: chrome.runtime.InstalledDetails) => void>();
    const command = eventHook<(name: string) => void>();
    const message = eventHook<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (value: unknown) => void) => boolean | undefined>();
    const created = eventHook<(tab: chrome.tabs.Tab) => void>();
    const removed = eventHook<(tabId: number, info: chrome.tabs.OnRemovedInfo) => void>();
    const activated = eventHook<(info: chrome.tabs.OnActivatedInfo) => void>();
    const closeRandomTab = vi.fn();
    const context = { tabManager: { closeRandomTab } } as unknown as ExtensionContext;
    const ensure = vi.fn(async (): Promise<InitializationResult> => Result.ok(context));
    registerBackgroundListeners({
      runtime: { onStartup: startup, onInstalled: installed, onMessage: message },
      commands: { onCommand: command },
      tabs: { onCreated: created, onRemoved: removed, onActivated: activated }
    } as unknown as typeof chrome, ensure);

    await command.listeners[0]('feeling_lucky');

    expect(ensure).not.toHaveBeenCalled();
    expect(closeRandomTab).not.toHaveBeenCalled();
  });
});
