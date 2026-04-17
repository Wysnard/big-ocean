---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-03-edit-2026-04-18-validation-polish"]
lastEdited: '2026-04-18'
editHistory:
  - date: '2026-04-18'
    changes: 'BMAD Edit workflow (guided by prd-validation-report-2026-04-18): FR layer — reduced implementation leakage (FR3/13/14/20/25/47/94); FR30 wording; acceptance criteria on FR18/32/53/65; FR53 cascade clarity. NFR layer — NFR1 end-to-end latency wording; NFR15/NFR16 rolling 30-day measurement. Frontmatter — dropped missing inputDocument refs; completedStoriesDocs count 0.'
  - date: '2026-04-16'
    changes: 'Alignment with UX §18.17 / ux-design-addendum-me-canonical-urls.md: FR93–FR95 use `/me/$conversationSessionId` (+ `?view=portrait`) as canonical routes; legacy `/results/*` may redirect only. FR16 wording → Me identity surface. FR24 removes user-facing dashboard metrics; events stored for internal analytics/ops only (Intimacy Principle). FR84 founder story moved from homepage to `/about` (matches UX-DR39 / homepage split-layout spec). NFR3/NFR20 rename results page → Me/post-assessment surfaces. FR101 clarified to reference focused reading URL before full Me. Second pass: journeys, Web App Requirements, Innovation #10, FR12/FR50, section heading — replace stray "results page(s)" product language with Me + canonical paths; cold-funnel metaphor `home → chat → results → done` → `home → chat → Me → done`; founder pre-mortem points to `/about`; Marc journey "gets his results" → assessment output wording.'
  - date: '2026-04-11'
    changes: 'Design thinking 2026-04-09 integration. Source: _bmad-output/design-thinking-2026-04-09.md. MAJOR RESTRUCTURE. (1) Executive Summary: added three-space architecture (Today/Me/Circle), Intimacy Principle as brand DNA, updated JTBD table so Jobs 4 and 5 are served in MVP via free weekly letter and silent daily journal, updated business model to reflect MVP subscription = conversation extension + bundled first-extension portrait regeneration. (2) Success Criteria: added Day 7 return >40%, Day 30 retention >25%, Sunday weekly letter open rate >60%, daily silent check-in rate >30%, "companion not test" qualitative metric. Updated cost targets to reflect silent-free / LLM-weekly model ($0.02-0.08 free, $0.35-0.75 subscriber). (3) Product Scope: completely rewrote MVP feature list (three-space nav, silent journal, free weekly letter, relationship letter with data grid, Circle + invite ceremony, post-assessment transition, subscription flow). Rewrote Free vs Paid table. Updated Phase 1b and Phase 2a to reflect where paid features actually land. (4) Innovation section: added Intimacy Principle (#9), Three-Space Navigation (#10), Nerin Output Grammar (#11) subsections. (5) User Journeys: rewrote Journey 1 ending with post-assessment focused reading transition (Show me what you found → portrait reading view → Me page → return seed). Rewrote Journey 7 as silent daily journal / Phase 5→6 bridge. Deleted old Journey 8 (Portrait Evolution, Phase 1b) and replaced with new Journey 8 (Subscription Conversion at Week 3 — Léa extends the conversation). Updated Journey Requirements Summary. (6) FRs: relabeled FR10/23/25/49 from post-MVP to MVP subscription. Rewrote FR19 (dashboard → three-space nav). Tightened FR21 (portrait is free, no conversion gate). Rewrote FR23 (first extension → automatic portrait regen bundled, no purchase). Added FR23a (subsequent extensions post-MVP). Rewrote FR25 (Director model re-init + bundled first portrait). Rewrote FR28-FR37 as relationship letter (living space, real-time data grid, annual regeneration model, Section D post-MVP, QR ongoing consent). Added FR29a, FR32a (post-MVP Section D), FR35a (post-MVP annual regeneration). Unbundled FR47 (MVP = extension + first portrait regen only; post-MVP cross-references). Replaced FR67-FR72 with silent journal fork (FR67 check-in form, FR68 silent deposit, FR68a anticipation line, FR69/FR69a post-MVP LLM recognition and mini-dialogue, FR70 mood calendar, FR71 three-level note visibility, FR72 privacy). Tightened FR73 (storage only in MVP), deferred FR74 (gallery) and FR75 (confidence milestones) to post-MVP. Added FR86-FR92 (weekly summary generation, content structure, push notification, focused route, conversion CTA, edge cases). Added FR93-FR96 (post-assessment transition: closing button, portrait reading generating state, end-of-letter link, return seed + notification permission). Added FR97-FR100 (Circle, Intimacy Principle enforcement, invite ceremony reward-first copy, invite placement). Added FR101-FR103 (three-space navigation routing, bottom nav + /settings, public profile separation). (7) NFRs: rewrote NFR7 removing Sonnet/Haiku model name leakage. Rewrote NFR7a with new unit economics (no longer requires template-based responses, cost optimization via silent daily design). Tightened NFR7b circuit breaker threshold.'
  - date: '2026-04-09'
    changes: 'Innovation strategy v2 integration. Source: innovation-strategy-2026-04-08.md. (1) Revenue model overhaul: killed PWYW + credits, portrait now free, relationship analysis fully free, single revenue stream = subscription at €9.99/mo. Three-layer flywheel: Discovery (free) → Relationship (free, growth engine) → Daily practice (subscription). (2) Repositioning: personality front door + self-care engine. (3) Realistic revenue expectations: €10-30K year 1, €50-150K year 2. (4) Updated success metrics, market analysis, competitive benchmarking. (5) Added therapist B2B wedge, acquisition strategy, pre-mortem. (6) New features: mood diary/check-in, mood calendar, portrait gallery. (7) FR overhaul: FR21/FR33 updated, removed credit FRs, added mood diary FRs (FR67-FR72), portrait evolution FRs (FR73-FR75). (11) Validation fixes: wrote Journey 7 (mood diary) and Journey 8 (portrait evolution) for FR67-75 traceability. Tightened homepage FRs (FR59, FR60, FR64, FR66) with testable acceptance criteria. Unbundled FR47 with FR cross-references. Fixed NFR7 implementation leakage. Improved FR24, FR27, FR55, FR57, FR75 measurability. Added FR76-FR77 (transactional emails). Fixed stale credit references in Journey 2.'
  - date: '2026-04-06'
    changes: 'Innovation strategy integration + MVP updates. Source: innovation-strategy-2026-04-06.md. (1) Strategic repositioning: assessment=onboarding, personality-aware life companion=product. Added JTBD table, "don''t have to explain yourself" differentiator, subscription vision (€10/mo). (2) MVP changes: 25→15 exchanges, 6-layer pacing pipeline→Director model (evidence extraction→coverage analysis→Director→Actor), conversation extension moved from MVP to subscription. (3) Added: phase transition triggers, Phase 2 success criteria, A→B staged strategy, free vs paid tiers, detailed post-MVP phases (1b→2c, no Phase 3), design-now-build-later list, 4 disruption vectors, ERRC grid, expanded competitive landscape, decision gates, key hypotheses/kill criteria, backup plans. (4) Removed Journey 3 (extension-based), replaced with illustrative post-MVP Journey 3 (returning subscriber with Coach). (5) FR updates: FR1 (15 exchanges), FR3 (Director model), FR10/FR23/FR25/FR49 marked post-MVP, FR46 GeometricSignature fixed, FR47 simplified. (6) Updated all journeys, risk tables, scope tables for consistency.'
  - date: '2026-04-01'
    changes: 'Result-scoped portrait purchase: added FR22a (one purchase = one portrait for one specific result), rewrote FR23 (extension requires new portrait purchase, prior portrait preserved), updated FR25 (new result has no portrait until purchased), updated FR47 (purchase scoped to current result), updated Journey 3 (Léa purchases new portrait after extension), updated Executive Summary business model (portrait per result, extension produces new result requiring new purchase). Source: codebase refactoring revealed confusion around portrait generation lifecycle'
  - date: '2026-03-24'
    changes: 'Homepage conversion: added Journey 6 (Cold Visitor — Inès), added FR59-FR66 (homepage messaging, universal hook, single CTA, portrait excerpt preview, Nerin conversation preview, fear-addressing content, PWYW transparency, multi-persona content). Added homepage metrics to Success Criteria (bounce rate, sign-up conversion, time-to-CTA). Added Homepage Performance section to Web App Requirements. Updated Executive Summary to flag homepage as primary gap alongside Nerin quality. Updated MVP Feature Set with homepage conversion content. Updated Journey 2 to note invited-friend entry mismatch. Source: brainstorming-session-2026-03-23.md (66 ideas, 6 themes)'
  - date: '2026-03-23'
    changes: 'Email verification gate: expanded FR50 to require email verification before platform access, added FR50a (verification link with 1-week expiry), FR50b (resend verification email), NFR9a (unverified route protection), NFR9b (link expiry enforcement). Updated Journeys 1 and 2 to include verification step'
  - date: '2026-03-23'
    changes: 'Dashboard/profile merge: removed "profile" as separate page type in Web App Requirements, updated FR19 to include public profile link on dashboard'
inputDocuments:
  - "design-thinking-2026-04-09.md (three-space architecture, Intimacy Principle, silent journal fork, weekly letter as subscription conversion moment, relationship letter living space, post-assessment focused reading transition, lean MVP scope with conversation extension + first-portrait regen as sole paid perks)"
  - "innovation-strategy-2026-04-08.md (revenue model overhaul, three-layer flywheel, market analysis, therapist B2B, realistic projections)"
  - "innovation-strategy-2026-04-06.md (strategic repositioning, subscription model, agent platform, disruption vectors)"
  - "architecture.md (consolidated, 2026-03-15)"
  - "problem-solution-2026-03-13.md"
  - "brainstorming-session-2026-03-13.md"
  - "epics-conversation-pacing.md"
  - "epics-nerin-steering-format.md"
  - "epics-innovation-strategy.md"
  - "ux-design-innovation-strategy.md"
  - "public-profile-redesign-ux-spec.md"
  - "ux-design-specification.md (2026-02-12, outdated — included as context)"
  - "prd-2026-02-02-archived.md (baseline reference)"
  - "brainstorming-session-2026-03-23.md (homepage improvement — messaging, layout, UX)"
workflowType: 'prd'
brownfield: true
brainstormingCount: 1
researchCount: 0
projectDocsCount: 2
documentCounts:
  architectureDocs: 1
  problemSolutionDocs: 1
  brainstormingDocs: 2
  epicsDocs: 3
  uxDesignDocs: 4
  completedStoriesDocs: 0
  baselinePrdDocs: 1
classification:
  projectType: web_app
  domain: adaptive_conversational_ai
  vertical: personality
  complexity: high
  projectContext: brownfield
  strategicNature: platform
  valueContract: "~30 minutes of attention → personality intelligence no other product can produce → ongoing personality-aware life companion"
  competitivePositioning: "You don't have to explain yourself — the only product where an AI already understands who you are before you ask for help"
  competitiveAxes:
    - "vs personality tests (16Personalities/MBTI): better depth, personalized not generic, ongoing value not one-and-done"
    - "vs conversational AI (ChatGPT/Claude): guided UX, social outputs, structured insights, doesn't start from zero"
    - "vs therapists: more accessible, affordable, scalable — personality-aware companion at €0.30/conversation"
    - "vs coaching (BetterUp): consumer-accessible at €10/mo vs enterprise thousands/seat"
  strategicFrame: "Assessment is the onboarding, personality-aware companion is the product, experience quality is the competitive advantage. Personality front door for acquisition, self-care engine for retention"
  platformVsApplication:
    platform: "Adaptive conversation engine + personality data model + extraction pipeline"
    applications: "Portrait, relationship analysis, personal development, B2B team insights"
    extensibility: "Same engine could serve other verticals (career, learning, clinical)"
  complexityDrivers:
    - "Closed-loop real-time adaptation (Director model)"
    - "Dual-output system (structured data + generative narrative)"
    - "Network product dynamics (relationship analysis creates network effects)"
    - "Experience quality as survival requirement (15-min attention investment)"
    - "Self-funded cost constraint (every LLM call has budget impact)"
    - "Category creation — new market between personality tests, conversational AI, and therapy"
    - "Credibility chain — conversation quality → scores self-recognition → portrait proves capability → ambassador conversion"
    - "Multi-user data privacy (relationship analysis correlates data across users)"
    - "Psychological harm mitigation (output framing, disclaimers, liability)"
  credibilityChain:
    - "Nerin conversation quality builds initial trust"
    - "Free results (scores + archetype) create self-recognition"
    - "Free portrait deepens self-recognition, proves AI capability"
    - "Portrait quality drives trust in relationship analysis"
    - "Satisfied user becomes ambassador, recruits their people"
  monetization:
    free_mvp: "15-exchange assessment + portrait + OCEAN code + archetype + trait/facet scores + three-space navigation (Today/Me/Circle) + silent daily journal + mood calendar + free weekly descriptive letter from Nerin + relationship letter (static + real-time data grid + letter history) + Circle + invite ceremony + shareable public profile + archetype card sharing"
    subscription_mvp: "€9.99/mo — two MVP perks only: conversation extension with Nerin (+15 exchanges, Director model re-initialization from prior state), and automatic portrait regeneration bundled with the first extension per subscriber (no additional purchase). All other paid features (daily LLM recognition, mini-dialogue, prescriptive weekly letter layer, portrait gallery, Section D relational observations, annual letter regeneration, coach agent) are post-MVP"
    philosophy: "Data INPUT is free. Nerin's voice is free in MVP at two touchpoints (portrait, weekly descriptive letter) — the retention engine. Subscription buys more conversation with Nerin, nothing else in MVP. Post-MVP paid depth layer unlocks daily LLM, mini-dialogue, prescriptive weekly layer, portrait evolution, relational intelligence. Relationship letter is free because every letter = potential new user acquisition"
  growthHorizons:
    Phase1a_MVP: "Three-space product world: assessment → post-assessment focused reading → Me → daily silent journal → Sunday weekly letter → relationship letter + Circle → subscription conversion moment inside weekly letter (conversation extension + first portrait regen)"
    Phase1b: "Add paid depth layer: daily LLM recognition, mini-dialogue, prescriptive weekly letter layer, mobile wrapper, personality-typed notification scheduling, retention validation"
    Phase2a: "Coach agent + portrait gallery + Section D relational observations (D2/D3/D4), pattern detection, monthly reflection"
    Phase2b: "Agent expansion (Relationship, Career), cross-agent intelligence, smart nudges"
    Phase2c: "Annual relationship letter regeneration (Spotify Wrapped model, Year 1 Q4 at first-cohort anniversary)"
  growthModel:
    acquisition: "Relationship analysis invites (primary, free = zero friction), archetype card sharing, SEO knowledge library (archetypes, traits, facets, Big Five science, relationship/career guides — 175-235 pages), launch blitz (Product Hunt, HN, Reddit)"
    conversion: "Portrait self-recognition proves quality → subscription CTA for ongoing value. Personality front door for acquisition, self-care engine for retention"
    retention: "Three-space product world (daily silent journal, Sunday weekly letter from Nerin, relationship letter, Circle) as the free habit loop. Subscription (conversation extension + first portrait regen in MVP) deepens the Nerin relationship. Post-MVP paid depth: daily LLM recognition, mini-dialogue, prescriptive weekly layer, portrait gallery, Section D relational intelligence."
    ambassador: "Satisfied users recruit their people for free relationship analysis"
    viral: "Combined K ≈ 0.20-0.25 (archetype sharing + relationship invite loop). Negative-CAC: users invite new users for free"
  b2bOptionality: "Team management, group dynamics, therapist pre-screening tool"
  domainConcerns:
    - "LLM reliability and prompt compliance"
    - "Psychological harm mitigation"
    - "Multi-user data privacy for relationship analysis"
    - "Category creation risk (behavior change bet)"
---

# Product Requirements Document - big-ocean

**Author:** Vincentlay
**Date:** 2026-03-15

## Executive Summary

big-ocean is a personality-aware life companion platform built on the Big Five framework. The assessment — a 15-exchange adaptive conversation with Nerin, an AI dive master persona guided by the Director model (evidence extraction → coverage analysis → Nerin Director → Nerin Actor) — is the onboarding. It produces personality intelligence: OCEAN codes, nature-based archetypes (81 hand-curated), trait/facet scores, and a narrative portrait written as a personal letter from Nerin. The product is everything after: a personality-aware companion that helps users navigate life situations, relationships, and personal growth — because the AI already understands who they are.

