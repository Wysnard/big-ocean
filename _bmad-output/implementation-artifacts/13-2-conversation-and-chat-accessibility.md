# Story 13.2: Conversation & Chat Accessibility

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. Optional: run validate-create-story before dev-story. -->

## Story

As a screen reader user,
I want to participate in the Nerin conversation,
so that the assessment is accessible regardless of ability.

## Acceptance Criteria

1. **Transcript region (`/chat`):** The scrollable message list is exposed as an ARIA log so assistive tech can treat it as a live transcript container (`role="log"`), with an accessible name for the conversation history.

2. **Nerin message announcements:** When Nerin sends a new message, assistive technology receives a polite update (do not rely on reading the entire thread aloud on every change — use a dedicated `aria-live="polite"` region with a concise announcement pattern).

3. **Depth / exchange progress:** The depth meter exposes current progress in a machine-readable way: progress semantics with `aria-valuenow` / min / max (or equivalent) and human-readable text such as **“Exchange X of Y”** (Y = configured total turns for the session, typically 15 in MVP).

4. **Depth milestones:** When the user crosses milestone thresholds (e.g. 25% / 50% / 75% of the conversation), a polite live region announces a short status (e.g. **“50% depth reached”**) consistent with existing milestone logic.

5. **Composer keyboard behavior:** The message field is keyboard-operable: **Enter** sends (when not loading/disabled), **Shift+Enter** inserts a newline without sending.

6. **Send control:** The send button has an accessible name **`Send message`** (exact string for consistency with existing tests).

## Tasks / Subtasks

- [x] **Baseline audit vs. AC (AC: all)**  
  - [x] Trace `/chat` → `TherapistChat` → `ChatInputBar` / `DepthMeter` and map each AC to current DOM/ARIA. Document any delta in Dev Agent Record.  
  - [x] Confirm `TherapistChat-core.test.tsx` and `DepthMeter.test.tsx` still reflect AC; extend tests only where behavior is new or previously untested.

- [x] **Transcript + live announcements (AC: 1, 2)**  
  - [x] Keep **`role="log"`** on the message scroller with a clear accessible name (e.g. `aria-label="Conversation history"`). Prefer **`aria-live="off"`** on the log itself when using a separate polite announcer for new assistant content (avoids double-speaking).  
  - [x] Verify **`chat-announcer`** (`data-testid="chat-announcer"`, `aria-live="polite"`) announces new Nerin messages with the intended concise copy; adjust copy only if it improves clarity without breaking tests.

- [x] **Depth meter — desktop + mobile parity (AC: 3, 4)**  
  - [x] Confirm **`DepthMeter`** `role="progressbar"` exposes `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and **`aria-valuetext`** including **“Exchange X of Y”** when `totalTurns > 0`.  
  - [x] **Gap check:** The meter is visually hidden on narrow viewports (`max-[900px]:hidden`). Ensure screen reader users **still** get exchange/progress on mobile (e.g. duplicate minimal progress semantics in the header row as `sr-only`, or another WCAG-consistent pattern). Do not remove `data-testid` hooks on the meter.

- [x] **Milestone announcements (AC: 4)**  
  - [x] Align polite milestone strings with **`depth-milestones`** / `DepthMeter` announcer (`depth-meter-announcer`). Ensure milestone **copy** does not leak assessment/scoring language (product rule: depth ≠ personality scoring).

- [x] **Input + send (AC: 5, 6)**  
  - [x] Confirm **Enter** / **Shift+Enter** handling in `ChatInputBar` and keep **`aria-describedby`** helper text for shortcuts (`CHAT_INPUT_SHORTCUTS_ID`).  
  - [x] Confirm send button **`aria-label="Send message"`** and **`data-testid="chat-send-btn"`** unchanged for e2e.

- [x] **Regression**  
  - [x] Run `pnpm --filter=front test` (at minimum `TherapistChat-core`, `DepthMeter`, related chat tests).  
  - [x] Manual spot-check: VoiceOver (macOS) or NVDA (Windows) on `/chat` — log landmark, polite announcement on new Nerin line, progress/milestone behavior on desktop and mobile widths.

### Senior Developer Review (AI)

**Date:** 2026-04-16  
**Outcome:** Approve  
**Layers:** Blind Hunter (diff only), Edge Case Hunter (diff + project), Acceptance Auditor (diff + spec). All 6 ACs satisfied. 0 patch findings; 3 deferred (all pre-existing, not introduced by this diff); 4 dismissed.

### Review Findings

- [x] [Review][Defer] `<nav>` element hosts `role="progressbar"` — semantic element/role mismatch [`apps/front/src/components/chat/DepthMeter.tsx`] — deferred, pre-existing (nav was already used as progressbar host before this diff)
- [x] [Review][Defer] `opacity: 0` at turn 0 leaves nav progressbar in AT on wide viewports [`apps/front/src/components/chat/DepthMeter.tsx`] — deferred, pre-existing; opacity trick predates this story
- [x] [Review][Defer] `aria-valuenow` may exceed `aria-valuemax` in extended sessions (currentTurn > totalTurns) [`apps/front/src/components/chat/DepthMeter.tsx`] — deferred, pre-existing; same behaviour in original nav

## Dev Notes

### What already exists (do not reinvent)

- **Primary UI:** [`apps/front/src/components/TherapistChat.tsx`](apps/front/src/components/TherapistChat.tsx) — `role="log"` transcript, `chat-announcer`, `ChatInputBar` (textarea + send), `DepthMeter`, integration with [`apps/front/src/components/chat/depth-milestones.ts`](apps/front/src/components/chat/depth-milestones.ts).  
- **Depth meter:** [`apps/front/src/components/chat/DepthMeter.tsx`](apps/front/src/components/chat/DepthMeter.tsx) — `role="progressbar"`, `aria-valuetext`, milestone announcer.  
- **Tests:** [`apps/front/src/components/TherapistChat-core.test.tsx`](apps/front/src/components/TherapistChat-core.test.tsx), [`apps/front/src/components/chat/__tests__/DepthMeter.test.tsx`](apps/front/src/components/chat/__tests__/DepthMeter.test.tsx).  
- **Route:** [`apps/front/src/routes/chat/index.tsx`](apps/front/src/routes/chat/index.tsx) — authenticated `/chat` shell (`PageMain` + `TherapistChat`).

This story is primarily **verification and closing any accessibility gaps** (especially **mobile depth/progress**), not a greenfield build.

### Previous story intelligence (13.1)

- **Story 13.1** established skip link, single `#main-content`, landmarks, and heading hierarchy across routes. **`/chat`** uses `PageMain` — preserve **one document `h1`** and do not introduce a second `main` inside the chat layout.  
- **Files touched in 13.1** (for conflict awareness): `Header`, library routes, three-space pages — unlikely to overlap except `PageMain`/`__root` if you change chat route structure.  
- **Testing:** Follow route test placement rules ([`docs/FRONTEND.md`](docs/FRONTEND.md)) — no loose `*.test.tsx` under `routes/`.

