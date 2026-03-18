---
stepsCompleted: ["step-01-validate-prerequisites", "step-01-requirements-confirmed", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "prd.md"
  - "architecture.md"
  - "ux-design-specification.md"
---

# big-ocean - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for big-ocean, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can have a 25-exchange adaptive conversation with Nerin
FR2: Nerin responds using ocean/marine metaphors and dive master persona
FR3: The pacing pipeline steers Nerin's territory focus, observation type, and entry pressure each turn
FR4: Users can see a depth meter reflecting the conversation's progress
FR5: Users receive progress milestone markers at 25%, 50%, and 75% of the conversation
FR6: Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait
FR7: Nerin frames observations as invitations to explore — acknowledges user pushback, offers an alternative framing, and redirects to a different topic only if the user rejects the observation a second time
FR8: Nerin includes a "this is not therapy" framing in the greeting
FR9: Nerin never uses diagnostic language or characterizes third parties the user mentions
FR10: Users can purchase a conversation extension (+25 exchanges) to continue with Nerin
FR11: Users can resume an abandoned conversation from where they left off
FR12: The conversation ends with a distinct closing exchange from Nerin before transitioning to results
FR13: Nerin transitions between territories using a connecting observation or question that references the prior topic when the pacing pipeline changes territory (distinct from general steering)
FR14: The system extracts facet evidence and energy signals from each user response via the extraction pipeline
FR15: The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
FR16: Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the results page
FR17: The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
FR18: The system presents all archetypes with positive, strength-based framing
FR19: Users can view a dashboard of their results, portrait, and relationship analyses
FR20: The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM
FR21: Users are presented with a PWYW modal showing the founder's story and example portrait after completing the assessment
FR22: Users can view their portrait after payment
FR23: Conversation extension produces an updated portrait that incorporates observations derived from extended evidence not present in the original portrait
FR24: The system tracks behavioral proxies for portrait emotional impact: share rate, conversation extension purchase rate, and return visits within 48 hours
FR25: Conversation extension creates a new assessment session. The pacing pipeline initializes from the prior session's final state and evidence. On completion, new assessment results are generated. The prior portrait and any relationship analyses based on the prior results become "previous version"
FR26: Portrait generation is asynchronous — users are notified when ready
FR27: The system retries portrait generation on failure and informs the user if it ultimately fails
FR28: Users can initiate a relationship analysis by opening a QR drawer; the other person scans the QR code or opens the contained URL
FR29: The system generates a 2-person relationship analysis when both users have completed their assessments
FR30: The QR accept screen shows the initiator's archetype card, both users' confidence rings, and available credit balance, with Accept and Refuse buttons. The recipient must accept before the analysis proceeds (single consent gate)
FR31: Users see a ritual suggestion screen before accessing the relationship analysis
FR32: The relationship analysis describes relational dynamics without blame language and without exposing individual vulnerability data
FR33: Users receive one free relationship analysis credit upon completing their first portrait purchase (PWYW >= 1 euro). Additional credits cost 5 euros each
FR34: If one user deletes their account, the shared relationship analysis is deleted
FR35: Each relationship analysis is linked to both users' assessment results (not to invitations). All analyses are preserved as snapshots — the newest is primary, older ones are classified as "previous version." Version detection is derive-at-read: if newer assessment results exist for either user, the analysis is classified as "previous version." Users can view all their relationship analyses
FR36: Users receive an email notification when a relationship analysis they participated in is ready
FR37: The QR accept screen is only accessible to logged-in users with a completed assessment. There is no pre-account context — User B must sign up and complete their assessment before seeing the accept screen
FR38: The system tracks relationship analysis credits per user (1 free, additional purchased)
FR39: Users have a public profile page showing their archetype, OCEAN code, trait/facet scores, and the framing line "[Name] dove deep with Nerin — here's what surfaced"
FR40: Public profiles are default-private; users can explicitly make them public. Binary visibility only — fully public or fully private. No intermediate state
FR41: Public profiles generate dynamic OG meta tags and archetype card images for social preview
FR42: Public profiles are accessible without authentication
FR43: Public profiles include a CTA to start the user's own assessment
FR44: Users can copy a shareable link to their public profile
FR45: When a logged-in user with a completed assessment views another user's public profile, a relationship analysis CTA is displayed: "You care about [Name]. Discover your dynamic together." with a brief QR flow explanation
FR46: The system generates archetype card images per archetype (81 cards) — users with the same archetype share the same card visual. Each card contains: archetype name, short description (1-2 sentences), GeometricSignature, and OCEAN code. No individual trait/facet scores. One card per archetype (generic, not personalized)
FR47: Users can pay for portraits via PWYW with embedded checkout. Default 5 euros, minimum 1 euro. No preset amount buttons — a single "Unlock your portrait" button opens the checkout modal
FR48: Users can purchase relationship analysis credits via embedded checkout
FR49: Users can purchase conversation extensions via embedded checkout
FR50: Users can create an account and authenticate
FR51: Users can control the visibility of their public profile (binary: fully public or fully private)
FR52: Users are informed during onboarding that conversation data is stored
FR53: Users can delete their account, which deletes their data and any shared relationship analyses
FR54: Users are introduced to Nerin and the conversation format before the conversation begins (pre-conversation onboarding)
FR55: The system monitors per-session LLM costs against a budget threshold
FR56: The cost guard never blocks a user mid-session; budget protection applies at session boundaries
FR57: When cost guard triggers, users can retry sending their message
FR58: Users are informed when cost guard triggers and told they can retry

### NonFunctional Requirements

NFR1: Nerin response time <2s P95 (server-side LLM call + pipeline processing)
NFR2: Public profile page LCP <1s (acquisition landing page — bounce rate sensitive)
NFR3: Results page LCP <1.5s (emotional moment after completing 25 exchanges)
NFR4: Chat page initial load <2s, subsequent interactions <200ms (client-side)
NFR5: Portrait generation completes within 60s (async — user notified, not waiting)
NFR6: Per-assessment LLM cost stays within ~0.20 euro budget (cost-efficient LLM for conversation + extraction)
NFR7: Per-portrait LLM cost stays within ~0.20 euro budget (high-capability LLM for generation)
NFR8: All data in transit encrypted via TLS 1.3
NFR9: Authentication requires 12+ character passwords and compromised credential checks
NFR10: Row-level data access control ensures users can only access their own data
NFR11: Public profiles default to private — zero public discovery without explicit user opt-in
NFR12: Conversation transcripts stored indefinitely; retrievable within 2s regardless of age
NFR13: Relationship analysis data does not expose raw conversation transcripts to the other party
NFR14: Account deletion cascades to all user data and shared relationship analyses
NFR15: Assessment completion without errors >99%
NFR16: Portrait generation completes successfully >99%
NFR17: Portrait generation retries automatically on failure
NFR18: Cost guard never terminates an active session — only blocks at session boundaries
NFR19: Conversation sessions are resumable after browser close or connection loss
NFR20: WCAG 2.1 AA compliance required for: public profile, conversation UI, results page, PWYW modal. Best-effort AA for remaining pages
NFR21: Chat interface keyboard-navigable with proper ARIA labels
NFR22: Score visualizations (facet bars, trait bands) have text alternatives
NFR23: Ocean theme color palette meets AA contrast ratios
NFR24: Proper focus management in modals (PWYW, ritual screen)
NFR25: Embedded checkout integration for PWYW, credits, and extension purchases
NFR26: The system can switch LLM providers without code changes to the conversation or portrait pipeline
NFR27: Transactional email delivery. Three email types: (1) drop-off re-engagement with last territory, (2) Nerin check-in ~2 weeks post-assessment, (3) deferred portrait recapture. Relationship analysis notifications delivered within 5 minutes of completion, >95% delivery rate
NFR28: System logs include per-session cost, completion status, and error events in structured format
NFR29: Personality scores displayed to users are never stale — always recomputed from current facet evidence at read time

### Additional Requirements

**Architecture Requirements:**
- Four distinct LLM agents required: ConversAnalyzer v2 (Haiku 4.5), Nerin agent (Haiku 4.5), Full Portrait (Sonnet 4.6), Relationship Analysis (Sonnet 4.6)
- 2-layer Nerin prompt system: Layer 1 (Common persona/instincts) + Layer 2 (Steering: intent x observation template + pressure modifiers + curated mirrors)
- ConversAnalyzer v2 runs BEFORE Nerin (sequential, not parallel) — dual extraction: userState (energy x telling) + evidence
- Three-tier extraction with fail-open: Strict (attempts 1-3) → Lenient (attempt 4) → Neutral defaults (no LLM)
- Six-layer pacing pipeline architecture (immutable order): Pacing (E_target) → Territory Scorer → Territory Selector → Move Governor → Prompt Builder → Nerin Response
- E_target is user-state-pure formula (NO coverage pressure — coverage belongs in territory scoring only)
- Territory Scorer uses five-term unified formula: coverageGain + adjacency + conversationSkew - energyMalus - freshnessPenalty
- 25 territories with dual-domain tags, expected facets, and expectedEnergy — all 30 Big Five facets covered
- Conversation is 25 exchanges, 1-indexed (NOT zero-indexed)
- Assessment_exchange table: one row per turn with extraction, pacing, scoring, governor, and observability columns
- Derive-at-read enforcement: trait scores, OCEAN codes, archetypes, capabilities all computed at read time from facet evidence — never stored
- Placeholder-row async pattern for portraits and relationship analyses: insert placeholder → fork daemon → client polls → lazy retry on staleness
- Polar.sh as merchant-of-record (EU VAT, CNIL compliance) with Better Auth Polar plugin
- Append-only purchase_events table with 8 event types and idempotent webhook processing
- Credit system: 1 free credit on first portrait purchase, additional credits purchasable
- QR token model for relationship analysis: 6-hour TTL, auto-regenerate hourly, status polling, accept/refuse flow
- Relationship_analyses linked to assessment_results (not invitations) for both users
- Conversation extension: parent_session_id FK, pacing pipeline initialized from prior session's final state
- Resend email provider with React Email templates for 3 email types
- Redis-based cost guard with fail-open pattern
- Satori + @resvg/resvg-js for server-side archetype card generation
- Better Auth with haveIBeenPwned plugin, session-based httpOnly cookies
- Anonymous-first assessment — auth required only at finalization
- Three-location error architecture: HTTP errors in contracts, infrastructure errors co-located with repo interfaces, domain errors use contract errors
- Error propagation rule: use-cases and handlers must NOT remap errors
- Pacing pipeline functions must be pure (no yield* Repository calls)
- Brownfield project: existing hexagonal architecture, Effect-ts, Drizzle ORM, TanStack Start, Railway deployment, CI/CD all in place

**UX Requirements:**
- Mobile-first design mandatory — touch-optimized with 44px minimum tap targets
- Assessment invisibility principle: no UX element should remind user they are being evaluated — no "assessment," "test," "quiz," or "diagnostic" terminology
- Three-surface architecture: Results Page (private), Public Profile (opt-in), Relationship Analysis (auth-gated)
- prefers-reduced-motion must be respected globally for all animations
- Color-only indicators prohibited — score levels must pair with icons or text labels
- Radix UI accessibility primitives for dialog, accordion, collapsible, checkbox
- Tier 1 animations (MVP, CSS only): conversation pacing/held silence, depth meter transitions, basic portrait reveal
- Tier 2 animations (post-launch): orchestrated portrait reveal, ambient energy response
- Animation performance budget: <5% CPU during conversation on mid-range Android
- All animations on transform and opacity only — no layout thrashing, no animation library in MVP
- Geometric shapes system: 15 unique letter shapes (one per OCEAN code letter) used across ocean layer, strand dots, trait cards, radar, personality cards, profiles
- Portrait Spine Renderer: shared component for personal and relationship portraits, accepts {emoji, title, subtitle?, paragraphs[]}[], highlight spans for evidence links
- PersonalityRadarChart: Recharts, single polygon for individual, overlaid dual-polygon for relationship comparison
- OceanCodeStrand, TraitCard, ConfidenceRingCard, GeometricSignature components with specified reuse matrix
- Conversation highlights system: users select specific moments to feature on public profile
- QR drawer: generates on open, auto-regenerates hourly, 6-hour TTL
- PWYW modal: congratulations bridge → founder's love letter → Vincent's portrait example → CTA, Polar embed stacks on modal
- Archetype card formats: 1.91:1 for OG link previews, 9:16 for social stories
- Web Share API where available, fallback to manual copy
- Founder story voice: dense (3-4 sentences), personal vulnerability, love letter tone
- Nerin voice: warm, curious, never clinical, conversational not interview-like
- Trust-Surprise Loop is core emotional engine — ignition at turns 5-8 (first observation)
- Portrait reveal choreography: 5-phase "breath" sequence (Nerin's last word → chat fades → shapes consolidate → archetype rises → grid populates)
- Ambient visualization responds to conversational energy (NOT personality dimensions)
- Error handling: session auto-saves, interrupted conversations auto-recover, portrait retry on failure, QR expired → regenerate

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR9 | Epic 2 | Conversation with Nerin (pacing, persona, safety) |
| FR10 | Epic 7 | Conversation extension purchase |
| FR11 | Epic 2 | Resume abandoned conversation |
| FR12-FR14 | Epic 2 | Closing exchange, territory transitions, extraction |
| FR15-FR18 | Epic 3 | Scoring, archetypes, OCEAN code |
| FR19 | Epic 9 | Dashboard |
| FR20-FR22 | Epic 3 | Portrait generation, PWYW, viewing |
| FR23 | Epic 7 | Updated portrait from extension |
| FR24 | Epic 9 | Behavioral proxy tracking |
| FR25 | Epic 7 | Extension session mechanics |
| FR26-FR27 | Epic 3 | Async portrait, retries |
| FR28 | Epic 5 | QR initiation |
| FR29 | Epic 6 | Relationship analysis generation |
| FR30 | Epic 5 | QR accept screen & consent gate |
| FR31-FR32 | Epic 6 | Ritual screen, analysis content |
| FR33 | Epic 3 | Free credit granting on first portrait purchase |
| FR34-FR36 | Epic 6 | Cascade deletion, version management, email notification |
| FR37 | Epic 5 | Auth-gating for QR accept |
| FR38 | Epic 3 | Credit tracking system |
| FR39 | Epic 4 | Public profile page |
| FR40 | Epic 1 | Default-private profiles |
| FR41-FR45 | Epic 4 | OG tags, sharing, CTAs |
| FR46 | Epic 3 | Archetype card images |
| FR47-FR49 | Epic 3 | PWYW, credit, extension checkout |
| FR50 | Epic 1 | Account creation & auth |
| FR51 | Epic 1 | Profile visibility control |
| FR52 | Epic 2 | Data storage notice (in Nerin's greeting) |
| FR53 | Epic 1 | Account deletion |
| FR54 | Epic 2 | Pre-conversation onboarding (in Nerin's greeting) |
| FR55-FR58 | Epic 2 | Cost guard |

## Epic List

### Epic 1: Account, Onboarding & Privacy Foundation
Users can create an account, authenticate, understand what they're about to experience, and delete their account if desired. Privacy controls are in place from day one.
**FRs covered:** FR50, FR53, FR40, FR51
**Notes:** FR52 (data storage notice) and FR54 (pre-conversation onboarding) moved to Epic 2 — handled in Nerin's greeting message.
**Parallelism:** Can be built simultaneously with Epic 2.

### Epic 2: Conversational Assessment & Drop-off Recovery
Users can have a complete 25-exchange adaptive conversation with Nerin and resume if interrupted. Drop-off users receive a re-engagement email.
**FRs covered:** FR1-FR9, FR11-FR14, FR52, FR54, FR55-FR58
**NFR coverage:** NFR27 (drop-off re-engagement email — Resend setup + first template)
**Notes:** Email infrastructure (Resend setup, React Email) is a parallel workstream within this epic — does not block conversation stories. Accept this as the largest epic (~2-3x others). Character quality work (FR6-FR9, FR12-FR13) is iterative prompt engineering.
**Parallelism:** Can be built simultaneously with Epic 1.

### Epic 3: Results, Portrait & Monetization
Users can view their personality results (OCEAN code, archetype, trait/facet scores), unlock their narrative portrait via PWYW checkout, and share a basic link to their results. The full monetization foundation (Polar integration, purchase events, credits) ships as part of this epic.
**FRs covered:** FR15-FR22, FR26-FR27, FR33, FR38, FR46-FR49
**Notes:** Polar integration (Better Auth plugin, webhook handler, purchase_events table, credit system) + results page UI (10-section grid) + PWYW modal + portrait reveal + archetype card images + portrait reconciliation + lazy retry. Includes basic share action (copy URL to results). Archetype card generation (Satori + Resvg) can be a parallel workstream within this epic. Teaser portrait removed — only full portrait exists.

### Epic 4: Public Profile & Sharing
Users can share their personality with the world via a public profile page with social previews, shareable links, and a CTA for others to start their own assessment.
**FRs covered:** FR39, FR41-FR45
**Notes:** 5-section story scroll, OG meta tags via Satori + Resvg, archetype card for social preview, share flow with instant visibility toggle, relationship analysis CTA for logged-in viewers. Builds on basic share from Epic 3.
**Parallelism:** Can be built simultaneously with Epic 5.

### Epic 5: Relationship Analysis — QR & Credits
Users can initiate a relationship analysis via QR code. The other person scans, accepts, and credits are consumed.
**FRs covered:** FR28, FR30, FR37
**Notes:** QR token model (6h TTL, auto-regenerate, accept/refuse), consent gate UI (archetype card, confidence rings, credit balance), credit consumption on accept, auth-gating for User B.
**Parallelism:** Can be built simultaneously with Epic 4.

### Epic 6: Relationship Analysis — Generation & Display
Both users receive a generated relationship analysis after a ritual moment, with email notification and version management.
**FRs covered:** FR29, FR31-FR32, FR34-FR36
**Dependencies:** Epic 5 (QR infrastructure) + Epic 3 (spine renderer reuse from portrait).
**Notes:** Sonnet agent for analysis generation, ritual suggestion screen with synchronous notification/polling mechanism for both devices, placeholder-row async pattern, relationship portrait (reuses spine renderer from Epic 3), version detection (derive-at-read), email notification, cascade deletion hook.

### Epic 7: Conversation Extension
Users can purchase an extension to continue their conversation with Nerin for another 25 exchanges, generating updated results and a new portrait.
**FRs covered:** FR10, FR23, FR25
**Notes:** New session with parent_session_id, pacing initialization from prior state, combined evidence for new results, prior portrait/analyses marked "previous version." Depends on stable portrait pipeline from Epic 3.
**Parallelism:** Can be built simultaneously with Epic 5 or Epic 6.

### Epic 8: Homepage & Acquisition Funnel
New visitors experience a compelling homepage that introduces big-ocean's value proposition and drives them to start their own assessment.
**FRs covered:** (Acquisition funnel — not explicitly in FRs but critical for scaling)
**Notes:** 14-beat conversational narrative, embedded interactive previews, scroll-driven depth meter (desktop), sticky bottom CTA (mobile), founder portrait bridge. Growth-phase investment, not PMF-critical.

### Epic 9: Engagement Emails & Dashboard
The system sends check-in and recapture emails. Users can view a centralized dashboard with results, portrait, relationship analyses, and behavioral impact metrics.
**FRs covered:** FR19, FR24
**NFR coverage:** NFR27 (remaining 2 email types: Nerin check-in ~2 weeks post-assessment, deferred portrait recapture)
**Notes:** Dashboard is aggregation view — built last when all content types exist. Behavioral proxy tracking (share rate, extension purchase rate, return visits). Remaining email templates build on Resend infrastructure from Epic 2.

### Parallelism Map

```
Phase 1: Epic 1 ∥ Epic 2 (account + conversation — independent)
Phase 2: Epic 3 (results + monetization — depends on E1+E2)
Phase 3: Epic 4 ∥ Epic 5 (public profile ∥ QR infra — independent)
Phase 4: Epic 6 (relationship generation — depends on E5+E3)
Phase 5: Epic 7 ∥ Epic 8 (extension ∥ homepage — independent)
Phase 6: Epic 9 (dashboard + remaining emails — last)
```

---

## Epic 1: Account, Onboarding & Privacy Foundation

Users can create an account, authenticate, and delete their account if desired. Privacy controls are in place from day one.

### Story 1.1: Profile Visibility Controls

As a user,
I want to control whether my profile is publicly visible or private,
So that I decide who can see my personality results.

**Acceptance Criteria:**

**Given** a user has completed their assessment
**When** they navigate to their account settings
**Then** they see a profile visibility toggle defaulting to "Private"
**And** the toggle offers exactly two states: "Public" and "Private" (no intermediate)

**Given** a user's profile is set to "Private" (default)
**When** another user or anonymous visitor attempts to access their profile URL
**Then** they receive a 404 or appropriate "not found" response

**Given** a user toggles their profile to "Public"
**When** the toggle is saved
**Then** their profile becomes accessible at their public profile URL
**And** toggling back to "Private" immediately removes public access

**Given** a new user account is created
**When** the account is initialized
**Then** the profile visibility defaults to "Private" with zero public discovery

### Story 1.2: Account Deletion with Cascade Hooks

As a user,
I want to permanently delete my account and all associated data,
So that my personal information is removed from the platform.

**Acceptance Criteria:**

**Given** a logged-in user navigates to account settings
**When** they select "Delete Account"
**Then** they see a confirmation dialog requiring explicit confirmation before proceeding

**Given** a user confirms account deletion
**When** the deletion is processed
**Then** all user data is removed: account, assessment sessions, messages, evidence records, facet scores, portraits, and any purchase events
**And** the user's auth session is invalidated
**And** the user is redirected to the homepage

**Given** a user confirms account deletion
**When** the deletion is processed
**Then** a domain event is emitted that future epics can subscribe to for their own cleanup (e.g., relationship analyses in Epic 6)

**Given** a user has deleted their account
**When** anyone attempts to access their former profile URL
**Then** they receive a 404 or appropriate "not found" response

---

## Epic 2: Conversational Assessment & Drop-off Recovery

Users can have a complete 25-exchange adaptive conversation with Nerin and resume if interrupted. Drop-off users receive a re-engagement email.

### Story 2.1: Nerin Greeting & Onboarding Message

As a user,
I want to receive a welcoming opening message from Nerin that introduces the conversation format,
So that I understand what to expect and feel safe to share openly.

**Acceptance Criteria:**

**Given** a user starts a new conversation
**When** the first exchange begins
**Then** Nerin delivers a greeting using ocean/marine metaphors and dive master persona (FR2)
**And** the greeting includes a "this is not therapy" framing (FR8)
**And** the user is informed that conversation data is stored (FR52)
**And** the greeting introduces the conversational format without using words like "assessment," "test," or "diagnostic" (FR54)

**Given** the greeting is delivered
**When** the user reads the onboarding cues
**Then** the greeting encourages the user that it's okay to not know the answer
**And** encourages giving concrete examples rather than abstract answers
**And** encourages answering as truthfully as possible
**And** invites the user to go beyond the original question if they feel it is needed

**Given** a user reads the greeting
**When** they send their first response
**Then** the pacing pipeline activates with cold-start perimeter selection from top-scored territories

### Story 2.2: Nerin Character Quality — Observations, Transitions & Character Bible

As a user,
I want Nerin to feel like a real person with depth and a story of his own,
So that the conversation feels authentic and I trust him enough to share honestly.

**Acceptance Criteria:**

**Given** Nerin's character bible
**When** prompts are constructed
**Then** Nerin is grounded in the Big Ocean diving shop setting — Big Ocean is a dive shop, Vincent is the founder and boss, and Nerin is its dive master
**And** Nerin has an origin story that informs his personality, perspective, and conversational style
**And** the character bible is reflected in the Common prompt layer (~1,500 words, loaded once per session)

**Given** a conversation is past the settling phase (~turns 5-8)
**When** Nerin has accumulated evidence about the user
**Then** Nerin references patterns he is noticing to build anticipation for the portrait (FR6)

**Given** Nerin makes an observation about the user
**When** the user pushes back on the observation
**Then** Nerin acknowledges the pushback, offers an alternative framing, and only redirects to a different topic if the user rejects the observation a second time (FR7)

**Given** the pacing pipeline changes the selected territory
**When** Nerin transitions to a new topic
**Then** the transition uses a connecting observation or question that references the prior topic, distinct from general steering (FR13)

**Given** a user mentions third parties or personal struggles
**When** Nerin responds
**Then** Nerin never uses diagnostic language or characterizes third parties the user mentions (FR9)

### Story 2.3: Conversation Closing Exchange

As a user,
I want a meaningful closing moment with Nerin before seeing my results,
So that the conversation ends with emotional resonance rather than an abrupt stop.

**Acceptance Criteria:**

**Given** a conversation reaches turn 25
**When** the Move Governor selects the close intent
**Then** Nerin delivers a distinct closing exchange that wraps the conversation themes
**And** the closing message references specific patterns or moments from the conversation (FR12)

**Given** Nerin has delivered the closing exchange
**When** the user's final response is processed
**Then** the system transitions to the results page via the breath sequence animation
**And** no further messages can be sent in this session

### Story 2.4: Depth Meter & Progress Milestones

As a user,
I want to see how deep into the conversation I am without it feeling like a progress bar,
So that I have a sense of progression without being reminded I'm being assessed.

**Acceptance Criteria:**

**Given** a conversation is in progress
**When** the user views the chat interface
**Then** a depth meter is visible reflecting the current conversation progress (FR4)
**And** the depth meter uses non-numeric visual indicators (assessment invisibility principle)

**Given** the conversation reaches 25%, 50%, or 75% completion
**When** the milestone is hit
**Then** a subtle milestone marker is displayed with a glow pulse animation (FR5)
**And** the animation respects prefers-reduced-motion (instant cut fallback)

**Given** the depth meter transitions between states
**When** progress changes
**Then** CSS transitions animate the height/fill with custom easing
**And** the meter is accessible with appropriate ARIA attributes

### Story 2.5: Session Resume

As a user,
I want to pick up my conversation where I left off if I close my browser or lose connection,
So that I don't lose progress in my conversation with Nerin.

**Acceptance Criteria:**

**Given** a user has an in-progress conversation
**When** they close the browser and return later
**Then** navigating to /chat loads the existing session with all prior messages displayed
**And** the depth meter reflects the correct progress
**And** the pacing pipeline resumes from the last exchange state (FR11)

**Given** a user loses network connection mid-conversation
**When** connectivity is restored
**Then** any unsent message can be retried
**And** the conversation state remains consistent

**Given** a user has a completed conversation
**When** they navigate to /chat
**Then** they are not presented with the completed session as resumable
**And** they are directed to their results or offered to start a new assessment

### Story 2.6: Cost Guard

As a user,
I want my conversation to never be interrupted mid-exchange by budget limits,
So that I have a reliable experience even when system costs are high.

**Acceptance Criteria:**

**Given** a conversation is in progress
**When** per-session LLM costs are being tracked
**Then** the system monitors costs against a configurable budget threshold via Redis (FR55)
**And** cost tracking uses the fail-open pattern — if Redis is unavailable, the conversation continues

**Given** the cost guard threshold is exceeded
**When** the user is mid-session
**Then** the current session is never terminated — cost guard only applies at session boundaries (FR56, NFR18)

**Given** the cost guard triggers at a session boundary
**When** the user attempts to send a message
**Then** the user is informed that the system is temporarily unavailable (FR58)
**And** a retry option is presented (FR57)

**Given** cost guard events occur
**When** the system logs the event
**Then** structured logs include per-session cost, completion status, and the cost guard event (NFR28)

### Story 2.7: Email Infrastructure & Drop-off Re-engagement

As the system,
I want to send a re-engagement email to users who abandon their conversation,
So that users who dropped off are reminded to return and complete their experience.

**Acceptance Criteria:**

**Given** the email infrastructure needs to be set up
**When** the Resend integration is configured
**Then** a ResendEmailRepository interface exists in domain/src/repositories/
**And** a ResendEmailRepositoryLive implementation exists in infrastructure/src/repositories/
**And** React Email templates are consistent with frontend styling

**Given** a user has an in-progress conversation and has been inactive for a configured duration
**When** the drop-off threshold is reached
**Then** a re-engagement email is sent referencing the last territory from the final assessment_exchange (NFR27)
**And** the email is sent fire-and-forget (does not block any user-facing operation)
**And** the email is one-shot only — no repeated re-engagement emails for the same session

**Given** the email sending fails
**When** the failure is detected
**Then** the failure is logged but does not affect any other system behavior (fail-open)

---

## Epic 3: Results, Portrait & Monetization

Users can view their personality results (OCEAN code, archetype, trait/facet scores), unlock their narrative portrait via PWYW checkout, and share a basic link to their results. The full monetization foundation ships as part of this epic. Teaser portrait removed — only full portrait exists.

### Story 3.0: Remove Teaser Portrait

As a developer,
I want to remove all teaser portrait references from the codebase and planning documents,
So that the architecture is clean and only the full portrait concept exists.

**Acceptance Criteria:**

**Given** the teaser portrait concept is being removed
**When** the cleanup is performed
**Then** all teaser portrait references are removed from: architecture.md, prd.md, ux-design-specification.md, and any other planning artifacts
**And** the Teaser Portrait LLM agent (Haiku 4.5, "once at finalization") is removed from the architecture's agent model (now four agents)
**And** any teaser-related code, types, endpoints, or use-cases are removed from the codebase
**And** the portrait section pre-purchase shows only the "Unlock your portrait" CTA with no content preview

**Given** the teaser portrait agent is removed
**When** the LLM agent inventory is updated
**Then** four agents remain: Nerin (Haiku), ConversAnalyzer v2 (Haiku), Full Portrait (Sonnet), Relationship Analysis (Sonnet)

### Story 3.0b: OCEAN Code Letter Mapping Update

As a user viewing my personality results,
I want each trait level to have a unique, meaningful letter,
So that my OCEAN code is unambiguous and maps to distinct geometric shapes.

**Acceptance Criteria:**

**Given** the current TRAIT_LETTER_MAP has letter collisions (R used for both E-low and N-low, T used for both O-low and N-mid)
**When** the letter mapping is updated per the UX design specification
**Then** Extraversion-Low changes from R (Reserved) to I (Introverted)
**And** Neuroticism-Mid changes from T (Tempered) to V (Variable)
**And** all 15 trait-level letters are unique
**And** type definitions (ExtraversionLevel, NeuroticismLevel) are updated
**And** schema regex (OceanCode4Schema, OceanCode5Schema) validates the new letters
**And** all 27 CURATED_ARCHETYPES keys with R in position 3 are updated to I
**And** TEASER_TRAIT_LETTERS reflects the new mapping
**And** all existing tests pass with updated fixtures
**And** CLAUDE.md OCEAN Code Generation section is updated to reflect semantic letters (not L/M/H)
**And** PRD and architecture documents are verified for consistency with the new letter mapping
**And** any doc comments in codebase referencing old letters (R=Reserved, T=Tempered) are updated

### Story 3.1: Results Page — Identity Section

As a user,
I want to see my archetype, OCEAN code, and personality signature immediately after completing my conversation,
So that I get an instant, memorable snapshot of who I am.

**Acceptance Criteria:**

**Given** a user has completed their 25-exchange conversation
**When** they land on the results page
**Then** the hero section displays their archetype name, tribe feeling, and GeometricSignature
**And** the OCEAN code strand is rendered with each letter as a navigable element with tooltip (aria-describedby)
**And** all values are computed at read time from facet evidence (derive-at-read — NFR29)
**And** the page is server-rendered with LCP <1.5s (NFR3)

**Given** the results page loads
**When** trait scores are derived from 30 facet scores
**Then** OCEAN code is computed via threshold mapping (0-40=L, 40-80=M, 80-120=H)
**And** archetype is looked up from the in-memory registry based on OCEAN code
**And** no stored aggregations are read — facet scores are the single source of truth

**Given** a user views the identity section on mobile
**When** the viewport is <640px
**Then** the layout stacks vertically with full-width components
**And** all interactive elements meet 44px minimum tap targets

### Story 3.2: Results Page — Scientific Section

As a user,
I want to explore my trait and facet scores in depth with supporting evidence,
So that I understand the nuances of my personality beyond the headline archetype.

**Acceptance Criteria:**

**Given** a user views the results page
**When** the scientific section renders
**Then** a radar chart (Recharts, lines-only style) displays 5 trait scores as a single polygon
**And** a confidence ring shows overall assessment confidence (8px stroke, rounded caps, clockwise draw animation)
**And** radar and confidence display side-by-side above sm breakpoint, stacked on mobile

**Given** a user clicks a trait card
**When** the detail zone expands
**Then** 6 facet bars are displayed for that trait (3px height, solid trait color fill, left-to-right animation with 50ms stagger)
**And** only one trait card is expanded at a time (clicking another collapses the current)
**And** the trait card is keyboard navigable (Tab + Enter) with aria-expanded state

**Given** a user clicks a facet within an expanded detail zone
**When** the evidence panel opens
**Then** it renders as role="dialog" with focus trap and aria-labelledby to the facet name
**And** evidence records from the conversation are displayed with deviation, strength, and domain
**And** evidence is fetched on demand (not preloaded with results)

**Given** score visualizations are rendered
**When** a screen reader encounters them
**Then** the radar chart has role="img" with aria-label and a data table fallback
**And** trait bars and facet bars have text alternatives (NFR22)
**And** score levels pair with text labels, not color-only indicators

**Given** all animations in this section
**When** prefers-reduced-motion is enabled
**Then** all animations use instant-cut fallback (radar reveal, bar animations, facet cascade, confidence ring draw)

### Story 3.3: Polar Integration & Purchase Events

As the system,
I want to process payments through Polar as merchant-of-record and track all purchase events immutably,
So that monetization is reliable, idempotent, and supports all product types.

**Acceptance Criteria:**

**Given** the Polar integration is configured
**When** the Better Auth Polar plugin is initialized
**Then** customer sync creates a Polar customer with externalId = userId on signup
**And** the webhook handler (onOrderPaid) lives inside the Better Auth Polar plugin

**Given** a Polar webhook fires for a completed order
**When** onOrderPaid processes the event
**Then** the Polar product ID is mapped to an internal event type
**And** a purchase_event row is inserted into the append-only purchase_events table
**And** the polar_checkout_id UNIQUE constraint ensures idempotent processing (duplicate webhooks are no-ops)

**Given** the purchase_events table
**When** events are recorded
**Then** 8 event types are supported: free_credit_granted, portrait_unlocked, credit_purchased, credit_consumed, extended_conversation_unlocked, portrait_refunded, credit_refunded, extended_conversation_refunded
**And** rows are INSERT-only and immutable — no updates or deletes

**Given** the webhook handler processes events
**When** a database transaction is needed
**Then** plain Drizzle is used for transactions (not Effect layers) within the Better Auth plugin context

### Story 3.4: PWYW Modal & Portrait Unlock

As a user,
I want to unlock my portrait through a meaningful pay-what-you-wish moment,
So that I feel the value of what Nerin has written for me before deciding to pay.

**Acceptance Criteria:**

**Given** a user visits the results page for the first time after completing their assessment
**When** ~2-3 seconds have passed (emotional absorption delay)
**Then** the PWYW modal auto-opens with: congratulations bridge → founder's love letter (dense, 3-4 sentences, personal vulnerability) → Vincent's portrait example → "Unlock your portrait" CTA
**And** the modal has proper focus management (NFR24)

**Given** a user clicks "Unlock your portrait"
**When** the Polar embedded checkout opens
**Then** it stacks on top of the PWYW modal
**And** the default amount is €5, minimum €1
**And** no preset amount buttons appear in the product UI — Polar handles pricing UI (FR47)

**Given** a user completes PWYW payment
**When** the portrait_unlocked webhook fires
**Then** a portrait_unlocked purchase event is recorded
**And** if this is the user's first portrait purchase, a free_credit_granted event is conditionally inserted (only if no prior free_credit_granted exists for this user) (FR33)

**Given** a user dismisses the PWYW modal without paying
**When** they return to the results page
**Then** a persistent "Unlock your portrait" button with breathing animation is displayed in the portrait section
**And** tapping the button reopens the PWYW modal

### Story 3.5: Full Portrait Display

As a user,
I want to read my full portrait after purchasing it,
So that I experience the deeply personal narrative Nerin has written for me.

**Acceptance Criteria:**

**Given** a user has completed their assessment but has not purchased
**When** they view the portrait section on the results page
**Then** the portrait section shows the "Unlock your portrait" breathing CTA button
**And** no portrait content or preview is displayed

**Given** a user has purchased their portrait
**When** portrait generation is in progress
**Then** a skeleton pulse is displayed with "Nerin is writing..." label
**And** the client polls GET /api/portrait/:sessionId/status every 2s
**And** polling stops on "ready", "failed", or "none"

**Given** portrait generation completes
**When** status returns "ready"
**Then** the full portrait renders via the Portrait Spine Renderer
**And** the spine renderer accepts {emoji, title, subtitle?, paragraphs[]}[] with highlight spans for evidence links
**And** the portrait is displayed in an immersive reading mode via ?view=portrait URL param
**And** a back button returns to the results grid

**Given** portrait generation fails
**When** the user sees the failure state
**Then** a retry button is displayed (no re-charge)
**And** the error is non-blocking — the rest of the results page remains functional

### Story 3.6: Portrait Reconciliation & Retry

As a user,
I want my portrait to be generated even if my browser closed during payment,
So that I never pay without receiving my portrait.

**Acceptance Criteria:**

**Given** a portrait_unlocked purchase event exists for a user
**When** the results page loads and no portrait row exists in the database
**Then** the reconcile-portrait-purchase use-case auto-inserts a placeholder row with content: null
**And** a forkDaemon is spawned for portrait generation

**Given** a portrait placeholder row exists with content: null
**When** the staleness threshold is exceeded (>5 minutes) and retries remain
**Then** the lazy retry mechanism spawns a new generation daemon
**And** the UPDATE ... WHERE content IS NULL constraint ensures only one daemon's result is written (idempotency)

**Given** portrait generation ultimately fails after all retries
**When** the user views the portrait section
**Then** the user is informed that generation failed (FR27)
**And** a manual retry option is available

### Story 3.7: Archetype Card Image Generation

As the system,
I want to generate static archetype card images for all 81 archetypes,
So that social previews and OG tags display compelling personality cards.

**Acceptance Criteria:**

**Given** the 81 archetypes in the registry
**When** archetype card images are generated
**Then** each card contains: archetype name, short description (1-2 sentences), GeometricSignature, and OCEAN code (FR46)
**And** cards are generated server-side via Satori (SVG) + @resvg/resvg-js (PNG)
**And** one card per archetype — generic, not personalized (users with the same archetype share the same visual)

**Given** cards need to serve multiple contexts
**When** images are generated
**Then** two formats are produced: 1.91:1 (1200x630px for OG link previews) and 9:16 (1080x1920px for social stories)

**Given** the GeometricSignature component
**When** rendered for card generation
**Then** SVG path only is used — no CSS transforms (must render in both DOM and Satori)

### Story 3.8: Basic Share & Credit System

As a user,
I want to share a link to my results and see how many relationship credits I have,
So that I can show friends what I discovered and know what I can do next.

**Acceptance Criteria:**

**Given** a user is on their results page
**When** they tap the share action
**Then** a shareable URL is copied to clipboard
**And** Web Share API is used where available, with manual copy fallback

**Given** a user has purchase events
**When** their available credits are computed
**Then** available = COUNT(free_credit_granted + credit_purchased) units − COUNT(credit_consumed)
**And** credits are derived at read time from purchase_events — never stored as mutable state (FR38)

**Given** the credits display on the results page
**When** the user views it
**Then** the current credit balance is visible
**And** a CTA to purchase additional credits (€5 each) is available via embedded checkout (FR48)

---

## Epic 4: Public Profile & Sharing

Users can share their personality with the world via a public profile page with social previews, shareable links, and a CTA for others to start their own assessment.

### Story 4.1: Public Profile Page

As a visitor,
I want to view someone's personality profile as a compelling story scroll,
So that I understand who they are and feel inspired to discover my own personality.

**Acceptance Criteria:**

**Given** a user has set their profile to "Public"
**When** a visitor (authenticated or anonymous) navigates to their profile URL
**Then** a 5-section story scroll is rendered: hero (archetype name, GeometricSignature, "[Name] dove deep with Nerin — here's what surfaced") → radar chart → trait bands → archetype description → CTA (FR39)
**And** the page is server-rendered via TanStack Start with LCP <1s (NFR2)
**And** the page is accessible without authentication (FR42)

**Given** the public profile page
**When** rendered on mobile (<640px)
**Then** sections stack vertically with full-width components
**And** all interactive elements meet 44px minimum tap targets

**Given** the public profile includes a CTA
**When** a visitor without their own assessment views the page
**Then** a CTA to start their own assessment is displayed (FR43)

**Given** a user's profile is set to "Private"
**When** anyone navigates to their profile URL
**Then** they receive a 404 response with no profile data exposed

### Story 4.2: OG Meta Tags & Social Preview

As a user,
I want my shared profile link to show a rich social preview with my archetype card,
So that the link looks compelling when shared on social media or messaging apps.

**Acceptance Criteria:**

**Given** a public profile URL is shared
**When** a social platform or messaging app fetches the OG tags
**Then** dynamic OG meta tags are generated: og:title (archetype name), og:description (short archetype description), og:image (archetype card image from Epic 3) (FR41)
**And** the OG image is the 1.91:1 format (1200x630px)

**Given** OG images are requested
**When** the server responds
**Then** images are served with 24h cache and stale-while-revalidate headers

**Given** OG image generation fails
**When** the fallback is triggered
**Then** text-only OG tags are returned with archetype name still visible

### Story 4.3: Share Flow & Visibility Toggle

As a user,
I want to instantly share my profile link and be prompted to make it public if needed,
So that sharing is frictionless and I control my visibility at the moment it matters.

**Acceptance Criteria:**

**Given** a user taps the share action on their results page or profile
**When** their profile is already "Public"
**Then** the share flow triggers immediately via Web Share API where available, with copy-to-clipboard fallback (FR44)

**Given** a user taps the share action
**When** their profile is currently "Private"
**Then** a prompt appears: "Make your profile public so friends can see your archetype when they tap your link?" with Accept and Decline options
**And** if accepted, the profile is toggled to "Public" and the share flow proceeds immediately
**And** if declined, the share is cancelled and the profile remains private

**Given** the share flow completes
**When** the link is copied or shared
**Then** the shareable URL points to the user's public profile page

### Story 4.4: Relationship Analysis CTA on Public Profile

As a logged-in user with a completed assessment,
I want to see an invitation to discover my dynamic with the profile owner,
So that I can initiate a relationship analysis with someone I care about.

**Acceptance Criteria:**

**Given** a logged-in user with a completed assessment views another user's public profile
**When** the profile renders
**Then** a relationship analysis CTA is displayed: "You care about [Name]. Discover your dynamic together." (FR45)
**And** a brief explanation of the QR flow is included

**Given** an anonymous visitor or a user without a completed assessment views a public profile
**When** the profile renders
**Then** the relationship analysis CTA is not displayed
**And** only the standard "Start your own assessment" CTA is shown

**Given** the profile owner is viewing their own public profile
**When** the profile renders
**Then** the relationship analysis CTA is not displayed

---

## Epic 5: Relationship Analysis — QR & Credits

Users can initiate a relationship analysis via QR code. The other person scans, accepts, and credits are consumed.

### Story 5.1: QR Token Infrastructure

As the system,
I want to manage QR tokens with lifecycle controls,
So that relationship analysis initiation is secure, time-bound, and reliable.

**Acceptance Criteria:**

**Given** a user initiates a relationship analysis
**When** a QR token is generated
**Then** a row is inserted into relationship_qr_tokens with: token (UNIQUE), user_id, expires_at (6h TTL), status (active), accepted_by_user_id (null)
**And** the token contains a URL that routes to the accept screen

**Given** an active QR token exists
**When** 1 hour has passed since generation
**Then** the token is auto-regenerated with a fresh 6h TTL
**And** the previous token is expired

**Given** a client polls GET /qr/:token/status
**When** the token is checked
**Then** the response returns one of: valid, accepted, or expired
**And** polling interval is every 60s

**Given** User B accepts a QR token
**When** the accept is processed
**Then** the token status is set to "accepted" and accepted_by_user_id is recorded
**And** the token is invalidated (no further accepts possible)

**Given** User B refuses a QR token
**When** the refusal is processed
**Then** the token remains active (can be scanned by someone else)
**And** no notification is sent to the initiator

### Story 5.2: QR Drawer UI

As a user,
I want to open a QR drawer and show my QR code to someone,
So that I can invite them to discover our relational dynamic together.

**Acceptance Criteria:**

**Given** a user with a completed assessment and available credits
**When** they open the QR drawer (from results page or dashboard)
**Then** a QR code is rendered via qrcode.react
**And** the QR code encodes a URL pointing to the accept screen with the token
**And** a shareable URL is displayed alongside the QR for manual sharing

**Given** the QR drawer is open
**When** the token approaches its hourly regeneration
**Then** the QR code and URL auto-update without user action

**Given** the QR drawer is open
**When** the token is accepted by another user
**Then** the drawer updates to reflect the accepted state (via status polling)

**Given** a network error occurs in the QR drawer
**When** token generation or polling fails
**Then** the drawer closes with a toast notification
**And** the error does not affect other page functionality

### Story 5.3: QR Accept Screen & Consent Gate

As a user who scanned a QR code,
I want to see who invited me and decide whether to proceed,
So that I give informed consent before a relationship analysis is generated.

**Acceptance Criteria:**

**Given** a user scans a QR code or opens the contained URL
**When** they are not logged in or don't have a completed assessment
**Then** they are redirected to sign up / complete their assessment first
**And** after completion they are routed back to the accept screen (FR37)

**Given** a logged-in user with a completed assessment opens the accept screen
**When** the token is valid
**Then** the screen displays: initiator's archetype card, both users' confidence rings, the scanner's available credit balance, and Accept and Refuse buttons (FR30)
**And** no raw conversation transcripts or individual vulnerability data are exposed (NFR13)

**Given** User B taps "Accept"
**When** the acceptance is processed
**Then** one relationship credit is consumed from the accepting user's balance
**And** the QR token is invalidated
**And** both users are routed to the relationship analysis generation flow (Epic 6)

**Given** User B taps "Refuse"
**When** the refusal is processed
**Then** User B is redirected away from the accept screen
**And** the token remains active for other potential scans
**And** no notification is sent to the initiator

**Given** the QR token has expired
**When** a user opens the accept screen URL
**Then** an expired state is displayed with a message to ask the initiator for a new QR code

---

## Epic 6: Relationship Analysis — Generation & Display

Both users receive a generated relationship analysis after a ritual moment, with email notification and version management.

### Story 6.1: Ritual Suggestion Screen

As a user,
I want to share a meaningful moment with the other person before reading our analysis,
So that we approach the relationship insights with intention and presence.

**Acceptance Criteria:**

**Given** User B has accepted the QR token
**When** both users are routed to the ritual flow
**Then** both devices receive a synchronous notification that the ritual is beginning
**And** a ritual suggestion screen is displayed on both devices (FR31)
**And** the ritual entrance animation plays (600ms) respecting prefers-reduced-motion

**Given** the ritual screen is displayed
**When** both users are viewing it
**Then** Nerin speaks directly to both users with a brief framing message
**And** the screen presents a suggested ritual activity for the pair

**Given** the ritual screen
**When** the user is ready to proceed
**Then** a "Continue" action transitions to the analysis display (or generating state)
**And** the analysis fade animation plays (400ms) respecting prefers-reduced-motion

**Given** the synchronization mechanism
**When** one user's device loses connectivity
**Then** the ritual screen still displays locally
**And** the user can proceed independently without being blocked by the other device

### Story 6.2: Relationship Analysis Generation

As the system,
I want to generate a relationship analysis comparing two users' personality evidence,
So that both users receive insights about their relational dynamics.

**Acceptance Criteria:**

**Given** a QR token has been accepted and credit consumed
**When** the analysis generation begins
**Then** a placeholder row is inserted into relationship_analyses with content: null, user_a_result_id, and user_b_result_id FKs (FR29)
**And** a forkDaemon is spawned for generation

**Given** the Sonnet agent generates the analysis
**When** both users' conversation evidence is provided
**Then** the analysis describes relational dynamics using complementary framing — dynamics not deficits (FR32)
**And** no blame language is used
**And** no individual vulnerability data is exposed (NFR13)
**And** no raw conversation transcripts are shared with the other party

**Given** generation completes
**When** the daemon writes the result
**Then** UPDATE ... WHERE content IS NULL ensures idempotency
**And** the analysis content follows the spine format: {emoji, title, subtitle?, paragraphs[]}[]

**Given** generation fails or stalls
**When** staleness threshold is exceeded (>5 min) and retries remain
**Then** lazy retry spawns a new daemon
**And** if generation ultimately fails, both users see a failure state with retry option

### Story 6.3: Relationship Analysis Display

As a user,
I want to read the relationship analysis in a rich, immersive format,
So that I understand the dynamics between us in a meaningful way.

**Acceptance Criteria:**

**Given** the relationship analysis is generating
**When** the user views the analysis page
**Then** a loading state with skeleton pulse is displayed
**And** the client polls relationship status every 5s
**And** polling stops on "ready" or "failed"

**Given** the analysis is ready
**When** the page renders
**Then** the analysis content renders via the Portrait Spine Renderer (reused from Epic 3)
**And** a dual-polygon radar chart is displayed: solid stroke for user A, lighter/dashed for user B, tooltip shows both scores on hover
**And** both users' archetype cards and confidence rings are shown

**Given** the analysis display on mobile
**When** viewport is <640px
**Then** the layout stacks appropriately
**And** radar chart and comparison elements remain readable

**Given** a screen reader encounters the analysis
**When** the radar chart renders
**Then** role="img" with aria-label is set and a data table fallback shows both users' scores

### Story 6.4: Version Management & Cascade Deletion

As a user,
I want to see all my relationship analyses with the newest marked as primary,
So that I can track how my relationships evolve over time.

**Acceptance Criteria:**

**Given** a user has multiple relationship analyses
**When** the analyses are fetched
**Then** version detection is derive-at-read: if newer assessment results exist for either user since the analysis was generated, it is classified as "previous version" (FR35)
**And** the newest analysis for each relationship pair is marked as primary
**And** users can view all their analyses including previous versions

**Given** version classification
**When** the isLatestResult utility is called
**Then** it compares the analysis's result_id against the latest result_id for each user
**And** the same utility is used for both portrait and relationship analysis versioning

**Given** one user deletes their account
**When** the deletion cascade runs
**Then** all shared relationship analyses involving that user are deleted (FR34)
**And** the deletion hook registered in Epic 1 is triggered

**Given** a user views their relationship analyses list
**When** previous versions exist
**Then** they are clearly labeled as "previous version" and visually distinguished from the primary analysis

### Story 6.5: Relationship Analysis Email Notification

As a user,
I want to be notified by email when a relationship analysis I participated in is ready,
So that I know to come back and read it.

**Acceptance Criteria:**

**Given** a relationship analysis generation completes successfully
**When** the content is written to the database
**Then** both participating users receive an email notification (FR36)
**And** the email is delivered within 5 minutes of completion with >95% delivery rate (NFR27)

**Given** the email is sent
**When** it is composed
**Then** it uses the Resend infrastructure and React Email templates from Epic 2
**And** the email is fire-and-forget — delivery failure does not affect the analysis or user experience

**Given** the email content
**When** the user reads it
**Then** it includes a direct link to view the analysis
**And** it does not expose analysis content or personality data in the email body

---

## Epic 7: Conversation Extension

Users can purchase an extension to continue their conversation with Nerin for another 25 exchanges, generating updated results and a new portrait.

### Story 7.1: Conversation Extension Purchase & Session Creation

As a user,
I want to purchase a conversation extension to continue exploring with Nerin,
So that I can go deeper and discover more about myself.

**Acceptance Criteria:**

**Given** a user has completed their 25-exchange conversation
**When** they choose to purchase a conversation extension
**Then** the embedded checkout opens via Polar for the extension product (FR10, FR49)

**Given** the extension purchase webhook fires
**When** an extended_conversation_unlocked purchase event is recorded
**Then** the activate-conversation-extension use-case creates a new assessment_session row
**And** the new session has a parent_session_id FK linking to the original session (FR25)
**And** the user is routed to /chat with the new session

**Given** a user has not purchased an extension
**When** they attempt to start an extended conversation
**Then** they are directed to the extension purchase flow

### Story 7.2: Extended Conversation Pipeline Initialization

As a user,
I want my extended conversation to feel like a natural continuation,
So that Nerin builds on what we already explored together.

**Acceptance Criteria:**

**Given** a new extension session is created
**When** the pacing pipeline initializes
**Then** the session starts at exchange 1 of 25 (fresh 25-exchange arc)
**And** the prior session's final user state is loaded: smoothed energy, comfort, drain, drain ceiling (FR25)
**And** all prior evidence is loaded for coverage computation in the territory scorer

**Given** Nerin's prompts are constructed for the extension session
**When** the Common prompt layer references prior context
**Then** Nerin references "themes and patterns" from prior evidence
**And** Nerin does NOT reference specific exchanges or quote the user's prior words

**Given** the territory scorer runs in the extension session
**When** coverage gaps are computed
**Then** evidence from both the original and extension sessions contributes to coverage
**And** the scorer naturally steers toward under-explored territories

### Story 7.3: Extended Results & Portrait Versioning

As a user,
I want updated personality results after my extended conversation,
So that my deeper exploration produces a more refined understanding of who I am.

**Acceptance Criteria:**

**Given** the extension conversation reaches exchange 25
**When** the closing exchange completes
**Then** new assessment results are generated from combined evidence across both the original and extension sessions (FR25)
**And** facet scores are recomputed from ALL evidence records (original + extension) — not just the extension session
**And** trait scores, OCEAN code, and archetype are derived at read time from the combined facet scores

**Given** new assessment results exist
**When** the user views their results page
**Then** the new results are displayed as primary
**And** the prior portrait is classified as "previous version" via result_id comparison (FR23)
**And** any relationship analyses based on prior results are classified as "previous version" (FR25)

**Given** the user has new results from an extension
**When** they view the portrait section
**Then** the portrait shows the "Unlock your portrait" CTA (repurchase required)
**And** purchasing generates a new portrait incorporating observations from the extended evidence not present in the original (FR23)

**Given** the user views their history
**When** previous versions exist
**Then** prior results and portrait are accessible as "previous version" entries

---

## Epic 8: Homepage & Acquisition Funnel

New visitors experience a compelling homepage that introduces big-ocean's value proposition and drives them to start their own assessment.

### Story 8.1: Homepage Narrative & Layout

As a new visitor,
I want to experience a compelling introduction to big-ocean,
So that I understand the value and feel drawn to start my own conversation with Nerin.

**Acceptance Criteria:**

**Given** a visitor navigates to the homepage
**When** the page renders
**Then** a 14-beat conversational narrative scroll is displayed
**And** the page is server-rendered via TanStack Start with LCP <2.5s
**And** static content is readable immediately (TTI <3s, progressive hydration)

**Given** the homepage on mobile (<640px)
**When** the user scrolls past the hero section
**Then** a sticky bottom CTA appears styled as a chat input box, inviting the user to start their conversation
**And** all interactive elements meet 44px minimum tap targets

**Given** the homepage on desktop (>=1024px)
**When** the user scrolls through the narrative
**Then** a scroll-driven depth meter tracks progress through the 14 beats
**And** the sticky bottom chat input CTA is visible
**And** the depth meter uses CSS transitions respecting prefers-reduced-motion

**Given** a visitor interacts with the chat input CTA
**When** they tap or click it
**Then** they are routed to the auth flow which redirects to /chat after login/signup

**Given** the homepage layout
**When** dynamic content loads
**Then** CLS <0.1 is maintained via fixed layout slots and reserved heights

### Story 8.2: Founder Portrait Bridge & Relationship CTA

As a new visitor,
I want to see a real portrait excerpt and understand the relationship analysis feature,
So that I feel the emotional weight of the product and see its social dimension.

**Acceptance Criteria:**

**Given** the homepage narrative includes the founder portrait bridge
**When** the section renders
**Then** Vincent's personal portrait excerpt is displayed as a real artifact, not a product demo
**And** the voice is dense (3-4 sentences), personally vulnerable, love letter tone

**Given** the homepage narrative includes the relationship analysis section
**When** the section renders
**Then** a CTA for relationship analysis is prominently featured
**And** it communicates the value of discovering relational dynamics with someone you care about
**And** it explains the QR-based flow briefly

**Given** a visitor clicks the relationship analysis CTA
**When** they are not authenticated
**Then** they are routed to the auth flow, then directed to complete their own assessment first

---

## Epic 9: Engagement Emails & Dashboard

The system sends check-in and recapture emails. Users can view a centralized dashboard with results, portrait, relationship analyses, and behavioral impact metrics.

### Story 9.1: Nerin Check-in Email

As a user who completed their assessment,
I want to receive a personal check-in from Nerin a couple weeks later,
So that the experience has a lasting emotional resonance beyond the initial session.

**Acceptance Criteria:**

**Given** a user completed their assessment ~2 weeks ago
**When** the check-in threshold is reached
**Then** a Nerin-voiced email is sent referencing a tension or theme from the user's conversation
**And** the last territory is derived from the final assessment_exchange.selected_territory

**Given** the check-in email
**When** it is composed
**Then** it uses Nerin's voice: warm, curious, never clinical
**And** it includes a link back to the user's results page
**And** it does not expose specific personality scores or evidence in the email body

**Given** the check-in email for a specific user
**When** it has already been sent once
**Then** no additional check-in emails are sent for that assessment session (one-shot only)

**Given** the email sending
**When** delivery is attempted
**Then** it uses the Resend infrastructure and React Email templates from Epic 2
**And** it is fire-and-forget — delivery failure is logged but does not affect any other system behavior

### Story 9.2: Deferred Portrait Recapture Email

As a user who skipped the PWYW modal,
I want to be reminded that Nerin wrote something for me,
So that I have another chance to unlock my portrait.

**Acceptance Criteria:**

**Given** a user completed their assessment but has no portrait_unlocked purchase event
**When** a configured number of days have passed since assessment completion
**Then** a recapture email is sent: "Nerin's portrait is waiting for you"

**Given** the recapture email
**When** it is composed
**Then** it includes a direct link to the results page (which shows the "Unlock your portrait" CTA)
**And** it uses a warm, inviting tone consistent with Nerin's voice
**And** it does not expose personality data in the email body

**Given** the recapture email for a specific user
**When** it has already been sent once
**Then** no additional recapture emails are sent for that session (one-shot only)

**Given** a user has since purchased their portrait
**When** the recapture email trigger fires
**Then** the email is not sent

### Story 9.3: Dashboard

As a user,
I want a centralized view of everything I've discovered about myself and my relationships,
So that I can easily navigate between my results, portrait, and relationship analyses.

**Acceptance Criteria:**

**Given** a logged-in user navigates to their dashboard
**When** the page renders
**Then** it displays: results summary (archetype, OCEAN code, GeometricSignature), portrait status (locked/generating/ready), relationship analyses list (primary and previous versions), and credit balance (FR19)

**Given** the dashboard displays relationship analyses
**When** the user has multiple analyses
**Then** each analysis shows the other user's archetype card, version status (primary/previous), and a link to view the full analysis

**Given** the dashboard tracks behavioral impact metrics
**When** the metrics are computed
**Then** share rate, conversation extension purchase rate, and return visits within 48 hours are tracked (FR24)
**And** metrics are displayed in a way meaningful to the user (not raw numbers)

**Given** the dashboard on mobile
**When** viewport is <640px
**Then** sections stack vertically with clear navigation between content types
**And** all interactive elements meet 44px minimum tap targets

**Given** the dashboard
**When** the user has no portrait or relationship analyses yet
**Then** empty states use warm tone with ocean metaphors and a clear next step CTA (no dead ends)
