# Story 4.2: Assessment Conversation Component

Status: done

## Story

As a **User**,
I want **to see my conversation with Nerin with my messages on one side and responses on the other**,
So that **the assessment feels like a natural dialogue**.

## Acceptance Criteria

**Given** I start an assessment
**When** the conversation component loads
**Then** I see Nerin's first message (warm greeting)
**And** message input field is ready for my response
**And** my message appears instantly when I send it (optimistic update)
**And** Nerin's response streams in word-by-word

**Given** the conversation grows to 20+ messages
**When** I scroll up
**Then** earlier messages are visible
**And** conversation context is preserved

**Given** I'm on mobile
**When** the component renders
**Then** layout is responsive and readable on small screens
**And** keyboard doesn't obscure message input

**Given** I click on any message I wrote (Story 5.3 integration)
**When** the click is registered
**Then** a side panel opens showing which facets this message contributed to
**And** each facet is clickable to navigate to profile

## Tasks / Subtasks

- [x] Task 1: Replace mock `useTherapistChat` with real API integration (AC: Messages flow through backend)
  - [x] Subtask 1.1: Wire `useStartAssessment()` into `/chat` route `beforeLoad` — replace client-side session ID generation with real `POST /api/assessment/start` call
  - [x] Subtask 1.2: Remove `generateMockResponse()` and mock response fallback from `useTherapistChat.ts`
  - [x] Subtask 1.3: Replace `setTimeout` delay with direct `useSendMessage()` integration — user message added optimistically, assistant response added on mutation success
  - [x] Subtask 1.4: Map `SendMessageResponse.precision` (5 trait decimals 0-1) to `TraitScores` state — remove random mock score increments
  - [x] Subtask 1.5: Handle `onError` for `SessionNotFound` (404), `AgentInvocationError` (503), `DatabaseError` (500) — display user-friendly error messages inline

