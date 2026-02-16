# Sprint Change Proposal — Epic 8 Confidence-to-Message-Count Trigger Migration

Date: 2026-02-16
Workflow: correct-course
Mode: Incremental
Trigger: Stories 8.4 and 8.5 (Epic 8) — free tier model shifted from confidence-based to message-count-based

## Section 1: Issue Summary

**Problem Statement:** The free tier assessment model was recently refactored from confidence-based gating to message-count-based gating (Story 4.7, Story 7.11, Story 2.11). The `freeTierMessageThreshold` (default: 15 user messages) now drives chat blocking, progress display, and results reveal. However, Stories 8.4 and 8.5 in Epic 8 still reference confidence percentages (70% and 85%) as triggers for personalized portrait generation, creating an inconsistency with the rest of the system.

**Discovery Context:** During sprint execution, after completing Story 4.7 (message-count progress indicator) and Story 7.11 (auth-gated results reveal), it became clear that the confidence-based conditions in Stories 8.4 and 8.5 are misaligned with the current architecture. Additionally, Story 8.5 requires tier infrastructure (free vs premium user distinction) that does not yet exist.

**Evidence:**
- Story 4.7 (done): Replaced confidence-based progress with message-count-based progress
- Story 2.11 (done): Removed confidence from `SendMessageResponse` — frontend no longer tracks confidence
- `send-message.use-case.ts`: Blocks messages at `messageCount >= config.freeTierMessageThreshold`
- Story 7.11 (done): Auth-gated results trigger at message threshold, not confidence
- `useTherapistChat.ts`: `isConfidenceReady` = `userMessageCount >= FREE_TIER_THRESHOLD`
- The entire free tier UX is now message-count-driven

---

## Section 2: Impact Analysis

### Epic Impact
- **Epic 8 (Results Page Content Enrichment):** Stories 8.4 and 8.5 affected. Stories 8.1-8.3 (done) are unaffected.
- **Epics 1-7:** No impact. All completed or unrelated.
- **Epic 6 (Phase 2):** No impact.

### Story Impact
- **Story 8.4:** Trigger condition changed from `overallConfidence >= 70%` to `messageCount >= freeTierMessageThreshold`. Promoted from Phase 2 to Phase 1 (MVP).
- **Story 8.5:** Deferred to Phase 2. Requires tier infrastructure (free vs premium) that doesn't exist yet. Status changed from `ready-for-dev` to `backlog`.

### Artifact Conflicts
- **Epic 8 file:** Header, Content Architecture, Content Tiers, Freemium Model, Stories 8.4 and 8.5, Implementation Sequence, and Key Technical Decisions all updated.
- **sprint-status.yaml:** Story 8.4 slug updated, Story 8.5 status changed to `backlog`.
- **PRD:** No conflict — message-count gating is consistent with PRD direction.
- **Architecture:** No conflict — aligns with existing `freeTierMessageThreshold` infrastructure.

### Technical Impact
- Story 8.4 implementation will use `config.freeTierMessageThreshold` (same config used by `send-message.use-case.ts`)
- No new infrastructure needed — portrait generation hooks into existing message-count gate
- Story 8.5 blocked until tier infrastructure is built (new epic or story required)

---

## Section 3: Recommended Approach

**Selected: Option 1 — Direct Adjustment**

**Rationale:**
- The change is conceptual (swap trigger condition), not structural
- Aligns Story 8.4 with every other part of the system that already uses message count
- Story 8.5 deferral is appropriate — no tier infrastructure exists to implement against
- No rollback needed (neither story has been implemented yet)
- No MVP scope reduction — Story 8.4 is promoted to Phase 1

**Effort:** Low
**Risk:** Low — uses existing infrastructure, no new patterns
**Timeline Impact:** None — Story 8.4 remains `ready-for-dev`, Story 8.5 moves to `backlog`

---

## Section 4: Detailed Change Proposals

