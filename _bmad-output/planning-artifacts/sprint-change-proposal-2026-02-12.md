# Sprint Change Proposal: Results Page Theme Alignment

**Date:** 2026-02-12
**Author:** Vincentlay (via Correct Course workflow)
**Scope Classification:** Minor
**Recommended Route:** Story 7.4 (Polish Component Visual Consistency)

---

## 1. Issue Summary

### Problem Statement

The Results pages (`/results` and `/results/$sessionId`) and their child components (`ArchetypeCard`, `TraitBar`, `FacetBreakdown`) remain visually stuck in a dark-only, hard-coded slate/gray/blue design from pre-Epic 7 development.

With Epic 7 stories completed:
- **7.1** (Ocean Brand Color Theme) — `review`
- **7.3** (Big Five Trait & Facet Visualization Colors) — `review`
- **7.5** (Home Page Redesign with Theme System) — `review`

...the Results page is the **last major surface** that breaks visual consistency with the rest of the application.

### Discovery Context

Identified during Epic 7 implementation review. The home page now uses semantic tokens, depth zones, and ocean gradients. The results page — the most important post-assessment page — still uses hard-coded colors that:
- Force dark mode only (`className="dark"`)
- Use raw Tailwind colors (`slate-*`, `gray-*`, `blue-*`, `amber-*`)
- Bypass the theme system entirely (`bg-gradient-to-r from-blue-500 to-purple-500`)
- Ignore trait/facet color tokens from Story 7.3

### Evidence

