---
name: portrait-rubric
description: Score a Big Ocean Nerin portrait against 7 quality dimensions (insight, spine, arc, coined-phrase, self-compelling, voice, emotional stake). Use when the user says "/portrait-rubric", "score this portrait", "run the rubric", or provides a portrait file for quality evaluation.
---

# Portrait Rubric

## Overview

Evaluate a Big Ocean portrait (the long-form personalized letter produced by the portrait generator) against a 7-dimension quality rubric, returning stable JSON scores plus a human-readable summary.

This rubric is the load-bearing quality measurement tool for the portrait-generator improvement plan (`_bmad-output/problem-solution-2026-04-11.md`). It gates exit criteria at every phase of that plan — Phase 2 (conversation compression must not regress quality), Phase 3 (spine must be fixed AND the inferential-depth dimension must lift), Phase 4a (Haiku prose test must hold voice quality). Once the plan is in production, the rubric is also the periodic quality audit tool.

**The most important dimension is `insight_beneath_observation`.** A portrait that only summarizes what the user explicitly said is a failure even if every other dimension scores well. Surface this dimension first in the summary; watch it most closely across runs.

## On Activation

Fires when the user says "/portrait-rubric", "score this portrait", "run the rubric", "evaluate this portrait", or provides a portrait file (`.md` in `_llm-test-output/` or similar) and asks for quality scoring. Also fires on direct invocation with arguments like a file path, directory, or `--baseline <path>`.

## How to act

You are a rigorous but fair judge applying a well-defined rubric to creative writing. You are not the writer — do not rewrite or edit the portrait. You are not a cheerleader — do not inflate scores to be encouraging. Score what you see against the dimension definitions, cite specific evidence, and be willing to give a 1 or a 2 when the portrait earns one.

Your judgments feed a regression-tracking system. If your scores drift up over time because you're being generous, the system loses its ability to detect quality regressions. **Stay calibrated — the 1/3/5 cues in the judge prompt are the calibration anchor.**

## Input modes

Route on what the user provides:

1. **Single portrait, inline text** — they paste portrait text directly. `portrait_id = "inline"`.
2. **Single portrait, file path** — a single `.md` or `.txt` file. `portrait_id = basename without extension`.
3. **Corpus mode** — a directory, glob, or multiple paths. Score each portrait, then aggregate into a comparison table. Use a shared run timestamp across the batch.
4. **Baseline comparison** — user passes `--baseline <path-to-prior-corpus-json>`. Run corpus mode, then diff current results against the baseline.
5. **No args** — ask the user what they want to score.

If the user's intent is ambiguous (e.g., they point at a directory but you're not sure if they want all files or a specific one), ask once rather than guessing.

## Process

### Single-portrait mode

Judgment responsibilities (what you decide):

1. **Read the judge prompt** — load `./references/rubric-judge-prompt.md` in full.
2. **Read the portrait text** — the file or the pasted text.
3. **Apply the rubric** — score each of the 7 dimensions against the calibration cues. Cite specific evidence from the portrait.
4. **Emit the raw JSON** in the schema defined in the judge prompt. Leave `rubric_prompt_sha` as the placeholder `"<computed>"` — `finalize.py` fills it in. Do not attempt to compute the hash yourself. Leave your `overall_score` as your best-effort mean; `finalize.py` will recompute and apply the insight-cap rule deterministically.

Execution mechanics (what you do mechanically):

1. Write the raw JSON to `_bmad-output/portrait-rubric-runs/<YYYY-MM-DD-HHMM>-<portrait_id>.raw.json`.
2. **Run the validator:** `python3 .claude/skills/portrait-rubric/scripts/finalize.py validate <raw-json-path> --judge-prompt .claude/skills/portrait-rubric/references/rubric-judge-prompt.md --out <final-json-path>` where the final path drops `.raw`. The validator checks the schema, computes the judge-prompt hash, and enforces the insight-cap rule deterministically.
3. **If validation fails**, read the error, re-examine the portrait, fix the specific issue (missing field, out-of-range score, etc.), and re-emit. Do not commit a JSON that failed validation.
4. **Print the markdown summary** using the finalized JSON (not the raw one).

### Corpus mode

Judgment responsibilities:

1. **Read the judge prompt once.** Load `./references/rubric-judge-prompt.md` one time as shared setup for the whole batch.
2. **Dispatch portraits in parallel.** For 2+ portraits, score them in parallel rather than sequentially — each portrait is independent and parallelization is a straight latency win. Use parallel Read calls or parallel subagent dispatches as appropriate for the batch size. Sequential scoring for a 25-portrait corpus is a 25× latency regression vs. parallel.
3. **Score each portrait individually** using the single-portrait rubric flow above. Each produces its own validated JSON.

Execution mechanics:

1. Collect all finalized per-portrait JSONs into a shared run directory.
2. **Run the aggregator:** `python3 .claude/skills/portrait-rubric/scripts/finalize.py aggregate <run-directory> --out <corpus-json-path>`. Produces `{ rubric_version, rubric_prompt_sha, timestamp, results: [...], medians: {...}, means: {...} }`. Medians and means are computed deterministically — do not compute them yourself.
3. **Print the comparison table** in markdown using the aggregate JSON (one row per portrait, one column per dimension, plus a median row).

### Baseline comparison mode

Judgment responsibilities:

1. Run the full corpus mode flow above. Produce a current-run aggregate JSON.
2. **Do not compute regressions yourself.** The deterministic diff tool handles it.

Execution mechanics:

1. **Run the diff tool:** `python3 .claude/skills/portrait-rubric/scripts/finalize.py diff <current-corpus-json> <baseline-corpus-json> --threshold 0.5 --out <diff-json-path>`. The tool computes per-dimension median deltas and flags any dimension that dropped by more than the threshold (default 0.5).
2. **Print the regression report** using the diff JSON. Lead with the regressions if any, otherwise state "no regressions detected."

## Output format

**Single-portrait markdown summary:**

```
Portrait: <portrait_id>
Rubric version: 1.0
Judge prompt SHA: <first 8 chars of rubric_prompt_sha>

| Dimension                    | Score | Rationale                               |
|------------------------------|-------|-----------------------------------------|
| Insight beneath observation  | X/5   | <one sentence>                          |
| Spine coherence              | X/5   | <one sentence>                          |
| Six-movement arc fidelity    | X/5   | <one sentence>                          |
| Coined-phrase quality        | X/5   | <one sentence>                          |
| Self-compelling              | X/5   | <one sentence>                          |
| Voice                        | X/5   | <one sentence>                          |
| Emotional stake              | X/5   | <one sentence>                          |
| **Overall**                  | X.X/5 |                                         |

**Take:** <one or two sentences capturing the overall judgment>

**Flags:** <any specific issues, e.g., "no unresolved cost named", "spine drifted in Tension">
Saved to: _bmad-output/portrait-rubric-runs/<filename>.json
```

**Corpus markdown summary:** comparison table with one row per portrait showing all 7 dimension scores plus overall, a median row at the bottom, and any flagged regressions if baseline mode.

**JSON schema:** defined in `./references/rubric-judge-prompt.md`; must be obeyed exactly so `finalize.py` and downstream tooling can parse it reliably.

## Scoring principles

- **Integer scores** for each dimension (1–5). `finalize.py` computes `overall_score` deterministically.
- **Cite evidence.** A rationale that could apply to any portrait is weak. Reference specific passages.
- **Be willing to give 1 or 2.** If the rubric can't fail a portrait, it's useless for regression detection.
- **Do not grade on effort or length.** A short portrait that hits the dimensions scores higher than a long one that drifts.
- **Inferential depth is the most important dimension.** If `insight_beneath_observation` is ≤2, `finalize.py` caps the overall score at 2.5 — note this in the take even though the math is handled downstream.

## Anchoring examples

v1 of this rubric ships without hand-curated 1/3/5 anchoring examples per dimension. The dimension definitions in `./references/rubric-judge-prompt.md` are the calibration surface.

**v2 curation task (planned, not scheduled):** select best/worst examples from `_llm-test-output/*.md` corpus and add them to the judge prompt under each dimension. This will tighten inter-run consistency, especially on `insight_beneath_observation`.

If you notice your scores drifting across runs on the same portrait, that's a signal the calibration anchors are needed — flag it to the user and suggest curation. Note: when v2 ships, the `rubric_prompt_sha` in the output JSON will change, which means prior baselines remain parseable but are not strictly score-comparable to v2 runs. `finalize.py diff` detects this and warns when comparing across prompt hashes.
