# Problem Solving Session: E_target Spec Readiness Check

**Date:** 2026-03-10
**Problem Solver:** Vincentlay
**Problem Category:** Spec coherence / implementation readiness

---

## PROBLEM DEFINITION

### Initial Problem Statement

The E_target formula spec (`problem-solution-2026-03-07.md`) was written on 2026-03-07. The authoritative design decisions document (`conversation-pacing-design-decisions.md`) has been updated through 2026-03-10, adding Decisions 11-13 (Territory Catalog, Move Governor, Prompt Builder). The decisions doc marks the E_target spec as "Current" — but is it actually ready for implementation given everything that has evolved since?

### Refined Problem Statement

**Determine whether the E_target spec is implementation-ready** by checking:
- Does every claim in the spec align with Decisions 1-13 in the authoritative doc?
- Does the spec's interface contract (inputs, output, downstream consumers) match the pipeline architecture that emerged in Decisions 11-13?
- Are there any adversarial review findings that represent genuine coherence gaps vs. intentional deferrals?

### Problem Context

- **Authoritative doc:** `conversation-pacing-design-decisions.md` (last updated 2026-03-10, 13 decisions)
- **Spec under review:** `problem-solution-2026-03-07.md` (E_target formula, written 2026-03-07)
- **Decisions the spec claims to implement:** Decisions 1-3, 10
- **Decisions added after the spec was written:** Decision 11 (Territory Catalog), Decision 12 (Move Governor), Decision 13 (Prompt Builder)
- **Coherence status per decisions doc:** "Current"
- **Adversarial review:** 12 findings produced in prior session, used as input alongside direct cross-referencing

### Success Criteria

1. Every spec claim cross-referenced against Decisions 1-13
2. Downstream interface verified against the Scorer → Selector → Governor pipeline (Decisions 11-12)
3. Each adversarial finding classified: coherence gap / intentional deferral / out of scope
4. Clear verdict: spec is ready, needs updates, or needs rework

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

