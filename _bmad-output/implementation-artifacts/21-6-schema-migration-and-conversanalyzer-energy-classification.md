# Story 21-6: Schema Migration & ConversAnalyzer Energy Classification

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (required by pipeline orchestration in Story 1.7)
**Dependencies:** Story 21-1 (territory types), Story 21-5 (territory prompt builder)

## User Story

As a developer,
I want two new columns on assessment_messages and ConversAnalyzer energy classification output,
So that each exchange records which territory was explored and the user's observed emotional energy.

## Acceptance Criteria

**AC1: Drizzle Schema Update**
**Given** the existing `assessment_messages` table
**When** the Drizzle schema is updated at `packages/infrastructure/src/db/drizzle/schema.ts`
**Then** `assessmentMessage` table definition includes `territoryId` (nullable text) and `observedEnergyLevel` (nullable text) columns
**And** `territory_id` is a snapshot string (not a foreign key) -- survives catalog evolution
**And** existing rows are unaffected (no data migration needed)

**AC2: SQL Migration**
**Given** the updated Drizzle schema
**When** the migration SQL is created at `drizzle/YYYYMMDD_story_21_6_territory_energy_columns/migration.sql`
**Then** two nullable VARCHAR columns are added: `territory_id` and `observed_energy_level`
**And** the migration is additive only (ALTER TABLE ADD COLUMN)

**AC3: ConversAnalyzer Output Includes Energy Level**
**Given** a user message and Nerin response sent to ConversAnalyzer
**When** the ConversAnalyzer analyzes the exchange
**Then** its output interface `ConversanalyzerOutput` includes `observedEnergyLevel: EnergyLevel` alongside the existing `evidence` array
**And** no additional LLM call is made -- energy classification happens in the existing Haiku call (NFR2)
**And** the energy classification prompt instructs classification by emotional weight, not message length

**AC4: ConversAnalyzer Does Not Receive Expected Facets**
**Given** ConversAnalyzer does NOT receive expected facets in its prompt
**When** evidence is extracted
**Then** extraction remains unbiased by territory expectations (anti-pattern enforcement)

**AC5: ConversAnalyzer Mock Updated**
**Given** the ConversAnalyzer mock at `__mocks__/conversanalyzer.anthropic.repository.ts`
**When** the mock is updated
**Then** it returns `observedEnergyLevel: "medium"` as default
**And** tests can override via `_setMockOutput()` for specific energy scenarios

**AC6: Message Entity Schema Updated**
**Given** the message entity at `packages/domain/src/entities/message.entity.ts`
**When** the entity schema is updated
**Then** `AssessmentAssistantMessageEntity` includes optional nullable `territoryId` and `observedEnergyLevel` fields
**And** `AssessmentHumanMessageEntity` is unchanged

**AC7: Assessment Message Repository Updated**
**Given** the `AssessmentMessageRepository` interface
**When** `saveMessage` is updated
**Then** it accepts optional `territoryId` and `observedEnergyLevel` parameters
**And** existing callers without these parameters continue to work (backward compatible)

**AC8: Unit Tests**
**Given** the schema, mock, and repository changes exist
**When** unit tests run
**Then** tests verify: ConversAnalyzer mock returns observedEnergyLevel, message repository saves and retrieves territory metadata, and the Drizzle schema compiles with new columns

## Tasks

### Task 1: Update Drizzle Schema with New Columns

**File:** `packages/infrastructure/src/db/drizzle/schema.ts`

- Add `territoryId: text("territory_id")` (nullable) to `assessmentMessage` table definition
- Add `observedEnergyLevel: text("observed_energy_level")` (nullable) to `assessmentMessage` table definition
- Both are plain text columns (not enums, not FK) -- territory_id is a snapshot string, observedEnergyLevel is LLM output

### Task 2: Create SQL Migration

**File:** `drizzle/20260305000000_story_21_6_territory_energy_columns/migration.sql`

- Write hand-crafted migration SQL:
  ```sql
  ALTER TABLE "assessment_message" ADD COLUMN "territory_id" text;
  ALTER TABLE "assessment_message" ADD COLUMN "observed_energy_level" text;
  ```
- No data migration needed -- existing rows get NULL values

### Task 3: Update ConversAnalyzer Output Interface

**File:** `packages/domain/src/repositories/conversanalyzer.repository.ts`

- Add `observedEnergyLevel` field to `ConversanalyzerOutput` interface:
  ```typescript
  readonly observedEnergyLevel: EnergyLevel;
  ```
- Import `EnergyLevel` from territory types

### Task 4: Update ConversAnalyzer Prompt and Schema for Energy Classification

**File:** `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`

- Add `observedEnergyLevel` to the Effect Schema (`EvidenceExtractionSchema`) with `S.Literal("light", "medium", "heavy")`
- Add energy classification instruction to `buildPrompt()`:
  - Classify observed emotional weight as light/medium/heavy
  - Based on emotional weight of the user's response (not message length)
  - Light: casual, surface-level sharing
  - Medium: some self-reflection, moderate vulnerability
  - Heavy: deep emotional disclosure, high vulnerability
- Update `mockAnalyze()` to include `observedEnergyLevel: "medium"` in mock return
- Map the new field through to `ConversanalyzerOutput` in both real and mock paths

### Task 5: Update ConversAnalyzer Mock

**File:** `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts`

- Add `observedEnergyLevel: "medium"` to `defaultOutput`
- Ensure `_setMockOutput()` type accepts `observedEnergyLevel`

### Task 6: Update Message Entity Schema

**File:** `packages/domain/src/entities/message.entity.ts`

- Add `territoryId` and `observedEnergyLevel` as optional nullable fields to `AssessmentAssistantMessageEntitySchema`
- Use `Schema.optionalWith(Schema.NullOr(Schema.String), { default: () => null })` pattern (matches `intentType`)

### Task 7: Update Assessment Message Repository Interface

**File:** `packages/domain/src/repositories/assessment-message.repository.ts`

- Add `territoryId?: string` and `observedEnergyLevel?: string` optional parameters to `saveMessage`
- Maintain backward compatibility -- all new params are optional

### Task 8: Update Assessment Message Repository Implementation

**File:** `packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts`

- Accept new `territoryId` and `observedEnergyLevel` parameters in `saveMessage`
- Pass them through to the Drizzle insert `.values()` call

### Task 9: Update Assessment Message Repository Mock

**File:** `packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts`

- Accept new `territoryId` and `observedEnergyLevel` parameters in the mock `saveMessage`
- Store them in the in-memory message map

### Task 10: Write Unit Tests

**File:** `packages/infrastructure/src/repositories/__tests__/conversanalyzer-energy.test.ts`

- Test that `ConversanalyzerOutput` type includes `observedEnergyLevel`
- Test that mock returns `observedEnergyLevel: "medium"` by default
- Test that mock can be overridden with different energy levels

**File:** `packages/infrastructure/src/repositories/__tests__/assessment-message-territory.test.ts`

- Test that `saveMessage` with territory metadata stores and retrieves correctly
- Test backward compatibility -- `saveMessage` without territory params still works

### Task 11: Re-export Updated Types from Package Indexes

**File:** `packages/domain/src/index.ts` (verify `ConversanalyzerOutput` is already exported)
**File:** `packages/infrastructure/src/index.ts` (verify exports)

- Ensure all updated types are accessible via workspace imports
