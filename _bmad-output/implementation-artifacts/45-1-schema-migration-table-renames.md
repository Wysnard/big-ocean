# Story 45-1: Schema Migration — Table Renames

**Status:** review
**Epic:** Epic 45 — Conversation Calibration — 15-Turn Assessment
**Source:** `_bmad-output/planning-artifacts/epics.md` — Story 1.1
**Created:** 2026-04-07T18:52

## Story

As a **developer**,
I want the database tables to reflect multi-conversation semantics,
so that the schema is ready for future conversation types without a painful post-launch migration.

## Acceptance Criteria

### AC-1: Rename the Actual Live Assessment Tables

**Given** the current live schema uses singular table names `assessment_session`, `assessment_message`, and `assessment_exchange`
**When** the migration runs
**Then** those tables are renamed to `conversations`, `messages`, and `exchanges`
**And** Drizzle schema definitions point to the renamed physical tables
**And** no runnable code or tests still depend on raw SQL against the old table names outside historical migration files

### AC-2: Rename the Parent Conversation Column

**Given** the current live schema has `assessment_session.parent_session_id`
**When** the migration runs
**Then** that column is renamed to `parent_conversation_id`
**And** the Drizzle schema maps it correctly
**And** the schema aligns with ADR-39's parent-conversation semantics

### AC-3: Add Multi-Type Conversation Fields

**Given** ADR-39 requires future conversation types
**When** the migration runs
**Then** `conversations` gains a `conversation_type` enum column with values `assessment`, `extension`, `coach`, `journal`, and `career`
**And** `conversation_type` defaults to `assessment`
**And** `conversations` gains a nullable `metadata` JSONB column
**And** pre-existing rows read as `conversation_type = 'assessment'`

### AC-4: Preserve Existing Downstream Tables While Updating Their FK Targets

**Given** downstream tables already reference the assessment tables
**When** the rename completes
**Then** the following relationships still work against the renamed tables:
- `messages.session_id` → `conversations.id`
- `messages.exchange_id` → `exchanges.id`
- `exchanges.session_id` → `conversations.id`
- `conversation_evidence.assessment_session_id` → `conversations.id`
- `conversation_evidence.assessment_message_id` → `messages.id`
- `conversation_evidence.exchange_id` → `exchanges.id`
- `assessment_results.assessment_session_id` → `conversations.id`
- `public_profile.session_id` → `conversations.id`
- `portrait_ratings.assessment_session_id` → `conversations.id`
**And** `assessment_results` keeps its current table name
**And** foreign key column names like `assessment_session_id` and `assessment_message_id` stay unchanged in this story unless a concrete migration blocker forces otherwise

### AC-5: Use a Hand-Written SQL Migration in the Repo's Drizzle Format

**Given** this repo uses timestamped SQL migration folders under `drizzle/`
**When** the migration is added
**Then** it is a hand-written `migration.sql` in a new timestamped folder
**And** it is compatible with the repo's custom runner in `apps/api/src/migrate.ts`
**And** it follows existing repo style instead of relying on Drizzle rename inference alone

### AC-6: Keep Story 45-1 Scoped to Database and Schema Work

**Given** Story 45-2 handles repository/domain renames and Story 45-3 handles handlers/contracts/frontend renames
**When** 45-1 is implemented
**Then** repository, use-case, handler, contract, and frontend naming stays stable where possible
**And** compile/test fixes in this story are limited to migration, Drizzle schema, schema tests, and direct raw SQL callers
**And** no avoidable scope creep is pulled forward from 45-2 or 45-3

## Tasks / Subtasks

### Task 1: Confirm the Real Live Schema and Blast Radius (AC-1, AC-4)

- [x] Search the live codebase for singular table names, raw SQL, and `parent_session_id`
- [x] Treat the planning docs' plural table names as intent only; implement against the real live schema names in code and SQL
- [x] Enumerate all FK dependents and direct raw SQL callers before editing anything

### Task 2: Write the Manual SQL Migration (AC-1, AC-2, AC-3, AC-4, AC-5)

- [x] Create a new timestamped migration folder under `drizzle/`
- [x] Rename `assessment_session` to `conversations`
- [x] Rename `assessment_message` to `messages`
- [x] Rename `assessment_exchange` to `exchanges`
- [x] Rename `parent_session_id` to `parent_conversation_id`
- [x] Create `conversation_type_enum` with the exact ADR-39 values
- [x] Add `conversation_type` with default `assessment`
- [x] Add nullable `metadata` JSONB
- [x] Backfill or otherwise guarantee existing rows resolve to `conversation_type = 'assessment'`
- [x] Add the nullable self-reference on `parent_conversation_id` if needed to align the live schema with ADR-39
- [x] Avoid touching `assessment_results`, `conversation_evidence`, `public_profile`, and `portrait_ratings` table names in this story

### Task 3: Update the Drizzle Schema Without Pulling in Story 45-2 (AC-1, AC-2, AC-3, AC-4, AC-6)

