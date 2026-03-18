# Architecture vs UX Spec: Gap Analysis & Decisions

**Date:** 2026-03-18
**Context:** Cross-referencing UX Design Specification (sections 10-13) against Architecture.md and current codebase.

---

## Decisions Made

### 1. QR Token Model Replaces Invitation Model

**Decision:** The invitation link model (`relationship_invitations` table, `/api/relationship/invitations` endpoints) is replaced entirely by the QR token model.

**What changes:**
- New `relationship_qr_tokens` table (or repurpose `relationship_invitations`)
- New endpoints: `POST /generate`, `GET /:token/status`, `POST /:token/accept`, `POST /:token/refuse`
- `InvitationBottomSheet` component is obsolete — replaced by QR accept screen
- Current invitation routes/handlers/use-cases to be removed or refactored

### 2. `relationship_analyses` FK to `assessment_results` Only

**Decision:** Drop the FK to `relationship_invitations`. Replace with FKs to `assessment_results` for both users.

**Schema change:**
```
relationship_analyses:
  - DROP: invitation_id (FK → relationship_invitations)
  - ADD: user_a_result_id (FK → assessment_results)
  - ADD: user_b_result_id (FK → assessment_results)
  - KEEP: user_a_id, user_b_id (FK → user)
```

**Version detection (derive-at-read):** At read time, check if `assessment_results` has a newer row for either `user_a_id` or `user_b_id`. If yes → "previous version." Same pattern as EvolutionBadge.

### 3. Free Credit on First Portrait Purchase (Not Signup)

**Decision:** The `user.create.after` hook should NOT grant a free relationship credit. Instead, the `onOrderPaid` handler for the first `portrait_unlocked` event inserts both:
- `portrait_unlocked` purchase event
- `free_credit_granted` purchase event (only if no prior `free_credit_granted` exists for this user)

**Why:** The "€1 PWYW → free €5 credit" is a core conversion nudge. Granting credit at signup removes this incentive.

**Codebase change:** `packages/infrastructure/src/context/better-auth.ts` — remove credit grant from `user.create.after`, add conditional credit grant to `onOrderPaid`.

### 4. Relationship Analysis List Endpoint

**Decision:** New endpoint needed.

**Contract:** `GET /api/relationship/analyses` — returns all analyses where authenticated user is `user_a_id` or `user_b_id`, ordered by `created_at DESC`. Each entry includes version status (derived from FK comparison with latest `assessment_results`).

**Use-case:** `list-relationship-analyses.use-case.ts`

### 5. Last Conversation Topic = Derived from Last Territory

**Decision:** No new column needed on `assessment_sessions`. The "last conversation topic" for re-engagement emails is derived from the last territory explored in the conversation (already stored in conversation evidence / assessment exchange data).

**Implementation:** The re-engagement email template queries the last `assessment_exchange` row's territory field for the session. No schema change.

### 6. Conversation Extension Creates New Assessment Session

**Decision:** Extension creates a new `assessment_session` row linked to the same user. This session:
- Starts from exchange 1 (of 25) but uses the last user state from the prior session as initialization
- Generates a new `assessment_results` row on completion
- The prior session's results become the "previous version" for portrait/relationship detection

**Schema implication:** `assessment_sessions` may need a `parent_session_id` FK to link extension sessions to their original. Or the extension is purely a new session with the pacing pipeline initialized from the prior session's final state.

**Pacing pipeline:** Loads all prior evidence from the parent session. Initializes E_target from last exchange's smoothed values. Nerin references "themes and patterns" from prior evidence, not specific exchanges.

### 7. QR Accept Screen Data

**Decision:** The QR accept/refuse URL resolves to a page showing:
- User A's archetype card (name, OCEAN code, GeometricSignature, short description)
- Both users' confidence rings (requires User B to be logged in with completed assessment)
- User B's credit balance
- Accept button (consumes credit) / Refuse button (silent, no notification)

**Route:** The QR token encodes a URL like `/relationship/qr/:token`. The route:
1. Checks if token exists and is valid (not expired, not already accepted)
2. Resolves which user generated it (User A)
3. Auth-gates User B (must be logged in + assessment complete)
4. Returns User A's public profile data + User B's credit balance

### 8. Email Provider: Resend

**Decision:** Use Resend for transactional emails.

