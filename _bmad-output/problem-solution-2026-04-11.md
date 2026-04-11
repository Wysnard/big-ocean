# Problem Solving Session: Portrait Generation — Faster, Cheaper, Same/Higher Quality

**Date:** 2026-04-11
**Problem Solver:** Vincentlay
**Problem Category:** Architecture / Performance / Quality

---

## 🎯 PROBLEM DEFINITION

### Initial Problem Statement

"I want to improve the portrait generation faster and cheaper, with the same or higher quality."

### Refined Problem Statement

The portrait generation pipeline today takes **2–3 minutes end-to-end** and costs **$0.30–$0.40 per portrait**. The target is to bring this to roughly **~1 minute** (or feel like ~15s via streaming/progressive reveal) and **~$0.20–$0.30 per portrait** — a ~50–66% latency reduction and ~25–50% cost reduction — **without degrading quality**, and ideally **while resolving an existing latent quality issue**: an analysis of 9 generated portraits showed the **spine** (narrative backbone) was inconsistent across runs.

**Critical diagnostic clue (from elicitation):** Across those 9 portraits, the **conversation input was constant**, the **spine prompt was constant**, but the **model varied** and the **structure/voice prompt sections varied**. Spine quality flaked across this matrix anyway. Therefore the spine bug cannot be located in the spine prompt itself — it must be either **(a)** cross-section interference (changes to other prompt sections in the same call disturb how the model handles the spine), **(b)** model-capability sensitivity (the spine task is unusually fragile under weaker models), or both. This points strongly toward **decomposition** as a solution direction, but we will validate in diagnosis before committing.

The trigger for this work was an external suggestion to adopt a **multi-model "director" architecture** (chain-of-thought across specialized models). **Anti-anchoring clause:** the director-model is *one hypothesis*, not a foregone conclusion. During diagnosis we will actively try to *disprove* it — if a single better prompt or a single better model wins on cost/speed/quality, we go that way instead. Any solution that improves cost, speed, and/or quality is acceptable.

The improvement effort spans three levers: **architecture**, **model selection**, and **prompt engineering**. Upstream stages (facet scoring → trait derivation) are in scope if needed, but the primary focus is the **portrait generator service**.

### UX Context

The user is **actively waiting** (synchronous, staring at a spinner) when a portrait is generated. This means raw latency matters *and* perceived latency matters — **streaming / progressive reveal** is a first-class solution option, not an afterthought, because it can collapse perceived wait to <15s even if total work still takes ~1 minute.

### Quality Measurement Plan (mandatory before Step 6)

Before any candidate solution can be evaluated, we will build a **lightweight portrait quality rubric**, packaged as a **reusable Claude Code skill**, that can be applied to any portrait to score it on a small set of dimensions (e.g., spine coherence, six-movement arc fidelity, coined-phrase quality, self-compelling, voice). The rubric will be applied to the **existing 9-portrait corpus as a frozen "before" set**, then re-applied to each candidate solution's regenerated portraits for direct comparison. Without this rubric, Step 6 (solution evaluation) is unfalsifiable, so it is a hard prerequisite.

### Problem Context

- **Current baseline:** ~2–3 min latency, ~$0.30–$0.40 per portrait
- **Target:** ~1 min latency, ~$0.20–$0.30 per portrait
- **Latent quality bug:** spine inconsistency across portraits despite stable spine guidelines (observed across 9 portrait sample)
- **Architectural pattern under consideration:** director-model / multi-model chain-of-thought (analogous to storytelling-pipeline architecture)
- **Scope:** primarily the portrait generator service; upstream stages negotiable
- **Backwards compatibility:** **not required** — previous portraits can be invalidated
- **Model provider:** **not locked to Claude** (relaxed 2026-04-11 during Step 4 elicitation). Any model/provider is eligible if it fits better on cost/speed/quality. Practical expectation: the prose stage likely still wants Claude for voice quality, but the space is officially open.
- **LLM client library:** LangChain is the current choice (`@langchain/anthropic@1.3.26`), but is **not a hard constraint** for the portrait generator specifically. Direct `@anthropic-ai/sdk` is on the table as a candidate in Step 5 — motivated by the need for transparent observability, prompt caching, and controlled thinking budget, all of which are LangChain's weak spots. Other components (ConversAnalyzer, Nerin agent) stay on LangChain.
- **Recent context:** Portrait architecture v2 redesign (six-movement arc: Wonder → Recognition → Tension → Embrace → Reframe → Compulsion) is the current quality target. Self-compelling ("reader returns unprompted") is the true-north quality dimension.

### Success Criteria

A solution will be considered successful if **all** of the following hold:

1. **Latency:** P50 portrait generation completes in ≤ ~1 minute total **OR** perceived wait (first meaningful content rendered to the user) is ≤ ~15s via streaming/progressive reveal.
2. **Cost:** Per-portrait LLM cost ≤ ~$0.25 (down from $0.30–$0.40).
3. **Quality floor:** Portraits score at or above the existing 9-portrait corpus on the portrait quality rubric (built as a skill — see Quality Measurement Plan above), with **no regression** on self-compelling, recognition, or coined-phrase quality.
4. **Spine consistency:** Spine dimension scores are **stable across repeated runs of the same conversation**, resolving the inconsistency observed in the 9-portrait analysis.
5. **Re-runnability:** Same input produces stably good output across repeated generations (no luck-of-the-draw quality).
6. **Time-to-first-meaningful-content:** If streaming/progressive reveal is adopted, first movement rendered to the user in ≤10s (added from party-mode UX critique — mean latency is not enough; first-content matters disproportionately for emotional pacing).

### Baseline Solution to Beat

Before evaluating any fancy architecture in Step 6, we establish a **cheap-and-cheerful baseline**: *Sonnet 4.6 + prompt caching on the repeated conversation prefix + a tightened single-prompt rewrite*. Every more-complex candidate solution must explicitly justify its additional cost/complexity against this baseline. If the baseline hits the success criteria, we ship the baseline.

### Open Questions Carried Forward

- **Spine bug location:** the elicitation already ruled out "spine prompt is wrong" (see Critical Diagnostic Clue above). The remaining question is whether it's cross-section interference, model-capability sensitivity, sampling variance, or a combination — and whether it correlates with which model variants ran. **(To be answered in Step 2/3.)**
- **Latency budget breakdown:** where does the 2–3 min actually go — single big call, sequential calls, retries, post-processing, network? **(To be answered in Step 2 by reading the portrait generator code.)**
- **Pipeline dependency DAG:** draw the current call graph. Identify real data dependencies vs. accidental sequencing — parallelizable edges are free latency wins. **(Party-mode addition, Alex.)**
- **Token accounting:** tokens in/out per pipeline call + current model ID per call. **(Party-mode addition, Maya.)**
- **Prompt-prefix repetition ratio:** fraction of each call's prompt that is identical to the previous call's prompt prefix — determines prompt-cache eligibility and potential 90% cost cut on cached tokens. **(Party-mode addition, Maya.)**
- **Sub-task profiles:** which portrait sub-tasks (spine, movements, coined phrases, voice) are most model-bound vs. prompt-bound vs. context-bound? **(To be answered in Step 3.)**
- **Streaming feasibility:** is the current architecture compatible with progressive reveal (movement-by-movement render), or would it require a structural change? **(To be answered in Step 2.)**

---

## 🔍 DIAGNOSIS AND ROOT CAUSE ANALYSIS

_(To be filled in Steps 2–3)_

### Current Pipeline (as-found)

**Entry points:**
- HTTP handler: `apps/api/src/handlers/portrait.ts:21-74` (`getPortraitStatus` unauthenticated poller + `retryPortrait`)
- Worker: `apps/api/src/workers/portrait-generation.worker.ts:15-42`
- Use-case: `apps/api/src/use-cases/generate-full-portrait.use-case.ts:40-149`
- Generator: `packages/infrastructure/src/portrait/portrait-generator.ts` (single Sonnet call, line ~109; `Effect.retry({ times: 2 })` at line ~112; empty-content guard at line ~129-136)

**Call graph (as-found):**
```
[sessionId]
  ↓ (DB reads: assessment result, evidence, messages)
[Data transforms: facet map, trait scores, formatted evidence, depth signal]
  ↓
[ SINGLE LLM CALL — claude-sonnet-4-6, maxTokens=8000, temperature=0.7, adaptive extended thinking ]
  ├─ System prompt (~13K tokens, static across all portraits):
  │    • NERIN_PERSONA        (~42 lines, ~930 tok)
  │    • PORTRAIT_CONTEXT     (~782 lines, ~10,300 tok)
  │    • FACET_GLOSSARY       (~1,600 tok)
  ├─ User prompt (~300–800 tokens, dynamic):
  │    • trait summary, evidence (with deviation/strength/confidence), depth signal
  │    • full conversation history
  ├─ Retry policy: Effect.retry({ times: 2 }) = up to 3 attempts, exponential backoff
  └─ Empty-content guard: if thinking exhausts budget with no text → fail
  ↓
[On success: insert portrait row (static JSON). Frontend polls /portrait-status]
```

