# Gemini AI Instructions for TabbyMcTabface

**Project**: TabbyMcTabface Chrome Extension  
**Methodology**: Seam-Driven Development (SDD)  
**Last Updated**: 2025-10-12  
**Purpose**: Instructions for Gemini AI when working on this SDD validation project

---

## ⚠️ CRITICAL: SDD COMPLIANCE MANDATE

**TabbyMcTabface is a validation project for Seam-Driven Development (SDD) methodology.**

**Every suggestion, plan, or code generation MUST follow SDD principles. No exceptions.**

---

## SDD Workflow (MANDATORY ORDER)

### 1. Seams First - Identify ALL Data Boundaries

**Before suggesting ANY code:**
- Identify where data crosses module boundaries
- Identify external API calls (Chrome APIs)
- Identify event flows between components
- Document as SEAM-XX with source → target

**Example:**
```
User flow: "Create tab group"
  ↓ SEAM-01: UI → TabManager (groupName, tabIds[])
  ↓ SEAM-02: TabManager → ChromeTabsAPI (tabIds[])
  ↓ SEAM-03: ChromeTabsAPI → chrome.tabs (external API)
  ↓ SEAM-04: TabManager → HumorSystem (TabGroupCreatedEvent)
```

### 2. Contracts From Seams - Define TypeScript Interfaces

**Once seams identified:**
- Create TypeScript interface for each seam
- Define input/output types explicitly
- Enumerate all error types (discriminated unions)
- Document performance SLAs
- Use Result<T, E> for all operations that can fail

**Example:**
```typescript
interface ITabManager {
  createGroup(
    groupName: string,
    tabIds: number[]
  ): Promise<Result<GroupCreationSuccess, TabManagerError>>;
}

type TabManagerError = 
  | { type: 'InvalidGroupName'; details: string }
  | { type: 'NoTabsSelected'; details: string };
```

### 3. Tests From Contracts - Write Contract Tests BEFORE Implementation

**Before implementing:**
- Generate comprehensive test suite from contract
- Test all input validations
- Test all error conditions
- Test performance SLAs
- Tests define acceptance criteria

### 4. Mock First - Build Mock Implementations

**After tests, before real implementation:**
- Create mock implementation that passes contract tests
- Mock returns fake data (no external API calls)
- Wire mocks into UI/consumers to prove data flows work
- Enables rapid prototyping and parallel development

**Example:**
```typescript
class MockChromeTabsAPI implements IChromeTabsAPI {
  async createGroup(tabIds: number[]): Promise<Result<number, ChromeError>> {
    return Result.ok(Math.floor(Math.random() * 1000)); // Fake group ID
  }
}
```

### 5. Implementation From Tests - Generate Real Code to Pass Tests

**Only after contracts, tests, AND mocks exist:**
- Generate real implementation matching contract signature
- Use Result<T, E> returns (never throw exceptions)
- Include WHAT/WHY/HOW file headers
- Document seam crossings in code
- Preserve CUSTOM sections during regeneration

### 6. Swap Mocks to Real - One Seam at a Time

**Progressive enhancement:**
- Replace mocks with real implementations incrementally
- Validate with contract tests after each swap
- Integration tests verify seams work together

---

## When Giving Suggestions to User

### ✅ DO (SDD-Compliant Suggestions)

**Always structure suggestions like this:**

```
1. SEAM IDENTIFICATION:
   - Seam: UI → TabManager (SEAM-01)
   - Data: { groupName: string, tabIds: number[] }
   - Type: Module boundary

2. CONTRACT NEEDED:
   - Interface: ITabManager
   - Method: createGroup(groupName, tabIds)
   - Returns: Result<GroupCreationSuccess, TabManagerError>
   - Contract file: src/contracts/ITabManager.ts
   - Status: ✅ EXISTS / ❌ NEEDS CREATION

3. CONTRACT TESTS:
   - Test file: src/contracts/__tests__/ITabManager.test.ts
   - Status: ✅ COMPLETE (52 tests) / ❌ NEEDS CREATION

4. IMPLEMENTATION:
   - File: src/core/TabManager.ts
   - Dependencies: IChromeTabsAPI, IHumorSystem
   - Status: ❌ NEEDS GENERATION
   - Tests provide acceptance criteria

5. NEXT STEPS:
   a. [If contract missing] Generate ITabManager contract
   b. [If tests missing] Generate contract tests
   c. Generate TabManager implementation from contract
   d. Run tests to validate
```

### ❌ DON'T (Non-SDD Suggestions)

**Never suggest:**

