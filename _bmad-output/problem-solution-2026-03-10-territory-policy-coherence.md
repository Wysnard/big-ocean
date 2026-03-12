# Problem Solving Session: Territory Policy Spec Coherence Audit

**Date:** 2026-03-10
**Problem Solver:** Vincentlay
**Problem Category:** Architecture Coherence / Pre-Implementation Audit

---

## PROBLEM DEFINITION

### Initial Problem Statement

The territory policy spec (`problem-solution-2026-03-07-territory-policy.md`) was written on 2026-03-07 as the first territory policy design. Since then, three subsequent specs and four new design decisions have evolved the architecture:

- **Territory Catalog Migration** (03-08) — expanded from 22 to 25 territories
- **Territory Selector** (03-09) — refined the selector contract, added `sessionPhase`, renamed fields
- **Move Governor** (03-09) — reframed the move generator as a thin restraint layer
- **Decision 11** — Territory catalog as architecture
- **Decision 12** — Move Governor reframe (3 decisions, `PromptBuilderInput` discriminated union)
- **Decision 13** — Three-tier contextual prompt composition

The territory policy spec has a coherence note about the "move generator → governor" reframe, but the downstream implications go far deeper than terminology. Before implementation, we need to know exactly what's still current, what's outdated, and what contradicts.

### Refined Problem Statement

**Systematic coherence audit of the territory policy spec against the design decisions document (Decisions 1-13) and sibling specs, across four dimensions: architectural coherence, terminological drift, contract coherence, and decision alignment. Output: a ranked issue catalog with severity, implementation impact, and recommended resolution for each finding.**

### Problem Context

The territory policy spec is the **foundational territory policy document** — it defines the scorer formula, the three-layer decomposition, and the implementation plan. All subsequent specs (selector, governor, prompt builder) build on it. If this document contains incoherencies that an implementer follows, the result will be contract mismatches, wrong API shapes, and wasted work.

**Documents under analysis:**

| Document | Date | Role |
|----------|------|------|
| **Territory Policy Spec** (subject) | 03-07 | Foundational territory policy design: scorer formula, 5 terms, three-layer architecture |
| **Conversation Pacing Design Decisions** (reference) | 03-07, updated 03-10 | Authoritative decisions (1-13), architecture summary, priority hierarchy |
| Move Governor Spec | 03-09 | Governor's 3 decisions, input/output contracts, pipeline wiring |
| Territory Selector Spec | 03-09 | Selector's 3 code paths, 6-field output contract |
| E_target Formula Spec | 03-07 | Pacing formula, 7-step pipeline |
| Territory Catalog Migration Spec | 03-08 | 25 territories, continuous `expectedEnergy` |

### Success Criteria

1. **Every incoherence identified** — no "probably fine" hand-waving
2. **Severity classified** — which issues will break implementation, which are cosmetic
3. **Resolution specified** — what exactly needs to change in the territory policy spec
4. **Implementation impact assessed** — does this affect the scorer formula, the contracts, the file layout, or just the narrative?

---

## COHERENCE FINDINGS

### Method

Multi-agent party-mode analysis (Winston/Architect, Dr. Quinn/Problem Solver, Amelia/Developer). Full cross-document trace across 6 specs and 13 design decisions. Each finding classified by severity, implementation impact, and recommended resolution.

### Root Cause

The territory policy spec was the **first** document in the pipeline (03-07). Subsequent specs (selector 03-09, governor 03-09) evolved contracts and architectural framing. The territory policy spec was never back-propagated — only a terminology-level coherence note was added on 03-10. **The coherence note is a terminology patch on a structural divergence.**

---

### Tier 1 — Will Break Implementation If Followed Literally

#### W-1. TerritorySelectorOutput contract is stale

**Territory policy spec (lines 76-84):**
```
TerritorySelectorOutput {
  selectedTerritory: TerritoryId
  selectionRule: string              // "cold-start-top-k" | "argmax"
  alternates: TerritoryId[]
  stayOrShift: "stay" | "shift"
  scorerOutput: TerritoryScorerOutput
}
```

