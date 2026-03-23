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
  epics: epics.md
  ux: ux-design-specification.md
supplementaryDocuments:
  - prd-validation-report.md
  - architecture-conversation-experience-evolution.md
  - architecture-conversation-pacing.md
  - architecture-ux-gap-analysis.md
  - public-profile-redesign-architecture.md
  - epics-innovation-strategy.md
  - epics-conversation-pipeline.md
  - epics-conversation-pacing.md
  - epics-nerin-steering-format.md
  - ux-design-innovation-strategy.md
  - ux-ocean-loading-components.md
  - public-profile-redesign-ux-spec.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-03-23
**Project:** big-ocean

## Step 1: Document Discovery

### Authoritative Documents Selected

| Document Type | File | Status |
|---------------|------|--------|
| PRD | `prd.md` | ✅ Confirmed |
| Architecture | `architecture.md` | ✅ Confirmed (sharded folder removed) |
| Epics & Stories | `epics.md` | ✅ Confirmed (sharded folder removed) |
| UX Design | `ux-design-specification.md` | ✅ Found |

### Supplementary Documents

- `prd-validation-report.md`
- `architecture-conversation-experience-evolution.md`
- `architecture-conversation-pacing.md`
- `architecture-ux-gap-analysis.md`
- `public-profile-redesign-architecture.md`
- `epics-innovation-strategy.md`
- `epics-conversation-pipeline.md`
- `epics-conversation-pacing.md`
- `epics-nerin-steering-format.md`
- `ux-design-innovation-strategy.md`
- `ux-ocean-loading-components.md`
- `public-profile-redesign-ux-spec.md`

### Archived/Historical (excluded from assessment)

- `prd-2026-02-02-archived.md`
- `ux-design-specification-archived.md`
- `prd-validation-report-2026-02-02.md`
- `prd-validation-report-post-edit-2026-02-02.md`

