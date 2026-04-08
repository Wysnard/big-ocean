# Story 45.9: File Rename Cascade

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want source files still named after the old `assessment_session` / `assessment_message` entities renamed to conversation-era names,
so that the codebase is fully consistent with the ADR-39 rename completed in Epic 45.

## Acceptance Criteria

1. **AC1: Use-case file renamed from assessment to conversation**
   **Given** `apps/api/src/use-cases/start-assessment.use-case.ts` still carries the pre-ADR-39 entity name
   **When** this rename cascade is implemented
   **Then** the file is renamed to `start-conversation.use-case.ts`
   **And** exported symbols are renamed: `StartAssessmentInput` → `StartConversationInput`, `StartAssessmentOutput` → `StartConversationOutput`, `StartAssessmentMessage` → `StartConversationMessage`, `startAuthenticatedAssessment` → `startAuthenticatedConversation`, `startAnonymousAssessment` → `startAnonymousConversation`, `startAssessment` → `startConversation`
   **And** all consumers of these symbols are updated (barrel export in `use-cases/index.ts`, handler in `conversation.ts`, test files)
   **And** `assessment-result` files are NOT renamed — `assessment_results` is a distinct entity per ADR-39.

2. **AC2: Use-case test and fixture files renamed**
   **Given** test and fixture files still carry the pre-ADR-39 names
   **When** this rename cascade is implemented
   **Then** the following renames are applied:
   - `__tests__/start-assessment-auth.use-case.test.ts` → `start-conversation-auth.use-case.test.ts`
   - `__tests__/global-assessment-limit.test.ts` → `global-conversation-limit.test.ts`
   - `__tests__/__fixtures__/start-assessment.fixtures.ts` → `start-conversation.fixtures.ts`
   - `handlers/__tests__/assessment-auth-context.test.ts` → `conversation-auth-context.test.ts`
   **And** all import paths within those files are updated to match the new filenames
   **And** internal describe/comment text referencing "start-assessment" is updated.

3. **AC3: Integration test file renamed**
   **Given** `apps/api/tests/integration/assessment.test.ts` still carries the pre-ADR-39 name
   **When** this rename cascade is implemented
   **Then** the file is renamed to `conversation.test.ts`
   **And** any internal references to the old filename are updated.

4. **AC4: E2E factory file renamed**
   **Given** `e2e/factories/assessment.factory.ts` still uses the pre-ADR-39 entity name
   **When** this rename cascade is implemented
   **Then** the file is renamed to `conversation.factory.ts`
   **And** all e2e specs and `e2e/global-setup.ts` import from the new path
   **And** internal comments referencing "Assessment Factory" are updated.

5. **AC5: Infrastructure test files renamed**
   **Given** `packages/infrastructure/src/repositories/__tests__/assessment-message-territory.test.ts` and `assessment-message.drizzle.repository.test.ts` still carry the pre-rename `AssessmentMessage` entity name
   **When** this rename cascade is implemented
   **Then** the files are renamed to `message-territory.test.ts` and `message.drizzle.repository.test.ts`
   **And** internal describe blocks and comments are updated to match.

6. **AC6: Seed script renamed and package.json updated**
   **Given** `scripts/seed-completed-assessment.ts` and `pnpm seed:test-assessment` still carry the pre-ADR-39 name
   **When** this rename cascade is implemented
   **Then** the script is renamed to `seed-completed-conversation.ts`
   **And** `package.json` script `seed:test-assessment` is renamed to `seed:test-conversation` pointing to the new file
   **And** any references to the old script name in CLAUDE.md and docs are updated.

7. **AC7: Verification proves the cascade is complete**
   **Given** all file renames and import cascades are applied
   **When** verification runs
   **Then** `pnpm typecheck` passes across all packages
   **And** `pnpm test:run` passes
   **And** `pnpm build` succeeds
   **And** grep sweeps confirm no stale import paths referencing the old filenames remain in active source code.

## Tasks / Subtasks

