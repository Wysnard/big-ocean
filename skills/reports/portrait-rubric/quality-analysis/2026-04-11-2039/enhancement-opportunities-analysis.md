# Portrait Rubric — Enhancement Opportunities Analysis

**Scanner:** DreamBot (Creative Edge-Case & Experience Innovation)
**Skill analyzed:** `.claude/skills/portrait-rubric`
**Timestamp:** 2026-04-11-2039
**Rubric version analyzed:** 1.0

---

## Skill understanding

`portrait-rubric` is a Claude-as-judge quality scorer for Big Ocean "Nerin" portraits. It reads a self-contained judge prompt (`references/rubric-judge-prompt.md`), loads one or more portraits, and returns per-dimension JSON scores plus a human-readable markdown summary. It supports four input modes (inline text, single file, corpus, baseline comparison) and is load-bearing infrastructure for gating exit criteria on the portrait-generator improvement plan.

**Primary users:** (1) the portrait-generator improvement team running regression checks between phases, (2) future periodic quality-audit passes, and (3) plausibly other skills/pipelines that want an objective portrait quality number. It assumes Claude as the judge (no explicit model call-out), a v1 shipping without anchoring examples, and that humans invoke it interactively through the slash-command-style trigger.

**Key assumptions to challenge up front:** single-judge scoring is reliable enough for regression detection; corpus mode is small enough to fit in context; the directory `_bmad-output/portrait-rubric-runs/` exists (or can be created) wherever the skill is run; and the portrait text is already final prose — not mid-generation intermediate state.

---

## User journeys

### 1. The first-timer (generator team member who has never run the rubric)

**Narrative:** A dev wraps up a portrait-generator change and hears "run the rubric before we merge." They type `/portrait-rubric` with no arguments. The skill asks them what they want to score. They paste text. They get a table back and a JSON path.

**Friction points:**
- **"What does a good score look like?"** The markdown summary prints a table with scores and a "Take" line, but offers no orientation toward what the number _means_ for their decision. Is 3.4/5 a pass? A fail? A regression? The skill knows this context (it gates phase exit criteria) but doesn't tell the reader.
- **No "how to interpret" rail on first run.** The first-timer doesn't know that `insight_beneath_observation` is load-bearing even though SKILL.md screams it — only the judge does.
- **No explicit mention of which baseline they should compare against.** A first-timer won't know a baseline file exists at all, let alone where to find one.

**Bright spots:** Single-file mode is dead simple. The judge prompt is thorough and self-contained — a first-timer who reads it learns the product philosophy in 10 minutes.

### 2. The expert (improvement-plan owner running phase-gate evaluations)

**Narrative:** The owner runs corpus mode weekly. They already know the rubric. They want speed, stable output paths, reliable diffs against last week's baseline, and _trend data across runs_.

**Friction points:**
- **No trend view.** After three corpus runs, they have three timestamped JSON files with no tool to plot dimension medians over time. The baseline mode compares exactly two points — N-vs-N-1 — and loses anything older.
- **No "since last green" baseline shortcut.** They must remember/look up the path to last week's corpus JSON. A `--baseline latest` or `--baseline last-green` convenience would be huge.
- **Corpus ordering is implicit.** If I run corpus mode on 20 portraits twice and one file gets renamed, the comparison table rows don't line up. There's no portrait-id normalization rule called out.
- **No "re-score just these 3 portraits and merge into the last corpus" path.** Today, a full re-run is the only option.
- **Token cost invisibility.** Corpus mode on 20 portraits is a lot of tokens; there's no estimate shown before it runs, and no way to cap/budget it.

**Bright spots:** The JSON schema is crisp and versioned. Once they wire a baseline once, the regression-flagging delta logic is exactly what they need.

### 3. The confused user (invoked by accident / wrong intent)

**Narrative:** Someone running bmad workflows types `/portrait-rubric` thinking it's the portrait _generator_. The skill asks what to score. They don't have a portrait yet.

**Friction points:**
- **No disambiguation from the generator skill.** The name "portrait-rubric" is close enough to "portrait-generator" that confusion is likely. The opening prompt doesn't clearly orient the user to "this scores an existing portrait; if you want to _write_ one, use X."
- **"What do you want to score?" is a dead-end answer for someone with nothing.** There's no off-ramp to the generator, no "here's a sample portrait to try the scorer on" path.

### 4. The edge-case user (technically valid, unexpected input)

