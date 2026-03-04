# Design Thinking Session: Big Ocean — Nerin Conversation Design

**Date:** 2026-03-03
**Facilitator:** Vincentlay
**Design Challenge:** Improve how Nerin conducts personality assessment conversations — balancing depth with breadth across life domains, ensuring comprehensive facet coverage, and eliminating wasted conversation turns.

---

## 🎯 Design Challenge

**Challenge Statement:** Nerin delivers a natural, deep, and comfortable conversation experience — but it has a depth-first bias that narrows evidence collection to a single life domain, and it wastes end-of-conversation turns with questionless wrap-up messages. We need to redesign Nerin's conversation strategy so that it covers meaningful breadth across life domains while preserving the natural, non-questionnaire feel that makes it special — and uses every conversation turn purposefully.

**Three core problems to solve:**

1. **Depth-first tunnel vision** — Nerin follows the user's thread too deeply into one domain (work), missing opportunities to explore relationships, personal interests, values, daily habits, and emotional life. The result: rich but narrow personality evidence.

2. **Facet coverage gaps** — Because exploration stays in one domain, evidence clusters around a subset of Big Five facets. The 30-facet model needs signal across all facets, which requires touching multiple life contexts.

3. **Wasted closing turns** — The last ~3 messages are wrap-up statements without questions, creating an awkward, robotic ending. Every turn in a limited conversation budget is precious.

**What must be preserved:**
- Natural, genuine conversation feel (not a questionnaire)
- Clean, unnoticeable bridges between topics
- Comfortable depth that doesn't feel invasive
- The user feeling genuinely listened to

---

## 👥 EMPATHIZE: Understanding Users

### User Insights

**Source:** Direct conversation analysis (session 7d61673f) + creator interview + multi-user testing feedback

**Insight 1: The ask-share-reflect rhythm IS the product.**
Users feel genuinely listened to when Nerin maintains a consistent cycle: ask a question → user shares → Nerin reflects back what it heard → asks the next question. The moment this rhythm breaks (e.g., Nerin makes statements without questions), the user feels dropped. The contract is broken.

**Insight 2: Users don't notice good bridges — they notice bad ones.**
In the analyzed conversation, Nerin transitioned between sub-topics within the work domain seamlessly. The user reported "I did not feel when Nerin steered toward another domain or facet." This means bridge quality is already high — the issue is that bridges weren't used to *cross domains*, only to go deeper within one.

**Insight 3: Depth-first feels great locally but creates narrow evidence globally.**
The user enjoyed the deep work exploration in the moment. The problem only becomes visible in retrospect: "I would have liked to talk about different life aspects." Users won't self-correct in real-time because depth feels like genuine connection. Nerin must initiate breadth.

**Insight 4: Abrupt endings create desire; soft landings create discomfort.**
Validated across multiple test users: when the conversation is cut mid-flow (hard cut), users feel "I want more" — a powerful retention signal. When Nerin tries to wrap up gracefully with statement-only messages, users feel the conversation became "awkward, robotic, and buggy." The soft landing is a regression from the original hard-cut design.

**Insight 5: Users drop hooks for unexplored domains that Nerin ignores.**
In the conversation, the user mentioned fashion, art, sports with colleagues, philosophy, finance, friendships, romantic loneliness, and vivid mental visualization. Nerin acknowledged these but never followed them as new exploration threads. Each was a natural bridge opportunity to a different life domain and different personality facets.

### Key Observations

