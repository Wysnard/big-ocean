# Design Thinking Session: big-ocean Platform UX Redesign

**Date:** 2026-04-09
**Facilitator:** Vincentlay
**Design Challenge:** Redesign platform navigation and page architecture to align with the "assessment = onboarding, companion = product" strategic direction

---

## Design Challenge

### Challenge Statement

How might we redesign the big-ocean platform navigation and page architecture so that the assessment feels like the *beginning* of an ongoing relationship with Nerin — not the end — and every page serves the three-layer flywheel: Discovery (free) → Relationship (free, growth engine) → Daily practice (subscription)?

### Context

The PRD was updated with a major strategic repositioning: big-ocean is no longer a personality test with optional extras — it's a personality-aware life companion where the assessment is onboarding. However, the current UX was designed for the old model (PWYW portrait, credits for relationship analysis, linear test→result flow). The gap between strategy and experience is fundamental.

### Key Misalignments Identified

| Area | Current UX | PRD Direction | Gap |
|------|-----------|--------------|-----|
| Revenue model | PWYW + credits for portrait | Portrait is free. Revenue = €9.99/mo subscription only | Entire monetization flow is wrong |
| Conversation length | 25 messages | 15 exchanges | Mismatch |
| Post-assessment experience | Results page is the "end" | Assessment is onboarding. Product is what comes after | No "after" exists |
| Dashboard | Thin: identity card + in-progress + credits | Companion hub: mood calendar, coach, portrait gallery, growth | Dead end |
| Mood diary | Doesn't exist | Core Phase 1b feature — daily touchpoint | Missing |
| Subscription | No subscription flow | €9.99/mo unlocking coach, extensions, regeneration, coaching | Not designed |
| Portrait reveal | Behind PWYW paywall | Free — "feel seen" moment IS the conversion | Wrong gate |
| Navigation model | Linear: home → chat → results → done | Hub-and-spoke: dashboard as home base, multiple return reasons | Linear dead-end |
| Returning user | No return path | Coach, mood diary, portrait evolution, growth | No return UX |
| Relationship analysis | Credit-gated | Free and unlimited — growth engine | Wrong gate |

### Sub-Challenges

1. What does every page do and what should it do?
2. How does navigation change from linear to hub-and-spoke?
3. Where does the subscription conversion moment live if the portrait is free?
4. What does the mood diary daily loop look like?
5. What unlocks when you subscribe and how is that surfaced?

---

## EMPATHIZE: Understanding Users

### Reference Product Patterns

| Reference | Borrow | Don't Copy |
|-----------|--------|------------|
| **BeReal** | One daily prompt, low friction (~10 sec), content gated behind own post, ritual not chore | Random timing, no depth |
| **Headspace** | Single daily recommendation, streak without punishment, mood check-in as reflection, free builds habit → paid unlocks depth | Generic content — big-ocean's is personality-informed |
| **BetterUp** | Daily pulse as habit (not coaching session), between-session micro-engagement, growth radar with before/after, coach-assigned actions | Enterprise complexity, human coach dependency |

**Synthesis:** Daily habit = mood check-in (BeReal simplicity + BetterUp pulse). Personality-informed recognition (free) = daily value. Subscription unlocks intelligence layer (coaching, weekly focus, portrait regeneration).

### User Phase Map — Emotional Journey

**Phase 1: Curious Newcomer (Day 0)** — Arrives via social/invite/search. Skeptical but curious. Needs proof of depth + low commitment. Current UX: partial (homepage misaligned with new direction).

**Phase 2: Assessment Experience (Day 0, ~30 min)** — Engaged → surprised → seen. Nerin's "feel seen" moments build trust. Current UX: solid (chat page works).

**Phase 3: Revelation (Day 0, post-assessment)** — Anticipation → revelation → "I need to tell someone." Portrait must land free, not behind paywall. Current UX: broken (PWYW gate on portrait).

**Phase 4: Sharer (Day 0-3)** — Excited, identity-affirming. Easy sharing + free relationship invite. Current UX: partially works but relationship is credit-gated.

**Phase 5: Returner (Day 2-14) — CRITICAL GAP** — Afterglow fading. "Now what?" No reason to come back. Current UX: nothing exists for this user. Dashboard is dead end.

**Phase 6: Daily User (Day 14+) — DOESN'T EXIST** — Companion, not test. Mood check-in, patterns, weekly focus. Current UX: not at all.

**Phase 7: Subscriber (Day 30+)** — "I want more depth." Coach that already knows them. Portrait evolution. Current UX: no subscription flow.

### Key Observations

1. **Critical gap is Phase 5 → Phase 6.** No bridge between "I did the assessment" and "I use this daily." Mood diary IS the bridge. 90% churn risk here.

2. **Subscription conversion should happen inside the daily loop** (after 2-3 weeks of free recognition), not at the end of assessment.

3. **"Home page" for returning user ≠ results page.** Results = one-time reveal. Daily home = today's check-in + mood calendar + personality insight + quick actions.

4. **Viral flywheel and retention flywheel are different pages.** Sharing/inviting = results/profile. Daily return = companion home. Not the same screen.

5. **Library serves a third audience** — SEO visitors. Acquisition funnel, not daily-use. But contextual surfacing for invested users is valuable.

### Empathy Map — The Daily Returner (Phase 5-6)

| Quadrant | Experience |
|----------|-----------|
| **Says** | "That assessment was surprisingly good." "I wish there was more." |
| **Thinks** | "Is this just a one-time thing?" "Does my mood today connect to what Nerin saw?" |
| **Does** | Re-reads portrait. Checks friend's progress. Opens app, sees nothing new, closes it |
| **Feels** | Lingering curiosity. Slight disappointment depth stops. Wants more but not ready to pay |

### Advanced Elicitation — Design Decisions

**Decision 1: Personality-typed daily triggers.** The daily notification/prompt is NOT generic "How are you feeling?" — it uses conversation data to deliver personality-informed prompts per user. High-Neuroticism: "Let's check the weather inside." High-Openness: "What surprised you today?" High-Conscientiousness: "How's the list looking?" No other app can do this — the assessment data makes the daily loop unique.

**Decision 2: Social mood with "take care of" framing.** Opt-in per relationship. Never surfaces raw mood text. Pattern-level signals only. The agent gives the OTHER person a personality-informed suggestion for how to show up. Frame: "Léa has been tense for 3 days — here's what might help." Privacy: explicit consent, revocable, no private data exposed.

**Decision 3: Today's page, not dashboard.** The return screen is ephemeral. Today. This week. Not a results museum. Like BeReal — yesterday's page is gone. Calendar is a separate view for looking back.

**Decision 4: Weekly coaching statement.** End-of-week synthesis from Nerin. Free tier: personality-informed summary ("here's your week's pattern"). Subscribers: actionable coaching + next week's focus. The free weekly recap shows the pattern — paid shows what to do about it. Natural subscription tease.

