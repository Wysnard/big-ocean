# Story 2.4: LangGraph State Machine and Orchestration (TDD)

Status: ready-for-dev

**Story ID:** 2.4
**Created:** 2026-02-03
**Epic:** 2 - Assessment Backend Services
**Epic Status:** in-progress

---

## Story

As a **Backend System**,
I want **to intelligently route messages to Nerin, Analyzer, or Scorer based on context**,
So that **I optimize for quality + cost by running expensive operations only when needed**.

---

## Acceptance Criteria

### TEST-FIRST (Red Phase)

**Given** tests are written for LangGraph orchestration
**When** I run `pnpm test orchestrator.test.ts`
**Then** tests fail (red) because orchestrator doesn't exist
**And** each test defines expected routing behavior:
- Test: Always routes to Nerin on every message
- Test: Triggers Analyzer + Scorer on every 3rd message
- Test: Calculates single steering target using outlier detection (weakest facet below mean - stddev)
- Test: Pauses assessment gracefully when approaching budget (resume next day)
- Test: Routing decisions are deterministic (same state produces same decision)

### IMPLEMENTATION (Green Phase)

**Given** a new message from the user
**When** the orchestrator receives it
**Then** it routes to Nerin for response generation (always)
**And** every 3rd message triggers Analyzer + Scorer (batch)
**And** Nerin receives single steering hint based on outlier detection (weakest facet more than 1 stddev below mean confidence)
**And** routing tests pass (green)

**Given** cost is approaching daily limit
**When** the next message would exceed budget
**Then** the orchestrator pauses the assessment gracefully
**And** returns `BudgetPausedError` with resume timestamp (next day)
**And** session state preserved exactly (precision, gaps, scores intact)
**And** shows user message: "Your assessment is saved! Come back tomorrow to continue with full accuracy."
**And** cost-aware pause tests pass

### Documentation & Testing (AC: #7-8)

1. **Documentation**: All new code has JSDoc comments; CLAUDE.md updated with Orchestrator patterns
2. **Tests**: Unit tests with minimum 80% coverage for new functionality; integration tests if needed

---

## Tasks / Subtasks

### Task 1: Orchestrator Repository Interface (AC: Hexagonal Architecture)

- [ ] Create `packages/domain/src/repositories/orchestrator.repository.ts`:
  - `OrchestratorRepository` interface as Context.Tag
  - `processMessage(input: ProcessMessageInput): Effect<ProcessMessageOutput>`
  - Input includes: sessionId, userMessage, messageCount, precision, dailyCostUsed
  - Output includes: nerinResponse, facetEvidence (optional), facetScores (optional), traitScores (optional), tokenUsage, costIncurred
- [ ] Define domain errors:
  - `OrchestrationError` (generic routing failure)
  - `BudgetPausedError` (daily cost limit reached - includes resumeAfter timestamp, sessionId, currentPrecision)
  - `PrecisionGapError` (precision calculation failure)
- [ ] Write failing tests for interface contract (red)
- [ ] Export from domain package

### Task 2: LangGraph State Definition (AC: #1)

- [ ] Create `packages/infrastructure/src/agents/orchestrator-state.ts`:
  - `OrchestratorStateAnnotation` using LangGraph's Annotation.Root
  - State fields:
    - `sessionId`: string
    - `messages`: BaseMessage[] (with reducer for appending)
    - `messageCount`: number
    - `userMessage`: string (current message to process)
    - `facetEvidence`: FacetEvidence[] (from Analyzer)
    - `facetScores`: Record<FacetName, FacetScore> (from Scorer)
    - `traitScores`: Record<TraitName, TraitScore> (derived by Aggregator)
    - `precision`: number (0-100, overall confidence metric)
    - `steeringTarget`: FacetName | null (single weakest outlier facet for Nerin guidance)
    - `steeringHint`: string | null (natural language hint from FACET_STEERING_HINTS lookup)
    - `tokenCount`: TokenUsage (accumulated)
    - `costIncurred`: number (session cost)
    - `dailyCostUsed`: number (from CostGuard)
    - `nerinResponse`: string (final output)
- [ ] Write tests for state reducers and defaults
- [ ] Export state type for use in nodes

### Task 3: LangGraph Node Implementations (AC: #1-2)

- [ ] Create `packages/infrastructure/src/agents/orchestrator-nodes.ts`:
  - **Router Node** (decision point):
    - Checks `dailyCostUsed + estimatedCost > DAILY_LIMIT` → throws `BudgetPausedError` (pause assessment)
    - Checks `messageCount % 3 === 0` for batch trigger
    - Calculates `steeringTarget` via `getSteeringTarget(facetScores)` (outlier detection)
    - Looks up `steeringHint` from `FACET_STEERING_HINTS[steeringTarget]`
    - Returns routing decision: "nerin" | "analyzer"
  - **Nerin Node** (always runs):
    - Calls `NerinAgentRepository.invoke()` with precision context
    - Receives `steeringHint: string | null` for optional single-topic guidance
    - Updates `nerinResponse` and `tokenCount`
  - **Analyzer Node** (conditional):
    - Calls `AnalyzerRepository.analyzeFacets()` on user message
    - Updates `facetEvidence` state
    - Saves evidence via `FacetEvidenceRepository`
  - **Scorer Node** (conditional, after Analyzer):
    - Calls `ScorerRepository.aggregateFacetScores()`
    - Calls `ScorerRepository.deriveTraitScores()`
    - Updates `facetScores`, `traitScores`, `precision`
