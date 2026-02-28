---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture-conversation-pipeline.md"
---

# big-ocean - Epic Breakdown (Conversation Pipeline V1 Rewrite)

## Overview

This document provides the complete epic and story breakdown for the big-ocean conversation pipeline V1 rewrite, decomposing the requirements from the PRD and Conversation Pipeline Architecture into implementable stories. This covers Decisions 1-12 and the phased rollout (Phase 0-4).

## Requirements Inventory

### Functional Requirements

**Assessment & Conversation**
- FR1: Users can complete multi-turn conversational personality assessment with AI agent for minimum 30 minutes
- FR2: Users can send messages and receive responses in real-time with streaming (response time <2 seconds P95)
- FR3: Users can pause assessment and resume later from saved conversation state (session ID + message offset + conversation context)
- FR4: System displays real-time progress indicator showing percentage completion (0-100%)

**Big Five Trait Assessment (Evidence-Based Facet Scoring)**
- FR5: System analyzes each message to detect 30 Big Five facet signals, creating evidence records with: facet name, numeric score (0-20), confidence (0-1), exact quote, and character-level highlight range tied to messageId
- FR5.1: System stores facet evidence in facet_evidence table with indexes on messageId and facet for bidirectional navigation
- FR5.2: System aggregates facet evidence every 3 messages using weighted averaging (recency + confidence) and contradiction detection
- FR5.3: System adjusts facet confidence based on evidence consistency
- FR6: Users can view Big Five trait scores derived from facet averages using FACET_TO_TRAIT lookup
- FR6.1: Users can click any facet score in profile to view supporting evidence with highlighted message quotes
- FR6.2: Users can click any message in conversation history to see which facets it contributed to
- FR7: System maintains and updates per-facet confidence scores (0.0-1.0) throughout conversation

**OCEAN Archetype System (POC Scope: 4 Traits)**
- FR8: Users receive 4-letter OCEAN archetype code generated from trait levels (O, C, E, A: each Low/Mid/High)
- FR9: System maps OCEAN codes to memorable character archetype names (~25-30 hand-curated + component-based)
- FR10: System retrieves archetype name + 2-3 sentence trait description
- FR11: System displays all 24 facet level names aligned with user's assessment results on request

**Profile & Results**
- FR13: System generates shareable profile with archetype code, character name, trait summary, and facet insights
- FR14: System creates unique profile URL for each completed assessment
- FR15: System displays profile as private by default with explicit user control for sharing

**Bidirectional Evidence Highlighting (Transparency Feature)**
- FR17: Users can click any facet score to view "Show Evidence" panel listing supporting message quotes
- FR17.1: Clicking "Jump to Message" scrolls to message and highlights the exact quote
- FR17.2: System applies color-coded highlighting: green (strong positive), yellow (moderate), red (contradictory)
- FR18: Users can click any message to view side panel showing facet contributions
- FR18.1: System displays bidirectional navigation: Profile ↔ Evidence ↔ Message
- FR19: System uses character-level highlightRange for precise text highlighting

**Data Management**
- FR20: System stores complete conversation history encrypted at rest
- FR20.1: System stores facet evidence records with messageId references
- FR21: System encrypts all data in transit (TLS 1.3 minimum)
- FR23: System maintains session state on server with URL-based resumption
- FR25: System implements optimistic updates for instant UI feedback

**Infrastructure**
- FR27: System monitors LLM costs per user and session in real-time
- FR28: System implements rate limiting (1 assessment per user per day, 1 resume per week)
- FR29: System auto-disables assessment if daily LLM cost threshold exceeded

### NonFunctional Requirements

- NFR1: Nerin response time < 2 seconds (P95)
- NFR2: Assessment data saves < 500ms latency
- NFR3: Profile page loads in < 1 second
- NFR4: Handle 500 concurrent users in MVP without degradation
- NFR5: Query response time < 500ms for user data retrieval
- NFR6: Zero unauthorized profile access
- NFR7: Conversation data encrypted at rest + in transit
- NFR13: OCEAN code generation deterministic
- NFR14: Archetype name + description lookup < 100ms
- NFR15: LLM cost per assessment ≤ $0.15 (target: $0.10)

### Additional Requirements

**From Architecture — Conversation Pipeline (Decisions 1-12):**