### 4.1 — Epic 8 Header Updates ✅ APPROVED
- Phase description updated: Phase 1 now includes Story 8.4
- Goal updated to reference message threshold instead of freemium model phasing
- User Value updated to reference "extended conversations" instead of confidence percentages

### 4.2 — Results Page Layout ✅ APPROVED
- Portrait section: "Appears when overallConfidence >= 70%" → "Appears when user reaches free tier message threshold"
- Regeneration: "Regenerated at 85% for paid users" → "Regenerated with richer data for paid users (Phase 2)"

### 4.3 — Content Tiers + Freemium Model ✅ APPROVED
- Dynamic portrait: ">= 70% confidence" → "Free tier message threshold reached"
- Enhanced portrait: ">= 85% confidence, paid tier" → "Paid tier, Phase 2"
- Free tier: "Chat until ~70% confidence" → "Chat until free tier message threshold (default: 15 user messages)"
- Paid tier: Marked as "Phase 2 — requires tier infrastructure"

### 4.4 — Story 8.4 Rewrite ✅ APPROVED
- Title: "Pre-Generate Personalized Portrait at 70% Confidence" → "Pre-Generate Personalized Portrait at Free Tier Message Threshold"
- All acceptance criteria updated from confidence to message count
- Technical details reference `config.freeTierMessageThreshold` and `FREE_TIER_MESSAGE_THRESHOLD` env var
- Trigger matches result reveal condition

### 4.5 — Story 8.5 Deferral ✅ APPROVED
- Title: "Regenerate Personalized Portrait at 85% Confidence (Paid Tier)" → "Regenerate Personalized Portrait for Paid Tier (Phase 2 — Deferred)"
- Added DEFERRED banner with explanation
- Added Prerequisites section (tier infrastructure, payment system, extended conversation)
- All confidence references replaced with message-count language
- Status: `ready-for-dev` → `backlog`

### 4.6 — Implementation Sequence Update ✅ APPROVED
- Stories 8.1-8.3 marked ✅ (done)
- Story 8.4 description updated to reference message threshold
- Story 8.5 marked as Phase 2, DEFERRED
- Phase notes updated: 8.4 promoted to Phase 1, 8.5 is Phase 2

### 4.7 — sprint-status.yaml Update ✅ APPROVED
- Story 8.4 slug: `8-4-pre-generate-personalized-portrait-at-free-tier-message-threshold`
- Story 8.5 slug: `8-5-regenerate-personalized-portrait-paid-tier`
- Story 8.5 status: `backlog`
- Phase comments updated

---

## Section 5: Implementation Handoff

**Change Scope: Minor** — Direct implementation by development team.

**Handoff:**

**1. Planning Artifacts Updated (This Workflow):** ✅
- Epic 8 file updated with all approved changes
- sprint-status.yaml updated
- Sprint Change Proposal generated

**2. Development (Story 8.4 Implementation):**
- Story 8.4 is `ready-for-dev` — can be picked up immediately
- Uses existing `freeTierMessageThreshold` config (default: 15, env: `FREE_TIER_MESSAGE_THRESHOLD`)
- Portrait generation triggers when `messageCount >= freeTierMessageThreshold` (same gate as chat blocking and results reveal)
- One Claude API call per completed assessment
- DB migration: add `personal_description TEXT NULL` to `assessment_sessions`

**3. Story 8.5 (Deferred):**
- Remains in `backlog` until tier infrastructure is built
- Prerequisites: tier system, payment integration, extended conversation unlock
- No development work needed until prerequisites are met

**Success Criteria:**
- Epic 8 file consistently references message count (no remaining confidence-based conditions)
- sprint-status.yaml reflects correct slugs and statuses
- Story 8.4 is implementable with current infrastructure (no tier system needed)
- Story 8.5 is clearly deferred with documented prerequisites

---

## Approval and Handoff Log

