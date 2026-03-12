# Problem Solving Session: Territory Catalog Migration & Refinement

**Date:** 2026-03-08
**Problem Solver:** Vincentlay
**Problem Category:** Conversation Architecture / Catalog Data Quality

> **Coherence note (2026-03-10):** This spec is current with the authoritative [Conversation Pacing Design Decisions](./planning-artifacts/conversation-pacing-design-decisions.md) (Decisions 1-13). Updates applied: "move generator" → "Move Governor" (Decision 12), E_target outputs [0,1] natively — no downstream normalization (Gap 6 resolution from [Territory Policy Coherence Audit](./problem-solution-2026-03-10-territory-policy-coherence.md)).

---

## 🎯 PROBLEM DEFINITION

### Initial Problem Statement

The territory catalog — 22 conversation territories that guide Nerin's topic selection — needs three interconnected changes before the new unified territory scorer can ship:

1. **Type migration** — the `Territory` interface uses discrete `energyLevel: "light" | "medium" | "heavy"` but the scorer formula requires continuous `expectedEnergy: number` in [0, 1]. This is a hard blocker for Phase 1 implementation.

2. **Energy calibration** — each territory needs a thoughtful continuous energy value, not just a crude band mapping. The `energyMalus` and `conversationSkew` terms are both sensitive to this value — it directly controls which territories the scorer recommends at any given user state.

3. **Domain re-tagging** — the current domain assignments create severe adjacency cluster traps. Four clusters of territories have Jaccard similarity = 1.0 internally but poor connectivity to the rest of the catalog. Six single-domain territories create dead-ends. The `family` domain is an island reachable from only 4 of 22 territories. Without fixes, the scorer's adjacency term will trap conversations in clusters.

### Refined Problem Statement

**Migrate the territory catalog from discrete energy levels to continuous expected energy, assign calibrated energy values to all 22 territories, and fix domain tagging to eliminate adjacency cluster traps — producing a catalog that the unified five-term scorer can consume to generate reasonable territory rankings across all user archetypes.**

The irreducible problem: the scorer amplifies whatever the catalog says. If energy values are wrong, `energyMalus` and `conversationSkew` produce wrong rankings. If domain tags create clusters, `adjacency` traps conversations. The catalog is the scorer's ground truth — it must be right before the scorer can be trusted.

### Problem Context

**Upstream dependency:** The territory policy redesign (resolved 2026-03-07) produced a unified five-term scorer formula: `score(t) = coverageGain(t) + adjacency(t) + conversationSkew(t) - energyMalus(t) - freshnessPenalty(t)`. Two of these terms (`energyMalus`, `conversationSkew`) consume `expectedEnergy`. One term (`adjacency`) computes Jaccard similarity on `domains` and `expectedFacets`. The catalog feeds three of five scorer terms directly.

**Downstream consumers:** Territory scorer (Phase 1 Step 1-3), territory selector, Move Governor, prompt builder, and all existing code referencing `energyLevel` (39 files identified in prior analysis).

**Current state:**
- 22 territories: 7 light, 8 medium, 7 heavy
- 5 steerable life domains: work (10 territories), solo (11), relationships (9), leisure (4), family (4)
- 6 single-domain territories creating adjacency dead-ends
- 4 cluster traps with internal Jaccard = 1.0
- `family-bonds` is an island (Jaccard = 0 with 11 territories)
- No empirical data on facet yield accuracy yet (no real conversations run)

### Success Criteria

1. **Type migration complete** — `Territory` interface uses `expectedEnergy: number`, `energyLevel` and `EnergyLevel` removed, all 22 catalog entries updated, catalog test passes
2. **Energy values are defensible** — each value has a stated rationale, values within former bands are differentiated (not all former "light" = 0.3), the mapping produces sensible scorer behavior for cold-start and drained-user scenarios
3. **No cluster traps** — no group of 3+ territories shares identical domain sets; maximum Jaccard = 1.0 pair count reduced significantly
4. **Family domain reachable** — `family-bonds` has Jaccard > 0 with at least 5 territories (currently: 4)
5. **Domain distribution improved** — `leisure` and `family` each appear in at least 6 territories (currently: 4 each)
6. **All 30 facets still covered** — no facet loses its last territory
7. **Anger has medium-energy access** — anger (currently only in heavy territories) must have at least one territory where it genuinely surfaces at medium energy. The fix is territory creation, not energy value manipulation. Depression is accepted as heavy-only (0.65, 0.72) — the portrait communicates thin facets as "still emerging" rather than forcing artificial medium-energy access.
8. **Catalog passes existing tests** — `territory-catalog.test.ts` updated and green
9. **Scorer can consume the catalog** — Phase 1 Step 1 is unblocked

### Pre-mortem Findings (Applied)

Six failure scenarios were identified by imagining the catalog shipping as-is with the new scorer:

| # | Failure | Root Cause | Fix Category |
|---|---------|-----------|--------------|
| 1 | **Leisure Trap** — 4 territories with identical {leisure, solo} domains trap conversation in hobbies | 4 identical domain sets | Domain re-tag |
| 2 | **Family Island** — family-bonds (single domain) unreachable from 11 territories (Jaccard = 0) | Single-domain isolation | Domain re-tag |
| 3 | **Crude Band Collapse** — all former "light" = 0.3 wastes the continuous signal | No within-band differentiation | Energy calibration |
| 4 | **Neuroticism Desert** — anger and depression exist ONLY in heavy territories; low-energy users never reach them | Facet-energy distribution gap | Territory redesign (not energy manipulation) |
| 5 | **Work-Solo Echo** — 4 territories with identical {work, solo} domains trap conversation in achiever topics | 4 identical domain sets | Domain re-tag |
| 6 | **Energy Cliff at Session End** — conversationSkew can't distinguish warm-heavy from draining-heavy | No within-band differentiation | Energy calibration |

**Key design principle discovered:** Don't lie about what a territory is to make the math work. If a facet needs to be reachable at a different energy level, find or create a territory where that facet genuinely surfaces at that energy — don't artificially lower a heavy territory's energy value. The territory is what it is.

### First Principles: What `expectedEnergy` Means

