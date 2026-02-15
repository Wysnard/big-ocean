# Sprint Change Proposal — Assessment Chat Depth Journey Design

Date: 2026-02-14
Workflow: correct-course
Mode: Incremental
Trigger: Story 7.10 (Assessment Chat UX Polish) — UX exploration produced superior design direction

## Section 1: Issue Summary

**Problem Statement:** Story 7.10 (Assessment Chat UX Polish) was implemented with incremental enhancements (avatar improvements, milestone badges, textarea polish) but doesn't deliver the immersive depth journey experience that emerged from subsequent UX exploration. User testing and design prototyping revealed a superior approach: the "Depth Journey" design pattern that uses visual depth progression (5 zones: Surface → Shallows → Mid → Deep → Abyss) with dynamic background color transitions tied to conversation progress.

**Discovery Context:** During UX design exploration phase following Story 7.8 (Conversation-Driven Homepage with Depth Scroll), 4 assessment chat redesign directions were prototyped and evaluated. The prototypes were created as fully functional HTML demos demonstrating different approaches to enhancing the 30-minute assessment conversation experience. User explicitly selected Direction 1 (Depth Journey) as the implementation target, recognizing its alignment with the homepage's depth metaphor and superior engagement potential.

**Evidence:** The change is driven by validated UX exploration:
- 4 fully functional HTML prototypes created at `_bmad-output/ux-explorations/assessment-chat/`
  - Direction 1: Depth Journey (selected - lowest complexity, highest alignment)
  - Direction 2: Evidence Trails (sidebar with facet constellation)
  - Direction 3: Narrative Chapters (5-chapter story arc)
  - Direction 4: Collaborative Canvas (dual-pane co-creation)
- Design documentation: `assessment-chat-redesign-directions.md` with full comparison matrix and recommendations
- User selection: Direction 1 (Depth Journey) chosen for implementation
- Pattern precedent: Story 7.8 (Homepage) successfully implemented depth scroll transitions using same technical approach
- Design alignment: Reinforces "deep dive" metaphor consistent with brand positioning

---

## Section 2: Impact Analysis

### Epic Impact
- **Epic 7 (UI Theme & Visual Identity):** Only Story 7.10 affected. All other stories (7.1-7.9, 7.11-7.15) remain unchanged.
- **Epics 1-6, 8:** No impact - Change is frontend-only visual enhancement.

### Story Impact
- **Story 7.10:** Full rewrite required. Status reverts from `done` to `ready-for-dev`. Title changes from "Assessment Chat UX Polish" to "Assessment Chat - Depth Journey Design".
- No other current or future stories require changes.

### Artifact Conflicts
- **Epic 7 file** (`epic-7-ui-theme-visual-identity.md`): Story 7.10 section needs full replacement with new acceptance criteria, component structure, and technical details.
- **Sprint status** (`sprint-status.yaml`): Story 7.10 entry needs slug update and status revert to `ready-for-dev`.
- **UX Design Specification** (`ux-design-specification/core-experience-the-30-minute-conversation-with-nerin.md`): Add new subsection "Visual Depth Metaphor During Assessment" with 5-zone system documentation.
- **PRD:** No conflict — new design better serves the same goals.
- **Architecture:** No impact — purely frontend visual enhancement.

### Technical Impact
- Current Story 7.10 implementation will be replaced
- New components needed: DepthMeter, DepthZoneProvider, FacetIcon, EvidenceCard
- **Component abstraction required**: Reusable chat conversation component that both homepage (Story 7.8) and assessment chat can use
  - Parent `ChatConversation` component wrapping child `Message` components
  - Shared message bubble, avatar, and typing state patterns
  - Extraction of common chat UI patterns into `packages/ui`
- Existing components reused: Chat bubbles, message stream, input bar (from Epic 4)
- Design tokens already established (Story 7.1) will be leveraged
- Pattern precedent from Story 7.8 reduces implementation risk
- **Potential impact on Story 7.8**: Homepage may need refactoring to adopt shared component (minor scope addition)
- No backend, API, database, or deployment changes

### Checklist Status Summary
- 1.1 [x] Done — Trigger identified (Story 7.10, UX exploration)
- 1.2 [x] Done — Core problem defined (design evolution)
- 1.3 [x] Done — Evidence collected (prototypes, user selection)
- 2.1 [x] Done — Epic 7 can still be completed
- 2.2 [x] Done — Story 7.10 rewrite needed
- 2.3 [x] Done — No other epics impacted
- 2.4 [N/A] — No epics invalidated or needed
- 2.5 [N/A] — No priority changes needed
- 3.1 [x] Done — No PRD conflicts
- 3.2 [x] Done — No architecture conflicts
- 3.3 [!] Action-needed — UX Design Spec needs additive update
- 3.4 [!] Action-needed — sprint-status.yaml needs update
- 4.1 [x] Viable — Direct adjustment selected
- 4.2 [ ] Not viable — Rollback provides no benefit
- 4.3 [ ] Not viable — MVP not affected
- 4.4 [x] Done — Option 1 selected