**Pre-mortem mitigation:** Template recognition must have combinatorial depth (mood × facet × time-of-week × pattern). Weekly micro-insight bridges free → paid. Social layer prevents "private utility" isolation that kills retention.

---

## DEFINE: Frame the Problem

### Point of View Statements

**POV 1 — The Returner:** A user who just completed their assessment and loved their portrait needs a daily reason to open big-ocean that feels as personal as the assessment itself, because without a bridge between "revelation day" and "daily companion," they churn within a week and the subscription never gets a chance.

**POV 2 — The Daily User:** A user who checks in daily needs to feel that each check-in makes the next one more valuable, because a mood tracker without compounding insight is just another wellness app abandoned in 2 weeks.

**POV 3 — The Social User:** A user who completed their assessment needs sharing and inviting to feel like self-expression and care — not marketing — because the viral flywheel only works if sharing feels like "look what I discovered" and inviting feels like "I want to understand us."

**POV 4 — The Subscriber:** A free user checking in for 2-3 weeks needs to encounter the subscription at the exact moment they want more from a weekly insight, because if the paywall appears before enough free value, it's a toll — if it appears when they crave depth, it's a natural next step.

### How Might We Questions

**Retention flywheel:**
1. HMW use personality data to make each daily prompt feel written for THIS person?
2. HMW make the mood calendar a discovery tool (seeing patterns) not a tracking chore?
3. HMW design "today's page" for 10 seconds on quiet days and 5 minutes on deep days?
4. HMW make the weekly coaching statement feel like a letter from someone who knows you?

**Viral flywheel:**
5. HMW make post-assessment naturally flow into sharing AND relationship inviting?
6. HMW design "take care of" social mood so it feels like a gift, not surveillance?
7. HMW make relationship invite feel like "understand us" not "sign up for this app"?

**Subscription conversion:**
8. HMW let free weekly summary build the habit but leave a felt gap?
9. HMW place subscription offer inside the daily loop at the moment of desire?
10. HMW make subscription feel like "unlocking Nerin's full attention"?

**Navigation architecture:**
11. HMW make "today's page" the center of gravity instead of results page?
12. HMW separate daily companion / personality identity / social without complexity?
13. HMW make library discoverable to daily users via contextual surfacing?

### Problem Insights

**Insight 1: Two "main pages" for two moments.** Identity page (archetype, portrait, scores, sharing) — visited Day 0 + occasionally. Today's page (check-in, recognition, mood calendar) — visited daily. Different emotional registers. Can't be the same screen.

**Insight 2: Subscription conversion is a three-act story.** Act 1 (Day 0-7): free daily recognition, no subscription mention. Act 2 (Day 7-21): weekly summary with "Nerin has more..." tease. Act 3 (Day 21+): subscription as depth unlock inside existing flow.

**Insight 3: Viral and retention flywheels share one moment then diverge.** Post-assessment emotional peak → Path A (share + invite = viral) and Path B ("come back tomorrow" = retention). Both offered, neither blocks the other.

**Insight 4: Library is a "third door."** Acquisition via SEO. Engagement via contextual surfacing in weekly coaching. Not browsed by daily users — content comes to them.

---

## IDEATE: Generate Solutions

### Selected Method — Party Mode Multi-Agent Ideation

Used BMAD party mode with Sally (UX), John (PM), Victor (Innovation Strategy), and Winston (Architect) as collaborating agents. Method chosen because the challenge spans UX, product, strategy, and technical feasibility simultaneously — single-lens ideation would have missed trade-offs.

### Reference Products Studied

- **BeReal:** Daily prompt, low friction, content gated behind own post, ephemeral feel
- **Headspace:** Single daily recommendation, streak without punishment, mood check-in as reflection
- **BetterUp:** Daily pulse as habit (not coaching session), between-session engagement, growth radar

### Generated Ideas — Locked Design Decisions

#### Architectural Decisions

**Three-Space Navigation Model**
Bottom nav with three tabs: **Today | Me | Circle** (renamed from "Connections" per intimacy principle)
- **Today:** Daily ephemeral companion page (mood check-in, Nerin recognition, weekly focus, pattern detection). Default landing for returning users.
- **Me:** Persistent identity page (archetype, portrait, growth archive, public face, subscription). Low-frequency but high-emotion visits.
- **Circle:** Relationships with people the user cares about. Social intimacy, not network scale.
- No `/dashboard` — replaced by three-space model
- Thin `/settings` route for pure admin (email, password, delete) accessed via gear icon on Me
- Assessment (`/chat`) sits outside the three-space world as an onboarding tunnel

**Routing:**
- First visit post-assessment: → `/me` (portrait reveal, identity celebration)
- All subsequent visits: → `/today` (daily return default)
- Public profile stays separate at `/public-profile/$id` (SEO, SSR, no auth)

#### The Intimacy Principle (Brand DNA)

**"Big Ocean is built for a few people, not a crowd."**

Every feature must pass this audit:
1. Does it show "how many"? → probably wrong
2. Does it reward broad visibility over focused connection? → wrong
3. Does it use follower/fan/network language? → wrong
4. Does it celebrate depth and duration of fewer relationships? → right
5. Does it treat user as sovereign member of small circle, not node in growth graph? → right

**Implementation:**
- No hard cap on circle size (rules create resentment; culture through design instead)
- No count metrics anywhere user-facing (no "X connections", no profile view counters, no sign-up attribution shown to user)
- No follower/friend language — use "people you care about"
- No search, no recommendations, no directory of users
- No sorting options on Circle — organic order only
- Each person rendered as full-width card with individual weight, not grid of avatars
- Empty state teaches the value system: "Big Ocean is made for the few people you care about"
- Scroll length itself is honest feedback about circle size

#### Today Page — Daily Companion

**Pre-check-in state:** Personality-typed prompt from Nerin + 5 mood options + optional text + week dots (7 days, today empty)

**Post-check-in state — Journal format (not chat bubbles):**
- Your entry (mood + note) anchored at top
- Nerin's recognition as a margin note on the same page — warm body font, shared-page feel
- Week-so-far as 7 dots, today filled
- Contextually-surfaced library article (2-3/week, not daily)
- For subscribers: Today's focus + micro-action (ghost-visible for free users)
- Social pulse (inner circle): "Léa checked in today" — presence only, no mood/text exposed

**Note visibility (three levels, user chooses per check-in):**
- 🔒 Private (default) — only you and Nerin
- 💙 Inner circle — visible to consented people in circle (like Close Friends story)
- 🌊 Public pulse (post-MVP) — mood emoji only on public profile

**Static after check-in, not a feed.** One daily action. Come back tomorrow. BeReal philosophy — consistency over days, not engagement within a day.