- [ ] Write failing tests for each node (red)
- [ ] Implement each node to pass tests (green)

### Task 4: LangGraph Graph Compilation (AC: #1)

- [ ] Create `packages/infrastructure/src/agents/orchestrator-graph.ts`:
  - Build StateGraph with OrchestratorStateAnnotation
  - Add nodes: router, nerin, analyzer, scorer
  - Add edges with conditional routing:
    ```
    START -> router (budget check - throws BudgetPausedError if exceeded)
    router -> nerin (always, if budget OK)
    nerin -> analyzer (when messageCount % 3 === 0)
    nerin -> END (when not batch processing)
    analyzer -> scorer
    scorer -> END
    ```
  - Compile with PostgresSaver checkpointer for state persistence
- [ ] Write tests for graph compilation
- [ ] Test full pipeline: message -> router -> nerin -> (analyzer -> scorer) -> end

### Task 5: Orchestrator Repository Implementation (AC: #2, Green Phase)

- [ ] Create `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts`:
  - Implement `OrchestratorLangGraphRepositoryLive` as Effect Layer
  - Dependencies: LoggerRepository, NerinAgentRepository, AnalyzerRepository, ScorerRepository, FacetEvidenceRepository, CostGuardRepository
  - Initialize PostgresSaver for state persistence
  - Compile and expose the orchestrator graph
  - Implement `processMessage`:
    - Invoke graph with input state
    - Extract results from final state
    - Return ProcessMessageOutput with all scoring data
- [ ] Create test implementation `createTestOrchestratorLayer()`:
  - Uses mock repositories for all dependencies
  - Deterministic routing for unit tests
- [ ] Write failing tests with mocks (red)
- [ ] Implement to pass all tests (green)

### Task 6: Batch Trigger and Outlier-Based Steering Logic (AC: #2)

- [ ] Implement `shouldTriggerAnalysis(messageCount: number): boolean`:
  - Returns true when `messageCount % 3 === 0`
  - Exact counts: 3, 6, 9, 12, ...
  - Note: Budget check happens BEFORE this (throws BudgetPausedError if exceeded)
- [ ] Create `packages/infrastructure/src/agents/steering-logic.ts`:
  - Implement `getSteeringTarget(facetScores: Record<FacetName, FacetScore>): FacetName | null`:
    - Filter to assessed facets only (`sampleSize > 0`)
    - Calculate mean and stddev of confidence scores
    - Find outliers: facets with `confidence < (mean - stddev)`
    - Return single weakest outlier (lowest confidence), or `null` if no outliers
    - **No arbitrary thresholds** - pure statistics, self-regulating
  - Implement `getSteeringHint(facetScores): string | null`:
    - Call `getSteeringTarget()` to get single facet
    - Return `FACET_STEERING_HINTS[target]` or `null`
- [ ] Write failing tests for steering logic (red):
  - Test: Returns `null` when no facets assessed
  - Test: Returns `null` when all facets tightly clustered (no outliers)
  - Test: Returns weakest outlier when outliers exist
  - Test: Returns single weakest when multiple outliers exist
  - Test: Self-corrects as more data arrives
- [ ] Implement to pass tests (green)

### Task 7: Single-Target Conversation Steering (AC: #2)

**Design Philosophy:** One feedback mechanism. Pure outlier statistics. No magic thresholds.

- [ ] Update Nerin node to receive single `steeringHint: string | null`:
  - Pass `steeringHint` from Router to Nerin node (NOT an array)
  - Nerin system prompt enhanced with single focused guidance
- [ ] Keep `FACET_STEERING_HINTS` lookup table (30 mappings) unchanged:
  - `imagination` → "Ask about daydreaming, creative scenarios, or 'what if' thinking"
  - `orderliness` → "Explore how they organize their space, time, or belongings"
  - `altruism` → "Discuss helping others, volunteering, or selfless acts"
  - (all 30 facets mapped to natural conversation topics)
- [ ] Update Nerin system prompt template for single hint:
  ```
  {{#if steeringHint}}
  Focus area: {{steeringHint}}
  Gently explore this topic in your next response. Keep it natural and conversational.
  {{/if}}
  ```
- [ ] Write failing tests for single-target steering (red):
  - Test: `steeringHint` is `null` when no outliers exist
  - Test: `steeringHint` is populated when outlier detected
  - Test: Nerin system prompt includes hint when present
  - Test: Nerin system prompt has no steering section when hint is `null`
  - Test: `FACET_STEERING_HINTS` has entry for all 30 facets
- [ ] Implement to pass tests (green)

**Key Simplification:**
- OLD: `precisionGaps: FacetName[]` (up to 5 facets) + threshold gates (`precision < 50%`, `messageCount >= 9`)
- NEW: `steeringTarget: FacetName | null` (single facet) + pure outlier math (no thresholds)

### Task 8: Cost-Aware Pausing (AC: #3)

- [ ] Implement cost estimation for budget check:
  - `estimateMessageCost(): number` (~$0.0043 per message including amortized analysis)
  - `DAILY_COST_LIMIT = 75` (dollars, from NFR8)
- [ ] Implement `BudgetPausedError` in domain errors:
  - `sessionId`: string (for resumption)
  - `message`: string (user-friendly explanation)
  - `resumeAfter`: Date (next day midnight UTC)
  - `currentPrecision`: number (so user knows progress)
