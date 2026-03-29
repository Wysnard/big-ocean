# Story 37.4: Relationship Celebration, Beat 8 & CTA Cleanup

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor who has scrolled through the full narrative,
I want to discover that I can do this with someone I care about,
so that I have an additional reason to engage and a way to share big-ocean with people who matter to me.

## Acceptance Criteria

1. **AC1 — Beat 8 relationship celebration:** Given the visitor scrolls past the close (Beat 7 "...okay"), when Beat 8 renders, then Nerin introduces the relationship analysis: "There's one more thing. This starts with you — but it doesn't have to stay with you." And Nerin explains: "If someone matters to you — a partner, a best friend — you can invite them to take their own dive. Then we put your portraits side by side. Where you align. Where you don't. What the space between you actually looks like." And a comparison teaser visual is displayed (two overlaid radar charts, warm not clinical). And Nerin frames it as celebration: "Think of it as a letter to someone that says: you matter to me, and I want to understand us better." And Nerin adds nuance: "It won't just show the good parts. It'll show the friction too — and why it exists. But that's what makes it real." And narrator text: "Relationship analysis · Invite someone you love".

2. **AC2 — Comparison teaser visual:** Given the comparison teaser in Beat 8, when it renders, then it shows two overlaid radar chart polygons (one "You" in primary color, one "Friend" in tertiary/teal), with a minimal legend, and it feels warm not clinical. The visual must NOT contain a CTA button — it is decorative only.

3. **AC3 — Remove embedded CTAs from ResultPreviewEmbed:** Given all existing uses of `ResultPreviewEmbed` on the homepage, when the page renders, then no CTA buttons are visible inside embedded preview cards. The page should feel like reading/experiencing, not like being sold to. The sticky input bar is the sole CTA.

4. **AC4 — Remove ComparisonCard from homepage flow:** Given Beat 1 currently contains a `ComparisonCard` inside a Nerin bubble, when the page restructure is complete, then ComparisonCard is removed from the Beat 1 Nerin bubble and the import is removed from `index.tsx`. The Beat 1 Nerin bubble displays only the text content matching the storytelling session script. The `ComparisonCard` source file is NOT deleted.

5. **AC5 — No HowItWorks, ArchetypeGallery, or Final CTA sections:** Given the current homepage, when the page renders, then no separate HowItWorks section exists (fears are dissolved through narrative), no ArchetypeGalleryPreview section exists, and no "What's YOUR code?" final CTA section exists. The sticky input bar handles all conversion.

6. **AC6 — Data attributes preserved:** Given all existing `data-testid` and `data-slot` attributes, when the page is updated, then none are removed, replaced, or renamed.

7. **AC7 — Relationship analysis framing:** Given the Beat 8 content, when the visitor reads it, then relationship analysis is framed as celebration and curiosity (not a paid feature or upsell). No pricing is mentioned. The tone is warm and inviting.

## Tasks / Subtasks

### Task 1: Remove ComparisonCard from Beat 1 in index.tsx (AC: #4)

**File:** `apps/front/src/routes/index.tsx`

- [x] 1.1: Remove the `ComparisonCard` import (line 4: `import { ComparisonCard } from "../components/home/ComparisonCard";`).
- [x] 1.2: Replace the entire Beat 1 section (currently lines 46-67) with the canonical storytelling session content. The current implementation has three differences from the script: (a) the Nerin bubble contains extra text + ComparisonCard, (b) there's a narrator message not in the script, (c) the second Nerin message and trailing user "..." are missing. Replace with:
  ```tsx
  {/* Beat 1 — The conversation (light curiosity) */}
  <MessageGroup>
    <ChatBubble variant="user">what do you mean?</ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="nerin">
      Everyone runs on a pattern. When people talk freely, those patterns
      show up&nbsp;&mdash;&nbsp;things they&rsquo;d never say about
      themselves. Things they don&rsquo;t even know they&rsquo;re
      revealing.
    </ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="nerin">
      You can live inside a pattern your whole life and never once see
      it.
    </ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="user">&hellip;</ChatBubble>
  </MessageGroup>
  ```
  This matches the storytelling session script exactly: User question → Nerin pattern explanation → Nerin one-liner → User trailing ellipsis.
- [x] 1.3: Do NOT delete `apps/front/src/components/home/ComparisonCard.tsx` — only remove the import from `index.tsx`.

### Task 2: Create RelationshipTeaser component for Beat 8 visual (AC: #2)

**File:** `apps/front/src/components/home/RelationshipTeaser.tsx` (NEW)

This is a new component showing two overlaid radar chart polygons — warm, decorative, no CTA.

