#!/usr/bin/env node
/**
 * Verify Chrome extension build and package path expectations.
 *
 * This intentionally validates the built `dist/` directory as the extension
 * root, so manifest and popup paths must not include a `dist/` prefix.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const distDir = 'dist';
const packageFile = 'TabbyMcTabface-v1.0.0.zip';

const failures = [];

function fail(message) {
  failures.push(message);
}

function requireFile(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`Missing required file: ${path}`);
  }
}

function requireNoDistPrefix(label, value) {
  if (typeof value === 'string' && value.includes('dist/')) {
    fail(`${label} must not include a dist/ prefix: ${value}`);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readZipFile(zipPath, filePath) {
  return execFileSync('unzip', ['-p', zipPath, filePath], { encoding: 'utf8' });
}

function listZip(zipPath) {
  return execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

const requiredDistFiles = [
  'background.js',
  'manifest.json',
  'popup.css',
  'popup.html',
  'popup.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

for (const file of requiredDistFiles) {
  requireFile(join(distDir, file));
}

if (existsSync(join(distDir, 'ui'))) {
  fail('Duplicate popup output directory must not exist: dist/ui');
}

const popupJsPath = join(distDir, 'popup.js');
if (existsSync(popupJsPath)) {
  const popupJs = readFileSync(popupJsPath, 'utf8');
  const popupControllerMarkers = [
    'async function init()',
    'async function updateStats()',
    'async function handleFeelingLucky()',
    'async function handleCreateGroup()',
    'chrome.runtime.sendMessage',
    'DOMContentLoaded',
  ];

  for (const marker of popupControllerMarkers) {
    if (!popupJs.includes(marker)) {
      fail(`dist/popup.js is missing compiled popup controller marker: ${marker}`);
    }
  }
}

const manifestPath = join(distDir, 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = readJson(manifestPath);
  const serviceWorker = manifest.background?.service_worker;

  if (serviceWorker !== 'background.js') {
    fail(`dist/manifest.json background.service_worker must be background.js, got: ${serviceWorker}`);
  }

  requireNoDistPrefix('dist/manifest.json background.service_worker', serviceWorker);

  for (const [size, iconPath] of Object.entries(manifest.icons ?? {})) {
    requireNoDistPrefix(`dist/manifest.json icons.${size}`, iconPath);
    requireFile(join(distDir, iconPath));
  }

  for (const [size, iconPath] of Object.entries(manifest.action?.default_icon ?? {})) {
    requireNoDistPrefix(`dist/manifest.json action.default_icon.${size}`, iconPath);
    requireFile(join(distDir, iconPath));
  }
}

const popupHtmlPath = join(distDir, 'popup.html');
if (existsSync(popupHtmlPath)) {
  const popupHtml = readFileSync(popupHtmlPath, 'utf8');
  if (!popupHtml.includes('<script src="popup.js"></script>')) {
    fail('dist/popup.html must reference popup.js');
  }
  if (!popupHtml.includes('href="popup.css"')) {
    fail('dist/popup.html must reference popup.css');
  }
  if (popupHtml.includes('dist/')) {
    fail('dist/popup.html must not include dist/ prefixes');
  }
}

if (existsSync(packageFile)) {
  const zipEntries = listZip(packageFile);
  const zipEntrySet = new Set(zipEntries);

  for (const file of requiredDistFiles) {
    if (!zipEntrySet.has(file)) {
      fail(`Package is missing required file: ${file}`);
    }
  }

  const distPrefixedEntries = zipEntries.filter((entry) => entry.startsWith('dist/'));
  if (distPrefixedEntries.length > 0) {
    fail(`Package entries must not be dist/-prefixed: ${distPrefixedEntries.join(', ')}`);
  }

  const packagedManifest = JSON.parse(readZipFile(packageFile, 'manifest.json'));
  const packagedServiceWorker = packagedManifest.background?.service_worker;
  if (packagedServiceWorker !== 'background.js') {
    fail(`Packaged manifest background.service_worker must be background.js, got: ${packagedServiceWorker}`);
  }
  requireNoDistPrefix('packaged manifest background.service_worker', packagedServiceWorker);

  const packagedPopupHtml = readZipFile(packageFile, 'popup.html');
  if (!packagedPopupHtml.includes('<script src="popup.js"></script>')) {
    fail('Packaged popup.html must reference popup.js');
  }
  if (packagedPopupHtml.includes('dist/')) {
    fail('Packaged popup.html must not include dist/ prefixes');
  }
} else {
  console.warn(`Package ${packageFile} not found; skipping archive checks.`);
}

if (failures.length > 0) {
  console.error('Build artifact verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Build artifact verification passed.');