- [ ] Implement cost-aware pausing in Router node:
  - Check `dailyCostUsed + estimatedCost > DAILY_COST_LIMIT` FIRST (before any routing)
  - If true, throw `BudgetPausedError` (do NOT continue with degraded mode)
  - Session state preserved exactly - resume tomorrow with same precision/gaps
- [ ] Write tests for cost-aware pausing (red):
  - Test: Normal processing when budget available
  - Test: `BudgetPausedError` thrown when limit exceeded
  - Test: Session state unchanged after pause (precision, facetScores intact)
  - Test: `resumeAfter` timestamp is next day midnight UTC
  - Test: Resumed session continues exactly where paused
- [ ] Implement to pass tests (green)

### Task 9: Integration with Existing Use-Cases (AC: #4)

- [ ] Update `apps/api/src/use-cases/send-message.use-case.ts`:
  - Replace direct Nerin call with Orchestrator call
  - Handle ProcessMessageOutput including scoring data
  - Update session with new precision from orchestrator
  - Return response with precision update
- [ ] Update `apps/api/src/handlers/assessment.ts`:
  - Inject OrchestratorRepository into handler
  - Pass dailyCostUsed from CostGuard
  - Return facet/trait scores in response when available
- [ ] Write integration tests:
  - Test: Full flow message -> orchestrator -> response
  - Test: Scoring data returned on batch messages
  - Test: Precision updates propagate correctly

### Task 10: Integration Tests (AC: Documentation & Testing)

- [ ] Create `apps/api/src/use-cases/__tests__/orchestrator-integration.test.ts`:
  - Test: Full orchestration flow (message -> route -> analyze -> score)
  - Test: Batch trigger on every 3rd message
  - Test: `BudgetPausedError` thrown when daily limit exceeded
  - Test: Paused session resumes correctly next day with preserved state
  - Test: Single steering target calculated via outlier detection
  - Test: Steering hint included in Nerin context when outlier exists
  - Test: No steering hint when facets are tightly clustered
  - Test: State persistence across multiple invocations
  - Test: Deterministic routing (same input -> same output)
- [ ] Run with TestRepositoriesLayer (mock all external dependencies)
- [ ] Verify all tests pass

### Task 11: Documentation (AC: Documentation & Testing)

- [ ] Add JSDoc comments to all new functions/classes
- [ ] Update CLAUDE.md with:
  - Orchestrator pattern documentation
  - LangGraph state machine explanation
  - Routing decision flowchart
  - Cost-aware routing explanation
- [ ] Create `docs/ORCHESTRATOR.md` with detailed architecture
- [ ] Update story file with completion notes

---

## Dev Notes

### Critical Context for Developer Agent

**Story Purpose:** This story creates the **multi-agent orchestration layer** that coordinates Nerin (conversational), Analyzer (evidence extraction), and Scorer (aggregation) into a unified LangGraph state machine. This is the BRAIN of the assessment system.

**Design Decision: Single-Target Outlier-Based Steering**

The steering mechanism uses **pure statistical outlier detection** rather than arbitrary thresholds. Rationale:

1. **One feedback mechanism** - Single `steeringTarget: FacetName | null` instead of `precisionGaps: FacetName[]`
2. **No magic numbers** - Removed thresholds like `precision < 50%`, `messageCount >= 9`, `bottom 5 facets`
3. **Self-regulating** - Outlier detection (`confidence < mean - stddev`) naturally handles:
   - Early conversation (few facets → high variance → fewer outliers)
   - Chaotic state (high variance → lower threshold → harder to be outlier)
   - Converged state (high mean → no outliers below threshold)
4. **Prevents early-conversation chaos** - With sparse data, the math naturally avoids misleading steering
5. **Single focus** - Nerin gets ONE hint, not a list of 5 facets to juggle

The system self-corrects by recalculating the weakest outlier after each scoring batch.

**Design Decision: Graceful Pause over Graceful Degradation**

When the daily budget limit is reached, we **pause the assessment** rather than continue with degraded quality. Rationale:

1. **Resumability is built-in** - PostgresSaver preserves session state perfectly
2. **No stale precision problem** - If we degraded (skipped Analyzer/Scorer), precision and facet steering hints would become stale while conversation continues
3. **User trust** - "Come back tomorrow for full accuracy" is more honest than "Quality may be reduced"
4. **Simpler implementation** - No decay logic, no "degraded but continuing" edge cases

The `BudgetPausedError` includes `resumeAfter` (next day) and `currentPrecision` so users know their progress is saved.

**Current State (What Already Exists):**

1. **Nerin Agent** (Story 2.2 - COMPLETE):
   - `packages/domain/src/repositories/nerin-agent.repository.ts` - Interface
   - `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` - Implementation
   - Already uses LangGraph with PostgresSaver
   - Already has precision-aware system prompts
   - Single-node graph (Nerin only)

2. **Analyzer** (Story 2.3 - COMPLETE):
   - `packages/domain/src/repositories/analyzer.repository.ts` - Interface
   - `packages/infrastructure/src/repositories/analyzer.claude.repository.ts` - Implementation
   - Creates FacetEvidence from messages
   - Uses Claude Sonnet 4.5 with structured JSON output

3. **Scorer** (Story 2.3 - COMPLETE):
   - `packages/domain/src/repositories/scorer.repository.ts` - Interface
   - `packages/infrastructure/src/repositories/scorer.drizzle.repository.ts` - Implementation
   - Aggregates evidence with weighted averaging + recency bias
   - Derives trait scores from facet means

