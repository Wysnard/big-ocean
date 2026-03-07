# Problem Solving Session: Precise Definition and Extraction of Energy and Telling for ConversAnalyzer

**Date:** 2026-03-07
**Problem Solver:** Vincentlay
**Problem Category:** Signal extraction design / LLM output contract specification

---

## PROBLEM DEFINITION

### Initial Problem Statement

The E_target pacing formula (specified in [problem-solution-2026-03-07.md](./problem-solution-2026-03-07.md)) consumes two user-state signals — **energy** (0-10) and **telling** (0-1) — but neither signal has a precise definition or extraction method. The ConversAnalyzer currently extracts energy as a 3-level categorical (`light|medium|heavy`) based on emotional weight/vulnerability, which is both the wrong format (categorical vs. continuous) and potentially the wrong concept (emotional weight vs. conversational intensity). Telling does not exist in the current extraction at all.

Without precise, extractable definitions of these signals, the entire pacing pipeline inherits undefined behavior. The formula is only as good as its inputs.

### Refined Problem Statement

**Define energy and telling as precise, orthogonal, LLM-extractable signals** that:

- Map exactly to what the E_target pacing formula consumes and why
- Are decomposed into observable textual dimensions that an LLM (Claude Haiku) can reliably and consistently detect
- Maintain orthogonality — energy and telling must NOT collapse into a single correlated dimension
- Include contrastive examples across all four quadrants (flow, performance, quiet authenticity, disengagement) — quadrant labels are design language only, NOT part of the extraction output
- Specify the ConversAnalyzer v2 output contract, prompt instructions, and scoring rubrics
- Produce stable, calibrated scores across diverse user types and message styles
- Validate against a 12-scenario corpus covering normal cases, edge cases, and orthogonality stress tests

### Problem Context

- **Upstream dependency:** The E_target formula is fully specified. It consumes `E(n)` in [0, 10] and `T(n)` in [0, 1]. The formula does not need modification — the mismatch is in extraction, not consumption.
- **Current ConversAnalyzer contract:** Extracts `evidence[]` (Big Five facet evidence with deviation/strength/confidence/domain/note) and `observedEnergyLevel: "light"|"medium"|"heavy"`. No telling signal.
- **Current energy definition (too narrow):** "light" = casual/surface, "medium" = some self-reflection, "heavy" = deep emotional disclosure. This is emotional weight/vulnerability — a subset of what the pacing formula needs.
- **LLM extraction model:** Claude Haiku via tool-use with JSON schema validation. The extraction happens in the same call as personality evidence extraction.
- **Context available to ConversAnalyzer:** Last 6 messages of conversation history, current domain distribution, facet definitions. The previous assistant message IS available for relative telling assessment.
- **Architecture rule:** Energy and telling are user-state signals for the pacing layer. They are NOT assessment signals. They do not feed into personality scoring.
- **Telling in the formula:** Enters as `trust = f(T)` which qualifies upward momentum only. When unavailable, defaults to `trust = 1.0`. Asymmetric: T=0 maps to trust=0.5, T=0.5 to trust=1.0, T=1.0 to trust=1.2.

### Success Criteria

1. **Energy precisely defined** — decomposed into observable dimensions with a scoring rubric that an LLM can apply consistently across message styles. A human reading the rubric should be able to score any message within 1 point of the LLM.
2. **Telling precisely defined** — decomposed into observable markers (both high-telling and low-telling) with a scoring rubric. Scored as self-propulsion beyond the **minimum viable answer** to the previous assistant turn — this implicitly accounts for prompt openness without requiring explicit prompt-affordance assessment.
3. **Orthogonality preserved** — the definitions and prompt instructions prevent energy-telling correlation. All four quadrants (flow, performance, quiet authenticity, disengagement) are represented in contrastive examples.
4. **ConversAnalyzer v2 output contract specified** — exact Effect Schema for the `userState` block (`energy`, `telling`, `energyBand`, `tellingBand`, short reasons) alongside existing evidence extraction. NO quadrant labels in extraction output — quadrants are design/analysis language only.
5. **Prompt instructions drafted** — ready to insert into the ConversAnalyzer prompt, with rubrics, anchors, and contrastive examples.
6. **Extraction reliability** — the scoring approach (anchored buckets vs. raw continuous) is chosen for LLM consistency, not theoretical precision. The formula's EMA smoothing handles quantization.
7. **Formula compatibility verified** — the new energy definition maps correctly to the drain concept (excess cost above comfort=5.0), the EMA smoothing (lambda=0.35), and the trust function. No formula modifications needed, or modifications proposed with rationale if the definitions demand them.

### Key Design Decisions (from elicitation)

**Energy definition resolved:**
- **Conceptual target:** Energy represents *cost to the user* — how much the message costs the user to produce. The pacing formula converts energy into excess cost, then drain, then a protective ceiling. This is why the formula needs energy, and this is the north star for calibration.
- **Extraction target:** Energy is scored as *observable conversational intensity/load* — the proxy for cost that an LLM can reliably detect from text. The extractor should NOT attempt to infer private internal effort; it should observe intensity markers and let the formula interpret them as cost.
- Composed of 4 observable dimensions: emotional activation, cognitive investment, expressive investment, activation/urgency
- The 4 dimensions have **equal authority** (any one can drive the score high), NOT **equal weight** (they are not averaged). A single strongly present dimension is sufficient for high energy. Missing dimensions do NOT pull the score down. Equal authority does NOT mean scoring each dimension separately and averaging them — it means any one strongly present dimension can justify a higher score on its own.
- Any dimension being high makes the message high-energy (a passionate hobby rant is 7, not "light")
- Extracted via 5 anchored bands (minimal/low/steady/high/very_high) mapped to numeric values (1/3/5/7/9 with +/-1 adjustment)
- **Fluency guardrail:** Fluent, flowing, effortless-sounding expression may indicate comfort, not cost. A practiced storyteller or natural over-sharer may produce high-intensity text at low personal cost. The EMA handles baseline differences across users over multiple turns, but the extractor should not inflate scores for text that reads as effortless.

**Telling definition resolved:**
- Telling = **self-propulsion beyond the minimum viable answer** to the previous prompt
- **Formula role (narrow):** The E_target formula uses telling ONLY as a trust qualifier on upward momentum. It has NO effect when energy is stable or declining. So telling only matters to pacing *when energy is rising* — it answers "should we follow this rise, or be cautious?"
- **Extraction scope (broad):** Despite the narrow formula role, telling should be extracted for every turn. The extractor runs before the formula, and telling also serves as design language for territory policy reasoning (four-quadrant state model). Extract generally; the formula takes what it needs.
- "Minimum viable answer" framing implicitly handles prompt affordance: open prompts set a higher floor (everyone picks a topic), narrow prompts set a lower floor (any expansion registers)
- Observable markers: introduces new material, volunteers stories, makes own connections, reframes the question, asks questions back
- Low-telling markers: stays inside the question's frame, echoes Nerin's language, answers then stops
- Extracted via 5 anchored bands (fully_compliant/mostly_compliant/mixed/mostly_self_propelled/strongly_self_propelled) mapped to (0.0/0.25/0.5/0.75/1.0)

