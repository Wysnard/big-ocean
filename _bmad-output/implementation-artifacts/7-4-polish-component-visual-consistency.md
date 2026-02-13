# Story 7.4: Polish Component Visual Consistency

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **all UI components to feel cohesive and polished**,
so that **the application feels professional, trustworthy, and consistently usable across desktop and mobile**.

## Acceptance Criteria

1. **Given** I navigate across core app surfaces (home, chat, results, auth, dashboard) **When** I encounter different components (buttons, cards, inputs, dialogs, banners) **Then** components share consistent border radius, elevation, spacing rhythm, and visual hierarchy.
2. **Given** I use the app on mobile **When** I interact with controls **Then** all interactive targets are at least `44x44` CSS px **And** spacing remains touch-friendly.
3. **Given** I use keyboard navigation **When** I tab through interactive elements **Then** focus states are visible, consistent, and meet WCAG guidance.
4. **Given** components include motion/animation **When** transitions run **Then** timings are standardized in the `150-300ms` range for UI interactions **And** motion respects reduced-motion preferences.
5. **Given** loading and error states appear **When** skeletons/spinners/banners render **Then** they align with the same design-token system and visual language as the rest of the UI.
6. **Given** this story is complete **When** code is reviewed **Then** hard-coded legacy color classes for production surfaces targeted in this story are removed in favor of semantic/theme tokens.

## Tasks / Subtasks

- [ ] **Task 1: Run a component consistency audit and define acceptance matrix** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Audit inconsistent patterns in targeted files and document baseline for radius, shadow, spacing, focus, motion, and touch targets.
  - [ ] Confirm canonical scales for this story:
    - [ ] Radius: token-based (`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`) with `--radius` as source of truth.
    - [ ] Shadow: `shadow-xs`, `shadow-sm`, `shadow-md` only (avoid ad-hoc `shadow-xl` unless explicitly justified).
    - [ ] Motion: `duration-150`, `duration-200`, `duration-300` for interaction transitions.
    - [ ] Touch target: `min-h-11` and `min-w-11` for icon/compact controls.

- [ ] **Task 2: Normalize shared UI primitives and focus behavior** (AC: 1, 3, 4)
  - [ ] Update `packages/ui/src/components/button.tsx` variant sizing where needed to ensure compact/icon targets remain touch-safe on mobile contexts.
  - [ ] Normalize modal/menu/sheet polish in:
    - [ ] `packages/ui/src/components/dialog.tsx`
    - [ ] `packages/ui/src/components/dropdown-menu.tsx`
    - [ ] `packages/ui/src/components/sheet.tsx`
  - [ ] Keep state styling aligned with `docs/FRONTEND.md` data-attribute conventions (`data-state`, `data-slot`).

- [ ] **Task 3: Polish results surfaces for token consistency** (AC: 1, 3, 4, 5, 6)
  - [ ] Remove remaining hard-coded slate/gray/blue utility classes and migrate to semantic/theme tokens in:
    - [ ] `apps/front/src/routes/results.tsx`
    - [ ] `apps/front/src/routes/results/$sessionId.tsx`
    - [ ] `apps/front/src/components/results/ArchetypeCard.tsx`
    - [ ] `apps/front/src/components/results/TraitBar.tsx`
    - [ ] `apps/front/src/components/results/FacetBreakdown.tsx`
  - [ ] Ensure trait/facet visual cues continue to use canonical utilities from Story 7.3 (`getTraitColor`, facet mappings) with non-color cues preserved.

- [ ] **Task 4: Polish auth and account surfaces** (AC: 1, 2, 3, 6)
  - [ ] Replace legacy raw form classes in:
    - [ ] `apps/front/src/components/auth/login-form.tsx`
    - [ ] `apps/front/src/components/auth/signup-form.tsx`
    - [ ] `apps/front/src/components/auth/SignUpModal.tsx`
    - [ ] `apps/front/src/routes/dashboard.tsx`
  - [ ] Ensure semantic tokens and consistent focus rings are used for all form inputs/actions.

- [ ] **Task 5: Polish legacy chat/support components still using hard-coded styles** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Update `apps/front/src/components/TherapistChat.tsx` to remove remaining legacy hard-coded color classes and normalize radius/shadow/motion patterns.
  - [ ] Update `apps/front/src/components/ProgressBar.tsx` and `apps/front/src/components/ErrorBanner.tsx` to semantic tokens and consistent interaction styling.

- [ ] **Task 6: Accessibility and regression guardrails** (AC: 2, 3, 4, 5)
  - [ ] Verify keyboard focus visibility and no focus traps across dialogs/menus/sheets.
  - [ ] Verify touch-target minimums (`>=44px`) on mobile breakpoints for updated controls.
  - [ ] Verify reduced-motion compatibility for interaction animations.
  - [ ] Confirm contrast remains WCAG-compliant after token migration.

- [ ] **Task 7: Test and documentation updates** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Update/add unit tests where class/state assertions changed.
  - [ ] Update Storybook stories for affected components as needed.
  - [ ] Run validation commands:
    - [ ] `pnpm lint`
    - [ ] `pnpm test:run`
    - [ ] `pnpm build --filter=front`

