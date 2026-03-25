# Story 37.3: Homepage Narrative Restructure & Hero Redesign

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a new visitor,
I want to experience a compelling conversational introduction to big-ocean that makes me feel seen and curious,
so that I start my own conversation with Nerin.

## Acceptance Criteria

1. **AC1 — Hero + 7-beat narrative:** Given a visitor navigates to the homepage, when the page renders, then a Hero + 7-beat conversational narrative scroll is displayed using the three-voice system (Nerin, User, Narrator), and the page is server-rendered via TanStack Start. Beat 8 (relationship) is out of scope (Story 8.4) — a placeholder comment marks its position.

2. **AC2 — Hero redesign:** Given the hero section, when it renders, then the brand mark (big-ocean + OCEAN hieroglyph shapes) is displayed in narrator space, and a Nerin chat bubble displays "What if the most interesting person in the room is you?", and narrator text below reads "A personality portrait through conversation · ~25 min · Free", and a scroll cue "↓ Dive deeper" is displayed in narrator space, and the ScrollIndicator (bouncing chevron) is removed, and the "See how it works" secondary CTA is removed, and no CTA button exists in the hero — the sticky input bar is the only CTA.

3. **AC3 — Sticky chat input bar:** Given the sticky chat input bar, when the visitor scrolls past the hero section, then a sticky overlay bar appears at the bottom styled as a chat input field with "Start the conversation →" button inside, and subtle muted text underneath reads "25 min · Free · Private", and it stays visible throughout the entire page, and it disappears when scrolling back to the hero (CSS-only using `position: sticky` or scroll-driven techniques — no JavaScript visibility toggle), and it meets 44px minimum tap target, and it links to `/chat`, and the page has sufficient bottom padding to prevent the bar from obscuring the last beat's content.

4. **AC4 — Three-voice system:** Given the conversational narrative, when beats render, then Nerin messages use full chat bubbles (left-aligned, solid background), User messages use lighter/smaller chat bubbles (right-aligned, lighter background, smaller text, less padding), Narrator messages use no bubble with muted typography (`text-sm font-mono tracking-wide text-muted-foreground`, normal case — no uppercase — WCAG AA 4.5:1 contrast minimum, `role="note"` for screen readers), and Vincent's message uses the existing `vincent` variant (amber gradient bubble).

5. **AC5 — Beat structure:** Given the narrative, when the user scrolls through beats, then beats follow the structure defined in the narrative source of truth (`_bmad-output/story-2026-03-24.md`): Beat 1 (conversation/patterns), Beat 2 (portrait drops with excerpt card), Beat 3 (Vincent interrupts — distinct visual, quote card), Beat 4 (pivot), Beat 5 (permission + privacy), Beat 6 (science), Beat 7 (close). Portrait excerpt appears at Beat 2 (~25% scroll depth).

6. **AC6 — Removed components:** Given the compressed narrative, when compared to the previous 14-beat structure, then ComparisonCard, HoroscopeVsPortraitComparison are removed from the homepage flow, and the HowItWorks section is removed, and the FinalCta section is removed, and the component source files are NOT deleted (follow-up cleanup ticket required — see Dev Notes), and existing ConversationFlow, ChatBubble, MessageGroup infrastructure is preserved and extended for the three-voice system, and TraitStackEmbed/TraitFacetPair/useTraitSelection are preserved and relocated to Beat 6 (science).

7. **AC7 — DepthMeter:** Given the DepthMeter, when the page is restructured, then the continuous scroll percentage model (0–1) continues to work with the shorter page, and it remains hidden on mobile (below 900px viewport).

8. **AC8 — OG meta tags:** Given the page is shared, when OG meta renders, then og:title is "big ocean — What if the most interesting person in the room is you?" and og:description is "A 25-minute conversation. A portrait of who you are. Free."

9. **AC9 — Data attributes preserved:** Given all existing `data-testid` and `data-slot` attributes, when the page is restructured, then none are removed, replaced, or renamed.

## Tasks / Subtasks

### Task 1: Add Narrator variant to ChatBubble (AC: #4)

**File:** `apps/front/src/components/home/ChatBubble.tsx`

