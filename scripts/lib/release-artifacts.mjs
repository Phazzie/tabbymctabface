/**
 * FILE: release-artifacts.mjs
 *
 * WHAT: Validates and packages the exact Chrome extension release tree.
 *
 * WHY: SEAM-REL-03 must fail closed if dist or its ZIP is incomplete, unsafe,
 * stale, or different from the bytes Chrome was tested against.
 *
 * HOW DATA FLOWS:
 *   1. validateDist accepts one explicit dist directory and resolves runtime paths.
 *   2. packageExtension reads only files beneath that validated directory.
 *   3. validateZip checks central-directory paths, entry parity, and byte parity.
 *
 * SEAMS: IN: dist filesystem (SEAM-REL-03); OUT: release ZIP (SEAM-REL-03)
 * CONTRACT: ExtensionReleaseArtifact v1.0.0
 * GENERATED: 2026-08-12
 */

import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { unzipSync, zipSync } from 'fflate';

const REQUIRED_ICON_SIZES = ['16', '32', '48', '128'];
const REQUIRED_ROOT_FILES = [
  'background.js',
  'manifest.json',
  'popup.css',
  'popup.html',
  'popup.js',
];
const RESERVED_REOPEN_TAB_SHORTCUTS = new Set([
  'command+shift+t',
  'ctrl+shift+t',
  'macctrl+shift+t',
]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const LOCAL_MODULE_SPECIFIER = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']\.{1,2}\//gu;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`Release artifact validation failed: ${message}`);
  }
}

function createZipEpoch() {
  // ZIP stores a timezone-free DOS date. Constructing local midnight keeps the
  // encoded fields identical regardless of the machine's configured timezone.
  return new Date(2000, 0, 1, 0, 0, 0, 0);
}

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

export function assertSafeArchivePath(entryName) {
  invariant(typeof entryName === 'string' && entryName.length > 0, 'ZIP contains an empty path');
  invariant(!entryName.includes('\\'), `ZIP path uses a backslash: ${entryName}`);
  invariant(!entryName.includes('\0'), `ZIP path contains a NUL byte: ${entryName}`);
  invariant(!entryName.endsWith('/'), `ZIP contains an unexpected directory entry: ${entryName}`);
  invariant(!path.posix.isAbsolute(entryName), `ZIP path is absolute: ${entryName}`);
  invariant(!/^[a-zA-Z]:/.test(entryName), `ZIP path has a drive prefix: ${entryName}`);

  const segments = entryName.split('/');
  invariant(
    segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..'),
    `ZIP path can escape the artifact root: ${entryName}`,
  );
}

export async function listRelativeFiles(rootDir) {
  const absoluteRoot = path.resolve(rootDir);
  const rootStat = await lstat(absoluteRoot).catch(() => null);
  invariant(rootStat?.isDirectory(), `directory does not exist: ${absoluteRoot}`);
  invariant(!rootStat.isSymbolicLink(), `artifact root cannot be a symbolic link: ${absoluteRoot}`);

  const files = [];

  async function walk(currentDir, relativeDir = '') {
    const entries = await readdir(currentDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = normalizeRelativePath(path.join(relativeDir, entry.name));

      invariant(!entry.isSymbolicLink(), `symbolic links are not allowed in dist: ${relativePath}`);
      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else {
        invariant(entry.isFile(), `unsupported filesystem entry in dist: ${relativePath}`);
        assertSafeArchivePath(relativePath);
        files.push(relativePath);
      }
    }
  }

  await walk(absoluteRoot);
  return files.sort((left, right) => left.localeCompare(right, 'en'));
}

function collectManifestRuntimePaths(manifest) {
  const runtimePaths = new Set();
  const addPath = (value, label) => {
    invariant(typeof value === 'string' && value.length > 0, `${label} must be a non-empty path`);
    assertSafeArchivePath(value);
    runtimePaths.add(value);
  };

  addPath(manifest.background?.service_worker, 'background.service_worker');
  addPath(manifest.action?.default_popup, 'action.default_popup');

  for (const [size, iconPath] of Object.entries(manifest.icons ?? {})) {
    addPath(iconPath, `icons.${size}`);
  }
  for (const [size, iconPath] of Object.entries(manifest.action?.default_icon ?? {})) {
    addPath(iconPath, `action.default_icon.${size}`);
  }

  return runtimePaths;
}