**Narrative:** Users who will break this in realistic ways:
- **Multi-portrait `.md` file** — one file containing three portraits separated by `---`. The skill treats it as one portrait and scores the concatenation.
- **Half-generated portrait** — streaming output copied before completion. No "Compulsion" movement present. Arc fidelity scores 2 for a portrait that was never finished.
- **Non-English portrait.** The judge prompt is English-only; German/Japanese portraits would get scored through an English-language rubric with undefined behavior.
- **Massive portrait (8k+ tokens).** Token budget collision inside corpus mode.
- **Portrait in a code block / wrapped in frontmatter.** `.md` files often have YAML frontmatter. The skill says "read the file as-is" and "do not edit" — so the judge sees frontmatter and may penalize voice for clinical metadata.
- **Glob matches zero files.** What happens? SKILL.md doesn't say.
- **Portraits with identical filenames in different subdirs during corpus mode.** JSON output filenames collide on `portrait_id`.
- **User scoring a portrait the rubric was designed to catch** — for example a portrait with one correct spine but a violating unresolved-cost placement. The rubric-version gate is 1.0, but there's no mechanism to note "this portrait is a known calibration anchor, score should be ~3.5."

**Friction:** No preflight validation, no `portrait_id` collision handling, no frontmatter stripping, no minimum-length sanity check, no "is this actually a portrait?" smell test.

### 5. The hostile environment (CI / missing deps)

**Narrative:** A cron job or CI pipeline invokes the skill headless-ish to post nightly regression reports.

**Friction points:**
- **No exit code contract.** Baseline mode flags regressions but gives no machine signal — CI can't tell "passed" from "regressed" without parsing the markdown.
- **Output directory assumption.** `_bmad-output/portrait-rubric-runs/` is a relative path. In CI with a different working dir, writes could land in unexpected places. The path is also repo-specific — if this skill is ever portable, that's baked in.
- **Filesystem errors have no recovery path.** If the directory can't be created (permissions, read-only FS), SKILL.md just says "create it if it doesn't exist."
- **Judge determinism unaddressed.** Running the same portrait twice through Claude gives slightly different JSON. For a regression tool, this is the central threat. No mention of sampling (e.g., n=3 runs, take median) or temperature guidance.

### 6. The automator (pipeline / chained skill)

**Narrative:** The portrait-generator skill's own CI check, or a BMad workflow, wants to invoke portrait-rubric headless with `portrait_path=X`, `baseline=Y` and get back a JSON path + pass/fail.

**Friction points:**
- **No headless invocation contract.** The only entry point is a conversation. An automator must use the conversational trigger and parse markdown.
- **No "threshold" config.** A caller can't say "fail if any dimension drops below 3." The skill emits a regression flag at >0.5 delta, but the threshold is hard-coded in the SKILL.md narrative rather than parameterized.
- **No structured return for chained use.** The markdown Take line is human-targeted prose; nothing machine-extractable aside from the saved JSON path.

**Bright spots:** The fact that results are saved as versioned JSON is exactly what an automator needs — the piece that's missing is a clean headless entry that returns just the path.

---

## Headless assessment

**Level: Easily adaptable.**

The skill is already 80% headless in shape — scoring is a deterministic function of `portrait_text` + `judge_prompt`, and the JSON is already the canonical output. The remaining interactivity is thin:

- "What do you want to score?" — auto-resolves from a `portrait_path` / `portraits_glob` / `portrait_text` parameter.
- Disambiguation ("directory with multiple files — all of them?") — auto-resolves if the caller passes an explicit `corpus: true` or a glob.
- Baseline path — caller passes it or omits it.

**A headless invocation would need:**

| Input | Source |
|---|---|
| `portrait_path` OR `portraits_glob` OR `portrait_text` | caller |
| `baseline_path` (optional) | caller |
| `output_dir` (optional, defaults to `_bmad-output/portrait-rubric-runs/`) | caller |
| `fail_on_regression` (optional, default false) | caller |
| `regression_threshold` (optional, default 0.5) | caller |
| `runs_per_portrait` (optional, default 1 — more for determinism) | caller |

**Output contract:** return `{ status: "ok"|"regressed"|"error", json_path: string, corpus_json_path?: string, flags: [...], summary_markdown: string }`. Exit non-zero on regression when `fail_on_regression` is set.

**Where `{headless_mode}` needs checking:** the routing step at the top of "Process" (skip disambiguation questions) and the final output step (return structured payload instead of printing markdown-only). Everything in between — load portrait, load judge prompt, compose evaluation, save JSON — already behaves headlessly.

**Not fundamentally interactive:** the value here is the judgment, not the conversation. This is a prime candidate for being usable from other skills and CI.

---

## Key findings

