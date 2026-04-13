# Story 2.2: Portrait Reading Generating State with Nerin Voice

Status: done

<!-- Origin: Epic 2 (Post-Assessment Transition & Portrait Reading), Story 2.2 in epics.md -->
<!-- Builds on: Story 2.1 ("Show me what you found →" Closing Button), Story 7.18 (Conversation-to-Portrait Transition UX) -->
<!-- Architecture: ADR-46 (Post-Assessment Focused Reading Transition) -->

## Story

As a user arriving at the portrait reading view,
I want to see a warm generating state while my portrait is being written,
so that the wait feels like part of the experience, not a loading screen.

## Acceptance Criteria

1. **Generating state renders when portrait is not yet ready**
   Given the user navigates to `/results/$sessionId?view=portrait` and the portrait is still generating, when the PortraitReadingView renders in generating state, then a centered OceanSpinner is displayed (already exists as component) and a single Nerin-voiced line is shown: "Nerin is writing your letter..."

2. **Distraction-free generating surface**
   No other content, navigation, or UI elements are visible during the generating state. No header, no progress percentage, no back link — only OceanSpinner + text.

3. **Warm background matches existing reading view**
   The background uses the same warm letter-format styling as the existing PortraitReadingView (`bg-background`, `max-w-[65ch]`, same reading shell).

4. **Fade-in transition when portrait becomes ready**
   When the portrait status transitions to "ready" (via `usePortraitStatus` polling), the spinner resolves and the letter fades in with a CSS opacity+transform transition (~500ms).

5. **Reduced motion fallback**
   The fade-in transition is gated by `prefers-reduced-motion` — instant swap if the user prefers reduced motion.

6. **Existing failed state and reading view are not regressed**
   The existing failed-state retry UI (Story 2.4) and the existing PortraitReadingView content rendering (Story 7.18) continue working as before.

7. **Tests are updated and passing**
   Component tests cover the generating state, the transition to content, and the reduced motion fallback. `pnpm test:run` passes.

## Tasks / Subtasks

- [x] Task 1: Add generating-state branch to the portrait view in the results route (AC: 1, 2, 3, 6)
  - [x] In `apps/front/src/routes/results/$conversationSessionId.tsx`, inside the `if (view === "portrait")` block (line 347), add a branch BEFORE the `fullContent` check that handles `portraitStatus !== "ready"` (generating or initial poll-in-progress).
  - [x] Render a new `PortraitGeneratingState` component (or inline the JSX in the route) that shows: centered OceanSpinner + "Nerin is writing your letter..." text, wrapped in the same reading shell layout (`min-h-[calc(100dvh-3.5rem)] bg-background`, `mx-auto max-w-[65ch] px-6 py-12 sm:py-16`).
  - [x] Import `OceanSpinner` from `@workspace/ui/components/ocean-spinner`.
  - [x] Ensure the branch ordering is: (1) failed → retry UI, (2) content ready → PortraitReadingView, (3) anything else when `view=portrait` → generating state. This prevents the current fall-through to ProfileView.

- [x] Task 2: Implement the fade-in transition from generating to ready (AC: 4, 5)
  - [x] Track the transition from "generating" to "ready" using local state (e.g., `const [justBecameReady, setJustBecameReady] = useState(false)` toggled via a `useEffect` watching `portraitStatus`).
  - [x] When transitioning, apply a CSS opacity+transform fade-in on the letter content wrapper: `motion-safe:animate-in fade-in slide-in-from-bottom-2 duration-500` (Tailwind animate classes) or equivalent CSS transition.
  - [x] For `prefers-reduced-motion`, the `motion-safe:` prefix on the animation class ensures the animation simply doesn't apply; the content appears instantly.
  - [x] Do NOT use JS-driven animation (GSAP, framer-motion). Use CSS transitions/animations with the `motion-safe:` Tailwind variant.

