# Story 32-0b: OCEAN Code Letter Mapping Update

**Status:** ready-for-dev

## User Story

As a user viewing my personality results,
I want each trait level to have a unique, meaningful letter,
So that my OCEAN code is unambiguous and maps to distinct geometric shapes.

## Background

The current `TRAIT_LETTER_MAP` has two letter collisions:
- **R** is used for both Extraversion-Low ("Reserved") and Neuroticism-Low ("Resilient")
- **T** is used for both Openness-Low ("Traditional") and Neuroticism-Mid ("Tempered")

These collisions create ambiguity in the OCEAN code and prevent unique geometric shape mapping per letter. The fix changes:
- Extraversion-Low: R (Reserved) -> I (Introverted)
- Neuroticism-Mid: T (Tempered) -> V (Variable)

After the update, all 15 trait-level letters will be unique.

## Acceptance Criteria

1. **Given** the TRAIT_LETTER_MAP is updated, **When** checking all 15 letters, **Then** Extraversion-Low = "I" (Introverted) and Neuroticism-Mid = "V" (Variable), and all 15 letters are unique.

2. **Given** type definitions are updated, **When** compiling TypeScript, **Then** `ExtraversionLevel = "I" | "B" | "E"` and `NeuroticismLevel = "R" | "V" | "N"`.

3. **Given** the schema regex is updated, **When** validating OCEAN codes, **Then** `OceanCode4Schema` matches `[TMO][FSC][IBE][DPA]` and `OceanCode5Schema` matches `[TMO][FSC][IBE][DPA][RVN]`.

4. **Given** the 27 curated archetype keys with "R" in position 3 (Extraversion-Low), **When** looking them up, **Then** all keys use "I" instead (e.g., `OCRA` -> `OCIA`).

5. **Given** TEASER_TRAIT_LETTERS is updated, **When** generating teaser codes, **Then** Extraversion uses `["I", "B", "E"]` and Neuroticism uses `["R", "V", "N"]`.

6. **Given** all existing tests are updated with new letter fixtures, **When** running `pnpm test:run`, **Then** all tests pass.

7. **Given** TRAIT_LEVEL_LABELS and TRAIT_DESCRIPTIONS use trait-specific letter keys, **When** looking up labels, **Then** Extraversion-Low is keyed by "I" and Neuroticism-Mid is keyed by "V".

8. **Given** doc comments reference old letters (R=Reserved for Extraversion, T=Tempered for Neuroticism), **When** the update is complete, **Then** all doc comments reflect I=Introverted and V=Variable.

9. **Given** regex patterns in `archetype-lookup.ts` use `[RBE]` and `[RTN]`, **When** updated, **Then** they use `[IBE]` and `[RVN]`.

## Tasks

### Task 1: Update domain type definitions and mappings
- [ ] 1.1 Update `ExtraversionLevel` type in `packages/domain/src/types/archetype.ts` from `"R" | "B" | "E"` to `"I" | "B" | "E"`
- [ ] 1.2 Update `NeuroticismLevel` type from `"R" | "T" | "N"` to `"R" | "V" | "N"`
- [ ] 1.3 Update `TRAIT_LETTER_MAP` extraversion entry from `["R", "B", "E"]` to `["I", "B", "E"]`
- [ ] 1.4 Update `TRAIT_LETTER_MAP` neuroticism entry from `["R", "T", "N"]` to `["R", "V", "N"]`
- [ ] 1.5 Update `TRAIT_LEVEL_LABELS` extraversion: key `R: "Reserved"` -> `I: "Introverted"`
- [ ] 1.6 Update `TRAIT_LEVEL_LABELS` neuroticism: key `T: "Tempered"` -> `V: "Variable"`
- [ ] 1.7 Update all doc comments in `archetype.ts` referencing old letters