## Step 2: PRD Analysis

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | Users can have a 25-exchange adaptive conversation with Nerin |
| FR2 | Nerin responds using ocean/marine metaphors and dive master persona |
| FR3 | The pacing pipeline steers Nerin's territory focus, observation type, and entry pressure each turn |
| FR4 | Users can see a depth meter reflecting the conversation's progress |
| FR5 | Users receive progress milestone markers at 25%, 50%, and 75% |
| FR6 | Nerin references patterns he is noticing during conversation to build portrait anticipation |
| FR7 | Nerin frames observations as invitations — acknowledges pushback, offers alternatives, redirects only on second rejection |
| FR8 | Nerin includes "this is not therapy" framing in the greeting |
| FR9 | Nerin never uses diagnostic language or characterizes third parties |
| FR10 | Users can purchase a conversation extension (+25 exchanges) |
| FR11 | Users can resume an abandoned conversation from where they left off |
| FR12 | Conversation ends with a distinct closing exchange from Nerin before transitioning to results |
| FR13 | Nerin transitions between territories using a connecting observation referencing the prior topic |
| FR14 | System extracts facet evidence and energy signals from each user response via extraction pipeline |
| FR15 | System computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from evidence (recomputed at read time) |
| FR16 | Users can view OCEAN code, archetype name, tribe feeling, and trait/facet scores on results page |
| FR17 | System assigns one of 81 hand-curated archetypes based on OCEAN code |
| FR18 | System presents all archetypes with positive, strength-based framing |
| FR19 | Users can view a dashboard of results, portrait, relationship analyses, and public profile link |
| FR20 | System generates a narrative portrait as a personal letter from Nerin using high-capability LLM |
| FR21 | Users presented with PWYW modal showing founder's story and example portrait after assessment |
| FR22 | Users can view their portrait after payment |
| FR23 | Conversation extension produces updated portrait incorporating new evidence |
| FR24 | System tracks behavioral proxies: share rate, extension purchase rate, return visits within 48h |
| FR25 | Conversation extension creates new session; pacing pipeline initializes from prior session's final state; prior portrait/analyses become "previous version" |
| FR26 | Portrait generation is asynchronous — users notified when ready |
| FR27 | System retries portrait generation on failure; informs user if ultimately fails |
| FR28 | Users initiate relationship analysis via QR drawer; other person scans QR or opens URL |
| FR29 | System generates 2-person relationship analysis when both users completed assessments |
| FR30 | QR accept screen shows initiator's archetype card, confidence rings, credit balance, Accept/Refuse buttons |
| FR31 | Users see ritual suggestion screen before accessing relationship analysis |
| FR32 | Relationship analysis describes relational dynamics without blame language or individual vulnerability data |
| FR33 | Users receive 1 free relationship analysis credit on first portrait purchase (PWYW ≥€1); additional credits €5 each |
| FR34 | If one user deletes account, shared relationship analysis is deleted |
| FR35 | Each analysis linked to both users' results; all preserved as snapshots; version detection is derive-at-read |
| FR36 | Users receive email notification when relationship analysis is ready |
| FR37 | QR accept screen only accessible to logged-in users with completed assessment; no pre-account context |
| FR38 | System tracks relationship analysis credits per user |
| FR39 | Public profile shows archetype, OCEAN code, trait/facet scores, framing line |
| FR40 | Public profiles default-private; binary visibility (fully public or fully private) |
| FR41 | Public profiles generate dynamic OG meta tags and archetype card images |
| FR42 | Public profiles accessible without authentication |
| FR43 | Public profiles include CTA to start own assessment |
| FR44 | Users can copy shareable link to their public profile |
| FR45 | Logged-in users with completed assessment see relationship analysis CTA on others' profiles |
| FR46 | System generates archetype card images per archetype (81 cards, generic not personalized) |
| FR47 | PWYW with embedded checkout; default €5, minimum €1; single "Unlock" button opens checkout |
| FR48 | Users can purchase relationship analysis credits via embedded checkout |
| FR49 | Users can purchase conversation extensions via embedded checkout |
| FR50 | Account creation with email/password; triggers verification email; unverified = unauthenticated |
| FR50a | Verification link expires after 1 week; clicking activates account |
| FR50b | Users can request new verification email from verify-email page |
| FR51 | Users can control public profile visibility (binary toggle) |
| FR52 | Users informed during onboarding that conversation data is stored |
| FR53 | Users can delete account (cascades to all data + shared analyses) |
| FR54 | Pre-conversation onboarding introduces Nerin and conversation format |
| FR55 | System monitors per-session LLM costs against budget threshold |
| FR56 | Cost guard never blocks mid-session; applies at session boundaries |
| FR57 | When cost guard triggers, users can retry sending message |
| FR58 | Users informed when cost guard triggers |

**Total FRs: 60** (FR1–FR58 plus FR50a, FR50b)

### Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR1 | Performance | Nerin response time <2s P95 |
| NFR2 | Performance | Public profile page LCP <1s |
| NFR3 | Performance | Results page LCP <1.5s |
| NFR4 | Performance | Chat page initial load <2s, subsequent interactions <200ms |
| NFR5 | Performance | Portrait generation completes within 60s (async) |
| NFR6 | Cost | Per-assessment LLM cost ≤~€0.20 |
| NFR7 | Cost | Per-portrait LLM cost ≤~€0.20 |
| NFR8 | Security | All data in transit encrypted via TLS 1.3 |
| NFR9 | Security | 12+ character passwords with compromised credential checks |
| NFR9a | Security | Unverified accounts cannot access authenticated routes |
| NFR9b | Security | Verification links expire after 1 week |
| NFR10 | Security | Row-level data access control |
| NFR11 | Privacy | Public profiles default to private |
| NFR12 | Data | Transcripts stored indefinitely; retrievable within 2s |
| NFR13 | Privacy | Relationship analysis doesn't expose raw transcripts |
| NFR14 | Privacy | Account deletion cascades to all user data + shared analyses |
| NFR15 | Reliability | Assessment completion without errors >99% |
| NFR16 | Reliability | Portrait generation success >99% |
| NFR17 | Reliability | Portrait generation auto-retries on failure |
| NFR18 | Reliability | Cost guard never terminates active session |
| NFR19 | Reliability | Sessions resumable after browser close/connection loss |
| NFR20 | Accessibility | WCAG 2.1 AA for public profile, chat, results, PWYW modal |
| NFR21 | Accessibility | Chat interface keyboard-navigable with ARIA labels |
| NFR22 | Accessibility | Score visualizations have text alternatives |
| NFR23 | Accessibility | Ocean theme palette meets AA contrast ratios |
| NFR24 | Accessibility | Proper focus management in modals |
| NFR25 | Integration | Embedded checkout for all payment types |
| NFR26 | Integration | LLM provider switchable without code changes |
| NFR27 | Integration | Transactional email delivery (3 types + relationship analysis notifications within 5min, >95% delivery) |
| NFR28 | Observability | Structured logs: per-session cost, completion status, error events |
| NFR29 | Data | Personality scores always recomputed from current facet evidence at read time |

