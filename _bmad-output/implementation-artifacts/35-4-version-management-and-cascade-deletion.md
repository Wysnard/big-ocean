# Story 35-4: Version Management & Cascade Deletion

**Status:** ready-for-dev
**Epic:** 6 — Relationship Analysis — Generation & Display
**Story:** 6.4

## User Story

As a user,
I want to see all my relationship analyses with the newest marked as primary,
So that I can track how my relationships evolve over time.

## Acceptance Criteria

### AC1: Derive-at-read version detection for relationship analyses list
**Given** a user has multiple relationship analyses
**When** the analyses are fetched via a new "list my analyses" endpoint
**Then** version detection is derive-at-read: if newer assessment results exist for either user since the analysis was generated, it is classified as "previous version" (FR35)
**And** the newest analysis for each relationship pair is marked as primary
**And** users can view all their analyses including previous versions

### AC2: Shared version utility for portraits and relationship analyses
**Given** version classification
**When** the `isLatestVersion` utility is called
**Then** it compares the analysis's result_id against the latest result_id for each user
**And** the same utility is used for both portrait and relationship analysis versioning (already implemented in Story 36-3)

### AC3: Cascade deletion of relationship analyses on account deletion
**Given** one user deletes their account
**When** the deletion cascade runs
**Then** all shared relationship analyses involving that user are deleted (FR34)
**And** the existing PostgreSQL FK cascade on `user_a_id` and `user_b_id` with `onDelete: "cascade"` handles this automatically

### AC4: Previous version labeling in analysis list
**Given** a user views their relationship analyses list
**When** previous versions exist
**Then** they are clearly labeled with `isLatestVersion: false` and visually distinguished from the primary analysis on the frontend

## Tasks

### Task 1: Add `listByUserId` method to RelationshipAnalysisRepository
- **1.1** Add `listByUserId` method signature to `RelationshipAnalysisRepository` interface in `packages/domain/src/repositories/relationship-analysis.repository.ts`
  - Returns analyses with participant names for the given user
  - Signature: `(userId: string) => Effect.Effect<ReadonlyArray<RelationshipAnalysis & { userAName: string; userBName: string }>, DatabaseError>`
- **1.2** Implement `listByUserId` in `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts`
  - JOIN with user table to get participant names (similar to `getByIdWithParticipantNames`)
  - Filter by `userAId = userId OR userBId = userId`
  - Order by `createdAt DESC`
- **1.3** Add mock implementation in `packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts`
- **1.4** Write unit tests for the `listByUserId` implementation

### Task 2: Create `list-relationship-analyses` use-case
- **2.1** Create `apps/api/src/use-cases/list-relationship-analyses.use-case.ts`
  - Fetch all analyses for the user via `listByUserId`
  - For each analysis, compute `isLatestVersion` using the existing `isLatestVersion` utility from `@workspace/domain`
  - Batch fetch latest result IDs for all unique user IDs involved
  - Return enriched list with `isLatestVersion` flag per analysis
- **2.2** Write unit tests for the use-case with mocked repositories

### Task 3: Add `listRelationshipAnalyses` contract endpoint
- **3.1** Add response schema and endpoint to `packages/contracts/src/http/groups/relationship.ts`
  - `GET /relationship/analyses` — returns array of analyses with version info
  - Response schema includes: `analysisId`, `userAName`, `userBName`, `isLatestVersion`, `createdAt`, `hasContent` (boolean indicating if content is ready)
- **3.2** Register endpoint in the RelationshipGroup

### Task 4: Add handler for `listRelationshipAnalyses`
- **4.1** Add handler in `apps/api/src/handlers/relationship.ts`
  - Thin handler that delegates to the use-case
  - Extracts userId from AuthenticatedUser

### Task 5: Verify cascade deletion works correctly
- **5.1** Write a test confirming that deleting a user cascades to their relationship analyses
  - This is already handled by PostgreSQL FK cascades (`onDelete: "cascade"` on `userAId` and `userBId` columns)
  - Test verifies the schema constraint is correct and the relationship between tables is intact
- **5.2** Verify the existing `delete-account.use-case` integration — no code changes needed since FK cascades handle it

### Task 6: Frontend — Relationship analyses list on results page
- **6.1** Create `apps/front/src/hooks/useRelationshipAnalysesList.ts` hook
  - Uses Effect HttpApiClient pattern per CLAUDE.md
  - Fetches `GET /relationship/analyses`
- **6.2** Update `RelationshipCard` or create `RelationshipAnalysesList` component
  - Shows all analyses with version badges
  - Latest versions are visually primary, previous versions are muted with "Previous version" label
  - Each analysis links to `/relationship/$analysisId`
- **6.3** Wire into results page

## Technical Notes

- The `isLatestVersion` utility already exists in `packages/domain/src/utils/version-detection.ts` (Story 36-3)
- PostgreSQL FK cascades already handle deletion — the `relationship_analyses` table has `onDelete: "cascade"` on both `userAId` and `userBId` columns
- The `getRelationshipAnalysis` use-case already computes `isLatestVersion` for a single analysis — the list use-case extends this to batch
- No database migration needed — all schema support already exists
