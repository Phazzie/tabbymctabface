# Adding Custom Quips to TabbyMcTabface

> **For Contributors**: A guide to adding new quips and easter eggs to TabbyMcTabface's passive-aggressive humor system.

---

## 🎯 Quick Start

Want to add your own snarky quips? Here's the 2-minute version:

1. **Edit quip data**: `src/impl/quip-data.ts`
2. **Follow the schema**: TypeScript interfaces define structure
3. **Test locally**: `npm run build && npm test`
4. **Submit PR**: Include examples of when your quip triggers

**That's it!** No JSON parsing, no complex build steps. The data is TypeScript, so you get autocomplete and type checking.

---

## 📚 Understanding the System

### Architecture Overview

TabbyMcTabface uses **TypeScript data files** for quips (not JSON):

```
src/impl/quip-data.ts          # All quip and easter egg data
src/contracts/IQuipStorage.ts  # TypeScript interfaces (the schema)
src/impl/QuipStorage.ts        # Data access layer
src/impl/HumorSystem.ts        # Quip selection logic
```

**Why TypeScript instead of JSON?**
- Type safety at compile time
- Autocomplete in IDEs
- Validation before runtime
- Easier to refactor
- No parsing errors

### Data Flow

```
1. User triggers action (close tab, create group)
   ↓
2. TabManager emits event to HumorSystem
   ↓
3. HumorSystem checks for easter eggs first
   ↓
4. If no easter egg, selects base quip
   ↓
5. QuipStorage provides data from quip-data.ts
   ↓
6. Notification displays quip to user
```

---

## 📝 The Schema

All quips must follow these TypeScript interfaces:

### Base Quip Structure

```typescript
interface Quip {
  id: string;              // Unique ID (e.g., "CLOSE_001")
  category: QuipCategory;  // "tabClosed" | "groupCreated"
  text: string;            // The actual quip text
  minQuality: number;      // Quality rating 1-10 (8+ recommended)
  tags?: string[];         // Optional tags for filtering
}
```

### Easter Egg Structure

```typescript
interface EasterEgg {
  id: string;              // Unique ID (e.g., "EASTER_042")
  category: QuipCategory;  // Same as base quips
  text: string;            // Easter egg quip text
  minQuality: number;      // Usually 9-10 for easter eggs
  trigger: EasterEggTrigger;  // When this triggers
}

interface EasterEggTrigger {
  type: TriggerType;       // "tabCount" | "timeOfDay" | "domainPattern" | etc.
  condition: TriggerCondition;  // Specific conditions
}
```

### Quip Categories

```typescript
type QuipCategory =
  | "tabClosed"       // After closing a random tab
  | "groupCreated"    // After creating a tab group
  | "tooManyTabs"     // When tab count is excessive
  | "tooFewTabs"      // When tab count is minimal
  | "achievement";    // Special achievements
```

---

## ✍️ Adding Base Quips

### Example: Adding a Tab Closed Quip

```typescript
// In src/impl/quip-data.ts

export const baseQuips: Quip[] = [
  // ... existing quips ...
  
  {
    id: "CLOSE_051",
    category: "tabClosed",
    text: "Tab eliminated. Your browser thanks you with slightly less RAM usage.",
    minQuality: 8,
    tags: ["technical", "ram", "subtle"]
  },
  
  {
    id: "CLOSE_052", 
    category: "tabClosed",
    text: "One less tab to worry about. Only 47 more to go.",
    minQuality: 7,
    tags: ["counting", "sarcastic"]
  }
];
```

### Best Practices for Base Quips

✅ **Do**:
- Keep it under 100 characters
- Use passive-aggressive tone
- Be clever, not mean
- Target intelligent users (they get the jokes)
- Include subtle technical humor
- Rate honestly (minQuality: 8+ for production)