#### Daily Check-in Architecture — FINAL (free-silent / paid-dialogue)

**Two prior designs were rejected:**
1. Template engine with slot-filling → over-engineering, "sophisticated Mad Libs" ceiling
2. LLM recognition for all users (free + paid) → blurred the free/paid line, expensive relative to free-tier value

**Final design: fork the product at the daily check-in.** Free users deposit silently into a journal. Paid users have a daily dialogue with Nerin.

**Free tier daily check-in:**
- Mood selection + optional note — user writes and saves
- NO Nerin response at all (no LLM call)
- Note saved to mood calendar
- Week-so-far dots visible
- Quiet anticipation line: *"Nerin will write you a letter about your week on Sunday."*
- Contextually-surfaced library article (static, cheap)
- **LLM cost: $0**
- **UX: a respectful silent journal with weekly reflection from Nerin**

**Paid tier daily check-in:**
- Same check-in form
- Nerin's personalized recognition appears in journal format (LLM-generated)
- "Tell me more →" button opens 3-5 exchange mini-dialogue with Nerin who reads the actual note
- "Today's focus" / micro-action section
- **UX: a daily dialogue with a companion who knows you**

**Why this split is stronger than all prior versions:**

1. **Qualitative difference, not quantitative.** Free = journal. Paid = dialogue. These are fundamentally different product experiences, not two versions of the same product. Users understand forks better than gradients.

2. **Silence is a feature.** Nerin's voice is rare and precious in the free tier. When the weekly letter arrives, it carries more weight because the user hasn't heard from Nerin since their portrait. The weekly cadence creates longing, which is more engaging than daily chatter.

3. **BeReal principle applies to free users.** The act of depositing is itself valuable. Free users get the journaling benefit without Nerin hovering. Cleanest possible "contribution = value" loop.

4. **Free tier cost drops to near-zero.** The original NFR7a constraint is naturally satisfied without damaging the product — because removing Nerin's daily voice from free is a *feature*, not a cost optimization.

5. **Free/paid distinction is crystal clear.** One sentence explains it: "Free lets you write your day down. Paid lets Nerin write back."

#### LLM architecture for paid daily check-in

When a subscriber checks in, the system sends a tight LLM call with rich user context:

```
System: You are Nerin, a warm, perceptive observer who knows this
specific person. Respond to their daily check-in with 2-3 sentences
that connect their mood to their personality. No generic wellness
language. No suggestions or advice — just observation. End with one
open question if natural.

User context (from assessment):
- Top 3 facets with scores
- Dominant traits and archetype
- Key evidence strings extracted during assessment
- Personality signature framing

Today's check-in:
- Mood selection (emoji)
- Optional note text
- Pattern signals (if any): streak, silence break, mood/note divergence

Write Nerin's response.
```

Every daily check-in triggers a tight LLM call with rich user context:

```
System: You are Nerin, a warm, perceptive observer who knows this
specific person. Respond to their daily check-in with 2-3 sentences
that connect their mood to their personality. No generic wellness
language. No suggestions or advice — just observation. End with one
open question if natural.

User context (from assessment):
- Top 3 facets with scores
- Dominant traits and archetype
- Key evidence strings extracted during assessment
- Personality signature framing

Today's check-in:
- Mood selection (emoji)
- Optional note text
- Pattern signals (if any): streak, silence break, mood/note divergence

Write Nerin's response.
```

**Why LLM over templates:**

1. **Template engine ceiling is "sophisticated Mad Libs."** Users sense the pattern within weeks. The illusion of personalization erodes.
2. **Every place Nerin speaks must feel like Nerin.** The daily check-in is a retention engine. Mediocre retention content doesn't retain.
3. **Cost of template engineering was enormous** (~1000 phrases to author + slot-filling system + pattern rule engine + versioned template files + authoring pipeline).
4. **LLM cost is genuinely affordable.** Haiku at ~$0.002-0.005 per call × 20-25 check-ins/month = $0.04-0.12 per active free user per month.
5. **Prompt-based differentiation is generative, not combinatorial.** Same prompt produces dramatically different responses for different users because the user context dominates the output.

**Updated cost model — free silent daily / LLM weekly:**

The PRD's NFR7a ("free-tier ongoing cost per user must approach $0/month") is actually satisfied under this design because free users get NO LLM calls on daily check-ins.

Unit economics per active free user:
- Daily check-ins: **$0** (no LLM, user deposits into silent journal)
- Weekly summary: **~$0.02-0.08/month** (one LLM call per week)
- **Total free-tier cost: ~$0.02-0.08/month per active user**

Unit economics per active subscriber:
- Daily recognition: ~$0.04-0.12/month (one call per check-in × 20-25 days)
- Mini-dialogue engagement: ~$0.20-0.40/month (assuming 30% engagement rate)
- Weekly summary: ~$0.08-0.20/month (same LLM architecture as free, slightly richer prompt)
- **Total subscriber cost: ~$0.32-0.72/month**

Against €9.99/mo subscription:
- Subscriber gross margin: ~93-97% (slightly below original 96-98% target but healthy)
- Free user LTV: €0.30/month expected at 3% conversion × €9.99 × typical retention
- Free user cost: $0.02-0.08/month
- Net positive unit economics across both tiers with ample margin for LLM cost increases

NFR7a is satisfied without damaging product quality because the cost optimization comes from *product design* (silent free daily check-ins), not from cheaper generation (templates).

**Remove from implementation plan:**
- Template library (~1000 phrases)
- Slot-filling engine
- Pattern-aware recognition JSON files
- Versioned template system
- Authoring pipeline (seed → LLM generate → review → freeze)

**Keep in implementation plan:**
- User context builder (pulls facets + evidence + archetype — needed for multiple features anyway)
- Lightweight pattern signals as LLM prompt context (streak, silence break) — NOT a separate rule engine, just fields in the prompt
- Good prompt engineering for Nerin's voice (3-5 seed prompts, iterate with real user data)

**Subscription value gap in one line (unchanged):** Free = Nerin recognizes your pattern. Paid = Nerin reads your words and writes you a fuller weekly letter.

**Paid tier still includes mini-dialogue** (3-5 exchange conversation when user taps "Tell me more" on a check-in), but this is deferred to post-MVP — not in first ship. First ship has daily recognition (LLM) for everyone and weekly summary (LLM) with free and paid depth differentiation.

#### Principle established: Use LLM for everything Nerin says

Three places Nerin speaks → all use LLM:
1. Daily check-in recognition → Haiku
2. Weekly summary → Sonnet or Haiku
3. Portrait → Sonnet (already is)

Three places where templates ARE appropriate:
1. Notification copy ("Your week with Nerin is ready")
2. UI labels and buttons
3. Error states and system messages

**Clean split.** No template engine to build. No authoring pipeline. Just good prompts and rich user context.

