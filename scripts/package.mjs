/**
 * FILE: package.mjs
 * WHAT: Builds and packages one deterministic Chrome Web Store ZIP from dist root.
 * SEAMS: Source → dist → ZIP (SEAM-REL-01/02/03)
 * CONTRACT: ExtensionReleaseArtifact v1.0.0
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildExtension } from './build.mjs';
import { packageExtension } from './lib/release-artifacts.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

async function main() {
  const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  const distDir = path.join(projectRoot, 'dist');
  const zipPath = path.join(projectRoot, `TabbyMcTabface-v${packageJson.version}.zip`);

  await buildExtension({ projectRoot, outDir: distDir });
  const report = await packageExtension({ distDir, zipPath });
  console.log(`Packaged ${report.files.length} files to ${report.zipPath}`);
  console.log(`SHA-256: ${report.sha256}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
