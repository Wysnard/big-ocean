---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
documentsIncluded:
  prd: prd.md
  architecture: architecture.md
  epics_main: epics.md
  epics_sharded: epics/ (13 files)
  epics_supplemental:
    - epics-conversation-pipeline.md
    - epics-conversation-pacing.md
    - epics-innovation-strategy.md
    - epics-nerin-steering-format.md
  ux: ux-design-specification.md
  ux_supplemental:
    - architecture-ux-gap-analysis.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-03-18
**Project:** big-ocean

## Step 1: Document Discovery

### Documents Identified

| Document Type | Primary File | Format | Size | Last Modified |
|---|---|---|---|---|
| PRD | prd.md | Whole | 60KB | Mar 18 |
| Architecture | architecture.md | Whole (consolidated) | 93KB | Mar 18 |
| Epics (main) | epics.md | Whole | 23KB | Mar 12 |
| Epics (sharded) | epics/ | Folder (13 files) | — | Various |
| UX Design | ux-design-specification.md | Whole | 263KB | Mar 18 |

### Supplemental Documents Included

- `epics-conversation-pipeline.md` (30KB, Mar 2)
- `epics-conversation-pacing.md` (52KB, Mar 12)
- `epics-innovation-strategy.md` (55KB, Feb 28)
- `epics-nerin-steering-format.md` (15KB, Mar 14)
- `architecture-ux-gap-analysis.md` (9KB, Mar 18)

### Duplicate Resolution

- **Architecture**: `architecture.md` (whole) used as authoritative per CLAUDE.md; `architecture/` sharded folder exists but superseded
- **Epics**: Both `epics.md` and `epics/` folder included — sharded folder provides individual epic detail

### Archived/Excluded

- `prd-2026-02-02-archived.md` — superseded by current PRD
- `ux-design-specification-archived.md` — superseded by current UX spec

## Step 2: PRD Analysis

### Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | Users can have a 25-exchange adaptive conversation with Nerin |
| FR2 | Nerin responds using ocean/marine metaphors and dive master persona |
| FR3 | The pacing pipeline steers Nerin's territory focus, observation type, and entry pressure each turn |
| FR4 | Users can see a depth meter reflecting the conversation's progress |
| FR5 | Users receive progress milestone markers at 25%, 50%, and 75% of the conversation |
| FR6 | Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait |
| FR7 | Nerin frames observations as invitations to explore — acknowledges user pushback, offers an alternative framing, and redirects to a different topic only if the user rejects the observation a second time |
| FR8 | Nerin includes a "this is not therapy" framing in the greeting |
| FR9 | Nerin never uses diagnostic language or characterizes third parties the user mentions |
| FR10 | Users can purchase a conversation extension (+25 exchanges) to continue with Nerin |
| FR11 | Users can resume an abandoned conversation from where they left off |
| FR12 | The conversation ends with a distinct closing exchange from Nerin before transitioning to results |
| FR13 | Nerin transitions between territories using a connecting observation or question that references the prior topic when the pacing pipeline changes territory |
| FR14 | The system extracts facet evidence and energy signals from each user response via the extraction pipeline |
| FR15 | The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time) |
| FR16 | Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the results page |
| FR17 | The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code |
| FR18 | The system presents all archetypes with positive, strength-based framing |
| FR19 | Users can view a dashboard of their results, portrait, and relationship analyses |
| FR20 | The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM |
| FR21 | Users are presented with a PWYW modal showing the founder's story and example portrait after completing the assessment |
| FR22 | Users can view their portrait after payment |
| FR23 | Conversation extension produces an updated portrait that incorporates observations derived from extended evidence not present in the original portrait |
| FR24 | The system tracks behavioral proxies for portrait emotional impact: share rate, conversation extension purchase rate, and return visits within 48 hours |
| FR25 | Conversation extension creates a new assessment session. The pacing pipeline initializes from the prior session's final state and evidence. On completion, new assessment results are generated. The prior portrait and any relationship analyses based on the prior results become "previous version" |
| FR26 | Portrait generation is asynchronous — users are notified when ready |
| FR27 | The system retries portrait generation on failure and informs the user if it ultimately fails |
| FR28 | Users can initiate a relationship analysis by opening a QR drawer; the other person scans the QR code or opens the contained URL |
| FR29 | The system generates a 2-person relationship analysis when both users have completed their assessments |
| FR30 | The QR accept screen shows the initiator's archetype card, both users' confidence rings, and available credit balance, with Accept and Refuse buttons |
| FR31 | Users see a ritual suggestion screen before accessing the relationship analysis |
| FR32 | The relationship analysis describes relational dynamics without blame language and without exposing individual vulnerability data |
| FR33 | Users receive one free relationship analysis credit upon completing their first portrait purchase (PWYW ≥€1). Additional credits cost €5 each |
| FR34 | If one user deletes their account, the shared relationship analysis is deleted |
| FR35 | Each relationship analysis is linked to both users' assessment results. All analyses are preserved as snapshots — the newest is primary, older ones are classified as "previous version." Version detection is derive-at-read |
| FR36 | Users receive an email notification when a relationship analysis they participated in is ready |
| FR37 | The QR accept screen is only accessible to logged-in users with a completed assessment. No pre-account context |
| FR38 | The system tracks relationship analysis credits per user (1 free, additional purchased) |
| FR39 | Users have a public profile page showing their archetype, OCEAN code, trait/facet scores, and the framing line |
| FR40 | Public profiles are default-private; users can explicitly make them public. Binary visibility only |
| FR41 | Public profiles generate dynamic OG meta tags and archetype card images for social preview |
| FR42 | Public profiles are accessible without authentication |
| FR43 | Public profiles include a CTA to start the user's own assessment |
| FR44 | Users can copy a shareable link to their public profile |
| FR45 | When a logged-in user with a completed assessment views another user's public profile, a relationship analysis CTA is displayed |
| FR46 | The system generates archetype card images per archetype (81 cards) — users with the same archetype share the same card visual |
| FR47 | Users can pay for portraits via PWYW with embedded checkout. Default €5, minimum €1 |
| FR48 | Users can purchase relationship analysis credits via embedded checkout |
| FR49 | Users can purchase conversation extensions via embedded checkout |
| FR50 | Users can create an account and authenticate |
| FR51 | Users can control the visibility of their public profile (binary: fully public or fully private) |
| FR52 | Users are informed during onboarding that conversation data is stored |
| FR53 | Users can delete their account, which deletes their data and any shared relationship analyses |
| FR54 | Users are introduced to Nerin and the conversation format before the conversation begins (pre-conversation onboarding) |
| FR55 | The system monitors per-session LLM costs against a budget threshold |
| FR56 | The cost guard never blocks a user mid-session; budget protection applies at session boundaries |
| FR57 | When cost guard triggers, users can retry sending their message |
| FR58 | Users are informed when cost guard triggers and told they can retry |