**Selector spec + Decision 12 (authoritative):**
```
TerritorySelectorOutput {
  selectedTerritory: TerritoryId
  sessionPhase: "opening" | "exploring" | "closing"
  transitionType: "continue" | "transition"
  selectionRule: "cold-start-perimeter" | "argmax"
  selectionSeed: string | null
  scorerOutput: TerritoryScorerOutput
}
```

**Four field divergences:**
| Field | Territory Policy Spec | Authoritative | Change Type |
|-------|----------------------|---------------|-------------|
| `alternates` | Present | Dropped (derivable from `scorerOutput.rankedList`) | Removed |
| `stayOrShift: "stay"\|"shift"` | Present | Renamed to `transitionType: "continue"\|"transition"` | Renamed + values changed |
| `sessionPhase` | Missing | Added (`"opening"\|"exploring"\|"closing"`) | New field |
| `selectionSeed` | Missing | Added (`string \| null`) | New field |

**Impact:** Implementer builds wrong type. Governor can't consume output.
**Resolution:** Replace selector output contract in territory policy spec with selector spec version.

---

#### W-2. Downstream consumer is fundamentally different

**Territory policy spec (lines 53, 87, 120):** Move generator "receives the selected territory + runner-ups for bridging/fallback" and dispatches "4 move types (Pull/Bridge/Hold/Pivot)."

**Decision 12:** Governor receives 3 slim fields, makes 3 decisions (entry pressure, noticing hint, contradiction target), outputs `PromptBuilderInput` discriminated union with 5 intent variants (`open | deepen | bridge | hold | amplify`).

**Impact:** The entire downstream layer's scope, input contract, and output contract changed. Not a rename — a different job.
**Resolution:** Replace all "move generator receives/dispatches" references with Governor framing. Update implementation plan Phase 2 wiring steps.

---

#### W-3. `selectionRule` values diverge

**Territory policy spec (line 80):** `"cold-start-top-k"`
**Selector spec (line 65):** `"cold-start-perimeter"`

Cold-start strategy refined from fixed top-K to score-perimeter pooling.

**Impact:** Wrong string literal in discriminated type.
**Resolution:** Replace `"cold-start-top-k"` with `"cold-start-perimeter"` throughout.

---

#### W-4. TerritoryScorerOutput missing `totalTurns`

**Territory policy spec (lines 59-68):** Scorer output has `currentTerritory` and `turnNumber` but not `totalTurns`.
**Selector spec (line 46):** Scorer output metadata includes `totalTurns`.

The selector needs `totalTurns` to derive `sessionPhase`.

**Impact:** Selector can't compute session phase from scorer output.
**Resolution:** Add `totalTurns: number` to `TerritoryScorerOutput`.

---

#### W-5. Catalog size: 22 vs 25 territories

**Territory policy spec (line 395):** "Existing catalog (22 territories) gets a one-time authoring pass."
**Decision 11 + catalog migration spec:** 25 territories (3 new territories added).

**Impact:** Implementation plan migration step targets wrong count. Formula is generic ("all territories") so scorer code is unaffected.
**Resolution:** Update "22" to "25" in implementation plan. Note: catalog migration may already be complete.

---

#### W-6. energyMalus formula uses mixed scales (implicit normalization)

**Territory policy spec (line 374):** `energyMalus(t) = w_e × (t.expectedEnergy - E_target)²`
- `expectedEnergy` is `[0, 1]`
- `E_target` is `[0, 10]`

**Territory policy spec (line 520):** "Wire `computeETarget().eTarget / 10` as scorer input" — normalization acknowledged in wiring section but absent from formula section.

**Impact:** Implementer reading formula section alone computes nonsense malus values (e.g., `(0.5 - 7)² = 42.25` instead of `(0.5 - 0.7)² = 0.04`).
**Resolution:** Either annotate the formula with "E_target normalized to [0,1]" or show the normalized variable explicitly (e.g., `E_target_norm = E_target / 10`).