**Total NFRs: 31** (NFR1–NFR29 plus NFR9a, NFR9b)

### Additional Requirements & Constraints

- **Domain constraint:** Nerin never uses diagnostic language or characterizes third parties
- **Psychological framing:** All archetypes must be frameable as a strength (positivity audit)
- **Relationship analysis:** Differences framed as dynamics, not deficits; no blame language
- **Data correlation boundary:** Relationship analysis never exposes raw transcripts
- **Transcript storage:** Indefinite for MVP (needed for conversation extension)
- **Content moderation/crisis protocol:** Out of scope for MVP
- **Nice-to-have (not required for MVP):** Product analytics (PostHog), admin dashboard, detailed dropout analytics, viral coefficient tracking, revenue reporting dashboard

### PRD Completeness Assessment

The PRD is comprehensive and well-structured. Key observations:
- **60 functional requirements** covering all five user journeys
- **31 non-functional requirements** across performance, security, reliability, accessibility, integration, and observability
- Clear MVP vs post-MVP scoping with justified prioritization
- Strong traceability: each journey maps to specific FRs
- Domain-specific constraints (psychological framing, privacy) are well-articulated
- Risk mitigation strategy covers both execution and innovation risks

## Step 3: Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement (summary) | Epic Coverage | Status |
|----|--------------------------|---------------|--------|
| FR1 | 25-exchange adaptive conversation | Epic 2, Story 2.1-2.3 | ✅ Covered |
| FR2 | Ocean/marine metaphors, dive master persona | Epic 2, Story 2.1-2.2 | ✅ Covered |
| FR3 | Pacing pipeline steers territory, observation, pressure | Epic 2, Story 2.2 | ✅ Covered |
| FR4 | Depth meter | Epic 2, Story 2.4 | ✅ Covered |
| FR5 | Progress milestones at 25/50/75% | Epic 2, Story 2.4 | ✅ Covered |
| FR6 | Nerin references patterns (portrait anticipation) | Epic 2, Story 2.2 | ✅ Covered |
| FR7 | Observation framing & pushback handling | Epic 2, Story 2.2 | ✅ Covered |
| FR8 | "Not therapy" framing in greeting | Epic 2, Story 2.1 | ✅ Covered |
| FR9 | No diagnostic language, no 3rd-party characterization | Epic 2, Story 2.2 | ✅ Covered |
| FR10 | Conversation extension purchase | Epic 7, Story 7.1 | ✅ Covered |
| FR11 | Resume abandoned conversation | Epic 2, Story 2.5 | ✅ Covered |
| FR12 | Distinct closing exchange | Epic 2, Story 2.3 | ✅ Covered |
| FR13 | Territory transitions with connecting observation | Epic 2, Story 2.2 | ✅ Covered |
| FR14 | Extraction pipeline (facet evidence + energy) | Epic 2 (implicit in pacing) | ✅ Covered |
| FR15 | Compute scores, OCEAN code, archetype (derive-at-read) | Epic 3, Story 3.1 | ✅ Covered |
| FR16 | Results page (OCEAN code, archetype, scores) | Epic 3, Story 3.1-3.2 | ✅ Covered |
| FR17 | 81 archetype assignment | Epic 3, Story 3.1 | ✅ Covered |
| FR18 | Positive, strength-based framing | Epic 3 (implicit) | ✅ Covered |
| FR19 | Dashboard with results, portrait, analyses, public profile link | Epic 9, Story 9.3 | ⚠️ Partial — see gap |
| FR20 | Portrait as personal letter from Nerin | Epic 3, Story 3.5 | ✅ Covered |
| FR21 | PWYW modal with founder story | Epic 3, Story 3.4 | ✅ Covered |
| FR22 | View portrait after payment | Epic 3, Story 3.5 | ✅ Covered |
| FR23 | Updated portrait from extension | Epic 7, Story 7.3 | ✅ Covered |
| FR24 | Behavioral proxy tracking | Epic 9, Story 9.3 | ✅ Covered |
| FR25 | Extension session mechanics | Epic 7, Story 7.1-7.3 | ✅ Covered |
| FR26 | Async portrait generation | Epic 3, Story 3.5 | ✅ Covered |
| FR27 | Portrait retry on failure | Epic 3, Story 3.6 | ✅ Covered |
| FR28 | QR drawer initiation | Epic 5, Story 5.2 | ✅ Covered |
| FR29 | 2-person relationship analysis generation | Epic 6, Story 6.2 | ✅ Covered |
| FR30 | QR accept screen (archetype card, confidence, credits) | Epic 5, Story 5.3 | ✅ Covered |
| FR31 | Ritual suggestion screen | Epic 6, Story 6.1 | ✅ Covered |
| FR32 | No blame language, no vulnerability data exposed | Epic 6, Story 6.2 | ✅ Covered |
| FR33 | Free credit on first portrait purchase | Epic 3, Story 3.4 | ✅ Covered |
| FR34 | Cascade deletion of analyses | Epic 6, Story 6.4 | ✅ Covered |
| FR35 | Version management (derive-at-read) | Epic 6, Story 6.4 | ✅ Covered |
| FR36 | Email notification when analysis ready | Epic 6, Story 6.5 | ✅ Covered |
| FR37 | Auth-gating for QR accept | Epic 5, Story 5.3 | ⚠️ Partial — see gap |
| FR38 | Credit tracking | Epic 3, Story 3.8 | ✅ Covered |
| FR39 | Public profile page | Epic 4, Story 4.1 | ✅ Covered |
| FR40 | Default-private, binary visibility | Epic 1, Story 1.1 | ✅ Covered |
| FR41 | OG meta tags + archetype card image | Epic 4, Story 4.2 | ✅ Covered |
| FR42 | Public profile without auth | Epic 4, Story 4.1 | ✅ Covered |
| FR43 | CTA to start own assessment | Epic 4, Story 4.1 | ✅ Covered |
| FR44 | Shareable link to profile | Epic 4, Story 4.3 | ✅ Covered |
| FR45 | Relationship CTA on others' profiles | Epic 4, Story 4.4 | ✅ Covered |
| FR46 | Archetype card images (81 cards) | Epic 3, Story 3.7 | ✅ Covered |
| FR47 | PWYW embedded checkout | Epic 3, Story 3.4 | ✅ Covered |
| FR48 | Credit purchase checkout | Epic 3, Story 3.8 | ✅ Covered |
| FR49 | Extension purchase checkout | Epic 7, Story 7.1 | ✅ Covered |
| FR50 | Account creation with email verification | Epic 1 | ⚠️ Partial — see gap |
| FR50a | Verification link with 1-week expiry | **NOT FOUND** | ❌ MISSING |
| FR50b | Resend verification email | **NOT FOUND** | ❌ MISSING |
| FR51 | Profile visibility control | Epic 1, Story 1.1 | ✅ Covered |
| FR52 | Data storage notice in onboarding | Epic 2, Story 2.1 | ✅ Covered |
| FR53 | Account deletion | Epic 1, Story 1.2 | ✅ Covered |
| FR54 | Pre-conversation onboarding | Epic 2, Story 2.1 | ✅ Covered |
| FR55 | Per-session LLM cost monitoring | Epic 2, Story 2.6 | ✅ Covered |
| FR56 | Cost guard at session boundaries only | Epic 2, Story 2.6 | ✅ Covered |
| FR57 | Retry on cost guard trigger | Epic 2, Story 2.6 | ✅ Covered |
| FR58 | User informed of cost guard | Epic 2, Story 2.6 | ✅ Covered |

