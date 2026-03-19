# Story 30-2: Account Deletion with Cascade Hooks

Status: ready-for-dev

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

- [ ] Task 1: Create delete-account use-case (AC: #2, #3)
  - [ ] 1.1: Create `apps/api/src/use-cases/delete-account.use-case.ts` with `deleteAccount` function
  - [ ] 1.2: Accept `userId: string` parameter from authenticated context
  - [ ] 1.3: Delete relationship analyses where user is userA or userB (FR34 — cascade deletion of shared analyses)
  - [ ] 1.4: Delete relationship invitations where user is inviter or invitee
  - [ ] 1.5: Delete purchase events for the user (requires schema change: `onDelete: "restrict"` → `onDelete: "cascade"`)
  - [ ] 1.6: Delete portrait ratings for the user
  - [ ] 1.7: Delete assessment sessions (cascades to messages, evidence, exchanges, results, portraits, public profiles via existing FK cascades)
  - [ ] 1.8: Delete the user row from Better Auth `user` table (cascades to `session`, `account` via existing FK cascades)
  - [ ] 1.9: Log the deletion event via LoggerRepository

- [ ] Task 2: Create DB migration for purchase_events FK change (AC: #2)
  - [ ] 2.1: Change `purchase_events.user_id` FK from `onDelete: "restrict"` to `onDelete: "cascade"` in Drizzle schema
  - [ ] 2.2: Add `onDelete: "cascade"` to `relationship_invitations.inviter_user_id` and `relationship_invitations.invitee_user_id` FKs
  - [ ] 2.3: Add `onDelete: "cascade"` to `relationship_analyses.user_a_id` and `relationship_analyses.user_b_id` FKs
  - [ ] 2.4: Generate Drizzle migration via `pnpm db:generate`

- [ ] Task 3: Create account deletion HTTP contract (AC: #2)
  - [ ] 3.1: Create `AccountGroup` in `packages/contracts/src/http/groups/account.ts` with `DELETE /api/account` endpoint
  - [ ] 3.2: Use `AuthMiddleware` (strict — requires authentication)
  - [ ] 3.3: Response schema: `{ success: boolean }`
  - [ ] 3.4: Error types: `Unauthorized` (401), `DatabaseError` (500)
  - [ ] 3.5: Register `AccountGroup` in `packages/contracts/src/http/api.ts`
  - [ ] 3.6: Export from `packages/contracts/src/index.ts`

- [ ] Task 4: Create account deletion handler (AC: #2)
  - [ ] 4.1: Create `apps/api/src/handlers/account.ts` with `AccountGroupLive`
  - [ ] 4.2: Extract authenticated user ID from `AuthenticatedUser` context
  - [ ] 4.3: Call `deleteAccount` use-case
  - [ ] 4.4: Register `AccountGroupLive` in `apps/api/src/index.ts`

- [ ] Task 5: Create frontend account deletion UI (AC: #1, #2)
  - [ ] 5.1: Create `apps/front/src/components/settings/AccountDeletionSection.tsx` with "Delete Account" button
  - [ ] 5.2: Create confirmation dialog using existing Dialog component from `@workspace/ui`
  - [ ] 5.3: Require user to type "DELETE" to confirm (explicit confirmation)
  - [ ] 5.4: On confirmation, call `DELETE /api/account` via auth client or fetch
  - [ ] 5.5: On success, sign out and redirect to homepage
  - [ ] 5.6: Add `AccountDeletionSection` to the settings page (`apps/front/src/routes/settings.tsx`)

- [ ] Task 6: Unit tests for delete-account use-case (AC: #2, #3, #4)
  - [ ] 6.1: Create test file `apps/api/src/use-cases/__tests__/delete-account.use-case.test.ts`
  - [ ] 6.2: Test successful deletion cascades all user data
  - [ ] 6.3: Test that relationship analyses involving the user are deleted
  - [ ] 6.4: Test that public profile becomes inaccessible after deletion

## Dev Notes

### Database Cascade Strategy

The existing schema already has `onDelete: "cascade"` on most user-related tables via the assessment_session FK chain:
- `assessment_session.user_id` → `onDelete: "set null"` (needs consideration — sessions become orphaned)
- `session` (Better Auth) → `onDelete: "cascade"` on `user_id` ✓
- `account` (Better Auth) → `onDelete: "cascade"` on `user_id` ✓
- `portrait_ratings.user_id` → `onDelete: "cascade"` ✓
- `public_profile.user_id` → `onDelete: "set null"` (profile orphaned but session cascade will delete)

Tables requiring explicit deletion before user row delete (no cascade or restrict):
- `purchase_events.user_id` → `onDelete: "restrict"` — **MUST change to cascade or delete explicitly**
- `relationship_invitations.inviter_user_id` / `invitee_user_id` → no onDelete specified (defaults to no action)
- `relationship_analyses.user_a_id` / `user_b_id` → no onDelete specified (defaults to no action)

### Deletion Order (to avoid FK violations)

Since `assessment_session.user_id` uses `onDelete: "set null"`, the simplest approach is:
1. Explicitly delete relationship_analyses where user is participant
2. Explicitly delete relationship_invitations where user is inviter or invitee
3. Explicitly delete purchase_events for user
4. Get all assessment session IDs for user
5. Delete assessment sessions (cascades to messages, evidence, exchanges, results → portraits, public profiles)
6. Delete the user row (cascades to Better Auth session + account tables, portrait_ratings)

Alternatively, change all FKs to `onDelete: "cascade"` and let Postgres handle it in one DELETE on `user`.

### Better Auth User Deletion

Better Auth does not provide a built-in `deleteUser` API method. The use-case will delete the user row directly via Drizzle, which triggers FK cascades for the `session` and `account` tables.

### Frontend Pattern

The settings page already exists at `/settings` with `ProfileVisibilitySection`. Add `AccountDeletionSection` below it following the same component pattern.

## Architect Notes

### Finding 1: Do NOT change purchase_events FK to cascade — delete explicitly

The `purchase_events` table uses `onDelete: "restrict"` intentionally to prevent accidental user deletion when purchase records exist. For account deletion, the use-case must **explicitly delete** purchase_events rows for the user BEFORE deleting the user row. Do NOT change the FK constraint — the restrict guard protects against bugs in other code paths.

**Action:** Remove Task 2.1 (FK change for purchase_events). In Task 1.5, delete purchase events explicitly via `DELETE FROM purchase_events WHERE user_id = ?`.

### Finding 2: Assessment sessions must be deleted explicitly — not via user row cascade

The `assessment_session.user_id` FK uses `onDelete: "set null"`, meaning deleting the user row orphans sessions rather than deleting them. The use-case MUST:
1. Query all assessment session IDs for the user
2. Delete those sessions explicitly (which cascades to messages, evidence, exchanges, results, portraits, public profiles via existing FK cascades)
3. Only THEN delete the user row

**Action:** Task 1.7 must explicitly delete assessment sessions by user_id. The deletion order in the use-case must be:
1. Delete relationship_analyses (user_a_id OR user_b_id)
2. Delete relationship_invitations (inviter_user_id OR invitee_user_id)
3. Delete purchase_events (user_id)
4. Delete assessment_sessions (user_id) — cascades to all child tables
5. Delete user row — cascades to Better Auth sessions, accounts, portrait_ratings

**File:** `apps/api/src/use-cases/delete-account.use-case.ts`
**Pattern:** Use raw Drizzle `db.delete().where()` calls within a single transaction. Follow the same Drizzle access pattern used in `packages/infrastructure/src/context/better-auth.ts` (direct Drizzle operations).
