---
title: 'Accent Card Component'
slug: 'accent-card-component'
created: '2026-02-16'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'Tailwind CSS v4', 'shadcn/ui', 'cn() (clsx + twMerge)', '@testing-library/react', 'vitest']
files_to_modify: ['packages/ui/src/components/card.tsx', 'apps/front/src/components/results/TraitCard.tsx', 'apps/front/src/components/results/PersonalPortrait.tsx', 'apps/front/src/components/results/DetailZone.tsx']
code_patterns: ['shadcn compound component (plain functions, named exports)', 'data-slot attributes for structural identification', 'cn() class merging with className + ...props spread', 'CSS custom properties (--trait-color)', 'overflow-hidden for accent bar clipping']
test_patterns: ['@vitest-environment jsdom directive', '@testing-library/react (render, screen, fireEvent)', 'text-content queries + data-slot selectors', 'no existing tests assert accent bar structure directly']
---

# Tech-Spec: Accent Card Component

**Created:** 2026-02-16

## Overview

### Problem Statement

Three components on the results page (TraitCard, PersonalPortrait, DetailZone facet cards) independently implement accent bar styling using hardcoded `<div>` elements with inline styles. This duplicates the accent bar pattern across components and makes it inconsistent to maintain or extend.

### Solution

Add `AccentCard` and `CardAccent` compound components to the existing shadcn Card file (`packages/ui/src/components/card.tsx`). `CardAccent` is a configurable accent bar element that accepts Tailwind classes for color/gradient styling and supports positioning (top, left, right, bottom). Refactor TraitCard, PersonalPortrait, and DetailZone facet cards to use the new components.

### Scope

**In Scope:**
- New `AccentCard` wrapper component extending Card with overflow-hidden for accent bars
- New `CardAccent` element component for the accent bar itself (direction + className based)
- Configurable accent position: top (default), left, right, bottom
- Configurable accent styling via Tailwind `className` prop
- Refactor `TraitCard.tsx` to use CardAccent (top, trait color)
- Refactor `PersonalPortrait.tsx` to use CardAccent (top, rainbow gradient)
- Refactor `DetailZone.tsx` facet cards to use CardAccent (left, trait color)

**Out of Scope:**
- Refactoring AboutArchetypeCard, ConfidenceRingCard, or QuickActionsCard
- Changing any visual appearance — this is a refactor (minor DetailZone thickness change noted below)

## Context for Development

### Codebase Patterns

- shadcn Card components are plain functions (not forwardRef), each with `data-slot`, `cn()`, and `...props` spread
- Card itself: `<div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)} {...props} />`
- 7 existing compound components exported: Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent
- No `cva()` on Card — it's not variant-based
- `cn()` = `twMerge(clsx(inputs))` from `@workspace/ui/lib/utils`
- Package exports via `"./components/*": "./src/components/*.tsx"` — auto-discovered
- TraitCard: custom `<button>` with `style={{ '--trait-color': traitColor }}`, accent bar is `<div className="h-1 shrink-0" style={{ backgroundColor: traitColor }} />`
- PersonalPortrait: wraps `<Card>`, accent bar is `<div className="h-1" style={{ background: "linear-gradient(90deg, ...)" }} />`
- DetailZone facet cards: plain `<div>` with `style={{ borderLeftWidth: "3px", borderLeftColor: traitColor }}`
- **Card layout**: Card root is `flex flex-col gap-6` with `py-6`. The `gap-6` inserts spacing between child elements. `py-6` provides top/bottom padding.

### Files to Reference

