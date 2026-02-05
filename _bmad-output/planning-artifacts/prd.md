---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02-advanced-elicitation", "step-02-party-mode", "step-03-success", "step-e-01-discovery", "step-e-02-review", "step-e-03-edit"]
inputDocuments:
  - "brainstorming-session-2026-01-29.md"
  - "CLAUDE.md"
  - "prd-validation-report-2026-02-02.md"
workflowType: 'prd'
lastEdited: '2026-02-02'
editHistory:
  - date: '2026-02-02T14:30:00Z'
    changes: 'Priority 2 Fixes: Replaced 5 subjective NFRs with measurable criteria, Added Web Application Requirements section (browser matrix, responsive design, SEO, accessibility), Abstracted technology names (TanStack/React/Node.js → capability descriptions), Fixed FR format for FR1/2/3/6/8/26'
    reason: 'Address warning-level validation issues for quality improvement'
  - date: '2026-02-02T13:00:00Z'
    changes: 'Added Executive Summary (vision, goals, metrics), Added User Journeys section (3 B2C journeys), Reclassified Infrastructure FRs (FR20, FR24-26)'
    reason: 'Fix critical structural gaps identified in validation report'
brownfield: true
brainstormingCount: 1
researchCount: 0
projectDocsCount: 2
classification:
  projectType: web_app
  domain: psychology_assessment
  complexity: high
  projectContext: brownfield
  businessStrategy: "B2C-first (B2B optionality for startups)"
  fundingApproach: "Self-funded MVP → Pre-seed if successful"
  complexityDrivers:
    - "Multi-region privacy compliance (GDPR, CCPA, worldwide)"
    - "Real-time streaming requirements (low-latency LLM responses)"
    - "Conversational AI assessment methodology (novel approach)"
    - "Extended session engagement (30+ min minimum, UX-first)"
    - "LLM cost control at scale (self-funded constraint)"
    - "Foundation for scientific validation (future improvement)"
  targetMarkets:
    - "B2C (primary): Individuals globally seeking personality insight"
    - "B2B (secondary): Startups using platform organically"
    - "Geographic: EU, US, Asia (worldwide)"
  userEngagementStrategy: "UX-first, minimize chat duration, keep engagement high"
  validationApproach: "User engagement focused now, scientific validation improvement later"
  dataStrategy: "Conversation data as competitive moat (training models, market insights)"
  privacyApproach: "Privacy-first, explicit user control, zero discovery (profiles not searchable)"
  shareableProfilesDay1: true
  profileShareMechanism: "User generates unique link, explicitly shares (copy/paste), no directory listing"
  realtimeRequirement: true
  minSessionDuration: "30 minutes"
  mvpTarget: "500 beta users, validate cost model + product-market fit"
  day1Features:
    - "Conversational Big Five assessment with Nerin (excellence is moat)"
    - "Shareable profiles (LinkedIn-style sharing, viral growth)"
    - "Privacy controls (default private, explicit sharing only)"
    - "Export conversation to PDF (data ownership + trust)"
    - "Real-time streaming responses (engagement)"
    - "All 30 facets with simplified archetype variants"
  scientificPositioning: "Market existing Big Five research, not original validation study"
  mvpArchetype: "Simplified variant count while preserving all 30 facets"
  mvpElectricSQL: "Server-side session management for MVP (Phase 1), ElectricSQL local-first sync deferred to Phase 2 for enhanced offline capability"
  mvpCompliance: "Privacy-first (default), detailed GDPR/CCPA Phase 2-3 (not MVP)"
  conversionHistory: "Keep forever for MVP, review retention policy post-launch"
  launchGeography: "US first, add EU/Asia after PMF validation"
---

# Product Requirements Document - big-ocean

**Author:** Vincentlay
**Date:** 2026-01-29
**Project Type:** Brownfield (Existing monorepo infrastructure)
**Frontend App:** apps/front (Interactive full-stack framework with server-side rendering)
**Backend App:** apps/api (Backend service with functional programming runtime and multi-agent orchestration)

---

## Critical Success Criteria & Risk Mitigation

Based on Pre-mortem Analysis, these requirements are **non-negotiable** for platform success:

### 0. LLM Cost Control (HIGHEST PRIORITY - Funding Constraint)
**What Could Fail:** LLM costs explode before product gains traction. Self-funded runway exhausted before product-market fit.

**Critical Cost Realities:**
- Claude 3.5 Sonnet: ~$0.10 per assessment session (30-min conversation at ~15k tokens)
- 1,000 users = $100/day = $3,000/month in LLM costs alone
- 10,000 users = $1,000/day = $30,000/month (unaffordable at B2C freemium pricing)
- **Break-even:** ~500-1000 paying users at $5/month each before costs exceed revenue

**Mandatory Cost Control Architecture:**
- ✅ Smart caching: Cache common Nerin responses, reuse for similar users (reduce 30-50%)
- ✅ Rate limiting: 1 assessment per user per day, 1 resume per week (prevent abuse/spam)
- ✅ Tiered LLM quality: Free tier uses cheaper model (GPT-3.5), Premium uses Claude
- ✅ Batch processing: Analyzer creates facet evidence per message; Scorer aggregates every 3 messages (batched, non-blocking)
- ✅ Circuit breakers: Auto-disable Nerin if cost/day exceeds cap, show graceful degradation
- ✅ Cost monitoring: Real-time dashboard tracking spend per user, per feature
- ✅ User cap: Scale gradually (500 → 2000 → 10k) as cost optimization improves

**Funding Strategy:**
- Phase 1 (Self-funded MVP): 500 beta users, validate cost model + product-market fit
- Phase 2 (If successful): Seek pre-seed funding to scale to 10k users + improve cost efficiency
- Phase 3 (If needed): Pivot to B2B startups for higher revenue/lower user count

---

### 1. Scaling (Second Priority)
**What Could Fail:** Platform melts at 50k concurrent users. Database queries timeout (separate from LLM cost).

**Prevention Requirements:**
- ✅ Real-time SLA: Nerin responses < 2 seconds (P95) for user engagement
- ✅ LLM cost budgeting with rate limiting + per-user cost caps
- ✅ Database query optimization + indexing strategy from day 1
- ✅ Load testing at 10k, 50k, 100k concurrent users before launch
- ✅ Caching strategy for common conversation patterns (reduce LLM calls)
- ✅ Cost monitoring dashboard + automatic alerts for overspending
- ✅ Graceful degradation when LLM unavailable (cached responses, fallback)

### 2. Business Model (Second Priority) - B2C First with B2B Optionality
**Strategy:** Launch B2C-first to popularize Big Five model, collect valuable conversation data, validate product-market fit. B2B (especially startups) enabled but not primary focus initially.

**Why B2C-First:**
- ✅ Market education: Conversational Big Five assessment as differentiation vs. static questionnaires
- ✅ Data advantage: B2C conversation data trains better models, proprietary moat
- ✅ Faster feedback: B2C users provide rapid iteration signal
- ✅ Lower compliance: Individual consent vs. enterprise multi-stakeholder complexity
- ✅ Network effects: Shareable profiles create viral growth + recruitment discovery

**Primary Revenue Model: B2C (Individual Users - Not Retention-Based)**
- ✅ Free tier: Unlimited personality assessment + basic profile + shareable link
- ✅ Merch + affiliate: Revenue from personality-themed merchandise (t-shirts, mugs, etc.)
- ✅ Coaching partnerships: Revenue share on referred coaching (post-assessment upsell)
- ✅ Subscription (optional future): "$10-20/month to continue conversations with Nerin" (deeper self-discovery coaching)
  - **Note:** Not about user retention loops, but about users who want ongoing dialogue/coaching

**Why Not Retention-Focused:**
- Users take assessment once (30 min), share profile, recommend friends (viral growth)
- Retaining users daily/weekly doesn't fit the psychology product model
- Exception: B2B managers need repeated access to team personality data

