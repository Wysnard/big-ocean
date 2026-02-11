---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "prd.md"
  - "architecture.md"
  - "ux-design-specification.md"
workflowType: "epics-and-stories"
project_name: "big-ocean"
user_name: "Vincentlay"
date: "2026-01-30"
---

# big-ocean - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for big-ocean, decomposing the requirements from the PRD, UX Design, and Architecture decisions into implementable stories.

---

## Requirements Inventory

### Functional Requirements

**FR1:** System conducts multi-turn conversational personality assessment with Nerin agent for minimum 30 minutes

**FR2:** System accepts user messages and returns contextually relevant responses in real-time (streaming)

**FR3:** System allows users to pause assessment and resume later from exact conversation point

**FR4:** System displays real-time progress indicator showing percentage completion (0-100%)

**FR5:** System analyzes conversation to extract and score all 30 Big Five facets (0-20 scale per facet, 6 facets per trait)

**FR6:** System calculates Big Five trait scores as the sum of their related facets (trait score = sum of 6 facets, 0-120 per trait: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)

**FR7:** System maintains and updates trait precision/confidence score (0-100%) throughout conversation

**FR8:** System generates 4-letter OCEAN archetype code based on trait levels from Openness, Conscientiousness, Extraversion, Agreeableness (each: Low/Mid/High)

**FR9:** System maps OCEAN codes to memorable character archetype names: ~25-30 hand-curated names + component-based generation for remaining combinations

**FR10:** System retrieves archetype name + 2-3 sentence trait description explaining the personality combination

**FR11:** System displays all 24 facet level names (Low/High pairs for 4 traits) aligned with user's assessment results on request

**FR12 (Phase 2):** System extends to 5 traits (adding Neuroticism) and generates detailed archetype codes (XX-XX-XX-XX-XX) post-POC validation

**FR13:** System generates shareable profile with archetype code, character name, trait summary, and facet insights

**FR14:** System creates unique profile URL for each completed assessment (encrypted, shareable only via explicit link)

**FR15:** System displays profile as private by default with explicit user control for sharing

**FR16:** System allows users to download/export assessment results in human-readable format

**FR17:** System stores complete conversation history encrypted at rest with user data

**FR18:** System encrypts all data in transit (TLS 1.3 minimum)

**FR19:** System provides data deletion and portability capabilities per GDPR Article 17, 20

**FR20:** System logs all profile access with timestamp, user, and request type for audit trail

**FR21:** System maintains full session state on server with resumption via session ID (device switching via URL)

**FR22:** System maintains session state across device switches without data loss via session URL (loads full conversation history in <1 second when resuming)

**FR23:** System implements optimistic updates for instant UI feedback (user message appears immediately, synced on server response)

**FR24:** System monitors LLM costs per user and session in real-time

**FR25:** System implements rate limiting (1 assessment per user per day, 1 resume per week)

**FR26:** System auto-disables assessment if daily LLM cost threshold exceeded with graceful degradation message

### Non-Functional Requirements

**NFR1 - Conversational Quality:** Nerin responses feel personalized, adaptive, not generic; competitive moat of the product

**NFR2 - Real-Time Responsiveness:** Nerin responses <2 seconds P95, Archetype lookups <100ms, UI updates instant (optimistic)

**NFR3 - Privacy & Security:** Zero unauthorized profile access, E2E encryption (TLS 1.3+), GDPR compliance from day 1

**NFR4 - OCEAN Consistency:** Same trait scores always produce identical 4-letter code (deterministic), stable across sessions

**NFR5 - Scaling:** Handle 500 concurrent users MVP without degradation, query response <500ms

**NFR6 - Privacy-First Design:** Profiles private by default, zero public discovery, explicit sharing only via unique link

**NFR7 - Session Persistence:** Users can pause 30-minute assessment and resume without losing conversation context

**NFR8 - Cost Optimization:** LLM cost ≤ $0.15 per assessment ($75/day max for MVP 500 users)

**NFR9 - Data Retention:** Conversation history kept encrypted for user insights, business intelligence, future model training

**NFR10 - Engagement:** 30-minute minimum session duration with progress visibility to prevent drop-out

### Additional Requirements from Architecture

**Architecture Decisions Impacting Implementation:**

- All-Railway infrastructure deployment (single platform: backend + PostgreSQL + Redis)
- Docker Compose for local development (exact parity with production)
- Effect-ts for functional error handling and RPC layer
- @effect/rpc for type-safe backend-frontend contracts
- LangGraph state machine for multi-agent orchestration (Nerin + Analyzer + Scorer)
- Drizzle ORM for type-safe database access
- PostgreSQL with logical replication (ElectricSQL compatible)
- Better Auth for email/password authentication (12+ character validation)
- Pino for structured JSON logging (cloud-native)
- Sentry Free Plan for error tracking (frontend + backend)
- TanStack DB + ElectricSQL for frontend state management (local-first sync)
- TanStack Form for form state management
- TanStack Start for full-stack SSR frontend
- Storybook 10.1.11 for component documentation and a11y testing

**Testing Strategy:**

- Vitest for unit testing (ESM-native, Effect-friendly)
- Vitest + TestContainers for integration testing (actual PostgreSQL)
- Playwright for E2E testing (multi-browser)
- Mock Anthropic API for deterministic LLM testing
- 100% domain logic coverage, 90%+ RPC contracts, 60%+ UI components
- 100% component Storybook documentation + a11y checks

### FR Coverage Map

| Epic | Story | Primary FR(s) | NFR(s) |
|------|-------|---------------|-------|
| 1. Infrastructure & Auth | 1.1 Railway Setup | Infrastructure | NFR8 (Cost) |
| 1. Infrastructure & Auth | 1.2 Better Auth Integration | — | NFR3 (Privacy) |
| 1. Infrastructure & Auth | 1.3 RPC & Effect Setup | — | NFR2 (Performance) |
| 2. Assessment Backend | 2.1 Session Management | FR1, FR3, FR21 | NFR2, NFR5 |
| 2. Assessment Backend | 2.2 Nerin Agent Setup | FR2, FR4 | NFR1 (Quality), NFR2 |
| 2. Assessment Backend | 2.3 Analyzer & Scorer | FR5, FR6, FR7 | NFR2, NFR4 |
| 2. Assessment Backend | 2.4 LangGraph Orchestration | FR1, FR3, FR4 | NFR1, NFR2, NFR8 |
| 2. Assessment Backend | 2.5 Cost Tracking & Rate Limiting | FR24, FR25, FR26 | NFR8 |
| 3. OCEAN Archetype System | 3.0 Test Migration (__mocks__) | — | — |
| 3. OCEAN Archetype System | 3.1 Code Generation | FR8, FR9 | NFR4 |
| 3. OCEAN Archetype System | 3.2 Archetype Lookup & Storage | FR10, FR11 | NFR2, NFR4 |
| 4. Frontend Assessment UI | 4.1 Assessment Component | FR1, FR2, FR4 | NFR2, NFR10 |
| 4. Frontend Assessment UI | 4.2 Session Resumption (Device Switching) | FR21, FR22 | NFR2, NFR7 |
| 4. Frontend Assessment UI | 4.3 Optimistic Updates & Progress Indicator | FR4, FR23 | NFR2, NFR10 |
| 4. Frontend Assessment UI | 4.4 Authentication UI | — | NFR3 |
| 4. Frontend Assessment UI | 4.5 Component Documentation (Storybook) | — | NFR3 (Accessibility) |
| 5. Results & Profiles | 5.1 Results Display | FR5-FR11 | NFR2, NFR4 |
| 5. Results & Profiles | 5.2 Profile Sharing | FR13, FR14, FR15 | NFR3, NFR6 |
| 6. Privacy & Data | 6.1 Encryption at Rest | FR17, FR18 | NFR3, NFR6 |
| 6. Privacy & Data | 6.2 GDPR Implementation | FR19, FR20 | NFR3 |
| 6. Privacy & Data | 6.3 Audit Logging | FR20 | NFR3 |

---

## Epic List

1. **Infrastructure & Auth Setup** — Railway deployment, authentication, RPC foundation
2. **Assessment Backend Services** — Nerin orchestration, multi-agent coordination, cost control
3. **OCEAN Archetype System** — 4-letter code generation, archetype lookup, facet mappings
4. **Frontend Assessment UI** — Conversation component, real-time sync, progress tracking, component documentation
5. **Results & Profile Sharing** — Results display, shareable links, PDF export
6. **Privacy & Data Management** — Encryption, GDPR compliance, audit logging
7. **UI Theme & Visual Polish** — Ocean brand identity, dark mode, trait colors, home page redesign

---

## Epic 1: Infrastructure & Auth Setup

**Goal:** Establish production-ready infrastructure on Railway, configure authentication with Better Auth, and set up RPC contracts for type-safe backend-frontend communication.

**Dependencies:** None (foundational)

**Enables:** All subsequent epics (Epics 2-7 depend on infrastructure + RPC foundation)

**Critical Path:** Must complete before Epic 2 (backend needs deployed infra) and Epic 4 (frontend needs RPC contracts)

**User Value:** Provides secure, cost-optimized foundation for all subsequent features

### Story 1.1: Deploy Infrastructure to Railway

As a **DevOps Engineer**,
I want **to deploy big-ocean backend, PostgreSQL, and Redis to Railway**,
So that **the platform has a scalable, managed infrastructure with zero operational overhead**.

**Acceptance Criteria:**

**Given** the monorepo is ready to deploy
**When** I push to GitHub main branch
**Then** Railway automatically deploys backend + PostgreSQL + Redis
**And** environment variables are configured in Railway dashboard
**And** database migrations run automatically
**And** logs appear in Railway dashboard

**Given** the system is deployed to Railway
**When** I check the Railway dashboard
**Then** Backend service shows healthy status
**And** PostgreSQL is reachable from backend
**And** Redis is connected for cost tracking
**And** All services share the same Railway project