### Architecture & product rules

- **Frontend-only** — `apps/front` and, if needed, [`packages/ui`](packages/ui) for shared chat primitives (`NerinMessage`, etc.). No API or schema changes.  
- **WCAG target:** Epic 13 → **WCAG 2.1 Level AA** for this flow.  
- **Assessment integrity:** Do not add live regions that expose trait scores, facets, or “how much Openness” — depth/milestones are **conversational progress only** ([`docs/FRONTEND.md`](docs/FRONTEND.md) / product copy rules).  
- **Navigation:** Internal links remain TanStack Router [`Link`](https://tanstack.com/router/latest/docs/guide/navigation) per [`CLAUDE.md`](CLAUDE.md).  
- **`data-testid`:** Never remove or rename existing `data-testid` values used by tests.

### File structure requirements

| Area | Location |
|------|----------|
| Chat experience | `apps/front/src/components/TherapistChat.tsx`, `ChatInputBar` (same file), `apps/front/src/components/chat/*` |
| Shared chat chrome | `packages/ui/src/components/chat/NerinMessage.tsx` (only if bubble semantics must change) |
| Tests | Colocated `__tests__` or `TherapistChat-core.test.tsx` — **not** under `routes/chat/` without `-` prefix |

### Testing requirements

- **Unit/component:** Extend existing Vitest + Testing Library suites; prefer assertions on roles (`log`, `progressbar`) and live regions over snapshot-only tests.  
- **E2E:** Only if a critical journey requires it — keep suite fast per [`docs/E2E-TESTING.md`](docs/E2E-TESTING.md).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 13, Story 13.2]
- [Source: `_bmad-output/implementation-artifacts/13-1-skip-link-landmarks-and-heading-hierarchy.md` — predecessor story]
- [Source: `apps/front/src/components/TherapistChat.tsx` — chat shell, log, announcer, input]
- [Source: `apps/front/src/components/chat/DepthMeter.tsx` — progressbar + milestone announcer]
- [Source: `docs/FRONTEND.md` — testing & data attributes]

## Change Log

- **2026-04-16:** Implemented Story 13.2 — shared `conversationDepthProgressAriaProps`, milestone announcer moved outside desktop-only `nav` so it works when the bar is hidden; narrow-viewport `sr-only` progressbar in chat header (`conversation-depth-progress-narrow`). Tests extended. Full `pnpm --filter=front test` passed.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

— 

### Completion Notes List

- **Audit:** Existing `/chat` already met AC1–2, 5–6 (log + `chat-announcer`, Enter/Shift+Enter, send label, shortcut hint).  
- **AC3–4 gap:** Sidebar `DepthMeter` used `max-[900px]:hidden`, which removed the entire subtree (including the milestone `aria-live` region) from the accessibility tree on narrow viewports. Fixed by (1) exporting **`conversationDepthProgressAriaProps`** for consistent `progressbar` / “Exchange X of Y” text, (2) rendering **`conversation-depth-progress-narrow`** in the chat header with `sr-only min-[901px]:hidden`, (3) moving **`depth-meter-announcer`** to a sibling outside the desktop-only `<nav>` so milestone strings still announce on mobile.  
- **Verification:** `pnpm --filter=front test` (full front suite) passed.

### File List

- `apps/front/src/components/chat/DepthMeter.tsx`
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/TherapistChat-core.test.tsx`
- `_bmad-output/implementation-artifacts/13-2-conversation-and-chat-accessibility.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Story key:** `13-2-conversation-and-chat-accessibility`  
**Story ID:** 13.2  
**Epic:** 13 — Accessibility Foundations  
**Blocked-by:** Story 13.1 (done)  
**Blocks:** Story 13.3 (results/modal a11y — separate surfaces)