**Secondary Revenue Model: B2B (Startups + SMBs - Phase 2-3)**
- ✅ Team plans: Startups can assess teams for free/low-cost (build habit before enterprise)
- ✅ Recruitment tools: Startup HR uses shareable profiles to evaluate candidates
- ✅ Not initial focus: Complex enterprise features (SSO, HIPAA, multi-region compliance) are post-launch

**Critical Constraint: LLM Cost Optimization**
- ⚠️ **Highest Risk:** Nerin (Claude Sonnet API) cost scales linearly with users
- ✅ **Realistic Cost Budgeting:**
  - Pure API cost: ~$0.06-$0.08 per 30-min assessment (Sonnet pricing: ~$3/1M input tokens, ~$15/1M output tokens)
  - Add infrastructure overhead (monitoring, retries, error handling): +$0.04-$0.07
  - **Realistic total: $0.12-$0.15 per assessment**
  - **Optimization target: $0.10** (via caching, prompt optimization, batch processing)
- ✅ Cost control mechanisms (CRITICAL):
  - Rate limiting: Max 1 assessment per user per day (prevent abuse)
  - Caching: Store common conversation responses (reduce API calls 20-40%)
  - Cost caps: Alert when LLM spend exceeds thresholds
  - Prompt optimization: Minimize tokens while maintaining quality
  - Batch processing: Off-peak LLM processing for lower cost
  - User cap strategy: Scale gradually (500 → 1k → 5k as optimization improves)

**Data Architecture for Business Model:**
- ✅ Conversation history preserved forever (MVP) (valuable for product improvement + coaching insights)
- ✅ Facet scoring: 100-point precision in database for analytics + scientific integrity
- ✅ UI simplification: Display 3 trait levels (low/mid/high) + 2 facet levels for readability
- ✅ Shareable profiles: Users generate unique link (LinkedIn-style), not discoverable/searchable
- ✅ A/B testing framework for B2C funnel optimization
- ✅ Analytics: Track which conversation patterns → merch purchases, coaching conversions, sharing behavior

### 3. User Experience (Third Priority)
**What Could Fail:** 70% drop-out rate during 30-min assessment. Users feel judged. No progress visibility.

**Prevention Requirements:**
- ✅ Progress indicator: "You're 45% through this assessment" (psychological impact)
- ✅ Trait framing strategy: No negative language, all traits presented as strengths + context
- ✅ Orchestrator prevents repetitive questions (tracks conversation domain coverage)
- ✅ Real-time streaming responses (Nerin) keep users engaged
- ✅ Session resumption: Users can pause and return without losing context
- ✅ Mobile-first, responsive UI for 30+ minute engagement
- ✅ **DAY-1 FEATURE: Shareable profiles** (viral growth lever, privacy-controlled)
  - Users generate unique public profile link (shareable on LinkedIn, job applications, social)
  - Profile shows: Trait summary (3-level), archetype + visual, top facet insights
  - Privacy control: Profiles are NOT discoverable/searchable—only accessible via explicit link
  - No profile listing, no user directory—complete privacy by default
- ✅ **Export conversation to PDF:** Users can download full assessment conversation + insights

### 4. Privacy & Data Protection (BLOCKER #1 - Highest User Concern)
**What Could Fail:** User trust eroded by privacy leaks. Employer/recruiter sees assessment without consent. Public assumes data is sold/shared.

**Core Privacy Principle: Explicit User Control**
- ✅ **Zero public discovery:** Profiles are NOT searchable, NOT discoverable, NOT in directories
- ✅ **Explicit sharing only:** Users must deliberately generate + share profile link (copy/paste to LinkedIn, email, etc.)
- ✅ **No employer visibility:** Unless user explicitly shares, employers/recruiters have zero access
- ✅ **Conversation privacy:** Full conversation stored encrypted, never shared or analyzed without user consent
- ✅ **Data ownership:** Users own their conversation data, can export to PDF anytime

**Technical Privacy Requirements:**
- ✅ End-to-end encryption for all sensitive data (transport + at-rest)
- ✅ Conversation logs encrypted in database, decrypted only for user
- ✅ No inference/profiling: Conversation data NOT used for training without explicit consent
- ✅ Comprehensive audit logs for all data access (who accessed what, when)
- ✅ Third-party security vetting (LLM API provider, database vendor)
- ✅ Regular security audits + annual penetration testing
- ✅ User data breach response plan (24-hour notification)
- ✅ GDPR/CCPA compliant: Right to deletion, right to data portability, right to object

**User Trust Signals (Marketing/Product):**
- ✅ Privacy policy in plain language (not legal jargon)
- ✅ "Your profile is private by default" (visible in UI, not hidden in settings)
- ✅ Data retention policy explicit (conversation kept X years, then deleted)
- ✅ Opt-in for analytics (allow us to study conversation patterns for product improvement)

### 5. Compliance & Governance (Fifth Priority)
**What Could Fail:** GDPR violation + regulatory fines. Platform shut down by authorities.

**Prevention Requirements:**
- ✅ Data governance framework: Assessment data classified as sensitive personal data
- ✅ Data deletion/portability mechanisms (GDPR Article 17, 20, CCPA 1798.100) built-in day 1
- ✅ Cross-border data transfer agreements (EU, US, Asia) before expansion
- ✅ Consent flows: Explicit opt-in for assessment participation + conversation data storage + analytics
- ✅ Data retention policies by region/jurisdiction (e.g., EU: delete after 3 years if inactive)
- ✅ Legal review before any new market expansion or data use
- ✅ Privacy by design principle in all architectural decisions
- ✅ DPA (Data Processing Agreement) ready for B2B use (startups/companies)

---

## Product Differentiation: Conversational Depth vs. Predefined Boxes

**The Insight:** Personality tests have been oversimplifying users for decades through predefined questionnaires that force people into rigid boxes. Professionals and thoughtful people are frustrated by assessments that can't capture their complexity.

**big-ocean's Answer:** Conversational depth through dialogue, not predefined boxes through questions.

**Why This Matters:**
- MBTI/16Personalities: "Are you more introverted or extroverted?" → Forces binary choice → Oversimplification
- big-ocean: Nerin explores context, nuance, contradictions → Captures complexity → Users feel genuinely understood
- **User consequence:** Professionals who've dismissed personality tests suddenly find one that works ("Finally, something that actually gets me")
- **Business consequence:** These users are MORE likely to share because they're solving a real pain point

**Target Audience:** Professionals, thoughtful individuals, anyone frustrated by personality test oversimplification

**Competitive Advantage:**
- Not "better MBTI" (which is a losing game)
- But "fundamentally different category" (conversational depth)
- This justifies 15% sharing rate target (vs. 5% if you were just a competitor to MBTI)

**OCEAN Archetype System (Second Layer of Differentiation):**
- **MBTI:** 16 fixed personality types (forced categorization)
- **big-ocean OCEAN (POC):** 81 unique personality combinations (4 traits × 3 levels), expandable to 243 post-validation
- **User outcome:** Instead of "I'm an INTJ" (1 of 16 boxes), users get "I'm The Strategist" with a unique 4-letter code + trait description capturing their specific personality
- **Shareability:** Memorable character archetypes (The Catalyst, The Architect, The Maverick) are inherently more shareable than "INTJ" codes
- **Scientific integrity:** Grounded in Big Five research with detailed trait descriptions (not arbitrary personality mythology)
- **Pragmatic POC approach:** Validate concept with 81 combinations + ~30 hand-curated names; expand to full 243 if metrics justify post-launch curation effort

---

## Positioning: Why Big Five > MBTI (Without Original Research)

**The Reality:**
- MBTI: Invented 1940s, no peer-reviewed validation, ~70% test-retest reliability
- Big Five: 40+ years peer-reviewed research, consistently validated across cultures, ~80%+ reliability

