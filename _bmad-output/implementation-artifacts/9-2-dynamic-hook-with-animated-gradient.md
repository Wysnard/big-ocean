# Story 9.2: Dynamic Hook with Animated Gradient

## Status: done

## Story

As a visitor scrolling the homepage,
I want the auth panel hook to change as I explore different product phases,
so that the messaging always reflects what I am currently seeing.

**Epic:** 9 - Homepage Conversion  
**FRs covered:** FR60 primary, FR59 and FR61 supporting  
**Dependencies:** Story 9.1 must provide the split-layout homepage shell (`StickyAuthPanel`, stacked mobile layout, timeline phase boundaries). This story should build on that foundation rather than invent a second homepage architecture.

## Acceptance Criteria

**AC1: Phase-aware hook copy**
**Given** the visitor is scrolling through the homepage timeline  
**When** they enter a new visual phase  
**Then** the hook line changes to the exact phase copy below:

- Conversation: `A conversation that SEES you.`
- Portrait: `Words you've been CARRYING without knowing.`
- World After: `A place that STAYS.`
- Reassurance: `YOURS.`

**AC2: Animated gradient keyword**
**Given** a phase hook is visible  
**When** the keyword renders  
**Then** the keyword uses display-size bold text with a phase-specific animated gradient:

- Conversation: blue -> violet
- Portrait: amber -> rose
- World After: teal -> cyan
- Reassurance: merged multi-phase palette

**And** the gradient drifts continuously on a 6s loop using CSS keyframes

**AC3: Motion transition behavior**
**Given** the current phase changes  
**When** the hook updates  
**Then** the old hook exits and the new hook enters via a vertical slide transition using `AnimatePresence` from Motion
**And** the phase change thresholds align with the homepage phase boundaries defined by the timeline

**AC4: Reduced-motion fallback**
**Given** the visitor has `prefers-reduced-motion` enabled  
**When** the phase changes  
**Then** the hook swaps instantly without slide motion
**And** the gradient drift animation is paused or removed

**AC5: Desktop/mobile behavior split**
**Given** the desktop homepage split layout is visible  
**When** the visitor scrolls  
**Then** the right-column auth panel hook changes with phase

**And given** the mobile stacked layout is visible  
**When** the hero renders  
**Then** the mobile hero shows the Conversation-phase hook only
**And** it does not continue changing after the hero scrolls away

## Tasks

### [x] Task 1: Create a reusable homepage hook configuration

**Preferred files:**
- `apps/front/src/components/home/homepage-phase-config.ts`
- `apps/front/src/components/home/HomepageDynamicHook.tsx`

- Centralize the four phase keys, exact copy, gradient tokens, and phase ordering in feature-local config.
- Keep the copy out of `apps/front/src/routes/index.tsx`.
- Use one source of truth for desktop and mobile so copy/gradient tokens cannot drift.
- Keep the keyword text explicit (`SEES`, `CARRYING`, `STAYS`, `YOURS`) rather than parsing strings at render time.

### [x] Task 2: Reuse the split-layout phase state instead of creating duplicate scroll logic

**Expected integration points:**
- `apps/front/src/routes/index.tsx`
- `apps/front/src/components/home/StickyAuthPanel.tsx`
- `apps/front/src/components/home/MobileHero.tsx`
- `apps/front/src/components/home/HomepageTimeline.tsx`
- `apps/front/src/components/home/DepthScrollProvider.tsx` or a dedicated homepage phase context created in Story 9.1

- Consume the phase boundary state already established for the timeline/split layout.
- Do not add a second independent `IntersectionObserver` or scroll tracker inside the hook component if Story 9.1 already exposes current phase.
- Default the current phase to `conversation` on first render so SSR output is stable and above-the-fold content is deterministic.
- Mobile should intentionally freeze on the Conversation phase even if desktop uses live scroll-linked state.

### [x] Task 3: Implement the Motion transition correctly

**Preferred file:**
- `apps/front/src/components/home/HomepageDynamicHook.tsx`

- Import Motion APIs from `motion/react`, matching the installed `motion` package.
- Use `AnimatePresence` with a keyed direct child so phase swaps produce enter/exit animations reliably.
- Set `initial={false}` so the first SSR/hydration render does not animate unexpectedly.
- Use a vertical slide plus opacity transition for desktop phase changes. Keep the motion scoped to the hook text only; the rest of the auth panel should remain stable.
- Keep gradient drift in CSS (`@keyframes`) rather than Motion keyframes so the text animation remains cheap and predictable.

### [x] Task 4: Respect reduced motion and accessibility constraints

**Preferred files:**
- `apps/front/src/components/home/HomepageDynamicHook.tsx`
- home feature stylesheet or existing global stylesheet where homepage animation utilities live

- Use Motion's `useReducedMotion()` hook to switch from animated slide to instant content swap.
- Remove or pause gradient drift when reduced motion is enabled.
- Preserve a readable non-gradient fallback in forced colors/high-contrast scenarios if the gradient utility becomes unreadable.
- Keep the keyword large enough that the chosen gradients satisfy large-text contrast expectations from the UX spec.

