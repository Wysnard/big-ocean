# Story 45.5: FK Column Code Cascade

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want downstream code to use the renamed FK column properties consistently,
so that ADR-39's conversation semantics are reflected throughout the stack without breaking domain-level session APIs.

## Acceptance Criteria

1. **AC1: Repository and DB-adjacent code uses renamed Drizzle properties**
   **Given** Story 45.4 has already renamed the SQL columns and Drizzle schema TS properties
   **When** the downstream code cascade is completed
   **Then** all direct references to the renamed schema properties use the new names:
   - `conversationEvidence.assessmentSessionId` → `conversationEvidence.conversationId`
   - `conversationEvidence.assessmentMessageId` → `conversationEvidence.messageId`
   - `assessmentResults.assessmentSessionId` → `assessmentResults.conversationId`
   - `portraitRatings.assessmentSessionId` → `portraitRatings.conversationId`
   - `exchange.sessionId` → `exchange.conversationId`
   - `message.sessionId` → `message.conversationId`
   - `publicProfile.sessionId` → `publicProfile.conversationId`
   **And** row mappers still return the existing domain-facing field names (`sessionId`, `assessmentSessionId`) where repository interfaces require them.

2. **AC2: Scope boundary is preserved**
   **Given** the repo already uses `sessionId` and `assessmentSessionId` as business-level concepts in domain entities, contracts, handlers, use-cases, and UI routes
   **When** this story is implemented
   **Then** only code that directly touches the renamed Drizzle schema properties or SQL column names is changed
   **And** product/API semantics such as route params, request payloads, response shapes, job payloads, and user-facing copy are not renamed unless a specific compile or runtime error proves they must be.

3. **AC3: Test, seed, and fixture layers are updated**
   **Given** test helpers and support tooling also touch the renamed columns and properties
   **When** the cascade is complete
   **Then** direct SQL fixtures use `conversation_id` and `message_id`
   **And** TypeScript assertions and inserts use `conversationId` and `messageId`
   **And** schema tests, e2e factories/fixtures, auth setup, and seed scripts compile and run against the post-45.4 schema.

4. **AC4: Verification passes across the workspace**
   **Given** the direct-property cascade is finished
   **When** verification runs
   **Then** `pnpm typecheck` passes across all packages
   **And** `pnpm test:run` passes
   **And** `pnpm build` succeeds.

5. **AC5: Stale direct FK-property references are eliminated without scope creep**
   **Given** the old property names still appear in multiple repository and test files after Story 45.4
   **When** the implementation is complete
   **Then** targeted searches no longer find stale downstream direct-property references such as:
   - `.assessmentSessionId` on renamed Drizzle tables that now expose `.conversationId`
   - `.assessmentMessageId` on `conversationEvidence` rows that now expose `.messageId`
   - `.sessionId` on `message`, `exchange`, and `publicProfile` Drizzle rows where the schema property is now `.conversationId`
   **And** the following intentional exceptions remain unchanged:
   - domain/API fields that still intentionally use `sessionId` or `assessmentSessionId`
   - `assessment_results` table name and `assessment_result_id` FKs
   - `parentSessionId` TS property on `conversation` (deferred from Story 45.1/45.4)
   - legacy `assessment_session_*` index names on `conversations` intentionally kept stable in Story 45.1.

## Tasks / Subtasks

- [x] Task 1: Cascade renamed Drizzle properties through repository implementations (AC: 1, 2, 5)
  - [x] 1.1 Scan all infrastructure repositories that import `conversationEvidence`, `assessmentResults`, `portraitRatings`, `exchange`, `message`, or `publicProfile` from the Drizzle schema.
  - [x] 1.2 Update row access, insert payloads, select projections, joins, and conflict targets to use the new schema property names: `conversationId` / `messageId`.
  - [x] 1.3 Preserve existing repository contracts by mapping DB-level `conversationId` back to domain-level `sessionId` or `assessmentSessionId` where the domain interfaces still require those names.
  - [x] 1.4 Prioritize these files first because they directly touch the renamed schema properties:
    - `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/exchange.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/message.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/portrait.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/portrait-rating.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts`
    - any additional repository that fails typecheck because it reads the renamed schema properties.

- [x] Task 2: Update DB-adjacent non-repository code that reads renamed schema properties (AC: 1, 2, 3)
  - [x] 2.1 Update plain Drizzle usage in `packages/infrastructure/src/context/better-auth.ts`, especially `assessmentResults.conversationId` lookups driven by Polar checkout metadata.
  - [x] 2.2 Fix any schema-level tests that assert the old property names, starting with `packages/infrastructure/src/db/__tests__/schema.test.ts`.
  - [x] 2.3 Check for direct schema property access in support code outside repositories, including auth/bootstrap flows and test helpers.

