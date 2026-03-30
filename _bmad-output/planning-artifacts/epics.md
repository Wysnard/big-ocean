---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "architecture.md (ADR-26, ADR-27, ADR-28)"
  - "scoring-confidence-v2-spec.md"
  - "prd.md (context — existing FRs referenced)"
  - "ux-design-specification.md (context — no new UX requirements)"
---

# big-ocean - Epic Breakdown: Scoring & Confidence v2

## Overview

This document covers the epic and story breakdown for the **Scoring & Confidence v2** initiative — the three interconnected architecture changes added to big-ocean's architecture document (ADR-26, ADR-27, ADR-28). Scope: life domain restructure, evidence extraction redesign, and territory catalog evolution.

## Requirements Inventory

### Functional Requirements

**Life Domain Restructure (ADR-26):**
- FR-S1: The system supports 6 life domains: work, relationships, family, leisure, health, other (solo removed, health added)
- FR-S2: Leisure absorbs introspective/alone-time aspects previously in solo (daydreaming, reading, solo hobbies)
- FR-S3: Health captures exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management
- FR-S4: Education maps to work domain (extraction prompt explicit about this)
- FR-S5: Existing solo evidence in DB is migrated to leisure or health
- FR-S6: All domain-referencing constants, enums, and schemas are updated (LIFE_DOMAINS, pgEnum, LifeDomainSchema, STEERABLE_DOMAINS)

**Evidence Extraction Redesign (ADR-27):**
- FR-S7: ConversAnalyzer is split into two separate LLM calls: user state extraction and personality evidence extraction
- FR-S8: User state extraction (Call 1) outputs energyBand, tellingBand, energyReason, tellingReason, withinMessageShift — no prompt changes from existing Phase 1
- FR-S9: Evidence extraction (Call 2) uses a new dedicated prompt with per-facet conversational anchors (HIGH/LOW examples for all 30 facets)
- FR-S10: Evidence extraction output uses polarity (high/low) instead of deviation (-3 to +3)
- FR-S11: Deviation is derived deterministically: sign(polarity) × magnitude(strength) — high+strong→+3, low+weak→-1, etc.
- FR-S12: A polarity column is added to the conversation_evidence table. Deviation column kept — computed from polarity × strength before insert
- FR-S13: An adapter function converts ExtractedEvidence → EvidenceInput before entering formula.ts. Formula code unchanged
- FR-S14: The evidence extraction prompt includes a mandatory dual-polarity check (same behavior → opposite polarity on different facet)
- FR-S15: The evidence extraction prompt includes a mandatory polarity balance audit (<35% LOW triggers re-read for absences/avoidances)
- FR-S16: Extraction prompt includes updated domain definitions with health domain and explicit domain assignment guidance
- FR-S17: Existing evidence from old sessions (with deviation but no polarity) still works — backward compatible

