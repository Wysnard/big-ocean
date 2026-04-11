# Prompt Craft Analysis — portrait-rubric

**Skill path:** `/Users/vincentlay/Projects/big-ocean/.claude/skills/portrait-rubric`
**Scanned:** 2026-04-11
**Scanner:** quality-scan-prompt-craft

---

## Assessment

**Skill type:** Single-purpose evaluation/judgment utility. The skill takes a portrait (text or file[s]), applies a 7-dimension rubric via a judge prompt, and returns structured JSON + a markdown summary. It has light input-mode branching (inline / file / corpus / baseline / no-args) but no multi-stage workflow — execution is a single act of judgment plus I/O around it.

**Overview quality:** The SKILL.md does not use an `## Overview` header, but the pre-pass's "0 overview lines" metric is misleading in this case. The `## Purpose` section at lines 8–14 is doing the Overview's job: it states the mission (evaluate a portrait against a 7-dimension rubric), explains why the rubric matters (load-bearing quality gate for Phases 2–4a of the improvement plan, periodic audit tool), and — critically — surfaces the design rationale that `insight_beneath_observation` is the single most important dimension. The `## How to act` section (lines 16–21) adds strong theory-of-mind framing for the judging agent: "fair but rigorous," "not a cheerleader," "stay calibrated." Together, Purpose + How-to-act function as a well-formed Overview even though they aren't labeled as one.

**Progressive disclosure:** Correctly applied. SKILL.md stays at 91 lines / ~1.8K tokens. The heavy lifting — design intent, non-negotiable rules, 7 dimension calibrations, JSON schema — lives in `references/rubric-judge-prompt.md` (~13KB), which is loaded on demand in Process step 2. This is exactly the right place for it: the rubric definitions are context the **judge** needs at evaluation time, not context the **dispatcher** needs on every activation.

**Synthesis:** This is a well-crafted single-purpose skill that correctly treats the rubric as a load-on-demand reference rather than inlining it. The top-level SKILL.md is lean, the judge prompt is self-contained, and the design rationale (why insight is load-bearing, why calibration drift matters) is preserved where it affects behavior. The main gaps are structural conformance to the scanner's expected shape — no labeled `## Overview`, no `*.md` stage prompts at root — rather than craft failures. A small amount of procedural detail around file paths and the no-preamble JSON contract could be tightened, but nothing is broken.

---

## Prompt Health Summary

| Metric | Count |
|---|---|
| Stage prompts at root (`*.md` excluding SKILL.md) | 0 |
| Prompts with config header | N/A (no stage prompts) |
| Prompts with progression conditions | N/A (no stage prompts) |
| Reference files | 1 (`references/rubric-judge-prompt.md`) |
| SKILL.md size | 91 lines / ~1766 tokens |
| Judge prompt size | 191 lines / ~13KB |

**Note:** The pre-pass flags `total_prompts: 0` and `prompts_with_config_header: 0`. This is a structural fact, not a defect for this skill type. The judge prompt is the only "stage" and it lives in `references/` because it is loaded once per portrait rather than orchestrated as a multi-stage workflow. The skill would not benefit from a BMad-style config header (`{communication_language}` etc.) because the judge prompt demands pure JSON output and the markdown summary is a fixed format — there is no natural-language surface that needs language configuration.

**Self-containment of the judge prompt:** Strong. `references/rubric-judge-prompt.md` opens by restating its role ("you — the judge — read this file in full, then read the portrait text, then produce a structured evaluation"), re-declares the design intent and non-negotiable rules, and embeds the JSON schema inline. If context compaction dropped SKILL.md entirely, the judge prompt would still produce correct output. This is exactly the compaction-survival behavior the scanner looks for.

---

## Key Findings

### Medium — SKILL.md Overview is functionally present but not structurally labeled
**File:** `SKILL.md:6–21`
**What's wrong:** The skill has no `## Overview` heading. Purpose (lines 8–14) and How to act (lines 16–21) together contain everything an Overview should contain — mission, rationale, load-bearing dimension warning, theory of mind for the judging agent — but they are split across two headings and the pre-pass metric reports `overview_lines: 0`. Downstream tooling that greps for `## Overview` will miss this.
**Why it matters:** Low behavioral risk (the content is there and a careful reader finds it immediately), but higher tooling/conformance risk. It also slightly obscures that the Purpose block is doing Overview work — a future maintainer trimming "purpose" for leanness could accidentally strip mission context.
**Fix:** Rename `## Purpose` to `## Overview`, or add an `## Overview` that subsumes both Purpose and How to act. Keep all current content — it's all load-bearing. No token reduction needed.

