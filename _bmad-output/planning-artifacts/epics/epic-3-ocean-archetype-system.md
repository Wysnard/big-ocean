# Epic 3: OCEAN Archetype System

**Goal:** Implement the 4-letter OCEAN code generation and mapping to memorable archetype names with facet-level descriptions.

**Dependencies:** Epic 2 (Assessment Backend) — requires facet scores + trait aggregation working

**Enables:** Epic 4 (displays archetypes), Epic 5 (shares archetypes)

**Blocked By:** Epic 2 (needs facet/trait scoring complete)

**Note:** Can start database design in parallel with Epic 2, but archetype lookup requires facet scores first

**User Value:** Transforms raw trait scores into memorable, shareable personality archetypes

## Story 3.0: Migrate Tests to Vitest Mock Modules with `__mocks__` Folders

As a **Developer**,
I want **test mock implementations extracted into `__mocks__` folders using Vitest's mock module system**,
So that **mock implementations are reusable, co-located with source, and test files are leaner**.

**Acceptance Criteria:**

**Given** all test layer factory functions exist in `test-layers.ts`
**When** I extract mock implementations into `__mocks__` folders
**Then** mock files are co-located with their source interfaces in `packages/domain/src/repositories/__mocks__/`
**And** test files use `vi.mock()` (path-only, no factory) for `__mocks__` folder resolution
**And** the centralized `TestRepositoriesLayer` composition is preserved
**And** all existing tests pass without behavioral changes (zero regressions)
**And** no changes to production source code

**Technical Details:**

- Extract 11+ mock factory functions from `test-layers.ts` into `__mocks__` folders
- Co-locate `__mocks__` with repository interfaces in `packages/domain/src/repositories/`
- Preserve Effect DI pattern (`Layer.succeed` + `Effect.provide`) as core testing architecture
- Each `__mocks__` file exports both the raw mock object AND a `createTest*Layer()` factory
- Per-test mock customization via `vi.fn().mockReturnValueOnce()` overrides on imported mocks
- Update CLAUDE.md testing section with `__mocks__` pattern documentation

**Acceptance Checklist:**
- [ ] All mock factory functions extracted from `test-layers.ts` into `__mocks__/` files
- [ ] `test-layers.ts` slimmed to imports + `Layer.mergeAll` composition
- [ ] Test files use `__mocks__` imports instead of inline `vi.fn()` blocks
- [ ] All existing tests pass (zero regressions)
- [ ] `__mocks__` pattern documented in CLAUDE.md
- [ ] No production source code changes

---

## Story 3.1: Generate 5-Letter OCEAN Codes from Trait Scores (TDD)

As a **Backend System**,
I want **to deterministically map trait scores (derived from facet sums) to 5-letter OCEAN codes for all traits**,
So that **the same facet scores always produce the same trait levels for storage and reference**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for OCEAN code generation
**When** I run `pnpm test ocean-code-generator.test.ts`
**Then** tests fail (red) because code generator doesn't exist
**And** each test defines expected behavior:
  - Test: Facet sums calculated correctly (6 facets per trait, each 0-20 → trait 0-120)
  - Test: All 243 trait level combinations map to correct codes (3^5 possibilities)
  - Test: Trait 0-40 → Low (L), 40-80 → Mid (M), 80-120 → High (H)
  - Test: Same facet scores always produce same code (deterministic)
  - Test: Code is exactly 5 letters (e.g., "HHMHM")

**IMPLEMENTATION (Green Phase):**
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

**REFACTOR & INTEGRATION:**
**Given** facet scores are updated (precision increases)
**When** trait sums are recalculated and code is regenerated
**Then** if any trait level changed, code changes
**And** if all trait levels stay same, code stays same

**Technical Details:**

- **TDD Workflow**: Tests written first (cover all 243 combinations), implementation follows
- Facet → Trait aggregation:
  - Uses FACET_TO_TRAIT lookup table to group facets by trait
  - Trait score = sum of 6 related facets (each 0-20 scale)
  - Example: `FACET_TO_TRAIT["altruism"] = "agreeableness"`
  - Facet names are clean (no trait prefixes): "imagination", "altruism", "orderliness"
  - Result is 0-120 scale for the trait
- Trait → Level mapping:
  - 0-40: Low (L)
  - 40-80: Mid (M)
  - 80-120: High (H)
- 5-letter code storage: Stores all 5 traits (O, C, E, A, N) in database for complete profile
- Archetype naming (Story 3.2): Uses first 4 letters (O, C, E, A) for POC; Phase 2 adds N
- Facet database storage: All 30 facet scores (0-20 each)
- Derived trait scores: Computed as sums from stored facets (0-120 scale)
- Unit test coverage: 100% code paths (all 243 combinations tested)

**Acceptance Checklist:**
- [ ] Failing tests written first covering all combinations (red phase)
- [ ] Tests verify boundary conditions (0, 40, 80, 120)
- [ ] Tests verify all 243 combinations map correctly
- [ ] Implementation passes all tests (green phase)
- [ ] All 30 facet scores stored in database
- [ ] Trait scores calculated as sum of related facets (0-120 scale)
- [ ] 5-letter code generation algorithm implemented
- [ ] Code stored in database
- [ ] Code is deterministic (same facets → same code)
- [ ] 100% unit test coverage for code generator

---

## Story 3.2: Create and Manage Archetype Lookup Table (4-Letter Naming, TDD)

As a **User**,
I want **to see my personality described with a memorable name like "Thoughtful Collaborator"**,
So that **the archetype feels personal and shareable**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for archetype lookup
**When** I run `pnpm test archetype-lookup.test.ts`
**Then** tests fail (red) because lookup implementation doesn't exist
**And** each test defines expected behavior:
  - Test: 4-letter code lookup returns correct archetype name
  - Test: Hand-curated names exist for all 25-30 common combinations
  - Test: Component-based fallback generates valid names for all 81 combinations
  - Test: Description text is generated correctly for each combination
  - Test: Color assignments are consistent

**IMPLEMENTATION (Green Phase):**
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

**Technical Details:**

- **TDD Workflow**: Tests written first (define lookup contracts), implementation follows
- Archetype table: `id, oceanCode4Letter, archetypeName, description, color (hex)`
- Storage: Full 5-letter code in database for reference
- Naming: Uses first 4 letters (O, C, E, A) for POC archetype lookup (81 combinations)
- 25-30 hand-curated archetypes for POC (covering common 4-letter combinations)
- Component-based fallback: Build names from trait level adjectives for all 81 codes
- Adjective mapping:
  - High O: Creative, Curious, Experimental
  - Mid O: Balanced, Pragmatic
  - Low O: Practical, Traditional
  - (similar for other traits)
- Description: 2-3 sentences explaining the 4-trait combination
- Phase 2: Extend to 5-letter naming when Neuroticism included (243 combinations)
- Unit test coverage: 100% of lookup logic (all 81 combinations tested)

**Acceptance Checklist:**
- [ ] Failing tests written first covering all 81 code combinations (red phase)
- [ ] Tests verify hand-curated name lookup
- [ ] Tests verify component-based fallback generation
- [ ] Tests verify description text generation
- [ ] Implementation passes all tests (green phase)
- [ ] Archetype table populated with 25+ hand-curated entries
- [ ] Lookup returns name + description based on first 4 letters
- [ ] Component-based fallback works for all 81 4-letter combinations
- [ ] Full 5-letter code stored in database for Phase 2
- [ ] Colors assigned for visual differentiation
- [ ] 100% unit test coverage for archetype lookup

---
