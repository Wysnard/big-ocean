# Story 18-5: Delete FinAnalyzer Infrastructure

**Status:** ready-for-dev
**Epic:** 18 (Pipeline Epic 3 — Smarter Evidence, Better Scores)
**Depends on:** 18-4 (Rewrite Finalization Pipeline with Staged Idempotency)
**Blocks:** 5.1 (Evidence Annotations API Endpoint)

## User Story

As a developer maintaining the codebase,
I want the deprecated FinAnalyzer and all its infrastructure removed,
So that there is a single evidence source (ConversAnalyzer) and no dead code confuses future work.

## Acceptance Criteria

**Given** Story 3.4 (18-4) has migrated `generate-results` away from `finalization_evidence`
**When** the following files are deleted
**Then** the build succeeds and no production code references them:

### Files to Delete

1. `packages/infrastructure/src/repositories/finanalyzer.anthropic.repository.ts` — FinAnalyzer Anthropic implementation
2. `packages/domain/src/repositories/finanalyzer.repository.ts` — FinAnalyzer interface
3. `packages/infrastructure/src/repositories/finanalyzer.mock.repository.ts` — FinAnalyzer mock implementation
4. `packages/infrastructure/src/repositories/__mocks__/finanalyzer.anthropic.repository.ts` — FinAnalyzer test mock
5. `packages/infrastructure/src/repositories/finalization-evidence.drizzle.repository.ts` — Finalization evidence Drizzle implementation
6. `packages/domain/src/repositories/finalization-evidence.repository.ts` — Finalization evidence interface
7. `packages/infrastructure/src/repositories/__mocks__/finalization-evidence.drizzle.repository.ts` — Finalization evidence test mock
8. `packages/domain/src/utils/highlight.ts` — Highlight position computation (FinAnalyzer-era utility)
9. `packages/domain/src/utils/__tests__/highlight.test.ts` — Highlight tests

### Barrel Export Removals

- `packages/domain/src/index.ts` — remove exports for `FinalizationEvidenceRepository`, `FinanalyzerRepository`, `computeHighlightPositions`
- `packages/infrastructure/src/index.ts` — remove exports for `FinalizationEvidenceDrizzleRepositoryLive`, `FinanalyzerAnthropicRepositoryLive`, `FinanalyzerMockRepositoryLive`

### Config Removals

- `packages/domain/src/config/app-config.ts` — remove `finanalyzerModelId` from `AppConfigService`
- `packages/infrastructure/src/config/app-config.live.ts` — remove `finanalyzerModelId` config loading
- `packages/domain/src/config/__mocks__/app-config.ts` — remove `finanalyzerModelId` from mock config
- `packages/infrastructure/src/utils/test/app-config.testing.ts` — remove `finanalyzerModelId` from test config

### Layer Wiring Removals

- `apps/api/src/index.ts` — remove `FinanalyzerAnthropicRepositoryLive`, `FinanalyzerMockRepositoryLive`, `FinalizationEvidenceDrizzleRepositoryLive` imports and `FinanalyzerLayer` selection block

### DB Schema Removals

- `packages/infrastructure/src/db/drizzle/schema.ts` — remove `finalizationEvidence` table definition and all relation references

### Use-Case Migrations (prerequisite for deletion)

- `apps/api/src/use-cases/generate-full-portrait.use-case.ts` — migrate from `FinalizationEvidenceRepository` to `ConversationEvidenceRepository`
- `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` — migrate from `FinalizationEvidenceRepository` to `ConversationEvidenceRepository`
- Update corresponding test files to use `ConversationEvidenceRepository` mocks

### Additional Cleanup

- `scripts/seed-completed-assessment.ts` — remove finanalyzer/finalization_evidence references
- `e2e/fixtures/db.ts` — remove finalization_evidence references
- `e2e/factories/assessment.factory.ts` — remove finalization_evidence references
- `docker/init-db-test.sql` — remove finalization_evidence table
- `packages/domain/src/constants/validation.ts` — remove finanalyzer-related constants if any
- `packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts` — remove finalization_evidence references if any
- `packages/infrastructure/src/repositories/portrait-prompt.utils.ts` — remove finalization_evidence references if any

## Tasks

### Task 1: Migrate Portrait Use-Cases to Conversation Evidence
- 1.1: Update `generate-full-portrait.use-case.ts` to use `ConversationEvidenceRepository` instead of `FinalizationEvidenceRepository`
- 1.2: Update `generate-relationship-analysis.use-case.ts` to use `ConversationEvidenceRepository` instead of `FinalizationEvidenceRepository`
- 1.3: Update test files for both use-cases to mock `ConversationEvidenceRepository`
- 1.4: Update any other test files that reference `FinalizationEvidenceRepository` (accept-invitation, refuse-invitation, session-linking tests)

### Task 2: Delete FinAnalyzer Files
- 2.1: Delete FinAnalyzer repository interface, implementations, and mocks (5 files)
- 2.2: Delete highlight.ts and its tests (2 files)

### Task 3: Delete Finalization Evidence Files
- 3.1: Delete finalization evidence repository interface, implementation, and mock (3 files)

### Task 4: Remove Config References
- 4.1: Remove `finanalyzerModelId` from AppConfigService interface
- 4.2: Remove `finanalyzerModelId` from live config, mock config, and test config

### Task 5: Remove Barrel Exports
- 5.1: Clean domain/src/index.ts exports
- 5.2: Clean infrastructure/src/index.ts exports

### Task 6: Remove Layer Wiring
- 6.1: Remove FinAnalyzer and FinalizationEvidence layers from apps/api/src/index.ts

### Task 7: Remove DB Schema References
- 7.1: Remove finalizationEvidence table and relations from schema.ts
- 7.2: Generate migration for schema change

### Task 8: Additional Cleanup
- 8.1: Clean up seed scripts, e2e fixtures, Docker init SQL
- 8.2: Clean up any remaining references in infrastructure repositories

### Task 9: Verify Build
- 9.1: Run `pnpm turbo typecheck` — must pass
- 9.2: Run `pnpm test:run` — must pass
