# Story 47.4: Modal & Focus Management

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a keyboard user,
I want modals to trap focus correctly,
so that I don't lose my place when a modal opens or closes.

## Acceptance Criteria

1. **Given** the PWYW modal opens from the results page
   **When** the modal becomes active
   **Then** focus moves into the modal content on open
   **And** Tab and Shift+Tab stay trapped within the active dialog
   **And** Escape closes the modal
   **And** closing the modal returns focus to the element that opened it
   **And** body scroll remains locked while the modal is open

2. **Given** the ritual screen opens before relationship analysis
   **When** a keyboard or screen-reader user lands on it
   **Then** the screen exposes dialog semantics with a stable accessible name
   **And** initial focus lands on the primary action in a predictable way
   **And** keyboard users can activate the next step without first tabbing through decorative content

3. **Given** evidence details or adjacent modal-like overlays render on the results surface
   **When** users navigate them with keyboard only
   **Then** close affordances are reachable and clearly labeled
   **And** Escape handling is consistent with the overlay's visual contract
   **And** focus does not drop to the page background while the overlay is active

4. **Given** a modal or dialog closes
   **When** the user returns to the underlying page
   **Then** focus returns to the original trigger or a clear fallback target on the results page
   **And** the underlying page remains in a logical focus order
   **And** no hidden or background controls become focusable while the modal is active

5. **Given** modal focus-management work is complete
   **When** automated and manual regression checks run
   **Then** focused front-end tests cover dialog semantics, open/close behavior, Escape handling, and focus restoration
   **And** at least one manual keyboard-only walkthrough validates the results PWYW flow and ritual-entry flow
   **And** body scroll lock is spot-checked on a real browser flow, especially for mobile-sized viewports

## Tasks / Subtasks

