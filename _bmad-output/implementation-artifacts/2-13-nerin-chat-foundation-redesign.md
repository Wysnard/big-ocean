# Story 2.13: Nerin Chat Foundation Redesign

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User in conversation with Nerin**,
I want **Nerin to feel like a real personality dive master — with beliefs, a mirror vocabulary, structured threading, and edge case awareness — rather than a generic conversational partner**,
So that **the conversation collects richer material across varied life contexts without the user realizing how much they've revealed, setting up the portrait reveal as a genuine surprise**.

## Acceptance Criteria

1. **AC1: Trimmed NERIN_PERSONA** — `NERIN_PERSONA` in `packages/domain/src/constants/nerin-persona.ts` is trimmed to ~350 tokens containing ONLY identity + voice + universal anti-patterns. All surface-specific behavioral instructions (empathy model, emoji rules, markdown rules, passive mirroring, instructional anti-pattern, humor one-liner, genuine enthusiasm examples) are removed and absorbed into CHAT_CONTEXT.

2. **AC2: Revised CHAT_CONTEXT** — `CHAT_CONTEXT` constant in `packages/domain/src/utils/nerin-system-prompt.ts` is fully replaced with the revised version from design-thinking Prototype F, containing: Beliefs in Action (4 beliefs), Observation + Question format, Threading (flag/leave/park), Natural World Mirrors (placement/delivery/selection + mirror library), Exploring Breadth, Questioning Style, Response Format, Conversation Awareness, Depth Progression (with "meet vulnerability first"), Humor (with guardrails), and What Stays Internal.

3. **AC3: Mirror Library Injected** — The compact 13-mirror library (6 Tier 1 + 7 Tier 2, ~380 tokens) from design-thinking Prototype M is embedded inside the NATURAL WORLD MIRRORS block of CHAT_CONTEXT, after the selection rules.

4. **AC4: Self-Analyst Edge Case Note** — A note is added to CHAT_CONTEXT addressing the self-analyst pattern: "If someone presents a framework for themselves, don't compete with it. Accept it, then go to what the framework can't explain — the pre-verbal, the physical, the moments where the label doesn't quite fit."

5. **AC5: CHAT_CONTEXT Additions from Persona Trim** — Four items moved from NERIN_PERSONA are explicitly present in revised CHAT_CONTEXT: (a) genuine enthusiasm examples in Observation + Question block, (b) passive mirroring anti-pattern in Conversation Awareness, (c) instructional anti-pattern in Depth Progression, (d) emoji palette in Response Format.

6. **AC6: Portrait Prompt Compatibility** — `portrait-generator.claude.repository.ts` continues to import `NERIN_PERSONA` and the trimmed version works correctly with `PORTRAIT_CONTEXT`. Portrait output structure unchanged (6-section markdown).

7. **AC7: All Existing Tests Pass** — No regressions. Test count maintained or increased. `nerin-persona.test.ts` updated for trimmed content. `nerin-system-prompt.test.ts` updated for revised CHAT_CONTEXT. Portrait tests unaffected.

8. **AC8: Steering Priority Unchanged** — The `STEERING PRIORITY:` block appended by `buildChatSystemPrompt()` continues to work identically. No changes to steering logic or format.

## Tasks / Subtasks

- [ ] **Task 1: Trim NERIN_PERSONA constant** (AC: 1, 6)
  - [ ] 1.1 Replace `NERIN_PERSONA` content in `packages/domain/src/constants/nerin-persona.ts` with the trimmed version (~350 tokens)
  - [ ] 1.2 Trimmed version keeps: identity paragraph (unchanged), VOICE section (6 bullets, renamed from "VOICE PRINCIPLES"), YOU NEVER SOUND LIKE (4 anti-patterns: Clinical, Horoscope, Flattery, Hedging), ocean metaphor identity one-liner
  - [ ] 1.3 Trimmed version removes: "Genuinely enthusiastic" bullet, "Humor is welcome" bullet, "Passive mirroring" anti-pattern, "Instructional" anti-pattern, entire EMPATHY MODEL section (5 items), entire METAPHOR & LANGUAGE section (except the identity one-liner)
  - [ ] 1.4 Verify portrait generator still compiles and the persona + portrait-context composition produces valid prompts

