# Story 3.3: GeometricSignature Component

Status: done

## Story

As a user,
I want my OCEAN code displayed as 5 geometric shapes,
So that I have a visual identity mark that works across all surfaces including social sharing.

## Acceptance Criteria

1. **Given** a 5-letter OCEAN code (e.g., "OCEAR") **When** `GeometricSignature` renders **Then** 5 shapes display inline, one per trait, with even spacing.
2. **And** each shape corresponds to the trait's level (different shapes for L/M/H per trait) per the 15-shape vocabulary in `OCEAN_HIEROGLYPHS`.
3. **And** the component accepts a `size` prop: `"hero"` (28px), `"profile"` (18px), `"card"` (12px), `"mini"` (10px).
4. **And** shapes use SVG `<path>` or `<polygon>` (or `<rect>`, `<circle>`, `<ellipse>`) **without** CSS transforms, clip-path, or gradients.
5. **And** the component renders identically in React DOM and Satori — proven by replacing `renderLetterShape` in `archetype-card-template.tsx` with the `GeometricSignature` rendering logic.
6. **And** `aria-label="Personality signature: O C E A R"` (space-separated letter spell-out) is set on the container.
7. **And** each shape wrapper has `role="img"` and `aria-label={traitName}`.

## Tasks / Subtasks

- [x] Task 1: Create `packages/ui/src/components/geometric-signature.tsx` (AC: 1–7)
  - [x] 1.1 Define `SIZE_PX` map: `{ hero: 28, profile: 18, card: 12, mini: 10 }`.
  - [x] 1.2 Define `GEOMETRIC_SIGNATURE_COLORS` (hex, matches CSS variables): `{ openness: "#A855F7", conscientiousness: "#FF6B2B", extraversion: "#FF0080", agreeableness: "#00B4A6", neuroticism: "#1c1c9c" }`.
  - [x] 1.3 Props: `oceanCode5: OceanCode5`, `size: "hero" | "profile" | "card" | "mini"`, `traitColors?: Partial<Record<TraitName, string>>` (optional override, required for Satori), `className?: string`.
  - [x] 1.4 Render a container (`<span>`) with `data-slot="geometric-signature"`, `data-testid="geometric-signature"`, `aria-label`, and inline layout styles `{ display: "inline-flex", alignItems: "center", gap: "0.2em" }` — **use inline `style` for layout, not Tailwind classes** (Satori requirement).
  - [x] 1.5 For each of the 5 letters: look up `OCEAN_HIEROGLYPHS[letter]`, render a `<span role="img" aria-label={traitName}>` wrapping an `<svg>` with `width={pxSize}`, `height={pxSize}`, `viewBox={def.viewBox}`, `aria-hidden="true"`, `style={{ display: "block" }}`. For each element in `def.elements`, call `createElement(el.tag, { key: j, ...el.attrs, fill: resolvedColor })` to set an explicit fill.
  - [x] 1.6 Resolve color: `traitColors?.[trait] ?? GEOMETRIC_SIGNATURE_COLORS[trait]`. This ensures explicit hex colors flow through in Satori context while CSS-variable colors work in React DOM via the default.
  - [x] 1.7 Import `OCEAN_HIEROGLYPHS`, `TRAIT_NAMES` from `@workspace/domain`; import `cn` from `@workspace/ui/lib/utils`. Apply optional `className` on the container.

- [x] Task 2: Wire `GeometricSignature` into `IdentityHeroSection` (AC: 1–3)
  - [x] 2.1 In `apps/front/src/components/me/IdentityHeroSection.tsx`, import `GeometricSignature` from `@workspace/ui/components/geometric-signature`.
  - [x] 2.2 Render `<GeometricSignature oceanCode5={results.oceanCode5} size="hero" />` inside the `IdentityHeroSection` JSX — place it between `ArchetypeHeroSection` and the `px-6 pb-6` div (i.e., as a full-bleed accent just below the hero gradient). Wrap in a `<div className="flex justify-center py-4">` or similar centering wrapper.
  - [x] 2.3 Do NOT add a second data fetch — `results` is already prop-passed from `useGetResults`.

