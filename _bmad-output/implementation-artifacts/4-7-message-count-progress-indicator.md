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
3. **Results reveal at threshold** — When `message_threshold` is reached, the celebration card triggers and the user can navigate to the results page. If unauthenticated, the auth gate (Story 7.11) intercepts with a teaser + sign-up flow.
4. **Phase 2: ElectricSQL live sync** — Deferred until ElectricSQL implementation.

## Implementation Status (Codebase Analysis 2026-02-14)

**~90% of this story is already implemented.** The backend contract, hook logic, and component wiring are done. Only minor UI text/label alignment and cleanup remain.

| Component | Status | Notes |
|-----------|--------|-------|
| `SendMessageResponseSchema` | DONE | Confidence removed per Story 2.11 (commit `3632c79`) |
| `ResumeSessionResponseSchema` | DONE | Includes `confidence` + `messageReadyThreshold` |
| `useTherapistChat` hook | DONE | Message-count logic, `progressPercent`, `isConfidenceReady` all working |
| `TherapistChat` component | 90% | `avgConfidence = progressPercent` alias in place. Celebration card text needs update |
| `ProgressBar` labels | NEEDS UPDATE | Current labels don't match spec thresholds |
| `TraitScores` interface | NEEDS CLEANUP | 10 redundant fields, only used by resume path |
| Backend use-cases | DONE | `send-message` returns `{ response }` only, `resume-session` returns threshold |
| App config | DONE | `messageReadyThreshold` defaults to 15, env-overridable |
| Unit tests | DONE | `useTherapistChat.test.ts` + `TherapistChat.test.tsx` cover message-count logic |
| E2E golden path | DONE | `e2e/specs/golden-path.spec.ts` exercises full flow with `MESSAGE_READY_THRESHOLD=2` |

## Acceptance Criteria

### AC-1: Remove Confidence Consumption from send-message

**Given** a send-message response arrives
**When** the `onSuccess` callback executes
**Then** it does NOT read or set `confidence` (field no longer exists)
**And** it only extracts `data.response` for the assistant message

**STATUS: DONE** — `useTherapistChat.ts:247-251` only reads `data.response`. Comment at line 253: "Story 2.11: confidence no longer in send-message response."

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

**STATUS: PARTIALLY DONE** — Progress calculation is correct (`useTherapistChat.ts:273-280`). ProgressBar labels need updating (see Task 1).

### AC-3: Celebration Trigger (Message Count)

**Given** the user has sent 15+ messages (configurable threshold from backend `messageReadyThreshold`)
**When** the progress check runs
**Then** `isConfidenceReady` becomes true
**And** the celebration card appears ("Your Personality Profile is Ready!")
**And** the "View Results" header link appears
**And** behavior is identical to current confidence-based trigger

**STATUS: DONE** — `useTherapistChat.ts:279`: `isConfidenceReady = userMessageCount >= MESSAGE_READY_THRESHOLD`. Celebration card and header link both conditioned on this boolean.

### AC-4: Resume Session Retains Confidence

**Given** a user resumes an existing session
**When** the resume endpoint returns
**Then** confidence scores are still loaded from resume response
**And** if resume confidence >= 70%, celebration triggers immediately
**And** if resume confidence < 70%, message-count progress takes over

**STATUS: DONE** — Resume confidence loading at `useTherapistChat.ts:137-155`. Hybrid logic uses `Math.max(resumeConfidence, messageCountProgress)`.

### AC-5: Remove TraitScores State (Cleanup)

**Given** the `useTherapistChat` hook
**When** the `traits` state is evaluated
**Then** the `TraitScores` interface is simplified or removed
**And** the duplicate `{trait}Confidence` fields are cleaned up
**And** `avgConfidence` calculation uses resume data OR message count

**STATUS: PARTIALLY DONE** — `avgConfidence` is correctly replaced with `progressPercent` in TherapistChat. But `TraitScores` interface (10 fields) still exists and is only used for resume loading. Needs cleanup (see Task 3).

### AC-6: Results Reveal After Message Threshold

**Given** the user has reached the `message_threshold` (isConfidenceReady = true)
**When** they click "View Results" on the celebration card or header link
**Then** they navigate to `/results/$sessionId`
**And** if the user is **authenticated**: results page renders with full archetype, trait scores, and evidence
**And** if the user is **unauthenticated**: `ResultsAuthGate` intercepts with teaser (blurred archetype) + sign-up/sign-in form (Story 7.11 flow)
**And** after successful sign-up/sign-in: results page renders with full data
**And** the 24-hour localStorage privacy window (Story 7.11) applies to anonymous sessions

