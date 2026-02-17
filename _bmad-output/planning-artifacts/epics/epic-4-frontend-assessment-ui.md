# Epic 4: Frontend Assessment UI

**Goal:** Build the conversational assessment interface with real-time sync, progress tracking, component documentation, and seamless user experience.

**Dependencies:**
- Epic 1 (RPC contracts)
- Epic 2 (backend assessment endpoints live)
- Epic 3 (archetype system working for results display)

**Enables:** Epic 5 (builds on working assessment UI for sharing), user can start assessments

**Blocked By:** Epics 1, 2, 3 must complete first

**Parallel Development:** Can design UI components in parallel with backend work; Storybook documentation can be added as components are completed

**User Value:** Delivers engaging, responsive assessment experience with instant feedback, progress visibility, and documented component library for team onboarding

## Story 4.1: Authentication UI (Sign-Up Modal)

As a **User**,
I want **to sign up after my first message when I'm engaged**,
So that **my results are saved without friction**.

**Acceptance Criteria:**

**Given** I've sent my first message
**When** Nerin responds
**Then** a subtle modal appears: "Save your results? Sign up to continue"
**And** I can dismiss it and continue (no pressure)
**And** I can enter email + password to sign up

**Given** I sign up successfully
**When** the modal closes
**Then** my session links to my new account
**And** I see "Your results are being saved"

**Technical Details:**

- Sign-up modal component with TanStack Form
- Email validation (required, valid format)
- Password validation (12+ chars, NIST 2025)
- Better Auth integration for account creation
- Session linking: anonymous → authenticated

**Acceptance Checklist:**
- [ ] Modal appears after first message
- [ ] Can dismiss modal
- [ ] Email/password input visible
- [ ] Password validation enforced
- [ ] Signup creates account
- [ ] Session links to account

---

## Story 4.2: Assessment Conversation Component

As a **User**,
I want **to see my conversation with Nerin with my messages on one side and responses on the other**,
So that **the assessment feels like a natural dialogue**.

**Acceptance Criteria:**

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

**Technical Details:**

- React component: `AssessmentUI.tsx`
- Message list with TanStack DB live queries
- Message input with TanStack Form
- Streaming response display (word-by-word)
- Optimistic insert: message added locally before server confirms
- Mobile-responsive with Tailwind CSS v4
- **NEW:** Message click handlers for evidence highlighting (Story 5.3)
- **NEW:** Support for text highlighting via `highlightRange` (Story 5.3)

**Acceptance Checklist:**
- [ ] Conversation displays message list
- [ ] User messages appear instantly (optimistic)
- [ ] Nerin responses stream in real-time
- [ ] Scrolling shows full history
- [ ] Mobile layout is readable
- [ ] Input field accessible and responsive
- [ ] User messages are clickable (Story 5.3 dependency)
- [ ] Messages support text highlighting (Story 5.3 dependency)

---

## Story 4.3: Session Resumption & Device Switching (TDD)

As a **User**,
I want **to switch to another device and continue my assessment**,
So that **I can start on desktop and finish on mobile without losing progress**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for session resumption
**When** I run `pnpm test session-resumption.test.ts`
**Then** tests fail (red) because resumption endpoints don't exist
**And** each test defines expected behavior:
  - Test: Resume URL loads full session history from server
  - Test: History loads in <1 second
  - Test: Precision scores match server state
  - Test: Can resume from different device with same session ID
  - Test: Device switching doesn't lose any messages

**IMPLEMENTATION (Green Phase):**
**Given** I start an assessment on desktop
**When** I send 5 messages
**And** I visit `/assessment?sessionId=abc123` on my phone
**Then** all 5 messages load from server
**And** Nerin's responses are visible
**And** precision scores match desktop state
**And** tests pass (green)

**Given** I continue the conversation on phone
**When** I send a message
**Then** message is sent to server
**And** Nerin generates response
**And** both devices reflect new message (if both open)

