# Story 7.2: Relationship Letter Generation with UserSummary

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want relationship letter generation to use UserSummaries instead of raw evidence,
so that the letter is richer and input tokens are reduced from roughly 70K to roughly 30K (per ADR-10 / ADR-55).

## Acceptance Criteria

1. **Given** User A and User B have both completed assessments with UserSummaries generated (Story 7.1)  
   **When** User B accepts User A's QR invitation and the background generator runs  
   **Then** relationship letter generation loads **both users' `user_summaries` rows** (via `UserSummaryRepository`) — **not** `ConversationEvidenceRepository.findBySession` for prompt construction.

2. **Given** the Sonnet call  
   **When** `buildRelationshipAnalysisPrompt` runs  
   **Then** the user prompt includes **User A summary + User B summary** (at minimum: `summary_text`, structured `themes`, and a bounded excerpt of `quote_bank` suitable for relational framing) **and** both users' facet score maps (existing derive-at-read pattern for scores).

3. **Given** ADR-55 / safety rules  
   **When** prompts are composed  
   **Then** **do not** inject raw per-message evidence or conversation transcripts into the relationship letter prompt (UserSummary quote bank is the curated verbatim layer).

4. **Given** existing output contract  
   **When** generation completes  
   **Then** the generator still returns **validated spine-format JSON** (array of sections with `emoji`, `title`, `paragraphs`) as today — unless you explicitly expand scope with PM approval. Presentation shell (720px letter reading, warm background) is primarily **frontend / Story 7.3**; this story is **input + prompt refactor**.

5. **Given** free-unlimited policy  
   **When** acceptance completes  
   **Then** no credit consumption paths are introduced; QR accept remains free (FR33).

6. **Given** quality gates  
   **When** tests run  
   **Then** `pnpm test:run` passes, including updated domain prompt tests and `generate-relationship-analysis` use-case tests with mocks reflecting **UserSummary-shaped** inputs (no longer asserting evidence repository calls for prompt data).

## Tasks / Subtasks