**STATUS: DONE** — E2E golden path test validates the full flow: chat → celebration → view results → auth gate → results display.

## Tasks / Subtasks (Remaining Work Only)

All backend work is complete. Only frontend label/text polish and cleanup remain.

- [ ] **Task 1: Update `ProgressBar` labels to match spec** (AC: 2)
  - [ ] Edit `apps/front/src/components/ProgressBar.tsx` lines 21-27
  - [ ] Change thresholds from current values to spec:
    - `>= 85` → "Almost ready for results!" (was: "Putting the finishing touches...")
    - `>= 50` → "Refining your personality map..." (was: "Building your profile...")
    - `>= 25` → "Building your profile..." (was: "Understanding your patterns...")
    - default → "Getting to know you..." (unchanged)
  - [ ] Remove the `>= 70` → "Almost there..." threshold (redundant with new ranges)
  - [ ] Update `ProgressBar.test.tsx` label assertions (lines 27-56) to match new thresholds
- [ ] **Task 2: Update celebration card text** (AC: 3)
  - [ ] Edit `apps/front/src/components/TherapistChat.tsx` line 460
  - [ ] Change `"You've reached ${Math.round(avgConfidence)}% confidence"` to `"Your assessment is complete"`
  - [ ] Update `TherapistChat.test.tsx` assertion for celebration card text if it checks this string
- [ ] **Task 3: Simplify `TraitScores` interface (cleanup)** (AC: 5)
  - [ ] In `apps/front/src/hooks/useTherapistChat.ts` lines 11-22
  - [ ] Remove 5 duplicate `{trait}Confidence` fields from `TraitScores` (keep only 5 trait values)
  - [ ] OR replace with a simpler type: `Record<string, number>` used only for resume confidence
  - [ ] Update resume confidence loading (lines 137-155) to match simplified interface
  - [ ] `traits` is still returned but not consumed by TherapistChat for progress (only resume path uses it)
  - [ ] Verify `TherapistChat.test.tsx` mock doesn't depend on `traits` shape
- [ ] **Task 4: Add progress bar assertion to golden-path e2e** (AC: 2)
  - [ ] Edit `e2e/specs/golden-path.spec.ts`
  - [ ] Add a new `test.step` after "wait for Nerin response to first message" (after line 60) and before "send a second message" (line 62)
  - [ ] Assert the progress bar is visible and shows non-zero progress after 1 user message:
    ```typescript
    await test.step("assert progress bar is visible and updating", async () => {
    	const progressBar = page.getByTestId("progress-track");
    	await expect(progressBar).toBeVisible();
    	// With MESSAGE_READY_THRESHOLD=2, 1 user message = 50% progress
    	await expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });
    ```
  - [ ] The ProgressBar component exposes `data-testid="progress-track"`, `role="progressbar"`, and `aria-valuenow={clampedValue}` — use these for assertion
  - [ ] With `MESSAGE_READY_THRESHOLD=2` (e2e env), 1 user message = `Math.min(Math.round(1/2 * 100), 100)` = **50%**
  - [ ] After 2nd message (before celebration), progress should be 100% — optionally add a second check
- [ ] **Task 5: Verify all tests pass** (AC: all)
  - [ ] Run `pnpm --filter=front test` — all unit tests should pass after label/text updates
  - [ ] Run `pnpm test:run` — full test suite
  - [ ] Verify `useTherapistChat.test.ts` message-count tests pass (lines 506-615)
  - [ ] Verify `TherapistChat.test.tsx` ProgressBar integration tests pass (lines 495-546)
  - [ ] Verify `ProgressBar.test.tsx` updated label assertions pass

## Dev Notes

### Critical Architecture Guardrails

**Hexagonal architecture:** This story's remaining work is purely frontend (component labels and type cleanup). No contract or backend changes needed — those are already done.

**Effect Schema contract (ALREADY DONE):**
- `SendMessageResponseSchema` = `S.Struct({ response: S.String })` — no confidence field (line 49-52 in `packages/contracts/src/http/groups/assessment.ts`)
- `ResumeSessionResponseSchema` still has `confidence` + `messageReadyThreshold` (lines 108-124)

