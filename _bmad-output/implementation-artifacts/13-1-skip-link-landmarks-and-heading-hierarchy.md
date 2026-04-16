# Story 13.1: Skip-Link, Landmarks & Heading Hierarchy

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. Optional: run validate-create-story before dev-story. -->

## Story

As a keyboard and screen reader user,
I want semantic page structure across all routes,
so that I can navigate efficiently without visual cues.

## Acceptance Criteria

1. **Skip link (first Tab):** On any page, the first Tab focus lands on a “Skip to content” control that is visually hidden until focused, then visible; activating it moves focus to the primary `<main>` content (`#main-content`).

2. **Single primary main:** Every route exposes exactly one document-level main landmark for primary content (the shared `PageMain` / `#main-content` pattern).

3. **Landmarks:** Pages use semantic regions — at minimum `<header>` (app header), `<main>` (primary content), and `<nav>` where navigation is present; use `<section>` for major regions where appropriate (not decorative wrappers).

4. **Heading hierarchy:** Each page has exactly one `<h1>` (either visible or `sr-only` via `PageMain`’s `title` prop). Lower levels are sequential (`h2` → `h3`); no skipped levels (e.g. `h1` → `h3` without `h2`).

5. **Three-space surfaces (`/today`, `/me`, `/circle`):** Each page’s major content blocks use `<section>` (or equivalent) with a distinct `aria-label` so screen reader users can jump between regions (Today / Me / Circle). Align labels with visible structure and avoid duplicate or meaningless names.

## Tasks / Subtasks

- [x] **Audit & fix duplicate or missing `h1` (AC: 2, 4)**  
  - [x] Resolve **two `<h1>`** pattern: `ThreeSpaceLayout` passes `title` to `PageMain` (renders `sr-only` `h1`) while some child trees also render a visible `h1` (e.g. Circle intro). Choose one pattern per page: either remove redundant `title` from `ThreeSpaceLayout` when the page provides a single canonical visible `h1`, or demote inner headings to `h2` and keep one `h1`.  
  - [x] **Knowledge library articles:** `KnowledgeArticleLayout` uses both `PageMain title={title}` and an inner `<h1>` with the same text — remove duplication (prefer one visible `h1` in the article header, adjust `PageMain` accordingly).  
  - [x] Scan other routes listed in Dev Notes for multiple `h1` or missing page-level `h1` (homepage uses hero `h1` inside `PageMain` without `title` — verify no second `h1` in the same main).

- [x] **Landmarks outside `PageMain` (AC: 2, 3)**  
  - [x] **`relationship/$analysisId.tsx`:** Replace nested raw `<main className="space-y-16">` with a non-main wrapper (`<div>` or `<section aria-label="…">`) so only `#main-content` is the document `main`.  
  - [x] Confirm **Header** (`apps/front/src/components/Header.tsx`): single `<header>`; reconcile duplicate `<nav>` elements (`aria-label="Main"` vs `"Primary"`) — merge or disambiguate so landmark lists are not confusing (one primary nav or clearly scoped labels).

- [x] **Three-space `aria-label` on major sections (AC: 5)**  
  - [x] **Today:** Wrap or label major blocks (check-in surface, week/mood areas, error/success paths) with `<section aria-label="…">` consistent with UX copy.  
  - [x] **Me:** `MePageSection` already sets `aria-label` from titles — verify labels are human-meaningful (consider replacing internal names like “Identity Hero” with user-facing wording if they are exposed to assistive tech).  
  - [x] **Circle:** Already has labeled sections in places; ensure the page does not expose two competing top-level headings after `h1` fix.

- [x] **Skip link & focus (AC: 1)**  
  - [x] Verify `SkipToContentLink` + `MAIN_CONTENT_ID` / `PageMain` still match after layout changes; extend `PageMain.test.tsx` or add a small route-level test if a regression-prone area changes.

- [x] **Regression**  
  - [x] Run `pnpm --filter=front test` (and targeted tests for `PageMain`, three-space routes). Do not rename/remove `data-testid` values.

### Senior Developer Review (AI)

**Date:** 2026-04-16  
**Outcome:** Approve  
**Layers:** Blind Hunter (diff-only), Edge Case Hunter (diff + AC), Acceptance Auditor (story AC 1–5). No separate subagent runners; review executed in this session.

### Review Findings

_(Clean review — 0 decision-needed, 0 patch, 0 defer after triage. 1 dismissed: optional DRY for repeated archetype heading `className` across `h1` / `h2` / `h3` branches in `ArchetypeHeroSection.tsx` — cosmetic only.)_

## Dev Notes

### What already exists (do not reinvent)

- **`SkipToContentLink`** and **`PageMain`** (`apps/front/src/components/PageMain.tsx`): `id="main-content"`, `tabIndex={-1}`, skip link with `sr-only focus:not-sr-only`, `data-testid="skip-to-content"`. Root shell renders skip link then `Header` then route outlet (`apps/front/src/routes/__root.tsx`).
- **`ThreeSpaceLayout`:** Composes `PageMain` + `BottomNav` + `ThreeSpacePageContainer`.
- **`BottomNav`:** Two `<nav>` landmarks with labels “Three-space navigation” / “Three-space navigation mobile” (same route — acceptable if one is `hidden` at a time; verify only one is in tab order / accessibility tree as appropriate).
- **Tests:** `PageMain.test.tsx` covers skip link href and click focusing main.

