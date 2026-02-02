---
stepsCompleted:
  [
    "step-01-validate-prerequisites",
    "step-02-design-epics",
    "step-03-create-stories",
  ]
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

**FR6:** System calculates Big Five trait scores as the mean of their related facets (trait score = mean of 6 facets, 0-20 per trait: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)

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

**FR22:** System implements optimistic updates for instant UI feedback (user message appears immediately, synced on server response)

**FR23:** System loads full conversation history in <1 second when resuming assessment from different device

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

| Epic                      | Story                                       | Primary FR(s)    | NFR(s)               |
| ------------------------- | ------------------------------------------- | ---------------- | -------------------- |
| 1. Infrastructure & Auth  | 1.1 Railway Setup                           | Infrastructure   | NFR8 (Cost)          |
| 1. Infrastructure & Auth  | 1.2 Better Auth Integration                 | —                | NFR3 (Privacy)       |
| 1. Infrastructure & Auth  | 1.3 RPC & Effect Setup                      | —                | NFR2 (Performance)   |
| 2. Assessment Backend     | 2.1 Session Management                      | FR1, FR3, FR21   | NFR2, NFR5           |
| 2. Assessment Backend     | 2.2 Nerin Agent Setup                       | FR2, FR4         | NFR1 (Quality), NFR2 |
| 2. Assessment Backend     | 2.3 Analyzer & Scorer                       | FR5, FR6, FR7    | NFR2, NFR4           |
| 2. Assessment Backend     | 2.4 LangGraph Orchestration                 | FR1, FR3, FR4    | NFR1, NFR2, NFR8     |
| 2. Assessment Backend     | 2.5 Cost Tracking & Rate Limiting           | FR24, FR25, FR26 | NFR8                 |
| 3. OCEAN Archetype System | 3.1 Code Generation                         | FR8, FR9         | NFR4                 |
| 3. OCEAN Archetype System | 3.2 Archetype Lookup & Storage              | FR10, FR11       | NFR2, NFR4           |
| 4. Frontend Assessment UI | 4.1 Assessment Component                    | FR1, FR2, FR4    | NFR2, NFR10          |
| 4. Frontend Assessment UI | 4.2 Session Resumption (Device Switching)   | FR21, FR23       | NFR2, NFR7           |
| 4. Frontend Assessment UI | 4.3 Optimistic Updates & Progress Indicator | FR4, FR22        | NFR2, NFR10          |
| 4. Frontend Assessment UI | 4.4 Authentication UI                       | —                | NFR3                 |
| 5. Results & Profiles     | 5.1 Results Display                         | FR5-FR11         | NFR2, NFR4           |
| 5. Results & Profiles     | 5.2 Profile Sharing                         | FR13, FR14, FR15 | NFR3, NFR6           |
| 6. Privacy & Data         | 6.1 Encryption at Rest                      | FR17, FR18       | NFR3, NFR6           |
| 6. Privacy & Data         | 6.2 GDPR Implementation                     | FR19, FR20       | NFR3                 |
| 6. Privacy & Data         | 6.3 Audit Logging                           | FR20             | NFR3                 |
| 7. Testing & Quality      | 7.1 Unit Testing Framework                  | —                | —                    |
| 7. Testing & Quality      | 7.2 Integration Testing                     | —                | —                    |
| 7. Testing & Quality      | 7.3 E2E Testing                             | —                | —                    |
| 7. Testing & Quality      | 7.4 Component Documentation                 | —                | —                    |

---

## Epic List

1. **Infrastructure & Auth Setup** — Railway deployment, authentication, RPC foundation
2. **Assessment Backend Services** — Nerin orchestration, multi-agent coordination, cost control
3. **OCEAN Archetype System** — 4-letter code generation, archetype lookup, facet mappings
4. **Frontend Assessment UI** — Conversation component, real-time sync, progress tracking
5. **Results & Profile Sharing** — Results display, shareable links, PDF export
6. **Privacy & Data Management** — Encryption, GDPR compliance, audit logging
7. **Testing & Quality Assurance** — Test infrastructure, component documentation, CI/CD

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
- `sessions` table: `id, userId, createdAt, precision, status (active/paused/completed)`
- `messages` table: `id, sessionId, role (user/assistant), content, createdAt`
- Session state stored entirely server-side
- Resume via URL: `/assessment?sessionId={sessionId}`
- History load on resume: TanStack Query fetches all messages + precision from server
- Session restoration: <1 second load time for full history
- Unit test coverage: 100% of session CRUD operations

