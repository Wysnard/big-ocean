# Story 4.7: Message-Count Progress Indicator (Replace Confidence-Based Progress)

Status: ready-for-dev

## Story

As a **User**,
I want **to see my assessment progress based on how many messages I've exchanged**,
So that **I know how close I am to seeing my results without waiting for background analysis**.

## Background & Context

**Origin:** Party Mode architecture session (2026-02-14). Companion to Story 2.11 (Async Analyzer).

**Problem:** The current progress indicator relies on `confidence` scores (5 trait values, 0-100) returned in the send-message response. Story 2.11 removes confidence from this response to enable async analysis. The frontend needs an alternative progress signal.

**Solution (MVP):** Message count as a reliable proxy. Assessments typically reach 70%+ confidence at ~15-20 messages. Phase 2 will replace this with ElectricSQL-powered live confidence updates.

**Design Decisions:**
1. **Message count as progress proxy** — Simple, no API dependency, deterministic. User messages counted client-side from the `messages` array.
2. **Keep confidence in resume endpoint** — Returning users with existing evidence still see accurate progress on load.
3. **Phase 2: ElectricSQL live sync** — Deferred until ElectricSQL implementation.

## Acceptance Criteria

### AC-1: Remove Confidence Consumption from send-message

**Given** a send-message response arrives
**When** the `onSuccess` callback executes
**Then** it does NOT read or set `confidence` (field no longer exists)
**And** it only extracts `data.response` for the assistant message

### AC-2: Message-Count Progress Indicator

**Given** the user is in an active assessment
**When** they have exchanged N user messages
**Then** the progress indicator shows progress based on user message count
**And** thresholds are:
  - 1-5 messages: "Getting to know you..." (~15-30%)
  - 6-10 messages: "Building your profile..." (~35-60%)
  - 11-15 messages: "Refining your personality map..." (~65-85%)
  - 16+ messages: "Almost ready for results!" (~90-100%)
**And** the progress value increases monotonically (never decreases)

### AC-3: Celebration Trigger (Message Count)

**Given** the user has sent 15+ messages (configurable threshold)
**When** the progress check runs
**Then** `isConfidenceReady` becomes true
**And** the celebration card appears ("Your Personality Profile is Ready!")
**And** the "View Results" header link appears
**And** behavior is identical to current confidence-based trigger

### AC-4: Resume Session Retains Confidence

**Given** a user resumes an existing session
**When** the resume endpoint returns
**Then** confidence scores are still loaded from resume response
**And** if resume confidence >= 70%, celebration triggers immediately
**And** if resume confidence < 70%, message-count progress takes over

### AC-5: Remove TraitScores State (Cleanup)

**Given** the `useTherapistChat` hook
**When** the `traits` state is evaluated
**Then** the `TraitScores` interface is simplified or removed
**And** the duplicate `{trait}Confidence` fields are cleaned up
**And** `avgConfidence` calculation uses resume data OR message count

## Tasks / Subtasks

- [ ] **Task 1: Update `SendMessageResponseSchema` contract** (AC: 1)
  - [ ] Remove `confidence` field from `SendMessageResponseSchema` in `packages/contracts/src/http/groups/assessment.ts:52-61`
  - [ ] Update `SendMessageResponse` type export (auto-inferred from schema)
  - [ ] Verify `ResumeSessionResponseSchema` still has `confidence` (keep it)
  - [ ] Update backend handler `apps/api/src/handlers/assessment.ts` to stop returning confidence on send-message
  - [ ] Update `send-message.use-case.ts` to return only `{ response: string }` (remove trait confidence computation from synchronous path)
- [ ] **Task 2: Refactor `useTherapistChat` hook — message-count progress** (AC: 1, 2, 3, 4, 5)
  - [ ] Remove `data.confidence` consumption from `onSuccess` callback (lines 247-272)
  - [ ] Add `MESSAGE_READY_THRESHOLD = 15` constant
  - [ ] Compute `userMessageCount` from `messages.filter(m => m.role === "user").length`
  - [ ] Compute `progressPercent = Math.min(Math.round((userMessageCount / MESSAGE_READY_THRESHOLD) * 100), 100)`
  - [ ] Replace `isConfidenceReady` with message-count logic: `userMessageCount >= MESSAGE_READY_THRESHOLD`
  - [ ] Keep resume confidence loading (lines 137-155) — if resume `avgConfidence >= 70`, set `isConfidenceReady = true` immediately
  - [ ] Simplify `TraitScores` interface: remove duplicate `{trait}Confidence` fields, or replace entirely with a simpler state shape
  - [ ] Expose `progressPercent` in return value for `ProgressBar` consumption
  - [ ] Remove `traits` from return value (no longer consumed by UI for progress)
