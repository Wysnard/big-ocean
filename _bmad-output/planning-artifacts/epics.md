---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-03-05'
inputDocuments:
  - '_bmad-output/planning-artifacts/architecture-conversation-experience-evolution.md'
  - '_bmad-output/design-thinking-2026-03-04.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# big-ocean - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the **Conversation Experience Evolution** feature of big-ocean, decomposing the requirements from the standalone architecture (Design Thinking 2026-03-04) into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System shall provide a 22-territory catalog with pre-mapped expected facets per territory (3-6 facets each), each territory having an ID, energy level, domains, expected facets, and opener
FR2: System shall compute territory scores using the formula: territory_score = coverage_value x energy_fit x freshness_bonus
FR3: System shall compute a Depth Readiness Score (DRS) as the single metric driving energy pacing and depth eligibility: DRS = (0.55 x Breadth + 0.45 x Engagement) x EnergyMultiplier
FR4: System shall implement circular exploration where freshness bonus causes natural territory revisits at different energy levels
FR5: System shall deprioritize territories whose expected facets are already well-covered (redundancy-triggered shifts)
FR6: System shall provide cold-start territory selection for the first 3 messages using curated light-energy territories (territory subset, not separate system)
FR7: System shall remove strategic/pacing instructions (depth progression rules, late-conversation depth) from Nerin character bible
FR8: System shall move contradiction-surfacing from Nerin character bible to portrait generator prompt as a single unconditional instruction
FR9: System shall replace "observation + question" default with "relate > reflect" as Nerin's primary interaction pattern (with min 5 relate patterns)
FR10: System shall make story-pulling the primary question type (70%+) with minimum 5 story-pulling patterns beyond territory openers
FR11: System shall repurpose ocean mirrors as territory bridges for natural topic transitions
FR12: Steering shall output territoryId only; prompt builder looks up the catalog for opener, domains, energy level
FR13: Nerin shall receive territory guidance (topic area + energy level) instead of facet targeting
FR14: ConversAnalyzer shall classify observed energy level (light/medium/heavy) of user responses as one extra output field in the existing Haiku call
FR15: System shall store territory_id and observed_energy_level on assessment_messages for each exchange
FR16: Pipeline shall follow new 8-step orchestration: computeDRS -> scoreAllTerritories -> selectTerritory -> buildNerinPrompt -> callNerin -> callConversAnalyzer -> saveEvidence -> saveExchangeMetadata
FR17: Portrait generator shall receive contradiction-surfacing instruction (migrated from character bible)
FR18: System shall enforce maximum territory visits per conversation (configurable, default: 2)

### NonFunctional Requirements

NFR1: Backward compatibility - existing evidence model unchanged, new fields additive only
NFR2: Cost neutrality - same ~$0.20 per assessment budget, no additional LLM calls
NFR3: Latency - same <2s P95 Nerin response; territory scoring + DRS are pure functions adding no latency
NFR4: Testability - all scoring deterministic, pure functions, snapshot-testable
NFR5: Observability - DRS + territory-facet yield tracking; log DRS, territory selected, actual evidence per exchange
NFR6: Phased rollout - steering and character reform independently deployable

### Additional Requirements

