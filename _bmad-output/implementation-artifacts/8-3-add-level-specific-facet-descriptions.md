# Story 8.3: Add Level-Specific Facet Descriptions

Status: review

## Story

As a **User exploring my facet breakdown**,
I want **to understand what each facet score means for me specifically**,
So that **the granular 30-facet breakdown feels informative rather than overwhelming**.

## Acceptance Criteria

1. **Given** I expand a trait to see facet breakdown **When** each facet renders **Then** I see: facet name + score (existing) and a level-specific description (50-200 characters) matching my level (Low/High) **And** the description explains what this facet level means in everyday behavior

2. **Given** I score High on "Orderliness" facet **When** the facet detail renders **Then** I read something like: "You thrive with clear systems and organized spaces. When things are out of place, you notice — and you're usually the one who fixes it."

3. **Given** all 2 levels exist for all 30 facets **When** any user views results **Then** 60 total descriptions exist (30 facets x 2 levels) **And** each facet uses two-letter level codes (OCEAN trait prefix + facet-specific letter) **And** all descriptions are 50-200 characters

4. **Given** each facet has named levels with two-letter codes **When** the constant is examined **Then** each facet's two level codes are formed as OCEAN trait prefix + facet-specific letter (e.g., orderliness: `"CS"` for Spontaneous, `"CM"` for Methodical) **And** a `FACET_LEVEL_LABELS` mapping provides the human-readable name for each code **And** codes are globally unique (no collisions across facets)

5. **Given** the new `FACET_DESCRIPTIONS` constant is created **When** the domain package is built **Then** it is properly exported from `packages/domain/src/index.ts` **And** can be imported as `import { FACET_DESCRIPTIONS } from "@workspace/domain"` **And** it is declared with `as const satisfies Record<FacetName, ...>` so the object is deeply readonly **And** a `FacetDescriptions` type is derived via `typeof FACET_DESCRIPTIONS` and exported

6. **Given** the results page renders facet descriptions **When** viewed on mobile and desktop **Then** descriptions wrap cleanly within the existing expanded facet layout

7. **Given** the domain package tests run **When** all facet description tests execute **Then** all 30 facets have 2 level descriptions **And** no regressions in existing tests (`pnpm test:run`)

8. **Given** a facet score to level mapping function exists **When** any facet score (0-20) is passed **Then** it returns the correct two-letter level code: 0-10=Low code, 11-20=High code

9. **Given** `FacetData.name` in `TraitScoresSection.tsx` is typed as `string` **When** this story is implemented **Then** the type is updated to `FacetName` (imported from `@workspace/domain`) **And** the `as FacetName` casts in the rendering code are removed **And** callers that construct `FacetData` objects cast to `FacetName` at the data boundary instead

## Tasks / Subtasks

