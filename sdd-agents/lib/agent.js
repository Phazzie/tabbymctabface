/**
 * FILE: agent.js
 * 
 * WHAT: Base AI agent class with pattern learning capabilities
 * 
 * WHY: Provides reusable AI agent infrastructure - handles LLM calls,
 *      pattern tracking, and few-shot learning for all SDD agents
 * 
 * HOW DATA FLOWS:
 *   1. Agent receives task input
 *   2. Loads successful patterns from JSONL database (few-shot examples)
 *   3. Constructs prompt with system context + examples + task
 *   4. Calls LLM API (Grok/Claude/GPT - configurable)
 *   5. Receives and validates output
 *   6. Saves pattern to database with success/failure feedback
 *   7. Returns result to caller
 * 
 * SEAMS:
 *   IN: Individual agents → Agent.run() (task, context)
 *   OUT: Agent → LLM API (prompt)
 *   OUT: Agent → Pattern Database (JSONL file writes)
 * 
 * CONTRACT: AgentBase (informal - provides run(), loadPatterns(), savePattern())
 * GENERATED: 2025-01-10
 * CUSTOM SECTIONS: None
 */

import { readFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Multi-provider LLM client
 * Supports: Grok (xAI), Claude (Anthropic), GPT (OpenAI)
 */
class LLMClient {
  constructor(provider = 'grok', model = null) {
    this.provider = provider.toLowerCase();
    
    // Default models per provider
    const defaultModels = {
      grok: 'grok-2-1212',
      claude: 'claude-3-5-sonnet-20241022',
      gpt: 'gpt-4-turbo-preview'
    };
    
    this.model = model || defaultModels[this.provider];
    
    // Initialize provider-specific client
    this._initClient();
  }

  async _initClient() {
    switch (this.provider) {
      case 'grok':
        // xAI uses OpenAI-compatible API
        const { OpenAI } = await import('openai');
        this.client = new OpenAI({
          apiKey: process.env.XAI_API_KEY,
          baseURL: 'https://api.x.ai/v1'
        });
        break;
        
      case 'claude':
        const Anthropic = await import('@anthropic-ai/sdk');
        this.client = new Anthropic.default({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        break;
        
      case 'gpt':
        const { OpenAI: OpenAIGPT } = await import('openai');
        this.client = new OpenAIGPT({
          apiKey: process.env.OPENAI_API_KEY
        });
        break;
        
      default:
        throw new Error(`Unknown provider: ${this.provider}. Use 'grok', 'claude', or 'gpt'`);
    }
  }

  async complete({ system, messages, maxTokens = 4096 }) {
    switch (this.provider) {
      case 'grok':
      case 'gpt':
        // OpenAI-compatible API
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            ...messages
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        });
        return response.choices[0].message.content;
        
      case 'claude':
        // Anthropic API
        const claudeResponse = await this.client.messages.create({
          model: this.model,
          max_tokens: maxTokens,
          system,
          messages
        });
        return claudeResponse.content[0].text;
        
      default:
        throw new Error(`Provider not configured: ${this.provider}`);
    }
  }
}

export class Agent {
  constructor(name, config = {}) {
    this.name = name;
    this.systemPrompt = config.systemPrompt || 'You are a helpful AI assistant.';
    this.patternFile = config.patternFile || `sdd-agents/patterns/${name}.jsonl`;
    this.maxExamples = config.maxExamples || 5;
    
    // LLM provider configuration
    this.provider = config.provider || process.env.LLM_PROVIDER || 'grok';
    this.model = config.model || process.env.LLM_MODEL || null;
    
    this.client = new LLMClient(this.provider, this.model);
    
    console.log(`🤖 Initialized ${name} agent using ${this.provider} (${this.client.model})`);
  }

  /**
   * Load successful patterns for few-shot learning
   * 
   * DATA IN: count (number of examples to load)
   * DATA OUT: Array of successful pattern objects
   * 
   * FLOW:
   *   1. Check if pattern file exists
   *   2. Read JSONL file line by line
   *   3. Parse each line as JSON
   *   4. Filter for successful feedback
   *   5. Return most recent N examples
   * 
   * ERRORS:
   *   - FileNotFound: Returns empty array (graceful)
   *   - ParseError: Skips malformed lines, logs warning
   * 
   * PERFORMANCE: <50ms for typical pattern files (<1000 lines)
   */
  async loadPatterns(count = this.maxExamples) {
    if (!existsSync(this.patternFile)) {
      console.log(`📝 No pattern database yet for ${this.name} - will create on first run`);
      return [];
    }

    try {
      const content = await readFile(this.patternFile, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.length > 0);
      
      const patterns = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            console.warn(`⚠️  Skipping malformed pattern line: ${line.substring(0, 50)}...`);
            return null;
          }
        })
        .filter(p => p && p.feedback === 'success')
        .slice(-count); // Most recent N successful patterns

      console.log(`📚 Loaded ${patterns.length} successful patterns for ${this.name}`);
      return patterns;
    } catch (err) {
      console.warn(`⚠️  Could not load patterns from ${this.patternFile}:`, err.message);
      return [];
    }
  }

  /**
   * Save pattern to database for future learning
   * 
   * DATA IN: input (task input), output (agent result), feedback (success/failure), reason (optional)
   * DATA OUT: void (side effect: appends to JSONL file)
   * 
   * FLOW:
   *   1. Ensure patterns directory exists
   *   2. Construct pattern object with metadata
   *   3. Append as JSONL line to pattern file
   *   4. Log success
   * 
   * ERRORS:
   *   - WriteError: Logs error but doesn't throw (graceful degradation)
   */
  async savePattern(input, output, feedback, reason = null) {
    try {
      // Ensure directory exists
      const dir = dirname(this.patternFile);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      const pattern = {
        input: typeof input === 'string' ? input.substring(0, 500) : JSON.stringify(input).substring(0, 500),
        output: typeof output === 'string' ? output.substring(0, 500) : JSON.stringify(output).substring(0, 500),
        feedback,
        reason,
        timestamp: new Date().toISOString(),
        agent: this.name,
        provider: this.provider
      };

      await appendFile(this.patternFile, JSON.stringify(pattern) + '\n');
      
      const emoji = feedback === 'success' ? '✅' : '❌';
      console.log(`${emoji} Pattern saved (${feedback}) → ${this.patternFile}`);
    } catch (err) {
      console.error(`❌ Error saving pattern:`, err.message);
    }
  }

  /**
   * Run the AI agent with task and context
   * 
   * DATA IN: 
   *   - task: User prompt/instruction
   *   - context: Additional context (code, files, etc.)
   *   - examples: Optional override of few-shot examples
   * 
   * DATA OUT: LLM response text
   * 
   * SEAM: Agent → LLM API (Grok/Claude/GPT)
   * 
   * FLOW:
   *   1. Load few-shot examples (unless provided)
   *   2. Construct messages with examples + task
   *   3. Call LLM API with system prompt
   *   4. Extract and return response
   * 
   * ERRORS:
   *   - APIError: Throws with descriptive message
   *   - RateLimitError: Throws (caller should retry)
   * 
   * PERFORMANCE: ~500ms-2s depending on LLM (Grok is fastest)
   */
  async run({ task, context = '', examples = null, savePattern = false }) {
    // Load examples if not provided
    const patterns = examples !== null ? examples : await this.loadPatterns();

    // Construct few-shot examples
    let examplesText = '';
    if (patterns.length > 0) {
      examplesText = '\n\n## Examples from your pattern database:\n\n';
      patterns.forEach((p, i) => {
        examplesText += `### Example ${i + 1}:\n`;
        examplesText += `Input: ${p.input}\n`;
        examplesText += `Output: ${p.output}\n\n`;
      });
      examplesText += '## Your Task:\n\n';
    }

    const userMessage = `${examplesText}${task}\n\n${context}`;

    try {
      const result = await this.client.complete({
        system: this.systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      });

      // Optionally save pattern
      if (savePattern) {
        await this.savePattern(task, result, 'success');
      }

      return result;
    } catch (err) {
      console.error(`❌ Error calling ${this.provider} API:`, err.message);
      
      // Save failure pattern
      if (savePattern) {
        await this.savePattern(task, null, 'failure', err.message);
      }
      
      throw err;
    }
  }

  /**
   * Run agent and provide human feedback on result
   * This improves pattern learning over time
   */
  async runWithFeedback({ task, context = '' }) {
    const result = await this.run({ task, context });
    
    console.log('\n' + '='.repeat(60));
    console.log('AGENT RESULT:');
    console.log('='.repeat(60));
    console.log(result);
    console.log('='.repeat(60));
    
    // In real usage, you'd prompt for human feedback here
    // For now, auto-save as success
    await this.savePattern(task, result, 'success');
    
    return result;
  }
}
