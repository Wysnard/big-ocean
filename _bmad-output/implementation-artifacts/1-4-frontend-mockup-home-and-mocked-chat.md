# Story 1.4: Frontend Mockup - Home Page and Mocked Chat UI

**Status:** ready-for-dev

**Date Created:** 2026-01-30

---

## Story

As a **Product Owner**,
I want **a working frontend mockup with the home page and a mocked assessment chat component**,
So that **stakeholders can visualize the assessment experience and the team has a foundation for incremental Epic 4 development**.

---

## Acceptance Criteria

### Home Page (Already Complete - Verify)
1. **Given** a user visits the home page (`/`)
   - **When** the page loads
   - **Then** they see:
     - Large "Big Ocean" hero section with gradient background
     - Education about Big Five personality model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
     - "Start Assessment Now" CTA button (prominently placed)
     - "Takes about 10-15 minutes · No account needed" subtitle

2. **Given** a user is on the home page
   - **When** they click "Start Assessment Now"
   - **Then** they are redirected to `/chat` with a new session started

### Mocked Chat UI (New Implementation)
3. **Given** a user visits `/chat` (new session or resumed)
   - **When** the page loads
   - **Then** they see:
     - Chat message interface with Nerin's first message: "Hi! I'm Nerin, your AI therapist. I'd like to understand you better. Let's start with something simple: What are you currently passionate about?"
     - Message list showing previous messages (mocked data for demo)
     - Message input field at the bottom
     - Real-time trait precision scores sidebar (mocked values: Openness 45%, Conscientiousness 30%, etc.)
     - Progress bar showing assessment completion (e.g., 35% assessed)

4. **Given** the chat is displayed
   - **When** the user types a message and presses Enter (or clicks Send)
   - **Then**:
     - User message appears instantly on the right side (message styling: user color, aligned right)
     - Input field clears
     - 1-2 seconds later, Nerin's response appears on the left (assistant styling, aligned left)
     - Mocked response: "That's fascinating! Tell me more about what draws you to [topic]. Do you see that as a recent interest or something you've been passionate about for a long time?"
     - Trait precision scores update with mock values

5. **Given** the user has sent multiple messages
   - **When** they scroll in the message list
   - **Then** they can see the conversation history
   - **And** earlier messages are still visible

6. **Given** the chat is open
   - **When** viewed on mobile
   - **Then** the layout is responsive and readable
   - **And** the input field remains accessible above the keyboard

### Mocked Data
7. **Given** the chat component mounts
   - **When** messages are displayed
   - **Then** mock data includes:
     - Nerin's opening message (warm, friendly, open-ended)
     - Pre-loaded conversation history (3-5 exchanges demonstrating dialogue flow)
     - Trait precision scores (45-60% range to show mid-assessment state)
     - Progress bar value (35-40%)

### Navigation
8. **Given** a user is in the chat
   - **When** they look at the header/navigation
   - **Then** they see a logo or "Big Ocean" branding
   - **And** they can navigate back to home if needed (optional)

---

## Tasks / Subtasks

