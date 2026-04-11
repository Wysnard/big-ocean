# Script Opportunity Scan — portrait-rubric

**Scanner:** quality-scan-script-opportunities (ScriptHunter)
**Skill scanned:** `/Users/vincentlay/Projects/big-ocean/.claude/skills/portrait-rubric`
**Date:** 2026-04-11
**Rubric version scanned:** 1.0

---

## Existing scripts inventory

**None.** The skill ships with zero scripts by explicit design: it is entirely Claude-as-judge, with LLM-based aggregation for corpus mode. No `scripts/` directory exists. The stated rationale is to keep zero dependencies and avoid a `uv` requirement.

Files present:

- `SKILL.md` (91 lines) — routing, process, output format contract
- `references/rubric-judge-prompt.md` (191 lines) — judge prompt, 7 dimension definitions with 1/3/5 calibration, JSON output schema
- No root prompt files, no `scripts/`, no `assets/`

---

## Assessment

The core load-bearing work of this skill — scoring seven interpretive dimensions against creative writing — is irreducibly LLM work. No script can judge `insight_beneath_observation` or `self_compelling`. The zero-scripts posture is fundamentally defensible for the judgment core.

However, around that judgment core, the skill asks the LLM to perform a non-trivial amount of deterministic plumbing: timestamped filename construction, mean computation with a conditional cap, JSON schema shape validation, cross-portrait aggregation (mean/median/table layout), baseline diffing with a fixed 0.5-point threshold, and directory/file creation. None of that requires interpretation. The no-scripts choice is costing real tokens on every corpus and baseline run, and — more importantly — is relying on the LLM to correctly implement an arithmetic rule (the `insight ≤2 → cap 2.5` override) that is exactly the kind of conditional logic LLMs are known to skip under load. That's not just a tax; it's a correctness risk for the regression-tracking system this rubric is supposed to anchor.

Verdict: **the judgment layer should stay pure LLM, but the plumbing around it has 3–4 genuine script opportunities that are worth reconsidering.** The single most load-bearing one (post-processing validation of generated JSON + score cap enforcement) directly protects the stated mission of the skill — catching regressions — and I recommend it over the no-dependencies principle if the principle has to give somewhere.

---

## Key findings

### Finding 1 — [HIGH] Post-processing JSON validation + score-cap enforcement

**File:line:** `references/rubric-judge-prompt.md:122-181` (output schema + JSON rules); `SKILL.md:41-42` ("produce the structured score… matching the schema")

**What the LLM is currently doing:**
The LLM is required to produce a JSON object with an exact schema: 7 named dimensions, integer scores 1-5, `overall_score` as the rounded mean, an override rule where "if `insight_beneath_observation` is ≤2, cap the `overall_score` at 2.5 regardless of the mean", a `flags` array, and output with no markdown fences or preamble. Every invocation re-reads these rules and re-implements the arithmetic.

**What a script would do instead:**
A Python post-processor (`scripts/validate_and_finalize_score.py`) that takes the raw judge output and:
1. Parses the JSON (strips accidental markdown fences if present).
2. Validates against a `jsonschema` definition: required keys, 7 dimension names match exactly, scores are integers in [1,5], `rubric_version` matches expected value.
3. **Recomputes `overall_score`** from the 7 dimension scores — LLM-provided value is overwritten, not trusted.
4. **Enforces the insight cap** deterministically: `if dims.insight_beneath_observation.score <= 2: overall = min(overall, 2.5)`.
5. Emits validated canonical JSON to the run directory.

This is the highest-value finding because the insight-cap rule is **the single most important correctness invariant in the rubric** — it's the mechanism that prevents a portrait from scoring well on "pretty prose" dimensions while failing the load-bearing depth dimension. Asking the LLM to self-enforce this rule on every invocation is strictly worse than enforcing it in code: the LLM can forget, miscalculate, or round differently, and the regression-tracking system loses signal if the cap isn't consistently applied.

**Token savings:** ~250-400 tokens on schema description + rules per invocation + elimination of arithmetic output tokens. **Heavy tax when you factor correctness risk**, not just tokens.

**Implementation:** Python, PEP 723 with `jsonschema` inline. ~60 lines. `--help` describes the interface so the prompt only needs `scripts/validate_and_finalize_score.py <raw_output_file> <final_output_path>`.

