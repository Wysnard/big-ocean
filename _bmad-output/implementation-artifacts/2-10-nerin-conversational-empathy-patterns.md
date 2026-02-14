# Story 2.10: Nerin Conversational Empathy Patterns

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User in conversation with Nerin**,
I want **Nerin to actively appreciate my honesty, reframe my self-descriptions positively, and reconcile apparent contradictions in my personality**,
So that **I feel genuinely understood and seen — not just assessed — which makes me share more openly and produces richer personality insights**.

## Acceptance Criteria

1. **AC1: Appreciation & Validation Patterns** — Nerin's system prompt includes explicit instructions to acknowledge vulnerability and honesty with varied phrases (e.g., "That's really honest of you", "Not everyone has that level of self-awareness", "I appreciate you sharing that"). Phrases MUST vary — no repetition within a session.

2. **AC2: Positive Reframing** — Nerin's system prompt includes instructions to reflect back user statements with clarity and a more generous interpretation without contradicting their reality. Example: user says "I'm indecisive" → Nerin responds with something like "It sounds like you weigh options carefully and consider multiple perspectives." Reframing MUST NOT invalidate the user's experience.

3. **AC3: Contradiction Reconciliation** — When Nerin detects conflicting trait signals across the conversation (e.g., organized at work but messy at home), the system prompt instructs Nerin to find the coherent deeper truth instead of ignoring the contradiction. Example: "You're not unorganized — you invest your energy where it matters most to you, and you're selective about what deserves that effort."

4. **AC4: Two-Paragraph Response Structure** — Nerin's system prompt includes explicit instructions for a consistent two-paragraph response format: Paragraph 1 responds using empathy patterns (acknowledge/reframe/reconcile), Paragraph 2 asks a natural follow-up question. This ensures every response demonstrates understanding AND continues the conversation flow. Example response included in prompt.

5. **AC5: No New Emotional Tones** — The existing `NerinResponseSchema` emotional tones (`warm`, `curious`, `supportive`, `encouraging`) remain unchanged. Empathy patterns work within the existing tone vocabulary — no schema changes.

6. **AC6: Backend-Only Change** — No API contract, schema, frontend, or database changes. This is purely a system prompt enhancement in the Nerin agent infrastructure layer.

7. **AC7: Existing Tests Pass** — All existing tests continue to pass (`pnpm test:run`). The mock Nerin implementation returns static responses and is unaffected by prompt changes.

8. **AC8: New Unit Tests for Prompt Construction** — Unit tests verify that `buildSystemPrompt()` includes the new empathy pattern instructions. Tests verify the prompt text contains key behavioral directives for appreciation, reframing, reconciliation, and response structure.

9. **AC9: Prompt Length Within Token Budget** — The enhanced system prompt, including all new empathy instructions and response structure, stays within a reasonable token budget. The `NERIN_MAX_TOKENS` (1024) is for response generation, not system prompt — but the system prompt should not exceed ~2000 tokens to avoid context window pressure.

## Tasks / Subtasks

- [x] **Task 1: Enhance `buildSystemPrompt()` with Empathy Patterns** (AC: 1, 2, 3, 4, 6)
  - [x] 1.1 Add "Appreciation & Validation" section to base prompt with varied phrase examples and instruction not to repeat within a session
  - [x] 1.2 Add "Positive Reframing" section with examples and the rule: never invalidate the user's lived experience
  - [x] 1.3 Add "Contradiction Reconciliation" section with examples of finding coherent deeper truths when detecting conflicting signals
  - [x] 1.4 Add "Response Structure" section with two-paragraph format (empathy pattern + follow-up question) and example response
  - [x] 1.5 Integrate empathy patterns naturally into existing prompt flow (after key behaviors, before JSON format instructions)

