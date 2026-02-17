# Sprint Change Proposal — 2026-02-17

**Author:** Vincentlay + BMad Correct Course Workflow
**Date:** 2026-02-17
**Scope:** Minor — Direct implementation by development team
**Status:** Approved

---

## Section 1: Issue Summary

### Problem Statement

During Epic 8 implementation (Results Page Content Enrichment), a design enhancement request was raised to:

1. **Add animated geometric sea life** to the assessment chat page, following the design mockup at `apps/front/geometric-ocean-mockup.html`
2. **Create Storybook stories** for the sea life components
3. **Add a 2000-character limit** with visible counter to the chat message input

These are additive visual/UX improvements — no backend changes, no API modifications, no existing functionality is modified.

### Context

- The geometric ocean mockup already exists as a complete HTML/CSS prototype
- Epic 4 (Frontend Assessment UI) and Epic 7 (UI Theme & Visual Identity) are both done
- The chat page already has a depth journey system (Story 7.10) with zone progression
- Storybook infrastructure is already configured (Story 4.5)

### Evidence

- Design mockup: `apps/front/geometric-ocean-mockup.html` — complete CSS animation system with 5 creature types, light/dark modes, pulse/depth states
- UX Spec already references ocean-themed decorative elements (Story 7.7)

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| Epic 7 (UI Theme & Visual Identity) | **Minor addition** | New Story 7.16 added. Epic was done, reopened for this visual enhancement. |
| Epic 4 (Frontend Assessment UI) | **Minor addition** | New Story 4.8 added. Character limit on chat input. |
| All other epics | No impact | — |

### Story Impact

- **No existing stories modified** — both changes are new stories
- Story 7.10 (Depth Journey) provides the ``depthProgress` prop` context that Story 7.16 will integrate with
- The current chat input component will be enhanced (not replaced) for Story 4.8

### Artifact Conflicts

| Artifact | Conflict? | Action Needed |
|----------|-----------|---------------|
| PRD | None | No changes |
| Architecture | None | No backend changes |
| UI/UX Spec | Aligned | Sea life extends existing ocean-themed decorative system |
| FRONTEND.md | None | Follows existing patterns (data-slot, semantic tokens) |
| Storybook | Extended | New stories added |

### Technical Impact

- **Zero backend changes** — purely frontend React components + CSS
- **Zero API changes** — character limit enforced client-side only
- **Minimal bundle impact** — SVG shapes rendered inline, CSS animations (no new dependencies)

---

## Section 3: Recommended Approach

**Path:** Direct Adjustment — Add 2 new stories within existing epic structure.

**Rationale:**
- The HTML mockup already provides a complete implementation blueprint
- No architectural decisions needed — follows existing patterns (semantic tokens, data-slot, depthProgress prop)
- Both changes are independent and can be worked in parallel
- Effort: Low | Risk: Low | Timeline impact: None

---

## Section 4: Detailed Change Proposals

### Proposal 1: Story 7.16 — Geometric Ocean Sea Life Ambient Layer

**Epic:** 7 (UI Theme & Visual Identity)
**Scope:** Frontend-only

**Story:**

As a **User taking the 30-minute assessment**,
I want **to see subtle, animated geometric sea life creatures behind the chat conversation**,
So that **the assessment feels immersive and alive — like exploring an underwater world — without distracting from the conversation**.

**Acceptance Criteria:**

- Seaweed (Teal): Groups at left/right edges, center accents on desktop. Gentle sway animation (~5s cycle). Center groups hidden on mobile (< 900px).
- Diamond Fish (Orange): 3 fish swimming across at different heights/speeds (35-48s). Diamond body + smaller diamond tail with bob animation.
- School Fish (Pink): 9 triangle-shaped fish in loose formation with individual drift.
- Jellyfish (Purple): 2 jellies drifting vertically (55-65s). Bell pulse + tentacle sway.
- Bubbles (Peach/warm): 8 bubbles rising from bottom with slight horizontal sway.
- Pulse State: On message arrival, creatures react (seaweed sways wider, fish speed up, school scatters, jelly pulses harder). Reverts after 3s.
- Depth State: In "deep" zone (from `depthProgress` prop), animations slow down (~30% longer duration).
- Dark Mode: Bioluminescent palette (teal seaweed, gold fish, pink school, lighter purple jelly).
- Opacity: All creatures at very low opacity (5-22%) — ambient, not distracting.
- `prefers-reduced-motion`: Disable all animations.
- `aria-hidden`: Entire ocean layer is decorative.
- Mobile: Center seaweed groups hidden < 900px.

**Component Structure:**

