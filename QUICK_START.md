# Quick Start

## Build and verify

```bash
git clone https://github.com/Phazzie/tabbymctabface.git
cd tabbymctabface
npm ci --ignore-scripts
npm run verify
```

Node.js 20.19 or newer is supported. If browser E2E reports a missing executable, run `./node_modules/.bin/playwright install chromium` once and repeat the gate.

## Load in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the generated `dist/` directory.

Open the popup, create a named group from selected current-window tabs, and test the two-step Feeling Lucky action with an unimportant, unpinned background tab.

## Package

```bash
npm run package
```

This creates a validated `TabbyMcTabface-v1.0.0.zip` with `manifest.json` at its root. See [BUILD.md](./BUILD.md) for the artifact contract and [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) before publishing.
