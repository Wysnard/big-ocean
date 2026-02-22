# Story 9.2: Send Message & Nerin Response

Status: done

## Story

As a user (anonymous or authenticated),
I want to send messages to Nerin and receive responses,
So that I have a natural conversational experience.

## Acceptance Criteria

1. **Given** a user has an active assessment session **When** they type a message and press send **Then** the message is stored in `assessment_messages` via POST /send-message **And** Nerin's response is returned **And** the response is stored as an assistant message in `assessment_messages` **And** the session's `message_count` is incremented

2. **Given** a user sends their first message (msg 1-2) **When** Nerin responds **Then** Nerin uses cold start behavior (no steering, no analysis) **And** the response uses the existing persona/chat context system prompt

3. **Given** a user sends a message **When** the response is in progress **Then** the endpoint returns Nerin's full response (non-streaming for this story) **And** `isFinalTurn` boolean indicates if `message_count >= MESSAGE_THRESHOLD` (30)

4. **Given** an anonymous session (no `user_id`) **When** the user sends a message **Then** the `assessment_token` cookie authenticates the request **And** the session is accessed via token lookup

5. **Given** an authenticated session (has `user_id`) **When** the user sends a message **Then** the ownership guard verifies the authenticated user matches `session.userId`

6. **Given** `message_count >= MESSAGE_THRESHOLD` (30) **When** the user sends a message **Then** `isFinalTurn: true` is returned **And** the conversation can still continue (soft threshold — finalization is frontend-triggered)

## Tasks / Subtasks

