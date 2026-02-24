# Story 15.2: Archetype Card Generation

## Status: Complete

## Summary

Generates shareable archetype card images (PNG) and OG images for public profiles using Satori + Resvg.

## Architecture Decision: Frontend-hosted Image Generation

Card and OG image generation was **migrated from `apps/api` to `apps/front`** (TanStack Start + Nitro server routes) because:

1. **No Effect services needed** — handlers only fetch the public profile endpoint and render PNG
2. **Purely presentational** — the frontend already has React, design tokens, and styling
3. **Same-origin serving** — OG images and card downloads served from the same domain as the frontend, eliminating CORS and cross-origin complexity
4. **Satori uses React JSX** — natural fit for the frontend app where React is the primary framework

## Implementation

### API Routes (TanStack Start `server.handlers`)

| Route | File | Description |
|-------|------|-------------|
| `GET /api/archetype-card/:id?format=9:16\|1:1` | `src/routes/api/archetype-card.$publicProfileId.tsx` | Shareable card PNG (1080x1920 or 1080x1080) |
| `GET /api/og/public-profile/:id` | `src/routes/api/og.public-profile.$publicProfileId.ts` | OG image PNG (1200x630) |

### Shared Components

- **`src/components/sharing/archetype-card-template.tsx`** — Satori-compatible React component with inline styles. Used by the card API route and renderable in Storybook.
- **`src/lib/card-generation.ts`** — Shared utilities: font loading, profile fetching, trait score derivation.

### Key Technical Details

- **Native modules externalized** — `@resvg/resvg-js` and `satori` are configured as SSR externals in `vite.config.ts` and Nitro externals to prevent bundling `.node` binary files
- **Dynamic imports** — Node-only modules are dynamically imported inside `server.handlers` to keep them out of the client bundle
- **Font** — Inter Bold TTF stored at `apps/front/assets/fonts/Inter-Bold.ttf`
- **Caching** — Cards use `immutable, max-age=31536000`; OG images use `max-age=86400, stale-while-revalidate=3600`

## Files

| File | Purpose |
|------|---------|
| `apps/front/src/routes/api/archetype-card.$publicProfileId.tsx` | Card generation route |
| `apps/front/src/routes/api/og.public-profile.$publicProfileId.ts` | OG image generation route |
| `apps/front/src/components/sharing/archetype-card-template.tsx` | Satori-compatible card JSX |
| `apps/front/src/components/sharing/ArchetypeCardTemplate.stories.tsx` | Storybook stories |
| `apps/front/src/lib/card-generation.ts` | Shared generation utilities |
| `apps/front/assets/fonts/Inter-Bold.ttf` | Font asset |
| `apps/front/src/components/sharing/archetype-share-card.tsx` | Card preview + download UI (updated URLs) |
| `apps/front/src/routes/public-profile.$publicProfileId.tsx` | Public profile page (updated OG URL) |
