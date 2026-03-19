# Story 32-1: Results Page — Identity Section

## Status: ready-for-dev

## Summary

Enhance the existing results page Identity Section (hero + OCEAN code strand) to satisfy all acceptance criteria from Epic 3, Story 3.1. The core components (`ArchetypeHeroSection`, `OceanCodeStrand`, `ProfileView`) already exist. This story fills remaining gaps: tribe group display in the hero, `aria-describedby` tooltips on OCEAN code letters in the hero section, minimum 44px tap targets on mobile, SSR loader prefetch verification, and comprehensive test coverage.

## Acceptance Criteria

**AC-1:** Given a user has completed their 25-exchange conversation, when they land on the results page, then the hero section displays their archetype name, tribe group label (O-Group/G-Group/P-Group derived from Openness level), and GeometricSignature.

**AC-2:** Given the hero section renders, when the OCEAN code letters are displayed, then each letter is wrapped in a `<button>` with `aria-describedby` pointing to a tooltip that shows the trait name and level label.

**AC-3:** Given the results page loads, when trait scores are derived from 30 facet scores, then the OCEAN code is computed via threshold mapping and the archetype is looked up from the in-memory registry. No stored aggregations are read — facet scores are the single source of truth (derive-at-read, NFR29).

**AC-4:** Given the results page loads, then the page is server-rendered with the results data prefetched in the route loader (SSR via TanStack Start). Target LCP < 1.5s (NFR3).

**AC-5:** Given a user views the identity section on mobile (viewport < 640px), then the layout stacks vertically with full-width components, and all interactive elements (OCEAN code letter buttons, scroll indicator) meet 44px minimum tap targets.

**AC-6:** All new and modified components have unit test coverage.

## Tasks

### Task 1: Add tribe group utility to domain package

**File:** `packages/domain/src/utils/tribe-group.ts`

Create a pure function that derives the tribe group from the first letter of an OCEAN code (Openness level):
- `O` -> "O-Group: Open-Minded"
- `M` -> "G-Group: Grounded"
- `T` -> "P-Group: Practical"

Export from `packages/domain/src/index.ts`.

**Subtasks:**
1. Write failing test for `getTribeGroup()` in `packages/domain/src/utils/__tests__/tribe-group.test.ts`
2. Implement `getTribeGroup()` function
3. Export from domain index

### Task 2: Add aria-describedby tooltips to OCEAN code letters in ArchetypeHeroSection

**File:** `apps/front/src/components/results/ArchetypeHeroSection.tsx`

Currently the OCEAN code letters in the hero section are plain `<span>` elements. Wrap each in a `<button>` element with:
- `aria-describedby` pointing to a tooltip ID
- Tooltip content: trait name + level label (e.g., "Openness: Open-minded")
- Minimum 44px tap target (min-w-11 min-h-11)
- Keyboard navigable (Tab + Enter/Space shows tooltip)

Use the existing `Tooltip` component from `@workspace/ui/components/tooltip`.

**Subtasks:**
1. Write failing test for aria-describedby presence on OCEAN code buttons
2. Refactor OCEAN code rendering to use `<button>` + `Tooltip` with `aria-describedby`
3. Ensure 44px minimum tap target via Tailwind classes

### Task 3: Add tribe group display to ArchetypeHeroSection

**File:** `apps/front/src/components/results/ArchetypeHeroSection.tsx`

Add a tribe group label below the archetype name or near the confidence pill. Derive from `oceanCode5[0]` using the new `getTribeGroup()` utility.

**Subtasks:**
1. Write failing test for tribe group label rendering
2. Add tribe group label to the hero section
3. Style appropriately (muted, small text, pill-style)

### Task 4: Ensure SSR prefetch in route loader (verification)

**File:** `apps/front/src/routes/results/$assessmentSessionId.tsx`

Verify the route loader already calls `ensureQueryData(getResultsQueryOptions(...))` for SSR. This is already implemented — this task is a verification pass.

**Subtasks:**
1. Verify route loader prefetches results data
2. Verify `staleTime` is set to enable SSR hydration without refetch

### Task 5: Add comprehensive test coverage

**Files:**
- `apps/front/src/components/results/ArchetypeHeroSection.test.tsx` (new)
- `packages/domain/src/utils/__tests__/tribe-group.test.ts` (new)

Write unit tests covering:
- Hero section renders archetype name, GeometricSignature, OCEAN code, confidence, description
- OCEAN code letters have aria-describedby attributes
- Tribe group label renders correctly for all 3 groups
- Mobile layout (44px tap targets verified via class assertions)

## Technical Notes

- **Derive-at-read (NFR29):** The backend already derives all scores from facet evidence at read time (see `get-results.use-case.ts`). The frontend receives pre-computed results via the API. No changes needed on the backend.
- **Existing components:** `ArchetypeHeroSection`, `OceanCodeStrand`, `GeometricSignature`, `ProfileView` are all already implemented and wired into the results route.
- **Test pattern:** Use `@testing-library/react` with `render` + `screen` queries. See `ArchetypeCard.test.tsx` for the established pattern.
- **OCEAN code letter mapping:** Use `getTraitLevelLabel(traitName, letter)` from `@workspace/domain` for tooltip content.
