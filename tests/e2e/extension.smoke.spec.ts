import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import type { AxeResults } from 'axe-core';
import { test, expect } from './extension.fixture';
import { popupSelectors as popup } from './selectors';

const require = createRequire(import.meta.url);

test('loads the MV3 worker and renders a usable popup without runtime errors', async ({
  extensionContext,
  extensionId,
  popupErrors,
  popupPage,
}) => {
  expect(extensionId).toHaveLength(32);
  expect(extensionContext.serviceWorkers()).toHaveLength(1);
  await expect(popupPage.locator(popup.title)).toHaveText('TabbyMcTabface');
  await expect(popupPage.locator(popup.feelingLuckyButton)).toBeVisible();
  await expect(popupPage.locator(popup.createGroupButton)).toBeVisible();
  await expect(popupPage.locator(popup.tabCount)).toHaveText(/^\d+$/u);
  await expect(popupPage.locator(popup.groupCount)).toHaveText(/^\d+$/u);
  await expect(popupPage.locator(popup.quipCount)).toHaveText(/^\d+$/u);
  expect(popupErrors).toEqual([]);
});

test('has no serious or critical WCAG A/AA violations in its default state', async ({ popupPage }) => {
  const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
  await popupPage.evaluate(axeSource);
  const results = await popupPage.evaluate(async () => {
    const axe = (globalThis as typeof globalThis & {
      axe: { run: (root: Document, options: unknown) => Promise<AxeResults> };
    }).axe;
    return axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
  });
  const releaseBlockingViolations = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  expect(releaseBlockingViolations).toEqual([]);
});

test('reinitializes after the MV3 service worker is terminated', async ({
  extensionContext,
  extensionId,
  popupPage,
}) => {
  const originalWorker = extensionContext.serviceWorkers()[0];
  expect(originalWorker).toBeDefined();
  const restartedWorker = extensionContext.waitForEvent('serviceworker', {
    predicate: worker => worker !== originalWorker,
    timeout: 15_000,
  });
  const controlPage = await extensionContext.newPage();
  const cdpSession = await extensionContext.newCDPSession(controlPage);
  const { targetInfos } = await cdpSession.send('Target.getTargets') as {
    targetInfos: Array<{ targetId: string; type: string; url: string }>;
  };
  const workerTarget = targetInfos.find(
    target => target.type === 'service_worker'
      && target.url.startsWith(`chrome-extension://${extensionId}/`),
  );
  expect(workerTarget).toBeDefined();

  await popupPage.close();
  await cdpSession.send('Target.closeTarget', { targetId: workerTarget!.targetId });
  await expect.poll(() => extensionContext.serviceWorkers().includes(originalWorker)).toBe(false);

  const restartedPopup = await extensionContext.newPage();
  await restartedPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(restartedPopup.locator(popup.root)).toBeVisible();
  await expect(restartedPopup.locator(popup.tabCount)).toHaveText(/^\d+$/u);
  await expect(restartedPopup.locator(popup.groupCount)).toHaveText(/^\d+$/u);
  expect(await restartedWorker).not.toBe(originalWorker);
  await controlPage.close();
});
