/**
 * Script to extract quip data from TypeScript to JSON files
 * Run: npx tsx scripts/extract-quips-to-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PASSIVE_AGGRESSIVE_QUIPS, EASTER_EGGS } from '../src/impl/quip-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../src/data/quips');

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write passive-aggressive quips
const paPath = path.join(dataDir, 'passive-aggressive.json');
fs.writeFileSync(paPath, JSON.stringify(PASSIVE_AGGRESSIVE_QUIPS, null, 2));
console.log(`✅ Created passive-aggressive.json (${PASSIVE_AGGRESSIVE_QUIPS.length} quips)`);

// Write easter eggs
const eePath = path.join(dataDir, 'easter-eggs.json');
fs.writeFileSync(eePath, JSON.stringify(EASTER_EGGS, null, 2));
console.log(`✅ Created easter-eggs.json (${EASTER_EGGS.length} easter eggs)`);

console.log('\n📊 Bundle size reduction estimate:');
console.log(`  TypeScript file: ~${fs.statSync(path.join(__dirname, '../src/impl/quip-data.ts')).size} bytes`);
console.log(`  JSON files: ~${fs.statSync(paPath).size + fs.statSync(eePath).size} bytes`);
console.log('  (JSON compresses better and doesn\'t need TypeScript compilation)');