- [x]1.1: Add `"narrator"` to the variant union type: `variant: "nerin" | "user" | "vincent" | "narrator"`
- [x]1.2: Implement narrator rendering — no bubble, no avatar. Use muted typography: `text-sm font-mono tracking-wide text-muted-foreground` (normal case — NOT uppercase). Left-aligned without avatar column offset. Must meet WCAG AA contrast ratio (4.5:1 minimum). Add `role="note"` for screen reader accessibility. Apply `data-slot="narrator-message"`.
- [x]1.3: Update user variant to be lighter/smaller — reduce font size (e.g., `text-sm` instead of default), reduce padding (e.g., `px-4 py-2` instead of `px-[22px] py-4`), use a lighter/more transparent background. The user bubble should feel like reactive fragments, not full messages.
- [x]1.4: Preserve all existing `data-testid` and `data-slot` attributes on nerin, user, and vincent variants.

### Task 2: Redesign HeroSection (AC: #2)

**File:** `apps/front/src/components/home/HeroSection.tsx`

- [x]2.1: Replace the primary headline with a Nerin chat bubble: "What if the most interesting person in the room is you?" — use the ChatBubble `variant="nerin"` component or style it to match Nerin's visual treatment. This is the first bubble of the conversation.
- [x]2.2: Replace the subtitle/description with narrator text: "A personality portrait through conversation · ~25 min · Free" — use muted, interface-level typography matching the narrator voice.
- [x]2.3: Replace the scroll cue (current "Scroll to descend" + chevron) with "↓ Dive deeper" in narrator space. Keep the gentle bounce animation on the arrow.
- [x]2.4: Remove the "See how it works ↓" secondary CTA button entirely.
- [x]2.5: Remove the "Start your conversation with Nerin →" primary CTA button from the hero. The sticky input bar (Task 3) is now the only CTA on the entire page.
- [x]2.6: Keep the OCEAN breathing shapes animation (right column on desktop). Keep the brand mark ("big-ocean" + OceanHieroglyphSet).
- [x]2.7: Preserve all existing `data-testid` and `data-slot` attributes. Do not remove `data-testid="hero-section"` or any other existing test IDs.

### Task 3: Update ChatInputBar for hero-aware visibility (AC: #3)

**File:** `apps/front/src/components/home/ChatInputBar.tsx`

- [x]3.1: Change the visibility trigger from `scrollPercent > 0.35` to a CSS-only approach. Use `position: sticky` with a sentinel element or CSS scroll-driven animations to show/hide the bar when the hero section leaves/enters the viewport. No JavaScript visibility toggle — the bar's show/hide must work without JS for SEO. Fallback: the bar is always visible (progressive enhancement).
- [x]3.2: Update the CTA button text to "Start the conversation →" (currently "Start Conversation →" — add "the").
- [x]3.3: Add subtle muted text below the input area: "25 min · Free · Private" — use `text-xs text-muted-foreground` styling.
- [x]3.4: Ensure the bar meets 44px minimum tap target on the button.
- [x]3.5: Ensure the bar links to `/chat`.
- [x]3.6: Add sufficient `padding-bottom` (or `margin-bottom`) to the page/last beat to prevent the sticky bar from obscuring Beat 7 content. Padding should equal the bar's rendered height plus spacing.

### Task 4: Restructure index.tsx — replace 14-beat narrative with 7-beat three-voice conversation (AC: #1, #5, #6)

**File:** `apps/front/src/routes/index.tsx`

This is the core restructuring task. Replace the entire ConversationFlow content with the new 7-beat narrative from the storytelling session (`_bmad-output/story-2026-03-24.md`).

- [x]4.1: Remove imports for components no longer used in the homepage flow: `ComparisonCard`, `HoroscopeVsPortraitComparison`, `HowItWorks`, `FinalCta`, `RelationshipCta`, `ComparisonTeaserPreview`. **Do NOT delete the component source files** — only remove the imports from `index.tsx`. **Keep** `TraitStackEmbed`, `TraitFacetPair`, and `useTraitSelection` — they relocate to Beat 6.
- [x]4.2: Keep the `useTraitSelection()` hook call in `HomePage` — it drives the TraitStackEmbed interaction in Beat 6.
- [x]4.3: Remove `<HowItWorks />` and `<FinalCta />` from the JSX (after ConversationFlow).
- [x]4.4: Implement **Beat 1 — The conversation** (light curiosity):
    ```
    [USER] ...what do you mean?
    [NERIN] Everyone runs on a pattern. When people talk freely, those patterns show up — things they'd never say about themselves. Things they don't even know they're revealing.
    [NERIN] You can live inside a pattern your whole life and never once see it.
    [USER] ...
    ```
    Use `ChatBubble variant="user"` for user lines, `ChatBubble variant="nerin"` for Nerin lines. The user "..." is a separate user bubble with just an ellipsis.
