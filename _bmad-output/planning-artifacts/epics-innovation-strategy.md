---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/architecture-assessment-pipeline.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/ux-design-innovation-strategy.md'
  - '_bmad-output/innovation-strategy-2026-02-22.md'
---

# big-ocean - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for big-ocean, decomposing the requirements from the PRD, UX Design specifications, both Architecture documents (assessment pipeline + innovation strategy), and the Innovation Strategy into implementable stories.

**Architectural Scope:** This epic breakdown covers two major architectural changes layered together:
1. **Assessment Pipeline Redesign** — Two-tier analysis (Haiku conversanalyzer + Sonnet finanalyzer), formula-driven steering, LangGraph removal, sequential Effect pipeline
2. **Innovation Strategy Features** — Monetization (Polar.sh), teaser/full portrait two-tier generation, relationship analysis, viral/growth mechanics, budget protection

## Requirements Inventory

### Functional Requirements

**Assessment & Conversation**
- FR1: Users can complete multi-turn conversational personality assessment with AI agent (25 messages)
- FR2: Users can send messages and receive responses in real-time with streaming (response time <2 seconds P95)
- FR3: Users can pause assessment and resume later from saved conversation state
- FR4: System displays real-time progress indicator showing message-count progress toward threshold

**Big Five Trait Assessment (Two-Tier Analysis)**
- FR5: ConversAnalyzer (Haiku) runs synchronously on every message, extracting facet signals + domain tags into conversation_evidence (max 3 records/message, lean schema: bigfive_facet, score, confidence, domain)
- FR5.1: FinAnalyzer (Sonnet) runs once at assessment end, re-analyzing ALL messages with full context into finalization_evidence (rich schema: + rawDomain, quote, highlightStart, highlightEnd)
- FR5.2: System computes facet scores using context-weighted formulas with sqrt anti-redundancy, exponential confidence saturation, and signal power (cross-context entropy)
- FR5.3: Formula-driven steering selects target facet and target domain via expected signal power gain maximization with switch cost penalty
- FR6: Users can view Big Five trait scores derived from facet averages using FACET_TO_TRAIT lookup
- FR6.1: Users can click any facet score to view supporting evidence with highlighted message quotes
- FR6.2: Users can click any message to see which facets it contributed to
- FR7: System maintains per-facet confidence scores (0.0-1.0) with trait confidence derived as mean across contributing facets

**Context Tagging System**
- FR7.1: System tags every evidence record with hard domain enum (work, relationships, family, leisure, solo, other)
- FR7.2: FinAnalyzer tags evidence with rawDomain (free-text) for portrait richness
- FR7.3: Multi-domain evidence: same quote generates separate evidence records when spanning contexts

**OCEAN Archetype System**
- FR8: Users receive 5-letter OCEAN archetype code from trait levels (each L/M/H)
- FR9: System maps 4-letter codes (O-C-E-A) to archetype names: ~25-30 hand-curated + component-based for 81 total
- FR10: System retrieves archetype name + 2-3 sentence description
- FR11: System displays all 30 facet level names aligned with results

**Profile & Results**
- FR13: System generates shareable profile with archetype code, name, trait summary, facet insights
- FR14: System creates unique profile URL for each completed assessment
- FR15: System displays profile as private by default with explicit user control

**Bidirectional Evidence Highlighting**
- FR17: Users can click any facet score to view evidence panel with supporting quotes
- FR17.1: "Jump to Message" scrolls to and highlights the exact quote
- FR17.2: Color-coded highlighting (green/yellow/red) with opacity for confidence
- FR18: Users can click any message to view which facets it contributed to
- FR19: Character-level highlightRange for precise text highlighting

**Session Management**
- FR23: Server-side session state with URL-based resumption
- FR24: Session state persists across device switches
- FR25: Optimistic updates for instant UI feedback

**Finalization Pipeline**
- FR30: Frontend-only finalization trigger — sendMessage returns { response, isFinalTurn } at MESSAGE_THRESHOLD; frontend navigates to auth gate → wait screen → POST /generate-results
- FR31: Three-tier idempotency for generateResults
- FR32: Two-phase finalization: Phase 1 (FinAnalyzer → evidence), Phase 2 (scores + portrait → results)
- FR33: Finalization progress polling (analyzing → generating_portrait → completed)
- FR34: One session per user (lifetime) via partial unique index
- FR35: Session re-entry routing: active → chat, finalizing → wait screen, completed → results

**Teaser/Full Portrait Two-Tier Generation**
- FR36: Haiku teaser portrait generated synchronously at finalization (~2-3s). Named tensions + locked section titles
- FR37: Full Sonnet/Opus portrait generated async after PWYW payment via forkDaemon. "Spine" architecture
- FR38: Separate portraits table (FK → assessment_results, UNIQUE per tier)
- FR39: Portrait status derived from data (none/teaser/generating/ready/failed)
- FR40: Placeholder row pattern for forkDaemon
- FR41: Polling via TanStack Query refetchInterval while generating
- FR42: Auto-retry (max 3) + lazy retry via polling staleness check

**Monetization via Polar.sh**
- FR43: PWYW portrait unlock (min €1) via Polar embedded checkout overlay
- FR44: Relationship credits: 1 free/user (lifetime), singles €5, 5-packs €15
- FR45: Append-only purchase_events with 8 event types
- FR46: Capabilities derived from events (no mutable counters)
- FR47: HMAC webhook verification + polar_checkout_id UNIQUE
- FR48: Double-payment prevention (frontend + backend)
- FR49: Transaction boundaries: credit_consumed + invitation in single transaction

**Relationship Analysis**
- FR50: Invitation system — 1 credit = 1 shareable link (UUID v4, 30-day expiry)
- FR51: Invitee flow: link → anonymous Nerin conversation → signup → notification pin + accept/refuse
- FR52: Pair deduplication (canonical MIN/MAX ordering), multiple analyses per pair via UNIQUE(invitation_id)
- FR53: Relationship analysis (Sonnet/Opus) using both users' facet data + finalization evidence
- FR54: Accept triggers forkDaemon with placeholder row. Refuse = credit not refunded
- FR55: Both participants access independently. "Read together" = nudge, not gate
- FR56: Existing-user invitees reuse existing assessment
- FR57: Invitation token in httpOnly cookie, cleared after linking

**Viral/Growth Mechanics**
- FR58: Archetype card generation (Satori JSX → SVG → PNG) in 9:16 + 1:1
- FR59: Cache-Control immutable + content-hashed URLs
- FR60: InvitationBottomSheet: QR code + copy link + native share + editable message
- FR61: Notification pin on header avatar for pending invitations

