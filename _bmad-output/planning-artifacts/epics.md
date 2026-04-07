---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# big-ocean - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for big-ocean, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

**Context:** Brownfield project — hexagonal architecture, auth, CI/CD, cloud deployment, and core infrastructure already built. The focus is on completing the MVP: 15-exchange conversation with Nerin → personality results → portrait → relationship analysis → social sharing → homepage conversion.

**Post-MVP items (not epicked here):** FR10, FR23, FR25, FR49 (conversation extension — subscription), Coach/Journal/Career agents (ADR-40-41), subscription billing (ADR-42), daily check-in.

## Requirements Inventory

### Functional Requirements

FR1: Users can have a 15-exchange adaptive conversation with Nerin
FR2: Nerin responds using ocean/marine metaphors and dive master persona
FR3: The Director model steers Nerin's territory focus, observation type, and entry pressure each turn (evidence extraction → coverage analysis → Nerin Director → Nerin Actor)
FR4: Users can see a depth meter reflecting the conversation's progress
FR5: Users receive progress milestone markers at 25%, 50%, and 75% of the conversation
FR6: Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait
FR7: Nerin frames observations as invitations to explore — acknowledges user pushback, offers an alternative framing, and redirects to a different topic only if the user rejects the observation a second time
FR8: Nerin includes a "this is not therapy" framing in the greeting
FR9: Nerin never uses diagnostic language or characterizes third parties the user mentions
FR10: *(Post-MVP — subscription)* Subscribers can extend their conversation (+15 exchanges) to continue with Nerin
FR11: Users can resume an abandoned conversation from where they left off
FR12: The conversation ends with a distinct closing exchange from Nerin before transitioning to results
FR13: Nerin transitions between territories using a connecting observation or question that references the prior topic when the Director model changes territory
FR14: The system extracts facet evidence and energy signals from each user response via the extraction pipeline
FR15: The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
FR16: Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the results page
FR17: The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
FR18: The system presents all archetypes with positive, strength-based framing
FR19: Users can view a dashboard of their results, portrait, relationship analyses, and a link to their public profile
FR20: The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM
FR21: Users are presented with a PWYW modal showing the founder's story and example portrait after completing the assessment
FR22: Users can view their portrait after payment
FR22a: One portrait purchase unlocks one portrait for the user's assessment result
FR23: *(Post-MVP — subscription)* Conversation extension produces a new assessment result with richer portrait
FR24: The system tracks behavioral proxies for portrait emotional impact: share rate and return visits within 48 hours
FR25: *(Post-MVP — subscription)* Conversation extension creates a new assessment session initialized from prior session's final state
FR26: Portrait generation is asynchronous — users are notified when ready
FR27: The system retries portrait generation on failure and informs the user if it ultimately fails
FR28: Users can initiate a relationship analysis by opening a QR drawer; the other person scans the QR code or opens the contained URL
FR29: The system generates a 2-person relationship analysis when both users have completed their assessments
FR30: The QR accept screen shows the initiator's archetype card, both users' confidence rings, and available credit balance, with Accept and Refuse buttons
FR31: Users see a ritual suggestion screen before accessing the relationship analysis
FR32: The relationship analysis describes relational dynamics without blame language and without exposing individual vulnerability data
FR33: Users receive one free relationship analysis credit upon completing their first portrait purchase (PWYW ≥€1). Additional credits cost €5 each
FR34: If one user deletes their account, the shared relationship analysis is deleted
FR35: Each relationship analysis is linked to both users' assessment results. All analyses preserved as snapshots with derive-at-read version detection
FR36: Users receive an email notification when a relationship analysis they participated in is ready
FR37: The QR accept screen is only accessible to logged-in users with a completed assessment
FR38: The system tracks relationship analysis credits per user (1 free, additional purchased)
FR39: Users have a public profile page showing their archetype, OCEAN code, trait/facet scores, and framing line
FR40: Public profiles are default-private; users can explicitly make them public (binary visibility)
FR41: Public profiles generate dynamic OG meta tags and archetype card images for social preview
FR42: Public profiles are accessible without authentication
FR43: Public profiles include a CTA to start the user's own assessment
FR44: Users can copy a shareable link to their public profile
FR45: Logged-in users with completed assessment see relationship analysis CTA on other users' public profiles
FR46: The system generates archetype card images per archetype (81 cards) with geometric visual element and OCEAN code
FR47: Users can pay for portraits via PWYW with embedded checkout (default €5, minimum €1)
FR48: Users can purchase relationship analysis credits via embedded checkout
FR49: *(Post-MVP — subscription)* Subscribers can access conversation extensions as part of their subscription
FR50: Users can create an account with email and password. Email verification required before platform access
FR50a: Verification email contains a unique link that expires after 1 week
FR50b: Users can request a new verification email from the verify-email page
FR51: Users can control the visibility of their public profile (binary)
FR52: Users are informed during onboarding that conversation data is stored
FR53: Users can delete their account, which deletes their data and shared relationship analyses
FR54: Users are introduced to Nerin and the conversation format before the conversation begins
FR55: The system monitors per-session LLM costs against a budget threshold
FR56: The cost guard never blocks a user mid-session; budget protection applies at session boundaries
FR57: When cost guard triggers, users can retry sending their message
FR58: Users are informed when cost guard triggers and told they can retry
FR59: The homepage communicates what Big Ocean is within 3 seconds of landing
FR60: The homepage leads with a transformation-oriented hook
FR61: The homepage has one primary CTA to start the assessment
FR62: The homepage surfaces a concrete portrait excerpt within the first 40% of scroll depth
FR63: The homepage includes a Nerin conversation preview showing character depth
FR64: The homepage addresses three visitor fears (process anxiety, time commitment, self-exposure)
FR65: The homepage surfaces the PWYW pricing model early as a trust signal
FR66: The homepage content works across multiple visitor types