**Technical Details:**

- Railway app configuration with Dockerfile for backend
- PostgreSQL with logical replication enabled
- Redis for rate limiting + cost tracking
- Environment variables: DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, SENTRY_DSN
- Cost estimate: $5-12/month (usage-based)

**Acceptance Checklist:**
- [ ] Railway project created and GitHub repo connected
- [ ] Backend service deploys on git push
- [ ] PostgreSQL initialized with migrations
- [ ] Redis available for cache/rate limiting
- [ ] Health check endpoint returns 200 OK
- [ ] Logs visible in Railway dashboard

---

### Story 1.2: Integrate Better Auth for Email/Password Authentication

As a **User**,
I want **to sign up with email and password (minimum 12 characters)**,
So that **I can create an account and save my assessment results**.

**Acceptance Criteria:**

**Given** an unauthenticated user
**When** they click "Sign Up" after first assessment message
**Then** a modal appears with email and password fields
**And** password must be 12+ characters with complexity validation (per NIST 2025)
**And** system checks password against compromised credentials database
**And** on success, anonymous session links to new user account

**Given** a user is signed up
**When** they sign in with email/password
**Then** session is established with auth token
**And** previous assessments are associated with their account
**And** profile data syncs across devices

**Technical Details:**

- Better Auth library setup in backend
- Custom password validation: 12+ chars, NIST 2025 standards
- Compromised credential screening before signup
- Anonymous-to-authenticated session linking
- TLS 1.3+ encryption for auth endpoints
- Secure HTTP-only session cookies

**Acceptance Checklist:**
- [ ] Sign-up modal appears after first message
- [ ] Password validation enforces 12+ characters
- [ ] Compromised password check implemented
- [ ] Anonymous session links to new account
- [ ] Login works with email/password
- [ ] Sessions persist across browser refresh

---

### Story 1.3: Configure Effect-ts RPC Contracts and Infrastructure Layer

As a **Backend Developer**,
I want **to define type-safe RPC contracts between frontend and backend**,
So that **all API interactions are compile-time verified and self-documenting**.

**Acceptance Criteria:**

**Given** the Effect-ts environment is configured
**When** I define an RPC contract (e.g., `startAssessment`)
**Then** the contract automatically generates TypeScript types for frontend/backend
**And** frontend client imports can only call valid procedures
**And** invalid RPC calls fail at compile time, not runtime

**Given** a backend handler is implemented
**When** it returns a successful response
**Then** the response matches the contract output schema
**And** errors are caught as tagged Error types (SessionNotFoundError, etc.)

**Technical Details:**

- @effect/rpc for contract definitions
- @effect/schema for runtime validation
- FiberRef bridges for request-scoped dependencies (database, logger, cost guard)
- Layer composition for dependency injection
- Error mapping to HTTP status codes (404, 429, 503)

**Acceptance Checklist:**
- [ ] RPC contracts defined in `packages/contracts`
- [ ] startAssessment, sendMessage, getResults RPC procedures working
- [ ] Type-safe RPC handlers in `apps/api/src/handlers`
- [ ] Frontend RPC client auto-generated from contracts
- [ ] Error types discriminated in client error handling

---

## Epic 2: Assessment Backend Services

**Goal:** Implement the multi-agent orchestration system (Nerin, Analyzer, Scorer) that drives conversational assessment, real-time precision updates, and cost-aware routing.

**Dependencies:** Epic 1 (Infrastructure & Auth) — requires Railway deployment + RPC contracts

**Enables:** Epic 3 (provides facet/trait scores), Epic 4 (provides backend API), Epic 5 (provides results data)

**Blocked By:** None (Epic 1 completes first)

**Critical Path:** Core engine; blocks frontend development

**User Value:** Delivers the core conversational personality assessment experience with intelligent agent coordination

### Story 2.1: Session Management and Persistence (TDD)

As a **User**,
I want **to pause an assessment and resume from exactly where I left off**,
So that **I can take time between conversations without losing progress**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for session management
**When** I run `pnpm test session-manager.test.ts`
**Then** tests fail (red) because session implementation doesn't exist
**And** each test defines expected behavior:
  - Test: Session created with unique ID
  - Test: Messages persisted to database
  - Test: Precision scores saved and restored
  - Test: Session resume loads full history
  - Test: Conversation state is accurate after resume

**IMPLEMENTATION (Green Phase):**
**Given** an active assessment session
**When** I close the browser or disconnect
**Then** the session is saved with conversation history and current precision scores on server
**And** when I return with the session ID
**And** I click "Resume Assessment"
**Then** the conversation history loads from server in <1 second
**And** Nerin's next response can be generated seamlessly
**And** all session management tests pass (green)

**INTEGRATION:**
**Given** a resumed session
**When** I continue the conversation
**Then** my full conversation history is visible (scrollable)
**And** precision scores continue updating
**And** Assessment continues from exact point of pause

**Technical Details:**

- **TDD Workflow**: Tests written first (define session contract), implementation follows
- Database tables for session persistence:
  - `sessions` table: `id, userId, createdAt, precision, status (active/paused/completed)`
  - `assessment_messages` table: `id, sessionId, role (user/assistant), content, createdAt`
  - `facet_evidence` table: `id, messageId, facet, score, confidence, quote, highlightStart, highlightEnd, createdAt`
  - `facet_scores` table: `id, sessionId, facet, score, confidence, updatedAt`
  - `trait_scores` table: `id, sessionId, trait, score, confidence, updatedAt`
- Session state stored entirely server-side
- Resume via URL: `/assessment?sessionId={sessionId}`
- History load on resume: TanStack Query fetches:
  - All messages
  - All facet evidence linked to messages
  - Current facet scores (aggregated)
  - Current trait scores (derived)
  - Overall precision metric
- Session restoration: <1 second load time for full history + evidence + scores
- Unit test coverage: 100% of session CRUD operations

**Acceptance Checklist:**
- [ ] Failing tests written first covering session scenarios (red phase)
- [ ] Tests verify session creation and ID uniqueness
- [ ] Tests verify message persistence
- [ ] Tests verify facet evidence persistence
- [ ] Tests verify facet/trait score persistence
- [ ] Tests verify precision restoration
- [ ] Implementation passes all tests (green phase)
- [ ] Session created on startAssessment
- [ ] Messages persisted in assessment_messages table
- [ ] Facet evidence persisted in facet_evidence table
- [ ] Facet scores persisted in facet_scores table
- [ ] Trait scores persisted in trait_scores table
- [ ] Session resume loads full conversation history
- [ ] Session resume restores all facet evidence
- [ ] Session resume restores facet and trait scores
- [ ] Precision scores restored on resume
- [ ] History loads in <1 second (including evidence + scores)
- [ ] Can resume from different device via session URL
- [ ] 100% unit test coverage for SessionManager

---

### Story 2.2: Nerin Agent Setup and Conversational Quality (TDD)

As a **User**,
I want **Nerin to ask thoughtful, personalized questions that feel like a real conversation**,
So that **the assessment feels authentic and I stay engaged for the full 30 minutes**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for Nerin conversational quality
**When** I run `pnpm test nerin-agent.test.ts`
**Then** tests fail (red) because Nerin implementation doesn't exist
**And** each test defines expected behavior (using mock Anthropic API):
  - Test: First message is warm and inviting (not generic)
  - Test: Responses reference earlier conversation (context awareness)
  - Test: No repetitive questions in sequence
  - Test: Streaming responses work with token tracking
  - Test: Response latency tracked for P95 monitoring

**IMPLEMENTATION (Green Phase):**
**Given** I start an assessment
**When** Nerin sends the first message
**Then** it's a warm, inviting greeting (e.g., "Hi! I'm Nerin. I'd like to get to know you better...")
**And** it asks an open-ended question about my interests/values
**And** first message test passes (green)

**Given** I've sent 3-4 messages
**When** Nerin responds
**Then** Nerin references something I said earlier (demonstrating understanding)
**And** Nerin doesn't ask repetitive questions (tracked by Orchestrator)
**And** response streams in real-time to the UI (<2 sec P95)
**And** all quality tests pass (green)

**Technical Details:**

- **TDD Workflow**: Tests written first (define conversational expectations), implementation follows
- Nerin is Claude Sonnet 4.5 (latest available) via Anthropic API
- System prompt ensures non-judgmental, curiosity-driven tone
- Conversation context includes previous messages + current precision gaps
- Streaming via @anthropic-ai/sdk for real-time responses
- Real-time token tracking for cost monitoring
- Mock Anthropic API for deterministic testing
- Unit test coverage: 100% of Nerin system prompt logic

**Acceptance Checklist:**
- [ ] Failing tests written first with mock API (red phase)
- [ ] Tests verify warm greeting generation
- [ ] Tests verify context awareness (references prior messages)
- [ ] Tests verify no question repetition
- [ ] Tests verify streaming token counting
- [ ] Implementation passes all tests (green phase)
- [ ] Nerin first message is warm and engaging
- [ ] Responses stream to UI in <2 seconds P95
- [ ] Nerin maintains conversation context
- [ ] No repetitive questions (orchestrator tracks domain coverage)
- [ ] Token counts accurate for cost tracking
- [ ] 100% unit test coverage for Nerin system prompt

---

### Story 2.3: Evidence-Based Analyzer and Scorer Implementation (TDD)

As a **Backend System**,
I want **to create facet evidence from each message and aggregate evidence into scores**,
So that **I can provide transparent, testable personality assessment with user-visible evidence trails**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for evidence-based facet scoring
**When** I run `pnpm test analyzer.test.ts scorer.test.ts`
**Then** tests fail (red) because implementations don't exist
**And** each test defines expected behavior:
  - Test: Analyzer creates FacetEvidence records with messageId, facet (clean name), numeric score (0-20), confidence, quote, highlightRange
  - Test: Scorer aggregates FacetEvidence[] by facet using weighted averaging
  - Test: Scorer detects contradictions via variance analysis (high variance → lower confidence)
  - Test: Trait scores computed from facet averages using FACET_TO_TRAIT lookup
  - Test: Statistics (mean, variance, sampleSize) computed on-demand, not stored

