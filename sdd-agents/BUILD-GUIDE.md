# SDD Tooling Build Guide (AI-First Edition)

**Project**: TabbyMcTabface SDD Agents  
**Purpose**: Build automation tools for Seam-Driven Development workflow  
**Target**: AI-assisted development, primarily using `grok-4-fast-reasoning`
**Last Updated**: 2025-10-12

---

## 🎯 AI-First Philosophy

This guide provides specifications for **5 SDD automation tools** that leverage a powerful AI model as their primary engine. The core principle is **"AI-First, Deterministic Fallback."**

- **Primary Engine**: All tools will first attempt to perform their tasks by sending a carefully constructed prompt to the designated AI model. The specified model is **`grok-4-fast-reasoning` from x.ai**.
- **Deterministic Fallback**: If the AI call fails, returns a malformed response, or is otherwise unavailable, each tool MUST fall back to a deterministic, code-based implementation (using the TypeScript Compiler API). This ensures 100% reliability and consistency.
- **Ground Truth**: The deterministic fallback also serves as the "ground truth" for testing the accuracy of the AI-generated results.

**Tech Stack**:
- **Primary AI Model**: `grok-4-fast-reasoning` (via a hypothetical `x.ai` client)
- **Fallback Parser**: TypeScript Compiler API (`ts.createProgram`, etc.)
- **Language**: Node.js / TypeScript

---

## 🏗️ Tool #1: Documentation Validator (PRIORITY 1)

### **Purpose**
Validate that all TypeScript files follow SDD documentation requirements (WHAT/WHY/HOW headers, seam documentation, contract versions).

### **Status**
⚠️ **Specification Changed** - The existing file will be updated to an AI-first model.

### **Input & Output**
(Unchanged from original spec)

### **Required Checks**
(Unchanged from original spec - these rules will be fed into the AI prompt)

### **AI-First Implementation Spec**

#### Command-Line Interface
(Unchanged from original spec)

#### AI-Driven Algorithm Outline
```javascript
// Pseudocode
async function validateFile(filePath, seamCatalog = null) {
  const content = readFile(filePath);
  const rules = getValidationRulesFromSpec(); // Load rules from this guide

  // 1. Primary: AI-driven validation
  try {
    const prompt = createValidationPrompt(content, rules, seamCatalog);
    const aiResponse = await callXaiGrok(prompt); // Call grok-4-fast-reasoning
    const report = parseAndValidateAiResponse(aiResponse); // Ensure it matches JSON spec
    
    if (report) {
      // Add a flag to indicate the source of the report
      report.generatedBy = 'grok-4-fast-reasoning';
      return report;
    }
  } catch (error) {
    console.warn(`AI validation failed for ${filePath}: ${error.message}. Falling back to deterministic parser.`);
  }

  // 2. Fallback: Deterministic validation
  const fallbackReport = runDeterministicValidation(content, filePath, seamCatalog);
  fallbackReport.generatedBy = 'deterministic-fallback';
  return fallbackReport;
}

function runDeterministicValidation(content, filePath, seamCatalog) {
    // This function contains the original AST-parsing logic.
    // It uses the TypeScript Compiler API to traverse the code and check rules.
    const ast = ts.createProgram(...);
    // ... implementation from previous guide version ...
    return report;
}
```

#### Prompt Engineering: `grok-4-fast-reasoning`

**1. System Prompt:**
```
You are an expert SDD (Seam-Driven Development) documentation validator. Your task is to analyze a TypeScript file and determine if it complies with a strict set of documentation rules. You must be meticulous and check every rule. Your output MUST be a single, valid JSON object that conforms to the specified output structure, with no additional commentary or markdown.

The rules for validation are:
- File-level header: Must contain non-empty FILE, WHAT, WHY, HOW DATA FLOWS, SEAMS, CONTRACT, GENERATED, and CUSTOM SECTIONS fields.
- Seam comments: All `// === SEAM-XX ...` comments must have a matching `// === END SEAM ===`.
- Method documentation (for interfaces): All public methods must have JSDoc with SEAM, INPUT, OUTPUT, ERRORS, and PERFORMANCE sections.
```

**2. Task Prompt Template:**
```
Validate the following TypeScript file for SDD documentation compliance.

