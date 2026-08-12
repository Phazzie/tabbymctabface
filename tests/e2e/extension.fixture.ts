/**
 * FILE: extension.fixture.ts
 *
 * WHAT: Loads the built MV3 extension in an isolated persistent Chromium profile.
 *
 * WHY: SEAM-E2E-01 must exercise the real service worker, chrome APIs, and popup
 * together; a regular web page or mocked browser cannot prove that runtime seam.
 *
 * CONTRACT: LoadedMV3Extension v1.0.0
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  chromium,
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { popupSelectors } from './selectors';

type ExtensionFixtures = {
  extensionContext: BrowserContext;
  extensionId: string;
  popupPage: Page;
  popupErrors: string[];
};

const extensionPath = path.resolve(import.meta.dirname, '../../dist');

export const test = base.extend<ExtensionFixtures>({
  extensionContext: async ({ browserName }, use) => {
    expect(browserName).toBe('chromium');
    const userDataDir = await mkdtemp(path.join(tmpdir(), 'tabbymctabface-playwright-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: process.env.HEADED !== '1',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      await use(context);
    } finally {
      await context.close();
      await rm(userDataDir, { recursive: true, force: true });
    }
  },

  extensionId: async ({ extensionContext }, use) => {
    let serviceWorker = extensionContext.serviceWorkers()[0];
    serviceWorker ??= await extensionContext.waitForEvent('serviceworker', { timeout: 15_000 });
    const extensionId = new URL(serviceWorker.url()).host;
    expect(extensionId).toMatch(/^[a-p]{32}$/u);
    await use(extensionId);
  },

  popupErrors: async ({ browserName: _browserName }, use) => {
    await use([]);
  },

  popupPage: async ({ extensionContext, extensionId, popupErrors }, use) => {
    const page = await extensionContext.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') popupErrors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => popupErrors.push(`pageerror: ${error.message}`));

    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.locator(popupSelectors.root)).toBeVisible();
    await expect(page.locator(popupSelectors.tabCount)).toHaveText(/^\d+$/u);
    await use(page);
  },
});

export { expect } from '@playwright/test';