- All configurable values (thresholds, weights, caps) via AppConfig - no magic numbers in scoring code
- Wrapper pattern: territory scorer wraps existing computeFacetMetrics(), does not replace it
- Phase 1 is atomic across domain + infrastructure + api packages (cannot partially deploy)
- Phase 2 (character bible reform) is fully independent of Phase 1 (zero data flow coupling)
- Freshness bonus capped at 1.2 (not 1.5) per failure mode analysis - coverage must be primary driver
- Relate patterns must use AI-truthful framing ("In conversations I've had..." not "I've seen people who...")
- ConversAnalyzer must NOT receive expected facets in Phase 1 (prevents extraction bias)
- Clean cut for steering migration - no backward compatibility or feature flag between old and new steering
- territory_id stored as snapshot string (not FK) - survives catalog evolution
- observed_energy_level is LLM output (not derivable) - must be stored
- Schema migration: two nullable columns added to assessment_messages (no data migration needed)
- ConversAnalyzer mock must gain observedEnergyLevel in return value
- "It's okay to not know" normalization added to character bible
- Nerin receives opener + domains + energy level only (NOT expected facets, DRS, or coverage data)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | 22-territory catalog with facet mappings |
| FR2 | Epic 1 | Territory scoring formula |
| FR3 | Epic 1 | Depth Readiness Score (DRS) |
| FR4 | Epic 1 | Circular exploration via freshness |
| FR5 | Epic 1 | Redundancy-triggered territory shifts |
| FR6 | Epic 1 | Cold-start territory selection |
| FR7 | Epic 2 | Remove pacing instructions from character |
| FR8 | Epic 2 | Move contradiction-surfacing to portrait |
| FR9 | Epic 2 | Relate > reflect as primary pattern |
| FR10 | Epic 2 | Story-pulling as primary question type |
| FR11 | Epic 2 | Ocean mirrors as territory bridges |
| FR12 | Epic 1 | Steering outputs territoryId only |
| FR13 | Epic 1 | Nerin receives territory guidance |
| FR14 | Epic 1 | ConversAnalyzer energy classification |
| FR15 | Epic 1 | Store territory_id + energy on messages |
| FR16 | Epic 1 | 8-step pipeline orchestration |
| FR17 | Epic 2 | Portrait generator contradiction-surfacing |
| FR18 | Epic 1 | Max territory visits cap |

## Epic List

### Epic 1: Territory-Based Conversation Steering
Conversations naturally explore diverse life territories with energy-aware pacing, replacing facet-targeted steering with organic flow that adapts to the user's emotional readiness.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR12, FR13, FR14, FR15, FR16, FR18
**NFRs addressed:** NFR1, NFR2, NFR3, NFR4, NFR5, NFR6

### Epic 2: Nerin Character Evolution
Nerin communicates through relating and story-pulling rather than clinical observation-and-question patterns — conversations feel more natural, safe, and engaging.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR17

## Epic 1: Territory-Based Conversation Steering

Conversations naturally explore diverse life territories with energy-aware pacing, replacing facet-targeted steering with organic flow that adapts to the user's emotional readiness.

### Story 1.1: Territory Domain Types & Catalog

As a developer,
I want a typed territory catalog with branded IDs, energy levels, domain mappings, expected facets, and openers,
So that the territory system has a compile-time-safe foundation for all scoring and prompt logic.

**Acceptance Criteria:**

**Given** the domain package exists
**When** territory types are created at `packages/domain/src/types/territory.ts`
**Then** `TerritoryId` is a branded string type, `EnergyLevel` is `"light" | "medium" | "heavy"`, and `Territory` interface has fields: `id`, `energyLevel`, `domains` (readonly `LifeDomain[]`), `expectedFacets` (readonly `FacetName[]`), `opener` (string)

**Given** the territory types exist
**When** `SteeringOutput` is created at `packages/domain/src/types/steering.ts`
**Then** `SteeringOutput` contains only `{ readonly territoryId: TerritoryId }` — no other fields

**Given** the territory and steering types exist
**When** the territory catalog is created at `packages/domain/src/constants/territory-catalog.ts`
**Then** `TERRITORY_CATALOG` contains exactly 22 territories, each with 3-6 expected facets referencing valid `FacetName` values, 1-3 `LifeDomain` values, one of three energy levels, and a conversation opener string
**And** `COLD_START_TERRITORIES` is exported as an array of 3 `TerritoryId` values referencing light-energy territories suitable as conversation openers

**Given** the catalog is defined
**When** TypeScript compiles the project
**Then** any territory referencing an invalid `FacetName` or `LifeDomain` produces a compile error
**And** all new types and constants are re-exported from the domain package index

### Story 1.2: Depth Readiness Score (DRS)

As a developer,
I want a pure function that computes the Depth Readiness Score from facet coverage, engagement signals, and observed energy history,
So that the system has a single metric driving conversation energy pacing.

**Acceptance Criteria:**

