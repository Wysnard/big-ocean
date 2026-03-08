# Problem Solving Session: Territory Policy Redesign

**Date:** 2026-03-07
**Problem Solver:** Vincentlay
**Problem Category:** Conversation Architecture / Policy Layer Design

---

## 🎯 PROBLEM DEFINITION

### Initial Problem Statement

The conversation pacing redesign successfully decoupled E_target (user-state-pure pacing) from coverage pressure, move generation, and portrait readiness. But this created a well-defined gap: **territory policy** — the layer that decides *where* the conversation goes next — has no principled design. The old system used implicit, LLM-led topic steering with assessment leakage (facet-steering, contradiction-as-default, coverage contaminating pacing). That approach is incompatible with the new architecture.

Territory policy is listed as an open question in the conversation pacing design decisions document:

> "Territory policy must be redesigned to consume E_target alongside coverage gaps, freshness, and late-session resonance. This is a separate design problem."

### Refined Problem Statement

**Design an event-driven territory policy that decides whether to stay in the current territory or transition to a new one, using E_target, coverage gaps, freshness, adjacency, and late-session resonance, while preserving conversational momentum and hiding assessment optimization.**

The irreducible problem, from first principles:

> At each transition point, pick the next topic such that (a) it fits the user's current energy capacity, (b) it improves portrait coverage over time, and (c) the transition feels natural.

The policy makes two decisions:
1. **Stay or shift** — should we keep exploring the current territory, or is it time to move?
2. **Where next** — if shifting, which territory scores highest given the current state?

**Layer boundary rule:** If a signal answers *"what can the user comfortably sustain right now?"* it belongs in the pacing layer. If it answers *"given that constraint, where should we go next?"* it belongs in territory policy. Territory policy consumes E_target as a finished output — it never reaches into pacing internals (energy, telling, drain, momentum).

**Inputs (v1):**
- **E_target** — what energy the user can sustain (from pacing layer, consumed as opaque output)
- **Coverage gaps** — which personality domains are under-observed (from silent scoring)
- **Freshness** — how recently each territory was visited (anti-repetition)
- **Adjacency** — how narratively close a candidate territory is to the current one (static, symmetric, catalog-authored)
- **Late-session resonance** — the user's most alive threads, applied as a late-stage override bonus in final exchanges only. Gated by session phase (turn number relative to session length); session phase exists solely to activate this mechanism, not as a general-purpose input.
- **Current-territory state** — `currentTerritory`, `turnsInCurrentTerritory` (feeds stay/shift decision)

**Deferred inputs (v2+):**
- **User-initiated direction** — when the user steers toward a topic, territory policy yields or blends. Deferred because no clean producer exists yet. Known limitation: the system self-corrects within 1-2 turns via move generation naturally following user content, then policy catching up on next exit-guard cycle. Candidate producers: ConversAnalyzer v3 field or lightweight intent detector.
- **Current-territory yield** — whether the current territory is still producing useful signal, distinct from turn count alone ("we've been here 3 turns" is not the same as "we're done here"). Candidate implementation: observed evidence rate vs expected yield from catalog. Deferred because it requires calibration data from real conversations.

**Three-layer architecture (scorer → selector → move generator):**

Territory policy is decomposed into two explicit sub-layers to preserve debuggability:

1. **Territory Scorer** — pure ranking engine. Runs the formula on all territories, returns sorted list with score breakdowns. No selection logic, no turn awareness.
2. **Territory Selector** — thin deterministic rule-based consumer. Picks from the ranked list based on explicit rules. Loggable, swappable, testable independently.
3. **Move Generator** — receives the selected territory + runner-ups for bridging/fallback. Never chooses the territory.

When something goes wrong: bad ranking → scorer bug. Good ranking, bad pick → selector rule. Good pick, bad execution → move generator. Each layer is independently diagnosable.

**Territory Scorer output contract:**
```
TerritoryScorerOutput {
  ranked: Array<{
    territoryId: TerritoryId
    score: number
    breakdown: { coverageGain, adjacency, skew, malus, freshness }
  }>  // sorted descending by score
  currentTerritory: TerritoryId | null
  turnNumber: number
}
```

**Territory Selector rules (v1):**
- Turn 1 (cold start): random selection from top candidates — prevents identical openers across users (social/sharing UX). Replaces GREETING_SEED_POOL. Exact selection strategy (fixed K, margin-based, score-weighted) is a selector design decision, separate from territory policy.
- Turn 2+: pick top-1 (deterministic argmax)
- Tiebreak: catalog order (deterministic, loggable)
- v2 candidates: tie-break strategy when top-2 within margin, user-direction override

**Territory Selector output contract:**
```
TerritorySelectorOutput {
  selectedTerritory: TerritoryId
  selectionRule: string              // "cold-start-top-k" | "argmax" | future rules
  alternates: TerritoryId[]          // runner-ups for move generator bridging/fallback
  stayOrShift: "stay" | "shift"     // derived: selected == current → stay
  scorerOutput: TerritoryScorerOutput // full ranking preserved for logging
}
```

Move generator receives `TerritorySelectorOutput` and uses `selectedTerritory` for steering, `alternates` for bridge phrasing and natural callbacks.

**Coverage value computation:** Coverage gaps are per-facet (from silent scoring). Territories yield multiple facets (from catalog). Territory policy computes per-territory coverage value by joining coverage gaps with each territory's expected facet yield: `coverageValue[t] = aggregate(gap[facet] for facet in t.expectedFacets)`. This join is a central mechanic of the scoring function, not a raw pass-through of coverage gaps.

**Execution model — unified per-turn scoring with deterministic selection:**
Every turn, the Territory Scorer runs the formula on all territories (including current) and returns a sorted ranked list. The Territory Selector then applies its rules to pick from that list — random top-K at cold start, deterministic top-1 thereafter. Move generator receives the selection plus alternates.

The current territory competes with a natural advantage: maximal self-adjacency (it is maximally adjacent to itself). Another territory must overcome this inertia with meaningfully better coverage gain, adjacency, or conversation skew to trigger a shift. No explicit currentBonus needed — adjacency-to-self provides sufficient stability.

Stay/shift emerges from the ranking rather than requiring separate exit logic. Exhaustion detection is free: as a territory's expected facets get covered through evidence, its coverageGain declines, and eventually another territory overtakes it. The selector derives `stayOrShift` from whether the selected territory equals the current one.

**Scope constraints:**
- The territory catalog is a fixed input for v1 — pre-defined thematic units with energy bands, expected facet yields, and properties for computing adjacency (life domains, facet tags). Dynamic territory generation is out of scope; catalog refinement happens post-observation.
- Adjacency is symmetric and computed from catalog properties for v1 — directed adjacency deferred to v2.
- Energy malus uses a continuous penalty function (no hard bands or gates). Shape of the penalty function to be determined during implementation.
- Adjacent territories should tend to have complementary expected facet yields (catalog authoring discipline, not a runtime guarantee).