- [x] Task 2: Add streaming response display (AC: Nerin's responses stream word-by-word)
  - [x] Subtask 2.1: N/A — Backend does not have streaming endpoint; using fallback path (Subtask 2.4)
  - [x] Subtask 2.2: N/A — Deferred to future story when backend SSE is available
  - [x] Subtask 2.3: N/A — Deferred to future story when backend SSE is available
  - [x] Subtask 2.4: **Fallback implemented:** Non-streaming `useSendMessage()` with animated typing indicator (3 bouncing dots) while waiting for response

- [x] Task 3: Implement error handling UI (AC: Users see clear feedback on failures)
  - [x] Subtask 3.1: Create `ErrorBanner` component for transient errors — auto-dismiss after 5 seconds, retry button
  - [x] Subtask 3.2: Handle `BudgetPausedError` (503) — show "Assessment paused — daily budget reached" (no auto-dismiss)
  - [x] Subtask 3.3: Handle `RateLimitExceeded` (429) — show "You've already started an assessment today. Come back tomorrow!" (no auto-dismiss)
  - [x] Subtask 3.4: Handle network errors (offline, timeout) — show "Connection lost" with retry button
  - [x] Subtask 3.5: Handle `SessionNotFound` (404) — redirect to `/chat` to create new session

- [x] Task 4: Mobile-responsive layout (AC: Layout is responsive and readable on small screens)
  - [x] Subtask 4.1: Traits sidebar collapses to bottom sheet on mobile (`md:` breakpoint) with floating BarChart3 button
  - [x] Subtask 4.2: Message bubbles use `max-w-[85%] lg:max-w-md` for mobile width
  - [x] Subtask 4.3: Input area sticks to bottom with `position: sticky` — keyboard push-up via `visualViewport` API
  - [x] Subtask 4.4: Header compact on mobile — reduced padding (`px-4 md:px-6 py-3 md:py-4`), smaller text (`text-xl md:text-2xl`)
  - [x] Subtask 4.5: Layout tested via responsive CSS classes; visual testing deferred to manual QA

- [x] Task 5: Message click handlers for future evidence highlighting (AC: User messages are clickable)
  - [x] Subtask 5.1: Added `onMessageClick(messageId)` callback prop on TherapistChat; user messages rendered as `<button>` elements
  - [x] Subtask 5.2: Added hover ring glow on user messages (`hover:ring-2 hover:ring-blue-300/40 transition-shadow`)
  - [x] Subtask 5.3: Side panel stub deferred — `onMessageClick` prop provides integration point for Story 5.3
  - [x] Subtask 5.4: Added `data-message-id` attribute to all message DOM elements

- [x] Task 6: Testing (AC: All acceptance criteria verified)
  - [x] Subtask 6.1: Unit test `useTherapistChat` hook — optimistic update verified (user message added before API responds)
  - [x] Subtask 6.2: Unit test `useTherapistChat` — assistant message added on success with correct precision mapping
  - [x] Subtask 6.3: Unit test error handling — SessionNotFound, BudgetPaused, RateLimit, network errors all tested
  - [x] Subtask 6.4: Unit test message click handler — `onMessageClick` fires with correct `messageId`, not for assistant messages
  - [x] Subtask 6.5: Component test TherapistChat — messages render, input works, send triggers mutation, typing indicator
  - [x] Subtask 6.6: Component test mobile layout — sidebar hidden on mobile, floating button present

## Dev Notes

### Current State (What Exists)

**TherapistChat component** (`apps/front/src/components/TherapistChat.tsx`) is fully built for Story 1.5 with:
- Bi-directional message display (user right, assistant left)
- Trait precision sidebar (5 Big Five traits with progress bars)
- Auto-scrolling message history
- Loading states with `Loader2` spinner
- "Start Assessment" welcome card
- Sign-up modal trigger after first user message (Story 4.1)

**useTherapistChat hook** (`apps/front/src/hooks/useTherapistChat.ts`) is MOCKED:
- `generateMockResponse()` returns keyword-based deterministic responses
- `useSendMessage()` RPC hook is called but response falls back to mock on error
- Trait scores update with random increments (not real AI scoring)
- `isCompleted` is hardcoded to `false`
- `setTimeout` adds 1-2 second artificial delay

**use-assessment hooks** (`apps/front/src/hooks/use-assessment.ts`) are READY:
- `useStartAssessment()` — `POST /api/assessment/start`
- `useSendMessage()` — `POST /api/assessment/message`
- `useGetResults(sessionId)` — `GET /api/assessment/:sessionId/results`
- `useResumeSession(sessionId)` — `GET /api/assessment/:sessionId/resume`
- All use TanStack Query mutations/queries with type-safe contracts

**Chat route** (`apps/front/src/routes/chat/index.tsx`) generates a client-side session ID. In production, this must call `useStartAssessment()` to create a real server-side session.

### API Contract Reference

**SendMessage Request:**
```typescript
// POST /api/assessment/message
{ sessionId: string, message: string }
```

**SendMessage Response:**
```typescript
{
  response: string,          // Nerin's text response
  precision: {
    openness: number,        // 0-1 decimal
    conscientiousness: number,
    extraversion: number,
    agreeableness: number,
    neuroticism: number,
  }
}
```

**StartAssessment Request/Response:**
```typescript
// POST /api/assessment/start
Request: { userId?: string }
Response: { sessionId: string, createdAt: DateTimeUtc }
```

**Error Responses:**
- `SessionNotFound` (404) — session doesn't exist
- `AgentInvocationError` (503) — includes budget paused, orchestration failure
- `DatabaseError` (500) — infrastructure failure
- `RateLimitExceeded` (429) — daily assessment limit reached

### Backend Integration Flow

```
User types message
  → optimistic: add user message to UI immediately
  → POST /api/assessment/message { sessionId, message }
  → handler → sendMessage use-case → orchestrator → Nerin agent
  → response: { response, precision }
  → add assistant message to UI
  → update trait precision scores in sidebar
```

**Budget enforcement** happens in the orchestrator router node. If daily cost exceeds $75, the backend returns `AgentInvocationError` (mapped from `BudgetPausedError`) with a message indicating when to resume.

### Streaming Strategy

The current backend does NOT have a streaming endpoint. The `sendMessage` contract returns a complete response.

**Phase 1 (This story):** Use non-streaming `useSendMessage()`. Show a typing indicator (animated dots in assistant bubble) while waiting for the response. This is acceptable because:
- Average response time is 2-5 seconds
- Typing indicator provides adequate feedback
- Backend streaming requires SSE endpoint changes (separate story)

**Phase 2 (Future):** Add SSE streaming endpoint. The `useStreamingMessage` hook stub should be designed so it can be plugged in without changing TherapistChat component.

### Optimistic Update Pattern

```typescript
// In useTherapistChat hook
const sendMessage = useCallback(async (userMessage: string) => {
  // 1. Add user message immediately (optimistic)
  setMessages(prev => [...prev, {
    id: `msg-${Date.now()}`,
    role: "user",
    content: userMessage,
    timestamp: new Date(),
  }]);

  // 2. Show typing indicator
  setIsLoading(true);

  // 3. Call real API
  sendMessageRpc(
    { sessionId, message: userMessage },
    {
      onSuccess: (data) => {
        // 4. Add assistant message
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-response`,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        }]);
        // 5. Update precision
        setTraits({
          openness: data.precision.openness,
          conscientiousness: data.precision.conscientiousness,
          extraversion: data.precision.extraversion,
          agreeableness: data.precision.agreeableness,
          neuroticism: data.precision.neuroticism,
          opennessPrecision: Math.round(data.precision.openness * 100),
          conscientiousnessPrecision: Math.round(data.precision.conscientiousness * 100),
          extraversionPrecision: Math.round(data.precision.extraversion * 100),
          agreeablenessPrecision: Math.round(data.precision.agreeableness * 100),
          neuroticismPrecision: Math.round(data.precision.neuroticism * 100),
        });
        setIsLoading(false);
      },
      onError: (error) => {
        // 6. Show error, keep user message visible
        setErrorMessage(parseApiError(error));
        setIsLoading(false);
      },
    }
  );
}, [sessionId, sendMessageRpc]);
```

### Session Initialization (Route Change)

The `/chat` route currently generates a client-side session ID. This must be replaced:

```typescript
// apps/front/src/routes/chat/index.tsx
export const Route = createFileRoute("/chat/")({
  validateSearch: (search) => ({
    sessionId: (search.sessionId as string) || undefined,
  }),
  beforeLoad: async (context) => {
    const { search } = context;
    if (!search.sessionId) {
      // Call real API to create session
      const response = await fetch(`${API_URL}/api/assessment/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      const data = await response.json();
      throw redirect({
        to: "/chat",
        search: { sessionId: data.sessionId },
      });
    }
  },
  component: RouteComponent,
});
```

### Error Display Pattern

```tsx
// ErrorBanner component
function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mx-4 mb-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg flex items-center justify-between">
      <p className="text-sm text-red-200">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-red-300 hover:text-white">
            Retry
          </button>
        )}
        <button onClick={onDismiss} className="text-xs text-red-400 hover:text-red-200">
          ×
        </button>
      </div>
    </div>
  );
}
```

### Mobile Layout Strategy

**Desktop (md+):** Current layout — messages left, traits sidebar right (80px wide)
**Tablet (768px):** Sidebar narrows to 64px or collapsible
**Mobile (<768px):** Sidebar hidden, accessible via bottom sheet or floating button

```tsx
// Responsive sidebar
<div className="hidden md:flex md:w-80 flex-col">
  {/* Full sidebar on desktop */}
</div>

{/* Mobile: floating precision button */}
<div className="md:hidden fixed bottom-20 right-4">
  <button onClick={() => setShowMobileTraits(true)}
    className="bg-slate-700 rounded-full p-3 shadow-lg">
    <BarChart3 className="h-5 w-5 text-white" />
  </button>
</div>
```

**Keyboard handling:** Use `visualViewport` API to detect keyboard:
```typescript
useEffect(() => {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const onResize = () => {
    // When keyboard opens, viewport height shrinks
    // Scroll input into view
    inputRef.current?.scrollIntoView({ block: "nearest" });
  };
  viewport.addEventListener("resize", onResize);
  return () => viewport.removeEventListener("resize", onResize);
}, []);
```

### Styling Guidelines (Existing Dark Theme)

Maintain consistency with existing TherapistChat styling:

| Element | Classes |
|---------|---------|
| Background | `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` |
| Header | `bg-slate-800/50 border-b border-slate-700` |
| User bubble | `bg-gradient-to-r from-blue-500 to-purple-500 text-white` |
| Assistant bubble | `bg-slate-700/50 border border-slate-600 text-gray-100` |
| Input field | `bg-slate-700 border-slate-600 text-white` |
| Sidebar | `bg-slate-800/50 border-slate-700` |
| Send button | `bg-gradient-to-r from-blue-500 to-purple-500` |
| Error banner | `bg-red-900/20 border-red-700/30 text-red-200` |
| Success banner | `bg-green-900/20 border-green-700/30 text-green-200` |

### Testing Strategy

**Framework:** Vitest + @testing-library/react (jsdom environment)
**Location:** `apps/front/src/hooks/useTherapistChat.test.ts` and `apps/front/src/components/TherapistChat.test.tsx`

**Mock Pattern:**
```typescript
// @vitest-environment jsdom
import { vi } from "vitest";

// Mock the assessment hooks
vi.mock("@/hooks/use-assessment", () => ({
  useSendMessage: () => ({
    mutate: vi.fn((input, callbacks) => {
      // Simulate success
      callbacks?.onSuccess?.({
        response: "Mock Nerin response",
        precision: { openness: 0.65, conscientiousness: 0.55, extraversion: 0.60, agreeableness: 0.50, neuroticism: 0.40 },
      });
    }),
    isPending: false,
  }),
  useStartAssessment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ sessionId: "test-session-123" }),
    isPending: false,
  }),
}));
```

**Test Cases:**
1. Optimistic update: user message appears in DOM before API response
2. Assistant message: appears after `onSuccess` callback fires
3. Precision update: sidebar scores match API response values
4. Error handling: error banner shows on `onError`
5. Loading state: typing indicator visible during pending mutation
6. Mobile: sidebar hidden on small viewport, accessible via button

### What NOT to Change

- **SignUpModal integration** — already working from Story 4.1, leave as-is
- **Auth hook** — already handles `anonymousSessionId`, no changes needed
- **use-assessment.ts** — hooks are ready, only wire them in
- **TherapistChat layout** — keep existing structure, only modify for real data + mobile + errors
- **Trait sidebar component** — keep existing design, just feed it real data

### Dependencies

- **Requires:** Backend `POST /api/assessment/start` and `POST /api/assessment/message` endpoints working (Epic 2 ✅)
- **Requires:** CORS configured on API server (Task #1 from Story 4.1 notes — may need to verify)
- **Enables:** Story 4.3 (Session Resumption), Story 4.4 (Optimistic Updates & Progress), Story 5.3 (Evidence Highlighting)

### References

**Files to Modify:**
- `apps/front/src/hooks/useTherapistChat.ts` — Replace mock with real API integration
- `apps/front/src/components/TherapistChat.tsx` — Add error handling UI, mobile responsive, message click handlers
- `apps/front/src/routes/chat/index.tsx` — Replace client-side session ID with `useStartAssessment()` call

**Files to Create:**
- `apps/front/src/components/ErrorBanner.tsx` — Reusable error display component
- `apps/front/src/hooks/useTherapistChat.test.ts` — Hook unit tests
- (Update existing) `apps/front/src/components/TherapistChat.test.tsx` — Extended component tests

**Files to Reference (Read-Only):**
- `apps/front/src/hooks/use-assessment.ts` — Ready-to-use TanStack Query hooks
- `packages/contracts/src/http/groups/assessment.ts` — API contract definitions
- `packages/contracts/src/errors.ts` — Error types for handling
- `apps/api/src/handlers/assessment.ts` — Backend handler (understand error mapping)
- `apps/front/src/hooks/use-auth.ts` — Auth state for conditional UI
- `packages/ui/src/components/button.tsx` — shadcn/ui Button component
- `packages/ui/src/components/card.tsx` — shadcn/ui Card component

**Architecture Decisions:**
- [ADR-6 Hexagonal Architecture](../../_bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md)
- [UX Design Specification](../../_bmad-output/planning-artifacts/ux-design-specification.md) — Assessment conversation flow (Phases 2-4)

**Previous Story:**
- [Story 4.1: Authentication UI](./4-1-authentication-ui-sign-up-modal.md) — SignUpModal integration, CORS issue noted

## Dev Agent Record

### Implementation Plan

1. **Task 1 (API Integration):** Replaced client-side session ID generation in `/chat` route with real `POST /api/assessment/start` call. Rewrote `useTherapistChat` hook to remove all mock logic (`generateMockResponse`, `setTimeout` delay, random trait increments) and integrate directly with `useSendMessage()` mutation. Added `parseApiError()` function for structured error classification (session/budget/rate-limit/network/generic).

2. **Task 2 (Streaming Fallback):** Backend lacks SSE streaming endpoint — implemented animated typing indicator (3 bouncing dots) as the fallback approach per Dev Notes. The `TypingIndicator` component renders when `isLoading` is true and disappears when the complete response arrives.

3. **Task 3 (Error Handling):** Created `ErrorBanner` component with auto-dismiss (5s for transient, persistent for budget/rate-limit). Error type determines: retry button visibility (network/generic only), auto-dismiss behavior, and SessionNotFound triggers redirect.

4. **Task 4 (Mobile Responsive):** Extracted `TraitSidebar` component shared between desktop sidebar and mobile bottom sheet. Desktop shows sidebar via `hidden md:flex md:w-80`. Mobile uses floating BarChart3 button that opens a bottom sheet overlay. Header uses responsive padding/text size. Message bubbles use `max-w-[85%]` on mobile. Input sticks to bottom with `visualViewport` keyboard handling.

5. **Task 5 (Message Click):** User messages render as `<button>` elements (proper a11y) with `data-message-id` attribute. `onMessageClick` prop on TherapistChat allows parent to handle clicks. Hover ring glow effect provides visual affordance. Assistant messages are non-interactive `<div>` elements.

6. **Task 6 (Testing):** 13 hook unit tests + 18 component tests covering all acceptance criteria. Hook tests verify: optimistic updates, API response handling, precision mapping, all error types (session/budget/rate-limit/network), error clearing. Component tests verify: rendering, interactions, typing indicator, error banner, message click handlers, mobile layout.

### Debug Log

- Biome a11y lint errors on initial implementation: `noStaticElementInteractions` (div with onClick) and `useSemanticElements` (div with role="button"). Fixed by using native `<button>` for user messages and backdrop.
- Pre-existing Playwright e2e files cause Vitest to report "3 failed suites" — these are not unit test failures but Playwright files incorrectly resolved by Vitest. All 46 actual unit/component tests pass.

### Completion Notes

- All 6 tasks and all subtasks completed
- 46 unit/component tests passing (13 hook + 18 component + 15 existing SignUpModal)
- 111 API tests passing (no regressions)
- Lint passes cleanly across full monorepo
- Streaming (Task 2) uses fallback typing indicator per Dev Notes — SSE streaming deferred to future story
- Side panel evidence display (Subtask 5.3) stubbed via `onMessageClick` prop — full implementation in Story 5.3
- Viewport testing (Subtask 4.5) uses responsive CSS breakpoints; manual QA recommended for visual verification

## File List

### New Files
- `apps/front/src/components/ErrorBanner.tsx` — Reusable error banner with auto-dismiss and retry
- `apps/front/src/hooks/useTherapistChat.test.ts` — 13 hook unit tests
- `apps/front/e2e/chat-assessment.spec.ts` — Playwright E2E tests for assessment conversation

### Modified Files
- `apps/front/src/hooks/useTherapistChat.ts` — Replaced mock implementation with real API integration
- `apps/front/src/components/TherapistChat.tsx` — Added error handling, typing indicator, mobile responsive layout, message click handlers
- `apps/front/src/components/TherapistChat.test.tsx` — Extended from 11 to 18 tests covering new functionality
- `apps/front/src/routes/chat/index.tsx` — Replaced client-side session ID with real API call
- `apps/front/vitest.config.ts` — Added e2e exclusion to prevent Playwright/Vitest collision

### Tracking Files (Non-Code)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status: ready-for-dev → in-progress → review
- `_bmad-output/implementation-artifacts/4-2-assessment-conversation-component.md` — Story file updated

## Change Log

- **2026-02-06:** Story 4.2 implementation complete — replaced mock chat with real API integration, added error handling UI, mobile responsive layout, typing indicator, message click handlers, and comprehensive test suite (46 tests passing)
- **2026-02-06:** Code review fixes — Fixed critical confidence display bug (backend returns 0-100 integers, frontend was multiplying by 100 twice producing 0-10000% values). Removed double `* 100` in hook and sidebar. Replaced `window.location.href` redirect with TanStack Router `useNavigate()`. Fixed auto-scroll useEffect firing on every render. Updated test mocks to match real backend contract (0-100 integers). Added missing files to File List (e2e spec, vitest config).