| File | Purpose | Key Lines |
| ---- | ------- | --------- |
| `packages/ui/src/components/card.tsx` | 7 existing Card compound components | Full file (93 lines) |
| `packages/ui/src/lib/utils.ts` | `cn()` utility | Lines 4-6 |
| `packages/ui/package.json` | Package exports config | Line 43: `"./components/*"` |
| `apps/front/src/components/results/TraitCard.tsx` | Consumer: top accent in `<button>` | Line 67: accent bar div |
| `apps/front/src/components/results/TraitCard.test.tsx` | Tests: no accent bar assertions | Full file |
| `apps/front/src/components/results/PersonalPortrait.tsx` | Consumer: rainbow top accent in `<Card>` | Lines 56-62: gradient div |
| `apps/front/src/components/results/PersonalPortrait.test.tsx` | Tests: queries `[data-slot="personal-portrait"]` | Line 91 |
| `apps/front/src/components/results/DetailZone.tsx` | Consumer: left border on facet cards | Lines 122-125: borderLeft style |
| `apps/front/src/components/results/DetailZone.test.tsx` | Tests: no border assertions | Full file |
| `docs/FRONTEND.md` | data-slot conventions, Tailwind patterns | Full file |

### Technical Decisions

- **Tailwind className-based accent color** (not inline style): Consumers pass classes like `className="bg-[var(--trait-color)]"` or `className="bg-gradient-to-r from-[...] to-[...]"` to the CardAccent element. For complex gradients (e.g., PersonalPortrait rainbow), the `style` prop passes through via `...props` spread.
- **Two components, not one**: `CardAccent` is a standalone presentational element (the bar itself). `AccentCard` is a convenience wrapper = `Card` + `overflow-hidden` + `gap-0` + `p-0`. CardAccent can be used in any container (Card, button, div) — not coupled to Card.
- **Direction via prop, not className**: The `position` prop on CardAccent controls whether the bar renders as horizontal (top/bottom: `h-1 w-full`) or vertical (left/right: `w-[3px]`). **Important constraint:** `position="left"` and `position="right"` require the parent to use `flex-row` layout. This is documented but not enforced — the consumer is responsible for setting the correct flex direction.
- **Always a `<div>` element**: CardAccent is consistently a `<div>` element for all positions (never uses CSS border). For left/right positions, the consumer wraps content in `flex-row` layout. One rendering model, predictable behavior.
- **Thickness defaults**: `h-1` (4px) for top/bottom. `w-[3px]` for left/right to match existing DetailZone border width. Override via `className` if needed. No separate `thickness` prop (YAGNI).
- **DetailZone structural change**: Facet cards change from `border-left` CSS to a `flex-row` wrapper with CardAccent div + content div. The content column is ~3px narrower due to the accent div occupying physical layout space (vs. border which sits inside the box model). This is a negligible visual difference.
- **Accessibility**: `CardAccent` is a decorative element and renders with `aria-hidden="true"` and `role="presentation"` to be invisible to screen readers.
- **AccentCard padding/gap override**: AccentCard uses `p-0 gap-0` to remove Card's default `py-6` and `gap-6`. This ensures the accent bar sits flush at the edge with no spacing between it and the first content element. Consumers must use `CardContent` (which provides `px-6`) or add their own padding.

## Implementation Plan

### Tasks

- [ ] Task 1: Add `CardAccent` component to card.tsx
  - File: `packages/ui/src/components/card.tsx`
  - Action: Add a new `CardAccent` function component after the existing `CardFooter` component. The component accepts:
    - `position?: "top" | "left" | "right" | "bottom"` (default: `"top"`)
    - `className?: string`
    - `...props: React.ComponentProps<"div">`
  - Implementation:
    ```tsx
    type AccentPosition = "top" | "left" | "right" | "bottom"

    const ACCENT_POSITION_CLASSES: Record<AccentPosition, string> = {
      top: "h-1 w-full shrink-0",
      bottom: "h-1 w-full shrink-0",
      left: "w-[3px] shrink-0 self-stretch",
      right: "w-[3px] shrink-0 self-stretch",
    }

    function CardAccent({
      position = "top",
      className,
      ...props
    }: React.ComponentProps<"div"> & {
      position?: AccentPosition
    }) {
      return (
        <div
          data-slot="card-accent"
          data-position={position}
          aria-hidden="true"
          role="presentation"
          className={cn(ACCENT_POSITION_CLASSES[position], className)}
          {...props}
        />
      )
    }
    ```
  - Add `CardAccent` to the export block at the bottom of the file.
  - Notes: Uses `data-slot="card-accent"` and `data-position` per project conventions. `shrink-0` prevents the bar from being compressed by flex layouts. `self-stretch` ensures vertical bars fill the container height. `aria-hidden` and `role="presentation"` ensure the decorative element is invisible to screen readers. `AccentPosition` type provides type safety on the classes record.

