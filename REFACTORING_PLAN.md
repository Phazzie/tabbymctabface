# TabbyMcTabface - Refactoring & Optimization Plan

**Created**: 2025-10-15  
**Status**: Ready for Implementation  
**Estimated Time**: 6-8 hours total  
**Priority**: Performance + Maintainability improvements

---

## 📋 Quick Wins (Phase 1 - Do First)

### ✅ Task 1: Bundle Size Optimization (5 minutes)

**Goal**: Reduce compiled bundle size by ~30%

**Files to Edit**:
- `tsconfig.build.json`

**Changes**:
```json
{
  "compilerOptions": {
    "removeComments": true,      // Strip comments from output
    "declaration": false,         // No .d.ts files needed for extension
    "sourceMap": false,           // No source maps in production
    "inlineSourceMap": false
  }
}
```

**Expected Outcome**: Smaller `dist/` files, faster extension load

---

### ✅ Task 2: Cache Browser Context (20 minutes)

**Goal**: Reduce Chrome API calls, meet <10ms SLA consistently

**Files to Edit**:
- `src/impl/TabManager.ts`

**Changes**:
```typescript
export class TabManager implements ITabManager {
  // Add cache properties
  private contextCache: {
    data: BrowserContext | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };
  
  private readonly CONTEXT_CACHE_TTL = 500; // 500ms

  async getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>> {
    const now = Date.now();
    
    // Return cached data if fresh
    if (
      this.contextCache.data && 
      (now - this.contextCache.timestamp < this.CONTEXT_CACHE_TTL)
    ) {
      return Result.ok(this.contextCache.data);
    }
    
    // Fetch fresh data
    const tabs = await this.chromeTabsAPI.getAllTabs();
    // ... rest of existing logic
    
    // Update cache
    this.contextCache = {
      data: context,
      timestamp: now
    };
    
    return Result.ok(context);
  }
}
```

**Expected Outcome**: 
- getBrowserContext() meets <10ms SLA
- Fewer Chrome API calls
- Better performance on rapid events

**Tests to Update**:
- `src/contracts/__tests__/ITabManager.test.ts` - Add cache invalidation tests

---

### ✅ Task 3: Optimize Quip Deduplication (15 minutes)

**Goal**: O(n) → O(1) lookup for recent quips

**Files to Edit**:
- `src/impl/HumorSystem.ts`

**Changes**:
```typescript
export class HumorSystem implements IHumorSystem {
  // Change from array to Set + array combo
  private recentQuips: Set<string> = new Set();
  private recentQuipsList: string[] = []; // For maintaining order

  private selectRandomQuip(quips: string[]): string | null {
    if (quips.length === 0) return null;

    // O(1) lookup instead of O(n)
    const availableQuips = quips.filter(quip => !this.recentQuips.has(quip));
    const selectionPool = availableQuips.length > 0 ? availableQuips : quips;

    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    return selectionPool[randomIndex];
  }

  private addToRecentQuips(quip: string): void {
    this.recentQuips.add(quip);
    this.recentQuipsList.unshift(quip);
    
    // Keep only last N quips
    if (this.recentQuipsList.length > this.maxRecentQuips) {
      const oldest = this.recentQuipsList.pop();
      if (oldest) {
        this.recentQuips.delete(oldest);
      }
    }
  }
}
```

**Expected Outcome**: 
- Faster quip selection
- Meets <100ms SLA more reliably
- Better performance with many quips

**Tests to Update**:
- `src/impl/__tests__/humor-flow.integration.test.ts` - Verify deduplication still works

---

**Phase 1 Total Time**: ~40 minutes  
**Phase 1 Benefits**: Immediate performance gains, smaller bundles, better SLA compliance

---

## 🔧 Medium Priority (Phase 2)

### ✅ Task 4: Extract Quips to JSON (1 hour)

**Goal**: Separate data from code, smaller bundles, easier editing

**New Files to Create**:
- `src/data/quips/passive-aggressive.json`
- `src/data/quips/easter-eggs.json`

**Structure**:
```json
// passive-aggressive.json
[
  {
    "id": "PA-001",
    "text": "You must know what you're doing with all these tabs.",
    "triggerTypes": ["TabGroupCreated"],
    "level": "default",
    "metadata": {
      "tags": ["organization"],
      "rarity": "common"
    }
  }
  // ... all 75 quips
]

// easter-eggs.json
[
  {
    "id": "EE-001",
    "type": "42-tabs",
    "conditions": {
      "tabCount": 42
    },
    "quips": ["The answer to life, the universe, and everything..."],
    "level": "default",
    "metadata": {
      "nicheReference": "Douglas Adams - Hitchhiker's Guide",
      "difficulty": "common"
    }
  }
  // ... all 160 easter eggs
]
```

