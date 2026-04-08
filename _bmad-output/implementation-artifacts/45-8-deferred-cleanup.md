# Story 45.8: Deferred Cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want Epic 45's deferred cleanup items resolved,
so that conversation semantics, 15-turn runtime behavior, and local test/support tooling are internally consistent.

## Acceptance Criteria

1. **AC1: Parent conversation naming is fully aligned**
   **Given** ADR-39 renamed the SQL column to `parent_conversation_id` but active TypeScript surfaces still expose `parentSessionId`
   **When** this cleanup is implemented
   **Then** active domain, schema, repository, contract, handler, and use-case surfaces that represent the parent conversation link use `parentConversationId`
   **And** no active conversation-parent code path still exposes `parentSessionId`
   **And** identifiers such as `sessionId` that represent the current conversation/session key for routes, search params, or API payloads are not blanket-renamed in this story.

2. **AC2: Remaining legacy conversation index names are brought into ADR-39 compliance**
   **Given** the `conversations` table still uses four legacy `assessment_session_*` index names
   **When** the cleanup is implemented
   **Then** a hand-written Drizzle SQL migration renames those indexes to the ADR-39 target names
   **And** `packages/infrastructure/src/db/drizzle/schema.ts` uses the same new index identifiers
   **And** no unrelated file or symbol renames are bundled into this migration.

3. **AC3: The 15-turn milestone system has a single explicit source of truth**
   **Given** Story 45.6 introduced explicit 15-turn milestone mapping but the frontend still has dual milestone coordinate systems
   **When** this cleanup is implemented
   **Then** the initial assessment milestone mapping is defined once and consumed consistently by both depth-meter ticks and inline milestone rendering
   **And** the 15-turn assessment hits milestones at turns `4`, `8`, and `11`
   **And** non-15 fallback behavior remains explicit and test-covered rather than implicitly drifting from percentage math.

4. **AC4: Final-turn detection is consolidated**
   **Given** `apps/api/src/use-cases/nerin-pipeline.ts` currently contains two divergent final-turn checks
   **When** this cleanup is implemented
   **Then** closing-phase and `isFinalTurn` behavior are derived from one consistent source of truth
   **And** retry/idempotency paths cannot disagree about whether the assessment is on its final turn
   **And** non-final-turn behavior remains unchanged.

5. **AC5: Seed and local test infrastructure match the live schema and 15-turn runtime**
   **Given** the deferred findings include seed/test drift and stale dead-config references
   **When** this cleanup is implemented
   **Then** `scripts/seed-completed-assessment.ts` produces a genuinely completed 15-turn seeded conversation, or an intentionally non-default case with aligned progress semantics and explicit documentation
   **And** `docker/init-db-test.sql` includes the `exchanges` table and current conversation-era schema names
   **And** stale `MESSAGE_THRESHOLD` references/comments are removed from touched compose/test surfaces
   **And** touched comments stop describing pre-ADR-39 or pre-45.6 behavior.

6. **AC6: Verification proves the cleanup is complete**
   **Given** this story resolves deferred findings across backend, frontend, and support tooling
   **When** verification runs
   **Then** targeted grep sweeps confirm the deferred stale names are removed from active code
   **And** `pnpm typecheck`, `pnpm test:run`, and `pnpm build` pass
   **And** if a local database is available during implementation, the new index-rename migration is exercised with the normal migration flow.

## Tasks / Subtasks

