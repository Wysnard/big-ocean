# Story 10.4: Steering Integration — Smart Nerin Responses

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want Nerin to naturally explore different areas of my life as we chat,
So that the conversation covers my whole personality, not just one topic.

## Acceptance Criteria

1. **Given** a user sends message 4+ (post cold start, `userMessageCount > COLD_START_GREETING_COUNT`) **When** the send-message pipeline runs **Then** the flow is: Haiku analyze → save evidence → re-fetch all evidence → `computeFacetMetrics` → `computeSteeringTarget` → pass `targetFacet` + `targetDomain` to Nerin → Nerin responds with steering-aware content

2. **Given** a cold start message (messages 1-3, no evidence) **When** `computeSteeringTarget` is called with an empty metrics map **Then** it returns a greeting seed from `GREETING_SEED_POOL` using `GREETING_MESSAGES.length` as seed index (currently 2) **And** the seed's `targetFacet` + `targetDomain` are passed to Nerin

3. **Given** the send-message use-case calls Nerin **When** passing `targetDomain` and `targetFacet` **Then** the Nerin agent's system prompt includes a `STEERING PRIORITY:` section (already implemented in `buildChatSystemPrompt`) **And** the assistant message is saved with `targetDomain` and `targetBigfiveFacet` columns populated

4. **Given** `previousDomain` is needed for switch cost calculation **When** determining the value **Then** extract the last assistant message's `targetDomain` from `previousMessages` (raw DB entities, before mapping to `DomainMessage[]`) **And** if no previous assistant message has a `targetDomain`, pass `null`

5. **Given** the conversanalyzer fails (non-fatal, already handled) **When** steering runs on stale evidence **Then** `computeFacetMetrics` uses whatever evidence exists in DB **And** Nerin still receives a steering target (from stale data) rather than no steering

6. **Given** the `AssessmentMessageEntity` **When** reading messages from DB **Then** the entity schema includes optional `targetDomain` and `targetBigfiveFacet` fields **And** `AssessmentAssistantMessageEntity` exposes these for `previousDomain` extraction

## Tasks / Subtasks