- D1: Consolidate scoring on `formula.ts`, deprecate `scoring.ts`. Display use-cases read persisted `assessment_results` instead of re-computing.
- D2: All-30-facets steering with OCEAN round-robin tiebreaker. Unexplored facets get maximum priority.
- D3: Kill FinAnalyzer. ConversAnalyzer becomes single evidence source. 87% cost reduction on evidence extraction.
- D4: Evidence v2 format — `deviation: -3 to +3`, `strength: weak/moderate/strong`, `confidence: low/medium/high`. Weight = strength × confidence.
- D5: Remove "specific thing they said" constraint from portrait prompts.
- D6: Bump domain switch cost λ from 0.1 to 0.3.
- D7: Migration strategy — drop tables on schema-breaking deploys (pre-PMF).
- D8: Prompt evaluation — ship and observe.
- D9: ConversAnalyzer error resilience — retry twice, remain non-fatal.
- D10: Finalization pipeline rewrite — stage-based idempotency (`scored → completed`).
- D11: Micro-intent realizer — pure function for natural steering (`story_pull`, `tradeoff_probe`, etc.).
- D12: Conversation review — annotations via extended message response.
- IC-1: `computeFacetMetrics()` rewrite for v2 evidence natively.
- IC-2: `domainStreak` computed from message history.
- Rolling evidence budget: per-message cap 5 (up from 3), session cap 80.
- Depth signal updated for Evidence v2: `finalWeight ≥ 0.36` threshold.
- Dead code cleanup: `update-facet-scores.use-case.ts`, `facet-evidence.noop.repository.ts`.
- Brownfield: existing codebase with hexagonal architecture, Effect-ts.

**V1 Rewrite Phased Rollout:**
- Phase 0: Fix the Plumbing (scoring consolidation + observability)
- Phase 1: Micro-Intent Steering (conversational micro-intents replace raw facet/domain strings)
- Phase 2: Evidence v2 + Scoring v2 (new evidence format + formula rewrite, merged)
- Phase 3: Kill FinAnalyzer (single evidence source, finalization pipeline rewrite)
- Phase 4: Context Dependence (v2+, gated — cross-domain variation, conflict detection)

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 2 | Multi-turn conversational assessment |
| FR2 | Epic 2 | Real-time streaming responses |
| FR4 | Epic 2 | Progress indicator |
| FR5 | Epic 3 | Evidence extraction (v2 format) |
| FR5.1 | Epic 3 | Evidence storage with indexes |
| FR5.2 | Epic 2 | Evidence aggregation |
| FR5.3 | Epic 3 | Confidence adjustment based on consistency |
| FR6 | Epic 1 | Trait scores from persisted results |
| FR6.1 | Epic 5 | Click facet → view evidence |
| FR6.2 | Epic 5 | Click message → view facet contributions |
| FR7 | Epic 1, 2 | Per-facet confidence maintained |
| FR10 | Epic 4 | Archetype description retrieval |
| FR13 | Epic 1, 4 | Shareable profile generation |
| FR14 | Epic 1 | Unique profile URL |
| FR15 | Epic 1 | Private by default |
| FR17 | Epic 5 | Show Evidence panel |
| FR17.1 | Epic 5 | Jump to Message navigation |
| FR17.2 | Epic 5 | Color-coded highlighting |
| FR18 | Epic 5 | Message → facet contributions panel |
| FR18.1 | Epic 5 | Bidirectional navigation |
| FR19 | Epic 5 | Character-level highlight range |
| FR20.1 | Epic 5 | Evidence records with messageId |
| FR23 | Epic 2 | Session state with URL resumption |
| FR25 | Epic 2 | Optimistic updates |
| FR27 | Epic 3 | LLM cost monitoring |
| FR28 | Epic 3 | Rate limiting |
| FR29 | Epic 3 | Auto-disable on cost threshold |

**Already implemented (not in rewrite scope):** FR3 (pause/resume), FR8-9 (OCEAN code), FR11 (facet names), FR20 (encryption at rest), FR21 (TLS 1.3)

## Epic List

### Epic 1: Consistent Scoring & Results Accuracy

Users see consistent, accurate personality scores everywhere — profile, shareable link, results page all show the same numbers. No more silent re-computation producing different results on different pages.

**FRs covered:** FR6, FR7, FR13, FR14, FR15
**Architecture:** D1 (consolidate scoring), D6 (λ bump), D8 (observability), dead code cleanup
**Depends on:** None (entry point)