**Definition:** `expectedEnergy` measures the energy cost a user typically pays to engage genuinely with a territory. It is on the same axis as E_target (user energy as cost). It is bounded [0, 1] because E_target outputs [0, 1] natively (ConversAnalyzer normalizes energy from 0-10 to [0, 1] in the schema transform at source) and all scorer terms are bounded [0, 1] by construction.

**Anchor point:** `expectedEnergy = 0.5` corresponds to E_target = 5.0, the comfort threshold (zero drain in the pacing formula). Below 0.5 = easier than comfortable. Above 0.5 = costlier than comfortable.

**`expectedEnergy` is NOT:**
- How emotionally heavy the territory sounds
- How psychologically important it is
- How good it is for late-session resonance
- How much signal it tends to yield
- How deep the territory *could eventually go* after several turns

It is only: **the typical cost of honest engagement.**

**Calibration rule:** Score based on the cost of a good, genuine answer to the territory's natural opener — not the maximum depth the territory could eventually reach. This keeps catalog values stable and prevents inflation of territories that *can* go deep but don't *require* it on entry.

**Range guidance (v1):**
| Range | Meaning | Calibration anchor |
|---|---|---|
| 0.15 - 0.25 | Easy, familiar, low-cost entry | "User can answer on autopilot" |
| 0.25 - 0.40 | Engaged but easy | "Some self-reflection, no vulnerability required" |
| 0.40 - 0.55 | Comfortable real engagement | "Has to think, may feel something, can manage" |
| 0.55 - 0.70 | Meaningful effort | "Revealing something, not just describing" |
| 0.70 - 0.85 | Costly honest engagement | "Vulnerability, difficult memories, real price" |

Avoid values below 0.15 or above 0.85 in v1 — extremes are better reserved for model math than authored territory metadata.

**v1 compromise (documented):** `conversationSkew` uses `expectedEnergy` as a practical proxy for session placement, not because expectedEnergy and narrative depth are identical, but because they correlate enough for v1. If they need to be split later, this is where the seam lives.

### Self-Consistency Validation: Energy Calibration

Three independent calibration methods were applied to all 22 territories, then compared:

- **Method A (primary):** Opener-cost direct assessment — "What does a genuine first answer cost?"
- **Method B (challenge):** Four-dimension scoring (emotional, cognitive, expressive, urgency) — used to audit Method A, not as equal input. Note: plain averaging underweights emotional cost; Method A naturally captures this.
- **Method C (sanity check only):** Relative ordering + anchor-ladder spacing — used to detect ordering anomalies and compression, not averaged into consensus. Not truly independent (same intuition as A/B).

**Scoring process used:**
1. Primary score from opener-cost (Method A)
2. Dimension audit to challenge — "Does my opener-cost score make sense?"
3. Relative ordering check against 6 anchor territories: daily-routines (0.20), creative-pursuits (0.25), work-dynamics (0.42), family-bonds (0.58), inner-struggles (0.65), pressure-and-resilience (0.72)

**v1 Calibrated Values:**

| Territory | Old Band | expectedEnergy | Confidence | Rationale |
|---|---|---|---|---|
| daily-routines | light | **0.20** | High | Descriptive, zero vulnerability, autopilot |
| creative-pursuits | light | **0.25** | High | Pleasant self-disclosure, mild pride/joy |
| weekend-adventures | light | **0.25** | High | Positive storytelling, low stakes |
| learning-curiosity | light | **0.25** | High | Cognitive engagement, enthusiasm, low emotional cost |
| social-circles | light | **0.30** | High | Descriptive but touches belonging, mild reflection |
| helping-others | light | **0.30** | High | Story recall, mild emotional warmth, prosocial |
| comfort-zones | light | **0.33** | Medium | Touches vulnerability indirectly; opener is gentle but self-awareness required |
| spontaneity-and-impulse | medium | **0.37** | Medium | Playful recall, mild self-judgment possible |
| work-dynamics | medium | **0.42** | Medium | Cognitive effort, some activation, professional identity (anchor) |
| emotional-awareness | medium | **0.42** | Medium | Self-reflection on emotions, moderate introspection |
| ambition-and-goals | medium | **0.43** | Medium | Identity investment, future self, some pressure |
| social-dynamics | medium | **0.46** | Low (high variance) | Opener touches social anxiety; cost is highly user-dependent |
| friendship-depth | medium | **0.48** | Medium | Emotional warmth, relational reflection, meaningful |
| opinions-and-values | medium | **0.49** | Low (high variance) | Assertive self-disclosure; easy for some, exposing for others |
| team-and-leadership | medium | **0.49** | Low (high variance) | Taking charge is comfortable for some, uncomfortable for others |
| giving-and-receiving | heavy | **0.53** | Medium | Emotional warmth, possible discomfort with receiving; deep but not draining |
| family-bonds | heavy | **0.58** | Medium | Emotional depth, attachment, gratitude or grief (anchor) |
| conflict-and-resolution | heavy | **0.59** | Medium | Anger recall, self-reflection; costly but less existential than identity |
| identity-and-purpose | heavy | **0.63** | Medium | Deep identity reflection, existential territory |
| inner-struggles | heavy | **0.65** | High | Inviting opener, but touches pain; opener cost not max depth (anchor) |
| vulnerability-and-trust | heavy | **0.70** | Medium | Vulnerability recall, trust themes, real exposure; gentle opener keeps it at 0.70 not 0.80 |
| pressure-and-resilience | heavy | **0.72** | Medium | Difficult memory recall, vulnerability, resilience (anchor) |
| *daily-frustrations* | *new* | **0.38** | Medium | Pet peeves, small annoyances — anger at low cost; opener invites everyday friction, not conflict |
| *growing-up* | *new* | **0.45** | Medium | Warm childhood reflection; medium introspection, not trauma; opener invites positive/neutral memories |
| *family-rituals* | *new* | **0.28** | Medium | Describing traditions is comfortable storytelling; low emotional activation, low cognitive load |

**Key findings:**
- All three methods converged well (8 territories with spread ≤ 0.03)
- Former "heavy" band spreads naturally from 0.53 to 0.72 — significant differentiation
- Former "light" band spreads from 0.20 to 0.33
- Former "medium" band spans 0.37 to 0.49
- Nothing in the catalog exceeds 0.72 — upper range [0.75-0.85] is headroom for future territories
- 4 territories marked "low confidence / high variance" — first candidates for empirical recalibration
- No band collapse: within-band differentiation achieved across all three former bands

