# AI Prompts for TabbyMcTabface Development

**Last Updated**: 2025-10-12  
**Purpose**: Ready-to-use prompts for Gemini Code Assist and GitHub Copilot

---

## 🤖 PROMPT FOR GEMINI CODE ASSIST (Build SDD Tools)

```
I need you to build SDD (Seam-Driven Development) automation tools for the TabbyMcTabface project.

CONTEXT:
- This is a Chrome extension built using Seam-Driven Development methodology
- Read /sdd-agents/BUILD-GUIDE.md for complete specifications
- Read /GEMINI.md for SDD compliance requirements
- All tools should be Node.js CLI scripts using TypeScript

YOUR TASK:
Build the 5 SDD automation tools in this order:

1. DOCUMENTATION VALIDATOR (Priority 1) - START HERE
   - Location: sdd-agents/agents/documentation-validator.js (UPDATE this file)
   - Status: Partially built, needs completion
   - Read BUILD-GUIDE.md section "Tool #1: Documentation Validator"
   - Validates WHAT/WHY/HOW headers, SEAM comments, method documentation
   - Must support CLI usage and JSON output
   - Time estimate: 1-2 hours

2. MOCK GENERATOR (Priority 2)
   - Location: sdd-agents/agents/mock-generator.js (NEW file)
   - Read BUILD-GUIDE.md section "Tool #2: Mock Generator"
   - Parses TypeScript interfaces, generates mock implementations
   - Auto-generates fake data, helper methods, file headers
   - Time estimate: 2-3 hours

3. CONTRACT TEST GENERATOR (Priority 3)
   - Location: sdd-agents/agents/contract-test-generator.js (NEW file)
   - Read BUILD-GUIDE.md section "Tool #3: Contract Test Generator"
   - Generates Vitest test suites from contracts
   - Creates input/output/error/performance tests
   - Time estimate: 2-3 hours

4. SEAM CATALOG VALIDATOR (Priority 4)
   - Location: sdd-agents/agents/seam-catalog-validator.js (NEW file)
   - Read BUILD-GUIDE.md section "Tool #4: Seam Catalog Validator"
   - Validates seam references against catalog
   - Time estimate: 1 hour

5. CONTRACT VERSION CHECKER (Priority 5)
   - Location: sdd-agents/agents/contract-version-checker.js (NEW file)
   - Read BUILD-GUIDE.md section "Tool #5: Contract Version Checker"
   - Detects breaking changes in contracts
   - Time estimate: 2-3 hours

REQUIREMENTS:
✅ Follow BUILD-GUIDE.md specifications exactly
✅ Each tool must be a standalone Node.js CLI script
✅ Include comprehensive JSDoc comments
✅ Add WHAT/WHY/HOW file headers (per SDD standards)
✅ Support both human-readable and JSON output
✅ Proper exit codes (0=success, 1=fail, 2=error)
✅ Include test suite for each tool (use Vitest)
✅ Use TypeScript compiler API for parsing (not regex)

START WITH:
Tool #1 (Documentation Validator) - update the existing sdd-agents/agents/documentation-validator.js file

When you're done with each tool, tell me and I'll test it before you move to the next one.

Let me know if you need any clarification from the BUILD-GUIDE.md!
```

---

## 💬 PROMPT FOR GITHUB COPILOT (Build Mocks)