### Story 1.1: Migrate Display Use-Cases to Read Persisted Results

As a user viewing my assessment results,
I want to see the exact same scores on my results page, public profile, and shareable link,
So that my personality profile is consistent everywhere I or others view it.

**Acceptance Criteria:**

**Given** a completed assessment with persisted `assessment_results` (facets + traits)
**When** the user views their results via `get-results`
**Then** the scores are read directly from `assessment_results.facets` and `.traits` — no re-computation via `scoring.ts`

**Given** a completed assessment
**When** anyone views the public profile via `get-public-profile`
**Then** scores are read from persisted `assessment_results`, identical to the results page

**Given** a completed assessment
**When** the user creates a shareable profile via `create-shareable-profile`
**Then** scores are read from persisted `assessment_results`

**Given** a user resuming a session via `resume-session`
**When** scores are displayed
**Then** they are read from persisted `assessment_results` (not re-computed)

**Given** `portrait-prompt.utils.ts` building portrait input
**When** trait scores are needed
**Then** they are read from persisted results, not derived via `scoring.ts`

**Parallelism:** `parallelizable_with: [1.3, 1.4, 2.1, 2.3, 4.1]` | `depends_on: []` | `blocks: [1.2]`

### Story 1.2: Delete Legacy Scoring System

As a developer maintaining the codebase,
I want the deprecated `scoring.ts` and all its consumers removed,
So that there is a single source of truth for scoring (`formula.ts`).

**Acceptance Criteria:**

**Given** Story 1.1 has migrated all consumers away from `scoring.ts`
**When** the codebase is checked
**Then** `scoring.ts` is deleted along with its tests (`scoring-aggregate.test.ts`, `scoring-derive.test.ts`, `scoring.fixtures.ts`)
**And** `packages/domain/src/utils/index.ts` no longer exports `aggregateFacetScores` or `deriveTraitScores`
**And** `packages/domain/src/index.ts` no longer re-exports the above
**And** `eta` (η=0.3) is removed from `FORMULA_DEFAULTS` in `formula.ts`

**Parallelism:** `parallelizable_with: [2.1, 2.2, 2.3, 4.1]` | `depends_on: [1.1]` | `blocks: []`

### Story 1.3: Tune Steering Parameters and Add Observability

As a product operator,
I want conversation quality metrics tracked and the domain switch cost tuned,
So that I can evaluate steering effectiveness and conversations feel less jumpy.

**Acceptance Criteria:**

**Given** `formula.ts` `FORMULA_DEFAULTS`
**When** the lambda (λ) value is checked
**Then** it has been bumped from 0.1 to 0.3

**Given** an active assessment conversation
**When** each message is processed in `send-message.use-case.ts`
**Then** the following metrics are logged: `coveredFacets` (facets with confidence > 0.3 / 30), `questions_per_assistant_turn`, `topic_transitions_per_5_turns`

**Given** the λ=0.3 change is deployed
**When** `topic_transitions_per_5_turns` exceeds 4.0 across 50+ sessions (indicating conversations are still too jumpy)
**Then** revert λ to 0.1 and investigate — the observability metrics from this story provide the signal

**Parallelism:** `parallelizable_with: [1.1, 1.4, 2.1, 2.3, 4.1]` | `depends_on: []` | `blocks: []`

### Story 1.4: Dead Code Cleanup

As a developer,
I want unused code removed from the codebase,
So that the codebase stays lean and doesn't confuse future development.

**Acceptance Criteria:**

**Given** `update-facet-scores.use-case.ts` has no production callers (not exported from `use-cases/index.ts`)
**When** the codebase is checked
**Then** the file and its test are deleted

**Given** `facet-evidence.noop.repository.ts` is unused (production wires `FacetEvidenceDrizzleRepositoryLive`)
**When** confirmed no other consumer exists
**Then** the file is deleted

**Given** `scripts/eval-portrait.ts` imports `scoring.ts` functions
**When** updated
**Then** it reads from persisted results instead

**Parallelism:** `parallelizable_with: [1.1, 1.3, 2.1, 2.3, 4.1]` | `depends_on: []` | `blocks: []`

---

## Epic 2: Natural Conversation Steering

Nerin conversations feel more natural — broader 30-facet coverage, conversational arcs via micro-intents instead of raw "explore X through Y" directives, reduced exam feeling.