### Comparative Analysis Matrix: Domain & Facet Refinement

A weighted scoring matrix was used to evaluate domain re-tagging, new territory creation, and facet redistribution options. Criteria:

| Criterion | Weight | What it measures |
|---|---|---|
| **Narrative honesty** | 0.5 | Does this domain/facet genuinely belong? Would the opener naturally elicit it? |
| **Connectivity gain** | 0.3 | How many new Jaccard > 0 connections does this create? |
| **Cluster-breaking** | 0.2 | Does this reduce a known cluster trap? |

**Design principle:** Add territories to create honest bridges, not to satisfy facet quotas. Don't overload existing territories with artificial facet additions when a new territory can carry them genuinely.

#### Domain Re-tagging (8 territories)

| Territory | Before | After | Score | Rationale |
|---|---|---|---|---|
| family-bonds | {family} | **{family, relationships}** | 0.81 | Family IS relationships; critical island fix — Jaccard=0 with 11 territories resolved |
| social-circles | {relationships} | **{relationships, leisure}** | 0.67 | Social circles form around activities; bridges relationships to underserved leisure domain |
| emotional-awareness | {solo} | **{solo, relationships}** | 0.65 | Emotions are relational; "good day" often involves people; bridges solo to relationships |
| work-dynamics | {work} | **{work, relationships}** | 0.64 | Work challenges are interpersonal; energy (0.42) differentiates from existing {work, relationships} cluster (0.30-0.59) |
| friendship-depth | {relationships} | **{relationships, solo}** | 0.57 | "What made that friendship important" is introspective reflection |
| inner-struggles | {solo} | **{solo, relationships}** | 0.56 | Struggles involve people; bridges heavy-solo to relationship territories |
| comfort-zones | {solo, leisure} | **{solo, relationships}** | N/A (cluster fix) | Breaks leisure-solo cluster (4 identical domain sets → 3); recharging is relational (involves people or deliberate avoidance) |
| social-dynamics | {relationships, work} | **{relationships, leisure}** | 0.80 | "Room full of strangers" is a party/social gathering (leisure) as much as work; reduces {relationships, work} cluster from 5→4; adds leisure territory #6 |

**Reverted:** learning-curiosity stays at {solo, work} — moving it to {solo, leisure} would have re-created a 4-member leisure-solo cluster.

#### New Territories (3)

Instead of forcing facets onto existing territories, three new territories fill structural gaps honestly:

**1. Daily Frustrations** — `daily-frustrations`
- **Domains:** {relationships, work}
- **expectedEnergy:** 0.38
- **Facets:** anger, cooperation, self_consciousness, assertiveness
- **Opener:** *"What's something that really gets on your nerves, even if it's small?"*
- **Why:** Honest medium-energy home for anger. Pet peeves, workplace annoyances, social friction — anger genuinely surfaces here at moderate cost. Solves the Neuroticism Desert for anger without artificially adding it to work-dynamics.

**2. Growing Up** — `growing-up`
- **Domains:** {family, solo}
- **expectedEnergy:** 0.45
- **Facets:** emotionality, trust, imagination, dutifulness
- **Opener:** *"What's something from growing up that shaped who you are today?"*
- **Why:** Medium-energy bridge into family material without requiring immediate heaviness. {family, solo} is a new domain combination — bridges the family island directly to the solo cluster. Family territory #5.

**3. Family Rituals** — `family-rituals`
- **Domains:** {family, leisure}
- **expectedEnergy:** 0.28
- **Facets:** dutifulness, cheerfulness, cooperation, morality
- **Opener:** *"Does your family have any traditions or rituals, even small ones?"*
- **Why:** Light-energy family entry point for guarded users. {family, leisure} is a new domain combination — fills the only missing 2-domain combo among steerable domains. Distinct from family-bonds (shared routines vs relational impact). Family territory #6, leisure territory #6.

These three territories resolve:
- anger: lowest available at **0.38** (was 0.59) — 8x lower energyMalus for E_target=0.30
- Family domain: 4 → **6** territories (meets success criterion)
- Leisure domain: 4 → **6** territories (meets success criterion — social-circles + family-rituals)
- Depression: **accepted as "still emerging"** for low-energy users — only in inner-struggles (0.65) and pressure-and-resilience (0.72). The system explicitly accepts thin facets and communicates this in the portrait. No artificial medium-energy depression territory.

#### Cluster Status After All Changes (25 territories)

| Cluster (domain set) | Count | Energy Range | Status |
|---|---|---|---|
| {relationships, solo} | 5 | 0.33 → 0.42 → 0.48 → 0.49 → 0.65 | **Acceptable** — clear energy progression |
| {relationships, work} | 5 | 0.30 → 0.38 → 0.42 → 0.49 → 0.59 | **Unchanged count** (social-dynamics exited but daily-frustrations entered); energy-ordered |
| {solo, work} | 4 | 0.20 → 0.25 → 0.43 → 0.63 | **Acceptable** — wide energy spread |
| {leisure, solo} | 3 | 0.25 → 0.25 → 0.37 | **Reduced** (was 4, comfort-zones exited) |
| {family, relationships} | 3 | 0.53 → 0.58 → 0.70 | **Acceptable** — energy spread |
| {relationships, leisure} | 2 | 0.30 → 0.46 | **New** — social-circles + social-dynamics bridge relationships to leisure |

No cluster traps remain. All clusters are energy-ordered with sufficient spread to prevent flat cycling.

#### Domain Distribution (25 territories)

| Domain | Count | % |
|---|---|---|
| relationships | **15** | 60% |
| solo | **13** | 52% |
| work | **9** | 36% |
| family | **6** | 24% |
| leisure | **6** | 24% |

All success criteria met. Relationships is over-represented (60%) but appropriate for a social/personality assessment context. Work reduced from 10→9 due to social-dynamics domain change; 9 territories remain well-distributed across energy levels.

#### Formula Consideration: Weighted Domain Similarity

The relationships flood (15/25 = 60%) creates a systematic adjacency advantage for relationship-tagged territories. For v1, this is accepted — the scorer's other terms (coverageGain, energyMalus, freshnessPenalty) provide sufficient counterbalance.