- [x] Task 3: Replace `renderLetterShape` in `archetype-card-template.tsx` with `OCEAN_HIEROGLYPHS`-driven rendering (AC: 5)
  - [x] 3.1 In `apps/front/src/components/sharing/archetype-card-template.tsx`, replace the switch-case `renderLetterShape` function with a helper that reads from `OCEAN_HIEROGLYPHS`.
  - [x] 3.2 New helper `renderHieroglyphShape(letter, size, color, key)`: import `OCEAN_HIEROGLYPHS` from `@workspace/domain`; look up `OCEAN_HIEROGLYPHS[letter as TraitLevel]`; render `<svg width={size} height={size} viewBox={def.viewBox} key={key} aria-hidden="true">` with child elements mapping `def.elements.map((el, i) => createElement(el.tag, { key: i, ...el.attrs, fill: color }))`.
  - [x] 3.3 Replace all `renderLetterShape(...)` call-sites with `renderHieroglyphShape(...)`.
  - [x] 3.4 Keep all existing Satori inline-style layout — only the shape-rendering logic changes.
  - [x] 3.5 Preserve fallback to a plain circle for unknown letters.

- [x] Task 4: Update kitchen sink `/dev/components` (AC: all)
  - [x] 4.1 In `apps/front/src/routes/dev/components.tsx`, import `GeometricSignature` from `@workspace/ui/components/geometric-signature`.
  - [x] 4.2 Add a `GeometricSignature` demo section showing the 4 size variants for OCEAN code `"OCEAR"`: hero (28px), profile (18px), card (12px), mini (10px). Label each variant.
  - [x] 4.3 Add a second row showing a different code, e.g. `"TFIDR"`, to verify all 10 non-high shapes render.

- [x] Task 5: Add focused unit tests (AC: 1–7)
  - [x] 5.1 Create `apps/front/src/components/me/__tests__/GeometricSignature.test.tsx`.
  - [x] 5.2 Test: `"OCEAR"` renders exactly 5 SVG elements.
  - [x] 5.3 Test: container has `aria-label="Personality signature: O C E A R"`.
  - [x] 5.4 Test: each of the 5 `<span role="img">` wrappers has a trait name `aria-label` (openness, conscientiousness, extraversion, agreeableness, neuroticism).
  - [x] 5.5 Test: `size="hero"` → each SVG has `width="28"` and `height="28"`.
  - [x] 5.6 Test: `size="mini"` → each SVG has `width="10"` and `height="10"`.
  - [x] 5.7 Test: `data-testid="geometric-signature"` is present on the container.
  - [x] 5.8 DO NOT place test files directly in `apps/front/src/routes/me/` — use `apps/front/src/components/me/__tests__/`.

---

## Dev Notes

### Critical Architectural Context

**GeometricSignature is a NEW component alongside (not replacing) OceanHieroglyphCode.**

| Component | Purpose | Satori-safe | Size |
|---|---|---|---|
| `OceanHieroglyph` | Single letter shape, CSS `currentColor` | No (uses className) | Numeric prop |
| `OceanHieroglyphCode` | 5-shape row, animated, with label | No (uses className/motion) | Numeric prop |
| `OceanHieroglyphSet` | 5 HIGH-level shapes, branding logo | No (uses className) | Numeric prop |
| **GeometricSignature** | Compact identity mark, Satori-safe | **YES** | Named sizes |

`ArchetypeHeroSection` already contains `OceanHieroglyphCode`. Do NOT replace it. `GeometricSignature` is an additional, compact, accessible, OG-safe version.

### The Shape System Already Exists — Do NOT Reinvent It

All 15 SVG shape definitions live in `@workspace/domain`:

```ts
import { OCEAN_HIEROGLYPHS } from "@workspace/domain";
// OCEAN_HIEROGLYPHS["O"] → { viewBox: "0 0 24 24", elements: [{ tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } }] }
// OCEAN_HIEROGLYPHS["A"] → { viewBox: "0 0 24 24", elements: [{ tag: "polygon", attrs: { points: "12,2 22,22 2,22" } }] }
```

`HieroglyphDef` type: `{ viewBox: string; elements: Array<{ tag: string; attrs: Record<string, unknown> }> }`.