**Output schema resolved:**
- Extraction outputs `energy` (numeric) + `telling` (numeric) + `energyBand` + `tellingBand` + short reasons
- NO quadrant labels in extraction output — quadrants (flow, performance, quiet authenticity, disengagement) are design language for the pacing layer, not observables for the extractor

**Multi-part message scoring rule (from Red Team, Attack 3):**
- Messages can shift in energy and telling within their body (e.g., compliant opening → self-propelled deepening)
- **Energy: score where the message lands** — weight the final/substantive state, not the opening. Exception: if the message ends with a deflection after substantive content, score on the substantive content, not the deflection.
- **Telling: score the highest self-propulsion shown** — a self-correction or unprompted deepening IS telling, even if it follows a compliant opening. The user "taking the wheel" mid-message is peak telling behavior.
- **Do NOT extract section-level scores.** The simple rule (final-energy, peak-telling) handles 95%+ of cases. Section-level extraction adds segmentation noise, token cost, and schema complexity for a 5-10% edge case. The formula's EMA smooths across turns.
- Instead, add a `withinMessageShift` boolean flag to signal when an arc occurred within the message. This preserves the signal for downstream analysis without the full section machinery. If monitoring later shows multi-part messages are causing extraction problems, section-level scoring can be added in v2.

**Absolute vs. relative scoring (from Red Team, Attack 6):**
- **Energy is ABSOLUTE.** Score the latest user message on its own intensity/load scale. Do NOT anchor to the recent conversation — a steady E=5 message is E=5 regardless of whether the previous messages were E=2 or E=8.
- **Telling is RELATIVE.** Score how much the user went beyond the minimum viable answer to the immediately previous assistant message. This is the only axis where the previous turn matters.

**Prompt guardrails (from Red Team, Attacks 1 & 4; refined by Debate Club):**
- **Eloquence is not energy.** A beautifully written message about a low-stakes topic is "steady," not "high." Linguistic sophistication does not increase the intensity/load score.
- **Sophistication is not cognitive investment.** Cognitive investment means the user is actively *working through* something — questioning, connecting, revising, wrestling, searching. A calm, clear insight that appears to come easily is "steady," not "high," even if the content is intellectually sophisticated. Comfortable analysis is usually steady unless visible strain, urgency, internal conflict, or strong activation is present.
- **Peak dimension, not average.** The 4 dimensions are parallel routes to energy, not ingredients to average. One strongly present dimension is sufficient for high energy. Do NOT require visible markers on multiple dimensions. Do NOT average absent dimensions downward.
- **Understated styles are not low energy.** A compressed, restrained message about a heavy topic scores on emotional activation regardless of expressive style. This protects against cultural and personality-style bias.
- **Long detailed answer is not high telling.** A thorough, vivid answer that stays inside the prompt's frame is compliant, not self-propelled. Length and detail are NOT telling markers.

**Dimension aggregation model (from Debate Club, confirmed by review):**
- Keep one energy axis with four parallel dimensions. Do NOT split into cognitive/emotional sub-channels.
- Each dimension has **equal authority to drive the score** — but this does NOT mean mechanical averaging. The mental model is "any route can get you there," not "add them up and divide."
- The pacing formula handles cognitive vs. emotional sustainability asymmetry through existing mechanisms: stable analytical engagement → low momentum, low drain → ceiling stays high. Volatile emotional engagement → high momentum, drain accumulates → ceiling drops. Telling qualifies whether the intensity is self-propelled.
- **However:** the formula does not rescue a bad extraction. If comfortable analysis is over-scored as E=7, drain will accumulate and the system will become overly protective of users in their comfort zone. The guardrails above (sophistication ≠ investment, comfortable analysis = steady) are the first line of defense — not the formula.

**Formula noise tolerance (from First Principles Analysis):**
- The EMA (lambda=0.35) attenuates ~65% of single-turn noise. Drain is K-padded over 5 turns. Trust operates in a narrow band (0.5-1.2). The formula is **structurally resilient to moderate random noise**.
- This supports band-based extraction: 5 anchored bands with some noise is better than pseudo-precise continuous values with different noise. The formula's smoothing handles the quantization.
- **Critical distinction:** The formula is robust to **random noise**, but NOT to **systematic bias**. If the extractor systematically over-scores a user archetype (e.g., articulate users, analytical users), drain will systematically over-constrain them. Guardrails are the first line of defense against systematic bias.

**Orthogonality minimum guarantee (from First Principles Analysis):**
- The formula multiplies trust(T) into upward momentum. If energy and telling are correlated, this multiplication double-counts the same signal, creating runaway amplification.
- The extraction prompt MUST include at minimum one contrastive example per diagonal to break the natural surface correlation:
  - **High E + Low T** (Scenario 6: long energetic compliant — the most important)
  - **Low E + High T** (Scenario 3: quiet volunteer)
- These are non-negotiable. Without them, the LLM will default to correlating length/vividness with both energy and telling.

**Telling-regression monitoring trigger (from Red Team, Attack 2):**
- As Nerin's prompts improve, users may give richer answers that are still technically "within the frame," compressing telling scores downward across the product.
- This is not a definition flaw but a calibration risk. Monitor: median telling per session, median telling by prompt type, telling distribution before/after prompt changes.
- If median telling drops below 0.4 across sessions, investigate whether the extractor is measuring self-propulsion or just prompt openness.

**Validation corpus: 12 scenarios** covering:
- 7 core scenarios: enthusiastic hobbyist, compliant deep answer, quiet volunteer, fading compliant, short devastating disclosure, long energetic compliant, the reframer
- 5 additional stress tests: humor/deflection, meta/clarifying response, boundary-setting refusal, low-energy self-directed practical user, rambling verbose answer
- Key proof cases: Scenario 6 (long energetic compliant) is the most important orthogonality test — a long vivid answer that stays inside the prompt's frame must score low-telling despite high energy

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

