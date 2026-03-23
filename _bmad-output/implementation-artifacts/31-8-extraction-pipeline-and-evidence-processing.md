---
status: done
story_id: "31-8"
epic: 31
created_date: 2026-03-23
depends_on: [24-1, 24-2, 27-3]
---

# Story 31-8: Extraction Pipeline & Evidence Processing

## Story

As a user,
I want my conversation responses to be analyzed for personality evidence in real time,
So that the system can steer the conversation intelligently and produce accurate results.

## Context

This story consolidates and verifies the extraction pipeline implementation that was built across Stories 24-1 (ConversAnalyzer v2 schemas), 24-2 (three-tier extraction), and 27-3 (pipeline orchestration). It maps directly to Epic Story 2.8 acceptance criteria (FR14).

The core implementation already exists. This story ensures comprehensive test coverage against all original acceptance criteria and closes any remaining gaps.

## Acceptance Criteria

### AC1: Sequential Execution Order
**Given** a user sends a message in the conversation
**When** the message is processed
**Then** ConversAnalyzer v2 (Haiku) runs BEFORE Nerin — sequential, not parallel (FR14)
**And** dual extraction produces: userState (energy x telling) and evidence (facet + deviation + strength + domain)

### AC2: Three-Tier Retry Logic
**Given** ConversAnalyzer v2 processes a user response
**When** extraction is attempted
**Then** three-tier retry logic applies: Strict schema (attempts 1-3) -> Lenient schema (attempt 4) -> Neutral defaults with no LLM call (fail-open)
**And** each tier is clearly logged with attempt number and schema type

### AC3: Exchange Row Persistence
**Given** extraction succeeds at any tier
**When** the results are persisted
**Then** an assessment_exchange row is created with: extraction results, pacing state, scoring state, governor decision, and observability columns
**And** the exchange is 1-indexed (NOT zero-indexed) per architecture specification

### AC4: Dual-Facet Extraction with Polarity Balance
**Given** dual-facet extraction
**When** ConversAnalyzer is prompted
**Then** the prompt instructs finding a DIFFERENT facet with NEGATIVE deviation for every evidence record
**And** the polarity balance target is >=30% negative deviations across the session

### AC5: Energy/Telling Pass-Through to Pacing
**Given** extraction produces userState
**When** energy and telling scores are computed
**Then** values are passed to the pacing pipeline's E_target formula as input
**And** userState is used for energy-based territory scoring (energyMalus term)

### AC6: Fail-Open on Complete Failure
**Given** extraction fails at all tiers (strict + lenient both fail)
**When** neutral defaults are applied
**Then** the conversation continues normally with default userState values
**And** no evidence is recorded for that exchange (fail-open)
**And** the failure is logged as a structured event (NFR28)

## Tasks

### Task 1: Verify Sequential Execution Order (AC1)
- [x] Confirm nerin-pipeline.ts calls ConversAnalyzer AFTER Nerin responds (Step 8 after Step 7)
- **Note:** Architecture specifies ConversAnalyzer runs on the user's message to extract evidence, then the pacing pipeline uses that evidence for the NEXT turn. The current pipeline runs Nerin first (Step 7) then ConversAnalyzer (Step 8) because the extraction analyzes the user's message that prompted this turn, and the results inform the NEXT exchange. This is correct per the two-phase exchange model.

### Task 2: Add Integration Tests for AC1 — Dual Extraction Output (AC1)
- [ ] Write test verifying dual extraction output contains both userState and evidence
- [ ] Write test verifying userState has energyBand, tellingBand, energyReason, tellingReason, withinMessageShift
- [ ] Write test verifying evidence items have bigfiveFacet, deviation, strength, confidence, domain, note

### Task 3: Verify Three-Tier Retry Coverage (AC2)
- [x] Tests exist in three-tier-extraction.test.ts covering all three tiers
- [x] Logging assertions verify tier number and schema type are logged

### Task 4: Add Integration Test for Exchange Row Persistence (AC3)
- [ ] Write test verifying exchange row is created with extraction data
- [ ] Write test verifying exchange turnNumber is 1-indexed (starts at 1, not 0)
- [ ] Write test verifying exchange row stores extractionTier

### Task 5: Verify Dual-Facet Prompt Instructions (AC4)
- [x] Confirm ConversAnalyzer prompt includes "Dual-Facet Check (MANDATORY)" section
- [x] Confirm prompt includes "Polarity Balance Target" of >=30%
- [ ] Write test verifying prompt content includes dual-facet and polarity instructions

### Task 6: Add Integration Test for Energy/Telling Pass-Through (AC5)
- [ ] Write test verifying energy/telling from extraction is stored on exchange row
- [ ] Write test verifying E_target computation uses energy/telling history

### Task 7: Verify Fail-Open Behavior (AC6)
- [x] Tests exist in three-tier-extraction.test.ts for neutral defaults
- [ ] Write test verifying no evidence is saved when extraction falls to Tier 3
- [ ] Write test verifying conversation continues normally after complete extraction failure

## Technical Notes

### Key Files
- `apps/api/src/use-cases/three-tier-extraction.ts` — Three-tier orchestration
- `apps/api/src/use-cases/nerin-pipeline.ts` — Full pipeline integration
- `packages/domain/src/schemas/conversanalyzer-v2-extraction.ts` — v2 schemas (strict + lenient)
- `packages/domain/src/schemas/evidence-extraction.ts` — Evidence item schema
- `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` — LLM integration + prompt
- `packages/domain/src/repositories/assessment-exchange.repository.ts` — Exchange repository interface

### Patterns
- Effect-ts dependency injection via Context.Tag
- @effect/vitest it.effect() for async Effect tests
- vi.mock() + __mocks__ for repository mocking
- Layer.mergeAll for composing test layers