- [x]4.5: Implement **Beat 2 — The portrait drops** (awe):
    ```
    [NARRATOR] After one conversation, this is what Nerin wrote about the person who built big-ocean.
    [VISUAL] Portrait excerpt card — reuse existing FounderPortraitExcerpt component but update its content to match the new portrait text from the storytelling session
    [USER] ...an AI wrote that?
    ```
    Use `ChatBubble variant="narrator"` for narrator. The portrait excerpt card should contain the full "The Solving Reflex" excerpt from the storytelling session (see content below in Dev Notes). The `FounderPortraitExcerpt` component already exists — update its content to match the new narrative.
- [x]4.6: Implement **Beat 3 — Vincent interrupts** (distinct visual treatment):
    ```
    [VINCENT] (quote card, distinct from chat bubbles)
    "That portrait is mine. To me, that moment was eye-opening.
    I used to draw my sword everywhere — every problem, every situation. I was proud of it. Nerin showed me it was double-edged. That I was using it recklessly, even on myself. Since then I try to use it where it's meant for, and with care everywhere else. I even reach for other skills now — things I would have solved my way through before without thinking.
    That's why I built big-ocean. I needed this. And I know someone else will too."
    [USER] ...
    ```
    Use `ChatBubble variant="vincent"` — the existing amber gradient bubble is visually distinct enough from Nerin/User to signal "founder moment." No refactoring needed.
- [x]4.7: Implement **Beat 4 — The pivot** (dangerous curiosity):
    ```
    [NERIN] I don't know yet. Your pattern isn't the same as his. It might not even be in the same territory.
    [NERIN] The only way I find it is by talking to you.
    [USER] what if I don't like what you find?
    ```
- [x]4.8: Implement **Beat 5 — Permission** (relief):
    ```
    [NERIN] I'm not a judge. I'm more like a mirror with better lighting.
    [NERIN] I don't label people. I tell you what I see — the pattern, the texture, the contradictions. What you do with it is yours.
    [NARRATOR] Your portrait is private by default. No one sees it unless you choose to share. You own what comes out of this conversation.
    ```
- [x]4.9: Implement **Beat 6 — The science** (credibility):
    ```
    [NARRATOR] Built on the Big Five (OCEAN) — the personality model used by psychologists and researchers. Five traits, thirty facets.
    [VISUAL] TraitStackEmbed — interactive 5-trait stack with facet expansion via TraitFacetPair
    [NERIN] The science gives us the map. The conversation gives us you.
    ```
    Reuse the existing `TraitStackEmbed` component (inside a Nerin bubble) with `TraitFacetPair` expansion below. Pass `activeTrait` and `onTraitSelect` from `useTraitSelection()`. When a user clicks a trait, the `TraitFacetPair` renders below as a Nerin response showing the 6 facets. This is the data layer glimpse — interactive, already built, already styled.
- [x]4.10: Implement **Beat 7 — The close** (wanting → action):
    ```
    [NERIN] About twenty-five minutes. No right answers. No wrong ones either. Just talking — about things you probably think about anyway.
    [NERIN] You just don't usually say them out loud.
    [USER] ...okay
    ```
- [x]4.11: Leave a placeholder comment after Beat 7 for Beat 8 (Story 8.4 — relationship celebration): `{/* Beat 8 — Relationship celebration (Story 8.4) */}`

### Task 5: Update FounderPortraitExcerpt content (AC: #5)

**File:** `apps/front/src/components/home/FounderPortraitExcerpt.tsx`

- [x]5.1: Update the portrait excerpt content to match the storytelling session output. The new content is the "The Solving Reflex" section:
    - Section header: "🧭 The Solving Reflex — *what happens when the fixer runs out of things to fix*"
    - Two raw conversation quotes from Vincent
    - Nerin's pattern observation connecting the solving reflex outward and inward
    - Closing: "I don't think you've ever seen these two things as the same thing before. They are."
    - See full text in `_bmad-output/story-2026-03-24.md` Beat 2 section
- [x]5.2: Ensure the component renders as a visually distinct card (not a chat bubble) — it should signal "this is a real portrait artifact." The existing component may already do this; verify and adjust if needed.
- [x]5.3: Preserve existing `data-testid="founder-portrait-excerpt"` and `data-slot="founder-portrait-excerpt"`.

### Task 6: Recalibrate DepthMeter (AC: #7)

**File:** `apps/front/src/components/home/DepthMeter.tsx`