```
apps/front/src/components/sea-life/
  GeometricOcean.tsx          # Full scene container (absolute, inset-0, z-0, pointer-events-none)
  Seaweed.tsx                 # Teal stalks with sway animation
  DiamondFish.tsx             # Orange diamond body + tail, swim paths
  SchoolFish.tsx              # Pink triangle formation with individual drift
  Jellyfish.tsx               # Purple bell + tentacles, vertical drift
  Bubbles.tsx                 # Rising peach/warm bubbles
  sea-life.stories.tsx        # Storybook stories for all components
```

**CSS Variables (creature-specific):**
- `--seaweed-color`, `--fish-body-color`, `--fish-tail-color`, `--school-color`, `--jelly-bell-color`, `--bubble-border-color`
- Opacity tokens: `--seaweed-opacity`, `--fish-opacity`, `--school-opacity`, `--jelly-opacity`, `--bubble-opacity`
- All with light/dark mode variants

**Integration:** `GeometricOcean` component placed inside the chat container, behind chat content. Reads `pulse` and `depth` state from parent context.

**Storybook:**
- Full scene story with controls for pulse/depth/dark mode
- Individual creature stories for isolated development

**Acceptance Checklist:**
- [ ] All 5 creature types rendering with correct animations
- [ ] Pulse state reacts to message arrival (3s duration)
- [ ] Depth state slows animations
- [ ] Dark mode bioluminescent palette
- [ ] Low opacity (5-22%) — ambient, not distracting
- [ ] `prefers-reduced-motion` respected
- [ ] `aria-hidden` on ocean layer
- [ ] Mobile responsive (center groups hidden < 900px)
- [ ] Storybook stories for full scene + individual creatures
- [ ] `data-slot` attributes on all component parts
- [ ] Uses semantic color tokens from globals.css
- [ ] Zero new npm dependencies

---

### Proposal 2: Story 4.8 — Message Character Limit with Counter

**Epic:** 4 (Frontend Assessment UI)
**Scope:** Frontend-only

**Story:**

As a **User taking the assessment**,
I want **to see a character counter on the message input showing usage out of 2,000 characters**,
So that **I know when I'm approaching the limit and my messages stay at a reasonable length**.

**Acceptance Criteria:**

- Real-time counter display: `0 / 2,000` format
- Counter updates as user types
- Warning color (amber/`--warning`) at 90%+ (1,800+ chars)
- Destructive color (red/`--destructive`) at 100% (2,000 chars)
- Input capped at 2,000 characters (no overflow)
- Paste text truncated to 2,000 characters
- Send button remains enabled at max length
- Mobile-responsive (counter visible, doesn't obscure input)

**Technical Details:**

```typescript
const MAX_CHARS = 2000;
const WARNING_THRESHOLD = 0.9; // 90%

const charCount = message.length;
const isWarning = charCount >= MAX_CHARS * WARNING_THRESHOLD;
const isMax = charCount >= MAX_CHARS;
```

**Files Modified:**
- Chat input component (TherapistChat.tsx or equivalent): Add `maxLength={2000}`, counter display
- Counter styling: semantic tokens (`--muted-foreground`, `--warning`, `--destructive`)

**Acceptance Checklist:**
- [ ] Counter displays current/max characters
- [ ] Counter updates in real-time
- [ ] Warning color at 90%+ (1,800+ chars)
- [ ] Destructive color at 100% (2,000 chars)
- [ ] Input capped at 2,000 characters
- [ ] Paste truncation works correctly
- [ ] Send button works at max length
- [ ] Mobile-responsive
- [ ] Uses semantic color tokens
- [ ] `data-slot="char-counter"` attribute on counter element

---

## Section 5: Implementation Handoff

### Scope Classification: Minor

Both changes are direct implementation tasks for the development team. No backlog reorganization, no architectural review needed.

### Sprint Status Updates

```yaml
# Epic 7 reopened for Story 7.16
epic-7: in-progress
7-16-geometric-ocean-sea-life-ambient-layer: ready-for-dev

# Epic 4 reopened for Story 4.8
epic-4: in-progress
4-8-message-character-limit-with-counter: ready-for-dev
```

### Implementation Order

Both stories are independent and can be worked in parallel:

1. **Story 7.16** (Sea Life) — Componentize the HTML mockup into React, integrate with `depthProgress` prop, create Storybook stories
2. **Story 4.8** (Character Limit) — Straightforward input enhancement

### Success Criteria

- Sea life animations visible on chat page, subtle and non-distracting
- Storybook documents all sea life components
- Character counter visible and functional with color thresholds
- All new components follow FRONTEND.md conventions (data-slot, semantic tokens)
- Zero backend changes, zero new dependencies