### Non-Functional Requirements

NFR1: Nerin response time <2s P95
NFR2: Public profile page LCP <1s
NFR3: Results page LCP <1.5s
NFR4: Chat page initial load <2s, subsequent interactions <200ms
NFR5: Portrait generation completes within 60s (async)
NFR6: Per-assessment LLM cost stays within ~€0.20 budget
NFR7: Per-portrait LLM cost stays within ~€0.20 budget
NFR8: All data in transit encrypted via TLS 1.3
NFR9: Authentication requires 12+ character passwords and compromised credential checks
NFR9a: Unverified accounts cannot access any authenticated route
NFR9b: Verification email links expire after 1 week
NFR10: Row-level data access control ensures users can only access their own data
NFR11: Public profiles default to private
NFR12: Conversation transcripts stored indefinitely; retrievable within 2s
NFR13: Relationship analysis data does not expose raw conversation transcripts
NFR14: Account deletion cascades to all user data and shared relationship analyses
NFR15: Assessment completion without errors >99%
NFR16: Portrait generation completes successfully >99%
NFR17: Portrait generation retries automatically on failure
NFR18: Cost guard never terminates an active session
NFR19: Conversation sessions are resumable after browser close or connection loss
NFR20: WCAG 2.1 AA compliance for public profile, conversation UI, results page, PWYW modal
NFR21: Chat interface keyboard-navigable with proper ARIA labels
NFR22: Score visualizations have text alternatives
NFR23: Ocean theme color palette meets AA contrast ratios
NFR24: Proper focus management in modals
NFR25: Embedded checkout integration for PWYW and credits
NFR26: The system can switch LLM providers without code changes
NFR27: Transactional email delivery (3 types + relationship notifications within 5 min, >95% delivery)
NFR28: System logs include per-session cost, completion status, and error events
NFR29: Personality scores always recomputed from current facet evidence at read time

### Additional Requirements (Architecture)