**Your Marketing Angle (Not New Research):**
- ✅ "Big Five is scientifically validated. MBTI is a myth people believe."
- ✅ Link to existing research (Costa & McCrae, Goldberg, academic publications)
- ✅ Position conversational assessment as MORE accurate than MBTI questionnaires (psychology fact)
- ✅ Show Big Five used by: psychologists, researchers, recruiters, organizations (vs. MBTI's pop-culture use)

**In Your Messaging:**
- "Based on 40+ years of peer-reviewed research, not personality folklore"
- "Used by psychologists and researchers worldwide"
- "More accurate than personality quizzes because we assess through conversation, not binary choices"

**Note:** You don't need to publish original research. Users can look up Big Five science themselves. Your value is conversational assessment methodology, not scientific validation (which exists).

---

## Data Architecture & Scoring Model

**Dual-Layer Scoring System (Critical for Business Model):**

### OCEAN Archetype System (Competitive Differentiator)

The OCEAN system transforms raw Big Five trait scores into memorable, shareable character archetypes that drive user engagement and viral sharing. Unlike MBTI's fixed 16 types, OCEAN generates **81 unique personality combinations in POC scope** (expandable to 243 post-validation) that feel personal while remaining scientifically grounded.

**POC Strategy:** Store all 5 Big Five traits (OCEAN) with full precision, but use only 4 traits (OCEA) for archetype naming to reduce sensitivity concerns while maintaining complete data. Archetype names serve as memorable identity anchors (e.g., "The Catalyst"), while detailed trait descriptions carry the psychological accuracy. This separation allows us to validate concept viability without perfecting all 243 names upfront.

#### Main Archetype (5-Letter OCEAN Code + 4-Letter Naming)

**Data Storage:** All 5 Big Five traits collected and stored

| Trait | Low | Mid | High |
|-------|-----|-----|------|
| **Openness** | **P**ractical | **R**eflective | **I**maginative |
| **Conscientiousness** | **E**asygoing | **P**urposeful | **D**isciplined |
| **Extraversion** | **I**ntrovert | **A**mbivert | **E**xtravert |
| **Agreeableness** | **A**ssertive | **M**oderate | **C**ompassionate |
| **Neuroticism** | **G**rounded | **R**esponsive | **P**assionate |

**Archetype Naming (POC Scope):** Only 4 traits used for character archetype name generation (dropping Neuroticism)

| Trait | Low | Mid | High |
|-------|-----|-----|------|
| **Openness** | **P**ractical | **R**eflective | **I**maginative |
| **Conscientiousness** | **E**asygoing | **P**urposeful | **D**isciplined |
| **Extraversion** | **I**ntrovert | **A**mbivert | **E**xtravert |
| **Agreeableness** | **A**ssertive | **M**oderate | **C**ompassionate |

**Result:**
- **Main OCEAN Code:** 5-letter (e.g., PRIAGG) representing all 5 traits
- **Archetype Name:** Based on 4-letter subset (e.g., PRIA) = **81 unique combinations** for POC

**Phase 2 (Post-Validation):** Extend archetype naming to include Neuroticism dimension, expanding to 243 combinations if POC validates engagement hypothesis.

**Example:** A user with Practical/Purposeful/Ambivert/Moderate scores + Grounded on Neuroticism:
- **Full OCEAN Code:** **PPAMG** (5 letters - all traits stored)
- **Archetype Name Code:** **PPAM** (4 letters - used for naming)
- **Archetype Name:** **"The Grounded Thinker"**
- **Description:** *"You approach life with practical realism, adapting easily to change while maintaining thoughtful perspectives. You navigate relationships diplomatically, finding balance without sacrificing authenticity."*

**Calculation:** At assessment end, trait scores (0-120 per trait, sum of 6 facets) map to levels: Low (0-40) → Mid (40-80) → High (80-120). First letter of each level name creates the 5-letter OCEAN code. Archetype name uses only first 4 letters (O-C-E-A).

#### Archetype Naming Philosophy: Names as Anchors, Descriptions as Truth

Rather than perfecting 243 character names upfront, we use a **two-tier approach**:

**Tier 1: Memorable Archetype Names (Identity Anchor)**
- ~25-30 hand-curated modern/creative names for POC launch (covers ~60% of common trait combinations)
- Example names: "The Catalyst," "The Architect," "The Maverick," "The Empath"
- Purpose: Give users a memorable identity label they're proud to share

**Tier 2: Component-Based Naming System (Scalability)**
- For remaining combinations, use **component-based generation**: [Trait1 Adjective] + [Trait2 Noun]
- Example: Practical + Builder = "The Pragmatist," Imaginative + Creator = "The Visionary"
- Ensures all 81 combinations have meaningful names without requiring full hand-curation

**Tier 3: Full Trait Description (Psychological Accuracy)**
- Every archetype includes a 2-3 sentence description that captures the actual trait combination
- Description is where the *meaning* lives—not the name
- Users who want accuracy read descriptions; those who want shareability use the name

**Why This Works:** The name doesn't have to perfectly capture personality—it just needs to be memorable enough to share. The description ensures users understand what their profile actually means.

#### 25 Anchor Archetypes (POC Hand-Curated)

These 25 anchor names set the tone and style for the full naming system:

| Code | Character Archetype | Trait Pattern |
|------|-------------------|----------------|
| RPAM | The Anchor | Reflective, Purposeful, Ambivert, Moderate |
| RPAC | The Bridge | Reflective, Purposeful, Ambivert, Compassionate |
| PPIM | The Maker | Practical, Purposeful, Introvert, Moderate |
| IDEC | The Catalyst | Imaginative, Disciplined, Extrovert, Compassionate |
| IDEA | The Disruptor | Imaginative, Disciplined, Extrovert, Assertive |
| PDEA | The Commander | Practical, Disciplined, Extrovert, Assertive |
| PDIC | The Architect | Practical, Disciplined, Introvert, Compassionate |
| PDIA | The Strategist | Practical, Disciplined, Introvert, Assertive |
| IDIC | The Mystic | Imaginative, Disciplined, Introvert, Compassionate |
| IEEC | The Rebel | Imaginative, Easygoing, Extrovert, Compassionate |
| IEIC | The Ghost | Imaginative, Easygoing, Introvert, Compassionate |
| IEIA | The Maverick | Imaginative, Easygoing, Introvert, Assertive |
| REEC | The Luminous | Reflective, Easygoing, Extrovert, Compassionate |
| RPIC | The Empath | Reflective, Purposeful, Introvert, Compassionate |
| IPAC | The Conductor | Imaginative, Purposeful, Ambivert, Compassionate |
| RRAM | The Curator | Reflective, Responsive, Ambivert, Moderate |
| IPAM | The Shapeshifter | Imaginative, Purposeful, Ambivert, Moderate |
| PDIA | The Operator | Practical, Disciplined, Introvert, Assertive |
| IDIC | The Alchemist | Imaginative, Disciplined, Introvert, Compassionate |
| RPIM | The Archivist | Reflective, Purposeful, Introvert, Moderate |
| PEIA | The Renegade | Practical, Easygoing, Introvert, Assertive |
| RDEC | The Beacon | Reflective, Disciplined, Extrovert, Compassionate |
| IEEC | The Wanderer | Imaginative, Easygoing, Extrovert, Compassionate |
| IDEA | The Visionary | Imaginative, Disciplined, Extrovert, Assertive |
| RPIM | The Scholar | Reflective, Purposeful, Introvert, Moderate |

**Remaining 56 combinations (POC scope):** Use component-based naming system to ensure all 81 combinations have memorable identities.

#### Detailed Archetype (Facet-Led Code - Phase 2)

After POC validation, users who want deeper insight receive facet-level codes: **XX-XX-XX-XX** (4 trait pairs). This adds nuance without overwhelming casual users.

#### Facet Names (24 Facets × 2 Levels - POC Scope)

POC includes all facets for 4 traits (24 facets total). Full table maintained in database; displayed on request only.

**Naming Principle:** All facet names frame observable behaviors as situational strengths, never as deficits. Users never see negative framings.

#### Data Flow: Trait Scores → OCEAN Code → Character Name → Description

1. **Assessment End:** Nerin conversation completes, Analyzer has created facet evidence per message, Scorer aggregates evidence into 30 facet scores (0-20), Aggregator derives 5 trait scores from facets
2. **Code Calculation:** Trait scores (4 traits) map to levels, creating 4-letter OCEAN code
3. **Name Lookup:** Code queries archetype registry (~25 curated + component-based fallback for remaining 56)
4. **Description Retrieval:** Full trait description loaded and displayed with archetype name
5. **User Presentation:** Profile displays "You are **The Catalyst**" + 4-letter code + description + optional facet breakdown
6. **Sharing:** User shares archetype name + code (e.g., "I'm The Catalyst - IDEC") with shareable profile link

**Performance:** Code calculation + name lookup + description retrieval completes in <100ms.

#### Why OCEAN Drives Engagement & Sharing

- **81 unique combinations (POC)** → Users feel individually recognized, not forced into predefined boxes
- **Memorable character names** (The Catalyst, The Architect) → Natural social proof on LinkedIn—users want to be these archetypes
- **Name + Description separation** → We can validate the concept with simpler naming, iterate on language post-POC
- **Scientific foundation** (Big Five) → Maintains credibility for B2B use cases (recruitment, team analysis)
- **Expandable to 243** → POC proves the concept; Phase 2 adds full nuance if metrics justify the effort
- **Component-based system** → Scales naming to all combinations without hand-curation bottleneck

---

### Backend Precision (Database):

**Evidence-Based Facet Scoring Architecture:**

The assessment system uses a **facet-first, evidence-based** approach where every personality insight is tied to specific conversation evidence:

1. **Facet Evidence (Atomic Level)**
   - Each message analyzed for 30 facet signals
   - **Unified FacetEvidence type:** messageId reference, facet name (clean - no trait prefix), numeric score (0-20), confidence (0.0-1.0), exact quote, character-level highlight range
   - Stored in `facet_evidence` table with indexes on messageId and facet
   - Example: User says "I love helping people" → Creates evidence record: `{ messageId: "msg_5", facet: "altruism", score: 18, confidence: 0.9, quote: "helping people", highlightRange: {start: 7, end: 21} }`

2. **Facet Scores (Aggregated Level)**
   - 30 facets scored independently (0-20 scale each)
   - Clean naming: "altruism", "imagination", "orderliness" (not "agreeableness_altruism")
   - Stored as `Record<FacetName, FacetScore>` - no redundant facet field
   - Each score includes: aggregated score, adjusted confidence, evidence array, statistics (computed on-demand: mean, variance, sampleSize)
   - Contradiction detection via variance analysis: high variance → lower confidence
   - Recency weighting: more recent messages weighted higher in aggregation

3. **Trait Scores (Derived Level)**
   - 5 Big Five traits derived from facet averages using `FACET_TO_TRAIT` lookup
   - Trait confidence = minimum confidence across contributing facets
   - Traits are computed properties, not primary data

4. **Data Storage**
   - **assessment_messages:** Complete conversation history (existing table)
   - **facet_evidence:** Per-message facet detections with evidence (NEW)
   - **facet_scores:** Aggregated scores per facet (NEW - 30 rows per session)
   - **trait_scores:** Derived trait scores (NEW - 5 rows per session)
   - **Statistics computed, not stored:** mean/variance/sampleSize calculated from facet_evidence on query

5. **Bidirectional UI Highlighting**
   - **Profile → Conversation:** Click "Altruism: 16/20" → highlights all supporting messages
   - **Conversation → Profile:** Click message → shows which facets it contributed to
   - `highlightRange` enables precise text highlighting in UI
   - Builds user trust through transparency ("show your work")

**Multi-Agent Pipeline:**

```
Analyzer (per message):
  - Detects 30 facet signals
  - Outputs numeric scores (0-20) per facet
  - Creates FacetEvidence records with messageId references
       ↓
Scorer (every 3 messages):
  - Aggregates FacetEvidence by facet
  - Detects contradictions (variance analysis)
  - Adjusts confidence based on consistency
  - Outputs Record<FacetName, FacetScore>
       ↓
Aggregator:
  - Derives 5 trait scores from facet averages
  - Uses FACET_TO_TRAIT lookup table
       ↓
Router:
  - Finds lowest-confidence facet
  - Guides Nerin with specific exploration strategy
```

**Key Benefits:**
- **Transparency:** Users see exact quotes that influenced each score
- **Scientific Validity:** Facet-level measurement aligns with Big Five research (NEO-PI-R pattern)
- **Testability:** Clear separation between per-message analysis and cross-message aggregation
- **Trust-Building:** Evidence trails enable user verification and self-reflection

### Frontend Display (UI/UX Readability):
- **Big Five traits:** 3-level display (Low/Mid/High) based on 0-120 range thresholds (sum of 6 facets)
  - Low: 0-40
  - Mid: 40-80
  - High: 80-120
- **Facets:** 2-level display (Lower/Higher) for clarity, with numeric score on hover
- **Progress indicator:** Visual trait precision (0-100%) during assessment
- **Shareable profile:** Public profile card shows traits + archetypes, optionally includes conversation insights

### Data Retention & Business Intelligence:
- ✅ Full conversation history preserved (compliance + business value)
- ✅ Conversation data used for: model training, market research, personality trend analysis
- ✅ User consent: Clear disclosure that conversation data may be used for research/analytics
- ✅ Queryable database: Companies can search assessments by trait patterns for hiring/team analytics

---

## Strategic Clarity: B2C-First Business Model Rationale

**Decision:** Launch B2C-first to popularize the model, collect conversation data, validate product-market fit. B2B features enabled later as startups discover the platform.

**Stakeholder Tensions Resolved:**
- **B2C User Needs:** Beautiful UX, affordable pricing ($0-20/mo), privacy from employers, emotional resonance
- **B2B Company Needs:** Enterprise integrations, audit logs, compliance, volume pricing
- **Technical Reality:** Building both equally from day 1 = feature complexity + slower time-to-market

**Why B2C-First Wins:**
1. **Market Education:** Conversational Big Five assessment is novel vs. static questionnaires → B2C drives adoption
2. **Data Moat:** Conversation data from 100k B2C users trains better models than questionnaire data
3. **Faster Iteration:** B2C users provide rapid feedback loops (days vs. enterprise sales cycles of 6-12 months)
4. **Lower Compliance Burden:** Individual consent vs. enterprise multi-region contracts
5. **Funding Alignment:** Self-funded MVP targets 500-1000 users before VC (B2B contracts are too slow)

**B2B Optionality (Not Initial Focus):**
- Startups can use platform cost-effectively (no SSO/HIPAA/compliance complexity)
- Shareable profiles enable passive recruitment discovery
- Post-MVP: Turn profitable B2C user base into B2B features

---

## Comparative Analysis: Success Metrics Validation

**Benchmarked Against:** 16Personalities, MBTI apps, general personality quizzes, viral coefficient research

**Key Findings:**

1. **Completion Rate (50%) = Excellent**
   - Competitors achieve 75-80% on 10-min quizzes
   - Your 30-min conversational assessment achieving 50% completion = ~70% normalized equivalence
   - Validates that longer conversations don't collapse engagement

2. **Sharing Rate (10%) = Realistic & Conservative**
   - Personality tests naturally achieve 10-20% sharing (people love sharing results)
   - Your archetype names + LinkedIn integration should drive toward 15%+
   - Increased from 5% target to 10% (more achievable given viral potential of personality content)

3. **NPS (40) = Competitive Advantage**
   - Competitors achieve 30-45 range
   - Your target of 40 = top quartile, indicates excellent product quality
   - Increased from 30 to 40 to reflect ambition + differentiation vs. MBTI/16Personalities

4. **LLM Cost ($0.10/assessment) = Sustainable**
   - At 500 users: $50/day in LLM costs
   - Justified by longer sessions (30 min) driving better engagement + sharing
   - Cost only becomes constraint if acquisition (sharing rate) is too low

**Party Mode Insights (Team Review):**
The BMAD expert team reviewed your success criteria and provided refinements:
- **Sharing Rate:** Increased from 10% to 15% to reflect confidence in conversational depth differentiation
- **LLM Cost:** Adjusted from $0.10 (optimistic) to $0.15 (realistic for Sonnet) with $0.10 as optimization target
- **NPS Measurement:** Added survivorship bias mitigation—capture sentiment from dropouts, not just completers
- **Exit Analysis:** Add where/why users abandon to improve engagement (addresses 50% non-completion)
- **Product Positioning:** Reframed as "conversational depth vs. predefined boxes" (not "better MBTI")

**Confidence Level:** ✅ HIGH - MVP success metrics are validated by industry benchmarks, expert review, and realistic for your unique 30-minute conversational model.

---

## User Focus Group Insights: B2C User Validation

**Key Findings from 5 User Personas (Maya, Alex, Jordan, Sam, Riley):**

**Blocker #1 (CRITICAL): Privacy Trust**
- Users assume "conversational assessment" = employer surveillance
- Solution: Privacy controls front-and-center, NOT discoverable unless explicitly shared
- This is more important than premium features

**User Validation Results:**
- ✅ Shareable profiles as viral growth lever (LinkedIn differentiation)
- ✅ Conversation insights as core value (not just trait scores)
- ✅ Privacy controls as #1 design priority
- ✅ Export conversation feature essential (data ownership + trust)
- ✅ Scientific credibility (Big Five > MBTI) marketing angle resonates
- ✅ Free tier adoption (Sam: "free to try, no risk")
- ✅ Manager/recruiter use case opportunity (Riley: if privacy consent clear)

**Product Implications:**
- Privacy is not a feature, it's a foundation
- "Your profile is private by default" must be visible in UI
- Shareable profiles = your B2C viral growth mechanism
- Conversation log export = trust signal + competitive advantage vs. MBTI

---

## First Principles Analysis: What Must Be True

**Fundamental Truths (Non-Negotiable):**
1. ✅ **Conversational quality is launch moat** - Nerin excellence drives engagement (30+ min conversations)
2. ✅ **Profiles must be shareable** - Easy sharing for communication + viral growth (like LinkedIn)
3. ✅ **Privacy must be default** - Users only share if they trust you with personal data
4. ✅ **Cost must be sustainable** - Provisioned/monitored, not estimated before MVP validation
5. ✅ **Target small before big** - 500 users MVP for PMF validation, then scale

**Clarifications to Business Model:**
- ❌ **NOT about user retention loops** - Users take assessment once, share profile, recommend to friends
- ✅ **Revenue from communication + merchandise** - Coaching, merchandise, deeper features (premium tiers)
- ✅ **Subscription tier optionality** - "Pay to go deeper with Nerin" (continue conversations, get coaching)
- ✅ **B2B retention is different** - Managers need repeated access to team personality data

**MVP Scope Decisions:**
- ✅ **Keep 30 facets** - Scientific integrity of Big Five framework is non-negotiable
- ✅ **Simplify archetype variants** - Reduce complexity of variant combinations while preserving all facets
- ✅ **Server-side session management for MVP** - ElectricSQL local-first sync deferred to Phase 2 (cleaner MVP scope, defer complexity)
- ✅ **Keep conversation history forever (MVP)** - Simpler for MVP, review retention policy post-launch
- ✅ **Defer compliance** - Privacy-first yes, but GDPR/CCPA detail Phase 2-3, not Phase 1
- ✅ **US launch first** - Add EU/Asia regions after PMF validation

---

## Reverse Engineering: B2C → B2B Business Model (Future State)

**Working Backwards from Success: B2B Enterprise Adoption**

### End State (January 2029): Profitable B2B Platform
```
- 50 enterprise contracts (HR departments)
- $50k-$500k per contract/year = $5-25M ARR (primary revenue)
- 100k employees assessed via company contracts
- 50k B2C individual users (secondary revenue)
- Shareable profiles enabling passive recruitment pipeline
```

### Data Requirements Architected From Day 1:

**1. B2B Features (Enterprise Value):**
- Company dashboard: Visualize team Big Five distribution
- Hiring integration: Filter candidates by trait patterns (e.g., "high conscientiousness + high openness for engineers")
- Recruitment analytics: Track which personality profiles succeed in which roles (proprietary insight)
- Employee onboarding: Batch assess new hires, identify team composition gaps
- Role fit analysis: Match employees to roles based on personality

**2. Shareable Profiles (Passive Recruitment):**
- Public profile URL: User can share "big-ocean.com/@vincentlay"
- Recruiters can view trait summary + archetype + top facets
- Candidate portfolio: Employees link assessments in LinkedIn/portfolio
- Company can analyze candidate personality before interview (de-bias hiring)

**3. Data That Must Be Captured:**
- ✅ Full 30-facet precision (0-20 scale) for nuanced hiring decisions
- ✅ Conversation history (what revealed each trait? Why did this profile emerge?)
- ✅ Domain coverage during assessment (which life areas explored? Job, relationships, stress, goals?)
- ✅ Archetype mapping (memorable name + visual identity for easy discussion)
- ✅ Behavioral signals during assessment (how did they answer? Confidence? Contradictions?)

**4. Competitive Moat from Conversation Data:**
- ✅ Traditional assessments are static questionnaires
- ✅ Conversation data is dynamic, nuanced, reveals *why* not just *what*
- ✅ Can train proprietary models on conversation patterns → predict job success
- ✅ Can analyze conversation trends → personality market research ("what's driving stress in 2029?")

---

## Success Criteria

### User Success

**Primary User Success Metric: Completion Rate > 50%**
- User sits through 30+ minute conversational assessment without abandoning
- This indicates: Nerin engagement is working, questions feel relevant, users feel heard
- **Success threshold:** ≥ 50% of users who start assessment complete it fully
- **Measurement:** Track drop-off points in conversation flow, identify where users abandon

**Secondary User Success Metric: Sharing Rate ≥ 15%**
- Users proactively generate shareable profile link and send to others
- This indicates: Users see value in their results, want to share personality insights, feel pride in archetype
- **Success threshold:** ≥ 15% of completed assessments result in profile shares
- **Measurement:** Track unique profile link generation (primary behavior) + clicks from shared links (secondary signal)
- **Viral signal:** Each shared profile that converts (recipient takes assessment) = growth multiplier
- **Rationale:** Your differentiation (conversational depth vs. predefined boxes) attracts users who value accuracy, making them MORE likely to share. Target 15% reflects confidence in your value proposition over competitors.

**Tertiary User Success Metric: User Sentiment & NPS**
- Users report assessment felt meaningful, accurate, insightful
- **Measurement methods:**
  - Post-assessment survey: "How well did this assessment capture your personality?" (1-10)
  - NPS question: "Would you recommend big-ocean to friends?" (0-10)
  - Qualitative feedback: "What surprised you most about your assessment?"
- **Success threshold:** Average sentiment score ≥ 7/10, **NPS ≥ 40** (validated against personality quiz benchmarks of 30-45)
- **Note:** Increased from 30 to 40 to reflect ambitious excellence target + competitive advantage vs. MBTI/16Personalities

**User Experience Success: Nerin Quality + UI/UX Polish**
- Users feel heard during conversation (not robotic, personalized, adaptive)
- UI is beautiful, intuitive, builds trust (privacy controls visible, not hidden)
- Profile display makes archetype memorable + shareable (visual appeal, readability)
- **Measurement:** User feedback on conversation quality, UI intuitiveness, aesthetic appeal

**Exit Analysis (Addressing Survivorship Bias):**
- Capture sentiment from users who abandon assessment mid-conversation
- **Where do users abandon?** Track drop-off points (after 5 min? 15 min? 25 min?)
- **Why do they leave?** Exit survey: "Too long / boring / confusing / personal / other"
- **Qualitative feedback:** Email beta dropouts: "We noticed you didn't finish—what happened?"
- **Measurement:** Cohort analysis by drop-off point + sentiment from dropouts
- **Insight:** Understanding why 50% don't complete helps optimize for the other 50%

---

### Business Success

**MVP Phase (500 users) - Validation Success:**
- ✅ **Completion rate ≥ 50%** - Proves engagement model works (excellent for 30-min conversation vs. competitors at 10 min)
- ✅ **Sharing rate ≥ 15%** - Proves viral potential (reflects confidence in conversational depth differentiation)
- ✅ **NPS ≥ 40 from completers** - Proves users are promoters (competitive advantage)
- ✅ **Cost per assessment ≤ $0.15** - Proves LLM cost model is realistic and manageable
- ✅ **Exit analysis: Understand dropout patterns** - Proves engagement issues are addressable
- ✅ **Zero data breaches** - Proves privacy/security foundation is solid
- ✅ **Positive user sentiment ≥ 7/10** - Proves product-market fit signal

**Post-MVP Phase (1000-5000 users) - Growth Success:**
- ✅ **Coaching conversion rate ≥ 3%** - Prove coaching upsell viability
- ✅ **Merch revenue ≥ $2-5k/month** - Prove merchandise revenue channel
- ✅ **Organic sharing > 50% of new users** - Prove viral loop is sustainable
- ✅ **User acquisition cost (CAC) < $5** - Prove growth is efficient

**Long-term (50k+ users) - Profitability Success:**
- ✅ **ARPU (Average Revenue Per User) ≥ $2-5/year** - Merch + coaching + premium tier
- ✅ **CAC payback period < 6 months** - Unit economics are healthy
- ✅ **Conversation data insights unlock B2B revenue** - Secondary revenue stream emerges

---

### Technical Success

**Nerin Conversational Quality (Launch Moat)**
- ≥70% of users rate responses as "specifically tailored to me" vs "generic" in post-assessment survey
- Conversation adapts based on user context (Orchestrator prevents repetition)
- Users stay engaged for 30+ minutes without forcing (measured by completion rate ≥50%)
- **Measurement:** Post-assessment survey question: "How personalized did the conversation feel? (1-5 scale, ≥4 = success)", conversation length distribution, drop-off analysis
- **Non-negotiable:** Nerin must be excellent, or entire product fails

**UX/UI Polish (Trust & Aesthetics)**
- ≥80% of users locate privacy settings without help in usability testing (5 participants, task: "Show me how to make profile private")
- ≥4/5 design review score from 3 independent designers for shareable profile card (aesthetics + clarity criteria)
- ≥75% of users complete assessment flow without requesting help or expressing confusion (measured via support requests + exit survey)
- ≥60% of users recall their 4-letter archetype code after 1 week (follow-up email survey)
- **Measurement:** Usability testing sessions, design peer review, support ticket analysis, follow-up recall survey
- **Non-negotiable:** Excellent UX builds trust and drives virality

**OCEAN Archetype System Quality**
- Archetype code generation deterministic: Same trait scores always produce identical 4-letter OCEAN code (POC scope: 4 traits)
- Character name + description lookup: Registry query returns name + 2-3 sentence description in <100ms
- Facet scoring precision: All 24 facets (POC scope) stored with 0.1-point decimal precision for consistent code calculation
- Code consistency across sessions: User's archetype code remains stable across profile views and shareable link
- Component-based naming fallback: All 81 combinations have meaningful names via hand-curation (25-30) + component-based generation (remaining 56)
- **Measurement:** Automated testing of code generation determinism, performance monitoring of lookups, user sentiment on name + description resonance
- **Non-negotiable:** Users must feel their archetype identity is stable, memorable, and accurately described across interactions

**Real-Time Performance**
- Nerin response time: < 2 seconds (P95) for perceived responsiveness
- Assessment data saves instantly (< 500ms latency for user inputs)
- Profile page loads in < 1 second
- **Measurement:** Real User Monitoring (RUM), Lighthouse performance scores
- **Non-negotiable:** Slow responses kill engagement during 30-min conversation

**Privacy & Security Foundation**
- Zero unauthorized profile access (profiles only visible via explicit link)
- Conversation data encrypted at rest + in transit
- No data breaches or unauthorized access incidents
- EU compliance (GDPR, data protection) from day 1
- **Measurement:** Security audits, penetration testing, compliance checklists
- **Non-negotiable:** Privacy breach destroys trust permanently

**Database & Scaling**
- Handle 500 concurrent users in MVP without degradation
- Query response time < 500ms for user data retrieval
- Session state (conversation progress) persists reliably
- **Measurement:** Load testing, database query optimization
- **Non-negotiable for MVP:** Must be stable at 500 users; scaling to 5k is Phase 2 optimization

---

### Measurable Outcomes

| Metric | MVP Target (500 users) | Post-MVP Target (5k users) | Measurement Method |
|--------|------------------------|--------------------------|-------------------|
| **Completion Rate** | ≥ 50% | ≥ 60% | User submitted final assessment data |
| **Sharing Rate** | ≥ 15% | ≥ 20% | Profile link generation (primary behavior) |
| **User Sentiment (Completers)** | ≥ 7/10 | ≥ 8/10 | Post-assessment survey (completers only) |
| **NPS (Completers)** | ≥ 40 | ≥ 50 | "Would recommend to friends?" survey |
| **Exit Sentiment (Dropouts)** | Capture via survey | Improve engagement | Exit survey: "Why did you leave?" |
| **Drop-off Analysis** | Identify WHERE users abandon | Optimize pacing | Cohort analysis by conversation length |
| **Archetype Name Resonance** | ≥ 75% of users feel their archetype name is memorable + want to share it | ≥ 80% | Post-assessment survey: "Does your archetype name feel worth sharing?" |
| **Archetype Code Consistency** | Same trait scores always produce identical 4-letter OCEAN code (deterministic) | 100% | Automated testing of code generation |
| **Trait Description Accuracy** | ≥ 80% of users find their trait description accurate + insightful | ≥ 85% | Post-assessment survey: "Does this description capture your personality?" |
| **LLM Cost/User** | ≤ $0.15 (realistic) | ≤ $0.12 | API cost monitoring (optimization target: $0.10) |
| **Nerin Response Time (P95)** | < 2 seconds | < 1.5 seconds | Real User Monitoring |
| **Page Load Time** | < 2 seconds | < 1 second | Lighthouse, RUM |
| **Data Breach Incidents** | 0 | 0 | Security audit log |
| **EU GDPR Compliance** | ✅ Day 1 | ✅ Full compliance | Legal + compliance audit |
| **Coaching Conversion (Phase 2)** | N/A (post-MVP) | ≥ 3% | Transaction tracking |

---

## Product Scope

### MVP - Minimum Viable Product (500 users, Validate PMF)

**Must Have:**
- ✅ Conversational Big Five assessment with Nerin (excellence is priority)
- ✅ Shareable profiles (private by default, LinkedIn-style sharing)
- ✅ Privacy controls visible in UI ("Your profile is private by default")
- ✅ Real-time streaming responses (< 2 sec response time)
- ✅ OCEAN Archetype System (POC Scope): 4-letter main archetype code (81 combinations: 4 traits × 3 levels), ~25-30 hand-curated archetype character names covering common combinations, component-based naming system for remaining 56 combinations, all 24 facets (4 traits × 6 facets) with scientific precision in database, trait descriptions providing psychological accuracy
- ✅ Server-side session state management with URL-based resumption (client-side state management for frontend)
- ✅ LLM cost monitoring + capping dashboard
- ✅ EU GDPR compliance (data deletion, portability, consent)
- ✅ Nerin quality + UX/UI polish (beautiful profile card, intuitive flow)

**Explicitly NOT in MVP:**
- ❌ Export conversation to PDF (removed for scope simplification)
- ❌ ElectricSQL local-first sync (Phase 2 - MVP uses server-side sessions with URL resumption)
- ❌ Coaching partner integrations (Phase 2)
- ❌ Merch infrastructure (Phase 2)
- ❌ B2B team/recruiter features (Phase 2)
- ❌ ML models trained on conversation data (Phase 3+)
- ❌ Global compliance beyond EU (Phase 2+, add regions one at a time)
- ❌ Conversation data analytics dashboard (Phase 2)
- ❌ Subscription tier for "continue with Nerin" (Phase 2+)

---

### Growth Features (Post-MVP, After PMF Validation)

**Phase 2 (1k-5k users):**
- ✅ Coaching partner integrations (revenue share)
- ✅ Merch infrastructure (e-commerce, personality-themed products)
- ✅ B2B optionality (team assessments for startups, recruiter profiles)
- ✅ Conversation data analytics dashboard (internal insights)
- ✅ US region support + compliance (after EU validation)
- ✅ Subscription tier ("continue with Nerin" for ongoing coaching conversations)
- ✅ Mobile app (if user demand signals it)

**Phase 3 (5k+ users):**
- ✅ ML models trained on conversation data (proprietary insights)
- ✅ Personality market research products (anonymized trend reports)
- ✅ Asia region support + compliance
- ✅ B2B enterprise features (team analytics, role fit analysis)
- ✅ Export conversation data (if user demand signals it)

---

### Vision (18+ months, Full Product)

- ✅ Global compliance (EU, US, Asia, worldwide)
- ✅ Proprietary conversation-based ML models (competitive moat)
- ✅ B2B enterprise platform (team analytics, recruitment integration)
- ✅ Subscription coaching marketplace (connect users to coaches)
- ✅ Merch + coaching revenue streams mature (predictable, significant)
- ✅ Company partnerships (HR platforms, recruitment tools, career apps)
- ✅ Scientific research partnerships (validate assessment methodology)
- ✅ Personality trend reports (market research product)

---

## Web Application Requirements

As a web_app project type, the following platform-specific requirements ensure cross-browser compatibility, responsive design, discoverability, and accessibility.

### Browser Compatibility Matrix

**Supported Browsers (Minimum Versions):**
- Chrome/Chromium: 90+ (covers 70%+ of users)
- Firefox: 88+ (covers 10%+ of users)
- Safari: 14+ (covers 15%+ of users, iOS compatibility)
- Edge: 90+ (covers 5%+ of users)

**Testing Strategy:**
- Automated cross-browser testing via Playwright/Cypress
- Manual testing on latest stable versions
- Graceful degradation for older browsers (show upgrade notice for <90)

**Critical Features per Browser:**
- Real-time streaming (SSE/WebSocket support)
- Local storage for session persistence
- CSS Grid/Flexbox for responsive layout
- TLS 1.3 for secure connections

### Responsive Design Requirements

**Mobile-First Approach:**
- Design for smallest screen first (375px width minimum)
- Progressive enhancement for larger screens

**Breakpoints:**
- Mobile: 375px - 767px (portrait phone, primary for conversational assessment)
- Tablet: 768px - 1023px (portrait iPad, assessment + results viewing)
- Desktop: 1024px - 1439px (laptop, optimal for profile exploration)
- Large Desktop: 1440px+ (external monitor, admin/analytics views)

**Responsive Behavior:**
- Mobile: Single-column layout, bottom navigation, touch-optimized tap targets (44px minimum)
- Tablet: Two-column layout for results, persistent side navigation
- Desktop: Multi-column dashboard, hover states, keyboard navigation

**Touch & Interaction:**
- Touch targets ≥44px for mobile (finger-friendly)
- Swipe gestures for navigation (optional enhancement)
- Keyboard navigation for desktop accessibility

### SEO Strategy

**Organic Discovery Goals:**
- Rank for "Big Five personality test", "OCEAN personality assessment", "scientific personality test"
- Drive 50%+ of traffic from organic search (post-MVP)

**On-Page SEO:**
- Meta tags: Title (55 chars), Description (155 chars), Keywords
- Open Graph tags for social sharing (og:title, og:description, og:image)
- Twitter Card markup for rich previews
- Structured data (Schema.org): FAQPage, Person, Organization

**Technical SEO:**
- XML sitemap with assessment + profile pages
- Robots.txt allowing all public pages
- Canonical URLs for duplicate content prevention
- 301 redirects for URL changes
- Page load speed <2 seconds (Core Web Vitals)

**Content Strategy:**
- Educational content: "What is Big Five?", "MBTI vs Big Five comparison"
- Landing pages per archetype (81 unique URLs for SEO)
- Blog posts: Personality insights, research summaries

### Accessibility Standards

**WCAG 2.1 Level AA Compliance (Minimum):**
- Perceivable: Alt text for images, captions for videos, color contrast ≥4.5:1
- Operable: Keyboard navigation (Tab, Enter, Escape), focus indicators, no keyboard traps
- Understandable: Clear language (8th grade reading level), consistent navigation, error identification
- Robust: Valid HTML5, ARIA landmarks, semantic markup

**Screen Reader Support:**
- NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS) testing
- ARIA labels for interactive elements
- Skip navigation links
- Focus management during Nerin conversation

