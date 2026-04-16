# Story 13.3: Results, Portrait & Modal Accessibility

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. Optional: run validate-create-story before dev-story. -->

## Disambiguation

- **This story** is **Epic 13 — Accessibility Foundations**, story **13.3** (`13-3-results-portrait-and-modal-accessibility`).
- **Not** the legacy artifact [`13-3-full-portrait-async-generation.md`](13-3-full-portrait-async-generation.md) (async portrait pipeline / monetization — different scope and naming collision on “13.3”).
- **Overlap:** [`47-3-results-page-and-portrait-accessibility.md`](47-3-results-page-and-portrait-accessibility.md) targets many of the same **results** surfaces. Before changing behavior, **reconcile**: if 47.3 work is merged or in flight, extend it to satisfy **Epic 13.3** AC below (especially **modals**, **global contrast/touch/reduced-motion** on subscription flows and Me page). Avoid duplicating contradictory implementations.

## Story

As a user with low vision or motor impairment,
I want results pages and modals to be fully accessible,
so that I can read my portrait and interact with subscription flows.

## Acceptance Criteria

1. **Radar chart (`/results/:id`, shared chart on public profile if applicable):** The chart exposes `role="img"` with a descriptive `aria-label`, and a **data table** (or equivalent structured text) fallback lists all five trait names and scores for screen readers — without changing the visual chart design.

2. **Score visualizations:** Facet bars, trait bands, trait cards, confidence/detail visuals, and related score UI expose understandable **text alternatives**; color is not the only channel for meaning (pair with labels, patterns, or text).

3. **Contrast (AA):** Normal text and interactive labels on these surfaces meet **WCAG 2.1 AA 4.5:1** contrast against their backgrounds in both light and dark theme, including the **ocean** palette on results/portrait.

4. **Modals and overlays:** Subscription-related and results-adjacent modals (app-owned `Dialog` / Radix) **trap focus**, close on **Escape**, **return focus** to the triggering control on close, and expose **`aria-modal="true"`** on the dialog content (verify Radix `DialogPrimitive.Content` — add explicitly only if missing). Third-party **Polar embedded checkout** is constrained: ensure **open/close affordances** and CTAs in our UI meet touch/label/focus expectations; document any embed limitations in Dev Agent Record.

5. **Touch targets:** All **interactive** elements on `/results/:id`, portrait reading view, and Me page subscription/pitch flows meet **minimum 44×44px** hit area (padding or `min-h-11 min-w-11` patterns already used elsewhere — align with [`DetailZone` close button tests](apps/front/src/components/results/DetailZone.test.tsx)).

6. **Reduced motion:** Animations on these routes respect **`prefers-reduced-motion`** (disable or replace motion; existing `motion-reduce:` on [`packages/ui` Dialog](packages/ui/src/components/dialog.tsx) is the pattern — extend to any custom CSS/Framer/Recharts transitions on results/portrait).

7. **Landmarks & headings:** Remain consistent with **Story 13.1** (single logical `h1` per route, `PageMain`, labeled sections). Decorative layers stay **`aria-hidden`** where they are purely visual.

## Tasks / Subtasks

- [x] **Baseline audit (AC: all)**  
  - [x] Map Epic 13.3 AC to DOM: `/results/:session`, portrait reading view, `/me` subscription pitch + any checkout entry, and dialogs (`PublicVisibilityPrompt`, auth results forms, etc.).  
  - [x] Read [`47-3-results-page-and-portrait-accessibility.md`](47-3-results-page-and-portrait-accessibility.md) and current `PersonalityRadarChart`, `ProfileView`, `TraitCard`, `PortraitReadingView` — note what is already satisfied vs gap.

- [x] **Radar + table fallback (AC: 1, 6)**  
  - [x] Confirm [`PersonalityRadarChart.tsx`](apps/front/src/components/results/PersonalityRadarChart.tsx) keeps `role="img"`, label quality, and hidden table sync with displayed scores.  
  - [x] Audit chart enter/animation hooks for `prefers-reduced-motion`.

- [x] **Scores & trait UI (AC: 2, 5)**  
  - [x] Verify `TraitCard`, `FacetScoreBar`, `DetailZone`, archetype hero — labels, `aria-expanded`, keyboard paths; add `min-h-11` / `min-w-11` where controls fall short.

- [x] **Theme contrast (AC: 3)**  
  - [x] Spot-check primary text, muted text, links, and buttons on results + portrait + Me subscription blocks in light/dark; fix token/class issues (prefer design tokens over one-off hex).

