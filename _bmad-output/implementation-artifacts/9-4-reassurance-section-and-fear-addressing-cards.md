# Story 9.4: Reassurance Section & Fear-Addressing Cards

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a cold visitor with concerns about the 30-minute commitment,
I want my fears addressed before I sign up,
so that I feel confident the experience is worth my time.

**Epic:** 9 — Homepage Conversion  
**Dependencies:** Stories 9.1–9.3 are **done**. This story replaces the **shell** in `HomepageReassurancePlaceholder` with the full **“Before you start”** reassurance experience. It does **not** change `DepthScrollProvider`, phase config, or the sticky auth panel layout.

## Acceptance Criteria

**AC1 — Three fear-themed cards (copy from epics)**  
**Given** the visitor scrolls past the three product phases (Conversation, Portrait, World After)  
**When** the reassurance section renders  
**Then** exactly **three** cards appear under a clear **“Before you start”** heading  
**And** each card’s primary message maps to:  
1. **Process anxiety** — *“It’s a conversation, not a quiz”*  
2. **Time commitment** — *“30 minutes that surprise you”*  
3. **Self-exposure** — *“Everything Nerin writes comes from a place of understanding”*

**AC2 — Concrete evidence per card**  
**Given** each card from AC1  
**When** the visitor reads it  
**Then** each card includes **concrete evidence**, not generic marketing:  
- Card 1: a **conversation preview** (short static excerpt or micro-chat strip in Nerin voice — consistent with Phase 1 styling cues, no API)  
- Card 2: a **testimonial/stat** (e.g. time or experience framing — static copy)  
- Card 3: a **portrait-tone example** (short warm line that reads like portrait output, not a feature list)

**AC3 — Placement and positioning**  
**Given** the homepage timeline  
**When** the visitor compares order of sections  
**Then** reassurance content appears **after** product proof (phases 1–3), **not** before  
**And** the section does not duplicate the role of earlier phases (it answers objections, it does not re-show full artifacts).

**AC4 — No monetization on homepage**  
**Given** the public homepage `/`  
**When** scanning all visible copy in the timeline (including reassurance)  
**Then** the homepage does **not** mention **subscription**, **pricing**, or **payment** anywhere in this story’s new copy  
**Note:** Sticky panel tagline from Story 9.1 may already say “Free” / “No credit card” — **do not add** additional subscription, pricing, or payment language in reassurance cards. If UX doc §16.14 table conflicts (e.g. “paywall”, “credit card” in cards), **follow `epics.md` AC4**, not the older UX table.

**AC5 — Motion and accessibility**  
**Given** UX §16.7 / §16.14 guidance on reassurance  
**When** cards enter the viewport  
**Then** motion is **intentionally calm**: simple opacity fade (optionally stagger ~100ms between cards)  
**And** **no** spring physics or aggressive slide-ins  
**And** `prefers-reduced-motion: reduce` removes or minimizes stagger (align with `ArchetypeCarousel` / `HomepageDynamicHook` patterns: instant or minimal animation).

**AC6 — Scroll-linked hook compatibility**  
**Given** `data-homepage-phase="reassurance"` and `DepthScrollProvider`  
**When** the reassurance section is in view  
**Then** the sticky hook still resolves to the **YOURS.** / reassurance phase per `homepage-phase-config.ts`  
**And** `id={getHomepagePhaseConfig("reassurance").sectionId}` and `data-homepage-phase="reassurance"` remain on the **outer `<section>`** (same contract as placeholder).

## Tasks / Subtasks

- [x] **Task 1 — Component structure (AC1, AC3, AC6)**  
  - [x] Implement `ReassuranceCards` (name may vary; keep under `apps/front/src/components/home/`) with heading “Before you start” and three child cards.  
  - [x] Replace or refactor `HomepageReassurancePlaceholder` so the timeline imports the real section (either rename to `HomepageReassuranceSection` and update `HomepageTimeline.tsx`, or keep filename and export — **preserve clear git history**).  
  - [x] Preserve `id`, `data-homepage-phase`, and section layout hooks used by scroll system; do **not** introduce gaps between `[data-homepage-phase]` sections.

