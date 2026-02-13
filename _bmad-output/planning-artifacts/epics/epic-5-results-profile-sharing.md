# Epic 5: Results & Profile Sharing

**Goal:** Display assessment results with memorable archetypes, enable privacy-controlled sharing, and provide PDF export.

**Dependencies:**
- Epic 1 (infrastructure)
- Epic 2 (assessment data available)
- Epic 3 (archetype names/descriptions ready)
- Epic 4 (UI components for results display)

**Enables:** Users can share personality insights (viral growth lever), complete assessment workflow

**Blocked By:** Epic 4 (needs assessment UI to function)

**User Value:** Completes the assessment loop — users can now share results

**User Value:** Users can share personality insights virally while maintaining privacy control

## Story 5.1: Display Assessment Results with Evidence-Based Scores

As a **User**,
I want **to see my personality summarized with my archetype name, trait levels, and facet descriptions with evidence**,
So that **I understand what my assessment revealed and can verify the accuracy**.

**Acceptance Criteria:**

**Given** I complete an assessment (all 30 facet confidences ≥ 70%)
**When** I click "View Results"
**Then** I see:
  - Archetype name (e.g., "Thoughtful Collaborator")
  - 3-level trait display (High/Mid/Low for O, C, E, A)
  - Visual archetype card (name + color + icon)
  - 2-3 sentence description explaining the combination
  - Expandable facet details for each trait (shows how facets aggregate to trait score)

**Given** I expand Openness trait details
**When** the facet breakdown appears
**Then** I see:
  - All 6 facet scores (0-20 scale) with clean names: Imagination, Artistic Interests, Emotionality, Adventurousness, Intellect, Liberalism
  - Sum of these 6 facets = Openness trait score (0-120 scale, displayed as High/Mid/Low)
  - Top-scoring facets highlighted (e.g., "Imagination: 16/20" and "Intellect: 15/20")
  - **NEW:** "View Evidence" button next to each facet score
  - Confidence indicator per facet (0.0-1.0 displayed as percentage)

**Given** I click "View Evidence" on any facet
**When** the evidence panel opens
**Then** I see (Story 5.3 details):
  - List of supporting message quotes
  - Score contribution per quote
  - "Jump to Message" links

**Given** precision < 50%
**When** results are viewed
**Then** message shows: "Keep talking to see more accurate results"
**And** results show preliminary assessment with facet data available so far

**Technical Details:**

- Results component fetches all 30 facet scores from database (stored as `Record<FacetName, FacetScore>`)
- Facet names are clean (no trait prefixes): "imagination" not "openness_imagination"
- Displays trait levels (High/Mid/Low) derived from facet sums using FACET_TO_TRAIT lookup
- Trait score = sum of 6 related facet scores (0-120 scale)
- Facet confidence displayed based on evidence consistency (adjusted for contradictions)
- Shows facet breakdown on demand (expandable sections)
- Color-coded by trait
- Archetype description is pre-written (not LLM-generated)
- Precision shown as facet convergence metric
- Evidence button links to Story 5.3 highlighting feature

**Acceptance Checklist:**
- [ ] Results component displays archetype name
- [ ] Trait levels shown (High/Mid/Low) computed from facet sums (0-120 scale)
- [ ] All 30 facet scores stored as Record<FacetName, FacetScore>
- [ ] Facet names are clean (no "trait_" prefixes)
- [ ] Facet details expandable for each trait
- [ ] Facet breakdown shows how sum is calculated
- [ ] Each facet shows confidence percentage
- [ ] "View Evidence" button visible for each facet
- [ ] Archetype description visible
- [ ] Color differentiation applied by trait
- [ ] Precision calculation considers facet convergence and variance
- [ ] Low precision shows appropriate message with partial facet data

---

## Story 5.2: Generate Shareable Profile Links

As a **User**,
I want **to generate a unique link to my profile that I can share on LinkedIn or email to friends**,
So that **others can see my personality archetype without accessing my full assessment**.

**Acceptance Criteria:**

**Given** I complete an assessment
**When** I click "Share Profile"
**Then** a public profile link is generated: `example.com/profiles/{uuid}`
**And** the link is copyable to clipboard
**And** I can control visibility (Private by default, toggle to Public)

**Given** someone opens my shared link
**When** they visit it
**Then** they see:
  - My archetype name + visual
  - Trait summary (High/Mid/Low)
  - Facet insights
  - **NOT visible:** Full conversation, precision %, or assessment progress

**Given** I set profile to Private
**When** someone tries to access the link
**Then** they see: "This profile is private"

**Technical Details:**

- `public_profiles` table: `id (uuid), userId, archetypeName, oceanCode5Letter, oceanCode4Letter, description, color, createdAt`
- Public endpoint: `GET /api/profiles/:publicProfileId` (no auth required)
- Private by default: `visibility = 'private'` (user toggles to 'public')
- Storage: Full 5-letter OCEAN code for complete trait record
- Display: Archetype name from 4-letter code (POC)
- Encryption of conversation history (not public)
- No user_id in URL (anonymous sharing)

**Acceptance Checklist:**
- [ ] Public profile generated
- [ ] Unique UUID-based link created
- [ ] Link is copyable
- [ ] Privacy toggle works
- [ ] Public link displays archetype (no conversation)
- [ ] Private link shows privacy message
- [ ] Analytics: track profile views

