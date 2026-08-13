/**
 * FILE: global-setup.ts
 *
 * WHAT: Builds and validates the exact extension directory loaded by Playwright.
 * WHY: E2E must exercise current source bytes rather than a stale local dist tree.
 * HOW DATA FLOWS:
 *   1. Repository source crosses SEAM-REL-01/02 into dist.
 *   2. The validated dist path crosses SEAM-E2E-01 into the browser fixture.
 * SEAMS:
 *   IN: Playwright runner -> global build setup (SEAM-E2E-01)
 *   OUT: Global build setup -> validated dist (SEAM-REL-01/02)
 * CONTRACT: LoadedMV3Extension v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import path from 'node:path';
import { buildExtension } from '../../scripts/build.mjs';

/**
 * Build the extension before any browser fixture starts.
 *
 * INPUT: Playwright global setup invocation.
 * OUTPUT: A validated repository-local dist directory.
 * SEAM: SEAM-E2E-01 -> SEAM-REL-01/02.
 * ERRORS: Build validation failures reject setup and stop the suite.
 * PERFORMANCE: One build per E2E invocation.
 */
export default async function globalSetup(): Promise<void> {
  // === SEAM-E2E-01: Playwright global setup -> extension build ===
  const projectRoot = path.resolve(import.meta.dirname, '../..');
  await buildExtension({
    projectRoot,
    outDir: path.join(projectRoot, 'dist'),
    logLevel: 'silent',
  });
}
