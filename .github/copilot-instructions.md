# TabbyMcTabface engineering instructions

TabbyMcTabface is a local-only Chrome Manifest V3 extension. Use
`docs/seam-catalog.md` as the current boundary map and `BUILD.md` as the
release contract.

## Non-negotiable behavior

- All tab and group operations are scoped to the current Chrome window.
- Random tab closure requires two explicit popup clicks and excludes active and
  pinned tabs by default. Do not introduce a destructive command shortcut.
- Mutations are serialized. Multi-step group changes must compensate on failure,
  including Chrome's deletion of empty groups.
- Every MV3 lifecycle/message/event path must cold-initialize safely.
- Runtime messages use the discriminated request union and clone-safe Results.
- No host permissions, content scripts, remote resources, network primitives,
  dynamic code, or executable code outside the validated bundle are allowed.
- Quip JSON is the canonical source. Every shipped base quip must be reachable
  through a production trigger, and every easter egg must be selectable against
  the complete catalog.

## Verification

Write a regression that fails for the defect before changing behavior. Contract
shape examples are reported separately from executable unit tests. For release
work, run the complete `npm run verify` gate and upload only the checksum-verified
ZIP produced by `npm run package`.
