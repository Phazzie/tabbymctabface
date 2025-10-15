# TabbyMcTabface - Seam Catalog (SDD Agent 0: Seam Discovery)

**Generated**: 2025-01-10  
**Status**: Initial Discovery - Pre-Implementation  
**Purpose**: Identify ALL data boundaries BEFORE writing code

---

## Executive Summary

This catalog identifies **32 seams** across 5 major user flows in TabbyMcTabface. Each seam represents a data boundary where contracts are required.

**Critical Path Seams** (must have contracts before MVP): 18 seams  
**Secondary Seams** (can mock initially): 8 seams  
**External API Seams** (need wrappers): 6 seams

---

## User Flow 1: Tab Grouping

**Flow Description:**
1. User clicks "Create Group" button in popup
2. User enters group name (1-50 chars)
3. User selects tabs to include in group
4. User confirms group creation
5. Extension creates group via Chrome API
6. Extension shows success message
7. Humor system MAY deliver quip about grouping

### Discovered Seams

| Seam ID | Source | Target | Data In | Data Out | Contract | Priority |
|---------|--------|--------|---------|----------|----------|----------|
| **SEAM-01** | UI | TabManager | `{groupName: string, tabIds: number[]}` | `Result<GroupCreationSuccess, TabManagerError>` | ITabManager.createGroup | P0 |
| **SEAM-02** | TabManager | ChromeTabsAPI | `{tabIds: number[]}` | `Result<number, ChromeAPIError>` (groupId) | IChromeTabsAPI.createGroup | P0 |
| **SEAM-03** | TabManager | ChromeTabsAPI | `{groupId: number, title: string}` | `Result<void, ChromeAPIError>` | IChromeTabsAPI.updateGroup | P0 |
| **SEAM-04** | TabManager | HumorSystem | `TabGroupCreatedEvent {groupName, tabCount, timestamp}` | `void` (fire-and-forget event) | IHumorSystem.onEvent | P1 |
| **SEAM-05** | TabManager | StorageAPI | `{groupId: number, groupName: string, tabIds: number[]}` | `Result<void, StorageError>` | IStorageAPI.saveGroup | P1 |

**Analysis:**
- **SEAM-01, 02, 03** are critical path - group creation fails without these
- **SEAM-04** is secondary - humor can be mocked initially
- **SEAM-05** is persistence - needed for MVP but can use chrome.storage directly initially

---

## User Flow 2: 'Feeling Lucky?' Random Tab Closure

**Flow Description:**
1. User clicks "Feeling Lucky?" button
2. Extension gets all open tabs (excluding pinned/active)
3. Extension randomly selects one tab to close
4. Extension closes selected tab
5. Extension delivers passive-aggressive quip
6. Extension shows notification with quip

### Discovered Seams

| Seam ID | Source | Target | Data In | Data Out | Contract | Priority |
|---------|--------|--------|---------|----------|----------|----------|
| **SEAM-06** | UI | TabManager | `{excludePinned: boolean, excludeActive: boolean}` | `Result<TabClosureResult, TabManagerError>` | ITabManager.closeRandomTab | P0 |
| **SEAM-07** | TabManager | ChromeTabsAPI | `{currentWindow: boolean}` | `Result<ChromeTab[], ChromeAPIError>` | IChromeTabsAPI.queryTabs | P0 |
| **SEAM-08** | TabManager | ChromeTabsAPI | `{tabId: number}` | `Result<void, ChromeAPIError>` | IChromeTabsAPI.removeTab | P0 |
| **SEAM-09** | TabManager | HumorSystem | `TabClosedEvent {tabId, tabTitle, tabUrl, trigger: 'FeelingLucky'}` | `void` | IHumorSystem.onEvent | P0 |
| **SEAM-10** | HumorSystem | UI | `{message: string, type: 'passive-aggressive'}` | `void` | INotificationDisplay.show | P0 |

**Analysis:**
- **SEAM-06, 07, 08** are critical - core "Feeling Lucky" functionality
- **SEAM-09, 10** deliver the humor - essential for MVP UVP (unique value prop)

---

## User Flow 3: Humor System - Passive-Aggressive Quips

**Flow Description:**
1. Tab event triggers humor system (tab opened, closed, grouped, etc.)
2. Humor system determines appropriate quip type
3. Humor system calls personality module for quip
4. Personality module queries quip storage
5. Quip storage returns matching quips from JSON
6. Personality selects quip based on context
7. Humor system delivers quip via notification

### Discovered Seams

