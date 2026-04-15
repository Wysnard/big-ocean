# Story 6.2: Invite Ceremony Dialog

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a user,

I want to invite someone I care about through a warm ceremony,

So that the invitation feels intentional and generous, not transactional.

## Acceptance Criteria

1. **Given** the user taps the **invite ceremony card** at the bottom of the **Circle** page **When** the ceremony UI opens **Then** `InviteCeremonyDialog` presents the **locked** reward-first ceremony copy (exact wording from [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §10.7 “Invite Ceremony Copy (LOCKED)”] — see Dev Notes), **not** paraphrased marketing language.
2. **And** the dialog includes an **optional** name field as an intentionality pause — **TanStack Form** + shadcn form primitives; placeholder **“Their name (optional)”**; **no** `useState` per field ([CLAUDE.md](CLAUDE.md) forms rule).
3. **And** the user can choose three share paths:
   - **Share a QR to scan** — opens the existing **QR drawer** UI (reuse `QrDrawerContent` + token lifecycle; see Dev Notes). Epic text says `useQRToken`; the implemented hook is **`useQrDrawer`** ([apps/front/src/hooks/useQrDrawer.ts](apps/front/src/hooks/useQrDrawer.ts)) backed by **`generateToken` / `fetchTokenStatus`** ([apps/front/src/lib/qr-token-api.ts](apps/front/src/lib/qr-token-api.ts)).
   - **Copy a link to send** — copies the **same** share URL as the QR flow; **Sonner** toast **“Link copied”** (or equivalent per [docs/FRONTEND.md](docs/FRONTEND.md)).
   - **Share via…** — **Web Share API** when available (`navigator.share` with `url`); graceful fallback (e.g. copy-only hint or toast) when not.
4. **And** the dialog is built on **shadcn `Dialog`**: focus trap, **Escape** closes, **soft close** (overlay / X) with **no** guilt copy (per UX spec).
5. **And** **invite placement** exists in **all** of:
   - **Circle** — static **InviteCeremonyCard** after the person card list (bottom of scroll), full-width, teaser *“Invite someone you care about →”* ([Source: UX spec §11.4 `InviteCeremonyCard`](_bmad-output/planning-artifacts/ux-design-specification.md)).
   - **Me → Your Circle** — same card pattern inside / adjacent to [YourCirclePreviewSection](apps/front/src/components/me/YourCirclePreviewSection.tsx) (do **not** introduce aggregate “invite N friends” gamification; Intimacy Principle).
   - **Public profile (FR45)** — logged-in, assessed viewer on **another** user’s profile: contextual CTA opens the same dialog; support **`presetName`** from profile display name when opening from this entry (UX: `InviteCeremonyDialog` `presetName?: string`). Today [PublicProfileCTA](apps/front/src/components/results/PublicProfileCTA.tsx) routes `authenticated-assessed` to `/relationship-analysis?with=…` — replace/wire so the **primary** flywheel action matches Journey 7 (open ceremony). If “already in Circle” / existing letter UX exists later, defer unless already in codebase; do **not** block 6.2 on full Journey 6 edge cases.
6. **And** **no** follower/friend/fan language; **no** credit balance or paywall copy in the ceremony (credits retired).
7. **And** **tests**: Vitest coverage for dialog open/close, copy path (clipboard mocked), and card `aria`/`data-testid` contracts; **new** stable `data-testid` values only **added** — **never** remove/rename existing ids ([CLAUDE.md](CLAUDE.md) e2e rule).
8. **And** `pnpm typecheck` passes for touched packages.

**Explicitly out of scope for 6.2 (do not implement as part of this story):**