**Budget Protection & Waitlist**
- FR62: Waitlist/circuit breaker via atomic Redis global daily assessment count
- FR63: waitlist_emails table

**Infrastructure & Cost**
- FR26: Audit logging for profile access
- FR27: LLM cost monitoring per user/session
- FR28: Rate limiting: 1 assessment/user/day, 2 messages/minute
- FR29: $75 daily cost budget with circuit breaker

**Authentication**
- FR64: User registration and login via Better Auth (email/password, 12+ chars)
- FR65: Anonymous sessions with httpOnly cookie
- FR66: Anonymous → authenticated transition with token rotation
- FR67: One active session per user_id (partial unique index)

### NonFunctional Requirements

**Performance:**
- NFR1: Nerin response < 2s (P95)
- NFR2: Assessment data saves < 500ms
- NFR3: Profile page loads < 1s
- NFR4: 500 concurrent users without degradation
- NFR5: Query response < 500ms
- NFR6: ConversAnalyzer (Haiku) < 1s synchronous (fallback if > 1.5s)
- NFR7: Finalization 15-20s total
- NFR8: Teaser portrait < 3s
- NFR9: Archetype lookup < 100ms
- NFR10: OCEAN code generation deterministic

**Security:**
- NFR11: TLS 1.3 in transit
- NFR12: Zero unauthorized profile access
- NFR13: Session token rotation on auth transition
- NFR14: Advisory lock per session (pg_try_advisory_lock)
- NFR15: Polar HMAC webhook verification
- NFR16: Better Auth password security (12+ chars, compromised checks)

**Usability:**
- NFR17: WCAG 2.1 Level AA
- NFR18: Mobile-first (375px min, breakpoints 768/1024/1440)
- NFR19: Touch targets >= 44px
- NFR20: Cross-browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Cost:**
- NFR21: LLM cost ≤ $0.15/assessment (target: $0.10)
- NFR22: Full portrait async with polling
- NFR23: Archetype cards Cache-Control immutable

**Architecture:**
- NFR24: Hexagonal architecture with Effect-ts DI
- NFR25: Pure domain formula functions (config as parameter, frozen defaults)
- NFR26: as-const → type → Schema → pgEnum pattern
- NFR27: Evidence mapper pattern (structural typing, no infra imports in domain)

### Additional Requirements

**From Assessment Pipeline Architecture:**
- Clean slate migration: drop assessment tables, recreate with conversation_evidence, finalization_evidence, assessment_results, pgEnums
- LangGraph removal: graph, checkpointer, cadence routing, forkDaemon async pipeline all eliminated
- Sequential Effect pipeline: Haiku → formulas → steering → Nerin
- 6 new repository interfaces (Conversanalyzer, Finanalyzer, Portrait, ConversationEvidence, FinalizationEvidence, AssessmentResult)
- Formula module: packages/domain/src/utils/formula.ts with FORMULA_DEFAULTS (Object.freeze)
- Evidence mappers: conversationToEvidenceInput(), finalizationToEvidenceInput()
- Cold start: msgs 1-3 use greeting seed from rotating pool
- Budget reservation: $0.30 fixed at session start
- AppConfig: MESSAGE_THRESHOLD, model name fields
- Nerin simplified: receives (targetDomain, targetFacet), hint derived at runtime
- ~32 files removed, ~25 added, ~20 modified. 5-phase migration sequence

**From Innovation Strategy Architecture:**
- 5 new tables: portraits, relationship_invitations, relationship_analyses, purchase_events, waitlist_emails
- 7 new repository interfaces: Portrait (teaser/full), RelationshipInvitation, RelationshipAnalysis, PurchaseEvent, PaymentGateway, CardGenerator, Waitlist
- 5 new contract groups: portrait, relationship, purchase, card, waitlist
- 10 new use-cases
- New dependencies: @polar-sh/checkout, satori + @resvg/resvg-js, qrcode.react
- All LLM prompts in packages/domain/src/prompts/
- Placeholder row pattern for all forkDaemon with persisted results
- Capability derivation from events, provider-prefixed fields (polar_*)

**From UX Design Specifications:**
- Three-beat results page: payoff → two doors → social artifact
- TeaserPortrait with named tensions + locked titles + inline Reveal button
- PersonalPortrait post-purchase (same component, different content)
- RelationshipInviteNudge (results page) + RelationshipCard (profile page, 7 states)
- InvitationBottomSheet: QR + copy + native share + message
- ArchetypeShareCard preview: 9:16 + 1:1
- Polar checkout overlay flow
- Notification pin for pending invitations
- Anonymous-first for all users
- Founder portrait as conversion proof
- Portrait reading mode (?view=portrait)

**From Original UX Spec:**
- Visual identity: geometric OCEAN ambient system, trait colors
- Chat UX with streaming
- Results components: ArchetypeHeroSection, OceanCodeStrand, PersonalityRadarChart, ConfidenceRingCard, TraitCard ×5, DetailZone
- ShareProfileSection, QuickActionsCard
- Design system: shadcn/ui, Tailwind v4
- Privacy visible in UI

### FR Coverage Map

| FR | Epic | | FR | Epic |
|---|---|---|---|---|
| FR1 | 1 | | FR36 | 3 |
| FR2 | 1 | | FR37 | 4 |
| FR3 | 1 | | FR38 | 3 |
| FR4 | 1 | | FR39 | 3 |
| FR5 | 1 | | FR40 | 4 |
| FR5.1 | 2 | | FR41 | 4 |
| FR5.2 | 1 | | FR42 | 4 |
| FR5.3 | 1 | | FR43 | 4 |
| FR6 | 2 | | FR44 | 5 |
| FR6.1 | 3 | | FR45 | 4 |
| FR6.2 | 3 | | FR46 | 4 |
| FR7 | 1 | | FR47 | 4 |
| FR7.1 | 1 | | FR48 | 4 |
| FR7.2 | 2 | | FR49 | 5 |
| FR7.3 | 1 | | FR50 | 5 |
| FR8 | 2 | | FR51 | 5 |
| FR9 | 2 | | FR52 | 5 |
| FR10 | 2 | | FR53 | 5 |
| FR11 | 2 | | FR54 | 5 |
| FR13 | 6 | | FR55 | 5 |
| FR14 | 6 | | FR56 | 5 |
| FR15 | 6 | | FR57 | 5 |
| FR17 | 3 | | FR58 | 6 |
| FR17.1 | 3 | | FR59 | 6 |
| FR17.2 | 3 | | FR60 | 5 |
| FR18 | 3 | | FR61 | 5 |
| FR19 | 3 | | FR62 | 6 |
| FR23 | 1 | | FR63 | 6 |
| FR24 | 1 | | FR64 | 1 |
| FR25 | 1 | | FR65 | 1 |
| FR26 | 6 | | FR66 | 1 |
| FR27 | 1 | | FR67 | 1 |
| FR28 | 1 | | | |
| FR29 | 1 | | | |
| FR30 | 2 | | | |
| FR31 | 2 | | | |
| FR32 | 2 | | | |
| FR33 | 2 | | | |
| FR34 | 2 | | | |
| FR35 | 2 | | | |