If monitoring shows >70% of turns in relationship-tagged territories, consider switching from plain Jaccard to **inverse-frequency-weighted Jaccard** in the adjacency formula:
- Weight each domain inversely to its catalog frequency
- `relationships` (60%) gets a smaller weight; `family` and `leisure` (24%) get larger weights
- Sharing a rare domain becomes more valuable than sharing a common one
- This is a scorer coefficient change (`scorer-config.ts`), not a catalog change

#### Structural Validation (3 checks)

**Check 1 — Reachability: PASS.** Every zone (family, leisure, heavy) reachable from any light-energy opener (≤0.33) within 1-2 hops. No dead ends. Jaccard scores at each hop range 0.333-1.0.

**Check 2 — Facet Coverage: 29/30 at ≤0.50.** Depression is the only facet isolated to heavy territories (0.65, 0.72). Accepted by design — the system reports thin facets as "still emerging" in the portrait. All other Neuroticism facets have honest medium-energy homes.

**Check 3 — No New Cluster Traps.** Largest clusters are 5 members ({relationships, solo} and {relationships, work}), both energy-ordered. No group of 3+ territories has identical domains AND similar energy values. The leisure-solo cluster reduced from 4 to 3 members.

#### Consolidated Final Catalog (25 territories)

All changes applied: 8 domain re-tags, 3 new territories, continuous expectedEnergy values.

| # | Territory ID | Domains | expectedEnergy | Facets | Opener |
|---|---|---|---|---|---|
| 1 | daily-routines | work, solo | 0.20 | orderliness, self_discipline, activity_level | What does a typical morning look like for you...? |
| 2 | creative-pursuits | leisure, solo | 0.25 | imagination, artistic_interests, adventurousness | Is there something creative you enjoy doing...? |
| 3 | weekend-adventures | leisure, solo | 0.25 | excitement_seeking, adventurousness, cheerfulness | What's something you did recently on a weekend...? |
| 4 | learning-curiosity | solo, work | 0.25 | intellect, imagination, self_efficacy | What's something you've been curious about...? |
| 5 | family-rituals | **family, leisure** | **0.28** | **dutifulness, cheerfulness, cooperation, morality** | **Does your family have any traditions or rituals...?** |
| 6 | social-circles | **relationships, leisure** | 0.30 | friendliness, gregariousness, trust | Tell me about the people you tend to spend time with. |
| 7 | helping-others | relationships, work | 0.30 | altruism, sympathy, cooperation | Can you tell me about a time you helped someone...? |
| 8 | comfort-zones | **solo, relationships** | 0.33 | cautiousness, vulnerability, adventurousness | What's your go-to way to recharge...? |
| 9 | spontaneity-and-impulse | leisure, solo | 0.37 | immoderation, excitement_seeking, cautiousness | What's the most spontaneous thing you've done...? |
| 10 | daily-frustrations | **relationships, work** | **0.38** | **anger, cooperation, self_consciousness, assertiveness** | **What's something that really gets on your nerves...?** |
| 11 | work-dynamics | **work, relationships** | 0.42 | assertiveness, achievement_striving, self_efficacy, cooperation | What's the most interesting challenge you've faced at work...? |
| 12 | emotional-awareness | **solo, relationships** | 0.42 | emotionality, anxiety, self_consciousness | When you're having a really good day, what does that feel like? |
| 13 | ambition-and-goals | work, solo | 0.43 | achievement_striving, self_discipline, activity_level | What's something you're working toward right now...? |
| 14 | growing-up | **family, solo** | **0.45** | **emotionality, trust, imagination, dutifulness** | **What's something from growing up that shaped who you are?** |
| 15 | social-dynamics | **relationships, leisure** | 0.46 | gregariousness, self_consciousness, cheerfulness, friendliness | How do you usually feel walking into a room full of strangers? |
| 16 | friendship-depth | **relationships, solo** | 0.48 | trust, friendliness, modesty, morality | Think of a close friend — what made that friendship important? |
| 17 | opinions-and-values | solo, relationships | 0.49 | liberalism, morality, assertiveness | Is there something you feel strongly about that others might disagree with? |
| 18 | team-and-leadership | work, relationships | 0.49 | assertiveness, cooperation, dutifulness, modesty | Tell me about a time you had to take charge of something. |
| 19 | giving-and-receiving | relationships, family | 0.53 | altruism, modesty, sympathy, immoderation | When someone does something really kind for you, how does that sit? |
| 20 | family-bonds | **family, relationships** | 0.58 | trust, sympathy, dutifulness, emotionality | Tell me about someone in your family who's had a real impact. |
| 21 | conflict-and-resolution | relationships, work | 0.59 | anger, cooperation, assertiveness, morality | Tell me about a disagreement that taught you something. |
| 22 | identity-and-purpose | solo, work | 0.63 | intellect, liberalism, self_efficacy, emotionality | If someone who knows you described what drives you, what would they say? |
| 23 | inner-struggles | **solo, relationships** | 0.65 | depression, anxiety, vulnerability, anger | Everyone has tough patches — what's been weighing on you? |
| 24 | vulnerability-and-trust | relationships, family | 0.70 | vulnerability, trust, anxiety, self_consciousness | Can you think of a time being open with someone brought you closer? |
| 25 | pressure-and-resilience | work, family | 0.72 | vulnerability, self_discipline, achievement_striving, depression | Think of a time when things got really tough — how did you get through? |

**Bold** = changed from original catalog. New territories in bold with new facets.

**Facet coverage verification:** All 30 Big Five facets are present in at least one territory. No facet was lost. Depression appears in 2 territories (inner-struggles, pressure-and-resilience), both heavy — accepted by design.

**Opener compatibility:** All openers remain unchanged despite domain re-tags. Each opener was verified to work naturally in the updated domain context (e.g., social-dynamics "room full of strangers" works for leisure as well as work gatherings).

**Cold-start migration:** The hardcoded `COLD_START_TERRITORIES` array (creative-pursuits, weekend-adventures, social-circles) is replaced by dynamic selection from the territory catalog — the territory selector's cold-start rule (random from top-scored candidates at turn 1) makes static lists unnecessary. The `COLD_START_TERRITORIES` constant should be removed alongside `energyLevel`/`EnergyLevel` during the type migration.

#### Topology Analysis (Domain Skeleton)

