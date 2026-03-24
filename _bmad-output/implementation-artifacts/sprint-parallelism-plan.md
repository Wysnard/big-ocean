# Sprint Parallelism Plan
Generated: 2026-03-24

> Phase 7: Product Completeness & Launch Readiness (continued)
> Steps 1-11 complete. Step 12 updated with homepage redesign stories (brainstorming 2026-03-23).
> Epic 39 (Hieroglyph) complete.

## Steps 1-10: COMPLETE (2026-03-22)
41 stories merged across 10 steps.

## Step 11: COMPLETE (2026-03-23)
38-3-dashboard: done

## Step 12: Readiness Review + Homepage Narrative Restructure
| Story | Mode | Notes |
|-------|------|-------|
| 30-3-email-verification-gate | parallel | Epic 30 — Better Auth config + /verify-email route + resend flow. Auth/frontend scope. Status: pr-ready. |
| 31-8-extraction-pipeline-and-evidence-processing | parallel | Epic 31 — ConversAnalyzer v2 dual extraction, three-tier retry. Backend pipeline scope. Status: pr-ready. |
| 37-3-homepage-narrative-restructure-and-hero-redesign | parallel | Epic 37 — Compress 14→8 beats, new hero (FR59-FR61), portrait at 33% (FR62), Nerin depth preview (FR63), PWYW (FR65). Homepage frontend only. |

**Notes:** All three stories are fully independent — auth/frontend, backend pipeline, and homepage respectively. No shared files. 30-3 and 31-8 are pr-ready so will merge first; 37-3 is the larger effort.

**Gate:** All stories must be done before proceeding to Step 13.

## Step 13: Homepage Conversion Polish
| Story | Mode | Notes |
|-------|------|-------|
| 37-4-how-it-works-archetype-gallery-and-conversion-flow | — | Epic 37 — HowItWorks section (FR64), ArchetypeGalleryPreview, final CTA, mobile sticky bar. Depends on 37-3 (shares homepage route, needs compressed narrative). |

**Notes:** Single story — no parallelism needed. Depends on 37-3 completing first (page structure must be in place).

**Gate:** Story must be done before Phase 7 is complete.

## Deferred Work (not scheduled)
| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **13 steps** — Steps 1-11 complete, Step 12 unlocked, Step 13 follows
- **4 stories remaining** (Step 12: 30-3 + 31-8 + 37-3, Step 13: 37-4)
- **Critical path:** 37-3 → 37-4 (homepage restructure before conversion polish). 30-3/31-8 are pr-ready and will merge quickly.
- **Next action:** Merge 30-3 and 31-8 PRs, create story file for 37-3, then implement all three in parallel