- [ ] Task 2: Add `AccentCard` convenience wrapper to card.tsx
  - File: `packages/ui/src/components/card.tsx`
  - Action: Add a new `AccentCard` function component after `CardAccent`. It's a `Card` with `overflow-hidden`, `p-0`, and `gap-0` to support flush accent bars.
  - Implementation:
    ```tsx
    function AccentCard({ className, ...props }: React.ComponentProps<"div">) {
      return (
        <Card
          className={cn("overflow-hidden gap-0 p-0", className)}
          {...props}
        />
      )
    }
    ```
  - Add `AccentCard` to the export block.
  - Notes: `overflow-hidden` clips the accent bar corners. `p-0` removes Card's default `py-6` so the accent bar sits at the edge. `gap-0` removes Card's default `gap-6` so there's no spacing between the accent bar and the first content element. No `data-slot` is set on AccentCard — consumers can pass their own `data-slot` via `...props` (e.g., PersonalPortrait passes `data-slot="personal-portrait"` which will be applied to the root Card div since Card uses `{...props}` spread).

- [ ] Task 3: Refactor TraitCard to use CardAccent
  - File: `apps/front/src/components/results/TraitCard.tsx`
  - Action: Replace the hardcoded accent bar div (line 67) with `CardAccent`.
  - Before (line 67):
    ```tsx
    <div className="h-1 shrink-0" style={{ backgroundColor: traitColor }} />
    ```
  - After:
    ```tsx
    <CardAccent style={{ backgroundColor: traitColor }} />
    ```
  - Add import: `import { CardAccent } from "@workspace/ui/components/card";`
  - Notes: TraitCard is a `<button>`, not a Card, so we only use `CardAccent` (not `AccentCard`). The `style` prop passes through for the dynamic trait color. Default position "top" provides `h-1 w-full shrink-0` which matches the existing classes exactly — no need to duplicate `shrink-0` via className.

- [ ] Task 4: Refactor PersonalPortrait to use AccentCard + CardAccent
  - File: `apps/front/src/components/results/PersonalPortrait.tsx`
  - Action: Replace `<Card>` with `<AccentCard>` and replace the hardcoded rainbow gradient div with `<CardAccent>`. Adjust internal spacing to compensate for AccentCard's `p-0 gap-0`.
  - Before (lines 54-62):
    ```tsx
    <Card data-slot="personal-portrait" className="col-span-full overflow-hidden">
      {/* Rainbow accent bar */}
      <div
        className="h-1"
        style={{
          background:
            "linear-gradient(90deg, var(--trait-openness), var(--trait-conscientiousness), var(--trait-extraversion), var(--trait-agreeableness), var(--trait-neuroticism))",
        }}
      />
    ```
  - After:
    ```tsx
    <AccentCard data-slot="personal-portrait" className="col-span-full">
      <CardAccent
        style={{
          background:
            "linear-gradient(90deg, var(--trait-openness), var(--trait-conscientiousness), var(--trait-extraversion), var(--trait-agreeableness), var(--trait-neuroticism))",
        }}
      />
    ```
  - Update closing tag from `</Card>` to `</AccentCard>`.
  - Update import: Replace `Card` with `AccentCard` in the import from `@workspace/ui/components/card`, add `CardAccent`.
  - **Spacing adjustment**: Since AccentCard uses `p-0 gap-0` instead of Card's `py-6 gap-6`, the CardHeader and CardContent children need vertical spacing. Add `pt-6` to the first `CardHeader` and `pb-6` to the last `CardContent` (or wrap children in a `<div className="flex flex-col gap-6 py-6">`). Check actual PersonalPortrait children to determine the correct approach.
  - Notes: `overflow-hidden` moves from Card's className to AccentCard's built-in class. `data-slot="personal-portrait"` passes through to the underlying Card via `...props` spread, preserving the existing test selector (`[data-slot="personal-portrait"]` in PersonalPortrait.test.tsx:91). Rainbow gradient stays as `style` since it uses 5 CSS custom properties.

