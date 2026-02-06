# Story 3.2: Create and Manage Archetype Lookup Table (4-Letter Naming, TDD)

Status: done

**Story ID:** 3.2
**Created:** 2026-02-06
**Epic:** 3 - OCEAN Archetype System
**Epic Status:** in-progress

---

## Story

As a **User**,
I want **to see my personality described with a memorable name like "Thoughtful Collaborator"**,
So that **the archetype feels personal and shareable**.

---

## Acceptance Criteria

### TEST-FIRST (Red Phase)

**Given** tests are written for archetype lookup
**When** I run `pnpm test archetype-lookup.test.ts`
**Then** tests fail (red) because lookup implementation doesn't exist
**And** each test defines expected behavior:
  - Test: 4-letter code lookup returns correct archetype name
  - Test: Hand-curated names exist for all 25-30 common combinations
  - Test: Component-based fallback generates valid names for all 81 combinations
  - Test: Description text is generated correctly for each combination
  - Test: Color assignments are consistent

### IMPLEMENTATION (Green Phase)

**Given** full 5-letter OCEAN code is "HMLHM" (all 5 traits)
**When** the archetype lookup is performed for POC
**Then** archetype naming uses first 4 letters: "HMLH" (O, C, E, A only)
**And** archetype name is returned: "Thoughtful Collaborator"
**And** 2-3 sentence description explains the 4-trait combination
**And** lookup tests pass (green)

**Given** an uncommon 4-letter code combination (e.g., "LLLL")
**When** lookup is performed
**Then** if hand-curated name exists, return it
**And** if no hand-curated name, generate component-based name (e.g., "Reserved Pragmatist")
**And** fallback generation tests pass

### REFACTOR & INTEGRATION

**Given** the archetype lookup is complete
**When** the `get-results.use-case.ts` use-case calls the lookup
**Then** the placeholder `getArchetypeName()` is replaced with the archetype repository
**And** the archetype name, description, and color are returned in results

---

## Tasks / Subtasks

### Task 1: Define Archetype Types and Constants (AC: Test-First Phase)

- [x] Create `packages/domain/src/types/archetype.ts` with:
  ```typescript
  export type TraitLevel = 'L' | 'M' | 'H'
  export type OceanCode4 = string  // 4 chars, e.g., "HMLH" (O,C,E,A)
  export type OceanCode5 = string  // 5 chars, e.g., "HMLHM" (full OCEAN)

  export interface Archetype {
    readonly code4: OceanCode4       // 4-letter lookup key
    readonly name: string            // e.g., "Thoughtful Collaborator"
    readonly description: string     // 2-3 sentences
    readonly color: string           // Hex color, e.g., "#4A90D9"
    readonly isCurated: boolean      // true if hand-curated, false if generated
  }
  ```
- [x] Export types from `packages/domain/src/types/index.ts` and `packages/domain/src/index.ts`

### Task 2: Create Pure Archetype Lookup Function — Tests First (AC: Red Phase)

- [x] Create test file `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`
- [x] Write failing tests (red):
  - Test: Hand-curated lookup returns correct name for known code
  - Test: Fallback generates valid name for uncurated code
  - Test: All 81 4-letter combinations return an archetype (no `undefined`)
  - Test: Description is non-empty string for all 81 combinations
  - Test: Color is valid hex for all 81 combinations
  - Test: `isCurated` is `true` for hand-curated entries, `false` for generated
  - Test: Lookup is deterministic (same code → same result)
  - Test: Code validation rejects invalid inputs (wrong length, invalid chars)
- [x] Create `packages/domain/src/utils/archetype-lookup.ts` with function signature:
  ```typescript
  export const lookupArchetype = (code4: string): Archetype
  ```

### Task 3: Hand-Curated Archetype Data (AC: Implementation Phase)

- [x] Create `packages/domain/src/constants/archetypes.ts` with:
  - 25-30 hand-curated archetype entries for common 4-letter combinations
  - Each entry: `{ code4, name, description, color }`
  - Curated entries stored as `Record<string, Omit<Archetype, 'code4' | 'isCurated'>>`
