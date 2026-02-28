# Story 18.1: Evidence v2 Schema and ConversAnalyzer Prompt Update

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system operator,
I want evidence records to use structured deviation/strength/confidence signals instead of noisy 0-20 scores and float confidence,
So that evidence quality improves and downstream scoring is more reliable.

## Acceptance Criteria

1. **Given** the `conversation_evidence` table, **When** the schema is updated, **Then** columns `score` (integer) and `confidence` (float) are replaced with `deviation` (integer, -3 to +3), `strength` (enum: weak/moderate/strong), `confidence` (enum: low/medium/high), and `note` (text). The old table is dropped and recreated (Decision D7 — no migration, fresh start).

2. **Given** ConversAnalyzer's prompt in `conversanalyzer.anthropic.repository.ts`, **When** updated for Evidence v2, **Then** it instructs extraction of `deviation` (-3 to +3), `strength` (weak/moderate/strong), `confidence` (low/medium/high), `note` (brief paraphrase), and `domain`. The prompt says "extract up to 5 records" (advisory, server enforces cap).

3. **Given** the Effect Schema validation for ConversAnalyzer output, **When** a record has invalid enum values (e.g., "very strong"), **Then** the entire record is dropped (existing pattern — malformed tool_use output discarded).

4. **Given** `EvidenceInput` type in `packages/domain/src/types/evidence.ts`, **When** updated, **Then** `score: number` and `confidence: number` are replaced in-place with `deviation: number`, `strength: "weak" | "moderate" | "strong"`, `confidence: "low" | "medium" | "high"` — no parallel `EvidenceInputV2` type (Pattern 1 from architecture doc).

## Tasks / Subtasks

