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
import { handleRuntimeRequest, registerBackgroundListeners } from './background';
import type { ExtensionContext, InitializationResult } from './bootstrap';
import { Result } from './utils/Result';

function eventHook<T extends (...args: any[]) => any>() {
  const listeners: T[] = [];
  return { listeners, addListener: (listener: T) => listeners.push(listener) };
}

describe('background MV3 runtime', () => {
  it('rejects malformed messages without invoking core operations', async () => {
    const context = { tabManager: { closeRandomTab: vi.fn() } } as unknown as ExtensionContext;
    const response = await handleRuntimeRequest({ action: 'closeRandomTab', options: { excludePinned: 'yes' } }, context);
    expect(response.result).toEqual({
      ok: false,
      error: { type: 'InvalidMessage', details: expect.any(String) }
    });
    expect(context.tabManager.closeRandomTab).not.toHaveBeenCalled();
  });

  it('serializes Result values without their isError function', async () => {
    const context = {
      tabManager: { getBrowserContext: vi.fn(async () => Result.ok({ tabCount: 1, groupCount: 0 })) }
    } as unknown as ExtensionContext;
    const response = await handleRuntimeRequest({ action: 'getBrowserContext' }, context);
    expect(response.result).toEqual({ ok: true, value: { tabCount: 1, groupCount: 0 } });
    expect('isError' in response.result).toBe(false);
  });

  it('awaits cold initialization before a command and a message', async () => {
    const startup = eventHook<() => void>();
    const installed = eventHook<(details: chrome.runtime.InstalledDetails) => void>();
    const command = eventHook<(name: string) => void>();
    const message = eventHook<(message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (value: unknown) => void) => boolean | undefined>();
    const created = eventHook<(tab: chrome.tabs.Tab) => void>();
    const removed = eventHook<(tabId: number, info: chrome.tabs.OnRemovedInfo) => void>();
    const activated = eventHook<(info: chrome.tabs.OnActivatedInfo) => void>();
    const closeRandomTab = vi.fn(async () => Result.error({ type: 'NoTabsToClose', details: 'none', reason: 'none' }));
    const context = {
      tabManager: {
        closeRandomTab,
        recordBrowserEvent: vi.fn(),
        getBrowserContext: vi.fn(async () => Result.ok({ tabCount: 1, groupCount: 0 }))
      },
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
    expect(message.listeners[0]({ action: 'getBrowserContext' }, {} as chrome.runtime.MessageSender, sendResponse)).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

    expect(ensure).toHaveBeenCalledTimes(2);
    expect(closeRandomTab).toHaveBeenCalledOnce();
    expect(sendResponse).toHaveBeenCalledWith({
      result: { ok: true, value: { tabCount: 1, groupCount: 0 } }
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
      tabManager: { getBrowserContext: vi.fn(async () => { throw new Error('private implementation detail'); }) }
    } as unknown as ExtensionContext;
    const ensure = vi.fn(async (): Promise<InitializationResult> => Result.ok(context));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerBackgroundListeners({
      runtime: { onStartup: startup, onInstalled: installed, onMessage: message },
      commands: { onCommand: command },
      tabs: { onCreated: created, onRemoved: removed, onActivated: activated }
    } as unknown as typeof chrome, ensure);

    const sendResponse = vi.fn();
    message.listeners[0]({ action: 'getBrowserContext' }, {} as chrome.runtime.MessageSender, sendResponse);
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
    const recordBrowserEvent = vi.fn(async () => undefined);
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
});