**Given** I reach 70%+ precision and see celebration screen with results
**When** I click "Keep Exploring" CTA
**Then** conversation interface remains open in same session
**And** I can continue chatting with Nerin seamlessly
**And** precision continues to improve with additional messages
**And** no new session is created (session ID unchanged)

**Technical Details:**

- **TDD Workflow**: Tests written first (define resumption contract), implementation follows
- Resume endpoint: `GET /api/sessions/{sessionId}/full` returns:
  - All messages (id, role, content, createdAt)
  - Current precision score
  - Current trait/facet scores
  - Session status (active/paused/completed)
- TanStack Query fetches history on mount
- Load time target: <1 second for full history
- No cross-device real-time sync (acceptable for MVP)
- History caching: Browser cache for offline browsing (optional)

**Acceptance Checklist:**
- [ ] Failing tests written first covering resumption scenarios (red phase)
- [ ] Tests verify history completeness
- [ ] Tests verify load time <1 second
- [ ] Tests verify precision accuracy
- [ ] Tests verify cross-device resumption
- [ ] Tests verify "Keep Exploring" continuation flow
- [ ] Implementation passes all tests (green phase)
- [ ] Resume endpoint returns full session state
- [ ] History loads in <1 second
- [ ] Can resume from different device
- [ ] No message loss on device switch
- [ ] "Keep Exploring" CTA continues same session without creating new one
- [ ] User can chat seamlessly after viewing 70% results
- [ ] 100% unit test coverage for SessionResumption

---

## Story 4.4: Optimistic Updates & Progress Indicator (TDD)

As a **User**,
I want **to see my message appear instantly and a progress bar showing assessment completion**,
So that **I get instant feedback and feel motivated to continue**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for optimistic updates and progress
**When** I run `pnpm test optimistic-updates.test.ts`
**Then** tests fail (red) because optimistic update logic doesn't exist
**And** each test defines expected behavior:
  - Test: Message appears in UI immediately on send (before server confirm)
  - Test: Precision updates trigger progress bar animation
  - Test: Progress = min(precision, 100)
  - Test: Progress bar shows correct percentage and label

**IMPLEMENTATION (Green Phase):**
**Given** I send a message
**When** I click send
**Then** message appears in message list immediately (optimistic)
**And** input field clears
**And** server processes message asynchronously
**And** tests pass (green)

**Given** precision updates from server
**When** new precision arrives
**Then** progress bar animates smoothly to new value
**And** "You're X% assessed" message updates
**And** "You're nearly there!" shows when >80%

**Given** precision reaches 70%+ for the first time
**When** the precision update arrives
**Then** a celebration screen appears: "Your Personality Profile is Ready!"
**And** archetype revealed with visual design flourish
**And** precision score displayed prominently (e.g., "Precision: 73%")
**And** two prominent CTAs presented:
  1. "Share My Archetype" — Generate shareable link
  2. "Keep Exploring" — Continue refining in same session
**And** user can choose either path without friction

**Technical Details:**

- **TDD Workflow**: Tests written first (define optimistic update contracts), implementation follows
- Optimistic update flow:
  1. User sends message → immediately add to local state
  2. TanStack Query fires mutation to `/api/sessions/{id}/messages`
  3. Server processes message (Nerin, Analyzer, Scorer)
  4. Response includes new precision
  5. Local state reconciles with server response
- Progress bar:
  - Value: `min(precision, 100)%`
  - Animated with CSS transition (500ms)
  - Labels: "0% assessed", "45% assessed", "You're nearly there!" (>80%)
- TanStack Form + TanStack Query for message input/mutation