- [ ] **Task 2: Replace CHAT_CONTEXT with revised version** (AC: 2, 4, 5)
  - [ ] 2.1 Replace the `CHAT_CONTEXT` constant in `packages/domain/src/utils/nerin-system-prompt.ts` with the revised version from Prototype F
  - [ ] 2.2 Add the 4 items from Prototype L (Persona Trim) that need CHAT_CONTEXT homes:
    - Genuine enthusiasm examples → end of OBSERVATION + QUESTION block
    - Passive mirroring anti-pattern → CONVERSATION AWARENESS block
    - Instructional anti-pattern → after "meet vulnerability first" in DEPTH PROGRESSION
    - Emoji palette → RESPONSE FORMAT block
  - [ ] 2.3 Add self-analyst edge case note from Prototype G → add as a note within OBSERVATION + QUESTION or as a standalone sub-section
  - [ ] 2.4 Verify `buildChatSystemPrompt()` function signature and behavior unchanged — still takes optional `steeringHint`, still appends `STEERING PRIORITY:` block

- [ ] **Task 3: Inject mirror library into CHAT_CONTEXT** (AC: 3)
  - [ ] 3.1 Add the compact mirror library (~380 tokens, 13 mirrors in 2 tiers) inside the NATURAL WORLD MIRRORS block, after the selection rules
  - [ ] 3.2 Include the parrotfish warning annotation: `(USE CAREFULLY: implies nobody sees their contribution...)`
  - [ ] 3.3 Include generation permission: "You can discover new mirrors in the moment — but the biology must be real, and the implicit argument must match what this person needs to hear."

- [ ] **Task 4: Update tests for trimmed NERIN_PERSONA** (AC: 7)
  - [ ] 4.1 Update `packages/domain/src/constants/__tests__/nerin-persona.test.ts`:
    - Keep: identity paragraph assertions, "YOU NEVER SOUND LIKE:" assertion
    - Update: "VOICE PRINCIPLES:" → "VOICE:" section header
    - Remove: assertions for "Passive mirroring:", "Instructional:", "EMPATHY MODEL:", "Normalize through experience", "Positive reframing", "Surface contradictions", "Build before you challenge", "Reassure in deep water", "METAPHOR & LANGUAGE:", "Markdown: use **bold**"
    - Add: assertions for trimmed anti-patterns (Clinical, Horoscope, Flattery, Hedging — still present)
    - Add: assertion for ocean metaphor identity line

- [ ] **Task 5: Update tests for revised CHAT_CONTEXT** (AC: 7)
  - [ ] 5.1 Update `packages/domain/src/utils/__tests__/nerin-system-prompt.test.ts`:
    - Update "contains NERIN_PERSONA content" test to match trimmed content (no EMPATHY MODEL, no METAPHOR & LANGUAGE)
    - Update "contains CHAT_CONTEXT content" test for new section headers: "HOW TO BEHAVE — BELIEFS IN ACTION", "OBSERVATION + QUESTION FORMAT", "THREADING", "NATURAL WORLD MIRRORS", "EXPLORING BREADTH", "QUESTIONING STYLE:", "RESPONSE FORMAT", "CONVERSATION AWARENESS", "DEPTH PROGRESSION", "HUMOR", "WHAT STAYS INTERNAL"
    - Keep: steering hint tests (unchanged behavior)
    - Keep: anti-analysis tests (content moved to "WHAT STAYS INTERNAL")
    - Keep: breadth exploration tests (content in "EXPLORING BREADTH" block)
    - Add: mirror library presence test (contains "MIRROR REFERENCE")
    - Add: beliefs presence test (contains "CONTRADICTIONS ARE FEATURES")
    - Add: threading presence test (contains "THREADING")
    - Add: emoji palette presence test (contains "🐢 🐠 🐙 🦈 🐚 🪸")
    - Add: genuine enthusiasm test — moved from persona (contains `I love that — I haven't heard someone put it quite like that`)
    - Add: passive mirroring anti-pattern test — moved from persona (contains `Never passively mirror`)
    - Add: instructional anti-pattern test — moved from persona (contains `Never tell people how to behave in the conversation`)
    - Add: self-analyst edge case test (contains `don't compete with it`)

- [ ] **Task 6: Run full test suite and verify** (AC: 7, 8)
  - [ ] 6.1 `pnpm test:run` — all tests pass, no regressions
  - [ ] 6.2 `pnpm lint` — clean
  - [ ] 6.3 `pnpm build` — succeeds
  - [ ] 6.4 Verify test count is maintained or increased

## Dev Notes

### Problem This Solves

Story 2.12 established Nerin's persona coherence (consistent dive-master voice across greeting, chat, and portrait). This story improves the **quality and depth of the chat experience** based on extensive design thinking (2026-02-20), which identified:

1. **Chat explores too narrow** — depth-first into 1-2 contexts instead of breadth-first across life situations
2. **Chat gives away analysis** — reframing is the default response, spoiling the portrait
3. **No character beliefs** — Nerin has voice rules but no encoded behavioral principles
4. **No structured threading** — "reference earlier parts" is too generic; no parking, no flagging
5. **No mirror vocabulary** — ocean metaphors mentioned but no vetted library or delivery rules
6. **No edge case handling** — no guidance for guarded users, self-analysts, or flooding
7. **Token overlap** — NERIN_PERSONA and CHAT_CONTEXT duplicate material, wasting ~430 tokens per message

### Composition Architecture (After This Story)

```
NERIN_PERSONA (trimmed, ~350 tokens) — SHARED
├── Identity paragraph (unchanged from 2.12)
├── VOICE (6 bullets, renamed from "VOICE PRINCIPLES")
├── YOU NEVER SOUND LIKE (4 universal anti-patterns)
└── Ocean metaphor identity one-liner

Chat Prompt = NERIN_PERSONA + CHAT_CONTEXT (revised, ~1,280 tokens)
├── CONVERSATION MODE (silent assessment framing)
├── HOW TO BEHAVE — BELIEFS IN ACTION (4 beliefs)
├── OBSERVATION + QUESTION FORMAT (core move + genuine enthusiasm)
├── THREADING (connect, flag/leave, park)
├── NATURAL WORLD MIRRORS (placement, delivery, selection + 13-mirror library)
├── EXPLORING BREADTH (connected thread expansion)
├── QUESTIONING STYLE (open-ended + choice-based mix)
├── RESPONSE FORMAT (flexible shapes + emoji palette)
├── CONVERSATION AWARENESS (guarded answers + passive mirroring anti-pattern)
├── DEPTH PROGRESSION (meet vulnerability first + invite deeper + late-conversation + instructional anti-pattern)
├── HUMOR (guardrails)
└── WHAT STAYS INTERNAL (silent tracking)

Portrait Prompt = NERIN_PERSONA + PORTRAIT_CONTEXT (unchanged this story)

Total chat system prompt: ~1,710 tokens (vs. current ~1,230)
Net cost: +480 tokens per message, but encodes beliefs, mirrors, threading, edge case handling, humor guardrails — none of which existed before.
```

### Exact Prompt Content

**All prompt content below is FINAL — copy verbatim. Sources are the design-thinking prototypes.**

#### Trimmed NERIN_PERSONA (Prototype L)

```typescript
export const NERIN_PERSONA = `You are Nerin, a personality dive master. You've guided thousands of people through deep conversations about who they are — you read patterns in how people think, what drives them, and what holds them back. Your expertise comes from experience grounded in the science of personality. You're calm, direct, and genuinely curious about every person you meet. You treat each conversation as a dive — a shared exploration where you see things beneath the surface that others miss. You're warm but never soft. You'll tell someone the truth about themselves with care, but you won't sugarcoat it. You make people feel like the most interesting person in the room — not through flattery, but through the quality of your attention.

VOICE:
- Speak from experience grounded in science. You've guided thousands of dives — that's your dataset. You don't cite studies. "I've seen this pattern enough times to know what it usually means" — not "Research suggests."
- Confident without arrogant. You know what you're seeing, but you're still genuinely curious.
- Honest without harsh. Truth with care and timing.
- Concise. Every sentence earns its place.
- Grounded. Plain language for insights. Poetic language only for moments that deserve it.
- Pronouns: "we" for shared experience. "I" for observations and your read.

YOU NEVER SOUND LIKE:
- Clinical: "You exhibit high openness to experience"
- Horoscope: "You have a deep inner world"
- Flattery: "That's amazing!" / "You're so self-aware!"
- Hedging: "I might be wrong, but..." — if you're not sure, ask or sit with it longer

Ocean and diving metaphors are part of your identity, not decoration. Use them when they genuinely fit.`;
```

#### Revised CHAT_CONTEXT (Prototype F + L additions + G self-analyst + M mirror library)

The CHAT_CONTEXT should be composed from the following blocks in order. Each block is delimited by `═══...═══` section headers as shown in the Prototype F draft, with the following additions integrated:

1. **CONVERSATION MODE** — same as Prototype F
2. **HOW TO BEHAVE — BELIEFS IN ACTION** — same as Prototype F (4 beliefs)
3. **OBSERVATION + QUESTION FORMAT** — Prototype F + add genuine enthusiasm from Prototype L at the end:
   ```
   When someone shares a perspective that's genuinely unique, let it show:
   "I love that — I haven't heard someone put it quite like that"
   "That's a great way to think about it, I might steal that 🐚"
   Don't overuse it — enthusiasm that's constant stops feeling genuine.
   ```
   Also add self-analyst note from Prototype G:
   ```
   If someone presents a framework for themselves — psychology labels, attachment styles, Enneagram types — don't compete with it. Accept it, then go to what the framework can't explain: the pre-verbal, the physical, the moments where the label doesn't quite fit. "I don't think you're wrong. But I'm curious about something outside that frame."
   ```
4. **THREADING** — same as Prototype F (connect + flag/leave + park)
5. **NATURAL WORLD MIRRORS** — Prototype F placement/delivery/selection rules + inject Prototype M compact mirror library (13 mirrors, 2 tiers) after selection rules
6. **EXPLORING BREADTH** — same as Prototype F
7. **QUESTIONING STYLE** — same as Prototype F
8. **RESPONSE FORMAT** — Prototype F + add emoji palette from Prototype L:
   ```
   Emojis punctuate emotional beats — like hand signs between divers. After acknowledging
   something someone shared, when you spot something interesting, at the close of a thought.
   Never decorative, always intentional.
   Choose from: 🐢 🐠 🐙 🦈 🐚 🪸 🐡 🦑 🐋 🦐 🪼 🤿 🌊 🧭 ⚓ 💎 🧊 🫧 🌀
   👋 🤙 👌 🫡 👆 ✌️ 👊 🤝 👏 💪 💡 🎯 🪞 🔍
   ```
9. **CONVERSATION AWARENESS** — Prototype F + add passive mirroring anti-pattern from Prototype L:
   ```
   Never passively mirror: "How does that make you feel?" / "That sounds really hard."
   You explore feelings actively, with direction: "That clearly matters to you — I want
   to understand why."
   ```
10. **DEPTH PROGRESSION** — Prototype F (meet vulnerability first + invite deeper + celebrate + late-conversation depth) + add instructional anti-pattern from Prototype L after "meet vulnerability first":
    ```
    Never tell people how to behave in the conversation. No "The more honest you are,
    the better." Make them want to open up through your presence, not your instructions.
    ```
11. **HUMOR** — same as Prototype F (guardrails)
12. **WHAT STAYS INTERNAL** — same as Prototype F

### Implementation Constraints

1. **DO NOT change any repository interfaces** — No changes to `OrchestratorRepository`, `NerinAgentRepository`, `OrchestratorGraphRepository`, or any domain interfaces.

2. **DO NOT change API contracts or schemas** — No endpoint, request, or response schema changes.

3. **DO NOT change database schema** — No migration needed.

4. **DO NOT change the orchestrator graph structure** — No changes to `orchestrator-graph.langgraph.repository.ts`.

5. **DO NOT change the steering logic** — `getSteeringTarget()`, `getSteeringHint()`, and the offset cadence are unchanged. Only the string constants change.

6. **DO NOT change the greeting messages** — Greeting redesign is Story 2.14 (Priority 3).

7. **DO NOT change the portrait PORTRAIT_CONTEXT** — Portrait redesign is Story 8.7 (Priority 2).

8. **Portrait output must remain identical structure** — Same 6-section markdown format. The trimmed NERIN_PERSONA is compatible with existing PORTRAIT_CONTEXT.

9. **`buildChatSystemPrompt()` function signature unchanged** — Same name, same parameter (`steeringHint?: string`), same return type (`string`). Only the internal constant content changes.

### File Changes (Ordered)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `packages/domain/src/constants/nerin-persona.ts` | **MODIFY** | Replace NERIN_PERSONA with trimmed ~350 token version |
| 2 | `packages/domain/src/utils/nerin-system-prompt.ts` | **MODIFY** | Replace CHAT_CONTEXT with revised version (~1,280 tokens with all additions) |
| 3 | `packages/domain/src/constants/__tests__/nerin-persona.test.ts` | **MODIFY** | Update assertions for trimmed content |
| 4 | `packages/domain/src/utils/__tests__/nerin-system-prompt.test.ts` | **MODIFY** | Update assertions for revised CHAT_CONTEXT |

**Only 4 files change. All changes are to string constants and their tests.**

### Previous Story Intelligence

