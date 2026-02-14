# Epic 2: Assessment Backend Services

**Goal:** Implement the multi-agent orchestration system (Nerin, Analyzer, Scorer) that drives conversational assessment, real-time precision updates, and cost-aware routing.

**Dependencies:** Epic 1 (Infrastructure & Auth) — requires Railway deployment + RPC contracts

**Enables:** Epic 3 (provides facet/trait scores), Epic 4 (provides backend API), Epic 5 (provides results data)

**Blocked By:** None (Epic 1 completes first)

**Critical Path:** Core engine; blocks frontend development

**User Value:** Delivers the core conversational personality assessment experience with intelligent agent coordination

## Story 2.1: Session Management and Persistence (TDD)

As a **User**,
I want **to pause an assessment and resume from exactly where I left off**,
So that **I can take time between conversations without losing progress**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for session management
**When** I run `pnpm test session-manager.test.ts`
**Then** tests fail (red) because session implementation doesn't exist
**And** each test defines expected behavior:
  - Test: Session created with unique ID
  - Test: Messages persisted to database
  - Test: Precision scores saved and restored
  - Test: Session resume loads full history
  - Test: Conversation state is accurate after resume

**IMPLEMENTATION (Green Phase):**
**Given** an active assessment session
**When** I close the browser or disconnect
**Then** the session is saved with conversation history and current precision scores on server
**And** when I return with the session ID
**And** I click "Resume Assessment"
**Then** the conversation history loads from server in <1 second
**And** Nerin's next response can be generated seamlessly
**And** all session management tests pass (green)

**INTEGRATION:**
**Given** a resumed session
**When** I continue the conversation
**Then** my full conversation history is visible (scrollable)
**And** precision scores continue updating
**And** Assessment continues from exact point of pause

**Technical Details:**

- **TDD Workflow**: Tests written first (define session contract), implementation follows
- Database tables for session persistence:
  - `sessions` table: `id, userId, createdAt, precision, status (active/paused/completed)`
  - `assessment_messages` table: `id, sessionId, role (user/assistant), content, createdAt`
  - `facet_evidence` table: `id, messageId, facet, score, confidence, quote, highlightStart, highlightEnd, createdAt`
  - `facet_scores` table: `id, sessionId, facet, score, confidence, updatedAt`
  - `trait_scores` table: `id, sessionId, trait, score, confidence, updatedAt`
- Session state stored entirely server-side
- Resume via URL: `/assessment?sessionId={sessionId}`
- History load on resume: TanStack Query fetches:
  - All messages
  - All facet evidence linked to messages
  - Current facet scores (aggregated)
  - Current trait scores (derived)
  - Overall precision metric
- Session restoration: <1 second load time for full history + evidence + scores
- Unit test coverage: 100% of session CRUD operations

**Acceptance Checklist:**
- [ ] Failing tests written first covering session scenarios (red phase)
- [ ] Tests verify session creation and ID uniqueness
- [ ] Tests verify message persistence
- [ ] Tests verify facet evidence persistence
- [ ] Tests verify facet/trait score persistence
- [ ] Tests verify precision restoration
- [ ] Implementation passes all tests (green phase)
- [ ] Session created on startAssessment
- [ ] Messages persisted in assessment_messages table
- [ ] Facet evidence persisted in facet_evidence table
- [ ] Facet scores persisted in facet_scores table
- [ ] Trait scores persisted in trait_scores table
- [ ] Session resume loads full conversation history
- [ ] Session resume restores all facet evidence
- [ ] Session resume restores facet and trait scores
- [ ] Precision scores restored on resume
- [ ] History loads in <1 second (including evidence + scores)
- [ ] Can resume from different device via session URL
- [ ] 100% unit test coverage for SessionManager

---

## Story 2.2: Nerin Agent Setup and Conversational Quality (TDD)