- [x]6.1: The DepthMeter uses continuous scroll percentage (0–1) — no beat-count tracking. Verify it renders correctly with the shorter page. The visibility threshold (`scrollPercent > 0.05`) should still work.
- [x]6.2: Ensure the meter remains hidden on mobile (below 900px viewport).

### Task 7: Update OG meta tags (AC: #8)

**File:** `apps/front/src/routes/index.tsx`

- [x]7.1: Update `og:title` to: `"big ocean — What if the most interesting person in the room is you?"`
- [x]7.2: Update `og:description` to: `"A 25-minute conversation. A portrait of who you are. Free."`
- [x]7.3: Update `<title>` to: `"big ocean — What if the most interesting person in the room is you?"`
- [x]7.4: Update `<meta name="description">` to: `"A 25-minute conversation. A portrait of who you are. Free."`

### Task 8: Verify and validate (AC: #1-9)

- [x]8.0: **Pre-implementation baseline:** Before any code changes, run `grep -rn 'data-testid' apps/front/src/components/home/ apps/front/src/routes/index.tsx` and save the output as a baseline snapshot for comparison in 8.3.
- [x]8.1: Run `pnpm turbo typecheck` — must pass with zero errors.
- [x]8.2: Run `pnpm lint` — must pass.
- [x]8.3: Compare `data-testid` grep output against the baseline from 8.0 — verify none were removed or renamed.
- [x]8.4: Verify mobile layout (<640px) — single column, sticky CTA visible after hero scroll, narrator text readable at `text-sm`.
- [x]8.5: Verify desktop layout (>=1024px) — DepthMeter visible, proper max-width, OCEAN shapes visible.
- [x]8.6: Verify all animations respect `prefers-reduced-motion`.
- [x]8.7: Verify the sticky input bar appears/disappears correctly via CSS-only mechanism.
- [x]8.8: Verify narrator text meets WCAG AA contrast ratio (4.5:1 minimum) in both light and dark themes.

## Parallelism

- **Blocked by:** none (37-1 and 37-2 are done)
- **Blocks:** 37-4-how-it-works-archetype-gallery-and-conversion-flow (Beat 8 relationship content depends on the new beat structure being in place)
- **Mode:** parallel (can run concurrently with non-homepage work)
- **Domain:** frontend homepage
- **Shared files:** `apps/front/src/routes/index.tsx` (37-4 will also modify this to add Beat 8)

## Dev Notes

### Content Source of Truth

The **narrative source of truth** is `_bmad-output/story-2026-03-24.md`. This file contains the full beat-by-beat script with voice tags (`[NERIN]`, `[USER]`, `[NARRATOR]`, `[VINCENT]`, `[VISUAL]`). All narrative content in the story must match this document.

### Three-Voice Visual System

| Voice | Visual treatment | Role |
|-------|-----------------|------|
| **Nerin** | Full chat bubble, left-aligned, solid background, full-size text | Leads the page. Her real voice from the character bible. |
| **User** | Chat bubble, right-aligned, lighter background, **smaller text**, less padding | Reactive fragments: "...what do you mean?", "...an AI wrote that?", "...okay" |
| **Narrator** | No bubble. `text-sm font-mono tracking-wide text-muted-foreground`, normal case, WCAG AA contrast, `role="note"`. Interface-like. | Context, framing, logistics. Anything that would sound fabricated in either voice. |
| **Vincent** | Existing `vincent` variant — amber gradient bubble. | Founder moment. One beat only. Personal, not a product pitch. |

### Portrait Excerpt Content (Beat 2)

The full portrait excerpt for the `FounderPortraitExcerpt` component (from storytelling session):

```
## 🧭 The Solving Reflex — what happens when the fixer runs out of things to fix

You were telling me about climbing and something clicked.

"I do climbing with friends, colleagues... I like it because there's like, problem-solving in it? That's kind of why I ended up in engineering too honestly."

Climbing. Engineering. The side projects. The way you show up when something breaks around you. I kept seeing the same reflex everywhere — this pull toward what's broken, what's stuck, what could be better. It's not just something you're good at. It's how you move through the world. And when it's pointed outward, people trust you for it. You're the person who's already three steps into the solution while everyone else is still naming the problem.

But then you said something else, later, quieter:

"When I do a mistake I end up thinking about it for days, even weeks depending on how bad it was... I just can't stop. Like I can't forgive myself."

That's the same reflex. Pointed inward. When there's nothing left to fix around you, it goes looking — and what it finds is you. Your instinct is to locate the weak point, and when the lens turns on yourself, the weak point is always your own vulnerability. Same gift, same cost.

I don't think you've ever seen these two things as the same thing before. They are.
```