| Dimension | IS (inside this problem) | IS NOT (outside this problem) |
|-----------|--------------------------|-------------------------------|
| **What** | Energy signal: wrong format (categorical → continuous) and wrong concept (emotional weight → conversational intensity/load). Telling signal: does not exist. | Evidence extraction (Big Five facets) — works correctly, keep as-is. E_target formula — specified and correct. Territory policy — separate downstream problem. |
| **Where** | ConversAnalyzer output contract, prompt instructions (`buildPrompt()` in `conversanalyzer.anthropic.repository.ts`), output schema validation. | Pipeline wiring (`nerin-pipeline.ts`) — already handles `observedEnergyLevel`, needs format update only. Formula implementation (`e-target.ts`) — already accepts `telling: number | null`. Database schema — `observed_energy_level` column needs type change. |
| **Who** | Pacing layer (direct consumer), territory policy (indirect, via E_target), user experience (ultimate beneficiary). | Silent scoring / personality assessment — energy and telling are pacing signals, NOT assessment signals. Portrait generation — reads facet scores, not pacing state. |
| **When** | Every user message — ConversAnalyzer runs post-Nerin on every exchange past cold-start threshold. | Not at session boundaries, not at portrait generation, not during auth. |
| **Scale** | One file for prompt/schema changes. One file for DB column type. Pipeline wiring updates. | No new infrastructure, no new LLM calls (state extraction happens in the same Haiku call as evidence extraction), no new services. |

**Key pattern:** The problem is conceptual (definitions, rubrics, guardrails) far more than it is technical. The implementation blast radius is small — concentrated in the ConversAnalyzer prompt, schema, and one DB column. The hard work is in the extraction spec, not in the code.

### Root Cause Analysis

**Method: Five Whys + Systems Thinking**

**Why is the energy signal wrong?**
→ Because it was designed as an emotional weight classifier (`light|medium|heavy`), not as a pacing input.

**Why was it designed that way?**
→ Because the original system used energy to drive Depth Readiness Score (DRS), which measured readiness for deeper emotional territory. DRS needed emotional weight, not conversational load.

**Why doesn't DRS-style energy work for pacing?**
→ Because the pacing formula (E_target) uses energy to compute *drain* — cumulative excess cost that triggers fatigue protection. Drain needs to measure *cost to the user*, which includes cognitive effort, enthusiasm, and activation — not just emotional depth. A passionate hobby rant costs energy but registers as "light" in the old system.

**Why is telling absent?**
→ Because the original steering model was single-axis (energy only). The two-axis state model (Energy x Telling) was designed in the pacing architecture redesign but never propagated back to the ConversAnalyzer extraction contract.

**Root cause:** The ConversAnalyzer's state extraction contract was designed for an earlier, simpler steering model (DRS-based, energy-as-emotional-weight). The pacing architecture redesign (E_target, two-axis state, territory-based steering) introduced new requirements that the extraction contract hasn't caught up with.

### Contributing Factors

- **Categorical vs. continuous format:** The 3-level categorical (`light|medium|heavy`) was appropriate for DRS (which used it as a threshold gate), but the E_target formula needs a 0-10 continuous signal for EMA smoothing, momentum computation, and drain calculation.
- **Single-call extraction constraint:** Energy and telling must be extracted in the same Haiku call as personality evidence. This constrains prompt length and output complexity. Adding state signals must not degrade evidence extraction quality.
- **LLM scoring limitations:** Claude Haiku can classify into bands reliably but struggles with fine-grained continuous scoring (0.63 vs 0.68). The extraction approach must match the model's capabilities.
- **No validation corpus:** No existing set of scored example messages to test extraction consistency against. The 12 scenarios from elicitation are the first validation corpus.

### System Dynamics

```
ConversAnalyzer prompt/schema (THE CHANGE POINT)
        ↓
Extracts: evidence[] + state { energy, telling, bands, reasons, shift flag }
        ↓
Pipeline (nerin-pipeline.ts) passes state to pacing layer
        ↓
computeETarget() consumes E(n) and T(n)
        ↓
E_target feeds territory policy + move selection
        ↓
Nerin's next response reflects appropriate pacing
```

**The change is at the top of the pipeline.** Everything downstream is already designed to consume these signals — the ConversAnalyzer just isn't producing them yet.

**Feedback loop to monitor:** ConversAnalyzer extraction quality → E_target accuracy → pacing appropriateness → user experience. If extraction is systematically biased (guardrail failures), the entire downstream chain inherits the bias. The formula is noise-tolerant but bias-vulnerable.

### Implementation Constraints (from Party Mode discussion)

**Single-call extraction (confirmed):** State signals (energy, telling) are extracted in the same Haiku call as personality evidence. No separate call for v1 — cost must stay low. If the product gains traction and prompt crowding degrades extraction quality, a separate call can be introduced later.

**Prompt ordering rule:** State extraction instructions go BEFORE evidence extraction in the prompt. The new, fragile signal gets first attention; evidence extraction is already working and can tolerate being second.

**Storage: Option A — expand `assessment_messages` table.** No new tables, no log aggregation services. Add columns to the existing table that's already written per turn:

| Column | Type | Purpose |
|--------|------|---------|
| `energy` | `real` | Extracted energy (0-10) |
| `energy_band` | `text` | Band label for debugging |
| `telling` | `real` | Extracted telling (0-1) |
| `telling_band` | `text` | Band label for debugging |
| `within_message_shift` | `boolean` | Shift flag |
| `state_notes` | `jsonb` | Energy reason, telling reason |
| `smoothed_energy` | `real` | E_s(n) — persisted for next turn's computation |

The existing `observed_energy_level` column is kept as nullable during migration for legacy comparison. Dropped once new extraction is validated.

**Hybrid calibration protocol:**

Energy is defined as "cost to the user." External human scorers infer cost from text — the same thing the LLM does. They don't provide ground truth, just a second inference. The user KNOWS their own cost. Therefore calibration uses two methods answering different questions:

1. **Expert review (prompt compliance)** — 20-30 messages scored by someone who deeply understands the definitions (e.g., the product builder). Answers: "Is the LLM following the extraction instructions correctly?" Blind scoring (no LLM scores shown). Uses the same band rubric. Divergence threshold: agree within 1 band on 80%+ = prompt is working.

2. **User self-scoring (ground truth)** — Post-session review. After the conversation, show the user 8-10 of their own messages and ask them to rate on two simple scales with anchoring language:
   - Energy: "Compared to a casual text to a friend, how much more effort/intensity did this message cost you?" (minimal / a little / moderate / a lot / everything I had)
   - Telling: "Were you driving the conversation here, or responding to what Nerin asked?" (fully responding / mostly responding / mix / mostly driving / fully driving)
   - Target: ~10-20 users in the first calibration round.
   - Answers: "Does the LLM's score match the user's actual experience?"

