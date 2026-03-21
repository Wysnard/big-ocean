# Story 34-1: QR Token Infrastructure

## Status: ready-for-dev

## Story

As the system,
I want to manage QR tokens with lifecycle controls,
So that relationship analysis initiation is secure, time-bound, and reliable.

## Epic Reference

Epic 5, Story 5.1 — Relationship Analysis: QR & Credits

## FRs/NFRs Covered

- **FR28:** Users can initiate a relationship analysis by opening a QR drawer; the other person scans the QR code or opens the contained URL
- **FR30:** The QR accept screen shows the initiator's archetype card, both users' confidence rings, and available credit balance, with Accept and Refuse buttons. The recipient must accept before the analysis proceeds (single consent gate)
- **FR37:** The QR accept screen is only accessible to logged-in users with a completed assessment. There is no pre-account context — User B must sign up and complete their assessment before seeing the accept screen
- **NFR10:** Row-level data access control ensures users can only access their own data

## Architecture Reference

ADR-10 in architecture.md defines the QR token model replacing the existing invitation link model:
- New `relationship_qr_tokens` table (6h TTL, `active`/`accepted`/`expired` status)
- Updated `relationship_analyses` schema (drop `invitation_id` FK, add `user_a_result_id`/`user_b_result_id` FKs)
- New endpoints: `POST /qr/generate`, `GET /qr/:token/status`, `POST /qr/:token/accept`, `POST /qr/:token/refuse`
- Existing `relationship_invitations` table, endpoints, and use-cases are removed

## Current State Analysis

The codebase has a full invitation-based relationship system from Story 14.2/14.4:
- `relationship_invitations` table and `invitationStatusEnum` in schema
- `RelationshipInvitationRepository` interface and `RelationshipInvitationDrizzleRepositoryLive` implementation
- `relationship_analyses` table FK'd to `relationship_invitations.id`
- `RelationshipAnalysisRepository` with `insertPlaceholder(invitationId, ...)`
- Contract groups: `RelationshipGroup` and `RelationshipPublicGroup`
- Handler: `relationship.ts` with invitation-specific endpoints
- Use-cases: `create-invitation`, `accept-invitation`, `refuse-invitation`, `list-invitations`, `get-invitation-by-token`, `get-relationship-state`, `get-relationship-analysis`, `generate-relationship-analysis`
- Mock: `__mocks__/relationship-invitation.drizzle.repository.ts`
- Domain types: `RelationshipInvitation`, `InvitationStatus`, `CreateInvitationInput`
- Security: `InviteTokenSecurity` cookie for invite token persistence

### What Needs to Change (Delta)

Per ADR-10, the entire invitation model is replaced by the QR token model:

1. **New DB table:** `relationship_qr_tokens` with `id`, `user_id`, `token` (UNIQUE), `expires_at` (6h), `status` (active/accepted/expired), `accepted_by_user_id`, `created_at`
2. **Schema migration:** `relationship_analyses` drops `invitation_id` FK, adds `user_a_result_id` and `user_b_result_id` FKs to `assessment_results`
3. **New repository interface:** `QrTokenRepository` in domain
4. **New repository implementation:** `QrTokenDrizzleRepositoryLive` in infrastructure
5. **Updated `RelationshipAnalysisRepository`:** Replace `insertPlaceholder(invitationId, ...)` with `insertPlaceholder(userAResultId, userBResultId, ...)`
6. **New contracts/endpoints:** QR-specific API group with generate, status, accept, refuse
7. **New use-cases:** `generate-qr-token`, `get-qr-token-status`, `accept-qr-invitation`, `refuse-qr-invitation`
8. **Updated use-cases:** `generate-relationship-analysis` (use result IDs instead of invitation ID)
9. **Remove:** Old invitation repository, types, endpoints, use-cases, mocks, security cookie
10. **New domain types:** `QrToken`, `QrTokenStatus`

## Acceptance Criteria

### AC1: QR Token Generation
**Given** a user initiates a relationship analysis
**When** a QR token is generated via `POST /api/relationship/qr/generate`
**Then** a row is inserted into `relationship_qr_tokens` with: token (UNIQUE, URL-safe), user_id, expires_at (6h TTL), status (`active`), accepted_by_user_id (null)
**And** the response includes the token and a URL that routes to the accept screen

### AC2: QR Token Status Polling
**Given** a client polls `GET /api/relationship/qr/:token/status`
**When** the token is checked
**Then** the response returns one of: `valid`, `accepted`, or `expired`
**And** an expired token (past `expires_at`) returns `expired` regardless of stored status

### AC3: QR Token Accept
**Given** User B accepts a QR token via `POST /api/relationship/qr/:token/accept`
**When** the accept is processed
**Then** the token status is set to `accepted` and `accepted_by_user_id` is recorded
**And** the token is invalidated (no further accepts possible)
**And** one relationship credit is consumed from the accepting user's balance
**And** a relationship analysis placeholder is created with both users' latest assessment result IDs

