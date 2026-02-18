---
title: 'Coherent Card Header Styling for Results Page'
slug: 'results-card-header-coherence'
created: '2026-02-18'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'Tailwind CSS v4', 'shadcn/ui']
files_to_modify:
  - 'apps/front/src/components/results/ShareProfileSection.tsx'
  - 'apps/front/src/components/results/DetailZone.tsx'
  - 'apps/front/src/components/results/TraitCard.tsx'
  - 'apps/front/src/components/results/PersonalPortrait.tsx'
code_patterns:
  - 'CardTitle default: leading-none font-semibold'
  - 'Consistent cards use: text-lg font-display on CardTitle'
  - 'Subtitle pattern: text-sm text-muted-foreground'
  - 'data-slot attribute on all card roots'
test_patterns:
  - 'No unit tests for styling — visual inspection only'
  - 'DetailZone has test file: DetailZone.test.tsx (functional, not styling)'
---

# Tech-Spec: Coherent Card Header Styling for Results Page

**Created:** 2026-02-18

## Overview

### Problem Statement

Each card on the results page uses a different header pattern — mixing font families (`font-display`, `font-heading`, default), sizes (`text-lg`, `text-base`, `text-sm`), and component usage (`CardTitle` vs raw `<h3>` / `<span>`). This creates a visually disjointed experience where the results page lacks a unified design language for card headers.

### Solution

Standardize all card headers on `font-display` as the title font. TraitCard keeps its compact `text-sm` size (intentionally smaller by design). DetailZone and ShareProfileSection get unified to match the `font-display` pattern. Subtitle/description styles are made consistent (`text-sm text-muted-foreground`).

### Scope

**In Scope:**
- Unify ShareProfileSection header to use `font-display` instead of `font-heading`
- Unify DetailZone header to use `font-display` and `text-lg` sizing
- Standardize subtitle/description to `text-sm text-muted-foreground`
- TraitCard gets `font-display` but keeps `text-sm` size

**Out of Scope:**
- TraitCard size change (stays `text-sm` by design)
- Structural refactoring (button vs Card component)
- Accent bar changes
- Layout or spacing changes

## Context for Development

### Codebase Patterns

- **Card component base** (`packages/ui/src/components/card.tsx`):
  - `CardTitle` default className: `leading-none font-semibold`
  - `CardHeader` default: grid layout with `gap-2 px-6`
  - `Card` default: `rounded-xl border py-6 shadow-sm bg-card`
- 4 of 7 cards already use the target pattern (`text-lg font-display` on CardTitle)
- Non-CardTitle components use raw `<h3>` or `<span>` with inline Tailwind classes
- `data-slot` attributes used on all card roots per FRONTEND.md conventions

### Files to Reference

| File | Purpose | Key Lines |
| ---- | ------- | --------- |
| `apps/front/src/components/results/ShareProfileSection.tsx` | **MODIFY** | L38: title `h3`, L39: subtitle `p` |
| `apps/front/src/components/results/DetailZone.tsx` | **MODIFY** | L140: title `h3`, L143: subtitle `p` |
| `apps/front/src/components/results/TraitCard.tsx` | **MODIFY** | L88: title `span` |
| `apps/front/src/components/results/PersonalPortrait.tsx` | **MODIFY** | L121: subtitle `p` |
| `packages/ui/src/components/card.tsx` | Reference | L30-34: CardTitle defaults |

### Technical Decisions

- **`font-display`** is the standard card title font (majority pattern, user-confirmed)
- TraitCard stays `text-sm` (compact by design) — only adds `font-display`
- DetailZone switches from `text-base` to `text-lg` to match other card headers
- ShareProfileSection switches from `font-heading` to `font-display`
- Subtitle standard: `text-sm text-muted-foreground` consistently

## Implementation Plan

### Tasks

- [x] Task 1: Update ShareProfileSection title font
  - File: `apps/front/src/components/results/ShareProfileSection.tsx`
  - Action: Line 38 — change `font-heading text-lg font-semibold text-foreground` to `font-display text-lg font-semibold text-foreground`
  - Notes: Replace `font-heading` → `font-display`. Subtitle on L39 already uses `text-sm text-muted-foreground` — no change needed.