**Critical: single monolithic call.** The six-movement arc, spine, voice, craft rules, and coined phrases are all produced in ONE attention pass. No decomposition. No spine artifact. No streaming. No prompt caching.

**Estimated single-attempt cost:** ~$0.06–$0.08 (13.8K input + ~2K output at Sonnet 4.6 rates).
**Observed cost ($0.30–$0.40) implies average ~3× multiplier from retries + extended thinking overhead.**

### Problem Boundaries (Is/Is Not)

| Dimension | IS the problem | IS NOT the problem |
|---|---|---|
| **Where** | Portrait generator service — the single Sonnet call, its retry loop, its extended-thinking behavior, its lack of caching/streaming | ConversAnalyzer (Haiku, fast, cheap, separate path), conversation-stage LLM calls, facet scoring, trait derivation, DB reads |
| **When** | Every portrait generation, 100% of the time. Worse when extended thinking consumes the token budget (→ empty response → silent retry → cost/latency amplification) | Never — the slowness/cost/flakiness is structural, not intermittent |
| **Who** | Every user who reaches the portrait stage (currently synchronous, staring at spinner 2–3 min) | Users in the conversation stage (fast, cheap path); users who never reach portrait stage |
| **What** | (a) Monolithic single-shot generation across 13K tokens of prompt with one attention pass holding spine + 6 movements + voice + craft rules; (b) silent retries amplifying cost/latency; (c) no prompt caching despite 13K cacheable prefix; (d) no streaming despite user waiting; (e) no spine artifact, no verification step | Not the six-movement arc itself, not the facet/trait inputs, not Sonnet 4.6's raw capability, not the PORTRAIT_CONTEXT content in absolute terms (it's thoughtful — just overloaded) |

**Patterns emerging from the boundaries:**