- [x] 2.1: Create `RelationshipTeaser` component with the following structure:
  - A rounded container with `border border-[var(--embed-border)] bg-[var(--embed-bg)]` styling (matching existing embed style)
  - An SVG with two overlaid radar chart polygons:
    - "You" polygon using `fill="var(--radar-fill-you)"` + `stroke="var(--primary)"` (primary color)
    - "Friend" polygon using `fill="rgba(0,180,166,0.15)"` + `stroke="var(--tertiary)"` (teal)
  - A minimal legend with colored dots: "You" (primary) and "A Friend" (tertiary)
  - **NO CTA button, NO link** — purely decorative
  - Add `data-slot="relationship-teaser"` on the root element
  - Add `data-testid="relationship-teaser"` on the root element
- [x] 2.2: Reuse the SVG radar chart pattern from the existing `ComparisonTeaserPreview` component (`apps/front/src/components/home/ComparisonTeaserPreview.tsx`) — same grid pentagons, same "You"/"Friend" polygons, same score dots and legend. The difference: no `ResultPreviewEmbed` wrapper (no CTA), standalone card with embed-style border.
- [x] 2.3: Ensure the component respects `prefers-reduced-motion` — the radar itself is static (no animation needed), so this is primarily about ensuring no unexpected transitions.
- [x] 2.4: Export the component as a named export.

### Task 3: Implement Beat 8 in index.tsx (AC: #1, #7)

**File:** `apps/front/src/routes/index.tsx`

- [x] 3.1: Import `RelationshipTeaser` from `"../components/home/RelationshipTeaser"`.
- [x] 3.2: Replace the placeholder comment `{/* Beat 8 — Relationship celebration (Story 8.4) */}` (line 149) with the full Beat 8 content. The content MUST match the storytelling session script (`_bmad-output/story-2026-03-24.md` Beat 8):

  ```tsx
  {/* Beat 8 — Relationship celebration (post-close) */}
  <MessageGroup>
    <ChatBubble variant="nerin">
      There&rsquo;s one more thing. This starts with you&nbsp;&mdash;&nbsp;but it doesn&rsquo;t have to stay with you.
    </ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="nerin">
      <p>
        If someone matters to you&nbsp;&mdash;&nbsp;a partner, a best
        friend&nbsp;&mdash;&nbsp;you can invite them to take their own
        dive. Then we put your portraits side by side.
      </p>
      <p>
        Where you align. Where you don&rsquo;t. What the space between
        you actually looks like.
      </p>
    </ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <RelationshipTeaser />
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="nerin">
      Think of it as a letter to someone that says: you matter to me, and I want to understand us better.
    </ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="nerin">
      It won&rsquo;t just show the good parts. It&rsquo;ll show the friction too&nbsp;&mdash;&nbsp;and why it exists. But that&rsquo;s what makes it real.
    </ChatBubble>
  </MessageGroup>

  <MessageGroup>
    <ChatBubble variant="narrator">
      Relationship analysis &middot; Invite someone you love
    </ChatBubble>
  </MessageGroup>
  ```

- [x] 3.3: Verify that Beat 8 appears AFTER Beat 7's user "...okay" message and BEFORE the `</ConversationFlow>` closing tag.
- [x] 3.4: Do NOT add any CTA buttons, links, or conversion elements inside Beat 8. The sticky input bar is the only CTA.

### Task 4: Remove embedded CTAs from ResultPreviewEmbed usage on homepage (AC: #3, #5)

**File:** `apps/front/src/routes/index.tsx`

- [x] 4.1: Verify that no `ResultPreviewEmbed` components are used on the homepage. The current index.tsx should not import or render `ResultPreviewEmbed`, `OceanCodeEmbed`, `RadarEmbed`, `FacetBarsEmbed`, or `ComparisonTeaserPreview`. If any are found, remove the imports and usage from `index.tsx`.
- [x] 4.2: Verify that `HowItWorks` and `FinalCta` are NOT imported or used in `index.tsx`. They were removed in 37-3 but verify no re-introduction.
- [x] 4.3: Do NOT modify or delete the `ResultPreviewEmbed.tsx`, `HowItWorks.tsx`, `FinalCta.tsx`, `ComparisonTeaserPreview.tsx`, or `RelationshipCta.tsx` source files. Only remove homepage imports/usage.

### Task 5: Verify and validate (AC: #1-7)

