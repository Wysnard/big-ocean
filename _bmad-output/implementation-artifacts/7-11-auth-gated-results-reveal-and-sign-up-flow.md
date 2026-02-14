# Story 7.11: Auth-Gated Results Reveal & Sign-Up Flow

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User who has completed the assessment**,
I want **to be prompted to sign up or sign in before viewing my full results**,
so that **my results are saved to my account and I can access them later, while the platform captures authenticated users at the moment of peak engagement**.

## Acceptance Criteria

1. **Given** I complete the assessment (precision reaches 70%+) and I am NOT signed in
   **When** the celebration moment triggers
   **Then** I see a teaser screen showing:
   - My Geometric Personality Signature (animated reveal with OCEAN shapes)
   - My archetype name (blurred or partially revealed)
   - A headline: "Your Personality Profile is Ready!"
   - A prominent CTA: "Sign Up to See Your Results"
   - A secondary link: "Already have an account? Sign In"
   **And** the full results page is NOT accessible without authentication

2. **Given** I am on the auth-gate teaser screen
   **When** I click "Sign Up to See Your Results"
   **Then** I see an inline sign-up form (email + password) on the teaser page
   **And** the form follows the brand's visual identity (psychedelic tokens, Space Grotesk headings)
   **And** after successful sign-up, I'm redirected to my full results page
   **And** my assessment session is linked to my new account

3. **Given** I am on the auth-gate teaser screen
   **When** I click "Sign In"
   **Then** I see a sign-in form
   **And** after successful sign-in, I'm redirected to my full results page
   **And** my assessment session is linked to my existing account

4. **Given** I complete the assessment and I AM already signed in
   **When** the celebration moment triggers
   **Then** I skip the auth gate entirely
   **And** I go directly to the full results page with archetype reveal animation

5. **Given** I am an anonymous user who closes the browser before signing up
   **When** I return to the same device within 24 hours
   **Then** my session ID is preserved (localStorage)
   **And** I can resume and complete the auth gate to view results

6. **Given** I am in an active assessment session (`/chat?sessionId=...` or `/results/$sessionId`) and unauthenticated
   **When** I navigate to sign in/sign up and successfully authenticate
   **Then** the same assessment session is linked to my account via `anonymousSessionId`
   **And** I return to the originating flow with session context preserved

## Tasks / Subtasks

