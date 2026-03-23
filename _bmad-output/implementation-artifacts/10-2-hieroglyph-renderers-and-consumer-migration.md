# Story 10.2: Hieroglyph Renderers, Data-Trait Coloring & Consumer Migration

Status: ready-for-dev

## Story

As a developer,
I want a single hieroglyph renderer in `packages/ui` with declarative `data-trait` coloring and all consumers migrated from the old shape components,
so that the codebase uses one consistent, Tailwind-native hieroglyph system with zero color props.

## Acceptance Criteria

1. `OceanHieroglyph` component exists in `packages/ui/src/components/ocean-hieroglyph.tsx` — renders a single glyph from the lookup table
2. `OceanHieroglyphCode` component exists in `packages/ui/src/components/ocean-hieroglyph-code.tsx` — renders 5 glyphs from an `OceanCode5` with `data-trait` coloring, animation support, optional archetype name, and monochrome mode
3. `OceanHieroglyphSet` component exists in `packages/ui/src/components/ocean-hieroglyph-set.tsx` — renders the 5 "high" glyphs (O, C, E, A, N) for branding
4. CSS `[data-trait]` rules in `globals.css` auto-apply trait colors to any element with the attribute
5. All `apps/front` consumers use the new hieroglyph components — no imports from `ocean-shapes/`
6. All 18 files in `apps/front/src/components/ocean-shapes/` are deleted
7. `getTraitColor()` is marked `@deprecated` — removed from all DOM-rendering components (kept only for `PersonalityRadarChart`)
8. CSS animation renamed: `animate-shape-reveal` → `animate-hieroglyph-reveal`, `@keyframes shape-reveal` → `@keyframes hieroglyph-reveal`
9. Kitchen sink at `/dev/components` updated with the new components
10. All new components exported from `packages/ui/src/index.ts`
11. All `data-slot` attributes renamed from `ocean-shape-*` to `ocean-hieroglyph-*`

## Tasks / Subtasks

