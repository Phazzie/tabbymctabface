/**
 * FILE: validate.mjs
 * WHAT: CLI adapter for strict dist and optional ZIP validation.
 * SEAMS: CLI → ExtensionReleaseArtifact (SEAM-REL-03)
 * CONTRACT: ExtensionReleaseArtifact v1.0.0
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  validateChecksumFile,
  validateDist,
  validateZip,
} from './lib/release-artifacts.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const distDir = path.resolve(optionValue('--dist') ?? path.join(projectRoot, 'dist'));
  const zipArgument = optionValue('--zip');
  const tag = optionValue('--tag');
  const report = zipArgument
    ? await validateZip(path.resolve(zipArgument), distDir)
    : await validateDist(distDir);
  if (zipArgument) {
    await validateChecksumFile(report);
  }

  const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  if (report.manifest.version !== packageJson.version) {
    throw new Error(`Version mismatch: manifest ${report.manifest.version}, package ${packageJson.version}`);
  }
  if (tag && tag !== `v${packageJson.version}`) {
    throw new Error(`Tag mismatch: expected v${packageJson.version}, received ${tag}`);
  }

  console.log(`Validated ${report.files.length} files${report.sha256 ? ` (sha256 ${report.sha256})` : ''}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
