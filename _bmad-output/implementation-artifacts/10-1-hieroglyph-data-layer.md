# Story 10.1: Hieroglyph Data Layer

Status: ready-for-dev

## Story

As a developer,
I want the hieroglyph SVG definitions stored as pure data in the domain package with proper const-derived typing,
so that hieroglyph geometry is portable, type-safe, and decoupled from any rendering framework.

## Acceptance Criteria

1. `HieroglyphElement` and `HieroglyphDef` types exist in `packages/domain/src/types/ocean-hieroglyph.ts`
2. `OCEAN_HIEROGLYPHS` lookup table exists in `packages/domain/src/constants/ocean-hieroglyphs.ts`, typed as `Record<TraitLevel, HieroglyphDef>`
3. All 15 `TraitLevel` letters have a definition — missing letters cause a compile-time type error
4. No SVG element contains color information — geometry only
5. All viewBoxes are `"0 0 24 24"`
6. Types and constant are exported from `packages/domain/src/index.ts`

## Tasks / Subtasks

- [ ] Task 1: Create types (AC: #1)
  - [ ] Create `packages/domain/src/types/ocean-hieroglyph.ts`
  - [ ] Define `HieroglyphElement` with `tag: "path" | "circle" | "ellipse" | "rect" | "polygon"` and `attrs: Record<string, string | number>`
  - [ ] Define `HieroglyphDef` with `viewBox: string` and `elements: ReadonlyArray<HieroglyphElement>`
  - [ ] Export from `packages/domain/src/types/index.ts` (or wherever types barrel-export)
- [ ] Task 2: Create lookup table (AC: #2, #3, #4, #5)
  - [ ] Create `packages/domain/src/constants/ocean-hieroglyphs.ts`
  - [ ] Extract SVG geometry from the 15 existing shape components (see reference table below)
  - [ ] Type as `Record<TraitLevel, HieroglyphDef>` — ensures compile-time completeness
  - [ ] Verify no `fill`, `stroke`, or `color` attributes in any element
- [ ] Task 3: Export from package barrel (AC: #6)
  - [ ] Add exports to `packages/domain/src/index.ts`
- [ ] Task 4: Verify typecheck passes
  - [ ] Run `pnpm typecheck` — no errors

## Parallelism

- **Blocked by:** none
- **Blocks:** 10.2
- **Mode:** sequential (10.2 depends on this)
- **Domain:** domain package, pure data
- **Shared files:** `packages/domain/src/index.ts`

## Dev Notes

### SVG Geometry Reference

Extract from these existing components in `apps/front/src/components/ocean-shapes/`:

| Letter | Component | SVG Elements |
|--------|-----------|-------------|
| T | `OceanCross` | `<path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />` |
| M | `OceanCutSquare` | `<path d="M2 7h20v10H2z" />` |
| O | `OceanCircle` | `<circle cx="12" cy="12" r="10" />` |
| F | `OceanThreeQuarterSquare` | `<path d="M2 2h20v10H12v10H2z" />` |
| S | `OceanDoubleQuarter` | `<path d="M2 12L12 12A10 10 0 0 1 2 22Z" />` + `<path d="M22 12L12 12A10 10 0 0 1 22 2Z" />` |
| C | `OceanHalfCircle` | `<path d="M18 2 A10 10 0 0 0 18 22 Z" />` |
| I | `OceanOval` | `<ellipse cx="12" cy="12" rx="6" ry="10" />` |
| B | `OceanQuarterCircle` | `<path d="M2 2v20A20 20 0 0 0 22 2z" />` |
| E | `OceanRectangle` | `<rect x="7" y="2" width="10" height="20" rx="1" />` |
| D | `OceanReversedHalfCircle` | `<path d="M6 2 A10 10 0 0 1 6 22 Z" />` |
| P | `OceanLollipop` | `<rect x="5" y="2" width="14" height="14" />` + `<rect x="10" y="16" width="4" height="6" />` |
| A | `OceanTriangle` | `<polygon points="12,2 22,22 2,22" />` |
| R | `OceanTable` | `<rect x="2" y="2" width="20" height="14" />` + `<rect x="5" y="16" width="4" height="6" />` + `<rect x="15" y="16" width="4" height="6" />` |
| V | `OceanInvertedTriangle` | `<polygon points="2,2 22,2 12,22" />` |
| N | `OceanDiamond` | `<polygon points="12,1 23,12 12,23 1,12" />` |

### Typing Constraints

- `TraitLevel` already exists in `packages/domain/src/types/archetype.ts` as the union of all 15 letters
- Using `Record<TraitLevel, HieroglyphDef>` guarantees compile-time completeness — if a letter is missing, TypeScript errors
- No new types needed for `TraitLevel` — reuse the existing const-derived union

### Project Structure Notes

- Types go in `packages/domain/src/types/` alongside `archetype.ts` which already defines `TraitLevel`
- Constants go in `packages/domain/src/constants/` alongside `big-five.ts`
- Follow existing barrel export pattern in `packages/domain/src/index.ts`

### References

- [Source: architecture.md#ADR-22 — sections 22.2, 22.3]
- [Source: packages/domain/src/types/archetype.ts — TraitLevel definition]
- [Source: apps/front/src/components/ocean-shapes/ — 15 existing shape components]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **No React dependency** — this is pure data. No JSX, no `React.createElement`, no component types.
2. **No color in SVG data** — no `fill`, `stroke`, `color`, or CSS variable references in any `HieroglyphElement`.
3. **No raw string keys** — the lookup table must use `TraitLevel` as key type, not `string` or `Record<string, ...>`.
4. **No duplication** — do not create a new type for trait letters. Reuse `TraitLevel` from `archetype.ts`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
