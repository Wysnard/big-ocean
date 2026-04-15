---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
assessmentDocuments:
  prd: _bmad-output/planning-artifacts/prd.md
  architecture: _bmad-output/planning-artifacts/architecture.md
  epics: _bmad-output/planning-artifacts/epics.md
  uxSpecification: _bmad-output/planning-artifacts/ux-design-specification.md
supplementaryPlanningArtifacts:
  - epics-conversation-pacing.md, epics-conversation-pipeline.md, epics-director-model.md, epics-innovation-strategy.md, epics-nerin-steering-format.md
  - prd-validation-report*.md (validation outputs, not PRD body)
  - ux-design-specification-archived.md, ux-design-innovation-strategy.md, public-profile-redesign-ux-spec.md, HTML mockups under result-page-ux-design/
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-15
**Project:** big-ocean

## Document Discovery (Step 1)

Canonical sources selected after [C] Continue: **prd.md**, **architecture.md**, **epics.md**, **ux-design-specification.md**. Supplementary epics and UX artifacts remain available for deep dives.

| Type | Primary file |
|------|----------------|
| PRD | prd.md (2026-04-11)
| Architecture | architecture.md (2026-04-12)
| Epics | epics.md (2026-04-12)
| UX | ux-design-specification.md (2026-04-12)

Sharded PRD/Architecture/Epic/UX folders with index.md: none found.

---

## PRD Analysis (Step 2)

**Source:** prd.md (read in full for this workflow).

The following block is a **verbatim extract** from the PRD (Functional Requirements through Non-Functional Requirements).

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
- **FR10:** *(Subscription — MVP)* Subscribers can extend their conversation (+15 exchanges) to continue with Nerin. Extension is the sole paid perk in MVP (alongside bundled first-extension portrait regeneration per FR23). *Acceptance: subscribed user can trigger one conversation extension per assessment result; extension creates a new conversation session initialized with the prior session's final state (FR25)*
- **FR11:** Users can resume an abandoned conversation from where they left off
- **FR12:** The conversation ends with a distinct closing exchange from Nerin before transitioning to results
- **FR13:** Nerin transitions between territories using a connecting observation or question that references the prior topic when the Director model changes territory (distinct from general steering)

### Personality Assessment & Results

- **FR14:** The system extracts facet evidence and energy signals from each user response via the extraction pipeline
- **FR15:** The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
- **FR16:** Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the results page
- **FR17:** The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
- **FR18:** The system presents all archetypes with positive, strength-based framing
- **FR19:** Authenticated users navigate the product through a three-space bottom navigation model — **Today** (ephemeral daily companion), **Me** (persistent identity page with portrait, archetype, scores, public face control, subscription pitch, Circle preview), and **Circle** (people they care about with relationship letters and invite ceremony). There is no `/dashboard` route. A thin `/settings` route contains account admin (email, password, data export, delete) accessed via a gear icon on the Me page

### Portrait

