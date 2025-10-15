# TabbyMcTabface - Seam-Driven Development Instructions

**Last Updated**: 2025-10-12  
**Project Status**: Contract Test Phase Complete (9 contracts, 32 seams, 372 tests)  
**Purpose**: TabbyMcTabface is a **test case for Seam-Driven Development (SDD)** - demonstrating that this methodology produces maintainable, testable, well-documented code

---

## ⚠️ CRITICAL: SDD COMPLIANCE MANDATE

**ALL plans, suggestions, implementations, and code generation MUST follow Seam-Driven Development principles.**

**Before suggesting ANY code or implementation:**
1. ✅ Identify seams FIRST - what data boundaries are crossed?
2. ✅ Check if contracts exist - do we have TypeScript interfaces for these seams?
3. ✅ Verify contract tests exist - are there tests validating the contract?
4. ✅ If no tests, generate contract tests BEFORE implementation
5. ✅ ONLY THEN suggest implementations that satisfy the contract tests

**Never suggest:**
- ❌ Writing code before identifying seams
- ❌ Creating implementations without contracts
- ❌ Skipping contract tests
- ❌ Using exceptions instead of Result<T, E>
- ❌ Bypassing the SDD workflow

**This is non-negotiable. SDD is the methodology being validated by this project.**

---

## Core Philosophy

You are working on **TabbyMcTabface**, a Chrome extension built using **Seam-Driven Development (SDD)**. This methodology prioritizes:

1. **Seams First** - Identify ALL data boundaries before writing code
2. **Contracts From Seams** - Every seam gets an explicit contract
3. **Tests From Contracts** - Write contract tests BEFORE implementation (TDD)
4. **Implementation From Tests** - Generate code to pass the contract tests
5. **Mock First** - Build mock implementations, prove flows work, then swap to real implementations
6. **Regenerate Over Debug** - After 2 failed debug attempts, regenerate from contract
7. **Document Data Flow** - Every file explains WHAT/WHY/HOW

**Why This Matters**: TabbyMcTabface serves as a real-world validation of SDD. We're proving that:
- Identifying seams first prevents architectural rework
- Contracts eliminate ambiguity and enable parallel development
- Mock-first approach enables rapid prototyping and parallel UI development
- Generated code is more maintainable than hand-written code
- Result<T, E> error handling is superior to exceptions

## SDD Workflow (ALWAYS Follow This Order)

### Step 1: Identify Seams FIRST
**Before writing ANY code**, identify all seams:

```
A SEAM is any place where:
- Data crosses a module boundary (UI → Core, Core → Storage)
- Code calls an external API (Chrome APIs, LLM APIs)
- Events flow between components (Humor System → Notifications)
- State changes hands (Memory → Persistence)

Rule: If data flows across a line, it's a seam.
```

**Example Seam Discovery:**
```
User clicks "Create Group" button
  ↓ SEAM-01: UI → TabManager (data: groupName, tabIds[])
  ↓ SEAM-20: TabManager → Chrome Tabs API (data: tabIds[])
  ↓ SEAM-21: Chrome API → TabManager (data: groupId or error)
  ↓ SEAM-08: TabManager → HumorSystem (event: TabGroupCreated)
  ↓ SEAM-02: TabManager → UI (data: Result<Success, Error>)
```

### Step 2: Define Contracts for Each Seam
**Once seams are identified**, create TypeScript interfaces:

```typescript
// SEAM-01: UI → TabManager
interface ITabManager {
  createGroup(
    groupName: string,    // 1-50 chars
    tabIds: number[]      // non-empty array
  ): Promise<Result<GroupCreationSuccess, TabManagerError>>;
}

// Data contracts
type GroupCreationSuccess = {
  groupId: number;
  groupName: string;
  tabCount: number;
  timestamp: number;
};

type TabManagerError = 
  | { type: 'InvalidGroupName'; details: string }
  | { type: 'NoTabsSelected'; details: string }
  | { type: 'ChromeAPIFailure'; details: string; originalError: unknown };
```

### Step 3: Generate Contract Tests from Contract
**BEFORE implementation**, write tests that validate contract guarantees:

```typescript
describe('ITabManager.createGroup CONTRACT', () => {
  it('accepts valid group names 1-50 chars', ...);
  it('rejects empty group name with InvalidGroupName error', ...);
  it('rejects >50 char names with InvalidGroupName error', ...);
  it('rejects empty tabIds with NoTabsSelected error', ...);
  it('returns GroupCreationSuccess on success', ...);
  it('handles Chrome API failures gracefully', ...);
});
```

### Step 4: Generate Implementation from Contract
**Only after contracts AND tests exist**, generate implementations:

```typescript
/**
 * FILE: TabManager.ts
 * CONTRACT: ITabManager v1.0.0
 * SEAMS: IN: UI (SEAM-01), OUT: ChromeAPI (SEAM-20), HumorSystem (SEAM-08)
 */
export class TabManager implements ITabManager {
  async createGroup(groupName: string, tabIds: number[]): Promise<Result<...>> {
    // Implementation generated from contract
    // Tests provide acceptance criteria
  }
}
```

## Seam Identification Rules

### When to Create a Seam

✅ **Create a seam when:**
- UI calls business logic (UI → Core)
- Business logic calls external API (Core → Chrome/LLM)
- Module depends on another module (TabManager → HumorSystem)
- Data is persisted (Core → Storage → chrome.storage)
- Events are emitted (Core → EventBus → Listeners)

❌ **Don't create a seam for:**
- Internal helper functions within same module
- Pure utility functions (no I/O or state)
- Private methods within a class

### Seam Naming Convention

```
SEAM-XX: SourceModule → TargetModule (DataType)

Examples:
SEAM-01: UI → TabManager (GroupCreationRequest)
SEAM-02: TabManager → UI (Result<GroupCreationSuccess>)
SEAM-08: TabManager → HumorSystem (TabGroupCreatedEvent)
SEAM-20: TabManager → ChromeTabsAPI (tabIds[])
```

## Contract Requirements

Every contract MUST specify:

1. **Input Types** - Exact TypeScript types with validation rules
2. **Output Types** - Success and error types (use Result<T, E>)
3. **Error Conditions** - Enumerated error types with descriptions
4. **Performance SLA** - Max execution time (e.g., <50ms)
5. **Side Effects** - State changes, events emitted

**Example Complete Contract:**

```typescript
/**
 * CONTRACT: ITabManager.createGroup
 * VERSION: 1.0.0
 * SEAM: SEAM-01 (UI → TabManager)
 * 
 * INPUT:
 *   - groupName: string (1-50 chars, non-empty)
 *   - tabIds: number[] (non-empty, valid Chrome tab IDs)
 * 
 * OUTPUT:
 *   - Success: GroupCreationSuccess {groupId, groupName, tabCount, timestamp}
 *   - Error: TabManagerError (InvalidGroupName | NoTabsSelected | ChromeAPIFailure)
 * 
 * ERRORS:
 *   - InvalidGroupName: groupName empty or >50 chars
 *   - NoTabsSelected: tabIds is empty array
 *   - ChromeAPIFailure: Chrome API returned error
 * 
 * PERFORMANCE: <50ms (95th percentile)
 * 
 * SIDE EFFECTS:
 *   - Emits TabGroupCreatedEvent to IHumorSystem (SEAM-08)
 *   - Creates group in Chrome (SEAM-20)
 */
interface ITabManager {
  createGroup(groupName: string, tabIds: number[]): Promise<Result<GroupCreationSuccess, TabManagerError>>;
}
```

## When Generating Code

### ALWAYS Do This:

0. **Identify Seams First** - Before writing code, map all data boundaries
1. **Define Contracts** - Create TypeScript interfaces for each seam
2. **Implement the Specified Contract**
   - Never deviate from interface signatures
   - All methods must return `Result<T, E>` types for operations that can fail
   - Never throw exceptions - use Result types instead

2. **Include Top-Level File Header**
   ```typescript
   /**
    * FILE: [filename]
    * 
    * WHAT: [One sentence - what this module does]
    * 
    * WHY: [One sentence - why this exists, which contract it serves]
    * 
    * HOW DATA FLOWS:
    *   1. [Step by step data flow]
    *   2. [Include seam crossings]
    *   3. [Show transformations]
    * 
    * SEAMS:
    *   IN: [Module → This (SEAM-XX)]
    *   OUT: [This → Module (SEAM-XX)]
    * 
    * CONTRACT: [InterfaceName] v[version]
    * GENERATED: [date]
    * CUSTOM SECTIONS: [None or list them]
    */
   ```

