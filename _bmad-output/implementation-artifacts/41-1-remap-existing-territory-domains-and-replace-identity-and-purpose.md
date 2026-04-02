# Story 41-1: Remap Existing Territory Domains and Replace identity-and-purpose

**Status:** ready-for-dev

**Epic:** Epic 2 — Territory Catalog Expansion
**Sprint:** 41
**Depends on:** Epic 1 (Stories 1.1, 1.2 complete — health domain exists, solo deprecated)

## User Story

As a **system operator**,
I want the 12 existing territories that referenced solo remapped to their new domains, and identity-and-purpose replaced by inner-life,
So that all territories reference valid domains from the new 6-domain model.

## Acceptance Criteria

### AC1: 12 territories remapped from solo to new domains

**Given** 12 territories in the catalog reference the solo domain
**When** territory-catalog.ts is updated
**Then** each territory's domains match the remap table:
- daily-routines: work, health
- creative-pursuits: leisure, work
- weekend-adventures: leisure, relationships
- learning-curiosity: leisure, work
- comfort-zones: health, relationships
- spontaneity-and-impulse: leisure, health
- emotional-awareness: health, relationships
- ambition-and-goals: work, health
- growing-up: family, relationships
- friendship-depth: relationships, leisure
- opinions-and-values: relationships, work
- inner-struggles: health, relationships
**And** no territory references the solo domain

### AC2: identity-and-purpose replaced by inner-life

**Given** the territory identity-and-purpose exists with domains solo, work
**When** it is replaced by inner-life
**Then** inner-life has domains: health, leisure
**And** inner-life has facets: intellect, emotionality, imagination, liberalism, artistic_interests
**And** inner-life has expectedEnergy: 0.60
**And** inner-life has a description in Nerin's curiosity voice
**And** inner-life has an opener question
**And** identity-and-purpose no longer exists in the catalog

### AC3: Tests updated and passing

**Given** the catalog is updated
**When** existing tests for territory-catalog run
**Then** tests are updated to reflect the new domain assignments and pass
**And** the catalog still contains exactly 25 territories (no additions/removals beyond the replacement)

## Tasks

### Task 1: Remap 12 territory domains in territory-catalog.ts

**File:** `packages/domain/src/constants/territory-catalog.ts`

1.1. Update DAILY_ROUTINES domains from `["work", "solo"]` to `["work", "health"]`
1.2. Update CREATIVE_PURSUITS domains from `["leisure", "solo"]` to `["leisure", "work"]`
1.3. Update WEEKEND_ADVENTURES domains from `["leisure", "solo"]` to `["leisure", "relationships"]`
1.4. Update LEARNING_CURIOSITY domains from `["solo", "work"]` to `["leisure", "work"]`
1.5. Update COMFORT_ZONES domains from `["solo", "relationships"]` to `["health", "relationships"]`
1.6. Update SPONTANEITY_AND_IMPULSE domains from `["leisure", "solo"]` to `["leisure", "health"]`
1.7. Update EMOTIONAL_AWARENESS domains from `["solo", "relationships"]` to `["health", "relationships"]`
1.8. Update AMBITION_AND_GOALS domains from `["work", "solo"]` to `["work", "health"]`
1.9. Update GROWING_UP domains from `["family", "solo"]` to `["family", "relationships"]`
1.10. Update FRIENDSHIP_DEPTH domains from `["relationships", "solo"]` to `["relationships", "leisure"]`
1.11. Update OPINIONS_AND_VALUES domains from `["solo", "relationships"]` to `["relationships", "work"]`
1.12. Update INNER_STRUGGLES domains from `["solo", "relationships"]` to `["health", "relationships"]`

### Task 2: Replace identity-and-purpose with inner-life

**File:** `packages/domain/src/constants/territory-catalog.ts`

2.1. Replace the IDENTITY_AND_PURPOSE territory definition with INNER_LIFE:
  - id: "inner-life"
  - name: "Inner Life"
  - description: Nerin's curiosity voice describing what their mind does when it wanders
  - descriptionYou: Second-person version
  - expectedEnergy: 0.60
  - domains: ["health", "leisure"]
  - expectedFacets: ["intellect", "emotionality", "imagination", "liberalism", "artistic_interests"]
  - opener: A question about what their mind does in quiet moments
2.2. Update the ALL_TERRITORIES array to reference INNER_LIFE instead of IDENTITY_AND_PURPOSE
2.3. Update the JSDoc comment to reflect catalog still has 25 territories

### Task 3: Update territory-catalog tests

**File:** `packages/domain/src/constants/__tests__/territory-catalog.test.ts`

3.1. Update the domain validation test to check for steerable domains (no solo expected in territories)
3.2. Update the energy distribution test — the distribution changes since inner-life (0.60) replaces identity-and-purpose (0.63), both are heavy
3.3. Add a test that no territory references the "solo" domain
3.4. Add a test for inner-life territory existence with correct domains and facets
3.5. Update the "all domains appear in >= 6 territories" test to check health instead of solo
3.6. Verify all 30 facets are still covered (existing test should pass)

## Technical Notes

- This is a pure constant update — no database changes, no migration needed
- The territory catalog is a compile-time constant in domain package
- Territory type requires exactly 2 domains (compile-time enforced by tuple type)
- The LifeDomain type already includes "health" (added in Story 1.1)
- "solo" is still in LIFE_DOMAINS constant (removal deferred to Story 1.3 cleanup) but should not be used in any territory
- The 25-territory count stays the same — this story only remaps and replaces, no additions