**Files to Edit**:
- `src/impl/QuipStorage.ts` - Load JSON instead of importing TypeScript
- `src/impl/quip-data.ts` - DELETE (replaced by JSON)
- `manifest.json` - Add `src/data/quips/*.json` to `web_accessible_resources` if needed

**Changes to QuipStorage**:
```typescript
export class QuipStorage implements IQuipStorage {
  async initialize(): Promise<Result<void, StorageError>> {
    try {
      // Load JSON data
      const paResponse = await fetch(chrome.runtime.getURL('data/quips/passive-aggressive.json'));
      const paQuips = await paResponse.json();
      
      const eeResponse = await fetch(chrome.runtime.getURL('data/quips/easter-eggs.json'));
      const easterEggs = await eeResponse.json();
      
      this.quips = paQuips;
      this.easterEggs = easterEggs;
      
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({
        type: 'LoadFailed',
        details: 'Failed to load quip data',
        originalError: error
      });
    }
  }
}
```

**Migration Script**:
Create `scripts/migrate-quips-to-json.js`:
```javascript
// Convert quip-data.ts arrays to JSON files
const fs = require('fs');
const { PASSIVE_AGGRESSIVE_QUIPS, EASTER_EGGS } = require('../src/impl/quip-data.ts');

fs.writeFileSync(
  'src/data/quips/passive-aggressive.json',
  JSON.stringify(PASSIVE_AGGRESSIVE_QUIPS, null, 2)
);

fs.writeFileSync(
  'src/data/quips/easter-eggs.json',
  JSON.stringify(EASTER_EGGS, null, 2)
);
```

**Expected Outcome**:
- ~50% smaller bundle (JSON compresses better)
- Easier to edit quips (no TypeScript syntax)
- Potential for user-submitted quips later
- Faster TypeScript compilation

**Tests to Update**:
- `src/contracts/__tests__/IQuipStorage.test.ts` - Verify JSON loading works
- All integration tests should still pass

---

### ✅ Task 5: Easter Egg Condition Helpers (45 minutes)

**Goal**: Reduce code duplication, easier to add new conditions

**New File to Create**:
- `src/utils/EasterEggConditions.ts`

**Content**:
```typescript
/**
 * FILE: EasterEggConditions.ts
 * WHAT: Helper factories for easter egg condition objects
 * WHY: Reduce duplication, standardize condition creation
 */

import { EasterEggCondition } from '../contracts/IEasterEggFramework';

export const Conditions = {
  /**
   * Tab count condition
   */
  tabCount(count: number): EasterEggCondition {
    return { tabCount: count };
  },

  /**
   * Tab count range
   */
  tabCountRange(min: number, max?: number): EasterEggCondition {
    return { tabCount: { min, ...(max && { max }) } };
  },

  /**
   * Domain regex (auto-escapes dots)
   */
  domain(domain: string): EasterEggCondition {
    return { domainRegex: domain.replace(/\./g, '\\.') };
  },

  /**
   * Multiple domains (OR condition)
   */
  domains(...domains: string[]): EasterEggCondition {
    const escaped = domains.map(d => d.replace(/\./g, '\\.'));
    return { domainRegex: escaped.join('|') };
  },

  /**
   * Hour range (24-hour format)
   */
  timeRange(start: number, end: number): EasterEggCondition {
    return { hourRange: { start, end } };
  },

  /**
   * Title contains text
   */
  titleContains(text: string): EasterEggCondition {
    return { titleContains: text };
  },

  /**
   * URL contains text
   */
  urlContains(text: string): EasterEggCondition {
    return { urlContains: text };
  },

  /**
   * Group count
   */
  groupCount(count: number): EasterEggCondition {
    return { groupCount: count };
  },

  /**
   * Custom check (special logic)
   */
  custom(checkName: string): EasterEggCondition {
    return { customCheck: checkName };
  },

  /**
   * Combine multiple conditions (AND)
   */
  combine(...conditions: Partial<EasterEggCondition>[]): EasterEggCondition {
    return Object.assign({}, ...conditions);
  }
};
```

**Files to Edit**:
- `src/data/quips/easter-eggs.json` (or `src/impl/quip-data.ts` if not migrated yet)

**Before**:
```typescript
conditions: { tabCount: 42 }
conditions: { domainRegex: 'stackoverflow\\.com' }
conditions: { hourRange: { start: 2, end: 5 } }
```