## Dev Notes

### Developer Context Section

- Epic 7 is the visual-polish track; this story is the **final consistency pass** after theme foundation work in Stories 7.1, 7.2, 7.3, 7.5, and 7.6.
- Existing groundwork already in place:
  - Semantic/OKLCH token system and gradients in `packages/ui/src/styles/globals.css`.
  - Working light/dark theme infrastructure via ThemeProvider + `useTheme`.
  - Trait/facet token utilities from Story 7.3 in `@workspace/domain`.
  - Home page redesign (Story 7.5) and header/theme controls (Story 7.6).
- Current gap identified in repository scan: several production-facing screens still contain legacy hard-coded classes (`slate/gray/blue/purple`), mixed radius/shadow usage, and inconsistent focus/touch treatment.
- This story is **frontend-only polish and consistency hardening**. No backend contracts, domain scoring logic, or database schema changes are needed.
- Primary business outcome: user trust and perceived product quality increase when visual language is coherent across all core flows.

### Technical Requirements

- Use semantic/theme tokens for production UI surfaces; avoid newly introducing hard-coded palette classes for core UI components.
- Keep `--radius` token as design-system source of truth; component classes should map to tokenized radius scale (`rounded-md/lg/xl/full`) consistently.
- Standardize interaction motion to `150-300ms` for hover/expand/focus transitions unless there is a clear UX rationale otherwise.
- Ensure interactive controls on mobile satisfy `>=44x44px` by applying `min-h-11` and `min-w-11` where appropriate.
- Preserve non-color affordances (icons, labels, text, structure) so meaning is not conveyed by color alone.
- Maintain reduced-motion compatibility (`motion-safe:` where animation is optional).
- Keep code reuse high:
  - Reuse shared primitives from `@workspace/ui`.
  - Reuse domain trait/facet color helpers from `@workspace/domain`.
  - Avoid duplicate local style maps for trait/facet semantics.

### Architecture Compliance

- Respect monorepo boundaries:
  - `packages/ui` owns shared component primitives and style conventions.
  - `apps/front` owns route-level composition and app-specific UX.
  - `packages/domain` remains source of truth for typed trait/facet semantics.
- Keep TanStack Start + React architecture unchanged (no routing model rewrites).
- Follow `docs/FRONTEND.md` conventions:
  - `data-slot` for structural markers.
  - `data-state` and related data attributes for runtime styling behavior.
  - Use CVA/variant patterns for reusable visual variants where appropriate.
- Do not introduce infrastructure/auth/session-flow behavior changes in this polish story.

### Library/Framework Requirements

Current repo baseline (relevant to this story):
- Frontend runtime: React `^19.2.0`, TanStack Start `^1.132.0`, Tailwind CSS `^4.0.6` in `apps/front`
- Shared UI package: Tailwind CSS `^4.1.11`, Radix Dialog `^1.1.15`, Radix Dropdown Menu `^2.1.15`

Latest registry check (captured 2026-02-12):
- `tailwindcss`: `4.1.18`
- `react`: `19.2.4`
- `@radix-ui/react-dialog`: `1.1.15`
- `@radix-ui/react-dropdown-menu`: `2.1.16`
- `@tanstack/react-start`: `1.159.5`
- `@storybook/react-vite`: `10.2.8`
- `lucide-react`: `0.563.0`

Implementation rule for this story:
- **Do not upgrade dependencies by default**. Keep scope on visual-consistency polish unless a specific bug/blocker requires a targeted patch bump.

### File Structure Requirements

Expected primary touchpoints for this story:

- Shared primitives and design-system layer
  - `packages/ui/src/components/button.tsx`
  - `packages/ui/src/components/dialog.tsx`
  - `packages/ui/src/components/dropdown-menu.tsx`
  - `packages/ui/src/components/sheet.tsx`
  - `packages/ui/src/styles/globals.css` (only if additional token-level polish is required)

- Results and profile-facing experiences
  - `apps/front/src/routes/results.tsx`
  - `apps/front/src/routes/results/$sessionId.tsx`
  - `apps/front/src/components/results/ArchetypeCard.tsx`
  - `apps/front/src/components/results/TraitBar.tsx`
  - `apps/front/src/components/results/FacetBreakdown.tsx`

- Auth/account and legacy surfaces with visual inconsistency
  - `apps/front/src/components/auth/login-form.tsx`
  - `apps/front/src/components/auth/signup-form.tsx`
  - `apps/front/src/components/auth/SignUpModal.tsx`
  - `apps/front/src/routes/dashboard.tsx`
  - `apps/front/src/components/TherapistChat.tsx`
  - `apps/front/src/components/ProgressBar.tsx`
  - `apps/front/src/components/ErrorBanner.tsx`

Guidance:
- Keep modifications focused and incremental.
- Avoid touching generated assets (`apps/front/.nitro`, `apps/front/.output`).

