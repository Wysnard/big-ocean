# Story 42-4: Pipeline Integration -- Wire Two-Call Extraction into nerin-pipeline

**Status:** ready-for-dev

**Epic:** Epic 3 -- Evidence Extraction v3 -- Polarity Model
**Depends on:** Story 42-1 (polarity schema + adapter), Story 42-2 (split ConversAnalyzer), Story 42-3 (v3 extraction prompt)

## Description

As a **system operator**,
I want the nerin-pipeline orchestrator updated to call user state extraction then evidence extraction sequentially, integrating the polarity adapter and fail-open behavior,
So that the full pacing pipeline works end-to-end with the new two-call extraction model.

## Acceptance Criteria

**AC1: Sequential two-call extraction**
**Given** nerin-pipeline.ts currently calls ConversAnalyzer via `runSplitThreeTierExtraction`
**When** the orchestrator is updated
**Then** it calls `analyzeUserState` first, then `analyzeEvidence` second (sequential, not parallel)
**And** user state output feeds into E_target computation (unchanged)
**And** evidence output passes through the `deriveDeviation` adapter before being saved and fed to the scorer

**AC2: User state failure independence**
**Given** Call 1 (user state) fails after all retries
**When** neutral defaults are applied (energy=0.5, telling=0.5)
**Then** the pipeline continues with comfort-level pacing
**And** Call 2 (evidence) still executes independently

**AC3: Evidence failure independence**
**Given** Call 2 (evidence) fails after all retries
**When** neutral defaults are applied (evidence=[])
**Then** the pipeline continues -- no evidence saved for this turn, no scoring update
**And** the conversation is not interrupted

**AC4: Polarity column saved**
**Given** the full pipeline runs end-to-end
**When** evidence is saved via the evidence repository
**Then** evidence is saved with both polarity and deviation columns populated
**And** the territory scorer receives correct coverage data from the new evidence

**AC5: Existing pipeline tests pass**
**Given** the polarity model is wired into the pipeline
**When** all existing pipeline tests run
**Then** all existing tests pass (NFR-S6)

## Tasks

### Task 1: Update `runSplitThreeTierExtraction` to run sequentially
- Change `Effect.all` with `{ concurrency: 2 }` to sequential execution (user state first, then evidence)
- Both calls remain independent with their own three-tier fallback
- File: `apps/api/src/use-cases/three-tier-extraction.ts`

### Task 2: Wire polarity through evidence save path in nerin-pipeline
- In the evidence save step of `nerin-pipeline.ts`, pass `polarity` field from evidence items to the `ConversationEvidenceInput`
- The evidence items returned from `ConversanalyzerEvidenceOutput` already contain polarity (from v3 extraction schema in Story 42-3)
- Ensure polarity is included in the spread when mapping evidence to save input
- File: `apps/api/src/use-cases/nerin-pipeline.ts`

### Task 3: Update nerin-pipeline tests for polarity field
- Update mock evidence data in nerin-pipeline tests to include polarity field
- Add test case verifying polarity is passed through to evidence save
- Verify existing tests still pass
- File: `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`

### Task 4: Update three-tier-extraction tests for sequential execution
- Update tests to verify user state extraction completes before evidence extraction starts
- Verify independent failure handling still works
- File: `apps/api/src/use-cases/__tests__/three-tier-extraction.test.ts`