### Vincent Quote Card Content (Beat 3)

```
That portrait is mine. To me, that moment was eye-opening.

I used to draw my sword everywhere — every problem, every situation. I was proud of it. Nerin showed me it was double-edged. That I was using it recklessly, even on myself. Since then I try to use it where it's meant for, and with care everywhere else. I even reach for other skills now — things I would have solved my way through before without thinking.

That's why I built big-ocean. I needed this. And I know someone else will too.
```

### Components Removed from Homepage Flow (NOT Deleted)

These components are removed from `index.tsx` imports and JSX but their source files are preserved for future reuse (e.g., results page):

| Component | File | Reason for removal |
|-----------|------|--------------------|
| `ComparisonCard` | `apps/front/src/components/home/ComparisonCard.tsx` | Traditional vs conversational comparison no longer needed — portrait excerpt IS the proof |
| `HoroscopeVsPortraitComparison` | `apps/front/src/components/home/HoroscopeVsPortraitComparison.tsx` | Horoscope vs portrait comparison removed — direct portrait excerpt replaces it |
| `HowItWorks` | `apps/front/src/components/home/HowItWorks.tsx` | No separate section needed — fears dissolved through narrative |
| `FinalCta` | `apps/front/src/components/home/FinalCta.tsx` | Sticky bar handles conversion — no separate final CTA |
| `RelationshipCta` | `apps/front/src/components/home/RelationshipCta.tsx` | Moves to Beat 8 (Story 8.4) |
| `ComparisonTeaserPreview` | `apps/front/src/components/home/ComparisonTeaserPreview.tsx` | Moves to Beat 8 (Story 8.4) |

**Follow-up required:** Create a cleanup ticket after Story 37-4 ships to audit and delete any homepage components that were not reused (ComparisonCard, HoroscopeVsPortraitComparison, HowItWorks, FinalCta). Do not let these become permanent orphans.

### Existing Component Infrastructure (Preserved & Extended)

- `ConversationFlow` — container with thread line, max-width, padding. No changes needed.
- `ChatBubble` — extended with narrator variant and lighter user variant. Existing nerin/vincent variants preserved.
- `MessageGroup` — IntersectionObserver fade-in wrapper. No changes needed.
- `TraitStackEmbed` + `TraitFacetPair` + `useTraitSelection` — relocated from old position to Beat 6. No component changes needed — only import/JSX position changes in `index.tsx`.
- `DepthMeter` — continuous scroll meter. Verify it works with shorter page.
- `ChatInputBar` — sticky CTA. Updated to CSS-only visibility and updated text.
- `DepthScrollProvider` — scroll context. No changes needed.
- `FounderPortraitExcerpt` — portrait card. Content updated to match storytelling session.

### Key Architecture Patterns

- **Static content only** — no API calls on the homepage. All content is hardcoded. Preserves LCP <1s.
- **Tailwind utility classes** — mobile-first responsive design. Use `cn()` for class merging.
- **Semantic color tokens** — use CSS variables (`--bubble-bg`, `--bubble-fg`, `--thread-line`, etc.) for theming.
- **`data-slot`** on component roots for structural identification. **`data-testid`** for E2E selectors. Both coexist.
- **`prefers-reduced-motion`** — all animations must use instant-cut fallback via Tailwind's `motion-reduce:` variant.
- **44px minimum tap targets** — all interactive elements on mobile.

### Previous Story Learnings (37-1, 37-2)

- Story 37-1 established the 14-beat structure, HeroSection with OCEAN shapes, ConversationFlow container, DepthMeter, ChatInputBar. All infrastructure is in place.
- Story 37-2 added FounderPortraitExcerpt and RelationshipCta components. FounderPortraitExcerpt will be reused with updated content. RelationshipCta moves to Story 8.4.
- Both stories confirmed: static content approach works well for LCP, IntersectionObserver animations perform smoothly, thread line visual connects beats.

### Git Intelligence

Recent commits show:
- `0547e203` — homepage redesign correct course + sprint planning from brainstorming session (this is what triggered stories 37-3 and 37-4)
- `4d39b049` — frontend hooks migrated to Effect HttpApiClient (no impact on homepage, which is static)
- Testing infrastructure (e2e, integration) is mature — no homepage e2e tests exist yet

### Project Structure Notes