**Target users:** Psychology-curious adults (25-40) who find traditional personality tests generic and want deeper, personalized insight they can share and use to understand their relationships — and eventually, ongoing personality-aware guidance for life navigation.

**Differentiator:** "You don't have to explain yourself." The only product where an AI already understands who you are before you ask for help. ChatGPT requires self-awareness to produce good advice; big-ocean does the self-awareness work for you through the assessment. This combines guided conversational UX, LLM-powered adaptive assessment, social sharing (archetype cards, public profiles), structured 2-person relationship letters, and a personality-aware companion layer. The assessment experience IS the marketing — conversation quality drives self-recognition, self-recognition drives sharing, sharing drives growth.

**Product shape: three-space architecture.** The authenticated product is organized around three spaces, not a dashboard: **Today** (ephemeral daily companion — silent journal check-in, mood calendar, weekly letter from Nerin), **Me** (persistent identity — portrait, archetype, scores, public face, subscription), and **Circle** (the few people you care about — relationship letters, invite ceremony). Assessment is an onboarding tunnel into this world, not a destination. `/today` is the default authenticated landing after first visit.

**Brand DNA: the Intimacy Principle.** Big Ocean is built for a few people, not a crowd. No count metrics, no follower language, no search, no recommendations, no sorting. Every feature celebrates depth and duration of fewer relationships instead of breadth of network reach.

**Jobs to be done:**

| # | Job | MVP | Monetized? | Retention? |
|---|-----|-----|-----------|-----------|
| 1 | "Help me understand why I am the way I am" | Assessment + Portrait (free) | Free (acquisition) | One-time |
| 2 | "Help me navigate a specific situation" | NOT SERVED (post-MVP: Coach agent) | Subscription | Event-based return |
| 3 | "Help me understand my relationship" | Relationship letter (free, static + real-time data grid) | Free (growth engine) | Occasional |
| 4 | "Help me grow over time" | Weekly descriptive letter from Nerin (free) | Free + post-MVP paid layer | Habitual return |
| 5 | "Help me process what I'm feeling today" | Silent daily journal + mood calendar (free) | Free MVP / Paid LLM recognition post-MVP | Daily return |

All five jobs are served at MVP. Jobs 1 and 3 anchor acquisition and growth. Job 5 is served via the **silent journal fork**: free users deposit mood + note into a calendar with no LLM response; Nerin's voice arrives in Sunday's descriptive weekly letter. Job 4 is the free weekly letter (descriptive). Jobs 2 and 4's paid depth layer is where post-MVP subscription revenue will live. Positioning: personality front door for acquisition, self-care engine for retention.

**Business model:** Free assessment + portrait + relationship letter + silent daily journal + free weekly letter from Nerin as acquisition and habit engine. Portrait is free — it's the "feel seen" moment that drives conversion. Relationship letter is free — every letter = potential new user acquisition (zero friction growth). Revenue comes from subscription (€9.99/mo) which in MVP unlocks **conversation extension with Nerin** (+15 exchanges to continue the assessment) plus **automatic portrait regeneration on the first extension**. Post-MVP paid perks include daily LLM recognition, mini-dialogue, prescriptive weekly letter layer, portrait gallery, and relational observations. Three-layer flywheel: Discovery (free, acquisition) → Relationship (free, growth engine) → Daily practice (free habit → paid depth). See [Product Scope](#product-scope) for the staged A→B strategy and phase triggers. Realistic revenue expectations: €10-30K year 1, €50-150K year 2 — the patient flywheel, not a moonshot.

**Current state:** Brownfield — hexagonal architecture, auth, CI/CD, cloud deployment, and infrastructure already built. Primary gaps: Nerin character quality (~40% → launch-ready), homepage conversion (load-bearing now that the anonymous path has been removed — cold visitors must commit to signup before experiencing Nerin), and the three-space navigation + weekly letter system (new surface area). The credibility chain (conversation → self-recognition → portrait revelation → trust → daily return → ambassador) requires every link to work at launch.

## Success Criteria

### User Success

**Conversation Engagement (the "stay" metric):**
- Users experience 2-3 "feel seen" moments during a 15-exchange conversation — moments where Nerin makes an observation about a pattern in the user's behavior or personality that resonates *(delivered by: FR3 Director model, FR6 portrait teasing, FR7 observation framing)*
- Users complete the full 15 exchanges without dropping out (completion rate target: >70%) *(delivered by: FR4 depth meter, FR5 milestones)*
- Mid-conversation dropout tracked by exchange number — specifically monitor exchanges 7-12 where novelty has worn off but payoff hasn't arrived
- Users feel the conversation was with a distinct character (Nerin as ocean dive master with marine metaphors), not a generic AI *(delivered by: FR2 persona, FR8 greeting)*

**Portrait Payoff (the "worth it" metric):**
- Users experience **self-revelation** when reading their portrait — not just "that's me" (recognition) but "I never articulated it that way but that's exactly what's happening" (revelation) *(delivered by: FR20 portrait generation, FR21 free portrait + subscription CTA)*
- Emotional impact measured via behavioral proxies: share rate, return visits within 48 hours, and time spent on portrait page as proxy for emotional engagement
- Portrait quality drives sharing behavior: users share archetype card or tell someone about the experience within 48 hours
- Portrait quality is high enough that users trust relationship analysis will be equally good

**Nerin Character Quality (current state: ~40%, target: launch-ready):**
- Nerin speaks as a distinct persona: ocean dive master, marine biology metaphors, warm but specific voice — NOT generic LLM tone
- "Feel seen" moments have *accent* — they land with emotional weight, not just factual accuracy. Nerin names the pattern AND connects it to something the user cares about. Constraint: feel-seen moments are only attempted when evidence confidence is high — a failed observation breaks trust
- Conversation includes encouragement: progress milestones ("we're getting somewhere interesting"), motivational moments ("that took courage to say"), celebration of depth ("you just named something most people never articulate")
- Distinct voice that users remember and describe to others

**Archetype Card & Social Identity:**
- Archetype card designed as a **curiosity trigger** — makes non-users want to know "what tribe are you in?" without needing to understand the system
- OCEAN code uses meaningful letters (e.g., "OCEAR" not "HHMHM") — each letter is descriptive: O(pen-minded), C(onscientious), E(xtravert), A(greeable), R(esilient). The example "OCEAR" shows one possible all-high + N-low combination; the full system has 15 unique semantic letters (3 per trait: Low/Mid/High). See the UX design specification for the complete letter map
- 81 hand-curated archetypes with evocative nature-based names ("The Beacon," "The Anchor," "The Pillar")
- Three tribe groups based on Openness (O-Group/G-Group/P-Group) create social belonging
- Public profile is where full explanation lives — scores, facets, archetype description, trait strata

### Business Success

**Primary metric: 100 completed assessments in the first 3 months post-launch**

**Initial seeding:** Founder seeds first ~20 users directly. Organic growth measured from month 2 onward.

**Organic growth signal:** Growth continues without founder-driven marketing. Measured by:
- QR scans / analyses initiated (leading indicator — each scan = potential new user)
- QR-accept-to-completion conversion rate (how many invited users finish their own assessment)
- Viral coefficient: each user brings >1 new user through relationship analysis QR flow + social sharing combined
- Archetype card shares triggering profile visits (secondary acquisition channel)

**Ambassador quality:** What ambassadors say when recommending matters more than invitation mechanics. Track qualitative signal: are users describing the experience as transformative ("this thing understood me better than anything") or transactional ("try this personality test")?

**Revenue signal (validation, not target):**
- Free→subscription conversion rate >3% of completed assessments
- Month-2 subscriber retention >70%
- MRR growth >10% month-over-month sustained for 3+ months

### Technical Success

**Conversation quality:**
- Director model produces territory coverage across ≥4 life domains per assessment (no single-topic lock-in)
- Nerin follows territory assignments from Director >70% of turns (prompt compliance)
- "Feel seen" observations derive from actual extracted evidence (not generic statements)

**Reliability:**
- Assessment completion without errors >99%
- Nerin response time <2s P95
- Portrait generation completes successfully >99%

**Cost:**
- Per-assessment cost (all LLM calls) stays within ~€0.30 budget
- Per-portrait cost stays within ~€0.20-0.40 (optimizable via model routing)
- Free-tier ongoing cost per user stays at ~$0.02-0.08/month (silent daily journal + one weekly letter LLM call)
- Subscriber ongoing cost: ~$0.35-0.75/month in MVP (conversation extension + first-extension portrait regen), with 93-97% gross margin at €9.99/mo

**Daily & weekly engagement (the "return" metric — new in this revision):**
- Day 7 return rate post-assessment >40% — users come back for first Sunday weekly letter from Nerin
- Day 30 retention >25% — daily silent journal habit + weekly letter rhythm established
- Sunday weekly letter open rate >60% — users anticipate Nerin's voice
- Silent daily check-in rate >30% of active users check in on any given day
- Qualitative: users describe big-ocean as "a companion" or "a place" they return to, not "a personality test they took"

### Measurable Outcomes

| Metric | Target | Timeframe | Why it matters |
|--------|--------|-----------|----------------|
| Completed assessments | 100 | 3 months | Primary success signal |
| Completion rate | >50% | Ongoing | Conversation quality proxy |
| Mid-conversation dropout | Monitor exchanges 7-12 | Ongoing | Identifies engagement valley |
| Archetype card share rate | >10% | Ongoing | Viral loop validation |
| Relationship analyses initiated | >30 | 3 months | Growth engine validation |
| Invite-accept→completion rate | >20% | Ongoing | Invite loop quality |
| Free→subscription conversion | >3% | Ongoing | Subscription value validation |
| Portrait emotional impact | Share rate >30%, return visit within 48h >40% | Ongoing | Self-revelation behavioral proxies |
| Territory compliance | >70% | Ongoing | Director model effectiveness |
| Nerin character distinctiveness | Qualitative | Pre-launch | Assessed via test sessions |
| Homepage bounce rate | <60% | Ongoing | Cold visitors stay long enough |
| Homepage → sign-up conversion | >5% | Ongoing | Homepage messaging drives assessment starts |
| Time to CTA click | <90s median | Ongoing | Messaging clarity |
| Day 7 return rate (post-assessment) | >40% | Ongoing | First weekly letter pulls users back |
| Day 30 retention | >25% | Ongoing | Daily journal + weekly letter habit |
| Sunday weekly letter open rate | >60% | Ongoing | Weekly ritual lands |
| Daily silent check-in rate | >30% of active users | Ongoing | Daily habit loop works |
| MRR | €300-800 | Month 6 | Revenue trajectory |
| MRR | €1,500-3,000 | Month 12 | Revenue sustainability |
| MRR | €5,000-10,000 | Month 18 | Quit-job readiness |
| Subscribers | 30-80 | Month 6 | Subscription validation |
| Subscribers | 150-300 | Month 12 | Growth confirmation |

### Phase Transition Triggers (MVP → Subscription)

The trigger to launch the subscription (Coach agent) is metric-based, not time-based. When 4 of 5 fire → launch Coach agent subscription:

| Trigger | Threshold |
|---------|-----------|
| Completed assessments | >1,000 |
| Free→subscription conversion | >3% |
| Viral coefficient | >0.5 |
| NPS on portrait | >50 |
| "Would talk to Nerin again?" | >40% yes |

### Phase 2 Success Criteria (Subscription)

| Metric | Target | Why it matters |
|--------|--------|----------------|
| Subscription conversion | >3% of completed assessments | Validates willingness to pay for ongoing value |
| Subscriber M1 retention | >70% | Coach agent delivers enough value to retain |
| Coach NPS | >50 | Personalized coaching feels different from generic AI |
| "Felt generic" feedback | <30% | The personality architecture is producing meaningfully better advice |
| Monthly reflection engagement | >60% of subscribers | Subscribers find the AI intelligence layer valuable |
| MRR | €1,500-3,000 | Month 12 revenue target |
| Subscriber churn | <6%/month | Sustainable business signal |

**If "Would talk to Nerin again?" <30%, the subscription model collapses.** big-ocean becomes a free personality assessment tool that generates value through relationship analysis virality — a sustainable free product, but not a business. Honest outcome — not every business needs to be a platform.

### Quit-Job Composite Signal

ALL five must be true before leaving the day job:

| Signal | Threshold |
|--------|-----------|
| MRR | ≥€5,000 |
| MRR growth | ≥15% MoM for 3+ consecutive months |
| Subscriber churn | ≤6%/month |
| Savings runway | ≥6 months |
| Acquisition channels | ≥2 working channels |

Alternative: negotiate part-time (4-day week) at month 3 if finances allow — lowest-risk capacity multiplier. Don't wait for funding.

## Product Scope

### MVP — Minimum Viable Product

The full journey (conversation → portrait → three-space product world → daily habit → weekly letter → relationship letter → social sharing) must work at launch. The credibility chain requires every link, AND the product must have somewhere for users to return after the assessment — assessment is onboarding, companion is product.

**Platform:** 15-exchange adaptive conversation with Nerin (dive master persona), Director model (evidence extraction → coverage analysis → Nerin Director → Nerin Actor), ConversAnalyzer v2 dual extraction, derive-at-read scoring (30 facets → 5 traits → OCEAN code → archetype).

**Product world (three-space architecture):**
- **Today** — default authenticated landing. Silent daily journal (mood + optional note, no LLM response), mood calendar, inline weekly letter card on Sundays, contextually-surfaced library article (2–3/week)
- **Me** — persistent identity page. Portrait, identity hero (archetype, OCEAN code, radar, confidence), public face control center, subscription pitch, Circle preview, gear icon → `/settings`
- **Circle** — the few people you care about. Full-width person cards with archetype, OCEAN code, duration, "last shared" signal, "View your dynamic" link, invite ceremony at the bottom