### Story 2.1: All-30-Facets Steering with OCEAN Round-Robin Tiebreaker

As a user taking the assessment,
I want Nerin to explore all aspects of my personality — not just traits that happen to come up early,
So that my final profile has broad, balanced coverage across all 30 facets.

**Acceptance Criteria:**

**Given** `computeSteeringTarget()` is called with a metrics map containing some explored facets
**When** selecting the next facet to steer toward
**Then** ALL 30 facets are iterated (not just those with evidence), with unexplored facets defaulting to confidence=0, signalPower=0

**Given** multiple facets have equal priority scores
**When** a tiebreaker is needed
**Then** a static OCEAN-interleaved ordering is used (O[0], C[0], E[0], A[0], N[0], O[1], C[1], ...) ensuring trait coverage spread

**Given** user messages 4-8 (post cold-start)
**When** steering targets are computed
**Then** unexplored facets win (priority=1.15 is max), and OCEAN interleaving ensures one facet per trait before repeating

**Parallelism:** `parallelizable_with: [1.1, 1.2, 1.3, 1.4, 2.3, 4.1]` | `depends_on: []` | `blocks: [2.2]`

### Story 2.2: Micro-Intent Realizer

As a user in conversation with Nerin,
I want the conversation to flow naturally with varied questioning styles,
So that it feels like a genuine dialogue, not an exam.

**Acceptance Criteria:**

**Given** `computeSteeringTarget()` has selected a `targetFacet` and `targetDomain`
**When** `realizeMicroIntent()` is called with `{ targetFacet, targetDomain, previousDomain, domainStreak, turnIndex, nearingEnd, recentIntentTypes }`
**Then** it returns a `MicroIntent` with `intent` (one of: `story_pull`, `tradeoff_probe`, `contradiction_surface`, `domain_shift`, `depth_push`), `domain`, optional `bridgeHint`, optional `questionStyle`

**Given** the last 3 intent types were all `tradeoff_probe`
**When** `realizeMicroIntent()` selects the next intent
**Then** it avoids a 3rd probe in a row (guardrail: max 2 consecutive probes)

**Given** a `MicroIntent` is produced
**When** `buildChatSystemPrompt()` builds Nerin's system prompt
**Then** the steering section uses the structured `MicroIntent` format (intent, domain, bridge, question style) — not raw "Explore {facet} through {domain}"

**Given** an assistant message is saved to `assessment_messages`
**When** the message is persisted
**Then** the `intentType` column is populated with the micro-intent type used

**Parallelism:** `parallelizable_with: [1.2, 1.3, 1.4, 4.1]` | `depends_on: [2.1, 2.3]` | `blocks: []`

### Story 2.3: Domain Streak Computation and ConversAnalyzer Retry Bump

As a user in conversation,
I want Nerin to stay in a topic for a natural arc before switching, and evidence extraction to be more resilient,
So that conversations don't ping-pong between topics and transient failures don't lose evidence.

**Acceptance Criteria:**

**Given** `send-message.use-case.ts` needs `domainStreak` for `realizeMicroIntent()`
**When** computing domain streak
**Then** `computeDomainStreak()` walks backward through assistant messages counting consecutive same-domain turns, returning 0 if no current domain

**Given** `computeDomainStreak()` is a pure function
**When** located in the codebase
**Then** it lives at `packages/domain/src/utils/steering/compute-domain-streak.ts` with unit tests

**Given** ConversAnalyzer fails on first attempt
**When** retry policy is applied in `send-message.use-case.ts`
**Then** it retries twice (3 total attempts), then skips with structured warning log including `sessionId` and `messageId`
**And** the failure is non-fatal — Nerin still responds with stale steering

**Parallelism:** `parallelizable_with: [1.1, 1.2, 1.3, 1.4, 2.1, 4.1]` | `depends_on: []` | `blocks: [2.2]`

---

## Epic 3: Smarter Evidence, Better Scores

Evidence quality improves through structured deviation/strength/confidence signals, producing more reliable personality scores. Assessment costs drop 87% on evidence extraction as a side effect.

### Story 3.1: Evidence v2 Schema and ConversAnalyzer Prompt Update

As a system operator,
I want evidence records to use structured deviation/strength/confidence signals instead of noisy 0-20 scores and float confidence,
So that evidence quality improves and downstream scoring is more reliable.

