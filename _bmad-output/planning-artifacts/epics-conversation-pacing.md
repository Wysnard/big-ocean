---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
completedAt: '2026-03-12'
inputDocuments:
  - '_bmad-output/planning-artifacts/architecture-conversation-pacing.md'
  - '_bmad-output/planning-artifacts/conversation-pacing-design-decisions.md'
---

# big-ocean - Epic Breakdown: Conversation Pacing Pipeline

## Overview

This document provides the complete epic and story breakdown for the **Conversation Pacing Pipeline** feature of big-ocean, decomposing the architecture requirements from the conversation pacing architecture (13 ADRs) into implementable stories. This work evolves the existing territory-based steering (epics.md, completed 2026-03-05) into a six-layer pipeline with energy/telling extraction, adaptive pacing, unified territory scoring, observation gating, and modular prompt composition.

## Requirements Inventory

### Functional Requirements

FR1: Compute E_target pacing formula — 8-step pipeline (EMA smoothing → momentum → trust qualification → shift → adaptive comfort → drain → ceiling → clamp) producing [0, 1] target energy from user state signals only
FR2: Two-axis state model — extract Energy (5-band → [0, 1]) and Telling (5-band → [0, 1]) from user messages via ConversAnalyzer v2
FR3: Territory catalog — evolve to 25 territories with continuous expectedEnergy [0, 1], exactly 2 domain tags, expectedFacets (3-6 each), and natural openers
FR4: Territory scorer — rank all 25 territories per turn using 5-term additive formula (coverageGain + adjacency + conversationSkew - energyMalus - freshnessPenalty)
FR5: Territory selector — pick territory from scorer's ranked list via 3 deterministic code paths (cold-start-perimeter, argmax, argmax) based on turn position
FR6: Move Governor — derive 3 intents (open/explore/amplify) based on turn number, compute entry pressure (direct/angled/soft), and run observation gating to select ObservationFocus
FR7: ObservationFocus — implement 4 competing variants (Relate, Noticing, Contradiction, Convergence) with strength formulas and mutual exclusion during explore
FR8: Observation gating — evidence-derived phase curve (mean confidence / C_MAX) with shared linear escalation threshold (BASE + STEP × n) for explore turns; raw strength competition for amplify turns
FR9: Prompt Builder — compose Nerin system prompt from 3 tiers (persona/core identity, contextual question modules, per-turn steering) based on Governor's PromptBuilderInput
FR10: Character bible decomposition — decompose CHAT_CONTEXT monolith (~2400 tokens) into modular Tier 1 (always-on) and Tier 2 (intent-contextual) modules
FR11: ConversAnalyzer v2 — single-call dual extraction (userState + evidence) with state extraction first for attention priority; LLM outputs bands, pipeline maps to numbers
FR12: Three-tier extraction retry — strict schema ×3 (temperature 0.9) → lenient schema ×1 (independent parsing) → neutral defaults (energy=0.5, telling=0.5, evidence=[])
FR13: Two repository methods — `analyze` (strict EvidenceExtractionSchema) and `analyzeLenient` (LenientEvidenceExtractionSchema) on ConversAnalyzer repository
FR14: assessment_exchange persistence table — one row per turn storing extraction metrics, pacing state, scorer output, selection, governor output/debug, derived annotations
FR15: Evolve assessment_message — add exchange_id FK, drop territory_id and observed_energy_level columns
FR16: Evolve conversation_evidence — add exchange_id FK alongside existing message_id FK
FR17: Band-to-numeric mapping — deterministic pure functions converting EnergyBand → [0, 1] and TellingBand → [0, 1] in domain layer
FR18: Entry pressure calibration — compute pressure level from gap between E_target and territory expectedEnergy
FR19: Adaptive drain comfort — running mean of all raw energy values (init 0.5) with cap at 0.85; headroom-normalized cost computation
FR20: Per-domain confidence — reuse existing confidence formula scoped to domain evidence weight for contradiction and convergence strength computation
FR21: Pipeline wiring — evolve nerin-pipeline from 8 steps to 15 steps with ConversAnalyzer moved before Nerin (sequential)
FR22: Conversation skew — light territory boost for turns 1-5, heavy territory boost for turns ~18-25, quiet middle
FR23: Session format — 25-exchange cap with amplify closing on final turn (no drain protection, all observation focuses compete on raw strength)
FR24: Portrait readiness — maintain read-only running estimate that never feeds back into E_target or territory scoring
FR25: Cold start defaults — neutral (momentum=0, drain=0, telling=neutral) producing E_target ≈ 0.5

### NonFunctional Requirements

NFR1: All pipeline values operate in [0, 1] space — no intermediate scales, no normalization steps needed between layers
NFR2: Coverage pressure NEVER enters E_target — enforced structurally (coverage flows to territory scorer only)
NFR3: Separation invariants — each layer does exactly one job; scorer ranks, selector picks, Governor constrains, Nerin executes
NFR4: Portrait readiness is read-only — never feeds back into pacing or scoring
NFR5: Fail-open resilience — failure never produces worse experience than silence; failed extraction → comfort-level conversation continues
NFR6: Observation budget — 3-5 non-Relate focuses per session (enforced by shared linear escalation)
NFR7: Token budget reduction — open ~500 (-79%), explore ~1400 (-42%), amplify ~900 (-63%) vs current ~2400 monolith
NFR8: Pure function latency — steps 7-11 (E_target through Prompt Builder) are pure functions with sub-millisecond total overhead
NFR9: Monitoring — log extraction tier per turn; alert if Tier 2/3 fire rates exceed 5%; monitor evidence count, deviation distribution, polarity balance
NFR10: ConversAnalyzer v2 adds ~1-2s Haiku call to critical path before Nerin (accepted latency tradeoff)
NFR11: Priority hierarchy — protect user state > maintain conversational momentum > apply quiet pressure for breadth/depth

### Additional Requirements