**All 15 shapes defined** (T, M, O, F, S, C, I, B, E, D, P, A, R, V, N). No new shapes needed.

**TRAIT_LETTER_MAP already reflects the correct letters** — E-low is `I`, N-mid is `V` (the UX spec mentioned updating these but they are already correct in the codebase).

### Satori Compatibility Is the Main Constraint

**Why `OceanHieroglyph` is NOT Satori-compatible:**
- Uses `fill="currentColor"` — `currentColor` doesn't resolve correctly in all Satori contexts
- Uses `className={cn("shrink-0", className)}` — Tailwind classes are NOT processed by Satori (no stylesheet)
- Uses `data-slot` — fine but irrelevant to Satori

**How `GeometricSignature` solves this:**
- Uses inline `style` props for layout (not Tailwind)
- Passes explicit hex `fill={color}` to each SVG element via `createElement`
- No CSS transforms, no clip-path, no CSS custom properties

```tsx
// Correct Satori-safe rendering pattern:
createElement(el.tag, { key: j, ...el.attrs, fill: color })
// This overrides any inherited fill with an explicit hex color
```

**`traitColors` prop for OG cards:** When using `GeometricSignature` in Satori context (OG card), pass `traitColors` explicitly — e.g., `{ openness: "#A855F7", conscientiousness: "#FF6B2B", ... }`. In React DOM, omit it and the defaults from `GEOMETRIC_SIGNATURE_COLORS` are used.

### Inline Style Layout (NOT Tailwind for Layout)

The container MUST use inline style for layout, not Tailwind, to be Satori-compatible:

```tsx
// CORRECT — Satori processes inline styles
<span style={{ display: "inline-flex", alignItems: "center", gap: "0.2em" }}>

// WRONG — Satori does not process className
<span className="inline-flex items-center gap-[0.2em]">
```

You may optionally apply `className={cn(className)}` for any React DOM supplemental styling, but layout must be inline-style only.

### Trait Order and Color Map

```ts
import { TRAIT_NAMES } from "@workspace/domain";
// TRAIT_NAMES = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]

// Position i in the OCEAN code corresponds to TRAIT_NAMES[i]
const letters = Array.from(oceanCode5).slice(0, 5); // e.g., ["O","C","E","A","R"]
// letters[0] = "O" → trait = "openness"
// letters[1] = "C" → trait = "conscientiousness"
// ...

const GEOMETRIC_SIGNATURE_COLORS: Record<TraitName, string> = {
  openness: "#A855F7",       // --trait-openness (hex approximation)
  conscientiousness: "#FF6B2B", // --trait-conscientiousness
  extraversion: "#FF0080",   // --trait-extraversion
  agreeableness: "#00B4A6",  // --trait-agreeableness
  neuroticism: "#1c1c9c",    // --trait-neuroticism
};
```

**Important:** The hex values above match the `/* spec: */` comments in `globals.css` — they are the canonical design values used in archetype cards and OG images.

### Accessibility Requirements

```tsx
// Container — identifies the whole mark
<span aria-label="Personality signature: O C E A R">

// Per-shape — each is a named image
<span role="img" aria-label="openness">
  <svg aria-hidden="true">...</svg>
</span>
```

The aria-label spell-out format: `"Personality signature: " + letters.join(" ")`. For `"OCEAR"` → `"Personality signature: O C E A R"`.

### Replacing `renderLetterShape` in `archetype-card-template.tsx`

The existing switch-case in `archetype-card-template.tsx` duplicates shape definitions already in `OCEAN_HIEROGLYPHS`. Task 3 replaces it with a thin wrapper over `OCEAN_HIEROGLYPHS`. This is the "tested via existing OG card generation endpoint" AC — the archetype card endpoint (`GET /api/archetype-card/[code4]`) and public profile OG endpoint (`GET /api/og/public-profile/[publicProfileId]`) both use `ArchetypeCardTemplate`, so swapping its internal rendering to use `OCEAN_HIEROGLYPHS` proves Satori compatibility.

