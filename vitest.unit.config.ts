/**
 * FILE: vitest.unit.config.ts
 *
 * WHAT: Selects isolated unit and contract tests.
 * WHY: Fast feedback must exercise module behavior without integration-only fixtures.
 * HOW DATA FLOWS:
 *   1. Shared Vitest policy enters through SEAM-TEST-01.
 *   2. Unit globs cross SEAM-TEST-01 into the Vitest runner.
 * SEAMS:
 *   IN: vitest.config -> unit configuration (SEAM-TEST-01)
 *   OUT: Unit configuration -> Vitest runner (SEAM-TEST-01)
 * CONTRACT: TestRunnerConfiguration v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

// === SEAM-TEST-01: Unit configuration -> Vitest runner ===
export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
  },
});