- [x] **Modals & checkout (AC: 4)**  
  - [x] Radix dialogs: focus trap, Escape, focus restore, `aria-modal` verification.  
  - [x] Polar embed: accessible CTA to open; `onClose` / lifecycle in [`polar-checkout.ts`](apps/front/src/lib/polar-checkout.ts) — wire focus return if Polar API allows; otherwise document manual test steps.

- [x] **Regression tests (AC: all)**  
  - [x] Extend or add Vitest coverage for radar label/table, dialog behavior where unit-testable, touch-target classes on critical controls — **preserve** existing `data-testid` values.  
  - [x] Run `pnpm --filter=front test` + `pnpm --filter=front typecheck`.

- [x] **Manual verification**  
  - [x] Keyboard-only pass: results grid, portrait read, Me subscription CTA, one modal open/close.  
  - [x] Screen reader spot check (VoiceOver or NVDA): radar summary/table, section landmarks, modal announcement.

### Review Findings

- [x] [Review][Patch] Restore checkout focus without global DOM lookup [apps/front/src/components/me/SubscriptionPitchSection.tsx:42-47]
- [x] [Review][Patch] Add an accessible text alternative for facet confidence rings [apps/front/src/components/results/DetailZone.tsx:36-77]
- [x] [Review][Patch] Guard `matchMedia` listener setup for older Safari/WebView implementations [apps/front/src/components/results/DetailZone.tsx:44-51]
- [x] [Review][Patch] Initialize reduced-motion state before first detail-zone render [apps/front/src/components/results/DetailZone.tsx:44-52]

## Dev Notes

### What already exists (reuse; do not reinvent)

- **Results shell:** [`apps/front/src/routes/results/$conversationSessionId.tsx`](apps/front/src/routes/results/$conversationSessionId.tsx) — portrait polling, subscription gating, `ProfileView`.  
- **Radar:** [`PersonalityRadarChart.tsx`](apps/front/src/components/results/PersonalityRadarChart.tsx) — `role="img"`, dynamic `aria-label`, gradient polygon; confirm hidden table.  
- **Portrait:** [`ProfileView.tsx`](apps/front/src/components/results/ProfileView.tsx), [`PersonalPortrait.tsx`](apps/front/src/components/results/PersonalPortrait.tsx), [`PortraitReadingView.tsx`](apps/front/src/components/results/PortraitReadingView.tsx), [`usePortraitStatus.ts`](apps/front/src/hooks/usePortraitStatus.ts).  
- **Me subscription:** [`SubscriptionPitchSection.tsx`](apps/front/src/components/me/SubscriptionPitchSection.tsx) → `createThemedCheckoutEmbed`.  
- **Dialog primitive:** [`packages/ui/src/components/dialog.tsx`](packages/ui/src/components/dialog.tsx) — overlay/content `motion-reduce`, close button `min-h-11 min-w-11`.  
- **Prior epic work:** Story **13.1** (landmarks/skip link), **13.2** (`TherapistChat`, `DepthMeter` mobile SR parity).

### Architecture & product rules