- [x] Task 1: Audit the current modal and dialog surfaces before changing behavior (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 Confirm which focus-management guarantees are already provided by `@workspace/ui` Radix dialog primitives in `packages/ui/src/components/dialog.tsx`
  - [x] 1.2 Verify the current `PwywModal` implementation in `apps/front/src/components/results/PwywModal.tsx` preserves Radix focus trapping, `aria-modal`, and close-button semantics despite its custom scroll layout
  - [x] 1.3 Verify the current `RitualScreen` implementation in `apps/front/src/components/relationship/RitualScreen.tsx` behaves like a true modal surface and does not leave background content keyboard-reachable
  - [x] 1.4 Audit `apps/front/src/components/results/EvidencePanel.tsx` and any adjacent results overlays to determine whether they should keep inline-dialog semantics or be tightened for consistent focus behavior

- [x] Task 2: Tighten PWYW modal open/close focus behavior without redesigning the experience (AC: 1, 4, 5)
  - [x] 2.1 Keep the current results-route auto-open and re-open behavior in `apps/front/src/routes/results/$conversationSessionId.tsx`; this story should improve focus handling, not change monetization timing
  - [x] 2.2 Ensure the modal receives predictable initial focus on open even when auto-opened after the delayed timer
  - [x] 2.3 Confirm focus returns to the actual portrait-unlock trigger when the modal is user-opened from the inline CTA, and define a sensible fallback when the modal was auto-opened
  - [x] 2.4 Preserve body scroll lock while the modal is open and verify the internal scroll container does not create a broken keyboard trap

- [x] Task 3: Make the ritual screen's dialog behavior explicit and behaviorally correct (AC: 2, 4, 5)
  - [x] 3.1 Preserve the visual full-screen ritual treatment in `apps/front/src/components/relationship/RitualScreen.tsx`; do not redesign the pacing or copy
  - [x] 3.2 Confirm the accessible name comes from the visible heading and that decorative hieroglyph layers remain hidden from assistive technology
  - [x] 3.3 Keep initial focus on the Start action unless audit findings show a better primary target
  - [x] 3.4 Verify the route or page shell that renders the ritual screen does not leave competing focusable content exposed behind the dialog surface

- [x] Task 4: Normalize close and escape behavior for results overlays that present as dialogs (AC: 3, 4, 5)
  - [x] 4.1 Review whether `EvidencePanel` should keep its current inline `role="dialog"` contract or be converted to shared dialog primitives for better focus trapping
  - [x] 4.2 If `EvidencePanel` remains inline, add the minimum focus containment and restoration behavior needed so keyboard users do not tab into obscured background content
  - [x] 4.3 Keep close buttons explicitly labeled and verify Escape closes only the topmost active overlay
  - [x] 4.4 Do not widen scope into Story 47.3 chart/trait semantics or Story 47.5 contrast/touch-target auditing

- [ ] Task 5: Add focused regression coverage for modal semantics and focus restoration (AC: 1, 2, 3, 4, 5)
  - [x] 5.1 Extend `apps/front/src/components/results/PwywModal.test.tsx` to assert dialog naming, close behavior, and the most important focus-management expectations that are practical in JSDOM
  - [x] 5.2 Extend `apps/front/src/components/relationship/RitualScreen.test.tsx` to verify initial focus target and stable dialog labeling
  - [x] 5.3 Extend `apps/front/src/components/results/EvidencePanel.test.tsx` or related results tests to cover Escape behavior, labeled close control, and any focus-restoration contract introduced
  - [ ] 5.4 Add a route-level results test if the auto-open / reopen trigger path needs coverage for focus return behavior

- [ ] Task 6: Perform focused manual verification on real modal flows (AC: 5)
  - [x] 6.1 Run targeted front-end tests for the touched modal components
  - [x] 6.2 Run `pnpm --filter=front typecheck`
  - [ ] 6.3 Manually verify keyboard-only behavior for results-page PWYW open, close, Escape, and trigger restoration
  - [ ] 6.4 Manually verify ritual-screen entry and progression with keyboard only
  - [ ] 6.5 Spot-check body scroll lock and focus containment on a mobile-sized viewport

## Dev Notes

- This story is intentionally limited to modal and focus-management behavior. Do not reopen skip-link/landmark work from Story 47.1, chat live-region work from Story 47.2, results-content semantics from Story 47.3, or app-wide contrast/touch-target cleanup from Story 47.5.
- Preserve the existing user experience. The goal is reliable focus behavior, not a redesign of the PWYW flow, the ritual copy, or the results information architecture.
- Prefer shared primitives and native behavior over custom focus bookkeeping where possible. Radix dialog behavior already exists in the codebase; reuse it instead of inventing a second modal system.

### Previous Story Intelligence

- Story 47.1 explicitly deferred modal internals: it preserved `PwywModal` and `RitualScreen` behavior while adding route landmarks around them. Story 47.4 should now tighten those dialog contracts rather than re-litigate page structure.
- Story 47.2 followed the correct epic pattern: keep the current UX, add only the missing accessibility semantics, and test the behavior narrowly. Story 47.4 should do the same for focus management.
- Story 47.3 kept results-page work scoped to content semantics and explicitly deferred modal-only gaps to this story. That means any focus-trap or dialog-restoration fixes discovered on `/results/:id` belong here.

### Current Code Observations

- `apps/front/src/components/results/PwywModal.tsx` already uses `Dialog`, `DialogContent`, `DialogHeader`, and `DialogTitle` from `@workspace/ui/components/dialog`, so baseline Radix dialog semantics, focus trap, and `aria-modal` behavior should already exist unless the custom scroll/content layout interferes.
- `packages/ui/src/components/dialog.tsx` provides the actual dialog shell. It renders `DialogPrimitive.Overlay` and `DialogPrimitive.Content` in a portal, so this story should confirm behavior first before patching local callers.
- `apps/front/src/routes/results/$conversationSessionId.tsx` auto-opens the PWYW modal after a 2.5-second delay on first results view and also reopens it from the portrait unlock CTA. Focus-restoration behavior likely differs between those two entry paths and should be handled deliberately.
- `apps/front/src/components/relationship/RitualScreen.tsx` is currently a fixed full-screen `div` with `role="dialog"` and an auto-focused Start button, but it does not use shared dialog primitives. It may already satisfy the visible UX while still leaving route-level background content available to assistive tech or keyboard navigation.
- `apps/front/src/components/results/EvidencePanel.tsx` also exposes `role="dialog"` and focuses itself on mount, but it does not currently implement a real focus trap. If it visually behaves like a transient overlay, this story should either tighten that contract or explicitly document why it remains an inline detail surface instead.
- `apps/front/src/components/relationship/QrDrawer.tsx` uses the shared `Drawer` primitive with sr-only title/description. It is adjacent modal infrastructure and may be useful as a reference for shared overlay behavior, but it is not the primary acceptance target unless audit findings show a common focus bug.

### Architecture Compliance

- Keep the work inside the existing TanStack Start frontend and current route/component boundaries; no new modal, focus-trap, or accessibility package should be introduced. [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Project Structure & Boundaries]
- Prefer semantic HTML and framework primitives first, adding custom focus management only where the current overlay implementation falls outside what Radix or Vaul already guarantees. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.5 Implementation Guidelines]
- Preserve the current results-route behavior, auth gating, and relationship flow transitions. This story affects interaction semantics, not product logic. [Source: `_bmad-output/planning-artifacts/architecture.md` - TanStack Start SSR + route boundaries]