---

## Story 5.3: Bidirectional Evidence Highlighting and Transparency (TDD)

As a **User**,
I want **to see exactly which conversation quotes influenced each facet score**,
So that **I can verify the accuracy and understand how my results were calculated**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for evidence highlighting
**When** I run `pnpm test evidence-highlighting.test.ts`
**Then** tests fail (red) because highlighting components don't exist
**And** each test defines expected behavior:
  - Test: Clicking facet score opens evidence panel with quotes
  - Test: Clicking "Jump to Message" scrolls to message and highlights quote
  - Test: Clicking message opens side panel with contributing facets
  - Test: Highlight colors match evidence confidence (green/yellow/red)
  - Test: highlightRange accurately highlights exact text in message

**IMPLEMENTATION (Green Phase - Profile → Conversation):**
**Given** I'm viewing my profile results
**When** I click "View Evidence" on a facet score (e.g., "Altruism: 16/20")
**Then** an evidence panel opens showing:
  - List of all supporting message quotes
  - Each quote shows: message timestamp, quote text, score contribution (0-20)
  - Contradictory quotes marked with red indicator
  - "Jump to Message" button for each quote
**And** panel design:
  - Scrollable list (max 10 visible, scroll for more)
  - Color-coded contribution: Green (15+), Yellow (8-14), Red (<8 or contradictory)
  - Confidence indicator per quote (opacity reflects confidence)

**Given** I click "Jump to Message" in evidence panel
**When** the conversation scrolls to that message
**Then** the exact quote is highlighted in the message:
  - Green highlight: Strong positive signal (score 15+)
  - Yellow highlight: Moderate signal (score 8-14)
  - Red highlight: Contradictory signal (score <8 or conflicts with other evidence)
  - Opacity: High confidence = solid, low confidence = faded
**And** highlight persists until I navigate away
**And** smooth scroll animation to message location

**IMPLEMENTATION (Green Phase - Conversation → Profile):**
**Given** I'm viewing my conversation history
**When** I click on any message I wrote
**Then** a side panel opens showing:
  - "This message contributed to:"
  - List of facets with score contributions:
    - 🤝 Altruism: +18/20 (strong signal)
    - 💭 Emotionality: +14/20 (moderate)
    - 🎨 Imagination: +12/20 (moderate)
  - Each facet is clickable

**Given** I click a facet in the side panel
**When** the click is registered
**Then** the view navigates to profile page
**And** scrolls to that facet's score
**And** optionally opens the evidence panel for that facet

**INTEGRATION:**
**Given** evidence highlighting is implemented
**When** I interact with profile and conversation views
**Then** bidirectional navigation works seamlessly:
  - Profile → Evidence → Message (forward navigation)
  - Message → Facets → Profile (backward navigation)
**And** all highlighting is precise and color-coded
**And** mobile touch targets are ≥44px for all evidence items
**And** tests pass (green)

**Technical Details:**

- **Database Queries:**
  - Profile → Evidence: `SELECT * FROM facet_evidence WHERE facet = 'altruism' ORDER BY created_at`
  - Message → Facets: `SELECT * FROM facet_evidence WHERE message_id = 'msg_123'`
  - Evidence includes: messageId (FK), facet, score, confidence, quote, highlightStart, highlightEnd

- **Frontend Components:**
  - `EvidencePanel`: Modal/panel showing evidence list for a facet
  - `EvidenceItem`: Individual quote with score and "Jump to Message" button
  - `MessageHighlight`: CSS-based text highlighting using highlightRange
  - `FacetSidePanel`: Side panel showing facets contributed by a message

- **Highlighting Logic:**
  - Uses `highlightRange.start` and `highlightRange.end` (character indices)
  - Wraps text with `<span class="highlight highlight-{color}">` using CSS
  - Color determined by: score ≥15 (green), 8-14 (yellow), <8 (red)
  - Opacity determined by: confidence (0.3 = low, 1.0 = high)

- **Navigation:**
  - Smooth scroll: `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`
  - URL state management: Optional query params `?highlight=msg_123&facet=altruism`
  - Mobile-optimized: Touch targets ≥44px, swipe-friendly panels

- **Performance:**
  - Lazy load evidence (fetch only when "View Evidence" clicked)
  - Virtualized list for messages with 100+ evidence items
  - Debounced highlighting to avoid layout thrashing

**Acceptance Checklist:**
- [ ] Failing tests written first (red phase)
- [ ] Tests cover Profile → Evidence → Message flow
- [ ] Tests cover Message → Facets → Profile flow
- [ ] Tests verify color-coded highlighting
- [ ] Tests verify highlightRange accuracy
- [ ] Implementation passes all tests (green phase)
- [ ] "View Evidence" button opens evidence panel
- [ ] Evidence panel shows all supporting quotes
- [ ] "Jump to Message" scrolls and highlights quote
- [ ] Message click opens facet side panel
- [ ] Facet click navigates to profile
- [ ] Color coding matches score ranges (green/yellow/red)
- [ ] Opacity reflects confidence levels
- [ ] Mobile touch targets ≥44px
- [ ] Smooth scroll animations work
- [ ] 100% unit test coverage for highlighting components

---