- Migration strategy is fresh start — no production users, single migration creates assessment_exchange, adds exchange_id FKs, drops deprecated columns. Existing dev sessions discarded.
- No starter template — this is a feature evolution on an existing codebase (hexagonal architecture, Effect-ts, Drizzle ORM already in place)
- Six load-bearing guardrails must be embedded in ConversAnalyzer v2 prompt to prevent systematic extraction bias
- Scorer formula constants (alpha_up=0.5, alpha_down=0.6, lambda=0.35, K=5, w_e, w_f, cooldown, OBSERVE_BASE=0.12, OBSERVE_STEP=0.04) are simulation-derived defaults requiring future empirical calibration — must be easily configurable
- Domain types (TerritoryId, Territory, EnergyBand, TellingBand, EntryPressure, ConversationalIntent, ObservationFocus, PromptBuilderInput, MoveGovernorDebug, etc.) belong in packages/domain
- Pure functions (E_target, territory scorer, territory selector) belong in packages/domain/src/utils/
- Governor belongs in apps/api/src/use-cases/
- ConversAnalyzer v2 prompt belongs in packages/infrastructure/src/repositories/
- Deployment phases: Phase 0 (catalog + types), Phase 1 (full pipeline — atomic across domain/infrastructure/api), Phase 2 (character bible reform — independent)
- Derive-at-read pattern: observation fire count, smoothed energy, visit history, comfort baseline all reconstructed from prior exchange rows

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | E_target pacing formula |
| FR2 | Epic 2 | Two-axis state model (energy × telling) |
| FR3 | Epic 1 | Territory catalog (25 territories, continuous energy) |
| FR4 | Epic 3 | Territory scorer (5-term formula) |
| FR5 | Epic 3 | Territory selector (3 code paths) |
| FR6 | Epic 4 | Move Governor (3 intents) |
| FR7 | Epic 4 | ObservationFocus (4 variants) |
| FR8 | Epic 4 | Observation gating (phase + escalation) |
| FR9 | Epic 5 | Prompt Builder (3-tier composition) |
| FR10 | Epic 5 | Character bible decomposition |
| FR11 | Epic 2 | ConversAnalyzer v2 (dual extraction) |
| FR12 | Epic 2 | Three-tier extraction retry |
| FR13 | Epic 2 | Two repository methods (analyze/analyzeLenient) |
| FR14 | Epic 1 | assessment_exchange table |
| FR15 | Epic 1 | assessment_message evolution (exchange_id FK) |
| FR16 | Epic 1 | conversation_evidence evolution (exchange_id FK) |
| FR17 | Epic 1 | Band-to-numeric mapping |
| FR18 | Epic 4 | Entry pressure calibration |
| FR19 | Epic 3 | Adaptive drain comfort |
| FR20 | Epic 4 | Per-domain confidence |
| FR21 | Epic 5 | Pipeline wiring (15-step) |
| FR22 | Epic 3 | Conversation skew |
| FR23 | Epic 4 | Session format (25-exchange, amplify closing) |
| FR24 | Epic 4 | Portrait readiness (read-only) |
| FR25 | Epic 3 | Cold start defaults |

## Epic List

### Epic 1: Conversation State Foundation
The system has an evolved territory catalog (25 territories, continuous energy), all pipeline domain types, the assessment_exchange persistence model, and band-to-numeric mapping — the typed, compile-safe foundation everything else builds on.
**FRs covered:** FR3, FR14, FR15, FR16, FR17
**NFRs addressed:** NFR1
**Depends on:** —

### Epic 2: User State Extraction (ConversAnalyzer v2)
The system reads the user's conversational state — energy and telling — alongside existing evidence extraction, with graceful degradation through three-tier retry. The system understands *how* the user is engaging, not just *what* they're saying.
**FRs covered:** FR2, FR11, FR12, FR13
**NFRs addressed:** NFR5, NFR9, NFR10
**Depends on:** Epic 1
**Parallel with:** Epic 3, Epic 4

### Epic 3: Adaptive Pacing & Territory Scoring
Conversations adapt to the user's energy capacity through E_target, and territories are ranked by a unified 5-term formula that balances coverage, adjacency, session arc, energy fit, and freshness. Light users aren't pushed; deep users get relief.
**FRs covered:** FR1, FR4, FR5, FR19, FR22, FR25
**NFRs addressed:** NFR1, NFR2, NFR8, NFR11
**Depends on:** Epic 1
**Parallel with:** Epic 2, Epic 4

### Epic 4: Conversational Intelligence (Governor & Observations)
Nerin offers meaningful observations — noticings, contradictions, convergences — at the right moments, gated by evidence-derived readiness with escalating scarcity. The Governor constrains what the LLM is bad at (frequency, timing) and trusts what it's good at (framing, connection). The final turn is a crescendo where the best observation wins honestly.
**FRs covered:** FR6, FR7, FR8, FR18, FR20, FR23, FR24
**NFRs addressed:** NFR3, NFR4, NFR6
**Depends on:** Epic 1
**Parallel with:** Epic 2, Epic 3

### Epic 5: Prompt Composition & Pipeline Integration
Nerin's system prompt is assembled from modular tiers replacing the monolithic CHAT_CONTEXT. The 15-step pipeline wires all layers end-to-end — the complete evolved conversation experience in production.
**FRs covered:** FR9, FR10, FR21
**NFRs addressed:** NFR3, NFR7, NFR8
**Depends on:** Epics 2, 3, 4
**Note:** Character bible reform (FR10) is independently deployable per ADR architecture

### Dependency Graph

```
Epic 1 (Foundation)
  ├──→ Epic 2 (Extraction)      ──┐
  ├──→ Epic 3 (Pacing & Scoring) ─┼──→ Epic 5 (Prompt Builder & Pipeline Integration)
  └──→ Epic 4 (Governor)         ─┘
```

## Epic 1: Conversation State Foundation

The system has an evolved territory catalog (25 territories, continuous energy), all pipeline domain types, the assessment_exchange persistence model, and band-to-numeric mapping — the typed, compile-safe foundation everything else builds on.

### Story 1.1: Pipeline Domain Types

As a developer,
I want all conversation pacing pipeline types defined in the domain package,
So that every layer of the pipeline has compile-time-safe contracts to build against.

**Acceptance Criteria:**