**Coverage:** 67/67 FRs mapped. No orphans.

## Epic List

### Epic 1: Conversational Assessment

**Goal:** User can have a full multi-turn conversation with Nerin, with real-time intelligence running behind the scenes.

**FRs:** FR1, FR2, FR3, FR4, FR5, FR5.2, FR5.3, FR7, FR7.1, FR7.3, FR23, FR24, FR25, FR27, FR28, FR29, FR64, FR65, FR66, FR67

**Scope:**
- Session management (create, resume, persist across devices)
- Authentication (anonymous httpOnly cookie, Better Auth email/password, anonymous→authenticated transition with token rotation, one active session per user)
- Chat UI with streaming (real-time responses <2s P95, optimistic updates)
- Message-count progress indicator toward threshold
- ConversAnalyzer (Haiku) synchronous on every message — extracts facet signals + domain tags into conversation_evidence (max 3 records/msg)
- Formula-driven steering — context-weighted scoring with sqrt anti-redundancy, exponential confidence saturation, signal power (cross-context entropy)
- Steering target selection via expected signal power gain maximization with switch cost penalty
- Context tagging (hard domain enum + multi-domain evidence splitting)
- Cold start: msgs 1-3 use greeting seed from rotating pool
- LLM cost monitoring per user/session, rate limiting (1 assessment/user/day, 2 messages/minute)
- $75 daily cost budget with circuit breaker
- Sequential Effect pipeline: Haiku → formulas → steering → Nerin (LangGraph removed)

**NFRs:** NFR1, NFR2, NFR4, NFR5, NFR6, NFR11, NFR13, NFR14, NFR16, NFR17-20, NFR21, NFR24-27

**Dependencies:** None (foundation epic)

---

### Epic 2: Finalization & Scoring

**Goal:** After the conversation threshold is reached, the system produces accurate personality scores with full evidence.

**FRs:** FR5.1, FR6, FR7.2, FR8, FR9, FR10, FR11, FR30, FR31, FR32, FR33, FR34, FR35

**Scope:**
- Frontend finalization trigger — sendMessage returns `{ response, isFinalTurn }` at MESSAGE_THRESHOLD
- Frontend navigates to auth gate → wait screen → POST /generate-results
- FinAnalyzer (Sonnet) full-context re-analysis of ALL messages into finalization_evidence (rich schema: rawDomain, quote, highlightStart, highlightEnd)
- Score computation: facet scores from context-weighted formulas, trait scores from facet averages via FACET_TO_TRAIT lookup
- OCEAN code generation (5-letter deterministic code from 30 facet scores)
- Archetype lookup: 4-letter code → archetype name + description (~25-30 hand-curated + component-based for 81 total)
- 30 facet level names aligned with results
- Three-tier idempotency for generateResults
- Two-phase finalization: Phase 1 (FinAnalyzer → evidence), Phase 2 (scores + portrait → results)
- Finalization progress polling (analyzing → generating_portrait → completed)
- One session per user (lifetime) via partial unique index
- Session re-entry routing: active → chat, finalizing → wait screen, completed → results

**NFRs:** NFR7, NFR9, NFR10, NFR14, NFR24-27

**Dependencies:** Epic 1

---

### Epic 3: Results Experience

**Goal:** User sees their personality results with interactive evidence exploration and a teaser portrait.

**FRs:** FR6.1, FR6.2, FR17, FR17.1, FR17.2, FR18, FR19, FR36, FR38, FR39

**Scope:**
- Three-beat results page: payoff → two doors → social artifact
- ArchetypeHeroSection, OceanCodeStrand, PersonalityRadarChart, ConfidenceRingCard, TraitCard ×5
- Bidirectional evidence highlighting:
  - Facet → quotes: click any facet score to view evidence panel with supporting quotes
  - Message → facets: click any message to see which facets it contributed to
  - "Jump to Message" scrolls to and highlights exact quote
  - Color-coded highlighting (green/yellow/red) with opacity for confidence
  - Character-level highlightRange for precise text highlighting
- Teaser portrait generation (Haiku, synchronous ~2-3s): named tensions + locked section titles
- Portraits table (FK → assessment_results, UNIQUE per tier)
- Portrait status derived from data (none/teaser/generating/ready/failed)
- TeaserPortrait component with inline Reveal button
- Founder portrait as conversion proof
- Portrait reading mode (?view=portrait)

**NFRs:** NFR3, NFR8, NFR17-20, NFR24

**Dependencies:** Epic 2

---

### Epic 4: Monetization & Full Portrait

**Goal:** Users can unlock their full personality portrait through pay-what-you-want, and the system generates it asynchronously.

**FRs:** FR37, FR40, FR41, FR42, FR43, FR45, FR46, FR47, FR48

**Scope:**
- Polar.sh embedded checkout overlay for PWYW portrait unlock (min €1)
- Append-only purchase_events table with 8 event types
- Capabilities derived from events (no mutable counters)
- HMAC webhook verification + polar_checkout_id UNIQUE
- Double-payment prevention (frontend + backend)
- Full Sonnet/Opus portrait generated async via forkDaemon ("Spine" architecture)
- Placeholder row pattern for forkDaemon
- Polling via TanStack Query refetchInterval while generating
- Auto-retry (max 3) + lazy retry via polling staleness check
- PersonalPortrait component (same component as teaser, different content)
- Provider-prefixed fields (polar_*)

**NFRs:** NFR15, NFR22, NFR24

**Dependencies:** Epic 3

---

### Epic 5: Relationship Analysis

**Goal:** Users can invite others to compare personalities and receive a relationship analysis.

**FRs:** FR44, FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR60, FR61

**Scope:**
- Relationship credits: 1 free/user (lifetime), singles €5, 5-packs €15 (via Polar.sh)
- Transaction boundaries: credit_consumed + invitation in single transaction
- Invitation system: 1 credit = 1 shareable link (UUID v4, 30-day expiry)
- Invitee flow: link → anonymous Nerin conversation → signup → notification pin + accept/refuse
- Pair deduplication (canonical MIN/MAX ordering), multiple analyses per pair via UNIQUE(invitation_id)
- Relationship analysis (Sonnet/Opus) using both users' facet data + finalization evidence
- Accept triggers forkDaemon with placeholder row. Refuse = credit not refunded
- Both participants access independently. "Read together" = nudge, not gate
- Existing-user invitees reuse existing assessment
- Invitation token in httpOnly cookie, cleared after linking
- InvitationBottomSheet: QR code + copy link + native share + editable message
- Notification pin on header avatar for pending invitations
- RelationshipInviteNudge (results page) + RelationshipCard (profile page, 7 states)

