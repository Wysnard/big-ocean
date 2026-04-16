---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# big-ocean - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for big-ocean, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

**Context:** Brownfield project — hexagonal architecture, auth, CI/CD, Railway deployment, Drizzle migrations, Effect-ts HTTP API, Better Auth, Polar plugin already built. The focus is completing the MVP: three-space product world (Today/Me/Circle), 15-exchange assessment → portrait focused reading → daily silent journal → Sunday weekly letter → relationship letter → Circle + invite ceremony → subscription flow (conversation extension + first portrait regen) → homepage conversion.

**Business model (MVP):** Free assessment + portrait + relationship letter + daily journal + weekly letter. Subscription €9.99/mo unlocks conversation extension (+15 exchanges) + bundled first-extension portrait regeneration. All other paid features are post-MVP.

**Post-MVP items (not epicked here):** FR23a (subsequent portrait regens), FR32a (Section D relational observations), FR35a (annual letter regeneration), FR69/FR69a (daily LLM recognition + mini-dialogue), FR74 (portrait gallery), FR75 (confidence milestone notifications), FR88 (prescriptive weekly letter layer), Coach/Career/Relationship agents.

## Requirements Inventory

### Functional Requirements

FR1: Users can have a 15-exchange adaptive conversation with Nerin
FR2: Nerin responds using ocean/marine metaphors and dive master persona
FR3: The Director model steers Nerin's territory focus, observation type, and entry pressure each turn (evidence extraction → coverage analysis → Nerin Director → Nerin Actor)
FR4: Users can see a depth meter reflecting the conversation's progress
FR5: Users receive progress milestone markers at 25%, 50%, and 75% of the conversation
FR6: Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait (≥2 specific pattern observations per conversation)
FR7: Nerin frames observations as invitations to explore — acknowledges pushback, offers alternative framing, redirects only on second rejection
FR8: Nerin includes a "this is not therapy" framing in the greeting
FR9: Nerin never uses diagnostic language or characterizes third parties
FR10: (Subscription — MVP) Subscribers can extend their conversation (+15 exchanges) to continue with Nerin
FR11: Users can resume an abandoned conversation from where they left off
FR12: The conversation ends with a distinct closing exchange from Nerin before transitioning to results
FR13: Nerin transitions between territories using connecting observations when Director changes territory
FR14: The system extracts facet evidence and energy signals from each user response via the extraction pipeline
FR15: The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
FR16: Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the Me identity surface (session-scoped `/me/$conversationSessionId`)
FR17: The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
FR18: The system presents all archetypes with positive, strength-based framing
FR19: Authenticated users navigate the product through a three-space bottom navigation model — Today / Me / Circle. No /dashboard route. /settings via gear icon on Me
FR20: The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM
FR21: Users receive their portrait for free immediately after completing the assessment (not gated by subscription/payment)
FR22: Users can view their portrait immediately after generation
FR22a: One portrait is generated per assessment result — free, no purchase required
FR23: (Subscription — MVP) First conversation extension per subscriber automatically generates a new portrait at no additional cost
FR24: The system records share events and return-visit timestamps per portrait for internal analytics/ops — not user-facing dashboard metrics (PRD 2026-04-16)
FR25: (Subscription — MVP) Conversation extension creates a new assessment session. Director model initializes from prior session's final state and evidence
FR26: Portrait generation is asynchronous — users are notified when ready
FR27: The system retries portrait generation up to 3 times with exponential backoff (5s, 15s, 45s)
FR28: Users can initiate a relationship letter by opening a QR drawer from the Circle page invite ceremony
FR29: The relationship letter page is a living relational space with sections: This Year's Letter, Where You Are Right Now (real-time data grid), Letter History, Your Next Letter, Things You've Learned About Each Other
FR29a: The relationship letter is generated once when both users complete their assessments (single LLM call)
FR30: QR accept screen shows initiator's name, Accept/Refuse buttons, and data-sharing disclaimer with ongoing consent
FR31: Users see a ritual suggestion screen before accessing the relationship letter for the first time
FR32: The relationship letter describes relational dynamics without blame language and without exposing individual vulnerability data
FR33: Relationship letters are free and unlimited
FR34: If one user deletes their account, the shared relationship letter is deleted
FR35: Each relationship letter is linked to both users' assessment results. MVP ships single static letter per relationship
FR36: Users receive a notification when a relationship letter is ready
FR37: QR accept screen only accessible to logged-in users with a completed assessment
FR39: Users have a public profile page showing archetype, OCEAN code, trait/facet scores, and framing line
FR40: Public profiles are default-private; users can explicitly make them public (binary visibility)
FR41: Public profiles generate dynamic OG meta tags and archetype card images for social preview
FR42: Public profiles are accessible without authentication
FR43: Public profiles include a CTA to start the user's own assessment
FR44: Users can copy a shareable link to their public profile
FR45: When logged-in user with assessment views another's profile, relationship CTA is displayed
FR46: The system generates archetype card images per archetype (81 cards)
FR47: Users can subscribe at €9.99/mo via Polar embedded checkout (conversation extension + first-extension portrait regen in MVP)
FR49: (Subscription — MVP) Subscribers have unlimited conversation extensions as part of their subscription
FR50: Users can create an account with email and password. Account creation triggers verification email. Unverified accounts treated as unauthenticated
FR50a: Verification email contains unique link expiring after 1 week
FR50b: Users can request a new verification email
FR51: Users can control visibility of their public profile (binary: fully public or fully private)
FR52: Users are informed during onboarding that conversation data is stored
FR53: Users can delete their account, which cascades to all data and shared relationship analyses
FR54: Users are introduced to Nerin and conversation format before conversation begins (pre-conversation onboarding)
FR55: The system monitors per-session LLM costs against budget thresholds
FR56: The cost guard never blocks a user mid-session; budget protection applies at session boundaries
FR57: When cost guard triggers, users see "temporarily unavailable" message with retry after configurable cooldown
FR58: Users are informed when cost guard triggers and told they can retry
FR59: Homepage above-the-fold: single-sentence value proposition, visual hint of output quality, one primary CTA
FR60: Homepage headline communicates transformation promise with ongoing value. No words "test," "quiz," "assessment"
FR61: Homepage has one primary CTA to start assessment. No competing secondary CTAs
FR62: Homepage surfaces concrete portrait excerpt within first 40% of scroll depth
FR63: Homepage includes Nerin conversation preview showing character depth and perceptiveness
FR64: Homepage three content blocks addressing visitor concerns (process anxiety, time commitment, self-exposure)
FR65: Homepage surfaces free assessment + portrait transparency before CTA
FR66: Homepage supports four entry motivations without branching
FR67: Users can perform a daily check-in on Today page (personality-typed prompt, 5-option mood, optional note, note visibility selector)
FR68: Daily check-in saves to mood calendar, renders journal format, zero LLM calls, <500ms render
FR68a: Weekly anticipation line displayed when user has checked in this week and it's not yet Sunday
FR70: Users can view a mood calendar showing check-in history
FR71: Users choose note visibility per check-in: Private (default), Inner circle, Public pulse (post-MVP)
FR72: Mood check-in data visible only to user by default. Note text never exposed across users
FR73: Each portrait stored as versioned snapshot with confidence level, creation date, linked assessment result
FR76: Three lifecycle transactional emails: drop-off re-engagement, Nerin check-in, subscription conversion nudge
FR77: Notification email within 5 minutes when relationship letter is ready
FR78: Public knowledge library of SSR articles (archetype definitions, trait/facet explainers, Big Five science, relationship/career guides)
FR79: Each archetype definition page with name, description, strengths, growth areas, compatible archetypes, CTA
FR80: Trait and facet explainer pages
FR81: Big Five science articles
FR82: Relationship and career guide pages
FR83: Knowledge library pages in sitemap with Schema.org structured data
FR84: `/about` founder story block with real portrait excerpt + first-person statement (not on homepage — UX-DR39)
FR85: Homepage "beyond the portrait" self-care teaser
FR86: Weekly summary generated every Sunday 6pm local for users with ≥3 check-ins
FR87: Weekly summary is LLM-generated letter from Nerin in letter format. Free version must feel complete
FR89: Push notification at weekly summary generation time. Email fallback. Inline card on Today
FR90: Weekly summary at dedicated focused reading route /today/week/$weekId
FR91: Free weekly summary ends with soft conversion CTA in Nerin's voice
FR92: Edge cases: 0-2 check-ins → no summary; mid-week subscribe → full version; cancelled → subscriber version until billing end
FR93: Post-assessment closing: input fades, "Show me what you found →" → navigate to `/me/$conversationSessionId?view=portrait`
FR94: Portrait reading view with generating state (OceanSpinner + Nerin-voiced line)
FR95: End of portrait reading: warm link "There's more to see →" → `/me/$conversationSessionId` (full Me surface for that session)
FR96: First Me page visit: return seed in Nerin's voice + notification permission request
FR97: Circle page: full-width person cards with archetype, OCEAN code, duration, "last shared" signal, "View your dynamic" link
FR98: Circle enforces Intimacy Principle: no counts, no follower language, no sorting, no search
FR99: Invite ceremony dialog with reward-first copy
FR100: Invite placement: Me page, Circle page, public profile CTA, weekly letter relational beat
FR101: Post-assessment: focused reading `/me/$conversationSessionId?view=portrait` then full Me `/me/$conversationSessionId` (FR93–FR95); afterward users navigate freely; /today is primary daily return surface
FR102: Three-space bottom nav (Today / Me / Circle). /dashboard removed. /chat outside three-space
FR103: Public profile separate from authenticated Me page