### Library / Framework Requirements

- No new accessibility or focus-management library should be introduced for this story.
- Reuse `@workspace/ui/components/dialog` for modal behavior where a true dialog is required.
- Reuse `@workspace/ui/components/drawer` patterns only if they clarify how the app currently handles body scroll lock or overlay semantics.
- Keep the current Tailwind token usage and visual styling intact unless a tiny structural change is required for focus behavior.

### File Structure Requirements

Likely touch points for implementation:

- Shared dialog infrastructure
  - `packages/ui/src/components/dialog.tsx`
  - `packages/ui/src/components/drawer.tsx` (reference-only unless a shared bug is found)

- Results modal flow
  - `apps/front/src/components/results/PwywModal.tsx`
  - `apps/front/src/components/results/PwywModal.test.tsx`
  - `apps/front/src/routes/results/$conversationSessionId.tsx`

- Relationship ritual flow
  - `apps/front/src/components/relationship/RitualScreen.tsx`
  - `apps/front/src/components/relationship/RitualScreen.test.tsx`
  - `apps/front/src/routes/relationship/$analysisId_.ritual.tsx` (if route shell behavior affects focus exposure)

- Results overlay follow-up
  - `apps/front/src/components/results/EvidencePanel.tsx`
  - `apps/front/src/components/results/EvidencePanel.test.tsx`

### Testing Requirements

- Front-end unit/component tests:
  - Verify PWYW modal exposes dialog semantics and a stable accessible name
  - Verify the ritual screen exposes dialog semantics and lands focus on the expected primary action
  - Verify Escape closes overlays that promise Escape behavior
  - Verify close controls are labeled and keyboard-reachable
  - Verify focus restoration or fallback targeting where practical to assert in tests

- Manual verification:
  - Keyboard-only pass for PWYW modal auto-open and user-triggered reopen flows
  - Keyboard-only pass for ritual-screen entry and transition into the next state
  - Body scroll-lock spot check on results when the modal is open
  - Screen-reader spot check that the active dialog name is announced and background content does not compete

- E2E scope:
  - Only add browser-heavy coverage if it protects a real route-level regression around modal open/close and focus return that lower-level tests cannot cover reasonably. [Source: `docs/E2E-TESTING.md`]

### Project Structure Notes

