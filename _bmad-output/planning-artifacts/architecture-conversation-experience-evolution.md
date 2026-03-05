---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-05'
inputDocuments:
  - '_bmad-output/design-thinking-2026-03-04.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/prd.md'
workflowType: 'architecture'
project_name: 'big-ocean'
user_name: 'Vincentlay'
date: '2026-03-05'
scope: 'Conversation Experience Evolution (Design Thinking 2026-03-04)'
relationship: 'Standalone architecture — to be integrated into main architecture.md after epic/story creation'
---

# Conversation Experience Evolution — Architecture

_Standalone architecture for the Nerin conversation experience redesign (Design Thinking 2026-03-04). Covers territory-based steering and character bible reform. To be integrated into main architecture.md after epic/story creation._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (from Design Thinking 2026-03-04):**

This architecture covers the evolution of the Nerin conversation experience — a redesign of steering, character, and evidence extraction to improve both user experience and assessment accuracy simultaneously.

#### 1. Territory-Based Steering (replaces facet-targeted steering)
- 22-territory catalog with pre-mapped expected facets per territory (3-6 facets each)
- Territory scoring formula: `territory_score = coverage_value x energy_fit x freshness_bonus`
- Depth Readiness Score (DRS): single metric driving energy pacing and depth eligibility
- Circular exploration: freshness bonus causes natural territory revisits at different energy levels
- Redundancy-triggered shifts: well-covered facets automatically deprioritize their territories
- Cold-start adaptation: territory-aware seed pool for first 3 messages (curated light-energy territories, not separate concept)

#### 2. Character Bible Reform (Nerin persona restructure)
- Remove strategic/pacing instructions from character bible (depth progression, contradiction-surfacing)
- Move contradiction-surfacing to portrait generator prompt exclusively
- Replace "observation + question" default with "relate > reflect" as primary interaction pattern
- Story-pulling as 70%+ of question types (concrete, situated narratives over introspective probes)
- Ocean mirrors repurposed as territory bridges (natural transitions between topics)
- Character = personality, Steering = strategy — clean separation

#### 3. System Prompt Restructure
- Steering outputs `territoryId` only — prompt builder looks up catalog for everything else
- Nerin receives territory guidance (topic area + energy level) instead of facet targeting
- ConversAnalyzer gains one extra output field: observed energy level classification

**Non-Functional Requirements:**

| NFR | Requirement | Constraint |
|-----|-------------|------------|
| Backward compatibility | Existing evidence model unchanged | New fields additive only |
| Cost neutrality | Same ~$0.20 per assessment budget | No additional LLM calls |
| Latency | Same <2s P95 Nerin response | Territory scoring + DRS are pure functions, no added latency |
| Testability | All scoring deterministic | Pure functions, snapshot-testable |
| Observability | DRS + territory-facet yield tracking | Log DRS, territory selected, actual evidence per exchange |
| Phased rollout | Steering and character reform independently deployable | Phase 1 (steering) is atomic across 3 packages |

### Technical Constraints & Dependencies

**Established Stack (immutable):**
- All changes must fit within hexagonal architecture (Context.Tag DI)
- Territory catalog, scoring formula, DRS = pure domain functions in `packages/domain/src/utils/`
- Character bible changes = prompt content in `packages/domain/src/constants/`

**Integration points with existing system:**
- `computeSteeringTarget()` in `packages/domain/src/utils/formula.ts` — NOT replaced, becomes input to territory scorer (wrapper pattern)
- `computeFacetMetrics()` in `packages/domain/src/utils/formula.ts` — preserved, feeds coverage_value computation
- `nerin-system-prompt.ts` in `packages/domain/src/utils/` — territory context replaces facet targeting
- `nerin-chat-context.ts` in `packages/domain/src/constants/` — character bible reform
- `conversanalyzer.anthropic.repository.ts` — prompt gains energy classification output field
- `nerin-pipeline.ts` in `apps/api/src/use-cases/` — orchestrates steering -> Nerin -> ConversAnalyzer
- Cold-start seed pool in steering — reimplemented as curated light-energy territory subset

**Key constraint:** The `LifeDomain` enum and `conversation_evidence` schema are preserved. Territories are a layer ON TOP of domains. Each territory maps to 1-3 `LifeDomain` values.