- Approval status: Approved by user (all 5 proposals approved individually in incremental mode)
- Approval date: 2026-02-16
- Scope classification: Minor
- Handoff route: Development team (direct implementation of Story 8.4)
- Sprint status updates: Applied (Story 8.4 slug updated, Story 8.5 moved to backlog)

---
---

# Sprint Change Proposal #2 — Results Page Layout Redesign (Mockup 7: Detail Zone)

Date: 2026-02-16
Workflow: correct-course
Mode: Incremental
Trigger: UX design evolution — new mockup for results page layout

## Section 1: Issue Summary

A new UX mockup (Mockup 7: Detail Zone) has been created that redesigns the results page from a vertical accordion layout to a grid-based card layout with inline detail zones. The current implementation (built across Epics 5 and 7) uses `TraitBar` components in a vertical list with `FacetBreakdown` inline expansion and an `EvidencePanel` modal dialog. The mockup introduces:

- Grid-based trait cards (3 per row) with tap-to-expand detail zones
- Inline evidence display replacing modal dialogs
- Radar chart and confidence ring as dedicated cards (using shadcn Chart / Recharts)
- Separated archetype description card (removed from hero)
- Structured 4-quadrant personalized portrait layout
- Redesigned share card with visibility toggle (shadcn Switch)

**Reference mockup:** `_bmad-output/planning-artifacts/result-page-ux-design/profile-mockup-7-detail-zone.html`

**Design decision:** Keep the existing hero section (ArchetypeHeroSection) but remove the archetype description from it. The description moves to a dedicated full-width card below the hero.

**Context:** The change was identified during Epic 8 (Results Page Content Enrichment) as an opportunity to improve the results page UX before completing the remaining stories. All data flows, APIs, and domain logic remain unchanged.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Status | Impact |
|------|--------|--------|
| **Epic 8** (Results Page Content Enrichment) | In progress | New Story 8.6 added. Story 8.4 frontend spec updated (4-quadrant portrait). Implementation sequence reordered. |
| **Epic 5** (Results & Profile Sharing) | Done | No reopening needed. Same data, new layout. |
| **Epic 7** (UI Theme & Visual Identity) | Done | No reopening needed. Design tokens/colors unchanged. |
| **Epics 1-4, 6** | Done/Backlog | No impact. |

### Artifact Conflicts

| Artifact | Impact |
|----------|--------|
| **PRD** | None — MVP goals preserved |
| **Architecture** | None — no backend, API, or schema changes |
| **UX Design Spec** | None — mockup HTML serves as design reference |
| **Sprint Status** | Updated — Story 8.6 added, 8.4 re-sequenced |
| **CI/CD / Deployment** | None |

### Technical Impact

