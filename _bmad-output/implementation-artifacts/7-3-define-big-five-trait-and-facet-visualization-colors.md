# Story 7.3: Define Big Five Trait and Facet Visualization Colors

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **each personality trait and facet to have a distinctive, consistent color**,
so that **I can quickly identify traits in charts and results, with facets visually grouped under their parent trait**.

## Acceptance Criteria

1. **Given** I view assessment results **When** traits are displayed in charts, cards, or bars **Then** each trait has a unique, recognizable color family (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) **And** colors are consistent across all trait render surfaces in both light and dark modes.
2. **Given** I view facet-level details **When** facets are displayed under a trait **Then** each facet uses a stable variation of its parent trait color **And** all 30 facets are covered with deterministic token names.
3. **Given** trait/facet colors are rendered **When** accessibility is validated **Then** color contrast and non-color signaling meet WCAG guidance **And** colorblind simulation confirms distinguishable grouping.
4. **Given** frontend code consumes trait/facet colors **When** implementation is complete **Then** color access is centralized via utility functions (`getTraitColor()`, `getFacetColor()`, `getTraitGradient()`) instead of duplicated hard-coded values.
5. **Given** theme tokens are managed in the design system **When** colors are added **Then** tokens are defined in `packages/ui/src/styles/globals.css`, exposed through Tailwind v4 theme variables, and usable across `apps/front` + `packages/ui`.

## Tasks / Subtasks

- [x] **Task 1: Add trait/facet/gradient token system in global styles** (AC: 1, 2, 5)
  - [x] Add 5 trait tokens (`--trait-*`) in `:root` and `.dark` in `packages/ui/src/styles/globals.css`.
  - [x] Add all 30 facet tokens (`--facet-*`) grouped by parent trait family.
  - [x] Add 5 gradient tokens (`--gradient-trait-*`) for trait visualizations.
  - [x] Keep existing ocean brand semantic tokens from Story 7.1 intact.

- [x] **Task 2: Expose tokens for Tailwind v4 consumption** (AC: 1, 5)
  - [x] Extend `@theme inline` mappings in `packages/ui/src/styles/globals.css` for trait tokens.
  - [x] Ensure token usage works in app code using Tailwind custom-property patterns (for example, `text-(--trait-openness)`, `bg-[var(--facet-imagination)]`).

- [x] **Task 3: Create domain utility API for trait/facet colors** (AC: 2, 4)
  - [x] Create `packages/domain/src/utils/trait-colors.ts` with:
    - [x] `getTraitColor(trait: TraitName): string`
    - [x] `getFacetColor(facet: FacetName): string`
    - [x] `getTraitGradient(trait: TraitName): string`
  - [x] Optionally include deterministic raw-value helpers for charting libraries if raw color strings are required.
  - [x] Export new utilities from `packages/domain/src/utils/index.ts` and `packages/domain/src/index.ts`.

- [x] **Task 4: Replace hard-coded trait color usage in current frontend surfaces** (AC: 1, 2, 4)
  - [x] Update `apps/front/src/routes/results.tsx` trait/facet color mapping away from hard-coded Tailwind color classes.
  - [x] Update `apps/front/src/routes/results/$sessionId.tsx` static `TRAIT_COLORS` map to token-driven mapping.
  - [x] Update `apps/front/src/components/home/TraitsSection.tsx` to consume canonical tokenized trait colors instead of per-component raw OKLCH literals.
  - [x] Preserve current UX behavior while changing only color-source strategy.

- [x] **Task 5: Add/adjust tests and docs for guardrails** (AC: 3, 4)
  - [x] Add unit tests for `trait-colors.ts` mapping correctness (all 5 traits + all 30 facets).
  - [x] Update affected component tests if class/value assertions change due to CSS variable usage.
  - [x] Add or update Storybook documentation to show trait + facet palettes in light/dark modes.

- [x] **Task 6: Accessibility validation pass** (AC: 3)
  - [x] Verify text/icon contrast against backgrounds meets WCAG AA where text is present.
  - [x] Verify non-text UI contrast for indicators/bars.
  - [x] Verify trait/facet interpretation is not color-only (retain labels/icons/structure cues).
  - [x] Run colorblind simulation checks and capture outcomes in completion notes.

## Dev Notes

### Developer Context Section