**Pre-pass potential:** N/A (this is post-processing).
**Standalone value:** HIGH — doubles as a schema lint for any stored rubric run file, and as a migration check when the schema version bumps to 1.1.
**Reuse across skills:** Moderate — the pattern "LLM emits JSON, script validates + canonicalizes" is reusable across any structured-output skill.

---

### Finding 2 — [HIGH] Corpus aggregation (mean/median table + comparison rendering)

**File:line:** `SKILL.md:45` ("save the aggregate as `…-corpus.json` containing `{ rubric_version, timestamp, results: [...] }`"), `SKILL.md:74` ("Corpus markdown summary — a comparison table with one row per portrait showing all 7 dimension scores plus overall, a median row at the bottom")

**What the LLM is currently doing:**
After each portrait is scored individually, the LLM manually:
- Collects all JSON score objects.
- Assembles them into an aggregate JSON wrapper.
- Computes per-dimension **medians across the corpus**.
- Lays out a markdown comparison table with 8 numeric columns (7 dimensions + overall) and one row per portrait, plus a median row.
- Writes that to the shared timestamped corpus file.

Every cell of that table is deterministic arithmetic + formatting. Median computation is particularly error-prone to do in natural language — LLMs are known to get medians wrong on even/odd-sized sets, and to confuse median with mean.

**What a script would do instead:**
A Python script (`scripts/aggregate_corpus.py <run_dir> --rubric-version 1.0`) that:
- Globs the per-portrait JSON files in the run directory.
- Computes per-dimension means and medians and an overall-of-overalls.
- Emits the canonical `…-corpus.json` file.
- Prints the markdown comparison table with the median row — to stdout, so the LLM pipes it to the user verbatim.

**Token savings:** ~300-600 tokens per corpus run (proportional to corpus size: table-layout overhead scales with `portraits × 8 cells`). **Heavy** at any realistic corpus size (5+ portraits).

**Implementation:** Python standard library only (`json`, `pathlib`, `statistics`, `argparse`). ~80 lines. `--help` inline-documents the CLI.

**Pre-pass potential:** N/A — it's a post-pass on LLM output, but it could arguably feed a "judge the corpus-level consistency" LLM scanner later.
**Standalone value:** HIGH — the corpus comparison is exactly what the improvement plan (`problem-solution-2026-04-11.md`) needs for Phase 2/3/4a exit-criteria gating. Having it as a script means CI can run it without invoking Claude at all.
**Reuse across skills:** Low (rubric-specific), but the pattern generalizes to any batch-scoring skill.

---

### Finding 3 — [HIGH] Baseline-diff / regression detection

**File:line:** `SKILL.md:29` (baseline mode description), `SKILL.md:47` ("compute per-portrait and per-dimension deltas, and print a regression report — any dimension median dropping > 0.5 points across the corpus is flagged")

**What the LLM is currently doing:**
In baseline mode, the LLM is asked to:
- Load a prior corpus JSON file.
- Match portraits by `portrait_id`.
- Compute per-dimension deltas (current − baseline) for each portrait.
- Compute the per-dimension **median delta across the corpus**.
- Apply a fixed threshold: flag any dimension where the median delta is worse than −0.5.
- Render a regression report.

This is a pure arithmetic + threshold check. Zero judgment. The 0.5 threshold is a magic number hardcoded in the skill contract, making it exactly the kind of thing that should live in a script argument, not in prose instructions.

**What a script would do instead:**
`scripts/diff_baseline.py <current_corpus.json> --baseline <baseline_corpus.json> [--threshold 0.5]`:
- Load both files.
- Compute per-portrait and per-dimension deltas.
- Compute corpus-level median delta per dimension.
- Emit a structured regression report (both JSON and a markdown table).
- Exit non-zero if any dimension crosses the threshold — so CI can gate on it.

**Token savings:** ~400-700 tokens per baseline run. **Heavy**, and this is also a correctness-sensitive operation (silently missing a regression defeats the whole point of having a baseline mode).

**Implementation:** Python stdlib, ~70 lines.

**Pre-pass potential:** N/A.
**Standalone value:** VERY HIGH — this is literally the regression-gating mechanism. A script version can be invoked from CI with no LLM involvement at all, which is arguably how regression gating should work anyway.
**Reuse across skills:** High — the "diff two structured-score JSON files with a threshold" pattern is reusable for any rubric-style skill.

---

### Finding 4 — [MEDIUM] Run-directory + timestamped filename construction