**Total FRs: 58**

### Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR1 | Performance | Nerin response time <2s P95 |
| NFR2 | Performance | Public profile page LCP <1s |
| NFR3 | Performance | Results page LCP <1.5s |
| NFR4 | Performance | Chat page initial load <2s, subsequent interactions <200ms |
| NFR5 | Performance | Portrait generation completes within 60s (async) |
| NFR6 | Cost | Per-assessment LLM cost stays within ~€0.20 budget |
| NFR7 | Cost | Per-portrait LLM cost stays within ~€0.20 budget |
| NFR8 | Security | All data in transit encrypted via TLS 1.3 |
| NFR9 | Security | Authentication requires 12+ character passwords and compromised credential checks |
| NFR10 | Security | Row-level data access control (users access only own data) |
| NFR11 | Security | Public profiles default to private — zero public discovery without opt-in |
| NFR12 | Security | Conversation transcripts stored indefinitely; retrievable within 2s |
| NFR13 | Security | Relationship analysis does not expose raw transcripts to other party |
| NFR14 | Security | Account deletion cascades to all user data and shared relationship analyses |
| NFR15 | Reliability | Assessment completion without errors >99% |
| NFR16 | Reliability | Portrait generation completes successfully >99% |
| NFR17 | Reliability | Portrait generation retries automatically on failure |
| NFR18 | Reliability | Cost guard never terminates an active session |
| NFR19 | Reliability | Conversation sessions are resumable after browser close or connection loss |
| NFR20 | Accessibility | WCAG 2.1 AA compliance for: public profile, conversation UI, results page, PWYW modal |
| NFR21 | Accessibility | Chat interface keyboard-navigable with proper ARIA labels |
| NFR22 | Accessibility | Score visualizations have text alternatives |
| NFR23 | Accessibility | Ocean theme color palette meets AA contrast ratios |
| NFR24 | Accessibility | Proper focus management in modals |
| NFR25 | Integration | Embedded checkout integration for PWYW, credits, and extensions |
| NFR26 | Integration | LLM provider switchability without code changes |
| NFR27 | Integration | Transactional email delivery (3 types + relationship analysis notifications within 5 min, >95% delivery) |
| NFR28 | Observability | System logs include per-session cost, completion status, and error events |
| NFR29 | Data Consistency | Personality scores always recomputed from current facet evidence at read time |

**Total NFRs: 29**

### Additional Requirements (from Domain-Specific & Innovation sections)

