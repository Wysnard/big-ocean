# Story 34-3: QR Accept Screen & Consent Gate

**Status:** ready-for-dev
**Epic:** 5 — Relationship Analysis — QR & Credits
**FRs:** FR30, FR37
**Depends on:** Story 34-1 (QR Token Infrastructure), Story 34-2 (QR Drawer UI)

---

## User Story

As a user who scanned a QR code,
I want to see who invited me and decide whether to proceed,
So that I give informed consent before a relationship analysis is generated.

---

## Acceptance Criteria

### AC1: Auth Gate & Assessment Completion Check
**Given** a user scans a QR code or opens the contained URL
**When** they are not logged in or don't have a completed assessment
**Then** they are redirected to sign up / complete their assessment first
**And** after completion they are routed back to the accept screen (FR37)

### AC2: Accept Screen Display
**Given** a logged-in user with a completed assessment opens the accept screen
**When** the token is valid
**Then** the screen displays: initiator's archetype card, both users' confidence rings, the scanner's available credit balance, and Accept and Refuse buttons (FR30)
**And** no raw conversation transcripts or individual vulnerability data are exposed (NFR13)

### AC3: Accept Flow
**Given** User B taps "Accept"
**When** the acceptance is processed
**Then** one relationship credit is consumed from the accepting user's balance
**And** the QR token is invalidated
**And** both users are routed to the relationship analysis generation flow (Epic 6)

### AC4: Refuse Flow
**Given** User B taps "Refuse"
**When** the refusal is processed
**Then** User B is redirected away from the accept screen
**And** the token remains active for other potential scans
**And** no notification is sent to the initiator

### AC5: Expired Token
**Given** the QR token has expired
**When** a user opens the accept screen URL
**Then** an expired state is displayed with a message to ask the initiator for a new QR code

### AC6: No Credits Inline Purchase
**Given** User B has no credits
**When** they view the accept screen
**Then** the credit balance shows 0 and a purchase option is presented inline (€5 via Polar)

### AC7: Self-Invitation Prevention
**Given** the logged-in user is the same as the QR token initiator
**When** they open the accept screen
**Then** a friendly message is shown indicating they cannot analyze a relationship with themselves

---

## Tasks

### Task 1: Add `getQrTokenDetails` API endpoint (backend contract + handler + use-case)

The accept screen needs initiator profile data. Add a new endpoint that returns the initiator's archetype info and both users' confidence data.

#### Subtask 1.1: Add contract endpoint
- File: `packages/contracts/src/http/groups/qr-token.ts`
- Add `GET /qr/:token/details` endpoint returning:
  - `initiator`: `{ name: string, archetypeName: string, oceanCode4: string, oceanCode5: string, description: string, color: string, isCurated: boolean, overallConfidence: number }`
  - `acceptor`: `{ overallConfidence: number, availableCredits: number, hasCompletedAssessment: boolean }`
  - `tokenStatus`: `"valid" | "accepted" | "expired"`
- Error types: `QrTokenNotFoundError`, `QrTokenExpiredError`, `DatabaseError`

#### Subtask 1.2: Add `get-qr-token-details.use-case.ts`
- File: `apps/api/src/use-cases/get-qr-token-details.use-case.ts`
- Fetch token by token string
- Load initiator's latest assessment results and compute archetype (derive-at-read)
- Load acceptor's capabilities (credit balance) and assessment results (confidence)
- Return combined details object

#### Subtask 1.3: Add handler
- File: `apps/api/src/handlers/qr-token.ts`
- Wire `getQrTokenDetails` endpoint to the use-case

#### Subtask 1.4: Unit test the use-case
- File: `apps/api/src/use-cases/__tests__/get-qr-token-details.use-case.test.ts`
- Test: valid token returns initiator archetype + acceptor credits
- Test: expired token returns expired status
- Test: self-invitation detected

### Task 2: Frontend QR accept route (`/relationship/qr/$token`)

#### Subtask 2.1: Create route file with auth gate
- File: `apps/front/src/routes/relationship/qr/$token.tsx`
- Use `beforeLoad` to check auth state via `getSession()`
- If not logged in, redirect to `/login` with `redirect` search param back to `/relationship/qr/$token`
- If logged in but no completed assessment, redirect to `/chat` with appropriate messaging
- Use `loader` to fetch token details via the new API endpoint