3. **Compare and calibrate** — Where LLM and user diverge systematically, investigate whether the definition or the extraction needs adjustment. User self-scoring is the primary ground truth for energy-as-cost. Expert review is the primary signal for prompt instruction quality.

**Known biases in user self-scoring:**
- Retrospective reconstruction (messages may feel different in hindsight)
- No shared baseline across users (one user's "intense" is another's normal)
- Mitigated by: anchoring language, relative scales, fresh recall (scored immediately post-session)

Full state extraction output (bands, reasons, shift flag) is stored per message and available for debugging.

**Positive anchors needed:** The prompt needs one canonical example message per band (5 for energy, 5 for telling paired with the preceding Nerin prompt). Guardrails say "don't mistake X for Y." Anchors say "THIS is what Y looks like." Both are needed.

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

| Force | Strength | Why |
|-------|----------|-----|
| E_target formula already specified | Strong | Consumer is defined — exact input format, scale, and usage are known |
| Definitions stress-tested through 4 elicitation rounds | Strong | What-If scenarios, Red Team, First Principles, Debate Club — definitions survived all challenges |
| Small implementation blast radius | Strong | One prompt, one schema, a few DB columns. No new infrastructure. |
| Existing pipeline wiring | Strong | `nerin-pipeline.ts` already handles energy extraction — format change, not structural change |
| Band-based extraction matches LLM capability | Strong | 5 bands is well within Haiku's reliable classification range |
| Formula tolerates random extraction noise | Medium | EMA + K-padding + narrow trust band = structural resilience |

**Restraining Forces (Blocking Solution):**

| Force | Strength | Why |
|-------|----------|-----|
| Prompt attention budget | Medium | Adding state extraction to existing evidence call. Risk of degrading evidence quality. Mitigated by prompt ordering (state first). |
| No real-message validation yet | Medium | 12 synthetic scenarios but no human-scored real messages. True quality unknown until pipeline runs. |
| Orthogonality enforcement | Medium | LLMs naturally correlate energy and telling. Requires explicit contrastive examples to break. |
| Systematic bias risk | Medium | Formula is noise-tolerant but bias-vulnerable. Guardrails are defense, not the formula. |
| Telling is entirely new signal | Low-Medium | No baseline, no existing intuition about "good." Energy at least has old categorical to compare. |

### Constraint Identification

**Primary bottleneck:** Calibration confidence, not implementation. The prompt and schema can be written quickly. Knowing whether extraction actually works requires real messages flowing through the pipeline with human evaluation. Implementation strategy should optimize for **getting to real data fast**.

**Hard constraints:**
1. Single-call extraction (cost control) — state + evidence in one Haiku call
2. 5-band extraction, not continuous — matches LLM reliability
3. Must not degrade evidence extraction quality — core product signal
4. Output must match E_target formula input contract: E(n) in [0,10], T(n) in [0,1] or null

**Soft constraints:**
5. Prompt conciseness — Haiku has context window capacity, but bloat reduces instruction-following quality
6. ~50-100 human-scored messages before trusting extraction — could be fewer/more based on inter-rater agreement

### Key Insights

1. **The bottleneck is calibration, not implementation.** The definitions are thorough. The schema is straightforward. The hard part is proving extraction works on real messages. Strategy: ship fast, log everything, calibrate with humans.

2. **Orthogonality is the highest-risk extraction problem.** Everything else (band mapping, drain alignment, formula compatibility) is structurally sound. The one thing that could fail is energy-telling correlation. The diagonal contrastive examples in the prompt are the critical defense.

3. **Evidence extraction quality is the constraint to watch.** If adding state extraction degrades evidence quality, the trade-off isn't worth it. Monitor evidence extraction metrics (yield, deviation distribution, polarity balance) after adding state signals. If they degrade, state extraction needs its own call.

4. **Telling has no baseline.** Energy can be compared against the old categorical (did "heavy" map to high energy? does "light" map to low?). Telling has no predecessor — the first human calibration round IS the baseline. This makes the human scoring protocol for telling especially important.

5. **The guardrails are load-bearing.** Six guardrails protect against systematic bias: eloquence ≠ intensity, sophistication ≠ investment, peak dimension not average, understated styles, length ≠ telling, comfortable analysis = steady. These aren't nice-to-haves — they're the first line of defense against the formula's biggest vulnerability (systematic over/under-scoring).

---

## SOLUTION GENERATION

### Methods Used

- **Systems Thinking** — traced what the formula needs from each signal back to the extraction contract
- **Morphological Analysis** — explored schema structure options (flat vs. nested, bands vs. continuous, single vs. multi-call)
- **Constraint-Driven Design** — shaped the prompt block around the 6 guardrails, positive anchors, and contrastive examples identified in elicitation
- **Party Mode (multi-agent)** — Winston (architecture), Amelia (implementation), Dr. Quinn (synthesis) collaborated on schema design, prompt ordering, and storage decisions

### Generated Solution: ConversAnalyzer v2 Extraction Spec

#### 1. Output Schema

The LLM outputs bands and reasons. The pipeline converts bands to numbers. Clean separation — the LLM classifies, code maps.

**LLM tool output (what Haiku produces — Effect Schema):**

```typescript
const EnergyBand = S.Literal("minimal", "low", "steady", "high", "very_high");

const TellingBand = S.Literal(
  "fully_compliant", "mostly_compliant", "mixed",
  "mostly_self_propelled", "strongly_self_propelled"
);

const UserState = S.Struct({
  energyBand: EnergyBand,
  tellingBand: TellingBand,
  energyReason: S.String.pipe(S.maxLength(200)),
  tellingReason: S.String.pipe(S.maxLength(200)),
  withinMessageShift: S.Boolean,
});

const ConversanalyzerToolOutput = S.Struct({
  userState: UserState,
  evidence: S.Array(EvidenceItem),  // existing, unchanged
});
```

**Pipeline output (after mapping, for formula + storage):**

```typescript
const ExtractedUserState = S.Struct({
  energy: S.Number,           // 0-10, mapped from band
  energyBand: EnergyBand,     // preserved for debugging
  telling: S.Number,          // 0-1, mapped from band
  tellingBand: TellingBand,   // preserved for debugging
  energyReason: S.String,
  tellingReason: S.String,
  withinMessageShift: S.Boolean,
});
```

**Design choices:**
- LLM outputs bands (enums), not numbers — more reliable classification
- Reasons are short strings (max 200 chars), not structured — keeps output compact while giving Haiku enough room for useful debugging info
- `withinMessageShift` is boolean — reasons capture the detail
- Evidence array unchanged — zero disruption to existing extraction
- `userState` comes FIRST in the schema (prompt attention ordering)
- `tokenUsage` computed by pipeline, not by LLM (unchanged)

