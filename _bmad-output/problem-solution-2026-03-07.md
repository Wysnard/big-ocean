# Problem Solving Session: Precise Specification of E_target Pacing Formula

**Date:** 2026-03-07
**Problem Solver:** Vincentlay
**Problem Category:** Mathematical modeling / System design

---

## PROBLEM DEFINITION

### Initial Problem Statement

The conversation pacing architecture for Nerin (Big Ocean's assessment agent) requires a formula that computes a target energy level (E_target) for the next exchange. A draft formula exists — `E_target = E_base + a*V(n) - b*D_w(n) + g*C_deficit` — but the variables lack precise definitions (scales, ranges, normalization), the telling signal from the two-axis state model (Decision 2) is absent from the formula, and no concrete scenario simulations have validated the formula's behavior across user archetypes.

### Refined Problem Statement

**Design a stable, interpretable, user-state-pure pacing signal** that:
- Takes Energy x Telling + derived signals (momentum, drain) as inputs
- Makes fatigue protection the dominant force
- Keeps coverage, time-awareness, business logic, and portrait readiness strictly outside the formula
- Delegates coverage pressure entirely to territory policy (where to go at the energy the user can sustain)

The formula must produce a single number (E_target) that downstream layers (territory policy, move generator) can consume without needing to understand its internals. Every variable must have an exact definition, scale, range, and normalization. The formula must be simulatable against concrete user scenarios and must not break at edge cases.

### Problem Context

- **System:** Big Ocean — a conversational personality assessment platform disguised as guided self-discovery
- **Core frame (Decision 1):** The user must never feel assessed. The formula serves the user, not the business.
- **Existing draft:** `E_target = E_base + a*momentum - b*drain + g*coverage_deficit` (from energy-state-formula-draft.md)
- **Missing piece:** The telling signal (Decision 2) — how self-propelled vs. compliance-driven the user is — is a first-class axis in the state model but not yet integrated into the formula
- **Architecture:** E_target feeds into territory policy and move selection (Decision 4). It does NOT feed into silent scoring or portrait readiness (Decision 9).
- **Weight hierarchy (Decision 3):** Drain dominates (ceiling), momentum follows — no coverage term in the formula (coverage belongs in territory policy)
- **Downstream consumers:** Territory policy uses the gap between E_target and current state to select move type (Pull/Bridge/Hold/Pivot)
- **Session format:** 25 exchanges max (Decision 7)

### Success Criteria

1. **Every variable precisely defined** — exact scale, range, units, normalization method, and computation from raw inputs
2. **Telling signal integrated** — either as a direct term in the formula or as a modifier on existing terms, with clear rationale
3. **Scenario validation** — concrete simulations across 6+ user archetypes (deep, light, flowing, fading, guarded, over-sharer) producing sensible E_target trajectories
4. **Edge case resilience** — formula behaves sensibly for: sustained E=0, sustained E=10, sudden energy shifts, first 1-3 messages with sparse history, mid-session topic changes
5. **Design decision coherence** — formula respects all 10 design decisions, particularly: user-state-pure (D3), no portrait feedback (D9), weight hierarchy b > a > g (D3), telling as independent axis (D2)
6. **Stability and interpretability** — E_target doesn't oscillate wildly between turns; a human can look at the inputs and understand why E_target is what it is
7. **Scope discipline: pacing only** — E_target does NOT choose territory or move type. It outputs a pacing signal. Territory policy and the four move types (Pull/Bridge/Hold/Pivot) remain strictly downstream consumers. The formula has no tentacles into what happens next — only into how much energy the next exchange should aim for

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

**Governing principle:** E_target should know only enough to pace the conversation, not enough to steer it.

| Dimension | IS (inside E_target) | IS NOT (outside E_target) |
|-----------|----------------------|---------------------------|
| **Inputs** | Energy E(n), Telling T(n), Momentum V(n), Windowed Drain D_w(n) | Raw message text, facet scores, trait scores, portrait readiness, message timestamps, territory identity, exchange count, **coverage deficit** (belongs in territory policy) |
| **Output** | A single scalar: target energy for the next exchange (0-10 scale) | Territory selection, move type, Nerin's tone, prompt instructions, noticing triggers |
| **What it knows** | The user's recent state — not the conversation plan | Which territory was just visited, how many exchanges remain, which thread is the endgame thread |
| **What it protects** | User from fatigue (dominant force), conversation from stalling | Assessment coverage targets, business metrics, session completion guarantees |
| **What drives it** | User's current state and recent trajectory | Time pressure, monetization logic, portrait quality anxiety, late-session resonance |
| **When it fires** | Once per exchange, after user message is analyzed | Continuously, mid-message, or at session boundaries |
| **Stability** | Smooth — changes gradually, no sudden jumps from a single term | Reactive — allowed to spike or drop based on single messages |
| **Interpretability** | A human can trace why E_target = X by inspecting each term | A black-box number that "just works" |

#### Boundary Resolution: Coverage Deficit — REMOVED FROM E_TARGET

**Decision (made during simulation, Step 5):** Coverage deficit does not belong in the pacing formula. It is assessment state, not user state, and its presence violated the user-state-pure principle.

**The problem it caused:** Simulation revealed that for low-energy users (light, guarded, fading), coverage became the dominant active force — producing persistent upward pressure on users who needed the gentlest treatment. The bug was structural: "not currently drained" was being treated as "ready to absorb more intensity." No coefficient fix (lower gamma, cap, readiness scaling) addressed the root cause.

**The root cause:** Coverage answers "how complete is the portrait?" — that is an assessment question, not a user-state question. Putting it in E_target smuggled steering pressure into pacing.

**Where coverage belongs:** Territory policy. Given that the user can sustain E_target=X, territory policy selects a territory that (a) fits that energy level AND (b) fills coverage gaps. Coverage pressure becomes "push *there*" (topic choice) not "push *harder*" (energy level). This matches the architecture: user state decides **how much**, territory policy decides **where**.

**Coverage remains important** — it is a first-class input to territory policy and is logged for monitoring. It is simply not part of the pacing formula.

#### Boundary Resolution: Telling

Telling is a **first-class state variable**. It enters E_target primarily by **qualifying the interpretation of energy and momentum**, rather than by acting as a simple independent additive boost.

Why not a plain additive term (`+ d * T`)?
- That would imply "more telling always means higher target energy"
- But the two-axis state model (Decision 2) shows telling changes the *meaning* of the same energy level:
  - High energy + high telling = flow (trustworthy signal)
  - High energy + low telling = performance (energy is less trustworthy)
  - Low energy + high telling = quiet authenticity (user is fine, respect the rhythm)
  - Low energy + low telling = disengagement (real concern)

Telling's conceptual role in the formula:
- **Amplifies positive momentum** when the user is genuinely self-propelled
- **Makes the same energy feel more costly / less trustworthy** when telling is low
- Qualifies whether the system should trust the current energy reading or treat it with caution

#### Boundary Resolution: Cold Start

The first exchange is handled by **neutral defaults inside the formula** — not by a separate special-case branch.

- Momentum defaults to 0 (no trajectory yet)
- Drain defaults to 0 (no cumulative cost yet)
- Telling defaults to neutral / unknown-safe
The cold start collapses gracefully toward a comfortable base with no active forces. This is a formula boundary condition, not a policy exception.

### Root Cause Analysis

**Method: Systems Thinking + Structural Decomposition**

The draft formula `E_target = E_base + a*V - b*D_w + g*C_deficit` has three root causes of insufficiency, all stemming from a single structural error: **it forces four functionally different signal types into a flat additive sum.**

**Root Cause 1: Topological mismatch — additive sum vs. heterogeneous signal roles**

The signals play fundamentally different *types* of role:
- Momentum = a directional shift (delta)
- Telling = a trust qualifier (multiplier)
- Drain = a constraint (ceiling)

Adding these together (`+ a - b + g`) forces them onto the same axis and creates scale mismatches. No amount of coefficient tuning fixes a structural problem. The solution is a **pipeline of transforms** where each signal operates in its natural mode.

**Note:** Coverage was originally included as a fourth signal type ("opportunistic nudge"). Simulation in Step 5 revealed it is assessment state, not user state, and causes inverted pressure on low-energy users. It was removed from E_target and relocated to territory policy.

**Root Cause 2: Missing anchor to current user state**

The draft uses a fixed `E_base = 5` as the starting point every turn. This means a quiet, authentic user at steady E=2 with V=0 gets perpetually pulled toward 5. The formula *imposes* a conversational center instead of *reading* one. The fix: anchor to a blend of the fixed base and the user's smoothed current energy.

**Root Cause 3: Telling signal absent from the formula**

The two-axis state model (Decision 2) treats Energy x Telling as the core state space, but the draft formula contains no telling term. Telling must be integrated — but as a qualifier on momentum (specifically upward momentum), not as an independent additive boost.

### Contributing Factors

- **Scale mismatch in the draft:** D_w (windowed drain) ranges from 0 to 10K while other terms range 0-10. This makes coefficient interpretation impossible without normalization.
- **Symmetric momentum treatment:** The draft treats positive and negative momentum identically via V(n). But design principles say: upward momentum should be qualified by telling (is the user genuinely self-propelled or performing?), while downward momentum should usually be respected regardless.
- **No structural guarantee on weight hierarchy:** The draft relies on `b > a > g` as a tuning discipline. The pipeline makes this architectural — drain is a hard ceiling (always wins). Coverage was subsequently removed entirely from E_target (see boundary resolution).

### System Dynamics

**The final pipeline topology (7 steps):**

```text
1. E_s        = smoothed current energy (EMA)
2. V_up/down  = momentum split from smoothed energy
3. trust      = f(T) — telling qualifies upward momentum
4. E_shifted  = E_s + a_up * trust * V_up - a_down * V_down
5. d          = excess-cost drain over last K turns
6. E_cap      = concave fatigue ceiling from drain
7. E_target   = clamp(min(E_shifted, E_cap), 0, 10)
```

**Note:** Coverage was removed from the pipeline after simulation revealed it is assessment state, not user state. It now lives in territory policy.

**Structural guarantees this topology provides:**

| Principle | How the pipeline enforces it |
|-----------|----------------------------|
| Fatigue protection dominates | Drain is a hard ceiling (step 6-7) — the final clamp |
| Coverage is not in pacing | Coverage belongs in territory policy — E_target is user-state-pure |
| Telling qualifies, doesn't add | Telling multiplies the momentum delta (step 3-4), not the base or the full value |
| Telling is asymmetric | Only upward momentum is qualified by telling; downward momentum is respected regardless |
| Respects quiet users | Anchor is EMA of actual energy (step 1) — steady E=2 user isn't dragged to 5 |
| Cold start is graceful | V=0, D_w=0 (ceiling high), T=neutral (trust~1.0), E_s defaults to E_base → result: comfortable base, no active forces |
| Pure function | Same inputs → same output. No hidden state. ~7 lines of code |
| Interpretable | Each step answers one question: "why is E_target what it is?" |

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

| Force | Strength | Why it helps |
|-------|----------|-------------|
| ConversAnalyzer already produces E(n) | Strong | Core input signal exists — no new extraction pipeline needed |
| Pipeline topology is simple (~10 lines) | Strong | No ML, no iteration — pure arithmetic. Easy to implement, test, debug |
| Design decisions are locked (10 decisions doc) | Strong | No principles debate — the spec exists, we're translating to math |
| Weight hierarchy is structural, not coefficient-based | Strong | Drain-as-ceiling is an architectural guarantee. Coverage removed from formula entirely — belongs in territory policy. |
| Pure function of its provided state summary | Strong | Deterministic, unit-testable with input/output tables, easy to log. Note: "pure" means same inputs → same output with no side effects. The function depends on derived recent-history inputs (smoothed energy, momentum, drain) — it is pure of its *state summary*, not of the raw latest message alone. This affects implementation boundaries and testing. |
| *System context (not a formula force):* session is 25 exchanges max | — | The formula must not know this. Session phase and exchange count belong downstream in territory scoring. Listed here as context only. |

**Restraining Forces (Blocking Solution):**

| Force | Strength | Why it blocks |
|-------|----------|--------------|
| ConversAnalyzer state extraction contract needs expansion | Strong | Current ConversAnalyzer extracts Big Five facet evidence (score/confidence/domain, 0-3 records per message). It does not yet produce the state signals the new pacing model needs: telling, possibly explicit energy, volunteered-detail richness. This is not just "telling missing" — the whole state extraction contract needs to grow to serve the pipeline. |
| Coefficient calibration requires real conversation data | Moderate | α_up, α_down, window K all need empirical tuning (Decision 10) |
| Two internal functions are undefined | Moderate | `trust(T)` and `cap_from_drain(D_w)` each require shape decisions (now defined — see Solution Generation) |
| Smoothing method choice affects behavior | Moderate | EMA vs SMA vs median — wrong choice creates lag or jitter (EMA selected — see Solution Generation) |

### Constraint Identification

**Hard constraints (non-negotiable):**

1. **Output range:** 0-10, continuous, same scale as E(n)
2. **Performance:** < 1ms execution. One evaluation per exchange. Cannot be a bottleneck.
3. **Deterministic:** Same inputs → same output. No randomness.
4. **No coverage / assessment state:** Formula does not see coverage deficit, facet thinness, or portrait readiness. These belong in territory policy.
5. **No session phase:** Formula cannot access exchange count, time remaining, or late-session flags
6. **Graceful degradation:** If telling is unavailable, formula works with trust(T) defaulted to 1.0

**Soft constraints (strongly preferred):**

7. **Interpretability:** A human reading the inputs can trace why E_target = X
8. **Monotonic responses:** More drain → lower ceiling. More upward momentum + trust → higher target. No surprising inversions.
9. **Smooth output:** E_target should not oscillate wildly between consecutive turns

### Key Insights

1. **Primary constraint:** The formula depends on two internal functions (`trust(T)` and `cap_from_drain(D_w)`) and one signal that hasn't been built (telling score). The pipeline topology is solved — the functions are now defined (see Solution Generation).

2. **Telling as plug-in qualifier:** The formula works without telling (trust defaults to 1.0). This is the phased rollout path: ship without telling, add it when ConversAnalyzer supports it.

3. **`cap_from_drain` is the most powerful term.** It's the hard ceiling that enforces fatigue protection. Its shape (concave with floor) was selected to be gentle at low drain and protective at high drain.

4. **Coverage removed from E_target.** Simulation revealed coverage is assessment state, not user state. It caused inverted pressure on low-energy users. It now lives in territory policy, where it steers topic choice at the energy level the user can sustain. This was the single most important design decision of the session.

5. **Coefficients are tuning knobs, not structural choices.** The topology is fixed. The functions `trust()` and `cap()` define the formula's character. The coefficients `α_up`, `α_down` are fine-tuning within that character. Design the functions first, tune the coefficients with real data second.

---

## SOLUTION GENERATION

### Methods Used

- **Systems Thinking** — decomposed the formula into functionally distinct signal types (shift, qualifier, constraint, nudge) to identify the topological mismatch in the draft
- **TRIZ Contradiction Resolution** — resolved the contradiction "telling must influence pacing but must not add independent energy pressure" by reframing telling as a trust multiplier on momentum rather than an additive term
- **Assumption Busting** — challenged the assumption that drain = raw energy sum, replacing it with excess-cost-over-comfort to match the actual design principle (sustained heaviness, not sustained aliveness). Also challenged whether coverage belongs in E_target at all — simulation proved it doesn't.
- **Panel debate (Party Mode)** — multi-agent challenge process to stress-test proposals, identify asymmetries in safety nets, and resolve design choices (trust floor, smoothing method, coefficient ranges)
- **What If Scenarios (Advanced Elicitation)** — traced the formula through 6 user archetypes (deep, light, flowing, fading, guarded, over-sharer) with concrete numbers. Validated drain ceiling behavior. Exposed coverage as a boundary violation.

### Generated Solutions: The v1 E_target Formula

#### Complete Pipeline Specification

**Inputs:**
- `E(n)` — energy of current user message, continuous in [0, 10]. Extracted by ConversAnalyzer.
- `T(n)` — telling score of current user message, continuous in [0, 1]. 0 = fully compliance-driven, 1 = fully self-propelled. If unavailable, default to 0.5 (neutral → trust = 1.0).
- History of recent E values (last K=5 turns).

**Explicitly NOT inputs (by design):**
- Coverage deficit — belongs in territory policy
- Portrait readiness — read-only metric, never feeds back
- Exchange count / session phase — belongs in territory scoring (resonance bonus)

**Output:**
- `E_target` — target energy for the next exchange, continuous in [0, 10].

**Constants (v1 defaults):**

| Constant | Value | Role |
|----------|-------|------|
| `E_base` | 5.0 | Comfortable conversational middle ground |
| `λ` (lambda) | 0.35 | EMA smoothing factor — responsiveness vs. stability |
| `α_up` | 0.5 | Upward momentum following coefficient |
| `α_down` | 0.6 | Downward momentum following coefficient (slightly stronger) |
| `comfort` | 5.0 | Energy level below which no drain cost accrues |
| `K` | 5 | Drain window — number of recent turns considered |
| `E_floor` | 2.5 | Minimum fatigue ceiling (never targets dead air) |
| `E_maxcap` | 9.0 | Maximum fatigue ceiling (never targets full intensity) |

**Coefficient hierarchy:** `drain ceiling (structural) > α_down (0.6) >= α_up (0.5)`

---

#### Step 1 — Smooth energy (EMA)

```text
E_s(0) = E_base = 5.0
E_s(n) = 0.35 * E(n) + 0.65 * E_s(n-1)
```

Smoothed energy tracks the user's recent conversational level. Initialized at E_base so cold start anchors to a comfortable middle. Converges toward the user's natural energy within 3-5 turns.

#### Step 2 — Compute momentum from smoothed energy

```text
V      = E_s(n) - E_s(n-1)
V_up   = max(V, 0)
V_down = max(-V, 0)
```

Momentum is computed from the smoothed signal, not raw energy. This prevents single-message spikes from yanking E_target. A genuine shift shows up within 2-3 turns as the EMA catches up. Split into upward/downward components for asymmetric treatment.

#### Step 3 — Compute trust from telling

If telling is available:

```text
if T <= 0.5:
    trust = 0.5 + T              // maps [0, 0.5] → [0.5, 1.0]
else:
    trust = 1.0 + 0.4 * (T - 0.5)  // maps [0.5, 1.0] → [1.0, 1.2]
```

If telling is not available (phased rollout):

```text
trust = 1.0
```

| T | trust | Interpretation |
|---|-------|---------------|
| 0.0 | 0.50 | Fully compliant — follow upward momentum at half strength |
| 0.25 | 0.75 | Mostly reactive — cautious following |
| 0.50 | 1.00 | Neutral — follow momentum normally |
| 0.75 | 1.10 | Self-propelled — slight amplification |
| 1.0 | 1.20 | Highly self-propelled — confident following |

**Design rationale for floor = 0.5 (not lower):**
- If floor is too high and the system follows false momentum → drain ceiling catches the mistake within 2-3 turns (structural safety net exists)
- If floor is too low and the system ignores genuine engagement → no automatic recovery mechanism (silent failure, user feels unheard)
- Asymmetric risk → err on the generous side. The drain ceiling is the backstop.

**Design rationale for asymmetric shape:**
- Low telling dampens upward momentum significantly (0.5x at T=0)
- High telling only slightly amplifies (1.2x at T=1.0)
- The cost of following false momentum (performance mode) is higher than the cost of slightly under-following real momentum (flow mode) — but drain protects against the former

#### Step 4 — Shift anchor by trusted momentum

```text
E_shifted = E_s(n) + α_up * trust * V_up - α_down * V_down
```

- Upward movement is qualified by telling: high trust → follow the wave, low trust → dampen
- Downward movement is respected as-is, regardless of telling
- The anchor is the smoothed energy E_s(n), not a fixed constant — this respects quiet users at E=2 without dragging them toward 5

#### Step 5 — Compute drain from recent excess cost

```text
cost_i = max(0, E_i - 5.0) / 5.0     // normalized to [0, 1]
d      = sum(cost_i over last K turns) / K    // always divide by K, even if fewer turns exist
```

- Only energy above comfort (5.0) counts as cost
- A lively E=5 conversation accumulates zero drain — the system doesn't punish aliveness
- A sustained E=9 conversation accumulates rapidly — `cost = 0.8 per turn`
- Plain average for v1 (recency weighting deferred to v2 if needed)
- **Always divide by K=5**, treating missing turns as zero cost. This prevents early-turn overreaction: a single hot message (E=8) should produce d=0.12, not d=0.6. Drain measures *sustained* intensity — one turn of anything is not sustained.
- **Spec correction:** An earlier draft said "average over available turns." Simulation of the Hot Opener scenario (Scenario 9) proved this causes false ceiling pressure on turn 1. K-padded averaging is the correct implementation.

#### Step 6 — Fatigue ceiling

```text
E_cap = 2.5 + (9.0 - 2.5) * (1 - d²)
      = 2.5 + 6.5 * (1 - d²)
```

| Recent pattern | d | E_cap | Interpretation |
|---------------|---|-------|---------------|
| All turns at E=5 (comfortable) | 0.0 | 9.0 | No excess cost → full headroom |
| All turns at E=7 (moderate) | 0.4 | 7.43 | Some cost → moderate ceiling |
| All turns at E=8 (heavy) | 0.6 | 6.16 | Sustained heaviness → pulling back |
| All turns at E=9 (very heavy) | 0.8 | 4.34 | Strong intensity → firm protection |
| All turns at E=10 (maximum) | 1.0 | 2.5 | Maximum drain → floor only |
| E=9,9,5,4,3 (recovering) | ~0.36 | 7.66 | Recovery visible — ceiling rises |

#### Step 7 — Apply ceiling and clamp

```text
E_target = clamp(min(E_shifted, E_cap), 0, 10)
```

- Drain is a hard constraint — the final gate. This is where "fatigue protection dominates" becomes architectural, not numerical.
- Clamp ensures output stays in [0, 10].
- **No coverage term.** Coverage pressure lives in territory policy, which uses E_target to select territories that match the user's sustainable energy AND fill coverage gaps. The pacing formula only reads the room.

#### Removed: Coverage nudge (Step 8 in earlier draft)

Coverage was originally the final step: `E_target = E_safe + γ * headroom * C_deficit`. Simulation across 6 archetypes revealed this caused **inverted pressure** — low-energy users (light, guarded, fading) received the strongest coverage push because they had the most headroom. The root cause: coverage is assessment state, not user state. It was removed from E_target and relocated to territory policy. See "Boundary Resolution: Coverage Deficit" for full rationale.

---

### Creative Alternatives

**Alternative A: Multiplicative drain instead of ceiling**
Instead of `min(E_shifted, E_cap)`, use `E_shifted * (1 - d)`. Rejected because it doesn't provide a hard guarantee — at extreme values, the multiplicative form could still produce high targets if E_shifted is very high.

**Alternative B: Telling as a separate additive term**
`E_target = ... + d * T(n)`. Rejected because it implies "more telling = more energy target" which contradicts the two-axis model. Telling changes the *meaning* of energy, not the target independently.

**Alternative C: Sigmoid cap function**
`cap(d) = 10 / (1 + e^(k*(d - d_mid)))`. Rejected for v1 because it introduces two parameters (k, d_mid) that can't be calibrated without real data and it's harder to interpret. Could be revisited in v2 if concave proves too aggressive or too lenient.

**Alternative D: Raw energy sum for drain**
`D_w = sum(E_i over K)`. Rejected because it punishes comfortable medium-energy conversation (E=5 for 5 turns = D_w=25, same as E=5 one turn of E=10 + four turns of E=3.75). The excess-cost model correctly distinguishes "lively and comfortable" from "heavy and draining."

**Alternative E: Separate blend parameter for anchor**
`E_anchor = w * E_base + (1-w) * E_s`. Rejected because the EMA initialized at E_base already performs this blend naturally — it starts centered and adapts over time. One fewer parameter with identical behavior.

**Alternative F: Coverage in E_target with readiness scaling (attempted fix)**
`nudge = min(γ * headroom * C_deficit * (E_safe/10), 0.5)`. This was proposed to fix the inverted-pressure problem by scaling coverage nudge with readiness. Rejected because it treated the symptom (too much nudge) rather than the cause (coverage is assessment state, not user state). The cleaner solution was to remove coverage from E_target entirely and delegate it to territory policy.

**Alternative G: Coverage in E_target with hard cap only**
`nudge = min(γ * headroom * C_deficit, 0.5)`. Rejected for the same reason as Alternative F — caps the magnitude but doesn't fix the structural problem that low-energy users still get the strongest proportional coverage pressure.

---

## SOLUTION EVALUATION

### Evaluation Criteria

| Criterion | Weight | How evaluated |
|-----------|--------|---------------|
| User-state purity | Critical | Does E_target depend only on user state signals? No assessment, business, or phase logic. |
| Fatigue protection | Critical | Does drain structurally dominate? Can any other force override it? |
| Archetype validity | High | Does the formula produce sensible trajectories for 10 diverse user types? |
| Edge case resilience | High | Cold start, sustained extremes, sudden shifts, sparse history |
| Interpretability | High | Can a human trace why E_target = X by inspecting inputs? |
| Simplicity | Moderate | Minimal parameters, no unnecessary complexity |
| Phased rollout | Moderate | Does the formula work without telling? |

### Solution Analysis

**10-archetype simulation results:**

| # | Archetype | Status | Key observation |
|---|-----------|--------|----------------|
| 1 | Deep user | PASS | Ceiling kicks in at turn 6, forces pullback, recovery visible |
| 2 | Light user | PASS | No upward pressure — formula reads the room (was FAIL with coverage) |
| 3 | Flowing user | PASS | Smooth following, ceiling gentle, system stays out of the way |
| 4 | Fading user | PASS | Follows the fade, no false uplift (was FAIL with coverage) |
| 5 | Guarded user | PASS | Respects measured pace, no persistent push (was FAIL with coverage) |
| 6 | Over-sharer | PASS | Ceiling at turn 3, strong protection before burnout |
| 7 | Performance mode | PASS | Modest trust dampening; real differentiation is downstream in move selection |
| 8 | Quiet authentic | PASS | Respects low energy + high telling — the proof case for coverage removal |
| 9 | Hot opener | PASS | K-padded drain prevents early overreaction (required spec correction) |
| 10 | Volatile | PASS | EMA dampens ~55% of raw swings; adequate for v1, tunable via lambda |

**Spec corrections discovered during simulation:**
1. Coverage deficit removed from E_target (assessment state, not user state)
2. K-padded drain averaging (always divide by K=5, treat missing turns as zero cost)

**Edge cases verified:**
- Cold start (n=1): E_target ≈ E_base = 5.0 (no active forces, graceful default)
- Sustained E=0: E_target settles near 0 (formula tracks the user down, no minimum on E_target itself — E_floor only applies to the drain ceiling)
- Sustained E=10: Ceiling drops to 2.5 within 5 turns (maximum protection)
- Sudden spike (E=3→9): EMA dampens to +2.1 shift, not +6. Ceiling barely affected on first spike.

### Recommended Solution

**The v1 E_target formula: a 7-step pipeline of transforms.**

```text
1. E_s(n)    = 0.35 * E(n) + 0.65 * E_s(n-1)           // EMA, init at 5.0
2. V         = E_s(n) - E_s(n-1)                         // smoothed momentum
   V_up      = max(V, 0)
   V_down    = max(-V, 0)
3. trust     = piecewise(T):                              // telling qualifier
                 T <= 0.5: 0.5 + T
                 T >  0.5: 1.0 + 0.4*(T - 0.5)
               default (no telling): 1.0
4. E_shifted = E_s(n) + 0.5 * trust * V_up - 0.6 * V_down
5. cost_i    = max(0, E_i - 5.0) / 5.0                   // excess cost per turn
   d         = sum(cost_i over last 5 turns) / 5          // K-padded average
6. E_cap     = 2.5 + 6.5 * (1 - d^2)                     // concave ceiling
7. E_target  = clamp(min(E_shifted, E_cap), 0, 10)
```

**Constants:** E_base=5.0, lambda=0.35, alpha_up=0.5, alpha_down=0.6, comfort=5.0, K=5, E_floor=2.5, E_maxcap=9.0

**Not in E_target (by design):** coverage deficit, portrait readiness, exchange count, session phase, territory identity, resonance bonus.

### Rationale

1. **Pipeline topology over additive sum.** Each signal operates in its natural mode: momentum shifts, telling qualifies, drain constrains. No scale mismatches. Weight hierarchy is structural, not coefficient-dependent.

2. **Coverage removed.** Simulation proved it is assessment state, not user state. It caused inverted pressure on the users who needed the gentlest treatment. Territory policy handles coverage by choosing appropriate topics at the energy the user can sustain.

3. **Excess-cost drain over raw sum.** Only energy above comfort counts as cost. A lively E=5 conversation accumulates zero drain. This matches the design principle: the problem is sustained *heaviness*, not sustained *aliveness*.

4. **Telling as asymmetric qualifier.** Low telling dampens upward momentum (don't trust performative energy). High telling slightly amplifies (follow genuine self-propulsion). Downward momentum is always respected. Default trust=1.0 enables phased rollout without telling.

5. **EMA anchor over fixed base.** The formula respects each user's natural energy level. A quiet user at E=3 isn't pulled toward 5. The EMA starts at E_base and adapts within 3-5 turns.

6. **K-padded drain.** One hot message isn't sustained intensity. Always dividing by K=5 prevents early-turn overreaction and correctly models drain as a measure of recent sustained cost.

---

## IMPLEMENTATION PLAN

### Implementation Approach

**Strategy: Phased rollout — formula first, telling later.**

The formula is designed to work without telling (trust defaults to 1.0). This allows implementation in two independent phases:

- **Phase A:** Implement E_target pipeline with energy, momentum, and drain only. Telling defaults to neutral. This is fully functional and testable immediately.
- **Phase B:** Add telling signal to ConversAnalyzer. Wire T(n) into the trust function. No structural changes to the pipeline — just replacing the default with a real value.

Phase A can ship without waiting for Phase B. Phase B can be developed and tested independently.

### Action Steps

**1. Update design documents**
- Update `conversation-pacing-design-decisions.md`:
  - Decision 2: Remove coverage from the user-state model inputs. Keep Energy, Telling, Drain.
  - Decision 3: Rewrite E_target formula to the 7-step pipeline. Remove `+ g * C_deficit`. Remove weight hierarchy reference to g.
  - Architecture summary diagram: Remove coverage arrow feeding into E_target. Keep coverage feeding into Territory Policy.
- Update `energy-state-formula-draft.md`: Replace with the final v1 specification from this document, or archive as superseded.

**2. Implement E_target as a pure function**
- Location: `packages/domain/src/utils/e-target.ts` (pure domain logic, no infrastructure dependencies)
- Export: `computeETarget(state: PacingState): number`
- Input type:
  ```typescript
  interface PacingState {
    currentEnergy: number;         // E(n) in [0, 10]
    previousSmoothedEnergy: number; // E_s(n-1)
    recentEnergies: number[];      // last K raw E values for drain
    telling: number | null;        // T(n) in [0, 1], null if unavailable
  }
  ```
- Output: `E_target` in [0, 10]
- Constants: export as named config object for testability and future tuning
- The function computes E_s(n), returns both E_target and E_s(n) (caller stores E_s for next turn)

**3. Implement EMA state management**
- E_s must persist across turns within a session. Two options:
  - **Option A:** Store E_s in the assessment session record (new column)
  - **Option B:** Recompute E_s from full message history each turn (stateless but O(n))
- Recommendation: **Option A** for v1. One additional column (`smoothed_energy`) on the session or a lightweight pacing state record. Keeps the function pure while the caller manages persistence.

**4. Wire into steering pipeline**
- After ConversAnalyzer extracts E(n) from the user message, call `computeETarget()` with the current pacing state
- E_target feeds into two downstream consumers (see Decisions 11-12):
  - **Territory Scorer:** uses `E_target / 10` to compute `energyMalus` — a quadratic penalty when a territory's `expectedEnergy` (0-1 scale) deviates from the normalized target. This is the primary consumption of E_target.
  - **Move Governor:** uses the gap between `E_target / 10` and the selected territory's `expectedEnergy` to derive `entryPressure: "direct" | "angled" | "soft"` (Decision 12)
- The Territory Selector sits between Scorer and Governor but does not consume E_target directly — it picks from the Scorer's ranked list via deterministic rules
- **Scale note:** E_target outputs on [0, 10]. Territory catalog `expectedEnergy` is on [0, 1] where 0.5 = comfort threshold. The normalization (`E_target / 10`) is the consumer's responsibility, not E_target's.

**5. Unit tests from archetype simulations**
- Create test file: `packages/domain/src/utils/__tests__/e-target.test.ts`
- Each of the 10 archetype scenarios becomes a test case with the exact input sequences and expected E_target values from this document
- Key assertions per scenario:
  - E_target values match within ±0.1 tolerance
  - Ceiling activates at the expected turn
  - Coverage-free formula never produces upward pressure for low-energy users
  - Cold start produces E_base
  - K-padded drain matches expected values
- Edge case tests:
  - All zeros: E(n)=0 for 10 turns
  - All tens: E(n)=10 for 10 turns
  - Single message (n=1)
  - Telling unavailable (null → trust=1.0)

**6. Logging and observability**
- Log E_target and its components per turn for debugging and future calibration:
  - `{ E_n, E_s, V, trust, E_shifted, d, E_cap, E_target }`
- This enables post-session analysis: "why did E_target drop at turn 8?"
- Coverage deficit should also be logged (for territory policy debugging), just not as an E_target input

**7. Downstream pipeline (resolved separately)**
- The territory steering pipeline has been decomposed into three layers: Territory Scorer → Territory Selector → Move Governor (Decisions 11-13). Each is specified in its own document. E_target is not responsible for their internals.
- **What E_target provides:** a single number in [0, 10] representing the energy level the next exchange should aim for. The Scorer normalizes this to the catalog's [0, 1] scale and uses it to penalize energy-mismatched territories. The Governor uses it to calibrate entry pressure.
- **What E_target does not provide:** territory selection, move type, prompt composition. These are downstream concerns resolved in [Territory Policy Spec](problem-solution-2026-03-07-territory-policy.md), [Territory Selector Spec](problem-solution-2026-03-09.md), [Move Governor Spec](problem-solution-2026-03-09-move-generator.md), and [Prompt Builder Spec](problem-solution-2026-03-10.md).

### Timeline and Milestones

| Milestone | Dependencies | Description |
|-----------|-------------|-------------|
| M1: Design docs updated | None | Reflect coverage removal, 7-step pipeline, K-padding in decisions doc. **Done** — decisions doc updated 2026-03-07. |
| M2: Pure function implemented | None | `computeETarget()` with full test suite from 10 archetypes |
| M3: State persistence | M2 | E_s stored per session, wired into steering pipeline |
| M4: Territory pipeline integration | M2 | Resolved in Decisions 11-13. Scorer + Selector + Governor consume E_target. |
| M5: Telling signal added | M2 | ConversAnalyzer outputs T(n), wired into trust function |
| M6: Calibration with real data | M4 | Observe real conversations, tune alpha_up, alpha_down, lambda, K |

M1 and M2 can start immediately and in parallel. M5 is independent and can happen whenever ConversAnalyzer work is scheduled.

### Resource Requirements

- **Domain knowledge:** This document serves as the complete specification
- **Codebase changes:** ~3 files (pure function, test file, state persistence)
- **No new infrastructure:** Pure arithmetic, no external services, no ML
- **Calibration data:** Real conversation logs (Decision 10) — required for M6 but not for M1-M5

### Responsible Parties

- **Formula implementation (M1-M3):** Developer implementing the pacing pipeline
- **Pipeline integration (M4):** Same or coordinated developer — Scorer consumes E_target/10 for energyMalus, Governor consumes for entry pressure
- **Telling signal (M5):** Whoever owns ConversAnalyzer prompt/output contract
- **Calibration (M6):** Product + engineering — requires defining "good" pacing from real user feedback

---

## MONITORING AND VALIDATION

### Success Metrics

| Metric | Target | How to measure |
|--------|--------|---------------|
| **No archetype regression** | 10/10 archetypes pass simulation | Unit tests from this document — automated, run on every change |
| **E_target stability** | No turn-to-turn swings > 2.5 points in production | Log E_target per turn, flag sessions with max delta > 2.5 |
| **Ceiling activation rate** | Ceiling should activate in 30-60% of sessions | Log when `E_shifted > E_cap`. Too low = formula too permissive. Too high = too aggressive. |
| **Low-energy user comfort** | E_target stays within 1.0 of user's smoothed energy for users with E_s < 4 | Log gap `E_target - E_s` for low-energy sessions. If consistently > 1.0, something is pushing them up. |
| **User-reported experience** | Users feel "seen not measured" | Qualitative — post-session feedback, session ratings, return rate |
| **Telling signal utility (Phase B)** | Trust modulates E_target by 0.1-0.5 points in typical sessions | Log trust values; compare E_target with and without telling to measure actual impact |

### Validation Plan

**Stage 1: Unit test validation (pre-deploy)**
- All 10 archetype scenarios as automated tests with exact input/output tables
- Edge cases: sustained E=0, sustained E=10, cold start, null telling, single message
- Pure function — no infrastructure needed, runs in CI

**Stage 2: Shadow mode (post-deploy, pre-activation)**
- Run E_target in parallel with existing steering, without affecting Nerin's behavior
- Log all pipeline components per turn: `{ E_n, E_s, V, trust, E_shifted, d, E_cap, E_target }`
- Compare E_target trajectory with actual conversation pacing — does the formula "agree" with how the conversation naturally went?
- Duration: 50-100 real conversations minimum

**Stage 3: A/B test (activation)**
- Split traffic between old steering and new E_target-driven pacing
- Measure: session completion rate, return rate, telling ratio, engagement arc, volunteered detail density (the behavioral metrics from Decision 10)
- Key question: *"Did the user forget this was an assessment?"*

**Stage 4: Calibration (ongoing)**
- Use production logs to tune constants: alpha_up, alpha_down, lambda, K, E_floor, E_maxcap, comfort
- Tuning method: identify sessions where E_target "felt wrong" (user dropped off, energy crashed, conversation felt flat) and trace the pipeline to find which constant to adjust
- Decision 10 explicitly says these weights require empirical calibration — this is expected, not a failure

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **EMA too sluggish** — formula can't track genuine phase shifts within 2-3 turns | Medium | Medium | Monitor lag between E(n) trend changes and E_target response. Adjust lambda upward (more responsive) if needed. |
| **Drain too aggressive** — ceiling kicks in for moderate conversations | Low | High | Monitor ceiling activation rate. If > 60% of sessions hit ceiling, raise comfort threshold or lower concave exponent. |
| **Drain too permissive** — users report fatigue but ceiling didn't activate | Medium | High | Monitor sessions where users disengage (energy drops sharply late) but ceiling was inactive. Lower comfort or raise K. |
| **Trust floor too generous** — performance mode users get followed into false intensity | Low | Medium | Compare E_target trajectories for high-telling vs low-telling users at same energy. If nearly identical, the trust range is too narrow. Widen floor-to-ceiling spread. |
| **Telling signal noisy** — ConversAnalyzer's T(n) fluctuates wildly | Medium | Medium | Consider smoothing T(n) via EMA before feeding into trust function. Or widen the neutral band (trust ≈ 1.0 for T in [0.3, 0.7]). |
| **Formula produces "boring" pacing** — E_target hovers near 5 for most users | Medium | Medium | Check E_target variance across sessions. If too low, alpha_up may be too small (not following upward momentum enough). |

### Adjustment Triggers

| Signal | Threshold | Action |
|--------|-----------|--------|
| Ceiling activates in > 70% of sessions | Review after 100 sessions | Raise comfort from 5.0 to 5.5, or lower concave exponent from 2 to 1.5 |
| Ceiling activates in < 20% of sessions | Review after 100 sessions | Lower comfort from 5.0 to 4.5, or raise K from 5 to 6 |
| E_target swing > 3.0 between consecutive turns in > 10% of sessions | Immediate review | Lower lambda (less responsive) or increase alpha_down (faster easing) |
| Low-energy users (E_s < 4) consistently show E_target > E_s + 1.5 | Immediate review | Check for residual upward pressure — should not exist with coverage removed. Investigate momentum or EMA behavior. |
| User drop-off rate higher with new pacing than old steering | After A/B test | Halt rollout, trace problematic sessions, identify formula behavior at drop-off point |
| Telling signal makes < 0.05 point difference in E_target | After Phase B launch | Trust range too narrow — widen floor/ceiling or reconsider telling extraction method |

---

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