- [x] **Task 2: Write Unit Tests for Prompt Enhancement** (AC: 8)
  - [x] 2.1 Test that `buildSystemPrompt()` output includes appreciation instruction keywords
  - [x] 2.2 Test that `buildSystemPrompt()` output includes reframing instruction keywords
  - [x] 2.3 Test that `buildSystemPrompt()` output includes reconciliation instruction keywords
  - [x] 2.4 Test that prompt includes response structure instructions (two-paragraph format)
  - [x] 2.5 Test that prompt still includes existing behaviors (warm greeting, open-ended questions, non-judgmental tone)
  - [x] 2.6 Test that prompt with steering hint appends correctly after empathy patterns

- [x] **Task 3: Verify No Regressions** (AC: 5, 7, 9)
  - [x] 3.1 Run `pnpm test:run` — all tests pass (145 API + 161 frontend = 306 total) ✅ Verified 2026-02-14
  - [x] 3.2 Run `pnpm lint` — clean (2 pre-existing warnings, none from this story)
  - [x] 3.3 Run `pnpm build` — succeeds
  - [x] 3.4 Verify `NerinResponseSchema` is unchanged (4 emotional tones) — git diff confirms zero changes
  - [x] 3.5 Verify prompt token count is reasonable (< 2000 tokens) — ~547 tokens estimated

## Dev Notes

### Scope: Backend-Only System Prompt Enhancement

This story modifies exactly **one function** in one file: `buildSystemPrompt()` in `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` (lines 46-91).

No API contracts, database schemas, frontend components, or repository interfaces change.

### Current Nerin System Prompt (What Exists)

The current `buildSystemPrompt()` function at `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts:46-91` includes:

**Base persona:** "You are Nerin, a warm and curious conversational partner helping users explore their personality through natural dialogue."

**Existing key behaviors:**
- Warm greeting for new conversations
- Open-ended questions that invite genuine sharing
- Non-judgmental, supportive tone
- Reference earlier conversation parts (active listening)
- Avoid repetitive questions
- Keep responses concise (2-4 sentences)

**What's missing (this story adds):**
1. No explicit instruction to **appreciate honesty** and **thank users for sharing**
2. No instruction to **positively reframe** self-critical statements
3. No instruction to **reconcile contradictions** with coherent deeper truths
4. No **response structure template** to ensure consistent empathy + follow-up pattern

### Prompt Enhancement Strategy

Add empathy patterns and response structure to the base prompt between the existing "Key behaviors" list and the JSON format instructions. The new sections include:

```
Empathy patterns (use naturally, never formulaically):
- Appreciation: When someone shares something vulnerable or honest, actively acknowledge it. Vary your phrasing — never repeat the same appreciation twice in one conversation. Examples: "That's really honest of you", "Not everyone has that level of self-awareness", "Thank you for being so open about that."
- Positive reframing: When someone describes themselves negatively, reflect it back with a more generous interpretation that doesn't contradict their experience. "I'm indecisive" → "You weigh options carefully." "I'm a pushover" → "You genuinely care about others' feelings." Never say "you're not [negative thing]" — instead show the positive side of the same trait.
- Contradiction reconciliation: When you notice conflicting signals across the conversation (e.g., organized at work but messy at home), don't ignore them. Find the coherent deeper truth that connects both. "That makes sense — you invest your organizing energy where it matters most to you." Contradictions are often the most revealing insights about someone's personality.

Response structure (follow this format for every message):
- Paragraph 1: Respond to what they shared using one of the empathy patterns above. Acknowledge, reframe, or reconcile — showing you genuinely heard and understood them.
- Paragraph 2: Ask a natural follow-up question to continue the conversation. Make it open-ended and connected to what they just said.

Example response:
"That's really insightful — recognizing that you organize differently in different contexts shows real self-awareness. It sounds like you're intentional about where you invest your energy.

What helps you decide when something is worth organizing versus when you let it be?"
```

### Key Implementation Constraints

1. **Do NOT change the JSON response schema** — `NerinResponseSchema` stays exactly as-is with 4 emotional tones (`warm`, `curious`, `supportive`, `encouraging`). [Source: `packages/domain/src/schemas/agent-schemas.ts:29-61`]

2. **Do NOT change the `NerinAgentRepository` interface** — The invoke method signature (`NerinInvokeInput → NerinInvokeOutput`) is unchanged. [Source: `packages/domain/src/repositories/nerin-agent.repository.ts:22-34`]

