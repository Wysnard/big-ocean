---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/problem-solution-2026-03-13.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-03-13.md'
---

# big-ocean - Nerin Steering Format — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Nerin Steering Format overhaul, transforming how the steering pipeline's outputs are communicated to Nerin via the system prompt. The core problem: Nerin ignores territory assignments because steering is phrased as weak suggestions at the bottom of the prompt, competing with strong always-on depth instincts at the top. The solution: collapse the 4-tier prompt to 2 layers (common identity + per-turn steering), replace suggestive language with desire framing, add bridge intent for territory transitions, and dissolve 5 modules into intent × observation templates.

## Requirements Inventory

### Functional Requirements

FR1: Territory assignments from the steering pipeline must influence Nerin's actual closing question to target the assigned territory's facets and domains
FR2: Territory transitions must trigger a dedicated `bridge` intent when `selectedTerritory !== previousTerritory` (and turnNumber > 0, not final turn), with park-bridge-close response arc
FR3: Observation focus (`relate`, `noticing`, `contradiction`, `convergence`) must drive the entire response shape via intent × observation templates (13 total)
FR4: Entry pressure (`direct`, `angled`, `soft`) must modulate steering language strength on `explore` and `bridge` intents
FR5: Territory descriptions must be written as Nerin's curiosity ("how they...", "what they...") — desire framing, not external instruction
FR6: Steering section must be promoted from last position to immediately after persona in the system prompt
FR7: Unconditional depth-seeking instinct ("go deeper when opening up") must be removed; depth becomes steering-controlled
FR8: On territory-change turns, a soft negative constraint must prevent Nerin from pulling the conversation back to the previous territory
FR9: Bridge transitions must follow a 3-tier fallback: (1) find a connection, (2) flag and leave, (3) clean jump
FR10: The 4-tier prompt system must collapse to 2 layers: common (who Nerin is, stable) + steering (where Nerin points, per-turn)
FR11: 5 existing modules must be dissolved: THREADING, MIRRORS_EXPLORE, MIRRORS_AMPLIFY, OBSERVATION_QUALITY, EXPLORE_RESPONSE_FORMAT
FR12: Mirror examples must be curated by intent × observation lookup table, loaded contextually per turn

### NonFunctional Requirements

NFR1: Nerin's conversational quality (warmth, curiosity, insight) must be preserved — territory compliance and naturalness are unified, not traded
NFR2: All prompt composition changes must be unit-testable (prompt-builder is a pure function)
NFR3: Each implementation phase must be independently testable — existing behavior doesn't break until the actual swap
NFR4: Prompt length should not significantly increase — module dissolution offsets new template content
NFR5: Changes must be reversible — revert prompt-builder + restore constants to roll back

### Additional Requirements

- Territory catalog (`territory-catalog.ts`) needs `name` and `description` fields added to all 25 territories
- `PromptBuilderInput` type in `packages/domain/src/types/pacing.ts` needs `bridge` intent variant with `previousTerritory` field
- Governor (`move-governor.ts`) must emit `bridge` intent when `selectedTerritory !== previousTerritory` (simple inequality, not transition_type)
- Prompt builder (`prompt-builder.ts`) is the single integration point — all changes compose through it
- REFLECT and STORY_PULLING modules move to common layer (not intent-specific)
- CONVERSATION_INSTINCTS trimmed: remove depth, move guarded handling to pressure modifiers
- `amplify` intent should be renamed to `close` throughout

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Territory compliance via desire framing + skeleton templates |
| FR2 | Epic 2 | Bridge intent on `selectedTerritory !== previousTerritory` |
| FR3 | Epic 1 | 13 intent × observation templates drive response shape |
| FR4 | Epic 1 | Entry pressure modulates steering language |
| FR5 | Epic 1 | Territory descriptions as Nerin's curiosity |
| FR6 | Epic 1 | Steering promoted to position 2 (after persona) |
| FR7 | Epic 1 | Unconditional depth instinct removed |
| FR8 | Epic 2 | Soft negative constraint on territory change |
| FR9 | Epic 2 | Bridge 3-tier fallback (connect → flag-and-leave → clean jump) |
| FR10 | Epic 1 | 4-tier → 2-layer prompt collapse |
| FR11 | Epic 1+2 | Module dissolution (split across both epics) |
| FR12 | Epic 2 | Mirror lookup by intent × observation |

## Epic List

### Epic 1: Desire-Framed Steering System
Nerin follows territory assignments through desire framing and intent × observation skeleton templates. The 4-tier prompt collapses to 2 layers (common identity + per-turn steering). Depth becomes steering-controlled, observation focus drives response shape, and territory is framed as Nerin's own curiosity.
**FRs covered:** FR1, FR3, FR4, FR5, FR6, FR7, FR10, FR11 (partial)