- [x] Task 1: Rename use-case file and exported symbols (AC: 1)
  - [x] 1.1 Rename `apps/api/src/use-cases/start-assessment.use-case.ts` → `start-conversation.use-case.ts`
  - [x] 1.2 Rename all exported symbols inside the file:
    - `StartAssessmentInput` → `StartConversationInput`
    - `StartAssessmentOutput` → `StartConversationOutput`
    - `StartAssessmentMessage` → `StartConversationMessage`
    - `startAuthenticatedAssessment` → `startAuthenticatedConversation`
    - `startAnonymousAssessment` → `startAnonymousConversation`
    - `startAssessment` → `startConversation`
  - [x] 1.3 Update the barrel export in `apps/api/src/use-cases/index.ts` to import from `./start-conversation.use-case`
  - [x] 1.4 Update `apps/api/src/handlers/conversation.ts` imports and call sites
  - [x] 1.5 Update the comment in `apps/api/src/use-cases/send-message.use-case.ts` line 94 referencing `start-assessment`

- [x] Task 2: Rename use-case test and fixture files (AC: 2)
  - [x] 2.1 Rename `__tests__/__fixtures__/start-assessment.fixtures.ts` → `start-conversation.fixtures.ts`; update internal header comments
  - [x] 2.2 Rename `__tests__/start-assessment-auth.use-case.test.ts` → `start-conversation-auth.use-case.test.ts`; update imports, describe text, and fixture path
  - [x] 2.3 Rename `__tests__/global-assessment-limit.test.ts` → `global-conversation-limit.test.ts`; update imports and fixture path
  - [x] 2.4 Rename `handlers/__tests__/assessment-auth-context.test.ts` → `conversation-auth-context.test.ts`; update internal references

- [x] Task 3: Rename integration test file (AC: 3)
  - [x] 3.1 Rename `apps/api/tests/integration/assessment.test.ts` → `conversation.test.ts`

- [x] Task 4: Rename e2e factory and update e2e imports (AC: 4)
  - [x] 4.1 Rename `e2e/factories/assessment.factory.ts` → `conversation.factory.ts`; update internal "Assessment Factory" header comment
  - [x] 4.2 Update `e2e/global-setup.ts` import path from `./factories/assessment.factory.js` → `./factories/conversation.factory.js`
  - [x] 4.3 Update all e2e spec imports (6 files):
    - `e2e/specs/golden-path.spec.ts`
    - `e2e/specs/session-resume.spec.ts`
    - `e2e/specs/conversation-lifecycle.spec.ts`
    - `e2e/specs/archetype-card.spec.ts`
    - `e2e/specs/public-profile.spec.ts`
    - `e2e/specs/invitation-system.spec.ts`
    - `e2e/specs/relationship-analysis.spec.ts`
    - `e2e/specs/purchase-credits.spec.ts`
    - `e2e/specs/__extracted-api-tests/relationship-analysis-api.spec.ts`
    - `e2e/specs/__extracted-api-tests/purchase-credits-api.spec.ts`

- [x] Task 5: Rename infrastructure test files (AC: 5)
  - [x] 5.1 Rename `packages/infrastructure/src/repositories/__tests__/assessment-message-territory.test.ts` → `message-territory.test.ts`
  - [x] 5.2 Rename `packages/infrastructure/src/repositories/__tests__/assessment-message.drizzle.repository.test.ts` → `message.drizzle.repository.test.ts`

- [x] Task 6: Rename seed script and update references (AC: 6)
  - [x] 6.1 Rename `scripts/seed-completed-assessment.ts` → `scripts/seed-completed-conversation.ts`
  - [x] 6.2 Update root `package.json`: rename script `seed:test-assessment` → `seed:test-conversation`, update path to new filename
  - [x] 6.3 Update `CLAUDE.md` references to the old script name and command:
    - `seed-completed-assessment.ts` → `seed-completed-conversation.ts`
    - `pnpm seed:test-assessment` → `pnpm seed:test-conversation`
  - [x] 6.4 Grep for any other references to the old script name in `docs/`, `compose.*.yaml`, etc. and update

- [x] Task 7: Verify and sweep (AC: 7)
  - [x] 7.1 Run targeted grep sweeps to confirm no stale import paths remain:
    - `rg "start-assessment" apps packages e2e scripts --glob "*.ts" --glob "*.tsx"`
    - `rg "assessment\.factory" e2e --glob "*.ts"`
    - `rg "assessment-message\.(drizzle\.repository\.)?test" packages --glob "*.ts"`
    - `rg "seed-completed-assessment" . --glob "*.ts" --glob "*.json" --glob "*.md" --glob "*.yaml"`
    - `rg "assessment-auth-context" apps --glob "*.ts"`
  - [x] 7.2 Run `pnpm typecheck`
  - [x] 7.3 Run `pnpm test:run`
  - [x] 7.4 Run `pnpm build`
  - [x] 7.5 Clean stale build artifacts: delete `apps/api/dist/` (will regenerate on next build)