**Acceptance Checklist:**

- [ ] Failing tests written first covering session scenarios (red phase)
- [ ] Tests verify session creation and ID uniqueness
- [ ] Tests verify message persistence
- [ ] Tests verify precision restoration
- [ ] Implementation passes all tests (green phase)
- [ ] Session created on startAssessment
- [ ] Messages persisted in database
- [ ] Session resume loads full conversation history
- [ ] Precision scores restored on resume
- [ ] History loads in <1 second
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

### Story 2.3: Analyzer and Scorer Agent Implementation (TDD)

As a **Backend System**,
I want **to extract patterns from conversation and score all 30 Big Five facets**,
So that **I can derive accurate trait scores and continuously improve precision estimates**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for facet scoring
**When** I run `pnpm test scorer.test.ts`
**Then** tests fail (red) because Scorer implementation doesn't exist
**And** each test defines expected behavior:

- Test: Scorer takes conversation patterns → returns 30 facet scores (0-20)
- Test: Trait means calculated correctly (sum of 6 facets / 6)
- Test: Precision increases with more data points
- Test: Same patterns produce deterministic scores (no randomness)

**IMPLEMENTATION (Green Phase):**
**Given** 3 user messages have been received
**When** the Analyzer is triggered
**Then** it extracts relevant personality patterns from conversation (e.g., "prefers solitude" → low Gregariousness facet)
**And** the Scorer calculates scores for all 30 facets (0-20 scale each)
**And** trait scores are computed by taking the mean of related facets:

- Openness = mean(Imagination, Artistic Interests, Emotionality, Adventurousness, Intellect, Liberalism)
- Conscientiousness = mean(Self-Efficacy, Orderliness, Dutifulness, Achievement-Striving, Self-Discipline, Cautiousness)
- Extraversion = mean(Friendliness, Gregariousness, Assertiveness, Activity Level, Excitement-Seeking, Cheerfulness)
- Agreeableness = mean(Trust, Morality, Altruism, Cooperation, Modesty, Sympathy)
- Neuroticism = mean(Anxiety, Anger, Depression, Self-Consciousness, Immoderation, Vulnerability)
  **And** precision confidence increases based on facet score convergence and pattern strength
  **And** all failing tests now pass (green)

**INTEGRATION:**
**Given** precision is updated
**When** the frontend renders results
**Then** facet scores are visible (all 30, user-selectable by trait)
**And** trait scores reflect the mean of facets
**And** the "you're X% assessed" progress bar updates
**And** precision stability is visible (e.g., "High confidence in Openness based on 4 facets")

**Technical Details:**

- **TDD Workflow**: Tests written first (define contracts), implementation follows
- Analyzer: Extracts personality patterns using Claude API (cheaper model option)
- Scorer: Calculates facet scores (0-20 scale) using deterministic algorithm
- Facet list: 30 facets across 5 traits (6 per trait)
- Trait calculation: `traitScore = mean(facet1, facet2, ..., facet6)` for each trait
- Score storage: Database stores all 30 facet scores, computed trait scores, and precision
- Batch execution: Analyzer/Scorer run every 3 messages (configurable)
- Determinism: Same conversation patterns always produce same facet → same trait scores
- Unit test coverage: 100% of Scorer logic (all facet calculations, trait means, edge cases)

**Acceptance Checklist:**

- [ ] Failing tests written first (red phase)
- [ ] Tests cover all 30 facet scoring scenarios
- [ ] Tests verify trait mean calculation
- [ ] Tests verify determinism (same input → same output)
- [ ] Implementation passes all tests (green phase)
- [ ] Analyzer extracts patterns from 3+ messages
- [ ] Trait scores verified: trait = mean(facets) for all 5 traits
- [ ] Precision increases as more facet data gathered
- [ ] 100% unit test coverage for Scorer module

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
- Test: Triggers Analyzer + Scorer on every 3rd message
- Test: Routes to Nerin with extra context when precision < 50%
- Test: Skips expensive ops when approaching budget
- Test: Routing decisions are deterministic (same state → same decision)

**IMPLEMENTATION (Green Phase):**
**Given** a new message from the user
**When** the orchestrator receives it
**Then** it routes to Nerin for response generation (always)
**And** every 3rd message triggers Analyzer + Scorer (batch)
**And** if precision < 50%, extra context is generated for Nerin
**And** routing tests pass (green)