### AC4: QR Token Refuse
**Given** User B refuses a QR token via `POST /api/relationship/qr/:token/refuse`
**When** the refusal is processed
**Then** the token remains `active` (can be scanned by someone else)
**And** no notification is sent to the initiator

### AC5: Self-Invitation Prevention
**Given** a user scans their own QR token
**When** they attempt to accept
**Then** the request fails with a `SelfInvitationError`

### AC6: Expired Token Handling
**Given** a QR token has expired (past 6h TTL)
**When** a user attempts to accept or check status
**Then** the token is reported as `expired`

### AC7: Relationship Analyses Updated Schema
**Given** the `relationship_analyses` table is updated
**When** a new analysis placeholder is created
**Then** it references `user_a_result_id` and `user_b_result_id` (FKs to `assessment_results`)
**And** the old `invitation_id` FK is removed

### AC8: Old Invitation System Removed
**Given** the QR token model replaces invitations
**When** the migration is complete
**Then** the `relationship_invitations` table, invitation endpoints, invitation use-cases, and invitation repository are removed
**And** the `InviteTokenSecurity` cookie is removed

## Tasks

### Task 1: Add QR Token Status Enum and DB Table

**Subtasks:**
1. Add `qrTokenStatusEnum` to `packages/infrastructure/src/db/drizzle/schema.ts` with values: `active`, `accepted`, `expired`
2. Add `relationshipQrTokens` table to schema with columns: `id` (uuid PK), `userId` (text FK → user, cascade delete), `token` (text UNIQUE), `expiresAt` (timestamptz), `status` (qrTokenStatusEnum, default `active`), `acceptedByUserId` (text FK → user, nullable), `createdAt` (timestamptz)
3. Add index on `userId` for the new table
4. Update drizzle relations for the new table

### Task 2: Update Relationship Analyses Schema

**Subtasks:**
1. Remove `invitationId` column and FK from `relationshipAnalyses` table
2. Add `userAResultId` (uuid FK → `assessmentResults`) column
3. Add `userBResultId` (uuid FK → `assessmentResults`) column
4. Update drizzle relations to reference the new FK columns
5. Remove `relationshipInvitations` table, `invitationStatusEnum` enum, and all related drizzle relations

### Task 3: Generate Drizzle Migration

**Subtasks:**
1. Run `pnpm db:generate` to generate migration from schema changes
2. Verify migration SQL is correct (adds new table, modifies analyses table, drops invitations table)

### Task 4: Add QR Token Domain Types

**Subtasks:**
1. Add `QrTokenStatus` type (`"active" | "accepted" | "expired"`) to `packages/domain/src/types/relationship.types.ts`
2. Add `QrToken` interface with: `id`, `userId`, `token`, `expiresAt`, `status`, `acceptedByUserId`, `createdAt`
3. Update `RelationshipAnalysis` interface: remove `invitationId`, add `userAResultId` and `userBResultId`
4. Remove `RelationshipInvitation`, `CreateInvitationInput`, `InvitationStatus`, `INVITATION_EXPIRY_DAYS`
5. Add `QR_TOKEN_TTL_HOURS = 6` constant
6. Export new types from domain index

### Task 5: Create QrTokenRepository Interface

**Subtasks:**
1. Create `packages/domain/src/repositories/qr-token.repository.ts`
2. Define `QrTokenRepository` Context.Tag with methods:
   - `generate(userId: string): Effect<QrToken, DatabaseError>` — creates token with 6h TTL
   - `getByToken(token: string): Effect<QrToken, DatabaseError | QrTokenNotFoundError>` — returns token with derived expiry status
   - `getStatus(token: string): Effect<"valid" | "accepted" | "expired", DatabaseError | QrTokenNotFoundError>` — returns derived status
   - `accept(input: { token: string; acceptedByUserId: string }): Effect<QrToken, DatabaseError | QrTokenNotFoundError | QrTokenExpiredError | QrTokenAlreadyAcceptedError | SelfInvitationError>` — atomic accept with guards
   - `expireToken(token: string): Effect<void, DatabaseError>` — sets status to expired
   - `getActiveByUserId(userId: string): Effect<QrToken | null, DatabaseError>` — gets active token for regeneration check
3. Define `QrTokenNotFoundError` and `QrTokenExpiredError` and `QrTokenAlreadyAcceptedError` as infrastructure errors co-located with the repository (Data.TaggedError)
4. Export from domain index

### Task 6: Create QrTokenDrizzleRepositoryLive Implementation

**Subtasks:**
1. Create `packages/infrastructure/src/repositories/qr-token.drizzle.repository.ts`
2. Implement all methods from the interface:
   - `generate`: Insert row with `crypto.randomUUID()` token and 6h `expiresAt`
   - `getByToken`: SELECT with derived expiry status (if `expires_at < NOW()` and status is `active`, return expired)
   - `getStatus`: Lightweight status check with derived expiry
   - `accept`: Atomic UPDATE WHERE `status = active AND expires_at > NOW() AND user_id != acceptedByUserId`, with diagnostic SELECT on failure
   - `expireToken`: UPDATE status to expired
   - `getActiveByUserId`: SELECT WHERE `user_id = ? AND status = active AND expires_at > NOW()`
