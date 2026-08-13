/**
 * @vitest-environment jsdom
 *
 * FILE: popup.test.ts
 * WHAT: Popup controller behavior and accessibility tests.
 * WHY: User input, destructive confirmation, runtime messaging, and DOM output cross the popup seam.
 * HOW DATA FLOWS:
 *   1. A jsdom popup fixture enters PopupController through SEAM-01/06.
 *   2. Injected runtime results cross SEAM-30 and render status/stat output.
 *   3. Assertions verify the DOM and message payload contracts without Chrome.
 * SEAMS:
 *   IN: Popup DOM -> PopupController (SEAM-01, 06)
 *   OUT: PopupController -> background runtime / chrome.tabs (SEAM-30)
 * CONTRACT: PopupController v1.2.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createChromeDependencies,
  mountPopup,
  PopupController,
  type PopupDependencies,
  type PopupRuntimeResponse,
  type PopupTab
} from './popup';

const markup = `
  <main>
    <button id="feelingLuckyBtn"><span class="btn-text">I'm Feeling Lucky</span><span class="btn-hint">Close a random tab</span></button>
    <button id="createGroupBtn">Create Tab Group</button>
    <section id="groupCreator" class="hidden">
      <label for="groupNameInput">Group name</label>
      <input id="groupNameInput" />
      <div id="tabList"></div>
      <button id="confirmGroupBtn">Create</button>
      <button id="cancelGroupBtn">Cancel</button>
    </section>
    <div id="statusMessage" role="status" aria-live="polite"><p class="status-text"></p></div>
    <span id="tabCount"></span><span id="groupCount"></span><span id="quipCount"></span>
  </main>`;

function success<T>(value: T) {
  return { result: { ok: true as const, value } };
}

function failure(type: string, details: string) {
  return { result: { ok: false as const, error: { type, details } } };
}

describe('PopupController', () => {
  let sendMessage: ReturnType<typeof vi.fn>;
  let queryTabs: ReturnType<typeof vi.fn>;
  let deps: PopupDependencies;

  const createController = (documentRef: Document = document): PopupController => {
    const created = PopupController.create(documentRef, deps);
    assert(created.ok, created.ok ? undefined : created.error.details);
    return created.value;
  };

  beforeEach(() => {
    document.body.innerHTML = markup;
    sendMessage = vi.fn(async (request: { action: string }) => {
      if (request.action === 'getStats') {
        return success({
          browser: { tabCount: 7, groupCount: 2 },
          usage: { quipsDelivered: 11, groupsCreated: 1, tabsClosed: 2, luckyClicks: 2, schemaVersion: 1, lastUpdated: null }
        });
      }
      if (request.action === 'closeRandomTab') {
        return success({ closedTabTitle: 'A very important tab', remainingCount: 6 });
      }
      if (request.action === 'createGroup') {
        return success({ groupId: 1, groupName: 'Work', tabCount: 1 });
      }
      return success(undefined);
    });
    queryTabs = vi.fn(async () => success([{ id: 1, title: 'One', url: 'https://example.com' }]));
    deps = {
      sendMessage: <T = unknown>(message: Parameters<PopupDependencies['sendMessage']>[0]) => (
        (sendMessage as (...args: unknown[]) => unknown)(message) as Promise<PopupRuntimeResponse<T>>
      ),
      queryTabs: () => (
        (queryTabs as (...args: unknown[]) => unknown)() as Promise<PopupRuntimeResponse<PopupTab[]>>
      ),
      setTimer: vi.fn(() => 1 as unknown as ReturnType<typeof setTimeout>),
      clearTimer: vi.fn()
    };
  });

  afterEach(() => vi.useRealTimers());

  it('initializes real browser/usage stats and records popup opening', async () => {
    await createController().init();
    expect(document.querySelector('#tabCount')?.textContent).toBe('7');
    expect(document.querySelector('#groupCount')?.textContent).toBe('2');
    expect(document.querySelector('#quipCount')?.textContent).toBe('11');
    expect(sendMessage).toHaveBeenCalledWith({ action: 'recordBrowserEvent', event: 'PopupOpened' });
  });

  it('requires two explicit Lucky clicks and reports the closed title and remaining count', async () => {
    await createController().init();
    const button = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;
    button.click();
    await Promise.resolve();
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(0);
    expect(button.textContent).toContain('Confirm');

    button.click();
    await vi.waitFor(() => expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(1));
    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('A very important tab'));
    expect(document.querySelector('#statusMessage')?.textContent).toContain('6');
    expect(button.disabled).toBe(false);
  });

  it('requires a fresh two-click confirmation after opening and cancelling group creation', async () => {
    await createController().init();
    const lucky = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;
    lucky.click();
    expect(lucky.textContent).toContain('Confirm');

    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#tab-1')).not.toBeNull());
    document.querySelector<HTMLButtonElement>('#cancelGroupBtn')!.click();
    expect(lucky.textContent).toContain("I'm Feeling Lucky");

    lucky.click();
    await Promise.resolve();
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(0);
    expect(lucky.textContent).toContain('Confirm');
  });

  it('associates generated checkbox labels and validates/cancels group creation', async () => {
    await createController().init();
    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#tab-1')).not.toBeNull());
    const checkbox = document.querySelector<HTMLInputElement>('#tab-1')!;
    expect(document.querySelector(`label[for="${checkbox.id}"]`)).not.toBeNull();

    document.querySelector<HTMLButtonElement>('#confirmGroupBtn')!.click();
    expect(document.querySelector('#statusMessage')?.textContent).toContain('Group name cannot be empty.');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('#groupCreator')?.classList.contains('hidden')).toBe(true);
  });

  it('creates a valid group and re-enables the confirm button', async () => {
    await createController().init();
    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#tab-1')).not.toBeNull());
    const checkbox = document.querySelector<HTMLInputElement>('#tab-1')!;
    checkbox.click();
    const input = document.querySelector<HTMLInputElement>('#groupNameInput')!;
    input.value = '  Work  ';
    const confirm = document.querySelector<HTMLButtonElement>('#confirmGroupBtn')!;
    confirm.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('created'));
    expect(confirm.disabled).toBe(false);
    expect(document.querySelector('#groupCreator')?.classList.contains('hidden')).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith({
      action: 'createGroup',
      groupName: 'Work',
      tabIds: [1]
    });
  });

  it('surfaces query failures (including chrome.runtime.lastError wrappers) and restores controls', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    queryTabs.mockResolvedValueOnce(failure('TransportFailure', 'The message port closed'));
    await createController().init();
    const create = document.querySelector<HTMLButtonElement>('#createGroupBtn')!;
    create.click();
    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('Failed to load tabs'));
    expect(create.disabled).toBe(false);
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('surfaces background action errors without leaving action buttons disabled', async () => {
    sendMessage.mockImplementation(async (request: { action: string }) => {
      if (request.action === 'getStats') {
        return success({
          browser: { tabCount: 2, groupCount: 0 },
          usage: { quipsDelivered: 0, groupsCreated: 0, tabsClosed: 0, luckyClicks: 0, schemaVersion: 1, lastUpdated: null }
        });
      }
      if (request.action === 'closeRandomTab') {
        return { result: { ok: false, error: { type: 'NoTabsToClose', details: 'All tabs are protected' } } };
      }
      return success(undefined);
    });
    await createController().init();
    const lucky = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;
    lucky.click();
    lucky.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('protected'));
    expect(lucky.disabled).toBe(false);
  });

  it('keeps Lucky disabled when a timeout leaves the destructive result unknown', async () => {
    sendMessage.mockImplementation(async (request: { action: string }) => {
      if (request.action === 'getStats') {
        return success({
          browser: { tabCount: 2, groupCount: 0 },
          usage: { quipsDelivered: 0, groupsCreated: 0, tabsClosed: 0, luckyClicks: 0, schemaVersion: 1, lastUpdated: null }
        });
      }
      if (request.action === 'closeRandomTab') {
        return failure('TransportTimeout', 'The extension worker did not respond within 5 seconds');
      }
      return success(undefined);
    });
    await createController().init();
    const lucky = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;

    lucky.click();
    lucky.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('did not confirm'));
    expect(document.querySelector('#statusMessage')?.textContent).toContain('Close and reopen');
    expect(lucky.disabled).toBe(true);
    lucky.click();
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(1);
  });

  it('keeps Lucky disabled when the message port fails after an unknown destructive result', async () => {
    sendMessage.mockImplementation(async (request: { action: string }) => {
      if (request.action === 'getStats') {
        return success({
          browser: { tabCount: 2, groupCount: 0 },
          usage: { quipsDelivered: 0, groupsCreated: 0, tabsClosed: 0, luckyClicks: 0, schemaVersion: 1, lastUpdated: null }
        });
      }
      if (request.action === 'closeRandomTab') {
        return failure('TransportFailure', 'The message port closed before a response was received');
      }
      return success(undefined);
    });
    await createController().init();
    const lucky = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;

    lucky.click();
    lucky.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('did not confirm'));
    expect(lucky.disabled).toBe(true);
    lucky.click();
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(1);
  });

  it('prevents mutation retries when group creation times out with an unknown result', async () => {
    sendMessage.mockImplementation(async (request: { action: string }) => {
      if (request.action === 'getStats') {
        return success({
          browser: { tabCount: 2, groupCount: 0 },
          usage: { quipsDelivered: 0, groupsCreated: 0, tabsClosed: 0, luckyClicks: 0, schemaVersion: 1, lastUpdated: null }
        });
      }
      if (request.action === 'createGroup') {
        return failure('TransportTimeout', 'The extension worker did not respond within 5 seconds');
      }
      return success(undefined);
    });
    await createController().init();
    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#tab-1')).not.toBeNull());
    document.querySelector<HTMLInputElement>('#tab-1')!.click();
    document.querySelector<HTMLInputElement>('#groupNameInput')!.value = 'Work';
    const confirm = document.querySelector<HTMLButtonElement>('#confirmGroupBtn')!;

    confirm.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('did not confirm'));
    expect(confirm.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#createGroupBtn')!.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!.disabled).toBe(true);
    const messageCount = sendMessage.mock.calls.filter(([value]) => value.action === 'createGroup').length;
    document.querySelector<HTMLInputElement>('#groupNameInput')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'createGroup')).toHaveLength(messageCount);
    document.querySelector<HTMLButtonElement>('#cancelGroupBtn')!.click();
    expect(document.querySelector<HTMLButtonElement>('#createGroupBtn')!.disabled).toBe(true);
  });

  it('records the Konami sequence as a structured browser event', async () => {
    await createController().init();
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
    expect(sendMessage).toHaveBeenCalledWith({ action: 'recordBrowserEvent', event: 'KonamiCodeEntered' });
    expect(document.querySelector('#statusMessage')?.textContent).toContain('wombat noticed');
  });

  it('disarms the Lucky action after five seconds and requires two fresh clicks', async () => {
    let disarm: (() => void) | undefined;
    deps.setTimer = vi.fn((handler, timeout) => {
      disarm = handler;
      return 42 as unknown as ReturnType<typeof setTimeout>;
    });
    await createController().init();
    const lucky = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;

    lucky.click();
    expect(deps.setTimer).toHaveBeenCalledWith(expect.any(Function), 5000);
    expect(lucky.classList.contains('armed')).toBe(true);
    assert(disarm);
    disarm();

    expect(lucky.classList.contains('armed')).toBe(false);
    expect(lucky.textContent).toContain("I'm Feeling Lucky");
    lucky.click();
    await Promise.resolve();
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(0);
  });

  it('uses unique fallback checkbox ids for incomplete tab records', async () => {
    queryTabs.mockResolvedValueOnce(success([
      { title: 'Missing one' },
      { title: 'Missing two' }
    ]));
    await createController().init();
    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();

    await vi.waitFor(() => expect(document.querySelectorAll('#tabList input')).toHaveLength(2));
    const ids = [...document.querySelectorAll<HTMLInputElement>('#tabList input')].map(input => input.id);
    expect(ids).toEqual(['tab-unknown-0', 'tab-unknown-1']);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(id => document.querySelector(`label[for="${id}"]`))).toBe(true);
  });

  it('constructs against the required elements in the real popup document', async () => {
    const popupHtml = await readFile(path.resolve(process.cwd(), 'popup.html'), 'utf8');
    const parsed = new DOMParser().parseFromString(popupHtml, 'text/html');
    document.body.innerHTML = parsed.body.innerHTML;

    const created = PopupController.create(document, deps);
    expect(created.ok).toBe(true);
    if (created.ok) expect((await created.value.init()).ok).toBe(true);
  });

  it('returns a typed missing-element error instead of throwing', () => {
    document.querySelector('#quipCount')?.remove();

    const created = PopupController.create(document, deps);

    expect(created.ok).toBe(false);
    if (!created.ok) {
      expect(created.error).toEqual({
        type: 'MissingElement',
        details: 'Popup is missing required element #quipCount',
        selector: '#quipCount'
      });
    }
  });
});

describe('Chrome popup transport and mount failures', () => {
  afterEach(() => vi.useRealTimers());

  it('returns a typed timeout when the extension worker never responds', async () => {
    vi.useFakeTimers();
    const chromeApi = {
      runtime: {
        lastError: undefined,
        sendMessage: vi.fn()
      }
    } as unknown as typeof chrome;
    const responsePromise = createChromeDependencies(chromeApi)
      .sendMessage({ action: 'getStats' });

    await vi.advanceTimersByTimeAsync(5000);

    expect((await responsePromise).result).toEqual({
      ok: false,
      error: {
        type: 'TransportTimeout',
        details: 'The extension worker did not respond within 5 seconds'
      }
    });
  });

  it('settles only once when a late callback arrives after timeout', async () => {
    vi.useFakeTimers();
    let callback: ((response?: unknown) => void) | undefined;
    const chromeApi = {
      runtime: {
        lastError: undefined,
        sendMessage: vi.fn((_message, handler) => { callback = handler; })
      }
    } as unknown as typeof chrome;
    const responsePromise = createChromeDependencies(chromeApi)
      .sendMessage({ action: 'getStats' });
    await vi.advanceTimersByTimeAsync(5000);
    const timedOut = await responsePromise;

    callback?.(success({ late: true }));

    expect(timedOut.result).toMatchObject({
      ok: false,
      error: { type: 'TransportTimeout' }
    });
  });

  it('renders a visible fallback when the popup DOM contract is incomplete', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    document.body.innerHTML = '<main></main>';
    const chromeApi = { runtime: { sendMessage: vi.fn() } } as unknown as typeof chrome;

    const mounted = mountPopup(document, chromeApi);

    expect(mounted.ok).toBe(false);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('failed to load');
    consoleError.mockRestore();
  });
});