### Testing Requirements

- Unit/component validation (Vitest)
  - Update tests impacted by class/structure changes in results and shared components.
  - Ensure interaction-state tests still pass (expanded/collapsed states, disabled buttons, focus behavior).

- Storybook/a11y checks
  - Update relevant stories to reflect standardized visual states.
  - Ensure addon-a11y checks pass for changed components.

- Manual QA matrix
  - Light and dark mode visual pass across home, chat, results, auth, dashboard.
  - Keyboard-only navigation pass: visible focus and logical tab order.
  - Mobile viewport pass: touch targets and spacing.
  - Reduced-motion pass where animations exist.

- Required command checks
  - `pnpm lint`
  - `pnpm test:run`
  - `pnpm build --filter=front`

### Previous Story Intelligence

Source analyzed: `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/7-3-define-big-five-trait-and-facet-visualization-colors.md`

Carry-forward constraints from Story 7.3:
- Trait/facet color semantics are centralized in domain utilities; do not reintroduce local hard-coded maps.
- UI token architecture already exists in `packages/ui/src/styles/globals.css`; extend/reuse, do not fork.
- Non-color cues were intentionally preserved in results surfaces for accessibility; keep that pattern intact.
- Story 7.3 explicitly avoided dependency upgrades for scope control; apply the same scope discipline here.

### Git Intelligence Summary

Recent commits reviewed:
- `48fb34b` — sprint-status and epic planning updates
- `c172114` — broad BMAD workflow/config updates and planning updates
- `bb5a939` — Epic 7 moved to phase 1 and thematic planning files added
- `63a8c7a` — UX/story updates, plus generated frontend build artifacts updated
- `41ab228` — backend/domain scoring changes (Story 2.9)

Implementation implications:
- Epic 7 planning context is fresh; align this story with those artifacts.
- Avoid committing generated build output changes while implementing polish.
- Keep Story 7.4 focused on UI consistency; avoid mixing backend scoring changes into this work.

### Latest Tech Information

External guidance snapshot (verified 2026-02-12):

- Tailwind CSS v4 utility guidance supports token/custom-property based styling for radius and durations, including:
  - `rounded-(<custom-property>)`
  - `duration-(<custom-property>)`
  - default transition duration references `150ms` baseline
- WCAG 2.2 criteria relevant to this story:
  - Contrast minimum remains `4.5:1` for normal text (SC 1.4.3)
  - Color cannot be the sole means of conveying information (SC 1.4.1)
  - Target Size Minimum (AA, SC 2.5.8) is `24x24` CSS px with exceptions
  - Target Size Enhanced (AAA, SC 2.5.5) is `44x44` CSS px

Project decision for this story:
- Continue enforcing the stricter `>=44x44` target from Epic 7 acceptance criteria even though WCAG AA minimum allows `24x24` in many cases.

### Project Context Reference

- Pattern search for `**/project-context.md` returned no file.
- Fallback project context source used:
  - `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/project-context-analysis.md`

### Project Structure Notes

- Keep shared styling semantics in `packages/ui`; app-specific composition stays in `apps/front`.
- Reuse `@workspace/ui` primitives before introducing route-local style logic.
- Reuse `@workspace/domain` trait/facet helpers; do not duplicate trait/facet constants in route files.

### References

Internal sources:
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/epics.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/epic-7-ui-theming.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/ux-design-specification.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/prd.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/index.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/project-context-analysis.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/decision-5-testing-strategy.md`
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/7-3-define-big-five-trait-and-facet-visualization-colors.md`
- `/Users/vincentlay/Projects/big-ocean/docs/FRONTEND.md`

External sources:
- https://tailwindcss.com/docs/border-radius
- https://tailwindcss.com/docs/transition-duration
- https://www.w3.org/TR/WCAG22/#contrast-minimum
- https://www.w3.org/TR/WCAG22/#use-of-color
- https://www.w3.org/TR/WCAG22/#target-size-minimum
- https://www.w3.org/TR/WCAG22/#target-size-enhanced

### Story Completion Status

- Story status is set to `ready-for-dev`.
- Completion note: **Ultimate context engine analysis completed - comprehensive developer guide created**.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Workflow execution: `/Users/vincentlay/Projects/big-ocean/_bmad/core/tasks/workflow.xml`
- Workflow config: `/Users/vincentlay/Projects/big-ocean/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
- Instruction file: `/Users/vincentlay/Projects/big-ocean/_bmad/bmm/workflows/4-implementation/create-story/instructions.xml`

### Completion Notes List

- Parsed user-selected story input `7-4` to canonical sprint key `7-4-polish-component-visual-consistency`.
- Loaded epic, UX, PRD, architecture, and previous-story artifacts for context extraction.
- Included architecture/testing/frontend guardrails to prevent duplicated styling logic and regression risk.
- Included latest-version and standards snapshot relevant to visual-consistency implementation.
- Story generated for implementation readiness; no production source code changes applied in this step.

### File List

- CREATED: `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/7-4-polish-component-visual-consistency.md`