4. **CostGuard** (Story 2.2.5 - COMPLETE):
   - `packages/domain/src/repositories/cost-guard.repository.ts` - Interface
   - `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts` - Implementation
   - Tracks daily costs in Redis
   - Can query current daily spend

**What This Story Creates:**
- **OrchestratorRepository** - New repository orchestrating all agents
- **LangGraph Multi-Node Graph** - Router -> Nerin -> (Analyzer -> Scorer) pipeline
- **Cost-Aware Routing** - Pause assessment when approaching budget
- **Outlier-Based Steering** - Single-target guidance using statistical outlier detection (no arbitrary thresholds)

### Architecture Patterns

**LangGraph State Machine Design:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR STATE MACHINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────┐                                                           │
│   │START │                                                           │
│   └──┬───┘                                                           │
│      │                                                               │
│      ▼                                                               │
│   ┌──────┐    ┌─────────────────────────────────────────────────┐   │
│   │ROUTER│───▶│ Decision Logic:                                 │   │
│   └──┬───┘    │ 1. FIRST: Check budget                          │   │
│      │        │    → If dailyCost > limit: throw BudgetPausedError│  │
│      │        │    → Session paused, resume tomorrow             │   │
│      │        │ 2. Calculate steeringTarget via outlier detection│   │
│      │        │    → Find facets with confidence < (mean - stddev)│  │
│      │        │    → Return single weakest outlier or null       │   │
│      │        │ 3. If budget OK → proceed to Nerin (with hint)   │   │
│      │        │ 4. If messageCount % 3 === 0                     │   │
│      │        │    → also run Analyzer + Scorer                  │   │
│      │        └─────────────────────────────────────────────────┘   │
│      │                                                               │
│      ├──────────────┐ (budget exceeded)                             │
│      │              ▼                                                │
│      │         ┌─────────────────┐                                  │
│      │         │BudgetPausedError│ → Session saved, resume tomorrow │
│      │         └─────────────────┘                                  │
│      │                                                               │
│      │ (budget OK)                                                   │
│      ▼                                                               │
│   ┌─────┐                                                            │
│   │NERIN│ ← Always runs if budget OK                                │
│   └──┬──┘                                                            │
│      │                                                               │
│      ├─────────────────────┐ (batch: msg % 3 === 0)                 │
│      │                     ▼                                         │
│      │                ┌────────┐                                     │
│      │                │ANALYZER│                                     │
│      │                └───┬────┘                                     │
│      │                    │                                          │
│      │                    ▼                                          │
│      │               ┌──────┐                                        │
│      │               │SCORER│                                        │
│      │               └───┬──┘                                        │
│      │                   │                                           │
│      └───────────────────┴───────────────────────────────────────┐  │
│                                                                   │  │
│                                                                   ▼  │
│                                                                ┌───┐ │
│                                                                │END│ │
│                                                                └───┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Hexagonal Architecture Compliance (ADR-6):**

```
┌─────────────────────────────────────────────────────────────────┐
│ apps/api/src/handlers/assessment.ts (HTTP Adapter)              │
│   ↓ calls use-cases                                             │
├─────────────────────────────────────────────────────────────────┤
│ apps/api/src/use-cases/send-message.use-case.ts                 │
│   ↓ orchestrates via OrchestratorRepository                     │
├─────────────────────────────────────────────────────────────────┤
│ packages/domain/src/repositories/orchestrator.repository.ts     │
│   (PORT - interface definition)                                 │
│   ↑ implemented by infrastructure                               │
├─────────────────────────────────────────────────────────────────┤
│ packages/infrastructure/src/repositories/                       │
│   orchestrator.langgraph.repository.ts (ADAPTER)               │
│   Depends on: NerinAgent, Analyzer, Scorer, CostGuard          │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure Notes

**Files to Create:**

```
packages/domain/src/repositories/
├── orchestrator.repository.ts          # OrchestratorRepository interface

packages/infrastructure/src/agents/
├── orchestrator-state.ts               # LangGraph state annotation
├── orchestrator-nodes.ts               # Router, Nerin, Analyzer, Scorer nodes
├── orchestrator-graph.ts               # Graph compilation
├── facet-steering.ts                   # Facet-to-topic steering hints (30 mappings)
├── steering-logic.ts                   # getSteeringTarget() outlier detection (NEW)

packages/infrastructure/src/repositories/
├── orchestrator.langgraph.repository.ts # Orchestrator implementation

apps/api/src/use-cases/__tests__/
├── orchestrator-integration.test.ts    # Integration tests
```

**Files to Modify:**

```
apps/api/src/use-cases/send-message.use-case.ts  # Use Orchestrator instead of direct Nerin
apps/api/src/handlers/assessment.ts               # Inject OrchestratorRepository
apps/api/src/test-utils/test-layers.ts            # Add OrchestratorRepository test layer
packages/domain/src/index.ts                      # Export OrchestratorRepository
packages/infrastructure/src/index.ts              # Export OrchestratorLangGraphRepositoryLive
CLAUDE.md                                         # Document orchestration patterns
```

### Technical Details

**LangGraph State Annotation Pattern:**

```typescript
// packages/infrastructure/src/agents/orchestrator-state.ts
import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { FacetEvidence, FacetScore, TraitScore, FacetName, TraitName } from "@workspace/domain";