### [x] Task 5: Wire into the auth surfaces without duplicating auth behavior

**Relevant existing files:**
- `apps/front/src/components/auth/signup-form.tsx`
- `apps/front/src/components/auth/login-form.tsx`
- `apps/front/src/components/auth/index.ts`
- `apps/front/src/hooks/use-auth.ts`

- Reuse the existing auth forms and auth hook behavior established in the current codebase.
- Do not add homepage-specific auth API calls, contracts, or redirect logic in this story.
- The only dynamic element this story owns is the hook and its phase-aware presentation.

### [x] Task 6: Add focused frontend tests

**Preferred files:**
- `apps/front/src/components/home/HomepageDynamicHook.test.tsx`
- optionally a route-level test if the homepage route wiring becomes non-trivial

- Verify the exact copy and keyword token for each phase.
- Verify reduced-motion behavior by mocking `matchMedia`/Motion reduced-motion behavior and asserting no slide-only state is required for correctness.
- Verify initial render is Conversation phase for SSR-safe output.
- Verify the mobile hero path remains pinned to the Conversation hook.
- Preserve existing `data-testid` usage patterns and add new test IDs only where they improve test stability.

## Dev Notes

### Current codebase reality

- `apps/front/src/routes/index.tsx` is still the pre-Epic-9 placeholder. It renders `HeroSection`, `HowItWorks`, `FinalCta`, `DepthMeter`, and `ChatInputBar`, and includes an inline comment that Epic 9 will replace the conversation section.
- `apps/front/src/components/home/` still contains the old homepage pieces that Epic 9 is expected to retire or repurpose: `HeroSection`, `HowItWorks`, `FinalCta`, `ChatInputBar`, `MessageGroup`, `ResultPreviewEmbed`, `RelationshipCta`, etc.
- `DepthScrollProvider` and `DepthMeter` already exist. If Story 9.1 replaces or extends them for phase-aware timeline boundaries, this story must consume that shared state instead of adding competing scroll logic.
- No current Epic 9 implementation artifact exists yet. The only `9-1-*` and `9-2-*` files already in `_bmad-output/implementation-artifacts/` are legacy artifacts from an older numbering scheme and must not be edited or treated as prior Epic 9 context.

### Architecture guardrails

- Frontend stack is TanStack Start SSR + React 19 + Tailwind CSS v4.
- The installed animation library is `motion` `^12.38.0` in `apps/front/package.json`.
- Keep the homepage SSR-safe. Do not require `window` state to compute the initial hook copy.
- Follow feature-local organization under `apps/front/src/components/home/`.
- Prefer data attributes and Tailwind variants for stateful styling where useful (`data-phase`, `data-reduced-motion`), consistent with `docs/FRONTEND.md`.
- Do not add new packages for this story.
- Do not change auth contracts or backend APIs.

### UX guardrails from the homepage spec

- The hook is the only element in the auth panel that should change across phases.
- Desktop hook progression must align with the four homepage phases:
  - Conversation
  - Portrait
  - World After
  - Reassurance
- Mobile hero intentionally does not keep changing with scroll after it exits view.
- The tone is need-positioned and must not reintroduce the forbidden words from FR60 (`test`, `quiz`, `assessment`) into the hook copy.

### Existing auth/form patterns to preserve

- `SignupForm` and `LoginForm` already encapsulate Better Auth integration, validation, error handling, and route navigation.
- If Story 9.1 embeds auth directly into the sticky panel, prefer composition or a small shared wrapper around the existing auth components instead of duplicating form logic.
- `useAuth()` is the current frontend boundary for sign-in/sign-up actions.

### Implementation notes for Motion

- Motion React docs currently recommend importing `AnimatePresence` and `useReducedMotion` from `motion/react`.
- `AnimatePresence initial={false}` prevents the initial child from animating on first render, which is the correct default for this homepage hook.
- `AnimatePresence mode="wait"` is appropriate if the implementation renders exactly one keyed hook child and wants exit-before-enter sequencing. If layout constraints make `sync` simpler, keep the animation visually vertical and non-jarring.
- `useReducedMotion()` updates with the user's OS/browser preference and should drive the instant-swap fallback rather than CSS-only assumptions.

### File structure guidance

**Expected files touched by the eventual implementation:**
- `apps/front/src/routes/index.tsx`
- `apps/front/src/components/home/HomepageDynamicHook.tsx`
- `apps/front/src/components/home/homepage-phase-config.ts`
- `apps/front/src/components/home/StickyAuthPanel.tsx` (from Story 9.1)
- `apps/front/src/components/home/MobileHero.tsx` (from Story 9.1)
- `apps/front/src/components/home/DepthScrollProvider.tsx` or another Story 9.1 phase provider
- `apps/front/src/components/home/HomepageDynamicHook.test.tsx`

### Testing requirements