- **50+ instances** of hard-coded color classes across 5 files
- **Zero usage** of semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`)
- **Zero usage** of trait gradient tokens (`--gradient-trait-*`)
- Both results routes force `className="dark"` on root containers
- CTA buttons use `bg-gradient-to-r from-blue-500 to-purple-500` instead of `bg-[image:var(--gradient-ocean)]`

---

## 2. Impact Analysis

### Epic Impact

| Epic | Status | Impact |
|------|--------|--------|
| Epic 7 (UI Theme & Visual Polish) | `in-progress` | **Direct** — Change fits within Story 7.4 scope |
| Epic 5 (Results & Profile Sharing) | `done` | **None** — No logic changes, visual-only |
| All other epics | Various | **None** — No dependencies affected |

No new epics needed. No epics invalidated. No resequencing required.

### Story Impact

| Story | Status | Impact |
|-------|--------|--------|
| 7.4 (Polish Component Visual Consistency) | `ready-for-dev` | **Primary target** — This IS the story for this work |
| 5.1, 5.2, 5.3 (Results stories) | `done` | **None** — Logic unchanged, visual-only migration |

### Artifact Conflicts

| Artifact | Conflict? | Notes |
|----------|-----------|-------|
| PRD | None | Aligns with "polished, memorable visual experience" goal |
| Architecture | None | No backend, contract, or infrastructure changes |
| UX Design Spec | **Alignment** | UX spec mandates "Results page uses trait colors via semantic variables" and "Bold Visual Richness Over Clinical Minimalism" |
| Deployment | None | No deployment changes needed |
| CI/CD | None | Existing lint/type-check covers CSS class changes |

### Technical Impact

- **Frontend only** — CSS class replacements across component files
- **No backend changes** — API responses unchanged
- **No contract changes** — HTTP types unchanged
- **No new dependencies** — All theme tokens already exist in `globals.css`
- **No migration** — Browser cache naturally refreshes CSS

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Modify existing components within Story 7.4 scope to replace hard-coded color classes with semantic theme tokens.

### Rationale

- **All infrastructure is ready:** Theme tokens (7.1), trait colors (7.3), and design patterns (7.5) are all implemented
- **Low risk:** Visual-only changes, no business logic affected
- **Low effort:** Systematic find-and-replace of color classes
- **High impact:** Results page is the most important user-facing page after assessment completion
- **Effort estimate:** Low-Medium
- **Risk level:** Low

### Trade-offs Considered

| Option | Effort | Risk | Decision |
|--------|--------|------|----------|
| Direct Adjustment (replace classes) | Low-Medium | Low | **Selected** |
| Redesign results page from scratch | High | Medium | Rejected — current layout is functional |
| Defer to Phase 2 | None | None | Rejected — results page is MVP-critical |

---

## 4. Detailed Change Proposals

### Change 1: `results/$sessionId.tsx` — Semantic page and component tokens

**File:** `apps/front/src/routes/results/$sessionId.tsx`

**Current Issues:**
- Forces `className="dark"` on containers
- Uses `bg-slate-800`, `bg-slate-700`, `text-white`, `text-slate-*` throughout
- `bg-slate-700` link buttons instead of semantic variants

**Proposed Changes:**
- Remove `className="dark"` forcing (inherit from ThemeProvider)
- Page background: Use **depth zone tokens** for immersive ocean feel:
  - Top section (archetype card): `style={{ backgroundColor: 'var(--depth-mid)' }}`
  - Trait scores section: `style={{ backgroundColor: 'var(--depth-deep)' }}`
  - This creates the same "diving deeper" effect as the home page scroll zones
- Replace `text-white` → `text-foreground`
- Replace `text-slate-400`, `text-gray-400` → `text-muted-foreground`
- Replace `bg-slate-800/50 border-slate-700` → `bg-card border-border`
- Replace `bg-slate-700` links → use semantic `bg-secondary text-secondary-foreground`
- Replace `bg-gradient-to-r from-blue-500 to-purple-500` → `bg-primary text-primary-foreground`

---

### Change 2: `results.tsx` (query-param route) — Same semantic migration

**File:** `apps/front/src/routes/results.tsx`

**Current Issues:**
- Same hard-coded dark theme pattern as `$sessionId.tsx`
- CTA buttons use `bg-gradient-to-r from-blue-500 to-purple-500`
- Share section uses `bg-slate-900/50`, `text-blue-400`, `border-slate-600`
- Archetype header uses hard-coded `bg-blue-500/20`, `text-blue-400`

**Proposed Changes:**
- Remove `className="dark"` from all containers
- Page background: Use **depth zone tokens** for progressive ocean depth:
  - Hero/archetype area: `style={{ backgroundColor: 'var(--depth-shallows)' }}` — the archetype reveal is a surfacing moment
  - Trait scores section: `style={{ backgroundColor: 'var(--depth-mid)' }}` — diving into your traits
  - Share/actions area: `style={{ backgroundColor: 'var(--depth-deep)' }}` — deepest section
  - This mirrors the home page's scroll-based depth zone pattern, creating visual continuity between pages
- All text: `text-foreground` / `text-muted-foreground`
- Cards: `bg-card border-border`
- CTA buttons: `bg-primary text-primary-foreground` or `bg-[image:var(--gradient-ocean)]`
- Archetype icon: Use `bg-primary/20 text-primary` instead of `bg-blue-500/20 text-blue-400`
- Share section: semantic tokens throughout
- Visibility toggle: semantic tokens with `text-accent` for public state

---

### Change 3: `ArchetypeCard.tsx` — Semantic card styling

**File:** `apps/front/src/components/results/ArchetypeCard.tsx`

**Current Issues:**
- `border-slate-700/50 bg-slate-800/80`
- `text-white` for name, `text-slate-200`, `text-slate-300`, `text-slate-400` for various text
- `bg-slate-700/*` for code badges, confidence indicator, curated badge

**Proposed Changes:**
- Container: `border-border bg-card` (or `bg-card/80` for translucency)
- Archetype name: `text-foreground` (auto light/dark)
- OCEAN codes: `bg-muted text-muted-foreground` for badge, `text-muted-foreground` for secondary
- Confidence indicator: `bg-muted text-foreground`
- Description: `text-muted-foreground`
- Curated badge: `bg-secondary text-secondary-foreground`

---

### Change 4: `TraitBar.tsx` — Semantic styling preserving trait colors

**File:** `apps/front/src/components/results/TraitBar.tsx`

**Current Issues:**
- `border-slate-700/50 bg-slate-800/60` container
- `hover:bg-slate-800/80` hover state
- `text-white` for name, `text-slate-400/500` for secondary text
- `bg-slate-700/60` track background
- `bg-emerald-900/40 text-emerald-300` / `bg-amber-900/40 text-amber-300` for level badges

**Proposed Changes:**
- Container: `border-border bg-card/60 hover:bg-card/80`
- Name: `text-foreground`
- Secondary text: `text-muted-foreground`
- Track background: `bg-muted`
- Level badges: `bg-secondary text-secondary-foreground` (or subtle tinted variants)
- Preserve: Inline `style={{ backgroundColor: color }}` for trait-colored fills (already correct)

---

### Change 5: `FacetBreakdown.tsx` — Semantic + trait-aware bar colors

**File:** `apps/front/src/components/results/FacetBreakdown.tsx`

**Current Issues:**
- `border-slate-700/50 bg-slate-850/40` container
- `text-slate-300/400/500` for various text
- `bg-amber-400/80` for high-score bars, `bg-slate-500/60` for normal bars
- `text-amber-400` star highlight
- `bg-slate-700/40` track

**Proposed Changes:**
- Container: `border-border bg-card/40`
- Text: `text-foreground` / `text-muted-foreground`
- Score bars: Use parent trait's color variable instead of amber/slate
- Star highlight: `text-accent` instead of `text-amber-400`
- Track: `bg-muted`
- Low confidence: keep `opacity-60` pattern, use `text-destructive` for low confidence %

---

### Change 6: Visual Polish — Wave Dividers Between Depth Zones

**Files:** `apps/front/src/routes/results/$sessionId.tsx`, `apps/front/src/routes/results.tsx`

**Addition:**
- Add `WaveDivider` components between each depth zone section (same pattern as home page)
- Archetype area → WaveDivider → Trait scores → WaveDivider → Share/Actions
- Use `variant="gentle"` for smooth transitions

**Example structure:**
```tsx
<div style={{ backgroundColor: 'var(--depth-shallows)' }}>
  <ArchetypeCard ... />
  <WaveDivider fromColor="var(--depth-shallows)" className="text-(--depth-mid)" variant="gentle" />
</div>
<div style={{ backgroundColor: 'var(--depth-mid)' }}>
  {/* Trait scores */}
  <WaveDivider fromColor="var(--depth-mid)" className="text-(--depth-deep)" variant="gentle" />