**What territory policy is NOT:**
- Not a facet-level or trait-level selector (thematic units)
- Not where pacing lives (E_target is upstream, user-state-pure) — territory policy never reads raw energy, telling, drain, or momentum
- Not where move execution lives (move generator is downstream)
- Not a separate exit-guard mechanism — stay/shift emerges from the ranking
- Not where territory *selection* lives — the scorer ranks, the selector picks, the move generator executes. No layer does another's job.

### Problem Context

This problem sits at a critical junction in the new four-layer architecture:

| Layer | Status | Feeds Into |
|-------|--------|------------|
| **Pacing (E_target)** | Resolved — pipeline of transforms, user-state-pure | Territory Scorer |
| **Territory Scorer** | **This problem — pure ranking engine** | Territory Selector |
| **Territory Selector** | **This problem — deterministic pick rules** | Move Generator |
| **Move Generator** | Resolved — 4 move types (Pull/Bridge/Hold/Pivot) | Nerin's response |
| **Silent Scoring** | Resolved — extracts evidence, updates coverage | Territory Scorer (via coverage gaps) |

Key architectural constraints already locked:
- E_target is user-state-pure — no coverage, no phase, no time pressure
- Coverage pressure enters the system *only* through territory policy (Decision 3)
- Portrait readiness is read-only — never feeds back into E_target or territory scoring (Decision 9)
- Move generation is downstream — territory policy picks *where*, move generator picks *how*
- The priority hierarchy: protect user state > maintain momentum > quiet pressure for breadth
- Territory catalog is a fixed input for v1 — pre-defined thematic units, not dynamically generated

The current state is effectively **greenfield at the policy level** — the old assessment-first, facet-steered approach is being replaced wholesale.

**First-principles reduction:** The problem reduces to three fundamental requirements — energy fit, coverage progress, and transition quality. Everything else (catalog design, scoring weights, execution triggers) is implementation choice serving those three fundamentals.

**The artifact this problem must produce:**
1. **Territory schema** — the data model for each territory unit
2. **Stay/shift policy** — exit conditions and commitment logic
3. **Next-territory scoring** — combining energy fit, coverage value, freshness, adjacency, resonance
4. **Output contract** — selected territory + reason + diagnostics for downstream consumption

### Success Criteria

1. **Energy coherence** — selected territory's natural energy band fits E_target; the user never feels pushed into a territory that doesn't match their current state
2. **Invisible coverage** — coverage gaps improve over the session without the user sensing optimization; topic transitions feel natural, not extractive
3. **No assessment leakage** — topic choice never reveals the scoring engine; the conversation feels like guided self-discovery, not a structured interview
4. **Debuggability** — given the inputs, a human can trace *why* a territory was selected and *why* a shift was triggered; the policy is deterministic, not a black-box LLM decision
5. **Momentum preservation** — transitions between territories feel adjacent and motivated, not random or jarring; adjacency is modeled explicitly, not left to chance
6. **Natural pacing** — the stay/shift decision avoids per-turn rerolling and avoids overstaying exhausted territories; most visits should feel brief but substantive, though actual duration may vary by territory type
7. **User agency** (v1 soft goal) — when the user steers toward a topic, the system adapts gracefully. In v1, this is handled implicitly: move generation follows user content, territory policy self-corrects on next exit-guard cycle. Full explicit support deferred to v2 with UserDirection input.
8. **Completeness** — the artifact includes territory schema, stay/shift policy, next-territory scoring, and output contract with diagnostics

---

## 🔍 DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

**Where the problem IS:**
- Territory policy is the *only* layer where coverage pressure enters the conversation
- The problem occurs at **transition points** (exit guard fires) and at **session start** (cold start)
- Coverage, freshness, adjacency, and resonance all converge here — this is their only home
- The policy feeds two consumers: move generation (operational) and logging/diagnostics (debuggability)

**Where the problem IS NOT:**
- NOT within-topic behavior — move generation owns local variation between transitions
- NOT pacing — E_target is upstream and user-state-pure; territory policy consumes it as opaque output
- NOT signal extraction — silent scoring is separate; territory policy reads its outputs (coverage gaps)
- NOT move phrasing — how to enter a territory is move generation's craft

**When it happens / doesn't:**
- Full scoring runs only when the exit guard fires (lazy). The exit guard runs every turn (always-on). Between transitions, full scoring is silent but the guard is not.
- Cold start (turn 1) is a degenerate case of the same policy, not a separate system. Reduced inputs: no currentTerritory, no adjacency, no freshness history, resonance inactive, coverage gaps treated as uniform deficit across the catalog. Heavy reliance on opening-safe territories and E_target.

**Boundary decisions:**

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Cold start** | Same policy, degenerate mode — reduced input set, uniform coverage deficit, opening-safe territory preference | Avoids two topic-selection systems with different behaviors |
| **Single-territory sessions** | Not allowed by default — coverage back-pressure pushes the system to explore breadth. The policy must serve portrait/result requirements that need facet coverage across domains. | One territory for 25 exchanges would starve the portrait. Coverage pressure exists specifically to prevent this. |
| **Re-entry** | Territories are revisitable — freshness penalizes premature looping, resonance can justify intentional late-session return | Late-session resonance almost requires re-entry. Three cases: immediate re-entry (blocked by freshness), mid-session revisit (allowed if natural), late-session return (explicitly desirable when resonance is high). |
| **Current territory after shift** | Excluded from candidate set when exit guard fires a shift | If the guard decided to leave, re-selecting the same territory is a fake shift. The current territory is ineligible for that scoring cycle. |

### Root Cause Analysis

Five root causes of the old system's territory selection failures, each mapped to the new architecture's response:

| # | Root Cause | Description | New Architecture Response |
|---|-----------|-------------|--------------------------|
| 1 | **Fused layers** | Topic selection was an LLM side effect, not an explicit policy. The LLM made topic decisions as part of response generation — no separate layer, no tunability, no logging. | Explicit territory policy layer, separated from pacing (E_target), move generation, and silent scoring. |
| 2 | **Coverage leakage** | Assessment completeness was a first-class visible goal in every layer. Coverage pressure was in the pacing formula, which made the system "hunt" for thin facets in ways users could feel. | Coverage enters the system only through territory policy (Decision 3). E_target is user-state-pure. Coverage becomes topic choice pressure, not energy pressure. |
| 3 | **No adjacency model** | Transitions optimized for assessment value, not conversational coherence. The system knew which topics were assessment-valuable but not which were conversationally adjacent. Users detected the "hunting" pattern through jarring topic jumps. | Static symmetric adjacency as a first-class scoring input. Adjacency is the default coherence mechanism — a strong prior, not a prison. Non-adjacent transitions are penalized, not blocked. |
| 4 | **Facet-shaped entry** | Topics were entered with narrow probing prompts designed to harvest specific facets. This produced thin, single-axis evidence instead of rich multi-facet narratives. Even when territory choice was reasonable, the opener made the conversation feel clinical. | Territory schema includes experience-shaped opener guidance as a catalog-authoring constraint. Territories are thematic life experiences, not personality dimensions. Move generation consumes opener guidance; territory policy doesn't see it. |
| 5 | **No stay/shift model** | The system lacked a principled notion of when to remain in a topic vs. move on. Topic transitions happened whenever the LLM decided, producing both premature exits (mid-flow) and overstays (exhausted topics). | Two-phase execution: always-on exit guard (energy mismatch + turn limits) triggers lazy full scoring. Explicit stay/shift as the primary policy decision. |