**Given** the domain package at `packages/domain/src/types/`
**When** pacing pipeline types are created
**Then** the following types are defined and exported:
- `EnergyBand` — `"minimal" | "low" | "steady" | "high" | "very_high"` literal union
- `TellingBand` — `"fully_compliant" | "mostly_compliant" | "mixed" | "mostly_self_propelled" | "strongly_self_propelled"` literal union
- `EntryPressure` — `"direct" | "angled" | "soft"` literal union
- `ConversationalIntent` — `"open" | "explore" | "amplify"` literal union
- `ObservationFocus` — tagged discriminated union with 4 variants: `RelateFocus` (`type: "relate"`), `NoticingFocus` (`type: "noticing"`, `domain: LifeDomain`), `ContradictionFocus` (`type: "contradiction"`, `target: ContradictionTarget`), `ConvergenceFocus` (`type: "convergence"`, `target: ConvergenceTarget`)
- `ContradictionTarget` — `{ facet: FacetName, pair: [DomainScore, DomainScore], strength: number }`
- `ConvergenceTarget` — `{ facet: FacetName, domains: DomainScore[], strength: number }` (3+ domains)
- `DomainScore` — `{ domain: LifeDomain, score: number, confidence: number }`
- `PromptBuilderInput` — discriminated union on `intent`: `open` (territory only), `explore` (territory + entryPressure + observationFocus), `amplify` (territory + `"direct"` + observationFocus)
- `MoveGovernorDebug` — `{ intent, isFinalTurn, entryPressure: EntryPressureDebug, observationGating: ObservationGatingDebug }`
- `ObservationGatingDebug` — `{ mode, phase, threshold, sharedFireCount, candidates: ObservationCandidate[], winner, mutualExclusionApplied }`
- `TerritoryScorerOutput` — `{ ranked: Array<{ territoryId, score, breakdown: { coverageGain, adjacency, skew, malus, freshness } }>, currentTerritory, turnNumber, totalTurns }`
- `TerritorySelectorOutput` — `{ selectedTerritory: TerritoryId, selectionRule, selectionSeed, scorerOutput }`
**And** all types use existing branded types (`TerritoryId`, `FacetName`, `LifeDomain`) from the domain package
**And** all new types are re-exported from the domain package index

**Given** the `PromptBuilderInput` type
**When** a consumer constructs a value with `intent: "open"` and includes `entryPressure`
**Then** TypeScript produces a compile error — `open` intent carries only `territory`

**Given** the `ObservationFocus` type
**When** a consumer pattern-matches on the `type` discriminant
**Then** TypeScript narrows to the correct variant with its specific fields (e.g., `NoticingFocus` narrows to include `domain`)

### Story 1.2: Territory Catalog Evolution & Band Mapping

As a developer,
I want the territory catalog evolved to 25 territories with continuous energy values and band-to-numeric mapping functions,
So that the scorer, Governor, and prompt builder have a complete, honest catalog to operate on.

**Acceptance Criteria:**

**Given** the existing territory catalog at `packages/domain/src/constants/territory-catalog.ts`
**When** the catalog is evolved
**Then** `TERRITORY_CATALOG` contains exactly 25 territories, each with:
- `id: TerritoryId` — branded string (e.g., `"daily-routines"`)
- `expectedEnergy: number` — continuous [0, 1] value (not categorical)
- `domains: readonly [LifeDomain, LifeDomain]` — exactly 2 domains per territory
- `expectedFacets: readonly FacetName[]` — 3-6 valid facet names per territory
- `opener: string` — natural conversation opener
**And** energy distribution follows: 9 light (0.20-0.37), 10 medium (0.38-0.53), 6 heavy (0.58-0.72)
**And** all 30 Big Five facets are covered across the catalog
**And** all domains appear in ≥6 territories

**Given** the `Territory` interface uses `readonly` tuples for domains
**When** TypeScript compiles the catalog
**Then** any territory with fewer or more than 2 domains produces a compile error
**And** any territory referencing an invalid `FacetName` or `LifeDomain` produces a compile error

**Given** band-to-numeric mapping functions at `packages/domain/src/utils/`
**When** `mapEnergyBand("steady")` is called
**Then** it returns `0.5`
**And** the full mapping is: `minimal=0.1, low=0.3, steady=0.5, high=0.7, very_high=0.9`

**Given** band-to-numeric mapping functions
**When** `mapTellingBand("mixed")` is called
**Then** it returns `0.5`
**And** the full mapping is: `fully_compliant=0.0, mostly_compliant=0.25, mixed=0.5, mostly_self_propelled=0.75, strongly_self_propelled=1.0`

**Given** the mapping functions
**When** unit tests run
**Then** all 5 energy bands and all 5 telling bands map to their correct [0, 1] values
**And** the functions are pure with no side effects

### Story 1.3: Exchange Table & Schema Migration

As a developer,
I want an assessment_exchange table and evolved FKs on assessment_message and conversation_evidence,
So that per-turn pipeline state is stored as a single row and all related data references the exchange.

**Acceptance Criteria:**

**Given** the Drizzle schema at `packages/infrastructure/src/db/drizzle/schema.ts`
**When** the `assessmentExchange` table is added
**Then** it contains all columns specified in ADR-CP-14:
- `id` (uuid, PK), `sessionId` (uuid, FK → assessment_session), `turnNumber` (smallint, NOT NULL)
- Extraction: `energy` (real), `energyBand` (text), `telling` (real), `tellingBand` (text), `withinMessageShift` (boolean), `stateNotes` (jsonb), `extractionTier` (smallint)
- Pacing: `smoothedEnergy` (real), `comfort` (real), `drain` (real), `drainCeiling` (real), `eTarget` (real)
- Scoring: `scorerOutput` (jsonb)
- Selection: `selectedTerritory` (text), `selectionRule` (text)
- Governor: `governorOutput` (jsonb), `governorDebug` (jsonb)
- Derived: `sessionPhase` (text), `transitionType` (text)
- `createdAt` (timestamp)

**Given** the `assessmentMessages` table
**When** the migration is applied
**Then** `exchangeId` (uuid, FK → assessment_exchange) is added
**And** `territoryId` and `observedEnergyLevel` columns are dropped
**And** `userId` column is dropped (derivable from session)

**Given** the `conversationEvidence` table
**When** the migration is applied
**Then** `exchangeId` (uuid, FK → assessment_exchange) is added
**And** existing `messageId` FK is kept (provenance)

**Given** this is a fresh-start migration (no production users)
**When** `pnpm db:generate` and `pnpm db:migrate` are run
**Then** the migration creates `assessment_exchange`, adds `exchange_id` FKs, and drops deprecated columns in a single migration file
**And** existing dev/test sessions are discarded (accepted)

**Given** the exchange repository interface
**When** `AssessmentExchangeRepository` is defined at `packages/domain/src/repositories/assessment-exchange.repository.ts`
**Then** it uses `Context.Tag` following existing repository patterns
**And** it exposes methods: `create(sessionId, turnNumber)`, `update(exchangeId, data)`, `findBySession(sessionId)`