---

## Section 3: Recommended Approach

**Selected: Option 1 — Direct Adjustment (Rewrite Story 7.10)**

**Rationale:**
- The HTML prototype is comprehensive and fully demonstrates the design pattern
- The change is scoped to a single story within a single epic
- No other stories, epics, or artifacts are structurally impacted
- The new design better aligns with the product's "deep dive" value proposition
- Risk is low because the prototype serves as a complete reference implementation
- Pattern precedent from Story 7.8 (Homepage depth scroll) validates technical approach

**Effort:** Medium-High — new component development against a complete prototype reference + component abstraction work (extracting shared chat UI to packages/ui)
**Risk:** Low-Medium — design is fully specified, demonstrated, and technically proven; component abstraction adds minor complexity
**Timeline Impact:** Minimal-Moderate — replaces Story 7.10 scope + adds component abstraction work; potential minor impact on Story 7.8 for homepage refactoring

**Alternatives Considered:**
- **Rollback (Option 2):** Rejected - creates waste without benefit; direct replacement is standard practice
- **MVP Review (Option 3):** Rejected - MVP scope unaffected; no reduction needed
- **Add Story 7.16:** Rejected - creates confusion; single cohesive story is clearer

---

## Section 4: Detailed Change Proposals

### 4.1 — Rewrite Story 7.10 in Epic 7 ✅ APPROVED

Replace the entire Story 7.10 section in `epic-7-ui-theme-visual-identity.md` with Depth Journey design including:
- **New Title:** "Story 7.10: Assessment Chat - Depth Journey Design"
- **New User Story:** "As a user taking the 30-minute assessment, I want to feel immersed in a visual 'depth journey' that progresses from surface to abyss, so that the conversation feels like a meaningful exploration rather than a static form."
- **New Acceptance Criteria:**
  - 5-zone depth progression system (Surface 0-20%, Shallows 20-40%, Mid 40-60%, Deep 60-80%, Abyss 80-100%)
  - Fixed depth meter on left sidebar showing current zone and progress
  - Background color transitions tied to message count (not scroll)
  - Zone pip indicators update as conversation progresses
  - Inline facet icons in Nerin's messages when traits/facets mentioned
  - Mini evidence cards embedded in message stream showing confidence bars
  - Smooth CSS transitions for all zone changes
  - Dark mode support with zone-appropriate theming
  - `prefers-reduced-motion` compliance (disable transitions)
  - Mobile responsive (hide depth meter on small screens)
  - **Reusable component architecture:**
    - Build `ChatConversation` parent component that wraps child `Message` components
    - Extract shared chat UI patterns into `packages/ui` for reuse across homepage and assessment
    - Message bubbles, avatars, typing states must be abstraction-ready
    - Component API designed for both static (homepage) and dynamic (assessment) conversation contexts

**Component Structure:**
- **Shared Components (packages/ui):**
  - `<ChatConversation>` - Parent wrapper managing message stream, typing indicators, scroll behavior
  - `<Message>` - Individual message component with bubble, avatar, timestamp
  - `<MessageBubble>` - Styled container for message content
  - `<Avatar>` - Reusable avatar component with fallback patterns
- **Assessment-Specific Components (apps/front):**
  - `<DepthZoneProvider>` - React context managing current zone based on message count
  - `<DepthMeter>` - Fixed sidebar with 5 zone pips and progress fill
  - `<FacetIcon>` - Inline SVG icons for traits/facets
  - `<EvidenceCard>` - Embedded mini-visualization of facet confidence
  - Zone-based CSS custom properties for background transitions

**Technical Details:**
- Zone calculation: `messageCount / totalMessages * 100` → zone index (0-4)
- Color interpolation: CSS custom properties updated via React state
- Zone transitions: 600ms ease-in-out on background-color
- Depth meter: Fixed positioning, z-index: 90, opacity transition
- Reference implementation: `direction-1-depth-journey.html`

### 4.2 — Update sprint-status.yaml ✅ APPROVED

```yaml
# OLD
7-10-assessment-chat-ux-polish: done

# NEW
7-10-assessment-chat-depth-journey-design: ready-for-dev
```

### 4.3 — Update UX Design Specification ✅ APPROVED

Add new subsection to `ux-design-specification/core-experience-the-30-minute-conversation-with-nerin.md`:

**New Subsection: "Visual Depth Metaphor During Assessment"**

Location: Insert after "Phase 3: Dialogue & Understanding Building" section