**Keyboard Navigation:**
- Tab order follows visual flow
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys navigate lists

**Testing:**
- Automated: axe DevTools, Lighthouse accessibility audit
- Manual: Screen reader testing, keyboard-only navigation
- Target: Zero critical accessibility violations before launch

---

## User Journeys

User journeys map how target users interact with the platform from discovery through ongoing engagement, ensuring all functional requirements trace back to actual user needs.

### Journey 1: New User → Assessment → Profile → Share

**User:** Maya (32, product manager seeking self-awareness for career growth)

**Trigger:** Discovers big-ocean through LinkedIn post from friend sharing their archetype

**Steps:**
1. **Discover:** Clicks shared profile link → Views friend's archetype results → Intrigued by "Mindful Architect" description
2. **Start Assessment:** Clicks "Take Your Assessment" → Lands on homepage → Reads "30-min conversation" promise
3. **Engage with Nerin:** Begins conversational assessment → Nerin asks open-ended questions → Maya responds naturally → Progress indicator shows 35% complete
4. **Continue Conversation:** Nerin adapts questions based on responses → Explores values, work style, social preferences → No repetitive or generic questions → 25 minutes elapsed
5. **Receive Results:** Assessment complete → System displays 4-letter OCEAN code → Archetype name revealed: "The Catalyst" → Reads 2-sentence archetype description
6. **Explore Profile:** Views trait breakdown (5 Big Five traits with scores 0-20) → Reads facet-level details (6 facets per trait) → Precision score shows 85% confidence
7. **Share:** Clicks "Share Profile" → Generates unique URL → Copies link → Posts to LinkedIn with caption "Just discovered I'm 'The Catalyst' 🔥"

