# Workflow Integrity Analysis — portrait-rubric

**Scanner:** WorkflowIntegrityBot
**Skill:** `/Users/vincentlay/Projects/big-ocean/.claude/skills/portrait-rubric`
**Timestamp:** 2026-04-11 20:39

---

## Assessment

Structurally the skill is sound for what it actually is: a **simple utility** that transforms a portrait file (or corpus) into rubric-scored JSON plus a markdown summary, delegating the heavy lifting to a single reference file (`references/rubric-judge-prompt.md`). The prepass script misclassified it as a complex workflow and produced several false-positive issues, but a real human-judgment scan reveals only a handful of low-to-medium concerns. The main legitimate gaps are cosmetic/convention-level: a missing explicit `## Overview` heading and no `## On Activation` section, both of which are mitigated (but not replaced) by the existing `## Purpose` and `## How to act` / `## Process` sections.

**Detected workflow type (corrected):** Simple utility (input → judge-prompt transformation → structured output). Not a complex workflow — there are no numbered stage files at the skill root, no routing table, and the prepass's single "referenced stage" was extracted from a documentation pointer, not a real stage reference.

---

## Pre-Pass Triage — Which Issues Are Real?

The prepass flagged 4 issues. My judgment after reading the file:

| # | Prepass Finding | Real? | Notes |
|---|---|---|---|
| 1 | `name "portrait-rubric" does not follow bmad-* naming convention` (medium) | **Partial — downgrade to low** | The bmad-* prefix convention applies to skills built by the BMad Module Builder and shipped as part of a BMad module. This skill lives in the project's `.claude/skills/` directory as a **project-local utility**, not a BMad module artifact. It is also intentionally invoked via `/portrait-rubric`, so the unprefixed slash command is a deliberate UX choice. Flagging this as "medium" overstates the severity. |
| 2 | `Missing ## Overview section` (high) | **Real — but downgrade to low** | Strictly true: there is no heading literally titled `## Overview`. However, `## Purpose` (lines 8-14) serves the exact same function — priming the AI before detailed instructions — and is arguably more descriptive than a generic "Overview". Rename-only fix. Low impact on actual AI behavior. |
| 3 | `Missing ## On Activation section` (high) | **Real — medium** | The skill has no `## On Activation` section. Activation steps are implicit in `## How to act` + `## Input modes` + `## Process`, which together tell the AI what to do when invoked. For a simple utility this is workable but not ideal: the AI has to stitch together behavior from three sections instead of one, and things like "load config via bmad-init" (if desired) have no obvious home. |
| 4 | `Referenced stage file does not exist: 2026-04-11.md` (critical) | **FALSE POSITIVE** | The prepass extracted `2026-04-11.md` from the string `` `_bmad-output/problem-solution-2026-04-11.md` `` on line 12, which is a prose pointer to a BMad planning document, **not** a stage file reference. There are no stage files in this skill and there is no complex-workflow structure. This finding should be discarded. |

---

## Key Findings (Severity Order)

### 1. MEDIUM — Prepass misclassified workflow type; corrected type is "simple utility"

**File:** SKILL.md (whole-file judgment)
**What's wrong:** The prepass heuristic tagged `workflow_type: complex` and then looked for stage files. No stage files exist at the skill root (`ls` shows only `SKILL.md` and `references/`). Reading the actual content, the skill is a direct input-to-output transformation:

- Input: portrait text, file path, glob, or `--baseline` JSON
- Transform: apply `references/rubric-judge-prompt.md` to produce scored JSON
- Output: JSON file under `_bmad-output/portrait-rubric-runs/...` + printed markdown summary

This is textbook simple-utility shape, and all the "simple utility" checks (input format defined, output format defined, transformation rules explicit, edge cases for input addressed, no unnecessary process steps) **pass cleanly**:

- Input format: defined in `## Input modes` (lines 22-32), including the 5-way router and the ambiguity rule.
- Output format: defined in `## Output format` (lines 49-76), including markdown tables, corpus tables, and a pointer to the JSON schema in the references file.
- Transformation rules: `## Process` (lines 34-47) steps 1-6 plus corpus/baseline addenda.
- Edge cases: `## Input modes` covers no-args, ambiguous dir/file, corpus, and baseline. `## Scoring principles` (lines 78-84) addresses subjective edge cases (willing to give 1/2, don't grade on length, insight-beneath-observation trumps everything).

**Fix:** No action needed on the skill itself. Report synthesis should treat the "critical missing stage" finding as void and classify the skill as `simple-utility`.

### 2. MEDIUM — No explicit `## On Activation` section

**File:** `SKILL.md` — structurally absent (would sit after `## How to act` around line 21)
**What's wrong:** The skill's "what to do when invoked" behavior is spread across three sections (`How to act`, `Input modes`, `Process`). For a simple utility this is not fatal — the AI can reconstruct the activation sequence — but it violates the scanner's required-sections checklist and creates a minor cognitive load: the reader has to read three sections before knowing "what happens first when `/portrait-rubric` fires".

**Fix:** Add a short `## On Activation` section immediately after `## How to act`, with something like:

```markdown
## On Activation

1. Inspect what the user provided; route per `## Input modes`.
2. If ambiguous, ask one clarifying question before proceeding.
3. For each portrait in scope, run `## Process` steps 1-6.
4. After the batch, print the markdown summary (and regression report if `--baseline`).
```

This is cheap to add, raises compliance with the scanner convention, and makes the activation sequence explicit.

### 3. LOW — No `## Overview` heading (content is present under `## Purpose`)

**File:** `SKILL.md` line 8
**What's wrong:** The scanner's required-sections check expects a section literally titled `## Overview`. The skill uses `## Purpose` instead. Content-wise, lines 8-14 **do** serve as an overview — they explain what the skill is, what it gates, and what matters most (`insight_beneath_observation`).

**Fix:** Either (a) rename `## Purpose` to `## Overview`, or (b) split: make the first paragraph `## Overview` and keep the load-bearing-rubric paragraphs under `## Purpose` or `## Why this exists`. I'd pick (a) for simplicity — one-line change with zero behavioral impact.

### 4. LOW — Naming convention: `portrait-rubric` is not `bmad-*`

**File:** `SKILL.md` frontmatter line 2
**What's wrong:** The scanner's naming rule is `bmad-{code}-{skillname}` or `bmad-{skillname}`. The skill is named `portrait-rubric`.
**Why it's low, not medium:** This is a project-local utility, not a BMad module artifact. It's explicitly invoked as `/portrait-rubric` (the slash command is part of the user-facing contract), and renaming to `bmad-portrait-rubric` would break that muscle memory and mix BMad module identity with a non-module skill. The naming rule exists to disambiguate module affiliation; this skill has no module to affiliate with.
**Fix:** If strict compliance is required, rename to `bmad-portrait-rubric` and update all invocation patterns in the description. Otherwise, **explicitly accept the deviation** in the report: this is an intentional project-local naming choice. My recommendation is to accept.

### 5. LOW — No config integration (`bmad-init`, `{communication_language}`, etc.)

**File:** `SKILL.md` — absent throughout
**What's wrong:** The scanner's "Config Integration" checks look for config loading in `## On Activation` and use of config variables (`{user_name}`, `{communication_language}`, `{document_output_language}`). Neither exists here. The skill hardcodes English output, hardcodes the output directory `_bmad-output/portrait-rubric-runs/`, and hardcodes the markdown summary language.
**Why it's low:** The rubric is a measurement tool for a specific project whose output language is fixed (it scores English portraits and emits English summaries). The output path is a deliberate convention tied to a BMad planning document referenced in `## Purpose`. Parameterizing this through `bmad-init` would add runtime indirection for zero practical benefit.
**Fix:** **Accept the deviation**, or optionally add a one-liner to a future `## On Activation` section noting "output always in English; scores are rubric-version stamped and path-stable for downstream tooling". No code change needed.

---

## Cross-Cutting Checks (All Pass)

- **Description format** — Two-part, specific quoted triggers (`"/portrait-rubric"`, `"score this portrait"`, `"run the rubric"`), and a fallback ("provides a portrait file for quality evaluation"). Conservative and explicit — will not over-trigger. **Strength.**
- **No template artifacts** — No orphaned `{if-...}` conditionals, no bare `{skillName}` / `{displayName}` placeholders. Clean build.
- **No "you should" / "please" language** — Checked lines 16-20, 78-84: direct command tone throughout ("You are a rigorous but fair judge...", "Stay calibrated", "Be willing to give 1 or 2"). **Strength.**
- **No `## On Exit` section** — Correct; not present.
- **No over-specification of LLM capabilities** — The skill delegates judgment to `references/rubric-judge-prompt.md` (which I didn't need to read for this scan) and gives the AI calibration cues rather than scoring algorithms. The 1/3/5 cues are anchoring aids for a subjective task, not a weighted formula — appropriate use.
- **Logical consistency** — Description promises "score against 7 quality dimensions" and the `## Output format` tables list exactly 7 dimensions + overall. The filename patterns in `## Process` step 5 match the corpus/baseline patterns described elsewhere. No internal contradictions found.
- **Reference file exists** — `references/rubric-judge-prompt.md` is present (confirmed via `ls`). The skill references it from `## Process` step 2 and `## Output format` (JSON schema note) — both point to an existing file.

---

## Strengths Worth Preserving

1. **The description is a model of conservative triggering** — quoted slash command, three quoted alternate phrases, plus a behavioral fallback. Will not hijack unrelated conversations.
2. **Clear separation between "what to do" and "how to judge"** — SKILL.md is the router and scaffolder; the judge prompt in `references/` carries the actual rubric definitions and schema. This is the right split for a utility where the core logic is a long, stable prompt.
3. **Anti-calibration-drift language** is built into `## How to act` (lines 20-21) and `## Scoring principles` (lines 82-84). Explicit meta-awareness that this is a regression-detection tool, not a cheerleading tool. Unusual and valuable for a quality scanner skill.
4. **Explicit hierarchy of dimensions** — `insight_beneath_observation` is named in the Purpose, in How-to-act, and in Scoring principles as the load-bearing dimension. Repetition here is not redundancy; it's calibration reinforcement.
5. **Forward-looking v2 note** (`## Anchoring examples`, lines 86-90) — the skill acknowledges its own v1 limitations (no hand-curated anchors) and specifies the drift signal that should trigger v2 curation. This is a well-designed self-reporting affordance.
6. **Baseline/regression mode** is specified end-to-end (input → per-dimension deltas → threshold `> 0.5` → flag). This is the kind of concrete, testable rule that prevents AI drift in interpretation.

---

## Summary for Report Synthesizer

- **Correct workflow type:** simple utility (prepass was wrong; "critical missing stage file" finding is a false positive from a regex that caught a prose date reference).
- **Real issues:** 1 medium (missing `## On Activation`), 2 low (no `## Overview` heading, no config integration) — and 1 low that should be explicitly accepted (naming convention deviation, intentional for project-local slash command).
- **No critical issues.** No high issues after triage.
- **Overall structural verdict:** Sound. The skill is well-built for its purpose and the gaps are cosmetic convention-compliance, not functional defects.
