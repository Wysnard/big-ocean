# Story 7.7: Results Page Visual Redesign with Archetype Theming

Status: ready-for-dev

<!-- Depends on: Story 7.4 (token migration provides the base), Story 7.1 (theme tokens), Story 7.3 (trait colors), Story 7.5 (depth zone + wave divider patterns) -->

## Story

As a **User viewing my assessment results**,
I want **the results page to feel immersive, personal, and themed around my unique archetype color — with the same ocean depth zones, wave dividers, and visual richness as the home page**,
So that **seeing my results feels like a celebration of self-discovery, not a clinical data readout**.

## Context

After Story 7.4 migrates hard-coded colors to semantic tokens, the results page will be functionally themed but still visually flat. This story adds the **immersive visual layer**:
- Depth zone backgrounds (shallows → mid → deep) matching the home page
- Wave dividers between zones
- Archetype-color theming that makes each user's results page feel unique
- Gradient overlays tinted with the user's archetype color

This directly implements the UX spec's guidance: *"Each archetype gets a BOLD, vibrant primary color. Color permeates the entire experience for that archetype type."* and *"Results page uses archetype color as hero (bold background, not white minimal)."*

## Acceptance Criteria

1. **Given** I view my results page **When** the page renders **Then** the background uses depth zone tokens (`--depth-shallows` → `--depth-mid` → `--depth-deep`) matching the home page's ocean depth progression.

2. **Given** I view my results page **When** I scroll between sections **Then** WaveDivider components separate the depth zones with smooth ocean wave transitions (same component as home page).

3. **Given** I view my results page **When** my archetype has a color **Then** the hero area (ArchetypeCard) has a radial gradient glow tinted with my archetype color, creating a personalized visual identity.

4. **Given** I view my results page **When** depth zone backgrounds render **Then** the top depth zone (shallows) has a subtle archetype-color tint overlaid, making the page feel unique to my archetype.

5. **Given** I view my results page **When** I see CTA buttons (Share, Continue) **Then** the primary CTA uses my archetype color (not generic ocean gradient), reinforcing the personal theme.

6. **Given** I compare my results page with a friend's **When** we have different archetypes **Then** our pages look distinctly different due to the archetype-color theming (different glow, different tint, different CTA color).

7. **Given** I view the results page in light or dark mode **When** the theme switches **Then** the archetype-color theming works correctly in both modes (depth zones adapt, glow remains visible).

8. **Given** I view the results page on mobile **When** the layout adapts **Then** wave dividers, depth zones, and archetype theming remain intact and performant.

## Tasks / Subtasks

- [ ] **Task 1: Add depth zone layout to results pages** (AC: 1, 7, 8)
  - [ ] Restructure both results routes (`results.tsx`, `results/$sessionId.tsx`) to use depth zone sections:
    - Shallows zone: Archetype card + low-confidence banner
    - Mid zone: Trait scores + facet breakdowns
    - Deep zone: Share profile + action buttons
  - [ ] Apply `style={{ backgroundColor: 'var(--depth-shallows|mid|deep)' }}` to each section
  - [ ] Verify light and dark mode depth zone rendering

- [ ] **Task 2: Add WaveDivider components between zones** (AC: 2, 8)
  - [ ] Import and place `WaveDivider` from `../components/home/WaveDivider` between each zone
  - [ ] Configure `fromColor` and `className` props matching the adjacent depth zones
  - [ ] Use `variant="gentle"` for subtle transitions
  - [ ] Verify mobile rendering (no horizontal scroll, correct aspect ratio)