#### Over-engineering risks caught during review

The template engine wasn't the only over-engineered piece. During the review, several other features were deferred to post-MVP:

**Defer to post-MVP (not in first ship):**
- Personality-typed notification scheduling → ship with one default time, users can customize in settings
- Complex pattern detection rule engine → ship with 2 patterns (streak, silence break) passed as prompt context
- "Take care of" suggestions (Section D D3) → post-MVP subscriber feature
- Section D mood trend sharing (D1) → post-MVP
- Section D relational observations (D2, D4) → post-MVP
- Annual letter regeneration → Year 1 Q4 when first cohort approaches anniversary
- Portrait gallery and regeneration → post-MVP subscriber feature
- Subscriber mini-dialogue for daily check-ins → post-MVP

**Ship in first version (lean MVP):**
- Three-space navigation (Today / Me / Circle)
- Today page with LLM-based daily check-in recognition
- Me page with portrait, identity hero, public face, subscription pitch
- Circle page with list of people + invite ceremony
- Relationship letter page with real-time data grid + static letter only (no Section D, no annual regen)
- Weekly summary with LLM generation (free + paid versions)
- Subscription flow (€9.99/mo)
- Post-assessment transition

This lean version preserves the architectural bet (three-space, daily return, subscription conversion) while cutting features that can be added once the core is validated with real users.

#### Me Page — Identity & Growth Archive

**Architecture (top to bottom):**

1. **Identity Hero** — archetype, OCEAN code, radar, confidence (always visible)
2. **Your Portrait** — re-read Nerin's letter (free: one portrait forever; paid: gallery + regeneration + side-by-side comparison + regeneration ceremony with wait screen)
3. **Your Growth** — mood calendar + pattern observations (conditional on mood history existing; subscribers get "Who you're becoming" + delta annotations on radar + growth arc narrative)
4. **Your Public Face** — preview of what strangers see + public/private toggle + shareable link + card image. **NO view counts, no sign-up attribution metrics** (intimacy principle)
5. **Your Circle** (summary) — small preview of Circle page contents with "View all →"
6. **Subscription** — pitch for free users ("Unlock Nerin's full attention"); value summary for subscribers ("47 mini-dialogues, 2 portrait evolutions, 12 relational insights")
7. **Account** (gear icon → `/settings`) — email, password, data export, delete

**Public profile separation:**
- Public profile = what others see (SEO, SSR, no auth, `/public-profile/$id`)
- Me page = what owner sees (auth, private, `/me`)
- Different audiences, different JTBD, don't merge
- Me contains "Your Public Face" section as control center for the separate public route

#### Circle Page — People You Care About

**Layout:**
- Header framing: "The few people you care about"
- Each person rendered as full-width card with archetype, OCEAN code, duration ("understanding each other since February"), "last shared" recency signal, and "View your dynamic" link to relationship letter
- Invite card always appended at the bottom
- No counts, no sorting, no search, no recommendations
- Empty state: "Big Ocean is made for the few people you care about. This is where they'll live."

**"Last shared" signal:** tracks moments of mutual understanding (relationship analysis views, shared moments, portrait sends) — celebrates presence, not activity. NOT a streak. No penalty, no shaming.

**Invite ceremony (locked copy):**
```
INVITE SOMEONE YOU CARE ABOUT

Discover the dynamic between you.

When they finish their conversation with Nerin, the two of you get a letter
about your relationship — the parts that click, the parts that clash, and
the unspoken rhythms you've been navigating for years.

You'll also see a side of yourself that only shows up around them.

Most people say it names something they've felt but never put into words.

─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Their side: a 30-minute conversation with Nerin. No forms. No quizzes.
Just someone curious about them.

It stays between the two of you.

Who are you inviting?
[Their name (optional)]

[Share a QR to scan] [Copy a link to send] [Share via...]
```

**Key framing moves:**
1. Lead with the reward (letter), not the cost (30-min conversation)
2. "A letter about your relationship" — continuous with portrait, not "relationship analysis"
3. Concrete promise: "click / clash / unspoken rhythms"
4. Self-reflexive hook: "a side of yourself that only shows up around them"
5. Social proof without testimonials
6. Reframe cost as gift to invitee ("Their side" / "just someone curious about them")
7. Privacy promise at send moment
8. Name field as intentionality ceremony

**Invite placement:**
- Me → Your Circle section (static)
- Circle → bottom of list (static)
- Public profile of another user → contextual CTA
- **Weekly summary on Today → Nerin references the relational dimension at week close** (highest-converting because it fires in an emotional state Nerin just created)

**Copy audit rule:** Replace "relationship analysis" with "relationship letter" / "letter about your dynamic" in all user-facing copy. Internal data model stays as `relationship_analysis`.

#### Subscription Conversion — Three-Act Story

**Act 1 (Day 0-7): Build the habit.** Free daily recognition, zero subscription mention.

**Act 2 (Day 7-21): Show the gap.** Weekly summary includes soft-locked depth teaser. Ghost subscriber section visible on Today.

**Act 3 (Day 21+): The natural moment.** Subscription inside the flow they already use — "Unlock Nerin's full coaching" at weekly summary, not a pricing page.

**Distributed across three spaces (six touchpoints):**

| Space | Free value | Paid unlock |
|-------|-----------|------------|
| Today | Template recognition + mood calendar + weekly summary | LLM mini-dialogue + daily focus + micro-actions |
| Me | Original portrait + scores + sharing | Portrait gallery + evolution + "Who you're becoming" + growth arc |
| Circle | Relationships + pulse (view only) | Relational recognition + "take care of" suggestions + relational coaching |

**Subscription pitch:** "Unlock Nerin's full attention" — depth of relationship with Nerin, not feature list.

### Top Concepts (Priority)

1. **Three-space navigation (Today / Me / Circle)** — Foundational. Unlocks everything else.
2. **Nerin Recognition Engine** — The technical core of the retention flywheel. Ships with Today.
3. **Journal format for check-ins** — Visual metaphor that defines the daily ritual feel.
4. **Intimacy Principle** — Brand DNA that shapes every design decision.
5. **Invite ceremony copy** — The motivational unlock for the viral flywheel.
6. **Weekly summary as subscription conversion moment** — The three-act story's Act 2/3 bridge.
7. **Portrait gallery + regeneration** — Subscription retention moat (longitudinal self-portrait).
8. **Library article contextual surfacing** — Turns SEO infrastructure into retention content without cluttering daily loop.

### Relationship Letter Page — Living Relational Space

Separate from the Circle tab (which lists people). This is the page for *one specific relationship* — where Léa and Marc (or any pair) go to experience their dynamic together over time.

**Core reframe:** Not a one-time generated artifact. A living relational space with an annual ritual at its center (Spotify Wrapped model).

#### Page architecture