❌ **Don't**:
- Be genuinely insulting
- Use profanity (we're snarky, not crude)
- Make assumptions about user's intelligence
- Reference specific personal data
- Exceed 150 characters (notification limit)

### Quality Ratings Guide

- **10**: Absolute gold - clever, funny, perfectly timed
- **9**: Great - will make most users smile
- **8**: Good - solid quip, production-ready
- **7**: Decent - works but not exceptional
- **6**: Meh - needs improvement
- **5 and below**: Don't ship it

**Rule**: Only ship quips rated 8+. We're quality over quantity.

---

## 🥚 Adding Easter Eggs

### Example: The Douglas Adams Easter Egg

```typescript
// In src/impl/quip-data.ts

export const easterEggs: EasterEgg[] = [
  {
    id: "EASTER_042",
    category: "tabClosed",
    text: "42 tabs. The answer to life, the universe, and everything. Or just poor tab management.",
    minQuality: 10,
    trigger: {
      type: "tabCount",
      condition: {
        exact: 42
      }
    }
  }
];
```

### Easter Egg Trigger Types

#### 1. Tab Count Triggers

```typescript
{
  type: "tabCount",
  condition: {
    exact: 42              // Exactly 42 tabs
  }
}

{
  type: "tabCount", 
  condition: {
    min: 100,              // 100 or more tabs
    max: 200               // 200 or fewer tabs
  }
}

{
  type: "tabCount",
  condition: {
    multiple: 10           // Tab count is multiple of 10
  }
}
```

#### 2. Time of Day Triggers

```typescript
{
  type: "timeOfDay",
  condition: {
    startHour: 2,          // 2 AM
    endHour: 4             // 4 AM (late night browsing)
  }
}

{
  type: "timeOfDay",
  condition: {
    exact: 13,             // Exactly 1:00 PM
    exact: 0               // Exactly midnight
  }
}
```

#### 3. Domain Pattern Triggers

```typescript
{
  type: "domainPattern",
  condition: {
    domains: ["github.com", "stackoverflow.com"],
    minCount: 10           // At least 10 dev-related tabs
  }
}

{
  type: "domainPattern",
  condition: {
    pattern: /reddit\.com/,
    category: "tabClosed"  // Closed a Reddit tab
  }
}
```

#### 4. Statistical Triggers

```typescript
{
  type: "statistical",
  condition: {
    metric: "tabsClosedToday",
    threshold: 50          // Closed 50+ tabs today
  }
}

{
  type: "statistical",
  condition: {
    metric: "groupsCreated",
    threshold: 10          // Created 10+ groups
  }
}
```

#### 5. Combo Triggers (Advanced)

```typescript
{
  type: "combo",
  condition: {
    all: [
      { type: "tabCount", condition: { min: 100 } },
      { type: "timeOfDay", condition: { startHour: 2, endHour: 4 } },
      { type: "domainPattern", condition: { pattern: /youtube\.com/ } }
    ]
  }
}
```

### Easter Egg Quality Guidelines

**For an easter egg to be worth including**:

1. **Specificity**: Should feel tailored to exact situation
2. **Cleverness**: More clever than base quips
3. **Delight**: Makes user smile when discovered
4. **Rareness**: Not too easy to trigger (defeats the point)
5. **Shareability**: User wants to tell others about it

**Rate all easter eggs 9-10. If it's not exceptional, it's not an easter egg.**

---

## 🧪 Testing Your Quips

### 1. Local Testing

```bash
# Build with your new quips
npm run build

# Run tests
npm test

# Check type safety
npm run type-check
```

### 2. Manual Testing

```bash
# Load extension in Chrome
1. Go to chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the /tabby directory
5. Test your quips!
```

### 3. Trigger Your Easter Eggs

```javascript
// In Chrome DevTools console (on popup page):

// Test tab count easter egg
// Open exactly 42 tabs, then click "I'm Feeling Lucky"

// Test time-based easter egg  
// Change system time or wait for trigger hour

// Test domain pattern
// Open 10+ GitHub tabs, then close one
```

### 4. Quality Check

Before submitting a PR, verify:

- [ ] TypeScript compiles without errors
- [ ] All existing tests pass
- [ ] New quip follows schema (IQuipStorage.ts)
- [ ] Quality rating is honest (8+ for base, 9-10 for eggs)
- [ ] No typos or grammar errors
- [ ] Tone matches existing quips (passive-aggressive, clever)
- [ ] Length under 150 characters
- [ ] Easter egg triggers are testable
- [ ] You tested it locally and it made you smile

---

## 📦 File Structure Reference

### `src/impl/quip-data.ts`

```typescript
/**
 * FILE: quip-data.ts
 * 
 * WHAT: All quip and easter egg data for TabbyMcTabface
 * 
 * WHY: Centralized data source, type-safe at compile time
 * 
 * HOW TO ADD QUIPS:
 *   1. Add to baseQuips array for standard quips
 *   2. Add to easterEggs array for context-aware quips
 *   3. Follow IQuipStorage.ts schema
 *   4. Test locally before submitting PR
 * 
 * SEAMS:
 *   OUT: QuipStorage (SEAM-XX)
 * 
 * CONTRACT: IQuipStorage v1.0.0
 */

import { Quip, EasterEgg, QuipCategory } from '../contracts/IQuipStorage';

export const baseQuips: Quip[] = [
  // Base quips here
];

export const easterEggs: EasterEgg[] = [
  // Easter eggs here
];

export const quipData = {
  baseQuips,
  easterEggs
};
```

### `src/contracts/IQuipStorage.ts`

This file defines the **schema** - don't edit this unless you're changing the contract itself.

**Key Interfaces**:
- `Quip` - Base quip structure
- `EasterEgg` - Easter egg structure
- `QuipCategory` - Valid categories
- `EasterEggTrigger` - Trigger types
- `TriggerCondition` - Condition structure

---

## 🎨 Writing Style Guide

### Tone Guidelines

**TabbyMcTabface Voice**:
- Passive-aggressive but playful
- Technically aware (knows about RAM, APIs, etc.)
- Self-aware (knows it's managing tabs)
- Subtle, not obvious
- Intelligent humor, not cheap shots

### Example Progressions

**Good Quip Evolution**:
1. "Tab closed." (boring, too simple)
2. "Tab closed. Hope it wasn't important." (better, slight snark)
3. "Tab closed. Your RAM breathes a tiny sigh of relief." (good - technical + subtle)
4. "That tab is gone now. Did you even remember what it was?" (great - philosophical)

**Easter Egg Evolution**:
1. "You have a lot of tabs." (not special enough)
2. "100 tabs open. Impressive or concerning?" (better, but generic)
3. "100 tabs. At this point you're not browsing, you're hoarding." (good - specific)
4. "100 tabs. There's a fine line between researcher and digital hoarder. You've crossed it." (great - specific + clever)

### Pop Culture Reference Guidelines

✅ **Timeless references** (will age well):
- Douglas Adams (Hitchhiker's Guide)
- Classic sci-fi (Star Trek, Star Wars)
- Math/tech jokes (42, Pi, binary)
- Internet culture (memes, but classic ones)

❌ **Avoid**:
- Current events (will date quickly)
- Niche references (too obscure)
- Political content (divisive)
- Platform-specific memes (too narrow)

---

## 🚀 Submitting Your Contribution

### PR Checklist

Before submitting your PR:

- [ ] Added quips to `src/impl/quip-data.ts`
- [ ] Followed TypeScript schema from `IQuipStorage.ts`
- [ ] All quips rated 8+ (base) or 9-10 (easter eggs)
- [ ] Ran `npm run build` successfully
- [ ] Ran `npm test` - all tests passing
- [ ] Tested quips in browser locally
- [ ] No typos or grammar errors
- [ ] Tone matches existing quips
- [ ] Easter eggs are testable and specific
- [ ] Updated this guide if adding new trigger types

### PR Template

```markdown
## Adding New Quips

**Type**: [Base Quips / Easter Eggs / Both]

**Count**: [X base quips, Y easter eggs]

**Categories**: [tabClosed / groupCreated / etc.]

**Quality Range**: [8-10]

**Tested**: [Yes - describe how you tested]

**Example Quips**:
- "Your new quip here..." (triggers when X)
- "Another quip..." (triggers when Y)

**Why These Quips**:
Brief explanation of the humor angle, why they fit TabbyMcTabface's voice, and what situations they address.

**Testing Notes**:
How you tested these locally (e.g., opened 42 tabs and triggered the easter egg)
```

### Review Process

1. **Automated checks**: TypeScript compilation, tests
2. **Code review**: Maintainer checks schema compliance
3. **Quality review**: Are quips actually funny/clever?
4. **Tone review**: Match TabbyMcTabface voice?
5. **Merge**: Once approved, quips go live in next release

---

## 📊 Current Stats

**As of v1.0.0**:
- **Base Quips**: ~50
- **Easter Eggs**: 160
- **Categories**: 5 (tabClosed, groupCreated, tooManyTabs, tooFewTabs, achievement)
- **Trigger Types**: 7 (tabCount, timeOfDay, domainPattern, statistical, combo, etc.)
- **Average Quality**: 8.5/10
- **Total Contributors**: [Your name could be here!]

---

## 💡 Ideas for New Quips

Need inspiration? Here are some underexplored angles:

### Time-Based Easter Eggs
- Midnight browsing habits
- Monday morning tabs (work dread)
- Friday evening tabs (freedom!)
- 3 AM philosophical browsing

### Tab Count Milestones
- Single tab (minimalist achievement)
- Powers of 2 (2, 4, 8, 16, 32, 64, 128, 256, 512)
- Round numbers (50, 100, 200, 500)
- Prime numbers (17, 23, 37, 101 tabs)

### Domain Patterns
- All shopping sites (retail therapy detection)
- All social media (procrastination mode)
- Mixed work/play (context switching chaos)
- All the same domain (deep dive detected)

### Statistical Achievements
- Closed 100 tabs in one day
- Created 20 tab groups
- Maintained single tab for 1 hour (restraint achievement)
- Opened and closed same tab 3 times (indecision)

### Meta Easter Eggs
- User keeps clicking "I'm Feeling Lucky" (tab closing spree)
- Created group with only 1 tab (defeats the purpose)
- Created group then immediately closed it (commitment issues)
- Reopened previously closed tab (regret detected)

---

## 🎯 Advanced: Adding New Trigger Types

If you need a trigger type that doesn't exist yet:

### 1. Define Trigger Interface

```typescript
// In src/contracts/IQuipStorage.ts

interface NewTriggerCondition {
  customField: string;
  threshold?: number;
}

type EasterEggTrigger = 
  | { type: "tabCount"; condition: TabCountCondition }
  | { type: "timeOfDay"; condition: TimeCondition }
  | { type: "newTrigger"; condition: NewTriggerCondition }  // Add this
  // ... existing triggers
```

### 2. Implement Detection Logic

```typescript
// In src/impl/HumorSystem.ts

private checkEasterEggs(trigger: HumorTrigger): EasterEgg | null {
  // ... existing checks ...
  
  if (eggTrigger.type === "newTrigger") {
    const condition = eggTrigger.condition as NewTriggerCondition;
    if (this.checkNewTriggerCondition(condition, context)) {
      return egg;
    }
  }
}

private checkNewTriggerCondition(
  condition: NewTriggerCondition, 
  context: BrowserContext
): boolean {
  // Your detection logic here
  return condition.customField === context.someValue;
}
```

### 3. Add Tests

```typescript
// In src/impl/__tests__/HumorSystem.test.ts

describe('new trigger type', () => {
  it('triggers easter egg when custom condition met', async () => {
    // Test your new trigger
  });
});
```

### 4. Document in This Guide

Add your new trigger type to the "Easter Egg Trigger Types" section above with examples.

---

## 🤝 Community Guidelines

### Quip Quality Bar

We maintain a **high quality bar** because:
- Users see these hundreds of times
- Bad quips get annoying fast
- Great quips make the extension delightful
- We're building a reputation for clever humor

**If in doubt, rate it lower. If it's truly great, you'll know.**

### Collaboration

- Check existing quips to avoid duplicates
- Build on others' ideas (with credit)
- Suggest improvements to existing quips
- Participate in quip review discussions
- Share your testing process

### Attribution

If you contribute quips:
- You'll be credited in CHANGELOG.md
- Your GitHub username in contributors list
- Karma points for making users smile

---

## 📞 Getting Help

**Questions about adding quips?**
- File a GitHub issue with tag `question`
- Check existing issues first
- Include your draft quip in the question

**Want feedback before submitting?**
- Open a draft PR with `[WIP]` tag
- Explain your approach
- Ask for early feedback

**Found a bug in quip system?**
- File issue with tag `bug`
- Include quip ID and expected vs actual behavior
- Steps to reproduce

---

## 🎉 Thank You!

Every quip you add makes TabbyMcTabface better. Your contribution will make thousands of users smile.

**Happy quipping!** 🎭

---

_P.S. - If you add a quip about adding quips, that's very meta and we'll probably accept it._
