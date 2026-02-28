# Story 19.1: Remove Quote Constraint from Portrait Prompts

Status: ready-for-dev

## Story

As a user reading my personality portrait,
I want the narrative to reveal deep behavioral insight rather than echoing my exact words back,
So that the portrait feels genuinely perceptive — like someone who understands me, not someone who took notes.

## Acceptance Criteria

1. **Given** `TEASER_CONTEXT` in `teaser-portrait.anthropic.repository.ts`
   **When** updated
   **Then** the constraint "OPENING: Reader must encounter a specific thing they said within first 3 sentences" is removed from the NON-NEGOTIABLE CONSTRAINTS section
   **And** the opening focuses on spine arrival and intrigue instead (the constraint line is removed; the rest of the prompt already describes spine-based opening)

2. **Given** `PORTRAIT_CONTEXT` in `portrait-generator.claude.repository.ts`
   **When** updated
   **Then** the constraint "OPENING: The reader must encounter a specific thing they said within first 3 sentences" is removed from the NON-NEGOTIABLE CONSTRAINTS section
   **And** the "Recognition objective: The reader must feel HEARD within the first 3 sentences" line in SECTION 1 is updated — the specific-quote requirement is removed, but recognition from spine accuracy is preserved
   **And** portraits may still reference conversation moments organically — this is not a hard constraint

3. **Given** the TEASER_CONTEXT SECTION 1 guidance
   **When** updated
   **Then** "Recognition objective: The reader must feel HEARD within the first 3 sentences" line has the specific-quote emphasis removed
   **And** "Reference something SPECIFIC from the evidence — a moment, a phrase, a reaction" is softened to indicate these are organic tools, not a mandatory opening constraint

4. **Given** both portrait prompts after changes
   **When** inspected
   **Then** all other constraints (spine must be underneath, no meta-preambles, guardrails, depth adaptation, formatting, voice principles) remain UNTOUCHED

## Tasks / Subtasks