- Alignment with hexagonal architecture: homepage is pure frontend, no domain/infrastructure concerns
- All components in `apps/front/src/components/home/` — consistent with existing structure
- No new packages or workspace dependencies needed
- Route file: `apps/front/src/routes/index.tsx` — standard TanStack Router file route

### References

- [Source: `_bmad-output/story-2026-03-24.md`] — Narrative source of truth (full beat-by-beat script)
- [Source: `_bmad-output/planning-artifacts/epics.md` § Epic 8, Story 8.3] — Acceptance criteria and implementation notes
- [Source: `docs/FRONTEND.md`] — Styling patterns, data attribute conventions
- [Source: `apps/front/src/routes/index.tsx`] — Current homepage implementation (14-beat structure to be replaced)
- [Source: `apps/front/src/components/home/ChatBubble.tsx`] — Current bubble variants (nerin, user, vincent)
- [Source: `apps/front/src/components/home/HeroSection.tsx`] — Current hero layout
- [Source: `apps/front/src/components/home/ChatInputBar.tsx`] — Sticky CTA bar
- [Source: `packages/domain/src/constants/nerin-persona.ts`] — Nerin's character bible (voice reference)

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **JavaScript for layout control** — The sticky bar visibility must be CSS-only. Do not introduce IntersectionObserver, scroll event listeners, or React state for show/hide behavior that can be achieved with CSS.
2. **Accessibility regression** — Do not use `text-xs`, `uppercase`, or `tracking-widest` on any text that carries substantive content (narrator messages carry trust/privacy/science content). All text must meet WCAG AA contrast.
3. **Removing data attributes** — Never remove, rename, or replace `data-testid` or `data-slot` attributes. They coexist and serve different purposes (E2E testing vs. structural identification).
4. **Deleting component files** — Components removed from the homepage flow must NOT have their source files deleted. Only remove imports from `index.tsx`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation, no blockers encountered.

### Completion Notes List

- **Task 1:** Added `narrator` variant to ChatBubble (`text-sm font-mono tracking-wide text-muted-foreground`, `role="note"`, `data-slot="narrator-message"`). Updated user variant to lighter/smaller (reduced padding `px-4 py-2`, `text-sm`, 80% opacity gradients) for reactive fragment feel.
- **Task 2:** Redesigned HeroSection — replaced headline with Nerin chat bubble ("What if the most interesting person in the room is you?"), added narrator context line, replaced scroll cue with "↓ Dive deeper", removed both CTA buttons. Preserved all data-testid attributes.
- **Task 3:** Converted ChatInputBar from JS-based `fixed` + `translateY` visibility to CSS-only `sticky; bottom: 0`. Removed `useDepthScroll` dependency. Updated CTA text to "Start the conversation →", added "25 min · Free · Private" muted text, ensured 44px min tap target.
- **Task 4:** Replaced 14-beat narrative with 7-beat three-voice conversation. Removed imports for ComparisonCard, HoroscopeVsPortraitComparison, HowItWorks, FinalCta, RelationshipCta, ComparisonTeaserPreview (source files preserved). Implemented all 7 beats with correct voice tags. Added Beat 8 placeholder comment. Wrapped ConversationFlow + ChatInputBar in div for sticky scoping.
- **Task 5:** Updated portrait-excerpt.md content to "The Solving Reflex" section from storytelling session. FounderPortraitExcerpt component unchanged (already renders as distinct card).
- **Task 6:** Verified DepthMeter works with shorter page — continuous scroll percentage (0–1) and mobile hidden below 900px both correct.
- **Task 7:** Updated all OG meta tags and page title/description per spec.
- **Task 8:** Typecheck passes, lint passes (pre-existing warnings only), all 735 tests pass with zero regressions, data-testid baseline comparison confirms no removals.

### Change Log

- 2026-03-25: Implemented full homepage narrative restructure and hero redesign (Story 37-3)

### File List

- `apps/front/src/components/home/ChatBubble.tsx` — Added narrator variant, updated user variant styling
- `apps/front/src/components/home/HeroSection.tsx` — Redesigned hero with Nerin bubble, narrator text, simplified scroll cue
- `apps/front/src/components/home/ChatInputBar.tsx` — CSS-only sticky positioning, updated CTA text, added context text
- `apps/front/src/components/home/portrait-excerpt.md` — Updated content to "The Solving Reflex" excerpt
- `apps/front/src/routes/index.tsx` — Replaced 14-beat with 7-beat narrative, updated OG meta tags, removed unused imports