---

### Tier 2 — Won't Break Code, Will Mislead Architectural Reasoning

#### Q-1. "Late-session resonance" input vs `conversationSkew` term

Territory policy spec input list (line 40): Lists "Late-session resonance" as a separate input — "applied as a late-stage override bonus in final exchanges only."
Territory policy spec solution (lines 369-371): Implements it as `conversationSkew` — a continuous scorer term, not an override.
Decision 8: Describes `conversationSkew` as an integrated scorer term.

**Internal inconsistency** within the territory policy spec: the problem definition's input list doesn't match its own solution. The "override bonus" framing was superseded by the unified formula during the solution phase, but the input list was never updated.

**Resolution:** Update input list to describe `conversationSkew` as session-arc shaping within the unified scorer, not a separate resonance mechanism.

---

#### Q-2. Exit guard model in diagnosis section

Territory policy spec (lines 170-172): "Full scoring runs only when the exit guard fires (lazy). The exit guard runs every turn (always-on)."
Territory policy spec solution (line 259): "Unified per-turn scoring — replaces earlier two-phase exit-guard + lazy-scoring model."

The diagnosis section preserves the problem-space framing that the solution supersedes. An implementer reading linearly might implement the exit guard before reaching the solution that removes it.

**Resolution:** Add a note in the diagnosis section pointing to the solution's unified model, or mark it as "superseded by solution."

---

#### Q-3. Four-layer vs six-layer architecture

Territory policy spec (line 47): "Three-layer architecture (scorer → selector → move generator)" within a four-layer system.
Design decisions architecture summary (line 478): Six decoupled layers (Pacing, Scorer, Selector, Governor, Prompt Builder, Silent Scoring).

Prompt Builder was elevated to a first-class layer in Decision 13.

**Resolution:** Update architecture framing to reference six-layer model.

---

#### Q-4. Decision 4 move dispatch framing (internal to design decisions doc)

Design decisions Decision 4 (lines 150-155): Still describes E_target-gap dispatch (`E_target ~ E(n) → Pull/Bridge`, `E_target < E(n) → Pivot`).
Decision 12: Explicitly retired E_target-gap dispatch. Move types survive as vocabulary, not dispatch targets.

**This is an incoherence within the design decisions document itself**, not just between the two documents. Decision 4 describes a mechanism that Decision 12 superseded.

**Resolution:** Add a note to Decision 4 that the E_target-gap dispatch mapping was retired by Decision 12.

---

#### Q-5. `sessionPhase` concept absent from territory policy spec

The territory policy spec has no `sessionPhase` concept. It uses "session phase" loosely (turn position for `conversationSkew`). The selector spec introduced `sessionPhase` as a discrete enum. Decision 12 moved it to `MoveGovernorDebug`.

**Resolution:** Acknowledge `sessionPhase` as a selector-emitted, Governor-consumed field in the architecture section.

---

#### Q-6. `PromptBuilderInput` discriminated union unknown

The territory policy spec has no awareness of the Governor outputting `PromptBuilderInput` (5 intent variants). Its framing of "move generator dispatches Pull/Bridge/Hold/Pivot" is architecturally incompatible with Decisions 12-13.

**Resolution:** Update downstream consumer description to reference `PromptBuilderInput` and the three-tier prompt composition model.

---

#### Q-7. Priority hierarchy enforcement not shown

Territory policy spec (line 128) correctly states: "protect user state > maintain momentum > quiet pressure for breadth." But the architecture table doesn't show how the scorer formula enforces this. The design decisions doc (line 520) is clearer: "Coverage flows to territory scorer, never through E_target."

**Resolution:** Minor — add a sentence connecting the priority hierarchy to the formula's structural enforcement (energyMalus is a penalty, coverageGain competes honestly, no coverage dampening).

---

### Tier 3 — Terminology / Cosmetic

