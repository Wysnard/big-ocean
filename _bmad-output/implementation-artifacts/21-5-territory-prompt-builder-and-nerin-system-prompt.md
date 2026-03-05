# Story 21-5: Territory Prompt Builder & Nerin System Prompt

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (required by pipeline orchestration in Story 1.7)
**Dependencies:** Story 21-1 (territory catalog), Story 21-3 (territory scoring)

## User Story

As a developer,
I want a prompt builder that looks up the territory catalog and formats guidance for Nerin,
So that Nerin receives topic-level direction without being exposed to scoring internals or facet targets.

## Acceptance Criteria

**AC1: Territory Prompt Builder**
**Given** a `SteeringOutput { territoryId }` and the territory catalog
**When** `buildTerritoryPrompt()` is called at `packages/domain/src/utils/steering/territory-prompt-builder.ts`
**Then** it looks up the territory by ID and returns formatted prompt content including: territory opener, territory domains, and territory energy level
**And** it does NOT include: expected facets, DRS value, or coverage data

**AC2: Nerin System Prompt Integration**
**Given** the prompt builder output
**When** `nerin-system-prompt.ts` is modified to use territory context
**Then** the facet-targeting section is replaced with territory guidance (topic area + energy level)
**And** Nerin's system prompt references the territory opener as a suggested direction, not a mandatory question

**AC3: Error Handling**
**Given** an invalid or missing territoryId
**When** `buildTerritoryPrompt()` is called
**Then** it fails with a descriptive domain error (not a silent fallback)

**AC4: Unit Tests**
**Given** the prompt builder and system prompt changes exist
**When** unit tests run
**Then** tests verify: correct catalog lookup, prompt contains opener/domains/energy but not facets/DRS/coverage, and invalid ID error handling

## Tasks

### Task 1: Create Territory Prompt Builder Function

**File:** `packages/domain/src/utils/steering/territory-prompt-builder.ts`

- Create `TerritoryPromptContent` interface with fields: `opener` (string), `domains` (readonly LifeDomain[]), `energyLevel` (EnergyLevel)
- Create `buildTerritoryPrompt(steeringOutput: SteeringOutput): TerritoryPromptContent` function that:
  - Looks up territory from `TERRITORY_CATALOG` by `steeringOutput.territoryId`
  - Returns `TerritoryPromptContent` with opener, domains, and energyLevel
  - Throws a descriptive error if territoryId is not found in catalog
- The function is pure (no Effect dependencies), returns plain data
- Does NOT include: expectedFacets, DRS, coverage data, or any scoring internals

### Task 2: Create Territory System Prompt Section Builder

**File:** `packages/domain/src/utils/steering/territory-prompt-builder.ts` (same file)

- Create `buildTerritorySystemPromptSection(content: TerritoryPromptContent): string` function that:
  - Formats the territory content into a prompt section for Nerin
  - Includes opener as a suggested direction (not mandatory question)
  - Includes domains for context
  - Includes energy level to guide conversational depth
  - Returns a formatted string ready for injection into the system prompt

### Task 3: Update Nerin System Prompt to Accept Territory Context

**File:** `packages/domain/src/utils/nerin-system-prompt.ts`

- Add `territoryPrompt?: TerritoryPromptContent` to `ChatSystemPromptParams`
- When `territoryPrompt` is provided, inject territory guidance section using `buildTerritorySystemPromptSection()`
- Territory guidance replaces the facet-targeting steering section (both old legacy format and micro-intent format)
- When `territoryPrompt` is provided, `targetDomain`, `targetFacet`, and `microIntent` are ignored
- Maintain backward compatibility: existing callers without `territoryPrompt` continue to work with the existing steering formats

### Task 4: Export from Steering Index and Domain Package Index

**File:** `packages/domain/src/utils/steering/index.ts`
**File:** `packages/domain/src/index.ts`

- Export `buildTerritoryPrompt`, `buildTerritorySystemPromptSection`, and `TerritoryPromptContent` from steering index
- Re-export from domain package index

### Task 5: Write Unit Tests

**File:** `packages/domain/src/utils/steering/__tests__/territory-prompt-builder.test.ts`

- Test `buildTerritoryPrompt()`:
  - Returns correct opener, domains, and energyLevel for a valid territory ID
  - Throws descriptive error for invalid territory ID
  - Does NOT include expectedFacets in the returned content
- Test `buildTerritorySystemPromptSection()`:
  - Output contains opener, domains, and energy level
  - Output does NOT contain facets, DRS, or coverage data
  - Energy level guidance text varies by level (light/medium/heavy)

**File:** `packages/domain/src/utils/__tests__/nerin-system-prompt-behavior.test.ts` (update existing)

- Add tests for territory prompt integration:
  - When `territoryPrompt` is provided, prompt contains territory guidance section
  - When `territoryPrompt` is provided, prompt does NOT contain facet-targeting steering
  - Territory opener appears in the prompt
  - Backward compatibility: existing tests continue to pass
