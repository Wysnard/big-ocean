# Story 3.1: Generate 5-Letter OCEAN Codes from Trait Scores (TDD)

Status: ready-for-dev

**Story ID:** 3.1
**Created:** 2026-02-05
**Epic:** 3 - OCEAN Archetype System
**Epic Status:** backlog

---

## Story

As a **Backend System**,
I want **to deterministically map facet scores to 5-letter OCEAN codes**,
So that **the same personality profile always produces the same archetype identifier**.

---

## Acceptance Criteria

### TEST-FIRST (Red Phase)

**Given** tests are written for OCEAN code generation
**When** I run `pnpm test ocean-code-generator.test.ts`
**Then** tests fail (red) because code generator doesn't exist
**And** each test defines expected behavior:
  - Test: Facet sums calculated correctly (6 facets per trait, each 0-20 → trait 0-120)
  - Test: All 243 trait level combinations map to correct codes (3^5 possibilities)
  - Test: Trait 0-40 → Low (L), 40-80 → Mid (M), 80-120 → High (H)
  - Test: Same facet scores always produce same code (deterministic)
  - Test: Code is exactly 5 letters (e.g., "HHMHM")

### IMPLEMENTATION (Green Phase)

**Given** all 30 facets are scored (e.g., Imagination=18, Artistic=18, Emotionality=18, Adventurousness=18, Intellect=18, Liberalism=18)
**When** the Trait Score Aggregator calculates sums for all 5 traits:
  - Openness = sum(6 O facets) = 108 (example: 18+18+18+18+18+18)
  - Conscientiousness = sum(6 C facets) = 84 (example: 14+14+14+14+14+14)
  - Extraversion = sum(6 E facets) = 60 (example: 10+10+10+10+10+10)
  - Agreeableness = sum(6 A facets) = 96 (example: 16+16+16+16+16+16)
  - Neuroticism = sum(6 N facets) = 72 (example: 12+12+12+12+12+12)
**And** the code generator processes trait scores
**Then** each trait is mapped to a level:
  - Openness 108 → High (H) [>80]
  - Conscientiousness 84 → High (H) [>80]
  - Extraversion 60 → Mid (M) [40-80]
  - Agreeableness 96 → High (H) [>80]
  - Neuroticism 72 → Mid (M) [40-80]
**And** full 5-letter code is generated as: "HHMHM" (5 letters for complete OCEAN storage)
**And** code is deterministic (same facet scores → same trait sums → same code, always)
**And** all failing tests now pass (green)

### REFACTOR & INTEGRATION

**Given** facet scores are updated (precision increases)
**When** trait sums are recalculated and code is regenerated on-demand
**Then** if any trait level changed, code changes
**And** if all trait levels stay same, code stays same
**And** performance is O(1) - constant time generation

---

## Tasks / Subtasks

### Task 1: Pure Function Interface (AC: Test-First Phase)

- [ ] Create `packages/domain/src/utils/ocean-code-generator.ts`
- [ ] Define function signature:
  ```typescript
  export const generateOceanCode = (
    facetScores: Record<FacetName, FacetScore>
  ): string
  ```
- [ ] Create test file `packages/domain/src/utils/__tests__/ocean-code-generator.test.ts`
- [ ] Write failing type tests (red) - verify function signature and return type
- [ ] Export from `packages/domain/src/utils/index.ts`
- [ ] Export from `packages/domain/src/index.ts`

### Task 2: Trait Sum Calculation (AC: Implementation Phase)

- [ ] Implement sum logic using FACET_TO_TRAIT from `packages/domain/src/constants/big-five.ts`:
  ```typescript
  import { FACET_TO_TRAIT, BIG_FIVE_TRAITS } from '../constants/big-five'

  // For each trait, sum its 6 facet scores
  const traitScores: Record<TraitName, number> = {}
  for (const trait of BIG_FIVE_TRAITS) {
    const facetsForTrait = Object.entries(FACET_TO_TRAIT)
      .filter(([_, t]) => t === trait)
      .map(([facet]) => facet as FacetName)

    traitScores[trait] = facetsForTrait.reduce(
      (sum, facet) => sum + facetScores[facet].score,
      0
    )
    // Range: 0-120 (6 facets × 0-20 each)
  }
  ```