| # | Issue | Occurrences | Resolution |
|---|-------|-------------|------------|
| T-1 | "move generator" → "Move Governor" | 15 | Already flagged in coherence note |
| T-2 | "stayOrShift" → "transitionType" | Covered in W-1 | Part of contract fix |
| T-3 | "alternates" as precomputed field | 3-4 refs | Note as derivable from `scorerOutput` |
| T-4 | "exit guard" in diagnosis | 2-3 refs | Add "superseded by unified scoring" note |
| T-5 | Deferred inputs (v2) still listed | 2 | No change needed — still deferred |
| T-6 | File location `territory-scorer.ts` "replaces existing" | 1 | Verify target file still exists |

---

## SUMMARY

### What's Fully Coherent (safe to implement as-is)

- **Scorer formula** — all 5 terms (`coverageGain`, `adjacency`, `conversationSkew`, `energyMalus`, `freshnessPenalty`) match design decisions
- **Formula math** — source-normalized baseYield, Jaccard adjacency, quadratic malus, linear freshness decay
- **`expectedEnergy` migration** — continuous [0,1] replacing discrete `energyLevel`
- **Priority hierarchy** — protect user state > momentum > quiet coverage pressure
- **Layer boundary rule** — E_target is opaque input, coverage enters only through scorer
- **Portrait readiness** — read-only, never feeds back (Decision 9)
- **Phase 1 implementation plan** — scorer + term functions as pure functions, unit-testable
- **Test scenarios** — 4 simulation scenarios + 6 stress tests
- **File locations** for scorer-related files

### What Must Be Updated Before Implementation

| Priority | Issue | What to update |
|----------|-------|----------------|
| 1 | W-1 | Replace `TerritorySelectorOutput` contract |
| 2 | W-2 | Replace all "move generator dispatches" with Governor framing |
| 3 | W-6 | Annotate E_target normalization in formula section |
| 4 | W-4 | Add `totalTurns` to `TerritoryScorerOutput` |
| 5 | W-3 | Fix `selectionRule` value |
| 6 | W-5 | Update catalog count 22 → 25 |
| 7 | Q-1 through Q-7 | Update architectural framing (narrative, not code) |

### What to Follow From Other Specs Instead

| Concern | Follow this spec | Not territory policy spec |
|---------|-----------------|--------------------------|
| Selector output contract | Territory Selector Spec (03-09) | Lines 76-84 |
| Governor scope & output | Governor Spec + Decision 12 | Lines 53, 87, 120 |
| Prompt builder architecture | Decision 13 | Not mentioned |
| Catalog count | Catalog Migration Spec (03-08) | Line 395 |
| Cold-start strategy name | Selector Spec (`"cold-start-perimeter"`) | Line 80 |

### Bonus: Incoherence Within Design Decisions Doc

Decision 4 (lines 150-155) still describes E_target-gap dispatch that Decision 12 explicitly retired. Recommend adding a supersession note to Decision 4.

---

## IMPLEMENTATION GUIDANCE

### For scorer implementation (Phase 1 — safe to start now)

The territory policy spec's scorer formula, term functions, and test scenarios are **fully coherent** with all design decisions. Implement directly:

1. `computeAdjacency()` — Jaccard on domains + facets, 0.8/0.2 weighted
2. `computeConversationSkew()` — energy-based U-shape with early/late ramps
3. `computeEnergyMalus()` — quadratic, **normalize E_target to [0,1] at input boundary**
4. `computeFreshnessPenalty()` — linear decay, current territory exempt
5. `computeCoverageGain()` — source-normalized, sqrt, bounded [0,1]
6. `scoreAllTerritories()` — all 5 terms, sorted output with breakdowns
7. Add `totalTurns` to scorer output

### For selector implementation (Phase 1 — use selector spec contract)

Follow the territory selector spec for the output contract, not the territory policy spec. Three code paths: cold-start perimeter, argmax, finale.

### For pipeline wiring (Phase 2 — use governor spec + Decision 12-13)

The territory policy spec's Phase 2 wiring steps reference stale contracts. Use:
- Governor spec for Governor input/output
- Decision 12 for `PromptBuilderInput` discriminated union
- Decision 13 for three-tier prompt composition