- [x] Curated archetype examples (minimum 25):

  | Code | Name | Description Focus |
  |------|------|-------------------|
  | HHHH | The Idealist | Creative, organized, social, compassionate |
  | HHHL | The Visionary Planner | Innovative yet structured, outgoing but independent |
  | HHMH | The Creative Diplomat | Open-minded, organized, reserved, warm |
  | HHLH | The Thoughtful Collaborator | Imaginative, meticulous, quiet, cooperative |
  | HMHH | The Curious Leader | Open, pragmatic about details, energetic, kind |
  | HMMM | The Balanced Explorer | Open to experience, moderate in all else |
  | HLHH | The Free Spirit | Creative, spontaneous, social, warm |
  | MHHH | The Steady Organizer | Practical, highly disciplined, outgoing, agreeable |
  | MMHH | The Social Connector | Balanced views, moderate discipline, energetic, warm |
  | MMMM | The Centered Moderate | Balanced across all personality dimensions |
  | MMLH | The Quiet Helper | Pragmatic, relaxed, reserved, deeply caring |
  | LHHH | The Traditional Leader | Conventional, organized, outgoing, cooperative |
  | LHLH | The Dependable Supporter | Practical, disciplined, quiet, loyal |
  | LMHH | The Energetic Realist | Grounded, flexible, outgoing, friendly |
  | LLHH | The Social Pragmatist | Traditional, easygoing, energetic, warm |
  | LLLL | The Reserved Pragmatist | Practical, spontaneous, quiet, independent |
  | HLLH | The Creative Maverick | Highly imaginative, spontaneous, reserved, cooperative |
  | HLHL | The Adventurous Thinker | Open, spontaneous, social, independent-minded |
  | LHHL | The Principled Achiever | Traditional, highly disciplined, social, self-reliant |
  | LHLL | The Quiet Strategist | Conventional, systematic, reserved, autonomous |
  | MHLH | The Devoted Planner | Moderate openness, highly organized, quiet, caring |
  | HMLL | The Curious Loner | Open, moderate discipline, introverted, independent |
  | HHLL | The Systematic Innovator | Creative yet organized, reserved, self-directed |
  | LMML | The Grounded Individual | Traditional, moderate, moderate, independent |
  | HHMM | The Thoughtful Creator | Open, organized, moderately social, balanced warmth |

- [x] Tests verify all curated entries have non-empty names and descriptions

### Task 4: Component-Based Fallback Generator (AC: Fallback for All 81)

- [x] Implement `generateArchetypeName(code4: string): string` for uncurated combinations
- [x] Adjective mapping by trait level:
  ```typescript
  const TRAIT_ADJECTIVES: Record<string, Record<TraitLevel, string[]>> = {
    O: { H: ['Creative', 'Curious', 'Imaginative'], M: ['Balanced', 'Pragmatic'], L: ['Practical', 'Traditional'] },
    C: { H: ['Organized', 'Disciplined', 'Methodical'], M: ['Flexible', 'Adaptable'], L: ['Spontaneous', 'Easygoing'] },
    E: { H: ['Energetic', 'Social', 'Outgoing'], M: ['Moderate', 'Selective'], L: ['Quiet', 'Reserved', 'Reflective'] },
    A: { H: ['Caring', 'Cooperative', 'Warm'], M: ['Fair', 'Balanced'], L: ['Independent', 'Self-reliant', 'Autonomous'] },
  }
  ```
- [x] Name generation formula: Pick one adjective from primary trait + one from secondary trait
  - Primary trait = trait with most extreme level (H or L, not M)
  - If tie, use OCEAN order priority (O > C > E > A)
  - Name format: "{Adjective} {Noun}" where noun is derived from A-level
- [x] Description generation: Combine trait-level descriptions into 2-3 sentences
- [x] Color generation: Deterministic color from code using trait-level color mixing
  ```typescript
  // Base colors per trait level
  const TRAIT_COLORS = {
    O: { H: [74, 144, 226], M: [128, 128, 128], L: [200, 180, 140] },  // Blue / Gray / Tan
    C: { H: [46, 139, 87], M: [128, 128, 128], L: [210, 150, 80] },     // Green / Gray / Orange
    E: { H: [255, 165, 0], M: [128, 128, 128], L: [100, 100, 180] },    // Orange / Gray / Purple
    A: { H: [255, 105, 180], M: [128, 128, 128], L: [120, 120, 120] },  // Pink / Gray / Dark Gray
  }
  // Mix: average RGB components of 4 trait colors → hex
  ```