### Cross-Cutting Concerns

1. **Steering output as domain type** — Steering outputs `{ territoryId }`. Prompt builder looks up the catalog. Single typed interface in `packages/domain/src/types/steering.ts`.
2. **Evidence model compatibility** — Existing evidence extraction unchanged. ConversAnalyzer gains one output field (observed energy level). No schema changes to `conversation_evidence`.
3. **Testing & validation infrastructure** — DRS logging, territory-facet yield tracking, engagement metrics. Needed for the observation protocol (post-30-conversations calibration).
4. **Phased deployment** — Steering and character reform are independently deployable, but Phase 1 is atomic across domain + infrastructure + api packages.
5. **ConversAnalyzer prompt** — One change in this architecture: energy classification output. Future shadow scoring (separate architecture session) will add territory expectations + avoidance detection additively.

### Scope Boundaries

**In scope (this architecture):**
- Territory catalog and scoring formula
- Depth Readiness Score (DRS) as single conversation driver
- Character bible reform (personality-only, relate > reflect, story-pulling)
- Portrait generator prompt update (inherits contradiction-surfacing)
- ConversAnalyzer energy classification output
- `territory_id` column on `assessment_messages`

**Out of scope (deferred to separate architecture session):**
- **Shadow scoring** — topic avoidance detection, avoidance classification (active deflection vs passive omission), shadow evidence records. Complex enough to warrant its own session.
- Note: the current ConversAnalyzer prompt's use of "avoidance" language refers to **trait avoidance** ("user avoids parties" → gregariousness -2). This is core evidence extraction and remains unchanged. **Topic avoidance** (user deflects from conversation territories) is the future shadow scoring concept — architecturally distinct.

### Dependency Analysis

**Architectural center of gravity:** The territory scoring formula is the hub — consumes coverage data, DRS, and freshness to produce a single territory selection per exchange.

**Critical coupling insights:**

1. **`computeFacetMetrics()` is NOT replaced** — it becomes an input to the territory scorer. The existing formula.ts functions remain; the territory scorer is a new layer on top (wrapper pattern).
2. **Cold-start is a territory subset** — reimplemented as "pick from curated light-energy territories" producing the same output shape as the territory scorer (`{ territoryId }`). Not a separate concept.
3. **Character reform is architecturally decoupled** — no data flow coupling to the territory system. Could deploy before, after, or alongside steering changes.
4. **ConversAnalyzer prompt is future-ready** — Phase 1 adds energy classification. Future shadow scoring session will add territory expectations + avoidance detection additively, no restructuring needed.

**Two feedback loops:**

```
Loop A (EXISTING — evidence cycle, preserved):
  Scoring → territory selected → Nerin asks → user responds →
  evidence extracted → facet metrics update → coverage_value recalculates

Loop B (NEW — energy cycle):
  Scoring → territory selected → user responds →
  ConversAnalyzer classifies observed energy → DRS recalculates →
  energy_fit curves shift territory preferences
```

**Deployment phases:**

```
Phase 0: Territory catalog + domain types for steering output
  No runtime impact — data + types only

Phase 1: Territory scorer + DRS + pipeline swap + prompt builder + ConversAnalyzer energy output
  ATOMIC across 3 packages (domain, infrastructure, api)
  Includes: territory_id column on assessment_messages

Phase 2: Character bible reform + portrait prompt gets contradiction-surfacing
  INDEPENDENT of Phase 1 — zero data flow coupling
  Could ship before or after Phase 1

Future: Shadow scoring (separate architecture session)
  Requires Phase 1 running (territories being selected)
```

**Key constraint:** Phase 1 is atomic across domain (scorer + types + catalog + prompt builder), infrastructure (ConversAnalyzer prompt), and api (pipeline swap). Cannot partially deploy.

### Failure Mode Findings