- [ ] **Task 1: Enhance Home Page to Link to Chat** (AC: #1-2)
  - [ ] Verify existing home page structure is intact
  - [ ] Update "Start Assessment Now" button to navigate to `/chat`
  - [ ] Verify button styling and placement on desktop/mobile
  - [ ] Update second CTA button to also navigate to `/chat`

- [ ] **Task 2: Create Mocked Chat Component** (AC: #3-6)
  - [ ] Create `components/MockedTherapistChat.tsx` component
  - [ ] Implement mock data: conversation history (array of messages)
  - [ ] Display user/assistant messages with proper styling
  - [ ] Implement message input field with send button
  - [ ] Wire input to append mock messages (user → wait → mocked assistant response)
  - [ ] Add trait precision sidebar with mocked scores
  - [ ] Add progress bar (value: ~35%)
  - [ ] Implement message list scrolling
  - [ ] Ensure responsive design on mobile

- [ ] **Task 3: Wire Chat Route** (AC: #3, #8)
  - [ ] Verify `/chat` route exists in `apps/front/src/routes/chat/index.tsx`
  - [ ] Update route to render `MockedTherapistChat` component
  - [ ] Add header/navigation with branding
  - [ ] Add back button (optional, but UX-friendly)

- [ ] **Task 4: Mocked Response Logic** (AC: #4)
  - [ ] Implement local state for messages
  - [ ] Create mock response generator (simple deterministic function)
  - [ ] Add simulated 1-2 second delay before assistant responds
  - [ ] Update trait precision values on each message (mock increment)

- [ ] **Task 5: Styling & Polish** (AC: #5-6)
  - [ ] Apply Tailwind CSS styling (dark theme consistent with home page)
  - [ ] Message bubble styling: user (right-aligned, accent color), assistant (left-aligned, neutral color)
  - [ ] Trait precision cards with color coding per trait
  - [ ] Progress bar styling with animated transitions
  - [ ] Mobile responsiveness testing (input keyboard, scroll behavior)
  - [ ] Verify text contrast and accessibility (WCAG AA minimum)

- [ ] **Task 6: Documentation & Testing** (AC: #2, #7)
  - [ ] Add JSDoc comments to component explaining mock behavior
  - [ ] Create README section documenting mock data structure
  - [ ] Write unit tests for:
    - [ ] Component renders without errors
    - [ ] Initial mock messages display
    - [ ] User message input works
    - [ ] Mocked response appears after delay
    - [ ] Trait scores update
    - [ ] Mobile layout renders
  - [ ] Update CLAUDE.md with mockup notes

---

## Dev Notes

### Current Frontend State
- **Home page** (`routes/index.tsx`): Already fully implemented with hero section, Big Five descriptions, and CTA buttons
- **Chat route** (`routes/chat/index.tsx`): Exists but uses incomplete `useTherapistChat` hook
- **TherapistChat component** (`components/TherapistChat.tsx`): UI structure exists, but no RPC integration yet
- **RPC Hooks** (`hooks/use-assessment.ts`): Already defined and ready to use (startAssessment, sendMessage, etc.)

### Strategy for This Story
This story creates a **mocked version** to visualize the UX before backend integration:
1. Copy TherapistChat component logic (keep UI layout)
2. Replace RPC calls with mock data generation
3. Use `useState` for local message management
4. Add deterministic mock responses (no actual API calls)
5. This foundation makes it easy to swap mock → real RPC in later Epic 4 stories

### Mock Data Structure
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface TraitPrecision {
  openness: number;        // 0-100 (%)
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface MockSession {
  sessionId: string;
  messages: Message[];
  precision: TraitPrecision;
  progress: number; // 0-100 (%)
}
```

### Mocked Response Examples
```
User: "I love hiking and exploring new places"
Assistant: "That's wonderful! Exploration seems to be important to you. When you discover a new trail or destination, what excites you most — the physical challenge, the natural beauty, or the sense of adventure?"

User: "Probably the sense of adventure and discovering something new"
Assistant: "I hear that! The thrill of discovery. Do you bring that same adventurous spirit into other areas of your life — career, relationships, hobbies?"
```

### Key Files to Modify
- `/Users/vincentlay/Projects/big-ocean/apps/front/src/components/TherapistChat.tsx` → Create `MockedTherapistChat.tsx` (parallel component for this story)
- `/Users/vincentlay/Projects/big-ocean/apps/front/src/routes/chat/index.tsx` → Import and render mocked component
- `/Users/vincentlay/Projects/big-ocean/apps/front/src/routes/index.tsx` → Ensure button links to `/chat`

### Testing Standards
- **Unit Tests**: Components render, messages display, input works
- **Integration Tests**: (deferred to later stories when RPC is live)
- **E2E Tests**: (deferred to Epic 7)
- **Accessibility**: WCAG AA minimum (color contrast, keyboard navigation, ARIA labels)
- **Mobile Testing**: Manual testing on mobile device or emulator

### Architecture Compliance
- **TanStack Stack**: Use React hooks (`useState`, `useEffect`), NOT TanStack Query (no API calls yet)
- **Tailwind CSS v4**: Existing design tokens and spacing
- **shadcn/ui Components**: Use Card, Button from existing component library
- **No External Dependencies**: Keep mocking simple (pure JS, no mock libraries like MSW yet)

### Performance Considerations
- Mock message delay: 1-2 seconds (simulates network latency)
- Component should remain responsive during mock response generation
- No optimization needed at this stage (mock data is tiny)

### Future Integration Path
This mocked implementation directly transitions to Epic 4 (Real RPC Integration):
1. In Epic 4, replace mock data initialization with `useStartAssessment()` hook
2. Replace mock response generation with `useSendMessage()` hook
3. Replace local state with TanStack Query mutations
4. Keep UI/styling exactly the same — only swap the data source

---

## Previous Story Intelligence

**Story 1.3 ✅ (RPC Contracts & Infrastructure Layer):**
- RPC contracts already defined in `packages/contracts/src/assessment.ts`
- Assessment, Profile RPC procedures ready
- Type-safe client hooks in frontend ready to use
- This story uses the **mocked** version; Story 4.1+ will use **real** RPC calls

---

## Git Intelligence

**Recent Commits Relevant to Frontend:**
- `37c44e7`: "refactor: Move tsx to workspace-level dependency for consistency"
- `4a0dfcb`: "feat: Story 1.4 Phase 1 - Docker Compose local development setup"
- `dd4423e`: "feat: docker setup"

**Code Patterns Established:**
- Component: `apps/front/src/components/*.tsx` with TypeScript interfaces
- Routes: `apps/front/src/routes/` using file-based TanStack Router
- Styling: Tailwind CSS v4 with custom gradients and dark theme
- Hooks: `apps/front/src/hooks/use-*.ts` for reusable logic

**Dependencies to Note:**
- React 19.2.0
- TanStack Start 1.132.0
- TanStack Router 1.132.0
- TanStack Query 5.66.5
- Tailwind CSS 4.0.6
- Effect v3.19+ (for type safety when real RPC is integrated)

---

## Project Structure Notes

**Frontend Organization:**
```
apps/front/src/
├── routes/
│   ├── __root.tsx              # Root layout, shared header
│   ├── index.tsx               # Home page (✅ Complete)
│   └── chat/
│       └── index.tsx           # Chat page (needs mocked component)
├── components/
│   ├── Header.tsx              # Navigation (✅ Complete)
│   ├── TherapistChat.tsx        # Real RPC version (for Epic 4+)
│   └── MockedTherapistChat.tsx  # ← NEW: Mocked version (this story)
├── hooks/
│   ├── use-assessment.ts        # RPC hooks (ready to use in Epic 4)
│   └── useTherapistChat.ts      # Chat logic (will use in Epic 4)
├── lib/
│   └── rpc-client.ts            # RPC configuration
└── styles.css                   # Tailwind + globals
```

**Design Decision:**
Keep `MockedTherapistChat.tsx` as a separate component from `TherapistChat.tsx`. This allows:
- Easy A/B testing between mock and real versions
- Clean transition in Epic 4 by just switching the import
- No risk of breaking existing code
- Stakeholders can see the mockup while backend develops in parallel

---

## Testing Requirements

### Unit Tests (`MockedTherapistChat.test.ts`)
```typescript
describe("MockedTherapistChat", () => {
  test("renders initial Nerin greeting", () => {
    // Assert first message from Nerin is visible
  });

  test("user message input works", async () => {
    // Type message, press Enter, verify it appears
  });

  test("mocked response appears after 1-2 seconds", async () => {
    // Send message, wait, verify assistant response
  });

  test("trait precision updates on each message", () => {
    // Verify scores increment
  });

  test("progress bar updates", () => {
    // Verify progress increases
  });

  test("mobile layout is responsive", () => {
    // Render at 375px width, verify layout is readable
  });

  test("accessibility: ARIA labels present", () => {
    // Verify input has label, buttons have text
  });

  test("scroll behavior works", () => {
    // Simulate long conversation, verify scrolling
  });
});
```

### Manual Testing Checklist
- [ ] Home page button navigates to chat
- [ ] Chat loads with Nerin's greeting
- [ ] Can type and send message
- [ ] Mocked response appears 1-2 seconds later
- [ ] Trait scores update visually
- [ ] Progress bar increments
- [ ] Scroll through conversation history
- [ ] Test on mobile (iPhone 12, Android)
- [ ] Test accessibility (tab navigation, screen reader, color contrast)

---

## Completion Notes

**Status After Completion:**
- Home page navigation verified ✅
- Mocked chat component complete ✅
- Foundation for Epic 4 (Real RPC Integration) ready ✅
- UX validated with mock data before backend implementation ✅
- Stakeholder visualization available ✅
- Enables parallel development: frontend UI + backend logic

**Artifacts Generated:**
- `MockedTherapistChat.tsx` component
- Unit tests with full coverage
- Documentation in CLAUDE.md
- Updated sprint status

**Next Phase (Epic 4):**
- Story 4.1: Replace mocks with real RPC hooks
- Story 4.2: Add session resumption UI
- Story 4.3: Add optimistic updates & progress tracking
- Story 4.4: Add authentication modal

**Parallel Development Opportunity:**
While Epic 2 backend team develops Nerin agent, Analyzer/Scorer, this mockup allows:
- Frontend team to refine UX with mock data
- Product team to get stakeholder feedback
- QA to plan test scenarios
- Design to validate accessibility

---

## Dev Agent Record

### Agent Model Used

[To be filled by dev agent upon completion]

### Completion Notes List

- [ ] Component created and renders
- [ ] Mock messages display correctly
- [ ] Input field functional
- [ ] Response delay working (1-2 seconds)
- [ ] Trait precision updates
- [ ] Progress bar updates
- [ ] Mobile responsive
- [ ] Tests written and passing
- [ ] JSDoc comments added
- [ ] CLAUDE.md updated
- [ ] Accessibility verified (WCAG AA)

### File List

**Created:**
- `/Users/vincentlay/Projects/big-ocean/apps/front/src/components/MockedTherapistChat.tsx`
- `/Users/vincentlay/Projects/big-ocean/apps/front/src/components/MockedTherapistChat.test.ts`

**Modified:**
- `/Users/vincentlay/Projects/big-ocean/apps/front/src/routes/chat/index.tsx` (import MockedTherapistChat)
- `/Users/vincentlay/Projects/big-ocean/CLAUDE.md` (notes on mockup strategy)
- `/Users/vincentlay/Projects/big-ocean/_bmad-output/sprint-status.yaml` (update story status to ready-for-dev)

---

## References

- **RPC Contracts**: [Source: packages/contracts/src/assessment.ts]
- **Frontend Architecture**: [Source: CLAUDE.md#Frontend Stack]
- **Tailwind CSS v4**: [Source: apps/front/package.json#tailwindcss]
- **TanStack Start**: [Source: apps/front/src/routes/__root.tsx#Root layout]
- **Big Five Model**: [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- **Mocking Strategy**: [No external dependencies — pure JavaScript mock functions]

