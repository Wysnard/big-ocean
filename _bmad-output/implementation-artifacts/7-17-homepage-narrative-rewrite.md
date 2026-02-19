# Story 7.17: Homepage Narrative Rewrite

Status: review

<!-- Added via correct-course (2026-02-19): Storytelling workshop produced new homepage narrative -->
<!-- Source: _bmad-output/story-2026-02-19.md -->
<!-- Depends on: Story 7.8 (existing component infrastructure) -->

## Story

As a **new visitor discovering big-ocean for the first time**,
I want **the home page to tell a compelling emotional story through a conversation between a skeptic and Nerin, culminating in real proof of portrait quality and a founder's personal testimony**,
So that **I'm emotionally convinced that big-ocean is fundamentally different from personality quizzes I've tried before, and I want to discover my own portrait**.

## Acceptance Criteria

1. **Given** I visit the home page **When** the hero section loads **Then** I see:
   - Headline: "Not a personality quiz. A conversation." with "A conversation." in gradient text
   - Subtitle: "A portrait of who you are that no test has ever given you."
   - Micro-text: "30 MIN · NO ACCOUNT · JUST TALKING" (no "FREE")
   - CTA button: "Begin Your Dive ↓" (unchanged)
   - OCEAN shapes with breathing animation (unchanged)
   **And** the brand mark, layout, scroll cue remain from Story 7.8

2. **Given** I scroll past the hero **When** the conversation section enters the viewport **Then** I see a 14-beat conversation between three speakers: Nerin, User (skeptic), and Vincent (founder)
   **And** the beat sequence follows the story document (`_bmad-output/story-2026-02-19.md`)
   **And** all existing scroll-reveal animations from Story 7.8 are preserved

3. **Given** I view the conversation **When** a Nerin bubble appears **Then** it uses the existing Nerin variant (gradient avatar, left-aligned) with updated copy matching the new beats
   **And** when a User bubble appears it uses the existing user variant (right-aligned, gradient bubble)
   **And** when Vincent's bubble (Beat 10) appears it has a distinct visual treatment:
   - Left-aligned (like Nerin) but with different avatar/styling
   - "V" initial with a warm gradient distinct from Nerin's teal→pink (e.g., amber/gold tones)
   - Name "Vincent" visible near the bubble
   - Bubble background subtly different from Nerin bubbles (e.g., warm-tinted, faint border accent)

4. **Given** I reach Beat 4 **When** the ComparisonCard appears **Then** it shows the existing traditional vs conversational comparison (unchanged component)
   **And** Nerin's intro text reads: "Same question. Two approaches."

5. **Given** I reach Beat 6 **When** the TraitStackEmbed appears **Then** the framing header reads "What I'm Actually Listening For"
   **And** the existing interactive trait explorer behavior is preserved (tap trait → facet conversation pair)

6. **Given** I reach Beat 8 **When** the HoroscopeVsPortraitComparison component appears **Then** I see a side-by-side comparison:
   - Left side: horoscope-style generic description with softer/pastel aesthetic
   - Right side: specific portrait excerpt with big-ocean's bold geometric style
   - Below: "Which one feels like someone was actually paying attention?"
   **And** on mobile (< 640px) the two sides stack vertically
   **And** the component uses existing depth scroll CSS tokens

7. **Given** I reach Beat 11b **When** privacy messaging appears **Then** Nerin says "Your Portrait. Your Rules." with reassurance about private-by-default, no public profile, no data sold

8. **Given** I reach Beat 12 **When** the ComparisonTeaserPreview appears **Then** the overlaid radar comparison displays without a "Coming soon" badge
   **And** Nerin's text includes the vacation couple anecdote

9. **Given** the page loads **When** I inspect the DOM **Then** OceanCodePreview, RadarChartPreview, FacetBarsPreview, and ShareCardPreview are NOT rendered on the page (removed from conversation flow)

10. **Given** I view the page on any device and theme **When** I scroll through the conversation **Then** all existing infrastructure works correctly:
    - DepthScrollProvider color interpolation
    - DepthMeter tracking
    - ChatInputBar appearance at ~35% scroll
    - Dark mode / light mode / auto mode
    - Mobile responsive layout
    - `prefers-reduced-motion` accessibility

