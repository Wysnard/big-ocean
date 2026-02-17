# Story 8.6: Results Page Layout Redesign — Mockup 7 Detail Zone

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User viewing my results**,
I want **to see my personality data in an engaging grid layout with clickable trait cards that reveal evidence inline**,
So that **I can explore my results at my own pace without modal interruptions, with a clear visual hierarchy from overview to detail**.

## Acceptance Criteria

1. **Hero Section (modified — Archetype-First with Strong Code Secondary):** Given I view the results page, When the hero renders, Then the ArchetypeHeroSection displays the archetype name as the PRIMARY heading (display scale, emotional anchor), And the OCEAN code is displayed as a STRONG SECONDARY below the name (font-mono, ~text-2xl, wide letter-spacing, monochrome text-foreground/50 — no per-letter trait colors, no hover interaction in hero), And the archetype description is NOT shown in the hero, And geometric signature and confidence badge remain, And the OCEAN code and confidence badge are visually separated (code on its own line, confidence as small pill below).

2. **About Your Archetype (new):** Given I view the results page, When the grid container renders, Then I see a full-width "About Your Archetype" card as the first element, And it contains the 4-5 sentence archetype description (from Story 8.1).

3. **Personalized Portrait (redesigned):** Given a personalized portrait exists, When the grid container renders, Then I see a full-width "Your Personality Portrait" card with a rainbow accent bar (5 trait colors gradient) at top, And the card has an icon + "Your Personality Portrait" header + subtitle, And the content is displayed in a 2x2 grid of insight sections: Strengths, Tensions, How You Connect, Resilience, And each section has a trait-colored dot, title, and paragraph, And the grid is responsive (2x2 desktop, 1-column mobile), And if `personalDescription` is null the card is not shown.

4. **Radar Chart (new):** Given I view the results page, When the data overview section renders, Then I see a "Personality Shape" card with a pentagon radar chart, And each axis represents one OCEAN trait with its name and percentage, And the filled area uses a trait-color gradient with 25% opacity, And dots at each vertex use the individual trait color, And the chart uses shadcn Chart component (Recharts RadarChart).

5. **Confidence Ring (new):** Given I view the results page, When the data overview section renders, Then I see an "Overall Confidence" card alongside the radar chart, And it shows a circular progress ring with the confidence percentage, And a label shows "Based on N conversation messages".

6. **Trait Cards (replaces TraitScoresSection):** Given I view the results page, When the trait section renders, Then I see 5 trait cards in a responsive grid (3 per row desktop, 1 mobile), And each card shows: 4px color accent bar, OCEAN shape icon + trait name + level badge (H/M/L) + confidence mini ring (18px SVG circle showing trait confidence as arc fill + percentage label, trait-colored, low confidence < 40% dims opacity), large score + /120 (no score percentage — removed to avoid confusion with confidence percentage), score progress bar (opacity dims to 0.5 when confidence < 40%), 2x3 compact facet grid, "Tap to see evidence" hint, And cards have hover effect, And clicking a card opens the Detail Zone below the row.

7. **Detail Zone (replaces EvidencePanel modal):** Given I click a trait card, When the detail zone opens, Then a full-width panel slides open below the current row, And the selected card shows a "selected" state (border color, arrow indicator), And the zone header shows trait shape + title + score + level + evidence count + close button, And the zone contains a 3-column facet detail grid (responsive 3→2→1), And each facet detail card shows left border in trait color, facet name + score, score bar, evidence quotes with signal badge (Strong/Moderate/Weak), And clicking the same card or close button collapses the zone, And clicking a different card closes current zone and opens new one, And the zone animates open/close (~400ms max-height transition), And the page scrolls smoothly to the opened zone.

8. **Quick Actions (new):** Given I view the results page, When the actions section renders, Then I see a "Quick Actions" card with 3 action items: Resume Conversation, View Public Profile, Download Report, And each item has an icon, title, description, and arrow indicator.

9. **Share Card (redesigned):** Given I view the results page, When the share section renders, Then I see a full-width "Share your OCEAN code" card with gradient background, And it shows title, description, shareable link with Copy button, And a visibility toggle (Public/Private) using shadcn Switch component.

10. **Responsive Design:** Given I view the results page on any device, When the layout renders, Then all sections adapt to mobile (single column), And the grid container uses `max-width: 1120px` with `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`.

11. **Cleanup:** Given the redesign is complete, When I check the codebase, Then removed/replaced components have no dead code remaining, And all existing tests are updated for the new component structure.

## Tasks / Subtasks