**Given** cost is approaching daily limit
**When** the next assessment would exceed budget
**Then** the orchestrator skips Analyzer/Scorer
**And** routes directly to Nerin (cost-saving)
**And** shows user graceful message: "Quality may be reduced while optimizing..."
**And** cost-aware routing tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define routing contracts), implementation follows
- LangGraph state machine with nodes: Nerin, Analyzer, Scorer
- State includes: messages, precision, cost spent, precision gaps
- Routing logic: Always Nerin, conditional Analyzer/Scorer (every 3 msgs or low precision)
- Cost-aware routing: Skip expensive ops if approaching budget
- Deterministic: Same state always produces same routing decision
- Unit test coverage: 100% of routing logic paths

**Acceptance Checklist:**

- [ ] Failing tests written first covering all routing scenarios (red phase)
- [ ] Tests verify Nerin routing on every message
- [ ] Tests verify Analyzer/Scorer batch triggering
- [ ] Tests verify precision-based routing
- [ ] Tests verify cost-aware skipping
- [ ] Implementation passes all tests (green phase)
- [ ] State machine defined in LangGraph
- [ ] Routing to Nerin on every message
- [ ] Analyzer/Scorer triggered every 3 messages
- [ ] Cost-aware routing skips analysis when needed
- [ ] Precision tracking influences routing decisions
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

- Test: Cost calculation formula: (inputTokens / 1M _ 0.003) + (outputTokens / 1M _ 0.015)
- Test: Daily cost accumulation in Redis
- Test: Rate limit enforced: 1 assessment per user per day
- Test: Hard cap: reject if daily spend exceeds $75
- Test: Graceful error messages returned to user

**IMPLEMENTATION (Green Phase):**
**Given** a user starts an assessment
**When** Nerin is called
**Then** system logs token counts (input + output)
**And** cost is calculated (input_tokens _ 0.003 + output_tokens _ 0.015)
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

### Story 3.1: Generate 5-Letter OCEAN Codes from Trait Scores (TDD)

As a **Backend System**,
I want **to deterministically map trait scores (derived from facet means) to 5-letter OCEAN codes for all traits**,
So that **the same facet scores always produce the same trait levels for storage and reference**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for OCEAN code generation
**When** I run `pnpm test ocean-code-generator.test.ts`
**Then** tests fail (red) because code generator doesn't exist
**And** each test defines expected behavior:

- Test: Facet means calculated correctly (6 facets per trait, 0-20 scale)
- Test: All 243 trait level combinations map to correct codes (3^5 possibilities)
- Test: Trait 0-6.67 → Low (L), 6.67-13.33 → Mid (M), 13.33-20 → High (H)
- Test: Same facet scores always produce same code (deterministic)
- Test: Code is exactly 5 letters (e.g., "HMLHM")

**IMPLEMENTATION (Green Phase):**
**Given** all 30 facets are scored (e.g., Imagination=16, Artistic=14, etc.)
**When** the Trait Score Aggregator calculates means for all 5 traits:

- Openness = mean(6 O facets) = 18
- Conscientiousness = mean(6 C facets) = 14
- Extraversion = mean(6 E facets) = 10
- Agreeableness = mean(6 A facets) = 16
- Neuroticism = mean(6 N facets) = 12
  **And** the code generator processes trait scores
  **Then** each trait is mapped to a level:
- Openness 18 → High (H)
- Conscientiousness 14 → Mid (M)
- Extraversion 10 → Low (L)
- Agreeableness 16 → High (H)
- Neuroticism 12 → Mid (M)
  **And** full 5-letter code is generated as: "HMLHM" (5 letters for complete OCEAN storage)
  **And** code is deterministic (same facet scores → same trait means → same code, always)
  **And** all failing tests now pass (green)

**REFACTOR & INTEGRATION:**
**Given** facet scores are updated (precision increases)
**When** trait means are recalculated and code is regenerated
**Then** if any trait level changed, code changes
**And** if all trait levels stay same, code stays same

**Technical Details:**

- **TDD Workflow**: Tests written first (cover all 243 combinations), implementation follows
- Facet → Trait aggregation:
  - Trait score = mean of 6 related facets (each 0-20 scale)
  - Result is 0-20 scale for the trait
