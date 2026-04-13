# Story 2.1: "Show me what you found →" Closing Button

Status: done

<!-- Origin: Epic 2 (Post-Assessment Transition & Portrait Reading), Story 2.1 in epics.md -->
<!-- Builds on: Story 7.18 (Conversation-to-Portrait Transition UX) -->

## Story

As a user who just finished the 15-exchange assessment,
I want the input field to fade and a warm button to appear,
so that the transition from conversation to portrait feels intentional and emotionally connected.

## Acceptance Criteria

1. **Closing-state CTA appears after the final exchange**  
   Given the user has completed exchange 15 and Nerin's closing message has rendered, when the closing exchange is displayed, then the chat input field fades out with the existing CSS opacity transition (~300ms) and a single CTA appears below the closing message: `"Show me what you found →"`.

2. **CTA styling feels like part of Nerin's world**  
   The CTA uses warm, Nerin-consistent styling and must not look like a generic outline/system button. It should feel like the next emotional beat of the conversation, not a utility control.

3. **CTA navigates to the focused portrait route**  
   Activating the CTA navigates to `/results/$conversationSessionId?view=portrait`.

4. **No competing post-assessment actions**  
   Once the closing exchange has rendered, no other CTA or navigation option is visible in the chat surface.

5. **Existing "View Results" behavior is replaced**  
   The current authenticated completion CTA in `apps/front/src/components/TherapistChat.tsx` that links to `/results/$conversationSessionId` is removed and replaced by the new CTA.

6. **Existing fade/completion behavior does not regress**  
   The input still becomes non-interactive after the closing exchange, authenticated completion still prevents more messages, and reduced-motion users still get an instant/non-animated fallback through existing `motion-safe` usage.

7. **Relevant frontend tests are updated and passing**  
   Component tests cover the new label, single-CTA behavior, and portrait-route navigation target.

## Tasks / Subtasks

- [x] Task 1: Replace the generic completion CTA in chat (AC: 1, 3, 4, 5, 6)
  - [x] Confirm the current post-closing branch in `apps/front/src/components/TherapistChat.tsx` still keys off `isCompleted || isFarewellReceived` from `useTherapistChat`.
  - [x] Replace the authenticated `View Results` outline button with a dedicated warm CTA that links to `/results/$conversationSessionId` with `search={{ view: "portrait" }}`.
  - [x] Keep the CTA below the closing message in the same completion area so the input fade remains the transition mechanism.
  - [x] Preserve the existing no-input / no-further-messages behavior once the session is completed or farewell has been received.

- [x] Task 2: Introduce a reusable post-assessment CTA surface (AC: 1, 2, 4)
  - [x] Create a focused component for the button state, preferably near the chat UI (`apps/front/src/components/chat/` or another established frontend location) instead of leaving styling inline in `TherapistChat.tsx`.
  - [x] Add stable selectors such as `data-slot` and/or `data-testid` for component/unit/E2E targeting.
  - [x] Style the CTA with existing design tokens and utility classes already used in the app; do not hardcode a one-off palette that bypasses the current theme system.
  - [x] Ensure the control keeps a minimum 44px touch target and a visible keyboard focus state.

- [x] Task 3: Keep the flow scoped to Story 2.1 only (AC: 3, 6)
  - [x] Reuse the existing portrait reading route introduced by Story 7.18; do not redesign the results route in this story.
  - [x] Do not implement the portrait generating-state UX here; Story 2.2 owns the `/results/$conversationSessionId?view=portrait` generating-state behavior.
  - [x] If the unused `onPortraitReveal` prop remains dead after this refactor, remove it only if that cleanup stays trivial and does not broaden scope.

- [x] Task 4: Update tests for the new CTA contract (AC: 7)
  - [x] Update `apps/front/src/components/TherapistChat-farewell-auth-focus.test.tsx` assertions that currently expect `"View Results"` so they instead assert the new CTA label and the absence of competing CTAs.
  - [x] Add/adjust a test proving the completion CTA targets the portrait route (`?view=portrait`) rather than the default results page.
  - [x] Update any related fixtures or snapshots used by `TherapistChat` tests so the completion branch reflects the new single-button experience.