</div>
<div style={{ backgroundColor: 'var(--depth-deep)' }}>
  {/* Share/Actions */}
</div>
```

Rationale: This is the exact same visual language the home page uses. Creates seamless depth zones instead of flat sections.

---

### Change 7: Visual Polish — Archetype-Colored Hero Area

**Files:** `apps/front/src/components/results/ArchetypeCard.tsx`, `apps/front/src/routes/results/$sessionId.tsx`, `apps/front/src/routes/results.tsx`

**Core Idea:** Each user's results page is **tinted with their archetype color**, making every result feel unique and personal. The archetype `color` prop (already available from the API) drives the visual identity of the entire page.

**Implementation:**

1. **Archetype hero section** — Use archetype color as radial gradient glow behind the card:
   ```tsx
   {/* Archetype-colored glow behind card */}
   <div
     className="absolute inset-0 pointer-events-none"
     style={{
       background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${archetypeColor}30 0%, ${archetypeColor}10 40%, transparent 70%)`
     }}
   />
   ```

2. **Archetype accent bar** — Already uses `color` prop; increase from `h-1.5` to `h-2` and make full opacity

3. **Depth zone tinting** — Subtly mix archetype color into the depth zone backgrounds:
   ```tsx
   {/* Shallows zone with archetype color tint */}
   <div style={{
     backgroundColor: 'var(--depth-shallows)',
     backgroundImage: `linear-gradient(180deg, ${archetypeColor}08 0%, transparent 40%)`
   }}>
   ```

4. **CTA buttons** — Primary CTA uses archetype color instead of generic ocean gradient:
   ```tsx
   <Button style={{ backgroundColor: archetypeColor }}>Share My Archetype</Button>
   ```

**Rationale:**
- UX spec says "Each archetype gets a BOLD, vibrant primary color" and "Color permeates the entire experience for that archetype type"
- Makes every results page feel personal and unique (not just a generic template)
- Creates emotional connection — "this page is MINE, about ME"
- Archetype color becomes the visual identity marker throughout the page

---

### Change 9: Visual Polish — Ocean Gradient CTAs

**Files:** Both results routes

**Current:** `bg-gradient-to-r from-blue-500 to-purple-500`

**Proposed:** `bg-[image:var(--gradient-ocean)]` or `bg-primary text-primary-foreground`

- Primary CTAs (Start Assessment, Share) use the ocean gradient for visual richness
- Secondary CTAs (Continue Chat, Back) use `bg-secondary text-secondary-foreground`
- This matches the home page's CTA pattern exactly

---

## 5. Implementation Handoff

### Scope Classification: Minor

Direct implementation by development team. No backlog reorganization, no architectural review needed.

### Files to Modify (7 total)

| File | Type | Changes |
|------|------|---------|
| `apps/front/src/routes/results.tsx` | Route | Semantic token migration |
| `apps/front/src/routes/results/$sessionId.tsx` | Route | Semantic token migration |
| `apps/front/src/components/results/ArchetypeCard.tsx` | Component | Semantic card tokens |
| `apps/front/src/components/results/TraitBar.tsx` | Component | Semantic tokens + trait colors |
| `apps/front/src/components/results/FacetBreakdown.tsx` | Component | Semantic tokens + facet colors |
| (optional) `EvidencePanel.tsx` | Component | Review for hard-coded colors |
| (optional) Storybook stories | Stories | Update if visual snapshots exist |

### No New Files Needed

All theme tokens exist in `packages/ui/src/styles/globals.css`. All trait/facet color utilities exist in `packages/domain/src/utils/trait-colors.ts`.

### Dependencies

- Story 7.1 (ocean brand colors) — `review` status (implemented)
- Story 7.3 (trait/facet colors) — `review` status (implemented)

### Success Criteria

**Token Migration:**
1. Results pages render correctly in **both light and dark modes**
2. **Zero hard-coded color classes** remain (`slate-*`, `gray-*`, `blue-*`, `amber-*`, `emerald-*`)
3. All components use semantic tokens (`bg-card`, `text-foreground`, `border-border`, etc.)
4. Trait bars use `--trait-*` colors from the theme system
5. Facet bars use parent trait colors (not amber/slate)

**Visual Polish:**
6. **Depth zone tokens** used for page backgrounds (`--depth-shallows` → `--depth-mid` → `--depth-deep`)
7. **WaveDividers** between depth zone sections (matching home page pattern)
8. **Archetype color theming** — hero glow, accent bar, depth zone tinting, and CTAs all use the user's archetype color
9. Each results page feels **unique and personal** based on the archetype (not a generic template)
10. **Ocean gradient or archetype-colored CTAs** for primary actions

**Integrity:**
11. Visual alignment with home page's ocean brand feel verified in both modes
12. No regressions in existing functionality (evidence panel, sharing, navigation)

### Testing Plan

- [ ] Manual light mode verification
- [ ] Manual dark mode verification
- [ ] Storybook story updates for ArchetypeCard, TraitBar, FacetBreakdown
- [ ] Mobile responsive check
- [ ] Existing test suite passes (no logic changes = no test changes needed)