### Missing Requirements

#### Critical Missing FRs

**FR50a:** Verification email link expires after 1 week. Clicking the link activates the account and grants platform access.
- **Impact:** Without expiry enforcement, verification links remain valid indefinitely — security gap
- **Recommendation:** Add to Epic 1 as acceptance criteria on the account creation story

**FR50b:** Users can request a new verification email from the verify-email page if the original expired or was not received.
- **Impact:** Users with expired links have no self-service recovery path — support burden
- **Recommendation:** Add to Epic 1 as acceptance criteria on the account creation story

#### High Priority Gaps (PRD text updated but epics not synced)

**FR50 (text drift):** PRD now specifies "Account creation triggers a verification email. Unverified accounts are treated as unauthenticated — no access to dashboard, assessment, results, or any authenticated feature." The epics version says only "Users can create an account and authenticate" — missing the email verification gate entirely.
- **Impact:** High — the verification gate is a PRD requirement since the 2026-03-23 edit. Epics don't reflect this.
- **Recommendation:** Update Epic 1 FR50 text and add a dedicated story or expand existing stories to cover the verification flow

**FR19 (text drift):** PRD now includes "and a link to their public profile" on the dashboard. Epics version omits this.
- **Impact:** Low — minor UI addition
- **Recommendation:** Add to Story 9.3 acceptance criteria