**Application:**
- Free assessment + free portrait (Nerin's letter, focused-reading transition — the emotional peak)
- Free silent daily journal + mood calendar
- Free weekly letter from Nerin (Sunday 6pm, LLM-generated descriptive letter, push notification)
- Free relationship letter (static letter + real-time data grid + letter history + "Your Next Letter" anticipation)
- Free Circle with invite ceremony (reward-first copy, privacy-led)
- Public profile + archetype card sharing (unauthenticated, SEO, SSR)
- Homepage + pre-conversation onboarding (load-bearing for conversion since anonymous path removed)
- Subscription flow (€9.99/mo) unlocking **conversation extension** (+15 exchanges to continue with Nerin, Director model re-initialization) and **automatic portrait regeneration on the first extension** — the sole paid perks in MVP

**Critical gaps:**
1. Nerin character quality (~40% → launch-ready) — dive master persona, encouragement system, "feel seen" accent, distinct memorable voice
2. Three-space navigation + daily/weekly loop — new surface area replacing the old linear "home → chat → Me (portrait + identity) → done" dead end
3. Weekly letter generation pipeline — the retention engine AND the only subscription conversion moment in MVP
4. Post-assessment focused-reading transition — protects the portrait's emotional weight
5. Homepage conversion — cold visitors must commit to signup before experiencing Nerin

Infrastructure already built: auth, hexagonal architecture, Railway, CI/CD, Drizzle migrations, Effect-ts HTTP API.

See [Project Scoping & Phased Development](#project-scoping--phased-development) for detailed feature breakdown, post-MVP phases, and risk mitigation.

### Strategic Direction: A→B — The Staged Platform Play

Not "build a personality test" or "build an agent platform" — build A then B, sequenced with metric-based triggers.

**Phase 1 (Prove the Foundation):** Launch assessment + portrait + three-space companion world + weekly letter + relationship letter + subscription flow with conversation extension as the sole paid perk. Prove the credibility chain AND the daily/weekly habit loop work. Hit validation metrics.
**Phase 2 (Build the Intelligence Layer):** Launch paid daily LLM recognition, mini-dialogue, prescriptive weekly letter layer, portrait gallery + regeneration, Section D relational observations, and coach agent. Design Phase 2 during Phase 1 so you can ship fast when triggers fire.

MVP focuses on both (a) the first-time user experience (assessment → portrait → emotional peak) and (b) the bridge that turns first-timers into daily users (return seed → silent journal → Sunday letter). Without the bridge, post-assessment churn is near-total.

### Free vs Paid Tiers

| Layer | Free (MVP) | Subscription (€9.99/mo, MVP) |
|-------|------------|------------------------------|
| 15-exchange assessment | ✅ | — |
| Portrait (Nerin's letter) | ✅ | — |
| OCEAN code + archetype + scores | ✅ | — |
| Three-space navigation (Today/Me/Circle) | ✅ | — |
| Silent daily journal + mood calendar | ✅ | — |
| Weekly descriptive letter from Nerin | ✅ | — |
| Relationship letter (static + real-time data grid) | ✅ | — |
| Circle + invite ceremony | ✅ | — |
| Public profile + archetype card sharing | ✅ | — |
| **Conversation extension (+15 exchanges with Nerin)** | — | ✅ |
| **Portrait regeneration on first extension** (bundled welcome) | — | ✅ |
| *Post-MVP:* Daily LLM recognition from Nerin | — | ⏳ |
| *Post-MVP:* "Tell me more" mini-dialogue | — | ⏳ |
| *Post-MVP:* Prescriptive weekly letter layer ("For the week ahead", "Zooming out") | — | ⏳ |
| *Post-MVP:* Subsequent portrait regenerations + portrait gallery | — | ⏳ |
| *Post-MVP:* Section D relational observations (D2–D4) | — | ⏳ |
| *Post-MVP:* Annual relationship letter regeneration | — | ⏳ Year 1 Q4 |
| *Post-MVP:* Coach agent + specialized agents | — | ⏳ |

**Principle:** Data INPUT is free. AI INTELLIGENCE on that data is mostly free in MVP (portrait, weekly descriptive letter, relationship letter) and gradually becomes paid depth post-MVP (daily recognition, prescriptive weekly layer, mini-dialogue, relational observations). The MVP paid hook is concrete and tied directly to the moment users love — keep talking to Nerin. Every relationship letter is a potential new user at zero cost. Subscription flows through the habit loop, not through portrait gating.

### Post-MVP Phases

**Phase 1b — Validate Retention + Add Paid Depth (1,000 → 10,000 users)**
- Paid daily LLM recognition — subscriber check-ins trigger personalized Nerin recognition in journal format, tight LLM call with rich user context (facets, evidence, archetype, pattern signals like streak / silence break)
- Subscriber "Tell me more" mini-dialogue — tapping on a recognition opens a 3–5 exchange scoped conversation with Nerin who reads the actual note
- Prescriptive weekly letter layer for subscribers — "For the week ahead" focus + micro-action, "Zooming out" cross-week patterns, library article link, reflective prompt. Free version stays descriptive and complete
- Mobile wrapper with push notifications (personality-typed trigger scheduling)
- Post-assessment survey ("Would you talk to Nerin again?")
- Viral loop optimization
- Exit criteria (5 of 6): >3,000 assessments, viral coeff >0.5, daily check-in Day 30 retention >40%, Sunday weekly letter open rate >60%, "talk to Nerin again" >40%, free→subscription conversion >3% sustained

**Phase 2a — Coach Agent + Expanded Subscription**
- Coach agent (beta 50-100 users first) — event-driven ("I have a situation")
- Portrait gallery + portrait regeneration on subsequent conversation extensions (beyond the first-extension welcome bundle)
- Pattern detection + monthly reflection
- Growth Journal deep sessions
- Life Events + Patterns sections on Me page
- Section D — Relational observations (D2), "Take care of" suggestions (D3), Alignment patterns (D4). Per-subscriber, harm-reduction framing, dynamics-not-deficits rule
- Crisis detection guardrails
- Exit criteria: >500 subscribers, conversion >3%, M1 retention >70%, Coach NPS >50, reflection engagement >60%, MRR >€5,000

**Phase 2b — Agent Expansion**
- Relationship agent (interpersonal dynamics)
- Career agent (career guidance)
- Cross-agent intelligence (agents share insights, not just data — Journal detects patterns → suggests Coach)
- Smart nudges (personality-calibrated, max 2x/month)
- Complete portrait at 30/30 facet coverage
- Relationships + Growth dashboard sections

**Phase 2c — Annual Ritual**
- Annual portrait regeneration ("Personality Wrapped")
- Year-in-review dashboard

### Design Now, Build Later

During Phase 1, design (don't build): conversation schema for multiple session types, agent type field on conversations, personality context injection pattern, per-agent session memory, crisis detection guardrails, portrait gallery UI (storage is MVP per FR73), confidence milestone notification system, paid daily LLM recognition + mini-dialogue architecture (FR69, FR69a), prescriptive weekly letter layer (FR88), Section D relational observations (FR32a), annual relationship letter regeneration job (FR35a). The following previously-deferred items are now MVP: daily check-in data model, mood calendar, three-space navigation, weekly summary data model and generation job, subscription billing flow (for conversation extension), conversation extension mechanics.

## User Journeys

### Journey 1: The Curious First-Timer — Léa

**Who she is:** Léa, 28, UX designer in Lyon. Interested in psychology, has taken 16Personalities twice but found the results generic. Sees a friend's archetype card on Instagram — "The Beacon" with an ocean-themed visual and an OCEAN code she doesn't recognize. She's intrigued: *what's my code?*

**Opening Scene:** Léa taps the card link, lands on her friend's public profile. The archetype name and OCEAN code are front and center — a one-line hook beneath. She scrolls: detailed scores and facet bars are there for the curious, giving a scientific credibility ("this isn't astrology") without overwhelming the first impression. The archetype description feels specific — not "you're creative and empathetic" but a narrative that reads like someone actually *knows* this person. At the bottom: "Discover your own." She signs up, receives a verification email, confirms her address, and enters the platform.

**Rising Action:** Nerin greets her — not with a form, but with a question about her daily routines. The tone is warm, specific, slightly playful. Ocean metaphors. A depth meter sits on the left edge of the screen, quietly tracking the conversation's progress. By exchange 5, Nerin says something like: "You mentioned you redesign your workspace every few months but you've kept the same morning routine for years. That's an interesting tension — the part of you that craves novelty has a deal with the part that needs anchoring." Léa pauses. That's... exactly right. She's never thought about it that way.

Around exchange 9, she hits a natural lull — novelty has worn off. (Note: the specific exchange number is illustrative — steering is driven by energy and telling signals, not fixed turn numbers.) But the depth meter has been climbing, she's past the 50% milestone marker, and Nerin drops a progress signal: "We're getting somewhere interesting." She stays.

**Climax:** Exchange 13. Nerin makes an observation about how Léa handles conflict at work vs with her partner — she avoids in one domain, confronts in the other. The pattern lands with emotional weight. During the conversation, Nerin has been teasing: he's seen things about her, and he wants to show her. The 75% milestone passes. She finishes the 15 exchanges genuinely curious about what Nerin has written.

**Resolution — The Post-Assessment Transition:** Exchange 15 ends with Nerin's distinct closing — one last observation, warm and specific, and then the input field fades. A single button appears below: **"Show me what you found →"** in Léa's voice, like she's speaking to Nerin. She taps it.

She lands on the **focused portrait reading** route **`/me/$conversationSessionId?view=portrait`** (canonical URL shape; legacy `/results/...` may redirect). Centered OceanSpinner, and one line in Nerin's voice: *"Nerin is writing your letter..."* No competing content. Nothing to click. Just waiting. Then the spinner resolves and the letter fades in — full screen, warm background, letter format, max-width 720px. She reads it uninterrupted. The emotional peak of the product. At the end of the letter, a small warm link: *"There's more to see →"*

She taps and arrives at the **session-scoped Me surface** **`/me/$conversationSessionId`** — her identity hero (archetype "The Beacon", OCEAN code, radar chart, confidence), the portrait inline for re-reading, her public face (default private), the subscription pitch (in this MVP: "Continue your conversation with Nerin — +15 exchanges + a new portrait"), and at the bottom, Nerin's voice one more time: *"Tomorrow, I'll ask how you're doing. Come check in with me."* Paired with a Nerin-voiced notification permission request: *"I'd like to check in with you tomorrow. Mind if I send a quiet note?"* Léa grants it. A first daily prompt is scheduled for tomorrow at a profile-appropriate time.

Léa screenshots her archetype card and sends it to three friends: "You have to try this."

**Recovery beat — what if the portrait doesn't land?** If Léa reads the portrait and thinks "that's not me," the credibility chain breaks. Behavioral signals (no share, no return visit) capture this. The conversation extension subscription becomes the recovery path — more exchanges produce better evidence, which produces a richer, more accurate letter from Nerin (bundled automatically on first extension). Since the initial portrait is free, there's no buyer's remorse — just a motivation gap to bridge.

**Capabilities revealed:** Sign-up flow, 15-exchange conversation with Nerin, Director model (territory coverage, feel-seen moments), depth meter + progress milestones (25%/50%/75%), Nerin teasing portrait during conversation, closing exchange with "Show me what you found →" button (FR93), focused reading view with generating state (FR94) at `/me/$conversationSessionId?view=portrait`, end-of-letter transition to session-scoped Me at `/me/$conversationSessionId` (FR95), return seed with Nerin-voiced notification permission request (FR96), three-space product world with free navigation across Today/Me/Circle after the post-assessment sequence (FR101), archetype card sharing, public profile as landing page.

### Journey 2: The Invited User — Marc

**Who he is:** Marc, 34, Léa's partner. Not into personality tests. Léa completed her assessment and wants to understand their relationship better.

**Opening Scene — The QR Flow:** Léa opens the QR drawer in the app. Marc scans the code with his phone (or opens the URL it contains). He lands on a simple screen: Léa's name, Accept and Refuse buttons, and a short disclaimer explaining that accepting means sharing his personality scores with Léa to generate their relationship analysis. Marc understands: Léa wants to understand their relationship better, and it starts with a 30-minute conversation about him. He knows what Léa got out of it — she's been talking about her portrait — so there's social proof before he even starts. He accepts, creates an account, verifies his email, and enters the platform. Note: Marc is the highest-intent visitor type — he already has social proof from his partner. If he visits the homepage before completing signup, the generic self-discovery narrative is a mismatch. The homepage content must work for visitors who already have a reason to be here and just need a clear path forward (FR66).

**Rising Action — The Skeptic's First Exchanges:** Marc meets Nerin and expects a quiz. Instead, Nerin asks about his weekend — what he does when nothing is planned. Marc answers briefly. Exchanges 2-5 are short, low-energy responses. The Director model detects this: low telling score, guarded energy. It responds by keeping territories light (daily routines, comfort zones), using soft entry pressure, and letting Marc set the pace. Nerin doesn't push — she stays curious without demanding depth. But Nerin isn't passive either — by exchange 5, she drops something specific enough to catch Marc's attention: an observation about the *way* he talks about routine, not just what he says. By exchange 6, Marc notices Nerin keeps circling around structure — meal prep, workout schedule, project timelines — and Nerin says: "You build systems for things most people leave to chance. I'm curious what happens when the system breaks." Marc laughs — that's exactly what Léa says about him. The depth meter starts climbing. He leans in.

**Climax:** Exchange 12. Nerin connects something Marc said about his father's expectations to how he handles feedback at work. Marc didn't expect to go there. The observation is specific enough that he feels *seen*, not analyzed. Nerin teases what he's been noticing — there's a letter waiting at the end. Marc finishes the conversation with a sense that this thing actually understood something real.

**Resolution — The Relationship Analysis:** Marc gets his **assessment output** — a different archetype than Léa, but they share letters in their OCEAN codes, which makes the similarities visible at a glance. Nerin's letter arrives — Marc reads his portrait, a personal letter that names things about him he's never articulated. No payment required — the portrait is free.

Now both assessments are complete — the relationship analysis generates. When they open it, a ritual screen greets them: a suggestion to find a quiet moment, sit down together, and discuss what they discover. The ritual has a single Start button — no skip option. They choose to read it side by side. First, the data grid — a visual comparison of their traits and facets, showing where they align and where they diverge. Then, the narrative — a celebratory text that names the dynamic they've been navigating for years but never articulated. It's not clinical, it's warm: "You two have a deal — he builds the structure, you bring the disruption. Neither of you signed up for it, but it works." They talk about it over dinner. Marc tells his friend Thomas: "It's not what you think — it's actually good."

**Capabilities revealed:** QR flow (drawer + scan/URL), Director model adaptation for low-motivation/guarded users (soft pressure, light territories, early hook), depth meter + milestones, free relationship analysis generation (triggered when both complete), ritual suggestion screen, cross-profile data correlation, OCEAN code comparison (shared letters = shared traits), free portrait as Nerin's letter, conversion of skeptic into ambassador.

### Journey 3 (Illustrative — Post-MVP): The Returning Subscriber — Léa

**Who she is:** Same Léa, 3 months later. She subscribed after her portrait landed. Something happened at work — a conflict with a colleague that's been building — and she needs to process it.

**The return trigger:** Léa doesn't open big-ocean because of a notification or habit. She opens it because life served up a situation. "Something is happening in my life. I need to process it. I want insight that's specific to who I am — not generic advice." This is Job 2: "Help me navigate a specific situation."

**The Coach session:** She opens the Coach agent. She doesn't have to explain who she is, how she handles conflict, or what her patterns are — Nerin already discovered all of that during the assessment. The Coach already knows she avoids conflict at work but confronts it with her partner. It already knows her need for external validation. The conversation starts from understanding, not from zero. 5-8 exchanges. Specific, actionable, personality-aware. Cost: ~€0.15.

**The compound effect:** After the session, the Coach notes a pattern: this is the third time in two months Léa has brought up situations involving authority figures. It suggests a deeper session with the Growth Journal. The cross-agent intelligence creates a usage flywheel within the subscription.

**Why this matters strategically:** Léa didn't return because of a feature. She returned because life happened. The product is there when she needs it — a "good friend, not needy friend." Each conversation enriches the personality model. After 6 months, switching cost emerges naturally — the accumulated understanding IS the moat.

**This journey is illustrative — no FRs yet.** It describes the Phase 2 vision to be validated after Phase 1 triggers fire.

### Journey 4: The Public Profile Visitor — Thomas

**Who he is:** Thomas, 31, Marc's friend. He's not going to sign up today. He sees Marc's archetype card in a group chat — "The Anchor" with an OCEAN code and an ocean-themed visual — and taps the link out of curiosity.

**Opening Scene:** Thomas lands on Marc's public profile. No account needed. The archetype name, OCEAN code, and a framing line — "[Name] dove deep with Nerin — here's what surfaced" — lead the page. Simple, memorable, designed to be *talkable*. Below, detailed trait scores and facet bars are available for those who want to dig in — the scientific data gives credibility without overwhelming the first impression.

**Rising Action:** Thomas doesn't scroll far. He sees the archetype name, thinks "huh, that's very Marc," and goes back to the chat. But the profile did its job — it gave him something to say. Someone in the group chat asks what "The Anchor" means. Marc explains. Someone else says "I bet I'd be something different." That conversation — not the profile — is the actual conversion engine. The archetype name enters the friend group's vocabulary. They start calling Marc "The Anchor" as a joke.

**Climax:** Thomas doesn't convert today. But when a third friend shares their card a week later, Thomas compares their OCEAN codes and notices shared letters. The system's social currency is working — comparison is organic, not forced. The detailed data on the profiles gives the whole thing a scientific feel: this isn't a buzzfeed quiz.

**Resolution:** Thomas signs up three weeks later after seeing multiple friends share their cards. The cumulative exposure converted him — no single moment, but repeated social proof, FOMO, and the curiosity of "what would my code be?"

**Capabilities revealed:** Public profile rendering (no auth required), OG meta tags for social sharing, archetype card visual (designed for memorability and talkability), trait/facet score visualization (depth for credibility, not front-loaded), OCEAN code as social comparison object, CTA to assessment, SEO/social preview optimization.

### Journey 5: The Founder — Vincent (admin/ops)

**Who he is:** Vincent, founder and sole operator. He needs to monitor the platform's health, seed initial users, and track growth signals.

**Opening Scene:** Vincent checks the admin view after seeding his first 20 users. He needs to know: how many completed? Where did they drop off? Are the LLM costs within budget?

**Rising Action:** He reviews completion rates — 15/20 completed. The 5 dropouts all happened between exchanges 8-11. He checks the Director model logs: those sessions got stuck in a single territory for 4+ consecutive turns. Steering compliance was below 50% for those sessions. He adjusts prompt parameters and monitors the next batch.

**Climax:** Month 2. Vincent sees the first organic signups — users he didn't seed. Relationship analysis QR scans are driving new completions. He tracks the viral coefficient: 1.3 — each user is bringing slightly more than one new user. Subscription conversions trickle in: 4% of completed assessments convert at €9.99/mo. The unit economics work — 96-98% gross margin per subscriber. Then he sees a user who shared their archetype card within minutes of unlocking their portrait, followed by a return visit the next day and a message to a friend. That's the moment he knows the product is real — not the metrics, the behavioral signal behind the metrics.

**Resolution:** Vincent monitors cost per assessment (~€0.30 on Haiku), portrait generation costs (~€0.20-0.40 on Sonnet), and platform reliability (99.2% completion without errors). He's watching the ambassador quality signal: early users describe the experience as "it actually understood me" rather than "try this test." The product is working.

**Capabilities revealed:** Admin dashboard/monitoring, completion funnel analytics, mid-conversation dropout tracking by exchange number, steering compliance metrics, cost tracking per assessment/portrait, viral coefficient measurement, revenue reporting, error monitoring, Director model observability.

### Journey 6: The Cold Visitor — Inès

**Who she is:** Inès, 32, product manager in Paris. She stumbles onto the homepage from a Google search about personality assessments. She's never heard of Big Ocean, doesn't know the Big Five, and has no social proof from friends. She has 10 seconds of attention to give.

**Opening Scene — The First 3 Seconds:** Inès reads a headline that stops her — not a comparison to other tests (she hasn't taken any), but a promise that lands: something about discovering a part of yourself you've never been able to articulate, and an AI that keeps understanding you from there. Below, a single line of context: a 30-minute conversation that writes you a personal letter about who you are — completely free. One CTA. No competing options. She's intrigued — that's a specific, unusual promise, and it hints at something ongoing, not just a one-time result.

**Rising Action — The Scroll:** She scrolls. The page doesn't shift into a sales pitch — it stays in conversational format. She sees Nerin say something to a user that's startlingly specific: a pattern observation that feels like it could only come from a real conversation. It's not a feature description — it's proof of depth. A few beats later, a short excerpt from a portrait — a paragraph that reads like a letter from someone who knows you. Not generic. Not flattering. *Specific.* She thinks: "I want to know what it would say about me." The page addresses the question forming in her head: "Is 30 minutes a lot?" A beat explains what the time feels like — not a quiz, not awkward, more like a conversation that keeps surprising you. Another beat mentions that the assessment and portrait are completely free. She registers: no paywall, no credit card required. Then she sees a section showing what happens *after* the portrait — daily check-ins that connect your mood to your personality, coaching that already knows who you are, a growth timeline. This isn't a quiz — it's a companion. Further down, the founder's own portrait excerpt — his struggles, his vulnerability, why he built this. It feels personal, not corporate. She trusts it.

**Climax — The Decision:** Inès doesn't need to be convinced the method is better than a quiz. She needs to believe the output will be worth 30 minutes. The portrait excerpt did that. The Nerin conversation snippet did that. The "beyond the portrait" section showed her this could be more than a one-time experience. The founder's story made it feel real. The free-product transparency removed the last friction. She clicks the CTA.

**Resolution:** She signs up, verifies her email, and meets Nerin. She came in cold and converted on four things: a sharp hook, concrete proof of output quality, a glimpse of ongoing value, and zero pricing surprise.

**Capabilities revealed:** Homepage messaging (FR59), universal hook with ongoing value promise (FR60), single primary CTA (FR61), portrait excerpt as early proof (FR62), Nerin conversation preview showing character depth (FR63), fear-addressing content for process anxiety and time commitment (FR64), free-product transparency as trust signal (FR65), multi-persona content that works for zero-context visitors (FR66), founder story block (FR84), beyond-the-portrait self-care teaser (FR85).

### Journey 7: The Daily Return — Léa Becomes a Daily User

**Who she is:** Same Léa, 6 days after completing her assessment. The afterglow is fading. She's reread her portrait twice. She screenshot-shared it to three friends on Day 0. She accepted the notification permission Nerin asked for on Me page at the end of the post-assessment flow. Now it's Monday morning at 9:12am, and she's about to find out if Big Ocean is a one-time thing or something more.

**The trigger:** A notification arrives: *"How are you feeling this morning?"* — quiet, no badge count, no urgency. Léa opens the app. She lands on the Today page — her daily home, not the Me tab. Today is the default now.

**The check-in:** Nerin's prompt sits at the top: *"How are you feeling this morning?"* Below it, five mood options. Seven week-dots — today empty, the other six empty too (first week). She taps "Uneasy" and types a short note: *"Can't focus, everything feels urgent but nothing actually is."* She taps Save.

**What happens next — silence, and a promise:** The page shifts. Her entry is anchored at the top in journal format — mood + note, clean typography, warm background. Below it, seven dots with today now filled. One quiet line beneath: *"Nerin will write you a letter about your week on Sunday."* No LLM response. No Nerin recognition. No "thank you for sharing." Just her own entry, the week dots, and the quiet anticipation of Sunday.

At first Léa is slightly disappointed — she expected Nerin to say something. But then the stillness lands differently. Nerin isn't hovering. The page feels like a private journal, not a feed. No engagement loop. She closes the app.

**Day 2, 3, 4.** She checks in most mornings. Some days she types a note, some days just the mood. The week dots fill in. Nothing happens day to day — and that's the point.

**Sunday 7:03pm:** A notification arrives: *"Your week with Nerin is ready."* Léa opens it and lands on a focused reading view — the same visual language as her portrait. A letter. *"Dear Léa,"* it opens. Two paragraphs about the pattern of her week — not a report, an observation. Nerin names the Monday-Tuesday uneasiness, connects it to her high Conscientiousness and the way Sunday evening already anticipates Monday's unfinished tasks. The letter names a specific thing she said on Wednesday and calls back to it. It ends with Nerin's sign-off and one more line: *"I have more I want to say about what comes next."* Below that, a soft CTA — subscribe to unlock the fuller weekly letter, or "Not right now."

Léa reads the letter twice. She doesn't subscribe yet. She closes the app with a different feeling than Day 0 — not the revelation of the portrait, but the quiet recognition that Nerin noticed. Her streak of silence has paid off. She'll check in again tomorrow.

**Why this matters strategically:** The silent fork is the Phase 5→6 bridge — the single most important retention mechanic in the product. 90% of post-assessment users churn inside a week if there's nothing to return to; the silent journal + weekly letter is the something. Free-tier LLM cost stays at ~$0.02–0.08/month per active user (one weekly letter call, no daily LLM). Nerin's voice becomes rare and precious — the weekly letter arrives with more weight because the user hasn't heard from Nerin since their portrait. Subscription conversion moves downstream to the fuller letter at Week 3+, exactly when trust has compounded.

**Capabilities revealed:** Three-space navigation with `/today` as default landing (FR101), silent daily check-in with mood + note (FR67, FR68), weekly anticipation line (FR68a), mood calendar (FR70), three-level note visibility (FR71), free weekly summary LLM generation (FR86, FR87), push notification + focused reading route (FR89, FR90), soft conversion CTA (FR91), scheduled daily prompt per personality profile (FR96), return seed → weekly letter bridge.

### Journey 8: Subscription Conversion at Week 3 — Léa Extends the Conversation

**Who she is:** Same Léa, 22 days post-assessment. She's been checking in most mornings (17/22 days). She's read three weekly letters from Nerin now — each one picking up threads from her check-ins, naming patterns, saying things about her that feel unmistakably seen. She's rereading her original portrait occasionally on her Me page. She's sent the archetype card to five friends by now.

**The trigger:** Sunday 7pm, the third weekly letter arrives. This one notices something new: across three weeks, every time Léa's notes mention work, she uses control language — *"should", "need to", "have to"*. Nerin names it: *"You've been carrying the shape of obligation for three weeks. I'm curious what happens when you stop narrating your life as a list of things you owe."* It lands like a gut punch — true and unexpected.

**The conversion moment:** At the end of the letter, the same soft CTA she's seen for three weeks: *"I have more I want to say about what comes next. With a subscription, I can write you a fuller letter each week — with what to try, what patterns I'm seeing across weeks, and what I think might help in the week ahead. Or: continue our conversation. Extend your 15 exchanges with another 15, and I'll write you a new portrait afterwards that reflects everything I've learned about you since."* Two options. One is the fuller weekly letter (post-MVP). The other, in this MVP, is *"Continue our conversation — €9.99/mo."*

Léa taps Continue. €9.99/mo, Polar embedded checkout. She subscribes. A moment later the app shows her the conversation extension entry: *"When you're ready, Nerin is waiting. She remembers everything."* Léa taps.

**The extension:** The conversation resumes. The Director model has initialized from her prior session's final state and evidence — Nerin doesn't ask her what her name is or what she does for work. The first exchange picks up a thread from Week 1 that never fully developed. 15 more exchanges. New territory: how Léa handles responsibility, what she's avoiding in her career. New evidence, richer coverage.

**The first-extension portrait regeneration:** At the end of the extended conversation, Nerin writes a new portrait — automatically, bundled with the first extension. Léa reads it in the same focused reading view she saw the first time. This portrait is different. It picks up everything the first one saw and adds layers: the career thread, the pattern of obligation, a specific tension between her creative ambition and the systems she builds to contain it. The first portrait stays in her Me page as "previous version." She has two letters from Nerin now. She screenshots a paragraph and sends it to her closest friend.

**Why this matters strategically:** Conversion doesn't happen at the end of the assessment. It happens after the habit has compounded — after trust is earned, after three weekly letters have landed, after Nerin has already proven she notices things. The conversation extension is the strongest paid hook in MVP because it ties payment directly to the thing users already love (Nerin). The first-extension portrait regeneration is the payoff — a concrete, readable artifact users walk away with. This is Act 3 of the three-act conversion story: Day 0–7 build habit, Day 7–21 show the pattern, Day 21+ the natural unlock inside the weekly letter they already read.

**Capabilities revealed:** Weekly summary with embedded conversion CTA (FR91), subscription flow via embedded checkout (FR47), conversation extension +15 exchanges (FR10), Director model re-initialization from prior session state (FR25), automatic portrait regeneration bundled with first extension (FR23), prior portrait preserved as "previous version" on Me page (FR25), Nerin voice continuity across portrait, weekly letter, and conversation extension.

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|--------------------------|
| **Léa (First-Timer)** | Sign-up with email verification (FR50, FR50a, FR50b), conversation (FR1), Director model (FR3), depth meter + milestones (FR4, FR5), Nerin portrait teasing (FR6), free portrait as Nerin's letter (FR20, FR21), closing button + focused reading transition (FR93, FR94, FR95), return seed + notification permission (FR96), three-space landing (FR101), archetype sharing (FR44, FR46), public profile landing (FR39) |
| **Marc (Invited)** | QR flow (FR28), Director model adaptation for guarded users (FR3), early hook for skeptics (FR6), depth meter (FR4), relationship letter — static + data grid (FR29), ritual suggestion (FR31), OCEAN code comparison (FR39), ambassador conversion (FR33) |
| **Léa (Returning Subscriber, illustrative)** | Coach agent, personality-aware advice, cross-agent intelligence, event-driven return — no FRs yet (post-MVP) |
| **Thomas (Profile Visitor)** | Public profile (FR39, FR42), OG tags (FR41), archetype as social object (FR46), OCEAN code comparison (FR39), CTA funnel (FR43) |
| **Vincent (Founder)** | Admin monitoring (Nice-to-Have), completion funnel (FR24), dropout analytics (Nice-to-Have), steering compliance (FR3), cost tracking (FR55), viral metrics (Nice-to-Have) |
| **Inès (Cold Visitor)** | Homepage messaging (FR59), universal hook with ongoing value (FR60), single CTA (FR61), portrait excerpt as proof (FR62), Nerin conversation preview (FR63), fear-addressing content (FR64), free-product transparency (FR65), multi-persona content (FR66), founder story (FR84), beyond-the-portrait self-care teaser (FR85) |
| **Léa (Daily Return)** | Three-space navigation with `/today` default (FR101, FR102), silent daily check-in (FR67, FR68), weekly anticipation line (FR68a), note visibility levels (FR71), mood calendar (FR70), free weekly summary LLM generation (FR86, FR87), push notification + focused weekly letter route (FR89, FR90), soft conversion CTA (FR91), scheduled personality-typed daily prompt |
| **Léa (Subscription Conversion at Week 3)** | Weekly letter embedded CTA (FR91), subscription flow via embedded checkout (FR47), conversation extension +15 (FR10), Director model re-initialization from prior state (FR25), automatic portrait regeneration on first extension (FR23), prior portrait preserved as "previous version" (FR25) |

**Critical path:** Journeys 1→2 form the growth loop. The free portrait is the credibility moment; the subscription CTA is the monetization conversion moment. The relationship ritual transforms the product from individual tool to shared experience. Journey 5 ensures operational visibility.

**Two acquisition channels:** Journey 4 (Thomas) and Journey 6 (Inès) are complementary non-user acquisition paths. Thomas arrives via social sharing (profile links, archetype cards in group chats) — his conversion is cumulative, driven by repeated exposure and social proof. Inès arrives via organic search or direct link with zero context — her conversion is immediate, driven by homepage messaging clarity and output proof. Journey 4 is the passive/social channel; Journey 6 is the organic/direct channel. Both feed Journey 1.

## Domain-Specific Requirements

These constraints protect users from the inherent risks of AI-powered personality analysis. They're not optional — they're the reason users trust the product.

### Psychological Framing & Liability

- **Greeting disclaimer:** Nerin's first message includes a natural, non-clinical framing: "this is not therapy" — integrated into the conversation tone, not a legal banner
- **Language constraints:** Nerin never uses diagnostic language (no "you have...", no DSM terms, no clinical labels). Observations are framed as patterns and curiosities, not diagnoses
- **Third-party protection rule:** Nerin never characterizes people the user talks about. Nerin can observe the user's *experience* of a relationship ("the way you describe your mother, there's a weight to it") but never labels the other person ("your mother sounds controlling")
- **Permission to disagree:** Nerin's observations are invitations to explore, not declarations. When a user pushes back, Nerin acknowledges the pushback, offers an alternative framing, and redirects to a different topic only if the user rejects the observation a second time
- **Portrait framing:** Nerin's letter describes patterns and tensions, not conditions. "You tend to..." not "You suffer from..."
- **Relationship analysis framing guardrails:** Differences are framed as *dynamics*, not deficits. No blame language. No one is the problem. The ritual screen reinforces: "This analysis describes your dynamic, not who's right or wrong"
- **Relationship analysis content boundary:** The analysis describes the dynamic *between* two people — never exposes individual vulnerability data (inner struggles, pressure responses). Only relational patterns appear
- **Archetype positivity audit:** All 81 archetypes must be frameable as a strength. Every name, description, and portrait framing should make the user feel proud of their result
- **Product identity:** Friendly conversation, not clinical assessment

### Multi-User Data Privacy (Relationship Analysis)

- **Visibility between users:** Each user can see the other's public profile data (scores, confidence, archetype) — unless that profile is set to private. Binary visibility only — fully public or fully private. No intermediate state (e.g., hiding scores while showing OCEAN code)
- **Relationship analysis access:** Both users can see the full relationship analysis
- **Per-relationship consent:** Initiator implicitly consents by generating the QR token. Recipient consents by accepting on the QR accept screen, which includes an explicit data-sharing disclaimer (trait and facet scores shared for analysis generation). Both users must have completed assessments. Single consent gate with informed consent
- **Account deletion:** If one user deletes their account, the relationship analysis is deleted for both parties
- **Data correlation boundary:** Relationship analysis does not expose raw conversation transcripts to the other party

### Data Retention & Transcript Security

- **Transcript storage:** Raw conversation transcripts stored indefinitely for MVP (needed for future conversation extension in subscription)
- **User awareness:** Users informed during onboarding that conversation data is stored
- **Encryption at rest:** AES-256-GCM planned for Epic 6 (EU launch). MVP relies on TLS 1.3 in transit + PostgreSQL RLS

### LLM Cost & Reliability

*See FR55-FR57, FR58 for functional specifications.*

- **Cost guard:** Per-session cost monitoring with a budget threshold
- **Session-aware cost guard:** Never block a user mid-session. Budget protection applies at session boundaries, not during active conversations
- **Retry pattern:** Users can retry sending their message — not a hard failure, a temporary pause
- **Response length:** Nerin's response length may vary — shorter responses are expected and acceptable
- **Fail behavior:** Cost guard blocks the turn, does not terminate the session

### Content Moderation & Crisis Protocol

- **MVP scope:** Out of scope for MVP
- **Future consideration:** Crisis detection is a candidate for post-MVP

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Category Creation — Personality Intelligence (primary innovation)**
big-ocean bets that personality intelligence is a product category that doesn't exist yet. 16Personalities gives you a label. ChatGPT gives you a chat. A therapist gives you insight over months. big-ocean's bet: 30 minutes of structured conversation can produce personality intelligence that's *actionable* — you can share it, compare it, use it to understand your relationships. The structural difference: quizzes capture self-assignment ("are you organized?"), conversations capture behavioral patterns (how you describe your morning reveals what you protect). A quiz can't generate a portrait sourced from your own story — only a conversation can. The assessment experience itself is the marketing. Conversation quality IS the credibility that drives sharing. That's not a feature — it's a structural moat.

**2. Director Model — Closed-Loop Conversation Control**
The Director model (evidence extraction → coverage analysis → Nerin Director → Nerin Actor) is a closed-loop control system running on top of an LLM conversation. Most LLM products are stateless — the LLM drives. big-ocean treats the LLM as a *guided instrument*: extract evidence → analyze coverage gaps → direct next move → actor executes with character voice → loop. The LLM is the actuator, not the brain. The Director IS the brain. This is genuinely novel in the LLM application space and is the platform innovation that makes everything else possible.

**3. Conversation as Mechanism, Not Product**
The user experiences a meaningful personal conversation. The system experiences a structured data extraction pipeline. These are the same 15 exchanges. The Director model makes a 30-minute assessment feel like an encounter with a perceptive character, not a test. The data collection *is* the experience — there's no trade-off between thoroughness and engagement.

**4. Ocean Metaphor as Structural UX Language**
The ocean/diving metaphor isn't cosmetic — it's structural. It shapes how the product talks, how users understand their journey, and how they describe the experience to others. Conversation = diving deeper. Depth meter = literal depth visualization. Territories = underwater zones. Mirrors = marine biology phenomena reflecting human patterns. Archetypes = nature-based identity ("The Beacon," "The Anchor"). The portrait = what Nerin found in the deep. "I went on this deep dive and Nerin found..." — that's a story users tell. Try telling a story about your 16Personalities result.

**5. Credibility Chain as Growth Architecture**
Conversation quality → self-recognition (scores + archetype) → portrait revelation (Nerin's letter) → trust in relationship analysis → ambassador conversion. Each product layer builds trust for the next. This isn't a marketing funnel — it's a credibility funnel where each step proves the AI's capability, making users willing to invest more (time, money, social capital).

**6. Relationship Analysis as Viral Engine**
The core growth mechanic requires *another person* to complete their own 30-minute assessment. Every relationship analysis QR scan is a potential new user acquisition that goes through the full credibility chain. The product creates network effects from what starts as a fundamentally individual experience.

**7. Free Portrait as Trust Signal**
The portrait is free — no paywall, no credit card. This is a deliberate strategic choice: the "feel seen" moment IS the conversion event. By giving away the highest-value artifact, big-ocean proves its capability before asking for anything. The founder's own portrait (visible on the homepage or about page) adds vulnerability and authenticity — "this thing understood me, and I built it so it could understand you." The free portrait removes the last friction point and shifts the competitive frame: competitors charge $29-49 for reports; big-ocean gives you a personal letter for free.

**8. Relationship Analysis Ritual as Harm Reduction**
The ritual screen (read together, discuss) and framing guardrails (dynamics not deficits, no blame) aren't just UX — they're a harm reduction mechanism for how personality data is consumed. Accurate personality intelligence will sometimes surface uncomfortable truths. The innovation is creating a container where difficult discoveries are productive rather than destructive.

**9. The Intimacy Principle — Brand DNA**
"Big Ocean is built for a few people, not a crowd." Every feature is audited against this rule: does it show "how many"? → probably wrong. Does it reward broad visibility over focused connection? → wrong. Does it use follower/fan/network language? → wrong. Does it celebrate depth and duration of fewer relationships? → right. Does it treat the user as a sovereign member of a small circle, not a node in a growth graph? → right. Implementation: no hard cap on Circle size (rules create resentment; culture through design), no count metrics anywhere user-facing (no "X connections", no profile view counters, no sign-up attribution shown to the user), no follower/friend language (use "people you care about"), no search, no recommendations, no directory of users, no sorting options on Circle (organic order only), each person rendered as a full-width card with individual weight (not a grid of avatars), empty state teaches the value system ("Big Ocean is made for the few people you care about"). This is a structural differentiator: every other consumer social product optimizes for reach. Big Ocean is the first built for intimacy.

**10. Three-Space Navigation — Assessment Is Onboarding, Companion Is Product**
The authenticated product is organized around three spaces, not a dashboard: **Today** (ephemeral daily — silent journal, mood calendar, weekly letter inline card on Sundays), **Me** (persistent identity — portrait, archetype, radar, public face, subscription, Circle preview), and **Circle** (the few people you care about — relationship letters, invite ceremony). `/dashboard` is removed. The post-assessment sequence is **focused portrait reading** at **`/me/$conversationSessionId?view=portrait`**, then the **session-scoped Me surface** at **`/me/$conversationSessionId`** (FR93–FR95); legacy **`/results/*`** URLs may exist only as redirects. After that, the user navigates freely across Today/Me/Circle without a persistent first-visit route gate. `/today` remains the primary daily landing surface, but not a forced default after the first reveal. Assessment (`/chat`) sits outside the three-space world as an onboarding tunnel. The architectural bet: linear "home → chat → Me → done" is a dead end that creates post-assessment churn; a hub-and-spoke model with distinct return reasons creates a habit loop. This is what turns a one-time personality test into a daily companion.

**11. Nerin Output Grammar — Three Visual Formats**
Nerin's voice uses three distinct visual registers, each tied to an emotional context so users learn to read them differently:
- **Journal format** (margin notes, shared-page feel): daily check-in recognition on Today (post-MVP paid)
- **Letter format** (focused reading, max-width 720px, warm background): portrait, weekly summary, annual relationship letter — the highest-emotion Nerin moments all use this register
- **Chat format**: subscriber "Tell me more" mini-dialogue on Today (post-MVP)

Clean split. No template engine. Every place Nerin speaks uses LLM generation with rich user context (facets, archetype, evidence, pattern signals). Templates are reserved for notification copy, UI labels, and system messages — never for Nerin's voice.

### Disruption Vectors

**1. Assessment-as-Onboarding Flip:** The entire $6-11B market treats assessment as the product. big-ocean treats it as onboarding — how the AI learns you. The product is everything after. The assessment AND portrait are free — competitor models (pay for results) can't compete with free.

**2. "Good Enough Therapist" (Year 1 play):** Serve the 75% who could benefit from self-understanding but will never enter a therapist's office. Personality framing removes stigma, self-care depth delivers value. Classical low-end disruption at 1/100th the cost. Competitive frame: $150/hr therapists, not free quizzes.

**3. Longitudinal Identity Record (Ongoing moat):** First product offering a persistent, evolving record of who you are and how you're changing. Irreplaceable after 6+ months of use. Make the journey visible — portrait gallery, "you then vs. you now," confidence growth timeline. This is the most underrated moat: it sells the subscription for you.

**4. "Don't Have to Explain Yourself" Category:** No product category exists for "an AI that already understands who you are." This is non-consumptive disruption — serving people who currently do nothing (situation "not bad enough for therapy," can't afford coaching, processing things alone because explaining is exhausting). The non-consumer market is enormous.

**5. Agent Platform as Network (post-MVP):** Linear value chain (user → test → result) transforms into multi-sided platform: users (bring personality data), specialized agents (serve different jobs from same data), and eventually third-party integrations. Network effects: more users → richer data → better agents → more users.

### Blue Ocean ERRC Grid

| Strategy | Actions |
|----------|---------|
| **Eliminate** | Multiple-choice questionnaires, type categorization / 4-letter codes, clinical language, dashboard as primary result, portrait paywall, relationship analysis credits |
| **Reduce** | Assessment length (15 exchanges vs 50-100+ items), framework breadth (one framework done deeply), price of entry (completely free vs $29-49 reports), acquisition cost (relationship analysis = zero-CAC growth) |
| **Raise** | Personalization depth (16 types → millions of unique 30-facet profiles), emotional impact, relationship insight, scientific credibility, viral shareability (81 archetypes > 16 letter codes), retention through self-care companion |
| **Create** | Conversational assessment, coherence-based scoring, "you don't have to explain yourself" experience, personality-aware life companion (subscription), incomplete-by-design assessment, portrait as ritual, mood diary with personality-informed recognition, portrait evolution gallery, free relationship analysis as growth engine |

### Market Context & Competitive Landscape

| Competitor | What they have | What they lack |
|-----------|---------------|---------------|
| 16Personalities / MBTI | Guided UX, social identity, archetypes, 1B+ tests taken | Generic results, no personalization, no conversational depth, zero retention |
| ChatGPT / Claude | Personalization, conversational depth | No guided UX, no social outputs, no structured personality model, starts from zero every session |
| Therapists | Depth, relationship analysis, clinical rigor | €80-150/hr, weekly at best, waitlists, not personality-specialized |
| BetterHelp / therapy apps | Accessibility, scalability | No personality model, no social identity, no structured insights |
| Dimensional | Social features, strong ratings (4.9/5), 751K users | Quiz-based, modest growth suggesting retention issues |
| Listen Labs | Conversation + funding | B2B focused, no consumer social features |
| BetterUp | Coaching at scale | €200+/month enterprise pricing, no consumer play |
| Headspace/Calm | 2M+ subscribers, brand recognition, B2B pivot | Losing subscribers. No personality model. Pivoting to B2B2C — validates therapist wedge |
| 16Personalities (revenue) | Bootstrapped, 1 employee, ~$340K/yr, 25M monthly visits, SEO dominance | Took 5+ years. Won through SEO. Knowledge library (archetypes + traits + facets + Big Five science) replicates and expands this playbook |
| Noom | $1B ARR, behavioral psychology model | $656M raised. Daily micro-interactions model worth studying for mood diary design |

big-ocean's unique position: the only product where the assessment experience IS the marketing AND the assessment is the onboarding for an ongoing relationship. The structural advantage is that conversation quality, sharing behavior, and growth are the same system — not separate concerns. The "don't have to explain yourself" factor is entirely new to the market.

**Revenue model clarity:** MVP ships a subscription flow (€9.99/mo) with exactly two paid perks: conversation extension and bundled first-extension portrait regeneration. All other AI intelligence is free in MVP (portrait, weekly descriptive letter, relationship letter) — funded by the founder's €1K/month runway and by the subscription revenue from early converters. Post-MVP adds the paid depth layer (daily LLM recognition, mini-dialogue, prescriptive weekly letter, portrait gallery, Section D). Real cost data: assessment ~€0.30, portrait ~€0.20-0.40, free-tier ongoing ~$0.02-0.08/month, subscriber ongoing ~$0.35-0.75/month (MVP). Gross margin per subscriber: 93-97%.

### Validation Approach

**Pre-launch validation (first 20 seeded users):**
- Do users describe the experience as something *new*, or map it to something existing? ("Better 16Personalities" = category not landing. "I've never done anything like this" = category exists.)
- Do users spontaneously share without being asked? Spontaneous sharing is the category signal
- What language do users use when describing it to friends? Their words reveal whether the category is landing

**Post-launch validation:**
- 100 completed assessments in 3 months — if users complete and share, the category exists
- >70% completion rate — proves the control system works as an experience
- Free→subscription conversion >3% — self-revelation drives willingness to subscribe
- Break-even signal — subscription revenue covers LLM costs + infrastructure. Not a profit target, a sustainability floor
- Viral coefficient >0.5 — relationship analysis (free, zero friction) drives organic acquisition
- Character resonance — do users describe Nerin as a character, or as "the AI"?

### Risk Mitigation

See [Risk Mitigation Strategy](#risk-mitigation-strategy) in Project Scoping for the consolidated risk table covering both innovation and execution risks.

### Strategic Priorities

**1. Conversation engine is the primary innovation investment.** The Director model + Nerin character must work before anything else matters. If the first 20 users don't complete and don't feel seen, no amount of archetype cards, public profiles, or free portraits will save the product.

**2. Iteration over perfection.** The 81 archetypes, territory descriptions, mirror system, and templates are first drafts that will improve with real user data. Ship, learn, refine. Don't over-polish pre-launch.

**3. Relationship analysis as emergent product identity.** The relationship analysis may become what people *call* the product — "have you done a big-ocean with someone?" is a social behavior, not a feature. Design for this possibility even though it can't be forced.

**4. Data flywheel as long-term moat.** ConversAnalyzer improves → portraits improve → more users → more data → ConversAnalyzer improves. This flywheel is the company's long-term defensibility. Every conversation makes the next one better.

**5. Protect the founder story.** The founder's vulnerability — his own portrait, his reasons for building this — is the soul of the product. Surface the **full** founder story on **`/about`** (FR84); the homepage may link to it without duplicating the block (conversion-focused homepage). Keep it even as the company grows.

## Web App Specific Requirements

The following specifications ensure the experience described above works reliably across devices and contexts.

### Project-Type Overview

big-ocean is a hybrid SSR web application built with TanStack Start (React 19) with server-rendered pages and client-side navigation. The primary user experience is a conversational interface (chat with Nerin) and the **Me** identity surface (post-assessment portrait reading + session-scoped identity at **`/me/$conversationSessionId`**, **`?view=portrait`** for focused reading). SEO is critical for public profiles which serve as the top-of-funnel acquisition channel.

### Browser Support

- **Target:** Modern evergreen browsers — Chrome, Firefox, Safari, Edge (latest 2 versions)
- **No IE11 or legacy browser support**
- **Mobile browsers:** Safari iOS, Chrome Android (latest 2 versions) — conversation UX must work well on mobile given social sharing flows start on phones (tapping archetype cards from Instagram/messaging apps)

### Responsive Design

- **Mobile-first for conversation and Me / post-assessment surfaces** — users arriving from shared archetype cards on social/messaging apps will be on mobile
- **Public profile must render well on mobile** — it's the first impression for potential users
- **Desktop optimized for extended sessions** — relationship analysis reading and deeper exploration benefit from larger screens
- **Depth meter placement** — left edge on desktop, adapts for mobile viewport

### Performance Targets

- **Public profile page:** <1s LCP (Largest Contentful Paint) — this is the acquisition landing page, speed matters for bounce rate
- **Chat page:** <2s initial load, then instant client-side interactions. Nerin response time <2s P95 (server-side, already defined in technical success criteria)
- **Me / post-assessment identity surface** (`/me/$conversationSessionId` after focused reading, FR95): <1.5s LCP — users arrive here with anticipation after completing 15 exchanges; delay kills the emotional moment
- **Portrait generation:** Async — user is informed it's generating, no blocking wait. Notification when ready

### Homepage Performance & Optimization

- **Homepage is a primary acquisition surface:** Cold visitors arriving from search, social media links, or word-of-mouth land here with zero context. The homepage must convert within 90 seconds of attention
- **Homepage LCP <1s:** Speed matters for bounce rate — equal priority to public profiles
- **Mobile-first for homepage:** Social media arrivals (Instagram stories, messaging app links) are predominantly mobile. Homepage layout and scroll behavior must be optimized for mobile viewports first
- **Homepage SSR:** Server-rendered for SEO. Structured data for personality assessment schema. Meta description optimized for search intent ("personality assessment," "know yourself," "AI conversation")

### SEO & Social Sharing Strategy

- **Public profiles are SEO-critical:** Server-rendered with structured data, unique URLs per user
- **OG meta tags per public profile:** Archetype name, OCEAN code, archetype card image — optimized for social preview when shared in messaging apps and social media
- **OG image generation:** Dynamic archetype card image per user for social previews
- **Knowledge library pages:** SSR with structured data. Four tiers: archetype definitions (81 pages), trait/facet explainers (35), Big Five science articles (10-20), relationship/career guides (50-100). Each page targets specific search intent and includes a CTA to the free assessment. Schema.org structured data for scientific content
- **Landing/marketing pages:** SSR for SEO. Standard meta tags, structured data
- **Authenticated app surfaces** (conversation, Me, Today, Circle, focused reading): Not indexed. `noindex` meta tag
- **Sitemap:** Public profiles + knowledge library pages (for users who opt into public visibility on profiles)

### Accessibility

- **Target:** WCAG 2.1 AA compliance
- **Conversation UX:** Chat interface must be keyboard-navigable, screen-reader compatible, with proper ARIA labels for depth meter and progress milestones
- **Public profile:** Score visualizations (facet bars, trait bands) must have text alternatives
- **Color contrast:** Archetype card colors and ocean theme palette must meet AA contrast ratios
- **Focus management:** Proper focus handling in subscription modal and relationship analysis ritual screen

### Implementation Considerations

- **SSR framework:** TanStack Start (already in use) — server-rendering for public profiles and landing pages, client-side for authenticated experiences
- **Deployment:** Railway (already in use) — single region for MVP
- **CDN:** Consider for static assets and OG images as public profile traffic grows
- **Image optimization:** Archetype card images and OG previews should be generated and cached, not computed per request

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** End-to-end experience MVP — the full journey (conversation → portrait focused reading → three-space product world → daily silent journal → Sunday weekly letter → relationship letter → Circle → subscription conversion at week 3+) must work at launch. No staged rollout. Assessment is onboarding; companion is product; both must ship together.

**Resource:** Solo founder. Architecture (hexagonal, Effect-ts) and infrastructure (Railway, CI/CD) already built to minimize ops burden. Most infrastructure is in place — focus is on conversation engine quality, three-space navigation, daily/weekly loop, and post-assessment transition.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** All MVP journeys — Léa first-timer (post-assessment transition), Léa daily return (Phase 5→6 bridge), Léa subscription conversion at week 3, Marc invited (relationship letter), Thomas profile visitor, Vincent founder, Inès cold visitor. Plus one illustrative post-MVP journey (Léa returning subscriber with Coach agent).

**Must-Have Capabilities:**

| Capability | Justification |
|-----------|--------------|
| 15-exchange conversation with Nerin character | The product IS the conversation |
| Director model (evidence extraction → coverage analysis → Director → Actor) | Without it, Nerin is just ChatGPT |
| Nerin dive master persona + ocean metaphors | Character distinctiveness = memorability = sharing |
| Depth meter + progress milestones (25%/50%/75%) | Prevents mid-conversation dropout |
| Nerin portrait teasing during conversation | Builds anticipation for the payoff |
| Post-assessment transition: closing button → focused reading view → Me page → return seed + notification permission (FR93-FR96) | Protects the portrait's emotional weight and bridges Phase 5→6 |
| Portrait generation (Nerin's letter, high-capability LLM) | The payoff — the "worth it" moment, focused reading format |
| Three-space navigation: Today / Me / Circle (FR101-FR103) | Replaces linear dead-end. Assessment completion lands on Me once; afterward users move freely across the three spaces |
| Today page with silent daily journal (FR67, FR68, FR68a) | Daily habit loop; free-tier $0 LLM cost; the Phase 5→6 bridge |
| Mood calendar (FR70) + three-level note visibility (FR71) | Patterns become visible over time; intimacy-principle privacy |
| Weekly summary from Nerin — free descriptive letter (FR86-FR92) | Sunday ritual; retention engine; single subscription conversion moment in MVP |
| Me page — identity hero, portrait, public face, subscription pitch, Circle preview | Identity and sharing live here separately from daily return |
| Circle page — full-width cards, invite ceremony (FR97-FR100) | Intimacy-principle enforcement; reward-first invite copy |
| Relationship letter — static letter + real-time data grid + letter history + "Your Next Letter" anticipation (FR28-FR35) | Living relational space; free for all; annual regeneration post-MVP |
| QR flow with ongoing consent (FR30) | Clarified: accept = ongoing data sharing for relationship letter + future annual regen |
| Public profile (default-private, SSR, unauthenticated) | Top-of-funnel acquisition channel |
| OG meta tags + archetype card image | Social sharing is the passive growth channel |
| Subscription flow (€9.99/mo) via Polar embedded checkout | Unlocks conversation extension + first-extension portrait regen only in MVP |
| Conversation extension (FR10, FR25) + bundled first portrait regen (FR23) | Sole paid perks in MVP; strong conversion hook tied to Nerin |
| Transactional emails (3 types: drop-off re-engagement, Nerin check-in, subscription conversion nudge) | Lifecycle retention and conversion triggers |
| Homepage conversion content (messaging, hook, portrait preview, fear-addressing, free-product transparency) | Load-bearing since anonymous path removed — cold visitors must commit to signup |
| Auth (Better Auth) | Already built |
| Cost guard (session-aware) + cost ceiling architecture | Prevents budget blowout during viral events |

**Nice-to-Have (post-MVP, pre-H2):**

| Capability | Why it can wait |
|-----------|----------------|
| Product analytics (PostHog) | Valuable for tracking funnels, events, and user behavior — but founder can validate core metrics manually at first |
| Admin dashboard / analytics UI | Founder can query DB directly for MVP |
| Detailed dropout analytics by exchange | Can be computed from logs post-hoc |
| Viral coefficient tracking | Manual calculation from QR-accept/completion data |
| Revenue reporting dashboard | Polar.sh dashboard covers this initially |

### Post-MVP Phases

See [Product Scope — Post-MVP Phases](#post-mvp-phases) for detailed phase descriptions and exit criteria. Summary:

**Phase 1b — Validate Retention + Add Paid Depth:** Paid daily LLM recognition (FR69), subscriber mini-dialogue (FR69a), prescriptive weekly letter layer (FR88), personality-typed notification scheduling, mobile wrapper, post-assessment survey, viral loop optimization.

**Phase 2a — Coach Agent + Expanded Subscription:** Coach agent (beta 50-100 users first), portrait gallery + regeneration beyond first extension (FR74, FR23a), confidence milestone notifications (FR75), Section D relational observations (FR32a: D2, D3, D4), pattern detection, monthly reflection, crisis detection.

**Phase 2b — Agent Expansion:** Relationship agent, Career agent, cross-agent intelligence, smart nudges, complete portrait at 30/30.

**Phase 2c — Annual Ritual (Year 1 Q4):** Annual relationship letter regeneration (FR35a) at first-cohort anniversary, "Personality Wrapped" year-in-review.

### Risk Mitigation Strategy

**Execution Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Nerin character quality (~40% → launch-ready)** | High — credibility chain breaks at step 1 | #1 pre-launch investment. Director model overhaul |
| **Director model compliance** | High — low territory compliance degrades conversation quality | Already architected. Ship at 70% compliance, improve iteratively |
| **Portrait quality** | High — no self-revelation = no sharing, no subscription conversion | Rich evidence generation. Test with first 20 users |
| **Relationship analysis quality** | Medium — new feature, unvalidated | Ship simpler V1, iterate on user feedback |
| **Solo founder bandwidth** | High — ambitious MVP for one person | Most infrastructure built. Conversation engine first, layer features |

**Innovation Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Category doesn't exist (no market)** | Critical | Seed first 20 users, observe category language and spontaneous sharing before scaling |
| **Director model feels mechanical** | High | Character voice + desire framing provide naturalness on top of Director outputs |
| **Ocean theme limits appeal** | Medium | Test via archetype card sharing — if cards get shared, theme works |
| **Free→subscription conversion <2%** | High | Iterate subscription value proposition. Add more compelling subscription-only features. Test pricing. If <1% after 6 months, consider reintroducing portrait paywall |
| **Relationship analysis surfaces painful truths** | Medium | Inherent to category. Ritual + framing guardrails are harm reduction |
| **Defensibility — tech is copyable** | High | Moat is data: relationship graph + extraction patterns + model refinements. Competitors can copy the product, not 6 months of data |
| **First-mover window is narrow** | High | First 6 months = race to build data moat. Speed to 100 users = defensibility |
| **LLM prompt compliance** | High | Territory compliance >70%; Director model with desire framing designed to solve this |
| **Listen Labs consumer pivot** | Very High | Speed + differentiation (Big Five, archetypes, dashboard, social). Moat is platform, not just conversation |
| **16Personalities adds AI** | Very High | Moat is platform (dashboard, check-ins, agents), not just conversation quality |
| **Coach feels like ChatGPT** | High | A/B test: show Coach vs ChatGPT response. If indistinguishable, iterate. The "don't have to explain yourself" factor must be tangible |
| **Solo founder burnout** | Critical | Phased roadmap. One focus per phase. Stay in Phase 1 longer if needed |

### Decision Gates

| Gate | GO Criteria | NO-GO Response |
|------|------------|---------------|
| G1: Launch → Scale | NPS >40, sharing >10% | Iterate Nerin quality |
| G2: Scale → Check-in | Viral coeff >0.3 | Fix sharing mechanics |
| G3: Check-in → Subscription | 4/5 phase transition triggers fire (see Success Criteria) | If "talk again" <30%, stay transactional |
| G4: Beta → Public subscription | Coach NPS >50, "felt generic" <30% | Iterate until "don't have to explain myself" lands |
| G5: Single → Multi-agent | M3 subscriber retention >50% | Price reduction or iterate Coach before adding agents |

### Key Hypotheses

| Hypothesis | Kill Criteria |
|-----------|--------------|
| 15-exchange conversation creates wonder | NPS <30 or sharing <10% |
| Portrait makes people feel seen | Share rate <10% or return visit <30% |
| Relationship analysis drives viral acquisition | Invite acceptance <20% or viral coeff <0.3 |
| Users want to talk to Nerin again | <30% express interest |
| Coaching feels meaningfully personalized | NPS <40 or "felt generic" >30% |

**If hypothesis 4 fails, the subscription model collapses.** big-ocean becomes a profitable transactional business. Honest outcome.

### Backup Plans

| Scenario | Year 2-3 Revenue | What It Is |
|----------|-----------------|-----------|
| Full vision works | €150K-500K year 2-3 | Personality-aware agent platform |
| Subscription partially works | €50-150K year 2 | Niche premium personality product |
| Transactional reintroduced | €30-80K year 2 | Reintroduce portrait paywall or credits if subscription fails. Best personality assessment online |
| Free product, no revenue | €0 | Valuable free tool with large user base. Pivot to B2B2C API licensing |

### Acquisition Strategy

**Primary channels (priority order):**
1. **Relationship invite loop (primary):** Every relationship analysis = potential new user. Free = zero friction. Compound growth. Combined viral coefficient K ≈ 0.20-0.25
2. **Archetype card sharing:** Shareable, visual, identity-signaling, zero marginal cost. K ≈ 0.01-0.02 individually but supplements invite loop
3. **SEO knowledge library:** A public content library serving as the primary organic acquisition channel. Four content tiers:
   - **Archetype pages (81):** One page per archetype — description, strengths, growth areas, compatible archetypes, famous examples. The 16Personalities SEO playbook
   - **Trait & facet explainers (35):** One page per Big Five trait (5) + one per facet (30). Scientific explanation, behavioral examples, spectrum visualization, "where do you fall?" CTA
   - **Big Five science articles (10-20):** Origin of the Big Five, OCEAN vs MBTI, how personality is measured, personality across cultures, personality and relationships, personality and career. SEO targets: high-intent informational queries
   - **Relationship & career guides (50-100):** Compatibility pairs, "how [archetype] handles conflict," career fit by trait profile, relationship dynamics by OCEAN combination
   - **Total: 175-235 pages over 12-18 months.** Start with 10 high-intent pages (month 1-3). AI-generate drafts, human-edit. Each page has a CTA to the free assessment
4. **Launch blitz (month 4):** Product Hunt, Hacker News, Reddit, indie communities, 20+ creator/influencer outreach asks

**Skip:** Paid ads until €5K/mo revenue. Not cost-effective for a solo founder with €1K/month budget.

**Realistic projection:** 50-200 subscribers by month 12, €500-3,000/mo MRR. €200K year 1 requires viral breakout or B2B2C partnership.

### Therapist B2B Wedge

First B2B play — closest to existing product, warm leads available:
- **Pitch includes:** Evidence explanations (what the client said → why that score), mood calendar for between-session tracking, personality-informed session preparation
- **Timeline:** Start conversations month 3, free pilot month 4-6, paid tier (€29-49/mo per practitioner) month 7-9
- **Revenue model:** Therapists are both revenue AND distribution — they send clients who become B2C subscribers
- **Enterprise:** "Contact us" page + organic discovery. Build when demand signals are strong. Not a year 1 priority

### Pre-Mortem: Five Ways Big Ocean Dies

**Death 1 — LLM costs eat revenue.** Free-tier AI responses cost more than the free users are worth. Fix: silent daily check-ins (zero LLM calls per FR68) plus one LLM-generated weekly descriptive letter per active user (FR87). Free-tier unit economics land at ~$0.02–0.08/user/month — well below sustainability threshold. Cost optimization comes from product design (silence is a feature), not from degraded generation quality.

**Death 2 — Archetypes are forgettable.** Clinical descriptors don't trigger sharing. Need: short evocative names (1-2 words), distinct visual identity per archetype, cultural scaffolding. Design investment here has 100x ROI on virality.

**Death 3 — Invite assessment completion too low.** The 30-minute assessment IS the self-selection filter. Users who won't invest 30 minutes won't subscribe. Show invited user a teaser derived from inviter's profile to motivate the investment. Estimated invite completion: 20-25%.

**Death 4 — B2B2C starts too late.** B2B sales cycle is 6-12 months. If wanted by month 12, outreach must start month 1. Need: 5 named target companies, simplest integration PoC, warm introductions.

**Death 5 — Quit job too early.** Quit based on composite signal, not MRR alone. ALL five signals must be true (see Quit-Job Composite Signal in Success Criteria).

### Execution Roadmap

**Phase 1: Ship & Validate (Month 1-4)**
- Month 1: Relationship analysis v2 (free), subscription paywall, archetype card redesign brief, first 5 knowledge library pages (archetype definitions + 1 Big Five origin article), cost ceiling architecture
- Month 2: Card redesign launch, invite teaser flow, conversion CTA polish, therapist pilot conversations
- Month 3: Soft launch (50-100 beta users), validate completion >50% + share >10% + conversion >3%, publish 5 more library pages (trait explainers), negotiate 4-day work week
- Month 4: Product Hunt + HN + Reddit launch blitz. Iterate on beta feedback. 500-2,000 free users target

**Phase 2: Grow & Learn (Month 5-9)**
- Month 5-6: Analyze launch data, double down on working channel, therapist dashboard MVP if validated, first influencer outreach (10-20 asks), paid daily LLM recognition and mini-dialogue Phase 1b rollout (FR69, FR69a), prescriptive weekly letter layer (FR88), 20 library pages live (archetypes + traits + first science articles)
- Month 7-8: Iterate subscription value (add personality curriculum if churn high), second influencer/social wave
- Month 9: Decision gate. Review all metrics. 30 library pages live. MRR target: €1,000-3,000

**Phase 3: Scale & Optimize (Month 10-18)**
- Month 10-12: 50 library pages, optimize conversion funnel, relationship coach agent if justified. MRR target: €1,500-3,000
- Month 13-15: Accelerate library (compatibility guides + career pages + facet explainers), consider revenue financing or angels. MRR target: €3,000-5,000
- Month 16-18: Quit job if composite signal met. Hire first developer. 100+ library pages. MRR target: €5,000-10,000

### Market Analysis

**TAM/SAM/SOM:**

| Level | Market | Size | Growth |
|-------|--------|------|--------|
| **TAM** | Global personality assessment + self-development digital tools | ~$25B | 8-12% CAGR |
| **SAM** | AI-powered personality & coaching platforms (B2C + B2B), primarily English/French-speaking markets | ~$2.5B | 15-20% CAGR |
| **SOM** | Conversational AI personality assessment — direct-to-consumer, first 2 years | ~$5-15M | New category |

**Five Forces:**

| Force | Intensity | Reality |
|-------|-----------|---------|
| **Supplier power** | HIGH | Dependency on Anthropic/OpenAI APIs — they set prices, can change terms, could build competing products |
| **Buyer power** | HIGH | Consumers have infinite free alternatives. Switching cost near zero until relationship data accumulates |
| **Competitive rivalry** | MODERATE | Few direct competitors in "conversational AI + Big Five." Adjacent competitors are massive |
| **Threat of substitutes** | VERY HIGH | Anyone can prompt ChatGPT "analyze my personality." Free AI chatbots are the real substitute threat |
| **Threat of new entrants** | HIGH | Low barrier — any developer with API access can build a personality chatbot in weeks |

**Pattern from competitive benchmarks:** B2C wellness subscriptions are peaking. Headspace and Calm both losing subscribers, pivoting to B2B2C. Validates therapist wedge and enterprise roadmap. Bootstrapped ceiling: ~€500K-2M/yr without funding.

## Functional Requirements

### Conversation Experience

- **FR1:** Users can have a 15-exchange adaptive conversation with Nerin
- **FR2:** Nerin responds using ocean/marine metaphors and dive master persona
- **FR3:** Each turn, Nerin's territory focus, observation type, and entry pressure adapt based on the conversation so far — incoming user messages are interpreted for evidence and coverage so the dialogue stays exploratory without locking into one topic prematurely. *(Internal steering: Director model and pipeline stages — see architecture.)*
- **FR4:** Users can see a depth meter reflecting the conversation's progress
- **FR5:** Users receive progress milestone markers at 25%, 50%, and 75% of the conversation
- **FR6:** Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait. *Acceptance: given a 15-exchange conversation, Nerin makes ≥2 specific pattern observations that reference concrete details from the user's prior responses (not generic statements)*
- **FR7:** Nerin frames observations as invitations to explore — acknowledges user pushback, offers an alternative framing, and redirects to a different topic only if the user rejects the observation a second time. *Acceptance: when a test user contradicts Nerin's observation, Nerin (1) acknowledges the disagreement, (2) offers a reframed version or alternative, and (3) only changes topic if the user rejects again*
- **FR8:** Nerin includes a "this is not therapy" framing in the greeting
- **FR9:** Nerin never uses diagnostic language or characterizes third parties the user mentions. *Acceptance: across 10 test conversations, Nerin uses zero DSM terms or clinical labels, and never labels a person the user describes (e.g., never says "your mother sounds controlling" — only observes the user's experience of the relationship)*
- **FR10:** *(Subscription — MVP)* Subscribers can extend their conversation (+15 exchanges) to continue with Nerin. Extension is the sole paid perk in MVP (alongside bundled first-extension portrait regeneration per FR23). *Acceptance: subscribed user can trigger one conversation extension per assessment result; extension creates a new conversation session initialized with the prior session's final state (FR25)*
- **FR11:** Users can resume an abandoned conversation from where they left off
- **FR12:** The conversation ends with a distinct closing exchange from Nerin before transitioning to the post-assessment flow (portrait reading + Me — FR93–FR95)
- **FR13:** Nerin transitions between territories using a connecting observation or question that references the prior topic when territory focus changes between turns (distinct from general steering)

### Personality Assessment & Identity (Me)

- **FR14:** The system extracts facet evidence and energy signals from each user response
- **FR15:** The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
- **FR16:** Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the **Me** identity surface (session-scoped route `/me/$conversationSessionId` for a given assessment; see FR101–FR103)
- **FR17:** The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
- **FR18:** The system presents all archetypes with positive, strength-based framing. *Acceptance: no archetype name or primary description frames the user as fundamentally deficient; growth areas are stated without pejorative labels (audit all 81 against Domain-Specific Requirements — archetype positivity).*
- **FR19:** Authenticated users navigate the product through a three-space bottom navigation model — **Today** (ephemeral daily companion), **Me** (persistent identity page with portrait, archetype, scores, public face control, subscription pitch, Circle preview), and **Circle** (people they care about with relationship letters and invite ceremony). There is no `/dashboard` route. A thin `/settings` route contains account admin (email, password, data export, delete) accessed via a gear icon on the Me page

### Portrait

- **FR20:** The system generates a narrative portrait written as a personal letter from Nerin
- **FR21:** Users receive their portrait (Nerin's letter) for free immediately after completing the assessment. The portrait is the emotional peak — it is not gated by subscription, payment, or account upgrades. Subscription conversion does not happen inside the portrait reveal; it happens downstream in the weekly letter flow (FR91) and on the Me page subscription pitch
- **FR22:** Users can view their portrait immediately after generation (no payment required)
- **FR22a:** One portrait is generated per assessment result — free, no purchase required
- **FR23:** *(Subscription — MVP)* The first conversation extension per subscriber automatically generates a new portrait at no additional cost beyond the €9.99/mo subscription. The new portrait incorporates observations derived from the extended evidence not present in the original. The prior portrait remains attached to the prior assessment result as "previous version" on the Me page. *Acceptance: a subscribed user who completes their first conversation extension sees a new portrait generated automatically without any additional purchase step; the original portrait remains visible as "previous version"*
- **FR23a:** *(Post-MVP — subscription)* Subscribers can regenerate their portrait on conversation extensions beyond the first. Mechanism (bundled, separate purchase, or quota-based) deferred to Phase 2a
- **FR24:** The system records share events (archetype card copy, profile link copy) and return-visit timestamps per portrait for **internal analytics and operations** (growth, product quality, support). These metrics are **not** shown to end users in a user-facing dashboard — consistent with the Intimacy Principle and retired `/dashboard` (FR19, FR102). Operator-facing reporting may aggregate share and return-visit rates outside the product UI
- **FR25:** *(Subscription — MVP)* Conversation extension creates a new assessment session. The new session is seeded from the prior session's final state and evidence so Nerin continues as one continuous assessment arc. On completion, new assessment results are generated. For the first extension per subscriber, a new portrait is generated automatically per FR23. For subsequent extensions, see FR23a. The prior portrait and any relationship letters based on the prior results become "previous version"
- **FR26:** Portrait generation is asynchronous — users are notified when ready
- **FR27:** The system retries portrait generation up to 3 times with exponential backoff (5s, 15s, 45s). If all retries fail, the user is notified within 5 minutes with an option to retry manually

### Relationship Analysis

**Naming note:** User-facing copy uses "relationship letter" or "letter about your dynamic" instead of "relationship analysis" (continuous with Nerin's portrait, letter-format Nerin output grammar). The internal data model retains `relationship_analysis` naming for code compatibility.

- **FR28:** Users can initiate a relationship letter by opening a QR drawer from the Circle page invite ceremony; the other person scans the QR code or opens the contained URL
- **FR29:** The relationship letter page is a living relational space with the following sections: (1) **This Year's Letter** — warm narrative in letter format describing the relationship dynamic, entered through a "Read Together Again" ritual screen on first read, LLM-generated at letter-creation time, same visual language as the personal portrait, free for both users; (2) **Where You Are Right Now** — real-time data grid with side-by-side traits, facets, and overlap with complementarity framing, updated automatically from conversation data (derive-at-read), free; (3) **Letter History** — vertical timeline of all letters (single letter in MVP, grows with annual regeneration post-MVP), free; (4) **Your Next Letter** — anticipation anchor for the annual ritual ("Nerin is already learning more about both of you"), free; (5) **Things You've Learned About Each Other** — user-owned shared notes, attributed per entry, free. *Post-MVP Section D (D2 relational observations, D3 "take care of" suggestions, D4 alignment patterns) is subscriber-only and not in MVP scope.*
- **FR29a:** The relationship letter is generated once when both users complete their assessments. The LLM call uses both users' facets, traits, archetype, and representative evidence strings to produce the narrative. Cost: ~1 LLM call per relationship (not per view).
- **FR30:** The QR accept screen shows the initiator's name, Accept and Refuse buttons, and a data-sharing disclaimer: accepting means (1) sharing the user's trait and facet scores with the initiator to generate the relationship letter, (2) ongoing data sharing — Nerin will use conversation data from both users to keep the relationship letter current and regenerate it on connection anniversary (post-MVP), (3) consent is revocable at any time from settings. Single consent gate — accepting is informed consent to ongoing data sharing, no per-action consent required
- **FR31:** Users see a ritual suggestion screen before accessing the relationship letter for the first time. Subsequent visits bypass the ritual by default; a "Read Together Again" button re-enters the ritual mode
- **FR32:** The relationship letter describes relational dynamics without blame language and without exposing individual vulnerability data. The narrative celebrates the relationship — it names dynamics and tensions as shared patterns, not individual deficits. Harm-reduction framing rule: "dynamics not deficits, no blame, no one is the problem". *Acceptance: sample of generated letters (n≥10) contains no second-person accusation against either partner as a person and no disclosure of private mood-note or daily check-in content from either side.*
- **FR32a:** *(Post-MVP — subscription)* The relationship letter page renders Section D — subscriber-only per-user relational intelligence: D2 relational observations ("You've both been tense on Mondays for three weeks..."), D3 "take care of" suggestions (directional, personality-informed coaching for how to show up for the partner, reciprocal and simultaneous — each paying user sees their own "For [name]" suggestion only, never sees the suggestion written about them), and D4 alignment patterns (gentle noticing cards). Privacy contract: Nerin is the abstraction layer — observations always flow through Nerin's voice, never raw data between users. Note text from daily check-ins, individual pattern details, mini-dialogue content, and raw evidence strings NEVER cross users.
- **FR33:** Relationship letters are free and unlimited. Every completed relationship letter is a potential new user acquisition at zero cost — the growth engine
- **FR34:** If one user deletes their account, the shared relationship letter is deleted
- **FR35:** Each relationship letter is linked to both users' assessment results (not to invitations). The MVP ships a single static letter per relationship generated at connection time. Post-MVP annual regeneration (FR35a) creates new letter snapshots while preserving prior versions forever as a multi-year relationship biography — "Your 2026 letter", "Your 2027 letter", etc. Users can view all letters in the Letter History section
- **FR35a:** *(Post-MVP — Year 1 Q4)* The system automatically regenerates the relationship letter on the anniversary of the QR accept date. Both users receive a notification ("Your [year] letter from Nerin is ready"). Old letters are preserved in version history. Regeneration uses current conversation data from both users — no per-regeneration consent required because the original QR consent (FR30) covers ongoing use
- **FR36:** Users receive a notification when a relationship letter they participated in is ready (initial generation in MVP; annual regeneration post-MVP)
- **FR37:** The QR accept screen is only accessible to logged-in users with a completed assessment. There is no pre-account context — User B must sign up, verify their email, and complete their assessment before seeing the accept screen
- **FR38:** *(Removed — relationship letter is free and unlimited, no credit tracking needed)*

### Public Profile & Social Sharing

- **FR39:** Users have a public profile page showing their archetype, OCEAN code, trait/facet scores, and the framing line "[Name] dove deep with Nerin — here's what surfaced"
- **FR40:** Public profiles are default-private; users can explicitly make them public. Binary visibility only — fully public or fully private. No intermediate state (e.g., hiding scores while showing OCEAN code)
- **FR41:** Public profiles generate dynamic OG meta tags and archetype card images for social preview
- **FR42:** Public profiles are accessible without authentication
- **FR43:** Public profiles include a CTA to start the user's own assessment
- **FR44:** Users can copy a shareable link to their public profile
- **FR45:** When a logged-in user with a completed assessment views another user's public profile, a relationship analysis CTA is displayed: "You care about [Name]. Discover your dynamic together." with a brief QR flow explanation
- **FR46:** The system generates archetype card images per archetype (81 cards) — users with the same archetype share the same card visual. Each card contains: archetype name, short description (1-2 sentences), a geometric visual element, and OCEAN code. No individual trait/facet scores. One card per archetype (generic, not personalized)

### Subscription & Monetization

- **FR47:** Users can subscribe at €9.99/mo via embedded checkout (billing provider per deployment architecture; aligns with NFR25). In MVP, the subscription unlocks exactly two perks: **conversation extension with Nerin** (FR10, FR25 — add +15 exchanges; new session seeded from prior session state per FR25) and **automatic portrait regeneration on the first extension** (FR23 — new portrait bundled, no additional payment). Post-MVP unlocks are defined in Phase 2a and include daily LLM recognition (FR69), mini-dialogue (FR69a), prescriptive weekly letter layer (FR88), subsequent portrait regenerations (FR23a), portrait gallery (FR74), confidence milestone notifications (FR75), and Section D relational observations (FR32a). *Acceptance: checkout completes in under 90 seconds from tap to confirmed subscription status; cancellation is self-service and effective at end of billing period*
- **FR48:** *(Removed — relationship letter is free, no credit purchase needed)*
- **FR49:** *(Subscription — MVP)* Subscribers have access to conversation extensions (FR10) as part of their subscription. Extension is unlimited for subscribers — they can re-extend on each extended assessment result as long as their subscription is active

### User Account & Privacy

- **FR50:** Users can create an account with email and password. Account creation triggers a verification email. Unverified accounts are treated as unauthenticated — no access to dashboard, assessment, **Me** / identity surfaces, or any authenticated feature. Public profiles and the home page remain accessible without authentication
- **FR50a:** Verification email contains a unique link that expires after 1 week. Clicking the link activates the account and grants platform access
- **FR50b:** Users can request a new verification email from the verify-email page if the original expired or was not received
- **FR51:** Users can control the visibility of their public profile (binary: fully public or fully private — no intermediate state)
- **FR52:** Users are informed during onboarding that conversation data is stored
- **FR53:** Users can delete their account, which deletes their data and cascades deletion of shared relationship letters where they are a participant (see FR34)
- **FR54:** Users are introduced to Nerin and the conversation format before the conversation begins (pre-conversation onboarding)

### Homepage & Conversion

- **FR59:** The homepage above-the-fold content contains: (1) a single-sentence value proposition communicating what the user receives, (2) a visual hint of output quality (archetype card or portrait excerpt), (3) one primary CTA. *Acceptance: first-time visitors in usability testing (n≥5) can describe what the product offers within 10 seconds of landing*
- **FR60:** The homepage headline communicates a transformation promise — not just what you'll discover, but the ongoing value: an AI that understands who you are and helps you navigate life from that understanding. The hook emphasizes the free, zero-commitment entry: a 30-minute conversation that writes you a personal letter, completely free — and the beginning of an ongoing relationship, not a one-time result. *Acceptance: headline does not contain the words "test," "quiz," "assessment," or name any competitor. Headline implies ongoing value, not one-and-done*
- **FR61:** The homepage has one primary CTA to start the assessment. No competing secondary CTAs, no "See how it works" alternatives that dilute conversion
- **FR62:** The homepage surfaces a concrete portrait excerpt within the first 40% of scroll depth — a paragraph that reads as a personal letter, demonstrating output specificity and emotional weight
- **FR63:** The homepage includes a Nerin conversation preview showing character depth and perceptiveness — demonstrating what the conversation feels like, not describing it. Nerin is shown being Nerin (observing patterns, making connections), not pitching the product
- **FR64:** The homepage contains three content blocks addressing visitor concerns, each with a specific reassurance: (1) process anxiety → "It's a conversation, not a quiz" with Nerin preview as proof, (2) time commitment → "30 minutes that surprise you" with user testimonial or engagement stat, (3) self-exposure → "Everything Nerin writes comes from a place of understanding" with portrait tone example. *Acceptance: each block is identifiable as a content section, not buried in prose*
- **FR65:** The homepage surfaces that the assessment and portrait are completely free — framed as confidence in the product, not as a footnote. Users should encounter this transparency before reaching the CTA, removing the last friction point. *Acceptance: the free-product message appears above the fold (within the first viewport height on mobile and desktop) before the primary CTA, at least body text size and visually comparable or stronger emphasis than adjacent body copy.*
- **FR66:** The homepage supports four entry motivations without branching: (1) zero-context searcher — value proposition lands without prior knowledge, (2) social media curious — archetype card/OCEAN code visible, (3) invited friend — clear path to start own assessment, (4) self-understanding seeker — depth and scientific credibility communicated. *Acceptance: usability test with 1 user per persona type; each can find the CTA within 60 seconds*
- **FR84:** The **`/about` page** includes a founder story block: the founder's own portrait excerpt, why he built this, and what the experience meant to him. Positioned as an authenticity signal — vulnerability that builds trust. The homepage conversion surface uses the split-layout timeline without this block (see UX specification UX-DR39 — founder story deliberately moved off homepage to preserve conversion focus). *Acceptance: `/about` contains a real portrait excerpt (≥3 sentences) and a first-person statement from the founder; homepage remains free of a duplicate founder block unless product explicitly reopens that tradeoff*
- **FR85:** The homepage surfaces the ongoing value beyond the portrait: personality-informed daily check-ins, coaching, growth tracking — positioning the product as a personal development and self-care companion, not a one-time personality test. This section plants the seed without selling the subscription directly. *Acceptance: section describes ≥2 post-portrait features with concrete examples of ongoing value. Does not mention pricing or subscription*

### Knowledge Library (SEO)

- **FR78:** The platform hosts a public knowledge library of server-rendered articles organized in four tiers: archetype definitions (81), trait/facet explainers (35), Big Five science (10-20), and relationship/career guides (50-100). All pages are accessible without authentication
- **FR79:** Each archetype definition page contains: archetype name, description, strengths, growth areas, compatible archetypes, and a CTA to start the free assessment. *Acceptance: page renders with structured data (Schema.org), passes Lighthouse SEO audit >90*
- **FR80:** Each trait explainer page covers one Big Five trait: scientific definition, behavioral examples across the spectrum, facet breakdown with descriptions, and a CTA. Each facet explainer covers one of the 30 facets with similar depth
- **FR81:** Big Five science articles cover foundational topics (origin of the model, OCEAN vs MBTI, how personality is measured, personality across cultures, etc.) for informational search intent. Each article includes a CTA to the free assessment
- **FR82:** Relationship and career guide pages combine personality dimensions with practical contexts (e.g., "How high-Openness people handle conflict," "Best career paths for [archetype]," "[Archetype A] × [Archetype B] compatibility"). AI-generated drafts, human-edited
- **FR83:** Knowledge library pages are included in the sitemap and rendered with Schema.org structured data for scientific and educational content

### Cost Management

- **FR55:** The system monitors per-session LLM costs against budget thresholds defined in NFR6 (~€0.30/assessment) and NFR7 (~€0.20-0.40/portrait)
- **FR56:** The cost guard never blocks a user mid-session; budget protection applies at session boundaries
- **FR57:** When cost guard triggers at a session boundary, users see a "temporarily unavailable" message and can retry after a configurable cooldown period (default: 15 minutes)
- **FR58:** Users are informed when cost guard triggers and told they can retry

### Transactional Emails

- **FR76:** The system sends three types of lifecycle emails: (1) drop-off re-engagement — sent to users who abandoned mid-assessment, referencing their last conversation territory, (2) Nerin check-in — sent ~2 weeks post-assessment as a conversational follow-up from Nerin, (3) subscription conversion nudge — sent to engaged free users (≥3 return visits or ≥1 relationship analysis) highlighting subscription value
- **FR77:** The system sends a notification email within 5 minutes when a relationship analysis the user participated in is ready

### Daily Check-in (Today Page)

**Architecture note:** The daily check-in is a **silent journal** for all users in MVP. Free users deposit mood + optional note with no LLM response. Paid users receive no different treatment on daily check-ins in MVP — daily LLM recognition (FR69) and "Tell me more" mini-dialogue (FR69a) are post-MVP subscriber features. The only Nerin touchpoint in the daily/weekly loop during MVP is the free weekly letter (FR86–FR92). This keeps free-tier LLM cost at ~$0.02–0.08/user/month (weekly letter only) and positions the subscription conversion story inside the weekly letter, not inside daily check-ins.

- **FR67:** Users can perform a daily check-in on the Today page consisting of (1) a personality-typed prompt from Nerin at the top, (2) a 5-option mood selector, (3) an optional note text field, and (4) a note visibility selector (Private / Inner circle / Public pulse)
- **FR68:** When a user submits their daily check-in, the entry is saved to the mood calendar and displayed on the Today page in **journal format** — user's entry anchored at the top, 7-day dot grid with today filled, and a quiet anticipation line beneath: *"Nerin will write you a letter about your week on Sunday."* No LLM response, no Nerin recognition, no "thank you" message. Silent deposit. *Acceptance: a check-in submission triggers zero LLM calls and renders the journal view within 500ms*
- **FR68a:** The Today page displays a quiet weekly anticipation line ("Nerin will write you a letter about your week on Sunday") whenever the user has checked in this week and the week is not yet Sunday. On Sunday after the weekly letter has generated, an inline card replaces the anticipation line with "Your week with Nerin is ready"
- **FR69:** *(Post-MVP — subscription, Phase 1b)* Subscribers receive an LLM-generated Nerin recognition in journal format per check-in. The recognition is 2-3 sentences connecting the user's mood to their personality (top 3 facets, dominant traits, archetype, representative evidence strings) with no generic wellness language and no advice — pure observation. Tight LLM call (~$0.002-0.005 per call). The system includes lightweight pattern signals as prompt context — streak (consecutive check-ins), silence break (first check-in after >3-day gap) — with no separate rule engine
- **FR69a:** *(Post-MVP — subscription, Phase 1b)* Subscribers can tap "Tell me more →" on a daily recognition to open a scoped 3-5 exchange mini-dialogue with Nerin, who reads the actual note and responds in chat format
- **FR70:** Users can view a mood calendar showing their check-in history over time, rendered as a grid of dots with mood emoji selections and day markers. The calendar is visible on the Me page ("Your Growth" section, conditional on having any check-in history) and inline on Today as the "week-so-far" dot grid
- **FR71:** Users choose note visibility per check-in: (1) **Private** (default) — only the user and Nerin see the note, (2) **Inner circle** — visible to consented people in Circle, (3) **Public pulse** (post-MVP) — mood emoji only on public profile, note hidden
- **FR72:** Mood check-in data is stored per user and visible only to the user by default. Note text is never exposed across users. Inner-circle visibility requires the user to select that visibility level per check-in and the viewing user to be in the owner's Circle

### Portrait Versioning

- **FR73:** Each portrait generation is stored as a versioned snapshot with its confidence level, creation date, and linked assessment result. MVP ships storage only. The portrait gallery UI is post-MVP (FR74)
- **FR74:** *(Post-MVP — subscription, Phase 2a)* Subscribers can view a portrait gallery/timeline on the Me page showing all portrait versions with side-by-side comparison and a regeneration ceremony with wait screen. Portrait regeneration beyond the first extension (FR23a) lives here
- **FR75:** *(Post-MVP — subscription, Phase 1b)* Users receive push notifications when their personality confidence level crosses defined thresholds: every 5-8 percentage points in the 50-70% range, every 10-15 percentage points above 80%. Each notification includes a delta insight — a single sentence describing the facet or pattern most changed since the previous milestone

### Today Page & Weekly Letter from Nerin

- **FR86:** The system generates a weekly summary every Sunday at 6pm local time (per user time zone) for each user who submitted ≥3 daily check-ins during that week. Users with 0-2 check-ins receive no summary and no notification — no shame messaging
- **FR87:** The weekly summary is LLM-generated as a **letter from Nerin** using the letter format (focused reading, max-width 720px, warm background, same visual language as the portrait). The free version contains: (1) date range header, (2) personalized opening ("Dear [name]"), (3) week narrative — 2-3 paragraphs observing the pattern of the week and referencing specific mood selections and note content with personality-informed framing, (4) visual mood shape — 7-day dot grid as a small secondary element, (5) "What stood out" beat — one specific observation from the week's notes, (6) Nerin's sign-off. *Critical rule: the free version must feel complete and satisfying on its own — not a preview, not cripple-ware.* LLM cost: ~$0.02-0.05 per user per week
- **FR88:** *(Post-MVP — subscription, Phase 1b)* The subscriber weekly summary is generated from the same LLM call as the free version with additional prescriptive sections: (1) **For the week ahead** — prescriptive focus statement + one concrete micro-action, (2) **Zooming out** — cross-week pattern detection observations, (3) **Relational beat** (if partner in circle and mood sharing opted in) — observations about how partners' weeks looked relative to each other, (4) **Library article link** — contextually-selected from the SEO knowledge library based on this week's theme, (5) **Reflective prompt** — single open question to sit with until next week
- **FR89:** Users receive a push notification at weekly summary generation time with copy *"Your week with Nerin is ready."* Email fallback for users without push notification permission. An inline card also appears on the Today page top on Sundays when the summary is ready
- **FR90:** The weekly summary is accessed at a dedicated focused reading route `/today/week/$weekId`. The reading view uses the same visual language and component shell as the portrait reading view (FR94). Entered from the Today inline card or the notification tap
- **FR91:** The free weekly summary ends with a soft conversion CTA in Nerin's voice, not system voice: "I have more I want to say about what comes next. With a subscription, I can write you a fuller letter each week — with what to try, what patterns I'm seeing across weeks, and what I think might help in the week ahead. **Or: continue our conversation. Extend your 15 exchanges with another 15, and I'll write you a new portrait afterwards that reflects everything I've learned about you since.**" The primary MVP CTA is the conversation extension path (€9.99/mo subscription). A soft dismiss option ("Not right now") returns the user to Today with no escalation. The CTA reappears each Sunday with the same framing — no aggressive retention nag
- **FR92:** Edge cases: (a) user with 0-2 check-ins that week → no summary, no notification, no shame message; (b) user just subscribed mid-week → next Sunday's summary is the full subscriber version; (c) user just cancelled → the subscriber version continues until end of billing period, then the free version

### Three-Space Navigation

- **FR101:** After the closing exchange (FR12), the user enters the post-assessment transition (FR93–FR96): first the **focused portrait reading** at `/me/$conversationSessionId?view=portrait`, then the **full Me identity surface** at `/me/$conversationSessionId` (see FR95). That sequence is the emotional peak. Thereafter, authenticated users can navigate freely across Today / Me / Circle; `/today` is the primary daily landing surface, not a persistent route gate. Legacy `/results/*` URLs may remain as redirects only (UX addendum — canonical `/me` paths)
- **FR102:** The three-space bottom navigation (Today / Me / Circle) is the primary navigation model for authenticated users. `/dashboard` is removed. A thin `/settings` route contains account admin (email, password, data export, delete) accessed via a gear icon on the Me page. Assessment (`/chat`) sits outside the three-space world as an onboarding tunnel — users land in `/chat` from the pre-conversation onboarding after signup + verification
- **FR103:** The public profile remains a separate unauthenticated SSR route (`/public-profile/$id`) distinct from the authenticated Me page (`/me`). Me page contains a "Your Public Face" section as the control center for the public profile route

### Circle & Invite Ceremony

- **FR97:** The Circle page displays people the user cares about as full-width cards ordered organically (no sorting, no search, no recommendations, no directory). Each card shows archetype, OCEAN code, duration ("understanding each other since February"), "last shared" recency signal celebrating moments of mutual understanding (relationship letter views, shared moments, portrait sends — not a streak, no shaming), and a "View your dynamic" link to the relationship letter page
- **FR98:** The Circle page enforces the Intimacy Principle: no count metrics (no "X connections"), no follower/fan/network language, no profile view counters, no sign-up attribution shown to the user, no sorting options, no search, no user directory, no hard cap on circle size. Empty state copy teaches the value system: "Big Ocean is made for the few people you care about. This is where they'll live."
- **FR99:** The invite ceremony dialog uses reward-first copy that leads with the letter (the reward) instead of the 30-minute conversation (the cost). Copy structure: (1) "Discover the dynamic between you," (2) concrete promise — "the parts that click, the parts that clash, and the unspoken rhythms you've been navigating," (3) self-reflexive hook — "a side of yourself that only shows up around them," (4) reframe cost as gift to invitee — "Their side: a 30-minute conversation with Nerin. No forms. No quizzes. Just someone curious about them," (5) privacy promise at send moment — "It stays between the two of you," (6) optional name field as intentionality ceremony, (7) QR / copy link / share via options
- **FR100:** Invite placement: (a) Me page "Your Circle" section (static), (b) Circle page bottom of the list (static), (c) another user's public profile (contextual CTA per FR45), and (d) Nerin references the relational dimension inside the weekly summary on Sunday (highest-converting placement because it fires in the emotional state Nerin just created). User-facing copy uses "letter about your dynamic" or "relationship letter" — never "relationship analysis"

### Post-Assessment Transition

- **FR93:** At the end of the 15-exchange assessment, Nerin's distinct closing exchange (FR12) ends and the input field fades. A single button appears beneath the closing message: **"Show me what you found →"** — user-voiced (user speaking to Nerin), warm, keeps the conversation feel alive for one more beat. Tapping the button navigates the user directly to **`/me/$conversationSessionId?view=portrait`** (canonical focused reading route; `$conversationSessionId` is the completed assessment session id)
- **FR94:** The portrait reading view handles a **generating state**: a centered loading indicator with a single Nerin-voiced line ("Nerin is writing your letter...") and no other content visible (specific component per UX specification). When the portrait is ready, the spinner resolves and the letter fades in — full-screen, distraction-free, max-width 720px, warm background, letter format
- **FR95:** At the bottom of the portrait reading view, a warm link ("There's more to see →") navigates the user to **`/me/$conversationSessionId`** (the full Me identity surface for that assessment: inline portrait, identity hero, radar, scores, Public Face section, and subscription pitch)
- **FR96:** The first Me page visit displays a return seed at the bottom of the page in Nerin's voice: *"Tomorrow, I'll ask how you're doing. Come check in with me."* Paired with a Nerin-voiced notification permission request: *"I'd like to check in with you tomorrow. Mind if I send a quiet note?"* (NOT a system-voice "Enable notifications" prompt). Permission granted → schedule the first daily prompt for the next day at a profile-appropriate time (high-C morning, high-O afternoon) with one default time the user can customize later. Permission denied → relationship still works, the user opens the app themselves, no lock-in

## Non-Functional Requirements

### Performance

- **NFR1:** Nerin response time <2s P95 end-to-end from user message submit to first delivered response (measure server-side)
- **NFR2:** Public profile page LCP <1s (acquisition landing page — bounce rate sensitive)
- **NFR3:** Me / post-assessment identity surface LCP <1.5s (emotional moment after completing 15 exchanges — the session-scoped Me page at `/me/$conversationSessionId` after focused reading per FR95)
- **NFR4:** Chat page initial load <2s, subsequent interactions <200ms (client-side)
- **NFR5:** Portrait generation completes within 60s (async — user notified, not waiting. Benchmark and adjust)
- **NFR6:** Per-assessment LLM cost stays within ~€0.30 budget (cost-efficient LLM for conversation + extraction)
- **NFR7:** Per-portrait LLM cost stays within ~€0.20-0.40 budget, optimizable via model routing
- **NFR7a:** Free-tier ongoing cost per user stays at approximately $0.02-$0.08 per active user per month in MVP. Daily check-ins are silent (zero LLM calls per FR68); the only LLM touchpoint in the free-tier daily/weekly loop is the weekly letter at ~$0.02-$0.05 per user per week (FR87). Subscriber ongoing cost stays at approximately $0.35-$0.75 per subscriber per month in MVP (conversation extension + bundled first-extension portrait regeneration), yielding 93-97% gross margin against €9.99/mo subscription. Cost optimization comes from product design (silent free daily check-ins, LLM-everywhere-Nerin-speaks with rich user context, no template engine), not from degraded generation quality
- **NFR7b:** Cost ceiling architecture: per-user token budgets, hard caps on free-tier LLM usage, circuit breaker for cost spikes during viral events. Budget threshold for circuit breaker: >3x expected weekly-letter cost within any 24h window triggers automated rate limiting with alerting

### Security & Privacy

- **NFR8:** All data in transit encrypted via TLS 1.3
- **NFR9:** Authentication requires 12+ character passwords and compromised credential checks
- **NFR9a:** Unverified accounts cannot access any authenticated route. All protected routes check verification status and redirect unverified users to the verify-email page
- **NFR9b:** Verification email links expire after 1 week. Expired links redirect to the verify-email page with a prompt to request a new link
- **NFR10:** Row-level data access control ensures users can only access their own data
- **NFR11:** Public profiles default to private — zero public discovery without explicit user opt-in
- **NFR12:** Conversation transcripts stored indefinitely; retrievable within 2s regardless of age
- **NFR13:** Relationship analysis data does not expose raw conversation transcripts to the other party
- **NFR14:** Account deletion cascades to all user data and shared relationship analyses

### Reliability

- **NFR15:** Assessment completion without server-side errors >99% measured rolling 30-day across started assessments (errors = HTTP 5xx, pipeline failure, or transcript persistence failure)
- **NFR16:** Portrait generation completes successfully >99% measured rolling 30-day across portrait generation jobs (failures after automatic retries count against this rate)
- **NFR17:** Portrait generation retries automatically on failure
- **NFR18:** Cost guard never terminates an active session — only blocks at session boundaries
- **NFR19:** Conversation sessions are resumable after browser close or connection loss

### Accessibility

- **NFR20:** WCAG 2.1 AA compliance required for: public profile, conversation UI, Me page and session-scoped identity views (including post-assessment trait and evidence UI), subscription modal. Best-effort AA for remaining pages
- **NFR21:** Chat interface keyboard-navigable with proper ARIA labels
- **NFR22:** Score visualizations (facet bars, trait bands) have text alternatives
- **NFR23:** Ocean theme color palette meets AA contrast ratios
- **NFR24:** Proper focus management in modals (subscription, ritual screen)

### Integration

- **NFR25:** Embedded checkout integration for subscription billing (€9.99/mo)
- **NFR26:** The system can switch LLM providers without code changes to the conversation or portrait pipeline
- **NFR27:** Transactional email delivery. Three email types: (1) drop-off re-engagement with last territory, (2) Nerin check-in ~2 weeks post-assessment, (3) subscription conversion nudge for engaged free users. Relationship analysis notifications delivered within 5 minutes of completion, >95% delivery rate. Confidence milestone notifications within 1 hour of threshold

### Observability

- **NFR28:** System logs include per-session cost, completion status, and error events in structured format

### Data Consistency

- **NFR29:** Personality scores displayed to users are never stale — always recomputed from current facet evidence at read time (see FR15 for mechanism)
