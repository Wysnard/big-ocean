# FR Traceability Matrix

**Date:** 2026-03-18
**Purpose:** Maps each PRD FR (FR1-FR58) and NFR (NFR1-NFR29) to implementing stories across all epic documents. Uses PRD FR numbers as the canonical reference.

## Legend

**Epic Document Abbreviations:**
- **E/** — Sharded epics (`epics/`) — Epics 1-8, original product scope
- **CEE** — `epics.md` — Conversation Experience Evolution (2 epics)
- **PAC** — `epics-conversation-pacing.md` — Conversation Pacing Pipeline (5 epics)
- **INN** — `epics-innovation-strategy.md` — Innovation Strategy (7 epics)
- **STR** — `epics-nerin-steering-format.md` — Nerin Steering Format (2 epics)
- **GAP** — `architecture-ux-gap-analysis.md` — Architectural decisions

**Status:**
- ✅ Fully covered by specific story with acceptance criteria
- ⚠️ Partially covered or implicit (exists as part of a broader story but not explicitly acceptance-tested)
- ❌ No coverage — needs new story
- 🏗️ Already implemented (per COMPLETED-STORIES.md)

---

## Functional Requirements

### Conversation Experience (FR1-FR13)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR1** | 25-exchange adaptive conversation with Nerin | INN E1 S1.1-1.8 (pipeline), PAC E5 S5.3 (15-step pipeline), E/ E2 S2.1-2.2 🏗️ | ✅ | Core pipeline covered across multiple epics. INN E1 is the most current architecture. PAC supersedes with 15-step orchestration. |
| **FR2** | Nerin ocean/marine metaphors, dive master persona | CEE E2 S2.2 (relate > reflect patterns), STR E1 S1.2-1.3 (common layer, templates) | ✅ | Character bible work in CEE and STR ensures persona consistency. |
| **FR3** | Pacing pipeline steers territory, observation, entry pressure each turn | PAC E3 S3.1-3.2 (E_target, scorer), PAC E4 S4.3 (governor), STR E1 S1.4 (skeleton swap) | ✅ | Full 6-layer pipeline: PAC covers scoring/pacing, STR covers prompt delivery. |
| **FR4** | Depth meter reflecting conversation progress | E/ E4 S4.4, S4.7 (progress indicator) | ✅ | Message-count progress toward threshold. |
| **FR5** | Progress milestones at 25%, 50%, 75% | E/ E4 S4.7 (progress indicator) | ⚠️ | Progress indicator exists but specific milestone markers (25/50/75%) not in ACs. **Action:** Add milestone ACs to E/ E4 S4.7. |
| **FR6** | Nerin teases portrait during conversation | PAC E4 S4.1-4.2 (observation focus: noticing, contradiction, convergence), INN E3 S3.3 (teaser portrait) | ✅ | Observation focuses create "feel seen" moments that tease what Nerin has noticed. |
| **FR7** | Observations framed as invitations, redirect only on 2nd rejection | CEE E2 S2.2 (relate > reflect), STR E1 S1.3 (templates with pressure modifiers) | ⚠️ | Relate > reflect pattern covers invitational framing. But "redirect only on 2nd rejection" pushback handling is not explicitly in ACs. **Action:** Add pushback handling AC. |
| **FR8** | "Not therapy" framing in greeting | — | ⚠️ | Implied by Nerin character bible. No explicit story. **Action:** Add as AC to CEE E2 S2.1 or character bible story. |
| **FR9** | No diagnostic language, no third-party characterization | — | ⚠️ | Implied by character constraints. No explicit story. **Action:** Add as AC to character bible story. |
| **FR10** | Conversation extension (+25 exchanges) purchase | INN E4 S4.2 (Polar.sh checkout), GAP Decision 6 (extension creates new session) | ⚠️ | Payment via Polar.sh covered. Session mechanics documented in gap analysis but **no dedicated story for extension pipeline** (initializing from prior state, linking sessions). **Action:** Create dedicated extension story. |
| **FR11** | Resume abandoned conversation | E/ E2 S2.1 🏗️ (session persistence), E/ E4 S4.3 (session resumption UI), INN E1 S1.3 (chat UI with resumption) | ✅ | Server-side session state + URL-based resumption. |
| **FR12** | Closing exchange from Nerin before results | PAC E3 S3.3 (territory selector: amplify/close on final turn) | ✅ | Final turn triggers close intent. |
| **FR13** | Territory transitions with connecting observation | STR E2 S2.1-2.2 (bridge intent, bridge templates, 3-tier fallback) | ✅ | Dedicated bridge intent with park-bridge-close arcs. |

### Personality Assessment & Results (FR14-FR19)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR14** | Extract facet evidence + energy signals | PAC E2 S2.1-2.2 (ConversAnalyzer v2, dual extraction), INN E1 S1.5 (ConversAnalyzer Haiku) | ✅ | PAC ConversAnalyzer v2 supersedes INN's single-extraction model with dual energy+telling extraction. |
| **FR15** | Compute 30 facet scores, 5 traits, OCEAN code, archetype (derive-at-read) | INN E2 S2.3 (score computation + OCEAN code), E/ E2 S2.9 (remove materialized scores), E/ E3 S3.1-3.2 (OCEAN + archetype) | ✅ | Derive-at-read pattern established. |
| **FR16** | Results page (OCEAN code, archetype, tribe, scores) | E/ E5 S5.1 (results display), E/ E7 S7.9 (results page visual redesign), INN E3 S3.1 (results page) | ✅ | Multiple stories cover results display. |
| **FR17** | 81 hand-curated archetypes from OCEAN code | E/ E3 S3.1-3.2 (OCEAN code gen + archetype lookup), INN E2 S2.4 (archetype system) | ✅ | |
| **FR18** | Positive, strength-based archetype framing | — | ❌ | No story explicitly audits 81 archetypes for positive framing. **Action:** Add "Archetype Positivity Audit" story to E/ E3 or E/ E8. |
| **FR19** | Dashboard (results, portrait, relationship analyses) | E/ E7 S7.13 (registered user profile page) | ✅ | |

### Portrait (FR20-FR27)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR20** | Portrait as personal letter from Nerin (high-capability LLM) | INN E4 S4.3 (full portrait async gen, Sonnet/Opus) | ✅ | |
| **FR21** | PWYW modal with founder story + example portrait | INN E4 S4.2 (Polar.sh checkout), INN E3 S3.3 (teaser with founder's portrait as social proof) | ⚠️ | Checkout is covered. Founder's portrait shown in teaser story. But **PWYW modal UX (founder vulnerability narrative + example portrait)** is not a dedicated AC. **Action:** Add founder story content + example portrait display to PWYW modal ACs. |
| **FR22** | View portrait after payment | INN E4 S4.3 (full portrait generation + display) | ✅ | |
| **FR23** | Extension produces updated portrait with new evidence | GAP Decision 10 (extension creates new result → new portrait) | ⚠️ | Architecture decision documented but **no implementing story**. **Action:** Fold into conversation extension story (see FR10). |
| **FR24** | Behavioral proxy tracking (share rate, extension purchase, return visits 48h) | — | ❌ | No story. **Action:** Create "Behavioral Proxy Tracking" story — define events to track, storage, and reporting. Could be a lightweight analytics/events story. |
| **FR25** | Extension creates new session; prior portrait/analyses = "previous version" | GAP Decision 6, 10, 11 (extension mechanics, versioning) | ❌ | Architecture decisions documented in gap analysis but **no implementing story with ACs**. **Action:** Create "Conversation Extension Pipeline" story covering: new session creation, parent linking, pacing initialization from prior state, result versioning. |
| **FR26** | Portrait generation async, user notified | INN E4 S4.3 (forkDaemon + polling), INN E2 S2.5 (finalization status polling) | ✅ | |
| **FR27** | Portrait retry on failure, inform user | INN E4 S4.3 (auto-retry max 3 + lazy retry), GAP Decision 9 (reconciliation) | ✅ | |

### Relationship Analysis (FR28-FR38)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR28** | QR drawer to initiate relationship analysis | INN E5 S5.2 (invitation system, InvitationBottomSheet), GAP Decision 1 (QR token replaces invitation) | ⚠️ | INN uses invitation links; GAP replaces with QR tokens. **Epic story needs updating to QR model.** |
| **FR29** | 2-person relationship analysis when both complete | INN E5 S5.4 (relationship analysis generation) | ✅ | |
| **FR30** | QR accept screen (archetype card, confidence rings, credit balance, Accept/Refuse) | GAP Decision 7 (QR accept screen data) | ⚠️ | Gap analysis specifies the data model. **No implementing story with frontend ACs.** **Action:** Create "QR Accept Screen" frontend story. |
| **FR31** | Ritual suggestion screen (Start button, no skip) | INN E5 S5.4 (mentions "read together" nudge) | ⚠️ | Mentioned but not a dedicated UI story. **PRD says no skip; INN says nudge. Needs reconciliation.** **Action:** Create "Relationship Ritual Screen" story with clarified skip semantics. |
| **FR32** | Relationship analysis framing guardrails (no blame, no vulnerability exposure) | — | ⚠️ | Domain requirement in PRD. Implemented via prompt constraints in portrait/analysis generator. **Action:** Add as AC to INN E5 S5.4 (analysis generation). |
| **FR33** | Free credit on first portrait purchase (PWYW ≥€1) | INN E5 S5.1 (relationship credits), GAP Decision 3 (credit on purchase, not signup) | ✅ | Gap analysis clarifies: credit granted on first `portrait_unlocked` event, not signup. |
| **FR34** | Account deletion cascades to shared relationship analyses | E/ E6 S6.2 (GDPR deletion), INN E7 S7.2 (GDPR deletion) | ✅ | |
| **FR35** | Relationship analyses as snapshots, derive-at-read versioning | GAP Decision 2, 11 (FK to assessment_results, isLatestResult utility) | ❌ | Architecture decided but **no implementing story with ACs**. **Action:** Create "Relationship Analysis Versioning" story. |
| **FR36** | Email notification when relationship analysis ready | GAP Decision 8 (Resend, email types) | ❌ | Gap analysis specifies email infrastructure. **No implementing story.** **Action:** Create "Transactional Email System" story covering all 4 email types (3 lifecycle + 1 relationship notification). |
| **FR37** | QR accept screen requires auth + completed assessment | GAP Decision 7 (auth-gated QR flow) | ⚠️ | Gap analysis specifies auth gating. INN E5 S5.3 conflicts (anonymous flow). **Action:** Update INN E5 S5.3 to match PRD model. |
| **FR38** | Track relationship analysis credits per user | INN E4 S4.1 (purchase_events + capability derivation), INN E5 S5.1 (credits) | ✅ | Derive from append-only events. |

### Public Profile & Social Sharing (FR39-FR46)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR39** | Public profile (archetype, OCEAN code, scores, framing line) | E/ E5 S5.2 (shareable profile), E/ E7 S7.12 (shareable public profile & share cards), INN E6 S6.1 | ✅ | |
| **FR40** | Default-private, binary visibility | E/ E5 S5.2, INN E6 S6.1 | ✅ | |
| **FR41** | Dynamic OG meta tags + archetype card images | INN E6 S6.2 (archetype card gen, Satori), E/ E7 S7.12 | ✅ | |
| **FR42** | Public profiles accessible without auth | E/ E7 S7.12, INN E6 S6.1 | ✅ | |
| **FR43** | CTA on public profile to start assessment | E/ E7 S7.12 | ✅ | |
| **FR44** | Copy shareable link to public profile | E/ E5 S5.2 | ✅ | |
| **FR45** | Relationship CTA on other users' profiles (logged-in user with completed assessment) | — | ❌ | **No story.** PRD: "You care about [Name]. Discover your dynamic together." **Action:** Add as AC to E/ E7 S7.12 or create new story. |
| **FR46** | 81 archetype card images (generic per archetype, not personalized) | INN E6 S6.2 (Satori JSX → SVG → PNG, 9:16 + 1:1) | ✅ | |

### Payments & Monetization (FR47-FR49)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR47** | PWYW embedded checkout (default €5, min €1) | INN E4 S4.2 (Polar.sh checkout + webhook) | ✅ | |
| **FR48** | Relationship credit purchase (embedded checkout) | INN E5 S5.1 (credits: €5 single, €15 5-pack) | ✅ | |
| **FR49** | Conversation extension purchase (embedded checkout) | INN E4 S4.2 (Polar.sh) | ⚠️ | Polar.sh integration covers checkout mechanics. But **extension-specific product/pricing not detailed in any story AC.** **Action:** Add extension purchase (€25) to Polar.sh checkout story ACs. |

### User Account & Privacy (FR50-FR54)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR50** | Account creation + authentication | E/ E1 S1.2 🏗️ (Better Auth), INN E1 S1.2 (anonymous session + auth) | ✅ | Already implemented. |
| **FR51** | Profile visibility control (binary: public/private) | E/ E5 S5.2, INN E6 S6.1 | ✅ | |
| **FR52** | Onboarding data storage notice | — | ❌ | **No story.** PRD: "Users are informed during onboarding that conversation data is stored." **Action:** Add as AC to pre-conversation onboarding story (see FR54). |
| **FR53** | Account deletion cascades to all data + shared analyses | E/ E6 S6.2, INN E7 S7.2 | ✅ | |
| **FR54** | Pre-conversation onboarding (intro to Nerin + format) | — | ❌ | **No story.** PRD: "Users are introduced to Nerin and the conversation format before the conversation begins." **Action:** Create "Pre-Conversation Onboarding" story. |

### Cost Management (FR55-FR58)

| PRD FR | Requirement | Implementing Stories | Status | Notes |
|---|---|---|---|---|
| **FR55** | Per-session LLM cost monitoring | E/ E2 S2.5 (cost tracking), INN E1 S1.8 (cost tracking + Redis), INN E6 S6.3 (circuit breaker) | ✅ | |
| **FR56** | Cost guard at session boundaries only (never mid-session) | INN E1 S1.8 (session start cost reservation $0.30) | ⚠️ | Cost reservation implies session-boundary protection. But **"never blocks mid-session"** not an explicit AC. **Action:** Add session-boundary AC to cost guard story. |
| **FR57** | User can retry on cost guard trigger | — | ⚠️ | **Implicit.** Cost guard blocks the turn; user naturally retries. **Action:** Add retry UX as AC to cost guard or chat UI story. |
| **FR58** | User informed when cost guard triggers | — | ⚠️ | **Implicit.** No explicit notification/error message story. **Action:** Add cost guard notification AC to chat UI story. |

---

## Non-Functional Requirements

| PRD NFR | Requirement | Implementing Stories | Status |
|---|---|---|---|
| **NFR1** | Nerin response <2s P95 | PAC NFR8 (pure functions sub-ms), INN NFR (response time) | ✅ |
| **NFR2** | Public profile LCP <1s | E/ E7 S7.12 (SSR), INN E6 S6.1 (<1s load) | ✅ |
| **NFR3** | Results page LCP <1.5s | E/ E7 S7.9, INN E3 S3.1 | ⚠️ Implicit |
| **NFR4** | Chat page load <2s, interactions <200ms | INN E1 S1.3 (streaming, optimistic updates) | ✅ |
| **NFR5** | Portrait generation <60s async | INN E4 S4.3 (async forkDaemon) | ⚠️ No explicit 60s target |
| **NFR6** | Per-assessment LLM cost ≤€0.20 | INN E1 S1.8 ($0.15 target), PAC NFR2 (cost neutrality) | ✅ |
| **NFR7** | Per-portrait LLM cost ≤€0.20 | INN E4 S4.3 (Sonnet/Opus) | ⚠️ Implicit |
| **NFR8** | TLS 1.3 in transit | E/ E6 S6.1, INN E7 S7.1 | ✅ |
| **NFR9** | 12+ char passwords, compromised credential check | E/ E1 S1.2 🏗️ | ✅ Already implemented |
| **NFR10** | Row-level data access control | E/ E6 S6.3 (audit logging), INN E6 S6.1 (403 on private profiles) | ✅ |
| **NFR11** | Profiles default private, zero public discovery | E/ E5 S5.2, INN E6 S6.1 | ✅ |
| **NFR12** | Transcripts stored indefinitely, <2s retrieval | INN E1 S1.1 (schema), GAP (needed for extension) | ⚠️ No explicit retrieval SLA |
| **NFR13** | Relationship analysis doesn't expose transcripts | INN E5 S5.4 (uses facet data, not transcripts) | ✅ |
| **NFR14** | Account deletion cascades | E/ E6 S6.2, INN E7 S7.2 | ✅ |
| **NFR15** | Assessment completion >99% | INN E1 S1.8 (cost guard, rate limit) | ⚠️ Implicit |
| **NFR16** | Portrait generation >99% success | INN E4 S4.3 (auto-retry) | ✅ |
| **NFR17** | Portrait auto-retry on failure | INN E4 S4.3 (max 3 retries), GAP Decision 9 | ✅ |
| **NFR18** | Cost guard never terminates active session | INN E1 S1.8 (session cost reservation) | ⚠️ See FR56 |
| **NFR19** | Sessions resumable after browser close | E/ E2 S2.1 🏗️, INN E1 S1.3 | ✅ |
| **NFR20** | WCAG 2.1 AA for key pages | E/ E7 S7.1 (design tokens), INN E3 S3.1 (WCAG noted) | ⚠️ Mentioned but no dedicated a11y story |
| **NFR21** | Chat keyboard-navigable, ARIA labels | INN E1 S1.3 | ⚠️ Not explicit in ACs |
| **NFR22** | Score viz text alternatives | E/ E7 S7.5, S7.9 | ⚠️ Not explicit in ACs |
| **NFR23** | Color palette meets AA contrast | E/ E7 S7.1 (design tokens) | ⚠️ Implied by design token story |
| **NFR24** | Focus management in modals | — | ⚠️ No explicit story |
| **NFR25** | Embedded checkout integration | INN E4 S4.2 (Polar.sh) | ✅ |
| **NFR26** | LLM provider switchability | Architecture (hexagonal, repository pattern) | ✅ Structural |
| **NFR27** | Transactional emails (3 types + relationship notification) | GAP Decision 8 (Resend) | ❌ Architecture only — no story |
| **NFR28** | Structured logging (cost, completion, errors) | INN E1 S1.8 (cost logging), PAC NFR9 (monitoring) | ✅ |
| **NFR29** | Derive-at-read for personality scores | E/ E2 S2.9, Architecture (pattern) | ✅ |

---

## Coverage Summary

### FR Coverage

| Status | Count | Percentage |
|---|---|---|
| ✅ Fully covered | 35 | 60% |
| ⚠️ Partial / Implicit | 14 | 24% |
| ❌ No coverage | 9 | 16% |
| **Total** | **58** | |

### Missing Stories Required

| Priority | Story | PRD FRs Addressed |
|---|---|---|
| **High** | Conversation Extension Pipeline (new session, prior state init, result versioning) | FR10, FR23, FR25 |
| **High** | Transactional Email System (Resend integration, 4 email types, triggers) | FR36, NFR27 |
| **Medium** | QR Accept Screen (frontend story with PRD-specified data) | FR28, FR30, FR37 |
| **Medium** | Relationship Ritual Screen (clarified skip semantics) | FR31 |
| **Medium** | Relationship Analysis Versioning (derive-at-read, isLatestResult utility) | FR35 |
| **Medium** | Pre-Conversation Onboarding (intro to Nerin + data storage notice) | FR52, FR54 |
| **Medium** | Behavioral Proxy Tracking (share rate, extension purchase, return visits) | FR24 |
| **Low** | Archetype Positivity Audit (81 archetypes reviewed for strength framing) | FR18 |
| **Low** | Relationship CTA on Public Profiles | FR45 |
| **Low** | Accessibility Story (WCAG 2.1 AA audit across key pages) | NFR20-24 |

### Acceptance Criteria Gaps (add to existing stories)

| Existing Story | ACs to Add | PRD FR |
|---|---|---|
| E/ E4 S4.7 (progress indicator) | Milestone markers at 25%, 50%, 75% | FR5 |
| Character bible stories (CEE/STR) | "Not therapy" greeting, no diagnostic language, no third-party characterization, 2nd-rejection redirect | FR7, FR8, FR9 |
| INN E4 S4.2 (Polar.sh checkout) | Extension purchase product (€25), founder story + example portrait in PWYW modal | FR21, FR49 |
| INN E5 S5.3 (invitee flow) | Update to auth-required model (no pre-account context) per PRD FR37 | FR37 |
| INN E5 S5.4 (relationship analysis gen) | Framing guardrails: no blame, no vulnerability exposure | FR32 |
| INN E1 S1.8 (cost tracking) | Never blocks mid-session (session-boundary only), retry UX, user notification | FR56, FR57, FR58 |
| E/ E7 S7.12 (public profile) | Relationship CTA for logged-in users with completed assessment | FR45 |

---

## Epic Document Supersession Hierarchy

Based on dates, scope, and architectural evolution:

| Feature Area | Authoritative Document | Supersedes |
|---|---|---|
| **Conversation pipeline (steering, scoring, extraction)** | `epics-conversation-pacing.md` (Mar 12) | `epics.md` (Mar 12), `epics-conversation-pipeline.md` (Mar 2) |
| **Nerin prompt delivery (templates, bridging, mirrors)** | `epics-nerin-steering-format.md` (Mar 14) | Portions of `epics.md` E2 |
| **Monetization, portrait, relationship, growth** | `epics-innovation-strategy.md` (Feb 28) | — (unique scope) |
| **Infrastructure, auth, frontend UI, results, privacy** | `epics/` sharded (various) | — (many stories already completed) |
| **Nerin character bible reform** | `epics.md` E2 (Mar 12) | — (unique scope: relate > reflect, story-pulling) |
| **Architectural gap resolutions** | `architecture-ux-gap-analysis.md` (Mar 18) | Conflicting details in all epic documents |