- [x] Task 1: Align parent-conversation semantics without reopening the broader file-rename cascade (AC: 1)
  - [x] 1.1 Rename the parent conversation property in active schema/domain surfaces:
    - `packages/domain/src/entities/conversation.entity.ts`
    - `packages/infrastructure/src/db/drizzle/schema.ts`
    - any directly coupled repository types or mocks.
  - [x] 1.2 Cascade the semantic rename through active extension/results surfaces:
    - `packages/contracts/src/http/groups/conversation.ts`
    - `packages/domain/src/repositories/conversation.repository.ts`
    - `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
    - `packages/infrastructure/src/repositories/__mocks__/conversation.drizzle.repository.ts`
    - `apps/api/src/handlers/conversation.ts`
    - `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`
    - `apps/api/src/use-cases/get-results.use-case.ts`
    - `apps/api/src/use-cases/generate-results.use-case.ts`
    - `apps/api/src/use-cases/process-purchase.use-case.ts`
    - `apps/api/src/use-cases/nerin-pipeline.ts`.
  - [x] 1.3 Update targeted tests that assert the parent-link property name.
  - [x] 1.4 Preserve scope: do not rename filenames or route/search-param `sessionId` identifiers here. Story 45.9 owns file rename cascade.

- [x] Task 2: Finish the deferred ADR-39 index cleanup (AC: 2, 6)
  - [x] 2.1 Add a hand-written Drizzle migration that renames the four remaining legacy `assessment_session_*` indexes on `conversations`:
    - `assessment_session_user_id_idx` -> `conversation_user_id_idx`
    - `assessment_session_original_lifetime_unique` -> `conversation_original_lifetime_unique`
    - `assessment_session_token_unique` -> `conversation_token_unique`
    - `assessment_session_parent_session_id_idx` -> `conversation_parent_id_idx`.
  - [x] 2.2 Mirror those names in `packages/infrastructure/src/db/drizzle/schema.ts`.
  - [x] 2.3 Confirm the migration stays cosmetic/schema-consistency only; do not piggyback unrelated schema changes.

- [x] Task 3: Consolidate milestone and final-turn logic around the 15-turn contract (AC: 3, 4)
  - [x] 3.1 Refactor milestone logic so the initial assessment's `4 / 8 / 11` mapping is shared across:
    - `apps/front/src/components/chat/depth-milestones.ts`
    - `apps/front/src/components/chat/DepthMeter.tsx`
    - `apps/front/src/components/TherapistChat.tsx`
    - `apps/front/src/hooks/useTherapistChat.ts`.
  - [x] 3.2 Remove fragile duplicated milestone coordinate assumptions where possible; if two representations remain, make one derive from the other rather than duplicating constants.
  - [x] 3.3 Consolidate `isFinalTurn` / closing-phase logic in `apps/api/src/use-cases/nerin-pipeline.ts` so exchange-count and message-count paths cannot diverge under retry/idempotency scenarios.
  - [x] 3.4 Update or add focused tests for:
    - milestone turn mapping and fallback behavior
    - final-turn detection under normal and retry scenarios.

- [x] Task 4: Repair seed/test support drift and stale comments (AC: 5, 6)
  - [x] 4.1 Update `scripts/seed-completed-assessment.ts` so seeded data matches the live 15-turn assessment semantics, including message count, exchange rows, and progress-facing expectations.
  - [x] 4.2 Add the missing `exchanges` table to `docker/init-db-test.sql` and ensure naming matches the current conversation-era schema.
  - [x] 4.3 Remove stale `MESSAGE_THRESHOLD` references/comments from:
    - `compose.e2e.yaml`
    - `compose.test.yaml`
    - any directly related touched test/spec comments surfaced by grep.
  - [x] 4.4 Sweep touched files for stale pre-rename comments such as `assessment session`, `assessment_exchange`, or outdated turn-count notes when they no longer describe live behavior.

- [x] Task 5: Verify and sweep for residual drift (AC: 1, 2, 3, 4, 5, 6)
  - [x] 5.1 Run targeted sweeps, at minimum:
    - `rg "parentSessionId" apps packages scripts docker`
    - `rg "assessment_session_user_id_idx|assessment_session_original_lifetime_unique|assessment_session_token_unique|assessment_session_parent_session_id_idx" packages drizzle`
    - `rg "MESSAGE_THRESHOLD" apps packages scripts docker`
    - `rg "12 messages|6 user turns|25-message|25-turn" scripts apps packages docker` (review remaining hits individually).
  - [x] 5.2 Run `pnpm typecheck`.
  - [x] 5.3 Run `pnpm test:run`.
  - [x] 5.4 Run `pnpm build`.
  - [x] 5.5 If the migration is exercised locally, confirm the normal migration flow still succeeds after the index rename.

### Review Findings

- [x] [Review][Patch] Stale comment `parent_session_ids` in mock repo [packages/infrastructure/src/repositories/__mocks__/conversation.drizzle.repository.ts:261] — fixed
- [x] [Review][Defer] Concurrent final-turn requests can double-trigger farewell + finalization — deferred, pre-existing
- [x] [Review][Defer] `getTurnState(messageCount, 0)` treats every turn as final when totalTurns=0 — deferred, pre-existing
- [x] [Review][Defer] `dashboard-page.spec.ts` comment says threshold=2 but e2e compose sets 1 — deferred, pre-existing
- [x] [Review][Defer] `docker/init-db-test.sql` FK constraint still named `assessment_session_user_id_user_id_fkey` — deferred, pre-existing

## Dev Notes

- **This is the deferred-cleanup story for Epic 45, not the file-rename story.** Resolve semantic/code-path drift and test/support drift here. Story 45.9 owns filename-level `assessment` -> `conversation` cleanup for use-case and fixture files.
- **The highest-risk mistake is over-renaming.** `parentSessionId` is wrong when it means the parent conversation link, but route params, search params, payload fields, and repo methods using `sessionId` for the current conversation/session key should not be mechanically renamed just because Epic 45 centered on conversation semantics.
- **The second highest-risk mistake is hiding runtime drift behind comments or fake seeds.** The seeded "completed assessment" is used in manual review paths; if it only represents 6 user turns while the app now expects 15, dashboard/results progress becomes misleading.
- **Treat the index cleanup as a real migration task.** ADR-39 explicitly named the target indexes. Keep using hand-written SQL in `drizzle/` and mirror the names in Drizzle schema definitions so the codebase and DB metadata converge.
- **Keep extension functionality dormant.** This story may touch extension-related types because the parent link lives there, but it must not reactivate post-MVP extension UX or purchase flows.

### Architecture Compliance

- **ADR-1 hexagonal boundaries still apply.** Keep the normal flow: domain entities/repositories -> infrastructure schema/repositories -> contracts/handlers/use-cases -> frontend consumers. Do not introduce shortcut aliases just to avoid touching the right layer. [Source: architecture.md - ADR-1, project structure]
- **ADR-39 is the governing cleanup source.** The parent conversation column and conversation-era index names come directly from the conversation-schema decision and its rename tables. [Source: architecture.md - ADR-39]
- **Epic 45 cleanup is explicitly split across stories.** Story 45.8 resolves deferred cleanup items; Story 45.9 handles filename cascade later. Respect that boundary to avoid bundling broad refactors back into a cleanup story. [Source: epic-45-retro-2026-04-08.md - New Stories Created]
- **The UX contract is still a 15-turn assessment.** Milestones should reflect the shipped 15-turn runtime and the UX intent that the depth meter shows progress through the conversation, not a generic percentage abstraction drifting away from the actual turn thresholds. [Source: ux-design-specification.md - depth progress system]

### Library / Framework Requirements

- **Use the pinned workspace stack only.** TypeScript 5.7, Vitest 4, Turbo 2, pnpm 10, Effect, Drizzle, TanStack Router/Query, and React 19 are already established in the repo. No dependency changes are needed. [Source: package.json]
- **Follow the existing migration convention.** Hand-written SQL migrations in `drizzle/` are the established standard for rename work in Epic 45. [Source: Story 45.1, Story 45.4, CLAUDE.md]
- **Preserve frontend test selectors.** If touched frontend components still expose `data-testid`, do not rename/remove those selectors during cleanup. [Source: docs/FRONTEND.md - Testing with Data Attributes]

### File Structure Requirements

- Primary schema/domain surfaces:
  - `packages/domain/src/entities/conversation.entity.ts`
  - `packages/contracts/src/http/groups/conversation.ts`
  - `packages/infrastructure/src/db/drizzle/schema.ts`
  - `drizzle/`
- Primary runtime/repository surfaces:
  - `packages/domain/src/repositories/conversation.repository.ts`
  - `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
  - `packages/infrastructure/src/repositories/__mocks__/conversation.drizzle.repository.ts`
  - `apps/api/src/use-cases/`
  - `apps/api/src/handlers/conversation.ts`
