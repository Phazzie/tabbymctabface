# Adding Quips and Easter Eggs

Runtime humor has one canonical source:

- base quips: `src/data/quips/passive-aggressive.json`;
- easter eggs: `src/data/quips/easter-eggs.json`.

Do not add content to `src/impl/quip-data.ts`; that module is only a typed compatibility re-export of the canonical JSON.

## Base quip schema

```json
{
  "id": "PA-076",
  "text": "A short, production-ready quip.",
  "triggerTypes": ["TabGroupCreated"],
  "level": "default",
  "metadata": {
    "tags": ["grouping"],
    "rarity": "common"
  }
}
```

IDs and text must be unique. `level` is `default`, `mild`, or `intense`; rarity is `common`, `uncommon`, or `rare`. Use an existing, tested trigger type.

## Easter-egg schema

```json
{
  "id": "EE-261",
  "type": "example-specific-trigger",
  "conditions": {
    "domainRegex": "(?:^|\\.)example\\.com$",
    "titleContains": "specific title",
    "tabCount": { "min": 3, "max": 12 }
  },
  "quips": [
    "A line that only makes sense when every condition is true."
  ],
  "level": "default",
  "metadata": {
    "nicheReference": "Explain the reference for reviewers",
    "difficulty": "rare"
  }
}
```

Supported condition keys are:

| Key | Value | Meaning |
| --- | --- | --- |
| `tabCount` | number or `{min,max}` | Current-window tab count |
| `groupCount` | number or `{min,max}` | Current-window group count |
| `domainRegex` | string | Case-insensitive regex against the active hostname |
| `titleContains` | string | Case-insensitive active-title substring |
| `urlContains` | string | Case-insensitive active-URL substring |
| `hourRange` | `{start,end}` | Inclusive local hours; a start above end wraps midnight |
| `customCheck` | allow-listed string | A predicate already implemented and directly tested in the framework |

All conditions on an entry must match. An active-tab condition is a non-match when no active tab is available. Unknown keys and unknown custom checks fail validation; they never become accidental matches.

## Selection behavior

The framework evaluates every definition, ranks matches by structural specificity, and then uses difficulty-derived rarity weights only among top-equivalent matches. Adding a broad rule cannot be allowed to make an existing precise egg unreachable.

When adding an egg:

1. choose a unique sequential ID and stable kebab-case type;
2. use the fewest conditions that make the joke feel exact;
3. explain obscure references in `nicheReference`;
4. add a unit test for any new predicate or collision pattern; and
5. add or update a reachability fixture proving the entry can be selected and delivered.

Do not add a new `customCheck` string without implementing its typed context field, evaluator, and positive/negative tests in the same change.

## Voice

Aim for concise skeptical wit, not insults. Avoid profanity, stereotypes, personal-data references, and jokes that require page contents. Notification copy should normally stay between 10 and 200 characters.

## Verify

```bash
npm run test:unit -- src/data/quips src/impl/__tests__/EasterEggFramework.test.ts
npm run typecheck
npm run build
npm run test:smoke
```

The full release gate is `npm run verify`.
