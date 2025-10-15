# SDD Agents for TabbyMcTabface

## ⚠️ CRITICAL: SDD COMPLIANCE NOTICE

**ALL agents in this file MUST follow Seam-Driven Development principles:**

1. **Seams First** - Each agent identifies seams in its domain before generating output
2. **Contracts Required** - Agents operate on explicit contracts (input/output schemas)
3. **Mock First** - Agents generate mock implementations before real implementations
4. **Pattern Learning** - Agents learn from successful seam/contract patterns over time
5. **Documentation** - Every agent documents which seams it crosses (AI API, filesystem, etc.)

**ANY PLAN OR SUGGESTION given to the user MUST be SDD-compliant:**
- ✅ Plans must start with seam identification
- ✅ Suggestions must reference existing contracts or propose new ones
- ✅ Implementation suggestions must specify which contract tests validate them
- ✅ All code generation must follow the SDD workflow: Seams → Contracts → Tests → Implementation
- ❌ Never suggest "just write the code" without seam/contract context

**This ensures TabbyMcTabface validates SDD methodology consistently.**

---

## Agent 0: Seam Discovery Agent (PRIORITY 1)

**Role**: Identify all seams in a user flow or feature BEFORE any code is written

**SDD Workflow Step**: This is **Step 1** - run FIRST before any other agent

**Input**:
- Feature description (natural language)
- User flow description
- Existing seam catalog (optional)

**Output**:
- Complete seam catalog for the feature
- Markdown table with SEAM-XX IDs
- Data types crossing each seam
- Suggested contract names

**Example Invocation**:
```
Discover seams for feature: "User creates tab group"

User flow:
1. User clicks "Create Group" button in popup
2. User enters group name
3. User selects tabs to group
4. User confirms
5. Extension creates group via Chrome API
6. Extension shows success message
7. Humor system delivers quip about grouping
```

**Example Output**:
```markdown
## DISCOVERED SEAMS

| Seam ID | Source | Target | Data Type | Contract Name | Priority |
|---------|--------|--------|-----------|---------------|----------|
| SEAM-01 | UI | TabManager | {groupName: string, tabIds: number[]} | ITabManager.createGroup | P0 |
| SEAM-02 | TabManager | UI | Result<GroupCreationSuccess, TabManagerError> | ITabManager (return) | P0 |
| SEAM-20 | TabManager | ChromeTabsAPI | {tabIds: number[]} | IChromeTabsAPI.createGroup | P0 |
| SEAM-21 | ChromeTabsAPI | TabManager | {groupId: number} or ChromeAPIError | IChromeTabsAPI (return) | P0 |
| SEAM-08 | TabManager | HumorSystem | TabGroupCreatedEvent | IHumorSystem.onEvent | P1 |
| SEAM-22 | HumorSystem | NotificationAPI | {title: string, message: string} | IChromeNotifications.create | P1 |

## SEAM ANALYSIS

**Critical Path Seams** (must have contracts before coding):
- SEAM-01, SEAM-02, SEAM-20, SEAM-21

**Secondary Seams** (can be mocked initially):
- SEAM-08, SEAM-22

**External API Seams** (need wrappers):
- SEAM-20, SEAM-21 (Chrome Tabs API)
- SEAM-22 (Chrome Notifications API)

**Recommended Next Steps**:
1. Run Agent 1 (Contract Generator) for SEAM-01, SEAM-20
2. Define IChromeTabsAPI wrapper contract
3. Define ITabManager contract
```

**Why This Agent is First**:
- Prevents coding before understanding all boundaries
- Identifies external dependencies early
- Creates seam catalog that drives all other agents

---

## Agent 1: Contract Generator

**Role**: Generate TypeScript interfaces from seam descriptions

**SDD Workflow Step**: This is **Step 2** - run AFTER Agent 0 (Seam Discovery)

**Input**: 
- Seam catalog entry (from Agent 0 output)
- Performance requirements
- Error conditions

**Output**: 
- Complete TypeScript interface with JSDoc
- Type definitions for inputs/outputs
- Error type enumerations
- Performance SLA comments

**Example Invocation**:
```
Generate contract for SEAM-01:
- Name: GroupCreationRequest
- Source: UI
- Target: TabCore
- Data In: {groupName: string, tabIds: number[]}
- Data Out: {groupId: number, success: boolean}
- Errors: InvalidName, NoTabsSelected, ChromeAPIFailure
- Performance: <50ms
```

**Example Output**:
```typescript
/**
 * CONTRACT: ITabManager.createGroup
 * VERSION: 1.0.0
 * SEAM: SEAM-01
 */
interface ITabManager {
  createGroup(
    groupName: string,
    tabIds: number[]
  ): Promise<Result<GroupCreationSuccess, TabManagerError>>;
}
```

---

## Agent 2: Implementation Generator

**Role**: Generate module implementation from contract

**SDD Workflow Step**: This is **Step 3** - run AFTER Agent 1 (Contract Generator)