**Acceptance Checklist:**
- [ ] Failing tests written first covering optimistic scenarios (red phase)
- [ ] Tests verify immediate message appearance
- [ ] Tests verify progress calculation
- [ ] Tests verify animation smoothness
- [ ] Tests verify 70% celebration trigger
- [ ] Implementation passes all tests (green phase)
- [ ] Messages appear instantly (optimistic)
- [ ] Input field clears immediately
- [ ] Progress bar displays precision
- [ ] Updates animate smoothly
- [ ] Correct labels shown at thresholds
- [ ] 70% celebration screen appears with archetype reveal
- [ ] Two CTAs present: "Share My Archetype" and "Keep Exploring"
- [ ] Mobile-responsive
- [ ] 100% unit test coverage for optimistic updates

---

## Story 4.5: Component Documentation with Storybook

As a **Frontend Developer**,
I want **to document all UI components in Storybook with interactive examples**,
So that **other devs can browse components before writing custom code and ensure accessibility compliance**.

**Acceptance Criteria:**

**Given** I start Storybook with `pnpm -C packages/ui storybook`
**When** I navigate to Components
**Then** I see all shadcn/ui components with:
  - Live examples of each variant
  - Props documentation
  - Accessibility checks (WCAG AA/AAA)
  - Design pattern explanations

**Given** a component has accessibility issues
**When** Storybook a11y addon runs
**Then** violations are highlighted with explanations

**Technical Details:**

- Storybook 10.1.11 (latest stable)
- `.stories.tsx` files for each component
- Autodocs: `tags: ["autodocs"]`
- a11y addon: `@storybook/addon-a11y`
- Deployment: GitHub Pages via CI

**Acceptance Checklist:**
- [ ] Storybook installed and configured
- [ ] Button, Input, Dialog, Card components documented
- [ ] Assessment UI components (NerinMessage, PrecisionMeter, ArchetypeCard) documented
- [ ] Stories show all variants
- [ ] a11y addon finds and reports accessibility issues
- [ ] Storybook builds successfully for deployment

---

## Story 4.6: Hide Scores During Assessment

As a **User**,
I want **to see my assessment progress without revealing scores or personality results during conversation**,
So that **my responses remain authentic and unbiased by partial results**.

**Acceptance Criteria:**

**Given** I'm in an active assessment conversation
**When** the chat interface renders
**Then** I see:
  - Precision percentage displayed prominently (e.g., "34% → 41% → 56%")
  - Precision meter updates every 2-3 messages (visual progress indicator)
  - Milestone notifications at key thresholds ("You're now 50% understood")
  - NO individual facet or trait scores visible
  - NO archetype name or hints visible
  - NO indication of score "direction" (high/low on traits)

**Given** my precision reaches 70%+
**When** the threshold is crossed
**Then**:
  - Conversation pauses with transition screen: "Your personality profile is ready!"
  - User is redirected to results page (`/results/:sessionId`)
  - This is the FIRST time user sees scores/traits/archetype

**Given** a user asks: "What's my score so far?" or "Can you tell me my personality type yet?"
**When** Nerin receives this question
**Then** Nerin responds:
  - "I'm definitely seeing patterns, but I don't want to share partial insights that might not be accurate yet."
  - "Right now we're at [X]% precision—let's get to 70%+ so I can give you the full picture."
  - Reframes to precision (visible metric) without revealing scores

**Technical Details:**

- Remove score/trait displays from conversation UI
- Keep precision meter visible and updating
- Add milestone toast notifications (25%, 50%, 75%)
- Create 70%+ precision transition screen
- Update Nerin prompt to avoid Big Five terminology during assessment
- Coordinate with Story 2.2 (Nerin Agent) for language patterns

**Acceptance Checklist:**
- [ ] Conversation UI shows precision meter, hides all scores/traits/archetypes
- [ ] Milestone notifications appear at correct thresholds
- [ ] 70%+ precision triggers transition to results page
- [ ] Nerin language avoids trait terminology
- [ ] User score inquiries handled with precision-reframing
- [ ] Mobile responsive (precision meter visible, toasts work)
- [ ] Storybook documentation (PrecisionMeter, MilestoneToast, PrecisionTransition)