- [ ] Task 1: Define facet-level types and labels (AC: #4)
  - [ ] 1.1 Define per-facet level types in `packages/domain/src/types/facet-levels.ts` — each facet gets a 2-value union type with two-letter codes: OCEAN trait prefix + facet-specific letter (e.g., `type ImaginationLevel = "OP" | "OV"` for Practical/Vivid)
  - [ ] 1.2 Create `FACET_LETTER_MAP` constant: `Record<FacetName, readonly [string, string]>` mapping `[lowCode, highCode]` per facet — each code is 2 characters: OCEAN trait letter + facet-specific letter
  - [ ] 1.3 Create `FACET_LEVEL_LABELS` constant: `Record<string, string>` mapping every two-letter code to its human-readable name (e.g., `{ OP: "Practical", OV: "Vivid", CS: "Spontaneous", CM: "Methodical", ... }`) — globally unique, flat map safe
  - [ ] 1.4 Choose meaningful, non-judgmental level names for all 30 facets (60 names total). Low levels are strengths, not deficits. Follow the trait naming pattern (e.g., Low Agreeableness = "Candid" not "Difficult"). Second letter of each code must be unique within the same OCEAN trait group (12 codes per trait)
  - [ ] 1.5 Export all types and constants from `packages/domain/src/index.ts`

- [ ] Task 2: Create `facet-descriptions.ts` constant file (AC: #3, #5)
  - [ ] 2.1 Create `packages/domain/src/constants/facet-descriptions.ts` with `FACET_DESCRIPTIONS` export
  - [ ] 2.2 Declare with `as const satisfies Record<FacetName, { levels: Record<string, string> }>` — validates all 30 facets present at compile time while preserving literal types
  - [ ] 2.3 Derive and export `FacetDescriptions` type: `export type FacetDescriptions = typeof FACET_DESCRIPTIONS`
  - [ ] 2.4 Use per-facet two-letter codes (from `FACET_LETTER_MAP`) — NOT generic "L"/"H"
  - [ ] 2.5 Write 60 level descriptions (30 facets x 2 levels, 50-200 characters each)
  - [ ] 2.6 Follow content tone guidelines: second-person, warm, behavioral, non-judgmental
  - [ ] 2.7 Export from `packages/domain/src/index.ts`

- [ ] Task 3: Create facet score-to-level mapping utility (AC: #8)
  - [ ] 3.1 Create `getFacetLevel` function in `packages/domain/src/utils/facet-level.ts`
  - [ ] 3.2 Signature: `getFacetLevel(facetName: FacetName, score: number): string`
  - [ ] 3.3 Threshold: 0-10=Low code, 11-20=High code (binary split at midpoint)
  - [ ] 3.4 Uses `FACET_LETTER_MAP[facetName]` to return the correct two-letter code
  - [ ] 3.5 Export from `packages/domain/src/index.ts`

- [ ] Task 4: Update `FacetData` type and TraitScoresSection rendering (AC: #1, #2, #6, #9)
  - [ ] 4.1 Update `FacetData.name` from `string` to `FacetName` (import from `@workspace/domain`) in `TraitScoresSection.tsx`
  - [ ] 4.2 Update callers that construct `FacetData` to cast `name` to `FacetName` at the data boundary (e.g., `toFacetData` in `public-profile.$publicProfileId.tsx` already does `as FacetName` — move the cast to the `name` field)
  - [ ] 4.3 Import `FACET_DESCRIPTIONS` and `getFacetLevel` from `@workspace/domain`
  - [ ] 4.4 Add level-specific description below each facet's score bar — lookup: `FACET_DESCRIPTIONS[facet.name].levels[getFacetLevel(facet.name, facet.score)]` (no `as FacetName` cast needed since `facet.name` is now `FacetName`)
  - [ ] 4.5 Remove any `as FacetName` casts in the rendering code that are no longer needed
  - [ ] 4.6 Style: `text-xs text-muted-foreground leading-relaxed mt-1.5`
  - [ ] 4.7 Add `data-slot="facet-description"` to the description element
  - [ ] 4.8 Ensure responsive — text wraps cleanly within the existing expanded facet layout

- [ ] Task 5: Write tests (AC: #3, #7, #8)
  - [ ] 5.1 Create `packages/domain/src/constants/__tests__/facet-descriptions.test.ts`
  - [ ] 5.2 Test all 30 facets have 2 level descriptions keyed by their facet-specific letters
  - [ ] 5.3 Test description character-length constraints (50-200 chars per description)
  - [ ] 5.4 Create `packages/domain/src/utils/__tests__/facet-level.test.ts`
  - [ ] 5.5 Test `getFacetLevel` returns correct two-letter code for boundary values (0, 10, 11, 20) across multiple facets
  - [ ] 5.6 Test `FACET_LETTER_MAP` has entries for all 30 facets with exactly 2 codes each, each code is 2 characters long, and correct OCEAN trait prefix
  - [ ] 5.7 Test `FACET_LEVEL_LABELS` has entries for every code in `FACET_LETTER_MAP` and all codes are globally unique
  - [ ] 5.8 Run `pnpm test:run` — verify no regressions

## Dev Notes

### Key Architecture Constraints

- **Pure domain change + frontend rendering** — no API changes, no schema changes, no DB changes, no handler changes
- **ADR-5 compliance** — facet descriptions are in-memory constants, NOT in the database
- **Static content** — descriptions are derived at read-time from the facet score; no API call needed
- **Deterministic output** — same facet + level always renders the same description

### Story 8.2 Relationship (No Code Dependency)

Story 8.2 (Add Level-Specific Trait Descriptions) is currently `ready-for-dev` but NOT yet implemented. `trait-descriptions.ts` does NOT exist yet. Story 8.3 does NOT depend on 8.2 for code — both create separate constant files. However:
- If 8.2 is implemented first, follow the same file creation patterns it establishes
- If 8.3 is implemented first or in parallel, that's fine — no code dependency exists

### Facet Level Design: Two-Letter Codes (Trait Prefix + Facet Letter)

Each facet gets its own named levels with **two-letter codes**. The first letter is the OCEAN trait prefix (`O`/`C`/`E`/`A`/`N`), the second is a facet-specific letter. Codes are **globally unique** — no collision risk in flat lookups.

**OCEAN trait prefix mapping:**
- `O` = Openness, `C` = Conscientiousness, `E` = Extraversion, `A` = Agreeableness, `N` = Neuroticism

**Facet example (new for Story 8.3):**
- orderliness (C): `"CS"` (Spontaneous) | `"CM"` (Methodical)
- imagination (O): `"OP"` (Practical) | `"OV"` (Vivid)
- anxiety (N): `"NC"` (Composed) | `"NA"` (Anxious)

**Key differences from traits:**
- **2 levels only** (Low/High) — no Mid level. Binary split at score 10.
- **Threshold:** 0-10 = Low code, 11-20 = High code
- **Two-letter codes** — first letter is OCEAN trait, second is facet-specific. Globally unique.
- **Dev agent names all 60 levels** — choose meaningful, non-judgmental names where Low is a strength, not a deficit
- **Second letter uniqueness** — within each trait group (6 facets × 2 levels = 12 codes), all second letters must be unique

### Data Structures

**Facet level types (`packages/domain/src/types/facet-levels.ts`):**

```typescript
import type { FacetName } from "../constants/big-five";

// Per-facet level types — 2-letter codes: OCEAN prefix + facet letter (dev agent defines all 30)
export type ImaginationLevel = "OP" | "OV";       // O=Openness: Practical | Vivid
export type OrderlinessLevel = "CS" | "CM";        // C=Conscientiousness: Spontaneous | Methodical
export type AnxietyLevel = "NC" | "NA";            // N=Neuroticism: Composed | Anxious
// ... 27 more facet level types

// OCEAN trait prefix: O=Openness, C=Conscientiousness, E=Extraversion, A=Agreeableness, N=Neuroticism

// Mapping: facetName → [lowCode, highCode]
export const FACET_LETTER_MAP: Record<FacetName, readonly [string, string]> = {
  imagination: ["OP", "OV"],       // Openness: Practical, Vivid
  orderliness: ["CS", "CM"],       // Conscientiousness: Spontaneous, Methodical
  anxiety: ["NC", "NA"],           // Neuroticism: Composed, Anxious
  // ... 27 more
} as const;

// Human-readable labels for every two-letter code — globally unique, flat map safe
export const FACET_LEVEL_LABELS: Record<string, string> = {
  // Openness facets (O prefix)
  OP: "Practical",
  OV: "Vivid",
  // Conscientiousness facets (C prefix)
  CS: "Spontaneous",
  CM: "Methodical",
  // Neuroticism facets (N prefix)
  NC: "Composed",
  NA: "Anxious",
  // ... all 60 codes
} as const;
```

**Facet level utility (`packages/domain/src/utils/facet-level.ts`):**

```typescript
import type { FacetName } from "../constants/big-five";
import { FACET_LETTER_MAP } from "../types/facet-levels";

// Assumes valid FacetName input — frontend must guard with optional chaining before calling
export function getFacetLevel(facetName: FacetName, score: number): string {
  const [low, high] = FACET_LETTER_MAP[facetName];
  return score <= 10 ? low : high;
}
```

**Float score handling:** `FacetScore.score` can be a float (weighted average). The `<= 10` threshold handles this correctly — e.g., `10.0` → Low, `10.1` → High. No `Math.round()` needed.

**Facet descriptions (`packages/domain/src/constants/facet-descriptions.ts`):**

```typescript
import type { FacetName } from "../constants/big-five";

// Each facet's levels use two-letter codes from FACET_LETTER_MAP
// `as const` makes deeply readonly; `satisfies` validates all 30 facets at compile time
export const FACET_DESCRIPTIONS = {
  imagination: {
    levels: {
      OP: "You anchor conversations in what's real and tangible, preferring practical solutions over abstract speculation.",
      OV: "Your mind wanders into vivid possibilities — you're always imagining how things could be different or better."
    }
  },
  // ... 29 more facets
} as const satisfies Record<FacetName, { levels: Record<string, string> }>;

// Derived type — preserves literal key types for type-safe lookups
export type FacetDescriptions = typeof FACET_DESCRIPTIONS;
```

### Level Naming Guidelines for Dev Agent

The dev agent must create 60 level names (30 facets x 2 levels) and assign two-letter codes. Follow these rules:

- **Two-letter code format:** First letter = OCEAN trait prefix (`O`/`C`/`E`/`A`/`N`). Second letter = facet-specific, chosen by dev agent.
- **Second letter uniqueness:** Within each trait group (6 facets × 2 levels = 12 codes), all second letters must be unique. Different trait groups can reuse second letters freely (the trait prefix prevents collisions).
- **Low is a strength, not a deficit.** Low Cautiousness = "Decisive" not "Reckless". Low Modesty = "Confident" not "Arrogant".
- **One-word names preferred.** Keep names concise like traits do ("Introvert", "Disciplined", "Warm").
- **Avoid overlap with trait level names.** Don't reuse: Practical, Grounded, Open-minded, Flexible, Balanced, Disciplined, Introvert, Ambivert, Extravert, Candid, Negotiator, Warm, Resilient, Temperate, Sensitive.
- **Behaviorally descriptive.** Names should hint at real behavior, not clinical psychology terms.

**OCEAN trait prefixes:**
| Prefix | Trait | Codes format |
|--------|-------|--------------|
| `O` | Openness | `O_` where `_` is any unique letter within 12 Openness codes |
| `C` | Conscientiousness | `C_` where `_` is any unique letter within 12 Conscientiousness codes |
| `E` | Extraversion | `E_` where `_` is any unique letter within 12 Extraversion codes |
| `A` | Agreeableness | `A_` where `_` is any unique letter within 12 Agreeableness codes |
| `N` | Neuroticism | `N_` where `_` is any unique letter within 12 Neuroticism codes |

### All 30 Facets — Dev Agent Writes Level Names and Descriptions

**Openness (6) — prefix `O`:**
| Facet | Description Context | Example Low (Code → Name) | Example High (Code → Name) |
|-------|-------------------|--------------------------|----------------------------|
| `imagination` | Fantasy, daydreaming, creative visualization | `OP` → Practical | `OV` → Vivid |
| `artistic_interests` | Appreciation for art, beauty, aesthetics | | |
| `emotionality` | Receptiveness to own emotions, emotional awareness | | |
| `adventurousness` | Willingness to try new activities, novelty-seeking | | |
| `intellect` | Intellectual curiosity, open to new ideas | | |
| `liberalism` | Readiness to re-examine values and conventions | | |

**Conscientiousness (6) — prefix `C`:**
| Facet | Description Context | Example Low (Code → Name) | Example High (Code → Name) |
|-------|-------------------|--------------------------|----------------------------|
| `self_efficacy` | Belief in ability to accomplish tasks, competence | | |
| `orderliness` | Personal organization, tidiness, systems | `CS` → Spontaneous | `CM` → Methodical |
| `dutifulness` | Sense of moral obligation, responsibility | | |
| `achievement_striving` | Drive for personal achievement, ambition | | |
| `self_discipline` | Ability to complete tasks despite distractions | | |
| `cautiousness` | Tendency to think carefully before acting | | |

**Extraversion (6) — prefix `E`:**
| Facet | Description Context | Example Low (Code → Name) | Example High (Code → Name) |
|-------|-------------------|--------------------------|----------------------------|
| `friendliness` | Warmth, interest in others, approachability | | |
| `gregariousness` | Preference for company of others, social energy | | |
| `assertiveness` | Social dominance, forcefulness of expression | | |
| `activity_level` | Pace of living, energy, busyness | | |
| `excitement_seeking` | Need for stimulation, thrill-seeking | | |
| `cheerfulness` | Tendency to experience joy, happiness, positivity | | |

**Agreeableness (6) — prefix `A`:**
| Facet | Description Context | Example Low (Code → Name) | Example High (Code → Name) |
|-------|-------------------|--------------------------|----------------------------|
| `trust` | Belief in sincerity and good intentions of others | | |
| `morality` | Straightforwardness, frankness, sincerity | | |
| `altruism` | Active concern for welfare of others | | |
| `cooperation` | Willingness to compromise, avoid confrontation | | |
| `modesty` | Tendency to downplay oneself, humility | | |
| `sympathy` | Compassion for others, moved by others' needs | | |

**Neuroticism (6) — prefix `N`:**
| Facet | Description Context | Example Low (Code → Name) | Example High (Code → Name) |
|-------|-------------------|--------------------------|----------------------------|
| `anxiety` | Level of free-floating anxiety, worry | | |
| `anger` | Tendency to experience anger, frustration | | |
| `depression` | Tendency toward guilt, sadness, hopelessness | | |
| `self_consciousness` | Shyness, social anxiety, embarrassment | | |
| `immoderation` | Difficulty controlling cravings and urges | | |
| `vulnerability` | Susceptibility to stress, feeling overwhelmed | | |

### Content Writing Guidelines

Per Epic 8 content authoring notes:
- **Second person:** "You tend to..." not "People with this facet..."
- **Warm and affirming:** Celebrate each level as valid, not better/worse
- **Behavioral:** Describe what users DO, not abstract psychology
- **Specific:** Use concrete examples ("you're the one checking the map")
- **Non-judgmental:** Low scores are strengths too (e.g., Low Cautiousness = "decisive and action-oriented")
- **Character length target:** 50-200 characters per description (punchy, 1-2 sentences)

### Source Tree Components to Touch

| File | Change Type | Purpose |
|------|------------|---------|
| `packages/domain/src/types/facet-levels.ts` | CREATE | Per-facet level types, `FACET_LETTER_MAP`, `FACET_LEVEL_LABELS` |
| `packages/domain/src/constants/facet-descriptions.ts` | CREATE | 30 facets x 2 levels = 60 descriptions |
| `packages/domain/src/utils/facet-level.ts` | CREATE | `getFacetLevel(facetName, score)` mapping: 0-10=Low, 11-20=High |
| `packages/domain/src/index.ts` | EDIT | Export `FACET_DESCRIPTIONS`, `getFacetLevel`, `FACET_LETTER_MAP`, `FACET_LEVEL_LABELS` |
| `apps/front/src/components/results/TraitScoresSection.tsx` | EDIT | Update `FacetData.name` to `FacetName`, render facet description below each facet score bar |
| `apps/front/src/routes/public-profile.$publicProfileId.tsx` | EDIT | Cast `name` to `FacetName` in `toFacetData` at data boundary |
| `packages/domain/src/constants/__tests__/facet-descriptions.test.ts` | CREATE | Validate 60 descriptions |
| `packages/domain/src/utils/__tests__/facet-level.test.ts` | CREATE | Validate score-to-level mapping |

### Files NOT to Touch

- `packages/domain/src/utils/archetype-lookup.ts` — Contains private `TRAIT_DESCRIPTIONS` (different concept). Do NOT modify.
- `packages/domain/src/constants/archetypes.ts` — Archetype descriptions (Story 8.1). Unrelated.
- `packages/domain/src/constants/trait-descriptions.ts` — Trait descriptions (Story 8.2, may or may not exist). Separate concept.
- `packages/domain/src/types/archetype.ts` — Trait-level types. Do NOT add facet types here; create separate `facet-levels.ts`.
- `packages/contracts/` — No API contract changes needed (descriptions are client-side constants).
- `apps/api/` — No handler or use-case changes.
- `packages/infrastructure/` — No repository changes.
- `apps/front/src/components/results/FacetBreakdown.tsx` — This component is NOT used by TraitScoresSection. Facets are rendered inline. Do NOT modify this file.

### Frontend Rendering Pattern

Current inline facet rendering in `TraitScoresSection.tsx` (in the expanded facet section):

```tsx
{traitFacets.map((facet) => {
  const facetPercentage = Math.round((facet.score / 20) * 100);
  return (
    <div key={facet.name} id={`facet-${facet.name}`} className="pl-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">
          {toFacetDisplayName(facet.name)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {facet.score}/20 ({facet.confidence}%)
          </span>
          {onViewEvidence && (
            <Button ...>Evidence</Button>
          )}
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="h-1.5 rounded-full opacity-70" style={{ width: `${facetPercentage}%`, backgroundColor: getFacetColor(facet.name as FacetName) }} />
      </div>
    </div>
  );
})}
```

**Add description after the score bar div:**

```tsx
{/* After the score bar div, add: */}
{FACET_DESCRIPTIONS[facet.name].levels[getFacetLevel(facet.name, facet.score)] && (
  <p data-slot="facet-description" className="text-xs text-muted-foreground leading-relaxed mt-1.5">
    {FACET_DESCRIPTIONS[facet.name].levels[getFacetLevel(facet.name, facet.score)]}
  </p>
)}
```

**Type safety:** `FacetData.name` is updated from `string` to `FacetName` in this story (AC #9). This eliminates all `as FacetName` casts in the rendering code. The cast moves to the data boundary (e.g., `toFacetData` in route files) where API data enters the component layer.

**Callers to update:** `toFacetData` in `apps/front/src/routes/public-profile.$publicProfileId.tsx` (line ~74) — change `name,` to `name: name as FacetName,`. Any other route files constructing `FacetData` objects need the same treatment.

**Styling notes:**
- `text-xs` — matches facet name size (smaller than trait descriptions which use `text-sm`)
- `text-muted-foreground` — consistent with facet metadata
- `leading-relaxed mt-1.5` — readable spacing below score bar
- `data-slot="facet-description"` — follows project data-slot convention for testing
- No new CSS variables or theme tokens needed

### Testing Standards

- **Test framework:** `vitest` (standard across the monorepo)
- **Test commands:** `pnpm --filter=domain test` or `pnpm test:run`

```typescript
// facet-descriptions.test.ts
import { describe, expect, it } from "vitest";
import { FACET_DESCRIPTIONS } from "../facet-descriptions";
import { ALL_FACETS, FACET_TO_TRAIT } from "../../constants/big-five";
import { FACET_LETTER_MAP, FACET_LEVEL_LABELS } from "../../types/facet-levels";

describe("FACET_DESCRIPTIONS", () => {
  it("should have entries for all 30 facets", () => {
    expect(Object.keys(FACET_DESCRIPTIONS)).toHaveLength(30);
    for (const facet of ALL_FACETS) {
      expect(FACET_DESCRIPTIONS[facet]).toBeDefined();
    }
  });

  it.each([...ALL_FACETS])("should have 2 level descriptions for %s keyed by two-letter codes", (facet) => {
    const [low, high] = FACET_LETTER_MAP[facet];
    for (const level of [low, high]) {
      const desc = FACET_DESCRIPTIONS[facet].levels[level];
      expect(desc).toBeDefined();
      expect(desc.length).toBeGreaterThanOrEqual(50);
      expect(desc.length).toBeLessThanOrEqual(200);
    }
  });
});

describe("FACET_LETTER_MAP", () => {
  it("should have entries for all 30 facets with 2-character codes", () => {
    for (const facet of ALL_FACETS) {
      expect(FACET_LETTER_MAP[facet]).toBeDefined();
      expect(FACET_LETTER_MAP[facet]).toHaveLength(2);
      const [low, high] = FACET_LETTER_MAP[facet];
      expect(low).toHaveLength(2);
      expect(high).toHaveLength(2);
    }
  });

  it("should have unique codes within each facet", () => {
    for (const facet of ALL_FACETS) {
      const [low, high] = FACET_LETTER_MAP[facet];
      expect(low).not.toBe(high);
    }
  });

  it("should use correct OCEAN trait prefix for each facet", () => {
    const TRAIT_PREFIX: Record<string, string> = {
      openness: "O", conscientiousness: "C", extraversion: "E",
      agreeableness: "A", neuroticism: "N"
    };
    for (const facet of ALL_FACETS) {
      const [low, high] = FACET_LETTER_MAP[facet];
      const trait = FACET_TO_TRAIT[facet];
      const prefix = TRAIT_PREFIX[trait];
      expect(low[0]).toBe(prefix);
      expect(high[0]).toBe(prefix);
    }
  });

  it("should have globally unique codes across all facets", () => {
    const allCodes = new Set<string>();
    for (const facet of ALL_FACETS) {
      const [low, high] = FACET_LETTER_MAP[facet];
      expect(allCodes.has(low)).toBe(false);
      expect(allCodes.has(high)).toBe(false);
      allCodes.add(low);
      allCodes.add(high);
    }
    expect(allCodes.size).toBe(60);
  });
});

describe("FACET_LEVEL_LABELS", () => {
  it("should have a label for every code in FACET_LETTER_MAP", () => {
    for (const facet of ALL_FACETS) {
      const [low, high] = FACET_LETTER_MAP[facet];
      expect(FACET_LEVEL_LABELS[low]).toBeDefined();
      expect(FACET_LEVEL_LABELS[high]).toBeDefined();
      expect(FACET_LEVEL_LABELS[low].length).toBeGreaterThan(2);
      expect(FACET_LEVEL_LABELS[high].length).toBeGreaterThan(2);
    }
  });

  it("should have no duplicate codes", () => {
    const allCodes = new Set<string>();
    for (const facet of ALL_FACETS) {
      const [low, high] = FACET_LETTER_MAP[facet];
      allCodes.add(low);
      allCodes.add(high);
    }
    expect(allCodes.size).toBe(60);
  });
});

// facet-level.test.ts
import { describe, expect, it } from "vitest";
import { getFacetLevel } from "../facet-level";
import { FACET_LETTER_MAP } from "../../types/facet-levels";

describe("getFacetLevel", () => {
  it("should return low code for scores 0-10", () => {
    const [low] = FACET_LETTER_MAP.imagination;
    expect(getFacetLevel("imagination", 0)).toBe(low);
    expect(getFacetLevel("imagination", 5)).toBe(low);
    expect(getFacetLevel("imagination", 10)).toBe(low);
  });

  it("should return high code for scores 11-20", () => {
    const [, high] = FACET_LETTER_MAP.imagination;
    expect(getFacetLevel("imagination", 11)).toBe(high);
    expect(getFacetLevel("imagination", 15)).toBe(high);
    expect(getFacetLevel("imagination", 20)).toBe(high);
  });

  it("should handle float scores at boundary", () => {
    const [low, high] = FACET_LETTER_MAP.orderliness;
    expect(getFacetLevel("orderliness", 10.0)).toBe(low);
    expect(getFacetLevel("orderliness", 10.5)).toBe(high);
  });

  it("should return correct facet-specific codes for different facets", () => {
    const [iLow] = FACET_LETTER_MAP.imagination;
    const [oLow] = FACET_LETTER_MAP.orderliness;
    expect(getFacetLevel("imagination", 5)).toBe(iLow);
    expect(getFacetLevel("orderliness", 5)).toBe(oLow);
    // Verify they have different OCEAN prefixes
    expect(iLow[0]).toBe("O");  // Openness
    expect(oLow[0]).toBe("C");  // Conscientiousness
  });
});
```

### Previous Story Intelligence (Story 8.1 + 8.2)

**Learnings from Story 8.1:**
- Character-length constraints proved more reliable than sentence-count assertions for testing
- All 817 tests pass across the monorepo — this is the baseline
- Second-person voice with varied, non-repetitive prose patterns works well for engagement
- The Story 8.1 commit is `7ca8581` on `master`

**Key pattern from Story 8.2 spec (not yet implemented):**
- Story 8.2 uses trait-specific single-letter keys (`"P"` | `"G"` | `"O"` for Openness)
- Story 8.3 uses two-letter codes (OCEAN prefix + facet letter) — extended pattern for global uniqueness
- Story 8.2 descriptions are 4-5 sentences; Story 8.3 descriptions are 50-200 chars (punchy, 1-2 sentences)

**Files modified by Story 8.1 (do NOT re-modify):**
- `packages/domain/src/constants/archetypes.ts`
- `packages/domain/src/utils/archetype-lookup.ts`
- `packages/domain/src/types/archetype.ts`
- `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`

### Git Intelligence

Recent commits:
- `7ca8581` feat(story-8-1): expand archetype descriptions to 1500-2500 characters
- `20089f2` feat(story-1-4): Effect API auth middleware with CurrentUser context (#51)
- `5383a36` refactor: agent graph
- `cdca239` chore: update
- `6d8ba66` feat(story-7-14): component visual consistency and final polish (#50)

**Patterns:**
- Branch naming: `feat/story-8-3-facet-descriptions`
- Commit format: `feat(story-8-3): add level-specific facet descriptions`
- PR-based workflow with squash merges

### Project Structure Notes

- New type file follows existing pattern: `packages/domain/src/types/facet-levels.ts` alongside `archetype.ts`
- New constant file follows existing pattern: `packages/domain/src/constants/facet-descriptions.ts` alongside `big-five.ts`, `archetypes.ts`
- New utility follows existing pattern: `packages/domain/src/utils/facet-level.ts` alongside `ocean-code-generator.ts`
- Export pattern: add to `packages/domain/src/index.ts`
- Frontend imports: `import { FACET_DESCRIPTIONS, getFacetLevel, FACET_LEVEL_LABELS } from "@workspace/domain"`
- FacetName type already exported from domain package: `import type { FacetName } from "@workspace/domain"`

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.3]
- [Source: packages/domain/src/constants/big-five.ts — FacetName type, ALL_FACETS, FACET_TO_TRAIT]
- [Source: packages/domain/src/types/archetype.ts — TRAIT_LETTER_MAP, TRAIT_LEVEL_LABELS (pattern reference)]
- [Source: packages/domain/src/utils/ocean-code-generator.ts — score-to-letter thresholds]
- [Source: apps/front/src/components/results/TraitScoresSection.tsx — inline facet rendering]
- [Source: apps/front/src/components/results/FacetBreakdown.tsx — separate facet component (NOT used by TraitScoresSection)]
- [Source: _bmad-output/implementation-artifacts/8-2-add-level-specific-trait-descriptions.md — previous story spec]
- [Source: _bmad-output/implementation-artifacts/8-1-expand-archetype-descriptions-to-4-5-sentences.md — story 8.1 patterns]
- [Source: docs/FRONTEND.md — styling patterns, data-slot conventions]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture, domain package patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