### NonFunctional Requirements

NFR1: Nerin response time <2s P95
NFR2: Public profile page LCP <1s
NFR3: Me / post-assessment identity surface LCP <1.5s
NFR4: Chat page initial load <2s, subsequent interactions <200ms
NFR5: Portrait generation completes within 60s (async)
NFR6: Per-assessment LLM cost ~€0.30
NFR7: Per-portrait LLM cost ~€0.20-0.40
NFR7a: Free-tier ongoing cost ~$0.02-0.08/user/month. Subscriber ongoing ~$0.35-0.75/month (93-97% margin)
NFR7b: Cost ceiling: per-user token budgets, hard caps, circuit breaker >3x weekly-letter cost in 24h
NFR8: All data in transit encrypted via TLS 1.3
NFR9: Authentication requires 12+ character passwords and compromised credential checks
NFR9a: Unverified accounts cannot access any authenticated route
NFR9b: Verification email links expire after 1 week
NFR10: Row-level data access control
NFR11: Public profiles default to private
NFR12: Conversation transcripts stored indefinitely, retrievable within 2s
NFR13: Relationship analysis data does not expose raw conversation transcripts
NFR14: Account deletion cascades to all user data and shared relationship analyses
NFR15: Assessment completion without errors >99%
NFR16: Portrait generation completes successfully >99%
NFR17: Portrait generation retries automatically on failure
NFR18: Cost guard never terminates active session
NFR19: Conversation sessions resumable after browser close or connection loss
NFR20: WCAG 2.1 AA compliance for public profile, conversation UI, Me page and session-scoped identity views (including post-assessment trait and evidence UI), subscription modal
NFR21: Chat interface keyboard-navigable with proper ARIA labels
NFR22: Score visualizations have text alternatives
NFR23: Ocean theme color palette meets AA contrast ratios
NFR24: Proper focus management in modals
NFR25: Embedded checkout integration for subscription billing
NFR26: System can switch LLM providers without code changes
NFR27: Transactional email delivery >95%, relationship notifications <5 min
NFR28: System logs include per-session cost, completion status, and error events
NFR29: Personality scores always recomputed from current facet evidence at read time

### Additional Requirements

From Architecture document:

- Brownfield project — hexagonal architecture, auth, CI/CD, Railway deployment, Drizzle, Effect-ts, Better Auth already built. No starter template needed
- Three-stage portrait pipeline (ADR-51): Spine Extractor (Sonnet + thinking) → Spine Verifier (Haiku) → Prose Renderer (Sonnet). Brief-only contract at Stage C
- UserSummary as living cross-cutting asset (ADR-55): rolling regeneration on assessment completion, extension completion, subscriber chat, monthly check-in aggregation. Canonical input for all Nerin LLM surfaces
- UserSummary Generator (Haiku): themed summary + verbatim quoteBank ≤50 entries. Fatal on first gen, non-fatal on refreshes
- Subscriber Nerin chat sessions (ADR-56): 15-turn Director/Actor with UserSummary injection, triggers portrait + summary refresh
- Direct Anthropic SDK for portrait calls (ADR-53) — LangChain carve-out
- Portrait observability + quality rubric (ADR-54): structured logging, eval harness, automated rubric scoring
- Coverage analyzer is facet-first (ADR-30): primaryFacet + candidateDomains + phase. steeringSignal = log1p(totalMass) × effectiveDomains
- ConversAnalyzer sequential before Director (3-call path: evidence → Director → Actor)
- Three-tier extraction fail-open (ADR-20): strict ×3 → lenient ×1 → neutral defaults
- Queue-based fire-once for portraits (Effect Queue + worker fiber). Placeholder-row + forkDaemon for relationship letters
- Polar as Better Auth plugin (ADR-8). Customer creation on signup. Subscription events: started/renewed/cancelled/expired
- Append-only purchase_events. Subscription status derived at read time. No subscriptions table
- Subscription entitlement via isEntitledTo(userId, feature) — use-case level, not middleware
- Silent daily journal: zero LLM calls on check-in (ADR-44). New daily_check_ins table
- Weekly letter pipeline (ADR-45): per-user cron Sunday 6pm local. Reads UserSummary + week check-ins. New weekly_summaries table
- Post-assessment focused reading transition (ADR-46): generating state → letter fade-in → "There's more to see →"
- Three-space navigation (ADR-43): Today/Me/Circle bottom nav. /dashboard removed. Assessment completion reveals /me once, then users navigate freely with /today as the primary daily return surface
- Nerin Output Grammar (ADR-48): three visual registers (journal/letter/chat), each with own prompt composition
- Knowledge library SSR (ADR-49): static generation, Schema.org structured data
- Cost ceiling (ADR-50): per-user token budgets, global free-tier circuit breaker, >3x threshold triggers rate limiting
- Email infrastructure (ADR-12): Resend + React Email. 3 transactional types + weekly letter email fallback
- Conversation extension model (ADR-11): new session with parent_session_id FK. Director re-initializes from prior evidence
- Dashboard route retired: 301 redirect /dashboard → /today
- Deprecated components to remove: ChatAuthGate, PortraitUnlockButton, PWYWCurtainModal, CreditBalance, InvitationBottomSheet, PortraitWaitScreen, RelationshipCreditsSection
- New DB tables needed: daily_check_ins, weekly_summaries, user_summaries
- New API endpoints: /api/today/check-in, /api/today/week, /api/today/prompt, /api/today/library-article, subscription status

### UX Design Requirements