| Dimension | IS (in scope) | IS NOT (out of scope) |
|-----------|--------------|----------------------|
| **What we're checking** | E_target spec vs. authoritative decisions doc (Decisions 1-13) | Whether the formula itself is mathematically optimal |
| **Which decisions** | All 13 decisions, including D11-13 added after the spec was written | Only Decisions 1-3, 10 (the spec's self-declared scope) |
| **What counts as a gap** | Spec contradicts or is missing something the decisions doc requires | Spec doesn't cover something the decisions doc defers to other specs |
| **Readiness means** | An implementer can build from this spec without hitting contradictions | The entire pipeline is ready to build end-to-end |

### Cross-Reference: Spec vs. All 13 Decisions

| Decision | Spec Alignment | Notes |
|----------|---------------|-------|
| D1: Self-Discovery First | Aligned | Spec's core principle is user-state-pure, no assessment state |
| D2: Energy x Telling | Aligned | E(n) [0-10], T(n) [0-1], drain derived, coverage excluded |
| D3: E_target User-State-Pure | Aligned | 7-step pipeline matches exactly — every constant, every function shape |
| D4: Four Move Types | Outdated language | Spec says "territory policy selects move type (Pull/Bridge/Hold/Pivot)" — D12 reframed as Governor computing entry pressure; move types are vocabulary only |
| D5: Contradiction gating | N/A | Not relevant to E_target |
| D6: Noticing | N/A | Not relevant to E_target |
| D7: 25 exchanges | Aligned | Spec correctly notes as context, excludes from formula |
| D8: End on Aliveness | Aligned | Late-session bias in territory scoring, not E_target |
| D9: Portrait Readiness silent | Aligned | Explicitly excluded from E_target |
| D10: Validate with real users | Aligned | V1 defaults, calibration deferred |
| D11: Territory Catalog | Scale gap unaddressed | Catalog uses expectedEnergy 0-1 scale (0.20-0.72). E_target outputs 0-10. Spec's implementation plan doesn't mention conversion. |
| D12: Move Governor | Outdated pipeline | Spec refers to monolithic "territory policy" and "move generator." D12 decomposed into Scorer → Selector → Governor, each consuming E_target differently. |
| D13: Prompt Builder | Outdated reference | Spec says "move generator produces Nerin's prompt instructions." D13 assigns this to the Prompt Builder via three-tier composition. |

### Adversarial Finding Classification

| # | Finding | Classification | Rationale |
|---|---------|---------------|-----------|
| 1 | No telling extraction method | Out of scope | Resolved in separate spec (energy-telling-extraction) |
| 2 | Trust derivative discontinuity at T=0.5 | Intentional deferral | D10: calibrate with data. Math observation, not coherence gap |
| 3 | No numerical archetype traces | Spec quality issue | Not a coherence gap — but weakens implementer confidence |
| 4 | EMA init biases cold start | Addressed | D3 explicitly says "init at 5.0". Both docs agree |
| 5 | Comfort=E_base=5.0 coincidence | Valid observation, no gap | Both docs use these values consistently and intentionally |
| 6 | Drain ignores temporal pacing | Intentional deferral | D10: validate with real users |
| 7 | No persistent divergence detection | Out of scope | Territory Scorer's concern via energyMalus |
| 8 | Cliff at comfort=5.0 in cost function | By design | Auth doc says "only energy above comfort counts" — cliff is structural |
| 9 | Trivial alpha asymmetry | Intentional | V1 defaults, per D10 |
| 10 | No interface contract for downstream | **Coherence gap** | Spec describes monolithic "territory policy." D11-12 decomposed into 3 layers with different E_target consumption patterns |
| 11 | No statistical power analysis | Out of scope | Valid methodology concern, not coherence |
| 12 | E_s persistence/staleness | Implementation concern | Spec addresses in Step 3, not a coherence gap |

### Root Cause Analysis

**The formula is fully coherent. The implementation plan is stale.**

The E_target spec was written on 2026-03-07, the same day as the initial design decisions document. The formula specification (pipeline steps 1-7, constants, function shapes) maps perfectly to Decision 3 — in fact, Decision 3 was clearly written *from* this spec. No coherence issues exist in the mathematical core.

However, the spec's Implementation Plan (Section 5, Steps 4 and 7) describes downstream wiring using a pre-Decision-11/12/13 mental model:
- "Pass E_target to territory policy" — there is no monolithic territory policy; the Scorer, Selector, and Governor each consume E_target differently
- "Territory policy selects a territory that matches E_target AND fills coverage gaps" — the Scorer ranks via unified formula, the Selector picks via deterministic rules
- "Move generator receives the selected territory + E_target" — this is now the Governor, which outputs PromptBuilderInput
- The 0-1 vs 0-10 scale relationship between E_target and territory expectedEnergy is unaddressed

### Contributing Factors

- The spec was written before the territory pipeline was decomposed (D11-12 resolved 2026-03-08 through 2026-03-09)
- The decisions doc marked the spec as "Current" based on formula correctness, not implementation plan freshness
- The implementation plan was written as forward-looking guidance, not as a binding contract — but an implementer might read it as such

### System Dynamics

The E_target spec occupies the upstream-most position in the pipeline. Its formula is consumed by two downstream layers:
1. **Territory Scorer** — uses E_target to compute `energyMalus = (E_target/10 - territory.expectedEnergy)^2` (quadratic penalty, inferred from D11's continuous expectedEnergy + D12's architecture summary)
2. **Move Governor** — uses gap between E_target and selected territory's expectedEnergy to derive `entryPressure: "direct" | "angled" | "soft"` (D12)

The spec's formula output (E_target in [0, 10]) is correct and sufficient for both consumers. The implementation plan just doesn't know about them yet.

---

## VERDICT AND RESOLUTION

### Verdict

**The E_target spec is implementation-ready after targeted edits to the implementation plan.**

- **Formula (Steps 1-7, constants, function shapes, archetype simulations):** Fully coherent with Decision 3. No changes needed. An implementer can build `computeETarget()` directly from this spec.
- **Implementation plan:** Required 4 edits to align with Decisions 11-13. **Applied 2026-03-10.**

### Edits Applied

| Location | Change | Reason |
|----------|--------|--------|
| §4 "Wire into policy layer" | Replaced with "Wire into steering pipeline" — specifies Scorer and Governor as distinct E_target consumers, documents 0-10 → 0-1 scale conversion | D11-12 decomposed monolithic territory policy |
| §7 "Territory policy redesign" | Replaced with "Downstream pipeline (resolved separately)" — references all 4 downstream specs | Pipeline design is no longer an open question |
| Milestones M1, M3, M4 | M1 marked done, M3/M4 updated to reflect resolved pipeline | Reflect current state |
| Responsible parties M4 | Updated from "territory policy update" to "pipeline integration" | Terminology alignment |

### Adversarial Review Summary

12 findings reviewed. 1 genuine coherence gap (finding #10 — missing downstream interface contract). Resolved by the edits above. Remaining 11 findings: 4 intentional deferrals per Decision 10, 4 out of scope (resolved in other specs), 2 addressed/by-design, 1 spec quality issue (missing numerical archetype traces — not a blocker).

### Remaining Spec Quality Notes (Non-Blocking)

- **Finding #3 (no numerical archetype traces):** The spec claims 10 archetypes PASS but shows only qualitative verdicts. Adding turn-by-turn numbers would strengthen implementer confidence and serve as test fixtures. This is a quality enhancement, not a coherence issue.
- **Finding #2 (trust derivative discontinuity at T=0.5):** Worth monitoring during calibration (Decision 10) but not a spec defect.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
