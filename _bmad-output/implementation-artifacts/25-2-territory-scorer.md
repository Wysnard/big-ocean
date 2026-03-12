# Story 25-2: Territory Scorer

**Status:** ready-for-dev

**Epic:** Epic 3 — Adaptive Pacing & Territory Scoring (Conversation Pacing Pipeline)

## Story

As a developer,
I want a pure function that ranks all 25 territories per turn using a 5-term additive formula,
So that territory selection balances coverage needs, narrative flow, session arc, energy fit, and freshness.

## Acceptance Criteria

### AC1: 5-term additive scoring formula

**Given** a `scoreAllTerritories()` pure function at `packages/domain/src/utils/steering/territory-scorer.ts`
**When** called with E_target, coverage gaps (per-facet priority from existing `computeFacetMetrics()`), territory catalog, current territory, visit history, turnNumber, and totalTurns
**Then** it computes for each of the 25 territories:
- `coverageGain(t)` = sqrt(sum(baseYield x priority_f / priority_max)) where baseYield = 1/|expectedFacets| (source-normalized, bounded [0, 1])
- `adjacency(t)` = 0.8 x domainSimilarity(current, t) + 0.2 x facetSimilarity(current, t) using Jaccard similarity
- `conversationSkew(t)` = light boost for early turns (ramp 0->0.2) + heavy boost for late turns (ramp 0.7->1.0) (FR22)
- `energyMalus(t)` = w_e x (expectedEnergy - E_target)^2
- `freshnessPenalty(t)` = 0 if current territory, else max(0, w_f x (1 - turnsSinceLastVisit / cooldown)); never-visited = 0
- `score(t)` = coverageGain + adjacency + conversationSkew - energyMalus - freshnessPenalty
**And** output is `TerritoryScorerOutput` with all territories sorted descending by score, each with full 5-term breakdown

### AC2: Self-adjacency property

**Given** the self-adjacency property
**When** the current territory is scored
**Then** it has Jaccard = 1.0 with itself -- providing natural stability without an explicit currentBonus

### AC3: Cold start uniform coverageGain

**Given** cold start (all facets at zero coverage)
**When** territories are scored
**Then** all territories score equally on coverageGain (uniform deficit) regardless of facet count -- source normalization ensures this

### AC4: Diminishing coverage returns via sqrt

**Given** coverageGain uses sqrt compression
**When** coverage improves through the session
**Then** coverage pressure has diminishing returns -- gentle tide, never spikes

### AC5: Configurable scorer constants

**Given** all scorer constants (w_e, w_f, cooldown, priority alpha/beta, C_target, P_target)
**When** referenced in the code
**Then** they are defined as named constants in a scorer config object, easily adjustable for calibration

### AC6: Unit tests

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

## Tasks

### Task 1: Define scorer config type and defaults

Create a `PacingScorerConfig` interface and `PACING_SCORER_DEFAULTS` constant in the territory scorer file with:
- `w_e: number` — energy malus weight (default: 0.3)
- `w_f: number` — freshness penalty weight (default: 0.2)
- `cooldown: number` — turns before freshness penalty fully decays (default: 5)
- `domainAdjWeight: number` — domain similarity weight in adjacency (default: 0.8)
- `facetAdjWeight: number` — facet similarity weight in adjacency (default: 0.2)
- `earlySkewEnd: number` — turn fraction where early skew ramp ends (default: 0.2)
- `earlySkewMax: number` — max early skew boost (default: 0.2)
- `lateSkewStart: number` — turn fraction where late skew ramp starts (default: 0.7)
- `lateSkewMax: number` — max late skew boost (default: 1.0)
- `priorityAlpha: number` — confidence gap weight for priority (default: 1.0, from FormulaConfig)
- `priorityBeta: number` — signal power gap weight for priority (default: 0.8, from FormulaConfig)
- `C_target: number` — target confidence (default: 0.75, from FormulaConfig)
- `P_target: number` — target signal power (default: 0.5, from FormulaConfig)

### Task 2: Implement coverageGain computation