#### Subtask 2.2: Create `QrAcceptScreen` component
- File: `apps/front/src/components/relationship/QrAcceptScreen.tsx`
- Display initiator's `ArchetypeCard` (reuse from `components/results/ArchetypeCard.tsx`)
- Display both users' confidence rings (reuse `ConfidenceRingCard` or a simplified inline ring)
- Show acceptor's credit balance with contextual messaging
- Accept button (primary, min-h-11, 44px tap target)
- Refuse button (outline variant)
- All `data-testid` attributes for e2e testing

#### Subtask 2.3: Create `useQrAccept` hook
- File: `apps/front/src/hooks/useQrAccept.ts`
- `acceptToken(token)`: calls `POST /qr/:token/accept` via Effect HttpApiClient
- `refuseToken(token)`: calls `POST /qr/:token/refuse` via Effect HttpApiClient
- Uses `useMutation` from TanStack Query
- On accept success: navigate to `/relationship/$analysisId` (from response)
- On refuse success: navigate to `/results` or `/`

#### Subtask 2.4: Handle error states in the UI
- Expired token: show message + "Ask for a new QR code"
- Self-invitation: show message "You cannot analyze a relationship with yourself"
- Already accepted: show message "This QR code has already been used"
- Insufficient credits: show purchase CTA inline
- Network error: show retry button

### Task 3: Frontend API client functions for QR accept

#### Subtask 3.1: Add API functions to `qr-token-api.ts`
- File: `apps/front/src/lib/qr-token-api.ts`
- `fetchTokenDetails(token)`: GET details endpoint
- `acceptToken(token)`: POST accept endpoint
- `refuseToken(token)`: POST refuse endpoint
- All using typed Effect HttpApiClient pattern

### Task 4: Component tests

#### Subtask 4.1: QrAcceptScreen unit tests
- File: `apps/front/src/components/relationship/QrAcceptScreen.test.tsx`
- Test: renders initiator archetype card
- Test: renders both confidence rings
- Test: shows credit balance
- Test: accept button calls accept handler
- Test: refuse button calls refuse handler
- Test: expired state renders correctly
- Test: self-invitation state renders correctly

#### Subtask 4.2: useQrAccept hook tests
- File: `apps/front/src/hooks/__tests__/useQrAccept.test.ts`
- Test: accept mutation calls API and returns analysisId
- Test: refuse mutation calls API
- Test: error states propagate correctly

### Task 5: Accessibility & mobile

#### Subtask 5.1: ARIA and keyboard navigation
- Accept/Refuse buttons have proper aria-labels
- Focus management: auto-focus on accept button when screen loads
- All interactive elements meet 44px minimum tap target (min-h-11)
- `prefers-reduced-motion` respected for any transitions

#### Subtask 5.2: Mobile layout
- Mobile-first design: full-width stacked layout on small screens
- Archetype card responsive (already handled by existing component)
- Credit balance and buttons full-width on mobile

---

## Technical Notes

- **Derive-at-read:** Initiator's archetype, OCEAN code, and confidence are computed from facet scores at read time in the use-case — never read stored aggregations.
- **No business logic in handlers:** All credit checks, token validation, and data assembly happen in the use-case layer.
- **Error propagation:** Use-case errors propagate directly to the handler; no remapping.
- **Frontend API pattern:** All API calls use typed Effect `HttpApiClient` with `@workspace/contracts`.
- **Route pattern:** Follow existing route patterns (e.g., `results/$assessmentSessionId.tsx`, `relationship/$analysisId.tsx`).
- **Auth gate pattern:** Use `getSession()` in `beforeLoad` per the Route Loader Auth Pattern in CLAUDE.md.

---

## Out of Scope

- Ritual suggestion screen (Story 6.1)
- Relationship analysis generation (Story 6.2)
- Inline Polar checkout for credit purchase (will show "Purchase credits" CTA linking to purchase flow)
- QR token generation (Story 34-1, already implemented)
- QR drawer UI (Story 34-2, already implemented)
