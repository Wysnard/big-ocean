# Story 8.2: Add Level-Specific Trait Descriptions

Status: ready-for-dev

## Story

As a **User viewing my trait scores**,
I want **to read what my specific trait level means in everyday terms**,
So that **I understand what being an "Introvert" or "Disciplined" means for me without needing a psychology textbook**.

## Acceptance Criteria

1. **Given** I view the trait summary section **When** each trait renders **Then** I see: trait name with a one-line tagline (e.g., "Extraversion - how you engage with the world"), score bar (existing), and a level-specific description (4-5 sentences) matching my level (Low/Mid/High) **And** the description uses second-person ("you tend to...") for personal feel **And** no generic "what is this trait" educational text is shown

2. **Given** I am scored as "Introvert" (Low Extraversion) **When** the Extraversion section renders **Then** I read a warm, behavioral description specific to the Introvert level (e.g., "As an introvert, you direct your energy inward...")

3. **Given** all 3 levels exist for all 5 traits **When** any user views results **Then** 15 total descriptions exist (5 traits x 3 levels) **And** all descriptions are 4-5 sentences

4. **Given** the new `TRAIT_DESCRIPTIONS` constant is created **When** the domain package is built **Then** it is properly exported from `packages/domain/src/index.ts` **And** can be imported as `import { TRAIT_DESCRIPTIONS } from "@workspace/domain"`

5. **Given** the results page renders trait descriptions **When** viewed on mobile and desktop **Then** descriptions wrap cleanly within the existing trait card layout

## Tasks / Subtasks

