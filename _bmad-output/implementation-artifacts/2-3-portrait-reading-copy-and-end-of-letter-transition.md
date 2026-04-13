# Story 2.3: Portrait Reading Copy & End-of-Letter Transition

Status: done

<!-- Origin: Epic 2 (Post-Assessment Transition & Portrait Reading), Story 2.3 in epics.md -->
<!-- Builds on: Story 2.1 ("Show me what you found →" Closing Button), Story 2.2 (Portrait Generating State with Nerin Voice) -->
<!-- Architecture: ADR-46 (Post-Assessment Focused Reading Transition), FR95 -->

## Story

As a user reading my portrait for the first time,
I want the end-of-letter link to use warm, Nerin-consistent copy,
so that the transition to my full identity page feels like a continuation, not a redirect.

## Acceptance Criteria

1. **End-of-letter link copy is replaced**
   Given the user is reading their portrait in the PortraitReadingView, when they scroll to the bottom of the letter, then the existing "See your full personality profile" text is replaced with "There's more to see →".

2. **Link navigates to the full results page**
   The link navigates to `/results/$conversationSessionId` (full results page without the `?view=portrait` query param). This is the same target as the current button — no navigation behavior change.

3. **Link styling is warm and consistent with the letter format**
   The link styling feels like part of the letter — warm, Nerin-consistent, not a generic system button. It should blend with the portrait reading surface's typography and color treatment.

4. **Link uses `<Link>` component instead of `<button>` + `navigate()`**
   The current `<button>` + `onViewFullProfile` callback pattern violates the CLAUDE.md navigation rule. Replace with TanStack Router `<Link>` component for proper internal navigation semantics.

5. **Existing portrait reading behavior is not regressed**
   The PortraitReadingView content rendering, generating state (Story 2.2), and failed-state retry UI (Story 2.4) continue working as before.

6. **Tests are updated and passing**
   Component tests cover the new link copy, the `<Link>` element, and the navigation target. `pnpm test:run` passes.

## Tasks / Subtasks

- [x] Task 1: Refactor PortraitReadingView to use `<Link>` and update copy (AC: 1, 2, 3, 4)
  - [x] In `apps/front/src/components/results/PortraitReadingView.tsx`, replace the `onViewFullProfile` callback prop with a `sessionId: string` prop for the `<Link>` target.
  - [x] Replace the `<button>` element (lines 80-88) with a TanStack Router `<Link>` that navigates to `/results/$conversationSessionId` with `params={{ conversationSessionId: sessionId }}` and `search={{}}` (clears the `?view=portrait` query param).
  - [x] Change the link text from "See your full personality profile" to "There's more to see →". Use the Unicode arrow `→` (U+2192), matching the convention in `PostAssessmentTransitionButton`.
  - [x] Keep `data-testid="view-full-profile-btn"` on the `<Link>` element (do NOT rename or remove — E2E tests may depend on it).
  - [x] Remove the `ArrowRight` icon import since "→" is now inline in the text.

- [x] Task 2: Update PortraitReadingView styling (AC: 3)
  - [x] Update the link's CSS classes to feel warmer and match the letter format. Current: `text-muted-foreground hover:text-primary`. Target: `text-foreground/60 hover:text-foreground/80` — matching the inscription styling used in PortraitReadingView's section inscriptions (line 49: `text-foreground/60`).
  - [x] Keep `font-heading text-base transition-colors` and `inline-flex items-center gap-2` (or adjust to just `inline-block` since the ArrowRight icon is removed).
  - [x] The container div (`mt-16 pt-8 border-t border-border/20 text-center`) stays unchanged — the border separator is part of the letter-end visual rhythm.

- [x] Task 3: Update the results route to pass `sessionId` instead of callback (AC: 4, 5)
  - [x] In `apps/front/src/routes/results/$conversationSessionId.tsx` line 417, change `<PortraitReadingView content={fullContent} onViewFullProfile={handleBackToProfile} />` to `<PortraitReadingView content={fullContent} sessionId={conversationSessionId} />`.
  - [x] The `handleBackToProfile` callback (lines 284-291) is still used by the failed-state "Back to your profile" button (line 392). Do NOT remove `handleBackToProfile` — it is still referenced elsewhere in the route. Only remove the prop connection to PortraitReadingView.