- [x] Task 1: Update `AssessmentMessageEntity` to include steering fields (AC: #6)
  - [x] 1.1: Add `targetDomain: Schema.NullOr(LifeDomainSchema)` to `AssessmentAssistantMessageEntitySchema`
  - [x] 1.2: Add `targetBigfiveFacet: Schema.NullOr(FacetNameSchema)` to `AssessmentAssistantMessageEntitySchema`
  - [x] 1.3: Update the Drizzle repository implementation (`assessment-message.drizzle.repository.ts`) to read/write these columns (they already exist in DB schema). Verify the SELECT query includes `targetDomain` and `targetBigfiveFacet` and the entity mapping populates them — write a unit test confirming non-null values round-trip through save → getMessages
  - [x] 1.4: Update the mock repository (`__mocks__/assessment-message.drizzle.repository.ts`) to support the new fields

- [x] Task 2: Integrate steering into `send-message.use-case.ts` (AC: #1, #2, #4, #5)
  - [x] 2.1: Import `computeFacetMetrics`, `computeSteeringTarget`, `GREETING_SEED_POOL` from `@workspace/domain`
  - [x] 2.2: After evidence save (post-cold-start block), re-fetch all evidence via `evidenceRepo.findBySession` to include newly saved records
  - [x] 2.3: Call `computeFacetMetrics(allEvidence)` to get `Map<FacetName, FacetMetrics>` — no mapping needed, `ConversationEvidenceRecord` structurally satisfies `EvidenceInput`
  - [x] 2.4: Extract `previousDomain` from `previousMessages` (raw DB entities) — iterate backwards to find the last assistant message with a non-null `targetDomain`. Do this BEFORE mapping to `DomainMessage[]` since `DomainMessage` lacks `targetDomain`
  - [x] 2.5: Call `computeSteeringTarget(metrics, previousDomain)` → get `{ targetFacet, targetDomain }`
  - [x] 2.6: For cold start (when `userMessageCount <= COLD_START_GREETING_COUNT`): call `computeSteeringTarget(new Map(), null, FORMULA_DEFAULTS, GREETING_MESSAGES.length)` to get a greeting seed
  - [x] 2.7: Pass `targetDomain` and `targetFacet` to `nerin.invoke({ sessionId, messages, targetDomain, targetFacet })`
  - [x] 2.8: Pass `targetDomain` and `targetFacet` to `messageRepo.saveMessage(sessionId, "assistant", result.response, undefined, targetDomain, targetFacet)`
  - [x] 2.9: Add structured logging for steering decisions: `{ targetFacet, targetDomain, previousDomain, metricsCount }`

- [x] Task 3: Update unit tests for send-message use-case (AC: #1, #2, #3, #4, #5)
  - [x] 3.1: Update existing `send-message.use-case.test.ts` to verify Nerin receives `targetDomain` and `targetFacet` in post-cold-start messages
  - [x] 3.2: Test cold start path: verify greeting seed is passed to Nerin when no evidence exists
  - [x] 3.3: Test `previousDomain` extraction from message history
  - [x] 3.4: Test that `saveMessage` is called with `targetDomain` and `targetBigfiveFacet` for assistant messages
  - [x] 3.5: Test conversanalyzer failure: verify steering still runs on stale evidence
  - [x] 3.6: Test that `computeFacetMetrics` and `computeSteeringTarget` are called with correct arguments (spy on imports or verify through Nerin input)
  - [x] 3.7: Test transition message (`userMessageCount === COLD_START_GREETING_COUNT + 1`) — first post-cold-start message with only 1-3 evidence items from first conversanalyzer run. Verify steering produces a valid `targetFacet` + `targetDomain` from near-empty metrics

## Dev Notes

### This is a Pipeline Integration Story — Wiring Only

All computation functions already exist (`computeFacetMetrics`, `computeSteeringTarget` from Story 10.3). Nerin's system prompt already handles steering when `targetDomain` + `targetFacet` are provided (`buildChatSystemPrompt` from Story 9.2). The DB columns already exist (`target_domain`, `target_bigfive_facet` on `assessment_messages`). The `saveMessage` interface already accepts `targetDomain` and `targetBigfiveFacet` parameters.

**This story only wires these existing pieces together in `send-message.use-case.ts`.**

### Key Code Locations

| File | Current State | Change Needed |
|------|---------------|---------------|
| `apps/api/src/use-cases/send-message.use-case.ts` | Comment says "no steering yet — Story 10.4" at line 169 | Add steering computation and pass to Nerin |
| `packages/domain/src/entities/message.entity.ts` | No `targetDomain`/`targetFacet` on entity | Add optional fields to `AssessmentAssistantMessageEntitySchema` |
| `packages/domain/src/utils/formula.ts` | Complete — exported from barrel | No changes |
| `packages/domain/src/utils/nerin-system-prompt.ts` | Already handles `targetDomain` + `targetFacet` | No changes |
| `packages/domain/src/repositories/nerin-agent.repository.ts` | Already has `targetDomain?` and `targetFacet?` on `NerinInvokeInput` | No changes |
| `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` | Already calls `buildChatSystemPrompt(input.targetDomain, input.targetFacet)` | No changes |
| `packages/domain/src/repositories/assessment-message.repository.ts` | Already accepts `targetDomain`, `targetBigfiveFacet` params | No changes |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Already has `targetDomain` + `targetBigfiveFacet` columns (lines 176-177) | No changes |

### previousDomain Extraction Pattern

Extract `previousDomain` from `previousMessages` (raw DB entities returned by `messageRepo.getMessages`) BEFORE mapping to `DomainMessage[]`. Iterate backwards to find the last assistant message with a non-null `targetDomain`. `DomainMessage` does not include `targetDomain` and should not be changed — it's a shared type used by Nerin and other consumers.

### Cold Start Steering

Architecture says "Formula-driven steering active from the very first user message." On cold start (messages 1-3), evidence is empty → `computeSteeringTarget(new Map(), null, FORMULA_DEFAULTS, GREETING_MESSAGES.length)` returns from `GREETING_SEED_POOL`. `GREETING_MESSAGES.length` is currently 2, picking the 3rd pool entry (`work, achievement_striving`). This means even cold start messages get steering — Nerin explores a curated facet/domain from the first message.

**Important:** Cold start currently skips the conversanalyzer block entirely (`if (userMessageCount > COLD_START_GREETING_COUNT)`). Steering should happen **outside** this block — it runs on every message, including cold start. Structure the code so:
1. Post-cold-start: run conversanalyzer → save evidence → re-fetch evidence → compute metrics → compute steering
2. Cold start: skip conversanalyzer → compute steering with empty metrics (greeting seed)
3. Both paths: pass steering to Nerin

### Evidence Re-fetch After Save

After the conversanalyzer saves new evidence, the use-case needs the full evidence set (existing + new) for `computeFacetMetrics`. Two options:

**Option A (recommended — simple):** Call `evidenceRepo.findBySession(sessionId)` again after saving. One extra DB query but simple and correct.

**Option B:** Merge in-memory: `[...existingEvidence, ...cappedEvidence]`. Requires mapping `cappedEvidence` (which is `EvidenceInput[]`) to match `ConversationEvidenceRecord[]`. More complex, saves one query.

Choose Option A — the evidence table is small (max ~30 messages × 3 = 90 rows) and indexed on `session_id`.

### Nerin Mock Update

The current Nerin mock (`__mocks__/nerin-agent.langgraph.repository.ts`) returns a fixed response and ignores `targetDomain`/`targetFacet`. For testing, verify the mock's `invoke` is called with the correct steering parameters via `vi.fn()` spy assertions.

### Pipeline Flow After This Story

```
User message arrives
  → Save user message (capture messageId)
  → Get all messages
  → Extract previousDomain from raw DB entities (last assistant msg with non-null targetDomain)
  → [Cold start?]
    → YES: computeSteeringTarget(emptyMap, null, config, GREETING_MESSAGES.length) → get seed
    → NO:
      → Query existing evidence
      → Conversanalyzer (retry once, skip on failure)
      → Save new evidence (cap 3)
      → Re-fetch ALL evidence
      → computeFacetMetrics(allEvidence)
      → computeSteeringTarget(metrics, previousDomain)
  → Nerin.invoke({ sessionId, messages, targetDomain, targetFacet })
  → Save assistant message with targetDomain + targetBigfiveFacet
  → Increment message count
  → Return { response, isFinalTurn }
```

**Note:** `steeringHint` from `computeSteeringTarget` return value is unused — Nerin derives its own steering from `targetDomain` + `targetFacet` via `buildChatSystemPrompt`. The `steeringHint` field exists in the return type but is not passed to Nerin or stored.

### Project Structure Notes

- No new files created — only modifications to existing files
- Alignment with architecture doc's "Effect Pipeline" section (lines 756-789 of architecture-assessment-pipeline.md)
- `DomainMessage` type stays minimal (id, role, content) — steering data extracted from entity, not from `DomainMessage`

### Previous Story Intelligence (Story 10.3)

- `computeFacetMetrics` returns `Map<FacetName, FacetMetrics>` with `domainWeights: ReadonlyMap<LifeDomain, number>` on each entry
- `computeSteeringTarget` accepts `seedIndex?: number` for cold start deterministic rotation
- Both functions accept optional `config: FormulaConfig` param (defaults to `FORMULA_DEFAULTS`)
- All formula functions are already exported from `packages/domain/src/index.ts`
- 1040 tests currently passing (647 domain + 193 api + 200 frontend)

### Git Intelligence

Recent commits:
- `cf157c0 feat(story-10-3): formula functions for facet metrics and steering target (#70)`
- `3fa3832 feat(story-10-2): ConversAnalyzer Haiku analysis on every message (#69)`
- `d9c2005 feat(story-10-1): conversation evidence schema and repository (#68)`
- Branch naming: `feat/story-10-4-steering-integration-smart-nerin-responses`
- Commit format: `feat(story-10-4): description`

### Files to Modify

| File | Change |
|------|--------|
| `packages/domain/src/entities/message.entity.ts` | Add `targetDomain` + `targetBigfiveFacet` to `AssessmentAssistantMessageEntitySchema` |
| `apps/api/src/use-cases/send-message.use-case.ts` | Wire steering: import formula functions, compute metrics + steering, pass to Nerin, save with targets |
| `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` | Add/update tests for steering integration |
| `packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts` | Ensure `targetDomain`/`targetBigfiveFacet` are read from DB into entity (may already work if SELECT * is used) |
| `packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts` | Include `targetDomain`/`targetBigfiveFacet` in mock entity responses for assistant messages |

### Files NOT to Modify

- `packages/domain/src/utils/formula.ts` — already complete (Story 10.3)
- `packages/domain/src/utils/nerin-system-prompt.ts` — already handles steering
- `packages/domain/src/repositories/nerin-agent.repository.ts` — already has optional steering fields
- `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` — already uses `buildChatSystemPrompt` with steering
- `packages/infrastructure/src/db/drizzle/schema.ts` — columns already exist
- `packages/domain/src/repositories/assessment-message.repository.ts` — interface already accepts steering params
- `packages/domain/src/repositories/conversation-evidence.repository.ts` — no changes needed
- `packages/domain/src/repositories/conversanalyzer.repository.ts` — no changes needed

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4] — Story acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Message-Processing-Flow] — Pipeline flow (lines 388-398)
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Cold-Start-Resolution] — Cold start (lines 400-408)
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Steering-on-Messages] — Steering columns (lines 500-502)
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Effect-Pipeline] — Full pipeline spec (lines 756-789)
- [Source: apps/api/src/use-cases/send-message.use-case.ts] — Current pipeline with "no steering yet" comment
- [Source: packages/domain/src/utils/formula.ts] — Formula functions (Story 10.3)
- [Source: packages/domain/src/utils/nerin-system-prompt.ts] — buildChatSystemPrompt with steering
- [Source: packages/domain/src/repositories/nerin-agent.repository.ts] — NerinInvokeInput with targetDomain/targetFacet
- [Source: packages/infrastructure/src/db/drizzle/schema.ts:176-177] — target_domain + target_bigfive_facet columns
- [Source: _bmad-output/implementation-artifacts/10-3-formula-functions-facet-metrics-and-steering-target.md] — Previous story dev notes and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blockers.