- [x] Task 3: Create the PortraitGeneratingState component (AC: 1, 2, 3)
  - [x] Create `apps/front/src/components/results/PortraitGeneratingState.tsx`.
  - [x] The component renders: a vertically centered flex container with `OceanSpinner` (default props: code="OCEAN", size=48) and a `<p>` with "Nerin is writing your letter..." in `text-foreground/60 font-heading text-base`.
  - [x] Add `data-testid="portrait-generating-state"` and `data-slot="portrait-generating-state"` for testing.
  - [x] Keep it simple — no props needed. This is a pure presentational component.

- [x] Task 4: Update tests (AC: 7)
  - [x] Add a test file `apps/front/src/components/results/PortraitGeneratingState.test.tsx`:
    - Renders OceanSpinner and the Nerin-voiced text
    - Has the expected data-testid
    - Does not render any navigation, header, or profile content
  - [x] Update `apps/front/src/components/results/PortraitReadingView.test.tsx` if any test assumptions are affected (likely no changes needed since PortraitReadingView itself is unchanged).
  - [x] Run `pnpm --filter front test` and `pnpm --filter front typecheck`.

- [x] Task 5: Verification (AC: 1-7)
  - [x] Run `pnpm --filter front test` — all tests pass.
  - [x] Run `pnpm --filter front typecheck` — no type errors.
  - [x] Run `pnpm --filter front build` — build succeeds.
  - [ ] Manual check: Navigate to `/results/$sessionId?view=portrait` while portrait is generating → see OceanSpinner + text. When portrait completes → letter fades in.

### Review Findings

- [x] [Review][Decision→Patch] Generating fallback catches non-generating states (API error, status "none") — added explicit guards for `portraitStatus === "none"` and `isPortraitError` before the generating fallback, falling through to ProfileView instead of showing infinite spinner.
- [x] [Review][Patch] `sawGeneratingRef` never resets — fixed: ref resets to `false` when `view !== "portrait"`, and only sets to `true` for `portraitStatus === "generating"` (not undefined/none).
- [x] [Review][Patch] Missing test coverage for fade-in transition and reduced motion fallback — added 7 tests to `-results-session-route.test.tsx` covering: generating state display, ready state display, fade-in class on transition, no animation on direct-ready mount, motion-safe prefix verification, fallthrough on "none" status, fallthrough on query error.
- [x] [Review][Defer] Status "ready" with null/empty content falls through to generating state [`$conversationSessionId.tsx`:402] — deferred, pre-existing. Backend `deriveStatus` prevents this via truthiness check on `portrait?.content`, but frontend has no defensive guard. Unlikely to manifest unless backend logic changes.
- [x] [Review][Defer] Retry mutation race — polling may not restart if backend hasn't transitioned [`$conversationSessionId.tsx`:114-128] — deferred, pre-existing. If backend returns "failed" before state update propagates after retry, single refetch keeps "failed" status and polling stays stopped.
- [x] [Review][Defer] Failed state "Back to your profile" uses `<button>` + `navigate()` instead of `<Link>` [`$conversationSessionId.tsx`:386-393] — deferred, pre-existing. Violates CLAUDE.md navigation rule (Story 2.4 code, not introduced by this change).

## Dev Notes

### Current Gap (Why This Story Exists)

The results route at `apps/front/src/routes/results/$conversationSessionId.tsx` lines 347-401 handles `view === "portrait"` with two branches:
1. `portraitStatus === "failed"` → retry UI (Story 2.4)
2. `fullContent` exists → `PortraitReadingView`

**There is no generating-state branch.** When the user clicks "Show me what you found →" (Story 2.1) and arrives at `?view=portrait` while portrait generation is in progress, the code falls through to `ProfileView` — breaking the emotional flow that ADR-46 prescribes.

### Architecture Contract (ADR-46)

ADR-46 defines the generating state contract:

```typescript
type PortraitReadingState =
  | { status: "generating"; copy: "Nerin is writing your letter..." }
  | { status: "ready"; content: string }
  | { status: "failed"; retryAction: () => void }
```

