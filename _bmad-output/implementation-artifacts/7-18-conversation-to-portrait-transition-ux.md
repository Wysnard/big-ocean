# Story 7.18: Conversation-to-Portrait Transition UX

Status: in-progress

<!-- Source: design-thinking-2026-02-20.md, Prototype I -->
<!-- Priority 4 — Transition UX -->
<!-- Depends on: Stories 7.1-7.11 (design tokens, auth gate, results page) -->
<!-- Backend + Frontend cross-cutting story -->

## Story

As a **User who has just completed the 30-minute assessment conversation with Nerin**,
I want **the transition from conversation to portrait to feel like a seamless emotional arc — Nerin's farewell building anticipation, a gentle auth moment that rides that anticipation, a meditative wait while Nerin "writes," and a portrait-first reveal that lands with impact**,
So that **the most emotionally charged moment in the experience feels intimate and personal rather than clinical, and I'm compelled to create an account at the peak of engagement**.

## Acceptance Criteria

### Beat 1: Nerin's Farewell

1. **Given** the user sends the message that reaches the free-tier threshold **When** the orchestrator processes it **Then** the API response includes `isFinalTurn: true` and a `farewellMessage` string randomly picked from a pool of 3 hardcoded farewell messages
   **And** the chat input fades gently (not abrupt disable)
   **And** no system-language celebration card appears ("Your Personality Profile is Ready!" is removed)

2. **Given** the farewell has rendered **When** I view the chat **Then** it looks like a normal Nerin message (same avatar, same bubble style) — not a system card or special UI element
   **And** the farewell is 2-3 sentences maximum — warm, anticipation-building, no analysis, no summary
   **And** the farewell is one of:
     - "We've gone somewhere real today. I'm going to sit with everything you've told me — and I want to write something for you. Give me a moment."
     - "This was a good dive. I've been quietly building a picture of you this whole time — and I think you'll find it interesting. Let me put it together."
     - "Thank you for going there with me. There's a thread running through everything you've said today — I want to take a moment to trace it properly. I'll have something for you soon."

### Beat 1.5: Auth Gate (Anonymous Users Only)

3. **Given** I am NOT authenticated **When** Nerin's farewell renders **Then** a Nerin-themed auth gate appears below the farewell in the chat flow — not on a separate page
   **And** the gate copy is Nerin-voiced: "Create an account so your portrait is here when it's ready."
   **And** the gate has two CTAs: [Sign Up] and [Already have an account? Sign In]
   **And** the gate does NOT show: blurred GeometricSignature, "Your Personality Profile is Ready!", masked archetype name, or "Keep Exploring" button
   **And** the gate feels like a continuation of the conversation, not a system interruption

4. **Given** I am already authenticated **When** Nerin's farewell renders **Then** the auth gate is skipped entirely
   **And** the transition flows directly from farewell → wait screen with no interruption

5. **Given** the auth gate is showing **When** I complete sign-up or sign-in **Then** the gate fades and the wait screen begins immediately in the same space
   **And** portrait generation fires ONLY after authentication succeeds (zero LLM cost for anonymous users who bounce)

6. **Given** I am an anonymous user who closes the browser before signing up **When** I return within 24 hours **Then** my session is preserved (existing localStorage mechanism) and I can complete auth to view results

### Beat 2: The Wait

7. **Given** authentication has succeeded (or was already present) **When** finalization begins **Then** a dedicated wait screen appears — clean, ocean-themed background, continuation of conversation aesthetic
   **And** the wait is NOT a generic spinner with "Calculating your personality profile..."
   **And** the wait shows Nerin-voiced rotating lines at ~8-second intervals:
     - "Sitting with everything you told me..."
     - "Following the thread..."
     - "Tracing the pattern..."
     - "Finding the right words..."
   **And** a gentle breathing/wave animation accompanies the text (not a spinner, not a progress bar)
   **And** a minimum wait time enforced before the reveal (default 10 seconds in production, configurable via `PORTRAIT_WAIT_MIN_MS` env var for testing)