**Acceptance Criteria:**

**Given** the `conversation_evidence` table
**When** the schema is updated
**Then** columns `score` (integer) and `confidence` (float) are replaced with `deviation` (integer, -3 to +3), `strength` (enum: weak/moderate/strong), `confidence` (enum: low/medium/high), and `note` (text)
**And** the old table is dropped and recreated (D7 — no migration, fresh start)

**Given** ConversAnalyzer's prompt in `conversanalyzer.anthropic.repository.ts`
**When** updated for Evidence v2
**Then** it instructs extraction of `deviation` (-3 to +3), `strength` (weak/moderate/strong), `confidence` (low/medium/high), `note` (brief paraphrase), and `domain`
**And** the prompt says "extract up to 5 records" (advisory, server enforces cap)

**Given** the Effect Schema validation for ConversAnalyzer output
**When** a record has invalid enum values (e.g., "very strong")
**Then** the entire record is dropped (existing pattern — malformed tool_use output discarded)

**Given** `EvidenceInput` type in `packages/domain/src/types/evidence.ts`
**When** updated
**Then** `score: number` and `confidence: number` are replaced in-place with `deviation: number`, `strength: "weak" | "moderate" | "strong"`, `confidence: "low" | "medium" | "high"` — no parallel `EvidenceInputV2` type (Pattern 1)

**Parallelism:** `parallelizable_with: [1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 4.1, 4.2]` | `depends_on: []` | `blocks: [3.2]`

> **Note:** Evidence v2 schema (drop + recreate, D7) and ConversAnalyzer prompt changes are self-contained — no dependency on scoring consolidation (Epic 1) or micro-intent steering (Epic 2). Epic 3 can start in parallel with Epics 1 and 2.

### Story 3.2: Rewrite computeFacetMetrics for Evidence v2

As a system computing personality scores,
I want the scoring formula to natively consume v2 evidence (deviation + enums),
So that scores are computed from higher-quality structured inputs without adapter layers.

**Acceptance Criteria:**

**Given** `computeFacetMetrics()` in `formula.ts`
**When** rewritten for v2
**Then** it accepts `EvidenceInput` with `deviation`, `strength`, `confidence` fields directly
**And** weight maps are co-located inside: `STRENGTH_WEIGHT = { weak: 0.3, moderate: 0.6, strong: 1.0 }`, `CONFIDENCE_WEIGHT = { low: 0.3, medium: 0.6, high: 0.9 }`
**And** `finalWeight = strengthWeight × confidenceWeight` replaces raw confidence in all mass/entropy computations
**And** deviation→score mapping uses `MIDPOINT(10) + D_f × SCALE_FACTOR(10/3)` internally

**Given** `STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`, and `computeFinalWeight()`
**When** needed by annotation API (Decision 12)
**Then** they are exported from `formula.ts` for reuse (Pattern 2)

**Given** `computeDepthSignal()` in `confidence.ts`
**When** updated for v2
**Then** it counts evidence records with `finalWeight ≥ 0.36` (RICH ≥ 8, MODERATE ≥ 4, THIN < 4)

**Given** `score-computation.ts` wrapper
**When** updated
**Then** it passes v2 evidence to `computeFacetMetrics()` — no adapter layer

**Given** existing formula tests (`formula-numerical-hand-computed.test.ts`, `formula-numerical-components.test.ts`, `formula-metrics-steering.test.ts`)
**When** updated
**Then** fixtures use v2 evidence shape and tests pass with new signature

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [3.1]` | `blocks: [3.3]`

### Story 3.3: Rolling Evidence Budget and Cap Enforcement

As a system managing evidence extraction cost,
I want per-message and session-level evidence caps enforced,
So that evidence volume is bounded without losing high-value signals.

**Acceptance Criteria:**

**Given** ConversAnalyzer returns evidence for a message
**When** more than 5 records are returned
**Then** only the top 5 by `finalWeight` are kept (per-message cap, Pattern 6)

**Given** a session with 80+ existing evidence records
**When** a new message is processed in `send-message.use-case.ts`
**Then** ConversAnalyzer is skipped entirely — steering computed from existing evidence

**Given** cap enforcement logic
**When** located in the codebase
**Then** it lives in `send-message.use-case.ts` only — not in the repository layer (Pattern 6)
**And** constants `PER_MESSAGE_EVIDENCE_CAP = 5` and `SESSION_EVIDENCE_CAP = 80` are defined in the use-case

**Given** the conversation_evidence mock in `__mocks__/conversation-evidence.drizzle.repository.ts`
**When** updated
**Then** it stores v2 fields

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [3.1, 3.2]` | `blocks: [3.4]`

