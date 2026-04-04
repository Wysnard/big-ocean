# Problem Solving Session: Nerin Steering Architecture — From Territory-Based to Two-Call Director Model

**Date:** 2026-04-03
**Problem Solver:** Vincentlay
**Problem Category:** Architecture / LLM Pipeline Design

---

## PROBLEM DEFINITION

### Initial Problem Statement

Nerin (the conversational personality assessment agent) consistently ignores the governor's territory steering directives. The governor computes sophisticated multi-signal steering (territory scores, entry pressure, observation focus), compresses it into system prompt prose, and Nerin follows its own conversational instincts instead — deepening the current thread rather than bridging to new assessment-relevant topics. This is particularly apparent in early conversation when the user latches onto a single topic.

### Refined Problem Statement

A single LLM call cannot simultaneously be a compelling empathic conversationalist AND a compliant strategic assessor. The current architecture asks one call to serve two competing objectives: personality/rapport (identity layer, ~1,500 words) vs. steering compliance (2-3 sentences buried in system prompt). The identity layer wins every time because conversation history + rich instincts outweigh terse steering directives in LLM attention. Two prior approaches (v1: target facets/domains, v2: territory-based steering) both failed — v1 caused clinical leakage (Nerin using Big Five terms), v2 causes steering non-compliance. The fundamental issue is structural, not a tuning problem.

### Problem Context

- **Platform:** Big Ocean — Big Five personality profiling via conversational assessment
- **Pipeline:** User message -> Evidence extraction (Haiku) -> Pacing/scoring -> Governor -> System prompt -> Nerin (single LLM call) -> Response
- **Evidence:** Session analysis (a29057bf) shows 5 turns, 6 territory changes, ALL 25 evidence pieces tagged `leisure` domain, zero Agreeableness signal. Nerin produced great conversation quality but ignored every bridge directive.
- **Prior attempts:** v1 (target facets/domains) caused clinical language leakage. v2 (territories) achieves good UX but broken steering. Current conversational quality is good and must be preserved.
- **Pacing system:** Energy, telling, trust, drain, E_target — the entire pacing/user-state extraction system was built to feed the territory scorer. If territories go, pacing goes too.

### Success Criteria

- At most 1-2 facets missing from the final evidence profile (out of 30)
- At least 4-5 life domains with meaningful evidence (out of 6: work, relationships, family, leisure, health, other). Director exercises judgment on which gaps to pursue vs. accept as thin based on the user's life context.
- High diversity of facets and domains — evidence should be spread across many facets per domain and many domains per facet, not clustered around 1-2 threads. A conversation that produces 25 evidence pieces across 11 facets but all in `leisure` is a coverage pass but a diversity fail.
- Conversational quality remains compelling and natural (no clinical leakage, no robotic transitions)
- Topic transitions feel organic to the user, not forced

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

