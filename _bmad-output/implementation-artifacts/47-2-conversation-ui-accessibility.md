# Story 47.2: Conversation UI Accessibility

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a screen reader user,
I want to navigate the conversation with Nerin,
so that I can participate in the assessment without vision.

## Acceptance Criteria

1. **Given** the chat interface at `/chat`
   **When** a screen reader is active
   **Then** the message history exposes a navigable log structure
   **And** the container that owns the rendered exchange history uses `role="log"`
   **And** new assistant messages are surfaced in a way that allows discovery without forcing the full message body to be re-announced every render

2. **Given** Nerin sends a new message in the chat
   **When** the assistant response appears
   **Then** a polite screen-reader announcement communicates that Nerin responded
   **And** the announcement uses short summary text such as "Nerin sent a message"
   **And** long markdown responses remain explorable in the DOM after the summary announcement

3. **Given** the conversation depth meter updates on each exchange
   **When** the user inspects it with assistive technology
   **Then** the meter exposes the current progress with `aria-valuenow`
   **And** progress can be understood as the current exchange out of the total exchange count
   **And** milestone announcements remain polite and non-disruptive when 25%, 50%, and 75% depth are reached

4. **Given** the user composes a chat reply
   **When** they use only the keyboard
   **Then** the textarea remains keyboard-accessible
   **And** `Enter` sends the message
   **And** `Shift+Enter` inserts a newline
   **And** the send button exposes `aria-label="Send message"`

5. **Given** the conversation accessibility work is complete
   **When** automated and manual regression checks run
   **Then** the new chat semantics and announcements are covered by front-end tests
   **And** the conversation flow is manually verified with keyboard-only navigation plus at least one screen-reader spot check
   **And** the existing visual design, optimistic send flow, message highlighting, milestone badges, and farewell/auth-gate behavior remain unchanged

## Tasks / Subtasks