**File:line:** `SKILL.md:42` ("Save the JSON to `_bmad-output/portrait-rubric-runs/<YYYY-MM-DD-HHMM>-<portrait_id>.json`. Create the directory if it doesn't exist."), `SKILL.md:45` (corpus filename pattern)

**What the LLM is currently doing:**
Generating an ISO-ish timestamp, formatting it as `YYYY-MM-DD-HHMM`, sanitizing the `portrait_id` (basename without extension), composing the filename, ensuring the directory exists, writing the JSON. For corpus mode, the LLM additionally has to **share one timestamp across all files in the batch**, which is an easy-to-miss constraint.

**What a script would do instead:**
A tiny utility (`scripts/write_run.py`) that accepts `--portrait-id`, `--run-timestamp` (optional; generated if absent), and stdin JSON, then writes the canonical file. Guarantees the batched-timestamp invariant for corpus runs by passing `--run-timestamp` once.

**Token savings:** ~80-150 tokens per invocation on filename construction + directory creation instructions. **Light to moderate.**

**Implementation:** Python stdlib, ~25 lines.

**Pre-pass potential:** N/A.
**Standalone value:** Low — purely convenience.
**Reuse across skills:** High — "timestamped run-directory writer" is the most reusable pattern here and could live under a shared skills/utilities dir.

**Note:** On its own this is borderline — I'd skip it if it stood alone. It's worth doing only if Findings 1-3 are being shipped and a shared I/O helper emerges naturally.

---

### Finding 5 — [LOW] Arithmetic of `overall_score` mean

**File:line:** `references/rubric-judge-prompt.md:176` ("`overall_score` is the mean of the 7 dimension scores, rounded to one decimal")

**What the LLM is currently doing:**
Computing `sum(7 integers) / 7`, rounding to 1 decimal.

**What a script would do instead:**
Covered by Finding 1 (post-processing script recomputes and overwrites). Listed separately because even without the full post-processor, this single line is a determinism smell: LLMs are unreliable at arithmetic, and the whole skill's numeric output hinges on it.

**Token savings:** ~20-40 tokens. **Light**, but correctness-sensitive.

**Implementation:** Folded into Finding 1.

**Standalone value:** N/A — subsumed by Finding 1.

---

### Finding 6 — [LOW] Input-mode routing & file-discovery

**File:line:** `SKILL.md:23-32` (Input modes: inline / file path / corpus / baseline / no-args)

**What the LLM is currently doing:**
Classifying user input — "is this pasted text, a file path, a directory, a glob, or a flag?" — which is partly interpretive (inline vs file path is ambiguous if the user pastes a short string that looks like a path) and partly deterministic (directory vs file vs glob expansion is a pure `pathlib` / `glob.glob` operation).

**What a script would do instead:**
A `scripts/resolve_inputs.py` that accepts whatever the user said and returns a JSON array of `{portrait_id, path}` tuples plus a `mode` field (`single` / `corpus` / `baseline`). Handles the glob expansion and file-vs-directory check. Leaves the genuine ambiguity (is this text or a path?) to the LLM.

**Token savings:** ~50-100 tokens per invocation. **Light.**

**Implementation:** Python stdlib, ~40 lines.

**Pre-pass potential:** YES — this would be a clean pre-pass feeding the LLM scorer a compact inventory of what needs scoring.
**Standalone value:** Moderate.
**Reuse across skills:** High — any skill with "file / dir / glob / baseline" input modes could reuse this.

**Note:** Borderline. The genuine ambiguity resolution has to stay in the LLM, so the value gained is modest. Skip unless bundling with Finding 4 into a shared I/O helper.

---

### Finding 7 — [LOW] Judge-prompt assembly (file read + portrait append)

**File:line:** `SKILL.md:39-41` ("Load the judge prompt — read `./references/rubric-judge-prompt.md` in full… Compose the evaluation — present the judge prompt with the portrait text appended in a clearly delimited block")

**What the LLM is currently doing:**
Reading two files and string-concatenating them with a delimiter. Trivial, but repeated per portrait in corpus mode.

**What a script would do instead:**
Could pre-compose the full judge input per portrait. BUT — this is essentially what the LLM already does for free when it reads the two files in sequence, and composing it in a script doesn't save meaningful tokens because the judge prompt must still be in-context for scoring.

**Verdict:** Not worth doing. Listed only for completeness.

**Token savings:** ~0 (the prompt content still enters the LLM context).

---