**Given** the exchange repository implementation
**When** `AssessmentExchangeDrizzleRepositoryLive` is created at `packages/infrastructure/src/repositories/assessment-exchange.drizzle.repository.ts`
**Then** it implements the repository interface using Drizzle ORM
**And** a `__mocks__/assessment-exchange.drizzle.repository.ts` in-memory mock is provided following the existing mock pattern

## Epic 2: User State Extraction (ConversAnalyzer v2)

The system reads the user's conversational state — energy and telling — alongside existing evidence extraction, with graceful degradation through three-tier retry. The system understands *how* the user is engaging, not just *what* they're saying.

### Story 2.1: ConversAnalyzer v2 Schemas & Repository Methods

As a developer,
I want ConversAnalyzer v2 with dual extraction (userState + evidence), strict and lenient schemas, and two repository methods,
So that the system can extract energy/telling signals alongside evidence in a single LLM call with validation at two strictness levels.

**Acceptance Criteria:**

**Given** the domain package
**When** ConversAnalyzer v2 output schemas are defined using `@effect/schema`
**Then** a strict `ConversanalyzerV2ToolOutput` schema validates:
- `userState: { energyBand: EnergyBand, tellingBand: TellingBand, energyReason: string (max 200 chars), tellingReason: string (max 200 chars), withinMessageShift: boolean }`
- `evidence: Array<EvidenceItem>` — using the existing evidence item schema
**And** all fields must validate for the strict schema to succeed (rejects if ANY item invalid)
**And** `EnergyBand` and `TellingBand` use exact `S.Literal` matches for each band value

**Given** the strict schema
**When** a `LenientConversanalyzerV2ToolOutput` schema is defined
**Then** `userState` fields are parsed independently — valid fields kept, invalid fields default (`energy=0.5/steady`, `telling=0.5/mixed`)
**And** `evidence` items are filtered individually — invalid items discarded, valid items kept
**And** partial success on either side is preserved (e.g., full state + filtered evidence, or default state + full evidence)

**Given** the ConversAnalyzer repository interface at `packages/domain/src/repositories/`
**When** v2 methods are added
**Then** two methods are exposed:
- `analyze(input)` — uses strict `ConversanalyzerV2ToolOutput` schema, returns full validated output or error
- `analyzeLenient(input)` — uses `LenientConversanalyzerV2ToolOutput` schema, returns partial output (invalid items filtered) or error
**And** the existing v1 `analyze` method signature is evolved (not a second interface)

**Given** the ConversAnalyzer infrastructure implementation at `packages/infrastructure/src/repositories/`
**When** the ConversAnalyzer v2 prompt is composed
**Then** state extraction (energy + telling) is positioned FIRST in the prompt for attention priority
**And** evidence extraction is positioned SECOND (battle-tested, tolerates being second)
**And** the prompt includes all six load-bearing guardrails:
1. Eloquence is not energy
2. Sophistication is not cognitive investment
3. Peak dimension, not average (one strongly present dimension sufficient for high energy)
4. Understated styles are not low energy
5. Long detailed answer is not high telling
6. Diagonal contrastive examples are mandatory (high-E/low-T and low-E/high-T)
**And** energy bands include anchored examples for each of the 4 observable dimensions (emotional activation, cognitive investment, expressive investment, activation/urgency)
**And** telling bands include Nerin+user message pairs showing the contrast
**And** temperature is set to 0.9 (retry variation)

**Given** the ConversAnalyzer mock at `__mocks__/conversanalyzer.anthropic.repository.ts`
**When** the mock is updated for v2
**Then** `analyze` returns a default v2 output with `energyBand: "steady"`, `tellingBand: "mixed"`, and deterministic evidence
**And** `analyzeLenient` returns the same default output
**And** both methods can be overridden per-test via `mockResolvedValueOnce()`

**Given** unit tests for the schemas
**When** tests run
**Then** strict schema rejects output with invalid energyBand values, invalid tellingBand values, and malformed evidence items
**And** lenient schema preserves valid userState fields when others fail, filters invalid evidence items while keeping valid ones, and handles complete userState failure with defaults

### Story 2.2: Three-Tier Extraction Pipeline

As a developer,
I want the extraction orchestration to retry with decreasing strictness and fall back to neutral defaults,
So that the conversation never breaks due to extraction failure — it just becomes less steered.

**Acceptance Criteria:**

**Given** the ConversAnalyzer v2 repository methods from Story 2.1
**When** the extraction pipeline is orchestrated using Effect
**Then** it follows the three-tier strategy:
- Tier 1: `analyze(input)` with `Effect.retry(Schedule.recurs(2))` — strict schema × 3 attempts
- Tier 2: `analyzeLenient(input)` via `Effect.orElse` — lenient schema × 1 attempt
- Tier 3: `Effect.catchAll(() => Effect.succeed(NEUTRAL_DEFAULTS))` — no LLM call

**Given** neutral defaults are applied (Tier 3)
**When** the pipeline continues
**Then** `energy = 0.5`, `energyBand = "steady"`, `telling = 0.5`, `tellingBand = "mixed"`, `withinMessageShift = false`, `evidence = []`
**And** E_target computes to ≈ 0.5 (comfort midpoint)
**And** trust = 1.0 (neutral — no momentum modification)
**And** the scorer uses prior coverage gaps (no new evidence this turn)

**Given** extraction succeeds at any tier
**When** the result is processed
**Then** the extraction tier number (1, 2, or 3) is logged for monitoring (NFR9)
**And** the tier is stored on the `assessment_exchange` row as `extractionTier`

**Given** Tier 2 succeeds with partial evidence
**When** some evidence items were filtered by the lenient schema
**Then** the count of discarded items is logged at warn level
**And** the valid evidence items are saved normally

**Given** unit tests for the three-tier pipeline
**When** tests run with mocked ConversAnalyzer methods
**Then** tests verify:
- Happy path: Tier 1 succeeds on first attempt → extractionTier = 1
- Tier 1 retry: fails twice, succeeds on third → extractionTier = 1
- Tier 2 fallback: Tier 1 fails 3 times, Tier 2 succeeds → extractionTier = 2
- Tier 3 fallback: both Tier 1 and Tier 2 fail → neutral defaults returned, extractionTier = 3
- Partial Tier 2: lenient schema returns partial evidence → valid items kept, discarded count logged

## Epic 3: Adaptive Pacing & Territory Scoring

Conversations adapt to the user's energy capacity through E_target, and territories are ranked by a unified 5-term formula that balances coverage, adjacency, session arc, energy fit, and freshness. Light users aren't pushed; deep users get relief.

### Story 3.1: E_target Pacing Formula