**File Path:**
`{{filePath}}`

**Seam Catalog (for cross-referencing, if available):**
`{{seamCatalogContent}}`

**File Content:**
```typescript
{{fileContent}}
```

**Validation Rules:**
- **File Header**:
  - `FILE`: Must be present and its value must match the filename `{{filePath}}`.
  - `WHAT`, `WHY`: Must be present and contain meaningful, descriptive text. Flag it as an issue if the content is just "TODO", "WIP", or placeholder text.
  - `HOW DATA FLOWS`: Must be present and contain a numbered list (e.g., `1.`, `2.`).
  - `SEAMS`: Must be present and list `IN` and/or `OUT` seams. All `SEAM-XX` IDs found anywhere in the code must be documented here.
- **Method Docs (for interface methods only)**:
  - Every method signature in an interface must have a JSDoc block above it.
  - The JSDoc block is invalid if it is missing any of the following tags: `SEAM:`, `INPUT:`, `OUTPUT:`, `ERRORS:`, `PERFORMANCE:`.

Based *only* on the content and rules provided, return the JSON report.
```

#### Output Format (JSON)
(Unchanged from original spec - this is the required output format for both the AI and the fallback)

#### Exit Codes
(Unchanged from original spec)

---

## 🏗️ Tool #2: Mock Generator (PRIORITY 2)

### **Purpose**
Auto-generate mock implementations from TypeScript interface contracts.

### **AI-First Implementation Spec**

#### AI-Driven Algorithm Outline
```javascript
// Pseudocode
async function generateMock(interfacePath, outputPath) {
  const content = readFile(interfacePath);
  const rules = getMockGenerationRules(); // e.g., include helper methods, track history

  // 1. Primary: AI-driven generation
  try {
    const prompt = createMockGenPrompt(content, rules);
    const aiResponse = await callXaiGrok(prompt); // Call grok-4-fast-reasoning
    const generatedCode = parseAndValidateAiCode(aiResponse);
    
    if (generatedCode) {
      writeFile(outputPath, generatedCode);
      return { success: true, generatedBy: 'grok-4-fast-reasoning' };
    }
  } catch (error) {
    console.warn(`AI mock generation failed for ${interfacePath}: ${error.message}. Falling back to deterministic generator.`);
  }

  // 2. Fallback: Deterministic generation
  const fallbackCode = runDeterministicMockGen(content);
  writeFile(outputPath, fallbackCode);
  return { success: true, generatedBy: 'deterministic-fallback' };
}
```

#### Prompt Engineering: `grok-4-fast-reasoning`

**System Prompt:**
```
You are an expert TypeScript developer specializing in Seam-Driven Development. Your task is to generate a complete, compilable mock implementation of a TypeScript interface. You must follow all instructions precisely, including implementing mock state, call history, and helper methods. Your output MUST be only the raw TypeScript code, with no commentary, explanations, or markdown formatting like ```typescript ... ```.
```

**Task Prompt Template:**
```
Generate a mock class for the following TypeScript interface.

**Interface File:** `{{filePath}}`
**Interface Code:**
```typescript
{{interfaceContent}}
```

**Generation Requirements:**
1.  Create a class named `Mock{{InterfaceName}}` that implements `{{InterfaceName}}`.
2.  For each method, implement a mock version that returns fake data wrapped in `Result.ok()` or `Result.error()`.
3.  Add basic input validation that mirrors the contract's JSDoc (e.g., check for empty strings or arrays).
4.  Include an in-memory store for state (e.g., `private mockGroups = []`).
5.  Include a `callHistory` array to record method calls for testing.
6.  Add the following public helper methods not on the interface:
    - `seed(data)`: To set up mock state.
    - `reset()`: To clear all mock state and history.
    - `getCallHistory()`: To retrieve the call history.
7.  The generated file MUST include the standard SDD file header (FILE, WHAT, WHY, etc.).