export const OrchestratorStateAnnotation = Annotation.Root({
  // Session context
  sessionId: Annotation<string>,
  messageCount: Annotation<number>,
  userMessage: Annotation<string>,

  // Message history with reducer
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
    default: () => [] as BaseMessage[],
  }),

  // Scoring data
  facetEvidence: Annotation<FacetEvidence[]>({
    reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
    default: () => [] as FacetEvidence[],
  }),
  facetScores: Annotation<Record<FacetName, FacetScore> | undefined>,
  traitScores: Annotation<Record<TraitName, TraitScore> | undefined>,

  // Precision tracking
  precision: Annotation<number>({
    default: () => 0,
  }),

  // Single-target steering (replaces precisionGaps array)
  steeringTarget: Annotation<FacetName | null>({
    default: () => null,
  }),
  steeringHint: Annotation<string | null>({
    default: () => null,
  }),

  // Cost tracking
  tokenCount: Annotation<{ input: number; output: number; total: number }>({
    reducer: (prev, next) => ({
      input: (prev?.input ?? 0) + (next?.input ?? 0),
      output: (prev?.output ?? 0) + (next?.output ?? 0),
      total: (prev?.total ?? 0) + (next?.total ?? 0),
    }),
    default: () => ({ input: 0, output: 0, total: 0 }),
  }),
  costIncurred: Annotation<number>({
    default: () => 0,
  }),
  dailyCostUsed: Annotation<number>,
  // Note: No skipAnalysis flag - we pause instead of degrading

  // Output
  nerinResponse: Annotation<string>,
});
```

**Router Node Decision Logic:**

```typescript
// packages/infrastructure/src/agents/orchestrator-nodes.ts
import { BudgetPausedError } from "@workspace/domain";
import { getSteeringTarget } from "./steering-logic.js";
import { FACET_STEERING_HINTS } from "./facet-steering.js";

const DAILY_COST_LIMIT = 75; // dollars
const MESSAGE_COST_ESTIMATE = 0.0043; // per message (including amortized analysis)

function routerNode(state: OrchestratorState): Partial<OrchestratorState> {
  // FIRST: Check budget - pause if exceeded (don't degrade)
  if ((state.dailyCostUsed + MESSAGE_COST_ESTIMATE) > DAILY_COST_LIMIT) {
    throw new BudgetPausedError({
      sessionId: state.sessionId,
      message: "Your assessment is saved! Come back tomorrow to continue with full accuracy.",
      resumeAfter: getNextDayMidnightUTC(),
      currentPrecision: state.precision,
    });
  }

  // Single-target steering via outlier detection (no arbitrary thresholds)
  const steeringTarget = getSteeringTarget(state.facetScores ?? {});
  const steeringHint = steeringTarget
    ? FACET_STEERING_HINTS[steeringTarget]
    : null;

  return {
    steeringTarget,
    steeringHint,
  };
}

function getNextDayMidnightUTC(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}
```

**Outlier-Based Steering Logic:**

```typescript
// packages/infrastructure/src/agents/steering-logic.ts
import type { FacetName, FacetScore } from "@workspace/domain";

/**
 * Calculates the single facet most in need of exploration using outlier detection.
 *
 * Algorithm:
 * 1. Filter to assessed facets only (sampleSize > 0)
 * 2. Calculate mean and stddev of confidence scores
 * 3. Identify outliers: facets with confidence < (mean - stddev)
 * 4. Return the weakest outlier (lowest confidence)
 *
 * Returns null if:
 * - No facets have been assessed yet
 * - No outliers exist (all facets are within 1 stddev of mean)
 *
 * NO ARBITRARY THRESHOLDS - pure statistics, self-regulating.
 */
export function getSteeringTarget(
  facetScores: Record<FacetName, FacetScore>
): FacetName | null {
  const assessed = Object.entries(facetScores)
    .filter(([_, s]) => s.sampleSize > 0);

  if (assessed.length === 0) return null;

  const confidences = assessed.map(([_, s]) => s.confidence);
  const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const variance = confidences.reduce((acc, c) => acc + (c - mean) ** 2, 0) / confidences.length;
  const stddev = Math.sqrt(variance);

  const threshold = mean - stddev;

  const outliers = assessed
    .filter(([_, s]) => s.confidence < threshold)
    .sort((a, b) => a[1].confidence - b[1].confidence);

  return outliers.length > 0 ? (outliers[0][0] as FacetName) : null;
}

/**
 * Gets the steering hint for Nerin's system prompt.
 */
export function getSteeringHint(
  facetScores: Record<FacetName, FacetScore>
): string | null {
  const target = getSteeringTarget(facetScores);
  return target ? FACET_STEERING_HINTS[target] : null;
}
```

**Facet-to-Topic Steering Map:**

```typescript
// packages/infrastructure/src/agents/facet-steering.ts
import type { FacetName } from "@workspace/domain";

/**
 * Maps each of 30 facets to natural conversation steering hints.
 * Nerin uses these to guide conversation toward low-confidence areas
 * without directly asking about personality traits.
 */