### Medium — "Process" prescribes file-path micro-mechanics that should live with the judge prompt
**File:** `SKILL.md:34–47`
**What's wrong:** Step 5 hardcodes the output path `_bmad-output/portrait-rubric-runs/<YYYY-MM-DD-HHMM>-<portrait_id>.json`, and the corpus/baseline branches repeat similar path conventions. This is a moderate amount of procedural detail about I/O that mixes with the judgment workflow.
**Why it matters:** Not a severe issue — the paths are specific, non-obvious to the LLM (they reflect project convention), and belong somewhere. The concern is that they're inside `## Process` alongside the load-portrait / load-prompt / evaluate steps, which makes the whole section read as "procedural recipe." This pushes the reader past the judgment framing into clerical mode. A smaller concern: the "create the directory if it doesn't exist" note is defensive padding — any agent running a Write tool already handles this.
**Fix (optional):** Either (a) split Process into "Evaluation" (steps 1–4) and "Output persistence" (steps 5–6), or (b) leave as-is and drop the "Create the directory if it doesn't exist" clause. This is a tightening, not a correction.

### Low — "Anchoring examples" section is design-time meta-note rather than runtime instruction
**File:** `SKILL.md:86–90`
**What's wrong:** The section explains that v1 ships without anchoring examples and that a v2 curation task is planned. It also tells the agent to flag calibration drift to the user. The first half is project-note content aimed at the human maintainer (the skill author), not runtime guidance for the judge; the second half ("flag calibration drift") is a real runtime instruction buried underneath the project-note.
**Why it matters:** Minor token waste + mild attention dilution. The v2 plan does not change how the agent scores a portrait today. Keeping it in SKILL.md also mixes roadmap content with execution content, which weakens the signal of the rest of the file.
**Fix:** Keep the runtime instruction ("If you notice your scores drifting across runs on the same portrait, flag it to the user and suggest curation") and move the v1/v2 rationale into a separate `docs/` note or inline comment in the judge prompt. Or compress to a single sentence: "v1 ships without 1/3/5 anchoring examples per dimension; if you notice scores drifting on the same portrait, flag it to the user."

### Low — "Scoring principles" partially duplicates judge-prompt calibration content
**File:** `SKILL.md:78–84` vs `references/rubric-judge-prompt.md:47, 176`
**What's wrong:** "Integers only" appears in both files. "Be willing to give 1 or 2" appears in both files. "Cite evidence" appears in both files. The insight-cap rule ("if `insight_beneath_observation` is ≤2, the portrait fails") appears in the take-framing instruction in SKILL.md line 84 and in the overall_score cap in the judge prompt's JSON rules (line 176). The two statements are consistent but not identical (SKILL.md says "fails regardless of other scores — note this in the take"; judge prompt says "cap the `overall_score` at 2.5"). Neither is wrong, but the duplication means a future edit could drift them.
**Why it matters:** Minor redundancy, minor drift risk. The SKILL.md version is the "outer" framing (what the invoking agent should know), the judge-prompt version is the contract the judge must honor. Both are arguably load-bearing, so removing either risks losing context at one layer.
**Fix:** Leave as-is (acceptable duplication for compaction-survival), OR promote the judge prompt's scoring rules as the single source of truth and replace SKILL.md's Scoring principles with a one-line pointer: "See `references/rubric-judge-prompt.md` for scoring rules — the judge prompt is authoritative." The second form is leaner but reduces compaction resilience, so only take it if you are confident SKILL.md will always be in context.

### Low — Minor defensive padding and filler
**Files and lines:**
- `SKILL.md:32` — "If the user's intent is ambiguous (e.g., they point at a directory but you're not sure if they want all files or a specific one), ask once rather than guessing." This is borderline — it is genuine routing guidance, but the example clause adds length. Acceptable.
- `SKILL.md:41` — "Include specific evidence (verbatim phrases from the portrait) where possible; vague justifications like 'the portrait felt deep' are not acceptable." Restates a rule that the judge prompt already enforces at lines 47 and 177. Mild duplication.
- `references/rubric-judge-prompt.md:6` — "When invoked, you — the judge — read this file in full, then read the portrait text, then produce a structured evaluation. You do not edit or rewrite." The "You do not edit or rewrite" clause is valuable (explicit role boundary). "read this file in full" is slightly defensive — the file is already being read. Keep.

**Why it matters:** Not much. These are the only visible waste sources and together they amount to maybe 30–50 tokens. Not worth a dedicated pass unless the skill is being tightened for another reason.