| Dimension | IS | IS NOT |
|-----------|-----|--------|
| **Where** | In the system prompt → LLM generation step. Steering signal is structurally weaker than identity/conversation signals. | In evidence extraction (ConversAnalyzer works — 25 pieces from one topic). Not in Nerin's conversational quality (rapport, depth, voice all strong). |
| **When** | Particularly apparent in early conversation when user latches onto a single topic. Persists every turn — 6/6 turns showed non-compliance in analyzed session. | Not intermittent or random — it's systematic. Not limited to certain territory types. |
| **Who** | All users. The architecture guarantees this failure mode regardless of user behavior. | Not user-dependent — high-energy, engaged users make it worse (more compelling thread to follow), but low-energy users don't fix it. |
| **What** | A single LLM call cannot prioritize competing objectives (personality vs. steering). The delivery mechanism (system prompt prose) is too weak to override conversation momentum. | Not a prompt tuning problem (two prior iterations tried different tuning — both failed). Not a model capability problem (Claude can follow instructions — it's a signal-to-noise issue). |

**Pattern:** The problem is structural and deterministic. The steering pipeline computes sophisticated multi-signal output, then lossy-compresses it into 2-3 sentences that compete with ~1,500 words of identity instructions and the full conversation history. Conversation history > system prompt > buried steering — this is an LLM attention hierarchy truth, not a tuning variable.

### Root Cause Analysis

**Method: Five Whys + Systems Thinking**

**Root Cause (Five Whys):** Steering and personality are competing objectives resolved in a single LLM call, where the delivery mechanism (system prompt) structurally disadvantages steering. This is not a tuning problem — three iterations of prompt content changes (target facets, target domains, territories) all failed because the delivery mechanism remained the same.

**Five Whys Chain:**
1. Nerin ignores directives → steering drowned by identity layer + conversation momentum
2. Identity drowns steering → both compete in same system prompt, LLM weights richer content higher
3. Same LLM call → architecture assumes single generation can serve both objectives
4. Not caught earlier → prior iterations changed steering *content* but not *delivery mechanism*
5. System prompt is wrong place → LLM attention hierarchy: conversation history > identity > tactical directives

**Root Cause (First Principles — deeper):** The entire deterministic steering pipeline (scorer → selector → governor → templates → pressure modifiers) is an over-engineered approximation of what a single LLM strategist call can do natively — but it was placed in the wrong architectural position (system prompt of the personality agent) where it couldn't execute.

**First Principles Reconstruction:** Starting from fundamental truths (the assessment needs coverage, users talk about what they want, LLMs are excellent at creative bridging when given clear objectives, LLMs are poor at self-constraining with competing objectives), the minimum viable steering system is:

```
Evidence so far → Coverage gaps (pure function) → Strategist (LLM #1) → Nerin (LLM #2)
```

The current system has 7 components between "coverage gap" and "question asked" (gap → scorer → selector → governor → template → pressure → system prompt → Nerin). First principles says you need 2 (gap → strategist → Nerin). The 5 intermediate deterministic components are approximations of what the LLM strategist does naturally — and does better, because it reads the actual conversation and crafts context-aware bridges that no template can match.

**Pacing signals (energy, telling, trust, drain):** Built to feed the scorer and governor. An LLM reading conversation history already perceives engagement, guardedness, and energy — no need to pre-extract numerically. The concept of reading conversation energy is valid (good interviewers do this), but the Director can do it natively from the messages.

### Critique and Refine: Gaps and Design Questions

Systematic review of root cause analysis. Core diagnosis holds — no cracks. Five gaps identified, all in solution design space:

| # | Gap | Resolution |
|---|-----|-----------|
| 1 | **Director output format** — how detailed is "content"? Full draft, key sentences, or structured bullets? | **Critical — resolve in solution design.** Determines Nerin's creative freedom vs compliance. |
| 2 | **Qualitative conversation reading** — can Director perceive "telling" (compliance vs spontaneity) from raw messages? | **Minor.** Energy and guardedness are textually visible. Telling is subtler but addressable with a qualitative note in Director prompt ("is the user only answering what's asked, or volunteering?"). |
| 3 | ~~Opening turn blank slate~~ | **Non-issue.** Nerin's greeting + opening question are pre-generated. By the time the Director first runs, there's already a thread (greeting, question, user's first answer) and initial evidence. |
| 4 | **Domain coverage flexibility** — "all 6 domains" may be too rigid for some users | **Soften success criteria.** At least 4-5 domains with meaningful evidence. Director exercises judgment on which gaps are worth pursuing vs accepting as thin for this person. |
| 5 | **Closing phase handling** — who decides when to close, how does Director shift? | **Swappable prompts.** The closing is a different task than mid-conversation steering — use a specialized prompt for it rather than overloading the Director with phase-awareness. Same principle: optimized prompts per task. |

### Contributing Factors

1. **Bridge templates have escape hatches** — 3-tier fallback structure ("follow thread / flag and leave / clean jump") lets Nerin find reasons to stay in the current thread every time
2. **Pressure modifiers are too terse** — "Go straight there." (3 words) vs ~1,500 words of identity instincts that reward depth
3. **Territory descriptions are abstract** — "who shaped them in the family" can't compete with vivid, emotionally charged user content about climbing
4. **Negative constraints target wrong thing** — "Don't pull back to previous territory" constrains territory names, not the actual conversational topic the user is stuck on
5. **Common instincts are asymmetric** — recovery strategies for low-energy, but no redirection strategies for high-energy mono-topic
6. **Territory abstraction adds a translation gap** — assessment need → territory ID → abstract description → concrete question (signal lost at each step)

### System Dynamics

**Two competing reinforcing loops with no balancing mechanism:**

**Loop A — The Depth Loop (always wins):**
User shares rich content → Nerin instincts fire (honor, celebrate, deepen) → Nerin deepens thread → User engages more on same topic → Richer content → Loop reinforces. Operates at **conversation history level** (strongest LLM attention).

**Loop B — The Steering Loop (always loses):**
Governor detects gap → Injects directive in system prompt → Competes with Loop A → Nerin follows Loop A → Gap persists → Governor tries again → Same result. Operates at **system prompt level** (weakest LLM attention).

**Critical dynamic:** The better the conversation, the worse the coverage. Engaged users strengthen Loop A, making Loop B even less effective. The system's success condition (good conversation) actively undermines its other success condition (good coverage).

**Translation gap compounds the problem:**
Assessment need (facet/domain gaps) → territory ID → abstract description → Nerin must creatively translate to concrete question under Loop A pressure → fails. Each encoding/decoding step loses signal.

### Alternative Root Cause Hypotheses (Tree of Thoughts Validation)

Three independent reasoning paths were evaluated to stress-test the primary root cause:

| Path | Hypothesis | Verdict |
|------|-----------|---------|
| **A: Single-call problem** | Competing objectives in one LLM call → steering always loses | **Primary root cause.** Explains all 3 failed iterations, explains good UX + bad coverage, leads to clear solution. |
| **B: Conversation history dominance** | Conversation history momentum overrides any instruction regardless of architecture | **Contributing factor, not root cause.** History momentum is real but manageable when personality layer isn't fighting the directive. Human interviewers succeed against the same momentum because they commit to the redirect. |
| **C: Signal quality gap** | The system doesn't generate good enough bridge directives | **Design requirement for the solution, not root cause.** v1 (specific facets/domains) was specific enough but still failed — proving delivery mechanism matters more than signal quality alone. |

**Key design insight from this analysis:** The Director must find the **connective tissue between the current conversational thread and the target direction** — always producing a bridge, even if drastic, that links what the user is talking about to where the assessment needs to go. The bridge is the Director's core output. Not "steer to relationships" but "here's how climbing connects to relationships: ask who they climb with." A connected pivot, not a non sequitur.

### Pre-mortem Findings (Director Model Failure Analysis)

Imagined the two-call Director model failing 6 months post-launch. Top risks and mitigations:

| # | Failure Mode | Risk | Mitigation |
|---|-------------|------|------------|
| 1 | Director accumulates rules and becomes a second governor | Medium | Keep Director prompt lean. Resist adding behavioral rules. Change inputs, not constraints. |
| 2 | ~~Nerin ignores the directive~~ | ~~Critical~~ | **Eliminated by design:** Director writes strategy + content + conversation references. Nerin is purely a voice/writer layer — it executes, doesn't strategize. No competing objectives remain. |
| 3 | Bridges feel mechanical (every-turn pivoting) | Medium | **Eliminated by design:** Director always directs — either "bridge to new ground" OR "deepen the current thread." Not every turn is a pivot. Director decides turn strategy, not just bridge strategy. |
| 4 | Latency from sequential calls | Medium | Evidence extraction (Haiku) runs in parallel with Director (smarter model) since Director only needs prior turns' cumulative evidence, not current turn's extraction. User state extraction is eliminated entirely (no pacing system). Pipeline: `[parallel: extraction + Director] → Nerin`. |
| 5 | Coverage analyzer too naive (flags irrelevant gaps) | Low | Director exercises judgment — it can decide "this person has nothing for health, push work instead." Feed gaps as input, let Director decide which to pursue. |

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

1. **Three failed iterations** — empirical proof single-call steering doesn't work. No one will argue for more tuning.
2. **Conversational quality already achieved** — Nerin's voice/rapport works. We're fixing steering while preserving what's good.
3. **Massive code simplification** — killing territory catalog, scorer, selector, governor, templates, pressure modifiers, pacing system. Huge reduction in complexity.
4. **LLM costs potentially decrease** — 2x Haiku may cost less than 1x Opus/Sonnet.
5. **Better portraits downstream** — higher facet/domain diversity = richer profiles = better product.

**Restraining Forces (Blocking Solution):**

1. **Significant refactoring effort** — pacing/steering pipeline is deeply integrated (exchange table, pipeline orchestration, tests, mocks).
2. **Unproven architecture** — two-call model is theoretically sound but untested. New failure modes possible.
3. **Latency sensitivity** — sequential Director → Nerin adds latency to conversational UX.
4. **Prompt engineering uncertainty** — trading deterministic code complexity for prompt complexity. Director + Nerin voice prompts require iteration.
5. **Loss of observability** — current pipeline produces rich debug data (scorer, governor, pacing). Director reasoning is less inspectable.

**Strongest driving:** #1 (three failures) and #3 (simplification). Current system doesn't work AND is complex.
**Strongest restraining:** #2 (unproven) — addressable through incremental validation. #5 (observability) — solvable by storing Director output as debug data.

### Constraint Identification

**Primary constraint: The Director's output format.** The single design decision everything hangs on. Too vague → Nerin drifts. Too rigid → scripted feeling. Must be specific enough for compliance, flexible enough for natural voice. Resolve before implementation.

**Secondary constraints:**
- **Latency budget:** Total response time must stay conversational (~3-4s). Director + Nerin + extraction must fit.
- **Nerin voice preservation:** Haiku + voice-only prompt must still sound like Nerin. Validate early.
- **Migration path:** Exchange table schema, pipeline code, tests all need migration. Can't ship half-migrated.

**Real vs. assumed constraints:**
- ~~"We need territories"~~ → Assumed, invalidated. Director creates dynamic direction.
- ~~"We need pacing signals"~~ → Assumed, invalidated. Director reads dynamics natively.
- ~~"We need deterministic steering"~~ → Assumed, invalidated. LLM strategist is more capable.
- "Latency must be under 2 seconds" → Needs validation. 3-4s may be acceptable for a thoughtful conversational agent.

### Key Insights

1. The driving forces massively outweigh restraining forces. The current system is both broken AND complex — replacing it with something simpler that works is a double win.
2. The primary constraint (Director output format) is a design problem, not a technical one. It can be iterated on quickly through prompt experimentation.
3. Observability loss is real but solvable — store Director output (strategy, bridge, references) on the exchange record as structured JSON, replacing the current governor_output/governor_debug fields.
4. The biggest risk is not "will this work" but "will Nerin's voice survive the model downgrade to Haiku." This should be validated first with a quick prototype before committing to the full migration.

---

## SOLUTION GENERATION

### Methods Used

Morphological Analysis (systematic parameter space exploration) + TRIZ contradiction resolution (compliance vs. voice freedom)

### Generated Solutions

**Architecture: Two-Call Director + Nerin Model**

Four critical design parameters explored with options:

**P1 — Director Output Format:**
- 1A: Full draft (very high compliance, low voice freedom)
- 1B: Structured plan — JSON with reflect/direction/question/references/avoid fields (high compliance, medium voice freedom)
- 1C: Key sentences + skeleton (high compliance, medium-high freedom)
- **1D: Free-form strategic brief — 2-3 sentences, no schema, no predefined modes ← SELECTED**

**Rationale for 1D:** Structured JSON (1B) is a mini-governor inside the Director's output — rigid fields forcing creative behavior into boxes. Same pattern we're killing. A free-form brief lets the Director combine strategies naturally (bridge + deepen in one turn), reference conversation moments fluidly, and adapt its output to the situation. The smarter model handles this.

**P2 — Model Assignment:**
- **2A: Sonnet Director + Haiku Nerin ← SELECTED (start here, upgrade Director to Opus if needed)**
- 2B: Haiku + Haiku (cheapest, risk: shallow strategy)
- 2C: Sonnet + Sonnet (best quality, most expensive)
- 2D: Opus + Haiku (strongest strategy, easy upgrade path from 2A)

**P3 — Director Input:**
- 3A: Conversation + coverage matrix
- 3B: Conversation + coverage + recent evidence notes
- 3C: Compressed summary + coverage (cheapest input tokens)
- **3D: Full conversation history + target facets (several, prioritized) + target domain ← SELECTED**

**Rationale for 3D:** Give the Director everything. Full history so it reads conversation dynamics natively. Target facets (the weakest ones needing evidence) and target domain (the domain most needing coverage) as clear, simple signals from the coverage analyzer. No matrix, no scores — just "here's what we need."

**P4 — Turn Strategy Modes:**
- 4A: Bridge or Deepen (simple binary)
- 4B: Bridge, Deepen, or Probe (three modes)
- **4C: Free-form strategy — Director decides what the situation calls for ← SELECTED**

**Rationale for 4C:** Predefined modes constrain the Director unnecessarily. It might want to bridge-and-deepen in one turn, or angle toward a facet within the current topic, or do something we haven't categorized. Free-form lets it be the creative strategist it's meant to be.

**Selected combination: 1D + 2A (→ 2D if needed) + 3D + 4C + minimal Nerin context**

**Director Output Examples (free-form brief):**

Bridge turn: *"They keep coming back to planning and ordered motion — that's their identity. Use that as a lever: ask if they're like that with people too. Do they plan who to trust, or is trust something they fall into? Pull from their 'ordered movement toward a beneficial goal' line — that's the bridge. Push toward relationships domain."*

Deepen turn: *"They just said fear stops them and a lot of people from doing things. That's the most vulnerable thing they've said. Don't redirect — go deeper. Ask where else fear has been a barrier outside of climbing. They're opening up, let it breathe."*

Mixed turn: *"Good signal on conscientiousness but all from leisure. Stay on the improvement thread but tilt it toward work — ask what improvement looks like in their job or studies. Do they plan their career the same way they plan a climb?"*

### Critical Design Refinement: Minimal Nerin Context

**Insight:** If the Director reads the full history and outputs a complete strategic brief, Nerin doesn't need the conversation history at all. The history is what creates the gravitational pull that caused all prior steering failures. Remove it entirely.

**Nerin receives only:**
1. **Voice prompt** — how Nerin sounds (tone, ocean metaphors, emoji style, sentence rhythm). Pure style. Zero strategic directives.
2. **Director's brief** — what to say. The entire content signal.

**No conversation history. No strategic instincts.**

**Instinct redistribution:**

| Current Instinct | Type | New Home |
|-----------------|------|----------|
| Honor what they give, acknowledge before analyzing | Strategic | **Director** |
| Celebrate new depth ("Now we're getting somewhere") | Strategic | **Director** |
| Guarded answer → pivot angle | Strategic | **Director** |
| Wonder deepens, doesn't resolve | Strategic | **Director** |
| Name what's distinctive | Strategic | **Director** |
| Save reads for the portrait | Strategic | **Director** |
| Ocean-themed emoji punctuation | Voice | **Nerin** |
| Ocean mirrors (Hermit Crab, Ghost Net...) | Voice | **Nerin** |
| Sentence rhythm, brevity, directness | Voice | **Nerin** |

**Architectural guarantee:** Nerin cannot ignore steering because Nerin cannot see anything to be distracted by. The Director's brief is the ONLY content signal. The compliance problem becomes structurally impossible.

**Final pipeline:**
```
Director (Sonnet/Opus):
  Input:  Full history + target facets + target domain + evidence notes
  Prompt: Strategic instincts + assessment awareness + conversation reading
  Output: Free-form brief

Nerin (Haiku):
  Input:  Director's brief ONLY
  Prompt: Voice guide ONLY (tone, metaphors, emoji, rhythm)
  Output: User-facing message
```

### Creative Alternatives

**Inner Monologue variant:** Director outputs as if Nerin is thinking to herself. Functionally close to 1D — could be explored as a prompt framing option during iteration.

**Emotional direction (SCAMPER — Adapt from film directing):** The Director's brief should include the **emotional shape** of the response alongside content direction. Not just "reflect X, ask Y" but "start warm and acknowledging, build to a surprising question." This helps Haiku nail the feel without needing conversation history to read the room.

### Cross-Functional Trade-offs

| Concern | Resolution |
|---------|-----------|
| **Observability loss** | Store Director brief as text on exchange record. Real-time debug = read brief + read Nerin's response side by side. Post-hoc batch analysis if needed. |
| **Latency** | ~1-1.6s total — likely faster than current pipeline. Extraction parallel with Director, Haiku Nerin with minimal input is very fast. |
| **Voice continuity without history** | Director handles continuity. It reads full history including Nerin's prior responses — notes in brief what to avoid repeating, what callbacks to make. |
| **Response length/rhythm variation** | Director includes pacing cues in emotional direction: "keep short" / "give this space." Part of the emotional shape. |

---

## SOLUTION EVALUATION

### Evaluation Criteria

| Criteria | Current System | Proposed Design | Confidence |
|----------|---------------|-----------------|------------|
| <=2 missing facets | Fails (19 missing) | Should pass — Director targets weak facets | Medium |
| 4-5 domains covered | Fails (1 domain) | Should pass — Director targets weak domains | Medium |
| Facet/domain diversity | Fails (11 facets, all leisure) | Should pass — Director bridges to new domains | Medium-High |
| Conversational quality | Passes | Risk — Haiku voice unproven | **Low — validate first** |
| Natural transitions | Fails (don't happen) | Should pass — Director crafts the connection | Medium |

### Solution Analysis

**Validation strategy — 3 layers in priority order:**

1. **Layer 1 — Haiku voice test (existential, ~1 hour):** Handcraft 5 Director briefs from the analyzed session. Feed to Haiku + voice-only prompt. Compare against current Nerin responses. Does ocean theming, emoji, emotional rhythm survive? If fails → upgrade Nerin to Sonnet (architecture stays same).

2. **Layer 2 — Director strategy test (~1 afternoon):** Take the analyzed session. At each turn, run Director with real coverage gaps. Read briefs. Would they have redirected the conversation better than what happened? Manual read-and-judge evaluation.

3. **Layer 3 — End-to-end coverage test (post-implementation):** Run 3-5 full conversations with new pipeline. Compare facet/domain coverage against current system conversations.

**Engineering feasibility:**
- Coverage analysis function: straightforward, ~1 day
- Pipeline orchestration: simpler than current (4 steps vs 10), less code
- Exchange table migration: drop pacing columns, add director_output text field
- Old pipeline deletion: needs care — deeply integrated tests and fixtures reference pacing
- Can be done incrementally: new pipeline alongside old, feature-flagged, compare, cut over

### Recommended Solution

**Two-call Director + Nerin architecture with minimal Nerin context.**

```
[Parallel]
  Evidence Extraction (Haiku): user message → facet evidence
  Director (Sonnet/Opus): full history + target facets + target domain + evidence notes
    → free-form strategic brief with emotional direction
[Sequential]
  Nerin (Haiku): Director's brief ONLY + voice prompt ONLY → user-facing message
```

Director owns: strategy, instincts, continuity, pacing cues, emotional shape, conversation references.
Nerin owns: voice, tone, ocean metaphors, emoji punctuation, sentence rhythm.

### Rationale

We tried three times to make a single LLM call steer itself. It can't — the personality always wins over steering directives in system prompt. So we split the brain from the voice. The brain (Director) reads everything and decides strategy. The voice (Nerin) sees only the strategy and sounds like Nerin. They never compete because they never share a context. The compliance problem becomes structurally impossible — Nerin can't ignore what it can't see.

---

## IMPLEMENTATION PLAN

### Implementation Approach

**Feature-flagged parallel pipeline.** Build new Director + Nerin pipeline alongside existing. Feature flag controls which runs. Compare outputs, validate incrementally, roll back if needed.

### Action Steps

**Phase 1 — Validate Before Building (gate: both pass before Phase 2)**

| Step | Action | Output |
|------|--------|--------|
| 1.1 | Haiku voice test — extract voice from current modules, write voice-only prompt, handcraft 5 briefs from session a29057bf, feed to Haiku, compare | Pass/fail on Nerin voice quality. If fail → test Sonnet. |
| 1.2 | Director strategy test — write Director prompt, write coverage analysis function, replay analyzed session through Director, read briefs, iterate | Validated Director prompt producing good strategies. |

**Phase 2 — Build New Pipeline (feature-flagged)**

| Step | Action | Output |
|------|--------|--------|
| 2.1 | Coverage analysis pure function (evidence → target facets + target domain) | Tested function with unit tests |
| 2.2 | Director LLM integration (full history + targets → free-form brief) | Director call storing output on exchange record |
| 2.3 | Nerin voice LLM integration (brief only → user-facing message) | Voice-only Nerin call with minimal input |
| 2.4 | Pipeline orchestration (parallel: extraction + Director → Nerin → save) | New pipeline behind feature flag |
| 2.5 | Exchange table migration (add `director_output` text column) | Migration file, keep old columns during parallel phase |

**Phase 3 — Validate and Cut Over**

| Step | Action | Output |
|------|--------|--------|
| 3.1 | End-to-end testing — 3-5 full conversations, measure coverage vs current system | Comparative data on facets, domains, diversity, voice quality |
| 3.2 | Cut over — make new pipeline default, remove feature flag | New pipeline live |
| 3.3 | Clean up — delete territory catalog, scorer, selector, governor, templates, pressure modifiers, pacing system, old prompt modules. Drop pacing columns. Update tests, fixtures, docs. | Codebase simplified. |

### Timeline and Milestones

| Milestone | Phase |
|-----------|-------|
| Haiku voice validated | Phase 1 gate |
| Director prompt validated | Phase 1 gate |
| New pipeline running behind flag | Phase 2 complete |
| Coverage improvement confirmed | Phase 3.1 |
| Old pipeline removed | Phase 3.3 |

### Resource Requirements

| Resource | Purpose |
|----------|---------|
| Director prompt | Strategic instincts + assessment awareness + conversation reading + emotional direction + continuity. The critical artifact. |
| Nerin voice prompt | Distilled from current identity modules. Pure style (tone, ocean metaphors, emoji, rhythm). Zero strategy. |
| Coverage analysis function | Facet-by-domain gap detection → target facets + target domain |
| New pipeline orchestration | Replaces `runNerinPipeline` in `nerin-pipeline.ts` |
| Exchange table migration | `director_output` text column |
| LLM repository methods | Director call (Sonnet) + voice-only Nerin call (Haiku) |

### Responsible Parties

Solo developer (Vincentlay). All phases.

---

## MONITORING AND VALIDATION

### Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Facet coverage | <=2 missing (out of 30) per completed assessment | Count distinct facets with evidence in `conversation_evidence` |
| Domain coverage | >=4 domains with meaningful evidence | Count distinct domains with >=2 evidence pieces each |
| Facet-domain diversity | No single domain holds >50% of total evidence | Distribution analysis on evidence records |
| Voice quality | Blind reviewer cannot distinguish Haiku Nerin from current Nerin | Manual A/B comparison on sample conversations |
| Latency | Total response time <=2s (p95) | Measure time from user message received to response sent |
| Director brief quality | Briefs consistently contain: connection to current thread, target direction, emotional shape | Manual review of stored `director_output` on exchange records |

### Validation Plan

**Pre-launch (Phase 1):**
- Haiku voice test: 5 handcrafted briefs → Haiku → compare with current responses
- Director strategy test: replay analyzed session through Director, evaluate briefs manually

**Post-launch (Phase 3):**
- Run 3-5 full test conversations with new pipeline
- Compare facet/domain coverage metrics against 3-5 conversations from current pipeline
- Qualitative review: read conversations end-to-end, assess naturalness of transitions
- Check Director briefs for each turn — are they actionable? Does Nerin follow them?

**Ongoing:**
- Monitor facet/domain distribution across all completed assessments
- Spot-check Director briefs weekly for quality drift
- Compare portrait quality (downstream effect) before/after migration

### Risk Mitigation

| Risk | Prevention | Detection | Response |
|------|-----------|-----------|----------|
| Haiku can't voice Nerin | Test in Phase 1 before building | Side-by-side comparison | Upgrade Nerin to Sonnet |
| Director produces vague briefs | Iterate prompt in Phase 1 | Read stored briefs | Refine Director prompt or upgrade to Opus |
| Bridges feel mechanical | Director can deepen (not every turn is a bridge) | Read conversation transcripts | Adjust Director prompt to balance bridge/deepen ratio |
| Coverage doesn't improve | Phase 3 end-to-end testing | Compare metrics pre/post | Iterate Director prompt targeting, adjust coverage analysis |
| Latency regression | Minimal Nerin input, parallel extraction | p95 latency monitoring | Optimize token counts, consider caching |
| Voice drift over time | Voice prompt is stable and small | Periodic quality review | Refresh voice prompt from sample conversations |

### Adjustment Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Facet coverage drops below 25 per assessment | >3 assessments hit this | Review Director briefs — is it targeting the right facets? |
| Single domain holds >60% of evidence | Consistent pattern | Director prompt isn't bridging enough — increase bridge pressure in prompt |
| Response latency >3s (p95) | Sustained over 1 day | Profile pipeline — which call is slow? Reduce input tokens or switch models |
| Users report "feels like an interview" | Qualitative feedback | Director is bridging too aggressively — tune toward more deepen turns |
| Voice quality complaints | Any report | Compare recent responses to voice baseline — refresh prompt if needed |

---

## LESSONS LEARNED

### Key Learnings

1. **Competing objectives in a single LLM call is a structural problem, not a tuning problem.** Three iterations of prompt changes confirmed this. Changing the content of steering doesn't help when the delivery mechanism is fundamentally weak.

2. **Deterministic pipelines can be over-engineered approximations of what an LLM does natively.** The territory scorer, governor, templates, and pressure modifiers were 5 components doing what a single LLM strategist call does better — because the LLM reads the actual conversation and crafts context-aware strategies that no template can match.

3. **The minimal context insight is the key architectural guarantee.** Stripping conversation history from Nerin makes compliance structurally impossible to violate — not a prompt discipline rule, but an architectural invariant. The strongest solutions eliminate failure modes by design, not by instruction.

4. **Strategic instincts and voice are separable.** What seemed like one unified "Nerin personality" is actually two distinct concerns: strategic behavior (when to acknowledge, when to push, when to bridge) and voice (how things sound). Separating them enables clean two-call architecture.

5. **Validate existential risks before building.** Phase 1 (voice test + strategy test) costs hours. The full migration costs days. Always kill the biggest risks cheapest first.

### What Worked

- Starting from database analysis of a real session — concrete evidence, not abstract complaints
- First Principles analysis to strip assumptions and find the minimal viable system
- Pre-mortem to anticipate failure modes before they happen (two were eliminated by design refinements)
- The iterative design refinement: each elicitation round (First Principles → Tree of Thoughts → Pre-mortem → Critique → Red Team → SCAMPER → War Room) sharpened the design significantly

### What to Avoid

- Over-engineering the Director's output (structured JSON, predefined modes) — same pattern as territories, just in new clothing
- Giving Nerin any strategic agency — the moment Nerin has both content and style objectives, they compete
- Giving Nerin conversation history — it creates the gravitational pull that caused all prior failures
- Adding rules to the Director prompt reactively — resist the urge to constrain; change inputs, not behavior

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