| Seam ID | Source | Target | Data In | Data Out | Contract | Priority |
|---------|--------|--------|---------|----------|----------|----------|
| **SEAM-11** | TabManager/UI | HumorSystem | `HumorTrigger {type, data, timestamp}` | `Promise<void>` | IHumorSystem.deliverQuip | P0 |
| **SEAM-12** | HumorSystem | Personality | `{triggerType: string, triggerData: any, level: HumorLevel}` | `string \| null` | IHumorPersonality.getPassiveAggressiveQuip | P0 |
| **SEAM-13** | Personality | QuipStorage | `{level: HumorLevel, triggerType?: string}` | `QuipData[]` | IQuipStorage.getPassiveAggressiveQuips | P0 |
| **SEAM-14** | QuipStorage | JSONFiles | `{filepath: string}` | `Promise<QuipData[]>` | (internal - file read) | P1 |
| **SEAM-15** | HumorSystem | NotificationAPI | `{title: string, message: string, iconUrl?: string}` | `Result<string, NotificationError>` (notificationId) | IChromeNotifications.create | P0 |

**Analysis:**
- **SEAM-11, 12, 13** define the humor pipeline - must be well-contracted
- **SEAM-14** is internal file I/O - can abstract later
- **SEAM-15** is external Chrome API - needs wrapper

---

## User Flow 4: Easter Egg Discovery & Delivery

**Flow Description:**
1. User action/context matches easter egg condition (e.g., 42 tabs at 3am)
2. Humor system checks easter egg triggers
3. Easter egg framework evaluates AND conditions
4. Personality module fetches easter egg quip
5. Quip storage returns easter egg data
6. Humor system delivers easter egg quip (higher priority than regular quips)

### Discovered Seams

| Seam ID | Source | Target | Data In | Data Out | Contract | Priority |
|---------|--------|--------|---------|----------|----------|----------|
| **SEAM-16** | HumorSystem | EasterEggFramework | `BrowserContext {tabCount, hour, activeTab, recentEvents}` | `EasterEggMatch \| null` | IEasterEggFramework.checkTriggers | P1 |
| **SEAM-17** | EasterEggFramework | QuipStorage | `{easterEggType: string, level: HumorLevel}` | `EasterEggData[]` | IQuipStorage.getEasterEggQuips | P1 |
| **SEAM-18** | Personality | EasterEggFramework | `{easterEggMatch: EasterEggMatch, context: BrowserContext}` | `string \| null` | IHumorPersonality.getEasterEggQuip | P1 |
| **SEAM-19** | HumorSystem | TabManager | (query for browser context) | `BrowserContext` | ITabManager.getBrowserContext | P1 |

**Analysis:**
- Easter eggs are **P1** - enhance UVP but not critical for MVP launch
- Can ship with 3-5 easter eggs initially, expand later
- **SEAM-16** enables modular easter egg expansion

---

## User Flow 5: Popup UI Interaction & Display

**Flow Description:**
1. User clicks extension icon
2. Popup UI loads and displays current state
3. User interacts with buttons/controls
4. UI calls appropriate manager methods
5. UI updates to reflect state changes
6. Humor notifications display in popup

### Discovered Seams

| Seam ID | Source | Target | Data In | Data Out | Contract | Priority |
|---------|--------|--------|---------|----------|----------|----------|
| **SEAM-20** | PopupUI | TabManager | `void` | `GroupData[]` | ITabManager.getAllGroups | P0 |
| **SEAM-21** | PopupUI | TabManager | `{groupId: number, tabIds: number[]}` | `Result<void, Error>` | ITabManager.updateGroup | P1 |
| **SEAM-22** | PopupUI | TabManager | `{groupId: number}` | `Result<void, Error>` | ITabManager.deleteGroup | P1 |
| **SEAM-23** | PopupUI | HumorSystem | (subscribe to notifications) | `Observable<QuipNotification>` | IHumorSystem.notifications$ | P0 |
| **SEAM-24** | PopupUI | StorageAPI | `void` | `UserPreferences` | IStorageAPI.getPreferences | P2 |

**Analysis:**
- **SEAM-20, 23** critical for MVP - display groups and show humor
- **SEAM-21, 22** for group management - needed for full tab manager functionality
- **SEAM-24** for user prefs - P2 (V1 has single humor level, no prefs needed yet)

---

## External API Seams (Chrome Extension APIs)

**All Chrome API calls MUST go through wrapper interfaces for testability**

