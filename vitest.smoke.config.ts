/**
 * FILE: vitest.smoke.config.ts
 *
 * WHAT: Selects release-artifact smoke contracts.
 * WHY: The packaged extension tree and ZIP need verification independent of module tests.
 * HOW DATA FLOWS:
 *   1. Shared Vitest policy enters through SEAM-TEST-01.
 *   2. Release smoke files cross SEAM-REL-03 into the Vitest runner.
 * SEAMS:
 *   IN: vitest.config -> smoke configuration (SEAM-TEST-01)
 *   OUT: Smoke configuration -> release-artifact tests (SEAM-REL-03)
 * CONTRACT: ExtensionReleaseArtifact v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

// === SEAM-REL-03: Smoke configuration -> release-artifact runner ===
export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['tests/smoke/**/*.smoke.test.ts'],
  },
});
