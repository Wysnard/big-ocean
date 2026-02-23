# Story 11.2: FinAnalyzer Sonnet Integration

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the system,
I want to re-analyze all conversation messages with full context at finalization using Sonnet,
So that personality evidence is comprehensive, richly detailed, and suitable for scoring and portrait generation.

## Acceptance Criteria

1. **Given** generateResults is triggered for a session in `"finalizing"` status **When** Phase 1 of finalization executes **Then** FinAnalyzer (Sonnet) re-analyzes ALL messages with the full conversation as context (FR5.1) **And** results are stored in the `finalization_evidence` table

2. **Given** FinAnalyzer processes messages **When** evidence records are created **Then** each record contains the rich schema: `bigfive_facet`, `score` (0-20), `confidence` (0.0-1.0), `domain` (enum), `rawDomain` (free-text), `quote` (exact text from message), `highlightStart` (integer, nullable), `highlightEnd` (integer, nullable) (FR5.1, FR7.2)

3. **Given** a message contains multiple personality signals **When** FinAnalyzer extracts them **Then** separate `finalization_evidence` records are created for each signal **And** character-level highlight ranges accurately identify the relevant quote portions via server-side `indexOf` computation

4. **Given** the `finalization_evidence` table **When** records are created **Then** they reference both the `assessment_result_id` and `assessment_message_id` as foreign keys **And** `messageId` values from the LLM are validated against actual message IDs (reject invalid, log warning, don't crash)

5. **Given** generateResults has already created `finalization_evidence` for a session (Guard 2) **When** generateResults is retried **Then** the FinAnalyzer LLM call is skipped — existing evidence is reused for score computation (idempotency)

6. **Given** the FinAnalyzer LLM call fails **When** the error is caught **Then** it retries once via `Effect.retry(Schedule.once)` **And** if the retry also fails, generateResults fails with `FinanalyzerError` and the session stays in `"finalizing"` status (retryable from wait screen)

7. **Given** the FinAnalyzer processes a conversation **When** it outputs evidence **Then** highlight positions are computed server-side via `message.content.indexOf(quote)` — the LLM does NOT output highlight positions **And** if `indexOf` returns -1, `highlightStart` and `highlightEnd` are set to `null` (graceful degradation)

## Tasks / Subtasks

- [ ] Task 1: Create FinAnalyzer repository interface (AC: #1, #2, #4)
  - [ ] 1.1: Create `packages/domain/src/repositories/finanalyzer.repository.ts`:
    - Define `FinanalyzerMessage` type: `{ readonly id: string; readonly role: "user" | "assistant"; readonly content: string }` — uses the existing `DomainMessage` type from `packages/domain/src/types/message.ts`
    - Define `FinalizationEvidenceOutput` type: `{ readonly messageId: string; readonly bigfiveFacet: FacetName; readonly score: number; readonly confidence: number; readonly domain: LifeDomain; readonly rawDomain: string; readonly quote: string }`
    - Define `FinanalyzerOutput` type: `{ readonly evidence: readonly FinalizationEvidenceOutput[]; readonly tokenUsage: { readonly input: number; readonly output: number } }`
    - Define `FinanalyzerError` as `S.TaggedError("FinanalyzerError")` with `{ message: S.String }` — co-located with the repository interface (infrastructure error, NOT in http.errors.ts)
    - Define `FinanalyzerRepository` as `Context.Tag("FinanalyzerRepository")` with method: `analyze(params: { readonly messages: readonly FinanalyzerMessage[] }): Effect.Effect<FinanalyzerOutput, FinanalyzerError>`
  - [ ] 1.2: Export `FinanalyzerRepository`, `FinanalyzerError`, `FinanalyzerMessage`, `FinalizationEvidenceOutput`, `FinanalyzerOutput` from `packages/domain/src/index.ts`

- [ ] Task 2: Create FinalizationEvidence repository interface (AC: #4)
  - [ ] 2.1: Create `packages/domain/src/repositories/finalization-evidence.repository.ts`:
    - Define `FinalizationEvidenceRecord` type matching the DB schema: `{ id, assessmentMessageId, assessmentResultId, bigfiveFacet, score, confidence, domain, rawDomain, quote, highlightStart: number | null, highlightEnd: number | null, createdAt }`
    - Define `FinalizationEvidenceInput` type (for inserts): same fields minus `id` and `createdAt`
    - Define `FinalizationEvidenceError` as `S.TaggedError("FinalizationEvidenceError")` with `{ message: S.String }`
    - Define `FinalizationEvidenceRepository` as `Context.Tag("FinalizationEvidenceRepository")` with methods:
      - `saveBatch(evidence: readonly FinalizationEvidenceInput[]): Effect.Effect<void, FinalizationEvidenceError>`
      - `getByResultId(assessmentResultId: string): Effect.Effect<readonly FinalizationEvidenceRecord[], FinalizationEvidenceError>`
      - `existsForSession(sessionId: string): Effect.Effect<boolean, FinalizationEvidenceError>` — for idempotency Guard 2
  - [ ] 2.2: Export from `packages/domain/src/index.ts`

- [ ] Task 3: Create AssessmentResult repository interface (AC: #1)
  - [ ] 3.1: Create `packages/domain/src/repositories/assessment-result.repository.ts`:
    - Define `AssessmentResultRecord` type: `{ id, assessmentSessionId, facets: Record<FacetName, { score: number; confidence: number }>, traits: Record<TraitName, { score: number; confidence: number }>, domainCoverage: Record<LifeDomain, number>, portrait: string, createdAt }`
    - Define `AssessmentResultInput` type (for inserts): same fields minus `id` and `createdAt`
    - Define `AssessmentResultError` as `S.TaggedError("AssessmentResultError")` with `{ message: S.String }`
    - Define `AssessmentResultRepository` as `Context.Tag("AssessmentResultRepository")` with methods:
      - `create(input: AssessmentResultInput): Effect.Effect<AssessmentResultRecord, AssessmentResultError>`
      - `getBySessionId(sessionId: string): Effect.Effect<AssessmentResultRecord | null, AssessmentResultError>`
  - [ ] 3.2: Export from `packages/domain/src/index.ts`

- [ ] Task 4: Create FinAnalyzer Anthropic implementation (AC: #1, #2, #3, #7)
  - [ ] 4.1: Create `packages/infrastructure/src/repositories/finanalyzer.anthropic.repository.ts`:
    - Follow the exact pattern from `conversanalyzer.anthropic.repository.ts` (tool use with Effect Schema → JSONSchema)
    - Use `AppConfig.finanalyzerModel` for model selection (default: `claude-sonnet-4-5-20250514` or current latest)
    - **Tool schema** (infrastructure-internal, NOT in domain):
      - Define `FinalizationEvidenceItemSchema` with fields: `messageId` (string — the UUID from the message prefix), `bigfiveFacet` (enum from ALL_FACETS), `score` (integer 0-20 from SCORE_MIN/SCORE_MAX), `confidence` (number 0-1 from CONFIDENCE_MIN/CONFIDENCE_MAX), `domain` (enum from LIFE_DOMAINS), `rawDomain` (string, free-text), `quote` (string, verbatim from message)
      - Define `FinalizationExtractionSchema` wrapping an array of evidence items
    - **Prompt construction:**
      - Format messages as `[{messageId}] {role}: {content}` — the LLM references messages by their UUID prefix
      - System prompt instructs: analyze ALL messages with full conversation context, extract ALL personality signals (no cap), output verbatim quotes only, prefer longer/unique quotes, tag with hard domain + soft rawDomain
      - Include Big Five facet definitions from domain constants for accurate tagging
      - Include domain definitions and boundaries (from architecture doc) — emphasize "user emphasis" rule for domain classification
    - **LLM call:** Single `anthropic.messages.create()` with tool use, parse tool call result via Effect Schema `decodeUnknownSync`
    - **Error handling:** Wrap Anthropic SDK errors in `FinanalyzerError`. No retry in the repository — retry handled by use-case
    - **Token usage:** Extract from `response.usage` and return in output
  - [ ] 4.2: Add `finanalyzerModel` field to `AppConfig` interface in `packages/domain/src/config/app-config.ts` — type `string`
  - [ ] 4.3: Add env var mapping in `packages/infrastructure/src/config/app-config.live.ts`: `finanalyzerModel: process.env.FINANALYZER_MODEL ?? "claude-sonnet-4-5-20250514"`
  - [ ] 4.4: Add test default in `packages/domain/src/config/__mocks__/app-config.ts`: `finanalyzerModel: "mock-finanalyzer-model"`
  - [ ] 4.5: Export `FinanalyzerAnthropicRepositoryLive` from `packages/infrastructure/src/index.ts`

- [ ] Task 5: Create FinalizationEvidence Drizzle implementation (AC: #3, #4, #7)
  - [ ] 5.1: Create `packages/infrastructure/src/repositories/finalization-evidence.drizzle.repository.ts`:
    - `saveBatch`: Batch INSERT into `finalization_evidence` table using Drizzle `db.insert().values()`
    - `getByResultId`: SELECT WHERE `assessment_result_id = ?` ORDER BY `created_at`
    - `existsForSession`: SELECT EXISTS from `finalization_evidence fe JOIN assessment_results ar ON fe.assessment_result_id = ar.id WHERE ar.assessment_session_id = ?`
    - Map domain types ↔ Drizzle types (FacetName → bigfiveFacetNameEnum, LifeDomain → evidenceDomainEnum)
  - [ ] 5.2: Export `FinalizationEvidenceDrizzleRepositoryLive` from `packages/infrastructure/src/index.ts`

- [ ] Task 6: Create AssessmentResult Drizzle implementation (AC: #1)
  - [ ] 6.1: Create `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`:
    - `create`: INSERT into `assessment_results`, return created record
    - `getBySessionId`: SELECT WHERE `assessment_session_id = ?` LIMIT 1
    - JSONB columns (`facets`, `traits`, `domainCoverage`) stored as-is — Drizzle handles JSON serialization
  - [ ] 6.2: Export `AssessmentResultDrizzleRepositoryLive` from `packages/infrastructure/src/index.ts`

- [ ] Task 7: Implement highlight position computation (AC: #3, #7)
  - [ ] 7.1: Create pure function `computeHighlightPositions` in `packages/domain/src/utils/highlight.ts`:
    ```typescript
    export function computeHighlightPositions(
      messageContent: string,
      quote: string,
    ): { highlightStart: number | null; highlightEnd: number | null }
    ```
    - Exact match: `messageContent.indexOf(quote)` — if found and unique (only one occurrence), return `{ highlightStart: index, highlightEnd: index + quote.length }`
    - Multiple matches: return `{ highlightStart: null, highlightEnd: null }` (ambiguous)
    - No match: return `{ highlightStart: null, highlightEnd: null }` (graceful degradation)
    - Edge cases: empty quote → null, empty message → null
  - [ ] 7.2: Export from `packages/domain/src/index.ts`
  - [ ] 7.3: Unit tests in `packages/domain/src/utils/__tests__/highlight.test.ts`:
    - Exact match returns correct positions
    - Multiple matches returns null (ambiguous)
    - No match returns null
    - Empty inputs return null
    - Unicode content works correctly
    - Quote at start/end of message works

- [ ] Task 8: Implement generate-results Phase 1 — FinAnalyzer integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 8.1: Modify `apps/api/src/use-cases/generate-results.use-case.ts`:
    - **Add dependencies:** `FinanalyzerRepository`, `FinalizationEvidenceRepository`, `AssessmentResultRepository`, `AssessmentMessageRepository` (already available)
    - **Add idempotency Guard 2** BEFORE the existing Phase 1 placeholder:
      ```
      const evidenceExists = yield* finalizationEvidenceRepo.existsForSession(input.sessionId)
      if (evidenceExists) {
        // Skip FinAnalyzer — evidence already exists from previous attempt
        // Log: "Idempotency Guard 2: finalization evidence exists, skipping FinAnalyzer"
        // GOTO Phase 2 (Story 11.3 — still placeholder for now)
      }
      ```
    - **Replace Phase 1 placeholder** with real FinAnalyzer integration:
      1. Fetch ALL messages for session: `yield* messageRepo.getMessagesBySession(input.sessionId)` — returns messages ordered by `message_number`
      2. Filter to only user messages (FinAnalyzer analyzes user messages, not assistant responses) — **WAIT: architecture says "re-analyzes ALL messages"**. Keep ALL messages (user + assistant) — the full conversation context is what gives Sonnet its advantage over Haiku
      3. Map to `FinanalyzerMessage[]`: `messages.map(m => ({ id: m.id, role: m.role, content: m.content }))`
      4. Call FinAnalyzer with retry: `yield* finanalyzerRepo.analyze({ messages }).pipe(Effect.retry(Schedule.once))`
      5. **Create assessment_results placeholder row** FIRST (needed as FK target for finalization_evidence):
         - `yield* assessmentResultRepo.create({ assessmentSessionId: input.sessionId, facets: {}, traits: {}, domainCoverage: {}, portrait: "" })` — placeholder values, will be filled in Story 11.3
      6. **Compute highlight positions** for each evidence item:
         - Build message content map: `Map<messageId, content>` from fetched messages
         - For each evidence item: validate `messageId` exists in map (warn + skip if not), then `computeHighlightPositions(messageContent, evidence.quote)`
      7. **Map to FinalizationEvidenceInput[]:** Combine FinAnalyzer output + computed highlights + assessmentResultId
      8. **Batch save:** `yield* finalizationEvidenceRepo.saveBatch(evidenceInputs)`
      9. **Track cost:** Add FinAnalyzer token usage to session cost tracking (existing pattern from sendMessage — use `costGuardRepo.trackCost()` if available)
    - **Keep Phase 2 as placeholder** (Story 11.3 will implement score computation):
      - Log: "Phase 2: Score computation — not yet implemented (Story 11.3)"
      - Still transition through `generating_portrait` → `completed` as before (enables end-to-end flow testing)
    - **Error handling:** If FinAnalyzer fails after retry, the `FinanalyzerError` propagates up. The `Effect.ensuring` block still releases the lock. Session stays `finalizing` (retryable)
  - [ ] 8.2: Update the generate-results use-case function signature to include new repository dependencies in its `Effect.gen` requirements (they'll be provided via Layer)
  - [ ] 8.3: Wire new repository Layers into the assessment handler's Layer stack in `apps/api/src/index.ts`:
    - Add `FinanalyzerAnthropicRepositoryLive`, `FinalizationEvidenceDrizzleRepositoryLive`, `AssessmentResultDrizzleRepositoryLive` to the Layer composition for the assessment handler group

- [ ] Task 9: Create mock implementations for testing (AC: all)
  - [ ] 9.1: Create `packages/infrastructure/src/repositories/__mocks__/finanalyzer.anthropic.repository.ts`:
    - Follow exact pattern from `__mocks__/conversanalyzer.anthropic.repository.ts`
    - Export `FinanalyzerAnthropicRepositoryLive` as `Layer.succeed(FinanalyzerRepository, implementation)`
    - Default mock: returns deterministic evidence for a standard 25-message conversation — ~30-50 evidence items covering all 5 traits with varied domains
    - Test helpers: `_resetMockState()`, `_setMockOutput(output)`, `_setMockError(error)`, `_getMockCalls()`
    - Token usage: `{ input: 5000, output: 2000 }` (realistic for 25 messages)
  - [ ] 9.2: Create `packages/infrastructure/src/repositories/__mocks__/finalization-evidence.drizzle.repository.ts`:
    - In-memory array storage
    - `saveBatch`: push to array, assign generated IDs
    - `getByResultId`: filter by resultId
    - `existsForSession`: check if any records linked to session (simplified: check array length > 0)
    - Test helper: `_resetMockState()`, `_getStoredEvidence()`
  - [ ] 9.3: Create `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts`:
    - In-memory Map storage keyed by sessionId
    - `create`: store and return with generated ID
    - `getBySessionId`: lookup from map
    - Test helpers: `_resetMockState()`, `_getStoredResults()`

- [ ] Task 10: Unit tests for generate-results Phase 1 (AC: all)
  - [ ] 10.1: Update `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts`:
    - Add `vi.mock()` calls for new repositories: finanalyzer, finalization-evidence, assessment-result
    - Update existing TestLayer with new mock Layers
    - **New test: happy path Phase 1** — finalizing session → FinAnalyzer called with all messages → evidence saved with correct highlight positions → assessment_results placeholder created → session transitions to completed
    - **New test: idempotency Guard 2** — finalization evidence already exists → FinAnalyzer NOT called → Phase 2 runs (placeholder)
    - **New test: FinAnalyzer failure with retry** — first call fails, retry succeeds → evidence saved correctly
    - **New test: FinAnalyzer failure after retry** — both calls fail → `FinanalyzerError` propagates → session stays finalizing → lock released
    - **New test: invalid messageId from LLM** — FinAnalyzer returns evidence with non-existent messageId → that evidence item skipped with warning log → other evidence items saved normally
    - **New test: highlight computation** — quote found in message → correct positions; quote not found → null positions; multiple matches → null positions
    - **New test: empty conversation** — edge case: no messages → FinAnalyzer called with empty array → returns empty evidence → assessment_results placeholder created (scores will be empty/default)
    - **Preserve existing tests:** All existing tests for Guard 1 (completed session), concurrent duplicate (lock fail), session validation must continue passing
  - [ ] 10.2: Verify import ordering: `vi` from `vitest` FIRST, then `vi.mock()` calls, then `@effect/vitest` imports

## Dev Notes

### What's Already Implemented (Verify, Don't Rebuild)

| Component | Status | Location |
|-----------|--------|----------|
| `generate-results.use-case.ts` with placeholder phases | Done | `apps/api/src/use-cases/generate-results.use-case.ts` |
| `finalization_evidence` DB table + schema | Done | `packages/infrastructure/src/db/drizzle/schema.ts:220-245` |
| `assessment_results` DB table + schema | Done | `packages/infrastructure/src/db/drizzle/schema.ts:254-264` |
| `FINALIZATION_PROGRESS` constants | Done | `packages/domain/src/constants/finalization.ts` |
| `assessmentSession.finalizationProgress` column | Done | `packages/infrastructure/src/db/drizzle/schema.ts:149` |
| `acquireSessionLock` / `releaseSessionLock` | Done | `packages/domain/src/repositories/assessment-session.repository.ts` |
| `ConversanalyzerRepository` (pattern reference) | Done | `packages/domain/src/repositories/conversanalyzer.repository.ts` |
| `conversanalyzer.anthropic.repository.ts` (pattern reference) | Done | `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` |
| `ConversanalyzerAnthropicRepositoryLive` mock | Done | `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` |
| `EvidenceInput` type (formula input) | Done | `packages/domain/src/types/evidence.ts` |
| `DomainMessage` type | Done | `packages/domain/src/types/message.ts` |
| `bigfiveFacetNameEnum` + `evidenceDomainEnum` pgEnums | Done | `packages/infrastructure/src/db/drizzle/schema.ts` |
| `ALL_FACETS`, `LIFE_DOMAINS` domain constants | Done | `packages/domain/src/constants/` |
| `SCORE_MIN/MAX`, `CONFIDENCE_MIN/MAX` validation constants | Done | `packages/domain/src/constants/validation.ts` |
| Assessment handler with generateResults endpoint | Done | `apps/api/src/handlers/assessment.ts:245-254` |
| Cost tracking via `CostGuardRepository` | Done | `packages/domain/src/repositories/cost-guard.repository.ts` |
| `getMessagesBySession` on message repository | Done | `packages/domain/src/repositories/assessment-message.repository.ts` |

### Critical Architecture Constraints

- **FinAnalyzer input:** ALL messages (user + assistant) with their UUIDs. Format: `[{messageId}] {role}: {content}`. Single LLM call, ~5K tokens for 25-30 messages
- **FinAnalyzer output:** No highlight positions from LLM. `messageId` is the UUID prefix from the formatted input. Validated on insert (reject invalid IDs, log warning, don't crash)
- **Highlight computation is server-side:** `message.content.indexOf(quote)` → exact match. Null if not found or ambiguous (multiple matches). Computed at insert time, stored in DB
- **Two-phase execution:** Phase 1 (this story) = FinAnalyzer → finalization_evidence. Phase 2 (Story 11.3) = score computation + portrait. Progress updates (`analyzing` → `generating_portrait`) happen OUTSIDE transactions for immediate visibility
- **Three-tier idempotency:** Guard 1 = session completed (existing). Guard 2 = finalization_evidence exists (this story). Guard 3 = full pipeline run
- **Error handling:** `FinanalyzerError` is an infrastructure error (co-located with repo interface in domain). Retry once in use-case (`Effect.retry(Schedule.once)`). NOT in http.errors.ts. Propagates unchanged to HTTP layer
- **Assessment result placeholder:** Phase 1 creates an assessment_results row with empty facets/traits/portrait. This is needed as the FK target for finalization_evidence records. Story 11.3 will UPDATE this row with computed scores
- **Tool use pattern:** Use Anthropic SDK tool/function calling for structured extraction (same as conversanalyzer). Define tool schema in the infrastructure file using Effect Schema → JSONSchema
- **No cap on finalization evidence:** Unlike conversation_evidence (max 3/message), finalization_evidence has no per-message cap. Quality is non-negotiable — extract ALL signals
- **Cost tracking:** Track FinAnalyzer token usage the same way sendMessage tracks ConversAnalyzer + Nerin costs. Use existing `CostGuardRepository.trackCost()` pattern

### FinAnalyzer Prompt Guidelines

The FinAnalyzer prompt should:
1. Receive ALL messages with `[uuid]` prefix format
2. Instruct Sonnet to re-analyze the ENTIRE conversation with full context
3. Extract personality signals with: facet, score (0-20), confidence (0-1), domain (hard enum), rawDomain (free-text), quote (verbatim from message)
4. Emphasize: extract longer, unique substrings for quotes (aids highlight computation)
5. Include Big Five facet definitions from `ALL_FACETS` + `BIG_FIVE_TRAITS`
6. Include domain definitions: work, relationships, family, leisure, solo, other (with boundary examples from architecture doc)
7. Emphasize "user emphasis" rule: domain is based on what the user emphasizes, not objective situation categorization
8. Allow multi-domain evidence: same quote can appear in multiple records with different domains
9. No cap on evidence count — extract everything meaningful

### Frontend Impact

None for this story. The frontend already:
- Calls `POST /generate-results` (triggers finalization)
- Polls `GET /finalization-status` (sees progress: analyzing → generating_portrait → completed)
- The only change is that Phase 1 now takes 8-10 seconds (Sonnet call) instead of being instant

### Project Structure Notes

**New files:**
- `packages/domain/src/repositories/finanalyzer.repository.ts`
- `packages/domain/src/repositories/finalization-evidence.repository.ts`
- `packages/domain/src/repositories/assessment-result.repository.ts`
- `packages/domain/src/utils/highlight.ts`
- `packages/domain/src/utils/__tests__/highlight.test.ts`
- `packages/infrastructure/src/repositories/finanalyzer.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/finalization-evidence.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/finanalyzer.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/finalization-evidence.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts`

**Modified files:**
- `apps/api/src/use-cases/generate-results.use-case.ts` — Replace Phase 1 placeholder with FinAnalyzer integration
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts` — Add Phase 1 tests
- `apps/api/src/index.ts` — Wire new Layers into assessment handler group
- `packages/domain/src/index.ts` — Export new repositories, types, utils
- `packages/domain/src/config/app-config.ts` — Add `finanalyzerModel` field
- `packages/infrastructure/src/config/app-config.live.ts` — Add env var mapping
- `packages/domain/src/config/__mocks__/app-config.ts` — Add test default
- `packages/infrastructure/src/index.ts` — Export new Live layers

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2: FinAnalyzer Sonnet Integration]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Two-Tier Analysis Architecture]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Finalization Atomicity & Idempotency]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Effect Pipeline (LangGraph Replacement)]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Implementation Patterns & Consistency Rules]
- [Source: docs/ARCHITECTURE.md#Hexagonal Architecture]
- [Source: packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts] (pattern reference)
- [Source: apps/api/src/use-cases/generate-results.use-case.ts] (Phase 1 placeholder to replace)
- [Source: _bmad-output/implementation-artifacts/11-1-finalization-trigger-and-auth-gate.md] (previous story)

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. `FinanalyzerError` must propagate unchanged. The retry is `Effect.retry(Schedule.once)` on the analyze call only, NOT a catch-and-remap.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths. LLM tool schemas stay in infrastructure — NOT in domain.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Highlight computation location** — Do NOT have the LLM output highlight positions. Always compute server-side via `indexOf`. Do NOT put highlight computation in infrastructure — it's a pure domain function in `packages/domain/src/utils/highlight.ts`.
6. **Evidence table mixing** — Do NOT query `conversation_evidence` in the finalization pipeline. FinAnalyzer produces `finalization_evidence` independently. The two tables have different schemas, different purposes, and different lifecycles.
7. **Assessment result mutation** — Phase 1 creates a placeholder `assessment_results` row. Do NOT attempt to compute real scores in this story. Facets/traits/portrait fields are empty placeholders. Story 11.3 handles score computation.
8. **Retry in repository** — Do NOT add retry logic inside the FinAnalyzer repository implementation. Retry belongs in the use-case layer (`Effect.retry(Schedule.once)` wrapping the `analyze` call).

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