- Trait → Level mapping:
  - 0-6.67: Low (L)
  - 6.67-13.33: Mid (M)
  - 13.33-20: High (H)
- 5-letter code storage: Stores all 5 traits (O, C, E, A, N) in database for complete profile
- Archetype naming (Story 3.2): Uses first 4 letters (O, C, E, A) for POC; Phase 2 adds N
- Facet database storage: All 30 facet scores (0-20 each)
- Derived trait scores: Computed as means from stored facets
- Unit test coverage: 100% code paths (all 243 combinations tested)

**Acceptance Checklist:**

- [ ] Failing tests written first covering all combinations (red phase)
- [ ] Tests verify boundary conditions (0, 6.67, 13.33, 20)
- [ ] Tests verify all 243 combinations map correctly
- [ ] Implementation passes all tests (green phase)
- [ ] All 30 facet scores stored in database
- [ ] Trait scores calculated as mean of related facets
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

**Goal:** Build the conversational assessment interface with real-time sync, progress tracking, and seamless user experience.

**Dependencies:**

- Epic 1 (RPC contracts)
- Epic 2 (backend assessment endpoints live)
- Epic 3 (archetype system working for results display)

**Enables:** Epic 5 (builds on working assessment UI for sharing), user can start assessments

**Blocked By:** Epics 1, 2, 3 must complete first

**Parallel Development:** Can design UI components + storybook docs (Epic 7) in parallel with backend work

**User Value:** Delivers engaging, responsive assessment experience with instant feedback and progress visibility

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

**Technical Details:**

- React component: `AssessmentUI.tsx`
- Message list with TanStack DB live queries
- Message input with TanStack Form
- Streaming response display (word-by-word)
- Optimistic insert: message added locally before server confirms
- Mobile-responsive with Tailwind CSS v4

**Acceptance Checklist:**

- [ ] Conversation displays message list
- [ ] User messages appear instantly (optimistic)
- [ ] Nerin responses stream in real-time
- [ ] Scrolling shows full history
- [ ] Mobile layout is readable
- [ ] Input field accessible and responsive

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
- [ ] Implementation passes all tests (green phase)
- [ ] Resume endpoint returns full session state
- [ ] History loads in <1 second
- [ ] Can resume from different device
- [ ] No message loss on device switch
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
- [ ] Implementation passes all tests (green phase)
- [ ] Messages appear instantly (optimistic)
- [ ] Input field clears immediately
- [ ] Progress bar displays precision
- [ ] Updates animate smoothly
- [ ] Correct labels shown at thresholds
- [ ] Mobile-responsive
- [ ] 100% unit test coverage for optimistic updates

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

### Story 5.1: Display Assessment Results

As a **User**,
I want **to see my personality summarized with my archetype name, trait levels, and facet descriptions**,
So that **I understand what my assessment revealed**.

**Acceptance Criteria:**

**Given** I complete an assessment (precision ≥ 50%)
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

- All 6 facet scores (0-20 scale): Imagination, Artistic Interests, Emotionality, Adventurousness, Intellect, Liberalism
- Average of these 6 facets = Openness trait score (High/Mid/Low)
- Top-scoring facets highlighted (e.g., "Imagination: 16/20" and "Intellect: 15/20")

**Given** precision < 50%
**When** results are viewed
**Then** message shows: "Keep talking to see more accurate results"
**And** results show preliminary assessment with facet data available so far

**Technical Details:**

- Results component fetches all 30 facet scores from database
- Displays trait levels (High/Mid/Low) derived from facet means
- Trait score = mean of 6 related facet scores
- Shows facet breakdown on demand (expandable sections)
- Color-coded by trait
- Archetype description is pre-written (not LLM-generated)
- Precision shown as facet convergence metric

**Acceptance Checklist:**

- [ ] Results component displays archetype name
- [ ] Trait levels shown (High/Mid/Low) computed from facet means
- [ ] All 30 facet scores stored and retrievable
- [ ] Facet details expandable for each trait
- [ ] Facet breakdown shows how mean is calculated
- [ ] Archetype description visible
- [ ] Color differentiation applied by trait
- [ ] Precision calculation considers facet convergence
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

## Epic 6: Privacy & Data Management

**Goal:** Implement encryption, GDPR compliance, and comprehensive audit logging.

**Dependencies:**

- Epic 1 (infrastructure in place)
- Epics 2-5 (data models + assessment/sharing flows defined)