- [ ] Task 1: Create `trait-descriptions.ts` constant file (AC: #3, #4)
  - [ ] 1.1 Create `packages/domain/src/constants/trait-descriptions.ts` with `TRAIT_DESCRIPTIONS` export
  - [ ] 1.2 Structure: `Record<TraitName, { tagline: string; levels: Record<"L" | "M" | "H", string> }>`
  - [ ] 1.3 Write 5 taglines (one per trait, <10 words each)
  - [ ] 1.4 Write 15 level descriptions (5 traits x 3 levels, 4-5 sentences each)
  - [ ] 1.5 Follow content tone guidelines: second-person, warm, behavioral, non-judgmental
  - [ ] 1.6 Export from `packages/domain/src/index.ts`

- [ ] Task 2: Create level-mapping utility (AC: #1, #2)
  - [ ] 2.1 Add `getTraitLevelKey(level: string): "L" | "M" | "H"` helper function
  - [ ] 2.2 Mapping: use `TRAIT_LETTER_MAP` — index 0 = "L", index 1 = "M", index 2 = "H"
  - [ ] 2.3 Export from `packages/domain/src/utils/index.ts` and `packages/domain/src/index.ts`

- [ ] Task 3: Update TraitScoresSection component (AC: #1, #2, #5)
  - [ ] 3.1 Import `TRAIT_DESCRIPTIONS` and `getTraitLevelKey` from `@workspace/domain`
  - [ ] 3.2 Add tagline below trait name label (muted text, smaller font)
  - [ ] 3.3 Add level-specific description below the score bar (inside the trait card)
  - [ ] 3.4 Style: `text-sm text-muted-foreground leading-relaxed mt-3`
  - [ ] 3.5 Ensure responsive — text wraps cleanly on mobile within existing card layout

- [ ] Task 4: Write tests (AC: #3, #4)
  - [ ] 4.1 Create `packages/domain/src/constants/__tests__/trait-descriptions.test.ts`
  - [ ] 4.2 Test all 5 traits have taglines (<80 chars each)
  - [ ] 4.3 Test all 15 level descriptions exist and are 4-5 sentences
  - [ ] 4.4 Test `getTraitLevelKey` maps all 15 trait letters correctly
  - [ ] 4.5 Run `pnpm test:run` — verify no regressions

## Dev Notes

### Key Architecture Constraints

- **Pure domain change + frontend rendering** — no API changes, no schema changes, no DB changes, no handler changes
- **ADR-5 compliance** — trait descriptions are in-memory constants, NOT in the database
- **Static content** — descriptions are derived at read-time from the trait level letter; no API call needed
- **Deterministic output** — same trait + level always renders the same description

### NAMING COLLISION WARNING (from Story 8.1)

The `archetype-lookup.ts` file contains a **private** `TRAIT_DESCRIPTIONS` constant (line ~90) that is an implementation detail of the fallback archetype generator. It uses a completely different structure (`Record<TraitKey, Record<string, { opener, depth, social, drive }>>`) for building archetype descriptions.

**Your new `TRAIT_DESCRIPTIONS` in `packages/domain/src/constants/trait-descriptions.ts` is a SEPARATE concept:**
- Different structure: `Record<TraitName, { tagline: string; levels: Record<"L" | "M" | "H", string> }>`
- Different purpose: level-specific descriptions for the results page
- Different scope: exported public constant vs private implementation detail
- No collision risk because the old one is unexported and scoped to `archetype-lookup.ts`

### Trait Level Letter → L/M/H Mapping

The API returns trait-specific level letters (e.g., "O", "G", "P" for Openness). To look up descriptions, map these back to generic L/M/H:

```typescript
// TRAIT_LETTER_MAP[trait] = [Low, Mid, High]
// openness: ["P", "G", "O"] → P="L", G="M", O="H"
// conscientiousness: ["F", "B", "D"] → F="L", B="M", D="H"
// extraversion: ["I", "A", "E"] → I="L", A="M", E="H"
// agreeableness: ["C", "N", "W"] → C="L", N="M", W="H"
// neuroticism: ["R", "T", "S"] → R="L", T="M", S="H"

function getTraitLevelKey(traitName: TraitName, level: string): "L" | "M" | "H" {
  const [low, mid, high] = TRAIT_LETTER_MAP[traitName];
  if (level === low) return "L";
  if (level === mid) return "M";
  if (level === high) return "H";
  return "M"; // safe fallback
}
```

**Note:** This requires BOTH `traitName` and `level` to correctly resolve (since "B" means Balanced/Mid for Conscientiousness but would be ambiguous without trait context).

### Content Writing Guidelines

Per Epic 8 content authoring notes:
- **Second person:** "You tend to..." not "People with this trait..."
- **Warm and affirming:** Celebrate each level as valid, not better/worse
- **Behavioral:** Describe what users DO, not abstract psychology
- **Specific:** Use concrete examples ("you're the one organizing the group trip")
- **Non-judgmental:** Low Agreeableness is "direct and honest," not "difficult"

Level naming for reference:
| Trait | Low | Mid | High |
|-------|-----|-----|------|
| Openness | Practical | Grounded | Open-minded |
| Conscientiousness | Flexible | Balanced | Disciplined |
| Extraversion | Introvert | Ambivert | Extravert |
| Agreeableness | Candid | Negotiator | Warm |
| Neuroticism | Resilient | Temperate | Sensitive |

### Source Tree Components to Touch

| File | Change Type | Purpose |
|------|------------|---------|
| `packages/domain/src/constants/trait-descriptions.ts` | CREATE | 5 taglines + 15 level descriptions |
| `packages/domain/src/utils/trait-level.ts` | CREATE | `getTraitLevelKey()` utility function |
| `packages/domain/src/utils/index.ts` | EDIT | Export `getTraitLevelKey` |
| `packages/domain/src/index.ts` | EDIT | Export `TRAIT_DESCRIPTIONS` and `getTraitLevelKey` |
| `apps/front/src/components/results/TraitScoresSection.tsx` | EDIT | Render tagline + level description |
| `packages/domain/src/constants/__tests__/trait-descriptions.test.ts` | CREATE | Validate 15 descriptions + taglines |

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

**Add tagline and description like this:**

```tsx
// After trait name label, add tagline:
<span className="text-sm font-medium text-foreground">{TRAIT_LABELS[traitName]}</span>
// ↓ NEW: Add tagline as subtitle
<span className="text-xs text-muted-foreground hidden sm:inline ml-1">
  — {TRAIT_DESCRIPTIONS[traitName].tagline}
</span>

// After the score bar div (line ~121), add level description:
<p className="text-sm text-muted-foreground leading-relaxed mt-3">
  {TRAIT_DESCRIPTIONS[traitName].levels[getTraitLevelKey(traitName, traitData.level)]}
</p>
```

**Styling notes:**
- Tagline: `text-xs text-muted-foreground` — subtle, doesn't compete with trait name
- Hide tagline on very small screens (`hidden sm:inline`) if it causes wrapping
- Description: `text-sm text-muted-foreground leading-relaxed mt-3` — readable paragraph below score bar
- No new CSS variables or theme tokens needed — uses existing semantic colors
- `data-slot="trait-description"` on the description paragraph for testing

### Testing Standards

- **Test framework:** `vitest` (standard across the monorepo)
- **Test location:** `packages/domain/src/constants/__tests__/trait-descriptions.test.ts`
- **Test commands:** `pnpm --filter=domain test` or `pnpm test:run`
- **Test patterns from Story 8.1:** Use `.length` assertions for description content, iterate all entries

```typescript
import { describe, expect, it } from "vitest";
import { TRAIT_DESCRIPTIONS } from "../trait-descriptions";

describe("TRAIT_DESCRIPTIONS", () => {
  const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  const LEVELS = ["L", "M", "H"] as const;

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

  it.each(TRAITS)("should have 3 level descriptions for %s", (trait) => {
    for (const level of LEVELS) {
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
- Utility function in `packages/domain/src/utils/` follows existing export-through-index pattern
- Frontend import: `import { TRAIT_DESCRIPTIONS, getTraitLevelKey } from "@workspace/domain"`

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