**IMPLEMENTATION (Green Phase - Analyzer):**
**Given** a user message is received
**When** the Analyzer processes it
**Then** it detects 30 facet signals and creates FacetEvidence records:
  - messageId: Reference to assessment_messages.id
  - facet: Clean name ("altruism" not "agreeableness_altruism")
  - score: Numeric 0-20 (analyzer's suggestion for THIS message)
  - confidence: 0.0-1.0 (analyzer's confidence in this interpretation)
  - quote: Exact phrase from message
  - highlightRange: { start: charIndex, end: charIndex }
**And** evidence is stored in facet_evidence table
**And** analyzer tests pass (green)

**IMPLEMENTATION (Green Phase - Scorer):**
**Given** multiple FacetEvidence records exist for a facet
**When** the Scorer aggregates (every 3 messages)
**Then** it calculates aggregated score using weighted averaging:
  - Weighted by confidence + recency (recent messages weighted higher)
  - Variance calculated to detect contradictions
  - Confidence adjusted: high variance → -0.3 penalty, more samples → +0.2 bonus
**And** statistics computed on-demand from evidence:
  - mean = average of all scores
  - variance = measure of contradiction
  - sampleSize = number of evidence records
**And** Result stored as Record<FacetName, FacetScore> (no redundant facet field)
**And** scorer tests pass (green)

**IMPLEMENTATION (Green Phase - Aggregator):**
**Given** facet scores are computed
**When** the Aggregator derives traits
**Then** it uses FACET_TO_TRAIT lookup to group facets by trait
**And** trait score = sum of facet scores (0-120 scale)
**And** trait confidence = minimum confidence across facets
**And** Traits stored as Record<TraitName, TraitScore>
**And** aggregator tests pass (green)

**INTEGRATION:**
**Given** facet evidence and scores exist
**When** the frontend renders results
**Then** users can click facet score → view evidence with quotes
**And** users can click message → view contributing facets
**And** UI highlights exact quote using highlightRange
**And** precision bar updates based on facet confidence
**And** trait scores reflect sums of facets (0-120 scale)

**Technical Details:**

- **Unified FacetEvidence Type**: Single type for Analyzer output and Scorer input
- **Clean Facet Naming**: "imagination", "altruism", "orderliness" (no trait prefixes)
- **Database Schema**:
  - facet_evidence: id, messageId (FK), facet, score, confidence, quote, highlightStart, highlightEnd
  - facet_scores: id, sessionId, facet, score, confidence (statistics NOT stored)
  - trait_scores: id, sessionId, trait, score, confidence
- **Facet-First Data Model**: 30 facets → 5 traits (traits derived from facets)
- **Record Storage Pattern**: `Record<FacetName, FacetScore>` (efficient O(1) lookup)
- **Statistics Computed**: mean/variance/sampleSize calculated from facet_evidence, not stored redundantly
- **Bidirectional Navigation**: Profile ↔ Evidence ↔ Message (messageId enables linking)
- **Batch Execution**: Analyzer per message, Scorer every 3 messages

**Acceptance Checklist:**
- [ ] Failing tests written first (red phase)
- [ ] Tests verify FacetEvidence creation with messageId
- [ ] Tests verify clean facet naming (no prefixes)
- [ ] Tests verify Scorer aggregation logic (weighted average)
- [ ] Tests verify contradiction detection (variance analysis)
- [ ] Tests verify trait derivation from facets
- [ ] Tests verify statistics are computed, not stored
- [ ] Implementation passes all tests (green phase)
- [ ] Evidence stored in facet_evidence table
- [ ] Facet scores stored as Record<FacetName, FacetScore>
- [ ] Bidirectional navigation works (Profile ↔ Message)
- [ ] 100% unit test coverage for Analyzer, Scorer, Aggregator

---

### Story 2.4: LangGraph State Machine and Orchestration (TDD)

As a **Backend System**,
I want **to intelligently route messages to Nerin, Analyzer, or Scorer based on context**,
So that **I optimize for quality + cost by running expensive operations only when needed**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for LangGraph orchestration
**When** I run `pnpm test orchestrator.test.ts`
**Then** tests fail (red) because orchestrator doesn't exist
**And** each test defines expected routing behavior:
  - Test: Always routes to Nerin on every message
  - Test: Analyzer runs on every message (evidence extraction)
  - Test: Scorer triggers every 3rd message (batch aggregation)
  - Test: Hint injected only at scoring boundaries (when `messagesSinceLastScore === 0`)
  - Test: Hint targets lowest-confidence facet (`precisionGaps[0]`)
  - Test: Hint cleared after Nerin consumes it (messages 2-3 hint-free)
  - Test: Hint phrasing uses curiosity framing ("You haven't heard much about...")
  - Test: No hints when precision >= 70%
  - Test: Skips Scorer when approaching budget (Analyzer continues)
  - Test: Routing decisions are deterministic (same state → same decision)

**IMPLEMENTATION (Green Phase):**
**Given** a new message from the user
**When** the orchestrator receives it
**Then** it routes to Nerin for response generation (always)
**And** Analyzer extracts facet evidence from every message
**And** every 3rd message triggers Scorer (batch aggregation)
**And** routing tests pass (green)

**Given** a scoring cycle completes (every 3rd message)
**When** the Router evaluates precision gaps
**Then** it injects a hint for the NEXT cycle targeting the lowest-confidence facet
**And** hint is phrased as Nerin's curiosity (e.g., "You haven't heard much about how they relate to helping others")
**And** hint is consumed by Nerin on first message of cycle, then cleared
**And** messages 2 and 3 of each cycle receive NO hint injection
**And** Nerin operates with natural conversation flow between hints
**And** hint cadence tests pass (green)

**Given** precision reaches 70%+ at a scoring boundary
**When** the next cycle would begin
**Then** no further hints are injected
**And** celebration screen triggers (per Story 4.4)
**And** user can continue chatting hint-free via "Keep Exploring"
**And** precision threshold tests pass

**Given** cost is approaching daily limit
**When** the next assessment would exceed budget
**Then** the orchestrator skips Scorer (Analyzer still runs for evidence)
**And** routes directly to Nerin without hints (cost-saving)
**And** shows user graceful message: "Quality may be reduced while optimizing..."
**And** cost-aware routing tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define routing contracts), implementation follows
- LangGraph state machine with nodes: Nerin, Analyzer, Scorer, Aggregator
- State includes:
  - messages: conversation history
  - facetEvidence: FacetEvidence[] (created by Analyzer)
  - facetScores: Record<FacetName, FacetScore> (aggregated by Scorer)
  - traitScores: Record<TraitName, TraitScore> (derived by Aggregator)
  - precision: overall confidence metric
  - cost: accumulated spend
  - precisionGaps: FacetName[] (ordered by confidence ascending)
  - currentHint: FacetName | null (set at scoring boundary, cleared after Nerin consumes)
  - messagesSinceLastScore: number (resets to 0 after Scorer runs)
- Pipeline flow: Analyzer (per message) → Scorer (every 3 messages) → Aggregator (derives traits) → Router (guides Nerin)
- Routing logic:
  - Nerin: Every message
  - Analyzer: Every message (extracts evidence)
  - Scorer: Every 3 messages (aggregates scores, updates precision)
  - Hint injection: Only at scoring boundaries (message 1 of each 3-message cycle)
  - Hint cleared: After Nerin consumes it (messages 2-3 are hint-free)
  - Hint language: Framed as Nerin's curiosity ("You haven't heard much about..."), not directives
- Cost-aware routing: Skip Scorer if approaching budget (Analyzer still runs for evidence collection)
- Deterministic: Same state always produces same routing decision
- Unit test coverage: 100% of routing logic paths

**Acceptance Checklist:**
- [ ] Failing tests written first covering all routing scenarios (red phase)
- [ ] Tests verify Nerin routing on every message
- [ ] Tests verify Analyzer runs on every message (evidence extraction)
- [ ] Tests verify Scorer batch triggering (every 3 messages)
- [ ] Tests verify hint injection only at scoring boundaries (`messagesSinceLastScore === 0`)
- [ ] Tests verify `currentHint` is `null` for messages where `messagesSinceLastScore > 0`
- [ ] Tests verify hint content matches `precisionGaps[0]` facet name
- [ ] Tests verify no hint injection when `precision >= 0.7`
- [ ] Tests verify hint phrasing uses curiosity framing, not directives
- [ ] Tests verify cost-aware skipping (Scorer skipped, Analyzer continues)
- [ ] Tests verify conversation transcripts show natural topic variation between hints
- [ ] Implementation passes all tests (green phase)
- [ ] State machine defined in LangGraph with hint state management
- [ ] Routing to Nerin on every message
- [ ] Analyzer triggered every message for evidence collection
- [ ] Scorer triggered every 3 messages for aggregation
- [ ] Hint injected only at scoring boundaries (message 1 of each 3-message cycle)
- [ ] Hint targets lowest-confidence facet from precision gaps
- [ ] Messages between scoring cycles are hint-free (natural flow)
- [ ] No hints after precision reaches 70%
- [ ] Cost-aware routing skips Scorer when needed (preserves Analyzer)
- [ ] 100% unit test coverage for orchestration logic

---

### Story 2.5: LLM Cost Tracking, Rate Limiting, and Budget Enforcement (TDD)

As a **Product Owner**,
I want **to prevent uncontrolled LLM costs from consuming runway**,
So that **the MVP remains sustainable for 500 users at $75/day max**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for cost tracking and rate limiting
**When** I run `pnpm test cost-guard.test.ts`
**Then** tests fail (red) because CostGuard implementation doesn't exist
**And** each test defines expected behavior:
  - Test: Cost calculation formula: (inputTokens / 1M * 0.003) + (outputTokens / 1M * 0.015)
  - Test: Daily cost accumulation in Redis
  - Test: Rate limit enforced: 1 assessment per user per day
  - Test: Hard cap: reject if daily spend exceeds $75
  - Test: Graceful error messages returned to user

**IMPLEMENTATION (Green Phase):**
**Given** a user starts an assessment
**When** Nerin is called
**Then** system logs token counts (input + output)
**And** cost is calculated (input_tokens * 0.003 + output_tokens * 0.015)
**And** daily cost counter is incremented in Redis
**And** all cost calculation tests pass (green)

**Given** a user tries to start a second assessment in one day
**When** the rate limit is checked
**Then** the request is rejected with: "You can start a new assessment tomorrow"
**And** they can resume existing incomplete assessment
**And** rate limit tests pass

**Given** daily LLM spend exceeds $75
**When** the next assessment is started
**Then** cost guard rejects it with graceful message: "Assessment is temporarily unavailable while we optimize costs..."
**And** logs alert to Sentry
**And** hard cap tests pass

**REFACTOR & MONITORING:**
**Given** cost tracking is implemented
**When** assessing cost behavior over time
**Then** Pino logs all cost events for analytics
**And** cost trends are visible in monitoring dashboard

**Technical Details:**

- **TDD Workflow**: Tests written first (define cost limits), implementation follows
- Redis stores: `cost:{userId}:{date}` (daily cost in cents)
- Rate limiting: `assessments:{userId}:{date}` (count, max 1/day)
- Cost calculation: `(inputTokens / 1_000_000) * 0.003 + (outputTokens / 1_000_000) * 0.015`
- CostGuard Effect service manages checks + tracking
- Pino logs all cost events for analytics
- Unit test coverage: 100% of cost calculation logic, rate limiting, and budget enforcement

**Acceptance Checklist:**
- [ ] Failing tests written first covering all cost scenarios (red phase)
- [ ] Tests verify cost formula accuracy
- [ ] Tests verify rate limit enforcement
- [ ] Tests verify $75/day hard cap
- [ ] Implementation passes all tests (green phase)
- [ ] Token counts accurate from Anthropic API
- [ ] Cost calculated correctly
- [ ] Daily cost tracked in Redis
- [ ] Rate limit enforced (1 assessment/user/day)
- [ ] Hard cap prevents spend > $75/day
- [ ] Cost alerts sent to Sentry
- [ ] 100% unit test coverage for CostGuard module

---

## Epic 3: OCEAN Archetype System

**Goal:** Implement the 4-letter OCEAN code generation and mapping to memorable archetype names with facet-level descriptions.

**Dependencies:** Epic 2 (Assessment Backend) — requires facet scores + trait aggregation working

**Enables:** Epic 4 (displays archetypes), Epic 5 (shares archetypes)

**Blocked By:** Epic 2 (needs facet/trait scoring complete)

**Note:** Can start database design in parallel with Epic 2, but archetype lookup requires facet scores first

**User Value:** Transforms raw trait scores into memorable, shareable personality archetypes

### Story 3.0: Migrate Tests to Vitest Mock Modules with `__mocks__` Folders

As a **Developer**,
I want **test mock implementations extracted into `__mocks__` folders using Vitest's mock module system**,
So that **mock implementations are reusable, co-located with source, and test files are leaner**.

**Acceptance Criteria:**

**Given** all test layer factory functions exist in `test-layers.ts`
**When** I extract mock implementations into `__mocks__` folders
**Then** mock files are co-located with their source interfaces in `packages/domain/src/repositories/__mocks__/`
**And** test files use `vi.mock()` (path-only, no factory) for `__mocks__` folder resolution
**And** the centralized `TestRepositoriesLayer` composition is preserved
**And** all existing tests pass without behavioral changes (zero regressions)
**And** no changes to production source code

**Technical Details:**

- Extract 11+ mock factory functions from `test-layers.ts` into `__mocks__` folders
- Co-locate `__mocks__` with repository interfaces in `packages/domain/src/repositories/`
- Preserve Effect DI pattern (`Layer.succeed` + `Effect.provide`) as core testing architecture
- Each `__mocks__` file exports both the raw mock object AND a `createTest*Layer()` factory
- Per-test mock customization via `vi.fn().mockReturnValueOnce()` overrides on imported mocks
- Update CLAUDE.md testing section with `__mocks__` pattern documentation

**Acceptance Checklist:**
- [ ] All mock factory functions extracted from `test-layers.ts` into `__mocks__/` files
- [ ] `test-layers.ts` slimmed to imports + `Layer.mergeAll` composition
- [ ] Test files use `__mocks__` imports instead of inline `vi.fn()` blocks
- [ ] All existing tests pass (zero regressions)
- [ ] `__mocks__` pattern documented in CLAUDE.md
- [ ] No production source code changes

---

### Story 3.1: Generate 5-Letter OCEAN Codes from Trait Scores (TDD)

As a **Backend System**,
I want **to deterministically map trait scores (derived from facet sums) to 5-letter OCEAN codes for all traits**,
So that **the same facet scores always produce the same trait levels for storage and reference**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for OCEAN code generation
**When** I run `pnpm test ocean-code-generator.test.ts`
**Then** tests fail (red) because code generator doesn't exist
**And** each test defines expected behavior:
  - Test: Facet sums calculated correctly (6 facets per trait, each 0-20 → trait 0-120)
  - Test: All 243 trait level combinations map to correct codes (3^5 possibilities)
  - Test: Trait 0-40 → Low (L), 40-80 → Mid (M), 80-120 → High (H)
  - Test: Same facet scores always produce same code (deterministic)
  - Test: Code is exactly 5 letters (e.g., "HHMHM")

**IMPLEMENTATION (Green Phase):**
**Given** all 30 facets are scored (e.g., Imagination=18, Artistic=18, Emotionality=18, Adventurousness=18, Intellect=18, Liberalism=18)
**When** the Trait Score Aggregator calculates sums for all 5 traits:
  - Openness = sum(6 O facets) = 108 (example: 18+18+18+18+18+18)
  - Conscientiousness = sum(6 C facets) = 84 (example: 14+14+14+14+14+14)
  - Extraversion = sum(6 E facets) = 60 (example: 10+10+10+10+10+10)
  - Agreeableness = sum(6 A facets) = 96 (example: 16+16+16+16+16+16)
  - Neuroticism = sum(6 N facets) = 72 (example: 12+12+12+12+12+12)
**And** the code generator processes trait scores
**Then** each trait is mapped to a level:
  - Openness 108 → High (H) [>80]
  - Conscientiousness 84 → High (H) [>80]
  - Extraversion 60 → Mid (M) [40-80]
  - Agreeableness 96 → High (H) [>80]
  - Neuroticism 72 → Mid (M) [40-80]
**And** full 5-letter code is generated as: "HHMHM" (5 letters for complete OCEAN storage)
**And** code is deterministic (same facet scores → same trait sums → same code, always)
**And** all failing tests now pass (green)

**REFACTOR & INTEGRATION:**
**Given** facet scores are updated (precision increases)
**When** trait sums are recalculated and code is regenerated
**Then** if any trait level changed, code changes
**And** if all trait levels stay same, code stays same

**Technical Details:**

- **TDD Workflow**: Tests written first (cover all 243 combinations), implementation follows
- Facet → Trait aggregation:
  - Uses FACET_TO_TRAIT lookup table to group facets by trait
  - Trait score = sum of 6 related facets (each 0-20 scale)
  - Example: `FACET_TO_TRAIT["altruism"] = "agreeableness"`
  - Facet names are clean (no trait prefixes): "imagination", "altruism", "orderliness"
  - Result is 0-120 scale for the trait
- Trait → Level mapping:
  - 0-40: Low (L)
  - 40-80: Mid (M)
  - 80-120: High (H)
- 5-letter code storage: Stores all 5 traits (O, C, E, A, N) in database for complete profile
- Archetype naming (Story 3.2): Uses first 4 letters (O, C, E, A) for POC; Phase 2 adds N
- Facet database storage: All 30 facet scores (0-20 each)
- Derived trait scores: Computed as sums from stored facets (0-120 scale)
- Unit test coverage: 100% code paths (all 243 combinations tested)

**Acceptance Checklist:**
- [ ] Failing tests written first covering all combinations (red phase)
- [ ] Tests verify boundary conditions (0, 40, 80, 120)
- [ ] Tests verify all 243 combinations map correctly
- [ ] Implementation passes all tests (green phase)
- [ ] All 30 facet scores stored in database
- [ ] Trait scores calculated as sum of related facets (0-120 scale)
- [ ] 5-letter code generation algorithm implemented
- [ ] Code stored in database
- [ ] Code is deterministic (same facets → same code)
- [ ] 100% unit test coverage for code generator

---

### Story 3.2: Create and Manage Archetype Lookup Table (4-Letter Naming, TDD)

As a **User**,
I want **to see my personality described with a memorable name like "Thoughtful Collaborator"**,
So that **the archetype feels personal and shareable**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for archetype lookup
**When** I run `pnpm test archetype-lookup.test.ts`
**Then** tests fail (red) because lookup implementation doesn't exist
**And** each test defines expected behavior:
  - Test: 4-letter code lookup returns correct archetype name
  - Test: Hand-curated names exist for all 25-30 common combinations
  - Test: Component-based fallback generates valid names for all 81 combinations
  - Test: Description text is generated correctly for each combination
  - Test: Color assignments are consistent

**IMPLEMENTATION (Green Phase):**
**Given** full 5-letter OCEAN code is "HMLHM" (all 5 traits)
**When** the archetype lookup is performed for POC
**Then** archetype naming uses first 4 letters: "HMLH" (O, C, E, A only)
**And** archetype name is returned: "Thoughtful Collaborator"
**And** 2-3 sentence description explains the 4-trait combination
**And** lookup tests pass (green)

**Given** an uncommon 4-letter code combination (e.g., "LLLL")
**When** lookup is performed
**Then** if hand-curated name exists, return it
**And** if no hand-curated name, generate component-based name (e.g., "Reserved Pragmatist")
**And** fallback generation tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define lookup contracts), implementation follows
- Archetype table: `id, oceanCode4Letter, archetypeName, description, color (hex)`
- Storage: Full 5-letter code in database for reference
- Naming: Uses first 4 letters (O, C, E, A) for POC archetype lookup (81 combinations)
- 25-30 hand-curated archetypes for POC (covering common 4-letter combinations)
- Component-based fallback: Build names from trait level adjectives for all 81 codes
- Adjective mapping:
  - High O: Creative, Curious, Experimental
  - Mid O: Balanced, Pragmatic
  - Low O: Practical, Traditional
  - (similar for other traits)