- **ADR-39 (Pre-Launch):** Rename assessment_sessions → conversations, assessment_messages → messages, assessment_exchanges → exchanges. Add conversation_type enum + metadata JSONB. Rename all repos (ConversationRepository, MessageRepository, ExchangeRepository)
- **ADR-31-38 (Director Model):** Four-step pipeline: Evidence extraction → Coverage analysis (facet-first) → Nerin Director brief → Nerin Actor response. Exchange table migration (drop pacing columns, add director_output + coverage_targets JSONB)
- **ADR-1 (Hexagonal):** All use-cases via Effect-ts Context.Tag DI. No business logic in handlers
- **ADR-6 (Derive-at-Read):** Trait scores, OCEAN codes, archetypes, capabilities — never stored, always computed
- **ADR-8 (Better Auth + Polar):** Polar as Better Auth plugin. Customer creation on signup with user ID as externalId
- **ADR-9 (Append-Only Events):** purchase_events as source of truth for all capabilities
- **ADR-12 (Resend Email):** 3 email types + relationship notification via React Email templates
- **ADR-24 (Email Verification):** requireEmailVerification blocks session creation for unverified users
- **ADR-25 (E2E Sandbox):** Real Resend sandbox + Polar webhook simulation in e2e tests
- **ADR-27 (Evidence v3):** Polarity + strength extraction model, <35% negative signals trigger re-read
- **ADR-30 (Coverage Selector):** Facet-first coverage analyzer returns primaryFacet + candidateDomains
- Established stack: Effect-ts, TanStack Start/Router/Query, Drizzle+PostgreSQL, Redis, Railway, Docker, GitHub Actions CI
- Testing: Vitest + @effect/vitest, __mocks__ co-location, Docker integration tests, Playwright e2e

### UX Design Requirements

**Design Tokens (7):** UX-DR1 through UX-DR7 — Big Five trait color system (OKLCH), animation tokens, ambient visualization tokens, portrait color tokens, comparison tokens, depth zone tokens, conversation-specific tokens

**Custom Components (14):** UX-DR8 through UX-DR22 — GeometricSignature, OceanCodeStrand, PortraitSpineRenderer, PersonalityRadarChart, QRDrawer, RitualScreen, PortraitUnlockButton, PWYWCurtainModal, ConversationCTA, DepthMeterMilestones, ProfileVisibilityToggle, RelationshipCTA, EvolutionBadge, CreditBalance

**Page Specifications (32):** UX-DR23 through UX-DR54 — Dashboard (merge profile, delete portrait card, reorder grid), Homepage (beat compression 14→8, hero rewrite, fear-resolving HowItWorks, archetype gallery, sticky mobile CTA, Nerin depth preview), Public Profile (framing line, CTA updates, relationship initiation, privacy redirect), Results Page (10-section grid, portrait states, trait card interaction, auth gate)

**Accessibility (21):** UX-DR55 through UX-DR75 — Keyboard navigation, ARIA labels, screen reader support, contrast ratios (4.5:1 text, 3:1 UI), focus management, skip links, live regions, touch targets (44×44px), reduced motion, heading hierarchy, color independence

**Responsive Design (20):** UX-DR76 through UX-DR95 — Mobile-first CSS, conversation width 640px, portrait width 65ch, page-specific layouts (results, profile, homepage, chat, dashboard), QR drawer responsive, tooltip mobile behavior, relative units throughout

**Animation (26):** UX-DR96 through UX-DR121 — Conversation pacing silence, depth meter transitions, portrait reveal, breath sequence (Chat→Results 3-5s), PWYW delayed open, ritual entrance, section entrance animations, trait card cross-fade, facet cascade, GeometricSignature entrance, reduced-motion fallbacks, performance constraints

**Implementation Gaps (30):** UX-DR122 through UX-DR151 — Dashboard gaps (delete portrait card, profile merge, grid reorder), Homepage gaps (hero rewrite, beat compression, fear-resolving section, archetype gallery, sticky CTA, OG meta), Public Profile gaps (framing line, CTA updates, relationship flow, privacy redirect), Results Page gaps (portrait states, generation polling, immersive read mode)

