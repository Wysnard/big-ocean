# Story 37-1: Homepage Narrative & Layout

**Status:** ready-for-dev
**Epic:** 8 — Homepage & Acquisition Funnel
**Story ID:** 37-1-homepage-narrative-and-layout

## User Story

As a new visitor,
I want to experience a compelling introduction to big-ocean,
So that I understand the value and feel drawn to start my own conversation with Nerin.

## Acceptance Criteria

**AC1:** Given a visitor navigates to the homepage, when the page renders, then a 14-beat conversational narrative scroll is displayed, and the page is server-rendered via TanStack Start with LCP <2.5s, and static content is readable immediately (TTI <3s, progressive hydration).

**AC2:** Given the homepage on mobile (<640px), when the user scrolls past the hero section, then a sticky bottom CTA appears styled as a chat input box inviting the user to start their conversation, and all interactive elements meet 44px minimum tap targets.

**AC3:** Given the homepage on desktop (>=1024px), when the user scrolls through the narrative, then a scroll-driven depth meter tracks progress through the 14 beats, and the sticky bottom chat input CTA is visible, and the depth meter uses CSS transitions respecting prefers-reduced-motion.

**AC4:** Given a visitor interacts with the chat input CTA, when they tap or click it, then they are routed to the auth flow which redirects to /chat after login/signup.

**AC5:** Given the homepage layout, when dynamic content loads, then CLS <0.1 is maintained via fixed layout slots and reserved heights.

## Current State Analysis

The existing homepage (`apps/front/src/routes/index.tsx`) already implements:
- 14-beat conversational narrative (Nerin/User/Vincent three-voice)
- HeroSection with OCEAN breathing shapes
- ConversationFlow with vertical thread line
- All interactive embeds: ComparisonCard, TraitStackEmbed, HoroscopeVsPortraitComparison, ComparisonTeaserPreview
- DepthScrollProvider + DepthMeter (scroll progress tracking)
- ChatInputBar (sticky bottom CTA appearing at 35% scroll)
- MessageGroup with IntersectionObserver fade-in animations
- All animations respect prefers-reduced-motion

## Gap Analysis (What Needs to Change)

Based on the UX Design Specification (Section 16.6), the following updates are needed:

### A. Hero Section Refinement
- Update tagline from "30 MIN · NO ACCOUNT · JUST TALKING" to "~25 MIN · FREE · JUST A CONVERSATION"
- Add a secondary direct CTA: "Start your conversation with Nerin" → `/chat` (for visitors who don't need convincing)
- Keep existing headline, subtitle, and OCEAN shapes

### B. Conversion CTAs
- Add a "How It Works" section between the narrative and a final CTA
- Add a final CTA section after beat 14: "What's YOUR code? Discover it in a conversation with Nerin" → `/chat`

### C. "How It Works" Section (New Component)
Three-step scannable section:
1. Chat bubble icon — "Talk to Nerin" — A 25-minute conversation about you. No quiz, no checkboxes.
2. GeometricSignature icon — "Get your portrait" — Your archetype, OCEAN code, and a personal letter from Nerin.
3. Two overlaid signatures icon — "Compare with someone who matters" — Scan QR codes together for a relationship analysis.

### D. Beat 14 Copy Update
Update the closing beat to align with spec: Remove "No account" reference since auth-gate exists.

### E. OG Meta / SEO
Add proper OG meta tags and page title for SEO.

## Tasks

### Task 1: Update Hero Section
**File:** `apps/front/src/components/home/HeroSection.tsx`

- [ ] 1.1: Update tagline text to "~25 MIN · FREE · JUST A CONVERSATION"
- [ ] 1.2: Add secondary direct CTA button "Start your conversation with Nerin" → `/chat` alongside existing scroll CTA
- [ ] 1.3: Style secondary CTA as a distinct, clear conversion button with appropriate responsive styling

### Task 2: Create "How It Works" Section
**New file:** `apps/front/src/components/home/HowItWorks.tsx`

- [ ] 2.1: Create HowItWorks component with 3-step layout using lucide-react icons
- [ ] 2.2: Implement responsive layout — single column mobile, 3-column grid desktop
- [ ] 2.3: Add section heading and appropriate data-slot attributes
- [ ] 2.4: Ensure 44px minimum tap targets on interactive elements

### Task 3: Create Final CTA Section
**New file:** `apps/front/src/components/home/FinalCta.tsx`

- [ ] 3.1: Create FinalCta component with heading "What's YOUR code?" and conversion copy
- [ ] 3.2: Add CTA button linking to `/chat` styled consistently with hero CTA
- [ ] 3.3: Implement responsive layout with appropriate spacing

### Task 4: Update Beat 14 Copy
**File:** `apps/front/src/routes/index.tsx`

- [ ] 4.1: Update beat 14 Nerin message copy — remove "No account" reference, align with current auth-gated flow

### Task 5: Integrate New Sections into Homepage Route
**File:** `apps/front/src/routes/index.tsx`

- [ ] 5.1: Import and add HowItWorks section after ConversationFlow
- [ ] 5.2: Import and add FinalCta section after HowItWorks
- [ ] 5.3: Verify layout ordering: Hero → ConversationFlow (14 beats) → HowItWorks → FinalCta

### Task 6: Add OG Meta / SEO Tags
**File:** `apps/front/src/routes/index.tsx`

- [ ] 6.1: Add route-level meta tags via TanStack Router's `head` property
- [ ] 6.2: Set `og:title`, `og:description`, `<title>`, `<meta description>` per UX spec

### Task 7: Verify Responsive Behavior & Accessibility
- [ ] 7.1: Verify mobile layout (<640px): single column, sticky CTA visible after hero scroll
- [ ] 7.2: Verify desktop layout (>=1024px): depth meter visible, proper max-width container
- [ ] 7.3: Verify all new interactive elements have 44px minimum tap targets
- [ ] 7.4: Verify all new animations respect prefers-reduced-motion
- [ ] 7.5: Run typecheck to ensure no TypeScript errors

## Technical Notes

- All homepage content is static — no API calls needed. This preserves LCP <2.5s.
- Use lucide-react icons for "How It Works" step icons (already a project dependency).
- Follow FRONTEND.md conventions: data-slot attributes on component roots, cn() for class merging, semantic color tokens.
- Preserve all existing data-testid attributes.
- New components should use Tailwind utility classes, mobile-first responsive design.

## Out of Scope
- Archetype Gallery Preview (Story 8.2 or separate story — requires data fetching)
- Founder Portrait Bridge content (Story 8.2)
- Social proof strip (post-MVP)
