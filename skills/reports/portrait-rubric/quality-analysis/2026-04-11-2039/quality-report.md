# Quality Analysis Report — portrait-rubric

**Skill:** `.claude/skills/portrait-rubric/`
**Date:** 2026-04-11 20:39
**Grade:** **Good** (solid bones, clear correctness gaps worth closing)

## Narrative synthesis

The portrait-rubric skill is structurally sound, crafted with outcome-driven principles, and lean by design. Lint gates pass with zero findings. The SKILL.md is ~1.8K tokens, the judge prompt is appropriately isolated in `references/` for progressive disclosure, and the load-bearing `insight_beneath_observation` dimension is surfaced at four touchpoints throughout the skill so it can't be forgotten.

**However, three correctness gaps sit around the LLM core and are worth closing before this skill becomes the load-bearing quality gate for the portrait-generator improvement plan.** All three share the same root cause: *asking an LLM to do deterministic arithmetic or threshold comparison in prose is fragile, and this skill's entire mission is regression detection — a regression that the skill silently misses is worse than a regression it flags with noise.*

The skill's v1-without-anchoring-examples choice remains defensible, but the no-scripts choice is worth revisiting for the small subset of operations where correctness matters more than simplicity.

## Findings by severity

### High (4)

**H1 · Score-cap enforcement is prose-based** *(script-opportunities scanner)*
The rule *"if `insight_beneath_observation ≤ 2`, cap `overall_score` at 2.5 regardless of the mean"* is a correctness invariant. Having the LLM enforce conditional arithmetic in its JSON output on every run weakens the regression-tracking mission. A 10-line Python post-processor that validates and enforces this rule after the LLM returns would make it impossible to silently miss. **Most load-bearing finding in the report.**

**H2 · Baseline regression threshold is prose-based** *(script-opportunities scanner)*
The `>0.5 median delta` threshold that gates Phase 2/3/4a exits in the portrait-generator plan is pure arithmetic and is literally the decision the whole plan depends on. Having the LLM compute and compare medians in prose risks silently misjudging a regression. Deterministic diff logic would eliminate this risk.

**H3 · Corpus mode serializes independent portrait scoring** *(execution-efficiency scanner)*
For corpus runs of 5+ portraits, the current process scores portraits sequentially. Each portrait is independent — should dispatch parallel subagents per portrait instead. Currently, running the rubric on the 25-portrait baseline will take ~25× a single-portrait latency instead of ~1× with parallelism.

**H4 · Corpus aggregation is prose-based** *(script-opportunities scanner)*
Mean and median computation across portraits is pure formatting + arithmetic. LLMs get medians wrong occasionally. A deterministic aggregation step would both save tokens and prevent silent math errors.

### Medium (5)

**M1 · Process section mixes judgment with file I/O** *(prompt-craft scanner)*
The `## Process` in SKILL.md blends the judging mental model with mechanical file-path steps ("create the directory if it doesn't exist"). Splitting into "judgment responsibilities" and "execution mechanics" would reduce noise and tighten the judge's focus.

**M2 · No explicit `## On Activation` section** *(workflow-integrity scanner)*
Some BMad tooling greps for `## On Activation` to discover activation triggers. The skill's activation logic is in `## Input modes` — functionally equivalent but won't match tooling that expects the standard header.

**M3 · No labeled `## Overview` heading** *(prompt-craft scanner)*
`## Purpose` + `## How to act` functionally cover an Overview but don't match tooling that greps for the standard header.

**M4 · Judge prompt re-read per portrait in corpus loop** *(execution-efficiency scanner)*
In corpus mode, the judge prompt should be loaded once as shared setup, not re-read per portrait. Currently implicit that it would be re-read each iteration.

**M5 · Sequential file reads in steps 1–2** *(execution-efficiency scanner)*
The portrait text and judge prompt reads in the Process section could be batched in parallel (single message, multiple Read calls) rather than sequential.

### Low (4)

- **L1** Anchoring examples section mixes v1/v2 roadmap notes with a real runtime instruction ("If you notice your scores drifting...")
- **L2** Minor defensive padding (~30–50 tokens across a few spots)
- **L3** Some duplication between SKILL.md "Scoring principles" and judge-prompt rules (acceptable for compaction resilience, noted not flagged)
- **L4** Naming convention deviation — `portrait-rubric` doesn't use `bmad-*` prefix (intentional for Claude Code local skill, not a BMad module skill — correctly noted as intentional)