- **Invite landing page** route `/invite/$inviteId` and invite-id–based URLs (Journey 7 diagram shows this; current QR flow uses **`/relationship/qr/:token`** per [generate-qr-token.use-case.ts](apps/api/src/use-cases/generate-qr-token.use-case.ts)). Align copy and analytics with **existing** share URLs unless a separate epic adds invite-id routes.
- **Sunday weekly letter** inline invite placement — highest-converting slot per UX, but **not** listed in [epics.md Story 6.2](_bmad-output/planning-artifacts/epics.md) acceptance criteria; treat as follow-up (likely with weekly letter stories).

## Tasks / Subtasks

### Task 1 — Locked copy module (AC: 1)

- [x] **1.1** Add `invite-ceremony-copy.ts` (suggested path: `apps/front/src/components/invite/`) exporting the **exact** multi-paragraph strings from UX §10.7 (LOCKED block through button labels). Single source for dialog + any tests; **no** scattered string literals.
- [x] **1.2** Map epics “five-beat” bullet list to the UX block — they are the same narrative; UX block is authoritative for punctuation and line breaks.

### Task 2 — Token + share model (AC: 3, 8)

- [x] **2.1** On dialog **open**, ensure a **valid QR token + `shareUrl`** is available for copy/native share (reuse server **`generateQrToken`** via [qr-token-api.ts](apps/front/src/lib/qr-token-api.ts) / Effect client — **no** raw `fetch`).
- [x] **2.2** **Polling / TTL:** Reuse or extract logic from `useQrDrawer` (55-min regen threshold, 60s poll) so link stays valid while dialog open; avoid duplicating business rules inconsistently.
- [x] **2.3** **Optional name field:** If backend persistence is **not** extended in this story, store name **only** in form state for the ceremony UX and document **follow-up** (DB column or token metadata). Do **not** silently drop without a product note in this file’s Completion Notes when implementing.

### Task 3 — `InviteCeremonyDialog` + `InviteCeremonyCard` (AC: 1–6)

- [x] **3.1** Implement `InviteCeremonyDialog` (shadcn Dialog, scrollable on small viewports) with heading **INVITE SOMEONE YOU CARE ABOUT**, ceremony body from Task 1, optional name field (TanStack Form), three primary actions.
- [x] **3.2** **QR path:** Compose existing [QrDrawerContent](apps/front/src/components/relationship/QrDrawer.tsx) inside a **Drawer** (vaul) opened from the dialog’s QR button, **or** lift drawer state alongside dialog — avoid generating **two** independent tokens for one ceremony session.
- [x] **3.3** **InviteCeremonyCard:** Full-width card, `placement` prop for telemetry/analytics if needed (`"circle-bottom" | "me-section" | "public-profile"` per UX), `onOpen` callback, `aria-label` per UX spec §11.4.
- [x] **3.4** **Cross-route open:** Prefer a small **React context** (`InviteCeremonyProvider`) near root or authenticated shell so **Circle**, **Me**, and **public-profile** routes can open the **same** dialog instance with optional `presetName`. Avoid mounting three independent dialogs with divergent state.

### Task 4 — Placements (AC: 5)

- [x] **4.1** [CirclePageContent](apps/front/src/components/circle/CirclePageContent.tsx): append `InviteCeremonyCard` after the relationship list / empty state section.
- [x] **4.2** Me page: integrate card into the Your Circle section composition ([me route](apps/front/src/routes/me/index.tsx) + `YourCirclePreviewSection` or sibling — match visual hierarchy from UX).
- [x] **4.3** [PublicProfileCTA](apps/front/src/components/results/PublicProfileCTA.tsx) (and route wiring): for `authenticated-assessed`, **non–own profile**, open ceremony with `presetName` instead of only linking to legacy relationship-analysis URL (verify target route still exists or migrate consistently).

### Task 5 — Tests & QA (AC: 7–8)

- [x] **5.1** Component tests under `apps/front/src/components/invite/__tests__/` (not under `routes/`).
- [x] **5.2** Cover: locked copy snapshots (or key phrases), dialog dismiss, copy button triggers clipboard + toast.
- [x] **5.3** `pnpm typecheck` and scoped `pnpm test:run` for `apps/front`.