#### 2. Band-to-Numeric Mapping

```typescript
const ENERGY_BAND_MAP: Record<EnergyBand, number> = {
  minimal:   1,
  low:       3,
  steady:    5,
  high:      7,
  very_high: 9,
};

const TELLING_BAND_MAP: Record<TellingBand, number> = {
  fully_compliant:         0.0,
  mostly_compliant:        0.25,
  mixed:                   0.5,
  mostly_self_propelled:   0.75,
  strongly_self_propelled: 1.0,
};
```

**Why these values:**
- Energy bands map to odd numbers (1,3,5,7,9) — centered on each band's range
- Telling bands map to quartiles (0.0, 0.25, 0.5, 0.75, 1.0) — evenly spaced across the trust function's input range
- E=5 ("steady") maps to the formula's comfort threshold (5.0) — zero drain cost. By design.
- T=0.5 ("mixed") maps to trust=1.0 (neutral) — formula treats ambiguous telling as "follow momentum normally"
- Room for future +/-1 sub-band adjustment on energy if needed

#### 3. Prompt Block (Ready to Insert)

Positioned BEFORE evidence extraction instructions in `buildPrompt()`. State extraction gets first attention; evidence extraction is already working and can tolerate being second.

```text
## USER STATE CLASSIFICATION

Before extracting evidence, classify the user's current conversational state on two independent axes. These signals feed the pacing system — they are NOT personality assessments.

### ENERGY — Observable conversational intensity/load

Score how much conversational intensity/load the user's latest message carries. This is used as a proxy for cost to the user.

Energy can come from ANY of these dimensions — one strongly present dimension is sufficient:
- Emotional activation (vulnerability, charge, feelings)
- Cognitive investment (wrestling with ideas, making connections, questioning self)
- Expressive investment (vivid detail, specificity, sensory language)
- Activation/urgency (animated, forceful, enthusiastic, alive)

IMPORTANT RULES:
- Score on an ABSOLUTE scale — do not anchor to recent conversation history
- Eloquence is NOT energy — beautiful writing about low-stakes topics is "steady"
- Sophistication is NOT cognitive investment — a calm elegant insight that came easily is "steady"
- Message length is NOT energy — a short devastating sentence can be "very_high"
- Fluent, effortless-sounding expression may indicate comfort, not cost
- If the message ends with a deflection after substantive content, score on the substantive content

ENERGY BANDS — classify into exactly one:

minimal — No real content, greeting, filler, logistics.
Example: "Yeah, it's fine."

low — Brief, low-activation, low-load reply.
Example: "I like cooking but I don't do it as much as I used to."

steady — Comfortable, engaged but not demanding. Sustainable indefinitely.
Example (short): "I've been getting into trail running lately — there's something about being outside that resets my head."
Example (longer): "I've been thinking about it and I do prefer working alone most of the time. It's not that I don't like people, I just get more done when I can focus without interruptions. I usually put headphones on even if I'm not listening to anything."
Example (quiet/reflective): "I'm not sure I deal with it well. I think I just push through and then feel tired later."

high — Clearly invested, effortful, vivid, or emotionally charged.
Example: "Oh man, don't even get me started — I literally rearranged my entire schedule around it, I was so locked in."

very_high — Strong intensity, high vulnerability or activation, consuming.
Example: "I've never told anyone this but I still have nightmares about it. I wake up and check the locks twice."

### TELLING — Self-propulsion relative to the previous assistant message

Score how much the user goes beyond the MINIMUM VIABLE ANSWER to the immediately preceding assistant message. This measures who is steering the conversation's meaning — the user or the prompt.

High-telling markers:
- Introduces material beyond what was asked
- Volunteers stories or examples unprompted
- Makes their own connections between ideas
- Reframes or redirects the question
- Asks questions back
- Chooses what to emphasize (prioritization = ownership)

Low-telling markers:
- Stays inside the question's frame
- Echoes the assistant's language rather than using their own
- Answers then stops — no expansion
- Waits for the next question (conversational passivity)

IMPORTANT RULES:
- Score RELATIVE to the previous assistant message — telling depends on what was asked
- A long, detailed, vivid answer is NOT automatically high-telling if it stays inside the prompt's frame
- A short answer CAN be high-telling if it reframes or redirects
- If the message shifts from compliant to self-propelled within its body, score the HIGHEST self-propulsion shown

TELLING BANDS — classify into exactly one:

fully_compliant — Answers only what was asked, minimal response, no expansion.
Nerin asks: "How do you usually handle disagreements?"
User: "I don't know, I usually just avoid them. I'm not great with conflict."

mostly_compliant — Thorough answer that stays within the question's frame. Detailed but not self-directed.
Nerin asks: "Tell me about a time you had to lead a group."
User: "At my last job I ran a product launch — 15 people, tight deadline. I ran standups, delegated design, handled client calls. We shipped on time. The CEO sent a company-wide email."

mixed — Some expansion beyond the prompt, but not clearly driving. Or ambiguous.
Nerin asks: "What's something you've never told anyone?"
User: "My dad left when I was five. I still check the driveway sometimes."

mostly_self_propelled — Expands significantly beyond the question. Introduces own material, threads, examples.
Nerin asks: "What do you find yourself doing when you have a free afternoon?"
User: "Oh man, woodworking. Hand-cut dovetails, no power tools. There's something about the smell of fresh-cut walnut. I reorganized my whole garage for a proper workbench. My wife thinks I'm insane."

strongly_self_propelled — Takes the wheel entirely. Reframes the question, makes own connections, steers meaning.
Nerin asks: "How do you handle stress at work?"
User: "I'm not sure 'handle' is the right word. I think I absorb it. Then it comes out in weird ways — like reorganizing my kitchen at midnight. I've started wondering if I even know what relaxed feels like."

### CRITICAL — ENERGY AND TELLING ARE INDEPENDENT

These axes must NOT correlate. A message can be ANY combination:
- high energy + high telling: The user is driving the conversation with intensity
- low energy + low telling: Minimal, passive response

And critically, these diagonal cases:

- high energy + low telling: An intense, detailed answer that stays INSIDE the prompt's frame.
  Nerin asks: "Tell me about a time you had to lead a group."
  User: "Oh yeah, at my last job — 15 people, tight deadline. I ran daily standups, delegated design, handled all client calls myself. We shipped on time, CEO sent a company-wide email. Honestly one of my best professional experiences."
  → Energy: high (vivid, animated, invested). Telling: mostly_compliant (answers exactly what was asked, does not expand the frame).

- low energy + high telling: A quiet, brief message where the user chooses their own direction.
  Nerin asks: "What's been on your mind lately?"
  User: "I've been thinking about how I never finish creative projects. I wonder if it's about the feeling of starting something new."
  → Energy: steady (calm, measured). Telling: mostly_self_propelled (chose the topic, made their own connection).

Do NOT assume that long/vivid = high telling or that short/quiet = low telling.

### WITHIN-MESSAGE SHIFT

Set withinMessageShift to true if the message noticeably shifts in energy or telling within its body (e.g., starts compliant then self-corrects into something deeper, or starts intense then deflects).
```