**Strategic UX (32):** UX-DR152 through UX-DR183 — Satori SVG compatibility, iOS Safari testing, QR hook extraction, toast configuration, error strategy (3-tier), loading thresholds, offline behavior, auth gates, deep linking, scroll restoration, empty states, button hierarchy, form patterns, chat input, modal rules, tooltip rules, email specifications

### FR Coverage Map

| FR | Epic | Status |
|----|------|--------|
| FR1 | Epic 1 | Turn count update (25→15) |
| FR2 | — | Implemented |
| FR3 | Epic 1 | Director model refs cascade with table renames |
| FR4 | Epic 1 | Milestone turn recalculation |
| FR5 | Epic 1 | Milestone turn recalculation |
| FR6 | — | Implemented |
| FR7 | — | Implemented |
| FR8 | — | Implemented |
| FR9 | — | Implemented |
| FR10 | Epic 2 | Post-MVP — gate behind subscription |
| FR11 | Epic 1 | Resume uses renamed tables |
| FR12 | Epic 1 | Closing trigger at turn 15 |
| FR13 | Epic 1 | Transitions use renamed repos |
| FR14 | — | Implemented |
| FR15 | — | Implemented |
| FR16-FR19 | — | Implemented |
| FR20-FR22a | — | Implemented |
| FR23 | Epic 2 | Post-MVP — gate behind subscription |
| FR24 | — | Implemented |
| FR25 | Epic 2 | Post-MVP — gate behind subscription |
| FR26-FR48 | — | Implemented |
| FR49 | Epic 2 | Post-MVP — gate behind subscription |
| FR50-FR54 | — | Implemented |
| FR55-FR58 | — | Implemented |
| FR59-FR66 | — | Homepage — deferred to redesign session |
| NFR1-NFR19 | — | Implemented |
| NFR20-NFR24 | Epic 3 | Accessibility pass |
| NFR25-NFR29 | — | Implemented |

## Epic List

### Epic 1: Conversation Calibration — 15-Turn Assessment
Users experience the right-sized ~30-minute conversation (15 turns) with properly named data structures and clear parameter semantics. This epic combines the ADR-39 table renames with the turn count calibration to avoid double-touching 30+ files.
**FRs covered:** FR1, FR3, FR4, FR5, FR11, FR12, FR13
**Architecture:** ADR-39 (table renames), assessmentTurnCount parameter
**Scope:** Schema migration, repo/use-case/handler renames, turn count constant + cascade, user-facing duration text (~30 min), depth meter milestones, prompt updates, test/mock/seed updates, delete dead DashboardPortraitCard.tsx, UX spec duration fixes

### Epic 2: Conversation Extension Cleanup
The MVP product is cleanly scoped — conversation extension is dormant, not accessible, and won't confuse users or create dead-end UI paths. Extension infrastructure preserved for future subscription.
**FRs covered:** FR10 (post-MVP), FR23 (post-MVP), FR25 (post-MVP), FR49 (post-MVP)
**Scope:** Gate or disable extension use-case, remove extension CTAs from UI, clean up frontend references to €25 extension, preserve purchase event types for future subscription

### Epic 3: Accessibility Foundations
Users with disabilities can navigate and use the core product — conversation, results, public profile, and PWYW modal meet WCAG 2.1 AA compliance.
**FRs covered:** NFR20, NFR21, NFR22, NFR23, NFR24
**UX-DRs covered:** UX-DR55 through UX-DR75
**Scope:** Skip-link, ARIA landmarks, focus management in modals, touch targets (44×44px), contrast audit, keyboard navigation for trait cards/depth meter, screen reader support for radar chart/visualizations

---

## Epic 1: Conversation Calibration — 15-Turn Assessment

Users experience the right-sized ~30-minute conversation (15 turns) with properly named data structures and clear parameter semantics.

### Story 1.1: Schema Migration — Table Renames