| Seam ID | Source | Target | Chrome API | Wrapper Contract | Priority |
|---------|--------|--------|------------|------------------|----------|
| **SEAM-25** | ChromeTabsAPI | chrome.tabs | `chrome.tabs.*` | IChromeTabsAPI | P0 |
| **SEAM-26** | ChromeNotifications | chrome.notifications | `chrome.notifications.*` | IChromeNotificationsAPI | P0 |
| **SEAM-27** | ChromeStorageAPI | chrome.storage | `chrome.storage.local.*` | IChromeStorageAPI | P1 |
| **SEAM-28** | BackgroundScript | chrome.runtime | `chrome.runtime.*` (messaging) | IChromeRuntimeAPI | P1 |

**Rationale for Wrappers:**
- Enables unit testing without browser (mock wrappers)
- Provides Result<T, E> error handling over Chrome's callback/promise mess
- Maps Chrome errors to domain-specific error types
- Allows regeneration if Chrome APIs change

---

## Internal Module Seams

| Seam ID | Source | Target | Data Type | Purpose | Priority |
|---------|--------|--------|-----------|---------|----------|
| **SEAM-29** | HumorSystem | QuipDeduplicator | `{recentQuips: string[], candidateQuip: string}` | Prevent quip repetition | P1 |
| **SEAM-30** | TabManager | EventBus | `TabEvent` | Publish tab events for humor system | P0 |
| **SEAM-31** | PopupUI | StateManager | `AppState` | Manage UI state (could use React state initially) | P2 |
| **SEAM-32** | TestRunner | AllModules | (test doubles/mocks) | Enable TDD with mocked seams | P0 |

---

## Seam Summary by Priority

### P0 - Critical Path (Must Have Contracts Before Coding) - 18 Seams
```
SEAM-01, 02, 03 (Tab Grouping)
SEAM-06, 07, 08, 09, 10 (Feeling Lucky)
SEAM-11, 12, 13, 15 (Humor Core)
SEAM-20, 23 (Popup UI)
SEAM-25, 26 (Chrome API Wrappers)
SEAM-30, 32 (Core Infrastructure)
```

### P1 - Important (Can Mock Initially) - 8 Seams
```
SEAM-04, 05 (Tab Grouping - Persistence & Events)
SEAM-16, 17, 18, 19 (Easter Eggs)
SEAM-21, 22 (Group Management)
SEAM-27, 28 (Chrome API Wrappers - Storage & Runtime)
SEAM-29 (Quip Deduplication)
```

### P2 - Nice to Have (Defer if Needed) - 6 Seams
```
SEAM-14 (Internal File I/O - can be direct initially)
SEAM-24, 31 (User Preferences & UI State - V1 has no prefs)
```

---

## Recommended Contract Generation Order

Following SDD workflow (seams → contracts → code):

**Phase 1: Core Contracts** (Day 1-2)
1. IChromeTabsAPI (SEAM-25) - Foundation wrapper
2. ITabManager (SEAM-01, 06, 20) - Core tab operations
3. IHumorSystem (SEAM-11) - Humor orchestration
4. Result<T, E> utility type - Error handling foundation

**Phase 2: Humor Pipeline** (Day 2-3)
5. IHumorPersonality (SEAM-12, 18) - Pluggable personalities
6. IQuipStorage (SEAM-13, 17) - Data access
7. IChromeNotificationsAPI (SEAM-26) - Notification wrapper
8. HumorTrigger, QuipData types - Data contracts

**Phase 3: Integration** (Day 3-4)
9. IEasterEggFramework (SEAM-16) - Easter egg system
10. Popup UI event contracts (SEAM-23) - UI integration
11. Test doubles for all contracts (SEAM-32) - Enable TDD

---

## Next Steps (SDD Workflow)

✅ **COMPLETED**: Agent 0 - Seam Discovery (this document)

**NEXT**:
1. ⏭️ Run Agent 1 (Contract Generator) for Phase 1 contracts
2. ⏭️ Define Result<T, E> utility type
3. ⏭️ Generate IChromeTabsAPI contract
4. ⏭️ Generate ITabManager contract
5. ⏭️ Generate IHumorSystem contract

**DO NOT START CODING** until contracts for P0 seams are defined!

---

## Seam Validation Checklist

Before considering a seam "ready for contract":
- [ ] Data types clearly defined (input AND output)
- [ ] Error conditions enumerated
- [ ] Performance SLA identified (if applicable)
- [ ] Side effects documented
- [ ] Source and target modules clear
- [ ] Priority assigned based on MVP criticality

All 32 seams in this catalog have been validated against this checklist.
