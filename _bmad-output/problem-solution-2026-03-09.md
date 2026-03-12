# Problem Solving Session: Territory Selector Layer — Design Spec & Pipeline Articulation

**Date:** 2026-03-09
**Problem Solver:** Vincentlay
**Problem Category:** Conversation Architecture / Territory Policy Pipeline

> **Changelog (2026-03-10):** Full coherence pass applied — downstream consumer updated from Move Generator to Move Governor per [Decision 12](./planning-artifacts/conversation-pacing-design-decisions.md#decision-12-move-governor--restraint-layer-not-move-dispatch). Pipeline references, separation of concerns, and implementation plan updated to reflect six-layer architecture (Decisions 12-13). Selector logic, output contract, and constants unchanged. See [Move Governor Spec](./problem-solution-2026-03-09-move-generator.md) and [Coherence Audit](./problem-solution-2026-03-10-territory-policy-coherence.md).

---

## PROBLEM DEFINITION

### Initial Problem Statement

The territory policy pipeline is decomposed into three layers: Scorer → Selector → Move Governor. The scorer and Governor have established designs (unified five-term formula; entry pressure, noticing, and contradiction decisions). The selector layer — the thin deterministic layer between them — has v1 sketch rules but lacks a complete spec. Specifically:

- The cold-start selection strategy needs a final design decision (fixed K vs margin-based vs score-weighted — user prefers top-K random)
- Edge cases are unexplored (near-ties, score cliffs, degenerate rankings)
- The separation of concerns between all three layers needs to be documented precisely enough that each layer can be implemented and tested independently
- The selector-to-Governor handoff needs design attention — the Governor must consume the selector's output to compute entry pressure, noticing windows, and contradiction targets

### Refined Problem Statement

**Design the territory selector as a fully specified pure function that consumes the scorer's ranked list and produces a selection contract consumable by the Move Governor, with explicit edge case handling, clear separation of concerns across all three territory policy layers, and a pipeline articulation tight enough for direct implementation.**

From first principles, the selector's irreducible job:

> **Given a ranked list of territories, pick one. Annotate with session-phase signals the Governor needs.**

The selector is a **pure function** — stateless, deterministic (except cold-start randomness), everything it needs arrives in the scorer output. It has:
- **Three branching rules** based on turn position (cold-start, steady-state, finale)
- **One randomness source** (cold-start selection from top candidates)
- **One derived field** (`transitionType` — comparison of selected vs current, not a decision)
- **One session-phase annotation** (`sessionPhase` — derived from turn position, consumed by Governor for intent derivation and closing behavior)
- **Zero internal state** — everything arrives in the input

### Problem Context

The selector sits at a critical pipeline junction:

```
Territory Scorer → [SELECTOR] → Move Governor → Prompt Builder → Nerin's response
```

**Upstream contract (locked):** `TerritoryScorerOutput` — sorted ranked list of all 25 territories with per-term score breakdowns, total scores, and metadata (currentTerritory, turnNumber, totalTurns).

**Downstream consumer:** Move Governor — receives 3 slim fields (`selectedTerritory`, `sessionPhase`, `transitionType`) plus E_target and per-domain facet scores. Computes 3 decisions per turn: entry pressure, noticing hint, contradiction target. Runs `deriveIntent()` to produce `PromptBuilderInput` — a discriminated union with 5 intent variants (`open | deepen | bridge | hold | amplify`). On `sessionPhase: "closing"`, the Governor derives `intent: "amplify"` — Nerin gets permission to be braver, with the strongest available noticing and contradiction candidates passed as suggestions. The Prompt Builder then composes a three-tier contextual system prompt from `PromptBuilderInput`. See [Decision 12](./planning-artifacts/conversation-pacing-design-decisions.md#decision-12-move-governor--restraint-layer-not-move-dispatch) and [Decision 13](./planning-artifacts/conversation-pacing-design-decisions.md#decision-13-three-tier-contextual-prompt-composition).

**Existing v1 sketch (from territory policy spec):**
- Turn 1 (cold start): random selection from top candidates
- Turn 2+: argmax (deterministic top-1)
- Tiebreak: catalog order

**v1 output contract (revised):**
```
TerritorySelectorOutput {
  // --- Governor consumer (3 fields) ---
  selectedTerritory: TerritoryId
  sessionPhase: "opening" | "exploring" | "closing"
  transitionType: "continue" | "transition"

  // --- Debug/replay consumer (3 fields) ---
  selectionRule: "cold-start-perimeter" | "argmax"
  selectionSeed: string | null            // hashed, non-null only on cold-start
  scorerOutput: TerritoryScorerOutput     // full ranked list — debug derives everything from this
}
```

**Key design insight (from first principles):** The selector exists for *separation of diagnostics*, not because selection is inherently complex. Bad ranking → scorer bug. Good ranking, bad pick → selector rule. Good pick, bad execution → Governor/Prompt Builder. Each layer independently diagnosable.

**Edge case resolutions (from Tree of Thoughts analysis):**

| # | Edge Case | Resolution | Rationale |
|---|-----------|-----------|-----------|
| 1 | **Near-flat ranking** | Not a selector concern — scorer formula already handles near-ties | Selector does argmax; if scores are close, the scorer's formula already accounts for that. Selector doesn't second-guess. |
| 2 | **Stuck loop** (same territory N+ turns) | Not a selector concern — scorer handles via freshnessPenalty + adjacency decay | If a territory keeps winning, the scorer's freshness and coverage mechanisms should eventually push it out. Selector guardrails would violate layer separation. |
| 3 | **Cold-start pool strategy** | Score-perimeter pool: take top score, include all territories within `COLD_START_PERIMETER` of top score, random pick from pool | Score-driven, not energy-driven. Pool adapts to scorer's distribution — naturally handles both cold-start (default energy → light territories cluster at top) and warm-start (informed energy → different territories cluster). One mechanism, both cases. |
| 4 | **Early exit** | No closing phase, no portrait. User resumes conversation later. | Portrait generation requires 25 completed exchanges. A user who leaves can return and resume where they left off. No forced closing on early exit. |
| 5 | **Degenerate ranking** | Not a selector concern — scorer must always return valid input. Scorer throws on failure, pipeline retries. | The only realistic point of failure is ConversAnalyzer (Haiku) extraction hallucination. Schema validation catches most issues. On failure, retry the whole pipeline from extraction. |

### Success Criteria

1. **Separation of concerns** — a crisp boundary doc where each layer's responsibility, inputs, outputs, and "not my job" list is unambiguous
2. **Selector spec** — complete enough to implement: all rules, all edge cases, all output fields, all invariants
3. **Pipeline articulation** — the full Scorer → Selector → Governor → Prompt Builder data flow with contracts at each boundary, including the sessionPhase → amplify intent handoff
4. **Edge case catalog** — explicit handling for: near-ties, score cliffs, degenerate rankings, repeated territory selection, cold-start variety, finale behavior
5. **Governor handoff** — what the Governor needs from the selector (territory ID, transitionType, sessionPhase) and how each field drives intent derivation

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

**Where the problem IS:**
- In the gap between "ranked list exists" and "Governor needs a single territory + context"
- In the cold-start K strategy (how many top candidates, how to define "top")
- In the sessionPhase boundary definition (when does "exploring" become "closing"?)
- In edge cases where the scorer produces ambiguous rankings (near-ties, flat distributions)
- In the **auditability contract** — what the selector owes to debug/replay

**Where the problem IS NOT:**
- In how territories get ranked (scorer's job — locked)
- In how the chosen territory gets phrased into a prompt (Governor → Prompt Builder's job)
- In E_target computation (upstream, user-state-pure — locked)
- In coverage gap calculation (silent scoring's job)
- In territory catalog design (resolved — 25 territories, continuous expectedEnergy)

**When the selector DOES matter:**
- Every turn (it runs every time)
- Most critically at turn 1 (opener variety) and last turn(s) (Netflix ending)
- When scores are close (argmax is trivial with a clear winner, interesting when scores cluster)

**When the selector DOES NOT matter:**
- When the scorer produces a dominant winner with clear separation — the selector is passthrough
- Between sessions — no state carries over

**Who IS affected:**
- The Move Governor (direct consumer — slim selection contract)
- The debug/replay system (second consumer — full audit trail)
- UX consistency (cold-start variety vs reproducibility)

**Who IS NOT affected:**
- The scorer (doesn't know the selector exists)
- The user (never sees selector decisions directly)
- Portrait quality (covered by silent scoring)

**Two-consumer insight:** The selector serves two audiences with different needs on the same output object:

| Consumer | Needs | Fields |
|----------|-------|--------|
| **Move Governor** | What territory, what phase, same or new territory | `selectedTerritory`, `sessionPhase`, `transitionType` |
| **Debug/replay** | What was selected, by what rule, with what seed, full ranking | `selectionRule`, `selectionSeed`, `scorerOutput` |

All debug-derivable data (alternates, topCandidates, margins, selectedScore) comes from `scorerOutput.rankedList`. No precomputed slices.

**Pattern:** The selector's interesting surface area is small — mostly passthrough. Three moments where it actually matters: **(1) cold-start randomness + seed**, **(2) near-tie handling**, and **(3) sessionPhase annotation**. Everything else is argmax + derivation + audit logging.

### Root Cause Analysis

**Five Whys:**

1. Why is the selector under-specified? → Because the territory policy spec focused complexity budget on the scorer (five-term formula) and Governor (entry pressure, noticing, contradiction), treating the selector as "thin and obvious"
2. Why was it treated as obvious? → Because in steady-state it *is* obvious — argmax from a ranked list. Interesting behavior only emerges at edges (cold-start, near-ties, session phase)
3. Why weren't the edges designed? → Because they depend on decisions that require understanding the selector's two consumers (Governor + debug/replay) and what each needs
4. Why weren't those consumers articulated? → Because the original architecture focused on data flow (scorer → selector → Governor) without treating observability as a first-class design concern
5. Why wasn't observability a first-class concern? → Because the territory policy spec was solving three problems simultaneously and naturally allocated attention to the hardest layer (scorer)

**Root cause:** The selector was under-specified because **(a) its conditional complexity was easy to defer** (trivial 80% of the time, interesting 20%), **(b) observability/auditability wasn't treated as a co-equal consumer**, and **(c) sessionPhase is a newly discovered responsibility** that wasn't in the original spec.

### Contributing Factors

- The territory policy spec solved three problems at once and spent its complexity budget on the scorer
- The selector's interesting behavior is *conditional* — argmax is trivial most turns, edge cases only matter at cold-start, near-ties, and closing. Conditional complexity is easy to defer.
- The two-consumer model (Governor + debug/replay) wasn't visible in the original architecture diagram, which showed a single arrow from selector to Governor
- `sessionPhase` annotation is a new responsibility discovered in this session — not in the original territory policy spec
- The Netflix ending mechanism was originally framed as a scorer concern (`conversationSkew`) without considering that the selector needs to signal *when* closing behavior should activate

### System Dynamics

**Four tensions the selector operates within:**

1. **Simplicity vs Richness** — the selector should be a pure function (thin, testable), but its two consumers want different things. Governor wants slim selection. Debug system wants full audit trail. These pull the output contract in opposite directions.

2. **Determinism vs Variety** — steady-state wants deterministic argmax (reproducible, debuggable). Cold-start wants randomness (unique openers, social UX). Genuinely different modes in the same function.

3. **Autonomy vs Coupling** — the selector should be independently testable, but its output contract is shaped by what the Governor needs. If the Governor's needs evolve, the selector's contract must accommodate. Independence is constrained by the downstream consumer.

4. **Present vs Future** — v1 contract (`transitionType: "continue" | "transition"`) is deliberately minimal, but v2 candidates exist (user-direction override, `"return"`, `"deepen"`). Too tight for v1 creates migration pain. Too loose for v2 creates premature abstraction.

**Junction dynamics:**

```
Scorer (complex, locked)
    ↓ ranked list
SELECTOR (thin, but junction point)
    ↓ 3 slim fields           ↓ full audit trail
Move Governor            Debug/Replay System
(needs territory,        (needs rule, seed,
 phase, transition)       full scorer output)
    ↓ PromptBuilderInput
Prompt Builder
    ↓ composed system prompt
Nerin
```

The selector is not hard — it's *easy to underestimate* because its interesting surface area is small and conditional.

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

- **Locked upstream contract** — scorer output is designed, selector input is known
- **Two clear consumers** — Governor and debug/replay have distinct, well-understood needs
- **Thin surface area** — most edge cases resolved to "not the selector's problem," leaving 3 real behaviors
- **Existing codebase patterns** — Effect-ts hexagonal architecture with Context.Tag gives a natural implementation pattern
- **Pure function design** — no state, no side effects, independently testable

**Restraining Forces (Blocking Solution):**

- **Governor contract could evolve** — downstream consumer is designed (Decision 12) but untested in production
- **sessionPhase is new** — not in original territory policy spec, needs validation against broader architecture
- **Cold-start energy threshold needs calibration** — optimal value depends on real conversation data
- **Future extensibility tension** — v2 candidates (user-direction override, `"return"`, `"deepen"`) could change shape

**Balance:** Driving forces dominate. The selector's simplicity is its biggest asset. The Governor is now fully designed (Decision 12) — the former strongest restraining force is resolved.

### Constraint Identification

**Primary constraint: Layer separation discipline.** The selector must not:
- Override the scorer's ranking (except cold-start energy gating)
- Compute anything the scorer should compute
- Make decisions the Governor should make
- Carry state between turns

**Secondary constraint: Always produce a result.** The selector cannot fail silently. Invalid upstream input → throw → pipeline retries.

### Key Insights

1. The selector is the **thinnest layer in the pipeline by design.** This is a feature, not a gap. Most intelligence lives in the scorer (ranking) and Governor (behavioral constraints). The selector is glue with an audit trail.

2. The cold-start energy gate is the **only place the selector has an opinion** beyond passthrough. Every other behavior is derived or delegated.

3. The output contract's **two-consumer split** (Governor vs debug) is the most important architectural insight. It resolves "what fields do we need?" into "who needs what and why?"

---

## SOLUTION GENERATION

### Methods Used

**Systematic synthesis from diagnostic output** — the diagnosis, edge case analysis, party mode sessions, and force field analysis converged on a single design. The selector is thin enough that the solution is fully determined by its constraints. No competing alternatives needed.

### Generated Solution: Territory Selector Complete Spec

**Identity:** A pure function with no internal state. Runs once per turn. Consumes the scorer's ranked list, produces a selection with annotations for two consumers.

**Function signature:**

```typescript
selectTerritory(
  scorerOutput: TerritoryScorerOutput,
  sessionContext: { userId: string, sessionId: string }
) → TerritorySelectorOutput
```

Note: no territory catalog input needed — the selector is purely score-driven. Energy-awareness comes through the scorer's ranking, not through catalog lookups.

**Three code paths:**

**Path priority (explicit — handles all edge cases including `totalTurns = 1`):**
```
if turnNumber === 1        → Path 1 (cold-start takes priority over finale)
else if turnNumber >= totalTurns → Path 3 (finale)
else                       → Path 2 (steady-state)
```

**Path 1 — Cold Start (turn 1, always wins over other paths):**
```
1. topScore = rankedList[0].score
2. pool = rankedList.filter(t => t.score >= topScore - COLD_START_PERIMETER)
3. seed = hash(userId + sessionId)
4. selectedTerritory = randomPick(pool, seed)
5. Return with selectionRule = "cold-start-perimeter"
```

**Why score-based perimeter, not energy-gating:** The scorer's ranking already encodes energy-awareness via `energyMalus` and `conversationSkew`. On a true cold start (default energy 5.0), light territories naturally cluster at the top — the perimeter captures that cluster. On a warm start (returning user with informed energy), different territories rank high — the perimeter captures *that* cluster instead. One mechanism, both cases. The selector never mentions energy. The scorer does all the energy-aware work.

**Path 2 — Steady State (turns 2 to N-1):**
```
1. Pick rankedList[0] (argmax)
2. Tiebreak: catalog order (implicit — scorer sorts stably)
3. Return with selectionRule = "argmax"
```

**Path 3 — Finale (turn N, where N = totalTurns):**
```
1. Same as Path 2 (argmax)
2. sessionPhase = "closing"
3. Return with selectionRule = "argmax"
```

**Edge case: `totalTurns = 1` (single-turn session).** Path 1 wins — cold-start selection with `sessionPhase: "opening"`. A single-turn session is an opener with no closing. This can't happen in v1 (fixed 25 turns) but the spec is correct for all inputs.

**Derivations (every path):**
```
sessionPhase:
  turn 1                    → "opening"
  turns 2 to totalTurns-1   → "exploring"
  turn totalTurns            → "closing"

transitionType:
  selectedTerritory === scorerOutput.currentTerritory → "continue"
  selectedTerritory !== scorerOutput.currentTerritory → "transition"
```

**Constants:**
```
COLD_START_PERIMETER = 0.08   // score band width for cold-start pool
```

**Perimeter calibration rationale (from turn-1 scorer simulation):**

The five-term formula on turn 1 reduces to `coverageGain + conversationSkew - energyMalus` (freshness = 0, adjacency = 0 with no current territory). With default E_target = 5.0 (normalized 0.5):
- Light territories (expectedEnergy 0.20-0.37) cluster within ~0.05 of each other at the top
- The gap between the light cluster and medium territories is ~0.10-0.12
- Perimeter 0.08 captures the light cluster (~6-9 territories) while staying below the light-to-medium gap
- A medium territory can still enter the pool if it genuinely scores within 0.08 of the top (e.g., unusually high coverageGain) — that's the scorer earning it

**Tuning notes:** Recalibrate if scorer weights (`conversationSkew` earlyRamp, `energyMalus` shape) change. The perimeter depends on the score spread the formula produces on turn 1.

**Output contract:**

```typescript
type TerritorySelectorOutput = {
  // --- Governor consumer (3 fields) ---
  selectedTerritory: TerritoryId
  sessionPhase: "opening" | "exploring" | "closing"
  transitionType: "continue" | "transition"

  // --- Debug/replay consumer (3 fields) ---
  selectionRule: "cold-start-perimeter" | "argmax"
  selectionSeed: string | null            // hashed — no raw PII in audit trail
  scorerOutput: TerritoryScorerOutput
}
```

**Seed strategy:**
- Seed = `hash(userId + sessionId)` — deterministic, reproducible, PII-safe
- Different users get different openers (variety)
- Same user replaying same session gets same opener (debuggability)
- Hashed to prevent user identity leaking into audit trail / debug exports
- Replay system maps hash → userId internally when needed

### Separation of Concerns — Three-Layer Boundary Doc

| | **Scorer** | **Selector** | **Move Governor** | **Prompt Builder** |
|---|---|---|---|---|
| **Owns** | Five-term formula, coverage integration, catalog consumption | Cold-start perimeter selection, argmax, sessionPhase, transitionType, audit trail | Entry pressure, noticing windows, contradiction targets, intent derivation (`deriveIntent()`) | Three-tier contextual system prompt composition (Decision 13) |
| **Produces** | Sorted ranked list with per-term breakdowns | Selected territory + annotations for 2 consumers | `PromptBuilderInput` (discriminated union, 5 intents) + `MoveGovernorDebug` (flat trace) | Complete system prompt: persona → core identity → behavioral modules → steering |
| **Does NOT** | Pick a territory, know session phase, care about cold-start | Rank territories, compute coverage, carry state, compute spine, reference energy directly | Choose territory, rank territories, decide session phase, dispatch move types | Make behavioral decisions, track state, choose territory |
| **Input** | E_target, coverage gaps, catalog, visit history, turn/totalTurns | TerritoryScorerOutput + session context (userId, sessionId) | 3 selector fields + E_target + per-domain facet scores + session counters + `isFinalTurn` | `PromptBuilderInput` + territory catalog |
| **Output** | `TerritoryScorerOutput` | `TerritorySelectorOutput` | `PromptBuilderInput` + `MoveGovernorDebug` | Nerin's system prompt |
| **Test boundary** | Formula produces correct rankings | 5 computed values correct for given input | Correct intent variant + entry pressure for given selection + evidence | Correct module selection + steering section for given intent |

### Pipeline Data Flow

```
Silent Scoring → coverage gaps ─┐
                                 ↓
E_target ────────────────→ Territory Scorer
Territory Catalog ───────→ Territory Scorer
Visit History ───────────→ Territory Scorer
                                 ↓
                      TerritoryScorerOutput (ranked list)
                                 ↓
Session Context ─────────→ Territory Selector (hashed seed for cold-start)
                                 ↓
                      TerritorySelectorOutput
                          ↓ 3 slim fields              ↓ full 6-field output
E_target ─────────→ Move Governor                 Debug/Replay System
Per-domain scores ─→ Move Governor
Session counters ──→ Move Governor
                          ↓
                   PromptBuilderInput (5 intents)
                          ↓
Territory Catalog ─→ Prompt Builder
                          ↓
                   Nerin's system prompt
```

### Edge Case Handling

| Edge Case | Resolution |
|-----------|-----------|
| Near-flat ranking | Scorer's concern — selector does argmax regardless |
| Stuck loop (same territory N+ turns) | Scorer's concern — freshness + adjacency handle it |
| Cold-start pool size | Score-perimeter filtering — pool adapts to scorer's distribution. Tight scores → small pool. Spread scores → larger pool. Naturally handles both cold-start and warm-start (returning users). |
| Early exit (before turn 25) | No closing phase, no portrait. User resumes later. |
| Scorer failure | Scorer throws, pipeline retries from extraction |
| Empty cold-start pool (perimeter too tight) | Fallback: argmax (pool always has at least 1 — the top-ranked territory) |

### Red Team Hardenings

Adversarial stress-testing produced the following hardenings applied to this spec:

| Attack | Verdict | Action Taken |
|--------|---------|-------------|
| Cold-start blind spot (energy gate blocks context-informed scoring) | **Resolved by perimeter approach** — score-based pool naturally adapts to scorer's context-awareness. No energy gate to override. |  Replaced energy-gating with score-perimeter. |
| `"opening"` sessionPhase is useless (Governor can derive turn 1) | Acknowledged — keep for contract legibility | `"opening"` is a semantic signal for Governor intent derivation, not a data dependency. Zero cost to keep. |
| Seed leaks PII into audit trail | Valid | **Fixed:** seed is `hash(userId + sessionId)`, not raw IDs. |
| `transitionType` is redundant (derivable from scorerOutput) | Rejected | `transitionType` shields the Governor from scorer internals — boundary-preserving derivation, not redundant precomputation. |
| Dynamic `totalTurns` mid-session | Already resilient | `totalTurns` is read per-turn from scorer output, not cached. Documented. |

### Documented Invariants

1. **`totalTurns` is read per-turn**, not cached — if dynamic session length is added later, sessionPhase derivation adapts automatically
2. **The selector never references energy directly** — all energy-awareness comes through the scorer's ranking. The selector is purely score-driven.
3. **The cold-start perimeter pool always contains at least 1 territory** (the top-ranked territory itself). Empty pool is impossible by construction.
4. **`sessionPhase: "opening"` is a semantic signal**, not a data dependency — the Governor could derive "first turn" from context absence, but the field communicates intent explicitly
5. **Path 1 (cold-start) always takes priority** over Path 3 (finale) when `turnNumber === 1 === totalTurns` — a single-turn session is an opener, not a closing
6. **E_target reaches scorer and Governor independently** (not through selector) — pipeline-level concern to ensure both receive the same value per turn
7. **The selector is session-agnostic.** It carries no state between sessions. Cross-session awareness (returning user visit history, prior coverage) lives in the scorer's inputs, not in the selector. The perimeter approach handles warm-start naturally because the scorer's ranking already reflects prior data.
8. **`sessionPhase: "opening"` drives `intent: "open"` in the Governor.** On turn 1, `deriveIntent()` produces `{ intent: "open", territory }` — the Prompt Builder loads only `Relate>Reflect` modules, and Nerin naturally invites the user into conversation. There is no prior territory to bridge from, no evidence for noticing or contradiction. The behavioral outcome is a warm Pull — not by constraint, but by context.

### Monitoring Signals

Key observability metrics to build from the selector's debug output:

| Signal | Source | What It Tells You | Alert Threshold |
|--------|--------|-------------------|-----------------|
| Cold-start pool size | Count of territories in perimeter band | Is the perimeter yielding healthy variety? | < 3 (too tight) or > 12 (too loose) |
| `transitionType` ratio per session | Count "continue" vs "transition" | How often does the conversation shift territory? | > 80% "continue" suggests scorer inertia problem |
| Consecutive "continue" streaks | Max run of same territory | Early warning for stuck loops | > 5 consecutive turns in one territory |
| `selectionRule` counts per session | Should be exactly 1 cold-start + N-1 argmax | Sanity check — selector code paths firing correctly | Any deviation from expected pattern |
| Score margin (top - #2) on cold-start | `scorerOutput.rankedList[0].score - rankedList[1].score` | How differentiated is the scorer on turn 1? | If margin > perimeter consistently, pool is always 1 |

These feed calibration of `COLD_START_PERIMETER` and early detection of scorer-level issues.

### Parent Document Backport Required

This selector spec evolved 5 elements beyond the parent territory policy spec (`problem-solution-2026-03-07-territory-policy.md`) and design decisions doc (`conversation-pacing-design-decisions.md`). These must be backported after this spec is finalized:

| Change | Old (Parent Spec) | New (This Spec) | Doc to Update |
|--------|-------------------|-----------------|---------------|
| Cold-start strategy | `"cold-start-top-k"` (fixed K) | `"cold-start-perimeter"` (score-based) | Territory policy spec §Selector rules |
| Transition field | `stayOrShift: "stay" \| "shift"` | `transitionType: "continue" \| "transition"` | Territory policy spec §Selector output, Design decisions §Architecture |
| Alternates | `alternates: TerritoryId[]` in move generator contract | Removed — derivable from `scorerOutput` | Territory policy spec §Selector output |
| Session phase | Not in spec | `sessionPhase: "opening" \| "exploring" \| "closing"` | Territory policy spec §Selector output, Design decisions §Architecture |
| Governor input | `selectedTerritory + alternates + stayOrShift` | `selectedTerritory + sessionPhase + transitionType` (3 slim fields) | Territory policy spec §Governor |

Additionally, update the design decisions doc open questions: move "Territory selector layer" from "Still Open" to "Resolved" with a reference to this spec.

### v2 Candidates (Deferred)

- `transitionType: "return"` — revisiting a previous territory
- `transitionType: "deepen"` — same territory, escalation signal
- User-direction override — user explicitly asks to talk about something
- Margin-based soft selection in steady-state
- Configurable `closingTurns` (currently fixed at 1)

---

## SOLUTION EVALUATION

### Evaluation Against Success Criteria

| # | Criteria | Status | Evidence |
|---|---------|--------|----------|
| 1 | Separation of concerns | **Met** | Three-layer boundary table (Owns/Produces/Does NOT/Input/Output/Test boundary) |
| 2 | Selector spec complete for implementation | **Met** | 3 code paths, explicit priority, 6-field output, 1 calibrated constant, hashed seed, ~12 unit tests |
| 3 | Pipeline articulation with contracts | **Met** | Full Scorer → Selector → Governor → Prompt Builder diagram with all inputs/outputs at each boundary |
| 4 | Edge case catalog | **Met** | 6 edge cases resolved, path priority for totalTurns=1, all documented |
| 5 | Governor handoff | **Met** | 3 slim fields, opening → `open` intent, closing → `amplify` intent (Decision 12) |

### Additional Deliverables

- Red Team hardenings: 5 attacks with verdicts and fixes
- 8 documented invariants
- 5 monitoring signals with alert thresholds
- Parent document backport table: 5 changes across 2 docs
- v2 candidates: 5 deferred features
- Perimeter calibration: turn-1 simulation with formula breakdown

### Recommended Solution

The selector spec as written in the Solution Generation section. Single design — no competing alternatives. The solution was constraint-driven: the selector's thin surface area, two-consumer model, and pure-function identity determined the design.

### Rationale

The selector exists for **separation of diagnostics**, not because selection is complex. The spec honors this by keeping the selector as thin as possible: 5 computed values, 1 constant, 0 internal state. Every edge case that could be delegated to the scorer *was* delegated. The score-perimeter cold-start is the single mechanism where the selector has an opinion — and even that opinion is score-driven, trusting the scorer's ranking rather than imposing energy-level knowledge.

**Remaining calibration need:** `COLD_START_PERIMETER = 0.08` is derived from estimated turn-1 scorer output. Must be validated against real scorer runs once the scorer is implemented.

---

## IMPLEMENTATION PLAN

### Implementation Approach

Three-phase implementation, each independently shippable. Phase 1 has zero dependencies and can start immediately. Each subsequent phase depends only on its predecessor's output.

### Action Steps

**Phase 1 — Selector Function + Types + Tests + Logging (no dependencies)**

| # | Action | Location | Notes |
|---|--------|----------|-------|
| 1.1 | Define `TerritorySelectorOutput` type | `packages/domain/src/types/` or co-located with selector | 6 fields, two consumer sections |
| 1.2 | Define `SelectionRule` union type | Same location | `"cold-start-perimeter" \| "argmax"` |
| 1.3 | Define `SessionPhase` union type | Same location | `"opening" \| "exploring" \| "closing"` |
| 1.4 | Define `TransitionType` union type | Same location | `"continue" \| "transition"` |
| 1.5 | Add `COLD_START_PERIMETER = 0.08` constant | `packages/domain/src/constants/` | Alongside other tunable constants |
| 1.6 | Implement `selectTerritory()` pure function | `packages/domain/src/utils/territory-selector.ts` | ~30 lines. Pure computation, same category as `ocean-code-generator.ts` |
| 1.7 | Implement deterministic seed hashing | Inside selector or shared util | `hash(userId + sessionId)` → seeded RNG |
| 1.8 | Implement structured logging | Co-located with selector | Log: selectionRule, selectionSeed, pool size (cold-start), selectedTerritory, sessionPhase, transitionType |
| 1.9 | Write ~12 unit tests with mock scorer output | `packages/domain/src/__tests__/` | All 3 code paths, all derivations, all edge cases (see test list in spec) |

**Phase 2 — Wire to Scorer + Validate Perimeter (after scorer ships)**

| # | Action | Notes |
|---|--------|-------|
| 2.1 | Wire scorer output → selector input in the assessment pipeline | Pipeline glue — selector consumes `TerritoryScorerOutput` |
| 2.2 | Integration test: scorer + selector end-to-end | Real scorer output → verify selector picks correctly |
| 2.3 | Validate cold-start pool sizes against real scorer output | Run scorer 10x on turn 1 with varied contexts, check pool sizes. Adjust `COLD_START_PERIMETER` if needed. ~30 min task. |

**Phase 3 — Wire to Governor + Backport Docs (after Governor implemented)**

| # | Action | Notes |
|---|--------|-------|
| 3.1 | Wire selector output → Governor input | Governor consumes 3 fields: selectedTerritory, sessionPhase, transitionType |
| 3.2 | End-to-end pipeline test: scorer → selector → Governor → Prompt Builder | Full pipeline verification |
| 3.3 | Backport 5 changes to parent territory policy spec | See backport table in this doc |
| 3.4 | Backport changes to conversation pacing design decisions doc | Move "Territory selector layer" from open to resolved |

### Milestones

| Milestone | Gate |
|-----------|------|
| **Phase 1 complete** | Selector function passes all ~12 unit tests, types exported, logging implemented |
| **Phase 2 complete** | Selector integrated with real scorer, perimeter validated against real turn-1 distributions |
| **Phase 3 complete** | Full Scorer → Selector → Governor → Prompt Builder pipeline operational, parent docs updated |

### Resource Requirements

- **Code:** ~30 lines selector function, ~100 lines tests, ~20 lines types/constants
- **Dependencies:** Phase 1 = none. Phase 2 = scorer implementation. Phase 3 = Governor implementation.
- **Calibration:** 30-minute perimeter validation task in Phase 2

### Responsible Parties

- **Selector implementation (Phase 1):** Solo dev task — pure function, no cross-team coordination needed
- **Pipeline integration (Phase 2-3):** Coordinated with whoever implements scorer and Governor
- **Doc backport (Phase 3):** Can be done by anyone with context on the design decisions

---

## MONITORING AND VALIDATION

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold-start pool size | 3-8 territories per session | Log pool size on every turn-1 selector call |
| Opener variety | No single territory selected > 25% of sessions | Aggregate cold-start selections across sessions |
| `selectionRule` correctness | Exactly 1 `"cold-start-perimeter"` + 24 `"argmax"` per 25-turn session | Count per session from logs |
| `sessionPhase` correctness | `"opening"` on turn 1, `"closing"` on turn 25, `"exploring"` otherwise | Verify from logs |
| Unit test coverage | 12/12 tests passing, all code paths covered | CI pipeline |
| Selector execution time | < 1ms per call | Pure function on 25 territories — should be sub-millisecond |

### Validation Plan

**Phase 1 validation (pre-integration):**
- All ~12 unit tests pass with mock scorer output
- Edge cases verified: totalTurns=1 priority, empty-ish pool fallback, seed determinism
- Structured logging outputs verified against expected format

**Phase 2 validation (post-scorer integration):**
- **Perimeter calibration task (~30 min):** Run scorer 10x on turn 1 with varied mock user contexts. Record pool sizes. If pool size is consistently < 3 or > 10, adjust `COLD_START_PERIMETER`.
- Integration test: real scorer output → selector → verify selectedTerritory is in ranked list, sessionPhase is correct, transitionType is correct
- Verify same seed produces same cold-start selection (replay test)

**Phase 3 validation (full pipeline):**
- End-to-end: scorer → selector → Governor → Prompt Builder produces valid Nerin system prompt
- Verify Governor receives only 3 selector fields (no leaky access to scorerOutput)
- Verify `"opening"` phase produces `intent: "open"` with `Relate>Reflect` modules only
- Verify `"closing"` phase produces `intent: "amplify"` with strongest available suggestions

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Perimeter too tight (pool = 1, no variety) | Medium — depends on real scorer output | High — identical openers across users | Monitor pool size from day 1. Adjust constant. |
| Perimeter too loose (medium/heavy openers) | Low — simulation shows light cluster is well-separated | Medium — suboptimal first impression | Monitor opener territory distribution. |
| Scorer output format changes | Low — contract is defined | High — selector breaks | Type-check at boundary. Selector's input is typed against `TerritoryScorerOutput`. |
| Seeded RNG produces poor distribution | Very low — standard seeded PRNG | Low — slight selection bias | Verify with statistical test across 1000 mock sessions |
| Governor needs more than 3 fields | Low — Governor is designed (Decision 12), 3 fields confirmed sufficient | Low — easy to add fields | `transitionType` and `sessionPhase` are extensible enums. `scorerOutput` passthrough available if needed. |

### Adjustment Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Pool size alarm** | Cold-start pool < 3 in > 50% of sessions | Increase `COLD_START_PERIMETER` |
| **Pool size alarm (loose)** | Cold-start pool > 10 in > 50% of sessions | Decrease `COLD_START_PERIMETER` |
| **Opener concentration** | Any single territory > 30% of cold-start selections | Investigate scorer's turn-1 ranking distribution |
| **Stuck loop signal** | > 5 consecutive "continue" in > 20% of sessions | Investigate scorer freshness/adjacency (not a selector fix) |
| **Scorer contract change** | `TerritoryScorerOutput` type changes | Update selector input handling, re-run all tests |

---

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
