# Story 27-3: Pipeline Integration — Wire Pacing Pipeline into Nerin Pipeline

**Status:** ready-for-dev

## Story

As a developer,
I want the nerin-pipeline to use the new pacing pipeline layers (E_target, V2 scorer, V2 selector, Move Governor, 4-tier prompt builder) instead of the legacy DRS + multiplicative scorer + old prompt builder,
So that conversation steering is driven by the evolved pacing system with observation gating, entry pressure calibration, and intent-aware prompt composition.

## Context

The nerin-pipeline.ts currently uses the **old** pipeline path:
- `computeDRS()` (Story 21-2) for depth readiness
- `scoreAllTerritories()` (Story 21-3, multiplicative formula)
- `selectTerritoryWithColdStart()` (Story 21-4, round-robin cold start)
- `buildTerritoryPrompt()` (Story 21-5, old territory prompt builder)
- `buildChatSystemPrompt()` (nerin-system-prompt.ts, concatenation of persona + chat context + territory section)

Stories 25-1 through 27-2 built the **new** pacing pipeline layers:
- `computeETarget()` (Story 25-1): E_target pacing formula
- `scoreAllTerritoriesV2()` (Story 25-2): 5-term additive scorer
- `selectTerritoryV2()` (Story 25-3): cold-start-perimeter + argmax selector
- Observation focus strengths (Story 26-1): relate, noticing, contradiction, convergence
- `evaluateObservationGating()` (Story 26-2): gating & competition
- `computeGovernorOutput()` (Story 26-3): Move Governor -> PromptBuilderInput
- `buildPrompt()` (Story 27-2): 4-tier modular prompt builder

This story **wires** those layers into the nerin-pipeline, replacing the legacy path with a clean cut (no feature flag, no backward compatibility shim).

## Acceptance Criteria

### AC1: Pipeline uses E_target instead of DRS
**Given** a user sends a message during an assessment (post-cold-start)
**When** the pipeline computes pacing state
**Then** it calls `computeETarget()` with energy and telling histories from previous exchanges
**And** `computeDRS()` is no longer called

### AC2: Pipeline uses V2 scorer instead of multiplicative scorer
**Given** E_target is computed
**When** territory scoring runs
**Then** `scoreAllTerritoriesV2()` is called with E_target, facet metrics, catalog, visit history, turn number, total turns, and PacingScorerConfig
**And** the old `scoreAllTerritories()` is no longer called

### AC3: Pipeline uses V2 selector instead of cold-start gateway
**Given** scored territories from V2 scorer
**When** territory selection runs
**Then** `selectTerritoryV2()` is called (with cold-start-perimeter for turn 1, argmax for turns 2+)
**And** the old `selectTerritoryWithColdStart()` is no longer called

### AC4: Pipeline uses Move Governor + Prompt Builder
**Given** a territory is selected
**When** the pipeline builds the Nerin prompt
**Then** `computeGovernorOutput()` is called with observation focus strengths, entry pressure inputs, and intent derivation
**And** `buildPrompt()` produces the composed system prompt
**And** the old `buildTerritoryPrompt()` + `buildChatSystemPrompt()` path is no longer used

### AC5: Nerin agent receives a system prompt string
**Given** the prompt builder produces a system prompt
**When** Nerin is invoked
**Then** `NerinInvokeInput` carries a `systemPrompt: string` field (instead of `territoryPrompt?: TerritoryPromptContent`)
**And** the Nerin agent infrastructure uses the provided system prompt directly

### AC6: Pipeline state stored on exchange
**Given** the pipeline completes
**When** exchange metadata is saved
**Then** the exchange row includes: energy, energyBand, telling, tellingBand, smoothedEnergy, comfort, drain, drainCeiling, eTarget, scorerOutput (JSON), selectedTerritory, selectionRule, governorOutput (JSON), governorDebug (JSON), sessionPhase, transitionType

### AC7: Observation focus computed from evidence
**Given** existing evidence for the session
**When** the pipeline computes observation focus strengths
**Then** it computes relate, noticing, contradiction, and convergence strengths using the formulas from Story 26-1
**And** passes them to the Move Governor

