# Story 36-3: Extended Results & Portrait Versioning

**Status:** review

## Story

As a user,
I want updated personality results after my extended conversation,
So that my deeper exploration produces a more refined understanding of who I am.

**Epic:** 7 — Conversation Extension
**Depends on:** Story 36-2 (Extended Conversation Pipeline Initialization)

## Acceptance Criteria

1. **Given** the extension conversation reaches exchange 25, **When** the closing exchange completes and `generateResults` runs, **Then** new assessment results are generated from combined evidence across ALL the user's sessions (original + extension) using `findByUserId` — not just the extension session's evidence.

2. **Given** new assessment results exist for the extension session, **When** the user views their results page, **Then** the new results are displayed as primary, and the prior portrait is classified as "previous version" via result_id comparison.

3. **Given** the user has new results from an extension, **When** they view the portrait section, **Then** the portrait shows the "Unlock your portrait" CTA (repurchase required for the new session's portrait).

4. **Given** new assessment results exist for either user in a relationship analysis pair, **When** the relationship analysis is fetched, **Then** it is classified as "previous version" using the same `isLatestVersion` utility.

5. **Given** the user views their session history, **When** previous versions exist, **Then** prior results and portraits are accessible as "previous version" entries with clear labeling.

6. **Given** the `generateResults` use-case runs for an extension session, **When** evidence is fetched for scoring, **Then** ALL evidence from ALL the user's sessions is used via `findByUserId` (consistent with Story 36-2's user-level query pattern), with fallback to session-scoped query for anonymous users.

## Tasks

### Task 1: Add `getLatestByUserId` to AssessmentResultRepository

- [x] 1a: Add `getLatestByUserId(userId: string)` method to `AssessmentResultRepository` interface in `packages/domain/src/repositories/assessment-result.repository.ts`. Returns the most recent completed `AssessmentResultRecord` for the user, or null.
- [x] 1b: Implement in `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` — JOIN `assessment_results` with `assessment_session` on `assessmentSessionId`, filter by `assessment_session.userId` and `stage = 'completed'`, ORDER BY `createdAt DESC`, LIMIT 1.
- [x] 1c: Add to mock in `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts`.
- [x] 1d: Write unit test verifying `getLatestByUserId` returns the most recent completed result.

### Task 2: Create `isLatestVersion` domain utility

- [x] 2a: Create `packages/domain/src/utils/version-detection.ts` with `isLatestVersion(resultId: string, latestResultId: string): boolean` — returns true if resultId equals latestResultId. Export from domain index.
- [x] 2b: Write unit tests for `isLatestVersion`.

### Task 3: Modify `generateResults` to use combined evidence for extension sessions

- [x] 3a: Update `generateResults` use-case to check if the session has a parent (is an extension session) by reading the session's `parentSessionId` field. If it has a parent AND the session has an authenticated `userId`, fetch evidence via `findByUserId(userId)` instead of `findBySession(sessionId)`. Fall back to session-scoped query for anonymous users.
- [x] 3b: Write unit test: extension session with authenticated user uses `findByUserId` for combined evidence scoring.
- [x] 3c: Write unit test: non-extension session continues to use `findBySession`.
- [x] 3d: Write unit test: extension session with anonymous user (edge case) falls back to `findBySession`.

### Task 4: Add version info to `getResults` response

- [x] 4a: Add `isLatestVersion: boolean` field to `GetResultsOutput` and `GetResultsResponseSchema` in contracts.
- [x] 4b: In `getResults` use-case, after fetching results, call `getLatestByUserId` to determine if this result is the latest. Set `isLatestVersion = true` if no authenticated user or if this result's id matches the latest.
- [x] 4c: Write unit test: results for the latest session return `isLatestVersion: true`.
- [x] 4d: Write unit test: results for a prior session return `isLatestVersion: false` when a newer completed session exists.

### Task 5: Add version detection to relationship analysis

- [x] 5a: Add `isLatestVersion: boolean` field to `GetRelationshipAnalysisOutput` and the relationship analysis response schema in contracts.
- [x] 5b: In `getRelationshipAnalysis` use-case, after fetching the analysis, call `getLatestByUserId` for both user A and user B. If either user has a newer completed result than the one linked to the analysis, mark `isLatestVersion = false`.
- [x] 5c: Write unit test: analysis linked to latest results for both users returns `isLatestVersion: true`.
- [x] 5d: Write unit test: analysis returns `isLatestVersion: false` when one user has newer results.

### Task 6: Add version info to portrait status

- [x] 6a: Add `isLatestVersion: boolean` field to `GetPortraitStatusOutput` and the portrait status response schema in contracts.
- [x] 6b: In `getPortraitStatus` use-case, determine if the portrait's associated result is the latest for the user.
- [x] 6c: Write unit test: portrait for latest result returns `isLatestVersion: true`.
- [x] 6d: Write unit test: portrait for prior result returns `isLatestVersion: false`.

### Task 7: Update `lazyFinalize` to use combined evidence

- [x] 7a: Update the `lazyFinalize` function in `getResults` use-case to use `findByUserId` for extension sessions (same pattern as Task 3).
- [x] 7b: Write unit test verifying lazy finalization uses combined evidence for extension sessions.

## Dev Notes

- **Derive-at-read versioning:** Version classification is NOT stored — it's computed at read time by comparing the result_id against the user's latest result. This follows the derive-at-read principle from CLAUDE.md.
- **Combined evidence scoring:** Story 36-2 already established the user-level query pattern (`findByUserId`) for messages, evidence, and exchanges in the pipeline. This story extends that pattern to the `generateResults` use-case so final scores reflect ALL evidence across all sessions.
- **Portrait repurchase:** When an extension session generates new results, the user must purchase a new portrait for those results. The prior portrait remains viewable as "previous version."
- **`isLatestVersion` utility:** Intentionally simple (string equality on result IDs). The caller fetches the "latest" result via `getLatestByUserId` and compares. This same utility is used for portraits and relationship analyses.
- **No schema migration needed:** No new DB columns required. Version detection is purely computed at read time from existing data relationships (assessment_results linked to assessment_sessions).

## File List

- `packages/domain/src/repositories/assessment-result.repository.ts` (modified — add `getLatestByUserId`)
- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` (modified — implement `getLatestByUserId`)
- `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts` (modified — add mock)
- `packages/domain/src/utils/version-detection.ts` (new — `isLatestVersion` utility)
- `packages/domain/src/utils/__tests__/version-detection.test.ts` (new — tests)
- `packages/domain/src/index.ts` (modified — export `isLatestVersion`)
- `apps/api/src/use-cases/generate-results.use-case.ts` (modified — combined evidence for extensions)
- `apps/api/src/use-cases/get-results.use-case.ts` (modified — add `isLatestVersion`, update lazy finalize)
- `apps/api/src/use-cases/get-portrait-status.use-case.ts` (modified — add `isLatestVersion`)
- `apps/api/src/use-cases/get-relationship-analysis.use-case.ts` (modified — add `isLatestVersion`)
- `packages/contracts/src/http/groups/assessment.ts` (modified — add `isLatestVersion` to response schemas)
- Various contract/schema files for relationship and portrait responses
