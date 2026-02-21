# Story 8.7: Portrait Prompt Rework

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User who has completed an assessment**,
I want **my personalized portrait to read like a letter from a confidant who noticed things I didn't notice about myself, with depth that scales honestly to the evidence available**,
So that **the portrait feels like genuine discovery rather than a personality report**.

## Acceptance Criteria

1. **Given** portrait generation is triggered (messageCount >= freeTierMessageThreshold AND personalDescription is NULL) **When** the Claude API call is made **Then** the system prompt uses the revised PORTRAIT_CONTEXT from Prototype D (letter framing, confidant voice, 4-section architecture with custom titles, depth adaptation, move pattern guidance, craft requirements, guardrails) **And** the prompt replaces the current PORTRAIT_CONTEXT constant entirely.

2. **Given** the assessment has 8+ high-confidence evidence records (confidence > 60%) **When** the depth signal is computed **Then** the user prompt includes `EVIDENCE DENSITY: RICH` with record count and high-confidence count **And** the PORTRAIT_CONTEXT instructs the LLM to use full architecture with bold claims.

3. **Given** the assessment has 4-7 high-confidence evidence records **When** the depth signal is computed **Then** the user prompt includes `EVIDENCE DENSITY: MODERATE` **And** the PORTRAIT_CONTEXT instructs the LLM to use lighter organizing element and be honest about limits.

4. **Given** the assessment has fewer than 4 high-confidence evidence records **When** the depth signal is computed **Then** the user prompt includes `EVIDENCE DENSITY: THIN` **And** the PORTRAIT_CONTEXT instructs the LLM to scale ambition to evidence — observations over claims.

5. **Given** the revised PORTRAIT_CONTEXT includes move pattern guidance (deduction, positioning, reframing, provocation, prediction) **When** the portrait LLM writes the portrait **Then** it can identify and use these patterns directly from the evidence and conversation data it already receives **And** no pre-computed move scaffold is injected into the prompt.

6. **Given** the revised portrait prompt produces output **When** the frontend renders the portrait **Then** the existing `splitMarkdownSections()` function correctly parses the output (1 h1 + 3 h2 sections) **And** no frontend changes are required (the section structure is identical: `#` title + `##` body sections).

7. **Given** the portrait spec file exists at `_bmad-output/implementation-artifacts/personalized-portrait-spec.md` **When** this story is complete **Then** the spec is updated to reflect the revised architecture (letter framing, depth adaptation, move pattern guidance in prompt, confidant voice principles).

## Tasks / Subtasks