### Story 3.4: Rewrite Finalization Pipeline with Staged Idempotency

As a user completing an assessment,
I want results generated reliably with idempotent stages,
So that partial failures don't corrupt my results and retries are safe.

**Acceptance Criteria:**

**Given** `generate-results.use-case.ts`
**When** rewritten
**Then** it reads `conversation_evidence` (not `finalization_evidence`) as the authoritative evidence source
**And** the pipeline is: acquire lock → upsert `assessment_results` → compute scores + portrait → set `stage=scored` (single transaction) → set `stage=completed` + session status (Pattern 3)

**Given** `assessment_results` table
**When** updated
**Then** it has a `stage` enum column (`scored`, `completed`) and a `UNIQUE(assessmentSessionId)` constraint
**And** `updateStage()` method is added to the repository interface and implementation

**Given** idempotency on re-entry
**When** `generate-results` is called for a session already at `stage=scored`
**Then** it skips scoring, proceeds to completion
**When** called for `stage=completed`
**Then** it returns immediately

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [3.1, 3.2, 3.3]` | `blocks: [3.5, 3.6]`

### Story 3.5: Delete FinAnalyzer Infrastructure

As a developer maintaining the codebase,
I want the deprecated FinAnalyzer and all its infrastructure removed,
So that there is a single evidence source (ConversAnalyzer) and no dead code confuses future work.

**Acceptance Criteria:**

**Given** Story 3.4 has migrated `generate-results` away from `finalization_evidence`
**When** the following files are deleted
**Then** the build succeeds and no production code references them:
- `finanalyzer.anthropic.repository.ts` + interface + mock + test mock
- `finalization-evidence.drizzle.repository.ts` + interface + test mock
- `highlight.ts` + tests
- `finalization_evidence` table from schema
- `finanalyzerModelId` from app config, live config, test config, mock config
- `FinanalyzerAnthropicRepositoryLive`, `FinanalyzerMockRepositoryLive`, `FinalizationEvidenceDrizzleRepositoryLive` from `apps/api/src/index.ts`
- All barrel export removals from `domain/src/index.ts`, `domain/src/utils/index.ts`, `infrastructure/src/index.ts`

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [3.4]` | `blocks: [5.1]`

### Story 3.6: Update Portrait Generators to Use Conversation Evidence

As a user viewing my portrait,
I want the portrait generated from the same evidence used for scoring,
So that my portrait narrative and scores are consistent and based on the same data.

**Acceptance Criteria:**

**Given** portrait generation (`generate-full-portrait`, `generate-relationship-analysis`)
**When** fetching evidence for portrait input
**Then** they read from `conversation_evidence` instead of `finalization_evidence`

**Given** teaser portrait repository
**When** updated
**Then** input type changes from `FinalizationEvidenceRecord[]` to conversation evidence records

**Parallelism:** `parallelizable_with: [3.5, 4.1, 4.2]` | `depends_on: [3.4]` | `blocks: []`

---

## Epic 4: Portrait Quality & Recognition

Portrait narratives feel more insightful — recognition from behavioral insight accuracy, not echoed quotes. Depth adapts to evidence quality (rich/moderate/thin).

### Story 4.1: Remove Quote Constraint from Portrait Prompts

As a user reading my personality portrait,
I want the narrative to reveal deep behavioral insight rather than echoing my exact words back,
So that the portrait feels genuinely perceptive — like someone who understands me, not someone who took notes.

**Acceptance Criteria:**

**Given** `TEASER_CONTEXT` in `teaser-portrait.anthropic.repository.ts`
**When** updated
**Then** the constraint "OPENING: Reader must encounter a specific thing they said within first 3 sentences" is removed
**And** the opening focuses on spine arrival and intrigue instead

**Given** `PORTRAIT_CONTEXT` in `portrait-generator.claude.repository.ts`
**When** updated
**Then** the constraint "Recognition objective: Reader must feel HEARD within first 3 sentences" (specific-quote requirement) is removed
**And** recognition comes from spine accuracy — portraits may still reference conversation moments organically but it's not a hard constraint

