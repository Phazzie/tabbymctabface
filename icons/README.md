# Extension Icons

The committed PNGs are production exports of the Skeptical Wombat master in `../assets/skeptical-wombat-icon-master.png`.

| File | Size | Crop |
| --- | ---: | --- |
| `icon16.png` | 16×16 | Face-forward toolbar crop |
| `icon32.png` | 32×32 | Upper-body toolbar crop |
| `icon48.png` | 48×48 | Full mascot and browser-tab mark |
| `icon128.png` | 128×128 | Full mark inside an approximately 96 px safe area |

All exports are RGBA PNGs with transparent corners. Keep the exact filenames and dimensions: the build and smoke tests reject a missing, opaque, or incorrectly sized icon.

When changing the mascot, regenerate every size, inspect the 16 px image at actual size on both light and dark backgrounds, update store artwork, and rerun `npm run test:smoke`.

Asset provenance and generation constraints are documented in `../assets/README.md`.
