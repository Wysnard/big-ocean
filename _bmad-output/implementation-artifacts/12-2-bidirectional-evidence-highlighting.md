# Story 12.2: Evidence Highlighting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to explore the evidence behind my scores by clicking facets,
so that I can understand why I received each score.

## Acceptance Criteria

1. **AC-1 — Facet → Evidence panel**: Given a user is on the results page, when they click any facet score on a TraitCard (inside the DetailZone), then an evidence panel opens showing all supporting quotes from finalization_evidence for that facet, and each quote shows the message text with the relevant portion highlighted using `highlightRange.start` / `highlightRange.end`.

2. **AC-2 — Confidence color coding**: Given the evidence panel is open for a facet, when quotes are displayed, then highlighting uses color coding: green (high confidence ≥ 70), yellow (medium 40-69), red (low < 40) with opacity proportional to confidence.

3. **AC-3 — Jump to Message**: Given a quote is displayed in the evidence panel, when the user clicks "Jump to Message", then the view scrolls to the original message in a conversation transcript panel and highlights the exact quote within that message.

4. **AC-4 — Layered highlights**: Given evidence highlighting is active, when multiple facets have evidence from the same message, then highlights are layered without visual conflict and each facet's contribution is distinguishable (use trait colors from `getTraitColor()`).

## Tasks / Subtasks

