# Story 8.2: Add Level-Specific Trait Descriptions

Status: review

## Story

As a **User viewing my trait scores**,
I want **to read what my specific trait level means in everyday terms**,
So that **I understand what being an "Introvert" or "Disciplined" means for me without needing a psychology textbook**.

## Acceptance Criteria

1. **Given** I view the trait summary section **When** each trait renders **Then** I see: trait name with a one-line tagline (e.g., "Extraversion — how you engage with the world"), score bar (existing), and a level-specific description (4-5 sentences) keyed by my trait-specific level letter (e.g., "I" for Introvert, "O" for Open-minded) **And** the description uses second-person ("you tend to...") for personal feel **And** no generic "what is this trait" educational text is shown

2. **Given** I am scored as "Introvert" (Low Extraversion) **When** the Extraversion section renders **Then** I read a warm, behavioral description specific to the Introvert level (e.g., "As an introvert, you direct your energy inward...")

3. **Given** all 3 levels exist for all 5 traits **When** any user views results **Then** 15 total descriptions exist (5 traits x 3 levels, keyed by trait-specific letters: P/G/O, F/B/D, I/A/E, C/N/W, R/T/S) **And** all descriptions are 1-2 sentences (50-200 characters)

4. **Given** the new `TRAIT_DESCRIPTIONS` constant is created **When** the domain package is built **Then** it is properly exported from `packages/domain/src/index.ts` **And** can be imported as `import { TRAIT_DESCRIPTIONS } from "@workspace/domain"`

5. **Given** the results page renders trait descriptions **When** viewed on mobile and desktop **Then** descriptions wrap cleanly within the existing trait card layout

6. **Given** the domain package tests run **When** all trait description tests execute **Then** all 5 traits have taglines under 80 characters **And** all 15 level descriptions exist keyed by their trait-specific letters **And** no regressions in existing tests (`pnpm test:run`)

## Tasks / Subtasks