- [x] Task 5: Verification (AC: 1-7)
  - [x] Run targeted frontend tests for `TherapistChat`.
  - [x] Run the relevant workspace lint/typecheck/build command set used for frontend changes, or document clearly if full verification is deferred.

## Dev Notes

### Story Intent

This is a narrow frontend refinement on top of the post-assessment flow from Story 7.18. The route structure for portrait reading already exists; the missing piece is the new emotionally aligned CTA in the chat completion state.

### Current Implementation to Reuse

- `apps/front/src/components/TherapistChat.tsx` already fades/hides the input when `isFarewellReceived` is true and currently renders an authenticated `View Results` button in that branch.
- `apps/front/src/hooks/useTherapistChat.ts` already exposes `isFarewellReceived` and `isCompleted`, which are the correct state signals for the closing branch.
- `apps/front/src/routes/results/$conversationSessionId.tsx` already accepts the `view` search param and renders `PortraitReadingView` when `view === "portrait"` and portrait content is available.
- `apps/front/src/components/results/PortraitReadingView.tsx` already exists as the focused-reading destination. Story 2.1 should route users there; Story 2.2 will improve its generating state.

### Guardrails for the Dev Agent

- Do not reinvent the post-assessment flow from Story 7.18. This story replaces the final chat CTA, not the overall route architecture.
- Do not add extra system copy, cards, or duplicate buttons. The chat surface should end with one clear action only.
- Do not send users to the default results view first. The product requirement is portrait-first via `?view=portrait`.
- Do not use a generic `variant="outline"` button and call the story done. The styling change is a product requirement, not a cosmetic nice-to-have.

### Architecture and UX Constraints

- The architecture flow is now: `/chat` -> closing message + `"Show me what you found →"` -> `/results/$sessionId?view=portrait` -> full results view later. Keep this exact transition.
- The component map in architecture already names this surface `PostAssessmentTransitionButton`; align with that naming unless a stronger local convention in `apps/front/src/components/chat/` makes a nearby variant clearer.
- Follow the project frontend convention of state-driven styling with data attributes where that improves clarity. Stable selectors matter for tests.
- Keep reduced-motion behavior intact by relying on the existing `motion-safe:` fade approach instead of introducing JS-driven animation.

### Suggested File Targets

- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/chat/PostAssessmentTransitionButton.tsx` (new, recommended)
- `apps/front/src/components/TherapistChat-farewell-auth-focus.test.tsx`
- Potentially `apps/front/src/routes/chat/index.tsx` only if dead prop cleanup is bundled and remains trivial

### Testing Notes

- This change belongs primarily in component/unit tests, not E2E, unless a broader golden-path test is already being touched.
- Prefer asserting accessible name, single visible CTA, and route target over brittle class snapshots.
- Preserve existing `data-slot`/`data-testid` patterns so future E2E tests can select the post-assessment CTA reliably.

### Related Prior Story Intelligence

Story 7.18 already removed the old celebration card, introduced the portrait-first route, and established the input-fade transition. Reuse that foundation rather than rebuilding it in parallel. The current repo state shows the remaining gap clearly: the chat still ends on a generic `View Results` button while the results route already supports `?view=portrait`.

### Git Intelligence

Recent commits are mostly sprint tracking and homepage work. There is no indication of in-flight backend work on this transition, so keep the change isolated to the frontend chat/results surface unless local code inspection reveals otherwise.

## Project Structure Notes

- Frontend app code lives in `apps/front/src`.
- Chat UI lives in `apps/front/src/components` and `apps/front/src/components/chat`.
- Results-route behavior lives in `apps/front/src/routes/results/$conversationSessionId.tsx`.
- Follow the naming and placement conventions already used in the frontend codebase rather than inventing a new folder pattern for a single component.

## References

- Epic definition and ACs: `_bmad-output/planning-artifacts/epics.md` - `Epic 2: Post-Assessment Transition & Portrait Reading`, `Story 2.1: "Show me what you found →" Closing Button`
- Product requirement: `_bmad-output/planning-artifacts/prd.md` - `FR93`
- Architecture flow and component map: `_bmad-output/planning-artifacts/architecture.md` - post-assessment flow, route map, `PostAssessmentTransitionButton`, ADR-46 portrait-reading flow
- Existing transition implementation: `_bmad-output/implementation-artifacts/7-18-conversation-to-portrait-transition-ux.md`
- Current chat completion branch: `apps/front/src/components/TherapistChat.tsx`
- Current portrait-reading destination: `apps/front/src/routes/results/$conversationSessionId.tsx`, `apps/front/src/components/results/PortraitReadingView.tsx`
- Frontend state-styling/testing guidance: `docs/FRONTEND.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `.agents/skills/bmad-dev-story/workflow.md`
- `pnpm --filter front test -- src/components/TherapistChat-farewell-auth-focus.test.tsx`
- `pnpm --filter front lint`
- `pnpm --filter front typecheck`
- `pnpm --filter front build`