**Given** a set of covered facet count, last 3 message word counts, last 3 evidence-per-message counts, and last 3 observed energy levels
**When** `computeDRS()` is called at `packages/domain/src/utils/steering/drs.ts`
**Then** it returns a DRS value between 0 and 1 computed as `(0.55 * Breadth + 0.45 * Engagement) * EnergyMultiplier`
**And** Breadth = `clamp((coveredFacets - 10) / 15, 0, 1)`
**And** Engagement word component = `clamp(avgWordCountLast3 / 120, 0, 1)`, evidence component = `clamp(avgEvidencePerMsgLast3 / 6, 0, 1)`, combined as `clamp(0.55 * word + 0.45 * evid, 0, 1)`
**And** EnergyMultiplier uses recency weights `[1.0, 0.6, 0.3]` with energy weights `{ light: 0, medium: 1, heavy: 2 }`, computed as `clamp(1 - energyPressure, 0, 1)`

**Given** a DRS value and a territory energy level
**When** `computeEnergyFit()` is called
**Then** it returns the energy_fit value using asymmetric curves: `lightFit = clamp((0.55 - DRS) / 0.35, 0, 1)`, `mediumFit = 1 - clamp(abs(DRS - 0.55) / 0.35, 0, 1)`, `heavyFit = clamp((DRS - 0.65) / 0.25, 0, 1)`

**Given** all DRS formula parameters (breadth weight, engagement thresholds, recency weights, energy_fit curve parameters)
**When** these values are referenced in the code
**Then** they are sourced from AppConfig, not hardcoded as magic numbers

**Given** the DRS functions exist
**When** unit tests run at `packages/domain/src/utils/steering/__tests__/drs.test.ts`
**Then** snapshot tests cover: early conversation (DRS ~0.1-0.3 favors light), mid conversation (DRS ~0.4-0.6 favors medium), late conversation (DRS ~0.7+ favors heavy), recovery after heavy (energy pressure drops DRS), and edge cases (no messages yet, all heavy history)

### Story 1.3: Territory Scoring & Selection

As a developer,
I want pure functions that score all territories and select the best one based on coverage needs, energy fit, and freshness,
So that the system steers conversations toward under-explored territories at appropriate energy levels.

**Acceptance Criteria:**

**Given** a territory's expected facets and the current facet metrics from `computeFacetMetrics()`
**When** `computeCoverageValue()` is called
**Then** it returns the proportion of expected facets that are "thin" (below `MIN_EVIDENCE_THRESHOLD`, configurable via AppConfig, default: 3)
**And** it uses the existing `computeFacetMetrics()` output as input (wrapper pattern, not replacement)

**Given** a territory and the exchange history
**When** `computeFreshnessBonus()` is called
**Then** it returns `clamp(1.0 + (exchangesSinceLastVisit * 0.05), 0.8, 1.2)` — capped at 1.2, neutral at 1.0 for just-visited, and 1.2 for never-visited territories

**Given** coverage_value, energy_fit, and freshness_bonus for a territory
**When** `scoreTerritory()` is called
**Then** it returns `coverage_value * energy_fit * freshness_bonus`

**Given** the full territory catalog, facet metrics, DRS, and visit history
**When** `scoreAllTerritories()` is called
**Then** it returns all territories ranked by score
**And** any territory with `visitCount >= MAX_TERRITORY_VISITS` (configurable via AppConfig, default: 2) receives a score of 0

**Given** ranked territories
**When** `selectTerritory()` is called
**Then** it returns the `SteeringOutput { territoryId }` for the highest-scoring territory
**And** territories at visit cap are excluded

**Given** the scoring functions exist
**When** unit tests run at `packages/domain/src/utils/steering/__tests__/territory-scorer.test.ts`
**Then** tests cover: high-coverage territories deprioritized (FR5), freshness causes revisits (FR4), visit cap enforcement (FR18), and all-territories-capped edge case

### Story 1.4: Cold-Start Territory Selection

As a developer,
I want a cold-start function that selects from curated light-energy territories for the first 3 messages,
So that new conversations begin with approachable, low-stakes topics before the scoring formula takes over.

**Acceptance Criteria:**

**Given** a conversation with fewer than 3 user messages
**When** territory selection is requested
**Then** the cold-start function selects from `COLD_START_TERRITORIES` using round-robin via seed index (same pattern as current cold-start implementation)
**And** the return type is `SteeringOutput { territoryId }` — identical to the scoring path

**Given** a conversation with 3 or more user messages
**When** territory selection is requested
**Then** the cold-start function is NOT used and the territory scoring formula from Story 1.3 takes over