**Rationale:** Maintains assessment integrity by preventing user bias. Aligns with UX spec (Monetization & Display Transparency Model). Sets foundation for future premium tier with consistent hidden-score pattern.

**Related Documents:**
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md` (Monetization section)
- Full implementation details: `_bmad-output/implementation-artifacts/4-6-hide-scores-during-assessment.md`

---

## Story 4.7: Message-Count Progress Indicator (Replace Confidence-Based Progress)

**Origin:** Party Mode architecture session (2026-02-14). Companion to Story 2.11 (Async Analyzer). Confidence scores removed from send-message response to decouple the analyzer from the HTTP response path.

As a **User**,
I want **to see my assessment progress based on how many messages I've exchanged**,
So that **I know how close I am to seeing my results without waiting for background analysis**.

**Problem Statement:**

The current progress indicator relies on `confidence` scores (5 trait values, 0-100) returned in the send-message response. Story 2.11 removes confidence from this response to enable async analysis. The frontend needs an alternative progress signal.

For MVP, message count is a reliable proxy: assessments typically reach 70%+ confidence at ~15-20 messages. Phase 2 will replace this with ElectricSQL-powered live confidence updates.

**Design Decisions:**

1. **Message count as progress proxy (MVP)** — Simple, no API dependency, deterministic. User messages counted client-side from the `messages` array.
2. **Keep confidence in resume endpoint** — Returning users with existing evidence still see accurate progress on load.
3. **Phase 2: ElectricSQL live sync** — Evidence table synced to frontend; client-side `aggregateFacetScores()` computes real-time confidence. Deferred until ElectricSQL implementation.

**Acceptance Criteria:**

**AC-1: Remove Confidence Consumption from send-message**
**Given** a send-message response arrives
**When** the `onSuccess` callback executes
**Then** it does NOT read or set `confidence` (field no longer exists)
**And** it only extracts `data.response` for the assistant message

**AC-2: Message-Count Progress Indicator**
**Given** the user is in an active assessment
**When** they have exchanged N user messages
**Then** the progress indicator shows progress based on user message count
**And** thresholds are:
  - 1-5 messages: "Getting to know you..." (~15-30%)
  - 6-10 messages: "Building your profile..." (~35-60%)
  - 11-15 messages: "Refining your personality map..." (~65-85%)
  - 16+ messages: "Almost ready for results!" (~90-100%)
**And** the progress value increases monotonically (never decreases)

**AC-3: Celebration Trigger (Message Count)**
**Given** the user has sent 15+ messages (configurable threshold)
**When** the progress check runs
**Then** `isConfidenceReady` becomes true
**And** the celebration card appears ("Your Personality Profile is Ready!")
**And** the "View Results" header link appears
**And** behavior is identical to current confidence-based trigger

**AC-4: Resume Session Retains Confidence**
**Given** a user resumes an existing session
**When** the resume endpoint returns
**Then** confidence scores are still loaded from resume response
**And** `traits` state is populated from resume data
**And** if resume confidence >= 70%, celebration triggers immediately
**And** if resume confidence < 70%, message-count progress takes over

**AC-5: Remove TraitScores State (Cleanup)**
**Given** the `useTherapistChat` hook
**When** the `traits` state is evaluated
**Then** the `TraitScores` interface is simplified or removed
**And** the duplicate `{trait}Confidence` fields are cleaned up
**And** `avgConfidence` calculation uses resume data OR message count

**Technical Details:**

| File | Change |
|------|--------|
| `apps/front/src/hooks/useTherapistChat.ts` | Remove confidence consumption from `onSuccess`, add message-count progress logic, simplify `TraitScores` |
| `apps/front/src/hooks/use-assessment.ts` | Update `SendMessageResponse` type (remove confidence) |
| `apps/front/src/components/TherapistChat.tsx` | Update progress display to use message count, keep celebration card logic |

**Message Count → Progress Mapping:**

```typescript
const MESSAGE_READY_THRESHOLD = 15; // Configurable

const userMessageCount = messages.filter(m => m.role === "user").length;