| # | Finding | Impact | Recommendation |
|---|---|---|---|
| 1 | Energy tracking is dual-purpose | Energy arc fails if it tracks prescribed energy instead of actual user experience | **Dual tracking:** Observed energy (ConversAnalyzer classification on user message) feeds DRS via EnergyMultiplier. Territory energy (from catalog) feeds the scoring formula via energy_fit curves. Observed energy is ground truth; territory energy is a tunable prior calibrated against observed data over time. |
| 2 | Freshness bonus scale (0.5-1.5) can overpower coverage_value (0-1) | Stale territories beat high-coverage ones | Cap freshness at 1.2 or make additive instead of multiplicative. Coverage should be primary driver. |
| 3 | ConversAnalyzer must NOT receive expected_facets in Phase 1 | Biases evidence extraction, defeating open-ended analysis | Phase 1: energy classification only. Expected facets enter only in future shadow scoring session. |
| 4 | "Relate > reflect" needs AI-truthful framing | "I've seen people who..." is hallucination-adjacent for an AI | Use "In conversations I've had..." or "Something I notice is..." — truthful for an AI. |
| 5 | No hard cap on territory repetition | Formula could loop same territories despite freshness bonus | Add: no territory more than 2x per conversation. |

## Core Architectural Decisions

### ADR-CEE-1: Territory Catalog Storage

**Decision:** Constants file at `packages/domain/src/constants/territory-catalog.ts`. Territory type with branded `TerritoryId`, referencing `FacetName` and `LifeDomain` for compile-time safety. Updated via code changes, not runtime config.

```typescript
type TerritoryId = string & Brand<"TerritoryId">;
type EnergyLevel = "light" | "medium" | "heavy";

interface Territory {
  readonly id: TerritoryId;
  readonly energyLevel: EnergyLevel;
  readonly domains: readonly LifeDomain[];
  readonly expectedFacets: readonly FacetName[];
  readonly opener: string;
}

export const TERRITORY_CATALOG: readonly Territory[] = [
  {
    id: "morning_routine" as TerritoryId,
    energyLevel: "light",
    domains: ["solo"],
    expectedFacets: ["orderliness", "activity_level", "self_discipline", "cheerfulness"],
    opener: "Walk me through a typical morning — do you have a routine, or does it just kind of happen?",
  },
  // ...21 more
] as const;
```

### ADR-CEE-2: Steering Output Type

**Decision:** Steering outputs `{ territoryId }` only. Prompt builder looks up the catalog for everything it needs (opener, domains, energy level). Clean separation: steering decides WHICH territory, prompt builder decides HOW to present it.

```typescript
// packages/domain/src/types/steering.ts
export interface SteeringOutput {
  readonly territoryId: TerritoryId;
}
```

### ADR-CEE-3: Depth Readiness Score (DRS)

**Decision:** DRS is the single metric driving both energy pacing and depth eligibility. No separate energy arc tracker. No boolean depth conditions. One number, one system.

**DRS Formula:**

```typescript
DRS = (0.55 × Breadth + 0.45 × Engagement) × EnergyMultiplier

// Breadth: facet coverage as continuous curve
Breadth = clamp((coveredFacets - 10) / 15, 0, 1)

// Engagement: behavioral signals from last 3 user messages
word = clamp(avgWordCountLast3 / 120, 0, 1)
evid = clamp(avgEvidencePerMsgLast3 / 6, 0, 1)
Engagement = clamp(0.55 * word + 0.45 * evid, 0, 1)

// Energy: recency-weighted pressure from ConversAnalyzer observed energy
ENERGY_WEIGHT = { light: 0, medium: 1, heavy: 2 }
RECENCY_WEIGHTS = [1.0, 0.6, 0.3]  // most recent → oldest
energyPressure = sum(lastThree.map((e, i) => RECENCY_WEIGHTS[i] * ENERGY_WEIGHT[e])) / 3.8
EnergyMultiplier = clamp(1 - energyPressure, 0, 1)
```

**Territory energy_fit driven by DRS (asymmetric curves):**

```typescript
lightFit  = clamp((0.55 - DRS) / 0.35, 0, 1)
mediumFit = 1 - clamp(abs(DRS - 0.55) / 0.35, 0, 1)  // wider tail
heavyFit  = clamp((DRS - 0.65) / 0.25, 0, 1)

energy_fit = { light: lightFit, medium: mediumFit, heavy: heavyFit }[territory.energyLevel]
territory_score = coverage_value × energy_fit × freshness_bonus
```

