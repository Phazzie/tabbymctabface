# Mock Implementation Roadmap - TabbyMcTabface

**Created**: 2025-10-12  
**Purpose**: Complete path to building all mock implementations (Step 7 of SDD workflow)  
**Estimated Time**: 3-4 hours total for all 9 mocks

---

## 🎯 Why Mock-First?

**Goal**: Build ALL mock implementations before ANY real implementations

**Benefits**:
1. ✅ Enables UI development immediately (no Chrome APIs needed)
2. ✅ Proves contracts are usable (if mocks can't implement them, contracts are broken)
3. ✅ Validates seam architecture (swappable implementations)
4. ✅ Provides test doubles for unit testing
5. ✅ Allows parallel development (UI team uses mocks while backend team builds real)

**Success Criteria**: Every mock passes its contract tests with fake data

---

## 📊 Mock Inventory (9 Total)

| Mock | Contract | Methods | Complexity | Time Est. | Priority |
|------|----------|---------|------------|-----------|----------|
| **MockChromeTabsAPI** | IChromeTabsAPI | 5 | Low | 20-30 min | P0 |
| **MockChromeNotificationsAPI** | IChromeNotificationsAPI | 3 | Low | 15-20 min | P0 |
| **MockChromeStorageAPI** | IChromeStorageAPI | 5 | Low | 20-25 min | P1 |
| **MockQuipStorage** | IQuipStorage | 5 | Medium | 30-40 min | P0 |
| **MockHumorPersonality** | IHumorPersonality | 4 | Medium | 25-30 min | P0 |
| **MockEasterEggFramework** | IEasterEggFramework | 4 | Medium | 30-35 min | P1 |
| **MockHumorSystem** | IHumorSystem | 4 | High | 40-50 min | P0 |
| **MockTabManager** | ITabManager | 6 | High | 45-60 min | P0 |
| **MockObservable** | Observable<T> | N/A | Low | 10-15 min | P0 |

**Total Time**: ~3.5-4.5 hours

---

## 🏗️ Implementation Strategy

### **Phase 1: Foundation Mocks** (1 hour)
Build the simplest mocks first - external API wrappers

1. **MockChromeTabsAPI** (20-30 min)
2. **MockChromeNotificationsAPI** (15-20 min)
3. **MockChromeStorageAPI** (20-25 min)
4. **MockObservable** (10-15 min)

**Why First**: No dependencies, simple return values, unblocks everything else

---

### **Phase 2: Data Layer Mocks** (1 hour)
Build mocks for data access and personality

5. **MockQuipStorage** (30-40 min)
6. **MockHumorPersonality** (25-30 min)
7. **MockEasterEggFramework** (30-35 min)

**Why Second**: Depends only on data structures, no complex logic

---

### **Phase 3: Orchestration Mocks** (1.5-2 hours)
Build complex mocks that coordinate multiple dependencies

8. **MockHumorSystem** (40-50 min)
9. **MockTabManager** (45-60 min)

**Why Last**: Highest complexity, depends on understanding lower-level mocks

---

## 📝 Detailed Implementation Plan

---

## **MOCK 1: MockChromeTabsAPI** ⭐ START HERE

**File**: `src/mocks/MockChromeTabsAPI.ts`  
**Contract**: `IChromeTabsAPI`  
**Time**: 20-30 minutes  
**Complexity**: Low

### Methods to Mock:

```typescript
class MockChromeTabsAPI implements IChromeTabsAPI {
  // Mock state
  private mockTabs: ChromeTab[] = [];
  private mockGroups: ChromeTabGroup[] = [];
  private nextGroupId = 1;
  private nextTabId = 100;

  async createGroup(tabIds: number[]): Promise<Result<number, ChromeTabsError>> {
    // Return fake group ID
    const groupId = this.nextGroupId++;
    this.mockGroups.push({ id: groupId, title: '', color: 'grey', collapsed: false });
    return Result.ok(groupId);
  }

  async updateGroup(groupId: number, properties: GroupProperties): Promise<Result<void, ChromeTabsError>> {
    // Find mock group, update it
    const group = this.mockGroups.find(g => g.id === groupId);
    if (!group) return Result.error({ type: 'InvalidGroupId', groupId, details: 'Not found' });
    Object.assign(group, properties);
    return Result.ok(undefined);
  }

  async queryTabs(queryInfo: QueryInfo): Promise<Result<ChromeTab[], ChromeTabsError>> {
    // Return fake tabs
    return Result.ok(this.mockTabs);
  }

  async removeTab(tabId: number): Promise<Result<void, ChromeTabsError>> {
    // Remove from mock state
    this.mockTabs = this.mockTabs.filter(t => t.id !== tabId);
    return Result.ok(undefined);
  }

  async getAllGroups(): Promise<Result<ChromeTabGroup[], ChromeTabsError>> {
    return Result.ok(this.mockGroups);
  }

  // Helper: Seed mock data
  seedMockTabs(tabs: ChromeTab[]): void {
    this.mockTabs = tabs;
  }
}
```

### Fake Data Strategy:
- Start with 5-10 fake tabs in `mockTabs`
- Incrementing IDs for new tabs/groups
- Simple in-memory arrays (no persistence)

### Contract Tests to Pass:
- All 52 IChrome TabsAPI contract tests should pass with mock

---

## **MOCK 2: MockChromeNotificationsAPI**

**File**: `src/mocks/MockChromeNotificationsAPI.ts`  
**Contract**: `IChromeNotificationsAPI`  
**Time**: 15-20 minutes  
**Complexity**: Low

### Methods to Mock:

```typescript
class MockChromeNotificationsAPI implements IChromeNotificationsAPI {
  private notifications = new Map<string, NotificationOptions>();
  private nextNotificationId = 1;

  async create(options: NotificationOptions): Promise<Result<string, NotificationError>> {
    const notificationId = `mock-notif-${this.nextNotificationId++}`;
    this.notifications.set(notificationId, options);
    return Result.ok(notificationId);
  }

  async clear(notificationId: string): Promise<Result<boolean, NotificationError>> {
    const existed = this.notifications.has(notificationId);
    this.notifications.delete(notificationId);
    return Result.ok(existed);
  }

  async update(notificationId: string, options: NotificationOptions): Promise<Result<boolean, NotificationError>> {
    if (!this.notifications.has(notificationId)) {
      return Result.ok(false);
    }
    this.notifications.set(notificationId, options);
    return Result.ok(true);
  }

  // Helper: Get all mock notifications (for testing)
  getMockNotifications(): NotificationOptions[] {
    return Array.from(this.notifications.values());
  }
}
```

### Fake Data Strategy:
- Store notifications in Map (in-memory)
- Auto-incrementing IDs
- No actual browser notifications

---

## **MOCK 3: MockChromeStorageAPI**

**File**: `src/mocks/MockChromeStorageAPI.ts`  
**Contract**: `IChromeStorageAPI`  
**Time**: 20-25 minutes  
**Complexity**: Low

### Methods to Mock:

```typescript
class MockChromeStorageAPI implements IChromeStorageAPI {
  private storage: Record<string, any> = {};

  async get(keys?: string | string[]): Promise<Result<Record<string, any>, StorageError>> {
    if (!keys) return Result.ok({ ...this.storage });
    
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const result: Record<string, any> = {};
    keysArray.forEach(key => {
      if (key in this.storage) result[key] = this.storage[key];
    });
    return Result.ok(result);
  }

  async set(items: Record<string, any>): Promise<Result<void, StorageError>> {
    Object.assign(this.storage, items);
    return Result.ok(undefined);
  }

  async remove(keys: string | string[]): Promise<Result<void, StorageError>> {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => delete this.storage[key]);
    return Result.ok(undefined);
  }

  async clear(): Promise<Result<void, StorageError>> {
    this.storage = {};
    return Result.ok(undefined);
  }

  async getBytesInUse(keys?: string | string[]): Promise<Result<number, StorageError>> {
    // Fake byte count
    const json = JSON.stringify(this.storage);
    return Result.ok(json.length);
  }

  // Helper: Seed initial data
  seedStorage(data: Record<string, any>): void {
    this.storage = { ...data };
  }
}
```

---

## **MOCK 4: MockObservable<T>**

**File**: `src/mocks/MockObservable.ts`  
**Contract**: `Observable<T>` (from IHumorSystem)  
**Time**: 10-15 minutes  
**Complexity**: Low

### Simple Observable Implementation:

```typescript
export class MockObservable<T> implements Observable<T> {
  private observers: ((value: T) => void)[] = [];

  subscribe(observer: (value: T) => void): Subscription {
    this.observers.push(observer);
    return {
      unsubscribe: () => {
        this.observers = this.observers.filter(o => o !== observer);
      }
    };
  }

  // Helper: Emit value to all observers (for testing)
  emit(value: T): void {
    this.observers.forEach(observer => observer(value));
  }

  // Helper: Get subscriber count (for testing)
  getSubscriberCount(): number {
    return this.observers.length;
  }
}
```

**Why Needed**: IHumorSystem.notifications$ returns Observable<QuipNotification>

---

## **MOCK 5: MockQuipStorage**

**File**: `src/mocks/MockQuipStorage.ts`  
**Contract**: `IQuipStorage`  
**Time**: 30-40 minutes  
**Complexity**: Medium

### Methods to Mock:

```typescript
class MockQuipStorage implements IQuipStorage {
  private initialized = false;
  private mockQuips: QuipData[] = [
    { id: 'mock-1', text: 'Oh, another tab group. How organized of you. 🙄', level: 'default', triggerType: 'TabGroupCreated' },
    { id: 'mock-2', text: 'Feeling lucky? More like feeling reckless.', level: 'default', triggerType: 'TabClosed' },
    // ... more fake quips
  ];
  private mockEasterEggs: EasterEggData[] = [
    { 
      id: 'mock-ee-1', 
      type: '42-tabs', 
      quip: 'The answer to life, the universe, and your tab count! 🎉',
      conditions: { tabCount: { exact: 42 } },
      priority: 10
    },
    // ... more fake easter eggs
  ];

  async initialize(): Promise<Result<void, QuipStorageError>> {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 10));
    this.initialized = true;
    return Result.ok(undefined);
  }

  async getPassiveAggressiveQuips(level: HumorLevel, triggerType?: string): Promise<Result<QuipData[], QuipStorageError>> {
    if (!this.initialized) {
      return Result.error({ type: 'NotInitialized', details: 'Call initialize() first' });
    }
    
    let filtered = this.mockQuips.filter(q => q.level === level);
    if (triggerType) {
      filtered = filtered.filter(q => q.triggerType === triggerType);
    }
    return Result.ok(filtered);
  }

  async getEasterEggQuips(easterEggType: string, level: HumorLevel): Promise<Result<EasterEggData[], QuipStorageError>> {
    if (!this.initialized) {
      return Result.error({ type: 'NotInitialized', details: 'Call initialize() first' });
    }
    
    const filtered = this.mockEasterEggs.filter(ee => ee.type === easterEggType);
    return Result.ok(filtered);
  }

  async getAvailableTriggerTypes(): Promise<Result<string[], QuipStorageError>> {
    const types = [...new Set(this.mockQuips.map(q => q.triggerType))];
    return Result.ok(types);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Helper: Add more mock quips
  addMockQuip(quip: QuipData): void {
    this.mockQuips.push(quip);
  }
}
```

### Fake Data Strategy:
- Hardcode 10-15 diverse quips covering all trigger types
- Hardcode 3-5 easter eggs
- In-memory arrays (no file I/O)

---

## **MOCK 6: MockHumorPersonality**

**File**: `src/mocks/MockHumorPersonality.ts`  
**Contract**: `IHumorPersonality`  
**Time**: 25-30 minutes  
**Complexity**: Medium

### Methods to Mock:

```typescript
class MockHumorPersonality implements IHumorPersonality {
  constructor(private quipStorage: IQuipStorage) {}

  async getPassiveAggressiveQuip(
    triggerType: HumorTriggerType,
    data: HumorTriggerData,
    level: HumorLevel
  ): Promise<Result<string | null, PersonalityError>> {
    const quipsResult = await this.quipStorage.getPassiveAggressiveQuips(level, triggerType);
    
    if (quipsResult.isError()) {
      return Result.error({ 
        type: 'StorageFailure', 
        details: 'Failed to load quips', 
        originalError: quipsResult.error 
      });
    }

    const quips = quipsResult.value;
    if (quips.length === 0) return Result.ok(null);

    // Random selection
    const randomQuip = quips[Math.floor(Math.random() * quips.length)];
    return Result.ok(randomQuip.text);
  }

  async getEasterEggQuip(
    easterEggMatch: EasterEggMatch,
    context: BrowserContext
  ): Promise<Result<string | null, PersonalityError>> {
    const eggsResult = await this.quipStorage.getEasterEggQuips(easterEggMatch.easterEggType, 'default');
    
    if (eggsResult.isError()) {
      return Result.error({ 
        type: 'StorageFailure', 
        details: 'Failed to load easter eggs', 
        originalError: eggsResult.error 
      });
    }

    const eggs = eggsResult.value;
    if (eggs.length === 0) return Result.ok(null);

    return Result.ok(eggs[0].quip);
  }

  getMetadata(): PersonalityMetadata {
    return {
      name: 'Mock Personality',
      version: '1.0.0-mock',
      supportedLevels: ['default'],
      description: 'Mock personality for testing'
    };
  }

  supportsLevel(level: HumorLevel): boolean {
    return level === 'default';
  }
}
```

---

## **MOCK 7: MockEasterEggFramework**

**File**: `src/mocks/MockEasterEggFramework.ts`  
**Contract**: `IEasterEggFramework`  
**Time**: 30-35 minutes  
**Complexity**: Medium

### Methods to Mock:

```typescript
class MockEasterEggFramework implements IEasterEggFramework {
  private easterEggs: EasterEggDefinition[] = [
    {
      id: 'mock-42-tabs',
      type: '42-tabs',
      conditions: { tabCount: { exact: 42 } },
      priority: 10
    },
    {
      id: 'mock-3am',
      type: '3am-browsing',
      conditions: { hourRange: { start: 3, end: 4 } },
      priority: 8
    }
  ];

  async checkTriggers(context: BrowserContext): Promise<Result<EasterEggMatch | null, EasterEggError>> {
    // Simple condition evaluation
    for (const egg of this.easterEggs) {
      if (this.matchesConditions(egg.conditions, context)) {
        return Result.ok({
          easterEggId: egg.id,
          easterEggType: egg.type,
          matchedConditions: Object.keys(egg.conditions),
          priority: egg.priority
        });
      }
    }
    return Result.ok(null);
  }

  async registerEasterEgg(definition: EasterEggDefinition): Promise<Result<void, EasterEggError>> {
    if (this.easterEggs.some(e => e.id === definition.id)) {
      return Result.error({ 
        type: 'DuplicateEasterEggId', 
        easterEggId: definition.id, 
        details: 'Already registered' 
      });
    }
    this.easterEggs.push(definition);
    return Result.ok(undefined);
  }

  async getAllEasterEggs(): Promise<Result<EasterEggDefinition[], EasterEggError>> {
    return Result.ok([...this.easterEggs]);
  }

  async clearAll(): Promise<Result<void, EasterEggError>> {
    this.easterEggs = [];
    return Result.ok(undefined);
  }

  // Helper: Simple condition matcher
  private matchesConditions(conditions: EasterEggConditions, context: BrowserContext): boolean {
    if (conditions.tabCount) {
      if ('exact' in conditions.tabCount && context.tabCount !== conditions.tabCount.exact) {
        return false;
      }
      if ('min' in conditions.tabCount && context.tabCount < conditions.tabCount.min!) {
        return false;
      }
      if ('max' in conditions.tabCount && context.tabCount > conditions.tabCount.max!) {
        return false;
      }
    }
    // Add more condition checks as needed
    return true;
  }
}
```

---

## **MOCK 8: MockHumorSystem** 🔥 COMPLEX

**File**: `src/mocks/MockHumorSystem.ts`  
**Contract**: `IHumorSystem`  
**Time**: 40-50 minutes  
**Complexity**: High

### Methods to Mock:

```typescript
class MockHumorSystem implements IHumorSystem {
  private notificationsSubject = new MockObservable<QuipNotification>();
  private eventHandlers = new Map<TabEventType, ((event: TabEvent) => void)[]>();

  constructor(
    private personality: IHumorPersonality,
    private easterEggFramework: IEasterEggFramework
  ) {}

  async deliverQuip(trigger: HumorTrigger): Promise<Result<QuipDeliveryResult, HumorError>> {
    // Try easter egg first
    const context: BrowserContext = {
      tabCount: 10,
      activeTab: null,
      currentHour: new Date().getHours(),
      recentEvents: [],
      groupCount: 2
    };

    const easterEggResult = await this.easterEggFramework.checkTriggers(context);
    if (easterEggResult.isOk() && easterEggResult.value) {
      const eggQuipResult = await this.personality.getEasterEggQuip(easterEggResult.value, context);
      if (eggQuipResult.isOk() && eggQuipResult.value) {
        const notification: QuipNotification = {
          id: `notif-${Date.now()}`,
          quipText: eggQuipResult.value,
          isEasterEgg: true,
          timestamp: Date.now(),
          displayDuration: 5000
        };
        this.notificationsSubject.emit(notification);
        
        return Result.ok({
          delivered: true,
          quipText: eggQuipResult.value,
          deliveryMethod: 'popup',
          isEasterEgg: true,
          timestamp: Date.now()
        });
      }
    }

    // Fallback to regular quip
    const quipResult = await this.personality.getPassiveAggressiveQuip(
      trigger.type,
      trigger.data,
      'default'
    );

    if (quipResult.isError()) {
      return Result.error({
        type: 'PersonalityFailure',
        details: 'Failed to get quip',
        originalError: quipResult.error
      });
    }

    if (!quipResult.value) {
      return Result.error({
        type: 'NoQuipsAvailable',
        details: 'No quips for trigger',
        triggerType: trigger.type
      });
    }

    const notification: QuipNotification = {
      id: `notif-${Date.now()}`,
      quipText: quipResult.value,
      isEasterEgg: false,
      timestamp: Date.now(),
      displayDuration: 3000
    };
    this.notificationsSubject.emit(notification);

    return Result.ok({
      delivered: true,
      quipText: quipResult.value,
      deliveryMethod: 'popup',
      isEasterEgg: false,
      timestamp: Date.now()
    });
  }

  async checkEasterEggs(context: BrowserContext): Promise<Result<EasterEggMatch | null, HumorError>> {
    const result = await this.easterEggFramework.checkTriggers(context);
    if (result.isError()) {
      return Result.error({
        type: 'EasterEggCheckFailed',
        details: 'Framework check failed'
      });
    }
    return Result.ok(result.value);
  }

  get notifications$(): Observable<QuipNotification> {
    return this.notificationsSubject;
  }

  onTabEvent(eventType: TabEventType, handler: (event: TabEvent) => void): UnsubscribeFn {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  // Helper: Trigger event for testing
  triggerEvent(event: TabEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }
}
```

---

## **MOCK 9: MockTabManager** 🔥 MOST COMPLEX

**File**: `src/mocks/MockTabManager.ts`  
**Contract**: `ITabManager`  
**Time**: 45-60 minutes  
**Complexity**: High

### Methods to Mock:

```typescript
class MockTabManager implements ITabManager {
  constructor(
    private chromeAPI: IChromeTabsAPI,
    private humorSystem: IHumorSystem
  ) {}

  async createGroup(groupName: string, tabIds: number[]): Promise<Result<GroupCreationSuccess, TabManagerError>> {
    // Input validation
    if (!groupName || groupName.length === 0 || groupName.length > 50) {
      return Result.error({
        type: 'InvalidGroupName',
        details: 'Group name must be 1-50 characters'
      });
    }

    if (!tabIds || tabIds.length === 0) {
      return Result.error({
        type: 'NoTabsSelected',
        details: 'At least one tab required'
      });
    }

    // Call Chrome API mock
    const createResult = await this.chromeAPI.createGroup(tabIds);
    if (createResult.isError()) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to create group',
        originalError: createResult.error
      });
    }

    const groupId = createResult.value;

    // Update group title
    await this.chromeAPI.updateGroup(groupId, { title: groupName });

    // Emit event to humor system
    await this.humorSystem.deliverQuip({
      type: 'TabGroupCreated',
      data: { type: 'TabGroupCreated', groupName, tabCount: tabIds.length },
      timestamp: Date.now()
    });

    return Result.ok({
      groupId,
      groupName,
      tabCount: tabIds.length,
      timestamp: Date.now()
    });
  }

  async closeRandomTab(options?: RandomTabOptions): Promise<Result<TabClosureResult, TabManagerError>> {
    const excludePinned = options?.excludePinned ?? true;
    const excludeActive = options?.excludeActive ?? true;

    // Get all tabs
    const tabsResult = await this.chromeAPI.queryTabs({ currentWindow: true });
    if (tabsResult.isError()) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to query tabs',
        originalError: tabsResult.error
      });
    }

    let eligibleTabs = tabsResult.value;
    if (excludePinned) eligibleTabs = eligibleTabs.filter(t => !t.pinned);
    if (excludeActive) eligibleTabs = eligibleTabs.filter(t => !t.active);

    if (eligibleTabs.length === 0) {
      return Result.error({
        type: 'NoTabsToClose',
        details: 'No eligible tabs to close',
        reason: 'All tabs are pinned or active'
      });
    }

    // Random selection
    const randomTab = eligibleTabs[Math.floor(Math.random() * eligibleTabs.length)];

    // Close tab
    const closeResult = await this.chromeAPI.removeTab(randomTab.id);
    if (closeResult.isError()) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to close tab',
        originalError: closeResult.error
      });
    }

    // Emit event
    await this.humorSystem.deliverQuip({
      type: 'TabClosed',
      data: { 
        type: 'TabClosed', 
        tabTitle: randomTab.title, 
        tabUrl: randomTab.url, 
        trigger: 'FeelingLucky' 
      },
      timestamp: Date.now()
    });

    return Result.ok({
      closedTabId: randomTab.id,
      closedTabTitle: randomTab.title,
      closedTabUrl: randomTab.url,
      remainingCount: eligibleTabs.length - 1,
      timestamp: Date.now()
    });
  }

  async getAllGroups(): Promise<Result<GroupData[], TabManagerError>> {
    const groupsResult = await this.chromeAPI.getAllGroups();
    if (groupsResult.isError()) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to get groups',
        originalError: groupsResult.error
      });
    }

    const groupData: GroupData[] = groupsResult.value.map(g => ({
      groupId: g.id,
      groupName: g.title || 'Unnamed Group',
      tabCount: 0, // Mock doesn't track tabs per group
      tabs: [],
      color: g.color,
      collapsed: g.collapsed
    }));

    return Result.ok(groupData);
  }

  async updateGroup(groupId: number, updates: GroupUpdateData): Promise<Result<void, TabManagerError>> {
    if (updates.name && (updates.name.length === 0 || updates.name.length > 50)) {
      return Result.error({
        type: 'InvalidGroupName',
        details: 'Group name must be 1-50 characters'
      });
    }

    const updateResult = await this.chromeAPI.updateGroup(groupId, {
      title: updates.name,
      color: updates.color,
      collapsed: updates.collapsed
    });

    if (updateResult.isError()) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to update group',
        originalError: updateResult.error
      });
    }

    return Result.ok(undefined);
  }

  async deleteGroup(groupId: number): Promise<Result<void, TabManagerError>> {
    // Chrome ungroups tabs when deleting group
    // Mock doesn't implement full logic, just validates groupId
    const groupsResult = await this.chromeAPI.getAllGroups();
    if (groupsResult.isOk()) {
      const groupExists = groupsResult.value.some(g => g.id === groupId);
      if (!groupExists) {
        return Result.error({
          type: 'InvalidGroupId',
          details: 'Group not found',
          groupId
        });
      }
    }

    return Result.ok(undefined);
  }

  async getBrowserContext(): Promise<Result<BrowserContext, TabManagerError>> {
    const tabsResult = await this.chromeAPI.queryTabs({ currentWindow: true });
    const groupsResult = await this.chromeAPI.getAllGroups();

    const tabCount = tabsResult.isOk() ? tabsResult.value.length : 0;
    const groupCount = groupsResult.isOk() ? groupsResult.value.length : 0;
    const activeTab = tabsResult.isOk() 
      ? tabsResult.value.find(t => t.active) 
      : null;

    return Result.ok({
      tabCount,
      activeTab: activeTab ? {
        url: activeTab.url,
        title: activeTab.title,
        domain: new URL(activeTab.url).hostname
      } : null,
      currentHour: new Date().getHours(),
      recentEvents: [],
      groupCount
    });
  }
}
```

---

## ✅ Completion Checklist

### Phase 1: Foundation (1 hour)
- [ ] MockChromeTabsAPI created (20-30 min)
- [ ] MockChromeNotificationsAPI created (15-20 min)
- [ ] MockChromeStorageAPI created (20-25 min)
- [ ] MockObservable created (10-15 min)
- [ ] All Phase 1 mocks pass contract tests

### Phase 2: Data Layer (1 hour)
- [ ] MockQuipStorage created (30-40 min)
- [ ] MockHumorPersonality created (25-30 min)
- [ ] MockEasterEggFramework created (30-35 min)
- [ ] All Phase 2 mocks pass contract tests

### Phase 3: Orchestration (1.5-2 hours)
- [ ] MockHumorSystem created (40-50 min)
- [ ] MockTabManager created (45-60 min)
- [ ] All Phase 3 mocks pass contract tests

### Validation
- [ ] All 9 mocks implement their contracts
- [ ] All mocks return fake data (no real Chrome API calls)
- [ ] All mocks pass contract tests
- [ ] Mock registry/factory created (optional)
- [ ] UI can be wired with mocks

---

## 🚀 Next Steps After Mocks Complete

1. **Wire Mocks into UI** - Build popup.html using mock implementations
2. **Validate Data Flows** - Prove seam architecture works end-to-end
3. **Identify Contract Issues** - If mocks can't implement contracts, fix contracts
4. **Build Real Implementations** - Swap mocks for real one seam at a time
5. **Integration Tests** - Validate real implementations work together

---

## 📊 Success Metrics

**How to know mocks are done:**
- ✅ All 9 mock classes compile without errors
- ✅ All contract tests pass (372 tests)
- ✅ UI can be built using only mocks (no Chrome APIs)
- ✅ Mock state can be inspected/seeded for testing
- ✅ Mocks demonstrate swappability (easy to replace with real)

---

**Ready to start?** Let's build **Phase 1: Foundation Mocks** right now! 🚀
