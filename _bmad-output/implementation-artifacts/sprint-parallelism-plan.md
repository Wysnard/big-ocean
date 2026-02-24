# Sprint Parallelism Plan
Generated: 2026-02-25

## Step 1: Results Experience + Waitlist (Core User-Facing Features)
| Story | Mode | Notes |
|-------|------|-------|
| 12-1-results-page-and-trait-display | parallel | No dependencies on other remaining stories; Epic 11 (finalization) is done |
| 15-3-waitlist-and-circuit-breaker | parallel | No dependencies on other remaining stories; Redis infra exists from Epic 10 |

**Gate:** All stories above must be done before proceeding.

## Step 2: Evidence Highlighting + Teaser Portrait
| Story | Mode | Notes |
|-------|------|-------|
| 12-2-bidirectional-evidence-highlighting | parallel | Depends on 12-1 (results page must exist) |
| 12-3-teaser-portrait-generation-and-display | parallel | Depends on 12-1 (results page layout); shares portraits table with Epic 13 (already done) |

**Gate:** All stories above must be done before proceeding.

## Step 3: Archetype Library + Relationship Credits
| Story | Mode | Notes |
|-------|------|-------|
| 8-8-complete-archetype-library | parallel | Content-only story; can land anytime after archetype system exists (Epic 11 done) |
| 14-1-relationship-credits-and-purchase-flow | parallel | Depends on Epic 13 (purchase_events schema — done); extends Polar checkout |

**Gate:** All stories above must be done before proceeding.

## Step 4: Invitation System
| Story | Mode | Notes |
|-------|------|-------|
| 14-2-invitation-system | parallel | Depends on 14-1 (credits exist) |

**Gate:** All stories above must be done before proceeding.

## Step 5: Invitee Flow + Relationship Analysis
| Story | Mode | Notes |
|-------|------|-------|
| 14-3-invitee-assessment-flow | sequential(after: 14-2) | Depends on invitation links existing |
| 14-4-relationship-analysis-generation | sequential(after: 14-3) | Depends on invitee having completed assessment |

**Gate:** All stories above must be done before proceeding.

## Step 6: Paid Portrait Regeneration (Deferred — Requires Tier Infrastructure)
| Story | Mode | Notes |
|-------|------|-------|
| 8-5-regenerate-personalized-portrait-paid-tier | parallel | Deferred — requires tier infrastructure from Epic 13 purchase events + extended conversation unlock |

**Gate:** All stories above must be done before proceeding.

## Step 7: Privacy & Compliance (Phase 2 — EU Launch)
| Story | Mode | Notes |
|-------|------|-------|
| 6-1-server-side-encryption-at-rest-and-tls-in-transit | parallel | Cross-cutting; all data models must be stable first |
| 6-2-gdpr-compliance-data-deletion-portability | parallel | Depends on all data tables existing |
| 6-3-audit-logging-and-access-control | parallel | Depends on all access patterns being defined |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **Step 1**: No shared file conflicts — 12-1 is frontend results page, 15-3 is backend Redis/waitlist
- **Step 2**: 12-2 and 12-3 both modify the results page but different sections (evidence panel vs portrait card) — can merge independently
- **Step 3**: 8-8 is domain constants only, 14-1 extends purchase_events — no conflicts
- **Steps 4-5**: Sequential within Epic 14 due to data dependencies (credits → invitations → invitee → analysis)
- **Step 6**: Blocked by tier infrastructure decision — may be re-scoped
- **Step 7**: EU launch gate — all core features must be stable before adding encryption/GDPR layer