| Category | Requirement |
|---|---|
| Psychological Framing | Nerin's greeting includes natural "this is not therapy" framing (covered by FR8) |
| Psychological Framing | Nerin never uses diagnostic language or characterizes third parties (covered by FR9) |
| Psychological Framing | Permission to disagree — observations are invitations, not declarations |
| Psychological Framing | Portrait framing: patterns and tensions, not conditions |
| Relationship Guardrails | Differences framed as dynamics, not deficits. No blame language |
| Relationship Guardrails | Analysis never exposes individual vulnerability data |
| Relationship Guardrails | Ritual screen reinforces: "describes your dynamic, not who's right or wrong" |
| Archetype Quality | All 81 archetypes must be frameable as a strength (positivity audit) |
| Multi-User Privacy | Binary visibility (fully public or fully private) |
| Multi-User Privacy | Per-relationship consent (accept gate) |
| Multi-User Privacy | Account deletion cascades to shared relationship analyses |
| Multi-User Privacy | Relationship analysis does not expose raw transcripts |
| Data Retention | Transcripts stored indefinitely for MVP (needed for conversation extension) |
| Data Retention | Users informed during onboarding that conversation data is stored |
| Innovation | PWYW with founder vulnerability (founder's own portrait shown) |
| Innovation | 81 hand-curated nature-based archetypes with 3 tribe groups |
| Innovation | OCEAN code uses meaningful semantic letters (not H/M/L) |
| Innovation | 6-layer closed-loop pacing pipeline |
| Web App | Browser support: modern evergreen (latest 2 versions) + mobile Safari/Chrome |
| Web App | Mobile-first for conversation and results pages |
| Web App | SSR for public profiles and landing pages |
| Web App | OG image generation: dynamic archetype card image per user |

### PRD Completeness Assessment

- **FRs are well-structured and numbered** — 58 functional requirements with clear, specific language
- **NFRs cover key categories** — performance, security, reliability, accessibility, integration, observability, data consistency (29 total)
- **Domain-specific requirements are thorough** — psychological framing, multi-user privacy, cost management all covered
- **User journeys are detailed** — 5 journeys with capabilities mapped
- **Risk mitigation** — both execution and innovation risks identified with mitigations
- **Monetization model clear** — PWYW portrait + relationship credits + conversation extension
- **No obvious gaps** — requirements trace well to user journeys and success criteria

## Step 3: Epic Coverage Validation

### Critical Structural Finding

**The PRD (Mar 18) uses FR1-FR58 numbering. ALL epic documents use independent FR numbering schemes.** There is no shared numbering between the PRD and any epic document:

| Epic Document | Own FR Range | Written Against |
|---|---|---|
| `epics/` (sharded, 8 epics) | FR1-FR26 | Original PRD (Jan-Feb 2026) |
| `epics.md` (Conversation Experience Evolution) | FR1-FR18 | Design Thinking Mar 2026 |
| `epics-conversation-pipeline.md` | FR1-FR29 | Pipeline Architecture |
| `epics-conversation-pacing.md` | FR1-FR25 | Pacing Architecture (13 ADRs) |
| `epics-innovation-strategy.md` | FR1-FR63 | Innovation Strategy + old PRD |
| `epics-nerin-steering-format.md` | FR1-FR12 | Steering Format Problem/Solution |

**Root cause:** The PRD was rewritten on Mar 18 with new, consolidated FR numbering. The epic documents were written at different times against earlier PRD versions and feature-specific architectures. **No epic document references the current PRD's FR numbers.**

### Semantic Coverage Matrix

Despite the numbering mismatch, I mapped each current PRD FR to its semantic equivalent across all epic documents:

| PRD FR | Requirement Summary | Epic Coverage (Semantic) | Status |
|---|---|---|---|
| FR1 | 25-exchange conversation with Nerin | epics/ E2 S2.1-2.2, pacing FR1-FR25, pipeline FR1 | ✓ Covered |
| FR2 | Ocean metaphors, dive master persona | epics.md E2 (character evolution), steering FR5 | ✓ Covered |
| FR3 | Pacing pipeline steers each turn | pacing FR1-FR25 (full 6-layer pipeline) | ✓ Covered |
| FR4 | Depth meter | epics/ E4 S4.4, S4.7 | ✓ Covered |
| FR5 | Progress milestones 25%/50%/75% | **Partial** — progress indicator exists (epics/ E4 S4.7) but specific 25/50/75% milestones not explicitly storied | ⚠️ Partial |
| FR6 | Nerin teases portrait during conversation | pacing FR7-FR8 (observation focus), innovation FR36 (teaser) | ✓ Covered |
| FR7 | Observation framing as invitations | epics.md E2 S2.2 (relate > reflect), steering FR4 | ✓ Covered |
| FR8 | "Not therapy" framing in greeting | **Not explicitly storied** — implied by character bible work | ⚠️ Implicit |
| FR9 | No diagnostic language, no third-party characterization | **Not explicitly storied** — implied by character constraints | ⚠️ Implicit |
| FR10 | Conversation extension (+25 exchanges) | innovation FR37 (portrait regen context), **but extension purchase/session mechanics not fully storied** | ⚠️ Partial |
| FR11 | Resume abandoned conversation | epics/ E2 S2.1, E4 S4.3 | ✓ Covered |
| FR12 | Closing exchange from Nerin | pacing FR23 (amplify closing on final turn) | ✓ Covered |
| FR13 | Territory transitions with connecting observation | steering FR2, FR8, FR9 (bridge intent) | ✓ Covered |
| FR14 | Extract facet evidence + energy signals | pacing FR2, FR11 (ConversAnalyzer v2) | ✓ Covered |
| FR15 | Compute scores (derive-at-read) | epics/ E2 S2.3, S2.9 | ✓ Covered |
| FR16 | Results page (OCEAN code, archetype, scores) | epics/ E5 S5.1, E7 S7.9 | ✓ Covered |
| FR17 | 81 hand-curated archetypes | epics/ E3 S3.1-3.2 | ✓ Covered |
| FR18 | Positive, strength-based archetype framing | **Not explicitly storied** — domain requirement, no specific story | ⚠️ Missing |
| FR19 | Dashboard (results, portrait, relationship analyses) | epics/ E7 S7.13 (registered user profile page) | ✓ Covered |
| FR20 | Portrait as personal letter from Nerin | innovation FR36-FR37 (teaser/full portrait) | ✓ Covered |
| FR21 | PWYW modal with founder story + example portrait | innovation FR43 (PWYW checkout) — **but founder story/example portrait not explicitly storied** | ⚠️ Partial |
| FR22 | View portrait after payment | innovation FR37, FR39 | ✓ Covered |
| FR23 | Extension produces updated portrait | innovation context — **but full extension→portrait pipeline not explicitly storied** | ⚠️ Partial |
| FR24 | Behavioral proxy tracking (share rate, return visits) | **NOT FOUND** in any epic | ❌ Missing |
| FR25 | Extension creates new session, prior becomes "previous version" | **NOT FOUND** — extension session mechanics not storied | ❌ Missing |
| FR26 | Portrait generation async, user notified | innovation FR37 (forkDaemon), FR41 (polling) | ✓ Covered |
| FR27 | Portrait retry on failure | innovation FR42 (auto-retry max 3) | ✓ Covered |
| FR28 | QR drawer for relationship analysis | innovation FR50 (invitation), FR60 (InvitationBottomSheet) | ✓ Covered |
| FR29 | 2-person relationship analysis | innovation FR53 | ✓ Covered |
| FR30 | QR accept screen (archetype card, confidence, credits) | innovation FR51 — **but PRD specifies confidence rings + credit balance on accept screen; not detailed in epic** | ⚠️ Partial |
| FR31 | Ritual suggestion screen | innovation FR55 ("read together" nudge) — **but PRD specifies no-skip Start button; not detailed** | ⚠️ Partial |
| FR32 | Relationship analysis framing guardrails | **NOT explicitly storied** — domain requirement only | ⚠️ Implicit |
| FR33 | Free credit on first portrait purchase (PWYW ≥€1) | innovation FR44 (1 free/user lifetime) | ✓ Covered |
| FR34 | Account deletion cascades to relationship analyses | epics/ E6 S6.2 (GDPR deletion) | ✓ Covered |
| FR35 | Relationship analyses as snapshots, derive-at-read versioning | **NOT explicitly storied** — versioning mechanics missing | ❌ Missing |
| FR36 | Email notification for relationship analysis ready | **NOT FOUND** in any epic | ❌ Missing |
| FR37 | QR accept screen requires auth + completed assessment | innovation FR51 (partial — invitee must signup) | ⚠️ Partial |
| FR38 | Track relationship analysis credits per user | innovation FR44-FR46 (derive from purchase_events) | ✓ Covered |
| FR39 | Public profile page | epics/ E5 S5.2, E7 S7.12 | ✓ Covered |
| FR40 | Default-private, binary visibility | epics/ E5 S5.2 (FR15) | ✓ Covered |
| FR41 | Dynamic OG meta tags + archetype card images | innovation FR58-FR59 (archetype card gen), epics/ E7 S7.12 | ✓ Covered |
| FR42 | Public profiles accessible without auth | epics/ E7 S7.12 | ✓ Covered |
| FR43 | CTA on public profile | epics/ E7 S7.12 | ✓ Covered |
| FR44 | Copy shareable link | epics/ E5 S5.2 | ✓ Covered |
| FR45 | Relationship CTA on other users' public profiles | **NOT FOUND** in any epic | ❌ Missing |
| FR46 | 81 archetype card images (generic per archetype) | innovation FR58 (Satori JSX → SVG → PNG) | ✓ Covered |
| FR47 | PWYW embedded checkout | innovation FR43 (Polar embedded checkout) | ✓ Covered |
| FR48 | Relationship credit purchase | innovation FR44 | ✓ Covered |
| FR49 | Conversation extension purchase | **NOT explicitly storied** — Polar.sh covers portrait + credits but extension purchase flow not detailed | ⚠️ Partial |
| FR50 | Account creation + auth | epics/ E1 S1.2 | ✓ Covered |
| FR51 | Profile visibility control | epics/ E5 S5.2 | ✓ Covered |
| FR52 | Onboarding data storage notice | **NOT FOUND** in any epic | ❌ Missing |
| FR53 | Account deletion cascades | epics/ E6 S6.2 | ✓ Covered |
| FR54 | Pre-conversation onboarding (intro to Nerin) | **NOT FOUND** in any epic | ❌ Missing |
| FR55 | Per-session LLM cost monitoring | epics/ E2 S2.5, innovation FR27, FR62 | ✓ Covered |
| FR56 | Cost guard at session boundaries only | innovation FR62 (budget circuit breaker) — **but session-boundary semantics not explicit** | ⚠️ Partial |
| FR57 | User can retry on cost guard trigger | **NOT explicitly storied** | ⚠️ Implicit |
| FR58 | User informed when cost guard triggers | **NOT explicitly storied** | ⚠️ Implicit |

### Missing Requirements

#### Critical Missing FRs (no coverage found)

| FR | Requirement | Impact | Recommendation |
|---|---|---|---|
| **FR24** | Behavioral proxy tracking (share rate, extension purchase rate, return visits within 48h) | Medium — success metrics depend on this | Add to a new "Analytics & Tracking" epic or fold into results/profile epic |
| **FR25** | Conversation extension creates new session; prior portrait/analyses become "previous version" | High — core monetization feature mechanics | Add to innovation/monetization epic as dedicated story |
| **FR35** | Relationship analysis versioning (derive-at-read, newest primary, older = "previous version") | Medium — data model for multi-assessment users | Add to relationship analysis epic |
| **FR36** | Email notification when relationship analysis is ready | Medium — user re-engagement | Add to transactional email epic/story |
| **FR45** | Relationship CTA displayed on other users' public profiles | Medium — growth loop connection | Add to public profile epic (E7 S7.12) |
| **FR52** | Onboarding data storage notice | Low — privacy/legal requirement | Add to onboarding/auth story |
| **FR54** | Pre-conversation onboarding (intro to Nerin + conversation format) | Medium — user preparation before assessment | Add as new story in frontend or UX epic |

#### Partially Covered / Implicit FRs

| FR | Issue | Recommendation |
|---|---|---|
| FR5 | Milestones at 25/50/75% not explicitly storied (progress indicator exists) | Clarify in E4 S4.7 acceptance criteria |
| FR8-FR9 | "Not therapy" framing + diagnostic language constraints are character bible concerns, not storied | Add as acceptance criteria to character bible stories |
| FR10, FR23, FR25 | Conversation extension session mechanics scattered/incomplete | Consolidate into dedicated extension story |
| FR18 | Archetype positivity audit not storied | Add as acceptance criteria to E3 or E8 |
| FR21 | PWYW modal founder story + example portrait specifics not storied | Add detail to innovation PWYW story |
| FR30-FR31 | QR accept screen and ritual screen details differ between PRD and epics | Reconcile acceptance criteria |
| FR49 | Extension purchase via embedded checkout not detailed | Add to Polar.sh payment story |
| FR56-FR58 | Cost guard UX details (retry, notification) implicit | Add acceptance criteria to cost guard story |

### Coverage Statistics

- **Total PRD FRs:** 58
- **FRs fully covered (semantic match):** 37 (64%)
- **FRs partially covered / implicit:** 14 (24%)
- **FRs with NO coverage:** 7 (12%)
- **Effective coverage:** ~88% (fully + partially)

### Structural Assessment

The fundamental issue is **not missing coverage** (most requirements are semantically addressed across the 6 epic documents) but rather **fragmentation and lack of traceability**:

1. **6 independent epic documents** with 6 independent FR numbering schemes, none matching the current PRD
2. **PRD was rewritten Mar 18** — all epics predate the current PRD's numbering
3. **No single epic document covers the full product scope** — each covers a specific feature area
4. **Cross-document tracing requires semantic matching** — no automated traceability possible

**Recommendation:** After PRD stabilization, generate a consolidated FR traceability matrix that maps current PRD FRs to their implementing stories across all epic documents, using PRD FR numbers as the canonical reference.

## Step 4: UX Alignment Assessment

### UX Document Status

**Found:** `ux-design-specification.md` (263KB, Mar 18) — comprehensive UX specification covering:
- Design direction (Section 9): Naturalistic dark luxury with organic shapes
- 5 detailed user journey wireflows (Section 10): First-Timer, Relationship Analysis, Portrait + PWYW, Returning User, Public Profile → Conversion
- Component strategy (Section 11): 20+ custom components with shadcn/ui coverage map
- UX consistency patterns (Section 12): feedback, navigation, modals, empty states, button hierarchy
- Design tokens (Section 8): colors, typography, spacing, radius, animation

**Also found:** `architecture-ux-gap-analysis.md` (9KB, Mar 18) — 11 architectural decisions resolving UX ↔ Architecture gaps, produced same day as UX and PRD updates.

### UX ↔ PRD Alignment

**Well-aligned areas:**
- User journeys in UX map directly to PRD Journey 1-5
- Conversation experience (depth meter, milestones, Nerin persona) consistent between UX and PRD
- PWYW modal, portrait reveal, and relationship flows match PRD specifications
- Public profile (default-private, binary visibility, OG tags) consistent
- Archetype card design and OCEAN semantic letters specified in both

**Alignment issues identified:**

| Area | PRD Says | UX Says | Gap |
|---|---|---|---|
| **Relationship initiation** | FR28: QR drawer | UX S10.2: QR drawer with Bottom Sheet → replaced by QR accept screen per gap analysis | Resolved in gap analysis |
| **Free credit trigger** | FR33: first portrait purchase ≥€1 | UX initially implied signup grant | Resolved in gap analysis (Decision 3) |
| **Conversation extension** | FR25: creates new session, prior = "previous version" | UX S10.4: describes returning user flow | Resolved in gap analysis (Decisions 6, 10) |
| **Ritual screen** | FR31: Start button only, no skip | UX S10.2: ritual with "read together" nudge | Minor — UX uses nudge language vs PRD's mandatory Start. **Needs clarification** |
| **OCEAN code format** | "Meaningful semantic letters" (e.g., OCEAR) | UX specifies full letter mapping per trait level | Aligned |

### UX ↔ Architecture Alignment

**Well-aligned areas:**
- Architecture supports all UX-specified components (hexagonal architecture, Effect-ts, SSR via TanStack Start)
- Performance targets match between UX (responsive interactions) and architecture (Nerin <2s P95, LCP targets)
- Derive-at-read pattern consistently applied across all three documents
- Portrait generation pipeline (teaser sync + full async) aligned with UX reveal flow

**Gaps identified (from gap analysis document):**

| Gap | Status | Resolution |
|---|---|---|
| QR token model vs invitation model | **Resolved** | New `relationship_qr_tokens` table, 5 new endpoints |
| `relationship_analyses` FK structure | **Resolved** | FK to `assessment_results` (not invitations), derive-at-read versioning |
| Email provider selection | **Resolved** | Resend with 3 email types + React Email templates |
| Portrait auto-retry on reconciliation | **Resolved** | Reconciliation logic in results page loader |
| Missing `list-relationship-analyses` endpoint | **Resolved** | New GET endpoint documented |
| Conversation extension session mechanics | **Resolved** | New session with parent linking, combined evidence for portrait |

### Warnings

1. **UX spec is very large (263KB)** — risk that implementation deviates from spec simply because developers don't read the full document. Consider producing a condensed implementation checklist per epic.
2. **UX journey wireflows are text-based** — no visual mockups referenced in the spec (HTML mockups exist in `result-page-ux-design/` folder but cover only the results page). Other flows lack visual reference.
3. **Component strategy lists 20+ custom components** — implementation sequence and dependency chain should be validated against epic ordering.
4. **Ritual screen semantics differ** — PRD says "Start button only, no skip" while UX uses "nudge" language. Clarify whether the ritual is mandatory or skippable.

## Step 5: Epic Quality Review

### Epics Reviewed

6 epic documents were reviewed across the project:

1. **Sharded epics (`epics/`)** — Epics 1-8 (original product scope)
2. **`epics.md`** — Conversation Experience Evolution (2 epics)
3. **`epics-conversation-pacing.md`** — Conversation Pacing Pipeline (7 epics)
4. **`epics-conversation-pipeline.md`** — Pipeline V1 Rewrite (multiple epics)
5. **`epics-innovation-strategy.md`** — Innovation Strategy (multiple epics)
6. **`epics-nerin-steering-format.md`** — Nerin Steering Format (2 epics)

### Critical Violations

#### 1. Epic 1 (epics/) is a Technical Epic with No User Value
**Violation:** Epic 1 "Infrastructure & Auth Setup" has 3 stories — Railway deployment (DevOps persona), RPC contracts (Backend Developer persona), and auth setup. Story 1.1 and 1.3 are pure infrastructure stories with no end-user value.

**Impact:** Breaks the "epics deliver user value" principle.

**Remediation:** For a brownfield project where infrastructure is already built (as noted in PRD: "Architecture, auth, CI/CD, cloud deployment, and infrastructure already built"), this epic is **already completed** and is a non-issue for forward planning. However, any new epic breakdown should ensure technical setup is folded into user-facing stories.

#### 2. Deep Forward Dependency Chain (epics/)
**Violation:** Epic 4 (Frontend Assessment UI) is explicitly "Blocked By: Epics 1, 2, 3 must complete first." Epic 5 (Results & Profile) is "Blocked By: Epic 4." This creates a 5-epic deep dependency chain: E1 → E2 → E3 → E4 → E5.

**Impact:** No parallelization possible. Sequential execution only.

**Mitigated by:** The epics note "Parallel Development: Can design UI components in parallel with backend work" — but this is advisory, not structural. Stories don't include mock data specifications for parallel development.

#### 3. Multiple Epic Documents with Overlapping Scope
**Violation:** 6 independent epic documents cover overlapping areas (e.g., conversation steering is addressed in `epics.md`, `epics-conversation-pacing.md`, and `epics-nerin-steering-format.md`). No single authoritative document indicates which supersedes which.

**Impact:** Developers face ambiguity about which stories to implement. Risk of implementing outdated stories or conflicting approaches.

**Remediation:** Establish a supersession hierarchy or consolidate into one epic document.

### Major Issues

#### 4. Stale Story Content in Sharded Epics
**Issue:** Sharded epics (e.g., Story 2.1) reference tables like `facet_scores` and `trait_scores` that are **no longer in the schema** (derive-at-read pattern eliminates materialized score tables per Story 2.9 and architecture). Stories also reference LangGraph orchestration which has been replaced by sequential Effect pipeline.

**Impact:** If developers follow these stories literally, they'll build against a superseded architecture.

#### 5. Innovation Strategy Epic Document Has Inconsistent Invitee Flow
**Issue:** Innovation epics FR51 describes "Invitee flow: link → anonymous Nerin conversation → signup → notification pin + accept/refuse." But PRD FR37 states "QR accept screen is only accessible to logged-in users with a completed assessment. There is no pre-account context." The gap analysis (Decision 7) resolves this toward the PRD model, but the epic stories haven't been updated.

#### 6. Story Sizing — Some Stories Are Epic-Sized
**Issue:** Several stories span multiple domains and are too large for single implementation:
- Story 2.2 (Nerin Agent Setup) in sharded epics covers agent persona, question generation, conversation context, streaming, error handling — effectively an entire subsystem
- Story 2.4 (LangGraph Orchestration) is superseded but was also epic-sized
- Conversation Pacing epics have stories that cover full pipeline layers (E5: Move Governor is 5+ concerns in one story)

#### 7. Database Table Creation Timing
**Issue:** Story 2.1 in sharded epics creates 5 tables upfront (`sessions`, `assessment_messages`, `facet_evidence`, `facet_scores`, `trait_scores`). Best practice is to create tables when first needed, not all at once.

**Note:** In brownfield context, the schema is already established and this is a historical concern, not a current blocker.

### Minor Concerns

#### 8. Inconsistent Acceptance Criteria Format
**Concern:** Sharded epics use Given/When/Then BDD format but with varying quality:
- Strong: Story 1.2 (auth) has clear, testable criteria
- Weak: Story 1.1 (Railway) has vague "shows healthy status" without measurable outcomes
- The supplemental epic documents (conversation pacing, steering format) have much more rigorous ACs with specific formulas, thresholds, and snapshot test expectations

#### 9. Brownfield Context Not Fully Reflected
**Concern:** Some stories in sharded epics are written as if greenfield (creating tables, setting up infrastructure from scratch) when the PRD explicitly states this is brownfield with infrastructure already built. This creates confusion about what's already done vs. what needs building.

#### 10. No Story for Transactional Emails
**Concern:** PRD requires 3 email types + relationship analysis notifications (NFR27), and the gap analysis specifies Resend integration. No epic document contains a dedicated story for email infrastructure, template creation, and trigger logic.

### Best Practices Compliance Summary

| Criterion | epics/ (1-8) | epics.md | pacing | innovation | steering |
|---|---|---|---|---|---|
| User value focus | ⚠️ E1 is technical | ✓ | ✓ | ✓ | ✓ |
| Epic independence | ❌ Deep chain | ✓ (2 independent) | ✓ (phased) | ✓ | ✓ (E2 depends on E1) |
| Story sizing | ⚠️ Some epic-sized | ✓ | ⚠️ Some large | ⚠️ Some large | ✓ |
| No forward deps | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clear ACs | ⚠️ Varies | ✓ | ✓ Strong | ⚠️ Varies | ✓ Strong |
| FR traceability | ✓ Coverage map | ✓ Coverage map | ✓ Coverage map | ✓ Coverage map | ✓ Coverage map |
| DB creation timing | ❌ Upfront | N/A | ✓ | ✓ | N/A |
| Brownfield awareness | ❌ Greenfield tone | ✓ | ✓ | ⚠️ Mixed | ✓ |

### Actionable Recommendations

1. **Establish epic supersession hierarchy** — declare which epic documents are authoritative and which are historical. The supplemental epics (pacing, steering, innovation) appear to be the latest evolution.
2. **Update or archive stale stories** — sharded epics reference superseded architecture (LangGraph, materialized scores). Either update stories or clearly mark them as completed/superseded.
3. **Add missing stories** — transactional emails, behavioral proxy tracking, pre-conversation onboarding, archetype positivity audit.
4. **Break down epic-sized stories** — particularly in the conversation pacing pipeline where single stories cover entire pipeline layers.
5. **Align invitee flow** — update innovation epics to match PRD FR37 (no pre-account context for QR accept).

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK** — The product vision, PRD, architecture, and UX specification are strong and well-aligned. However, the epic and story layer has significant structural issues that will cause confusion and gaps during implementation.

### Issue Summary

| Category | Critical | Major | Minor | Total |
|---|---|---|---|---|
| FR Coverage | 7 missing, 14 partial | — | — | 21 |
| Epic Structure | 3 | 4 | 3 | 10 |
| UX Alignment | 0 | 1 | 4 | 5 |
| **Total** | **10** | **5** | **7** | **22** |

### Critical Issues Requiring Immediate Action

1. **FR Numbering Mismatch** — The PRD (Mar 18) uses FR1-FR58 but NO epic document uses these numbers. All 6 epic documents have independent FR numbering schemes. This makes traceability impossible without semantic cross-referencing.

2. **7 PRD FRs Have No Epic Coverage:**
   - FR24: Behavioral proxy tracking
   - FR25: Conversation extension session mechanics (new session, prior = "previous version")
   - FR35: Relationship analysis derive-at-read versioning
   - FR36: Email notification for relationship analysis
   - FR45: Relationship CTA on public profiles
   - FR52: Onboarding data storage notice
   - FR54: Pre-conversation onboarding

3. **Epic Document Fragmentation** — 6 independent epic documents with overlapping scope, no supersession hierarchy, and no consolidated view. Developers cannot determine which stories to implement.

### High-Priority Issues

4. **Stale Stories** — Sharded epics reference LangGraph, materialized score tables, and other superseded architecture. Following these literally produces incorrect implementations.

5. **Missing Story: Transactional Emails** — PRD NFR27 requires 3 email types + relationship notifications. Gap analysis specifies Resend. No story exists.

6. **Innovation Epic Invitee Flow Conflicts with PRD** — FR51 in innovation epics allows anonymous conversation before signup. PRD FR37 requires auth + completed assessment before QR accept screen.

### Recommended Next Steps

1. **Generate a consolidated FR traceability matrix** — Map each PRD FR (FR1-FR58) to its implementing story across all epic documents, using PRD FRs as canonical identifiers. This is the highest-leverage action.

2. **Establish epic document hierarchy** — Declare which epic documents are authoritative for each feature area. Archive or clearly mark superseded stories. Suggested hierarchy:
   - Conversation pipeline: `epics-conversation-pacing.md` (supersedes `epics-conversation-pipeline.md` and `epics.md`)
   - Steering format: `epics-nerin-steering-format.md`
   - Monetization/relationship/portrait: `epics-innovation-strategy.md`
   - Core infrastructure/auth/frontend/results: `epics/` (sharded, but many stories already completed)

3. **Write missing stories** for the 7 uncovered FRs (especially FR24, FR25, FR36, FR54) and transactional email infrastructure.

4. **Update stale stories** in sharded epics to reflect current architecture (derive-at-read, sequential Effect pipeline, territory-based steering).

5. **Reconcile PRD ↔ UX ↔ Epic discrepancies** — particularly the ritual screen (mandatory vs nudge) and invitee flow (pre-account vs auth-required).

### What's Working Well

- **PRD is excellent** — 58 well-defined FRs, 29 NFRs, detailed user journeys, comprehensive risk analysis
- **Architecture is consolidated and authoritative** — single source of truth, well-aligned with PRD
- **UX spec is comprehensive** — 263KB covering all journeys, components, and design tokens
- **Gap analysis is current** — 11 decisions resolving UX ↔ Architecture gaps on the same day (Mar 18)
- **Supplemental epic documents have strong ACs** — conversation pacing and steering format epics have rigorous, formula-level acceptance criteria
- **Each epic document has FR coverage maps** — traceability intent is clear, just not unified

### Final Note

This assessment identified **22 issues** across **3 categories** (FR coverage, epic structure, UX alignment). The core problem is **document fragmentation** — the product vision is clear and the technical architecture is solid, but the bridge between "what to build" (PRD) and "how to build it" (epics/stories) has multiple competing paths with no unified view. Generating a consolidated traceability matrix and establishing an epic hierarchy would resolve the majority of these findings.

---

*Assessment completed: 2026-03-18*
*Assessor: Implementation Readiness Workflow (BMAD v6.0)*