**Conversation rhythm emerges from the formula:**
- Early (DRS ~0.1-0.3): light territories dominate
- Mid (DRS ~0.4-0.6): medium territories dominate
- Late (DRS ~0.7+): heavy territories become competitive
- After heavy: energy pressure rises → DRS drops → recovery via light/medium
- Recovery: recency decay means one light exchange significantly restores DRS

**All configurable via AppConfig:** Breadth weights, engagement thresholds, recency weights, energy_fit curve parameters.

**Location:** Pure domain function in `packages/domain/src/utils/`

### ADR-CEE-4: Territory Tracking on Messages

**Decision:** Add nullable `territory_id` column to `assessment_messages` table. Records which territory was selected for each exchange. Snapshot value, not a foreign key — old messages keep historical territory IDs if catalog evolves. No data migration needed on territory changes.

Enables:
- DRS computation (coverage_value needs to know which territories were visited)
- Observability (territory-facet yield tracking per exchange)
- Future shadow scoring (gap = expected facets - actual evidence per message)

### ADR-CEE-5: ConversAnalyzer Energy Classification

**Decision:** ConversAnalyzer classifies observed energy level (`light | medium | heavy`) of the user's response as one extra output field. Same Haiku call that already runs per message — no additional LLM cost. No separate heuristic function.

ConversAnalyzer output gains one field:

```typescript
// Existing:
evidence: EvidenceRecord[]

// Added:
observedEnergyLevel: EnergyLevel  // "light" | "medium" | "heavy"
```

Observed energy feeds DRS via EnergyMultiplier. Territory energy (from catalog) is a separate tunable prior — calibrated against observed energy data over time.

**ConversAnalyzer Energy Classification Prompt Guidance:**

```
## Response Energy Classification

After extracting evidence, classify the energy level of the user's response.

Energy level measures the EMOTIONAL WEIGHT of what the user expressed —
how much this response cost them emotionally, not how long or articulate it was.

- **light**: User is describing, listing, sharing preferences or routines.
  Low emotional stakes. Could say this to anyone.
  Examples: daily habits, media preferences, casual opinions, factual descriptions.

- **medium**: User is telling stories with personal stakes, explaining motivations,
  reflecting on their behavior. Engaged but comfortable.
  Examples: work frustrations, friendship dynamics, personal projects, family roles.

- **heavy**: User is disclosing vulnerability, processing difficult emotions,
  confronting identity questions, or revealing something that costs them.
  Examples: fear, loss, shame, identity conflict, relationship pain, self-doubt.

Key signals:
- A short deflective answer ("I'd rather not go there") = heavy (avoidance of emotional content)
- A long casual description of hobbies = light (no emotional cost despite length)
- "I don't know" after a deep question = medium-to-heavy (struggling with self-knowledge)

Classify based on what the user EXPERIENCED, not what the topic is about.
```

### Technology Stack

**No starter evaluation needed.** This is a brownfield evolution of an established system. All technology choices are documented in the main `architecture.md`. This architecture adds no new dependencies — only new pure domain functions, prompt content changes, and one schema migration.

## Implementation Patterns & Consistency Rules

### Pattern 1: Territory Scoring — coverage_value computation

```typescript
// coverage_value: proportion of territory's expected facets that are thin
coverage_value = count(territory.expectedFacets WHERE facetEvidenceCount < MIN_EVIDENCE_THRESHOLD)
               / count(territory.expectedFacets)
```

`MIN_EVIDENCE_THRESHOLD` (configurable via AppConfig, default: 3) — a facet is "thin" if it has fewer than 3 evidence records. Uses existing `computeFacetMetrics()` output.

### Pattern 2: Territory Scoring — freshness_bonus computation

```typescript
// freshness_bonus: penalize recent, reward unexplored
freshness_bonus = clamp(1.0 + (exchangesSinceLastVisit * 0.05), 0.8, 1.2)
// Never visited = exchangesSinceLastVisit equals current exchange index → capped at 1.2
// Just visited = 0 → 1.0 (neutral)
// Hard cap: no territory more than MAX_TERRITORY_VISITS per conversation
// (configurable via AppConfig, default: 2)
// If visitCount >= MAX_TERRITORY_VISITS → territory_score = 0
```

Freshness capped at 1.2 (not 1.5) per failure mode finding #2 — coverage should be primary driver.

### Pattern 3: Cold-start territory selection