### Edge cases

**[high-opportunity] Judge non-determinism is the elephant in the room (scoring reliability)**
What I noticed: The skill's core job is regression detection, but it offers no mitigation for Claude-as-judge variance. On the hardest dimension (`insight_beneath_observation`), a single portrait can plausibly score 3 one run and 4 the next — well above the 0.5 "regression" threshold the baseline mode uses. The scanner's own SKILL.md even anticipates this ("If you notice your scores drifting across runs on the same portrait…").
Suggestion: Add an optional `runs_per_portrait` parameter (default 1, recommend 3) that re-scores each portrait N times and reports the median per dimension plus a within-dimension variance number. Make it _cheap_ to verify whether a flagged regression is real or noise. Even just documenting "run the baseline comparison twice and trust the intersection" would be a win.

**[high-opportunity] Frontmatter and wrapper contamination (input validation)**
What I noticed: `.md` portrait files in this repo almost certainly have YAML frontmatter or markdown wrappers. SKILL.md says "do not edit or paraphrase the portrait" — but a judge looking at `---\ntitle: foo\n---` as part of the "portrait" will (a) penalize voice for clinical metadata and (b) waste inferential attention on the wrapper.
Suggestion: Add a lightweight preprocessing step that strips YAML frontmatter and normalizes whitespace before the portrait hits the judge. Note what was stripped in the JSON output so the user can audit.

**[medium-opportunity] Corpus mode ID collisions**
What I noticed: `portrait_id = basename without extension` means `foo.md` in two directories clobber each other's JSON output.
Suggestion: When corpus mode detects a collision, disambiguate by including the immediate parent directory in the id (`parent/foo`). Document this in SKILL.md.

**[medium-opportunity] Glob-matches-nothing silence**
What I noticed: If a user passes `./portraits/*.md` and the glob matches zero files, there's no defined behavior.
Suggestion: Explicit "glob matched 0 files — did you mean X?" error path with a suggestion to list the directory.

**[medium-opportunity] Non-English portrait handling**
What I noticed: The judge prompt is English-only and the calibration cues reference English register ("horoscope," "clinical"). A German-language portrait would get scored through an English-language rubric with undefined behavior.
Suggestion: At minimum, add a preflight language-detect check that flags non-English portraits with a warning rather than silently scoring them.

**[low-opportunity] Half-generated portraits score as "missing arc"**
What I noticed: A streaming-generator test might copy partial output. The rubric would correctly see an absent Compulsion movement, but the user won't realize why.
Suggestion: A sanity check for portraits < some threshold (e.g., 1500 chars or missing a closing section) with a warning "this portrait looks truncated — are you sure?".

### Experience gaps

**[high-opportunity] Success amnesia after scoring**
What I noticed: The summary prints scores and a "take" — then the workflow just ends. There's no "here's what to do with this" guidance. A 2.1/5 score with `insight_beneath_observation: 1` is a _huge_ signal, but the skill doesn't connect it to any action (re-run generator with X prompt tweaks, check against baseline, flag for the improvement-plan owner, etc.).
Suggestion: Add a "Next actions" footer to the markdown summary that adapts to the result: e.g., if `insight_beneath_observation ≤2`, print "→ this is a failure-class score on the load-bearing dimension. Compare to the baseline with `--baseline <last-good>` before deciding." If all scores ≥4, print "→ looks clean. Consider promoting this corpus as the new baseline." Connect results to decisions.

**[high-opportunity] Invisible value: no trend memory**
What I noticed: Every corpus run produces a timestamped JSON. Nothing ever reads more than two of them. The _history_ of scores is the most valuable artifact for a quality-gating tool, and it exists on disk but is invisible.
Suggestion: Add a "trend" mode: `portrait-rubric trend [--last N]` that loads the last N corpus JSONs and prints a per-dimension sparkline or delta table. No new scoring — just read existing runs. Low cost, high value for the improvement-plan team.

**[medium-opportunity] No "explain this score" path**
What I noticed: After scoring, there's no way to ask "why did `spine_coherence` get a 3?" beyond the one-line rationale. The evidence field helps but isn't always present.
Suggestion: After producing the JSON, offer an optional "explain a dimension" follow-up — user names a dimension and the skill re-enters the judge prompt with a narrower question. This compounds over many runs into much better intuition for the team.

**[medium-opportunity] Baseline comparison is two-point, not trajectory**
What I noticed: `--baseline` is a one-hop comparison. A portrait that regresses 0.4 this run and 0.3 last run (cumulative 0.7 across two runs) would never be flagged.
Suggestion: In baseline mode, if the baseline JSON is itself part of a directory of historical runs, show a 3-point or 5-point trailing median alongside the single-point delta. Regression is a trajectory, not an event.