**NFRs:** NFR14, NFR15, NFR24

**Dependencies:** Epic 4 (payment infrastructure), Epic 2 (assessment data)

---

### Epic 6: Growth & Operational Safety

**Goal:** Viral sharing mechanics and budget protection keep the platform growing sustainably.

**FRs:** FR13, FR14, FR15, FR26, FR58, FR59, FR62, FR63

**Scope:**
- Shareable profile with archetype code, name, trait summary, facet insights
- Unique profile URL for each completed assessment
- Default-private profiles with explicit user control
- Audit logging for profile access
- Archetype card generation (Satori JSX → SVG → PNG) in 9:16 + 1:1 formats
- Cache-Control immutable + content-hashed URLs
- ShareProfileSection, QuickActionsCard, ArchetypeShareCard preview
- Waitlist/circuit breaker via atomic Redis global daily assessment count
- waitlist_emails table

**NFRs:** NFR12, NFR23, NFR24

**Dependencies:** Epic 2 (assessment results for profile), Epic 1 (Redis infrastructure for waitlist)

---

### Epic 7: Privacy & Compliance (Phase 2)

**Goal:** Full GDPR compliance for EU market expansion.

**FRs:** FR20, FR21, FR22

**Scope:**
- AES-256-GCM encryption at rest for personality data
- GDPR deletion endpoints (right to erasure)
- GDPR data portability endpoints (right to data portability)
- Comprehensive audit logging

**NFRs:** NFR11, NFR12

**Dependencies:** Epics 1-6 (all core features must exist before compliance layer)

---

## Epic 1: Conversational Assessment — Stories

### Story 1.1: Assessment Pipeline Schema & Migration

As a developer,
I want the new assessment pipeline database schema in place,
So that conversation evidence, sessions, and messages can be stored with the new two-tier architecture.

**Acceptance Criteria:**

**Given** the existing legacy assessment tables exist in the database
**When** the migration runs
**Then** legacy assessment tables are dropped and new tables are created: assessment_sessions, assessment_messages, conversation_evidence
**And** pgEnums are created for domain_enum (work, relationships, family, leisure, solo, other) and bigfive_facet_enum (all 30 facets) using the as-const → type → Schema → pgEnum pattern
**And** conversation_evidence has columns: id, session_id (FK), message_id (FK), bigfive_facet (pgEnum), score (numeric), confidence (numeric), domain (pgEnum), created_at
**And** conversation_evidence enforces max 3 records per message via application logic
**And** assessment_sessions has columns: id, user_id (nullable FK), status enum (active, finalizing, completed), created_at, updated_at
**And** assessment_messages has columns: id, session_id (FK), role enum (user, assistant), content (text), message_number (integer), created_at
**And** evidence mapper types are defined in domain package: conversationToEvidenceInput() type signature
**And** all new repository interfaces are defined in packages/domain/src/repositories/ as Context.Tag: ConversationEvidenceRepository, AssessmentResultRepository
**And** migration is reversible

---

### Story 1.2: Anonymous Session & Auth Foundation

As a user,
I want to start an assessment without signing up,
So that I can try the experience frictionlessly.

**Acceptance Criteria:**

**Given** a new visitor arrives at the assessment page
**When** they begin the assessment
**Then** an anonymous session is created with an httpOnly cookie (FR65)
**And** the session is persisted server-side with status "active"

**Given** a user wants to create an account
**When** they register with email and password
**Then** the account is created via Better Auth with password validation (12+ chars, compromised credential checks) (FR64)

**Given** an anonymous user with an active session
**When** they authenticate (register or login)
**Then** the anonymous session is linked to their user_id with token rotation (FR66)
**And** only one active session per user_id exists via partial unique index (FR67)

**Given** a user who previously started an assessment
**When** they log in on a different device
**Then** they can resume their existing session via URL-based resumption (FR23, FR24)

---

### Story 1.3: Chat UI with Streaming

As a user,
I want to send messages and see Nerin's responses stream in real-time,
So that the conversation feels natural and responsive.

**Acceptance Criteria:**

**Given** a user is on the chat page with an active session
**When** they type a message and send it
**Then** the message appears immediately in the chat (optimistic update, FR25)
**And** Nerin's response streams in token-by-token in real-time (FR2)

**Given** an active assessment session
**When** any message is sent
**Then** a progress indicator displays current message count toward MESSAGE_THRESHOLD (e.g., "5 of 25") (FR4)

**Given** a user with a paused session
**When** they navigate to the chat URL with their sessionId
**Then** previous messages are loaded and the conversation resumes from where they left off (FR3, FR23)

**Given** the chat is displayed on a mobile device (375px minimum)
**When** the user interacts with the chat
**Then** all touch targets are >= 44px and the UI is fully responsive (NFR18, NFR19)

---

### Story 1.4: Sequential Effect Pipeline & Nerin Integration

As a user,
I want to have a natural personality conversation with Nerin,
So that I can be assessed through dialogue.

**Acceptance Criteria:**

**Given** a user sends a message in an active session
**When** the sendMessage use-case executes
**Then** it runs a sequential Effect.gen pipeline (no LangGraph) and returns `{ response }` (FR1)
**And** the Nerin response time is < 2s at P95 (NFR1)

**Given** the session is in messages 1-3 (cold start)
**When** a message is processed
**Then** Nerin uses a greeting seed from a rotating pool instead of steering data
**And** no ConversAnalyzer or steering runs

**Given** the session is past message 3
**When** a message is processed
**Then** Nerin receives (targetDomain, targetFacet) with a hint derived at runtime
**And** the pipeline executes: ConversAnalyzer → formulas → steering → Nerin

**Given** the Effect pipeline encounters an error
**When** a pipeline step fails
**Then** an OrchestrationError is returned with structured error details
**And** the session state is preserved for retry

---

### Story 1.5: ConversAnalyzer Haiku Integration

As the system,
I want to extract personality signals from every message in real-time,
So that steering and scoring have continuous data.

**Acceptance Criteria:**

**Given** a user sends a message (past cold start, message > 3)
**When** the ConversAnalyzer runs
**Then** it calls Haiku synchronously and extracts up to 3 facet signal records per message (FR5)
**And** each record contains: bigfive_facet, score (0-20), confidence (0.0-1.0), domain (enum)