**FR37 (text drift):** PRD now includes "verify their email" in the QR accept flow prerequisite. Epics version says only "sign up and complete their assessment."
- **Impact:** Medium — once email verification is implemented, QR accept flow must check it
- **Recommendation:** Update Story 5.3 acceptance criteria to include email verification check

**NFR9a / NFR9b (missing from epics):** The PRD added NFR9a (unverified route protection) and NFR9b (link expiry enforcement) as non-functional requirements. These have no coverage in any epic.
- **Impact:** High — these are the enforcement mechanisms for the email verification gate
- **Recommendation:** Add to Epic 1 alongside FR50a/FR50b

### Coverage Statistics

- Total PRD FRs: 60 (FR1–FR58 + FR50a + FR50b)
- FRs fully covered in epics: 55
- FRs partially covered (text drift): 3 (FR19, FR37, FR50)
- FRs missing from epics: 2 (FR50a, FR50b)
- Coverage percentage: **91.7%** (55/60 fully covered)
- With partial coverage: **96.7%** (58/60 at least partially addressed)

## Step 4: UX Alignment Assessment

### UX Document Status

**Found:** `ux-design-specification.md` — comprehensive, recently updated (2026-03-23) with dashboard/profile merge and email verification gate additions.

### UX ↔ PRD Alignment

| Area | UX Spec | PRD | Status |
|------|---------|-----|--------|
| Email verification gate | Full flow spec: `/verify-email` page, resend button, 1-week link expiry, unverified=unauthenticated routing | FR50, FR50a, FR50b, NFR9a, NFR9b | ✅ Aligned |
| Assessment invisibility | Core principle: no "assessment/test/quiz" terminology, no scoring indicators | FR8, FR9 (greeting framing, no diagnostic language) | ✅ Aligned |
| Depth meter | Non-numeric visual indicator, conversation progress only, not scoring | FR4 (depth meter), FR5 (milestones) | ✅ Aligned |
| PWYW modal | Congratulations bridge → founder letter → example portrait → CTA, Polar embed stacks | FR21, FR47 | ✅ Aligned |
| Portrait reveal | 5-phase breath sequence, spine renderer, async generation | FR20, FR26, FR27 | ✅ Aligned |
| QR flow | Drawer + scan/URL, accept screen with archetype card + confidence rings + credit balance | FR28, FR30, FR37 | ✅ Aligned |
| Ritual suggestion screen | Both devices, synchronous notification, Continue button | FR31 | ✅ Aligned |
| Public profile | 5-section story scroll, framing line, default-private | FR39-FR44 | ✅ Aligned |
| Conversation extension | Purchase via Polar, continuation with context preservation | FR10, FR23, FR25 | ✅ Aligned |
| Dashboard/profile merge | Single dashboard replaces separate profile page | FR19 (dashboard includes public profile link) | ✅ Aligned |
| Transactional emails | 3 email types specified with voice and content constraints | NFR27 | ✅ Aligned |

### UX ↔ Architecture Alignment

