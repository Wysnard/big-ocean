# Story 29-3: Contextual Mirror System

**Status:** ready-for-dev

**Epic:** Epic 2 — Bridge Transitions & Contextual Mirrors
**Story:** 2.3

## User Story

As an assessment user,
I want Nerin's ocean mirrors to be contextually relevant to the current intent and observation,
so that mirrors reinforce the steering direction rather than being randomly available.

## Acceptance Criteria

**Given** mirrors are currently loaded via MIRRORS_EXPLORE and MIRRORS_AMPLIFY modules
**When** the contextual mirror system is implemented
**Then:**

1. A mirror lookup table exists keyed by `intent x observation` (from brainstorming spec)
2. Open intent loads no mirrors
3. Explore intent loads observation-specific mirrors:
   - relate: Full library available (all 13 mirrors)
   - noticing: Hermit Crab, Volcanic Vents, Bioluminescence, Tide Pool
   - contradiction: Tide Pool, Bioluminescence, Dolphin Echolocation, Mimic Octopus
   - convergence: Ghost Net, Pilot Fish, Coral Reef, Parrotfish, Sea Urchin
4. Bridge intent loads observation-specific mirrors (subset of explore mirrors):
   - relate: Any mirror that connects territories (full library)
   - noticing: Hermit Crab, Volcanic Vents
   - contradiction: Tide Pool, Dolphin Echolocation
   - convergence: Ghost Net, Coral Reef, Pilot Fish
5. Close (amplify) intent loads all-observation mirrors: Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola
6. Each mirror set includes the guardrail: "You can discover new mirrors in the moment — but the biology must be real"
7. MIRRORS_EXPLORE and MIRRORS_AMPLIFY modules are deleted
8. Prompt builder loads mirrors from lookup table instead of selecting mirror modules
9. Unit tests verify correct mirror sets per intent x observation combination

## Tasks

### Task 1: Create contextual mirror lookup table

**File:** `packages/domain/src/constants/nerin/contextual-mirrors.ts` (new)

Create a contextual mirror module with:
- Individual mirror definitions (name + biology + meaning) for all 13 mirrors
- A lookup function `getMirrorsForContext(intent, observationType)` that returns the curated mirror set as a formatted string
- The lookup table follows the brainstorming spec:
  - open x any: no mirrors (returns null)
  - explore x relate: full library (all 13)
  - explore x noticing: Hermit Crab, Volcanic Vents, Bioluminescence, Tide Pool
  - explore x contradiction: Tide Pool, Bioluminescence, Dolphin Echolocation, Mimic Octopus
  - explore x convergence: Ghost Net, Pilot Fish, Coral Reef, Parrotfish, Sea Urchin
  - bridge x relate: full library (all 13, any mirror that connects territories)
  - bridge x noticing: Hermit Crab, Volcanic Vents
  - bridge x contradiction: Tide Pool, Dolphin Echolocation
  - bridge x convergence: Ghost Net, Coral Reef, Pilot Fish
  - amplify x any: Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola
- Each rendered mirror set includes the guardrail: "You can discover new mirrors in the moment — but the biology must be real"
- Format mirrors as prose block matching the style of the existing MIRRORS_EXPLORE/MIRRORS_AMPLIFY constants

### Task 2: Write unit tests for contextual mirror lookup

**File:** `packages/domain/src/constants/nerin/__tests__/contextual-mirrors.test.ts` (new)

Tests:
1. `getMirrorsForContext("open", "relate")` returns null
2. `getMirrorsForContext("open", "noticing")` returns null (all open observations return null)
3. `getMirrorsForContext("explore", "relate")` includes all 13 mirrors
4. `getMirrorsForContext("explore", "noticing")` includes exactly Hermit Crab, Volcanic Vents, Bioluminescence, Tide Pool
5. `getMirrorsForContext("explore", "contradiction")` includes exactly Tide Pool, Bioluminescence, Dolphin Echolocation, Mimic Octopus
6. `getMirrorsForContext("explore", "convergence")` includes exactly Ghost Net, Pilot Fish, Coral Reef, Parrotfish, Sea Urchin
7. `getMirrorsForContext("bridge", "relate")` includes all 13 mirrors
8. `getMirrorsForContext("bridge", "noticing")` includes exactly Hermit Crab, Volcanic Vents
9. `getMirrorsForContext("bridge", "contradiction")` includes exactly Tide Pool, Dolphin Echolocation
10. `getMirrorsForContext("bridge", "convergence")` includes exactly Ghost Net, Coral Reef, Pilot Fish
11. `getMirrorsForContext("amplify", "relate")` includes exactly Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola
12. `getMirrorsForContext("amplify", "noticing")` returns same set as amplify x relate (all observations same for amplify)
13. All non-null results include the guardrail text
14. All non-null results include the mirror header text

### Task 3: Integrate contextual mirrors into prompt builder

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

- Import `getMirrorsForContext` from contextual-mirrors module
- After composing common + steering layers, call `getMirrorsForContext(input.intent, observationType)` to get contextual mirrors
- If mirrors are returned (non-null), append them to the system prompt after the steering section
- Remove `MIRROR_GUARDRAILS` from COMMON_MODULES (it's now included in the contextual mirror output — the guardrail is per-mirror-set)
- Update `PromptBuilderOutput` to include `mirrorSet: string | null` for debugging

### Task 4: Delete MIRRORS_EXPLORE and MIRRORS_AMPLIFY modules

**Files:**
- Delete `packages/domain/src/constants/nerin/mirrors-explore.ts`
- Delete `packages/domain/src/constants/nerin/mirrors-amplify.ts`
- Update `packages/domain/src/constants/nerin/index.ts` — remove exports for deleted modules, add export for `getMirrorsForContext`
- Update `packages/domain/src/index.ts` — remove `MIRRORS_EXPLORE`, `MIRRORS_AMPLIFY` exports, add `getMirrorsForContext` export

### Task 5: Update prompt builder tests for contextual mirrors

**File:** `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`

- Update common module list to no longer include `MIRROR_GUARDRAILS` (it's now part of contextual mirrors)
- Add tests for contextual mirror integration:
  - Open intent: no mirrors in output
  - Explore x relate: mirrors section present with all 13 mirrors
  - Explore x noticing: mirrors section present with observation-specific subset
  - Bridge x relate: mirrors section present
  - Amplify: mirrors section present with closing mirrors
  - All mirror outputs include guardrail text
- Verify `mirrorSet` field in output is null for open, string for other intents

## Technical Guidance

- The existing `MIRRORS_EXPLORE` and `MIRRORS_AMPLIFY` are loaded as whole modules in the old 4-tier system. The new system loads mirrors contextually per intent x observation pair.
- `MIRROR_GUARDRAILS` currently lives in COMMON_MODULES (always-on). Since mirrors are now contextually loaded, the guardrail should move into the contextual mirror output so it only appears when mirrors are present.
- The prompt builder currently has no mirror loading — mirrors were handled by the old tier system. This story adds mirrors back via the contextual lookup.
- Follow the existing pattern in `steering-templates.ts` for the lookup table pattern.
- Mirror definitions should preserve the exact biology and meaning from `mirrors-explore.ts`.
- Keep `mirror-guardrails.ts` alive — its placement rules (1-2 per conversation, accompany questions, etc.) remain part of COMMON_MODULES. Only the "biology must be real" guardrail moves to the contextual mirror output. The distinction: `MIRROR_GUARDRAILS` = how to use mirrors (always-on), contextual guardrail = "you can discover new ones" (only when mirrors are present).
