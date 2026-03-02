---
status: ready-for-dev
story_id: "18-4"
epic: 3
created_date: 2026-03-02
completed_date: null
depends_on: ["18-1", "18-2", "18-3"]
blocks: ["18-5", "18-6"]
---

# Story 18-4: Rewrite Finalization Pipeline with Staged Idempotency

## Story

As a **user completing an assessment**,
I want **results generated reliably with idempotent stages**,
So that **partial failures don't corrupt my results and retries are safe**.

## Acceptance Criteria

### Read Conversation Evidence as Authoritative Source

**Given** `generate-results.use-case.ts`
**When** rewritten
**Then** it reads `conversation_evidence` (not `finalization_evidence`) as the authoritative evidence source
**And** the pipeline is: acquire lock → upsert `assessment_results` → compute scores + portrait → set `stage=scored` (single transaction) → set `stage=completed` + session status (Pattern 3)

### Stage Column on assessment_results

**Given** `assessment_results` table
**When** updated
**Then** it has a `stage` enum column (`scored`, `completed`) and a `UNIQUE(assessmentSessionId)` constraint
**And** `updateStage()` method is added to the repository interface and implementation

### Idempotency on Re-Entry

**Given** idempotency on re-entry
**When** `generate-results` is called for a session already at `stage=scored`
**Then** it skips scoring, proceeds to completion
**When** called for `stage=completed`
**Then** it returns immediately

## Tasks

### Task 1: Add `stage` enum column to `assessment_results` schema

- Add `resultStageEnum` pgEnum with values `['scored', 'completed']` in `packages/infrastructure/src/db/drizzle/schema.ts`
- Add `stage` column to `assessmentResults` table (nullable to support existing rows, defaults to null)
- Add `uniqueIndex` on `assessmentSessionId` to enforce one result per session
- Generate migration via `pnpm db:generate`

### Task 2: Update repository interface with `updateStage()` and `upsert()`

- Add `updateStage(sessionId: string, stage: "scored" | "completed")` to `AssessmentResultRepository` interface in `packages/domain/src/repositories/assessment-result.repository.ts`
- Add `upsert(input: AssessmentResultInput)` method that inserts or updates on conflict(`assessmentSessionId`)
- Update `AssessmentResultRecord` to include `stage: "scored" | "completed" | null`

### Task 3: Implement `updateStage()` and `upsert()` in Drizzle repository

- Implement `updateStage()` in `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` — update stage column where `assessmentSessionId` matches
- Implement `upsert()` using Drizzle's `onConflictDoUpdate` on the `assessmentSessionId` unique index

### Task 4: Update mock repository

- Update `__mocks__/assessment-result.drizzle.repository.ts` to include `updateStage()` and `upsert()` methods

### Task 5: Rewrite `generate-results.use-case.ts`

- Remove all FinAnalyzer and finalization_evidence references
- Read conversation evidence via `ConversationEvidenceRepository.findBySession(sessionId)`
- Map conversation evidence (v2 format) to `EvidenceInput[]` for scoring
- Pipeline stages:
  1. Check idempotency: if result exists at `stage=completed`, return immediately
  2. If result exists at `stage=scored`, skip to completion stage
  3. Acquire lock
  4. Upsert assessment_results with scores + portrait, set `stage=scored`
  5. Mark session completed, set `stage=completed`
- Remove `FinanalyzerRepository` and `FinalizationEvidenceRepository` from dependencies

### Task 6: Write tests for staged idempotency

- Test: session with no result → full pipeline runs, stage transitions `null → scored → completed`
- Test: session with result at `stage=scored` → skips scoring, completes
- Test: session with result at `stage=completed` → returns immediately
- Test: conversation evidence is read (not finalization evidence)
- Test: lock acquisition and release