- [ ] Task 1: Update `EvidenceInput` type in domain layer (AC: #4)
  - [ ] 1.1 In `packages/domain/src/types/evidence.ts`, replace `score: number` and `confidence: number` with `deviation: number`, `strength: "weak" | "moderate" | "strong"`, `confidence: "low" | "medium" | "high"`. Add `note?: string` (optional — not all consumers need it).
  - [ ] 1.2 Update `ConversationEvidenceInput` in `packages/domain/src/repositories/conversation-evidence.repository.ts` — it extends `EvidenceInput` so fields propagate automatically. Add `note: string` as required (always saved to DB).
  - [ ] 1.3 Update `ConversationEvidenceRecord` in the same file — replace `score: number` and `confidence: number` with `deviation: number`, `strength: "weak" | "moderate" | "strong"`, `confidence: "low" | "medium" | "high"`, `note: string`.
  - [ ] 1.4 Update `ConversanalyzerOutput.evidence` type in `packages/domain/src/repositories/conversanalyzer.repository.ts` — ensure evidence items include `deviation`, `strength`, `confidence`, `note` fields (type is `EvidenceInput & { note: string }`).
  - [ ] 1.5 Fix all TypeScript compilation errors in domain package caused by the type change. Do NOT add adapter layers or v1/v2 parallel types.

- [ ] Task 2: Update DB schema — drop and recreate `conversation_evidence` (AC: #1)
  - [ ] 2.1 In `packages/infrastructure/src/db/drizzle/schema.ts`:
    - Add new enums: `evidenceStrengthEnum = pgEnum("evidence_strength", ["weak", "moderate", "strong"])` and `evidenceConfidenceEnum = pgEnum("evidence_confidence", ["low", "medium", "high"])`.
    - Replace `score: smallint("score").notNull()` with `deviation: smallint("deviation").notNull()`.
    - Replace `confidence: numeric("confidence", ...)` with `strength: evidenceStrengthEnum("strength").notNull()` and `confidence: evidenceConfidenceEnum("confidence").notNull()`.
    - Add `note: text("note").notNull()`.
    - Update check constraint: remove `score_check` and `confidence_check`, add `check("conversation_evidence_deviation_check", sql\`deviation >= -3 AND deviation <= 3\`)`.
  - [ ] 2.2 Generate a new Drizzle migration: `pnpm db:generate`. Because this is a breaking schema change (D7), the migration should drop the old `conversation_evidence` table and recreate it. Verify the generated migration SQL is correct — it should `DROP TABLE IF EXISTS conversation_evidence` then `CREATE TABLE` with new columns. Also add `CREATE TYPE` for the new enums if Drizzle doesn't auto-generate them.
  - [ ] 2.3 Verify migration applies cleanly: `pnpm db:migrate`.

- [ ] Task 3: Update Drizzle repository implementation (AC: #1)
  - [ ] 3.1 In `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts`, update the `save` method mapping: replace `score: r.score` with `deviation: r.deviation`, replace `confidence: String(r.confidence)` with `strength: r.strength`, `confidence: r.confidence`. Add `note: r.note`.
  - [ ] 3.2 Update the `findBySession` row mapping: replace `score: row.score` with `deviation: row.deviation`, replace `confidence: Number(row.confidence)` with `strength: row.strength as ConversationEvidenceRecord["strength"]`, `confidence: row.confidence as ConversationEvidenceRecord["confidence"]`. Add `note: row.note`.

- [ ] Task 4: Update ConversAnalyzer prompt and Effect Schema (AC: #2, #3)
  - [ ] 4.1 In `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`, update `EvidenceItemSchema`:
    ```typescript
    const EvidenceItemSchema = S.Struct({
        bigfiveFacet: S.Literal(...ALL_FACETS),
        deviation: S.Int.pipe(S.between(-3, 3)),
        strength: S.Literal("weak", "moderate", "strong"),
        confidence: S.Literal("low", "medium", "high"),
        domain: S.Literal(...LIFE_DOMAINS),
        note: S.String.pipe(S.maxLength(200)),
    });
    ```
  - [ ] 4.2 Update `buildPrompt()` to instruct Evidence v2 extraction:
    - Replace "extract 0-3 records" with "extract up to 5 records".
    - Replace field descriptions: `score (0-20)` → `deviation (-3 to +3, where 0 = population average, +3 = far above, -3 = far below)`, `confidence (0-1)` → `strength (weak/moderate/strong — diagnosticity: how strongly does this indicate the facet?)`, add `confidence (low/medium/high — certainty: how certain are you about this signal?)`, add `note (brief behavioral paraphrase, max 200 chars, no direct quotes)`.
    - Keep existing facet definitions and domain descriptions unchanged.
  - [ ] 4.3 Remove old constants `SCORE_MIN`, `SCORE_MAX`, `CONFIDENCE_MIN`, `CONFIDENCE_MAX` if they become unused. Replace with deviation bounds if needed.
  - [ ] 4.4 Verify the tool_use JSON schema sent to the Anthropic API matches the new `EvidenceItemSchema` — the existing pattern auto-derives it from the Effect Schema.

- [ ] Task 5: Update `send-message.use-case.ts` evidence handling (AC: #2)
  - [ ] 5.1 Update the evidence cap from `slice(0, 3)` to `slice(0, 5)` (per-message cap increase from 3 to 5, per architecture decision).
  - [ ] 5.2 The spread `...e` in the save mapping already propagates new fields (`deviation`, `strength`, `confidence`, `note`) — verify no explicit `score` or `confidence` references remain.
  - [ ] 5.3 Verify `aggregateDomainDistribution()` function works with v2 evidence (it only reads `domain` field — should be fine).

- [ ] Task 6: Update mock repository (AC: #1)
  - [ ] 6.1 In `packages/infrastructure/src/repositories/__mocks__/conversation-evidence.drizzle.repository.ts`, update stored record type to match new `ConversationEvidenceRecord` (v2 fields).
  - [ ] 6.2 Update `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` — mock output evidence items must use v2 fields: replace `score`/`confidence(number)` with `deviation`/`strength`/`confidence(enum)`/`note`.

- [ ] Task 7: Fix all remaining compilation errors and tests
  - [ ] 7.1 Run `pnpm build` — fix any TypeScript errors across all packages caused by the `EvidenceInput` type change. Key files likely affected:
    - `packages/domain/src/utils/formula.ts` (`computeFacetMetrics` reads `score`/`confidence`) — **DO NOT rewrite the formula logic** in this story. Temporarily update the function signature to accept v2 fields with a minimal adapter: `const score = MIDPOINT + deviation * SCALE_FACTOR` and `const conf = CONFIDENCE_WEIGHT[confidence]`. Mark with `// TODO: Story 18-2 will rewrite this properly`.
    - `packages/domain/src/utils/confidence.ts` (`computeDepthSignal`) — if it reads raw `confidence`, update to use v2 enum. Mark with `// TODO: Story 18-2`.
    - Any test fixtures using `EvidenceInput` shape.
  - [ ] 7.2 Run `pnpm test:run` — fix any failing tests. Update test fixtures to use v2 evidence shape.
  - [ ] 7.3 Run `pnpm lint` — fix any lint errors.

## Parallelism

- **Blocked by:** none
- **Blocks:** 18-2-rewrite-compute-facet-metrics-for-evidence-v2, 18-3-rolling-evidence-budget-and-cap-enforcement
- **Mode:** parallel (can run concurrently with Epic 16 and 17 stories, and with 19-1, 19-2)
- **Domain:** backend pipeline (DB schema, domain types, ConversAnalyzer prompt, use-cases)
- **Shared files:**
  - `packages/domain/src/types/evidence.ts` — also touched by 18-2
  - `packages/domain/src/utils/formula.ts` — also touched by 18-2 (major rewrite)
  - `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` — also touched by 17-2 (micro-intent)
  - `apps/api/src/use-cases/send-message.use-case.ts` — touched by 17-1, 17-2, 17-3, 18-3

## Dev Notes

### Architecture Compliance

- **Decision D4 (Evidence v2 Format):** Core of this story. `deviation: -3 to +3`, `strength: weak/moderate/strong`, `confidence: low/medium/high`. Weight = strength x confidence.
- **Decision D7 (Migration Strategy):** Drop tables on schema-breaking deploys (pre-PMF). No migration needed — drop `conversation_evidence` and recreate.
- **Decision D9 (ConversAnalyzer Error Resilience):** Existing retry + skip pattern in `send-message.use-case.ts` is unchanged. Schema validation failure drops individual records (existing behavior).
- **Pattern 1 (In-place type replacement):** Replace `EvidenceInput` fields directly — do NOT create a parallel `EvidenceInputV2` type. This is critical to avoid import confusion and adapter layers.
- **Hexagonal architecture:** Types in domain, implementation in infrastructure, consumption in use-cases. No cross-layer imports.

### Key Files to Modify

| File | Change |
|---|---|
| `packages/domain/src/types/evidence.ts` | Replace `score`/`confidence(float)` with `deviation`/`strength(enum)`/`confidence(enum)` |
| `packages/domain/src/repositories/conversation-evidence.repository.ts` | Update `ConversationEvidenceInput` and `ConversationEvidenceRecord` |
| `packages/domain/src/repositories/conversanalyzer.repository.ts` | Update `ConversanalyzerOutput.evidence` type |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Drop+recreate `conversation_evidence`, add enums |
| `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts` | Update save/read mappings |
| `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` | New prompt + Effect Schema |
| `packages/infrastructure/src/repositories/__mocks__/conversation-evidence.drizzle.repository.ts` | Update mock fields |
| `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` | Update mock output |
| `apps/api/src/use-cases/send-message.use-case.ts` | Cap change 3→5, verify field propagation |
| `packages/domain/src/utils/formula.ts` | Minimal adapter (temporary, until Story 18-2) |

### Testing Standards

- Use `@effect/vitest` with `it.effect()` for Effect programs
- Mock pattern: `vi.mock()` + original paths, never import from `__mocks__/` directly
- Import ordering: `import { vi } from "vitest"` FIRST, then `vi.mock()` calls, then `@effect/vitest` imports
- Each test file composes its own minimal `TestLayer` via `Layer.mergeAll(...)`
- Update all test fixtures using `EvidenceInput` shape to v2 fields

### Project Structure Notes

- All changes follow existing hexagonal architecture patterns
- Enum definitions in Drizzle schema follow existing `bigfiveFacetNameEnum`, `evidenceDomainEnum` patterns
- No new packages, no new files except the Drizzle migration (auto-generated)
- `note` field is new — does not exist in current schema. It captures a brief behavioral paraphrase from ConversAnalyzer, used later in Evidence Review (Epic 20/Story 5.1)

### References

- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Decision 4]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Deviation Aggregation + Score Mapping]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Phase 2: Evidence v2 + Scoring v2]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Pattern 1]
- [Source: _bmad-output/planning-artifacts/epics-conversation-pipeline.md#Story 3.1]
- [Source: packages/infrastructure/src/db/drizzle/schema.ts lines 191-218]
- [Source: packages/domain/src/types/evidence.ts]
- [Source: packages/domain/src/repositories/conversation-evidence.repository.ts]
- [Source: packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **NO parallel types** — Do NOT create `EvidenceInputV2` alongside `EvidenceInput`. Replace in-place per Pattern 1. This is the single most likely LLM mistake for this story.
6. **NO adapter layers** — Do NOT create a function that converts v1 evidence to v2 format. All consumers update to use v2 fields directly.
7. **NO formula rewrite** — `computeFacetMetrics()` gets a minimal adapter in THIS story (deviation→score, enum→number). The full rewrite is Story 18-2. Do not rewrite the formula logic.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
