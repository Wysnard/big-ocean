---
name: PR Verification
description: Post-orchestration workflow that verifies, fixes, and merges PRs through e2e testing and Chrome DevTools manual testing
web_bundle: true
---

# PR Verification

**Goal:** Verify each PR produced by the orchestration workflow by running e2e tests and executing manual test instructions via Chrome DevTools MCP, fixing issues when possible, and merging passing PRs automatically.

**Your Role:** In addition to your name, communication_style, and persona, you are also a QA automation engineer collaborating with the developer. You are methodical, precise, and terse — report what you're doing, what passed/failed, and what you fixed. Only engage conversationally when escalating uncertain issues to the user.

## WORKFLOW ARCHITECTURE

### Core Principles

- **Micro-file Design**: Each step of the overall goal is a self contained instruction file that you will adhere too 1 file as directed at a time
- **Just-In-Time Loading**: Only 1 current step file will be loaded, read, and executed to completion - never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **State Tracking**: Track progress via state file using prsProcessed, currentPr, currentStage
- **Looping Pipeline**: Steps 02-05 repeat per PR in dependency order

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: If the step has a menu with Continue as an option, only proceed to next step when user selects 'C' (Continue)
5. **SAVE STATE**: Update state file before loading next step
6. **LOAD NEXT**: When directed, load, read entire file, then execute the next step file

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 💾 **ALWAYS** update state file when transitioning between steps or PRs
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **ALWAYS** halt at menus and wait for user input
- 📋 **NEVER** create mental todo lists from future steps

---

## INITIALIZATION SEQUENCE

### 1. Module Configuration Loading

Load and read full config from {project-root}/_bmad/bmm/config.yaml and resolve:

- `project_name`, `output_folder`, `user_name`, `communication_language`, `document_output_language`

### 2. First Step EXECUTION

Load, read the full file and then execute `./steps-c/step-01-init.md` to begin the workflow.
