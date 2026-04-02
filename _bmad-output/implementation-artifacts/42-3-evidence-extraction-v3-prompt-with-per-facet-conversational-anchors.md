# Story 42-3: Evidence Extraction v3 Prompt with Per-Facet Conversational Anchors

**Status:** ready-for-dev
**Epic:** 3 — Evidence Extraction v3 — Polarity Model
**Sprint Key:** 42-3
**FRs:** FR-S9, FR-S10, FR-S14, FR-S15, FR-S16

## User Story

As a **system operator**,
I want a new evidence extraction prompt with HIGH/LOW behavioral examples for all 30 facets, dual-polarity checks, and polarity balance audits,
So that the LLM produces better-calibrated evidence with balanced polarity distribution.

## Acceptance Criteria

### AC1: Per-Facet Conversational Anchors
**Given** the evidence extraction prompt is being created
**When** the prompt is written
**Then** it includes conversational anchor examples (HIGH and LOW) for all 30 Big Five facets
**And** each anchor reads as natural conversation (what a real person would say to Nerin)
**And** the prompt instructs the LLM to output polarity (high/low) and strength (weak/moderate/strong) — not deviation

### AC2: Dual-Polarity Check
**Given** the dual-polarity check instruction
**When** the LLM extracts a signal
**Then** the prompt mandates asking: "Does this same behavior ALSO reveal the OPPOSITE polarity on a DIFFERENT facet?" (FR-S14)
**And** the prompt includes 5+ concrete dual-polarity examples from the spec

### AC3: Polarity Balance Audit
**Given** the polarity balance audit instruction
**When** the LLM has extracted all signals from a message
**Then** the prompt mandates counting HIGH vs LOW: if <35% are LOW, re-read for absences, avoidances, and preferences-against (FR-S15)

### AC4: Updated Domain Definitions
**Given** the domain definitions in the prompt
**When** the extraction prompt references life domains
**Then** it uses the updated 6-domain list with health included and solo absent (FR-S16)
**And** domain assignment guidance matches the spec (work includes education, leisure includes introspection, other target <5%)

### AC5: Domain Distribution Context
**Given** the prompt includes the current evidence distribution context
**When** the extraction call is made
**Then** the prompt template accepts a `domainDist` variable showing per-domain evidence counts for the current session

### AC6: Polarity-Based Output Schema
**Given** the evidence extraction uses polarity model
**When** the LLM returns evidence
**Then** each evidence item includes polarity (high/low) and strength (weak/moderate/strong)
**And** the JSON Schema sent to the LLM reflects polarity-based output (not deviation)
**And** existing strict/lenient decode pipelines accept polarity-based evidence

### AC7: Backward Compatibility
**Given** existing tests for prompt content, schemas, and three-tier extraction
**When** the v3 prompt is deployed
**Then** all existing tests pass (updated where needed for new prompt content)
**And** the ConversanalyzerEvidenceOutput still provides deviation via the deriveDeviation adapter

## Tasks

### Task 1: Create v3 evidence extraction prompt with conversational anchors

**Files:** `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`

- [ ] 1.1: Replace `buildEvidencePrompt` with the v3 prompt from scoring-confidence-v2-spec.md section 4
- [ ] 1.2: Include all 30 facet HIGH/LOW conversational anchors organized by Big Five trait
- [ ] 1.3: Include dual-polarity check section with 5+ examples
- [ ] 1.4: Include polarity balance audit section (35% LOW threshold)
- [ ] 1.5: Include updated domain definitions (health, no solo)
- [ ] 1.6: Include domain distribution context via `${domainDist}` template variable
- [ ] 1.7: Instruct LLM to output polarity + strength instead of deviation

### Task 2: Update evidence JSON Schema for polarity-based output

**Files:** `packages/domain/src/schemas/evidence-extraction.ts`, `packages/domain/src/schemas/conversanalyzer-v2-extraction.ts`

- [ ] 2.1: Update `EvidenceItemJsonSchemaSource` to make polarity required and remove deviation from the JSON Schema sent to the LLM
- [ ] 2.2: Keep `EvidenceItemSchema` (decode schema) accepting both polarity-based and deviation-based evidence for backward compat
- [ ] 2.3: Update `evidenceOnlyJsonSchema` to reflect the new polarity-based schema
- [ ] 2.4: Update the evidence decode pipeline to derive deviation from polarity+strength when polarity is present

### Task 3: Wire polarity→deviation adapter in the repository evidence mapping

**Files:** `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`

- [ ] 3.1: Import `deriveDeviation` from `@workspace/domain`
- [ ] 3.2: In `analyzeEvidence` and `analyzeEvidenceLenient`, compute deviation from polarity+strength using `deriveDeviation` when mapping evidence items to EvidenceInput
- [ ] 3.3: Ensure the evidence output still includes deviation for downstream compatibility (nerin-pipeline expects deviation)

### Task 4: Update prompt content tests

**Files:** `packages/infrastructure/src/repositories/__tests__/conversanalyzer-prompt-content.test.ts`

- [ ] 4.1: Update tests to verify v3 prompt contains conversational anchors for all 30 facets (spot-check representative facets)
- [ ] 4.2: Update tests to verify dual-polarity check with 5+ examples
- [ ] 4.3: Update tests to verify polarity balance audit (35% threshold)
- [ ] 4.4: Update tests to verify polarity + strength output instructions (not deviation)
- [ ] 4.5: Remove/update tests that check for deviation-based prompt content

### Task 5: Update schema tests for polarity-based evidence

**Files:** `packages/domain/src/schemas/__tests__/conversanalyzer-v2-extraction.test.ts`

- [ ] 5.1: Add tests for polarity-based evidence items (polarity required in new schema)
- [ ] 5.2: Verify that polarity-based evidence is correctly decoded with derived deviation
- [ ] 5.3: Verify backward compatibility — old evidence with deviation still decodes

## Technical Notes

- The v3 prompt text comes from `scoring-confidence-v2-spec.md` section 4 — do not write anchors from scratch
- `deriveDeviation` already exists at `packages/domain/src/utils/derive-deviation.ts` (implemented in Story 42-1)
- `ExtractedEvidence` type already exists at `packages/domain/src/types/evidence.ts` (implemented in Story 42-1)
- The `EvidenceItemSchema` already has an optional `polarity` field — this story makes it the primary output from the LLM
- Domain definitions are already updated in `packages/domain/src/constants/life-domain.ts` (done in Story 40-2)
- The three-tier extraction pipeline in `apps/api/src/use-cases/three-tier-extraction.ts` does not need changes — it calls `analyzeEvidence`/`analyzeEvidenceLenient` which will use the new prompt automatically