- [x] Add and export `conversationTypeEnum` in `packages/infrastructure/src/db/drizzle/schema.ts`
- [x] Point the existing `assessmentSession` table object at `"conversations"`
- [x] Point the existing `assessmentMessage` table object at `"messages"`
- [x] Point the existing `assessmentExchange` table object at `"exchanges"`
- [x] Map the existing TypeScript property `parentSessionId` to SQL column `"parent_conversation_id"` in this story to keep current call sites stable
- [x] Add `conversationType` and `metadata` fields to the `assessmentSession` table object
- [x] Update references and `defineRelations(...)` to the renamed physical tables via the same exported aliases
- [x] Do not rename exported aliases, repository tags, or file names yet unless a compile blocker leaves no smaller option

### Task 4: Update Schema-Level Tests and Direct Raw SQL Callers (AC-1, AC-5, AC-6)

- [x] Update `packages/infrastructure/src/db/__tests__/schema.test.ts` to cover `conversationType` and `metadata`
- [x] Update `apps/api/tests/integration/assessment.test.ts` raw SQL from `assessment_session` to `conversations`
- [x] Search for remaining non-historical raw SQL references to old table names and update only the ones that execute at runtime or in tests
- [x] Leave historical migration files and planning artifacts unchanged

### Task 5: Verify the Story Boundary and Migration Behavior (AC-5, AC-6)

- [x] Run `pnpm db:migrate`
- [x] Run `pnpm typecheck`
- [x] Run `pnpm test:run`
- [x] If the Docker test stack is available, run `pnpm test:integration`
- [x] Run a final grep to confirm old table names remain only in historical migrations, docs, or intentionally deferred code names

## Dev Notes

### Critical Guardrail: The Planning Docs Use the Wrong Current Table Names

- The planning artifacts and ADR examples use plural names like `assessment_sessions`, `assessment_messages`, and `assessment_exchanges`.
- The live codebase and live SQL migration history use singular names: `assessment_session`, `assessment_message`, and `assessment_exchange`.
- Story 45-1 must rename the real live singular tables. If the dev agent follows the plural names literally, the migration will be wrong.

### Scope Boundary for Story 45-1

- This story is the database and Drizzle schema boundary only.
- Keep repository tags, repository file names, use-case names, handler names, contract names, and frontend names stable where possible.
- Story 45-2 owns repo/domain rename cascade.
- Story 45-3 owns handler/contract/frontend rename cascade.
- The preferred 45-1 pattern is: rename the physical table and column names now, but keep exported TypeScript aliases stable until the later stories.
- Prefer leaving existing index and constraint names stable in 45-1 unless Drizzle/schema parity forces a rename. The product-risky part is the table/column rename, not cosmetic index label churn.

### Current Live Files Most Likely to Change