### Creative Alternatives Considered

**Alternative A: Continuous numeric output (0-10 and 0-1) instead of bands**
Rejected for v1. LLMs cannot reliably distinguish 0.63 from 0.68. Bands are more stable, and the formula's EMA handles quantization. Can revisit in v2 with a more capable model.

**Alternative B: Section-level extraction (score parts of a message independently)**
Rejected for v1. Adds segmentation noise, token cost, and schema complexity for a 5-10% edge case. The simple rule (final-energy, peak-telling) + shift flag handles 95%+ of cases. See multi-part message discussion.

**Alternative C: Separate LLM call for state extraction**
Rejected for v1 (cost). State and evidence are extracted in the same Haiku call. If prompt crowding degrades evidence quality at scale, a separate call can be introduced. Monitor evidence yield after adding state extraction.

**Alternative D: Quadrant classification instead of two independent axes**
Rejected. Quadrants (flow, performance, quiet authenticity, disengagement) are design language for reasoning about the state space, not extraction targets. Extracting quadrants directly would couple the extraction to the interpretation, and a single message may not clearly fall into one quadrant. Two independent axes are more robust.

**Alternative E: Include reasons as structured fields (separate energy_reason per dimension)**
Rejected for v1. Would require the LLM to produce 4 separate dimension assessments before aggregating, increasing output tokens significantly. A single short reason string is sufficient for debugging. Can add structured dimension scoring in v2 if single-reason debugging proves insufficient.

### Fail-Open Defaults (from Party Mode review)

If `userState` parsing fails, the LLM returns a malformed response, or Effect Schema validation rejects an invalid band value (e.g., misspelled literal):

```typescript
const FAIL_OPEN_USER_STATE: ExtractedUserState = {
  energy: 5,                    // steady — formula's comfort zone, zero drain
  energyBand: "steady",
  telling: null,                // formula defaults to trust=1.0
  tellingBand: null,
  energyReason: "extraction_failed",
  tellingReason: "extraction_failed",
  withinMessageShift: false,
};
```

This matches cold-start behavior — no active forces, comfortable default. The pipeline never breaks. The `"extraction_failed"` reason is visible in logs. If extraction failures exceed 5% of messages, investigate prompt issues.

### Evidence Quality Monitoring (from Party Mode review)

Adding state extraction to the existing Haiku call risks degrading evidence quality (the core product signal). Monitor continuously after shipping:
- Evidence count per message (should not trend downward)
- Deviation distribution (should not collapse toward a narrow range)
- Polarity balance (should stay near the 30% negative target)

If evidence metrics degrade, the state extraction prompt needs shortening or must move to a separate call. This is the one constraint that could force single-call → dual-call.

---

## SOLUTION EVALUATION

### Evaluation Criteria

| Criterion | Weight | How evaluated |
|-----------|--------|---------------|
| Energy definition precision | Critical | Can a human score any message within 1 band of the LLM using the rubric? |
| Telling definition precision | Critical | Does the rubric produce clear, defensible scores across the 12 validation scenarios? |
| Orthogonality | Critical | Do the diagonal contrastive examples prevent energy-telling collapse? |
| Formula compatibility | Critical | Does energy map correctly to drain (comfort=5.0)? Does telling map correctly to trust (0.5-1.2)? |
| Extraction reliability | High | Do anchored bands produce more stable scores than continuous output? |
| Implementation simplicity | High | How many files change? How much new infrastructure? |
| Evidence quality preservation | High | Does adding state extraction degrade evidence output? |
| Fail-open resilience | Moderate | Does the pipeline survive malformed LLM output? |

### Solution Analysis

**Criterion-by-criterion assessment:**

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Energy definition precision | **PASS** | 4 observable dimensions, 6 guardrails, 5 anchored bands with 6 example messages (including multi-sentence and quiet/reflective). Stress-tested through 7 scenarios + 5 additional stress tests. |
| Telling definition precision | **PASS** | "Minimum viable answer" framing, 6 high-telling markers, 4 low-telling markers, 5 anchored bands each paired with Nerin prompt + user response. Multi-part scoring rule (peak-telling) defined. |
| Orthogonality | **PASS** | Two mandatory diagonal contrastive examples embedded in the prompt block (high-E/low-T, low-E/high-T). Independence instruction is explicit. Validated through Red Team Attack 4 and Scenario 6 (the most important orthogonality test). |
| Formula compatibility | **PASS** | E=5 ("steady") = comfort threshold (zero drain). E=7 ("high") = 0.4 cost/turn, ceiling at 7.46 — barely constrains. E=9 ("very_high") = 0.8 cost/turn, strong protection. T=0.5 ("mixed") = trust 1.0 (neutral). Verified through First Principles Analysis. |
| Extraction reliability | **PASS (design)** | 5 bands per axis, mapped to fixed values. Formula's EMA handles quantization. Supported by formula noise tolerance analysis. **Unverified on real messages** — requires production data. |
| Implementation simplicity | **PASS** | One prompt change, one schema update, 7 DB columns added to existing table, band-to-numeric mapping function, fail-open handler. No new infrastructure, no new LLM calls. |
| Evidence quality preservation | **CONDITIONAL** | Prompt ordering (state first) mitigates attention budget risk. Evidence metrics monitored continuously post-ship. If degradation observed, state extraction moves to separate call. |
| Fail-open resilience | **PASS** | Explicit defaults defined: energy=5, telling=null, reasons="extraction_failed". Effect Schema Literal validation catches malformed bands. Pipeline never breaks. |

**Remaining risks:**

| Risk | Severity | Mitigation |
|------|----------|------------|
| Extraction untested on real messages | Medium | Ship, log, calibrate. Hybrid protocol (expert review + user self-scoring) defined. |
| Orthogonality may break on edge cases not in the 12 scenarios | Medium | Monitor energy-telling correlation coefficient across sessions. If r > 0.6, investigate prompt. |
| Evidence quality degradation from prompt crowding | Medium | Continuous monitoring. Fallback: separate call. |
| Telling-regression as Nerin improves | Low-Medium | Monitor median telling per session. Trigger: median < 0.4. |
| Haiku model updates change extraction behavior | Low | Pin model version. Re-run validation corpus on model upgrades. |

