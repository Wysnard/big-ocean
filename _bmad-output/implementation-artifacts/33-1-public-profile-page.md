---
status: ready-for-dev
story_id: "4.1"
epic: 4
created_date: 2026-03-21
blocks: [4-2, 4-3, 4-4]
blocked_by: [1-1]
---

# Story 4.1: Public Profile Page

## Story

As a **visitor**,
I want to **view someone's personality profile as a compelling story scroll with a framing line, conversion-optimized CTAs, and a "How it works" micro-preview**,
So that **I understand who they are and feel inspired to discover my own personality**.

## Context

The public profile page is already substantially built (story 15-1, Phase 2). This story closes the UX spec implementation gaps identified in section 17.17, aligning the existing page with the target design from the PRD and UX design specification.

**Existing implementation:** `apps/front/src/routes/public-profile.$publicProfileId.tsx` — 5-section story scroll with SSR, auth-state-dependent CTAs, OG image generation, privacy model.

**Gaps to close (UX spec section 17.17):**
1. Framing line: "[Name] dove deep with Nerin — here's what surfaced" not present above archetype name
2. CTA text: Generic per auth state — should be "What's YOUR code? Discover it in a conversation with Nerin" for unauthenticated visitors
3. "How it works" micro-preview: Not present — need 3-step section below trait data
4. Repeated CTA: Only at bottom (section 5) — add inline CTA between sections 3 and 4

## Acceptance Criteria

### AC1: Framing Line on Hero Section
**Given** a user has set their profile to "Public"
**When** a visitor navigates to their profile URL
**Then** the hero section displays the framing line "[Name] dove deep with Nerin — here's what surfaced" above the archetype name (FR39)
**And** if displayName is null, "This person" is used as a fallback

### AC2: Updated CTA Copy for Unauthenticated Visitors
**Given** an unauthenticated visitor views a public profile
**When** the CTA section renders
**Then** the heading reads "What's YOUR code?"
**And** the subtext reads "Discover it in a conversation with Nerin"
**And** the button label reads "Start Your Conversation"
**And** the button links to `/signup`

### AC3: Relationship Analysis CTA for Assessed Users
**Given** a logged-in user with a completed assessment views another user's public profile
**When** the CTA section renders
**Then** the CTA displays "You care about [Name]. Discover your dynamic together." (FR45)
**And** a brief explanation of the QR flow is included below the heading
**And** a "Start Relationship Analysis" button links to the relationship analysis flow

### AC4: "How It Works" Micro-Preview Section
**Given** a visitor views a public profile
**When** they scroll past the trait strata section
**Then** a 3-step "How it works" section is displayed between the trait strata and archetype description sections
**And** the steps reuse the same content structure as the homepage HowItWorks component
**And** the section has `data-testid="profile-how-it-works"`

### AC5: Inline CTA Between Sections
**Given** a visitor views a public profile
**When** they scroll past the trait strata section
**Then** a compact inline CTA button is displayed between the trait strata and "How it works" sections
**And** the CTA text is "Discover your own personality" with a link to `/signup` for unauthenticated users
**And** the button meets 44px minimum tap target (min-h-11)

### AC6: Private Profile Returns 404
**Given** a user's profile is set to "Private"
**When** anyone navigates to their profile URL
**Then** they receive a 404 response with no profile data exposed (FR42)

### AC7: Public Profile Accessible Without Auth
**Given** a user has set their profile to "Public"
**When** an anonymous visitor navigates to their profile URL
**Then** the full 5-section story scroll is rendered without requiring authentication (FR42)
**And** the page is server-rendered via TanStack Start with LCP <1s target (NFR2)

### AC8: Mobile Responsiveness
**Given** the public profile page renders on mobile (<640px)
**When** the viewport is narrow
**Then** all sections stack vertically with full-width components
**And** all interactive elements meet 44px minimum tap targets
**And** the framing line is readable without horizontal scrolling

## Tasks

### Task 1: Add Framing Line to ArchetypeHeroSection

