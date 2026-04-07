---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit"]
lastEdited: '2026-04-06'
editHistory:
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
  - "innovation-strategy-2026-04-06.md (strategic repositioning, subscription model, agent platform, disruption vectors)"
  - "architecture.md (consolidated, 2026-03-15)"
  - "problem-solution-2026-03-13.md"
  - "brainstorming-session-2026-03-13.md"
  - "epics-conversation-pacing.md"
  - "epics-nerin-steering-format.md"
  - "epics-innovation-strategy.md"
  - "ux-design-innovation-strategy.md"
  - "public-profile-redesign-architecture.md"
  - "public-profile-redesign-ux-spec.md"
  - "ux-design-specification.md (2026-02-12, outdated — included as context)"
  - "COMPLETED-STORIES.md"
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
  completedStoriesDocs: 1
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
  strategicFrame: "Assessment is the onboarding, personality-aware companion is the product, experience quality is the competitive advantage"
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
    - "PWYW portrait deepens self-recognition, proves AI capability"
    - "Portrait quality drives trust in relationship analysis"
    - "Satisfied user becomes ambassador, recruits their people"
  monetization:
    free: "15-exchange assessment + OCEAN code + archetype + trait/facet scores + shareable public profile"
    portrait: "PWYW (€1+ minimum) — Sonnet-generated narrative portrait"
    relationshipAnalysis: "€5/credit for additional relationship analyses"
    subscription: "€10/mo or €100/yr — Coach agent, conversation extension, Growth Journal, pattern analysis, monthly reflection, complete portrait at 30/30, annual portrait, unlimited relationship portraits"
  growthHorizons:
    Phase1a_MVP: "Assessment → portrait → relationship analysis (2-person) → social sharing"
    Phase1b: "Daily check-in (optional, free), mood timeline, mobile wrapper, retention validation"
    Phase2a: "Coach agent + subscription launch, pattern detection, monthly reflection"
    Phase2b: "Agent expansion (Relationship, Career), cross-agent intelligence, smart nudges"
    Phase2c: "Annual portrait ritual (Personality Wrapped)"
  growthModel:
    acquisition: "Relationship analysis recruits users, archetype sharing creates impressions"
    conversion: "Portrait self-recognition proves quality, drives PWYW + relationship credits"
    retention: "Subscription — specialized agents sharing personality architecture (post-MVP)"
    ambassador: "Satisfied users recruit their people for relationship analysis"
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

**Differentiator:** "You don't have to explain yourself." The only product where an AI already understands who you are before you ask for help. ChatGPT requires self-awareness to produce good advice; big-ocean does the self-awareness work for you through the assessment. This combines guided conversational UX, LLM-powered adaptive assessment, social sharing (archetype cards, public profiles), structured 2-person relationship analysis, and a personality-aware companion layer (post-MVP). The assessment experience IS the marketing — conversation quality drives self-recognition, self-recognition drives sharing, sharing drives growth.

**Jobs to be done:**

| # | Job | MVP | Monetized? | Retention? |
|---|-----|-----|-----------|-----------|
| 1 | "Help me understand why I am the way I am" | Assessment + Portrait | PWYW | One-time |
| 2 | "Help me navigate a specific situation" | NOT SERVED (post-MVP: Coach agent) | Subscription | Event-based return |
| 3 | "Help me understand my relationship" | Relationship analysis | €5/credit | Occasional |
| 4 | "Help me grow over time" | NOT SERVED (post-MVP: Growth Journal) | Subscription | Habitual return |

Jobs 1 and 3 are served at MVP. Jobs 2 and 4 are where retention lives — the subscription layer that transforms big-ocean from a one-time assessment into a platform people return to.

**Business model:** Free assessment (OCEAN code + archetype + scores + public profile) → PWYW portrait (€1+ minimum, grants 1 free relationship analysis credit) → relationship analysis credits (€5/additional). Target: 100 completed assessments in 3 months, break-even on LLM costs (~€0.20/assessment, ~€0.20/portrait). LTV is generated by the subscription (€10/mo or €100/yr, post-MVP) — specialized agents (Coach, Relationship, Growth Journal, Career) sharing the user's personality architecture. See [Product Scope](#product-scope) for the staged A→B strategy and phase triggers.

