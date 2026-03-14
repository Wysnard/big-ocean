# Story 28-3: Intent x Observation Templates and Pressure Modifiers

**Status:** ready-for-dev

**Epic:** Epic 1 — Desire-Framed Steering System
**Story:** 1.3

## User Story

As an assessment user,
I want each turn's response shape to be determined by the steering pipeline's intent and observation focus,
so that Nerin's responses vary meaningfully based on what the pipeline detects.

## Acceptance Criteria

**Given** the steering pipeline outputs intent (`open`, `explore`, `amplify`) and observation focus (`relate`, `noticing`, `contradiction`, `convergence`)
**When** templates are created
**Then:**

1. 9 intent x observation templates exist: open x relate (1), explore x relate/noticing/contradiction/convergence (4), amplify x relate/noticing/contradiction/convergence (4)
2. Each template is a prose instruction in Nerin's voice with parameter slots (`{territory.name}`, `{territory.description}`, `{facet}`, `{domain}`, `{domain1}`, `{domain2}`, `{domains}`)
3. 3 pressure modifiers exist (`direct`, `angled`, `soft`) applicable to `explore` intent
4. The steering prefix "What's caught your attention this turn:" is defined
5. Observation parameter signatures match the brainstorming spec: relate (none), noticing (domain), contradiction (facet, domain1, domain2), convergence (facet, domains[])
6. Templates are exported as constants from `packages/domain/src/constants/nerin/`
7. Unit tests verify each template renders correctly with sample parameters

## Tasks

### Task 1: Create intent x observation template constants

**File:** `packages/domain/src/constants/nerin/steering-templates.ts`

Create 9 intent x observation template string constants:

- `OPEN_RELATE_TEMPLATE` — "This is your first question. You're curious about {territory.name} — {territory.description}."
- `EXPLORE_RELATE_TEMPLATE` — "Connect naturally to what they just shared. Your curiosity is on {territory.name} — {territory.description}."
- `EXPLORE_NOTICING_TEMPLATE` — "Something is shifting in how they talk about {domain}. That shift points toward {territory.description} — follow it."
- `EXPLORE_CONTRADICTION_TEMPLATE` — "{facet} shows up differently in {domain1} vs {domain2}. That tension has something to do with {territory.description} — explore it."
- `EXPLORE_CONVERGENCE_TEMPLATE` — "{facet} keeps showing up across {domains}. That pattern connects to {territory.description} — go deeper."
- `AMPLIFY_RELATE_TEMPLATE` — "This is your last question. Connect to what they just shared and land it — something that lets them leave with a feeling, not a thread to chase."
- `AMPLIFY_NOTICING_TEMPLATE` — "This is your last question. Something has been shifting in how they talk about {domain}. Name it — give them something to sit with."
- `AMPLIFY_CONTRADICTION_TEMPLATE` — "This is your last question. {facet} shows up differently in {domain1} vs {domain2}. Frame that tension as something worth holding — not to resolve, to notice."
- `AMPLIFY_CONVERGENCE_TEMPLATE` — "This is your last question. {facet} has shown up consistently across {domains}. Name that pattern — it says something core about who they are."

Also export the steering prefix constant:
- `STEERING_PREFIX` — "What's caught your attention this turn:"

### Task 2: Create pressure modifier constants

**File:** `packages/domain/src/constants/nerin/pressure-modifiers.ts`

Create 3 pressure modifier string constants:

- `PRESSURE_DIRECT` — "Go straight there."
- `PRESSURE_ANGLED` — "Find a thread from what they've shared that bends toward it. If they're guarded, come at it from a different direction. If you see something interesting but it's not where your curiosity is pointing — flag it and leave it."
- `PRESSURE_SOFT` — "Only if the conversation opens toward it naturally. If not, stay where you are. If you see a thread worth holding, name it — \"there's something there, we'll come back to it.\""

Export a lookup function `getPressureModifier(pressure: EntryPressure): string`.

### Task 3: Create template rendering utility

**File:** `packages/domain/src/constants/nerin/steering-templates.ts` (same file as Task 1)

Create a `renderTemplate` function that:
- Takes a template string and a parameters record
- Replaces `{key}` placeholders with values from the record
- Returns the rendered string

Create a `renderSteeringTemplate` function that:
- Takes `intent` and `ObservationFocus` and territory (`{ name: string; description: string }`)
- Selects the correct template based on intent x observation type
- Extracts parameters from the ObservationFocus discriminated union
- Calls `renderTemplate` with the correct parameters
- Returns the rendered template string

### Task 4: Export from nerin index and domain index

**File:** `packages/domain/src/constants/nerin/index.ts`

Add exports for all new template constants, the steering prefix, pressure modifier constants, and the rendering functions.

**File:** `packages/domain/src/index.ts`

Add exports for the public API surface.

### Task 5: Write unit tests

**File:** `packages/domain/src/constants/nerin/__tests__/steering-templates.test.ts`

Tests to write:
1. Each of the 9 templates renders correctly with sample parameters
2. `renderSteeringTemplate` selects the correct template for each intent x observation combination
3. All parameter slots are replaced (no `{...}` remains in output)
4. Observation parameter signatures match spec: relate (no domain/facet params), noticing (domain), contradiction (facet, domain1, domain2), convergence (facet, domains)
5. `STEERING_PREFIX` is the correct string

**File:** `packages/domain/src/constants/nerin/__tests__/pressure-modifiers.test.ts`

Tests to write:
1. Each pressure modifier returns the correct string
2. `getPressureModifier` returns correct modifier for each EntryPressure value

## Technical Guidance

- Templates are pure string constants — no Effect dependencies
- Parameter rendering is a simple string replacement function
- Follow the existing pattern in `packages/domain/src/constants/nerin/` for module organization
- Use the `ObservationFocus` discriminated union from `packages/domain/src/types/pacing.ts` for type-safe parameter extraction
- Use `EntryPressure` type from `packages/domain/src/types/pacing.ts` for pressure modifiers
- Territory type from `packages/domain/src/types/territory.ts` already has `name` and `description` fields (added in Story 28-1)
- These templates will be consumed by the Prompt Builder in Story 1.4 — they are not wired into the prompt builder in this story