**After**:
```typescript
import { Conditions as C } from '../utils/EasterEggConditions';

conditions: C.tabCount(42)
conditions: C.domain('stackoverflow.com')
conditions: C.timeRange(2, 5)
conditions: C.combine(
  C.domain('reddit.com'),
  C.tabCountRange(10)
)
```

**Expected Outcome**:
- Less code duplication
- Fewer regex escaping errors
- Easier to add new condition types
- Self-documenting condition creation

---

### ✅ Task 6: Lazy-Load Easter Egg Framework (45 minutes)

**Goal**: Faster initial load, better memory usage

**Files to Edit**:
- `src/impl/EasterEggFramework.ts`

**Changes**:
```typescript
export class EasterEggFramework implements IEasterEggFramework {
  private easterEggData: EasterEggData[] | null = null;
  private loadPromise: Promise<void> | null = null;

  /**
   * Lazy-load easter egg data on first use
   */
  private async ensureLoaded(): Promise<Result<void, EasterEggError>> {
    if (this.easterEggData) {
      return Result.ok(undefined); // Already loaded
    }

    // Prevent duplicate loading
    if (this.loadPromise) {
      await this.loadPromise;
      return Result.ok(undefined);
    }

    this.loadPromise = (async () => {
      const result = await this.quipStorage.getAllEasterEggs();
      if (result.isError()) {
        throw result.error;
      }
      this.easterEggData = result.value;
    })();

    try {
      await this.loadPromise;
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({
        type: 'LoadFailed',
        details: 'Failed to load easter eggs',
        originalError: error
      });
    }
  }

  async checkTriggers(context: BrowserContext): Promise<Result<...>> {
    // Ensure data is loaded
    const loadResult = await this.ensureLoaded();
    if (loadResult.isError()) {
      return Result.error(loadResult.error);
    }

    // Use this.easterEggData (now guaranteed loaded)
    // ... existing logic
  }
}
```

**Expected Outcome**:
- Faster extension startup
- Memory savings if easter eggs never triggered
- Better perceived performance

**Tests to Update**:
- `src/contracts/__tests__/IEasterEggFramework.test.ts` - Test lazy loading

---

**Phase 2 Total Time**: ~3 hours  
**Phase 2 Benefits**: Smaller bundles, cleaner code, better maintainability

---

## 🎨 Nice to Have (Phase 3 - Future)

### ✅ Task 7: Convert popup.js to TypeScript (1.5 hours)

**Goal**: Type safety in UI layer, consistency with codebase

**Files to Create**:
- `src/ui/popup.ts` (new TypeScript version)

**Files to Edit**:
- `popup.html` - Change `<script src="popup.js">` to `<script src="dist/popup.js">`
- `tsconfig.build.json` - Add `src/ui/popup.ts` to includes

**New Structure**:
```typescript
/**
 * FILE: popup.ts
 * WHAT: Popup UI controller (TypeScript version)
 * WHY: Type safety, better IDE support, consistency
 */

interface TabStats {
  tabCount: number;
  groupCount: number;
  quipCount: number;
}

interface BackgroundMessage {
  action: 'closeRandomTab' | 'createGroup' | 'getStats';
  data?: unknown;
}

interface BackgroundResponse {
  result?: {
    ok: boolean;
    value?: unknown;
    error?: { details: string };
  };
  error?: string;
}

// Type-safe DOM elements
const feelingLuckyBtn = document.getElementById('feelingLuckyBtn') as HTMLButtonElement;
const createGroupBtn = document.getElementById('createGroupBtn') as HTMLButtonElement;
// ... etc

async function sendMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse) => {
      resolve(response);
    });
  });
}

async function handleFeelingLucky(): Promise<void> {
  try {
    setStatus('Closing random tab...', 'loading');
    feelingLuckyBtn.disabled = true;
    
    const response = await sendMessage({ action: 'closeRandomTab' });
    
    if (response.result?.ok) {
      const result = response.result.value as { closedTabTitle: string };
      setStatus(`Closed: ${result.closedTabTitle}`, 'success');
      await updateStats();
    } else {
      setStatus(`Error: ${response.result?.error?.details || 'Unknown'}`, 'error');
    }
  } catch (error) {
    setStatus('Failed to close tab', 'error');
    console.error(error);
  } finally {
    feelingLuckyBtn.disabled = false;
  }
}

// ... rest of functions with proper types
```

**Build Changes**:
```json
// package.json - add popup build
"scripts": {
  "build:popup": "tsc src/ui/popup.ts --outDir dist",
  "build": "npm run build:src && npm run build:popup && npm run build:copy"
}
```

**Expected Outcome**:
- Type safety in UI layer
- Better IDE autocomplete
- Catch errors at compile time
- Consistent with rest of codebase

