# Story 4.6: Hide Scores During Assessment

Status: ready-for-dev

<!-- Note: This story ensures assessment integrity by hiding scores/traits during conversation to prevent user bias. -->

## Story

As a **User**,
I want **to see my assessment progress without revealing scores or personality results during conversation**,
So that **my responses remain authentic and unbiased by partial results**.

## Background & Context

**UX Principle:** Showing scores during assessment creates bias risk:
- Users may "anchor" on early signals ("I'm scoring high in openness")
- Users may "perform" toward or against desired scores
- Users may self-censor if they dislike the direction

**Solution:** Show **precision** (completeness %) but hide **scores** (trait values, facet scores, archetype hints) until assessment reaches 70%+ precision threshold.

**Applies to:** All users (free tier and future premium tier) — consistent experience maintains scientific integrity.

## Acceptance Criteria

### AC-1: Precision Meter Visibility

**Given** I'm in an active assessment conversation
**When** the chat interface renders
**Then** I see:
  - Precision percentage displayed prominently (e.g., "34% → 41% → 56%")
  - Precision meter updates every 2-3 messages (visual progress indicator)
  - Milestone notifications at key thresholds (e.g., "You're now 50% understood")
  - NO individual facet or trait scores visible
  - NO archetype name or hints visible
  - NO indication of score "direction" (high/low on traits)

### AC-2: Hidden Scores UI Components

**Given** I'm in an active assessment (precision < 70%)
**When** I view the conversation interface
**Then**:
  - Chat messages display (user + Nerin)
  - Precision meter visible at bottom or top
  - Message input field visible
  - NO sidebar showing trait/facet scores
  - NO progress rings per trait
  - NO archetype preview card
  - NO "Your scores so far" panel

### AC-3: Precision Milestone Feedback

**Given** my precision crosses a milestone (25%, 50%, 75%)
**When** the milestone is reached
**Then**:
  - Toast notification appears: "You're now [X]% understood"
  - Notification is encouraging but doesn't reveal scores
  - Example: "I'm getting a clearer picture of you. Let's keep going." (NOT: "You're scoring high in openness")
  - Notification auto-dismisses after 3 seconds

### AC-4: 70%+ Precision Transition

**Given** my precision reaches 70%+
**When** the threshold is crossed
**Then**:
  - Conversation pauses (graceful interruption)
  - Transition screen appears: "Your personality profile is ready!"
  - User is redirected to results page (`/results/:sessionId`)
  - Full archetype reveal with all scores now visible
  - This is the FIRST time user sees scores/traits/archetype

### AC-5: Nerin Language Guidance (Backend Coordination)

**Given** Nerin is generating responses during assessment
**When** responses are crafted
**Then** Nerin should:
  - Avoid explicit Big Five trait terminology ("conscientiousness", "extraversion", etc.)
  - Use neutral exploratory language ("How do you approach tasks with lots of moving parts?")
  - NOT say: "You seem very organized" (telegraphs conscientiousness)
  - NOT say: "Are you an introvert or extravert?" (reveals assessment dimension)
  - Use: "Tell me about a time you had to make a tough decision"
  - Acknowledge progress without revealing direction: "I'm getting a clearer picture of you"

**Note:** This is a coordination requirement with Story 2.2 (Nerin Agent). If needed, update Nerin's system prompt to enforce this pattern.

### AC-6: User Inquiry Handling

**Given** a user asks mid-assessment: "What's my score so far?" or "Can you tell me my personality type yet?"
**When** Nerin receives this question
**Then** Nerin should respond with:
  - "I'm definitely seeing patterns, but I don't want to share partial insights that might not be accurate yet."
  - "Right now we're at [X]% precision—let's get to 70%+ so I can give you the full picture."
  - "Trust the process? We're making great progress."
  - Reframe to precision (visible metric) without revealing scores

### AC-7: Mobile Responsive

**Given** I view the conversation on mobile (< 768px)
**When** the interface renders
**Then**:
  - Precision meter visible at top (sticky header or floating indicator)
  - Chat messages scroll smoothly
  - NO score panels visible (same as desktop)
  - Milestone notifications appear as mobile-friendly toasts

### AC-8: Storybook Documentation

**Given** I start Storybook
**When** I navigate to the Assessment section
**Then** I see stories for:
  - **PrecisionMeter** - different precision values (10%, 34%, 56%, 72%), milestone animations
  - **MilestoneToast** - milestone notification variants (25%, 50%, 75%)
  - **AssessmentChatInterface** - full composition with hidden scores, precision visible
  - **PrecisionTransition** - 70%+ threshold screen animation
**And** all stories pass WCAG AA accessibility checks

## Tasks / Subtasks

- [ ] **Task 1: Update Conversation Component to Hide Scores** (AC: 1, 2)
  - Remove any score/trait display from conversation UI
  - Ensure precision meter is visible and updating
  - Hide archetype preview card (if present)
  - Remove trait progress rings (if present)
  - Verify clean UI with only chat + precision meter

