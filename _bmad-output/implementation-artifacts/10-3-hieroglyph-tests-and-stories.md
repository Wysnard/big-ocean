# Story 10.3: Hieroglyph Tests & Storybook Stories Rewrite

Status: ready-for-dev

## Story

As a developer,
I want all tests and Storybook stories updated to reflect the hieroglyph rename and new component API,
so that test coverage and visual documentation remain complete and accurate.

## Acceptance Criteria

1. Unit tests for `OCEAN_HIEROGLYPHS` lookup table — verifies all 15 keys, valid viewBox, non-empty elements, no color attributes
2. Unit tests for `OceanHieroglyph` — verifies SVG rendering for all 15 letters, `fill="currentColor"`, `data-slot`, `aria-hidden`
3. Unit tests for `OceanHieroglyphCode` — verifies 5-glyph rendering, `data-trait` attributes with correct `TraitName` values, animation classes, archetype name, monochrome mode
4. Unit tests for `OceanHieroglyphSet` — verifies 5 "high" glyphs rendered, mono mode
5. Old `GeometricSignature.test.tsx` deleted (superseded by `OceanHieroglyphCode` tests)
6. Storybook stories created: `OceanHieroglyphs.stories.tsx`, `OceanHieroglyphCode.stories.tsx`, `OceanHieroglyphSet.stories.tsx`
7. Old stories deleted: `OceanShapes.stories.tsx`, `GeometricSignature.stories.tsx`, `OceanShapeSet.stories.tsx`
8. No test or story references `ocean-shape` terminology or the deleted `ocean-shapes/` directory
9. All e2e tests updated to use `ocean-hieroglyph-*` in `data-slot`/`data-testid` selectors
10. Kitchen sink demos verified as working (visual check via Storybook or dev route)

## Tasks / Subtasks

