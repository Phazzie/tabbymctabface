# TabbyMcTabface - Granular Roadmap to Completion

**Generated**: 2025-10-12  
**Current Phase**: Contract Tests Complete → Implementation Phase  
**Target**: Working MVP (V1.0.0) Chrome Extension  
**Methodology**: Seam-Driven Development (SDD)

---

## 🎯 Current Status: 40% Complete

### ✅ Phase 1: Foundation & Contracts (COMPLETE - 40%)
- ✅ Seam Discovery (32 seams identified)
- ✅ Contract Generation (9 contracts)
- ✅ Contract Tests (9 test suites, ~372 tests)
- ✅ Result<T, E> utility implemented

### 🔄 Phase 2: Implementation (NEXT - 35%)
- ⏳ Core implementations needed
- ⏳ Data files needed
- ⏳ Chrome API wrappers needed

### 🔜 Phase 3: Integration & UI (15%)
- ⏳ Popup UI
- ⏳ Background script
- ⏳ Chrome extension manifest

### 🔜 Phase 4: Testing & Polish (10%)
- ⏳ Integration tests
- ⏳ Manual testing
- ⏳ Bug fixes

---

## 📋 PHASE 2: IMPLEMENTATION (Detailed Breakdown)

**Goal**: Generate working implementations that pass contract tests  
**Estimated Time**: 8-12 hours of focused work  
**Dependencies**: Contract tests provide acceptance criteria

---

### STEP 1: Data Files (Foundation for Humor) - 2 hours

**Why First**: Implementations need actual data to test against

#### 1.1 Passive-Aggressive Quips JSON (45 min)
**File**: `data/quips/passive-aggressive.json`

```json
{
  "version": "1.0.0",
  "schemaType": "passive-aggressive-quips",
  "quips": [
    {
      "id": "PA-001",
      "text": "Oh look, another tab group. How organized of you.",
      "triggerTypes": ["TabGroupCreated"],
      "level": "default",
      "metadata": {
        "tags": ["tab-management", "organization"],
        "rarity": "common"
      }
    },
    // ... 20-30 quips total for V1
  ]
}
```

**Tasks**:
- [ ] Create file structure
- [ ] Write 10 quips for `TabGroupCreated`
- [ ] Write 10 quips for `TabClosed`/`FeelingLucky`
- [ ] Write 5 quips for `TabOpened`
- [ ] Write 5 quips for `TooManyTabs`
- [ ] Validate JSON schema
- [ ] Test data loads correctly

**Acceptance**: QuipStorage can load and parse file

#### 1.2 Easter Eggs JSON (45 min)
**File**: `data/easter-eggs/definitions.json`

```json
{
  "version": "1.0.0",
  "schemaType": "easter-eggs",
  "easterEggs": [
    {
      "id": "EE-001",
      "type": "42-tabs",
      "conditions": {
        "tabCount": 42
      },
      "quips": [
        "42 tabs. The answer to life, universe, and your browser.",
        "Douglas Adams would be proud. Or horrified. Probably both."
      ],
      "level": "default",
      "metadata": {
        "nicheReference": "Douglas Adams - Hitchhiker's Guide to the Galaxy",
        "difficulty": "legendary"
      }
    },
    // ... 5 easter eggs total for V1
  ]
}
```

