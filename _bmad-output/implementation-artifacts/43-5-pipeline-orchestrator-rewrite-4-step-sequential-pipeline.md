# Story 43-5: Pipeline Orchestrator Rewrite — 4-Step Sequential Pipeline

**Status:** ready-for-dev
**Epic:** Epic 1 — Director-Steered Conversations (Director Model)
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` — Story 1.5

## Story

As a **system operator**,
I want the conversation pipeline rewritten from the 6-layer pacing system to a 4-step Director model pipeline,
So that each user message produces an intelligently steered, character-voiced response through evidence -> coverage -> Director -> Actor.

## Acceptance Criteria

### AC-1: 4-Step Sequential Pipeline

**Given** a user sends a message during their conversation
**When** the pipeline processes it
**Then** the following steps execute sequentially:
1. Evidence extraction (existing Haiku call, three-tier fail-open unchanged)
2. Coverage analysis (pure function — reads all session evidence, returns targets)
3. Nerin Director (receives system prompt + full history + coverage targets, returns brief)
4. Nerin Actor (receives actor prompt + brief, returns response)
**And** the exchange is saved with `director_output`, `coverage_targets`, and `extraction_tier`
**And** user + assistant messages are saved

### AC-2: Evidence Idempotency on Retry

**Given** a user retries after a Nerin Director failure (ADR-DM-4)
**When** the pipeline processes the retry
**Then** evidence extraction is skipped if evidence already exists for this exchange (idempotency)
**And** the exchange row created before the Director call serves as the idempotency anchor
**And** coverage analysis re-runs (cheap — pure function)
**And** Director + Actor execute normally

### AC-3: Greeting (Turn 0) Unchanged

**Given** it is turn 0 (greeting)
**When** the conversation starts
**Then** the greeting is a pre-generated static message (unchanged behavior)
**And** the Director/Actor pipeline does NOT run on turn 0

### AC-4: Closing Turn — Director Prompt Swap

**Given** it is the last turn (turn 25 or configured limit)
**When** the pipeline processes the message
**Then** it swaps the Director system prompt to the closing variant (`NERIN_DIRECTOR_CLOSING_PROMPT`)
**And** Nerin Actor voices the brief normally
**And** after Actor's response, a static farewell message is appended (from `pickFarewellMessage`)

### AC-5: Fail-Open Behavior Preserved

**Given** evidence extraction defaults to neutral (Tier 3, empty evidence)
**When** the coverage analyzer runs
**Then** it uses prior evidence only (current turn contributes nothing)
**And** the Director gets slightly stale targets
**And** the conversation continues normally

**Given** Nerin Director fails after retry (ADR-DM-4)
**When** the error propagates
**Then** the pipeline surfaces the error to the caller (user retries the message)
**And** evidence already saved is NOT duplicated on retry (AC-2)

### AC-6: Exchange Persistence

**Given** the pipeline completes successfully
**When** the exchange is persisted
**Then** `director_output` contains the Director's brief text
**And** `coverage_targets` contains the serialized `CoverageTarget` (targetFacets + targetDomain)
**And** `extraction_tier` contains the evidence extraction tier (1, 2, or 3)
**And** `pg_try_advisory_lock` per session prevents duplicate processing (unchanged)

### AC-7: Old Pacing Code Removed from Pipeline

**Given** the pipeline rewrite is complete
**When** `nerin-pipeline.ts` is examined
**Then** it no longer imports or calls: `computeETargetV2`, `scoreAllTerritoriesV2`, `selectTerritoryV2`, `computeGovernorOutput`, `buildPrompt`, `buildSurfacingPrompt`, `TERRITORY_CATALOG`, `PACING_SCORER_DEFAULTS`, `mapEnergyBand`, `mapTellingBand`
**And** helper functions `buildPacingVisitHistory`, `extractEnergyHistory`, `extractTellingHistory`, `getCurrentTerritory`, `computeObservationFocusInputs`, `countSharedFires` are removed
**And** the `NerinAgentRepository` dependency is replaced by `NerinActorRepository` and `NerinDirectorRepository`

### AC-8: Cost Tracking Preserved

**Given** the pipeline runs the Director + Actor calls
**When** cost is tracked
**Then** all three LLM calls (evidence extraction + Director + Actor) are summed for cost tracking
**And** daily cost and session cost are incremented (fail-open)

### AC-9: All Existing Tests Updated and Pass

**Given** the pipeline rewrite is complete
**When** the full test suite runs
**Then** `pnpm turbo typecheck` passes
**And** `pnpm test:run` passes for `nerin-pipeline.test.ts`
**And** no import errors or unresolved references remain

## Tasks

### Task 1: Rewrite `nerin-pipeline.ts` — Remove Old Pacing, Wire 4-Step Pipeline

**Subtasks:**

1.1. Remove all old pacing imports (`computeETargetV2`, `scoreAllTerritoriesV2`, `selectTerritoryV2`, `computeGovernorOutput`, `buildPrompt`, `buildSurfacingPrompt`, `TERRITORY_CATALOG`, `PACING_SCORER_DEFAULTS`, `mapEnergyBand`, `mapTellingBand`, `OBSERVATION_FOCUS_CONSTANTS`, `deriveSessionPhase`, `deriveTransitionType`, and related types)

1.2. Remove helper functions (`buildPacingVisitHistory`, `extractEnergyHistory`, `extractTellingHistory`, `getCurrentTerritory`, `computeObservationFocusInputs`, `countSharedFires`)

1.3. Replace `NerinAgentRepository` dependency with `NerinDirectorRepository` and `NerinActorRepository`

1.4. Add imports for: `analyzeCoverage`, `enrichWithDefinitions`, `NERIN_DIRECTOR_PROMPT`, `NERIN_DIRECTOR_CLOSING_PROMPT`, `buildDirectorUserMessage`, `buildActorPrompt`, `NerinDirectorRepository`, `NerinActorRepository`

1.5. Wire Step 1: Evidence extraction (keep existing `runSplitThreeTierExtraction` call, but only use evidence output — user state is no longer needed)

1.6. Wire Step 2: Coverage analysis — call `analyzeCoverage(allEvidenceWithCurrent)` then `enrichWithDefinitions(target)`

1.7. Wire Step 3: Nerin Director — call `generateBrief()` with system prompt (main or closing variant based on `isFinalTurn`), full conversation history, and coverage targets

1.8. Wire Step 4: Nerin Actor — call `invoke()` with `buildActorPrompt()` and the Director's brief

1.9. Implement evidence idempotency: check `evidenceRepo.countByMessage` or similar before extraction to skip on retry

1.10. Update exchange persistence: save `director_output`, `coverage_targets`, `extraction_tier` via `exchangeRepo.update()`

1.11. Update cost tracking to include Director token usage

1.12. Handle closing turn: swap Director prompt to `NERIN_DIRECTOR_CLOSING_PROMPT`, append farewell message after Actor response

### Task 2: Rewrite `nerin-pipeline.test.ts` — Update Tests for Director Model

**Subtasks:**

2.1. Replace mock repos: remove `mockNerinRepo` (NerinAgentRepository), add `mockDirectorRepo` (NerinDirectorRepository) and `mockActorRepo` (NerinActorRepository)

2.2. Update test data: exchange records should match new `AssessmentExchangeRecord` shape (no pacing fields)

2.3. Write test: normal turn — evidence extracted, coverage analyzed, Director called, Actor called, exchange saved with director_output and coverage_targets

2.4. Write test: final turn — closing Director prompt used, farewell message appended

2.5. Write test: evidence idempotency — evidence already exists for exchange, extraction skipped on retry

2.6. Write test: Director failure — error propagates to caller

2.7. Write test: evidence extraction Tier 3 (neutral defaults) — pipeline continues with empty evidence, Director still called

2.8. Write test: cost tracking includes Director + Actor + extraction costs