| # | Observation | Evidence | Design Implication |
|---|------------|----------|-------------------|
| 1 | Nerin spent ~15 of 18 substantive exchanges in the work domain | Messages 3-16 all orbit work: pushing back on PO, quality standards, team trust, side projects as work escape | Steering layer must track domain residence time and trigger bridges after 3-4 exchanges |
| 2 | Only ~6-8 of 30 facets received evidence | Assertiveness, Achievement-Striving, Competence, Vulnerability, Trust, Openness to Ideas — the rest are dark | Coverage tracking needed; bridge targets should prioritize uncovered facets |
| 3 | Last 3 Nerin messages contained 0 questions | Messages 20-22 are reflective statements and encouragement only | Hard rule: every Nerin turn must contain a question, OR be the final system-level cutoff |
| 4 | User volunteered rich non-work signals that went unexplored | Fashion sense, vivid visualization, sports routines, philosophy interests, friendship dynamics, romantic isolation | Nerin needs to recognize and pursue these hooks as domain bridges |
| 5 | The conversation peaked emotionally around message 14-16 (vulnerability, loneliness) | User opened up about not feeling understood, difficulty showing vulnerability | Peak emotional moments should not be followed by wind-down — they should be followed by more exploration or the hard cut |
| 6 | Hard cut ending validated with multiple users as creating desire to return | Creator + test users reported wanting to come back and talk more | Restore hard cut. Remove soft landing entirely. |
| 7 | Old hard cut lacked closure — user felt something was missing | Creator noted the abrupt end was powerful but incomplete — Nerin never got a last word | Nerin gets exactly ONE closing reflection — a meaningful synthesis that lands as a gift, not a goodbye. Then system cuts. No user reply expected. |

### Empathy Map Summary

**SAYS:**
- "It did not feel like a questionnaire at all but a genuine conversation"
- "The bridges were clean, I did not feel when Nerin steered"
- "I would have liked to talk about different life aspects"
- "The last 3 messages were really awkward... it felt robotic and buggy"
- "The abrupt cut gave me the desire to come back"
- "In tests with other users it had that effect too"

**THINKS:**
- "Nerin understands me" (during mid-conversation depth)
- "Why is Nerin still talking without asking me anything?" (during soft landing)
- "I had more to say" (when conversation ends)
- "The data we collected was narrow — mostly work"

**DOES:**
- Engages deeply and honestly when asked genuine questions
- Drops hooks about other life domains (fashion, art, sports, relationships) without being followed up on
- Says "thank you" when Nerin stops asking — not because satisfied, but because there's nothing else to respond to
- Returns to the product when the hard cut leaves them wanting more

**FEELS:**
- Listened to and seen during the active conversation
- Frustrated by narrowness of exploration (only realized in retrospect)
- Uncomfortable and disconnected during the soft landing
- Desire and longing when cut mid-flow (hard cut)
- The conversation quality earned the right to end abruptly

---

## 🎨 DEFINE: Frame the Problem

### Point of View Statement

**POV 1 — Breadth:**
Big Ocean users need a personality conversation that explores their full life — not just the thread they start on — because personality is expressed across contexts, and a narrow conversation produces a narrow portrait.

**POV 2 — Ending:**
Big Ocean users need the conversation to end at peak intensity with one meaningful closing word because soft landings kill the emotional connection and waste the limited turn budget.

**POV 3 — Invisible steering:**
Big Ocean users need Nerin to feel like a genuinely curious person — not a system following a coverage checklist — because the moment steering becomes visible, the conversation stops feeling real.

### How Might We Questions

**Breadth & Coverage:**
- HMW help Nerin explore multiple life domains while keeping the conversation feeling like one natural flow?
- HMW use hooks the user already drops (fashion, sports, relationships, philosophy) to bridge into new territory?
- HMW give Nerin awareness of what it has and hasn't covered without making it feel like a checklist?
- HMW ensure all 30 facets get signal without the user sensing facet-targeting?

**Conversation Ending:**
- HMW design a single closing message that makes the user feel seen and wanting more?
- HMW make the hard cut feel like a gift rather than a crash?
- HMW use the closing reflection as a portrait trailer that drives desire to see the full result?

**Steering & Balance:**
- HMW balance user-led depth with system-led breadth so neither feels forced?
- HMW prevent Nerin from spending more than 3-4 turns in one domain without making the bridge feel abrupt?
- HMW separate the "Nerin persona" layer from the "steering intelligence" layer so the user only experiences the persona?