**Preserving insight — dot-connecting:** The old system's strongest moments were when Nerin connected something the user said earlier to the current topic ("earlier you mentioned X, and now you're describing Y — there's a thread there"). These are Bridge moves in the new taxonomy. Adjacency-aware territory policy *creates conditions* for dot-connecting by selecting territories where natural connections exist. Adjacency doesn't just prevent awkwardness — it enables the system's most memorable moments.

### Contributing Factors

- **Single optimization target** — the old system treated assessment completeness and user experience as one optimization, making trade-offs invisible and untuneable
- **LLM as implicit policy** — without a deterministic policy layer, topic decisions were non-reproducible, non-debuggable, and sensitive to prompt phrasing
- **No territory abstraction** — without a thematic unit between "trait" and "the whole conversation," there was no natural anchor for freshness, adjacency, or coverage tracking
- **Assessment-first product frame** — the original product was conceived as a personality assessment with a conversation wrapper, which made assessment logic the default in every design choice

### System Dynamics

**Reinforcing loop (old system):** Coverage gaps → system steers toward thin facets → user feels assessed → user gives thinner, more guarded responses → coverage gaps widen → system steers harder. This is the core vicious cycle that the new architecture breaks by separating coverage pressure from pacing.

**Balancing loop (new design):** Coverage gaps → territory policy favors territories with high expected yield for thin facets → conversation moves to that territory at an energy the user can sustain → user engages naturally → rich multi-facet evidence emerges → coverage gaps narrow. The key difference: coverage pressure is expressed as *topic choice at comfortable energy*, not as *energy pressure toward uncomfortable topics*.

**Adjacency as coherence buffer:** When transitions are adjacent, even coverage-motivated moves feel natural. Adjacency absorbs the "hunting" feeling by making assessment-driven choices look like conversational logic. Without adjacency, modest coverage pressure feels extractive. With adjacency, significant coverage pressure can remain invisible.

**Dot-connecting as signal amplifier:** When Nerin connects prior user statements to the current territory (Bridge move), users feel seen rather than assessed. This often provokes voluntary deeper sharing — producing richer evidence than any direct question could. Adjacency-aware territory selection increases the frequency of natural Bridge opportunities.

---

## 📊 ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

| # | Force | Strength | Notes |
|---|-------|----------|-------|
| 1 | **Clean layer separation** | Strong | Architecture already locked: E_target upstream, move generation downstream, silent scoring separate. Territory policy has a well-defined box to fill. |
| 2 | **Fixed catalog for v1** | Strong | Scoring a known, finite set of territories is tractable. No dynamic generation complexity. |
| 3 | **Product frame internalized** | Strong | "Does this make the user feel seen or measured?" resolves ambiguity quickly. Cultural filter, not just a design principle. |
| 4 | **Two-phase execution** | Medium | Exit guard + lazy scoring simplifies runtime. Full scoring can be moderately expensive since it only runs at transition points. |
| 5 | **Clear success criteria** | Medium | Energy coherence, invisible coverage, no assessment leakage, debuggability — testable specs, not vague aspirations. |
| 6 | **Adjacency precedent** | Medium | Dot-connecting moments from the old system prove adjacency-aware transitions work for this product. Formalizing an existing strength, not inventing from scratch. |

**Restraining Forces (Blocking Solution):**

| # | Force | Strength | Influenceable? | Mitigation Path |
|---|-------|----------|----------------|-----------------|
| 1 | **Coverage vs coherence tension** | **Strong (central risk)** | Through scoring weights | This is the exact seam territory policy exists to resolve. Overweighting coverage makes topic choice feel like hunting. The tension is not incidental — it is the core design problem. |
| 2 | **Catalog quality dependency** | **Strong** | Through authoring discipline | Policy is only as good as territory energy bands, expected facet yields, adjacency relationships, and opener guidance. Wrong catalog data produces systematically wrong choices regardless of formula quality. |
| 3 | **Energy-band definition gap** | **Medium (blocking)** | Must resolve in solution design | Bounded sub-problem: map continuous E_target (0-10) to territory energy bands, define mismatch threshold. Solvable with reasonable v1 defaults + simulation. |
| 4 | **Stay/shift threshold brittleness** | **Medium** | Through threshold tuning | Too eager = restless scanning. Too sticky = overstaying and missing breadth. Both break the self-discovery frame. Distinct from energy-band mapping — timing of shifts matters as much as destination. |
| 5 | **No calibration data** | Medium | Only resolves with real users | Formula weights, adjacency graph, and energy bands are v1 defaults from first principles and simulation. Empirical tuning requires real conversations. |
| 6 | **Assessment leakage hard to verify** | Medium | Only resolves with real users | Easy to cause, hard to directly measure. "Invisible coverage" means testing for the absence of a feeling — a subjective, negative signal. |
| 7 | **Adjacency authoring subjectivity** | Low-Medium | Through iteration post-launch | Which territories are "adjacent" is a judgment call. Static symmetric adjacency + move generation's Bridge moves absorb some imperfections. Iterable after logs. |

**Central danger framing:** The most dangerous failure is not "we haven't mapped energy bands yet" — that's bounded engineering. The central danger is **territory policy accidentally becoming visible optimization again**. The two biggest vectors for that failure are: (1) overweighting coverage over coherence in the scoring function, and (2) relying on a weak catalog.

### Constraint Identification

**Hard constraints (non-negotiable):**
- **E_target is opaque** — territory policy consumes it as a finished number, never reaches into pacing internals
- **Coverage enters only through territory policy** — this is the architectural contract from Decision 3
- **Portrait readiness is read-only** — never feeds back into territory scoring (Decision 9)
- **Priority hierarchy** — protect user state > maintain momentum > quiet pressure for breadth
- **Fixed catalog for v1** — policy scores a pre-defined set, does not generate territories dynamically
- **No fake shifts** — if the formula selects a new territory, the current territory should not immediately win back on the next turn (freshness penalty handles this)

**Soft constraints (v1 design choices, revisable):**
- **Symmetric adjacency** — directed adjacency deferred to v2
- **No UserDirection input** — deferred; system self-corrects in 1-2 turns
- **No current-territory yield input** — deferred; coverageGain decline proxies for exhaustion in v1
- **Unified per-turn scoring** — replaces earlier two-phase exit-guard + lazy-scoring model

