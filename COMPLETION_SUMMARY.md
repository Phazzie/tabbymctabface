# Release Candidate Status

This file describes the current 1.0.0 release candidate. It is deliberately not a declaration that the extension has shipped.

## Implemented

- Bundled Chrome Manifest V3 background and popup entry points.
- Current-window tab grouping with transactional compensation.
- Two-click, popup-only confirmation before random tab closure.
- Active, pinned, and other-window tab protection.
- Cold service-worker initialization and local usage counters.
- 75 production-routable base quips and 204 full-catalog-selectable easter eggs.
- Skeptical Wombat extension icons and Chrome Web Store artwork.
- Strict TypeScript, ESLint, behavior tests, contract examples, integration tests, coverage, artifact smoke tests, and real Chromium MV3 E2E.
- Deterministic, byte-validated ZIP packaging with a SHA-256 checksum.

## Release evidence required

The candidate is ready to ship only after every automated and manual item in
[PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) is complete. In
particular, the final GitHub commit must pass CI, its generated ZIP checksum must
match the artifact selected for upload, and the owner must complete Chrome Stable,
privacy-dashboard, store-listing, and repository-protection checks.

## Canonical references

- Build and packaging: [BUILD.md](./BUILD.md)
- User behavior: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- Content authoring: [docs/ADDING_QUIPS.md](./docs/ADDING_QUIPS.md)
- Store copy and permissions: [STORE_LISTING.md](./STORE_LISTING.md)
- Privacy: [PRIVACY.md](./PRIVACY.md)

Historical completion claims, obsolete source paths, and the removed destructive
keyboard shortcut are intentionally not retained here.