const progressPercent = Math.min(
  Math.round((userMessageCount / MESSAGE_READY_THRESHOLD) * 100),
  100
);

const isConfidenceReady = userMessageCount >= MESSAGE_READY_THRESHOLD;
```

**Phase 2 Note (ElectricSQL):**
When ElectricSQL is implemented, replace message-count progress with:
```typescript
// Phase 2: Live confidence from synced evidence
const evidence = useLiveQuery(db.facet_evidence.where({ sessionId }));
const facetScores = aggregateFacetScores(evidence);
const avgConfidence = calculateConfidenceFromFacetScores(facetScores);
const isConfidenceReady = avgConfidence >= 70;
```

**Dependencies:** Story 2.11 (removes confidence from send-message response)

**Acceptance Checklist:**
- [ ] `onSuccess` callback no longer reads `data.confidence`
- [ ] Progress indicator uses user message count
- [ ] Progress thresholds display correct labels
- [ ] Progress never decreases (monotonic)
- [ ] Celebration triggers at MESSAGE_READY_THRESHOLD (15)
- [ ] "View Results" header link appears at threshold
- [ ] Resume session still loads confidence from resume endpoint
- [ ] Resume with high confidence triggers celebration immediately
- [ ] `TraitScores` interface simplified / duplicate fields removed
- [ ] TypeScript compiles with updated `SendMessageResponse` type
- [ ] All existing chat tests updated and passing

---

## Story 4.8: Message Character Limit with Counter

**Origin:** Correct-course sprint change (2026-02-17). UX improvement to prevent excessively long messages.

As a **User taking the assessment**,
I want **to see a character counter on the message input showing usage out of 2,000 characters**,
So that **I know when I'm approaching the limit and my messages stay at a reasonable length for Nerin to process effectively**.

**Acceptance Criteria:**

**Given** I type in the message input
**When** the character count updates
**Then** I see a counter below/inside the input: e.g., `0 / 2,000`
**And** the counter updates in real-time as I type

**Given** I've typed 1,800+ characters (90% threshold)
**When** I continue typing
**Then** the counter turns to a warning color (`--warning` / amber)

**Given** I've typed exactly 2,000 characters
**When** I try to type more
**Then** additional characters are not accepted (input is capped)
**And** the counter shows `2,000 / 2,000` in destructive/red color
**And** the send button remains enabled (can still send the full message)

**Given** I paste text that would exceed 2,000 characters
**When** the paste event fires
**Then** the text is truncated to 2,000 characters
**And** the counter reflects the truncated length

**Given** I'm on mobile
**When** the counter renders
**Then** it's visible and doesn't obscure the input or keyboard

**Technical Details:**

| File | Change |
|------|--------|
| Chat input component (TherapistChat.tsx or equivalent) | Add `maxLength={2000}` to textarea, add counter display |
| Counter styling | Semantic tokens: `--muted-foreground` default, `--warning` at 90%, `--destructive` at 100% |

**Implementation:**

```typescript
const MAX_CHARS = 2000;
const WARNING_THRESHOLD = 0.9; // 90%

const charCount = message.length;
const isWarning = charCount >= MAX_CHARS * WARNING_THRESHOLD;
const isMax = charCount >= MAX_CHARS;
```

**Counter Display:** Bottom-right of input area, `body-sm` (14px), muted by default.

**Acceptance Checklist:**
- [ ] Counter displays current/max characters (e.g., "142 / 2,000")
- [ ] Counter updates in real-time
- [ ] Warning color at 90%+ (1,800+ chars)
- [ ] Destructive color at 100% (2,000 chars)
- [ ] Input capped at 2,000 characters (no overflow)
- [ ] Paste truncation works correctly
- [ ] Send button works at max length
- [ ] Mobile-responsive (counter visible, doesn't obscure input)
- [ ] Uses semantic color tokens
- [ ] `data-slot="char-counter"` attribute on counter element

---
