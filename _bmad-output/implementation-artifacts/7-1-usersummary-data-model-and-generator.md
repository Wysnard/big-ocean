# Story 7.1: UserSummary Data Model & Generator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a UserSummary generated at assessment completion,
so that all Nerin LLM surfaces (portrait, weekly letter, relationship letter) read from a compressed canonical user-state.

## Acceptance Criteria

1. **Given** the Drizzle schema  
   **When** the migration is applied  
   **Then** a `user_summaries` table exists with columns:  
   - `id` (uuid PK, default `gen_random_uuid()`)  
   - `user_id` (text, FK → `user.id`, `onDelete: "cascade"`)  
   - `assessment_result_id` (uuid, FK → `assessment_results.id`, `onDelete: "cascade"`)  
   - `themes` (jsonb — array of theme objects; shape should be forward-compatible with ADR-55 theme entries, e.g. `theme`, `description`, optional `themeAge` / `lastCorroborated` as strings/numbers)  
   - `quote_bank` (jsonb — array of ≤ **50** verbatim-quote objects; enforce max length in generator + validate parsed output)  
   - `summary_text` (text — compressed narrative used as the primary “human-readable” UserSummary body for downstream prompts)  
   - `version` (integer, not null, default `1` — bump on each successful regeneration in later stories)  
   - `created_at`, `updated_at` (timestamptz; `updated_at` with `$onUpdate` like other tables)  
   **And** a **unique** constraint on `assessment_result_id` (one UserSummary row per assessment result row)  
   **And** an index on `user_id` for “latest for user” reads (e.g. `(user_id, updated_at DESC)` or equivalent per existing migration style)

2. **Given** the domain layer  
   **When** the story is complete  
   **Then** a `UserSummaryRepository` interface exists in `packages/domain/src/repositories/user-summary.repository.ts` with at least:  
   - `upsertForAssessmentResult` (insert or update by `assessment_result_id`)  
   - `getByAssessmentResultId`  
   - `getLatestForUser` (optional but recommended — used by future consumers; can be “latest by `updated_at`”)  
   **And** a Drizzle implementation `UserSummaryDrizzleRepositoryLive` in `packages/infrastructure/src/repositories/user-summary.drizzle.repository.ts`  
   **And** a co-located `__mocks__/user-summary.drizzle.repository.ts` mock (in-memory, same `Layer` export pattern as other repos)

3. **Given** LLM generation plumbing  
   **When** implemented  
   **Then** a `UserSummaryGeneratorRepository` (domain `Context.Tag`) defines `generate` with typed input/output failures (`UserSummaryGenerationError` pattern — mirror `WeeklySummaryGeneratorRepository`)  
   **And** `UserSummaryGeneratorAnthropicRepositoryLive` lives in infrastructure, using **`@langchain/anthropic` `ChatAnthropic`**, `Redacted` API key from `AppConfig`, and **structured logging** via `LoggerRepository` (same integration style as `WeeklySummaryGeneratorAnthropicRepositoryLive` / relationship generators)  
   **And** the model is **Claude Haiku** — default to `AppConfig.conversanalyzerModelId` (documented as the Haiku-tier model id) **unless** you add an optional `userSummaryModelId` to `AppConfig` defaulting to the same value (prefer minimal config surface: reuse existing Haiku id first)

4. **Given** prompt + parsing rules  
   **When** the generator runs  
   **Then** prompts live in `packages/domain` as pure builders (e.g. `buildUserSummaryPrompt`) taking: facet scores (from computed facet map), serialized conversation evidence (reuse the same evidence records as scoring — `ConversationEvidenceRepository.findBySession` / user-scoped rules already used in `generate-results.use-case.ts`), and user/session metadata needed for grounding  
   **And** the LLM returns **structured JSON** matching the persisted columns (`themes`, `quote_bank`, `summary_text`) — validate with **Effect Schema** (`@effect/schema`) in the use-case or a small domain parser helper so bad outputs fail fast with a clear error tag

5. **Given** `generate-user-summary.use-case.ts`  
   **When** invoked with `{ sessionId, assessmentResultId, userId }` (or equivalent minimal input)  
   **Then** it loads scoring + evidence, calls `UserSummaryGeneratorRepository`, persists via `UserSummaryRepository` with `version: 1` for first creation  
   **And** it contains **no HTTP concerns** (hexagonal rule)