- [ ] Task 1: Create `OceanHieroglyph` renderer (AC: #1, #11)
  - [ ] Create `packages/ui/src/components/ocean-hieroglyph.tsx`
  - [ ] Props: `letter: TraitLevel` (const union), `className?: string`
  - [ ] Looks up `OCEAN_HIEROGLYPHS[letter]`, renders SVG with `fill="currentColor"`
  - [ ] Sets `data-slot="ocean-hieroglyph-{letter}"` (lowercase) and `aria-hidden="true"`
  - [ ] No `color` prop, no `size` prop — Tailwind `size-*` and `text-*` classes only
  - [ ] Dynamic element rendering: map `HieroglyphElement[]` to SVG elements by tag

- [ ] Task 2: Create `OceanHieroglyphCode` composite (AC: #2, #11)
  - [ ] Create `packages/ui/src/components/ocean-hieroglyph-code.tsx`
  - [ ] Props: `code: OceanCode5`, `size?: number` (default 32), `animate?: boolean`, `archetypeName?: string`, `mono?: boolean`, `className?: string`
  - [ ] Splits code into 5 letters, maps position to `TRAIT_NAMES[i]` (typed as `TraitName`)
  - [ ] Each glyph wrapper gets `data-trait={TRAIT_NAMES[i]}` — CSS handles coloring
  - [ ] When `mono={true}`, omits `data-trait` — `currentColor` cascades from parent
  - [ ] Animation: staggered `animate-hieroglyph-reveal` + `--hieroglyph-index` CSS variable, `animationDelay: index * 200ms`
  - [ ] Archetype name: fades in after glyphs with `1200ms` delay when `animate={true}`
  - [ ] Sets `data-slot="ocean-hieroglyph-code"`

- [ ] Task 3: Create `OceanHieroglyphSet` (AC: #3)
  - [ ] Create `packages/ui/src/components/ocean-hieroglyph-set.tsx`
  - [ ] Props: `size?: number`, `mono?: boolean`, `className?: string`
  - [ ] Renders fixed glyphs O, C, E, A, N in OCEAN order
  - [ ] When `mono={false}` (default), applies `data-trait` for each trait
  - [ ] When `mono={true}`, inherits `currentColor`
  - [ ] Sets `data-slot="ocean-hieroglyph-set"`

- [ ] Task 4: Add `[data-trait]` CSS rules (AC: #4)
  - [ ] Add to `packages/ui/src/styles/globals.css`:
    ```css
    [data-trait="openness"]          { color: var(--trait-openness); }
    [data-trait="conscientiousness"] { color: var(--trait-conscientiousness); }
    [data-trait="extraversion"]      { color: var(--trait-extraversion); }
    [data-trait="agreeableness"]     { color: var(--trait-agreeableness); }
    [data-trait="neuroticism"]       { color: var(--trait-neuroticism); }
    ```

- [ ] Task 5: Rename CSS animations (AC: #8)
  - [ ] Rename `@keyframes shape-reveal` → `@keyframes hieroglyph-reveal` in `globals.css`
  - [ ] Rename `animate-shape-reveal` → `animate-hieroglyph-reveal` in `globals.css` (the utility class definition)

- [ ] Task 6: Export from `packages/ui` (AC: #10)
  - [ ] Add `OceanHieroglyph`, `OceanHieroglyphCode`, `OceanHieroglyphSet` exports to `packages/ui/src/index.ts`

- [ ] Task 7: Migrate consumers (AC: #5, #7)
  - [ ] `ArchetypeHeroSection.tsx` — replace `GeometricSignature` with `OceanHieroglyphCode`
  - [ ] `ShareCardPreview.tsx` — replace `GeometricSignature` with `OceanHieroglyphCode`
  - [ ] `DashboardIdentityCard.tsx` — replace `getTraitColor()` with `data-trait`, use `OceanHieroglyphCode` if applicable
  - [ ] `Logo.tsx` (or wherever `OceanShapeSet` is used) — replace with `OceanHieroglyphSet`
  - [ ] `OceanCodeStrand.tsx` — replace individual shape imports + `getTraitColor()` with `OceanHieroglyph` + `data-trait`
  - [ ] `TraitCard.tsx` — replace `getTraitColor()` inline styles with `data-trait`
  - [ ] `TraitBand.tsx` — replace `getTraitColor()` inline styles with `data-trait`
  - [ ] `FacetScoreBar.tsx` — replace `getTraitColor()` inline styles with `data-trait`
  - [ ] `DetailZone.tsx` — replace `getTraitColor()` inline styles with `data-trait`
  - [ ] `EvidencePanel.tsx` — replace `getTraitColor()` inline styles with `data-trait`
  - [ ] `ArchetypeDescriptionSection.tsx` — replace `getTraitColor()` with `data-trait`
  - [ ] `public-profile.$publicProfileId.tsx` — replace any shape/color usage
  - [ ] `PersonalityRadarChart.tsx` — **keep** `getTraitColor()` (chart library needs JS color values)
  - [ ] Any other consumers found via `grep` for `ocean-shapes`, `getTraitColor`, `GeometricSignature`, `OceanShapeSet`

- [ ] Task 8: Deprecate `getTraitColor()` (AC: #7)
  - [ ] Add `@deprecated` JSDoc to `getTraitColor()` in `packages/domain/src/utils/trait-colors.ts`: "Use `data-trait` attribute for DOM elements. Retained only for chart libraries requiring JS color values."

- [ ] Task 9: Delete old shape files (AC: #6)
  - [ ] Delete all 18 files in `apps/front/src/components/ocean-shapes/`:
    - `OceanCircle.tsx`, `OceanCross.tsx`, `OceanCutSquare.tsx`, `OceanDiamond.tsx`, `OceanDoubleQuarter.tsx`, `OceanHalfCircle.tsx`, `OceanInvertedTriangle.tsx`, `OceanLollipop.tsx`, `OceanOval.tsx`, `OceanQuarterCircle.tsx`, `OceanRectangle.tsx`, `OceanReversedHalfCircle.tsx`, `OceanTable.tsx`, `OceanThreeQuarterSquare.tsx`, `OceanTriangle.tsx`
    - `GeometricSignature.tsx`, `OceanShapeSet.tsx`, `index.ts`
  - [ ] Verify no remaining imports reference `ocean-shapes/` directory

- [ ] Task 10: Update kitchen sink (AC: #9)
  - [ ] Update `/dev/components` route to showcase `OceanHieroglyph`, `OceanHieroglyphCode`, `OceanHieroglyphSet`

- [ ] Task 11: Verify build
  - [ ] Run `pnpm typecheck` — no errors
  - [ ] Run `pnpm build` — no errors
  - [ ] Run `pnpm lint` — no errors

## Parallelism

- **Blocked by:** 10.1 (lookup table must exist)
- **Blocks:** 10.3 (tests and stories)
- **Mode:** sequential
- **Domain:** full-stack frontend (`packages/ui` + `apps/front`)
- **Shared files:** `packages/ui/src/index.ts`, `packages/ui/src/styles/globals.css`, all consumer components in `apps/front`

## Dev Notes

### Component Rendering Pattern

`OceanHieroglyph` must dynamically render SVG elements from the `HieroglyphElement[]` array. Approach:

```tsx
import { OCEAN_HIEROGLYPHS } from "@workspace/domain";
import type { TraitLevel } from "@workspace/domain";

export function OceanHieroglyph({ letter, className }: { letter: TraitLevel; className?: string }) {
  const def = OCEAN_HIEROGLYPHS[letter];
  return (
    <svg viewBox={def.viewBox} fill="currentColor" aria-hidden="true"
         data-slot={`ocean-hieroglyph-${letter.toLowerCase()}`} className={cn("shrink-0", className)}>
      {def.elements.map((el, i) => {
        const Tag = el.tag;
        return <Tag key={i} {...el.attrs} />;
      })}
    </svg>
  );
}
```

### data-trait Coloring

The key insight: no color logic in JS. Set `data-trait` on a wrapper, CSS applies `color: var(--trait-*)`, SVG `fill="currentColor"` picks it up. Override with Tailwind `text-*` classes when needed.

### Consumer Migration Checklist

Before deleting old files (Task 9), run these searches to verify zero remaining references:

```bash
grep -r "ocean-shapes" apps/front/src/ --include="*.tsx" --include="*.ts"
grep -r "GeometricSignature" apps/front/src/ --include="*.tsx" --include="*.ts"
grep -r "OceanShapeSet" apps/front/src/ --include="*.tsx" --include="*.ts"
grep -r "OceanCircle\|OceanCross\|OceanDiamond\|OceanTriangle\|OceanRectangle" apps/front/src/ --include="*.tsx" --include="*.ts"
```

### OceanCodeStrand Migration Detail

`OceanCodeStrand` currently uses:
- 5 individual shape component imports → replace with single `OceanHieroglyph`
- `TRAIT_SHAPE_MAP` → remove entirely (the renderer handles lookup)
- `getTraitColor(traitName)` → replace with `data-trait={traitName}` on wrapper elements
- The vertical strand gradient uses `getTraitColor()` in a `linear-gradient` — this is a JS-in-style case, use `data-trait` on individual dots instead, or keep the gradient as-is (acceptable edge case like charts)

### archetype-card-template.tsx

The Satori-based card template (`apps/front/src/components/sharing/archetype-card-template.tsx`) uses inline styles (Satori requirement — no CSS classes). Check if it imports shape components and handle accordingly. Satori can't use React components from `packages/ui` directly — it may need the raw SVG data from `OCEAN_HIEROGLYPHS` rendered inline.

### Project Structure Notes

- New components in `packages/ui/src/components/` following existing naming: `kebab-case.tsx`
- Exports from `packages/ui/src/index.ts` following existing pattern
- Consumer updates in `apps/front/src/components/` — preserve existing file locations, only update imports and usage

### References

- [Source: architecture.md#ADR-22 — sections 22.4, 22.5, 22.6, 22.7]
- [Source: packages/ui/src/styles/globals.css — @theme inline section for existing trait color registration]
- [Source: apps/front/src/components/ocean-shapes/GeometricSignature.tsx — current implementation to replace]
- [Source: apps/front/src/components/results/OceanCodeStrand.tsx — complex consumer to migrate]
- [Source: apps/front/src/components/sharing/archetype-card-template.tsx — Satori edge case]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **No `color` prop** — hieroglyph components must not accept a `color` prop. Color is always via `currentColor` + Tailwind or `data-trait`.
2. **No individual hieroglyph imports** — consumers must never import specific shape data. Always use `OceanHieroglyph` renderer.
3. **No `getTraitColor()` in new code** — use `data-trait` attribute. The only exception is `PersonalityRadarChart` (chart library constraint).
4. **No raw string for trait/letter props** — always use `TraitLevel` or `TraitName` const unions.
5. **No duplicate SVG data** — all geometry comes from `OCEAN_HIEROGLYPHS` in `packages/domain`. Never hardcode paths in components.
6. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors.
7. **Import discipline** — No cross-layer imports. Use `@workspace/*` paths.
8. **Type safety** — No unsafe `as` casts. No `as any` without justifying comment.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