**Current state:** Brownfield — hexagonal architecture, auth, CI/CD, cloud deployment, and infrastructure already built. Primary gaps: Nerin character quality (~40% → launch-ready) and homepage conversion (the homepage must communicate what the product is and why it's worth ~30 minutes to visitors with zero context — the product consistently exceeds expectations, but the homepage undersells the experience). The credibility chain (conversation → self-recognition → portrait revelation → trust → ambassador) requires every link to work at launch.

## Success Criteria

### User Success

**Conversation Engagement (the "stay" metric):**
- Users experience 2-3 "feel seen" moments during a 15-exchange conversation — moments where Nerin makes an observation about a pattern in the user's behavior or personality that resonates *(delivered by: FR3 Director model, FR6 portrait teasing, FR7 observation framing)*
- Users complete the full 15 exchanges without dropping out (completion rate target: >70%) *(delivered by: FR4 depth meter, FR5 milestones)*
- Mid-conversation dropout tracked by exchange number — specifically monitor exchanges 7-12 where novelty has worn off but payoff hasn't arrived
- Users feel the conversation was with a distinct character (Nerin as ocean dive master with marine metaphors), not a generic AI *(delivered by: FR2 persona, FR8 greeting)*

**Portrait Payoff (the "worth it" metric):**
- Users experience **self-revelation** when reading their portrait — not just "that's me" (recognition) but "I never articulated it that way but that's exactly what's happening" (revelation) *(delivered by: FR20 portrait generation, FR21 PWYW modal)*
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
- PWYW portrait conversion rate >20% of completed assessments
- Average PWYW amount >€3 (signals perceived value)
- Relationship analysis credit purchases (signals willingness to pay for social features)

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
- Per-assessment cost (all LLM calls) stays within ~€0.20 budget for Haiku conversation + extraction
- Per-portrait cost (Sonnet) stays within ~€0.20

### Measurable Outcomes

| Metric | Target | Timeframe | Why it matters |
|--------|--------|-----------|----------------|
| Completed assessments | 100 | 3 months | Primary success signal |
| Completion rate | >70% | Ongoing | Conversation quality proxy |
| Mid-conversation dropout | Monitor exchanges 7-12 | Ongoing | Identifies engagement valley |
| Relationship analyses initiated (QR accepted) | >30 | 3 months | Growth engine validation |
| QR-accept→completion rate | >40% | Ongoing | Ambassador quality signal |
| PWYW conversion | >20% | Ongoing | Portrait value validation |
| Portrait emotional impact | Share rate >30%, return visit within 48h >40% | Ongoing | Self-revelation behavioral proxies |
| Territory compliance | >70% | Ongoing | Director model effectiveness |
| Nerin character distinctiveness | Qualitative | Pre-launch | Assessed via test sessions |
| Homepage bounce rate | <60% | Ongoing | Cold visitors stay long enough to understand the product |
| Homepage → sign-up conversion | >5% | Ongoing | Homepage messaging drives assessment starts |
| Time to CTA click | <90s median | Ongoing | Messaging clarity — visitors understand fast enough to act |

### Phase Transition Triggers (MVP → Subscription)

The trigger to launch the subscription (Coach agent) is metric-based, not time-based. When 4 of 5 fire → launch Coach agent subscription:

| Trigger | Threshold |
|---------|-----------|
| Completed assessments | >1,000 |
| Portrait PWYW conversion | >15% |
| Viral coefficient | >0.5 |
| NPS on portrait | >50 |
| "Would talk to Nerin again?" | >40% yes |

### Phase 2 Success Criteria (Subscription)

| Metric | Target | Why it matters |
|--------|--------|----------------|
| Subscription conversion | >2% of completed assessments | Validates willingness to pay for ongoing value |
| Subscriber M1 retention | >70% | Coach agent delivers enough value to retain |
| Coach NPS | >50 | Personalized coaching feels different from generic AI |
| "Felt generic" feedback | <30% | The personality architecture is producing meaningfully better advice |
| Monthly reflection engagement | >60% of subscribers | Subscribers find the AI intelligence layer valuable |

**If "Would talk to Nerin again?" <30%, the subscription model collapses.** big-ocean becomes a profitable transactional business at €75K-300K/year. Honest outcome — not every business needs to be a platform.

## Product Scope

### MVP — Minimum Viable Product

The full journey (conversation → results → portrait → relationship analysis → social sharing) must work at launch. The credibility chain requires every link.

**Platform:** 15-exchange adaptive conversation with Nerin (dive master persona), Director model (evidence extraction → coverage analysis → Nerin Director → Nerin Actor), ConversAnalyzer v2 dual extraction, derive-at-read scoring (30 facets → 5 traits → OCEAN code → archetype).

**Application:** Free results (OCEAN code, archetype, scores, public profile) + portrait (PWYW €1+, grants 1 free relationship analysis credit) + relationship analysis (2-person) + Polar.sh payments.

**Critical gap:** Nerin character quality (~40% → launch-ready). Dive master persona, encouragement system, "feel seen" moment accent, distinct memorable voice. Infrastructure already built (auth, hexagonal architecture, Railway, CI/CD).

See [Project Scoping & Phased Development](#project-scoping--phased-development) for detailed feature breakdown, post-MVP phases, and risk mitigation.

### Strategic Direction: A→B — The Staged Platform Play

Not "build a personality test" or "build an agent platform" — build A then B, sequenced with metric-based triggers.

**Phase 1 (Prove the Foundation):** Launch assessment + portrait + relationship analysis. Prove the credibility chain works. Hit validation metrics.
**Phase 2 (Build the Intelligence Layer):** Launch agent platform subscription. But DESIGN Phase 2 during Phase 1 so you can ship fast when triggers fire.

The MVP focuses entirely on the first-time user experience — getting someone in, through the conversation, to their results and portrait. LTV is the subscription story that comes after.

### Free vs Paid Tiers

| Layer | Free | PWYW | Subscription (€10/mo or €100/yr) |
|-------|------|------|----------------------------------|
| Assessment (15 exchanges) | Yes | — | — |
| OCEAN code + archetype + scores | Yes | — | — |
| Public profile + sharing | Yes | — | — |
| Data comparison (relationship) | Yes | — | — |
| First relationship portrait | Yes (1 free credit with portrait purchase) | — | — |
| Personal portrait | — | €1+ minimum | — |
| Additional relationship analyses | — | — | Included |
| Conversation extension | — | — | Included |
| Coach agent | — | — | Included |
| Growth Journal (deep sessions) | — | — | Included |
| AI pattern analysis + monthly reflection | — | — | Included |
| Complete portrait at 30/30 facets | — | — | Included |
| Annual portrait regeneration | — | — | Included |

**Principle:** Data INPUT is free. AI INTELLIGENCE on that data is paid. The assessment generates the data that makes the subscription valuable — gating it behind payment limits data accumulation and weakens the conversion funnel.

### Post-MVP Phases

**Phase 1b — Validate Retention (1,000 → 10,000 users)**
- Daily check-in (optional, free) + mood timeline on dashboard
- Post-assessment survey ("Would you talk to Nerin again?")
- Mobile wrapper with push notifications
- Viral loop optimization
- Exit criteria (5 of 6): >3,000 assessments, viral coeff >0.5, check-in opt-in >25%, check-in Day 30 retention >40%, "talk to Nerin again" >40%, PWYW >15% sustained

**Phase 2a — Coach Agent + Subscription Launch**
- Coach agent (beta 50-100 users first) — event-driven ("I have a situation")
- Subscription (€10/mo, €100/yr)
- Conversation extension (included in subscription)
- Pattern detection + monthly reflection
- Growth Journal deep sessions
- Life Events + Patterns dashboard sections
- Crisis detection guardrails
- Exit criteria: >200 subscribers, conversion >2%, M1 retention >70%, Coach NPS >50, reflection engagement >60%

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

During Phase 1, design (don't build): conversation schema for multiple session types, agent type field on conversations, personality context injection pattern, per-agent session memory, subscription billing flow, crisis detection guardrails, daily check-in data model.

## User Journeys

### Journey 1: The Curious First-Timer — Léa

**Who she is:** Léa, 28, UX designer in Lyon. Interested in psychology, has taken 16Personalities twice but found the results generic. Sees a friend's archetype card on Instagram — "The Beacon" with an ocean-themed visual and an OCEAN code she doesn't recognize. She's intrigued: *what's my code?*

**Opening Scene:** Léa taps the card link, lands on her friend's public profile. The archetype name and OCEAN code are front and center — a one-line hook beneath. She scrolls: detailed scores and facet bars are there for the curious, giving a scientific credibility ("this isn't astrology") without overwhelming the first impression. The archetype description feels specific — not "you're creative and empathetic" but a narrative that reads like someone actually *knows* this person. At the bottom: "Discover your own." She signs up, receives a verification email, confirms her address, and enters the platform.

**Rising Action:** Nerin greets her — not with a form, but with a question about her daily routines. The tone is warm, specific, slightly playful. Ocean metaphors. A depth meter sits on the left edge of the screen, quietly tracking the conversation's progress. By exchange 5, Nerin says something like: "You mentioned you redesign your workspace every few months but you've kept the same morning routine for years. That's an interesting tension — the part of you that craves novelty has a deal with the part that needs anchoring." Léa pauses. That's... exactly right. She's never thought about it that way.

Around exchange 9, she hits a natural lull — novelty has worn off. (Note: the specific exchange number is illustrative — steering is driven by energy and telling signals, not fixed turn numbers.) But the depth meter has been climbing, she's past the 50% milestone marker, and Nerin drops a progress signal: "We're getting somewhere interesting." She stays.

**Climax:** Exchange 13. Nerin makes an observation about how Léa handles conflict at work vs with her partner — she avoids in one domain, confronts in the other. The pattern lands with emotional weight. During the conversation, Nerin has been teasing: he's seen things about her, and he wants to show her. The 75% milestone passes. She finishes the 15 exchanges genuinely curious about what Nerin has written.

**Resolution:** Léa sees her OCEAN code, her archetype ("The Beacon"), her trait and facet scores. The scores feel right. Then the PWYW modal opens automatically. It's not a paywall — it's personal. Vincent, the founder, congratulates her for completing the journey. He shares why he built big-ocean: the portrait Nerin wrote for *him* changed how he sees himself — like Nerin held up a mirror. She reads Vincent's actual portrait — his struggles, his vulnerabilities, why this product exists. She can see exactly what a portrait looks like and judge: *is this worth it to me?* She pays €5. Nerin's letter to her arrives — not a report, but a personal letter naming her core tension: creative ambition held in check by a need for external validation. She screenshots her archetype card and sends it to three friends: "You have to try this."

**Recovery beat — what if the portrait doesn't land?** If Léa reads the portrait and thinks "that's not me," the credibility chain breaks. Behavioral signals (no share, no return visit) capture this. The subscription (conversation extension + deeper sessions) becomes the long-term recovery path — more exchanges produce better evidence, which produces a richer, more accurate letter from Nerin.

**Capabilities revealed:** Sign-up flow, 15-exchange conversation with Nerin, Director model (territory coverage, feel-seen moments), depth meter + progress milestones (25%/50%/75%), Nerin teasing portrait during conversation, results page (OCEAN code, archetype, scores), PWYW modal with founder story + example portrait, portrait as Nerin's letter, behavioral proxy tracking, archetype card sharing, public profile as landing page.

### Journey 2: The Invited User — Marc

**Who he is:** Marc, 34, Léa's partner. Not into personality tests. Léa completed her assessment and wants to use her free relationship analysis credit.

**Opening Scene — The QR Flow:** Léa opens the QR drawer in the app. Marc scans the code with his phone (or opens the URL it contains). He lands on a screen showing Léa's archetype card, both users' confidence rings, and Léa's available credit balance, with Accept and Refuse buttons. Marc understands: Léa wants to understand their relationship better, and it starts with a 30-minute conversation about him. He knows what Léa got out of it — she's been talking about her portrait — so there's social proof before he even starts. He accepts, creates an account, verifies his email, and enters the platform. Note: Marc is the highest-intent visitor type — he already has social proof from his partner. If he visits the homepage before completing signup, the generic self-discovery narrative is a mismatch. The homepage content must work for visitors who already have a reason to be here and just need a clear path forward (FR66).

**Rising Action — The Skeptic's First Exchanges:** Marc meets Nerin and expects a quiz. Instead, Nerin asks about his weekend — what he does when nothing is planned. Marc answers briefly. Exchanges 2-5 are short, low-energy responses. The Director model detects this: low telling score, guarded energy. It responds by keeping territories light (daily routines, comfort zones), using soft entry pressure, and letting Marc set the pace. Nerin doesn't push — she stays curious without demanding depth. But Nerin isn't passive either — by exchange 5, she drops something specific enough to catch Marc's attention: an observation about the *way* he talks about routine, not just what he says. By exchange 6, Marc notices Nerin keeps circling around structure — meal prep, workout schedule, project timelines — and Nerin says: "You build systems for things most people leave to chance. I'm curious what happens when the system breaks." Marc laughs — that's exactly what Léa says about him. The depth meter starts climbing. He leans in.

**Climax:** Exchange 12. Nerin connects something Marc said about his father's expectations to how he handles feedback at work. Marc didn't expect to go there. The observation is specific enough that he feels *seen*, not analyzed. Nerin teases what he's been noticing — there's a letter waiting at the end. Marc finishes the conversation with a sense that this thing actually understood something real.

**Resolution — The Relationship Analysis:** Marc gets his results — a different archetype than Léa, but they share letters in their OCEAN codes, which makes the similarities visible at a glance. The PWYW modal opens with the founder's story — Marc reads Vincent's portrait, sees what a portrait looks like, pays €3 for his own letter from Nerin.

Now both assessments are complete — the relationship analysis generates. When they open it, a ritual screen greets them: a suggestion to find a quiet moment, sit down together, and discuss what they discover. The ritual has a single Start button — no skip option. They choose to read it side by side — a structured comparison of how they handle conflict, emotional expression, decision-making. It names the dynamic they've been navigating for years but never articulated. They talk about it over dinner. Marc tells his friend Thomas: "It's not what you think — it's actually good."

**Capabilities revealed:** QR flow (drawer + scan/URL), Director model adaptation for low-motivation/guarded users (soft pressure, light territories, early hook), depth meter + milestones, relationship analysis generation (triggered when both complete), ritual suggestion screen, cross-profile data correlation, OCEAN code comparison (shared letters = shared traits), PWYW modal with founder story, portrait as Nerin's letter, conversion of skeptic into ambassador.

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

**Climax:** Month 2. Vincent sees the first organic signups — users he didn't seed. Relationship analysis QR scans are driving new completions. He tracks the viral coefficient: 1.3 — each user is bringing slightly more than one new user. PWYW revenue trickles in: average €4.20/portrait, 25% conversion. The unit economics work. Then he sees a user who shared their archetype card within minutes of unlocking their portrait, followed by a return visit the next day and a message to a friend. That's the moment he knows the product is real — not the metrics, the behavioral signal behind the metrics.

**Resolution:** Vincent monitors cost per assessment (~€0.18 on Haiku), portrait generation costs (~€0.15 on Sonnet), and platform reliability (99.2% completion without errors). He's watching the ambassador quality signal: early users describe the experience as "it actually understood me" rather than "try this test." The product is working.

**Capabilities revealed:** Admin dashboard/monitoring, completion funnel analytics, mid-conversation dropout tracking by exchange number, steering compliance metrics, cost tracking per assessment/portrait, viral coefficient measurement, revenue reporting, error monitoring, Director model observability.

### Journey 6: The Cold Visitor — Inès

**Who she is:** Inès, 32, product manager in Paris. She stumbles onto the homepage from a Google search about personality assessments. She's never heard of Big Ocean, doesn't know the Big Five, and has no social proof from friends. She has 10 seconds of attention to give.

**Opening Scene — The First 3 Seconds:** Inès reads a headline that stops her — not a comparison to other tests (she hasn't taken any), but a promise that lands: something about discovering a part of yourself you've never been able to articulate. Below, a single line of context: a 30-minute conversation with an AI that writes you a personal letter about who you are. One CTA. No competing options. She's intrigued — that's a specific, unusual promise.

**Rising Action — The Scroll:** She scrolls. The page doesn't shift into a sales pitch — it stays in conversational format. She sees Nerin say something to a user that's startlingly specific: a pattern observation that feels like it could only come from a real conversation. It's not a feature description — it's proof of depth. A few beats later, a short excerpt from a portrait — a paragraph that reads like a letter from someone who knows you. Not generic. Not flattering. *Specific.* She thinks: "I want to know what it would say about me." The page addresses the question forming in her head: "Is 30 minutes a lot?" A beat explains what the time feels like — not a quiz, not awkward, more like a conversation that keeps surprising you. Another beat mentions the pricing model — pay what you want, starting at €1. She registers: this isn't a paywall trap.

**Climax — The Decision:** Inès doesn't need to be convinced the method is better than a quiz. She needs to believe the output will be worth 30 minutes. The portrait excerpt did that. The Nerin conversation snippet did that. The PWYW transparency removed the last friction. She clicks the CTA.

**Resolution:** She signs up, verifies her email, and meets Nerin. She came in cold and converted on three things: a sharp hook, concrete proof of output quality, and zero pricing surprise.

**Capabilities revealed:** Homepage messaging (FR59), universal hook without test-frame reference (FR60), single primary CTA (FR61), portrait excerpt as early proof (FR62), Nerin conversation preview showing character depth (FR63), fear-addressing content for process anxiety and time commitment (FR64), PWYW transparency as trust signal (FR65), multi-persona content that works for zero-context visitors (FR66).

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|--------------------------|
| **Léa (First-Timer)** | Sign-up with email verification (FR50, FR50a, FR50b), conversation (FR1), Director model (FR3), depth meter + milestones (FR4, FR5), Nerin portrait teasing (FR6), results page (FR16), PWYW modal (FR21), portrait as Nerin's letter (FR20), behavioral proxy tracking (FR24), archetype sharing (FR44, FR46), public profile landing (FR39) |
| **Marc (Invited)** | QR flow (FR28), Director model adaptation for guarded users (FR3), early hook for skeptics (FR6), depth meter (FR4), relationship analysis (FR29), ritual suggestion screen (FR31), OCEAN code comparison (FR39), ambassador conversion (FR33) |
| **Léa (Returning Subscriber, illustrative)** | Coach agent, personality-aware advice, cross-agent intelligence, event-driven return — no FRs yet (post-MVP) |
| **Thomas (Profile Visitor)** | Public profile (FR39, FR42), OG tags (FR41), archetype as social object (FR46), OCEAN code comparison (FR39), CTA funnel (FR43) |
| **Vincent (Founder)** | Admin monitoring (Nice-to-Have), completion funnel (FR24), dropout analytics (Nice-to-Have), steering compliance (FR3), cost tracking (FR55), viral metrics (Nice-to-Have) |
| **Inès (Cold Visitor)** | Homepage messaging (FR59), universal hook (FR60), single CTA (FR61), portrait excerpt as proof (FR62), Nerin conversation preview (FR63), fear-addressing content (FR64), PWYW transparency (FR65), multi-persona content (FR66) |

**Critical path:** Journeys 1→2 form the growth loop. The PWYW modal (founder vulnerability + example portrait) is the monetization conversion moment. The relationship ritual transforms the product from individual tool to shared experience. Journey 5 ensures operational visibility.

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
- **Per-relationship consent:** Initiator implicitly consents by generating the QR token. Recipient consents by accepting on the QR accept screen (both users must have completed assessments). Single consent gate — like accepting a friend request
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

**7. PWYW with Founder Vulnerability**
The payment modal shows the founder's own portrait — his struggles, his vulnerabilities, why he built this. This creates an emotional connection that frames payment as participation in something personal rather than a transaction. The user sees a concrete example of the product's output and judges its value before deciding what to pay.

**8. Relationship Analysis Ritual as Harm Reduction**
The ritual screen (read together, discuss) and framing guardrails (dynamics not deficits, no blame) aren't just UX — they're a harm reduction mechanism for how personality data is consumed. Accurate personality intelligence will sometimes surface uncomfortable truths. The innovation is creating a container where difficult discoveries are productive rather than destructive.

### Disruption Vectors

**1. Assessment-as-Onboarding Flip:** The entire $6-11B market treats assessment as the product. big-ocean treats it as onboarding — how the AI learns you. The product is everything after. If the result is free onboarding, competitor models (pay for results) collapse.

**2. "Don't Have to Explain Yourself" Category:** No product category exists for "an AI that already understands who you are." This is non-consumptive disruption — serving people who currently do nothing (situation "not bad enough for therapy," can't afford coaching, processing things alone because explaining is exhausting). The non-consumer market is enormous.

**3. Agent Platform as Network (post-MVP):** Linear value chain (user → test → result) transforms into multi-sided platform: users (bring personality data), specialized agents (serve different jobs from same data), and eventually third-party integrations. Network effects: more users → richer data → better agents → more users.

**4. Incomplete-by-Design as Strategic Weapon:** Every competitor maximizes completeness. big-ocean deliberately assesses ~25/30 facets in 15 exchanges. This is MORE trustworthy (honest about what 30 minutes can discover), creates subscription demand (explore the gaps), and enables cross-agent referrals driven by data gaps. No competitor will copy this because it requires product quality confidence.

### Blue Ocean ERRC Grid

| Strategy | Actions |
|----------|---------|
| **Eliminate** | Multiple-choice questionnaires, type categorization / 4-letter codes, clinical language, dashboard as primary result |
| **Reduce** | Assessment length (15 exchanges vs 50-100+ items), framework breadth (one framework done deeply), price of entry (PWYW from €1 vs $29-49 reports) |
| **Raise** | Personalization depth (16 types → millions of unique 30-facet profiles), emotional impact, relationship insight, scientific credibility, viral shareability (81 archetypes > 16 letter codes) |
| **Create** | Conversational assessment, coherence-based scoring, "you don't have to explain yourself" experience, personality-aware life companion (post-MVP), incomplete-by-design assessment, portrait as ritual |

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

big-ocean's unique position: the only product where the assessment experience IS the marketing AND the assessment is the onboarding for an ongoing relationship. The structural advantage is that conversation quality, sharing behavior, and growth are the same system — not separate concerns. The "don't have to explain yourself" factor is entirely new to the market.

**Revenue model clarity:** MVP monetization (portrait PWYW + relationship credits) targets break-even while building the user base and data moat. Subscription (post-MVP) generates LTV through specialized agents sharing the personality architecture.

### Validation Approach

**Pre-launch validation (first 20 seeded users):**
- Do users describe the experience as something *new*, or map it to something existing? ("Better 16Personalities" = category not landing. "I've never done anything like this" = category exists.)
- Do users spontaneously share without being asked? Spontaneous sharing is the category signal
- What language do users use when describing it to friends? Their words reveal whether the category is landing

**Post-launch validation:**
- 100 completed assessments in 3 months — if users complete and share, the category exists
- >70% completion rate — proves the control system works as an experience
- PWYW conversion >20% — portrait self-revelation drives willingness to pay
- Break-even signal — MVP monetization covers LLM costs. Not a profit target, a sustainability floor
- Viral coefficient >1 — relationship analysis drives organic acquisition
- Character resonance — do users describe Nerin as a character, or as "the AI"?

### Risk Mitigation

See [Risk Mitigation Strategy](#risk-mitigation-strategy) in Project Scoping for the consolidated risk table covering both innovation and execution risks.

### Strategic Priorities

**1. Conversation engine is the primary innovation investment.** The Director model + Nerin character must work before anything else matters. If the first 20 users don't complete and don't feel seen, no amount of archetype cards, public profiles, or payment modals will save the product.

**2. Iteration over perfection.** The 81 archetypes, territory descriptions, mirror system, and templates are first drafts that will improve with real user data. Ship, learn, refine. Don't over-polish pre-launch.

**3. Relationship analysis as emergent product identity.** The relationship analysis may become what people *call* the product — "have you done a big-ocean with someone?" is a social behavior, not a feature. Design for this possibility even though it can't be forced.

**4. Data flywheel as long-term moat.** ConversAnalyzer improves → portraits improve → more users → more data → ConversAnalyzer improves. This flywheel is the company's long-term defensibility. Every conversation makes the next one better.

**5. Protect the founder story.** The PWYW modal with the founder's portrait is the soul of the product. Keep it even as the company grows.

## Web App Specific Requirements

The following specifications ensure the experience described above works reliably across devices and contexts.

### Project-Type Overview

big-ocean is a hybrid SSR web application built with TanStack Start (React 19) with server-rendered pages and client-side navigation. The primary user experience is a conversational interface (chat with Nerin) and results pages. SEO is critical for public profiles which serve as the top-of-funnel acquisition channel.

### Browser Support

- **Target:** Modern evergreen browsers — Chrome, Firefox, Safari, Edge (latest 2 versions)
- **No IE11 or legacy browser support**
- **Mobile browsers:** Safari iOS, Chrome Android (latest 2 versions) — conversation UX must work well on mobile given social sharing flows start on phones (tapping archetype cards from Instagram/messaging apps)

### Responsive Design

- **Mobile-first for conversation and results pages** — users arriving from shared archetype cards on social/messaging apps will be on mobile
- **Public profile must render well on mobile** — it's the first impression for potential users
- **Desktop optimized for extended sessions** — relationship analysis reading and deeper exploration benefit from larger screens
- **Depth meter placement** — left edge on desktop, adapts for mobile viewport

### Performance Targets

- **Public profile page:** <1s LCP (Largest Contentful Paint) — this is the acquisition landing page, speed matters for bounce rate
- **Chat page:** <2s initial load, then instant client-side interactions. Nerin response time <2s P95 (server-side, already defined in technical success criteria)
- **Results page:** <1.5s LCP — users arrive here with anticipation after completing 15 exchanges, delay kills the emotional moment
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
- **Landing/marketing pages:** SSR for SEO. Standard meta tags, structured data
- **Conversation and results pages:** Not indexed (behind auth). `noindex` meta tag
- **Sitemap:** Public profiles only (for users who opt into public visibility)

### Accessibility

- **Target:** WCAG 2.1 AA compliance
- **Conversation UX:** Chat interface must be keyboard-navigable, screen-reader compatible, with proper ARIA labels for depth meter and progress milestones
- **Public profile:** Score visualizations (facet bars, trait bands) must have text alternatives
- **Color contrast:** Archetype card colors and ocean theme palette must meet AA contrast ratios
- **Focus management:** Proper focus handling in PWYW modal and relationship analysis ritual screen

### Implementation Considerations

- **SSR framework:** TanStack Start (already in use) — server-rendering for public profiles and landing pages, client-side for authenticated experiences
- **Deployment:** Railway (already in use) — single region for MVP
- **CDN:** Consider for static assets and OG images as public profile traffic grows
- **Image optimization:** Archetype card images and OG previews should be generated and cached, not computed per request

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** End-to-end experience MVP — the full journey (conversation → results → portrait → relationship analysis → social sharing) must work at launch. No staged rollout. The credibility chain requires every link to be present for the growth loop to activate.

**Resource:** Solo founder. Architecture (hexagonal, Effect-ts) and infrastructure (Railway, CI/CD) already built to minimize ops burden. Most infrastructure is in place — focus is on conversation engine quality and feature completion.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** All five MVP journeys (Léa first-timer, Marc invited, Thomas profile visitor, Vincent founder, Inès cold visitor) + one illustrative post-MVP journey (Léa returning subscriber)

**Must-Have Capabilities:**

| Capability | Justification |
|-----------|--------------|
| 15-exchange conversation with Nerin character | The product IS the conversation |
| Director model (evidence extraction → coverage analysis → Director → Actor) | Without it, Nerin is just ChatGPT |
| Nerin dive master persona + ocean metaphors | Character distinctiveness = memorability = sharing |
| Depth meter + progress milestones (25%/50%/75%) | Prevents mid-conversation dropout |
| Nerin portrait teasing during conversation | Builds anticipation for the payoff |
| Results page (OCEAN code, archetype, scores) | Free tier value — the self-recognition moment |
| PWYW modal with founder story + example portrait | Monetization conversion moment |
| Portrait generation (Nerin's letter, Sonnet) | The payoff — the "worth it" moment. Portrait unlock uses a simple button ("Nerin has written something for you. Unlock your portrait."), not a visual envelope |
| Behavioral proxy tracking (share rate, return visits) | Measures self-revelation via behavioral signals |
| Public profile (default-private, shareable) | Top-of-funnel acquisition channel |
| OG meta tags + archetype card image | Social sharing is the passive growth channel |
| QR flow (drawer + scan/URL) | Relationship analysis requires connecting with someone |
| Relationship analysis (2-person, both-complete trigger) | The growth engine — each QR scan = potential new user |
| Ritual suggestion screen (Start button only, no skip) | Harm reduction + experience enhancement |
| Per-relationship consent (accept gate) | Domain requirement — privacy |
| Relationship analysis credits (1 free on first portrait purchase PWYW ≥€1; €5/additional) | Revenue + multi-relationship use case |
| Polar.sh payment integration | PWYW + credits |
| Transactional emails via Resend (3 types: drop-off re-engagement with last territory, Nerin check-in ~2 weeks post-assessment, deferred portrait recapture) | Brings users back — lifecycle triggers for retention and conversion |
| Homepage conversion content (messaging, hook, portrait preview, fear-addressing, PWYW transparency) | The product is better than the marketing — cold visitors need to understand the value in 3 seconds. Without a converting homepage, growth depends entirely on social sharing |
| Auth (Better Auth) | Already built |
| Cost guard (session-aware) | Prevents budget blowout without killing sessions |

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

**Phase 1b — Validate Retention (1,000 → 10,000 users):** Daily check-in (optional, free), mood timeline, mobile wrapper, post-assessment survey, viral loop optimization.

**Phase 2a — Coach Agent + Subscription:** Coach agent, subscription (€10/mo, €100/yr), conversation extension (subscription), pattern detection, monthly reflection, crisis detection.

**Phase 2b — Agent Expansion:** Relationship agent, Career agent, cross-agent intelligence, smart nudges, complete portrait at 30/30.

**Phase 2c — Annual Ritual:** Annual portrait regeneration ("Personality Wrapped"), year-in-review dashboard.

### Risk Mitigation Strategy

**Execution Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Nerin character quality (~40% → launch-ready)** | High — credibility chain breaks at step 1 | #1 pre-launch investment. Director model overhaul |
| **Director model compliance** | High — low territory compliance degrades conversation quality | Already architected. Ship at 70% compliance, improve iteratively |
| **Portrait quality** | High — no self-revelation = PWYW fails | Sonnet generation with rich evidence. Test with first 20 users |
| **Relationship analysis quality** | Medium — new feature, unvalidated | Ship simpler V1, iterate on user feedback |
| **Solo founder bandwidth** | High — ambitious MVP for one person | Most infrastructure built. Conversation engine first, layer features |

**Innovation Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Category doesn't exist (no market)** | Critical | Seed first 20 users, observe category language and spontaneous sharing before scaling |
| **Director model feels mechanical** | High | Character voice + desire framing provide naturalness on top of Director outputs |
| **Ocean theme limits appeal** | Medium | Test via archetype card sharing — if cards get shared, theme works |
| **PWYW settles at minimum (€1)** | Medium | Survivable if relationship credits convert. Iterate framing before changing model |
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
| G1: Launch → Scale | NPS >40, PWYW >15% | Iterate Nerin quality |
| G2: Scale → Check-in | Viral coeff >0.3 | Fix sharing mechanics |
| G3: Check-in → Subscription | 4/5 phase transition triggers fire (see Success Criteria) | If "talk again" <30%, stay transactional |
| G4: Beta → Public subscription | Coach NPS >50, "felt generic" <30% | Iterate until "don't have to explain myself" lands |
| G5: Single → Multi-agent | M3 subscriber retention >50% | Price reduction or iterate Coach before adding agents |

### Key Hypotheses

| Hypothesis | Kill Criteria |
|-----------|--------------|
| 15-exchange conversation creates wonder | NPS <30 or sharing <10% |
| Portrait makes people feel seen | PWYW <10% or avg <€1 |
| Relationship analysis drives viral acquisition | Invite acceptance <20% or viral coeff <0.3 |
| Users want to talk to Nerin again | <30% express interest |
| Coaching feels meaningfully personalized | NPS <40 or "felt generic" >30% |

**If hypothesis 4 fails, the subscription model collapses.** big-ocean becomes a profitable transactional business. Honest outcome.

### Backup Plans

| Scenario | Year 3 Revenue | What It Is |
|----------|---------------|-----------|
| Full vision works | €1-3M | Personality-aware agent platform |
| Subscription partially works | €300K-800K | Niche premium personality product |
| Transactional only | €75-300K | Best personality assessment online. Profitable + sustainable |

None of these are failure.

## Functional Requirements

### Conversation Experience

- **FR1:** Users can have a 15-exchange adaptive conversation with Nerin
- **FR2:** Nerin responds using ocean/marine metaphors and dive master persona
- **FR3:** The Director model steers Nerin's territory focus, observation type, and entry pressure each turn (evidence extraction → coverage analysis → Nerin Director → Nerin Actor)
- **FR4:** Users can see a depth meter reflecting the conversation's progress
- **FR5:** Users receive progress milestone markers at 25%, 50%, and 75% of the conversation
- **FR6:** Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait. *Acceptance: given a 15-exchange conversation, Nerin makes ≥2 specific pattern observations that reference concrete details from the user's prior responses (not generic statements)*
- **FR7:** Nerin frames observations as invitations to explore — acknowledges user pushback, offers an alternative framing, and redirects to a different topic only if the user rejects the observation a second time. *Acceptance: when a test user contradicts Nerin's observation, Nerin (1) acknowledges the disagreement, (2) offers a reframed version or alternative, and (3) only changes topic if the user rejects again*
- **FR8:** Nerin includes a "this is not therapy" framing in the greeting
- **FR9:** Nerin never uses diagnostic language or characterizes third parties the user mentions. *Acceptance: across 10 test conversations, Nerin uses zero DSM terms or clinical labels, and never labels a person the user describes (e.g., never says "your mother sounds controlling" — only observes the user's experience of the relationship)*
- **FR10:** *(Post-MVP — subscription)* Subscribers can extend their conversation (+15 exchanges) to continue with Nerin
- **FR11:** Users can resume an abandoned conversation from where they left off
- **FR12:** The conversation ends with a distinct closing exchange from Nerin before transitioning to results
- **FR13:** Nerin transitions between territories using a connecting observation or question that references the prior topic when the Director model changes territory (distinct from general steering)

### Personality Assessment & Results

- **FR14:** The system extracts facet evidence and energy signals from each user response via the extraction pipeline
- **FR15:** The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
- **FR16:** Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the results page
- **FR17:** The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
- **FR18:** The system presents all archetypes with positive, strength-based framing
- **FR19:** Users can view a dashboard of their results, portrait, relationship analyses, and a link to their public profile

### Portrait

- **FR20:** The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM
- **FR21:** Users are presented with a PWYW modal showing the founder's story and example portrait after completing the assessment
- **FR22:** Users can view their portrait after payment
- **FR22a:** One portrait purchase unlocks one portrait for the user's assessment result
- **FR23:** *(Post-MVP — subscription)* Conversation extension produces a new assessment result. The subscriber can purchase a new portrait for that result — the new portrait incorporates observations derived from extended evidence not present in the original. The prior portrait remains attached to the prior result as "previous version"
- **FR24:** The system tracks behavioral proxies for portrait emotional impact: share rate and return visits within 48 hours
- **FR25:** *(Post-MVP — subscription)* Conversation extension creates a new assessment session. The Director model initializes from the prior session's final state and evidence. On completion, new assessment results are generated. The new result has no portrait until purchased separately (FR22a). The prior portrait and any relationship analyses based on the prior results become "previous version"
- **FR26:** Portrait generation is asynchronous — users are notified when ready
- **FR27:** The system retries portrait generation on failure and informs the user if it ultimately fails

### Relationship Analysis

- **FR28:** Users can initiate a relationship analysis by opening a QR drawer; the other person scans the QR code or opens the contained URL
- **FR29:** The system generates a 2-person relationship analysis when both users have completed their assessments
- **FR30:** The QR accept screen shows the initiator's archetype card, both users' confidence rings, and available credit balance, with Accept and Refuse buttons. The recipient must accept before the analysis proceeds (single consent gate)
- **FR31:** Users see a ritual suggestion screen before accessing the relationship analysis
- **FR32:** The relationship analysis describes relational dynamics without blame language and without exposing individual vulnerability data
- **FR33:** Users receive one free relationship analysis credit upon completing their first portrait purchase (PWYW ≥€1). Additional credits cost €5 each
- **FR34:** If one user deletes their account, the shared relationship analysis is deleted
- **FR35:** Each relationship analysis is linked to both users' assessment results (not to invitations). All analyses are preserved as snapshots — the newest is primary, older ones are classified as "previous version." Version detection is derive-at-read: if newer assessment results exist for either user, the analysis is classified as "previous version." Users can view all their relationship analyses
- **FR36:** Users receive an email notification when a relationship analysis they participated in is ready
- **FR37:** The QR accept screen is only accessible to logged-in users with a completed assessment. There is no pre-account context — User B must sign up, verify their email, and complete their assessment before seeing the accept screen
- **FR38:** The system tracks relationship analysis credits per user (1 free, additional purchased)

### Public Profile & Social Sharing

- **FR39:** Users have a public profile page showing their archetype, OCEAN code, trait/facet scores, and the framing line "[Name] dove deep with Nerin — here's what surfaced"
- **FR40:** Public profiles are default-private; users can explicitly make them public. Binary visibility only — fully public or fully private. No intermediate state (e.g., hiding scores while showing OCEAN code)
- **FR41:** Public profiles generate dynamic OG meta tags and archetype card images for social preview
- **FR42:** Public profiles are accessible without authentication
- **FR43:** Public profiles include a CTA to start the user's own assessment
- **FR44:** Users can copy a shareable link to their public profile
- **FR45:** When a logged-in user with a completed assessment views another user's public profile, a relationship analysis CTA is displayed: "You care about [Name]. Discover your dynamic together." with a brief QR flow explanation
- **FR46:** The system generates archetype card images per archetype (81 cards) — users with the same archetype share the same card visual. Each card contains: archetype name, short description (1-2 sentences), a geometric visual element, and OCEAN code. No individual trait/facet scores. One card per archetype (generic, not personalized)

### Payments & Monetization

- **FR47:** Users can pay for portraits via PWYW with embedded checkout. The payment provider handles all pricing UI. Default €5, minimum €1. No preset amount buttons in the product UI — a single "Unlock your portrait" button opens the checkout modal
- **FR48:** Users can purchase relationship analysis credits via embedded checkout
- **FR49:** *(Post-MVP — subscription)* Subscribers can access conversation extensions as part of their subscription

### User Account & Privacy

- **FR50:** Users can create an account with email and password. Account creation triggers a verification email. Unverified accounts are treated as unauthenticated — no access to dashboard, assessment, results, or any authenticated feature. Public profiles and the home page remain accessible without authentication
- **FR50a:** Verification email contains a unique link that expires after 1 week. Clicking the link activates the account and grants platform access
- **FR50b:** Users can request a new verification email from the verify-email page if the original expired or was not received
- **FR51:** Users can control the visibility of their public profile (binary: fully public or fully private — no intermediate state)
- **FR52:** Users are informed during onboarding that conversation data is stored
- **FR53:** Users can delete their account, which deletes their data and any shared relationship analyses
- **FR54:** Users are introduced to Nerin and the conversation format before the conversation begins (pre-conversation onboarding)

### Homepage & Conversion

- **FR59:** The homepage communicates what Big Ocean is and what the user receives within 3 seconds of landing — without referencing other personality tests or defining by negation
- **FR60:** The homepage leads with a transformation-oriented hook: what the portrait reveals about you, not how the method works. The hook must land for visitors with zero prior context
- **FR61:** The homepage has one primary CTA to start the assessment. No competing secondary CTAs, no "See how it works" alternatives that dilute conversion
- **FR62:** The homepage surfaces a concrete portrait excerpt within the first 40% of scroll depth — a paragraph that reads as a personal letter, demonstrating output specificity and emotional weight
- **FR63:** The homepage includes a Nerin conversation preview showing character depth and perceptiveness — demonstrating what the conversation feels like, not describing it. Nerin is shown being Nerin (observing patterns, making connections), not pitching the product
- **FR64:** The homepage addresses three visitor fears: process anxiety ("Will this be awkward?"), time commitment ("Is 30 minutes worth it?"), and self-exposure ("What if I don't like what it says?") — integrated into the page flow, not as an FAQ section
- **FR65:** The homepage surfaces the PWYW pricing model early as a trust signal — framed as generosity and confidence in the product, not as a footnote. Users should encounter pricing transparency before reaching the CTA, not after committing 30 minutes
- **FR66:** The homepage content works across multiple visitor types (zero-context searcher, social media curious, invited friend awaiting their own assessment, therapy-seeker) without requiring a single narrative arc or assuming a specific entry motivation

### Cost Management

- **FR55:** The system monitors per-session LLM costs against a budget threshold
- **FR56:** The cost guard never blocks a user mid-session; budget protection applies at session boundaries
- **FR57:** When cost guard triggers, users can retry sending their message
- **FR58:** Users are informed when cost guard triggers and told they can retry

## Non-Functional Requirements

### Performance

- **NFR1:** Nerin response time <2s P95 (server-side LLM call + pipeline processing)
- **NFR2:** Public profile page LCP <1s (acquisition landing page — bounce rate sensitive)
- **NFR3:** Results page LCP <1.5s (emotional moment after completing 15 exchanges)
- **NFR4:** Chat page initial load <2s, subsequent interactions <200ms (client-side)
- **NFR5:** Portrait generation completes within 60s (async — user notified, not waiting. Benchmark and adjust)
- **NFR6:** Per-assessment LLM cost stays within ~€0.20 budget (cost-efficient LLM for conversation + extraction)
- **NFR7:** Per-portrait LLM cost stays within ~€0.20 budget (high-capability LLM for generation)

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

- **NFR15:** Assessment completion without errors >99%
- **NFR16:** Portrait generation completes successfully >99%
- **NFR17:** Portrait generation retries automatically on failure
- **NFR18:** Cost guard never terminates an active session — only blocks at session boundaries
- **NFR19:** Conversation sessions are resumable after browser close or connection loss

### Accessibility

- **NFR20:** WCAG 2.1 AA compliance required for: public profile, conversation UI, results page, PWYW modal. Best-effort AA for remaining pages
- **NFR21:** Chat interface keyboard-navigable with proper ARIA labels
- **NFR22:** Score visualizations (facet bars, trait bands) have text alternatives
- **NFR23:** Ocean theme color palette meets AA contrast ratios
- **NFR24:** Proper focus management in modals (PWYW, ritual screen)

### Integration

- **NFR25:** Embedded checkout integration for PWYW and credits (extension purchases added with subscription)
- **NFR26:** The system can switch LLM providers without code changes to the conversation or portrait pipeline
- **NFR27:** Transactional email delivery. Three email types: (1) drop-off re-engagement with last territory, (2) Nerin check-in ~2 weeks post-assessment, (3) deferred portrait recapture. Relationship analysis notifications delivered within 5 minutes of completion, >95% delivery rate

### Observability

- **NFR28:** System logs include per-session cost, completion status, and error events in structured format

### Data Consistency

- **NFR29:** Personality scores displayed to users are never stale — always recomputed from current facet evidence at read time (see FR15 for mechanism)