```ts
// New helper in archetype-card-template.tsx (replaces renderLetterShape):
import { OCEAN_HIEROGLYPHS } from "@workspace/domain";
import type { TraitLevel } from "@workspace/domain";
import { createElement } from "react";

function renderHieroglyphShape(letter: string, size: number, color: string, key: string) {
  const def = OCEAN_HIEROGLYPHS[letter as TraitLevel];
  if (!def) {
    // Fallback — plain circle for unknown letters
    return (
      <svg key={key} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill={color} />
      </svg>
    );
  }
  return (
    <svg key={key} width={size} height={size} viewBox={def.viewBox} aria-hidden="true">
      {def.elements.map((el, i) => createElement(el.tag, { key: i, ...el.attrs, fill: color }))}
    </svg>
  );
}
```

### Package Export

`packages/ui` exports components via `./components/*` glob pattern in package.json:
```json
"./components/*": "./src/components/*.tsx"
```

So `GeometricSignature` at `packages/ui/src/components/geometric-signature.tsx` is automatically accessible as:
```ts
import { GeometricSignature } from "@workspace/ui/components/geometric-signature";
```

No changes to `package.json` needed.

### Existing Code to Reuse — DO NOT Reinvent

| What | Where |
|---|---|
| Shape definitions | `@workspace/domain` → `OCEAN_HIEROGLYPHS` |
| Trait order | `@workspace/domain` → `TRAIT_NAMES` |
| Trait-level type | `@workspace/domain` → `TraitLevel` |
| `cn()` utility | `@workspace/ui/lib/utils` |
| Results data | Already in `IdentityHeroSection` via `results.oceanCode5` |

### File Structure

```
packages/ui/src/components/
└── geometric-signature.tsx        # NEW

apps/front/src/components/
├── me/
│   ├── IdentityHeroSection.tsx    # MODIFY — add GeometricSignature
│   └── __tests__/
│       └── GeometricSignature.test.tsx  # NEW
├── sharing/
│   └── archetype-card-template.tsx  # MODIFY — replace renderLetterShape

apps/front/src/routes/dev/
└── components.tsx                 # MODIFY — add GeometricSignature demo
```

### Styling Conventions

- `data-slot="geometric-signature"` on container (packages/ui convention)
- `data-testid="geometric-signature"` on container (e2e convention — NEVER remove)
- Do NOT use `data-testid` on individual shapes (not needed for current tests)
- Container layout: `display: inline-flex; align-items: center; gap: 0.2em` (inline styles)
- Optional `className` for React DOM overrides only

### Testing Requirements

- Use Vitest + React Testing Library (same as rest of `apps/front`)
- Import order: `vi` first (if mocking), then `@effect/vitest` imports (see CLAUDE.md)
- `GeometricSignature` has no React Query dependency — test it without providers
- Keep tests out of `apps/front/src/routes/me/` per TanStack Router file-routing rules
- Validate `data-testid`, `aria-label`, `role="img"`, and SVG width/height attributes
- Snapshot tests are fine for shape rendering correctness

### Previous Story Intelligence

From Story 3.2 (`3-2-identity-hero-section.md`):
- `IdentityHeroSection` is in `apps/front/src/components/me/IdentityHeroSection.tsx`
- It is a pure prop-driven component that accepts `results: GetResultsResponse`
- `ArchetypeHeroSection` renders its own `<section>` — `MePageSection` owns the outer landmark
- Tests for `IdentityHeroSection` live in `apps/front/src/components/me/__tests__/`
- `OceanHieroglyphCode` is already used inside `ArchetypeHeroSection` — `GeometricSignature` is an additional element, not a replacement
- `vitest.setup.ts` at the repo root provides global `toBeInTheDocument()` matcher

From Story 3.1 (`3-1-me-page-route-and-section-layout.md`):
- `apps/front/src/routes/me/index.tsx` uses `useGetResults(sessionId)` as the single data source
- All `data-testid` attributes must be preserved

### Git Intelligence

Recent commits:
- `77913f17 feat(front): Story 3.2 — IdentityHeroSection and ThreeSpaceLayout extraction`
  - Added `IdentityHeroSection.tsx`, `IdentityHeroSection.test.tsx`, `trait-utils.ts`
  - Modified `ArchetypeHeroSection.tsx` (added `containerElement` prop)
  - Modified `-three-space-routes.test.tsx`
  - Added `vitest.setup.ts` for global DOM matchers