- Description: 2-3 sentences explaining the 4-trait combination
- Phase 2: Extend to 5-letter naming when Neuroticism included (243 combinations)
- Unit test coverage: 100% of lookup logic (all 81 combinations tested)

**Acceptance Checklist:**
- [ ] Failing tests written first covering all 81 code combinations (red phase)
- [ ] Tests verify hand-curated name lookup
- [ ] Tests verify component-based fallback generation
- [ ] Tests verify description text generation
- [ ] Implementation passes all tests (green phase)
- [ ] Archetype table populated with 25+ hand-curated entries
- [ ] Lookup returns name + description based on first 4 letters
- [ ] Component-based fallback works for all 81 4-letter combinations
- [ ] Full 5-letter code stored in database for Phase 2
- [ ] Colors assigned for visual differentiation
- [ ] 100% unit test coverage for archetype lookup

---

## Epic 4: Frontend Assessment UI

**Goal:** Build the conversational assessment interface with real-time sync, progress tracking, component documentation, and seamless user experience.

**Dependencies:**
- Epic 1 (RPC contracts)
- Epic 2 (backend assessment endpoints live)
- Epic 3 (archetype system working for results display)

**Enables:** Epic 5 (builds on working assessment UI for sharing), user can start assessments

**Blocked By:** Epics 1, 2, 3 must complete first