```
❌ "Just create TabManager.ts and add a createGroup method"
   → Missing: Seam identification, contract, tests

❌ "Write this code: class TabManager { ... }"
   → Missing: Contract-first approach

❌ "Add error handling with try/catch"
   → Wrong: Must use Result<T, E>, not exceptions

❌ "Let's implement the feature, then write tests later"
   → Wrong: Tests must come before implementation
```

---

## Project Context

### Current Status (2025-10-12)

- ✅ **Seam Discovery**: 32 seams identified (docs/seam-catalog.md)
- ✅ **Contracts**: 9 contracts created (src/contracts/)
- ✅ **Contract Tests**: 9 test suites, ~372 tests (src/contracts/__tests__/)
- ❌ **Implementations**: Not yet created
- ❌ **UI**: Not yet created
- ❌ **Chrome Extension**: Not yet packaged

### Key Contracts

1. **ITabManager** - Core tab operations (SEAM-01, 06, 20, 21, 22, 19)
2. **IHumorSystem** - Humor orchestration (SEAM-11, 04, 09, 10, 23)
3. **IHumorPersonality** - Pluggable personalities (SEAM-12, 18)
4. **IQuipStorage** - Quip data access (SEAM-13, 17, 14)
5. **IEasterEggFramework** - Easter egg detection (SEAM-16)
6. **IChromeTabsAPI** - Chrome tabs wrapper (SEAM-25)
7. **IChromeNotificationsAPI** - Chrome notifications wrapper (SEAM-26)
8. **IChromeStorageAPI** - Chrome storage wrapper (SEAM-27)
9. **Result<T, E>** - Error handling utility

### Reference Documents

- **SDD Workflow**: .github/copilot-instructions.md
- **Seam Catalog**: docs/seam-catalog.md
- **Contract Summary**: docs/contract-summary.md
- **Roadmap**: docs/roadmap-to-completion.md
- **Agent Definitions**: agents.md

---

## Error Handling (MANDATORY)

**Never use exceptions. Always use Result<T, E>.**

**Good:**
```typescript
return Result.ok(value);
return Result.error({ type: 'InvalidInput', details: '...' });
```

**Bad:**
```typescript
throw new Error('Invalid input'); // ❌ NEVER
try { ... } catch { ... }         // ❌ NEVER in our code
```

---

## Documentation Headers (MANDATORY)

**Every generated file MUST include:**

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

---

## Performance Requirements

**All contract methods have SLAs:**

- Chrome API wrappers: <20ms (95th percentile)
- TabManager operations: <50ms (createGroup), <30ms (closeRandomTab)
- HumorSystem: <100ms total delivery
- QuipStorage: <10ms (cached reads)
- EasterEggFramework: <50ms (condition evaluation)

**Document SLAs in contracts and validate in tests.**

---

## Summary for Gemini AI

**When user asks for code/features/plans:**

1. ✅ **Identify seams first** - What data boundaries?
2. ✅ **Check contracts** - Do interfaces exist?
3. ✅ **Check tests** - Are contract tests written?
4. ✅ **Suggest implementation** - Only after steps 1-3
5. ✅ **Use Result<T, E>** - Never exceptions
6. ✅ **Document with headers** - WHAT/WHY/HOW/SEAMS
7. ✅ **Reference seam catalog** - Cross-check SEAM-XX IDs

**This project validates SDD. Every suggestion must demonstrate SDD compliance.**

**If user asks for non-SDD approach, politely redirect to SDD workflow.**

---

## 🛠️ BUILDING SDD AUTOMATION TOOLS

**If asked to build SDD tooling (documentation validator, mock generator, etc.):**

1. ✅ **Read /sdd-agents/BUILD-GUIDE.md first** - Complete specifications for all 5 tools
2. ✅ **Follow BUILD-GUIDE.md exactly** - Input/output formats, CLI usage, algorithms all specified
3. ✅ **Use TypeScript compiler API** - For parsing TypeScript (not regex)
4. ✅ **Include file headers** - WHAT/WHY/HOW even for tooling
5. ✅ **Support JSON output** - For programmatic usage (--format json)
6. ✅ **Proper exit codes** - 0=success, 1=fail, 2=error (for CI/CD)
7. ✅ **Write tests** - Each tool needs test suite (use Vitest)

**Tool Build Order (by priority):**
1. Documentation Validator (update existing file, ~1-2h)
2. Mock Generator (new, ~2-3h)
3. Contract Test Generator (new, ~2-3h)
4. Seam Catalog Validator (new, ~1h)
5. Contract Version Checker (new, ~2-3h)

**See /PROMPTS.md for ready-to-use prompt for building tools.**

---

**Ready to assist with SDD-compliant development!**