### AC8: Observability logging
**Given** the pipeline executes
**When** logging occurs
**Then** logs include: E_target, selected territory, scorer output summary, governor intent, entry pressure, observation focus winner, evidence count, extraction tier

### AC9: Clean cut migration
**Given** the new pipeline is deployed
**When** the old code paths are examined
**Then** the old DRS-based steering path is removed from nerin-pipeline.ts
**And** no feature flag or backward compatibility shim exists

## Tasks

### Task 1: Update NerinInvokeInput to accept systemPrompt
- **File:** `packages/domain/src/repositories/nerin-agent.repository.ts`
- Replace `territoryPrompt?: TerritoryPromptContent` with `systemPrompt?: string`
- Update the `NerinInvokeInput` interface

### Task 2: Update Nerin agent infrastructure to use systemPrompt
- **File:** `packages/infrastructure/src/repositories/nerin-agent.anthropic.repository.ts`
- Use `input.systemPrompt` as the system message content when provided
- Fall back to the old `buildChatSystemPrompt()` if no systemPrompt (for backward compat during transition)
- Update the mock in `__mocks__/` if needed

### Task 3: Add observation focus computation helper
- **File:** `apps/api/src/use-cases/nerin-pipeline.ts` (new helper functions)
- Compute per-domain confidence from facet metrics + evidence
- Compute relate, noticing, contradiction, convergence strengths
- Compute phase (mean confidence / C_MAX) and shared fire count from exchange history

### Task 4: Rewrite nerin-pipeline.ts to use pacing pipeline
- **File:** `apps/api/src/use-cases/nerin-pipeline.ts`
- Replace steps 1-4 with:
  1. Compute E_target from energy/telling histories
  2. Compute facet metrics for V2 scorer
  3. Score all territories via `scoreAllTerritoriesV2()`
  4. Select territory via `selectTerritoryV2()`
  5. Compute observation focus strengths
  6. Run Move Governor via `computeGovernorOutput()`
  7. Build prompt via `buildPrompt()`
- Update step 5 (callNerin) to pass `systemPrompt` string
- Update step 8 (saveExchangeMetadata) to store full pipeline state
- Remove old imports: `computeDRS`, `scoreAllTerritories`, `selectTerritoryWithColdStart`, `buildTerritoryPrompt`, `extractDRSConfig`, `extractTerritoryScorerConfig`

### Task 5: Update pipeline tests
- **File:** `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
- Update cold-start test: verify `selectTerritoryV2()` is used with turn 1 cold-start-perimeter
- Update post-cold-start test: verify full pacing pipeline flow (E_target -> scorer V2 -> selector V2 -> governor -> prompt builder)
- Verify exchange row stores all new pipeline state fields
- Verify observability logging includes new fields
- Verify observation focus strengths are computed and passed to governor

### Task 6: Remove dead code
- Remove `COLD_START_TERRITORIES` from nerin-pipeline.ts (no longer needed; V2 selector handles cold start)
- Remove `COLD_START_USER_MSG_THRESHOLD` from nerin-pipeline.ts
- Clean up unused helper functions (`extractLastEnergyValues` in old format, etc.)

## Dependencies

- Story 25-1 (E_target): DONE
- Story 25-2 (V2 scorer): DONE
- Story 25-3 (V2 selector): DONE
- Story 26-1 (Observation focus): DONE
- Story 26-2 (Observation gating): DONE
- Story 26-3 (Move Governor): DONE
- Story 27-2 (Prompt builder): DONE

## Technical Notes

- **Clean cut:** No feature flag. Old path removed entirely.
- **Exchange row:** Already has all columns from Story 23-3. No schema migration needed.
- **Cost neutrality:** Same number of LLM calls. Pacing computations are pure functions with negligible overhead.
- **FacetMetrics dependency:** The V2 scorer uses `FacetMetrics` (from formula.ts) instead of raw facet evidence counts. Need to compute facet metrics using `computeFacetMetrics()` from domain utils.
- **Observation focus bootstrapping:** Early conversations will have minimal evidence, so observation strengths will be near-zero and Relate focus will dominate. This is correct behavior.
