# Contributing

TabbyMcTabface uses Seam-Driven Development. Read [the seam catalog](./docs/seam-catalog.md) before changing production code.

For every behavior change:

1. identify the seam and update its contract;
2. add a failing test that describes the boundary behavior;
3. implement the smallest typed change using `Result<T, E>` for expected failures;
4. run `npm run verify` (behavioral coverage and contract examples are separate gates); and
5. update user-facing documentation when behavior changes.

Keep pull requests focused. Do not include generated `dist/`, coverage, browser profiles, or ZIP artifacts. New easter eggs must pass the content validator: unique ID and type, supported conditions, compilable regular expressions, valid level/difficulty, and non-empty copy.

For browser-facing changes, include or update a Playwright extension test. For build changes, update the package smoke test and artifact validator.
