# Story 1.4: Retired Homepage Component Cleanup

Status: done

## Story

As a developer,
I want deprecated homepage components removed,
So that the homepage is ready for the new split-layout redesign (Epic 9).

## Acceptance Criteria

1. These 6 components are deleted from `apps/front/src/components/home/`:
   - `ConversationFlow.tsx`
   - `ComparisonCard.tsx`
   - `TraitStackEmbed.tsx`
   - `ComparisonTeaserPreview.tsx`
   - `ScrollIndicator.tsx`
   - `FounderPortraitExcerpt.tsx`
2. All imports of deleted components are removed from `apps/front/src/routes/index.tsx`
3. The homepage still renders — a simplified placeholder replaces the deleted conversation section
4. `pnpm build` succeeds
5. `pnpm typecheck` passes

## Tasks / Subtasks

- [x] Task 1: Delete the 6 component files (AC: #1)
  - [x] Delete `apps/front/src/components/home/ConversationFlow.tsx`
  - [x] Delete `apps/front/src/components/home/ComparisonCard.tsx`
  - [x] Delete `apps/front/src/components/home/TraitStackEmbed.tsx`
  - [x] Delete `apps/front/src/components/home/ComparisonTeaserPreview.tsx`
  - [x] Delete `apps/front/src/components/home/ScrollIndicator.tsx`
  - [x] Delete `apps/front/src/components/home/FounderPortraitExcerpt.tsx`
- [x] Task 2: Update homepage route — remove imports and restructure JSX (AC: #2, #3)
  - [x] Remove all 6 import lines from `apps/front/src/routes/index.tsx`
  - [x] Remove the conversation section (lines 51-243) that depends on `ConversationFlow`
  - [x] Replace with a placeholder section so the homepage still renders
  - [x] Keep: HeroSection, HowItWorks, FinalCta, DepthMeter, ChatInputBar, DepthScrollProvider — these are NOT being deleted
- [x] Task 3: Verify build (AC: #4, #5)
  - [x] Run `pnpm build`
  - [x] Run `pnpm typecheck`
  - [x] Run `pnpm lint`

## Dev Notes

### Component Dependency Map

Each component is imported ONLY in `apps/front/src/routes/index.tsx`. No other files in the codebase reference them:

| Component | Route line (import) | Route line (usage) | Notes |
|-----------|--------------------|--------------------|-------|
| `ConversationFlow` | 6 | 57, 242 | Layout wrapper — wraps ALL conversation beats |
| `ComparisonCard` | 4 | 105 | Inside Beat 4 |
| `TraitStackEmbed` | 16 | 127 | Inside Beat 6 |
| `ComparisonTeaserPreview` | 5 | 215 | Inside Beat 12 |
| `ScrollIndicator` | — | — | ORPHAN — not imported anywhere in codebase, dead code |
| `FounderPortraitExcerpt` | 10 | 177 | Inside Beat 10b |

### DO NOT Delete These

- **`ResultPreviewEmbed.tsx`** — used by `ComparisonTeaserPreview.tsx` (being deleted) AND `ShareCardPreview.tsx` (staying). Must keep.
- **`portrait-excerpt.md`** — used by `FounderPortraitExcerpt.tsx` (being deleted) AND `HoroscopeVsPortraitComparison.tsx` (staying). Must keep.
- **`HoroscopeVsPortraitComparison.tsx`** — NOT on deletion list, used at line 147 in Beat 8. Stays.
- **`RelationshipCta.tsx`** — NOT on deletion list, used at line 222 in Beat 12. Stays.

### Impact on Homepage Route Structure

The current homepage (`apps/front/src/routes/index.tsx`) is a 14-beat conversational narrative:

```
<PageMain>
  <DepthScrollProvider>
    <HeroSection />                          ← KEEP
    <section> (conversation preview)
      <ConversationFlow>                     ← DELETE wrapper
        Beat 1-3: ChatBubble text only       ← removed (inside ConversationFlow)
        Beat 4: ComparisonCard               ← DELETE
        Beat 5-6: TraitStackEmbed            ← DELETE
        Beat 7-8: HoroscopeVsPortraitComparison ← removed (inside ConversationFlow)
        Beat 9-10: ChatBubble text only      ← removed (inside ConversationFlow)
        Beat 10b: FounderPortraitExcerpt     ← DELETE
        Beat 11: ChatBubble text only        ← removed (inside ConversationFlow)
        Beat 12: ComparisonTeaserPreview     ← DELETE
        Beat 13-14: ChatBubble text only     ← removed (inside ConversationFlow)
      </ConversationFlow>                    ← DELETE wrapper
    </section>
    <HowItWorks />                           ← KEEP
    <FinalCta />                             ← KEEP
    <DepthMeter />                           ← KEEP
    <ChatInputBar />                         ← KEEP
  </DepthScrollProvider>
</PageMain>
```

Since `ConversationFlow` wraps ALL 14 beats, deleting it removes the entire conversation section. The beats that reference non-deleted components (HoroscopeVsPortraitComparison, RelationshipCta, MessageGroup, ChatBubble) will also be removed from the page — they are NOT deleted as files, just no longer rendered on the homepage.

**After cleanup, the homepage renders:** HeroSection → (placeholder or empty space) → HowItWorks → FinalCta + DepthMeter + ChatInputBar.

### Placeholder Approach

Replace the deleted conversation `<section>` with a minimal placeholder:

```tsx
{/* Conversation section removed — Epic 9 will implement split-layout redesign */}
```

A comment-only replacement is sufficient — HeroSection flows directly into HowItWorks. No visible placeholder UI is needed since the existing hero + HowItWorks + FinalCta already form a coherent page.

### Unused Imports to Remove

After deleting the conversation section, these imports also become unused and must be removed:

| Import | Reason |
|--------|--------|
| `ComparisonCard` | Deleted component |
| `ComparisonTeaserPreview` | Deleted component |
| `ConversationFlow` | Deleted component |
| `FounderPortraitExcerpt` | Deleted component |
| `TraitStackEmbed` | Deleted component |
| `ChatBubble` | Only used inside deleted conversation section |
| `MessageGroup` | Only used inside deleted conversation section |
| `HoroscopeVsPortraitComparison` | Only used inside deleted conversation section |
| `RelationshipCta` | Only used inside deleted conversation section |

**Keep these imports** (still used):
- `createFileRoute` (TanStack Router)
- `ChatInputBar` (rendered independently at line 253)
- `DepthMeter` (rendered independently at line 252)
- `DepthScrollProvider` (wraps remaining components)
- `FinalCta` (rendered at line 249)
- `HeroSection` (rendered at line 49)
- `HowItWorks` (rendered at line 246)
- `PageMain` (top-level wrapper)

### Testing

- No unit tests exist for any of the 6 deleted components
- No e2e tests reference any of these components
- `FounderPortraitExcerpt.tsx` has `data-testid="founder-portrait-excerpt"` but no e2e test uses it — safe to delete
- Run `pnpm test:run` to confirm no breakage (optional — no tests exist, but catches transitive failures)

### Project Structure Notes

- All 6 files live in `apps/front/src/components/home/` — this is the correct location for page-specific components per CLAUDE.md
- After deletion, 13 files remain in `apps/front/src/components/home/` — no barrel export or index file to update
- No `packages/ui` components are affected — these are all app-specific components
- No kitchen sink demos to update — none of these components are in `packages/ui`

### References

- [Source: _bmad-output/planning-artifacts/epics.md, Story 1.4, lines 489-509]
- [Source: apps/front/src/routes/index.tsx — full homepage route]
- [Source: docs/FRONTEND.md — data-testid conventions]
- [Source: Epic 9 in epics.md, lines 1013-1086 — future homepage redesign context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no errors.

### Completion Notes List

- Deleted 6 deprecated homepage components: ConversationFlow, ComparisonCard, TraitStackEmbed, ComparisonTeaserPreview, ScrollIndicator, FounderPortraitExcerpt
- Verified no other files in the codebase import these components before deletion (only `routes/index.tsx`)
- Removed 9 unused imports from homepage route (5 deleted components + ChatBubble, MessageGroup, HoroscopeVsPortraitComparison, RelationshipCta which were only used inside the deleted conversation section)
- Replaced the entire 14-beat conversation `<section>` with a JSX comment placeholder per story spec
- Kept all non-deleted components rendering: HeroSection, HowItWorks, FinalCta, DepthMeter, ChatInputBar, DepthScrollProvider, PageMain
- All ACs satisfied: `pnpm build` passes, `pnpm typecheck` passes, `pnpm lint` passes (no new warnings)

### Review Findings

- [x] [Review][Defer] 4 orphaned component files now dead code (ChatBubble, MessageGroup, HoroscopeVsPortraitComparison, RelationshipCta) — deferred, intentionally preserved per spec DO-NOT-DELETE list for Epic 9 redesign

### Change Log

- 2026-04-12: Story 1.4 implemented — deleted 6 retired homepage components and cleaned up homepage route

### File List

**Deleted:**
- apps/front/src/components/home/ConversationFlow.tsx
- apps/front/src/components/home/ComparisonCard.tsx
- apps/front/src/components/home/TraitStackEmbed.tsx
- apps/front/src/components/home/ComparisonTeaserPreview.tsx
- apps/front/src/components/home/ScrollIndicator.tsx
- apps/front/src/components/home/FounderPortraitExcerpt.tsx

**Modified:**
- apps/front/src/routes/index.tsx