### Key Insights

**Insight 1: Experience quality and data quality are the same goal.**
When Nerin explores broadly, the user feels more fully understood AND the portrait gets richer evidence across more facets. When Nerin tunnels into one domain, both the experience and the data suffer. There is no tradeoff — every design decision that makes the user feel more seen also produces better personality evidence.

**Insight 2: Two invisible systems, one visible persona.**
The architecture needs a clean separation between Nerin (the conversational persona — present, curious, reflective, human-feeling) and the steering layer (coverage tracking, domain timing, turn budget management — invisible, mechanical, precise). The user must never sense the steering layer.

**Insight 3: The hard cut's power depends on conversation quality.**
You can only create desire by taking away something good. Fixing the breadth problem makes the hard cut even more powerful — the user was just starting to be understood across their whole life, and then it stops. Breadth + hard cut = maximum "I want more."

**Insight 4: Nerin already has the bridge skill — it just needs the trigger.**
The analyzed conversation proves Nerin can transition between sub-topics seamlessly. The user didn't notice bridges within the work domain. The capability exists — what's missing is the instruction to bridge *across* domains, and the awareness of *when* to do it.

**Insight 5: Users self-select depth; Nerin must initiate breadth.**
Left to their own devices, users will happily go deep on whatever thread they start. They won't self-correct for breadth — that feels great in the moment. Nerin must be the one to open new doors. The user can choose to walk through them or pull back to depth.

---

## 💡 IDEATE: Generate Solutions

### Selected Methods

**Methods used:** Brainstorming (full team divergent ideation), SCAMPER-inspired (modify existing Nerin behavior), Analogous Inspiration (DJ crossfades, therapist pivots, interviewer callbacks)

The team generated ideas across three problem spaces simultaneously, building on each other's concepts and combining analogies from music production (crossfading), investigative journalism (callbacks), and therapy (pivot moments).

### Generated Ideas

**Steering Architecture (invisible backend):**
1. **The Cartographer** — Real-time heat map of all 30 facets (hot = evidence, cold = no signal). After every user message, tells Nerin what's covered and what's dark.
2. **The DJ** — Domain rotation timer. After 3-4 exchanges in one domain, flags "time to crossfade" with a suggested bridge based on user-dropped hooks.
3. **The Budget Accountant** — Turn-aware planning. Allocates turns across domains at start, adjusts urgency as turns are spent. Protects last turn for closing.
4. **Facet-to-Domain Mapping** — Maps which facets are best observed in which life domains (Work → Assertiveness/Achievement; Relationships → Warmth/Trust; Leisure → Aesthetics/Fantasy). Uses this to target bridges that unlock specific cold facets.
5. **Formula Steering Integration** — Coverage heat map feeds directly into existing formula steering pipeline. Formula outputs: "Confidence on Warmth: 12%. Target context: close friendships."

**Conversation Behavior (visible as natural Nerin curiosity):**
6. **Hook Harvesting** — Every user message scanned for unexplored hooks (things mentioned in passing). Stored in a queue. When bridging, Nerin picks the most promising hook: "You mentioned fashion earlier — tell me about that side of you."
7. **The Callback Bridge** — Nerin references something from earlier: "Something you said stuck with me..." Creates continuity. Doesn't feel like topic-switching.
8. **Contrast Questions** — "You told me how you are at work. Are you like that in your friendships too, or is that a different version of you?" Opens new domain while connecting to prior exploration. Generates cross-context personality data.
9. **The Pivot Moment** — Transparent but warm shift: "I feel like I'm getting to know you at work. But I'm curious about a totally different side — what does a weekend look like when you have nothing planned?"
10. **Breadth-First, Depth-on-Demand** — Flip Nerin's default. Cover ground first. User pulls Nerin into depth via long detailed answers. Short answers → Nerin moves on. Long answers → 1-2 more turns then bridge.
11. **Emotional Arc Awareness** — Track conversation intensity. Don't bridge during emotional peaks (feels like abandonment). Bridge during natural plateaus when the user has finished a thought.