- **No backend changes** — same API endpoints, same data contracts
- **No database changes** — same schema (8.4's `personal_description` column unchanged, stores JSON string)
- **Frontend only** — component restructuring within `apps/front/src/components/results/`
- **New dependencies** — shadcn `chart` (brings Recharts) and `switch` components
- **Removed components** — `TraitScoresSection`, `TraitBar`, `FacetBreakdown`, `EvidencePanel` replaced by new components

---

## Section 3: Recommended Approach

**Selected: Option 1 — Direct Adjustment**

**Rationale:**
- Pure frontend restructure with zero backend risk
- All data flows unchanged — hooks, API calls, domain logic untouched
- Mockup provides pixel-level design reference
- Effort: Medium (several components, but well-scoped)
- Risk: Low (layout change only, comprehensive mockup reference)
- No rollback, no MVP scope change needed

---

## Section 4: Detailed Change Proposals

### 4.1 — Epic 8 Content Architecture: New Layout Diagram ✅ APPROVED
- Replaced vertical layout diagram with Mockup 7 grid layout
- Sections: Hero → Grid Container (About Archetype → Portrait → Radar + Confidence → Trait Cards → Detail Zones → Quick Actions → Share)

### 4.2 — Story 8.4: Personalized Portrait Frontend Spec ✅ APPROVED
- Portrait output format: single narrative → structured JSON with 4 keys (`strengths`, `tensions`, `connections`, `resilience`)
- Frontend renders 2x2 grid of insight sections with trait-colored dots
- Rainbow accent bar (5 trait colors) at top of card
- DB column unchanged (TEXT, stores JSON string)
- JSON parsing with fallback for legacy single-string format

### 4.3 — New Story 8.6: Results Page Layout Redesign ✅ APPROVED
Full implementation story covering:
- Hero modification (remove description)
- New components: `AboutArchetypeCard`, `PersonalityRadarChart`, `ConfidenceRingCard`, `TraitCard`, `DetailZone`, `QuickActionsCard`
- Redesigned `ShareProfileSection`
- shadcn Chart (Recharts RadarChart) for radar pentagon
- shadcn Switch for visibility toggle
- CSS Grid container (max-width 1120px, auto-fill columns)
- Detail zone animation (max-height transition, ~400ms)
- Responsive behavior (3→2→1 columns)
- Component cleanup (remove replaced components)

### 4.4 — Epic 8 Implementation Sequence ✅ APPROVED
- Reordered: 8.1 ✅ → 8.2 ✅ → 8.3 ✅ → **8.6** (layout) → 8.4 (portrait) → 8.5 (deferred)
- 8.6 must land before 8.4 (portrait component renders in new grid)

### 4.5 — Sprint Status Update ✅ APPROVED
- Added: `8-6-results-page-layout-redesign-mockup-7-detail-zone: ready-for-dev`
- Changed: `8-4` from `ready-for-dev` to `backlog` (blocked by 8.6)

---

## Section 5: Implementation Handoff

**Change Scope: Minor** — Direct implementation by development team.

**Next story to implement:** Story 8.6 (Results Page Layout Redesign — Mockup 7 Detail Zone)

**Implementation order:**
1. **Story 8.6** — Layout redesign (frontend components, shadcn installs, grid restructure)
2. **Story 8.4** — Personalized portrait (DB migration, orchestrator, portrait component in new layout)

**Dependencies:**
- 8.6 has no blockers — can start immediately
- 8.4 is blocked by 8.6 (portrait component renders inside new grid layout)

**New shadcn components to install:**
- `chart` (brings `recharts@2.15.4` as dependency)
- `switch`

**Components to create:**
- `AboutArchetypeCard` — full-width card, archetype description
- `PersonalityRadarChart` — shadcn ChartContainer + Recharts RadarChart
- `ConfidenceRingCard` — circular SVG ring or Recharts RadialBarChart
- `TraitCard` — clickable card with compact facet grid
- `DetailZone` — full-width collapsible panel with facet evidence grid
- `QuickActionsCard` — action list card

**Components to remove/replace:**
- `TraitScoresSection` → replaced by TraitCard grid
- `TraitBar` → replaced by TraitCard
- `FacetBreakdown` → replaced by DetailZone facet grid
- `EvidencePanel` → replaced by inline DetailZone

**Components to modify:**
- `ProfileView.tsx` — restructure from depth zones to CSS Grid
- `ArchetypeHeroSection.tsx` — remove description rendering
- `ShareProfileSection.tsx` — redesign to match mockup

**Success criteria:**
- Results page visually matches Mockup 7 reference HTML
- All trait data, evidence, and sharing functionality preserved
- Responsive across desktop/tablet/mobile
- No backend changes required
- Existing integration tests still pass

---

## Approval and Handoff Log

- Approval status: Approved by user (all 5 proposals approved individually in incremental mode)
- Approval date: 2026-02-16
- Scope classification: Minor
- Handoff route: Development team (direct implementation of Story 8.6, then 8.4)
- Sprint status updates: Applied (Story 8.6 added as ready-for-dev, Story 8.4 moved to backlog)