1. **Every party-mode persona was pointing at something that turned out to be literally present in the code.** No caching (Maya), no decomposition (Priya), no parallelism (Alex — trivially, since there's only one call), no streaming (Rowan). None of them are hypothetical — all four gaps exist.
2. **This is not a single-cause problem.** It's five smallish, compounding issues: (i) no caching, (ii) retries invisible in metrics, (iii) extended thinking ungoverned, (iv) monolithic single-shot, (v) synchronous no-streaming UX. Each solvable independently; each improves a different success criterion.
3. **The cost structure is shaped by failure amplification, not by expensive compute.** Base cost per successful attempt is $0.06–$0.08. The gap to observed $0.30–$0.40 is retries + thinking overhead. Reducing the retry rate (or removing silent retries) is a bigger cost lever than changing the model.
4. **The spine bug has multiple plausible mechanisms converging on the same symptom** — cross-section interference (Priya), temperature=0.7 non-determinism, extended-thinking sampling variance, retry-produces-different-portrait (same prompt, different output due to sampling), and 13K-token prompt diluting attention on spine instructions. Root cause analysis in Step 3 will try to separate these.

### New Information from Step 2 Elicitation (2026-04-11)

Five critical clarifications from the user that reshape diagnosis:

1. **The 9-portrait analysis artifact was not saved.** Only the verbal verdict survives: *"the model had a prompt that had to manage too much cognitive things at the same time."* Independent source, but we cannot re-query it or re-cluster the results.

2. **No production retry metrics.** We cannot directly measure what fraction of the $0.30–$0.40 observed cost comes from silent retries vs. extended thinking overhead. Implied from arithmetic: ~3× multiplier over single-attempt base cost, but split between retries and thinking is unknown.

3. **Extended thinking was a deliberate quality lever, not an accident.** Historical calibration:
   - **Full thinking budget:** ~$1.00/portrait, "quality was superior and spine was the best"
   - **Reduced thinking (current):** ~$0.30–$0.40/portrait, spine inconsistent
   - **Inferred causal chain:** spine quality is produced by thinking budget in the current single-call architecture. Reducing thinking was Pareto-wrong: cut cost ~60% but destroyed the thing we cared most about. **This is the diagnostic key.**

4. **Temperature 0.7 is just a default.** No intentional calibration — lowering it to 0.3–0.5 is a free consistency knob.

5. **Story 8.7's rejection of algorithmic spine extraction is revisitable.** User's original framing mentioned preferring "deterministic and simple" to over-engineering. **Refined 2026-04-11:** the user's actual simplicity rule is *"don't replace an LLM call by a huge template or pipeline computation that mimics what an LLM is good at."* Multiple LLM calls (3–4 is fine) are acceptable as long as each call does something only an LLM can do well. This rule **rejects** template-based or deterministic reimplementations of reasoning tasks, but **permits** multi-stage LLM pipelines with clear per-stage jobs. Director-model architectures therefore become eligible again — the original concern was about building pipeline infrastructure, not about LLM-call count.

### Convergence Observation

Three independent sources now point at the same diagnosis:

| Source | Verdict |
|---|---|
| Party-mode persona (Priya, storytelling director) | "Asking one attention pass to hold spine + 6 movements + voice + craft rules is a mathematical mismatch" |
| 9-portrait analysis (verbal memory) | "The model had a prompt that had to manage too much cognitive things at the same time" |
| Code structure (Step 2 map) | Single 13K-token monolithic call producing spine + 6 movements + voice + coined phrases in one attention pass |
| Historical cost/quality calibration (answer #4) | Spine quality proportional to thinking budget in single-call architecture — the knob that was lowered to cut cost *was* the spine knob |

Four convergent signals pointing at: **"single-call cognitive overload, where thinking was the compensator and reducing thinking collapsed the spine."**

### Root Cause Analysis

**Correction note (2026-04-11):** An earlier version of this section, based on a subagent report that was not primary-source verified, claimed extended thinking was currently enabled in the portrait generator. **That was wrong.** Direct code inspection of `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts:68-72` shows `ChatAnthropic` is instantiated with only `model`, `maxTokens`, and `apiKey` — no `thinking` parameter. The stale code comment at line 59 and the `extractTextContent` helper + empty-content guard are vestigial from a previous thinking-enabled mode. The analysis below is the corrected version.

**Method:** Two targeted Five Whys chains (Chain A: spine inconsistency; Chain B: cost inflation). Fishbone deferred.

**Verified current-state facts (from primary-source code inspection):**
- Model: `claude-sonnet-4-6`, `maxTokens: 8000`, **no extended thinking enabled** (`portrait-generator.claude.repository.ts:68-72`)
- Temperature: **config value `0.7` is never passed to `ChatAnthropic`** — real temperature = LangChain default (`portrait-generator.claude.repository.ts:68-72` vs `app-config.live.ts:57`)
- Retries: `Effect.retry({ times: 2 })` = up to 3 total attempts, exponential backoff (`generate-full-portrait.use-case.ts:112`)
- **Retry failures are silent** — no per-attempt logging, only final failure logged (`generate-full-portrait.use-case.ts:115-121`)
- No prompt caching. No streaming. No per-call token or retry metrics.

**Chain A (spine inconsistency) — root cause (still valid after correction):**
> The portrait pipeline conflates "decide the spine" and "write the prose" into a single attention pass. The 9-portrait analysis verdict ("too much cognitive load in one prompt"), Priya's party-mode reasoning, and the historical arc reported by the user all converge independently on this diagnosis. **Historical evidence (the key clue):** when extended thinking was previously enabled, spine was consistently great at ~$1/portrait. Thinking was subsequently removed to cut cost, but the pipeline was never redesigned to compensate — the "produce the spine" responsibility was silently left unowned. Current spine inconsistency is the signature of that unowned responsibility: no component has been assigned the job of deciding what the portrait is about before the prose is written.

**Chain B (cost inflation) — resolved with new data from user (2026-04-11):**
> User-reported: per-call input is ~**50K tokens**, and "retries fire when the user comes back to the page."
>
> Updated cost model:
> - Single attempt: 50K input × $3/M + 2.5K output × $15/M = **~$0.19 per successful attempt**
> - Observed $0.30 / $0.19 = **~1.6× multiplier** → consistent with retries firing on roughly 30–60% of portraits
>
> **Two-layer retry cascade identified:**
> 1. **Silent internal retries:** `Effect.retry({ times: 2 })` in `generate-full-portrait.use-case.ts:112` → up to 3 attempts per worker run, no per-attempt logging. On final failure, `failedAt` row inserted.
> 2. **User-triggered retries:** `retryPortrait` handler (`portrait.ts:65-74`) spins up a fresh worker when the user revisits the page and sees a `failedAt` portrait. Another 1–3 silent attempts run inside that new worker.
>
> Worst case: **up to 6 LLM calls per portrait** ($1.14 worst case). Most portraits don't hit this ceiling, but the user's observation that retries visibly fire at page revisit implies **first-attempt failure rate is non-trivial** — enough that `failedAt` rows are being seen routinely.
>
> **Input composition finding:** with 50K input and only ~13K from the static prefix, **conversation history + evidence = ~37K tokens = the dominant input-cost contributor**. This reframes the caching/optimization priorities: prompt caching on the static prefix saves only ~25% of input cost (not 70%). The real input-cost lever is conversation history size, not character bible modules.
>
> **Still blocked on observability for:**
> - Actual first-attempt failure rate (30%? 60%? 90%?)
> - What specifically causes first-attempt failures (timeout? API error? empty-content guard? something else?)
> - Whether `response.content` is coming back as string or as array with thinking blocks (tells us definitively whether LangChain is silently enabling thinking)

### Refined Primary Root Cause

> The portrait pipeline previously used extended thinking as the implicit spine-producer. Thinking was removed to cut cost, but the pipeline was never redesigned to compensate — the "produce the spine" responsibility was silently left unowned. **Spine inconsistency is the signature of that unowned responsibility.** Cost is a secondary symptom whose mechanism is not yet measurable — it could be retries, oversized conversation histories, hidden LangChain defaults, or a combination — and naming it requires observability that doesn't exist yet.

### Dead / Vestigial Code Findings (incidental)

Surfaced during root cause verification. Not themselves root causes, but worth fixing for hygiene:

1. `portrait-generator.claude.repository.ts:59` — comment "with adaptive extended thinking" contradicts actual code.
2. `portrait-generator.claude.repository.ts:42-54, 129-136` — `extractTextContent` helper and empty-content guard serve a thinking-enabled mode that is no longer wired up.
3. `app-config.live.ts:57` — `portraitTemperature: 0.7` defined but never consumed (never passed to `ChatAnthropic`).
4. `app-config.live.ts:82-84` — duplicate `portraitGeneratorModelId` config shadowing `portraitModelId` at line 55.

### System Dynamics

```
 (hard input / ambiguous OCEAN)
          │
          ▼
  [thinking budget expands]  ◄─────────────┐
          │                                │
          ▼                                │
  consumes prose token budget              │
          │                                │
          ▼                                │
  empty-content failure ─► silent retry ───┘   (cost amplifier loop)
          │
          ▼
  success (late) ─► opaque 2–3 min wait (latency symptom)

 (easy input)
          │
          ▼
  [thinking budget compresses]
          │
          ▼
  less spine reasoning performed
          │
          ▼
  spine flakes on the output  (quality symptom)
```

One variable — the uncontrolled thinking budget — drives all three symptom loops (cost / latency / quality). Classic "single knob doing too many jobs" pattern.

### Contributing Factors (ranked by leverage, corrected after Chain B collapse)

| Rank | Factor | Leverage | Cost to fix |
|---|---|---|---|
| 1 | **No owner for spine responsibility** — previously produced by thinking, now produced by nothing | High — the primary quality driver | Medium |
| 2 | **No per-call observability** (tokens, retries, response content structure) | Meta — **blocks cost diagnosis entirely**, must come first | Low |
| 3 | **No prompt caching on ~13K-token static prefix** | Medium-High — pure cost win, independent of root cause | Low |
| 4 | **Silent retries** (no per-attempt logging, failure mode unknown) | Medium — cost + latency — depends on retry rate being measured | Low |
| 5 | **No streaming / progressive reveal** | Medium — perceived latency only | Medium |
| 6 | **Dead code** (stale thinking comments, unused temperature config, duplicate model ID config) | Low — hygiene, not root cause | Trivial |

**Reordering rationale:** Observability (#2) jumped up the priority list because without it we cannot falsify any cost hypothesis. Caching (#3) is now *above* retry work because it's unambiguously beneficial regardless of what's causing the cost, whereas retry work depends on first knowing whether retries are actually firing.

---

## 📊 ANALYSIS

### Driving Forces (pushing toward solution)

- **Clear diagnostic convergence** on spine root cause (4 independent signals align)
- **User preference for simplicity** (from saved memory) — drives toward minimal 2-stage pipeline
- **Backwards compatibility not required** — can invalidate prior portraits
- **Concrete testable hypothesis:** reintroduce thinking *only* for spine extraction (smaller, cheaper)
- **Multiple independent cost levers** (caching, retry elimination, conversation compression, model tiering)
- **Failure-amplification retry pattern identified** — eliminating silent retries is a free cost win
- **Observability is cheap to add** — unblocks every cost decision
- **`_llm-test-output/` corpus** of 25 portraits exists for rubric calibration

### Restraining Forces (pushing against change)

- **User's fear of over-engineering** — any solution >2 LLM calls will meet resistance (director-model effectively out)
- **No portrait quality rubric exists** — Step 6 evaluation bottleneck
- **No production observability** — blocks honest cost diagnosis
- **First-attempt failure root cause unknown** — different causes → different fixes
- **Historical Story 8.7 decision** rejected algorithmic spine extraction (needs explicit revisit)
- **Conversation history is 37K tokens** — dominant input-cost driver, non-trivial to compress
- **PORTRAIT_CONTEXT is 782 lines of carefully tuned creative guidance** — any abandonment is high-risk
- **LangChain `ChatAnthropic` is a level of indirection** — may be hiding behaviors (silent thinking, retry, prompt construction)

### Constraint Identification (Theory of Constraints)

**Primary bottleneck:** **Decision-grade information, not compute.** Every major solution decision is gated on data we don't have — first-attempt failure rate, quality rubric, real cost driver, before/after measurement.

**Critical path for any improvement:**

```
1. Add observability (tokens, retries, response structure)     ┐
2. Build portrait quality rubric skill                          ├─ prerequisites
3. Regenerate 9-portrait baseline with the rubric              ┘
       ↓
4. Diagnose first-attempt failure mode from new logs
       ↓
5. Choose solution(s) based on actual data
       ↓
6. Implement, measure, compare to baseline
```

Prerequisites 1–3 are valuable regardless of which solution we pick — they should start immediately.

### Key Insights

1. **The binding constraint is information, not architecture.** Highest-leverage action = instrumentation + rubric, not code changes.
2. **Failure-amplification is cheap to investigate and potentially worth more than any model/architecture change.** Reducing first-attempt failure from ~50% → ~10% drops observed cost from $0.30 → $0.21 with zero architectural change.
3. **Conversation history dominates input cost** (37K of 50K tokens). The big cost win lies in attacking conversation size, not character bible caching.
4. **Simplicity preference + clear spine diagnosis converge on one architectural direction:** a minimal 2-stage pipeline (spine step → prose rendering step) honors both the root cause fix and the "no over-engineering" guardrail.
5. **LangChain is a suspect, not just a library.** One-off investigation of "what is LangChain actually sending to Anthropic" is a cheap experiment with high diagnostic value.

---

## 💡 SOLUTION GENERATION

### Methods Used

- **Morphological Analysis** — systematic exploration across dimensions (instrument / cache / decompose / stream / swap model / swap library)
- **Assumption Busting** — for Tier 3 options (what if user doesn't have to wait? what if we don't need raw conversation?)
- **Synectics / analogy** — director-as-constraint-generator metaphor from party-mode (Priya) informed Tier 2 design

### Generated Solutions — Four Tiers

Solutions are organized in four tiers and are **not mutually exclusive**. Recommended path is a stack across tiers.

#### Tier 0 — Observability & Hygiene (prerequisites, MUST come first)

1. **Per-attempt token logging** — tokens in/out, model, attempt #, duration, failure reason. Unblocks all cost diagnosis. ~1h.
2. **Log raw `response.content` structure** — answers the LangChain-silent-thinking question definitively. 15 min.
3. **Remove dead code** — stale thinking comment, vestigial `extractTextContent`, unused `portraitTemperature`, duplicate `portraitGeneratorModelId`. ~1h.
4. **Build `/portrait-rubric` Claude Code skill** — 6-dimension rubric (spine, arc, coined phrase, self-compelling, voice, emotional stake). Applied to existing `_llm-test-output/` corpus as frozen baselines. ~Half day.
5. **Cost guard at retry boundary** — fail fast if a worker run exceeds a cost ceiling. Caps worst case. ~1h.

#### Tier 1 — Single-Lever Optimizations (cheap wins, independent)

6. **Prompt caching on 13K static prefix** — ~10–15% input cost cut. ~2h.
7. **Drop to direct `@anthropic-ai/sdk` for portrait call** — enables #6 and future features, gives transparent observability. Half-day bounded refactor.
8. **Investigate & fix first-attempt failure mode** — once observability exists, read logs, find actual cause, fix at source. Potentially the biggest win: eliminating retry multiplier drops $0.30 → $0.19. 1–2 days.
9. **Conversation compression / consolidated user summary** — replace 37K raw conversation with ~5K Haiku-authored structured summary. **~48% cost cut** — largest single lever. 1–2 days. Medium risk (lossy). **Upgraded priority (2026-04-11):** user confirmed they want a consolidated user summary for *other features* too (not just portrait). This makes it a **cross-cutting asset**, not just a portrait optimization. Becomes a likely default regardless of architecture choice.
10. **Calibrate temperature** — currently dead in code. Wire up and set ~0.3–0.5. 30 min.
11. **Anthropic Batch API** — 50% discount. ⚠ **Requires fully-async UX with notification** (user closes tab, gets email/push when ready). Fundamentally incompatible with the current "user waiting on a spinner" flow. User has indicated openness (2026-04-11) if the cost cut is worth it. If pursued, pairs naturally with Tier 3 #16 (anticipation UX). **Treat as conditional on a UX decision, not as a standalone engineering choice.** 1 day of engineering, but the UX shift is the real work. 1 day.

#### Tier 2 — Architectural Rewrites

**Revised simplicity rule (from 2026-04-11 user clarification):** The user's "no over-engineering" rule is about *not reinventing LLM reasoning in code*. Multiple LLM calls (3–4 is fine) are acceptable as long as each call does something only an LLM can do well. ❌ writing template/pipeline code that mimics LLM reasoning. ✅ adding more LLM calls that each have a clear job.

**Core design principle (from user idea C):** The spine artifact is a **prescriptive brief, not a one-liner.** It includes: narrative thread, beat-by-beat arc for the 6 movements, voice notes per movement, coined-phrase targets, ordinary-moment anchors, the unresolved cost that must appear in Tension. This prescriptiveness is what makes prose rendering a *constrained execution task* (and therefore potentially cheaper-model-friendly).

12. **⭐ Two-Stage Pipeline family: Spine Brief → Prose Renderer** *(PRIMARY HYPOTHESIS)*

    **Base architecture:**
    - **Stage A — Spine Brief Extractor:** Inputs: facet scores, compressed evidence summary (from Tier 1 #9), no raw conversation. Output: structured JSON-shaped spine brief (thread, lens, 6-beat arc with per-movement voice notes, 2–4 coined-phrase targets, ordinary-moment anchors, unresolved cost). Internal self-validation (user's idea A — "does the brief have all required structural fields? if not, revise once"). **Single LLM call with bounded self-check, not a separate verification LLM call** — eliminates blind retries by replacing them with targeted revision. Model: Sonnet 4.6 with explicit small thinking budget (~2048 tok) — reintroduce thinking where it produces value. Estimated: ~$0.03/call, ~15s latency.
    - **Stage B — Prose Renderer:** Inputs: spine brief + PORTRAIT_CONTEXT + compressed evidence. Output: full 6-movement portrait prose. Model: variable (see variants). Estimated: $0.01–$0.09/call.

    **Variants to test (all share the same Stage A; only Stage B differs):**

    - **12-A: Sonnet prose** (safe default) — Stage B on Sonnet 4.6, no thinking, temp 0.5. Total ~$0.12/call. Highest expected voice quality. *The conservative pick.*

    - **12-B: Haiku prose** (user's idea B — inverted tiering) — Stage B on Haiku 4.5, leveraging the prescriptive spine brief to compensate for smaller model capability. Total ~$0.04/call. **~66% cost cut vs 12-A.** Risk: voice may feel less nuanced. *The aggressive cost pick — only viable if the spine brief is genuinely prescriptive enough.*

    - **12-C: Sonnet prose with per-movement streaming** — Stage B as one Sonnet call, but streamed movement-by-movement to the frontend for progressive reveal. User sees Movement 1 within ~10s. Total ~$0.12/call. *The UX pick — meets the "≤10s to first content" success criterion.*

    **12-D (parallel per-movement) DROPPED 2026-04-11** — user accepted pushback on voice coherence risk; parallel per-movement calls are off the table.

    **Note on streaming:** streaming Stage B's output is *orthogonal* to the model choice. It can be stacked on 12-A or 12-B equivalently — same quality, same cost, just different frontend integration cost (~2–3 days of frontend work to render movements progressively). Treat streaming as an independent +"latency polish" add-on, not a separate variant.

13. ~~**12-E**~~ (obsolete — depended on 12-D)

14. **Three-stage with explicit verification LLM call** (user's idea A as separate stage, not internal self-check) — Spine → (separate) Verify → Prose. More transparent but adds one LLM call. Slightly higher cost than internal self-validation, slightly more observable. Fallback if the internal self-check in 12's Stage A proves unreliable. ~$0.15/call.

15. ~~**Four-stage director-model** — rejected as reinventing what an LLM already does well~~ *(rejected per updated simplicity rule — the spine-brief-as-prescriptive already provides director-level constraint without needing a separate director LLM call)*

#### Tier 3 — Wild / Assumption-Busting

16. **Reframe UX as anticipation, not wait** — keep generation slow; replace spinner with ambient narrative copy and notification. Kills latency problem by not fighting it.
17. **Preview + full reveal** — Haiku-generated <5s Wonder preview, full portrait backgrounds in behind. Decouples first-content from total latency.
18. **Fine-tune a small model on Nerin's voice** — long-term play. 6-month horizon.
19. **Evidence-only input, no raw conversation** — full commitment to #9. Biggest cost lever in the solution space (30K+ tokens saved). Quality bet.
20. **Cross-provider A/B: Gemini Stage A + Claude Stage B** — tests the "not locked to Claude" relaxation.

### Creative Alternatives Considered and Excluded

- **N-step agent loop with reflection/critique** — violates simplicity preference
- **Vector retrieval for similar past portraits** — violates personalization, adds infra complexity
- **Switching Stage B to GPT-5 or open-source** — voice work is Claude's strongest dimension, likely quality regression

---

## ⚖️ SOLUTION EVALUATION

### Evaluation Criteria (derived from Step 1 success criteria)

| Criterion | Weight |
|---|---|
| Spine consistency (root cause fix) | ⭐⭐⭐⭐⭐ |
| Quality non-regression | ⭐⭐⭐⭐⭐ |
| Cost per portrait | ⭐⭐⭐⭐ |
| Measurement feasibility | ⭐⭐⭐⭐ |
| Total latency | ⭐⭐⭐ |
| Effort / reversibility | ⭐⭐⭐ |

### Solution Analysis Key Insight

> No Tier 2 solution can be properly evaluated until Tier 0 is in place. Tier 0 is not one option among many — it's a **precondition** for every other evaluation. Step 6's output is therefore a **sequenced stack**, not a single winner.

### Recommended Solution — Phased Stack

**Phase 0 — Observability & Hygiene** (1–2 days)
- Tier 0 items #1–5 (token logging, raw response logging, dead code removal, `/portrait-rubric` skill, cost guard)
- Exit criterion: can measure spine consistency + retry rate

**Phase 1 — Cheap wins** (2–3 days)
- Tier 1 #7 (direct `@anthropic-ai/sdk`)
- Tier 1 #10 (wire up temperature, 0.3–0.5)
- Tier 1 #6 (prompt caching on 13K prefix)
- Tier 1 #8 (diagnose + fix first-attempt failure mode)
- Exit criterion: retries drop, observed cost drops $0.30 → ~$0.15

**Phase 2 — Conversation compression** (1–2 days)
- Tier 1 #9 (Haiku-authored consolidated user summary, cross-cutting asset)
- Exit criterion: input tokens drop 50K → ~15–20K; cost drops ~$0.15 → ~$0.08

**Phase 3 — Architectural fix (root cause)** (2–3 days)
- Tier 2 #12-A: Two-stage Spine Brief → Sonnet Prose Renderer
- Stage A: Sonnet 4.6 with explicit small thinking budget (~2048 tok), produces prescriptive spine brief (thread, 6-beat arc, voice notes, coined-phrase targets, unresolved cost), with internal self-validation
- Stage B: Sonnet 4.6, no thinking, temp ~0.5, renders prose from brief + PORTRAIT_CONTEXT + compressed evidence
- Exit criterion: rubric shows spine consistency fixed with no voice regression

**Phase 4a (optional upside) — Cost push** (1 day + testing)
- Tier 2 #12-B variant: Haiku prose for Stage B
- Only if rubric validates voice quality is preserved

**Phase 4b (optional upside) — UX polish** (2–3 days)
- Tier 2 #12-C: streaming Stage B output for progressive reveal
- Meets time-to-first-content ≤10s criterion

### Cost/Latency Projection Through the Stack

| Phase | Expected cost/portrait | Expected latency (total) | Expected first-content |
|---|---|---|---|
| Baseline (current) | ~$0.30 | ~2–3 min | ~2–3 min |
| After Phase 1 | **~$0.15** | **~60s** | ~60s |
| After Phase 2 | **~$0.08** | ~45s | ~45s |
| After Phase 3 | ~$0.13–$0.14 | ~55–65s | ~55–65s |
| After Phase 4a | **~$0.05–$0.07** | ~35–45s | ~35–45s |
| ~~After Phase 4b~~ | _(cut 2026-04-11)_ | _(cut)_ | _(cut)_ |

**Note on Phase 3 cost increase:** the move from two-stage to three-stage (adding the Verifier + possible extraction retry) adds ~$0.005–$0.01 per portrait on average. This is the cost of independent quality gating — worth it for the spine-consistency guarantee.

### Success Criteria Check

- **Latency ≤ 1 min** — met at Phase 1
- **Cost ≤ $0.25** — met at Phase 1, exceeded Phase 2+
- **Spine consistency** — fixed at Phase 3 (the architectural change, which is the point)
- **Quality non-regression** — gated on the rubric at every phase
- **Time-to-first-content ≤ 10s** — only at Phase 4b (optional)

**Hard success criteria met by end of Phase 3. Phases 4a and 4b are upside.**

### Recommended Solution — one line

> Phased stack: observability → hygiene/caching/retry-fix → conversation compression → two-stage pipeline with Sonnet-Sonnet (12-A). Evaluate each phase against the rubric. Commit to Haiku-prose (12-B) or streaming (12-C) only after 12-A ships and is measured.

### Rationale

1. **Starts with what cannot be evaluated without** (Tier 0 observability).
2. **Stacks cheap reversible wins first** — if any gets us to target, we stop early.
3. **Addresses root cause at Phase 3, not Phase 1** — only architect after cheap wins are measured.
4. **Phases 4a/4b are explicitly optional** — upside, not required for success.
5. **Every phase has a bounded exit criterion** — missing criterion = stop and diagnose, not push on.
6. **Recommends 12-A (Sonnet-Sonnet), not 12-B (Haiku prose)** — voice risk is real and unmeasurable in advance. Ship 12-A, validate, then *test* 12-B as a cost-down variant in Phase 4a.

### What is NOT recommended and why

- **12-B as Phase 3 default** — voice risk unmeasurable in advance
- **#14 separate verification LLM call** — internal self-validation in Stage A is simpler and cheaper. #14 is a fallback if internal self-check proves unreliable.
- **#11 Batch API** — conflicts with current user-waiting UX. Only revisit if UX pivots to async-with-notification.
- **Streaming before Phase 3** — streaming a broken spine is worse than waiting for a good one. Fix root cause first.

### Persistent Assumptions and Risks

- **Phase 1 #8** assumes first-attempt failures are fixable. If the cause is API rate-limiting or infrastructure timeouts, cost savings are lower.
- **Phase 2** assumes compression doesn't lose critical nuance. Rubric catches it; rollback if regression detected.
- **Phase 3** assumes Sonnet + 2048-tok thinking budget produces better spines than no-thinking. Historical evidence supports this direction, but the specific budget is untested.
- **Test corpus representativeness** — `_llm-test-output/` may not match production input distribution. Rubric calibration may drift once real users hit the system.

---

## 🚀 IMPLEMENTATION PLAN

### Strategy

Phased rollout with hard exit gates. Each phase must hit its exit criterion before the next starts. Phase 4b (streaming) is **out of scope** per 2026-04-11 user decision. Phase 4a (Haiku prose) is optional upside. Responsible party: Vincent (solo).

### Phase 0 — Observability & Hygiene (1–2 days)

**Goal:** measure before changing anything.

- **0.1** `portrait-generator.claude.repository.ts` — add structured logging around `model.invoke([...])`: `tokens_in`, `tokens_out`, `model_id`, `attempt_number`, `duration_ms`, `failure_reason`
- **0.2** same file — log `typeof response.content` + block-type set. **Answers the LangChain silent-thinking mystery.**
- **0.3** `generate-full-portrait.use-case.ts` — log each retry attempt (not just final failure)
- **0.4** same file — add `PORTRAIT_COST_CEILING_USD` cost guard at retry boundary
- **0.5** same file + `app-config.live.ts` — remove dead code (stale comments, vestigial helper, unused `portraitTemperature`, duplicate `portraitGeneratorModelId`)
- **0.6** `.claude/skills/portrait-rubric/` — build `/portrait-rubric` skill. **Seven dimensions**, 1–5 Likert, Claude-as-judge:
    1. **Insight beneath observation** — does the portrait name something the reader likely hadn't named themselves? Is the spine a reading, not a summary? *(Load-bearing dimension for the inferential-depth corrective.)*
    2. **Spine coherence** — structural unity of the reading across the arc
    3. **Six-movement arc fidelity** — does the arc land each of the 6 beats (Wonder → Compulsion) distinctly?
    4. **Coined-phrase quality** — are the coined phrases specific, portable, prospective?
    5. **Self-compelling** — does the reader want to return to this portrait unprompted?
    6. **Voice** — Nerin's confidant tone; warmth-before-depth; no clinical, flattery, or hedging
    7. **Emotional stake** — does the portrait matter to the reader, not just interest them?
    Rubric prompt must define each dimension concretely and provide 1/3/5 anchoring examples.
- **0.7** `_llm-test-output/*.md` — apply rubric to 25-portrait corpus; save as frozen baseline in `_bmad-output/portrait-rubric-baseline-2026-04-11.json`

**Exit criterion:** one real portrait generated; logs reveal token counts, retry behavior, response structure. Rubric runs end-to-end. Baseline exists.

**Rollback:** additive-only, zero user risk.

### Phase 1 — Cheap Wins (2–3 days)

- **1.1** `portrait-generator.claude.repository.ts` — refactor to `@anthropic-ai/sdk` (portrait call only; LangChain stays elsewhere). Keep old layer as `PortraitGeneratorLangchainRepositoryLive` behind feature flag for one release cycle
- **1.2** same file + config — wire up `portraitTemperature` (currently dead), default 0.5
- **1.3** same file — add `cache_control: { type: "ephemeral" }` on system prompt; verify via `usage.cache_read_input_tokens`
- **1.4** `packages/infrastructure/package.json` — add `@anthropic-ai/sdk`
- **1.5** `generate-full-portrait.use-case.ts` — read Phase 0 logs, diagnose + fix first-attempt failure mode at source
- **1.6** same file — reduce `Effect.retry({ times: 2 })` → `{ times: 1 }` once 1.5 is effective

**Exit criterion:** cost ≤ $0.15/portrait; first-attempt failure rate < 10%; rubric scores no regression vs baseline.

**Rollback:** feature-flag swap to revive LangChain layer.

**PDCA checkpoint:** if Phase 1 alone hits cost target *and* rubric holds, consider stopping here and going straight to Phase 3 (skipping Phase 2). The cheap-wins-first principle applies.

### Phase 2 — Conversation Compression (1–2 days)

**Goal:** cut input tokens 50K → 15–20K; build cross-cutting `UserSummary` asset.

**Design note (2026-04-11, user clarification):** `UserSummary` must preserve **verbatim user quotes**, not just abstracted themes. Losing specific user language is the failure mode — it's the thing that lets coined phrases feel coined and anchors feel specific. Abstraction is cheap only if it's not *lossy* on the things prose needs to reach for.

- **2.1** `packages/domain/src/types/user-summary.ts` (new) — `UserSummary` type:
    ```typescript
    interface UserSummary {
      themes: string[];                      // abstracted patterns

      notableMoments: Array<{                // ~10–15 entries, narrative framing
        description: string;                 // natural-language framing
        verbatim?: string;                   // literal quote if user said it
        context: string;                     // brief situational framing
      }>;

      // CRITICAL: dedicated quote bank, SEPARATE from notableMoments.
      // Target 20–40 entries. Haiku is instructed to OVER-preserve specific
      // user language: any phrase that feels specific, unusual, or personally
      // coded is a candidate. Stage A draws from this pool when building the
      // spine brief — it's the primary mechanism for plumbing literal user
      // language through to prose rendering without RAG infrastructure.
      quoteBank: Array<{
        quote: string;                       // verbatim user text (≤ 40 words)
        themeTag: string;                    // which theme this relates to
        context: string;                     // brief situational framing
      }>;

      voiceCues: string[];                   // how they speak, metaphors they reach for
      unresolvedTensions: string[];          // things resisting easy reframing
    }
    ```
    Target size: ~10–12K tokens serialized. **The `quoteBank` is the load-bearing field — it is the minimal-viable alternative to RAG.**
- **2.2** `packages/domain/src/repositories/user-summary-generator.repository.ts` (new) — Effect `Context.Tag`
- **2.3** `packages/infrastructure/src/repositories/user-summary-generator.claude.repository.ts` (new) — Haiku 4.5 implementation via direct SDK. Prompt explicitly instructs: *"produce a broad quote bank. Err on the side of over-preservation. Any phrase that feels specific, unusual, personally coded, or uses imagery the user reached for organically is a candidate. Do not paraphrase quote bank entries — they must be verbatim. Target 20–40 entries."*
- **2.4** `packages/infrastructure/src/db/drizzle/schema.ts` + new migration — persist `user_summary` (new table or column on `assessment_result`)
- **2.5** `apps/api/src/use-cases/complete-assessment.use-case.ts` (or equivalent completion handler) — **generate `UserSummary` at assessment-completion time**, not at portrait-generation time. The summary is a property of the user/assessment, not of the portrait. Pre-computing removes a serial Haiku call from the portrait critical path and makes the summary immediately available to other features. *(Confirmed 2026-04-11.)*
- **2.6** `generate-full-portrait.use-case.ts` — read the pre-computed `UserSummary` from the assessment result; fail fast if missing (should not happen under normal flow)
- **2.7** `portrait-generator.claude.repository.ts` — drop raw conversation messages; inject `UserSummary` instead

**Exit criterion:**
- Input tokens ≤ 20K
- Cost ≤ $0.08/portrait (post-Phase-2 + post-Phase-1 stack)
- Rubric holds on all dimensions
- **`quoteBank` contains ≥20 verbatim entries on average across the test corpus**
- **Manual audit:** sample 3–5 UserSummary outputs and verify the quote bank contains specific, non-paraphrased user language. Half-hour check. Catches "Haiku is quietly abstracting" at source before Phase 3 depends on it.

**Rollback:** feature flag for raw-messages code path for one release cycle.

**PDCA:** ANY rubric dimension dropping > 0.5 points triggers rollback. If coined-phrase dimension specifically regresses, the diagnosis is "quote bank is not preserving enough user language" — revise the Haiku generator prompt and re-run before proceeding to Phase 3.

**Escape hatch if Phase 2 repeatedly fails:** if the quote-bank approach proves insufficient after 2 iterations on the Haiku prompt, fall back to **Option 3** (Stage A reads raw conversation directly). This raises per-portrait cost to ~$0.24 but eliminates the abstraction failure mode entirely. Document as accepted trade-off. RAG infrastructure remains out of scope.

### Phase 3 — Architectural Fix: Three-Stage Pipeline (3–4 days)

**Goal:** fix the root cause. Spine becomes an owned, prescriptive, inspectable artifact.

**Design principle (2026-04-11, user clarification):** **Stage B is a pure renderer.** It receives `SpineBrief` + `PORTRAIT_CONTEXT` only — **NOT `UserSummary`, NOT raw conversation**. Everything load-bearing about the user must be packed into the brief by Stage A. This forces the brief to be rich enough to stand alone, which is a cleaner contract: Stage A compresses the user into a self-sufficient brief; Stage B renders that brief in Nerin's voice without any user-state knowledge of its own. If Stage B feels under-informed, the fix is to enrich the brief schema, not to give Stage B more context.

**Pipeline shape (confirmed 2026-04-11):** Three-stage with external verification and bounded retry loop. Stage A extracts, a separate Verifier (Haiku) scores the brief against structural + specificity criteria, and if verification fails, Stage A re-extracts once with gap feedback. Max 2 extraction attempts per portrait. External verification replaces Stage A's internal self-check — asking the model to grade its own work is exactly the failure pattern we're trying to escape; a separate model with a different prompt gives independent judgment.

**Design principle II — the spine is an inference, not a summary (2026-04-11 user correction):** The spine's job is to name what the user is doing that they *don't know they're doing*. The portrait's "feel seen" moment comes from the reader encountering a reading of themselves they hadn't articulated. If the brief only summarizes what the user explicitly said, the spine is surface-level and the portrait will not land. The `insight` field in the brief schema exists to force Stage A to do the interpretive work *explicitly*, not as an emergent side-effect.

- **3.1** `packages/domain/src/types/spine-brief.ts` (new) — `SpineBrief` schema (inference-first, rich, user-grounded):
    ```typescript
    interface SpineBrief {
      // THE CENTRAL INFERENCE — load-bearing field, everything else serves this.
      insight: {
        surfaceObservation: string;    // what the user explicitly says/does
        underneathReading: string;     // the pattern the portrait claims is driving them
        bridge: string;                // reasoning from surface to underneath, citing
                                       // specific moments/quotes from the quoteBank
        falsifiable: boolean;          // is the underneath a specific claim that COULD be wrong?
                                       // "she contains multitudes" = false (too vague)
                                       // "she's testing whether her judgment can be trusted" = true
      };

      thread: string;                  // one-sentence compression of the insight:
                                       // "she X, but really she Y"
      lens: string;                    // the framing that makes the underneath visible

      arc: {                           // 6 beats — EACH must serve the insight, not decorate it
        wonder: MovementBeat;
        recognition: MovementBeat;
        tension: MovementBeat;
        embrace: MovementBeat;
        reframe: MovementBeat;
        compulsion: MovementBeat;
      };

      coinedPhraseTargets: Array<{
        phrase: string;                // should echo the underneath, not the surface
        rationale: string;
        echoesIn: MovementName[];
      }>;

      ordinaryMomentAnchors: Array<{
        moment: string;
        verbatim?: string;             // literal user quote (plumbed from quoteBank)
        useIn: MovementName;
        supportsInsight: boolean;      // is this moment evidence for the underneath,
                                       // or just a nice detail?
      }>;

      unresolvedCost: {
        description: string;           // specific, un-reframed
        verbatim?: string;
      };

      voiceAdjustments: Array<{        // pending audit — may drop per Priya's observation
        movement: MovementName;
        tone: string;
      }>;
    }

    interface MovementBeat {
      focus: string;                   // what this movement accomplishes FOR THE INSIGHT
      openingDirection: string;
      keyMaterial: string[];
      endState: string;                // where this beat leaves the reader re: the insight
    }
    ```

    **Three load-bearing fields:**
    1. `insight.underneathReading` — the interpretive claim that is the whole point of the spine
    2. `insight.bridge` — the reasoning that grounds the claim in specific user material (not handwave)
    3. Every `verbatim?` field — what lets prose echo real user language without paraphrasing

- **3.2** `packages/domain/src/constants/nerin/spine-extractor-prompt.ts` (new) — Stage A prompt. Responsibility: read `UserSummary` (including `quoteBank`) + facet scores, produce a `SpineBrief` JSON. **Explicit inferential instruction (new, critical):** *"Your job is not to summarize the user — it's to surface what they're doing that they don't know they're doing. Read the themes, quotes, and moments. Notice what they say versus what their behavior implies. The `insight.underneathReading` must contain a claim about the user that the user would NOT have articulated themselves — a claim that makes them feel **recognized**, not **described**. If you find yourself writing surface-level observations, push harder: what pattern drives the surface? The test is whether the reader would react with 'yes I told her that' (surface, fail) or 'oh — I didn't know that's what I was doing' (underneath, pass)."* **No internal self-check** — external Verifier owns that role.
- **3.3** `packages/domain/src/types/spine-verification.ts` (new) — `SpineVerification` type:
    ```typescript
    interface SpineVerification {
      passed: boolean;
      missingFields: string[];        // structural gaps (e.g., "tension.endState is empty")
      shallowAreas: string[];         // specificity gaps (e.g., "thread is generic", "no verbatim anchors")
      overallScore: 1 | 2 | 3 | 4 | 5;
      gapFeedback: string;            // specific revision guidance for re-extraction
    }
    ```
- **3.4** `packages/domain/src/constants/nerin/spine-verifier-prompt.ts` (new) — Verifier prompt. Input: a `SpineBrief` JSON (and nothing else — verifier does NOT see UserSummary, quoteBank, or raw conversation; it judges the brief's internal consistency, specificity, and inferential depth). Mechanical checklist:
    1. **Structural:** all required fields present and non-trivial
    2. **Specificity:** `thread` references concrete user material, not generic traits
    3. **Coined phrases:** ≥2, each with clear rationale and ≥2 movements in `echoesIn`
    4. **Verbatim presence:** ≥1 `ordinaryMomentAnchors` uses a `verbatim` field — flag "no verbatim anchors — prose may feel generic" if none
    5. **Unresolved cost:** named concretely AND not reframed into a positive within the brief
    6. **Per-movement distinctness:** each movement's `focus` is not interchangeable with another movement's `focus`
    7. **Insight distinctness** *(new):* `insight.surfaceObservation` and `insight.underneathReading` must not be rephrasings of each other. The underneath must be a substantively different claim — an interpretive move, not a restatement.
    8. **Insight falsifiability** *(new):* `insight.underneathReading` must make a specific claim that could be wrong. Vague or universally-true statements ("she values growth," "she contains multitudes") fail this check.
    9. **Bridge grounding** *(new):* `insight.bridge` must cite specific moments or quotes from the evidence, not handwave ("based on her patterns"). The reasoning from surface to underneath must be traceable.
    10. **Arc serves insight** *(new):* every movement beat's `focus` must be checkable against "does this beat advance, deepen, or complicate the insight?" If a beat is interchangeable with a generic Nerin portrait beat, it fails.
    Output: structured `SpineVerification` JSON.
- **3.5** `packages/domain/src/constants/nerin/prose-renderer-prompt.ts` (new) — Stage B prompt. Responsibility: render a `SpineBrief` into prose in Nerin's voice, obeying `PORTRAIT_CONTEXT` craft rules. **Priya's framing:** *"The brief tells you what must land; your job is to find the prose that makes it land. The specific words are yours. Verbatim quote fields are the exceptions — use those literally where indicated. Do not invent user-specific details that aren't in the brief."*
- **3.6** `packages/domain/src/repositories/spine-extractor.repository.ts` (new) — Effect `Context.Tag`
- **3.7** `packages/domain/src/repositories/spine-verifier.repository.ts` (new) — Effect `Context.Tag`
- **3.8** `packages/infrastructure/src/repositories/spine-extractor.claude.repository.ts` (new) — Sonnet 4.6, `thinking: { type: "enabled", budget_tokens: 2048 }`, temp 0.3, direct SDK, JSON output via structured output or tool use
- **3.9** `packages/infrastructure/src/repositories/spine-verifier.claude.repository.ts` (new) — Haiku 4.5, direct SDK, structured output. Fast (~3–5s), cheap (~$0.005/call)
- **3.10** `portrait-generator.claude.repository.ts` — refactor: **input is `SpineBrief` only** (plus `PORTRAIT_CONTEXT` from constants). **No `UserSummary`. No raw conversation.** Uses `prose-renderer-prompt`. No thinking. Temp 0.5.
- **3.11** `generate-full-portrait.use-case.ts` — orchestrate the full pipeline with bounded retry:
    ```
    read UserSummary from assessment result
      ↓
    (attempt 1) → Stage A extract brief
      ↓
    Verifier scores brief
      ↓
    ├─ if passed → Stage B render → persist
    └─ if failed AND attempt < 2
         ↓
       (attempt 2) → Stage A re-extract with gapFeedback appended to prompt
         ↓
       Verifier scores brief again
         ↓
       Stage B render (regardless of second verify result — ship best we have)
         ↓
       persist (log the failed verification for post-hoc analysis)
    ```
    **Hard cap: 2 extraction attempts.** No infinite loops. Log every verification attempt and outcome for observability.
- **3.12** `packages/domain/src/constants/nerin/portrait-context.ts` — trim: remove "FIND YOUR THREAD" section and spine-discovery instructions (responsibility moved upstream). Keep voice rules, craft requirements, non-negotiables — these are Stage B's *only* guidance outside the brief.
- **3.13** (audit, not a code change) — review whether `voiceAdjustments` on the `SpineBrief` is redundant with trimmed `PORTRAIT_CONTEXT`. If PORTRAIT_CONTEXT after 3.12 already covers per-movement voice adequately, drop `voiceAdjustments` from the brief schema. Otherwise keep. *(Priya party-mode observation.)*

**Exit criterion (raised 2026-04-11 per user correction):**
- **Hard floor — every portrait, every dimension: minimum score 3.** Any score of 1 or 2 fails the exit gate.
- **Target median on spine-related dimensions: 4** across the 25-portrait corpus.
- **Stretch — "Insight beneath observation" dimension: ≥30% of portraits score 4 or 5** (the rubric dimension that tests the inferential-depth corrective most directly).
- Voice, coined-phrase, and self-compelling dimensions: **no regression vs Phase 0 baseline.**
- Cost ~$0.13–$0.14 per portrait.
- Verifier pass rate on first extraction attempt ≥ 70% (if lower, Stage A prompt needs tuning before shipping).

**Rollback:** feature flag `PORTRAIT_ARCHITECTURE=single|three-stage` for two release cycles.

**PDCA — critical gate.** If rubric shows spine *still* inconsistent, **the root cause was wrong. STOP. Re-diagnose. Do not proceed to Phase 4a.**

### Phase 4a — Optional Cost Push: Haiku Prose (1 day + testing)

**Only if Phase 3 ships cleanly.**

- **4a.1** `app-config.live.ts` — add `PORTRAIT_PROSE_MODEL_ID` (default `claude-sonnet-4-6`)
- **4a.2** `portrait-generator.claude.repository.ts` — parameterize prose model
- **4a.3** Local test — regenerate corpus with `claude-haiku-4-5-20251001`; score via rubric
- **4a.4** Decision — if voice/coined-phrase/self-compelling dimensions within 0.5 points of Sonnet, switch prod. Otherwise revert.

**Rollback:** one env-var flip.

### Timeline (updated 2026-04-11)

```
Day 1–2:    Phase 0  — observability + rubric + baseline
Day 3–5:    Phase 1  — SDK swap, caching, first-attempt fix        ← exit: $0.15, no regression
Day 6–7:    Phase 2  — UserSummary@completion + quote bank         ← exit: $0.08, no regression
Day 8–11:   Phase 3  — three-stage pipeline + verifier + loop      ← exit: spine fixed, no regression
Day 12:     Phase 4a — Haiku prose test (optional)                 ← decision by rubric
```

**Total:** ~11 working days to Phase 3 ship, +1 for Phase 4a. Phase 3 grew by +1 day vs. earlier estimate to build the SpineVerifier repo and retry orchestration.

### Resources

- Time: ~2 working weeks
- Test API budget: ~$22.50 worst case (25 portraits × 3 regenerations × $0.30)
- No new infrastructure
- Solo execution

### Key Dependencies

- Phase 1 depends on Phase 0 logs (need real portrait generation to diagnose failures)
- Phase 2 depends on Phase 1 SDK swap
- Phase 3 depends on Phase 2 `UserSummary` type
- Phase 4a depends on Phase 3 shipping stable

### Top Risk

Phase 3 gate fails — rubric shows spine *still* inconsistent after the architectural change. **Mitigation:** stop at that gate, re-examine root cause with Phase 0 instrumentation data in hand, revise the plan before continuing. Do not push forward to Phase 4a on a broken Phase 3.

### Party-Mode Refinements (2026-04-11)

Personas pressure-tested the final plan. Five refinements adopted:

**1. Cap the quote bank structurally, not just in the prompt.** (Maya)
Phase 2 step 2.3: enforce `quoteBank: { maxItems: 40 }` in the JSON schema / tool-use definition, not just in the instruction. Haiku obeys structural caps more reliably than prose caps.

**2. Per-stage observability, not aggregate.** (Maya, Alex)
Phase 0 step 0.1 extended: break down `tokens_in`, `tokens_out`, `thinking_tokens`, `duration_ms` **per stage** (user-summary, spine-extraction, prose-rendering). Aggregate totals hide drift source. Add `stage_a_duration_ms`, `stage_b_duration_ms`.

**3. Prose-renderer-prompt framing.** (Priya)
Phase 3 step 3.3: the prompt should explicitly frame the brief as a *constraint, not a script.* Suggested language: *"The brief tells you what must land; your job is to find the prose that makes it land. The specific words are yours. Verbatim quote fields are the exceptions — use those literally where indicated."* Protects against "templated-feeling prose" even when the brief is prescriptive.
Also: reconsider whether `voiceAdjustments` belongs in the `SpineBrief` at all — may be redundant with PORTRAIT_CONTEXT. Audit during Phase 3.2/3.3 design; drop from brief if PORTRAIT_CONTEXT already covers per-movement voice.

**4. Move `UserSummary` generation to assessment-completion time.** (Alex — important)
Phase 2 step 2.5 refined: instead of generating `UserSummary` lazily at portrait-generation time, generate it **when the assessment completes**. Portrait generation then starts with summary already present. Removes a serial dependency from the critical path, and aligns with the cross-cutting-asset framing (summary is a property of the *user*, not of the *portrait*).

**5. Add a small UX enhancement task after Phase 3.** (Rowan)
**New Phase 3.9** (~1 day total, ~half-day design + half-day engineering): ambient progress indication during portrait generation. Static narrative copy that rotates every ~5s — e.g., *"Nerin is finding her thread..." → "Nerin is sitting with your curiosity..." → "Nerin is writing the opening..."*. Not streaming, not SSE — just turns the spinner into visible intentional progress. Backend adds a `currentStage` field to `/portrait-status`; frontend rotates copy based on stage + elapsed time.

### Explicit Fork in the Road — Path A vs Path B

Party-mode's contrarian voice pressed on whether the full plan is proportional to the problem. Making it an explicit decision:

| Aspect | **Path A — Full plan (current)** | **Path B — Simpler shortcut** |
|---|---|---|
| Phases | 0 → 1 → 2 → 3 → (4a optional) | 0 → 1 → 3-lite |
| Phase 2 (UserSummary) | Yes — build quote bank, cross-cutting asset | **Skipped.** Stage A reads raw conversation directly. |
| Phase 3 Stage A input | `UserSummary` with quote bank (~12K tokens) | Raw conversation (~37K tokens) |
| Total effort | ~10 days | ~6 days |
| Projected cost/portrait | **~$0.13** | **~$0.24** |
| Still meets success criteria? | ✅ Yes, by wide margin | ✅ Yes, just under the $0.25 cap |
| Cross-cutting asset | UserSummary exists, usable by other features | Nothing built — future features duplicate the work |
| Quality risk | Medium (quote bank must preserve enough user language) | Lower (no lossy abstraction layer) |
| Code surface | 3 new types, 2 new repos, 1 migration | 1 new type (`SpineBrief`), 1 new repo (spine extractor) |

**Default recommendation: Path A**, unless cross-cutting asset value is zero. Path A is cheaper per portrait and builds an asset other features can reuse. Path B ships faster and is simpler, but locks cost at $0.24/portrait and defers `UserSummary` work that may have to happen anyway for other features.

**Path B is the right choice if:** (a) you want to ship this in ~one week instead of two, (b) you're uncertain whether other features will actually need `UserSummary`, or (c) the quote-bank abstraction risk feels too uncertain to take on.

**Neither choice is wrong. This fork is a product/pace decision, not a technical one.**

---

## 📈 MONITORING AND VALIDATION

### Production Metrics (continuous, emitted from Phase 0 observability)

| Metric | Target | Alert Threshold |
|---|---|---|
| **Per-portrait cost** | ≤ $0.14 | > $0.18 sustained 48h |
| **Per-portrait total latency** | ≤ 70s | > 120s sustained 48h |
| **Stage A latency** (p50 / p95) | ≤ 20s / ≤ 40s | p95 > 60s |
| **Stage B latency** (p50 / p95) | ≤ 40s / ≤ 70s | p95 > 90s |
| **Verifier pass rate, first attempt** | ≥ 70% | < 60% sustained 1 week |
| **Verifier pass rate, any attempt** | ≥ 95% | < 90% sustained 1 week |
| **First-attempt generation failure rate** (Phase 1 concern — should drop post-fix) | ≤ 10% | > 20% sustained 48h |
| **Quote bank size (avg entries)** | 20–40 | < 18 or > 50 |
| **Thinking tokens per Stage A call** (p50) | ≤ 1500 | > 2000 sustained |

### Periodic Quality Audit (scheduled, human-in-loop)

- **Weekly:** run `/portrait-rubric` on 10 most-recent production portraits. Log dimension-by-dimension scores.
- **Monthly:** regenerate the 25-portrait test corpus; compare rubric scores to the frozen 2026-04-11 baseline. Detect drift.
- **Quarterly:** hand-curate 5 examples of best + worst portraits from production; refresh rubric anchoring examples.

### Adjustment Triggers → Actions

| Trigger | Likely Cause | Action |
|---|---|---|
| Rubric "insight beneath observation" median drops below 4 | Stage A losing interpretive depth | Re-examine `spine-extractor-prompt.ts`; check whether thinking budget is being used; possibly raise thinking budget temporarily for diagnosis |
| Rubric "coined-phrase quality" drops | `quoteBank` preservation is degrading | Audit a sample of recent `UserSummary` outputs; revise Haiku summarizer prompt |
| Verifier pass rate first-attempt < 60% | Stage A prompt is producing shallow briefs | Prompt tuning, NOT pipeline change |
| Verifier pass rate any-attempt < 90% | Verifier is over-strict OR Stage A is fundamentally broken | Inspect failing briefs manually; recalibrate verifier checklist or revisit Stage A |
| Cost creeping above $0.18 | Quote bank drift, conversation growth, or retry uptick | Read per-stage token logs; find which stage is over-running |
| Latency p95 > 120s | Stage A thinking running long OR API slow | Check thinking token usage; consider capping budget |

### Rollback Criteria

**Hard rollback (flip feature flag to previous phase) if any of:**
- Rubric regression > 0.5 points on any dimension, sustained across 10+ portraits
- Cost > $0.25 sustained for 48h
- Total latency > 3 min sustained for 48h
- Any dimension median drops to < 3

**Feature flags available** (from implementation plan):
- `PORTRAIT_ARCHITECTURE=single|three-stage` (Phase 3 rollback — revives pre-decomposition pipeline)
- `PortraitGeneratorLangchainRepositoryLive` (Phase 1 rollback — revives LangChain client)
- `PORTRAIT_PROSE_MODEL_ID=claude-sonnet-4-6|claude-haiku-...` (Phase 4a rollback — reverts Haiku prose to Sonnet)

### Validation Protocol

Each phase's exit gate is the primary validation mechanism — the plan is structured so that failure at any gate triggers a stop-and-diagnose, not a push-through. Post-ship, the weekly rubric sample is the ongoing validation. If rubric drift is detected, the trigger table above dictates the action.

**One principle to hold:** observed production behavior is ground truth. If rubric scores hold but users complain about portraits, the rubric is wrong and needs recalibration. If rubric scores drop but users don't notice, investigate whether the rubric is over-sensitive. The rubric is a tool, not a verdict.

---

## 📝 LESSONS LEARNED

### Key Learnings from This Session

**1. Verify subagent reports against primary source before building on them.**
Mid-session, a diagnostic agent incorrectly reported that extended thinking was enabled in the current portrait generator. I built Chain B of the root cause analysis on that claim. The user caught the error. Had they not, the implementation plan would have been aimed at a symptom (uncontrolled thinking budget) rather than the real mechanism (retry amplification + monolithic cognitive load + spine decoupled from its historical producer). **Rule:** any subagent claim that load-bears on a decision needs a one-line primary-source verification before I cite it.

**2. The user's clarification of "simplicity" was the highest-leverage moment in the session.**
Earlier I was constraining the solution space to ≤2 LLM calls because I assumed "simplicity = fewer calls." The user corrected me: simplicity means *don't reinvent LLM reasoning in code*. Multiple LLM calls are fine if each does something only an LLM can do well. This one sentence unblocked the three-stage verified pipeline, the verifier loop, and the rich structured brief. **Rule:** when a user invokes a preference rule, ask for the underlying principle, not just the rule's surface expression.

**3. "Surface vs underneath" came out late and should have come out earlier.**
The inferential-depth correction arrived at Phase 3 refinement, not in Step 1 problem definition. If I had asked "what makes a portrait *feel seen*, mechanically?" during problem definition, the interpretive framing would have informed every subsequent design decision. Instead it had to retroactively reshape the SpineBrief schema and rubric at the end. **Rule:** for quality-focused problems, elicit the mechanism of success, not just the symptoms of failure.

**4. The 9-portrait analysis was load-bearing evidence that wasn't saved.**
The verbal verdict ("too much cognitive load in one prompt") survived, but the specific clustering (which portraits were bad, which variants they ran under) was lost. This cost diagnostic precision in Step 3 and forced me to rely on convergent reasoning from multiple weaker sources. **Rule:** when Claude Code runs analysis that might inform future decisions, save the artifact.

**5. The Batch API option was silently accepted then had to be flagged.**
When the user said "I'm down to evaluate it" for the Batch API, I almost proceeded without making the UX-conflict explicit. I caught it and flagged the user-waiting incompatibility, but I shouldn't have needed to catch it — it should have been surfaced at the moment of the user's "okay." **Rule:** when a user approves an option, verify they understand its load-bearing assumptions before folding it into the plan.

### What Worked

- **Phased exit gates.** Refusing to evaluate Tier 2 solutions until Tier 0 observability exists kept the plan honest and measurable.
- **Party-mode twice.** Surfacing blind spots (Alex's "move UserSummary to completion time," Rowan's "progress indication," the contrarian's Path A vs B) that I wouldn't have generated solo.
- **Explicit fork documentation.** Making Path A vs Path B visible rather than silently choosing one left the decision with the user — where it belonged.
- **Refusing to pre-converge on director-model** when it was pitched as the trigger. The diagnostic work revealed a different root cause (unowned spine responsibility post-thinking-removal), and the architecture that fixes it is minimal decomposition, not full director.

### What to Avoid Next Time

- **Trusting subagent citations without primary-source verification** when they load-bear on decisions.
- **Over-specifying structure in a schema when the behavior is what matters.** I spent time on `voiceAdjustments` field design, then Priya in party-mode pointed out it may be redundant with PORTRAIT_CONTEXT — which I only flagged for later audit rather than resolving upfront.
- **Skipping Step 8 would have left the plan without a production-time validation protocol.** Even a lightweight version (as above) is necessary. Never YOLO past monitoring.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
