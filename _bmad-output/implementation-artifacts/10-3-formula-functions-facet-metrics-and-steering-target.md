# Story 10.3: Formula Functions — Facet Metrics & Steering Target

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want pure domain functions that compute facet metrics and steering targets from evidence,
So that steering is deterministic, testable, and zero-LLM-cost.

## Acceptance Criteria

1. **Given** a set of conversation evidence records (`EvidenceInput[]` from `@workspace/domain`) **When** `computeFacetMetrics(evidence: EvidenceInput[], config: FormulaConfig)` is called **Then** it returns per-facet: score (context-weighted mean), confidence (C_max(1 - e^{-kW})), signalPower (V × D) **And** context weights use √Σc_i per domain (anti-redundancy) **And** signal power uses normalized entropy across domains

2. **Given** facet metrics **When** `computeSteeringTarget(metrics, previousDomain, config)` is called with `previousDomain: LifeDomain | null` **Then** Step 1: it selects the target facet via `FacetPriority_f = α(C_target - C_f)+ + β(P_target - P_f)+` (argmax) **And** Step 2: for the target facet, it computes expected signal power gain `ΔP(f,g) = V' × D' - V_f × D_f` for each steerable domain (excludes "other") **And** Step 3: it applies switch cost penalty `Score(f,g) = ΔP(f,g) - λ × SwitchCost(g)` where SwitchCost=0 if same as previousDomain, else 1 **And** selects `Domain* = argmax_g Score(f,g)` **And** generates a natural language steering hint

3. **Given** FORMULA_DEFAULTS config **When** functions are called **Then** they accept config as parameter (never import globals) **And** FORMULA_DEFAULTS is Object.freeze'd with: C_max=0.9, k=0.7, C_target=0.75, P_target=0.5, alpha=1.0, beta=0.8 (facet priority weight), betaVolume=0.7 (volume saturation ≈k), eta=0.3, lambda=0.1 (switch cost penalty), cBar=0.5 (expected avg confidence), epsilon=1e-10, SCORE_MIDPOINT=10

4. **Given** these are pure functions in `packages/domain/src/utils/formula.ts` **When** unit tested **Then** 100% branch coverage with deterministic inputs/outputs

5. **Given** empty evidence (cold start, messages 1-3) **When** `computeSteeringTarget` is called **Then** it returns a greeting seed default from a rotating pool **And** `computeFacetMetrics` returns an empty map (callers treat missing facets as defaults: SCORE_MIDPOINT=10, confidence=0, signalPower=0)

## Tasks / Subtasks

