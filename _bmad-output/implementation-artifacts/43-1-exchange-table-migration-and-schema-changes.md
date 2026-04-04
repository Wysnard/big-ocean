# Story 43-1: Exchange Table Migration & Schema Changes

**Status:** ready-for-dev
**Epic:** Epic 1 — Director-Steered Conversations (Director Model)
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` — Story 1.1

## User Story

As a **system operator**,
I want the exchange table updated to store Director model output and the old pacing columns removed,
So that the pipeline can persist Director briefs and coverage targets for each turn.

## Acceptance Criteria

### AC1: Drop pacing/scoring/governor columns from assessment_exchange

**Given** the assessment_exchange table has ~15 pacing/scoring/governor columns (energy, energy_band, telling, telling_band, within_message_shift, state_notes, smoothed_energy, session_trust, drain, trust_cap, e_target, scorer_output, selected_territory, selection_rule, governor_output, governor_debug, session_phase, transition_type)
**When** a new Drizzle migration is applied
**Then** those columns are dropped from assessment_exchange
**And** `director_output` (text, nullable) is added to assessment_exchange
**And** `coverage_targets` (jsonb, nullable) is added to assessment_exchange
**And** the migration file is appended (existing migrations untouched)

### AC2: Assessment message cleanup (verify already done)

**Given** assessment_message may have territory_id and observed_energy_level columns
**When** the migration runs
**Then** those columns are dropped from assessment_message if present
(Note: Story 23-3 already dropped these — verify and skip if confirmed)

### AC3: Schema.ts reflects new column structure

**Given** the schema.ts file in infrastructure
**When** the Drizzle schema is updated
**Then** it reflects the new column structure (director_output, coverage_targets added; pacing columns removed)
**And** TypeScript compilation succeeds with no type errors in schema references

### AC4: Existing data preserved

**Given** existing exchange data in the database
**When** the migration runs
**Then** existing rows are preserved (new columns are nullable — no data loss)

### AC5: Repository interface updated

**Given** the domain repository interface for assessment exchanges
**When** the interface is updated
**Then** AssessmentExchangeUpdateInput reflects director_output and coverage_targets instead of old pacing fields
**And** AssessmentExchangeRecord reflects the new column structure
**And** all consumers of the interface compile without errors

### AC6: Mock repository updated

**Given** the in-memory mock for assessment exchanges
**When** the mock is updated
**Then** it produces records matching the new AssessmentExchangeRecord shape
**And** all tests using the mock compile and pass

## Tasks

### Task 1: Write the SQL migration file
- Create `drizzle/20260404200000_director_model_exchange/migration.sql`
- DROP 18 columns from assessment_exchange: energy, energy_band, telling, telling_band, within_message_shift, state_notes, smoothed_energy, session_trust, drain, trust_cap, e_target, scorer_output, selected_territory, selection_rule, governor_output, governor_debug, session_phase, transition_type
- ADD director_output (text, nullable)
- ADD coverage_targets (jsonb, nullable)
- Verify assessment_message territory_id / observed_energy_level already dropped (skip if so)

### Task 2: Update Drizzle schema (schema.ts)
- Remove all 18 pacing columns from assessmentExchange table definition
- Add director_output (text, nullable) and coverage_targets (jsonb, nullable)
- Update the JSDoc comment to reflect Director model

### Task 3: Update domain repository interface
- Update `AssessmentExchangeUpdateInput` in `packages/domain/src/repositories/assessment-exchange.repository.ts`
  - Remove all pacing/scoring/governor/derived fields
  - Add `directorOutput?: string` and `coverageTargets?: unknown`
  - Keep `extractionTier`
- Update `AssessmentExchangeRecord` similarly
- Remove imports of pacing-pipeline types that are no longer needed

### Task 4: Update Drizzle repository implementation
- Update `assessment-exchange.drizzle.repository.ts` to remove references to dropped columns
- Update `findByUserId` select to use new column names

### Task 5: Update mock repository
- Update `__mocks__/assessment-exchange.drizzle.repository.ts` to match new record shape

### Task 6: Update domain barrel exports
- Check `packages/domain/src/index.ts` — remove pacing-pipeline type re-exports if exclusively used by exchange interface

### Task 7: Write unit tests
- Test that AssessmentExchangeRecord type includes director_output and coverage_targets
- Test that mock create/update/findBySession work with new shape
- Verify typecheck passes across all packages

## Technical Notes

- **Migration rule:** Never modify existing migration files — always append new migration
- **Schema change cascade rule:** Check seed scripts, test fixtures, and mocks after schema changes
- territory_id and observed_energy_level were already dropped from assessment_message in Story 23-3 — confirm via schema.ts comment
- The pacing-pipeline.types.ts file exports types still used elsewhere (e.g., ExtractionTier is used by the extraction pipeline) — do NOT delete the file; only remove types no longer imported by the exchange interface
- The nerin-pipeline.ts currently writes pacing columns to exchanges — this story must also update the exchange update calls in nerin-pipeline.ts to only pass surviving fields (extractionTier) to avoid compilation failure. Full pipeline rewrite is Story 1.5

## Architect Notes

### Finding: nerin-pipeline.ts will fail to compile after interface change

**Severity:** Major
**File:** `apps/api/src/use-cases/nerin-pipeline.ts` (lines ~736-792)
**Action:** Update the two `exchangeRepo.update()` calls:
1. Line ~736: Previous exchange update — currently passes energy, energyBand, telling, tellingBand, withinMessageShift, extractionTier. After change, only pass `extractionTier` (the only surviving field). The rest of the extraction data is no longer persisted — this is intentional; the Director reads energy/telling natively from conversation history.
2. Line ~764: New exchange update — currently passes all pacing/scoring/governor/derived fields. After change, pass empty object `{}` or remove the call. The Director model pipeline (Story 1.5) will populate director_output and coverage_targets here.

**Pattern:** Keep the update calls in place with reduced fields. Do not remove pipeline logic (that is Story 1.5's job). The update calls become thin/no-ops.

### Finding: Test fixtures and assertions reference old exchange fields

**Severity:** Major
**Files to update:**
- `apps/api/src/use-cases/__tests__/__fixtures__/send-message.fixtures.ts` — `mockExchangeRecord` (lines 284-307)
- `apps/api/src/use-cases/__tests__/__fixtures__/start-assessment.fixtures.ts` — exchange record shapes
- `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts` — assertions on update call args (steeringUpdate, extractionUpdate)
- `apps/api/src/use-cases/__tests__/send-message-steering.use-case.test.ts` — exchange update assertions
- `apps/api/src/use-cases/__tests__/extraction-pipeline-evidence-processing.test.ts` — extractionUpdate / steeringUpdate assertions
- `apps/api/src/use-cases/__tests__/check-check-in.use-case.test.ts` — exchange update calls
- `apps/api/src/use-cases/__tests__/check-drop-off.use-case.test.ts` — exchange update calls
- `apps/api/src/use-cases/__tests__/resume-session-pipeline.test.ts` — exchange field references

**Action:** Update all `mockExchangeRecord` shapes to match new `AssessmentExchangeRecord`. Update assertions that check for old pacing fields to check for new Director fields (or remove assertions about fields that no longer exist). Tests that validate pipeline steering behavior will need substantial rewrites in Story 1.5 — for this story, make them compile and pass with the new types.