**Given** the ConversAnalyzer produces evidence
**When** evidence is persisted
**Then** each record is tagged with the hard domain enum (work, relationships, family, leisure, solo, other) (FR7.1)

**Given** a message spans multiple life domains (e.g., "I'm organized at work but chaotic at home")
**When** the ConversAnalyzer processes it
**Then** separate evidence records are generated for each relevant domain (FR7.3)

**Given** the ConversAnalyzer call takes longer than 1.5s
**When** the timeout is reached
**Then** the system falls back gracefully (skips analysis for this message) without blocking Nerin's response (NFR6)
**And** the fallback is logged for monitoring

---

### Story 1.6: Formula Functions & Confidence Scoring

As the system,
I want pure domain formula functions for facet metrics,
So that scores are computed deterministically from evidence.

**Acceptance Criteria:**

**Given** a set of conversation_evidence records for a facet
**When** the facet score is computed
**Then** it uses context-weighted formulas with sqrt anti-redundancy to penalize redundant same-domain signals (FR5.2)
**And** the formula is a pure function taking (evidence[], config) with no side effects

**Given** evidence accumulates across messages
**When** confidence is calculated for a facet
**Then** it uses exponential confidence saturation approaching 1.0 asymptotically (FR7)
**And** confidence never exceeds 1.0

**Given** evidence spans multiple domains for a facet
**When** signal power is computed
**Then** it uses cross-context entropy to reward diverse domain coverage (FR5.2)

**Given** the formula module
**When** it is initialized
**Then** FORMULA_DEFAULTS is frozen via Object.freeze and exported from `packages/domain/src/utils/formula.ts` (NFR25)
**And** all formula functions accept config as a parameter (overridable for testing)

**Given** formula functions are called with identical inputs
**When** run multiple times
**Then** they produce identical outputs (deterministic, no randomness)

---

### Story 1.7: Formula-Driven Steering

As the system,
I want to steer Nerin toward underexplored facets and domains,
So that the assessment achieves balanced coverage.

**Acceptance Criteria:**

**Given** evidence exists for multiple facets after message 3
**When** the steering target is computed
**Then** it selects the target facet and target domain via expected signal power gain maximization (FR5.3)
**And** a switch cost penalty is applied to discourage rapid topic changes

**Given** a steering target is computed
**When** it is passed to Nerin
**Then** Nerin receives (targetDomain, targetFacet) and a natural language hint is derived at runtime
**And** Nerin's response naturally guides the conversation toward the target domain

**Given** a new session with fewer than 4 messages
**When** steering is requested
**Then** no steering is applied (cold start returns null target)

**Given** evidence heavily covers one domain (e.g., "work") but not others
**When** steering computes the next target
**Then** the expected signal power gain favors underrepresented domains

---

### Story 1.8: Cost Tracking & Rate Limiting

As the system,
I want to enforce budget and rate limits,
So that costs stay within bounds.

**Acceptance Criteria:**

**Given** a user sends a message
**When** the LLM processes it (Nerin + ConversAnalyzer)
**Then** the token usage is calculated and cost is tracked per user/session (FR27)
**And** cost is stored atomically in Redis with daily TTL

**Given** a user tries to start a new assessment
**When** they have already started one today
**Then** the request is rejected with HTTP 429 and a resetAt timestamp for next day midnight UTC (FR28)
**And** they can still resume an existing assessment

**Given** a user sends a message
**When** the daily cost budget ($75) would be exceeded by this message
**Then** the request is rejected with BudgetPausedError (HTTP 503) including resumeAfter timestamp (FR29)
**And** the session state is preserved for resumption next day

**Given** a new session starts
**When** the session is created
**Then** a $0.30 budget reservation is applied at session start

**Given** a user sends messages
**When** rate limiting is checked
**Then** no more than 2 messages per minute are allowed (FR28)

**Given** any cost or rate limit event occurs
**When** it is processed
**Then** structured logging captures userId, costCents, dateKey, and relevant counters for analytics

---

## Epic 2: Finalization & Scoring — Stories

### Story 2.1: Finalization Trigger & Auth Gate

As a user,
I want the system to detect when my assessment is complete and guide me to results,
So that I seamlessly transition from conversation to personality insights.

**Acceptance Criteria:**

**Given** a user sends a message that reaches MESSAGE_THRESHOLD
**When** the sendMessage use-case processes it
**Then** the response includes `{ response, isFinalTurn: true }` (FR30)
**And** the session status is updated to "finalizing"

**Given** an anonymous user receives isFinalTurn
**When** the frontend processes the response
**Then** it navigates the user to an auth gate requiring registration/login before proceeding (FR30)
**And** after auth, the user is redirected to the wait screen

**Given** an authenticated user receives isFinalTurn
**When** the frontend processes the response
**Then** it navigates directly to the wait screen and POSTs /generate-results (FR30)

**Given** a user_id already has a completed session
**When** they try to start a new assessment
**Then** the request is rejected — one session per user lifetime via partial unique index (FR34)

**Given** a user navigates to the app
**When** their session status is checked
**Then** active → chat page, finalizing → wait screen, completed → results page (FR35)

---

### Story 2.2: FinAnalyzer Sonnet Integration

As the system,
I want to re-analyze all conversation messages with full context at finalization,
So that personality evidence is comprehensive and richly detailed.

**Acceptance Criteria:**

**Given** generateResults is triggered for a session
**When** Phase 1 of finalization executes
**Then** FinAnalyzer (Sonnet) re-analyzes ALL messages with full conversation context (FR5.1)
**And** results are stored in finalization_evidence table

**Given** FinAnalyzer processes messages
**When** evidence records are created
**Then** each record contains the rich schema: bigfive_facet, score, confidence, domain, rawDomain (free-text), quote (exact text), highlightStart (integer), highlightEnd (integer) (FR5.1, FR7.2)

**Given** a message contains multiple personality signals
**When** FinAnalyzer extracts them
**Then** separate finalization_evidence records are created for each signal
**And** character-level highlight ranges accurately identify the relevant quote portions

**Given** the finalization_evidence table
**When** records are created
**Then** they reference both the session_id and message_id as foreign keys
**And** the FinAnalyzer repository interface is defined as Context.Tag in domain package

---

### Story 2.3: Score Computation & OCEAN Code Generation

As a user,
I want accurate personality scores computed from all evidence,
So that my Big Five profile reflects the full assessment.

**Acceptance Criteria:**

**Given** finalization_evidence exists for a session
**When** Phase 2 of finalization computes scores
**Then** facet scores are calculated from finalization_evidence using the context-weighted formula functions (from Story 1.6)
**And** all 30 facet scores are stored in assessment_results (FR6)

