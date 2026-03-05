# Story 21-7: Pipeline Orchestration Integration

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (capstone story -- wires together all 21-1 through 21-6 components)
**Dependencies:** Story 21-1 (territory types/catalog), Story 21-2 (DRS), Story 21-3 (territory scoring), Story 21-4 (cold-start), Story 21-5 (territory prompt builder), Story 21-6 (schema migration, energy classification)

## User Story

As a developer,
I want the nerin-pipeline to use the new 8-step territory-based orchestration,
So that all steering, prompt, analysis, and storage components work together end-to-end.

## Acceptance Criteria

**AC1: 8-Step Orchestration**
**Given** a user sends a message during an assessment
**When** `nerin-pipeline.ts` processes the exchange
**Then** it executes the 8-step orchestration in order:
1. `computeDRS()` from facet coverage, last 3 word counts, last 3 evidence counts, last 3 observed energies
2. `scoreAllTerritories()` using catalog, facet metrics, DRS, visit history
3. `selectTerritory()` from ranked territories (or cold-start for first 3 messages)
4. `buildNerinPrompt()` looking up territory from catalog
5. `callNerin()` with territory-contextualized prompt
6. `callConversAnalyzer()` returning evidence + observedEnergyLevel
7. `saveEvidence()` (existing, unchanged)
8. `saveExchangeMetadata()` storing territory_id and observed_energy_level on the assessment_messages row

**AC2: Exchange Metadata Storage**
**Given** the pipeline executes step 8
**When** metadata is saved
**Then** the current exchange's `assessment_messages` row has `territory_id` set to the selected territory and `observed_energy_level` set to the ConversAnalyzer classification

**AC3: Clean Cut Migration**
**Given** this is a clean cut migration (no feature flag)
**When** the old facet-targeted steering code is replaced
**Then** the old steering path is removed entirely -- no backward compatibility shim or toggle

**AC4: Observability Logging**
**Given** the pipeline is wired up
**When** DRS, territory selected, and actual evidence per exchange are computed
**Then** they are logged for observability (NFR5)

