# Story 22.3: Contradiction-Surfacing Migration to Portrait Generator

Status: ready-for-dev

## Story

As a developer,
I want contradiction-surfacing moved from Nerin's character bible to the portrait generator prompt,
So that contradictions are surfaced in the portrait narrative rather than during the conversation.

## Acceptance Criteria

1. **Given** the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts` **When** contradiction-surfacing instructions are removed **Then** all references to "contradictions are features" and "surface them as threads" are removed from the character bible

2. **Given** the portrait generator repository at `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` **When** contradiction-surfacing is added to the full portrait prompt **Then** it includes a single unconditional instruction: "Look for contradictions and tensions in the evidence — places where the user's behavior in one domain conflicts with another. Surface them as discoveries, not diagnoses." **And** this instruction is in the full portrait generator only — NOT in the teaser portrait

3. **Given** the portrait generator is updated **When** a portrait is generated **Then** the portrait narrative naturally incorporates contradictions found in the evidence **And** contradictions are framed as discoveries, not clinical observations

## Tasks / Subtasks

- [ ] Task 1: Remove contradiction-surfacing from Nerin character bible (AC: #1)
  - [ ] 1.1: In `packages/domain/src/constants/nerin-chat-context.ts`, remove the "CONTRADICTIONS ARE FEATURES, NOT BUGS" belief block from the "HOW TO BEHAVE — BELIEFS IN ACTION" section
  - [ ] 1.2: Verify no other contradiction-surfacing references remain in the character bible
  - [ ] 1.3: Verify the observation + question section's contradiction example ("You said X earlier, and now Y") remains — it is a general observation technique, not contradiction-surfacing strategy

- [ ] Task 2: Add contradiction-surfacing instruction to portrait generator (AC: #2)
  - [ ] 2.1: In `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts`, add contradiction-surfacing instruction to the `PORTRAIT_CONTEXT` constant
  - [ ] 2.2: Place the instruction as an unconditional directive in the appropriate section (near BEFORE YOU WRITE or as a dedicated subsection)
  - [ ] 2.3: Verify the teaser portrait at `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts` does NOT receive the contradiction-surfacing instruction

- [ ] Task 3: Write tests to verify the migration (AC: #1, #2, #3)
  - [ ] 3.1: Write a test that verifies the character bible does NOT contain "contradictions are features" or "surface them as threads"
  - [ ] 3.2: Write a test that verifies the portrait generator prompt DOES contain the contradiction-surfacing instruction
  - [ ] 3.3: Write a test that verifies the teaser portrait prompt does NOT contain the contradiction-surfacing instruction

- [ ] Task 4: Update JSDoc comment in character bible (AC: #1)
  - [ ] 4.1: Update the top-level JSDoc comment in `nerin-chat-context.ts` to note Story 22-3 removed contradiction-surfacing (migrated to portrait generator)

## Dev Notes

### Key Files

- `packages/domain/src/constants/nerin-chat-context.ts` — remove contradiction-surfacing belief block
- `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` — add contradiction-surfacing instruction to PORTRAIT_CONTEXT
- `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts` — verify NO changes needed

### What to Remove from Character Bible

The exact block to remove from the "HOW TO BEHAVE — BELIEFS IN ACTION" section:

```
CONTRADICTIONS ARE FEATURES, NOT BUGS.
When someone is organized AND chaotic, cautious AND impulsive — that's not confusion. That's complexity. Get curious about contradictions. Surface them as threads: "Those feel different to me — what do you think?" Contradictions are where the most interesting patterns hide.
```

### What to Add to Portrait Generator

A single unconditional instruction added to the portrait prompt context. The exact wording per FR17:
"Look for contradictions and tensions in the evidence — places where the user's behavior in one domain conflicts with another. Surface them as discoveries, not diagnoses."

### Observation + Question Section Preserved

The observation + question section already contains a contradiction-related example:
`"You said X earlier, and now Y — those feel different to me. What do you think?"`

This is an observation technique example, not a contradiction-surfacing strategy. It should remain untouched.