- Use Vitest + Testing Library with the same `jsdom` setup already used by component tests in `apps/front/src/components`.
- Prefer focused component tests over broad visual snapshot tests.
- If a route test is needed, mirror the mocking pattern already used in `apps/front/src/routes/-results-session-route.test.tsx`.
- Verify reduced-motion behavior explicitly; do not leave it as an untested CSS-only claim.

### Out of scope

- Building the split-layout shell itself (Story 9.1)
- Implementing the timeline artifacts (Story 9.3)
- Implementing the reassurance cards/content (Story 9.4)
- Rewriting auth flows, CTA behavior, or backend integration

## References

- Epic story definition: `_bmad-output/planning-artifacts/epics.md` - Epic 9 / Story 9.2
- UX copy and gradient spec: `_bmad-output/planning-artifacts/ux-design-specification.md` - `16.3.1 Dynamic Hook - Copy & Gradient Specification`
- Homepage component inventory: `_bmad-output/planning-artifacts/ux-design-specification.md` - `16.13 Component Inventory (Target)`
- Homepage implementation delta: `_bmad-output/planning-artifacts/ux-design-specification.md` - homepage comparison table around section 16
- Frontend architecture and stack: `_bmad-output/planning-artifacts/architecture.md`
- Frontend state styling conventions: `docs/FRONTEND.md`
- Current homepage route: `apps/front/src/routes/index.tsx`
- Current auth forms: `apps/front/src/components/auth/signup-form.tsx`, `apps/front/src/components/auth/login-form.tsx`
- Motion docs: https://motion.dev/motion/animate-presence/
- Motion reduced-motion docs: https://motion.dev/docs/react-use-reduced-motion

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `pnpm --filter front test -- HomepageDynamicHook` (Vitest ran the current frontend suite and passed 50 files / 413 tests)
- `pnpm --filter front typecheck`
- `pnpm --filter front check` (passes with pre-existing unrelated warnings outside the Story 9.2 files)
- Updated homepage CTA links to satisfy TanStack Router's required `search` contract without changing auth behavior

### Completion Notes List

- Implemented feature-local homepage phase configuration with exact hook copy, explicit keywords, and phase-specific gradient tokens shared by desktop and mobile surfaces
- Wired `HomepageDynamicHook` into the Story 9.1 split layout via `DepthScrollProvider`, keeping desktop phase changes scroll-linked while pinning the mobile hero to the Conversation hook
- Added Motion-based enter/exit transitions plus CSS-driven gradient drift, reduced-motion fallback, and forced-colors readability handling
- Added focused frontend coverage for exact copy, SSR-safe Conversation default, reduced-motion state, and mobile hero behavior
- Story validation completed with frontend tests, typecheck, and Biome check

### Change Log

- 2026-04-13: Story 9.2 implementation verified and completed; dynamic homepage hook, shared phase config, motion transitions, accessibility fallbacks, and focused tests are ready for review

### File List

- `_bmad-output/implementation-artifacts/9-2-dynamic-hook-with-animated-gradient.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/front/src/components/home/DepthScrollProvider.tsx`
- `apps/front/src/components/home/HomepageDynamicHook.test.tsx`
- `apps/front/src/components/home/HomepageDynamicHook.tsx`
- `apps/front/src/components/home/HomepageTimeline.tsx`
- `apps/front/src/components/home/MobileHero.tsx`
- `apps/front/src/components/home/StickyAuthPanel.tsx`
- `apps/front/src/components/home/homepage-phase-config.ts`
- `apps/front/src/routes/index.tsx`
- `apps/front/src/styles.css`

### Review Findings

- [x] [Review][Decision] Forbidden words ("quiz", "test") in og:title/og:description meta tags — dismissed: constraint targets hook copy only, negating frame is intentional marketing. [index.tsx:22,27]
- [x] [Review][Decision] Placeholder developer text visible in StickyAuthPanel — fixed: replaced with product copy. [StickyAuthPanel.tsx:30-33]
- [x] [Review][Patch] Dark mode classes missing in StickyAuthPanel — fixed. [StickyAuthPanel.tsx:23,30,53]
- [x] [Review][Patch] Dead `min-h-[8.5rem]` in HomepageDynamicHook always overridden by conditional — fixed. [HomepageDynamicHook.tsx:44]
- [x] [Review][Patch] No CSS `prefers-reduced-motion` media query for gradient drift — fixed: added belt-and-suspenders media query. [styles.css:37-40]
- [x] [Review][Patch] `<aside>` landmark in StickyAuthPanel lacks `aria-label` — fixed. [StickyAuthPanel.tsx:10]
- [x] [Review][Patch] No test assertion for gradient className per phase — fixed: added gradient class assertion to phase test matrix. [HomepageDynamicHook.test.tsx]
- [x] [Review][Defer] Orphaned homepage components (ChatInputBar, DepthMeter, FinalCta, HeroSection, HowItWorks) still on disk — deferred, pre-existing cleanup from homepage redesign
