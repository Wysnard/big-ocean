# Story 36-2: Extended Conversation Pipeline Initialization

**Status:** ready-for-dev

## Story

As a user,
I want my extended conversation to feel like a natural continuation,
So that Nerin builds on what we already explored together.

**Epic:** 7 — Conversation Extension
**Depends on:** Story 36-1 (Conversation Extension Purchase & Session Creation)

## Acceptance Criteria

1. **Given** a new extension session is created, **When** the pacing pipeline initializes, **Then** the session starts at exchange 1 of 25 (fresh 25-exchange arc) **And** the prior session's final user state is loaded: smoothed energy, comfort, drain, drain ceiling (FR25).

2. **Given** Nerin's prompts are constructed for the extension session, **When** the Common prompt layer references prior context, **Then** Nerin references "themes and patterns" from prior evidence **And** Nerin does NOT reference specific exchanges or quote the user's prior words.

3. **Given** the territory scorer runs in the extension session, **When** coverage gaps are computed, **Then** evidence from both the original and extension sessions contributes to coverage **And** the scorer naturally steers toward under-explored territories.

## Tasks

### Task 1: Load Prior Session State for E_target Initialization

- **1a:** Add `getParentSessionId` helper to resolve the parent session ID from an extension session entity.
- **1b:** In `nerin-pipeline.ts`, detect when the current session is an extension session (has `parentSessionId`).
- **1c:** When the extension session has no prior exchanges yet (turn 1), load the parent session's final exchange to seed `priorSmoothedEnergy` and `priorComfort` for `computeETargetV2`.
- **1d:** Write unit tests verifying that E_target on the first turn of an extension session uses the parent's final state rather than defaults.

### Task 2: Merge Evidence from Parent + Extension Sessions for Coverage

- **2a:** In `nerin-pipeline.ts`, when the session is an extension session, load evidence from both the parent session and the current extension session.
- **2b:** The merged evidence feeds into `computeFacetMetrics` so the territory scorer sees combined coverage.
- **2c:** Write unit tests verifying that the territory scorer receives merged evidence from both sessions and steers toward under-explored territories.

### Task 3: Merge Visit History from Parent Session

- **3a:** When the session is an extension session and has no prior exchanges, load the parent session's exchange records to build the initial visit history.
- **3b:** The combined visit history feeds into the freshness penalty computation, ensuring recently-visited territories from the parent session are penalized appropriately.
- **3c:** Write unit tests verifying that visit history from the parent session influences territory scoring in the extension session.

### Task 4: Prompt Builder Extension Context

- **4a:** Create a `buildExtensionContext` pure function in `packages/domain/src/utils/steering/` that takes parent session evidence and produces a summary of "themes and patterns" (territory names visited, dominant facets observed) without referencing specific user quotes.
- **4b:** Integrate the extension context into the prompt builder so it is included in the Common prompt layer when an extension session is active.
- **4c:** Write unit tests verifying the extension context output contains territory/theme references but no user quotes.

### Task 5: Integration — Wire Extension Pipeline in nerin-pipeline.ts

- **5a:** Wire Tasks 1-4 together in `nerin-pipeline.ts`: detect extension session, load parent state, merge evidence, merge visit history, and pass extension context to prompt builder.
- **5b:** Ensure the pipeline falls back gracefully if the parent session data is missing (e.g., parent was deleted).
- **5c:** Write integration-style unit tests exercising the full pipeline with an extension session mock.