Files freshly established and stable, ready for extension.

### Cross-Story Usage

`GeometricSignature` is built in this story but consumed in later stories:
- **Story 3.4 (Your Public Face)**: public profile preview uses `GeometricSignature size="profile"` (18px)
- **Story 7 (Relationship Letter)**: relationship page uses `GeometricSignature size="mini"` (10px) per user
- **`ArchetypeCardTemplate`**: OG card uses explicit trait colors (Satori context)

### What This Story Does NOT Include

- Tooltip UI interactivity (tooltip implementations via Radix Tooltip come when components are used in non-Satori contexts — the tooltip trigger must come from the consumer)
- OceanCodeStrand changes (that's a separate component)
- Keyboard navigation beyond what `role="img"` provides
- Animation
- Backend changes

---

## Project Context Reference

- Frontend conventions: `docs/FRONTEND.md`
- Component conventions: `CLAUDE.md` §UI Component Rules
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md` §9.2, §9.4 (UX-DR22)
- Shape data: `packages/domain/src/constants/ocean-hieroglyphs.ts`
- Previous story: `_bmad-output/implementation-artifacts/3-2-identity-hero-section.md`

---

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

```
pnpm --filter front exec vitest run src/components/me/__tests__/GeometricSignature.test.tsx src/components/me/__tests__/IdentityHeroSection.test.tsx
pnpm --filter front exec vitest run src/components/me/__tests__/GeometricSignature.test.tsx src/components/me/__tests__/IdentityHeroSection.test.tsx src/components/sharing/__tests__/archetype-card-template.test.tsx
pnpm --filter front typecheck
pnpm --filter @workspace/ui typecheck
pnpm --filter front exec biome check src/components/me/__tests__/GeometricSignature.test.tsx src/components/me/__tests__/IdentityHeroSection.test.tsx src/components/me/IdentityHeroSection.tsx src/components/sharing/archetype-card-template.tsx src/routes/dev/components.tsx
pnpm --filter @workspace/ui exec biome check src/components/geometric-signature.tsx
pnpm test:run
```

### Completion Notes List

- Added the new `GeometricSignature` UI component in `packages/ui` with named size presets, explicit per-trait hex fills, inline Satori-safe layout styles, and accessible labeling on both the container and each trait glyph.
- Inserted `GeometricSignature` into `IdentityHeroSection` without adding any new data fetches, preserving the existing prop-driven composition model.
- Replaced the duplicated SVG switch in `archetype-card-template.tsx` with shared `OCEAN_HIEROGLYPHS` rendering logic and preserved the fallback circle path for unknown letters.
- Expanded `/dev/components` with two `GeometricSignature` demo rows and added focused tests covering SVG count, aria labels, role-based wrappers, sizing, stable test id, and the me-page integration.
- Validation passed with targeted Vitest runs, `front` and `@workspace/ui` typechecks, targeted Biome checks, and the full monorepo `pnpm test:run` regression suite.

### File List

- `packages/ui/src/components/geometric-signature.tsx`
- `apps/front/src/components/me/IdentityHeroSection.tsx`
- `apps/front/src/components/me/__tests__/GeometricSignature.test.tsx`
- `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
- `apps/front/src/components/sharing/archetype-card-template.tsx`
- `apps/front/src/routes/dev/components.tsx`

### Review Findings

- [x] [Review][Decision] Container `<span>` has `role="img"` — changed to `role="group"` (option A). [packages/ui/src/components/geometric-signature.tsx:49]
- [x] [Review][Patch] Remove redundant `TRAIT_KEYS` alias — use `TRAIT_NAMES` directly [packages/ui/src/components/geometric-signature.tsx]
- [x] [Review][Defer] 4-letter `oceanCode` in `archetype-card-template` renders fallback circle for 5th shape — deferred, pre-existing (`oceanCode: string` and slicing logic pre-date this change)

### Change Log

- 2026-04-13: Story created — ready-for-dev
- 2026-04-13: Implemented `GeometricSignature`, wired it into the me page and Satori archetype card rendering, added dev demos, and validated with focused plus full regression testing.