**Success Criteria:** Completion rate ≥50%, Sharing rate ≥15%, User sentiment ≥7/10

**Key FRs:** FR1-4 (Assessment), FR5-7 (Trait scoring), FR8-11 (Archetype system), FR13-15 (Profile sharing)

---

### Journey 2: Returning User → Resume → Complete → Export

**User:** Alex (28, engineer who started assessment during lunch break, needs to finish)

**Trigger:** Started assessment 2 days ago, received email reminder "Your personality assessment is waiting"

**Steps:**
1. **Return:** Clicks email link → Lands on resume page → Sees "Pick up where you left off" message
2. **Resume:** System loads session state → Last conversation message visible → Progress shows 60% complete → "~12 minutes remaining"
3. **Continue Assessment:** Nerin picks up conversation naturally → No repeated questions → Feels seamless, not fragmented
4. **Complete:** Final questions answered → Assessment complete → Results generated
5. **Review Results:** Explores full profile → Reads trait descriptions → Checks facet scores
6. **Export:** Clicks "Download Results" → Receives PDF with conversation history + trait breakdown → Saves for personal records

**Success Criteria:** Resume rate ≥70% (users who pause actually return), Session continuity feels natural

**Key FRs:** FR3 (Pause/resume), FR4 (Progress indicator), FR16 (Export), FR21-22 (Session state management)

