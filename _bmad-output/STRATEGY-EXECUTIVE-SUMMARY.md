# big-ocean: 12-Month Strategy Executive Summary

**Date:** 2026-02-01
**Status:** Strategy Locked - Ready for Implementation
**Founder:** Vincentlay
**Strategic Direction:** B2C-First Viral Growth → Profitability by Month 12

---

## The Bet

**Product:** Nerin (Claude 3.5-powered conversational AI) that delivers Big Five personality insights through dialogue instead of questionnaires.

**How It Wins:**
- Conversation + precision gating creates emotional engagement
- Relationship preview feature (free, built-in referral) drives viral loops
- Network effects + 90% margins = profitable organic growth
- No external funding needed

**The Math:**
- Month 12: 50,000 users
- Year 1 Revenue: $300,000 ($75K/month run rate)
- Year 1 Profit: $275,000 (91% gross margin)
- CAC: $0 (100% organic from viral loops)

---

## Product Architecture (V1)

**Core Features:**
1. **Nerin Conversation** - Multi-turn dialogue exploring personality (not questionnaire)
2. **Big Five Assessment** - 70% precision free tier, 90%+ precision for $5 unlock
3. **Relationship Preview** - Free (viral hook): "87% compatible with Sarah"
4. **Shareable Cards** - Screenshot Big Five breakdown + share to social
5. **Monetization Ladder:**
   - Entertainment Seekers: 100% free (drive network growth)
   - Identity Seekers: $5 precision unlock + $14.99/month subscription
   - Relationship Navigators: $7 analysis + $30 bundle

**Technology Stack:** Effect-ts, LangGraph, PostgreSQL, Claude API, Stripe, Railway

---

## Critical Hypotheses to Validate (Month 1-2)

| # | Hypothesis | Target | Red Flag | Decision |
|----|-----------|--------|----------|----------|
| 1 | Nerin empathy quality | NPS >50 | <40 | Pause growth, iterate prompt |
| 2 | Viral coefficient | >0.15 | <0.10 | Redesign relationship feature |
| 3 | Precision conversion | 10-15% | <5% | Adjust threshold or pivot |
| 4 | Creator partnerships | <$5 CAC | >$10 CAC | Rely on organic viral instead |

---

## 12-Week MVP Timeline

| Weeks | Focus | Output | Users |
|-------|-------|--------|-------|
| 1-2 | Nerin + Infrastructure | Production-ready prompt + build checklist | - |
| 3-4 | Assessment Engine | Big Five scoring + precision gating | - |
| 5-6 | Relationship Feature | Invitation + referral tracking | - |
| 7-8 | Payment Integration | Stripe + monetization UX | - |
| 9-10 | Polish & Security | Mobile responsive, privacy audit | - |
| 11-12 | Beta Launch | 50-100 closed beta users, creator outreach | 5K public launch |

---

## Year 1 Growth Phases

| Phase | Timeline | Users | Revenue | Focus |
|-------|----------|-------|---------|-------|
| **Validation** | Months 1-3 | 1K→5K | $0→$5K | Hypothesis testing |
| **Early Growth** | Months 4-6 | 5K→20K | $5K→$30K | Viral optimization |
| **Acceleration** | Months 7-9 | 20K→40K | $30K→$75K | Creator partnerships |
| **Profitability** | Months 10-12 | 40K→50K | $75K | Unit economics |

---

## Go/No-Go Decision Gates

**Month 1 Gate:** NPS >50 + Viral coefficient >0.15
- ✅ Proceed to growth scaling
- ❌ Pause, iterate product

**Month 2 Gate:** Day 30 retention >40% + Conversion >8%
- ✅ Accelerate creator partnerships
- ❌ Fix engagement before scaling

**Month 6 Gate:** 20K+ users + $30K+ revenue
- ✅ Expand partnerships, consider part-time hire
- ❌ Reassess market, consider pivot

