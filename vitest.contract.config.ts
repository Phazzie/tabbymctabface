/**
 * FILE: vitest.contract.config.ts
 *
 * WHAT: Runs compile-time and shape-oriented contract examples as their own tier.
 * WHY: Contract examples are useful, but counting them as unit behavior hid weak seams.
 * HOW DATA FLOWS:
 *   1. Shared Vitest policy enters through SEAM-TEST-01.
 *   2. Contract-only globs enter the Vitest runner as a separately reported gate.
 * SEAMS:
 *   IN: vitest.config -> contract configuration (SEAM-TEST-01)
 *   OUT: Contract configuration -> Vitest runner (SEAM-TEST-01)
 * CONTRACT: TestRunnerConfiguration v1.0.0
 * GENERATED: 2026-08-12
 */

import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/contracts/__tests__/**/*.test.ts'],
  },
});