As a **User**,
I want **Nerin to ask thoughtful, personalized questions that feel like a real conversation**,
So that **the assessment feels authentic and I stay engaged for the full 30 minutes**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for Nerin conversational quality
**When** I run `pnpm test nerin-agent.test.ts`
**Then** tests fail (red) because Nerin implementation doesn't exist
**And** each test defines expected behavior (using mock Anthropic API):
  - Test: First message is warm and inviting (not generic)
  - Test: Responses reference earlier conversation (context awareness)
  - Test: No repetitive questions in sequence
  - Test: Streaming responses work with token tracking
  - Test: Response latency tracked for P95 monitoring

**IMPLEMENTATION (Green Phase):**
**Given** I start an assessment
**When** Nerin sends the first message
**Then** it's a warm, inviting greeting (e.g., "Hi! I'm Nerin. I'd like to get to know you better...")
**And** it asks an open-ended question about my interests/values
**And** first message test passes (green)

**Given** I've sent 3-4 messages
**When** Nerin responds
**Then** Nerin references something I said earlier (demonstrating understanding)
**And** Nerin doesn't ask repetitive questions (tracked by Orchestrator)
**And** response streams in real-time to the UI (<2 sec P95)
**And** all quality tests pass (green)

**Technical Details:**

- **TDD Workflow**: Tests written first (define conversational expectations), implementation follows
- Nerin is Claude Sonnet 4.5 (latest available) via Anthropic API
- System prompt ensures non-judgmental, curiosity-driven tone
- Conversation context includes previous messages + current precision gaps
- Streaming via @anthropic-ai/sdk for real-time responses
- Real-time token tracking for cost monitoring
- Mock Anthropic API for deterministic testing
- Unit test coverage: 100% of Nerin system prompt logic

**Acceptance Checklist:**
- [ ] Failing tests written first with mock API (red phase)
- [ ] Tests verify warm greeting generation
- [ ] Tests verify context awareness (references prior messages)
- [ ] Tests verify no question repetition
- [ ] Tests verify streaming token counting
- [ ] Implementation passes all tests (green phase)
- [ ] Nerin first message is warm and engaging
- [ ] Responses stream to UI in <2 seconds P95
- [ ] Nerin maintains conversation context
- [ ] No repetitive questions (orchestrator tracks domain coverage)
- [ ] Token counts accurate for cost tracking
- [ ] 100% unit test coverage for Nerin system prompt

---

## Story 2.3: Evidence-Based Analyzer and Scorer Implementation (TDD)

As a **Backend System**,
I want **to create facet evidence from each message and aggregate evidence into scores**,
So that **I can provide transparent, testable personality assessment with user-visible evidence trails**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for evidence-based facet scoring
**When** I run `pnpm test analyzer.test.ts scorer.test.ts`
**Then** tests fail (red) because implementations don't exist
**And** each test defines expected behavior:
  - Test: Analyzer creates FacetEvidence records with messageId, facet (clean name), numeric score (0-20), confidence, quote, highlightRange
  - Test: Scorer aggregates FacetEvidence[] by facet using weighted averaging
  - Test: Scorer detects contradictions via variance analysis (high variance → lower confidence)
  - Test: Trait scores computed from facet averages using FACET_TO_TRAIT lookup
  - Test: Statistics (mean, variance, sampleSize) computed on-demand, not stored

