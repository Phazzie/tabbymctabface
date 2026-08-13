/**
 * FILE: vitest.config.ts
 *
 * WHAT: Defines shared defaults for every Vitest verification tier.
 * WHY: Unit, integration, coverage, and smoke runners require one consistent execution contract.
 * HOW DATA FLOWS:
 *   1. Specialized configs import commonTestConfig through SEAM-TEST-01.
 *   2. Vitest applies the shared isolation and timeout policy to discovered tests.
 * SEAMS:
 *   IN: Specialized Vitest configs -> shared configuration (SEAM-TEST-01)
 *   OUT: Shared configuration -> Vitest runner (SEAM-TEST-01)
 * CONTRACT: TestRunnerConfiguration v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { defineConfig } from 'vitest/config';

// === SEAM-TEST-01: Shared configuration -> Vitest runner ===
export const commonTestConfig = {
  globals: true,
  environment: 'node' as const,
  clearMocks: true,
  mockReset: true,
  restoreMocks: true,
  passWithNoTests: false,
  testTimeout: 10_000,
  hookTimeout: 30_000,
};

export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
  },
});
