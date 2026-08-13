/**
 * FILE: vitest.coverage.config.ts
 *
 * WHAT: Configures executable coverage thresholds for production TypeScript.
 * WHY: Release verification must detect behavior that falls outside the tested contract surface.
 * HOW DATA FLOWS:
 *   1. Shared Vitest policy enters through SEAM-TEST-01.
 *   2. V8 coverage crosses SEAM-TEST-01 into threshold enforcement and reports.
 * SEAMS:
 *   IN: vitest.config -> coverage configuration (SEAM-TEST-01)
 *   OUT: Coverage configuration -> Vitest/V8 runner (SEAM-TEST-01)
 * CONTRACT: TestRunnerConfiguration v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

// === SEAM-TEST-01: Coverage configuration -> Vitest/V8 runner ===
export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/contracts/**',
        'src/mocks/**',
      ],
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 77,
        functions: 80,
        statements: 76,
        branches: 70,
      },
    },
  },
});
