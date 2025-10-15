# SDD Agents - AI-First Implementation

## Architecture

This directory contains **AI-first agents** that enforce Seam-Driven Development principles. Instead of brittle regex and heuristics, we use LLM APIs (Claude, GPT) to understand code semantically and learn from patterns.

## Directory Structure

```
sdd-agents/
├── agents/           # Individual agent implementations
├── lib/              # Shared utilities (LLM client, pattern tracker)
├── patterns/         # Pattern database (learning from examples)
├── prompts/          # Reusable prompt templates
└── cli.js            # Command-line interface
```

## Pattern-Based Learning

Each agent tracks patterns in `patterns/<agent-name>.jsonl`:

```jsonl
{"input": "...", "output": "...", "feedback": "success", "timestamp": "..."}
{"input": "...", "output": "...", "feedback": "failure", "reason": "...", "timestamp": "..."}
```

Agents use **few-shot learning**:
1. Load successful patterns from database
2. Include as examples in LLM prompt
3. LLM generates output based on learned patterns
4. Save result back to pattern database
5. Over time, agents get better at project-specific conventions

## Core Agents

### 1. Documentation Validator (Priority 1)
**What**: Validates WHAT/WHY/HOW headers using AI
**Why AI**: Understands *semantic* completeness, not just presence
**Command**: `npm run validate src/core/TabManager.ts`

### 2. Seam Catalog Generator (Priority 1)
**What**: Scans code for seams using AI code understanding
**Why AI**: Recognizes boundaries semantically, not just interface keywords
**Command**: `npm run scan-seams src/`

### 3. Contract Generator (Priority 2)
**What**: Generates TypeScript interfaces from seam descriptions
**Why AI**: Translates natural language → typed contracts
**Command**: `npm run gen-contract --seam SEAM-01`

### 4. Test Generator (Priority 2)
**What**: Generates comprehensive tests from contracts
**Why AI**: Understands contract semantics, generates edge cases
**Command**: `npm run gen-tests contracts/ITabManager.ts`

## Usage Examples

### Validate documentation compliance:
```bash
npm run validate src/**/*.ts
# AI checks: WHAT/WHY/HOW completeness, seam documentation, contract versioning
```

### Discover seams automatically:
```bash
npm run scan-seams src/
# AI identifies: interface boundaries, data crossings, external API calls
# Outputs: Updated seam catalog with discovered seams
```

### Generate contract from description:
```bash
npm run gen-contract --seam SEAM-01 --description "UI sends group creation request to TabCore"
# AI generates: TypeScript interface with Result types, error enums, JSDoc
```

### Generate tests from contract:
```bash
npm run gen-tests contracts/ITabManager.ts
# AI generates: Contract tests, input validation, error handling, performance tests
```

## AI Provider Configuration

Create `.env` file:
```bash
ANTHROPIC_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here
```

Agents default to Claude (Anthropic) but can use any LLM provider.

## Pattern Tracking

Agents automatically track patterns. View pattern database:
```bash
cat sdd-agents/patterns/documentation-validator.jsonl
```

Patterns improve over time:
- **Week 1**: Generic validation
- **Week 2**: Learns TabbyMcTabface-specific patterns
- **Week 3**: Recognizes humor system conventions
- **Week 4**: Suggests improvements based on project patterns

## Building Your Own Agent

```javascript
import { Agent } from './lib/agent.js';

const myAgent = new Agent('my-agent', {
  systemPrompt: 'You are a specialized SDD agent for...',
  patternFile: 'patterns/my-agent.jsonl'
});

const result = await myAgent.run({
  task: 'Analyze this code...',
  code: fileContent,
  examples: await myAgent.loadPatterns(5) // Load 5 successful examples
});

await myAgent.savePattern(input, result, 'success');
```

## Integration with CI

Add to `.github/workflows/sdd-validation.yml`:
```yaml
- name: Validate SDD Compliance
  run: npm run validate src/**/*.ts
  
- name: Check for undocumented seams
  run: npm run scan-seams src/
```

## Philosophy

**AI > Heuristics** because:
1. AI understands *semantic meaning*, not just syntax patterns
2. AI learns from project-specific examples over time
3. AI generates contextually appropriate output
4. AI adapts to evolving conventions without code changes

**Pattern Learning** because:
1. Few-shot learning improves accuracy
2. Project-specific patterns emerge naturally
3. Agents get smarter with each use
4. Human feedback (success/failure) guides learning
