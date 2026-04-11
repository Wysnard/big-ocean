# Skill Cohesion Analysis: portrait-rubric

**Scanner:** SkillCohesionBot
**Target:** `/Users/vincentlay/Projects/big-ocean/.claude/skills/portrait-rubric`
**Date:** 2026-04-11

---

## Assessment

This is a **tight, high-cohesion skill**. It is a single-purpose evaluator — not a multi-stage workflow — and it recognizes that about itself. The SKILL.md and the judge prompt form a clean two-file contract: SKILL.md handles routing, I/O, and persistence; `rubric-judge-prompt.md` is the self-contained evaluation artifact. The purpose, role guidance, process, and output format all reinforce one goal (stable, calibrated rubric scoring that can detect regression over time), and the skill is honest about its limits (no v1 anchoring examples, drift is a named risk).

The main cohesion risks are not about structure — they are about **a few small gaps between what SKILL.md promises and what a downstream executor can actually do without guesswork** (baseline file format, output capping rule location, corpus flag-aggregation rules).

---

## Cohesion Dimensions

### 1. Stage Flow Coherence — **Strong**

This isn't a staged workflow; it's a single evaluation loop with clear sub-steps: load portrait → load judge prompt → compose evaluation → produce JSON → save → print markdown. Each step produces exactly what the next step needs, and the final step (print markdown) matches the declared output. There is no ambiguity about entry points — the "Input modes" section enumerates 5 routes and collapses ambiguous cases with "ask once rather than guessing." That's a good pattern.

The corpus and baseline modes layer cleanly on top of the single-portrait loop rather than introducing a parallel path. No dead-end stages.

### 2. Purpose Alignment — **Strong, with one subtle execution gap**

Purpose ("evaluate portrait against 7 dimensions, return stable JSON + human summary") is mirrored precisely in the process. Role guidance ("rigorous but fair judge... stay calibrated... be willing to give 1 or 2") is directly reinforced by the judge prompt's calibration cues and its explicit "the rubric is only useful if it can fail a portrait." The non-negotiable design principles from PORTRAIT_CONTEXT are carried into the rubric as flagging criteria — that's a rare and valuable level of alignment.

**The one promise-vs-behavior gap:** SKILL.md Step 4 says "return a JSON object matching the schema defined in the judge prompt," and the judge prompt ends with "Return only the JSON. No preamble, no postscript, no markdown fences." But Step 6 of SKILL.md says "Print the markdown summary to the user." The skill's executor (Claude) must produce JSON first, save it, *then* produce a markdown summary. This is fine, but the judge prompt explicitly forbids anything but JSON — which creates a subtle tension: is the executor the same agent as "the judge"? If yes, then the judge's "return only the JSON" rule will cause a well-behaved executor to stop there and skip the markdown print. Worth clarifying in SKILL.md that the judge-prompt JSON constraint applies to the evaluation step, and the skill then transforms that JSON into the user-facing markdown table.

### 3. Complexity Appropriateness — **Strong**

This is one of the cleanest complexity matches I've reviewed: a single-task evaluator uses a single file for routing + a single reference for the evaluation artifact. No stage bureaucracy, no ceremonial validation passes, no over-engineered branching. The five input modes are a genuine decision space, not decorative branching. The skill intentionally defers v2 calibration anchors to a future version rather than shipping fake ones — good restraint.

The only place where complexity could be questioned is: should baseline mode be a separate skill or sub-command? I think it's correctly kept here because it reuses 100% of the scoring machinery and only adds a diff step.

### 4. Gap & Redundancy Detection — **Moderate**

No redundancies — every section of SKILL.md earns its keep. The gaps are small but worth naming:

- **Baseline file format is undefined.** SKILL.md says `--baseline <path-to-prior-corpus-json>`, and corpus mode saves `{ rubric_version, timestamp, results: [...] }`. Presumably `results` is an array of the same per-portrait JSON objects, but neither file says so explicitly. A downstream executor building the diff has to infer the shape.
- **Regression threshold lives in only one place.** "> 0.5 points" is mentioned twice (input modes + process), but the rule "which field is being compared — per-portrait score, per-portrait overall, corpus median per dimension?" is ambiguous. The process step says "any dimension median dropping > 0.5 points across the corpus" which is clearer, but the input-modes line says "per-dimension deltas, flag any regression > 0.5 points on any dimension" which sounds per-portrait. Reconcile these.
- **The overall_score cap rule lives only in the judge prompt.** The "if insight_beneath_observation ≤2, cap overall_score at 2.5" rule is critical to the rubric's philosophy and appears in the judge prompt JSON rules. SKILL.md's scoring principles say "Overall can be a fractional average" but doesn't mention the cap. If a future maintainer edits SKILL.md's scoring principles, they might not realize the cap lives in the judge prompt. Mention it in SKILL.md too, or explicitly defer ("overall score computation rules live in the judge prompt").
- **Corpus-mode markdown has no specified column for flags.** The single-portrait format has a "Flags" line, but the corpus table format says "one row per portrait showing all 7 dimension scores plus overall" — no flag column. For a regression scan, flag presence is arguably more signal than raw scores. Consider including a "flags" column or a flag-summary section.
- **No explicit handling of what happens when the judge returns invalid JSON.** If the evaluation produces malformed JSON (e.g., missing a dimension), the skill has no fallback — it will presumably fail at the save step. A single line like "if JSON fails schema check, re-evaluate once with an explicit schema reminder" would make the skill more resilient for corpus runs where one bad portrait shouldn't kill the batch.

None of these are "high severity" — the skill is usable as written — but they're the places where a careful executor would have to make a judgment call.

### 5. Dependency Graph Logic — **N/A (single-stage)**

There are no `after`/`before`/`is-required` dependencies to validate because this skill is not decomposed into stages with explicit dependencies. The implicit sequential flow inside the process section is correct and minimal.

### 6. External Skill Integration Coherence — **Strong**

The skill references two external contexts: the BMad improvement plan (`_bmad-output/problem-solution-2026-04-11.md`) as rationale for why the rubric exists, and the project's `PORTRAIT_CONTEXT` as the source of truth for the non-negotiable rules. Both are used for **grounding**, not for execution, which is the right move — the skill doesn't call external skills or depend on runtime orchestration. It also plants two forward hooks: v2 anchoring examples from `_llm-test-output/*.md`, and production metrics. These are documented as future work rather than implicit dependencies. Clean.

---

## Key Findings

### Medium severity

**M1. Ambiguous judge-vs-executor boundary around output.**
The judge prompt ends with "Return only the JSON. No preamble, no postscript, no markdown fences." SKILL.md then asks the same executor to print a markdown summary. A literal reading of the judge prompt would cause the executor to stop at JSON. Clarify in SKILL.md that the judge-prompt JSON-only rule applies to the *evaluation step*, and the skill then derives the markdown summary from the saved JSON. One sentence fixes it.

**M2. `overall_score` cap rule is invisible from SKILL.md.**
The "≤2 insight → cap at 2.5" rule is a philosophical centerpiece of the rubric and lives only in the judge prompt's schema rules. SKILL.md's "Scoring principles" bullet "Overall can be a fractional average" understates this. A maintainer editing SKILL.md independently could drift. Add a bullet in SKILL.md's scoring principles that cross-references the cap, or at minimum says "overall score computation (including the inferential-depth cap) is defined in the judge prompt."

**M3. Baseline comparison data model is underspecified.**
SKILL.md promises baseline comparison but never states the baseline file's schema or how deltas are computed (mean? median? per-portrait matched by id? matched by slot?). If two consecutive runs have different portraits (e.g., new portrait added), the diff rule is undefined. For a regression-detection tool this is the highest-value place to be unambiguous.

### Low severity

**L1. Regression threshold semantic is restated two ways.**
Input modes says "per-dimension deltas, flag any regression > 0.5 points on any dimension" (sounds per-portrait); Process says "any dimension median dropping > 0.5 points across the corpus" (corpus-level). Pick one and stick to it — or explicitly say both are flagged at different levels.

**L2. Corpus markdown has no flag column.**
Flag-bearing portraits are more interesting than low-scoring ones during regression scans. Consider a column or a "Flagged portraits" section after the table.