Cold-start is a territory subset, not a separate system. Produces the same `SteeringOutput` shape.

```typescript
// Cold-start (first 3 user messages): pick from COLD_START_TERRITORIES
// Curated light-energy territories that work as conversation openers
const COLD_START_TERRITORIES: TerritoryId[] = [
  "morning_routine", "weekend_rhythm", "media_and_taste"
] as const;

// Round-robin via seedIndex (same pattern as current cold-start)
// After cold-start, territory scoring formula takes over
```

### Pattern 4: Nerin prompt builder contract

Prompt builder receives `SteeringOutput { territoryId }`, looks up the catalog, formats for Nerin.

**What Nerin receives** (in steering context section of system prompt):
- Territory opener (the suggested question/topic)
- Territory domains (life areas this touches)
- Territory energy level (how emotionally loaded this topic is)

**What Nerin does NOT receive:**
- Expected facets (Nerin should not target facets)
- DRS value (internal metric, not for the conversation agent)
- Coverage data (steering concern, not character concern)

### Pattern 5: Character bible reform — what moves where

| Instruction | Current location | Action | New location |
|---|---|---|---|
| "Contradictions are features. Surface them as threads." | nerin-chat-context.ts | REMOVE from character | Full portrait generator prompt (single unconditional instruction) |
| Depth progression rules (messages 14-18) | nerin-chat-context.ts | REMOVE entirely | DRS handles pacing via formula |
| "Late-conversation depth" section | nerin-chat-context.ts | REMOVE entirely | DRS handles pacing via formula |
| "Observation + question" as default pattern | nerin-chat-context.ts | CHANGE to one-of-many | Keep in character but as secondary tool |
| "People are more ready for truth than they think" | nerin-chat-context.ts | REFRAME | "People discover more when they feel safe to explore" |
| ADD: Relate > reflect examples | — | ADD to character | nerin-chat-context.ts |
| ADD: Story-pulling as primary question type | — | ADD to character | nerin-chat-context.ts |
| ADD: "It's okay to not know" normalization | — | ADD to character | nerin-chat-context.ts |

**Constraints:**
- Minimum 5 relate > reflect patterns covering light/medium/heavy territory types
- Minimum 5 story-pulling question patterns beyond the openers in the territory catalog
- Relate patterns must use AI-truthful framing ("In conversations I've had..." not "I've seen people who...")

### Pattern 6: Portrait generator — contradiction-surfacing migration

Contradiction-surfacing migrates to the **full portrait generator prompt** as a single, unconditional instruction. Not depth-adaptive. Not in the teaser.

```
Look for contradictions and tensions in the evidence — places where
the user's behavior in one domain conflicts with another. Surface
them as discoveries, not diagnoses.
```

### Pattern 7: nerin-pipeline.ts orchestration change

**Clean cut — no backward compatibility or feature flag.** Old and new steering shapes are incompatible.

```
New pipeline per message:
  1. computeDRS(coveredFacets, lastThreeWordCounts, lastThreeEvidenceCounts, lastThreeObservedEnergies)
  2. scoreAllTerritories(catalog, facetMetrics, drs, visitHistory) → ranked territories
  3. selectTerritory(rankedTerritories, visitCounts) → { territoryId }  // enforces MAX_TERRITORY_VISITS cap
  4. buildNerinPrompt(territoryId, catalog, conversationHistory)  // looks up territory
  5. callNerin(prompt) → response
  6. callConversAnalyzer(message, response) → { evidence[], observedEnergyLevel }
  7. saveEvidence(evidence)
  8. saveExchangeMetadata(territoryId, observedEnergyLevel)  // UPDATE assessment_messages
```

Step 8 stores both `territory_id` and `observed_energy_level` on the `assessment_messages` row for this exchange.

### Pattern 8: Schema migration

One migration adding two nullable columns to `assessment_messages`:

```sql
ALTER TABLE assessment_messages
  ADD COLUMN territory_id VARCHAR,
  ADD COLUMN observed_energy_level VARCHAR;
```

Both nullable — cold-start messages and existing messages won't have them. `territory_id` is a snapshot (not a FK). `observed_energy_level` is ConversAnalyzer LLM output, not derivable.

### Pattern 9: Mock updates