## Dev Notes

### Epic & product context

- **Epic 6** — Circle + invite ceremony; FR coverage **FR28, FR97–FR100** ([epics overview](_bmad-output/planning-artifacts/epics.md)). **Intimacy Principle:** no social scoreboard language; invitation is **self-expression**, not growth hacking.
- **Story 6.1** completed: [6-1-circle-page-and-person-cards.md](_bmad-output/implementation-artifacts/6-1-circle-page-and-person-cards.md) — list API, `CirclePersonCard`, **no** invite ceremony in 6.1 by explicit scope — **6.2** owns ceremony UI.

### Locked ceremony copy (authoritative — implement verbatim)

Import from UX spec §10.7 — **Invite Ceremony Copy (LOCKED)** block:

```text
INVITE SOMEONE YOU CARE ABOUT

Discover the dynamic between you.

When they finish their conversation with Nerin, the two of you get a letter
about your relationship — the parts that click, the parts that clash, and
the unspoken rhythms you've been navigating for years.

You'll also see a side of yourself that only shows up around them.

Most people say it names something they've felt but never put into words.

─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Their side: a 30-minute conversation with Nerin. No forms. No quizzes.
Just someone curious about them.

It stays between the two of you.

Who are you inviting?
[Their name (optional)]

[Share a QR to scan] [Copy a link to send] [Share via...]
```

**Framing rules** (must not violate in UI microcopy): user-facing **“relationship letter”** / **“letter about your dynamic”** — not “relationship analysis” ([UX §10.7 Key Framing Moves](_bmad-output/planning-artifacts/ux-design-specification.md)).

### Architecture compliance (guardrails)

| Rule | Detail |
|------|--------|
| API | `makeApiClient` + `@workspace/contracts` only ([CLAUDE.md](CLAUDE.md)) — follow [api-client.ts](apps/front/src/lib/api-client.ts) |
| Forms | `@tanstack/react-form` + shadcn form components |
| Navigation | TanStack `<Link>` for internal routes; ceremony is modal, not `navigate()` for open |
| Business logic | Token generation stays in API use-cases — dialog **does not** invent new server rules |
| `data-testid` | Add new ids (e.g. `invite-ceremony-card`, `invite-ceremony-dialog`, `invite-ceremony-qr-button`) — **never** rename/remove existing hooks |

### File / module touchpoints (expected)

```
apps/front/src/components/invite/invite-ceremony-copy.ts
apps/front/src/components/invite/InviteCeremonyCard.tsx
apps/front/src/components/invite/InviteCeremonyDialog.tsx
apps/front/src/components/invite/InviteCeremonyProvider.tsx   # if using context
apps/front/src/components/invite/__tests__/...
apps/front/src/components/circle/CirclePageContent.tsx
apps/front/src/components/me/YourCirclePreviewSection.tsx   # or me route composition
apps/front/src/components/results/PublicProfileCTA.tsx
apps/front/src/routes/public-profile.$publicProfileId.tsx   # wiring as needed
apps/front/src/components/relationship/QrDrawer.tsx       # reuse QrDrawerContent / patterns
apps/front/src/hooks/useQrDrawer.ts                         # reference / possible extraction
apps/front/src/lib/qr-token-api.ts                          # token generation
```

### Previous story intelligence (6.1)

- Circle page uses **`useRelationshipAnalysesList`** and client-side sort for `/circle` only — preserve Me preview behavior when touching Your Circle.
- Error copy baseline: **“Your Circle is taking a moment to load.”**
- **GeometricSignature** / OCEAN patterns are **not** required on invite card unless UX explicitly adds — invite card is simpler, warm teaser.

### Reuse / anti-patterns