- [x] Task 3: Update test infrastructure, fixtures, and seeds to the post-45.4 schema (AC: 3, 5)
  - [x] 3.1 Update e2e factory and fixture SQL to use `conversation_id` / `message_id` where they write directly to PostgreSQL.
  - [x] 3.2 Update TypeScript-side row assertions and helper mappings in:
    - `e2e/factories/assessment.factory.ts`
    - `e2e/fixtures/db.ts`
    - `e2e/global-setup.ts`
    - `e2e/e2e-env.ts`
    - `e2e/playwright.config.ts`
  - [x] 3.3 Update support files that must stay aligned with the renamed schema:
    - `scripts/seed-completed-assessment.ts`
    - `docker/init-db-test.sql`
    - `compose.e2e.yaml`
  - [x] 3.4 Preserve intentionally deferred naming in test helper exports such as `createAssessmentSession` / `sendAssessmentMessage` unless changing them is required to satisfy compilation within this story's scope.

- [x] Task 4: Validate boundaries and prevent over-renaming (AC: 2, 5)
  - [x] 4.1 Do not rename route params, HTTP contract fields, or domain entity properties that still intentionally use `sessionId` or `assessmentSessionId`.
  - [x] 4.2 Do not rename `assessment_results`, `assessment_result_id`, or result-oriented domain APIs.
  - [x] 4.3 Do not pull the deferred `parentSessionId` → `parentConversationId` TS property rename into this story.
  - [x] 4.4 Do not touch the legacy `assessment_session_*` index names on `conversations` that Story 45.1 intentionally left stable.

- [x] Task 5: Verify and sweep for stragglers (AC: 4, 5)
  - [x] 5.1 Run `pnpm typecheck`.
  - [x] 5.2 Run `pnpm test:run`.
  - [x] 5.3 Run `pnpm build`.
  - [x] 5.4 Run targeted searches for stale direct-property usages, for example:
    - `rg "conversationEvidence\\.(assessmentSessionId|assessmentMessageId)"`
    - `rg "assessmentResults\\.assessmentSessionId|portraitRatings\\.assessmentSessionId"`
    - `rg "(message|exchange|publicProfile)\\.sessionId"`
  - [x] 5.5 Review remaining matches and confirm each one is either fixed or an intentional domain/API-level name that must remain.

### Review Findings

- [x] [Review][Patch] Polar sandbox selection still keys off `localhost`, so the new E2E `127.0.0.1` Better Auth URL flips the Polar client to production [packages/infrastructure/src/context/better-auth.ts:168]
- [x] [Review][Defer] `exchanges` table definition missing from `docker/init-db-test.sql` — deferred, pre-existing from prior story rename

## Dev Notes

- **This is a code-cascade story, not a schema story.** Story 45.4 already renamed the SQL columns and Drizzle schema properties. This story updates downstream TypeScript and SQL fixtures that still reference the old property names.
- **The biggest implementation risk is over-renaming.** The renamed fields are Drizzle schema property names and SQL column names. Many domain entities, repository inputs/outputs, HTTP contracts, route params, and UI flows still intentionally use `sessionId` or `assessmentSessionId` as business-level language. Preserve those unless the file is directly modeling the renamed DB property.
- **This is still a mechanical rename.** No new business logic, no new API behavior, no new migrations, and no product copy changes are required.

### Architecture Compliance

- **ADR-39 is the primary source of truth.** This story implements the Story B half of ADR-39's FK cascade: downstream TypeScript/property usage after Story 45.4 completed Story A (DB migration + Drizzle schema update).
- **What must rename:** direct downstream usage of Drizzle properties now named `conversationId` / `messageId`.
- **What must not rename:** `assessment_results` table name, `assessment_result_id` FKs, result-domain APIs that still use `assessmentSessionId`, and business-facing `sessionId` semantics.
- **Hexagonal boundary remains unchanged.** Keep domain repository interfaces stable unless the contract itself is wrong. This story should mostly live in `packages/infrastructure`, test helpers, and seed code.

### Library / Framework Requirements

- **Drizzle ORM:** treat `conversationId` / `messageId` as schema property aliases over already-renamed SQL columns. Update `.values(...)`, `.select({...})`, `.where(eq(...))`, joins, and `onConflictDoUpdate` targets accordingly.
- **Effect / Context.Tag services:** preserve repository interfaces and use-case signatures unless a direct compile failure proves the interface itself is outdated. Prefer mapping DB rows back into existing domain field names.
- **PostgreSQL direct SQL:** fixtures and bootstrap SQL must use the SQL column names introduced in Story 45.4: `conversation_id` and `message_id`.
- **Vitest / Playwright / seed scripts:** keep test intent intact; only rename the DB-facing fields and assertions needed to compile and run on the new schema.

### Previous Story Intelligence

- **Story 45.4 established the scope boundary:** schema-only changes were correct there, and downstream compile failures were intentionally deferred here.
- **Story 45.4 references the exact rename set:** 7 FK property renames only. Do not expand beyond those targets.
- **Story 45.3 surfaced a recurring cleanup pattern:** a mechanical rename can leave orphaned old-path tests, comments, and helper names behind. Use grep aggressively after the main pass.
- **Deferred work already exists in the repo:** `apps/api/tests/integration/assessment.test.ts` still uses old `/api/assessment/*` paths and `assessment_token`; helper export names like `createAssessmentSession` were intentionally deferred. Do not silently absorb unrelated cleanup unless it blocks this story's verification.