---

### Journey 3: Privacy-Conscious User → Selective Sharing → Access Control

**User:** Jordan (35, therapist concerned about data privacy and professional boundaries)

**Trigger:** Interested in assessment but wary of data collection and unwanted profile visibility

**Steps:**
1. **Research Privacy:** Visits homepage → Clicks "Privacy Policy" → Reads "Default Private" and "Explicit Sharing Only" promises
2. **Start Assessment:** Begins conversation → Notices "Your data is encrypted" badge → Feels reassured
3. **Complete Assessment:** Receives results → Profile shows "Private" status by default → No public directory listing
4. **Control Sharing:** Views sharing options → Generates unique link for close friend only → Does NOT share publicly → Link expires after 30 days (Phase 2 feature)
5. **Manage Data:** Clicks "Data Settings" → Reviews data retention policy → Sees option to delete all data (GDPR Article 17) → Exports conversation as backup before deletion
6. **Delete Profile:** Requests account deletion → System confirms all data will be permanently removed within 30 days → Receives confirmation email

**Success Criteria:** Zero unauthorized profile access, GDPR compliance day 1, User trust metrics >8/10

**Key FRs:** FR15 (Privacy controls), FR17-20 (Data encryption, deletion, audit logs), NFRs for GDPR compliance

---

## Functional Requirements