As a developer,
I want a pure function that computes E_target from energy/telling history using an 8-step pipeline,
So that the system has an adaptive pacing signal derived solely from user state — no coverage pressure, no phase terms, no monetization logic.

**Acceptance Criteria:**

**Given** a `computeETarget()` pure function at `packages/domain/src/utils/steering/e-target.ts`
**When** called with energy history, telling history, and optional prior state (smoothedEnergy, comfort)
**Then** it computes the 8-step pipeline in order:
1. `E_s` = EMA of energy (smoothed anchor, init 0.5, lambda=0.35)
2. `V_up/V_down` = momentum from smoothed energy (split for asymmetric treatment)
3. `trust` = f(telling) — linear interpolation: T=0.0→0.5, T=0.5→1.0, T=1.0→1.2
4. `E_shifted` = E_s + alpha_up(0.5) × trust × V_up - alpha_down(0.6) × V_down
5. `comfort` = running mean of all raw E values (adaptive baseline, init 0.5)
6. `d` = mean of headroom-normalized excess cost over last K(5) turns, always divide by K
7. `E_cap` = floor(0.25) + (maxcap(0.9) - floor) × (1 - d²)
8. `E_target` = clamp(min(E_shifted, E_cap), 0, 1)
**And** the output is in [0, 1] space with no intermediate scales (NFR1)

**Given** the trust function
**When** telling is unavailable or defaults to 0.5
**Then** trust = 1.0 (neutral — no momentum modification)

**Given** the adaptive comfort computation
**When** comfort is computed from all prior raw energy values
**Then** comfort is capped at 0.85 to prevent division-by-zero in headroom normalization
**And** cost(E) = max(0, E - comfort) / (1 - comfort) — headroom-normalized [0, 1]
**And** drain uses raw E values (not smoothed E_s) because drain measures what the user actually experienced

**Given** cold start (no prior messages)
**When** `computeETarget()` is called with empty history
**Then** momentum = 0, drain = 0, telling = neutral → E_target ≈ 0.5 (comfort midpoint) (FR25)

**Given** the drain ceiling
**When** drain is at maximum (d=1, sustained overload)
**Then** E_cap = 0.25 (floor) — no other force can exceed this ceiling
**And** at d=0 (no fatigue): E_cap = 0.9

**Given** the weight hierarchy
**When** forces conflict
**Then** drain ceiling (structural) > alpha_down (0.6) >= alpha_up (0.5) — coverage is NOT in the formula (NFR2)

**Given** all formula constants (lambda, alpha_up, alpha_down, floor, maxcap, K, comfort_cap)
**When** referenced in the code
**Then** they are defined as named constants in a pacing config object, easily adjustable for future empirical calibration

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/e-target.test.ts`
**When** tests run
**Then** snapshot tests cover:
- Cold start → E_target ≈ 0.5
- Sustained high energy → drain accumulates → E_cap drops → E_target constrained
- High energy + high telling → trust amplifies upward momentum
- High energy + low telling (performance) → trust discounts upward momentum
- Low energy → alpha_down dominates, no trust dampening on downward momentum
- Naturally intense user (high comfort baseline) → less drain than low-baseline user at same energy
- Recovery after drain → comfort adapts, drain decreases, E_cap rises

### Story 3.2: Territory Scorer

As a developer,
I want a pure function that ranks all 25 territories per turn using a 5-term additive formula,
So that territory selection balances coverage needs, narrative flow, session arc, energy fit, and freshness.

**Acceptance Criteria:**

**Given** a `scoreAllTerritories()` pure function at `packages/domain/src/utils/steering/territory-scorer.ts`
**When** called with E_target, coverage gaps (per-facet priority from existing `computeFacetMetrics()`), territory catalog, current territory, visit history, turnNumber, and totalTurns
**Then** it computes for each of the 25 territories:
- `coverageGain(t)` = sqrt(sum(baseYield × priority_f / priority_max)) where baseYield = 1/|expectedFacets| (source-normalized, bounded [0, 1])
- `adjacency(t)` = 0.8 × domainSimilarity(current, t) + 0.2 × facetSimilarity(current, t) using Jaccard similarity
- `conversationSkew(t)` = light boost for early turns (ramp 0→0.2) + heavy boost for late turns (ramp 0.7→1.0) (FR22)
- `energyMalus(t)` = w_e × (expectedEnergy - E_target)²
- `freshnessPenalty(t)` = 0 if current territory, else max(0, w_f × (1 - turnsSinceLastVisit / cooldown)); never-visited = 0
- `score(t)` = coverageGain + adjacency + conversationSkew - energyMalus - freshnessPenalty
**And** output is `TerritoryScorerOutput` with all territories sorted descending by score, each with full 5-term breakdown

**Given** the self-adjacency property
**When** the current territory is scored
**Then** it has Jaccard = 1.0 with itself — providing natural stability without an explicit currentBonus

**Given** cold start (all facets at zero coverage)
**When** territories are scored
**Then** all territories score equally on coverageGain (uniform deficit) regardless of facet count — source normalization ensures this

**Given** coverageGain uses sqrt compression
**When** coverage improves through the session
**Then** coverage pressure has diminishing returns — gentle tide, never spikes

**Given** all scorer constants (w_e, w_f, cooldown, priority alpha/beta, C_target, P_target)
**When** referenced in the code
**Then** they are defined as named constants in a scorer config object, easily adjustable for calibration

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/territory-scorer.test.ts`
**When** tests run
**Then** tests cover:
- Cold start: all territories score equally on coverageGain
- Self-adjacency: current territory gets adjacency = 1.0
- Early session (turn 2): light territories boosted by conversationSkew
- Late session (turn 22): heavy territories boosted by conversationSkew
- Mid session (turn 12): conversationSkew is quiet (no boost)
- Energy malus: territory far from E_target penalized quadratically
- Freshness: recently visited territory penalized, never-visited gets 0 penalty
- Coverage drives shifts: as expected facets get covered, territory's coverageGain declines

### Story 3.3: Territory Selector

As a developer,
I want a pure function that picks a territory from the scorer's ranked list via deterministic rules,
So that territory selection is predictable, debuggable, and varies only by turn position.

**Acceptance Criteria:**

**Given** a `selectTerritory()` pure function at `packages/domain/src/utils/steering/territory-selector.ts`
**When** called with `TerritoryScorerOutput`
**Then** it applies one of three selection rules based on turn position:

**Given** turn 1 (cold start)
**When** selection is requested
**Then** `selectionRule = "cold-start-perimeter"`: take top score, include all territories within `COLD_START_PERIMETER` of top score, random pick from pool using a deterministic seed
**And** `selectionSeed` is set to the hashed seed value (non-null)

**Given** turns 2-24 (steady state)
**When** selection is requested
**Then** `selectionRule = "argmax"`: deterministic top-1 from ranked list
**And** tiebreak: catalog order (lower index wins)
**And** `selectionSeed` is null

**Given** turn 25 (finale)
**When** selection is requested
**Then** `selectionRule = "argmax"`: same as steady-state — closing behavior lives in the Governor (`intent: "amplify"`), not the selector

**Given** the selector output
**When** a territory is selected
**Then** `TerritorySelectorOutput` contains:
- `selectedTerritory: TerritoryId` — the one field the Governor consumes
- `selectionRule` — which code path was used
- `selectionSeed` — non-null only on cold-start
- `scorerOutput` — full ranked list for debug/replay

**Given** derived annotations
**When** the selector completes
**Then** `sessionPhase` is derived: turn 1 → `"opening"`, turn 25 → `"closing"`, else → `"exploring"`
**And** `transitionType` is derived: selectedTerritory === currentTerritory → `"continue"`, else → `"transition"`
**And** these are observability annotations only — not part of the inter-layer contract

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/territory-selector.test.ts`
**When** tests run
**Then** tests cover:
- Turn 1: cold-start-perimeter selects from pool within perimeter of top score
- Turn 1: same seed produces same selection (deterministic)
- Turn 12: argmax selects top-1
- Turn 12: tiebreak uses catalog order
- Turn 25: argmax (same as steady-state)
- Derived annotations: sessionPhase and transitionType computed correctly

## Epic 4: Conversational Intelligence (Governor & Observations)

Nerin offers meaningful observations — noticings, contradictions, convergences — at the right moments, gated by evidence-derived readiness with escalating scarcity. The Governor constrains what the LLM is bad at (frequency, timing) and trusts what it's good at (framing, connection). The final turn is a crescendo where the best observation wins honestly.

### Story 4.1: Observation Focus Strength Formulas & Per-Domain Confidence

As a developer,
I want pure functions that compute strength for each ObservationFocus variant using per-domain confidence,
So that the observation gating system has comparable, evidence-grounded strength signals to compete.

**Acceptance Criteria:**

**Given** a `computePerDomainConfidence()` function at `packages/domain/src/utils/steering/observation-focus.ts`
**When** called with a facet name, a life domain, and per-domain evidence weights from `FacetMetrics.domainWeights`
**Then** it returns `domainConf(f, d) = C_MAX × (1 - exp(-k × w_g(f, d)))` where C_MAX=0.9, k=0.7
**And** it reuses the same formula and constants as the existing facet-level confidence computation — just scoped to a single domain's evidence weight

**Given** the four strength formulas
**When** each is implemented as a pure function
**Then**:
- `computeRelateStrength(energy, telling)` returns `energy × telling` — bounded [0, 1]
- `computeNoticingStrength(smoothedClarity)` returns `smoothedClarity` — EMA-smoothed clarity for top domain, decay=0.5 (`CLARITY_EMA_DECAY`)
- `computeContradictionStrength(facet, domainA, domainB)` returns `delta × min(domainConf_A, domainConf_B)` where delta is the score divergence between two life domains for the same facet
- `computeConvergenceStrength(facet, domains)` returns `(1 - normalizedSpread) × min(domainConf)` across 3+ domains scoring similarly for the same facet

**Given** the contradiction strength formula
**When** a facet has high delta but low per-domain confidence
**Then** strength is low — high divergence with weak evidence doesn't fire

**Given** the convergence strength formula
**When** called with fewer than 3 domains
**Then** strength is 0 — convergence requires 3+ domains by definition

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/observation-focus.test.ts`
**When** tests run
**Then** tests cover:
- Per-domain confidence: matches existing confidence formula when given same weight
- Relate: high energy × high telling → strong; low either axis → weak
- Noticing: smoothed clarity tracks actual clarity with EMA decay
- Contradiction: high delta + high confidence → strong; high delta + low confidence → weak
- Convergence: 3+ domains with similar scores + high confidence → strong; <3 domains → 0
- All strength values bounded [0, 1]

### Story 4.2: Observation Gating & Competition

As a developer,
I want an observation gating system that controls when non-Relate observations fire using evidence-derived phase and escalating thresholds,
So that "seen" moments are rare, earned, and increasingly scarce — spending emotional currency wisely.

**Acceptance Criteria:**

**Given** an `evaluateObservationGating()` function at `packages/domain/src/utils/steering/observation-gating.ts`
**When** called in `explore` mode with all four raw strengths, the current phase, and the shared fire count (n)
**Then** it computes:
- `phase` = mean(confidence_f for f where confidence_f > 0) / C_MAX — evidence-derived, not turn-based
- `effectiveStrength` = rawStrength × phase — for each non-Relate candidate
- `threshold(n)` = OBSERVE_BASE(0.12) + OBSERVE_STEP(0.04) × n — shared across all focus types
- A non-Relate focus fires if effectiveStrength > threshold(n)
**And** mutual exclusion: at most one non-Relate observation per turn, priority: contradiction > convergence > noticing
**And** if nothing clears the threshold → Relate wins by default (no gate needed)

**Given** `evaluate` is called in `amplify` mode (final turn)
**When** thresholds are evaluated
**Then** all four focuses (including Relate) compete on raw strength — no phase gating, no threshold
**And** winner = argmax of all four raw strengths
**And** Relate is a competitor, not a fallback — when energy × telling is strongest, Relate wins honestly

**Given** the shared fire count (n)
**When** n increases through the session
**Then** the threshold escalates linearly: n=0→0.12, n=1→0.16, n=2→0.20, n=3→0.24, n=4→0.28
**And** expected budget is 3-5 non-Relate focuses per session (NFR6)
**And** at n=4, threshold=0.28 requires high phase (≈0.6+) AND strong signal

**Given** the fire count is derived at read time
**When** `n` is needed
**Then** it is reconstructed by counting prior exchanges where `governor_output->'observationFocus'->>'type'` is not `'relate'` — consistent with derive-at-read pattern

**Given** the gating constants (OBSERVE_BASE, OBSERVE_STEP, CLARITY_EMA_DECAY, C_MAX)
**When** referenced in code
**Then** they are defined as named constants, easily adjustable for calibration