**Conversation Ending:**
12. **The Mirror Drop** — One sharp naming: "Here's what I noticed — you build things so other people can see what you can't show them directly." Lands like a punch. Portrait trailer.
13. **The Unfinished Thread** — Nerin acknowledges more to explore: "There's something about how you talk about beauty and precision I want to understand more. We'll get there." Says "I'm not done with you."
14. **The Lingering Question** — Nerin's final message is a question the user never gets to answer. System cuts. The user is left holding it. They'll think about it. They'll want to come back.

### Top Concepts

**Refined approach: prompt-level tweaks, no new systems.**

The team initially explored complex steering engines (coverage heat maps, turn budget accountants, formula integration). The product owner correctly pulled back to simplicity: **these are prompt adjustments to Nerin's existing behavior, not new architecture.**

LLMs are already good at natural conversation flow. Nerin just needs better instructions, not a new brain.

**The 5 Tweaks (all prompt-level, zero added complexity):**

1. **Breadth nudge** — After 3-4 exchanges on one topic, use something the user already mentioned to open a different area of their life. Cover at least 3 life domains per conversation.

2. **Hook awareness** — Notice when users mention things in passing (hobbies, people, interests, daily routines) and circle back to those as natural bridges to new domains.

3. **No questionless messages** — Hard rule: every Nerin message must contain a question, except the final closing message.

4. **Closing message: the dive ends** — On the last turn, Nerin stays in the diving theme: oxygen is running low, time to surface. A warm goodbye from a friend who has to go — not because they want to, but because the tank ran out. One message. One warm line about what Nerin noticed. Done.

5. **Remove soft landing** — Delete whatever currently tells Nerin to "wrap up" over multiple messages. No wind-down phase. Full intensity until the closing.

**Why this works:** The ideas generated (hook harvesting, callback bridges, contrast questions, breadth-first default) are all things an LLM can do naturally when instructed. They don't need to be engineered systems — they need to be prompt guidance. The closing metaphor (running out of oxygen) is already in the product's DNA and creates the "friend who has to go" feeling without any new logic.

**The ending experience:**
> Nerin: "We're running out of oxygen — time to head back to the surface 🤿 [one warm reflection about what Nerin noticed during the dive]"
> → System transitions to portrait generation. No user reply expected.

---

## 🛠️ PROTOTYPE: Make Ideas Tangible

### Prototype Approach

**Approach:** Prompt-level prototyping — concrete wording for each of the 5 tweaks, targeting specific files in the codebase. No new systems, no new architecture. These are edits to existing files.

**Files affected:**
1. `packages/domain/src/constants/nerin-chat-context.ts` — Strengthen breadth section
2. `packages/domain/src/utils/steering/realize-micro-intent.ts` — Flip domain streak from depth_push to domain_shift; remove nearingEnd → depth_push
3. `packages/domain/src/utils/nerin-system-prompt.ts` — Remove CONVERSATION CLOSING block
4. `packages/domain/src/constants/nerin-farewell.ts` — Rewrite with diving-themed goodbyes

### Prototype Description

#### Tweak 1: Strengthen breadth guidance (`nerin-chat-context.ts`)

**Current** `EXPLORING BREADTH` section says "explore breadth through connected threads" and "don't exhaust a topic" — but it doesn't enforce domain rotation or mention life domain coverage targets.

**Proposed replacement:**

```
EXPLORING BREADTH

Cover ground across their life, not just depth in one area.
Aim for at least 3 different life domains per conversation (work, relationships, daily life, hobbies/creativity, values/philosophy, emotional life).

After 3-4 exchanges in one domain, look for a hook the user already dropped — something they mentioned in passing — and use it to bridge into new territory. The callback shows you were listening:
- "You mentioned X earlier — I want to come back to that."
- "That's how you are at work. Are you different in your friendships?"
- "You said something about [hobby/interest] before — tell me about that side of you."

Contrast questions naturally open new domains while connecting to what you already explored.

Don't exhaust a topic. When you've gotten something interesting, leave it and bridge. Moving on isn't losing ground — it's mapping the full territory. You can always circle back.
```