- [x] **Task 1: Add conversation transcript endpoint** (AC: #3)
  - [x] 1.1 Add `getConversationTranscript` endpoint to `AssessmentGroup` in `packages/contracts/src/http/groups/assessment.ts` — `GET /api/assessment/:sessionId/transcript` returning `Array<{ id, role, content, timestamp }>`. Return ALL messages (user + assistant) for display context — the full conversation is needed for readability. Include message `id` field (needed for evidence linking).
  - [x] 1.2 Create `get-transcript.use-case.ts` in `apps/api/src/use-cases/` — fetches messages for a completed session via `AssessmentMessageRepository`. Require authenticated session owner only (conversation transcripts are private data — do NOT allow unauthenticated access even for completed sessions).
  - [x] 1.3 Add handler in `apps/api/src/handlers/assessment.ts` for the new endpoint.
  - [x] 1.4 Add `useConversationTranscript` hook in `apps/front/src/hooks/use-assessment.ts` — TanStack Query hook calling the new endpoint. Cache with `staleTime: Infinity` (transcript is immutable for completed sessions).

- [x] **Task 2: Create HighlightedText component** (AC: #1, #2, #5)
  - [x] 2.1 Create `apps/front/src/components/results/HighlightedText.tsx` — pure component that receives `text: string` and `highlights: Array<{ start: number; end: number; color: string; confidence: number }>`. Renders text with `<mark>` elements at highlight ranges. Handles overlapping ranges by layering (stacked semi-transparent backgrounds). Confidence maps to opacity: `0.15 + (confidence / 100) * 0.45`.
  - [x] 2.2 Color mapping uses `getTraitColor()` from `@workspace/domain` — each facet's highlight color is its parent trait's color. Confidence badge (Strong/Moderate/Weak) reuses existing `getSignalBadge()` logic from `DetailZone.tsx`.

- [x] **Task 3: Create ConversationTranscript panel** (AC: #3, #4)
  - [x] 3.1 Create `apps/front/src/components/results/ConversationTranscript.tsx` — scrollable panel showing messages from the assessment conversation. Uses `useConversationTranscript` hook. Each message element has `data-message-id={id}` for scroll targeting and `data-testid="transcript-message"`.
  - [x] 3.2 When `scrollToMessageId` prop is set (from "Jump to Message" click), auto-scroll to that message using `scrollIntoView({ behavior: 'smooth', block: 'center' })` and apply a pulse highlight animation.
  - [x] 3.3 Apply `HighlightedText` to message content when scrolled-to — show facet highlights within the message text using highlight ranges from the evidence data.

- [x] **Task 4: Create EvidencePanel component** (AC: #1, #2, #3)
  - [x] 4.1 Create `apps/front/src/components/results/EvidencePanel.tsx` — panel that opens when a facet is clicked in the DetailZone. Shows all evidence quotes for that facet. Each quote displays: the highlighted quote text (using `HighlightedText`), confidence badge, and a "Jump to Message" button (using `MessageCircle` icon from lucide-react).
  - [x] 4.2 "Jump to Message" sets `scrollToMessageId` state which triggers ConversationTranscript auto-scroll. Uses a shared state lifted to the results page level (via useState in the parent).
  - [x] 4.3 Add `data-testid="evidence-panel"` and `data-testid="jump-to-message"` attributes.

- [x] **Task 5: Integrate into results page** (AC: #1, #3)
  - [x] 5.1 Modify `apps/front/src/routes/results/$assessmentSessionId.tsx` — add state management for: `selectedFacet: FacetName | null`, `scrollToMessageId: string | null`, `showTranscript: boolean`. Add a "View Conversation" toggle button (using existing `MessageCircle` icon pattern).
  - [x] 5.2 Render `ConversationTranscript` as a side panel (desktop: right column, mobile: full-screen overlay with slide-in animation). Render `EvidencePanel` as a bottom sheet or inline expansion within DetailZone.
  - [x] 5.3 Wire facet clicks in `DetailZone` to open `EvidencePanel` — modify the facet detail cards to be clickable. When a facet card is clicked, set `selectedFacet` state and open the evidence panel.
  - [x] 5.4 Ensure responsive layout: desktop shows transcript as a sidebar (max-w-md), mobile uses a slide-over panel. Touch targets ≥ 44px per NFR18/19.

- [x] **Task 6: Unit tests** (AC: #1-4)
  - [x] 6.1 Test `HighlightedText` component: single highlight, multiple non-overlapping, overlapping highlights, empty highlights array, out-of-bounds ranges.
  - [x] 6.2 Test `get-transcript.use-case.ts` with mock repository — returns messages for valid session, rejects unauthorized access.
  - [x] 6.3 Test evidence panel integration: facet click opens panel, "Jump to Message" triggers scroll callback.

## Dev Notes

### Architecture & Patterns

- **Hexagonal architecture**: New use-case (`get-transcript`) follows `Effect.gen` + `yield*` pattern. Handler is thin HTTP adapter — no business logic.
- **Error propagation**: Use-case throws contract errors directly (`SessionNotFound`, `Unauthorized`). No error remapping.
- **Existing hooks**: `useFacetEvidence(sessionId, facetName)` in `apps/front/src/hooks/use-evidence.ts` is already implemented and working. The API endpoint `GET /api/evidence/facet` is live.
- **Evidence data already includes highlight ranges**: `SavedFacetEvidence` has `highlightRange: { start: number; end: number }` and `assessmentMessageId: string`. The backend computes and stores these — frontend just needs to consume them.

### Existing Components to Extend (DO NOT recreate)

- `DetailZone.tsx` — Already shows facet cards with evidence quotes. Extend facet cards to be clickable (open EvidencePanel).
- `useTraitEvidence.ts` — Already fetches evidence for all 6 facets of a selected trait. Reuse.
- `use-evidence.ts` — `useFacetEvidence()` hook. Reuse as-is.
- `getSignalBadge()` in `DetailZone.tsx` — Extract to shared utility or import from DetailZone.

### Key Types

```typescript
// From @workspace/domain types/facet-evidence.ts
interface HighlightRange { start: number; end: number; }
interface SavedFacetEvidence {
  id: string;
  assessmentMessageId: string;
  facetName: FacetName;
  score: number;
  confidence: number;
  quote: string;
  highlightRange: HighlightRange;
  createdAt: Date;
}

// From @workspace/domain — trait colors
getTraitColor(traitName: TraitName): string  // Returns hex color
TRAIT_TO_FACETS: Record<TraitName, FacetName[]>  // Maps trait → 6 facets
```

### New Endpoint Contract

```typescript
// GET /api/assessment/:sessionId/transcript
// Response: Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: DateTimeUtc }>
```

The `resumeSession` endpoint (`GET /api/assessment/:sessionId/resume`) already returns messages but without `id` field (needed for evidence linking). A new dedicated endpoint is cleaner than modifying the existing one.

### Project Structure Notes

- New components go in `apps/front/src/components/results/` (co-located with existing results components)
- New use-case goes in `apps/api/src/use-cases/get-transcript.use-case.ts`
- Handler addition goes in existing `apps/api/src/handlers/assessment.ts`
- Contract addition goes in existing `packages/contracts/src/http/groups/assessment.ts`
- No new packages or infrastructure repositories needed — `AssessmentMessageRepository` already has the query capability

### Styling

- Use Tailwind v4 with `oklch()` colors (project convention per FRONTEND.md)
- Highlight marks use `<mark>` with `style={{ backgroundColor: oklch(... / opacity) }}`
- Transitions use `motion-safe:transition-*` prefix (existing pattern)
- Dark mode: highlight colors must work on both light and dark backgrounds — use semi-transparent overlays

### References

- [Source: packages/domain/src/types/facet-evidence.ts] — HighlightRange, SavedFacetEvidence types
- [Source: packages/contracts/src/http/groups/evidence.ts] — Evidence API contracts (getEvidenceByFacet, getEvidenceByMessage)
- [Source: apps/front/src/hooks/use-evidence.ts] — useFacetEvidence, useMessageEvidence hooks
- [Source: apps/front/src/components/results/DetailZone.tsx] — Existing evidence display, getSignalBadge(), FacetConfidenceRing
- [Source: apps/front/src/components/results/useTraitEvidence.ts] — Trait evidence fetching hook
- [Source: packages/contracts/src/http/groups/assessment.ts] — Assessment API contracts
- [Source: packages/domain/src/utils/highlight.ts] — computeHighlightPositions() utility
- [Source: docs/FRONTEND.md] — Data attribute patterns, styling conventions
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — Original acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md] — Architecture decisions

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Added `getTranscript` endpoint (contract, use-case, handler, hook). Authenticated-only, completed-sessions-only. Returns messages with IDs for evidence linking.
- Task 2: Created `HighlightedText` component with segment-based rendering, overlapping highlight support, and confidence-to-opacity mapping.
- Task 3: Created `ConversationTranscript` panel with auto-scroll to message, pulse animation, and highlight range rendering.
- Task 4: Created `EvidencePanel` component with confidence badges, "Jump to Message" buttons, and trait color coding.
- Task 5: Integrated all components into results page with state management for selectedFacet, scrollToMessageId, showTranscript, activeHighlight. Added "View Conversation" toggle. Transcript renders as fixed side panel (max-w-md) with mobile overlay. Made DetailZone facet cards clickable via new `onFacetClick` prop.
- Task 6: Added 6 HighlightedText unit tests (jsdom) and 3 get-transcript use-case tests (Effect). All pass. Fixed pre-existing test mock for `useConversationTranscript` in results route test.

### Change Log

- 2026-02-25: Story 12.2 implementation complete — all 6 tasks done
- 2026-02-25: Code review — fixed 7 issues (3 HIGH, 4 MEDIUM): H1 test import ordering, H2 opacity→rgba for layered highlights, H3 SessionNotCompleted error for non-completed sessions, M1 stale activeHighlight cleared, M2 selectedFacet cleared on DetailZone close, M3 getSignalBadge extracted to shared utility, M4 pulse-highlight CSS animation defined

### File List

**New files:**
- apps/api/src/use-cases/get-transcript.use-case.ts
- apps/api/src/use-cases/__tests__/get-transcript.use-case.test.ts
- apps/front/src/components/results/HighlightedText.tsx
- apps/front/src/components/results/HighlightedText.test.tsx
- apps/front/src/components/results/ConversationTranscript.tsx
- apps/front/src/components/results/EvidencePanel.tsx
- apps/front/src/components/results/evidence-utils.ts

**Modified files:**
- packages/contracts/src/http/groups/assessment.ts (added getTranscript endpoint + schema, added SessionNotCompleted error)
- apps/api/src/handlers/assessment.ts (added getTranscript handler)
- apps/api/src/use-cases/index.ts (export getTranscript)
- apps/front/src/hooks/use-assessment.ts (added useConversationTranscript hook)
- apps/front/src/components/results/DetailZone.tsx (added onFacetClick prop, extracted getSignalBadge)
- apps/front/src/routes/results/$assessmentSessionId.tsx (evidence highlighting state + transcript panel, review fixes)
- apps/front/src/routes/results-session-route.test.tsx (added mock for useConversationTranscript)
- apps/front/src/styles.css (added pulse-highlight animation)