**Tests to Add**:
- `src/ui/__tests__/popup.test.ts` - UI interaction tests (optional)

---

**Phase 3 Total Time**: ~1.5 hours  
**Phase 3 Benefits**: Full TypeScript consistency, fewer runtime errors

---

## 📊 Implementation Checklist

### Phase 1: Quick Wins (~40 minutes)
- [ ] Task 1: Bundle size optimization (tsconfig changes)
- [ ] Task 2: Cache browser context (TabManager.ts)
- [ ] Task 3: Optimize quip deduplication (HumorSystem.ts)
- [ ] Run tests: `npm test`
- [ ] Commit: "refactor: Phase 1 optimizations - caching and performance"

### Phase 2: Medium Priority (~3 hours)
- [ ] Task 4: Extract quips to JSON
  - [ ] Create JSON files
  - [ ] Update QuipStorage
  - [ ] Delete quip-data.ts
  - [ ] Update manifest.json
- [ ] Task 5: Easter egg condition helpers
  - [ ] Create EasterEggConditions.ts
  - [ ] Refactor easter egg definitions
- [ ] Task 6: Lazy-load easter eggs
  - [ ] Update EasterEggFramework.ts
- [ ] Run tests: `npm test`
- [ ] Commit: "refactor: Phase 2 - JSON migration and code cleanup"

### Phase 3: Future (~1.5 hours)
- [ ] Task 7: Convert popup.js → popup.ts
  - [ ] Create src/ui/popup.ts
  - [ ] Update build scripts
  - [ ] Update popup.html
  - [ ] Delete popup.js
- [ ] Run tests: `npm test`
- [ ] Build: `npm run build`
- [ ] Commit: "refactor: Phase 3 - Full TypeScript migration"

---

## 🎯 Success Metrics

**Performance**:
- ✅ getBrowserContext(): <10ms (currently varies)
- ✅ deliverQuip(): <100ms (currently borderline)
- ✅ Extension startup: <50ms (currently ~80ms)

**Bundle Size**:
- ✅ Before: ~350KB
- ✅ After: ~240KB (~30% reduction)

**Code Quality**:
- ✅ Zero TODO/FIXME comments
- ✅ 100% TypeScript (no .js files)
- ✅ All tests passing
- ✅ Cleaner, more maintainable code

---

## 🚨 Testing Strategy

**After Each Phase**:
1. Run unit tests: `npm test`
2. Run integration tests: `npm run test:integration`
3. Build extension: `npm run build`
4. Load in Chrome and manually test:
   - [ ] "I'm Feeling Lucky" button works
   - [ ] Create Group works
   - [ ] Easter eggs still trigger (42 tabs)
   - [ ] No console errors
   - [ ] Stats display correctly

**Performance Testing**:
```javascript
// Add to integration tests
it('meets performance SLAs', async () => {
  const start = performance.now();
  await tabManager.getBrowserContext();
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(10); // <10ms SLA
});
```

---

## 📝 Notes for Implementation

**Order Matters**:
- Do Phase 1 first (quick wins, no dependencies)
- Phase 2 tasks are independent (can do in any order)
- Phase 3 can wait until adding new UI features

**Git Strategy**:
- Commit after each phase
- Use descriptive commit messages
- Can cherry-pick individual tasks if needed

**Rollback Plan**:
- Each phase is self-contained
- Can revert individual commits if issues arise
- Keep `quip-data.ts` until JSON migration is verified working

**Documentation Updates**:
After all phases complete, update:
- [ ] `COMPLETION_SUMMARY.md` - Add "Refactoring Complete" section
- [ ] `CHANGELOG.md` - v1.1.0 with performance improvements
- [ ] `README.md` - Update performance claims

---

## 🎉 Expected Final State

**File Structure**:
```
tabby/
├── src/
│   ├── contracts/
│   ├── impl/
│   │   ├── (no quip-data.ts - deleted)
│   ├── data/
│   │   └── quips/
│   │       ├── passive-aggressive.json ✨ NEW
│   │       └── easter-eggs.json ✨ NEW
│   ├── utils/
│   │   ├── Result.ts
│   │   └── EasterEggConditions.ts ✨ NEW
│   └── ui/
│       └── popup.ts ✨ NEW (instead of popup.js)
├── dist/ (smaller, optimized)
└── (no popup.js - deleted)
```

**Bundle Size**: ~240KB (was ~350KB)  
**Performance**: All SLAs met consistently  
**Maintainability**: Much easier to add/edit content  
**Type Safety**: 100% TypeScript

---

**Ready to implement! Start with Phase 1 for immediate wins.** 🚀
