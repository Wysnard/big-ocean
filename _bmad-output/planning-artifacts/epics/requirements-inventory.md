# Requirements Inventory

## Functional Requirements

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

## Non-Functional Requirements

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

## Additional Requirements from Architecture

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

## FR Coverage Map

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
| 7. UI Theme & Visual Identity | 7.1 Psychedelic Brand Design Tokens | — | NFR10 (Accessibility) |
| 7. UI Theme & Visual Identity | 7.2 Typography System | — | NFR10 |
| 7. UI Theme & Visual Identity | 7.3 Dark Mode Toggle | — | NFR10 |
| 7. UI Theme & Visual Identity | 7.4 OCEAN Geometric Identity System | FR8, FR9 | NFR10 |
| 7. UI Theme & Visual Identity | 7.5 Trait & Facet Visualization Colors | FR5, FR6, FR11 | NFR10 |
| 7. UI Theme & Visual Identity | 7.6 Global Header | — | NFR10 |
| 7. UI Theme & Visual Identity | 7.7 Illustration & Icon System | — | NFR10 |
| 7. UI Theme & Visual Identity | 7.8 Home Page Redesign | — | NFR10 |
| 7. UI Theme & Visual Identity | 7.9 Results Page Visual Redesign | FR5-FR11 | NFR2, NFR10 |
| 7. UI Theme & Visual Identity | 7.10 Assessment Chat UX Polish | FR1, FR2, FR4 | NFR2, NFR10 |
| 7. UI Theme & Visual Identity | 7.11 Auth-Gated Results Reveal | FR13, FR14, FR15 | NFR3, NFR10 |
| 7. UI Theme & Visual Identity | 7.12 Shareable Public Profile & Share Cards | FR13, FR14, FR15 | NFR3, NFR6, NFR10 |
| 7. UI Theme & Visual Identity | 7.13 Registered User Profile Page | FR3, FR13 | NFR3, NFR10 |
| 7. UI Theme & Visual Identity | 7.14 Component Visual Consistency | — | NFR10 |
| 8. Results Content | 8.1 Archetype Descriptions | FR10 | NFR1 (Quality) |
| 8. Results Content | 8.2 Trait Level Descriptions | FR10, FR11 | NFR1 |
| 8. Results Content | 8.3 Facet Level Descriptions | FR11 | NFR1 |
| 8. Results Content | 8.4 Personalized Portrait (70%) | FR10 | NFR1, NFR8 |
| 8. Results Content | 8.5 Portrait Regen (85% Paid) | FR10 | NFR1, NFR8 |

---