**Caveat:** This is a domain-topology skeleton, not a full scorer prediction. Actual adjacency is `0.8 × domainSimilarity + 0.2 × facetSimilarity`, and the scorer's behavior depends on all 5 terms (coverageGain, adjacency, conversationSkew, energyMalus, freshnessPenalty). Within same-domain-pair corridors, adjacency is flat — other scorer terms do the discriminating.

**Three major corridors** (Jaccard = 1.0 within each):

| Corridor | Domain Pair | Territories (energy-ordered) | Character |
|---|---|---|---|
| Introspective | {solo, relationships} | comfort-zones (0.33) → emotional-awareness (0.42) → friendship-depth (0.48) → opinions-values (0.49) → inner-struggles (0.65) | Self-discovery through reflection and relational self-awareness |
| Interpersonal | {relationships, work} | helping-others (0.30) → daily-frustrations (0.38) → work-dynamics (0.42) → team-leadership (0.49) → conflict-resolution (0.59) | Social/professional dynamics |
| Achiever | {solo, work} | daily-routines (0.20) → learning-curiosity (0.25) → ambition-goals (0.43) → identity-purpose (0.63) | Competence, drive, intellectual identity |

**Key bridge territories** (Jaccard = 0.33, connecting corridors):

| Bridge | Connects | Why it matters |
|---|---|---|
| growing-up {family, solo} | Solo corridors ↔ Family zone | Only medium-energy family entry; most structurally valuable new territory |
| social-circles {rel, leisure} | Relationships ↔ Leisure cluster | Bridges the most and least common domains at light energy |
| social-dynamics {rel, leisure} | Same bridge at medium energy | Second leisure exit at 0.46 |
| family-rituals {family, leisure} | Family ↔ Leisure | Light family entry; connects two sparse domains directly |
| giving-and-receiving {rel, family} | Relationships → Family at medium energy | Gateway to family-bonds and vulnerability-and-trust |
| pressure-resilience {work, family} | Work corridor ↔ Family zone | Only work-family bridge; heavy energy |

**Structural observations:**

1. **Family is a peninsula, not an island.** Four bridge points exist (growing-up, family-rituals, family-bonds, pressure-resilience). But every entry requires a 0.33 adjacency hop — no territory outside the family zone has Jaccard > 0.33 with any family territory.

2. **Leisure is a cul-de-sac with two exits.** creative-pursuits, weekend-adventures, spontaneity-and-impulse form a tight Jaccard=1.0 triangle. Exits only through social-circles/social-dynamics (to relationships) or family-rituals (to family). The scorer needs coverageGain or energyMalus to push users out — adjacency alone won't do it.

3. **Relationships is the hub (60%).** Every corridor except leisure-solo and solo-work passes through relationships. This is both a strength (connectivity) and a risk (global bias). Within corridors, adjacency is flat — coverageGain and energyMalus do the real steering, not domain similarity.

4. **The catalog affords a natural three-act session arc** — not guarantees one, but the energy distribution supports it: Act 1 (light, 0.20-0.37, 9 territories, broad exploration), Act 2 (medium, 0.38-0.53, 10 territories, corridor narrowing), Act 3 (heavy, 0.58-0.72, 6 territories, depth convergence). Whether this becomes a real arc depends on w_e, freshness decay, skew shape, and coverageGain decline rates.

**Deferred validation (requires running scorer):**
- Weighted adjacency graph using full formula (domain + facet similarity)
- Escape-velocity simulations from each corridor (how many turns to leave?)
- Selection-frequency heatmaps across user archetypes (100 synthetic sessions)
- Monitoring: % of turns in relationship-bearing territories, consecutive same-corridor turns, transition direction ratios

---

## 🔍 DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