**Section A — This Year's Letter** (emotional center, top of page)
- Warm, narrative, same visual language as personal portrait
- Enters through ritual screen on first read ("Read this together when you can sit with it")
- Subsequent visits bypass ritual by default; "Read Together Again" re-enters ritual mode
- Free for everyone

**Section B — Where You Are Right Now** (real-time data grid)
- Side-by-side traits, facets, overlap with complementarity framing (not comparison)
- Updates automatically as either user has new Nerin conversations (derive-at-read)
- Shared OCEAN letters highlighted; differences framed as rhythm, not deficit
- Each row gets short interpretive framing generated at letter-generation time
- Free for everyone

**Section C — Letter History**
- Small vertical timeline of all past annual letters
- "Your 2026 letter" · "Your 2027 letter (coming this February)"
- Creates anticipation; future letters visible as queued
- Letter gallery becomes a multi-year relationship biography
- Free for everyone

**Section D — How You're Both Doing** (detailed below)

**Section E — Things You've Learned About Each Other** (shared notes)
- User-owned shared journal attributed per entry
- Short curated observations, no likes, no reactions
- Free for everyone — user-generated content, zero cost

**Section F — Your Next Letter** (anticipation anchor)
- Shows upcoming annual regeneration date
- "Nerin is already learning more about both of you"
- Soft countdown creating perpetual return reason

**Section [deferred] — Moments** (relationship scrapbook)
- Timeline of meaningful shared moments (reads, take-care suggestions, regenerations)
- Parked for later discussion
- Would power the "last shared" signal on Circle cards

#### Annual regeneration model (Spotify Wrapped)

**Letter regeneration is annual only, not on-demand.**
- Automatic trigger on connection anniversary (one year after QR accept)
- Both users notified: "Your [Year] letter from Nerin is ready"
- Old letters preserved in version history forever
- Creates a predictable, meaningful annual ceremony like Spotify Wrapped
- Letter becomes a sacred artifact, not refreshable content
- Year 1 + Year 2 + Year 3 + ... = irreplaceable multi-year relationship record (Year 3+ moat)

**Annual letter is FREE for everyone.**
- Highest-emotion moment must not be gated
- Spotify Wrapped precedent: free to all, drives retention and virality
- Free users experiencing the annual letter with a subscribed partner creates natural subscription pull
- Cost is negligible: 1 LLM call per relationship per year

#### QR consent clarification

Current QR accept screen must clearly state:
- Accepting = sharing personality scores forever (until revoked)
- Nerin uses ongoing conversation data to keep relationship letter current
- Users receive annual updated letter on anniversary
- One-time ongoing consent, not per-action opt-in
- Data-sharing is revocable at any time

**No per-regeneration consent required.** Original QR consent covers all future letter regenerations. Notification (not approval) is the mechanism for keeping users informed.

#### Section D — How You're Both Doing (detailed)

**D1 — Mood trends side by side**
- 14-day emoji grid for both users
- Only mood emoji shown, never note text
- Days without check-ins are empty dots (no shaming)
- Requires mutual opt-in per relationship
- **FREE for both** (shared space foundation — gating damages sense of shared space)

**D2 — Nerin's relational observations**
- Pattern-level framings about the shared dynamic
- Always about "you two" or "your rhythm," never about one person as problem
- Appears as single current card; previous observations archived in "Previous" link
- Example: "You've both been tense on Mondays for three weeks. For Marc's high-C profile, Monday means running the week in his head. For you, it's sympathetic stress. Worth naming together."
- **Subscriber-only, per user** (each paying user gets their own intelligence layer)

**D3 — "Take care of" suggestions**
- Directional, personality-informed coaching for how to show up for partner
- Each user sees their own "For [name]" suggestion only
- Never see the suggestion written about you for your partner
- Reciprocal and simultaneous — when Nerin generates one, generates both
- Specific and actionable ("go for a walk after dinner"), not abstract
- Explicit reference to partner's profile teaches the user about their partner
- "Noted" / "This doesn't fit" feedback for calibration
- **Subscriber-only, per user** — if only Léa subscribes, only Léa gets "For Léa" suggestions

**D4 — Alignment patterns**
- Gentle noticing cards, not actionable ("You've shared 4 weeks in rhythm")
- Pattern-level observations generated by template engine
- Appear occasionally, fade out — never demand attention
- Same purpose as personal Today recognition but for the relational dimension
- **Subscriber-only, per user**

**D5 — Gentle check-ins and prompts**
- **DEFERRED** — requires careful user testing
- Risk of feeling prescriptive/invasive
- Ship D1-D4 first, validate, then revisit

#### Privacy contract for Section D