- **Do** reuse `QrDrawerContent` + `useQrDrawer` patterns for QR — do **not** duplicate QR rendering.
- **Do not** copy raw `fetch` relationship state from older [RelationshipCard.tsx](apps/front/src/components/relationship/RelationshipCard.tsx) — that predates strict HttpApiClient migration; new code stays on Effect client.
- **Do not** add Kitchen sink demos unless also updating `/dev/components` per [CLAUDE.md](CLAUDE.md) — if components stay in `apps/front`, kitchen sink update may be **skipped** (project rule applies to `packages/ui`).

### Testing notes

- Mock `navigator.clipboard.writeText` and `navigator.share` in tests.
- Follow route test placement rules: no `.test.tsx` **in** `routes/` — prefix with `-` or use `__tests__`.

### References

- [Epics — Story 6.2](_bmad-output/planning-artifacts/epics.md) (detailed AC)
- [UX — §10.7 Journey 7, InviteCeremonyCard, InviteCeremonyDialog](_bmad-output/planning-artifacts/ux-design-specification.md)
- [Story 6.1 implementation artifact](_bmad-output/implementation-artifacts/6-1-circle-page-and-person-cards.md)
- [CLAUDE.md](CLAUDE.md) — API client, forms, navigation, `data-testid`
- [docs/FRONTEND.md](docs/FRONTEND.md) — styling / a11y patterns

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Implemented locked copy module, `InviteCeremonyProvider` + context, `InviteCeremonyCard`, and `InviteCeremonyDialog` with TanStack Form optional name (client-only; not sent to API in 6.2).
- Added `useInviteCeremonyQrToken` with isolated TanStack Query keys, same TTL/poll semantics as `useQrDrawer`, single token session for dialog + nested QR drawer (`QrDrawerContent`).
- Placements: Circle page, Me Your Circle preview, public profile CTA (`presetName`); root shell wraps `InviteCeremonyProvider` in `__root.tsx`.
- Tests: new invite component tests; `PublicProfileCTA`, `CirclePageContent`, and `YourCirclePreviewSection` tests wrap provider + `QueryClientProvider`.
- `pnpm typecheck` (monorepo) and `apps/front` `pnpm test` (551 tests) pass.

### File List

- `apps/front/src/components/invite/invite-ceremony-copy.ts`
- `apps/front/src/components/invite/InviteCeremonyCard.tsx`
- `apps/front/src/components/invite/InviteCeremonyDialog.tsx`
- `apps/front/src/components/invite/InviteCeremonyProvider.tsx`
- `apps/front/src/components/invite/__tests__/InviteCeremonyCard.test.tsx`
- `apps/front/src/components/invite/__tests__/InviteCeremonyDialog.test.tsx`
- `apps/front/src/hooks/useInviteCeremonyQrToken.ts`
- `apps/front/src/routes/__root.tsx`
- `apps/front/src/components/circle/CirclePageContent.tsx`
- `apps/front/src/components/me/YourCirclePreviewSection.tsx`
- `apps/front/src/components/results/PublicProfileCTA.tsx`
- `apps/front/src/components/circle/__tests__/CirclePageContent.test.tsx`
- `apps/front/src/components/me/__tests__/YourCirclePreviewSection.test.tsx`
- `apps/front/src/components/results/PublicProfileCTA.test.tsx`

### Review Findings