- [ ] Write failing sum tests (red):
  - Test: All facets at 10 → trait sum = 60 (midpoint)
  - Test: All facets at 0 → trait sum = 0 (minimum)
  - Test: All facets at 20 → trait sum = 120 (maximum)
  - Test: Mixed facets sum correctly (e.g., [18,18,18,18,18,18] = 108)
- [ ] Implement to pass tests (green)

### Task 3: Trait-to-Level Mapping (AC: Threshold Boundaries)

- [ ] Create `mapTraitScoreToLevel(score: number): 'L' | 'M' | 'H'`:
  ```typescript
  const mapTraitScoreToLevel = (score: number): 'L' | 'M' | 'H' => {
    if (score < 40) return 'L'
    if (score < 80) return 'M'
    return 'H'
  }
  ```
- [ ] Write failing boundary tests (red):
  - Test: 0 → L, 39 → L, 40 → M (low-mid boundary)
  - Test: 40 → M, 79 → M, 80 → H (mid-high boundary)
  - Test: 80 → H, 120 → H (high range)
  - Test: Edge cases: 39.9 → L, 79.9 → M
- [ ] Implement to pass tests (green)

### Task 4: Code Generation (AC: 5-Letter Format)

- [ ] Concatenate 5 levels in OCEAN order:
  ```typescript
  const O = mapTraitScoreToLevel(traitScores.openness)
  const C = mapTraitScoreToLevel(traitScores.conscientiousness)
  const E = mapTraitScoreToLevel(traitScores.extraversion)
  const A = mapTraitScoreToLevel(traitScores.agreeableness)
  const N = mapTraitScoreToLevel(traitScores.neuroticism)

  return `${O}${C}${E}${A}${N}`  // e.g., "HHMHM"
  ```
- [ ] Write failing format tests (red):
  - Test: Output is exactly 5 characters
  - Test: Output is uppercase letters only
  - Test: Output matches /^[LMH]{5}$/ regex
  - Test: OCEAN order is correct (not alphabetical or random)
- [ ] Implement to pass tests (green)

### Task 5: Comprehensive Test Coverage (AC: 100% Coverage, All 243 Combinations)

- [ ] Write parameterized tests for all 243 combinations (3^5):
  ```typescript
  const levels = ['L', 'M', 'H'] as const

  describe('All 243 OCEAN code combinations', () => {
    for (const O of levels) {
      for (const C of levels) {
        for (const E of levels) {
          for (const A of levels) {
            for (const N of levels) {
              it(`generates ${O}${C}${E}${A}${N} for appropriate facet scores`, () => {
                const facetScores = createFacetScoresForTraitLevels({ O, C, E, A, N })
                const code = generateOceanCode(facetScores)
                expect(code).toBe(`${O}${C}${E}${A}${N}`)
              })
            }
          }
        }
      }
    }
  })
  ```
- [ ] Create test helper `createFacetScoresForTraitLevels()`:
  - L level: Use facet scores totaling 20 (e.g., all 3.33)
  - M level: Use facet scores totaling 60 (e.g., all 10)
  - H level: Use facet scores totaling 100 (e.g., all 16.67)
- [ ] Edge case tests:
  - Test: Default facet scores (all 10) → "MMMMM"
  - Test: Determinism: same input called 100 times → same output
  - Test: Boundary precision: 39.9999 rounds to 39, 40.0001 rounds to 40
- [ ] All 250+ tests pass (green)

### Task 6: Integration with Existing Types (AC: Type Safety)

- [ ] Verify `FacetName` type import from `packages/domain/src/types/facet-evidence.ts`
- [ ] Verify `FacetScore` type includes score property (number, 0-20 range)
- [ ] Verify `TraitName` type from `packages/domain/src/constants/big-five.ts`
- [ ] Add JSDoc to function documenting:
  - Input contract: All 30 facets must be present
  - No validation performed (caller responsibility)
  - Deterministic output guaranteed
  - O(1) time complexity

### Task 7: Performance Verification (AC: O(1) Complexity)

- [ ] Benchmark test: 1000 code generations complete in < 10ms total
- [ ] Verify no loops beyond fixed 5 traits × 6 facets (constant iterations)
- [ ] Memory test: No allocations beyond output string (5 characters)
- [ ] Profile execution: Ensure no unexpected garbage collection

### Task 8: Documentation (AC: Developer Guidance)