- [x] **Task 2 — Card content & evidence (AC2)**  
  - [x] Author final static copy for headlines + evidence blocks (Nerin voice, need-positioning).  
  - [x] Card 1: embed a minimal **conversation preview** UI (can reuse bubble styles from `HomepageConversationPreview` patterns).  
  - [x] Card 2: **testimonial/stat** — static.  
  - [x] Card 3: **portrait-tone** snippet — letter-like or warm body text.  

- [x] **Task 3 — Visual design (AC3, AC5)**  
  - [x] Layout: three columns on desktop, stack on mobile; calm neutral surface (white / `slate-50` / dark mode equivalents) consistent with placeholder background.  
  - [x] Implement fade-in + stagger via `motion` with reduced-motion branch.  

- [x] **Task 4 — Monetization guard (AC4)**  
  - [x] Copy-review pass: no subscription, pricing, or payment terms in new reassurance strings.  

- [x] **Task 5 — Tests**  
  - [x] Unit/component tests: three cards present, headings/evidence text, `data-homepage-phase="reassurance"` still discoverable, reduced-motion behavior if animation is conditional.  
  - [x] Update `HomepageTimeline.test.tsx` if assertions referenced placeholder-only copy.  
  - [x] Do **not** add `*.test.tsx` under `apps/front/src/routes/` (TanStack Router).  

- [x] **Task 6 — Cleanup**  
  - [x] Remove `sr-only` “ships in a later release” stub from the placeholder once real content ships.  
  - [x] Keep or migrate `data-testid="homepage-reassurance-placeholder"` per project rule: **never remove/rename** `data-testid` used by tests — prefer keeping on wrapper or updating tests in the same change.

### Review Findings

- [x] [Review][Patch] Use a strict reduced-motion check for transition timing — `useReducedMotion()` can be `null` before the preference is known; coalescing with `reduceMotion ? …` treats `null` like “animate.” Prefer `reduceMotion === true` (or an explicit null-safe helper) when setting `duration` / `delay` to zero. [`apps/front/src/components/home/ReassuranceCards.tsx:37-51`] **Resolved:** `prefersReducedMotion = reduceMotion === true` drives `duration` / `delay`.
- [x] [Review][Defer] Component/file name `HomepageReassurancePlaceholder` no longer matches content (full section). Optional follow-up: rename to `HomepageReassuranceSection` and update imports — deferred, not blocking ACs. [`apps/front/src/components/home/HomepageReassurancePlaceholder.tsx`]

## Dev Notes

### Technical requirements

- **Static content only** — no `HttpApiClient`, no new API routes (homepage remains SSR-friendly static marketing).  
- **Stack:** React 19, TanStack Start, Tailwind v4, `motion` v12 — match existing homepage components.  
- **Navigation:** No internal links required for AC; if you add anchors, use TanStack Router `<Link>` per `CLAUDE.md`.  
- **Forms:** Not in scope.

### Architecture compliance

- **Hexagonal / front boundary:** Presentation-only in `apps/front`; no domain or API changes.  
- **Scroll architecture:** `DepthScrollProvider` resolves phases via `[data-homepage-phase]`; section **ids** come from `getHomepagePhaseConfig` — see `apps/front/src/components/home/homepage-phase-config.ts`.  
- **Design system:** Prefer `@workspace/ui` primitives (Card, typography) if they fit; otherwise local Tailwind consistent with `HomepageWorldAfterPreview` / placeholder.

### File structure requirements

| Area | Files |
|------|--------|
| Integration | `apps/front/src/components/home/HomepageTimeline.tsx` |
| Current shell | `apps/front/src/components/home/HomepageReassurancePlaceholder.tsx` (refactor or replace) |
| New | `apps/front/src/components/home/ReassuranceCards.tsx` (or equivalent) |
| Tests | Colocated `*.test.tsx` next to components; update `HomepageTimeline.test.tsx` |

### Testing requirements

- Vitest + Testing Library; patterns from `HomepageTimeline.test.tsx`, `ArchetypeCarousel.test.tsx`.  
- If using `useReducedMotion` from `motion/react`, mirror carousel tests (stub when needed).  
- E2E: not required for this story unless product asks — keep suite fast per `CLAUDE.md`.

### Previous story intelligence (9.3)

