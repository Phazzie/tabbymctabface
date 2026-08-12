import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import type { AxeResults } from 'axe-core';
import { test, expect } from './extension.fixture';
import { popupSelectors as popup } from './selectors';

const require = createRequire(import.meta.url);

type ServiceWorkerVersion = {
  versionId: string;
  scriptURL: string;
  runningStatus: string;
};

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
  const controlPage = await extensionContext.newPage();
  const cdpSession = await extensionContext.newCDPSession(controlPage);
  const workerVersions = new Map<string, ServiceWorkerVersion>();
  const onVersionsUpdated = ({ versions }: { versions: ServiceWorkerVersion[] }): void => {
    for (const version of versions) {
      if (version.scriptURL.startsWith(`chrome-extension://${extensionId}/`)) {
        workerVersions.set(version.versionId, version);
      }
    }
  };
  cdpSession.on('ServiceWorker.workerVersionUpdated', onVersionsUpdated);
  await cdpSession.send('ServiceWorker.enable');
  await expect.poll(() => [...workerVersions.values()].find(
    version => version.runningStatus === 'running',
  )?.versionId).toBeTruthy();
  const workerVersion = [...workerVersions.values()].find(
    version => version.runningStatus === 'running',
  )!;

  await popupPage.close();
  await cdpSession.send('ServiceWorker.stopWorker', { versionId: workerVersion.versionId });
  await expect.poll(() => workerVersions.get(workerVersion.versionId)?.runningStatus)
    .toBe('stopped');

  const restartedPopup = await extensionContext.newPage();
  await restartedPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(restartedPopup.locator(popup.root)).toBeVisible();
  await expect(restartedPopup.locator(popup.tabCount)).toHaveText(/^\d+$/u);
  await expect(restartedPopup.locator(popup.groupCount)).toHaveText(/^\d+$/u);
  await expect.poll(() => workerVersions.get(workerVersion.versionId)?.runningStatus)
    .toBe('running');
  cdpSession.off('ServiceWorker.workerVersionUpdated', onVersionsUpdated);
  await cdpSession.send('ServiceWorker.disable');
  await controlPage.close();
});