**Results reveal integration (Story 7.11 — ALREADY DONE):**
- `ResultsAuthGate.tsx` shows teaser (blurred archetype) + sign-up/sign-in for unauthenticated users
- `results-auth-gate-storage.ts` manages 24-hour localStorage privacy window
- On auth success, user sees full results immediately
- No changes needed — celebration card navigation feeds into it

**Frontend patterns:**
- Data attributes: `data-slot` for structural identification, `data-testid` for test hooks per FRONTEND.md
- Tailwind v4 with semantic color tokens
- shadcn/ui components from `@workspace/ui`

### Verified Code State (Exact References)

**`packages/contracts/src/http/groups/assessment.ts` — DONE, no changes needed:**
- Line 49-52: `SendMessageResponseSchema` = `{ response: S.String }` only
- Line 108-124: `ResumeSessionResponseSchema` includes `confidence` + `messageReadyThreshold`

**`apps/front/src/hooks/useTherapistChat.ts` — Mostly done, cleanup only:**
- Lines 11-22: `TraitScores` — 10 fields, needs simplification (Task 3)
- Lines 137-155: Resume confidence loading — working correctly
- Lines 247-251: `onSuccess` — reads only `data.response` (DONE)
- Lines 273-280: Message-count progress — fully implemented (DONE)
- Lines 282-300: Return values expose `progressPercent`, `isConfidenceReady`, `messageReadyThreshold` (DONE)

**`apps/front/src/components/TherapistChat.tsx` — Almost done:**
- Line 175: `const avgConfidence = progressPercent;` — alias in place (DONE)
- Lines 38-53: `MILESTONES` at 25, 50, 70 — correct for progress % (DONE)
- Line 460: Celebration text says "X% confidence" — **needs update (Task 2)**
- Lines 310-319: Header "View Your Results" link — working (DONE)
- Lines 449-480: Celebration card with "View Results" navigation — working (DONE)

**`apps/front/src/components/ProgressBar.tsx` — Needs label update (Task 1):**
- Lines 21-27: Current labels don't match AC-2 spec thresholds

### E2E Test Coverage (Already In Place + Task 4 Enhancement)

**Golden Path E2E Test:** `e2e/specs/golden-path.spec.ts`
- Exercises the full journey: Landing → Chat → Sign-up → Celebration → Results → Share → Public Profile
- Uses `MESSAGE_READY_THRESHOLD=2` (env override) for fast e2e execution
- Line 71-78: Asserts `data-slot="celebration-card"` appears after 2 user messages, clicks "View Results"
- Validates message-count threshold triggers celebration card correctly
- **Task 4 adds:** Progress bar visibility + `aria-valuenow` assertion between message sends
- Run with: `pnpm --filter=e2e test` (requires `compose.e2e.yaml` Docker environment)

**Progress Bar Selectors for E2E:**
- `data-testid="progress-track"` — the outer `<div>` with `role="progressbar"`
- `aria-valuenow` — current progress value (0-100), set from `clampedValue`
- `data-testid="progress-fill"` — the inner fill bar (width = `{clampedValue}%`)
- Progress bar renders when `messages.length > 0` (TherapistChat.tsx:323)

**E2E Infrastructure:**
- `e2e/factories/assessment.factory.ts` — session creation + DB seeding for results
- `e2e/factories/user.factory.ts` — user registration helpers
- `e2e/fixtures/auth.setup.ts` — auth setup project
- `e2e/specs/access-control/` — owner access, unauth denied, other-user denied specs

**E2E Config:** `e2e/playwright.config.ts` with `compose.e2e.yaml` for test environment

### Message Count → Progress Mapping (Reference)

```typescript
// Already implemented in useTherapistChat.ts:273-280
const MESSAGE_READY_THRESHOLD = resumeData?.messageReadyThreshold ?? 15;
const userMessageCount = messages.filter(m => m.role === "user").length;
const progressPercent = Math.min(
  Math.round((userMessageCount / MESSAGE_READY_THRESHOLD) * 100),
  100
);
const isConfidenceReady = userMessageCount >= MESSAGE_READY_THRESHOLD;
```

### ProgressBar Label Spec (Task 1 Reference)

Current implementation:
```typescript
if (clampedValue >= 80) return "Putting the finishing touches...";
if (clampedValue >= 70) return "Almost there...";
if (clampedValue >= 50) return "Building your profile...";
if (clampedValue >= 25) return "Understanding your patterns...";
return "Getting to know you...";
```

