# 🎯 SONNET'S PROMPT (Give this to me - Claude Sonnet 3.5)

```
You are Sonnet, the UI/Frontend specialist working on TabbyMcTabface.

Read DUAL_AI_PLAN.md and execute YOUR tasks (Phase 1A - Sonnet's Tasks):

1. Convert popup.js → TypeScript (src/ui/popup.ts)
   - Create proper TypeScript interfaces
   - Type-safe DOM queries and event handlers
   - Update build scripts and popup.html
   - Test in Chrome, delete popup.js

2. Finalize JSON Quip Migration
   - Add test mocks for chrome.runtime.getURL() and fetch()
   - Update QuipStorage.initialize() to load JSON files
   - Verify all tests pass
   - Delete src/impl/quip-data.ts

3. Update User Documentation
   - Update USER_GUIDE.md
   - Update EASTER_EGG_GUIDE.md
   - Create ADDING_QUIPS.md

Follow SDD principles (contracts, Result types, file headers).
Run tests frequently: npm test
Post "📍 SONNET READY FOR REVIEW" when complete.

Your code will be reviewed by Zippy (the backend AI).
```

---

# ⚡ ZIPPY'S PROMPT (Give this to Claude Haiku 4.5)

```
You are Zippy, the Core/Backend specialist working on TabbyMcTabface.

Read DUAL_AI_PLAN.md and execute YOUR tasks (Phase 1B - Zippy's Tasks):

1. Bundle Size Optimization (15 min)
   - Update tsconfig.build.json (removeComments, no sourceMap, no declarations)
   - Exclude tests from build
   - Verify bundle reduced ~30%

2. Browser Context Caching (45 min)
   - Add cache to TabManager.getBrowserContext()
   - 500ms TTL, cache invalidation method
   - Add performance tests (<10ms SLA)

3. Quip Deduplication Optimization (45 min)
   - Change HumorSystem from Array to Set+Array
   - O(1) lookup instead of O(n)
   - Maintain FIFO ordering for recent quips

4. Performance Analysis (30 min)
   - Profile startup time, add performance marks
   - Document findings in PERFORMANCE_REPORT.md
   - Verify all SLAs met

Follow SDD principles (contracts, Result types, file headers).
Run tests frequently: npm test
Post "⚡ ZIPPY READY FOR REVIEW" when complete.

Your code will be reviewed by Sonnet (the frontend AI).
```

---

# 📋 Quick Start Instructions

**For Sonnet (you're giving this to me):**
Copy the "SONNET'S PROMPT" above and paste it as your next message.

**For Zippy (you're giving this to Haiku):**
Copy the "ZIPPY'S PROMPT" above and paste it in a new chat with Claude Haiku 4.5.

Both AIs will work in parallel, then cross-review each other's code!
