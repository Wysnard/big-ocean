# Execution Efficiency Analysis — portrait-rubric

## Assessment

The portrait-rubric skill is a lean, single-stage evaluator with a tight execution profile: one judge prompt, one reference file, per-portrait scoring with deterministic JSON output. Execution is mostly efficient because the skill is narrow in scope, but **corpus mode has a latent sequential-processing pattern** that becomes a real problem at 5+ portraits, and a per-portrait repeated-read of the judge prompt is a small but easy win. There are no critical issues (no circular deps, no subagent-from-subagent, no parent-reads-before-delegating because there is no delegation at all).

## Key Findings

### 1. Corpus mode serializes independent portrait scoring (HIGH)

**File:** `SKILL.md:36-45` (Process section + corpus mode paragraph)

**Current pattern:** The Process section is written as a per-portrait loop ("For each portrait being scored: 1. Load... 2. Load... 3. Compose... 4. Produce... 5. Save... 6. Print"). In corpus mode (`SKILL.md:28` — "Score each portrait, then aggregate"), this implies scoring portraits one at a time in the parent. Each portrait requires reading the portrait file, re-reading the 13KB judge prompt, composing a judge evaluation, and emitting JSON — all work that is fully independent per portrait.

**Why it's inefficient:**
- Each portrait read, judgment, and JSON emission bloats the parent's context linearly. For a 10-portrait corpus, the parent ends up holding 10 portrait texts + 10 rationales + 10 JSON blobs + the 13KB judge prompt, easily 30K–60K tokens of context the parent doesn't need to keep once each score is saved.
- Wall-clock latency is linear in corpus size when it could be constant (or near-constant) with parallel subagents.
- The rubric itself demands calibration consistency; running portraits sequentially in the same context risks cross-contamination where earlier scores anchor later ones, hurting calibration.

**Efficient alternative:** In corpus mode, delegate each portrait to an isolated subagent. Each subagent receives: (a) the portrait file path, (b) the judge prompt path, (c) the required JSON output schema and save location. It reads both files in its own context, produces the JSON, writes it to disk, and returns only the filepath + a one-line summary (< 100 tokens) to the parent. The parent then reads just the saved JSON files to build the comparison table. This gives:
- Parallel execution (N portraits scored in roughly the time of 1).
- Parent context stays bounded regardless of corpus size (only N × ~100-token summaries plus N small JSON files it reads at aggregation time).
- Stronger calibration isolation — each subagent judges in a clean context with no prior scores visible.

**Estimated savings:** For a 10-portrait corpus at ~3K tokens per portrait + 3K tokens of judge reasoning, parent context drops from ~60K to ~5K (≈90% reduction) and wall-clock drops ≈5–8x with parallel delegation. At 20+ portraits this becomes load-bearing.

**Severity rationale:** High because (a) sequential independent operations with 5+ items is explicitly High in the severity guide, (b) corpus mode is a first-class input mode, not a rare edge case — the pre-pass specifically called out 3 sequential tool-call steps in SKILL.md.

---

### 2. Judge prompt is re-read once per portrait (MEDIUM)

**File:** `SKILL.md:39` — step 2 of the per-portrait process: "Load the judge prompt — read `./references/rubric-judge-prompt.md` in full."

**Current pattern:** The Process block is specified as a per-portrait procedure, and step 2 reads the 13KB judge prompt every iteration. In a 10-portrait corpus this reads the same file 10 times into the parent's context.

**Why it's inefficient:** The judge prompt is invariant across portraits in a single run — nothing about it changes between scorings. Re-reading it each loop iteration wastes tool calls and (more importantly) the parent will typically already have it in context from the first read, so subsequent reads are pure duplicate tokens.

**Efficient alternative:** Reword step 2 as a one-time setup action at the start of the run, before the per-portrait loop:

```
## Process

**Setup (once per run):** Read `./references/rubric-judge-prompt.md` in full. This is the judge specification applied to every portrait in this run.

For each portrait being scored:
1. Load the portrait text — read the file or accept the pasted text as-is.
2. Compose the evaluation — present the already-loaded judge prompt with the portrait text appended...
```

If finding #1 (parallel subagents) is adopted, this becomes moot in corpus mode because each subagent reads the judge prompt exactly once in its own context. But even in single-portrait mode the reword is clearer.

**Estimated savings:** ≈13KB × (N-1) tokens of duplicate reads in corpus mode; negligible in single-portrait mode but a clarity win.

---

### 3. Three sequential tool-call steps in SKILL.md Process (MEDIUM — from pre-pass, confirmed)

**File:** `SKILL.md:38-42` — steps 1, 2, and 5 of the per-portrait Process each involve a file operation (read portrait, read judge prompt, save JSON).

**Current pattern:** Steps 1 and 2 are both independent Read operations — reading the portrait file and reading the judge prompt can happen in a single parallel tool call block. Step 5 (save JSON) is a Write and necessarily comes after step 4 (produce score), so it's a true sequential dependency and not the concern here.

**Why it's inefficient:** In single-portrait mode, steps 1 and 2 serialize two independent Reads. This is low-volume but still worth calling out because the SKILL.md phrasing ("1. Load the portrait text ... 2. Load the judge prompt") nudges the agent toward sequential execution.

**Efficient alternative:** Reword steps 1–2 to explicitly encourage batching:

```
1. **Load inputs in parallel** — in a single message, Read the portrait file AND Read `./references/rubric-judge-prompt.md`.
```

Combined with finding #2, this collapses into the one-time setup read for the judge prompt, and only the portrait Read remains per-iteration.

**Estimated savings:** One round-trip per single-portrait run; minor but easy.

---

### 4. No explicit non-reading instruction for the aggregation phase in corpus mode (LOW)

**File:** `SKILL.md:44-47` — corpus and baseline mode descriptions.

**Current pattern:** The corpus mode paragraph says "Score each portrait, then aggregate into a comparison table" and "Print a comparison table (rows = portraits, columns = dimensions)." If finding #1 is adopted (subagent per portrait), the skill should make explicit that the parent builds the comparison table by reading the small JSON files written by subagents — not by asking subagents to return full evaluations, and not by reading portrait texts itself.

**Why it matters:** Without an explicit instruction, a future agent implementing corpus mode might fall into the implicit-read trap described in the scanner brief: "review all the scores" or "summarize what you received" phrasing nudges the parent to re-read portraits or hold all raw judgments in context. The current phrasing is neutral but could be tightened.

**Efficient alternative:** Add one sentence after the corpus paragraph: "The parent does not read portrait texts during aggregation — only the per-portrait JSON files written to `_bmad-output/portrait-rubric-runs/`."

**Estimated savings:** Prevents future context bloat regressions. No current savings.

---

### 5. Baseline comparison scan is single-file and trivially efficient (no issue)

**File:** `SKILL.md:30, 48`

Baseline mode reads exactly one prior corpus JSON and diffs against the current run. This is a single small Read and some arithmetic — no efficiency concern. Noted for completeness.

---

## Optimization Opportunities (structural)

### Opt 1: Add a "corpus mode" subagent dispatch pattern to SKILL.md

Rather than treating corpus mode as "the same process, repeated," document it as its own execution pattern:

```
## Corpus execution

For corpus mode (5+ portraits), delegate each portrait to an isolated subagent in parallel. Each subagent:

- Receives: {portrait_path, judge_prompt_path, output_json_path, rubric_version, run_timestamp}
- Reads the portrait and judge prompt in its own context
- Produces the JSON per the schema in the judge prompt
- Writes the JSON to output_json_path
- Returns ONLY: {portrait_id, overall_score, flags_count, output_path} — no rationales, no full scores, no prose. ≤50 tokens.

Parent then reads each written JSON file to build the comparison table. Parent never holds more than one full evaluation in context at a time.
```

**Impact:** Turns corpus mode from O(N) serial context growth into O(1) bounded parent context with parallel wall-clock. For the stated use case (baseline regression tracking across many portraits), this is the difference between a 5-minute slog and a 30-second scan.

### Opt 2: Threshold-based delegation

Add a threshold: single-portrait and 2-4 portrait runs can happen in parent (latency gain from subagents wouldn't offset setup overhead). 5+ portraits → subagent dispatch. This matches the scanner's multi-document analysis threshold (5+ documents).

### Opt 3: Judgment isolation as a calibration benefit

Frame the subagent pattern not just as an efficiency optimization but as a calibration requirement. The skill's own "Scoring principles" section (`SKILL.md:79-84`) stresses calibration stability and explicitly warns about score drift. Running 10 portraits in one context is a drift hazard — each prior score anchors the next. Subagent isolation eliminates this. This framing matters because it means Opt 1 isn't just faster, it's *more correct*.

---

## What's Already Efficient

- **No parent-reads-before-delegating trap** — there's no delegation at all in the current design, so there's no context bloat from that specific pattern. The skill is single-actor throughout.
- **Judge prompt is self-contained** — one reference file (`rubric-judge-prompt.md`) holds the full rubric, calibration cues, and output schema. No scattered "essential context" vs "full reference" split, no resource-scan-on-activation anti-pattern.
- **Clear input routing** — `SKILL.md:24-32` has five explicit input modes. This prevents the agent from running ambiguous scoring logic and avoids wasted speculative work.
- **Deterministic JSON output schema** — the exact schema is specified in the reference file (`rubric-judge-prompt.md:120-170`), with "Return only the JSON. No preamble, no postscript, no markdown fences." This matches the scanner's "ONLY return" / structured-output best practice exactly.
- **Fail-fast overall_score cap** — the rule that `insight_beneath_observation ≤ 2` caps `overall_score` at 2.5 (`rubric-judge-prompt.md:176`) is a form of cheap validation gating an expensive interpretation; the rubric itself encodes a fail-fast principle.
- **Stable save paths** — runs are saved under `_bmad-output/portrait-rubric-runs/<timestamp>-<portrait_id>.json` (`SKILL.md:42`), which makes aggregation readable from disk by path convention alone — a prerequisite for the subagent-dispatch optimization above.
- **No circular dependencies, no subagent-spawning-from-subagent, no diamond dependency issues** — matches pre-pass: zero critical/high structural issues in the dependency graph (the graph is effectively flat: Setup → per-portrait score → optional aggregate).

---

## Pre-pass reconciliation

The pre-pass flagged 1 medium issue: "3 sequential tool call steps found" in SKILL.md. Confirmed and covered by finding #3 above (and related to findings #1 and #2 for corpus mode). No additional critical or high findings surfaced beyond what manual review of the Process + corpus sections revealed.