### Epic 2: Bridge Transitions & Contextual Mirrors
Territory transitions get a dedicated `bridge` intent with park-bridge-close arcs. THREADING dissolves into common + bridge templates. Mirrors load contextually by intent × observation. Cleanup: rename `amplify` → `close`, remove dead modules.
**FRs covered:** FR2, FR8, FR9, FR11 (completion), FR12
**Depends on:** Epic 1

## Epic 1: Desire-Framed Steering System

Nerin follows territory assignments through desire framing and intent × observation skeleton templates. The 4-tier prompt collapses to 2 layers (common identity + per-turn steering). Depth becomes steering-controlled, observation focus drives response shape, and territory is framed as Nerin's own curiosity.

### Story 1.1: Territory Catalog Enrichment

As a assessment user,
I want Nerin's territory assignments to carry human-readable curiosity descriptions,
so that the steering system can frame territories as Nerin's desire rather than clinical labels.

**Acceptance Criteria:**

**Given** the territory catalog has 25 territories
**When** the catalog is loaded
**Then** each territory has a `name` field (e.g., "Daily Routines") and a `description` field written as Nerin's curiosity (e.g., "how they structure their time and what they protect in it")
**And** the territory type definition includes `name: string` and `description: string`
**And** all 25 territories are populated with descriptions from the brainstorming session
**And** existing tests continue to pass

### Story 1.2: Common Layer Reform

As a assessment user,
I want Nerin's always-on instincts to not compete with territory steering,
so that the steering pipeline's territory assignments can actually influence Nerin's behavior.

**Acceptance Criteria:**

**Given** CONVERSATION_INSTINCTS contains "When someone is opening up, you go deeper"
**When** the common layer is reformed
**Then** the unconditional depth instinct is removed (only "When guarded, you change angle" remains)
**And** REFLECT and STORY_PULLING are moved to common layer (loaded on every turn regardless of intent)
**And** OBSERVATION_QUALITY is dissolved — "name it and hand it back" and "go beyond their framework" move to common, observation-specific content moves to templates (Story 1.3)
**And** the common layer includes the merged threading instinct: "You reference earlier parts of the conversation — you're always tracking threads"
**And** existing prompt builder tests are updated to reflect the new module locations
**And** no behavioral change occurs yet — modules are reorganized but prompt output is equivalent

### Story 1.3: Intent × Observation Templates and Pressure Modifiers

As a assessment user,
I want each turn's response shape to be determined by the steering pipeline's intent and observation focus,
so that Nerin's responses vary meaningfully based on what the pipeline detects.

**Acceptance Criteria:**

**Given** the steering pipeline outputs intent (`open`, `explore`, `amplify`) and observation focus (`relate`, `noticing`, `contradiction`, `convergence`)
**When** templates are created
**Then** 9 intent × observation templates exist: open×relate (1), explore×relate/noticing/contradiction/convergence (4), amplify×relate/noticing/contradiction/convergence (4)
**And** each template is a prose instruction in Nerin's voice with parameter slots (`{territory.name}`, `{territory.description}`, `{facet}`, `{domain}`, `{domain1}`, `{domain2}`, `{domains}`)
**And** 3 pressure modifiers exist (`direct`, `angled`, `soft`) applicable to `explore` intent
**And** the steering prefix "What's caught your attention this turn:" is defined
**And** observation parameter signatures match the brainstorming spec: relate (none), noticing (domain), contradiction (facet, domain1, domain2), convergence (facet, domains[])
**And** templates are exported as constants from `packages/domain/src/constants/nerin/`
**And** unit tests verify each template renders correctly with sample parameters

### Story 1.4: Prompt Builder Skeleton Swap

As a assessment user,
I want Nerin to follow territory assignments via desire framing and skeleton-based prompt composition,
so that assessment sessions achieve territory coverage across multiple life domains.

**Acceptance Criteria:**

**Given** templates and pressure modifiers from Story 1.3 and common layer from Story 1.2
**When** the prompt builder composes the system prompt
**Then** the 4-tier system is replaced with 2 layers: common (stable) + steering (per-turn)
**And** steering section is positioned immediately after persona (position 2, not last)
**And** steering section uses "What's caught your attention this turn:" prefix
**And** the appropriate intent × observation template is selected based on `PromptBuilderInput`
**And** entry pressure modifier is appended for `explore` intent
**And** territory `name` and `description` from catalog are interpolated into template parameter slots
**And** `selectTier2Modules()` is replaced — no more dynamic tier selection; common modules are always loaded, steering template is always loaded
**And** EXPLORE_RESPONSE_FORMAT static constant is removed (replaced by skeleton templates)
**And** all prompt builder tests are updated to verify new 2-layer structure
**And** prompt output for `open` and `amplify` intents also uses the new skeleton system

## Epic 2: Bridge Transitions & Contextual Mirrors

