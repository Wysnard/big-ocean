# Story 43-6: ConversAnalyzer Cleanup — Strip User-State Extraction

**Status:** ready-for-dev

## Story

As a **system operator**,
I want the ConversAnalyzer's user-state extraction removed since the Director reads energy and telling natively from conversation history,
So that the evidence extraction pipeline is simpler and the eliminated LLM call reduces cost and latency.

**Epic:** Director Model Pipeline (Epic 43/44)
**Source:** epics-director-model.md, Story 1.6
**Depends on:** 43-5 (pipeline orchestrator rewrite — merged)

## Context

The Director model (Story 43-5) replaced the old 6-layer pacing pipeline. The old pipeline used user-state extraction (energy/telling bands) to compute E_target for territory scoring and steering. The Director model reads conversation energy natively from full conversation history, making user-state extraction dead code.

**ADR-27 status:** The split IS implemented (Story 42-2). ConversAnalyzer has separate `analyzeUserState` / `analyzeUserStateLenient` and `analyzeEvidence` / `analyzeEvidenceLenient` methods. The user-state call is a separate LLM call that runs in parallel with evidence extraction.

**Current pipeline (nerin-pipeline.ts):** Already only uses evidence output from `runSplitThreeTierExtraction`. The `ConversanalyzerV2Output.userState` field is populated but never read by the pipeline. The three-tier extraction still runs user-state extraction in parallel, wasting one Haiku call per turn.

## Acceptance Criteria

**AC1: User-state extraction call removed from pipeline**
- **Given** the three-tier extraction pipeline runs user-state and evidence in parallel
- **When** user-state extraction is removed
- **Then** `runSplitThreeTierExtraction` only runs evidence extraction (no parallel user-state call)
- **And** `runUserStateExtraction` function is deleted
- **And** `USER_STATE_NEUTRAL_DEFAULTS` constant is deleted
- **And** the pipeline cost and latency are reduced (one fewer Haiku call per turn)

**AC2: Repository interface stripped of user-state methods**
- **Given** the ConversAnalyzer repository interface exposes `analyzeUserState` and `analyzeUserStateLenient`
- **When** the interface is updated
- **Then** only `analyzeEvidence` and `analyzeEvidenceLenient` methods remain
- **And** the `ConversanalyzerUserState`, `ConversanalyzerUserStateOutput`, and `ConversanalyzerV2Output` types are removed
- **And** the `ConversanalyzerInput` type is preserved (used by evidence methods)

**AC3: Repository implementation cleaned up**
- **Given** the Anthropic repository implementation has `analyzeUserState` and `analyzeUserStateLenient` methods
- **When** they are removed
- **Then** `buildUserStatePrompt` function is deleted
- **And** `userStateOnlyJsonSchema` is no longer used or exported
- **And** the user-state model binding (`userStateModel`) is removed
- **And** evidence methods are unchanged

**AC4: Schemas cleaned up**
- **Given** `conversanalyzer-v2-extraction.ts` exports user-state schemas
- **When** user-state schemas are removed
- **Then** `UserStateSchema`, `UserStateOnlyToolOutput`, `LenientUserStateOnlyToolOutput`, `decodeUserStateStrict`, `decodeUserStateLenient`, `userStateOnlyJsonSchema`, and related types are deleted
- **And** evidence schemas are unchanged

**AC5: Mocks cleaned up**
- **Given** user-state extraction mocks exist in `__mocks__/` and `conversanalyzer.mock.repository.ts`
- **When** cleanup is applied
- **Then** `analyzeUserState` and `analyzeUserStateLenient` mock implementations are removed
- **And** `_setMockUserStateError`, `overrideUserStateError`, `defaultUserState`, `mockUserState` are removed
- **And** evidence extraction mocks are preserved and unchanged
- **And** `ConversanalyzerV2Output` references in mock helpers are replaced with evidence-only types

**AC6: Tests updated**
- **Given** multiple test files reference user-state extraction
- **When** tests are updated
- **Then** `conversanalyzer-energy.test.ts` is deleted entirely (tests user-state mock behavior)
- **And** `conversanalyzer-prompt-content.test.ts` user-state prompt tests are removed (evidence prompt tests preserved)
- **And** `conversanalyzer-v2-extraction.test.ts` user-state schema tests are removed (evidence schema tests preserved)
- **And** `three-tier-extraction.test.ts` is rewritten for evidence-only pipeline
- **And** `nerin-pipeline.test.ts` mock setup no longer includes `analyzeUserState` stubs
- **And** other test files with `analyzeUserState` mock stubs are updated
- **And** all remaining tests pass

