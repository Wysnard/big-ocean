---
status: ready-for-dev
story_id: "24-2"
epic: 24
created_date: 2026-03-13
blocked_by: [24-1]
---

# Story 24-2: Three-Tier Extraction Pipeline

## Story

As a developer,
I want the extraction orchestration to retry with decreasing strictness and fall back to neutral defaults,
So that the conversation never breaks due to extraction failure — it just becomes less steered.

## Acceptance Criteria

### Three-Tier Strategy
**Given** the ConversAnalyzer v2 repository methods from Story 2.1
**When** the extraction pipeline is orchestrated using Effect
**Then** it follows the three-tier strategy:
- Tier 1: `analyze(input)` with `Effect.retry(Schedule.recurs(2))` — strict schema x 3 attempts
- Tier 2: `analyzeLenient(input)` via `Effect.orElse` — lenient schema x 1 attempt
- Tier 3: `Effect.catchAll(() => Effect.succeed(NEUTRAL_DEFAULTS))` — no LLM call

### Neutral Defaults (Tier 3)
**Given** neutral defaults are applied (Tier 3)
**When** the pipeline continues
**Then** `energy = 0.5`, `energyBand = "steady"`, `telling = 0.5`, `tellingBand = "mixed"`, `withinMessageShift = false`, `evidence = []`
**And** E_target computes to approximately 0.5 (comfort midpoint)
**And** trust = 1.0 (neutral — no momentum modification)
**And** the scorer uses prior coverage gaps (no new evidence this turn)

### Extraction Tier Logging and Storage
**Given** extraction succeeds at any tier
**When** the result is processed
**Then** the extraction tier number (1, 2, or 3) is logged for monitoring (NFR9)
**And** the tier is stored on the `assessment_exchange` row as `extractionTier`

### Partial Tier 2 Evidence
**Given** Tier 2 succeeds with partial evidence
**When** some evidence items were filtered by the lenient schema
**Then** the count of discarded items is logged at warn level
**And** the valid evidence items are saved normally

### Unit Tests
**Given** unit tests for the three-tier pipeline
**When** tests run with mocked ConversAnalyzer methods
**Then** tests verify:
- Happy path: Tier 1 succeeds on first attempt -> extractionTier = 1
- Tier 1 retry: fails twice, succeeds on third -> extractionTier = 1
- Tier 2 fallback: Tier 1 fails 3 times, Tier 2 succeeds -> extractionTier = 2
- Tier 3 fallback: both Tier 1 and Tier 2 fail -> neutral defaults returned, extractionTier = 3
- Partial Tier 2: lenient schema returns partial evidence -> valid items kept, discarded count logged

## Tasks

### Task 1: Create Three-Tier Extraction Pipeline Function
- [ ] Create `apps/api/src/use-cases/three-tier-extraction.ts` with a pure Effect pipeline function
- [ ] Implement Tier 1: `analyze(input)` with `Effect.retry(Schedule.recurs(2))` (strict schema, up to 3 attempts)
- [ ] Implement Tier 2: `analyzeLenient(input)` via `Effect.orElse` (lenient schema, 1 attempt)
- [ ] Implement Tier 3: `Effect.catchAll` returning `NEUTRAL_DEFAULTS` (no LLM call)
- [ ] Export `NEUTRAL_DEFAULTS` constant with: `energyBand = "steady"`, `tellingBand = "mixed"`, `withinMessageShift = false`, `evidence = []`, `tokenUsage = { input: 0, output: 0 }`
- [ ] Return extraction result along with `extractionTier: ExtractionTier` (1, 2, or 3)
- [ ] Log extraction tier at info level on success
- [ ] Log discarded evidence count at warn level when Tier 2 filters items

### Task 2: Integrate Pipeline into Nerin Pipeline
- [ ] Replace the existing ConversAnalyzer call in `nerin-pipeline.ts` (lines ~354-371) with the new three-tier extraction function
- [ ] Pass `extractionTier` to `exchangeRepo.update()` to store on the exchange row
- [ ] Preserve existing evidence filtering (minEvidenceWeight) and cost tracking logic

### Task 3: Write Unit Tests
- [ ] Create `apps/api/src/use-cases/__tests__/three-tier-extraction.test.ts`
- [ ] Test happy path: Tier 1 succeeds on first attempt -> extractionTier = 1
- [ ] Test Tier 1 retry: analyze fails twice, succeeds on third -> extractionTier = 1
- [ ] Test Tier 2 fallback: Tier 1 fails 3 times, Tier 2 succeeds -> extractionTier = 2
- [ ] Test Tier 3 fallback: both tiers fail -> neutral defaults returned, extractionTier = 3
- [ ] Test partial Tier 2: lenient schema returns subset of evidence -> valid items kept, discarded count logged
- [ ] Use `vi.mock()` + `__mocks__` pattern per CLAUDE.md conventions
