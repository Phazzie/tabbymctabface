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
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const REQUIRED_ICON_SIZES = ['16', '32', '48', '128'];
const REQUIRED_ROOT_FILES = [
  'background.js',
  'manifest.json',
  'popup.css',
  'popup.html',
  'popup.js',
];
const REQUIRED_PERMISSIONS = ['notifications', 'storage', 'tabGroups', 'tabs'];
const REQUIRED_MANIFEST_KEYS = [
  'action',
  'author',
  'background',
  'commands',
  'content_security_policy',
  'description',
  'icons',
  'manifest_version',
  'name',
  'permissions',
  'version',
];
const REQUIRED_EXTENSION_CSP = "default-src 'self'; script-src 'self'; object-src 'none'; connect-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none';";
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
  invariant(
    JSON.stringify(Object.keys(manifest.commands ?? {}).sort()) === JSON.stringify(['_execute_action']),
    'commands must contain only _execute_action',
  );
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

  invariant(
    !Object.hasOwn(manifest.commands ?? {}, 'feeling_lucky'),
    'destructive feeling_lucky command must not bypass popup confirmation',
  );
}

function validateManifestPrivilegeBoundary(manifest) {
  invariant(
    JSON.stringify(Object.keys(manifest).sort()) === JSON.stringify(REQUIRED_MANIFEST_KEYS),
    `manifest keys must be exactly: ${REQUIRED_MANIFEST_KEYS.join(', ')}`,
  );
  const permissions = Array.isArray(manifest.permissions)
    ? [...manifest.permissions].sort((left, right) => left.localeCompare(right, 'en'))
    : [];
  invariant(
    JSON.stringify(permissions) === JSON.stringify(REQUIRED_PERMISSIONS),
    `manifest permissions must be exactly: ${REQUIRED_PERMISSIONS.join(', ')}`,
  );
  for (const forbiddenKey of [
    'content_scripts',
    'externally_connectable',
    'host_permissions',
    'optional_permissions',
    'optional_host_permissions',
    'web_accessible_resources',
  ]) {
    invariant(!Object.hasOwn(manifest, forbiddenKey), `manifest must not declare ${forbiddenKey}`);
  }
  invariant(
    manifest.content_security_policy?.extension_pages === REQUIRED_EXTENSION_CSP,
    `content_security_policy.extension_pages must be exactly: ${REQUIRED_EXTENSION_CSP}`,
  );
  invariant(
    Object.keys(manifest.content_security_policy ?? {}).length === 1,
    'content_security_policy must not add sandbox or other execution policies',
  );
  invariant(!Object.hasOwn(manifest, 'update_url'), 'manifest must not declare update_url');
}

function documentUrlAttributes(documentText) {
  const document = new JSDOM(documentText).window.document;
  const references = [];
  for (const element of document.querySelectorAll('[src], [href], [srcset], [action], [formaction], [poster], [data]')) {
    for (const attribute of ['src', 'href', 'srcset', 'action', 'formaction', 'poster', 'data']) {
      const value = element.getAttribute(attribute);
      if (value !== null) references.push({ attribute, value });
    }
  }
  return references;
}