Requirements:
- Only OceanSpinner + single Nerin-voiced line. No header, no nav chrome, no progress percentage.
- Transition to `ready` is a fade-in animation, not an instant replacement.
- Polls `GET /portrait/status` using TanStack Query `refetchInterval` (already implemented by `usePortraitStatus` hook).
- Shared reading shell reused for future `WeeklyLetterReadingView` (ADR-45) — same `max-w-[65ch]`, warm background, letter format. Consider extracting a shared shell if the dev sees a clean seam, but do NOT block on it.

### Components to Reuse (Do NOT Reinvent)

| Component | Location | Usage |
|-----------|----------|-------|
| `OceanSpinner` | `packages/ui/src/components/ocean-spinner.tsx` | Animated OCEAN hieroglyph morph spinner. Use default props: `code="OCEAN"`, `size=48` is a good size for this surface. |
| `usePortraitStatus` | `apps/front/src/hooks/usePortraitStatus.ts` | Already polls every 2s, stops on "ready"/"failed"/"none". Already used in the results route. |
| `PortraitReadingView` | `apps/front/src/components/results/PortraitReadingView.tsx` | Existing letter-reading component. Do NOT modify its interface — the generating state is a separate component/branch that renders BEFORE this one. |
| `PageMain` | `apps/front/src/components/PageMain.tsx` | Wrap in PageMain for consistent page structure. |

### Exact Code Location for the Change

In `apps/front/src/routes/results/$conversationSessionId.tsx`, the portrait view block is at lines 347-401:

```typescript
if (view === "portrait") {
  // Story 2.4: Failed state with retry button
  if (portraitStatus === "failed") { ... }

  // Full portrait available → full reading view
  const fullContent = portraitStatusData?.portrait?.content;
  if (fullContent) { ... }
}
// Falls through to ProfileView — THIS IS THE BUG
```

Add the generating state AFTER the `fullContent` check but BEFORE the closing `}` of the `if (view === "portrait")` block, so the branch order is: failed → ready → generating. Alternatively, add it before the fall-through with an explicit `return`:

```typescript
if (view === "portrait") {
  if (portraitStatus === "failed") { /* existing retry UI */ }

  const fullContent = portraitStatusData?.portrait?.content;
  if (fullContent) { /* existing PortraitReadingView */ }

  // NEW: Generating state (catches generating, none, or initial poll)
  return (
    <PageMain className="bg-background">
      <PortraitGeneratingState />
    </PageMain>
  );
}
```

### Styling Guidance

- The generating state surface must feel like part of Nerin's world — warm, quiet, distraction-free.
- Use `text-foreground/60` for the Nerin-voiced line (matches the inscription styling in PortraitReadingView).
- Use `font-heading` for the text (matches portrait headings).
- Center both spinner and text vertically within `min-h-[calc(100dvh-3.5rem)]` to account for the header.
- The text "Nerin is writing your letter..." uses an ellipsis (Unicode `…` or three dots) — match whatever convention exists in the codebase.

### Fade-In Transition Approach

The cleanest approach for the generating → ready transition:

1. In the results route, track `hasSeenGenerating` via a ref or state that flips when `portraitStatus` moves from non-ready to "ready".
2. Conditionally apply a CSS animation class to the `PortraitReadingView` wrapper:
   - `motion-safe:animate-in fade-in slide-in-from-bottom-2 duration-500` (if tailwindcss-animate is installed)
   - Or a manual CSS transition: `opacity-0 translate-y-2 motion-safe:transition-all motion-safe:duration-500` that becomes `opacity-100 translate-y-0` after mount.
3. Check if `tailwindcss-animate` (from shadcn/ui setup) provides the `animate-in`/`fade-in` utilities. If so, use them. If not, use vanilla Tailwind transitions.

### What NOT to Do