## Dev Notes

- **This is a filename-level rename story.** The entity renaming (types, repos, tables) was done in Stories 45.1–45.8. This story renames the remaining source files and cascades the import path changes.
- **DO NOT rename `assessment-result` files.** ADR-39 explicitly states `assessment_results` stays as a distinct entity — only assessment and extension conversations produce scored results. The files `assessment-result.repository.ts`, `assessment-result.drizzle.repository.ts`, and the mock are correctly named.
- **The highest-risk mistake is missing an import path.** Each renamed file is imported by multiple consumers. Use the TypeScript compiler as the primary verification tool — `pnpm typecheck` will catch any broken import. Grep sweeps are the secondary safety net.
- **The second highest-risk mistake is renaming too aggressively.** Only rename files and their direct export symbols. Do not rename route parameters (`sessionId`), API payload fields, or other identifiers that were scoped out of Epic 45.
- **Build artifacts in `apps/api/dist/` will contain stale filenames.** Delete the dist directory after renames; it regenerates on `pnpm build`.
- **E2E factory imports use `.js` extensions** (ESM resolution). When updating import paths in e2e files, change `assessment.factory.js` → `conversation.factory.js` (keep the `.js` extension).
- **Storybook static artifacts** (`apps/front/storybook-static/`) may contain stale assessment references — these are build artifacts, not source files. Ignore them.

### Architecture Compliance

- **ADR-39 governs the rename target names.** The table rename `assessment_sessions` → `conversations` drives the file rename `start-assessment` → `start-conversation`. [Source: architecture.md - ADR-39]
- **ADR-1 hexagonal boundaries still apply.** File renames must respect the layer structure: domain → infrastructure → contracts/handlers → frontend/e2e. [Source: architecture.md - ADR-1]
- **Naming conventions:** Use-case files follow `{action}.use-case.ts` pattern. The action changes from `start-assessment` to `start-conversation`. [Source: CLAUDE.md - Naming conventions]

### Library / Framework Requirements

- No dependency changes. This is a pure rename + import cascade.
- TypeScript 5.7 bundler mode — bare imports without `.js` extensions in app/package code. E2E files use `.js` extensions for ESM.

### File Structure Requirements

**Files to rename (14 total):**

| Current Path | New Path |
|---|---|
| `apps/api/src/use-cases/start-assessment.use-case.ts` | `start-conversation.use-case.ts` |
| `apps/api/src/use-cases/__tests__/__fixtures__/start-assessment.fixtures.ts` | `start-conversation.fixtures.ts` |
| `apps/api/src/use-cases/__tests__/start-assessment-auth.use-case.test.ts` | `start-conversation-auth.use-case.test.ts` |
| `apps/api/src/use-cases/__tests__/global-assessment-limit.test.ts` | `global-conversation-limit.test.ts` |
| `apps/api/src/handlers/__tests__/assessment-auth-context.test.ts` | `conversation-auth-context.test.ts` |
| `apps/api/tests/integration/assessment.test.ts` | `conversation.test.ts` |
| `e2e/factories/assessment.factory.ts` | `conversation.factory.ts` |
| `packages/infrastructure/src/repositories/__tests__/assessment-message-territory.test.ts` | `message-territory.test.ts` |
| `packages/infrastructure/src/repositories/__tests__/assessment-message.drizzle.repository.test.ts` | `message.drizzle.repository.test.ts` |
| `scripts/seed-completed-assessment.ts` | `seed-completed-conversation.ts` |

**Files requiring import path updates (consumers of renamed files):**