- [ ] Add JSDoc comments to all exported functions:
  ```typescript
  /**
   * Generates a deterministic 5-letter OCEAN code from facet scores.
   *
   * Algorithm:
   * 1. Sum 6 facets per trait (using FACET_TO_TRAIT lookup)
   * 2. Map each trait sum (0-120) to level: 0-40=L, 40-80=M, 80-120=H
   * 3. Concatenate 5 levels in OCEAN order
   *
   * @param facetScores - All 30 facet scores (caller must validate)
   * @returns 5-letter code (e.g., "HHMHM")
   *
   * @remarks
   * - No validation: Caller ensures all 30 facets present and valid (0-20)
   * - Deterministic: Same input always produces same output
   * - Performance: O(1) time complexity (constant 30 iterations)
   * - No side effects: Pure function, no DB/logging/errors
   */
  export const generateOceanCode = (
    facetScores: Record<FacetName, FacetScore>
  ): string
  ```
- [ ] Update `CLAUDE.md` Architecture section with OCEAN code generation pattern:
  - Add to "Domain Package Structure" section
  - Document pure function pattern
  - Reference from Story 3.1
- [ ] Add code examples to story file completion notes

---

## Dev Notes

### Critical Context for Developer Agent

**Purpose**: Create a pure, deterministic algorithm that transforms 30 facet scores into a 5-letter OCEAN personality code for archetype identification.

**What Already Exists (from previous stories)**:
- Story 2.3: Scorer calculates facet scores (0-20 each) and trait scores (sum-based, 0-120)
  - Implementation in `packages/infrastructure/src/repositories/scorer.drizzle.repository.ts:221`
  - Pattern: `const traitScore = sum(facetsForTrait.map(f => f.score))`
- Story 2.4: Orchestrator provides facet scores to use-cases
  - FacetScoresMap type defined in `packages/domain/src/types/facet-evidence.ts`
- FACET_TO_TRAIT lookup exists in `packages/domain/src/constants/big-five.ts`

**What This Story Adds**:
- Pure utility function: `generateOceanCode(facetScores) → string`
- Location: `packages/domain/src/utils/ocean-code-generator.ts`
- No database interaction (on-demand generation only)
- No error handling (caller validates input)
- 100% test coverage with all 243 combinations

**Design Decisions**:
1. **No Database Storage**: OCEAN codes derived on-demand from facet scores
   - Rationale: Single source of truth (facets), no staleness, no sync issues
2. **No Input Validation**: Caller (use-case layer) ensures valid input
   - Rationale: Performance optimization, clear separation of concerns
3. **Sum-Based Aggregation**: Changed from mean (0-20) to sum (0-120) in Story 2.3
   - Rationale: Enables stacked visualization, preserves granularity
4. **Thresholds**: Equal distribution across 0-120 scale
   - Low: 0-40 (bottom 33%)
   - Mid: 40-80 (middle 33%)
   - High: 80-120 (top 33%)

### Architecture Patterns

**Hexagonal Architecture Compliance**:
```
┌─────────────────────────────────────────────┐
│ Use-Case Layer                              │
│ (get-results.use-case.ts)                   │
│                                             │
│  1. Fetches facetScores from Scorer        │
│  2. Calls generateOceanCode(facetScores)   │
│  3. Returns code to handler                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ Domain Layer (Pure Function)                │
│ packages/domain/src/utils/                  │
│                                             │
│  generateOceanCode(facetScores) → string   │
│                                             │
│  - No dependencies on infrastructure       │
│  - No side effects (DB, logging, errors)   │
│  - Deterministic (same in → same out)      │
│  - Fast (O(1) complexity)                  │
└─────────────────────────────────────────────┘
```

**Data Flow**:
```
FacetScores (30 facets, 0-20 each)
    ↓
Group by Trait (FACET_TO_TRAIT)
    ↓
Sum 6 facets per trait → 5 trait scores (0-120 each)
    ↓
Map to Level (0-40=L, 40-80=M, 80-120=H)
    ↓
Concatenate in OCEAN order → "HHMHM"
```

**Pure Function Pattern**:
- Input: `Record<FacetName, FacetScore>` (30 facets)
- Output: `string` (5 characters, e.g., "HHMHM")
- No side effects
- No external dependencies
- Deterministic
- Testable with 100% coverage