- [x] Write tests:
  - Test: All 81 codes produce a name (no undefined/empty)
  - Test: Generated names are 2-4 words
  - Test: Generated descriptions are 2-3 sentences (50-300 chars)
  - Test: Generated colors are valid hex (#RRGGBB)
  - Test: Deterministic (same code → same output)

### Task 5: Comprehensive Test Coverage — All 81 Combinations (AC: 100% Coverage)

- [x] Write parameterized tests for all 81 combinations (3^4):
  ```typescript
  const levels = ['L', 'M', 'H'] as const
  describe('All 81 archetype combinations', () => {
    for (const O of levels) {
      for (const C of levels) {
        for (const E of levels) {
          for (const A of levels) {
            const code4 = `${O}${C}${E}${A}`
            it(`lookupArchetype("${code4}") returns valid archetype`, () => {
              const result = lookupArchetype(code4)
              expect(result.code4).toBe(code4)
              expect(result.name).toBeTruthy()
              expect(result.description.length).toBeGreaterThan(20)
              expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
              expect(typeof result.isCurated).toBe('boolean')
            })
          }
        }
      }
    }
  })
  ```
- [x] Edge case tests:
  - Test: Invalid code lengths (3, 5, 0 chars) throw
  - Test: Invalid characters ("XXXX") throw
  - Test: Determinism verified over 100 calls
- [x] All tests pass (green)

### Task 6: Extract 4-Letter Code Utility (AC: Integration)

- [x] Create helper `extract4LetterCode(oceanCode5: string): string`:
  ```typescript
  // Takes "HHMHM" → returns "HHMH" (first 4 chars)
  export const extract4LetterCode = (oceanCode5: string): string => {
    if (oceanCode5.length !== 5) throw new Error('Expected 5-letter OCEAN code')
    return oceanCode5.slice(0, 4)
  }
  ```
- [x] Tests for extraction:
  - Test: "HHMHM" → "HHMH"
  - Test: "LLLLL" → "LLLL"
  - Test: Wrong length throws error

### Task 7: Domain Exports and Integration (AC: Type Safety)

- [x] Export from `packages/domain/src/utils/index.ts`:
  - `lookupArchetype`
  - `extract4LetterCode`
- [x] Export from `packages/domain/src/index.ts`:
  - Archetype type
  - Constants (curated archetypes data)
  - Utility functions
- [x] Verify no compilation errors in full project: `pnpm build`

### Task 8: Documentation and CLAUDE.md Update (AC: Developer Guidance)

- [x] Add JSDoc to all exported functions
- [x] Update CLAUDE.md to document:
  - Archetype lookup pattern (pure function in domain layer)
  - 4-letter vs 5-letter code distinction
  - Hand-curated vs fallback-generated archetypes
  - Phase 2 extension plan for 5-letter naming

---

## Dev Notes

### Critical Context for Developer Agent

**Purpose**: Create a pure, deterministic archetype lookup system that maps 4-letter OCEAN codes (O,C,E,A traits) to memorable personality names with descriptions and colors. For POC, only the first 4 letters are used (81 combinations); Phase 2 will extend to all 5 letters (243 combinations).

**What Already Exists (from previous stories)**:

1. **Story 3.1**: `generateOceanCode(facetScores) → string` — Pure function generating 5-letter codes
   - **NOT yet merged to master** — exists on feature branch or locally
   - Location (when merged): `packages/domain/src/utils/ocean-code-generator.ts`
   - Returns 5-letter string like "HHMHM"
   - Story 3.2 takes the first 4 characters: "HHMH"

2. **Story 2.3**: Facet/trait scoring system
   - `packages/infrastructure/src/repositories/scorer.drizzle.repository.ts` — Aggregation logic
   - Facet scores: 0-20 each, trait sums: 0-120

3. **Get Results Use-Case** (placeholder to replace):
   - `apps/api/src/use-cases/get-results.use-case.ts` — Contains placeholder `getArchetypeName()`
   - Currently uses 2-level (H/L) threshold at 0.5 — will be replaced by Story 3.1's 3-level system
   - Placeholder `archetypeMap` has 3 hardcoded entries — will be replaced by this story's lookup

4. **Big Five Constants**: `packages/domain/src/constants/big-five.ts`
   - `TraitName`: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism'
   - `FacetName`: 30 facet names (6 per trait)
   - `BIG_FIVE_TRAITS`: Array in OCEAN order

**What This Story Adds**:
- Pure utility function: `lookupArchetype(code4) → Archetype`
- Helper: `extract4LetterCode(code5) → code4`
- Constants: 25+ hand-curated archetype entries
- Fallback: Component-based name/description/color generation for all 81 codes
- Location: `packages/domain/src/utils/archetype-lookup.ts` + `packages/domain/src/constants/archetypes.ts`
- No database table — pure in-memory lookup (static data, no DB needed for POC)
- No repository interface needed — this is a pure domain function, not infrastructure
- 100% test coverage with all 81 combinations

### Design Decisions

1. **Pure Domain Function (NOT a Repository)**
   - Rationale: Archetype data is static and small (81 entries). No database needed for POC.
   - Pattern: Pure function in `packages/domain/src/utils/`, same as `generateOceanCode()`
   - The epics.md mentions a DB table, but for 81 static entries, an in-memory constant map is simpler, faster, and more testable
   - Phase 2 can introduce a DB table if archetypes become user-configurable or need dynamic updates

2. **4-Letter Code for POC (NOT 5-Letter)**
   - Rationale: Neuroticism is the most complex trait to name positively. Starting with 4 traits (81 combinations) is manageable for hand-curation.
   - Phase 2: Extend to 5-letter codes (243 combinations) when Neuroticism naming is designed
   - Full 5-letter code is still stored/generated — only the lookup key uses 4 letters

3. **Hand-Curated + Fallback Hybrid**
   - Rationale: 25-30 curated names for common profiles provide quality. Fallback covers the remaining ~51 less common combinations.
   - Every code returns a valid archetype — no `undefined` or "Unknown"
   - `isCurated` flag lets UI distinguish between curated and generated names

4. **No Input Validation Beyond Basic Checks**
   - Code length must be exactly 4 characters
   - Characters must be L, M, or H
   - Caller (use-case layer) ensures valid input from `generateOceanCode()`

5. **Deterministic Color Generation**
   - Each archetype gets a consistent color based on trait levels
   - No randomness — same code always produces same color
   - Curated entries can override the generated color

### Architecture Patterns

**Hexagonal Architecture Compliance**:
```
┌─────────────────────────────────────────────┐
│ Use-Case Layer                              │
│ (get-results.use-case.ts)                   │
│                                             │
│  1. Gets 5-letter OCEAN code (Story 3.1)    │
│  2. Extracts 4-letter code                  │
│  3. Calls lookupArchetype(code4)            │
│  4. Returns archetype to handler            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Domain Layer (Pure Functions)               │
│ packages/domain/src/utils/                  │
│                                             │
│  extract4LetterCode("HHMHM") → "HHMH"     │
│  lookupArchetype("HHMH") → Archetype       │
│                                             │
│  - No dependencies on infrastructure       │
│  - No side effects (DB, logging, errors)   │
│  - Deterministic (same in → same out)      │
│  - Fast (O(1) map lookup)                  │
└─────────────────────────────────────────────┘
```

**Data Flow**:
```
5-letter OCEAN code (from Story 3.1)
    ↓
extract4LetterCode("HHMHM") → "HHMH"
    ↓
lookupArchetype("HHMH")
    ↓
Check curated map → found? Return curated archetype
    ↓ (not found)
Generate fallback name + description + color
    ↓
Return Archetype { code4, name, description, color, isCurated }
```

### Project Structure Notes

**Files to Create**:
```
packages/domain/src/
├── types/
│   └── archetype.ts                     # Archetype type + TraitLevel
├── constants/
│   └── archetypes.ts                    # Hand-curated archetype data
└── utils/
    ├── archetype-lookup.ts              # lookupArchetype + extract4LetterCode
    └── __tests__/
        └── archetype-lookup.test.ts     # 100+ tests (81 combinations + edge cases)
```

**Files to Modify**:
```
packages/domain/src/types/index.ts       # Export Archetype type (if index exists, else skip)
packages/domain/src/utils/index.ts       # Export lookup functions
packages/domain/src/index.ts             # Export from domain package
CLAUDE.md                                # Document archetype lookup pattern
```

**DO NOT modify** (Story 3.2 is pure domain — integration with use-case is a separate concern):
- `apps/api/src/use-cases/get-results.use-case.ts` — placeholder stays until integration story
- `packages/infrastructure/src/db/drizzle/schema.ts` — no DB table for POC
- Any existing repository interfaces or implementations

**Dependencies** (already exist):
```
packages/domain/src/constants/big-five.ts
  - TraitName type
  - BIG_FIVE_TRAITS constant (OCEAN order)
```

**Depends on (from Story 3.1 — may not be merged yet)**:
```
packages/domain/src/utils/ocean-code-generator.ts
  - generateOceanCode() returns 5-letter code
  - Story 3.2 can be developed independently — only needs code4 strings as input
```

### Testing Standards Summary

**TDD Phases**:
1. **RED**: Write 100+ failing tests first
   - 81 combination tests (3^4 = all O,C,E,A permutations)
   - 10+ curated entry tests (specific names verified)
   - 10+ edge case tests (invalid inputs, determinism, format validation)
2. **GREEN**: Implement minimal code to pass all tests
3. **REFACTOR**: Optimize for readability and maintainability

**Coverage Requirements**:
- 100% line coverage
- 100% branch coverage
- 100% function coverage
- All 81 combinations tested

**Test Framework**:
- Vitest (standard, no `@effect/vitest` needed — pure functions, no Effect DI)
- No mocking needed — pure functions only
- `describe/it/expect` from vitest

### Dependencies and Relationships

**Story Dependencies**:

| Depends On | What It Provides | Status |
|------------|------------------|--------|
| Story 3.1 | 5-letter OCEAN code generation | Done (not merged) |
| Story 2.3 | Facet/trait scoring system | Done |

**Enables Future Stories**:

| Story | How This Helps |
|-------|----------------|
| Story 5.1 | Archetype name displayed in results UI |
| Story 5.2 | Archetype included in shareable profile links |

**Blocked By**: Story 3.1 (for integration, but lookup can be developed independently)

**Blocks**: Epic 3 completion → unlocks Epic 4 (Frontend UI)

### References

**Architecture Decisions**:
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2] — Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3] — Epic objectives and dependencies
- [Source: docs/ARCHITECTURE.md] — Hexagonal architecture patterns