UX-DR1: Split-layout homepage architecture — scrollable timeline left (60%), sticky auth panel right (40%) on desktop. Three visual phases (Conversation/Portrait/World After) with distinct visual languages. Mobile: stacked layout with sticky bottom CTA
UX-DR2: Sticky auth panel with dynamic hook that changes per scroll phase (animated gradient keyword: SEES/CARRYING/STAYS/YOURS), signup form always in peripheral vision, "~30 min · Free · No credit card" tagline
UX-DR3: Homepage timeline Phase 1 (Conversation) — show real Nerin conversation excerpt demonstrating pattern observation, dark background echoing chat UI
UX-DR4: Homepage timeline Phase 2 (Portrait) — show real portrait paragraph in letter format, warm papery background
UX-DR5: Homepage timeline Phase 3 (World After) — show Today screen mockup, weekly letter card, relationship letter fragment, archetype carousel (horizontal swipe, 4-6 cards)
UX-DR6: Homepage reassurance section "Before you start" — three cards addressing process anxiety, time commitment, and self-exposure
UX-DR7: BottomNav component — persistent three-tab bottom navigation (Today / Me / Circle) for authenticated routes. Hidden on /chat and focused reading views. Desktop variant: top nav tabs
UX-DR8: CheckInForm component — Nerin-voiced prompt header, 5 large tappable mood emojis, optional note Textarea, note visibility selector, Save button disabled until mood selected
UX-DR9: JournalEntry component — renders mood + note in journal format (shared-page feel, NOT chat bubbles)
UX-DR10: MoodDotsWeek component — 7-dot grid showing week check-in history. No streak counter
UX-DR11: QuietAnticipationLine component — "Nerin will write you a letter about your week on Sunday"
UX-DR12: WeeklyLetterCard component — inline card on Today on Sundays when letter is ready
UX-DR13: WeeklyLetterReadingView component — shares shell with PortraitReadingView (max-width 720px, warm bg). Soft conversion CTA at bottom
UX-DR14: MePage composition — 7 sections: Identity Hero, Your Portrait, Your Growth (conditional), Your Public Face (NO view counts), Your Circle preview, Subscription pitch/value summary, Account gear → /settings
UX-DR15: CirclePersonCard component — full-width card with archetype, OCEAN code, duration, "last shared" signal, "View your dynamic" link
UX-DR16: InviteCeremonyDialog component — reward-first copy: promise → self-reflexive hook → reframe cost as gift → privacy promise → optional name → QR/link/share
UX-DR17: ReturnSeedSection component — Nerin-voiced return seed + notification permission request on first Me page visit
UX-DR18: Post-assessment transition flow: input fades → "Show me what you found →" → portrait reading → "There's more to see →" → full Me page
UX-DR19: PortraitReadingView generating state: OceanSpinner + "Nerin is writing your letter..." + letter fade-in
UX-DR20: Relationship letter page — 5 sections: Section A (letter with ritual entry), Section B (data grid), Section C (Letter History), Section D1 (shared notes), Section F (Your Next Letter anticipation)
UX-DR21: RitualScreen — "Read this together" + Start button. Subsequent visits bypass; "Read Together Again" re-enters
UX-DR22: GeometricSignature component — OCEAN code as 5 geometric shapes. Satori-compatible (SVG only, no CSS transforms). Sizes: hero/profile/card/mini
UX-DR23: OceanCodeStrand component — 5-letter OCEAN code with interactive tooltips. Keyboard navigable
UX-DR24: PortraitSpineRenderer component — portrait sections with emoji headers via react-markdown SSR
UX-DR25: Ghost subscriber section on Today — faint placeholder for paid features. Not clickable
UX-DR26: Conversation animation: deliberate delay before Nerin renders + CSS transition. Depth meter transitions with glow pulse on milestones
UX-DR27: All animations gated by prefers-reduced-motion. <5% CPU, transform/opacity only
UX-DR28: Loading: skeleton placeholders for known shapes. OceanSpinner for emotional waits. No generic spinners for letters
UX-DR29: Error boundaries at route composition level. Focused reading views have own boundary
UX-DR30: Responsive: Mobile single column + BottomNav. Tablet centered 640px. Desktop centered 720px + top nav
UX-DR31: Dashboard retirement: delete 9 components, 301 redirect, remove nav links, migrate data-testid prefixes
UX-DR32: Retired components to remove: ChatAuthGate, PortraitUnlockButton, PWYWCurtainModal, RelationshipCreditsSection, CreditBalance, InvitationBottomSheet, PortraitWaitScreen, QuickActionsCard, RelationshipCTA (credit variant)
UX-DR33: Framer Motion for homepage scroll-linked animations. AnimatePresence for hook cross-fade. CSS @keyframes for infinite loops
UX-DR34: New homepage components: StickyAuthPanel, StickyBottomCTA, TimelinePhase, PhaseTransition, ArchetypeCarousel, TodayScreenMockup, WeeklyLetterCard, RelationshipLetterFragment, DeeperConversationCallback, ReassuranceCards
UX-DR35: Retired homepage components: ConversationFlow, ComparisonCard, TraitStackEmbed, ComparisonTeaserPreview, ScrollIndicator, ChatInputBar (homepage), FounderPortraitExcerpt
UX-DR36: SubscriptionPitchSection on Me — Nerin-voiced pitch for free users. SubscriptionValueSummary for subscribers
UX-DR37: MoodCalendarView — full calendar from Me "Your Growth" section
UX-DR38: Need-positioning throughout homepage — recognition → relief → urgency → action
UX-DR39: Founder story moved from homepage to /about — FR84 deviation requiring PRD amendment

### FR Coverage Map

| FR | Epic | Notes |
|----|------|-------|
| FR1 | — | Already implemented (conversation engine) |
| FR2 | — | Already implemented (Nerin persona) |
| FR3 | — | Already implemented (Director model) |
| FR4 | — | Already implemented (depth meter) |
| FR5 | — | Already implemented (milestones) |
| FR6 | — | Already implemented (pattern observations) |
| FR7 | — | Already implemented (observation framing) |
| FR8 | — | Already implemented (greeting disclaimer) |
| FR9 | — | Already implemented (language constraints) |
| FR10 | Epic 8 | Subscription conversation extension |
| FR11 | — | Already implemented (resume conversation) |
| FR12 | Epic 2 | Closing exchange before transition |
| FR13 | — | Already implemented (territory transitions) |
| FR14 | — | Already implemented (evidence extraction) |
| FR15 | — | Already implemented (scoring derive-at-read) |
| FR16 | Epic 3 | Results display on Me page |
| FR17 | Epic 3 | Archetype assignment |
| FR18 | Epic 3 | Positive archetype framing |
| FR19 | Epic 1 | Three-space navigation model |
| FR20 | — | Already implemented (portrait generation) |
| FR21 | Epic 3 | Free portrait on Me page |
| FR22 | Epic 3 | View portrait after generation |
| FR22a | Epic 3 | One portrait per result |
| FR23 | Epic 8 | First-extension portrait regen |
| FR24 | Epic 3 | Share events + return visit tracking |
| FR25 | Epic 8 | Extension session initialization |
| FR26 | Epic 2 | Async portrait notification |
| FR27 | Epic 2 | Portrait retry with backoff |
| FR28 | Epic 6 | QR drawer from Circle invite ceremony |
| FR29 | Epic 7 | Relationship letter living space |
| FR29a | Epic 7 | Single LLM call generation |
| FR30 | Epic 7 | QR accept with ongoing consent |
| FR31 | Epic 7 | Ritual suggestion screen |
| FR32 | Epic 7 | Dynamics-not-deficits framing |
| FR33 | Epic 7 | Free and unlimited letters |
| FR34 | Epic 7 | Cascade delete on account deletion |
| FR35 | Epic 7 | Letter linked to assessment results |
| FR36 | Epic 7 | Notification when letter ready |
| FR37 | Epic 7 | QR accept requires auth + assessment |
| FR39 | Epic 3 | Public profile page |
| FR40 | Epic 3 | Default-private toggle |
| FR41 | Epic 3 | OG meta tags + card images |
| FR42 | Epic 3 | Unauthenticated access |
| FR43 | Epic 3 | Assessment CTA on profile |
| FR44 | Epic 3 | Shareable link copy |
| FR45 | Epic 3 | Relationship CTA on other profiles |
| FR46 | Epic 3 | 81 archetype card images |
| FR47 | Epic 8 | Polar subscription checkout |
| FR49 | Epic 8 | Unlimited extensions for subscribers |
| FR50 | — | Already implemented (auth + verification) |
| FR50a | — | Already implemented (verification link) |
| FR50b | — | Already implemented (resend verification) |
| FR51 | Epic 3 | Profile visibility control |
| FR52 | — | Already implemented (data storage notice) |
| FR53 | — | Already implemented (account deletion) |
| FR54 | — | Already implemented (pre-conversation onboarding) |
| FR55 | Epic 11 | Cost monitoring |
| FR56 | Epic 11 | Session-boundary cost guard |
| FR57 | Epic 11 | Temporarily unavailable message |
| FR58 | Epic 11 | Cost guard user notification |
| FR59 | Epic 9 | Homepage above-the-fold |
| FR60 | Epic 9 | Transformation headline |
| FR61 | Epic 9 | Single primary CTA |
| FR62 | Epic 9 | Portrait excerpt early |
| FR63 | Epic 9 | Nerin conversation preview |
| FR64 | Epic 9 | Fear-addressing content |
| FR65 | Epic 9 | Free transparency |
| FR66 | Epic 9 | Multi-persona support |
| FR67 | Epic 4 | Daily check-in form |
| FR68 | Epic 4 | Silent deposit + journal render |
| FR68a | Epic 4 | Weekly anticipation line |
| FR70 | Epic 4 | Mood calendar |
| FR71 | Epic 4 | Note visibility selector |
| FR72 | Epic 4 | Privacy — note isolation |
| FR73 | Epic 2 | Portrait versioned snapshot |
| FR76 | Epic 10 | Three lifecycle emails |
| FR77 | Epic 10 | Relationship letter notification email |
| FR78 | Epic 12 | Knowledge library |
| FR79 | Epic 12 | Archetype definition pages |
| FR80 | Epic 12 | Trait/facet explainer pages |
| FR81 | Epic 12 | Big Five science articles |
| FR82 | Epic 12 | Relationship/career guides |
| FR83 | Epic 12 | Sitemap + Schema.org |
| FR84 | Epic 9 | Founder story block |
| FR85 | Epic 9 | Beyond-the-portrait teaser |
| FR86 | Epic 5 | Weekly summary generation (Sunday 6pm) |
| FR87 | Epic 5 | LLM letter from Nerin |
| FR89 | Epic 5 | Push notification + email fallback |
| FR90 | Epic 5 | Focused reading route |
| FR91 | Epic 5 | Soft conversion CTA |
| FR92 | Epic 5 | Edge cases (0-2 check-ins, mid-week sub, cancel) |
| FR93 | Epic 2 | "Show me what you found →" button |
| FR94 | Epic 2 | Portrait generating state |
| FR95 | Epic 2 | "There's more to see →" link |
| FR96 | Epic 2 | Return seed + notification permission |
| FR97 | Epic 6 | Circle full-width person cards |
| FR98 | Epic 6 | Intimacy Principle enforcement |
| FR99 | Epic 6 | Invite ceremony dialog |
| FR100 | Epic 6 | Invite placement (4 locations) |
| FR101 | Epic 1 | Default /today landing |
| FR102 | Epic 1 | Three-space bottom nav |
| FR103 | Epic 1 | Public profile separate from Me |
| NFR1-NFR19 | — | Already implemented or cross-cutting |
| NFR20-NFR24 | Epic 13 | Accessibility foundations |
| NFR25 | Epic 8 | Embedded checkout |
| NFR26 | — | Already implemented (LLM provider swap) |
| NFR27 | Epic 10 | Email delivery SLAs |
| NFR28 | — | Already implemented (structured logging) |
| NFR29 | — | Already implemented (derive-at-read) |
| NFR7a | Epic 11 | Free-tier + subscriber cost targets |
| NFR7b | Epic 11 | Cost ceiling circuit breaker |

