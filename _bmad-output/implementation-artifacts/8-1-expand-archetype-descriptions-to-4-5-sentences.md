# Story 8.1: Expand Archetype Descriptions to 4-5 Sentences

Status: done

## Story

As a **User viewing my results**,
I want **to read a rich, engaging description of my archetype**,
So that **I immediately feel understood and want to read further**.

## Acceptance Criteria

1. **Given** I view my results page **When** the archetype card renders **Then** the archetype description is 1500-2500 characters (expanded from current ~450) **And** the description makes me feel "that's SO me" (emotionally resonant) **And** the description covers key behavioral tendencies of the archetype **And** prose avoids repetitive sentence patterns ("You are...", "You bring...")

2. **Given** a non-curated archetype (fallback-generated) **When** the results render **Then** the fallback generator also produces 1500-2500 character descriptions **And** quality is comparable to curated entries

3. **Given** any of the 81 possible OCEAN code combinations **When** the archetype is looked up **Then** the returned description is between 1500-2500 characters

4. **Given** existing tests for archetype lookup **When** tests are run after changes **Then** all existing tests pass with updated expectations **And** description length assertions reflect the 1500-2500 character requirement

## Tasks / Subtasks

- [x] Task 1: Expand all 25 curated archetype descriptions (AC: #1, #3)
  - [x] 1.1 Edit `packages/domain/src/constants/archetypes.ts` — fully rewrite each `description` field to 1500-2500 characters (7-9 sentences)
  - [x] 1.2 Each description must cover: behavioral tendencies, social style, core motivations
  - [x] 1.3 Audit and normalize ALL 25 descriptions to consistent second-person voice ("you..."). Some existing descriptions mix voice (e.g., GBAN uses "you bring..." but others don't). Every sentence in every description must use second-person.
  - [x] 1.4 Tone: warm, affirming, non-judgmental — celebrate each level as valid
  - [x] 1.5 Ensure all descriptions are within 1500-2500 character range (revised from sentence-count constraint per review feedback)
  - [x] 1.6 Visually verify expanded text renders well in both `ArchetypeHeroSection` (hero `<p>` with `max-w-xl`) and `ArchetypeCard` — no CSS changes needed, just confirm longer text wraps cleanly

- [x] Task 2: Update fallback description generator (AC: #2, #3)
  - [x] 2.1 Edit `generateDescription()` in `packages/domain/src/utils/archetype-lookup.ts` to produce 4-paragraph, 1500-2500 character descriptions (revised from 4-5 sentences)
  - [x] 2.2 Switch from third-person to second-person voice throughout
  - [x] 2.3 Target sentence structure: (1) O+C behavioral sentence, (2) E+A social style sentence, (3) combined behavioral nuance referencing all 4 traits, (4) motivational/driving force summary
  - [x] 2.4 Expand the `TRAIT_DESCRIPTIONS` fragment lookup (lines 83-104) with richer, more varied fragments to support quality 4-sentence output
  - [x] 2.5 Verify all 56 non-curated codes produce 1500-2500 character descriptions (revised from sentence-count target)
  - [x] 2.6 **DO NOT rename or export** the local `TRAIT_DESCRIPTIONS` constant in `archetype-lookup.ts` — it is a private implementation detail. Story 8.2 will create a separate exported `TRAIT_DESCRIPTIONS` in `packages/domain/src/constants/trait-descriptions.ts` for a different purpose. Avoid any naming collision.

- [x] Task 3: Update `Archetype` type documentation (AC: #3)
  - [x] 3.1 Update JSDoc comment in `packages/domain/src/types/archetype.ts`: update to "1500-2500 characters"
  - [x] 3.2 Update JSDoc comment in `generateDescription()` function (archetype-lookup.ts): update to "1500-2500 characters" with paragraph structure documentation

- [x] Task 4: Update tests (AC: #4)
  - [x] 4.1 Update `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`:
    - Update generated description length assertion from `50-300` to `1500-2500` chars
    - Update the all-81-combinations test to assert `>= 1500` and `<= 2500` chars
    - (Sentence-count assertion dropped in favor of character-length per review feedback)
  - [x] 4.2 Run `pnpm --filter=domain test` — verify all 81-combination tests pass (507/507 passed)
  - [x] 4.3 Run `pnpm test:run` — verify no regressions in other packages (818 total tests, 0 failures)

## Dev Notes

### Key Architecture Constraints

- **Pure domain change** — no API changes, no schema changes, no DB changes, no handler changes
- **ADR-5 compliance** — archetype data lives in-memory as constants and pure functions, NOT in the database
- **ADR-7 alignment** — descriptions are derived at read-time from OCEAN code; database never stores descriptions
- **Deterministic output** — `lookupArchetype()` must return identical results for the same code across unlimited calls

### Source Tree Components to Touch

| File | Change Type | Purpose |
|------|------------|---------|
| `packages/domain/src/constants/archetypes.ts` | EDIT | Expand 25 curated description strings |
| `packages/domain/src/utils/archetype-lookup.ts` | EDIT | Update `generateDescription()` to produce 4-5 sentences |
| `packages/domain/src/types/archetype.ts` | EDIT | Update JSDoc comment (2-3 → 4-5) |
| `packages/domain/src/utils/__tests__/archetype-lookup.test.ts` | EDIT | Update length assertions, add sentence count test |

### Files NOT to Touch

- `apps/front/` — No frontend changes. The `ArchetypeHeroSection` and `ArchetypeCard` components render the `description` string as-is. Longer text flows naturally.
- `apps/api/` — No handler or use-case changes. `get-results.use-case.ts` returns `archetype.description` directly.
- `packages/contracts/` — No API contract changes. `archetypeDescription: S.String` has no length constraint.
- `packages/infrastructure/` — No repository changes.

### Content Writing Guidelines

Per Epic 8 content authoring notes:
- **Second person:** "You tend to..." not "People with this trait..."
- **Warm and affirming:** Celebrate each level as valid, not better/worse
- **Behavioral:** Describe what users DO, not abstract psychology
- **Specific:** Use concrete examples ("you're the one organizing the group trip")
- **Non-judgmental:** Low Agreeableness is "direct and honest," not "difficult"

Each expanded description should cover 3 dimensions:
1. **Behavioral tendencies** — How the person acts in daily life
2. **Social style** — How they relate to others
3. **Core motivations** — What drives them internally

### Fallback Generator Architecture

The current `generateDescription()` function (archetype-lookup.ts:174-189):
- Builds 2 sentences by combining trait-level descriptions from the local `TRAIT_DESCRIPTIONS` lookup
- Sentence 1: Combines O (Openness) + C (Conscientiousness) descriptions
- Sentence 2: Combines E (Extraversion) + A (Agreeableness) descriptions
- Uses third-person voice ("Someone who...", "This person...")

**Required changes:**
- Switch from third-person to second-person voice ("You..." instead of "Someone who...")
- Expand to 4 sentences with this structure:
  1. **O+C sentence** — How you think and organize ("You embrace new ideas and approach them with careful planning.")
  2. **E+A sentence** — How you relate to people ("You thrive in social settings and prioritize genuine care for others.")
  3. **Behavioral nuance** — Combined cross-trait insight referencing all 4 dimensions
  4. **Motivational summary** — What drives you at your core
- Keep output deterministic (no randomness)
- Expand the `TRAIT_DESCRIPTIONS` fragment lookup (lines 83-104) with second-person fragments to support the new sentence patterns

**NAMING COLLISION WARNING:**
The local `TRAIT_DESCRIPTIONS` constant in `archetype-lookup.ts` (line 83) is a **private implementation detail** of the fallback generator. Do NOT rename, export, or move it. Story 8.2 will create a completely separate `TRAIT_DESCRIPTIONS` export in `packages/domain/src/constants/trait-descriptions.ts` for level-specific trait descriptions shown on the results page. These are unrelated concepts that happen to share a name.

### Testing Standards

- **Test file:** `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`
- **Current test for generated descriptions (line 206-209):** asserts length is 50-300 chars — needs increasing
- **All 81 combinations test (lines 217-239):** asserts `description.length > 20` — consider raising minimum
- **Add new test:** Count sentences (split by `. ` or regex for sentence boundaries) — expect 4-5 sentences per description
- **Run command:** `pnpm --filter=domain test` or `pnpm test:run`

### Project Structure Notes

- All changes are contained within `packages/domain/` — a standalone package with no service dependencies
- The `domain` package exports `lookupArchetype` and `CURATED_ARCHETYPES` via `packages/domain/src/index.ts`
- No export changes needed (same functions, same types, just longer content)
- Biome linting applies — long strings are fine as template literals or regular strings

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.1]
- [Source: packages/domain/src/constants/archetypes.ts — 25 curated entries, lines 50-226]
- [Source: packages/domain/src/utils/archetype-lookup.ts — generateDescription(), lines 174-189]
- [Source: packages/domain/src/types/archetype.ts — Archetype interface, lines 93-104]
- [Source: packages/domain/src/utils/__tests__/archetype-lookup.test.ts — full test suite]
- [Source: _bmad-output/planning-artifacts/architecture-archetype-description-storage.md — ADR-7]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture patterns]

### Git Intelligence

Recent commits show Epic 7 (UI Theme & Visual Identity) completed with stories 7-8 through 7-15. Pattern observations:
- Branch naming: `feat/story-{epic}-{story}-{slug}`
- Commit format: `feat(story-{epic}-{story}): description`
- PR-based workflow with squash merges
- All recent work was frontend-focused; this story returns to domain package work

### Previous Epic Context

No previous story in Epic 8 exists (this is 8.1, the first story). However:
- Epic 3 (Stories 3.1-3.2) established the archetype system — same files being modified
- The `CURATED_ARCHETYPES` constant and `lookupArchetype()` function have been stable since Epic 3
- No breaking changes expected — purely additive content expansion

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no debugging required.

### Completion Notes List

- Expanded all 25 curated archetype descriptions from ~450 chars to 1500-1738 chars each. Descriptions use varied, non-repetitive prose (avoiding "You are...", "You bring..." patterns) while covering behavioral tendencies, social style, and core motivations.
- Rewrote `TRAIT_DESCRIPTIONS` in `archetype-lookup.ts` from simple `{primary, nuance, motivation}` string fragments to richer `{opener, depth, social, drive}` structured objects for 4-paragraph fallback generation.
- Updated `generateDescription()` from 2-sentence third-person to 4-paragraph second-person with structure: (1) O+C behavioral foundation, (2) E+A social/interpersonal, (3) cross-trait social nuances, (4) motivational synthesis. Produces ~2000-2200 char descriptions.
- All 81 OCEAN code combinations verified within 1500-2500 character range. 25 curated (1500-1738), 56 generated (~2021-2201).
- Updated JSDoc in `Archetype` interface and `generateDescription()` to reflect "1500-2500 characters" standard.
- Replaced sentence-count test assertions with character-length assertions (1500-2500 range).
- Full test suite: 506 domain tests + 166 API tests + 145 frontend tests = 817 total, 0 failures, 0 regressions.
- `TRAIT_DESCRIPTIONS` constant kept private and unexported per naming collision warning for Story 8.2.

### Change Log

- 2026-02-16: Implemented Story 8.1 — expanded all archetype descriptions to 4-5 sentences, updated fallback generator, updated tests
- 2026-02-16: Review feedback — changed constraint from sentence count to character length (1500-2500), rewrote all descriptions with varied non-repetitive prose, updated tests
- 2026-02-16: Code review — fixed lowercase sentence starts in all 56 generated descriptions (`c.social` fragment after `. ` needed capitalization), updated task descriptions to accurately reflect character-length approach

### File List

- `packages/domain/src/constants/archetypes.ts` — MODIFIED: Expanded all 25 curated descriptions to 1500-1738 chars with varied prose, updated JSDoc
- `packages/domain/src/utils/archetype-lookup.ts` — MODIFIED: Rewrote `TRAIT_DESCRIPTIONS` to richer `{opener, depth, social, drive}` format, rewrote `generateDescription()` for 4-paragraph output (~2000-2200 chars)
- `packages/domain/src/types/archetype.ts` — MODIFIED: Updated JSDoc to "1500-2500 characters"
- `packages/domain/src/utils/__tests__/archetype-lookup.test.ts` — MODIFIED: Updated length assertions to 1500-2500 character range, removed sentence-count tests