| Consumer File | Import Change |
|---|---|
| `apps/api/src/use-cases/index.ts` | `./start-assessment.use-case` → `./start-conversation.use-case` |
| `apps/api/src/handlers/conversation.ts` | symbol renames only (imports via barrel) |
| `apps/api/src/use-cases/send-message.use-case.ts` | comment update only |
| `e2e/global-setup.ts` | `./factories/assessment.factory.js` → `./factories/conversation.factory.js` |
| `e2e/specs/golden-path.spec.ts` | factory import path |
| `e2e/specs/session-resume.spec.ts` | factory import path |
| `e2e/specs/conversation-lifecycle.spec.ts` | factory import path |
| `e2e/specs/archetype-card.spec.ts` | factory import path |
| `e2e/specs/public-profile.spec.ts` | factory import path |
| `e2e/specs/invitation-system.spec.ts` | factory import path |
| `e2e/specs/relationship-analysis.spec.ts` | factory import path |
| `e2e/specs/purchase-credits.spec.ts` | factory import path |
| `e2e/specs/__extracted-api-tests/relationship-analysis-api.spec.ts` | factory import path |
| `e2e/specs/__extracted-api-tests/purchase-credits-api.spec.ts` | factory import path |
| `package.json` | script name + path |
| `CLAUDE.md` | seed script references |