As a developer,
I want the database tables to reflect multi-conversation semantics,
So that the schema is ready for future conversation types without a painful post-launch migration.

**Acceptance Criteria:**

**Given** the current schema with `assessment_sessions`, `assessment_messages`, `assessment_exchanges`
**When** the migration runs
**Then** tables are renamed to `conversations`, `messages`, `exchanges`
**And** `parent_session_id` is renamed to `parent_conversation_id`
**And** a `conversation_type` enum column is added (`assessment`, `extension`, `coach`, `journal`, `career`) with default `assessment`
**And** a nullable `metadata` JSONB column is added
**And** all existing rows have `conversation_type = 'assessment'`
**And** all FK references are updated
**And** the migration is hand-written SQL following Drizzle migration format

### Story 1.2: Repository & Domain Layer Renames

As a developer,
I want repository interfaces and implementations to use the new table names,
So that the codebase is consistent with the schema.

**Acceptance Criteria:**

**Given** Story 1.1 migration is applied
**When** the rename is complete
**Then** `AssessmentSessionRepository` → `ConversationRepository` (interface + drizzle impl + mock)
**And** `AssessmentMessageRepository` → `MessageRepository` (interface + drizzle impl + mock)
**And** `AssessmentExchangeRepository` → `ExchangeRepository` (interface + drizzle impl + mock)
**And** all domain type imports updated
**And** all use-cases referencing these repos compile and pass tests
**And** `pnpm typecheck` passes across all packages

### Story 1.3: Handler, Contract & Frontend Renames

As a developer,
I want handlers, API contracts, and frontend code to use the new naming,
So that the full stack is consistent.

**Acceptance Criteria:**

**Given** Stories 1.1 and 1.2 are complete
**When** the rename cascade is complete
**Then** all API handlers reference the renamed repos
**And** all frontend hooks and components reference updated API types
**And** all test files (unit, integration, e2e) updated and passing
**And** seed scripts (`seed-completed-assessment.ts`) updated
**And** `pnpm test:run` passes
**And** `pnpm build` succeeds

### Story 1.4: Assessment Turn Count — 25→15

As a user,
I want the conversation to be 15 turns (~30 minutes),
So that the assessment is the right length for meaningful personality discovery without unnecessary length.

**Acceptance Criteria:**

**Given** the current `freeTierMessageThreshold: 25` in app config
**When** the parameter is renamed and updated
**Then** `freeTierMessageThreshold` is renamed to `assessmentTurnCount` across config, mocks, and test config
**And** the value is changed to `15`
**And** the Director model closing trigger fires at turn 15
**And** the depth meter milestones map to turns ~4 (25%), ~8 (50%), ~11 (75%)
**And** portrait context prompt says "15-turn conversation"
**And** all frontend user-facing text says "~30 minutes" (not "25 minutes" or "15 minutes")
**And** all test fixtures and seed scripts use `assessmentTurnCount: 15`
**And** `pnpm test:run` passes

### Story 1.5: Dead Code Cleanup

As a developer,
I want unused code removed,
So that the codebase is clean.

**Acceptance Criteria:**

**Given** DashboardPortraitCard is not rendered anywhere
**When** cleanup is complete
**Then** `DashboardPortraitCard.tsx` is deleted
**And** no imports reference it
**And** `pnpm build` succeeds

---

## Epic 2: Conversation Extension Cleanup

The MVP product is cleanly scoped — conversation extension is dormant, not accessible, and won't confuse users.

### Story 2.1: Gate Extension Use-Case & Remove UI Surface

As a user,
I want the product to only show features I can use,
So that I don't encounter dead-end paths or confusing purchase options.

**Acceptance Criteria:**