- [x] 5.0: **Pre-implementation baseline:** Before any code changes, run `grep -rn 'data-testid' apps/front/src/components/home/ apps/front/src/routes/index.tsx` and save the output as a baseline snapshot for comparison in 5.3.
- [x] 5.1: Run `pnpm turbo typecheck` — must pass with zero errors.
- [x] 5.2: Run `pnpm lint` — must pass.
- [x] 5.3: Compare `data-testid` grep output against the baseline from 5.0 — verify none were removed or renamed. New `data-testid="relationship-teaser"` should be the only addition.
- [x] 5.4: Verify mobile layout (<640px) — Beat 8 content readable, comparison teaser scales, sticky CTA visible.
- [x] 5.5: Verify desktop layout (>=1024px) — Beat 8 content at comfortable reading width, DepthMeter visible.
- [x] 5.6: Verify the comparison teaser visual has NO CTA button or link.
- [x] 5.7: Verify ComparisonCard is no longer visible on the homepage (only text in Beat 1 Nerin bubble).

## Parallelism

- **Blocked by:** 37-3-homepage-narrative-restructure-and-hero-redesign (done)
- **Blocks:** none
- **Mode:** parallel (can run concurrently with non-homepage work)
- **Domain:** frontend homepage
- **Shared files:** `apps/front/src/routes/index.tsx`

## Dev Notes

### Scope Change from Original Sprint Change Proposal

The original sprint change proposal (2026-03-24) scoped 37-4 as "How It Works, Archetype Gallery & Conversion Flow." The epics.md was updated 2026-03-25 after Story 8.3/37-3 was implemented, and the scope was significantly narrowed:

- **Removed:** HowItWorks section (fears dissolved through narrative in 8.3)
- **Removed:** ArchetypeGalleryPreview (may be reconsidered for results page)
- **Removed:** "What's YOUR code?" final CTA section (sticky bar handles conversion)
- **Added:** Beat 8 relationship celebration content
- **Added:** ComparisonCard cleanup from Beat 1

The story key in sprint-status.yaml remains `37-4-how-it-works-archetype-gallery-and-conversion-flow` for consistency, even though the scope changed.

### Content Source of Truth

Beat 8 content comes from `_bmad-output/story-2026-03-24.md` (lines 216-230):

```
[NERIN] There's one more thing. This starts with you — but it doesn't have to stay with you.
[NERIN] If someone matters to you — a partner, a best friend — you can invite them to take their own dive. Then we put your portraits side by side. Where you align. Where you don't. What the space between you actually looks like.
[VISUAL] Comparison teaser — two portraits overlaid, showing how traits map across a relationship. Warm, not clinical.
[NERIN] Think of it as a letter to someone that says: you matter to me, and I want to understand us better.
[NERIN] It won't just show the good parts. It'll show the friction too — and why it exists. But that's what makes it real.
[NARRATOR] Relationship analysis · Invite someone you love
```

### ComparisonCard Cleanup (Beat 1)

The current `index.tsx` has a `ComparisonCard` embedded inside Beat 1's Nerin bubble. This was NOT part of the storytelling session script — it's a leftover from the original 14-beat structure. The card shows a "Traditional vs Conversational" split comparison that contradicts the narrative direction (no test-frame comparisons).

**Action:** Remove the `ComparisonCard` from Beat 1 and replace the Nerin bubble text with the canonical storytelling session script. The current text ("You'd be surprised. Everyone who sits down with me thinks they're the boring one...") is replaced with the shorter, punchier version from the script.

### RelationshipTeaser Component Design

The `RelationshipTeaser` is a simplified version of `ComparisonTeaserPreview` without the `ResultPreviewEmbed` wrapper (which contains a CTA button). Reuse the same SVG radar chart pattern:

- Two overlaid pentagons (You = primary, Friend = tertiary/teal)
- Grid line pentagons for depth
- Score dots on vertices
- Minimal legend

The visual is purely decorative — it shows "what a comparison looks like" without any actionable element. The sticky input bar handles conversion.

### Beat 8 Purpose

Beat 8 is **post-close** — many visitors will have already converted via the sticky input bar before reaching it. It serves three purposes:
1. **Last-chance conversion** for visitors who scrolled the entire page without clicking
2. **Planting the relationship seed** for after their own conversation
3. **Viral/sharing hook** — the idea of comparing with someone you love

Relationship analysis is a paid feature, but this beat plants the seed without mentioning price. The tone is celebration and curiosity, not upsell.

### Key Architecture Patterns (from 37-3)

- **Static content only** — no API calls on the homepage. All content is hardcoded. Preserves LCP <1s.
- **Tailwind utility classes** — mobile-first responsive design. Use `cn()` for class merging.
- **Semantic color tokens** — use CSS variables (`--bubble-bg`, `--bubble-fg`, `--thread-line`, `--embed-border`, `--embed-bg`, `--radar-fill-you`, `--primary`, `--tertiary`, etc.) for theming.
- **`data-slot`** on component roots for structural identification. **`data-testid`** for E2E selectors. Both coexist.
- **`prefers-reduced-motion`** — all animations must use instant-cut fallback via Tailwind's `motion-reduce:` variant.
- **44px minimum tap targets** — all interactive elements on mobile.