3. **Include Method-Level Documentation**
   ```typescript
   /**
    * [Method description]
    * 
    * DATA IN: [parameters with validation rules]
    * DATA OUT: [return type with details]
    * 
    * SEAM: SEAM-XX ([Source → Target])
    * 
    * FLOW:
    *   1. [Step 1]
    *   2. [Step 2]
    * 
    * ERRORS:
    *   - ErrorType1: [when it occurs]
    *   - ErrorType2: [when it occurs]
    * 
    * PERFORMANCE: [SLA from contract]
    */
   ```

4. **Generate Tests Alongside Implementation**
   - Contract tests validate all guarantees
   - Input validation tests for all parameters
   - Error handling tests for each error type
   - Performance tests for SLA compliance

5. **Reference Seam IDs in Code**
   ```typescript
   // === SEAM-01: UI → TabManager ===
   const result = await tabManager.createGroup(name, ids);
   // === END SEAM ===
   ```

6. **Use Performance-Conscious Patterns**
   - async/await for all I/O
   - Avoid blocking operations
   - Cache where appropriate
   - Meet contract SLAs (<50ms for core operations)

### NEVER Do This:

1. ❌ Throw exceptions - use Result types
2. ❌ Skip file headers or method documentation
3. ❌ Directly call `chrome.*` APIs - use wrappers (IChromeTabsAPI, etc.)
4. ❌ Return raw Chrome errors - map to domain error types
5. ❌ Generate code without corresponding tests
6. ❌ Make assumptions when contract is unclear - ASK first

### Error Handling Pattern

Always use Result types:

```typescript
// Good ✅
async createGroup(name: string, ids: number[]): Promise<Result<Success, Error>> {
  if (!name || name.length > 50) {
    return Result.error({ 
      type: 'InvalidGroupName', 
      details: 'Name must be 1-50 chars' 
    });
  }
  
  try {
    const groupId = await this.chromeAPI.createGroup(ids);
    return Result.ok({ groupId, name, timestamp: Date.now() });
  } catch (err) {
    return Result.error({
      type: 'ChromeAPIFailure',
      details: 'Failed to create group',
      originalError: err
    });
  }
}

// Bad ❌
async createGroup(name: string, ids: number[]): Promise<number> {
  if (!name) throw new Error('Invalid name'); // Never throw!
  return await chrome.tabs.group({ tabIds: ids }); // Don't call chrome.* directly!
}
```

### Regeneration Protocol

When modifying existing code:

1. **Check for `// CUSTOM:` markers** - preserve these sections
2. **Maintain contract version** - don't break existing contracts
3. **Update REGENERATED field** in file header
4. **Run contract tests** before considering complete

```typescript
// CUSTOM: Special handling for edge case with pinned tabs
if (tab.pinned && options.excludePinned) {
  continue; // This logic must be preserved
}
// END CUSTOM
```

## Project-Specific Rules

### TabbyMcTabface Context

- **Target User**: Intelligent users with ADD/ADHD tendencies
- **Humor Tone**: Passive-aggressive, subtle, technically clever
- **Performance Target**: <100ms for all user interactions
- **Chrome Version**: v90+ compatibility required

### Key Interfaces

When you see these interfaces, honor their contracts exactly:

- **ITabManager**: Core tab operations, <50ms SLAs
- **IHumorSystem**: Humor orchestration, <100ms total delivery
- **IHumorPersonality**: Pluggable humor personalities
- **IQuipStorage**: JSON-based quip data access
- **IChromeTabsAPI**: Chrome API wrapper for testability
- **IChromeNotificationsAPI**: Notification wrapper

### Seam Awareness

Major seam boundaries to watch for:

- **UI ↔ Core**: User interactions cross here
- **Core ↔ Chrome APIs**: External dependency boundary
- **Core ↔ Humor System**: Event-driven communication
- **Humor System ↔ Personality**: Strategy pattern for humor styles
- **Personality ↔ Storage**: Data access boundary