| Area | UX Spec | Architecture | Status |
|------|---------|-------------|--------|
| Email verification | `/verify-email` route, resend, 1-week expiry | ADR-24: Better Auth `requireEmailVerification: true`, `expiresIn: 604800` | ✅ Aligned |
| Polar integration | Embedded checkout, PWYW modal stacking | ADR-8: Better Auth Polar plugin, `@polar-sh/checkout` | ✅ Aligned |
| Portrait async pattern | Skeleton pulse, polling every 2s, retry on failure | Placeholder-row pattern, forkDaemon, lazy retry | ✅ Aligned |
| Cost guard | Session-aware, fail-open, Redis-based | Redis cost guard with fail-open pattern | ✅ Aligned |
| Archetype card images | Satori + Resvg, 2 formats (1.91:1 + 9:16) | Satori + @resvg/resvg-js server-side generation | ✅ Aligned |
| LLM agents | 4 agents (Nerin, ConversAnalyzer, Portrait, Relationship) | 4-agent model post-teaser removal | ✅ Aligned |
| Pacing pipeline | 6-layer pipeline, territory coverage | 6-layer immutable order pipeline | ✅ Aligned |
| Route matrix | Detailed auth/unverified/completed matrix | Route matrix matches with ADR-24 enforcement | ✅ Aligned |

### Alignment Issues

**Minor discrepancy — 5-pack pricing:**
- Architecture mentions "relationship credits (€5/single, **€15/5-pack**)"
- PRD specifies only "€5/additional" with no 5-pack bundle
- UX spec doesn't mention a 5-pack
- **Impact:** Low — the 5-pack may be an architecture-level detail or an outdated reference. Needs clarification before implementation.

### Warnings

No critical warnings. The three documents (PRD, Architecture, UX) are well-aligned on all major features and flows. The email verification gate update (2026-03-23) has been propagated to all three documents. The primary gap remains at the **epics level** (Step 3 findings) — the epics have not been updated to reflect the verification gate requirements.

## Step 5: Epic Quality Review

### Epic Structure Assessment

#### User Value Focus

| Epic | User Value? | Verdict |
|------|------------|---------|
| Epic 1: Account, Onboarding & Privacy Foundation | ✅ Users can create account, control privacy, delete account | Pass — "Foundation" framing is borderline but stories are user-centric |
| Epic 2: Conversational Assessment & Drop-off Recovery | ✅ Users have conversation with Nerin | Pass |
| Epic 3: Results, Portrait & Monetization | ✅ Users see results, unlock portrait, pay | Pass |
| Epic 4: Public Profile & Sharing | ✅ Users share personality publicly | Pass |
| Epic 5: Relationship Analysis — QR & Credits | ✅ Users initiate relationship analysis | Pass |
| Epic 6: Relationship Analysis — Generation & Display | ✅ Users receive and view analysis | Pass |
| Epic 7: Conversation Extension | ✅ Users continue with Nerin | Pass |
| Epic 8: Homepage & Acquisition Funnel | ✅ Visitors experience compelling homepage | Pass |
| Epic 9: Engagement Emails & Dashboard | ✅ Users get centralized dashboard + emails | Pass |
| Epic 10: Ocean Hieroglyph System | ❌ Pure developer refactor | **Violation** |

#### Epic Independence & Dependencies

All epics maintain valid sequential dependencies. The parallelism map is sound:
- Phase 1: Epic 1 ∥ Epic 2 (independent)
- Phase 2: Epic 3 (depends on E1+E2 — valid)
- Phase 3: Epic 4 ∥ Epic 5 (independent)
- Phase 4: Epic 6 (depends on E5+E3 — valid)
- Phase 5: Epic 7 ∥ Epic 8 (independent)
- Phase 6: Epic 9 (aggregation, correctly last)
- Independent: Epic 10

No circular dependencies. No forward dependencies detected.

### Quality Violations

#### 🔴 Critical Violations

**1. Epic 10 is a pure technical refactor with no user value**
Epic 10 (Ocean Hieroglyph System) is entirely a developer-facing rename and consolidation. It delivers no new user capability — users cannot do anything new after this epic ships.
- **Remediation:** Either (a) fold the refactor into the epics where the hieroglyph components are first needed (e.g., Epic 3 results page creates the hieroglyph system as part of building the results UI), or (b) explicitly acknowledge this as a tech debt epic outside the user-value epic chain and deprioritize it. Given it's marked as independent and has no backend changes, option (b) is pragmatic — but it should not block any user-facing epic.