**Fix:** No action required. Note for a future cleanup pass if one happens.

### Note — No script-opportunities leaks visible here
**Evidence:** The skill has no script files, and the judgment work (scoring, evidence citation, calibration) is correctly placed in the LLM layer. File I/O (read portrait, write JSON, create directory) is LLM-instructed but the operations are trivial Read/Write tool calls, not regex classification of meaning. There is no "intelligence leaking into scripts" pattern here, and no "prompts doing deterministic work that should be scripted" pattern either — the corpus aggregation step and per-dimension median computation are the closest candidates, and both are light enough that the LLM handling them is fine. L6 (script-opportunities scanner) can confirm, but from a prompt-craft lens this is clean.

### Note — The judge prompt's self-containment is exemplary
**File:** `references/rubric-judge-prompt.md:1–191`
**Observation:** The judge prompt is structured to survive invocation entirely independently of SKILL.md. It re-states the portrait's design intent, the non-negotiables, the voice rules, all 7 dimension calibrations with 1/3/5 anchors, the full JSON schema, and closes with "Final instructions to the judge" plus the "Portrait to evaluate:" delimiter at line 189. This is the right shape for a reference that is composed into an evaluation — the judge reads this once and has everything it needs. Preserve this.

### Note — "Informed Autonomy" principle is well-served
**Observation:** The scanner's core principle is that prompts should give the executing agent enough context to improvise intelligently. This skill does that well. Examples:
- The "insight is load-bearing" guidance appears three times (SKILL.md purpose, SKILL.md scoring principles, judge prompt dimension 1) in different framings. A careless reader might call this repetition; in practice it means every exit point from context compaction still preserves the single most important rule.
- The "stay calibrated" coaching in `How to act` is exactly the kind of theory-of-mind note that changes behavior — it pre-empts score inflation drift, which is the specific failure mode this rubric is trying to detect.
- The design rationale block in the judge prompt ("make the reader feel like a book they haven't finished reading") is not strictly necessary to score a portrait, but it gives the judge the mission context to handle edge cases the 7 dimensions don't explicitly cover (e.g., a portrait that scores 4s across the board but fails the "outlasts the reading" test).

---

## Strengths (Worth Preserving)

1. **Judge prompt isolation.** Moving the 13KB rubric into `references/` is textbook progressive disclosure. SKILL.md stays ~1.8K tokens; the rubric loads only when a portrait is being scored. Do not inline it.
2. **Load-bearing dimension surfacing.** `insight_beneath_observation` is flagged in the Purpose block, in Scoring principles, in the judge prompt's dimension definition, and in the JSON schema's overall_score cap rule. Four touchpoints for the most important concept is good engineering, not duplication.
3. **Theory-of-mind framing for the judge.** Lines 18–21 ("fair but rigorous," "not a cheerleader," "stay calibrated — the 1/3/5 cues are the calibration anchor") shape the judging agent's entire posture without prescribing procedure. This is the right level of coaching for a judgment-heavy skill.
4. **Explicit failure modes and anchors.** The judge prompt gives 1/3/5 calibration cues per dimension with concrete failing signals ("the thread could equally describe a dozen other people"). The agent has specific language to attach to scores, which is what regression detection needs.
5. **Self-contained judge prompt.** `references/rubric-judge-prompt.md` works independently of SKILL.md. If context compacts, the judge can still score correctly from the reference alone. This is the compaction-survival standard.
6. **JSON output contract is unambiguous.** Schema inline, "return only the JSON, no preamble, no postscript, no markdown fences" (line 180), and the insight-cap rule is spelled out explicitly. Downstream tooling can rely on this.
7. **Design-intent rationale is explicit.** The "book they haven't finished reading" framing and the three-move arc → six-movement arc mapping live in the judge prompt where the scoring happens. Rationale-at-decision-point is the right pattern.
8. **Input-mode routing is clean.** Lines 22–32 cover five input modes in a compact numbered list with the correct "ask once rather than guessing" fallback for ambiguity. Not a branching workflow in the stage-prompt sense, just clear dispatcher logic.

---

## Summary

The portrait-rubric skill is a well-crafted single-purpose judgment utility. Its only structural deviation from the scanner's expected shape is that it uses `## Purpose` / `## How to act` where a labeled `## Overview` would be cleaner, and it has no root-level stage prompts because it does not need them — the judge prompt correctly lives in `references/`. The findings above are all Medium or below; none affect correctness or meaningfully degrade efficiency. The strongest recommendations are cosmetic (rename Purpose → Overview) and one minor cleanup of the v1/v2 roadmap note. The skill is ready for production use as-is.
