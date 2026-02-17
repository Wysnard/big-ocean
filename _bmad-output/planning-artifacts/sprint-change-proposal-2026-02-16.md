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

---
---

# Sprint Change Proposal #3 — Personalized Portrait Redesign (Nerin Dive-Master Voice)

**Date:** 2026-02-16
**Workflow:** correct-course
**Mode:** Incremental
**Trigger:** Brainstorming session redesigning Nerin's personalized portrait voice, structure, and format
**Brainstorming artifact:** `_bmad-output/brainstorming/brainstorming-session-2026-02-16.md`
**Implementation spec:** `_bmad-output/implementation-artifacts/personalized-portrait-spec.md`

---

## Section 1: Issue Summary

Story 8.4 (Pre-Generate Personalized Portrait at Free Tier Message Threshold) was implemented with a JSON-structured output (4 fields: strengths, tensions, connections, resilience) and a generic warm-prose system prompt. A brainstorming session on 2026-02-16 identified that this approach produces bland, horoscope-like output that doesn't leverage Nerin's established dive-master voice.

The brainstorming produced a comprehensive spec (`personalized-portrait-spec.md`) that replaces the portrait approach with:
- **Nerin's dive-master voice** — experienced, calm, empathic, mentoring
- **6-section flowing markdown** — The Dive, What Sets You Apart, Your Depths, Undercurrents, Murky Waters, The Ceiling
- **Evidence-first patterns** — conversation reference → revelation → insight
- **Metaphor density gradient** — heavy in opening, fading to plain language in closing
- **Single markdown string output** — LLM manages all structure, headers, emojis (no JSON)

The underlying architecture (separate LLM call, DB storage in `personal_description TEXT`, trigger at free tier threshold, one-call-per-session) remains correct. Only the prompt content, output format, and frontend rendering need changing.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| **Epic 8** (Results Page Content Enrichment) | **Direct** | Story 8.4 ACs need rewriting; PersonalPortrait component refactor within 8.6 layout |
| **Epic 5** (Results & Profile Sharing) | **None** | Portrait is private-only, not on public profiles |
| **Epics 1-4, 7** | **None** | Already completed, no touch points |
| **Epic 6** (Phase 2) | **None** | Privacy/GDPR, not related |
| **Story 8.5** (Phase 2 deferred) | **Benefits** | Paid tier regeneration will use the improved prompt |

### Story Impact

| Story | Status | Impact |
|-------|--------|--------|
| **8.4** (Personalized Portrait) | `done` → needs rework | Acceptance criteria rewrite + re-implementation of prompt and frontend component |
| **8.6** (Results Page Layout Redesign) | `review` | PersonalPortrait slot unchanged; internal component rendering changes |
| **8.1, 8.2, 8.3** | `done` | No impact |
| **8.5** | `backlog` (deferred) | No impact now; benefits later |

### Artifact Conflicts

| Artifact | Conflict? | Details |
|----------|-----------|---------|
| **PRD** | None | Change aligns with PRD vision ("feel understood") |
| **Architecture** | None | Same architecture, different prompt content |
| **DB Schema** | None | `personal_description TEXT` stores any string format |
| **API Contract** | None | `personalDescription: string \| null` unchanged |
| **Domain Types** | None | `PortraitGenerationInput` unchanged, `generatePortrait` returns `string` |
| **Use-Case** | None | `get-results.use-case.ts` is format-agnostic |
| **Handler** | None | Passes through unchanged |

### Technical Impact

- **Backend:** Portrait generator prompt rewrite (1 file)
- **Frontend:** PersonalPortrait component refactor from JSON grid to markdown rendering (1 file + test)
- **Mock:** Update mock output to return markdown (1 file)
- **Docs:** JSDoc comment update in domain interface (1 file)

---

## Section 3: Recommended Approach

**Selected: Direct Adjustment** — Modify Story 8.4 acceptance criteria and re-implement the affected code.

**Rationale:**
- The change is contained to 4-5 files with no architectural impact
- The trigger mechanism, DB storage, and API contract are all correct and unchanged
- No rollback needed — the infrastructure is sound, only the prompt and rendering change
- No MVP scope change — this improves quality within existing scope
- Story 8.4 status moves from `done` back to `in-progress` for the rework

**Effort:** Medium (prompt engineering + component refactor)
**Risk:** Low (contained changes, no schema/API/architecture impact)
**Timeline impact:** Minimal

---

## Section 4: Detailed Change Proposals

### Proposal 1: Portrait Generator Prompt & Output Format ✅ APPROVED

**File:** `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts`

**OLD:**
- `PORTRAIT_SYSTEM_PROMPT`: 8-line generic prompt ("Write 6-10 sentences that feel warm, insightful")
- Output: plain text or JSON string
- `maxTokens`: 1024