- [x] Task 4: Update tests (AC: 6)
  - [x] In `apps/front/src/components/results/PortraitReadingView.test.tsx`:
    - Update the import/render calls: replace `onViewFullProfile={vi.fn()}` with `sessionId="test-session-id"` in all render calls.
    - Update the copy assertion test (line 37-42): change `"See your full personality profile"` to `"There's more to see →"`.
    - Update the click test (lines 52-58): instead of asserting `onViewFullProfile` was called, verify the `<Link>` element has the correct `href` pointing to `/results/test-session-id`.
    - Mock `@tanstack/react-router` `Link` component. Use the existing pattern from `PostAssessmentTransitionButton` tests or create a simple mock: `vi.mock("@tanstack/react-router", () => ({ Link: (props: any) => <a {...props} href={props.to} /> }))`.
  - [x] Run `pnpm --filter front test` and `pnpm --filter front typecheck`.

- [x] Task 5: Verification (AC: 1-6)
  - [x] Run `pnpm --filter front test` — all tests pass.
  - [x] Run `pnpm --filter front typecheck` — no type errors.
  - [x] Run `pnpm --filter front build` — build succeeds.
  - [ ] Manual check: Navigate to `/results/$sessionId?view=portrait` with a ready portrait → scroll to bottom → see "There's more to see →" link → click → land on full results page.

## Dev Notes

### Current Code (What Changes)

`apps/front/src/components/results/PortraitReadingView.tsx` lines 78-89:

```typescript
{/* Transition to full profile */}
<div className="mt-16 pt-8 border-t border-border/20 text-center">
  <button
    type="button"
    onClick={onViewFullProfile}
    data-testid="view-full-profile-btn"
    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-heading text-base"
  >
    See your full personality profile
    <ArrowRight className="w-4 h-4" />
  </button>
</div>
```

**Target replacement:**

```typescript
{/* End-of-letter transition (FR95) */}
<div className="mt-16 pt-8 border-t border-border/20 text-center">
  <Link
    to="/results/$conversationSessionId"
    params={{ conversationSessionId: sessionId }}
    search={{}}
    data-testid="view-full-profile-btn"
    className="text-foreground/60 hover:text-foreground/80 transition-colors font-heading text-base"
  >
    There's more to see →
  </Link>
</div>
```

### Navigation Rule Fix

The current `<button>` + `onViewFullProfile` callback uses `useNavigate()` in the results route. CLAUDE.md requires TanStack Router `<Link>` for internal navigation. This story fixes the violation by:
1. Accepting `sessionId` as a prop instead of a callback
2. Using `<Link>` directly in the component
3. Removing the prop-threading of the navigation callback

Note: The `handleBackToProfile` callback in the results route is still used by the failed-state "Back to your profile" button (line 392). That button was deferred as a pre-existing navigation rule violation in Story 2.2's review (see review finding: "Failed state 'Back to your profile' uses `<button>` + `navigate()` instead of `<Link>`"). Do NOT fix that button in this story — it is out of scope.

### Components to Reuse (Do NOT Reinvent)

| Component | Location | Usage |
|-----------|----------|-------|
| `Link` | `@tanstack/react-router` | TanStack Router navigation component. Use for the end-of-letter transition. |
| `PortraitReadingView` | `apps/front/src/components/results/PortraitReadingView.tsx` | The component being modified. Do NOT rename, move, or restructure — only change the link element and its props. |

### What NOT to Do

- Do NOT remove `data-testid="view-full-profile-btn"`. E2E tests may depend on it.
- Do NOT remove `handleBackToProfile` from the results route — it is still used by the failed-state button.
- Do NOT change the `PortraitReadingView` file location or component name.
- Do NOT add new props beyond `sessionId`. The component already has `content` — keep the interface minimal.
- Do NOT modify the portrait generating state (Story 2.2), the failed-state retry UI (Story 2.4), or the fade-in transition logic.
- Do NOT add scroll-triggered animations or intersection observer logic for the end-of-letter link. The link is always visible at the bottom of the letter — no reveal animation needed.
- Do NOT use framer-motion, GSAP, or any animation library for this story. The only change is copy + element type + styling.

### Styling Guidance

- The inscription styling in PortraitReadingView uses `text-foreground/60` (line 49) — match this for the end-of-letter link to feel part of the letter's voice.
- `hover:text-foreground/80` provides a subtle warmth increase on hover without jumping to `text-primary` (which feels too system-UI).
- Keep `font-heading` to match the portrait's typography.
- The `→` character in the text replaces the `ArrowRight` icon — cleaner, matches the PostAssessmentTransitionButton's "Show me what you found →" pattern.