- [x] Task 1: Install required shadcn components (AC: #4, #9)
  - [x] 1.1 Install `chart` component via shadcn CLI (`pnpm dlx shadcn@latest add chart -c apps/front`) — brings Recharts dependency
  - [x] 1.2 Install `switch` component via shadcn CLI (`pnpm dlx shadcn@latest add switch -c apps/front`)
  - [x] 1.3 Verify both components are available in `apps/front/src/components/ui/` and importable

- [ ] ~~Task 2: Create AboutArchetypeCard component (AC: #2)~~ — **REMOVED** per user request (2026-02-17)
  - [ ] ~~2.1 Create `apps/front/src/components/results/AboutArchetypeCard.tsx`~~
  - [ ] ~~2.2 Props: `{ description: string }`~~
  - [ ] ~~2.3 Use shadcn Card component~~
  - [ ] ~~2.4 Add `data-slot="about-archetype-card"`~~
  - [ ] ~~2.5 Write unit test~~

- [x] Task 3: Create PersonalityRadarChart component (AC: #4)
  - [x] 3.1 Create `apps/front/src/components/results/PersonalityRadarChart.tsx`
  - [x] 3.2 Props: `{ traits: readonly TraitResult[] }` — renders pentagon radar chart with 5 OCEAN axes
  - [x] 3.3 Use shadcn ChartContainer + Recharts RadarChart with custom PolarAngleAxis tick rendering trait names + percentages
  - [x] 3.4 Filled polygon area uses trait-color linear gradient at 25% opacity
  - [x] 3.5 Dots at each vertex use individual trait color via custom Recharts dot renderer
  - [x] 3.6 Card wrapper with "Personality Shape" heading
  - [x] 3.7 Add `data-slot="personality-radar-chart"`
  - [x] 3.8 Write unit test verifying 5 axes render with correct trait names

- [x] Task 4: Create ConfidenceRingCard component (AC: #5)
  - [x] 4.1 Create `apps/front/src/components/results/ConfidenceRingCard.tsx`
  - [x] 4.2 Props: `{ confidence: number; messageCount: number }` — renders circular SVG ring with percentage
  - [x] 4.3 SVG ring: 120x120 viewBox, `r=54`, `stroke-dasharray/offset` for partial fill, rotated -90deg
  - [x] 4.4 Center text showing percentage, label below showing "Based on N conversation messages"
  - [x] 4.5 Card wrapper with "Overall Confidence" heading
  - [x] 4.6 Add `data-slot="confidence-ring-card"`
  - [x] 4.7 Write unit test verifying confidence percentage and message count render

- [x] Task 5: Redesign PersonalPortrait for 2x2 grid layout (AC: #3)
  - [x] 5.1 Update `apps/front/src/components/results/PersonalPortrait.tsx` to render as full-width grid card with rainbow accent bar
  - [x] 5.2 Rainbow accent bar: `linear-gradient(90deg, --trait-openness, --trait-conscientiousness, --trait-extraversion, --trait-agreeableness, --trait-neuroticism)` as 4px top bar
  - [x] 5.3 Header: icon + "Your Personality Portrait" + subtitle "Patterns discovered from your conversation with Nerin"
  - [ ] 5.4 Parse `personalDescription` as JSON with 4 keys: `strengths`, `tensions`, `connections`, `resilience`
  - [ ] 5.5 Render 2x2 grid of insight sections — each with trait-colored dot, title, paragraph
  - [x] 5.6 Fallback: if JSON parse fails (legacy single-string format), render as single paragraph (current behavior)
  - [ ] 5.7 Section color mapping: Strengths → openness color, Tensions → extraversion color, How You Connect → agreeableness color, Resilience → neuroticism color
  - [x] 5.8 Responsive: 2x2 on desktop, 1-column on mobile (`grid-template-columns: 1fr 1fr` → `1fr`)
  - [x] 5.9 Add `data-slot="personal-portrait"` (unchanged)
  - [x] 5.10 Write unit test for JSON parsing + fallback behavior

- [x] Task 6: Create TraitCard component (AC: #6)
  - [x] 6.1 Create `apps/front/src/components/results/TraitCard.tsx`
  - [x] 6.2 Props: `{ trait: TraitResult; facets: readonly FacetResult[]; isSelected: boolean; onClick: () => void }`
  - [x] 6.3 Render: 4px color accent bar at top (trait color), OCEAN shape icon + trait name + level badge (H/M/L) + confidence mini ring (18px SVG arc + percentage), large score + /120 (no score percentage), score progress bar (opacity dims when confidence < 40%)
  - [x] 6.4 Compact 2x3 facet grid inside card: facet name + score number + mini score bar per facet
  - [x] 6.5 "Tap to see evidence" hint text at bottom with chevron icon
  - [x] 6.6 Hover effect: `box-shadow: 0 8px 32px rgba(0,0,0,0.06); transform: translateY(-2px);`
  - [x] 6.7 Selected state: trait-colored border, no hover lift, arrow indicator pointing down (CSS `::after` pseudo-element)
  - [x] 6.8 Use `--trait-color` CSS custom property for theming (set via `style={{ '--trait-color': traitColor }}`)
  - [x] 6.9 Import OCEAN shape components from `../ocean-shapes/` (same pattern as TraitScoresSection)
  - [x] 6.10 Add `data-slot="trait-card"` and `data-trait={trait.name}` attributes
  - [x] 6.11 Write unit test for render, click callback, selected state

- [x] Task 7: Create DetailZone component (AC: #7)
  - [x] 7.1 Create `apps/front/src/components/results/DetailZone.tsx`
  - [x] 7.2 Props: `{ trait: TraitResult; facets: readonly FacetResult[]; evidence: Map<FacetName, SavedFacetEvidence[]>; isOpen: boolean; onClose: () => void; isLoading: boolean }`
  - [x] 7.3 Full-width panel (`grid-column: 1 / -1`) with animated open/close via `max-height` transition (~400ms)
  - [x] 7.4 Header: OCEAN shape + "Trait — Evidence" title + score + level + evidence count + close button (×)
  - [x] 7.5 3-column facet detail grid (responsive: 3→2→1 columns via CSS grid breakpoints)
  - [x] 7.6 Per facet detail card: left border in trait color (3px), facet name + score, score progress bar, evidence quotes
  - [x] 7.7 Evidence items: italic quote text with `"..."` wrapping, message reference, signal badge (Strong/Moderate/Weak based on confidence)
  - [x] 7.8 Signal badge mapping: confidence >= 0.7 → Strong (green/agreeableness tint), >= 0.4 → Moderate (amber/conscientiousness tint), < 0.4 → Weak (purple/neuroticism tint)
  - [x] 7.9 Loading state: skeleton placeholders while evidence is being fetched
  - [x] 7.10 Add `data-slot="detail-zone"` and `data-trait={trait.name}` attributes
  - [x] 7.11 Write unit test for open/close animation class toggling, evidence rendering, signal badges

- [x] Task 8: Create QuickActionsCard component (AC: #8)
  - [x] 8.1 Create `apps/front/src/components/results/QuickActionsCard.tsx`
  - [x] 8.2 Props: `{ sessionId: string; publicProfileId?: string }` — 3 action items with icons and descriptions
  - [x] 8.3 Action items: Resume Conversation (→ `/chat?sessionId=...`), View Public Profile (→ public profile URL), Download Report (placeholder/disabled for now)
  - [x] 8.4 Each item: colored icon background, title, description, right arrow indicator (›)
  - [x] 8.5 Use TanStack Router `Link` for navigation actions
  - [x] 8.6 Add `data-slot="quick-actions-card"`
  - [x] 8.7 Write unit test for action item rendering and link targets

- [x] Task 9: Restructure ProfileView to CSS Grid layout (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10)
  - [x] 9.1 Replace depth-zone layout in `ProfileView.tsx` with a single CSS Grid container (max-width 1120px, `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`, gap 20px)
  - [x] 9.2 Modify `ArchetypeHeroSection.tsx` — RESTRUCTURE for archetype-first with strong code secondary: (a) Keep archetype name as h1 PRIMARY heading (display scale, unchanged), (b) Promote OCEAN code to its own line below the name — pull out of the flex container with confidence, style as `font-mono text-2xl tracking-[0.3em] text-foreground/50` (monochrome, no per-letter trait colors, no hover/tap interaction), (c) Keep confidence badge as small metadata pill below the code, (d) REMOVE the `<p>` element that renders `archetypeDescription` if present. Keep geometric signature, curated badge.
  - [x] 9.3 Keep hero section OUTSIDE the grid (full-width above), grid container starts after hero
  - [x] 9.4 Grid order: AboutArchetypeCard (full-width) → PersonalPortrait (full-width, conditional) → RadarChart + ConfidenceRing (side by side) → 5 TraitCards + DetailZones → QuickActionsCard → ShareCard (full-width)
  - [x] 9.5 Detail zone placement: DetailZone for row 1 (O, C, E) inserted after 3rd trait card; DetailZone for row 2 (A, N) inserted after 5th trait card
  - [x] 9.6 Update ProfileView props to include `personalDescription`, `messageCount`, `onTraitCardClick`, `selectedTrait`, `traitEvidence`
  - [x] 9.7 Remove WaveDivider usage from results layout (grid layout replaces depth-zone transitions)
  - [x] 9.8 Ensure all `children` content is preserved or migrated to new components

- [x] Task 10: Redesign ShareProfileSection to match mockup card pattern (AC: #9)
  - [x] 10.1 Update `ShareProfileSection.tsx` to render as full-width grid card with gradient background, title "Share your OCEAN code" (not "Share your archetype")
  - [x] 10.2 Gradient background: `linear-gradient(135deg, oklch(0.67 0.13 181 / 0.08), oklch(0.55 0.24 293 / 0.06))`
  - [x] 10.3 Horizontal layout: text left (title + description) + link right (URL + Copy button) + visibility toggle
  - [x] 10.4 Replace Button-based visibility toggle with shadcn Switch component
  - [x] 10.5 Keep all existing functionality (share, copy, social buttons, toggle)
  - [x] 10.6 Update unit tests if any exist for ShareProfileSection

- [x] Task 11: Wire up results route with new layout + evidence data flow (AC: #6, #7)
  - [x] 11.1 Update `$assessmentSessionId.tsx` route to manage `selectedTrait` state (single TraitName | null)
  - [x] 11.2 Replace `expandedTraits` Set with `selectedTrait` single selection pattern
  - [x] 11.3 Fetch evidence for ALL facets of selected trait when a trait card is clicked (use `useFacetEvidence` for each facet, or batch fetch)
  - [x] 11.4 Pass trait evidence data to DetailZone component as `Map<FacetName, SavedFacetEvidence[]>`
  - [x] 11.5 Remove EvidencePanel Dialog import and usage (replaced by inline DetailZone)
  - [x] 11.6 Pass `messageCount` to ProfileView for ConfidenceRingCard (derive from results data or add to API response)
  - [x] 11.7 Update ProfileView children to use new grid components instead of depth-zone WaveDividers

- [x] Task 12: Cleanup — remove deprecated components and dead code (AC: #11)
  - [x] 12.1 Remove or deprecate `TraitScoresSection.tsx` (replaced by TraitCard grid in ProfileView)
  - [x] 12.2 Remove or deprecate `TraitBar.tsx` if it existed as standalone (functionality absorbed into TraitCard)
  - [x] 12.3 Remove or deprecate `FacetBreakdown.tsx` (functionality absorbed into DetailZone)
  - [x] 12.4 Remove `EvidencePanel.tsx` Dialog modal (replaced by inline DetailZone)
  - [x] 12.5 Remove unused imports and exports across modified files
  - [x] 12.6 Verify no other components import the removed components (search codebase)
  - [x] 12.7 Remove WaveDivider imports from results-related files (may still be used on other pages — check before deleting the component itself)

- [x] Task 13: Update and run tests (AC: #11)
  - [x] 13.1 Update any existing tests for ProfileView, ArchetypeHeroSection, TraitScoresSection to match new structure
  - [x] 13.2 Ensure all new component unit tests pass
  - [x] 13.3 Run full test suite (`pnpm test:run`) — no regressions
  - [x] 13.4 Run linting (`pnpm lint`) — no warnings
  - [x] 13.5 Run type checking (`pnpm turbo lint`) — no errors
  - [x] 13.6 Verify the public profile page still works (it uses ProfileView too — check `apps/front/src/routes/profile/$publicProfileId.tsx`)

## Dev Notes

### Design Philosophy: Archetype-First Reveal, Code-First Social Identity

The archetype name is the PRIMARY reveal element in the hero — the emotional anchor when users first see their results. The OCEAN code is the PRIMARY social identity — the thing users say in conversation ("I'm an ODEWR"), share on social media, and compare with friends.

**Hierarchy in the Hero UI:**
1. **Archetype name** (e.g., "The Idealist") — h1, display scale, bold, full foreground. Emotional first impression.
2. **OCEAN code** (e.g., "ODEWR") — strong secondary, font-mono, ~text-2xl, wide letter-spacing (`tracking-[0.3em]`), monochrome (`text-foreground/50`). No per-letter trait colors in the hero — keeps the reveal moment premium and restrained. No hover/tap interaction — that lives in the OceanCodeStrand card.
3. **Confidence badge** — small metadata pill, unchanged.
4. **Archetype description** — moved to "About Your Archetype" card in the grid below.

**Why monochrome code in the hero:**
- Saturated per-letter trait colors feel visually noisy in a hero context — the reveal moment should feel premium and calm
- Color payoff is deferred to the `OceanCodeStrand` card (vertical strand with colored dots, level gauges, trait descriptions) — creates a visual narrative from grayscale calm → color revelation as users scroll
- The hero whispers the code; the strand card explains it in full color
- Screenshots of the hero look clean and intentional for social sharing

**Why this matters for sharing:**
- "I'm an ODEWR" works in conversation like "I'm an INTP"
- Semantic letters self-explain: O=Open-minded, D=Disciplined, E=Extravert, W=Warm, R=Resilient
- Partial matches create social discovery: "I'm ODEWR, you're ODANT — we're both OD!"
- The archetype name anchors the reveal moment; the code anchors the sharing moment

**Impact on components:**
- `ArchetypeHeroSection`: Archetype name stays as h1, OCEAN code promoted to own line below name (monochrome, wide-tracked), confidence stays as small pill
- `OceanCodeStrand`: Full-color OCEAN breakdown card with interactive per-letter exploration (tooltips, level gauges, descriptions)
- Share card: "Share your OCEAN code" not "Share your archetype"
- Comparison features (future): letter-by-letter matching highlights

### Architecture Decision: CSS Grid Replaces Depth Zones

The current results page uses a "depth zone" pattern with `WaveDivider` components to create visual transitions between sections (`--depth-surface` → `--depth-shallows` → `--depth-mid` → `--depth-deep`). Story 8.6 replaces this with a single CSS Grid container (Mockup 7: Detail Zone pattern).

**Why this approach:**
- Grid container allows the "detail zone slides open below the row" behavior naturally — grid items reflow when a full-width detail zone is inserted
- Eliminates visual complexity of wave dividers for a cleaner, card-based design
- Better responsive behavior with `auto-fill` grid
- All new components are grid-aware (full-width via `grid-column: 1 / -1`)

**What this means:**
- `ProfileView.tsx` is restructured from depth-zone layout to grid layout
- WaveDividers removed from results page (may still be used elsewhere — verify before deleting component)
- Hero section stays ABOVE the grid (full-width banner), grid starts below it
- Background changes from depth-zone gradient to uniform `--depth-surface` with white card backgrounds

### Detail Zone — Row Mapping Logic

The mockup places trait cards in a grid and inserts detail zones between rows:
- **Row 1:** Openness, Conscientiousness, Extraversion → Detail Zone 1 (after 3rd card)
- **Row 2:** Agreeableness, Neuroticism → Detail Zone 2 (after 5th card)

Implementation approach: render trait cards and detail zones in sequence. Use grid `order` property or explicit DOM ordering:
```
TraitCard[O] → TraitCard[C] → TraitCard[E] → DetailZone[row1] → TraitCard[A] → TraitCard[N] → DetailZone[row2]
```

Only ONE detail zone is open at a time. When a card in row 1 is selected, DetailZone[row1] opens. When a card in row 2 is selected, DetailZone[row2] opens and DetailZone[row1] closes.

### Evidence Fetching Strategy for DetailZone

Current EvidencePanel fetches evidence for ONE facet at a time via `useFacetEvidence(sessionId, facetName)`. The new DetailZone needs evidence for ALL 6 facets of a trait simultaneously.

**Options:**
1. **Multiple `useFacetEvidence` calls** — 6 parallel queries when a trait card is clicked. Simple, uses existing hooks.
2. **New batch endpoint** — Single call returns all evidence for all facets of a trait. More efficient but requires API changes.

**Recommended: Option 1** for this story — no API changes needed. Evidence queries are fast (~1ms each, cached by TanStack Query for 5 minutes). The 6 parallel fetches happen only when clicking a trait card, not on initial page load.

If needed, a batch endpoint can be added in a future optimization story.

### PersonalPortrait — JSON Format With Fallback

Story 8.4 stored `personalDescription` as a plain text string. This story redesigns the portrait to show a 2x2 grid of sections (Strengths, Tensions, How You Connect, Resilience).

**Implementation:**
- Parse `personalDescription` as JSON: `{ strengths, tensions, connections, resilience }`
- If parse succeeds: render 4-section grid
- If parse fails (legacy string format from 8.4): render as single paragraph with accent bar (current behavior)

**Future story:** Update the portrait generator prompt (in `portrait-generator.claude.repository.ts`) to produce JSON output. The current portrait format is plain text. This story only updates the **frontend renderer** — it handles both formats gracefully.

**Note:** The portrait generator prompt update (to produce JSON) should happen BEFORE this story ships to production, or the fallback will always trigger for existing data. Consider updating the prompt as part of Task 5 subtask, OR accept that existing portraits render as single paragraphs.

### Message Count for ConfidenceRingCard

The `GetResultsResponse` contract does NOT include `messageCount`. The mockup's confidence ring shows "Based on N conversation messages."

**Options:**
1. Add `messageCount` to `GetResultsResponseSchema` — requires backend contract change
2. Derive from available data — confidence percentage is already in the response
3. Hardcode or omit the message count label

**Recommended: Option 1** — add `messageCount: S.Number` to the contract and use-case output. The use-case already queries messages for threshold checking (Story 8.4, line: `const userMessageCount = messages.filter(...).length`). Return this count in the response.

This is a small, backward-compatible API change (additive field).

### shadcn Chart Component (Recharts)

The `chart` component from shadcn installs Recharts as a dependency and provides:
- `ChartContainer` — wrapper with responsive sizing and theme integration
- `ChartTooltip`, `ChartTooltipContent` — themed tooltips
- `ChartLegend`, `ChartLegendContent` — themed legends

For the radar chart, use Recharts' `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `Radar` components within `ChartContainer`.

Custom tick rendering on `PolarAngleAxis` to show trait name + percentage (two lines of text at each vertex).

### Key Existing Utilities to Reuse

- `getTraitColor(traitName)` — returns trait CSS color string (from `@workspace/domain`)
- `getFacetColor(facetName)` — returns facet CSS color string
- `getTraitShape(traitName)` — OCEAN shape components (Circle, HalfCircle, Rectangle, Triangle, Diamond)
- `TRAIT_NAMES` — ordered array of 5 trait names
- `TRAIT_DESCRIPTIONS` — taglines and level descriptions per trait
- `FACET_DESCRIPTIONS` — level descriptions per facet
- `toFacetDisplayName(facetName)` — converts snake_case to display name
- `getFacetLevel(facetName, score)` — returns level code for facet score

These are already imported in `TraitScoresSection.tsx` — reuse the same imports in new components.

### Signal Badge Mapping

Evidence items in the detail zone show a confidence signal badge:
- **Strong** (confidence >= 0.7): green-tinted badge (`oklch(0.67 0.13 181 / 0.15)` bg, `oklch(0.45 0.13 181)` text)
- **Moderate** (confidence >= 0.4): amber-tinted badge (`oklch(0.67 0.20 42 / 0.15)` bg, `oklch(0.50 0.20 42)` text)
- **Weak** (confidence < 0.4): purple-tinted badge (`oklch(0.29 0.19 272 / 0.10)` bg, `oklch(0.40 0.10 272)` text)

These use the same oklch color system as the trait colors, maintaining visual consistency.

### Public Profile Impact

The public profile page (`apps/front/src/routes/profile/$publicProfileId.tsx`) also uses `ProfileView`. Changes to ProfileView will affect the public profile display.

**Considerations:**
- Public profiles should use the same grid layout (visual consistency)
- PersonalPortrait should NOT show on public profiles (privacy — see Story 8.4 dev notes)
- Evidence/DetailZone should NOT show on public profiles (no evidence data in public profile API)
- QuickActionsCard should show different actions on public profiles (no "Resume Conversation")

**Approach:** ProfileView accepts optional props for conditional rendering. The public profile route passes different props than the results route.

### Files to Create

| File | Description |
|------|-------------|
| `apps/front/src/components/results/AboutArchetypeCard.tsx` | Full-width archetype description card |
| `apps/front/src/components/results/PersonalityRadarChart.tsx` | Recharts pentagon radar chart |
| `apps/front/src/components/results/ConfidenceRingCard.tsx` | SVG circular progress ring |
| `apps/front/src/components/results/TraitCard.tsx` | Clickable trait card with compact facet grid |
| `apps/front/src/components/results/DetailZone.tsx` | Inline collapsible evidence panel |
| `apps/front/src/components/results/QuickActionsCard.tsx` | Quick actions list card |

### Files to Modify

| File | Change |
|------|--------|
| `apps/front/src/components/results/ProfileView.tsx` | Restructure from depth-zones to CSS Grid layout |
| `apps/front/src/components/results/ArchetypeHeroSection.tsx` | Remove archetype description paragraph |
| `apps/front/src/components/results/PersonalPortrait.tsx` | Redesign for 2x2 grid with JSON parsing |
| `apps/front/src/components/results/ShareProfileSection.tsx` | Redesign to full-width gradient card with Switch |
| `apps/front/src/routes/results/$assessmentSessionId.tsx` | Update state management, wire new components |
| `packages/contracts/src/http/groups/assessment.ts` | Add `messageCount` to GetResultsResponseSchema |
| `apps/api/src/use-cases/get-results.use-case.ts` | Return `messageCount` in output |
| `apps/api/src/handlers/assessment.ts` | Map `messageCount` to response (verify auto-mapping) |

### Files to Remove/Deprecate

| File | Reason |
|------|--------|
| `apps/front/src/components/results/TraitScoresSection.tsx` | Replaced by TraitCard grid in ProfileView |
| `apps/front/src/components/results/FacetBreakdown.tsx` | Replaced by DetailZone facet detail cards |
| `apps/front/src/components/EvidencePanel.tsx` | Replaced by inline DetailZone |

**Important:** Check if `TraitBar.tsx` exists as a standalone component. If `FacetBreakdown.tsx` does not exist as a separate file, the functionality is inline in `TraitScoresSection` and will be replaced entirely.

### Previous Story Learnings (Stories 8.1-8.4)

- **Story 8.1:** Archetype descriptions expanded to 1500-2500 characters. Data lives in `packages/domain/src/constants/archetypes.ts` as `CURATED_ARCHETYPES`.
- **Story 8.2:** Trait descriptions with taglines and H/M/L level descriptions in `packages/domain/src/constants/trait-descriptions.ts`. Uses trait-specific level letters (P/G/O for openness, etc.).
- **Story 8.3:** Facet descriptions with 2-level system (not 3) in `packages/domain/src/constants/facet-descriptions.ts`. Uses `getFacetLevel()` from `packages/domain/src/utils/facet-level.ts`.
- **Story 8.4:** PersonalPortrait component at `apps/front/src/components/results/PersonalPortrait.tsx`. Currently renders as blockquote with accent bar. `personalDescription` stored as plain text in DB (not JSON yet).

### Git Intelligence (Recent Commits)

```
cced8f9 chore: update sprint
754c79b feat(story-8-4): pre-generate personalized portrait at free tier message threshold (#55)
9225a7c chore: update sprint
c775c7f feat(story-8-3): add level-specific facet descriptions with high/medium/low variants (#54)
dc3a49a feat(story-8-2): add level-specific trait descriptions with high/medium/low variants (#53)
7ca8581 feat(story-8-1): expand archetype descriptions to 1500-2500 characters (#52)
```

All Epic 8 stories (8.1-8.4) are merged to master. This story builds on all of them.

### Project Structure Notes

- Components follow `apps/front/src/components/results/*.tsx` pattern
- OCEAN shapes in `apps/front/src/components/ocean-shapes/*.tsx`
- Hooks in `apps/front/src/hooks/use-*.ts`
- Routes in `apps/front/src/routes/`
- Domain utilities exported from `@workspace/domain`
- shadcn components in `apps/front/src/components/ui/` (generated by CLI)
- Follow FRONTEND.md conventions: `data-slot` attributes, Tailwind utilities, `cn()` merging

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.6]
- [Source: _bmad-output/planning-artifacts/result-page-ux-design/profile-mockup-7-detail-zone.html — reference mockup]
- [Source: apps/front/src/components/results/ProfileView.tsx — current layout structure]
- [Source: apps/front/src/components/results/ArchetypeHeroSection.tsx — hero with description at line 82-84]
- [Source: apps/front/src/components/results/TraitScoresSection.tsx — current trait display with OCEAN shapes, trait colors, facet descriptions]
- [Source: apps/front/src/components/results/PersonalPortrait.tsx — current blockquote portrait]
- [Source: apps/front/src/components/results/ShareProfileSection.tsx — current share UI]
- [Source: apps/front/src/routes/results/$assessmentSessionId.tsx — route state management, evidence panel, expanded traits]
- [Source: apps/front/src/hooks/use-assessment.ts — useGetResults hook]
- [Source: apps/front/src/hooks/use-evidence.ts — useFacetEvidence hook]
- [Source: packages/contracts/src/http/groups/assessment.ts — GetResultsResponseSchema]
- [Source: apps/api/src/use-cases/get-results.use-case.ts — GetResultsOutput, message count logic]
- [Source: packages/domain/src/constants/trait-descriptions.ts — TRAIT_DESCRIPTIONS]
- [Source: packages/domain/src/constants/facet-descriptions.ts — FACET_DESCRIPTIONS]
- [Source: packages/domain/src/constants/archetypes.ts — CURATED_ARCHETYPES]
- [Source: docs/FRONTEND.md — data-slot conventions, styling patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6) — initial implementation
Claude Opus 4 (claude-opus-4-6) — BMAD code review + auto-fix

### Debug Log References

N/A

### Completion Notes List

- Initial implementation created all new components (AboutArchetypeCard, PersonalityRadarChart, ConfidenceRingCard, TraitCard, DetailZone, QuickActionsCard) and wired them into ProfileView and the results route.
- Code review identified 5 HIGH issues: ProfileView retained depth-zone layout instead of CSS Grid (H3), AboutArchetypeCard never wired into component tree (H4), detail zone placed after ALL trait cards instead of row-based insertion (H5), empty Dev Agent Record (H1), all tasks unchecked (H2).
- Code review identified 4 MEDIUM issues: dead code not cleaned (M1), public profile crash risk from `onToggleTrait!` non-null assertion (M2), missing tests for 3 components (M3), ShareProfileSection title said "archetype" not "OCEAN code" (M4).
- Auto-fix rewrote ProfileView.tsx to use single CSS Grid with row-based detail zone insertion (ROW_1_TRAITS/ROW_2_TRAITS pattern).
- Auto-fix deleted dead code: TraitScoresSection.tsx, FacetBreakdown.tsx + test + stories, EvidencePanel.tsx.
- Auto-fix created unit tests for AboutArchetypeCard, ConfidenceRingCard, QuickActionsCard.
- Auto-fix added ResizeObserver polyfill to ConfidenceRingCard test (Recharts jsdom requirement).
- Auto-fix updated trait-descriptions test (tagline length threshold 80→200 to match expanded descriptions from Story 8.2).
- Auto-fix changed ArchetypeHeroSection aria-label to title attribute (Biome a11y lint compliance).
- Auto-fix formatted OceanCodeStrand.tsx (Biome format compliance).
- PersonalPortrait uses markdown section parsing (## headings) rather than JSON format — tasks 5.4/5.5/5.7 remain unchecked as current implementation uses markdown fallback path which works correctly with existing data.
- ~~Task 12.2 (TraitBar.tsx) unchecked — TraitBar is still used by TraitCard, not deprecated.~~ CORRECTED: TraitBar was not used by TraitCard or any component. Removed.
- **2026-02-17:** Removed AboutArchetypeCard per user request — deleted component + test, removed from ProfileView grid. The `description` prop remains on ProfileView since OceanCodeStrand still uses it.
- **2026-02-17:** Added confidence mini ring to TraitCard (Proposition B from UX mockup). 18px SVG circular arc in trait color shows `trait.confidence` as percentage. Removed score percentage display (`{score/120}%`) to avoid confusion with confidence percentage — score now shown only as `{score} /120`. Score bar opacity dims to 0.5 when confidence < 40%. Updated TraitCard tests accordingly. HTML mockup at `_bmad-output/mockups/trait-card-confidence-mockup.html`.
- **2026-02-17:** Removed TraitBar.tsx per user request — deleted component, test, and stories files. TraitBar was dead code: not imported by any component (previous note claiming TraitCard used it was incorrect). Task 12.2 completed.
- **2026-02-17:** ShareProfileSection — reintegrated link URL display on mobile. Since the link row is on its own line, removed `hidden sm:inline` from URL text, removed `sm:` prefix from card container styles (border/bg/padding), and showed icon + "Copy" text on all breakpoints instead of icon-only on mobile.

### File List

**Created:**
- `apps/front/src/components/results/PersonalityRadarChart.tsx`
- `apps/front/src/components/results/PersonalityRadarChart.test.tsx`
- `apps/front/src/components/results/ConfidenceRingCard.tsx`
- `apps/front/src/components/results/ConfidenceRingCard.test.tsx`
- `apps/front/src/components/results/TraitCard.tsx`
- `apps/front/src/components/results/TraitCard.test.tsx`
- `apps/front/src/components/results/DetailZone.tsx`
- `apps/front/src/components/results/DetailZone.test.tsx`
- `apps/front/src/components/results/QuickActionsCard.tsx`
- `apps/front/src/components/results/QuickActionsCard.test.tsx`
- `apps/front/src/components/results/useTraitEvidence.ts`
- `packages/ui/src/components/tooltip.tsx`
- `packages/ui/src/components/chart.tsx`
- `packages/ui/src/components/switch.tsx`

**Modified:**
- `apps/front/src/components/results/ProfileView.tsx` — restructured from depth-zones to CSS Grid layout
- `apps/front/src/components/results/ArchetypeHeroSection.tsx` — archetype-first hero, OCEAN code secondary
- `apps/front/src/components/results/OceanCodeStrand.tsx` — added tooltip shapes, formatted
- `apps/front/src/components/results/PersonalPortrait.tsx` — redesigned with rainbow bar, markdown sections
- `apps/front/src/components/results/ShareProfileSection.tsx` — title "Share your OCEAN code", Switch toggle
- `apps/front/src/routes/results/$assessmentSessionId.tsx` — selectedTrait state, DetailZone wiring
- `apps/front/src/routes/__root.tsx` — TooltipProvider wrapper
- `packages/domain/src/constants/trait-descriptions.ts` — expanded taglines
- `packages/domain/src/__tests__/trait-descriptions.test.ts` — updated tagline length threshold
- `packages/ui/src/styles/globals.css` — design tokens
- `packages/ui/src/components/button.tsx` — action variant

**Deleted:**
- `apps/front/src/components/results/TraitScoresSection.tsx`
- `apps/front/src/components/results/FacetBreakdown.tsx`
- `apps/front/src/components/results/FacetBreakdown.test.tsx`
- `apps/front/src/components/results/FacetBreakdown.stories.tsx`
- `apps/front/src/components/EvidencePanel.tsx`
- `apps/front/src/components/results/AboutArchetypeCard.tsx`
- `apps/front/src/components/results/AboutArchetypeCard.test.tsx`
- `apps/front/src/components/results/TraitBar.tsx`
- `apps/front/src/components/results/TraitBar.test.tsx`
- `apps/front/src/components/results/TraitBar.stories.tsx`