**[medium-opportunity] No "batch re-score" path**
What I noticed: If a user finds three portraits they want to re-check in a larger corpus, the only option is re-running the entire corpus.
Suggestion: Allow `--update <corpus-json> --portraits <paths>` to re-score specific portraits and merge their updated scores into an existing corpus JSON, writing a new timestamped file.

**[low-opportunity] No anchoring-sample on first run**
What I noticed: A first-timer has no sense of what "a real 5" looks like.
Suggestion: Until v2 anchoring examples exist, offer a `demo` mode that scores a bundled known-good and known-bad example so the user sees the rubric in action before bringing their own portrait.

### Delight opportunities

**[high-opportunity] Parallel judge for determinism + robustness**
What I noticed: The most transformative addition for a judging skill is running _multiple_ independent judgments and reconciling them — either by taking the median, or by having a second pass reconcile disagreements. This directly addresses the deterministic-regression threat and is exactly the kind of creative addition the SKILL.md v2 plan doesn't currently include.
Suggestion: `--ensemble N` (default 1, recommend 3 for important gates). Run N independent scoring passes, report per-dimension median and range. If range > 1 on any dimension, flag "high judge variance — consider anchoring examples." Turns a soft "maybe drift" signal into a hard one.

**[high-opportunity] Result classification bands**
What I noticed: The scorecard prints numbers with no interpretation. A tiny interpretive scaffold would make the tool dramatically more useful without curating anchors.
Suggestion: Add four named bands to the overall take: `failing` (<2.5 or `insight` ≤2), `weak` (2.5–3.4), `solid` (3.5–4.2), `strong` (>4.2). Print the band prominently. This isn't grading on a curve — it's surfacing the rubric's own built-in failure-cap rule (the 2.5 cap when insight ≤2) as an explicit band.

**[medium-opportunity] Cross-skill pairing hint**
What I noticed: The skill sits in an ecosystem of portrait-related bmad skills but never tells the user.
Suggestion: If `insight_beneath_observation` is ≤2, suggest running the portrait back through a regeneration pass with the failing dimension as input. If the corpus is flagged as regressing, suggest the retro skill. A single "pairs well with" line in the footer changes the workflow from "score" to "score and recover."

**[medium-opportunity] Dimension-specific "smell tests" before invoking the judge**
What I noticed: Some failure modes are cheap to detect without LLM scoring at all — e.g., "portrait contains the word 'research suggests'" is a near-certain voice failure. Catching these with deterministic pre-checks would (a) be free and (b) pre-load flags before the judge even runs.
Suggestion: Add a small set of regex smell-tests that emit pre-flags: clinical phrases, horoscope openers, hedging stacks ("you may sometimes find yourself"), self-reference by Nerin ("I've been sitting with"). These become input signal to the judge AND explicit flags in the output.

**[low-opportunity] Lock the judge prompt version inside the JSON output**
What I noticed: JSON already has `rubric_version: "1.0"` but no hash/timestamp of the judge prompt file itself. If someone edits the prompt mid-phase, old and new runs become silently incomparable.
Suggestion: Include a short hash of the judge prompt in the output JSON (`judge_prompt_hash`). Baseline mode refuses to compare across hashes without an explicit override.

### Assumption audit

**[high-opportunity] Assumption: "one judge reading is enough for regression detection"**
Already covered above but worth restating — this is the single assumption most likely to cause the skill to produce false positives or miss real regressions in practice. Addressing it (via ensemble or median-of-N) is the biggest quality win available short of v2 anchoring.

**[medium-opportunity] Assumption: "the user has a baseline to compare against"**
The first time anyone uses baseline mode, there's no baseline. The workflow doesn't narrate the bootstrap: "your first corpus run IS the baseline — save it."
Suggestion: On first-ever corpus run (detected by empty `_bmad-output/portrait-rubric-runs/`), print a notice "this appears to be your first run — this corpus will become the baseline for your next comparison."

**[medium-opportunity] Assumption: "the portrait is final prose"**
The improvement plan SKILL.md references almost certainly involves judging intermediate / in-progress portraits during phase testing. The skill has no concept of "this is a WIP" vs "this is for the canonical baseline."
Suggestion: Optional `--wip` flag that tags the run as WIP in the JSON and prevents it from being used as a baseline. Softly enforces baseline hygiene.

