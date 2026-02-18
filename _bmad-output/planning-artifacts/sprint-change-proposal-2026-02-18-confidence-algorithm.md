# Sprint Change Proposal — Confidence Algorithm Redesign (Redundancy-Adjusted Saturation Curve)

**Date:** 2026-02-18
**Triggered by:** Observed that a single evidence item with 90% individual confidence inflates facet confidence to 90%, which is statistically incorrect
**Scope:** Minor (algorithm replacement within existing pure function, no schema/API changes)
**Status:** Approved (2026-02-18)

---

## 1. Issue Summary

The current confidence algorithm in `packages/domain/src/utils/scoring.ts` (`aggregateFacet` function, lines 63-108) computes facet confidence as the **mean of individual evidence confidences** with a flat -30 penalty for high variance (contradictions).

**The problem:** A single evidence item with 90% confidence gives the facet a confidence score of 90%. This is wrong because:

- **One observation ≠ high certainty.** You cannot be 90% confident about a personality facet from a single data point regardless of how clear that one signal was.
- **Number of evidence items should drive confidence.** Few observations → low confidence, many observations → high confidence.
- **Current formula conflates signal strength with certainty.** The analyzer's confidence (how clearly this one message signals a facet) is not the same as the system's confidence (how well we've characterized this facet overall).

**Proposed fix:** Replace the current mean-based confidence calculation with a **redundancy-adjusted exponential saturation curve** from `confidence-algo.md`:

```
E_eff = Σ(c_i) / (1 + ρ(n - 1))    # Redundancy-adjusted evidence mass
C_f = C_max × (1 - e^(-k × E_eff))   # Saturating confidence curve
```

Where `ρ = 0.5` (redundancy), `C_max = 90` (max confidence on 0-100 scale), `k = 0.7` (saturation speed).

**Key behavioral differences:**

| Scenario | Current | Proposed |
|----------|---------|----------|
| 1 evidence at 90% confidence | **90%** | **~42%** |
| 3 evidence at 80% confidence | **80%** (or 50% if contradictory) | **~67%** |
| 5 evidence at 70% confidence | **70%** | **~76%** |
| 10 evidence at 80% confidence | **80%** | **~85%** |

The new algorithm naturally rewards evidence breadth and penalizes over-reliance on few observations.

---

## 2. Impact Analysis

### Epic Impact

**Epic 2 (Assessment Backend):** Primary impact
- Story 2.9 (`scoring.ts`): `aggregateFacet` function must be rewritten — confidence calculation only, score calculation stays unchanged
- Story 2.11 (steering): Outlier detection (`getSteeringTarget` in `orchestrator.nodes.ts`) uses facet confidence for `mean - stddev` comparison. **Still works** — the algorithm compares relative values, not absolute thresholds. With the new formula, early-conversation facets will have lower confidence (more room for outliers), which actually improves steering accuracy by making outlier detection more meaningful.

**Epic 5 (Results & Profile):** Display impact — threshold recalibration may be needed
- `DetailZone.tsx` `getSignalBadge()`: Uses thresholds `>=70` (Strong), `>=40` (Moderate), `<40` (Weak). The new max is 90% and well-assessed facets reach 70%+ with ~5 high-quality evidence items, so thresholds remain reasonable.
- `TraitCard.tsx`: `isLowConfidence = confidence < 40`. Single-evidence facets will be ~42% under the new formula, which is correct behavior — one observation is borderline "moderate" rather than firmly confident.
- `ConfidenceRingCard.tsx`: Overall confidence will start lower and climb more gradually. This is actually better UX — it gives a truer picture of assessment progress.

**Epic 8 (Results Content):** No direct impact
- Portrait generation includes confidence in prompt context — lower/higher values don't change generation quality.

**No epics added, removed, or resequenced.**

### Artifact Conflicts

| Artifact | Status | Details |
|----------|--------|---------|
| PRD | No conflict | PRD specifies "confidence metric" without mandating a formula |
| Architecture | No conflict | Confidence remains 0-100 integer, same types, same data flow |
| UI/UX | Minor semantic shift | Confidence values more conservative (lower with less evidence, capped at 90). More honest — no redesign needed |
| Contracts/API | No change | `FacetScore.confidence` stays `number` (0-100 integer) |
| Database | No change | Confidence computed on-demand from evidence (Story 2.9 design). No stored values to migrate |

### Technical Impact

**Files requiring modification (2 files):**

| File | Change |
|------|--------|
| `packages/domain/src/utils/scoring.ts` | Replace confidence calculation in `aggregateFacet` (lines 89-102). Keep score calculation (weighted average) unchanged. |
| `packages/domain/src/utils/__tests__/scoring.test.ts` | Update test expectations for new confidence values. Replace variance/contradiction tests with saturation behavior tests. |

**Files requiring verification (no code changes expected):**

| File | Verify |
|------|--------|
| `packages/infrastructure/src/repositories/orchestrator.nodes.ts` | Steering still works with new confidence distribution (relative comparison) |
| `packages/infrastructure/src/repositories/__tests__/orchestrator.nodes.test.ts` | Test fixtures may need confidence value adjustments |
| `apps/front/src/components/results/DetailZone.tsx` | Signal badge thresholds still appropriate |
| `apps/front/src/components/results/DetailZone.test.tsx` | Test expectations for signal badges may need adjustment |
| `apps/front/src/components/results/TraitCard.tsx` | Low confidence threshold (40) still appropriate |
| `packages/domain/src/utils/confidence.ts` | `calculateConfidenceFromFacetScores` just averages — still works |

---

## 3. Recommended Approach

**Selected path: Direct Adjustment** — modify the `aggregateFacet` function in `scoring.ts`.

**Rationale:**
- The change is isolated to a single pure function with zero infrastructure dependencies
- Evidence-sourced scoring (Story 2.9) means NO database migrations or backfills — scores are computed on-demand
- The function signature stays identical: `(evidence: SavedFacetEvidence[]) => FacetScore`
- All downstream consumers (steering, frontend, portrait) consume the same `FacetScore` type
- The new formula is deterministic, well-documented, and has clear hyperparameters

**Alternatives considered:**

| Option | Why Not Selected |
|--------|-----------------|
| Rollback | Nothing to roll back — this is a formula bug, not a failed approach |
| MVP review | Not needed — the change is surgical and additive |
| Hybrid (keep variance penalty + add saturation) | Unnecessary complexity. The redundancy coefficient (ρ) already handles correlated signals, making the variance-based contradiction penalty redundant. The saturation curve itself prevents confidence inflation from repeated observations |

**Effort:** Low
**Risk:** Low — pure function replacement with comprehensive tests
**Timeline impact:** None — self-contained change within the domain package

---

## 4. Detailed Change Proposals

### 4.1 Replace confidence calculation in `aggregateFacet`

**File:** `packages/domain/src/utils/scoring.ts`
**Function:** `aggregateFacet` (lines 63-108)

**OLD (lines 89-102):**
```typescript
// Calculate average confidence (work with 0-100 integers)
const confidences = sorted.map((e) => e.confidence);
const avgConfidence = mean(confidences);

// Adjust confidence based on variance and sample size (0-100 scale)
let adjustedConfidence = avgConfidence;

// High variance (>15) indicates contradictions -> lower confidence
if (varianceValue > 15) {
    adjustedConfidence -= 30; // -30 points on 0-100 scale
}

// Clamp to 0-100 integer range
adjustedConfidence = Math.round(clamp(adjustedConfidence, 0, 100));
```

**NEW:**
```typescript
// --- Confidence via redundancy-adjusted saturation curve ---
// See confidence-algo.md for derivation and properties.
//
// Properties:
// - Monotonic: more evidence → confidence always increases
// - Diminishing returns: each additional signal contributes less
// - Capped: confidence never reaches C_MAX (no absolute certainty)
// - Redundancy-aware: correlated signals contribute less than diverse ones
const RHO = 0.5;    // Redundancy coefficient (0 = independent, 1 = fully redundant)
const C_MAX = 90;   // Maximum reachable confidence (0-100 scale)
const K = 0.7;      // Saturation speed (well-covered ≈ 3 effective evidence)

// Step 1: Sum individual evidence confidences (normalized to 0-1)
const rawEvidenceMass = sorted.reduce((acc, e) => acc + e.confidence / 100, 0);

// Step 2: Adjust for redundancy — additional similar signals contribute less
// First evidence has full impact; each additional is discounted by ρ
const effectiveEvidence = rawEvidenceMass / (1 + RHO * (sorted.length - 1));

// Step 3: Map to confidence via saturating exponential
const adjustedConfidence = Math.round(C_MAX * (1 - Math.exp(-K * effectiveEvidence)));
```

**What stays the same:**
- Score calculation (weighted average with recency bias) — **unchanged**
- Function signature — **unchanged** (`(evidence: SavedFacetEvidence[]) => FacetScore`)
- Return type — **unchanged** (`{ score: number, confidence: number }`)
- **Trait confidence** (`deriveTraitScores`) — **unchanged**. Trait confidence remains `mean(assessed facet confidences)`. The saturation curve applies ONLY at the facet level (evidence → facet). Trait-level aggregation is a simple average of its 6 constituent facet confidences.

**What changes:**
- Confidence derivation replaces mean + variance penalty with saturation curve
- `variance()` function is no longer called for confidence (still exists for potential future use)
- The result range shifts from 0-100 to 0-90 (C_MAX cap)

### 4.2 Update scoring tests

**File:** `packages/domain/src/utils/__tests__/scoring.test.ts`

**Replace** the "variance and contradiction detection" test block (lines 99-138) with saturation behavior tests:

```typescript
describe("saturation curve confidence", () => {
    it("single evidence produces moderate confidence, not the evidence's own confidence", () => {
        const evidence = [createEvidence("imagination", 16, 90)];
        const result = aggregateFacetScores(evidence);
        // 1 evidence at 90% → E_eff = 0.9 → C = 90 * (1 - e^(-0.63)) ≈ 42
        expect(result.imagination.confidence).toBeGreaterThan(35);
        expect(result.imagination.confidence).toBeLessThan(50);
    });

    it("confidence increases monotonically with more evidence", () => {
        const evidence1 = [createEvidence("imagination", 15, 80)];
        const evidence3 = createEvidenceSequence("imagination", [
            { score: 15, confidence: 80 },
            { score: 14, confidence: 75 },
            { score: 16, confidence: 85 },
        ]);
        const evidence6 = createEvidenceSequence("imagination", [
            { score: 15, confidence: 80 },
            { score: 14, confidence: 75 },
            { score: 16, confidence: 85 },
            { score: 15, confidence: 70 },
            { score: 14, confidence: 80 },
            { score: 16, confidence: 75 },
        ]);

        const r1 = aggregateFacetScores(evidence1);
        const r3 = aggregateFacetScores(evidence3);
        const r6 = aggregateFacetScores(evidence6);

        expect(r3.imagination.confidence).toBeGreaterThan(r1.imagination.confidence);
        expect(r6.imagination.confidence).toBeGreaterThan(r3.imagination.confidence);
    });

    it("confidence never exceeds C_MAX (90)", () => {
        // 20 evidence items at max confidence
        const evidence = createEvidenceSequence(
            "imagination",
            Array.from({ length: 20 }, () => ({ score: 15, confidence: 100 })),
        );
        const result = aggregateFacetScores(evidence);
        expect(result.imagination.confidence).toBeLessThanOrEqual(90);
    });

    it("confidence is zero when no evidence exists", () => {
        const result = aggregateFacetScores([]);
        expect(result.imagination.confidence).toBe(0);
    });

    it("low individual confidence produces lower facet confidence", () => {
        const highConf = [createEvidence("imagination", 15, 90)];
        const lowConf = [createEvidence("artistic_interests", 15, 30)];

        const result = aggregateFacetScores([...highConf, ...lowConf]);

        expect(result.imagination.confidence).toBeGreaterThan(result.artistic_interests.confidence);
    });
});
```

**Update** other affected test expectations:
- **Single facet evidence test** (line 70): `expect(result.imagination.confidence).toBe(80)` → update to match new formula output for 1 evidence at confidence 80
- **Confidences in valid range test** (line 179): Upper bound changes from 100 to 90

### 4.3 Verify downstream consumers

**Steering tests** (`orchestrator.nodes.test.ts`): Verify test fixtures produce meaningful outlier detection with the new confidence distribution. The `getSteeringTarget` function uses relative comparison (`confidence < mean - stddev`), which should work with any distribution.

**Frontend signal badge** (`DetailZone.tsx`): The `getSignalBadge` function uses evidence-level confidence (0-100 from analyzer), NOT aggregated facet confidence. This function is called per-evidence-item, displaying the analyzer's individual signal strength. **No change needed.**

---

## 5. Implementation Handoff

**Scope classification: Minor** — Direct implementation by development team.

**Deliverables:**
1. Modified `aggregateFacet` function in `scoring.ts`
2. Updated and expanded `scoring.test.ts`
3. Verified steering and frontend tests

**No new stories required** — this is a surgical algorithm fix within an existing function.

**Success criteria:**
1. `aggregateFacet` uses the redundancy-adjusted saturation curve formula
2. Single evidence at 90% confidence → facet confidence ~42 (not 90)
3. Confidence is monotonically increasing with more evidence
4. Confidence never exceeds 90 (C_MAX)
5. All existing tests updated to match new confidence values
6. New tests added for saturation behavior
7. Steering tests pass (relative outlier detection unaffected)
8. `pnpm test:run` passes across all packages
9. No API contract, database schema, or frontend component changes

**Implementation order:**
1. Modify `aggregateFacet` in `scoring.ts` (confidence calculation only)
2. Update `scoring.test.ts` (fix expectations, replace variance tests with saturation tests)
3. Run `pnpm test:run` to catch any downstream test breakage
4. Fix any broken test fixtures (steering tests, frontend tests if confidence expectations are hardcoded)
5. Manual verification: run a test assessment and confirm results page confidence values look reasonable

---

## Checklist Status

| Section | Status |
|---------|--------|
| 1. Trigger & Context | [x] Done |
| 2. Epic Impact | [x] Done |
| 3. Artifact Conflicts | [x] Done — no conflicts |
| 4. Path Forward | [x] Done — Direct Adjustment selected |
| 5. Proposal Components | [x] Done |
| 6. Final Review | [x] Approved by Vincentlay (2026-02-18) |

---

*Generated by Correct Course workflow — 2026-02-18*
