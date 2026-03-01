# Story 17.2: Micro-Intent Realizer

Status: ready-for-dev

## Story

As a user in conversation with Nerin,
I want the conversation to flow naturally with varied questioning styles,
So that it feels like a genuine dialogue, not an exam.

## Acceptance Criteria

1. **Given** `computeSteeringTarget()` has selected a `targetFacet` and `targetDomain`
   **When** `realizeMicroIntent()` is called with `{ targetFacet, targetDomain, previousDomain, domainStreak, turnIndex, nearingEnd, recentIntentTypes }`
   **Then** it returns a `MicroIntent` with `intent` (one of: `story_pull`, `tradeoff_probe`, `contradiction_surface`, `domain_shift`, `depth_push`), `domain`, optional `bridgeHint`, optional `questionStyle`

2. **Given** the last 2 intent types were both `tradeoff_probe`
   **When** `realizeMicroIntent()` selects the next intent
   **Then** it avoids a 3rd probe in a row (guardrail: max 2 consecutive probes)

3. **Given** a `MicroIntent` is produced
   **When** `buildChatSystemPrompt()` builds Nerin's system prompt
   **Then** the steering section uses the structured `MicroIntent` format (intent, domain, bridge, question style) -- not raw "Explore {facet} through {domain}"

4. **Given** an assistant message is saved to `assessment_messages`
   **When** the message is persisted
   **Then** the `intentType` column is populated with the micro-intent type used

## Tasks / Subtasks

- [ ] Task 1: Create `realizeMicroIntent()` pure function (AC: #1, #2)
  - [ ] 1.1: Create `packages/domain/src/utils/steering/realize-micro-intent.ts` with types `IntentType`, `MicroIntent`, `RealizeMicroIntentInput`
  - [ ] 1.2: Implement intent selection logic: `domain_shift` when `targetDomain !== previousDomain`, `depth_push` when `domainStreak >= 3`, `story_pull` as default early-conversation intent, `tradeoff_probe` and `contradiction_surface` for variety
  - [ ] 1.3: Implement guardrail: if last 2 `recentIntentTypes` are both `tradeoff_probe`, select alternative intent
  - [ ] 1.4: Add optional `bridgeHint` (`map_same_theme`, `confirm_scope`, `contrast_domains`) when domain shifts
  - [ ] 1.5: Add optional `questionStyle` (`open` or `choice`) -- alternate based on turnIndex
  - [ ] 1.6: Export from `packages/domain/src/utils/steering/index.ts` and barrel exports (`utils/index.ts`, `domain/src/index.ts`)

- [ ] Task 2: Write unit tests for `realizeMicroIntent()` (AC: #1, #2)
  - [ ] 2.1: Create `packages/domain/src/utils/steering/__tests__/realize-micro-intent.test.ts`
  - [ ] 2.2: Test: returns `domain_shift` when `targetDomain !== previousDomain`
  - [ ] 2.3: Test: returns `depth_push` when `domainStreak >= 3` and same domain
  - [ ] 2.4: Test: avoids 3rd consecutive `tradeoff_probe` (guardrail)
  - [ ] 2.5: Test: returns `story_pull` for early turns (turnIndex < 6)
  - [ ] 2.6: Test: includes `bridgeHint` on domain shifts
  - [ ] 2.7: Test: `nearingEnd` returns `depth_push` intent

- [ ] Task 3: Update `buildChatSystemPrompt()` for MicroIntent (AC: #3)
  - [ ] 3.1: Update `ChatSystemPromptParams` interface to accept optional `MicroIntent` instead of raw `targetDomain`/`targetFacet`
  - [ ] 3.2: When `MicroIntent` is provided, generate a structured steering section with intent type, domain, bridge hint, question style, and facet definition
  - [ ] 3.3: Keep backward compatibility: if no `MicroIntent` but `targetDomain`/`targetFacet` provided, use existing raw steering format
  - [ ] 3.4: Update existing nerin-system-prompt tests to cover new MicroIntent path

- [ ] Task 4: Add `intentType` column to `assessment_messages` (AC: #4)
  - [ ] 4.1: Add `intent_type` text column to `assessment_message` table in DB schema (`packages/infrastructure/src/db/drizzle/schema.ts`)
  - [ ] 4.2: Update `AssessmentAssistantMessageEntitySchema` to include optional `intentType` field
  - [ ] 4.3: Update `saveMessage` in repository interface to accept optional `intentType` parameter
  - [ ] 4.4: Update `assessment-message.drizzle.repository.ts` to persist `intentType`
  - [ ] 4.5: Update mock repository to handle `intentType`

- [ ] Task 5: Integrate into `send-message.use-case.ts` (AC: #1, #3, #4)
  - [ ] 5.1: After `computeSteeringTarget()`, call `realizeMicroIntent()` with computed context
  - [ ] 5.2: Extract `recentIntentTypes` from last 3 assistant messages in `previousMessages`
  - [ ] 5.3: Pass `MicroIntent` to `buildChatSystemPrompt()` (via nerin invoke)
  - [ ] 5.4: Pass `intentType` to `saveMessage()` for assistant messages
  - [ ] 5.5: Log `intentType` in steering computed log

- [ ] Task 6: Update Nerin agent to pass MicroIntent through (AC: #3)
  - [ ] 6.1: Update `NerinInvokeInput` to include optional `microIntent` field
  - [ ] 6.2: Update `nerin-agent.anthropic.repository.ts` to pass `microIntent` to `buildChatSystemPrompt()`
  - [ ] 6.3: Update nerin agent mock to accept new field

## Parallelism

- **Blocked by:** 17-1-all-30-facets-steering (merged), 17-3-domain-streak-computation (PR #101, to be included)
- **Blocks:** none

## Dependencies

- `computeDomainStreak()` from Story 17-3 (branch: `feat/story-17-3-domain-streak-computation-and-conversanalyzer-retry-bump`)
- `computeSteeringTarget()` from `packages/domain/src/utils/formula.ts`
- `buildChatSystemPrompt()` from `packages/domain/src/utils/nerin-system-prompt.ts`