**Input**: 
- Interface definition (TypeScript file)
- Contract documentation
- Dependencies to inject
- Custom logic sections to preserve (if regenerating)

**Output**: 
- `.ts` file with implementation
- `.test.ts` file with contract tests
- File header with WHAT/WHY/HOW
- All seam crossings annotated

**Example Invocation**:
```
Generate implementation for ITabManager contract.
- Contract file: contracts/ITabManager.ts
- Dependencies: IChromeTabsAPI, IHumorSystem
- Custom logic: None (first generation)
- Output: src/core/TabManager.ts + TabManager.test.ts
```

**Capabilities**:
- Reads TypeScript interface AST
- Generates method implementations matching signatures
- Creates Result-type error handling
- Generates test suite covering all contract guarantees
- Preserves `// CUSTOM:` sections during regeneration

---

## Agent 3: Regeneration Assistant

**Role**: Assist with regenerating failing modules

**Input**: 
- Contract version
- Failed test results
- Current implementation (to extract CUSTOM sections)
- Performance metrics (if available)

**Output**: 
- Updated implementation
- Test results comparison
- Regeneration report (what changed, why)
- Recommendations for contract improvements

**Example Invocation**:
```
Regenerate TabManager - failed tests:
- createGroup: rejects >50 char names (FAILED 2x)
- createGroup: performance SLA violated (68ms avg, contract requires <50ms)

Contract: ITabManager v1.0.0
Current impl: src/core/TabManager.ts
Custom sections: Line 45-52 (pinned tab handling)
```

**Decision Logic**:
- If >2 test failures on same method → regenerate that method
- If performance violation → regenerate with performance-first approach
- If breaking change in contract → regenerate entire module
- Always preserve CUSTOM sections

---

## Agent 4: Documentation Validator

**Role**: Ensure all files have proper SDD headers

**Input**: 
- File path(s) to validate
- Seam catalog (for cross-reference)

**Output**: 
- Validation report
- List of missing elements per file
- Suggestions for fixes

**Example Invocation**:
```
Validate SDD compliance for:
- src/core/TabManager.ts
- src/humor/HumorSystem.ts
- src/humor/personalities/TabbyMcTabface.ts
```

**Checks**:
- [ ] FILE header present
- [ ] WHAT section (1 sentence)
- [ ] WHY section (1 sentence)
- [ ] HOW DATA FLOWS section (numbered steps)
- [ ] SEAMS section (IN/OUT with IDs)
- [ ] CONTRACT version specified
- [ ] GENERATED timestamp present
- [ ] Seam IDs match seam catalog
- [ ] Method-level docs present for all public methods

**Output Example**:
```
VALIDATION REPORT

src/core/TabManager.ts: ✅ PASS
- All required sections present
- 3 seams documented (SEAM-01, SEAM-02, SEAM-20)
- Contract version: ITabManager v1.0.0

src/humor/HumorSystem.ts: ❌ FAIL
- Missing: HOW DATA FLOWS section
- Missing: SEAM-08 not listed (found in code)
- Recommendation: Add data flow steps, document event emission to SEAM-08
```

---

## Agent 5: Seam Catalog Generator

**Role**: Scan codebase and generate/update seam catalog

**Input**: 
- Source directory
- Existing seam catalog (to preserve IDs)

**Output**: 
- Updated seam catalog markdown table
- List of new seams discovered
- List of orphaned seams (no longer in code)

**Example Invocation**:
```
Scan codebase for seams:
- Directory: src/
- Existing catalog: docs/seams.md
- Look for: Interface boundaries, module dependencies, API calls
```

**Detection Logic**:
- Scans for interface implementations
- Finds method calls across module boundaries
- Identifies external API calls (chrome.*, etc.)
- Parses `// === SEAM-XX: A → B ===` comments
- Cross-references with contract definitions

**Output Example**:
```markdown
## SEAM CATALOG UPDATE

### New Seams Found:
- SEAM-25: UI → Settings (not in catalog)
- SEAM-26: Settings → Storage (not in catalog)

### Orphaned Seams:
- SEAM-15: Quip → Delivery (no longer in codebase)

### Updated Catalog:
| Seam ID | Source | Target | Contract | Status |
|---------|--------|--------|----------|--------|
| SEAM-01 | UI | TabManager | ITabManager.createGroup | Active |
| SEAM-25 | UI | Settings | (needs contract) | New |
```

---

## Agent 6: Contract Test Generator

**Role**: Generate comprehensive test suite from contract

**Input**: 
- Interface definition
- Contract documentation (preconditions, postconditions, SLAs)

**Output**: 
- Jest test file with all contract tests
- Input validation tests
- Error handling tests
- Performance tests
- Integration test stubs

**Example Invocation**:
```
Generate contract tests for IHumorSystem.
- Contract: contracts/IHumorSystem.ts
- Output: src/humor/__tests__/IHumorSystem.contract.test.ts
- Include: All methods, all error types, performance SLAs
```