**Codebase Patterns**:
- [Source: packages/domain/src/constants/big-five.ts] — TraitName type, BIG_FIVE_TRAITS constant
- [Source: packages/domain/src/types/facet-evidence.ts] — FacetScore, TraitScore types
- [Source: packages/domain/src/utils/index.ts] — Domain utility export pattern
- [Source: packages/domain/src/index.ts] — Domain package re-export pattern
- [Source: apps/api/src/use-cases/get-results.use-case.ts] — Placeholder to replace (future integration)

**Previous Stories**:
- [Source: _bmad-output/implementation-artifacts/3-1-generate-5-letter-ocean-codes-from-trait-scores.md] — OCEAN code generator specification
- [Source: _bmad-output/implementation-artifacts/3-0-migrate-tests-to-vitest-mock-modules.md] — Mock pattern migration

**Git Intelligence** (recent commits):
- `61475ed chore: remove unit test in git hook`
- `cb63bf4 chore: remove integration test in workflow`
- `31f13d1 refactor(story-3-0): migrate tests to Vitest __mocks__ with vi.mock() pattern (#17)`
- Pattern: Feature branches merged via PR to master, conventional commits used

---

## Success Criteria

**Dev Completion (Definition of Done)**:

Domain Types:
- [x] `Archetype` type defined with all fields
- [x] `TraitLevel` type defined
- [x] Types exported from domain package