**Given** the output
**When** gating completes
**Then** it returns:
- The winning `ObservationFocus` variant (fully constructed with target data for contradiction/convergence, domain for noticing)
- `ObservationGatingDebug` with mode, phase, threshold, sharedFireCount, all four candidates with raw/effective strengths, winner, and mutualExclusionApplied flag

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/observation-gating.test.ts`
**When** tests run
**Then** tests cover:
- Early session (low phase): no non-Relate focus clears threshold → Relate wins
- Mid session (moderate phase + strong signal): noticing clears threshold → fires
- Mutual exclusion: contradiction and noticing both clear → contradiction wins (higher priority)
- Escalation: after 3 fires, threshold is high enough that moderate signals no longer clear
- Amplify mode: all compete on raw strength, Relate can win when energy×telling is strongest
- Amplify mode: simmering contradiction that never cleared explore threshold now wins

### Story 4.3: Move Governor

As a developer,
I want a Governor that derives intent, computes entry pressure, and wires observation gating to produce PromptBuilderInput,
So that Nerin receives exactly the behavioral constraints it needs without knowing about scoring, pacing, or coverage.

**Acceptance Criteria:**

**Given** a `computeGovernorOutput()` function at `apps/api/src/use-cases/` (or `packages/domain/src/utils/steering/move-governor.ts`)
**When** called with selectedTerritory, E_target, turnNumber, isFinalTurn, per-domain facet scores, and session observation history
**Then** it produces `PromptBuilderInput` and `MoveGovernorDebug`

**Given** intent derivation
**When** turnNumber === 1
**Then** intent = `"open"` — PromptBuilderInput carries territory only (no entryPressure, no observationFocus)

**Given** intent derivation
**When** isFinalTurn === true
**Then** intent = `"amplify"` — entryPressure is always `"direct"`, observationFocus from raw strength competition (amplify mode gating)
**And** no drain protection on amplify — the 24 turns of pacing earned the crescendo (FR23)

**Given** intent derivation
**When** turnNumber > 1 and not final turn
**Then** intent = `"explore"` — full entryPressure + observationFocus from gated competition

**Given** entry pressure calibration (FR18)
**When** the gap between E_target and territory expectedEnergy is computed
**Then**:
- `"direct"` — gap is small (territory energy within comfortable range of E_target)
- `"angled"` — moderate gap (territory is somewhat beyond E_target)
- `"soft"` — large gap (territory significantly exceeds E_target)
**And** always `"direct"` on `open` and `amplify` intents

**Given** portrait readiness (FR24)
**When** the Governor runs
**Then** portrait readiness is NOT consulted for any decision — it is read-only and never feeds back into pacing or scoring (NFR4)

**Given** the Governor output
**When** persisted to `assessment_exchange.governor_output` (jsonb)
**Then** territories are stored as `TerritoryId` (not full objects) — pipeline resolves from catalog when reading back (derive-at-read)

**Given** unit tests
**When** tests run
**Then** tests cover:
- Turn 1: intent=open, no entryPressure, no observationFocus
- Turn 12: intent=explore, entryPressure computed from gap, observationFocus from gating
- Turn 25 (final): intent=amplify, entryPressure=direct, observationFocus from raw competition
- Entry pressure: small gap→direct, moderate→angled, large→soft
- MoveGovernorDebug contains full diagnostics (intent, isFinalTurn, entryPressure debug, observation gating debug)
- Governor does NOT read portrait readiness

## Epic 5: Prompt Composition & Pipeline Integration

Nerin's system prompt is assembled from modular tiers replacing the monolithic CHAT_CONTEXT. The 15-step pipeline wires all layers end-to-end — the complete evolved conversation experience in production.

### Story 5.1: Character Bible Decomposition

As a developer,
I want the CHAT_CONTEXT monolith decomposed into modular, independently loadable constant modules,
So that each conversational intent loads only the cognitive palette it needs — reducing token cost and preventing behavioral leakage between intents.

**Acceptance Criteria:**

**Given** the existing `CHAT_CONTEXT` at `packages/domain/src/constants/nerin-chat-context.ts`
**When** decomposed into modular constants at `packages/domain/src/constants/nerin/`
**Then** Tier 1 (always-on, core identity) modules are created:
- `CONVERSATION_MODE` — conversational frame and purpose
- `BELIEFS_IN_ACTION` — core beliefs that shape behavior
- `CONVERSATION_INSTINCTS` — rewritten to remove directives, keep instincts only ("you never make someone feel insufficient")
- `QUALITY_INSTINCT` — what quality looks like in Nerin's responses
- `MIRROR_GUARDRAILS` — constraints on mirror usage
- `HUMOR_GUARDRAILS` — constraints on humor
- `INTERNAL_TRACKING` — what Nerin tracks internally

**Given** Tier 1 modules are created
**When** Tier 2 (intent-contextual) modules are created
**Then**:
- `STORY_PULLING` — primary question type for pulling concrete narratives
- `REFLECT` — reflection question module
- `THREADING` — connecting threads across the conversation
- `OBSERVATION_QUALITY` — what makes a good observation (amplify only)
- `MIRRORS_EXPLORE` — 13 mirrors for explore intent (folds DEEPEN 10 + BRIDGE 3 unique: Coral Reef, Volcanic Vents, Mola Mola)
- `MIRRORS_AMPLIFY` — 4 mirrors for amplify intent (Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola)

**Given** the decomposition is complete
**When** all Tier 1 + Tier 2 modules are concatenated
**Then** no content from the original CHAT_CONTEXT is lost — only reorganized
**And** eliminated sections are confirmed removed: QUESTIONING_STYLE (folded into intent instructions), RESPONSE_FORMAT (decomposed), RESPONSE_PALETTE, separate MIRRORS_BRIDGE and MIRRORS_HOLD (folded into MIRRORS_EXPLORE)

**Given** the token budget targets
**When** modules are measured
**Then** open intent (Tier 1 + Reflect only) ≈ 500 tokens (-79% vs ~2400 monolith)
**And** explore intent (Tier 1 + full question palette) ≈ 1400 tokens (-42%)
**And** amplify intent (Tier 1 + amplify-specific) ≈ 900 tokens (-63%)

**Given** this story is independently deployable
**When** shipped without the Prompt Builder or pipeline changes
**Then** the existing system continues to work with the original CHAT_CONTEXT — modules are additive, not a replacement, until Story 5.2 switches to them

### Story 5.2: Prompt Builder

As a developer,
I want a deterministic prompt compositor that assembles Nerin's system prompt from modular tiers based on the Governor's PromptBuilderInput,
So that each conversational intent gets exactly the cognitive palette it needs — no more, no less.

**Acceptance Criteria:**

**Given** a `buildPrompt()` function at `packages/domain/src/utils/steering/prompt-builder.ts`
**When** called with `PromptBuilderInput` and the territory catalog
**Then** it composes the system prompt in 4 tiers:
1. `NERIN_PERSONA` — universal identity (shared across all surfaces)
2. Core identity modules (Tier 1 — always included)
3. Question modules (Tier 2 — included/excluded per intent)
4. Steering section (per-turn — territory + observation focus translated to instruction)

**Given** intent = `"open"`
**When** the prompt is composed
**Then** Tier 2 includes: `REFLECT` only (light opener)
**And** steering section includes: territory opener as suggested direction
**And** no observation focus instruction (nothing to observe yet)
**And** Story-Pulling, Threading, Mirrors are NOT loaded

**Given** intent = `"explore"`
**When** the prompt is composed
**Then** Tier 2 includes: `STORY_PULLING`, `REFLECT`, `THREADING`, `MIRRORS_EXPLORE`
**And** steering section includes: territory context + observation focus translated to natural instruction
**And** observation focus translation:
- Relate → "Connect naturally to what they just shared"
- Noticing → "Something is shifting in [domain]" (domain compass, not facet target)
- Contradiction → "Something interesting — [facet] shows up differently in [domainA] vs [domainB]" (framed as fascination, never verdict)
- Convergence → "A pattern is emerging — [facet] shows up consistently across [domains]"
**And** entry pressure modifies the territory instruction: direct = use opener, angled = approach from adjacent angle, soft = gentle mention

**Given** intent = `"amplify"`
**When** the prompt is composed
**Then** Tier 2 includes: `OBSERVATION_QUALITY`, `MIRRORS_AMPLIFY`
**And** steering section includes: bold format permission, longer responses, declarative statements about the user
**And** entry pressure is always `"direct"`
**And** Story-Pulling, Threading are NOT loaded — the absence of modules IS the instruction

**Given** the prompt builder
**When** it receives an ObservationFocus with type `"contradiction"`
**Then** the contradiction is NEVER framed as verdict — always as fascination
**And** example good: "Something interesting is happening — earlier you described X, and here it feels almost opposite"
**And** example bad: "So you're actually contradictory about closeness"

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`
**When** tests run
**Then** tests cover:
- Open intent: only Reflect loaded, no observation instruction
- Explore intent: full question palette loaded, observation focus translated correctly for each variant
- Amplify intent: amplify-specific modules loaded, bold format permission included
- Entry pressure: direct/angled/soft modify territory instruction appropriately
- Token budget: composed prompts are within target ranges
- Contradiction framing: fascination language, not verdict language