- [ ] Task 5: Refactor DetailZone facet cards to use CardAccent
  - File: `apps/front/src/components/results/DetailZone.tsx`
  - Action: Replace the `borderLeft` inline style on facet cards (lines 122-125) with a `flex-row` wrapper containing `CardAccent` with `position="left"`.
  - Before (lines 122-125):
    ```tsx
    <div
      key={facet.name}
      className="rounded-lg border p-4"
      style={{ borderLeftWidth: "3px", borderLeftColor: traitColor }}
    >
      {/* Facet header */}
      ...
    </div>
    ```
  - After:
    ```tsx
    <div
      key={facet.name}
      className="flex rounded-lg border overflow-hidden"
    >
      <CardAccent position="left" style={{ backgroundColor: traitColor }} />
      <div className="flex-1 p-4">
        {/* Facet header */}
        ...
      </div>
    </div>
    ```
  - Add import: `import { CardAccent } from "@workspace/ui/components/card";`
  - Notes: The wrapper div changes from `p-4` to `flex overflow-hidden` with padding moving to an inner content div. This is a structural change — the facet content is now wrapped in an additional `<div className="flex-1 p-4">`. `overflow-hidden` clips the CardAccent bar to the rounded corners. The accent bar uses `w-[3px]` (matching the original 3px border width) via the `position="left"` default classes. Content area is ~3px narrower than before (border occupies box-model space vs. div occupying flex layout space) — negligible visual difference.

- [ ] Task 6: Run existing tests and verify no regressions
  - Action: Run `pnpm test:run` to verify all existing tests pass without modification.
  - Expected: TraitCard.test.tsx, PersonalPortrait.test.tsx, and DetailZone.test.tsx should all pass since none of them assert on the accent bar structure.
  - If any test fails: Fix the test to match the new structure while preserving the test intent.

- [ ] Task 7: Run lint and type checks
  - Action: Run `pnpm lint` and `pnpm turbo lint` to verify no lint errors or type issues.
  - Expected: Clean pass. New imports and components are properly typed.

### Acceptance Criteria

- [ ] AC 1: Given `CardAccent` is rendered with `position="top"` (default), when inspected, then it renders a `<div>` with `data-slot="card-accent"`, `data-position="top"`, `aria-hidden="true"`, `role="presentation"`, and classes `h-1 w-full shrink-0`.

- [ ] AC 2: Given `CardAccent` is rendered with `position="left"`, when inspected, then it renders a `<div>` with `data-position="left"` and classes `w-[3px] shrink-0 self-stretch`.

- [ ] AC 3: Given `CardAccent` receives a `className` prop (e.g., `className="bg-red-500"`), when rendered, then the custom class is merged with the default position classes via `cn()`.

- [ ] AC 4: Given `CardAccent` receives a `style` prop (e.g., `style={{ backgroundColor: "oklch(0.67 0.13 181)" }}`), when rendered, then the style is applied via `...props` spread.

- [ ] AC 5: Given `AccentCard` is rendered, when inspected, then it renders as a `Card` with `overflow-hidden`, `gap-0`, and `p-0` classes applied. No hardcoded `data-slot` — consumers pass their own.

- [ ] AC 6: Given `TraitCard` is rendered after refactor, when visually compared to the original, then the appearance is identical — 4px top accent bar in the trait color, same layout, same hover/selected behavior.

- [ ] AC 7: Given `PersonalPortrait` is rendered after refactor, when visually compared to the original, then the appearance is identical — rainbow gradient bar at top, same card layout, same section rendering, same vertical spacing.

- [ ] AC 8: Given `DetailZone` facet cards are rendered after refactor, when visually compared to the original, then the appearance matches — left accent bar with matching color, same facet content layout. Minor 3px→3px thickness preserved via `w-[3px]`.

- [ ] AC 9: Given all existing tests are run (`pnpm test:run`), when the test suite completes, then all tests pass without modification (zero regressions).

- [ ] AC 10: Given lint is run (`pnpm lint` and `pnpm turbo lint`), when checks complete, then zero errors and zero warnings.

## Additional Context