**Enables:** User trust + legal compliance; can work in parallel with Epics 2-4 for design, implementation after

**Note:** Cross-cutting concern — encryption/privacy should be architected early (Epic 1) but detailed implementation (audit logs, deletion flows) follows after core features (Epics 2-5) exist

**Critical:** Must be complete before launch (MVP blocker for legal compliance)

**User Value:** Users trust that their data is secure and they have full control

### Story 6.1: Server-Side Encryption at Rest and TLS in Transit (TDD)

As a **Security Engineer**,
I want **all user conversation data encrypted at rest in the database and encrypted in transit**,
So that **users trust the platform with personal assessment data and network eavesdropping is prevented**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for encryption and transit security
**When** I run `pnpm test encryption.test.ts`
**Then** tests fail (red) because encryption implementation doesn't exist
**And** each test defines expected behavior:

- Test: Conversation data encrypted with AES-256-GCM at rest
- Test: Encryption key derived from master secret (not user password)
- Test: Database stores only encrypted ciphertext, no plaintext
- Test: Decryption works for authorized backend services
- Test: TLS 1.3 enforced on all API endpoints
- Test: Security headers present (HSTS, X-Content-Type-Options, X-Frame-Options)

**IMPLEMENTATION (Green Phase):**
**Given** user conversation is stored
**When** it's written to database
**Then** it's encrypted using AES-256-GCM
**And** encryption key is derived from master secret (stored securely in Railway environment)
**And** encrypted data stored in PostgreSQL conversation table
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
- [ ] Tests verify master key management
- [ ] Tests verify encrypted storage in database
- [ ] Tests verify TLS 1.3 enforcement
- [ ] Tests verify all security headers present
- [ ] Implementation passes all tests (green phase)
- [ ] Conversation data encrypted before database storage
- [ ] Master key stored securely in Railway env vars
- [ ] TLS 1.3 enforced on all API endpoints
- [ ] All security headers configured
- [ ] Decryption works for authorized backend services
- [ ] No plaintext conversation data stored
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
- Test: Export includes all assessments, conversations, archetypes
- Test: Account deletion removes all data (30-day soft delete)
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
- All assessments (results, OCEAN codes)
- Full conversation transcripts
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
- [ ] Tests verify soft-delete mechanism
- [ ] Tests verify audit logging on deletion
- [ ] Implementation passes all tests (green phase)
- [ ] Delete account removes all user data
- [ ] Data export includes all assessments
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

## Epic 7: Testing & Quality Assurance

**Goal:** Implement comprehensive testing infrastructure covering unit, integration, E2E, and component documentation.

**Dependencies:**

- Epic 1 (infrastructure setup for test database)
- Epics 2-6 (features to be tested)

**Enables:** Confidence in code quality, automated regression prevention, team onboarding via component docs

**Parallel Development:** Test framework setup can begin in Epic 1; unit tests written during Epics 2-5; integration/E2E tests after features exist

**Note:** Not a blocker for launch (can test manually in MVP), but recommended to have basic test infrastructure by launch

**User Value:** High confidence in code quality, regression prevention, and component library documentation

### Story 7.1: Unit Testing Framework Setup & TDD Pattern

As a **Developer**,
I want **to set up Vitest with Test-Driven Development (TDD) workflow for backend features**,
So that **all domain logic, RPC contracts, and backend services are built with comprehensive test coverage**.

**Acceptance Criteria:**

**Given** Vitest is configured across the monorepo
**When** I run `pnpm test`
**Then** all unit tests execute in <2 seconds total
**And** I can run `pnpm test --ui` for interactive test browser
**And** coverage reports generated showing domain logic at 100%

**Given** I'm implementing a domain feature (e.g., OCEAN code generation)
**When** I follow TDD red-green-refactor cycle
**Then** I write failing test first (red phase)
**And** test defines expected behavior with assertion
**And** I implement code to pass test (green phase)
**And** I refactor for clarity while keeping tests green

**Given** a backend feature story requires testing
**When** the story is implemented
**Then** unit tests exist for all code paths
**And** coverage report shows ≥100% for domain logic, ≥90% for RPC contracts

**Technical Details:**