**Given** 30 facet scores are computed
**When** trait scores are derived
**Then** each of the 5 trait scores is the average of its 6 contributing facets via FACET_TO_TRAIT lookup (FR6)
**And** trait confidence is the mean across contributing facet confidences (FR7)

**Given** 30 facet scores exist
**When** the OCEAN code is generated
**Then** each trait is summed (0-120 range), mapped to level (0-40=L, 40-80=M, 80-120=H), and concatenated in OCEAN order (FR8)
**And** the result is a deterministic 5-letter code (e.g., "HHMHM") (NFR10)

**Given** facet scores are stored
**When** results are finalized
**Then** per-facet confidence scores (0.0-1.0) are stored alongside the scores (FR7)

---

### Story 2.4: Archetype System

As a user,
I want to receive a memorable archetype name and see detailed facet labels,
So that my personality profile feels personal and understandable.

**Acceptance Criteria:**

**Given** a 5-letter OCEAN code is generated
**When** the archetype is looked up
**Then** the 4-letter code (O-C-E-A, excluding N) maps to an archetype name from ~25-30 hand-curated entries (FR9)
**And** codes without a curated entry use component-based name generation (81 total combinations)

**Given** an archetype is resolved
**When** the result is returned
**Then** it includes the archetype name + 2-3 sentence description (FR10)
**And** lookup completes in < 100ms (NFR9)

**Given** assessment results are finalized
**When** facet-level results are displayed
**Then** all 30 facet level names are shown aligned with the user's scores (FR11)
**And** each facet name corresponds to the L/M/H level for that facet

---

### Story 2.5: Finalization Pipeline Orchestration

As the system,
I want the finalization pipeline to be idempotent and observable,
So that results are generated reliably even under retries or failures.

**Acceptance Criteria:**

**Given** generateResults is called for a session
**When** the session already has completed results
**Then** the existing results are returned without re-processing (three-tier idempotency, FR31)

**Given** generateResults is called
**When** another request for the same session is in progress
**Then** the duplicate request is rejected via pg_try_advisory_lock (NFR14)
**And** the caller receives the current finalization status

**Given** generateResults begins
**When** it executes
**Then** Phase 1 runs first (FinAnalyzer → finalization_evidence), then Phase 2 (scores + teaser portrait → assessment_results) (FR32)
**And** each phase is atomic — partial phase failure rolls back that phase only

**Given** a session is in "finalizing" status
**When** the frontend polls for progress
**Then** it receives status: analyzing → generating_portrait → completed (FR33)
**And** total finalization time is 15-20s (NFR7)

**Given** Phase 1 fails mid-execution
**When** generateResults is retried
**Then** it detects incomplete Phase 1 and re-runs it from scratch (idempotent)
**And** Phase 2 only runs after Phase 1 succeeds

---

## Epic 3: Results Experience — Stories

### Story 3.1: Results Page & Trait Display

As a user,
I want to see my personality results in an engaging, interactive layout,
So that I understand my Big Five profile at a glance.

**Acceptance Criteria:**

**Given** a user navigates to the results page after finalization completes
**When** the page loads
**Then** it follows the three-beat structure: payoff → two doors → social artifact
**And** the page loads in < 1s (NFR3)

**Given** the results page renders
**When** the ArchetypeHeroSection displays
**Then** it shows the user's archetype name, 5-letter OCEAN code, and 2-3 sentence description prominently

**Given** results data is available
**When** the OceanCodeStrand renders
**Then** it displays the 5-letter code with each letter visually linked to its trait and L/M/H level

**Given** results data is available
**When** the PersonalityRadarChart renders
**Then** it displays a radar/spider chart with 5 axes for OCEAN traits, scaled to the user's scores

**Given** results data is available
**When** ConfidenceRingCards render
**Then** each of the 5 traits shows a ring visualization reflecting its confidence level (0.0-1.0)

**Given** results data is available
**When** TraitCards render (×5)
**Then** each card shows the trait name, score, confidence, and its 6 contributing facets with individual scores
**And** all 30 facet level names are visible aligned with results

**Given** the results page is viewed on mobile (375px min)
**When** components render
**Then** they are fully responsive with touch targets >= 44px (NFR18, NFR19)
**And** the page is WCAG 2.1 Level AA compliant (NFR17)

---

### Story 3.2: Bidirectional Evidence Highlighting

As a user,
I want to explore the evidence behind my scores by clicking facets or messages,
So that I can understand why I received each score.

**Acceptance Criteria:**

**Given** a user is on the results page
**When** they click any facet score on a TraitCard
**Then** an evidence panel opens showing all supporting quotes from finalization_evidence for that facet (FR17, FR6.1)
**And** each quote shows the message text with the relevant portion highlighted

**Given** the evidence panel is open for a facet
**When** quotes are displayed
**Then** highlighting uses color coding: green (high confidence), yellow (medium), red (low) with opacity proportional to confidence (FR17.2)
**And** highlighting uses character-level highlightStart/highlightEnd for precise text marking (FR19)

**Given** a quote is displayed in the evidence panel
**When** the user clicks "Jump to Message"
**Then** the view scrolls to the original message in the conversation transcript and highlights the exact quote (FR17.1)

**Given** a user views the conversation transcript
**When** they click any message
**Then** a panel shows which facets that message contributed to, with scores and confidence (FR18, FR6.2)

**Given** evidence highlighting is active
**When** multiple facets have evidence from the same message
**Then** highlights are layered without visual conflict and each facet's contribution is distinguishable

---

### Story 3.3: Teaser Portrait Generation & Display

As a user,
I want to see a teaser portrait that previews my personality narrative,
So that I'm intrigued to unlock the full portrait.

**Acceptance Criteria:**

**Given** finalization Phase 2 runs
**When** the teaser portrait is generated
**Then** Haiku generates it synchronously in < 3s (FR36, NFR8)
**And** it includes named tensions (e.g., "The Structured Dreamer") and locked section titles

**Given** a teaser portrait is generated
**When** it is stored
**Then** it is saved in the portraits table with FK → assessment_results and UNIQUE constraint per tier (FR38)
**And** the tier is set to "teaser"

**Given** the portraits table for a session
**When** portrait status is queried
**Then** status is derived from data: none (no row), teaser (teaser row exists), generating (placeholder row for full), ready (full row with content), failed (full row with error) (FR39)

**Given** a user views the results page
**When** the TeaserPortrait component renders
**Then** it displays named tensions and locked section titles with a visible "Reveal Full Portrait" button
**And** locked sections show enough to intrigue but not the full content

**Given** a founder's completed assessment exists
**When** the results page renders for any user
**Then** the founder's portrait is shown as conversion proof (social proof element)