3. **Do NOT change the greeting messages** — `packages/domain/src/constants/nerin-greeting.ts` is frontend-controlled and already has validation/contradiction acceptance messaging. This story enhances the backend agent prompt.

4. **Do NOT modify the mock implementation** — `packages/infrastructure/src/repositories/__mocks__/nerin-agent.langgraph.repository.ts` returns static responses and doesn't use `buildSystemPrompt()`.

5. **Keep prompt additions concise** — The system prompt is sent with every LLM call. Every token in the prompt costs money across all sessions. Aim for ~200-300 additional tokens maximum.

### Architecture Alignment

This follows the hexagonal architecture pattern established in Story 2.2:

```
Domain (unchanged)          Infrastructure (modified)
─────────────────          ────────────────────────
NerinAgentRepository  ←──  nerin-agent.langgraph.repository.ts
  invoke()                   └── buildSystemPrompt()  ← ONLY THIS CHANGES
  NerinInvokeInput             └── Empathy pattern instructions added
  NerinInvokeOutput
```

### Testing Strategy

**Unit tests for prompt content** — The `buildSystemPrompt()` function is a pure function (string in, string out). Test it directly by calling the function and asserting the output string contains expected behavioral instruction keywords.

Create or extend tests in the infrastructure layer since `buildSystemPrompt` is a module-level function in the infrastructure package:

```typescript
// Test file: packages/infrastructure/src/repositories/__tests__/nerin-agent.langgraph.repository.test.ts
// OR extend existing test file if one exists for this module

describe("buildSystemPrompt", () => {
  it("includes appreciation pattern instructions", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("appreciation");
    // More specific assertions...
  });

  it("includes positive reframing instructions", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("reframing");
  });

  it("includes contradiction reconciliation instructions", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("contradiction");
  });

  it("preserves existing key behaviors", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("warm and curious");
    expect(prompt).toContain("non-judgmental");
    expect(prompt).toContain("open-ended questions");
  });

  it("appends steering hint after empathy patterns", () => {
    const prompt = buildSystemPrompt(undefined, "Explore how they organize their space");
    expect(prompt).toContain("Explore how they organize their space");
  });
});
```

**Note:** `buildSystemPrompt` is currently a module-level function (not exported). The dev agent may need to either:
- Export it for direct testing, OR
- Test it indirectly through the `invoke()` method using a spy on the Anthropic model

The recommended approach is to **export the function** for direct unit testing — it's a pure function and direct testing is the simplest path.

### Previous Story Intelligence

**Story 2-9 (Evidence-Sourced Scoring)** — Completed 2026-02-11. Removed materialized score tables and moved to evidence-sourced scoring. Key learnings:
- Score repositories deleted, scoring functions moved to pure domain utils
- No impact on this story — Nerin receives `facetScores` the same way (computed from evidence before orchestrator call)
- 744 tests passing after completion