- [x] [Review][Decision] ALL-CAPS `DialogTitle` hostile to screen readers — kept literal per locked UX spec (D1: accepted)
- [x] [Review][Decision] `PublicProfileCTA` hard-coupled to `InviteCeremonyProvider` — fixed: `useInviteCeremony()` now returns a no-op when provider is absent; no hard crash. [InviteCeremonyProvider.tsx]
- [x] [Review][Decision] Nested `vaul Drawer` inside Radix `Dialog` — fixed: removed nested Drawer; QR view now renders inline inside the same dialog with a Back button. [InviteCeremonyDialog.tsx]
- [x] [Review][Patch] `setTokenData` inside `useQuery` `queryFn` causes state mutation / epoch races — fixed: status queryFn is now read-only; regen triggered via side-effect ref pattern only on status change. [useInviteCeremonyQrToken.ts]
- [x] [Review][Patch] `isLoading` and `error` do not reflect background token regeneration — fixed: error now includes statusQuery.isError; background regen goes through mutation. [useInviteCeremonyQrToken.ts]
- [x] [Review][Patch] `status` returns `"valid"` before first poll confirmation — fixed: status only reports `"valid"` after confirmed by poll OR immediately post-generation while not loading/erroring. [useInviteCeremonyQrToken.ts]
- [x] [Review][Patch] `aria-describedby={undefined}` on `DialogContent` unlinks sr-only description — fixed: removed override; now uses explicit `aria-labelledby` + `aria-describedby` pointing to rendered elements. [InviteCeremonyDialog.tsx]
- [x] [Review][Patch] `navigator.share` non-`AbortError` falls through with misleading "Link copied" toast — fixed: now shows `toast.info("Share unavailable — copying link instead")` before falling back. [InviteCeremonyDialog.tsx]
- [x] [Review][Patch] Web Share `text` and `DialogDescription` hardcoded outside locked copy module — fixed: both exported from `invite-ceremony-copy.ts`. [invite-ceremony-copy.ts, InviteCeremonyDialog.tsx]
- [x] [Review][Patch] Dialog close/dismiss not covered by tests — fixed: test asserts `onOpenChange(false)` via X close button click. [InviteCeremonyDialog.test.tsx]
- [x] [Review][Patch] QR path and native share path not covered by tests — fixed: tests for QR view, Back button, native share, non-AbortError fallback. [InviteCeremonyDialog.test.tsx]
- [x] [Review][Patch] `me-circle-invite` data-testid placement not asserted — fixed: asserted in `YourCirclePreviewSection.test.tsx`. [YourCirclePreviewSection.test.tsx]
- [x] [Review][Defer] `removeQueries` with full prefix key is a blunt instrument [useInviteCeremonyQrToken.ts:42] — deferred, harmless today with isolated `inviteCeremony` prefix
- [x] [Review][Defer] 60s poll + 55min regen threshold leaves a brief expired-link window under clock skew [useInviteCeremonyQrToken.ts:12-13] — deferred, pre-existing from `useQrDrawer`; cosmetic edge at TTL boundary only
- [x] [Review][Defer] `InviteCeremonyCard` teaser copy hardcoded ("Circle", "Invite someone you care about", subtitle) [InviteCeremonyCard.tsx] — deferred, card teaser is not part of the §10.7 locked ceremony copy; card is a UI affordance, not a copy ceremony element
- [x] [Review][Defer] Teaser `→` is `aria-hidden`, diverging from spec string "Invite someone you care about →" [InviteCeremonyCard.tsx:28-30] — deferred, `aria-label` provides full accessible name; visual arrow redundant with `ChevronRight` but not harmful
- [x] [Review][Defer] `presetName` propagation from `PublicProfileCTA` to dialog name field not integration-tested [PublicProfileCTA.test.tsx] — deferred, dialog's `presetName` pre-fill IS tested directly in `InviteCeremonyDialog.test.tsx`
- [x] [Review][Defer] UX §10.7 LOCKED block not in repo — exact wording compliance unverifiable from code alone [invite-ceremony-copy.ts] — deferred, process note; copy was sourced from spec during creation
- [x] [Review][Defer] Re-entrant `openCeremony` while dialog already open reuses live QR session without reset [InviteCeremonyProvider.tsx:26-29] — deferred, production-unreachable in current navigation model; document if multi-surface flows evolve

## Change Log

- 2026-04-15: Story 6.2 implemented — invite ceremony dialog, placements, tests, sprint status → review.
- 2026-04-15: Code review — 3 decision-needed, 10 patch, 7 defer, 6 dismissed.