- `drizzle/<new_timestamp>_conversation_table_renames/migration.sql`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/db/__tests__/schema.test.ts`
- `apps/api/tests/integration/assessment.test.ts`

### Files That Should Probably Not Change in 45-1

- `packages/domain/src/repositories/*.repository.ts`
- `packages/infrastructure/src/repositories/*.drizzle.repository.ts`
- `apps/api/src/use-cases/*.use-case.ts`
- `apps/api/src/handlers/assessment.ts`
- `packages/contracts/src/http/groups/assessment.ts`
- `apps/front/src/**/*`

Those files still use `AssessmentSessionRepository`, `AssessmentMessageRepository`, `AssessmentExchangeRepository`, and `freeTierMessageThreshold`. That rename cascade belongs to Stories 45-2 through 45-4 unless a tiny bridge fix is required to keep 45-1 compiling.

### Live Dependency Map to Preserve

- `conversation_evidence.assessment_session_id` currently references the session table via Drizzle and must continue to work after the table rename.
- `conversation_evidence.assessment_message_id` must continue to reference the renamed `messages` table.
- `assessment_results.assessment_session_id` must continue to reference the renamed `conversations` table while the table itself stays named `assessment_results`.
- `public_profile.session_id` and `portrait_ratings.assessment_session_id` must still resolve against the renamed `conversations` table.
- Existing session columns such as `session_token`, `status`, `finalization_progress`, `message_count`, and email timestamp fields must survive untouched.
- `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` currently decodes full DB rows with `AssessmentSessionEntitySchema`. Verify that the new `conversationType` and `metadata` columns do not break decoding. If they do, fix the row selection or entity schema in the smallest possible way without pulling Story 45-2 forward.

### Migration Format and Runtime Constraints

- The repo uses folder-based SQL migrations in `drizzle/`.
- `apps/api/src/migrate.ts` executes each `migration.sql` file and records hashes in `drizzle.__drizzle_migrations`.
- The custom runner supports `--> statement-breakpoint`, but this migration does not require it unless the implementation chooses to split statements deliberately.
- Because ADR-39 explicitly says this change should happen pre-launch with zero production data, table rename locking risk is acceptable here.

### Architecture Compliance

- ADR-39 says:
  - Rename `assessment_session` semantics to `conversations`
  - Rename `assessment_message` semantics to `messages`
  - Rename `assessment_exchange` semantics to `exchanges`
  - Rename `parent_session_id` to `parent_conversation_id`
  - Add `conversation_type`
  - Add `metadata`
- `assessment_results` stays unchanged by design.
- `metadata` is typed at the domain layer later; in this story it is only a nullable JSONB column.

### Testing Requirements

- Minimum required checks for this story:
  - migration applies cleanly
  - schema test reflects the new enum/columns
  - integration test raw SQL no longer points to the old table name
  - root typecheck stays green
- Regression surface after the rename:
  - start/resume assessment
  - send message
  - finalization/results lookup
  - public profile reads
  - portrait rating reads/writes
  - relationship flows that resolve sessions

### Previous Story and Recent Git Intelligence

- Epic 44 just completed the Director model cleanup. Do not reintroduce deleted pacing/governor concepts into exchange schema or tests.
- Seed and eval scripts still import `dbSchema.assessmentSession`, `dbSchema.assessmentMessage`, and `dbSchema.assessmentExchange`. Keeping those export aliases stable in 45-1 minimizes unnecessary churn before Story 45-2.
- Recent history:
  - `25f567d1` completed the Director model rewrite.
  - `c934cb70` consolidated architecture docs, so `architecture.md` is the canonical source for ADR-39.

### Latest Technical Information

- Official Drizzle docs describe the TypeScript schema as the source of truth for migrations and note that `drizzle-kit generate` may prompt for renames when diffs are ambiguous. Custom SQL migrations are explicitly supported when you want precise control over DDL. That is the safer approach for this story because the repo already uses manual `migration.sql` files. [Source: Drizzle docs, migrations overview and custom migrations]
- Official PostgreSQL 18 docs support `ALTER TABLE ... RENAME TO` and `ALTER TABLE ... RENAME COLUMN ... TO ...`. PostgreSQL also notes that `ALTER TABLE` acquires an `ACCESS EXCLUSIVE` lock unless documented otherwise, which reinforces why ADR-39 schedules this change pre-launch rather than after live traffic exists. [Source: PostgreSQL 18 `ALTER TABLE` docs]

### Project Structure Notes

- No `project-context.md` file was found in the repo.
- The architecture document still describes the established file naming convention as `assessment-message.repository.ts` and `assessment-message.drizzle.repository.ts`. That is another reason to defer file/class rename churn until Story 45-2.
- Historical migration folders in `drizzle/` are append-only source history. Do not edit prior migrations.

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.1
- `_bmad-output/planning-artifacts/architecture.md` — ADR-39: Conversations Table
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-07.md` — Epic 1 note and story readiness
- `packages/infrastructure/src/db/drizzle/schema.ts` — live schema and FK/relations blast radius
- `packages/infrastructure/src/db/__tests__/schema.test.ts` — schema assertions to update
- `apps/api/tests/integration/assessment.test.ts` — direct SQL caller that will break after rename
- `apps/api/src/migrate.ts` — custom migration runner behavior
- `package.json` — `db:migrate`, `typecheck`, `test:run`, `test:integration`
- `drizzle.config.ts` — Drizzle schema location and migration output folder

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Story context generated from epic, architecture, readiness, schema, repo, test, and migration artifacts.

### Completion Notes List

- Planning docs describe plural assessment table names, but the live codebase uses singular names.
- This story deliberately preserves exported TypeScript aliases to keep Story 45-1 scoped.
- No `project-context.md` was present.
- Index and constraint names intentionally kept stable per story scope boundary.
- `conversationType` column uses `NOT NULL DEFAULT 'assessment'` — existing rows automatically resolve to `assessment`.
- `AssessmentSessionEntitySchema` (domain layer) strips unknown fields, so new columns don't break decoding.
- `docker/init-db-test.sql` table names updated to match new schema; file remains outdated in other respects (pre-existing drift).
- `e2e/fixtures/db.ts` and `e2e/factories/assessment.factory.ts` raw SQL updated from old to new table names.
- `pnpm db:migrate` passed against the Dockerized test Postgres instance using the repo's custom migration runner.
- `pnpm test:integration` passed after aligning the integration helper with the current `finalizing` → lazy-finalization results flow.
- The integration test now derives valid trait level letters from `TRAIT_LETTER_MAP` instead of duplicating a stale hard-coded set.

### File List

- `drizzle/20260407200000_conversation_table_renames/migration.sql` (new)
- `packages/infrastructure/src/db/drizzle/schema.ts` (modified)
- `packages/infrastructure/src/db/__tests__/schema.test.ts` (modified)
- `apps/api/tests/integration/assessment.test.ts` (modified)
- `docker/init-db-test.sql` (modified)
- `e2e/fixtures/db.ts` (modified)
- `e2e/factories/assessment.factory.ts` (modified)
- `_bmad-output/implementation-artifacts/45-1-schema-migration-table-renames.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

### Change Log

- 2026-04-07: Story 45-1 implemented — table renames, column rename, new enum/columns, tests/raw SQL updated
- 2026-04-07: Validation completed — `pnpm db:migrate` and `pnpm test:integration` passed; integration results assertions aligned with current domain semantics
