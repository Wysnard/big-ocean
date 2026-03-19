# Story 31-5: Session Resume

Status: ready-for-dev

<!-- Origin: Epic 2 (Conversational Assessment & Drop-off Recovery) in epics.md -->
<!-- Phase 7, Epic 31, Story 5 -->
<!-- Builds on: Stories 9-1 through 9-5 which established the chat UI, resume API, and conversation pipeline -->

## Story

As a **user with an in-progress conversation**,
I want **to pick up my conversation where I left off when I close my browser or lose connection**,
So that **I don't lose progress in my conversation with Nerin**.

## Acceptance Criteria

1. **AC1: Browser close and return** — Given a user has an in-progress conversation, when they close the browser and return later, then navigating to `/chat` loads the existing session with all prior messages displayed, the depth meter reflects the correct progress, and the pacing pipeline resumes from the last exchange state (FR11).

2. **AC2: Network loss and retry** — Given a user loses network connection mid-conversation, when connectivity is restored, then any unsent message can be retried and the conversation state remains consistent.

3. **AC3: Completed session not resumable** — Given a user has a completed conversation, when they navigate to `/chat`, then they are not presented with the completed session as resumable and they are redirected to their results page or offered to start a new assessment.

## Tasks / Subtasks

- [ ] Task 1: Redirect completed sessions from `/chat` to results (AC: #3)
  - [ ] 1.1: In `apps/front/src/routes/chat/index.tsx` `beforeLoad`, after session ownership verification, check the session status. If the user's session is `completed` or `finalizing`, redirect to `/results/$assessmentSessionId` instead of loading the chat.
  - [ ] 1.2: In the start assessment handler, when an existing completed session is found, do NOT return it as resumable. Verify the current `startAuthenticatedAssessment` behavior correctly returns `AssessmentAlreadyExists` error for completed sessions (already implemented — verify no regression).
  - [ ] 1.3: Add unit test: navigating to `/chat` with a completed session redirects to results.

- [ ] Task 2: Network loss detection and reconnection handling (AC: #2)
  - [ ] 2.1: Create `apps/front/src/hooks/useOnlineStatus.ts` — a hook that tracks `navigator.onLine` and listens for `online`/`offline` events. Returns `{ isOnline: boolean }`.
  - [ ] 2.2: In `TherapistChat.tsx`, integrate `useOnlineStatus`. When `isOnline` transitions from `false` to `true`, show a brief toast "Connection restored" and allow retry. When `isOnline` becomes `false`, show a non-blocking banner "You're offline — your message will be sent when you reconnect".
  - [ ] 2.3: In `useTherapistChat.ts`, enhance `sendMessage` to detect network errors (e.g., `Failed to fetch`) and store the unsent message text in state so it can be retried when connectivity returns.
  - [ ] 2.4: Add unit test: `useOnlineStatus` tracks online/offline transitions.
  - [ ] 2.5: Add unit test: unsent message is preserved and retryable after network error.

- [ ] Task 3: Verify browser close/return resume path (AC: #1)
  - [ ] 3.1: Verify that the existing `beforeLoad` in `/chat` route correctly handles returning users: authenticated users with an active session get redirected to `/chat?sessionId=...` via the `startAuthenticatedAssessment` 409 response or `listSessions` check. Anonymous users recover via localStorage pending session.
  - [ ] 3.2: Verify that `useResumeSession` correctly loads all prior messages and the depth meter shows accurate progress on resume.
  - [ ] 3.3: Add unit test: resumed session shows correct `progressPercent` based on user message count from server.

- [ ] Task 4: Pacing pipeline resume verification (AC: #1)
  - [ ] 4.1: Verify that `send-message.use-case.ts` loads the latest exchange state (turn number, selected territory) from the database for each new message, so the pacing pipeline naturally resumes from the last exchange state without special resume logic.
  - [ ] 4.2: Add backend unit test: sending a message after resume continues from the correct exchange turn number.

## Dev Notes

### Architecture Context

Session resume is fundamentally a backend concern — the pacing pipeline already persists all exchange state to the database (`assessment_exchanges` table), and each new message loads the latest state. The frontend resume path (`useResumeSession` -> `GET /api/assessment/:sessionId/resume`) is also implemented. This story focuses on **gap-filling** and **edge case hardening**.

### What Already Exists (DO NOT Rebuild)

**Backend:**
- `resume-session.use-case.ts` — loads session, validates ownership, returns messages + confidence
- `assessment.ts` handler — wires resume endpoint, maps infrastructure errors
- `send-message.use-case.ts` — loads exchange state per message, pacing pipeline inherently resumes
- `start-assessment.use-case.ts` — returns existing active session for authenticated users (409 for completed)
- Resume session tests — ownership validation tests exist

**Frontend:**
- `useResumeSession(sessionId)` — TanStack Query hook for `GET /api/assessment/:sessionId/resume`
- `useTherapistChat.ts` — handles resume data, message staggering, farewell detection, `retryLastMessage`
- Chat route `beforeLoad` — starts/resumes session, recovers from localStorage, verifies ownership
- `ErrorBanner` — shows retry button for network/generic errors
- `TherapistChat.tsx` — full chat UI with completed state handling

### What's Missing (Story 31-5 Scope)

| Gap | Priority | Detail |
|-----|----------|--------|
| Completed session redirect | High | `/chat` doesn't redirect completed sessions to results — user sees the chat with a "View Results" button instead of being proactively redirected |
| Offline detection | Medium | No `navigator.onLine` tracking — network errors show generic error banner but no offline-specific UX |
| Unsent message persistence | Medium | `retryLastMessage` retries the last user message but depends on it being in the messages array — if the tab was closed mid-send, the message is lost |
| Pacing pipeline resume test | Low | No explicit test that exchange turn number continues correctly after resume |

### Key Implementation Details

**Completed session redirect:**
The chat route's `beforeLoad` already calls `listSessions` for authenticated users. If the returned session has `status === "completed"`, redirect to `/results/$assessmentSessionId`. For the start assessment flow, the 409 `AssessmentAlreadyExists` error includes `existingSessionId` — the frontend already handles this. The gap is: after auth, if the session loaded via `sessionId` search param has status `completed`, we should redirect to results.

**Offline detection:**
Use `navigator.onLine` + `online`/`offline` event listeners. This is a lightweight hook. The banner should be similar to `ErrorBanner` but with offline-specific messaging. When reconnecting, auto-retry is NOT recommended (user should explicitly retry to avoid confusion).

**Pacing pipeline resume:**
The `send-message.use-case.ts` already computes the turn number from `session.messageCount` and loads the latest exchange. No special resume logic needed — the pipeline is stateless per-request and re-derives state from the database each turn.

### Error Types

No new error types needed.

### Testing Standards

- Backend tests: Vitest with `@effect/vitest`, test layers with mock repos
- Frontend tests: Vitest with `@testing-library/react`, mock `use-assessment` hooks
- Follow existing mock patterns from `useTherapistChat-resume.test.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5] — Story acceptance criteria
- [Source: apps/api/src/use-cases/resume-session.use-case.ts] — Backend resume use case
- [Source: apps/front/src/routes/chat/index.tsx] — Chat route with beforeLoad
- [Source: apps/front/src/hooks/useTherapistChat.ts] — Chat state management
- [Source: apps/front/src/components/TherapistChat.tsx] — Chat UI component
- [Source: _bmad-output/implementation-artifacts/9-5-chat-interface-and-conversation-ux.md] — Previous story learnings