---

## GAP RESOLUTIONS

### Gap 6 (RESOLVED): E_target Outputs `[0, 1]` Natively

**Decision:** The E_target pacing formula operates in `[0, 1]` space and outputs `[0, 1]` directly. No downstream normalization needed anywhere.

**What changes:**

| Component | Change |
|-----------|--------|
| **ConversAnalyzer output schema** | Energy extraction (0-10 from LLM) is normalized to `[0, 1]` in the schema transform before entering the formula pipeline. The `userState.energy` field in the ConversAnalyzer response becomes `[0, 1]`. |
| **E_target formula constants** | `comfort: 0.5`, `floor: 0.25`, `maxcap: 0.9`, `E_s init: 0.5`. All divided by 10 from current values. |
| **E_target formula output** | `[0, 1]` — directly comparable with `expectedEnergy` |
| **Scorer** | `energyMalus(t) = w_e × (t.expectedEnergy - E_target)²` — works as written, no conversion |
| **Governor** | Entry pressure gap = `expectedEnergy - E_target` — works as written, no conversion |
| **Territory policy spec** | Remove "Wire `computeETarget().eTarget / 10`" from Phase 2 wiring — no longer needed |
| **E_target formula spec** | Update all constants and simulation outputs to `[0, 1]` scale |
| **Energy/Telling extraction spec** | Add normalization step in ConversAnalyzer v2 output contract: `energy: rawEnergy / 10` |

**Normalization boundary:** ConversAnalyzer schema transform. The LLM naturally produces 0-10. The schema `S.transform()` divides by 10 before the value enters the formula pipeline. One normalization, at the source, invisible to all consumers.

**Rationale:** Eliminates all downstream normalization. One scale (`[0, 1]`) across the entire steering pipeline: energy input, E_target output, expectedEnergy, energyMalus, entry pressure gap. Zero "remember to divide by 10" in any consumer.

---

### Gap 5 (RESOLVED): Decision 4 Supersession Note

**Decision:** Add a supersession note to Decision 4 in the design decisions doc.

**The note:**

> **Supersession (Decision 12):** The E_target-gap dispatch mapping below (Pull/Bridge when gap is small, Pivot when E_target < E(n)) was retired by Decision 12. Move types survive as vocabulary for prompt builder instructions, post-hoc analysis, and design communication — not as policy-layer dispatch targets. The Governor computes entry pressure from the E_target gap but does not dispatch move types. Nerin naturally chooses the conversational action from context.

**Where:** Immediately after Decision 4's move selection table (after line 155 in the design decisions doc).

---

### Gaps 1-3 (RESOLVED): Governor Output Contract, `deriveIntent()`, `previousTerritory`

These three gaps are coupled — they all concern the Governor's external contract and how it produces `PromptBuilderInput`.

**Decision:** The Governor spec's `MoveGovernorOutput` (flat 6-field struct) is retired. The Governor's external contract is `PromptBuilderInput` (discriminated union), as specified in Decision 12's 03-10 revision. The Governor runs `deriveIntent()` internally and outputs the shaped type directly.

#### `deriveIntent()` Specification