**Given** the cold-start function exists
**When** unit tests run
**Then** tests verify: first 3 messages use COLD_START_TERRITORIES in round-robin order, message 4+ delegates to scoring, and the output shape matches SteeringOutput

### Story 1.5: Territory Prompt Builder & Nerin System Prompt

As a developer,
I want a prompt builder that looks up the territory catalog and formats guidance for Nerin,
So that Nerin receives topic-level direction without being exposed to scoring internals or facet targets.

**Acceptance Criteria:**

**Given** a `SteeringOutput { territoryId }` and the territory catalog
**When** `buildNerinPrompt()` is called at `packages/domain/src/utils/steering/territory-prompt-builder.ts`
**Then** it looks up the territory by ID and returns formatted prompt content including: territory opener, territory domains, and territory energy level
**And** it does NOT include: expected facets, DRS value, or coverage data

**Given** the prompt builder output
**When** `nerin-system-prompt.ts` is modified to use territory context
**Then** the facet-targeting section is replaced with territory guidance (topic area + energy level)
**And** Nerin's system prompt references the territory opener as a suggested direction, not a mandatory question

**Given** an invalid or missing territoryId
**When** `buildNerinPrompt()` is called
**Then** it fails with a descriptive domain error (not a silent fallback)

**Given** the prompt builder and system prompt changes exist
**When** unit tests run
**Then** tests verify: correct catalog lookup, prompt contains opener/domains/energy but not facets/DRS/coverage, and invalid ID error handling

### Story 1.6: Schema Migration & ConversAnalyzer Energy Classification

As a developer,
I want two new columns on assessment_messages and ConversAnalyzer energy classification output,
So that each exchange records which territory was explored and the user's observed emotional energy.

**Acceptance Criteria:**

**Given** the existing `assessment_messages` table
**When** the Drizzle migration is applied
**Then** two nullable VARCHAR columns are added: `territory_id` and `observed_energy_level`
**And** existing rows are unaffected (no data migration needed)
**And** `territory_id` is a snapshot string (not a foreign key) — survives catalog evolution

**Given** the Drizzle schema at `packages/infrastructure/src/db/drizzle/schema.ts`
**When** the schema is updated
**Then** `assessmentMessages` table definition includes `territoryId` and `observedEnergyLevel` as nullable string columns

**Given** a user message and Nerin response sent to ConversAnalyzer
**When** the ConversAnalyzer analyzes the exchange
**Then** its output includes `observedEnergyLevel: "light" | "medium" | "heavy"` alongside the existing `evidence` array
**And** the energy classification prompt follows the guidance in ADR-CEE-5 (emotional weight, not message length)
**And** no additional LLM call is made — energy classification happens in the existing Haiku call (NFR2)

**Given** ConversAnalyzer does NOT receive expected facets in its prompt
**When** evidence is extracted
**Then** extraction remains unbiased by territory expectations (anti-pattern enforcement)

**Given** the ConversAnalyzer mock at `__mocks__/conversanalyzer.anthropic.repository.ts`
**When** the mock is updated
**Then** it returns `observedEnergyLevel: "medium"` as default
**And** tests can override via `mockResolvedValueOnce()` for specific energy scenarios

### Story 1.7: Pipeline Orchestration Integration

As a developer,
I want the nerin-pipeline to use the new 8-step territory-based orchestration,
So that all steering, prompt, analysis, and storage components work together end-to-end.

**Acceptance Criteria:**

**Given** a user sends a message during an assessment
**When** `nerin-pipeline.ts` processes the exchange
**Then** it executes the 8-step orchestration in order:
1. `computeDRS()` from facet coverage, last 3 word counts, last 3 evidence counts, last 3 observed energies
2. `scoreAllTerritories()` using catalog, facet metrics, DRS, visit history
3. `selectTerritory()` from ranked territories (or cold-start for first 3 messages)
4. `buildNerinPrompt()` looking up territory from catalog
5. `callNerin()` with territory-contextualized prompt
6. `callConversAnalyzer()` returning evidence + observedEnergyLevel
7. `saveEvidence()` (existing, unchanged)
8. `saveExchangeMetadata()` storing territory_id and observed_energy_level on the assessment_messages row

**Given** the pipeline executes step 8
**When** metadata is saved
**Then** the current exchange's `assessment_messages` row has `territory_id` set to the selected territory and `observed_energy_level` set to the ConversAnalyzer classification