**L3. No JSON-validation fallback.**
A single malformed evaluation will break corpus mode's aggregate save. A one-line recovery rule ("if parsing fails, reissue the evaluation once with a schema reminder; if still failing, mark that portrait's entry as error and continue") would harden the skill for real-world use.

### Suggestion

**S1. Expose `rubric_version` bumping rules.**
The skill claims "rubric_version: 1.0" and plans a v2 with anchoring examples. Worth stating explicitly when the version must bump: any change to dimension wording, any change to calibration cues, any change to JSON schema. This protects historical baseline comparisons from comparing apples to oranges.

**S2. Drift detection as a first-class output.**
The skill's "Anchoring examples" section says "if you notice your scores drifting across runs on the same portrait, that's a signal the calibration anchors are needed — flag it to the user." This is excellent but currently lives only in prose. A simple mechanic: in baseline mode, when the same portrait_id scored differently this run vs. the baseline by > 1 point on any dimension **without content changes**, print a "CALIBRATION DRIFT" warning distinct from regression warnings. Regression and drift are different failures and deserve different flags.

**S3. Seed corpus declaration.**
Since this rubric gates exit criteria across multiple phases of an improvement plan, consider documenting (or linking to) the canonical regression corpus — the specific set of portrait files the rubric should be run against at each phase gate. Otherwise different runs may use different corpora and the baseline-comparison numbers become meaningless.

---

## Strengths (preserve these)

- **Single-purpose clarity.** The skill knows exactly what it is: a scoring function with persistence. It resists the temptation to become a "portrait QA suite" with writer/editor/linter sub-skills.
- **Design-intent loaded into the judge prompt.** Most rubrics bolt quality dimensions onto creative work from outside; this one inherits the portrait generator's own non-negotiable rules and turns them into flagging criteria. That's rare cohesion between a generator and its evaluator.
- **Calibration discipline is named as a failure mode.** The skill explicitly warns the executor that score drift destroys the tool's value, and ties calibration to the 1/3/5 cues. Most rubric skills skip this and silently inflate over time.
- **The load-bearing dimension mechanic.** Elevating `insight_beneath_observation` above the mean (via the 2.5 cap) is an honest, non-average-based quality model — a portrait cannot arithmetic its way out of shallow reading. This is the rubric's sharpest tooth and should be protected across future revisions.
- **Input-mode routing is exhaustive and collapses ambiguity with "ask once."** Good UX for both interactive and batch use.
- **v2 deferral is honest.** The anchoring-examples work is called out as a known-missing piece rather than faked with weak examples. Ships what's ready, names what isn't.
- **Role guidance matches behavior.** "Not the writer, not a cheerleader" isn't just decoration — it shapes the prohibition on rewriting and the willingness-to-give-low-scores rule.

---

## Creative Suggestions

- **Per-dimension confidence, not just score.** A 5-with-low-confidence is a more useful signal than a 5 alone, especially in a rubric that admits its v1 calibration is shaky. Optional `confidence: "low" | "medium" | "high"` field would let downstream tools weight drift detection more intelligently.
- **"Portrait archetype" side-channel.** In corpus mode, cluster portraits by their flag profiles ("warmth-before-depth violators," "no-unresolved-cost," "strong-spine-weak-arc"). Patterns across a corpus reveal systemic generator bugs faster than looking at individual scores.
- **Before/after diff view for improvement runs.** When the user is regressing a specific portrait through the generator's improvement plan phases, a side-by-side "old score | new score | delta | notable flag changes" view on that single portrait would let them judge whether Phase 2/3/4a actually moved the needle faster than reading two separate reports.
- **Negative anchors from the judge prompt itself.** The judge prompt already lists anti-patterns ("clinical, horoscope, flattery, hedging"). When scoring voice at 1 or 2, the rationale could be required to name *which* anti-pattern triggered the score. Tightens reliability and gives the generator actionable feedback.
- **A "write the rubric to disk before scoring" step.** Since the judge prompt is the calibration surface, saving a copy of `rubric-judge-prompt.md` alongside each run (or recording its content hash in the JSON) would let future analyses verify whether historical scores were produced against the same rubric version. Protects longitudinal comparisons from silent edits.