ConversAnalyzer mock (`__mocks__/conversanalyzer.anthropic.repository.ts`) gains `observedEnergyLevel` in its return:

```typescript
const mockAnalyze = vi.fn().mockResolvedValue({
  evidence: [/* existing mock evidence */],
  observedEnergyLevel: "medium" as EnergyLevel,  // default medium
});
```

Tests needing specific energy scenarios override via `mockAnalyze.mockResolvedValueOnce(...)`.

### Anti-Patterns

- Passing expected facets to Nerin or ConversAnalyzer in Phase 1 (biases extraction)
- Storing DRS in the database (computed per exchange from available data)
- Using territory energy level for the energy arc instead of observed energy
- Hardcoding DRS thresholds or territory caps in formula code instead of AppConfig
- Treating cold-start as a separate steering system instead of a territory subset
- Removing contradiction-surfacing from Nerin without adding it to portrait generator
- Feature-flagging between old and new steering (clean cut, not gradual migration)
- Adding fewer than 5 relate patterns or 5 story-pulling patterns to character bible

### Enforcement

- DRS formula, territory scoring, coverage_value, freshness_bonus = pure domain functions with unit tests
- Territory catalog validated at compile time via `FacetName` and `LifeDomain` branded types
- All configurable values (thresholds, weights, caps) via AppConfig — no magic numbers in code
- Pipeline integration tested via existing `__mocks__` pattern with updated ConversAnalyzer mock

## Project Structure & Boundaries

### Complete Project Directory Structure

```
packages/domain/src/
├── constants/
│   ├── territory-catalog.ts              # NEW — 22 territories, COLD_START_TERRITORIES
│   └── nerin-chat-context.ts             # MODIFY — character bible reform (Phase 2)
├── types/
│   ├── territory.ts                      # NEW — TerritoryId, EnergyLevel, Territory interface
│   └── steering.ts                       # NEW — SteeringOutput { territoryId }
└── utils/
    ├── steering/
    │   ├── territory-scorer.ts           # NEW — scoreAllTerritories(), selectTerritory()
    │   ├── drs.ts                        # NEW — computeDRS(), energy_fit curves
    │   ├── territory-prompt-builder.ts   # NEW — buildNerinPrompt() territory lookup
    │   ├── index.ts                      # MODIFY — re-export new modules
    │   └── __tests__/
    │       ├── territory-scorer.test.ts  # NEW — scoring formula snapshot tests
    │       └── drs.test.ts              # NEW — DRS computation, energy curves
    ├── formula.ts                        # UNCHANGED — wrapper pattern, consumed by territory-scorer
    └── nerin-system-prompt.ts            # MODIFY — inject territory context instead of facet targeting

packages/infrastructure/src/
├── db/drizzle/
│   └── schema.ts                         # MODIFY — add territory_id, observed_energy_level to assessment_messages
├── repositories/
│   ├── conversanalyzer.anthropic.repository.ts   # MODIFY — energy classification prompt + output field
│   ├── portrait-generator.claude.repository.ts   # MODIFY — add contradiction-surfacing instruction (Phase 2)
│   └── __mocks__/
│       └── conversanalyzer.anthropic.repository.ts  # MODIFY — add observedEnergyLevel to mock return

apps/api/src/
├── use-cases/
│   └── nerin-pipeline.ts                 # MODIFY — new 8-step orchestration with territory scoring
└── __tests__/
    └── nerin-pipeline.test.ts            # MODIFY — update tests for territory-based steering

drizzle/                                  # Migration generated by drizzle-kit
└── XXXX_add_territory_columns.sql        # NEW — ALTER TABLE assessment_messages
```

### Architectural Boundaries

**Steering Boundary (domain — pure functions):**
- `territory-scorer.ts` and `drs.ts` are pure functions — zero side effects, zero I/O
- They consume `computeFacetMetrics()` output (existing) — wrapper pattern, not replacement
- Output: `SteeringOutput { territoryId }` — single typed contract

**Prompt Boundary (domain — prompt construction):**
- `territory-prompt-builder.ts` looks up territory catalog by ID, formats for Nerin
- Nerin receives opener + domains + energy level — NOT expected facets, DRS, or coverage data
- Clean separation: steering decides WHICH territory, prompt builder decides HOW to present it