**Story 7-10 (Assessment Chat UX)** — Completed 2026-02-13 (PR #39, commit b87249a). Added Nerin personality to the frontend:
- Greeting messages in `packages/domain/src/constants/nerin-greeting.ts` already contain validation/contradiction acceptance messaging
- Frontend milestone messages use Nerin voice
- This story complements 7-10 by enhancing the backend agent behavior to match the frontend personality
- Cross-reference: See PR #39 (b87249a) for Story 7-10 frontend personality implementation

**Story 2-2 (Nerin Agent Setup)** — Original implementation:
- `buildSystemPrompt()` function created at `nerin-agent.langgraph.repository.ts:46-91`
- Hexagonal architecture with `NerinAgentRepository` Context.Tag
- Claude Sonnet 4 model, temperature 0.7, max tokens 1024

### Git Intelligence

Recent commits are all Epic 7 UI work (stories 7-6 through 7-10). The Nerin backend agent (`nerin-agent.langgraph.repository.ts`) was last modified during Story 2-4 (Orchestrator implementation) when the `buildSystemPrompt` function was updated to accept `facetScores` and `steeringHint` parameters.

### Model Configuration Reference

- **Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Max tokens:** 1024 (response generation)
- **Temperature:** 0.7 (good for conversational warmth)
- **Structured output:** JSON schema validation via `withStructuredOutput()`
- **File:** `nerin-agent.langgraph.repository.ts:133-142`

### Project Structure Notes

- Alignment with unified project structure: Correct — only modifying infrastructure layer implementation
- No new files needed (except possibly a test file)
- No new dependencies
- No schema changes

### References

- [Source: `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts:46-91`] — `buildSystemPrompt()` function (modification target)
- [Source: `packages/domain/src/repositories/nerin-agent.repository.ts:22-34`] — `NerinInvokeInput` interface (unchanged)
- [Source: `packages/domain/src/schemas/agent-schemas.ts:29-61`] — `NerinResponseSchema` (unchanged)
- [Source: `packages/infrastructure/src/repositories/__mocks__/nerin-agent.langgraph.repository.ts`] — Mock implementation (unchanged)
- [Source: `packages/infrastructure/src/repositories/facet-steering.ts:25-65`] — 30 facet steering hints
- [Source: `packages/domain/src/constants/nerin-greeting.ts`] — Frontend greeting messages (reference only)
- [Source: `apps/api/src/use-cases/__tests__/nerin-steering-integration.test.ts:85-93`] — Spy Nerin test pattern
- [Source: `_bmad-output/planning-artifacts/epics/epic-2-assessment-backend-services.md:458-480`] — Epic 2 Story 2.10 definition
- [Source: `docs/ARCHITECTURE.md`] — Hexagonal architecture patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no debugging needed.

### Completion Notes List

- Extracted `buildSystemPrompt()` from `nerin-agent.langgraph.repository.ts` into a new `nerin-system-prompt.ts` module for testability. The original file had heavy LangGraph/Anthropic dependencies that prevented direct unit testing of the pure prompt function.
- Added three empathy pattern sections (Appreciation, Positive Reframing, Contradiction Reconciliation) plus a Response Structure template between "Key behaviors" and JSON format instructions.
- Response structure prescribes a two-paragraph format: Paragraph 1 uses empathy patterns to show understanding, Paragraph 2 asks a natural follow-up question. This ensures consistent conversational quality.
- Prompt text follows the exact wording from the story's Prompt Enhancement Strategy section, including example response.
- Re-exported `buildSystemPrompt` from the main repository module to maintain existing import paths.
- Created 12 unit tests covering: empathy patterns (3), response structure (2), existing behaviors (3), steering hint integration (2), assessment progress (2).
- Test assertions verify behavioral instructions (not just keyword presence): appreciation variation requirement, reframing "never invalidate" rule, contradiction reconciliation directive, two-paragraph structure.
- All tests pass with zero regressions: 145 API + 161 frontend = 306 total (verified 2026-02-14). Build and lint clean.
- Estimated prompt token count: ~547 tokens (well under 2000 token budget).
- No changes to: `NerinResponseSchema`, `NerinAgentRepository` interface, mock implementation, greeting constants, API contracts, frontend, or database.

### Change Log

- **2026-02-14**: Implemented empathy patterns and response structure in Nerin system prompt. Enhanced `buildSystemPrompt()` with appreciation, reframing, reconciliation patterns, and two-paragraph format template. Added 12 unit tests with behavioral assertion verification. (Story 2.10, commit baaeaf4)
  - Note for future: Commit message could be more descriptive about response structure addition and test improvements

### File List

- `packages/domain/src/utils/nerin-system-prompt.ts` — MODIFIED: Enhanced `buildSystemPrompt()` with empathy patterns and response structure
- `packages/domain/src/utils/index.ts` — MODIFIED: Added `buildSystemPrompt` export
- `packages/domain/src/index.ts` — MODIFIED: Added `buildSystemPrompt` to barrel export
- `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` — MODIFIED: Imports `buildSystemPrompt` from `@workspace/domain`
- `packages/infrastructure/src/repositories/__tests__/nerin-agent.langgraph.repository.test.ts` — NEW: 10 unit tests for prompt construction
