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
    exclude: ['src/contracts/__tests__/**'],
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
        'src/background.ts': { statements: 78, branches: 65, functions: 95, lines: 80 },
        'src/bootstrap.ts': { statements: 85, branches: 75, functions: 85, lines: 88 },
        'src/impl/EasterEggFramework.ts': { statements: 89, branches: 86, functions: 96, lines: 89 },
        'src/impl/HumorSystem.ts': { statements: 85, branches: 76, functions: 93, lines: 86 },
        'src/impl/TabManager.ts': { statements: 84, branches: 69, functions: 97, lines: 85 },
        'src/ui/popup.ts': { statements: 82, branches: 68, functions: 82, lines: 85 },
      },
    },
  },
});