## Examples

### Good Code Generation

```typescript
/**
 * FILE: TabManager.ts
 * WHAT: Core tab management orchestrator
 * WHY: Implements ITabManager contract, abstracts Chrome Tabs API
 * HOW DATA FLOWS:
 *   1. UI calls ITabManager methods
 *   2. Validates inputs
 *   3. Calls IChromeTabsAPI wrapper
 *   4. Maps results to Result types
 *   5. Emits events to IHumorSystem
 * SEAMS:
 *   IN: UI → TabManager (SEAM-01, SEAM-02)
 *   OUT: TabManager → ChromeAPI (SEAM-20), TabManager → HumorSystem (SEAM-08)
 * CONTRACT: ITabManager v1.0.0
 * GENERATED: 2025-10-10
 */

export class TabManager implements ITabManager {
  constructor(
    private chromeAPI: IChromeTabsAPI,
    private humorSystem: IHumorSystem
  ) {}

  async createGroup(
    groupName: string,
    tabIds: number[]
  ): Promise<Result<GroupCreationSuccess, TabManagerError>> {
    // Validation
    if (!groupName || groupName.length > 50) {
      return Result.error({ type: 'InvalidGroupName', details: 'Name 1-50 chars required' });
    }
    
    if (!tabIds || tabIds.length === 0) {
      return Result.error({ type: 'NoTabsSelected', details: 'At least one tab required' });
    }

    // === SEAM-20: TabManager → ChromeAPI ===
    const createResult = await this.chromeAPI.createGroup(tabIds);
    if (createResult.isError()) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: 'Failed to create group',
        originalError: createResult.error
      });
    }
    // === END SEAM ===

    const groupId = createResult.value;

    // === SEAM-08: TabManager → HumorSystem ===
    await this.humorSystem.deliverQuip({
      type: 'TabGroupCreated',
      data: { groupName, tabCount: tabIds.length },
      timestamp: Date.now()
    });
    // === END SEAM ===

    return Result.ok({
      groupId,
      groupName,
      tabCount: tabIds.length,
      timestamp: Date.now()
    });
  }
}
```

## When to Ask for Clarification

If you encounter:

- Ambiguous contract specifications
- Missing error type definitions
- Unclear performance requirements
- Conflicting seam boundaries
- Missing dependencies

**ASK** before generating code. Don't make assumptions.

## Quick Reference

| Situation | Action |
|-----------|--------|
| **Starting new feature** | **1. Identify seams, 2. Define contracts, 3. Generate code** |
| Generating new module | Start with contract, add file header, generate tests |
| Contract is unclear | Ask for clarification |
| Debug fails 2x | Suggest regeneration from contract |
| Found `// CUSTOM:` | Preserve that section |
| Need Chrome API | Use IChromeTabsAPI or IChromeNotificationsAPI wrapper |
| Operation can fail | Return Result<T, E>, never throw |
| Writing test | Cover contract guarantees: inputs, outputs, errors, performance |
| **Data crosses boundary** | **It's a seam - document it with SEAM-XX** |

---

**Current Project Status**: Contract Test Phase Complete
- ✅ 32 seams identified and catalogued
- ✅ 9 contracts generated (ITabManager, IHumorSystem, IChromeTabsAPI, etc.)
- ✅ Result<T, E> utility complete with 28 passing tests
- ✅ Contract tests for ALL 9 contracts complete (9 test files, ~372 test cases)
- ✅ Contract test coverage: 100% (all interfaces have comprehensive test suites)
- ⏭️ Next: Generate implementations from contracts (Agent 2 - Implementation Generator)

**SDD Validation Learnings**:
1. **Seam discovery prevented scope creep** - Identifying all 32 seams upfront revealed architectural dependencies before coding
2. **Contracts enable parallel development** - Multiple contracts can be defined simultaneously without conflicts
3. **Result<T, E> eliminates exception handling complexity** - All error paths explicit in types
4. **Contract tests catch issues before implementation** - Type validation, SLA compliance, error handling tested against interface
5. **Documentation discipline pays off** - WHAT/WHY/HOW headers make codebase navigable

Remember: **Seams first. Contracts from seams. Code from contracts. Documentation is mandatory.**