- [ ] Task 1: Update TEASER_CONTEXT in teaser-portrait.anthropic.repository.ts (AC: #1, #4)
  - [ ] 1.1: Remove the "OPENING: Reader must encounter a specific thing they said within first 3 sentences" bullet from NON-NEGOTIABLE CONSTRAINTS section
  - [ ] 1.2: In SECTION 1 (THE OPENING), remove/soften "Recognition objective: The reader must feel HEARD within the first 3 sentences" — replace with guidance that recognition comes from spine accuracy and behavioral insight, not echoed quotes
  - [ ] 1.3: Soften "Reference something SPECIFIC from the evidence — a moment, a phrase, a reaction. No meta-preambles" → keep "No meta-preambles" but make specific references an organic option, not a constraint
  - [ ] 1.4: Verify the VALIDATED EXAMPLE in TEASER_CONTEXT is unaffected (there is no example in teaser — confirm)
  - [ ] 1.5: Verify all other sections (FIND YOUR THREAD, VOICE PRINCIPLES, GUARDRAILS, DEPTH ADAPTATION, FORMATTING) are completely untouched

- [ ] Task 2: Update PORTRAIT_CONTEXT in portrait-generator.claude.repository.ts (AC: #2, #4)
  - [ ] 2.1: Remove the "OPENING: The reader must encounter a specific thing they said within first 3 sentences" bullet from NON-NEGOTIABLE CONSTRAINTS section
  - [ ] 2.2: In SECTION 1 (THE OPENING), update "Recognition objective: The reader must feel HEARD within the first 3 sentences" — recognition comes from spine accuracy, not mandatory quote usage
  - [ ] 2.3: Soften "The first sentence must signal continuity — 'I was there with you.' Reference something SPECIFIC from the conversation — a moment, a phrase, a reaction. No meta-preambles" → keep "No meta-preambles", make specific references organic
  - [ ] 2.4: Leave CRAFT REQUIREMENT #3 (REACTION BEFORE ANALYSIS) untouched — this is about how to handle quotes when they ARE used, not a mandate to use them
  - [ ] 2.5: Leave CRAFT REQUIREMENT #4 (CALLBACK HOOKS) untouched — anchoring to real moments is about structural quality, not quote echoing
  - [ ] 2.6: Verify ALL other sections remain completely untouched: BEFORE YOU WRITE, HOW TO SOUND, SECTIONS 2-4, WRITING TECHNIQUES, DEPTH ADAPTATION, CRAFT REQUIREMENTS, GUARDRAILS, FORMATTING, VALIDATED EXAMPLE

- [ ] Task 3: Verify no other files reference the removed constraints (AC: #4)
  - [ ] 3.1: Search codebase for "specific thing they said" — confirm only the two portrait repos reference it
  - [ ] 3.2: Search for "HEARD within the first 3 sentences" — confirm only portrait repos
  - [ ] 3.3: Ensure portrait-prompt.utils.ts (if it exists) doesn't duplicate these constraints

- [ ] Task 4: Run tests (AC: all)
  - [ ] 4.1: Run `pnpm test:run` to verify no tests break
  - [ ] 4.2: Run `pnpm lint` to verify linting passes
  - [ ] 4.3: Run `pnpm build` to verify build passes

## Parallelism

- **Blocked by:** none
- **Blocks:** 19-2-portrait-telemetry-placeholder
- **Mode:** parallel (can run concurrently with Epics 16, 17, 18, and all other pipeline stories)
- **Domain:** backend portrait prompts (infrastructure layer only)
- **Shared files:** `teaser-portrait.anthropic.repository.ts` and `portrait-generator.claude.repository.ts` are also touched by Story 18-6 (update portrait generators to use conversation evidence) — if running in parallel, coordinate merge on these two files

## Dev Notes

- This is a **prompt-only change** — no schema changes, no API changes, no new dependencies
- The two files to modify are both in `packages/infrastructure/src/repositories/`
- The change is purely about removing a hard constraint; the prompts already have extensive guidance for spine-based recognition that doesn't depend on quoting
- Decision 5 from the conversation pipeline architecture explicitly defines what to remove and what replaces it
- The VALIDATED EXAMPLE in PORTRAIT_CONTEXT still uses quotes/blockquotes — this is fine, they demonstrate organic quote usage which is still allowed. Do NOT modify the example.

### Exact Files to Modify

| File | Change |
|---|---|
| `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts` | Remove quote constraint from TEASER_CONTEXT string literal |
| `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` | Remove quote constraint from PORTRAIT_CONTEXT string literal |

### What to Remove vs Keep (Critical Disambiguation)

**REMOVE these specific constraints:**
- NON-NEGOTIABLE CONSTRAINTS bullet: `"OPENING: Reader/The reader must encounter a specific thing they said within first 3 sentences"`
- SECTION 1 line: `"Recognition objective: The reader must feel HEARD within the first 3 sentences"` (the specific-quote version)

**SOFTEN these lines (make organic, not mandatory):**
- `"Reference something SPECIFIC from the evidence/conversation — a moment, a phrase, a reaction"` → Portraits MAY reference moments organically, but it's not a hard opening constraint

**KEEP UNTOUCHED (do NOT modify):**
- Spine constraints ("Must be UNDERNEATH, not surface")
- "No meta-preambles about sitting with data or reflecting"
- BEFORE YOU WRITE / FIND YOUR THREAD (spine selection process)
- HOW TO SOUND / VOICE PRINCIPLES
- BUILD, TURN, LANDING section guidance
- CRAFT REQUIREMENTS (all 6, including #3 REACTION BEFORE ANALYSIS and #4 CALLBACK HOOKS)
- GUARDRAILS
- DEPTH ADAPTATION
- FORMATTING
- VALIDATED EXAMPLE
- All "across the table" test language (this is about spine quality, not quote echoing)

### Architecture Compliance

- Changes are confined to infrastructure layer (repository implementations) — no domain or use-case changes needed
- No new exports, no interface changes, no schema changes
- Hexagonal architecture boundary respected: prompt content lives in infrastructure repos

### Testing Standards

- No new tests needed — this is a prompt text change, not a code logic change
- Existing tests should continue to pass unchanged
- Manual validation: generate a portrait after deployment and verify it no longer mandates opening quotes

### References

- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Decision 5] — Decision rationale and before/after table
- [Source: _bmad-output/planning-artifacts/epics-conversation-pipeline.md#Story 4.1] — Story definition and acceptance criteria
- [Source: packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts] — TEASER_CONTEXT constant
- [Source: packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts] — PORTRAIT_CONTEXT constant

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Prompt over-engineering** — Do NOT rewrite or restructure the portrait prompts beyond removing the specified constraints. Do NOT add new constraints, new sections, or reorganize existing content. Minimal surgical edits only.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