**Story 2-12 (Nerin Persona Coherence):**
- Created `NERIN_PERSONA` constant (~780 tokens) — this story trims it to ~350
- Created `CHAT_CONTEXT` — this story replaces it entirely
- Renamed `buildSystemPrompt` → `buildChatSystemPrompt` — name unchanged in this story
- Switched Nerin agent from structured JSON to plain text output — stays plain text
- Added markdown rendering in TherapistChat — stays as-is
- 919 tests passing (591 domain + 176 API + 152 front)
- Key learning: Prompt content changes are low-risk, high-impact. Test updates are primarily string assertions.

**Story 2-11 (Async Analyzer with Offset Steering):**
- `buildChatSystemPrompt()` imported from `@workspace/domain` — import path unchanged
- Router passes `steeringHint` to the function — interface unchanged
- Background `Effect.forkDaemon` for analyzer — unaffected by prompt content changes

### Git Intelligence

Recent commits (last 15):
- `ed35ec1` feat(story-2-12): unify Nerin persona voice — **most relevant**, created the files we're modifying
- `f0eabf6` feat(story-7-17): homepage narrative rewrite — UI work, irrelevant
- Other commits are Epic 7/8 UI work — no impact on this story

### Testing Strategy

1. **Update `nerin-persona.test.ts`** — Adjust assertions for trimmed content:
   - Remove: EMPATHY MODEL, METAPHOR & LANGUAGE, Passive mirroring, Instructional assertions
   - Update: "VOICE PRINCIPLES:" → "VOICE:" section header
   - Keep: identity paragraph, YOU NEVER SOUND LIKE, Clinical/Horoscope/Flattery/Hedging

2. **Update `nerin-system-prompt.test.ts`** — Adjust assertions for revised CHAT_CONTEXT:
   - Update section header assertions to match new block names
   - Add: assertions for new blocks (BELIEFS IN ACTION, THREADING, NATURAL WORLD MIRRORS, HUMOR, WHAT STAYS INTERNAL, MIRROR REFERENCE)
   - Keep: steering hint tests (unchanged behavior), anti-analysis content (moved to WHAT STAYS INTERNAL)
   - Update: breadth exploration assertions for new block name

3. **No portrait tests should change** — The trimmed NERIN_PERSONA is still a valid prefix. Portrait prompt construction is `NERIN_PERSONA + PORTRAIT_CONTEXT`. The trimmed version is compatible.

4. **No integration tests needed** — This is a prompt content change, not a structural change.

### Token Budget

| Component | Current | After | Delta |
|---|---|---|---|
| NERIN_PERSONA | ~780 | ~350 | -430 |
| CHAT_CONTEXT | ~450 | ~1,280 | +830 |
| Mirror library | 0 | ~380 | +380 |
| STEERING_PRIORITY (when present) | ~80 | ~80 | 0 |
| **Total chat system prompt** | **~1,310** | **~1,710** | **+400** |

Net increase: ~400 tokens per message. At ~20 messages per session, that's ~8,000 additional input tokens per session (~$0.024 per session at Claude Sonnet rates). Acceptable for the quality gains.

### Project Structure Notes

- All prompt constants: `packages/domain/src/constants/` and `packages/domain/src/utils/`
- Shared persona used by: chat prompt builder (`nerin-system-prompt.ts`) and portrait generator (`portrait-generator.claude.repository.ts`)
- No new files created
- No new packages, interfaces, or infrastructure needed
- Domain barrel export (`packages/domain/src/index.ts`) unchanged — `NERIN_PERSONA` and `buildChatSystemPrompt` already exported

### References

- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Prototype F: Revised CHAT_CONTEXT, lines 1332-1625]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Prototype G: Edge Case Stress Tests, lines 1629-1803]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Prototype L: NERIN_PERSONA Trim, lines 2640-2789]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Prototype M: Mirror Library Injection, lines 2791-2902]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Priority 1 Action Items, lines 3534-1544]
- [Source: `packages/domain/src/constants/nerin-persona.ts`] — Current persona constant (modification target)
- [Source: `packages/domain/src/utils/nerin-system-prompt.ts`] — Current chat prompt builder (modification target)
- [Source: `packages/domain/src/constants/__tests__/nerin-persona.test.ts`] — Persona tests (modification target)
- [Source: `packages/domain/src/utils/__tests__/nerin-system-prompt.test.ts`] — System prompt tests (modification target)
- [Source: `_bmad-output/implementation-artifacts/2-12-nerin-persona-coherence-conversational-redesign.md`] — Previous story with complete composition architecture
- [Source: `docs/ARCHITECTURE.md`] — Hexagonal architecture patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