```typescript
function deriveIntent(
  turnNumber: number,
  isFinalTurn: boolean,
  overlay: { noticingHint: LifeDomain | null; contradictionTarget: ContradictionTarget | null },
  selectedTerritory: TerritoryId,
  previousTerritory: TerritoryId | null,  // from prior Governor output, null on turn 1
  entryPressure: EntryPressure,
  // Amplify-only inputs — used to find best material regardless of thresholds
  perDomainFacetScores: PerDomainFacetScore[],
  surfacedPairs: Set<string>,
  surfacedDomains: Set<LifeDomain>,
): PromptBuilderInput {
  // Priority: amplify > hold > bridge / deepen

  if (isFinalTurn) {
    // Skip normal gating — find the best available material regardless of thresholds
    // Both suggestions passed to Nerin; Nerin decides what to use (or neither)
    return {
      intent: "amplify",
      territory: selectedTerritory,
      contradictionSuggestion: findStrongestContradictionCandidate(perDomainFacetScores, surfacedPairs),
      noticingSuggestion: findStrongestNoticingCandidate(perDomainFacetScores, surfacedDomains),
    }
  }

  if (overlay.contradictionTarget) {
    return { intent: "hold", territory: selectedTerritory, focus: overlay.contradictionTarget }
  }

  if (overlay.noticingHint) {
    return { intent: "hold", territory: selectedTerritory, focus: overlay.noticingHint }
  }

  if (turnNumber === 1 || previousTerritory === null) {
    return { intent: "open", territory: selectedTerritory }
  }

  if (selectedTerritory === previousTerritory) {
    return { intent: "deepen", territory: selectedTerritory, entryPressure }
  }

  return {
    intent: "bridge",
    territory: selectedTerritory,
    entryPressure,
    previousTerritory,
  }
}
```

**Design notes:**
- `amplify` bypasses normal gating entirely. Instead of relying on escalating thresholds and emergence formulas, it finds the strongest contradiction candidate and strongest noticing candidate regardless of thresholds, and passes both as suggestions. Nerin decides what to use — or neither. Mutual exclusion does not apply on the final turn; we're giving Nerin all available material and trusting its judgment. There are no future turns to save trust for.
- `open` carries no `entryPressure` — the opening is always a warm, direct invitation.
- `deepen` and `bridge` carry `entryPressure` — the Governor has computed how directly to enter based on the E_target gap.
- `hold` is triggered by an overlay firing. The Governor pauses territory progression to let Nerin deliver the noticing or contradiction moment.

#### `previousTerritory` Derivation

```typescript
function derivePreviousTerritory(
  priorMessages: AssessmentMessage[]
): TerritoryId | null {
  // Derive-at-read: scan prior assistant messages for the most recent Governor output
  const lastAssistant = priorMessages
    .filter(m => m.governorOutput != null)
    .at(-1)

  return lastAssistant?.governorOutput.territory ?? null
}
```

**Integration:** `previousTerritory` is derived in `reconstructGovernorSessionState()` alongside the existing session counters. Added to `GovernorSessionState`:

```typescript
type GovernorSessionState = {
  // Existing counters
  noticingWindowsOpened: number
  surfacedNoticingDomains: Set<LifeDomain>
  contradictionsFiredThisSession: number
  surfacedContradictionPairs: Set<string>
  // New
  previousTerritory: TerritoryId | null
}
```

#### Updated Governor Output Types

```typescript
// External contract — consumed by Prompt Builder
type PromptBuilderInput =
  | { intent: "open";    territory: TerritoryId }
  | { intent: "deepen";  territory: TerritoryId; entryPressure: EntryPressure }
  | { intent: "bridge";  territory: TerritoryId; entryPressure: EntryPressure; previousTerritory: TerritoryId }
  | { intent: "hold";    territory: TerritoryId; focus: NoticingHint | ContradictionTarget }
  | { intent: "amplify"; territory: TerritoryId;
      contradictionSuggestion: ContradictionTarget | null;
      noticingSuggestion: NoticingHint | null }

type EntryPressure = "direct" | "angled" | "soft"
type NoticingHint = LifeDomain  // domain-level compass, not facet target

// Debug/replay trace — NOT sent to Prompt Builder
type MoveGovernorDebug = {
  sessionPhase: "opening" | "exploring" | "closing"
  transitionType: "continue" | "transition"
  selectionRule: string
  entryPressure: EntryPressure
  entryPressureGap: number | null
  noticingHint: LifeDomain | null
  noticingReason: "not_exploring" | "no_emergence" | "below_threshold" | "already_surfaced" | "deferred_by_contradiction" | "fired"
  contradictionTarget: ContradictionTarget | null
  contradictionReason: "no_candidates" | "below_threshold" | "already_surfaced" | "fired"
  isFinalTurn: boolean
}
```