- [x] Task 1: Canonicalize results route entry and auth-gate orchestration (AC: #1, #4)
  - [x] Use `/results/$sessionId` as canonical full-results route for reveal/gated flow
  - [x] Update `/results` query route behavior to redirect to `/results/$sessionId` when `sessionId` exists
  - [x] Ensure chat "View Results" actions keep routing to `/results/$sessionId`
  - [x] Keep facet evidence deep-link behavior working after route normalization

- [x] Task 2: Create teaser auth gate component at results entry (AC: #1)
  - [x] Create `apps/front/src/components/ResultsAuthGate.tsx`
  - [x] Render GeometricSignature reveal animation (motion-safe)
  - [x] Render blurred/partially obscured archetype name and locked-reveal framing
  - [x] Include required CTA copy and secondary sign-in link copy from acceptance criteria
  - [x] Add structural `data-slot` attributes (`results-auth-gate`, `results-auth-gate-signup-cta`, `results-auth-gate-signin-cta`)

- [x] Task 3: Implement inline sign-up path with session linking (AC: #2)
  - [x] Add inline sign-up form (email/password) inside `ResultsAuthGate`
  - [x] Enforce inline validation: email format + password length >= 12
  - [x] Use `useAuth().signUp.email(email, password, name?, anonymousSessionId=sessionId)` for anonymous-to-auth linking
  - [x] On success, refresh auth session state and navigate to full results render path
  - [x] Keep form styling semantic-token based (`bg-card`, `text-foreground`, `border-border`, `font-heading`)

- [x] Task 4: Implement inline sign-in path and redirect (AC: #3)
  - [x] Add inline sign-in form variant (email/password)
  - [x] Use `useAuth().signIn.email(email, password, anonymousSessionId=sessionId)` and handle auth/network errors with inline messaging
  - [x] On success, navigate to full results render path and re-enable results query
  - [x] Do not use legacy page-level redirect forms that hard-navigate to `/dashboard`

- [x] Task 5: Enforce "no full results without auth" in UI data flow (AC: #1)
  - [x] Gate full results components behind `isAuthenticated`
  - [x] Prevent `useGetResults(sessionId)` from firing until auth gate is satisfied (`enabled` guard)
  - [x] Keep loading/error states coherent for unauthenticated users (teaser shown instead of results errors)

- [x] Task 6: Preserve 24-hour anonymous resume behavior for auth gate completion (AC: #5)
  - [x] Store pending gated session context in localStorage with timestamp
  - [x] Allow resume within 24h window and prefill gate state from stored session ID
  - [x] Show explicit expired-state UX when >24h (sign up + start-fresh actions)
  - [x] Clear localStorage gate context after successful authentication or explicit reset

- [x] Task 7: Keep existing chat/results milestone behavior intact (AC: #1, #4)
  - [x] Preserve chat celebration trigger at >=70% confidence
  - [x] If authenticated, continue direct-to-results experience
  - [x] If unauthenticated, route to gated teaser instead of direct full reveal
  - [x] Do not regress sign-up modal or evidence panel behavior from Story 7.10

- [x] Task 8: Brand + accessibility compliance for gate forms and teaser (AC: #1, #2, #3)
  - [x] Use Space Grotesk/semantic typography tokens (`font-heading`, `display-*` as appropriate)
  - [x] Ensure touch targets >=44px and mobile-first layout at 375px
  - [x] Respect `prefers-reduced-motion` for reveal animation
  - [x] Associate labels/errors correctly (`aria-describedby`) and preserve keyboard-first flow

- [x] Task 9: Validation and regression testing (AC: #1-#5)
  - [x] Add/extend component tests for `ResultsAuthGate` (sign-up, sign-in, validation, CTA switching)
  - [x] Add route-level tests to confirm auth bypass and unauth gate behavior
  - [x] Add regression checks for chat -> results navigation and facet deep-link transitions
  - [x] Run: `pnpm lint`, `pnpm test:run`, and targeted front route tests

- [x] Task 10: Link active assessment sessions from standalone auth routes (AC: #6)
  - [x] Propagate `sessionId` + safe `redirectTo` from active assessment contexts when navigating to `/login` and `/signup`
  - [x] Update `/login` and `/signup` routes to accept `sessionId` search params and pass context into auth forms
  - [x] Ensure `login-form` and `signup-form` call `useAuth().signIn.email(...)` / `useAuth().signUp.email(...)` with `anonymousSessionId`
  - [x] Preserve `sessionId` on post-auth redirect for `/chat` and `/results` targets
  - [x] Add helper tests for auth-link query construction and post-auth redirect behavior

## Dev Notes

### Current Implementation Reality (Must Account For)

1. The frontend currently has **two results entry patterns**:
   - `/results?sessionId=...` (`apps/front/src/routes/results.tsx`)
   - `/results/$sessionId` (`apps/front/src/routes/results/$sessionId.tsx`)

2. Chat currently navigates to `/results/$sessionId`, while facet navigation currently points to `/results` with search params.

3. Current reusable auth forms (`apps/front/src/components/auth/signup-form.tsx`, `apps/front/src/components/auth/login-form.tsx`) hard-redirect to `/dashboard`; they are not drop-in suitable for inline results-gate UX.

4. Better Auth anonymous linking exists in infrastructure and is required for both auth paths:
   - Frontend passes `anonymousSessionId` in both sign-up and sign-in from the results gate and from standalone `/login` + `/signup` when session context is present
   - Backend Better Auth hooks link `assessment_session.user_id` in `packages/infrastructure/src/context/better-auth.ts` on:
     - `databaseHooks.user.create.after` (sign-up path)
     - `databaseHooks.session.create.after` (sign-in path)
   - Backend also backfills `assessment_message.user_id` for historical user-role messages in the linked session
   - There is no separate persisted "results" table; results are derived from session evidence, so session ownership is the source of truth

### Implementation Blueprint

- Keep Story 7.9 visual redesign intact for authenticated users.
- Insert auth gate before full results rendering.
- Reuse existing OCEAN/Geometric components instead of creating new reveal primitives.
- Prefer route normalization over introducing a third results path.
- Keep all gate UI in `apps/front/src/components/ResultsAuthGate.tsx`; keep routes as orchestration shells.

### Architecture Compliance Requirements

- Continue using TanStack Router + TanStack Query patterns already in project.
- Continue Better Auth session-cookie model (`credentials: include`) with `useAuth()` client hooks.
- Keep anonymous-to-auth linking in existing Better Auth database hooks (user-create + session-create); do not duplicate linkage logic in ad-hoc endpoints.
- Treat `assessment_session.user_id` as the canonical ownership link for access to computed results.
- Ensure auth entry points preserve and forward active assessment context (`sessionId`) when routing through `/login` and `/signup`.
- No new auth library, no local JWT handling, no ad-hoc credential storage.
- Keep domain/application boundaries intact (frontend gate logic in `apps/front`, auth linkage in existing infra layer).

### Library / Framework Requirements

- Auth client: `better-auth/react` via existing `apps/front/src/lib/auth-client.ts`
- Routing: `@tanstack/react-router` file routes
- Data fetching: existing `useGetResults` query hook with `enabled` gating
- UI primitives: `@workspace/ui` Button/Dialog/Input patterns + semantic classes
- Visual identity assets: existing `GeometricSignature` / OCEAN shape system from Story 7.4

### File Structure Requirements

```
apps/front/src/
  components/
    ResultsAuthGate.tsx                  # NEW: teaser + inline sign-up/sign-in
  routes/
    results.tsx                          # MODIFY: redirect/canonicalization + gate orchestration
    results/$sessionId.tsx               # MODIFY: gate-or-full-results conditional rendering
  components/auth/
    signup-form.tsx                      # MODIFY: consume optional session context and pass anonymousSessionId
    login-form.tsx                       # MODIFY: consume optional session context and pass anonymousSessionId
  hooks/
    use-auth.ts                          # MODIFY: support anonymousSessionId on both sign-up and sign-in + session refresh
    use-assessment.ts                    # MODIFY: ensure results query can be disabled until authenticated
  lib/
    auth-session-linking.ts              # NEW: derive active session + safe auth redirect/search params
  components/
    TherapistChat.tsx                    # VERIFY only (navigation path and non-regression)
    FacetSidePanel.tsx                   # MODIFY if needed to match canonical route
```

### Testing Requirements

- Unit/component:
  - `ResultsAuthGate` CTA mode switching (teaser -> sign-up -> sign-in)
  - Validation messages (email invalid, password <12)
  - Successful auth callback path and redirect intent

- Route integration:
  - Unauthenticated user hitting results path sees teaser gate (not full results)
  - Authenticated user bypasses gate and sees full results
  - `/results?sessionId=` correctly canonicalizes to `/results/$sessionId`
  - `/login` and `/signup` preserve active assessment context and return users to sessioned `/chat` or `/results`

- Regression:
  - Chat celebration still links correctly at >=70%
  - Facet panel deep-link to results still works
  - Existing results visual sections remain unchanged once authenticated

### Anti-Patterns (Do Not Do)

- Do not create a separate `/results-gate` route; keep gate at results entry.
- Do not reuse legacy auth pages with hard redirects inside inline gate flow.
- Do not fetch full results data before auth state allows it.
- Do not add hard-coded slate/blue/purple color classes for new gate UI.
- Do not break Story 7.9 depth-zone/theming implementation.
- Do not remove existing anonymous-session linking in Better Auth; extend it via existing hook contract.

### Previous Story Intelligence

- **From Story 7.10 (ready-for-dev):**
  - Chat now surfaces results transition at >=70% and already uses `/results/$sessionId` links.
  - Sign-up modal exists as early conversion touchpoint; this story must add mandatory reveal gate without regressing that behavior.
  - Data-slot coverage and semantic-token discipline were emphasized.

- **From Story 7.9 (done):**
  - Results UI is componentized and heavily restyled; gate insertion should wrap/orchestrate existing components, not rewrite them.
  - Motion-safe and semantic token usage is a hard requirement.

- **From Stories 7.4/7.5/7.7:**
  - OCEAN shapes, trait colors, and avatar/illustration systems are already available and should be reused for gated teaser reveal.

### Git Intelligence Summary

Recent commit pattern (`git log --oneline -n 5`):
- `cf5d318 feat(story-7-9): Results page visual redesign with archetype theming (Story 7.9) (#38)`
- `ab4f476 fix: 7-7 story`
- `7b86ffc fix: remove git ignore file`
- `91311a1 chore: clean up epic 7`
- `06f2d1d fix: story 7-4`

Actionable insight:
- Story 7.x work has been implemented with large frontend-focused commits and explicit sprint-status transitions.
- Story files in this repo embed concrete file-level implementation guardrails; follow this format to minimize dev ambiguity.

### Latest Tech Information (researched 2026-02-13)

Source: npm registry (`npm view <package> version`)

| Technology | Repo Version | Latest Published | Guidance For Story 7.11 |
|-----------|--------------|------------------|---------------------------|
| `better-auth` | `1.5.0-beta.11` (catalog) | `1.4.18` | Keep current pinned project version for this story; do not downgrade/upgrade during gate implementation. |
| `@better-auth/drizzle-adapter` | `1.5.0-beta.11` (catalog) | `1.5.0-beta.9` | Stay aligned with workspace catalog; treat auth changes as compatibility-sensitive. |
| `@tanstack/react-router` | `^1.132.0` (front) | `1.159.6` | No router upgrade in this story; focus on route normalization and gate behavior. |
| `@tanstack/react-query` | `^5.66.5` (front) | `5.90.21` | Use existing query APIs; gate with `enabled` rather than version migration. |
| `react` | `^19.2.0` | `19.2.4` | No framework upgrade required for this story. |
| `tailwindcss` | `^4.0.6` | `4.1.18` | Continue semantic token classes and existing Tailwind v4 setup. |

### Project Context Reference

- `project-context.md` was not found in the workspace at generation time.
- Story context was derived from epics, UX, architecture shards, previous implementation artifacts, and live codebase inspection.

### References

- `_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md` (Story 7.11 requirements + technical details)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (sign-up gate strategy, 24h resume, inline form requirements)
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md` (Better Auth, NIST 12+ password, anonymous-to-user linking)
- `_bmad-output/planning-artifacts/architecture/decision-5-testing-strategy.md` (testing approach expectations)
- `apps/front/src/routes/results.tsx` (query-route results implementation)
- `apps/front/src/routes/results/$sessionId.tsx` (param-route results implementation)
- `apps/front/src/components/TherapistChat.tsx` (chat->results transition behavior)
- `apps/front/src/components/FacetSidePanel.tsx` (results deep-link behavior)
- `apps/front/src/hooks/use-auth.ts` (auth actions + anonymous session ID support)
- `apps/front/src/components/auth/signup-form.tsx` and `apps/front/src/components/auth/login-form.tsx` (legacy redirect behavior)
- `packages/infrastructure/src/context/better-auth.ts` (session linkage hook)
- `docs/FRONTEND.md` (`data-slot` and frontend conventions)

## Story Completion Status

- Story context document created with exhaustive epic/UX/architecture/codebase intelligence.
- Status set to **ready-for-dev**.
- Completion note: **Ultimate context engine analysis completed - comprehensive developer guide created**.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- Implement Story 7.11 auth-gated results flow with canonical `/results/$sessionId` routing, auth guard orchestration, and query gating.
- Add `ResultsAuthGate` teaser + inline auth forms with 24-hour resume storage and expired-session UX.
- Ensure anonymous-to-auth ownership linkage in Better Auth for both sign-up and sign-in (`assessment_session.user_id` + message backfill).
- Extend standalone `/login` and `/signup` flows to preserve active assessment context and pass `anonymousSessionId`.
- Validate with full regression suite and linting before moving story to review.

### Debug Log References

- `pnpm lint` (turbo) passed; existing warnings only in `apps/front/src/components/TherapistChat.tsx` and `apps/api/src/index.ts`.
- `pnpm test:run` (turbo) passed across `@workspace/domain`, `api`, and `front`.
- `pnpm --filter front build` passed during implementation verification.

### Completion Notes List

- Implemented canonical results routing and auth-gate orchestration (`/results` query redirect + `/results/$sessionId` guard path).
- Added `ResultsAuthGate` teaser/inline sign-up/sign-in experience with required CTA copy, validation, motion-safe reveal, and expired-state handling.
- Added 24-hour pending-gate persistence utilities with resume and explicit expiration behavior.
- Enforced no-results-without-auth by gating results query enablement on authenticated session state.
- Preserved milestone/chat navigation behavior and facet deep-link behavior with regression tests.
- Implemented backend session linkage on both auth paths via Better Auth hooks:
  - `databaseHooks.user.create.after` (sign-up)
  - `databaseHooks.session.create.after` (sign-in)
  with backfill for `assessment_message.user_id`.
- Extended standalone `/login` and `/signup` to preserve active assessment context, pass `anonymousSessionId`, and restore sessioned `/chat` or `/results` after auth.
- Updated Epic/Story documentation to reflect active-session linkage decision and acceptance coverage (AC #6 / Task 10).
- All Story 7.11 tasks/subtasks are complete; story moved to `review`.

### File List

- `_bmad-output/implementation-artifacts/7-11-auth-gated-results-reveal-and-sign-up-flow.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md`
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-14.md`
- `apps/front/src/components/FacetSidePanel.test.tsx`
- `apps/front/src/components/MobileNav.tsx`
- `apps/front/src/components/ResultsAuthGate.test.tsx`
- `apps/front/src/components/ResultsAuthGate.tsx`
- `apps/front/src/components/UserNav.tsx`
- `apps/front/src/components/auth/login-form.tsx`
- `apps/front/src/components/auth/signup-form.tsx`
- `apps/front/src/hooks/__mocks__/use-auth.ts`
- `apps/front/src/hooks/use-auth.ts`
- `apps/front/src/lib/auth-session-linking.test.ts`
- `apps/front/src/lib/auth-session-linking.ts`
- `apps/front/src/lib/results-auth-gate-storage.test.ts`
- `apps/front/src/lib/results-auth-gate-storage.ts`
- `apps/front/src/routes/login.tsx`
- `apps/front/src/routes/results-route.test.tsx`
- `apps/front/src/routes/results-session-route.test.tsx`
- `apps/front/src/routes/results.tsx`
- `apps/front/src/routes/results/$sessionId.tsx`
- `apps/front/src/routes/signup.tsx`
- `packages/infrastructure/src/context/better-auth.ts`

## Change Log

- 2026-02-14: Implemented Story 7.11 auth-gated results flow end-to-end, including active-assessment session linkage across results gate and standalone auth routes; validated with lint/test suites and moved status to `review`.
