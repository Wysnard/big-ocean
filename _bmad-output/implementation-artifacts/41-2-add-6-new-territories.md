# Story 41-2: Add 6 New Territories (3 Health + 3 Hard-to-Assess Coverage)

**Epic:** 2 - Territory Catalog Expansion
**Status:** ready-for-dev
**Priority:** high
**Depends on:** Story 41-1 (remap existing territory domains and replace identity-and-purpose)

## User Story

As a **system operator**,
I want 6 new territories added to the catalog covering health contexts and hard-to-assess facets,
So that the pacing pipeline can steer conversations into health topics and ensure comprehensive facet coverage.

## Acceptance Criteria

### AC1: 3 New Health Territories Added

**Given** the catalog has 25 territories (after Story 41-1 remap + replacement)
**When** the 3 new health territories are added
**Then** the catalog contains:
- `body-and-movement` (health, leisure; activity_level, self_discipline, excitement_seeking; energy 0.25)
- `cravings-and-indulgences` (health, leisure; immoderation, self_discipline, cautiousness; energy 0.40)
- `stress-and-the-body` (health, work; vulnerability, anxiety, self_efficacy, self_discipline; energy 0.60)
**And** each has a description in Nerin's curiosity voice and an opener question

### AC2: 3 New Hard-to-Assess Coverage Territories Added

**Given** the 3 health territories are added
**When** the 3 new hard-to-assess coverage territories are added
**Then** the catalog contains:
- `home-and-space` (family, leisure; orderliness, activity_level, cautiousness; energy 0.22)
- `trips-and-plans` (leisure, relationships; orderliness, adventurousness, cooperation; energy 0.28)
- `taking-care` (health, family; altruism, sympathy, dutifulness, self_discipline; energy 0.48)
**And** each has a description in Nerin's curiosity voice and an opener question

### AC3: Catalog Size

**Given** all 6 territories are added
**When** the catalog size is counted
**Then** the catalog contains exactly 31 territories

## Tasks

### Task 1: Write failing tests for 6 new territories
- [ ] 1.1: Add test asserting catalog contains exactly 31 territories (update existing test from 25 to 31)
- [ ] 1.2: Add test for each new health territory (body-and-movement, cravings-and-indulgences, stress-and-the-body) verifying id, domains, expectedFacets, expectedEnergy
- [ ] 1.3: Add test for each new hard-to-assess territory (home-and-space, trips-and-plans, taking-care) verifying id, domains, expectedFacets, expectedEnergy
- [ ] 1.4: Update energy distribution test to account for new territories (new distribution: light territories grow from 9 to 12, medium from 10 to 11, heavy stays at 6, total = 29 within bands; 2 territories at 0.40 and 0.48 fall in medium)
- [ ] 1.5: Run tests to confirm they fail (red phase)

### Task 2: Add 6 new territory definitions to territory-catalog.ts
- [ ] 2.1: Add body-and-movement territory (light energy 0.25, health+leisure, activity_level/self_discipline/excitement_seeking)
- [ ] 2.2: Add cravings-and-indulgences territory (medium energy 0.40, health+leisure, immoderation/self_discipline/cautiousness)
- [ ] 2.3: Add stress-and-the-body territory (heavy energy 0.60, health+work, vulnerability/anxiety/self_efficacy/self_discipline)
- [ ] 2.4: Add home-and-space territory (light energy 0.22, family+leisure, orderliness/activity_level/cautiousness)
- [ ] 2.5: Add trips-and-plans territory (light energy 0.28, leisure+relationships, orderliness/adventurousness/cooperation)
- [ ] 2.6: Add taking-care territory (medium energy 0.48, health+family, altruism/sympathy/dutifulness/self_discipline)
- [ ] 2.7: Add all 6 to ALL_TERRITORIES array in appropriate energy band sections
- [ ] 2.8: Update catalog JSDoc comment to reflect 31 territories

### Task 3: Run tests (green phase)
- [ ] 3.1: Verify all new territory tests pass
- [ ] 3.2: Verify all existing territory tests still pass
- [ ] 3.3: Run full typecheck

## Technical Notes

- Territory definitions live in `packages/domain/src/constants/territory-catalog.ts`
- Tests live in `packages/domain/src/constants/__tests__/territory-catalog.test.ts`
- Each territory needs: id, name, description (Nerin's curiosity voice, third-person), descriptionYou (second-person), expectedEnergy, domains (2-tuple), expectedFacets, opener
- Descriptions must start with one of: how, what, who, when, where, the (validated by existing test)
- descriptionYou must use you/your pronouns, not they/their (validated by existing test)
- Use the existing `territory()` helper function for type safety
- Energy bands: light 0.20-0.37, medium 0.38-0.53, heavy 0.58-0.72

## References

- FR-S20: 3 new health territories
- FR-S21: 3 new hard-to-assess coverage territories
- FR-S24: Territory definition requirements (name, energy, domains, facets, opener)
- NFR-S7: Territory catalog tests updated for 31 territories