Content:
- Document the 5-zone progression system (Surface → Shallows → Mid → Deep → Abyss)
- Explain background color transitions tied to conversation progress
- Describe depth meter behavior and visual feedback
- Specify zone thresholds (0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
- Document color values for each zone in light and dark modes
- Explain how visual depth reinforces psychological depth metaphor

### 4.4 — Full Story 7.10 Content ✅ APPROVED

Complete rewrite with all acceptance criteria, technical details, component structure, zone color system, and acceptance checklist. See prototype reference (`direction-1-depth-journey.html`) for definitive design and implementation guidance.

---

## Section 5: Implementation Handoff

**Change Scope: Minor** — Direct implementation by development team.

**Handoff:**

**1. Planning Artifacts Update (This Workflow):**
- Update Epic 7 file with rewritten Story 7.10
- Update sprint-status.yaml (slug and status change)
- Update UX Design Specification (additive subsection)
- Generate this Sprint Change Proposal document

**2. Development (Story 7.10 Implementation):**
- **Phase 1: Extract reusable components** (prerequisite for both homepage and assessment)
  - Create `ChatConversation`, `Message`, `MessageBubble`, `Avatar` in `packages/ui`
  - Design component API to support both static (homepage) and dynamic (assessment) contexts
  - Document composition patterns and prop contracts
  - Write Storybook stories for all shared components
- **Phase 2: Build Depth Journey components** (assessment-specific)
  - Use `direction-1-depth-journey.html` as the definitive design reference
  - Build `DepthZoneProvider`, `DepthMeter`, `FacetIcon`, `EvidenceCard`
  - Compose shared chat components with depth journey enhancements
  - Translate vanilla JS/CSS patterns into React + Tailwind + CSS custom properties
- **Phase 3: Refactor homepage** (optional, if Story 7.8 needs updates)
  - Migrate homepage conversation UI to use shared components
  - Ensure no regression in homepage depth scroll behavior
- Key architectural decision: `DepthZoneProvider` React context for zone state management
- Leverage existing design tokens from Story 7.1 (already done)
- Reference Story 7.8 implementation for depth transition pattern

**Reference Materials for Development:**
- HTML prototype: `_bmad-output/ux-explorations/assessment-chat/direction-1-depth-journey.html`
- Design documentation: `_bmad-output/ux-explorations/assessment-chat-redesign-directions.md`
- Pattern precedent: Story 7.8 implementation (homepage depth scroll)
- Design tokens: Story 7.1 (psychedelic color system)

**Success Criteria:**
- Assessment chat matches the Depth Journey prototype visual experience
- All acceptance criteria from the rewritten Story 7.10 are met
- Zone transitions are smooth and tied to message count (not scroll)
- Depth meter displays correctly with live progress tracking
- Inline facet icons appear in Nerin messages
- Evidence cards render with confidence bars
- Dark mode works correctly with zone-appropriate colors
- `prefers-reduced-motion` is respected for all animations
- Mobile responsive design (depth meter hidden on small screens)
- **Reusable component success criteria:**
  - `ChatConversation`, `Message`, `MessageBubble`, `Avatar` components delivered in `packages/ui`
  - Clear component API contract documented (props, slots, composition patterns)
  - Both homepage (Story 7.8) and assessment chat successfully use shared components
  - Storybook documentation for shared chat components
  - No code duplication between homepage and assessment chat UI
- Visual regression tests pass
- E2E tests updated for new UI elements
- Accessibility audit complete (WCAG AA compliance)

**Timeline:**
- Planning updates: Immediate (upon approval of this proposal)
- Implementation: When Story 7.10 is picked from `ready-for-dev` backlog
- Estimated effort: Medium (similar to original Story 7.10 scope)

---

## Appendix: Design Comparison

**Current Implementation (Story 7.10 - Done):**
- Multi-message auto-greeting
- Nerin Diver avatar in messages
- Progress milestone badges at 25%/50%/70%
- Textarea with rotating placeholders
- Relative timestamps
- Static background color

**New Design (Depth Journey):**
- All above features preserved ✅
- **Plus:** 5-zone depth progression (Surface → Abyss)
- **Plus:** Fixed depth meter with live tracking
- **Plus:** Background color transitions tied to progress
- **Plus:** Zone pip indicators
- **Plus:** Inline facet icons in messages
- **Plus:** Mini evidence cards in stream
- **Plus:** Visual metaphor reinforcing "deep dive" positioning
- **Plus:** Reusable chat component architecture shared with homepage (ChatConversation, Message, MessageBubble, Avatar)

**Key Insight:** The new design is additive and enhancing, not replacing core functionality. It layers the depth metaphor on top of the existing conversation UX.

---

**Document Status:** Ready for approval and implementation handoff.