Functional requirements define what the system must DO—the core capabilities and user interactions.

### Assessment & Conversation

- **FR1:** Users can complete multi-turn conversational personality assessment with AI agent for minimum 30 minutes
- **FR2:** Users can send messages and receive responses in real-time with streaming (response time <2 seconds P95)
- **FR3:** Users can pause assessment and resume later from saved conversation state (session ID + message offset + conversation context)
- **FR4:** System displays real-time progress indicator showing percentage completion (0-100%)

### Big Five Trait Assessment (Evidence-Based Facet Scoring)

- **FR5:** System analyzes each message to detect 30 Big Five facet signals, creating evidence records with: facet name (clean, no trait prefix), numeric score (0-20), confidence (0.0-1.0), exact quote, and character-level highlight range tied to messageId
- **FR5.1:** System stores facet evidence in `facet_evidence` table with indexes on messageId and facet for bidirectional navigation (Profile ↔ Conversation)
- **FR5.2:** System aggregates facet evidence every 3 messages using weighted averaging (recency + confidence) and contradiction detection (variance analysis)
- **FR5.3:** System adjusts facet confidence based on evidence consistency: high variance → lower confidence, more samples → higher confidence
- **FR6:** Users can view Big Five trait scores derived from facet averages using FACET_TO_TRAIT lookup (traits are computed properties, not primary data)
- **FR6.1:** Users can click any facet score in profile to view supporting evidence with highlighted message quotes
- **FR6.2:** Users can click any message in conversation history to see which facets it contributed to and their score contributions
- **FR7:** System maintains and updates per-facet confidence scores (0.0-1.0) throughout conversation, with trait confidence derived as minimum across contributing facets