- Primary frontend/runtime calibration surfaces:
  - `apps/front/src/components/chat/`
  - `apps/front/src/components/TherapistChat.tsx`
  - `apps/front/src/hooks/useTherapistChat.ts`
- Primary support/test surfaces:
  - `scripts/seed-completed-assessment.ts`
  - `docker/init-db-test.sql`
  - `compose.e2e.yaml`
  - `compose.test.yaml`
  - focused API/frontend test files surfaced by grep.

### Testing Requirements

- Required verification sequence:
  - `pnpm typecheck`
  - `pnpm test:run`
  - `pnpm build`
- Required focused sweeps:
  - stale parent conversation naming
  - remaining legacy index identifiers
  - stale `MESSAGE_THRESHOLD` references/comments
  - seed/test text that still implies the old 12-message / 25-turn state.
- Prefer focused regression tests over broad speculative rewrites. The cleanup should prove semantic consistency, not reopen unrelated product behavior.

### Previous Story Intelligence

- **Story 45.7 reinforces strict scope discipline.** Epic 45 work has been succeeding by keeping each change narrow, using grep/build sweeps, and avoiding opportunistic redesign. Apply the same discipline here even though the cleanup list touches multiple layers. [Source: 45-7-dead-code-cleanup.md]
- **Story 45.6 is the direct source of several deferred items.** The 15-turn contract is already correct; this story finishes the cleanup around milestone plumbing, final-turn consistency, stale comments, and seed/test drift rather than re-deciding the product contract. [Source: 45-6-assessment-turn-count-25-to-15.md]
- **Story 45.5 already identified test-init drift.** The missing `exchanges` table in `docker/init-db-test.sql` was explicitly deferred there, so this story should treat it as committed cleanup scope rather than a fresh discovery. [Source: 45-5-fk-column-code-cascade.md; deferred-work.md]
- **The retrospective added 45.8 specifically to avoid silent deferred-work accumulation.** Close the listed findings cleanly here instead of pushing them forward again. [Source: epic-45-retro-2026-04-08.md]

