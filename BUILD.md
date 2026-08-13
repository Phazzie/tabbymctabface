# Build and Release Guide

TabbyMcTabface is a bundled Chrome Manifest V3 extension. Chrome must load the generated `dist/` directory; TypeScript source files cannot be loaded directly.

## Requirements

- Node.js 20 or 22
- npm 10 or newer
- Chromium or Google Chrome for browser E2E

Install the locked dependency graph:

```bash
npm ci
```

## Quality gates

Run the complete local release gate:

```bash
npm run verify
```

Individual gates are available when diagnosing a failure:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:coverage
npm run build
npm run test:smoke
npm run test:e2e
```

Install Playwright's pinned browser if the E2E gate reports that it is missing:

```bash
npx playwright install chromium
```

## Build output

```bash
npm run build
```

The build uses esbuild for two browser entry points:

- `src/background.ts` → `dist/background.js`, a bundled ESM service worker;
- `src/ui/popup.ts` → `dist/popup.js`, a bundled popup controller.

The canonical quip JSON is imported by `src/impl/quip-data.ts` and bundled into the browser entry points by esbuild; it is not copied as a standalone runtime asset. The build copies only `manifest.json`, popup HTML/CSS, icons, and assets referenced by the popup. `dist/manifest.json` references `background.js` at the ZIP root, and `dist/popup.html` references `popup.js` at the same root.

`npm run build` finishes by validating that:

- every manifest, script, stylesheet, icon, and popup reference exists;
- no bundled entry contains unresolved relative imports;
- the manifest has valid release metadata and safe command defaults;
- icon dimensions and transparency are correct; and
- the generated bundles and their referenced runtime assets are complete and safe.

The unit and release smoke suites import the same JSON-backed exports used at runtime and enforce schema, uniqueness, enum, regex, reachability, category, and count policies before packaging. `copyStaticAssets` and `validateDist` intentionally do not expect standalone quip JSON in `dist/`.

## Package

```bash
npm run package
```

The package command rebuilds, validates, and writes `TabbyMcTabface-v1.0.0.zip`. The ZIP contains the contents of `dist/` at its root—never an extra `dist/` directory. The package smoke test compares ZIP entries with the built tree and revalidates all runtime references.

Inspect a package without extracting it:

```bash
unzip -l TabbyMcTabface-v1.0.0.zip
```

## Load unpacked

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this repository's generated `dist/` directory.
5. Open the service-worker inspector and popup inspector and confirm there are no errors.

Do not load the source repository root.

## Release automation

Pull requests and pushes run the CI workflow on Node 20 and 22. It typechecks, lints, runs unit/integration/coverage tests, builds, validates and packages the artifact, then runs Chromium extension tests. The ZIP and reports are retained as workflow artifacts.

A `v*` tag reruns the release gates, generates a SHA-256 checksum, and creates a GitHub Release with the validated ZIP. Chrome Web Store submission remains manual until the owner configures a store item ID and publishing credentials.

Before tagging, complete [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) and verify the listing copy, privacy disclosure, and real screenshots in [STORE_LISTING.md](./STORE_LISTING.md).