**Parallel Development:** Can design UI components in parallel with backend work; Storybook documentation can be added as components are completed

**User Value:** Delivers engaging, responsive assessment experience with instant feedback, progress visibility, and documented component library for team onboarding

### Story 4.1: Authentication UI (Sign-Up Modal)

As a **User**,
I want **to sign up after my first message when I'm engaged**,
So that **my results are saved without friction**.

**Acceptance Criteria:**

**Given** I've sent my first message
**When** Nerin responds
**Then** a subtle modal appears: "Save your results? Sign up to continue"
**And** I can dismiss it and continue (no pressure)
**And** I can enter email + password to sign up

**Given** I sign up successfully
**When** the modal closes
**Then** my session links to my new account
**And** I see "Your results are being saved"

**Technical Details:**

- Sign-up modal component with TanStack Form
- Email validation (required, valid format)
- Password validation (12+ chars, NIST 2025)
- Better Auth integration for account creation
- Session linking: anonymous → authenticated

**Acceptance Checklist:**
- [ ] Modal appears after first message
- [ ] Can dismiss modal
- [ ] Email/password input visible
- [ ] Password validation enforced
- [ ] Signup creates account
- [ ] Session links to account

---

### Story 4.2: Assessment Conversation Component

As a **User**,
I want **to see my conversation with Nerin with my messages on one side and responses on the other**,
So that **the assessment feels like a natural dialogue**.

**Acceptance Criteria:**

**Given** I start an assessment
**When** the conversation component loads
**Then** I see Nerin's first message (warm greeting)
**And** message input field is ready for my response
**And** my message appears instantly when I send it (optimistic update)
**And** Nerin's response streams in word-by-word

**Given** the conversation grows to 20+ messages
**When** I scroll up
**Then** earlier messages are visible
**And** conversation context is preserved

**Given** I'm on mobile
**When** the component renders
**Then** layout is responsive and readable on small screens
**And** keyboard doesn't obscure message input

**Given** I click on any message I wrote (Story 5.3 integration)
**When** the click is registered
**Then** a side panel opens showing which facets this message contributed to
**And** each facet is clickable to navigate to profile

**Technical Details:**

- React component: `AssessmentUI.tsx`
- Message list with TanStack DB live queries
- Message input with TanStack Form
- Streaming response display (word-by-word)
- Optimistic insert: message added locally before server confirms
- Mobile-responsive with Tailwind CSS v4
- **NEW:** Message click handlers for evidence highlighting (Story 5.3)
- **NEW:** Support for text highlighting via `highlightRange` (Story 5.3)

**Acceptance Checklist:**
- [ ] Conversation displays message list
- [ ] User messages appear instantly (optimistic)
- [ ] Nerin responses stream in real-time
- [ ] Scrolling shows full history
- [ ] Mobile layout is readable
- [ ] Input field accessible and responsive
- [ ] User messages are clickable (Story 5.3 dependency)
- [ ] Messages support text highlighting (Story 5.3 dependency)

---

### Story 4.3: Session Resumption & Device Switching (TDD)

As a **User**,
I want **to switch to another device and continue my assessment**,
So that **I can start on desktop and finish on mobile without losing progress**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for session resumption
**When** I run `pnpm test session-resumption.test.ts`
**Then** tests fail (red) because resumption endpoints don't exist
**And** each test defines expected behavior:
  - Test: Resume URL loads full session history from server
  - Test: History loads in <1 second
  - Test: Precision scores match server state
  - Test: Can resume from different device with same session ID
  - Test: Device switching doesn't lose any messages

**IMPLEMENTATION (Green Phase):**
**Given** I start an assessment on desktop
**When** I send 5 messages
**And** I visit `/assessment?sessionId=abc123` on my phone
**Then** all 5 messages load from server
**And** Nerin's responses are visible
**And** precision scores match desktop state
**And** tests pass (green)

**Given** I continue the conversation on phone
**When** I send a message
**Then** message is sent to server
**And** Nerin generates response
**And** both devices reflect new message (if both open)

**Given** I reach 70%+ precision and see celebration screen with results
**When** I click "Keep Exploring" CTA
**Then** conversation interface remains open in same session
**And** I can continue chatting with Nerin seamlessly
**And** precision continues to improve with additional messages
**And** no new session is created (session ID unchanged)

**Technical Details:**

- **TDD Workflow**: Tests written first (define resumption contract), implementation follows
- Resume endpoint: `GET /api/sessions/{sessionId}/full` returns:
  - All messages (id, role, content, createdAt)
  - Current precision score
  - Current trait/facet scores
  - Session status (active/paused/completed)
- TanStack Query fetches history on mount
- Load time target: <1 second for full history
- No cross-device real-time sync (acceptable for MVP)
- History caching: Browser cache for offline browsing (optional)

**Acceptance Checklist:**
- [ ] Failing tests written first covering resumption scenarios (red phase)
- [ ] Tests verify history completeness
- [ ] Tests verify load time <1 second
- [ ] Tests verify precision accuracy
- [ ] Tests verify cross-device resumption
- [ ] Tests verify "Keep Exploring" continuation flow
- [ ] Implementation passes all tests (green phase)
- [ ] Resume endpoint returns full session state
- [ ] History loads in <1 second
- [ ] Can resume from different device
- [ ] No message loss on device switch
- [ ] "Keep Exploring" CTA continues same session without creating new one
- [ ] User can chat seamlessly after viewing 70% results
- [ ] 100% unit test coverage for SessionResumption

---

### Story 4.4: Optimistic Updates & Progress Indicator (TDD)

As a **User**,
I want **to see my message appear instantly and a progress bar showing assessment completion**,
So that **I get instant feedback and feel motivated to continue**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for optimistic updates and progress
**When** I run `pnpm test optimistic-updates.test.ts`
**Then** tests fail (red) because optimistic update logic doesn't exist
**And** each test defines expected behavior:
  - Test: Message appears in UI immediately on send (before server confirm)
  - Test: Precision updates trigger progress bar animation
  - Test: Progress = min(precision, 100)
  - Test: Progress bar shows correct percentage and label

**IMPLEMENTATION (Green Phase):**
**Given** I send a message
**When** I click send
**Then** message appears in message list immediately (optimistic)
**And** input field clears
**And** server processes message asynchronously
**And** tests pass (green)

**Given** precision updates from server
**When** new precision arrives
**Then** progress bar animates smoothly to new value
**And** "You're X% assessed" message updates
**And** "You're nearly there!" shows when >80%

**Given** precision reaches 70%+ for the first time
**When** the precision update arrives
**Then** a celebration screen appears: "Your Personality Profile is Ready!"
**And** archetype revealed with visual design flourish
**And** precision score displayed prominently (e.g., "Precision: 73%")
**And** two prominent CTAs presented:
  1. "Share My Archetype" — Generate shareable link
  2. "Keep Exploring" — Continue refining in same session
**And** user can choose either path without friction

**Technical Details:**

- **TDD Workflow**: Tests written first (define optimistic update contracts), implementation follows
- Optimistic update flow:
  1. User sends message → immediately add to local state
  2. TanStack Query fires mutation to `/api/sessions/{id}/messages`
  3. Server processes message (Nerin, Analyzer, Scorer)
  4. Response includes new precision
  5. Local state reconciles with server response
- Progress bar:
  - Value: `min(precision, 100)%`
  - Animated with CSS transition (500ms)
  - Labels: "0% assessed", "45% assessed", "You're nearly there!" (>80%)
- TanStack Form + TanStack Query for message input/mutation

