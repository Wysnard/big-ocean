# Story 18-6: Update Portrait Generators to Use Conversation Evidence

**Status:** ready-for-dev
**Epic:** 18 (Pipeline Epic 3: Smarter Evidence, Better Scores)
**Depends on:** 18-4 (Rewrite Finalization Pipeline with Staged Idempotency)
**Blocks:** none

## User Story

As a user viewing my portrait,
I want the portrait generated from the same evidence used for scoring,
So that my portrait narrative and scores are consistent and based on the same data.

## Acceptance Criteria

1. **Given** portrait generation (`generate-full-portrait`, `generate-relationship-analysis`)
   **When** fetching evidence for portrait input
   **Then** they read from `conversation_evidence` (via `ConversationEvidenceRepository`) instead of `finalization_evidence` (via `FinalizationEvidenceRepository`)

2. **Given** the portrait generator repository (`PortraitGenerationInput`)
   **When** updated
   **Then** the `allEvidence` field accepts `ConversationEvidenceRecord[]` instead of `SavedFacetEvidence[]`

3. **Given** the relationship analysis generator repository (`RelationshipAnalysisGenerationInput`)
   **When** updated
   **Then** the evidence fields accept `ConversationEvidenceRecord[]` instead of `SavedFacetEvidence[]`

4. **Given** portrait prompt formatting (`portrait-prompt.utils.ts`)
   **When** `formatEvidence()` is called
   **Then** it formats v2 conversation evidence fields (deviation/strength/confidence/note) instead of legacy fields (score/confidence/quote)

5. **Given** all existing tests for portrait and relationship analysis generation
   **When** updated for v2 evidence shapes
   **Then** they pass with conversation evidence records

## Tasks

### Task 1: Update `generate-full-portrait.use-case.ts` to use ConversationEvidenceRepository
- Replace `FinalizationEvidenceRepository` import with `ConversationEvidenceRepository`
- Fetch evidence via `conversationEvidenceRepo.findBySession(sessionId)` instead of `evidenceRepo.getByResultId(resultId)`
- Remove the `SavedFacetEvidence[]` mapping (legacy adapter) — conversation evidence is the native format
- Remove the v1→v2 adapter that converts `score`/`confidence` floats to `deviation`/`strength`/`confidence` enums
- Pass `ConversationEvidenceRecord[]` directly as scoring evidence

### Task 2: Update `PortraitGenerationInput` and `portrait-generator.claude.repository.ts`
- Change `allEvidence` type from `ReadonlyArray<SavedFacetEvidence>` to `ReadonlyArray<ConversationEvidenceRecord>`
- Update `portrait-prompt.utils.ts` `formatEvidence()` to format v2 fields (deviation, strength, confidence, note) instead of legacy fields (score, confidence, quote)
- Update `computeDepthSignal()` input type if needed (already uses `DepthSignalEvidence` which matches)

### Task 3: Update `generate-relationship-analysis.use-case.ts` to use ConversationEvidenceRepository
- Replace `FinalizationEvidenceRepository` import with `ConversationEvidenceRepository`
- Fetch evidence via `conversationEvidenceRepo.findBySession(sessionId)` instead of `evidenceRepo.getByResultId(resultId)`
- Remove the `SavedFacetEvidence[]` mapping
- Update `RelationshipAnalysisGenerationInput` to accept `ConversationEvidenceRecord[]` instead of `SavedFacetEvidence[]`

### Task 4: Update tests
- Update `generate-full-portrait.use-case.test.ts` mock data and layer to use `ConversationEvidenceRepository`
- Update `generate-relationship-analysis.use-case.test.ts` mock data and layer to use `ConversationEvidenceRepository`
- Ensure evidence fixtures use v2 shape (deviation, strength, confidence, note)

### Task 5: Update portrait-generator mock
- Update `__mocks__/portrait-generator.claude.repository.ts` if it references evidence types