**Given** `activate-conversation-extension.use-case.ts` currently exists and is reachable
**When** the cleanup is complete
**Then** the extension use-case returns a clear "feature not available" error if called (not deleted — preserved for subscription)
**And** no extension CTA appears on the results page
**And** no extension CTA appears on the dashboard
**And** no €25 extension purchase option is visible anywhere in the UI
**And** the extension-related purchase event types (`extended_conversation_unlocked`, `extended_conversation_refunded`) remain in the schema (for future subscription)
**And** `hasExtendedConversation` capability check remains in domain (dormant)
**And** `pnpm build` succeeds
**And** `pnpm test:run` passes (update any tests that assert extension accessibility)

---

## Epic 3: Accessibility Foundations

Users with disabilities can navigate and use the core product at WCAG 2.1 AA.

### Story 3.1: Skip-Link & Semantic Landmarks

As a keyboard/screen reader user,
I want to skip navigation and jump to content,
So that I can reach the main content without tabbing through every nav link.

**Acceptance Criteria:**

**Given** any page in the application
**When** the user presses Tab as the first action
**Then** a "Skip to content" link appears (visually hidden, visible on focus)
**And** activating it moves focus to the `<main>` element
**And** every page uses semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`)
**And** the results page has `aria-label` on major sections ("Your traits", "Your portrait", "Your archetype")
**And** heading hierarchy is sequential (one `h1` per page, no skipped levels)

### Story 3.2: Conversation UI Accessibility

As a screen reader user,
I want to navigate the conversation with Nerin,
So that I can participate in the assessment without vision.

**Acceptance Criteria:**

**Given** the chat interface at `/chat`
**When** a screen reader is active
**Then** the message container has `role="log"` for screen reader navigation
**And** Nerin messages announce via `aria-live="polite"` with summary text ("Nerin sent a message")
**And** the depth meter updates `aria-valuenow` on every exchange ("Exchange 8 of 15")
**And** milestone reaches announce via `aria-live="polite"` ("50% depth reached")
**And** the chat input is keyboard-accessible with Enter to send, Shift+Enter for newline
**And** the send button has `aria-label="Send message"`

### Story 3.3: Results Page & Portrait Accessibility

As a user with low vision or using a screen reader,
I want to read my results and portrait,
So that I can access my personality insights regardless of ability.

**Acceptance Criteria:**

**Given** the results page at `/results/:id`
**When** accessibility tools are active
**Then** the radar chart has `role="img"` with `aria-label` summarizing the profile
**And** a data table fallback exists for screen readers (trait name + score for each of 5 traits)
**And** score visualizations (facet bars, trait bands) have text alternatives
**And** trait cards are keyboard-navigable with Tab and `aria-expanded` state
**And** the portrait has readable width (65ch) and supports text resize to 200% with relative units
**And** all text meets 4.5:1 contrast ratio (non-negotiable for paid portrait content)

### Story 3.4: Modal & Focus Management

As a keyboard user,
I want modals to trap focus correctly,
So that I don't lose my place when a modal opens or closes.

**Acceptance Criteria:**

**Given** the PWYW modal or ritual screen opens
**When** the modal is active
**Then** focus moves to the modal content on open
**And** Tab cycles within the modal (focus trap)
**And** Escape closes the modal
**And** focus returns to the trigger element on close
**And** body scroll is locked while modal is open
**And** the modal has `aria-modal="true"` and appropriate `aria-label`

### Story 3.5: Touch Targets & Contrast Audit

As a mobile user or user with motor impairment,
I want all interactive elements to be easy to tap,
So that I can use the product on any device.

**Acceptance Criteria:**

**Given** any interactive element in the application
**When** measured against WCAG guidelines
**Then** all buttons and interactive elements have minimum 44×44px touch targets (padding added for smaller elements)
**And** the ocean theme color palette meets AA contrast ratios (4.5:1 body text, 3:1 UI components)
**And** color is never used alone to convey information (paired with text, icons, or patterns)
**And** `prefers-reduced-motion` fallbacks exist for all animations (verify `motion-safe:` coverage)
**And** form fields have visible labels with `htmlFor`, errors linked via `aria-describedby`
**And** `aria-required="true"` on required form fields