### Recommended Solution

**The ConversAnalyzer v2 extraction spec as designed:**

1. **Schema:** Effect Schema with `userState` block (energyBand, tellingBand, reasons, shift flag) alongside unchanged evidence array. LLM outputs bands, pipeline maps to numbers.
2. **Prompt block:** ~700 tokens of instruction positioned before evidence extraction. Definitions, 5 anchored bands per axis with positive examples, 6 guardrails, diagonal contrastive examples, multi-part scoring rule.
3. **Band mapping:** Energy (1/3/5/7/9), Telling (0.0/0.25/0.5/0.75/1.0). Fixed conversion, no LLM numeric output.
4. **Storage:** 7 columns added to `assessment_messages` table (Option A). No new tables.
5. **Fail-open:** energy=5, telling=null on extraction failure. Logged for monitoring.
6. **Calibration:** Expert review (20-30 messages, prompt compliance) + user self-scoring (post-session, 8-10 messages, 10-20 users, ground truth).

### Rationale

1. **Band-based extraction over continuous scoring.** LLMs classify into categories more reliably than they produce fine-grained numbers. The formula's EMA smoothing handles the quantization. This trades theoretical precision for practical stability — the right trade for v1.

2. **Single-call over dual-call.** Cost control. The prompt ordering (state first) and evidence monitoring mitigate the attention budget risk. If evidence degrades, we have a clear fallback (separate call) — but we don't pay for it until we need it.

3. **Positive anchors + guardrails over guardrails alone.** The prompt needs both "this IS what a 7 looks like" and "this is NOT what a 7 looks like." Anchors calibrate, guardrails protect against drift. Neither alone is sufficient.

4. **User self-scoring over external human scoring for calibration.** Energy is defined as cost to the user. The user knows their cost. External scorers infer cost from text — the same thing the LLM does. User self-scoring provides actual ground truth for the signal we're trying to approximate.

5. **Ship fast, calibrate with real data.** The definitions are stress-tested through 4 elicitation rounds. The implementation is small. The bottleneck is calibration confidence, which can only come from real messages. Every day spent refining the spec theoretically is a day not collecting real calibration data.

---

## 🚀 IMPLEMENTATION PLAN

### Implementation Approach

**Strategy: Phased rollout, ship-then-calibrate. Bundle with territory policy redesign.**

The extraction spec, the E_target formula, and the redesigned territory policy ship together as one integrated pacing system. Extraction and formula are ready; territory policy redesign happens in a separate problem-solving session. Once all three are complete, they deploy as a single unit.