#### Tweak 2: Flip domain streak logic (`realize-micro-intent.ts`)

**Current:** `domainStreak >= 3` → `depth_push` (goes deeper in same domain)
**Change to:** `domainStreak >= 3` → `domain_shift` (bridge to new domain)

This is a one-line change that flips the depth-first bias to breadth-first. The LLM already knows how to bridge naturally — it just needs the instruction to do so.

#### Tweak 3: Remove nearingEnd → depth_push (`realize-micro-intent.ts`)

**Current:** When `nearingEnd` is true, forces `depth_push` intent.
**Change to:** Remove this special case entirely. When nearing end, let normal steering continue. The farewell message handles the ending — Nerin doesn't need advance warning to "wind down."

#### Tweak 4: Remove CONVERSATION CLOSING block (`nerin-system-prompt.ts`)

**Current:** When `nearingEnd` is true, injects:
```
CONVERSATION CLOSING:
The conversation is nearing its natural end. Begin weaving your responses toward a warm, reflective closing.
Acknowledge what you've learned about the person and express genuine appreciation for the conversation.
Do NOT mention any assessment, scores, or results — just naturally wind down.
```

**Change:** Delete this entire block. This IS the soft landing. This is what produces the 3 questionless wrap-up messages. With this removed, Nerin stays at full intensity until the farewell message fires.

#### Tweak 5: Rewrite farewell messages (`nerin-farewell.ts`)

**Current farewells** (generic, no diving theme):
- "We've gone somewhere real today. I'm going to sit with everything you've told me..."
- "This was a good dive. I've been quietly building a picture of you..."
- "Thank you for going there with me. There's a thread running through everything..."

**Proposed farewells** (diving-themed, friend-who-has-to-go):
1. "We're running low on oxygen — time to head back up 🤿 I've been building something in my head this whole dive. Give me a moment to put it on paper."
2. "That's our oxygen for today — gotta surface 🤿 I've been quietly tracing a thread through everything you've said. Let me write it down for you."
3. "Tank's almost empty — we need to come up 🤿 There's more I wanted to explore, but what I've got is enough to write you something real. Hold tight."

**Design principles for farewells:**
- Oxygen as external constraint (not Nerin choosing to leave)
- Implies Nerin wanted to keep going ("there's more I wanted to explore")
- Transitions to portrait generation naturally
- No questions — this is the one exception to the "always ask" rule
- One message only. No wind-down sequence.

### Key Features to Test

1. **Does the breadth nudge actually produce domain rotation?** — Run test conversations and count life domains explored. Target: 3+ domains per conversation.
2. **Does the domain_shift at streak >= 3 feel natural or abrupt?** — The LLM's bridge quality when forced to shift after 3 turns in one domain.
3. **Does removing the soft landing cause any other issues?** — Verify Nerin doesn't produce its own wrap-up behavior without the CONVERSATION CLOSING instruction.
4. **Do the new farewells create the "friend who has to go" feeling?** — User testing: does the oxygen metaphor land? Does it create desire to return?
5. **Does the no-questionless-messages rule hold?** — Without the CONVERSATION CLOSING block, verify every Nerin message pre-farewell contains a question.
6. **Facet coverage improvement** — Compare facet evidence distribution before/after: are more of the 30 facets getting signal?

---

## ✅ TEST: Validate with Users

### Testing Plan

**Three-layer validation strategy:**

#### Layer 1: Retroactive Analysis (pre-implementation, no code)
- Re-read existing evaluation conversations in `_eval-output/`
- For each conversation, mark:
  - Where `domain_shift` would have fired (streak >= 3)
  - Which user-dropped hooks went unexplored
  - How many turns were wasted on soft landing (no question)
  - Projected facet coverage improvement