**Evidence Boundary (infrastructure — LLM):**
- ConversAnalyzer adds `observedEnergyLevel` output — no change to evidence extraction
- Phase 1: ConversAnalyzer does NOT receive expected facets (prevents extraction bias)
- Future shadow scoring session will add expected facets additively

**Data Boundary (infrastructure — Drizzle):**
- Two new nullable columns on `assessment_messages` — additive, no migration of existing data
- `territory_id` is a snapshot string, not a FK — survives catalog evolution
- `observed_energy_level` is LLM output, not derivable — must be stored

### Requirements to Structure Mapping

**Phase 0 — Types & Catalog (no runtime impact):**
- `packages/domain/src/types/territory.ts` — TerritoryId, EnergyLevel, Territory
- `packages/domain/src/types/steering.ts` — SteeringOutput
- `packages/domain/src/constants/territory-catalog.ts` — 22 territories + COLD_START_TERRITORIES

**Phase 1 — Territory Steering + DRS + Pipeline (ATOMIC across 3 packages):**
- `packages/domain/src/utils/steering/territory-scorer.ts` — scoring formula
- `packages/domain/src/utils/steering/drs.ts` — DRS + energy_fit curves
- `packages/domain/src/utils/steering/territory-prompt-builder.ts` — prompt lookup
- `packages/domain/src/utils/nerin-system-prompt.ts` — territory context injection
- `packages/infrastructure/src/db/drizzle/schema.ts` — two new columns
- `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` — energy output
- `apps/api/src/use-cases/nerin-pipeline.ts` — new orchestration
- Migration SQL + mock updates + tests

**Phase 2 — Character Bible Reform (INDEPENDENT):**
- `packages/domain/src/constants/nerin-chat-context.ts` — relate > reflect, story-pulling, remove depth rules
- `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` — contradiction-surfacing

### Data Flow

```
User message
  → nerin-pipeline.ts orchestrates:
    → computeFacetMetrics() [existing, unchanged]
    → computeDRS() [NEW: domain pure function]
    → scoreAllTerritories() [NEW: domain pure function]
    → selectTerritory() [NEW: enforces visit cap]
    → buildNerinPrompt() [NEW: catalog lookup → prompt]
    → callNerin() [existing, receives territory context]
    → callConversAnalyzer() [MODIFIED: returns + observedEnergyLevel]
    → saveEvidence() [existing, unchanged]
    → saveExchangeMetadata() [NEW: territory_id + observed_energy_level on assessment_messages]
```

### Test Organization

All new tests follow existing patterns:
- **Unit tests:** `packages/domain/src/utils/steering/__tests__/` — pure function snapshot tests for DRS, scoring, energy curves
- **Mock updates:** `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` — add `observedEnergyLevel: "medium"` default
- **Pipeline tests:** `apps/api/src/__tests__/nerin-pipeline.test.ts` — update for territory-based orchestration using `vi.mock()` + `__mocks__` pattern

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
- ADR-CEE-1 (catalog) → ADR-CEE-2 (steering output) → ADR-CEE-4 (tracking): Clean chain. Catalog defines territories, steering selects one by ID, tracking stores the ID as snapshot. No conflicts.
- ADR-CEE-3 (DRS) → ADR-CEE-5 (ConversAnalyzer energy): DRS consumes `observedEnergyLevel` from ConversAnalyzer. No circular dependency — ConversAnalyzer classifies the PREVIOUS exchange's energy, DRS uses it for the NEXT territory selection.
- Branded `TerritoryId` + `FacetName` + `LifeDomain` compile-time validation ensures catalog entries can't reference invalid facets or domains.

**Pattern Consistency:**
- All scoring functions are pure domain functions in `packages/domain/src/utils/steering/` — consistent with existing `formula.ts` and `ocean-code-generator.ts` patterns.
- All configurable values via AppConfig — consistent with existing config pattern.
- Mock pattern (`__mocks__` sibling + `vi.mock()`) — consistent with all 23 existing mock files.
- Wrapper pattern (territory scorer wraps `computeFacetMetrics()`) — no replacement of existing functions.

