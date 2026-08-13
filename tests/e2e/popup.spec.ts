/**
 * FILE: popup.spec.ts
 *
 * WHAT: Exercises destructive confirmation, group creation, and hidden-event flows in real Chromium.
 * WHY: Popup behavior must cross the UI/background/Chrome seams using production bundles and APIs.
 * HOW DATA FLOWS:
 *   1. Playwright drives popup DOM controls through SEAM-E2E-01.
 *   2. Runtime responses and Chrome tab state return to visible assertions.
 * SEAMS:
 *   IN: Loaded extension fixture -> popup interactions (SEAM-E2E-01)
 *   OUT: Popup interactions -> Chrome/runtime verification (SEAM-E2E-01)
 * CONTRACT: PopupController v1.2.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { test, expect } from './extension.fixture';
import { popupSelectors as popup } from './selectors';

test('validates group input and creates a real Chrome tab group', async ({ popupPage }) => {
  await popupPage.locator(popup.createGroupButton).click();
  await expect(popupPage.locator(popup.groupCreator)).toBeVisible();

  await popupPage.locator(popup.confirmGroupButton).click();
  await expect(popupPage.locator(popup.statusText)).toHaveText(/name cannot be empty/i);

  await popupPage.locator(popup.groupNameInput).fill('E2E Wombat Burrow');
  await popupPage.locator(popup.confirmGroupButton).click();
  await expect(popupPage.locator(popup.statusText)).toHaveText(/select at least one tab/i);

  const tabChoices = popupPage.locator(popup.tabCheckboxes);
  expect(await tabChoices.count()).toBeGreaterThan(0);
  await tabChoices.first().check();
  await popupPage.locator(popup.confirmGroupButton).click();

  await expect(popupPage.locator(popup.statusText)).toHaveText(/created with 1 tab/i);
  await expect(popupPage.locator(popup.groupCreator)).toBeHidden();
  await expect(popupPage.locator(popup.groupCount)).toHaveText(/^[1-9]\d*$/u);
});

test('Feeling Lucky closes one eligible tab in the isolated browser profile', async ({
  extensionContext,
  popupPage,
}) => {
  const expendablePage = await extensionContext.newPage();
  await expendablePage.goto('about:blank');
  await popupPage.bringToFront();
  const pageCountBefore = extensionContext.pages().length;

  await popupPage.locator(popup.feelingLuckyButton).click();
  await expect(popupPage.locator(popup.statusText)).toHaveText(/one more click closes/i);
  await popupPage.locator(popup.feelingLuckyButton).click();

  await expect(popupPage.locator(popup.statusText)).toHaveText(/^Closed /u);
  await expect.poll(() => extensionContext.pages().length).toBe(pageCountBefore - 1);
});

test('Konami input crosses the event seam and delivers its exact easter egg', async ({ popupPage }) => {
  const readQuipCount = () => popupPage.evaluate(async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    if (!response?.result?.ok) throw new Error('Could not read usage stats');
    return response.result.value.usage.quipsDelivered as number;
  });
  const before = await readQuipCount();

  for (const key of [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
  ]) {
    await popupPage.keyboard.press(key);
  }

  await expect(popupPage.locator(popup.statusText)).toHaveText(/wombat noticed/i);
  await expect.poll(readQuipCount).toBeGreaterThan(before);
});