6. **Given** `generate-results.use-case.ts` (assessment completion pipeline)  
   **When** the scoring stage has successfully upserted `assessment_results` with `stage: "scored"`  
   **Then** the pipeline invokes UserSummary generation **before** marking the assessment result `completed` / session `completed`  
   **And** if `session.userId` is **non-null**, UserSummary generation is **mandatory**: on failure, the **entire** `generateResults` effect fails (user still sees failed finalization / retry path — match existing error semantics for scoring failures; do **not** swallow)  
   **And** if `session.userId` is **null** (edge: unlinked session), **skip** UserSummary (no DB row) and **still** allow completion — log at `info` with `sessionId` (this preserves anonymous / odd flows without inventing a fake user id)

7. **Given** regeneration semantics (forward-compatible)  
   **When** this story ships  
   **Then** only **first-time** generation exists  
   **But** code + schema must be shaped so later triggers (extension complete, weekly refresh, subscriber chat — ADR-55) can bump `version` and apply “non-fatal on refresh” policy **without** rewriting the table

8. **Given** architecture alignment notes  
   **When** reviewing ADR-55 vs this story  
   **Then** implement the **`user_summaries` table as specified in `epics.md`** (this sprint’s contract)  
   **And** treat ADR-55’s richer `UserSummary` interface + optional `user_summary_versions` history as **north star** — store what fits now in jsonb columns; expect a future migration story if product wants full version history tables

9. **Given** quality gates  
   **When** `pnpm typecheck` and `pnpm test:run` are executed  
   **Then** they pass  
   **And** new tests exist for `generate-user-summary` + updated `generate-results` behavior using `@effect/vitest`, `vi.mock` + `Layer` composition per `CLAUDE.md` import-order rules

## Tasks / Subtasks