**What crosses users:**
- Mood emoji selections (5 options only)
- Daily presence (did they check in today?)
- Nerin's interpretive framings about the shared dynamic
- "Take care of" suggestions directed at self (informed by partner's profile)
- Pattern observations about the relationship

**What NEVER crosses users:**
- Note text from daily check-ins
- Pattern details about the individual
- Mini-dialogue content from Today
- Private portrait regeneration insights
- Any raw evidence strings

**The principle:** Nerin observes both users' data. Nerin's output is *interpretive framings*, not raw data. Nerin is the abstraction layer — everything flows through Nerin's voice, nothing flows raw between users.

#### Harm reduction design (Section D)

- Observations are ALWAYS about the dynamic, NEVER about the individual
- No observation characterizes the partner negatively
- Suggestions are always collaborative framings ("you two"), never diagnostic
- Directional suggestions are specific and actionable, never generic empathy advice
- Users can flag "this doesn't fit" to improve calibration
- Nerin never single out one person as the problem
- Framing rule: "dynamics not deficits, no blame, no one is the problem"

#### Section D subscription conversion mechanic

**Asymmetric visibility creates natural pull.** When Léa (subscribed) sees a "For Léa" suggestion and tells Marc "Nerin said I should try something tonight," Marc experiences socially-observable asymmetry — she's getting intelligence he's not. Over time, this drives organic subscription conversion for Marc without any push, feature comparison page, or upsell banner.

**This is the highest-LTV feature on the platform** because subscription value is about *someone you love*, not just about yourself. Relationship-benefit subscriptions have dramatically higher retention than self-only subscriptions.

#### Subscription value map — Relationship page

| What | Free | Subscriber |
|------|------|-----------|
| Annual letter | ✅ | ✅ |
| Letter history / version gallery | ✅ | ✅ |
| "Read Together Again" ritual | ✅ | ✅ |
| Data grid (real-time) | ✅ | ✅ |
| Shared notes | ✅ | ✅ |
| "Your Next Letter" countdown | ✅ | ✅ |
| D1 Mood trends side by side | ✅ (mutual opt-in) | ✅ |
| D2 Relational observations | — | ✅ (per subscriber) |
| D3 "Take care of" suggestions | — | ✅ (per subscriber) |
| D4 Alignment patterns | — | ✅ (per subscriber) |

**Translation:** The letter and shared history are everyone's. The ongoing relational intelligence is subscribers'.

#### Locked design decisions — Relationship page

1. **Annual regeneration model** — replaces on-demand regeneration entirely. No approval flows, no request tables, no pending states.
2. **Data grid is real-time** — updates automatically from conversation data, always current, free for everyone
3. **Annual letter is free** — highest-emotion moment is a gift, not a paywall
4. **QR consent covers all ongoing use** — including annual regenerations, clarified on accept screen
5. **Mutual consent for mood sharing** — D1 requires explicit per-relationship opt-in, revocable anytime
6. **Per-subscriber intelligence layer** — D2-D4 rendered based on individual subscription status
7. **Nerin is the abstraction layer** — all observations flow through Nerin's voice, raw data never crosses users
8. **Harm reduction: dynamics not deficits** — framing rule for all relational observations
9. **Letter history as multi-year biography** — irreplaceable moat that compounds annually
10. **"Your Next Letter" anticipation** — makes the annual ritual visible between letters

### Post-Assessment Transition Flow

**Critical constraint:** The anonymous conversation path has been removed. All users must sign up and verify their email before starting the conversation. This simplifies the flow but puts more conversion pressure on the homepage and pre-conversation onboarding.

**Frame-by-frame flow:**

**Pre-conversation (runs before /chat):**
- Homepage → CTA
- Signup (email + password, per FR50)
- Email verification (per FR50a, FR50b)
- Pre-conversation onboarding introducing Nerin and format (per FR54)
- Entry into /chat with an authenticated user ID from turn 1

**Design principle: lean on what already exists.** No ceremonial multi-step reveal. No full-viewport wait screen. No first-visit divergent Me page. The codebase already has both `PortraitReadingView` (focused reading at `?view=portrait`) and `PersonalPortrait` (inline on results page). We use both in different contexts.

**Frame 1 — Closing exchange:** Nerin's distinct closing per FR12. Input field fades. A single button appears below the closing message: **[Show me what you found →]** — user-voiced (user speaking to Nerin), warm, keeps the conversation feel alive for one more beat.

**Frame 2 — Navigate to focused reading view:** Tap button → navigate to `/results/$sessionId?view=portrait` directly. This is the focused reading mode — no competing content, no dashboard. Just Nerin writing (or the letter, once ready).

**Frame 3 — PortraitReadingView in "generating" state:**
- OceanSpinner centered
- Nerin-voiced line: *"Nerin is writing your letter..."*
- No other content visible
- REQUIRES WORK: the component currently may not handle the generating state — needs update

**Frame 4 — Portrait ready:** Spinner resolves and the letter fades in. Full-screen, distraction-free, max-width 720px, warm background, letter format. User reads the letter uninterrupted. This is the emotional peak.

**Frame 5 — End of letter transition:** At the bottom of PortraitReadingView, a warm link: *"There's more to see →"* → navigates to `/results/$sessionId` (the full results/Me page with inline portrait, radar, scores, etc.)

**Frame 6 — Full results/Me page loads:**
- Identity hero (archetype, OCEAN code, radar chart)
- Portrait section renders inline via `PersonalPortrait` for re-read-in-context
- Public Face section with private default
- Subscription pitch visible
- Circle section (empty on first visit)

**Frame 7 — Return seed (CRITICAL: bridges Phase 5 → Phase 6):**
- At the bottom of the results/Me page, Nerin's message: *"Tomorrow, I'll ask how you're doing. Come check in with me."*
- Paired with notification permission request in Nerin's voice: *"I'd like to check in with you tomorrow. Mind if I send a quiet note?"*
- NOT a system-voice "Enable notifications" prompt
- Permission granted → schedule first personality-typed daily prompt for next day at profile-appropriate time (high-C morning, high-O afternoon, etc.)
- Permission denied → relationship still works, user opens app themselves, no lock-in

**Frame 8 — Share & invite affordances:** Revealed on scroll, always present on results/Me page. Archetype card sharing + relationship invite ceremony from Circle section. Not competing with identity content above.

**Why focused reading is the first destination:** The letter is the emotional peak and the single most valuable moment in the product. If the first read happens in a cluttered dashboard context (results page with everything visible), the emotional impact is diluted. The focused reading view protects the emotional weight at the cost of one extra navigation step (focused → full results), which is a tiny price for protecting the "feel seen" moment.

**Total flow:** Chat → PortraitReadingView (with inline spinner → letter) → Full results/Me page. 2 route transitions, 3 genuine UX frames + notification prompt. Reuses both existing portrait components in the right contexts.

#### Technical simplifications (anonymous path removal + lean transition flow)

**Removed from implementation:**
- ChatAuthGate component
- 24-hour localStorage session persistence
- Anonymous → authenticated session linking
- `sessionId` search param on login/signup routes
- "Wait for auth before generating portrait" cost optimization
- Results shell gated-session path
- Full-viewport PortraitWaitScreen with rotating Nerin-voiced text lines
- Multi-frame identity reveal sequence (archetype → OCEAN code → radar as separate full-screen moments)
- "First-visit Me" special divergent version of the Me page

**New work required:**
- `PortraitReadingView` must handle the "generating" state with OceanSpinner + Nerin-voiced line "Nerin is writing your letter..."
- Post-assessment chat closing button navigates to `/results/$sessionId?view=portrait` directly (not to `/results/$sessionId`)
- End-of-letter transition copy on PortraitReadingView updated to warmer "There's more to see →"
- Return seed section added at the bottom of the results/Me page with Nerin's message + notification permission request

**Simplified:**
- /chat route always receives authenticated user from turn 1
- Session ownership verification simplifies to authenticated-user lookup
- Email captured upfront — drop-off re-engagement emails (FR76) work for every started user
- Post-assessment flow reuses existing PortraitReadingView and PersonalPortrait components in their appropriate contexts
- Me page has one canonical layout — no first-visit special-case

**Strategic implication:** Homepage must now carry more conversion weight since cold visitors cannot experience Nerin before committing to signup. The Nerin conversation preview (FR63) and portrait excerpt (FR62) on the homepage become load-bearing for conversion. This should be a priority for a future homepage-specific design session.

**Trade-off accepted:** Lower top-of-funnel conversion for higher middle-of-funnel quality. Consistent with how Headspace, BetterUp, and serious wellness products handle signup. Self-selection filter improves completion rate and LTV.

### Weekly Summary from Nerin

Context: Sunday evening artifact that summarizes the user's week of check-ins, mood patterns, and personality insights. Single most important subscription conversion moment (three-act story lands here). Also the retention mechanism for subscribers.

#### Core principle

The weekly summary is a **letter from Nerin**, not a weekly report. Same warm typography and reading experience as the portrait. Lives in letter format, not dashboard format.

#### Nerin output grammar (three visual formats)

The weekly summary establishes the third leg of Nerin's output visual grammar:
- **Journal format (margin notes):** daily check-in recognition on Today
- **Letter format (focused reading):** portrait, weekly summary, annual relationship letter
- **Chat format:** subscriber mini-dialogue on Today

Users learn to read each format in the appropriate emotional register.

#### Locked decisions

**Timing:** Sunday evening, 7pm local time. Customizable later. Shared ritual by default (like Spotify Wrapped release day).

**Location:** Dedicated focused reading route at `/today/week/$weekId`. Entered from (1) inline card on Today page on Sunday, (2) push notification tap. Same visual language as Portrait Reading View.

**Notification:** Push notification at generation time. Copy: *"Your week with Nerin is ready."* Possessive, personal, continuous with Nerin's character voice. NOT "weekly report available."

**Generation: LLM-based for both free and subscriber versions.** Same architecture as daily check-in recognition — rich user context (facets, archetype, evidence, week's check-ins, patterns) passed to LLM with a tight prompt. No template engine.

**Free version contents:**
1. Date range header
2. Personalized opening ("Dear [name]")
3. Week narrative — 2-3 paragraphs observing the pattern of the week, referencing specific mood selections, personality-informed framing
4. Visual mood shape — 7-day dot grid as small secondary element
5. "What stood out" beat — one specific observation that makes it warm and seen
6. Nerin's sign-off

**Critical rule: the free version must feel COMPLETE and satisfying on its own.** Not a preview, not a cripple-ware teaser. A full descriptive artifact the user is glad to receive. If the free version feels incomplete during reading, the conversion dynamic reverses and users resent the platform.

**Subscriber version contents (free + additional sections):**
- **"For the week ahead"** — prescriptive focus statement + one concrete micro-action
- **"Zooming out"** — cross-week pattern detection observations
- **Relational beat** — if partner in circle + mood sharing opted in + both subscribed, observations about how partners' weeks looked relative to each other
- **Library article link** — contextually selected from SEO library based on this week's theme
- **Reflective prompt** — single open question to sit with until next week

**Translation:** Free = descriptive letter. Paid = descriptive letter + prescriptive coaching layer + pattern detection + resources. These are genuinely different artifacts, not the same artifact split in half.

#### Conversion mechanic inside the weekly summary

End of free version:

```
— Nerin

─ ─ ─ ─ ─ ─ ─ ─ ─ ─

I have more I want to say about
what comes next.

With a subscription, I can write
you a fuller letter each week —
with what to try, what patterns
I'm seeing across weeks, and what
I think might help in the week
ahead.

[Unlock Nerin's full weekly letter — €9.99/mo →]

[Not right now]
```

**Design principles for the conversion ending:**
1. Nerin's voice, not system voice — "I have more I want to say"
2. Concretely names what's missing ("what to try, what patterns, what might help")
3. Framed as Nerin wanting to tell the user more, not as paywall
4. "Not right now" is soft dismiss — returns next Sunday with same framing
5. No aggressive retention nag, no escalating prompts

#### Three-act conversion landing in weekly summaries

- **Week 1 (first Sunday):** First weekly summary. Free version is complete. User reads it, notices the gap at the end, doesn't convert yet.
- **Weeks 2-3:** Each Sunday, Nerin wants to say more. User builds trust with the free version.
- **Week 3+:** Cumulative felt gap + accumulated trust = natural conversion moment. User subscribes because they want the fuller version, not because they hit a paywall.

**Why the free version must be GOOD:** It is the engine of conversion, not a teaser. If Week 1 free is mediocre, no Week 2 happens.

#### Edge cases

- **User skipped all check-ins this week:** No summary generated. No notification. No shame. No "you missed a week" message.
- **User has <3 check-ins:** Generate a short "Nerin noticed you checked in a few times" letter. Warm, no guilt.
- **User just subscribed:** Their next weekly summary is the full version.
- **User just cancelled:** Full version continues until end of billing period, then free version.

#### Technical implementation

- **New table:** `weekly_summaries` with week_id, user_id, content_free, content_subscriber (both generated together at Sunday 6pm job — enables preview if user subscribes mid-week)
- **Generation job:** Sunday 6pm local time per user, triggered for users with ≥3 check-ins that week
- **Free and subscriber versions both LLM-generated** — one prompt produces both outputs with different sections (free = descriptive letter; subscriber = descriptive letter + prescriptive coaching layer). Cost: ~$0.02-0.05 per user per week regardless of tier. Monthly cost ~$0.08-0.20 per active user.
- **No template engine for weekly summaries** — previously proposed template-based generation was rejected as over-engineering
- **Delivery:** Push notification + email fallback + inline card on Today page top on Sundays
- **Route:** `/today/week/$weekId` — focused reading view, same style as Portrait Reading View
- **Cost:** Free users = $0. Subscribers = ~$0.10-0.20/month added. Well within 96-98% gross margin target.

#### New work required

- `weekly_summaries` table
- Sunday 6pm scheduled generation job
- Template library for free-version narratives
- LLM prompt template for subscriber prescriptive layer
- Dedicated `/today/week/$weekId` route + reading view component
- Inline Today page card (visible on Sundays when summary ready)
- Push notification wiring with "Your week with Nerin is ready" copy

---

## PROTOTYPE: Make Ideas Tangible

### Prototype Approach

Lean walkthrough of critical paths in Figma, not a full design system. The goal is to answer the riskiest questions before committing to code. 5 prototype paths, each targeting one major architectural bet.

### Prototype Description

**Format:** Figma file with clickable frames for 5 critical paths. Tap-to-advance only, no interactivity.

**5 priority paths to prototype:**

1. **Three-space navigation** — Today / Me / Circle landing pages (half day)
2. **Today page — free and paid states** — silent journal vs. LLM dialogue (1 day)
3. **Weekly letter — free and subscriber versions side by side** — hand-drafted in Nerin's voice (1 day)
4. **Invite ceremony copy** — new dialog vs. generic share (half day)
5. **Post-assessment transition** — closing exchange → button → portrait reading view → Me (1 day)

Total effort: ~4 days for prototypes.

### Key Features to Test

Each path maps to a specific risk:
- Three-space nav → cognitive model validation
- Today fork → free/paid value perception
- Weekly letter → subscription conversion motivation
- Invite ceremony → viral flywheel activation
- Post-assessment transition → emotional arc preservation

---

## TEST: Validate with Users

### Testing Plan

**Who:** 5-7 users across two segments:
- 3-4 psychology-curious adults (25-40), Léa-type
- 2-3 skeptical-but-open partners, Marc-type

**How:** 45-minute sessions per user. Think-aloud protocol. Walk through the 5 prototype paths.

**Recruitment:** Founder network + friends-of-friends + first seeded cohort. No monetary incentives.

**Tasks per user:**
1. Navigation: "Where would you go to check in / re-read portrait / see your relationship?"
2. Today free: "What's your reaction? Enough or empty?"
3. Today paid: "Worth €9.99/month? What is or isn't worth it?"
4. Weekly letter: "Which would make you subscribe?"
5. Invite: "Does this make you want to send it?"
6. Transition: "Walk through this and describe what you're feeling."

### User Feedback

**Capture per session:**
- Friction points (pauses, scroll-backs, confusion)
- User language (does it match our framing?)
- Emotional reactions to portrait and weekly letter
- Specific subscription objections
- Whether users spontaneously name the category ("journal with a companion" vs "personality quiz")

### Riskiest assumptions being tested

1. **Is silent free daily check-in compelling or disappointing?** Fork model fails if users say "I want Nerin to respond."
2. **Does the weekly letter create enough value gap to drive subscription?** Conversion story fails if free version is "good enough."
3. **Does three-space navigation feel intuitive or fragmented?** Architecture needs rework if users can't predict tab contents.
4. **Does the invite copy motivate action?** Viral flywheel is weak if users say "I probably wouldn't send it."
5. **Does the lean transition feel satisfying?** Needs more ceremony if users say "that felt rushed."

### Key Learnings

*(To be completed after actual user sessions)*

**Pre-test hypotheses (to be validated or invalidated):**
- Three-space model tests well (matches intuition from other apps)
- Silent free daily is the riskiest element — some users may find it cold
- Weekly letter gap drives conversion IF subscriber version is genuinely richer
- Invite copy tests well (framed as care, not marketing)
- Lean transition may feel rushed for some — watch for "I needed a moment" feedback

---

## Next Steps

### Refinements Needed

Phased implementation roadmap in priority order:

**Phase 0 — Validate (before any code changes)**
1. Build 5 Figma prototype paths
2. Run 5-7 user tests
3. Synthesize learnings
4. Revise design where validation fails

**Phase 1 — Foundational architecture**
5. Three-space navigation (Today / Me / Circle) + thin `/settings` route
6. Replace `/dashboard` with `/today` as default authenticated landing
7. Update post-assessment routing: → `/results/$sessionId?view=portrait`
8. Remove dead anonymous-path code (ChatAuthGate, localStorage, session linking)

**Phase 2 — Today page (silent free + LLM paid)**
9. Free Today: check-in form, mood save, calendar, anticipation line
10. Paid Today: check-in form + LLM recognition + mini-dialogue trigger
11. Wire LLM prompt for daily recognition (Haiku) with user context builder
12. Scoped mini-dialogue conversation type (reuse existing conversation infra)

**Phase 3 — Me page redesign**
13. Restructure Me with new sections (Identity Hero, Portrait, Growth conditional, Public Face, Circle preview, Subscription, gear icon)
14. Apply Intimacy Principle — remove ALL count metrics, attribution, profile views
15. Update Public Face section
16. Add Return Seed at bottom (Nerin's "tomorrow" message + notification permission)

**Phase 4 — Circle page + invite ceremony**
17. Rename "Connections" → "Circle" in all user-facing copy
18. Build Circle list view with full-width person cards
19. Implement invite ceremony dialog with new reward-first copy
20. Audit: replace "relationship analysis" with "letter about your dynamic" user-facing

**Phase 5 — Relationship letter page**
21. Real-time data grid (derive-at-read already supports this)
22. Static letter + "Your Next Letter" anticipation section
23. Clarify QR accept screen copy (data-sharing ongoing, revocable, annual letter)
24. Preserve letter history as versioned snapshots
25. Annual regeneration job — deferred (first-cohort anniversary in 2027)

**Phase 6 — Weekly summary**
26. `weekly_summaries` table
27. Sunday 6pm scheduled generation job per user
28. LLM prompt for weekly letter (free + subscriber from one call)
29. `/today/week/$weekId` focused reading route
30. Inline card on Today page on Sundays
31. Push notification ("Your week with Nerin is ready")
32. Conversion CTA at end of free version with soft dismiss

**Phase 7 — Post-assessment transition**
33. Update chat closing → button copy ("Show me what you found")
34. Update `PortraitReadingView` to handle generating state with OceanSpinner
35. Update end-of-letter transition copy ("There's more to see →")

**Phase 8 — Subscription flow**
36. Polar embedded checkout for €9.99/mo
37. Subscription state management (active, cancelled, past_due)
38. Conditional rendering for paid features across Today, Me, relationship page, weekly letter

**Phase 9 — PRD update**
39. Update PRD to reflect three-space architecture
40. Add FRs for daily check-in fork (free silent / paid dialogue)
41. Add FRs for weekly letter (free + paid, conversion CTA)
42. Update relationship analysis FRs to reflect annual regeneration model
43. Update homepage FRs as load-bearing for conversion (anonymous path removed)
44. Relax NFR7a from "approach $0" to "sustain unit economics"
45. Add Intimacy Principle as product principle
46. Update Journeys 1-6, add new journeys for Phase 5→6 bridge and subscription conversion

### Action Items

**Immediate (this week):**
- Save this design thinking document ✓
- Update PRD with corrections from this session (separate focused session)
- Create Figma prototypes of 5 critical paths
- Recruit 5-7 users for testing

**Short-term (next 2-4 weeks):**
- Run user tests, synthesize learnings, revise as needed
- Scope implementation phases into sprints/stories
- Start Phase 1 foundational architecture work

**Medium-term (1-3 months):**
- Complete Phases 1-6 of implementation
- Soft launch to first 20 seeded users
- Validate Phase 5→6 bridge works (daily check-in retention)

### Success Metrics

**The redesign succeeds if:**
- Day 7 return rate (post-assessment) > 40% — users come back for first weekly letter
- Day 30 retention > 25% — daily/weekly rhythm established
- Week 3+ subscription conversion > 3% — three-act engine fires
- Invite rate per completed assessment > 10% — viral loop activated
- Sunday weekly letter open rate > 60% — anticipation hook works
- Qualitative: users describe big-ocean as "a companion" or "a place," not "a test"

**The redesign fails if:**
- Users describe free experience as "empty" or "cold" (silent daily was wrong)
- Weekly letter open rate < 30% (not enough pull)
- Subscription conversion < 2% sustained (paid value gap unclear)
- Users drop off post-assessment flow (lean transition too lean)

---

## TEST: Validate with Users

### Testing Plan

*(to be completed)*

### User Feedback

*(to be completed)*

### Key Learnings

*(to be completed)*

---

## Next Steps

### Refinements Needed

See above phased roadmap (Phases 0-9).

### Action Items

See above immediate / short-term / medium-term action list.

### Success Metrics

See above success/failure criteria for the redesign.

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