- [x] Task 2: Update DetailZone title font and size
  - File: `apps/front/src/components/results/DetailZone.tsx`
  - Action: Line 140 — change `text-base font-semibold text-foreground` to `text-lg font-display font-semibold text-foreground`
  - Notes: Adds `font-display` and bumps `text-base` → `text-lg` to match other card headers.

- [x] Task 3: Update DetailZone subtitle size
  - File: `apps/front/src/components/results/DetailZone.tsx`
  - Action: Line 143 — change `text-xs text-muted-foreground` to `text-sm text-muted-foreground`
  - Notes: Bumps subtitle from `text-xs` → `text-sm` for consistency with ShareProfileSection subtitle.

- [x] Task 4: Update TraitCard title font
  - File: `apps/front/src/components/results/TraitCard.tsx`
  - Action: Line 88 — change `text-sm font-semibold text-foreground` to `text-sm font-display font-semibold text-foreground`
  - Notes: Adds `font-display` only. Size stays `text-sm` (compact by design).

- [x] Task 5: Update PersonalPortrait subtitle size
  - File: `apps/front/src/components/results/PersonalPortrait.tsx`
  - Action: Line 121 — change `text-xs text-muted-foreground mt-1` to `text-sm text-muted-foreground mt-1`
  - Notes: Bumps subtitle from `text-xs` → `text-sm` for consistency.

### Acceptance Criteria

- [x] AC 1: Given the results page is loaded, when inspecting all card titles, then every title uses the `font-display` font family
- [x] AC 2: Given the results page is loaded, when inspecting full-size card titles (QuickActions, Confidence, Radar, Portrait, ShareProfile, DetailZone), then they all render at `text-lg` size
- [x] AC 3: Given the results page is loaded, when inspecting TraitCard titles, then they render at `text-sm` size with `font-display`
- [x] AC 4: Given the results page is loaded, when inspecting all card subtitles/descriptions (DetailZone, PersonalPortrait, ShareProfileSection), then they all use `text-sm text-muted-foreground`
- [x] AC 5: Given the results page is loaded, when comparing all cards visually, then headers feel cohesive — same font family across all cards, only TraitCard is intentionally smaller

## Additional Context

### Dependencies

None — purely className string changes. No new imports, packages, or structural modifications.

### Testing Strategy

- **Visual inspection only** — no functional behavior changes
- Load `/results/{sessionId}` and verify all card headers use consistent typography
- Check responsive views (mobile, tablet, desktop) to ensure `text-lg` doesn't cause layout issues in DetailZone
- DetailZone.test.tsx tests functional behavior (click, expand/collapse) — no test updates needed

### Notes

**Change summary (4 files, 5 edits):**

| # | File | Line | Old | New |
|---|------|------|-----|-----|
| 1 | ShareProfileSection.tsx | 38 | `font-heading text-lg font-semibold` | `font-display text-lg font-semibold` |
| 2 | DetailZone.tsx | 140 | `text-base font-semibold` | `text-lg font-display font-semibold` |
| 3 | DetailZone.tsx | 143 | `text-xs text-muted-foreground` | `text-sm text-muted-foreground` |
| 4 | TraitCard.tsx | 88 | `text-sm font-semibold` | `text-sm font-display font-semibold` |
| 5 | PersonalPortrait.tsx | 121 | `text-xs text-muted-foreground mt-1` | `text-sm text-muted-foreground mt-1` |
| 6 | globals.css | 84 | *(missing)* | `--font-display: "Space Grotesk", ...` (root definition) |
| 7 | globals.css | 416 | *(missing)* | `--font-display: var(--font-display)` (theme mapping) |

## Review Notes
- Adversarial review completed
- Findings: 3 total, 2 fixed, 1 skipped (F3 low/undecided — DetailZone text-lg overflow risk)
- Resolution approach: auto-fix
- F1 (High/real): Added missing `--font-display` CSS variable to theme — was silently undefined
- F2 (Medium/real): Fixed by F1 — `font-display` now correctly resolves to Space Grotesk
- F3 (Low/undecided): Skipped — DetailZone `text-lg` overflow risk on compact screens is marginal