- If depth-first bias and wasted endings appear across multiple conversations → confirms systemic problem
- If some conversations show good breadth → study what was different (user behavior? steering luck?)

#### Layer 2: Conversation Testing (post-implementation)
- Run 3-5 new conversations with all 5 tweaks applied
- Metrics to compare before/after:

| Metric | Target |
|--------|--------|
| Life domains explored per conversation | >= 3 |
| Facets with evidence (of 30) | >= 15 |
| Turns without a question (pre-farewell) | 0 |
| Hooks followed up on (of hooks dropped) | >= 50% |
| Bridge naturalness | Feels earned, not forced |
| Farewell landing | Creates "I want more" feeling |

- **Critical risk to watch:** Does forced breadth at streak 3 break the depth magic? If bridges feel mechanical, consider increasing streak threshold to 4 or softening the breadth guidance.

#### Layer 3: User Feedback (real users)
After portrait delivery, collect 3 data points:
1. "Did you feel like Nerin understood you?" (yes / somewhat / no)
2. "How did the ending feel?" (wanted more / just right / awkward)
3. "Would you do this again?" (yes / maybe / no)

The conversation data tells the coverage story. The user tells the experience story.

### User Feedback

**Retroactive analysis of conversation 7d61673f (pre-tweak):**

Where tweaks would have changed behavior:
- **Message 6:** domain streak = 3 → `domain_shift` fires (currently `depth_push`). Nerin bridges from work to relationships or daily life.
- **Message 11:** User mentions sports with colleagues → hook harvested → Nerin circles back: "What's the dynamic like playing sports together vs working together?" Opens Gregariousness, Warmth, Excitement-Seeking.
- **Message 12:** User drops 4 hooks (fashion, art, philosophy, finance) → Nerin picks one: "Tell me about your visual sense — where does that come from?" Opens Aesthetics, Fantasy, Openness to Values.
- **Messages 17-19:** CONVERSATION CLOSING removed → Nerin keeps asking at full intensity. 3 additional data-collecting turns recovered.
- **Message 20:** New farewell: "Tank's almost empty — we need to come up 🤿 There's more I wanted to explore, but what I've got is enough to write you something real."

**Projected improvement:**
| Metric | Before Tweaks | After Tweaks (projected) |
|--------|--------------|------------------------|
| Life domains | 1 (work) + fragments | 3-4 (work, social, creativity, values) |
| Facets with evidence | ~6-8 / 30 | ~15-20 / 30 |
| Wasted turns | 3 (~25% budget) | 0 |
| Hooks explored | 0 / 5 | 2-3 / 5 |
| Ending feeling | Awkward, robotic | "I want more" (validated) |

### Key Learnings

1. **The soft landing was a regression.** The original hard cut was validated with multiple users as creating desire to return. The CONVERSATION CLOSING prompt block and nearingEnd → depth_push logic are the direct cause of the awkward ending. Removing them restores a proven mechanic.

2. **The depth-first bias is encoded in the steering logic, not just the prompt.** `domainStreak >= 3 → depth_push` literally tells the system to go deeper when it should bridge. One line change flips this.

3. **The prompt already describes breadth — but not strongly enough.** The EXPLORING BREADTH section mentions connected threads and not exhausting topics, but doesn't set domain coverage targets or explicitly instruct hook callbacks. Strengthening the language should be sufficient — the LLM capability is already there.

4. **Users drop hooks constantly — Nerin just doesn't pick them up.** In one conversation, the user mentioned fashion, art, sports, philosophy, finance, friendships, romantic loneliness, and vivid visualization. Zero were explored as new domains. The hooks are there. Nerin needs to be told to use them.

5. **Nerin's closing word matters — but only one.** The old version had no closure (too abrupt). The current version has three messages of empty closure (too much). One diving-themed farewell that implies "I wanted to keep going" is the sweet spot.

