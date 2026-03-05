# Story 22-2: Relate > Reflect & Story-Pulling Patterns

## Status: ready-for-dev

## Story

As a developer,
I want Nerin's character bible updated with relate > reflect patterns, story-pulling as the primary question type, and territory bridge transitions,
So that conversations feel like natural exchanges rather than clinical assessments.

**Epic:** 2 - Nerin Character Evolution
**FRs covered:** FR9, FR10, FR11

## Acceptance Criteria

**AC1: Relate > Reflect Patterns**
**Given** the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`
**When** relate > reflect patterns are added
**Then** at least 5 relate > reflect patterns are included, covering light, medium, and heavy territory types
**And** all relate patterns use AI-truthful framing ("In conversations I've had...", "Something I notice is..." -- NOT "I've seen people who..." or other hallucination-adjacent framing)

**AC2: Story-Pulling Patterns**
**Given** the character bible update
**When** story-pulling patterns are added
**Then** at least 5 story-pulling question patterns are included beyond the openers in the territory catalog
**And** story-pulling is positioned as the primary question type (70%+ of questions should pull concrete, situated narratives over introspective probes)

**AC3: Observation + Question Repositioned**
**Given** the character bible update
**When** the "observation + question" default pattern is addressed
**Then** it is repositioned as a secondary tool, not the default interaction pattern
**And** relate > reflect is established as the primary interaction pattern (FR9)

**AC4: Ocean Mirrors as Territory Bridges**
**Given** the character bible update
**When** ocean mirrors are addressed
**Then** they are repurposed as territory bridges -- natural transitions between conversation topics (FR11)

**AC5: Normalization Pattern**
**Given** the character bible update
**When** normalization patterns are added
**Then** "It's okay to not know" normalization is included to help users feel safe exploring uncertainty

## Tasks

### Task 1: Update tests for character bible changes (TDD - red phase)

**File:** `packages/domain/src/utils/__tests__/nerin-system-prompt-persona.test.ts`

- Add test asserting "RELATE > REFLECT" section header (or equivalent) is present in CHAT_CONTEXT
- Add test asserting at least 5 relate > reflect patterns exist (check for AI-truthful framing markers like "In conversations I've had")
- Add test asserting "STORY-PULLING" section header (or equivalent) is present
- Add test asserting at least 5 story-pulling patterns exist
- Add test asserting "OBSERVATION + QUESTION" section is repositioned (no longer labeled as "core move" or "default")
- Add test asserting "TERRITORY BRIDGES" or equivalent text is present in natural world mirrors section
- Add test asserting "it's okay to not know" normalization text is present
- Add test asserting no hallucination-adjacent framing ("I've seen people who...") exists
- Verify all new tests fail (red phase)

### Task 2: Add relate > reflect as primary interaction pattern

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Add a new "RELATE > REFLECT" section before the existing "OBSERVATION + QUESTION" section
- Include at least 5 relate > reflect patterns covering:
  - Light territory examples (casual sharing, preferences)
  - Medium territory examples (personal stakes, motivations)
  - Heavy territory examples (vulnerability, identity questions)
- All patterns must use AI-truthful framing:
  - "In conversations I've had..."
  - "Something I notice is..."
  - "What often comes up when people talk about this is..."
  - NOT: "I've seen people who..." or "People I know..."
- Position relate > reflect as the PRIMARY interaction pattern

### Task 3: Add story-pulling as primary question type

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Add a "STORY-PULLING" section establishing it as the primary question type (70%+)
- Include at least 5 story-pulling patterns beyond territory catalog openers:
  - "Tell me about a time when..."
  - "Walk me through what happened when..."
  - "What was it like when..."
  - "Can you think of a moment where..."
  - "How did that actually play out?"
- Explain the principle: concrete, situated narratives reveal more than introspective probes
- Contrast with introspective questions ("Why do you think you do that?") as secondary tools

### Task 4: Reposition observation + question as secondary tool

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Change the "OBSERVATION + QUESTION FORMAT" section header to indicate it is one tool among several (not "Your core move")
- Remove language that positions it as the default or primary pattern
- Add a note that relate > reflect is the primary pattern, with observation + question used when a specific observation warrants direct naming
- Preserve the existing examples and the observation-then-question pairing guidance

### Task 5: Repurpose ocean mirrors as territory bridges

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Add "TERRITORY BRIDGES" guidance to the "NATURAL WORLD MIRRORS" section
- Explain that ocean mirrors can serve as natural transitions between conversation topics
- Add 2-3 examples of how a mirror can bridge from one topic area to another
- Preserve existing mirror placement rules, delivery guidelines, and the 13-mirror library

### Task 6: Add "It's okay to not know" normalization

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Add normalization language to the "CONVERSATION AWARENESS" section (or create a subsection)
- Include explicit guidance: when users say "I don't know" or struggle with a question, normalize it
- Example phrases: "That's a great non-answer -- the fact that you can't name it tells me something", "Not knowing is fine -- sometimes the interesting stuff is pre-verbal"
- This helps users feel safe exploring uncertainty rather than feeling tested

### Task 7: Update JSDoc comment

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Update the file-level JSDoc to reflect new sections: relate > reflect, story-pulling, territory bridges, normalization
- Reference Story 22-2 in the changelog comment

### Task 8: Run all tests and verify

- Run `pnpm test:run` to verify all tests pass (green phase)
- Run `pnpm turbo typecheck` to verify type safety
- Ensure no other tests break due to content changes in the character bible

## Technical Notes

- The character bible is a string constant (`CHAT_CONTEXT`) used by `buildChatSystemPrompt()` in `nerin-system-prompt.ts`
- Existing tests in `nerin-system-prompt-persona.test.ts` check for section headers and specific content -- these must be updated
- This is a text-only change to a prompt constant -- no schema, API, or infrastructure changes needed
- Relate patterns must use AI-truthful framing per architecture requirement (Failure Mode Finding #4)
- Minimum 5 relate patterns + 5 story-pulling patterns per architecture constraint
- Contradiction-surfacing remains in the character bible (deferred to Story 2.3)
- This story is independent of Epic 1 territory system (zero data flow coupling)

## Dependencies

- Story 22-1 (Remove Steering Instructions from Character Bible) -- should be done first so we build on the cleaned-up character bible
- Independent of Epic 1 territory system

## Out of Scope

- Contradiction-surfacing migration (Story 2.3)
- Territory catalog content (Story 21-1)
- Pipeline integration (Story 1.7)

## Estimation

- Size: Medium (significant prompt text additions + test updates)
- Risk: Low (no logic changes, only prompt content)