### Dependencies

- No new package dependencies required
- Uses existing `cn()` utility from `@workspace/ui/lib/utils`
- Consumers import from `@workspace/ui/components/card` — the existing export path, auto-discovered via `"./components/*"` pattern

### Testing Strategy

**Unit Tests (not required for this story):** The new components are purely presentational with no logic. Existing consumer tests cover rendering. Adding unit tests for CardAccent and AccentCard is optional and can be done separately.

**Regression Tests (Task 6):** Run all existing tests to verify:
- `TraitCard.test.tsx` — 6 tests (render, facets, click, selected state, percentage, level badge)
- `PersonalPortrait.test.tsx` — 6 tests (structured JSON, legacy text, displayName, invalid JSON, accent bar)
- `DetailZone.test.tsx` — 7 tests (facet names, evidence quotes, signal badge, empty facets, close button, loading, evidence count)

**Manual Visual Testing:**
1. Start dev server (`pnpm dev`)
2. Navigate to results page (`/results/{sessionId}`)
3. Verify TraitCard accent bars match original (all 5 trait colors)
4. Verify PersonalPortrait rainbow gradient bar + vertical spacing matches original
5. Click a trait card → verify DetailZone facet cards have left accent bars with matching thickness
6. Compare with original using browser DevTools screenshot overlay

### Notes

- **TraitCard is a `<button>`, not a Card.** It uses `CardAccent` directly without AccentCard wrapper. The accent bar is just a `<div>` child — it works in any container.
- **PersonalPortrait test selector preservation**: `data-slot="personal-portrait"` passes through `...props` to the underlying Card div. The test at PersonalPortrait.test.tsx:91 queries `[data-slot="personal-portrait"]` which continues to work because Card renders `{...props}` last, allowing consumer-provided data-slot to override.
- **PersonalPortrait spacing**: AccentCard removes Card's `py-6` and `gap-6`. The implementer must add compensating spacing to the children (e.g., wrapping children in `<div className="flex flex-col gap-6 py-6">` or adding `pt-6`/`pb-6` to individual children) to preserve the original vertical rhythm.
- **DetailZone structural change:** Facet cards gain one additional wrapper `<div className="flex-1 p-4">` around the content. This changes the DOM depth but the visual result is near-identical. No existing tests should break since they query by text content and aria-labels, not DOM structure. Content area is ~3px narrower due to the accent div occupying flex space.
- **CardAccent parent layout constraint:** `position="left"` and `position="right"` require the parent element to use `flex-row` (or `flex` which defaults to row). Using these positions inside a `flex-col` container (like standard Card) will produce incorrect rendering. This is a consumer responsibility — consider adding a JSDoc comment on the `position` prop.
- **Future consumers:** Any new card that needs an accent bar can use `<AccentCard>` + `<CardAccent>` for the standard pattern, or just `<CardAccent>` in a custom container.

### Adversarial Review Findings Applied

The following findings from adversarial review were addressed in this revision:

| ID | Fix Applied |
|----|-------------|
| F1 | Fixed: "8 components" → "7 components" in codebase patterns |
| F2 | Fixed: Removed redundant `shrink-0` from Task 3 — default classes already include it |
| F3 | Fixed: Changed left/right default to `w-[3px]` to match existing 3px border width |
| F4 | Acknowledged: Content area ~3px narrower; documented as negligible visual difference |
| F5 | Fixed: AccentCard now uses `gap-0` in addition to `p-0`; Task 4 includes spacing adjustment step |
| F6 | Fixed: Removed hardcoded `data-slot` from AccentCard — consumers pass their own via `...props` |
| F7 | Fixed: Corrected line references in files table |
| F8 | Fixed: Added `aria-hidden="true"` and `role="presentation"` to CardAccent |
| F9 | Acknowledged: Manual visual testing covers regression; stories can be added separately |
| F10 | Fixed: AccentCard uses `gap-0` to eliminate gap between accent bar and content |
| F11 | Fixed: `Record<string, string>` → `Record<AccentPosition, string>` with typed union |
| F12 | Documented: Added explicit note about parent flex-direction constraint for left/right positions |