**Phase 1 — Schema + Prompt + Pipeline wiring (this spec's implementation)**
- DB migration: add 7 columns to `assessment_messages`
- Effect Schema: `UserState` + `ExtractedUserState` types in `@workspace/domain`
- Band-to-numeric mapping functions in `@workspace/domain`
- Prompt update: insert state extraction block before evidence block in `buildPrompt()`
- Pipeline wiring: pass extracted state to `computeETarget()`
- Fail-open handler for malformed LLM output
- Update existing tests, add new extraction tests with the 12-scenario corpus

**Phase 2 — Territory policy redesign (separate session)**
- Redesign territory policy to consume E_target output and the two-axis state model
- This is a separate problem-solving session — different problem space, different constraints
- Blocked on: Phase 1 complete (territory policy needs to know the signals it receives)

**Phase 3 — Ship + Log (deploy the bundle)**
- Deploy extraction + formula + territory policy together
- Full state logging enabled (bands, reasons, shift flag stored per message)
- Monitor evidence extraction metrics (yield, deviation distribution, polarity balance)
- Monitor energy-telling correlation coefficient across sessions

**Phase 4 — Calibrate (prove it works)**
- Expert review: 20-30 messages scored blind against the rubric
- User self-scoring: post-session review with 10-20 users
- Compare LLM vs. human scores, identify systematic biases
- Adjust guardrails/anchors based on findings

### Action Steps

| # | Action | Depends on | Phase |
|---|--------|------------|-------|
| 1 | Add `UserState`, `ExtractedUserState` schemas to `@workspace/domain` | — | 1 |
| 2 | Add band-to-numeric mapping functions (`ENERGY_BAND_MAP`, `TELLING_BAND_MAP`) to `@workspace/domain` | — | 1 |
| 3 | DB migration: add 7 columns to `assessment_messages` table (`energy`, `energy_band`, `telling`, `telling_band`, `within_message_shift`, `state_notes`, `smoothed_energy`) | 1 | 1 |
| 4 | Update `AssessmentMessageRepository` interface + Drizzle implementation for new columns | 1, 3 | 1 |
| 5 | Update ConversAnalyzer prompt (`buildPrompt()`) — insert state extraction block before evidence instructions | 1 | 1 |
| 6 | Update ConversAnalyzer output schema to include `userState` in tool output | 1 | 1 |
| 7 | Add fail-open handler for state extraction failures (default: energy=5, telling=null) | 1, 6 | 1 |
| 8 | Wire extracted state through `nerin-pipeline.ts` to `computeETarget()` | 4, 6, 7 | 1 |
| 9 | Update mock repositories + existing tests for new schema | 4, 6 | 1 |
| 10 | Add validation tests using the 12-scenario corpus | 5, 6 | 1 |
| 11 | **Territory policy redesign** (separate problem-solving session) | Phase 1 complete | 2 |
| 12 | Deploy extraction + formula + territory policy as integrated bundle | 11 | 3 |
| 13 | Monitor evidence metrics for degradation (yield, deviation, polarity) | 12 | 3 |
| 14 | Monitor energy-telling correlation coefficient (target: r < 0.6) | 12 | 3 |
| 15 | Execute expert review calibration (20-30 messages, blind scoring) | 12 | 4 |
| 16 | Build post-session self-scoring flow (simple UI or script) | 12 | 4 |
| 17 | Execute user self-scoring calibration (8-10 messages per user, 10-20 users) | 16 | 4 |
| 18 | Analyze calibration data, adjust prompt guardrails/anchors if needed | 15, 17 | 4 |

### Timeline and Milestones

| Milestone | Gate criteria |
|-----------|-------------|
| **M1: Extraction spec implemented** | Steps 1-10 complete. All 12-scenario tests pass. Evidence extraction tests still pass. |
| **M2: Territory policy redesigned** | Step 11 complete. Separate problem-solving session produces territory policy spec. |
| **M3: Integrated pacing system shipped** | Steps 12-14. Extraction + formula + territory policy deployed together. Logging active. Evidence metrics stable. |
| **M4: Calibration complete** | Steps 15-18. Expert review: 80%+ agreement within 1 band. User self-scoring: systematic biases identified and addressed. |

### Resource Requirements

- **Code changes:** ConversAnalyzer prompt/schema, domain schemas, pipeline wiring, DB migration, tests — concentrated in existing files
- **Infrastructure:** None new. Same Haiku call, same DB table (expanded), same pipeline
- **Calibration:** ~20-30 messages for expert review (product builder scores blind). ~10-20 users for post-session self-scoring (requires simple scoring UI or script)
- **Separate session:** Territory policy redesign — its own problem-solving workflow

### Responsible Parties

| Role | Responsibility |
|------|---------------|
| Product builder (Vincentlay) | Implementation (Phases 1-3), expert review calibration, territory policy redesign session |
| Early users (10-20) | Post-session self-scoring during Phase 4 calibration |
| Monitoring (automated) | Evidence metrics, energy-telling correlation, extraction failure rate |

---

## 📈 MONITORING AND VALIDATION

### Success Metrics

| Metric | Target | How measured |
|--------|--------|-------------|
| **Expert-LLM band agreement** | 80%+ within 1 band | Blind expert scoring of 20-30 messages vs. LLM extraction |
| **User-LLM energy agreement** | Directional alignment (no systematic bias pattern) | Post-session self-scoring vs. LLM scores, 10-20 users |
| **Energy-telling correlation** | r < 0.6 across sessions | Pearson correlation on per-message (energy, telling) pairs |
| **Evidence extraction stability** | No degradation from pre-state baseline | Evidence count per message, deviation distribution, polarity balance |
| **Extraction failure rate** | < 5% of messages | Count of fail-open defaults triggered / total messages |
| **Median telling per session** | > 0.4 | Session-level median telling score across all sessions |
| **Formula drain alignment** | E=5 produces zero drain, E=7 produces moderate, E=9 produces strong | Spot-check computed drain values against expected behavior |

### Validation Plan

**Pre-ship validation (Phase 1):**
- Run the 12-scenario corpus through the prompt as unit tests — verify band classifications match expected values
- Verify band-to-numeric mapping produces correct formula inputs (E=5 at steady, T=0.5 at mixed)
- Verify fail-open handler returns correct defaults on malformed input
- Run existing evidence extraction tests — confirm no regressions

**Post-ship validation (Phase 3-4):**

1. **Evidence quality monitoring (continuous, automated)**
   - Compare evidence yield, deviation distribution, and polarity balance against pre-state-extraction baseline
   - If any metric degrades significantly, state extraction moves to a separate Haiku call
   - This is the one hard constraint — evidence quality is the core product signal

2. **Expert review (Phase 4, one-time + on prompt changes)**
   - Product builder scores 20-30 real messages blind (no LLM scores visible)
   - Uses the same band rubric from the prompt
   - Divergence threshold: agree within 1 band on 80%+ of messages
   - Focus areas: guardrail compliance (eloquence ≠ energy, length ≠ telling), diagonal cases (high-E/low-T, low-E/high-T)

3. **User self-scoring (Phase 4, first calibration round)**
   - Post-session, show user 8-10 of their own messages
   - Two simple scales with anchoring language:
     - Energy: "Compared to a casual text to a friend, how much more effort/intensity did this message cost you?" (minimal / a little / moderate / a lot / everything I had)
     - Telling: "Were you driving the conversation here, or responding to what Nerin asked?" (fully responding / mostly responding / mix / mostly driving / fully driving)
   - 10-20 users in the first round
   - Primary ground truth for energy-as-cost — user knows their own cost
   - Known biases: retrospective reconstruction, no shared baseline. Mitigated by anchoring language and fresh recall (scored immediately post-session).

4. **Correlation monitoring (continuous, automated)**
   - Compute Pearson r(energy, telling) per session and across sessions
   - If r > 0.6 consistently, the orthogonality guardrails are failing — investigate prompt, add more diagonal examples
   - Expected: moderate positive correlation (r ~0.3-0.4) is natural. r > 0.6 indicates collapse.

### Risk Mitigation

| Risk | Severity | Mitigation | Fallback |
|------|----------|------------|----------|
| Evidence quality degradation from prompt crowding | High | Prompt ordering (state first). Continuous evidence metric monitoring. | Move state extraction to separate Haiku call. |
| Systematic over-scoring of articulate/analytical users | High | 6 guardrails in prompt (eloquence ≠ energy, sophistication ≠ investment, etc.). Expert review specifically checks guardrail compliance. | Strengthen guardrails, add more contrastive examples for affected archetype. |
| Energy-telling correlation collapse | Medium | Diagonal contrastive examples in prompt. Correlation monitoring. | Add more diagonal examples. If persistent, add explicit "score energy first, then forget it and score telling" instruction. |
| Telling-regression as Nerin's prompts improve | Medium | Monitor median telling per session, by prompt type, before/after prompt changes. | If median < 0.4, investigate whether extractor is measuring self-propulsion or prompt openness. Recalibrate "minimum viable answer" floor. |
| Haiku model updates change extraction behavior | Low | Pin model version. | Re-run 12-scenario corpus on model upgrades. Adjust prompt if needed. |
| Extraction failure rate spikes | Low | Fail-open defaults (energy=5, telling=null). "extraction_failed" logged in reasons. | If > 5%, investigate schema validation errors or prompt issues. |

### Adjustment Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Evidence yield drops | > 10% decline from baseline | Investigate prompt crowding. If confirmed, move state extraction to separate call. |
| Expert-LLM disagreement | < 80% within 1 band | Review disagreement cases. Identify which guardrails are failing. Update prompt anchors/examples. |
| User-LLM systematic bias | Consistent directional divergence across 5+ users | Identify which user archetype is affected. Adjust guardrail language or add archetype-specific anchor. |
| Energy-telling correlation | r > 0.6 for 3+ consecutive sessions | Add diagonal contrastive examples. Consider explicit sequential scoring instruction. |
| Median telling drops | Below 0.4 across sessions | Investigate minimum-viable-answer calibration. Check if Nerin prompt changes raised the floor. |
| Extraction failures | > 5% of messages | Check schema validation errors, LLM output format. Fix prompt or schema. |
| Formula drain misalignment | Steady engagement (E~5) producing non-zero drain | Check band mapping. Verify comfort threshold alignment. |

---

## 📝 LESSONS LEARNED

### Key Learnings

_Skipped_

### What Worked

_Skipped_

### What to Avoid

_Skipped_

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_