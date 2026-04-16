# Story 9.3: Timeline Phases — Product Artifacts

Status: done

## Story

As a cold visitor,
I want to see real product artifacts as I scroll,
so that I understand what I will get without reading descriptions.

**Epic:** 9 — Homepage Conversion  
**Dependencies:** Stories 9.1 (split layout, `DepthScrollProvider`, `HomepageTimeline` shell, `data-homepage-phase` sections) and 9.2 (phase-aware hook, scroll thresholds) are **done**. This story upgrades the **left-column timeline content** to match the epic and UX product-artifact requirements.

## Acceptance Criteria

**AC1 — Phase 1 (Conversation): pattern observation on dark ground**  
**Given** the visitor scrolls the left timeline **When** Phase 1 (Conversation) is visible **Then** a real-feeling Nerin conversation excerpt renders on a **dark** background that echoes the chat UI **And** the exchange includes a **pattern-observation** moment (Nerin connecting what the user said), not only generic chat.

**AC2 — Phase 2 (Portrait): letter-format portrait paragraph**  
**Given** Phase 2 (Portrait) is visible **When** the visitor reads it **Then** a **realistic portrait paragraph** appears in **letter / reading** format (warm, papery background, serif-forward treatment per UX-DR4) **And** it reads as output of the conversation, not marketing copy.

**AC3 — Phase 3 (World After): four named artifact surfaces**  
**Given** Phase 3 (World After) is visible **When** the visitor inspects it **Then** all of the following appear as **dedicated UI compositions** (static marketing previews unless otherwise noted):

1. **TodayScreenMockup** — device-framed or card-framed “Today” surface showing week mood dots and/or check-in/journal cues (recognizably the product’s Today world).
2. **Weekly letter preview** — a **read-only preview** styled like the Sunday weekly letter (dated snippet, Nerin voice); **not** the live `WeeklyLetterCard` from `/today` (that component expects `WeekGridResponse` and auth-backed data). Epic calls this a **preview** artifact.
3. **RelationshipLetterFragment** — two first names + short paragraph about relational dynamic (static sample).
4. **ArchetypeCarousel** — horizontal swipe through **4–6** archetype-style cards (name, OCEAN code, optional one-line descriptor, `GeometricSignature` or existing visual patterns).

**AC4 — Distinct visual languages**  
**Given** the visitor moves through phases 1–3 **When** they compare backgrounds and typography **Then** each phase has a **clearly distinct** visual language: **dark / conversational** (phase 1), **warm / papery / letter** (phase 2), **fresh / app-UI** (phase 3) per UX-DR1 and §16.5 of the UX spec.

**AC5 — Subtle phase boundaries**  
**Given** the visitor scrolls between phases **When** one phase gives way to the next **Then** the transition reads as a **gradual shift** (color/texture/typography), **not** a hard cut — align with existing section stacks and optional gradient buffers; avoid harsh horizontal rules that read as “new page.”

## Out of scope (explicit)

- **Story 9.4** owns the **“Before you start”** reassurance cards, concrete evidence blocks, and the **final** copy/structure for fear-addressing content. Do **not** implement 9.4’s three-card spec inside this story.
- The timeline includes a `**reassurance`** `<section>` with `data-homepage-phase="reassurance"` so `DepthScrollProvider` and `HomepageDynamicHook` can reach the **YOURS.** phase. **Preserve** the section id and `data-homepage-phase` for scroll/hook continuity; **replace heavy placeholder reassurance body** with a minimal shell (or single neutral line) until 9.4, or coordinate a tiny `HomepageReassurancePlaceholder` component so 9.4 swaps content only.

## Tasks / Subtasks

- **Task 1 — Phase 1 conversation excerpt (AC1)**  
  - Refine or replace inline markup in `HomepageTimeline` conversation section so Nerin’s messages read as **pattern observation** (still static copy — no API).  
  - Keep `data-homepage-phase="conversation"` and `id` from `getHomepagePhaseConfig("conversation").sectionId`.  
  - Preserve/improve dark chat-adjacent styling (`slate-950`, bubbles, legibility).
- **Task 2 — Phase 2 portrait letter block (AC2)**  
  - Ensure portrait block uses **letter** framing (warm gradient/parchment, serif body, generous line-height).  
  - Optionally extract `HomepagePortraitPreview` for clarity and tests.
