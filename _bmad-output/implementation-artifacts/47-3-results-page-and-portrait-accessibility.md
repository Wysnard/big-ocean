# Story 47.3: Results Page & Portrait Accessibility

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user with low vision or using a screen reader,
I want to read my results and portrait,
so that I can access my personality insights regardless of ability.

## Acceptance Criteria

1. **Given** the results page at `/results/:id`
   **When** accessibility tools are active
   **Then** the radar chart has `role="img"` with an `aria-label` summarizing the profile
   **And** a data table fallback exists for screen readers with all five trait names and scores
   **And** the implementation preserves the current chart visuals, responsive behavior, and reduced-motion handling

2. **Given** score visualizations are rendered on the results page
   **When** a user navigates them with assistive technology
   **Then** trait cards, trait bars, facet bars, confidence visuals, and detail-zone scores expose understandable text alternatives
   **And** color is never the only channel used to communicate meaning
   **And** existing score semantics stay aligned with the derive-at-read results model

3. **Given** a user navigates the trait cards with keyboard only
   **When** they move through the results grid
   **Then** each trait card is reachable with Tab
   **And** activating a card updates its expanded/collapsed state with `aria-expanded`
   **And** the detail/evidence affordance remains operable without requiring a pointer
   **And** the current trait-card interaction model and visual hierarchy remain unchanged

4. **Given** the results page contains multiple major content areas
   **When** a screen reader user navigates by landmarks and headings
   **Then** the page exposes meaningful section landmarks for the archetype, traits, portrait, and any additional major sections rendered on `/results/:id`
   **And** the heading hierarchy remains sequential and consistent with Story 47.1 route-level semantics
   **And** decorative background elements remain hidden from assistive technology

5. **Given** the portrait is available in card view or immersive reading view
   **When** users resize text up to 200% or use browser zoom
   **Then** the portrait remains readable at a prose width near `65ch`
   **And** spacing and typography continue to rely on relative units rather than fixed pixel assumptions for long-form reading
   **And** portrait content keeps WCAG AA contrast in both themes

6. **Given** the results accessibility work is complete
   **When** automated and manual regression checks run
   **Then** focused front-end tests cover the updated results-page accessibility semantics
   **And** at least one manual keyboard-only walkthrough is completed on `/results/:id`
   **And** at least one screen-reader spot check validates radar, landmarks, trait expansion, and portrait reading behavior
   **And** existing results functionality, auth gating, portrait unlock flow, sharing, and relationship sections remain unchanged

## Tasks / Subtasks

