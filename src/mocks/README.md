# Test doubles

This directory contains only test doubles that are exercised by the current test
suite:

- `MockChromeTabsAPI.ts` models current-window tab/group behavior.
- `MockTabManager.ts` supplies contract-level tab-manager behavior.
- `MockHumorSystem.ts` isolates tab operations from notification delivery.

Production-wrapper integration tests use the Chrome-faithful doubles in
`src/impl/__tests__/test-helpers.ts`. Keep those fakes aligned with Chrome's
empty-group deletion behavior; simplified group semantics previously allowed a
rollback defect to pass.

Do not add speculative mocks for interfaces that have no production consumer.
A test double should be introduced by a behavior test that uses it.