- **Task 3 — Phase 3 composed artifacts (AC3)**  
  - Add `TodayScreenMockup` (homepage-local, e.g. `apps/front/src/components/home/TodayScreenMockup.tsx`).  
  - Add **static** `HomepageWeeklyLetterPreview` (do not wire `WeeklyLetterCard` to real APIs on `/`).  
  - Add `RelationshipLetterFragment` (static names + paragraph).  
  - Add `ArchetypeCarousel`: 4–6 cards, horizontal swipe (`motion` drag or accessible scroll-snap + buttons per UX §16.7); **hardcoded** archetype samples. Reuse or adapt patterns from `apps/front/src/components/results/ArchetypeCard.tsx` / `GeometricSignature` from `@workspace/ui` as appropriate.
- **Task 4 — Visual polish & boundaries (AC4, AC5)**  
  - Tune phase backgrounds and spacing so transitions **soften** at section edges (extra vertical rhythm, shared gradient stops, or `scroll-smooth` adjacent sections — avoid new scroll systems that fight `DepthScrollProvider`).  
  - Respect `**prefers-reduced-motion`** for any new motion (carousel snap, entrance animations): prefer `useReducedMotion()` from `motion/react` where you add Motion behavior.
- **Task 5 — Reassurance shell vs 9.4**  
  - Trim or isolate reassurance **content** so 9.4 can drop in the three evidence-backed cards without duplicating work.
- **Task 6 — Tests**  
  - Component tests for new pieces (carousel snap count, static copy presence, `data-homepage-phase` still on sections).  
  - Do **not** add `*.test.tsx` directly under `apps/front/src/routes/` (TanStack Router). Use `-` prefix or `__tests__/` per `CLAUDE.md`.

### Review Findings

- [Review][Patch] Phase bridges create non-phase gaps that can flip the sticky hook to the wrong phase — **Resolved:** removed standalone `HomepagePhaseBridge` nodes; soft gradients live inside each `data-homepage-phase` section so `DepthScrollProvider` never hits a non-phase gap.
- [Review][Patch] Reassurance phase now renders as an effectively blank final section — **Resolved:** `HomepageReassurancePlaceholder` shows a visible “Before you start” label plus one neutral line; full cards remain Story 9.4.
- [Review][Patch] World-to-reassurance bridge uses light-only colors and creates a bright seam in dark mode — **Resolved:** removed external bridge; in-section `homepage-timeline-bleed-world-to-reassurance` uses `dark:` gradient stops aligned with adjacent sections.
- [Review][Patch] Archetype carousel hardcodes invalid `OceanCode5` samples — **Resolved:** samples are now schema-valid codes (`OCEAR`, `OCBAV`, `TFIDR`, `MCBAN`, `TFSEN`).
- [Review][Patch] Reduced-motion carousel behavior is implemented but untested — **Resolved:** `ArchetypeCarousel.test.tsx` asserts `scrollBy` uses `behavior: "auto"` when `useReducedMotion()` is true (jsdom `scrollBy` stubbed on `HTMLElement.prototype`).
- [Review][Patch] Story 9.3 review diff includes an unrelated sprint-status change for Story 8.3 — **Resolved / verified:** keep sprint tracking accurate per current repo state; do not bundle unrelated epic status bumps with future 9.x PRs.

## Dev Notes

### Current codebase reality (important)

- `apps/front/src/components/home/HomepageTimeline.tsx` **already implements** a full-height four-section timeline (conversation, portrait, worldAfter, reassurance) with **placeholder-level** world-after content (three generic cards) and **early reassurance copy** that overlaps **Story 9.4**. Treat the file as the **integration point**; refactor into smaller components as needed.
- `DepthScrollProvider` resolves phase from `[data-homepage-phase]` sections and viewport midpoint — **do not remove** those attributes or section ids from `homepage-phase-config.ts`.
- `TimelinePlaceholder.tsx` is **legacy** (tests / old split layout); live route uses `HomepageTimeline` from `routes/index.tsx`.
- **Product vs earlier UX doc:** `_bmad-output/planning-artifacts/ux-design-specification.md` §16.4 places **archetype carousel in Phase 2 (Portrait)** in one table; **epics.md Story 9.3** places **ArchetypeCarousel in Phase 3 (World After)**. For implementation, **follow epics.md (this story)** unless product explicitly reconciles — document any deliberate alignment with UX in a short comment near the carousel.

### Architecture and repo rules

- **Frontend:** TanStack Start, React 19, Tailwind v4, `motion` v12 — see `CLAUDE.md` and `docs/FRONTEND.md`.
- **Navigation:** TanStack Router `<Link>` with required `search` for typed routes; homepage artifacts are static — no `HttpApiClient` unless you add a future API (not required).
- **Forms:** Not central to this story; do not change auth flows.
- `**data-testid`:** Never remove or rename existing ids used by e2e; new stable ids for carousel/mockups are encouraged.

