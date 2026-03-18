# Sprint Change Proposal: Wire Resend into Better Auth

**Date:** 2026-03-19
**Triggered by:** Story 31-7 (Email Infrastructure) — Resend and Better Auth coexist but aren't integrated
**Proposed by:** Vincentlay
**Scope classification:** Minor — direct implementation by dev team

---

## Section 1: Issue Summary

**Problem statement:** Better Auth and Resend email infrastructure exist independently. Users currently cannot verify their email address or reset their password. The Resend SDK is installed and working (Story 31-7, merged PR #144), and Better Auth natively supports email verification and password reset via callback hooks — but these hooks were left unimplemented (`requireEmailVerification: false`, no `sendResetPassword` callback).

**Context:** Discovered during PR verification of Sprint Step 1. The implementation readiness report previously flagged: "No explicit authentication FRs (sign up, login, password reset) — implied but not formalized."

**Evidence:**
- `better-auth.ts` line 341: `requireEmailVerification: false`
- No `sendResetPassword` or `sendVerificationEmail` callbacks configured
- `ResendEmailRepository` exists and works (PR #144 merged)
- Better Auth docs confirm these are simple async callbacks: `({ user, url, token }) => {}`
- PRD FR50 ("Users can create an account and authenticate") lacks explicit verification/reset FRs

---

## Section 2: Impact Analysis

### Epic Impact
- **Epic 1** (Infrastructure Auth Setup): Add Story 31-7b to wire Resend into Better Auth callbacks
- **Epic 2** (Assessment Backend Services): No changes — email infra from 31-7 is reused as-is
- **All other epics:** Unaffected

### Story Impact
- **New story:** 31-7b — Wire Resend into Better Auth (email verification + password reset)
- **No existing stories modified** — this is purely additive

### Artifact Conflicts
- **PRD:** Add FR59 (email verification) and FR60 (password reset) — currently implicit, needs formalization
- **Architecture:** Add ADR-9 documenting dual Resend integration pattern (Better Auth callbacks + Effect repository)
- **UX Design:** Add 3 new pages (`/forgot-password`, `/reset-password`, `/verify-email`) to component inventory, auth gates, and flow documentation
- **DEPLOYMENT.md / .env.example:** Already updated with Resend env vars (PR #144)

### Technical Impact
- **Backend:** Small — 2 callbacks added to `better-auth.ts`, 2 email templates created, raw Resend SDK instantiated in Better Auth layer (Promise-based, consistent with Polar webhook pattern)
- **Frontend:** Medium — 3 new routes, 1 login form modification, 1 signup flow redirect change
- **Database:** None — Better Auth handles verification token storage internally
- **Tests:** Email template unit tests + auth flow tests needed

---

## Section 3: Recommended Approach

**Selected approach:** Direct Adjustment — add new story within existing sprint structure

**Rationale:**
- Low risk: both systems are proven independently, this is integration wiring
- Low effort: backend change is ~50 lines (callbacks + Resend client instantiation), templates follow existing pattern
- No rollback needed, no MVP scope change
- Strengthens security posture (aligns with NFR9: 12+ char passwords, compromised credential checks)
- Natural extension of Story 31-7 email infrastructure

**Effort estimate:** Medium (mostly frontend — 3 new route pages)
**Risk level:** Low
**Timeline impact:** None — fits as a new story in current sprint

---

## Section 4: Detailed Change Proposals

### 4.1 Story Definition

**Story 31-7b:** Wire Resend into Better Auth (email verification + password reset)

**Acceptance Criteria:**
1. Signup sends verification email via Resend; user must verify before creating a session
2. Verification link auto-signs in user and redirects to `/profile`
3. "Forgot password?" link on login form leads to `/forgot-password`
4. Password reset email sent via Resend with reset link
5. Reset link leads to `/reset-password` where user enters new password (12+ chars)
6. Unverified users signing in get verification email resent automatically

### 4.2 Backend Changes

**File: `packages/infrastructure/src/context/better-auth.ts`**
- Add `const resend = new Resend(Redacted.value(config.resendApiKey))` alongside Polar client setup
- Add `sendResetPassword` callback using `void resend.emails.send().catch()` pattern (fire-and-forget, prevents timing attacks)
- Add `emailVerification.sendVerificationEmail` callback with same pattern
- Set `requireEmailVerification: true`
- Set `autoSignInAfterVerification: true`
- Add imports for `Resend` SDK and 2 email template render functions

**File: `packages/infrastructure/src/email-templates/password-reset.ts`** (CREATE)
- Pure function `renderPasswordResetEmail({ userName, resetUrl })` → HTML string
- Same pattern as existing `drop-off-re-engagement.ts`: template literal, `escapeHtml`, dark theme, purple CTA button

**File: `packages/infrastructure/src/email-templates/email-verification.ts`** (CREATE)
- Pure function `renderEmailVerificationEmail({ userName, verifyUrl })` → HTML string
- Same pattern, welcome tone: "Thanks for signing up. Verify your email to get started with Nerin."

### 4.3 Frontend Changes

**File: `apps/front/src/components/auth/login-form.tsx`**
- Add "Forgot password?" link between password field and submit button
- Uses `Button variant="link" asChild` + TanStack Router `Link to="/forgot-password"`

**File: `apps/front/src/routes/forgot-password.tsx`** (CREATE)
- Email input → `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })`
- Always shows "Check your email" (prevents email enumeration)
- Redirects authenticated users to `/profile`

**File: `apps/front/src/routes/reset-password.tsx`** (CREATE)
- Reads `?token=xxx` or `?error=INVALID_TOKEN` from URL
- New password form with 12-char minimum + confirmation
- Calls `authClient.resetPassword({ newPassword, token })`
- Success → redirect to `/login`

**File: `apps/front/src/routes/verify-email.tsx`** (CREATE)
- Three states: verified (link to profile), error (expired token + resend), pending (check inbox + resend)
- Resend button uses `authClient.sendVerificationEmail({ email, callbackURL: "/profile" })`

**File: `apps/front/src/components/auth/signup-form.tsx`**
- After signup, redirect to `/verify-email` instead of `/profile` or `/results`
- Anonymous session linking still happens via Better Auth `databaseHooks` (unaffected)

**File: `apps/front/src/lib/auth-client.ts`**
- Add `requestPasswordReset` to destructured exports from `authClient`

### 4.4 Planning Artifact Changes

**PRD (`prd.md`):**
- Add FR59: "Users must verify their email address after signup before creating a session"
- Add FR60: "Users can reset their password via email if they forget it"

**Epics (`epics.md`):**
- Add FR59, FR60 to functional requirements inventory
- Add FR59-FR60 → Epic 1 mapping in FR-to-Epic table

**Architecture (`architecture.md`):**
- Update Resend external dependency description to include Better Auth auth emails
- Update core pattern #6 to document dual integration (auth callbacks + Effect repository)
- Update Email row in tech stack table
- Add ADR-9: Better Auth + Resend Email Integration (documents why two patterns coexist)

**UX Design (`ux-design-specification.md`):**
- Add `forgot-password`, `reset-password`, `verify-email` to Auth component inventory
- Add 3 new routes to auth gates table
- Add email verification flow (post-signup) and password reset flow step-by-step descriptions
- Add "Forgot password?" link note to login form component

---

## Section 5: Implementation Handoff

**Scope classification:** Minor — direct implementation by dev team

**Implementation order:**
1. Backend: email templates (2 files) → Better Auth config changes (1 file)
2. Frontend: auth-client export update → login form link → 3 new route pages → signup redirect
3. Planning: PRD → Epics → Architecture → UX Design updates
4. Tests: email template tests + route tests

**Success criteria:**
- User can sign up → receives verification email → clicks link → auto-signed in → lands on `/profile`
- User can click "Forgot password?" → receives reset email → clicks link → enters new password → signs in
- Unverified user signing in triggers automatic verification email resend
- All existing tests pass (no regressions)
- New email template tests pass
- Manual verification: emails render correctly in common email clients

**Dependencies:**
- Resend API key must be configured (already documented in DEPLOYMENT.md)
- Domain must be verified in Resend dashboard (already documented)
