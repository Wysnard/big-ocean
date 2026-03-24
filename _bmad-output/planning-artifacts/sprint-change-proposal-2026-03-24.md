# Sprint Change Proposal — Homepage Redesign

**Date:** 2026-03-24
**Trigger:** Brainstorming session 2026-03-23 (homepage improvement — messaging, layout, UX)
**Scope:** Moderate — direct adjustment within existing epic structure
**Approved by:** Vincentlay

---

## 1. Issue Summary

The brainstorming session on 2026-03-23 generated 66 ideas across 6 themes and identified a fundamental misalignment between the homepage's narrative architecture and its actual visitor population. The homepage was built as a persuasion engine for test-skeptics (14-beat arc defining Big Ocean against other personality tests), but most visitors either don't think about personality tests or arrive with entirely different motivations (invited for relationship analysis, social media curiosity, emotional searching).

**Key insights:**
- The test-frame trap: "Not a personality quiz" only speaks to test-aware visitors
- The founder's in-person pitch (a transformation story) converts instantly — the homepage doesn't use this approach
- The product consistently exceeds expectations — the marketing problem is underselling, not overpromising
- PWYW is a hidden trust-builder being treated as a liability
- Three visitor fears (process anxiety, time commitment, self-exposure) are never addressed

## 2. Impact Analysis

### Epic Impact
- **Epic 37 (Homepage & Acquisition Funnel):** Reopened from `done` to `in-progress`. Two new stories added (37-3, 37-4). Original stories (37-1, 37-2) preserved as delivered.
- No other epics affected.

### Artifact Changes Applied
| Artifact | Change | Lines |
|----------|--------|-------|
| `epics.md` | Epic 8 summary rewritten (FRs, notes) | ~255-258 |
| `epics.md` | Stories 8.1/8.2 marked as delivered, new Stories 8.3/8.4 added | ~1303-1420 |
| `architecture.md` | Component inventory updated (home/ file count, route table) | ~969, ~1230 |
| `sprint-status.yaml` | Epic 37 reopened, stories 37-3/37-4 added as backlog | ~621-627 |

### Artifacts Already Aligned (no changes needed)
| Artifact | Status |
|----------|--------|
| `prd.md` | FR59-FR66 already integrated from brainstorming |
| `ux-design-specification.md` | Section 16 already contains full redesign spec |

## 3. Recommended Approach

**Direct Adjustment** — modify/add stories within existing Epic 37.

**Rationale:**
- No architectural changes needed — content restructure reuses existing component infrastructure
- PRD and UX spec already aligned — only epic/sprint tracking was stale
- Two focused stories cover the full redesign scope
- No cross-epic dependencies introduced

**Effort:** Medium (frontend content work, no backend changes)
**Risk:** Low (existing infrastructure preserved, no data model changes)
**Timeline impact:** None on other epics — Epic 37 is independent

## 4. New Stories

### Story 8.3 / 37-3: Homepage Narrative Restructure & Hero Redesign
- Compress 14 beats to 8
- New hero: transformation hook, concrete subtitle, PWYW tagline, single CTA
- Portrait excerpt at Beat 3 (~33% scroll)
- Nerin depth preview at Beat 4
- Founder + PWYW at Beat 6
- Remove ComparisonCard, TraitStackEmbed, ComparisonTeaserPreview, ScrollIndicator from flow
- Recalibrate DepthMeter for 8 beats
- Update OG meta tags

### Story 8.4 / 37-4: How It Works, Archetype Gallery & Conversion Flow
- New HowItWorks section (3 fear-resolving steps)
- New ArchetypeGalleryPreview (3-4 cards, horizontal scroll mobile / grid desktop)
- Final CTA section ("What's YOUR code?")
- Mobile sticky CTA bar (StickyConversionBar, CSS-only)
- Remove embedded CTAs from ResultPreviewEmbed

## 5. Implementation Handoff

**Scope classification:** Moderate — direct implementation by dev team
**Handoff to:** Development team

**Implementation sequence:**
1. Story 8.3 first (narrative restructure — the bulk of the work)
2. Story 8.4 second (new sections — depends on 8.3 for page flow context)

**Success criteria:**
- Homepage communicates value in 3 seconds to zero-context visitors (FR59)
- Portrait excerpt visible within 40% scroll depth (FR62)
- Single CTA, no competing alternatives (FR61)
- Three visitor fears addressed (FR64)
- PWYW surfaced before CTA (FR65)
- LCP <1s maintained (NFR)

**Reference:** UX Spec §16.6 for complete design direction, §16.11 for implementation notes.