### File structure (expected touchpoints)


| Area                         | Files                                                                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integration                  | `apps/front/src/components/home/HomepageTimeline.tsx`                                                                                                                                                |
| New homepage-only components | `apps/front/src/components/home/TodayScreenMockup.tsx`, `RelationshipLetterFragment.tsx`, `HomepageWeeklyLetterPreview.tsx`, `ArchetypeCarousel.tsx` (names may vary; keep under `components/home/`) |
| Reuse                        | `packages/ui` — `GeometricSignature` or patterns from `ArchetypeCard`                                                                                                                                |
| Styles                       | Tailwind in components; optional `apps/front/src/styles.css` for shared keyframes                                                                                                                    |
| Tests                        | Colocated `*.test.tsx` next to components                                                                                                                                                            |


### Testing expectations

- Vitest + Testing Library, same patterns as `HomepageDynamicHook.test.tsx`.  
- Test reduced-motion behavior if carousel or entrances use Motion.  
- Keep tests fast; no new Playwright scope unless explicitly requested later.

### Performance / SSR

- Static hardcoded content — no blocking data loads; keep LCP-friendly (avoid huge images; prefer CSS + light SVG).

## References

- Epic: `_bmad-output/planning-artifacts/epics.md` — Epic 9, Story 9.3  
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` — §16 (Homepage), especially §16.4–16.7 (artifacts, carousel)  
- UX-DR3 – UX-DR5 in `epics.md` (design requirements index)  
- Prior epic stories: `_bmad-output/implementation-artifacts/9-1-split-layout-architecture-and-sticky-auth-panel.md`, `9-2-dynamic-hook-with-animated-gradient.md`  
- Route: `apps/front/src/routes/index.tsx`  
- Phase config: `apps/front/src/components/home/homepage-phase-config.ts`  
- `CLAUDE.md`, `docs/FRONTEND.md`

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- `pnpm --filter front exec tsc --noEmit`
- `pnpm --filter front test`
- `pnpm exec biome check --write` (new homepage components only)

### Completion Notes List

- Split `HomepageTimeline` into phase components: `HomepageConversationPreview` (pattern-observation beat + dark chat styling), `HomepagePortraitPreview`, `HomepageWorldAfterPreview` (Today mockup, static weekly letter preview, relationship fragment, `ArchetypeCarousel` with five cards and `GeometricSignature`), and `HomepageReassurancePlaceholder` (minimal shell for Story 9.4).
- Soft phase boundaries (AC5): in-section gradient bleeds at the bottom of conversation, portrait, and world-after — no DOM gaps between `[data-homepage-phase]` sections (fixes scroll-linked hook stability with `DepthScrollProvider`).
- Archetype carousel: scroll-snap horizontal track + prev/next controls; `useReducedMotion` adjusts scroll behavior for carousel navigation; samples use valid `OceanCode5` values.
- Code review follow-up: reassurance placeholder visible copy; carousel reduced-motion test; removed `HomepagePhaseBridge.tsx`.
- Tests: `HomepageTimeline.test.tsx`, `ArchetypeCarousel.test.tsx`.

### File List

- `apps/front/src/components/home/HomepageTimeline.tsx`
- `apps/front/src/components/home/HomepageConversationPreview.tsx`
- `apps/front/src/components/home/HomepagePortraitPreview.tsx`
- `apps/front/src/components/home/HomepageWorldAfterPreview.tsx`
- `apps/front/src/components/home/HomepageReassurancePlaceholder.tsx`
- `apps/front/src/components/home/TodayScreenMockup.tsx`
- `apps/front/src/components/home/HomepageWeeklyLetterPreview.tsx`
- `apps/front/src/components/home/RelationshipLetterFragment.tsx`
- `apps/front/src/components/home/ArchetypeCarousel.tsx`
- `apps/front/src/components/home/HomepageTimeline.test.tsx`
- `apps/front/src/components/home/ArchetypeCarousel.test.tsx`
- `_bmad-output/implementation-artifacts/9-3-timeline-phases-product-artifacts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-16: Implemented Story 9.3 homepage timeline product artifacts, phase bridges, reassurance placeholder shell, and component tests; marked story ready for code review.
- 2026-04-16: Code review patches — in-section phase bleeds (no hook dead-zones), valid OCEAN carousel codes, visible reassurance shell stub, reduced-motion carousel test, removed `HomepagePhaseBridge.tsx`; story marked done.