# PROGRESS.md

## Morning report (2026-11-27)

**TabbyMcTabface website: done, with one line I couldn't fully prove (see "Definition of done").**

- **World:** the fridge door of a shared apartment, covered in passive-aggressive notes from Tabby, your roommate.
- **Private preview:** https://tabbymctabface-git-site-fridge-phazzies-projects.vercel.app (branch `site-fridge`). **Update:** PR #26 was merged on 27 Nov, so the fridge is now the live, public site at https://tabbymctabface.vercel.app.
- **Score: 7/10.** It's memorable and every part works, but it's charming rather than dangerous. Nobody will be offended by it.
- **Still rough:** the house rules page is long in handwriting and slower to read than plain type. The "Install" tear-off goes to GitHub until the Chrome Web Store listing is approved. On a phone the page is long (about six screens).
- **Boldest part:** Trash Day. The I'm Feeling Lucky demo spins over fake tabs, crosses one out, and slaps a real quip on the fridge, following the extension's real rules (pinned and current tab are safe, a ~5 second note cooldown, Alt+Shift+L works).
- **Weakest part:** the house rules sheet. It's in-world, but it's the least fun thing on the site.

### Choices I made on my own
1. Picked the fridge door over the eviction notice and the reality-TV case file (reasons below).
2. Turned on Vercel's login protection for **preview** deployments of the `tabbymctabface` project, so branch previews are private. Production (tabbymctabface.vercel.app) is untouched and still public. To undo: Vercel → Project Settings → Deployment Protection.
3. Kept `/privacy.html` at the same address with the same facts, because the store listing points there. Only the paper changed.
4. Left out the one easter egg that quotes song lyrics from the public site. It's still in the extension.
5. Pushed the branch to the GitHub repo. That repo is already public, so the code on the branch is visible there, the same as every earlier branch.
6. Opened a PR and did not merge it. Main and the live site are unchanged.

### Blockers and what I need
- Nothing blocking. To make the fridge the live site, merge the PR (or tell me to).
- The site you already had at https://tabbymctabface.vercel.app was public before this brief. I left it as it is.

### Definition of done
- Builds and starts with no errors, no console errors: **yes.** No build step. Playwright saw zero console errors on `/` and `/privacy.html`. The only logged error is the expected 404 status on the 404 page itself.
- Every main feature clicked through: **yes**, and now repeatable with `npm run site:check`. I'm Feeling Lucky 7 times, until nothing was left (pinned and current tab never closed; the "nothing left" message and the restock button appeared). Restock. Alt+Shift+L. Group with no tabs (error), with no name (error), then a real group (band appears, tab disappears). "Leave me another note" twice (counter went 4 → 8). Envelope opened, "Snoop another". Tear-off tab went to the house rules page. The 404 page links back.
- Nothing that worked before is broken: **yes.** The extension code wasn't touched (`src/` unchanged; its 305 tests passed on main). The privacy URL still works.
- No placeholders, dead links or "coming soon": **yes.** Every link goes to GitHub, the issues page or the house rules.
- Screenshots of every page at phone and laptop after the last change: **yes** (round 3, attached in the thread).
- Private preview that opens, and I checked it's the new version: **mostly.** It opened in the browser on your computer and showed the fridge and the new 404 page. That browser may be signed in to Vercel, so I couldn't prove from it that a signed-out visitor gets blocked. Vercel reports the protection as on.
- Committed on its own branch with a clear message: **yes**, `site-fridge`.
- README says what it is, how to run it and what's rough: **yes**, see "Website (the fridge)".

---

## How I got there

**Core idea:** someone has noticed your tabs, and they're not going to say it to your face.

**Obvious version (not built):** a dark landing page with a hero, three feature cards, a quote strip and a footer. That's what was live, and it's still live at tabbymctabface.vercel.app.

**Three worlds:**
1. **The fridge door of a shared apartment.** Tabby is the roommate. Every feature is a note, a chore chart or a flyer.
2. **An eviction notice.** The site is legal papers served to your tabs: summons, hearing date, the judge's ruling.
3. **A "Tab Hoarders" reality-TV case file.** An intervention dossier with before and after photos and a family member crying.

**Pick: the fridge.** It's the only one where the extension's voice (passive-aggressive notes) is the world's native language, so nothing has to be translated. The eviction notice is funnier for one screen, then gets tiring. The reality-TV file was the riskiest, but it's about mocking a person, and that turns mean fast.

**How the world runs everything:**
- Links are tear-off tabs on a "roommate available" flyer.
- I'm Feeling Lucky is the trash-day chore chart.
- Tab groups are rubber bands round labeled stuff.
- Quips are sticky notes that slap onto the door.
- Easter eggs are in a "do not open" envelope.
- The privacy policy is the house rules.
- The 404 is "someone ate it".
- The error states are Tabby talking: "I can't put a band round nothing", "the marker ran out".

**Rounds:**
- **Round 1.** The magnet name broke mid-word ("TA / BFACE") on laptop. On a phone, the working demo was more than a screen down, and the notes were one long column.
- **Round 2.**
  - Fixed: words kept whole, Trash Day moved first on phones, notes put in two columns.
  - Found: the "Install" tear-off text was cut off on a phone.
  - Found: a grouped tab's checkbox stayed visible.
  - Found: one easter egg quoted song lyrics.
- **Round 3.**
  - Fixed: shortened the tear-off text, hid grouped tabs, removed the lyric egg.
  - Added Alt+Shift+L on the page itself.
  - Re-shot every page at 1280 and 390. No sideways scrolling anywhere.
- **Round 4 (after a Codex review).** On tablets (700 to 1000px wide) the opening note was pushed off the fridge's right edge and cut off. Fixed: the freezer goes to one column and the magnets shrink below 1020px. Checked at 700, 768, 900, 1020 and 1100, then re-shot phone and laptop.

- **Round 5 (after a Sourcery review).**
  - The spin now ends on the tab that actually closes.
  - Fonts are self-hosted, so visiting the site sends nothing to Google.
  - If the notes fail to load, the whole fridge goes quiet instead of half-working.
  - Copy fixes: notes come "almost every time" (5-second cooldown); the counter says it forgets on refresh; the envelope says 100+.
  - Added `npm run site:check`, a Playwright click-through at laptop, tablet and phone size. It passes.

## Earlier work (before the overnight brief)
- Store-ready build fixed and merged (PR #24). The site template was merged earlier in PR #25.
- Store package and Product Hunt draft are in the project files under `tabby/`.