**Structure Alignment:**
- New files land in existing directories (`utils/steering/`, `constants/`, `types/`). No new package or directory structure invention.
- Test files in `__tests__/` subdirectories — consistent with existing `steering/__tests__/`.
- Schema changes via Drizzle migration — consistent with existing workflow.

### Requirements Coverage

| Requirement | ADR / Pattern | Status |
|---|---|---|
| 22-territory catalog with facet/domain mappings | ADR-CEE-1 | Covered |
| Territory scoring formula | Pattern 1, 2 | Covered |
| DRS as single conversation driver | ADR-CEE-3 | Covered |
| Cold-start as territory subset | Pattern 3 | Covered |
| Steering outputs territoryId only | ADR-CEE-2 | Covered |
| Prompt builder looks up catalog | Pattern 4 | Covered |
| ConversAnalyzer energy classification | ADR-CEE-5 | Covered |
| Character bible reform | Pattern 5 | Covered (Phase 2) |
| Contradiction-surfacing to portrait | Pattern 6 | Covered (Phase 2) |
| Pipeline orchestration change | Pattern 7 | Covered |
| Schema migration | Pattern 8, ADR-CEE-4 | Covered |
| Mock updates | Pattern 9 | Covered |
| Backward compat (existing evidence unchanged) | NFR table | Covered |
| Cost neutrality (no extra LLM calls) | ADR-CEE-5 | Covered |
| Latency (pure functions, no added I/O) | NFR table | Covered |
| Testability (deterministic scoring) | Enforcement section | Covered |
| Phased deployment (steering atomic, character independent) | Dependency analysis | Covered |

### Implementation Readiness

**Decision Completeness:**
- 5 ADRs with code examples and typed interfaces
- 9 implementation patterns with code snippets
- 8 anti-patterns documented
- Enforcement rules defined

**Structure Completeness:**
- Complete directory tree with NEW/MODIFY/UNCHANGED annotations
- 4 architectural boundaries defined
- Phase-to-file mapping (Phase 0, 1, 2)
- Data flow diagram and test organization specified

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context analyzed (design thinking input, existing codebase)
- [x] Scope boundaries defined (in/out of scope explicit)
- [x] Technical constraints identified (hexagonal arch, wrapper pattern, no new deps)
- [x] Cross-cutting concerns mapped (5 concerns documented)
- [x] Dependency analysis with graph (2 feedback loops, deployment phases)
- [x] Failure mode analysis (5 findings with mitigations)

**Architectural Decisions**
- [x] 5 ADRs documented with code examples
- [x] Technology stack assessed (brownfield, no new deps)
- [x] DRS formula fully specified with all sub-components
- [x] Energy classification prompt guidance provided

**Implementation Patterns**
- [x] 9 patterns with code examples
- [x] Anti-patterns documented (8 anti-patterns)
- [x] Enforcement rules defined
- [x] Character bible migration table (what moves where)

**Project Structure**
- [x] Complete directory tree with annotations
- [x] 4 architectural boundaries defined
- [x] Phase-to-file mapping
- [x] Data flow diagram
- [x] Test organization specified

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — brownfield evolution with well-understood integration points, pure function core, and established testing patterns.

**Key Strengths:**
- Single metric (DRS) replaces multiple ad-hoc depth conditions — simpler to reason about and tune
- Pure domain functions for all scoring — fully unit-testable, no I/O dependencies
- Wrapper pattern preserves existing `formula.ts` — zero regression risk on current steering
- Clean phase separation — Phase 1 atomic but Phase 2 fully independent

**Areas for Future Enhancement:**
- Shadow scoring (separate architecture session) — will add expected facets to ConversAnalyzer additively
- Observation protocol (operational) — threshold calibration after 30+ real conversations
- Territory catalog tuning — opener quality and facet mapping refinement based on real data

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions (ADR-CEE-1 through CEE-5) exactly as documented
- Use implementation patterns consistently — especially the wrapper pattern over existing formula.ts
- Respect phase boundaries: Phase 0 (types only) → Phase 1 (atomic across 3 packages) → Phase 2 (independent)
- All configurable values via AppConfig, no magic numbers in scoring code
- ConversAnalyzer must NOT receive expected facets in Phase 1

**First Implementation Priority:**
- Phase 0: Create `territory.ts` types, `steering.ts` type, and `territory-catalog.ts` constants file