**Primary bottleneck (Theory of Constraints):** The scoring function's coverage-vs-coherence weighting is the constraint that limits the whole system. If coverage dominates, the conversation hunts. If coherence dominates, the portrait starves. Every other design choice is secondary to getting this balance right — and it will likely need per-archetype tuning that v1 can only approximate.

### Key Insights

1. **Coverage pressure is the system's biggest asset and biggest liability.** It's the only mechanism that ensures portrait completeness, but it's also the primary vector for assessment leakage. The scoring function must make coverage *quiet* — influential enough to guide topic choice over time, never strong enough to override adjacency and energy fit on any single transition.

2. **Adjacency is a coherence buffer, not just anti-jarring.** When transitions are adjacent, even coverage-motivated moves feel natural. Adjacency absorbs the "hunting" feeling by making assessment-driven choices look like conversational logic. This means adjacency quality directly determines how much coverage pressure the system can apply invisibly.

3. **The policy's real output is transition quality, not territory selection.** Selecting the "right" territory matters less than ensuring the *transition* feels natural. A slightly suboptimal territory choice with a smooth transition beats an optimal choice with a jarring jump. This argues for adjacency having meaningful weight relative to coverage.

4. **Catalog quality is a force multiplier — or divider.** The scoring function amplifies whatever the catalog says. Good catalog data makes a simple formula work well. Bad catalog data makes a sophisticated formula fail. Catalog authoring is not a downstream detail; it's a first-order dependency.

5. **Stay/shift should emerge from the formula, not from a separate guard.** Root cause #5 (no stay/shift model in the old system) is resolved by making the current territory compete in the same scoring pool as all others. Adjacency-to-self provides natural inertia; coverageGain decline provides natural exit. No explicit exit guard or currentBonus needed.

6. **Dot-connecting is the product's signature moment.** Bridge moves that connect prior user statements to new territory are the moments users remember. Adjacency-aware territory selection creates conditions for these moments. This is not a nice-to-have — it's the primary experiential differentiator.

---

## 💡 SOLUTION GENERATION

### Methods Used

- **Morphological Analysis** — decomposed the policy into five independent design axes (exit guard logic, energy-band mapping, coverage value computation, candidate scoring formula, resonance integration), enumerated options per axis, combined into candidate solutions
- **TRIZ Contradiction Resolution** — directly attacked the coverage-vs-coherence contradiction using inventive principles: Segmentation (distribute conflict across time), Merging (dissolve contradiction in catalog via complementary yields), Prior Action (front-load breadth at cold start), Dynamism (adaptive coverage weight)
- **First Principles Reduction** — stripped the policy to its irreducible requirement ("pick the next topic so it fits energy, improves coverage, and feels natural"), then rebuilt from minimal mechanisms
- **Multi-Agent Debate** — Winston (Architect), Dr. Quinn (Problem Solver), and Sally (UX Designer) challenged each candidate through architectural, systematic, and user-experience lenses, with an external agent providing adversarial review

### Generated Solutions

**Early candidates (from morphological analysis):**

1. **Pipeline Scorer with Soft Exit Guard** — energy gate → survivor scoring on coverage + adjacency + freshness → resonance override shortlist. Two-phase: exit guard + lazy scoring.
2. **Weighted Sum with Adaptive Coverage** — flat weighted sum with dynamic coverage weight that decreases as gaps narrow.
3. **Tiered Priority with Phase-Dependent Coverage** — score in priority order: energy → adjacency → coverage, with coverage ramping by session phase.
4. **Multiplicative Scorer with Catalog-Merged Coverage** — multiplicative formula where zero energy fit kills any candidate. Adjacency graph authored for complementary yields.
5. **Hybrid Pipeline with Front-Loaded Opening** — pipeline with energy gate, max-gap coverage, cold-start territory chosen for breadth.

**Divergent candidates:**

6. **Adjacency-First with Coverage Floor** — no per-transition coverage scoring; enforce coverage floor every N turns.
7. **Territory Planner (Multi-Step Lookahead)** — plan 2-3 territory path ahead, score holistically.
8. **User-Energy-Adaptive Coverage** — coverage weight inversely proportional to how constrained E_target is.
9. **Freshness-as-Adjacency** — collapse freshness and adjacency into one "effective freshness" term.
10. **Stochastic Selection with Top-K** — deterministic scoring, but sample from top 3 weighted by scores for natural variation.

**Evolved candidates (from iterative debate):**

11. **Unified Per-Turn Argmax** — one formula for all territories including current. Adjacency-to-self provides natural inertia. No exit guard, no pipeline, no special cases. coverageGain decline drives natural exit.
12. **Split StayValue / SwitchValue** — separate formulas for staying vs switching, with explicit yieldRemaining and localMomentum terms for the current territory. Cold start handled by separate formula.

### Creative Alternatives

**TRIZ Merging (catalog-level resolution):** Author the territory catalog so that adjacent territories have complementary expected facet yields. This dissolves the coverage-vs-coherence contradiction in the catalog rather than the formula — following the adjacency path *is* improving coverage. Adopted as a catalog authoring discipline, not a formula mechanism.

**Adjacency as computed formula:** Instead of hand-authored pairwise adjacency, compute adjacency from territory properties: `adj(a,b) = 0.8 * domainSimilarity(a,b) + 0.2 * facetSimilarity(a,b)`. Automatically scales with catalog changes. Adopted.

**coverageGain reusing existing scoring pipeline:** Instead of inventing a new coverage metric, reuse the existing per-facet `priority_f = α × confidenceDeficit + β × signalPowerDeficit` from the steering computation. Signal power already captures life-domain diversity. No trait-level urgency multiplier needed. Adopted.

---

## ⚖️ SOLUTION EVALUATION

### Evaluation Criteria

1. **Simplicity** — fewer terms, fewer coefficients, fewer special cases
2. **Alignment with existing scoring** — reuses codebase metrics, doesn't invent parallel ontology
3. **Architectural coherence** — respects layer boundaries, priority hierarchy, and E_target opacity
4. **Debuggability** — one score vector per turn, traceable decisions
5. **Assessment leakage resistance** — coverage pressure stays quiet, energy constraint stays clean
6. **Catalog dependency** — how much does the formula's quality depend on catalog accuracy?
7. **Tuning surface** — how many knobs, how do they interact?

### Solution Analysis