- [x] Task 1: Preserve current chat behavior while identifying only the missing accessibility gaps (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 Reuse the route-level `<main>` / page-heading work from Story 47.1 and keep this story scoped to the conversation surface inside `apps/front/src/components/TherapistChat.tsx`
  - [x] 1.2 Preserve existing compliant behavior already present in chat: `DepthMeter` progressbar semantics, milestone live-region announcements, textarea Enter/Shift+Enter handling, character limit handling, optimistic send flow, and farewell/auth-gate transitions
  - [x] 1.3 Do not redesign the chat layout, message styling, header content, or milestone copy in this story

- [x] Task 2: Add screen-reader-friendly message history semantics to the conversation transcript (AC: 1, 2)
  - [x] 2.1 Update the rendered messages container in `apps/front/src/components/TherapistChat.tsx` so the exchange history is owned by a `role="log"` region
  - [x] 2.2 Ensure the log semantics work with the current mixed rendering model: user bubbles as local JSX, assistant bubbles via `NerinMessage`, message highlights, timestamps, milestone badges, typing indicator, and auth gate
  - [x] 2.3 Keep native reading/navigation available for the actual message content; do not hide or replace the rendered markdown content with announcement-only text
  - [x] 2.4 Make sure loading, resume, and error states do not produce duplicate or misleading transcript announcements

- [x] Task 3: Add concise live announcements for new assistant responses without causing a wall of audio (AC: 1, 2)
  - [x] 3.1 Add a dedicated polite live-region pattern in `apps/front/src/components/TherapistChat.tsx` that announces only when a fresh assistant message is appended
  - [x] 3.2 Announce short summary text such as "Nerin sent a message" rather than the full markdown body
  - [x] 3.3 Prevent re-announcing historical assistant messages on mount, resume, rerender, highlight changes, or timestamp updates
  - [x] 3.4 Keep the implementation compatible with resumed sessions from `useTherapistChat` and with the final-turn case where `surfacingMessage` may append a second assistant message

- [x] Task 4: Tighten composer and progress semantics for assistive technology (AC: 3, 4)
  - [x] 4.1 Add `aria-label="Send message"` to the existing send button in `apps/front/src/components/TherapistChat.tsx`
  - [x] 4.2 If needed, add a small non-visual helper (`sr-only` text or equivalent) so the textarea clearly communicates the Enter-to-send and Shift+Enter-for-newline convention without changing visible layout
  - [x] 4.3 Keep `apps/front/src/components/chat/DepthMeter.tsx` aligned with the story requirement that progress is understandable as "Exchange X of 15", using `aria-valuetext` if that improves narration while preserving `aria-valuenow`
  - [x] 4.4 Preserve milestone live announcements and avoid turning the meter into a noisy or assertive live region

- [x] Task 5: Expand automated regression coverage around chat accessibility semantics (AC: 3, 4, 5)
  - [x] 5.1 Extend `apps/front/src/components/TherapistChat-core.test.tsx` or split focused tests if needed to verify the transcript log semantics, summary live region behavior, and send-button labeling
  - [x] 5.2 Add tests that prove Enter sends while Shift+Enter does not send and instead keeps multiline composition behavior intact
  - [x] 5.3 Extend `apps/front/src/components/chat/__tests__/DepthMeter.test.tsx` if needed to verify the exchange-progress narration contract in addition to the existing `aria-valuenow` coverage
  - [x] 5.4 Keep test selectors aligned with existing frontend conventions in `docs/FRONTEND.md` and avoid brittle text-only selectors where stable attributes already exist

- [ ] Task 6: Perform focused verification for the dynamic chat experience (AC: 5)
  - [x] 6.1 Run targeted front-end tests for `TherapistChat` and `DepthMeter`
  - [x] 6.2 Run `pnpm --filter=front typecheck`
  - [ ] 6.3 Manually verify `/chat` with keyboard-only usage, confirming focus remains logical through transcript, composer, send action, milestone updates, and farewell states
  - [ ] 6.4 Perform at least one screen-reader spot check (VoiceOver or equivalent local setup) to confirm the log region, summary announcements, and progress narration are understandable

## Dev Notes

- This story is intentionally limited to the conversation UI. It should not reopen route-level skip-link and landmark work from Story 47.1, results-page accessibility from Story 47.3, modal focus management from Story 47.4, or contrast/touch-target auditing from Story 47.5.
- Story 47.1 already established the route-level accessibility shell. `/chat` now renders through `PageMain` in `apps/front/src/routes/chat/index.tsx`, so this story should focus inside `TherapistChat` rather than introducing another page wrapper.
- Preserve the current conversation UX. The goal is improved assistive-technology semantics, not a visual redesign or IA change.

### Previous Story Intelligence

- Story 47.1 touched the shared page structure and made Epic 47 active. Reuse that foundation instead of creating a competing pattern.
- The `feat: 47-1` commit touched `apps/front/src/routes/chat/index.tsx`, `apps/front/src/components/PageMain.tsx`, and the representative accessibility tests. That is the current baseline for this story's route integration.
- Story 47.1 explicitly deferred chat live-region work to Story 47.2. That means any conversation-specific announcement logic belongs here, not in retroactive patches to the previous story.

### Current Code Observations

- `apps/front/src/components/TherapistChat.tsx` currently renders the transcript inside a generic scroll container. Message bubbles expose `data-message-id`, but the transcript wrapper does not yet expose `role="log"`.
- Assistant responses are currently rendered inline with `NerinMessage` and `react-markdown`; there is no dedicated summary announcement region for newly appended assistant messages.
- `apps/front/src/components/chat/DepthMeter.tsx` already exposes `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and a polite live region for milestone announcements. This story should extend that contract only where the exchange wording is still unclear to assistive tech.
- The composer in `apps/front/src/components/TherapistChat.tsx` already implements `Enter` to send and `Shift+Enter` for newline via `handleKeyDown`, but the send button currently relies on its icon only and lacks an explicit accessible name.
- `useTherapistChat` appends assistant responses optimistically through query-cache updates and can add two assistant messages on the final turn (`response` plus optional `surfacingMessage`). Any live-announcement logic must handle both without double-announcing historical content on resume.
- Existing chat tests already cover keyboard send behavior, character limits, focus handling, and milestone rendering. Extend those tests rather than creating a separate testing style.

### Architecture Compliance

- Keep the work in the TanStack Start frontend and current route/component boundaries; no new framework, accessibility package, or alternate chat implementation should be introduced. [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Project Structure & Boundaries]
- Prefer semantic HTML and minimal ARIA. Add ARIA only where native semantics do not cover the dynamic chat-announcement use case. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.5 Implementation Guidelines]
- Follow the project’s established frontend testing and selector conventions (`data-slot`, `data-testid`) when adding or extending tests. [Source: `docs/FRONTEND.md`]

### Library / Framework Requirements

- No new accessibility library should be introduced for this story.
- Keep the existing `react-markdown` rendering for assistant content.
- Reuse `sr-only` utility patterns already present in the codebase for non-visual helper text or live-region content.
- Keep the implementation compatible with the existing React Query cache / optimistic update flow in `useTherapistChat`.

### File Structure Requirements

Likely touch points for implementation:

- Chat route integration
  - `apps/front/src/routes/chat/index.tsx` (only if a route-level test or title adjustment is strictly needed)

- Conversation accessibility implementation
  - `apps/front/src/components/TherapistChat.tsx`
  - `apps/front/src/components/chat/DepthMeter.tsx`
  - `apps/front/src/hooks/useTherapistChat.ts` (only if message metadata or append semantics need a small supporting adjustment)

- Automated regression coverage
  - `apps/front/src/components/TherapistChat-core.test.tsx`
  - `apps/front/src/components/TherapistChat-farewell-auth-focus.test.tsx` (only if farewell/focus behavior intersects with announcements)
  - `apps/front/src/components/chat/__tests__/DepthMeter.test.tsx`
  - `apps/front/src/components/__fixtures__/therapist-chat.fixtures.tsx`

### Testing Requirements

- Front-end unit/component tests:
  - Verify the transcript exposes `role="log"`
  - Verify a polite summary live region exists for new assistant messages and does not read the entire message body
  - Verify the send button exposes `aria-label="Send message"`
  - Verify Enter sends and Shift+Enter preserves multiline entry
  - Verify the depth meter still exposes progressbar semantics and understandable exchange progress narration

- Manual verification:
  - Keyboard-only pass through `/chat`
  - Screen-reader spot check on a live or resumed conversation
  - Confirm no duplicate announcements occur on initial load, session resume, or highlight-only state changes
  - Confirm milestone messages remain polite and non-disruptive

- E2E scope:
  - Do not add browser-heavy E2E coverage unless it exercises a real multi-state accessibility flow that lower-level tests cannot cover. The current testing standard keeps dynamic chat behavior primarily at the unit/manual layers. [Source: `docs/E2E-TESTING.md`; `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.4 Testing Strategy]