## Tasks / Subtasks

- [x] Task 1: Update HeroSection copy (AC: #1)
  - [x] Change h1 to "Not a personality quiz. A conversation." with gradient on "A conversation."
  - [x] Change subtitle to "A portrait of who you are that no test has ever given you."
  - [x] Change micro-text to "30 MIN · NO ACCOUNT · JUST TALKING"
  - [x] Keep brand mark, CTA button, OCEAN shapes, scroll cue unchanged

- [x] Task 2: Add `vincent` variant to ChatBubble (AC: #3)
  - [x] Add `"vincent"` to the `variant` union type
  - [x] Design Vincent's avatar: "V" initial with warm gradient (e.g., `from-amber-500 to-orange-400`) to distinguish from Nerin's teal→pink
  - [x] Left-aligned layout (like Nerin) but with distinct bubble styling:
    - Slightly different background or faint warm border accent
    - Name "Vincent" shown as a label above or beside the bubble (small, muted text)
  - [x] Uses existing depth scroll CSS tokens for theme compatibility
  - [x] `data-slot="chat-bubble"` preserved

- [x] Task 3: Create HoroscopeVsPortraitComparison component (AC: #6)
  - [x] Create `apps/front/src/components/home/HoroscopeVsPortraitComparison.tsx`
  - [x] Two-column layout (side-by-side > 640px, stacked on mobile):
    - **Left — Horoscope side:**
      - Pastel/softer background to mimic astrology-app aesthetic (e.g., `bg-purple-50/60 dark:bg-purple-900/10`)
      - Header: "Horoscope" or star/zodiac icon
      - Text: "You are a deeply intuitive person who values security and emotional connection. You can be guarded at first but open up deeply to those you trust. Creative and nurturing, you sometimes struggle with letting go."
      - Softer typography (italic or lighter weight)
    - **Right — Portrait side:**
      - big-ocean's bold geometric style (uses existing embed tokens)
      - Header: "big-ocean" or Nerin avatar indicator
      - Text: "You have this selective relationship with uncertainty that I don't see often. Most people either love unpredictability or they don't. But you? You actively seek it in some areas and freeze up in others. That's not contradictory — it's strategic. You've learned where uncertainty serves you and where it doesn't."
      - Standard big-ocean typography (direct, specific)
  - [x] Container: rounded, bordered, uses `bg-[var(--embed-bg)]` and `border-[var(--embed-border)]`
  - [x] Bottom text: "Which one feels like someone was actually paying attention?" (italic, muted, centered)
  - [x] IntersectionObserver for scroll-reveal animation (fade + slide, same pattern as ComparisonCard)
  - [x] `data-slot="horoscope-portrait-comparison"`
  - [x] Mobile: stack vertically, maintain readability
  - [x] `motion-reduce` respected

- [x] Task 4: Remove "Coming soon" badge from ComparisonTeaserPreview (AC: #8)
  - [x] Delete the "Coming soon" badge `<div>` from `ComparisonTeaserPreview.tsx`
  - [x] No other changes to the component

- [x] Task 5: Rewrite conversation content in index.tsx (AC: #2, #4, #5, #7, #8, #9)
  - [x] Replace all content between `<ConversationFlow>` and `</ConversationFlow>` with 14 beats
  - [x] Import `HoroscopeVsPortraitComparison` component
  - [x] Remove unused imports: `ShareCardPreview`, `ResultPreviewEmbed` (if no longer used)
  - [x] Keep imports: `ComparisonCard`, `TraitStackEmbed`, `useTraitSelection`, `ComparisonTeaserPreview`
  - [x] Keep imports: `ChatBubble`, `ChatInputBar`, `ConversationFlow`, `DepthMeter`, `DepthScrollProvider`, `HeroSection`, `MessageGroup`
  - [x] Beat content (copy from `_bmad-output/story-2026-02-19.md`):
    - **Beat 1** [Nerin]: Hook — "You know that thing where a test tells you you're 'introverted'..."
    - **Beat 2** [User]: "I've done a few of these. They never really got it right..."
    - **Beat 3** [Nerin]: "That's Not a Bug. That's the Problem." — h3 header, paragraph about scales/averages/types
    - **Beat 4** [Nerin]: "Same question. Two approaches." + `<ComparisonCard />`
    - **Beat 5** [User]: "Okay I get how that's different. But that's just how you ask the questions."
    - **Beat 6** [Nerin]: "What I'm Actually Listening For" — h3 header + `<TraitStackEmbed />` + "You don't get a type. You get a landscape."
    - **Beat 6b** [conditional]: `{activeTrait && <TraitFacetPair />}` (keep existing behavior)
    - **Beat 7** [User]: "That's a lot of detail. But personality descriptions always end up saying the same thing..."
    - **Beat 8** [Nerin]: "You're not wrong. Two descriptions..." + `<HoroscopeVsPortraitComparison />`
    - **Beat 9** [User]: "That right side doesn't read like a test result. It reads like someone who actually knows them."
    - **Beat 10** [Nerin]: "That's actually the person who built big-ocean."
    - **Beat 10b** [Vincent]: Founder's personal share (expanded paragraph from story)
    - **Beat 11** [User]: "...I think I'd be scared to read mine."
    - **Beat 11b** [Nerin]: "Your Portrait. Your Rules." — h3 header, privacy messaging
    - **Beat 11c** [User]: "And if I want to share it? Or compare it with someone close to me?"
    - **Beat 12** [Nerin]: "See How You Connect" — h3 header + `<ComparisonTeaserPreview />` + vacation couple anecdote + privacy aside
    - **Beat 13** [User]: "...I wonder what mine would say."
    - **Beat 14** [Nerin]: "Just a Conversation" — h3 header, "Thirty minutes. No account. No wrong answers." + closing line

- [x] Task 6: Build verification (AC: #10)
  - [x] `pnpm build` — 0 errors
  - [x] `pnpm lint` — no new warnings
  - [x] `pnpm test:run` — no regressions

## Dev Notes

### This is a COPY + COMPONENT UPDATE, Not a Rearchitecture

Story 7.8 delivered the complete component infrastructure. This story updates:
1. **Copy** — All hardcoded conversation text in index.tsx
2. **Hero** — Three text changes in HeroSection.tsx
3. **Two new things** — HoroscopeVsPortraitComparison component + Vincent variant in ChatBubble
4. **One removal** — "Coming soon" badge from ComparisonTeaserPreview
5. **Removals from page** — OceanCode, Radar, FacetBars, ShareCard previews (files stay, just not imported)

### Guiding Principles from Storytelling Workshop

- **"Texture, not taxonomy"** — Never frame facets as smaller boxes. They're landscape, depth, layers.
- **"Show before explain"** — Portrait proof before science lecture.
- **"One portrait, maximum impact"** — Only one portrait moment (in horoscope comparison). No standalone portrait.
- **"The dive master voice"** — Experienced, factual, confident, never arrogant. More informational than in-session Nerin.
- **"Let silence close"** — No playful tease at the end. Trust the work.

### Three Emotional Peaks

```
Peak 1 (Beat 8)  — Awe.    "This is extraordinary." Product conviction.
Peak 2 (Beat 10) — Trust.  "This is real."          Brand conviction.
Peak 3 (Beat 13) — Desire. "I want this for me."    Conversion.
```

### Vincent Bubble Design Notes

Vincent is NOT Nerin and NOT the skeptic. He's a real person interjecting once in the conversation. Visual treatment should signal "this is a real founder" — distinct from AI (Nerin) and anonymous skeptic. Consider:
- Warm color palette for avatar (amber/gold) vs Nerin's cool teal→pink
- A subtle name label ("Vincent") in small text
- Slightly different bubble background (warm tint or faint warm border)
- The bubble contains raw, genuine text — no headers, no formatting

### HoroscopeVsPortraitComparison Design Notes

This is the page's emotional climax. The contrast must be stark:
- **Horoscope side** should feel generic, soft, vague — pastel background, italic text, astrological aesthetic
- **Portrait side** should feel specific, direct, powerful — big-ocean's bold style, direct address ("you"), concrete observations
- The reader should immediately feel the quality gap without being told
- Don't label one as "bad" and one as "good" — let the content speak for itself

### Copy Source

All conversation copy is in `_bmad-output/story-2026-02-19.md` under "Complete Story" section. Use it verbatim except:
- `**bold text**` → `<strong>` tags
- `*italic text*` → `<em>` tags
- `&mdash;` for em dashes
- `&nbsp;&mdash;&nbsp;` for spaced em dashes (matching existing pattern in current index.tsx)

### Components Removed from Page (Keep Files)

These components are NOT deleted — they remain in the codebase. They're just no longer imported/rendered in `index.tsx`:
- `ResultPreviewEmbed.tsx` (contains OceanCodeEmbed, RadarEmbed, FacetBarsEmbed)
- `ShareCardPreview.tsx`

### Anti-Patterns

```
DO NOT modify DepthScrollProvider, ConversationFlow, MessageGroup, DepthMeter, ChatInputBar
DO NOT change scroll behavior, depth transitions, or color interpolation
DO NOT add new npm packages
DO NOT connect the conversation to any backend — all content is hardcoded
DO NOT add "30 facets" or facet counts to the hero section (taxonomy framing)
DO NOT add a playful tease to the closing beat ("I already have a hunch about you" was explicitly cut)
DO NOT add "FREE" to the micro-text (explicitly removed in workshop)
DO NOT make the horoscope side look bad on purpose with broken layout — let the content itself create the contrast
DO NOT duplicate the portrait excerpt elsewhere on the page — one appearance only (in the comparison)
```

### Testing Approach

Visual verification only (no unit tests for this copy change):
1. `pnpm dev --filter=front` — verify hero renders with new copy
2. Scroll through all 14 beats — verify copy matches story document
3. Verify Vincent bubble has distinct visual identity from Nerin and User
4. Verify HoroscopeVsPortraitComparison renders correctly (both themes, mobile + desktop)
5. Verify ComparisonTeaserPreview has no "Coming soon" badge
6. Verify OceanCodePreview, RadarChartPreview, FacetBarsPreview, ShareCardPreview are NOT on page
7. Verify all existing infrastructure still works (depth scroll, dark mode, mobile, animations)
8. `pnpm build` — 0 errors
9. `pnpm lint` — no new warnings
10. `pnpm test:run` — no regressions

### File Structure

```
apps/front/src/
  routes/
    index.tsx                                        # MODIFY: rewrite conversation content
  components/
    home/
      HeroSection.tsx                                # MODIFY: update copy (3 text changes)
      ChatBubble.tsx                                 # MODIFY: add vincent variant
      ComparisonTeaserPreview.tsx                     # MODIFY: remove "Coming soon" badge
      HoroscopeVsPortraitComparison.tsx              # NEW: horoscope vs portrait comparison
      # UNCHANGED (infrastructure from Story 7.8):
      DepthScrollProvider.tsx
      ConversationFlow.tsx
      MessageGroup.tsx
      TraitStackEmbed.tsx
      ComparisonCard.tsx
      ResultPreviewEmbed.tsx                         # KEPT (file stays, removed from page)
      ShareCardPreview.tsx                           # KEPT (file stays, removed from page)
      DepthMeter.tsx
      ChatInputBar.tsx
```

### Previous Story Intelligence

**From Story 7.8 (Conversation-Driven Homepage) — done:**
- Complete component infrastructure delivered and working
- DepthScrollProvider, ConversationFlow, MessageGroup, ChatBubble, TraitStackEmbed, ComparisonCard, ResultPreviewEmbed, ShareCardPreview, ComparisonTeaserPreview, DepthMeter, ChatInputBar
- All depth scroll CSS tokens in globals.css
- All keyframe animations (breathe, bob, traitPairEnter, etc.)
- Theme toggle cycling: system → dark → light
- Build verified, lint clean, tests pass

**From Story 7.8 Change Log (2026-02-14):**
- Copy was already rewritten once from 13 feature-focused beats to 8 emotional beats
- This rewrite goes further: 14 beats with three speakers, three peaks, and founder reveal

### References

- [Story Source: story-2026-02-19.md](/_bmad-output/story-2026-02-19.md) — Complete story output with all beats, design notes, emotional arc
- [Portrait Example](/_bmad-output/planning-artifacts/portrait-example.md) — Vincent's actual portrait (source for comparison excerpt)
- [Story 7.8 Implementation](/_bmad-output/implementation-artifacts/7-8-conversation-driven-homepage-with-depth-scroll.md) — Component infrastructure reference
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns
- [globals.css](/packages/ui/src/styles/globals.css) — Token system and depth scroll tokens

## Dev Agent Record

### Implementation Notes

- **Approach:** Pure copy + component update as specified. No infrastructure changes. All 14 beats implemented verbatim from `_bmad-output/story-2026-02-19.md`.
- **Vincent variant:** Left-aligned like Nerin with `from-amber-500 to-orange-400` gradient avatar, `border-amber-500/20` warm border accent, "Vincent" name label above bubble, `bg-[var(--embed-bg)]` background for theme compatibility.
- **HoroscopeVsPortraitComparison:** Follows exact same IntersectionObserver pattern as ComparisonCard. Staggered fade+slide animation (200ms horoscope, 500ms portrait, 900ms bottom text). Uses `sm:grid-cols-2` for responsive breakpoint. Horoscope side: purple-50/60 pastel bg, italic text. Portrait side: standard foreground text.
- **Anti-patterns respected:** No playful tease at end (Beat 14 closes quietly), no "FREE" in micro-text, no taxonomy framing, no modifications to infrastructure components, no new npm packages.
- **Removed from page:** `ShareCardPreview` and `ResultPreviewEmbed` imports removed from index.tsx. Component files preserved in codebase.

### Completion Notes

All 6 tasks implemented and verified:
- Hero copy updated (3 text changes)
- Vincent ChatBubble variant added with warm amber/gold visual identity
- HoroscopeVsPortraitComparison component created with scroll-reveal, responsive layout, motion-reduce support
- "Coming soon" badge removed from ComparisonTeaserPreview
- All 14 conversation beats rewritten with three speakers (Nerin, User, Vincent)
- Build: 0 errors | Lint: no new warnings | Tests: all passing (389 total, 0 failures)

## File List

- `apps/front/src/routes/index.tsx` — MODIFIED: Complete conversation rewrite (14 beats, 3 speakers), removed ShareCardPreview import, added HoroscopeVsPortraitComparison import
- `apps/front/src/components/home/HeroSection.tsx` — MODIFIED: Updated h1, subtitle, and micro-text copy
- `apps/front/src/components/home/ChatBubble.tsx` — MODIFIED: Added "vincent" variant with warm amber avatar, name label, distinct bubble styling
- `apps/front/src/components/home/ComparisonTeaserPreview.tsx` — MODIFIED: Removed "Coming soon" badge
- `apps/front/src/components/home/HoroscopeVsPortraitComparison.tsx` — NEW: Side-by-side horoscope vs portrait comparison with scroll-reveal animation

## Change Log

- **2026-02-19:** Story 7.17 implemented — Complete homepage narrative rewrite with 14-beat conversation flow, Vincent founder bubble variant, HoroscopeVsPortraitComparison component, updated hero copy, removed "Coming soon" badge. All builds, lint, and tests pass.
- **2026-02-19:** Added Beat 11c — User message "And if I want to share it? Or compare it with someone close to me?" between privacy (11b) and social comparison (12) for a natural narrative transition. Build verified.
- **2026-02-19:** Fix dark mode visibility of agree/disagree scale dots in ComparisonCard. Changed `border-border` (#252A52, invisible on dark embed background) to `border-muted-foreground/30` for visible contrast in both themes. Build, lint, tests verified.