- **FR20:** The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM
- **FR21:** Users receive their portrait (Nerin's letter) for free immediately after completing the assessment. The portrait is the emotional peak — it is not gated by subscription, payment, or account upgrades. Subscription conversion does not happen inside the portrait reveal; it happens downstream in the weekly letter flow (FR91) and on the Me page subscription pitch
- **FR22:** Users can view their portrait immediately after generation (no payment required)
- **FR22a:** One portrait is generated per assessment result — free, no purchase required
- **FR23:** *(Subscription — MVP)* The first conversation extension per subscriber automatically generates a new portrait at no additional cost beyond the €9.99/mo subscription. The new portrait incorporates observations derived from the extended evidence not present in the original. The prior portrait remains attached to the prior assessment result as "previous version" on the Me page. *Acceptance: a subscribed user who completes their first conversation extension sees a new portrait generated automatically without any additional purchase step; the original portrait remains visible as "previous version"*
- **FR23a:** *(Post-MVP — subscription)* Subscribers can regenerate their portrait on conversation extensions beyond the first. Mechanism (bundled, separate purchase, or quota-based) deferred to Phase 2a
- **FR24:** The system records share events (archetype card copy, profile link copy) and return-visit timestamps per portrait. Dashboard displays: share rate (shares / portrait views), 48-hour return rate (users who revisit within 48h / total portrait recipients)
- **FR25:** *(Subscription — MVP)* Conversation extension creates a new assessment session. The Director model initializes from the prior session's final state and evidence. On completion, new assessment results are generated. For the first extension per subscriber, a new portrait is generated automatically per FR23. For subsequent extensions, see FR23a. The prior portrait and any relationship letters based on the prior results become "previous version"
- **FR26:** Portrait generation is asynchronous — users are notified when ready
- **FR27:** The system retries portrait generation up to 3 times with exponential backoff (5s, 15s, 45s). If all retries fail, the user is notified within 5 minutes with an option to retry manually

### Relationship Analysis

**Naming note:** User-facing copy uses "relationship letter" or "letter about your dynamic" instead of "relationship analysis" (continuous with Nerin's portrait, letter-format Nerin output grammar). The internal data model retains `relationship_analysis` naming for code compatibility.

- **FR28:** Users can initiate a relationship letter by opening a QR drawer from the Circle page invite ceremony; the other person scans the QR code or opens the contained URL
- **FR29:** The relationship letter page is a living relational space with the following sections: (1) **This Year's Letter** — warm narrative in letter format describing the relationship dynamic, entered through a "Read Together Again" ritual screen on first read, LLM-generated at letter-creation time, same visual language as the personal portrait, free for both users; (2) **Where You Are Right Now** — real-time data grid with side-by-side traits, facets, and overlap with complementarity framing, updated automatically from conversation data (derive-at-read), free; (3) **Letter History** — vertical timeline of all letters (single letter in MVP, grows with annual regeneration post-MVP), free; (4) **Your Next Letter** — anticipation anchor for the annual ritual ("Nerin is already learning more about both of you"), free; (5) **Things You've Learned About Each Other** — user-owned shared notes, attributed per entry, free. *Post-MVP Section D (D2 relational observations, D3 "take care of" suggestions, D4 alignment patterns) is subscriber-only and not in MVP scope.*
- **FR29a:** The relationship letter is generated once when both users complete their assessments. The LLM call uses both users' facets, traits, archetype, and representative evidence strings to produce the narrative. Cost: ~1 LLM call per relationship (not per view).
- **FR30:** The QR accept screen shows the initiator's name, Accept and Refuse buttons, and a data-sharing disclaimer: accepting means (1) sharing the user's trait and facet scores with the initiator for the purpose of generating the relationship letter, (2) ongoing data sharing — Nerin will use conversation data from both users to keep the relationship letter current and regenerate it on connection anniversary (post-MVP), (3) consent is revocable at any time from settings. Single consent gate — accepting is informed consent to ongoing data sharing, no per-action consent required
- **FR31:** Users see a ritual suggestion screen before accessing the relationship letter for the first time. Subsequent visits bypass the ritual by default; a "Read Together Again" button re-enters the ritual mode
- **FR32:** The relationship letter describes relational dynamics without blame language and without exposing individual vulnerability data. The narrative celebrates the relationship — it names dynamics and tensions as shared patterns, not individual deficits. Harm-reduction framing rule: "dynamics not deficits, no blame, no one is the problem"
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

- **FR47:** Users can subscribe at €9.99/mo via Polar embedded checkout. In MVP, the subscription unlocks exactly two perks: **conversation extension with Nerin** (FR10, FR25 — add +15 exchanges to the assessment with Director model re-initialization from prior session state) and **automatic portrait regeneration on the first extension** (FR23 — new portrait bundled, no additional payment). Post-MVP unlocks are defined in Phase 2a and include daily LLM recognition (FR69), mini-dialogue (FR69a), prescriptive weekly letter layer (FR88), subsequent portrait regenerations (FR23a), portrait gallery (FR74), confidence milestone notifications (FR75), and Section D relational observations (FR32a). *Acceptance: checkout completes in under 90 seconds from tap to confirmed subscription status; cancellation is self-service and effective at end of billing period*
- **FR48:** *(Removed — relationship letter is free, no credit purchase needed)*
- **FR49:** *(Subscription — MVP)* Subscribers have access to conversation extensions (FR10) as part of their subscription. Extension is unlimited for subscribers — they can re-extend on each extended assessment result as long as their subscription is active

### User Account & Privacy

- **FR50:** Users can create an account with email and password. Account creation triggers a verification email. Unverified accounts are treated as unauthenticated — no access to dashboard, assessment, results, or any authenticated feature. Public profiles and the home page remain accessible without authentication
- **FR50a:** Verification email contains a unique link that expires after 1 week. Clicking the link activates the account and grants platform access
- **FR50b:** Users can request a new verification email from the verify-email page if the original expired or was not received
- **FR51:** Users can control the visibility of their public profile (binary: fully public or fully private — no intermediate state)
- **FR52:** Users are informed during onboarding that conversation data is stored
- **FR53:** Users can delete their account, which deletes their data and any shared relationship analyses
- **FR54:** Users are introduced to Nerin and the conversation format before the conversation begins (pre-conversation onboarding)

### Homepage & Conversion

- **FR59:** The homepage above-the-fold content contains: (1) a single-sentence value proposition communicating what the user receives, (2) a visual hint of output quality (archetype card or portrait excerpt), (3) one primary CTA. *Acceptance: first-time visitors in usability testing (n≥5) can describe what the product offers within 10 seconds of landing*
- **FR60:** The homepage headline communicates a transformation promise — not just what you'll discover, but the ongoing value: an AI that understands who you are and helps you navigate life from that understanding. The hook emphasizes the free, zero-commitment entry: a 30-minute conversation that writes you a personal letter, completely free — and the beginning of an ongoing relationship, not a one-time result. *Acceptance: headline does not contain the words "test," "quiz," "assessment," or name any competitor. Headline implies ongoing value, not one-and-done*
- **FR61:** The homepage has one primary CTA to start the assessment. No competing secondary CTAs, no "See how it works" alternatives that dilute conversion
- **FR62:** The homepage surfaces a concrete portrait excerpt within the first 40% of scroll depth — a paragraph that reads as a personal letter, demonstrating output specificity and emotional weight
- **FR63:** The homepage includes a Nerin conversation preview showing character depth and perceptiveness — demonstrating what the conversation feels like, not describing it. Nerin is shown being Nerin (observing patterns, making connections), not pitching the product
- **FR64:** The homepage contains three content blocks addressing visitor concerns, each with a specific reassurance: (1) process anxiety → "It's a conversation, not a quiz" with Nerin preview as proof, (2) time commitment → "30 minutes that surprise you" with user testimonial or engagement stat, (3) self-exposure → "Everything Nerin writes comes from a place of understanding" with portrait tone example. *Acceptance: each block is identifiable as a content section, not buried in prose*
- **FR65:** The homepage surfaces that the assessment and portrait are completely free — framed as confidence in the product, not as a footnote. Users should encounter this transparency before reaching the CTA, removing the last friction point
- **FR66:** The homepage supports four entry motivations without branching: (1) zero-context searcher — value proposition lands without prior knowledge, (2) social media curious — archetype card/OCEAN code visible, (3) invited friend — clear path to start own assessment, (4) self-understanding seeker — depth and scientific credibility communicated. *Acceptance: usability test with 1 user per persona type; each can find the CTA within 60 seconds*
- **FR84:** The homepage includes a founder story block: the founder's own portrait excerpt, why he built this, and what the experience meant to him. Positioned as an authenticity signal — vulnerability that builds trust. *Acceptance: block contains a real portrait excerpt (≥3 sentences) and a first-person statement from the founder*
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

- **FR101:** Authenticated users land on `/today` by default. First visit post-assessment lands on `/me` for portrait reveal (the emotional peak); all subsequent visits land on `/today`
- **FR102:** The three-space bottom navigation (Today / Me / Circle) is the primary navigation model for authenticated users. `/dashboard` is removed. A thin `/settings` route contains account admin (email, password, data export, delete) accessed via a gear icon on the Me page. Assessment (`/chat`) sits outside the three-space world as an onboarding tunnel — users land in `/chat` from the pre-conversation onboarding after signup + verification
- **FR103:** The public profile remains a separate unauthenticated SSR route (`/public-profile/$id`) distinct from the authenticated Me page (`/me`). Me page contains a "Your Public Face" section as the control center for the public profile route

### Circle & Invite Ceremony

- **FR97:** The Circle page displays people the user cares about as full-width cards ordered organically (no sorting, no search, no recommendations, no directory). Each card shows archetype, OCEAN code, duration ("understanding each other since February"), "last shared" recency signal celebrating moments of mutual understanding (relationship letter views, shared moments, portrait sends — not a streak, no shaming), and a "View your dynamic" link to the relationship letter page
- **FR98:** The Circle page enforces the Intimacy Principle: no count metrics (no "X connections"), no follower/fan/network language, no profile view counters, no sign-up attribution shown to the user, no sorting options, no search, no user directory, no hard cap on circle size. Empty state copy teaches the value system: "Big Ocean is made for the few people you care about. This is where they'll live."
- **FR99:** The invite ceremony dialog uses reward-first copy that leads with the letter (the reward) instead of the 30-minute conversation (the cost). Copy structure: (1) "Discover the dynamic between you," (2) concrete promise — "the parts that click, the parts that clash, and the unspoken rhythms you've been navigating," (3) self-reflexive hook — "a side of yourself that only shows up around them," (4) reframe cost as gift to invitee — "Their side: a 30-minute conversation with Nerin. No forms. No quizzes. Just someone curious about them," (5) privacy promise at send moment — "It stays between the two of you," (6) optional name field as intentionality ceremony, (7) QR / copy link / share via options
- **FR100:** Invite placement: (a) Me page "Your Circle" section (static), (b) Circle page bottom of the list (static), (c) another user's public profile (contextual CTA per FR45), and (d) Nerin references the relational dimension inside the weekly summary on Sunday (highest-converting placement because it fires in the emotional state Nerin just created). User-facing copy uses "letter about your dynamic" or "relationship letter" — never "relationship analysis"

### Post-Assessment Transition

- **FR93:** At the end of the 15-exchange assessment, Nerin's distinct closing exchange (FR12) ends and the input field fades. A single button appears beneath the closing message: **"Show me what you found →"** — user-voiced (user speaking to Nerin), warm, keeps the conversation feel alive for one more beat. Tapping the button navigates the user to `/results/$sessionId?view=portrait` directly
- **FR94:** The portrait reading view handles a **generating state**: a centered OceanSpinner with a single Nerin-voiced line ("Nerin is writing your letter...") and no other content visible. When the portrait is ready, the spinner resolves and the letter fades in — full-screen, distraction-free, max-width 720px, warm background, letter format
- **FR95:** At the bottom of the portrait reading view, a warm link ("There's more to see →") navigates the user to `/results/$sessionId` (the full Me page with inline portrait, identity hero, radar, scores, Public Face section, and subscription pitch)
- **FR96:** The first Me page visit displays a return seed at the bottom of the page in Nerin's voice: *"Tomorrow, I'll ask how you're doing. Come check in with me."* Paired with a Nerin-voiced notification permission request: *"I'd like to check in with you tomorrow. Mind if I send a quiet note?"* (NOT a system-voice "Enable notifications" prompt). Permission granted → schedule the first daily prompt for the next day at a profile-appropriate time (high-C morning, high-O afternoon) with one default time the user can customize later. Permission denied → relationship still works, the user opens the app themselves, no lock-in

## Non-Functional Requirements

### Performance

- **NFR1:** Nerin response time <2s P95 (server-side LLM call + pipeline processing)
- **NFR2:** Public profile page LCP <1s (acquisition landing page — bounce rate sensitive)
- **NFR3:** Results page LCP <1.5s (emotional moment after completing 15 exchanges)
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

- **NFR15:** Assessment completion without errors >99%
- **NFR16:** Portrait generation completes successfully >99%
- **NFR17:** Portrait generation retries automatically on failure
- **NFR18:** Cost guard never terminates an active session — only blocks at session boundaries
- **NFR19:** Conversation sessions are resumable after browser close or connection loss

### Accessibility

- **NFR20:** WCAG 2.1 AA compliance required for: public profile, conversation UI, results page, subscription modal. Best-effort AA for remaining pages
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

### Additional Requirements (documented elsewhere in PRD)

- **Domain-specific:** Psychological framing and liability; multi-user data privacy; data retention and transcript security; LLM cost and reliability guardrails; content moderation / crisis protocol called out as MVP out-of-scope with future consideration.
- **Web app:** Browser support (modern evergreen + mobile), responsive design, performance targets (public profile, chat, results, portrait async), homepage performance, SEO and social sharing, accessibility targets (WCAG 2.1 AA), SSR/TanStack Start deployment notes.
- **Product / program:** MVP vs phased roadmap; success criteria and measurable outcomes; decision gates and kill hypotheses; acquisition and B2B wedge; pre-mortem risks.

### PRD Completeness Assessment

The PRD is unusually complete for a brownfield product: numbered FR/NFR through implementation-oriented acceptance clauses, journey-to-FR traceability tables, explicit MVP vs post-MVP labeling (e.g. FR23a, FR32a, FR35a, FR69/FR69a, FR74, FR75, FR88), free-vs-paid tier table, and architecture cross-references in frontmatter. Primary residual risk is **scope surface area** (three-space nav, weekly letter, relationship letter, homepage, subscription) versus solo-founder bandwidth—not missing sections.

---

## Epic Coverage Validation (Step 3)

**Source:** epics.md — Requirements Inventory + FR Coverage Map (read for validation).

### Summary

| Result | Detail |
|--------|--------|
| PRD functional requirement bullets | 100 (includes post-MVP-labeled FRs such as FR23a, FR32a, FR35a, FR69, FR69a, FR74, FR75, FR88) |
| PRD NFR bullets | 33 |
| Epics Requirements Inventory | Aligns 1:1 with PRD MVP FR set (FR38/FR48 absent by design) |
| FR Coverage Map | Every MVP-tracked FR mapped to Epic 1–13 or explicitly marked already implemented |
| Intentionally not in epic backlog | FR23a, FR32a, FR35a, FR69, FR69a, FR74, FR75, FR88 — listed in epics overview as post-MVP |

### Missing FR Coverage (MVP)

_None._ Every MVP functional requirement in prd.md appears either in the epics Requirements Inventory or the FR Coverage Map with an Epic ID or an explicit **already implemented** row for brownfield conversation/auth/core flows.

### Post-MVP FRs (PRD present, epics explicitly deferred)

| FR | PRD label | Epics stance |
|----|-----------|----------------|
| FR23a | Subsequent portrait regens | Documented as post-MVP; not in epic stories |
| FR32a | Section D relational observations | Post-MVP |
| FR35a | Annual relationship letter regeneration | Post-MVP |
| FR69, FR69a | Daily LLM recognition + mini-dialogue | Post-MVP |
| FR74 | Portrait gallery | Post-MVP |
| FR75 | Confidence milestone notifications | Post-MVP |
| FR88 | Prescriptive weekly letter layer | Post-MVP |

These are **scoped deferrals**, not accidental omissions.

### Traceability note

Epics document flags **UX-DR39**: founder story moved from homepage to /about — noted as FR84 deviation requiring PRD amendment. Track as a PRD–UX sync item before sign-off.

### Coverage Statistics

- **PRD FR bullets counted:** 100
- **PRD NFR bullets counted:** 33
- **MVP FRs without epic story:** 0 (all mapped or pre-built)
- **Post-MVP FRs intentionally excluded from epics:** 8 capability groups (see table)
- **Epic coverage map:** see epics.md § FR Coverage Map for full FR→Epic matrix


---

## UX Alignment Assessment (Step 4)

### UX Document Status

**Found.** Primary artifact: `ux-design-specification.md` (large, actively revised; frontmatter `lastEdited: 2026-04-12`). Supplementary: `ux-design-innovation-strategy.md`, `public-profile-redesign-ux-spec.md`, archived spec, HTML mockups.

### Alignment Issues

| Area | PRD / Architecture | UX spec | Assessment |
|------|--------------------|---------|------------|
| Three-space IA (Today / Me / Circle), default routing, `/chat` as tunnel | PRD FR19, FR101–FR103; ADR-43 in architecture | Executive summary + §15 model matches | **Aligned** |
| Silent journal + Sunday weekly letter + conversion in letter | PRD FR67–FR68a, FR86–FR91; ADR-44/45 | Matches silent fork and letter-format grammar | **Aligned** |
| Post-assessment focused reading | PRD FR93–FR96; ADR-46 | Journey + component strategy aligned | **Aligned** |
| **FR84 founder story on homepage** | PRD FR84 still specifies homepage founder block | UX `editHistory` (2026-04-12): founder story **moved to `/about`** — deliberate deviation; epics flag as **UX-DR39** (“FR84 deviation requiring PRD amendment”) | **Misalignment — documentation**, not necessarily wrong product decision |
| Lingering PWYW / credits / dashboard prose | Retired in PRD and architecture | UX spec §8, §9, §12, §13, §14, §17 self-lists “lingering” legacy references | **Cleanup debt** — risk of implementer confusion if those sections are used without cross-check |

### Warnings

1. **PRD–UX–Epics sync:** Resolve FR84 vs `/about` placement so one source of truth drives Epic 9 acceptance tests and marketing copy.
2. **UX spec hygiene:** Schedule a pass to strip obsolete PWYW/credit/dashboard language from non-core sections, or mark them archived at section top.
3. **Spec size:** `ux-design-specification.md` is very large; story authors should anchor on epics + ADR excerpts for day-to-day work to avoid drift.

---

## Epic Quality Review (Step 5)

Validated `epics.md` against user-value epic framing, independence, story structure, and Given/When/Then acceptance criteria.

### Critical violations

**None.** No epic is purely “setup database” or “API milestone” without a user narrative; brownfield context is explicit.

### Major issues

**None** that block execution. Cross-epic sequencing is intentional (Epic 1 placeholders → later epics flesh pages), which is acceptable for a phased cutover.

### Minor concerns

1. **Developer-as-persona stories:** e.g. Story 1.3 and 1.4 (“As a developer”) prioritize codebase hygiene over end-user wording. Appropriate for **Legacy Cleanup** epic; consider grouping under a single “brownfield removal” story in retrospectives.
2. **Operator-facing story:** Story 2.4 (“As a system operator”) for portrait retry — still tied to user-visible reliability; acceptable.
3. **Epic 1 title** mixes user outcome (“three-space navigation”) with implementation (“legacy cleanup”) — clear in body text; optional rename for polish only.
4. **Trace comments:** Some stories reference routes “will become /me in future” — documents ordering; ensure trackers link Epic 2 → Epic 3 to avoid orphaned acceptance text.

### Positive findings

- Stories consistently use **Given / When / Then** with testable **And** clauses (e.g. Story 1.1, 2.1–2.3).
- FR coverage map is explicit; post-MVP FRs are called out in the epic overview.
- Brownfield integration (redirect `/dashboard`, delete components, Polar) matches architecture ADRs.

---

## Summary and Recommendations (Step 6)

### Overall Readiness Status

**READY — with documentation conditions**

Planning artifacts are sufficient to start **Phase 4 implementation** for the MVP slice described in `prd.md` and `epics.md`, provided the small PRD/UX contract conflicts are owned explicitly (below).

### Critical issues requiring immediate action

1. **FR84 / founder story placement:** PRD says homepage; UX and epics moved founder content to **`/about`**. Amend the PRD **or** revert UX/epics so contract tests and copy reviews have a single authority.

### Recommended next steps

1. Log a short **PRD amendment** (or UX spec rollback) for FR84 and remove the “deviation” exception from epics once resolved.
2. Run the **UX spec cleanup** pass on legacy PWYW/credit/dashboard sections, or prepend “ARCHIVED — do not implement” banners.
3. Keep **implementation** anchored on `epics.md` FR Coverage Map + `architecture.md` ADR-43–50 for three-space, weekly letter, and post-assessment flows.

### Final note

This assessment recorded **2 documentation-alignment items** (FR84 founder placement; UX legacy section hygiene) and **minor epic-structure notes** (developer-persona stories in cleanup epic). **No missing MVP FR coverage** was found relative to `epics.md`. Address the FR84 conflict before treating homepage acceptance criteria as signed-off.

**Report path:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-15.md`  
**Assessor:** Implementation readiness workflow (automated step chain)  
**Date:** 2026-04-15

