# Story 28-1: Territory Catalog Enrichment

**Status:** ready-for-dev
**Epic:** 1 - Desire-Framed Steering System (Nerin Steering Format)
**Priority:** High (foundation for all subsequent steering format stories)

## User Story

As a assessment user,
I want Nerin's territory assignments to carry human-readable curiosity descriptions,
so that the steering system can frame territories as Nerin's desire rather than clinical labels.

## Acceptance Criteria

**AC1: Territory Type Extension**
**Given** the `Territory` interface at `packages/domain/src/types/territory.ts`
**When** the type is updated
**Then** it includes `name: string` (human-readable territory name, e.g., "Daily Routines") and `description: string` (Nerin's curiosity framing, e.g., "how they structure their time and what they protect in it")

**AC2: All 25 Territories Populated**
**Given** the territory catalog at `packages/domain/src/constants/territory-catalog.ts`
**When** the catalog is loaded
**Then** each of the 25 territories has a `name` field and a `description` field populated with the values from the brainstorming session
**And** descriptions are written as Nerin's curiosity using "how they...", "what they...", "who they..." phrasing

**AC3: Existing Tests Pass**
**Given** the territory catalog has been updated with `name` and `description` fields
**When** the existing test suite is run
**Then** all existing tests continue to pass without modification (backward compatible change)

**AC4: New Tests for Name and Description**
**Given** the enriched territory catalog
**When** catalog tests are run
**Then** tests verify each territory has a non-empty `name` string
**And** tests verify each territory has a non-empty `description` string
**And** tests verify descriptions follow the curiosity framing pattern (start with lowercase "how", "what", "who", "when", "where", or "the")

## Tasks

### Task 1: Extend Territory Type (`packages/domain/src/types/territory.ts`)
- Add `readonly name: string` field to `Territory` interface (human-readable territory name)
- Add `readonly description: string` field to `Territory` interface (Nerin's curiosity framing)
- Update JSDoc comments to describe new fields

### Task 2: Update Territory Catalog (`packages/domain/src/constants/territory-catalog.ts`)
- Update `territory()` helper function signature to accept `name` and `description` fields
- Add `name` and `description` to all 25 territory definitions using values from the brainstorming session:
  - Light Energy (9): daily-routines through spontaneity-and-impulse
  - Medium Energy (10): daily-frustrations through giving-and-receiving
  - Heavy Energy (6): family-bonds through pressure-and-resilience
- Ensure descriptions match the brainstorming spec exactly

### Task 3: Add Tests for New Fields (`packages/domain/src/constants/__tests__/territory-catalog.test.ts`)
- Add test: each territory has a non-empty `name` string
- Add test: each territory has a non-empty `description` string
- Add test: descriptions follow curiosity framing pattern (start with lowercase "how", "what", "who", "when", "where", or "the")
- Verify all existing tests still pass

### Task 4: Verify Typecheck and Full Test Suite
- Run `pnpm turbo typecheck` to confirm no type errors
- Run `pnpm test:run` to confirm all tests pass
- Verify no downstream breakage from the type extension