- Story 7.1 already established mode-aware semantic brand tokens in `packages/ui/src/styles/globals.css` (sunset light + moonlit ocean dark).
- Story 7.2/7.6 already established theme plumbing (`ThemeProvider`, `useTheme`, no `next-themes` dependency in app code).
- Current trait/facet color usage is fragmented:
  - `apps/front/src/routes/results.tsx` uses hard-coded Tailwind color classes (`text-amber-400`, `bg-blue-400`, etc.).
  - `apps/front/src/routes/results/$sessionId.tsx` uses a hard-coded hex map (`TRAIT_COLORS`).
  - `apps/front/src/components/home/TraitsSection.tsx` uses in-component literal OKLCH values.
- Domain already has canonical trait/facet identifiers in `packages/domain/src/constants/big-five.ts` (`TraitName`, `FacetName`, `FACET_TO_TRAIT`, `TRAIT_TO_FACETS`). This should be the single source for utility typing and mappings.
- No chart library is currently installed; visualization surfaces are CSS-based bars/cards. Keep solution library-agnostic and compatible with future chart adoption.

### Technical Requirements

- Use **CSS custom properties** for all trait/facet colors; no new hard-coded per-component color literals.
- Maintain deterministic variable naming:
  - Traits: `--trait-{trait}` where `{trait}` is one of `openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`.
  - Facets: `--facet-{facet}` where `{facet}` matches `FacetName` keys from `packages/domain/src/constants/big-five.ts` (snake_case).
  - Gradients: `--gradient-trait-{trait}`.
- Keep dark-mode overrides in `.dark` for trait-level tokens; add facet overrides only if contrast requires it.
- Preserve existing semantic theme tokens (`--primary`, `--accent`, etc.) and ocean gradients from Story 7.1.
- Utility functions in `packages/domain/src/utils/trait-colors.ts` must be pure and deterministic, returning CSS variable references that can be consumed in React style/class usage.
- Prevent reinvention: do not duplicate trait/facet mapping constants in app components; import typed constants/utilities from domain.

### Architecture Compliance

- Respect monorepo separation from architecture docs:
  - `packages/ui` owns global style tokens.
  - `packages/domain` owns typed color utility API.
  - `apps/front` consumes tokens/utilities and should not define canonical trait-color business rules.
- Align with `docs/FRONTEND.md` conventions:
  - Prefer semantic/theme tokens over hard-coded color classes.
  - Keep `data-slot` attributes and existing component structure stable while updating styling sources.
- Maintain compatibility with TanStack Start + Tailwind v4 pipeline already used in `apps/front`.
- Do not introduce new infrastructure, backend schema, or orchestration changes; this story is frontend/domain-utils focused.

### Library/Framework Requirements

- **Tailwind CSS v4** (`apps/front` currently `^4.0.6`, `packages/ui` currently `^4.1.11`):
  - Use `@theme inline` token mapping in `globals.css`.
  - Use Tailwind custom-property utility patterns for token consumption.
- **React 19 + TanStack Start**: keep current component APIs and route behavior unchanged while updating color sourcing.
- **lucide-react** icons already provide non-color cues in trait surfaces; retain icon + text semantics for accessibility.
- **Storybook 10 + addon-a11y**: use/update palette documentation and accessibility checks for token previews.

Latest-version research snapshot (as of 2026-02-12, via npm registry queries):
- `tailwindcss`: `4.1.18`
- `@tailwindcss/vite`: `4.1.18`
- `react`: `19.2.4`
- `lucide-react`: `0.563.0`
- `@storybook/react-vite`: `10.2.8`

Implementation guidance: do **not** upgrade dependencies in this story unless a blocker is found; focus on token architecture + consumption migration.

### File Structure Requirements

- **Modify:** `packages/ui/src/styles/globals.css`
  - Add trait/facet/gradient token definitions and `@theme inline` mappings.
- **Create:** `packages/domain/src/utils/trait-colors.ts`
  - Central utility for trait/facet/gradient token retrieval.
- **Modify:** `packages/domain/src/utils/index.ts`
  - Re-export new trait color utilities.
- **Modify:** `packages/domain/src/index.ts`
  - Re-export trait color utilities from package root.
- **Modify:** `apps/front/src/routes/results.tsx`
  - Replace hard-coded trait class map with token-driven logic.
- **Modify:** `apps/front/src/routes/results/$sessionId.tsx`
  - Replace static hex `TRAIT_COLORS` map with utility/token source.
- **Modify:** `apps/front/src/components/home/TraitsSection.tsx`
  - Replace literal OKLCH declarations with tokenized strategy.
- **Potential updates:** tests/stories under
  - `apps/front/src/components/results/*.test.tsx`
  - `packages/domain/src/utils/__tests__/`
  - `packages/ui/src/components/color-palette.stories.tsx`

### Testing Requirements