## Enhancement opportunities (from L5 scanner)

These aren't findings to fix — they're expansion options worth considering for v2:

**E1 · Ensemble mode (highest-value expansion)** — Judge variance is the central unaddressed threat to regression detection. Running 3 scoring passes per portrait and reporting `{median, range}` per dimension would materially improve score reliability, especially on `insight_beneath_observation` which is the hardest dimension to score consistently. This is the single most valuable addition if the rubric starts drifting on repeated runs of the same portrait.

**E2 · Trend mode** — Every corpus run writes a timestamped JSON, but the skill only reads at most one prior JSON (baseline mode). A read-only `--trend` mode that loads the last N runs would unlock existing data for free — plot dimension scores over time, spot drift.

**E3 · Judge-prompt hash in output JSON** — When you curate v2 anchoring examples, the judge prompt will change. Baselines scored under v1.0 won't be strictly comparable to v1.1 scores. Including a hash of the judge prompt in every output JSON makes comparison drift detectable automatically.

**E4 · Headless/automation-friendly entry point** — The skill is ~80% headless in shape (pure-function scoring, JSON output) but has no non-conversational entry point. Adding a params contract (`portrait_path`, `baseline_path`, `fail_on_regression`, `regression_threshold`, `runs_per_portrait`) and a structured return blob would let the rubric plug into CI, cron, or chained skills.

**E5 · `portrait_id` collision in corpus mode** — Currently derived from basename; if two portraits have the same basename in different directories, the JSON outputs collide.

## Recommended actions (in priority order)

### Before committing this v1

1. **H3 (medium effort, immediate win):** Add a note to the corpus mode process instructing parallel dispatch: *"For corpus mode, dispatch one parallel subagent per portrait rather than scoring sequentially."* 2-line change in `SKILL.md`. No script work needed.

2. **E3 (tiny effort, prevents future pain):** Add `"rubric_prompt_sha": "<hash>"` field to the output JSON schema. One new line in the schema spec. Guards against silent drift when v2 anchoring examples land.

### Worth reconsidering before the skill becomes a production gate

3. **H1 + H2 + H4 (bundled — one small script closes three findings):** Revisit the no-scripts choice *for this specific subset*. A single ~200-line `scripts/finalize.py` with three subcommands — `validate` (H1, enforces the insight ≤ 2 cap deterministically), `aggregate` (H4, computes deterministic mean/median per dimension), `diff` (H2, deterministic baseline regression comparison with >0.5 threshold). Python stdlib + optional `jsonschema` via PEP 723. No `uv` dependency. Maintains the "zero install cost" spirit while closing the correctness gaps on the exact operations where correctness matters most. **Token savings are the lesser argument; correctness is the real argument.**

4. **M1 + M2 + M3 (cosmetic tooling compatibility):** Rename `## Purpose` → `## Overview`, add `## On Activation` section with the trigger phrases. Minor but aligns with tooling expectations. ~10 minutes.

### Worth considering for v2 (not urgent)

5. **E1 (ensemble mode)** — Add only when/if you observe score drift on repeated runs of the same portrait. Not needed for v1.

6. **E2 (trend mode)** — Add when you have enough corpus runs accumulated that the trend would be useful.

7. **E4 (headless mode)** — Add if you later want to plug the rubric into CI or automation.

## Notable strengths preserved

- Conservative triggering description with explicit activation phrases
- Clean SKILL.md / references/ split (progressive disclosure done right)
- Load-bearing `insight_beneath_observation` dimension surfaced at four touchpoints including the score-cap rule
- Built-in anti-calibration-drift language ("stay calibrated — be willing to give 1s and 2s")
- End-to-end baseline/regression workflow specified from the start
- Self-aware v2 curation note with explicit trigger for when to do it
- Distilled design-intent section uses actual non-negotiable rules from the project's `PORTRAIT_CONTEXT` (not paraphrased) — the judge knows what "good" means per the project's own authority
- Zero lint findings on path standards and scripts

## Conclusion

The skill is ready to commit and smoke-test. The four high-severity findings are worth addressing before the skill becomes the load-bearing gate for the portrait-generator improvement plan, but they're not blockers for shipping v1 and running it against your test corpus to produce the baseline. Grade: **Good**, trending toward Excellent if the correctness gaps (H1/H2/H4) are closed with the small `finalize.py` script.