6. **The biggest risk is bridge naturalness.** If the domain_shift at streak 3 produces mechanical topic switches, the conversation magic breaks. Mitigation: callbacks to user-dropped hooks, contrast questions, and potentially adjusting the streak threshold based on testing.

---

## 🚀 Next Steps

### Refinements Needed

1. **Streak threshold may need tuning.** Starting at 3, but if bridges feel forced in testing, increase to 4. The right number balances breadth coverage with natural conversation flow.

2. **Breadth prompt wording may need softening.** If Nerin becomes too aggressive about switching domains (bridging even when the user is mid-revelation), soften from "after 3-4 exchanges, bridge" to "look for natural moments to bridge after spending time in one area." Let the micro-intent logic handle the hard constraint; let the prompt handle the tone.

3. **Farewell message wording — test with users.** The oxygen metaphor feels right to the team, but real users may react differently. If "running low on oxygen" feels alarming rather than warm, adjust to softer variants ("time to come up for air," "we're surfacing").

4. **Monitor for LLM self-generated wrap-ups.** Even without the CONVERSATION CLOSING prompt, the LLM might still produce wrap-up behavior on its own (trained instinct to close conversations). If this happens, add an explicit anti-instruction: "Never wrap up. Never say goodbye. The farewell system handles the ending."

### Action Items

**Implementation (5 edits, 4 files):**

| # | File | Change | Complexity |
|---|------|--------|-----------|
| 1 | `packages/domain/src/constants/nerin-chat-context.ts` | Replace EXPLORING BREADTH section with strengthened version (domain targets, hook callbacks, contrast questions) | Low — text swap |
| 2 | `packages/domain/src/utils/steering/realize-micro-intent.ts` | Change `domainStreak >= 3` from `depth_push` to `domain_shift` with bridge hint | Low — one line |
| 3 | `packages/domain/src/utils/steering/realize-micro-intent.ts` | Remove `nearingEnd → depth_push` special case (let normal steering continue) | Low — delete block |
| 4 | `packages/domain/src/utils/nerin-system-prompt.ts` | Delete CONVERSATION CLOSING block (the soft landing) | Low — delete block |
| 5 | `packages/domain/src/constants/nerin-farewell.ts` | Replace 3 farewell strings with diving-themed oxygen goodbyes | Low — text swap |

**Testing (post-implementation):**

| # | Action |
|---|--------|
| 6 | Retroactive analysis of existing eval conversations in `_eval-output/` — verify depth-first pattern is systemic |
| 7 | Run 3-5 new test conversations, measure domain count, facet coverage, bridge quality |
| 8 | Collect user feedback on ending (wanted more / just right / awkward) |
| 9 | If bridges feel forced at streak 3, increase threshold to 4 and retest |

**Validation:**

| # | Action |
|---|--------|
| 10 | Update existing unit tests for `realizeMicroIntent` to reflect new behavior (streak → domain_shift, no nearingEnd override) |
| 11 | Update `buildChatSystemPrompt` tests to verify no CONVERSATION CLOSING section is emitted |

### Success Metrics

| Metric | Current Baseline | Target | How to Measure |
|--------|-----------------|--------|---------------|
| Life domains per conversation | ~1 | >= 3 | Count distinct domains in evidence records |
| Facets with evidence (of 30) | ~6-8 | >= 15 | Count facets with at least 1 evidence record |
| Turns without question (pre-farewell) | ~3 | 0 | Manual review of conversation transcripts |
| User-dropped hooks explored | 0% | >= 50% | Manual review — count hooks mentioned vs followed |
| Ending user feeling | "Awkward, robotic" | "I want more" | Post-conversation feedback question |
| Would do again | Unknown | >= 80% yes | Post-conversation feedback question |
| Bridge naturalness | N/A | No user notices forced transitions | Post-conversation feedback: "Did the conversation flow naturally?" |

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