**Parallelism:** `parallelizable_with: [1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4]` | `depends_on: []` | `blocks: [4.2]`

### Story 4.2: Portrait Telemetry Placeholder

As a product operator,
I want to capture user feedback on portrait quality,
So that I can evaluate whether removing the quote constraint improves or degrades the "felt understood" moment.

**Acceptance Criteria:**

**Given** a user viewing their portrait (teaser or full)
**When** a rating mechanism is available
**Then** the system captures portrait rating (thumbs up/down) alongside `depthSignal` and `evidenceCount` metadata

**Given** this is a placeholder for future quality evaluation
**When** implemented
**Then** a `portrait_ratings` table is created with columns: `id` (uuid), `userId` (ref), `assessmentSessionId` (ref), `portraitType` (enum: teaser/full), `rating` (enum: up/down), `depthSignal` (text: rich/moderate/thin), `evidenceCount` (integer), `createdAt` (timestamp)
**And** a `rate-portrait` use-case accepts rating + metadata and persists to the table
**And** no UI is required yet — the use-case is wired for when the frontend adds the rating UI

**Parallelism:** `parallelizable_with: [1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4]` | `depends_on: [4.1]` | `blocks: []`

---

## Epic 5: Conversation Evidence Review

Users can review their conversation with evidence annotations — see which messages contributed to which facets, understand the basis for their scores, building transparency and trust.

> **Product decision:** Evidence transparency is available to **all users for free** in V1. The UX spec's paid-tier gating for this feature has been superseded.

### Story 5.1: Evidence Annotations API Endpoint

As a user who completed an assessment,
I want my conversation messages returned with evidence annotations attached,
So that I can see which personality signals were detected in each message.

**Acceptance Criteria:**

**Given** a completed assessment with conversation_evidence records
**When** the messages API response is built (get-results or get-messages)
**Then** each user message includes an `annotations[]` array with evidence records joined on `messageId`

**Given** each annotation in the response
**When** serialized
**Then** it contains: `facet`, `domain`, `deviation`, `strength`, `confidence`, `note`, and a derived `finalWeight` (computed at read time via `computeFinalWeight()` — not stored in DB, IC-3)

**Given** `computeFinalWeight()` is used in the handler/mapper
**When** building annotation responses
**Then** it imports from `packages/domain/src/utils/formula.ts` (Pattern 2) — no inline hardcoded weight maps

**Given** assistant messages
**When** annotations are queried
**Then** they return an empty `annotations[]` array (evidence is only extracted from user messages)

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [3.5]` | `blocks: [5.2]`

### Story 5.2: Conversation Review UI with Inline Annotations

As a user reviewing my assessment conversation,
I want to see evidence annotations beside my messages,
So that I can understand which personality signals were detected in each message.

**Acceptance Criteria:**

**Given** a user viewing their conversation history
**When** a user message has annotations
**Then** the top 3 annotations by `finalWeight` are displayed beside the message, with an "expand" option to view all

**Given** the annotation display
**When** rendering to end users
**Then** facet labels and trait names are NOT exposed (preserves "no clinical language" guardrail) — only `note` text is shown, grouped by message
**And** annotations with debug-level detail (facet names, deviation values) are available in an internal/debug mode only

**Given** color-coded indicators
**When** displayed
**Then** positive deviation (+1 to +3) shows green, neutral (0) shows yellow, negative deviation (-1 to -3) shows red, with opacity scaled by `finalWeight`

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [5.1]` | `blocks: [5.3]`

### Story 5.3: Evidence Panel with Bidirectional Navigation

As a user exploring my personality profile,
I want to navigate between my facet scores and the conversation messages that contributed to them,
So that I can trace exactly how my profile was derived and build trust in the results.

**Acceptance Criteria:**

**Given** a user clicks a facet score in their profile
**When** the "Show Evidence" panel opens
**Then** it lists all supporting message annotations for that facet, showing the `note` text and `strength`/`confidence` indicators

**Given** a user clicks "Jump to Message" on an annotation in the evidence panel
**When** navigating
**Then** the conversation scrolls to that message and visually highlights it

**Given** a user clicks a message in conversation history
**When** the side panel opens
**Then** it shows which facets that message contributed to with their deviation and weight

**Parallelism:** `parallelizable_with: [4.1, 4.2]` | `depends_on: [5.2]` | `blocks: []`