### Project Structure Notes

- The planning artifacts phrase this requirement in terms of `/chat`, screen readers, `role="log"`, polite announcements, and progress-meter semantics. The live code already satisfies part of that requirement, so the implementation should close the remaining gaps rather than mechanically redoing every item from the epic text.
- Keep current message highlighting behavior intact. Evidence-highlight navigation already depends on `data-message-id` anchors and smooth scrolling in `TherapistChat`.
- Avoid coupling this story to results-page, profile, or modal internals. Epic 47 intentionally split those into separate stories.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 3, Story 3.2 "Conversation UI Accessibility"]
- [Source: `_bmad-output/planning-artifacts/prd.md` - Accessibility]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.3 Accessibility Strategy; 13.4 Testing Strategy; 13.5 Implementation Guidelines]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Project Structure & Boundaries]
- [Source: `docs/FRONTEND.md` - testing and data-attribute conventions]
- [Source: `docs/E2E-TESTING.md` - E2E scope and selector rules]
- [Source: `_bmad-output/implementation-artifacts/47-1-skip-link-and-semantic-landmarks.md` - prior accessibility story context and deferments]
- [Source: `apps/front/src/routes/chat/index.tsx` - current `/chat` route shell via `PageMain`]
- [Source: `apps/front/src/components/TherapistChat.tsx` - current transcript, composer, and farewell behavior]
- [Source: `apps/front/src/components/chat/DepthMeter.tsx` - current progress and milestone announcement behavior]
- [Source: `apps/front/src/hooks/useTherapistChat.ts` - current message append semantics for live and resumed sessions]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-08T23:24+0200 - Story context created from Epic 47 requirements, PRD accessibility requirements, UX accessibility strategy/testing guidance, architecture constraints, Story 47.1 implementation context, recent git history, and current `/chat` frontend code.
- 2026-04-08T23:31+0200 - Implemented chat transcript log semantics, assistant summary announcements, explicit composer accessibility labels/instructions, and depth-meter `aria-valuetext` updates in `TherapistChat.tsx` and `DepthMeter.tsx`.
- 2026-04-08T23:33+0200 - Added targeted regression coverage in `TherapistChat-core.test.tsx` and `DepthMeter.test.tsx`; verified `TherapistChat-core`, `TherapistChat-farewell-auth-focus`, and `DepthMeter` Vitest suites all pass.
- 2026-04-08T23:33+0200 - Ran `pnpm --filter=front typecheck` successfully. Manual keyboard walkthrough and a real screen-reader spot check remain pending outside this terminal session.
- 2026-04-09T00:08+0200 - Addressed code-review findings by announcing the opening assistant message on fresh chat loads, moving typing/auth UI outside the transcript log, and hiding milestone badge text from assistive-tech log navigation.
- 2026-04-09T00:08+0200 - Re-ran focused validation: `TherapistChat-core`, `TherapistChat-farewell-auth-focus`, `DepthMeter` Vitest suites all pass and `pnpm --filter=front typecheck` remains green after the review fixes.
- 2026-04-09T12:01+0200 - Resumed Story 47.2 to evaluate the remaining open verification tasks. Confirmed the only unchecked items are manual keyboard walkthrough and a real screen-reader spot check, which cannot be completed from this terminal-only environment.