### Task 2: Update schema regex patterns
- [ ] 2.1 Update `OceanCode4Schema` regex from `[RBE]` to `[IBE]` in `packages/domain/src/schemas/ocean-code.ts`
- [ ] 2.2 Update `OceanCode5Schema` regex from `[RTN]` to `[RVN]`
- [ ] 2.3 Update doc comments in schema file

### Task 3: Update archetype constants
- [ ] 3.1 Update `TEASER_TRAIT_LETTERS` extraversion from `["R", "B", "E"]` to `["I", "B", "E"]`
- [ ] 3.2 Update `TEASER_TRAIT_LETTERS` neuroticism from `["R", "T", "N"]` to `["R", "V", "N"]`
- [ ] 3.3 Rename all 27 archetype keys with "R" in position 3 to "I" (e.g., `OCRA` -> `OCIA`)
- [ ] 3.4 Update doc comments in `archetypes.ts`
- [ ] 3.5 Update stale comment about teaser letters (references I/A/E etc.)

### Task 4: Update archetype-lookup.ts
- [ ] 4.1 Update `VALID_CODE4_REGEX` from `[RBE]` to `[IBE]`
- [ ] 4.2 Update `VALID_CODE5_REGEX` from `[RTN]` to `[RVN]`
- [ ] 4.3 Update error messages referencing old patterns
- [ ] 4.4 Update doc comments

### Task 5: Update ocean-code-generator.ts doc comments
- [ ] 5.1 Update the file-level JSDoc to reflect I=Introverted and V=Variable

### Task 6: Update trait descriptions
- [ ] 6.1 Update `TRAIT_DESCRIPTIONS.extraversion.levels` key from `R` to `I`
- [ ] 6.2 Update `TRAIT_DESCRIPTIONS.neuroticism.levels` key from `T` to `V`

### Task 7: Update test fixtures and assertions
- [ ] 7.1 Update `TRAIT_LETTERS` in `ocean-code-generator.fixtures.ts` for extraversion and neuroticism
- [ ] 7.2 Update all hardcoded OCEAN code strings in `ocean-code-generator-core.test.ts` (e.g., `TFRDR` -> `TFIDR`, `MSBPT` -> `MSBPV`, `OFBAR` -> `OFBAI`)
- [ ] 7.3 Update `ocean-code-schemas.test.ts` regex comments and test values
- [ ] 7.4 Update `archetype-lookup-exhaustive.test.ts` test values
- [ ] 7.5 Update `GeometricSignature.test.tsx` hardcoded codes and comments
- [ ] 7.6 Update `GeometricSignature.stories.tsx` example codes
- [ ] 7.7 Update `ArchetypeCard.stories.tsx` if it uses affected codes
- [ ] 7.8 Update `trait-descriptions.test.ts` (no changes needed — it reads from TRAIT_LETTER_MAP dynamically)
- [ ] 7.9 Update `shareable-profile.use-case.test.ts` and `profile-access-log.test.ts` OCEAN code fixtures
- [ ] 7.10 Update `get-results-success.use-case.test.ts` OCEAN code fixtures
- [ ] 7.11 Update `ShareCardPreview.tsx` hardcoded OCEAN code

### Task 8: Run full test suite and typecheck
- [ ] 8.1 Run `pnpm turbo typecheck` — must pass
- [ ] 8.2 Run `pnpm test:run` — all tests must pass

## Dev Notes

- The `GeometricSignature` component dynamically builds its letter-to-size map from `TRAIT_LETTER_MAP`, so once the map is updated, the component behavior updates automatically. However, tests that hardcode expected OCEAN codes need updating.
- The collision resolution removes ambiguity: previously, "T" in a code could mean Traditional (Openness-Low) or Tempered (Neuroticism-Mid). Now "T" unambiguously means Traditional, and "V" means Variable.
- Similarly, "R" previously meant both Reserved (Extraversion-Low) and Resilient (Neuroticism-Low). Now "I" means Introverted and "R" unambiguously means Resilient.