**2. Story 3.0 (Remove Teaser Portrait) is a cleanup task, not a user story**
"As a developer, I want to remove all teaser portrait references..." delivers no user value. It's codebase cleanup.
- **Remediation:** Fold into the first story in Epic 3 that builds the portrait section (Story 3.4 or 3.5). The cleanup is a prerequisite, not a standalone story.

**3. Story 3.0b (OCEAN Code Letter Mapping Update) is a data correction, not a user story**
"As a user viewing my personality results..." — while framed as user-facing, this is actually a data schema fix (letter collision resolution).
- **Remediation:** Roll into Story 3.1 (Results Page — Identity Section) as a prerequisite subtask since the identity section is where the correct letters first appear.

#### 🟠 Major Issues

**4. Epic 2 is acknowledged as "~2-3x others" in size**
The epics doc explicitly notes this. Epic 2 covers: greeting, character quality, closing, depth meter, session resume, cost guard, and email infrastructure — 7 stories spanning conversation engine, pacing pipeline, Nerin character, and email setup.
- **Impact:** Risk of an overloaded sprint/phase. The email infrastructure (Story 2.7) is a parallel workstream but could still bottleneck.
- **Remediation:** Consider splitting conversation stories (2.1-2.5) from infrastructure stories (2.6-2.7) if phasing becomes tight.

**5. Missing email verification stories in Epic 1**
FR50a (verification link expiry), FR50b (resend verification email), NFR9a (unverified route protection), NFR9b (link expiry enforcement) have no corresponding stories. The PRD and UX spec both specify this flow in detail, but Epic 1 has no story covering account creation with email verification.
- **Impact:** High — the entire auth-gated conversation flow depends on verification working. Without stories, there's no implementation path for a critical PRD requirement.
- **Remediation:** Add a new story to Epic 1 (e.g., "Story 1.3: Email Verification Gate") covering: verification email on signup, `/verify-email` page with resend button, 1-week link expiry, unverified users redirected to verify-email from all authenticated routes.