### Git Intelligence Summary

- Recent Epic 45 history shows the cleanup should remain verification-driven:
  - `28361ae0` - mark Epic 45 done, add Story 45-7 spec, remove dead DashboardPortraitCard
  - `0868f701` - rename `freeTierMessageThreshold` to `assessmentTurnCount` and calibrate to 15 turns
  - `4eb9c5a3` - finalize Story 45-5, fix e2e teardown and Polar sandbox detection
  - `80bb28d2` - cascade FK column renames to repositories, tests, and seeds.
- That pattern favors a small, concrete write set plus explicit grep/test/build validation over broad cleanup-by-instinct.

### Latest Technical Information

- No external web research is required for this story. The work is an internal consistency cleanup against the repo's current pinned stack, ADRs, and recently completed Epic 45 implementation.

### Project Structure Notes

- The repo still follows the documented monorepo split: `apps/api`, `apps/front`, `packages/domain`, `packages/contracts`, and `packages/infrastructure`. This cleanup crosses those layers but should preserve their boundaries. [Source: architecture.md - project tree]
- No `project-context.md` file was found in the workspace, so this story is grounded in the epics, PRD, architecture, UX spec, retrospective, deferred-work log, prior story artifacts, and current codebase inspection.

### References

- [Source: `_bmad-output/implementation-artifacts/epic-45-retro-2026-04-08.md` - New Stories Created; Next Steps]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md` - deferred findings from Stories 45.2 through 45.6]
- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 1 scope: conversation calibration and cleanup]
- [Source: `_bmad-output/planning-artifacts/prd.md` - 15 exchanges; extension moved to post-MVP subscription]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 15-turn conversation; depth progress system; post-MVP extension scope]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-1 hexagonal architecture; ADR-39 conversation schema and index targets]
- [Source: `packages/domain/src/entities/conversation.entity.ts` - active `parentSessionId` entity surface]
- [Source: `packages/infrastructure/src/db/drizzle/schema.ts` - active `parent_conversation_id` property mapping and legacy index names]
- [Source: `packages/contracts/src/http/groups/conversation.ts` - active extension response contract]
- [Source: `apps/api/src/use-cases/nerin-pipeline.ts` - dual final-turn checks and extension-session handling]
- [Source: `apps/front/src/components/chat/depth-milestones.ts` - explicit 15-turn milestone helper]
- [Source: `scripts/seed-completed-assessment.ts` - seeded conversation shape and count drift]
- [Source: `docker/init-db-test.sql` - missing `exchanges` table]
- [Source: `compose.e2e.yaml`, `compose.test.yaml` - stale `MESSAGE_THRESHOLD` references]
- [Source: `docs/FRONTEND.md` - Testing with Data Attributes]
- [Source: `/Users/vincentlay/Projects/big-ocean/package.json` - pinned scripts and tool versions]
- [Source: `git log --oneline -8` - recent Epic 45 implementation pattern]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `2026-04-08T12:49:14+0200` - Loaded the BMAD create-story workflow, resolved planning and implementation artifact paths, and parsed requested story `45-8`.
- `2026-04-08T12:49:14+0200` - Derived Story 45.8 scope from the Epic 45 retrospective and deferred-work log because `epics.md` still stops at Story 45.7 for Epic 45.
- `2026-04-08T12:49:14+0200` - Mapped each deferred cleanup item to active code surfaces in domain, infrastructure, API, frontend, seed, and docker test-init files.
- `2026-04-08T12:49:14+0200` - Created `_bmad-output/implementation-artifacts/45-8-deferred-cleanup.md` and updated sprint tracking to mark `45-8-deferred-cleanup` as `ready-for-dev`.
- `2026-04-08T13:31:36+0200` - Renamed active parent conversation properties from `parentSessionId` to `parentConversationId` across domain, infrastructure, contract, handler, and use-case surfaces without renaming current-conversation `sessionId` identifiers that remain in scope for Story 45.9.
- `2026-04-08T13:31:36+0200` - Added `drizzle/20260408133000_conversation_index_cleanup/migration.sql`, mirrored the ADR-39-compliant index names in Drizzle schema metadata, and exercised the migration flow against a disposable local Postgres container.
- `2026-04-08T13:31:36+0200` - Consolidated the 15-turn milestone source of truth and final-turn detection, updated focused API/frontend tests, repaired seed and docker test-init schema drift, and removed stale threshold and turn-count comments from touched support surfaces.
- `2026-04-08T13:31:36+0200` - Completed verification with grep sweeps plus `pnpm typecheck`, `pnpm test:run`, and `pnpm build`; only historical and rename-migration files still reference the legacy conversation index names.

### Completion Notes List

- Renamed the active parent conversation link to `parentConversationId` across domain, repository, schema, contract, handler, and use-case surfaces, while intentionally leaving current-conversation `sessionId` route and search-param identifiers unchanged for Story 45.9.
- Added a hand-written ADR-39 cleanup migration that renames the four remaining `assessment_session_*` conversation indexes and mirrored those names in Drizzle schema definitions.
- Centralized the 15-turn milestone mapping in `apps/front/src/components/chat/depth-milestones.ts` so milestone rendering and chat UI consumers share one `4 / 8 / 11` source of truth.
- Consolidated final-turn detection in `apps/api/src/use-cases/nerin-pipeline.ts` around persisted conversation turn state, with drift warnings and focused retry and idempotency coverage.
- Repaired seed and local test support drift by making `scripts/seed-completed-assessment.ts` a real completed 15-turn seed, updating `docker/init-db-test.sql` to the live conversation-era schema including `exchanges`, and removing stale threshold and turn-count comments from touched compose and test surfaces.
- Verification completed with targeted grep sweeps, `pnpm typecheck`, `pnpm test:run`, `pnpm build`, and a disposable Postgres migration exercise via `pnpm --filter api exec tsx src/migrate.ts`.
- Status set to `review`.

### File List

- `_bmad-output/implementation-artifacts/45-8-deferred-cleanup.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/handlers/conversation.ts`
- `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
- `apps/api/src/use-cases/__tests__/send-message-base.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-message-guards.use-case.test.ts`
- `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`
- `apps/api/src/use-cases/generate-results.use-case.ts`
- `apps/api/src/use-cases/get-results.use-case.ts`
- `apps/api/src/use-cases/nerin-pipeline.ts`
- `apps/api/src/use-cases/process-purchase.use-case.ts`
- `apps/api/tests/integration/assessment.test.ts`
- `apps/front/src/components/TherapistChat-core.test.tsx`
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/chat/__tests__/depth-milestones.test.ts`
- `apps/front/src/components/chat/depth-milestones.ts`
- `compose.e2e.yaml`
- `compose.test.yaml`
- `docker/init-db-test.sql`
- `drizzle/20260408133000_conversation_index_cleanup/migration.sql`
- `e2e/global-setup.ts`
- `e2e/specs/conversation-lifecycle.spec.ts`
- `e2e/specs/golden-path.spec.ts`
- `e2e/specs/session-resume.spec.ts`
- `packages/contracts/src/__tests__/http-contracts.test.ts`
- `packages/contracts/src/http/groups/conversation.ts`
- `packages/domain/src/entities/conversation.entity.ts`
- `packages/domain/src/repositories/conversation.repository.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/repositories/__mocks__/conversation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
- `scripts/seed-completed-assessment.ts`

### Change Log

- `2026-04-08` - Created Story 45.8 context from Epic 45 deferred findings and prepared sprint tracking for development handoff.
- `2026-04-08` - Completed Story 45.8 implementation, validation, and BMAD handoff; story advanced to `review`.