- [ ] **Task 3: Update `TherapistChat` component** (AC: 2, 3)
  - [ ] Replace `avgConfidence` with `progressPercent` for `ProgressBar` value (line 333)
  - [ ] Update `MILESTONES` thresholds from confidence % to message-count-derived progress %:
    - 25% → ~4 messages → threshold 25 (stays same since progress is 0-100)
    - 50% → ~8 messages → threshold 50
    - 70% → 15 messages → threshold 70 (maps to celebration)
  - [ ] Update milestone tracking `useEffect` to use `progressPercent` instead of `avgConfidence` (line 189)
  - [ ] Update celebration card text: change "You've reached X% confidence" to "Your assessment is complete" (line 468)
  - [ ] Update `NerinAvatar` confidence prop to use `progressPercent` instead of `avgConfidence` (lines 315, 413, 491)
  - [ ] Update `TypingIndicator` confidence prop (line 491)
  - [ ] Keep `isConfidenceReady` name for now (it's a UI-agnostic boolean, renaming is optional)
- [ ] **Task 4: Update `ProgressBar` labels** (AC: 2)
  - [ ] Update label thresholds in `ProgressBar.tsx` to match new progress mapping:
    - 0-24: "Getting to know you..."
    - 25-49: "Building your profile..."
    - 50-84: "Refining your personality map..."
    - 85-100: "Almost ready for results!"
  - [ ] ProgressBar still receives 0-100 value — no structural change needed
- [ ] **Task 5: Update tests** (AC: all)
  - [ ] Update `useTherapistChat.test.ts` — replace confidence-based assertions with message-count assertions
  - [ ] Update `TherapistChat.test.tsx` — update mock hook return values (remove `traits`, add `progressPercent`)
  - [ ] Add test: progress at 0 messages = 0%
  - [ ] Add test: progress at 8 messages = 53%
  - [ ] Add test: progress at 15 messages = 100%, `isConfidenceReady = true`
  - [ ] Add test: resume with high confidence triggers celebration immediately
  - [ ] Add test: progress never decreases (monotonic)
  - [ ] Ensure all existing tests pass with updated types

## Dev Notes

### Critical Architecture Guardrails

**Hexagonal architecture:** This story touches the **contract** layer (shared types), **frontend hooks** (presentation logic), and **frontend components** (UI). The contract change has backend implications too — the handler must stop computing and returning confidence on each message.

**Effect Schema contract:** `SendMessageResponseSchema` is defined using `@effect/schema` in `packages/contracts/src/http/groups/assessment.ts`. The exported TypeScript type `SendMessageResponse` is auto-inferred from the schema. Changing the schema automatically changes the type.

**Frontend patterns:**
- Data attributes: Use `data-slot` for structural identification, `data-testid` for test hooks per FRONTEND.md
- Tailwind v4 with semantic color tokens (`bg-background`, `text-foreground`)
- `useMemo` for derived calculations, `useEffect` for side effects
- shadcn/ui components from `@workspace/ui`

### Existing Code Analysis (Exact Line References)

**`packages/contracts/src/http/groups/assessment.ts`:**
- Lines 52-61: `SendMessageResponseSchema` — has `confidence` struct with 5 traits. **Remove the confidence field.**
- Lines 112-127: `ResumeSessionResponseSchema` — has `confidence`. **Keep this.**
- Lines 170-176: Type exports — auto-inferred, no manual change needed.

**`apps/front/src/hooks/useTherapistChat.ts`:**
- Lines 11-22: `TraitScores` interface — 10 redundant fields (5 traits + 5 confidence duplicates). **Simplify or remove.**
- Lines 90-101: `traits` state initialization — all zeros. **Remove or simplify.**
- Lines 137-155: Resume confidence loading — **Keep this path, needed for AC-4.**
- Lines 247-272: `onSuccess` callback — reads `data.confidence`, updates `traits`. **Remove confidence consumption. Only read `data.response`.**
- Lines 297-305: `avgConfidence` and `isConfidenceReady` calculation. **Replace with message-count logic.**
- Lines 307-323: Return values — `traits` exposed. **Replace with `progressPercent`.**

**`apps/front/src/components/TherapistChat.tsx`:**
- Lines 39-53: `MILESTONES` array — thresholds at 25, 50, 70 confidence %. **Keep thresholds as-is (they map to progress %).**
- Lines 174-184: `avgConfidence` computed from `traits`. **Replace with `progressPercent` from hook.**
- Lines 186-197: Milestone tracking uses `avgConfidence`. **Use `progressPercent`.**
- Lines 315, 413: `NerinAvatar confidence={avgConfidence}`. **Use `progressPercent`.**
- Lines 318-327: Header "View Your Results" link conditioned on `isConfidenceReady`. **No change needed (boolean stays).**
- Lines 333: `ProgressBar value={avgConfidence}`. **Use `progressPercent`.**
- Lines 457-488: Celebration card conditioned on `isConfidenceReady`. **No change needed (boolean stays).**
- Line 468: "You've reached X% confidence" text. **Change to "Your assessment is complete" or similar.**
- Line 491: `TypingIndicator confidence={avgConfidence}`. **Use `progressPercent`.**

**`apps/front/src/components/ProgressBar.tsx`:**
- Lines 21-27: Default labels based on `clampedValue`. **Update thresholds to match new progress semantics.**
- No structural changes — still receives 0-100 value.

**`apps/front/src/components/NerinAvatar.tsx`:**
- Lines 15-17: `confidence` prop drives tier styling (low/mid/high). **Works with `progressPercent` directly — no changes needed in component, just pass different value.**

### Message Count → Progress Mapping

```typescript
const MESSAGE_READY_THRESHOLD = 15; // Configurable

const userMessageCount = messages.filter(m => m.role === "user").length;

const progressPercent = Math.min(
  Math.round((userMessageCount / MESSAGE_READY_THRESHOLD) * 100),
  100
);

const isConfidenceReady = userMessageCount >= MESSAGE_READY_THRESHOLD;
```

### Resume Session Hybrid Logic

```typescript
// On resume: check if existing confidence is high enough
const resumeAvgConfidence = resumeData
  ? (resumeData.confidence.openness + ... + resumeData.confidence.neuroticism) / 5
  : 0;

// If resume has high confidence, trigger celebration immediately
// Otherwise, fall back to message-count progress
const isConfidenceReady =
  resumeAvgConfidence >= 70 || userMessageCount >= MESSAGE_READY_THRESHOLD;

// Progress value: use resume confidence if higher than message-count progress
const progressPercent = Math.max(
  resumeAvgConfidence,
  Math.min(Math.round((userMessageCount / MESSAGE_READY_THRESHOLD) * 100), 100)
);
```

### Backend Contract Change

The `SendMessageResponseSchema` change in `packages/contracts/` affects both frontend and backend. The backend handler in `apps/api/src/handlers/assessment.ts` currently computes trait confidence on every message and includes it in the response. After this change:

1. `send-message.use-case.ts` no longer needs to compute `traitConfidence` synchronously
2. The handler returns only `{ response: nerinResponse }`
3. This aligns with Story 2.11's architecture: analysis happens async via `Effect.forkDaemon`

**Note:** Story 2.11 is currently `backlog`. This story can be implemented independently — the backend contract change is simple (remove confidence from response) and doesn't require the full async analyzer refactor.

### Project Structure Notes

- All files follow existing monorepo structure
- Contract changes are in `packages/contracts/` (shared)
- Hook changes are in `apps/front/src/hooks/`
- Component changes are in `apps/front/src/components/`
- No new files needed — all changes are modifications to existing files
- No new dependencies needed

### References

- [Source: packages/contracts/src/http/groups/assessment.ts#SendMessageResponseSchema] — Current contract with confidence field
- [Source: apps/front/src/hooks/useTherapistChat.ts] — Current confidence consumption in hook
- [Source: apps/front/src/components/TherapistChat.tsx] — Current UI using avgConfidence
- [Source: apps/front/src/components/ProgressBar.tsx] — Progress bar component (receives 0-100)
- [Source: apps/front/src/components/NerinAvatar.tsx] — Avatar with confidence tier styling
- [Source: _bmad-output/planning-artifacts/epics/epic-4-frontend-assessment-ui.md#Story 4.7] — Epic specification
- [Source: _bmad-output/implementation-artifacts/4-6-hide-scores-during-assessment.md] — Previous story context
- [Source: docs/FRONTEND.md] — Frontend styling patterns and conventions
- [Source: CLAUDE.md#Multi-Agent System] — Architecture context for async analyzer

### Dependency Notes

- **Depends on:** Story 2.11 (conceptually — removes confidence from send-message response). However, this story can implement the frontend changes independently by simply removing confidence consumption. The backend contract change is a one-line schema removal.
- **Relationship with Story 4.6:** Story 4.6 (Hide Scores During Assessment) is `ready-for-dev` but hasn't been implemented yet. Both stories modify the same files. If 4.6 is implemented first, 4.7 will need to adjust to whatever precision/progress UI 4.6 introduces. If 4.7 is implemented first, 4.6 should build on the message-count progress pattern.
- **Phase 2:** ElectricSQL live sync will replace message-count progress with real-time confidence computed from synced evidence table.

## Testing Strategy

**Unit Tests (apps/front):**
- `useTherapistChat.test.ts` — Message-count progress calculation, celebration trigger, resume hybrid logic
- `TherapistChat.test.tsx` — ProgressBar receives correct value, milestones trigger at correct points, celebration card shows

**Key Test Cases:**
1. 0 user messages → progress = 0%
2. 7 user messages → progress = 47%
3. 15 user messages → progress = 100%, celebration triggers
4. 20 user messages → progress stays at 100% (clamped)
5. Resume with 80% confidence → celebration triggers immediately
6. Resume with 30% confidence + 15 messages → celebration triggers from count
7. Progress monotonically increases (never goes down)
8. `onSuccess` callback does NOT read `data.confidence`
9. Milestones trigger at correct progress percentages

**Manual Testing:**
- Start fresh assessment → see progress increase per message
- Send 15+ messages → see celebration card
- Resume session with high confidence → see celebration immediately
- Verify ProgressBar labels match thresholds
- Mobile responsive check

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
