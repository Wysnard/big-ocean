# Story 37-2: Founder Portrait Bridge & Relationship CTA

**Status:** ready-for-dev
**Epic:** 8 — Homepage & Acquisition Funnel
**Story ID:** 37-2-founder-portrait-bridge-and-relationship-cta

## User Story

As a new visitor,
I want to see a real portrait excerpt and understand the relationship analysis feature,
So that I feel the emotional weight of the product and see its social dimension.

## Acceptance Criteria

**AC1:** Given the homepage narrative includes the founder portrait bridge (beats 10-10b), when the section renders, then Vincent's personal portrait excerpt is displayed as a real artifact — not a product demo — and the voice is dense (3-4 sentences), personally vulnerable, love letter tone.

**AC2:** Given the homepage narrative includes the relationship analysis section (beat 12), when the section renders, then a CTA for relationship analysis is prominently featured, and it communicates the value of discovering relational dynamics with someone you care about, and it explains the QR-based flow briefly.

**AC3:** Given a visitor clicks the relationship analysis CTA, when they are not authenticated, then they are routed to the auth flow and directed to complete their own assessment first.

**AC4:** Given the founder portrait bridge section, when rendered on mobile (<640px), then the layout stacks vertically with readable typography and all interactive elements meet 44px minimum tap targets.

**AC5:** Given all animations in the founder portrait bridge and relationship CTA sections, when prefers-reduced-motion is enabled, then all animations use instant-cut fallback.

## Current State Analysis

The homepage already has beat 10-10b (founder reveal and Vincent's personal share) and beat 12 (relationship comparison with `ComparisonTeaserPreview`). However, the current implementation needs enhancement:

- **Beat 10b (Vincent bubble):** Contains a short personal note but lacks the depth and emotional weight of a real portrait excerpt. The story requires Vincent's actual portrait excerpt to be displayed as a "real artifact."
- **Beat 12 (relationship section):** Uses `ComparisonTeaserPreview` (overlaid radar charts) but lacks a prominent, dedicated relationship analysis CTA that communicates the value proposition and explains the QR-based flow.
- **Portrait excerpt source:** `portrait-excerpt.md` already exists with two rich sections ("The Selective Gate" and "The Undertow") but is only used in the horoscope vs. portrait comparison (beat 8), not in the founder bridge.

## Gap Analysis (What Needs to Change)

### A. Enhance Founder Portrait Bridge (Beats 10-10b)
- Expand Vincent's message (beat 10b) to include a curated excerpt from his actual portrait, making it feel like a real personal artifact
- The excerpt should be displayed in a visually distinct format — not just chat bubble text — to signal "this is the real thing"
- Voice: dense, personally vulnerable, love letter tone (3-4 sentences from Vincent, then the portrait excerpt)

### B. Add Dedicated Relationship Analysis CTA (Beat 12)
- Add a prominent CTA component within or after beat 12 that communicates relationship analysis value
- Include brief QR flow explanation: "Both of you talk to Nerin. Then scan a QR code together to see how you connect"
- CTA should link to `/chat` (since users must complete assessment first)
- Make the CTA visually prominent — not just embedded in a chat bubble

### C. Route Auth Handling
- Relationship CTA links to `/chat` which already handles auth gating
- No additional auth logic needed — existing flow redirects to login/signup then back to `/chat`

## Tasks

### Task 1: Create FounderPortraitExcerpt Component
**New file:** `apps/front/src/components/home/FounderPortraitExcerpt.tsx`

- [ ] 1.1: Create component that renders a curated portion of Vincent's portrait in a visually distinct card format
- [ ] 1.2: Style with a subtle border/background to differentiate from regular chat bubbles — signal "this is a real portrait"
- [ ] 1.3: Include portrait section emoji + title formatting matching the spine renderer pattern
- [ ] 1.4: Ensure responsive layout — readable on mobile with appropriate font sizes
- [ ] 1.5: Add data-slot="founder-portrait-excerpt" and data-testid="founder-portrait-excerpt"
- [ ] 1.6: Respect prefers-reduced-motion for any entrance animations

### Task 2: Enhance Beat 10b — Vincent's Personal Share
**File:** `apps/front/src/routes/index.tsx`

- [ ] 2.1: Update Vincent's chat bubble content (beat 10b) to include the FounderPortraitExcerpt component
- [ ] 2.2: Adjust the intro text to frame the excerpt naturally: Vincent shares why he built this, then shows what Nerin wrote about him
- [ ] 2.3: Maintain the vincent ChatBubble variant for the personal framing, with the excerpt rendered below or within

### Task 3: Create RelationshipCta Component
**New file:** `apps/front/src/components/home/RelationshipCta.tsx`

- [ ] 3.1: Create a prominent CTA card component for relationship analysis
- [ ] 3.2: Include headline communicating value: discovering relational dynamics with someone you care about
- [ ] 3.3: Include brief QR flow explanation (2-3 steps: both complete assessment, scan QR, see comparison)
- [ ] 3.4: Add CTA button linking to `/chat` with text like "Start your conversation" (must assess first)
- [ ] 3.5: Style with visual prominence — not a subtle embed but a clear conversion section
- [ ] 3.6: Add data-slot="relationship-cta" and data-testid="relationship-cta"
- [ ] 3.7: Ensure 44px minimum tap targets and mobile-responsive layout

### Task 4: Integrate RelationshipCta into Beat 12
**File:** `apps/front/src/routes/index.tsx`

- [ ] 4.1: Add RelationshipCta component within or immediately after beat 12's Nerin message
- [ ] 4.2: Position after the ComparisonTeaserPreview and Nerin's narrative about the couple
- [ ] 4.3: Ensure visual flow is natural within the conversational narrative

### Task 5: Verify and Test
- [ ] 5.1: Run `pnpm turbo typecheck` — must pass
- [ ] 5.2: Verify all new components have data-testid attributes
- [ ] 5.3: Verify prefers-reduced-motion is respected
- [ ] 5.4: Verify mobile layout (<640px) stacks properly
- [ ] 5.5: Verify CTA links route to `/chat`

## Technical Notes

- All content is static — no API calls needed. Preserves LCP <2.5s target.
- Portrait excerpt content is hardcoded (curated from portrait-excerpt.md), not fetched from API.
- Follow FRONTEND.md conventions: data-slot on component roots, cn() for class merging, semantic color tokens.
- Preserve all existing data-testid attributes — never remove or rename them.
- Use Tailwind utility classes, mobile-first responsive design.
- The relationship CTA routes to `/chat` which already has auth gating via `beforeLoad`.

## Out of Scope

- Archetype Gallery Preview (separate story — requires data fetching)
- Actual QR drawer implementation (Epic 5)
- Relationship analysis generation (Epic 6)
- Portrait generation pipeline (Epic 3)