8. **Given** finalization is in progress **When** the wait screen is showing **Then** finalization (analysis + scoring + portrait generation) fires NOW — not before auth
   **And** the wait screen handles the actual loading state of the `get-results` API call

### Beat 3: The Reveal

9. **Given** finalization completes and the minimum wait time has passed **When** the portrait is ready **Then** the wait area transforms to show: "Your portrait is ready." with a button: "Read what Nerin wrote"
   **And** the CTA language is "Read what Nerin wrote" (not "View Results")

10. **Given** I click "Read what Nerin wrote" **When** navigation occurs **Then** I see a portrait-first reading experience — full screen, clean, minimal
    **And** the portrait (Nerin's written letter) is the only content visible above the fold
    **And** no trait cards, radar charts, OCEAN code, or geometric signature compete for attention
    **And** the portrait renders in a comfortable reading format (generous line height, warm background)

11. **Given** I have finished reading the portrait **When** I scroll to the bottom or click a prompt **Then** I see "See your full personality profile →"
    **And** clicking it reveals/navigates to the full results page (hero, trait cards, radar, OCEAN code — the analytical layer)

### Cross-Cutting

12. **Given** I use the application in dark mode **When** the transition sequence plays **Then** all beats (farewell, auth gate, wait, reveal) use appropriate dark mode tokens
    **And** the wait screen uses ocean-dark aesthetic (Abyss Navy, breathing animation)

13. **Given** I have `prefers-reduced-motion` enabled **When** the transition plays **Then** the chat input disappears instantly (no fade), rotating lines update without animation, breathing animation is static, reveal is instant

14. **Given** I view the transition on mobile **When** the layout adapts **Then** all beats are fully functional and readable on mobile viewports (375px+)
    **And** all touch targets are >= 44px

## Tasks / Subtasks

### Task 1: Backend — Farewell Pool & Final Turn Detection (AC: #1, #2)

- [x] 1.1 Create farewell message pool (`packages/domain/src/constants/nerin-farewell.ts`)
  - [x] Export `NERIN_FAREWELL_MESSAGES: readonly string[]` with 3 messages:
    1. "We've gone somewhere real today. I'm going to sit with everything you've told me — and I want to write something for you. Give me a moment."
    2. "This was a good dive. I've been quietly building a picture of you this whole time — and I think you'll find it interesting. Let me put it together."
    3. "Thank you for going there with me. There's a thread running through everything you've said today — I want to take a moment to trace it properly. I'll have something for you soon."
  - [x] Export `pickFarewellMessage(): string` — picks one at random (`Math.floor(Math.random() * pool.length)`)
- [x] 1.2 Extend orchestrator router to detect final turn (when `messageCount >= threshold`)
  - [x] Add `isFinalTurn` flag to orchestrator graph state
  - [x] When final turn detected, skip Nerin LLM call — use `pickFarewellMessage()` as the response instead
- [x] 1.3 Add `portraitWaitMinMs` to AppConfig
  - [x] Add `readonly portraitWaitMinMs: number` to `AppConfigService` interface (`packages/domain/src/config/app-config.ts`)
  - [x] Add `PORTRAIT_WAIT_MIN_MS` env var to live config (`packages/infrastructure/src/config/app-config.live.ts`) with `Config.withDefault(10000)` (10s production default)
  - [x] Add `portraitWaitMinMs: 2000` to mock config (`packages/domain/src/config/__mocks__/app-config.ts`) so tests run fast
  - [x] The frontend reads this value from a new API endpoint or from the `isFinalTurn` response payload (see Task 4.2)
- [x] 1.4 Update send-message use-case response to include `isFinalTurn` and `farewellMessage`
  - [x] Extend API response schema in contracts: `isFinalTurn: S.Boolean` (default `false`), `farewellMessage: S.optional(S.String)`
  - [x] When `isFinalTurn: true`, `farewellMessage` contains the picked farewell; `response` field can be empty or also contain the farewell
  - [x] Frontend receives flags to trigger transition flow
- [x] 1.5 Unit test: farewell triggers on correct message count
- [x] 1.6 Unit test: `isFinalTurn: true` and `farewellMessage` present at threshold
- [x] 1.7 Unit test: `pickFarewellMessage()` returns one of the 3 pool messages

### Task 2: Frontend — Farewell Display & Chat Input Fade (AC: #1, #2)

- [x] 2.1 Remove celebration card from TherapistChat (`TherapistChat.tsx` lines ~610-643)
  - [x] Remove "Your Personality Profile is Ready!" card
  - [x] Remove "View Results" button from celebration card
  - [x] Remove "Keep Exploring" disabled button
- [x] 2.2 Remove header "View Your Results" link that appears on completion (`TherapistChat.tsx` lines ~489-497)
- [x] 2.3 Implement chat input fade on `isFinalTurn`
  - [x] Gentle fade-out animation (300ms opacity transition)
  - [x] `prefers-reduced-motion`: instant hide (motion-safe prefix)
  - [x] No placeholder text change (input just disappears)
- [x] 2.4 Handle `isFinalTurn` response flag in `useTherapistChat` hook
  - [x] Set new state: `isFarewellReceived` when `isFinalTurn: true` from API
  - [x] Trigger transition flow instead of showing celebration card

### Task 3: Frontend — Auth Gate Redesign on Chat Page (AC: #3, #4, #5, #6)

- [x] 3.1 Create `ChatAuthGate` component (`apps/front/src/components/ChatAuthGate.tsx`)
  - [x] Nerin-themed card that appears inline in chat below the farewell
  - [x] Copy: "Create an account so your portrait is here when it's ready."
  - [x] Two CTAs: [Sign Up] · [Already have an account? Sign In]
  - [x] Embedded sign-up/sign-in forms (reuse `ResultsSignUpForm` / `ResultsSignInForm`)
  - [x] Same chat aesthetic (NerinMessage wrapper, matches conversation visual)
  - [x] `data-slot="chat-auth-gate"` attribute
- [x] 3.2 Wire auth gate into TherapistChat
  - [x] Show `ChatAuthGate` when `isFarewellReceived && !isAuthenticated`
  - [x] Skip entirely when `isAuthenticated`
  - [x] On auth success: isAuthenticated change triggers next beat
- [x] 3.3 Preserve 24-hour localStorage session persistence
  - [x] Reuse existing `results-auth-gate-storage.ts` logic
  - [x] Chat route checks localStorage for pending session before creating new one
  - [x] Anonymous users returning within 24h redirected to existing session
- [x] 3.4 Handle expired sessions
  - [x] Show: "This dive session has ended. Sign up to start a new one." on chat route
  - [x] Nerin-themed (font-heading, clean layout), not system-themed

### Task 4: Frontend — Wait Screen (AC: #7, #8)

- [x] 4.1 Create `PortraitWaitScreen` component (`apps/front/src/components/PortraitWaitScreen.tsx`)
  - [x] Full viewport, ocean-dark background (continuation of conversation aesthetic)
  - [x] Gentle breathing/wave animation (CSS keyframes, not JS — no spinner, no progress bar)
  - [x] Rotating Nerin-voiced text lines at ~8-second intervals:
    - "Sitting with everything you told me..."
    - "Following the thread..."
    - "Tracing the pattern..."
    - "Finding the right words..."
  - [x] Text transitions: soft fade (400ms) between lines
  - [x] `prefers-reduced-motion`: instant text swap, static background
  - [x] `data-slot="portrait-wait-screen"` attribute
- [x] 4.2 Enforce configurable minimum wait (`portraitWaitMinMs`)
  - [x] Read `portraitWaitMinMs` from backend config — Option A: included in `isFinalTurn` response payload
  - [x] Default: 10000ms (10s) in production via `PORTRAIT_WAIT_MIN_MS` env var
  - [x] Tests set `PORTRAIT_WAIT_MIN_MS=2000` (2s) so automated tests don't wait 10s
  - [x] Docker compose test config (`compose.test.yaml`): add `PORTRAIT_WAIT_MIN_MS=2000`
  - [x] Start timer when wait screen mounts
  - [x] Even if `get-results` API resolves faster, hold until minimum elapsed
  - [x] If API takes longer than minimum, show as soon as ready
- [x] 4.3 Trigger finalization on wait screen mount
  - [x] Call `get-results` API (which triggers finalization) ONLY after auth succeeds
  - [x] For already-authenticated users: trigger immediately after farewell
  - [x] Handle API errors gracefully (show Nerin-voiced error, offer retry)
- [x] 4.4 When results ready + minimum wait elapsed:
  - [x] Transition to reveal prompt: "Your portrait is ready."
  - [x] Button: "Read what Nerin wrote"
  - [x] Soft fade transition from rotating lines to reveal prompt

### Task 5: Frontend — Portrait-First Reveal Layout (AC: #10, #11)

- [x] 5.1 Create `PortraitReadingView` component (`apps/front/src/components/results/PortraitReadingView.tsx`)
  - [x] Full-screen, clean reading experience
  - [x] Portrait content only — no trait cards, no radar, no OCEAN code, no geometric signature
  - [x] Comfortable reading format: generous line height (1.7), warm background, max-width 720px, centered
  - [x] Portrait renders as markdown (reuses existing `portrait-markdown.tsx` utilities)
  - [x] `data-slot="portrait-reading-view"` attribute
- [x] 5.2 Add "See your full personality profile →" prompt at portrait bottom
  - [x] Unobtrusive but clear — muted text, ArrowRight icon
  - [x] Clicking navigates to full results page (existing `ProfileView` with hero, traits, radar, etc.)
- [x] 5.3 Update results route to support portrait-first flow
  - [x] Option A: Query param `?view=portrait` renders `PortraitReadingView`, default renders `ProfileView`
  - [x] "Read what Nerin wrote" button navigates to portrait view (`/results/$sessionId?view=portrait`)
  - [x] "See your full personality profile →" navigates to full profile view (removes `view` param)
- [x] 5.4 Ensure full results page still works independently (direct URL access, returning users)

### Task 6: Navigation Flow Updates (AC: all)

- [x] 6.1 Update navigation flow:
  - [x] Chat completion → farewell displayed → auth gate (if needed) → wait screen → "Read what Nerin wrote" → portrait view → full results
  - [x] Remove old navigation: celebration card "View Results" removed in Task 2
- [x] 6.2 Update `ResultsAuthGate` component
  - [x] Kept `ResultsAuthGate` as a fallback for direct URL access (existing behavior preserved)
- [x] 6.3 Update bidirectional navigation
  - [x] From portrait reading view: "See your full personality profile →" → full results
  - [x] From full results: "Read your portrait again" → portrait reading view
  - [x] From full results: "Continue conversation" → chat (existing)
- [x] 6.4 Handle edge cases
  - [x] User refreshes during wait screen → re-renders chat (farewell state is session-only)
  - [x] User navigates directly to results URL → full results page (default, no `?view` param)
  - [x] User navigates back from portrait → standard browser history

### Task 7: Update Integration & E2E Tests (AC: #1, #5, #8)

- [x] 7.1 Update `SendMessageResponseSchema` contract test (`packages/contracts/src/__tests__/http-contracts.test.ts`)
  - [x] `isFinalTurn: boolean` in valid response fixture (done in Task 1)
  - [x] Schema accepts `isFinalTurn: true` and `false` with optional farewell fields
  - [x] Schema rejects missing `isFinalTurn`
- [x] 7.2 Update integration test: send-message response schema validation (`apps/api/tests/integration/assessment.test.ts`)
  - [x] Normal messages validate `isFinalTurn: false`
  - [x] 3rd message (at threshold) returns 200 with `isFinalTurn: true` and `farewellMessage`
  - [x] Updated from 403 expectation to 200 farewell response
- [x] 7.3 Update integration test: get-results endpoint
  - [x] Get-results test updated to work with farewell flow (3rd message returns 200, not 403)
  - [x] Portrait generation still validated via `personalDescription` in results
- [x] 7.4 Unit tests for farewell detection logic (done in Task 1)
  - [x] `isFinalTurn: true` and `farewellMessage` at threshold
  - [x] `isFinalTurn: false` before threshold
  - [x] `pickFarewellMessage()` returns pool message
  - [x] No LLM call on final turn, farewell saved as assistant message
  - [x] `portraitWaitMinMs` from config at threshold
- [x] 7.5 Mock orchestrator unchanged — farewell logic is in use-case, not orchestrator

### Task 8: Build & Verification (AC: all)

- [x] 8.1 `pnpm build` — 0 errors
- [x] 8.2 `pnpm lint` — no new warnings (5 pre-existing)
- [x] 8.3 `pnpm test:run` — all pass (175 frontend + 183 API)
- [x] 8.4 `pnpm test:integration` — 20/20 pass (fixed pre-existing issues: confidence removed from lean response, trait levels use trait-specific letters not H/M/L, default OCEAN code is GBANT)
- [ ] 8.5 Manual verification: full flow (chat → farewell → auth gate → wait → reveal → portrait → full results)
- [ ] 8.6 Manual verification: authenticated user flow (chat → farewell → wait → reveal → portrait → full results)
- [ ] 8.7 Manual verification: dark mode, mobile, `prefers-reduced-motion`

## Dev Notes

### This is a Cross-Cutting Story (Backend + Frontend)

Unlike most Epic 7 stories (frontend-only), this story requires a small backend change: the orchestrator must detect the final turn and instruct Nerin to generate a farewell. The frontend changes are more substantial.

**Backend scope is small:**
1. Detect final turn in orchestrator router
2. Pick farewell from hardcoded pool of 3 messages (no LLM call — saves cost and latency)
3. Add `isFinalTurn` + `farewellMessage` to API response
4. Add `portraitWaitMinMs` to AppConfig (`PORTRAIT_WAIT_MIN_MS` env var, default 10000ms)

**Frontend scope is the bulk:**
1. Remove celebration card
2. Display farewell as normal message
3. New `ChatAuthGate` component on chat page
4. New `PortraitWaitScreen` component
5. New `PortraitReadingView` component/route
6. Navigation flow rewiring

### Design Principles (from Prototype I)

- **No system language during the transition.** The entire sequence from farewell to portrait should feel like it's between the user and Nerin — not the user and the product.
- **No upsell at the emotional peak.** Premium prompts belong on the full profile page, AFTER the portrait.
- **The farewell IS the teaser.** More compelling than blurred geometric shapes because Nerin just built 20 messages of trust.
- **Portrait first, everything else second.** The portrait is a letter from someone who listened for 20 minutes. It should be read like a letter — private, focused, uninterrupted.
- **The wait is part of the experience.** It should feel like a person taking time to think, not a system processing a request.

### Language Audit (Replace These)

| Current Language | New Language |
|---|---|
| "Your Personality Profile is Ready!" | Replaced by Nerin's farewell |
| "Sign Up to See Your Results" | "Create an account so your portrait is here when it's ready." |
| "View Results" button | "Read what Nerin wrote" |
| "Calculating your personality profile..." | "Following the thread..." / "Finding the right words..." |
| "Keep Exploring" (disabled) | Removed entirely |
| Chat placeholder: "Keep exploring with Premium..." | Chat input fades gently |
| Blurred GeometricSignature + masked archetype | Removed — Nerin's farewell IS the teaser |

### Cost-Saving Architecture

The auth gate sits BETWEEN farewell and portrait generation. Portrait only generates for authenticated users:

```
Anonymous user bounces at auth gate → $0 LLM portrait cost
Anonymous user signs up → portrait generates → LLM cost incurred
Already-authenticated user → portrait generates immediately → LLM cost incurred
```

This is a deliberate cost optimization: the farewell serves as a conversion hook without requiring any expensive generation. The wait screen only appears AFTER auth succeeds.

### Project Structure Notes

```
apps/api/src/
  handlers/assessment.ts                          # MODIFY: add isFinalTurn to response
  use-cases/send-message.use-case.ts             # MODIFY: detect final turn, pass to orchestrator

packages/domain/src/
  config/app-config.ts                            # MODIFY: add portraitWaitMinMs to AppConfigService
  config/__mocks__/app-config.ts                  # MODIFY: add portraitWaitMinMs: 2000 to mock
  constants/nerin-farewell.ts                     # NEW: farewell message pool (3 messages) + pickFarewellMessage()

packages/contracts/src/
  http/groups/assessment.ts                       # MODIFY: extend response schema with isFinalTurn

packages/infrastructure/src/
  config/app-config.live.ts                       # MODIFY: add PORTRAIT_WAIT_MIN_MS env var (default 10000)
  repositories/orchestrator.langgraph.repository.ts  # MODIFY: detect final turn in router

apps/front/src/
  components/
    TherapistChat.tsx                             # MODIFY: remove celebration card, add farewell/transition flow
    ChatAuthGate.tsx                              # NEW: Nerin-themed auth gate for chat page
    PortraitWaitScreen.tsx                        # NEW: rotating Nerin lines wait screen
    results/
      PortraitReadingView.tsx                     # NEW: portrait-first reading experience
      ProfileView.tsx                             # MODIFY: add "Read your portrait again" link
  hooks/
    useTherapistChat.ts                           # MODIFY: handle isFinalTurn flag
  routes/
    results/$assessmentSessionId.tsx              # MODIFY: support portrait-first routing
  lib/
    results-auth-gate-storage.ts                  # KEEP: reuse 24h localStorage persistence
```

### Anti-Patterns

```
DO NOT show "Your Personality Profile is Ready!" or any system celebration card
DO NOT show blurred GeometricSignature or masked archetype name as conversion bait
DO NOT use a spinner or progress bar on the wait screen
DO NOT show percentage counters or "Generating your report..."
DO NOT show trait cards, radar charts, or OCEAN code in the portrait reading view
DO NOT show premium upsell during the farewell-to-portrait transition
DO NOT use an LLM call for the farewell — use the hardcoded pool in `nerin-farewell.ts` (saves cost and latency)
DO NOT fire portrait generation before authentication succeeds (cost optimization)
DO NOT skip the minimum wait (it's part of the emotional design — use `portraitWaitMinMs` from AppConfig, never hardcode the duration)
DO NOT make the auth gate look like a separate system page — it's part of the conversation
DO NOT navigate away from the chat page for the auth gate
```

### Previous Story Intelligence

**From Story 7.17 (Homepage Narrative Rewrite) — done:**
- ChatBubble component supports `nerin`, `user`, and `vincent` variants
- All conversation infrastructure (DepthScrollProvider, ConversationFlow, MessageGroup) is stable
- Build: 0 errors, Lint: clean, Tests: all passing (389 total)
- Anti-pattern confirmed: no modifications to infrastructure components

**From Story 7.11 (Auth-Gated Results Reveal) — done:**
- `ResultsAuthGate` component exists with teaser + sign-up/sign-in flow
- `ResultsSignUpForm` and `ResultsSignInForm` components exist and are reusable
- Better Auth hooks link `assessment_session.user_id` on both sign-up and sign-in
- Backend backfills `assessment_message.user_id` for historical messages
- 24-hour localStorage persistence (`results-auth-gate-storage.ts`) is implemented
- The auth gate currently lives on the results page — this story moves it to the chat page

**From Story 7.10 (Assessment Chat Depth Journey) — done:**
- DepthZoneProvider, DepthMeter, zone transitions all working
- Chat components in both `packages/ui` and `apps/front`
- Zone calculation based on message count (not scroll)
- GeometricOcean ambient layer (Story 7.16) is present

**From Story 2.14 (Nerin Greeting Sequence) — done (most recent):**
- Greeting is now 2 messages (was 3), farewell pattern can follow similar approach
- Nerin system prompt modifications are well-tested pattern
- `nerin-greeting.ts` shows how to add prompt sections for specific conversation phases

### Git Intelligence

Recent commits show:
- `feat(story-2-14)`: Nerin greeting sequence redesign — same pattern of modifying Nerin's system prompt for specific conversation phases
- `feat(story-8-7)`: Portrait prompt rework — understanding of portrait generation pipeline
- `feat(story-2-13)`: Nerin chat foundation with beliefs, threading, mirror library — deep familiarity with Nerin agent internals
- `feat(story-7-17)`: Homepage narrative rewrite — component patterns and ChatBubble variants

### Key Technical Decisions

1. **Farewell message**: Hardcoded pool of 3 messages in `nerin-farewell.ts`, randomly picked at final turn. No LLM call — saves cost, eliminates latency, and guarantees quality. Same domain constants pattern as `nerin-greeting.ts` from Story 2.14.

2. **Auth gate location**: On the chat page, below the farewell message. NOT on a separate results page. This preserves the conversation context and rides Nerin's anticipation.

3. **Portrait-first reveal**: Two options considered:
   - **Option A (Recommended)**: Query param `?view=portrait` on existing results route
   - **Option B**: Separate route `/results/$sessionId/portrait`
   - Recommend Option A for simplicity — same route, different view based on param

4. **Wait screen location**: Can be a full-viewport overlay on the chat page, or a transition to the results route with the wait screen as a loading state. Recommend: transition to results route, wait screen as the loading state before portrait view renders.

5. **Minimum wait enforcement**: Simple `Promise.all([apiCall, delay(portraitWaitMinMs)])` pattern — whichever takes longer determines when the reveal appears. The duration comes from `PORTRAIT_WAIT_MIN_MS` env var (default 10000ms in production, 2000ms in test config) via `AppConfig.portraitWaitMinMs`. This avoids hardcoding 10 seconds and lets integration/e2e tests run fast.

### Testing Approach

**Unit tests (backend — Task 1.5-1.7, 7.4):**
- `pickFarewellMessage()` returns one of the 3 pool messages
- Farewell detection triggers at correct message count
- `isFinalTurn: true` + `farewellMessage` included in response at threshold
- `isFinalTurn: false` for all pre-threshold messages
- No LLM call made on final turn (farewell is from pool, not generated)

**Contract schema tests (Task 7.1):**
- `SendMessageResponseSchema` accepts `isFinalTurn` field
- Existing contract tests updated with new field in fixtures
- Location: `packages/contracts/src/__tests__/http-contracts.test.ts`

**Integration tests (Docker — Task 7.2, 7.3):**
- `POST /api/assessment/message` response includes `isFinalTurn` field
- Normal messages return `isFinalTurn: false`
- Threshold message returns `isFinalTurn: true` (or determine if it's the message before 403)
- `GET /api/assessment/:sessionId/results` still returns valid results with portrait
- Location: `apps/api/tests/integration/assessment.test.ts`
- Run with: `pnpm test:integration`

**Mock updates (Task 7.5):**
- `__mocks__/orchestrator.langgraph.repository.ts` returns `isFinalTurn` in `processMessage`
- All existing unit tests that depend on mock orchestrator still pass

**Visual verification (frontend — Task 8.5-8.7):**
1. Full anonymous flow: chat → farewell → auth gate → sign up → wait → reveal → portrait → full results
2. Full authenticated flow: chat → farewell → wait → reveal → portrait → full results
3. Dark mode through all beats
4. Mobile through all beats
5. `prefers-reduced-motion` through all beats
6. 24-hour session persistence (close browser, return, complete auth)
7. Direct URL access to results still works

**Build verification (Task 8.1-8.4):**
- `pnpm build` — 0 errors
- `pnpm lint` — no new warnings
- `pnpm test:run` — no regressions (unit tests)
- `pnpm test:integration` — no regressions (Docker integration tests)

### References

- [Source: design-thinking-2026-02-20.md, Prototype I](/Users/vincentlay/Projects/big-ocean/_bmad-output/design-thinking-2026-02-20.md) — Full transition UX design (lines 1934-2231)
- [Story 7.11: Auth-Gated Results Reveal](/_bmad-output/implementation-artifacts/7-11-auth-gated-results-reveal-and-sign-up-flow.md) — Current auth gate implementation
- [Story 2.14: Nerin Greeting Sequence](/_bmad-output/implementation-artifacts/2-14-nerin-greeting-sequence-redesign.md) — Pattern for Nerin prompt phase injection
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns
- [TherapistChat.tsx](/apps/front/src/components/TherapistChat.tsx) — Current chat completion flow (lines ~489-643)
- [ResultsAuthGate.tsx](/apps/front/src/components/ResultsAuthGate.tsx) — Current auth gate (to be replaced/relocated)
- [useTherapistChat.ts](/apps/front/src/hooks/useTherapistChat.ts) — Chat state management hook
- [results/$assessmentSessionId.tsx](/apps/front/src/routes/results/$assessmentSessionId.tsx) — Current results route
- [nerin-greeting.ts](/packages/domain/src/constants/nerin-greeting.ts) — Greeting pool pattern (farewell pool follows same pattern)
- [nerin-farewell.ts](/packages/domain/src/constants/nerin-farewell.ts) — NEW: farewell message pool + picker
- [orchestrator.langgraph.repository.ts](/packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts) — Orchestrator router (final turn detection)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**New Files:**
- `packages/domain/src/constants/nerin-farewell.ts` — Farewell message pool + `pickFarewellMessage()`
- `packages/domain/src/constants/__tests__/nerin-farewell.test.ts` — Farewell pool unit tests
- `apps/front/src/components/ChatAuthGate.tsx` — Nerin-themed auth gate for chat page
- `apps/front/src/components/ChatAuthGate.test.tsx` — ChatAuthGate unit tests
- `apps/front/src/components/PortraitWaitScreen.tsx` — Wait screen with rotating Nerin lines
- `apps/front/src/components/PortraitWaitScreen.test.tsx` — PortraitWaitScreen unit tests
- `apps/front/src/components/results/PortraitReadingView.tsx` — Portrait-first reading experience
- `apps/front/src/components/results/PortraitReadingView.test.tsx` — PortraitReadingView unit tests

**Modified Files:**
- `packages/domain/src/config/app-config.ts` — Added `portraitWaitMinMs` to `AppConfigService`
- `packages/domain/src/config/__mocks__/app-config.ts` — Added `portraitWaitMinMs: 2000` to mock config
- `packages/domain/src/index.ts` — Exported `NERIN_FAREWELL_MESSAGES` and `pickFarewellMessage`
- `packages/infrastructure/src/config/app-config.live.ts` — Added `PORTRAIT_WAIT_MIN_MS` env var (default 10000)
- `packages/infrastructure/src/utils/test/app-config.testing.ts` — Added `portraitWaitMinMs: 2000`
- `packages/contracts/src/http/groups/assessment.ts` — Extended `SendMessageResponseSchema` with `isFinalTurn`, `farewellMessage`, `portraitWaitMinMs`
- `packages/contracts/src/__tests__/http-contracts.test.ts` — Added contract tests for farewell fields
- `apps/api/src/use-cases/send-message.use-case.ts` — Final turn detection, farewell pool, skip LLM
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` — Final turn detection tests
- `apps/api/src/handlers/assessment.ts` — Pass farewell fields through to HTTP response
- `apps/api/tests/integration/assessment.test.ts` — Updated for farewell flow (3rd msg = 200 farewell)
- `apps/front/src/hooks/useTherapistChat.ts` — Added `isFarewellReceived`, `farewellMessage`, `portraitWaitMinMs` state
- `apps/front/src/components/TherapistChat.tsx` — Removed celebration card, added farewell/auth gate/wait flow
- `apps/front/src/components/TherapistChat.test.tsx` — Tests for farewell transition, auth gate, removed celebration
- `apps/front/src/routes/chat/index.tsx` — Added `onPortraitReveal` handler, expired session recovery
- `apps/front/src/routes/results/$assessmentSessionId.tsx` — Added portrait-first `?view=portrait` routing
- `compose.test.yaml` — Added `PORTRAIT_WAIT_MIN_MS=2000`
- `compose.e2e.yaml` — Added `PORTRAIT_WAIT_MIN_MS=2000`
