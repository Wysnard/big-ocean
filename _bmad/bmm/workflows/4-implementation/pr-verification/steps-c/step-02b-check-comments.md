---
name: 'step-02b-check-comments'
description: 'Check PR review comments and conversation, fix actionable feedback, reply to comments'

nextStepFile: './step-03-e2e-testing.md'
loopStepFile: './step-02-checkout-rebase.md'
finalStepFile: './step-06-summary.md'
stateFile: '{output_folder}/pr-verification-state.yaml'
escalationPattern: '../data/escalation-pattern.md'
---

# Step 2b: Check PR Comments

## STEP GOAL:

To fetch all PR review comments and conversation comments, check for "changes requested" status, parse actionable feedback, apply fixes, reply to each comment on GitHub, and ask the user when feedback is ambiguous.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are a QA automation engineer — methodical, precise, terse
- ✅ Report each comment, its resolution, and the reply posted
- ✅ Ask the user for clarification when a comment is ambiguous

### Step-Specific Rules:

- 🎯 Focus only on reading PR comments, fixing issues, and replying
- 🚫 FORBIDDEN to run tests — that comes in step 03
- 🚫 FORBIDDEN to merge — that comes in step 05
- 💬 Approach: fetch comments, triage, fix or ask user, reply on GitHub
- 🔄 Retry limit: ONE fix attempt per comment, then escalate

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update state file after comment processing completes
- 📖 Reply to every actionable comment on GitHub
- 🚫 Never skip ambiguous comments without asking the user

## CONTEXT BOUNDARIES:

- Available: state file with current PR info, GitHub PR comments and reviews
- Focus: PR comment triage and resolution only
- Limits: do not run tests or merge
- Dependencies: step-02 must have completed checkout and rebase

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Load Context

Read {stateFile} to get current PR info (prNumber, branch, storyKey).

Report: "**Checking comments for PR #[number]** (Story [storyKey])"

### 2. Check Review Status

Check if any reviewer has formally requested changes:

```bash
gh pr view [prNumber] --json reviews -q '.reviews[] | select(.state == "CHANGES_REQUESTED") | {author: .author.login, state: .state}'
```

**If "changes requested" found:**
Report: "⚠️ Changes requested by [reviewer]. Will address their feedback."

**If no changes requested:**
Report: "No formal change requests. Checking comments..."

### 3. Fetch All Comments

Fetch both review comments (inline code review) and conversation comments:

```bash
gh pr view [prNumber] --json comments,reviews -q '{comments: .comments, reviews: .reviews}'
```

Also fetch inline review comments:
```bash
gh api repos/{owner}/{repo}/pulls/[prNumber]/comments
```

**If no comments found:**
Report: "No comments on PR #[number]. Skipping to e2e testing."
→ Skip to step 7 (Update State).

**If comments found:**
Report: "**Found [N] comment(s).** Processing..."

### 4. Triage Each Comment

For EACH comment, determine if it is actionable:

**Category A — Clear actionable feedback:**
The comment requests a specific code change, points out a bug, or suggests an improvement with enough detail to act on.
→ Proceed to step 5 (Fix and Reply).

**Category B — Ambiguous feedback:**
The comment suggests a change but the intent, scope, or desired outcome is unclear.
→ Present the comment to the user:

"**Ambiguous comment from @[author]:**

> [comment body]

**On file:** [file path, if inline comment]

**What should I do?**
- Type your instructions for how to address this
- **[S]kip** — Skip this comment
- **[N]ot actionable** — Reply that no change is needed"

Wait for user input. Apply their guidance, then reply on GitHub.

**Category C — Not actionable:**
The comment is a question, acknowledgment, approval, or discussion that doesn't require a code change (e.g., "looks good", "nice approach", "I agree").
→ Skip silently. Report: "Skipped non-actionable comment from @[author]."

### 5. Fix and Reply (Retry Limit: 1)

For each actionable comment:

1. **Read the relevant code** referenced by the comment
2. **Apply the fix** based on the feedback
3. **Commit** with conventional format: `git commit -m "fix: address review — [description]"`
4. **Reply to the comment on GitHub:**

```bash
gh api repos/{owner}/{repo}/pulls/[prNumber]/comments/[commentId]/replies -f body="Fixed in [commit SHA short]. [Brief description of what was changed]."
```

For conversation comments (not inline), reply with:
```bash
gh pr comment [prNumber] --body "Addressed: [brief description]. Fixed in [commit SHA short]."
```

5. **If fix fails or is uncertain after one attempt** → escalate using {escalationPattern} Standard Escalation Menu (F/S/X). Route X to {loopStepFile} for next PR, or {finalStepFile} if no PRs remain. Update {stateFile} accordingly.

Report: "✓ Comment from @[author]: fixed and replied."

### 6. Push Fixes

After all comments are processed, push all fix commits:

```bash
git push --force-with-lease origin [branch]
```

Report: "Pushed [N] fix commit(s) for review comments."

### 7. Update State

Update {stateFile}:
- `currentStage`: `e2e-testing`

Report: "**Comment check complete for PR #[number].**"
Report: "Results: [N] addressed, [N] skipped, [N] not actionable"

### 8. Present MENU OPTIONS

Display: "**Proceeding to e2e testing...**"

#### Menu Handling Logic:

- After state update and fixes pushed, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step
- Proceed directly to e2e testing after comment processing completes

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Review status checked (changes requested detection)
- Both inline review comments and conversation comments fetched
- Each comment triaged into actionable / ambiguous / not actionable
- Ambiguous comments presented to user for clarification
- Fixes applied and committed with conventional commit format
- Every addressed comment replied to on GitHub
- Retry limit respected (one fix attempt max)
- State file updated

### ❌ SYSTEM FAILURE:

- Not checking for "changes requested" review status
- Only fetching one type of comment (missing inline or conversation)
- Silently skipping actionable comments
- Not asking user about ambiguous comments
- Not replying to comments on GitHub after fixing
- Entering infinite fix loops (more than one fix attempt)
- Running tests or merging in this step

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