- [x] Task 1: Audit the current results page and preserve existing compliant behavior before changing anything (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1 Confirm which requirements are already satisfied in `apps/front/src/components/results/ProfileView.tsx`, `PersonalityRadarChart.tsx`, `TraitCard.tsx`, `FacetScoreBar.tsx`, `DetailZone.tsx`, `PortraitSection.tsx`, and `PortraitReadingView.tsx`
  - [x] 1.2 Keep current route composition in `apps/front/src/routes/results/$conversationSessionId.tsx` and Story 47.1 page-shell semantics intact; this story should improve results-surface accessibility, not redesign the page
  - [x] 1.3 Preserve existing reduced-motion handling in the radar chart and existing auth/portrait/relationship flows on the page

- [x] Task 2: Close remaining landmark and heading gaps on the results page (AC: 4, 6)
  - [x] 2.1 Verify the archetype hero, traits section, portrait section, relationship section, sharing section, and any quick-action/credits sections expose meaningful section labels that screen-reader users can jump between
  - [x] 2.2 Add or tighten `aria-label` / `aria-labelledby` wiring where current sections are unlabeled or inconsistently labeled
  - [x] 2.3 Ensure decorative results-page visuals such as ambient/ocean background layers stay `aria-hidden`
  - [x] 2.4 Preserve one clear page-level heading on `/results/:id` and avoid skipped heading levels when portrait and detail surfaces render conditionally

- [x] Task 3: Tighten chart and score visualization accessibility without altering the visual design (AC: 1, 2, 6)
  - [x] 3.1 Keep `apps/front/src/components/results/PersonalityRadarChart.tsx` aligned with the story requirement that the chart uses `role="img"` plus a more descriptive profile summary label if the current generic label is insufficient
  - [x] 3.2 Preserve and, if necessary, improve the hidden radar-chart data table so it remains the screen-reader fallback for the five trait scores
  - [x] 3.3 Review `TraitCard.tsx`, `FacetScoreBar.tsx`, and `DetailZone.tsx` to ensure progress semantics, confidence wording, and visible text labels are understandable without relying on color
  - [x] 3.4 Keep derive-at-read result values untouched; this story is about presentation semantics only, not score computation

- [x] Task 4: Make trait-card interaction and evidence discovery clearly keyboard-accessible (AC: 2, 3, 6)
  - [x] 4.1 Confirm the existing button-based trait cards remain the primary interaction model and continue to expose `aria-expanded`
  - [x] 4.2 Add any missing relationship between a trait card and its expanded detail area if assistive technology currently lacks enough context
  - [x] 4.3 Verify the detail zone close control, facet click affordances, and evidence panel opening flow remain reachable and understandable by keyboard users
  - [x] 4.4 Avoid introducing a second competing navigation pattern; reuse the current trait-card and detail-zone structure

- [x] Task 5: Protect portrait readability and long-form accessibility in both portrait surfaces (AC: 4, 5, 6)
  - [x] 5.1 Verify the portrait card and immersive reading view expose semantic long-form containers (`article`, headings, readable section structure)
  - [x] 5.2 Bring `apps/front/src/components/results/PortraitReadingView.tsx` closer to the UX prose-width target (`--width-prose` / ~`65ch`) if the current `max-w-[720px]` implementation is materially off-spec
  - [x] 5.3 Check that portrait typography and spacing continue to behave correctly at 200% text resize and do not depend on fixed-height containers
  - [x] 5.4 Preserve portrait unlock, generating, failed, and ready states in `PortraitSection.tsx` / `PersonalPortrait.tsx`; do not reopen monetization or content-state logic here

- [x] Task 6: Add focused regression coverage for results accessibility semantics (AC: 1, 2, 3, 4, 5, 6)
  - [x] 6.1 Extend `apps/front/src/components/results/PersonalityRadarChart.test.tsx` to verify the chart summary label and hidden-table fallback stay in sync
  - [x] 6.2 Extend `apps/front/src/components/results/TraitCard.test.tsx`, `FacetScoreBar.test.tsx`, and any relevant detail-zone/profile tests to cover keyboard/expanded-state and text-alternative expectations
  - [x] 6.3 Add or extend tests in `ProfileView.test.tsx`, `PortraitReadingView.test.tsx`, `PortraitSection.test.tsx`, and route-level results tests where landmarks, headings, and portrait reading semantics are asserted
  - [x] 6.4 Keep selector strategy aligned with `docs/FRONTEND.md` and `docs/E2E-TESTING.md`: prefer semantic queries first, preserve existing `data-testid` values, and do not repurpose `data-slot` as a test-only selector

- [ ] Task 7: Perform focused validation on the actual results experience (AC: 6)
  - [x] 7.1 Run targeted front-end tests for the touched results components
  - [x] 7.2 Run `pnpm --filter=front typecheck`
  - [ ] 7.3 Manually verify `/results/:id` with keyboard-only navigation across the hero, trait cards, detail zone, portrait states, sharing, and relationship sections
  - [ ] 7.4 Perform at least one screen-reader spot check (VoiceOver or equivalent local setup) covering landmarks, radar summary/table fallback, trait expansion semantics, and portrait readability

### Review Findings

- [x] [Review][Decision] Portrait-revisit `<section>` landmark too granular — reverted to `<div>`, button is discoverable by label [`$conversationSessionId.tsx`]
- [x] [Review][Decision] Missing archetype section landmark — already handled: `ArchetypeHeroSection` receives `sectionLabel` prop from `ProfileView`, `ArchetypeDescriptionSection` not used on results page
- [x] [Review][Patch] `PortraitReadingView` duplicate `id="portrait-reading-title"` — fixed: ID now assigned only to the first level-1 section [`PortraitReadingView.tsx`]
- [x] [Review][Patch] `PersonalPortrait` test missing `displayName` branch coverage — added test [`PersonalPortrait.test.tsx`]
- [x] [Review][Defer] Route test mock drift — mocks hardcode `role`/`aria-label` values that must stay in sync with real components manually. Pre-existing pattern. [`-results-session-route.test.tsx`]
- [x] [Review][Defer] Brittle className assertion for prose width — tests implementation detail (`max-w-[65ch]`) rather than behavior. [`PortraitReadingView.test.tsx:47`]

## Dev Notes

- This story is intentionally limited to the results page and portrait surfaces. Do not reopen `/chat` live-region work from Story 47.2, route-shell skip links from Story 47.1, modal focus work from Story 47.4, or global contrast/touch-target cleanup from Story 47.5.
- The goal is to close accessibility gaps on the current results experience, not redesign the information architecture or replace the existing visual language.
- Results page accessibility is a paid-product credibility issue because the portrait is premium content. Preserve the current emotional tone while making the page navigable and readable with assistive technology.

### Previous Story Intelligence

- Story 47.2 showed the correct pattern for this epic: preserve the existing UX, add only the missing semantics, and keep announcements/ARIA narrowly scoped to real accessibility gaps.
- Story 47.2 reused Story 47.1 route-level semantics instead of introducing a parallel page-shell pattern. Story 47.3 should do the same on `/results/:id` by building on the existing `PageMain` and section structure rather than inventing a new container model.
- The most recent `feat: 47-2` commits only touched chat-specific files and the story artifact. That keeps Story 47.3 independent and confirms there is no hidden results-page implementation already underway on the current branch.

### Current Code Observations

- `apps/front/src/components/results/ProfileView.tsx` already exposes labeled sections for portrait and traits, but the broader `/results/:id` surface includes additional major sections in `apps/front/src/routes/results/$conversationSessionId.tsx` that should be audited for landmark consistency.
- `apps/front/src/components/results/PersonalityRadarChart.tsx` already renders `role="img"` plus a hidden table fallback. The current `aria-label` is generic ("Personality radar chart showing Big Five trait scores") and may need to become more descriptive without becoming noisy.
- `apps/front/src/components/results/TraitCard.tsx` already uses a native `<button>` with `aria-expanded`, so the primary interaction model is on the right path. The remaining work is likely around clearer relationship/context between the toggle and the expanded detail content rather than replacing the control.
- `apps/front/src/components/results/FacetScoreBar.tsx` and `DetailZone.tsx` already expose progressbar semantics. Review whether confidence and facet meaning are still too color-dependent or too generic for screen-reader users.
- `apps/front/src/components/results/PortraitReadingView.tsx` uses semantic headings and an `<article>`, but its current `max-w-[720px]` is only an approximation of the UX prose-width target. Check whether it should align more directly with the `65ch` design constraint.
- `apps/front/src/components/results/PortraitSection.tsx` and related portrait states already support generating, failed, unlocked, and locked views. This story should preserve that state model and focus on readable structure/contrast, not business logic.
- `apps/front/src/components/results/EvidencePanel.tsx` already behaves like a dialog in tests. Keep that behavior compatible with any trait/detail accessibility changes made here.

### Architecture Compliance

- Keep the work inside the existing TanStack Start frontend and current results-route/component boundaries; do not introduce a new accessibility library, alternate charting package, or separate results-page implementation. [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Project Structure]
- Prefer semantic HTML first and add ARIA only where native semantics are insufficient. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.5 Implementation Guidelines]
- Preserve derive-at-read scoring behavior and existing results data contracts; this story affects presentation semantics, not domain scoring logic. [Source: `_bmad-output/planning-artifacts/architecture.md` - Derive-at-read results]
- Keep test selectors consistent with project conventions: semantic queries first, preserve `data-testid`, and do not treat `data-slot` as a replacement. [Source: `docs/FRONTEND.md`; `docs/E2E-TESTING.md`]