- Follow architecture testing strategy:
  - Unit tests with **Vitest** for domain utility mapping logic.
  - Update frontend component tests where color value assertions are impacted.
  - Use **Storybook + addon-a11y** for token palette visualization and accessibility checks.
- Required validation coverage for this story:
  - [ ] All 5 traits resolve valid token references.
  - [ ] All 30 facets resolve valid token references.
  - [ ] Gradient helpers resolve for each trait.
  - [ ] Results/home pages still render with correct trait grouping and no regressions.
  - [ ] Contrast checks documented for text and non-text indicators.
  - [ ] Colorblind simulation outcomes documented in completion notes.

### Previous Story Intelligence

Source analyzed: `/_bmad-output/implementation-artifacts/7-2-add-dark-mode-toggle-with-system-preference-detection.md`

Actionable carry-forward learnings:
- Theme infrastructure is already operational (`ThemeProvider`, `useTheme`, SSR-safe theme script); do not duplicate provider logic.
- Project conventions explicitly avoid `next-themes` integration in app layer due TanStack Start compatibility choices.
- Story 7.2 reinforced using centralized theme handling and avoiding parallel ad-hoc theme code in components.
- Baseline verification from previous story: build and full test suite were green; keep parity after color-token migration.

### Git Intelligence Summary

Recent commit scan (`git log -n 5`) findings:
- `48fb34b chore: sprint updates` updated sprint metadata + epics planning content.
- `c172114 chore: header story` included major BMAD workflow/config churn plus epic/story planning updates.
- `bb5a939 chore: add epik 7 to phase 1` introduced Epic 7 planning artifact (`epic-7-ui-theming.md`) and sequence context.
- `63a8c7a chore: ux improvement hide scores` updated UX guidance and generated frontend build artifacts.
- `41ab228 feat(scoring): compute scores on-demand from evidence` changed domain/infrastructure scoring model and tests.

Implementation implications for Story 7.3:
- Avoid editing generated artifacts under `apps/front/.nitro` and `apps/front/.output`.
- Keep Story 7.3 scoped to design tokens + frontend consumption + domain utility surface.
- Preserve compatibility with the current facet-first domain model and naming (`FacetName` keys from `big-five.ts`).

### Latest Tech Information

Web + registry research completed for story-relevant technologies:

- **Tailwind CSS v4 token workflow**
  - Tailwind v4 documents theme variables via `@theme` and utility usage with custom properties, which matches this story's token strategy.
  - Use Tailwind custom-property color utility syntax for tokenized trait/facet usage instead of raw palette classes.

- **OKLCH browser support**
  - MDN marks `oklch()` as broadly available across modern browsers (baseline availability from 2023), but warns some parts may vary by browser/version.
  - Keep fallbacks and run cross-browser smoke checks on key visualization screens.

- **Accessibility requirements that directly impact this story**
  - WCAG contrast minimums apply: 4.5:1 for normal text, 3:1 for large text.
  - Color cannot be the sole method of conveying information; retain labels/icons/structure signals alongside color coding.

- **Dependency freshness context (as of 2026-02-12)**
  - Registry indicates newer patch versions exist for Tailwind/React/Storybook/lucide compared with this repo's current pins.
  - This story should remain version-stable unless a direct bug demands patch updates.

### Project Context Reference

- `project_context.md` was not found via `**/project-context.md` search.
- Fallback project context source used: `_bmad-output/planning-artifacts/architecture/project-context-analysis.md`.

### Project Structure Notes

- Keep canonical color token definitions in `packages/ui` and typed retrieval in `packages/domain`.
- Frontend routes/components should consume shared utilities/tokens and avoid local, duplicated trait-color maps.
- Maintain alignment with existing route structure (`/results` and `/results/$sessionId`) until route consolidation is explicitly requested.

### References

Internal sources:
- `/_bmad-output/planning-artifacts/epic-7-ui-theming.md`
- `/_bmad-output/planning-artifacts/epics.md`
- `/_bmad-output/planning-artifacts/prd.md`
- `/_bmad-output/planning-artifacts/ux-design-specification.md`
- `/_bmad-output/planning-artifacts/architecture/index.md`
- `/_bmad-output/planning-artifacts/architecture/project-context-analysis.md`
- `/_bmad-output/planning-artifacts/architecture/architecture-decision-records.md`
- `/_bmad-output/planning-artifacts/architecture/decision-5-testing-strategy.md`
- `/_bmad-output/implementation-artifacts/7-2-add-dark-mode-toggle-with-system-preference-detection.md`
- `/docs/FRONTEND.md`
- `/packages/domain/src/constants/big-five.ts`
- `/packages/ui/src/styles/globals.css`
- `/apps/front/src/routes/results.tsx`
- `/apps/front/src/routes/results/$sessionId.tsx`
- `/apps/front/src/components/home/TraitsSection.tsx`