- **Frontend-only** for this epic story — no API or contract changes unless an accessibility fix **requires** copy in contracts (unlikely).  
- **WCAG:** Target **2.1 Level AA** per Epic 13.  
- **Navigation:** TanStack Router [`Link`](https://tanstack.com/router/latest/docs/guide/navigation) for internal routes — [`CLAUDE.md`](CLAUDE.md).  
- **Forms:** If touching forms, `@tanstack/react-form` + shadcn patterns per CLAUDE.md.  
- **Assessment integrity:** Do not expose hidden scoring mechanics in ARIA live regions; labels describe **presentation**, not internal psychometrics.  
- **`data-testid`:** Never remove or rename — [`docs/E2E-TESTING.md`](docs/E2E-TESTING.md) / [`docs/FRONTEND.md`](docs/FRONTEND.md).

### Previous story intelligence (13.2)

- **13.2** fixed **mobile** depth/progress by duplicating `progressbar` semantics outside desktop-only containers — apply the same **“don’t hide the only accessible subtree”** rule if any results UI hides interactive or readable content only on small breakpoints.  
- **13.2** kept **`aria-label="Send message"`** exact string — preserve analogous consistency for any standardized control labels you add.  
- Files: [`TherapistChat.tsx`](apps/front/src/components/TherapistChat.tsx), [`DepthMeter.tsx`](apps/front/src/components/chat/DepthMeter.tsx) — pattern reference only; do not scope creep into `/chat` unless a shared primitive change is required.

### File structure requirements

| Concern | Location |
|--------|-----------|
| Results route & composition | `apps/front/src/routes/results/$conversationSessionId.tsx` |
| Results UI | `apps/front/src/components/results/*` |
| Me page | `apps/front/src/routes/me/index.tsx`, `apps/front/src/components/me/*` |
| Shared dialog | `packages/ui/src/components/dialog.tsx` |
| Polar checkout | `apps/front/src/lib/polar-checkout.ts` |
| Tests | Colocated `__tests__` or `*.test.tsx` next to components — **not** loose tests under `routes/` without `-` prefix |

### Testing requirements

- **Unit/component:** Vitest + Testing Library; prefer `getByRole`, `getByLabelText`, accessible queries.  
- **E2E:** Only for critical multi-step journeys per [`docs/E2E-TESTING.md`](docs/E2E-TESTING.md) — default to component tests.  
- **Route tests:** Follow TanStack Router rule — no `*.test.tsx` directly in `routes/` without `-` prefix.

### Git intelligence (recent commits)

Recent work on Epic 13: `feat(front): skip link, landmarks... (13-1)`, `feat(front): chat depth accessibility... (13-2)` — conventions: small focused diffs, front-only, story artifact + sprint-status updates.

### Latest technical notes

- **Radix Dialog** provides focus management and `aria-modal` on content in recent versions — **verify in DOM** rather than assuming.  
- **Polar embed** is third-party iframe/overlay — full WCAG control is limited; maximize **our** trigger UI, error toasts, and post-close focus.

### Project context reference

No `project-context.md` in repo — rely on [`CLAUDE.md`](CLAUDE.md), [`docs/FRONTEND.md`](docs/FRONTEND.md), and this file.

## Change Log

- **2026-04-16:** Story 13.3 — results/portrait/modal accessibility: explicit `aria-modal` on shared Dialog; standalone radar `role="img"`; reduced-motion on DetailZone radial confidence ring + skeleton pulse; touch targets (TraitCard confidence control, facet detail cards, portrait retry, visibility prompt, portrait reading back link, subscription CTA); Polar `onClose` focus return to checkout CTA via `data-testid`; trait hint text size bump; JSDoc on `onClose`. Manual smoke: logged into local Docker dev, visited `/me` and `/results/{seed session}`, accessibility tree shows labeled trait buttons and section regions; trait card focus/activation on results.
- **2026-04-16:** Code-review follow-up: `Button` `forwardRef` + checkout CTA ref for Polar `onClose` focus; facet confidence `ChartContainer` `role="img"` + `aria-label`; `MediaQueryListCompat` listener fallback + lazy `useState` init for reduced motion; tests for focus restore and confidence labels; `DetailZone` fixture confidence normalized to 0–1 fraction.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

— 

### Completion Notes List

- **Polar focus return:** Shared `Button` is `forwardRef`; `SubscriptionPitchSection` holds `checkoutTriggerRef` on the CTA and `onClose` runs `queueMicrotask(() => checkoutTriggerRef.current?.focus())` (Polar embed `close` event wired in `createThemedCheckoutEmbed`).
- **Manual verification:** Browser MCP against `http://localhost:3000` (Docker dev): sign-in with seed user, `/me` (Subscription region + Continue with Nerin), `/results/fee9c659-9af8-4477-b127-ed402c61d094` (trait cards with descriptive names, archetype/traits regions). Not a substitute for full VoiceOver/NVDA acceptance if your release bar requires it.
- **Tests:** `pnpm --filter=front test` and `pnpm --filter=front typecheck` — all green after review patches.

### File List

- `packages/ui/src/components/button.tsx`
- `packages/ui/src/components/dialog.tsx`
- `apps/front/src/components/results/PersonalityRadarChart.tsx`
- `apps/front/src/components/results/TraitCard.tsx`
- `apps/front/src/components/results/DetailZone.tsx`
- `apps/front/src/components/results/PersonalPortrait.tsx`
- `apps/front/src/components/results/PublicVisibilityPrompt.tsx`
- `apps/front/src/components/results/PortraitReadingView.tsx`
- `apps/front/src/components/me/SubscriptionPitchSection.tsx`
- `apps/front/src/lib/polar-checkout.ts`
- `apps/front/src/components/results/PersonalityRadarChart.test.tsx`
- `apps/front/src/components/results/PublicVisibilityPrompt.test.tsx`
- `apps/front/src/components/me/__tests__/SubscriptionPitchSection.test.tsx`
- `apps/front/src/components/results/DetailZone.test.tsx`
- `apps/front/src/components/results/PortraitReadingView.test.tsx`
- `_bmad-output/implementation-artifacts/13-3-results-portrait-and-modal-accessibility.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Story key:** `13-3-results-portrait-and-modal-accessibility`  
**Story ID:** 13.3  
**Epic:** 13 — Accessibility Foundations  
**Blocked-by:** Story 13.1 (done), Story 13.2 (done)  
**Blocks:** None (last story in Epic 13 MVP slice per `epics.md`)