### Library / Framework Requirements

- No new accessibility or charting library should be introduced for this story.
- Keep the existing Recharts-based `PersonalityRadarChart` implementation and its reduced-motion behavior.
- Keep the current Radix/shadcn-based interaction primitives already in use for dialogs/tooltips/modals.
- Reuse existing Tailwind token patterns and results-page components rather than building a second accessibility-only rendering path, except where the UX spec explicitly calls for hidden table fallbacks.

### File Structure Requirements

Likely touch points for implementation:

- Results route composition
  - `apps/front/src/routes/results/$conversationSessionId.tsx`

- Results accessibility implementation
  - `apps/front/src/components/results/ProfileView.tsx`
  - `apps/front/src/components/results/PersonalityRadarChart.tsx`
  - `apps/front/src/components/results/TraitCard.tsx`
  - `apps/front/src/components/results/FacetScoreBar.tsx`
  - `apps/front/src/components/results/DetailZone.tsx`
  - `apps/front/src/components/results/PortraitSection.tsx`
  - `apps/front/src/components/results/PortraitReadingView.tsx`
  - `apps/front/src/components/results/PersonalPortrait.tsx` (only if portrait semantics/contrast need a small supporting adjustment)
  - `apps/front/src/components/results/PsychedelicBackground.tsx` or other decorative wrappers (only if hiding decorative content from assistive tech is needed)