export const FACET_STEERING_HINTS: Record<FacetName, string> = {
  // Openness facets
  imagination: "Ask about daydreaming, creative scenarios, or 'what if' thinking",
  artistic_interests: "Explore appreciation for art, music, literature, or beauty",
  emotionality: "Discuss emotional experiences, depth of feelings, or sensitivity",
  adventurousness: "Ask about trying new things, travel, or unfamiliar experiences",
  intellect: "Explore curiosity about ideas, philosophy, or abstract concepts",
  liberalism: "Discuss openness to different viewpoints or unconventional ideas",

  // Conscientiousness facets
  self_efficacy: "Ask about confidence in handling challenges or achieving goals",
  orderliness: "Explore how they organize their space, time, or belongings",
  dutifulness: "Discuss keeping commitments, following rules, or obligations",
  achievement_striving: "Ask about goals, ambitions, or drive for excellence",
  self_discipline: "Explore staying focused on tasks or resisting distractions",
  cautiousness: "Discuss decision-making process, planning, or risk evaluation",

  // Extraversion facets
  friendliness: "Ask about warmth toward others or making new connections",
  gregariousness: "Explore preference for social gatherings vs solitude",
  assertiveness: "Discuss taking charge, speaking up, or leading",
  activity_level: "Ask about pace of life, busyness, or energy levels",
  excitement_seeking: "Explore thrill-seeking, stimulation, or excitement",
  cheerfulness: "Discuss general mood, optimism, or expressing joy",

  // Agreeableness facets
  trust: "Ask about trusting others or giving people benefit of the doubt",
  morality: "Explore honesty, straightforwardness, or ethical considerations",
  altruism: "Discuss helping others, volunteering, or selfless acts",
  cooperation: "Ask about compromising, working with others, or avoiding conflict",
  modesty: "Explore humility, self-perception, or comfort with praise",
  sympathy: "Discuss empathy for others' struggles or compassion",

  // Neuroticism facets
  anxiety: "Gently explore worrying, uncertainty, or feeling nervous",
  anger: "Ask about frustration triggers or how they handle irritation",
  depression: "Gently discuss low moods, discouragement, or sadness",
  self_consciousness: "Explore comfort in social situations or self-awareness",
  immoderation: "Ask about impulse control, cravings, or temptations",
  vulnerability: "Discuss handling stress, pressure, or overwhelming situations",
};

// Note: buildFacetSteeringContext is NO LONGER NEEDED
// The new design passes a single steeringHint string directly to Nerin.
// Nerin's system prompt simply appends the hint when present:
//
// {{#if steeringHint}}
// Focus area: {{steeringHint}}
// Gently explore this topic in your next response. Keep it natural and conversational.
// {{/if}}
```

**Conditional Edge Routing:**

```typescript
// packages/infrastructure/src/agents/orchestrator-graph.ts
function shouldRunAnalyzer(state: OrchestratorState): string {
  // Run analyzer on batch trigger (every 3rd message)
  // Note: Budget check already happened in Router - if we're here, we have budget
  if (state.messageCount % 3 === 0) {
    return "analyzer";
  }
  return "end";
}

const workflow = new StateGraph(OrchestratorStateAnnotation)
  .addNode("router", routerNode)
  .addNode("nerin", nerinNode)
  .addNode("analyzer", analyzerNode)
  .addNode("scorer", scorerNode)
  .addEdge(START, "router")
  .addEdge("router", "nerin")
  .addConditionalEdges("nerin", shouldRunAnalyzer, {
    analyzer: "analyzer",
    end: END,
  })
  .addEdge("analyzer", "scorer")
  .addEdge("scorer", END);
```

### Testing Strategy

**TDD Workflow (Red-Green-Refactor):**

**Steering Logic Unit Tests (packages/infrastructure/src/agents/__tests__/steering-logic.test.ts):**

```typescript
import { describe, it, expect } from 'vitest';
import { getSteeringTarget, getSteeringHint } from '../steering-logic.js';

describe('getSteeringTarget', () => {
  it('returns null when no facets assessed', () => {
    expect(getSteeringTarget({})).toBeNull();
  });

  it('returns null when all facets tightly clustered (no outliers)', () => {
    const scores = {
      imagination: { confidence: 0.60, sampleSize: 3, score: 12 },
      orderliness: { confidence: 0.62, sampleSize: 3, score: 14 },
      altruism: { confidence: 0.58, sampleSize: 3, score: 11 },
    };
    // mean = 0.6, stddev ≈ 0.016, threshold ≈ 0.584
    // All values >= threshold, no outliers
    expect(getSteeringTarget(scores)).toBeNull();
  });

  it('returns weakest outlier when outliers exist', () => {
    const scores = {
      imagination: { confidence: 0.7, sampleSize: 3, score: 14 },
      orderliness: { confidence: 0.2, sampleSize: 2, score: 8 },  // outlier
      altruism: { confidence: 0.65, sampleSize: 3, score: 13 },
    };
    expect(getSteeringTarget(scores)).toBe('orderliness');
  });

  it('returns single weakest when multiple outliers exist', () => {
    const scores = {
      imagination: { confidence: 0.8, sampleSize: 3, score: 16 },
      orderliness: { confidence: 0.15, sampleSize: 2, score: 6 }, // weakest
      altruism: { confidence: 0.25, sampleSize: 2, score: 8 },    // also outlier
      trust: { confidence: 0.75, sampleSize: 3, score: 15 },
    };
    expect(getSteeringTarget(scores)).toBe('orderliness');
  });

  it('self-corrects as more data arrives', () => {
    // Early: orderliness is weak
    const early = {
      imagination: { confidence: 0.6, sampleSize: 1, score: 12 },
      orderliness: { confidence: 0.2, sampleSize: 1, score: 8 },
    };
    expect(getSteeringTarget(early)).toBe('orderliness');

    // Later: orderliness improved, altruism now weak
    const later = {
      imagination: { confidence: 0.7, sampleSize: 3, score: 14 },
      orderliness: { confidence: 0.65, sampleSize: 3, score: 13 },
      altruism: { confidence: 0.2, sampleSize: 2, score: 8 },
    };
    expect(getSteeringTarget(later)).toBe('altruism');
  });
});