### Previous Story Intelligence

**Story 2.1 (done):**
- Established `PostAssessmentTransitionButton` using TanStack Router `<Link>` with `params` and `search` props.
- Pattern: `<Link to="/results/$conversationSessionId" params={{ conversationSessionId: sessionId }} search={{ view: "portrait" }}>`.
- Review finding (deferred): Arrow `→` in button label may produce odd screen-reader announcement — pre-existing pattern, not introduced here.

**Story 2.2 (done):**
- Added `PortraitGeneratingState` component and generating-state branch in the results route.
- Established `sawGeneratingRef` tracking for fade-in transition.
- Review finding (deferred): Failed state "Back to your profile" uses `<button>` + `navigate()` instead of `<Link>` — out of scope for this story.
- All 55 test files (457 tests) pass, typecheck clean, build successful.

### Git Intelligence

Recent commits show Stories 2.1 and 2.2 were just completed (commits `9ebdd773` and `de730507`). The PortraitReadingView was not modified by either story — Story 2.2 only added the separate `PortraitGeneratingState` component and modified the results route's branch logic. The component is in its original state from Story 7.18.

### Project Structure Notes

- Modified component: `apps/front/src/components/results/PortraitReadingView.tsx`
- Modified test: `apps/front/src/components/results/PortraitReadingView.test.tsx`
- Modified route: `apps/front/src/routes/results/$conversationSessionId.tsx` (prop change only)
- No new files created.
- Do NOT place test files in `apps/front/src/routes/` directly (TanStack Router treats them as routes).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.3] — Story definition and acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR95] — "At the bottom of the portrait reading view, a warm link ('There's more to see →') navigates the user to /results/$sessionId"
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-46] — Post-assessment focused reading transition, route variants, "There's more to see →" link specification
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§10.1] — Journey 1 flow: end-of-letter link warmth requirement
- [Source: apps/front/src/components/results/PortraitReadingView.tsx:78-89] — Current end-of-letter button to be replaced
- [Source: apps/front/src/routes/results/$conversationSessionId.tsx:284-291,417] — handleBackToProfile callback and PortraitReadingView usage
- [Source: apps/front/src/components/chat/PostAssessmentTransitionButton.tsx] — `<Link>` pattern reference and arrow convention
- [Source: _bmad-output/implementation-artifacts/2-2-portrait-reading-generating-state-with-nerin-voice.md] — Previous story with review findings
- [Source: _bmad-output/implementation-artifacts/2-1-show-me-what-you-found-closing-button.md] — Story 2.1 with PostAssessmentTransitionButton pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Implementation Plan

- Update `PortraitReadingView` tests first to encode the `Link`-based API and expected href/copy.
- Replace the button callback prop in `PortraitReadingView` with `sessionId` and render a TanStack Router `Link`.
- Update the results route prop wiring, then run front-end test, typecheck, and build validation before closing the story.

### Debug Log References

### Completion Notes List

- Replaced `<button>` + `onViewFullProfile` callback with TanStack Router `<Link>` + `sessionId` prop, fixing the CLAUDE.md navigation rule violation.
- Updated copy from "See your full personality profile" to "There's more to see →" (FR95).
- Updated styling from `text-muted-foreground hover:text-primary` to `text-foreground/60 hover:text-foreground/80` matching the portrait letter's inscription styling.
- Removed `ArrowRight` icon import, switched container from `inline-flex items-center gap-2` to `inline-block`.
- Updated results route to pass `sessionId` prop instead of `onViewFullProfile` callback. `handleBackToProfile` preserved for failed-state button.
- Updated tests: mock `@tanstack/react-router` Link, verify href target and new copy text.
- All 55 test files (464 tests) pass, typecheck clean, build successful.

### File List

- `apps/front/src/components/results/PortraitReadingView.tsx` — Modified: replaced `<button>` with `<Link>`, `onViewFullProfile` prop with `sessionId`, updated copy and styling
- `apps/front/src/components/results/PortraitReadingView.test.tsx` — Modified: mock `@tanstack/react-router`, updated test assertions for new copy, href, and sessionId prop
- `apps/front/src/routes/results/$conversationSessionId.tsx` — Modified: pass `sessionId` instead of `onViewFullProfile` to `PortraitReadingView`

### Change Log

- 2026-04-13: Story 2.3 implementation — replaced end-of-letter button with warm `<Link>`, updated copy to "There's more to see →", fixed navigation rule violation (AC 1-6)
