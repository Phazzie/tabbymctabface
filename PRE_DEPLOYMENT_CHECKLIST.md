# Release Checklist

Use this checklist for the 1.0.0 Chrome Web Store submission. CI evidence and a successful local browser run are required; source-level test counts alone are not release evidence.

## Automated gates

- [ ] `npm ci` succeeds from a clean checkout on Node 20.
- [ ] `npm run verify` passes without skipped release-critical tests.
- [ ] TypeScript strict mode and ESLint pass.
- [ ] Unit, integration, content-validation, and coverage thresholds pass.
- [ ] `npm run build` emits bundled `dist/background.js` and `dist/popup.js`.
- [ ] Static smoke validation resolves every manifest, popup, icon, and data reference.
- [ ] `npm run package` creates the versioned ZIP and validates its root layout.
- [ ] Playwright loads the extension in persistent Chromium, opens the popup, and reports no worker/page errors.
- [ ] Cold service-worker startup, grouping, confirmation/cancel, eligible-tab closure, and immediate stat refresh pass E2E.
- [ ] `npm audit --omit=dev` reports no production vulnerabilities.
- [ ] GitHub CI passes on every supported Node version.

## Manual Chrome checks

- [ ] Load `dist/` into the current Chrome Stable release on macOS or Linux and Windows.
- [ ] Confirm all Skeptical Wombat icons remain legible on light and dark browser themes.
- [ ] Group multiple ordinary tabs and verify the title and count.
- [ ] Force a group-title failure if possible and verify selected tabs are not stranded in an unnamed group.
- [ ] Confirm Lucky requires two popup actions and never closes the active, pinned, or other-window tab.
- [ ] Confirm Chrome's restore-closed-tab shortcut remains available.
- [ ] Suspend/restart the extension worker, reopen the popup, and verify cold initialization.
- [ ] Test keyboard-only navigation, a screen reader's status announcement, and reduced motion.
- [ ] Check notification suppression behavior under the operating system's focus mode.

## Store listing

- [x] 16, 32, 48, and 128 px transparent Skeptical Wombat icons.
- [x] 440×280 small promo tile.
- [x] 1400×560 marquee image.
- [x] 1280×800 screenshot regenerated from the final packaged popup.
- [x] Listing summary, description, and permission justifications in `STORE_LISTING.md`.
- [x] Public privacy, support, security, and license documents.
- [ ] Chrome Web Store privacy questionnaire exactly matches `PRIVACY.md`.
- [x] Store screenshots contain no private tab titles or URLs.
- [ ] Owner confirms category, regions, pricing, visibility, and support/privacy URLs.

## Release integrity

- [ ] Manifest, package, tag, ZIP, and changelog versions are all `1.0.0`.
- [ ] Release notes describe user-visible behavior and known limitations.
- [ ] The release workflow publishes the ZIP and SHA-256 checksum from a clean tag.
- [ ] The repository's default branch is protected with CI required before merge.
- [ ] Chrome Web Store upload is made from the checksum-verified GitHub artifact.

The owner-only steps—branch protection, tag approval, Chrome Web Store account disclosures, and submission—cannot be inferred or automated safely without the corresponding account configuration.