| Candidate | Simplicity | Alignment | Leakage Risk | Debuggability | Tuning Surface |
|-----------|-----------|-----------|--------------|---------------|----------------|
| Pipeline + Exit Guard (#1) | Medium — 8 mechanisms | Good | Medium — exit guard adds complexity | Medium — two-phase logging | Medium — guard + scorer |
| Weighted Sum + Adaptive Coverage (#2) | Medium | Good | High — adaptive weight can push energy | Good — one formula | High — many coefficients |
| Tiered Priority (#3) | Low — discrete tiers | Fair | Medium — phase ramp detectable | Low — tier logic opaque | Medium |
| Split Stay/Switch (#12) | Low — 3 formulas, 10+ coefficients | Fair — yieldRemaining needs new data | Medium | Low — comparing different formulas | Very High |
| **Unified Per-Turn Argmax (#11)** | **High — 5 terms, 0 constants** | **Excellent — reuses priority_f + expectedEnergy** | **Low — energy stays clean** | **Excellent — one score vector** | **Low — few knobs** |

### Recommended Solution

**Unified Per-Turn Argmax Scorer**

This is a real architectural departure from the earlier two-phase exit-guard + lazy-scoring model. The formula replaces eight separate mechanisms (exit guard, minTurns, maxTurns, adjacency tiers, coverage backstop, resonance override, cold-start mode, graceful degradation) with one unified five-term scoring formula run every turn. Zero extra catalog properties beyond what already exists (expectedEnergy, expectedFacets, life domains).

#### The Formula

```
For each territory t (all territories, no exclusions):

  --- Coverage Gain (source-normalized, reuses existing per-facet priority) ---
  priority_f = α × max(0, C_target - confidence_f)
             + β × max(0, P_target - signalPower_f)
  priority_max = α × C_target + β × P_target
  baseYield(t, f) = 1 / |t.expectedFacets|          // normalized: Σ baseYield = 1 per territory
  coverageGain(t) = sqrt(sum(baseYield(t, f) * priority_f / priority_max for f in t.expectedFacets))
  // bounded [0, 1] — at cold start all territories score equally regardless of facet count

  --- Adjacency (Jaccard similarity from catalog properties) ---
  domainSimilarity(a, b) = |a.domains ∩ b.domains| / |a.domains ∪ b.domains|
  facetSimilarity(a, b)  = |a.expectedFacets ∩ b.expectedFacets| / |a.expectedFacets ∪ b.expectedFacets|
  adjacency(t) = 0.8 × domainSimilarity(current, t) + 0.2 × facetSimilarity(current, t)

  --- Conversation Skew (v1: energy-based U-shape) ---
  sessionProgress = turnNumber / totalTurns
  conversationSkew(t) =
    (1 - t.expectedEnergy) × max(0, 1 - sessionProgress / 0.2)
  + t.expectedEnergy       × max(0, (sessionProgress - 0.7) / 0.3)

  --- Energy Malus (quadratic, no coverage dampening) ---
  energyMalus(t) = w_e × (t.expectedEnergy - E_target)²

  --- Freshness Penalty (linear decay, derived from message history) ---
  turnsSinceLastVisit = currentTurn - lastTurnInTerritory(t)  // from assessment_message.territory_id
  freshnessPenalty(t) =
    0                                                    if t == currentTerritory
    max(0, w_f × (1 - turnsSinceLastVisit / cooldown))  otherwise
  // never-visited territories: turnsSinceLastVisit = ∞ → penalty = 0

  --- Final Score ---
  score(t) = coverageGain(t) + adjacency(t) + conversationSkew(t)
           - energyMalus(t) - freshnessPenalty(t)

Output: all territories sorted descending by score, with full breakdown per term.
Selection is NOT the scorer's concern — the Territory Selector consumes this ranking.
```

#### Catalog Schema Change

The existing Territory type uses discrete `energyLevel: "light" | "medium" | "heavy"`. The formula requires continuous `expectedEnergy: number` (range `[0, 1]`) for both `energyMalus` and `conversationSkew`. Decision: **replace** `energyLevel` with `expectedEnergy` entirely — no dual fields, no transition period. The old DRS/scorer system (`territory-scorer.ts`, `drs.ts`) and prompt builder energy guidance will be removed as part of the full pipeline redo.

Existing catalog (22 territories) gets a one-time authoring pass to assign numeric values. Rough mapping from the old discrete levels as starting points:
- Former "light" territories → `0.2 – 0.35`
- Former "medium" territories → `0.4 – 0.6`
- Former "heavy" territories → `0.65 – 0.85`

Values within each band vary per territory based on emotional weight (e.g., `EMOTIONAL_AWARENESS` at 0.55 vs `SPONTANEITY_AND_IMPULSE` at 0.45).

#### Component Assessment

**1. coverageGain(t)**

| Aspect | Detail |
|--------|--------|
| **Strengths** | Reuses existing per-facet priority signal (confidence + signalPower deficit). Source-normalized: `baseYield = 1/n` per territory ensures all territories have equal yield budget — broad territories no longer win by naming more facets. `priority_max` normalization bounds output to `[0, 1]`. sqrt concave transform prevents one territory dominating on a few high-priority facets. |
| **Weaknesses** | Uniform baseYield assumes all expected facets in a territory are equally likely to surface. In practice, some facets may be more reliably elicited than others. Refinable in v2 with per-facet yield weights from real session data. |
| **Rejected alternatives** | Max-gap (hunting), trait urgency multiplier (pulls toward heavy-energy territories for drained users), raw sum without concave (one territory dominates), unnormalized baseYield (facet-count advantage at cold start) |

**2. adjacency(current, t)**

| Aspect | Detail |
|--------|--------|
| **Strengths** | Jaccard similarity on catalog sets — no O(n²) lookup, no hand-authored pairs. Self-adjacency = 1.0 (Jaccard of identical sets). Domain-heavy (0.8 weight) means adjacent territories share life context while allowing complementary facet yields. Symmetric by definition. |
| **Weaknesses** | 0.8/0.2 domain/facet split is a v1 guess. Narrative adjacency through contrast not captured. Jaccard treats all domains/facets as equally weighted — a territory sharing "work" is as adjacent as one sharing "childhood". |
| **Rejected alternatives** | Pairwise lookup (brittle), facet-heavy adjacency (psychological-neighborhood trap), discrete tiers (complexity without benefit) |

**3. conversationSkew(t)**

| Aspect | Detail |
|--------|--------|
| **Strengths** | One mechanism handles cold-start bias AND late-session depth. Uses existing `expectedEnergy` — zero new catalog properties. Linear ramps, two breakpoints, fully deterministic. Middle phase is quiet (zero skew) letting coverageGain and adjacency drive organically. |
| **Weaknesses** | Breakpoints (0.2, 0.7) are v1 guesses. Middle is fully zero — may need a "whisper" of narrative texture in v2. Late ramp start and steepness need calibration from real sessions. |
| **v2 refinements** | Sophia (Storyteller) suggests: (a) add subtle middle texture, (b) start late ramp earlier (~turn 17), (c) track peak contrast. All deferred — revisit with storytelling lens once other mechanisms are testable. |
| **Rejected alternatives** | Separate lightAffinity/depthAffinity catalog properties (redundant with expectedEnergy, extra maintenance), separate resonance override (too binary), peakAliveByTerritory tracking (runtime state complexity for v1) |

**4. energyMalus(t)**

| Aspect | Detail |
|--------|--------|
| **Strengths** | Quadratic shape: tolerant of small mismatches (d=0.1 → 0.01w), punishes large ones hard (d=0.5 → 0.25w). No coverage dampening — energy constraint stays clean. Preserves E_target opacity. Continuous, no hard gate. |
| **Weaknesses** | `w_e` weight needs calibration. expectedEnergy is a single number but some territories span a range. Under extreme starvation, may never reach distant-energy territories. |
| **Rejected alternatives** | Linear (small mismatches too expensive, discourages natural drift), square root (not protective enough for large distances), coverage-dampened malus (smuggles assessment into energy), hard gate (wastes continuous signal), discrete bands (cliff effects) |
| **Open question** | Monitor for domains reachable only through high-energy territories when user is sustained low-energy. Accept for v1. |

**5. freshnessPenalty(t)**

| Aspect | Detail |
|--------|--------|
| **Strengths** | Linear decay with two tunable knobs (`w_f`, `cooldown`). Current territory exempt. Derived from existing `assessment_message.territory_id` — zero new storage. Never-visited territories pay no penalty. Late-session resonance (via conversationSkew) can overcome a partially-decayed penalty for meaningful revisits. |
| **Weaknesses** | `w_f` and `cooldown` need calibration. Linear decay is a v1 simplification — exponential would be smoother but adds a parameter. Doesn't distinguish exhausted vs briefly visited territories (coverageGain handles this indirectly). |
| **Rejected alternatives** | No freshness (oscillation risk), visit-duration-weighted (complexity without sufficient benefit), exponential decay (marginal benefit for v1, extra parameter) |

**currentBonus — REMOVED**

Dropped because adjacency-to-self already provides maximal inertia for the current territory. The current territory is maximally adjacent to itself, which is sufficient stability. Adding ε on top was redundant — and removing it means the formula has one fewer constant and one fewer term to explain.

#### Monitoring safeguards (observability, not constraints)

For v1, add logging for observability (no hard gates):
- Log if territory visit exceeds 8 turns (potential cluster trap — check adjacency paths and catalog domain coverage)
- Log consecutive shifts with adjacency scores — consecutive shifts with high adjacency and high E_target are healthy (energized user, flowing conversation). Consecutive shifts with low adjacency suggest a tuning issue.
- Log if same domain persists > 5 consecutive turns (domain-cluster monitoring)
- These inform calibration, not constrain the formula

### Rationale

**Why unified argmax over pipeline/exit-guard:**
The pipeline model required eight mechanisms (exit guard, min/max turns, adjacency tiers, coverage backstop, resonance override, cold-start mode, graceful degradation) that the unified formula handles with five terms. Fewer mechanisms = fewer interactions = fewer edge cases = better debuggability. The formula produces one score vector per turn — a single artifact that explains every decision.

**Why no trait urgency:**
Per-facet priority already captures information need. If a whole trait is untouched, all its facets have maximal individual priority — a territory covering several of them naturally scores high on coverageGain. Trait urgency multipliers risk pulling toward heavy-energy territories (e.g., Neuroticism facets clustering in heavy territories) for drained users, reintroducing visible optimization through the back door.

**Why no coverage dampening on energyMalus:**
Coverage weakening the energy constraint is assessment pressure sneaking into user-state protection. Whether the push comes from E_target contamination or energy-malus dampening, the user feels the same thing: "the system is pushing me harder." Coverage competes honestly through coverageGain — if it's large enough, it can overcome moderate energy malus naturally. It should never *reduce* the malus itself.

**Why computed adjacency:**
Hand-authored pairwise adjacency doesn't scale and is brittle to catalog changes. Domain-heavy computed adjacency (80% domain similarity + 20% facet similarity) ensures adjacent territories are narratively close while allowing complementary facet yields — meaning following the adjacency path naturally broadens coverage.

**Why reuse existing per-facet priority:**
The codebase already computes exactly what territory policy needs: "how much would the portrait gain from more evidence on this facet?" The priority signal combines confidence deficit AND signal-power deficit (life-domain diversity). Inventing a second coverage metric would create a parallel scoring ontology that could diverge from the real portrait quality metric.

---

## 🚀 IMPLEMENTATION PLAN

### Implementation Approach

**Bottom-up, pure-function-first.** Build the scorer and all term functions as isolated pure functions with full test coverage. No pipeline wiring in this phase — the scorer takes typed inputs and returns a ranked list. Pipeline redo (wiring E_target, facetMetrics, replacing old DRS/scorer, connecting to move generator) is a separate effort.

Every function is deterministic: same inputs → same output. No IO, no side effects. Testable without database, without LLM, without running server.

### Action Steps

**Phase 1: Territory Scorer (independent, no pipeline dependency)**

**Step 1 — Foundation (no dependencies, parallelizable)**
- [ ] Add `expectedEnergy: number` to `Territory` interface, remove `energyLevel: EnergyLevel`
- [ ] Migrate all 22 catalog entries from discrete `energyLevel` to numeric `expectedEnergy`
- [ ] Create `jaccard-similarity.ts` — `jaccardSimilarity<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): number`
- [ ] Create scorer config with named constants: `w_e, w_f, cooldown, adjDomainWeight, adjFacetWeight, skewEarlyBreak, skewLateBreak`
- [ ] Unit tests: Jaccard (empty, identical, partial, disjoint sets), config validation

**Step 2 — Term functions (depends on Step 1)**
- [ ] `computeAdjacency(a: Territory, b: Territory, config): number` — Jaccard on domains + facets, weighted
- [ ] `computeConversationSkew(territory, turnNumber, totalTurns, config): number` — energy-based U-shape
- [ ] `computeEnergyMalus(territory, eTargetNormalized, config): number` — quadratic
- [ ] `computeFreshnessPenalty(territoryId, currentTerritoryId, visitHistory, currentTurn, config): number` — linear decay
- [ ] Extract `computeFacetPriority(facetMetrics, config): Map<FacetName, number>` from existing `computeSteeringTarget` — refactor, not rewrite
- [ ] `computeCoverageGain(territory, facetPriorities, config): number` — source-normalized, bounded [0,1]
- [ ] `deriveVisitHistory(messages): Map<TerritoryId, number>` — derives last-visit-turn from message history
- [ ] Unit tests per function: known inputs → expected outputs, boundary values, monotonicity checks

**Step 3 — Scorer orchestration (depends on Step 2)**
- [ ] `scoreAllTerritories(input: TerritoryScorerInput): TerritoryScorerOutput` — runs all 5 terms on all territories, returns sorted ranked list with per-term breakdowns
- [ ] Test with simulation scenarios: cold start, mid-session shift, drained user, late-session resonance
- [ ] Test with stress tests: E_target extremes, rich first message, domain-cluster, near-complete coverage
- [ ] Verify all terms bounded [0,1], total score is interpretable

**Step 4 — Selector (depends on Step 3)**
- [ ] `selectTerritory(scorerOutput: TerritoryScorerOutput, turnNumber): TerritorySelectorOutput` — turn 1 random from top candidates, turn 2+ deterministic top-1, tiebreak by catalog order
- [ ] Derives `stayOrShift` from selected vs current
- [ ] Passes alternates (runner-ups) for move generator
- [ ] Unit tests: cold-start randomness (verify selection from top candidates), deterministic selection, tiebreak

**Phase 2: Pipeline Wiring (separate effort — pipeline redo)**

- [ ] Wire `computeETarget().eTarget / 10` as scorer input
- [ ] Wire `computeFacetMetrics()` → `computeFacetPriority()` as scorer input
- [ ] Wire session messages → `deriveVisitHistory()` as scorer input
- [ ] Replace old `territory-scorer.ts` and `drs.ts`
- [ ] Replace `GREETING_SEED_POOL` / `COLD_START_TERRITORIES` with selector
- [ ] Remove `energyLevel` / `EnergyLevel` from all consumers (39 files)
- [ ] Wire selector output → move generator input
- [ ] Add observability logging: per-turn score vectors, selection rule, shift events, monitoring safeguards
- [ ] Integration tests: end-to-end scorer → selector → move generator with mock LLM

### File Locations

All new files in `packages/domain/src/utils/steering/`:

| File | Contents |
|------|----------|
| `jaccard-similarity.ts` | Generic Jaccard utility |
| `territory-scorer.ts` | Replaces existing file — new unified scorer |
| `territory-selector.ts` | New — deterministic selection rules |
| `scorer-config.ts` | Named constants, v1 defaults |

Reused/modified files:
| File | Change |
|------|--------|
| `packages/domain/src/types/territory.ts` | `expectedEnergy` replaces `energyLevel` |
| `packages/domain/src/constants/territory-catalog.ts` | Numeric energy values |
| `packages/domain/src/utils/formula.ts` | Extract `computeFacetPriority` as public function |

### Resource Requirements

**Existing codebase resources consumed:**
- `computeFacetMetrics()` — evidence → per-facet confidence + signalPower
- `computeETarget()` — pacing state → E_target
- `assessment_message.territory_id` — visit history source
- Territory catalog with domains + expectedFacets
- `FacetName`, `TerritoryId` branded types

**New dependencies:** None. Pure TypeScript, no new packages.

**Test infrastructure:** Existing `@effect/vitest` setup. Simulation scenarios and stress tests become fixture-driven unit tests.

### Milestones

| Milestone | What it proves |
|-----------|---------------|
| All term functions pass unit tests | Individual formula components are correct |
| Scorer passes simulation scenarios (4) | Formula produces intended behavior for normal cases |
| Scorer passes stress tests (6+) | Formula handles edge cases without pathological behavior |
| Selector passes unit tests | Selection rules work correctly |
| **Phase 1 complete** | **Scorer + selector are production-ready, awaiting pipeline wiring** |
| Pipeline wiring complete | Old system replaced, new scorer live |
| Observability logging active | Score vectors visible in logs for calibration |

---

## 📈 MONITORING AND VALIDATION

### Success Metrics

**Unit-level (Phase 1 — testable before pipeline wiring):**

| Metric | Target | How to measure |
|--------|--------|---------------|
| All terms bounded [0, 1] | 100% of scored territories, every test case | Assertion in scorer: each term in range |
| Cold start selects light territory | Top-3 scored territories have expectedEnergy < 0.4 | Simulation test with uniform coverage |
| Drained user protection | No territory with energyMalus > 0.25 appears in top-3 when E_target < 0.2 | Stress test fixture |
| Self-adjacency stability | Current territory holds for 2+ turns when coverageGain is still moderate (> 0.5) | Simulation scenario 2 |
| Coverage exhaustion triggers shift | When current territory coverageGain drops below 0.3, a different territory wins | Simulation scenario with declining priority_f |
| Late-session depth | At sessionProgress > 0.8, high-energy territories rank higher than at sessionProgress 0.5 | Comparative test across turn numbers |

**Session-level (Phase 2 — observable after pipeline wiring):**

| Metric | Target | How to measure |
|--------|--------|---------------|
| Territory diversity per session | ≥ 5 distinct territories visited in a 25-turn session | Log analysis: count distinct territory_id per session |
| Domain coverage | ≥ 4 of 5 steerable life domains touched per session | Log analysis: unique domains from visited territories |
| Facet coverage | ≥ 25 of 30 facets have evidence by session end | Existing facetMetrics: count facets with confidence > 0 |
| Average adjacency on shifts | Mean adjacency score > 0.3 on territory transitions | Log analysis: adjacency term on shift events |
| Energy coherence | Mean energyMalus across session < 0.1 | Log analysis: average malus per turn |
| No consecutive low-adjacency shifts | < 2 shifts in a row with adjacency < 0.15 | Log monitoring |

**User-level (qualitative — requires real conversations):**

| Signal | What to look for |
|--------|-----------------|
| Assessment leakage | Users reporting feeling "tested" or "interviewed" — primary failure mode |
| Transition quality | Do topic shifts feel natural or jarring? Adjacency proxy but needs human validation |
| Session satisfaction | Overall conversation experience rating, if collected |
| Domain-cluster boredom | Users disengaging mid-cluster — sign of overstaying |

### Validation Plan

**Tier 1: Unit validation (Phase 1)**
- All term functions pass boundary and monotonicity tests
- Scorer passes the 4 simulation scenarios designed during elicitation
- Scorer passes the 6+ stress tests designed during elicitation
- Selector correctly applies cold-start randomization and deterministic selection

**Tier 2: Synthetic session validation (Phase 1, no pipeline)**
- Run the scorer against a sequence of 25 synthetic turns with scripted facetMetrics progressions
- Verify: territory diversity, domain coverage, shift timing, energy protection
- Compare output against hand-traced expected behavior
- This is a "paper session" — scorer runs in a loop with manually evolving inputs

**Tier 3: Integration validation (Phase 2, after pipeline wiring)**
- Run with `MOCK_LLM=true` — deterministic mock responses, real scorer in the pipeline
- Verify end-to-end: E_target → scorer → selector → move generator receives correct territory
- Verify observability: score vectors appear in structured logs
- Verify old system removal: no references to DRS, old territory-scorer, GREETING_SEED_POOL

**Tier 4: Real conversation validation (post-deployment)**
- Small batch of real conversations (5-10) with log analysis
- Check session-level metrics against targets
- Check for assessment leakage signals in conversation transcripts
- First calibration pass: review `w_e` and adjacency split based on observed behavior

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **`w_e` too high — monotone energy band** | Medium | High — boring conversations stuck in one energy range | Monitor energy diversity per session. If < 2 energy bands visited, reduce `w_e`. v1 default (1.0) may need to drop to 0.5-0.8. |
| **Domain-cluster trap** | Medium | Medium — 40% of session in one domain cluster | Monitor domain persistence. Primary fix: catalog domain tagging (add cross-domain tags to single-domain territories). Secondary: reduce adjacency domain weight. |
| **Catalog baseYield inaccuracy** | Medium | Medium — territories may not actually elicit expected facets | Post-session analysis: compare expected facets per territory vs actually extracted facets. Refine catalog based on empirical facet yield data. |
| **Self-adjacency too sticky** | Low-Medium | Medium — territories hold too long, conversation feels stuck | Monitor average turns-per-territory. If consistently > 5, consider reducing adjacency weight or adding gentle coverage pressure. |
| **Coverage too aggressive** | Low | High — assessment leakage, user feels tested | Monitor shift rationale in logs. If shifts consistently have high coverageGain delta and low adjacency, coverage is overriding coherence. Reduce `α` or `β`. |
| **Late-session skew too weak/strong** | Low | Low — first/last few turns affected, middle unaffected | Monitor territory energy distribution by session phase. Adjust breakpoints (0.2, 0.7) or expectedEnergy values. Low-priority tuning. |
| **Priority extraction changes behavior** | Low | Medium — refactoring `computeFacetPriority` out of `computeSteeringTarget` could introduce subtle differences | Snapshot test: extracted function produces identical output to inline computation for all test fixtures. |

### Adjustment Triggers

**When to tune weights (data-driven, not speculative):**

| Trigger | Observed signal | First knob to turn |
|---------|----------------|-------------------|
| Conversations feel monotone | < 2 energy bands per session, low territory diversity | Reduce `w_e` (energy malus too protective) |
| Transitions feel jarring | Mean adjacency on shifts < 0.2 | Increase adjacency weight, or review catalog domain tags |
| User reports feeling assessed | Shifts correlate with high coverage delta, low adjacency | Reduce `α`/`β` in priority_f, or increase adjacency weight |
| Territories overstay | Average turns-per-territory > 5 | Review coverageGain decline rate — may need steeper drop, or catalog facet counts may be too broad |
| Domain stuck | Same domain > 5 consecutive turns | Add cross-domain tags to isolated territories in catalog |
| Late session lacks depth | Heavy territories never selected after turn 18 | Increase late breakpoint sensitivity (lower 0.7 to 0.65) or check E_target — user may be consistently drained |
| Cold start always picks same territory | Selector randomization not providing variety | Review top-K spread — if scores are too far apart, adjust skew or malus at cold start |

**Calibration priority order:**
1. `w_e` — most sensitive, most user-facing
2. Adjacency split (0.8/0.2) — transition quality
3. `w_f` / `cooldown` — anti-looping (tune together)
4. Skew breakpoints — low sensitivity, defer to storytelling pass
5. `α` / `β` / `C_target` / `P_target` — inherited, only touch if coverage behavior is fundamentally wrong

---

## 📝 LESSONS LEARNED

### Key Learnings

1. **Simulate before you ship.** The cold-start simulation caught a fundamental scaling bug (coverageGain dominated by facet count) that would have been invisible in code review. Source-normalizing baseYield was the fix — discovered by running numbers, not reasoning abstractly.

2. **Layer boundaries are the architecture.** The most impactful decisions weren't formula terms — they were where to draw boundaries. Scorer vs selector vs move generator. Pacing vs territory policy. Every time a concern leaked across a boundary (telling in territory policy, coverage dampening energyMalus, move generation choosing territories), the design got worse. Every time we enforced the boundary, it got cleaner.

3. **Reuse existing signals aggressively.** The formula reuses `priority_f`, `expectedEnergy`, `assessment_message.territory_id`, Jaccard on catalog properties. Zero new storage, zero new metrics. The existing codebase already computed what territory policy needed — we just hadn't wired it.

4. **Drop mechanisms, don't add them.** The design evolved by removing: trait urgency (back-door energy pressure), currentBonus (redundant with self-adjacency), coverage dampening (smuggled assessment into energy), exit guard (replaced by unified scoring), lightAffinity/depthAffinity (redundant with expectedEnergy). The final formula has fewer terms than any intermediate version.

5. **User experience reasoning resolves technical ambiguity.** "If users compare notes and everyone got the same first question" broke a tie between deterministic and randomized cold start. "Nerin suggesting childhood callbacks is move generation's craft, not territory selection" resolved the lightAffinity/depthAffinity debate. Product thinking cut through technical analysis multiple times.

6. **Catalog quality is architecture.** The formula amplifies whatever the catalog says. Domain-cluster traps, adjacency quality, facet yield accuracy — all catalog concerns that the formula can't compensate for. Catalog authoring discipline is a first-order dependency, not a downstream detail.

### What Worked

- **Multi-agent debate (party mode)** — Winston catching architectural leaks, Dr. Quinn verifying mathematical properties, Sally grounding decisions in user experience. Different lenses on the same problem prevented tunnel vision.
- **External agent as adversarial reviewer** — caught the coverageGain scaling bug, proposed source normalization, challenged the two-option framing (normalize vs raw weights) with a third option (fix at source). Independent perspective broke groupthink.
- **Simulation-driven design** — designing test scenarios *before* implementation turned abstract formula discussions into concrete "does this number feel right?" conversations. The 4 simulation scenarios and 6+ stress tests are now the test suite.
- **First principles reduction** — stripping the problem to "pick the next topic so it fits energy, improves coverage, and feels natural" kept every discussion grounded. When mechanisms got complicated, returning to this sentence resolved it.
- **Storyteller perspective (Sophia)** — deferred conversationSkew refinement to a storytelling-informed pass. Correctly identified that narrative arc tuning requires feeling the system work first, not designing in the abstract.

### What to Avoid

- **Designing for hypothetical users before building for real ones.** We spent significant time on weight sensitivity analysis, but the real calibration will come from 5-10 real sessions. v1 defaults are educated guesses — don't over-optimize them before data exists.
- **Adding mechanisms to fix mechanisms.** The exit guard → exit guard + coverage backstop → exit guard + backstop + resonance override spiral was the old system's failure mode. The unified formula works because it replaced that spiral with one equation. Resist adding special cases.
- **Conflating layers.** Every time territory policy tried to handle a move generation concern (opening variety, storytelling callbacks, user-direction following) or a pacing concern (telling, drain), the design degraded. Trust the layer boundaries.
- **Discrete tiers where continuous works.** energyLevel → expectedEnergy, adjacency tiers → Jaccard, session phases → continuous skew. Every discretization created cliff effects or special cases. Continuous by default, discretize only when there's a strong reason.
- **Normalizing at the wrong level.** Per-turn min-max normalization was tempting but would have destroyed debuggability. Source normalization (bound each term at construction) preserved interpretable, cross-turn-comparable scores.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