**AC7: Domain index exports cleaned up**
- **Given** `packages/domain/src/index.ts` exports user-state types and schemas
- **When** dead exports are removed
- **Then** no user-state types, schemas, or decode functions are exported from `@workspace/domain`
- **And** evidence-related exports are unchanged

**AC8: Pipeline output type simplified**
- **Given** `ConversanalyzerV2Output` includes a `userState` field
- **When** the type is replaced
- **Then** the three-tier extraction output uses `ConversanalyzerEvidenceOutput` directly
- **And** `nerin-pipeline.ts` uses the evidence-only type for `pendingEvidence`

## Tasks

### Task 1: Remove user-state extraction from three-tier pipeline
- 1.1: Delete `runUserStateExtraction` function from `apps/api/src/use-cases/three-tier-extraction.ts`
- 1.2: Delete `USER_STATE_NEUTRAL_DEFAULTS` constant
- 1.3: Rewrite `runSplitThreeTierExtraction` to only run evidence extraction (no parallel, simpler)
- 1.4: Update `ThreeTierExtractionOutput` to return `ConversanalyzerEvidenceOutput` instead of `ConversanalyzerV2Output`
- 1.5: Rename `runSplitThreeTierExtraction` to `runThreeTierExtraction` (no longer "split")

### Task 2: Strip user-state from repository interface
- 2.1: Remove `analyzeUserState` and `analyzeUserStateLenient` from `ConversanalyzerRepository` tag in `packages/domain/src/repositories/conversanalyzer.repository.ts`
- 2.2: Delete `ConversanalyzerUserState`, `ConversanalyzerUserStateOutput`, `ConversanalyzerV2Output` types
- 2.3: Remove `EnergyBand`, `TellingBand` imports (no longer needed by repository)

### Task 3: Strip user-state from Anthropic repository implementation
- 3.1: Delete `buildUserStatePrompt` function from `conversanalyzer.anthropic.repository.ts`
- 3.2: Delete `analyzeUserState` and `analyzeUserStateLenient` method implementations
- 3.3: Remove `userStateModel` binding and `userStateOnlyJsonSchema` import
- 3.4: Remove `decodeUserStateStrict`, `decodeUserStateLenient` imports

### Task 4: Clean up schemas
- 4.1: Delete all user-state schema code from `conversanalyzer-v2-extraction.ts`: `UserStateSchema`, `UserStateOnlyToolOutput`, `LenientUserStateOnlyToolOutput`, `decodeUserStateStrict`, `decodeUserStateLenient`, `userStateOnlyJsonSchema`, `DEFAULT_USER_STATE`, related types
- 4.2: Remove `ENERGY_BANDS`, `TELLING_BANDS` imports from the schema file

### Task 5: Clean up mocks
- 5.1: Remove `analyzeUserState` and `analyzeUserStateLenient` from `__mocks__/conversanalyzer.anthropic.repository.ts`
- 5.2: Remove `defaultUserState`, `overrideUserStateError`, `_setMockUserStateError` from the mock
- 5.3: Remove `ConversanalyzerV2Output` and `ConversanalyzerUserStateOutput` type imports from mock
- 5.4: Remove `analyzeUserState` and `analyzeUserStateLenient` from `conversanalyzer.mock.repository.ts`
- 5.5: Remove `mockUserState`, `mockUserStateOutput` from mock repository

### Task 6: Update domain index exports
- 6.1: Remove all user-state type and schema exports from `packages/domain/src/index.ts`

### Task 7: Update nerin-pipeline.ts
- 7.1: Replace `ConversanalyzerV2Output` import with `ConversanalyzerEvidenceOutput`
- 7.2: Update `pendingEvidence` type annotation
- 7.3: Update `runSplitThreeTierExtraction` call to `runThreeTierExtraction`

### Task 8: Update tests
- 8.1: Delete `conversanalyzer-energy.test.ts` entirely
- 8.2: Remove user-state prompt tests from `conversanalyzer-prompt-content.test.ts`
- 8.3: Remove user-state schema tests from `conversanalyzer-v2-extraction.test.ts`
- 8.4: Rewrite `three-tier-extraction.test.ts` for evidence-only pipeline
- 8.5: Update `nerin-pipeline.test.ts` — remove `analyzeUserState` mock stubs
- 8.6: Update `extraction-pipeline-evidence-processing.test.ts` — remove user-state mock stubs
- 8.7: Update `send-message-steering.use-case.test.ts` — remove user-state mock stubs
- 8.8: Update `send-message-evidence-caps.use-case.test.ts` — remove user-state mock stubs
- 8.9: Update `send-message-conversanalyzer.use-case.test.ts` — remove user-state mock stubs
