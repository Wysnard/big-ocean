# Story 10.2: Conversanalyzer — Haiku Analysis on Every Message

Status: done

## Story

As a system,
I want to analyze every user message with Haiku to extract facet evidence with domain tags,
So that steering has fresh data after every message.

## Acceptance Criteria

1. **Given** a user sends a message (after cold start, msg 4+) **When** the send-message pipeline runs **Then** Haiku analyzes the message synchronously (< 1 second) **And** extracts 0-3 evidence records with: bigfive_facet, score (0-20), confidence (0-1), domain **And** evidence is saved to `conversation_evidence` **And** token usage (input/output) is returned alongside evidence for cost tracking

2. **Given** a message that spans multiple life domains **When** Haiku analyzes it **Then** separate evidence records are generated with different domain tags

3. **Given** a message with no personality signal (e.g., "hello", "thanks") **When** Haiku analyzes it **Then** it returns an empty evidence array **And** the pipeline continues normally (no save, no error)

4. **Given** the `ConversanalyzerRepository` interface (Context.Tag) **When** defined in `packages/domain/src/repositories/` **Then** it has method: `analyze(params)` → `Effect<ConversanalyzerOutput, ConversanalyzerError>` **And** `ConversanalyzerOutput` = `{ evidence: EvidenceInput[]; tokenUsage: { input: number; output: number } }` **And** params include: `message`, `recentMessages`, `domainDistribution`

5. **Given** the `ConversanalyzerAnthropicRepositoryLive` implementation **When** created in `packages/infrastructure/src/repositories/` **Then** it calls Claude Haiku via Anthropic SDK tool use (function calling) **And** defines the tool JSON schema by converting an Effect Schema to JSON Schema **And** validates LLM output against the same Effect Schema before returning **And** returns structured evidence matching the `EvidenceInput` type

6. **Given** a Haiku analysis failure **When** the error occurs **Then** retry once, then skip (non-fatal) **And** Nerin responds normally with stale/no steering **And** `ConversanalyzerError` is logged but does not propagate to the user

7. **Given** the send-message use-case **When** a message is processed (msg 4+) **Then** the pipeline becomes: save msg → get messages → query evidence → conversanalyzer → save evidence → call Nerin → save response **And** cold start msgs skip the conversanalyzer step entirely (threshold: user message count ≤ `GREETING_MESSAGES.length + OPENING_QUESTIONS.length` greeting count, currently 2)

8. **Given** the mock implementation **When** `__mocks__/conversanalyzer.anthropic.repository.ts` is created **Then** it returns deterministic evidence (balanced across domains/facets) **And** follows existing `__mocks__/` pattern

9. **Given** unit tests **When** tests run **Then** conversanalyzer integration in send-message pipeline is verified **And** cold start skip logic is verified **And** error handling (non-fatal skip) is verified **And** evidence cap (3 records/message) is verified at the use-case level **And** zero-evidence response is handled correctly

## Tasks / Subtasks

