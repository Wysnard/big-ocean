# Story 29-2: Bridge Templates and THREADING Dissolution

**Status:** ready-for-dev

**Epic:** Epic 2 — Bridge Transitions & Contextual Mirrors
**Story:** 2.2

## User Story

As an assessment user,
I want territory transitions to feel like Nerin's curiosity naturally shifting,
so that topic changes don't feel abrupt or mechanical.

## Acceptance Criteria

**Given** the governor emits `bridge` intent with `previousTerritory` (Story 2.1 / 29-1)
**When** Nerin receives a bridge turn
**Then:**

1. 4 bridge x observation templates exist (bridge x relate, bridge x noticing, bridge x contradiction, bridge x convergence)
2. bridge x relate uses the 3-tier fallback: (1) find a connection between territories, (2) flag and leave ("there's something there, we'll come back to it"), (3) clean jump ("I have a good read on this, now I'm curious about something different")
3. Bridge templates reference both `{previousTerritory.name}` and `{newTerritory.name}` / `{newTerritory.description}`
4. A soft negative constraint is included: "You've been exploring {previousTerritory.name} — your curiosity has moved. Don't pull the conversation back there."
5. Pressure modifiers apply to bridge intent (same as explore)
6. THREADING module is dissolved: "connect threads" skill merged into common (done in Story 28-2), "flag and leave" and "park and pick" absorbed into bridge x relate template
7. Prompt builder handles `case "bridge"` — selects bridge template + common modules (replaces explore fallback from Story 29-1)
8. Unit tests verify bridge template selection and parameter interpolation
9. Total template count is now 13 (open x 1 + explore x 4 + bridge x 4 + amplify x 4)

## Tasks

### Task 1: Create 4 bridge x observation templates

**File:** `packages/domain/src/constants/nerin/steering-templates.ts`

Add 4 bridge templates from the brainstorming spec:

- `BRIDGE_RELATE_TEMPLATE` — 3-tier fallback: (1) find a thread connecting previousTerritory and newTerritory, (2) flag and leave with "there's something there, we'll come back to it", (3) clean jump with "I have a good read on {previousTerritory.name}"
- `BRIDGE_NOTICING_TEMPLATE` — domain shift pulling from previousTerritory toward newTerritory
- `BRIDGE_CONTRADICTION_TEMPLATE` — facet tension pulling from previousTerritory toward newTerritory
- `BRIDGE_CONVERGENCE_TEMPLATE` — facet pattern spanning from previousTerritory toward newTerritory

All bridge templates use `{previousTerritory.name}`, `{newTerritory.name}`, and `{newTerritory.description}` parameter slots.

### Task 2: Add soft negative constraint for bridge intent

**File:** `packages/domain/src/constants/nerin/steering-templates.ts`

Create `BRIDGE_NEGATIVE_CONSTRAINT` constant:
"You've been exploring {previousTerritory.name} — your curiosity has moved. Don't pull the conversation back there."

This is appended to all bridge templates during rendering.

### Task 3: Add bridge entries to TEMPLATE_LOOKUP and update renderSteeringTemplate

**File:** `packages/domain/src/constants/nerin/steering-templates.ts`

- Add `bridge:relate`, `bridge:noticing`, `bridge:contradiction`, `bridge:convergence` entries to `TEMPLATE_LOOKUP`
- Update `renderSteeringTemplate` signature to accept `"bridge"` as an intent (currently only accepts `"open" | "explore" | "amplify"`)
- Update `extractParams` to handle bridge-specific parameters: `previousTerritory.name`, `newTerritory.name`, `newTerritory.description`
- The `territory` parameter for bridge templates contains the **new** territory data. A new `previousTerritory` parameter is needed for bridge rendering.

### Task 4: Update prompt builder to use bridge templates (replace explore fallback)

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

- Remove the `templateIntent` fallback that maps bridge to explore (from Story 29-1)
- Pass `"bridge"` directly to `renderSteeringTemplate`
- For bridge intent, look up both the new territory and the previous territory from the catalog
- Pass both territories to `renderSteeringTemplate` for bridge parameter interpolation
- Append soft negative constraint after the rendered bridge template
- Pressure modifiers still apply to bridge (already handled from Story 29-1)

### Task 5: Update nerin constants index exports

**File:** `packages/domain/src/constants/nerin/index.ts`

Export the 4 new bridge template constants and `BRIDGE_NEGATIVE_CONSTRAINT` from the index.

### Task 6: Write bridge template unit tests

**File:** `packages/domain/src/constants/nerin/__tests__/steering-templates.test.ts`

Add tests:
1. All 4 bridge templates are non-empty strings
2. Bridge templates have correct parameter slots (`previousTerritory.name`, `newTerritory.name`, `newTerritory.description`)
3. `renderSteeringTemplate("bridge", ...)` renders bridge x relate with both territory params
4. `renderSteeringTemplate("bridge", ...)` renders bridge x noticing with domain + both territory params
5. `renderSteeringTemplate("bridge", ...)` renders bridge x contradiction with facet, domains + both territory params
6. `renderSteeringTemplate("bridge", ...)` renders bridge x convergence with facet, domains + both territory params
7. No unresolved `{...}` placeholders in any rendered bridge template
8. Total template count in TEMPLATE_LOOKUP is 13

### Task 7: Write prompt builder bridge integration tests

**File:** `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`

Add tests:
1. Bridge intent uses bridge-specific template (not explore fallback)
2. Bridge intent includes soft negative constraint with previousTerritory name
3. Bridge intent includes both territory names in output
4. Bridge intent appends pressure modifier (direct, angled, soft)
5. Bridge intent has templateKey `bridge:relate`, `bridge:noticing`, etc.
6. Bridge intent includes all common modules
7. Bridge intent with invalid previousTerritory throws descriptive error

## Technical Guidance

- Bridge templates come from the brainstorming spec (Phase 2: Persona Journey section)
- The `extractParams` function needs a new code path for bridge that receives both `territory` (new) and `previousTerritory` objects
- `renderSteeringTemplate` needs a new overload or optional parameter for `previousTerritory`
- The soft negative constraint uses `renderTemplate` to interpolate `{previousTerritory.name}`
- THREADING module (`threading.ts`) content is now fully absorbed: "connect threads" in `threading-common.ts` (Story 28-2), "flag and leave" + "park and pick" in `BRIDGE_RELATE_TEMPLATE` (this story)
- The `threading.ts` file is NOT deleted in this story — deletion happens in Story 2.4 (final cleanup)
