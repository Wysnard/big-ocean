# Story 40-2: Update Domain Definitions and Assignment Guidance

Status: ready-for-dev

## Story

As a **system operator**,
I want the domain definitions updated so leisure absorbs solo's introspective aspects and education maps to work,
So that the extraction pipeline assigns evidence to the correct domain without ambiguity.

## Acceptance Criteria

1. **Given** the current domain definitions include solo for introspective/alone-time activities
   **When** the domain definitions are updated in the domain package (life-domain.ts)
   **Then** leisure's definition includes: "alone-time hobbies, introspection, daydreaming"
   **And** health's definition includes: "Exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management"
   **And** work's definition explicitly includes: "education, studying"
   **And** other's definition includes guidance: "ONLY when truly doesn't fit above. Target <5%"
   **And** solo is no longer listed in domain definitions

2. **Given** ConversAnalyzer's extraction prompt references domain definitions
   **When** the domain definitions text used in prompts is updated
   **Then** the prompt text matches the new domain list and definitions exactly

## Tasks / Subtasks

- [ ] Task 1: Add LIFE_DOMAIN_DEFINITIONS constant to life-domain.ts (AC: #1)
  - [ ] 1.1: Create a `LIFE_DOMAIN_DEFINITIONS` record mapping each domain to its description string in `packages/domain/src/constants/life-domain.ts`
  - [ ] 1.2: Definitions must match scoring-confidence-v2-spec exactly:
    - work: "Professional activities, career, job tasks, education, studying, colleagues, workplace dynamics"
    - relationships: "Romantic partners, close friendships, social connections"
    - family: "Parents, siblings, children, extended family, household dynamics"
    - leisure: "Hobbies, entertainment, sports, travel, group activities, alone-time hobbies, introspection, daydreaming"
    - health: "Exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management"
    - other: "ONLY when truly doesn't fit above. Target <5%"
  - [ ] 1.3: Solo must NOT have a definition entry (solo still exists in LIFE_DOMAINS from story 40-1, but gets no definition — it's deprecated)
  - [ ] 1.4: Export from `packages/domain/src/index.ts` barrel

- [ ] Task 2: Update ConversAnalyzer prompt to use new domain definitions (AC: #2)
  - [ ] 2.1: Update the Life Domains section in `buildV2Prompt` in `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` to use `LIFE_DOMAIN_DEFINITIONS` from domain package
  - [ ] 2.2: The prompt must list exactly the 6 active domains (work, relationships, family, leisure, health, other) with their definitions — no solo
  - [ ] 2.3: Include domain assignment guidance: work includes education, leisure includes introspection, other target <5%

- [ ] Task 3: Write unit tests (AC: #1, #2)
  - [ ] 3.1: Test that LIFE_DOMAIN_DEFINITIONS has entries for exactly 6 domains (work, relationships, family, leisure, health, other)
  - [ ] 3.2: Test that LIFE_DOMAIN_DEFINITIONS does NOT have a "solo" entry
  - [ ] 3.3: Test that leisure definition contains "introspection" and "daydreaming"
  - [ ] 3.4: Test that health definition contains "Exercise" and "stress management"
  - [ ] 3.5: Test that work definition contains "education" and "studying"
  - [ ] 3.6: Test that other definition contains "Target <5%"
  - [ ] 3.7: Update prompt content tests to verify new domain definitions appear in the prompt (no solo in prompt)
  - [ ] 3.8: Update prompt test fixture `domainDistribution` to include `health` key

## Dev Notes

- The domain definitions are currently hardcoded inline in `buildV2Prompt()` in `conversanalyzer.anthropic.repository.ts`. This story extracts them into a reusable constant and updates both places.
- Story 40-1 added `health` to `LIFE_DOMAINS` but kept `solo` (removal deferred to Story 1.3). Domain definitions should NOT include solo even though the constant still lists it.
- The `LIFE_DOMAIN_DEFINITIONS` type should use `Exclude<LifeDomain, "solo">` to ensure solo is excluded from definitions at the type level.