**AC5: Integration Tests**
**Given** the pipeline integration tests at `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
**When** tests run using the `vi.mock()` + `__mocks__` pattern
**Then** tests verify: full 8-step flow executes, cold-start for early messages, scoring for later messages, territory_id and observed_energy_level are stored, and existing evidence extraction is unchanged (NFR1)

## Tasks

### Task 1: Write Pipeline Integration Tests (TDD Red Phase)

**File:** `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`

Create test file following project test conventions (vi.fn() mock pattern from send-message.fixtures.ts):

- **Subtask 1.1:** Create test fixtures with mock repos mirroring send-message.fixtures.ts pattern
- **Subtask 1.2:** Test: Cold-start path (< 3 user messages) selects from COLD_START_TERRITORIES, Nerin receives territory prompt, message saved with territory_id
- **Subtask 1.3:** Test: Post-cold-start path runs full 8-step orchestration -- DRS computed, territories scored, territory selected, prompt built, Nerin called with territory context, ConversAnalyzer called, evidence saved, metadata stored
- **Subtask 1.4:** Test: territory_id and observed_energy_level are passed to saveMessage for assistant message
- **Subtask 1.5:** Test: Observability -- logger.info called with DRS, territory selected, evidence count
- **Subtask 1.6:** Test: ConversAnalyzer failure is non-fatal (fail-open) -- Nerin still responds, default energy level used

### Task 2: Rewrite nerin-pipeline.ts with 8-Step Orchestration

**File:** `apps/api/src/use-cases/nerin-pipeline.ts`

Replace the existing pipeline orchestration with the new territory-based flow:

- **Subtask 2.1:** Remove old imports: `computeSteeringTarget`, `computeDomainStreak`, `aggregateDomainDistribution`, `realizeMicroIntent`, `MicroIntent`, `IntentType`, `DomainMessage` (for steering), and related types no longer needed
- **Subtask 2.2:** Add new imports: `computeDRS`, `extractDRSConfig`, `scoreAllTerritories`, `extractTerritoryScorerConfig`, `buildFacetEvidenceCounts`, `selectTerritoryWithColdStart`, `buildTerritoryPrompt`, `buildChatSystemPrompt`, `TERRITORY_CATALOG`, `COLD_START_TERRITORIES`, `computeFacetMetrics` (already imported), `type EnergyLevel`, `type TerritoryVisitHistory`
- **Subtask 2.3:** Implement step 1 -- Compute DRS: extract last 3 word counts from user messages, last 3 evidence counts per message, last 3 observed energy levels from assistant messages, covered facets count from facet metrics
- **Subtask 2.4:** Implement step 2 -- Score all territories: build facet evidence counts, build visit history from previous assistant messages' territory_id, call `scoreAllTerritories()`
- **Subtask 2.5:** Implement step 3 -- Select territory: call `selectTerritoryWithColdStart()` with cold-start threshold from config
- **Subtask 2.6:** Implement step 4 -- Build Nerin prompt: call `buildTerritoryPrompt()` to get territory content
- **Subtask 2.7:** Implement step 5 -- Call Nerin with territory-contextualized prompt (pass `territoryPrompt` to buildChatSystemPrompt via NerinAgentRepository, or pass it as part of the invoke input)
- **Subtask 2.8:** Implement step 6 -- Call ConversAnalyzer (existing, largely unchanged), capture `observedEnergyLevel`
- **Subtask 2.9:** Implement step 7 -- Save evidence (existing, unchanged)
- **Subtask 2.10:** Implement step 8 -- Save exchange metadata: pass `territoryId` and `observedEnergyLevel` to `messageRepo.saveMessage()` for the assistant message

### Task 3: Build Visit History Helper

**File:** `apps/api/src/use-cases/nerin-pipeline.ts` (inline helper or separate)

- **Subtask 3.1:** Create `buildVisitHistory()` function that takes previous assistant messages and returns `TerritoryVisitHistory` map
- **Subtask 3.2:** Each assistant message with a territory_id counts as a visit; track visitCount and lastVisitExchange index

### Task 4: Build DRS Input Helper

**File:** `apps/api/src/use-cases/nerin-pipeline.ts` (inline helper)

- **Subtask 4.1:** Extract last 3 user message word counts from message history
- **Subtask 4.2:** Extract last 3 evidence-per-message counts (requires counting evidence records per user message)
- **Subtask 4.3:** Extract last 3 observed energy levels from assistant messages
- **Subtask 4.4:** Count covered facets from facet metrics (facets with evidence count >= 1)

### Task 5: Remove Old Steering Code

**File:** `apps/api/src/use-cases/nerin-pipeline.ts`

- **Subtask 5.1:** Remove `computeSteeringTarget` usage and related variables (`targetDomain`, `targetFacet`, `bestPriority`, `coveredFacets`, `metricsMapSize`)
- **Subtask 5.2:** Remove `computeDomainStreak` and `aggregateDomainDistribution` usage
- **Subtask 5.3:** Remove `realizeMicroIntent` and micro-intent extraction logic
- **Subtask 5.4:** Remove `topicTransitionsPerFiveTurns` computation
- **Subtask 5.5:** Update Nerin invocation to pass territory prompt content instead of targetDomain/targetFacet/microIntent
- **Subtask 5.6:** Clean up the NerinPipelineInput/Output interfaces if needed (should remain compatible)

### Task 6: Update Nerin Invocation for Territory Context

The Nerin agent's `invoke()` already receives `NerinInvokeInput` which has optional `targetDomain`, `targetFacet`, `microIntent`. The system prompt builder already supports `territoryPrompt`. Two options:

**Option A (preferred):** Add optional `territoryPrompt` field to `NerinInvokeInput` in the domain layer, then use it in the infrastructure Nerin agent to build the system prompt with territory context instead of facet targeting.

**Option B:** Build the system prompt in the pipeline and pass it as a new field.

- **Subtask 6.1:** Add optional `territoryPrompt?: TerritoryPromptContent` to `NerinInvokeInput`
- **Subtask 6.2:** Update `nerin-agent.anthropic.repository.ts` to use `territoryPrompt` when building system prompt
- **Subtask 6.3:** Update Nerin agent mock to handle `territoryPrompt`

### Task 7: Verify Typecheck and Run Tests

- **Subtask 7.1:** Run `pnpm turbo typecheck` -- fix any type errors
- **Subtask 7.2:** Run `pnpm test:run` -- all tests pass including new pipeline tests
- **Subtask 7.3:** Verify existing send-message tests still pass (backward compatibility of the pipeline interface)

## Architect Notes

### Finding 1: Nerin Agent Territory Prompt Plumbing

The infrastructure Nerin agent at `packages/infrastructure/src/repositories/nerin-agent.anthropic.repository.ts` (line 107) already calls `buildChatSystemPrompt()` but does not pass `territoryPrompt`. The fix is:

1. **Add `territoryPrompt` to `NerinInvokeInput`** at `packages/domain/src/repositories/nerin-agent.repository.ts`:
   ```typescript
   import type { TerritoryPromptContent } from "../utils/steering/territory-prompt-builder";
   // Add to NerinInvokeInput:
   readonly territoryPrompt?: TerritoryPromptContent;
   ```

2. **Pass it through in the infra layer** at `nerin-agent.anthropic.repository.ts` line 107:
   ```typescript
   const systemPrompt = buildChatSystemPrompt({
       targetDomain: input.targetDomain,
       targetFacet: input.targetFacet,
       microIntent: input.microIntent,
       territoryPrompt: input.territoryPrompt,
   });
   ```

3. **The mock** at `__mocks__/nerin-agent.anthropic.repository.ts` uses `vi.fn()` so it already accepts any input shape -- no changes needed.

### Finding 2: ConversAnalyzer Order Change (FR16)

The new 8-step order in FR16 specifies ConversAnalyzer runs AFTER Nerin (step 6), not before. This is intentional: the territory-based steering uses ONLY historical data (prior evidence + prior energy levels) for steps 1-4. The current user message is analyzed AFTER Nerin responds.

**Key implementation detail:** The existing pipeline runs ConversAnalyzer before Nerin to use fresh evidence for steering. The new pipeline reverses this:
- Steps 1-4 use `evidenceRepo.findBySession()` (historical only) for DRS/scoring
- Step 5 calls Nerin
- Step 6 calls ConversAnalyzer on the current exchange (user message + Nerin response context)
- Steps 7-8 save the new evidence and metadata

**Impact:** The `pendingEvidence` pattern changes. In the old pipeline, ConversAnalyzer evidence was collected before Nerin and deferred for atomic save. In the new pipeline, ConversAnalyzer runs after Nerin, so evidence is available right before save.

**The pipeline must still save user message first (to get the message ID for evidence FK), then save evidence, then save assistant message with metadata.**

### Finding 3: Evidence-Per-Message Counts for DRS

To compute DRS, we need "last 3 evidence counts per message." The `evidenceRepo.findBySession()` returns all evidence items. To get per-message counts, group by `messageId` field on the evidence items. This is a simple in-memory grouping -- no new repository method needed.

The `EvidenceInput` type (from conversanalyzer output) does not have `messageId` -- but the stored evidence records do. Check what `findBySession()` returns. If it returns raw evidence without messageId, use the message history to infer: each user message maps to its evidence via the sequential save pattern.