**Given** a user navigates to their results URL with ?view=portrait
**When** the page loads
**Then** it renders in portrait reading mode (focused on portrait content, minimal chrome)

---

## Epic 4: Monetization & Full Portrait — Stories

### Story 4.1: Purchase Events Schema & Capability Derivation

As the system,
I want an append-only event log for all purchases,
So that user capabilities are derived from immutable records rather than mutable counters.

**Acceptance Criteria:**

**Given** the purchase system needs to track transactions
**When** the schema is created
**Then** an append-only purchase_events table exists with 8 event types (e.g., portrait_unlocked, relationship_credit_purchased, relationship_pack_purchased, credit_consumed, etc.) (FR45)
**And** provider-prefixed fields (polar_checkout_id, polar_customer_id, etc.) are included
**And** polar_checkout_id has a UNIQUE constraint

**Given** a user has purchase events
**When** their capabilities are queried
**Then** capabilities are derived by aggregating events (e.g., portrait_unlocked count > 0 → has portrait access; credit_purchased - credit_consumed = available credits) (FR46)
**And** no mutable counter columns exist — all state is derived from the event log

**Given** the purchase_events table
**When** a record is inserted
**Then** it is immutable — no UPDATE or DELETE operations are permitted on purchase_events
**And** each record includes: id, user_id, event_type, amount_cents, currency, polar_checkout_id (nullable), metadata (jsonb), created_at

**Given** the PurchaseEvent repository
**When** it is defined
**Then** it follows the Context.Tag pattern in domain package with methods: recordEvent(), getCapabilities(userId), getEventsByUser(userId)

---

### Story 4.2: Polar.sh Checkout & Webhook Integration

As a user,
I want to pay what I want to unlock my full portrait,
So that I can access my complete personality narrative at a price I choose.

**Acceptance Criteria:**

**Given** a user clicks "Reveal Full Portrait" on the teaser
**When** the checkout flow initiates
**Then** a Polar.sh embedded checkout overlay appears with PWYW (minimum €1) (FR43)
**And** the overlay is rendered using @polar-sh/checkout

**Given** the frontend is about to open checkout
**When** it checks purchase status
**Then** if the user already has a portrait_unlocked event, checkout is skipped and portrait generation starts directly (double-payment prevention frontend, FR48)

**Given** a user completes payment on Polar.sh
**When** the webhook fires to the backend
**Then** the webhook payload is verified via HMAC signature (FR47, NFR15)
**And** a purchase_event with type portrait_unlocked is recorded
**And** if polar_checkout_id already exists (duplicate webhook), the event is silently ignored (double-payment prevention backend, FR48)

**Given** the webhook handler receives an event
**When** it processes the payment
**Then** it runs within a transaction boundary to ensure atomicity
**And** the PaymentGateway repository interface abstracts Polar-specific logic behind Context.Tag

---

### Story 4.3: Full Portrait Async Generation

As a user,
I want my full personality portrait generated after payment,
So that I receive a rich, detailed narrative about my personality.

**Acceptance Criteria:**

**Given** a portrait_unlocked purchase event is recorded
**When** full portrait generation begins
**Then** a placeholder row is inserted in the portraits table with tier="full", content=null (FR40)
**And** a forkDaemon is spawned to generate the portrait asynchronously using Sonnet/Opus (FR37)

**Given** the forkDaemon generates the portrait
**When** generation completes successfully
**Then** the placeholder row is UPDATEd with the full portrait content using the "Spine" architecture
**And** the PersonalPortrait component renders the same layout as TeaserPortrait but with full unlocked content

**Given** a user is waiting for portrait generation
**When** the frontend polls for status
**Then** TanStack Query uses refetchInterval to poll the portrait status endpoint (FR41)
**And** polling continues while status is "generating" and stops when "ready" or "failed"

**Given** portrait generation fails
**When** the error is detected
**Then** the system auto-retries up to 3 times (FR42)
**And** if all retries fail, a lazy retry is available via polling staleness check (user revisits → detects stale "generating" → re-triggers)

**Given** the full portrait is ready
**When** the user views it
**Then** the PersonalPortrait component displays the complete narrative (same component as teaser, different content) (NFR22)

---

## Epic 5: Relationship Analysis — Stories

### Story 5.1: Relationship Credits & Purchase Flow

As a user,
I want to purchase relationship analysis credits,
So that I can invite others to compare our personalities.

**Acceptance Criteria:**

**Given** a new user with a completed assessment
**When** their relationship credits are checked
**Then** they have 1 free credit (lifetime, derived from absence of credit_consumed events) (FR44)

**Given** a user wants more credits
**When** they purchase via Polar.sh
**Then** single credits cost €5 and 5-packs cost €15 (FR44)
**And** a purchase_event with type relationship_credit_purchased (or relationship_pack_purchased) is recorded
**And** the checkout uses the same Polar embedded overlay as portrait unlock

**Given** a user has credits
**When** their available count is queried
**Then** it is derived from events: sum(credits_purchased) + 1(free) - sum(credits_consumed) (FR46)
**And** no mutable counter is used

---

### Story 5.2: Invitation System

As a user,
I want to send a relationship analysis invitation to someone,
So that we can compare our personality profiles.

**Acceptance Criteria:**

**Given** a user has available relationship credits (>= 1)
**When** they create an invitation
**Then** 1 credit is consumed and 1 shareable link is generated (UUID v4, 30-day expiry) (FR50)
**And** credit_consumed event + invitation creation happen in a single transaction (FR49)

**Given** an invitation is created
**When** the user views the sharing interface
**Then** InvitationBottomSheet displays: QR code, copy link button, native share button, editable message (FR60)

**Given** an invitation link exists
**When** 30 days pass without acceptance
**Then** the invitation expires and cannot be used
**And** the credit is not refunded (FR50)

**Given** the relationship_invitations table
**When** a record is created
**Then** it includes: id, inviter_user_id, invitation_token (UUID v4, UNIQUE), status (pending/accepted/refused/expired), expires_at, created_at

---

### Story 5.3: Invitee Assessment Flow

As an invitee,
I want to complete my own personality assessment after clicking an invitation link,
So that a relationship analysis can be generated from both our profiles.

**Acceptance Criteria:**

**Given** a person clicks an invitation link
**When** the link is valid and not expired
**Then** the invitation token is stored in an httpOnly cookie (FR57)
**And** if they are not an existing user, they begin an anonymous Nerin conversation (FR51)

**Given** an invitee completes their assessment
**When** they are prompted to sign up
**Then** after registration, the invitation token cookie is linked to their user_id and cleared (FR57)
**And** a notification pin appears on the inviter's header avatar (FR61)

