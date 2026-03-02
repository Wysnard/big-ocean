# Sprint Change Proposal — 2026-03-02

## Issue Summary

Story 20-3 (Evidence Panel with Bidirectional Navigation) designs a separate panel on the results page for navigating between facet scores and conversation messages. However, Story 20-2 (Conversation Review UI with Inline Annotations) already provides evidence viewing in the natural context — the conversation page itself. A separate panel creates a redundant navigation layer without proportional UX value.

**Decision:** Remove Story 20-3. Extend Story 20-2 to include facet-click navigation from the results page directly to the conversation page.

## Impact Analysis

- **Epic 20 (Conversation Evidence Review):** Reduced from 3 stories to 2. Still achieves the same transparency goal.
- **Architecture (Decision 12):** Unaffected — annotations via extended message response remains the mechanism.
- **PRD FRs:** FR17, FR17.1, FR18, FR18.1 updated from panel-based to navigation-based descriptions.
- **Existing code:** `EvidencePanel.tsx` and related hooks (`useFacetEvidence`) become dead code — to be cleaned up during 20-2 implementation.

## Recommended Approach

**Direct Adjustment** — Minor scope reduction within Epic 20.

- Effort: Low
- Risk: Low
- Timeline impact: Saves implementation time (one fewer story)

## Detailed Changes

### 1. Story 20-3: Removed

Entire story deleted from epic. Evidence navigation handled by 20-2 instead.

### 2. Story 5.2 (20-2): Extended ACs

Added acceptance criteria for facet-click navigation from results page to conversation:
- Facet click on results page → navigate to `/chat?sessionId={id}` with annotations
- Messages contributing to the selected facet highlighted and scrolled into view

### 3. Story 5.2: Parallelism updated

`blocks: [5.3]` → `blocks: []` (5.3 no longer exists)

### 4. FR Coverage Map: Updated

Panel-based FR descriptions replaced with navigation-based descriptions.

### 5. sprint-status.yaml: Updated

Story `20-3-evidence-panel-with-bidirectional-navigation` entry replaced with removal comment.

### 6. Code cleanup (during 20-2 implementation)

- Delete `apps/front/src/components/results/EvidencePanel.tsx`
- Remove EvidencePanel import/usage from `results/$assessmentSessionId.tsx`
- Remove `useFacetEvidence` hook usage from results route
- Remove `selectedFacet` state management from results route
- Update facet click handler to navigate to `/chat?sessionId=X`

## Implementation Handoff

**Scope: Minor** — Direct implementation by dev team.

**Deliverables:** Updated epics file, updated sprint status, code cleanup during Story 20-2 implementation.