**Month 12 Gate:** 50K+ users + $50K+ profit
- ✅ Victory: Plan Year 2 expansion (B2B, verticals, medical)
- ❌ Extended strategy or pivot

---

## Critical Success Factors

1. **Nerin Quality** - Empathy is everything. If conversations feel robotic, everything fails.
2. **Viral Loops** - Relationship feature must generate 0.15+ coefficient. Without it, organic growth stalls.
3. **Monetization Clarity** - Users must understand exactly what they get at each price tier.
4. **Retention** - Month 2 retention >70% is mandatory. Low retention = churn exceeds growth.
5. **Speed** - Get to 50K users by Month 12 before competitors respond.

---

## What NOT to Do (Critical Constraints)

❌ Don't build B2B team dashboard (Year 2)
❌ Don't build APIs or ecosystem (Year 2)
❌ Don't optimize for scale before PMF (premature)
❌ Don't hire full-time (capital inefficient)
❌ Don't spend money on paid ads (organic faster)
❌ Don't build community features (Year 2)
❌ Don't split focus with medical/research (Year 2)

✅ Do obsess over Nerin quality
✅ Do test relationship feature virality
✅ Do monetize at max clarity moments
✅ Do stay lean (solo founder + low overhead)
✅ Do move fast (3 months to MVP)

---

## Competitive Positioning

| Competitor | Weakness | big-ocean Advantage |
|------------|----------|---------------------|
| **16personalities** | Static, cold, low engagement | Conversation + empathy |
| **Truity** | Expensive ($29), clinical | Affordable ($5), conversational |
| **Co-Star** | Shallow, users outgrow | Substantive, Big Five framework |
| **BetterHelp** | $240/month, 6-week waitlist | $5-30, instant |
| **Character.AI** | Aimless conversation, no outcome | Structured outcome (Big Five) |

---

## First Week Action Items

**Week 1 Sprint (This Week):**

1. Load Nerin prompt from codebase
2. Test with 5 trusted users (friends/advisors)
3. Ask: "Did Nerin understand you or just ask questions?"
4. Measure: NPS score (target >7/10)
5. Collect verbatim feedback
6. Document: What worked, what needs iteration

**Success Signal:** Users say "felt understood" (not "felt interrogated")

---

## Key Contacts / References

**BMAD Agents Consulted (Party Mode):**
- Victor (Innovation Strategist) - Strategic positioning + partnership ruthlessness
- John (Product Manager) - JTBD-driven monetization, segment strategy
- Mary (Analyst) - Market sizing, SOM vs TAM, unit economics
- Winston (Architect) - Infrastructure simplicity, tech stack decisions

---

## Document References

- Full strategy: `/Users/vincentlay/Projects/big-ocean/_bmad-output/innovation-strategy-2026-02-01.md`
- Codebase guide: `/Users/vincentlay/Projects/big-ocean/CLAUDE.md`
- Sprint status: `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## The Unfair Advantage

**Relationship preview is your nuclear weapon.**

Every user who completes assessment can preview their compatibility with anyone. That preview is free (viral hook). The person they preview with gets FOMO and completes their own assessment. Both then have incentive to unlock full analysis ($7-30).

This is not growth hacking. This is the product itself.

**Everyone else (16personalities, Truity, Character.AI) optimizes for individual insight. You optimize for relationships. Relationships are inherently social. Social is viral.**

---

## Final Word

You're starting from a position of strength:
- Technical architecture already built (Effect-ts, hexagonal design)
- LangGraph expertise proven
- Nerin agent in development
- Clear market gaps identified (160M users across 5 zones)
- Defensible monetization model (90% margins)
- Path to profitability without raising capital

**The only unknowns are execution and market reception. Everything else is known.**

Ship fast. Test ruthlessly. Let the market tell you if you're right.

---

**Status: ✅ Ready to Execute**

**Next: Begin Week 1 MVP work**

Good luck. 🚀