### OCEAN Archetype System (POC Scope: 4 Traits)

- **FR8:** Users receive 4-letter OCEAN archetype code generated from trait levels (Openness, Conscientiousness, Extraversion, Agreeableness: each Low/Mid/High)
- **FR9:** System maps OCEAN codes to memorable character archetype names: ~25-30 hand-curated names + component-based generation for remaining combinations
- **FR10:** System retrieves archetype name + 2-3 sentence trait description explaining the personality combination
- **FR11:** System displays all 24 facet level names (Low/High pairs for 4 traits) aligned with user's assessment results on request
- **FR12 (Phase 2):** System extends to 5 traits (adding Neuroticism) and generates detailed archetype codes (XX-XX-XX-XX-XX) post-POC validation

### Profile & Results

- **FR13:** System generates shareable profile with archetype code, character name, trait summary, and facet insights
- **FR14:** System creates unique profile URL for each completed assessment (encrypted, shareable only via explicit link)
- **FR15:** System displays profile as private by default with explicit user control for sharing
- **FR16:** System allows users to download/export assessment results in human-readable format

### Bidirectional Evidence Highlighting (Transparency Feature)

- **FR17:** Users can click any facet score in their profile to view "Show Evidence" panel listing all supporting message quotes with their score contributions
- **FR17.1:** Clicking "Jump to Message" in evidence panel scrolls conversation to that message and highlights the exact quote that contributed to the facet score
- **FR17.2:** System applies color-coded highlighting: green (strong positive signal), yellow (moderate signal), red (contradictory signal), with opacity indicating confidence level
- **FR18:** Users can click any message in conversation history to view side panel showing which facets it contributed to and their respective score contributions
- **FR18.1:** System displays bidirectional navigation: Profile → Evidence → Message (forward) and Message → Facets → Profile (backward)
- **FR19:** System uses character-level `highlightRange` from facet evidence to precisely highlight relevant text in message content

### Data Management

- **FR20:** System stores complete conversation history encrypted at rest with user data
- **FR20.1:** System stores facet evidence records with messageId references for transparency and bidirectional navigation
- **FR21:** System encrypts all data in transit (TLS 1.3 minimum)
- **FR22:** System provides data deletion and portability capabilities per GDPR Article 17, 20

### Real-Time Synchronization

- **FR23:** System maintains session state on server with URL-based resumption capability (ElectricSQL local-first sync deferred to Phase 2)
- **FR24:** System maintains session state across device switches without data loss via session URL
- **FR25:** System implements optimistic updates for instant UI feedback during conversation

### Infrastructure Requirements

*These requirements address backend operational concerns (compliance, cost control, system monitoring) without direct user-facing features. They enable business viability and regulatory compliance.*

- **FR26:** System logs all profile access with timestamp, user, and request type for audit trail
- **FR27:** System monitors LLM costs per user and session in real-time
- **FR28:** System implements rate limiting (1 assessment per user per day, 1 resume per week)
- **FR29:** System auto-disables assessment if daily LLM cost threshold exceeded, displaying message: "We've reached our daily assessment limit. Please try again tomorrow or upgrade to premium for immediate access."

---

## Non-Functional Requirements

Non-functional requirements specify HOW WELL the system performs—quality attributes and constraints.

(See Technical Success section above for comprehensive NFRs covering performance, privacy, security, scaling, and archetype system quality)

---

## Executive Summary

**Vision:** Transform personality assessment through conversational AI that provides engaging, scientifically-grounded Big Five personality profiles with memorable archetypes and privacy-first sharing.

**Product:** big-ocean delivers a 30-minute conversational assessment via Nerin (AI agent) that analyzes 30 Big Five facets, generates a unique 4-letter OCEAN archetype code with memorable character name, and creates shareable profiles for social discovery—while maintaining user privacy control.

**Target Users:** B2C individuals globally seeking authentic personality insight beyond MBTI's oversimplification, particularly professionals interested in self-awareness, team dynamics, and personal growth.

**Core Business Goals:**
- Validate product-market fit with 500 beta users (MVP Phase 1)
- Achieve 50% completion rate and 15% sharing rate demonstrating engagement
- Maintain LLM costs ≤$0.15 per assessment through optimization and rate limiting
- Build conversation data moat (competitive advantage for future model training)
- Position Big Five as scientifically superior to MBTI through market education

**Key Success Metrics:**
- User Engagement: ≥50% completion rate, ≥15% sharing rate, NPS ≥40
- Technical Performance: <2 sec response time (P95), zero data breaches
- Business Viability: Cost ≤$0.15/user, CAC payback <6 months (post-MVP)

**Differentiation:** Conversational depth + memorable archetypes + privacy-first + scientific credibility (vs. questionnaire-based assessments with generic results)