**NEW:**
- `PORTRAIT_SYSTEM_PROMPT`: Full Nerin dive-master voice specification including:
  - Voice identity, pronoun flow ("we" → "I"), three temporal modes
  - Evidence-first pattern (conversation reference → revelation → insight)
  - Metaphor density gradient (heavy → fading → plain)
  - 6-section structure guidelines with character limits per section
  - Formatting rules (## headers with emojis, markdown, no JSON)
  - Validated example as few-shot reference
  - Guardrails (strengths before weaknesses, no teasers, etc.)
- Output: single markdown string with ## headers
- `maxTokens`: increase to ~2048 (6 sections need more room)
- `formatTraitSummary()`: Enrich with confidence data per facet
- `formatEvidence()`: Include confidence levels for Murky Waters section

### Proposal 2: PersonalPortrait Frontend Component ✅ APPROVED

**File:** `apps/front/src/components/results/PersonalPortrait.tsx`

**OLD:**
- `tryParsePortrait()` JSON parsing with 4-field interface (`PortraitSections`)
- `SECTION_CONFIG` with trait-colored dots
- 2x2 grid layout for structured output
- Blockquote fallback for legacy plain text

**NEW:**
- Remove JSON parsing, `PortraitSections` interface, `SECTION_CONFIG`
- Render markdown content, split on `##` headers for per-section styling
- Keep: rainbow accent bar, card wrapper, Sparkles icon, title/subtitle, `displayName` prop, `col-span-full`
- Trust LLM output — no guaranteed section count

**File:** `apps/front/src/components/results/PersonalPortrait.test.tsx`

**OLD:** Tests JSON parsing, legacy fallback, partial JSON
**NEW:** Tests markdown rendering, `##` header splitting, displayName, accent bar

### Proposal 3: Story 8.4 Acceptance Criteria ✅ APPROVED

**File:** `_bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md`

Update Story 8.4 acceptance criteria and technical details to reflect:
- Output format: single markdown string with ## headers (not JSON)
- Nerin's dive-master voice with evidence-first patterns
- Frontend renders markdown with per-section styling (not 2x2 grid)
- Validated example referenced in prompt
- Remove: JSON parsing, 4-field structure, trait-colored dot requirements

Keep unchanged: trigger condition, DB column, one-call-per-session, responsive layout.

### Proposal 4: Mock Update ✅ APPROVED

**File:** `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts`

**OLD:** `MOCK_PORTRAIT` = plain text string (6 sentences)
**NEW:** `MOCK_PORTRAIT` = markdown string with 6 `##` sections (condensed version of validated example)

### Proposal 5: Domain Interface Doc ✅ APPROVED

**File:** `packages/domain/src/repositories/portrait-generator.repository.ts`

**OLD:** `@returns Effect with portrait text (6-10 sentences)`
**NEW:** `@returns Effect with portrait as markdown string (6 sections with ## headers)`

No structural or type changes.

---

## Section 5: Implementation Handoff

**Change Scope: Minor** — Direct implementation by development team.

### Implementation Tasks (ordered)

1. **Update Story 8.4 acceptance criteria** in epic-8 doc to reflect new spec
2. **Rewrite `PORTRAIT_SYSTEM_PROMPT`** in `portrait-generator.claude.repository.ts` using `personalized-portrait-spec.md` as source of truth
3. **Update `formatTraitSummary()` and `formatEvidence()`** to include confidence data
4. **Increase `maxTokens`** from 1024 to 2048
5. **Refactor `PersonalPortrait.tsx`** from JSON grid to markdown rendering with `##` splitting
6. **Rewrite `PersonalPortrait.test.tsx`** for markdown format
7. **Update mock** in `__mocks__/portrait-generator.claude.repository.ts`
8. **Update JSDoc** in domain interface
9. **Run full test suite** to verify no regressions

### Key References

- **Spec (source of truth for prompt):** `_bmad-output/implementation-artifacts/personalized-portrait-spec.md`
- **Brainstorming session:** `_bmad-output/brainstorming/brainstorming-session-2026-02-16.md`
- **Current source:** `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts`
- **Frontend component:** `apps/front/src/components/results/PersonalPortrait.tsx`

### Success Criteria

- Portrait output is a flowing markdown document in Nerin's dive-master voice
- Frontend renders markdown with per-section visual treatment (split on ##)
- All existing tests pass (updated for new format)
- No changes to DB schema, API contract, or use-case logic
- Sprint status updated: Story 8.4 transitions `done` → `in-progress` → `done`

### Sprint Status Update

```yaml
# Story 8.4 status change for rework
8-4-pre-generate-personalized-portrait-at-free-tier-message-threshold: in-progress
# (back to in-progress for portrait redesign rework, then done when complete)
```

---

## Approval and Handoff Log

- Approval status: Approved by user (all 5 proposals approved individually in incremental mode)
- Approval date: 2026-02-16
- Scope classification: Minor
- Handoff route: Development team (direct implementation)
- Sprint status updates: Applied (Story 8.4 moved from `done` to `in-progress` for rework)
