# Sprint Change Proposal — Conversation-Driven Homepage

Date: 2026-02-14
Workflow: correct-course
Mode: Incremental
Trigger: Story 7.8 (Home Page Redesign) — UX exploration produced fundamentally different design

## Section 1: Issue Summary

**Problem Statement:** Story 7.8 (Home Page Redesign with Color Block Composition) was implemented with a traditional section-based layout (Hero → Value Props → Chat Preview → Trait Cards → Results Teaser → Final CTA). Subsequent UX exploration produced 6 homepage direction prototypes, culminating in a "Combined Direction" that uses a fundamentally different approach: a conversation-driven homepage where Nerin narrates the entire page through chat bubbles with rich embedded content.

**Discovery Context:** During UX design exploration phase, 6 distinct homepage directions were prototyped and evaluated. The best elements were combined into a unified prototype (`_bmad-output/ux-explorations/homepage-directions/direction-combined.html`) that was iteratively refined through user feedback on scroll behavior, dark mode, responsive design, and color transitions.

**Evidence:** The prototype is a fully functional self-contained HTML file demonstrating:
- Conversation-driven content delivery via Nerin chat bubbles
- Scroll-triggered light-to-dark depth transition with 5 zones
- Rich embedded content (trait carousel, blurred OCEAN Code, radar chart, 30-facet bars)
- Fixed depth meter, sticky chat input bar, theme toggle (auto/dark/light)
- Full responsive design and dark mode support

---

## Section 2: Impact Analysis

### Epic Impact
- **Epic 7 (UI Theme & Visual Identity):** Only Story 7.8 affected. All other stories (7.1-7.7, 7.9-7.11, 7.15) remain unchanged. Stories 7.12, 7.13, 7.14 (backlog) are unaffected.
- **Epics 1-6, 8:** No impact.

### Story Impact
- **Story 7.8:** Full rewrite required. Status reverts from `done` to `ready-for-dev`. Title changes from "Home Page Redesign with Color Block Composition" to "Conversation-Driven Homepage with Depth Scroll".
- No other current or future stories require changes.

### Artifact Conflicts
- **Epic 7 file** (`epic-7-ui-theme-visual-identity.md`): Story 7.8 section needs full replacement with new acceptance criteria, component structure, and technical details.
- **Sprint status** (`sprint-status.yaml`): Story 7.8 entry needs slug update and status revert to `ready-for-dev`.
- **Homepage brainstorm** (`story-7.5-home-page-brainstorm.md`): Add superseded notice pointing to the Combined Direction prototype.
- **PRD:** No conflict — new design better serves the same goals.
- **Architecture:** No impact — purely frontend change.

### Technical Impact
- Current homepage components will be replaced (HeroSection, ValuePropsSection, ChatPreviewSection, TraitsSection, ResultsTeaserSection, FinalCTASection, WaveDivider)
- New components needed: ConversationFlow, MessageGroup, ChatBubble, TraitCarouselEmbed, BlurredPreviewEmbed, OceanCodePreview, RadarChartPreview, FacetBarsPreview, DepthMeter, ChatInputBar, DepthScrollProvider
- HeroSection can be adapted (still uses OCEAN shapes + headline layout)
- No backend, API, database, or deployment changes

### Checklist Status Summary
- 1.1 [x] Done — Trigger identified (Story 7.8, UX exploration)
- 1.2 [x] Done — Core problem defined (design evolution)
- 1.3 [x] Done — Evidence collected (prototype)
- 2.1 [x] Done — Epic 7 can still be completed
- 2.2 [x] Done — Story 7.8 rewrite needed
- 2.3 [x] Done — No other epics impacted
- 2.4 [N/A] — No epics invalidated or needed
- 2.5 [N/A] — No priority changes needed
- 3.1 [x] Done — No PRD conflicts
- 3.2 [x] Done — No architecture conflicts
- 3.3 [!] Action-needed — Epic 7 file and brainstorm doc need updates
- 3.4 [x] Done — sprint-status.yaml needs update
- 4.1 [x] Viable — Direct adjustment selected
- 4.2 [ ] Not viable — Rollback provides no benefit
- 4.3 [ ] Not viable — MVP not affected
- 4.4 [x] Done — Option 1 selected

---

## Section 3: Recommended Approach

**Selected: Option 1 — Direct Adjustment (Rewrite Story 7.8)**

**Rationale:**
- The prototype is comprehensive and fully validated through iterative user feedback
- The change is scoped to a single story within a single epic
- No other stories, epics, or artifacts are structurally impacted
- The new design better aligns with the product's core value proposition
- Risk is low because the prototype serves as a complete reference implementation

**Effort:** Medium — new component development against a complete prototype reference
**Risk:** Low — design is fully specified and demonstrated
**Timeline Impact:** Minimal — replaces rather than adds to the backlog

---

## Section 4: Detailed Change Proposals

### 4.1 — Rewrite Story 7.8 in Epic 7 ✅ APPROVED

Replace the entire Story 7.8 section in `epic-7-ui-theme-visual-identity.md` with conversation-driven homepage design including:
- New title: "Conversation-Driven Homepage with Depth Scroll"
- New user story, acceptance criteria, component structure, technical details
- Full acceptance checklist

### 4.2 — Update sprint-status.yaml ✅ APPROVED

```yaml
# OLD
7-8-home-page-redesign-with-color-block-composition: done

# NEW
7-8-conversation-driven-homepage-with-depth-scroll: ready-for-dev
```

### 4.3 — Archive story-7.5-home-page-brainstorm.md ✅ APPROVED

Add superseded notice at top pointing to Combined Direction prototype.

### 4.4 — Full Story 7.8 Content ✅ APPROVED

Complete rewrite with all acceptance criteria, technical details, component structure, depth scroll color system, and acceptance checklist. See prototype reference for definitive design.

---

## Section 5: Implementation Handoff

**Change Scope: Minor** — Direct implementation by development team.

**Handoff:**
1. **Planning artifacts update** (this workflow): Update epic file, sprint status, brainstorm archive
2. **Development** (Story 7.8 implementation): Build React components from prototype reference
   - Use `direction-combined.html` as the definitive design reference
   - Translate vanilla JS/CSS patterns into React + Tailwind + CSS custom properties
   - Key architectural decision: `DepthScrollProvider` React context for scroll state management

**Success Criteria:**
- Homepage matches the Combined Direction prototype in both light and dark modes
- All acceptance criteria from the rewritten Story 7.8 are met
- Responsive design works at desktop, tablet, and mobile breakpoints
- Theme toggle cycles correctly between auto/dark/light
- `prefers-reduced-motion` is respected for all animations