**Given** this is a clean cut migration (no feature flag)
**When** the old facet-targeted steering code is replaced
**Then** the old steering path is removed entirely — no backward compatibility shim or toggle

**Given** the pipeline is wired up
**When** DRS, territory selected, and actual evidence per exchange are computed
**Then** they are logged for observability (NFR5)

**Given** the pipeline integration tests at `apps/api/src/__tests__/nerin-pipeline.test.ts`
**When** tests run using the `vi.mock()` + `__mocks__` pattern
**Then** tests verify: full 8-step flow executes, cold-start for early messages, scoring for later messages, territory_id and observed_energy_level are stored, and existing evidence extraction is unchanged (NFR1)

## Epic 2: Nerin Character Evolution

Nerin communicates through relating and story-pulling rather than clinical observation-and-question patterns — conversations feel more natural, safe, and engaging. Independent of Epic 1 — zero data flow coupling.

### Story 2.1: Remove Steering Instructions from Character Bible

As a developer,
I want strategic and pacing instructions removed from Nerin's character bible,
So that character defines personality only, while steering strategy is handled by the DRS and territory system.

**Acceptance Criteria:**

**Given** the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`
**When** the character bible is updated
**Then** depth progression rules (messages 14-18 pacing) are removed entirely
**And** the "late-conversation depth" section is removed entirely
**And** the "People are more ready for truth than they think" framing is replaced with "People discover more when they feel safe to explore"

**Given** the character bible after modifications
**When** reviewed for remaining content
**Then** no strategic/pacing instructions remain — only personality traits, communication style, and interaction patterns
**And** the character = personality, steering = strategy separation is clean (FR7)

**Given** contradiction-surfacing instructions exist in the character bible
**When** this story is completed
**Then** contradiction-surfacing is NOT yet removed (deferred to Story 2.3) — only pacing/depth rules are removed in this story

### Story 2.2: Relate > Reflect & Story-Pulling Patterns

As a developer,
I want Nerin's character bible updated with relate > reflect patterns, story-pulling as the primary question type, and territory bridge transitions,
So that conversations feel like natural exchanges rather than clinical assessments.

**Acceptance Criteria:**

**Given** the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`
**When** relate > reflect patterns are added
**Then** at least 5 relate > reflect patterns are included, covering light, medium, and heavy territory types
**And** all relate patterns use AI-truthful framing ("In conversations I've had...", "Something I notice is..." — NOT "I've seen people who..." or other hallucination-adjacent framing)

**Given** the character bible update
**When** story-pulling patterns are added
**Then** at least 5 story-pulling question patterns are included beyond the openers in the territory catalog
**And** story-pulling is positioned as the primary question type (70%+ of questions should pull concrete, situated narratives over introspective probes)

**Given** the character bible update
**When** the "observation + question" default pattern is addressed
**Then** it is repositioned as a secondary tool, not the default interaction pattern
**And** relate > reflect is established as the primary interaction pattern (FR9)

**Given** the character bible update
**When** ocean mirrors are addressed
**Then** they are repurposed as territory bridges — natural transitions between conversation topics (FR11)

**Given** the character bible update
**When** normalization patterns are added
**Then** "It's okay to not know" normalization is included to help users feel safe exploring uncertainty

### Story 2.3: Contradiction-Surfacing Migration to Portrait Generator

As a developer,
I want contradiction-surfacing moved from Nerin's character bible to the portrait generator prompt,
So that contradictions are surfaced in the portrait narrative rather than during the conversation.

**Acceptance Criteria:**

**Given** the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`
**When** contradiction-surfacing instructions are removed
**Then** all references to "contradictions are features" and "surface them as threads" are removed from the character bible

**Given** the portrait generator repository at `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts`
**When** contradiction-surfacing is added to the full portrait prompt
**Then** it includes a single unconditional instruction: "Look for contradictions and tensions in the evidence — places where the user's behavior in one domain conflicts with another. Surface them as discoveries, not diagnoses."
**And** this instruction is in the full portrait generator only — NOT in the teaser portrait

**Given** the portrait generator is updated
**When** a portrait is generated
**Then** the portrait narrative naturally incorporates contradictions found in the evidence
**And** contradictions are framed as discoveries, not clinical observations