**IMPLEMENTATION (Green Phase - Analyzer):**
**Given** a user message is received
**When** the Analyzer processes it
**Then** it detects 30 facet signals and creates FacetEvidence records:
  - messageId: Reference to assessment_messages.id
  - facet: Clean name ("altruism" not "agreeableness_altruism")
  - score: Numeric 0-20 (analyzer's suggestion for THIS message)
  - confidence: 0.0-1.0 (analyzer's confidence in this interpretation)
  - quote: Exact phrase from message
  - highlightRange: { start: charIndex, end: charIndex }
**And** evidence is stored in facet_evidence table
**And** analyzer tests pass (green)

**IMPLEMENTATION (Green Phase - Scorer):**
**Given** multiple FacetEvidence records exist for a facet
**When** the Scorer aggregates (every 3 messages)
**Then** it calculates aggregated score using weighted averaging:
  - Weighted by confidence + recency (recent messages weighted higher)
  - Variance calculated to detect contradictions
  - Confidence adjusted: high variance → -0.3 penalty, more samples → +0.2 bonus
**And** statistics computed on-demand from evidence:
  - mean = average of all scores
  - variance = measure of contradiction
  - sampleSize = number of evidence records
**And** Result stored as Record<FacetName, FacetScore> (no redundant facet field)
**And** scorer tests pass (green)

**IMPLEMENTATION (Green Phase - Aggregator):**
**Given** facet scores are computed
**When** the Aggregator derives traits
**Then** it uses FACET_TO_TRAIT lookup to group facets by trait
**And** trait score = sum of facet scores (0-120 scale)
**And** trait confidence = minimum confidence across facets
**And** Traits stored as Record<TraitName, TraitScore>
**And** aggregator tests pass (green)

**INTEGRATION:**
**Given** facet evidence and scores exist
**When** the frontend renders results
**Then** users can click facet score → view evidence with quotes
**And** users can click message → view contributing facets
**And** UI highlights exact quote using highlightRange
**And** precision bar updates based on facet confidence
**And** trait scores reflect sums of facets (0-120 scale)

**Technical Details:**

- **Unified FacetEvidence Type**: Single type for Analyzer output and Scorer input
- **Clean Facet Naming**: "imagination", "altruism", "orderliness" (no trait prefixes)
- **Database Schema**:
  - facet_evidence: id, messageId (FK), facet, score, confidence, quote, highlightStart, highlightEnd
  - facet_scores: id, sessionId, facet, score, confidence (statistics NOT stored)
  - trait_scores: id, sessionId, trait, score, confidence
- **Facet-First Data Model**: 30 facets → 5 traits (traits derived from facets)
- **Record Storage Pattern**: `Record<FacetName, FacetScore>` (efficient O(1) lookup)
- **Statistics Computed**: mean/variance/sampleSize calculated from facet_evidence, not stored redundantly
- **Bidirectional Navigation**: Profile ↔ Evidence ↔ Message (messageId enables linking)
- **Batch Execution**: Analyzer per message, Scorer every 3 messages

**Acceptance Checklist:**
- [ ] Failing tests written first (red phase)
- [ ] Tests verify FacetEvidence creation with messageId
- [ ] Tests verify clean facet naming (no prefixes)
- [ ] Tests verify Scorer aggregation logic (weighted average)
- [ ] Tests verify contradiction detection (variance analysis)
- [ ] Tests verify trait derivation from facets
- [ ] Tests verify statistics are computed, not stored
- [ ] Implementation passes all tests (green phase)
- [ ] Evidence stored in facet_evidence table
- [ ] Facet scores stored as Record<FacetName, FacetScore>
- [ ] Bidirectional navigation works (Profile ↔ Message)
- [ ] 100% unit test coverage for Analyzer, Scorer, Aggregator

---

## Story 2.4: LangGraph State Machine and Orchestration (TDD)

As a **Backend System**,
I want **to intelligently route messages to Nerin, Analyzer, or Scorer based on context**,
So that **I optimize for quality + cost by running expensive operations only when needed**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for LangGraph orchestration
**When** I run `pnpm test orchestrator.test.ts`
**Then** tests fail (red) because orchestrator doesn't exist
**And** each test defines expected routing behavior:
  - Test: Always routes to Nerin on every message
  - Test: Analyzer runs on every message (evidence extraction)
  - Test: Scorer triggers every 3rd message (batch aggregation)
  - Test: Hint injected only at scoring boundaries (when `messagesSinceLastScore === 0`)
  - Test: Hint targets lowest-confidence facet (`precisionGaps[0]`)
  - Test: Hint cleared after Nerin consumes it (messages 2-3 hint-free)
  - Test: Hint phrasing uses curiosity framing ("You haven't heard much about...")
  - Test: No hints when precision >= 70%
  - Test: Skips Scorer when approaching budget (Analyzer continues)
  - Test: Routing decisions are deterministic (same state → same decision)

**IMPLEMENTATION (Green Phase):**
**Given** a new message from the user
**When** the orchestrator receives it
**Then** it routes to Nerin for response generation (always)
**And** Analyzer extracts facet evidence from every message
**And** every 3rd message triggers Scorer (batch aggregation)
**And** routing tests pass (green)

**Given** a scoring cycle completes (every 3rd message)
**When** the Router evaluates precision gaps
**Then** it injects a hint for the NEXT cycle targeting the lowest-confidence facet
**And** hint is phrased as Nerin's curiosity (e.g., "You haven't heard much about how they relate to helping others")
**And** hint is consumed by Nerin on first message of cycle, then cleared
**And** messages 2 and 3 of each cycle receive NO hint injection
**And** Nerin operates with natural conversation flow between hints
**And** hint cadence tests pass (green)

**Given** precision reaches 70%+ at a scoring boundary
**When** the next cycle would begin
**Then** no further hints are injected
**And** celebration screen triggers (per Story 4.4)
**And** user can continue chatting hint-free via "Keep Exploring"
**And** precision threshold tests pass

**Given** cost is approaching daily limit
**When** the next assessment would exceed budget
**Then** the orchestrator skips Scorer (Analyzer still runs for evidence)
**And** routes directly to Nerin without hints (cost-saving)
**And** shows user graceful message: "Quality may be reduced while optimizing..."
**And** cost-aware routing tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define routing contracts), implementation follows
- LangGraph state machine with nodes: Nerin, Analyzer, Scorer, Aggregator
- State includes:
  - messages: conversation history
  - facetEvidence: FacetEvidence[] (created by Analyzer)
  - facetScores: Record<FacetName, FacetScore> (aggregated by Scorer)
  - traitScores: Record<TraitName, TraitScore> (derived by Aggregator)
  - precision: overall confidence metric
  - cost: accumulated spend
  - precisionGaps: FacetName[] (ordered by confidence ascending)
  - currentHint: FacetName | null (set at scoring boundary, cleared after Nerin consumes)
  - messagesSinceLastScore: number (resets to 0 after Scorer runs)
- Pipeline flow: Analyzer (per message) → Scorer (every 3 messages) → Aggregator (derives traits) → Router (guides Nerin)
- Routing logic:
  - Nerin: Every message
  - Analyzer: Every message (extracts evidence)
  - Scorer: Every 3 messages (aggregates scores, updates precision)
  - Hint injection: Only at scoring boundaries (message 1 of each 3-message cycle)
  - Hint cleared: After Nerin consumes it (messages 2-3 are hint-free)
  - Hint language: Framed as Nerin's curiosity ("You haven't heard much about..."), not directives
- Cost-aware routing: Skip Scorer if approaching budget (Analyzer still runs for evidence collection)
- Deterministic: Same state always produces same routing decision
- Unit test coverage: 100% of routing logic paths

**Acceptance Checklist:**
- [ ] Failing tests written first covering all routing scenarios (red phase)
- [ ] Tests verify Nerin routing on every message
- [ ] Tests verify Analyzer runs on every message (evidence extraction)
- [ ] Tests verify Scorer batch triggering (every 3 messages)
- [ ] Tests verify hint injection only at scoring boundaries (`messagesSinceLastScore === 0`)
- [ ] Tests verify `currentHint` is `null` for messages where `messagesSinceLastScore > 0`
- [ ] Tests verify hint content matches `precisionGaps[0]` facet name
- [ ] Tests verify no hint injection when `precision >= 0.7`
- [ ] Tests verify hint phrasing uses curiosity framing, not directives
- [ ] Tests verify cost-aware skipping (Scorer skipped, Analyzer continues)
- [ ] Tests verify conversation transcripts show natural topic variation between hints
- [ ] Implementation passes all tests (green phase)
- [ ] State machine defined in LangGraph with hint state management
- [ ] Routing to Nerin on every message
- [ ] Analyzer triggered every message for evidence collection
- [ ] Scorer triggered every 3 messages for aggregation
- [ ] Hint injected only at scoring boundaries (message 1 of each 3-message cycle)
- [ ] Hint targets lowest-confidence facet from precision gaps
- [ ] Messages between scoring cycles are hint-free (natural flow)
- [ ] No hints after precision reaches 70%
- [ ] Cost-aware routing skips Scorer when needed (preserves Analyzer)
- [ ] 100% unit test coverage for orchestration logic

---

## Story 2.5: LLM Cost Tracking, Rate Limiting, and Budget Enforcement (TDD)

As a **Product Owner**,
I want **to prevent uncontrolled LLM costs from consuming runway**,
So that **the MVP remains sustainable for 500 users at $75/day max**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for cost tracking and rate limiting
**When** I run `pnpm test cost-guard.test.ts`
**Then** tests fail (red) because CostGuard implementation doesn't exist
**And** each test defines expected behavior:
  - Test: Cost calculation formula: (inputTokens / 1M * 0.003) + (outputTokens / 1M * 0.015)
  - Test: Daily cost accumulation in Redis
  - Test: Rate limit enforced: 1 assessment per user per day
  - Test: Hard cap: reject if daily spend exceeds $75
  - Test: Graceful error messages returned to user

**IMPLEMENTATION (Green Phase):**
**Given** a user starts an assessment
**When** Nerin is called
**Then** system logs token counts (input + output)
**And** cost is calculated (input_tokens * 0.003 + output_tokens * 0.015)
**And** daily cost counter is incremented in Redis
**And** all cost calculation tests pass (green)

**Given** a user tries to start a second assessment in one day
**When** the rate limit is checked
**Then** the request is rejected with: "You can start a new assessment tomorrow"
**And** they can resume existing incomplete assessment
**And** rate limit tests pass

**Given** daily LLM spend exceeds $75
**When** the next assessment is started
**Then** cost guard rejects it with graceful message: "Assessment is temporarily unavailable while we optimize costs..."
**And** logs alert to Sentry
**And** hard cap tests pass

**REFACTOR & MONITORING:**
**Given** cost tracking is implemented
**When** assessing cost behavior over time
**Then** Pino logs all cost events for analytics
**And** cost trends are visible in monitoring dashboard

**Technical Details:**

- **TDD Workflow**: Tests written first (define cost limits), implementation follows
- Redis stores: `cost:{userId}:{date}` (daily cost in cents)
- Rate limiting: `assessments:{userId}:{date}` (count, max 1/day)
- Cost calculation: `(inputTokens / 1_000_000) * 0.003 + (outputTokens / 1_000_000) * 0.015`
- CostGuard Effect service manages checks + tracking
- Pino logs all cost events for analytics
- Unit test coverage: 100% of cost calculation logic, rate limiting, and budget enforcement

**Acceptance Checklist:**
- [ ] Failing tests written first covering all cost scenarios (red phase)
- [ ] Tests verify cost formula accuracy
- [ ] Tests verify rate limit enforcement
- [ ] Tests verify $75/day hard cap
- [ ] Implementation passes all tests (green phase)
- [ ] Token counts accurate from Anthropic API
- [ ] Cost calculated correctly
- [ ] Daily cost tracked in Redis
- [ ] Rate limit enforced (1 assessment/user/day)
- [ ] Hard cap prevents spend > $75/day
- [ ] Cost alerts sent to Sentry
- [ ] 100% unit test coverage for CostGuard module

---

## Story 2.8: Integration Testing (Docker Compose)

As a **Backend Developer**,
I want **integration tests that validate HTTP endpoints in a production-like Docker environment**,
So that **I can catch deployment failures locally before pushing to Railway**.

**Acceptance Criteria:**
- `compose.test.yaml` exists with Postgres + API services (non-conflicting ports) and health checks
- Integration test Vitest config and setup/teardown scripts start/stop Docker automatically
- Integration tests run on the host and send real HTTP requests against the Dockerized API
- LLM calls are mocked for integration tests (`MOCK_LLM=true`) to avoid external cost/flakiness
- `pnpm test:integration` runs cleanly and consistently
- Documentation exists for running/debugging integration tests

---

## Story 2.9: Evidence-Sourced Scoring (Remove Materialized Score Tables)

As a **Developer**,
I want **trait and facet scores computed on-demand from evidence**,
So that **scoring formula changes are instant code deploys with zero data migrations/backfills and lower sync risk**.

**Acceptance Criteria:**
- DB migration drops `facet_scores` and `trait_scores` tables (and any redundant cached score columns)
- Pure domain scoring functions exist (e.g., `aggregateFacetScores(evidence[])`, `deriveTraitScores(facetScoresMap)`)
- Score repositories are removed (interfaces, implementations, mocks, layer wiring)
- Use-cases fetch evidence and compute scores in-memory (single source of truth = evidence)
- Tests updated and passing (unit/integration)
- Architecture/docs updated to reflect evidence-sourced scoring model

---

## Story 2.10: Nerin Conversational Empathy Patterns (BACKLOG)

**Status:** backlog — to be fleshed out via create-story workflow

**Origin:** Party Mode brainstorm (2026-02-13) during Story 7-10 review. Identified as backend scope, outside Story 7-10's "zero backend changes" constraint.

As a **User in conversation with Nerin**,
I want **Nerin to actively appreciate my honesty, reframe my self-descriptions positively, and reconcile apparent contradictions in my personality**,
So that **I feel genuinely understood and seen — not just assessed — which makes me share more openly and produces richer personality insights**.

**Key Behaviors to Codify in Nerin's Agent Prompt:**

1. **Appreciation & validation** — Nerin actively acknowledges vulnerability and honesty with varied phrases (e.g., "That's really honest of you", "Not everyone has that level of self-awareness")

2. **Positive reframing** — Nerin reflects back user statements with clarity and a more generous interpretation without contradicting their reality (e.g., "I'm indecisive" → "You weigh options carefully and consider multiple perspectives")

3. **Contradiction reconciliation** — When Nerin detects conflicting trait signals across the conversation, it finds the coherent deeper truth instead of ignoring the contradiction (e.g., organized at work but messy at home → "You're not unorganized — you value your time and effort to organize what matters to you, not to others")

4. **Two-paragraph response structure** — Every response follows a consistent format: Paragraph 1 demonstrates understanding using empathy patterns (acknowledge/reframe/reconcile), then 2 line breaks (blank line) for visual separation, then Paragraph 2 asks a natural follow-up question. This ensures conversational quality and forward momentum.

**Scope:** Backend-only — Nerin agent system prompt in LangGraph orchestrator. No API contract, schema, or frontend changes.

**Dependencies:** Story 2-2 (Nerin Agent Setup) — extends the existing agent prompt.

---

## Story 2.11: Async Analyzer with Offset Steering

**Origin:** Party Mode architecture session (2026-02-14). Identified that every 3rd message blocks the HTTP response for 3-5+ seconds while Nerin + Analyzer + Scorer run sequentially in the same LangGraph graph invocation.

As a **User in conversation with Nerin**,
I want **every message to respond in 2-3 seconds regardless of whether analysis is running**,
So that **the conversation feels fluid and natural without unexplained pauses every 3rd message**.

**Problem Statement:**

The current orchestrator graph runs `router → nerin → analyzer → scorer → END` as a single synchronous pipeline. On batch messages (every 3rd: messages 3, 6, 9, ...), the HTTP response is blocked 3-5+ seconds waiting for all LLM calls to complete. Non-batch messages take 2-3 seconds (Nerin only). Users experience inconsistent latency that feels broken every 3rd message.

Additionally, the send-message response currently returns `confidence` scores (5 trait values) that the frontend uses for a progress indicator. This couples the response to the scoring pipeline and requires evidence DB reads on every message.

**Design Decisions:**

1. **Decouple analyzer from the HTTP response path** — The user-facing output is Nerin's response. Analyzer produces background data the user doesn't see until the next interaction.

2. **Offset steering from analyzer by +1 message** — Analyzer runs at messages 3, 6, 9... Steering recalculates at messages 4, 7, 10... This guarantees steering always reads fresh evidence (analyzer completes in 1-2s, human types in 10-30s) and reduces evidence DB reads by ~70%.

3. **Remove confidence from send-message response** — Replace with message-count-based progress on the frontend (MVP). Phase 2 will use ElectricSQL for live confidence updates.

**New Message Cadence (3-message cycle, offset by 1):**

```
[N % 3 === 0] BATCH    → nerin (cached steering) → forkDaemon(analyzer + scorer)
[N % 3 === 1] STEER    → read evidence → compute steering → nerin (fresh hint)
[N % 3 === 2] COAST    → nerin (cached steering from previous STEER)

Exception: messages 1-3 → no steering, no analysis (cold start)
```

| Message | Evidence Read | Analyzer | Steering | Nerin Gets |
|---------|-------------|----------|----------|------------|
| 1 | No | No | None | Default exploration |
| 2 | No | No | None | Default exploration |
| 3 | No | Background | None | Default exploration |
| 4 | Yes | No | Fresh | Targeted facet hint |
| 5 | No | No | Cached | Same hint from msg 4 |
| 6 | No | Background | Cached | Same hint from msg 4 |
| 7 | Yes | No | Fresh | New target facet |
| ... | ... | ... | ... | ... |

**Acceptance Criteria:**

**AC-1: Async Analyzer (Background Daemon)**
**Given** a batch message (messageCount % 3 === 0)
**When** the orchestrator processes the message
**Then** Nerin's response is returned to the client immediately (~2-3s)
**And** the analyzer + scorer pipeline fires as a background `Effect.forkDaemon`
**And** analyzer failures are caught and logged (never crash the daemon)
**And** non-batch messages are unaffected (no analyzer, no fork)

**AC-2: Offset Steering (Fresh Evidence)**
**Given** a steering message (messageCount % 3 === 1 AND messageCount > 3)
**When** the router node executes
**Then** it reads evidence from the DB (fresh from previous batch)
**And** computes `facetScores` via `aggregateFacetScores(evidence)`
**And** calculates `steeringTarget` + `steeringHint` from facet outliers
**And** stores steering in graph state (persisted by checkpointer for reuse)

**AC-3: Cached Steering (Non-Steering Messages)**
**Given** a coast or batch message (messageCount % 3 !== 1)
**When** the router node executes
**Then** it does NOT read evidence from the DB
**And** Nerin receives cached `facetScores` + `steeringHint` from the checkpointer state

**AC-4: Lean Response Contract**
**Given** a send-message API call
**When** the response is returned
**Then** the response schema is `{ response: string }` (confidence removed)
**And** the use-case does NOT read evidence post-orchestrator
**And** the use-case does NOT compute trait confidence for the response

**AC-5: Cold Start Handling**
**Given** messages 1-3 (no evidence exists yet)
**When** the router node executes
**Then** no steering is applied (Nerin uses default exploration patterns)
**And** no evidence read is attempted

**Technical Details:**

**Backend Changes:**

| File | Change |
|------|--------|
| `packages/contracts/src/http/groups/assessment.ts` | Remove `confidence` from `SendMessageResponseSchema` |
| `apps/api/src/use-cases/send-message.use-case.ts` | Remove post-orchestrator evidence read, confidence computation, `FacetEvidenceRepository` dependency; add `Effect.forkDaemon` for analyzer |
| `packages/domain/src/repositories/orchestrator.repository.ts` | Simplify `ProcessMessageOutput` (remove facetScores, traitScores) |
| `packages/domain/src/repositories/orchestrator-graph.repository.ts` | Split `GraphOutput` into conversation vs analysis outputs |
| `packages/infrastructure/src/repositories/orchestrator-graph.langgraph.repository.ts` | Split graph: conversation graph (router → nerin → END) + analysis pipeline (analyzer → scorer); implement offset steering logic in router |
| `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts` | Return Nerin response immediately; fork analysis pipeline as daemon |
| `packages/infrastructure/src/repositories/orchestrator.state.ts` | No structural changes (facetScores + steeringHint already persist via checkpointer) |
| `apps/api/src/handlers/assessment.ts` | Remove confidence from response mapping |
| `packages/infrastructure/src/repositories/__mocks__/orchestrator*.ts` | Update mocks to match new interfaces |

**Key Implementation Pattern — `Effect.forkDaemon`:**

```typescript
// send-message.use-case.ts (simplified)
const result = yield* orchestrator.processMessage({ sessionId, userMessage, messages, messageCount, dailyCostUsed });

yield* messageRepo.saveMessage(sessionId, "assistant", result.nerinResponse);
yield* costGuard.incrementDailyCost(userId, Math.round(result.costIncurred * 100));

// Fire-and-forget analyzer on batch messages
if (result.shouldAnalyze) {
  yield* Effect.forkDaemon(
    pipe(
      orchestrator.processAnalysis({ sessionId, messages, messageCount }),
      Effect.catchAll((error) =>
        Effect.sync(() => logger.error("Background analyzer failed", { error, sessionId }))
      )
    )
  );
}

return { response: result.nerinResponse };
```

**Key Implementation Pattern — Offset Steering in Router:**

```typescript
// Router node in orchestrator-graph
const isSteeringMessage = messageCount % 3 === 1 && messageCount > 3;

if (isSteeringMessage) {
  const evidence = yield* evidenceRepo.getEvidenceBySession(sessionId);
  const freshFacetScores = aggregateFacetScores(evidence);
  const steeringTarget = getSteeringTarget(freshFacetScores);
  const steeringHint = getSteeringHint(steeringTarget);
  return { facetScores: freshFacetScores, steeringTarget, steeringHint, isBatchMessage: false };
}
// Else: use cached facetScores/steeringHint from checkpointer state
```

**Performance Impact:**

| Metric | Before | After |
|--------|--------|-------|
| Batch message latency | 3-5+ seconds | 2-3 seconds (Nerin only) |
| Non-batch message latency | 2-3 seconds | 2-3 seconds (unchanged) |
| Evidence DB reads per 30-msg session | 30 | 9 (~70% reduction) |
| Response payload | `{ response, confidence{5} }` | `{ response }` |

**Dependencies:** Story 2.4 (Orchestrator), Story 2.9 (Evidence-Sourced Scoring)

**Companion Story:** Story 4.7 (Frontend: Message-Count Progress Indicator)

**Acceptance Checklist:**
- [ ] Graph split into conversation graph + analysis pipeline
- [ ] `Effect.forkDaemon` fires analyzer on batch messages (3, 6, 9...)
- [ ] Background analyzer failures logged, never crash response
- [ ] Steering reads evidence only on offset messages (4, 7, 10...)
- [ ] Messages 1-3 run without steering (cold start)
- [ ] Cached steering reused from checkpointer on coast/batch messages
- [ ] `SendMessageResponseSchema` returns `{ response: string }` only
- [ ] send-message use-case no longer reads evidence post-orchestrator
- [ ] send-message use-case no longer computes trait confidence
- [ ] All existing tests updated and passing
- [ ] Structured logging for background analyzer (success + failure)
- [ ] Batch message latency ≤ 3 seconds (Nerin only)

---