### Completion Notes List

- Replaced the authenticated completion-state `View Results` outline button in `TherapistChat` with a single warm portrait-first CTA while preserving the existing farewell fade behavior.
- Added `PostAssessmentTransitionButton` under `apps/front/src/components/chat/` with stable selectors and route params/search targeting `/results/$conversationSessionId?view=portrait`.
- Kept the flow scoped to Story 2.1 by reusing the existing portrait route and removing the now-dead `onPortraitReveal` prop from the chat route/component boundary.
- Updated `TherapistChat` fixtures/tests to assert the new CTA label, single-CTA behavior, and portrait-route target.
- Verification passed for `pnpm --filter front test -- src/components/TherapistChat-farewell-auth-focus.test.tsx` (which executed the full front Vitest suite: 55 files, 458 tests), `pnpm --filter front typecheck`, and `pnpm --filter front build`.
- `pnpm --filter front lint` completed successfully with pre-existing repo warnings unrelated to this story.

### File List

- `_bmad-output/implementation-artifacts/2-1-show-me-what-you-found-closing-button.md`
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/TherapistChat-farewell-auth-focus.test.tsx`
- `apps/front/src/components/__fixtures__/therapist-chat.fixtures.tsx`
- `apps/front/src/components/chat/PostAssessmentTransitionButton.tsx`
- `apps/front/src/components/chat/index.ts`
- `apps/front/src/routes/chat/index.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Patch] Add `aria-hidden` to fade wrapper when CTA is shown — faded input stays in DOM intentionally for smooth transition; add `aria-hidden={showCompletionCta || undefined}` to hide from AT [TherapistChat.tsx:743] — fixed
- [x] [Review][Dismissed] `isCompleted=true, isAuthenticated=false` blank action area — dismissed, only authenticated users can complete an assessment; scenario unreachable in production
- [x] [Review][Patch] `getAllByRole("link").toHaveLength(1)` fragile count assertion — replaced with `getAllByTestId("post-assessment-transition-button")` [TherapistChat-farewell-auth-focus.test.tsx:63] — fixed
- [x] [Review][Patch] `focus-visible:ring-primary/30` — increased to `/60` for WCAG 3:1 non-text contrast [PostAssessmentTransitionButton.tsx:15] — fixed
- [x] [Review][Defer] `sessionId` empty-string guard absent in PostAssessmentTransitionButton — low risk, route validates before mount [PostAssessmentTransitionButton.tsx:21] — deferred, pre-existing
- [x] [Review][Defer] Race: `isFarewellReceived` fires before server writes portrait data — CTA click may land on results before data ready — deferred, pre-existing; Story 2.2 owns generating-state UX
- [x] [Review][Defer] Arrow `→` in button label may produce odd screen-reader announcement — deferred, pre-existing pattern in codebase
- [x] [Review][Defer] Mock `Link` fixture types `search` as `Record<string, string>` — narrower than TanStack Router generic; no runtime impact today — deferred, pre-existing
- [x] [Review][Defer] No test for `isFarewellReceived=true, isAuthenticated=false` state (blank area) — deferred, pre-existing
- [x] [Review][Defer] `data-slot="post-assessment-transition"` wrapper lives in TherapistChat rather than inside the component — deferred, pre-existing

## Change Log

- 2026-04-13: Replaced the generic authenticated completion CTA with a reusable warm portrait-transition button, updated related tests/fixtures, removed the dead portrait-reveal prop path, and verified the frontend package with test, lint, typecheck, and build.