**Tasks**:
- [ ] Create 5 easter egg definitions
  - [ ] EE-001: 42 tabs (Hitchhiker's Guide)
  - [ ] EE-002: Late night coding (0-3am)
  - [ ] EE-003: GitHub domain + late night
  - [ ] EE-004: 100+ tabs (achievement)
  - [ ] EE-005: Tabs = groups (perfectly balanced)
- [ ] Write 2-3 quip variations per easter egg
- [ ] Validate JSON schema
- [ ] Test conditions are evaluable

**Acceptance**: EasterEggFramework can register and evaluate

#### 1.3 Website Categories JSON (Optional - 30 min)
**File**: `data/categories/websites.json`

**Status**: V1 DEFERRED (no website categorization in MVP)
- [ ] Skip for now, create placeholder structure only

---

### STEP 2: Chrome API Wrappers (External Boundary) - 2 hours

**Why Next**: Core modules depend on these wrappers

#### 2.1 ChromeTabsAPIWrapper.ts (60 min)
**File**: `src/chrome-api/ChromeTabsAPIWrapper.ts`  
**Contract**: `IChromeTabsAPI`  
**Test**: `IChromeTabsAPI.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Implement `createGroup(tabIds)` 
  - [ ] Call `chrome.tabs.group({ tabIds })`
  - [ ] Map Chrome errors to TabsAPIError
  - [ ] Return Result<number, TabsAPIError>
  - [ ] Handle edge cases (invalid IDs, permissions)
- [ ] Implement `updateGroup(groupId, properties)`
  - [ ] Call `chrome.tabGroups.update(groupId, properties)`
  - [ ] Map errors
  - [ ] Return Result<void, TabsAPIError>
- [ ] Implement `queryTabs(queryInfo)`
  - [ ] Call `chrome.tabs.query(queryInfo)`
  - [ ] Map Chrome.Tab → ChromeTab
  - [ ] Handle groupId mapping (-1 for ungrouped)
  - [ ] Return Result<ChromeTab[], TabsAPIError>
- [ ] Implement `removeTab(tabId)`
  - [ ] Call `chrome.tabs.remove(tabId)`
  - [ ] Handle last tab scenario
  - [ ] Return Result<void, TabsAPIError>
- [ ] Implement `getAllGroups()`
  - [ ] Call `chrome.tabGroups.query({})`
  - [ ] Map to ChromeTabGroup[]
  - [ ] Return Result<ChromeTabGroup[], TabsAPIError>
- [ ] Add error mapping helper
- [ ] Test against contract tests

**Acceptance**: All IChromeTabsAPI.test.ts tests pass

#### 2.2 ChromeNotificationsAPIWrapper.ts (30 min)
**File**: `src/chrome-api/ChromeNotificationsAPIWrapper.ts`  
**Contract**: `IChromeNotificationsAPI`  
**Test**: `IChromeNotificationsAPI.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Implement `create(options)`
  - [ ] Call `chrome.notifications.create(options)`
  - [ ] Map errors to NotificationAPIError
  - [ ] Return Result<string, NotificationAPIError>
- [ ] Implement `clear(notificationId)`
  - [ ] Call `chrome.notifications.clear(notificationId)`
  - [ ] Return Result<boolean, NotificationAPIError>
- [ ] Implement `update(notificationId, options)`
  - [ ] Call `chrome.notifications.update(notificationId, options)`
  - [ ] Return Result<boolean, NotificationAPIError>
- [ ] Test against contract tests

**Acceptance**: All IChromeNotificationsAPI.test.ts tests pass

#### 2.3 ChromeStorageAPIWrapper.ts (30 min)
**File**: `src/chrome-api/ChromeStorageAPIWrapper.ts`  
**Contract**: `IChromeStorageAPI`  
**Test**: `IChromeStorageAPI.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Implement `get(keys)`
  - [ ] Call `chrome.storage.local.get(keys)`
  - [ ] Return Result<Record<string, any>, StorageAPIError>
- [ ] Implement `set(items)`
  - [ ] Call `chrome.storage.local.set(items)`
  - [ ] Handle quota exceeded
  - [ ] Return Result<void, StorageAPIError>
- [ ] Implement `remove(keys)`, `clear()`, `getBytesInUse(keys)`
- [ ] Test against contract tests

**Acceptance**: All IChromeStorageAPI.test.ts tests pass

---

### STEP 3: Data Access Layer - 1.5 hours

#### 3.1 QuipStorage.ts (90 min)
**File**: `src/storage/QuipStorage.ts`  
**Contract**: `IQuipStorage`  
**Test**: `IQuipStorage.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Implement `initialize()`
  - [ ] Load `data/quips/passive-aggressive.json`
  - [ ] Load `data/easter-eggs/definitions.json`
  - [ ] Validate schema (basic type checking)
  - [ ] Cache in memory (private Map or object)
  - [ ] Return Result<void, StorageError>
  - [ ] Handle FileNotFound, JSONParseError, SchemaValidationError
- [ ] Implement `getPassiveAggressiveQuips(level, triggerType?)`
  - [ ] Filter cached quips by level
  - [ ] Filter by triggerType if provided
  - [ ] Return Result<QuipData[], StorageError>
  - [ ] Return empty array if no matches (graceful degradation)
  - [ ] Check isInitialized, return NotInitialized error if false
- [ ] Implement `getEasterEggQuips(easterEggType, level)`
  - [ ] Filter cached easter eggs by type and level
  - [ ] Return Result<EasterEggData[], StorageError>
  - [ ] Graceful degradation
- [ ] Implement `getAvailableTriggerTypes()`
  - [ ] Extract unique triggerTypes from cached quips
  - [ ] Return Result<string[], StorageError>
- [ ] Implement `isInitialized()`
  - [ ] Return boolean (check if cache populated)
- [ ] Add schema validation helper
- [ ] Test against contract tests

**Acceptance**: All IQuipStorage.test.ts tests pass

---

### STEP 4: Humor System Layer - 3 hours

#### 4.1 TabbyMcTabfacePersonality.ts (60 min)
**File**: `src/humor/personalities/TabbyMcTabfacePersonality.ts`  
**Contract**: `IHumorPersonality`  
**Test**: `IHumorPersonality.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Constructor: inject IQuipStorage dependency
- [ ] Implement `getPassiveAggressiveQuip(triggerType, triggerData, level)`
  - [ ] Call quipStorage.getPassiveAggressiveQuips(level, triggerType)
  - [ ] If empty, return Result.ok(null)
  - [ ] Select quip (random selection from filtered list)
  - [ ] Optional: Apply context substitution (e.g., {groupName})
  - [ ] Return Result<string | null, PersonalityError>
  - [ ] Handle StorageFailure, InvalidTriggerType errors
- [ ] Implement `getEasterEggQuip(easterEggMatch, context)`
  - [ ] Call quipStorage.getEasterEggQuips(easterEggMatch.easterEggType, 'default')
  - [ ] Select quip (random from variations)
  - [ ] Return Result<string | null, PersonalityError>
  - [ ] Handle InvalidEasterEggType error
- [ ] Implement `getMetadata()`
  - [ ] Return { name: 'TabbyMcTabface', description: '...', level: 'default', version: '1.0.0' }
- [ ] Implement `supportsLevel(level)`
  - [ ] Return true if level === 'default', false otherwise
- [ ] Add quip selection helper (random from array)
- [ ] Test against contract tests

**Acceptance**: All IHumorPersonality.test.ts tests pass

#### 4.2 EasterEggFramework.ts (60 min)
**File**: `src/humor/easter-eggs/EasterEggFramework.ts`  
**Contract**: `IEasterEggFramework`  
**Test**: `IEasterEggFramework.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Private storage: Map<string, EasterEggDefinition>
- [ ] Implement `checkTriggers(context)`
  - [ ] Iterate registered easter eggs (sorted by priority desc)
  - [ ] For each, evaluate ALL conditions (AND logic)
  - [ ] Use helper functions: evaluateNumberCondition, evaluateHourRange
  - [ ] Return first match as EasterEggMatch
  - [ ] Return Result.ok(null) if no match
  - [ ] Handle ConditionEvaluationFailed, NoEasterEggsRegistered errors
- [ ] Implement `registerEasterEgg(definition)`
  - [ ] Validate definition (basic checks)
  - [ ] Check for duplicate ID → DuplicateEasterEggId error
  - [ ] Add to storage map
  - [ ] Return Result<void, EasterEggError>
- [ ] Implement `getAllEasterEggs()`
  - [ ] Return array of all registered definitions
  - [ ] Return Result<EasterEggDefinition[], EasterEggError>
- [ ] Implement `clearAll()`
  - [ ] Clear storage map
- [ ] Add condition evaluation helpers
  - [ ] `evaluateTabCount(context.tabCount, condition.tabCount)`
  - [ ] `evaluateDomainRegex(context.activeTab?.domain, condition.domainRegex)`
  - [ ] `evaluateHourRange(context.currentHour, condition.hourRange)`
  - [ ] `evaluateTitleContains(context.activeTab?.title, condition.titleContains)`
  - [ ] `evaluateGroupCount(context.groupCount, condition.groupCount)`
- [ ] Test against contract tests

**Acceptance**: All IEasterEggFramework.test.ts tests pass

#### 4.3 HumorSystem.ts (60 min)
**File**: `src/humor/HumorSystem.ts`  
**Contract**: `IHumorSystem`  
**Test**: `IHumorSystem.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Constructor: inject IHumorPersonality, IEasterEggFramework, IChromeNotificationsAPI
- [ ] Create notifications$ Observable (simple Subject implementation or RxJS)
- [ ] Implement `deliverQuip(trigger)`
  - [ ] Check easter egg first (higher priority)
    - [ ] Get BrowserContext (from somewhere - dependency or parameter?)
    - [ ] Call easterEggFramework.checkTriggers(context)
    - [ ] If match, call personality.getEasterEggQuip(match, context)
  - [ ] If no easter egg, get passive-aggressive quip
    - [ ] Call personality.getPassiveAggressiveQuip(trigger.type, trigger.data, 'default')
  - [ ] If quip found, deliver via chrome.notifications
    - [ ] Call notificationAPI.create({ title: 'TabbyMcTabface', message: quipText })
  - [ ] Emit to notifications$ observable
  - [ ] Return QuipDeliveryResult
  - [ ] Handle errors gracefully (NoQuipsAvailable, DeliveryFailed, PersonalityFailure)
  - [ ] Graceful degradation: on error, return delivered=false, don't throw
- [ ] Implement `checkEasterEggs(context)`
  - [ ] Call easterEggFramework.checkTriggers(context)
  - [ ] Return Result<EasterEggMatch | null, HumorError>
- [ ] Implement `onTabEvent(eventType, handler)`
  - [ ] Store handler in event listeners map
  - [ ] Return unsubscribe function
- [ ] Add internal event dispatcher
- [ ] Add quip deduplication (track last 10 quips, don't repeat)
- [ ] Test against contract tests

**Acceptance**: All IHumorSystem.test.ts tests pass

---

### STEP 5: Core Tab Management - 2 hours

#### 5.1 TabManager.ts (120 min)
**File**: `src/core/TabManager.ts`  
**Contract**: `ITabManager`  
**Test**: `ITabManager.test.ts`

**Implementation Tasks**:
- [ ] Create file with SDD header
- [ ] Constructor: inject IChromeTabsAPI, IHumorSystem, IChromeStorageAPI
- [ ] Implement `createGroup(groupName, tabIds)`
  - [ ] Validate groupName (1-50 chars)
  - [ ] Validate tabIds (non-empty)
  - [ ] Call chromeTabsAPI.createGroup(tabIds) → Result<groupId, Error>
  - [ ] If success, call chromeTabsAPI.updateGroup(groupId, { title: groupName })
  - [ ] Emit TabGroupCreatedEvent to humorSystem
  - [ ] Optional: Save to storage via storageAPI
  - [ ] Return GroupCreationSuccess
  - [ ] Handle errors: InvalidGroupName, NoTabsSelected, ChromeAPIFailure
- [ ] Implement `closeRandomTab(options?)`
  - [ ] Default options: excludePinned=true, excludeActive=true
  - [ ] Call chromeTabsAPI.queryTabs({ currentWindow: true })
  - [ ] Filter out pinned/active tabs based on options
  - [ ] If no eligible tabs, return NoTabsToClose error
  - [ ] Select random tab (Math.random())
  - [ ] Call chromeTabsAPI.removeTab(tabId)
  - [ ] Emit TabClosedEvent to humorSystem (trigger: 'FeelingLucky')
  - [ ] Return TabClosureResult
  - [ ] Handle ChromeAPIFailure
- [ ] Implement `getAllGroups()`
  - [ ] Call chromeTabsAPI.getAllGroups()
  - [ ] For each group, query tabs in group
  - [ ] Build GroupData[] array
  - [ ] Return Result<GroupData[], TabManagerError>
- [ ] Implement `updateGroup(groupId, updates)`
  - [ ] Validate groupId exists
  - [ ] If updates.name, validate name
  - [ ] If updates.tabIds, move tabs to group
  - [ ] Call chromeTabsAPI.updateGroup(groupId, { title, color, collapsed })
  - [ ] Return Result<void, TabManagerError>
- [ ] Implement `deleteGroup(groupId)`
  - [ ] Validate groupId exists
  - [ ] Call chromeTabsAPI.updateGroup(groupId, { collapsed: false }) to ungroup
  - [ ] Or use chrome.tabs.ungroup(tabIds) if available
  - [ ] Return Result<void, TabManagerError>
- [ ] Implement `getBrowserContext()`
  - [ ] Call chromeTabsAPI.queryTabs({})
  - [ ] Get tabCount
  - [ ] Get activeTab (query { active: true, currentWindow: true })
  - [ ] Extract domain from URL
  - [ ] Get currentHour (new Date().getHours())
  - [ ] Get recentEvents (from internal tracking)
  - [ ] Get groupCount (getAllGroups().length)
  - [ ] Return BrowserContext
- [ ] Add validation helpers
- [ ] Test against contract tests

**Acceptance**: All ITabManager.test.ts tests pass

---

### STEP 6: Integration Layer (Optional for V1) - 1 hour

#### 6.1 EventBus (Simple Implementation) (30 min)
**File**: `src/core/EventBus.ts`

**Tasks**:
- [ ] Simple pub/sub implementation
- [ ] TabManager emits events
- [ ] HumorSystem subscribes
- [ ] Handles: TabGroupCreated, TabClosed, TabOpened

#### 6.2 Dependency Injection Container (30 min)
**File**: `src/core/Container.ts`

**Tasks**:
- [ ] Create singleton instances
- [ ] Wire dependencies:
  - ChromeTabsAPIWrapper
  - ChromeNotificationsAPIWrapper
  - ChromeStorageAPIWrapper
  - QuipStorage (initialize on extension load)
  - TabbyMcTabfacePersonality (inject QuipStorage)
  - EasterEggFramework (register easter eggs from JSON)
  - HumorSystem (inject Personality, Framework, NotificationAPI)
  - TabManager (inject TabsAPI, HumorSystem, StorageAPI)
- [ ] Export singleton instances for UI/background to use

---

## 📋 PHASE 3: CHROME EXTENSION UI & MANIFEST

**Goal**: User-facing extension with popup UI  
**Estimated Time**: 6-8 hours

---

### STEP 7: Extension Manifest & Background Script - 2 hours

#### 7.1 manifest.json (30 min)
**File**: `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "TabbyMcTabface",
  "version": "1.0.0",
  "description": "Tab management with passive-aggressive humor",
  "permissions": [
    "tabs",
    "tabGroups",
    "notifications",
    "storage"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Tasks**:
- [ ] Create manifest.json
- [ ] Define permissions
- [ ] Configure popup
- [ ] Configure background script

#### 7.2 background.js (60 min)
**File**: `background.js`

**Tasks**:
- [ ] Initialize QuipStorage on extension install/load
- [ ] Register easter eggs in framework
- [ ] Listen for tab events (chrome.tabs.onCreated, onRemoved, etc.)
- [ ] Emit events to HumorSystem
- [ ] Handle extension lifecycle

#### 7.3 Build Configuration (30 min)
**File**: `vite.config.ts` or webpack config

**Tasks**:
- [ ] Configure build to bundle TypeScript
- [ ] Output to `dist/` folder
- [ ] Copy manifest.json, icons, data files
- [ ] Source maps for debugging

---

### STEP 8: Popup UI - 4 hours

#### 8.1 popup.html (30 min)
**File**: `popup.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>TabbyMcTabface</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>TabbyMcTabface</h1>
    </header>
    
    <section id="feeling-lucky">
      <button id="feeling-lucky-btn">🎲 Feeling Lucky?</button>
    </section>
    
    <section id="groups">
      <h2>Tab Groups</h2>
      <div id="group-list"></div>
      <button id="create-group-btn">+ Create Group</button>
    </section>
    
    <section id="quip-display">
      <div id="last-quip"></div>
    </section>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

**Tasks**:
- [ ] Create HTML structure
- [ ] Add "Feeling Lucky?" button
- [ ] Add group creation UI
- [ ] Add group list display
- [ ] Add quip notification display area

#### 8.2 popup.css (45 min)
**File**: `popup.css`

**Tasks**:
- [ ] Style popup (min-width: 400px, max-height: 600px)
- [ ] Style "Feeling Lucky?" button (prominent, fun)
- [ ] Style group list (cards, colors)
- [ ] Style quip display (subtle, passive-aggressive aesthetic)
- [ ] Add animations (fade in for quips)
- [ ] Dark mode support

#### 8.3 popup.js (2 hours 45 min)
**File**: `popup.js`

**Tasks**:
- [ ] Import Container (get TabManager, HumorSystem)
- [ ] Load and display groups on popup open
  - [ ] Call tabManager.getAllGroups()
  - [ ] Render group cards with tab counts
  - [ ] Handle empty state
- [ ] "Feeling Lucky?" button handler
  - [ ] Call tabManager.closeRandomTab()
  - [ ] Display result (tab closed, quip shown)
  - [ ] Animate button (spinner while loading)
  - [ ] Handle errors gracefully
- [ ] Create Group button handler
  - [ ] Show modal/form (group name input, tab selection)
  - [ ] Get selected tabs (or current window tabs)
  - [ ] Call tabManager.createGroup(name, tabIds)
  - [ ] Show success/error message
  - [ ] Refresh group list
- [ ] Subscribe to humorSystem.notifications$
  - [ ] Display quips in #last-quip div
  - [ ] Animate in (fade/slide)
  - [ ] Auto-dismiss after displayDuration
  - [ ] Show easter egg badge if isEasterEgg=true
- [ ] Add group actions (update, delete)
- [ ] Handle errors (show user-friendly messages)

---

## 📋 PHASE 4: TESTING & POLISH

**Goal**: Bug-free, polished V1 release  
**Estimated Time**: 4-6 hours

---

### STEP 9: Integration Testing - 2 hours

#### 9.1 End-to-End Tests (90 min)
**File**: `src/__tests__/integration.test.ts`

**Tasks**:
- [ ] Test full "Feeling Lucky?" flow
  - [ ] Mock chrome.tabs API
  - [ ] Call TabManager → HumorSystem → Notifications
  - [ ] Verify quip displayed
- [ ] Test group creation flow
  - [ ] Mock chrome.tabs, chrome.tabGroups
  - [ ] Create group → verify humor triggered
- [ ] Test easter egg detection
  - [ ] Set context (42 tabs)
  - [ ] Trigger humor → verify easter egg match
  - [ ] Verify correct quip delivered
- [ ] Test error handling
  - [ ] Chrome API failures
  - [ ] Missing data files
  - [ ] Verify graceful degradation

#### 9.2 Manual Testing Checklist (30 min)

- [ ] Load extension in Chrome
- [ ] Open popup → verify groups display
- [ ] Click "Feeling Lucky?" → verify tab closes, quip shows
- [ ] Create group → verify humor triggered
- [ ] Open 42 tabs → verify easter egg triggers
- [ ] Test at 2am → verify late night easter egg
- [ ] Test with 0 tabs → verify error handling
- [ ] Test with all pinned tabs → verify "no tabs to close" error

---

### STEP 10: Bug Fixes & Polish - 2 hours

#### 10.1 Bug Fixes (90 min)

**Common Issues to Fix**:
- [ ] Chrome API permission errors
- [ ] Timing issues (async races)
- [ ] Popup closing before action completes
- [ ] Quip display timing/animation glitches
- [ ] Group color/icon display issues
- [ ] Error messages not user-friendly

#### 10.2 Polish (30 min)

- [ ] Add loading states (spinners)
- [ ] Improve error messages (user-friendly, funny)
- [ ] Add tooltips/help text
- [ ] Improve animations (smooth transitions)
- [ ] Add keyboard shortcuts (optional)
- [ ] Add extension icon (design or find free icon)

---

### STEP 11: Documentation & Release Prep - 1 hour

#### 11.1 README.md (30 min)

**Tasks**:
- [ ] Update README with:
  - [ ] Installation instructions
  - [ ] Feature list
  - [ ] Screenshots
  - [ ] Development setup
  - [ ] SDD methodology notes

#### 11.2 CHANGELOG.md (15 min)

**Tasks**:
- [ ] Document V1.0.0 release
  - [ ] Features
  - [ ] Known limitations
  - [ ] Future roadmap

#### 11.3 Chrome Web Store Listing (15 min)

**Prepare**:
- [ ] Description (engaging, mentions humor)
- [ ] Screenshots (popup, "Feeling Lucky?", quips)
- [ ] Promotional images (440x280, 920x680, 1400x560)
- [ ] Privacy policy (simple - no data collection)

---

## 📊 COMPLETION CHECKLIST

### Core Functionality ✅
- [ ] "Feeling Lucky?" closes random tab
- [ ] Passive-aggressive quips display
- [ ] Tab grouping works
- [ ] Easter eggs trigger correctly
- [ ] Humor system delivers via notifications
- [ ] All contract tests pass

### User Experience ✅
- [ ] Popup UI loads fast (<500ms)
- [ ] Animations smooth
- [ ] Error messages helpful
- [ ] Quips display properly
- [ ] Extension icon looks good

### Code Quality ✅
- [ ] All TypeScript compiles
- [ ] No console errors
- [ ] Contract tests: 100% pass
- [ ] Integration tests: 100% pass
- [ ] SDD documentation complete
- [ ] No TODO comments in production code

### Chrome Extension ✅
- [ ] Manifest valid
- [ ] Permissions minimal
- [ ] Icons present (16, 48, 128)
- [ ] Background script stable
- [ ] Popup doesn't crash
- [ ] Works in Chrome 90+

---

## 🎯 MILESTONES & TIME ESTIMATES

| Milestone | Tasks | Estimated Time | Cumulative |
|-----------|-------|----------------|------------|
| **M1: Data Files** | Step 1 | 2 hours | 2 hours |
| **M2: Chrome Wrappers** | Step 2 | 2 hours | 4 hours |
| **M3: Data Layer** | Step 3 | 1.5 hours | 5.5 hours |
| **M4: Humor System** | Step 4 | 3 hours | 8.5 hours |
| **M5: Core Logic** | Step 5 | 2 hours | 10.5 hours |
| **M6: Integration** | Step 6 | 1 hour | 11.5 hours |
| **M7: Extension Setup** | Step 7 | 2 hours | 13.5 hours |
| **M8: UI** | Step 8 | 4 hours | 17.5 hours |
| **M9: Testing** | Step 9 | 2 hours | 19.5 hours |
| **M10: Polish** | Step 10 | 2 hours | 21.5 hours |
| **M11: Release Prep** | Step 11 | 1 hour | 22.5 hours |

**Total Estimated Time**: 22.5 hours of focused development

**Realistic Schedule**:
- **Week 1**: M1-M4 (Implementations) - 8.5 hours
- **Week 2**: M5-M7 (Core + Extension) - 5.5 hours
- **Week 3**: M8-M11 (UI + Testing + Release) - 8.5 hours

---

## 🚀 QUICK START (Next Actions)

### Option A: Bottom-Up (Recommended for TDD)
```bash
1. Create data files (Step 1)
2. Implement QuipStorage (Step 3.1)
3. Run QuipStorage tests → debug until pass
4. Implement Chrome wrappers (Step 2)
5. Implement Personality, Framework, HumorSystem (Step 4)
6. Implement TabManager (Step 5)
7. See everything work together!
```

### Option B: Top-Down (Faster to see UI)
```bash
1. Create data files (Step 1)
2. Create popup UI (Step 8) with mock data
3. Implement TabManager (Step 5)
4. Implement Chrome wrappers (Step 2)
5. Fill in Humor System (Step 4)
6. Wire everything together
```

### Option C: Critical Path First
```bash
1. Data files (Step 1.1 - just quips)
2. ChromeTabsAPIWrapper (Step 2.1)
3. TabManager.closeRandomTab (Step 5.1 - partial)
4. Simple popup with "Feeling Lucky?" button (Step 8.3 - partial)
5. Test end-to-end → iterate
6. Add humor layer
7. Add easter eggs
8. Polish
```

---

## 📈 SUCCESS METRICS

### V1.0.0 Launch Criteria
- [ ] "Feeling Lucky?" works 100% of the time
- [ ] At least 20 unique quips available
- [ ] At least 3 easter eggs functional
- [ ] 0 critical bugs
- [ ] <2 seconds load time for popup
- [ ] Works in Chrome without errors
- [ ] All contract tests passing

### Post-Launch Metrics (Future)
- User installs
- "Feeling Lucky?" clicks per user
- Easter egg discovery rate
- Quip display frequency
- User feedback on humor quality

---

**Ready to start?** Pick an option (A, B, or C) and let me know which step you want me to generate first!

**Recommended**: Start with **Step 1.1** (Passive-Aggressive Quips JSON) - it's fun, defines the personality, and everything else builds on it.
