---
status: ready-for-dev
story_id: "4.2"
epic: 4
created_date: 2026-03-21
blocks: []
blocked_by: [33-1]
---

# Story 4.2: OG Meta Tags & Social Preview

## Story

As a **user**,
I want my **shared profile link to show a rich social preview with my archetype card**,
So that **the link looks compelling when shared on social media or messaging apps**.

## Context

The OG meta tags and social preview infrastructure is already substantially built across stories 15-1, 15-2, 32-7, and 33-1. This story validates and completes the implementation to ensure full coverage of the acceptance criteria from Epic 4 Story 4.2.

**Existing implementation:**
- `apps/front/src/routes/public-profile.$publicProfileId.tsx` — `head()` function generates dynamic OG meta tags (og:title, og:description, og:image, og:url, og:type, twitter:card, etc.)
- `apps/front/server/routes/api/og/public-profile/[publicProfileId].get.ts` — Nitro route generating 1200x630 PNG via Satori + resvg
- `apps/front/src/components/sharing/archetype-card-template.tsx` — Satori-compatible React component for card rendering
- `apps/front/src/lib/card-generation.ts` — Shared utilities (deriveTraitScores, getDominantColor, etc.)
- `e2e/specs/archetype-card.spec.ts` — E2E tests validating OG image route and meta tag presence

**Gaps to close:**
1. Unit tests for OG meta tag generation logic in the `head()` function (currently only E2E coverage)
2. Validate graceful fallback behavior when OG image generation fails (text-only OG tags with archetype name visible)
3. Verify `og:image:alt` tag for accessibility compliance

## Acceptance Criteria

### AC1: Dynamic OG Meta Tags

**Given** a public profile URL is shared
**When** a social platform or messaging app fetches the OG tags
**Then** dynamic OG meta tags are generated: og:title (archetype name), og:description (short archetype description), og:image (archetype card image) (FR41)
**And** the OG image is the 1.91:1 format (1200x630px)

### AC2: Cache Headers on OG Images

**Given** OG images are requested
**When** the server responds
**Then** images are served with 24h cache (`max-age=86400`) and `stale-while-revalidate` headers

### AC3: Fallback When OG Image Generation Fails

**Given** OG image generation fails (e.g., profile not found, server error)
**When** the fallback is triggered
**Then** text-only OG tags are returned with archetype name still visible in og:title and og:description
**And** the og:image tag is still present (pointing to the generation endpoint) — social crawlers handle missing images gracefully

### AC4: OG Image Alt Text

**Given** OG meta tags are rendered
**When** the og:image is included
**Then** an `og:image:alt` tag is present describing the archetype card content for accessibility

### AC5: Twitter Card Meta Tags

**Given** a public profile URL is shared on Twitter/X
**When** the crawler fetches meta tags
**Then** `twitter:card` is set to `summary_large_image`
**And** `twitter:title`, `twitter:description`, and `twitter:image` are present

## Tasks

### Task 1: Add og:image:alt Meta Tag

Add an `og:image:alt` meta tag to the public profile route's `head()` function for accessibility.

**File:** `apps/front/src/routes/public-profile.$publicProfileId.tsx`

**Subtasks:**
- 1.1: Add `og:image:alt` meta tag with content "{archetypeName} personality archetype card — big-ocean" to the `head()` function's meta array
- 1.2: Verify fallback alt text when profile is null: "Personality archetype card — big-ocean"

### Task 2: Unit Tests for OG Meta Tag Generation

Add unit tests validating the OG meta tag generation logic extracted from the `head()` function.

**File:** `apps/front/src/lib/__tests__/og-meta-tags.test.ts`

**Subtasks:**
- 2.1: Extract the OG meta tag generation logic into a testable pure function `generateOgMetaTags({ profile, publicProfileId, origin })` in `apps/front/src/lib/og-meta-tags.ts`
- 2.2: Write test: when profile exists, og:title contains archetype name
- 2.3: Write test: when profile exists, og:description contains archetype description
- 2.4: Write test: when profile exists, og:image points to `/api/og/public-profile/{id}`
- 2.5: Write test: when profile is null, fallback title and description are used
- 2.6: Write test: og:image:alt is present with archetype name
- 2.7: Write test: twitter:card is "summary_large_image"
- 2.8: Write test: og:image:width is "1200" and og:image:height is "630"
- 2.9: Wire the extracted function into the route's `head()` to replace inline logic

### Task 3: Validate E2E Coverage

Verify existing E2E tests cover the story's acceptance criteria.

**File:** `e2e/specs/archetype-card.spec.ts`

**Subtasks:**
- 3.1: Verify existing E2E test step "public profile page OG meta tags reference OG image URL" covers AC1
- 3.2: Verify existing E2E test step "GET /api/og/public-profile/:id returns PNG" covers AC2
- 3.3: Verify existing E2E test step "GET /api/og/public-profile/:id returns 404 for unknown profile" covers AC3 fallback

## Dev Notes

- The core implementation is already in place from stories 15-1, 15-2, 32-7, and 33-1.
- This story primarily adds test coverage and the og:image:alt accessibility tag.
- No backend changes required — all data is served by the existing `GET /api/public-profile/:publicProfileId` endpoint.
- The OG image generation uses Satori (SVG) + @resvg/resvg-js (PNG) server-side.
- Font: Inter Bold from `assets/fonts/Inter-Bold.ttf`.
- Preserve all existing `data-testid` attributes per FRONTEND.md rules.