**[low-opportunity] Assumption: "Claude is the judge"**
The judge is never explicitly named. If someone ran this through a cheaper model, the calibration anchors would break silently.
Suggestion: Declare the judge model in the output JSON, and refuse baseline comparisons across different judge models unless overridden.

---

## Facilitative patterns check

This skill is a _judging utility_, not a collaborative discovery workflow — most of the 7 facilitative patterns don't apply. The ones that _do_ matter:

| Pattern | Present? | Assessment |
|---|---|---|
| **Soft Gate Elicitation** | N/A | No interactive discovery; utility skill. |
| **Intent-Before-Ingestion** | Partial | SKILL.md routes on input shape but doesn't confirm intent. A first-timer mistaking this for the generator would benefit from a one-line "this scores an existing portrait — want to score one?" check at ambiguous entry. **[low-opportunity]** |
| **Capture-Don't-Interrupt** | N/A | Single-shot evaluation, no mid-flow tangents to capture. |
| **Dual-Output** | **Missing — HIGH opportunity** | The skill already emits both JSON (machine) and markdown (human). That's dual-output in shape. But the markdown summary is currently user-only and the JSON is automator-only — there's no _distillate_ optimized for another LLM consuming the score (e.g., the portrait-generator auto-correcting on feedback). Add a compact machine-readable summary block (`summary_distillate`) inside the JSON: the top 2 flags, the lowest-scoring dimension, the "action" hint — usable by a next-step LLM without re-parsing the rationale prose. **[medium-opportunity]** |
| **Parallel Review Lenses** | **Missing — HIGHEST opportunity** | This is the single most transformative addition available. A rubric scorer whose core reliability risk is judge variance would benefit enormously from running the scoring through 2-3 parallel lenses (e.g., "rigorous judge," "generous judge," "spine specialist") and reconciling. It directly maps to the ensemble suggestion above. Of all the facilitative patterns, this one was _designed_ for exactly this use case. **[high-opportunity]** |
| **Three-Mode Architecture** | **Missing — MEDIUM opportunity** | Currently only interactive mode exists. Adding `guided` (current conversational flow), `yolo` (single-shot with minimal prompting), and `autonomous` (pure headless, params-in/JSON-out) would map cleanly onto the journeys above — first-timers get guided, experts get yolo, automators get autonomous. **[medium-opportunity]** |
| **Graceful Degradation** | Partial | The rubric version in JSON gives forward compat, but there's no fallback for judge failures (timeout, parse error). Add: if JSON parsing fails, retry once with an explicit "return only JSON" reminder, then fail loudly with the raw judge output preserved. **[medium-opportunity]** |

---

## Top insights (the three that matter most)

### 1. Judge variance is the central threat, and the skill has no defense against it

The entire value proposition of this skill is "stable enough to detect regressions." Claude-as-judge is not deterministic, and the hardest dimension (`insight_beneath_observation`) is also the noisiest. The v2 anchoring plan will help, but it won't close the variance gap alone. **The single highest-impact addition is an ensemble mode** — run N independent scoring passes (default 1, configurable to 3+ for phase gates), report the median and range, flag any dimension with range >1 as "high judge variance." This turns the skill from a point estimate into a confidence interval, which is what regression detection actually requires. It's cheap to implement (loop the existing prompt N times, median the results) and directly addresses the threat SKILL.md already acknowledges.

### 2. The skill has almost no feedback loop with its own outputs

Every corpus run produces a timestamped JSON. The skill reads at most _one_ prior JSON (baseline mode). The full trend history exists on disk and is invisible. The single most valuable artifact for a quality-gating tool — "are we getting better or worse over time?" — is sitting unused. **A no-scoring, read-only `trend` mode that loads the last N corpus runs and prints a per-dimension trajectory table would unlock the existing outputs without spending any more tokens.** This is the quintessential "invisible value" gap: the skill is already producing the data, it's just not surfacing it.

### 3. The skill is 80% headless but 0% consumable by other skills

The scoring logic is a pure function; the JSON is already machine-readable; the four input modes are naturally parameterizable. But the only entry point is conversational, so no other skill or CI job can invoke it cleanly. **Making this skill headless-first (with conversation as the thin wrapper) unlocks an entire class of uses** — the portrait-generator can score its own output during iteration, CI can post nightly regression reports, retrospective skills can pull quality numbers automatically. The lift is small (a parameter contract + a structured return) and the ceiling is very high. Pair this with the parallel-lens ensemble mode above and you have a genuinely differentiated quality tool for the whole improvement plan, not just a scorer used by hand.

---

**Filename written:** `enhancement-opportunities-analysis.md`