- [x] Task 1: Replace PORTRAIT_CONTEXT with revised version (AC: #1, #5)
  - [x] 1.1 Replace the `PORTRAIT_CONTEXT` constant in `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` with the revised version from Prototype D (design thinking lines 2958-3266)
  - [x] 1.2 Key changes from current to revised:
    - **Framing:** "You are writing a LETTER" (not "finding this person's story")
    - **Opening:** Start with BREADTH (gestalt), let spine ARRIVE as inevitability (not "state the spine")
    - **Voice:** "Build toward insight, don't announce it" — confidant, not presenter
    - **Tone adaptation:** The portrait LLM infers conversational register directly from the full message history it already receives. Remove the `[SYSTEM: You'll receive a tone signal. Use it.]` blocks and `MATCH THEIR REGISTER` section from Prototype D. Replace with a simpler instruction: "You have the full conversation. Match their register — if they were direct, be direct. If they were guarded, lead with more care."
    - **Depth adaptation:** `[SYSTEM]` block references depth signal from user prompt. RICH/MODERATE/THIN tier behavior mapped explicitly.
    - **Move pattern guidance:** Describe the 5 move types (deduction, positioning, reframing, provocation, prediction) as writing techniques the LLM should look for in the evidence — NOT as pre-computed suggestions. The LLM identifies opportunities itself from the data it already receives.
    - **Coaching:** "Through consequence, not command" — show road through others' experience
    - **Rhythm variation:** Not every section should build-then-release
    - **Closing question:** "The spine's deepest unresolved question" (more precise than current "intriguing, enigmatic question")
  - [x] 1.3 Preserve the validated example at the end of the prompt (update if needed to match new architecture)
  - [x] 1.4 Update `PORTRAIT_SYSTEM_PROMPT` composition (still `NERIN_PERSONA + PORTRAIT_CONTEXT`)

- [x] Task 2: Add depth signal to user prompt (AC: #2, #3, #4)
  - [x] 2.1 Create a `computeDepthSignal()` helper function in `portrait-generator.claude.repository.ts` (co-located with other prompt formatting helpers):
    ```typescript
    function computeDepthSignal(evidence: ReadonlyArray<SavedFacetEvidence>): string {
      const strongCount = evidence.filter(e => e.confidence > 60).length;
      const total = evidence.length;
      if (strongCount >= 8) return `EVIDENCE DENSITY: RICH (${total} records, ${strongCount} high-confidence)`;
      if (strongCount >= 4) return `EVIDENCE DENSITY: MODERATE (${total} records, ${strongCount} high-confidence)`;
      return `EVIDENCE DENSITY: THIN (${total} records, ${strongCount} high-confidence) — scale ambition to evidence`;
    }
    ```
  - [x] 2.2 Inject depth signal into the user prompt after the evidence section and before the writing instruction
  - [x] 2.3 No new domain types, no new files, no interface changes — this is a formatting concern internal to the infrastructure adapter

- [x] Task 3: Update user prompt formatting (AC: #1, #2)
  - [x] 3.1 Update `userPrompt` construction in `generatePortrait` to include depth signal:
    ```
    PERSONALITY DATA:
    [existing trait summary]

    EVIDENCE FROM CONVERSATION:
    [existing evidence format]

    [depth signal line]

    Write this person's personalized portrait in your voice as Nerin.
    ```
  - [x] 3.2 Remove the old closing instruction "Find the spine first, then build the 4-section portrait around it" — the revised PORTRAIT_CONTEXT already covers spine-finding
  - [x] 3.3 Pass full evidence array to `generatePortrait` (not just topEvidence) so depth signal computation has complete data. Update `PortraitGenerationInput` to add `readonly allEvidence: ReadonlyArray<SavedFacetEvidence>` alongside existing `topEvidence`.

- [x] Task 4: Update get-results use-case (AC: #2)
  - [x] 4.1 In the portrait generation block (line 171-196 of `get-results.use-case.ts`), pass full evidence in addition to topEvidence:
    ```typescript
    portraitGenerator.generatePortrait({
      sessionId, facetScoresMap, topEvidence,
      allEvidence: evidence,  // NEW — for depth signal computation
      archetypeName, archetypeDescription, oceanCode5,
      messages: domainMessages,
    })
    ```

- [x] Task 5: Update mock and tests (AC: #1-#6)
  - [x] 5.1 Update `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts` — mock `generatePortrait` must accept input with `allEvidence` field
  - [x] 5.2 Update `packages/infrastructure/src/repositories/portrait-generator.mock.repository.ts` (if exists) to accept new input shape
  - [x] 5.3 Update existing `get-results.use-case.test.ts` tests — the `generatePortrait` mock call must now include `allEvidence` in expected input
  - [x] 5.4 Verify existing PersonalPortrait frontend tests still pass (no frontend changes — same markdown structure)
  - [x] 5.5 Run full test suite: `pnpm test:run` — ensure zero regressions

- [x] Task 6: Update portrait spec document (AC: #7)
  - [x] 6.1 Update `_bmad-output/implementation-artifacts/personalized-portrait-spec.md`:
    - Change framing from "finding this person's story" to "writing a letter"
    - Add depth signal to Generation Architecture diagram
    - Add move pattern descriptions as writing guidance (not pre-computed scaffold)
    - Update craft requirements to match revised PORTRAIT_CONTEXT
    - Add coaching through consequence principle
    - Update voice principles (confidant, not presenter)

## Dev Notes

### Architecture: What Changes vs What Stays

**CHANGES:**
- `PORTRAIT_CONTEXT` constant in `portrait-generator.claude.repository.ts` — **REPLACED** entirely with Prototype D version (adapted: tone signal removed, move patterns as guidance not scaffold)
- `PortraitGenerationInput` interface — **EXTENDED** with `allEvidence` field (for depth signal computation)
- User prompt format in `generatePortrait` — **EXTENDED** with depth signal line
- `get-results.use-case.ts` — **MODIFIED** to pass full evidence array

**STAYS THE SAME:**
- `NERIN_PERSONA` constant — **UNCHANGED** (already trimmed in Story 2.13)
- `PORTRAIT_SYSTEM_PROMPT` composition — Still `NERIN_PERSONA + PORTRAIT_CONTEXT`
- `formatTraitSummary()` / `formatEvidence()` — **UNCHANGED** (still needed for personality data section)
- Portrait output structure — Still 1 h1 + 3 h2 markdown sections (same as current)
- Frontend `PersonalPortrait.tsx` / `portrait-markdown.tsx` — **NO CHANGES** (same markdown format)
- `splitMarkdownSections()` — **NO CHANGES** (parses same structure)
- DB schema — **NO CHANGES** (same `personal_description` TEXT column)
- Contract schema — **NO CHANGES** (same `personalDescription: S.NullOr(S.String)`)
- Portrait generation trigger logic — **NO CHANGES** (same threshold check in get-results)

### Why No Move Scaffold

The design thinking (Prototype J) proposed pre-computing move opportunities algorithmically and injecting them into the portrait prompt. After adversarial review, this was dropped:

1. **The portrait LLM already has all the data.** It receives 30 facet scores, all evidence with quotes, and the full conversation. It's a frontier model with extended thinking. Finding patterns in this data is what it's good at.
2. **Algorithmic detection is crude.** Grouping by facet + counting contexts is a poor proxy for narrative importance. Quote length is a poor proxy for casual tone. Hardcoded facet combination predictions are generic fortune-cookie insights.
3. **The LLM does it better.** The same patterns (deduction = same facet in multiple contexts, provocation = high-scoring facet treated as ordinary, etc.) can be described as writing techniques in the PORTRAIT_CONTEXT. The LLM identifies instances from the evidence itself, with semantic understanding no heuristic can match.
4. **Cost was lopsided.** New type file, utility with 5+ detection algorithms, constants file, serializer, tests — all producing "suggestions" the prompt explicitly said the LLM could ignore.

**What we keep:** The depth signal (RICH/MODERATE/THIN) is the one piece better done algorithmically — a 5-line function that counts high-confidence evidence records. This is injected as a single line in the user prompt.

**What moves into the prompt:** The 5 move types (deduction, positioning, reframing, provocation, prediction) are described in the PORTRAIT_CONTEXT as writing techniques with examples. The LLM finds opportunities itself.

### Key Design Decisions from Prototype D

1. **Letter, not report.** The portrait is framed as Nerin writing a letter after careful consideration — not filling out a template or producing an analysis.

2. **Breadth before spine.** The opening starts with an impressionistic gestalt of the whole person, then lets the spine arrive naturally. The current prompt tells the LLM to "state the spine" immediately. The revised approach creates anticipation.

3. **Confidant, not presenter.** The voice principle is "build toward insight, don't announce it." No "Here's my analysis" or "Here's what I found." The reader feels Nerin working up to something.

4. **Tone adaptation — inferred, not computed.** The portrait LLM already receives the full conversation history. It can infer tone directly. The PORTRAIT_CONTEXT instructs: "Match their register" with guidance on what that means, but no system-injected tone signal.

5. **Depth adaptation.** Portrait ambition scales to evidence density. THIN = honest and brief observations. RICH = full architecture with bold claims. Prevents the portrait from being dishonestly deep when evidence is thin.

6. **Coaching through consequence, not command.** Instead of "You should try X," the portrait says "People I've seen with your combination who learned to [specific thing] found [specific result]." The user decides to walk the road — Nerin just shows it.

7. **Move patterns as writing guidance.** The 5 move types are described in the prompt as techniques to look for — not pre-computed and injected. The LLM identifies which moves the evidence supports and uses the ones that serve the narrative.

### Adapting Prototype D for Implementation

The Prototype D prompt (design thinking lines 2958-3266) needs these modifications before use:

1. **Remove `[SYSTEM: You'll receive a tone signal. Use it.]` blocks** — tone is inferred from conversation
2. **Remove `MATCH THEIR REGISTER` section** — replace with single instruction: "You have the full conversation. Match their register."
3. **Remove `[SYSTEM: You'll receive a depth signal based on evidence density.]`** — replace with: "You'll see an evidence density line in the data. Use it to calibrate your ambition."
4. **Remove `USING MOVE DETECTION FLAGS` section** — replace with move pattern descriptions as writing techniques (not scaffold references)
5. **Keep everything else** — letter framing, voice principles, 4-section structure, craft requirements, guardrails, depth adaptation tiers, formatting rules

### Cost Impact

- **Zero additional LLM calls.** Depth signal is a pure function on existing evidence data.
- **Same single Claude API call** for portrait generation (no change to cost tracking or budget).
- **Minimal prompt size change.** Revised PORTRAIT_CONTEXT is similar length to current. Depth signal adds one line to the user prompt. Move pattern guidance in the system prompt replaces the scaffold section that was planned for the user prompt — net token count is similar or lower.

### Previous Story Intelligence (Story 8.4 + 8.6)

**From Story 8.4 (portrait implementation):**
- Portrait generation lives in `get-results.use-case.ts` (lazy, one-time per session)
- `PortraitGeneratorRepository` is the port; `portrait-generator.claude.repository.ts` is the adapter
- Uses `ChatAnthropic` from `@langchain/anthropic` with adaptive extended thinking
- Messages are included in the LLM call (full conversation context)
- `extractTextContent()` handles thinking blocks in response
- Mock returns deterministic markdown string

**From Story 8.6 (results page redesign):**
- PersonalPortrait renders as full-width card with rainbow accent bar
- Uses `splitMarkdownSections()` from `portrait-markdown.tsx` to parse markdown
- Each section renders with `react-markdown` using custom components
- Structure: 1 h1 (title) + 3 h2 (body sections) — **this is unchanged by our story**

**From Story 2.13 (Nerin chat foundation):**
- `NERIN_PERSONA` was trimmed from ~780 to ~350 tokens
- Beliefs, threading, and mirror library added to CHAT_CONTEXT
- Portrait system prompt is `NERIN_PERSONA + PORTRAIT_CONTEXT` — the trimmed persona already works for both chat and portrait

### Git Patterns from Recent Commits

Recent commits follow the pattern:
- `feat(story-X-Y): brief description (#PR)`
- Single PR per story, squash merge to master
- Branch naming: `feat/story-8-7-portrait-prompt-rework`

### Files NOT to Touch

- `apps/front/src/components/results/PersonalPortrait.tsx` — No changes needed (same markdown format)
- `apps/front/src/components/results/portrait-markdown.tsx` — No changes needed (same parse logic)
- `packages/domain/src/constants/nerin-persona.ts` — Already trimmed in Story 2.13
- `packages/domain/src/constants/nerin-system-prompt.ts` — CHAT_CONTEXT, not portrait
- `packages/infrastructure/src/db/drizzle/schema.ts` — No DB changes
- `packages/contracts/src/http/groups/assessment.ts` — No contract changes
- `apps/api/src/handlers/assessment.ts` — No handler changes
- Orchestrator, send-message, processAnalysis — No pipeline changes

### Project Structure Notes

- No new files in `packages/domain/` — no new types, no new utilities, no new constants
- All changes are in `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` (prompt rewrite + depth signal helper)
- Minor change in `packages/domain/src/repositories/portrait-generator.repository.ts` (add `allEvidence` to input interface)
- Minor change in `apps/api/src/use-cases/get-results.use-case.ts` (pass full evidence)
- Mock updates in `packages/infrastructure/src/repositories/__mocks__/`

### References

- [Source: _bmad-output/design-thinking-2026-02-20.md — Prototype D: Revised PORTRAIT_CONTEXT Prompt, lines 2940-3266]
- [Source: _bmad-output/design-thinking-2026-02-20.md — Prototype J: Move Detection Output Format, lines 2233-2492 (adopted as prompt guidance, not scaffold)]
- [Source: _bmad-output/design-thinking-2026-02-20.md — Priority 2 Implementation Plan, lines 3546-3554]
- [Source: _bmad-output/design-thinking-2026-02-20.md — Test 1.2 Portrait Scoring Rubric, lines 3343-3369]
- [Source: _bmad-output/implementation-artifacts/personalized-portrait-spec.md — Current portrait spec]
- [Source: packages/domain/src/repositories/portrait-generator.repository.ts — PortraitGenerationInput interface]
- [Source: packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts — Current PORTRAIT_CONTEXT + prompt formatting]
- [Source: apps/api/src/use-cases/get-results.use-case.ts — Portrait generation integration, lines 168-196]
- [Source: packages/domain/src/types/facet-evidence.ts — SavedFacetEvidence, FacetScoresMap types]
- [Source: apps/front/src/components/results/portrait-markdown.tsx — splitMarkdownSections() parser]
- [Source: docs/ARCHITECTURE.md — Hexagonal architecture, Effect DI patterns]
- [Source: docs/NAMING-CONVENTIONS.md — File and component naming]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All implementations were clean — tests passed on first run after changes.

### Completion Notes List

- **Task 1:** Replaced `PORTRAIT_CONTEXT` constant entirely with Prototype D adapted version. Key adaptations from raw Prototype D: removed `[SYSTEM]` tone signal blocks, removed `MATCH THEIR REGISTER` section (replaced with single instruction), removed `USING MOVE DETECTION FLAGS` section (replaced with "WRITING TECHNIQUES — MOVES TO LOOK FOR" section describing 5 move types as writing guidance), removed `[SYSTEM: finalization layer]` and `[SYSTEM: breadth material]` references. Preserved validated example. `PORTRAIT_SYSTEM_PROMPT` composition unchanged.
- **Task 2:** Added `computeDepthSignal()` helper — 5-line pure function computing RICH/MODERATE/THIN from high-confidence evidence count (>60% threshold). Imported `SavedFacetEvidence` type.
- **Task 3:** Updated user prompt to include depth signal after evidence section. Removed old closing instruction ("Find the spine first...") — the revised PORTRAIT_CONTEXT covers spine-finding. Added `allEvidence` field to `PortraitGenerationInput` interface.
- **Task 4:** Updated `get-results.use-case.ts` to pass `allEvidence: evidence` in the `generatePortrait` call.
- **Task 5:** Updated both mock files (`__mocks__/` and `.mock.repository.ts`) to accept typed `PortraitGenerationInput` parameter. Added assertion in test for `allEvidence` being passed. All 176 API tests, 153 frontend tests, domain tests pass. Zero regressions.
- **Task 6:** Updated portrait spec document: letter framing, confidant voice, breadth-before-spine opening, depth signal in architecture diagram, move patterns as writing guidance, coaching through consequence, rhythm variation in formatting.

### Change Log

- **2026-02-21:** Story 8.7 implementation complete. Replaced PORTRAIT_CONTEXT with letter-framing architecture from design thinking Prototype D. Added depth signal (RICH/MODERATE/THIN) to portrait user prompt. Updated spec document.
- **2026-02-21:** Code review fixes (Claude Opus 4.6). Exported `computeDepthSignal()` for testability. Added 13 unit tests covering all 3 tier boundaries (RICH/MODERATE/THIN), confidence threshold edge case (>60 vs >=60), and format verification. Updated integration test mock portrait to match real 1 h1 + 3 h2 markdown structure.

### File List

- `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` — **MODIFIED** (PORTRAIT_CONTEXT replaced, computeDepthSignal added + exported, user prompt updated)
- `packages/domain/src/repositories/portrait-generator.repository.ts` — **MODIFIED** (allEvidence field added to PortraitGenerationInput)
- `apps/api/src/use-cases/get-results.use-case.ts` — **MODIFIED** (allEvidence passed to generatePortrait)
- `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts` — **MODIFIED** (typed input parameter)
- `packages/infrastructure/src/repositories/portrait-generator.mock.repository.ts` — **MODIFIED** (typed input parameter, mock portrait updated to 1 h1 + 3 h2 markdown format)
- `packages/infrastructure/src/repositories/__tests__/portrait-generator.depth-signal.test.ts` — **ADDED** (13 unit tests for computeDepthSignal tier boundaries)
- `apps/api/src/use-cases/__tests__/get-results.use-case.test.ts` — **MODIFIED** (allEvidence assertion added)
- `_bmad-output/implementation-artifacts/personalized-portrait-spec.md` — **MODIFIED** (spec updated to reflect revised architecture)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — **MODIFIED** (status updated)