**Files NOT renamed (explicitly out of scope):**
- `packages/domain/src/repositories/assessment-result.repository.ts` — distinct entity per ADR-39
- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` — same
- `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts` — same

### Testing Requirements

- `pnpm typecheck` — catches all broken import paths
- `pnpm test:run` — confirms tests still pass after renames
- `pnpm build` — confirms build output is clean
- Grep sweeps confirm no stale import paths to old filenames remain in source

### Previous Story Intelligence

- **Story 45.8 was the immediate predecessor.** It resolved semantic/code-path drift (parentConversationId, index renames, milestone consolidation, seed/test repair) and explicitly deferred filename renames to this story. The `review` status means 45.8 changes are in the working tree but uncommitted or under review. [Source: 45-8-deferred-cleanup.md]
- **Story 45.8 Task 1.4 explicitly preserved scope:** "do not rename filenames or route/search-param `sessionId` identifiers here. Story 45.9 owns file rename cascade." This confirms our scope boundary.
- **Epic 45 pattern: small concrete write set + grep/test/build verification.** Every story in this epic succeeded by keeping changes narrow and using the compiler as the primary safety net. Apply the same discipline.

### Git Intelligence Summary

- Recent commits show the rename pattern used throughout Epic 45:
  - `28361ae0` - mark Epic 45 done, add Story 45-7 spec, remove dead DashboardPortraitCard
  - `0868f701` - rename freeTierMessageThreshold to assessmentTurnCount (Story 45-6)
  - `80bb28d2` - cascade FK column renames to repositories, tests, and seeds (Story 45-5)
- The pattern is: rename → update imports → grep sweep → typecheck → test → build. Follow the same sequence.

### References

- [Source: `_bmad-output/implementation-artifacts/epic-45-retro-2026-04-08.md` — Story 45-9 definition: file rename cascade]
- [Source: `_bmad-output/implementation-artifacts/45-8-deferred-cleanup.md` — Task 1.4 scope boundary; previous story context]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-39: conversations table rename, assessment_results stays]
- [Source: `CLAUDE.md` — naming conventions, migration rules, testing rules]
- [Source: `apps/api/src/use-cases/index.ts` — barrel export of start-assessment symbols]
- [Source: `apps/api/src/handlers/conversation.ts` — handler consuming startAuthenticatedAssessment / startAnonymousAssessment]
- [Source: `e2e/global-setup.ts` — e2e factory import]
- [Source: `package.json` — seed:test-assessment script definition]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `2026-04-08T14:02:41+0200` - Loaded the BMAD dev-story workflow, read the full sprint status and story context, confirmed there was no review continuation, and moved `45-9-file-rename-cascade` to `in-progress`.
- `2026-04-08T14:07:18+0200` - Renamed `start-assessment.use-case.ts` to `start-conversation.use-case.ts`, renamed the exported use-case symbols to conversation-era names, and updated the barrel export, handler consumer, and rename-owned tests/comments.
- `2026-04-08T14:08:56+0200` - Renamed the use-case fixtures/tests, integration test, e2e factory, infrastructure tests, and seed script; updated import cascades plus the live docs and READMEs that referenced the old filenames and seed command.
- `2026-04-08T14:10:06+0200` - Completed active-source verification with grep sweeps, removed stale `apps/api/dist`, and passed `pnpm typecheck`, `pnpm test:run`, and `pnpm build`; historical `_bmad-output` artifacts intentionally retain older story text.

### Completion Notes List

- Renamed the start-conversation use-case surface from the old assessment-era file and symbol names to `start-conversation.use-case.ts`, `StartConversation*`, `startAuthenticatedConversation`, `startAnonymousConversation`, and `startConversation`, and updated the barrel plus handler call sites.
- Renamed the remaining filename-level assessment artifacts owned by this story: use-case fixture/test files, the conversation auth-context handler test, the integration test, the e2e factory, the infrastructure repository tests, and the completed-conversation seed script.
- Updated the affected comments, describe text, log strings, import paths, and live documentation references so active source and current docs align with the new filenames and `pnpm seed:test-conversation`.
- Verification completed with targeted grep sweeps for active source/docs, `pnpm typecheck`, `pnpm test:run`, `pnpm build`, and stale `apps/api/dist` cleanup before the rebuild.
- Status set to `review`.

### File List

- `_bmad-output/implementation-artifacts/45-9-file-rename-cascade.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `CLAUDE.md`
- `apps/api/src/handlers/__tests__/conversation-auth-context.test.ts`
- `apps/api/src/handlers/conversation.ts`
- `apps/api/src/use-cases/__tests__/__fixtures__/send-message.fixtures.ts`
- `apps/api/src/use-cases/__tests__/__fixtures__/start-conversation.fixtures.ts`
- `apps/api/src/use-cases/__tests__/global-conversation-limit.test.ts`
- `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
- `apps/api/src/use-cases/__tests__/start-conversation-auth.use-case.test.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/use-cases/send-message.use-case.ts`
- `apps/api/src/use-cases/start-conversation.use-case.ts`
- `apps/api/tests/integration/README.md`
- `apps/api/tests/integration/conversation.test.ts`
- `apps/front/src/hooks/__fixtures__/use-therapist-chat.fixtures.ts`
- `docs/COMMANDS.md`
- `docs/E2E-TESTING.md`
- `docs/index.md`
- `docs/source-tree-analysis.md`
- `e2e/factories/conversation.factory.ts`
- `e2e/global-setup.ts`
- `e2e/specs/__extracted-api-tests/purchase-credits-api.spec.ts`
- `e2e/specs/__extracted-api-tests/relationship-analysis-api.spec.ts`
- `e2e/specs/archetype-card.spec.ts`
- `e2e/specs/golden-path.spec.ts`
- `e2e/specs/invitation-system.spec.ts`
- `e2e/specs/public-profile.spec.ts`
- `e2e/specs/purchase-credits.spec.ts`
- `e2e/specs/relationship-analysis.spec.ts`
- `index.md`
- `package.json`
- `packages/infrastructure/src/repositories/__tests__/message-territory.test.ts`
- `packages/infrastructure/src/repositories/__tests__/message.drizzle.repository.test.ts`
- `scripts/README.md`
- `scripts/seed-completed-conversation.ts`

### Review Findings

- [x] [Review][Patch] `compose.yaml` still references defunct `seed:test-assessment` — Docker seeder will fail [compose.yaml:135] — FIXED
- [x] [Review][Patch] Integration test imports non-existent `StartAssessmentResponseSchema` — typecheck/test will fail [apps/api/tests/integration/conversation.test.ts:19,77,99] — FIXED
- [x] [Review][Patch] Seed script log messages still say "assessment" [scripts/seed-completed-conversation.ts] — FIXED
- [x] [Review][Patch] `scripts/dev.sh` echo still says "test assessment" [scripts/dev.sh:67] — FIXED
- [x] [Review][Patch] `CLAUDE.md` inline comment still says "test assessment" [CLAUDE.md:70] — FIXED
- [x] [Review][Patch] Fixture variable names `mockAssessmentSessionRepo`/`mockAssessmentMessageRepo` renamed to `mockConversationRepo`/`mockMessageRepo` — FIXED
- [x] [Review][Patch] Error class `AssessmentAlreadyExists` → `ConversationAlreadyExists` across domain/contracts/API/frontend — FIXED

### Change Log

- `2026-04-08` - Started Story 45.9 implementation and moved sprint tracking to `in-progress`.
- `2026-04-08` - Completed the file rename cascade, verification, and live documentation updates; story advanced to `review`.
