/**
 * FILE: playwright.config.ts
 *
 * WHAT: Configures the persistent-Chromium Manifest V3 end-to-end suite.
 * WHY: Browser verification must load the exact packaged extension through a repeatable runner seam.
 * HOW DATA FLOWS:
 *   1. Playwright discovers tests/e2e through SEAM-E2E-01.
 *   2. The runner supplies retry, artifact, and timeout policy to each extension fixture.
 * SEAMS:
 *   IN: npm test:e2e -> Playwright configuration (SEAM-E2E-01)
 *   OUT: Playwright configuration -> extension E2E fixtures (SEAM-E2E-01)
 * CONTRACT: LoadedMV3Extension v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { defineConfig } from '@playwright/test';

// === SEAM-E2E-01: Playwright configuration -> extension E2E runner ===
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  globalSetup: './tests/e2e/global-setup.ts',
  outputDir: 'test-results/playwright',
  reporter: process.env.CI
    ? [['line'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