- [x] Task 1: Domain API for generator input (AC: #1–#3)  
  - [x] 1.1 Extend `RelationshipAnalysisGenerationInput` (`packages/domain/src/repositories/relationship-analysis-generator.repository.ts`) to carry **UserSummary fields** (reuse `UserSummaryRecord` or a dedicated slim DTO for prompts). Remove reliance on `ReadonlyArray<ConversationEvidenceRecord>` for generation.  
  - [x] 1.2 Update `RelationshipAnalysisPromptInput` + `buildRelationshipAnalysisPrompt` (`packages/domain/src/prompts/relationship-analysis.prompt.ts`): replace `formatUserProfile` evidence section with **UserSummary sections** (themes, summary_text, capped quote bank — align with how `buildUserSummaryPrompt` presents grounded content without flooding tokens).  
  - [x] 1.3 Update `packages/domain/src/prompts/__tests__/relationship-analysis-prompt.test.ts` fixtures accordingly.

- [x] Task 2: Use-case data loading (AC: #1, #5)  
  - [x] 2.1 In `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`, inject **`UserSummaryRepository`**. Refactor `loadUserAssessmentData` to: resolve session + completed `assessment_results` as today; load facet scores map as today; **load `UserSummary` by `assessment_result_id`** via `getByAssessmentResultId(result.id)` (preferred over `getLatestForUser` — ties summary to the same result row used for scores).  
  - [x] 2.2 If summary is **null** while the assessment result exists, treat as **retry-worthy / generation failure** (same class as missing data today — log, `incrementRetryCount`, return `{ success: false }`) — UserSummary is mandatory for authenticated completion paths per Story 7.1.  
  - [x] 2.3 Remove unused `ConversationEvidenceRepository` dependency from this use-case if no longer referenced.

- [x] Task 3: Infrastructure generator (AC: #4)  
  - [x] 3.1 Update `RelationshipAnalysisGeneratorAnthropicRepositoryLive` to pass new prompt input shape into `buildRelationshipAnalysisPrompt`.  
  - [x] 3.2 Update `RelationshipAnalysisGeneratorMockRepositoryLive` if the mock needs to assert shape (signature change). *(No code change required — mock returns fixed spine JSON; input type updated at compile time only.)*

- [x] Task 4: API wiring (AC: #1)  
  - [x] 4.1 Ensure `UserSummaryRepository` is available in the same `Effect` layer context used when `generateRelationshipAnalysis` runs (likely already merged for 7.1 — verify `RepositoryLayers` / `HttpGroupsLive` / forkDaemon entrypoint). *(Verified: `UserSummaryDrizzleRepositoryLive` in `apps/api/src/index.ts` `RepositoryLayers`.)*

- [x] Task 5: Tests (AC: #6)  
  - [x] 5.1 Update `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`: add `UserSummaryRepository` mock; assert generator receives UserSummary fields; drop evidence-repository expectations for prompt path.  
  - [x] 5.2 Run `pnpm typecheck` and `pnpm test:run`.

## Dev Notes

### Epic cross-story context

- **Story 7.1** persists `user_summaries` and wires generation into `generate-results` — relationship letters must read that canonical state.  
- **Story 7.3** delivers the living relationship **page** (sections, ritual, intimacy UX) — **do not** rebuild the full page in 7.2 unless you are explicitly pulling a small shared constant for “letter” tone; keep this story backend-heavy.  
- **Story 10.2** (notification) already fires after content write — should remain unchanged when only inputs change.

### Canonical references

- Epic AC: [`_bmad-output/planning-artifacts/epics.md`](../../planning-artifacts/epics.md) — Epic 7, Story 7.2  
- ADR-10 (QR model + UserSummary inputs): [`_bmad-output/planning-artifacts/architecture.md`](../../planning-artifacts/architecture.md) — search “ADR-10”, “ADR-55”  
- Prior implementation story (IS epic): relationship analysis pipeline originally from Story 14.4 / 35-x; current code paths above.

### Architecture compliance

- **Hexagonal:** No new business logic in HTTP handlers; all changes in use-cases, domain prompts, and infrastructure adapters (`CLAUDE.md`).  
- **Derive-at-read** still applies to facet **scores** displayed elsewhere; UserSummary is an additional compressed artifact.  
- **Errors:** Continue to use `RelationshipAnalysisGenerationError` / existing retry semantics — do not remap errors in handlers.

### File structure (expected touchpoints)

| Area | Path |
| --- | --- |
| Generator port | `packages/domain/src/repositories/relationship-analysis-generator.repository.ts` |
| Prompt | `packages/domain/src/prompts/relationship-analysis.prompt.ts` |
| Prompt tests | `packages/domain/src/prompts/__tests__/relationship-analysis-prompt.test.ts` |
| Use-case | `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` |
| Anthropic adapter | `packages/infrastructure/src/repositories/relationship-analysis-generator.anthropic.repository.ts` |
| Mock generator | `packages/infrastructure/src/repositories/relationship-analysis-generator.mock.repository.ts` |
| Use-case tests | `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts` |
| Domain barrel | `packages/domain/src/index.ts` (if types are exported) |

### Testing standards

- `@effect/vitest` — follow **`CLAUDE.md` mock import order**: `vitest` / `vi` first, `vi.mock` hoists, then `@effect/vitest`.  
- Prefer **Layer** composition with small mocks for `UserSummaryRepository` and existing repos.

### Previous story intelligence (7.1)

Source: [`7-1-usersummary-data-model-and-generator.md`](./7-1-usersummary-data-model-and-generator.md)

- `UserSummaryRepository` exposes `getByAssessmentResultId`, `getLatestForUser`, `upsertForAssessmentResult`. For relationship generation, **`getByAssessmentResultId(result.id)`** matches the assessment row you already load for facet scores.  
- Haiku generates UserSummary; relationship letter stays on **Sonnet** (`portraitModelId` in existing relationship generator — do not change model tier unless architecture explicitly updates).  
- Review notes from 7.1: unbounded evidence / no LLM timeout are **known deferred patterns**; switching to UserSummary **reduces** prompt bloat versus raw evidence.

### Git intelligence (recent commits)

- `d44f7095` — `feat(7-1): UserSummary data model and generator` — introduced `user_summaries`, repository, and `generate-user-summary` / `generate-results` wiring.  
- Relationship letter work should **build on** that merge rather than duplicating evidence-loading patterns.

### Latest tech notes

- Monorepo: Node **≥ 20**, **pnpm@10.4.1** (`CLAUDE.md`).  
- LangChain `@langchain/anthropic` `ChatAnthropic` — unchanged integration style for the relationship generator.

### Project context reference

- [`CLAUDE.md`](../../../CLAUDE.md) — hexagonal architecture, Effect layers, repository naming.

### Scope clarifications (read before coding)

- **Letter “format” (720px, warm background)** in epics is primarily **reading UI** (ADR-48 shell shared with portrait/weekly). Backend still stores **spine JSON string** today; frontend renders via `RelationshipPortrait` + markdown/spine handling. Changing stored format to prose-only is **not required** to satisfy “UserSummary instead of raw evidence” — confirm with PM if ADR-48 **prose letter** output is required in the same story.  
- **Names:** Continue using participant labels consistent with existing generator (`userAName` / `userBName` or display names from relationship analysis entity — match current behavior).

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

### Completion Notes List

- Refactored relationship letter generation to load `UserSummary` per `assessment_result_id` and pass `UserSummaryRecord` into the Sonnet prompt builder; removed `ConversationEvidenceRepository` from this use-case path.
- Prompt now includes narrative, themes, and capped quote excerpts (24 quotes, 240 chars max per quote) plus facet score maps for internal calibration; spine JSON output contract unchanged.
- Added use-case test for missing UserSummary (retry) and replaced evidence-repository assertions with `getByAssessmentResultId` expectations.
- `pnpm turbo typecheck --force --filter=@workspace/domain --filter=api` and `pnpm test:run` completed successfully (2026-04-16).

### File List

- `packages/domain/src/repositories/relationship-analysis-generator.repository.ts`
- `packages/domain/src/prompts/relationship-analysis.prompt.ts`
- `packages/domain/src/prompts/__tests__/relationship-analysis-prompt.test.ts`
- `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`
- `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/7-2-relationship-letter-generation-with-usersummary.md`

### Review Findings

- [x] [Review][Patch] **`retry-relationship-analysis` test provides stale Layer** — Replaced `ConversationEvidenceRepository` mock with `UserSummaryRepository` mock in retry test layer. [apps/api/src/use-cases/__tests__/retry-relationship-analysis.use-case.test.ts:57-78]
- [x] [Review][Patch] **Dropped "vulnerability" guardrail assertion without replacement** — Added `expect(systemPrompt).toContain("Never invent or paraphrase")` to cover the replacement safety language. [packages/domain/src/prompts/__tests__/relationship-analysis-prompt.test.ts:70]
- [x] [Review][Defer] **Retry loop has no termination strategy** — `incrementRetryCount` runs on each missing-data cycle with no cap, backoff escalation, or terminal failure state. Pre-existing pattern across generators. [apps/api/src/use-cases/generate-relationship-analysis.use-case.ts:90-94]
- [x] [Review][Defer] **Asymmetric log levels for inviter vs invitee missing data** — Inviter missing = `error`; invitee missing = `info`. If inviter UserSummary is transiently delayed (not a true error), this triggers pager alerts. Pre-existing pattern from Story 14.4. [apps/api/src/use-cases/generate-relationship-analysis.use-case.ts:86-97]
- [x] [Review][Defer] **Participant names hardcoded as "Person A"/"Person B"** — Display names not resolved from the relationship analysis entity. Pre-existing since Story 14.4. [apps/api/src/use-cases/generate-relationship-analysis.use-case.ts:106-109]
- [x] [Review][Defer] **`Effect.catchAll` broader than `catchTag`-only guidance** — CLAUDE.md says "only allowed catchTag is fail-open resilience"; the generator retry uses `catchAll` to log + re-fail. Not remapping errors, but broader than spec. Pre-existing. [apps/api/src/use-cases/generate-relationship-analysis.use-case.ts:116-125]
- [x] [Review][Defer] **Empty/malformed UserSummary fields not validated before prompt** — If `summaryText` is empty or `quoteBank` entries have missing `quote` fields, formatting degrades silently. Pre-existing pattern (mirrors other generators). [packages/domain/src/prompts/relationship-analysis.prompt.ts:84-100]

## Change Log

- **2026-04-16:** Implemented Epic 7 Story 7.2 — UserSummary-backed relationship letter generation (domain port, prompt, use-case, tests); story and sprint status set to **review**.
- **2026-04-16:** Code review (3-layer adversarial) — 2 patch items, 5 deferred (pre-existing), 15 dismissed as noise.

---

**Story completion status:** Implementation complete — ready for code review (`code-review` workflow).