**Territory Catalog Evolution (ADR-28):**
- FR-S18: 12 existing territories are remapped from solo domains to new domains (health, leisure, relationships, work as specified in the remap table)
- FR-S19: identity-and-purpose territory is replaced by inner-life (health, leisure domains; intellect, emotionality, imagination, liberalism, artistic_interests facets)
- FR-S20: 3 new health territories added: body-and-movement, cravings-and-indulgences, stress-and-the-body
- FR-S21: 3 new hard-to-assess coverage territories added: home-and-space, trips-and-plans, taking-care
- FR-S22: 3 facet additions to existing territories: artistic_interests → inner-life, cautiousness → work-dynamics, liberalism → growing-up
- FR-S23: Territory catalog grows from 25 → 31 territories. All 30 facets have ≥2 territory routes. No hard-to-assess facet stuck in a single domain pair
- FR-S24: Each new territory has: name, description (Nerin's curiosity voice), expectedEnergy [0,1], dual-domain tags, expected facets, opener question
- FR-S25: Scoring formula unchanged — score, confidence, signalPower per facet and trait. No changes to formula.ts
- FR-S26: Steering formula unchanged — priority = α × max(0, C_target - confidence) + β × max(0, P_target - signalPower)

### NonFunctional Requirements

- NFR-S1: Backward compatibility — existing sessions with old evidence (deviation, no polarity) continue to work
- NFR-S2: Per-assessment LLM cost stays within ~€0.20 budget despite split into two calls (both still Haiku)
- NFR-S3: ConversAnalyzer latency budget: two sequential Haiku calls must complete within existing pipeline latency expectations
- NFR-S4: Three-tier extraction fail-open behavior preserved for both calls (strict ×3 → lenient ×1 → neutral defaults)
- NFR-S5: Migration must not break running sessions — domain enum change must be additive (add health first, then remap solo)
- NFR-S6: All existing unit tests for scoring, formula, and steering pass after changes (formula.ts unchanged)
- NFR-S7: Territory catalog tests updated for 31 territories
- NFR-S8: Polarity balance improves from current ~75% positive to closer to 50/50 distribution

### Additional Requirements

**From Architecture (technical constraints):**
- Hexagonal architecture: domain changes in packages/domain, infrastructure changes in packages/infrastructure
- Database migration: add polarity column (nullable for backward compat), add health to pgEnum, remap solo evidence
- ConversAnalyzer repository interface: split analyze/analyzeLenient into separate user-state and evidence methods (or add new methods)
- Extraction prompt: per-facet conversational anchors for all 30 facets with HIGH/LOW behavioral examples
- Pure functions: territory catalog is a constant in domain/src/constants/territory-catalog.ts — update in place
- Pacing pipeline orchestrator (nerin-pipeline.ts): update to call two LLM calls sequentially instead of one
- Domain constants: life-domain.ts, band-mappings.ts updated
- Schema updates: infrastructure/src/db/drizzle/schema.ts — pgEnum change, new column
- Never modify existing migration files — always append new migration

**From Scoring v2 Spec (migration order):**
- Phase 1 must complete before Phase 2 (territories reference new domains)
- Phase 1: life domains + territory catalog (can be deployed independently)
- Phase 2: evidence extraction split + polarity model (depends on Phase 1 domains)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-S1 | Epic 1 | 6 life domains (health replaces solo) |
| FR-S2 | Epic 1 | Leisure absorbs solo's introspective aspects |
| FR-S3 | Epic 1 | Health domain definition |
| FR-S4 | Epic 1 | Education → work mapping |
| FR-S5 | Epic 1 | DB migration of solo evidence |
| FR-S6 | Epic 1 | Constants/enums/schemas updated |
| FR-S7 | Epic 3 | ConversAnalyzer split into 2 LLM calls |
| FR-S8 | Epic 3 | User state call (no prompt changes) |
| FR-S9 | Epic 3 | Evidence call with per-facet anchors |
| FR-S10 | Epic 3 | Polarity (high/low) replaces deviation |
| FR-S11 | Epic 3 | Deterministic deviation derivation |
| FR-S12 | Epic 3 | Polarity column in DB |
| FR-S13 | Epic 3 | Adapter: ExtractedEvidence → EvidenceInput |
| FR-S14 | Epic 3 | Dual-polarity check in prompt |
| FR-S15 | Epic 3 | Polarity balance audit in prompt |
| FR-S16 | Epic 3 | Updated domain definitions in prompt |
| FR-S17 | Epic 3 | Backward compat for old evidence |
| FR-S18 | Epic 2 | 12 territories remapped to new domains |
| FR-S19 | Epic 2 | identity-and-purpose → inner-life |
| FR-S20 | Epic 2 | 3 new health territories |
| FR-S21 | Epic 2 | 3 new hard-to-assess coverage territories |
| FR-S22 | Epic 2 | 3 facet additions to existing territories |
| FR-S23 | Epic 2 | Catalog 25 → 31, all facets ≥2 routes |
| FR-S24 | Epic 2 | New territory definitions (name, energy, domains, facets, opener) |
| FR-S25 | Epic 2 | Scoring formula unchanged (validation) |
| FR-S26 | Epic 2 | Steering formula unchanged (validation) |

## Epic List

### Epic 1: Health Domain & Evidence Migration
The system recognizes health-related personality signals (exercise, diet, sleep, stress management) as a distinct life domain, enabling richer conversation steering and more accurate domain-diverse scoring.
**FRs covered:** FR-S1, FR-S2, FR-S3, FR-S4, FR-S5, FR-S6
**NFRs addressed:** NFR-S5 (safe migration), NFR-S1 (backward compat)
**Depends on:** Nothing — this is the foundation

### Epic 2: Territory Catalog Expansion
Conversations explore 6 new topic areas — health routines, cravings, stress, living spaces, trip planning, and caregiving. Hard-to-assess facets (orderliness, artistic_interests, cautiousness, liberalism, altruism) get multiple territory routes, producing more comprehensive and balanced personality profiles.
**FRs covered:** FR-S18, FR-S19, FR-S20, FR-S21, FR-S22, FR-S23, FR-S24, FR-S25, FR-S26
**NFRs addressed:** NFR-S7 (catalog tests)
**Depends on:** Epic 1 (new territories reference health domain)

### Epic 3: Evidence Extraction v3 — Polarity Model
Personality scores become significantly more accurate — the current positive deviation bias (75% positive, zero -3 extractions) is fixed by switching to a polarity+strength model with rich per-facet behavioral anchors. Low-scoring facets are properly captured, producing more truthful and differentiated personality profiles.
**FRs covered:** FR-S7, FR-S8, FR-S9, FR-S10, FR-S11, FR-S12, FR-S13, FR-S14, FR-S15, FR-S16, FR-S17
**NFRs addressed:** NFR-S1 (backward compat), NFR-S2 (cost budget), NFR-S3 (latency), NFR-S4 (fail-open), NFR-S6 (existing tests pass), NFR-S8 (polarity balance)
**Depends on:** Epic 1 (extraction prompt uses updated domain list)

---

## Epic 1: Health Domain & Evidence Migration

The system recognizes health-related personality signals (exercise, diet, sleep, stress management) as a distinct life domain, enabling richer conversation steering and more accurate domain-diverse scoring.

### Story 1.1: Add Health Life Domain to Constants, Schemas, and Database

As a **system operator**,
I want the health life domain added to all TypeScript constants, Effect schemas, and the PostgreSQL enum,
So that the platform can classify personality evidence observed in health contexts (exercise, diet, sleep, stress management).

**Acceptance Criteria:**

**Given** the current LIFE_DOMAINS constant includes solo
**When** the domain package constants are updated
**Then** LIFE_DOMAINS includes: work, relationships, family, leisure, health, other
**And** LifeDomainSchema (Effect Schema) validates the new domain list
**And** STEERABLE_DOMAINS includes health

**Given** the PostgreSQL evidence_domain enum does not include health
**When** a new Drizzle migration is applied
**Then** the evidence_domain pgEnum includes health
**And** no existing data is altered by this migration
**And** the migration file is appended (existing migrations untouched)

**Given** the system boots after migration
**When** new evidence is inserted with domain = "health"
**Then** the insert succeeds and the evidence is retrievable

### Story 1.2: Update Domain Definitions and Assignment Guidance

As a **system operator**,
I want the domain definitions updated so leisure absorbs solo's introspective aspects and education maps to work,
So that the extraction pipeline assigns evidence to the correct domain without ambiguity.

**Acceptance Criteria:**

**Given** the current domain definitions include solo for introspective/alone-time activities
**When** the domain definitions are updated in the domain package (life-domain.ts)
**Then** leisure's definition includes: "alone-time hobbies, introspection, daydreaming"
**And** health's definition includes: "Exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management"
**And** work's definition explicitly includes: "education, studying"
**And** other's definition includes guidance: "ONLY when truly doesn't fit above. Target <5%"
**And** solo is no longer listed in domain definitions

**Given** ConversAnalyzer's extraction prompt references domain definitions
**When** the domain definitions text used in prompts is updated
**Then** the prompt text matches the new domain list and definitions exactly

### Story 1.3: Migrate Existing Solo Evidence and Remove Solo Domain

As a **system operator**,
I want existing solo evidence in the database remapped to leisure or health, and the solo domain removed from all constants,
So that the system operates on a clean 6-domain model without legacy data.

**Acceptance Criteria:**

**Given** existing conversation_evidence rows have domain = "solo"
**When** the data migration runs
**Then** each solo evidence record is remapped to "health" or "leisure" using the following deterministic rule derived from the new health territory facet coverage: if `bigfive_facet` is in {activity_level, self_discipline, excitement_seeking, immoderation, cautiousness, vulnerability, anxiety, self_efficacy} → "health"; all other facets → "leisure"
**And** zero rows remain with domain = "solo" after migration

**Given** solo evidence has been remapped
**When** solo is removed from TypeScript constants (LIFE_DOMAINS, STEERABLE_DOMAINS, LifeDomainSchema)
**Then** the TypeScript compiler reports no references to "solo" in domain-related constants
**And** the solo value is left in the PostgreSQL pgEnum for now (unused — cleanup deferred to post-implementation)
**And** all existing unit tests pass (with updated fixtures where needed)

**Given** a running session created before the migration
**When** the session continues after the migration
**Then** evidence retrieval works correctly for all previously-solo evidence now classified as leisure or health (NFR-S5)

---

## Epic 2: Territory Catalog Expansion

Conversations explore 6 new topic areas — health routines, cravings, stress, living spaces, trip planning, and caregiving. Hard-to-assess facets (orderliness, artistic_interests, cautiousness, liberalism, altruism) get multiple territory routes, producing more comprehensive and balanced personality profiles.

### Story 2.1: Remap Existing Territory Domains and Replace identity-and-purpose

As a **system operator**,
I want the 12 existing territories that referenced solo remapped to their new domains, and identity-and-purpose replaced by inner-life,
So that all territories reference valid domains from the new 6-domain model.

**Acceptance Criteria:**

**Given** 12 territories in the catalog reference the solo domain
**When** territory-catalog.ts is updated
**Then** each territory's domains match the remap table:
- daily-routines: work, health
- creative-pursuits: leisure, work
- weekend-adventures: leisure, relationships
- learning-curiosity: leisure, work
- comfort-zones: health, relationships
- spontaneity-and-impulse: leisure, health
- emotional-awareness: health, relationships
- ambition-and-goals: work, health
- growing-up: family, relationships
- friendship-depth: relationships, leisure
- opinions-and-values: relationships, work
- inner-struggles: health, relationships
**And** no territory references the solo domain

**Given** the territory identity-and-purpose exists with domains solo, work
**When** it is replaced by inner-life
**Then** inner-life has domains: health, leisure
**And** inner-life has facets: intellect, emotionality, imagination, liberalism, artistic_interests
**And** inner-life has expectedEnergy: 0.60
**And** inner-life has a description in Nerin's curiosity voice
**And** inner-life has an opener question
**And** identity-and-purpose no longer exists in the catalog

**Given** the catalog is updated
**When** existing tests for territory-catalog run
**Then** tests are updated to reflect the new domain assignments and pass

### Story 2.2: Add 6 New Territories (3 Health + 3 Hard-to-Assess Coverage)

As a **system operator**,
I want 6 new territories added to the catalog covering health contexts and hard-to-assess facets,
So that the pacing pipeline can steer conversations into health topics and ensure comprehensive facet coverage.

**Acceptance Criteria:**

**Given** the catalog has 25 territories (after Story 2.1 remap + replacement)
**When** the 3 new health territories are added
**Then** the catalog contains:
- body-and-movement (health, leisure; activity_level, self_discipline, excitement_seeking; energy 0.25)
- cravings-and-indulgences (health, leisure; immoderation, self_discipline, cautiousness; energy 0.40)
- stress-and-the-body (health, work; vulnerability, anxiety, self_efficacy, self_discipline; energy 0.60)
**And** each has a description in Nerin's curiosity voice and an opener question

**Given** the 3 health territories are added
**When** the 3 new hard-to-assess coverage territories are added
**Then** the catalog contains:
- home-and-space (family, leisure; orderliness, activity_level, cautiousness; energy 0.22)
- trips-and-plans (leisure, relationships; orderliness, adventurousness, cooperation; energy 0.28)
- taking-care (health, family; altruism, sympathy, dutifulness, self_discipline; energy 0.48)
**And** each has a description in Nerin's curiosity voice and an opener question

**Given** all 6 territories are added
**When** the catalog size is counted
**Then** the catalog contains exactly 31 territories

### Story 2.3: Facet Additions to Existing Territories and Catalog Validation

As a **system operator**,
I want 3 facets added to existing territories and the full catalog validated for completeness,
So that every hard-to-assess facet has ≥2 territory routes with no single-domain-pair bottleneck, and the scoring/steering formulas remain unchanged.

**Acceptance Criteria:**

**Given** inner-life already includes artistic_interests (from Story 2.1)
**When** facets are added to existing territories
**Then** cautiousness is added to work-dynamics' facet list
**And** liberalism is added to growing-up's facet list

**Given** the full 31-territory catalog
**When** facet coverage is validated
**Then** all 30 Big Five facets have ≥2 territory routes
**And** no hard-to-assess facet (orderliness, artistic_interests, cautiousness, liberalism, dutifulness, altruism, immoderation, depression, modesty, adventurousness) is stuck in a single domain pair
**And** orderliness appears in ≥3 territories across ≥4 domains

**Given** the territory catalog is updated
**When** the territory scorer (scoreAllTerritories) runs with 31 territories
**Then** the five-term formula produces valid scores for all territories without code changes (FR-S25)
**And** the steering priority formula is unchanged (FR-S26)

**Given** the full catalog update
**When** all territory catalog tests run
**Then** tests cover 31 territories, new domain assignments, new facet lists, and all pass (NFR-S7)

---

## Epic 3: Evidence Extraction v3 — Polarity Model

Personality scores become significantly more accurate — the current positive deviation bias (75% positive, zero -3 extractions) is fixed by switching to a polarity+strength model with rich per-facet behavioral anchors. Low-scoring facets are properly captured, producing more truthful and differentiated personality profiles.

### Story 3.1: Polarity Schema, Database Migration, and Deviation Adapter

As a **system operator**,
I want a polarity column added to the evidence table and a deterministic adapter that derives deviation from polarity × strength,
So that the new extraction model can store its output while the existing scoring formula continues to work unchanged.

**Acceptance Criteria:**

**Given** the conversation_evidence table has no polarity column
**When** a new Drizzle migration is applied
**Then** a polarity column (enum: high, low) is added as nullable (existing rows have NULL — backward compat)
**And** the deviation column is preserved unchanged
**And** existing evidence rows with NULL polarity continue to work in all read paths (NFR-S1)
**And** the migration file is appended (existing migrations untouched)

**Given** the new ExtractedEvidence type is defined
**When** the type is created in packages/domain/src/types/evidence.ts
**Then** it includes: bigfiveFacet, polarity (high/low), strength, confidence, domain, note
**And** a polarity field is added to the Evidence Effect Schema

**Given** the deriveDeviation pure function is implemented
**When** called with polarity and strength
**Then** it returns: high+strong→+3, high+moderate→+2, high+weak→+1, low+strong→-3, low+moderate→-2, low+weak→-1
**And** all 6 combinations are covered by unit tests

**Given** an adapter function converts ExtractedEvidence → EvidenceInput
**When** new evidence is inserted via the adapter
**Then** the polarity column is populated
**And** the deviation column is computed from deriveDeviation(polarity, strength)
**And** formula.ts receives the same deviation values it always has — zero changes to scoring math (FR-S13)

### Story 3.2: Split ConversAnalyzer into Two Separate LLM Calls

As a **system operator**,
I want ConversAnalyzer split from one dual-purpose LLM call into two dedicated calls (user state + evidence),
So that each call has a focused task, reducing hallucination and freeing token budget for richer evidence extraction.

**Acceptance Criteria:**

**Given** ConversAnalyzer v2 makes a single Haiku call for both user state and evidence
**When** the repository interface is updated
**Then** the ConversAnalyzer repository exposes two separate methods:
- `analyzeUserState` — returns energyBand, tellingBand, energyReason, tellingReason, withinMessageShift
- `analyzeEvidence` — returns ExtractedEvidence[] (with polarity)
**And** the existing `analyze` and `analyzeLenient` methods are preserved for backward compatibility during transition (or removed if no longer called)

**Given** the user state extraction call (Call 1)
**When** it executes
**Then** it uses the existing Phase 1 prompt with no content changes (FR-S8)
**And** it returns the same user state schema as before

**Given** both calls use Haiku
**When** a full extraction runs (Call 1 + Call 2 sequential)
**Then** total cost for both calls stays within the per-message extraction budget (NFR-S2)
**And** total latency for both calls is acceptable for the pipeline (NFR-S3)

**Given** the infrastructure repository implementations
**When** the Anthropic repository is updated
**Then** strict and lenient parsing modes exist for both calls independently
**And** each call has its own three-tier fail-open behavior: strict ×3 → lenient ×1 → neutral defaults (NFR-S4)
**And** user state neutral defaults: energy=0.5, telling=0.5
**And** evidence neutral defaults: empty array []

### Story 3.3: Evidence Extraction v3 Prompt with Per-Facet Conversational Anchors

As a **system operator**,
I want a new evidence extraction prompt with HIGH/LOW behavioral examples for all 30 facets, dual-polarity checks, and polarity balance audits,
So that the LLM produces better-calibrated evidence with balanced polarity distribution.

**Acceptance Criteria:**

**Given** the evidence extraction prompt is being created
**When** the prompt is written
**Then** it includes conversational anchor examples (HIGH and LOW) for all 30 Big Five facets
**And** each anchor reads as natural conversation (what a real person would say to Nerin)
**And** the prompt instructs the LLM to output polarity (high/low) and strength (weak/moderate/strong) — not deviation

**Given** the dual-polarity check instruction
**When** the LLM extracts a signal
**Then** the prompt mandates asking: "Does this same behavior ALSO reveal the OPPOSITE polarity on a DIFFERENT facet?" (FR-S14)
**And** the prompt includes 5+ concrete dual-polarity examples from the spec

**Given** the polarity balance audit instruction
**When** the LLM has extracted all signals from a message
**Then** the prompt mandates counting HIGH vs LOW: if <35% are LOW, re-read for absences, avoidances, and preferences-against (FR-S15)

**Given** the domain definitions in the prompt
**When** the extraction prompt references life domains
**Then** it uses the updated 6-domain list with health included and solo absent (FR-S16)
**And** domain assignment guidance matches the spec (work includes education, leisure includes introspection, other target <5%)

**Given** the prompt includes the current evidence distribution context
**When** the extraction call is made
**Then** the prompt template accepts a `domainDist` variable showing per-domain evidence counts for the current session

**Note:** Conversational anchors (HIGH/LOW examples for all 30 facets) are sourced from scoring-confidence-v2-spec.md §4 — Evidence Extraction Prompt. Do not write from scratch.

### Story 3.4: Pipeline Integration — Wire Two-Call Extraction into nerin-pipeline

As a **system operator**,
I want the nerin-pipeline orchestrator updated to call user state extraction then evidence extraction sequentially, integrating the polarity adapter and fail-open behavior,
So that the full pacing pipeline works end-to-end with the new two-call extraction model.

**Acceptance Criteria:**

**Given** nerin-pipeline.ts currently calls ConversAnalyzer once
**When** the orchestrator is updated
**Then** it calls `analyzeUserState` first, then `analyzeEvidence` second (sequential, not parallel)
**And** user state output feeds into E_target computation (unchanged)
**And** evidence output passes through the deriveDeviation adapter before being saved and fed to the scorer

**Given** Call 1 (user state) fails after all retries
**When** neutral defaults are applied (energy=0.5, telling=0.5)
**Then** the pipeline continues with comfort-level pacing
**And** Call 2 (evidence) still executes independently

**Given** Call 2 (evidence) fails after all retries
**When** neutral defaults are applied (evidence=[])
**Then** the pipeline continues — no evidence saved for this turn, no scoring update
**And** the conversation is not interrupted

**Given** the full pipeline runs end-to-end
**When** an integration test exercises a complete extraction cycle
**Then** evidence is saved with both polarity and deviation columns populated
**And** the territory scorer receives correct coverage data from the new evidence
**And** all existing pipeline tests pass (NFR-S6)

**Given** the polarity model is deployed
**When** evidence distribution is analyzed across test conversations
**Then** the LOW polarity percentage is measurably higher than the previous ~25% baseline (NFR-S8)

---

## Post-Implementation Cleanup

### Story C.1: Remove Solo from PostgreSQL Enum

As a **system operator**,
I want the unused solo value removed from the PostgreSQL evidence_domain enum,
So that the database schema reflects the clean 6-domain model with no legacy values.

**Acceptance Criteria:**

**Given** zero conversation_evidence rows have domain = "solo" (verified by Story 1.3)
**And** solo is already removed from all TypeScript constants
**When** a new Drizzle migration is applied that removes solo from the evidence_domain pgEnum
**Then** the enum contains only: work, relationships, family, leisure, health, other
**And** all existing data is preserved (no rows reference solo)
**And** the migration file is appended (existing migrations untouched)
**And** the system boots and operates normally after migration

**Note:** This is a post-implementation cleanup story. Run after all 3 epics are complete and verified in production. PostgreSQL enum value removal requires creating a new type, migrating columns, and dropping the old type — schedule during a maintenance window.