### Story 5.3: Pipeline Integration

As a developer,
I want the nerin-pipeline evolved to the 15-step orchestration wiring all pacing layers end-to-end,
So that the complete conversation pacing pipeline runs in production — from user message to steered Nerin response.

**Acceptance Criteria:**

**Given** the existing `nerin-pipeline.ts` at `apps/api/src/use-cases/`
**When** evolved to the 15-step pipeline
**Then** it executes in order:
1. Advisory lock
2. Rate limit check
3. Create exchange row (`session_id`, `turn_number`)
4. Save user message (with `exchange_id`)
5. ConversAnalyzer v2 — extract evidence + energy + telling (three-tier retry from Story 2.2)
6. Save evidence (with `exchange_id` + `message_id`)
7. Compute E_target (from energy/telling history via Story 3.1)
8. Territory Scorer — rank all 25 territories (Story 3.2)
9. Territory Selector — pick from ranked list (Story 3.3)
10. Move Governor — intent + observation gating → PromptBuilderInput (Story 4.3)
11. Prompt Builder — compose 3-tier system prompt (Story 5.2)
12. Call Nerin (with composed system prompt)
13. Save assistant message (with `exchange_id`)
14. Update exchange row (all metrics: extraction, pacing, scoring, governor)
15. Release lock, return response

**Given** the ordering constraint
**When** the pipeline runs
**Then** steps 5-11 are sequential (each feeds the next)
**And** steps 5 and 12 are the two LLM calls (Haiku and Sonnet respectively)
**And** steps 7-11 are pure functions — sub-millisecond total (NFR8)

**Given** ConversAnalyzer now runs BEFORE Nerin
**When** compared to the previous pipeline (ConversAnalyzer parallel/after Nerin)
**Then** ConversAnalyzer's latency (~1-2s Haiku call) is added to the critical path before Nerin responds (NFR10 — accepted tradeoff)
**And** the steering pipeline (steps 7-11) has real user state signals to work with

**Given** step 14 (update exchange row)
**When** the exchange is updated
**Then** all pipeline metrics are stored: extraction tier, energy, telling, bands, state notes, smoothed energy, comfort, drain, drain ceiling, E_target, scorer output (jsonb), selected territory, selection rule, governor output (jsonb), governor debug (jsonb), session phase, transition type

**Given** the old steering path (DRS + facet-targeted steering)
**When** the new pipeline is wired
**Then** the old steering code is removed entirely — clean cut, no feature flag, no backward compatibility shim

**Given** the derive-at-read pattern
**When** the pipeline needs session state
**Then** observation fire count (n) is reconstructed from prior exchanges' `governor_output->'observationFocus'->>'type'`
**And** smoothed energy is read from the most recent exchange
**And** visit history is read from prior exchanges' `selected_territory`
**And** comfort baseline is read from the most recent exchange (or recomputed from all prior exchange `energy` values)

**Given** integration tests at `apps/api/src/__tests__/nerin-pipeline.test.ts`
**When** tests run using `vi.mock()` + `__mocks__` pattern
**Then** tests verify:
- Full 15-step flow executes end-to-end
- Exchange row created with correct turn number
- ConversAnalyzer v2 called before Nerin (step 5 before step 12)
- E_target computed from extraction results
- Territory scored, selected, and Governor produces PromptBuilderInput
- Prompt Builder composes system prompt from Governor output
- Nerin called with composed prompt
- Exchange row updated with all pipeline metrics
- Existing evidence extraction and storage unchanged
- Three-tier retry degrades gracefully (Tier 3 → comfort-level conversation)
- Turn 1: cold-start selection + open intent
- Final turn: amplify intent + raw observation competition