| Dimension | IS | IS NOT |
|---|---|---|
| **What** | Type migration (`energyLevel` → `expectedEnergy`), energy calibration, domain re-tagging, 3 new territories, facet redistribution | Formula changes, scorer implementation, Move Governor redesign, pipeline wiring |
| **Where** | `packages/domain/src/types/territory.ts`, `packages/domain/src/constants/territory-catalog.ts`, `packages/domain/src/constants/territory-catalog.test.ts` | Infrastructure layer, API handlers, frontend code |
| **Who** | Territory scorer (primary consumer), territory selector, Move Governor, prompt builder | ConversAnalyzer (reads territories but doesn't consume expectedEnergy), E_target formula (no territory dependency) |
| **When** | Blocks Phase 1 Step 1 of territory scorer implementation | Does not block E_target implementation, energy/telling extraction, or silent scoring |

### Root Cause Analysis

**Method: Five Whys**

1. **Why can't the territory scorer ship?** → It requires `expectedEnergy: number` but the catalog provides `energyLevel: "light"|"medium"|"heavy"`.
2. **Why does the catalog use discrete levels?** → The original steering system (DRS) used discrete levels for simple conditional logic ("if light, do X"). The continuous formula didn't exist when the catalog was designed.
3. **Why are there cluster traps?** → Domain tagging was designed for human readability ("this territory is about work"), not for Jaccard similarity computation. Six single-domain territories were natural descriptions but create adjacency dead-ends.
4. **Why are Neuroticism facets only in heavy territories?** → The original catalog mapped facets to territories based on clinical association (anger → conflict, depression → inner struggles) rather than asking "where does this facet genuinely surface at lower energy?"
5. **Why is the catalog a first-order dependency?** → The unified five-term scorer formula amplifies catalog properties: three of five terms (energyMalus, conversationSkew, adjacency) consume catalog fields directly. Catalog quality IS scorer quality.

**Root cause:** The catalog was designed for a different system (discrete DRS steering with LLM-led topic selection). The new system (continuous unified scorer with computed adjacency) has fundamentally different requirements that the catalog was never designed to meet.

### Contributing Factors

- **No empirical data** — no real conversations have been run, so facet yield accuracy is untested
- **Clinical association bias** — facets were mapped to territories based on where they "should" appear psychologically, not where they actually surface in casual conversation
- **Domain taxonomy designed for humans** — 5 steerable domains are a useful mental model but create a coarse Jaccard space with only a few possible similarity values (0, 1/3, 1/2, 2/3, 1)

### System Dynamics

**Positive feedback loop:** Scorer amplifies catalog bias → conversations feel samey → users disengage → data quality drops → portrait quality drops → product trust erodes. The catalog is the leverage point — fixing it at the source prevents the loop from starting.

**Negative feedback loop (self-correcting):** coverageGain naturally declines as facets are scored → scorer shifts to unvisited territories → diversity emerges even from imperfect topology. This means catalog imperfections are partially self-healing through the coverage mechanism.

**Key dynamic:** The catalog doesn't need to be perfect. It needs to be good enough that the scorer's self-correcting mechanisms (coverageGain decline, freshnessPenalty, energyMalus) can compensate for remaining imperfections. The elicitation work brought the catalog to that threshold.

---

## 📊 ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**
- Scorer implementation is blocked without type migration — team urgency
- Complete formula specification exists with clear catalog requirements
- Existing test infrastructure supports rapid validation
- Pure domain layer change — no infrastructure, no API, no frontend
- All 25 territories designed with opener-cost calibration rule — defensible v1 values

**Restraining Forces (Blocking Solution):**
- 39 files reference `energyLevel` — migration has blast radius
- No empirical validation possible until real conversations run
- Relationships domain at 60% may create systemic adjacency bias
- Energy values are educated guesses — will need recalibration post-launch
- 3 new territories need openers validated by conversational testing

### Constraint Identification

**Primary constraint:** No empirical data. Every energy value, domain tag, and facet assignment is based on reasoning, not measurement. The catalog must be good enough to ship, with monitoring that enables rapid calibration from real session data.

**Secondary constraint:** The migration must be atomic — `energyLevel` and `expectedEnergy` cannot coexist. All consumers must be updated in one pass.

**Assumed constraints that are actually flexible:**
- "All 30 facets must be reachable at medium energy" — relaxed to "depression accepted as heavy-only"
- "≥6 territories per domain" — met for all domains, but the number was aspirational, not derived from formula requirements

### Key Insights

1. **Catalog quality is architecture.** The scorer formula amplifies whatever the catalog says. Three of five scorer terms consume catalog fields directly. This makes the catalog a first-order architectural concern, not a data entry task.

2. **The opener-cost rule is the single most important calibration principle.** Scoring based on "what does a genuine first answer cost" prevents every form of inflation (importance bias, depth potential, trait association). It keeps values stable and honest.

3. **Create territories to fill gaps, don't force facets onto existing ones.** Adding anger to work-dynamics (honesty: 0.7) is worse than creating daily-frustrations (honesty: 1.0). New territories that genuinely belong are cleaner than overloaded existing ones.

4. **Energy ordering within clusters prevents flat cycling.** Same-domain-pair clusters are acceptable when their members span a wide energy range. The scorer differentiates via energyMalus even when adjacency is identical.

5. **The catalog affords a natural three-act session arc.** Light territories (9) dominate Act 1, medium (10) form Act 2 corridors, heavy (6) converge in Act 3. This happens from energy distribution alone, before conversationSkew.

---

## 💡 SOLUTION GENERATION

### Methods Used

The solution emerged through iterative elicitation rather than traditional brainstorming:

1. **Pre-mortem Analysis** — identified 6 failure scenarios (leisure trap, family island, crude band collapse, Neuroticism desert, work-solo echo, energy cliff)
2. **First Principles Analysis** — defined expectedEnergy as opener-cost (not depth, not importance, not yield)
3. **Self-Consistency Validation** — 3 independent calibration methods converged on v1 values
4. **Comparative Analysis Matrix** — weighted scoring for domain re-tags and new territory evaluation
5. **What If Scenarios** — 4 user archetypes stress-tested the catalog (guarded, over-sharer, perpetually low-energy, skeptic)
6. **Red Team vs Blue Team** — adversarial review caught leisure counting error, relationships flood risk, depression structural irony
7. **Critique and Refine** — identified 6 document inconsistencies and missing elements
8. **Graph of Thoughts** — topology visualization revealed three corridors, bridge territories, and cul-de-sac structure

### Generated Solutions

See Problem Definition sections: Pre-mortem Findings, First Principles, Self-Consistency Validation, Comparative Analysis Matrix, Topology Analysis. Each elicitation round generated and evaluated specific solutions that were progressively integrated.

### Creative Alternatives

- **Weighted Jaccard** — inverse-frequency weighting to dampen relationships superhighway. Deferred to scorer implementation as a coefficient change, not a catalog change.
- **3-domain territories** — rejected (creates universal bridges that dominate transitions).
- **Depression at medium energy** — rejected (no honest medium-energy home; "still emerging" is the principled answer).
- **Separate expectedEnergy and narrativeDepth fields** — deferred to v2 if conversationSkew needs to be split from energy cost.

---

## ⚖️ SOLUTION EVALUATION

### Evaluation Criteria

| Criterion | Weight | Description |
|---|---|---|
| Narrative honesty | 0.30 | Every domain tag, energy value, and facet assignment genuinely fits the territory |
| Scorer compatibility | 0.25 | The catalog produces reasonable scorer rankings across user archetypes |
| Structural health | 0.20 | No cluster traps, no islands, all zones reachable |
| Implementation simplicity | 0.15 | Minimal blast radius, atomic migration, clear test coverage |
| Future calibration surface | 0.10 | Values are easily adjustable without architectural changes |

### Solution Analysis

The recommended solution was the only candidate that survived all 8 elicitation rounds. Alternatives were rejected at specific stages:

- Crude band mapping (all light = 0.3) — rejected by pre-mortem (failure #3)
- Energy manipulation (lower heavy territories to fix Neuroticism) — rejected by design principle ("don't lie about what the territory is")
- Facet additions to existing territories — rejected in favor of new territories (honesty scores too low)
- learning-curiosity domain change — rejected by red team (re-creates leisure-solo cluster)

### Recommended Solution

**25-territory catalog with continuous expectedEnergy, 8 domain re-tags, 3 new territories.** See Consolidated Final Catalog in Problem Definition for the complete specification.

### Rationale

1. **Type migration** unblocks Phase 1 Step 1 — the hard blocker
2. **Opener-cost calibration** produces defensible v1 values that survived 3-method cross-validation
3. **Domain re-tags** eliminate all 4 original cluster traps while maintaining narrative honesty (scored 0.56-0.81 on weighted matrix)
4. **New territories** solve structural gaps (anger access, family peninsula, family-leisure bridge) through honest territory design, not forced facet additions
5. **Structural validation** passes all 3 checks (reachability, facet coverage 29/30, no new cluster traps)
6. **Topology** shows three natural corridors with bridge territories connecting them — the catalog has local coherence, not random coverage

---

## 🚀 IMPLEMENTATION PLAN

### Implementation Approach

**Atomic migration, bottom-up.** All changes ship together — no intermediate state where `energyLevel` and `expectedEnergy` coexist. Start with the type definition, propagate to catalog, update tests, then clean up all consumers.

### Action Steps

**Step 1 — Type Migration**

- [ ] In `packages/domain/src/types/territory.ts`:
  - Remove `ENERGY_LEVELS` const and `EnergyLevel` type
  - Replace `energyLevel: EnergyLevel` with `expectedEnergy: number` in `Territory` interface
  - Add JSDoc: "Energy cost of genuine engagement, [0,1], same axis as E_target"

- [ ] In `packages/domain/src/constants/territory-catalog.ts`:
  - Update `territory()` helper: replace `energyLevel` parameter with `expectedEnergy: number`
  - Remove all section comments referencing "Light-Energy", "Medium-Energy", "Heavy-Energy"
  - Reorder territories by expectedEnergy ascending (replaces band grouping)

**Step 2 — Catalog Content Update**

- [ ] Update all 22 existing territory definitions with:
  - `expectedEnergy` values from the calibration table
  - Domain changes for 8 re-tagged territories
  - Remove `energyLevel` field from each entry

- [ ] Add 3 new territory definitions:
  - `daily-frustrations`: {relationships, work}, 0.38, [anger, cooperation, self_consciousness, assertiveness]
  - `growing-up`: {family, solo}, 0.45, [emotionality, trust, imagination, dutifulness]
  - `family-rituals`: {family, leisure}, 0.28, [dutifulness, cheerfulness, cooperation, morality]

- [ ] Remove `COLD_START_TERRITORIES` constant — replaced by dynamic territory selector

**Step 3 — Test Updates**

- [ ] Update `packages/domain/src/constants/__tests__/territory-catalog.test.ts`:
  - Update territory count assertion: 22 → 25
  - Replace `energyLevel` assertions with `expectedEnergy` range checks (0 < e < 1)
  - Add test: all territories have 1-3 domains
  - Add test: all territories have 3-6 expected facets
  - Add test: all 30 facets appear in at least one territory
  - Add test: no single-domain territories remain (all have ≥2 domains)
  - Remove any tests referencing `EnergyLevel` or `COLD_START_TERRITORIES`

- [ ] Update `packages/domain/src/types/__tests__/territory.test.ts`:
  - Remove `EnergyLevel` type tests
  - Add `expectedEnergy` field type test

**Step 4 — Consumer Cleanup**

- [ ] Find all references to `energyLevel`, `EnergyLevel`, `ENERGY_LEVELS`, `COLD_START_TERRITORIES` across the codebase (39 files identified in prior analysis)
- [ ] For each consumer:
  - If it reads `energyLevel` for display/logging: replace with `expectedEnergy`
  - If it uses `EnergyLevel` as a type: remove the import
  - If it references `COLD_START_TERRITORIES`: remove the import and reference
  - If it uses energy bands for conditional logic (e.g., `if energyLevel === "light"`): replace with continuous range checks or remove if the scorer replaces the logic
- [ ] Run `pnpm lint` and `pnpm build` to catch any remaining references

**Step 5 — Export Updates**

- [ ] Update `packages/domain/src/index.ts` exports:
  - Remove: `EnergyLevel`, `ENERGY_LEVELS`, `COLD_START_TERRITORIES`
  - Keep: `Territory`, `TerritoryId`, `TerritoryIdSchema`, `TERRITORY_CATALOG`, `getTerritoryById`
- [ ] Verify no downstream packages import removed types

### Timeline and Milestones

| Milestone | What it proves |
|---|---|
| Territory type compiles with `expectedEnergy` | Type migration is sound |
| All 25 catalog entries pass validation | Catalog content is correct |
| `territory-catalog.test.ts` green | Structural invariants hold (facet coverage, domain coverage, energy bounds) |
| Zero references to `energyLevel` / `EnergyLevel` / `COLD_START_TERRITORIES` in codebase | Clean migration, no legacy |
| `pnpm build` and `pnpm lint` pass | No type errors across monorepo |
| `pnpm test:run` passes | No regressions |
| **Migration complete** | **Phase 1 Step 1 of territory scorer unblocked** |

### Resource Requirements

**Files modified:**
- `packages/domain/src/types/territory.ts` — type definition
- `packages/domain/src/constants/territory-catalog.ts` — catalog content
- `packages/domain/src/constants/__tests__/territory-catalog.test.ts` — test updates
- `packages/domain/src/types/__tests__/territory.test.ts` — type tests
- `packages/domain/src/index.ts` — export cleanup
- ~39 consumer files — `energyLevel`/`EnergyLevel`/`COLD_START_TERRITORIES` references

**Files created:** None (all changes are modifications to existing files).

**Dependencies:** None. Pure domain layer, no new packages.

### Responsible Parties

- **Catalog migration:** Dev agent (implementation)
- **Energy value review:** Product owner (Vincentlay) — v1 values are set, but post-launch recalibration decisions are product calls
- **Scorer integration:** Separate Phase 1 effort — consumes the migrated catalog

---

## 📈 MONITORING AND VALIDATION

### Success Metrics

**Pre-deployment (testable immediately):**

| Metric | Target | How to measure |
|---|---|---|
| All territories have `expectedEnergy` in (0, 1) | 25/25 | Unit test assertion |
| All territories have ≥2 domains | 25/25 | Unit test assertion |
| All 30 facets covered | 30/30 | Unit test: facet → territory mapping |
| No single-domain territories | 0 | Unit test assertion |
| Zero references to removed types | 0 hits | `grep -r "energyLevel\|EnergyLevel\|ENERGY_LEVELS\|COLD_START_TERRITORIES"` |
| Build passes | Green | `pnpm build` |
| Tests pass | Green | `pnpm test:run` |

**Post-deployment (requires running scorer — deferred):**

| Metric | Target | How to measure |
|---|---|---|
| Territory diversity per session | ≥5 distinct in 25 turns | Log analysis |
| Domain coverage per session | ≥4 of 5 domains touched | Log analysis |
| Family zone visited | ≥1 family territory per session | Log analysis |
| No cluster trapping | <3 consecutive turns in same-domain-pair cluster | Log monitoring |
| Relationship territory % | <70% of turns | Log analysis |
| Energy coherence | Mean energyMalus < 0.1 per session | Log analysis |

### Validation Plan

**Tier 1: Unit validation (this migration)**
- Type compiles, catalog validates, tests green, build passes, no legacy references

**Tier 2: Scorer validation (Phase 1 Steps 2-3)**
- Scorer term functions consume the new catalog fields correctly
- Simulation scenarios produce expected rankings with calibrated energy values
- Stress tests verify edge cases (cold start, drained user, late session)

**Tier 3: Integration validation (Phase 2)**
- End-to-end with `MOCK_LLM=true`: scorer → selector → Move Governor
- Score vectors appear in structured logs
- Territory selection diversity meets targets

**Tier 4: Empirical calibration (post-launch)**
- 5-10 real conversations with log analysis
- Compare observed facet yields vs expected facets per territory
- Compare observed energy cost vs expectedEnergy values
- First recalibration pass on high-variance territories (social-dynamics, opinions-and-values, team-and-leadership)

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Energy values are wrong | High (no empirical data) | Medium — scorer produces suboptimal rankings | Values are easily adjustable in catalog. Monitoring + 5-10 real sessions → first recalibration. |
| Domain re-tags create unexpected scorer behavior | Low-Medium | Medium — transitions feel unnatural | Structural validation passed 3 checks. Deferred validation (escape velocity, selection heatmaps) catches runtime issues. |
| New territory openers don't work conversationally | Medium | Low — openers are easy to revise | Test with mock conversations before real users. Opener is a string, not architecture. |
| Consumer cleanup misses a reference | Low | Low — compiler catches type errors | `pnpm build` across monorepo. Grep for removed type names. |
| Relationships flood (60% adjacency bias) | Medium | Medium — conversations feel samey | Monitor relationship-territory %. If >70%, implement weighted Jaccard in scorer-config.ts. |
| Depression gap causes thin portraits for low-energy users | Medium | Low-Medium — portrait says "still emerging" | ConversAnalyzer picks up incidental signal. Consider adding depression to emotional-awareness in v2 if empirical data shows consistent gaps. |

### Adjustment Triggers

| Trigger | Signal | First Action |
|---|---|---|
| Scorer rankings feel wrong | Manual review of score vectors shows unexpected winners | Check energyMalus — most likely w_e or expectedEnergy needs adjustment |
| Transitions feel jarring | Low adjacency scores on observed transitions | Review domain tags — may need a bridge territory or adjacency weight change |
| Family never visited | <50% of sessions touch family zone | Lower growing-up energy (0.45 → 0.40) or add family domain to another medium territory |
| Leisure cluster traps | >3 consecutive turns in leisure-solo territories | Verify coverageGain decline rate — may need steeper drop for leisure facets |
| One territory dominates | Same territory selected >3x across different sessions | Check if it's a "safe winner" with moderate adjacency to everything — may need domain specificity |
| Energy values cluster wrong | Multiple territories with nearly identical scores | Spread expectedEnergy values further within bands |

---

## 📝 LESSONS LEARNED

### Key Learnings

1. **The catalog is the formula's ground truth.** Three of five scorer terms consume catalog fields directly. Getting the catalog right is not a data task — it's an architectural task. This was lesson #6 from the territory policy session, now proven through systematic analysis.

2. **Opener-cost is the right calibration axis.** Defining expectedEnergy as "what does a genuine first answer cost" prevented every form of inflation — importance bias, depth potential, trait association, late-session resonance. It produced values that three independent methods converged on.

3. **Create territories to fill gaps, don't force facets onto existing ones.** The daily-frustrations territory (honesty: 1.0) is better than adding anger to work-dynamics (honesty: 0.7). New territories that genuinely belong are cleaner than overloaded existing ones.

4. **Domain topology has emergent structure.** The three corridors (introspective, interpersonal, achiever) and the three-act energy arc weren't designed — they emerged from honest domain tagging and energy calibration. This is a sign that the catalog's local coherence is real, not forced.

5. **Pre-mortem and red team catch different things.** Pre-mortem found the Neuroticism desert and family island (design gaps). Red team found the leisure counting error and relationships flood (implementation bugs and systemic risks). Both are necessary.

6. **"Don't lie about what the territory is" is a load-bearing principle.** It prevented energy manipulation, forced facet additions, and artificial domain changes. Every time we were tempted to game the math, this principle redirected toward a cleaner solution.

### What Worked

- **Multi-method energy calibration** — opener-cost (primary) + 4-dimension scoring (challenge) + anchor-ladder (sanity check). Three lenses catching each other's biases.
- **Weighted scoring matrix for domain changes** — narrative honesty (0.5) + connectivity gain (0.3) + cluster-breaking (0.2) made each re-tag decision traceable and defensible.
- **Structural validation before committing** — the 3-check protocol (reachability, facet coverage, cluster detection) caught the leisure counting error before it shipped.
- **External agent review** — challenged Method C independence, proposed weighted Jaccard, caught emotional cost underweighting. Independent perspective broke groupthink multiple times.
- **Iterative elicitation chain** — each method built on the previous (pre-mortem → first principles → calibration → analysis → scenarios → red team → critique → topology). No single method would have caught everything.

### What to Avoid

- **Don't average independent methods equally when they're not equally independent.** Method C (ranking) was the same intuition as Methods A and B dressed differently. Treating it as equal evidence inflates confidence.
- **Don't optimize for spreadsheet metrics.** "≥6 territories per domain" was useful as a target but almost led to forcing learning-curiosity into a 3-domain territory. The right test is structural (reachability, escape velocity), not counting.
- **Don't add mechanisms to fix mechanisms.** The temptation to add depression to a medium territory "just to close the gap" would have created an artificial territory. The "still emerging" portrait framing is the honest answer.
- **Don't treat the domain graph as a behavioral predictor.** Adjacency is one of five scorer terms. Corridors and bridges describe topology, not conversation paths. The scorer's actual behavior depends on all terms interacting.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