3. Export `QrTokenDrizzleRepositoryLive` as Layer

### Task 7: Create Mock Repository

**Subtasks:**
1. Create `packages/infrastructure/src/repositories/__mocks__/qr-token.drizzle.repository.ts`
2. Implement in-memory mock with the same Layer name `QrTokenDrizzleRepositoryLive`
3. Use Map-based storage for tokens

### Task 8: Update RelationshipAnalysisRepository

**Subtasks:**
1. Update `insertPlaceholder` signature in `packages/domain/src/repositories/relationship-analysis.repository.ts`: replace `invitationId` with `userAResultId` and `userBResultId`
2. Update `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts` implementation
3. Update `packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts` mock
4. Remove `getByInvitationId` method (replaced by result-based queries)

### Task 9: Add QR Token HTTP Errors to Contracts

**Subtasks:**
1. Add `QrTokenNotFoundError`, `QrTokenExpiredError`, `QrTokenAlreadyAcceptedError` to `packages/contracts/src/errors.ts`
2. These are HTTP-facing errors that map to the infrastructure errors

### Task 10: Create QR Token Contract Group

**Subtasks:**
1. Create `packages/contracts/src/http/groups/qr-token.ts`
2. Define `QrTokenGroup` (authenticated) with endpoints:
   - `POST /qr/generate` → `{ token, shareUrl, expiresAt }`
   - `GET /qr/:token/status` → `{ status: "valid" | "accepted" | "expired" }`
   - `POST /qr/:token/accept` → `{ analysisId }` (consumes credit, creates placeholder)
   - `POST /qr/:token/refuse` → `{ ok: true }`
3. Define `QrTokenPublicGroup` (unauthenticated) if needed for token lookup
4. Add proper error schemas for each endpoint
5. Register groups in `BigOceanApi`

### Task 11: Create Use-Cases

**Subtasks:**
1. Create `apps/api/src/use-cases/generate-qr-token.use-case.ts` — generates token with 6h TTL, expires any existing active token for the user
2. Create `apps/api/src/use-cases/get-qr-token-status.use-case.ts` — returns derived status
3. Create `apps/api/src/use-cases/accept-qr-invitation.use-case.ts` — validates, consumes credit, accepts token, creates analysis placeholder, forks generation daemon
4. Create `apps/api/src/use-cases/refuse-qr-invitation.use-case.ts` — validates and returns (token stays active)

### Task 12: Create QR Token Handler

**Subtasks:**
1. Create handler in `apps/api/src/handlers/qr-token.ts`
2. Implement `QrTokenGroupLive` with all endpoint handlers
3. Wire up to BigOceanApi in server setup

### Task 13: Update generate-relationship-analysis Use-Case

**Subtasks:**
1. Update `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` to accept result IDs instead of invitation ID
2. Update its test

### Task 14: Remove Old Invitation System

**Subtasks:**
1. Remove `packages/domain/src/repositories/relationship-invitation.repository.ts`
2. Remove `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts`
3. Remove `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts`
4. Remove `packages/contracts/src/security/invite-token.ts` and `InviteTokenSecurity` export
5. Remove old invitation use-cases: `create-invitation`, `accept-invitation`, `refuse-invitation`, `list-invitations`, `get-invitation-by-token`
6. Remove old invitation tests
7. Update `RelationshipGroup` and `RelationshipPublicGroup` contracts — remove invitation endpoints, keep analysis endpoints
8. Update relationship handler — remove invitation handlers
9. Remove invitation types from domain
10. Update domain and infrastructure index exports

### Task 15: Write Tests (TDD)

**Subtasks:**
1. Unit test `generate` in QR token repository mock (token creation, 6h TTL)
2. Unit test `getStatus` with derived expiry
3. Unit test `accept` — happy path and error cases (expired, already accepted, self-invitation)
4. Unit test `refuse` — token stays active
5. Unit test `generate-qr-token` use-case (expires existing active token)
6. Unit test `accept-qr-invitation` use-case (credit consumption, analysis placeholder creation)
7. Unit test updated `generate-relationship-analysis` use-case
8. Update existing relationship analysis tests to work with new schema

## Dev Notes

- Token generation should use `crypto.randomUUID()` for URL-safe unique tokens.
- Derived expiry: application-level check `expires_at < NOW()` for `active` tokens — same pattern as existing invitation expiry derivation.
- Auto-regeneration (hourly) is a frontend concern (Story 5.2 QR Drawer UI) — this story only provides the `generate` endpoint that expires old tokens.
- Credit consumption on accept follows the same pattern as the existing `createWithCreditConsumption` — atomic transaction with `credit_consumed` purchase event.
- The `relationship_analyses` schema change (invitation_id → result_id FKs) enables the derive-at-read version detection from ADR-10.
- The analysis placeholder creation on accept should use canonical user ordering: `userAId = MIN(generator, acceptor)`, `userBId = MAX(generator, acceptor)`.