- [x] Task 1: Schema + migration (AC: #1, #9)  
  - [x] 1.1 Add `userSummaries` table to `packages/infrastructure/src/db/drizzle/schema.ts` + `defineRelations` wiring as needed  
  - [x] 1.2 Hand-write `drizzle/<timestamp>_user_summaries/migration.sql` (**never** edit an existing migration)  
  - [x] 1.3 Update `drizzle` journal per Drizzle conventions
- [x] Task 2: Domain repository + errors (AC: #2)  
  - [x] 2.1 `UserSummaryRepository` tag + types  
  - [x] 2.2 Drizzle repo + mock + exports (`packages/domain/src/index.ts`, `packages/infrastructure/src/index.ts`)
- [x] Task 3: Generator port + Anthropic adapter (AC: #3, #4)  
  - [x] 3.1 `UserSummaryGeneratorRepository` + `UserSummaryGenerationError`  
  - [x] 3.2 `UserSummaryGeneratorAnthropicRepositoryLive`  
  - [x] 3.3 `buildUserSummaryPrompt` + JSON output contract tests (domain unit tests)
- [x] Task 4: `generate-user-summary` use-case (AC: #4, #5, #7)  
  - [x] 4.1 Orchestrate evidence load + LLM + persist  
  - [x] 4.2 Wire new repos into `apps/api` `RepositoryLayers` / `HttpGroupsLive` dependencies (follow weekly summary wiring)
- [x] Task 5: Integrate into `generate-results.use-case.ts` (AC: #6)  
  - [x] 5.1 Call `generateUserSummary` after scored upsert, before `updateStage(..., "completed")`  
  - [x] 5.2 Guard `userId` null path (skip + log)  
  - [x] 5.3 Ensure lock release / `Effect.ensuring` still correct
- [x] Task 6: Tests (AC: #9)  
  - [x] 6.1 `generate-user-summary` use-case tests (mock generator + repo)  
  - [x] 6.2 Extend / add `generate-results` tests for “user summary success”, “user summary failure fails pipeline”, “null userId skips”

## Dev Notes

### Epic cross-story context

- **Story 7.2** switches relationship letter generation to read `user_summaries` instead of raw evidence — keep `quote_bank` entries usable as short verbatim inserts for Nerin prompts.  
- **Story 7.3** is UI — out of scope here.

### Canonical references

- **Epic breakdown / AC:** [`_bmad-output/planning-artifacts/epics.md`](../../planning-artifacts/epics.md) — Epic 7, Story 7.1  
- **ADR-55 (UserSummary lifecycle):** [`_bmad-output/planning-artifacts/architecture.md`](../../planning-artifacts/architecture.md) — binding rule: Nerin-voiced surfaces consume UserSummary; rolling regeneration & optional `user_summary_versions` may land later  
- **Results pipeline:** [`apps/api/src/use-cases/generate-results.use-case.ts`](../../../apps/api/src/use-cases/generate-results.use-case.ts) — staged idempotency (`scored` → `completed`)  
- **Parallel “data model + generator” pattern:** [`_bmad-output/implementation-artifacts/5-1-weekly-summary-data-model-and-generation-pipeline.md`](./5-1-weekly-summary-data-model-and-generation-pipeline.md)  
- **Relationship analysis (current evidence-heavy path):** [`apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`](../../../apps/api/src/use-cases/generate-relationship-analysis.use-case.ts) — will be refactored in 7.2

### Architecture compliance

- **No business logic in HTTP handlers** — keep all branching in use-cases (`CLAUDE.md`).  
- **Derive-at-read** for trait-level displays continues to apply; UserSummary is an **additional** compressed artifact, not a replacement for facet truth.  
- **Errors:** define domain/http errors in the usual locations if new user-facing failures are introduced; prefer reusing existing finalization error paths where possible.

### File structure (expected touchpoints)

| Area | Path |
| --- | --- |
| Schema | `packages/infrastructure/src/db/drizzle/schema.ts` |
| Migration | `drizzle/*_user_summaries/migration.sql` |
| Domain repo | `packages/domain/src/repositories/user-summary.repository.ts` |
| Generator port | `packages/domain/src/repositories/user-summary-generator.repository.ts` |
| Prompts | `packages/domain/src/prompts/user-summary.prompt.ts` |
| Use-case | `apps/api/src/use-cases/generate-user-summary.use-case.ts` |
| Integration | `apps/api/src/use-cases/generate-results.use-case.ts` |
| API wiring | `apps/api/src/index.ts` (Layer merges), repository barrel exports |

### Testing standards

- `@effect/vitest` — `it.effect` / `it.scoped` where helpful  
- **`vi` import first**, then `vi.mock`, then `@effect/vitest` (`CLAUDE.md` mock ordering rule)  
- Mock Anthropic in unit tests — never real API keys in CI

### Previous story intelligence

- **Epic 7 story 7.1** is the first story in this epic — no prior 7-x implementation artifacts.  
- Reuse **Weekly summary** generator/repo patterns from Epic 5 for Effect layers, retries, and prompt style.  
- **Epic 6 / Story 6.1** (Circle page) is UI-only — not a dependency for this backend story.

### Git intelligence (recent commits)

- Recent work touched sprint metadata, mood calendar, e2e navigation — no conflicting UserSummary code yet; this story introduces new modules.

### Latest tech notes

- Node **>= 20**, **pnpm@10.4.1** — monorepo standard.  
- LLM integration matches existing **LangChain Anthropic** usage; Haiku model id aligns with `conversanalyzerModelId` in config.

### Project context reference

- Root guidance: [`CLAUDE.md`](../../../CLAUDE.md) (hexagonal architecture, migration rules, mock patterns).

### Open questions (resolved defaults)

- **Anonymous sessions:** Skip UserSummary when `userId` is null; do not fail completion.  
- **ADR-55 vs `user_summaries`:** Implement epics.md table now; evolve toward ADR-55 history/versioning in a later migration if required.

### Review Findings

- [x] [Review][Decision] **Handler remaps `UserSummaryGenerationError` to `DatabaseError`** — Resolved: converted `UserSummaryGenerationError` to `Schema.TaggedError`, added to `generateResults` endpoint contract (500), removed handler catchTag. Error propagates natively.
- [x] [Review][Patch] **camelCase/snake_case mismatch in optional schema fields** — Fixed: added `normalizePayload` pre-processing step that converts `theme_age`→`themeAge`, `last_corroborated`→`lastCorroborated`, `theme_tag`→`themeTag` before schema validation. Test added.
- [x] [Review][Patch] **`toFixed()` can throw on NaN/Infinity facet values** — Fixed: added `Number.isFinite()` guard with fallback to `"0.00"`/`"0.000"` in `buildUserSummaryPrompt`.
- [x] [Review][Patch] **Tests don't assert `version: 1` on persisted record** — Fixed: added `_getUserSummaryByResultId` mock helper and assertions on `version`, `userId`, `assessmentResultId` in the "persists summary" test.
- [x] [Review][Defer] **Unbounded evidence / prompt size for extension sessions** — `findByUserId` returns all user evidence with no cap; prompt can exceed model context window. Pre-existing pattern across generators. [apps/api/src/use-cases/generate-user-summary.use-case.ts:53-55]
- [x] [Review][Defer] **TOCTOU race on concurrent requests** — Two concurrent calls can both pass the "already exists" check, causing duplicate LLM spend. Outer session lock in `generate-results` mitigates (serial within lock), but a direct call to this use-case outside that lock would race. [apps/api/src/use-cases/generate-user-summary.use-case.ts:40-67]
- [x] [Review][Defer] **No timeout / AbortSignal on LLM invoke** — `model.invoke()` has no deadline; stall holds session lock indefinitely. Pre-existing pattern in weekly-summary and relationship generators. [packages/infrastructure/src/repositories/user-summary-generator.anthropic.repository.ts:66-73]
- [x] [Review][Defer] **Shallow JSONB mapping trusts stored data** — `mapThemes`/`mapQuotes` check for key existence but not value types; corrupt jsonb rows could yield objects with non-string fields. Pre-existing pattern in other Drizzle repos. [packages/infrastructure/src/repositories/user-summary.drizzle.repository.ts:15-27]
- [x] [Review][Defer] **No size caps on themes array or summary_text** — Schema validates structure but not size; oversized LLM output persists without limit. [packages/domain/src/schemas/user-summary-llm.ts:67-75]
- [x] [Review][Defer] **Loss of structured error context from Anthropic** — `Effect.tryPromise` catch stringifies errors, dropping status codes and request IDs useful for debugging. Pre-existing pattern. [packages/infrastructure/src/repositories/user-summary-generator.anthropic.repository.ts:70-75]
- [x] [Review][Defer] **No retry/backoff for transient Anthropic failures** — Single LLM failure fails the entire finalization. Pre-existing across all generators. [packages/infrastructure/src/repositories/user-summary-generator.anthropic.repository.ts]

## Dev Agent Record

### Agent Model Used

Cursor agent (GPT-5.1)

### Debug Log References

### Completion Notes List

- Implemented `user_summaries` Drizzle schema + SQL migration, `UserSummaryRepository` + Drizzle + `__mocks__`, `UserSummaryGeneratorRepository` + Anthropic (Haiku via `conversanalyzerModelId`) + mock, `buildUserSummaryPrompt`, `decodeUserSummaryLlmPayload` with `@effect/schema`, `generateUserSummary` use-case (idempotent by `assessment_result_id`), wired into `generate-results` before completion; conversation handler maps `UserSummaryGenerationError` to `DatabaseError` for HTTP contract; E2E index wires mock generator + real Drizzle repo; tests: domain schema, `generate-user-summary`, extended `generate-results` (skip null `userId`, fail on generator error).
- `pnpm typecheck` and `pnpm --filter=api exec vitest run` pass.

### File List

- `drizzle/20260416130000_user_summaries/migration.sql`
- `packages/domain/src/index.ts`
- `packages/domain/src/prompts/user-summary.prompt.ts`
- `packages/domain/src/repositories/user-summary.repository.ts`
- `packages/domain/src/repositories/user-summary-generator.repository.ts`
- `packages/domain/src/schemas/user-summary-llm.ts`
- `packages/domain/src/schemas/__tests__/user-summary-llm.test.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/index.ts`
- `packages/infrastructure/src/repositories/user-summary.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/user-summary-generator.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/user-summary-generator.mock.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/user-summary.drizzle.repository.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.e2e.ts`
- `apps/api/src/handlers/conversation.ts`
- `apps/api/src/use-cases/generate-results.use-case.ts`
- `apps/api/src/use-cases/generate-user-summary.use-case.ts`
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/generate-user-summary.use-case.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-04-15:** Story 7.1 implemented — UserSummary table, Haiku generator, finalization integration, tests, sprint status → review.