Territory transitions get a dedicated `bridge` intent with park-bridge-close arcs. THREADING dissolves into common + bridge templates. Mirrors load contextually by intent × observation. Cleanup: rename `amplify` → `close`, remove dead modules. Depends on Epic 1.

### Story 2.1: Bridge Intent and Governor Integration

As a assessment user,
I want territory transitions to be recognized as a distinct conversational moment,
so that Nerin can bridge between territories naturally instead of jumping abruptly.

**Acceptance Criteria:**

**Given** `PromptBuilderInput` has intents `open`, `explore`, `amplify`
**When** the bridge intent is added
**Then** `PromptBuilderInput` type includes a `bridge` intent variant with `previousTerritory: TerritoryId` field
**And** the governor emits `intent: "bridge"` when `selectedTerritory !== previousTerritory` AND `turnNumber > 0` AND NOT `isFinalTurn`
**And** `previousTerritory` is derived from the most recent exchange record
**And** when `selectedTerritory === previousTerritory`, the governor emits `explore` as before
**And** governor unit tests verify bridge emission on territory change and explore emission on same territory
**And** existing pipeline behavior is unchanged until prompt builder handles bridge (Story 2.2)

### Story 2.2: Bridge Templates and THREADING Dissolution

As a assessment user,
I want territory transitions to feel like Nerin's curiosity naturally shifting,
so that topic changes don't feel abrupt or mechanical.

**Acceptance Criteria:**

**Given** the governor emits `bridge` intent with `previousTerritory` (Story 2.1)
**When** Nerin receives a bridge turn
**Then** 4 bridge × observation templates exist (bridge×relate, bridge×noticing, bridge×contradiction, bridge×convergence)
**And** bridge×relate uses the 3-tier fallback: (1) find a connection between territories, (2) flag and leave ("there's something there, we'll come back to it"), (3) clean jump ("I have a good read on this, now I'm curious about something different")
**And** bridge templates reference both `{previousTerritory.name}` and `{newTerritory.name}` / `{newTerritory.description}`
**And** a soft negative constraint is included: "You've been exploring {previousTerritory.name} — your curiosity has moved. Don't pull the conversation back there."
**And** pressure modifiers apply to bridge intent (same as explore)
**And** THREADING module is dissolved: "connect threads" skill merged into common (Story 1.2), "flag and leave" and "park and pick" absorbed into bridge×relate template
**And** prompt builder handles `case "bridge"` — selects bridge template + common modules
**And** unit tests verify bridge template selection and parameter interpolation
**And** total template count is now 13 (open×1 + explore×4 + bridge×4 + amplify×4)

### Story 2.3: Contextual Mirror System

As a assessment user,
I want Nerin's ocean mirrors to be contextually relevant to the current intent and observation,
so that mirrors reinforce the steering direction rather than being randomly available.

**Acceptance Criteria:**

**Given** mirrors are currently loaded via MIRRORS_EXPLORE and MIRRORS_AMPLIFY modules
**When** the contextual mirror system is implemented
**Then** a mirror lookup table exists keyed by `intent × observation` (from brainstorming spec)
**And** open intent loads no mirrors
**And** explore intent loads observation-specific mirrors (e.g., noticing → Hermit Crab, Volcanic Vents, Bioluminescence, Tide Pool)
**And** bridge intent loads observation-specific mirrors (subset of explore mirrors)
**And** close (amplify) intent loads all-observation mirrors (Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola)
**And** each mirror set includes the guardrail: "You can discover new mirrors in the moment — but the biology must be real"
**And** MIRRORS_EXPLORE and MIRRORS_AMPLIFY modules are deleted
**And** prompt builder loads mirrors from lookup table instead of selecting mirror modules
**And** unit tests verify correct mirror sets per intent × observation combination

### Story 2.4: Rename Amplify to Close and Final Cleanup

As a developer,
I want the codebase to use consistent terminology matching the brainstorming architecture,
so that the intent naming is clear and the codebase has no dead modules.

**Acceptance Criteria:**

**Given** the intent `amplify` exists throughout the codebase
**When** the rename is applied
**Then** `amplify` is renamed to `close` in: `PromptBuilderInput` type, governor intent derivation, prompt builder case handling, all templates, all tests
**And** EXPLORE_RESPONSE_FORMAT is confirmed deleted (should be gone from Story 1.4)
**And** OBSERVATION_QUALITY module file is deleted (content dissolved in Story 1.2)
**And** THREADING module file is deleted (content dissolved in Stories 1.2 + 2.2)
**And** MIRRORS_EXPLORE and MIRRORS_AMPLIFY module files are deleted (replaced in Story 2.3)
**And** all prompt builder tests pass with the new naming
**And** no dead imports or unused exports remain in `packages/domain/src/constants/nerin/`