- [ ] **Task 3: Implement archetype-color hero glow** (AC: 3, 6, 7)
  - [ ] Add a radial gradient overlay behind/around the ArchetypeCard using the `color` prop:
    ```tsx
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${data.archetypeColor}30 0%, ${data.archetypeColor}10 40%, transparent 70%)`
      }}
    />
    ```
  - [ ] Ensure glow is visible but not overpowering in both light and dark modes
  - [ ] Test with various archetype colors (purples, greens, oranges, reds, blues)

- [ ] **Task 4: Add archetype-color tint to depth zones** (AC: 4, 6, 7)
  - [ ] Apply a subtle archetype-color linear gradient overlay on the shallows zone:
    ```tsx
    style={{
      backgroundColor: 'var(--depth-shallows)',
      backgroundImage: `linear-gradient(180deg, ${archetypeColor}08 0%, transparent 40%)`
    }}
    ```
  - [ ] Tint should be barely noticeable but contribute to the unique feel
  - [ ] Verify tint doesn't interfere with text readability

- [ ] **Task 5: Archetype-colored CTAs** (AC: 5, 6)
  - [ ] Primary CTA (Share My Archetype, Start New Assessment) uses archetype color:
    ```tsx
    <Button style={{ backgroundColor: archetypeColor }} className="text-white">
    ```
  - [ ] Secondary CTAs (Continue Chat, Back) remain `bg-secondary text-secondary-foreground`
  - [ ] Ensure contrast ratio meets WCAG AA (4.5:1) for text on archetype color

- [ ] **Task 6: Enhance ArchetypeCard accent bar** (AC: 3)
  - [ ] Increase accent bar height from `h-1.5` to `h-2`
  - [ ] Ensure full opacity for curated and non-curated archetypes

- [ ] **Task 7: Testing and verification** (AC: 1-8)
  - [ ] Manual verification in light mode
  - [ ] Manual verification in dark mode
  - [ ] Mobile responsive testing
  - [ ] Test with multiple archetype colors
  - [ ] Verify existing tests still pass (`pnpm test:run`)
  - [ ] Run lint check (`pnpm lint`)
  - [ ] Build frontend (`pnpm build --filter=front`)

## Dev Notes

### Developer Context

- **Prerequisite:** Story 7.4 must complete its token migration (Task 3) first. This story builds on top of that semantic-token foundation.
- **Reusable patterns:** `WaveDivider` component and `Bubbles` component already exist in `apps/front/src/components/home/`. Depth zone CSS variables already exist in `globals.css`.
- **Archetype color source:** The `data.archetypeColor` field is returned from the get-results API endpoint. It's a CSS color string (e.g., `oklch(0.65 0.18 290)`).

### Key Files

**Modify:**
- `apps/front/src/routes/results.tsx` — Depth zones, wave dividers, archetype theming
- `apps/front/src/routes/results/$sessionId.tsx` — Depth zones, wave dividers, archetype theming
- `apps/front/src/components/results/ArchetypeCard.tsx` — Glow overlay, accent bar enhancement

**Reuse (import from):**
- `apps/front/src/components/home/WaveDivider.tsx` — Existing wave divider component
- `packages/ui/src/styles/globals.css` — Depth zone tokens (`--depth-shallows`, `--depth-mid`, `--depth-deep`)

### Design Principles

From UX Design Spec:
- *"Results page uses archetype color as hero (bold background, not white minimal)"*
- *"Each archetype gets a BOLD, vibrant primary color"*
- *"Color permeates the entire experience for that archetype type"*
- *"Results presentation is celebratory (not clinical)"*
- *"Visual hierarchy supports emotional journey"*

### Architecture Compliance

- Frontend-only changes; no backend/API/domain changes
- Uses existing components and CSS variables
- Follows `docs/FRONTEND.md` conventions for `data-slot` and semantic tokens
- No new dependencies required

### Sprint Change Proposal

See: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-12.md` for the full change analysis that led to this story.

## References

- `_bmad-output/planning-artifacts/ux-design-specification.md` — Archetype color guidelines, results page design principles
- `_bmad-output/planning-artifacts/epic-7-ui-theming.md` — Epic 7 overview, theme system design
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-12.md` — Change proposal with detailed before/after mapping
- `apps/front/src/routes/index.tsx` — Home page reference for depth zones + wave dividers pattern
- `apps/front/src/components/home/WaveDivider.tsx` — Reusable wave divider component
- `packages/ui/src/styles/globals.css` — Theme tokens, depth zones, trait colors