- [x] Task 1: Create ConversanalyzerRepository interface (AC: #4)
  - [x] 1.1: Create `packages/domain/src/repositories/conversanalyzer.repository.ts` with Context.Tag
  - [x] 1.2: Define `analyze` method: `(params: ConversanalyzerInput) => Effect<ConversanalyzerOutput, ConversanalyzerError>`
  - [x] 1.3: Define `ConversanalyzerInput` type: `{ message: string; recentMessages: readonly DomainMessage[]; domainDistribution: DomainDistribution }`
  - [x] 1.4: Define `ConversanalyzerOutput` type: `{ evidence: EvidenceInput[]; tokenUsage: { input: number; output: number } }`
  - [x] 1.5: Define `ConversanalyzerError` tagged error co-located in the file
  - [x] 1.6: Export from `packages/domain/src/index.ts` barrel

- [x] Task 2: Create domain utility — `aggregateDomainDistribution` (AC: #4, architecture spec)
  - [x] 2.1: Create `packages/domain/src/utils/domain-distribution.ts`
  - [x] 2.2: Define `DomainDistribution` as a mapped type ensuring all 6 domains are always present: `type DomainDistribution = { readonly [K in LifeDomain]: number }`
  - [x] 2.3: Implement `aggregateDomainDistribution(evidence: EvidenceInput[]): DomainDistribution` — initializes all 6 domains to 0, counts each
  - [x] 2.4: Unit test: empty input returns all zeros, single domain, multi-domain, all domains present in every case
  - [x] 2.5: Export `DomainDistribution` type and `aggregateDomainDistribution` from domain barrel

- [x] Task 3: Create Effect Schema for evidence extraction (AC: #5)
  - [x] 3.1: Define an Effect Schema for the conversanalyzer tool output (array of `{ bigfiveFacet, score, confidence, domain }`)
  - [x] 3.2: Use `S.Literal(...ALL_FACETS)` for bigfiveFacet, `S.Literal(...LIFE_DOMAINS)` for domain
  - [x] 3.3: Use `S.Int.pipe(S.between(SCORE_MIN, SCORE_MAX))` for score, `S.Number.pipe(S.between(CONFIDENCE_MIN, CONFIDENCE_MAX))` for confidence
  - [x] 3.4: Convert to JSON Schema via `JSONSchema.make()` for the Anthropic tool `input_schema`
  - [x] 3.5: Validate LLM response against the same Effect Schema via `S.decodeUnknownSync` before returning
  - [x] 3.6: This schema lives in the infrastructure repository file (infrastructure-internal, not in domain)

- [x] Task 4: Create Anthropic implementation (AC: #5)
  - [x] 4.1: Create `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`
  - [x] 4.2: Implement using Anthropic SDK `messages.create` with `tools` parameter and Claude Haiku model
  - [x] 4.3: Tool schema generated from Effect Schema (Task 3) via `JSONSchema.make()`
  - [x] 4.4: Input context: `recentMessages` (includes the just-sent user message + preceding messages, last 6 total) + domain distribution summary
  - [x] 4.5: Prompt includes domain distribution to prevent domain drift (P1 pre-mortem)
  - [x] 4.6: Get model ID from `AppConfig.conversanalyzerModelId`
  - [x] 4.7: Extract token usage from Anthropic response (`response.usage.input_tokens`, `response.usage.output_tokens`)
  - [x] 4.8: Validate LLM tool_use output against Effect Schema — if validation fails, throw `ConversanalyzerError`
  - [x] 4.9: Export `ConversanalyzerAnthropicRepositoryLive` as Layer
  - [x] 4.10: Export from `packages/infrastructure/src/index.ts` barrel

- [x] Task 5: Create MOCK_LLM implementation (AC: #5 integration tests)
  - [x] 5.1: Inside the Anthropic repository, check `AppConfig.nodeEnv === 'test'` or `MOCK_LLM=true` env var
  - [x] 5.2: When mocked, return deterministic evidence (2 balanced records + zero token usage) without LLM call
  - [x] 5.3: This is for Docker integration tests (`docker-compose.test.yml`), separate from `__mocks__/` pattern

- [x] Task 6: Create `__mocks__/` mock implementation (AC: #8, unit tests)
  - [x] 6.1: Create `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts`
  - [x] 6.2: Return balanced evidence across domains/facets (deterministic, 2 records per call, zero token usage)
  - [x] 6.3: Export same `ConversanalyzerAnthropicRepositoryLive` name + `_resetMockState` test helper
  - [x] 6.4: This is for unit tests via `vi.mock()` + original path — never import from `__mocks__/` directly

- [x] Task 7: Integrate conversanalyzer into send-message use-case (AC: #1, #3, #6, #7)
  - [x] 7.1: Add `ConversanalyzerRepository` and `ConversationEvidenceRepository` as dependencies
  - [x] 7.2: After saving user message (which returns `AssessmentMessageEntity` with `id`), capture the `messageId` from the returned entity
  - [x] 7.3: After getting messages: query `conversationEvidence.findBySession(sessionId)` for existing evidence
  - [x] 7.4: Compute `domainDistribution` via `aggregateDomainDistribution(existingEvidence)`
  - [x] 7.5: Cold start guard: count user messages in `previousMessages` (fetched after saving current msg). If user msg count ≤ greeting message count (currently 2 — from `GREETING_MESSAGES.length + OPENING_QUESTIONS picks`, i.e., 2 assistant greeting messages per session), skip conversanalyzer
  - [x] 7.6: Build `recentMessages`: take the last 6 messages from `previousMessages` (includes the just-saved user message), convert to `DomainMessage[]`
  - [x] 7.7: Call `conversanalyzer.analyze({ message: input.message, recentMessages, domainDistribution })`
  - [x] 7.8: Cap evidence to 3 records: `.slice(0, 3)` before saving (business rule lives in use-case)
  - [x] 7.9: If evidence is empty (zero records), skip save — no error, continue to Nerin
  - [x] 7.10: Save evidence via `conversationEvidence.save(records.map(r => ({ ...r, sessionId, messageId })))`
  - [x] 7.11: Wrap conversanalyzer call in `Effect.retry(Schedule.once)` then `Effect.catchAll` — log error via `LoggerRepository`, continue with Nerin (non-fatal). Import `Schedule` from `effect`.
  - [x] 7.12: Pass `undefined` for targetDomain/targetFacet to Nerin (steering is Story 10.4)

- [x] Task 8: Unit tests (AC: #9)
  - [x] 8.1: Read existing `send-message.use-case.test.ts` — check which tests exist and what mocking pattern is used. Modify or extend as needed; remove tests that no longer apply to the new pipeline.
  - [x] 8.2: Test happy path: msg 4+ triggers conversanalyzer, evidence saved, Nerin responds
  - [x] 8.3: Test cold start: msgs 1-3 (≤ greeting count) skip conversanalyzer, no evidence saved
  - [x] 8.4: Test non-fatal error: conversanalyzer fails after retry, Nerin still responds, error logged
  - [x] 8.5: Test evidence cap: conversanalyzer returns 5 records, only 3 saved
  - [x] 8.6: Test zero evidence: conversanalyzer returns empty array, no save called, Nerin responds normally
  - [x] 8.7: Test domain distribution: verify correct `DomainDistribution` object passed to conversanalyzer input (all 6 domains present)

## Dev Notes

### Critical: ConversanalyzerError is Non-Fatal

Architecture explicitly states: `ConversanalyzerError` → **non-fatal**. Retry once, skip. Conversation evidence is a steering optimization — finanalyzer re-analyzes ALL messages at finalization regardless. Missing one conversation evidence record has zero impact on the final portrait.

```typescript
import { Effect, Schedule } from "effect";

// Wrap conversanalyzer call:
const evidenceResult = yield* conversanalyzer
  .analyze({ message: input.message, recentMessages, domainDistribution })
  .pipe(
    Effect.retry(Schedule.once),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        logger.error("Conversanalyzer failed, skipping", { error: error.message, sessionId });
        return { evidence: [] as EvidenceInput[], tokenUsage: { input: 0, output: 0 } };
      })
    ),
  );
```

### Pipeline Change in send-message.use-case.ts

Current pipeline (Story 9.2):
```
validate session → save user msg → get messages → call Nerin → save assistant msg → increment count → return
```

New pipeline (this story):
```
validate session → save user msg (capture messageId) → get messages → query evidence → compute domain distribution
  → [cold start check: user msg count ≤ 2]
  → if post-cold-start: conversanalyzer(msg, recent6, domainDist) → cap 3 → save evidence (if non-empty)
  → call Nerin (no steering yet) → save assistant msg → increment count → return
```

Nerin still receives no steering targets in this story (Story 10.4 adds steering integration).

### Cold Start Threshold

The cold start check uses the greeting message count (currently 2 assistant greeting messages per session: 1 fixed greeting + 1 random opening question). Count user messages in `previousMessages` after saving the current one. If user message count ≤ 2, this user has only replied to the greeting sequence — skip conversanalyzer.

Reference: `packages/domain/src/constants/nerin-greeting.ts` — `GREETING_MESSAGES` (1 entry) + `OPENING_QUESTIONS` (pool, 1 picked) = 2 greeting messages.

The threshold should reference the greeting count, not be hardcoded. Use `GREETING_MESSAGES.length + 1` (1 fixed + 1 opening question = 2) or a named constant.

### messageId Availability

`saveMessage` returns `AssessmentMessageEntity` which includes `id: UUID`. Capture this when saving the user message:
```typescript
const savedUserMessage = yield* messageRepo.saveMessage(input.sessionId, "user", input.message, input.userId);
const messageId = savedUserMessage.id;
```

### recentMessages: Includes the Just-Saved User Message

`recentMessages` passed to the conversanalyzer must include the current user message. Since `getMessages(sessionId)` is called AFTER `saveMessage`, the current message is already in the DB and will be in the returned array. Take the last 6 messages from this array (architecture: "current message + last 5").

Convert to `DomainMessage[]`:
```typescript
const recentMessages: DomainMessage[] = previousMessages.slice(-6).map(msg => ({
  id: msg.id, role: msg.role, content: msg.content,
}));
```

### DomainDistribution Type — Mapped, Not Record

Use a mapped type to guarantee all 6 domains are always present (never sparse):
```typescript
import type { LifeDomain } from "../constants/life-domain";
export type DomainDistribution = { readonly [K in LifeDomain]: number };
```
This is stricter than `Record<LifeDomain, number>` — TypeScript will error if any domain key is missing during construction.

### Two Separate Mock Strategies

1. **`__mocks__/conversanalyzer.anthropic.repository.ts`** — For unit tests via `vi.mock()`. In-memory, follows `Layer.succeed` pattern. Used in `send-message.use-case.test.ts`.
2. **`MOCK_LLM` check inside production repo** — For Docker integration tests. The actual `ConversanalyzerAnthropicRepositoryLive` checks env and returns deterministic data. No `vi.mock()` involved.

Both are needed. They serve different testing tiers.

### Effect Schema → JSON Schema → Validation Pattern

Do NOT hand-write the JSON schema for the Anthropic tool definition. Instead:
1. Define an Effect Schema for the evidence extraction output
2. Convert to JSON Schema via `import { JSONSchema } from "effect"` → `JSONSchema.make(EvidenceExtractionSchema)`
3. Pass the generated JSON schema as the tool's `input_schema`
4. When the LLM responds, validate the tool_use result against the same Effect Schema via `Schema.decodeUnknownSync(EvidenceExtractionSchema)(toolUseInput)`
5. If validation fails, throw `ConversanalyzerError` (the retry+skip pattern handles it gracefully)

This ensures the tool schema and validation are always in sync — single source of truth.

### Token Usage for Cost Tracking

`ConversanalyzerOutput` includes `tokenUsage: { input: number; output: number }`. Extract from Anthropic SDK response: `response.usage.input_tokens` and `response.usage.output_tokens`. This prepares for Story 10.6 (Cost Tracking) — the send-message use-case can log or aggregate token costs.

### Domain Distribution in Prompt

P1 pre-mortem item: Include domain distribution summary in Haiku prompt context to prevent domain drift ("everything is work"). Format in the prompt as: "Current evidence distribution: work=5, relationships=2, family=0, leisure=1, solo=0, other=0".

### Prompt Design Guidance

The conversanalyzer prompt should:
1. Explain the Big Five model briefly with facet definitions
2. Instruct extraction of personality-relevant signals only
3. Return empty array `[]` if no personality signal is detected (e.g., greetings, acknowledgments)
4. Include domain distribution summary to prevent drift
5. Define the 6 domain values with descriptions and boundary cases (from architecture ADR)
6. Instruct to prefer specific domains over `other` (target <15% other)
7. Allow multi-domain evidence (same observation, different domain contexts)
8. Cap output to 3 evidence records

### Existing AppConfig Has Required Fields

`AppConfig.conversanalyzerModelId` already exists (added in Story 9.1). No AppConfig changes needed for this story.

### Files to Create

| File | Purpose |
|------|---------|
| `packages/domain/src/repositories/conversanalyzer.repository.ts` | Context.Tag interface + ConversanalyzerInput/Output types + error |
| `packages/domain/src/utils/domain-distribution.ts` | `DomainDistribution` type + `aggregateDomainDistribution()` pure function |
| `packages/domain/src/utils/__tests__/domain-distribution.test.ts` | Unit tests for domain distribution |
| `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` | Anthropic Haiku implementation (Live Layer) + MOCK_LLM fallback |
| `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` | In-memory mock for unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `packages/domain/src/index.ts` | Add exports: ConversanalyzerRepository, ConversanalyzerError, ConversanalyzerInput, ConversanalyzerOutput, DomainDistribution, aggregateDomainDistribution |
| `packages/infrastructure/src/index.ts` | Add export: ConversanalyzerAnthropicRepositoryLive |
| `apps/api/src/use-cases/send-message.use-case.ts` | Add conversanalyzer + evidence pipeline (post-cold-start), capture messageId from saveMessage return |
| `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` | Read existing tests, extend/modify for conversanalyzer integration, cold start, error handling, cap, zero evidence |

### Files NOT to Modify

- `packages/domain/src/types/evidence.ts` — `EvidenceInput` already exists (Story 10.1)
- `packages/domain/src/repositories/conversation-evidence.repository.ts` — already complete (Story 10.1)
- `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts` — already complete (Story 10.1)
- `packages/domain/src/config/app-config.ts` — `conversanalyzerModelId` already present (Story 9.1)
- Database schema — no schema changes needed

### Previous Story Intelligence (Story 10-1)

- `ConversationEvidenceRepository` is fully implemented: `save()`, `findBySession()`, `countByMessage()`
- `EvidenceInput` type exists at `packages/domain/src/types/evidence.ts`
- In-memory mock at `__mocks__/conversation-evidence.drizzle.repository.ts` with `_resetMockState` + `_getMockRecords` helpers
- Infrastructure package now has `vitest` + `@effect/vitest` devDeps and runs in turbo pipeline
- 509 total tests (200 front + 194 API + 115 infrastructure) — all passing
- Code review caught: broken test imports (self-referencing `@workspace/infrastructure` in infra tests) — fixed to relative imports. Apply same pattern for new infra tests.

### Git Intelligence

Recent commits show consistent patterns:
- Branch naming: `feat/story-10-1-conversation-evidence-schema-and-repository`
- Commit format: `feat(story-10-1): description`
- PR-based workflow with squash merges
- Code review as separate fix commits

### Anthropic SDK Integration Pattern

Reference `nerin-agent.anthropic.repository.ts` for the SDK pattern: how to get the API key from `AppConfig`, create the Anthropic client, and handle responses. The conversanalyzer adds tool use on top of that pattern.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2] — Story acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Context-Tagging-System] — Domain tagging spec
- [Source: _bmad-output/planning-artifacts/architecture.md#Effect-Pipeline] — ConversanalyzerRepository interface contract
- [Source: _bmad-output/planning-artifacts/architecture.md#New-Module-Map] — File locations
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] — Error handling, mock patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Pre-mortem-Findings] — Domain drift prevention (P1)
- [Source: packages/domain/src/repositories/conversation-evidence.repository.ts] — Evidence repo interface (Story 10.1)
- [Source: packages/domain/src/types/evidence.ts] — EvidenceInput type
- [Source: packages/domain/src/repositories/assessment-message.repository.ts] — saveMessage returns AssessmentMessageEntity (has id)
- [Source: packages/domain/src/constants/nerin-greeting.ts] — GREETING_MESSAGES + OPENING_QUESTIONS (2 greeting msgs per session)
- [Source: apps/api/src/use-cases/send-message.use-case.ts] — Current pipeline to modify
- [Source: packages/domain/src/config/app-config.ts] — AppConfig with conversanalyzerModelId
- [Source: packages/domain/src/repositories/nerin-agent.repository.ts] — Nerin interface (targetDomain/targetFacet already optional)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Created `ConversanalyzerRepository` interface with Context.Tag, `ConversanalyzerInput`, `ConversanalyzerOutput`, `ConversanalyzerError` types. Exported from domain barrel.
- Task 2: Created `aggregateDomainDistribution` pure function with mapped `DomainDistribution` type. 4 unit tests pass (empty, single domain, multi-domain, all keys present).
- Task 3: Effect Schema (`EvidenceItemSchema`, `EvidenceExtractionSchema`) with `S.Literal(...ALL_FACETS)`, `S.Literal(...LIFE_DOMAINS)`, `S.Int.pipe(S.between(...))`. Converted to JSON Schema via `JSONSchema.make()`. Schema lives in infrastructure repo file.
- Task 4: Anthropic implementation using `@anthropic-ai/sdk` with tool use. `tool_choice: { type: "tool", name: "extract_evidence" }` forces structured output. Validates response via `S.decodeUnknownSync`. Detailed prompt includes Big Five facet definitions, domain descriptions with boundary cases, domain distribution, and extraction instructions.
- Task 5: MOCK_LLM fallback inside Anthropic repo — checks `AppConfig.nodeEnv === 'test'` or `MOCK_LLM=true`, returns 2 deterministic records.
- Task 6: `__mocks__/conversanalyzer.anthropic.repository.ts` with `_resetMockState`, `_getMockCalls`, `_setMockOutput`, `_setMockError` helpers.
- Task 7: Integrated conversanalyzer into send-message pipeline. Cold start guard uses `GREETING_MESSAGES.length + 1`. Entire conversanalyzer pipeline wrapped in `Effect.catchAll` for non-fatal behavior. Evidence capped to 3 records. Added `ConversanalyzerAnthropicRepositoryLive` and `ConversationEvidenceDrizzleRepositoryLive` to server layer composition.
- Task 8: 20 unit tests covering: base pipeline (5), ownership guard (2), session status (1), isFinalTurn (2), conversanalyzer integration (7: happy path, cold start, boundary, non-fatal error, evidence cap, zero evidence, domain distribution), error handling (2). Fixed `session-linking.use-case.test.ts` to provide new dependencies.
- All 625 domain tests + 193 API tests + infrastructure tests pass. No regressions. Lint clean.

### Change Log

- 2026-02-23: Story 10.2 implementation complete — conversanalyzer Haiku analysis on every message
- 2026-02-23: Code review fixes — deep import cleanup (ConversanalyzerError → barrel), mock `_setMockError` changed to `Effect.fail` (typed failure), `_resetMockState` extended to clear `overrideOutput`/`overrideError`, `pnpm-lock.yaml` documented in File List
- 2026-02-23: Code review round 2 — (H1) scoped catchAll to conversanalyzer.analyze only (DB errors no longer silently swallowed), (H2) fixed stale MockConfigLive in session-linking tests to match real AppConfig shape, (M1) simplified `_setMockError` API to accept string instead of Error, (M2) verified retry behavior in error test

### File List

**New files:**
- `packages/domain/src/repositories/conversanalyzer.repository.ts`
- `packages/domain/src/utils/domain-distribution.ts`
- `packages/domain/src/utils/__tests__/domain-distribution.test.ts`
- `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts`

**Modified files:**
- `packages/domain/src/index.ts` — added ConversanalyzerRepository, DomainDistribution exports
- `packages/infrastructure/src/index.ts` — added ConversanalyzerAnthropicRepositoryLive export
- `packages/infrastructure/package.json` — added `@anthropic-ai/sdk` dependency
- `pnpm-lock.yaml` — updated lockfile for `@anthropic-ai/sdk` addition
- `apps/api/src/use-cases/send-message.use-case.ts` — integrated conversanalyzer pipeline
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` — rewrote with conversanalyzer tests
- `apps/api/src/use-cases/__tests__/session-linking.use-case.test.ts` — added new dependency mocks
- `apps/api/src/index.ts` — added ConversanalyzerAnthropicRepositoryLive and ConversationEvidenceDrizzleRepositoryLive to layer composition
