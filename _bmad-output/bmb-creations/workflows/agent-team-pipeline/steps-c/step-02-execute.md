---
name: 'step-02-execute'
description: 'Fan-out: spawn one subagent per story with worktree isolation, collect results, update pipeline state'

pipelineState: '{implementation_artifacts}/pipeline-state.yaml'
agentPrompts: '{installed_path}/data/agent-prompts.md'
epicsFile: '{planning_artifacts}/epics.md'
nextStepFile: './step-03-cleanup.md'
---

# Step 2: Execute Story Pipelines

## STEP GOAL:

To spawn one subagent per story (using Agent tool with `isolation: "worktree"`), each running the full 8-stage pipeline from story creation through CI-passing PR. Collect all results, update pipeline state, and proceed to cleanup.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip reading the agent prompt template
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are the Scrum Master (Bob) orchestrating parallel story execution
- ✅ Spawn all subagents in ONE message for maximum parallelism
- ✅ Fully autonomous — no user interaction unless a HALT occurs

### Step-Specific Rules:

- 🎯 Focus ONLY on spawning agents and collecting results
- 🚫 FORBIDDEN to implement stories yourself — subagents do the work
- 🚫 FORBIDDEN to spawn agents one at a time — use ONE message with multiple Agent calls
- 💬 Report results clearly after all agents return

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update {pipelineState} after all agents return
- 📖 Read agent prompt template and inject variables per story
- 🚫 HALT if all stories fail

## CONTEXT BOUNDARIES:

- Available: pipeline-state.yaml, agent-prompts.md, epics file, context docs
- Focus: spawning agents and collecting results
- Limits: do not implement stories directly
- Dependencies: pipeline-state.yaml must exist with stories

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load Pipeline State

Read {pipelineState} completely.

Extract:
- `baseline_commit`
- `context_docs` (architecture, ux, innovation, project_context paths)
- All stories where `status` is NOT "done"

**IF no stories need execution:** HALT — "All stories are already done. Nothing to execute."

### 2. Load Agent Prompt Template

Read {agentPrompts} completely.

Extract the prompt template from the `## Prompt Template` section.

### 3. Build Per-Story Prompts

For EACH story that needs execution, create a self-contained prompt by replacing ALL template variables:

| Variable | Source |
|----------|--------|
| `{{story_key}}` | Story key from pipeline state |
| `{{epics_file}}` | {epicsFile} |
| `{{sprint_status}}` | Resolved path to sprint-status.yaml |
| `{{baseline_commit}}` | From pipeline state |
| `{{architecture_file}}` | From context_docs (or "not available") |
| `{{ux_file}}` | From context_docs (or "not available") |
| `{{innovation_file}}` | From context_docs (or "not available") |
| `{{project_context}}` | From context_docs (or "not available") |
| `{{implementation_artifacts}}` | Resolved path |
| `{{planning_artifacts}}` | Resolved path |

**CRITICAL:** Each prompt must be fully self-contained. The subagent has NO access to pipeline state, workflow files, or the team lead's context. Every path, every instruction, every piece of context must be in the prompt.

### 4. Spawn All Subagents

Spawn ALL story subagents in a SINGLE message using multiple Agent tool calls.

For each story, use:
```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  mode: "bypassPermissions"
  name: "story-{{story_key}}"
  description: "Pipeline for {{story_key}}"
  prompt: [the fully-resolved prompt from step 3]
```

**CRITICAL:** All Agent calls MUST be in ONE message to enable parallel execution. Do NOT spawn them one at a time.

### 5. Collect Results

Wait for ALL subagents to return.

For each subagent response, parse the `PIPELINE_RESULT:` block at the end:

```
PIPELINE_RESULT:
story_key: [key]
status: done|halted
pr_url: [url or null]
dev_branch: [branch]
halted_at: [stage name, if halted]
error: [error details, if halted]
```

**IF a subagent response does not contain a PIPELINE_RESULT block:**
- Treat as halted
- Set error to: "Subagent did not return PIPELINE_RESULT block"
- Set halted_at to: "unknown"

### 6. Update Pipeline State

Update {pipelineState} with results from all subagents:

For each story, update:
- `status`: "done" or "halted"
- `pr_url`: PR URL if created
- `dev_branch`: branch name
- `error`: error details if halted

Update `last_updated` timestamp.

### 7. Report Execution Results

Output summary:

"**Execution Complete**

| Story | Status | PR | Error |
|-------|--------|----|-------|
| [key] | done | [url] | — |
| [key] | halted | — | [error summary] |

**Succeeded:** [count]
**Halted:** [count]

**Proceeding to cleanup...**"

### 8. Auto-Proceed to Cleanup

Immediately load, read entire file, then execute {nextStepFile}.

#### Menu Handling Logic:

- After results are reported, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step with no user choices
- Proceed directly to step-03 after reporting

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN all subagents have returned, pipeline state has been updated, and results have been reported will you load and read fully {nextStepFile} to begin cleanup.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Pipeline state loaded and stories identified
- Agent prompt template loaded and variables injected correctly
- ALL subagents spawned in ONE message (parallel)
- All subagent results collected and parsed
- Pipeline state updated with final statuses
- Results summary reported
- Auto-proceeded to step-03

### ❌ SYSTEM FAILURE:

- Spawning agents one at a time (not parallel)
- Not injecting all template variables
- Not parsing PIPELINE_RESULT from subagent responses
- Not updating pipeline state after execution
- Implementing stories directly instead of using subagents
- Skipping any step in the sequence

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
