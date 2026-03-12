# Problem Solving Session: Move Governor — Restraint Layer & Enriched Prompt Pipeline

**Date:** 2026-03-09
**Problem Solver:** Vincentlay
**Problem Category:** Conversation Architecture / Territory Policy Pipeline

> **Partial supersession (2026-03-10):** Two sections updated inline to match [Decision 12](./planning-artifacts/conversation-pacing-design-decisions.md#decision-12-move-governor--restraint-layer-not-move-dispatch) and [Decision 13](./planning-artifacts/conversation-pacing-design-decisions.md#decision-13-three-tier-contextual-prompt-composition):
> 1. **Governor Output Contract** — flat `MoveGovernorOutput` replaced with `PromptBuilderInput` discriminated union (5 intent variants). `deriveIntent()` runs inside the Governor. `MoveGovernorDebug` restructured as product of 3 discriminated unions. `ContradictionTarget` uses tuple pair.
> 2. **Prompt Builder Enrichment** — superseded by Decision 13 and the [Prompt Builder Architecture Spec](./problem-solution-2026-03-10.md).
>
> The Governor's 4 decisions (entry pressure, noticing hint, contradiction target, convergence target), closing design, per-domain extraction, and session state management remain current. Convergence detection added as a new overlay type (mirror of contradiction — identity vs complexity). Pipeline wiring and implementation plan updated to reference `PromptBuilderInput`.

---

## PROBLEM DEFINITION

### Initial Problem Statement

The move generator is the final layer in the three-layer territory policy pipeline (Scorer → Selector → Move Generator). The scorer and selector are fully specified — the scorer produces ranked territory lists via a unified five-term formula, and the selector picks a territory and annotates it with `sessionPhase` and `transitionType`. The move generator receives this output and must produce Nerin's prompt instructions — the actual conversational behavior the user experiences.

The move generator has four conceptual move types (Pull, Bridge, Hold, Pivot) established in the pacing design decisions, plus two overlay mechanisms (Contradiction as gated Hold, Noticing as event-driven). But the layer lacks:

- **Frequency control:** Nerin already does noticing and contradiction well — the *content* is good, but noticing fires on almost every message and contradiction surfaces too early. The problem is throttling, not dispatch.
- **Entry pressure:** How directly to enter a territory — the E_target gap should modulate this, but no calculation exists
- **Closing/Netflix mechanism:** How the conversation ends — abruptly as a cliffhanger, or with a manufactured wrap-up? The selector spec explicitly deferred this
- **Input contract:** What inputs the layer needs beyond the selector's 3 slim fields — and critically, ensuring those inputs actually exist in the current architecture
- **Scope clarity:** Whether this layer should explicitly dispatch move types (Pull/Bridge/Hold/Pivot) or trust Nerin to choose the conversational action and focus on restraint and structural context
- **Prompt composition:** How the Governor's output becomes actual system prompt instructions — composition order, overlay collision rules, and what the enriched prompt looks like end-to-end
- **Pipeline wiring:** How the Governor slots into the existing 8-step `nerin-pipeline.ts` without disrupting the current flow
- **Session state:** Where noticing/contradiction counters and EMA history live, given the codebase's derive-at-read pattern

### Refined Problem Statement

**Design a Move Governor — a thin restraint-and-context layer that sits between the territory selector and the prompt builder. The Governor handles what LLMs are bad at (frequency control, cooldowns, caps, entry pressure calibration) and trusts Nerin for what it's naturally good at (choosing conversational actions, finding what to notice, spotting contradictions, landing the right tone). The Governor must be specified tightly enough for direct implementation and unit testing, with every gate, threshold, and output field explicit — while keeping the input surface minimal and free of phantom dependencies on unbuilt systems.**

From first principles, the Governor's irreducible job:

> **Given a selected territory and session context, constrain what Nerin should NOT do, signal structural context Nerin can't compute, and let Nerin handle the rest.**

The pipeline identity:
- The scorer decides **what ranks highest**
- The selector decides **what is selected now**
- The Governor decides **what constraints Nerin operates under**
- Nerin decides **how to make the conversation feel good**

The Governor owns restraint and structural signaling — not ranking, not territory choice, not conversational action choice. It makes four deterministic decisions per turn:
1. **Entry pressure** — how directly should Nerin enter this territory? (E_target gap calculation)
2. **Noticing hint** — has a facet×domain clarity signal emerged strongly enough to surface? (EMA emergence + baseline confidence + phase curve + escalating threshold)
3. **Contradiction target** — are two life domains scoring a facet differently enough to surface? (per-domain divergence + escalating threshold)
4. **Convergence target** — are 3+ life domains scoring a facet similarly enough to surface as identity? (per-domain spread + escalating threshold)

### Problem Context

The Governor sits at the pipeline terminus, between the selector and the prompt builder:

```
Territory Scorer → Territory Selector → [MOVE GOVERNOR] → Prompt Builder → Nerin's response
```

**Upstream contract (locked):** `TerritorySelectorOutput` delivers 3 slim fields:
- `selectedTerritory: TerritoryId` — the territory to enter/continue
- `sessionPhase: "opening" | "exploring"` — session arc position (selector emits two phases; Governor can promote to `"closing"` via `isFinalTurn` — see Closing Design below)
- `transitionType: "continue" | "transition"` — whether this is the same or a new territory

**Pipeline-level inputs (independent of selector):**
- `E_target: number | null` — pacing formula output (0-10), optional until pacing pipeline is built
- `isFinalTurn: boolean` — from pipeline check (`turnNumber >= maxTurnsPerSession`)
- Session counters: `turnNumber`, `totalExpectedTurns`, `priorAssistantMessages` (for derive-at-read state reconstruction)

**Downstream consumer:** The prompt builder, which constructs Nerin's system prompt section. Currently `territory-prompt-builder.ts` — a thin lookup that maps `SteeringOutput.territoryId` to opener + domains + energy guidance. The Governor's output will enrich this with suppression signals and entry pressure.

**Existing v1 prompt builder (to be extended):**
The current `buildTerritorySystemPromptSection()` produces a generic territory guidance block with energy-level-specific tone guidance and a suggested direction. It has no awareness of session phase, transition context, entry pressure, or overlay control (noticing/contradiction/convergence). The Governor spec will define the additional signals the prompt builder consumes.

**Key architectural constraints:**
- The Governor **never chooses the territory** — that boundary is enforced by the three-layer architecture
- The Governor **never chooses the conversational action** (Pull/Bridge/Hold/Pivot) — Nerin handles this naturally from context
- The Governor **never extracts themes or content** — Nerin has the full conversation history
- E_target tunes **entry pressure** only — not move dispatch
- Noticing, Contradiction, and Convergence are **Nerin's natural strengths** — the Governor only controls *frequency*, not *content* or *targeting*
- **Closing = amplification, not wrap-up.** The Governor promotes to `"closing"` when `isFinalTurn` is true. Closing means "go deeper" — Nerin gets permission to be braver, not instructions to wind down. Contradiction and convergence remain eligible during closing (threshold = 0); noticing is excluded as a local signal. The conversation ends at the hard limit mid-intensity. The scorer's conversation skew naturally pushes territory intensity toward the end. The abrupt cut IS the Netflix cliffhanger.
- **Mutual exclusion** — at most one overlay (noticing OR contradiction OR convergence) per turn. All three spend trust. All say "I see you." Combining them in one response makes the user feel studied, not seen. When multiple fire, threshold ratio tiebreak decides: each signal's value is divided by its required threshold, and the higher ratio wins. Equal ratios → tiebreak priority: contradiction > convergence > noticing (rarest to commonest). The deferred signal is not lost — genuine emergence (noticing) survives via EMA smoothing, and deferred contradictions/convergences remain candidates next turn.

**What Nerin already does well (and the Governor trusts):**
- Choosing between invitation, connection, reflection, and reframing based on conversational context
- Noticing specific things about the user that are grounded in what they said (quality is good, frequency is too high)
- Spotting contradictions and framing them as fascination (quality is good, timing is too early)
- Landing the right tone for opening and exploring moments

**What Nerin is bad at (and the Governor enforces):**
- Self-limiting noticing frequency (fires on almost every message)
- Waiting long enough before surfacing contradictions (surfaces too early, before cross-territory evidence)
- Calibrating entry directness based on E_target gap (doesn't have E_target)
- Tracking structural state across turns (cooldowns, caps, window counts)
- Knowing when to fire only ONE overlay per turn (would happily notice AND contradict AND converge in the same response)

**Design vocabulary (not dispatch targets):**
The four move types — Pull, Bridge, Hold, Pivot — remain as vocabulary for understanding what Nerin does, for writing prompt builder instructions, and for post-hoc analysis. They are not Governor dispatch targets. The old E_target-gap dispatch (`E_target ~ E(n) → Pull/Bridge`, `E_target < E(n) → Pivot`) is retired — it was designed before the selector boundary hardened and is no longer architecturally coherent.

**Closing design (amplification + Netflix cut-to-black):**
The Governor promotes `sessionPhase` to `"closing"` on the final turn (`isFinalTurn`). Closing is NOT wrap-up — it's amplification. Nerin gets a "go deeper" instruction that gives it permission to be braver. Overlays (contradiction, convergence) remain eligible during closing — noticing is excluded as a local signal. A contradiction or convergence landing on the amplified final turn is the MOST powerful Netflix moment. The scorer's conversation skew naturally pushes territory intensity toward the end. The hard limit cuts the conversation at peak intensity. Nerin doesn't know it's ending — it just feels permission to go deeper. The frontend handles the "session ended" UI.

### Success Criteria

1. **Governor output contract** — a structured type with explicit fields that the prompt builder consumes: entry pressure, suppression signals, pass-through selector fields. Tight enough for unit tests.
2. **Governor input contract** — every input the Governor needs, where each comes from, and proof that all inputs exist today or are trivial session counters. Zero phantom dependencies.
3. **Noticing window spec** — cooldown duration, session cap, window-based tracking mechanics. Pure integer arithmetic, no signal dependencies.
4. **Contradiction detection spec** — per-domain facet divergence with escalating threshold, threshold parameter pattern (default = config, `0` for amplify bypass), surfaced-pair exclusion. Governor detects deterministically from scoring data.
4b. **Convergence detection spec** — per-domain facet consistency across 3+ domains with escalating threshold, threshold parameter pattern, surfaced-facet exclusion. Mirror of contradiction: identity ("this is who you are") vs complexity ("you're different in different contexts").
5. **Entry pressure spec** — gap calculation from E_target vs territory expectedEnergy → `direct / angled / soft`. Graceful default when E_target unavailable.
6. **Closing design** — documented amplification + Netflix cut-to-black. Governor promotes `sessionPhase` to `"closing"` on `isFinalTurn`. Amplification instruction ("go deeper") as last prompt section. Overlays remain eligible. No wrap-up language.
7. **Prompt builder enrichment spec** — complete prompt composition: signature (`PromptBuilderInput` + `Territory`), intent-driven module selection, composition order per intent variant. Superseded by Decision 13 — see supersession note.
8. **Separation of concerns** — crisp boundary doc showing what the Governor owns vs what belongs to scorer, selector, prompt builder, and Nerin. Especially: what the Governor does NOT do (choose moves, extract themes, detect contradictions, construct narrative).
9. **Upgrade path** — documented criteria for when to promote the Governor to a full Move Generator with explicit base-move dispatch, and what that promotion looks like (additive, not rewrite).
10. **Test catalog** — enumerable test cases covering all window states × entry pressure calculations × edge cases.
11. **Pipeline wiring spec** — how the Governor slots into the existing `nerin-pipeline.ts` 8-step flow: which steps are new, which are modified, which are untouched.
12. **Session state spec** — `prompt_builder_input` + `governor_debug` jsonb columns on assistant messages + derive-at-read for session counters. No new tables.
13. **Per-domain extraction spec** — shared internal helpers between `computeFacetMetrics()` and new `computePerDomainFacetScores()`, exposing `mu_g` and `w_g` per facet×domain.

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

**Where the problem IS:**
- In the **frequency of noticing** — Nerin fires it on almost every message; content quality is good, restraint is missing
- In the **timing of contradiction** — Nerin surfaces contradictions too early, before enough cross-territory evidence; identification quality is good, patience is missing
- In **entry pressure calibration** — no mechanism translates E_target gap into how directly Nerin enters a territory
- In the **prompt builder's awareness** — current prompt builder has no knowledge of session phase, transition type, or suppression constraints
- In the **prompt composition** — the prompt builder has no awareness of Governor output, overlay mutual exclusion, or how to compose multiple signals into a coherent system prompt section
- In the **scope definition** — the original "move generator" concept tried to dispatch conversational actions that Nerin handles naturally, creating unnecessary complexity
- In the **pipeline wiring** — no specification for how the Governor slots into the existing `nerin-pipeline.ts` flow or where session state comes from

**Where the problem IS NOT:**
- In territory selection (selector's job — locked)
- In territory ranking (scorer's job — locked)
- In E_target computation (pacing formula — specced)
- In evidence extraction (ConversAnalyzer's job)
- In Nerin's conversational action choice — Nerin naturally chooses between invitation, connection, reflection, and reframing based on context
- In Nerin's noticing *content* — what Nerin notices is accurate and grounded
- In Nerin's contradiction *identification* — what Nerin spots as contradictory is sound
- In the territory catalog (25 territories, continuous expectedEnergy — locked)

**When the Governor DOES matter:**
- When overlays (noticing, contradiction, convergence) should be suppressed (most turns — restraint is the default)
- When an overlay should open (rare turns — emergence, divergence, or consistency crosses threshold)
- When entering a territory that's heavier than E_target suggests (entry pressure softening)
- When multiple overlays fire simultaneously (mutual exclusion — threshold ratio tiebreak, priority: contradiction > convergence > noticing)

**When the Governor DOES NOT matter:**
- On most regular turns where no overlay fires and no pressure adjustment is needed — the Governor is near-passthrough (`deepen` intent + `"direct"` entry + no focus)
- Between sessions — no state carries over
- On the final turn — Nerin doesn't know it's the last turn. The Governor operates normally. The hard limit is the frontend's concern, not the Governor's.

**Who IS affected:**
- The **prompt builder** (direct consumer — receives Governor output, enriches Nerin's system prompt with suppression signals and entry pressure)
- **Nerin** (indirect consumer — operates under constraints set by the Governor)
- **The user** (sole experiencer — the Governor shapes conversation rhythm through restraint)
- **Debug/replay** (needs to know which windows were open, what entry pressure was set, why)

**Who IS NOT affected:**
- The scorer (doesn't know the Governor exists)
- The selector (fire-and-forget — delivers 3 fields, done)
- Silent scoring (reads the user's response, not the Governor output)
- ConversAnalyzer (no scope changes — the Governor does not ask it to detect Nerin's behavior)

**Key diagnostic insight:** The original "move generator" concept tried to formalize what Nerin already does well (choosing conversational actions) while leaving unspecified what Nerin is bad at (restraint, frequency control, structural state tracking). The Governor reframe inverts this: trust Nerin's strengths, enforce where Nerin fails.

### Root Cause Analysis

**Five Whys:**

1. Why is the move generator under-specified? → Because the design sessions focused on the scorer and selector
2. Why did they focus there? → Because those layers are mathematically formalizable — the move generator sits at the seam between policy logic and conversational craft
3. Why was the move generator over-scoped? → Because it was designed to dispatch conversational actions (Pull/Bridge/Hold/Pivot) — a job Nerin already does naturally
4. Why was that over-scope not caught earlier? → Because nobody asked "what does Nerin already do well vs what does it fail at?" — the design assumed the policy layer should control everything
5. Why is the right scope thin? → Because Nerin's actual failure modes are narrow: over-noticing, premature contradiction, no entry pressure calibration. Everything else, Nerin handles.

**Root cause:** The move generator was over-scoped because it tried to formalize conversational action choice — something Nerin already does well — while leaving unspecified the restraint and structural signaling that Nerin actually needs. The correct scope is a **Move Governor**: a thin layer that enforces frequency control (noticing/contradiction windows), computes entry pressure (E_target gap), and passes through structural context (session phase, transition type) to an enriched prompt builder.

**The Governor is the only layer the user can feel** — but indirectly. The scorer ranks in silence. The selector picks in silence. The Governor constrains in silence. Nerin is where silence becomes speech. The Governor's job is to make sure Nerin's natural instincts are channeled well — not to replace them.

### Contributing Factors

1. The design assumed the policy layer should control conversational action choice, without first asking what Nerin already handles well
2. The selector and scorer consumed design attention because they're mathematically formalizable — the move generator was left as a catch-all for "everything else"
3. The old E_target-gap dispatch was never questioned after the selector boundary hardened — it became architecturally incoherent but remained in the design vocabulary
4. Noticing and Contradiction were treated as dispatch problems (what to notice, which contradiction to surface) rather than frequency problems (how often, when to start)
5. The prompt builder was built for a simpler world (territory guidance only) and has no awareness of session phase, transition context, entry pressure, or behavioral suppression
6. Nobody validated whether explicit move type dispatch (Pull/Bridge/Hold/Pivot) would produce behaviorally distinct LLM outputs — risking fake precision

### System Dynamics

**Three tensions the Governor operates within:**

**1. Restraint vs Opportunity Cost**

The Governor's primary job is suppression — preventing Nerin from over-noticing and surfacing contradictions too early. But suppression has a cost: every closed window is a missed opportunity for a powerful moment. If the noticing cap is too tight, the conversation feels flat. If the contradiction cooldown is too long, Nerin never gets to surface something genuine.

*Resolution:* Window-based tracking with calibrated constants. The cap and cooldown values determine the restraint/opportunity trade-off. Start conservative (more restraint), observe real conversations, loosen if moments feel too rare. The safe failure direction is always more restraint — a conversation with 2 noticings instead of 3 is better than a conversation where the user feels watched.

**Design principle:** Noticing and Contradiction **spend trust**. Every time Nerin says "I noticed something about you," the user gives a piece of their guard. If the moment was earned — genuinely grounded in something alive — the trust account grows. If it wasn't, the trust account shrinks. The Governor's job is to ensure Nerin has enough restraint that every open window represents a moment worth spending trust on.

**2. Territory Fidelity vs Entry Softness**

The selector picked territory X. The Governor must respect that. But "enter territory X" is not one thing — you can enter directly or at an angle. The Governor computes entry pressure from the E_target gap: if the territory is heavier than what the user can sustain, the prompt builder instructs Nerin to enter more softly.

*Resolution:* A simple gap calculation: `territory.expectedEnergy - normalizedETarget`. Large gap → `"soft"`. Small gap → `"direct"`. Medium → `"angled"`. Nerin handles the actual softening — the Governor just signals the pressure level.

**3. Structure vs Trust**

The Governor provides structural context Nerin can't compute (session phase, transition type, entry pressure, window state). But every additional constraint risks making Nerin sound assembled rather than natural. The more the Governor controls, the less room Nerin has.

*Resolution:* The Governor controls the minimum possible surface. It passes through 3 selector fields, computes 1 pressure value, and sets 2 overlay fields (at most one non-null per turn due to mutual exclusion). Six fields total. Everything else is Nerin's. The prompt builder translates these 6 fields into natural-sounding system prompt instructions, not rigid templates.

### Red Team Hardenings

Adversarial stress-testing of the original move generator design drove the reframe to the Governor approach. Key findings:

| # | Attack | Verdict | Action Taken |
|---|--------|---------|-------------|
| 1 | Full move dispatch risks fake precision — move types may not be behaviorally distinct in LLM output | **Validated — drove reframe** | Dropped explicit base move dispatch. Move types survive as design vocabulary, not dispatch targets. Governor trusts Nerin for conversational action choice. |
| 2 | Input contract required ~15 fields including unbuilt systems (ConversAnalyzer v2, contradiction detection, defensiveness signal) | **Validated — drove simplification** | Collapsed to 7 fields. All inputs exist today or are trivial session counters. Zero phantom dependencies. |
| 3 | Noticing/contradiction payloads duplicate what Nerin already has (conversation context) | **Validated — dropped payloads** | No anchorThemes, NoticingPayload, ContradictionPayload, or ClosingPayload. Nerin has the conversation history and decides content/targeting. Governor only controls frequency. |
| 4 | Feedback loop (detecting when Nerin fires noticing) adds complexity for marginal precision | **Validated — window-based tracking** | Governor tracks when it opened windows, not when Nerin used them. Cooldown runs from window-open. No response parsing, tags, heuristics, or extra LLM calls. |
| 5 | Closing-as-payload requires living thread extraction that Nerin can do itself | **Validated — reframed as amplification** | No wrap-up payload. Closing = amplification ("go deeper"), not wind-down. Governor promotes `sessionPhase` to `"closing"` on `isFinalTurn`. Overlays remain eligible. Nerin doesn't know it's ending — it gets permission to be braver. The conversation cuts at peak intensity. |

**Junction dynamics:**

```
Scorer (complex, locked)
    ↓ ranked list
Selector (thin, locked)
    ↓ 3 slim fields
MOVE GOVERNOR (restraint layer + deriveIntent)
    ↓ PromptBuilderInput        ↓ MoveGovernorDebug
      (discriminated union,       (3 decision traces)
       5 intent variants)
Prompt Builder             Debug/Replay System
(matches on intent,        (needs reasons, thresholds,
 selects modules,           emergence values,
 composes steering)         pressure gaps)
    ↓
Nerin (full conversation context + Governor constraints → natural response)
```

The Governor is thin by design — most turns it derives `intent: "deepen"` with `entryPressure: "direct"` and no overlays. Its interesting surface area is the rare turns where a `hold` or `amplify` intent fires.

---

## ANALYSIS

### Critical Reframing: Move Governor, Not Move Generator

During advanced elicitation (Red Team + First Principles), a fundamental reframing emerged:

**The original scope** was a full Move Generator that explicitly dispatches Pull/Bridge/Hold/Pivot as base moves, selects overlays, and produces structured prompt recipes. This required ~15 input fields, 4 decision points, theme extraction, contradiction detection systems, and feedback loops.

**The reframed scope** is a **Move Governor** — a thin rate-limiting layer that handles what LLMs are bad at (restraint, cooldowns, caps) and trusts Nerin for what it's naturally good at (conversational action choice, noticing quality, contradiction detection).

**Why the reframe:**

1. **Nerin already does noticing and contradiction well.** The *content* is good — noticing subjects are accurate, contradiction identification is sound. The problem is purely *frequency*: noticing fires on almost every message, contradiction surfaces too early. This is a throttling problem, not a dispatch problem.

2. **Explicit move dispatch risks fake precision.** The four move types (Pull/Bridge/Hold/Pivot) may not produce behaviorally distinct LLM outputs. Hard-coding a dispatch before validating that recipes produce different behavior risks freezing the wrong abstraction.

3. **The input contract collapses dramatically.** From ~15 fields requiring ConversAnalyzer v2, E_target pipeline, contradiction detection, and defensiveness signals — to ~7 fields requiring only the selector output + simple session counters.

4. **No feedback loop needed.** Instead of detecting when Nerin actually fires a noticing (which would require response parsing, tags, or an extra LLM call), the Governor tracks when it *opened the window*. Cooldown runs from window-open, not from observed event. The Governor is a closed system.

**What survives from the original design:**
- Four move types as **design vocabulary** for prompt instructions and post-hoc analysis
- Entry pressure calculation (E_target vs territory expectedEnergy gap)
- Separation of concerns (Governor never chooses territory, never reads coverage/portrait state)

**What's dropped:**
- Explicit base move dispatch (Pull/Bridge/Hold/Pivot selection logic)
- Prompt recipes per move type
- anchorThemes / focal content extraction
- NoticingPayload / ContradictionPayload / ClosingPayload
- Signal-based gates (telling peaks, energy thresholds, drain checks, defensiveness)
- Feedback loop from Nerin's response back to Governor

### Force Field Analysis

**Driving Forces (Supporting Solution):**

- **Locked upstream contracts** — selector delivers 3 slim fields, Governor input is known
- **Hybrid model matches reality** — contradiction has a deterministic evidence basis (facet score divergence across domains), noticing is naturally good in content but needs frequency throttling. Different mechanisms for different problems.
- **Escalating threshold is self-regulating** — no hardcoded caps. The formula naturally lands at 0-2 contradictions based on evidence quality. The design *is* the limit.
- **Existing silent scoring data** — per-facet evidence with scores already exists. Contradiction detection is a pure aggregation function over existing data, not a new system.
- **Clean upgrade path** — Governor → full Move Generator is additive if data shows Nerin needs more constraint. Noticing can be promoted from throttle to system-proposed candidates (v1.5) if needed.
- **Existing prompt builder** — `territory-prompt-builder.ts` provides the extension point for Governor-enriched prompts
- **Zero new LLM calls** — the Governor adds no inference cost

**Restraining Forces (Blocking Solution):**

- **E_target not yet implemented** — entry pressure calculation depends on the pacing formula, which is specced but not built. Defaults to `"direct"` until available.
- **Contradiction calibration parameters** — `BASE_STRENGTH_THRESHOLD`, `ESCALATION`, `CONF_MIN`, `DELTA_MIN` need calibration against real scoring data. V1 defaults will be estimates.
- **Per-domain facet score aggregation** — silent scoring extracts per-facet evidence, but grouping by life domain and computing domain-conditioned scores may require a new aggregation step.
- **Move type debuggability is post-hoc only** — without explicit dispatch, you can't log "this was a Bridge turn" at decision time. Requires post-hoc classification if move-level analytics are needed.
- **Noticing window precision** — one-turn windows mean some windows will be wasted (Nerin doesn't notice on that specific turn). Acceptable trade-off for simplicity.

**Balance:** Driving forces dominate. The hybrid model (evidence-triggered contradiction + throttled noticing) matches each problem's nature. Calibration parameters are the main open work — the design shape is sound.

### Constraint Identification

**Primary constraint: The Governor is a hybrid — trigger for contradiction, throttle for noticing.**

The Governor uses different mechanisms for different problems:
- **Contradiction:** System-triggered from evidence. The Governor detects facet score divergence across life domains and passes the specific target to Nerin via the prompt builder. Nerin frames it as fascination — the Governor identifies *what*, Nerin decides *how*.
- **Noticing:** Nerin-led with frequency throttle. Nerin's noticing content is already good. The Governor only controls *when* (cooldown + cap via window-based tracking). Nerin decides *what* to notice and *whether* to notice on an open turn.
- **Entry pressure:** Governor-computed from E_target gap. Nerin doesn't have E_target.
- **Structural context:** Pass-through from selector (session phase, transition type, territory).

**Secondary constraint: No hardcoded caps or limits.**

Contradiction frequency is controlled by an escalating strength threshold formula, not by `MAX_CONTRADICTIONS = 2`. The formula naturally produces 0-2 contradictions depending on evidence quality. Calibration parameters (`BASE_STRENGTH_THRESHOLD`, `ESCALATION`, `CONF_MIN`, `DELTA_MIN`) are tunable — the design shape is fixed, the values come from data.

**Tertiary constraint: Mutual exclusion (at most one overlay per turn).**

All three overlays (noticing, contradiction, convergence) spend trust. All say "I see you." Combining them in one response makes the user feel studied, not seen. When multiple cross their thresholds on the same turn, the **threshold ratio tiebreak** decides: each signal's value divided by its required threshold. The signal with the higher ratio — i.e., the one that exceeded its own bar by more — wins. Equal ratios → tiebreak priority: contradiction > convergence > noticing (rarest to commonest). The deferred signal is re-evaluated next turn; noticing emergence survives via EMA smoothing, deferred contradictions/convergences remain candidates. Collision rate and tiebreak outcomes tracked in debug with `deferredBy` field for monitoring.

**Quaternary constraint: Safe failure direction.**

- Noticing: deferred by other overlay or insufficient emergence → fewer noticings, not more. Safe.
- Contradiction: escalating threshold → later contradictions are harder to trigger, not easier. Safe.
- Convergence: MIN_CONVERGENCE_DOMAINS + escalating threshold → requires substantial cross-domain evidence. Safe.
- Entry pressure: missing E_target → defaults to `"direct"` (no softening). Safe — Nerin enters normally.
- Mutual exclusion: threshold ratio tiebreak → the stronger signal (relative to its own bar) wins. At worst one fewer overlay per session. Safe — restraint over overexposure.

**Quinary constraint: Opening phase has explicit prompt instructions.**

`sessionPhase: "opening"` (turn 1) triggers specific prompt builder instructions: invite the user into the territory with a warm, concrete question. No reflection (nothing to reflect on), no bridging (nothing to bridge from), no contradiction, no noticing. This is a prompt builder rule, not a Governor field — but it must be documented in the prompt builder enrichment spec. (Carries forward selector spec Invariant 8: opening constrains to Pull.)

### Key Insights

1. **Contradiction is evidence-based, noticing is frequency-based.** These are different problems requiring different mechanisms. Contradiction has a clean deterministic signal (facet score divergence across life domains). Noticing is fuzzier — salience and timing, not score comparison. The Governor uses the right tool for each.

2. **Escalating threshold replaces hardcoded caps.** `requiredStrength(n) = BASE_STRENGTH_THRESHOLD * ESCALATION ^ n` where n = contradictions already surfaced. First contradiction needs moderate strength. Second needs significantly more. Third is practically unreachable. The formula is the cap — no arbitrary limits.

3. **Surfaced-pair tracking prevents repetition.** Each contradiction target (facet × domain pair) is tracked. Once surfaced, that pair is excluded from future candidates. Combined with escalating threshold, this naturally spaces contradictions and ensures each one is genuinely new.

4. **Contradiction rhythm emerges from evidence, not from timing.** No turn-based cooldown. The evidence thresholds (`CONF_MIN`, `DELTA_MIN`) naturally prevent premature firing — not enough evidence early in the session. As the conversation explores more domains, evidence accumulates, and candidates emerge organically. Sophia's narrative timing (Act I: impossible, Act II: possible, Act III: integration) emerges from the evidence landscape without being encoded.

5. **Window-based noticing tracking is a closed system.** The Governor tracks when it opened windows, not when Nerin used them. One-turn windows: open, cooldown restarts regardless. No feedback loop, no response parsing, no extra LLM calls. Wasted windows are the acceptable cost of simplicity.

6. **Entry pressure is the Governor's only computed decision (besides contradiction).** The gap between E_target and territory expectedEnergy determines `direct / angled / soft`. Everything else is pass-through or integer comparison.

7. **Closing is amplification, not wrap-up.** The Governor promotes `sessionPhase` to `"closing"` on the final turn. Closing adds a "go deeper" instruction — Nerin gets permission to be braver. Overlays remain eligible. The conversation ends at the hard limit, at peak intensity. The scorer's conversation skew + amplification compound to produce the Netflix cut-to-black.

8. **Debug output is a first-class contract.** The Governor produces a debug trace alongside its primary output: window states, suppression reasons, entry pressure gap value, contradiction candidate strength vs threshold. Matches the selector's debug pattern.

---

## SOLUTION GENERATION

### Methods Used

- **Party Mode Panel** (Dr. Quinn, Winston, Sophia) — collaborative design with adversarial stress-testing
- **Cross-Agent Validation** — parallel agent proposals compared and merged for signal formula vs rhythm gating
- **Storyteller Consultation** — Sophia provided narrative-grounded pacing guidance for noticing rhythm
- **Red Team / First Principles** — from prior analysis sections, carried forward into solution constraints

### Solution Spec: Move Governor

The Move Governor is a thin restraint-and-context layer between the territory selector and the prompt builder. It makes four deterministic decisions per turn: entry pressure, noticing hint, contradiction target, and convergence target. At most one overlay (noticing, contradiction, or convergence) reaches Nerin per turn — mutual exclusion via threshold ratio tiebreak enforced by the Governor orchestrator. Everything else is trusted to Nerin.

#### Governor Input Contract

```typescript
type MoveGovernorInput = {
  // From pipeline (resolved — pipeline does catalog lookups)
  territory: Territory                              // full Territory, resolved by pipeline
  previousTerritory: Territory | null               // resolved by pipeline from prior message

  // Pacing
  eTarget: number | null                            // from pacing formula, null until built
  isFinalTurn: boolean                              // turnNumber >= maxTurnsPerSession
  turnNumber: number
  totalExpectedTurns: number                        // config default (25)

  // Raw session history — Governor derives surfaced sets internally
  priorAssistantMessages: AssistantMessageRecord[]  // prior messages with promptBuilderInput

  // Scoring data (shared by noticing, contradiction, and convergence)
  perDomainFacetScores: PerDomainFacetScore[]       // reuses existing scoring primitives
}

type AssistantMessageRecord = {
  promptBuilderInput: PromptBuilderInput             // stored as jsonb (territory stored as TerritoryId)
}

type PerDomainFacetScore = {
  facet: FacetName
  domain: LifeDomain
  mu_g: number              // domain mean deviation [-3, +3]
  w_g: number               // domain context weight (√Σ final_weight)
  evidenceCount: number     // evidence items in this facet×domain
}
```

**All inputs exist today or are trivial.** `mu_g` and `w_g` come directly from `computeFacetMetrics()` in `packages/domain/src/utils/formula.ts`. `eTarget` defaults to `null` until the pacing pipeline is built. `priorAssistantMessages` come from the message repository — the Governor derives all session state (surfaced sets, counters) internally via `reconstructGovernorSessionState()`.

**Note:** `sessionPhase` and `transitionType` from the selector are NOT Governor inputs. The Governor derives intent from `turnNumber` (open), `isFinalTurn` (amplify), overlay firing (hold), and territory comparison (bridge/deepen). The selector's phase and transition fields are written directly to `MoveGovernorDebug` by the pipeline for observability — the Governor never reads them.

#### Governor Output Contract

The Governor's external contract is `PromptBuilderInput` — a discriminated union, not a flat struct. The Governor runs `deriveIntent()` internally to map its 4 decisions + session state into the correct variant, then outputs the shaped type directly. Each variant carries only the fields its intent needs:

```typescript
type DomainScore = { domain: LifeDomain; score: number; confidence: number }

type ContradictionTarget = {
  facet: FacetName
  pair: [DomainScore, DomainScore]
  strength: number
}

type ConvergenceTarget = {
  facet: FacetName
  domains: DomainScore[]              // 3+ domains, all scoring similarly
  strength: number
}

type EntryPressure = "direct" | "angled" | "soft"
type ConversationalIntent = "open" | "deepen" | "bridge" | "hold" | "amplify"

// ─── Moment Focus (tagged union) ───────────────────
type NoticingFocus = {
  readonly _tag: "NoticingFocus"
  readonly domain: LifeDomain
}

type ContradictionFocus = {
  readonly _tag: "ContradictionFocus"
  readonly target: ContradictionTarget
}

type ConvergenceFocus = {
  readonly _tag: "ConvergenceFocus"
  readonly target: ConvergenceTarget
}

type MomentFocus = NoticingFocus | ContradictionFocus | ConvergenceFocus

// ─── Prompt Builder Input (discriminated union) ────
type PromptBuilderInput =
  | {
      readonly intent: "open"
      readonly territory: Territory
    }
  | {
      readonly intent: "deepen"
      readonly territory: Territory
      readonly entryPressure: EntryPressure
    }
  | {
      readonly intent: "bridge"
      readonly territory: Territory
      readonly previousTerritory: Territory
      readonly entryPressure: EntryPressure
    }
  | {
      readonly intent: "hold"
      readonly territory: Territory
      readonly focus: MomentFocus
    }
  | {
      readonly intent: "amplify"
      readonly territory: Territory
      readonly focus: MomentFocus | null
    }
```

**Intent derivation rules** (inside Governor, not exposed):

| Condition | Intent |
|-----------|--------|
| `turnNumber === 1` | `open` |
| `isFinalTurn` | `amplify` |
| Noticing, contradiction, or convergence fires | `hold` |
| `previousTerritory !== null && territory !== previousTerritory` | `bridge` |
| Otherwise (same territory or first exploring turn) | `deepen` |

Priority: `open` > `amplify` > `hold` > `bridge` / `deepen`. On `amplify`, the Governor evaluates only contradiction and convergence (noticing excluded — it's a local signal, not a culmination). Thresholds are bypassed (threshold parameter = 0). Surfaced-pair/facet exclusion still applies (don't repeat). The Governor picks the strongest single candidate and wraps it in `MomentFocus`, or `null` if neither has a candidate. Nerin gets one focused signal for the final beat, not two competing signals.

**Field sources:**
- `territory` — resolved from `TerritoryId` by pipeline via catalog lookup
- `previousTerritory` — resolved by pipeline from prior message's stored `TerritoryId`
- `entryPressure` — computed from gap between E_target and `territory.expectedEnergy`
- `focus` — the `MomentFocus` variant wrapping whichever overlay fired (noticing domain, contradiction target, or convergence target)

**Note on serialization:** When `PromptBuilderInput` is persisted to jsonb on `assessment_message`, territories are stored as `TerritoryId` (not full `Territory` objects). The pipeline resolves them fresh from the catalog when reading back for reconstruction. Consistent with derive-at-read.

#### Governor Debug Output

Diagnostic trace for replay and debugging (separate consumer, not sent to Prompt Builder). Each of the Governor's 4 decisions carries a discriminated debug union — no impossible states, pattern-matchable, minimum relevant context per outcome:

```typescript
// --- Entry Pressure Debug ---
type EntryPressureDebug =
  | { result: "direct"; reason: "no_etarget" }
  | { result: "direct"; reason: "amplify_no_pressure" }
  | { result: "direct"; reason: "within_range";
      eTarget: number; territoryEnergy: number; gap: number;
      thresholdLow: number }
  | { result: "angled"; reason: "moderate_gap";
      eTarget: number; territoryEnergy: number; gap: number;
      thresholdLow: number; thresholdHigh: number }
  | { result: "soft"; reason: "large_gap";
      eTarget: number; territoryEnergy: number; gap: number;
      thresholdHigh: number }

// --- Noticing Debug ---
type NoticingDebug =
  | { reason: "excluded_from_amplify" }
  | { reason: "skipped_opening" }
  | { reason: "no_emergence" }
  | { reason: "below_threshold";
      topDomain: LifeDomain; topFacet: FacetName;
      emergence: number; required: number;
      emaClarity: number; baseline: number; baselineConfidence: number;
      phaseWeight: number }
  | { reason: "already_surfaced"; domain: LifeDomain }
  | { reason: "deferred_by_other";
      topDomain: LifeDomain; topFacet: FacetName;
      emergence: number; required: number;
      deferredBy: "contradiction" | "convergence" }
  | { reason: "fired";
      domain: LifeDomain; topFacet: FacetName;
      emergence: number; required: number;
      emaClarity: number; baseline: number; baselineConfidence: number;
      phaseWeight: number }

// --- Contradiction Debug ---
type ContradictionDebug =
  | { reason: "no_candidates" }
  | { reason: "below_threshold";
      candidateCount: number;
      topStrength: number; requiredStrength: number }
  | { reason: "already_surfaced";
      candidateCount: number;
      topStrength: number; requiredStrength: number;
      target: ContradictionTarget }
  | { reason: "deferred_by_other";
      candidateCount: number;
      topStrength: number; requiredStrength: number;
      target: ContradictionTarget;
      deferredBy: "noticing" | "convergence" }
  | { reason: "fired";
      candidateCount: number;
      topStrength: number; requiredStrength: number;
      target: ContradictionTarget }

// --- Convergence Debug ---
type ConvergenceDebug =
  | { reason: "no_candidates" }
  | { reason: "below_threshold";
      candidateCount: number;
      topStrength: number; requiredStrength: number }
  | { reason: "already_surfaced";
      facet: FacetName; strength: number }
  | { reason: "deferred_by_other";
      facet: FacetName; strength: number; requiredStrength: number;
      deferredBy: "noticing" | "contradiction" }
  | { reason: "fired";
      facet: FacetName; domainCount: number;
      spread: number; strength: number; requiredStrength: number }

// --- Composite ---
type MoveGovernorDebug = {
  selectionRule: string
  isFinalTurn: boolean
  entryPressure: EntryPressureDebug
  noticing: NoticingDebug
  contradiction: ContradictionDebug
  convergence: ConvergenceDebug
  // Pipeline attaches these for observability (Governor does not read them):
  selectorSessionPhase: "opening" | "exploring"
  selectorTransitionType: "continue" | "transition"
}
```

---

### Decision 1: Entry Pressure

**What it solves:** Nerin doesn't have E_target. When the selected territory is heavier than the user can sustain, Nerin should enter more softly.

**Formula:**

```typescript
function computeEntryPressure(
  eTarget: number | null,
  territory: Territory
): "direct" | "angled" | "soft" {
  if (eTarget === null) return "direct"  // safe default — no softening

  const expectedEnergy = ENERGY_LEVEL_VALUE[territory.energyLevel]
  // light → 0.3, medium → 0.5, heavy → 0.8 (normalized to 0-1)

  const normalizedETarget = eTarget / 10  // E_target is 0-10 → normalize to 0-1
  const gap = expectedEnergy - normalizedETarget

  if (gap <= PRESSURE_THRESHOLD_LOW) return "direct"
  if (gap >= PRESSURE_THRESHOLD_HIGH) return "soft"
  return "angled"
}
```

**Calibration parameters:**

| Parameter | Role | Starting estimate |
|---|---|---|
| `PRESSURE_THRESHOLD_LOW` | Below this gap → direct entry | 0.15 |
| `PRESSURE_THRESHOLD_HIGH` | Above this gap → soft entry | 0.35 |

**Safe failure:** Missing E_target → `"direct"`. Nerin enters normally.

---

### Decision 2: Noticing Hint (Clarity Emergence)

**What it solves:** Nerin's noticing content is excellent but fires on almost every turn. The Governor opens noticing windows based on evidence — when a pattern in a life domain becomes clearer than its historical norm — and provides a domain-level compass without prescribing what to notice.

**Design principles (from Sophia):**
- Noticing spends trust. Every open window should represent a moment worth spending trust on.
- The signal is movement, not position — something *becoming* legible, not something that already was.
- Domain compass, not facet target — point Nerin toward where to look, let Nerin discover what's alive.
- 2 noticings is the natural landing, 3 is the ceiling, 0 is valid.
- Never in opening, densest in mid-exploring. Excluded from amplify (final turn) — noticing is a local signal, not a culmination. Contradiction and convergence are the right overlays for the final beat.

**Formula — six layers, each with a clear role:**

```typescript
// ── Layer 1: Signal (reuses existing scoring primitives) ──

lean(f, d, t)    = abs(mu_g(f, d, t)) / 3                       // [0, 1]
conf(f, d, t)    = C_MAX * (1 - exp(-k * w_g(f, d, t)))         // [0, 0.9]
clarity(f, d, t) = lean(f, d, t) * conf(f, d, t)                // [0, 0.9]

// clarity = lean × conf does SOFT gating:
//   low confidence → low clarity (no hard CONF_MIN gate)
//   neutral deviation → low lean → low clarity (no hard LEAN_MIN gate)
//   the multiplication IS the gate

// ── Layer 2: Noise reduction (3-turn EMA) ──

emaClarity(f, d, t) =
  EMA_DECAY * clarity(f, d, t)
  + (1 - EMA_DECAY) * emaClarity(f, d, t-1)

// Bootstrap: emaClarity at first evidence turn = clarity at that turn
// EMA_DECAY = 0.5 → current turn 50%, t-1 25%, t-2 12.5%
// Dampens one-turn spikes, lets sustained shifts through

// ── Layer 3: Emergence (smoothed recent vs historical norm + baseline confidence) ──

baseline(f, d, t)  = mean(clarity(f, d, 1..t-1))    // from first evidence, excluding current turn
rawEmergence(f, d, t) = max(0, emaClarity(f, d, t) - baseline(f, d, t))

// Baseline confidence: scales emergence by history depth
// Prevents false positives from late-appearing facet×domain combinations
// whose zero baseline would inflate emergence
historyLength(f, d, t) = count of prior turns with evidence for this facet×domain
baselineConfidence(f, d, t) = 1 - exp(-BASELINE_GROWTH * historyLength(f, d, t))
// historyLength=0: confidence=0.00 → first appearance never fires
// historyLength=1: confidence≈0.50 → emergence halved
// historyLength=2: confidence≈0.75 → emergence at 75%
// historyLength=3: confidence≈0.88 → nearly full
// historyLength=5+: confidence≈0.97+ → effectively 1.0

emergence(f, d, t) = rawEmergence(f, d, t) * baselineConfidence(f, d, t)

// Asks: "is this facet×domain more legible now than it has usually been,
// AND do I have enough history to trust that judgment?"
// A genuinely strong signal on turn 5 with 2 prior data points still fires (75% of raw emergence).
// Catches both sudden spikes (EMA jumps) and gradual crystallization (EMA rises above slow-moving baseline)

// ── Layer 4: Domain aggregation ──

domainEmergence(d, t) = max_f(emergence(f, d, t))

// Best facet emergence per domain — only the strongest signal matters
// The facet identity is kept for debug only, never passed to Nerin

// ── Layer 5: Rhythm gate (phase + escalation) ──

requiredEmergence =
  BASE_NOTICE_THRESHOLD
  * phaseWeight(turnNumber / totalExpectedTurns)
  * ESCALATION_N ^ surfacedNoticingDomains.size

// Phase weight: U-shaped parabola — hardest at conversation edges, easiest at midpoint
phaseWeight(p) = PHASE_BASE + PHASE_CURVE * (2 * p - 1)²
// p=0.0 (start): PHASE_BASE + PHASE_CURVE = 1.6
// p=0.5 (middle): PHASE_BASE = 1.0
// p=1.0 (end): PHASE_BASE + PHASE_CURVE = 1.6

// Escalation: each surfaced noticing raises the bar
// n=0: threshold × 1.0 (first noticing — standard)
// n=1: threshold × 1.8 (second — needs stronger evidence)
// n=2: threshold × 3.24 (third — practically requires a dramatic spike at midpoint)

// ── Layer 6: Decision ──

bestDomain = argmax_d(domainEmergence(d, t))

noticingHint =
  sessionPhase === "exploring"
  && domainEmergence(bestDomain, t) >= requiredEmergence
  && bestDomain not in surfacedNoticingDomains
    ? bestDomain
    : null

// NOTE: noticingHint is computed independently, then subject to mutual
// exclusion via threshold ratio tiebreak at the Governor orchestrator
// level. If contradictionTarget also fires and has a higher ratio
// (strength/required >= emergence/required), noticingHint is set to
// null and debug records reason = "deferred_by_contradiction".
// If noticing has the higher ratio, contradictionTarget is deferred
// instead. The deferred signal is re-evaluated next turn.
```

**Why clarity emergence, not score velocity:**

The original panel proposed `surpriseVelocity = |currentScore - priorScore| / priorStability`. Cross-agent validation identified that raw score velocity answers "what moved?" while clarity emergence answers "what just became worth saying?" A score can jump on thin evidence. Clarity requires both a real pattern (lean) AND enough evidence to back it (confidence). Clarity emergence is closer to what noticing actually is — legible emergence, not raw motion.

**Why EMA instead of plain delta or blended emergence:**

- `clarity(t) - clarity(t-1)` is too twitchy — one strong evidence item spikes it
- Blended `α * longEmergence + (1-α) * shortEmergence` works but adds a preference knob
- EMA on the signal side gives short + medium memory behavior with one parameter instead of two
- A sustained 3-turn rise comes through at full strength; a one-turn spike is halved

**Why conversation-average baseline instead of previous-turn delta:**

- Previous-turn delta misses gradual crystallization (0.02/turn for 8 turns = invisible)
- Conversation average catches both spikes AND slow builds
- Naturally stable by mid-conversation when the phase gate opens
- Answers: "is this now above its own historical normal?" — which IS noticing

**Calibration parameters:**

| Parameter | Role | Starting estimate |
|---|---|---|
| `C_MAX` | Confidence ceiling | 0.9 (existing) |
| `k` | Confidence growth rate | 0.7 (existing) |
| `EMA_DECAY` | Signal smoothing (3-turn window) | 0.5 |
| `BASE_NOTICE_THRESHOLD` | Baseline emergence to fire | Calibrate from data |
| `ESCALATION_N` | Harder after each noticing | 1.8 |
| `PHASE_BASE` | Min phase multiplier (at midpoint) | 1.0 |
| `PHASE_CURVE` | Edge penalty strength | 0.6 |
| `BASELINE_GROWTH` | How quickly baseline confidence builds with history | 0.7 |
| `totalExpectedTurns` | Config default for phase curve | 25 |

Note: `C_MAX` and `k` are reused from existing `FORMULA_DEFAULTS` — not new parameters. `BASELINE_GROWTH` reuses the same exponential saturation shape as the confidence formula — consistent design vocabulary.

**What a typical 25-turn conversation produces** (`maxTurnsPerSession = 25`):

- Turn 1 (opening): impossible — orchestrator skips noticing for `open` intent
- Turns 2-4 (early exploring): unlikely — high phase multiplier + thin baseline confidence (0-75%) + little evidence
- Turns 5-6 (early exploring): possible if a strong signal emerges with 2+ prior data points — baseline confidence ≈ 75-88%
- Turns 7-18 (mid exploring): 1st noticing likely lands here, 2nd possible if a different domain spikes
- Turns 19-24 (late exploring): 3rd theoretically possible but `ESCALATION_N² × high phase weight` makes it very hard
- Turn 25 (amplify): noticing excluded — contradiction and convergence only for the final beat

Sophia's "2 natural, 3 ceiling, 0 valid" — emergent from the formula, not hardcoded. The Governor is near-passthrough for the first ~4-5 turns by design — insufficient evidence for overlays, and the conversation benefits from unstructured exploration early.

---

### Decision 3: Contradiction Target (Facet Divergence Across Domains)

**What it solves:** Nerin spots contradictions well but surfaces them too early, before enough cross-territory evidence. The Governor detects when the same facet shows genuinely different scores across two life domains and passes the specific target to Nerin.

**Key difference from noticing:** Contradiction has a natural *target* (facet × domainA × domainB) that Nerin needs to frame the contradiction. Noticing has a *compass* (domain) because the content is fuzzier. Different problems, different output shapes.

**Contradiction detection:**

```typescript
// Internal candidate type (flat, convenient for computation)
type ContradictionCandidate = {
  facet: FacetName
  domainA: LifeDomain; muA: number; wA: number
  domainB: LifeDomain; muB: number; wB: number
  strength: number
}

// threshold parameter: default = escalating config threshold, 0 for amplify bypass
function findContradictionTarget(
  input: MoveGovernorInput,
  surfacedPairs: Set<string>,
  threshold: number = computeContradictionThreshold(surfacedPairs)
): ContradictionTarget | null {
  // NOTE: No phase check here — orchestrator controls when to call detection functions

  const candidates: ContradictionCandidate[] = []

  // For each facet, compare all domain pairs
  for (const facet of uniqueFacets(input.perDomainFacetScores)) {
    const domainScores = getDomainScores(facet, input.perDomainFacetScores)

    for (const [domA, domB] of allPairs(domainScores)) {
      const pairKey = `${facet}:${domA.domain}:${domB.domain}`
      if (surfacedPairs.has(pairKey)) continue

      const confA = C_MAX * (1 - Math.exp(-k * domA.w_g))
      const confB = C_MAX * (1 - Math.exp(-k * domB.w_g))
      const delta = Math.abs(domA.mu_g - domB.mu_g)

      // Strength: how strong is this contradiction signal?
      // Combines divergence magnitude with confidence floor
      const strength = delta * Math.min(confA, confB)

      candidates.push({
        facet, domainA: domA.domain, muA: domA.mu_g, wA: domA.w_g,
        domainB: domB.domain, muB: domB.mu_g, wB: domB.w_g,
        strength
      })
    }
  }

  if (candidates.length === 0) return null

  // Pick strongest candidate
  candidates.sort((a, b) => b.strength - a.strength)
  const top = candidates[0]

  if (top.strength < threshold) return null

  // Map internal candidate to public ContradictionTarget (tuple shape)
  const confA = C_MAX * (1 - Math.exp(-k * top.wA))
  const confB = C_MAX * (1 - Math.exp(-k * top.wB))
  return {
    facet: top.facet,
    pair: [
      { domain: top.domainA, score: top.muA, confidence: confA },
      { domain: top.domainB, score: top.muB, confidence: confB }
    ],
    strength: top.strength
  }
}

function computeContradictionThreshold(surfacedPairs: Set<string>): number {
  return BASE_STRENGTH_THRESHOLD * ESCALATION_C ** surfacedPairs.size
}
```

**Escalating threshold formula:**

```
requiredStrength(n) = BASE_STRENGTH_THRESHOLD * ESCALATION_C ^ n
```

- n=0: `BASE_STRENGTH_THRESHOLD × 1.0` — first contradiction, standard bar
- n=1: `BASE_STRENGTH_THRESHOLD × ESCALATION_C` — second needs significantly stronger evidence
- n=2: `BASE_STRENGTH_THRESHOLD × ESCALATION_C²` — third is practically unreachable

**No hardcoded `MAX_CONTRADICTIONS`.** The escalating threshold IS the cap. It naturally produces 0-2 contradictions depending on evidence quality. The formula is the limit.

**Surfaced-pair tracking:** Each fired contradiction registers its `facet:domainA:domainB` key. Once surfaced, that pair is excluded from future candidates. Combined with escalation, this ensures each contradiction is genuinely new and progressively harder to earn.

**Contradiction rhythm emerges from evidence, not timing.** No turn-based cooldown. Early in the session, there isn't enough cross-domain evidence to produce strong candidates. As the conversation explores more domains, evidence accumulates and candidates emerge organically.

**Calibration parameters:**

| Parameter | Role | Starting estimate |
|---|---|---|
| `BASE_STRENGTH_THRESHOLD` | Minimum strength for first contradiction | Calibrate from data |
| `ESCALATION_C` | How much harder each subsequent contradiction | ~2.0 |

---

### Decision 3b: Convergence Target (Facet Alignment Across Domains)

**What it solves:** Convergence is the mirror of contradiction. Where contradiction detects a facet scoring *differently* across two domains, convergence detects a facet scoring *similarly* across three or more domains. Contradiction surfaces complexity ("you're assertive at work but accommodating in relationships"). Convergence surfaces identity ("this curiosity threads through everything you do — work, friendships, solitude").

**Key difference from contradiction:** Convergence requires *breadth* (3+ domains), not a pair. Two domains converging could be coincidence. Three is a pattern. Four is identity. The minimum domain count means convergence is structurally a later-session signal — you need enough conversation for the same facet to appear across multiple life domains.

**Key difference from noticing:** Noticing detects *movement* in one domain (emergence). Convergence detects *consistency* across domains (alignment). Noticing says "something is shifting." Convergence says "this is who you are."

**Convergence detection:**

```typescript
// Internal candidate type
type ConvergenceCandidate = {
  facet: FacetName
  domainScores: { domain: LifeDomain; mu_g: number; w_g: number }[]
  spread: number
  strength: number
}

// threshold parameter: default = escalating config threshold, 0 for amplify bypass
function findConvergenceTarget(
  input: MoveGovernorInput,
  surfacedFacets: Set<string>,
  threshold: number = computeConvergenceThreshold(surfacedFacets)
): ConvergenceTarget | null {
  // NOTE: No phase check here — orchestrator controls when to call detection functions

  const candidates: ConvergenceCandidate[] = []

  for (const facet of uniqueFacets(input.perDomainFacetScores)) {
    const domainScores = getDomainScores(facet, input.perDomainFacetScores)

    // Need 3+ domains with evidence
    if (domainScores.length < MIN_CONVERGENCE_DOMAINS) continue

    // Compute spread: max(mu_g) - min(mu_g) across domains
    const muValues = domainScores.map(d => d.mu_g)
    const spread = Math.max(...muValues) - Math.min(...muValues)

    // Hard gate — spread above MAX_SPREAD isn't convergence regardless of confidence
    if (spread > MAX_SPREAD) continue

    // Confidence floor across all domains
    const confidences = domainScores.map(d =>
      C_MAX * (1 - Math.exp(-k * d.w_g))
    )
    const minConf = Math.min(...confidences)

    // Strength: tighter clustering × confidence
    // Normalize spread to [0,1] where 0 = identical, 1 = max divergence (6)
    const normalizedSpread = spread / 6  // mu_g range is [-3, +3] → max spread = 6
    const strength = (1 - normalizedSpread) * minConf

    candidates.push({ facet, domainScores, spread, strength })
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => b.strength - a.strength)
  const top = candidates[0]

  // Check surfaced facets (per-facet exclusion, not per-pair)
  const key = `convergence:${top.facet}`
  if (surfacedFacets.has(key)) return null

  if (top.strength < threshold) return null

  // Map to public ConvergenceTarget
  return {
    facet: top.facet,
    domains: top.domainScores.map(d => ({
      domain: d.domain,
      score: d.mu_g,
      confidence: C_MAX * (1 - Math.exp(-k * d.w_g))
    })),
    strength: top.strength
  }
}

function computeConvergenceThreshold(surfacedFacets: Set<string>): number {
  return BASE_CONVERGENCE_THRESHOLD * ESCALATION_V ** surfacedFacets.size
}
```

**Exclusion tracking is per-facet, not per-domain-set.** Once "curiosity is consistent across your life" has been surfaced, there's no second convergence for curiosity that adds value — regardless of which domains were involved.

**`MAX_SPREAD` hard gate.** A spread of 0.5 across 4 domains is tight convergence. A spread of 2.0 is not convergence at all. The `(1 - normalizedSpread) * minConf` formula naturally suppresses high-spread candidates, but `MAX_SPREAD` provides a hard floor to prevent mathematically "strong" but psychologically meaningless signals.

**Convergence rhythm:** Like contradiction, convergence rhythm emerges from evidence, not timing. Early in the session, few facets have 3+ domain coverage. As the conversation explores more domains, candidates emerge organically. Convergence is structurally the latest-firing overlay — it needs the most evidence.

**Calibration parameters:**

| Parameter | Role | Starting estimate |
|---|---|---|
| `BASE_CONVERGENCE_THRESHOLD` | Minimum strength for first convergence | Calibrate from data |
| `ESCALATION_V` | Harder after each convergence | ~2.5 (higher than contradiction — convergence should be rarer) |
| `MAX_SPREAD` | Hard gate — spread above this isn't convergence | 1.5 (mu_g range) |
| `MIN_CONVERGENCE_DOMAINS` | Minimum domains required | 3 |

**Domain exclusion rationale for noticing (applies here by contrast):** Noticing operates at domain-level compass. Two noticings in the same domain produce identical user-facing language regardless of the underlying facet. Late-session facet signals in excluded noticing domains are not lost — they flow into contradiction (cross-domain divergence) and convergence (cross-domain alignment), which are higher-order observations that carry more narrative weight. The domain exclusion is a *promotion mechanism*, not a limitation.

---

### Separation of Concerns

| Concern | Owner | Governor's Role |
|---|---|---|
| Territory ranking | Scorer | None |
| Territory selection | Selector | None — Governor receives resolved `Territory` from pipeline |
| Session phase / transition type | Selector | Not consumed by Governor — pipeline attaches to debug for observability |
| Intent derivation | **Governor** | Derived from `turnNumber`, `isFinalTurn`, overlay firing, territory comparison |
| Entry pressure | **Governor** | Computed from E_target gap |
| Noticing timing | **Governor** | Clarity emergence formula with baseline confidence |
| Noticing domain hint | **Governor** | Domain-level compass via `NoticingFocus` |
| Noticing content | Nerin | Governor provides domain compass only |
| Contradiction detection | **Governor** | Facet divergence across 2 domains |
| Contradiction target | **Governor** | Specific facet × domain pair via `ContradictionFocus` |
| Contradiction framing | Nerin | Governor provides what, Nerin decides how |
| Convergence detection | **Governor** | Facet alignment across 3+ domains |
| Convergence target | **Governor** | Specific facet × domain set via `ConvergenceFocus` |
| Convergence framing | Nerin | Governor provides what, Nerin decides how |
| Overlay mutual exclusion | **Governor** | At most one overlay per turn; threshold ratio tiebreak, contradiction > convergence > noticing |
| Amplify overlay selection | **Governor** | Contradiction + convergence only (noticing excluded); threshold = 0; pick strongest |
| Base move choice | Nerin | Governor trusts Nerin for Pull/Bridge/Hold/Pivot |
| Conversational tone | Nerin | Governor signals entry pressure only |
| Closing (amplification) | **Governor** | Derives `intent: "amplify"` from `isFinalTurn` — triggers amplification, not wrap-up |
| Theme extraction | Nerin | Governor extracts nothing from conversation |
| Session end UI | Frontend | Shows "session ended" after hard limit |

---

### Prompt Builder Enrichment

> **Superseded (2026-03-10):** This section (lines 734-933) is superseded by [Decision 13 — Three-Tier Contextual Prompt Composition](./planning-artifacts/conversation-pacing-design-decisions.md#decision-13-three-tier-contextual-prompt-composition) and the [Prompt Builder Architecture Spec](./problem-solution-2026-03-10.md). The section below describes the original enrichment design; the replacement introduces a three-tier contextual composition model with intent-driven module selection. The Governor's 6-field output contract remains valid — only the prompt builder's internal architecture changed.

The prompt builder translates Governor output into Nerin's system prompt. The existing `buildTerritorySystemPromptSection()` is replaced with an enriched version that consumes `PromptBuilderInput` directly.

**Signature change:**

```typescript
// OLD — consumed SteeringOutput (just territoryId)
function buildTerritorySystemPromptSection(content: TerritoryPromptContent): string

// NEW — consumes Governor output + territory catalog entry
function buildTerritorySystemPromptSection(
  input: PromptBuilderInput,
  territory: Territory
): string
```

The prompt builder is the ONLY layer that knows Nerin's voice. The Governor deals in booleans and enums. The prompt builder translates typed fields into natural-sounding instructions. No prompt text in the Governor.

**Composition order:**

The enriched prompt is assembled in a fixed order. Each section is conditionally included based on Governor output. The LLM pays most attention to the end of the system prompt — the overlay instruction (if any) is last because it's the most actionable.

```typescript
function buildTerritorySystemPromptSection(
  input: PromptBuilderInput,
  territory: Territory
): string {
  const sections: string[] = []

  // 1. Territory guidance (always present — existing logic)
  sections.push(buildTerritoryGuidance(territory))

  // 2. Phase instruction (always present — opening or exploring context)
  sections.push(buildPhaseInstruction(governor.sessionPhase))

  // 3. Entry pressure (only when not "direct")
  if (governor.entryPressure !== "direct") {
    sections.push(buildEntryPressureInstruction(governor.entryPressure))
  }

  // 4. Overlay — mutual exclusion: at most ONE per turn, threshold ratio tiebreak
  if (governor.contradictionTarget) {
    sections.push(buildContradictionInstruction(governor.contradictionTarget))
  } else if (governor.noticingHint) {
    sections.push(buildNoticingInstruction(governor.noticingHint))
  }

  // 5. Amplification — LAST position (highest LLM attention)
  if (governor.sessionPhase === "closing") {
    sections.push(buildAmplificationInstruction())
  }

  return sections.join("\n\n")
}
```

**Mutual exclusion rule:** Noticing and contradiction CANNOT both appear in the same turn's prompt. Both spend trust. Both say "I see you." Combining them makes the user feel studied, not seen. When both cross their thresholds on the same turn, the **threshold ratio tiebreak** decides: the signal that exceeded its own bar by more wins. Equal ratios → contradiction wins. The deferred signal is re-evaluated next turn; noticing emergence survives via EMA smoothing.

**Phase-specific instructions:**

| Phase | Prompt Builder Instruction |
|---|---|
| `opening` | "This is the opening. Invite the user into this territory with a warm, concrete question. No reflection, no bridging, no noticing, no contradiction. One clear invitation." |
| `exploring` | Standard territory guidance (existing) + Governor overlay instructions (if any) |
| `closing` | Same as exploring (overlays eligible) + amplification instruction as LAST section. See Closing Design section. |

**Entry pressure translation:**

| Pressure | Prompt Builder Instruction |
|---|---|
| `direct` | (No additional instruction — standard territory entry) |
| `angled` | "Enter this territory at an angle — don't go straight to the core. Find a lighter doorway into the topic." |
| `soft` | "This territory may be heavier than the person is ready for right now. Approach very gently — you might touch the edge of this topic without entering fully. Let them lead if they want to go deeper." |

**Noticing hint translation:**

When `noticingHint` is a `LifeDomain`:
> "Something is shifting in how they talk about [domain]. If it feels right, reflect what you're seeing back to them — not as analysis, but as genuine noticing. This is a moment worth pausing for."

When `noticingHint` is `null`: no noticing instruction added.

**Contradiction target translation:**

When `contradictionTarget` is present:
> "You've noticed something fascinating: when they talk about [domainA], their [facet description] looks quite different than when they talk about [domainB]. If the moment is right, you could surface this — with genuine fascination, not as a gotcha. 'I find it interesting that...' Frame it as curiosity about their complexity, not as catching an inconsistency."

When `contradictionTarget` is `null`: no contradiction instruction added.

**Suppression rules:**
- `sessionPhase === "opening"`: suppress all overlays (noticing + contradiction), no amplification
- `sessionPhase === "exploring"`: overlays eligible (formula-gated, mutual exclusion), no amplification
- `sessionPhase === "closing"`: overlays eligible (same gating as exploring) + amplification instruction added last
- Both `noticingHint === null` AND `contradictionTarget === null`: no overlay instructions — Nerin operates with territory guidance only (+ amplification if closing)
- Mutual exclusion: when both fire, threshold ratio tiebreak decides winner. Loser records `"deferred_by_contradiction"` or `"deferred_by_noticing"` in debug

**Complete enriched prompt example (exploring phase, angled entry, noticing window open):**

```
TERRITORY GUIDANCE:
Energy: medium
Domain area: career, professional identity

Match your conversational energy to a medium level — balanced between lighter
topics and deeper exploration. Let the person guide how deep to go.

Suggested direction — you could explore something like: "What does a good day
at work actually look like for you?"
This is a suggestion, not a script. Follow the natural flow of conversation.
If the person is already in an interesting thread, stay with it.

At most one direct question per response.

SESSION CONTEXT:
You're in the middle of the conversation — the exploration phase. Follow the
natural rhythm. No need to introduce yourself or wrap up.

ENTRY:
Enter this territory at an angle — don't go straight to the core. Find a
lighter doorway into the topic.

NOTICING WINDOW:
Something is shifting in how they talk about their career. If it feels right,
reflect what you're seeing back to them — not as analysis, but as genuine
noticing. This is a moment worth pausing for.
```

**Complete enriched prompt example (exploring phase, direct entry, contradiction window open):**

```
TERRITORY GUIDANCE:
Energy: medium
Domain area: relationships, social dynamics

Match your conversational energy to a medium level — balanced between lighter
topics and deeper exploration. Let the person guide how deep to go.

Suggested direction — you could explore something like: "How do you tend to
show up differently with close friends vs colleagues?"
This is a suggestion, not a script. Follow the natural flow of conversation.

At most one direct question per response.

SESSION CONTEXT:
You're in the middle of the conversation — the exploration phase. Follow the
natural rhythm.

CONTRADICTION WINDOW:
You've noticed something fascinating: when they talk about their career, their
openness to new experiences looks quite different than when they talk about
their relationships. If the moment is right, you could surface this — with
genuine fascination, not as a gotcha. "I find it interesting that..." Frame it
as curiosity about their complexity, not as catching an inconsistency.
```

---

### Closing Design (Amplification + Netflix Cut-to-Black)

**Closing is amplification, not wrap-up.** The Governor derives `intent: "amplify"` when `isFinalTurn` is true. This triggers a "go deeper" instruction — not a goodbye, not a summary, not "surface a living thread." Nerin gets permission to be braver. Then the conversation ends.

**Intent derivation (no phase promotion — Governor never reads sessionPhase):**

```typescript
// Inside deriveIntent():
if (input.isFinalTurn) return "amplify"
// The Governor derives intent from isFinalTurn directly.
// No "sessionPhase promotion" — sessionPhase is a selector concept
// that the Governor doesn't consume. The pipeline attaches it to
// MoveGovernorDebug for observability.
```

**Amplification prompt (added by prompt builder on amplify intent):**

```
FINAL MOMENT:
This moment matters. If there's something you've been sensing
but haven't said — a pattern, a tension, a question — now is
the time. Go deeper, not wider.
```

Key properties of this prompt:
- **No closing language** — no "before we wrap up", no "last chance", no mention of ending
- **Nerin doesn't know it's the last turn** — it just feels permission to be bolder
- **Broad, not directive** — "a pattern, a tension, a question" maps to contradiction, convergence, and bare amplification without prescribing which
- **The user experiences invisible courage** — Nerin suddenly goes deeper, and the user doesn't know why. Then it's over. The user thinks "wow, it really saw me" — not "oh, it knew that was the end."

**Amplify overlay selection.** On `amplify`, the Governor evaluates only contradiction and convergence (noticing excluded — it's a local/moment signal, not a culmination). Thresholds are bypassed (threshold parameter = 0). Surfaced-pair/facet exclusion still applies (don't repeat). The Governor picks the strongest single candidate and wraps it in `MomentFocus`, or passes `null` if neither has a candidate. Three scenarios, all powerful:

| Final Turn Scenario | What Happens |
|---|---|
| **Contradiction focus + amplification** | Strongest candidate was a divergence. "You're so open at work but so guarded in relationships..." Cut to black. The user sits with unresolved complexity. |
| **Convergence focus + amplification** | Strongest candidate was an alignment. "Across everything — work, friendships, solitude — this curiosity threads through all of it." Cut to black. The user walks away feeling seen at their core. |
| **Amplification only (no focus)** | No candidates met minimum evidence even with threshold = 0, or all candidates already surfaced. Nerin draws from everything and goes deep on its own. Cut to black. Sometimes the most powerful moment is the one the system didn't select. |

**Mechanical details:**

| Component | Closing Behavior |
|---|---|
| Selector | Emits `"opening"` or `"exploring"` only. Does not know about `isFinalTurn`. |
| Governor | Derives `intent: "amplify"` when `isFinalTurn` is true. Evaluates contradiction + convergence only (noticing excluded). Bypasses escalating thresholds (threshold = 0). Surfaced-pair/facet exclusion still applied. Picks strongest single candidate as `MomentFocus`, or `null`. |
| Prompt builder | Receives `{ intent: "amplify", territory, focus: MomentFocus | null }`. Adds amplification instruction ("go deeper") as LAST section of prompt. Includes focus instruction if present. |
| Hard limit | `turnNumber >= maxTurnsPerSession` → `status: "finalizing"`. Nerin's amplified last response has already been sent. |
| Frontend | Displays "session ended" UI after the last assistant message. Handles the transition to results. |
| Conversation skew | The scorer's conversation skew ensures the final territories are the most intense, creating a natural intensity arc. The amplification compounds this. |

---

### Upgrade Path

The Governor can be promoted to a full Move Generator if data shows Nerin needs more constraint. Criteria for promotion:

1. **Behavioral evidence** that Pull/Bridge/Hold/Pivot produce measurably distinct LLM outputs (not assumed — tested)
2. **Nerin repeatedly makes poor base-move choices** that the Governor's current constraints can't fix
3. **Post-hoc move classification** shows a pattern that deterministic dispatch would improve

Promotion is **additive**: add base-move dispatch logic without removing the existing restraint layer. The entry pressure, noticing, and contradiction systems remain unchanged.

---

### Pipeline Wiring

The Governor slots into the existing `nerin-pipeline.ts` flow. Two new steps are added, two existing steps are modified, and five steps are untouched. (Reconstruction moved inside Governor — not a pipeline step.)

**Amended pipeline (9 steps):**

DRS (Depth Readiness Score) is removed from the pipeline — territory scoring no longer depends on it.

```
 1. scoreAllTerritories()                 ← UNCHANGED (DRS removed)
 2. selectTerritory()                     ← MODIFIED: returns SelectorOutput
                                             (adds sessionPhase, transitionType)
 3. computePerDomainFacetScores()         ← NEW: expose per-domain mu_g + w_g
 4. computeGovernorOutput()               ← NEW: the Governor (4 decisions + deriveIntent)
                                             (session state reconstruction is internal)
 5. buildChatSystemPrompt()               ← MODIFIED: consumes PromptBuilderInput
                                             (three-tier contextual composition)
 6. callNerin()                           ← UNCHANGED (receives enriched prompt)
 7. callConversAnalyzer()                 ← UNCHANGED
 8. saveEvidence()                        ← UNCHANGED
 9. saveExchangeMetadata()                ← MODIFIED: saves prompt_builder_input
                                             + governor_debug on assistant message
```

**Step 2 change — selector returns richer output:**

```typescript
// OLD
type SteeringOutput = { territoryId: TerritoryId }

// NEW — selector emits two phases only
type SelectorOutput = {
  selectedTerritory: TerritoryId
  sessionPhase: "opening" | "exploring"
  transitionType: "continue" | "transition"
}
```

`SteeringOutput` is retired. `SelectorOutput` is the new upstream contract. The `sessionPhase` rule is simple: `turnNumber === 1 → "opening"`, else `"exploring"`.

**Steps 3-4 — the Governor insertion:**

```typescript
// Step 3: Expose per-domain scoring intermediates
const perDomainScores = computePerDomainFacetScores(allEvidenceThisSession)

// Step 4: Pipeline resolves territories, then calls Governor
const priorMessages = yield* messageRepo.getSessionMessages(sessionId)
const territory = TERRITORY_CATALOG.get(selectorOutput.selectedTerritory)
const lastAssistantMsg = priorMessages.findLast(m => m.promptBuilderInput != null)
const previousTerritory = lastAssistantMsg
  ? TERRITORY_CATALOG.get(lastAssistantMsg.promptBuilderInput.territoryId)
  : null

const { output: promptBuilderInput, debug: governorDebug } = computeGovernorOutput({
  territory,                      // full Territory, resolved by pipeline
  previousTerritory,              // full Territory | null, resolved by pipeline
  eTarget,                        // from pacing formula, null until built
  isFinalTurn,                    // from pipeline messageCount check
  turnNumber,
  totalExpectedTurns,
  priorAssistantMessages: priorMessages.filter(m => m.promptBuilderInput != null),
  perDomainFacetScores: perDomainScores,
})
// Governor derives session state internally (surfaced sets, counters)
// Governor derives intent (open/deepen/bridge/hold/amplify)
// Pipeline attaches selectorOutput.sessionPhase/transitionType to debug
governorDebug.selectorSessionPhase = selectorOutput.sessionPhase
governorDebug.selectorTransitionType = selectorOutput.transitionType
```

**Step 5 change — prompt builder consumes Governor output:**

```typescript
// OLD
const content = buildTerritoryPrompt(steeringOutput)
const section = buildTerritorySystemPromptSection(content)

// NEW — three-tier contextual composition (see Prompt Builder Architecture Spec)
const systemPrompt = buildChatSystemPrompt(promptBuilderInput)
```

The prompt builder receives the `PromptBuilderInput` discriminated union (which already carries full `Territory` objects) and matches on `intent` to compose the appropriate prompt layers: NERIN_PERSONA → Core Identity → Behavioral Modules (intent-contextual) → Steering Section (per-turn).

**Step 9 change — persist Governor output for derive-at-read:**

```typescript
// OLD
yield* messageRepo.saveAssistantMessage({
  sessionId, content: response.text, territoryId: selectorOutput.territoryId
})

// NEW — territories serialized as TerritoryId in jsonb, not full objects
yield* messageRepo.saveAssistantMessage({
  sessionId, content: response.text,
  territoryId: selectorOutput.selectedTerritory,
  promptBuilderInput, // PromptBuilderInput as jsonb (territories stored as TerritoryId)
  governorDebug,      // MoveGovernorDebug as jsonb
})
```

---

### Session State Management

**Pattern: derive-at-read + prompt_builder_input column.**

Matches the codebase's existing derive-at-read pattern (trait scores, OCEAN codes, archetypes are all recomputed from facet scores at read time — never stored aggregations).

**Storage — two new jsonb columns on `assessment_message`:**

```sql
-- Migration: add governor columns
ALTER TABLE assessment_message
  ADD COLUMN prompt_builder_input jsonb,  -- PromptBuilderInput (discriminated union), null for user messages
  ADD COLUMN governor_debug jsonb;        -- MoveGovernorDebug, null for user messages
```

Each assistant message stores the `PromptBuilderInput` that was computed for that turn plus the `MoveGovernorDebug` diagnostic trace. This serves dual purposes:
1. **Debug/replay:** Full decision trace per turn (debug carries reasons, thresholds, emergence values)
2. **Derive-at-read:** Session-level counters reconstructed by scanning prior messages' `prompt_builder_input`

**Session state reconstruction (private Governor function):**

`reconstructGovernorSessionState()` is a private function inside the Governor — not a pipeline step. The pipeline passes raw `priorAssistantMessages`; the Governor derives all session state internally.

The `MomentFocus` tagged union makes extraction unambiguous — match on `_tag` to determine which overlay type fired. `hold` carries `focus: MomentFocus`. `amplify` carries `focus: MomentFocus | null`.

```typescript
type GovernorSessionState = {
  surfacedNoticingDomains: Set<LifeDomain>
  surfacedContradictionPairs: Set<string>       // "facet:domainA:domainB" keys
  surfacedConvergenceFacets: Set<string>         // "convergence:facet" keys
}

function reconstructGovernorSessionState(
  priorMessages: AssistantMessageRecord[]
): GovernorSessionState {
  const surfacedNoticingDomains = new Set<LifeDomain>()
  const surfacedContradictionPairs = new Set<string>()
  const surfacedConvergenceFacets = new Set<string>()

  for (const m of priorMessages) {
    const input = m.promptBuilderInput
    const focus = input.intent === "hold" ? input.focus
                : input.intent === "amplify" ? input.focus
                : null

    if (focus == null) continue

    switch (focus._tag) {
      case "NoticingFocus":
        surfacedNoticingDomains.add(focus.domain)
        break
      case "ContradictionFocus": {
        const t = focus.target
        surfacedContradictionPairs.add(
          `${t.facet}:${t.pair[0].domain}:${t.pair[1].domain}`
        )
        break
      }
      case "ConvergenceFocus":
        surfacedConvergenceFacets.add(`convergence:${focus.target.facet}`)
        break
    }
  }

  return {
    surfacedNoticingDomains,
    surfacedContradictionPairs,
    surfacedConvergenceFacets,
  }
}
```

**EMA + baseline history:**

For clarity emergence (noticing), the Governor needs per-facet×domain clarity history across turns. This is NOT stored — it's recomputed each turn from the full evidence history using derive-at-read:

1. Load all evidence for this session up to current turn
2. For each prior turn, call `computePerDomainFacetScores()` with cumulative evidence up to that turn
3. Compute clarity at each turn → build EMA series → compute baseline → apply baseline confidence → compute emergence

This is more computation than storing intermediate EMA state, but:
- Zero state management (no EMA column to update, no schema for per-facet×domain time series)
- Consistent with derive-at-read pattern
- ~25 turns × ~30 facets × ~5 domains = ~3750 clarity values max. Sub-millisecond.

---

### Per-Domain Score Extraction

`computeFacetMetrics()` currently exposes `domainWeights` (w_g per domain) but NOT per-domain mean deviations (μ_g). The Governor needs both `mu_g` and `w_g` per facet×domain.

**Approach: shared internal helpers.**

Extract the per-domain computation step (which `computeFacetMetrics()` already does internally) into a shared helper function. Both the existing `computeFacetMetrics()` and the new `computePerDomainFacetScores()` call this shared step.

```typescript
// Shared internal helper — extracted from computeFacetMetrics() internals
function computeDomainAggregates(
  facetEvidence: EvidenceInput[],
  config: FormulaConfig
): Map<LifeDomain, { mu_g: number; w_g: number; evidenceCount: number }> {
  // Group evidence by domain
  // For each domain: compute w_g = √(Σ w_i), mu_g = weighted mean deviation
  // This logic already exists inside computeFacetMetrics() — extracted, not new
}

// NEW public function — consumes shared helper
export function computePerDomainFacetScores(
  evidence: EvidenceInput[],
  config: FormulaConfig = FORMULA_DEFAULTS,
): PerDomainFacetScore[] {
  const result: PerDomainFacetScore[] = []
  const byFacet = groupByFacet(evidence)

  for (const [facet, facetEvidence] of byFacet) {
    const domainAggs = computeDomainAggregates(facetEvidence, config)
    for (const [domain, agg] of domainAggs) {
      result.push({
        facet,
        domain,
        mu_g: agg.mu_g,
        w_g: agg.w_g,
        evidenceCount: agg.evidenceCount,
      })
    }
  }

  return result
}

// EXISTING function — refactored to use shared helper
export function computeFacetMetrics(
  evidence: EvidenceInput[],
  config: FormulaConfig = FORMULA_DEFAULTS,
): Map<FacetName, FacetMetrics> {
  // ... same result, now internally calls computeDomainAggregates()
  // instead of inlining the domain computation
}
```

**No API change to `computeFacetMetrics()`.** Existing consumers are unaffected. The refactoring extracts a shared step that was already computed internally.

---

### Creative Alternatives Considered and Rejected

1. **Full Move Generator with explicit base-move dispatch** — rejected because Pull/Bridge/Hold/Pivot may not produce behaviorally distinct LLM outputs. Risk of fake precision. Revisit only with behavioral evidence.

2. **LLM-led noticing with frequency throttle only** — rejected in favor of evidence-triggered noticing. Both noticing and contradiction can be deterministically triggered from scoring evidence, making the system consistent. Frequency-only throttle wastes the signal data.

3. **Score velocity as noticing signal** — rejected in favor of clarity emergence. Score velocity answers "what moved?" while clarity emergence answers "what became worth saying?" The latter is closer to what noticing is.

4. **Hardcoded caps** (`MAX_CONTRADICTIONS = 2`, `MAX_NOTICINGS = 3`) — rejected in favor of escalating threshold formulas. The formula naturally produces the right distribution without arbitrary limits.

5. **Noticing with facet-level target** — rejected in favor of domain-level compass. Facet targets risk making Nerin sound steered. Domain compass lets Nerin discover what's alive. "Something is shifting in career" > "Notice their gregariousness at work."

6. **Blended emergence** (`α * longEmergence + (1-α) * shortEmergence`) — rejected in favor of EMA on signal side. EMA gives the blend behavior without the blend parameter. One formula, one comparison, no α knob.

7. **Wrap-up closing phase** (`sessionPhase: "closing"` with "surface a living thread" instructions) — rejected in favor of amplification closing. A wrap-up phase *manufactures* the ending — Nerin winds down, the energy drops, the user gets a neat bow. Instead, `"closing"` means amplification: "go deeper, not wider." Nerin doesn't know it's ending — it gets permission to be braver. Overlays remain eligible. The conversation ends at peak intensity, not in denouement.

8. **Combinatory overlays** (noticing + contradiction in the same turn) — rejected in favor of mutual exclusion with threshold ratio tiebreak. Both overlays spend trust. Both say "I see you." Combining them in one response makes the user feel studied, not seen. When both fire, the signal with the higher ratio (value / required threshold) wins; equal ratios → contradiction wins. Genuine emergence survives one turn of deferral via EMA smoothing.

9. **Stored EMA state** (per-facet×domain EMA column updated each turn) — rejected in favor of derive-at-read from full evidence history. Zero state management, consistent with codebase pattern, sub-millisecond computation for ~25-turn sessions.

10. **Hard `MIN_HISTORY_TURNS` gate for noticing emergence** — rejected in favor of `baselineConfidence = 1 - exp(-BASELINE_GROWTH * historyLength)` that scales emergence by history depth. Hard gates create cliffs (0% on turn 4, 100% on turn 5). The exponential decay builds conviction gradually: 0% → 50% → 75% → 88%. A genuinely strong signal on turn 5 with 2 prior data points still fires at 75%.

11. **Noticing as amplify candidate** — rejected. Noticing detects local *movement* in one domain. The final turn is a *culmination* — it needs cross-domain observations (contradiction or convergence), not local emergence. Noticing on the final turn would feel small. Contradiction and convergence are the right tools for the amplify job.

12. **Two-field amplify output** (`contradictionSuggestion` + `noticingSuggestion` as separate nullable fields) — rejected in favor of single `focus: MomentFocus | null`. Two focus instructions in the same prompt creates attention competition. The strongest ending is a single, devastating observation — not two interesting ones fighting for airtime. The Governor picks the strongest between contradiction and convergence.

---

## SOLUTION EVALUATION

### Evaluation Criteria

| # | Criterion | Weight | Description |
|---|---|---|---|
| C1 | Architectural coherence | High | Fits the three-layer pipeline (Scorer → Selector → Governor). Respects upstream boundaries. No scope creep into territory selection or evidence extraction. |
| C2 | Input availability | High | Every input exists today or is a trivial session counter. Zero phantom dependencies on unbuilt systems. |
| C3 | Formula elegance | Medium | Formulas use soft influence over hard gates. Minimal calibration parameters. Reuses existing scoring primitives. |
| C4 | Behavioral correctness | High | Produces the right rhythm — noticing ~2/session, contradiction ~0-2/session, never in opening, at most one overlay per turn. Safe failure direction (more restraint, not less). |
| C5 | Testability | High | Every decision is a pure function of its inputs. No LLM calls, no side effects, no randomness. Enumerable test cases. |
| C6 | Upgrade path | Medium | Can be promoted to full Move Generator additively if behavioral evidence warrants it. No rewrite needed. |
| C7 | Prompt builder integration | Medium | Governor output translates cleanly into natural-sounding system prompt instructions. No rigid templates. |

### Solution Analysis

**C1 — Architectural coherence: STRONG**

The Governor sits cleanly between selector and prompt builder. It never chooses the territory (selector's job), never ranks territories (scorer's job), never extracts themes or content (Nerin's job). The four decisions — entry pressure, noticing hint, contradiction target, convergence target — are strictly what Nerin cannot compute: structural state, evidence-based triggers, and E_target gap. The Governor receives full `Territory` objects from the pipeline and never touches the catalog directly. It derives all session state internally from raw prior messages.

The pipeline identity holds:
- Scorer decides what ranks highest
- Selector decides what is selected now
- Governor decides what constraints Nerin operates under
- Nerin decides how to make the conversation feel good

**C2 — Input availability: STRONG**

| Input | Source | Exists? |
|---|---|---|
| `territory` | Pipeline catalog lookup from selector's `TerritoryId` | Yes — pipeline resolves once |
| `previousTerritory` | Pipeline lookup from last prior message's stored `TerritoryId` | Yes — derive-at-read |
| `eTarget` | Pacing formula | Specced, not built. Defaults to null → `"direct"` |
| `isFinalTurn` | Pipeline `messageCount` check | Yes — already computed in `nerin-pipeline.ts` |
| `turnNumber` | Session counter | Trivial |
| `totalExpectedTurns` | Config constant | Trivial (default 25) |
| `priorAssistantMessages` | Query existing messages | Yes — Governor reconstructs surfaced sets internally |
| `perDomainFacetScores` (mu_g, w_g) | `computePerDomainFacetScores()` | Shared helper from `formula.ts` internals |

Zero phantom dependencies. The only "not yet built" input is `eTarget`, which has an explicit safe default. Governor derives all session state (surfaced noticings, contradictions, convergences) internally from `priorAssistantMessages` via `reconstructGovernorSessionState()`.

**C3 — Formula elegance: STRONG**

- Noticing: 7 calibration parameters (2 reused from existing `FORMULA_DEFAULTS`), no hard gates. The `clarity = lean × conf` multiplication does soft gating. EMA does noise reduction. Conversation-average baseline does historical contrast. Baseline confidence (`1 - exp(-BASELINE_GROWTH * historyLength)`) scales emergence by history depth. Phase curve + escalation do rhythm. Each layer has one job.
- Contradiction: 2 calibration parameters. Strength = divergence × min confidence. Escalating threshold. Surfaced-pair tracking. Threshold parameter (default = config, `0` for amplify bypass). No cooldowns, no timing gates — evidence quality IS the gate.
- Convergence: 3 calibration parameters (`MIN_CONVERGENCE_DOMAINS`, `MAX_SPREAD`, `BASE_CONVERGENCE_THRESHOLD`). Strength = (1 - normalizedSpread) × minConf. Same escalating threshold pattern as contradiction. Surfaced-facet tracking. Threshold parameter.
- Entry pressure: 2 calibration parameters. Simple gap calculation with three bands.

Total new calibration parameters: ~14. Of those, 5 have obvious defaults (`EMA_DECAY=0.5`, `PHASE_BASE=1.0`, `PHASE_CURVE=0.6`, `totalExpectedTurns=25`, `BASELINE_GROWTH`). 6 need calibration from real data (`BASE_NOTICE_THRESHOLD`, `BASE_STRENGTH_THRESHOLD`, `BASE_CONVERGENCE_THRESHOLD`, `ESCALATION_N`, `ESCALATION_C`, `MAX_SPREAD`). 3 are low-stakes (`PRESSURE_THRESHOLD_LOW`, `PRESSURE_THRESHOLD_HIGH`, `MIN_CONVERGENCE_DOMAINS=3`).

**C4 — Behavioral correctness: STRONG**

- Opening: all overlays suppressed (phase gate). Nerin gets territory guidance only. Matches selector Invariant 8.
- Mid-exploring: noticing windows open when clarity emergence exceeds phase-adjusted threshold. Phase weight is lowest at midpoint → most permissive. Sophia's "densest in the middle" — emergent.
- Late exploring: phase weight rises again → harder to trigger. Sophia's "sparingly" — emergent. But overlays CAN still fire on the final turn — Nerin doesn't know it's ending.
- Closing (final turn): Governor promotes to `"closing"` → amplification instruction ("go deeper"). Contradiction + convergence eligible (threshold = 0); noticing excluded. Conversation ends at hard limit, at peak intensity. Netflix cut-to-black.
- Mutual exclusion: at most one overlay per turn. Threshold ratio tiebreak when multiple fire — stronger signal (relative to its own bar) wins, priority: contradiction > convergence > noticing on ties. Deferred signal re-evaluated next turn.
- Contradiction: escalating threshold naturally produces 0-2 per session. No hardcoded cap.
- Convergence: MIN_CONVERGENCE_DOMAINS + escalating threshold naturally produces 0-1 per session. No hardcoded cap.
- Noticing: phase curve + baseline confidence + escalation naturally produces 0-3 per session, typically 1-2. No hardcoded cap.
- Safe failure: missing E_target → direct entry. No emergence → no noticing. No candidates → no contradiction/convergence. Every failure mode errs toward restraint.

**C5 — Testability: STRONG**

All four decisions are pure functions:
- `computeEntryPressure(eTarget, territory) → "direct" | "angled" | "soft"`
- `computeNoticingHint(input) → LifeDomain | null`
- `findContradictionTarget(input, surfacedPairs, threshold?) → ContradictionTarget | null`
- `findConvergenceTarget(input, surfacedFacets, threshold?) → ConvergenceTarget | null`

No LLM calls, no network, no database, no randomness. Test cases are enumerable:
- Entry pressure: E_target × energy level matrix (3×3 = 9 core cases + null default)
- Noticing: phase × emergence × escalation × surfaced domains × baseline confidence (combinatorial but bounded)
- Contradiction: divergence × confidence × escalation × surfaced pairs × threshold parameter
- Convergence: spread × confidence × domain count × escalation × surfaced facets × threshold parameter

Debug output provides full decision trace for every test assertion.

**C6 — Upgrade path: ADEQUATE**

Promotion criteria are documented. The Governor → Move Generator upgrade is additive:
1. Add base-move dispatch logic (Pull/Bridge/Hold/Pivot selection)
2. Keep existing entry pressure, noticing, contradiction systems unchanged
3. Extend prompt builder with move-specific instructions

The risk: if promotion never happens, the criteria become dead documentation. Acceptable — the criteria serve as guardrails against premature promotion.

**C7 — Prompt builder integration: STRONG**

Each Governor output field maps to a natural prompt instruction:
- Entry pressure → tone guidance ("enter at an angle", "approach gently")
- Noticing hint → domain compass ("something is shifting in how they talk about [domain]")
- Contradiction target → fascination frame ("when they talk about [domainA], their [facet] looks different than in [domainB]")
- Convergence target → identity mirror ("something keeps showing up — across [domains], their [facet] is remarkably consistent")
- Phase → behavioral constraints ("no reflection in opening"; closing = amplification "go deeper" + contradiction/convergence eligible)

Instructions read as conversational direction, not mechanical templates.

### Recommended Solution

The Move Governor as specified in the Solution Generation section. No alternatives scored higher across all criteria.

### Rationale

The Governor design emerged from adversarial stress-testing of the original full Move Generator. Every reduction — dropping base-move dispatch, dropping payloads, dropping feedback loops, collapsing inputs — was driven by a specific failure identified during Red Team analysis. The remaining surface area (4 decisions shaped into a `PromptBuilderInput` discriminated union, ~14 calibration parameters) is the minimum needed to solve the four problems Nerin can't solve itself: restraint on noticing frequency, patience on contradiction timing, identity detection via convergence, and entry pressure calibration.

The hybrid trigger model — clarity emergence for noticing, facet divergence for contradiction — matches each problem's nature. Both are deterministic, evidence-based, and use existing scoring primitives. The escalating threshold pattern (shared by both) provides self-regulating rhythm without hardcoded caps.

The design's strongest property: **it is testable end-to-end as pure functions before any LLM integration.** The Governor can be validated with synthetic scoring data before Nerin ever sees its output.

---

## IMPLEMENTATION PLAN

### Implementation Approach

**Bottom-up, formula-first.** Implement and test pure functions before wiring into the pipeline. Each decision is independently implementable and testable.

**Build order rationale:** Entry pressure is simplest (gap calculation). Contradiction and convergence detection reuse existing primitives with new aggregations. Noticing emergence is the most complex (EMA state, baseline confidence, phase curve). Prompt builder enrichment depends on all four. Integration wires everything together.

### Action Steps

**Step 1: Type Definitions**

Create `MoveGovernorInput`, `AssistantMessageRecord`, `PromptBuilderInput`, `ConversationalIntent`, `DomainScore`, `ContradictionTarget`, `ConvergenceTarget`, `EntryPressure`, `MomentFocus` (`NoticingFocus`, `ContradictionFocus`, `ConvergenceFocus`), `GovernorSessionState`, `EntryPressureDebug`, `NoticingDebug`, `ContradictionDebug`, `ConvergenceDebug`, `MoveGovernorDebug`, `PerDomainFacetScore` types in `packages/domain/src/types/steering.ts` (extend existing file).

**Step 2: Entry Pressure**

- Implement `computeEntryPressure(eTarget, territory)` as a pure function
- Add `ENERGY_LEVEL_VALUE` mapping (light→0.3, medium→0.5, heavy→0.8)
- Test: E_target × energy level matrix, null E_target default
- Location: `packages/domain/src/utils/steering/move-governor.ts`

**Step 3: Contradiction Detection**

- Implement `findContradictionTarget(input, surfacedPairs, threshold?)` as a pure function
- Threshold parameter: default = escalating config threshold, `0` for amplify bypass
- Internal `ContradictionCandidate` type (flat fields), public `ContradictionTarget` with `pair` tuple
- Reuse `mu_g` and `w_g` from scoring data
- Apply per-domain confidence formula: `C_MAX * (1 - exp(-k * w_g))`
- Compute strength: `delta * min(confA, confB)`
- Surfaced-pair exclusion
- Test: synthetic domain pairs with varying divergence, confidence, escalation levels, threshold = 0 bypass
- Location: same file

**Step 3b: Convergence Detection**

- Implement `findConvergenceTarget(input, surfacedFacets, threshold?)` as a pure function
- Threshold parameter: default = escalating config threshold, `0` for amplify bypass
- Require `MIN_CONVERGENCE_DOMAINS` (3+) domains per facet
- `MAX_SPREAD` hard gate — spread above this isn't convergence
- Strength: `(1 - normalizedSpread) * minConf`
- Per-facet exclusion (not per-domain-set)
- Test: synthetic multi-domain facet data with varying spread, confidence, domain counts
- Location: same file

**Step 4: Noticing Emergence**

- Implement clarity computation: `lean * conf` per facet×domain
- Implement EMA tracking: `EMA_DECAY * clarity + (1-EMA_DECAY) * prevEma`
- Implement baseline: `mean(clarity(1..t-1))` per facet×domain
- Implement baseline confidence: `1 - exp(-BASELINE_GROWTH * historyLength)` — scales emergence by history depth
- Implement emergence: `rawEmergence * baselineConfidence`
- Implement phase weight: `PHASE_BASE + PHASE_CURVE * (2p-1)²`
- Implement escalating threshold: `BASE_NOTICE_THRESHOLD * phaseWeight * ESCALATION_N ^ surfacedNoticingDomains.size`
- Domain aggregation: `max_f(emergence)` per domain
- Surfaced-domain exclusion
- Test: synthetic scoring sequences — gradual crystallization, sudden spike, one-turn noise, edge-of-session attempts, late-appearing domain (baseline confidence dampening), turn 5 strong signal (fires at 75%)
- Location: same file

**Step 5: Governor Orchestrator**

- Implement `computeGovernorOutput(input): { output: PromptBuilderInput, debug: MoveGovernorDebug }` that:
  1. Calls `reconstructGovernorSessionState()` internally (private function)
  2. Runs all four decisions + `deriveIntent()`
- **Intent derivation:** `deriveIntent()` maps 4 decisions + session state into the correct `PromptBuilderInput` variant. Priority: `open` > `amplify` > `hold` > `bridge` / `deepen`
- **Amplify path:** on `isFinalTurn`, evaluate contradiction + convergence only (noticing excluded). Pass threshold = 0. Surfaced exclusions still applied. Pick strongest via `pickStrongest()`, wrap in `MomentFocus | null`
- **Mutual exclusion (non-amplify):** when multiple overlays fire, threshold ratio tiebreak: `contradictionStrength / requiredStrength` vs `convergenceStrength / requiredStrength` vs `domainEmergence / requiredEmergence`. Higher ratio wins. Equal → contradiction > convergence > noticing. Loser records `reason: "deferred_by_other"` with `deferredBy` field in debug
- **Orchestrator owns phase gating:** `open` intent → no detection functions called. Exploring → all four eligible (formula-gated). Amplify → contradiction + convergence only (threshold = 0). Detection functions never check phase.
- Test: full integration with combined inputs, including mutual exclusion scenarios (3-way tiebreak), amplify path, intent derivation priority
- Location: same file, exported as main entry point

**Step 6: Per-Domain Score Extraction**

- Extract `computeDomainAggregates()` as a shared internal helper from `computeFacetMetrics()` internals
- Implement `computePerDomainFacetScores(evidence)` using the shared helper — exposes `mu_g` and `w_g` per facet×domain
- Refactor `computeFacetMetrics()` to call the shared helper internally (no API change)
- Test: verify `computeFacetMetrics()` produces identical results after refactoring; verify `computePerDomainFacetScores()` produces correct per-domain values
- Location: `packages/domain/src/utils/formula.ts`

**Step 7: Prompt Builder Enrichment**

- Implement three-tier contextual composition per Decision 13 (Prompt Builder Architecture Spec)
- `buildChatSystemPrompt(input: PromptBuilderInput)` — main entry point
- Match on `input.intent` to select behavioral modules from composition matrix
- Implement steering section composition: territory → intent instruction → entry pressure → focus → amplification
- Add `ConvergenceFocus` handling in `buildFocusInstruction()`: "Something keeps showing up — across [domains], their [facet] is remarkably consistent"
- Each intent variant carries only its relevant fields — no impossible states at the type level
- Test: snapshot tests for generated prompt sections — one per intent (open, deepen, bridge, hold-noticing, hold-contradiction, hold-convergence, amplify-contradiction, amplify-convergence, amplify-none)
- Location: `apps/api/src/` (nerin-system-prompt.ts, nerin-chat-context.ts decomposition)

**Step 8: Session State + Database Migration**

- Add `prompt_builder_input jsonb` and `governor_debug jsonb` columns to `assessment_message` table (nullable, only set on assistant messages)
- `reconstructGovernorSessionState(priorMessages)` is a private function inside `move-governor.ts` — scans `MomentFocus._tag` variants to derive surfaced sets (noticing domains, contradiction pairs, convergence facets)
- Implement EMA + baseline + baseline confidence derive-at-read: recompute clarity timeline from full evidence history each turn
- Test: verify state reconstruction produces correct sets from mock message history with various `MomentFocus` variants
- Location: Migration in `packages/infrastructure/src/db/drizzle/`, reconstruction in `packages/domain/src/utils/steering/move-governor.ts`

**Step 9: Rename `freeTierMessageThreshold` → `maxTurnsPerSession`**

- Rename the constant across the codebase: config, pipeline, tests
- The old name conflates billing tier with session structure and suggests total messages rather than turns (user messages)
- `maxTurnsPerSession` is self-documenting: it's turns, it's per session, it's a max

**Step 10: Pipeline Integration**

- Modify `selectTerritory()` to return `SelectorOutput` (add `sessionPhase`, `transitionType`)
- Pipeline resolves `TerritoryId` → `Territory` via catalog lookup (once per territory)
- Pipeline resolves `previousTerritory` from last prior message's stored `TerritoryId`
- Wire Governor (steps 3-4) between selector output and prompt builder input in `nerin-pipeline.ts`
- Pipeline attaches `selectorOutput.sessionPhase` and `selectorOutput.transitionType` to `MoveGovernorDebug` for observability
- Retire `SteeringOutput` type — replace with `SelectorOutput` + `PromptBuilderInput`
- Update `saveExchangeMetadata()` to persist `prompt_builder_input` (territories as TerritoryId) + `governor_debug` on assistant message
- Ensure debug output is logged via Pino for replay
- Test: integration test with `MOCK_LLM=true` verifying Governor output flows through to Nerin's system prompt

### Timeline and Milestones

| Milestone | Steps | Dependency |
|---|---|---|
| M1: Types + Entry Pressure | 1, 2 | None |
| M2: Contradiction Detection | 3 | M1 (types) |
| M2b: Convergence Detection | 3b | M1 (types) |
| M3: Noticing Emergence | 4 | M1 (types) |
| M4: Governor Orchestrator + Mutual Exclusion | 5 | M2, M2b, M3 |
| M5: Per-Domain Score Extraction (shared helpers) | 6 | M1 (types — needs PerDomainFacetScore) |
| M6: Prompt Builder Enrichment | 7 | M4 |
| M7: Session State + DB Migration | 8 | M4 |
| M8: Rename constant | 9 | None (can be done anytime) |
| M9: Pipeline Integration | 10 | M4, M5, M6, M7, M8 |

M1-M3, M2b, and M5 are parallelizable. M4 depends on M2+M2b+M3. M6+M7 depend on M4 and are parallelizable with each other. M9 is the final integration step.

### Resource Requirements

- **Existing code to modify:**
  - `formula.ts` — refactor to extract shared `computeDomainAggregates()` helper, add `computePerDomainFacetScores()`
  - `nerin-system-prompt.ts` — three-tier contextual composition (consumes `PromptBuilderInput` directly)
  - `nerin-chat-context.ts` — decompose 276-line monolith into Tier 1 core + Tier 2 behavioral modules
  - `steering.ts` types — retire `SteeringOutput`, add `SelectorOutput`, `PromptBuilderInput`, `ConversationalIntent`, `DomainScore`, `ContradictionTarget`, `ConvergenceTarget`, `EntryPressure`, `MomentFocus` (3 variants), `GovernorSessionState`, debug types, `PerDomainFacetScore`
  - `nerin-pipeline.ts` — insert Governor steps 4-6, modify steps 3, 7, 11
  - `nerin-system-prompt.ts` — update `buildChatSystemPrompt()` to pass new prompt builder signature through
- **New code:** `move-governor.ts` (pure functions), `reconstructGovernorSessionState()`, DB migration
- **Database migration:** Add `prompt_builder_input jsonb` + `governor_debug jsonb` columns to `assessment_message` table
- **No new infrastructure:** No LLM calls, no new tables, no new services
- **Calibration data:** Real conversation scoring data needed to set `BASE_NOTICE_THRESHOLD`, `BASE_STRENGTH_THRESHOLD`, `ESCALATION_N`, `ESCALATION_C`. Can use seeded test data for initial estimates.

### Responsible Parties

- **Governor implementation:** Developer (pure functions, high test coverage)
- **Calibration:** Requires real conversation data analysis — deferred to post-implementation tuning
- **Prompt builder enrichment:** Developer (extend existing, snapshot tests)
- **Integration:** Developer (wire pipeline, update types)

---

## MONITORING AND VALIDATION

### Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Noticings per session | 1-2 median, 0-3 range | Count `noticingReason === "fired"` in debug logs |
| Contradictions per session | 0-1 median, 0-2 range | Count `contradictionReason === "fired"` in debug logs |
| Convergences per session | 0-1 median, 0-2 range | Count `convergenceReason === "fired"` in debug logs |
| Noticing timing | >60% fire in middle third of session | Turn number distribution of fired noticings |
| No opening overlay leaks | 0 overlays in opening phase | Phase gate verification in debug logs |
| Mutual exclusion enforced | 0 turns with >1 overlay | Verify at most one non-null `MomentFocus` per turn |
| Collision rate | <10% of sessions have mutual exclusion deferral | Count `reason === "deferred_by_other"` with `deferredBy` field in debug |
| Entry pressure distribution | Majority `"direct"`, meaningful `"angled"`/`"soft"` when E_target available | Entry pressure field distribution |
| Governor latency | <5ms per turn | Pure function, no I/O — should be sub-millisecond |

### Validation Plan

**Phase 1: Unit Tests (pre-integration)**

Pure function testing with synthetic inputs:
- Entry pressure: 9 core cases (3 energy levels × 3 E_target ranges) + null default
- Contradiction: divergence × confidence matrix, escalation levels, surfaced-pair exclusion, empty candidates, threshold = 0 bypass
- Convergence: spread × confidence × domain count, escalation levels, surfaced-facet exclusion, MIN_CONVERGENCE_DOMAINS gate, MAX_SPREAD hard gate, threshold = 0 bypass
- Noticing: gradual crystallization (clarity rises 0.02/turn for 8 turns → should eventually fire), sudden spike (one strong evidence item → EMA dampens), one-turn noise (spike then revert → should NOT fire), edge-of-session attempts (high phase weight blocks), domain exclusion after surfacing, baseline confidence dampening on early turns, turn 5 strong signal fires at ~75%
- **Mutual exclusion:** multiple overlays cross threshold → threshold ratio tiebreak determines winner (contradiction > convergence > noticing on ties), loser debug shows `reason: "deferred_by_other"` with `deferredBy` field
- **Amplify path:** isFinalTurn → contradiction + convergence only (noticing excluded), threshold = 0, surfaced exclusions applied, pick strongest single candidate
- Phase gating: opening suppresses all overlays
- Bootstrap: first evidence turn produces emergence = 0
- **State reconstruction:** verify `reconstructGovernorSessionState()` produces correct surfaced sets from mock message histories — matches on `MomentFocus._tag` to extract surfacedNoticingDomains, surfacedContradictionPairs, surfacedConvergenceFacets

**Phase 2: Calibration with Seeded Data**

Run Governor against seeded test assessment (12 messages, 30 facet scores, ~40 evidence records):
- Verify contradiction candidates emerge with plausible strength values
- Verify convergence candidates emerge when 3+ domains score a facet similarly
- Verify noticing emergence values are in a meaningful range
- Verify baseline confidence scales emergence appropriately by history depth
- Use output to set initial `BASE_NOTICE_THRESHOLD`, `BASE_STRENGTH_THRESHOLD`, and convergence thresholds

**Phase 3: Integration Testing**

Wire into pipeline with `MOCK_LLM=true`:
- Verify Governor output flows through prompt builder into Nerin's system prompt
- Verify `prompt_builder_input` + `governor_debug` jsonb are persisted on assistant messages
- Verify `reconstructGovernorSessionState()` produces correct counters across multi-turn conversations
- Verify debug output is logged via Pino
- Verify mutual exclusion via threshold ratio tiebreak when multiple signals fire (higher ratio wins, priority: contradiction > convergence > noticing on ties)
- Verify amplify path: isFinalTurn triggers contradiction + convergence only (noticing excluded), threshold = 0

**Phase 4: Real Conversation Observation**

Run with real conversations and log debug output:
- Do noticings fire at moments that feel narratively right?
- Do contradictions identify genuinely interesting divergences?
- Do convergences identify genuinely stable identity patterns?
- Is entry pressure calibrated correctly for the E_target values observed?
- Adjust calibration parameters based on observations

### Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Calibration parameters wrong at launch | Too many or too few overlays | Safe failure direction: if thresholds are too high, overlays don't fire → restraint. Start conservative, loosen based on data. |
| `computeFacetMetrics()` doesn't expose per-domain intermediates | Step 6 requires code changes to formula.ts | Low risk — `mu_g` and `w_g` are computed internally. Exposing them is a minor refactor, not a redesign. |
| EMA recomputation cost per turn | Recomputing clarity timeline from full evidence each turn | Accepted: ~25 turns × ~30 facets × ~5 domains = ~3750 clarity values max. Sub-millisecond. Derive-at-read is the codebase pattern and eliminates all state management. |
| Mutual exclusion loses overlay moments | Deferred overlay may not re-fire next turn | Accepted: genuine emergence (noticing) survives one turn via EMA smoothing. Contradiction/convergence candidates persist as scoring data doesn't change. Debug tracks collision rate with `deferredBy` field for monitoring. |
| Convergence is too common in short sessions | Users always get "you're consistent" messages | Low risk — MIN_CONVERGENCE_DOMAINS (3+) gate requires evidence from 3+ life domains. Short sessions rarely visit 3+ domains for the same facet. Escalating threshold further restricts frequency. |
| Phase curve `totalExpectedTurns` is wrong | Phase weight is miscalibrated | Low impact — config default of 25 is a soft estimate. Phase weight varies between 1.0 and 1.6. A 20-turn conversation with `totalExpectedTurns=25` just shifts the sweet spot slightly earlier. |
| Contradiction detection finds no candidates in short sessions | Zero contradictions in <15 turn sessions | Expected and acceptable. Short sessions don't have enough cross-domain evidence. The formula correctly reflects this. |

### Adjustment Triggers

| Trigger | Action |
|---|---|
| >50% of sessions have 0 noticings | Lower `BASE_NOTICE_THRESHOLD` or `PHASE_CURVE` |
| >20% of sessions have 3+ noticings | Raise `ESCALATION_N` |
| Contradictions fire before turn 10 regularly | Raise `BASE_STRENGTH_THRESHOLD` |
| Contradictions never fire | Lower `BASE_STRENGTH_THRESHOLD` or `ESCALATION_C` |
| Convergences fire too often (>1 per session median) | Raise convergence threshold or `ESCALATION_C` |
| Convergences never fire | Lower convergence threshold, check MIN_CONVERGENCE_DOMAINS isn't too high |
| Entry pressure is always `"direct"` after E_target is built | Adjust `PRESSURE_THRESHOLD_LOW` / `PRESSURE_THRESHOLD_HIGH` |
| Noticing fires on same-sounding domains (e.g., career twice with different facets) | Domain exclusion is working correctly — this is by design. If undesirable, consider facet×domain exclusion. |
| Users report feeling "watched" despite reduced frequency | Frequency is correct but content is too explicit — prompt builder instructions may need softening, not Governor changes |
| >15% of sessions have overlay deferrals | Collision rate too high — consider: (a) widening the phase curve to spread triggers, (b) adding a 1-turn separation rule after overlays, or (c) accepting and documenting as expected |
| Users report abrupt ending feels bad | Revisit Netflix cut-to-black design. Consider: (a) is conversation skew producing enough intensity arc?, (b) is the frontend transition smooth enough?, (c) do we need a soft "last turn" signal after all? |

---

## LESSONS LEARNED

### Key Learnings

1. **Ask "what does the LLM already do well?" before designing control layers.** The original Move Generator tried to formalize what Nerin naturally handles (conversational action choice) while leaving unspecified what it fails at (frequency control). The Governor reframe emerged from this single question.

2. **Different problems need different mechanisms.** Contradiction has a clean deterministic signal (facet divergence across domains). Noticing has a softer signal (clarity emergence). Forcing both through the same mechanism — either both throttle-based or both target-based — would be wrong. The hybrid model matches each problem's nature.

3. **Formulas beat hardcoded limits.** `MAX_CONTRADICTIONS = 2` is an arbitrary number. `requiredStrength(n) = BASE * ESCALATION^n` is a shape that naturally produces 0-2 based on evidence quality. The formula IS the limit — and it's tunable without changing the design.

4. **Soft gates beat hard gates.** `clarity = lean × conf` multiplies two [0,1] signals. Low confidence doesn't get rejected — it produces low clarity, which produces low emergence, which doesn't cross the threshold. The system degrades gracefully instead of having binary cutoffs.

5. **Reuse existing primitives.** The noticing and contradiction formulas both build on `mu_g` and `w_g` from `computeFacetMetrics()` — the same scoring primitives that drive territory selection. No new extraction, no new LLM calls, no new data sources.

6. **Cross-agent validation catches blind spots.** The panel's velocity formula was elegant but used the wrong primitive (score change vs clarity emergence). The other agent's signal formula was better but lacked rhythm control. The hybrid — other agent's signal, panel's gating — is strictly better than either alone.

7. **Storyteller perspective grounds technical design.** Sophia's insight — "the difference between following and watching is silence" — directly translated into the Governor's restraint philosophy. Frequency control IS the silence that transforms surveillance into companionship.

8. **The best ending is invisible amplification.** The Netflix cut-to-black works because the conversation is still alive — and at peak intensity — when it stops. A wrap-up closing ("surface a living thread") weakens the pull-forward. Instead, closing means amplification: Nerin gets permission to go deeper, doesn't know it's the last turn, and the conversation cuts at the peak. The user walks away with momentum, not closure.

9. **Mutual exclusion protects intimacy.** Noticing says "I see you." Contradiction says "I see your complexity." Both spend trust. Both in one turn makes the user feel studied, not seen. One overlay per turn preserves the weight of each moment.

10. **Derive-at-read eliminates state management.** Recomputing EMA + baseline from full evidence history each turn costs ~3750 clarity values (sub-millisecond) but eliminates per-facet×domain state columns, migration complexity, and update logic. The codebase pattern (derive trait scores at read time) applied consistently.

11. **Convergence is contradiction's mirror — and equally powerful.** Contradiction surfaces complexity ("you're different in different contexts"). Convergence surfaces identity ("this is who you are across contexts"). Both are evidence-based, both use the same per-domain scoring primitives, both follow the escalating threshold pattern. Adding convergence didn't complicate the Governor — it completed it.

12. **Baseline confidence protects against false positives without hard gates.** Instead of `MIN_HISTORY_TURNS` blocking noticing entirely before turn N, `baselineConfidence = 1 - exp(-BASELINE_GROWTH * historyLength)` scales emergence by history depth. A strong signal at turn 5 fires at ~75% emergence. A weak signal at turn 5 gets doubly suppressed (weak raw signal × low confidence). The formula IS the protection.

13. **Amplify should only evaluate global signals.** Noticing is a local signal (one facet×domain). Contradiction and convergence are global signals (cross-domain patterns). The final turn should surface something meaningful about who the user IS — not a local observation. Excluding noticing from amplify simplified the design and improved the narrative.

### What Worked

- **Red Team / First Principles analysis** caught the over-scoping early, before any implementation
- **Party Mode panel** produced complementary perspectives (Dr. Quinn on architecture, Winston on contracts, Sophia on narrative rhythm)
- **Sophia consultation** provided pacing guidance that directly shaped the phase curve formula
- **Cross-agent comparison** forced both proposals to defend their primitive choices, leading to the hybrid
- **Escalating threshold pattern** solved the "how many is too many?" question without arbitrary limits — reusable across noticing, contradiction, and convergence
- **EMA proposal from user** resolved the signal-smoothing debate more elegantly than either agent's proposal

### What to Avoid

- **Don't design dispatch for things the LLM handles naturally.** Pull/Bridge/Hold/Pivot as explicit dispatch targets was fake precision. Trust the LLM for conversational craft, constrain it for structural discipline.
- **Don't add feedback loops unless the simpler alternative fails.** Detecting Nerin's response to close the noticing loop would have required response parsing, tags, or extra LLM calls. Window-based tracking (Governor tracks its own state) achieves 90% of the precision at 10% of the complexity.
- **Don't add hard gates when soft influence works.** `CONF_MIN` and `LEAN_MIN` as binary filters were unnecessary once `clarity = lean × conf` naturally suppresses weak candidates.
- **Don't build the full system when a thin layer will do.** The Governor's 4 decisions shaped into a `PromptBuilderInput` discriminated union are the minimum viable restraint layer. If Nerin needs more constraint later, promotion to Move Generator is additive — but start thin.
- **Don't use boolean bypass flags when threshold parameters work.** `bypassThreshold: boolean` creates two code paths. `threshold: number` with default = config value and `0` for bypass creates one code path with a parameter. Simpler, more testable, and self-documenting.
- **Don't manufacture endings — amplify them.** The instinct to add wrap-up instructions ("surface a living thread, leave it open") is the instinct to tie a neat bow. Resist it. Instead, closing means amplification: "go deeper." Nerin doesn't know it's ending. The user experiences a conversation that peaked right before it stopped. That's the pull-forward.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