describe('getSteeringHint', () => {
  it('returns null when no steering target', () => {
    expect(getSteeringHint({})).toBeNull();
  });

  it('returns mapped hint for steering target', () => {
    const scores = {
      imagination: { confidence: 0.8, sampleSize: 3, score: 16 },
      altruism: { confidence: 0.1, sampleSize: 2, score: 4 },
    };
    const hint = getSteeringHint(scores);
    expect(hint).toContain('helping others');
  });
});
```

**Phase 1 - RED (Write Failing Integration Tests):**

```typescript
// apps/api/src/use-cases/__tests__/orchestrator-integration.test.ts
import { it, describe, expect } from '@effect/vitest';
import { Effect, Exit, Cause, Option } from 'effect';
import { TestRepositoriesLayer } from '../../test-utils/test-layers.js';
import { OrchestratorRepository } from '@workspace/domain';

describe('OrchestratorRepository', () => {
  it.effect('always routes to Nerin on every message', () =>
    Effect.gen(function* () {
      const orchestrator = yield* OrchestratorRepository;

      const result = yield* orchestrator.processMessage({
        sessionId: 'test-session',
        userMessage: 'Hello, tell me about yourself.',
        messageCount: 1,
        precision: 75,
        dailyCostUsed: 10,
      });

      expect(result.nerinResponse).toBeDefined();
      expect(result.nerinResponse.length).toBeGreaterThan(0);
    }).pipe(Effect.provide(TestRepositoriesLayer))
  );

  it.effect('triggers Analyzer + Scorer on every 3rd message', () =>
    Effect.gen(function* () {
      const orchestrator = yield* OrchestratorRepository;

      const result = yield* orchestrator.processMessage({
        sessionId: 'test-session',
        userMessage: 'I like to organize my day carefully.',
        messageCount: 3,
        precision: 40,
        dailyCostUsed: 10,
      });

      expect(result.nerinResponse).toBeDefined();
      expect(result.facetEvidence).toBeDefined();
      expect(result.facetScores).toBeDefined();
      expect(result.traitScores).toBeDefined();
    }).pipe(Effect.provide(TestRepositoriesLayer))
  );

  it.effect('calculates steering target via outlier detection', () =>
    Effect.gen(function* () {
      const orchestrator = yield* OrchestratorRepository;

      // Provide facet scores with clear outlier
      const result = yield* orchestrator.processMessage({
        sessionId: 'test-session',
        userMessage: 'I prefer working alone.',
        messageCount: 6,
        precision: 50,
        dailyCostUsed: 20,
        facetScores: {
          imagination: { confidence: 0.7, sampleSize: 3, score: 14 },
          orderliness: { confidence: 0.2, sampleSize: 2, score: 8 }, // outlier
          altruism: { confidence: 0.65, sampleSize: 3, score: 13 },
        },
      });

      expect(result.steeringTarget).toBe('orderliness');
      expect(result.steeringHint).toContain('organize');
    }).pipe(Effect.provide(TestRepositoriesLayer))
  );

  it.effect('pauses assessment when approaching budget', () =>
    Effect.gen(function* () {
      const orchestrator = yield* OrchestratorRepository;

      const result = yield* orchestrator.processMessage({
        sessionId: 'test-session',
        userMessage: 'I enjoy creative activities.',
        messageCount: 3,
        precision: 40,
        dailyCostUsed: 74.99,
      }).pipe(Effect.exit);

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        expect(Option.isSome(error)).toBe(true);
        expect(error.value._tag).toBe('BudgetPausedError');
        expect(error.value.currentPrecision).toBe(40);
      }
    }).pipe(Effect.provide(TestRepositoriesLayer))
  );

  it.effect('is deterministic (same input produces same routing)', () =>
    Effect.gen(function* () {
      const orchestrator = yield* OrchestratorRepository;

      const input = {
        sessionId: 'test-session',
        userMessage: 'I prefer working alone.',
        messageCount: 6,
        precision: 30,
        dailyCostUsed: 20,
      };

      const result1 = yield* orchestrator.processMessage(input);
      const result2 = yield* orchestrator.processMessage(input);

      expect(!!result1.facetEvidence).toBe(!!result2.facetEvidence);
      expect(result1.steeringTarget).toBe(result2.steeringTarget);
    }).pipe(Effect.provide(TestRepositoriesLayer))
  );
});
```

### Dependencies

**Story Dependencies:**

| Story | Status | What it provides |
|-------|--------|------------------|
| 2.1 | DONE | Session management, message persistence |
| 2.2 | DONE | Nerin agent, LangGraph integration patterns, precision-aware prompts |
| 2.2.5 | DONE | CostGuard service, Redis cost tracking |
| 2.3 | DONE | Analyzer, Scorer, FacetEvidence types, aggregation algorithms |
| 2.6 | DONE | @effect/vitest testing framework |
| 2.7 | DONE | TypeScript compilation, linting quality |
| 2.8 | DONE | Docker integration testing infrastructure |

**Enables (Unblocks):**

| Story | What it needs from 2.4 |
|-------|------------------------|
| 2.5 | Orchestrator integration for rate limiting enforcement |
| 3.1 | Coordinated scoring pipeline for OCEAN code generation |
| 4.2 | Unified response with precision updates |
| 5.1 | Complete scoring data for results display |

### Cost Analysis

**Per-Message Cost Breakdown:**

```
Orchestrator call (every message):
- Nerin (always): $0.003 (input + output tokens)
- Router overhead: negligible (~0.0001)