**Acceptance Checklist:**
- [ ] Failing tests written first covering optimistic scenarios (red phase)
- [ ] Tests verify immediate message appearance
- [ ] Tests verify progress calculation
- [ ] Tests verify animation smoothness
- [ ] Tests verify 70% celebration trigger
- [ ] Implementation passes all tests (green phase)
- [ ] Messages appear instantly (optimistic)
- [ ] Input field clears immediately
- [ ] Progress bar displays precision
- [ ] Updates animate smoothly
- [ ] Correct labels shown at thresholds
- [ ] 70% celebration screen appears with archetype reveal
- [ ] Two CTAs present: "Share My Archetype" and "Keep Exploring"
- [ ] Mobile-responsive
- [ ] 100% unit test coverage for optimistic updates

---

### Story 4.5: Component Documentation with Storybook

As a **Frontend Developer**,
I want **to document all UI components in Storybook with interactive examples**,
So that **other devs can browse components before writing custom code and ensure accessibility compliance**.

**Acceptance Criteria:**

**Given** I start Storybook with `pnpm -C packages/ui storybook`
**When** I navigate to Components
**Then** I see all shadcn/ui components with:
  - Live examples of each variant
  - Props documentation
  - Accessibility checks (WCAG AA/AAA)
  - Design pattern explanations

**Given** a component has accessibility issues
**When** Storybook a11y addon runs
**Then** violations are highlighted with explanations

**Technical Details:**

- Storybook 10.1.11 (latest stable)
- `.stories.tsx` files for each component
- Autodocs: `tags: ["autodocs"]`
- a11y addon: `@storybook/addon-a11y`
- Deployment: GitHub Pages via CI

**Acceptance Checklist:**
- [ ] Storybook installed and configured
- [ ] Button, Input, Dialog, Card components documented
- [ ] Assessment UI components (NerinMessage, PrecisionMeter, ArchetypeCard) documented
- [ ] Stories show all variants
- [ ] a11y addon finds and reports accessibility issues
- [ ] Storybook builds successfully for deployment

---

### Story 4.6: Hide Scores During Assessment

As a **User**,
I want **to see my assessment progress without revealing scores or personality results during conversation**,
So that **my responses remain authentic and unbiased by partial results**.

**Acceptance Criteria:**

**Given** I'm in an active assessment conversation
**When** the chat interface renders
**Then** I see:
  - Precision percentage displayed prominently (e.g., "34% → 41% → 56%")
  - Precision meter updates every 2-3 messages (visual progress indicator)
  - Milestone notifications at key thresholds ("You're now 50% understood")
  - NO individual facet or trait scores visible
  - NO archetype name or hints visible
  - NO indication of score "direction" (high/low on traits)

**Given** my precision reaches 70%+
**When** the threshold is crossed
**Then**:
  - Conversation pauses with transition screen: "Your personality profile is ready!"
  - User is redirected to results page (`/results/:sessionId`)
  - This is the FIRST time user sees scores/traits/archetype

**Given** a user asks: "What's my score so far?" or "Can you tell me my personality type yet?"
**When** Nerin receives this question
**Then** Nerin responds:
  - "I'm definitely seeing patterns, but I don't want to share partial insights that might not be accurate yet."
  - "Right now we're at [X]% precision—let's get to 70%+ so I can give you the full picture."
  - Reframes to precision (visible metric) without revealing scores

**Technical Details:**

- Remove score/trait displays from conversation UI
- Keep precision meter visible and updating
- Add milestone toast notifications (25%, 50%, 75%)
- Create 70%+ precision transition screen
- Update Nerin prompt to avoid Big Five terminology during assessment
- Coordinate with Story 2.2 (Nerin Agent) for language patterns

**Acceptance Checklist:**
- [ ] Conversation UI shows precision meter, hides all scores/traits/archetypes
- [ ] Milestone notifications appear at correct thresholds
- [ ] 70%+ precision triggers transition to results page
- [ ] Nerin language avoids trait terminology
- [ ] User score inquiries handled with precision-reframing
- [ ] Mobile responsive (precision meter visible, toasts work)
- [ ] Storybook documentation (PrecisionMeter, MilestoneToast, PrecisionTransition)

**Rationale:** Maintains assessment integrity by preventing user bias. Aligns with UX spec (Monetization & Display Transparency Model). Sets foundation for future premium tier with consistent hidden-score pattern.