## Epic List

### Epic 1: Legacy Cleanup & Three-Space Foundation
Users navigate the product through the three-space model (Today/Me/Circle) instead of the retired dashboard. All deprecated components and stale monetization surfaces (PWYW, credits) are removed. BottomNav provides persistent navigation for all authenticated routes.
**FRs covered:** FR19, FR101, FR102, FR103
**UX-DRs covered:** UX-DR7, UX-DR30, UX-DR31, UX-DR32, UX-DR35

### Epic 2: Post-Assessment Transition & Portrait Reading
Users experience the emotional peak after completing the assessment: conversation closes with a distinct beat, the portrait generates in a focused distraction-free view (OceanSpinner → letter fade-in), a warm transition leads to the full Me page, and a return seed with Nerin-voiced notification permission bridges to the daily loop.
**FRs covered:** FR12, FR26, FR27, FR73, FR93, FR94, FR95, FR96
**UX-DRs covered:** UX-DR17, UX-DR18, UX-DR19, UX-DR24

### Epic 3: Me Page — Identity Sanctuary
Users can explore their persistent identity on the Me page: portrait, archetype hero, OCEAN code, radar chart, confidence, public face controls (visibility toggle, shareable link, archetype card), subscription pitch, and Circle preview. Public profiles work for unauthenticated visitors with SSR, OG tags, and assessment CTAs.
**FRs covered:** FR16, FR17, FR18, FR21, FR22, FR22a, FR24, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR51
**UX-DRs covered:** UX-DR14, UX-DR22, UX-DR23, UX-DR36, UX-DR37

### Epic 4: Silent Daily Journal & Mood Calendar
Users check in daily on the Today page with a Nerin-voiced prompt, mood selector, and optional note. The entry saves silently (zero LLM calls), renders in journal format, fills in the week-so-far dots, and displays the quiet anticipation line for Sunday's weekly letter.
**FRs covered:** FR67, FR68, FR68a, FR70, FR71, FR72
**UX-DRs covered:** UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR25

### Epic 5: Weekly Letter from Nerin
Users who checked in ≥3 times that week receive a Sunday evening letter from Nerin — a complete, satisfying free descriptive letter in focused reading view. Push notification + email fallback. Soft conversion CTA in Nerin's voice at the end.
**FRs covered:** FR86, FR87, FR89, FR90, FR91, FR92
**UX-DRs covered:** UX-DR12, UX-DR13

### Epic 6: Circle & Invite Ceremony
Users see the people they care about as full-width person cards on the Circle page, enforcing the Intimacy Principle (no counts, no sorting, no search). Users invite new people through the reward-first invite ceremony dialog with QR/link/share options.
**FRs covered:** FR28, FR97, FR98, FR99, FR100
**UX-DRs covered:** UX-DR15, UX-DR16

### Epic 7: Relationship Letter — Living Relational Space
When both users complete their assessments, a free relationship letter generates from both UserSummaries. Users experience a ritual first-read, explore a living page with real-time data grid, letter history, shared notes, and anticipation for the next letter. Notifications on letter readiness.
**FRs covered:** FR29, FR29a, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR77
**UX-DRs covered:** UX-DR20, UX-DR21

### Epic 8: Subscription & Conversation Extension
Users can subscribe at €9.99/mo via Polar embedded checkout, extend their conversation with Nerin (+15 exchanges with Director re-initialization), and receive an automatic portrait regeneration on their first extension.
**FRs covered:** FR10, FR23, FR25, FR47, FR49
**UX-DRs covered:** UX-DR36

### Epic 9: Homepage Conversion
Cold visitors experience a split-layout homepage with real product artifacts (conversation excerpt, portrait paragraph, archetype carousel, Today/letter previews), a sticky auth panel with phase-aware animated hooks, need-positioned messaging, and reassurance cards.
**FRs covered:** FR59, FR60, FR61, FR62, FR63, FR64, FR65, FR66, FR84, FR85
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR33, UX-DR34, UX-DR38, UX-DR39

### Epic 10: Transactional Emails & Re-Engagement
Users receive three lifecycle emails (drop-off re-engagement, Nerin check-in, subscription conversion nudge) and timely relationship letter readiness notifications.
**FRs covered:** FR76, FR77
**NFRs covered:** NFR27

### Epic 11: Cost Ceiling & Operational Safety
The platform stays within budget during viral events with per-user token budgets, circuit breaker, session-aware cost guards, and structured cost logging.
**FRs covered:** FR55, FR56, FR57, FR58
**NFRs covered:** NFR7a, NFR7b

### Epic 12: Knowledge Library (SEO)
The platform hosts a public, SSR knowledge library with archetype definitions (81), trait/facet explainers (35), Big Five science articles (10-20), and relationship/career guides (50-100) — all with Schema.org structured data and assessment CTAs.
**FRs covered:** FR78, FR79, FR80, FR81, FR82, FR83

### Epic 13: Accessibility Foundations
Users with disabilities can navigate the core product at WCAG 2.1 AA — conversation UI, results/Me page, public profile, and subscription modal are keyboard-navigable, screen-reader-compatible, with proper focus management and contrast ratios.
**NFRs covered:** NFR20, NFR21, NFR22, NFR23, NFR24
**UX-DRs covered:** UX-DR26, UX-DR27, UX-DR28, UX-DR29

---

## Epic 1: Legacy Cleanup & Three-Space Foundation

Users navigate the product through the three-space model (Today/Me/Circle) instead of the retired dashboard. All deprecated components and stale monetization surfaces (PWYW, credits) are removed.

### Story 1.1: BottomNav Component & Three-Space Route Shells

As an authenticated user,
I want to see a persistent bottom navigation with Today / Me / Circle tabs,
So that I can move between the three spaces of the product.

**Acceptance Criteria:**

**Given** an authenticated user with a completed assessment
**When** they visit any authenticated route (/today, /me, /circle)
**Then** a persistent BottomNav renders at the bottom with three tabs: Today, Me, Circle
**And** the active tab is highlighted based on the current route
**And** tapping a tab navigates to the corresponding route using TanStack Router `<Link>`
**And** BottomNav is hidden on /chat, `/me/$conversationSessionId?view=portrait`, /today/week/$weekId, and /settings
**And** on desktop (≥1024px), BottomNav is replaced with a top nav variant with the same three tabs
**And** mobile BottomNav has safe-area-inset-bottom padding for iOS
**And** route shells exist for /today (placeholder), /me (placeholder), /circle (placeholder)
**And** /settings route already exists and is accessible via gear icon (no BottomNav tab)
**And** each route shell has `beforeLoad` auth check redirecting unauthenticated users to /login
**And** assessment completion routes to /me for the reveal
**And** after that, users can navigate freely across /today, /me, and /circle without a persistent first-visit route gate

### Story 1.2: Dashboard Retirement & Nav Cleanup

As a user,
I want to not encounter the retired dashboard or stale navigation links,
So that I only see the current product navigation.

**Acceptance Criteria:**

**Given** the /dashboard route exists at `apps/front/src/routes/dashboard.tsx`
**When** this story is complete
**Then** /dashboard returns a 301 redirect to /today
**And** the dashboard route file is deleted (replaced with a redirect-only route)
**And** all dashboard components are deleted: DashboardIdentityCard, DashboardCreditsCard, DashboardRelationshipsCard, DashboardInProgressCard, DashboardEmptyState
**And** UserNav.tsx no longer contains a link to /dashboard (replace with gear icon → /settings)
**And** MobileNav.tsx no longer contains a link to /dashboard (replaced by BottomNav from Story 1.1)
**And** Header.tsx is updated to remove any dashboard/profile navigation references
**And** e2e tests referencing `data-testid="dashboard-*"` are updated to new testid conventions
**And** `pnpm build` succeeds and `pnpm typecheck` passes

### Story 1.3: Deprecated Component & PWYW Cleanup

As a developer,
I want all deprecated monetization and auth-gate components removed,
So that the codebase reflects the current free-portrait subscription model.

**Acceptance Criteria:**