**Given** an existing user clicks an invitation link
**When** they are already authenticated with a completed assessment
**Then** they reuse their existing assessment — no new conversation required (FR56)
**And** the invitation is linked directly to their existing profile

**Given** pair deduplication
**When** two users have an invitation between them
**Then** pairs are stored with canonical MIN/MAX user_id ordering (FR52)
**And** multiple analyses per pair are allowed via UNIQUE(invitation_id) (FR52)

---

### Story 5.4: Relationship Analysis Generation

As a user,
I want to see how my personality compares with someone I invited,
So that I gain insight into our relationship dynamics.

**Acceptance Criteria:**

**Given** an invitee has completed their assessment
**When** they accept the invitation (via notification)
**Then** a forkDaemon is spawned with a placeholder row in relationship_analyses (FR54)
**And** the analysis uses Sonnet/Opus with both users' facet data + finalization evidence (FR53)

**Given** an invitee refuses the invitation
**When** they click refuse
**Then** the invitation status is set to "refused"
**And** the credit is not refunded (FR54)

**Given** a relationship analysis is generated
**When** both participants view it
**Then** each can access independently — "Read together" is a nudge, not a gate (FR55)

**Given** a pending invitation exists
**When** the inviter views their profile
**Then** a RelationshipCard component renders with the appropriate state (7 possible states: pending, accepted, generating, ready, refused, expired, failed) (from UX spec)
**And** the RelationshipInviteNudge appears on the results page

**Given** a notification pin exists
**When** the inviter clicks the header avatar notification
**Then** they see pending invitations with accept/refuse options (FR61)

---

## Epic 6: Growth & Operational Safety — Stories

### Story 6.1: Shareable Profile & Public URL

As a user,
I want a shareable profile page with a unique URL,
So that I can share my personality results with others.

**Acceptance Criteria:**

**Given** a user has completed their assessment
**When** results are finalized
**Then** a unique profile URL is generated for their assessment (FR14)

**Given** a profile exists
**When** it is created
**Then** it is private by default — not discoverable publicly (FR15)
**And** the user has explicit controls to toggle visibility

**Given** a user shares their profile URL
**When** someone visits it
**Then** they see the archetype code, name, trait summary, and facet insights (FR13)
**And** the profile page loads in < 1s (NFR3)

**Given** any profile is accessed
**When** the page loads
**Then** an audit log entry is created recording the access (FR26)
**And** zero unauthorized profile access is permitted — private profiles return 403 to non-owners (NFR12)

**Given** the profile page
**When** it renders
**Then** it includes ShareProfileSection and QuickActionsCard components

---

### Story 6.2: Archetype Card Generation

As a user,
I want a shareable archetype card image,
So that I can post my personality type on social media.

**Acceptance Criteria:**

**Given** a user has a completed assessment with an archetype
**When** they request their archetype card
**Then** the system generates it using Satori (JSX → SVG) + @resvg/resvg-js (SVG → PNG) (FR58)
**And** cards are generated in both 9:16 (stories) and 1:1 (posts) formats

**Given** an archetype card is generated
**When** it is served
**Then** Cache-Control is set to immutable with content-hashed URLs (FR59, NFR23)
**And** subsequent requests for the same card are served from cache

**Given** the card generation pipeline
**When** the CardGenerator repository is defined
**Then** it follows Context.Tag pattern with methods: generateCard(assessmentResultId, format) → PNG buffer

**Given** the ArchetypeShareCard component
**When** it renders on the results page
**Then** it shows a preview of both card formats with download/share options

---

### Story 6.3: Waitlist & Circuit Breaker

As the system,
I want a global daily assessment limit with waitlist fallback,
So that costs are controlled during early growth.

**Acceptance Criteria:**

**Given** the platform is running
**When** the daily global assessment count reaches the configured limit
**Then** new assessments are blocked via circuit breaker (FR62)
**And** the count is tracked atomically in Redis

**Given** a new user arrives when the circuit breaker is active
**When** they try to start an assessment
**Then** they are shown a waitlist signup form
**And** their email is stored in the waitlist_emails table (FR63)

**Given** the waitlist_emails table
**When** a record is created
**Then** it includes: id, email (UNIQUE), created_at
**And** no duplicate emails are stored

**Given** a new day begins (UTC midnight)
**When** the Redis counter resets (TTL expiry)
**Then** the circuit breaker automatically reopens
**And** waitlisted users can be notified (future feature, not in scope for this story)

---

## Epic 7: Privacy & Compliance (Phase 2) — Stories

### Story 7.1: Encryption at Rest

As a user,
I want my personality data encrypted at rest,
So that my sensitive psychological profile is protected even if the database is compromised.

**Acceptance Criteria:**

**Given** personality data is stored (assessment_results, finalization_evidence, portraits, relationship_analyses)
**When** data is written to the database
**Then** sensitive fields are encrypted using AES-256-GCM before storage
**And** encryption keys are managed securely (not stored alongside data)

**Given** encrypted data exists
**When** it is read by the application
**Then** it is transparently decrypted for authorized access
**And** decryption failures are logged and surfaced as errors

**Given** the encryption implementation
**When** it is reviewed
**Then** it follows TLS 1.3 in transit (NFR11) combined with AES-256-GCM at rest for defense in depth

---

### Story 7.2: GDPR Deletion & Portability

As a user,
I want to delete my data or export it,
So that I have control over my personal information as required by GDPR.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they request data deletion (right to erasure)
**Then** all their personal data is permanently removed: assessment_sessions, assessment_messages, conversation_evidence, finalization_evidence, assessment_results, portraits, relationship data, purchase_events (anonymized, not deleted)
**And** deletion is confirmed within 30 days as required by GDPR

**Given** an authenticated user
**When** they request data portability
**Then** they receive a machine-readable export (JSON) of all their personal data
**And** the export includes: assessment messages, trait/facet scores, evidence, portraits, relationship analyses

**Given** a deletion request
**When** it is processed
**Then** cascade deletion handles all related records
**And** an audit log entry records the deletion request and completion

---

### Story 7.3: Comprehensive Audit Logging

As the system,
I want comprehensive audit logs for all data access and modifications,
So that compliance can be demonstrated and security incidents investigated.

**Acceptance Criteria:**

**Given** any access to personality data occurs
**When** the access is logged
**Then** the audit log captures: who (user_id), what (resource type + id), action (read/write/delete), when (timestamp), from where (IP, user agent)

**Given** audit logs exist
**When** they are queried for compliance reporting
**Then** they can be filtered by user_id, resource type, action, and date range
**And** logs are retained for the period required by GDPR (minimum duration TBD by legal review)

**Given** the audit logging system
**When** it is implemented
**Then** it does not impact request latency (async logging)
**And** logs are stored separately from application data for security
