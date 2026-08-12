/**
 * @vitest-environment jsdom
 *
 * FILE: popup.test.ts
 * WHAT: Popup controller behavior and accessibility tests.
 * WHY: User input, destructive confirmation, runtime messaging, and DOM output cross the popup seam.
 * SEAMS: Popup DOM -> background runtime / chrome.tabs (SEAM-01, 06, 30)
 * CONTRACT: PopupController v1.1.0
 * GENERATED: 2026-08-12
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PopupController, type PopupDependencies } from './popup';

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

describe('PopupController', () => {
  let sendMessage: ReturnType<typeof vi.fn>;
  let queryTabs: ReturnType<typeof vi.fn>;
  let deps: PopupDependencies;

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
    queryTabs = vi.fn(async () => [{ id: 1, title: 'One', url: 'https://example.com' }]);
    deps = { sendMessage, queryTabs, setTimer: vi.fn(), clearTimer: vi.fn() };
  });

  it('initializes real browser/usage stats and records popup opening', async () => {
    await new PopupController(document, deps).init();
    expect(document.querySelector('#tabCount')?.textContent).toBe('7');
    expect(document.querySelector('#groupCount')?.textContent).toBe('2');
    expect(document.querySelector('#quipCount')?.textContent).toBe('11');
    expect(sendMessage).toHaveBeenCalledWith({ action: 'recordBrowserEvent', event: 'PopupOpened' });
  });

  it('requires two explicit Lucky clicks and reports the closed title and remaining count', async () => {
    await new PopupController(document, deps).init();
    const button = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;
    button.click();
    await Promise.resolve();
    expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(0);
    expect(button.textContent).toContain('Confirm');

    button.click();
    await vi.waitFor(() => expect(sendMessage.mock.calls.filter(([value]) => value.action === 'closeRandomTab')).toHaveLength(1));
    expect(document.querySelector('#statusMessage')?.textContent).toContain('A very important tab');
    expect(document.querySelector('#statusMessage')?.textContent).toContain('6');
    expect(button.disabled).toBe(false);
  });

  it('requires a fresh two-click confirmation after opening and cancelling group creation', async () => {
    await new PopupController(document, deps).init();
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
    await new PopupController(document, deps).init();
    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#tab-1')).not.toBeNull());
    const checkbox = document.querySelector<HTMLInputElement>('#tab-1')!;
    expect(document.querySelector(`label[for="${checkbox.id}"]`)).not.toBeNull();

    document.querySelector<HTMLButtonElement>('#confirmGroupBtn')!.click();
    expect(document.querySelector('#statusMessage')?.textContent).toContain('name');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('#groupCreator')?.classList.contains('hidden')).toBe(true);
  });

  it('creates a valid group and re-enables the confirm button', async () => {
    await new PopupController(document, deps).init();
    document.querySelector<HTMLButtonElement>('#createGroupBtn')!.click();
    await vi.waitFor(() => expect(document.querySelector('#tab-1')).not.toBeNull());
    const checkbox = document.querySelector<HTMLInputElement>('#tab-1')!;
    checkbox.click();
    const input = document.querySelector<HTMLInputElement>('#groupNameInput')!;
    input.value = 'Work';
    const confirm = document.querySelector<HTMLButtonElement>('#confirmGroupBtn')!;
    confirm.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('created'));
    expect(confirm.disabled).toBe(false);
    expect(document.querySelector('#groupCreator')?.classList.contains('hidden')).toBe(true);
  });

  it('surfaces query failures (including chrome.runtime.lastError wrappers) and restores controls', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    queryTabs.mockRejectedValueOnce(new Error('The message port closed'));
    await new PopupController(document, deps).init();
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
    await new PopupController(document, deps).init();
    const lucky = document.querySelector<HTMLButtonElement>('#feelingLuckyBtn')!;
    lucky.click();
    lucky.click();

    await vi.waitFor(() => expect(document.querySelector('#statusMessage')?.textContent).toContain('protected'));
    expect(lucky.disabled).toBe(false);
  });

  it('records the Konami sequence as a structured browser event', async () => {
    await new PopupController(document, deps).init();
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
    expect(sendMessage).toHaveBeenCalledWith({ action: 'recordBrowserEvent', event: 'KonamiCodeEntered' });
    expect(document.querySelector('#statusMessage')?.textContent).toContain('wombat noticed');
  });
});
