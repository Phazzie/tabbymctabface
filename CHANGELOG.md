# Changelog

All notable changes are documented here. This project uses semantic versioning.

## [Unreleased]

### Added

- Exactly 100 new easter eggs (`EE-161` through `EE-260`), including 20 EverQuest entries and eight additional mainstream-to-niche categories.
- Skeptical Wombat production icons and Chrome Web Store promo assets.
- Local, persisted quip and action statistics.
- Package/static smoke tests, real Chromium extension E2E, coverage gates, CI, release automation, Dependabot, and artifact checksums.
- Privacy, security, support, contribution, release, and store-listing documentation.

### Changed

- Replaced TypeScript-only emission with bundled Manifest V3 browser entry points.
- Made JSON the single validated runtime source for quips and easter eggs.
- Scoped tab cleanup and counts to the current window.
- Added a popup confirmation step before random tab closure.
- Replaced the reserved reopen-tab shortcut and removed the destructive command's default binding.
- Reworked the popup for labels, keyboard use, live status, real stats, and reduced motion.
- Aligned version, author, repository, and MIT license metadata.

### Fixed

- Corrected background and popup paths in the packaged extension.
- Added idempotent service-worker initialization for Manifest V3 cold starts.
- Stopped unsupported custom conditions and missing active tabs from becoming implicit easter-egg matches.
- Implemented URL conditions and safe supported custom predicates.
- Ranked eggs by trigger specificity instead of treating rarity as priority, preventing broad rules from shadowing precise rules.
- Removed humor-level filtering that made authored eggs unreachable.
- Invalidated browser-context caches after mutations and awaited notification delivery.
- Corrected Chrome wrapper behavior for group ID `0` and notification boolean results.
- Corrected the Plane of Fear era and a cricket/curling metadata mismatch.

## [0.3.0] - 2025-10-12

- Added the initial contract suite and SDD documentation.

## [0.2.0] - 2025-10-10

- Added nine core TypeScript contracts and `Result<T, E>` error types.

## [0.1.0] - 2025-10-08

- Catalogued the initial application seams and architecture.

## [0.0.1] - 2025-10-05

- Created the TypeScript Chrome-extension project.