**Key change from Governor spec:** `sessionPhase` and `transitionType` moved from external output to debug trace. They are intermediate derivation signals the Governor uses internally to compute intent. The Prompt Builder receives `PromptBuilderInput` (intent-discriminated) and never sees phase/transition directly.

**Relationship to Governor spec:** The Governor's 3 internal decisions (entry pressure, noticing hint, contradiction target) remain unchanged. What changed is the *output shape* — instead of emitting a flat struct with all 6 fields, the Governor runs `deriveIntent()` to map its decisions into the correct `PromptBuilderInput` variant, then emits the shaped type. The debug trace preserves all intermediate state for observability.

---

### Gap 4 (RESOLVED): Consolidated Pipeline Wiring

**Decision:** The territory policy spec's Phase 2 becomes the authoritative pipeline wiring section. Updated to reflect current contracts.

**Amended pipeline (10 steps):**

```
 1. computeETarget()                        ← Outputs [0, 1] natively (Gap 6 resolution)
 2. scoreAllTerritories()                   ← Consumes E_target [0, 1] directly
 3. selectTerritory()                       ← Returns TerritorySelectorOutput (6 fields)
 4. computePerDomainFacetDetails()          ← Expose per-domain mu_g + w_g
 5. reconstructGovernorSessionState()       ← Scan prior messages for counters + previousTerritory
 6. computeGovernorOutput()                 ← 3 decisions → deriveIntent() → PromptBuilderInput
 7. buildSystemPrompt()                     ← Three-tier composition (Decision 13)
                                               Consumes PromptBuilderInput directly
 8. callNerin()                             ← Receives composed system prompt
 9. callConversAnalyzer()                   ← Extracts energy [0,1], telling, evidence
10. saveExchangeMetadata()                  ← Saves PromptBuilderInput + MoveGovernorDebug as jsonb
```

**Contract at each boundary:**

| Boundary | Producer → Consumer | Contract |
|----------|-------------------|----------|
| 1 → 2 | Pacing → Scorer | `eTarget: number` in `[0, 1]` |
| 2 → 3 | Scorer → Selector | `TerritoryScorerOutput` (ranked list + `currentTerritory` + `turnNumber` + `totalTurns`) |
| 3 → 6 | Selector → Governor | 3 slim fields: `selectedTerritory`, `sessionPhase`, `transitionType` |
| 3 → debug | Selector → Debug | Full `TerritorySelectorOutput` (6 fields including `selectionRule`, `selectionSeed`, `scorerOutput`) |
| 6 → 7 | Governor → Prompt Builder | `PromptBuilderInput` (discriminated union, 5 intents) |
| 6 → debug | Governor → Debug | `MoveGovernorDebug` (flat trace) |
| 9 → pipeline | ConversAnalyzer → Pipeline | `userState.energy` in `[0, 1]` (normalized in schema transform) |

**Supersedes:**
- Territory policy spec Phase 2 wiring steps (lines 518-528)
- Governor spec pipeline wiring (lines 958-998) — step numbers and types updated
- Governor spec prompt builder section (lines 734-933) — already marked superseded by Decision 13

---

## GAP RESOLUTION SUMMARY

| Gap | Status | Decision |
|-----|--------|----------|
| Gap 6 | **RESOLVED** | E_target outputs `[0, 1]`. ConversAnalyzer normalizes energy in schema transform. |
| Gap 5 | **RESOLVED** | Add supersession note to Decision 4 re: move dispatch retirement. |
| Gap 1 | **RESOLVED** | `MoveGovernorOutput` retired. `PromptBuilderInput` discriminated union is the external contract. |
| Gap 2 | **RESOLVED** | `deriveIntent()` fully specified — priority rules, function body, all 5 variants. |
| Gap 3 | **RESOLVED** | `previousTerritory` derived in `reconstructGovernorSessionState()` from prior Governor output. |
| Gap 4 | **RESOLVED** | Consolidated 10-step pipeline with contracts at each boundary. |

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