### Completion Notes List

- **Task 1:** Added `targetDomain: Schema.NullOr(LifeDomainSchema)` and `targetBigfiveFacet: Schema.NullOr(FacetNameSchema)` to `AssessmentAssistantMessageEntitySchema`. Drizzle repo already selects all columns including these. Mock repo already supported these fields.
- **Task 2:** Wired steering into `send-message.use-case.ts`: extracts `previousDomain` from raw DB entities, computes steering via `computeFacetMetrics` + `computeSteeringTarget` for post-cold-start messages, uses `GREETING_SEED_POOL[1]` (relationships/gregariousness) for cold start. Passes `targetDomain`/`targetFacet` to Nerin and saves them on assistant messages. Added structured logging for steering decisions.
- **Task 3:** Added 6 new steering-specific tests to `send-message.use-case.test.ts`, updated 2 existing tests for new steering parameters. All tests cover: cold start greeting seed, post-cold-start metrics steering, previousDomain extraction, assistant message steering persistence, stale evidence fallback, and transition message handling.
- **Note:** `GREETING_MESSAGES.length` is 1 (not 2 as stated in story Dev Notes), so the seed index is 1 → `{ domain: "relationships", facet: "gregariousness" }`.

### Change Log

- 2026-02-23: Implemented steering integration — all 3 tasks complete, 6 new tests, 0 regressions
- 2026-02-23: Code review fixes — `previousDomain` typed as `LifeDomain | null` (removed unsafe cast), `targetDomain`/`targetFacet` typed as `LifeDomain`/`FacetName`, skipped redundant `findBySession` when no evidence saved, added round-trip unit test for Task 1.3
- 2026-02-23: Code review #2 — removed brittle `"targetDomain" in msg` check (H1), renamed `COLD_START_GREETING_COUNT` → `COLD_START_USER_MSG_THRESHOLD` (M1), fixed mock to store `null` instead of `undefined` for omitted steering fields + corrected round-trip test assertion (M2), added realistic steering data to `postColdStartMessages` fixture (M3)

### File List

- `packages/domain/src/entities/message.entity.ts` — Added `targetDomain` and `targetBigfiveFacet` fields to `AssessmentAssistantMessageEntitySchema`
- `apps/api/src/use-cases/send-message.use-case.ts` — Integrated steering pipeline: `computeFacetMetrics` → `computeSteeringTarget` → pass to Nerin → save on assistant message; type-safe `previousDomain: LifeDomain | null`; conditional re-fetch only when evidence was saved
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` — Updated 2 existing tests, added 6 new steering integration tests
- `packages/infrastructure/src/repositories/__tests__/assessment-message.drizzle.repository.test.ts` — New: 3 round-trip tests for `targetDomain`/`targetBigfiveFacet` (Task 1.3 completion)
