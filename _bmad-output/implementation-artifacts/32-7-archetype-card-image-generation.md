# Story 32-7: Archetype Card Image Generation

## Status: ready-for-dev

## Story

As the system,
I want to generate static archetype card images for all 81 archetypes,
So that social previews and OG tags display compelling personality cards.

## Acceptance Criteria

1. **Given** the 81 archetypes in the registry, **when** archetype card images are generated, **then** each card contains: archetype name, short description (1-2 sentences), GeometricSignature, and OCEAN code (FR46).
2. **Given** cards are generated server-side, **then** they use Satori (SVG) + @resvg/resvg-js (PNG).
3. **Given** one card per archetype, **then** cards are generic, not personalized (users with the same archetype share the same visual).
4. **Given** cards need to serve multiple contexts, **when** images are generated, **then** two formats are produced: 1.91:1 (1200x630px for OG link previews) and 9:16 (1080x1920px for social stories).
5. **Given** the GeometricSignature component, **when** rendered for card generation, **then** SVG path only is used — no CSS transforms (must render in both DOM and Satori).

## Background

The archetype card generation pipeline already has partial infrastructure in place from story 15-2:

- **`apps/front/src/components/sharing/archetype-card-template.tsx`**: Satori-compatible JSX template (inline styles) that renders archetype name, OCEAN code letters, geometric shapes row, and wordmark. Currently uses trait scores for shape sizing.
- **`apps/front/src/lib/archetype-card.server.ts`**: TanStack Start `createServerFn` that generates PNG via Satori + Resvg. Currently personalizes per public profile (fetches profile data). References `@/lib/card-generation` which does not exist yet.
- **`apps/front/server/routes/api/og/public-profile/[publicProfileId].get.ts`**: Nitro OG image route generating 1200x630 PNG via hand-built SVG + Resvg. Does NOT use the shared template.
- **`apps/front/src/components/sharing/archetype-share-card.tsx`**: Client-side UI for card preview and download.
- **`apps/front/assets/fonts/Inter-Bold.ttf`**: Font asset for Satori.
- **`apps/front/vite.config.ts`**: Already has SSR externals for `@resvg/resvg-js` and `satori`.

### What needs to change

The current implementation is **profile-personalized** (fetches per user). Story 3.7/32-7 requires **archetype-generic** cards: one card per archetype (81 total), keyed by 4-letter OCEAN code, containing the archetype name, a short description, the GeometricSignature (SVG paths), and the OCEAN code. No individual trait/facet scores.

### Key domain types

- `CURATED_ARCHETYPES` (81 entries) at `packages/domain/src/constants/archetypes.ts`
- `Archetype` type at `packages/domain/src/types/archetype.ts`
- `lookupArchetype(code4)` at `packages/domain/src/utils/archetype-lookup.ts`

## Tasks

### Task 1: Create `card-generation.ts` shared utilities

**File:** `apps/front/src/lib/card-generation.ts`

Create the missing shared utility module that `archetype-card.server.ts` already imports. Must include:
- `getFontData()`: Reads `Inter-Bold.ttf` from `assets/fonts/` and returns `ArrayBuffer`
- `deriveTraitScores(facets)`: Derives trait scores from facet map (already duplicated in OG route — consolidate)
- `getDominantColor(traitScores)`: Returns hex color of highest-scoring trait
- `fetchProfileData(publicProfileId)`: Fetches profile data from API (for personalized cards)

### Task 2: Create archetype card generation endpoint

**File:** `apps/front/server/routes/api/archetype-card/[code4].get.ts`

Create a Nitro server route that generates archetype card PNGs keyed by 4-letter OCEAN code (not by publicProfileId):
- `GET /api/archetype-card/:code4?format=og|story` (default: `og`)
- Looks up archetype from `CURATED_ARCHETYPES` by code4
- Renders via Satori + Resvg
- `og` format: 1200x630px (1.91:1)
- `story` format: 1080x1920px (9:16)
- Returns PNG with `Cache-Control: public, immutable, max-age=31536000` (cards are static per archetype)
- Returns 404 if code4 is not a valid archetype

### Task 3: Update `archetype-card-template.tsx` to support archetype-generic mode

Update the template to render archetype-generic cards (no trait scores required). The template should accept an optional `description` prop (1-2 sentence short description) and render it. When no `traitScores` are provided, the GeometricSignature shapes should be sized from the OCEAN code letters directly (using the existing `TRAIT_LETTER_MAP` sizing logic).

### Task 4: Update OG route to use shared template and utilities

Refactor `apps/front/server/routes/api/og/public-profile/[publicProfileId].get.ts` to:
- Import from `card-generation.ts` shared utilities instead of inlining `deriveTraitScores` and `TRAIT_COLORS`
- Use the `ArchetypeCardTemplate` component via Satori instead of hand-built SVG string

### Task 5: Write tests

- Unit test for `card-generation.ts` utilities (deriveTraitScores, getDominantColor)
- Unit test for archetype card endpoint: valid code4 returns PNG, invalid code4 returns 404
- Test that all 81 archetype codes map to valid card data

## Dev Notes

- Satori requires inline styles (no Tailwind, no CSS vars). The existing template already follows this.
- The GeometricSignature in Satori must use SVG paths, not CSS transforms (AC 5). The current template uses inline `transform: "rotate(45deg)"` for the diamond shape, which may not work in Satori — verify and fix if needed.
- `@resvg/resvg-js` and `satori` are already configured as SSR externals in `vite.config.ts`.
- The font file already exists at `apps/front/assets/fonts/Inter-Bold.ttf`.
