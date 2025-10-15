/**
 * FILE: sdd-agents/agents/seam-discovery.js
 * 
 * WHAT: Extracts SDD seams from a natural-language PRD/description and produces a seam catalog report (and optional catalog update).
 * 
 * WHY: Implements Agent 0 (Seam Discovery) so non-coders can describe features in plain language and get seams/contracts identified automatically.
 * 
 * HOW DATA FLOWS:
 *   1. Read a PRD/description file (Markdown or text) via CLI arg --input.
 *   2. Construct AI prompt (system + task) and attempt AI-driven seam extraction (AI-first).
 *   3. Validate and normalize AI JSON against a seam report schema.
 *   4. If AI fails, run a deterministic heuristic fallback to extract candidate seams.
 *   5. Optionally merge proposed seams into docs/seam-catalog.md (or print a patch) when --update-catalog is provided.
 *   6. Output a human-readable table or JSON (--format json).
 * 
 * SEAMS:
 *   IN: CLI → SeamDiscovery (SEAM-50)
 *   OUT: SeamDiscovery → AI Model (SEAM-51)
 *   OUT: SeamDiscovery → Filesystem (SEAM-52)
 *   OUT: SeamDiscovery → docs/seam-catalog.md (SEAM-53)
 * 
 * CONTRACT: Agent0.SeamDiscovery v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import fs from 'fs/promises';
import path from 'path';

// ============== AI Integration (Simulated) ==============
async function callAiSeamExtractor(prompt) {
  // Simulate failure if content contains a magic token
  if (prompt.includes('SIMULATE_AI_ERROR')) {
    throw new Error('Simulated AI API failure');
  }
  // Simulate a plausible seams JSON for demo purposes
  const demo = {
    summary: {
      source: 'grok-4-fast-reasoning',
      confidence: 0.86,
    },
    seams: [
      {
        tempId: 'T-01',
        source: 'UI',
        target: 'TabManager',
        dataIn: { groupName: 'string(1-50)', tabIds: 'number[] (non-empty)' },
        dataOut: 'Result<GroupCreationSuccess, TabManagerError>',
        contract: 'ITabManager.createGroup',
        priority: 'P0',
      },
      {
        tempId: 'T-02',
        source: 'TabManager',
        target: 'ChromeTabsAPI',
        dataIn: '{ tabIds: number[] }',
        dataOut: 'Result<number, ChromeAPIError>',
        contract: 'IChromeTabsAPI.createGroup',
        priority: 'P0',
      },
      {
        tempId: 'T-03',
        source: 'TabManager',
        target: 'HumorSystem',
        dataIn: 'TabGroupCreatedEvent { groupName, tabCount, timestamp }',
        dataOut: 'void',
        contract: 'IHumorSystem.onEvent',
        priority: 'P1',
      },
    ],
  };
  return JSON.stringify(demo, null, 2);
}

function buildPrompt(systemPrompt, taskTemplate, prdContent) {
  return `${systemPrompt}\n\n${taskTemplate}\n\n<PRD>\n${prdContent}\n</PRD>`;
}

// ============== Deterministic Fallback (Heuristic) ==============
function fallbackExtractSeams(prdText) {
  // Very simple keyword-driven proposals to ensure something useful is returned
  const seams = [];
  const lower = prdText.toLowerCase();

  // If text mentions grouping tabs
  if (/(group|grouping)\s+tab/.test(lower)) {
    seams.push({
      tempId: 'F-01', source: 'UI', target: 'TabManager', dataIn: '{ groupName: string(1-50), tabIds: number[] }', dataOut: 'Result<GroupCreationSuccess, TabManagerError>', contract: 'ITabManager.createGroup', priority: 'P0'
    });
    seams.push({
      tempId: 'F-02', source: 'TabManager', target: 'ChromeTabsAPI', dataIn: '{ tabIds: number[] }', dataOut: 'Result<number, ChromeAPIError>', contract: 'IChromeTabsAPI.createGroup', priority: 'P0'
    });
  }
  // If text mentions notifications or humor/quip
  if (/(humor|quip|notification)/.test(lower)) {
    seams.push({
      tempId: 'F-03', source: 'TabManager', target: 'HumorSystem', dataIn: 'TabEvent/Trigger', dataOut: 'void', contract: 'IHumorSystem.onEvent', priority: 'P1'
    });
  }

  if (seams.length === 0) {
    // Provide a neutral starting seam if unknown
    seams.push({ tempId: 'F-99', source: 'UI', target: 'Core', dataIn: 'FeatureRequest', dataOut: 'Result<Outcome, Error>', contract: '(to define)', priority: 'P2' });
  }

  return { summary: { source: 'deterministic-fallback', confidence: 0.4 }, seams };
}

// ============== Normalization / Catalog Merge ==============
function parseExistingSeamIds(catalogContent) {
  if (!catalogContent) return { maxId: 0, existing: [] };
  const ids = [...catalogContent.matchAll(/SEAM-(\d{1,3})/g)].map(m => Number(m[1]));
  const maxId = ids.length ? Math.max(...ids) : 0;
  return { maxId, existing: ids };
}

function assignSeamIds(proposed, startFrom) {
  let counter = startFrom;
  return proposed.map(s => ({ ...s, id: `SEAM-${++counter}` }));
}

function toMarkdownTable(seams) {
  const header = '| Seam ID | Source | Target | Data Type | Contract Name | Priority |\n|---------|--------|--------|-----------|---------------|----------|';
  const rows = seams.map(s => `| ${s.id || s.tempId} | ${s.source} | ${s.target} | ${escapePipes(s.dataIn)} → ${escapePipes(s.dataOut)} | ${s.contract} | ${s.priority} |`);
  return [header, ...rows].join('\n');
}

function escapePipes(text) {
  return String(text).replace(/\|/g, '\\|');
}

function buildCatalogPatch(seams) {
  return `\n\n## DISCOVERED SEAMS (Proposed)\n\n${toMarkdownTable(seams)}\n`;
}

// ============== CLI / Main ==============
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { input: null, format: 'human', updateCatalog: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--input') opts.input = args[++i];
    else if (a === '--format') opts.format = args[++i];
    else if (a === '--update-catalog') opts.updateCatalog = args[++i];
  }
  if (!opts.input) throw new Error('Missing --input <file>');
  if (!['human', 'json'].includes(opts.format)) throw new Error('Invalid --format (human|json)');
  return opts;
}

async function run() {
  try {
    const { input, format, updateCatalog } = parseArgs(process.argv);
    const prdContent = await fs.readFile(path.resolve(input), 'utf-8');

    // Load prompts
    const systemPromptPath = path.resolve('sdd-agents/prompts/seam-discovery.system.md');
    const taskPromptPath = path.resolve('sdd-agents/prompts/seam-discovery.task.md');
    let systemPrompt = 'You are Agent 0: Seam Discovery. Extract seams from PRD.';
    let taskPrompt = 'Return JSON with seams: source, target, dataIn, dataOut, contract, priority.';
    try {
      systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
      taskPrompt = await fs.readFile(taskPromptPath, 'utf-8');
    } catch (_) {
      // Use defaults if prompt files not found
    }

    const prompt = buildPrompt(systemPrompt, taskPrompt, prdContent);

    let aiJson; let generatedBy = 'ai';
    try {
      const aiResp = await callAiSeamExtractor(prompt);
      aiJson = JSON.parse(aiResp);
      if (!aiJson || !Array.isArray(aiJson.seams)) throw new Error('Invalid AI JSON structure');
    } catch (e) {
      const fb = fallbackExtractSeams(prdContent);
      aiJson = fb; generatedBy = 'deterministic-fallback';
    }

    // Normalize: assign IDs
    let catalogContent = null; let startFrom = 0;
    if (updateCatalog) {
      try { catalogContent = await fs.readFile(path.resolve(updateCatalog), 'utf-8'); } catch (_) {}
    }
    const { maxId } = parseExistingSeamIds(catalogContent);
    const seamsWithIds = assignSeamIds(aiJson.seams, maxId);

    const report = {
      generatedBy,
      summary: { ...(aiJson.summary || {}), count: seamsWithIds.length },
      seams: seamsWithIds,
    };

    if (format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('SEAM DISCOVERY REPORT');
      console.log('======================\n');
      console.log(`Source: ${generatedBy}`);
      console.log(toMarkdownTable(seamsWithIds));
    }

    if (updateCatalog) {
      // If catalog exists, print a patch proposal to stdout rather than modifying immediately
      const patch = buildCatalogPatch(seamsWithIds);
      console.log('\n\n--- CATALOG PATCH (append to docs/seam-catalog.md) ---');
      console.log(patch);
    }

    process.exit(0);
  } catch (err) {
    console.error(`[SeamDiscovery] Error: ${err.message}`);
    console.error('Usage: node sdd-agents/agents/seam-discovery.js --input PRD.md [--format json] [--update-catalog docs/seam-catalog.md]');
    process.exit(2);
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] === import.meta.url.substring(7)) {
  run();
}

export { run };