- `HomepageReassurancePlaceholder` is the **intentional shell**; 9.3 deliberately avoided full reassurance content so 9.4 could own copy and evidence.  
- Phase **bleeds** live **inside** phase sections — do not add DOM gaps between phases (regression risk for `DepthScrollProvider`).  
- `HomepageTimeline` composes: `HomepageConversationPreview` → `HomepagePortraitPreview` → `HomepageWorldAfterPreview` → reassurance.  
- Valid **OCEAN codes** and carousel patterns were fixed in 9.3 — reassurance cards should not reintroduce invalid codes if you show OCEAN snippets.

### UX vs epics reconciliation

- **`epics.md` Story 9.4** is the **acceptance source** for the three fears and AC4.  
- **`ux-design-specification.md` §16.14** “Reassurance Section” table lists different fears (e.g. “Is it really free?”). That table predates the stricter **no subscription/pricing/payment** AC — implement **epics**, and pull **tone** (still, fade, calm) from UX.

### Git intelligence (recent homepage work)

- Recent commits touched `apps/front/src/components/home/` for timeline artifacts and layout. Follow established Tailwind and component decomposition from 9.3 (`HomepageWorldAfterPreview`, etc.).

### Latest tech notes

- **motion v12:** Use `motion.div` with opacity transitions; respect `useReducedMotion()` for stagger/disable.  
- No new npm dependencies expected.

### Project context reference

- No `project-context.md` in repo — rely on `CLAUDE.md`, `docs/FRONTEND.md`, and this file.

## References

- Epic: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.4  
- Prior story: `_bmad-output/implementation-artifacts/9-3-timeline-phases-product-artifacts.md`  
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` — §16 (split layout, hook, reassurance calm motion)  
- Phase config: `apps/front/src/components/home/homepage-phase-config.ts`  
- Route: `apps/front/src/routes/index.tsx`  
- `CLAUDE.md`, `docs/FRONTEND.md`

## Dev Agent Record

### Agent Model Used

GPT-5.4 (Cursor agent)

### Debug Log References

- `pnpm --filter front exec vitest run src/components/home/HomepageReassurancePlaceholder.test.tsx src/components/home/HomepageTimeline.test.tsx`
- `pnpm --filter front test`
- `pnpm --filter front typecheck`
- `pnpm --filter front check` *(fails on pre-existing unrelated diagnostics in other front-end files; changed homepage files pass targeted Biome check)*
- `pnpm --filter front exec biome check src/components/home/HomepageReassurancePlaceholder.tsx src/components/home/ReassuranceCards.tsx src/components/home/HomepageReassurancePlaceholder.test.tsx src/components/home/HomepageTimeline.test.tsx`

### Completion Notes List

- Replaced the reassurance shell with a real "Before you start" section while preserving the outer `data-homepage-phase="reassurance"` section and `homepage-phase-reassurance` id for `DepthScrollProvider`.
- Added `ReassuranceCards` with three evidence-backed cards covering process anxiety, time commitment, and self-exposure using static homepage-safe copy only.
- Implemented calm `motion` fade-ins with a reduced-motion branch that removes stagger and duration.
- Added a dedicated reassurance component test and updated `HomepageTimeline.test.tsx` to mock `motion/react` so homepage tests stay stable in jsdom.
- Validation: `pnpm --filter front test` passed (81 files, 584 tests); `pnpm --filter front typecheck` passed; targeted Biome check for changed homepage files passed.
- Repository-wide `pnpm --filter front check` still reports pre-existing unrelated diagnostics outside this story's changed files.
- Code review (2026-04-16): applied strict `useReducedMotion` check (`prefersReducedMotion === true`) in `ReassuranceCards` for transition `duration` / `delay`.

### File List

- `apps/front/src/components/home/HomepageReassurancePlaceholder.tsx`
- `apps/front/src/components/home/ReassuranceCards.tsx`
- `apps/front/src/components/home/HomepageReassurancePlaceholder.test.tsx`
- `apps/front/src/components/home/HomepageTimeline.test.tsx`
- `_bmad-output/implementation-artifacts/9-4-reassurance-section-and-fear-addressing-cards.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-16: Implemented the homepage reassurance section with three fear-addressing cards, reduced-motion-safe fades, and component coverage for the new section.
- 2026-04-16: Code review patch — `useReducedMotion` handled with `prefersReducedMotion = reduceMotion === true` in `ReassuranceCards` transition timing.

## Story completion status

- **Status:** `done`  
- **Checklist:** Validate against `.claude/skills/bmad-create-story/checklist.md` before `dev-story` if desired.