### Git Intelligence Summary

- Recent commit history shows the intended blast radius:
  - `5418a7cd` completed Story 45.4 with the migration and schema rename only.
  - `80bb28d2` touched the expected Story 45.5 surfaces: infrastructure repositories, Better Auth context, schema tests, e2e factories/fixtures, seed scripts, Docker test SQL, and e2e config.
- That pattern implies the real work is concentrated in DB-adjacent code and test infrastructure, not frontend feature components or public API design.

### Testing Requirements

- Run `pnpm typecheck` after the repository pass to expose remaining downstream references.
- Run `pnpm test:run` after fixture/seed updates because test helpers and direct SQL bootstrap code are part of the rename surface.
- Run `pnpm build` last to catch any packaging or cross-workspace compile drift.
- Use targeted `rg` sweeps to confirm stale direct-property references are gone while intentional domain/API names remain.

### Anti-Patterns

- Do not rename every `sessionId` string in the repo. Most of them are still correct.
- Do not rename `assessmentSessionId` in result-domain contracts just because `assessment_results.conversation_id` changed under the hood.
- Do not create another migration or edit Story 45.4's migration files.
- Do not turn this into a product-language sweep (`Assessment` → `Conversation`) unless a file is directly broken by the schema/property rename.
- Do not "fix" the deferred `parentSessionId` TS property or the kept-stable `assessment_session_*` indexes in `conversations` as part of this story.

### Project Structure Notes

- Primary write scope:
  - `packages/infrastructure/src/repositories/`
  - `packages/infrastructure/src/context/better-auth.ts`
  - `packages/infrastructure/src/db/__tests__/schema.test.ts`
  - `e2e/`
  - `scripts/seed-completed-assessment.ts`
  - `docker/init-db-test.sql`
  - `compose.e2e.yaml`
- Domain and contract files should usually remain unchanged unless they directly model the DB property names.
- No `project-context.md` file was found in the repo, so this story relies on the planning artifacts, architecture, sprint change proposal, previous story docs, and recent git history.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.5]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-39, "Cascading renames — FK columns", Story B / Drizzle TS property renames]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-07.md` — implementation handoff and scope split]
- [Source: `_bmad-output/implementation-artifacts/45-4-fk-column-migration.md` — schema-only scope boundary and previous story learnings]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` — known non-scope cleanup items and review carryovers]
- [Source: recent git commits `5418a7cd`, `80bb28d2`, `e0cf5fec` — actual file blast radius and rename patterns]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex → Claude Opus 4.6 (review follow-up)

### Debug Log References

- `2026-04-08T01:11+02:00` — Ran `pnpm typecheck` from repo root; all workspace packages passed.
- `2026-04-08T01:12+02:00` — Ran `pnpm test:run` from repo root; full turbo test suite passed.
- `2026-04-08T01:13+02:00` — Ran `pnpm build` from repo root; turbo build passed.
- `2026-04-08T01:13+02:00` — Ran targeted `rg` sweeps for stale FK property and SQL column references; remaining old-name hits were limited to story docs and legacy FK constraint names in `docker/init-db-test.sql`.

### Completion Notes List

- Verified the Story 45.5 FK cascade was already present in the current branch across repositories, Better Auth context, schema tests, fixtures, seeds, and Docker bootstrap SQL.
- Confirmed direct Drizzle-property consumers use `conversationId` / `messageId` while repository/domain-facing mappings still expose `sessionId` / `assessmentSessionId` where required.
- Verified `pnpm typecheck`, `pnpm test:run`, and `pnpm build` all passed without additional code changes in this session.
- Reviewed targeted straggler searches and confirmed remaining old-name matches are documentation references or legacy constraint names, not stale runtime property access.
- Status set to `review`.
- ✅ Resolved review finding [Patch]: Extended Polar sandbox detection in `better-auth.ts` to match both `localhost` and `127.0.0.1`, fixing E2E compose config (`BETTER_AUTH_URL=http://127.0.0.1:4001`) that was bypassing the sandbox check.

### File List

- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/exchange.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/message.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/portrait.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/portrait-rating.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts`
- `packages/infrastructure/src/context/better-auth.ts`
- `packages/infrastructure/src/db/__tests__/schema.test.ts`
- `e2e/factories/assessment.factory.ts`
- `e2e/fixtures/db.ts`
- `e2e/global-setup.ts`
- `scripts/seed-completed-assessment.ts`
- `docker/init-db-test.sql`
- `compose.e2e.yaml`
- `_bmad-output/implementation-artifacts/45-5-fk-column-code-cascade.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- `2026-04-08` — Verified Story 45.5 FK-column code cascade in current branch, completed validation sweep, and advanced story status to `review`.
- `2026-04-08` — Addressed review finding: extended Polar sandbox detection to also match `127.0.0.1` in `betterAuthUrl`, preventing E2E from accidentally using the production Polar client.