### Previous Story Learnings (37-3)

- Story 37-3 delivered the full 7-beat narrative, hero redesign, narrator variant, lighter user variant, CSS-only sticky bar, and OG meta updates.
- Infrastructure is fully in place: ConversationFlow, ChatBubble (4 variants), MessageGroup, DepthMeter, ChatInputBar, DepthScrollProvider.
- All 735 tests pass with zero regressions after 37-3.
- `data-testid` baseline was preserved.
- ComparisonCard was NOT removed in 37-3 despite being listed in AC6 — it remained embedded in Beat 1. This story fixes that.

### Git Intelligence

- `0d67d5c2` — Story 37-3 implementation (most recent commit). Touched: ChatBubble.tsx, HeroSection.tsx, ChatInputBar.tsx, portrait-excerpt.md, index.tsx
- The ComparisonCard import/usage in index.tsx survived the 37-3 implementation, confirming it needs explicit cleanup in this story.

### Project Structure Notes

- All homepage components in `apps/front/src/components/home/` — consistent with existing structure
- New `RelationshipTeaser.tsx` follows the same pattern as existing embed components
- No new packages or workspace dependencies needed
- Route file: `apps/front/src/routes/index.tsx` — standard TanStack Router file route

### References

- [Source: `_bmad-output/story-2026-03-24.md` § Beat 8] — Narrative source of truth (relationship celebration)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 8.4] — Updated acceptance criteria and scope
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-03-24.md`] — Original scope (superseded by updated epics.md)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §16.6-16.12] — UX spec for homepage redesign
- [Source: `apps/front/src/routes/index.tsx`] — Current homepage implementation (7-beat + placeholder)
- [Source: `apps/front/src/components/home/ComparisonTeaserPreview.tsx`] — SVG radar chart pattern to reuse
- [Source: `apps/front/src/components/home/ResultPreviewEmbed.tsx`] — CTA wrapper to avoid
- [Source: `docs/FRONTEND.md`] — Styling patterns, data attribute conventions

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **CTA proliferation** — Do NOT add any CTA buttons, links, or conversion elements inside Beat 8 or the comparison teaser. The sticky input bar is the ONLY CTA on the entire page.
6. **Deleting component files** — Do NOT delete ComparisonCard.tsx, ComparisonTeaserPreview.tsx, ResultPreviewEmbed.tsx, HowItWorks.tsx, FinalCta.tsx, or RelationshipCta.tsx source files. Only remove imports from index.tsx.
7. **Removing data attributes** — Never remove, rename, or replace existing `data-testid` or `data-slot` attributes.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation, no blockers encountered.

### Completion Notes List

- **Task 1:** Removed `ComparisonCard` import and usage from `index.tsx`. Replaced Beat 1 content with canonical storytelling session script: two separate Nerin messages (pattern explanation + one-liner) and trailing user ellipsis. Removed the non-script narrator message ("Nerin hears the nuance...").
- **Task 2:** Created `RelationshipTeaser` component — decorative radar chart with two overlaid polygons (You/Friend), reusing SVG pattern from `ComparisonTeaserPreview`. No CTA, no links. Added `data-testid="relationship-teaser"` and `data-slot="relationship-teaser"`.
- **Task 3:** Implemented full Beat 8 relationship celebration: 5 Nerin messages, 1 narrator message, and RelationshipTeaser visual. Matches storytelling session script exactly. No CTA elements — sticky input bar is sole conversion mechanism.
- **Task 4:** Verified no `ResultPreviewEmbed`, `HowItWorks`, `FinalCta`, `ComparisonTeaserPreview` imports in `index.tsx`. All clean.
- **Task 5:** Typecheck passes (zero errors), lint passes (7 pre-existing warnings only), all 735 tests pass (408 front + 327 api), data-testid baseline preserved (only addition: `relationship-teaser`).

### Change Log

- 2026-03-25: Implemented Beat 8 relationship celebration, ComparisonCard cleanup, CTA cleanup (Story 37-4)

### File List

- `apps/front/src/routes/index.tsx` — Removed ComparisonCard import/usage, replaced Beat 1 content, added Beat 8 relationship celebration with RelationshipTeaser
- `apps/front/src/components/home/RelationshipTeaser.tsx` — NEW: Decorative radar chart component for Beat 8 comparison teaser