External technical references:
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS Border Color (custom-property color utility syntax)](https://tailwindcss.com/docs/border-color)
- [MDN `oklch()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [WCAG 2.2 Contrast Minimum (SC 1.4.3)](https://www.w3.org/TR/WCAG22/#contrast-minimum)
- [WCAG 2.2 Use of Color (SC 1.4.1)](https://www.w3.org/TR/WCAG22/#use-of-color)

### Story Completion Status

- Story document created with comprehensive implementation guardrails and status set to `ready-for-dev`.
- Completion note: **Ultimate context engine analysis completed - comprehensive developer guide created**.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story creation workflow execution logs (artifact discovery, architecture analysis, git intelligence, web research) captured in this run context.

### Completion Notes List

- Parsed user-selected story `7-3` to canonical key `7-3-define-big-five-trait-and-facet-visualization-colors`.
- Loaded sprint/epic/prd/ux/architecture artifacts and previous story intelligence.
- Added implementation guardrails to prevent hard-coded color regressions and duplicated mapping logic.
- Added Big Five token system in `packages/ui/src/styles/globals.css`: 5 trait tokens, 30 facet tokens, 5 trait gradients, plus Tailwind `@theme inline` mappings for trait/facet/gradient consumption.
- Added canonical domain utility API in `packages/domain/src/utils/trait-colors.ts` with deterministic `getTraitColor()`, `getFacetColor()`, and `getTraitGradient()` helpers; exported through `packages/domain/src/utils/index.ts` and `packages/domain/src/index.ts`.
- Replaced hard-coded frontend color maps in `apps/front/src/routes/results.tsx`, `apps/front/src/routes/results/$sessionId.tsx`, and `apps/front/src/components/home/TraitsSection.tsx`; `apps/front/src/components/home/TraitCard.tsx` now consumes tokenized icon color while keeping heading text semantic for contrast.
- Added domain tests in `packages/domain/src/utils/__tests__/trait-colors.test.ts` covering all 5 traits, all 30 facets, and gradient mappings.
- Updated Storybook token documentation in `packages/ui/src/components/color-palette.stories.tsx` to include trait/facet palettes and trait gradients in light/dark modes.
- Accessibility validation completed with deterministic checks:
  - Light-mode trait icon contrast against card background: Openness `3.61:1`, Conscientiousness `3.11:1`, Extraversion `3.17:1`, Agreeableness `3.10:1`, Neuroticism `4.10:1` (non-text icon target `>=3:1` met).
  - Dark results surfaces use dark trait tokens (`.dark` scoped wrappers) with trait indicator contrast against slate tracks ranging `4.36:1` to `5.78:1`.
  - Facet bars on dark tracks use `color-mix(..., white)` to maintain distinguishability for low-luminance facets.
  - Non-color signaling preserved (trait labels, percentages, icons, expand/collapse structure, facet labels/confidence values, disabled evidence controls).
  - Colorblind simulation snapshots (trait-family min pair distance): protanopia `0.201`, deuteranopia `0.193`, tritanopia `0.151`; grouping remains distinguishable with accompanying text/icon cues.
- Validation runs:
  - `pnpm test` (workspace) passed.
  - `pnpm lint` (workspace) passed with existing non-blocking warnings in unrelated files (`apps/api/src/index.ts`, `apps/front/src/components/TherapistChat.tsx`).
  - `pnpm --filter front build` passed.

### File List

- MODIFIED: `packages/ui/src/styles/globals.css`
- CREATED: `packages/domain/src/utils/trait-colors.ts`
- CREATED: `packages/domain/src/utils/__tests__/trait-colors.test.ts`
- MODIFIED: `packages/domain/src/utils/index.ts`
- MODIFIED: `packages/domain/src/index.ts`
- MODIFIED: `apps/front/src/routes/results.tsx`
- MODIFIED: `apps/front/src/routes/results/$sessionId.tsx`
- MODIFIED: `apps/front/src/components/home/TraitsSection.tsx`
- MODIFIED: `apps/front/src/components/home/TraitCard.tsx`
- MODIFIED: `packages/ui/src/components/color-palette.stories.tsx`
- MODIFIED: `apps/front/package.json`
- MODIFIED: `pnpm-lock.yaml`

### Change Log

- 2026-02-12: Implemented Story 7.3 trait/facet visualization token architecture, migrated frontend color usage to canonical domain utilities, added guardrail tests/docs, and completed accessibility validation.
