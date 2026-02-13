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