### Project Structure Notes

**Files to Create**:
```
packages/domain/src/utils/
├── ocean-code-generator.ts           # Main implementation
└── __tests__/
    └── ocean-code-generator.test.ts  # 250+ tests (243 combinations + edge cases)
```

**Files to Modify**:
```
packages/domain/src/utils/index.ts    # Export generateOceanCode
packages/domain/src/index.ts          # Export from utils
CLAUDE.md                             # Document pattern
```

**Dependencies** (already exist):
```
packages/domain/src/constants/big-five.ts
  - FACET_TO_TRAIT: Record<FacetName, TraitName>
  - BIG_FIVE_TRAITS: TraitName[] (OCEAN order)

packages/domain/src/types/facet-evidence.ts
  - FacetName type (30 facet names)
  - FacetScore type ({ score: number, confidence: number })
  - TraitName type ('openness' | 'conscientiousness' | ...)
```

### Technical Details

**Algorithm Pseudocode**:
```
function generateOceanCode(facetScores):
  traitScores = {}

  for trait in [Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism]:
    facetsForTrait = FACET_TO_TRAIT.entries().filter(t => t === trait)
    traitScores[trait] = sum(facetsForTrait.map(f => facetScores[f].score))

  levels = traitScores.map(score => {
    if score < 40: return 'L'
    if score < 80: return 'M'
    return 'H'
  })

  return levels.join('')  // "HHMHM"
```

**TypeScript Implementation**:
```typescript
import { BIG_FIVE_TRAITS, FACET_TO_TRAIT } from '../constants/big-five'
import type { FacetName, FacetScore, TraitName } from '../types/facet-evidence'

export const generateOceanCode = (
  facetScores: Record<FacetName, FacetScore>
): string => {
  // Calculate trait sums (0-120 each)
  const traitScores: Record<TraitName, number> = {} as Record<TraitName, number>

  for (const trait of BIG_FIVE_TRAITS) {
    const facetsForTrait = Object.entries(FACET_TO_TRAIT)
      .filter(([_, t]) => t === trait)
      .map(([facet]) => facet as FacetName)

    traitScores[trait] = facetsForTrait.reduce(
      (sum, facet) => sum + facetScores[facet].score,
      0
    )
  }

  // Map to levels
  const mapLevel = (score: number): 'L' | 'M' | 'H' => {
    if (score < 40) return 'L'
    if (score < 80) return 'M'
    return 'H'
  }

  // Generate code in OCEAN order
  return BIG_FIVE_TRAITS.map(trait => mapLevel(traitScores[trait])).join('')
}
```

**Test Strategy**:
```typescript
import { it, expect, describe } from 'vitest'
import { generateOceanCode } from '../ocean-code-generator'
import type { FacetName, FacetScore } from '../../types/facet-evidence'

describe('generateOceanCode', () => {
  // Helper to create test facet scores
  const createFacetScores = (traitLevels: {
    O: 'L' | 'M' | 'H',
    C: 'L' | 'M' | 'H',
    E: 'L' | 'M' | 'H',
    A: 'L' | 'M' | 'H',
    N: 'L' | 'M' | 'H'
  }): Record<FacetName, FacetScore> => {
    const levelToScore = { L: 3, M: 10, H: 17 } // Per-facet scores
    // ... implementation
  }

  // 243 combination tests
  describe('all 243 OCEAN combinations', () => {
    const levels = ['L', 'M', 'H'] as const
    for (const O of levels) {
      for (const C of levels) {
        for (const E of levels) {
          for (const A of levels) {
            for (const N of levels) {
              it(`generates ${O}${C}${E}${A}${N}`, () => {
                const facetScores = createFacetScores({ O, C, E, A, N })
                expect(generateOceanCode(facetScores)).toBe(`${O}${C}${E}${A}${N}`)
              })
            }
          }
        }
      }
    }
  })

  // Boundary tests
  describe('threshold boundaries', () => {
    it('maps 0-39 to Low', () => {
      const scores = createScoresForTraitSum('openness', 20)
      expect(generateOceanCode(scores)).toMatch(/^L/)
    })

    it('maps 40-79 to Mid', () => {
      const scores = createScoresForTraitSum('openness', 60)
      expect(generateOceanCode(scores)).toMatch(/^M/)
    })

    it('maps 80-120 to High', () => {
      const scores = createScoresForTraitSum('openness', 100)
      expect(generateOceanCode(scores)).toMatch(/^H/)
    })
  })

  // Edge cases
  describe('edge cases', () => {
    it('returns MMMMM for all facets at 10', () => {
      const scores = createAllFacetsAtScore(10)
      expect(generateOceanCode(scores)).toBe('MMMMM')
    })

    it('is deterministic', () => {
      const scores = createRandomScores()
      const results = Array.from({ length: 100 }, () => generateOceanCode(scores))
      expect(new Set(results).size).toBe(1) // All same
    })
  })
})
```