- [ ] **Task 2: Implement Precision Milestone Notifications** (AC: 3)
  - Add toast notification system (or use existing)
  - Trigger at 25%, 50%, 75% precision thresholds
  - Use encouraging language without revealing scores
  - Auto-dismiss after 3 seconds
  - Test on desktop and mobile

- [ ] **Task 3: Build 70%+ Precision Transition Screen** (AC: 4)
  - Create transition component: "Your personality profile is ready!"
  - Animate transition to results page
  - Ensure first-time score reveal is celebratory
  - Test navigation flow: chat → transition → results

- [ ] **Task 4: Review Nerin Language Patterns** (AC: 5)
  - Audit Nerin's system prompt for Big Five terminology
  - Update prompt to avoid trait language during assessment
  - Add guideline: Use neutral exploratory questions
  - Test with sample conversations
  - Coordinate with Story 2.2 Nerin implementation

- [ ] **Task 5: Add User Inquiry Response Pattern** (AC: 6)
  - Update Nerin prompt with response template for score inquiries
  - Test with user questions: "What's my score?", "Am I an introvert?"
  - Verify Nerin redirects to precision without revealing scores

- [ ] **Task 6: Mobile Responsive Testing** (AC: 7)
  - Test precision meter visibility on mobile
  - Verify milestone toasts render correctly
  - Check chat scroll behavior
  - Ensure no score panels leak into mobile view

- [ ] **Task 7: Storybook Component Documentation** (AC: 8)
  - Create PrecisionMeter story variants
  - Create MilestoneToast story variants
  - Document AssessmentChatInterface with hidden scores
  - Create PrecisionTransition animation story
  - Run accessibility checks (WCAG AA)

## Technical Details

**Frontend Changes:**
- `apps/front/src/components/assessment/ConversationInterface.tsx` — Remove score displays
- `apps/front/src/components/assessment/PrecisionMeter.tsx` — Ensure visibility
- `apps/front/src/components/assessment/MilestoneToast.tsx` — New component
- `apps/front/src/components/assessment/PrecisionTransition.tsx` — New component

**Backend Coordination:**
- Review Nerin system prompt (Story 2.2) — avoid Big Five terminology
- Ensure `sendMessage` API returns precision % for frontend display
- Add milestone threshold detection (optional backend, or frontend-calculated)

**Data Flow:**
```
User sends message
  ↓
Backend processes (Nerin → Orchestrator → Scorer)
  ↓
Response includes: nerinMessage, precision (%), NO scores
  ↓
Frontend displays: message + updated precision meter
  ↓
If precision >= 70%: Navigate to results page
```

## Definition of Done

- [ ] Conversation UI shows precision meter, hides all scores/traits/archetypes
- [ ] Milestone notifications appear at 25%, 50%, 75% with encouraging language
- [ ] 70%+ precision triggers transition to results page
- [ ] Nerin language patterns avoid Big Five terminology during assessment
- [ ] User score inquiries are handled with precision-reframing responses
- [ ] Mobile responsive (precision meter visible, toasts work)
- [ ] Storybook documentation complete with accessibility checks
- [ ] Manual testing: Start assessment → see precision only → reach 70% → results revealed
- [ ] Code review passed
- [ ] No regressions in existing conversation functionality

## Testing Strategy

**Unit Tests:**
- PrecisionMeter component renders correctly with different values
- MilestoneToast component triggers at correct thresholds
- PrecisionTransition component animates on 70%+ threshold

**Integration Tests:**
- Full assessment flow: Start → chat → precision updates → 70% transition → results
- User inquiry handling: Ask for scores mid-assessment → Nerin redirects to precision
- Milestone notifications: Verify toasts appear at correct precision values

**Manual Testing:**
- Complete assessment on desktop and mobile
- Verify no scores visible during conversation
- Check precision meter updates smoothly
- Confirm 70%+ transition feels celebratory
- Test Nerin language avoids trait terminology

## Dependencies

- **Depends on:** Story 2.2 (Nerin Agent), Story 4.4 (Precision tracking)
- **Enables:** Monetization (Story 7.x) — consistent hidden-score pattern for free/paid tiers
- **Blocked by:** None (can be implemented immediately)

## Notes

**Why This Story Matters:**
- Aligns implementation with UX spec (Monetization & Display Transparency Model)
- Maintains assessment integrity (prevents user bias)
- Quick win (2-3 days) without requiring payment infrastructure
- Sets foundation for future premium tier (same pattern applies to paid users)

**Future Work:**
- Story 7.x: Add payment integration + premium tier unlock
- Story 7.x: Evidence transparency ("show your work") for premium users
- Story 7.x: Continued conversation after 70% (premium feature)

**Related Documents:**
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md` (lines 297-556)
- PRD: Assessment integrity requirements
- CLAUDE.md: Nerin conversational quality principles