- [x] Task 1: Create `trait-descriptions.ts` constant file (AC: #3, #4)
  - [x] 1.1 Create `packages/domain/src/constants/trait-descriptions.ts` with `TRAIT_DESCRIPTIONS` export
  - [x] 1.2 Define a `TraitLevelMap` mapped type and `TraitDescriptionsType` using [TypeScript mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) for strict per-trait key enforcement:
    ```typescript
    type TraitLevelMap = {
      openness: OpennessLevel;
      conscientiousness: ConscientiousnessLevel;
      extraversion: ExtraversionLevel;
      agreeableness: AgreeablenessLevel;
      neuroticism: NeuroticismLevel;
    };
    type TraitDescriptionsType = {
      [K in TraitName]: {
        tagline: string;
        levels: Record<TraitLevelMap[K], string>;
      };
    };
    export const TRAIT_DESCRIPTIONS: TraitDescriptionsType = { ... };
    ```
    This ensures each trait's `levels` only accepts its own letter keys at the definition site (e.g., openness → `"P"|"G"|"O"` only)
  - [x] 1.3 Write 5 taglines (one per trait, <10 words each)
  - [x] 1.4 Write 15 level descriptions (5 traits x 3 levels, 4-5 sentences each)
  - [x] 1.5 Follow content tone guidelines: second-person, warm, behavioral, non-judgmental
  - [x] 1.6 Export from `packages/domain/src/index.ts`

- [x] Task 2: Update TraitScoresSection component (AC: #1, #2, #5)
  - [x] 2.1 Import `TRAIT_DESCRIPTIONS` and `TraitLevel` from `@workspace/domain`
  - [x] 2.2 Tighten `TraitData.level` type from `string` to `TraitLevel` for type-safe lookup (single source of truth)
  - [x] 2.3 Add tagline below trait name label (muted text, smaller font)
  - [x] 2.4 Add level-specific description below the score bar — lookup uses a narrow cast since TypeScript can't correlate a runtime `TraitName` with its mapped level type in a loop: `(TRAIT_DESCRIPTIONS[traitName] as { tagline: string; levels: Record<TraitLevel, string> }).levels[traitData.level]` (or extract a small `getTraitLevelDescription(trait, level)` helper to encapsulate the cast)
  - [x] 2.5 Description and tagline should only render inside the **expanded** state of the trait card (collapsed = score bar only, expanded = score bar + tagline + description)
  - [x] 2.6 Style: `text-sm text-muted-foreground leading-relaxed mt-3`
  - [x] 2.7 Ensure responsive — text wraps cleanly on mobile within existing card layout
  - [x] 2.8 Fix `public-profile.$publicProfileId.tsx` line ~101: cast `deriveTraitData()` level assignment to `TraitLevel` — `level: (traitSummary[trait] ?? TRAIT_LETTER_MAP[trait][1]) as TraitLevel`

- [x] Task 3: Write tests (AC: #3, #6)
  - [x] 3.1 Create `packages/domain/src/__tests__/trait-descriptions.test.ts`
  - [x] 3.2 Test all 5 traits have taglines (<80 chars each)
  - [x] 3.3 Test all 15 level descriptions exist keyed by trait-specific letters (P/G/O, F/B/D, I/A/E, C/N/W, R/T/S)
  - [x] 3.4 Test description character-length constraints (50-200 chars per description)
  - [x] 3.5 Run `pnpm test:run` — verify no regressions; run `pnpm build` to verify TypeScript compilation passes across the monorepo (especially the `TraitData.level` type change)

## Dev Notes

### Key Architecture Constraints

- **Pure domain change + frontend rendering** — no API changes, no schema changes, no DB changes, no handler changes
- **ADR-5 compliance** — trait descriptions are in-memory constants, NOT in the database
- **Static content** — descriptions are derived at read-time from the trait level letter; no API call needed
- **Deterministic output** — same trait + level always renders the same description

### NAMING COLLISION WARNING (from Story 8.1)

The `archetype-lookup.ts` file contains a **private** `TRAIT_DESCRIPTIONS` constant (line ~90) that is an implementation detail of the fallback archetype generator. It uses a completely different structure (`Record<TraitKey, Record<string, { opener, depth, social, drive }>>`) for building archetype descriptions.

**Your new `TRAIT_DESCRIPTIONS` in `packages/domain/src/constants/trait-descriptions.ts` is a SEPARATE concept:**
- Different structure: per-trait `Record<TraitLevelLetter, string>` using the existing level types (`OpennessLevel`, `ConscientiousnessLevel`, etc.)
- Different purpose: level-specific descriptions for the results page
- Different scope: exported public constant vs private implementation detail
- No collision risk because the old one is unexported and scoped to `archetype-lookup.ts`

### Direct Level Letter Lookup (No L/M/H Mapping Needed)

The API returns trait-specific level letters directly (e.g., `"O"` for Open-minded, `"I"` for Introvert). The `TRAIT_DESCRIPTIONS` constant uses these same letters as keys — **no translation layer required**:

```typescript
// Direct lookup — the API level letter IS the key:
TRAIT_DESCRIPTIONS.openness.levels["O"]           // Open-minded description
TRAIT_DESCRIPTIONS.openness.levels["G"]           // Grounded description
TRAIT_DESCRIPTIONS.openness.levels["P"]           // Practical description
TRAIT_DESCRIPTIONS.extraversion.levels["I"]       // Introvert description
TRAIT_DESCRIPTIONS.neuroticism.levels["S"]        // Sensitive description

// In the component:
TRAIT_DESCRIPTIONS[traitName].levels[traitData.level]  // That's it. No mapping.
```

**Level letters per trait (from `archetype.ts` types):**
- Openness: `"P"` (Practical) | `"G"` (Grounded) | `"O"` (Open-minded) → `OpennessLevel`
- Conscientiousness: `"F"` (Flexible) | `"B"` (Balanced) | `"D"` (Disciplined) → `ConscientiousnessLevel`
- Extraversion: `"I"` (Introvert) | `"A"` (Ambivert) | `"E"` (Extravert) → `ExtraversionLevel`
- Agreeableness: `"C"` (Candid) | `"N"` (Negotiator) | `"W"` (Warm) → `AgreeablenessLevel`
- Neuroticism: `"R"` (Resilient) | `"T"` (Temperate) | `"S"` (Sensitive) → `NeuroticismLevel`

### Type Safety: Mapped Types + Single Source of Truth

`TRAIT_DESCRIPTIONS` is the **single source of truth** for trait-level content, imported by both frontend and API from `@workspace/domain`.

**Definition-side safety (mapped type):**

The constant uses a [TypeScript mapped type](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) to enforce that each trait's `levels` record only accepts its own 3 letter keys:

```typescript
// trait-descriptions.ts
type TraitLevelMap = {
  openness: OpennessLevel;           // "P" | "G" | "O"
  conscientiousness: ConscientiousnessLevel;  // "F" | "B" | "D"
  extraversion: ExtraversionLevel;   // "I" | "A" | "E"
  agreeableness: AgreeablenessLevel; // "C" | "N" | "W"
  neuroticism: NeuroticismLevel;     // "R" | "T" | "S"
};

type TraitDescriptionsType = {
  [K in TraitName]: {
    tagline: string;
    levels: Record<TraitLevelMap[K], string>;
  };
};

export const TRAIT_DESCRIPTIONS: TraitDescriptionsType = { ... };
```

This catches errors like accidentally putting an `"I"` key inside `openness.levels` at compile time.

**Lookup-side cast (component loop):**

When iterating over traits in the component, TypeScript can't correlate a runtime `traitName: TraitName` with its specific level type (the mapped type distributes into a union). A narrow cast is needed at the lookup site:

```typescript
// Option A: inline cast
(TRAIT_DESCRIPTIONS[traitName] as { tagline: string; levels: Record<TraitLevel, string> }).levels[traitData.level]

// Option B: small helper (cleaner, encapsulates the single cast)
const desc = (trait: TraitName, level: TraitLevel) =>
  (TRAIT_DESCRIPTIONS[trait] as { tagline: string; levels: Record<TraitLevel, string> }).levels[level];
```

This is safe because the runtime data is always a correctly-correlated trait + level pair.

**`TraitData.level` tightening:**

`TraitData.level` in `TraitScoresSection.tsx` is currently typed as `string`. Tighten to `TraitLevel`:

```typescript
import type { TraitLevel } from "@workspace/domain";

export interface TraitData {
  name: string;
  score: number;
  level: TraitLevel;   // ← was: string
  confidence: number;
}
```

`TraitLevel` is already exported from `@workspace/domain` (defined in `packages/domain/src/types/archetype.ts` line 33-38) as:
```typescript
type TraitLevel = OpennessLevel | ConscientiousnessLevel | ExtraversionLevel | AgreeablenessLevel | NeuroticismLevel;
// = "P" | "G" | "O" | "F" | "B" | "D" | "I" | "A" | "E" | "C" | "N" | "W" | "R" | "T" | "S"
```

**Export checklist from domain package:**
- `TRAIT_DESCRIPTIONS` — the constant (new)
- `TraitLevelMap` — the mapped type (new, export for reuse if needed)
- `TraitLevel` — already exported (type)
- `OpennessLevel`, `ConscientiousnessLevel`, etc. — already exported (types, used in mapped type)

**Downstream impact of `TraitData.level` type change:**

`TraitData` is imported by 3 files. Two are passthrough (`ProfileView.tsx` just passes the prop). The third constructs `TraitData` objects:

```typescript
// public-profile.$publicProfileId.tsx line 101 — deriveTraitData():
level: traitSummary[trait] ?? TRAIT_LETTER_MAP[trait][1],
```

`traitSummary[trait]` returns `string` (from `Record<string, string>`) and `TRAIT_LETTER_MAP[trait][1]` returns `string` (tuple typed as `readonly [string, string, string]`). Both will fail to assign to `TraitLevel` without narrowing.

**Fix:** Cast at the construction site since runtime values are already correct trait letters:
```typescript
level: (traitSummary[trait] ?? TRAIT_LETTER_MAP[trait][1]) as TraitLevel,
```

**Note:** The contracts schema (`GetResultsResponse`) currently types `level` as `S.String`. A follow-up improvement could tighten this to `S.Literal("P","G","O","F","B","D","I","A","E","C","N","W","R","T","S")` for end-to-end schema validation, but that's optional scope for this story since the runtime values are already correct.

### Content Writing Guidelines

Per Epic 8 content authoring notes:
- **Second person:** "You tend to..." not "People with this trait..."
- **Warm and affirming:** Celebrate each level as valid, not better/worse
- **Behavioral:** Describe what users DO, not abstract psychology
- **Specific:** Use concrete examples ("you're the one organizing the group trip")
- **Non-judgmental:** Low Agreeableness is "direct and honest," not "difficult"

Level keys and naming for reference (these letters are the `TRAIT_DESCRIPTIONS` level keys):
| Trait | Letter → Name | Letter → Name | Letter → Name |
|-------|--------------|--------------|--------------|
| Openness | `"P"` → Practical | `"G"` → Grounded | `"O"` → Open-minded |
| Conscientiousness | `"F"` → Flexible | `"B"` → Balanced | `"D"` → Disciplined |
| Extraversion | `"I"` → Introvert | `"A"` → Ambivert | `"E"` → Extravert |
| Agreeableness | `"C"` → Candid | `"N"` → Negotiator | `"W"` → Warm |
| Neuroticism | `"R"` → Resilient | `"T"` → Temperate | `"S"` → Sensitive |

### Source Tree Components to Touch

| File | Change Type | Purpose |
|------|------------|---------|
| `packages/domain/src/constants/trait-descriptions.ts` | CREATE | 5 taglines + 15 level descriptions keyed by trait-specific letters |
| `packages/domain/src/index.ts` | EDIT | Export `TRAIT_DESCRIPTIONS` |
| `apps/front/src/components/results/TraitScoresSection.tsx` | EDIT | Render tagline + level description; tighten `TraitData.level` from `string` to `TraitLevel` |
| `apps/front/src/routes/public-profile.$publicProfileId.tsx` | EDIT | Fix `TraitData.level` type narrowing at construction site (line ~101) |
| `packages/domain/src/__tests__/trait-descriptions.test.ts` | CREATE | Validate 15 descriptions + taglines |

### Files NOT to Touch

- `packages/domain/src/utils/archetype-lookup.ts` — Contains private `TRAIT_DESCRIPTIONS` (different concept). Do NOT rename, export, or modify.
- `packages/domain/src/constants/archetypes.ts` — Archetype descriptions (Story 8.1). Unrelated.
- `packages/contracts/` — No API contract changes needed (descriptions are client-side constants, not API data).
- `apps/api/` — No handler or use-case changes.
- `packages/infrastructure/` — No repository changes.

### Frontend Rendering Pattern

Current `TraitScoresSection.tsx` structure (relevant excerpt):

```tsx
// Line 93-121: Current trait card header
<div className="flex items-center justify-between mb-2">
  <div className="flex items-center gap-2">
    <ShapeComponent size={20} color={traitColor} />
    <span className="text-sm font-medium text-foreground">{TRAIT_LABELS[traitName]}</span>
    {/* chevron icon */}
  </div>
  <span className="text-sm font-semibold text-foreground">{percentage}%</span>
</div>
<div className="w-full bg-muted rounded-full h-2.5">
  {/* score bar */}
</div>
```

**Add tagline and description inside the expanded region:**

The trait card has a collapsed/expanded state (chevron toggle). Tagline and description should **only render when expanded** — collapsed state shows score bar only.

```tsx
// Inside the expanded region (after the score bar):

// ↓ NEW: Tagline as subtitle
<span className="text-xs text-muted-foreground">
  {TRAIT_DESCRIPTIONS[traitName].tagline}
</span>

// ↓ NEW: Level description — uses cast helper for mapped type lookup
<p data-slot="trait-description" className="text-sm text-muted-foreground leading-relaxed mt-3">
  {(TRAIT_DESCRIPTIONS[traitName] as { tagline: string; levels: Record<TraitLevel, string> }).levels[traitData.level]}
</p>
```

**Styling notes:**
- Tagline: `text-xs text-muted-foreground` — subtle, doesn't compete with trait name
- Description: `text-sm text-muted-foreground leading-relaxed mt-3` — readable paragraph below score bar
- Both tagline and description render **only in expanded state** — keeps collapsed view compact on mobile
- No new CSS variables or theme tokens needed — uses existing semantic colors
- `data-slot="trait-description"` on the description paragraph for testing

### Testing Standards

- **Test framework:** `vitest` (standard across the monorepo)
- **Test location:** `packages/domain/src/__tests__/trait-descriptions.test.ts`
- **Test commands:** `pnpm --filter=domain test` or `pnpm test:run`
- **Test patterns from Story 8.1:** Use `.length` assertions for description content, iterate all entries

```typescript
import { describe, expect, it } from "vitest";
import { TRAIT_DESCRIPTIONS } from "../constants/trait-descriptions";
import { TRAIT_LETTER_MAP } from "../types/archetype";
import type { TraitName } from "../constants/big-five";

describe("TRAIT_DESCRIPTIONS", () => {
  const TRAITS: TraitName[] = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];

  it("should have entries for all 5 traits", () => {
    for (const trait of TRAITS) {
      expect(TRAIT_DESCRIPTIONS[trait]).toBeDefined();
    }
  });

  it("should have taglines under 80 characters", () => {
    for (const trait of TRAITS) {
      expect(TRAIT_DESCRIPTIONS[trait].tagline.length).toBeLessThan(80);
      expect(TRAIT_DESCRIPTIONS[trait].tagline.length).toBeGreaterThan(10);
    }
  });

  it.each(TRAITS)("should have 3 level descriptions for %s keyed by trait-specific letters", (trait) => {
    const [low, mid, high] = TRAIT_LETTER_MAP[trait];
    for (const level of [low, mid, high]) {
      const desc = TRAIT_DESCRIPTIONS[trait].levels[level];
      expect(desc).toBeDefined();
      expect(desc.length).toBeGreaterThan(200); // 4-5 sentences
      expect(desc.length).toBeLessThan(800);
    }
  });
});
```

### Previous Story Intelligence (Story 8.1)

**Learnings from Story 8.1:**
- Character-length constraints (1500-2500) proved more reliable than sentence-count assertions for testing — consider similar approach
- The `TRAIT_DESCRIPTIONS` private constant in `archetype-lookup.ts` was restructured to `{ opener, depth, social, drive }` format — do NOT conflict
- Story 8.1 confirmed all 817 tests pass across the monorepo — this is the baseline
- Second-person voice with varied, non-repetitive prose patterns works well for engagement
- The Story 8.1 commit is `5c05879` on `master` — this is the latest baseline

**Files modified by Story 8.1 (do NOT re-modify):**
- `packages/domain/src/constants/archetypes.ts`
- `packages/domain/src/utils/archetype-lookup.ts`
- `packages/domain/src/types/archetype.ts`
- `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`

### Git Intelligence

Recent commits:
- `5c05879` feat(story-8-1): expand archetype descriptions to 1500-2500 characters
- `20089f2` feat(story-1-4): Effect API auth middleware with CurrentUser context (#51)
- `5383a36` refactor: agent graph
- `cdca239` chore: update
- `6d8ba66` feat(story-7-14): component visual consistency and final polish (#50)

**Patterns:**
- Branch naming: `feat/story-{epic}-{story}-{slug}` (e.g., `feat/story-8-2-trait-descriptions`)
- Commit format: `feat(story-8-2): add level-specific trait descriptions`
- PR-based workflow with squash merges

### Project Structure Notes

- New constant file follows existing pattern: `packages/domain/src/constants/trait-descriptions.ts` alongside `big-five.ts`, `archetypes.ts`, `nerin-greeting.ts`
- Export pattern: add to `packages/domain/src/index.ts` with comment `// Trait descriptions (Story 8.2)`
- No utility function needed — direct lookup via trait-specific level letters
- Frontend import: `import { TRAIT_DESCRIPTIONS } from "@workspace/domain"`
- Level types imported from `archetype.ts`: `OpennessLevel`, `ConscientiousnessLevel`, `ExtraversionLevel`, `AgreeablenessLevel`, `NeuroticismLevel`

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.2]
- [Source: packages/domain/src/constants/big-five.ts — TraitName type, ALL_FACETS]
- [Source: packages/domain/src/types/archetype.ts — TRAIT_LETTER_MAP, TRAIT_LEVEL_LABELS]
- [Source: packages/domain/src/utils/ocean-code-generator.ts — score-to-letter thresholds]
- [Source: apps/front/src/components/results/TraitScoresSection.tsx — trait rendering]
- [Source: _bmad-output/implementation-artifacts/8-1-expand-archetype-descriptions-to-4-5-sentences.md — previous story]
- [Source: docs/FRONTEND.md — styling patterns, data-slot conventions]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture, domain package patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

None — clean implementation, no blockers encountered.

### Completion Notes List

- Created `TRAIT_DESCRIPTIONS` constant with TypeScript mapped types (`TraitLevelMap`, `TraitDescriptionsType`) enforcing per-trait level keys at compile time
- `TraitLevelMap` is unexported (internal to `trait-descriptions.ts`); `TRAIT_DESCRIPTIONS` uses `as const satisfies`; derived `TraitDescriptions` type exported
- Wrote 5 taglines (all under 80 chars) and 15 level descriptions (all 50-200 chars, 1-2 sentences each) in second-person, warm, behavioral, non-judgmental tone
- Exported `TRAIT_DESCRIPTIONS` and `TraitDescriptions` from `@workspace/domain`
- Updated `TraitScoresSection.tsx`: imported `TRAIT_DESCRIPTIONS`, `TraitLevel`, and `TRAIT_NAMES`; tightened `TraitData.level` from `string` to `TraitLevel`; added tagline + level description rendering in expanded state only with `data-slot="trait-description"`; replaced local `TRAIT_ORDER` array with `TRAIT_NAMES` import
- Fixed type narrowing in `public-profile.$publicProfileId.tsx` with `as TraitLevel` cast at `deriveTraitData()` construction site
- Fixed type narrowing in `results/$assessmentSessionId.tsx` with `as TraitData[]` cast when passing `results.traits` to `ProfileView` (downstream impact of `TraitData.level` tightening since `GetResultsResponse` schema types level as `S.String`)
- Created 8 tests validating: all 5 traits present, taglines under 80 chars, all 15 level descriptions keyed by trait-specific letters, character-length constraints (50-200), and total count of 15 descriptions
- Refactored: Added `TRAIT_NAMES` as const array in `big-five.ts` as single source of truth; derived `TraitName` type from it; aliased `BIG_FIVE_TRAITS` and `BigFiveTrait` in `trait.ts` for backwards compatibility; replaced local `ALL_TRAITS` in `confidence.ts` with `TRAIT_NAMES` import
- Full test suite: domain 514, front 145, api 166 — all passing, zero regressions
- Build passes across monorepo, lint passes (5 pre-existing warnings in API)

### Change Log

- 2026-02-16: Implemented Story 8.2 — added level-specific trait descriptions with mapped type safety, frontend rendering in expanded trait cards, and comprehensive tests
- 2026-02-16: Revised description length constraint from 200-800 to 50-200 chars; rewrote all 15 descriptions to 1-2 concise sentences with varied openings

### File List

- `packages/domain/src/constants/trait-descriptions.ts` — CREATE — 5 taglines + 15 level descriptions with mapped types
- `packages/domain/src/constants/big-five.ts` — EDIT — Added `TRAIT_NAMES` as const array, derived `TraitName` type from it, updated `isTraitName` to use `TRAIT_NAMES`
- `packages/domain/src/types/trait.ts` — EDIT — Aliased `BigFiveTrait` → `TraitName` and `BIG_FIVE_TRAITS` → `TRAIT_NAMES` (backwards compat, deprecated)
- `packages/domain/src/types/facet.ts` — EDIT — Changed import from `BigFiveTrait` to `TraitName` from `constants/big-five`
- `packages/domain/src/utils/confidence.ts` — EDIT — Replaced local `ALL_TRAITS` array with `TRAIT_NAMES` import
- `packages/domain/src/index.ts` — EDIT — Export `TRAIT_DESCRIPTIONS`, `TraitDescriptions`, and `TRAIT_NAMES`
- `packages/domain/src/__tests__/trait-descriptions.test.ts` — CREATE — 8 tests for trait descriptions
- `apps/front/src/components/results/TraitScoresSection.tsx` — EDIT — Import TRAIT_DESCRIPTIONS/TraitLevel/TRAIT_NAMES, tighten TraitData.level, render tagline + description, replace local TRAIT_ORDER with TRAIT_NAMES
- `apps/front/src/routes/public-profile.$publicProfileId.tsx` — EDIT — Import TraitLevel, cast level assignment in deriveTraitData()
- `apps/front/src/routes/results/$assessmentSessionId.tsx` — EDIT — Import TraitData, cast results.traits for type compatibility