- [ ] Task 1: Lookup table unit tests (AC: #1)
  - [ ] Create test file in `packages/domain/src/constants/__tests__/ocean-hieroglyphs.test.ts` (or appropriate test location)
  - [ ] Test: all 15 `TraitLevel` keys present in `OCEAN_HIEROGLYPHS`
  - [ ] Test: each definition has `viewBox` matching `"0 0 24 24"`
  - [ ] Test: each definition has non-empty `elements` array
  - [ ] Test: no element contains `fill`, `stroke`, or `color` in attrs keys

- [ ] Task 2: `OceanHieroglyph` unit tests (AC: #2)
  - [ ] Create test file in `packages/ui/src/components/__tests__/ocean-hieroglyph.test.tsx` (or co-located)
  - [ ] Test: renders SVG for each of the 15 letters
  - [ ] Test: SVG has `fill="currentColor"` (not a hardcoded color)
  - [ ] Test: SVG has `data-slot="ocean-hieroglyph-{letter}"` (lowercase)
  - [ ] Test: SVG has `aria-hidden="true"`
  - [ ] Test: `className` prop is applied to the SVG
  - [ ] Test: graceful handling of invalid letter (if applicable to component design)

- [ ] Task 3: `OceanHieroglyphCode` unit tests (AC: #3)
  - [ ] Create test file in `packages/ui/src/components/__tests__/ocean-hieroglyph-code.test.tsx` (or co-located)
  - [ ] Test: renders exactly 5 glyphs for a valid `OceanCode5`
  - [ ] Test: each glyph wrapper has `data-trait` matching OCEAN order (`openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`)
  - [ ] Test: `data-trait` values are typed `TraitName` (verify correct string values)
  - [ ] Test: `animate={true}` applies `animate-hieroglyph-reveal` class
  - [ ] Test: animation delay increases per glyph (`index * 200ms`)
  - [ ] Test: `archetypeName` renders when provided, hidden when not
  - [ ] Test: `mono={true}` omits `data-trait` attributes — all glyphs use `currentColor`
  - [ ] Test: `data-slot="ocean-hieroglyph-code"` on wrapper

- [ ] Task 4: `OceanHieroglyphSet` unit tests (AC: #4)
  - [ ] Create test file in `packages/ui/src/components/__tests__/ocean-hieroglyph-set.test.tsx` (or co-located)
  - [ ] Test: renders exactly 5 glyphs (O, C, E, A, N letters)
  - [ ] Test: `mono={true}` omits `data-trait` attributes
  - [ ] Test: `mono={false}` (default) applies `data-trait` for each trait
  - [ ] Test: `data-slot="ocean-hieroglyph-set"` on wrapper

- [ ] Task 5: Delete old tests (AC: #5)
  - [ ] Delete `GeometricSignature.test.tsx` (in `apps/front/src/components/ocean-shapes/__tests__/` or wherever located)
  - [ ] Delete any other test files referencing old shape components

- [ ] Task 6: Create Storybook stories (AC: #6)
  - [ ] `OceanHieroglyphs.stories.tsx` — individual hieroglyph gallery showing all 15 glyphs, grouped by trait, multiple sizes, UX spec grid
  - [ ] `OceanHieroglyphCode.stories.tsx` — various OCEAN codes (e.g., "OCEAR", "TFIDV", "MSBPN"), with archetype names, animation demos, monochrome mode
  - [ ] `OceanHieroglyphSet.stories.tsx` — color and monochrome variants, size progression
  - [ ] Place stories co-located with components in `packages/ui/` or in appropriate stories directory

- [ ] Task 7: Delete old stories (AC: #7)
  - [ ] Delete `OceanShapes.stories.tsx`
  - [ ] Delete `GeometricSignature.stories.tsx`
  - [ ] Delete `OceanShapeSet.stories.tsx`

- [ ] Task 8: Update e2e tests (AC: #9)
  - [ ] Search for `ocean-shape` in all Playwright test files
  - [ ] Update selectors to use `ocean-hieroglyph-*`

- [ ] Task 9: Final sweep (AC: #8)
  - [ ] Grep entire codebase for `ocean-shape` (excluding `_bmad-output/` planning docs) — zero results expected
  - [ ] Grep for `OceanShape` — zero results (except deprecated references in planning docs)
  - [ ] Grep for `GeometricSignature` — zero results in source code
  - [ ] Run `pnpm test:run` — all tests pass
  - [ ] Run `pnpm typecheck` — no errors

## Parallelism

- **Blocked by:** 10.2 (components must exist to test)
- **Blocks:** none
- **Mode:** sequential
- **Domain:** testing + documentation
- **Shared files:** test files, story files

## Dev Notes

### Test Framework

- Use Vitest + `@testing-library/react` for component tests
- Follow existing import ordering: `vi` first, then `vi.mock()` calls, then `@effect/vitest` or other imports
- If testing `packages/ui` components, check existing test patterns in that package (may differ from `apps/front` patterns)

### Story Patterns

- Follow existing Storybook conventions in the project (CSF3 format likely)
- Each story should demonstrate key props and variants
- The individual hieroglyph gallery story should be visually rich — all 15 glyphs in a grid with trait labels

### What NOT to Test

- Don't test SVG path accuracy (that's the lookup table's job, covered in Task 1)
- Don't test Tailwind CSS rendering (Tailwind works or it doesn't — not a unit test concern)
- Don't test `data-trait` CSS color application (that's CSS, not component logic)

### What to Verify Manually

- Kitchen sink at `/dev/components` renders correctly
- Storybook stories render without errors
- Colors look correct with `data-trait` (visual check)

### References

- [Source: architecture.md#ADR-22 — section 22.8 anti-patterns]
- [Source: apps/front/src/components/ocean-shapes/__tests__/GeometricSignature.test.tsx — old test structure for reference]
- [Source: apps/front/src/components/ocean-shapes/OceanShapes.stories.tsx — old story structure for reference]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **No color assertions** — tests must NOT assert specific color values. Assert `data-trait` presence and `fill="currentColor"`, never CSS computed colors.
2. **No snapshot-only tests** — snapshots are fragile. Use targeted assertions on `data-slot`, `data-trait`, `aria-hidden`, and element counts.
3. **No imports from deleted paths** — all imports must reference `@workspace/ui` or `@workspace/domain`, never `ocean-shapes/`.
4. **Mock accuracy** — if mocking is needed, mocks must match real interfaces exactly.
5. **Import discipline** — follow the `vi` → `vi.mock()` → other imports ordering rule.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