## Operations that should stay as LLM work

For clarity — these are the operations ScriptHunter checked and decided to leave alone:

1. **All 7 dimension scorings.** `insight_beneath_observation`, `spine_coherence`, `arc_fidelity`, `coined_phrase_quality`, `self_compelling`, `voice`, `emotional_stake` — these are interpretive judgments against calibration cues. Irreducibly LLM work.
2. **Rationale + evidence generation.** Requires reading the portrait and choosing a verbatim quote that supports the score. LLM work.
3. **`flags` array population** (e.g., "WARMTH BEFORE DEPTH violated in opening", "Nerin-as-subject slip"). Requires interpreting rule violations against the portrait. LLM work.
4. **`overall_take` prose.** Natural-language summary. LLM work.
5. **Ambiguity resolution in input routing** (e.g., "is this a short pasted portrait or a path?"). Requires judgment.
6. **Calibration drift detection** (`SKILL.md:90` — "If you notice your scores drifting across runs on the same portrait, that's a signal the calibration anchors are needed"). This is a meta-judgment across runs; could theoretically be scripted if scoring were fully deterministic, but isn't worth it until v2 anchoring examples exist.

---

## Aggregate savings

| Finding | Severity | Est. tokens saved / invocation | Correctness risk reduced? |
|---|---|---|---|
| 1. JSON validate + score-cap enforcement | High | 250-400 | **Yes (major)** |
| 2. Corpus aggregation | High | 300-600 (scales with N) | Yes (median arithmetic) |
| 3. Baseline diff / regression detection | High | 400-700 | **Yes (major)** |
| 4. Run-directory / filename writer | Medium | 80-150 | Minor (batched timestamp invariant) |
| 5. Overall-score mean | Low | Subsumed by #1 | — |
| 6. Input-mode routing / file discovery | Low | 50-100 | No |
| 7. Judge-prompt assembly | — | 0 | — |

**Per-invocation savings (single portrait mode):** ~330-550 tokens (Findings 1, 4, 6).
**Per-invocation savings (corpus mode, ~10 portraits):** ~1500-3500 tokens.
**Per-invocation savings (baseline mode):** ~2000-4000 tokens.

These are lower-bound estimates — I'm not counting tokens the LLM spends "thinking" through the arithmetic and schema enforcement, only the surface token cost.

---

## Recommendation for revisiting the no-scripts posture

The no-scripts choice is defensible for the judgment core, and I wouldn't touch it if the only findings were 4-7 (plumbing convenience). But Findings 1, 2, and 3 are not plumbing — they are **correctness gates for the regression-tracking system this skill exists to anchor**. Specifically:

- The `insight ≤ 2 → cap at 2.5` rule is the mechanism that makes the rubric capable of failing a pretty-but-shallow portrait. Trusting the LLM to self-enforce a conditional arithmetic rule on every run is a known-weak move.
- The baseline-mode median + threshold check is literally the gating logic for Phase 2/3/4a exit criteria described in the improvement plan. If the LLM silently miscomputes a median and misses a −0.6 regression, the system fails in exactly the way it was designed to prevent.
- Corpus medians are a small but consistent source of LLM arithmetic errors.

**Suggested path forward if the no-scripts posture is revisited:** ship a single small Python post-processor (`scripts/finalize.py`) that handles Findings 1, 2, and 3 together as one cohesive tool with subcommands:

```
scripts/finalize.py validate <raw.json> <out.json>
scripts/finalize.py aggregate <run-dir>
scripts/finalize.py diff <current-corpus.json> --baseline <baseline.json> [--threshold 0.5]
```

- Python stdlib + `jsonschema` only (PEP 723 inline declaration — no `uv` project setup).
- ~200 lines total.
- `--help` on each subcommand so the SKILL.md prompt can stay short ("Run `scripts/finalize.py --help` to see interface").
- Usable standalone from CI, independent of Claude.

This preserves the spirit of the no-scripts choice (no `uv`, no build step, no maintenance burden beyond one Python file) while closing the correctness-risk gaps in the three findings that actually matter. Findings 4-7 can stay as LLM work.

If the no-scripts posture is kept as-is, my single recommendation is to **at least add explicit post-scoring arithmetic verification steps to the SKILL.md process** so the LLM is forced to recompute the mean, check the cap, and validate the schema in an explicit pass, rather than producing them in one shot. It's strictly worse than a script, but better than implicit enforcement.