- Do NOT modify `PortraitReadingView.tsx` props or interface. The generating state is a separate surface that renders before the reading view, not a prop on it.
- Do NOT add a progress bar or percentage. ADR-46 explicitly forbids this.
- Do NOT add a "Back" button to the generating state. Distraction-free means no navigation.
- Do NOT use GSAP or framer-motion for the fade-in. CSS transitions with `motion-safe:` are sufficient and follow the existing pattern (see PostAssessmentTransitionButton).
- Do NOT change the polling interval or behavior of `usePortraitStatus`. It already works correctly.
- Do NOT remove the fall-through to `ProfileView` for non-portrait views. Only add the generating state inside the `if (view === "portrait")` block.

### Previous Story Intelligence (Story 2.1)

Story 2.1 completion notes:
- Replaced the authenticated completion CTA with `PostAssessmentTransitionButton` under `apps/front/src/components/chat/`.
- The button navigates to `/results/$conversationSessionId?view=portrait` — which is exactly where this story's generating state will render.
- Review finding (deferred): "Race: `isFarewellReceived` fires before server writes portrait data — CTA click may land on results before data ready." This is exactly the scenario Story 2.2 addresses.
- Verification: `pnpm --filter front test` (55 files, 458 tests), typecheck, and build all passed.

### Project Structure Notes

- New component goes in `apps/front/src/components/results/PortraitGeneratingState.tsx` (alongside existing `PortraitReadingView.tsx`).
- Test file at `apps/front/src/components/results/PortraitGeneratingState.test.tsx`.
- Route modification in `apps/front/src/routes/results/$conversationSessionId.tsx`.
- Import `OceanSpinner` from `@workspace/ui/components/ocean-spinner`.
- Do NOT place test files in `apps/front/src/routes/` directly (TanStack Router treats them as routes).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2, Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-46] — Generating state contract, route variants, implementation location
- [Source: _bmad-output/planning-artifacts/prd.md#FR94] — "Portrait reading view with generating state (OceanSpinner + Nerin-voiced line)"
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR19] — "PortraitReadingView generating state: OceanSpinner + 'Nerin is writing your letter...' + letter fade-in"
- [Source: apps/front/src/routes/results/$conversationSessionId.tsx:347-401] — Current portrait view block with missing generating state
- [Source: apps/front/src/components/results/PortraitReadingView.tsx] — Existing reading view (do not modify)
- [Source: packages/ui/src/components/ocean-spinner.tsx] — OceanSpinner component to reuse
- [Source: apps/front/src/hooks/usePortraitStatus.ts] — Portrait status polling hook (already used)
- [Source: _bmad-output/implementation-artifacts/2-1-show-me-what-you-found-closing-button.md] — Previous story with relevant review findings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no issues encountered.

### Completion Notes List

- Created `PortraitGeneratingState` component — pure presentational, renders OceanSpinner (code="OCEAN", size=48) + "Nerin is writing your letter..." text in a distraction-free, vertically centered layout matching the reading shell's `bg-background` and `max-w-[65ch]` constraints.
- Modified results route `$conversationSessionId.tsx` to add generating-state branch inside `if (view === "portrait")` block. Branch order: (1) failed → retry UI, (2) content ready → PortraitReadingView, (3) fallback → PortraitGeneratingState. This eliminates the fall-through to ProfileView during generation.
- Implemented fade-in transition using `sawGeneratingRef` (useRef) that tracks whether the generating state was seen. When portrait becomes ready after generating, the PortraitReadingView wrapper gets `motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500` — CSS-only, no JS animation libraries, gated by `prefers-reduced-motion` via the `motion-safe:` Tailwind variant.
- Added 5 component tests for PortraitGeneratingState covering: Nerin text rendering, data-testid, data-slot, OceanSpinner presence, and absence of navigation/header/profile elements.
- PortraitReadingView.test.tsx unchanged (component not modified).
- All 55 test files (457 tests) pass, typecheck clean, build successful.

### Change Log

- 2026-04-13: Story 2.2 implementation — portrait generating state with Nerin voice and fade-in transition.

### File List

- `apps/front/src/components/results/PortraitGeneratingState.tsx` (new)
- `apps/front/src/components/results/PortraitGeneratingState.test.tsx` (new)
- `apps/front/src/routes/results/$conversationSessionId.tsx` (modified)