- Automated regression coverage
  - `apps/front/src/components/results/ProfileView.test.tsx`
  - `apps/front/src/components/results/PersonalityRadarChart.test.tsx`
  - `apps/front/src/components/results/TraitCard.test.tsx`
  - `apps/front/src/components/results/FacetScoreBar.test.tsx`
  - `apps/front/src/components/results/PortraitReadingView.test.tsx`
  - `apps/front/src/components/results/PortraitSection.test.tsx`
  - `apps/front/src/routes/-results-session-route.test.tsx` (if route-level landmark/heading coverage is the right fit)

### Testing Requirements

- Front-end unit/component tests:
  - Verify the radar chart keeps `role="img"` and an informative label
  - Verify the hidden data table fallback exists and stays aligned with the five trait scores
  - Verify trait cards remain keyboard reachable and expose correct expanded/collapsed semantics
  - Verify key score visualizations still expose text alternatives independent of color
  - Verify portrait reading surfaces keep semantic article/heading structure and readable-width constraints where practical to assert
  - Verify major results-page sections remain discoverable through landmarks/headings

- Manual verification:
  - Keyboard-only pass through `/results/:id`
  - Screen-reader spot check on a real results page
  - Browser zoom / text-resize spot check up to 200%
  - Light and dark theme contrast spot check for portrait/body text and any trait-colored UI that communicates state

- E2E scope:
  - Static-ish results accessibility checks may be a reasonable target for existing Playwright/axe coverage, but do not add browser-heavy coverage unless it protects an actual route-level regression that unit tests cannot reasonably catch. Dynamic chat-style manual verification guidance from the UX spec still applies where real assistive-tech behavior matters. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.4 Testing Strategy]

### Project Structure Notes

- The UX spec defines the results page as a landmark-rich long-scroll surface with private payoff first, not a conversion page. Accessibility fixes should reinforce that structure rather than add extra CTA noise.
- The radar chart fallback, trait-card expansion model, and portrait reading width are already reflected in the current codebase. The dev agent should tighten and complete those patterns, not rebuild them from scratch.
- Story 47.4 owns modal focus trapping and Story 47.5 owns broad contrast/touch-target auditing. If a gap is clearly modal-only or app-wide, note it but do not absorb it into this implementation unless it blocks this story’s acceptance criteria directly.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 3, Story 3.3 "Results Page & Portrait Accessibility"]
- [Source: `_bmad-output/planning-artifacts/prd.md` - FR16-FR22a; NFR20-NFR24 Accessibility]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 8.8 Width Tokens; 8.10 Portrait Visual Treatment; 13.3 Accessibility Strategy; 13.4 Testing Strategy; 13.5 Implementation Guidelines; 18.14 Accessibility]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Project Structure; derive-at-read results]
- [Source: `docs/FRONTEND.md` - testing and data-attribute conventions]
- [Source: `docs/E2E-TESTING.md` - selector priority and E2E scope]
- [Source: `_bmad-output/implementation-artifacts/47-2-conversation-ui-accessibility.md` - prior accessibility-story implementation pattern]
- [Source: `apps/front/src/routes/results/$conversationSessionId.tsx` - current results route composition]
- [Source: `apps/front/src/components/results/ProfileView.tsx` - current section/trait layout]
- [Source: `apps/front/src/components/results/PersonalityRadarChart.tsx` - current chart accessibility fallback]
- [Source: `apps/front/src/components/results/TraitCard.tsx` - current keyboard/expanded trait interaction]
- [Source: `apps/front/src/components/results/PortraitReadingView.tsx` - current portrait reading surface]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-09T12:24+0200 - Story context created from Epic 47 requirements, PRD accessibility requirements, UX accessibility/testing guidance, architecture constraints, Story 47.2 implementation patterns, recent git history, and the current `/results/:id` frontend code.
- 2026-04-09T16:17+0200 - Implemented results-page accessibility improvements: labeled lower-page landmarks on `/results/:id`, descriptive radar summary text, trait-to-detail `aria-controls` wiring, keyboard-operable facet evidence cards, and article/prose-width semantics for portrait surfaces.
- 2026-04-09T16:17+0200 - Added and updated focused regression coverage for radar semantics, trait/detail accessibility wiring, portrait reading/article semantics, and route-level lower-section landmarks.
- 2026-04-09T16:17+0200 - Validation passed for `pnpm --filter=front exec vitest run`, targeted results-component suites, and `pnpm --filter=front typecheck`. Manual keyboard walkthrough and real screen-reader spot check remain pending outside this terminal session.
- 2026-04-09T16:41+0200 - Addressed review findings by removing route-level wrappers that created empty regions and broke the share-panel grid span, then moving landmark semantics onto the components that only render when content exists.
- 2026-04-09T16:41+0200 - Re-ran validation after the review fixes: targeted route/share tests, `pnpm --filter=front typecheck`, and the full `pnpm --filter=front exec vitest run` suite all passed.