- The live code still uses the PWYW portrait-unlock flow (`PwywModal`, Polar checkout, route comments marked Story 3.4), while the PRD contains newer monetization revisions that mention a subscription modal instead. For this story, trust the live code and Epic 3.4 acceptance criteria over stale or partially migrated product-language changes.
- The planning artifacts still describe this work under Epic 3 / Story 3.4, but the current implementation-artifact sequence uses Epic 47 numbering. Keep the story artifact in the established `47-x` implementation-artifact series.
- The sprint tracker is currently inconsistent with the live story numbering: `_bmad-output/implementation-artifacts/sprint-status.yaml` only contains `3-x` accessibility story keys after a later regeneration. Avoid blind tracker edits until that mismatch is reconciled.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 3, Story 3.4 "Modal & Focus Management"]
- [Source: `_bmad-output/planning-artifacts/prd.md` - NFR20-NFR24 Accessibility]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.4 Testing Strategy; 13.5 Implementation Guidelines; PWYW modal spec; RitualScreen; Focus management]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Project Structure & Boundaries]
- [Source: `docs/FRONTEND.md` - shared dialog patterns and semantic testing guidance]
- [Source: `docs/E2E-TESTING.md` - browser-test scope guidance]
- [Source: `_bmad-output/implementation-artifacts/47-1-skip-link-and-semantic-landmarks.md` - prior accessibility-story constraints and deferments]
- [Source: `_bmad-output/implementation-artifacts/47-2-conversation-ui-accessibility.md` - prior accessibility-story implementation pattern]
- [Source: `_bmad-output/implementation-artifacts/47-3-results-page-and-portrait-accessibility.md` - results-story deferment of modal-only work]
- [Source: `packages/ui/src/components/dialog.tsx` - current shared dialog primitive wrapper]
- [Source: `apps/front/src/components/results/PwywModal.tsx` - current PWYW modal implementation]
- [Source: `apps/front/src/routes/results/$conversationSessionId.tsx` - current modal open/close trigger flow]
- [Source: `apps/front/src/components/relationship/RitualScreen.tsx` - current ritual-screen dialog semantics]
- [Source: `apps/front/src/components/results/EvidencePanel.tsx` - current inline dialog behavior on the results surface]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-09T20:34+0200 - Story context created from Epic 3.4 requirements, PRD accessibility requirements, UX focus-management guidance, architecture constraints, Stories 47.1-47.3 implementation patterns, recent git history, and the current results/relationship modal code paths.
- 2026-04-09T20:34+0200 - Detected numbering drift between planning artifacts (`3.4`) and implementation artifacts (`47.4`), plus a regenerated `sprint-status.yaml` that only contains `3-x` accessibility story keys; left sprint tracking unchanged to avoid corrupting active story bookkeeping.
- 2026-04-09T20:49+0200 - Implemented explicit open/close focus handling in `PwywModal`, forwarded the portrait unlock trigger ref through the results view, and preserved route behavior while giving auto-open and manual reopen paths a deterministic restoration target.
- 2026-04-09T20:49+0200 - Converted `RitualScreen` to use the shared dialog primitive as a true modal surface with trapped focus, preserved the full-screen visual treatment, and kept initial focus on the Start action.
- 2026-04-09T20:49+0200 - Tightened `EvidencePanel` as an inline dialog surface with keyboard trap and trigger-focus restoration, and updated detail-zone facet callbacks to carry the originating element for close-time restoration.
- 2026-04-09T20:50+0200 - Validation passed for targeted modal suites, `pnpm --filter=front typecheck`, `src/routes/-results-session-route.test.tsx`, and the full `pnpm --filter=front exec vitest run` suite. Manual keyboard/browser verification remains pending outside this terminal session.

### Completion Notes List

- Created the Story 47.4 context artifact for modal and focus-management work.
- Scoped the work to PWYW modal behavior, ritual-screen behavior, and any results overlays that truly present as dialogs.
- Captured the current route and component entry points that control modal open, close, Escape handling, focus landing, and focus restoration.
- Documented the numbering and tracker mismatch so follow-on implementation does not accidentally edit the wrong sprint key.
- Kept `PwywModal` on Radix dialog primitives, but made its focus behavior explicit: the unlock CTA now receives initial focus on open and focus returns either to the portrait unlock trigger or the page `<main>` fallback on close.
- Forwarded the portrait unlock CTA ref through `ProfileView` and the results route so the results page can restore focus consistently without changing the PWYW timing logic.
- Upgraded `RitualScreen` from a hand-rolled fixed `div` dialog to the shared dialog primitive, preserving the full-screen ritual presentation while ensuring true modal semantics and trapped focus.
- Preserved `EvidencePanel` as an inline dialog-style surface, but added keyboard trapping and focus restoration to the originating facet card instead of converting it into a separate full-screen modal.
- Expanded automated coverage for `PwywModal`, `RitualScreen`, `EvidencePanel`, and the `DetailZone` callback contract required for evidence-trigger focus restoration.
- Full front-end Vitest coverage and `front` typecheck now pass after the modal/focus-management changes.
- Story remains `in-progress` because manual keyboard walkthroughs and real browser body-scroll-lock checks were not executed from this terminal session.

### File List

- `_bmad-output/implementation-artifacts/47-4-modal-and-focus-management.md`
- `apps/front/src/components/results/PwywModal.tsx`
- `apps/front/src/components/results/PwywModal.test.tsx`
- `apps/front/src/components/results/PortraitUnlockCta.tsx`
- `apps/front/src/components/results/ProfileView.tsx`
- `apps/front/src/components/results/DetailZone.tsx`
- `apps/front/src/components/results/DetailZone.test.tsx`
- `apps/front/src/components/results/EvidencePanel.tsx`
- `apps/front/src/components/results/EvidencePanel.test.tsx`
- `apps/front/src/components/relationship/RitualScreen.tsx`
- `apps/front/src/components/relationship/RitualScreen.test.tsx`
- `apps/front/src/routes/results/$conversationSessionId.tsx`

### Change Log

- 2026-04-09: Created Story 47.4 implementation context artifact.
- 2026-04-09: Implemented modal and focus-management improvements for the PWYW results modal, ritual screen, and evidence panel; added focused regression coverage and validated the full `front` test suite plus `front` typecheck.