Implement `computeCoverageGainV2()` that:
1. Accepts a territory, per-facet priority map (from `computeFacetMetrics`), and max priority
2. For each expected facet: `baseYield = 1 / |expectedFacets|`, `yield = baseYield x (priority_f / priority_max)`
3. Sum all yields, apply sqrt compression
4. Returns value bounded [0, 1]
5. When all priorities are equal (cold start), all territories get the same coverageGain regardless of facet count

### Task 3: Implement adjacency computation

Implement `computeAdjacency()` that:
1. Accepts the current territory and the candidate territory
2. Computes Jaccard domain similarity: |domainsA intersect domainsB| / |domainsA union domainsB|
3. Computes Jaccard facet similarity: |facetsA intersect facetsB| / |facetsA union facetsB|
4. Returns: `domainAdjWeight x domainSimilarity + facetAdjWeight x facetSimilarity`
5. Self-adjacency returns 1.0

### Task 4: Implement conversationSkew

Implement `computeConversationSkew()` that:
1. Accepts territory expectedEnergy, turnNumber, totalTurns, and config
2. Computes turn fraction: `turnFraction = turnNumber / totalTurns`
3. Early boost (turns 1-5 for 25 turns): linear ramp from 0 to earlySkewMax for light territories (expectedEnergy < 0.38)
4. Late boost (turns ~18-25): linear ramp from 0 to lateSkewMax for heavy territories (expectedEnergy >= 0.55)
5. Mid session: returns 0 (quiet)

### Task 5: Implement energyMalus

Implement `computeEnergyMalus()` that:
1. Accepts territory expectedEnergy, E_target, and w_e
2. Returns: `w_e x (expectedEnergy - E_target)^2`
3. Quadratic penalty — larger gaps penalized more severely

### Task 6: Implement freshnessPenalty

Implement `computeFreshnessPenaltyV2()` that:
1. Accepts territory ID, current territory ID, visit history, turnNumber, and config
2. Returns 0 if territory is the current territory (no self-penalty for stability)
3. Returns 0 if territory was never visited
4. Otherwise: `max(0, w_f x (1 - turnsSinceLastVisit / cooldown))`
5. Penalty decays linearly with turns since last visit, fully gone after `cooldown` turns

### Task 7: Implement evolved scoreAllTerritories

Replace or extend the existing `scoreAllTerritories()` to use the new 5-term additive formula:
1. Accept E_target, facet metrics (from `computeFacetMetrics()`), territory catalog, current territory, visit history, turnNumber, totalTurns, and config
2. Compute max priority across all facets
3. For each territory: compute all 5 terms, produce `score = coverageGain + adjacency + skew - malus - freshness`
4. Return `TerritoryScorerOutput` with territories sorted descending by score, each with `TerritoryScoreBreakdown`

### Task 8: Write comprehensive unit tests

Update test file at `packages/domain/src/utils/steering/__tests__/territory-scorer.test.ts`:
- Test coverageGain cold start uniformity
- Test self-adjacency = 1.0
- Test early session skew boosts light territories
- Test late session skew boosts heavy territories
- Test mid session skew is quiet
- Test energy malus quadratic penalty
- Test freshness penalty for recently visited, never-visited, and current territory
- Test coverage decline as facets get evidence

## Dependencies

- Epic 1, Story 23-1: Pipeline domain types (already merged — `TerritoryScorerOutput`, `TerritoryScoreBreakdown`, `RankedTerritory`)
- Epic 1, Story 23-2: Territory catalog evolution (already merged — 25 territories with continuous energy)
- Existing `computeFacetMetrics()` in `packages/domain/src/utils/formula.ts`

## Technical Notes

- This story **replaces** the existing multiplicative scorer (`coverage x energyFit x freshness`) from Story 21-3 with an additive 5-term formula.
- The existing `scoreAllTerritories()` signature changes — callers in the pipeline will need updating (Story 25-5 pipeline wiring).
- Keep the old functions (e.g., `computeCoverageValue`, `buildFacetEvidenceCounts`) until the pipeline wiring story deprecates them.
- The new scorer outputs `TerritoryScorerOutput` (from `pacing.ts` types) instead of `ScoredTerritory[]`.
- Pure functions only — no Effect dependencies, no database, no I/O.