### Architecture & product rules

- **Frontend-only story** — `apps/front` (and shared `packages/ui` only if a primitive must change). No API or schema changes.
- Follow **[FRONTEND.md](docs/FRONTEND.md)** for styling, `data-testid` policy, and route test placement (no `*.test.tsx` in `routes/` without `-` prefix).
- **Navigation:** Use TanStack Router `<Link>` for internal links ([CLAUDE.md](CLAUDE.md)).
- **WCAG target:** Epic 13 aligns with **WCAG 2.1 Level AA**; UX spec section 13.3 maps criteria ([ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md) — Accessibility Strategy).

### Routes to verify (non-exhaustive)

| Area | Files / notes |
|------|----------------|
| Marketing home | `routes/index.tsx` — hero `h1` |
| Auth | `login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `verify-email.tsx` — `PageMain` + form headings |
| Chat | `chat/index.tsx` — `PageMain title="Conversation with Nerin"` vs inner content |
| Results | `results.tsx`, `results/$conversationSessionId.tsx` — multiple branches |
| Library | `library/index.tsx`, `library/*.$slug.tsx`, `KnowledgeArticleLayout.tsx` |
| Settings | `settings.tsx` — explicit `h1` inside `PageMain` without `title` prop (duplicate risk) |
| Relationship | `relationship/$analysisId.tsx` (nested `main`), `relationship/qr/$token.tsx`, ritual route |
| Dev | `/dev/*` — lower priority; keep build green |

### Testing requirements

- Unit: extend **`PageMain.test.tsx`** if skip/main contract changes.
- Prefer **component tests** for heading/landmark structure; **E2E** only if a critical journey requires it (keep suite fast per [E2E-TESTING.md](docs/E2E-TESTING.md)).
- Manual: Tab once → skip link visible; Enter/click → focus in main; VoiceOver/rotor landmarks (macOS) or NVDA landmarks (Windows) on `/today`, `/me`, `/circle`.

### Project structure notes

- Keep **`MAIN_CONTENT_ID`** as the single id for skip targets unless you introduce a breaking rename (would require updating tests and any anchors).
- Prefer **semantic HTML** over ARIA roles when native elements fit.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 13, Story 13.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — section 13.3 Accessibility Strategy]
- [Source: apps/front/src/components/PageMain.tsx — skip link & main]
- [Source: apps/front/src/routes/__root.tsx — shell order]
- [Source: docs/FRONTEND.md — testing & data attributes]

## Change Log

- **2026-04-16:** Implemented skip-link/landmark/heading fixes: removed duplicate `PageMain` titles where a visible `h1` exists (library index, knowledge articles); added `title="Home"` on marketing home; removed nested `<main>` on relationship letter page; disambiguated header nav `aria-label`s; added Today page sections; renamed Me identity section label; `ArchetypeHeroSection` supports `archetypeNameHeadingLevel` for Me page (`h3` under `h2`); Circle keeps a single visible `h1` (no `ThreeSpaceLayout` title). Full `pnpm --filter=front test` passed.

- **2026-04-16:** Code review (BMAD): Approve — clean review; story and sprint status set to `done`.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

— 

### Completion Notes List

- **Heading hierarchy (/me):** Retained `PageMain title="Me"` (sr-only `h1`) and set `archetypeNameHeadingLevel={3}` in `IdentityHeroSection` so order is `h1` (Me) → `h2` (Your identity) → `h3` (archetype name), with no duplicate `h1`/`h2` inversion.
- **Circle:** Dropped `title` from `ThreeSpaceLayout` so the intro block’s visible `h1` is the only top-level heading.
- **Home:** Added `title="Home"` because the current homepage layout has no in-content `h1` (sections use `h2`+), satisfying a single document `h1`.

### File List

- `apps/front/src/components/Header.tsx`
- `apps/front/src/components/library/KnowledgeArticleLayout.tsx`
- `apps/front/src/components/me/IdentityHeroSection.tsx`
- `apps/front/src/components/results/ArchetypeHeroSection.tsx`
- `apps/front/src/components/results/ArchetypeHeroSection.test.tsx`
- `apps/front/src/components/today/TodayCheckInSurface.tsx`
- `apps/front/src/routes/circle/index.tsx`
- `apps/front/src/routes/index.tsx`
- `apps/front/src/routes/library/index.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/relationship/$analysisId.tsx`
- `_bmad-output/implementation-artifacts/13-1-skip-link-landmarks-and-heading-hierarchy.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Story key:** `13-1-skip-link-landmarks-and-heading-hierarchy`  
**Story ID:** 13.1  
**Epic:** 13 — Accessibility Foundations  
**Blocked-by:** none  
**Blocks:** Story 13.2 (conversation/chat a11y builds on document structure)