### Testing Standards Summary

**TDD Phases**:
1. **RED**: Write 250+ failing tests first
   - 243 combination tests (3^5 = all OCEAN permutations)
   - 10 boundary tests (threshold edge cases)
   - 5 edge case tests (determinism, defaults, performance)
2. **GREEN**: Implement minimal code to pass all tests
3. **REFACTOR**: Optimize for readability and maintainability

**Coverage Requirements**:
- 100% line coverage
- 100% branch coverage
- 100% function coverage
- All 243 combinations tested

**Performance Benchmarks**:
- 1000 generations < 10ms total
- O(1) time complexity verified
- No memory leaks

### Dependencies and Relationships

**Story Dependencies**:

| Depends On | What It Provides | Status |
|------------|------------------|--------|
| Story 2.3 | Facet scores (0-20), FACET_TO_TRAIT lookup | ✅ Done |
| Story 2.4 | FacetScoresMap type, orchestrator flow | ✅ Done |

**Enables Future Stories**:

| Story | How This Helps |
|-------|----------------|
| Story 3.2 | OCEAN code used as lookup key for archetype table |
| Story 5.1 | Code displayed in results UI |
| Story 5.2 | Code included in shareable profile links |

**Blocked By**: None (all dependencies complete)

**Blocks**: Story 3.2 (archetype lookup table requires code generation)

### References

**Architecture Decisions**:
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1] - Full acceptance criteria with updated thresholds
- [Source: _bmad-output/planning-artifacts/prd.md#OCEAN-Archetype-System] - Product requirements

**Codebase Patterns**:
- [Source: packages/domain/src/constants/big-five.ts] - FACET_TO_TRAIT lookup, BIG_FIVE_TRAITS order
- [Source: packages/domain/src/types/facet-evidence.ts] - FacetScoresMap, FacetName, TraitName types
- [Source: packages/infrastructure/src/repositories/scorer.drizzle.repository.ts:221] - Sum aggregation pattern

**Related Stories**:
- [Source: _bmad-output/implementation-artifacts/2-3-analyzer-and-scorer-agent-implementation.md] - Facet scoring context
- [Source: _bmad-output/implementation-artifacts/2-4-langgraph-state-machine-and-orchestration.md] - Orchestrator integration

**External Documentation**:
- [Big Five Model](https://en.wikipedia.org/wiki/Big_Five_personality_traits) - Scientific basis
- [IPIP-NEO Inventory](https://ipip.ori.org/newNEOKey.htm) - 30 facet structure

---

## Success Criteria

**Dev Completion (Definition of Done)**:

Domain Layer:
- [ ] `ocean-code-generator.ts` created with pure function
- [ ] Types exported from domain package
- [ ] JSDoc comments complete

Testing:
- [ ] 243 combination tests pass (all OCEAN permutations)
- [ ] 10 boundary tests pass (threshold edge cases)
- [ ] 5 edge case tests pass (determinism, defaults, performance)
- [ ] 100% code coverage achieved
- [ ] Performance benchmark < 10ms for 1000 generations

Integration:
- [ ] Function callable from use-case layer
- [ ] No compilation errors
- [ ] All project tests passing (pnpm test:run)

Documentation:
- [ ] JSDoc comments complete
- [ ] CLAUDE.md updated with pattern
- [ ] Story file completion notes added

---

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Created**:
- `packages/domain/src/utils/ocean-code-generator.ts`
- `packages/domain/src/utils/__tests__/ocean-code-generator.test.ts`

**Modified**:
- `packages/domain/src/utils/index.ts` (export)
- `packages/domain/src/index.ts` (export)
- `CLAUDE.md` (documentation)
