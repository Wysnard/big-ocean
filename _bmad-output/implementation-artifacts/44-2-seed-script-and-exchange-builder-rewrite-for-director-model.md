# Story 44-2: Seed Script & Exchange Builder Rewrite for Director Model

**Status:** ready-for-dev
**Epic:** Epic 2 — Director Model Codebase Cleanup & Development Tools (Epic 44)
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` — Story 2.2

## Story

As a **developer**,
I want the seed scripts updated to produce realistic Director-model exchange data,
So that local development and testing use data that matches the current pipeline architecture.

## Acceptance Criteria

### AC-1: Exchange Builder Produces Director Model Exchange Rows

**Given** `scripts/seed-completed-assessment.ts` does not currently create exchange rows
**When** the seed script is updated
**Then** it produces exchange rows with:
- `director_output`: realistic sample creative director briefs following the three-beat structure (Observation, Connection, Question)
- `coverage_targets`: valid `{ targetFacets: string[], targetDomain: string }` jsonb
- `extraction_tier`: populated with realistic tier values (1 for successful extraction)
**And** it does not call old pipeline functions (scorer, governor, selector, prompt-builder)
**And** it does not produce old pacing columns (energy, e_target, scorer_output, governor_output, etc.)

### AC-2: Seed Script Creates Complete Assessment with Exchanges

**Given** the seed script creates a test user with a completed assessment
**When** `pnpm seed:test-assessment` runs
**Then** it produces a complete assessment with 12 messages, 30 facet scores, 5 trait scores, ~30 evidence records (unchanged)
**And** exchange rows are created — one per conversation turn (6 turns for 12 messages: turn 0 greeting + 5 user-response turns)
**And** exchange rows contain valid director_output and coverage_targets
**And** messages are linked to their corresponding exchange via exchangeId

### AC-3: Seeded Data Consistent with Director Model Schema

**Given** `pnpm dev` auto-seeds the database
**When** a developer starts local development
**Then** the auto-seed produces Director-model-compatible data
**And** no errors related to missing pacing columns occur
**And** the exchange table contains rows matching the `assessmentExchange` schema (id, sessionId, turnNumber, extractionTier, directorOutput, coverageTargets, createdAt)

### AC-4: Evidence Records Linked to Exchanges

**Given** evidence extraction happens per exchange in the Director model pipeline
**When** evidence records are seeded
**Then** each evidence record has its `exchangeId` set to the exchange for the turn it belongs to
**And** the relationship between evidence, messages, and exchanges is consistent

## Tasks

### Task 1: Create Sample Director Briefs and Coverage Targets
- [ ] 1.1: Write 5 sample director briefs following the three-beat structure (one per user-response turn)
- [ ] 1.2: Write 5 corresponding coverage target objects with realistic targetFacets (3 facets each) and targetDomain values
- [ ] 1.3: Ensure sample data covers diverse domains and facets matching the conversation content

### Task 2: Add Exchange Row Creation to Seed Script
- [ ] 2.1: Import `assessmentExchange` from dbSchema
- [ ] 2.2: Create exchange rows — turn 0 (greeting, no director output) + turns 1-5 (with director output and coverage targets)
- [ ] 2.3: Set extractionTier to 1 for turns with evidence extraction
- [ ] 2.4: Store exchange record IDs for linking to messages and evidence

### Task 3: Link Messages to Exchanges
- [ ] 3.1: After inserting messages, update each message's `exchangeId` to the corresponding exchange
- [ ] 3.2: Turn 0: greeting assistant message linked to exchange turn 0
- [ ] 3.3: Turns 1-5: each user message + following assistant message linked to that turn's exchange

### Task 4: Link Evidence Records to Exchanges
- [ ] 4.1: Update evidence insertion to set `exchangeId` on each evidence record
- [ ] 4.2: Distribute evidence across turns 1-5 (matching the exchange they were "extracted" from)

### Task 5: Verify Seed Script Runs Successfully
- [ ] 5.1: Run `pnpm seed:test-assessment` and verify no errors
- [ ] 5.2: Verify exchange rows exist with valid director_output and coverage_targets
- [ ] 5.3: Verify messages are linked to exchanges
- [ ] 5.4: Verify evidence records are linked to exchanges
- [ ] 5.5: Run `pnpm turbo typecheck` — must pass

## Dev Notes

- The seed script at `scripts/seed-completed-assessment.ts` currently does NOT create any exchange rows. This story adds exchange row creation.
- The exchange table schema (from Story 43-1) has: id, sessionId, turnNumber, extractionTier, directorOutput, coverageTargets, createdAt.
- No old pipeline functions exist to call — they were deleted in Story 44-1.
- TDD approach: write a simple test that validates the shape of seed data constants (director briefs, coverage targets) before integrating into the seed script. The seed script itself is validated by running it.
- The `assessmentMessage` table has an `exchangeId` FK column that references `assessmentExchange`.
- The `conversationEvidence` table also has an `exchangeId` FK column.
- Story 44-3 depends on this story (barrel export cleanup references seed data).
