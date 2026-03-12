---
status: ready-for-dev
story_id: "26-1"
epic: 26
created_date: 2026-03-12
blocked_by: [23-1, 23-2]
---

# Story 26-1: Observation Focus Strength Formulas & Per-Domain Confidence

## Story

As a **developer**,
I want **pure functions that compute strength for each ObservationFocus variant using per-domain confidence**,
So that **the observation gating system has comparable, evidence-grounded strength signals to compete**.

## Acceptance Criteria

### Per-Domain Confidence
**Given** a `computePerDomainConfidence()` function at `packages/domain/src/utils/steering/observation-focus.ts`
**When** called with a facet name, a life domain, and per-domain evidence weights from `FacetMetrics.domainWeights`
**Then** it returns `domainConf(f, d) = C_MAX * (1 - exp(-k * w_g(f, d)))` where C_MAX=0.9, k=0.7
**And** it reuses the same formula and constants as the existing facet-level confidence computation — just scoped to a single domain's evidence weight

### Relate Strength
**Given** a `computeRelateStrength(energy, telling)` function
**When** called with energy and telling values in [0, 1]
**Then** it returns `energy * telling` — bounded [0, 1]

### Noticing Strength
**Given** a `computeNoticingStrength(smoothedClarity)` function
**When** called with a smoothed clarity value
**Then** it returns `smoothedClarity` — EMA-smoothed clarity for top domain, decay=0.5 (`CLARITY_EMA_DECAY`)

### Smoothed Clarity Computation
**Given** a `computeSmoothedClarity(previousSmoothed, currentClarity, decay)` function
**When** called with a previous smoothed value and current clarity
**Then** it returns `decay * currentClarity + (1 - decay) * previousSmoothed` (EMA formula)
**And** the default decay constant is 0.5 (`CLARITY_EMA_DECAY`)

### Contradiction Strength
**Given** a `computeContradictionStrength(delta, domainConfA, domainConfB)` function
**When** called with score divergence between two life domains for the same facet
**Then** it returns `delta * min(domainConf_A, domainConf_B)`
**And** when a facet has high delta but low per-domain confidence, strength is low — high divergence with weak evidence does not fire

### Convergence Strength
**Given** a `computeConvergenceStrength(normalizedSpread, domainConfidences)` function
**When** called with 3+ domains scoring similarly for the same facet
**Then** it returns `(1 - normalizedSpread) * min(domainConf)` across those domains

**Given** the convergence strength formula
**When** called with fewer than 3 domains
**Then** strength is 0 — convergence requires 3+ domains by definition

### Bounding
**Given** any strength function
**When** called with valid inputs
**Then** all returned strength values are bounded [0, 1]

### Unit Tests
**Given** unit tests at `packages/domain/src/utils/steering/__tests__/observation-focus.test.ts`
**When** tests run
**Then** tests cover:
- Per-domain confidence: matches existing confidence formula when given same weight
- Relate: high energy x high telling produces strong signal; low either axis produces weak signal
- Noticing: smoothed clarity tracks actual clarity with EMA decay
- Contradiction: high delta + high confidence produces strong signal; high delta + low confidence produces weak signal
- Convergence: 3+ domains with similar scores + high confidence produces strong signal; fewer than 3 domains returns 0
- All strength values bounded [0, 1]

## Tasks

### Task 1: Define ObservationFocus Constants
- [ ] Create `packages/domain/src/utils/steering/observation-focus.ts`
- [ ] Define named constants: `C_MAX = 0.9`, `K_CONFIDENCE = 0.7`, `CLARITY_EMA_DECAY = 0.5`
- [ ] Export constants as `OBSERVATION_FOCUS_CONSTANTS` frozen object for easy calibration

### Task 2: Implement `computePerDomainConfidence()`
- [ ] Implement: `C_MAX * (1 - Math.exp(-K_CONFIDENCE * domainWeight))`
- [ ] Accept a single domain's weight from `FacetMetrics.domainWeights`
- [ ] Verify formula matches existing `computeFacetMetrics()` confidence formula in `formula.ts` (same C_MAX=0.9, k=0.7)
- [ ] Write test: same weight as full-facet confidence produces same result

### Task 3: Implement `computeRelateStrength()`
- [ ] Implement: `energy * telling`
- [ ] Inputs: energy [0, 1], telling [0, 1]
- [ ] Write tests: (0.8, 0.9) => 0.72; (0.1, 0.9) => 0.09; (0, anything) => 0

### Task 4: Implement `computeSmoothedClarity()` and `computeNoticingStrength()`
- [ ] `computeSmoothedClarity(previous, current, decay)`: `decay * current + (1 - decay) * previous`
- [ ] `computeNoticingStrength(smoothedClarity)`: pass-through (identity), clamped to [0, 1]
- [ ] Write tests: EMA converges toward current clarity over multiple iterations

### Task 5: Implement `computeContradictionStrength()`
- [ ] Implement: `delta * Math.min(domainConfA, domainConfB)`
- [ ] Clamp result to [0, 1]
- [ ] Write tests: high delta + high confidence => strong; high delta + low confidence => weak

### Task 6: Implement `computeConvergenceStrength()`
- [ ] Implement: `(1 - normalizedSpread) * Math.min(...domainConfidences)`
- [ ] Return 0 if fewer than 3 domain confidences provided
- [ ] Clamp result to [0, 1]
- [ ] Write tests: 3+ domains with tight spread + high confidence => strong; <3 domains => 0

### Task 7: Export from Steering Index
- [ ] Add exports to `packages/domain/src/utils/steering/index.ts`
- [ ] Verify `packages/domain/src/utils/index.ts` re-exports via steering barrel
- [ ] Run typecheck to ensure clean compilation