### Completion Notes List

- Created Story 47.3 implementation context and moved sprint tracking from `backlog` to `in-progress`.
- Scoped the work to results-page and portrait accessibility only, with Story 47.1 / 47.2 / 47.4 / 47.5 boundaries called out explicitly.
- Captured existing compliant behavior so the dev agent can tighten semantics rather than rebuild the results page.
- Identified likely implementation targets across route composition, radar chart semantics, trait-card interaction, portrait readability, and focused regression tests.
- Added route-level labeled regions for the lower results-page sections so share, relationship, credits, and portrait-revisit areas are discoverable as landmarks without changing the visual layout.
- Replaced the generic radar `aria-label` with a profile-summary label that includes the highest trait while preserving the hidden trait-score table fallback and existing reduced-motion behavior.
- Linked trait toggles to their expanded detail region with `aria-controls`, exposed the detail zone as a labeled region, and made facet evidence cards keyboard-operable with Enter/Space.
- Upgraded portrait surfaces to semantic article containers and aligned the immersive reading view to a `65ch` prose width target.
- Added regression coverage for the new accessibility contract in results-component and route tests, then validated the full `front` Vitest suite and `front` typecheck successfully.
- Fixed the review regression by keeping `ShareProfileSection` as the real full-width grid item instead of wrapping it in a separate route-level section.
- Fixed the empty-landmark issue by attaching `role="region"` / `aria-label` only to components that render actual content (`ShareProfileSection`, `RelationshipCard`, `RelationshipAnalysesList`, `RelationshipCreditsSection`).
- Story remains `in-progress` because manual keyboard-only verification and a real screen-reader spot check were not executed from this terminal session.

### File List

- `_bmad-output/implementation-artifacts/47-3-results-page-and-portrait-accessibility.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/front/src/components/results/DetailZone.tsx`
- `apps/front/src/components/results/DetailZone.test.tsx`
- `apps/front/src/components/results/PersonalPortrait.tsx`
- `apps/front/src/components/results/PersonalPortrait.test.tsx`
- `apps/front/src/components/results/PersonalityRadarChart.tsx`
- `apps/front/src/components/results/PersonalityRadarChart.test.tsx`
- `apps/front/src/components/results/PortraitReadingView.tsx`
- `apps/front/src/components/results/PortraitReadingView.test.tsx`
- `apps/front/src/components/results/TraitCard.tsx`
- `apps/front/src/components/results/TraitCard.test.tsx`
- `apps/front/src/components/results/RelationshipCreditsSection.tsx`
- `apps/front/src/components/results/ShareProfileSection.tsx`
- `apps/front/src/components/relationship/RelationshipAnalysesList.tsx`
- `apps/front/src/components/relationship/RelationshipCard.tsx`
- `apps/front/src/routes/results/$conversationSessionId.tsx`
- `apps/front/src/routes/-results-session-route.test.tsx`

### Change Log

- 2026-04-09: Created Story 47.3 context artifact and updated sprint tracking to `in-progress`.
- 2026-04-09: Implemented results-page accessibility semantics, portrait readability improvements, and focused regression coverage; manual keyboard and real screen-reader verification remain pending.
- 2026-04-09: Addressed code-review follow-ups for empty landmarks and share-panel layout regression; full `front` Vitest and typecheck remained green after the patch.