**6. Story 5.3 QR accept screen — credit consumption logic inconsistency**
Story 5.3 says "one relationship credit is consumed from the **accepting** user's balance." But FR33 says credits belong to the user who purchases the portrait (the initiator gets 1 free credit). It's ambiguous who pays the credit — the initiator or the acceptor.
- **Impact:** Medium — this needs clarification. If the initiator pays (owns the credit), the accept screen shouldn't show the acceptor's credit balance. If the acceptor pays, the accept screen design (showing acceptor's credits) makes sense.
- **Remediation:** Clarify in PRD/epics which user's credit is consumed: the initiator (who generated the QR and "spends" their credit to analyze the relationship) or the acceptor.

**7. No story covers the extraction pipeline (FR14)**
FR14 ("system extracts facet evidence and energy signals from each user response via the extraction pipeline") is mapped to Epic 2 in the coverage map, but no specific story covers the ConversAnalyzer v2 integration, dual extraction, or three-tier retry logic. The architecture specifies significant complexity here (strict → lenient → neutral defaults).
- **Impact:** High — the extraction pipeline is the foundation of the entire scoring system. Without a dedicated story, this critical backend component might be underspecified.
- **Remediation:** Add a story to Epic 2 covering the extraction pipeline: ConversAnalyzer v2 integration, dual extraction (userState + evidence), three-tier retry, assessment_exchange row creation.

#### 🟡 Minor Concerns

**8. Story 6.1 synchronous ritual notification mechanism is underspecified**
The story mentions "both devices receive a synchronous notification that the ritual is beginning" but doesn't specify the mechanism (WebSocket? Polling? Push notification?). The architecture would need to support this.
- **Remediation:** Add a technical note to the story specifying the sync mechanism (likely polling or SSE, given the existing tech stack).

**9. Epic 8 has no explicit FR coverage**
Epic 8 (Homepage) notes "(Acquisition funnel — not explicitly in FRs but critical for scaling)." This is honest but unusual — an epic with no FR traceability.
- **Remediation:** Acceptable as-is since the homepage is acknowledged as a growth-phase investment, not a PMF-critical feature. Consider adding an FR to the PRD if this becomes MVP-critical.

**10. Brownfield indicator — no migration/integration stories**
This is a brownfield project with existing infrastructure. The epics correctly assume existing auth, hexagonal architecture, and deployment. No migration stories are needed since new features build on existing infrastructure.
- **Assessment:** Correct for brownfield — no action needed.

### Best Practices Compliance Summary

| Check | Status |
|-------|--------|
| Epics deliver user value | ⚠️ 9/10 pass (Epic 10 is pure refactor) |
| Epic independence | ✅ All pass |
| Stories appropriately sized | ⚠️ Epic 2 is oversized; Stories 3.0/3.0b are tasks, not stories |
| No forward dependencies | ✅ All pass |
| Database tables created when needed | ✅ Tables created in the stories that need them |
| Clear acceptance criteria | ✅ All stories use Given/When/Then format |
| Traceability to FRs maintained | ⚠️ FR14 has no dedicated story; FR50a/FR50b missing entirely |

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK** — The PRD, Architecture, and UX documents are well-aligned and comprehensive. The epics document has good structure and strong story quality overall, but contains specific gaps that must be addressed before implementation begins. None of the issues are architectural — they are all fixable with targeted epic/story updates.

### Issue Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 3 | Technical epic (E10), cleanup stories (3.0, 3.0b) lack user value |
| 🟠 Major | 4 | Missing email verification stories, missing extraction pipeline story, Epic 2 oversized, credit consumption ambiguity |
| 🟡 Minor | 3 | Ritual sync mechanism underspecified, Epic 8 no FR traceability, architecture 5-pack pricing discrepancy |
| ⚠️ Text Drift | 3 | FR50, FR19, FR37 need syncing between PRD and epics |

### Critical Issues Requiring Immediate Action

1. **Add email verification stories to Epic 1** — FR50a, FR50b, NFR9a, NFR9b are specified in PRD and architecture (ADR-24) but have no epic/story coverage. This is a hard gate before platform access and blocks the entire auth-gated conversation flow.

2. **Add extraction pipeline story to Epic 2** — FR14 (ConversAnalyzer v2, dual extraction, three-tier retry) is foundational to the scoring system. The architecture specifies significant complexity, but no story covers the implementation path.

3. **Clarify relationship credit consumption** — Story 5.3 says the acceptor pays, but the credit system grants credits to portrait purchasers (who are typically initiators). Resolve which user's credit is consumed.

### Recommended Next Steps

1. **Sync epics FR inventory with PRD** — Update FR50 text to include email verification gate. Add FR50a, FR50b. Update FR19 (add public profile link). Update FR37 (add email verification prerequisite). Add NFR9a, NFR9b to the NFR list.

2. **Add 2 new stories:**
   - Epic 1, Story 1.3: "Email Verification Gate" — covers verification email on signup, `/verify-email` page with resend, 1-week link expiry, unverified route protection
   - Epic 2, Story 2.8: "Extraction Pipeline & Evidence Processing" — covers ConversAnalyzer v2 integration, dual extraction (userState + evidence), three-tier retry (strict → lenient → neutral), assessment_exchange row creation

3. **Resolve structural issues:**
   - Fold Story 3.0 (teaser removal) and Story 3.0b (letter mapping update) into Story 3.1 as prerequisite subtasks
   - Acknowledge Epic 10 as a tech debt / DX improvement epic, not a user-value epic — deprioritize accordingly
   - Add a technical note to Story 6.1 specifying the ritual synchronization mechanism (polling or SSE)

4. **Clarify credit consumption direction** in PRD → update Story 5.3 acceptance criteria accordingly

5. **Consider splitting Epic 2** if sprint capacity is constrained — conversation stories (2.1-2.5) vs infrastructure stories (2.6-2.7+2.8)

### Final Note

This assessment identified **10 issues** across **4 severity categories**. The core planning documents (PRD, Architecture, UX) are strong and well-aligned — the issues are concentrated in the **epics document** which needs targeted updates to reflect recent PRD changes (email verification gate) and to add coverage for the extraction pipeline. Addressing these issues is estimated at 1-2 hours of epic/story writing. The project is close to implementation-ready.

**Assessed by:** Claude (Implementation Readiness Workflow)
**Date:** 2026-03-23