- Vitest ESM-native configuration
- Test files: `*.test.ts` in packages/domain, packages/contracts, packages/database
- TDD workflow: Test → Implementation → Refactor
- Test utilities: describe/it/expect with vitest
- Snapshot testing for OCEAN archetype descriptions
- Mock utilities for external dependencies (Anthropic API, database)
- Coverage target: 100% domain logic, 90%+ RPC contracts, 60% UI
- `@vitest/ui` for interactive test browser
- CI integration: tests run on every PR

**TDD Examples for Backend Epics:**

- **Story 2.3 (Analyzer & Scorer)**: Write facet scoring tests first, then implement scorer
- **Story 3.1 (OCEAN Code Gen)**: Write tests for all 243 trait level combinations, then implement code generator
- **Story 2.5 (Cost Tracking)**: Write cost calculation tests, then implement tracker
- **Story 6.1 (Encryption)**: Write encryption/decryption roundtrip tests, then implement crypto layer

**Acceptance Checklist:**

- [ ] Vitest installed, configured, and working
- [ ] Sample TDD test written (red → green → refactor cycle demonstrated)
- [ ] Test utilities + mocks available for common patterns
- [ ] Coverage reports generated and tracked
- [ ] Tests run in CI on every PR
- [ ] `pnpm test --ui` interactive browser functional
- [ ] Documentation of TDD workflow for team

---

### Story 7.2: Integration Testing with Real Database

As a **Developer**,
I want **to test RPC handlers with actual PostgreSQL to verify database interactions**,
So that **I catch query bugs before production**.

**Acceptance Criteria:**

**Given** TestContainers is configured
**When** I run `pnpm test assessment.integration`
**Then** a PostgreSQL container spins up automatically
**And** migrations run
**And** tests execute against real database
**And** container is torn down after tests complete

**Given** a test calls `startAssessment` RPC
**When** the handler runs
**Then** a session is created in database
**And** test verifies the session exists and has correct data

**Technical Details:**

- TestContainers: `new GenericContainer("postgres:16")`
- Automatic port mapping
- Database cleanup after each test
- Test utilities: `testDb.start()`, `testDb.cleanup()`
- Cost: ~1 min per test suite (acceptable)

**Acceptance Checklist:**

- [ ] TestContainers working
- [ ] PostgreSQL spins up automatically
- [ ] Migrations run in test DB
- [ ] Tests verify database state
- [ ] Cleanup works

---

### Story 7.3: E2E Testing with Playwright

As a **QA Engineer**,
I want **to test the complete assessment flow from start to results**,
So that **I catch UI bugs and integration issues**.

**Acceptance Criteria:**

**Given** Playwright is configured
**When** I run `pnpm -C apps/front exec playwright test`
**Then** browsers open and test the assessment flow:

1. Navigate to home
2. Click "Start Assessment"
3. Send 5 messages
4. Verify results display
5. Click "Share"
6. Verify profile link works

**Given** a test fails
**When** I check artifacts
**Then** screenshots of failure are saved
**And** video of test session is recorded

**Technical Details:**

- Playwright test runner
- Multi-browser: Chromium, Firefox, WebKit
- Test scenarios: happy path, resume, error handling
- Video recording: `on-failure`
- Screenshots: `only-on-failure`

**Acceptance Checklist:**

- [ ] Playwright tests written
- [ ] Happy path test passes
- [ ] Error cases tested
- [ ] Artifacts captured on failure
- [ ] Tests run in <5 minutes

---

### Story 7.4: Component Documentation with Storybook

As a **Frontend Developer**,
I want **to document all UI components in Storybook with interactive examples**,
So that **other devs can browse components before writing custom code**.

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

- [ ] Storybook installed
- [ ] Button, Input, Dialog components documented
- [ ] Stories show variants
- [ ] a11y addon finds issues
- [ ] Storybook builds successfully

---

## Next Steps

This epic and story breakdown is now ready for implementation. The sequence is:

1. **Epic 1** - Infrastructure & Auth (foundational, enables all others)
2. **Epic 2** - Assessment Backend (core logic)
3. **Epic 3** - OCEAN Archetype System (results)
4. **Epic 4** - Frontend UI (user experience)
5. **Epic 5** - Profile Sharing (viral growth)
6. **Epic 6** - Privacy & Data (compliance)
7. **Epic 7** - Testing & QA (quality)

Each epic contains detailed, implementable stories with clear acceptance criteria. Stories are sized for 2-5 day implementation cycles.

---

**Document Status:** Requirements extracted and organized. Ready for Step 2: Epic Design (adding technical details, dependencies, and implementation sequencing).
