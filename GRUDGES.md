# GRUDGES.md

Things that failed silently or lied. Check this list before every deploy.

| # | What lied | How it showed up | What guards against it now |
|---|-----------|------------------|----------------------------|
| 1 | 305 passing tests | The packaged zip would not load in Chrome at all (the manifest pointed at files that weren't in `dist/`). Tests never load the real extension. | `npm run package` then load `dist/` in Playwright Chromium and click Lucky and Group (see BUILD.md). |
| 2 | "It works" | It only worked until Chrome put the service worker to sleep. After that the popup said "Extension not initialized". | `ensureContext()` in `src/background.ts`; re-checked by stopping the worker over CDP. |
| 3 | The quip counter | The popup's "quips delivered" number was hard-coded to 0. It looked like a feature. | Counter is stored under `tabby_quips_delivered` and the popup reads it live. |
| 4 | Vercel "failed" on a branch | Branches cut before `site/` existed failed the Vercel check, which looked like a broken PR. | Merge order; any branch now carries `site/`. |
| 5 | My own review replies | I replied "Fixed" to 13 review threads at once; some weren't fixed yet. | One reply per thread, written after checking that thread's code. |
| 6 | "Private preview" | Branch previews on this Vercel project are public (deployment protection is off), so a "preview" is not private by default. | Turned on Vercel login protection for preview deployments before the fridge deploy (production untouched). |
| 7 | Screenshot of a page I never scrolled | A full-page screenshot can hide content cut off sideways on a phone. | Every screenshot run also checks `scrollWidth <= innerWidth`. |
| 8 | `git add -A` | A screenshot script ran from the repo folder and its output (5 stale PNGs, 3 MB) rode along in a fix commit. The review bot noticed before I did. | Screenshot scripts write to absolute scratch paths only; check `git status` before committing. |
| 9 | "No sideways scroll" | After I raised selector specificity, the phone and tablet layouts silently kept desktop grid columns. The page didn't scroll sideways because the fridge clips its overflow, so my check passed while demos were cut off. Codex caught it. | `npm run site:check` now also checks that nothing pokes past the fridge's edge. |