- [x] Task 1: Create FORMULA_DEFAULTS config and types (AC: #3)
  - [x] 1.1: Create `packages/domain/src/utils/formula.ts`
  - [x] 1.2: Define `FormulaConfig` type with all parameters: C_max, k, C_target, P_target, alpha, beta (facet priority), betaVolume (volume saturation), eta, lambda, cBar, epsilon, SCORE_MIDPOINT
  - [x] 1.3: Define `FORMULA_DEFAULTS` as `Object.freeze<FormulaConfig>({...})`
  - [x] 1.4: Define `FacetMetrics` type: `{ score: number; confidence: number; signalPower: number }`
  - [x] 1.5: Define `SteeringTarget` type: `{ targetFacet: FacetName; targetDomain: LifeDomain; steeringHint: string }`
  - [x] 1.6: Define `GREETING_SEED_POOL` — array of 5 curated `{ domain: LifeDomain, facet: FacetName }` pairs (type-checked via `satisfies`) for cold start: `(leisure, imagination), (relationships, gregariousness), (work, achievement_striving), (solo, self_consciousness), (family, altruism)`
  - [x] 1.7: Export all types and constants from domain barrel (`packages/domain/src/index.ts`)

- [x] Task 2: Implement `computeFacetMetrics(evidence, config)` (AC: #1, #5)
  - [x] 2.1: Group evidence by facet → then by domain within each facet
  - [x] 2.2: Per domain group: compute weighted mean `μ_g = Σ(c_i × x_i) / Σ(c_i)` and context weight `w_g = √(Σ c_i)` (anti-redundancy)
  - [x] 2.3: Compute final facet score: `S_f = Σ(w_g × μ_g) / Σ(w_g)` (0-20 range)
  - [x] 2.4: Compute total diversified evidence mass: `W = Σ_g(w_g)`
  - [x] 2.5: Compute facet confidence: `C_f = C_max × (1 - e^{-k × W})` (0 to C_max, saturating)
  - [x] 2.6: Compute signal power: `p_g = w_g / Σ_h(w_h)`, `D = -Σ(p_g × ln(p_g)) / ln(|G|)` (normalized entropy, skip zero-weight domains), `V = 1 - e^{-betaVolume × W}`, `P_f = V × D`
  - [x] 2.7: Handle empty evidence: return `SCORE_MIDPOINT (10)`, confidence `0`, signalPower `0`
  - [x] 2.8: Handle single evidence: no division-by-zero, entropy with single domain = 0
  - [x] 2.9: Return `Map<FacetName, FacetMetrics>` (only facets with evidence get entries; missing facets = defaults)

- [x] Task 3: Implement `computeSteeringTarget(metrics, previousDomain, config)` (AC: #2, #5)
  - [x] 3.1: **Signature:** `computeSteeringTarget(metrics: Map<FacetName, FacetMetrics>, previousDomain: LifeDomain | null, config: FormulaConfig, seedIndex?: number): SteeringTarget`. `previousDomain` is `null` on first message after cold start (no switch cost applied when null).
  - [x] 3.2: **Step 1 — Facet Priority:** For each facet in metrics, compute `FacetPriority_f = α × max(0, C_target - C_f) + β × max(0, P_target - P_f)`. Select `f* = argmax(FacetPriority)`. If all priorities are 0 (all facets above targets), still pick the facet with the lowest confidence as tiebreaker.
  - [x] 3.3: **Step 2 — Domain Selection via Expected Signal Power Gain:** For target facet `f*`, for each steerable domain `g` in `STEERABLE_DOMAINS` (excludes "other"):
    - Compute estimated mass delta: `Δw_g ≈ √(w_{f,g}² + c̄) - w_{f,g}` where c̄ = config.cBar (0.5)
    - Compute projected total mass: `W' = W_f + Δw_g`
    - Compute projected volume: `V' = 1 - e^{-betaVolume × W'}`
    - Recompute projected diversity `D'` with updated domain weight (requires helper to recalculate normalized entropy with hypothetical new w_{f,g})
    - Expected gain: `ΔP(f,g) = V' × D' - V_f × D_f` (current signal power)
  - [x] 3.4: **Step 3 — Switch Cost:** `Score(f,g) = ΔP(f,g) - λ × SwitchCost(g)` where SwitchCost = 0 if `g === previousDomain` or `previousDomain === null`, else 1. Select `Domain* = argmax_g Score(f,g)`.
  - [x] 3.5: **Cold start handling:** If metrics map is empty (no evidence), pick from `GREETING_SEED_POOL[seedIndex % GREETING_SEED_POOL.length]` for deterministic rotation
  - [x] 3.5: Generate natural language steering hint: `"Bridge from [user context] to [targetDomain] — explore [targetFacet description]"`
  - [x] 3.6: Return `SteeringTarget` — `{ targetFacet, targetDomain, steeringHint }`

- [x] Task 4: Helper functions (AC: #1, #2)
  - [x] 4.1: `computeContextWeight(confidences: number[]): number` — `√(Σ c_i)` for a domain group
  - [x] 4.2: `computeContextMean(scores: number[], confidences: number[]): number` — `Σ(c_i × x_i) / Σ(c_i)` with epsilon safety for zero denominator
  - [x] 4.3: `computeNormalizedEntropy(weights: number[]): number` — `-Σ(p_g × ln(p_g)) / ln(|G|)` with safety: skip zero-weight domains (0 × ln(0) → 0 by convention), single non-zero domain → return 0, all zero → return 0
  - [x] 4.4: `computeProjectedEntropy(currentWeights: Map<LifeDomain, number>, targetDomain: LifeDomain, deltaW: number): number` — recomputes normalized entropy with hypothetical updated weight for the target domain (used in ΔP gain calculation)
  - [x] 4.5: Export all helpers from domain barrel for reuse in finalization (Story 11.4): `computeContextWeight`, `computeContextMean`, `computeNormalizedEntropy`, `computeProjectedEntropy`

- [x] Task 5: Unit tests — `packages/domain/src/utils/__tests__/formula.test.ts` (AC: #4)
  - [x] 5.1: **Bounds** — every output within documented range: score 0-20, confidence 0-C_max, power 0-1
  - [x] 5.2: **Monotonicity** — more evidence → higher confidence (never decreases)
  - [x] 5.3: **Saturation** — confidence approaches C_max asymptotically, never exceeds
  - [x] 5.4: **Single evidence** — works with 1 evidence item, no division by zero
  - [x] 5.5: **Empty evidence** — returns defaults (SCORE_MIDPOINT=10, 0 confidence, 0 power)
  - [x] 5.6: **All-same-domain** — signal power low (entropy ≈ 0)
  - [x] 5.7: **Perfectly balanced domains** — signal power high (entropy ≈ 1)
  - [x] 5.8: **Switch cost** — same domain penalized less than domain change
  - [x] 5.9: **Cold start** — empty metrics returns greeting seed
  - [x] 5.10: **Facet priority tiebreaker** — when all above target, lowest confidence wins
  - [x] 5.11: **Domain gain** — empty domain has higher ΔP than saturated domain
  - [x] 5.12: **Multi-facet scenario** — realistic 10+ evidence records across multiple facets and domains
  - [x] 5.13: **Config override** — custom config values produce different results vs FORMULA_DEFAULTS

- [x] Task 6: Export from domain barrel (AC: #3)
  - [x] 6.1: Add to `packages/domain/src/index.ts`: `FORMULA_DEFAULTS`, `FormulaConfig`, `FacetMetrics`, `SteeringTarget`, `computeFacetMetrics`, `computeSteeringTarget`, `computeContextWeight`, `computeContextMean`, `computeNormalizedEntropy`, `computeProjectedEntropy`, `GREETING_SEED_POOL`

## Dev Notes

### This is a Pure Domain Story — No Infrastructure, No API Changes

Everything lives in `packages/domain/src/utils/formula.ts` with unit tests. No repository interfaces, no infrastructure implementations, no handler changes, no use-case changes. The send-message pipeline integration happens in Story 10.4.

### Critical Formulas Reference

**Facet Score — Context-weighted mean with √ anti-redundancy:**
```
Step 1: μ_g = Σ(c_i × x_i) / Σ(c_i)     (weighted mean per domain)
Step 2: w_g = √(Σ c_i)                     (anti-redundancy context weight)
Step 3: S_f = Σ(w_g × μ_g) / Σ(w_g)       (final facet score, 0-20)
```

**Facet Confidence — Exponential saturation:**
```
W = Σ_g(w_g)                                (total diversified evidence mass)
C_f = C_max × (1 - e^{-k × W})            (0 to C_max, monotonic, saturating)
```

**Signal Power — Cross-context robustness:**
```
p_g = w_g / Σ_h(w_h)                       (context distribution)
D = -Σ(p_g × ln(p_g)) / ln(|G|)            (normalized entropy, 0-1)
V = 1 - e^{-betaVolume × W}                 (volume saturation, betaVolume ≈ k)
P_f = V × D                                (signal power, 0-1)
```

**Steering — Facet Priority → Domain Selection:**
```
FacetPriority_f = α(C_target - C_f)+ + β(P_target - P_f)+
f* = argmax_f(FacetPriority_f)

For target facet f*, for each steerable domain g:
  Δw_g ≈ √(w_{f,g}² + c̄) - w_{f,g}
  W' = W_f + Δw_g
  V' = 1 - e^{-betaVolume × W'}
  D' = recomputed entropy with updated w_{f,g}
  ΔP(f,g) = V' × D' - V_f × D_f

Score(f,g) = ΔP(f,g) - λ × SwitchCost(g)
Domain* = argmax_g Score(f,g)
```

### "other" Domain in Formulas

The `other` domain participates fully in w_g computation, entropy D, and signal power P_f — it IS real evidence mass. However, `other` is **excluded from steering target domain selection** (use `STEERABLE_DOMAINS` from `life-domain.ts`).

### FORMULA_DEFAULTS Values

```typescript
export const FORMULA_DEFAULTS = Object.freeze({
  C_max: 0.9,       // Maximum reachable confidence
  k: 0.7,           // Confidence saturation speed
  C_target: 0.75,   // Target confidence for steering
  P_target: 0.5,    // Target signal power for steering
  alpha: 1.0,       // Confidence gap weight in facet priority
  beta: 0.8,        // Signal power gap weight in facet priority
  eta: 0.3,         // Zero-evidence context boost (unused in ΔP approach, kept for reference)
  lambda: 0.1,      // Switch cost penalty (range 0.05-0.15)
  cBar: 0.5,        // Expected average confidence of next evidence
  epsilon: 1e-10,   // Division safety margin
  betaVolume: 0.7,  // Volume saturation speed (≈ k)
  SCORE_MIDPOINT: 10, // Default score for facets with no evidence (bipolar scale center)
}) satisfies FormulaConfig;
```

### EvidenceInput Type Already Exists

`packages/domain/src/types/evidence.ts` — interface with `bigfiveFacet`, `score` (0-20), `confidence` (0-1), `domain` (LifeDomain). NO changes needed.

### Key Domain Constants Already Exist

- `FacetName` and `ALL_FACETS` (30 facets): `packages/domain/src/constants/big-five.ts`
- `LifeDomain`, `LIFE_DOMAINS` (6 domains), `STEERABLE_DOMAINS` (5 domains): `packages/domain/src/constants/life-domain.ts`
- `DomainDistribution` and `aggregateDomainDistribution`: `packages/domain/src/utils/domain-distribution.ts`
- `EvidenceInput`: `packages/domain/src/types/evidence.ts`

### Entropy Edge Cases

- **Zero weights:** If all w_g = 0 (no evidence), entropy is undefined → return 0
- **Single non-zero domain:** p_g = 1, ln(1) = 0, entropy = 0 → low signal power (expected: single domain = low diversity)
- **Perfectly balanced N domains:** entropy = ln(N)/ln(N) = 1 → maximum signal power
- **ln(0) protection:** Skip domains with w_g = 0 when computing entropy; they contribute 0 to the sum (0 × ln(0) → 0 by convention)

### Switch Cost Behavior

- Same domain → SwitchCost = 0 → stays 1-2 turns naturally
- Different domain → needs ΔP > λ (0.1) to justify switch
- Empty domain → ΔP typically 0.2-0.4 → easily overcomes λ=0.1
- Slightly underrepresented domain → ΔP might be 0.08 → doesn't overcome λ=0.1 → stays put

### Cold Start Greeting Seed Pool

```typescript
export const GREETING_SEED_POOL = [
  { domain: "leisure", facet: "imagination" },
  { domain: "relationships", facet: "gregariousness" },
  { domain: "work", facet: "achievement_striving" },
  { domain: "solo", facet: "self_consciousness" },
  { domain: "family", facet: "altruism" },
] as const satisfies readonly { domain: LifeDomain; facet: FacetName }[];
```

When no evidence exists, `computeSteeringTarget` picks from this pool. The caller (send-message use-case in Story 10.4) passes a seed index (e.g., `messageCount % GREETING_SEED_POOL.length`) for deterministic rotation.

### Project Structure Notes

- Single file: `packages/domain/src/utils/formula.ts` — all functions + config + types
- Test file: `packages/domain/src/utils/__tests__/formula.test.ts`
- No infrastructure layer changes
- No API handler changes
- No use-case changes (integration is Story 10.4)
- Barrel export additions in `packages/domain/src/index.ts`

### Previous Story Intelligence (Story 10.2)

- `DomainDistribution` type and `aggregateDomainDistribution` already exist in domain utils (Story 10.2)
- Domain tests use `@effect/vitest` with `describe`/`expect`/`it` from there
- Infrastructure package now has `@anthropic-ai/sdk` — not relevant for this pure domain story
- Relative imports used in domain package tests (not `@workspace/domain` self-referencing)
- 625+ domain tests currently passing

### Testing Pattern for Domain Utils

Follow the pattern from `packages/domain/src/utils/__tests__/domain-distribution.test.ts`:
```typescript
import { describe, expect, it } from "@effect/vitest";
// Direct relative imports — no @workspace/domain self-reference
import { computeFacetMetrics, FORMULA_DEFAULTS } from "../formula";
```

No `vi.mock()` needed — these are pure functions with no dependencies to mock.

### Files to Create

| File | Purpose |
|------|---------|
| `packages/domain/src/utils/formula.ts` | All formula functions + FORMULA_DEFAULTS + types + GREETING_SEED_POOL |
| `packages/domain/src/utils/__tests__/formula.test.ts` | Comprehensive unit tests (13+ test cases) |

### Files to Modify

| File | Change |
|------|--------|
| `packages/domain/src/index.ts` | Add exports: FORMULA_DEFAULTS, FormulaConfig, FacetMetrics, SteeringTarget, computeFacetMetrics, computeSteeringTarget, computeContextWeight, computeContextMean, computeNormalizedEntropy, GREETING_SEED_POOL |

### Files NOT to Modify

- `packages/domain/src/types/evidence.ts` — EvidenceInput already correct
- `packages/domain/src/constants/life-domain.ts` — STEERABLE_DOMAINS already exists
- `packages/domain/src/constants/big-five.ts` — ALL_FACETS already correct
- `packages/domain/src/utils/domain-distribution.ts` — already correct
- `apps/api/src/use-cases/send-message.use-case.ts` — integration is Story 10.4
- Any infrastructure files — this is a pure domain story

### Git Intelligence

Recent commits:
- `3fa3832 feat(story-10-2): ConversAnalyzer Haiku analysis on every message (#69)`
- `d9c2005 feat(story-10-1): conversation evidence schema and repository (#68)`
- Branch naming: `feat/story-10-3-formula-functions-facet-metrics-and-steering-target`
- Commit format: `feat(story-10-3): description`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3] — Story acceptance criteria and technical requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-3] — Scoring formulas (lines 139-172)
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-4] — Steering algorithm (lines 173-235)
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-13] — ADR: Formula-driven context selection
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-39] — Formula module pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-41] — Formula test categories
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-42] — Formula parameters table
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-44] — Cold start formula handling
- [Source: packages/domain/src/types/evidence.ts] — EvidenceInput type
- [Source: packages/domain/src/constants/life-domain.ts] — LIFE_DOMAINS, STEERABLE_DOMAINS
- [Source: packages/domain/src/constants/big-five.ts] — ALL_FACETS, FacetName
- [Source: packages/domain/src/utils/domain-distribution.ts] — DomainDistribution, aggregateDomainDistribution
- [Source: _bmad-output/implementation-artifacts/10-2-conversanalyzer-haiku-analysis-on-every-message.md] — Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 6 tasks completed: FormulaConfig type, FORMULA_DEFAULTS (Object.freeze), FacetMetrics/SteeringTarget types, GREETING_SEED_POOL
- `computeFacetMetrics`: groups evidence by facet→domain, computes context-weighted mean with √ anti-redundancy, exponential saturation confidence, signal power via normalized entropy
- `computeSteeringTarget`: 3-step algorithm — facet priority (argmax with tiebreaker), domain selection via projected ΔP gain, switch cost penalty. Cold start returns from rotating GREETING_SEED_POOL
- 4 exported helper functions: computeContextWeight, computeContextMean, computeNormalizedEntropy, computeProjectedEntropy
- `FacetMetrics` includes `domainWeights: ReadonlyMap<LifeDomain, number>` — enables exact ΔP computation in steering (not approximated)
- 28 unit tests covering all 13 specified test categories — bounds, monotonicity, saturation, edge cases, cold start, tiebreaker, config override, plus domain weight correctness and exact steering
- All 1040 tests pass (647 domain + 193 api + 200 frontend), zero regressions
- Lint clean on all new files

### Change Log

- 2026-02-23: Story 10.3 implementation complete — all formula functions, types, constants, and 34 unit tests (28 main + 6 numerical verification)
- 2026-02-23: Code review fixes — removed `switchCostPenalty` from FormulaConfig (H1), fixed File List (M1), clarified AC #5 empty evidence semantics (M2)

### File List

- `packages/domain/src/utils/formula.ts` (NEW) — FormulaConfig, FORMULA_DEFAULTS, FacetMetrics, SteeringTarget, GREETING_SEED_POOL, computeFacetMetrics, computeSteeringTarget, computeContextWeight, computeContextMean, computeNormalizedEntropy, computeProjectedEntropy
- `packages/domain/src/utils/__tests__/formula.test.ts` (NEW) — 28 unit tests across 13 categories
- `packages/domain/src/utils/__tests__/formula-numerical.test.ts` (NEW) — 6 numerical verification tests against hand-computed example
- `packages/domain/src/index.ts` (MODIFIED) — added formula exports