### Completion Notes List

- Added `role="log"` transcript semantics to the chat history without changing the current message rendering model, highlights, milestone badges, typing indicator, or auth-gate flow.
- Added a dedicated polite `chat-announcer` live region that emits only the short summary "Nerin sent a message" for new assistant responses and suppresses announcements on mount/resume and user-only updates.
- Added explicit composer accessibility affordances: `aria-label="Send message"` on the send button and non-visual shortcut instructions for Enter-to-send / Shift+Enter-for-newline behavior.
- Added `aria-valuetext="Exchange X of 15"` to the depth meter while preserving the existing progressbar contract and polite milestone announcements.
- Verified targeted automated regression coverage with:
  - `pnpm --filter=front exec vitest run src/components/TherapistChat-core.test.tsx src/components/chat/__tests__/DepthMeter.test.tsx`
  - `pnpm --filter=front exec vitest run src/components/TherapistChat-farewell-auth-focus.test.tsx`
  - `pnpm --filter=front typecheck`
- Fixed the review follow-ups by announcing Nerin's opening prompt on first-load fresh sessions and by limiting `role="log"` exposure to transcript entries rather than typing/auth helper UI.
- No additional code changes were required on this pass; the remaining work is human-run verification on a live `/chat` session with keyboard navigation and an actual screen reader.
- Story remains `in-progress` because manual keyboard verification and a real screen-reader spot check were not executed in this terminal session.

### File List

- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/TherapistChat-core.test.tsx`
- `apps/front/src/components/chat/DepthMeter.tsx`
- `apps/front/src/components/chat/__tests__/DepthMeter.test.tsx`
- `_bmad-output/implementation-artifacts/47-2-conversation-ui-accessibility.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-08: Implemented Story 47.2 chat accessibility changes and added focused automated coverage; manual verification remains pending.
- 2026-04-09: Fixed code-review findings around first-load assistant announcements and transcript log scoping.
- 2026-04-09: Reconfirmed the story is blocked only on manual accessibility verification outside this environment.