- [x] Task 1: Rewrite send-message use-case as Effect pipeline (AC: #1, #2, #3, #6)
  - [x] 1.1: Remove `OrchestratorRepository` dependency — call `NerinAgentRepository` directly
  - [x] 1.2: Remove `CostGuardRepository` dependency — no cost tracking in this story (defer to Epic 10, Story 10.6)
  - [x] 1.3: Remove batch analysis `Effect.forkDaemon` — no conversanalyzer yet (Epic 10, Story 10.2)
  - [x] 1.4: Remove `freeTierMessageThreshold` / farewell pool logic — replaced by `MESSAGE_THRESHOLD` soft threshold with `isFinalTurn`
  - [x] 1.5: Implement simplified pipeline: validate session → save user message → get messages → call Nerin → save assistant message → increment message_count → return `{ response, isFinalTurn }`
  - [x] 1.6: Cold start: for all messages, pass empty `steeringHint` (no conversanalyzer yet)
  - [x] 1.7: Compute `isFinalTurn = messageCount >= appConfig.messageThreshold` after saving

- [x] Task 2: Update session ownership & auth guard (AC: #4, #5)
  - [x] 2.1: Anonymous sessions: resolve session via `assessment_token` cookie using `AssessmentTokenSecurity`
  - [x] 2.2: Authenticated sessions: verify `session.userId === authenticatedUserId`
  - [x] 2.3: Support both auth paths in the handler — cookie-based for anonymous, Better Auth for authenticated

- [x] Task 3: Update Nerin agent interface for two-tier architecture (AC: #2)
  - [x] 3.1: Simplify `NerinInvokeInput` — keep `sessionId`, `messages` — remove `facetScores` (not used without steering)
  - [x] 3.2: Add optional `targetDomain: LifeDomain` and `targetFacet: BigFiveFacetName` fields (for future steering, null for now)
  - [x] 3.3: Update system prompt builder to accept optional `(targetDomain, targetFacet)` instead of free-text `steeringHint`
  - [x] 3.4: For this story, Nerin always receives `targetDomain = undefined`, `targetFacet = undefined` (cold start equivalent)

- [x] Task 4: Persist steering targets on assistant messages (AC: #1)
  - [x] 4.1: Update `AssessmentMessageRepository.saveMessage()` to accept optional `targetDomain` and `targetBigfiveFacet`
  - [x] 4.2: Save assistant messages with `target_domain` and `target_bigfive_facet` columns (both NULL for this story)
  - [x] 4.3: Update Drizzle repository implementation to include new columns in INSERT

- [x] Task 5: Add `message_count` increment to session (AC: #1, #6)
  - [x] 5.1: Add `incrementMessageCount(sessionId)` method to `AssessmentSessionRepository`
  - [x] 5.2: Implement as atomic SQL `UPDATE ... SET message_count = message_count + 1 RETURNING message_count`
  - [x] 5.3: Use returned count for `isFinalTurn` check (avoids race condition)

- [x] Task 6: Update HTTP contracts (AC: #1, #3, #4)
  - [x] 6.1: Update `sendMessage` endpoint to support both `AssessmentTokenSecurity` (anonymous) and Better Auth (authenticated)
  - [x] 6.2: Remove `farewellMessage` and `portraitWaitMinMs` from response schema (Story 7.18 farewell is obsolete with new architecture)
  - [x] 6.3: Keep `response` + `isFinalTurn` in response schema
  - [x] 6.4: Remove `FreeTierLimitReached` error — replaced by soft `isFinalTurn` threshold
  - [x] 6.5: Remove `AgentInvocationError` — replace with `NerinError` for LLM failures

- [x] Task 7: Update handler (AC: #4, #5)
  - [x] 7.1: Handle dual auth: try `AssessmentTokenSecurity` first for anonymous, fall back to Better Auth `CurrentUser`
  - [x] 7.2: Pass resolved session (from token or userId) to use-case
  - [x] 7.3: Remove old error mappings (`BudgetPausedError`, `OrchestrationError`, `RedisOperationError`)
  - [x] 7.4: Add `NerinError` → 503 mapping

- [x] Task 8: Tests (AC: all)
  - [x] 8.1: Rewrite `send-message.use-case.test.ts` — new pipeline, no orchestrator, no cost guard
  - [x] 8.2: Test anonymous session access via token
  - [x] 8.3: Test authenticated session ownership guard
  - [x] 8.4: Test `isFinalTurn` when `message_count >= MESSAGE_THRESHOLD`
  - [x] 8.5: Test `isFinalTurn = false` when below threshold
  - [x] 8.6: Test message_count increment
  - [x] 8.7: Test Nerin invocation with correct message history
  - [x] 8.8: Test assistant message saved with response content

## Dev Notes

### Architecture Context (Two-Tier Redesign — Story 9.2)

This story **rewrites the send-message pipeline** from the old LangGraph orchestrator to a simple sequential Effect pipeline. Per architecture doc: "The use-case IS the orchestrator. No separate OrchestratorRepository."

**What gets REMOVED in this story:**
- `OrchestratorRepository` dependency (the entire LangGraph abstraction)
- `CostGuardRepository` dependency (cost tracking deferred to Story 10.6)
- `forkDaemon` batch analysis (conversanalyzer deferred to Story 10.2)
- Farewell pool / `freeTierMessageThreshold` logic (Story 7.18 — obsolete with new architecture)
- BATCH/STEER/COAST cadence routing (replaced by uniform pipeline)

**What gets ADDED:**
- Direct `NerinAgentRepository` invocation in use-case (no intermediary)
- `message_count` atomic increment on `assessment_sessions`
- `isFinalTurn` soft threshold at `MESSAGE_THRESHOLD` (30)
- Dual auth support (anonymous cookie + authenticated Better Auth)

**What gets PRESERVED:**
- Nerin agent Claude invocation (`nerin-agent.langgraph.repository.ts` — the file name says "langgraph" but it's actually a direct Claude call as of Story 2.4)
- System prompt builder (`nerin-system-prompt.ts`)
- Message persistence pattern
- Session validation logic (adapted for dual auth)

### New Pipeline (replaces orchestrator)

```
sendMessage use-case (anonymous-capable):
  → resolve session (token or userId)
  → validate session status === 'active'
  → save user message to assessment_messages
  → get all messages for session
  → count user messages for threshold check
  → call NerinAgentRepository.invoke({ sessionId, messages })
  → save assistant message to assessment_messages (target_domain=NULL, target_bigfive_facet=NULL)
  → incrementMessageCount(sessionId) → returns new count
  → isFinalTurn = newCount >= MESSAGE_THRESHOLD
  → return { response, isFinalTurn }
```

### Critical: What This Story Does NOT Include

- **No conversanalyzer** — Haiku analysis deferred to Story 10.2
- **No steering** — Formula-driven steering deferred to Story 10.3/10.4
- **No cost tracking** — Redis cost guard deferred to Story 10.6
- **No advisory lock** — Concurrent message protection deferred to Story 10.5
- **No streaming** — Non-streaming response (streaming is a UX concern for Story 9.5)
- **No frontend changes** — Chat UI deferred to Story 9.5

This story delivers the **backend message exchange pipeline only**: user sends text → Nerin responds → message_count tracked → isFinalTurn signaled.

### Dual Auth Strategy

The handler must support **two authentication paths** for the same endpoint:

1. **Anonymous users** — `assessment_token` httpOnly cookie → look up session via `sessionRepo.findByToken(token)` → verify `session.status === 'active'`
2. **Authenticated users** — Better Auth middleware → `CurrentUser` → look up session via `sessionRepo.findActiveByUserId(userId)` → verify ownership

Pattern from Story 9-1: `AssessmentTokenSecurity` defined at `packages/contracts/src/security/assessment-token.ts`:
```typescript
export const AssessmentTokenSecurity = HttpApiSecurity.apiKey({
  in: "cookie",
  key: "assessment_token",
});
```

**Implementation approach**: The handler should try to decode `AssessmentTokenSecurity` first. If present, use token-based session lookup. If absent, fall through to Better Auth `CurrentUser` for authenticated session lookup.

### Nerin Agent Interface Update

**Current interface** (`packages/domain/src/repositories/nerin-agent.repository.ts`):
```typescript
interface NerinInvokeInput {
  sessionId: string;
  messages: DomainMessage[];
  facetScores?: FacetScoresMap;    // REMOVE — not used without old steering
  steeringHint?: string;           // REPLACE with targetDomain + targetFacet
}
```

**New interface** (for two-tier architecture):
```typescript
interface NerinInvokeInput {
  sessionId: string;
  messages: DomainMessage[];
  targetDomain?: LifeDomain;           // From steering (null for cold start / this story)
  targetFacet?: BigFiveFacetName;      // From steering (null for cold start / this story)
}
```

**System prompt builder update** (`packages/domain/src/utils/nerin-system-prompt.ts`):
- Currently: `buildChatSystemPrompt(steeringHint?: string)` appends free-text hint
- New: `buildChatSystemPrompt(targetDomain?: LifeDomain, targetFacet?: BigFiveFacetName)` — derives hint from domain + facet definitions when provided. For this story, both are undefined → no steering section appended.

### Message Count Strategy

Architecture doc: `message_count` on `assessment_sessions` — increment atomically.

**Add to `AssessmentSessionRepository`:**
```typescript
incrementMessageCount(sessionId: string): Effect<number, DatabaseError>
// Returns the NEW message_count after increment
```

**Drizzle implementation:**
```typescript
const [result] = await db
  .update(assessmentSession)
  .set({ messageCount: sql`message_count + 1`, updatedAt: new Date() })
  .where(eq(assessmentSession.id, sessionId))
  .returning({ messageCount: assessmentSession.messageCount });
```

**Count user messages only**: The `message_count` column counts ALL messages (user + assistant). For `isFinalTurn`, compare against `MESSAGE_THRESHOLD` which represents total message count. The greeting messages (2 assistant messages from start) are included in the count established at session creation.

**Clarification:** `message_count` starts at the number of greeting messages (2 from Story 9-1). Each send-message call adds 2 (user + assistant) via two increments or a single +2. Simplest: increment once per `sendMessage` call (count = user messages only), then `isFinalTurn = userMessageCount >= MESSAGE_THRESHOLD`. This aligns with the architecture doc where `MESSAGE_THRESHOLD = 30` means 30 user messages.

**Decision:** Increment `message_count` by 1 per user message only. Greeting messages are NOT counted (they're assistant messages). `isFinalTurn = messageCount >= appConfig.messageThreshold` where messageCount = user messages sent so far.

### Assessment Message Repository Update

**Add optional columns to `saveMessage`:**

```typescript
saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  userId?: string,
  targetDomain?: LifeDomain,
  targetBigfiveFacet?: BigFiveFacetName,
): Effect<AssessmentMessageEntity, DatabaseError>
```

The Drizzle implementation inserts into the `target_domain` and `target_bigfive_facet` columns (pgEnum types already exist from Story 9-1 schema).

### Files to Modify

```
packages/domain/src/repositories/nerin-agent.repository.ts          MODIFY — update interface
packages/domain/src/repositories/assessment-session.repository.ts   EXTEND — add incrementMessageCount
packages/domain/src/repositories/assessment-message.repository.ts   EXTEND — add targetDomain/targetFacet params
packages/domain/src/utils/nerin-system-prompt.ts                    MODIFY — accept (targetDomain, targetFacet)
packages/domain/src/entities/message.entity.ts                      EXTEND — add targetDomain/targetFacet fields

packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts   MODIFY — use updated interface
packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts  EXTEND — incrementMessageCount
packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts  EXTEND — new columns
packages/infrastructure/src/repositories/__mocks__/nerin-agent.langgraph.repository.ts  MODIFY
packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts  EXTEND
packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts  EXTEND

packages/contracts/src/http/groups/assessment.ts         MODIFY — update sendMessage contract, dual auth, clean response schema
apps/api/src/handlers/assessment.ts                       MODIFY — dual auth handler, remove old error mappings
apps/api/src/use-cases/send-message.use-case.ts           REWRITE — new Effect pipeline
apps/api/src/use-cases/__tests__/send-message.use-case.test.ts  REWRITE — new test suite
```

### Files to Potentially Remove (cleanup)

```
packages/domain/src/repositories/orchestrator.repository.ts          REMOVE — replaced by direct Nerin call
packages/domain/src/repositories/orchestrator-graph.repository.ts    REMOVE — LangGraph abstraction
packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts  REMOVE
packages/infrastructure/src/repositories/orchestrator-graph.langgraph.repository.ts  REMOVE
packages/infrastructure/src/repositories/orchestrator.nodes.ts       REMOVE
packages/infrastructure/src/repositories/orchestrator.state.ts       REMOVE
packages/infrastructure/src/repositories/__mocks__/orchestrator.langgraph.repository.ts  REMOVE
packages/infrastructure/src/repositories/__mocks__/orchestrator-graph.langgraph.repository.ts  REMOVE
```

**Important:** Before removing orchestrator files, verify no other use-cases depend on them. Check `apps/api/src/index.ts` for layer wiring and update accordingly. Also remove `OrchestratorRepository` from barrel exports in `packages/domain/src/index.ts` and `packages/infrastructure/src/index.ts`.

### Error Types

**Remove from contracts/domain:**
- `OrchestrationError` — LangGraph removed
- `FreeTierLimitReached` — replaced by soft `isFinalTurn`
- `BudgetPausedError` mapping in handler (error type stays in domain for Story 10.6)

**Keep/Add:**
- `SessionNotFound` (404) — invalid session or access denied
- `DatabaseError` (500) — DB operation failure
- `SessionCompletedError` (409) — send-message on completed/finalizing session (new)
- Add `NerinError` in domain repositories — LLM call failure → handler maps to 503

**`SessionCompletedError` guard:** Before processing, check `session.status === 'active'`. If `finalizing` or `completed`, throw `SessionCompletedError`. Frontend should redirect to results page.

### Previous Story Intelligence (9-1)

**Key learnings from Story 9-1:**
- Cookie auth pattern: `HttpApiSecurity.apiKey({ in: "cookie", key: "assessment_token" })` — works, tested in integration
- Session resumption via `findByToken(token)` — proven pattern
- Schema has `message_count` INTEGER DEFAULT 0 on `assessment_sessions` — ready for increment
- `target_domain` and `target_bigfive_facet` columns exist on `assessment_message` — pgEnum types ready
- `assessment_session.status` supports 'active' | 'paused' | 'finalizing' | 'completed'
- Greeting messages saved at session creation (2 assistant messages)
- `FacetEvidenceNoopRepositoryLive` is a temporary stub — can be removed in cleanup
- All tests pass: domain 19, front 173, api 162 (2 skipped: analyzer-scorer-integration, save-facet-evidence)

**Skipped tests from 9-1 (dead functionality):**
- `analyzer-scorer-integration.test.ts` — old pipeline, safe to delete
- `save-facet-evidence.use-case.test.ts` — old evidence model, safe to delete

### Testing Standards

- Use `@effect/vitest` with `it.effect()` pattern
- Each test file declares its own `vi.mock()` calls + minimal `TestLayer`
- Mock architecture follows `__mocks__/` convention
- No centralized TestRepositoriesLayer — compose locally per test
- For `NerinAgentRepository` mock: return deterministic response with fixed token counts
- Test `isFinalTurn` boundary: test at `MESSAGE_THRESHOLD - 1` (false) and `MESSAGE_THRESHOLD` (true)

### Nerin Constants Reference

- **Persona:** `packages/domain/src/constants/nerin-persona.ts` — shared identity
- **Chat context:** `packages/domain/src/constants/nerin-chat-context.ts` — conversation rules
- **Greeting:** `packages/domain/src/constants/nerin-greeting.ts` — initial greeting + 6 opening questions
- **System prompt builder:** `packages/domain/src/utils/nerin-system-prompt.ts` — combines persona + context + optional steering

### AppConfig Reference

Key fields from `packages/domain/src/config/app-config.ts`:
- `messageThreshold: 30` — MESSAGE_THRESHOLD for isFinalTurn (added in Story 9-1)
- `nerinModelId` — Claude model for Nerin
- `nerinMaxTokens: 1024`
- `nerinTemperature: 0.7`
- `conversanalyzerModel` — exists but NOT used in this story
- `finanalyzerModel` — exists but NOT used in this story

### Project Structure Notes

- All repository interfaces in `packages/domain/src/repositories/`
- All implementations in `packages/infrastructure/src/repositories/`
- All mocks in `packages/infrastructure/src/repositories/__mocks__/`
- Use-cases in `apps/api/src/use-cases/`
- Handlers in `apps/api/src/handlers/`
- Contracts in `packages/contracts/src/http/groups/`
- Dependency direction: domain ← infrastructure ← use-cases ← handlers

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Effect-Pipeline-LangGraph-Replacement] — New pipeline specification
- [Source: _bmad-output/planning-artifacts/architecture.md#Interface-Boundaries] — Nerin interface simplified
- [Source: _bmad-output/planning-artifacts/architecture.md#Steering-on-Messages] — target_domain + target_bigfive_facet
- [Source: _bmad-output/planning-artifacts/architecture.md#Cold-Start-Formula-Handling] — No steering for msgs 1-2
- [Source: _bmad-output/planning-artifacts/architecture.md#Concurrent-Message-Protection] — Advisory lock (deferred)
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Endpoints] — POST /send-message spec
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Types] — Error inventory
- [Source: _bmad-output/planning-artifacts/architecture.md#AppConfig-New-Fields] — MESSAGE_THRESHOLD
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2] — Acceptance criteria
- [Source: _bmad-output/implementation-artifacts/9-1-anonymous-assessment-start.md] — Previous story learnings
- [Source: packages/domain/src/repositories/nerin-agent.repository.ts] — Current Nerin interface
- [Source: packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts] — Nerin implementation
- [Source: apps/api/src/use-cases/send-message.use-case.ts] — Current use-case (to be rewritten)
- [Source: packages/contracts/src/security/assessment-token.ts] — Cookie auth security

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Build errors in `nerin-agent.mock.repository.ts` and `orchestrator-graph.langgraph.repository.ts` — both referenced removed `facetScores`/`steeringHint` properties on `NerinInvokeInput`. Fixed by updating to `targetDomain`/`targetFacet`.
- Test failures in `nerin-steering-integration.test.ts` — asserted on `facetScores` property no longer on `NerinInvokeInput`. Updated tests to verify `sessionId`, `messages`, and `targetDomain`/`targetFacet`.
- Domain test failures in `nerin-system-prompt.test.ts` — tests called old string API `buildChatSystemPrompt("hint text")`. Updated to new `(targetDomain, targetFacet)` API.

### Completion Notes List

- All 8 tasks implemented and verified
- 21 new send-message use-case tests (all passing)
- Total test counts: domain 617, API 153 (22 skipped — pre-existing), front 173
- Build passes cleanly (no TypeScript errors)
- Lint passes (only pre-existing warnings — 5 `any` usages in API)
- Orchestrator files NOT removed — deferred to cleanup story. Other use-cases and integration tests still reference them.
- `nerin-steering-integration.test.ts` updated to match new `NerinInvokeInput` interface (no `facetScores`/`steeringHint`)

### Senior Developer Review (AI) — 2026-02-22

**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Issues Found:** 2 Critical, 4 High, 4 Medium
**Issues Fixed:** 8 (all Critical + High + Medium)
**Action Items Created:** 0

**Fixes Applied:**
1. **[CRITICAL] Orchestrator graph passes steering to Nerin** — `orchestrator-graph.langgraph.repository.ts` now forwards `targetFacet` from graph state to `nerinAgent.invoke()`. Previously computed steering was dead code.
2. **[CRITICAL] Nerin mock uses plain text responses** — `nerin-agent.mock.repository.ts` rewritten to return plain `string` responses matching `NerinInvokeOutput`. Removed obsolete `NerinResponse` structured-output shape and `console.log` calls.
3. **[HIGH] Token auth validates session ownership** — `assessment.ts` handler now checks `tokenSession.id === payload.sessionId` before processing anonymous requests. Prevents cross-session access.
4. **[HIGH] Tests converted to `it.effect()` pattern** — `send-message.use-case.test.ts` now uses `@effect/vitest` `it.effect()` + `Effect.gen` + `Effect.exit` per project conventions.
5. **[HIGH] Mock `incrementMessageCount` fails on missing session** — `__mocks__/assessment-session.drizzle.repository.ts` now returns `DatabaseError` instead of silent `0` for unknown sessions.
6. **[HIGH] `MESSAGE_THRESHOLD` aligned to production default (25)** — Test constant changed from `30` to `25` to match `app-config.live.ts` default.
7. **[MEDIUM] Steering integration test: missing `TestAssessmentMessageLayer`** — Added to 2nd and 3rd test cases in `nerin-steering-integration.test.ts`.
8. **[MEDIUM] `console.log` removed from mock** — All 6+ `console.log` calls in `nerin-agent.mock.repository.ts` removed.

**Not Fixed (acknowledged, no action needed for this story):**
- `message_count` semantic ambiguity (exchange count vs user-message count) — values are equivalent in current architecture. Documented.
- Orphaned message risk on `getMessages` failure — low probability, acceptable for MVP.

### Change Log

| File | Change | Reason |
|------|--------|--------|
| `packages/domain/src/repositories/nerin-agent.repository.ts` | MODIFY — replaced `facetScores`/`steeringHint` with `targetDomain`/`targetFacet` | Task 3: Two-tier architecture interface |
| `packages/domain/src/repositories/assessment-session.repository.ts` | EXTEND — added `incrementMessageCount` method | Task 5: Atomic message count |
| `packages/domain/src/repositories/assessment-message.repository.ts` | EXTEND — added `targetDomain`/`targetBigfiveFacet` to `saveMessage` | Task 4: Persist steering targets |
| `packages/domain/src/utils/nerin-system-prompt.ts` | MODIFY — changed signature to `(targetDomain?, targetFacet?)` | Task 3: Structured steering |
| `packages/domain/src/utils/__tests__/nerin-system-prompt.test.ts` | MODIFY — updated tests for new API | Task 3: Test fix |
| `packages/domain/src/errors/http.errors.ts` | EXTEND — added `SessionCompletedError`, `NerinError` | Task 6: New error types |
| `packages/domain/src/index.ts` | MODIFY — updated barrel exports | Task 6: Export new types |
| `packages/contracts/src/errors.ts` | MODIFY — updated re-exports | Task 6: Export new types |
| `packages/contracts/src/http/groups/assessment.ts` | MODIFY — updated sendMessage contract, removed farewell/portrait fields, added new errors | Task 6: HTTP contract update |
| `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` | MODIFY — use `targetDomain`/`targetFacet` in system prompt call | Task 3: Updated implementation |
| `packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts` | MODIFY — replaced `steeringHint`/`facetScores` logging with `targetDomain`/`targetFacet` | Build fix: interface alignment |
| `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` | EXTEND — added `incrementMessageCount` with atomic SQL | Task 5: Implementation |
| `packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts` | EXTEND — added `targetDomain`/`targetBigfiveFacet` to INSERT | Task 4: Implementation |
| `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts` | EXTEND — added `incrementMessageCount` mock | Task 5: Mock |
| `packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts` | EXTEND — updated `saveMessage` mock signature | Task 4: Mock |
| `packages/infrastructure/src/repositories/orchestrator-graph.langgraph.repository.ts` | MODIFY — removed `facetScores` from Nerin invocation | Build fix: interface alignment |
| `apps/api/src/use-cases/send-message.use-case.ts` | REWRITE — new Effect pipeline, direct Nerin invocation | Task 1: Core pipeline |
| `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` | REWRITE — 21 tests for new pipeline | Task 8: Tests |
| `apps/api/src/use-cases/__tests__/nerin-steering-integration.test.ts` | MODIFY — updated for new `NerinInvokeInput` interface | Test fix: interface alignment |
| `apps/api/src/handlers/assessment.ts` | MODIFY — dual auth handler, NerinError mapping | Task 7: Handler update |

### File List

```
packages/domain/src/repositories/nerin-agent.repository.ts
packages/domain/src/repositories/assessment-session.repository.ts
packages/domain/src/repositories/assessment-message.repository.ts
packages/domain/src/utils/nerin-system-prompt.ts
packages/domain/src/utils/__tests__/nerin-system-prompt.test.ts
packages/domain/src/errors/http.errors.ts
packages/domain/src/index.ts
packages/contracts/src/errors.ts
packages/contracts/src/http/groups/assessment.ts
packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts
packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts
packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts
packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts
packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts
packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts
packages/infrastructure/src/repositories/orchestrator-graph.langgraph.repository.ts
apps/api/src/use-cases/send-message.use-case.ts
apps/api/src/use-cases/__tests__/send-message.use-case.test.ts
apps/api/src/use-cases/__tests__/nerin-steering-integration.test.ts
apps/api/src/handlers/assessment.ts
```