```
Build Phase 1 mock implementations for TabbyMcTabface Chrome extension.

CONTEXT:
- Read /docs/mock-implementation-roadmap.md for complete specifications
- Read /.github/copilot-instructions.md for SDD methodology
- Follow Seam-Driven Development principles (tests before implementation)
- All mocks must pass their contract tests

YOUR TASK:
Generate Phase 1 Foundation Mocks (4 files):

1. MockChromeTabsAPI
   - File: src/mocks/MockChromeTabsAPI.ts
   - Contract: src/contracts/IChromeTabsAPI.ts
   - Implements: createGroup, updateGroup, queryTabs, removeTab, getAllGroups
   - Returns: Fake data (auto-incrementing IDs, in-memory state)
   - Helpers: seedMockTabs(), getMockGroups(), reset()
   - Must pass: All 52 IChromeTabsAPI contract tests
   - See roadmap section "MOCK 1: MockChromeTabsAPI" for code example

2. MockChromeNotificationsAPI
   - File: src/mocks/MockChromeNotificationsAPI.ts
   - Contract: src/contracts/IChromeNotificationsAPI.ts
   - Implements: create, clear, update
   - Returns: Fake notification IDs, stores in Map
   - Helpers: getMockNotifications()
   - See roadmap section "MOCK 2: MockChromeNotificationsAPI"

3. MockChromeStorageAPI
   - File: src/mocks/MockChromeStorageAPI.ts
   - Contract: src/contracts/IChromeStorageAPI.ts
   - Implements: get, set, remove, clear, getBytesInUse
   - Returns: In-memory storage (Record<string, any>)
   - Helpers: seedStorage(), reset()
   - See roadmap section "MOCK 3: MockChromeStorageAPI"

4. MockObservable
   - File: src/mocks/MockObservable.ts
   - Contract: Observable<T> interface (from IHumorSystem)
   - Implements: subscribe, unsubscribe
   - Helpers: emit(), getSubscriberCount()
   - See roadmap section "MOCK 4: MockObservable<T>"

REQUIREMENTS FOR ALL MOCKS:
✅ Include WHAT/WHY/HOW file header (see roadmap examples)
✅ Implement full contract interface
✅ Use Result<T, E> for all operations that can fail
✅ Return fake data (no real Chrome API calls)
✅ Track mock state in private properties
✅ Include helper methods for testing (seed, reset, inspect)
✅ Track call history for assertions
✅ Auto-generate IDs (incrementing counters)
✅ Add "AUTO-GENERATED: Yes" to file header

EXAMPLE STRUCTURE (from roadmap):
```typescript
/**
 * FILE: MockChromeTabsAPI.ts
 * WHAT: Mock implementation of IChromeTabsAPI for testing
 * WHY: Enables UI development without Chrome APIs
 * HOW DATA FLOWS: [see roadmap]
 * SEAMS: IN: Tests/UI → MockChromeTabsAPI
 * CONTRACT: IChromeTabsAPI v1.0.0
 * GENERATED: 2025-10-12
 * AUTO-GENERATED: Yes
 */
export class MockChromeTabsAPI implements IChromeTabsAPI {
  private mockTabs: ChromeTab[] = [];
  private mockGroups: ChromeTabGroup[] = [];
  private nextGroupId = 1;
  
  async createGroup(tabIds: number[]): Promise<Result<number, ChromeTabsError>> {
    const groupId = this.nextGroupId++;
    return Result.ok(groupId);
  }
  
  // ... other methods
  
  // Helpers
  seedMockTabs(tabs: ChromeTab[]): void { ... }
}
```

Generate all 4 mock files following the roadmap specifications exactly.

Ready? Generate Phase 1 mocks now!
```

---

## 🔄 Quick Copy Prompts

### For Gemini (Tools):
```
Build SDD automation tools from /sdd-agents/BUILD-GUIDE.md. Start with Tool #1 (Documentation Validator). Follow all specifications in BUILD-GUIDE.md and comply with /GEMINI.md SDD requirements.
```

### For Copilot (Mocks):
```
Build Phase 1 mocks from /docs/mock-implementation-roadmap.md: MockChromeTabsAPI, MockChromeNotificationsAPI, MockChromeStorageAPI, MockObservable. Follow SDD principles from /.github/copilot-instructions.md. Generate all 4 files now.
```

---

## 📋 Verification Checklist

### After Gemini Builds Documentation Validator:
```bash
# Test it
node sdd-agents/agents/documentation-validator.js src/contracts/ITabManager.ts

# Expected: PASS with detailed report
# Then move to Tool #2
```

### After Copilot Builds Phase 1 Mocks:
```bash
# Run contract tests (if you have npm/vitest)
npm test src/contracts/__tests__/IChromeTabsAPI.test.ts
npm test src/contracts/__tests__/IChromeNotificationsAPI.test.ts
npm test src/contracts/__tests__/IChromeStorageAPI.test.ts

# Expected: All tests pass with mocks
# Then move to Phase 2 mocks
```

---

**Use these prompts to kickstart parallel development!** 🚀