Constants:
- [x] 25+ hand-curated archetype entries
- [x] Adjective mapping for fallback generation
- [x] Color mapping for all trait levels

Utility Functions:
- [x] `lookupArchetype(code4)` → `Archetype` works for all 81 codes
- [x] `extract4LetterCode(code5)` → `string` works correctly
- [x] Functions exported from domain package

Testing:
- [x] 81 combination tests pass (all 4-letter permutations)
- [x] 10+ curated entry tests pass (specific names)
- [x] 10+ edge case tests pass (validation, determinism)
- [x] 100% code coverage achieved

Integration:
- [x] No compilation errors (`pnpm build`)
- [x] All project tests passing (`pnpm test:run`)
- [x] Lint clean (`pnpm lint`)

Documentation:
- [x] JSDoc on all exported functions
- [x] CLAUDE.md updated with archetype lookup pattern

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

- RED phase: 107 tests failing, 9 passing (validation throws tests passed since stub throws on everything)
- GREEN phase: 116/116 tests passing after implementation
- TypeScript strict mode fix: Changed `Record<string, ...>` to `Record<TraitKey, ...>` and introduced `Code4Tuple` type to avoid `T | undefined` from array indexing

### Completion Notes List

- **Task 1**: Created `archetype.ts` with `TraitLevel`, `OceanCode4`, `OceanCode5`, and `Archetype` types. Exported from `packages/domain/src/index.ts` (no types/index.ts exists in this project — types are exported directly from domain root).
- **Task 2**: Wrote 116 tests covering: 14 curated name assertions, 25-entry curated batch checks, fallback generation checks, all 81 combinations parameterized, determinism (100-call loops for both curated and generated), and 6 input validation edge cases (wrong length, invalid chars, lowercase). RED phase confirmed: 107 failing before implementation.
- **Task 3**: Created `archetypes.ts` with 25 hand-curated entries using `CuratedArchetypeEntry` interface. Each entry has name, 2-3 sentence description, and hex color.
- **Task 4**: Implemented fallback generator with: `generateArchetypeName()` (primary trait adjective + A-level noun), `generateDescription()` (O+C sentence + E+A sentence), `generateColor()` (average RGB of 4 trait-level colors → hex). Used `Code4Tuple` typed tuple and `TraitKey` union to satisfy TypeScript strict mode.
- **Task 5**: All 81 combinations covered by parameterized test loop. Edge cases: 3 invalid length tests, 3 invalid character tests, 2 determinism tests (100 iterations each). Total: 116 tests.
- **Task 6**: `extract4LetterCode()` validates 5-char L/M/H input, slices first 4. 6 tests covering valid extraction and error cases.
- **Task 7**: Exported `lookupArchetype`, `extract4LetterCode` from `utils/index.ts`. Exported types, `CURATED_ARCHETYPES` constant from `domain/src/index.ts`. `pnpm build` passes clean.
- **Task 8**: JSDoc on all exported functions (`lookupArchetype`, `extract4LetterCode`, `Archetype` interface, `CuratedArchetypeEntry`). CLAUDE.md updated with "Archetype Lookup System (Story 3.2)" section.

### Change Log

- 2026-02-06: Story 3.2 implemented — archetype lookup system with 25 curated entries, fallback generator for all 81 combinations, 116 tests passing, TypeScript strict mode compliant

### File List

**Created**:
- `packages/domain/src/types/archetype.ts`
- `packages/domain/src/constants/archetypes.ts`
- `packages/domain/src/utils/archetype-lookup.ts`
- `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`

**Modified**:
- `packages/domain/src/utils/index.ts` (added lookupArchetype, extract4LetterCode exports)
- `packages/domain/src/index.ts` (added Archetype types, CURATED_ARCHETYPES constant, utility function exports)
- `CLAUDE.md` (added Archetype Lookup System section)