function normalizeShortcut(shortcut) {
  return String(shortcut).replaceAll(' ', '').toLowerCase();
}

function validateCommandSafety(manifest) {
  const executeAction = manifest.commands?._execute_action;
  invariant(executeAction, 'commands._execute_action is required');
  const suggestedKeys = executeAction.suggested_key ?? {};

  for (const shortcut of Object.values(suggestedKeys)) {
    invariant(
      !RESERVED_REOPEN_TAB_SHORTCUTS.has(normalizeShortcut(shortcut)),
      '_execute_action cannot collide with the browser reopen-tab shortcut',
    );
  }
  invariant(suggestedKeys.default === 'Ctrl+Shift+Y', '_execute_action.default must be Ctrl+Shift+Y');
  invariant(suggestedKeys.mac === 'Command+Shift+Y', '_execute_action.mac must be Command+Shift+Y');

  const feelingLucky = manifest.commands?.feeling_lucky;
  invariant(feelingLucky, 'commands.feeling_lucky must remain registered');
  invariant(
    !Object.hasOwn(feelingLucky, 'suggested_key'),
    'destructive feeling_lucky command must not claim a default keyboard shortcut',
  );
}

function extractLocalDocumentPaths(documentText) {
  const paths = new Set();
  const attributePattern = /(?:src|href)\s*=\s*["']([^"']+)["']/giu;

  for (const match of documentText.matchAll(attributePattern)) {
    const candidate = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/iu.test(candidate)) continue;
    paths.add(candidate.split(/[?#]/u, 1)[0]);
  }

  return paths;
}

function extractLocalStylesheetPaths(stylesheetText) {
  const paths = new Set();
  const urlPattern = /url\(\s*["']?([^"')]+)["']?\s*\)/giu;

  for (const match of stylesheetText.matchAll(urlPattern)) {
    const candidate = match[1];
    if (/^(?:data:|[a-z]+:|\/\/|#)/iu.test(candidate)) continue;
    paths.add(candidate.split(/[?#]/u, 1)[0]);
  }

  return paths;
}

async function assertReferencedFile(distDir, fileSet, relativePath, sourceLabel) {
  assertSafeArchivePath(relativePath);
  invariant(fileSet.has(relativePath), `${sourceLabel} references missing file: ${relativePath}`);
  const fileStat = await lstat(path.join(distDir, relativePath));
  invariant(fileStat.isFile() && !fileStat.isSymbolicLink(), `${relativePath} must be a regular file`);
  invariant(fileStat.size > 0, `${relativePath} must not be empty`);
}

function validatePngIcon(bytes, expectedSize, iconPath) {
  invariant(bytes.length >= 26, `${iconPath} is too short to be a PNG`);
  invariant(bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE), `${iconPath} is not a PNG`);
  invariant(bytes.toString('ascii', 12, 16) === 'IHDR', `${iconPath} has no PNG IHDR header`);

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colourType = bytes[25];
  const hasTransparencyChunk = bytes.indexOf(Buffer.from('tRNS', 'ascii'), 8) >= 0;
  invariant(
    width === expectedSize && height === expectedSize,
    `${iconPath} must be exactly ${expectedSize}x${expectedSize}, received ${width}x${height}`,
  );
  invariant(
    colourType === 4 || colourType === 6 || (colourType === 3 && hasTransparencyChunk),
    `${iconPath} must include an alpha channel or transparency palette`,
  );
}

export async function validateDist(distDir) {
  const absoluteDistDir = path.resolve(distDir);
  const files = await listRelativeFiles(absoluteDistDir);
  const fileSet = new Set(files);

  for (const requiredFile of REQUIRED_ROOT_FILES) {
    await assertReferencedFile(absoluteDistDir, fileSet, requiredFile, 'release contract');
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(absoluteDistDir, 'manifest.json'), 'utf8'));
  } catch (error) {
    throw new Error(`Release artifact validation failed: manifest.json is invalid JSON (${error.message})`, {
      cause: error,
    });
  }

  invariant(manifest.manifest_version === 3, 'manifest_version must be 3');
  invariant(typeof manifest.name === 'string' && manifest.name.length > 0, 'manifest.name is required');
  invariant(/^\d+(?:\.\d+){0,3}$/u.test(manifest.version ?? ''), 'manifest.version is invalid');
  invariant(manifest.background?.service_worker === 'background.js', 'service worker must be root background.js');
  invariant(manifest.background?.type === 'module', 'background service worker must use module type');
  invariant(manifest.action?.default_popup === 'popup.html', 'default popup must be root popup.html');
  validateCommandSafety(manifest);

  for (const size of REQUIRED_ICON_SIZES) {
    invariant(manifest.icons?.[size], `manifest icon ${size} is required`);
    invariant(manifest.action?.default_icon?.[size], `action icon ${size} is required`);
    invariant(
      manifest.action.default_icon[size] === manifest.icons[size],
      `manifest and action icon ${size} must reference the same asset`,
    );

    const iconPath = manifest.icons[size];
    const iconBytes = await readFile(path.join(absoluteDistDir, iconPath));
    validatePngIcon(iconBytes, Number(size), iconPath);
  }

  const manifestPaths = collectManifestRuntimePaths(manifest);
  for (const runtimePath of manifestPaths) {
    await assertReferencedFile(absoluteDistDir, fileSet, runtimePath, 'manifest.json');
  }

  const popupPath = manifest.action.default_popup;
  const popupText = await readFile(path.join(absoluteDistDir, popupPath), 'utf8');
  const popupDirectory = path.posix.dirname(popupPath);
  for (const documentPath of extractLocalDocumentPaths(popupText)) {
    const resolvedPath = path.posix.normalize(path.posix.join(popupDirectory, documentPath));
    await assertReferencedFile(absoluteDistDir, fileSet, resolvedPath, popupPath);
  }

  for (const cssFile of files.filter((file) => file.endsWith('.css'))) {
    const cssText = await readFile(path.join(absoluteDistDir, cssFile), 'utf8');
    const cssDirectory = path.posix.dirname(cssFile);
    for (const assetPath of extractLocalStylesheetPaths(cssText)) {
      const resolvedPath = path.posix.normalize(path.posix.join(cssDirectory, assetPath));
      await assertReferencedFile(absoluteDistDir, fileSet, resolvedPath, cssFile);
    }
  }

  for (const bundlePath of ['background.js', 'popup.js']) {
    const bundleText = await readFile(path.join(absoluteDistDir, bundlePath), 'utf8');
    invariant(
      !LOCAL_MODULE_SPECIFIER.test(bundleText),
      `${bundlePath} contains an unresolved local module import`,
    );
    LOCAL_MODULE_SPECIFIER.lastIndex = 0;
  }

  const sourceLeaks = files.filter((file) => /(?:^|\/)(?:src|tests?|scripts)\//u.test(file) || /\.(?:ts|tsx|map)$/u.test(file));
  invariant(sourceLeaks.length === 0, `dist contains source-only files: ${sourceLeaks.join(', ')}`);

  return { distDir: absoluteDistDir, files, manifest };
}

function readCentralDirectoryEntryNames(zipBytes) {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const minimumEndRecordSize = 22;
  const firstPossibleOffset = Math.max(0, zipBytes.byteLength - minimumEndRecordSize - 65_535);
  let endRecordOffset = -1;

  for (let offset = zipBytes.byteLength - minimumEndRecordSize; offset >= firstPossibleOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endRecordOffset = offset;
      break;
    }
  }

  invariant(endRecordOffset >= 0, 'ZIP end-of-central-directory record is missing');
  invariant(view.getUint16(endRecordOffset + 4, true) === 0, 'multi-disk ZIPs are not allowed');
  invariant(view.getUint16(endRecordOffset + 6, true) === 0, 'multi-disk ZIPs are not allowed');

  const entriesOnDisk = view.getUint16(endRecordOffset + 8, true);
  const totalEntries = view.getUint16(endRecordOffset + 10, true);
  const centralDirectorySize = view.getUint32(endRecordOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(endRecordOffset + 16, true);
  const commentLength = view.getUint16(endRecordOffset + 20, true);
  invariant(entriesOnDisk === totalEntries, 'ZIP entry counts do not match');
  invariant(totalEntries !== 0xffff, 'ZIP64 archives are not supported');
  invariant(endRecordOffset + minimumEndRecordSize + commentLength === zipBytes.byteLength, 'ZIP has trailing data');
  invariant(centralDirectoryOffset + centralDirectorySize === endRecordOffset, 'ZIP central directory bounds are invalid');

  const names = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    invariant(offset + 46 <= endRecordOffset, 'ZIP central directory entry is truncated');
    invariant(view.getUint32(offset, true) === 0x02014b50, 'ZIP central directory signature is invalid');
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    invariant(nameEnd <= endRecordOffset, 'ZIP entry name is truncated');
    const entryName = decoder.decode(zipBytes.subarray(nameStart, nameEnd));
    assertSafeArchivePath(entryName);
    names.push(entryName);
    offset = nameEnd + extraLength + entryCommentLength;
  }

  invariant(offset === endRecordOffset, 'ZIP central directory contains unparsed data');
  invariant(new Set(names).size === names.length, 'ZIP contains duplicate entry names');
  return names;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function checksumLine(zipReport) {
  return `${zipReport.sha256}  ${path.basename(zipReport.zipPath)}\n`;
}

export async function validateChecksumFile(zipReport, checksumPath = `${zipReport.zipPath}.sha256`) {
  const absoluteChecksumPath = path.resolve(checksumPath);
  const actualChecksum = await readFile(absoluteChecksumPath, 'utf8').catch(() => null);
  invariant(actualChecksum !== null, `checksum file is missing: ${absoluteChecksumPath}`);
  invariant(actualChecksum === checksumLine(zipReport), 'checksum file does not match the release ZIP');
  return absoluteChecksumPath;
}

export async function validateZip(zipPath, distDir) {
  const distReport = await validateDist(distDir);
  const zipBytes = await readFile(path.resolve(zipPath));
  invariant(zipBytes.length > 0, 'ZIP must not be empty');

  const centralDirectoryNames = readCentralDirectoryEntryNames(zipBytes);
  const zipFiles = [...centralDirectoryNames].sort((left, right) => left.localeCompare(right, 'en'));
  invariant(
    JSON.stringify(zipFiles) === JSON.stringify(distReport.files),
    'ZIP entries do not exactly match dist files',
  );

  let unzipped;
  try {
    unzipped = unzipSync(zipBytes);
  } catch (error) {
    throw new Error(`Release artifact validation failed: ZIP cannot be read (${error.message})`, {
      cause: error,
    });
  }

  for (const relativePath of distReport.files) {
    const distBytes = await readFile(path.join(distReport.distDir, relativePath));
    const zipEntry = unzipped[relativePath];
    invariant(zipEntry, `ZIP is missing ${relativePath}`);
    invariant(Buffer.from(zipEntry).equals(distBytes), `ZIP content mismatch for ${relativePath}`);
  }

  return {
    files: zipFiles,
    manifest: distReport.manifest,
    sha256: sha256(zipBytes),
    size: zipBytes.length,
    zipPath: path.resolve(zipPath),
  };
}

export async function packageExtension({ distDir, zipPath }) {
  const distReport = await validateDist(distDir);
  const archiveEntries = {};
  const zipEpoch = createZipEpoch();

  for (const relativePath of distReport.files) {
    const bytes = await readFile(path.join(distReport.distDir, relativePath));
    archiveEntries[relativePath] = [bytes, {
      attrs: 0o644 << 16,
      level: 9,
      mtime: zipEpoch,
      os: 3,
    }];
  }

  const zipBytes = zipSync(archiveEntries, {
    level: 9,
    mtime: zipEpoch,
  });
  await writeFile(path.resolve(zipPath), zipBytes);
  const report = await validateZip(zipPath, distReport.distDir);
  const checksumPath = `${report.zipPath}.sha256`;
  await writeFile(checksumPath, checksumLine(report), 'utf8');
  await validateChecksumFile(report, checksumPath);
  return { ...report, checksumPath };
}