Target implementation:
```typescript
if (clampedValue >= 85) return "Almost ready for results!";
if (clampedValue >= 50) return "Refining your personality map...";
if (clampedValue >= 25) return "Building your profile...";
return "Getting to know you...";
```

### Results Reveal Flow (End-to-End) — VERIFIED BY E2E

```
User sends Nth message (threshold from backend config, default 15)
  ↓
isConfidenceReady = true
  ↓
Celebration card appears: "Your Personality Profile is Ready!"
  ↓
User clicks "View Results"
  ↓
Navigate to /results/$sessionId
  ↓
┌─ Authenticated? ─────────────────────────────┐
│  YES → Results page renders with full data    │
│  NO  → ResultsAuthGate intercepts:            │
│        → Teaser (blurred archetype)           │
│        → Sign-up / Sign-in forms              │
│        → 24h localStorage privacy window      │
│        → On auth success → full results       │
└───────────────────────────────────────────────┘
```

**Edge case — async analyzer race condition:**
By message 15, the async analyzer (Story 2.11) will have processed messages 3, 6, 9, 12. At least 4 analysis rounds completed. If user navigates very quickly after 15th message, latest batch may still be processing. Results page should handle gracefully:
- If archetype/scores exist → show results
- If archetype doesn't exist yet → show "Finalizing your profile..." loading state

### Project Structure Notes

- All remaining changes are modifications to existing files — no new files needed
- ProgressBar label change: `apps/front/src/components/ProgressBar.tsx`
- Celebration text change: `apps/front/src/components/TherapistChat.tsx`
- TraitScores cleanup: `apps/front/src/hooks/useTherapistChat.ts`
- Test updates: corresponding `.test.ts` / `.test.tsx` files
- No new dependencies needed

### References

- [Source: packages/contracts/src/http/groups/assessment.ts#SendMessageResponseSchema] — Contract (confidence removed)
- [Source: apps/front/src/hooks/useTherapistChat.ts] — Message-count progress (implemented)
- [Source: apps/front/src/components/TherapistChat.tsx] — Celebration card, progress display
- [Source: apps/front/src/components/ProgressBar.tsx] — Labels need update
- [Source: e2e/specs/golden-path.spec.ts] — E2E test covering full flow
- [Source: e2e/factories/assessment.factory.ts] — E2E session/results seeding
- [Source: apps/front/src/components/ResultsAuthGate.tsx] — Auth gate (Story 7.11, no changes)
- [Source: apps/front/src/lib/results-auth-gate-storage.ts] — 24h localStorage privacy window
- [Source: packages/domain/src/config/app-config.ts#messageReadyThreshold] — Backend threshold config
- [Source: docs/FRONTEND.md] — Frontend styling patterns and conventions

### Dependency Notes

- **Depends on:** Story 2.11 (DONE — async analyzer, commit `3632c79`)
- **Integrates with:** Story 7.11 (DONE — auth-gated results reveal, commit `4c1c3aa`)
- **Relationship with Story 4.6:** Story 4.6 is `ready-for-dev` but not implemented. Both modify same files. Story 4.7 should be completed first — it establishes the message-count pattern that 4.6 can build on.
- **E2E tests:** Golden path test already validates this flow (commit `842518f`)
- **Phase 2:** ElectricSQL live sync will replace message-count progress

## Testing Strategy

**Unit Tests (Already Passing):**
- `useTherapistChat.test.ts` (lines 506-615) — message-count progress, celebration trigger, resume hybrid
- `TherapistChat.test.tsx` (lines 422-546) — celebration card, ProgressBar integration, milestones

**Tests That Need Updates After Label Changes:**
- `ProgressBar.test.tsx` (lines 27-56) — label threshold assertions must match new spec
- `TherapistChat.test.tsx` — celebration card text assertion (if it checks "X% confidence" string)

**E2E Test (Already Passing):**
- `e2e/specs/golden-path.spec.ts` — Full journey with `MESSAGE_READY_THRESHOLD=2`

**Manual Testing:**
- Start fresh assessment → see progress increase per message
- Send 15+ messages → see celebration card
- Click "View Results" → results page (auth gate if unauthenticated)
- Verify ProgressBar labels match new thresholds
- Resume session with high confidence → celebration triggers immediately

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