**Related Documents:**
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md` (Monetization section)
- Full implementation details: `_bmad-output/implementation-artifacts/4-6-hide-scores-during-assessment.md`

---

## Epic 5: Results & Profile Sharing

**Goal:** Display assessment results with memorable archetypes, enable privacy-controlled sharing, and provide PDF export.

**Dependencies:**
- Epic 1 (infrastructure)
- Epic 2 (assessment data available)
- Epic 3 (archetype names/descriptions ready)
- Epic 4 (UI components for results display)

**Enables:** Users can share personality insights (viral growth lever), complete assessment workflow

**Blocked By:** Epic 4 (needs assessment UI to function)

**User Value:** Completes the assessment loop — users can now share results

**User Value:** Users can share personality insights virally while maintaining privacy control

### Story 5.1: Display Assessment Results with Evidence-Based Scores

As a **User**,
I want **to see my personality summarized with my archetype name, trait levels, and facet descriptions with evidence**,
So that **I understand what my assessment revealed and can verify the accuracy**.

**Acceptance Criteria:**

**Given** I complete an assessment (all 30 facet confidences ≥ 70%)
**When** I click "View Results"
**Then** I see:
  - Archetype name (e.g., "Thoughtful Collaborator")
  - 3-level trait display (High/Mid/Low for O, C, E, A)
  - Visual archetype card (name + color + icon)
  - 2-3 sentence description explaining the combination
  - Expandable facet details for each trait (shows how facets aggregate to trait score)

**Given** I expand Openness trait details
**When** the facet breakdown appears
**Then** I see:
  - All 6 facet scores (0-20 scale) with clean names: Imagination, Artistic Interests, Emotionality, Adventurousness, Intellect, Liberalism
  - Sum of these 6 facets = Openness trait score (0-120 scale, displayed as High/Mid/Low)
  - Top-scoring facets highlighted (e.g., "Imagination: 16/20" and "Intellect: 15/20")
  - **NEW:** "View Evidence" button next to each facet score
  - Confidence indicator per facet (0.0-1.0 displayed as percentage)

**Given** I click "View Evidence" on any facet
**When** the evidence panel opens
**Then** I see (Story 5.3 details):
  - List of supporting message quotes
  - Score contribution per quote
  - "Jump to Message" links

**Given** precision < 50%
**When** results are viewed
**Then** message shows: "Keep talking to see more accurate results"
**And** results show preliminary assessment with facet data available so far

**Technical Details:**

- Results component fetches all 30 facet scores from database (stored as `Record<FacetName, FacetScore>`)
- Facet names are clean (no trait prefixes): "imagination" not "openness_imagination"
- Displays trait levels (High/Mid/Low) derived from facet sums using FACET_TO_TRAIT lookup
- Trait score = sum of 6 related facet scores (0-120 scale)
- Facet confidence displayed based on evidence consistency (adjusted for contradictions)
- Shows facet breakdown on demand (expandable sections)
- Color-coded by trait
- Archetype description is pre-written (not LLM-generated)
- Precision shown as facet convergence metric
- Evidence button links to Story 5.3 highlighting feature

**Acceptance Checklist:**
- [ ] Results component displays archetype name
- [ ] Trait levels shown (High/Mid/Low) computed from facet sums (0-120 scale)
- [ ] All 30 facet scores stored as Record<FacetName, FacetScore>
- [ ] Facet names are clean (no "trait_" prefixes)
- [ ] Facet details expandable for each trait
- [ ] Facet breakdown shows how sum is calculated
- [ ] Each facet shows confidence percentage
- [ ] "View Evidence" button visible for each facet
- [ ] Archetype description visible
- [ ] Color differentiation applied by trait
- [ ] Precision calculation considers facet convergence and variance
- [ ] Low precision shows appropriate message with partial facet data

---

### Story 5.2: Generate Shareable Profile Links

As a **User**,
I want **to generate a unique link to my profile that I can share on LinkedIn or email to friends**,
So that **others can see my personality archetype without accessing my full assessment**.

**Acceptance Criteria:**

**Given** I complete an assessment
**When** I click "Share Profile"
**Then** a public profile link is generated: `example.com/profiles/{uuid}`
**And** the link is copyable to clipboard
**And** I can control visibility (Private by default, toggle to Public)

**Given** someone opens my shared link
**When** they visit it
**Then** they see:
  - My archetype name + visual
  - Trait summary (High/Mid/Low)
  - Facet insights
  - **NOT visible:** Full conversation, precision %, or assessment progress

**Given** I set profile to Private
**When** someone tries to access the link
**Then** they see: "This profile is private"

**Technical Details:**

- `public_profiles` table: `id (uuid), userId, archetypeName, oceanCode5Letter, oceanCode4Letter, description, color, createdAt`
- Public endpoint: `GET /api/profiles/:publicProfileId` (no auth required)
- Private by default: `visibility = 'private'` (user toggles to 'public')
- Storage: Full 5-letter OCEAN code for complete trait record
- Display: Archetype name from 4-letter code (POC)
- Encryption of conversation history (not public)
- No user_id in URL (anonymous sharing)

**Acceptance Checklist:**
- [ ] Public profile generated
- [ ] Unique UUID-based link created
- [ ] Link is copyable
- [ ] Privacy toggle works
- [ ] Public link displays archetype (no conversation)
- [ ] Private link shows privacy message
- [ ] Analytics: track profile views

---

### Story 5.3: Bidirectional Evidence Highlighting and Transparency (TDD)

As a **User**,
I want **to see exactly which conversation quotes influenced each facet score**,
So that **I can verify the accuracy and understand how my results were calculated**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for evidence highlighting
**When** I run `pnpm test evidence-highlighting.test.ts`
**Then** tests fail (red) because highlighting components don't exist
**And** each test defines expected behavior:
  - Test: Clicking facet score opens evidence panel with quotes
  - Test: Clicking "Jump to Message" scrolls to message and highlights quote
  - Test: Clicking message opens side panel with contributing facets
  - Test: Highlight colors match evidence confidence (green/yellow/red)
  - Test: highlightRange accurately highlights exact text in message

**IMPLEMENTATION (Green Phase - Profile → Conversation):**
**Given** I'm viewing my profile results
**When** I click "View Evidence" on a facet score (e.g., "Altruism: 16/20")
**Then** an evidence panel opens showing:
  - List of all supporting message quotes
  - Each quote shows: message timestamp, quote text, score contribution (0-20)
  - Contradictory quotes marked with red indicator
  - "Jump to Message" button for each quote
**And** panel design:
  - Scrollable list (max 10 visible, scroll for more)
  - Color-coded contribution: Green (15+), Yellow (8-14), Red (<8 or contradictory)
  - Confidence indicator per quote (opacity reflects confidence)

**Given** I click "Jump to Message" in evidence panel
**When** the conversation scrolls to that message
**Then** the exact quote is highlighted in the message:
  - Green highlight: Strong positive signal (score 15+)
  - Yellow highlight: Moderate signal (score 8-14)
  - Red highlight: Contradictory signal (score <8 or conflicts with other evidence)
  - Opacity: High confidence = solid, low confidence = faded
**And** highlight persists until I navigate away
**And** smooth scroll animation to message location

**IMPLEMENTATION (Green Phase - Conversation → Profile):**
**Given** I'm viewing my conversation history
**When** I click on any message I wrote
**Then** a side panel opens showing:
  - "This message contributed to:"
  - List of facets with score contributions:
    - 🤝 Altruism: +18/20 (strong signal)
    - 💭 Emotionality: +14/20 (moderate)
    - 🎨 Imagination: +12/20 (moderate)
  - Each facet is clickable

**Given** I click a facet in the side panel
**When** the click is registered
**Then** the view navigates to profile page
**And** scrolls to that facet's score
**And** optionally opens the evidence panel for that facet

**INTEGRATION:**
**Given** evidence highlighting is implemented
**When** I interact with profile and conversation views
**Then** bidirectional navigation works seamlessly:
  - Profile → Evidence → Message (forward navigation)
  - Message → Facets → Profile (backward navigation)
**And** all highlighting is precise and color-coded
**And** mobile touch targets are ≥44px for all evidence items
**And** tests pass (green)

**Technical Details:**

- **Database Queries:**
  - Profile → Evidence: `SELECT * FROM facet_evidence WHERE facet = 'altruism' ORDER BY created_at`
  - Message → Facets: `SELECT * FROM facet_evidence WHERE message_id = 'msg_123'`
  - Evidence includes: messageId (FK), facet, score, confidence, quote, highlightStart, highlightEnd

- **Frontend Components:**
  - `EvidencePanel`: Modal/panel showing evidence list for a facet
  - `EvidenceItem`: Individual quote with score and "Jump to Message" button
  - `MessageHighlight`: CSS-based text highlighting using highlightRange
  - `FacetSidePanel`: Side panel showing facets contributed by a message

- **Highlighting Logic:**
  - Uses `highlightRange.start` and `highlightRange.end` (character indices)
  - Wraps text with `<span class="highlight highlight-{color}">` using CSS
  - Color determined by: score ≥15 (green), 8-14 (yellow), <8 (red)
  - Opacity determined by: confidence (0.3 = low, 1.0 = high)

- **Navigation:**
  - Smooth scroll: `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`
  - URL state management: Optional query params `?highlight=msg_123&facet=altruism`
  - Mobile-optimized: Touch targets ≥44px, swipe-friendly panels

- **Performance:**
  - Lazy load evidence (fetch only when "View Evidence" clicked)
  - Virtualized list for messages with 100+ evidence items
  - Debounced highlighting to avoid layout thrashing

**Acceptance Checklist:**
- [ ] Failing tests written first (red phase)
- [ ] Tests cover Profile → Evidence → Message flow
- [ ] Tests cover Message → Facets → Profile flow
- [ ] Tests verify color-coded highlighting
- [ ] Tests verify highlightRange accuracy
- [ ] Implementation passes all tests (green phase)
- [ ] "View Evidence" button opens evidence panel
- [ ] Evidence panel shows all supporting quotes
- [ ] "Jump to Message" scrolls and highlights quote
- [ ] Message click opens facet side panel
- [ ] Facet click navigates to profile
- [ ] Color coding matches score ranges (green/yellow/red)
- [ ] Opacity reflects confidence levels
- [ ] Mobile touch targets ≥44px
- [ ] Smooth scroll animations work
- [ ] 100% unit test coverage for highlighting components

---

## Epic 6: Privacy & Data Management

**Phase:** 2 (EU Launch + GDPR Compliance)

**Goal:** Implement encryption at rest, GDPR compliance, and comprehensive audit logging.

**Dependencies:**
- Epic 1 (infrastructure in place)
- Epics 2-5 (data models + assessment/sharing flows defined)
- Phase 1 MVP completion (US launch validated)

**Enables:** EU market expansion + comprehensive privacy compliance

**Note:** Cross-cutting concern — basic privacy is covered in Phase 1 via Epics 1, 4, 5 (TLS, Better Auth, default-private profiles). Epic 6 provides comprehensive GDPR compliance (encryption at rest, data deletion/portability, audit logging) needed for EU launch in Phase 2.

**Phase 1 Privacy Coverage:**
- ✅ TLS 1.3 encryption in transit (Epic 1)
- ✅ Better Auth password security (Epic 1)
- ✅ Default-private profiles (Epic 5)
- ✅ Explicit sharing controls (Epic 5)
- ✅ PostgreSQL RLS for data access control (Epic 2)

**Phase 2 Additions (Epic 6):**
- 🔒 AES-256-GCM encryption at rest (Story 6.1)
- 🌍 GDPR data deletion/portability (Story 6.2)
- 📋 Comprehensive audit logging (Story 6.3)

**Critical:** Not required for US-only MVP (Phase 1). Must be complete before EU launch (Phase 2).

**User Value:** Users trust that their data is secure, and EU users have full GDPR rights

### Story 6.1: Server-Side Encryption at Rest and TLS in Transit (TDD)

As a **Security Engineer**,
I want **all user conversation data, facet evidence, and assessment scores encrypted at rest in the database and encrypted in transit**,
So that **users trust the platform with personal assessment data and network eavesdropping is prevented**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for encryption and transit security
**When** I run `pnpm test encryption.test.ts`
**Then** tests fail (red) because encryption implementation doesn't exist
**And** each test defines expected behavior:
  - Test: Conversation data encrypted with AES-256-GCM at rest
  - Test: Facet evidence (quotes, scores) encrypted with AES-256-GCM at rest
  - Test: Assessment scores (facet/trait) encrypted at rest
  - Test: Encryption key derived from master secret (not user password)
  - Test: Database stores only encrypted ciphertext, no plaintext
  - Test: Decryption works for authorized backend services
  - Test: TLS 1.3 enforced on all API endpoints
  - Test: Security headers present (HSTS, X-Content-Type-Options, X-Frame-Options)

**IMPLEMENTATION (Green Phase):**
**Given** user conversation and assessment data is stored
**When** it's written to database
**Then** all sensitive data is encrypted using AES-256-GCM:
  - Conversation messages (assessment_messages.content)
  - Facet evidence quotes (facet_evidence.quote)
  - User profile data
**And** encryption key is derived from master secret (stored securely in Railway environment)
**And** encrypted data stored in PostgreSQL tables (assessment_messages, facet_evidence, sessions)
**And** backend services can decrypt for authorized access
**And** encryption tests pass (green)

**Given** data is in transit
**When** API requests sent between frontend and backend
**Then** all requests use TLS 1.3 (enforced by Railway + backend config)
**And** HTTP headers include:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
**And** TLS/header tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (verify encryption properties), implementation follows
- Database encryption: AES-256-GCM via `node:crypto` or `libsodium`
- Key derivation: Master secret from environment variable (Railway secure config)
- No per-user keys (would require key management complexity)
- Encryption happens on server before database write
- Decryption happens on server when data retrieved
- TLS 1.3: Enforced by Railway + backend middleware
- Security headers: Middleware adds to all responses
- No encryption on frontend (complexity not needed)
- No ElectricSQL (avoided key management nightmare)

**Acceptance Checklist:**
- [ ] Failing tests written first covering encryption/TLS scenarios (red phase)
- [ ] Tests verify AES-256-GCM encryption
- [ ] Tests verify facet evidence encryption (quotes)
- [ ] Tests verify assessment score encryption
- [ ] Tests verify master key management
- [ ] Tests verify encrypted storage in database
- [ ] Tests verify TLS 1.3 enforcement
- [ ] Tests verify all security headers present
- [ ] Implementation passes all tests (green phase)
- [ ] Conversation data encrypted before database storage
- [ ] Facet evidence quotes encrypted in facet_evidence table
- [ ] Assessment scores encrypted in facet_scores/trait_scores tables
- [ ] Master key stored securely in Railway env vars
- [ ] TLS 1.3 enforced on all API endpoints
- [ ] All security headers configured
- [ ] Decryption works for authorized backend services
- [ ] No plaintext conversation or evidence data stored
- [ ] 100% unit test coverage for encryption module

---

### Story 6.2: GDPR Compliance (Data Deletion & Portability, TDD)

As a **User**,
I want **to request my data be deleted or downloaded in a standard format**,
So that **I have control over my personal information** (GDPR Article 17, 20).

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for GDPR data operations
**When** I run `pnpm test gdpr-compliance.test.ts`
**Then** tests fail (red) because GDPR endpoints don't exist
**And** each test defines expected behavior:
  - Test: Data export returns valid JSON with all user data
  - Test: Export includes all assessments, conversations, archetypes, facet evidence
  - Test: Export includes all facet/trait scores with timestamps
  - Test: Account deletion removes all data including evidence (30-day soft delete)
  - Test: Deleted data is unrecoverable after 30 days
  - Test: Audit log records all deletion events

**IMPLEMENTATION (Green Phase):**
**Given** I want to delete my account
**When** I go to Settings → Delete Account
**Then** I see warning: "This will permanently delete your profile and conversation data"
**And** after confirmation, all data is erased (30-day retention for backups)
**And** deletion tests pass (green)

**Given** I want to download my data
**When** I click "Download My Data"
**Then** a JSON file is generated with:
  - Profile info (email, signup date)
  - All assessments (results, OCEAN codes, facet/trait scores)
  - Full conversation transcripts with timestamps
  - Facet evidence (all quotes, scores, confidence ratings)
  - Archetype history
**And** file is downloadable immediately
**And** export tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define GDPR contracts), implementation follows
- Delete endpoint: `DELETE /api/user/me` (authenticated)
- Data export endpoint: `GET /api/user/me/export` (returns JSON)
- 30-day soft delete before permanent erasure
- Audit log: record all deletions
- Unit test coverage: 100% of GDPR operations

**Acceptance Checklist:**
- [ ] Failing tests written first covering delete & export scenarios (red phase)
- [ ] Tests verify export JSON structure and completeness
- [ ] Tests verify facet evidence included in export
- [ ] Tests verify soft-delete removes evidence data
- [ ] Tests verify audit logging on deletion
- [ ] Implementation passes all tests (green phase)
- [ ] Delete account removes all user data (messages, evidence, scores)
- [ ] Data export includes all assessments with facet evidence
- [ ] Export includes conversation transcripts with evidence quotes
- [ ] Export includes facet/trait scores with timestamps
- [ ] Export is valid JSON
- [ ] 30-day retention enforced
- [ ] Audit log records deletions
- [ ] 100% unit test coverage for GDPR compliance

---

### Story 6.3: Audit Logging and Access Control (TDD)

As a **Security Team**,
I want **to log all access to user profiles and data**,
So that **we can audit who accessed what data and when**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for audit logging
**When** I run `pnpm test audit-logger.test.ts`
**Then** tests fail (red) because audit logging doesn't exist
**And** each test defines expected behavior:
  - Test: Profile access creates audit log entry
  - Test: Log includes user ID, viewer ID, action, timestamp, IP
  - Test: Anonymous access logged as "anonymous" viewer
  - Test: Admin audit query returns all events for user
  - Test: Audit logs retained for 1 year

**IMPLEMENTATION (Green Phase):**
**Given** a user's profile is viewed
**When** someone accesses it (user viewing their own, or shared link viewed)
**Then** an audit log entry is created with:
  - User ID being accessed
  - Viewer ID (if authenticated, or "anonymous" if shared link)
  - Timestamp
  - IP address
  - Action (view, download, delete)
**And** audit logging tests pass (green)

**Given** I query the audit logs
**When** I run `GET /api/admin/audit-logs?userId={userId}`
**Then** all access events are returned with full details
**And** query tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define audit contracts), implementation follows
- Audit table: `id, userId, viewerId, action, timestamp, ipAddress, userAgent`
- Middleware: Log all profile access
- Sensitive: Don't expose audit logs to non-admin users
- Retention: 1 year minimum (GDPR compliance)
- Pino logger: Output to structured logs for cloud monitoring
- Unit test coverage: 100% of audit logging logic

**Acceptance Checklist:**
- [ ] Failing tests written first covering all audit scenarios (red phase)
- [ ] Tests verify log entry creation on access
- [ ] Tests verify data completeness (IP, user agent, timestamp)
- [ ] Tests verify admin query access control
- [ ] Tests verify retention enforcement
- [ ] Implementation passes all tests (green phase)
- [ ] Audit log table created
- [ ] All access logged (view, download, delete)
- [ ] Audit log queryable by admin
- [ ] IP + user agent logged
- [ ] 1-year retention enforced
- [ ] 100% unit test coverage for audit logging

---

## Epic 7: UI Theme & Visual Polish

**Phase:** 2 (Post-MVP Polish)

**Goal:** Establish a distinctive ocean-inspired visual identity with dark mode support, custom color theming, Big Five trait visualization colors, and a redesigned home page.

**Dependencies:**
- Epic 4 (Frontend Assessment UI) - base components exist
- Epic 5 (Results & Profiles) - visualization surfaces ready

**Enables:** Brand differentiation, improved user experience, accessibility compliance

**User Value:** Polished, memorable visual experience that reinforces the "big-ocean" brand identity and supports user preferences (dark mode)

> **Detailed Specifications:** See [epic-7-ui-theming.md](./epic-7-ui-theming.md) for full design principles, color tokens, and component specifications.
>
> **Home Page Brainstorm:** See [story-7.5-home-page-brainstorm.md](./story-7.5-home-page-brainstorm.md) for detailed design exploration and wireframes.

### Story 7.1: Implement Ocean Brand Color Theme with Gradients

As a **User**,
I want **the application to have a distinctive ocean-inspired visual identity**,
So that **the brand feels cohesive and memorable**.

**Acceptance Criteria:**
- Primary color updated to ocean blue (OKLCH-based)
- All components use semantic variables (`bg-primary`, not `bg-blue-500`)
- Gradient CSS variables defined for hero sections and CTAs
- WCAG AA contrast ratios maintained

---

### Story 7.6: Add Global Header with Logo, Auth Controls, Theme Toggle, and Mobile Hamburger

As a **User**,
I want **a global header with logo, authentication controls, and a theme toggle that works well on mobile**,
So that **I can navigate and manage my account/theme consistently on every page**.

**Acceptance Criteria:**
- Header renders globally on all routes (via root layout)
- Logo is visible and links to `/`
- When signed out:
  - Header shows `Log in` and `Sign up` actions linking to `/login` and `/signup`
- When signed in:
  - Header shows a user menu (name/email) and `Sign out`
- Theme toggle is available in the header (wires to Story 7.2 theme system)
- Responsive behavior:
  - Desktop: actions visible inline
  - Mobile: inline actions collapse and a hamburger button appears
  - Hamburger opens a menu/drawer containing nav + auth actions + theme toggle
  - Drawer is dismissible (close button, backdrop click, `Esc`) and keyboard accessible
- Styling uses semantic theme variables (no hard-coded colors); touch targets ≥44px

---

### Story 7.2: Add Dark Mode Toggle with System Preference Detection

As a **User**,
I want **to switch between light and dark themes**,
So that **I can use the app comfortably in any lighting condition**.

**Acceptance Criteria:**
- System preference detection on first visit
- Manual toggle persists to localStorage
- No flash of unstyled content on load
- SSR-compatible (TanStack Start)

---

### Story 7.3: Define Big Five Trait and Facet Visualization Colors

As a **User**,
I want **each personality trait and facet to have a distinctive, consistent color**,
So that **I can quickly identify traits in charts and results**.

**Acceptance Criteria:**
- 5 trait color tokens with dark mode variants
- 30 facet color tokens (grouped by trait family)
- 5 trait gradient tokens for visualizations
- Utility functions: `getTraitColor()`, `getFacetColor()`, `getTraitGradient()`
- Colors tested for colorblind accessibility

---

### Story 7.4: Polish Component Visual Consistency

As a **User**,
I want **all UI components to feel cohesive and polished**,
So that **the application feels professional and trustworthy**.

**Acceptance Criteria:**
- Border radius consistent across components
- Shadow depths standardized
- Animation timings reviewed (150-300ms)
- Touch targets ≥44px on mobile
- Focus states visible and consistent

---

### Story 7.5: Redesign Home Page with Theme System

As a **User**,
I want **the home page to showcase the ocean brand identity with polished visuals**,
So that **I immediately understand the product value and feel invited to start an assessment**.

**Design Direction:** "Bento Ocean with Depth" — combining bento grid layout, subtle depth progression, interactive chat preview, and clean typography.

**Page Sections:**
1. Hero (gradient background, animated logo, CTA)
2. Value Props (3 bento cards)
3. Meet Nerin (chat preview mockup)
4. Five Dimensions (trait cards with gradients)
5. Results Teaser (blurred archetype preview)
6. Social Proof (optional)
7. Final CTA

**Acceptance Criteria:**
- All sections use semantic theme variables
- Trait cards use `--gradient-trait-*` colors
- No hard-coded colors remain
- Works in both light and dark modes
- Mobile responsive
- Lighthouse accessibility ≥90

---

### Implementation Sequence

1. **Story 7.1** (1 day) - Ocean colors + gradients foundation
2. **Story 7.2** (1 day) - Dark mode toggle
3. **Story 7.3** (1 day) - Trait + facet colors
4. **Story 7.5** (2-3 days) - Home page redesign
5. **Story 7.4** (1-2 days) - Visual polish

**Estimated Effort:** 7-10 days total

---

## Next Steps

This epic and story breakdown is now ready for implementation. The sequence is:

1. **Epic 1** - Infrastructure & Auth (foundational, enables all others)
2. **Epic 2** - Assessment Backend (core logic)
3. **Epic 3** - OCEAN Archetype System (results)
4. **Epic 4** - Frontend UI (user experience + component documentation)
5. **Epic 5** - Profile Sharing (viral growth)
6. **Epic 6** - Privacy & Data (compliance) — Phase 2
7. **Epic 7** - UI Theme & Visual Polish — Phase 2

Each epic contains detailed, implementable stories with clear acceptance criteria. Stories are sized for 2-5 day implementation cycles.

**Note on Testing:** Testing is integrated into implementation via TDD (Test-Driven Development) pattern. Each story includes comprehensive test coverage in its acceptance criteria following red-green-refactor cycle.

---

**Document Status:** Requirements extracted and organized. Ready for Step 2: Epic Design (adding technical details, dependencies, and implementation sequencing).