**Given** the following components exist in the codebase
**When** this cleanup is complete
**Then** these components are deleted:
- `ChatAuthGate.tsx` and its test file
- `PortraitWaitScreen.tsx` and its test file
- `PwywModal.tsx` (the actual component, not the non-existent PWYWCurtainModal)
- `PortraitUnlockCta.tsx`
- `RelationshipCreditsSection.tsx`
- `QuickActionsCard.tsx`
- `useCredits.ts` hook
**And** all imports referencing these deleted components are removed
**And** any parent component that rendered these components is updated to remove the usage
**And** the results page no longer shows PWYW modal or portrait unlock CTA (portrait renders directly — it's free)
**And** `pnpm build` succeeds and `pnpm test:run` passes

### Story 1.4: Retired Homepage Component Cleanup

As a developer,
I want deprecated homepage components removed,
So that the homepage is ready for the new split-layout redesign.

**Acceptance Criteria:**

**Given** the following homepage components exist in `apps/front/src/components/home/`
**When** this cleanup is complete
**Then** these components are deleted:
- `ConversationFlow.tsx`
- `ComparisonCard.tsx`
- `TraitStackEmbed.tsx`
- `ComparisonTeaserPreview.tsx`
- `ScrollIndicator.tsx`
- `FounderPortraitExcerpt.tsx`
**And** all imports from the homepage route (`apps/front/src/routes/index.tsx`) are updated
**And** the homepage still renders (may show a simplified placeholder if these were load-bearing)
**And** `pnpm build` succeeds

---

## Epic 2: Post-Assessment Transition & Portrait Reading

Users experience the emotional peak after completing the assessment: conversation closes with a distinct beat, the portrait generates in a focused distraction-free view, and a warm transition leads to their identity page with a return seed.

### Story 2.1: "Show me what you found →" Closing Button

As a user who just finished the 15-exchange assessment,
I want the input field to fade and a warm button to appear,
So that the transition from conversation to portrait feels intentional and emotionally connected.

**Acceptance Criteria:**

**Given** the user has completed exchange 15 and Nerin's closing message has rendered
**When** the closing exchange is displayed
**Then** the chat input field fades out (CSS opacity transition, ~300ms)
**And** a single button appears below the closing message: "Show me what you found →"
**And** the button uses warm, Nerin-consistent styling (not a generic system button)
**And** tapping the button navigates to `/me/$conversationSessionId?view=portrait`
**And** no other CTAs or navigation options are visible after the closing exchange
**And** the existing "View Results" button in TherapistChat.tsx is replaced by this new button

### Story 2.2: Portrait Reading Generating State with Nerin Voice

As a user arriving at the portrait reading view,
I want to see a warm generating state while my portrait is being written,
So that the wait feels like part of the experience, not a loading screen.

**Acceptance Criteria:**

**Given** the user navigates to `/me/$conversationSessionId?view=portrait` and the portrait is still generating
**When** the PortraitReadingView renders in generating state
**Then** a centered OceanSpinner is displayed (already exists as component)
**And** a single Nerin-voiced line is shown: "Nerin is writing your letter..."
**And** no other content, navigation, or UI elements are visible (distraction-free)
**And** the background uses the warm letter-format styling (matching existing PortraitReadingView)
**And** when the portrait status transitions to "ready" (via usePortraitStatus polling), the spinner resolves and the letter fades in with a CSS opacity+transform transition (~500ms)
**And** the fade-in transition is gated by `prefers-reduced-motion` (instant swap if reduced motion preferred)

### Story 2.3: Portrait Reading Copy & End-of-Letter Transition

As a user reading my portrait for the first time,
I want the end-of-letter link to use warm, Nerin-consistent copy,
So that the transition to my full identity page feels like a continuation, not a redirect.

**Acceptance Criteria:**

**Given** the user is reading their portrait in the PortraitReadingView
**When** they scroll to the bottom of the letter
**Then** the existing "See your full personality profile" link text is replaced with "There's more to see →"
**And** the link navigates to `/me/$conversationSessionId` (full session-scoped Me surface; legacy `/results/...` redirects here)
**And** the link styling is warm and consistent with the letter format (not a standard button)

### Story 2.4: Portrait Retry with Exponential Backoff

As a system operator,
I want portrait generation to retry with increasing delays,
So that transient LLM failures don't permanently fail portrait generation.

**Acceptance Criteria:**

**Given** portrait generation fails on the first attempt
**When** the retry logic executes
**Then** the system retries up to 3 times total with exponential backoff: 5s, 15s, 45s delays
**And** the existing `Effect.retry({ times: 2 })` in `generate-full-portrait.use-case.ts` is replaced with `Effect.retry(Schedule.exponential("5 seconds").pipe(Schedule.compose(Schedule.recurs(2))))`
**And** if all 3 attempts fail, a portrait row is inserted with `failedAt` timestamp
**And** the user sees a retry option in the PortraitReadingView
**And** `pnpm test:run` passes

### Story 2.5: Return Seed & Notification Permission on First Me Page Visit

As a user visiting my results page for the first time after the portrait,
I want Nerin to invite me back tomorrow,
So that I'm motivated to return and start the daily check-in habit.

**Acceptance Criteria:**

**Given** the user navigates from the portrait reading view to the full results page for the first time
**When** the results page renders
**Then** a ReturnSeedSection component renders at the bottom of the page
**And** it displays Nerin's message: "Tomorrow, I'll ask how you're doing. Come check in with me."
**And** below the message, a Nerin-voiced notification permission request: "I'd like to check in with you tomorrow. Mind if I send a quiet note?"
**And** the permission request is NOT a system-voice browser prompt — it's a styled card with Accept/Decline buttons
**And** accepting triggers the browser's notification permission request
**And** if permission granted, a first daily prompt is scheduled for the next day
**And** if declined, no lock-in — the section gracefully dismisses
**And** the ReturnSeedSection only shows on the first post-assessment reveal (not on subsequent visits to that session’s Me surface)
**And** any first-visit marker tracked server-side is for ReturnSeedSection visibility only, not for gating Today-space routes

---

## Epic 3: Me Page — Identity Sanctuary

Users can explore their persistent identity on the Me page: portrait, archetype hero, OCEAN code, radar chart, confidence, public face controls, subscription pitch, and Circle preview.

### Story 3.1: Me Page Route & Section Layout

As an authenticated user with a completed assessment,
I want a dedicated /me page that shows my full identity,
So that I have a persistent place to revisit my portrait, archetype, and personality data.

**Acceptance Criteria:**

**Given** an authenticated user with a completed assessment
**When** they navigate to /me
**Then** the page renders with 7 sections in order: Identity Hero, Your Portrait, Your Growth (conditional), Your Public Face, Your Circle, Subscription, Account
**And** the page uses a single-column scrollable layout (max-width 720px on desktop, full-width on mobile)
**And** each section is wrapped in a semantic `<section>` with a clear heading
**And** the page loads assessment results via the existing `profile.results` API
**And** if the user has no completed assessment, they are redirected to /chat
**And** BottomNav shows "Me" tab as active

### Story 3.2: Identity Hero Section

As a user on my Me page,
I want to see my archetype, OCEAN code, radar chart, and confidence at the top,
So that my personality identity is immediately visible and celebrated.

**Acceptance Criteria:**

**Given** the Me page is loaded with assessment results
**When** the Identity Hero section renders
**Then** it displays the user's archetype name using the existing ArchetypeHeroSection component
**And** the OCEAN code is rendered using the existing OceanCodeStrand component with interactive tooltips
**And** the PersonalityRadarChart renders the user's 5 trait scores
**And** the existing ConfidenceRingCard shows the assessment confidence level
**And** all components receive data from the same TanStack Query hook (no duplicate fetches)

### Story 3.3: GeometricSignature Component

As a user,
I want my OCEAN code displayed as 5 geometric shapes,
So that I have a visual identity mark that works across all surfaces including social sharing.

**Acceptance Criteria:**

**Given** a 5-letter OCEAN code (e.g., "OCEAR")
**When** GeometricSignature renders
**Then** 5 shapes display inline, one per trait, with even spacing
**And** each shape corresponds to the trait's level (different shapes for L/M/H per trait)
**And** the component accepts a `size` prop: "hero" (28px), "profile" (18px), "card" (12px), "mini" (10px)
**And** shapes use SVG `<path>` or `<polygon>` only (no CSS transforms, no clip-path, no gradients)
**And** the component renders identically in React DOM and Satori (tested via the existing OG card generation endpoint)
**And** `aria-label="Personality signature: [spell out code letters]"` is set on the container
**And** each shape has `role="img"` with trait name tooltip

### Story 3.4: Your Public Face Section

As a user on my Me page,
I want to control my public profile visibility and share my archetype card,
So that I can manage what strangers see and easily share my identity.

**Acceptance Criteria:**

**Given** the Me page Your Public Face section renders
**When** the user views this section
**Then** a preview of their public profile appearance is shown (archetype name, OCEAN code)
**And** the existing profile visibility toggle (PublicVisibilityPrompt) is integrated
**And** a "Copy link" button copies the public profile URL to clipboard with Sonner toast confirmation
**And** the archetype card image is displayed as a preview (using existing ArchetypeCardTemplate)
**And** a share button triggers native Web Share API (if available) or falls back to copy link
**And** NO view counts, NO sign-up attribution metrics are shown anywhere (Intimacy Principle)

### Story 3.5: Subscription Pitch Section

As a free user on my Me page,
I want to see a Nerin-voiced pitch for subscription,
So that I understand the value of continuing my conversation with Nerin.

**Acceptance Criteria:**

**Given** the user is a free user (no active subscription)
**When** the Subscription section renders on Me
**Then** a SubscriptionPitchSection displays with Nerin-voiced copy: "Continue your conversation with Nerin — +15 exchanges + a new portrait"
**And** a single CTA button links to the subscription checkout flow
**And** the section does NOT show pricing details or feature comparison tables
**And** for subscribed users, a SubscriptionValueSummary renders instead showing their current perks and billing status
**And** subscription status is derived from purchase events via the existing `deriveCapabilities` function

### Story 3.6: Your Circle Preview & Account Link

As a user on my Me page,
I want a preview of my Circle and quick access to account settings,
So that I can see who's in my circle and manage my account.

**Acceptance Criteria:**

**Given** the Me page renders
**When** the Your Circle section is visible
**Then** it shows a compact preview of the user's circle members (archetype names, count of relationships)
**And** a "View all →" link navigates to /circle
**And** if the user has no circle members, empty state text says "Big Ocean is made for the few people you care about"
**And** at the bottom of the page, a gear icon links to /settings
**And** the gear icon is styled as a subtle footer element, not a prominent section

---

## Epic 4: Silent Daily Journal & Mood Calendar

Users check in daily on the Today page with a Nerin-voiced prompt, mood selector, and optional note. Zero LLM calls.

### Story 4.1: Daily Check-in Data Model & API

As a developer,
I want the database schema and API endpoints for daily check-ins,
So that the Today page has a backend to save and retrieve mood data.

**Acceptance Criteria:**

**Given** the Drizzle schema at `packages/infrastructure/src/db/drizzle/schema.ts`
**When** the migration is applied
**Then** a `daily_check_ins` table exists with columns: id (uuid PK), user_id (FK → user), check_in_date (date), mood (enum: great/good/okay/uneasy/rough), note (text, nullable), note_visibility (enum: private/inner_circle/public_pulse, default private), created_at, updated_at
**And** a unique constraint on (user_id, check_in_date) prevents duplicate check-ins per day
**And** repository interface exists in domain: `DailyCheckInRepository` with methods: save, getByDate, getByWeek, getByDateRange
**And** Drizzle implementation exists in infrastructure with `__mocks__` co-located mock
**And** API endpoints are defined in contracts: `POST /api/today/check-in` (save), `GET /api/today/check-in?date=:date` (fetch one), `GET /api/today/week?weekId=:weekId` (fetch week)
**And** handlers and use-cases follow hexagonal architecture (no business logic in handlers)
**And** second check-in for the same day overwrites the first (upsert behavior)
**And** `pnpm db:generate` produces a migration and `pnpm typecheck` passes

### Story 4.2: CheckInForm Component

As a user on the Today page,
I want to quickly record my mood and an optional note,
So that I can deposit my daily state in under 10 seconds.

**Acceptance Criteria:**

**Given** the user is on /today and has not checked in today
**When** the pre-check-in state renders
**Then** a Nerin-voiced prompt displays at the top: "How are you feeling this morning?"
**And** 5 mood options render as large tappable emojis (minimum 44×44px touch targets)
**And** an optional note Textarea field with placeholder "One note, if you want" is shown below
**And** a Save button is disabled until a mood is selected
**And** the form uses @tanstack/react-form (per project rules)
**And** on save, the check-in is submitted to `POST /api/today/check-in`
**And** zero LLM calls are made on submission
**And** the save completes and renders the post-check-in state within 500ms

### Story 4.3: Post-Check-in Journal View & Week Dots

As a user who just checked in,
I want to see my entry in journal format with my week-so-far progress,
So that my daily deposit feels recorded and I can anticipate Sunday's letter.

**Acceptance Criteria:**

**Given** the user has checked in today
**When** the post-check-in state renders on /today
**Then** a JournalEntry component shows the user's mood emoji + note text in journal format (shared-page feel, warm body font, NOT chat bubbles)
**And** a MoodDotsWeek component shows 7 dots for the current week (Mon-Sun)
**And** today's dot is filled; past days with check-ins are filled; future/missed days are empty
**And** NO streak counter is shown anywhere
**And** a QuietAnticipationLine renders below: "Nerin will write you a letter about your week on Sunday."
**And** the anticipation line only shows Mon-Sat (replaced by WeeklyLetterCard on Sunday — Epic 5)
**And** the transition from pre-check-in to post-check-in uses a cross-fade animation (~400ms)

### Story 4.4: Mood Calendar View

As a user,
I want to view my check-in history as a calendar,
So that I can see patterns in my mood over time.

**Acceptance Criteria:**

**Given** the user has mood check-in history
**When** they access the mood calendar (from Me page "Your Growth" section link)
**Then** a MoodCalendarView renders showing a month grid of dots with mood emoji indicators
**And** days with check-ins show the selected mood emoji; days without are empty
**And** the calendar defaults to the current month with navigation to previous months
**And** the calendar is accessible via `/today/calendar` route (outside BottomNav, back button to /today)
**And** the Me page "Your Growth" section only renders when the user has at least 1 check-in

---

## Epic 5: Weekly Letter from Nerin

Users who checked in ≥3 times that week receive a Sunday evening letter from Nerin — a complete, satisfying free descriptive letter.

### Story 5.1: Weekly Summary Data Model & Generation Pipeline

As a developer,
I want the database schema and generation pipeline for weekly letters,
So that Nerin can write users a letter about their week every Sunday.

**Acceptance Criteria:**

**Given** the Drizzle schema
**When** the migration is applied
**Then** a `weekly_summaries` table exists with columns: id (uuid PK), user_id (FK → user), week_start_date (date), week_end_date (date), content (text, nullable), generated_at (timestamptz, nullable), failed_at (timestamptz, nullable), retry_count (smallint, default 0), created_at
**And** a unique constraint on (user_id, week_start_date) prevents duplicate summaries
**And** repository interface `WeeklySummaryRepository` exists with methods: save, getByWeekId, getByUserId, getLatestForUser
**And** a `generate-weekly-summary.use-case.ts` exists that:
  - Queries users with ≥3 check-ins for the current week
  - For each qualifying user, generates a letter via Sonnet LLM using the user's check-in data (mood + notes + dates) and personality context (facets, archetype, traits)
  - Saves the generated letter to weekly_summaries
  - Users with 0-2 check-ins receive no summary and no notification (no shame messaging)
**And** the generation is idempotent (re-running for the same week doesn't duplicate)
**And** a cron-like trigger fires at Sunday 6pm (implementation: scheduled Effect fiber or external cron hitting an endpoint)

### Story 5.2: Weekly Letter Reading View & Route

As a user who received a weekly letter,
I want to read it in a focused, distraction-free view,
So that the letter feels like a personal gift from Nerin, not a notification.

**Acceptance Criteria:**

**Given** a weekly summary has been generated for the user
**When** they navigate to `/today/week/$weekId`
**Then** a WeeklyLetterReadingView renders sharing the same visual shell as PortraitReadingView (max-width 720px, warm background, letter typography)
**And** the letter content renders as markdown with Nerin's voice: personalized opening, week narrative, mood shape dots, "What stood out" beat, Nerin's sign-off
**And** BottomNav is hidden on this route (focused reading)
**And** a back button returns to /today
**And** at the bottom, a soft conversion CTA in Nerin's voice: "I have more I want to say about what comes next..." with a primary button for subscription and a "Not right now" dismiss
**And** the dismiss returns the user to /today with no escalation
**And** the CTA reappears each Sunday (not suppressed after dismissal)

### Story 5.3: Weekly Letter Inline Card & Notifications

As a user on the Today page on Sunday,
I want to see that my weekly letter is ready,
So that I can tap through to read it.

**Acceptance Criteria:**

**Given** it is Sunday and the user's weekly letter has been generated
**When** /today renders
**Then** a WeeklyLetterCard component appears at the top of the page: "Your week with Nerin is ready"
**And** tapping the card navigates to `/today/week/$weekId`
**And** the card replaces the QuietAnticipationLine on Sundays
**And** a push notification is sent at generation time: "Your week with Nerin is ready."
**And** for users without push permission, an email fallback is sent via the Resend email infrastructure
**And** users with 0-2 check-ins that week see no card, no notification, and no shame message

---

## Epic 6: Circle & Invite Ceremony

Users see the people they care about on the Circle page and can invite new people through the invite ceremony.

### Story 6.1: Circle Page & Person Cards

As a user,
I want to see the people I care about on my Circle page,
So that I can access my relationship letters and feel connected to my closest people.

**Acceptance Criteria:**

**Given** an authenticated user with a completed assessment navigates to /circle
**When** the Circle page renders
**Then** each connected person is displayed as a full-width CirclePersonCard showing: archetype name, OCEAN code, duration text ("understanding each other since [month year]"), "last shared" recency signal, and "View your dynamic →" link to /relationship/$id
**And** cards are ordered organically (insertion order — no sorting, no search, no recommendations)
**And** NO count metrics are shown ("X connections", view counters, sign-up attribution)
**And** NO follower/friend/fan language is used anywhere
**And** the Intimacy Principle empty state renders when no connections exist: "Big Ocean is made for the few people you care about. This is where they'll live."
**And** BottomNav shows "Circle" tab as active

### Story 6.2: Invite Ceremony Dialog

As a user,
I want to invite someone I care about through a warm ceremony,
So that the invitation feels intentional and generous, not transactional.

**Acceptance Criteria:**

**Given** the user taps the invite card at the bottom of the Circle page
**When** the InviteCeremonyDialog opens
**Then** the dialog uses reward-first copy structure:
  1. "Discover the dynamic between you"
  2. Concrete promise: "the parts that click, the parts that clash, and the unspoken rhythms you've been navigating"
  3. Self-reflexive hook: "a side of yourself that only shows up around them"
  4. Reframe cost as gift: "Their side: a 30-minute conversation with Nerin. No forms. No quizzes. Just someone curious about them"
  5. Privacy promise at send moment: "It stays between the two of you"
**And** an optional name field serves as an intentionality ceremony
**And** the user can choose: show QR code, copy link, or native share sheet
**And** QR generation uses the existing QrDrawer component / `useQRToken` hook
**And** the dialog is built on shadcn Dialog with proper focus management and Escape to close
**And** invite placement also exists on: Me page Your Circle section, and via FR45 on public profiles

---

## Epic 7: Relationship Letter — Living Relational Space

When both users complete their assessments, a free relationship letter generates. Users experience a ritual first-read and explore a living page.

### Story 7.1: UserSummary Data Model & Generator

As a developer,
I want a UserSummary generated at assessment completion,
So that all Nerin LLM surfaces (portrait, weekly letter, relationship letter) read from a compressed canonical user-state.

**Acceptance Criteria:**

**Given** the Drizzle schema
**When** the migration is applied
**Then** a `user_summaries` table exists with columns: id (uuid PK), user_id (FK → user), assessment_result_id (FK → assessment_results), themes (jsonb — array of theme objects), quote_bank (jsonb — array of ≤50 verbatim quotes), summary_text (text), version (integer, default 1), created_at, updated_at
**And** a `UserSummaryRepository` interface exists in domain
**And** a `generate-user-summary.use-case.ts` generates the summary via Haiku LLM using facet scores + conversation evidence
**And** the generator is called automatically on assessment completion (inside `generate-results.use-case.ts`)
**And** the summary is fatal on first generation (assessment completion) — if it fails, the results flow fails
**And** subsequent regenerations (extension, weekly) are non-fatal — stale-but-valid previous version persists

### Story 7.2: Relationship Letter Generation with UserSummary

As a developer,
I want relationship letter generation to use UserSummaries instead of raw evidence,
So that the letter is richer and input tokens are reduced from ~70K to ~30K.

**Acceptance Criteria:**

**Given** User A and User B have both completed assessments with UserSummaries generated
**When** User B accepts User A's QR invitation
**Then** the relationship letter generation reads both users' UserSummaries (not raw evidence)
**And** the Sonnet prompt receives: User A summary + User B summary + both users' facet scores
**And** the letter uses letter-format output (Nerin Output Grammar — max-width 720px, warm background)
**And** the existing `generate-relationship-analysis.use-case.ts` is updated to read from `user_summaries` table
**And** relationship letters remain free and unlimited (no credit consumption)
**And** `pnpm test:run` passes with updated mock data

### Story 7.3: Relationship Letter Page — Living Relational Space

As a user viewing a relationship letter,
I want to see a living page with the letter, data grid, history, and shared notes,
So that the relationship feels like an ongoing space, not a one-time report.

**Acceptance Criteria:**

**Given** the user navigates to /relationship/$analysisId
**When** the relationship letter page renders
**Then** Section A (This Year's Letter) displays the LLM-generated letter in letter format
**And** Section B (Where You Are Right Now) shows a side-by-side trait/facet data grid comparing both users, derived at read time
**And** Section C (Letter History) shows a vertical timeline of all letters (single entry in MVP)
**And** Section D1 (Things You've Learned About Each Other) shows user-owned shared notes with per-entry attribution
**And** Section F (Your Next Letter) shows an anticipation anchor: "Nerin is already learning more about both of you"
**And** the existing RitualScreen is shown on first visit; subsequent visits bypass it with a "Read Together Again" button to re-enter
**And** the page respects the Intimacy Principle throughout (no metrics, no activity tracking)

---

## Epic 8: Subscription & Conversation Extension

Users can subscribe at €9.99/mo and extend their conversation with Nerin.

### Story 8.1: Subscription Event Types & Entitlement Derivation

As a developer,
I want subscription lifecycle events tracked in purchase_events,
So that the system can derive subscription status and feature entitlements.

**Acceptance Criteria:**

**Given** the existing purchase_events table and event type enum
**When** this story is complete
**Then** four new event types are added to the enum: `subscription_started`, `subscription_renewed`, `subscription_cancelled`, `subscription_expired`
**And** the Better Auth Polar plugin webhook handler routes subscription events to the correct event type
**And** `deriveCapabilities` is extended with `getSubscriptionStatus(userId)` returning "active" | "cancelled_active" | "expired" | "none"
**And** `isEntitledTo(userId, feature)` returns true for "conversation_extension" when subscription is active or cancelled_active
**And** the `polar_subscription_id` column is added to purchase_events for subscription lifecycle correlation
**And** existing one-time purchase event types remain in the enum (no removal)
**And** `pnpm test:run` passes

### Story 8.2: Subscription Checkout Flow

As a free user,
I want to subscribe at €9.99/mo via an embedded checkout,
So that I can unlock conversation extension with Nerin.

**Acceptance Criteria:**

**Given** a free user taps "Subscribe" on the Me page or weekly letter CTA
**When** the checkout flow initiates
**Then** a Polar embedded checkout opens for the €9.99/mo subscription product
**And** the existing Polar checkout infrastructure (`polar-checkout.ts`) is reused with the subscription product ID
**And** on successful checkout, Polar sends a `subscription.created` webhook
**And** the webhook handler inserts a `subscription_started` purchase event
**And** the user's `isEntitledTo("conversation_extension")` immediately returns true
**And** the Me page SubscriptionPitchSection updates to show SubscriptionValueSummary
**And** checkout completes in under 90 seconds from tap to confirmed status
**And** cancellation is self-service via Polar's customer portal

### Story 8.3: Conversation Extension Activation

As a subscriber,
I want to extend my conversation with Nerin by 15 more exchanges,
So that I can deepen my assessment and get a richer portrait.

**Acceptance Criteria:**

**Given** the user has an active subscription
**When** they tap the extension CTA (on Me page or results page)
**Then** `activate-conversation-extension.use-case.ts` is re-enabled (remove `FeatureUnavailable` gate)
**And** the use-case checks `isEntitledTo(userId, "conversation_extension")` instead of the old credit-based check
**And** a new `assessment_session` is created with `parent_session_id` pointing to the prior session
**And** the Director model initializes from the prior session's full conversation history + evidence
**And** the user enters /chat for 15 new exchanges
**And** on completion, new `assessment_results` are generated from combined evidence
**And** for the FIRST extension per subscriber, `Queue.offer(PortraitJobQueue)` fires with `replaces_portrait_id` metadata for bundled portrait regeneration
**And** the prior portrait becomes "previous version" via derive-at-read FK comparison

---

## Epic 9: Homepage Conversion

Cold visitors experience a split-layout homepage with real product artifacts and need-positioned messaging.

### Story 9.1: Split-Layout Architecture & Sticky Auth Panel

As a cold visitor,
I want to see a compelling homepage with the signup form always visible,
So that I can sign up whenever I'm ready without searching for a CTA.

**Acceptance Criteria:**

**Given** an unauthenticated user visits /
**When** the homepage renders on desktop (≥1024px)
**Then** a 60/40 split layout renders: scrollable timeline left, sticky auth panel right
**And** the auth panel contains: logo, dynamic hook line, email + password form, "Start yours →" submit, "Already have an account? Log in" link, "~30 min · Free · No credit card" tagline, 5 OCEAN breathing shapes
**And** the auth panel is `position: sticky; top: 0; height: 100vh`
**And** form submission triggers signup flow → redirect to /verify-email
**And** on mobile (<1024px), layout stacks vertically with a StickyBottomCTA fixed at the bottom
**And** the page is SSR for SEO

### Story 9.2: Dynamic Hook with Animated Gradient

As a visitor scrolling the homepage,
I want the auth panel hook to change as I explore different product phases,
So that the messaging always reflects what I'm currently seeing.

**Acceptance Criteria:**

**Given** the visitor is scrolling through the timeline
**When** they enter a new visual phase
**Then** the hook line transitions via vertical slide (AnimatePresence):
  - Conversation phase: "A conversation that **SEES** you." (blue→violet gradient)
  - Portrait phase: "Words you've been **CARRYING** without knowing." (amber→rose gradient)
  - World After phase: "A place that **STAYS**." (teal→cyan gradient)
  - Reassurance phase: "**YOURS.**" (all three phase colors merged)
**And** the gradient keyword is display-size, bold 900, with animated 6s gradient drift
**And** transitions use scroll-linked thresholds matching the phase boundaries
**And** `prefers-reduced-motion` replaces slide with instant swap and pauses gradient drift
**And** Framer Motion (motion v12) is used for AnimatePresence; CSS @keyframes for gradient drift

### Story 9.3: Timeline Phases — Product Artifacts

As a cold visitor,
I want to see real product artifacts as I scroll,
So that I understand what I'll get without reading descriptions.

**Acceptance Criteria:**

**Given** the visitor scrolls the left timeline
**When** Phase 1 (Conversation) is visible
**Then** a real Nerin conversation excerpt renders on a dark background, showing a pattern observation
**And** Phase 2 (Portrait) shows a real portrait paragraph in letter format on a warm papery background
**And** Phase 3 (World After) shows: TodayScreenMockup, WeeklyLetterCard preview, RelationshipLetterFragment, and an ArchetypeCarousel (horizontal swipe, 4-6 archetype cards)
**And** each phase uses its own distinct visual language (dark/warm/fresh)
**And** phases transition with subtle visual boundaries (not hard cuts)

### Story 9.4: Reassurance Section & Fear-Addressing Cards

As a cold visitor with concerns about the 30-minute commitment,
I want my fears addressed before I sign up,
So that I feel confident the experience is worth my time.

**Acceptance Criteria:**

**Given** the visitor scrolls past the three product phases
**When** the reassurance section ("Before you start") renders
**Then** three ReassuranceCards address: (1) process anxiety — "It's a conversation, not a quiz", (2) time commitment — "30 minutes that surprise you", (3) self-exposure — "Everything Nerin writes comes from a place of understanding"
**And** each card includes concrete evidence (conversation preview, testimonial/stat, portrait tone example)
**And** the section comes AFTER the product proof, not before
**And** the homepage does NOT mention subscription, pricing, or payment anywhere

---

## Epic 10: Transactional Emails & Re-Engagement

Users receive lifecycle emails and timely notifications.

### Story 10.1: Three Lifecycle Email Templates

As a user,
I want to receive relevant lifecycle emails,
So that I'm reminded to return when I've drifted away.

**Acceptance Criteria:**

**Given** the Resend email infrastructure exists
**When** lifecycle triggers fire
**Then** three React Email templates are created:
  1. **Drop-off re-engagement**: sent once when assessment is abandoned for >X hours. References the last conversation territory. Nerin-voiced.
  2. **Nerin check-in**: sent once ~2 weeks post-assessment. References tension/theme from portrait. Nerin-voiced.
  3. **Subscription conversion nudge**: sent once to engaged free users (≥3 return visits or ≥1 relationship letter). Highlights subscription value. Nerin-voiced.
**And** each email is sent at most once per trigger (one-shot, not recurring)
**And** emails use the existing Resend infrastructure (`ResendEmailRepository`)
**And** the drop-off email derives the last conversation topic from the last `assessment_exchange` row
**And** delivery rate >95% (Resend SLA)

### Story 10.2: Relationship Letter Ready Notification

As a user who participated in a relationship letter,
I want to be notified when the letter is ready,
So that I don't miss the moment.

**Acceptance Criteria:**

**Given** a relationship letter has finished generating
**When** the letter status transitions to "ready"
**Then** both participating users receive a notification within 5 minutes
**And** push notification is attempted first; email fallback for users without push permission
**And** the email template is Nerin-voiced: "[Name] and you — Nerin has something to share"
**And** the notification links directly to /relationship/$analysisId

---

## Epic 11: Cost Ceiling & Operational Safety

The platform stays within budget during viral events.

### Story 11.1: Cost Ceiling Architecture

As a platform operator,
I want automatic cost controls during viral traffic spikes,
So that LLM costs don't exceed budget even during unexpected growth.

**Acceptance Criteria:**

**Given** the existing Redis-based cost tracking and fail-open pattern
**When** cost ceiling thresholds are configured
**Then** per-user token budgets are enforced at session boundaries (never mid-session per FR56)
**And** a global free-tier circuit breaker triggers when weekly-letter LLM cost exceeds 3× the expected cost within any 24h window
**And** when circuit breaker triggers, rate limiting is applied with alerting (structured log event)
**And** users hitting the cost guard see "temporarily unavailable" message with retry after configurable cooldown (default 15 minutes)
**And** the cost guard is fail-open — if Redis is unavailable, requests proceed and failure is logged
**And** per-session cost is logged in structured format (NFR28)

---

## Epic 12: Knowledge Library (SEO)

The platform hosts a public, SSR knowledge library.

### Story 12.1: Knowledge Library Architecture & First 10 Pages

As an organic search visitor,
I want to find well-structured articles about archetypes and personality traits,
So that I can learn and be led to try the free assessment.

**Acceptance Criteria:**

**Given** the TanStack Start SSR framework
**When** the knowledge library routes are created
**Then** route patterns exist: `/library/archetype/$slug`, `/library/trait/$slug`, `/library/facet/$slug`, `/library/science/$slug`, `/library/guides/$slug`
**And** each page is server-rendered with Schema.org JSON-LD structured data
**And** each page includes a CTA to start the free assessment
**And** pages are included in the sitemap
**And** first batch: 5 archetype definition pages + 5 trait explainer pages (10 total)
**And** each archetype page contains: name, description, strengths, growth areas, compatible archetypes
**And** each trait page contains: scientific definition, behavioral examples across spectrum, facet breakdown
**And** Lighthouse SEO audit scores >90 on all pages

### Story 12.2: Knowledge Library Content Expansion

As the platform operator,
I want to expand the knowledge library to 35+ pages,
So that SEO coverage grows and more organic visitors discover the product.

**Acceptance Criteria:**

**Given** the library architecture from Story 12.1
**When** content is expanded
**Then** all 5 trait explainer pages are complete
**And** 30 facet explainer pages are created (one per facet)
**And** content follows the established template structure
**And** all new pages have Schema.org structured data and assessment CTAs
**And** the sitemap is automatically updated when new pages are added

---

## Epic 13: Accessibility Foundations

Users with disabilities can navigate the core product at WCAG 2.1 AA.

### Story 13.1: Skip-Link, Landmarks & Heading Hierarchy

As a keyboard/screen reader user,
I want semantic page structure across all routes,
So that I can navigate efficiently without visual cues.

**Acceptance Criteria:**

**Given** any page in the application
**When** the user presses Tab as the first action
**Then** a "Skip to content" link appears (visually hidden, visible on focus)
**And** activating it moves focus to the `<main>` element
**And** every page uses semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<section>`)
**And** heading hierarchy is sequential (one `h1` per page, no skipped levels)
**And** the three-space pages (/today, /me, /circle) each have `aria-label` on major sections

### Story 13.2: Conversation & Chat Accessibility

As a screen reader user,
I want to participate in the Nerin conversation,
So that the assessment is accessible regardless of ability.

**Acceptance Criteria:**

**Given** the chat interface at /chat
**When** a screen reader is active
**Then** the message container has `role="log"`
**And** Nerin messages announce via `aria-live="polite"`
**And** the depth meter updates `aria-valuenow` with "Exchange X of 15"
**And** milestone markers announce via `aria-live="polite"` ("50% depth reached")
**And** the chat input is keyboard-accessible (Enter to send, Shift+Enter for newline)
**And** the send button has `aria-label="Send message"`

### Story 13.3: Results, Portrait & Modal Accessibility

As a user with low vision or motor impairment,
I want results pages and modals to be fully accessible,
So that I can read my portrait and interact with subscription flows.

**Acceptance Criteria:**

**Given** the results/Me page, portrait reading view, and subscription modal
**When** accessibility tools are active
**Then** the radar chart has `role="img"` with `aria-label` and a data table fallback for screen readers
**And** score visualizations (facet bars, trait bands) have text alternatives
**And** all text meets 4.5:1 contrast ratio (AA)
**And** modals trap focus, close on Escape, return focus on close, and have `aria-modal="true"`
**And** all interactive elements have minimum 44×44px touch targets
**And** the ocean theme color palette meets AA contrast ratios
**And** `prefers-reduced-motion` fallbacks exist for all animations
