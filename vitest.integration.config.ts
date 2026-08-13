/**
 * FILE: vitest.integration.config.ts
 *
 * WHAT: Selects integration tests that exercise collaborating extension modules.
 * WHY: Cross-module seams need a separate deterministic verification tier.
 * HOW DATA FLOWS:
 *   1. Shared Vitest policy enters through SEAM-TEST-01.
 *   2. The integration glob crosses SEAM-TEST-01 into the Vitest runner.
 * SEAMS:
 *   IN: vitest.config -> integration configuration (SEAM-TEST-01)
 *   OUT: Integration configuration -> Vitest runner (SEAM-TEST-01)
 * CONTRACT: TestRunnerConfiguration v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

// === SEAM-TEST-01: Integration configuration -> Vitest runner ===
export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.integration.test.ts'],
  },
});
