# Story 41-3: Facet Additions to Existing Territories and Catalog Validation

**Status:** ready-for-dev

## User Story

As a **system operator**,
I want 3 facets added to existing territories and the full catalog validated for completeness,
So that every hard-to-assess facet has >=2 territory routes with no single-domain-pair bottleneck, and the scoring/steering formulas remain unchanged.

## Acceptance Criteria

**AC-1: Facet additions to existing territories**
- **Given** inner-life already includes artistic_interests (from Story 2.1)
- **When** facets are added to existing territories
- **Then** cautiousness is added to work-dynamics' facet list
- **And** liberalism is added to growing-up's facet list

**AC-2: Facet coverage validation**
- **Given** the full 31-territory catalog
- **When** facet coverage is validated
- **Then** all 30 Big Five facets have >=2 territory routes
- **And** no hard-to-assess facet (orderliness, artistic_interests, cautiousness, liberalism, dutifulness, altruism, immoderation, depression, modesty, adventurousness) is stuck in a single domain pair
- **And** orderliness appears in >=3 territories across >=4 domains

**AC-3: Scoring formula unchanged**
- **Given** the territory catalog is updated
- **When** the territory scorer (scoreAllTerritories) runs with 31 territories
- **Then** the five-term formula produces valid scores for all territories without code changes (FR-S25)
- **And** the steering priority formula is unchanged (FR-S26)

**AC-4: Test coverage**
- **Given** the full catalog update
- **When** all territory catalog tests run
- **Then** tests cover 31 territories, new domain assignments, new facet lists, and all pass (NFR-S7)

## FRs Covered

- FR-S22: 3 facet additions to existing territories (artistic_interests -> inner-life already done, cautiousness -> work-dynamics, liberalism -> growing-up)
- FR-S23: Catalog at 31 territories, all 30 facets have >=2 territory routes, no hard-to-assess facet stuck in single domain pair
- FR-S25: Scoring formula unchanged
- FR-S26: Steering formula unchanged

## Tasks

### Task 1: Add facets to existing territories
- **1.1** Add `cautiousness` to `work-dynamics` expectedFacets in `packages/domain/src/constants/territory-catalog.ts`
- **1.2** Add `liberalism` to `growing-up` expectedFacets in `packages/domain/src/constants/territory-catalog.ts`
- **1.3** Verify inner-life already has `artistic_interests` (no change needed — from Story 2.1)

### Task 2: Write catalog validation tests
- **2.1** Add test: every facet has >=2 territory routes
- **2.2** Add test: no hard-to-assess facet is stuck in a single domain pair (i.e., each appears across >=2 distinct domain pairs)
- **2.3** Add test: orderliness appears in >=3 territories across >=4 domains
- **2.4** Add test: work-dynamics includes cautiousness
- **2.5** Add test: growing-up includes liberalism

### Task 3: Validate scoring and steering formulas unchanged
- **3.1** Verify no changes to `formula.ts` — existing tests pass
- **3.2** Verify no changes to steering priority formula — existing tests pass
- **3.3** Run full test suite to confirm no regressions

## Dependencies

- Story 2.1 (domain remap + inner-life replacement) — completed
- Story 2.2 (6 new territories) — completed

## Technical Notes

- Territory catalog is a pure constant in `packages/domain/src/constants/territory-catalog.ts`
- Tests live in `packages/domain/src/constants/__tests__/territory-catalog.test.ts`
- Facet type is `FacetName` from `packages/domain/src/constants/big-five.ts`
- No database changes, no migration needed
- No changes to formula.ts or steering logic
