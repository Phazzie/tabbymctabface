/**
 * FILE: build.mjs
 *
 * WHAT: Creates a clean, bundled, load-unpacked Chrome extension directory.
 *
 * WHY: SEAM-REL-01/02 must turn TypeScript plus static assets into the exact
 * root-level runtime layout declared by manifest.json on every operating system.
 *
 * HOW DATA FLOWS:
 *   1. src/background.ts and src/ui/popup.ts cross SEAM-REL-01 through esbuild.
 *   2. manifest, popup markup/styles, icons, and assets cross SEAM-REL-02 by copy.
 *   3. validateDist proves every Chrome-facing path resolves before publishing.
 *
 * CONTRACT: ExtensionBuildArtifact v1.0.0
 * GENERATED: 2026-08-12
 */

import { cp, mkdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { validateDist } from './lib/release-artifacts.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), '..');

function invariant(condition, message) {
  if (!condition) throw new Error(`Build refused: ${message}`);
}

function assertSafeOutputDirectory(projectRoot, outDir) {
  const absoluteProjectRoot = path.resolve(projectRoot);
  const absoluteOutDir = path.resolve(outDir);
  const relative = path.relative(absoluteProjectRoot, absoluteOutDir);

  invariant(relative !== '', 'output directory cannot be the project root');
  invariant(!relative.startsWith('..') && !path.isAbsolute(relative), 'output directory must stay inside the project');
  invariant(path.basename(absoluteOutDir).length > 0, 'output directory must have a concrete basename');
}

async function copyIfPresent(sourcePath, destinationPath, options = {}) {
  try {
    await cp(sourcePath, destinationPath, options);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function copyStaticAssets(projectRoot, stagingDir) {
  const rootFiles = ['manifest.json', 'popup.html', 'popup.css'];
  await Promise.all(rootFiles.map((file) => cp(path.join(projectRoot, file), path.join(stagingDir, file))));

  await copyIfPresent(path.join(projectRoot, 'icons'), path.join(stagingDir, 'icons'), {
    recursive: true,
    filter: (source) => !/(?:^|[/\\])(?:README\.md|\.DS_Store)$/u.test(source),
  });

  const popupHtml = await readFile(path.join(projectRoot, 'popup.html'), 'utf8');
  const popupCss = await readFile(path.join(projectRoot, 'popup.css'), 'utf8');
  const documentAssets = [...popupHtml.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/giu)]
    .map((match) => match[1].split(/[?#]/u, 1)[0])
  const stylesheetAssets = [...popupCss.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/giu)]
    .map((match) => match[1].split(/[?#]/u, 1)[0]);
  const referencedAssets = [...new Set([...documentAssets, ...stylesheetAssets])]
    .filter((assetPath) => !/^(?:data:|[a-z]+:|\/\/|#)/iu.test(assetPath))
    .filter((assetPath) => !['popup.css', 'popup.js'].includes(assetPath));

  await Promise.all(referencedAssets.map(async (assetPath) => {
    const absoluteSource = path.resolve(projectRoot, assetPath);
    const relativeSource = path.relative(projectRoot, absoluteSource);
    invariant(
      relativeSource !== '' && !relativeSource.startsWith('..') && !path.isAbsolute(relativeSource),
      `static asset must stay inside the project: ${assetPath}`,
    );
    const absoluteDestination = path.join(stagingDir, relativeSource);
    await mkdir(path.dirname(absoluteDestination), { recursive: true });
    await copyIfPresent(absoluteSource, absoluteDestination);
  }));
}

export async function buildExtension({
  projectRoot = defaultProjectRoot,
  outDir = path.join(projectRoot, 'dist'),
  logLevel = 'info',
} = {}) {
  const absoluteProjectRoot = path.resolve(projectRoot);
  const absoluteOutDir = path.resolve(outDir);
  assertSafeOutputDirectory(absoluteProjectRoot, absoluteOutDir);

  const stagingDir = path.join(
    path.dirname(absoluteOutDir),
    `.${path.basename(absoluteOutDir)}-build-${process.pid}-${Date.now()}`,
  );
  assertSafeOutputDirectory(absoluteProjectRoot, stagingDir);

  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  try {
    await Promise.all([
      build({
        absWorkingDir: absoluteProjectRoot,
        bundle: true,
        charset: 'utf8',
        entryPoints: {
          background: 'src/background.ts',
          popup: 'src/ui/popup.ts',
        },
        entryNames: '[name]',
        format: 'iife',
        legalComments: 'none',
        logLevel,
        minify: false,
        outdir: stagingDir,
        platform: 'browser',
        sourcemap: false,
        target: ['chrome114'],
        treeShaking: true,
      }),
      copyStaticAssets(absoluteProjectRoot, stagingDir),
    ]);

    await validateDist(stagingDir);
    await rm(absoluteOutDir, { recursive: true, force: true });
    await rename(stagingDir, absoluteOutDir);
    return validateDist(absoluteOutDir);
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const report = await buildExtension();
  console.log(`Built ${report.files.length} extension files in ${report.distDir}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