Produce only the raw TypeScript code for the new file.
```

---

## 🏗️ Tool #3: Contract Test Generator (PRIORITY 3)

### **Purpose**
Auto-generate comprehensive test suites from TypeScript interface contracts.

### **AI-First Implementation Spec**

#### AI-Driven Algorithm Outline
```javascript
// Pseudocode
async function generateContractTests(interfacePath, outputPath) {
  const content = readFile(interfacePath);
  const rules = getTestGenerationRules(); // e.g., include performance tests

  // 1. Primary: AI-driven generation
  try {
    const prompt = createTestGenPrompt(content, rules);
    const aiResponse = await callXaiGrok(prompt);
    const generatedCode = parseAndValidateAiCode(aiResponse);
    
    if (generatedCode) {
      writeFile(outputPath, generatedCode);
      return { success: true, generatedBy: 'grok-4-fast-reasoning' };
    }
  } catch (error) {
    console.warn(`AI test generation failed for ${interfacePath}: ${error.message}. Falling back to deterministic generator.`);
  }

  // 2. Fallback: Deterministic generation
  const fallbackCode = runDeterministicTestGen(content);
  writeFile(outputPath, fallbackCode);
  return { success: true, generatedBy: 'deterministic-fallback' };
}
```

#### Prompt Engineering: `grok-4-fast-reasoning`

**System Prompt:**
```
You are an expert TypeScript test engineer. Your task is to generate a complete, runnable Vitest test suite for a TypeScript interface contract. You must derive test cases from the JSDoc comments, including input validation, output validation, error conditions, and performance SLAs. Your output MUST be only the raw TypeScript code for the test file, with no additional commentary.
```

**Task Prompt Template:**
```
Generate a Vitest contract test suite for the following TypeScript interface.

**Interface File:** `{{filePath}}`
**Interface Code:**
```typescript
{{interfaceContent}}
```

**Test Generation Requirements:**
1.  Create a `describe` block for the contract (e.g., `describe('ITabManager CONTRACT v1.0.0', ...)`).
2.  Use a `beforeEach` block to instantiate a `Mock{{InterfaceName}}`.
3.  For each method, create a nested `describe` block.
4.  Inside each method's block, create sub-describes for 'INPUT VALIDATION', 'OUTPUT VALIDATION', 'ERROR HANDLING', and 'PERFORMANCE'.
5.  **INPUT VALIDATION**: Generate `it` blocks to test every validation rule mentioned in the method's JSDoc (e.g., string length, non-empty arrays). Test both valid and invalid cases.
6.  **OUTPUT VALIDATION**: Generate `it` blocks to check the structure and types of the success payload (`Result.ok(value)`).
7.  **ERROR HANDLING**: Generate `it` blocks that trigger each error type mentioned in the `ERRORS` section of the JSDoc and assert that the correct error type is returned.
8.  **PERFORMANCE**: If a `PERFORMANCE` SLA is mentioned, generate a test that runs the method multiple times and asserts the 95th percentile is below the SLA.

Produce only the raw TypeScript code for the new test file.
```

---

*... (Sections for Tool #4 and Tool #5 would be updated in a similar AI-first fashion) ...*

---

## 📦 Deliverables Checklist (Revised)

### Tool #1: Documentation Validator
- [ ] **Prompt Engineering**: A robust prompt that passes all validation rules to the AI.
- [ ] **AI Integration**: Code to call `grok-4-fast-reasoning` and parse the JSON response.
- [ ] **Deterministic Fallback**: A fully working AST-based validator to be used if the AI fails.
- [ ] **Unified Output**: The tool produces the same report format regardless of source (AI or fallback).
- [ ] CLI with human-readable and JSON output.
- [ ] Exit codes (0 = pass, 1 = fail, 2 = error).
- [ ] Test suite that covers both AI-driven and fallback paths.

*... (Checklists for other tools would be similarly revised) ...*

---

## 📝 Notes for AI Agent (Gemini)

- Your primary role is to be an **orchestrator**. You will implement the logic that constructs the prompts, calls the `grok-4-fast-reasoning` model (which we will simulate), and handles the response.
- You are also responsible for implementing the **deterministic fallback** for each tool. Reuse logic from the previous version of this guide where applicable.
- When implementing, create a placeholder/mock function for `callXaiGrok(prompt)` that you can control for testing purposes. For example, it could return a pre-defined valid JSON for the "happy path" test, and return an error or malformed data for the fallback path test.
- **Your goal is to build the tools as specified in this AI-First guide.**

---

**Ready to build!** Use this guide as the specification for each tool. 🚀