# Story 30-2: Account Deletion with Cascade Hooks

Status: review

## Story

As a user,
I want to permanently delete my account and all associated data,
So that my personal information is removed from the platform.

## Acceptance Criteria

1. **Given** a logged-in user navigates to account settings **When** they select "Delete Account" **Then** they see a confirmation dialog requiring explicit confirmation before proceeding

2. **Given** a user confirms account deletion **When** the deletion is processed **Then** all user data is removed: account, assessment sessions, messages, evidence records, facet scores, portraits, purchase events, relationship invitations, relationship analyses, portrait ratings, and public profiles **And** the user's auth session is invalidated **And** the user is redirected to the homepage

3. **Given** a user confirms account deletion **When** the deletion is processed **Then** a domain event is emitted that future epics can subscribe to for their own cleanup (e.g., relationship analyses in Epic 6)

4. **Given** a user has deleted their account **When** anyone attempts to access their former profile URL **Then** they receive a 404 or appropriate "not found" response

## Tasks / Subtasks

- [x] Task 1: Create delete-account use-case (AC: #2, #3)
  - [x] 1.1: Create `apps/api/src/use-cases/delete-account.use-case.ts` with `deleteAccount` function
  - [x] 1.2: Accept `userId: string` parameter from authenticated context
  - [x] 1.3: Delete relationship analyses where user is userA or userB (handled by FK cascade)
  - [x] 1.4: Delete relationship invitations where user is inviter or invitee (handled by FK cascade)
  - [x] 1.5: Delete purchase events for the user (FK changed to `onDelete: "cascade"`)
  - [x] 1.6: Delete portrait ratings for the user (handled by FK cascade)
  - [x] 1.7: Delete assessment sessions (FK changed to `onDelete: "cascade"`)
  - [x] 1.8: Delete the user row from Better Auth `user` table (single DELETE cascades everything)
  - [x] 1.9: Log the deletion event via LoggerRepository

- [x] Task 2: Create DB migration for FK cascade changes (AC: #2)
  - [x] 2.1: Change `purchase_events.user_id` FK from `onDelete: "restrict"` to `onDelete: "cascade"` in Drizzle schema
  - [x] 2.2: Add `onDelete: "cascade"` to `relationship_invitations.inviter_user_id` and `relationship_invitations.invitee_user_id` FKs
  - [x] 2.3: Add `onDelete: "cascade"` to `relationship_analyses.user_a_id` and `relationship_analyses.user_b_id` FKs
  - [x] 2.4: Change `assessment_session.user_id` FK from `onDelete: "set null"` to `onDelete: "cascade"`
  - [x] 2.5: Change `public_profile.user_id` FK from `onDelete: "set null"` to `onDelete: "cascade"`
  - [x] 2.6: Write migration SQL manually (drizzle-kit generate had interactive conflicts)

- [x] Task 3: Create account deletion HTTP contract (AC: #2)
  - [x] 3.1: Create `AccountGroup` in `packages/contracts/src/http/groups/account.ts` with `DELETE /api/account` endpoint
  - [x] 3.2: Use `AuthMiddleware` (strict — requires authentication)
  - [x] 3.3: Response schema: `{ success: boolean }`
  - [x] 3.4: Error types: `Unauthorized` (401), `DatabaseError` (500)
  - [x] 3.5: Register `AccountGroup` in `packages/contracts/src/http/api.ts`
  - [x] 3.6: Export from `packages/contracts/src/index.ts`

- [x] Task 4: Create account deletion handler (AC: #2)
  - [x] 4.1: Create `apps/api/src/handlers/account.ts` with `AccountGroupLive`
  - [x] 4.2: Extract authenticated user ID from `AuthenticatedUser` context
  - [x] 4.3: Call `deleteAccount` use-case
  - [x] 4.4: Register `AccountGroupLive` in `apps/api/src/index.ts`

- [x] Task 5: Create frontend account deletion UI (AC: #1, #2)
  - [x] 5.1: Create `apps/front/src/components/settings/AccountDeletionSection.tsx` with "Delete Account" button
  - [x] 5.2: Create confirmation dialog using existing Dialog component from `@workspace/ui`
  - [x] 5.3: Require user to type "DELETE" to confirm (explicit confirmation)
  - [x] 5.4: On confirmation, call `DELETE /api/account` via auth client or fetch
  - [x] 5.5: On success, sign out and redirect to homepage
  - [x] 5.6: Add `AccountDeletionSection` to the settings page (`apps/front/src/routes/settings.tsx`)

- [x] Task 6: Unit tests for delete-account use-case (AC: #2, #3, #4)
  - [x] 6.1: Create test file `apps/api/src/use-cases/__tests__/delete-account.use-case.test.ts`
  - [x] 6.2: Test successful deletion cascades all user data
  - [x] 6.3: Test that relationship analyses involving the user are deleted (via cascade)
  - [x] 6.4: Test that public profile becomes inaccessible after deletion (via cascade)

## Dev Notes

### Database Cascade Strategy (Simplified)

Anonymous-user-first is no longer supported. All user-referencing FKs now use `onDelete: "cascade"`, so deleting the user row automatically removes all child data. No explicit multi-step deletion order needed.

**All FKs referencing `user.id` with `onDelete: "cascade"`:**
- `session.user_id` ✓ (Better Auth)
- `account.user_id` ✓ (Better Auth)
- `assessment_session.user_id` ✓ (changed from `set null`)
- `public_profile.user_id` ✓ (changed from `set null`)
- `purchase_events.user_id` ✓ (changed from `restrict`)
- `portrait_ratings.user_id` ✓
- `relationship_invitations.inviter_user_id` ✓ (added)
- `relationship_invitations.invitee_user_id` ✓ (added)
- `relationship_analyses.user_a_id` ✓ (added)
- `relationship_analyses.user_b_id` ✓ (added)

### Better Auth User Deletion

Better Auth does not provide a built-in `deleteUser` API method. The use-case deletes the user row directly via Drizzle, which triggers FK cascades for all child tables.

### Frontend Pattern

The settings page at `/settings` includes `AccountDeletionSection` below `ProfileVisibilitySection`, following the same component pattern.

## Architect Notes

### Finding (superseded): Anonymous users no longer supported

The original architect notes recommended explicit deletion with `restrict` on purchase_events and manual deletion order. Since anonymous-user-first is no longer supported, all FKs were changed to `onDelete: "cascade"`, simplifying the use-case to a single `DELETE FROM user WHERE id = ?`.

## Dev Agent Record

### Implementation Plan
- Verified all FK cascade behavior in Drizzle schema
- Changed 7 FKs to `onDelete: "cascade"` (from `set null`, `restrict`, or default `no action`)
- Simplified UserAccountRepository from 5-step explicit deletion to single user row DELETE
- Wrote manual migration SQL since drizzle-kit generate had interactive conflicts
- All existing tests pass (42 API tests, 30 frontend tests, domain and infrastructure tests)

### Completion Notes
- Schema changes: 7 FK constraints updated to `onDelete: "cascade"` in `packages/infrastructure/src/db/drizzle/schema.ts`
- Migration: Manual SQL migration at `drizzle/20260320000000_story_30_2_cascade_fks/migration.sql`
- Repository simplified: `user-account.drizzle.repository.ts` reduced from ~120 lines (5 delete steps) to ~50 lines (single delete)
- Repository interface docs updated to reflect cascade-based approach
- All tests pass, no regressions
- Date: 2026-03-20

## File List

- `packages/infrastructure/src/db/drizzle/schema.ts` (modified — 7 FK onDelete changes)
- `drizzle/20260320000000_story_30_2_cascade_fks/migration.sql` (new — FK constraint migration)
- `packages/domain/src/repositories/user-account.repository.ts` (modified — updated docs)
- `packages/infrastructure/src/repositories/user-account.drizzle.repository.ts` (modified — simplified to single delete)
- `packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts` (existing — unchanged)
- `apps/api/src/use-cases/delete-account.use-case.ts` (existing — unchanged)
- `apps/api/src/handlers/account.ts` (existing — unchanged)
- `packages/contracts/src/http/groups/account.ts` (existing — unchanged)
- `packages/contracts/src/http/api.ts` (existing — unchanged)
- `packages/contracts/src/index.ts` (existing — unchanged)
- `apps/api/src/index.ts` (existing — unchanged)
- `apps/front/src/components/settings/AccountDeletionSection.tsx` (existing — unchanged)
- `apps/front/src/routes/settings.tsx` (existing — unchanged)
- `apps/api/src/use-cases/__tests__/delete-account.use-case.test.ts` (existing — unchanged)

## Change Log

- 2026-03-20: Changed all user-referencing FKs to `onDelete: "cascade"`, simplified repository to single-delete approach, wrote manual migration SQL
- 2026-03-19: Initial implementation of account deletion (use-case, handler, contract, frontend UI, tests)