Add support for a `framingLine` prop on `ArchetypeHeroSection` to display the framing line above the subtitle on the public profile page.

**File:** `apps/front/src/components/results/ArchetypeHeroSection.tsx`

**Subtasks:**
- 1.1: Write failing test that `ArchetypeHeroSection` renders a framing line when `framingLine` prop is provided
- 1.2: Write failing test that the framing line is NOT rendered when the prop is omitted (results page usage unchanged)
- 1.3: Add optional `framingLine?: string` prop to `ArchetypeHeroSectionProps`
- 1.4: Render framing line above subtitle in a `<p>` with `data-testid="framing-line"`, styled `text-base md:text-lg text-foreground/60 italic mb-2`

### Task 2: Update PublicProfileCTA Copy

Update the CTA content for all three auth states to match the UX spec.

**File:** `apps/front/src/components/results/PublicProfileCTA.tsx`

**Subtasks:**
- 2.1: Write failing test that unauthenticated CTA heading is "What's YOUR code?"
- 2.2: Write failing test that authenticated-assessed CTA heading includes "You care about [Name]"
- 2.3: Update `CTA_CONTENT.unauthenticated` heading to "What's YOUR code?", subtext to "Discover it in a conversation with Nerin", buttonLabel to "Start Your Conversation"
- 2.4: Update `CTA_CONTENT["authenticated-assessed"]` heading to "" (dynamic — "You care about {displayName}. Discover your dynamic together."), subtext to brief QR flow explanation, buttonLabel to "Start Relationship Analysis"
- 2.5: Update the dynamic heading for authenticated-assessed from "See how you compare" to "You care about {displayName}. Discover your dynamic together."

### Task 3: Add "How It Works" Micro-Preview

Create a compact profile-specific "How it works" section reusing the homepage step structure.

**File:** `apps/front/src/components/results/ProfileHowItWorks.tsx`

**Subtasks:**
- 3.1: Write failing test that `ProfileHowItWorks` renders 3 steps with the correct titles
- 3.2: Write failing test for `data-testid="profile-how-it-works"` attribute
- 3.3: Create `ProfileHowItWorks` component reusing same step data (Talk to Nerin, Get your portrait, Compare with someone who matters)
- 3.4: Style with `max-w-[900px]`, `grid sm:grid-cols-3`, consistent with homepage but with reduced vertical padding (`py-12` instead of `py-16`)

### Task 4: Add Inline CTA Component

Create a compact inline CTA that sits between sections.

**File:** `apps/front/src/components/results/ProfileInlineCTA.tsx`

**Subtasks:**
- 4.1: Write failing test that `ProfileInlineCTA` renders a button with correct text
- 4.2: Write failing test for 44px minimum tap target (min-h-11 class)
- 4.3: Create `ProfileInlineCTA` component with "Discover your own personality" button
- 4.4: Accept `authState` prop to conditionally show (only for unauthenticated and authenticated-no-assessment states)

### Task 5: Wire New Components into Public Profile Route

Integrate the framing line, inline CTA, and "How it works" section into the route.

**File:** `apps/front/src/routes/public-profile.$publicProfileId.tsx`

**Subtasks:**
- 5.1: Pass `framingLine` prop to `ArchetypeHeroSection`: `"${displayName} dove deep with Nerin — here's what surfaced"`
- 5.2: Insert `ProfileInlineCTA` between section 3 (trait strata) and the new "How it works" section
- 5.3: Insert `ProfileHowItWorks` between the inline CTA and section 4 (archetype description)
- 5.4: Verify all `data-testid` attributes remain intact — no removals or renames

## Dev Notes

- The existing public profile route, handler, contracts, and use-cases are fully functional. This story only modifies frontend components and the route file.
- No backend changes required — all data needed (displayName, archetype, facets, etc.) is already served by the existing `GET /api/public-profile/:publicProfileId` endpoint.
- Preserve all existing `data-testid` attributes per FRONTEND.md rules.
- Use `@workspace/ui` components for any new UI primitives (Button, etc.).
- Follow mobile-first responsive patterns (stack on mobile, grid on desktop).