**Generated Test Structure**:
```typescript
describe('IHumorSystem CONTRACT v1.0.0', () => {
  describe('deliverQuip()', () => {
    it('accepts valid HumorTrigger objects', ...);
    it('rejects invalid trigger types with error', ...);
    it('returns Result<QuipDeliveryResult, HumorError>', ...);
    it('completes in <100ms (95th percentile)', ...);
    it('handles personality failure gracefully', ...);
    // ... more tests
  });
  
  // ... tests for other methods
});
```

---

## Agent 7: Breaking Change Detector

**Role**: Compare contract versions and flag breaking changes

**Input**: 
- Current contract (branch version)
- Base contract (main/master version)
- Semver version

**Output**: 
- Breaking change report
- Suggested version bump (major/minor/patch)
- List of affected modules that need regeneration

**Example Invocation**:
```
Compare contracts:
- Current: feature/new-quip-system branch
- Base: main branch
- Check: contracts/IHumorSystem.ts
```

**Breaking Change Detection**:
- ✅ Added optional parameter → Minor version
- ✅ Added new method → Minor version
- ❌ Changed method signature → Major version (BREAKING)
- ❌ Removed method → Major version (BREAKING)
- ❌ Changed error types → Major version (BREAKING)
- ❌ Stricter performance SLA → Major version (BREAKING)

**Output Example**:
```
BREAKING CHANGES DETECTED

contracts/IHumorSystem.ts:
  - deliverQuip() signature changed
    Before: deliverQuip(trigger: HumorTrigger)
    After:  deliverQuip(trigger: HumorTrigger, priority: number)
    Impact: MAJOR version bump required (1.0.0 → 2.0.0)
  
  - checkEasterEggs() removed
    Impact: BREAKING - dependent modules must be updated

Affected Modules:
  - src/humor/HumorCoordinator.ts (implements IHumorSystem)
  - src/core/TabManager.ts (calls IHumorSystem)

Recommendation:
  1. Bump IHumorSystem to v2.0.0
  2. Regenerate HumorCoordinator from new contract
  3. Update TabManager to handle new deliverQuip signature
  4. Update all tests
```

---

## Agent 8: Performance Monitor

**Role**: Track performance metrics and validate SLA compliance

**Input**: 
- Contract with SLAs
- Execution metrics (from tests or production)

**Output**: 
- SLA compliance report
- Performance trends
- Recommendations for optimization or contract adjustment

**Example Invocation**:
```
Monitor performance for:
- Contract: ITabManager v1.0.0
- Metrics source: CI test results (last 10 runs)
- SLAs: createGroup <50ms, closeRandomTab <30ms
```

**Output Example**:
```
PERFORMANCE REPORT

ITabManager.createGroup():
  Contract SLA: <50ms (95th percentile)
  Actual (95th): 48ms ✅ PASS
  Trend: Stable (±2ms over last 10 runs)

ITabManager.closeRandomTab():
  Contract SLA: <30ms (95th percentile)
  Actual (95th): 42ms ❌ FAIL
  Trend: Degrading (+8ms over last 10 runs)
  
Recommendation:
  - Investigate closeRandomTab performance regression
  - Consider regenerating with performance-first approach
  - Or adjust contract SLA to <45ms if current implementation acceptable
```

---

## Using These Agents

### In Your Workflow:

1. **Planning Phase**: Use **Agent 0 (Seam Discovery)** to identify seams
2. **Contract Phase**: Use **Agent 1 (Contract Generator)** to create interfaces
3. **Implementation Phase**: Use **Agent 2 (Implementation Generator)** to create code
4. **Testing Phase**: Use **Agent 6 (Test Generator)** for comprehensive tests
5. **Validation Phase**: Use **Agent 4 (Documentation Validator)** before commit
6. **Debugging Phase**: Use **Agent 3 (Regeneration Assistant)** after 2 failed fixes
7. **Evolution Phase**: Use **Agent 7 (Breaking Change Detector)** on PRs
8. **Monitoring Phase**: Use **Agent 8 (Performance Monitor)** in CI/CD

### Agent Composition:

Agents can work together:
```
Agent 0 (Seam Discovery) 
  → discovers new seam SEAM-27
  → triggers Agent 1 (Contract Generator)
  → generates INewContract
  → triggers Agent 2 (Implementation Generator)
  → generates implementation
  → triggers Agent 6 (Test Generator)
  → generates tests
  → triggers Agent 4 (Documentation Validator)
  → validates all SDD compliance
```

---

## Implementation Notes

These agents can be implemented as:
- **CLI tools** (Node.js scripts using TypeScript AST parser)
- **GitHub Actions** (automated workflow steps)
- **VS Code extensions** (real-time validation)
- **AI prompts** (Claude/GPT with structured instructions)
- **Custom Copilot agents** (using GitHub Copilot SDK)

Each agent is designed to be **composable** and **autonomous** - they can run independently or as part of a larger workflow.