**Three email types for MVP:**
1. **Drop-off re-engagement** — "You and Nerin were talking about [last territory]..." Sent once after session inactive for X hours. One email only, then silence.
2. **Nerin check-in** — ~2 weeks post-assessment. References tension/theme from portrait. Nerin-voiced. One email only.
3. **Deferred portrait recapture** — "Nerin's portrait is waiting for you." Sent to users who skipped PWYW. Sent once after X days.

**Integration:** Resend REST API via Effect-ts HttpClient. React Email for templates (consistent with frontend styling). Free tier: 100 emails/day.

**New infrastructure:**
- `ResendEmailRepository` interface in `packages/domain`
- `ResendEmailRepositoryLive` implementation in `packages/infrastructure`
- Email templates in a shared location (React Email components)

### 9. Portrait Auto-Retry on Reconciliation

**Decision:** On results page load, if a `portrait_unlocked` purchase event exists but no portrait row exists, auto-insert placeholder and fork daemon.

**Implementation:** Add reconciliation logic to `get-portrait-status.use-case.ts` (or the results page loader). Check:
1. Does `portrait_unlocked` event exist for this user?
2. Does a portrait row exist?
3. If (1) yes and (2) no → insert placeholder, fork daemon

This covers the "browser closed mid-payment" edge case where webhook fired but placeholder INSERT failed.

### 10. Extension Creates New Result Row

**Decision:** When extension conversation completes (exchange 25 of extension = total exchange 50), a new `assessment_results` row is generated from the combined 50 exchanges of evidence.

**Cascade effect:**
- Prior portrait's `assessment_result_id` now points to an older result → "previous version"
- Prior relationship analyses' `user_X_result_id` points to older result → "previous version"
- User must repay for portrait regeneration + relationship re-analysis

### 11. EvolutionBadge Version Detection

**Decision:** Uses the portrait's FK to `assessment_results`. If the portrait's `assessment_result_id` is not the latest result for that user → badge shows "previous version."

**Same pattern for relationship analyses:** If `user_a_result_id` or `user_b_result_id` is not the latest result for that user → "previous version."

**Implementation:** A shared utility function: `isLatestResult(resultId, userId) → boolean`. Used by portrait read path and relationship analysis read path.

---

## New Backend Work Summary

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/relationship/qr/generate` | POST | Generate QR token (6h TTL) |
| `/api/relationship/qr/:token/status` | GET | Poll validity → `valid \| accepted \| expired` |
| `/api/relationship/qr/:token/accept` | POST | Accept analysis, consume credit, invalidate token |
| `/api/relationship/qr/:token/refuse` | POST | Silent refuse, no notification |
| `/api/relationship/analyses` | GET | List all analyses for user, with version status |

### New Use-Cases

| Use-Case | Purpose |
|----------|---------|
| `generate-qr-token` | Create ephemeral token, store with TTL |
| `get-qr-token-status` | Return validity for polling |
| `accept-qr-invitation` | Consume credit, invalidate token, create analysis placeholder, trigger daemon |
| `refuse-qr-invitation` | No-op (token stays valid) |
| `list-relationship-analyses` | Return all analyses with version status |
| `activate-conversation-extension` | Verify purchase, create new session from prior state |
| `reconcile-portrait-purchase` | Auto-retry portrait if paid but missing |

### Schema Changes

| Table | Change |
|-------|--------|
| `relationship_analyses` | Drop `invitation_id` FK. Add `user_a_result_id`, `user_b_result_id` FKs to `assessment_results` |
| New: `relationship_qr_tokens` | `id, user_id, token, expires_at, status, accepted_by_user_id, created_at` |
| `assessment_sessions` | Consider `parent_session_id` FK for extension linking |

### New Infrastructure

| Component | Details |
|-----------|---------|
| Resend email repository | Domain interface + infrastructure implementation |
| Email templates | React Email components for 3 email types |
| QR token generation | UUID + URL encoding + TTL management |

### Removals / Refactors

| Current | Action |
|---------|--------|
| `relationship_invitations` table | Remove or repurpose for QR tokens |
| Invitation endpoints (`POST /invitations`, `GET /invitations/:token`) | Replace with QR endpoints |
| `InvitationBottomSheet` component | Remove — replaced by QR accept screen |
| `user.create.after` credit grant | Remove — credit granted on first portrait purchase |
| `RelationshipCardStateSchema` states | Simplify — remove invitation-specific states (`pending-sent`, `pending-received`, `declined`) |