Batch processing (every 3 messages):
- Analyzer: $0.003 (JSON extraction)
- Scorer: $0.001 (aggregation + derivation)
- Batch total: $0.004 additional

Average per message:
- Base: $0.003 (Nerin)
- Amortized batch: $0.004 / 3 = $0.00133
- Total average: ~$0.00433 per message

100-message assessment:
- Expected cost: $0.433 per assessment
- Daily limit ($75): ~173 assessments/day
- Within NFR8 budget (500 users at ~$0.15 target needs optimization)
```

**Cost Optimization Strategies (Future):**
1. Increase batch interval (every 5 messages instead of 3)
2. Cache system prompts to reduce input tokens
3. Use Claude Haiku for Analyzer (cheaper, still accurate for JSON extraction)

### Previous Story Intelligence

**Story 2.3 Key Learnings:**
- Analyzer uses single Claude call with structured JSON output
- Scorer aggregates with weighted averaging + recency bias
- Variance analysis detects contradictions (confidence penalty)
- All 301 tests passing after implementation

**Story 2.8 Key Learnings:**
- Integration tests use `MOCK_LLM=true` for zero-cost testing
- Docker-based testing validates production parity
- Effect Layer swapping pattern works cleanly for mocking

**Git Commit Patterns:**
- `c599b3e` - docs optimization
- `44aa902` - Story 2.8 completion (integration tests)
- `6d66aec` - Story 2.7 completion (TypeScript quality)
- `08d71c1` - Story 2.3 completion (Analyzer + Scorer)

**Code Patterns from Recent Work:**
- Effect-ts 3.19+ with Context.Tag for services
- LangGraph Annotation.Root for state definitions
- PostgresSaver for state persistence
- @effect/vitest for Effect-native testing
- Layer composition for dependency injection

---

## References

**Architecture Decisions:**
- [Source: _bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md] - Hexagonal architecture pattern
- [Source: _bmad-output/planning-artifacts/epics.md#story-24] - Full story requirements (lines 540-605)

**Internal Stories:**
- [Source: _bmad-output/implementation-artifacts/2-2-nerin-agent-setup-and-conversational-quality.md] - Nerin LangGraph patterns
- [Source: _bmad-output/implementation-artifacts/2-3-analyzer-and-scorer-agent-implementation.md] - Analyzer/Scorer algorithms
- [Source: _bmad-output/implementation-artifacts/2-8-docker-setup-for-integration-testing.md] - Integration test patterns

**Codebase Patterns:**
- `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` - Existing LangGraph implementation
- `packages/infrastructure/src/repositories/analyzer.claude.repository.ts` - Claude JSON extraction
- `packages/infrastructure/src/repositories/scorer.drizzle.repository.ts` - Scoring algorithms
- `apps/api/src/test-utils/test-layers.ts` - Test layer composition

**External Documentation:**
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) - State machines, checkpointers
- [LangGraph Conditional Edges](https://langchain-ai.github.io/langgraph/how-tos/branching/) - Routing patterns
- [Effect-ts Context Management](https://effect.website/docs/context-management/services) - Service pattern

---

## Success Criteria

**Dev Completion (Definition of Done):**

Domain Layer:
- [ ] OrchestratorRepository interface defined as Context.Tag
- [ ] ProcessMessageInput/Output types defined
- [ ] Orchestration errors defined (OrchestrationError, BudgetPausedError)
- [ ] Exported from domain package

Infrastructure Layer:
- [ ] OrchestratorStateAnnotation defined with all state fields (including steeringTarget, steeringHint)
- [ ] Router node with batch trigger + cost-aware logic + outlier-based steering
- [ ] Nerin node with single steeringHint context
- [ ] Analyzer node calling AnalyzerRepository
- [ ] Scorer node calling ScorerRepository + deriving traits
- [ ] `getSteeringTarget()` using pure outlier statistics (no arbitrary thresholds)
- [ ] Graph compiled with conditional edges
- [ ] PostgresSaver checkpointer integrated
- [ ] OrchestratorLangGraphRepositoryLive Layer exported

Use-Cases Integration:
- [ ] send-message.use-case.ts uses OrchestratorRepository
- [ ] assessment.ts handler injects OrchestratorRepository
- [ ] Response includes scoring data when available
- [ ] Precision updates propagate correctly

Testing:
- [ ] All unit tests pass (80%+ coverage target)
- [ ] Orchestrator routing tests pass (10+ tests)
- [ ] Integration tests pass (full flow verified)
- [ ] TDD workflow followed (RED -> GREEN -> REFACTOR)
- [ ] All 301+ project tests still passing

Documentation:
- [ ] JSDoc comments on all new functions
- [ ] CLAUDE.md updated with orchestration patterns
- [ ] Story file updated with completion notes

**Verification Steps:**

1. **Unit Test Verification:**
   ```bash
   pnpm test orchestrator
   pnpm test:coverage
   ```

2. **Integration Test Verification:**
   ```bash
   pnpm test:integration
   ```

3. **Manual Verification:**
   ```bash
   pnpm dev
   # Send 3 messages to trigger batch processing
   # Verify scoring data in response on 3rd message
   # Verify precision updates
   ```

4. **Cost Verification:**
   ```bash
   pnpm logs | grep "cost"
   # Verify cost tracking accurate
   # Verify skip_analysis flag when approaching limit
   ```

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