function extractLocalDocumentPaths(documentText) {
  const paths = new Set();
  for (const { attribute, value } of documentUrlAttributes(documentText)) {
    if (attribute === 'srcset') continue;
    const candidate = value.trim();
    if (!candidate || /^(?:[a-z]+:|\/\/|#)/iu.test(candidate)) continue;
    paths.add(candidate.split(/[?#]/u, 1)[0]);
  }
  return paths;
}

function validateNoRemoteDocumentReferences(documentText, documentPath) {
  const document = new JSDOM(documentText).window.document;
  invariant(
    document.querySelector('meta[http-equiv="refresh" i]') === null,
    `${documentPath} must not contain meta refresh navigation`,
  );
  for (const { value } of documentUrlAttributes(documentText)) {
    invariant(
      !/(?:^|[\s,])(?:[a-z]+:|\/\/)/iu.test(value.trim()),
      `${documentPath} contains a remote resource reference: ${value}`,
    );
  }
}

function validateDocumentExecutableReferences(documentText, documentPath) {
  const document = new JSDOM(documentText).window.document;
  for (const element of document.querySelectorAll('script[src], link[rel~="stylesheet"][href]')) {
    const reference = element.getAttribute(element.localName === 'script' ? 'src' : 'href') ?? '';
    invariant(
      !/^(?:[a-z]+:|\/\/)/iu.test(reference),
      `${documentPath} contains a remote executable reference: ${reference}`,
    );
  }
}

function validateJavaScriptSyntax(source, bundlePath) {
  // Parse only: release validation must never dynamically execute artifact text.
  const sourceFile = ts.createSourceFile(bundlePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const diagnostics = sourceFile.parseDiagnostics ?? [];
  invariant(
    diagnostics.length === 0,
    `${bundlePath} has invalid JavaScript syntax: ${diagnostics[0]?.messageText ?? 'parse failed'}`,
  );
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

function validateNoRemoteStylesheetReferences(stylesheetText, stylesheetPath) {
  const referencePattern = /(?:url\(\s*["']?([^"')]+)|@import\s+["']([^"']+))["']?\s*\)?/giu;
  for (const match of stylesheetText.matchAll(referencePattern)) {
    const reference = match[1] ?? match[2];
    invariant(
      /^(?:data:|#)/iu.test(reference) || !/^(?:[a-z]+:|\/\/)/iu.test(reference),
      `${stylesheetPath} contains a remote resource reference: ${reference}`,
    );
  }
}

function validateBundleCapabilities(source, bundlePath) {
  const sourceFile = ts.createSourceFile(bundlePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const forbiddenConstructors = new Set(['Function', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'WebTransport']);
  const forbiddenGlobalFunctions = new Set([
    'eval',
    'fetch',
    'Function',
    ...forbiddenConstructors,
  ]);
  const chromeRootAliases = new Set(['chrome']);
  const globalRootAliases = new Set(['globalThis', 'window', 'self']);
  const navigationObjectAliases = new Map();
  const navigationMethodAliases = new Set();
  const forbiddenFunctionAliases = new Map();
  const domNavigationElementAliases = new Map();
  const staticMemberName = expression => {
    if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
    if (ts.isElementAccessExpression(expression) && ts.isStringLiteralLike(expression.argumentExpression)) {
      return expression.argumentExpression.text;
    }
    return null;
  };
  const isChromeRoot = expression => ts.isIdentifier(expression) && chromeRootAliases.has(expression.text);
  const isGlobalRoot = expression => ts.isIdentifier(expression) && globalRootAliases.has(expression.text);
  const globalFunctionKind = expression => {
    if (ts.isIdentifier(expression)) {
      if (forbiddenFunctionAliases.has(expression.text)) return forbiddenFunctionAliases.get(expression.text);
      if (forbiddenGlobalFunctions.has(expression.text)) return expression.text;
      return null;
    }
    if (!ts.isPropertyAccessExpression(expression) && !ts.isElementAccessExpression(expression)) return null;

    const member = staticMemberName(expression);
    if (member && forbiddenGlobalFunctions.has(member) && isGlobalRoot(expression.expression)) return member;
    if (
      member === 'sendBeacon'
      && ts.isIdentifier(expression.expression)
      && expression.expression.text === 'navigator'
    ) return member;
    return null;
  };
  const navigationObjectKind = expression => {
    if (ts.isIdentifier(expression)) {
      if (expression.text === 'location') return 'location';
      return navigationObjectAliases.get(expression.text) ?? null;
    }
    if (!ts.isPropertyAccessExpression(expression) && !ts.isElementAccessExpression(expression)) return null;

    const member = staticMemberName(expression);
    const owner = expression.expression;
    if (member && ['tabs', 'windows', 'runtime'].includes(member) && isChromeRoot(owner)) {
      return member;
    }
    if (member === 'location' && (isGlobalRoot(owner) || (ts.isIdentifier(owner) && owner.text === 'document'))) {
      return 'location';
    }
    return null;
  };
  const navigationMethodKind = expression => {
    if (ts.isIdentifier(expression) && navigationMethodAliases.has(expression.text)) return expression.text;
    if (!ts.isPropertyAccessExpression(expression) && !ts.isElementAccessExpression(expression)) return null;

    const method = staticMemberName(expression);
    const objectKind = navigationObjectKind(expression.expression);
    if (objectKind === 'tabs' && ['create', 'update'].includes(method)) return `${objectKind}.${method}`;
    if (objectKind === 'windows' && method === 'create') return `${objectKind}.${method}`;
    if (objectKind === 'runtime' && method === 'setUninstallURL') return `${objectKind}.${method}`;
    if (objectKind === 'location' && ['assign', 'replace'].includes(method)) return `${objectKind}.${method}`;
    if (method === 'open' && isGlobalRoot(expression.expression)) return 'open';
    return null;
  };
  const createdDomNavigationElementKind = expression => {
    if (!ts.isCallExpression(expression)) return null;
    if (!ts.isPropertyAccessExpression(expression.expression) && !ts.isElementAccessExpression(expression.expression)) {
      return null;
    }
    if (staticMemberName(expression.expression) !== 'createElement') return null;
    if (!ts.isIdentifier(expression.expression.expression) || expression.expression.expression.text !== 'document') {
      return null;
    }
    const tagName = expression.arguments[0];
    if (!tagName || !ts.isStringLiteralLike(tagName)) return null;
    const normalized = tagName.text.toLowerCase();
    return ['a', 'form'].includes(normalized) ? normalized : null;
  };
  const domNavigationElementKind = expression => {
    if (ts.isIdentifier(expression)) return domNavigationElementAliases.get(expression.text) ?? null;
    return createdDomNavigationElementKind(expression);
  };

  // Track the simple aliases emitted by bundlers and ordinary application code.
  // This is a defense-in-depth release regression guard, not a general-purpose
  // information-flow proof; the exact source tree and CSP are validated separately.
  const collectNavigationAliases = node => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isIdentifier(node.name)) {
        if (isChromeRoot(node.initializer)) chromeRootAliases.add(node.name.text);
        if (isGlobalRoot(node.initializer)) globalRootAliases.add(node.name.text);
        const domElementKind = domNavigationElementKind(node.initializer);
        if (domElementKind) domNavigationElementAliases.set(node.name.text, domElementKind);
        const objectKind = navigationObjectKind(node.initializer);
        if (objectKind) navigationObjectAliases.set(node.name.text, objectKind);
        if (navigationMethodKind(node.initializer)) {
          navigationMethodAliases.add(node.name.text);
        }
        const forbiddenFunction = globalFunctionKind(node.initializer);
        if (forbiddenFunction) forbiddenFunctionAliases.set(node.name.text, forbiddenFunction);
      } else if (ts.isObjectBindingPattern(node.name)) {
        const objectKind = navigationObjectKind(node.initializer);
        for (const element of node.name.elements) {
          if (!ts.isIdentifier(element.name)) continue;
          const method = element.propertyName && ts.isIdentifier(element.propertyName)
            ? element.propertyName.text
            : element.name.text;
          if (
            (objectKind === 'tabs' && ['create', 'update'].includes(method))
            || (objectKind === 'windows' && method === 'create')
            || (objectKind === 'location' && ['assign', 'replace'].includes(method))
          ) {
            navigationMethodAliases.add(element.name.text);
          }
          if (isChromeRoot(node.initializer) && ['tabs', 'windows', 'runtime'].includes(method)) {
            navigationObjectAliases.set(element.name.text, method);
          }
          if (isGlobalRoot(node.initializer)) {
            if (method === 'location') navigationObjectAliases.set(element.name.text, 'location');
            if (method === 'open') navigationMethodAliases.add(element.name.text);
            if (forbiddenGlobalFunctions.has(method)) forbiddenFunctionAliases.set(element.name.text, method);
          }
        }
      }
    }
    ts.forEachChild(node, collectNavigationAliases);
  };
  // A second pass resolves aliases that refer to aliases declared earlier.
  collectNavigationAliases(sourceFile);
  collectNavigationAliases(sourceFile);

  const visit = node => {
    if (ts.isStringLiteralLike(node) && /^(?:https?:)?\/\//iu.test(node.text.trim())) {
      throw new Error(`Release artifact validation failed: ${bundlePath} contains a forbidden external URL`);
    }
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden dynamic import capability`);
      }
      const forbiddenFunction = globalFunctionKind(node.expression);
      if (forbiddenFunction) {
        const label = forbiddenFunction === 'Function' ? 'dynamic code generation' : forbiddenFunction;
        throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden ${label} capability`);
      }
      if (navigationMethodKind(node.expression)) {
        throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden browser navigation capability`);
      }
      if (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression)) {
        const method = staticMemberName(node.expression);
        const elementKind = domNavigationElementKind(node.expression.expression);
        if (
          (elementKind === 'a' && method === 'click')
          || (elementKind === 'form' && ['submit', 'requestSubmit'].includes(method))
        ) {
          throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden DOM navigation capability`);
        }
        if (method === 'setAttribute' && elementKind) {
          const attribute = node.arguments[0];
          if (
            attribute
            && ts.isStringLiteralLike(attribute)
            && (
              (elementKind === 'a' && attribute.text.toLowerCase() === 'href')
              || (elementKind === 'form' && attribute.text.toLowerCase() === 'action')
            )
          ) {
            throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden DOM navigation capability`);
          }
        }
      }
    }
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && (
        (ts.isIdentifier(node.left) && node.left.text === 'location')
        || (
          (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
          && (
            (staticMemberName(node.left) === 'href' && navigationObjectKind(node.left.expression) === 'location')
            || navigationObjectKind(node.left) === 'location'
            || (
              domNavigationElementKind(node.left.expression) === 'a'
              && staticMemberName(node.left) === 'href'
            )
            || (
              domNavigationElementKind(node.left.expression) === 'form'
              && staticMemberName(node.left) === 'action'
            )
          )
        )
      )
    ) {
      throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden location navigation capability`);
    }
    if (ts.isNewExpression(node)) {
      const name = globalFunctionKind(node.expression) ?? (
        ts.isIdentifier(node.expression) && forbiddenConstructors.has(node.expression.text)
          ? node.expression.text
          : null
      );
      if (name && forbiddenConstructors.has(name)) {
        const label = name === 'Function' ? 'dynamic code generation' : name;
        throw new Error(`Release artifact validation failed: ${bundlePath} contains forbidden ${label} capability`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
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
  validateManifestPrivilegeBoundary(manifest);
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
  validateNoRemoteDocumentReferences(popupText, popupPath);
  validateDocumentExecutableReferences(popupText, popupPath);
  const popupDirectory = path.posix.dirname(popupPath);
  for (const documentPath of extractLocalDocumentPaths(popupText)) {
    const resolvedPath = path.posix.normalize(path.posix.join(popupDirectory, documentPath));
    await assertReferencedFile(absoluteDistDir, fileSet, resolvedPath, popupPath);
  }

  for (const cssFile of files.filter((file) => file.endsWith('.css'))) {
    const cssText = await readFile(path.join(absoluteDistDir, cssFile), 'utf8');
    validateNoRemoteStylesheetReferences(cssText, cssFile);
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
    validateJavaScriptSyntax(bundleText, bundlePath);
    validateBundleCapabilities(bundleText, bundlePath);
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
