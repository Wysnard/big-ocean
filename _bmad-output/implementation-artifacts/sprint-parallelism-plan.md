# Sprint Parallelism Plan
Generated: 2026-03-21 (refreshed — Step 5 complete, Step 6 unlocked)

> Phase 7: Product Completeness & Launch Readiness
> Source: epics.md (9 epics, 41 stories incl. sub-stories)
> Only forward-looking stories included — all prior phases complete.
> Steps 1-5 complete (23 stories merged). Step 6 unlocked.
>
> Conservative parallelism: stories sharing a page, route, or domain area
> are placed in separate steps even when technically independent.

## Step 1: COMPLETE (2026-03-18)
All 5 stories merged: 32-0b, 32-0, 32-3, 31-7, 32-7.

## Step 2: COMPLETE (2026-03-19)
All 6 stories merged: 30-1, 31-1, 31-7b, 32-1, 32-7b, 37-1.

## Step 3: COMPLETE (2026-03-19)
All 4 stories merged: 31-2 (PR #156), 32-2 (PR #157), 31-4 (PR #154), 37-2 (PR #155).

## Step 4: COMPLETE (2026-03-21)
All 4 stories merged: 30-2 (PR #161), 31-3 (PR #158), 31-5 (PR #160), 32-4 (PR #159).

## Step 5: COMPLETE (2026-03-21)
All 4 stories merged: 32-5 (PR #162), 33-1 (PR #163), 32-6 (PR #164), 31-6 (PR #165).

## Step 6: Credits, QR Infra, Extension, OG Tags
| Story | Mode | Notes |
|-------|------|-------|
| 32-8-basic-share-and-credit-system | parallel | After 32-3. Credit derivation + share action on results |
| 34-1-qr-token-infrastructure | parallel | After 32-3. New table: relationship_qr_tokens |
| 36-1-conversation-extension-purchase-and-session-creation | parallel | After 32-3. Extension checkout + session creation |
| 33-2-og-meta-tags-and-social-preview | parallel | After 33-1 + 32-7. OG image serving |

**Gate:** All stories above must be done before proceeding.

## Step 7: Share Flow, QR Drawer, Extension Pipeline, Check-in Email
| Story | Mode | Notes |
|-------|------|-------|
| 33-3-share-flow-and-visibility-toggle | parallel | After 33-1. Share action + public toggle prompt |
| 34-2-qr-drawer-ui | parallel | After 34-1. QR code rendering + status polling |
| 36-2-extended-conversation-pipeline-initialization | parallel | After 36-1. Pipeline init from prior session state |
| 38-1-nerin-check-in-email | parallel | After 31-7. Scheduled email + Nerin voice |

**Gate:** All stories above must be done before proceeding.

## Step 8: Relationship CTA, QR Accept, Extension Results, Recapture Email
| Story | Mode | Notes |
|-------|------|-------|
| 33-4-relationship-analysis-cta-on-public-profile | parallel | After 33-1. CTA on public profile page |
| 34-3-qr-accept-screen-and-consent-gate | parallel | After 34-2. Accept/refuse flow, credit consumption |
| 36-3-extended-results-and-portrait-versioning | parallel | After 36-2. Combined evidence scoring + versioning |
| 38-2-deferred-portrait-recapture-email | parallel | After 31-7 + 32-3. Portrait recapture email |

**Gate:** All stories above must be done before proceeding.

## Step 9: Ritual + Relationship Analysis Generation
| Story | Mode | Notes |
|-------|------|-------|
| 35-1-ritual-suggestion-screen | parallel | After 34-3. Frontend ritual screen |
| 35-2-relationship-analysis-generation | parallel | After 34-3. Sonnet agent, backend generation daemon |

**Gate:** All stories above must be done before proceeding.

## Step 10: Relationship Analysis Display, Versioning & Notification
| Story | Mode | Notes |
|-------|------|-------|
| 35-3-relationship-analysis-display | parallel | After 35-2. Reuses spine renderer from 32-5 |
| 35-4-version-management-and-cascade-deletion | parallel | After 35-2 + 30-2. Derive-at-read versioning |
| 35-5-relationship-analysis-email-notification | parallel | After 35-2 + 31-7. Email on analysis ready |

**Gate:** All stories above must be done before proceeding.

## Step 11: Dashboard (Final Integration)
| Story | Mode | Notes |
|-------|------|-------|
| 38-3-dashboard | — | After 32-1, 32-5, 35-3. Aggregates all product surfaces |

**Gate:** Phase 7 complete.

## Deferred Work (not scheduled)
| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **11 steps** — Steps 1-5 complete (23 merged), Step 6 unlocked
- **16 stories remaining** (Steps 6-11)
- **Critical path:** 34-1 (Step 6) → 34-2 (Step 7) → 34-3 (Step 8) → 35-2 (Step 9) → 35-3 (Step 10) → 38-3 (Step 11)
- **Key enablers:** Polar (32-3, done), Email Infrastructure (31-7, done), Public Profile (33-1, done), Portrait (32-5, done)
- **No shared-file conflicts within any step** — stories in the same step touch different pages/domains
- **Next action:** Begin Step 6 — 4 parallel stories: 32-8 (credits), 34-1 (QR infra), 36-1 (extension), 33-2 (OG tags)
