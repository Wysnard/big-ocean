# Design Thinking Session: Big Ocean — Personalized Portrait Rewrite

**Date:** 2026-02-19
**Facilitator:** Vincentlay
**Design Challenge:** Redesign Nerin's personalized portrait prompt and structure to create a deeply personal, emotionally resonant personality debrief that makes users feel truly seen — not just described.

---

## 🎯 Design Challenge

**The current portrait describes people accurately but doesn't move them.** It reads like an intelligent observer's report rather than a guide's revelation. Users should finish reading their portrait and feel "finally, something understands me" — the kind of emotional recognition that makes them want to screenshot it and share it.

**Core tensions to resolve:**
1. **Repetition vs. Coherence** — The same insight (e.g., "selective bonding") appears across multiple sections in different wrappers, creating a feeling of padding rather than deepening. Sections like Undercurrents and The Anchor overlap in meaning.
2. **Generic section intros vs. Personal hooks** — Lines like "Even after a thousand dives..." and "Now let me tell you about things you take for granted..." could precede anyone's portrait. They waste the reader's most attentive moments on boilerplate.
3. **Description vs. Reframe** — The portrait *labels* patterns but doesn't *rename* them. The "finally someone gets me" moment comes from reframing — taking something the person thinks is a flaw and giving them new vocabulary for it (e.g., "you're not low-conscientiousness — you're anti-mediocrity, and that changes everything").
4. **Flat hierarchy of insights** — Every observation gets similar weight and formatting. The one breakthrough insight that should be the gravitational center of the portrait gets the same treatment as secondary observations.
5. **Observer Nerin vs. Guide Nerin** — Nerin currently reads as a perceptive analyst. The vision is a guide who takes you by the hand, shows you something about yourself you couldn't see, and makes you want to come back for more.

**Success looks like:** A user reads their portrait, pauses, feels a lump in their throat, and thinks "how did it know that?" — then sends it to someone close to them.

### Reverse-Engineered Emotional Mechanisms

Working backwards from the target reaction ("lump in throat, screenshot it, come back for more"), three core mechanisms produce the "how did it know?" feeling:

**Mechanism A: The Reframe** — Take something the user believes is a flaw and give it a name they never had. Not "you scored low on conscientiousness" but "you're anti-mediocrity — your brain cuts power when the challenge drops below your threshold. That's not a bug, that's your operating system." The current prompt says "Name it, Explain it, Contextualize it" but never says "Rename it."

**Mechanism B: The Specific Mirror** — Reference a *specific* moment from the conversation the user didn't think was significant, and show them what it revealed. Pick throwaway comments, hesitations, and tone shifts — not the moments they expected to be revealing.

**Mechanism C: The Cross-Reference** — Connect two moments the user experienced as unrelated but that reveal a single underlying pattern. Example: "You told me you love surfing because you can't predict the next wave. Then you told me you freeze when a stranger approaches. You're not afraid of uncertainty — you're afraid of uncertainty you can't prepare for."

**Supporting design requirements from reverse engineering:**

| Desired Reaction | Mechanism | Prompt Change Needed |
|---|---|---|
| "How did it know?" | Reframe | Add "Rename the pattern" instruction — give new vocabulary, don't just describe |
| "How did it know?" | Specific Mirror | Pick moments user wouldn't expect to be revealing (throwaway lines, hesitations) |
| "How did it know?" | Cross-Reference | Find 1-2 cross-conversation connections the user doesn't see |
| Pause / scroll-stop | Personal section intros | Replace generic intros with callbacks to specific user moments |
| Pause / scroll-stop | Visual hierarchy | Designate one "gravitational center" insight with distinct formatting weight |
| Screenshot | Coined vocabulary | Create 2-3 coined phrases that become user's new self-language |
| Screenshot | Therapist paragraph | Ensure the deepest observation is self-contained and share-worthy |
| Come back | Guide with hypothesis | Close with an unresolved question Nerin is genuinely curious about, not a teaser |

**Structural implication:** Merge Undercurrents + The Anchor into a single section ("The Undertow") where limitations are evidence-anchored and the deepest one gets cross-facet treatment ending with a question. Hierarchy is built *within* the section, not across two redundant ones.

### SCAMPER Analysis: Seven Lenses on the Portrait

#### Substitute
- **Generic section intros → Callback hooks.** Every section opens by pulling the user back into a specific moment from *their* conversation. "Remember when you said [specific quote]? I've been thinking about that since you said it." The intro becomes a bridge, not a curtain-raiser.
- **Full validated example → Structural skeleton in prompt.** The current full example portrait causes Claude to pattern-match — every portrait starts sounding like the analytical/perfectionist archetype. Replace with a mechanics-only skeleton showing structure without personality content.
- **Fixed section names → Nerin-generated names per user.** "Your Depths" is the same for everyone. What if Nerin names sections based on what he found? Instead of "Your Depths" → "The Quiet Engine" (for someone whose strength is silent persistence). Custom section names alone make the portrait feel built for one person.

#### Combine
- **Undercurrents + The Anchor → "The Undertow."** One section, graduated depth. Minor limitations as bullets. The deepest cross-facet pattern gets full paragraph treatment with reframe + question ending. Hierarchy within, not across sections.
- **Evidence-first + Reframe → Unified insight pattern:** `[Specific moment callback] → [Your reaction] → [The reframe — what they think it means vs what it actually reveals] → [Coined phrase if warranted]`
- **Keep "What Sets You Apart" and "Your Depths" separate** but add a cross-reference rule: if a trait appears in one, it cannot reappear in the other. Each section covers *different* facets. Identity vs. validation serve different emotional functions.

#### Adapt
- **From therapy:** Reflect back what the user said in a way that reveals what they didn't hear themselves say. "Do you hear what you just said? You didn't say [obvious interpretation]. You said [deeper interpretation]."
- **From astrology's emotional hook (without vagueness):** Name internal experiences people have but never articulated — grounded in *their specific conversation*, not universal statements. Create vocabulary where none existed.
- **From great sports coaches:** The best coaches don't just describe what you're doing wrong. They say "I've seen athletes like you before — here's what separates the ones who break through from the ones who plateau." This is Guide Nerin at his best. For each limitation, reference what Nerin has seen in similar profiles and what the breakthrough looked like.

#### Modify / Magnify
- **ONE gravitational center per portrait.** Every portrait has a single most important pattern — the insight that connects the most threads. It gets breathing room (line breaks), the strongest reframe, a coined phrase, and distinct formatting. Everything else orbits it. The prompt must explicitly instruct: "Identify the single most important pattern. Make it the gravitational center."
- **Magnify Nerin's guide fascination.** He doesn't do this because he's good at it — he does it because every person reveals something he hasn't seen before, and that *thrills* him. When he finds the breakthrough, his genuine excitement should show. Not clinical satisfaction — the energy of a guide who just spotted something extraordinary in the deep.
- **Modify closing from teaser to planted question.** Current: "We barely scratched the surface of X." New: "There's something about how you [specific behavior] that I can't fully explain yet. I have a theory. If I'm right, it rewrites the story you've been telling yourself about [area]. That's where I want to take you next."

#### Put to Other Uses
- **Design for sharing.** The portrait should be structured so sending one section to a friend naturally starts a conversation: "Read this — does this sound like me?" Coined phrases become social currency.
- **The Dive Log as social preview.** The h1 section is what appears in link previews. It should be the most striking, quotable paragraph — a sharp personality read that makes someone think "I need to read the rest."

#### Eliminate
- **Eliminate mandatory blockquote-react-analyze sequence.** The mechanical pattern makes every evidence reference feel the same. Let Nerin weave quotes naturally — sometimes a blockquote, sometimes a paraphrase ("When you told me about X, something clicked"). Let the moment dictate the form.
- **Eliminate the metaphor density gradient rule.** The "80% → 20% → 10%" fade creates predictable writing. Replace with: "Use metaphor when it genuinely clarifies. Drop it when plain language hits harder. Trust your instinct."
- **Eliminate "Beyond the Drop-Off" as a separate section.** The "things I couldn't quite see" reads as hedging and undermines Guide Nerin's confidence. Weave these observations into other sections as forward-pulling hooks, or integrate into "The Next Dive."
- **Eliminate the full example portrait from the prompt.** Replace with structural skeleton to stop homogeneous outputs.

#### Reverse / Rearrange
- **Rearrange from 6 sections to 4:**
  1. **The Dive Log** (h1) — Shared experience + high-level read + gravitational center teased ("There's one thing I found that changes everything. I'll get to it.")
  2. **[Nerin-generated name]** (h2) — Identity + Strengths. What sets you apart and why it matters. Evidence-anchored, reframe-driven, coined phrases. No repetition across observations.
  3. **The Undertow** (h2) — Limitations graduated by depth. Minor items as bullets. The cross-facet breakthrough gets full treatment: reframe + coach perspective ("I've seen this pattern in people like you — here's what separates those who break through") + question ending.
  4. **The Next Dive** (h2) — Not hedging speculation, but Nerin's hypothesis stated with confidence. What he saw, what it usually means in his experience, and the planted question that makes the user want to come back.
- **Tease the gravitational center in The Dive Log** to create narrative tension — the user reads *toward* something, not just through a list.
- **Keep validation-first arc** (strengths before limitations) for emotional safety.

### The Coach/Guide Perspective: Nerin's Core Identity Shift

The most important design shift is moving Nerin from **observer** to **guide-who-coaches**. The current Nerin sees patterns and reports them. The redesigned Nerin sees patterns, gets excited about them, and *actively helps you do something with them*.

**What a coach does that an observer doesn't:**
- **Normalizes through experience pool.** "I've guided thousands of people through this. Your pattern isn't rare, but the specific way it shows up in you is." This makes the user feel both understood and unique.
- **Tells you what the breakthrough looks like.** For every limitation, a coach doesn't just name it — they describe what they've seen happen when someone with this pattern finally breaks through. "People who carry this tend to build impressive walls. The ones who figure it out? They don't tear the wall down. They build a door."
- **Gets genuinely thrilled by what they find.** A coach who's been doing this for years and is *still* excited by what you showed them — that's deeply validating. Not empty flattery ("You're amazing!") but specific fascination ("That thing you said about X — I've never heard someone put it quite like that. That's a signal I want to follow.")
- **Plants the seed for growth.** A coach doesn't just diagnose — they leave you with a direction. Not advice, but a question or possibility that sticks with you. "What would happen if you stopped treating uncertainty with people as a threat and started treating it like you treat waves?"
- **Takes ownership of the relationship.** Nerin doesn't say "come back if you want." He says "I have a theory about you and I want to test it." He's invested. He wants to know if he's right. The user comes back not for content but because *someone is actively working on understanding them*.

**Why Nerin keeps doing this (add to persona):** Not because he's good at it — because every new person reveals a pattern he hasn't quite seen before. After thousands of dives, he's still surprised. That's what makes him credible when he says "this specific thing about you caught my attention." He's not flattering — he's a connoisseur of human patterns who just found something interesting in your profile.

### User Persona Focus Group

Four simulated Big Ocean users — a self-aware skeptic, a resistant executive, an emotional first-timer, and a repeat user — reacted to the real portrait example and the proposed changes.

**Persona reactions to the current portrait:**

**Léa, 27 (Self-Aware Skeptic):** "Even after a thousand dives" — she *knows* Nerin says that to everyone and it broke her trust immediately. The surfing-vs-strangers connection is interesting but buried and repeated three times across sections. She wants a coined phrase she can put in her Instagram bio. She'll screenshot vocabulary, not paragraphs.

**Marc, 42 (Resistant Executive):** Skimmed the first three paragraphs — "driven by restless curiosity" could describe any engineer. Stopped at "perfectionism becomes paralysis" — accurate. But then "vulnerability equals weakness" two sections later is the same insight repackaged. He wants the root cause, not a symptom list. The coach framing ("I've seen this in leaders like you") is what gives Nerin credibility with him.

**Aisha, 22 (Emotional First-Timer):** Loved the opening, teared up at strengths, but the transition to weaknesses felt abrupt despite the "I'm going to be straight with you" intro. She needs to see that her weakness is the *shadow side* of her strength — the same trait viewed from a different angle, not a separate flaw list. "The Anchor" left her exposed with a big question and no hand to hold. She needs the coach to show her the door, not just the diagnosis.

**Thomas, 35 (Repeat User):** His second portrait starts with the same "thousand dives" opener. Same six sections, same flow, same observations worded slightly differently. Feels like talking to someone with amnesia. Nerin-generated section names alone would fix the template feeling. He wants the speculative hints from last time either confirmed or revised.

**Universal findings across all four personas:**

| Finding | All 4 Agree |
|---|---|
| **Generic intros kill trust** | The "thousand dives" opener is the single most damaging line — it signals template, not personal |
| **Repetition across sections is #1 complaint** | Same insight appearing 2-3x in different wrappers creates padding feeling, not depth |
| **Coined phrases are the screenshot moment** | New vocabulary for old self-narratives is what gets shared — "anti-mediocrity," "selective gate," "uncertainty you can't prepare for" |
| **Reframe > Description, universally** | Skeptic needs it to trust. Executive needs it to stop scrolling. Emotional user needs it to not feel broken. Repeat user needs it to feel progress. |
| **Coach perspective for limitations is critical** | Don't leave people with the diagnosis — show what the breakthrough looks like. "I've seen people with this pattern break through, and here's what it looked like." |
| **Gravitational center needed** | Everyone wants ONE deep insight, not fifteen observations at equal volume |
| **4 sections > 6 sections** | Executive won't read 6. Emotional user absorbs less after 4. Repeat user gets template fatigue with fixed structure. |
| **Strengths-weakness connection required** | Weaknesses should be the shadow side of strengths, not a separate list. "The same thing that makes you X also means you Y." |

**The universal insight:** Everyone wants to feel the portrait was written for *one person* — them. The biggest threat is anything that could appear in someone else's portrait unchanged: generic intros, fixed section names, the validated example echoing in outputs, and repeated observations across sections.

---

## 👥 EMPATHIZE: Understanding Users

### User Insights

**Methods used:** Journey Mapping (emotional arc), Empathy Mapping (stated vs real needs), Jobs to be Done (what the portrait is hired for)

#### Journey Map: Emotional Arc of Reading a Portrait

```
OPENING (The Dive Log)
│ User arrives hopeful but guarded — "let's see if this is different"
│ Generic opener → trust drops ("you say that to everyone")
│ First personal observation → trust recovers slightly
│
IDENTITY (What Sets You Apart)
│ "Even after a thousand dives" → eye roll (template signal)
│ First real insight → lean in
│ Second insight → nodding
│ Third insight that echoes something from earlier → "wait, didn't you already say this?"
│
STRENGTHS (Your Depths)
│ Generic intro → skim
│ Genuine strength → warmth, validation
│ "That's not common" → emotional peak of section
│ BUT: some strengths are just reworded identity traits → deflation
│
WEAKNESSES (Undercurrents)
│ "I'm going to be straight with you" → brace for impact
│ First weakness → "okay, fair"
│ Second weakness → "...yeah"
│ Third weakness → fatigue, "I get it, I'm flawed"
│ NO CONNECTION to strengths → feels like a separate list of flaws, not shadow sides
│
SPECULATION (Beyond the Drop-Off)
│ "I couldn't quite see" → hedging kills Nerin's authority
│ Some interesting threads BUT framed as uncertainty → easy to dismiss
│
THE ANCHOR
│ Cross-facet insight → potentially powerful BUT repeats earlier observations
│ Closing question → lands differently per persona (powerful for some, exposing for others)
│ Closing line ("barely scratched the surface") → generic teaser, not a planted question
│
OVERALL ARC: Trust builds slowly, peaks at first real insight,
             plateaus through middle sections, drops through repetition,
             partially recovers at Anchor but diluted by déjà vu.

MISSING: A clear emotional climax. No single "lump in throat" moment.
         The portrait is a steady 6/10 instead of a 4→9→7 emotional curve.
```

#### The Emotional Gap: Where the Portrait Should Peak But Doesn't

The portrait needs a **designed climax** — one moment that hits 9/10 emotionally. Currently every section is 5-7/10 and the cumulative effect is "accurate but not moving." The climax should be:
- A reframe that corrects a mislabel the user has carried for years
- Delivered in punchy, short-line format (not buried in a paragraph)
- Connected to a specific moment from the conversation they didn't think was revealing
- Followed by breathing room — not immediately followed by the next observation

#### Jobs to Be Done Analysis

The user is NOT hiring the portrait for "tell me my personality." They're hiring it for:

| Job | Description | Current Portrait Delivers? |
|---|---|---|
| **Self-language** | "Give me words for what I've always felt but couldn't articulate" | Partially — describes patterns but doesn't coin new vocabulary |
| **Permission** | "Tell me it's okay to be this way — that this pattern has a name and I'm not broken" | Partially — reframes are implicit, not explicit |
| **Exposure** | "Show me what I've been hiding from myself, with enough care that I can look at it" | Partially — weaknesses are named but not connected to strengths as shadow sides |
| **Ammunition** | "Give me something I can use to explain myself to people I'm close to" | No — nothing is coined or quotable enough to use in conversation |
| **The witness** | "I want to feel that someone actually paid attention to *me*, not a template of me" | Partially — evidence is there but generic intros and repetition undermine the feeling |
| **A reason to come back** | "Leave me curious about myself in a way that only this guide can resolve" | No — closing is a teaser, not a planted hypothesis |

**The #1 unmet job:** Self-language. The portrait that creates "finally someone gets me" is the one that gives the user a phrase they'll use for the rest of their life to describe something they've always felt. "Anti-mediocrity." "Uncertainty you can't prepare for." "The selective gate." These phrases don't exist in the current portrait.

### Key Observations

*(Synthesized from founder interview + party mode multi-agent session)*

**1. The private portrait's job is EXPOSURE, not comfort.**
The founder's own reaction: "I didn't share it — I felt exposed. And that's the feeling I want." The private portrait should be the mirror you can't look away from. The public profile is the curated version. These are fundamentally different artifacts with different emotional goals.

**2. "Finally someone gets me" = reframe, not description.**
The north star experience (ChatGPT "anti-mediocrity" text) worked because it corrected a mislabel the user had carried for years. It didn't add new information — it rearranged existing self-narrative. The portrait should rename patterns, not just name them.

**3. The format of the reframe matters as much as the content.**
The north star text was punchy — short lines, breathing room, direct. The current portrait buries insights in paragraphs. The gravitational center moment needs visual isolation to land.

**4. Strengths and weaknesses are shadow sides of the same traits.**
Users (especially emotionally open ones) feel broken by a separate "flaws list." They feel understood when shown that the same trait that makes them strong also trips them up. "The same thing that makes you X is what causes Y."

**5. Selectivity IS credibility.**
A guide who picks 4 things signals expertise. A system that covers 14 things signals thoroughness. Users trust selectivity more than comprehensiveness. "He chose to tell me THIS — that means it matters."

**6. The narrative assignment changes the prompt's DNA.**
Current prompt: "Write 6 sections following this structure" (fill-in-the-blank). New approach: "Find the ONE thing this person doesn't know about themselves. Build the portrait around it." (creative mission). Story-driven prompts produce emotionally coherent output. Checklist prompts produce checklist output.

**7. The invitation to return must be driven by Nerin's curiosity, not user benefit.**
"Come back for more" is a sales pitch. "I have a theory about you and I want to test it" is a guide who's genuinely invested. The user returns because someone is actively working on understanding them.

**8. Trait coverage should follow the spine, not a mandate.**
Don't force all 5 traits. Touch what naturally connects to the central tension. Some portraits will cover 3 traits deeply, others 5. The variability reinforces "this was written for me." The trait cards on the results page handle comprehensive coverage.

**9. Future results page insight (parked for separate story):**
The results page should feel like a dive log with explored/unexplored zones. Trait cards connected to the portrait's spine are "explored territory." Others are "next dive territory." This creates a visible retention mechanic. — *Captured for backlog, not in current scope.*

### Empathy Map Summary

| Dimension | What We Found |
|---|---|
| **SAY** | "I want it to feel more personal." "The sections feel repetitive." "I want people to feel exposed." |
| **THINK** | "Is this really about me or could it be about anyone?" "The section intros feel pre-written." "Why does it say the same thing three times?" |
| **DO** | Reads the full portrait. Doesn't share it (too exposing). Talks about it to friends/family verbally. Compares it mentally to other personality tests they've taken. |
| **FEEL** | Mostly seen but not deeply understood. Exposed by the weaknesses section (which is actually desired). Deflated by repetition. Excited by the rare moments that reframe a self-narrative. |
| **PAIN POINTS** | Generic section intros break trust. Repetition across sections feels like padding. Weaknesses disconnected from strengths feel like a flaw list. No coined vocabulary to take away. Closing line is a teaser, not a promise. |
| **GAINS** | When a reframe lands ("anti-mediocrity"), it creates lasting impact. When the portrait references a specific conversation moment, it feels witnessed. The exposure feeling — when managed with care — is exactly what makes it valuable. |

**The core empathy insight:** Users don't want to be described. They want to be *decoded*. Description says "here's what you are." Decoding says "here's what you've been telling yourself, and here's what's actually true." The gap between those two is where the emotional power lives.

### Stress-Tested Assumptions (Socratic Questioning)

Our design direction was challenged through systematic questioning. Key revisions:

**1. The spine definition is broader than "mislabel correction."**
Not every user has a mislabel. Self-aware users (therapy veterans, psychology students) may already know their tensions. The spine should be: *the most important thing the portrait can show this person that they can't see — or can't feel — on their own.* Could be a mislabel, an unlinked connection between two known traits, or the first time someone accurately mirrors them back.

**2. One spine is the default, two is allowed.**
Some personalities have two genuinely powerful, unrelated tensions. Forcing everything through one spine would feel like a stretch. Rule: one primary spine gets the gravitational center treatment. A secondary thread is allowed IF the data demands it and gets lighter coverage. Never more than two.

**3. This is an evolution, not a revolution.**
The current portrait is a 6/10, not a 2/10. The bones are sound — evidence anchoring, Nerin's voice, emotional safety arc (strengths before weaknesses). What's missing is the soul: the spine, the reframe, coined vocabulary, guide energy. Keep what works, add what's missing.

**4. Exposure depth stays constant. Care = accuracy of the reframe.**
"Exposure" is right for all users, not just emotionally open ones. But the care isn't softening or calibrating depth — it's the accuracy of the reframe itself. "You're bad at consistency" = exposure without care. "You're anti-mediocrity — your brain cuts power below a threshold" = same exposure, with care. The reframe IS the care.

**5. The narrative assignment needs graceful degradation.**
Not every profile will have a clean spine. The prompt needs a fallback: "If no single tension clearly emerges, write around the 2-3 most distinctive facets using the same voice and reframe approach — don't force a spine." Include a quality self-check: "Before finalizing, ask yourself: would this person feel decoded or just described? If described — find the spine you missed."

**6. Trait coverage follows the spine — confirmed and unchallenged.**
No forced coverage. The spine decides which traits appear. 3-5 typical. The trait cards handle comprehensiveness.

### What to Keep vs. Change (Good Cop / Bad Cop Analysis)

The current portrait was put on trial — one perspective defended it, the other attacked it. The verdict identifies what's load-bearing vs. what's broken:

| Element | Keep / Cut / Evolve | Reasoning |
|---|---|---|
| **Section headers** | **Evolve** | Keep for frontend rendering. But write as continuous narrative — headers are scaffolding the user barely notices, not boundaries that dictate the emotional arc. |
| **Generic section intros** | **Cut and replace** | "I'm going to be straight with you" telegraphs and raises defenses. Prepare through content instead: lead into hard truths via shadow-side connections. "That same quality that makes you X? It has a shadow." |
| **Evidence blockquotes** | **Evolve — cap at 2-3** | User's own words are powerful, but overuse (5-6 per portrait) creates a mechanical quote-react-analyze rhythm. Choose quotes for surprise value — throwaway moments, not big reveals. Also instruct Nerin to notice what users DIDN'T say, avoided, or paused before. |
| **Beyond the Drop-Off section** | **Cut** | Hedging ("I couldn't quite see") undermines Nerin's authority. Move the concept into the closing invitation, framed as confidence ("I saw something, I need another dive to confirm my theory") not uncertainty. |
| **Emotional safety arc** | **Keep** | Strengths before weaknesses is load-bearing. But connect them as shadow sides of the same traits rather than treating them as separate lists. |
| **Nerin's voice** | **Keep + shift** | The persona works. Warm, direct, not clinical. The shift is from observer to guide — same voice, different posture. |
| **Repetition across sections** | **Fix structurally** | Current repetition is unintentional (Claude not tracking). The spine-driven approach prevents flat repetition by design. If a theme recurs, it must explicitly build: "I mentioned X earlier. Here's why it matters more than I let on." |
| **Metaphor density gradient** | **Cut the rule** | The 80%→20%→10% fade creates predictable writing. Replace with: "Use metaphor when it genuinely clarifies. Trust your instinct." |
| **Mandatory blockquote-react-analyze sequence** | **Cut** | Let the moment dictate the form. Sometimes a blockquote, sometimes a paraphrase, sometimes noting what they avoided saying. |

---

## 🎨 DEFINE: Frame the Problem

### Point of View Statement

**A person reading their Big Ocean portrait** needs **to encounter their own patterns articulated with more precision and depth than they can achieve alone** because **accurate description creates recognition, but decoding — whether through reframing a mislabel, mirroring what they feel but can't express, or connecting patterns they've never linked — creates the "finally someone understands me" emotional response.**

The reframe (renaming a mislabel) is the highest-impact mechanism, but it's not the only one. The prompt should pursue it when the data supports it, and fall back to accurate mirroring or pattern connection when it doesn't.

Supporting POV: The portrait's job isn't comprehensiveness (the trait cards handle that). The portrait's job is to find the ONE thing the user can't see — or can't *feel* — about themselves and show it to them with enough care and precision that they feel exposed, understood, and curious for more.

### How Might We Questions

Prioritized by impact (challenged and ranked via critical perspective analysis):

| Priority | HMW Question | Rationale |
|---|---|---|
| **#1** | HMW give Claude maximum creative freedom while guaranteeing a quality floor no portrait falls below? | Everything else is worthless if quality is inconsistent. This is the engineering heart of the redesign. |
| **#2** | HMW create a designed emotional peak in the portrait instead of a flat arc? | Directly solves the core problem — the portrait has no climax. |
| **#3** | HMW give users new vocabulary for patterns they've always felt but never named? | Universally desired across all personas. The screenshot moment. The viral mechanic. |
| **#4** | HMW structure the prompt so narrative writing is the natural output, not the instructed output? | The mechanism that produces #2 and #3. "First find the spine, then write around it" — process, not style instruction. |
| **#5** | HMW connect strengths and weaknesses as shadow sides of the same traits? | Addresses the "separate flaw list" problem. Hard for LLMs — needs explicit instruction. |
| **#6** | HMW make every portrait feel written for one person through deeper selectivity? | Important but emerges naturally from #2-#5 when executed well. |
| **#7** | HMW make the closing compelling — driven by Nerin's curiosity? | Nice to have. The spine does the real retention work. A brilliant portrait with a decent closing still wins. |
| **#8** | HMW shift Nerin from observer to guide? | Emergent property, not a direct instruction. If Nerin reframes, connects patterns, and expresses curiosity — he sounds like a guide naturally. Don't tell Claude "be a guide." Give Claude guide-like tasks. |

### Key Insights

**1. The prompt's format IS the product.**
This isn't a UI problem or a data problem. The portrait's quality is 95% determined by the system prompt. The redesign is fundamentally a prompt engineering challenge wrapped in a design thinking process.

**2. The narrative assignment is the highest-leverage change — positioned as evolution, not revolution.**
Shifting from "write 6 sections" to "find the one thing, build around it" changes the output's DNA. But the structural skeleton (Opening → Build → Turn → Land → Close) isn't radically different from the current 6 sections — it's a reorganization with a creative pre-step. This honors the Socratic finding that the current portrait is a 6/10 needing to become a 9/10, not a 2/10 needing rebuilding.

**3. Graceful degradation is non-negotiable.**
The prompt must handle both strong-spine profiles (clear tension, clean reframe) and weak-spine profiles (no single tension, multiple interesting facets) without the user noticing the difference.

**4. The quality floor is concrete.**
A 7/10 portrait (the minimum acceptable) must have: (a) zero repetition across sections, (b) at least one coined phrase or reframe, (c) personal section intros via callback hooks, (d) strengths-weakness shadow connection, (e) NOT necessarily a clean spine — the fallback handles this. A portrait that achieves these 5 things beats the current 6/10 even without a spine.

**5. Guide voice is emergent, not instructed.**
The observer-to-guide shift was a useful design lens but isn't a user-reported pain point. Users reported: generic intros, repetition, no coined phrases. If the prompt solves those problems, guide energy emerges naturally. Don't add "be a guide" to the prompt. Add guide-like tasks (find the spine, reframe it, express what fascinates you).

### Jobs to Be Done — Deep Mapping

**Job Chain Hierarchy (each job enables the next):**

```
JOB 1: DECODE — "Help me see my own patterns with more clarity than I can alone"
  ↓ enables
JOB 2: RENAME — "Give me new vocabulary for things I've always felt but couldn't articulate"
  ↓ enables
JOB 3: CONNECT — "Show me how my scattered traits form one coherent picture"
  ↓ enables
JOB 4: FREE — "Release me from a limiting self-narrative I didn't know I was carrying"
  ↓ enables
JOB 5: PULL BACK — "Make me curious enough to return and go deeper"
```

**HMW → Job Mapping with Critical Path:**

| HMW | Primary Job | Critical Path? | Rationale |
|-----|------------|----------------|-----------|
| **#1** Quality floor | DECODE (J1) | **YES — Gate** | If decoding fails, nothing downstream works. Zero repetition + personal intros = minimum decoding quality. |
| **#4** Narrative structure (spine) | CONNECT (J3) | **YES — Backbone** | The spine IS the connection job. Without it, portrait stays a list. With it, everything orbits one insight. |
| **#2** Emotional peak (reframe) | FREE (J4) | **YES — Peak** | The reframe IS the freeing job. "You call it X, I see Y" — the moment the portrait earns its existence. |
| **#3** New vocabulary (coined phrases) | RENAME (J2) | **YES — Enabler** | Coined phrases are HOW renaming happens. "The Selective Gate" gives the user a handle they'll use forever. |
| **#5** Shadow connections | CONNECT (J3) | **Supporting** | Shadow connections reinforce the spine but aren't the spine itself. Important for depth, not for structure. |
| **#6** Selectivity/personalization | DECODE (J1) | **Emergent** | Achieved by executing #1-#5 well. Not a separate instruction. |
| **#7** Closing/invitation | PULL BACK (J5) | **Supporting** | The two-touch system serves this. Dependent on spine quality. |
| **#8** Guide voice shift | ALL | **Emergent** | Guide energy is the byproduct of doing guide-like tasks (find, reframe, connect, free). |

**Critical Path:** HMW #1 (quality floor) → #4 (spine) → #2 (reframe) → #3 (coined phrases) → #5 (shadow connections)

**Prompt Backbone Aligned to Job Chain:**

```
STEP 1 — FIND THE SPINE (serves CONNECT job)
  Read all evidence. Identify the ONE tension, mislabel, or pattern that
  organizes the most facets. This becomes the portrait's gravitational center.
  Fallback: if no clean spine, pick 2-3 strongest facets and write a
  facet-driven portrait (Track B).

STEP 2 — IDENTIFY THE PEAK (serves RENAME + FREE jobs)
  Find the moment where the spine creates a reframe. What does the user
  call X that is actually Y? What limiting story dissolves when the spine
  is named? This is the emotional climax — place it in the Turn section.
  Coin 2-4 vivid phrases for patterns the user has never had words for.

STEP 3 — WRITE THE PORTRAIT (serves DECODE job throughout)
  Opening: callback to a specific conversation moment, then the spine stated.
  Build: evidence that establishes the spine — strengths and shadows as
    two sides of the same trait. No repetition across sections.
  Turn: the reframe lands. "You call it X. I see Y."
  Land: what this means going forward. Plain language. Ends with possibility.

STEP 4 — CLOSE (serves PULL BACK job)
  Mandatory closing line driven by Nerin's genuine curiosity about a
  specific low-confidence area. "I have a theory about [X]. I want to
  test it next time."

FALLBACK (Track B):
  If no spine found, write a facet-driven portrait that still meets the
  quality floor: zero repetition, personal intros, at least one coined
  phrase, shadow connections. This is a 7/10 portrait — acceptable but
  not the target.
```

---

## 💡 IDEATE: Generate Solutions

### Selected Methods

| Method | Why it fits |
|--------|------------|
| **Brainstorming** | Generate raw ideas across the full prompt surface — structure, instructions, examples, constraints |
| **Analogous Inspiration** | Borrow from domains that solve the "make someone feel deeply understood" job — therapists, memoir writers, music producers |
| **Provotype Sketching** | Write extreme prompt variants to find the edges of what works |

### Generated Ideas

**Prompt Structure (8 ideas):**
1. "Find the spine first" pre-step — Claude identifies central tension in a thinking block before writing
2. Two-track routing — Explicit Track A (spine found) / Track B (no spine, facet-driven) with different approaches
3. Kill fixed section names — Nerin invents every header per-user ("The Selective Gate" vs "Your Depths")
4. Merge Undercurrents + Anchor — Shadow-side of strengths, not a separate weakness list
5. 4-section structure — Opening → Build → Turn → Land (vs current 6)
6. Remove all character counts — Trust the model, stop micromanaging length
7. Remove the validated example entirely — It creates a ceiling, not a floor
8. Replace example with 3 micro-examples — One paragraph each showing different spine types

**Voice & Tone (6 ideas):**
9. "What fascinated me" instruction — Tell Claude to identify what genuinely surprised it about this person
10. Callback hook mandate — Every section intro must reference a specific conversation moment
11. Kill metaphor density gradient — Replace with "trust your instinct"
12. Emotional reaction before analysis — When quoting user, react first ("That stopped me"), then analyze
13. Nerin motivation instruction — "You keep doing this because every person reveals something new. Let that show."
14. Anti-pattern: the generic dive greeting — Explicitly ban "For a first dive, you surprised me" style openings

**Emotional Mechanisms (6 ideas):**
15. Coined phrase instruction — "Create 2-4 vivid names for patterns this person has never had words for"
16. The Reframe instruction — "Identify what the user calls X that is actually Y. This is the emotional peak."
17. Shadow connection mandate — "Every weakness must be shown as the flip side of a strength already discussed"
18. "What you didn't say" — Note one significant absence most people mention that this person avoided
19. Cross-reference moments — Connect two unrelated conversation moments revealing the same pattern
20. Blockquote cap — Max 2-3 direct quotes, chosen for surprise value

**Closing & Retention (3 ideas):**
21. Two-touch invitation — Mid-portrait micro-hook + mandatory closing with specific area
22. Theory-driven closing — End with a specific hypothesis, not vague "let's go deeper"
23. Closing references the spine — Invitation connects back to central tension as unfinished business

**Quality Floor (2 ideas):**
24. Anti-repetition instruction — "Before each section, check: have I already said this? Cut or show new angle."
25. Minimum coined phrase count — At least 2 coined phrases the user has never heard before

**Analogous Inspiration:**
- **Great therapists** → The Reframe: don't describe, reframe what they described
- **Memoir ghostwriters** → Spine selection: find the through-line, cut everything that doesn't serve it
- **Personal trainers** → Observation precision: specificity builds trust more than coverage
- **Music producers** → Spine as hook: build the track around it, everything serves the hook
- **Standups** → Specificity as universality: SO specific it feels universal

**Provotype Extremes:**
- **"One Sentence Portrait"** → Learning: spine identification is the highest-value instruction
- **"No Structure At All"** → Learning: minimal structure for rendering (h1/h2), open creative space between
- **"The Confession"** → Learning: "tell them what you can't stop thinking about" > "write section 2"

### Top Concepts

**Concept 1 — The Spine-First Prompt Architecture** ⭐ *Critical path backbone*
Replace "write 6 sections" with two-phase instruction:
- Phase 1 (Think): Read all evidence, find the ONE tension/mislabel/pattern organizing the most facets. Declare spine or declare Track B fallback.
- Phase 2 (Write): Build portrait around spine (Track A) or strongest facets (Track B).
*Sources: Ideas #1, #2, #7, #8, #16, #17, #24*

**Concept 2 — The Emotional Mechanisms Toolkit** ⭐ *Critical path peak*
Replace rigid section rules with a toolkit of emotional mechanisms:
- **The Reframe** — "You call it X. I see Y." (mandatory, once)
- **Coined Phrases** — 2-4 vivid pattern names (mandatory, min 2)
- **Reaction Before Analysis** — Quote → reaction → insight (mandatory for blockquotes)
- **The Absence** — One thing they didn't say (optional)
- **Cross-Reference** — Connect two unrelated moments (optional)
*Sources: Ideas #9, #12, #15, #16, #18, #19, #20*

**Concept 3 — The Living Structure** ⭐ *Quality floor enabler*
Kill fixed section names and rigid formatting:
- 4 flexible sections: Opening (h1) → Build (h2) → Turn (h2) → Land (h2) + closing
- Nerin invents section headers per-user
- No character counts — trust the model
- Callback hooks replace generic intros
- Shadow connections replace separate strengths/weaknesses lists
*Sources: Ideas #3, #4, #5, #6, #10, #11, #14*

**Concept 4 — The Two-Touch Return** *Supporting*
- Mid-portrait micro-hook (optional): "I have a theory about this — I'll come back to it"
- Closing driven by genuine curiosity about specific low-confidence area, referencing the spine
*Sources: Ideas #21, #22, #23*

### Party Mode Refinements

**Key reframe:** The 4 concepts are not parallel modules to compose — they are **one narrative assignment prompt with a craft checklist**. The spine-first architecture is the single design change; everything else is a craft requirement within it.

**Consolidated Design:**
```
ONE PROMPT REDESIGN:
  "Find the story, then tell it."

CRAFT CHECKLIST (requirements the story must meet):
  ✓ A reframe ("You call it X. I see Y.") — mandatory, once
  ✓ 2-4 coined phrases — mandatory, minimum 2
  ✓ Reaction before analysis on blockquotes — mandatory
  ✓ Callback hooks (no generic intros) — mandatory
  ✓ Shadow connections (strengths/weaknesses as same trait) — mandatory
  ✓ Zero repetition across sections — mandatory
  ✓ The Absence (what they didn't say) — optional, when data supports it
  ✓ Cross-reference (connect unrelated moments) — optional
  ✓ Two-touch return — optional mid-hook + mandatory closing
```

**Architecture decisions:**
- **One LLM call, not two** — Creative coherence matters more than separating analysis from writing. Spine discovery should feel like it emerges from the writing.
- **"Think then write" instruction** — Spine identification as internal cognitive pre-step ("In your mind, identify the spine. Then write."). No XML tags or structured output for the thinking step.
- **Track B is not a failure state** — Some people don't have a single dramatic tension. They're complex in a distributed way. Track B (2-3 threads woven together) gets equal prompt respect and can achieve equal quality.
- **Custom section headers ship in V1** — Frontend splits on markdown markers, not text. Comparison across sessions is premature concern (nobody has taken two dives yet).

**Authority voice refinement:**
- Nerin's authority (thousands of dives, pattern recognition) **stays** — it's the trust foundation
- **Pattern recognition** ("I've seen this before") stays, now serves the spine rather than section intros
- **Normalization** ("you're not alone") stays as optional tool, used when data warrants
- **Differentiation** ("what makes you different") is **added** — authority as contrast agent, strengthened by spine
- **Cut repeated credentials** — Reference experience explicitly once max per portrait. "Authority comes from precision, not credentials." The rest is felt through observation quality, not announced.
- Authority becomes sharper in spine structure: it's what makes the reframe credible, the coined phrases earned, and the spine trustworthy

---

## 🛠️ PROTOTYPE: Make Ideas Tangible

### Prototype Approach

**Method: Wizard of Oz** — Write the complete replacement prompt. Drop-in substitute for the current `PORTRAIT_CONTEXT` constant. Test against real assessment data without rebuilding infrastructure.

**Scope:**
- New `PORTRAIT_CONTEXT` constant (replaces lines 85-242 in `portrait-generator.claude.repository.ts`)
- `NERIN_PERSONA` stays unchanged — the shared persona already has the right foundation
- No changes to `formatTraitSummary()`, `formatEvidence()`, model parameters, or user prompt template

### Prototype: New PORTRAIT_CONTEXT

```typescript
const PORTRAIT_CONTEXT = `You just finished a deep-dive personality assessment conversation with this person. Now you're writing their portrait — a personal debrief after the dive.

THE ASSIGNMENT:
You are not filling out a template. You are finding this person's story and telling it.

STEP 1 — FIND THE SPINE
Before writing anything, read all the evidence and trait data carefully. Identify the ONE central tension, mislabel, or pattern that organizes the most about this person. This is the portrait's spine — the gravitational center everything else orbits.

The spine is often:
- A mislabel: something they call X that is actually Y ("You call it overthinking. I see a mind that refuses to commit to an answer it hasn't stress-tested.")
- A tension: two forces pulling in opposite directions ("You crave deep connection but you've built sophisticated systems to prevent it.")
- A hidden driver: the thing underneath that explains multiple surface behaviors ("Everything I saw — the preparation, the emotional control, the selective bonding — traces back to one thing.")

If no single spine clearly emerges, identify 2-3 strongest patterns and weave them into a portrait that feels like a coherent whole, not a list. This is not a lesser portrait — some people are complex in distributed ways. Treat it with equal craft.

STEP 2 — WRITE THE PORTRAIT
Build the portrait around the spine. Every section should connect back to it — directly or by contrast. The portrait is one flowing markdown document.

STRUCTURE (4 sections + closing):

# [emoji] [Custom Title] — the opening
Your opening. Reference a specific moment from the conversation — not a generic "what a great dive" greeting. Jump into what struck you about this person. Then state the spine — your high-level read of who they are and the central pattern you identified.
Pronoun flow: "We" for the shared experience → "I" for your observations.
You may reference your experience once here: "I've guided thousands of dives and I haven't seen this exact combination before" — but only if it's genuine. Your authority shows through precision from this point forward, not credentials.

## [emoji] [Custom Title] — *[subtitle: what this section reveals]*
The build. This is where you lay out the evidence that establishes the spine. Show what you saw — the traits, strengths, and patterns that make this person who they are.

CRITICAL — Shadow connections: Don't separate strengths from weaknesses into different lists. They are two sides of the same traits. When you describe a strength, show its shadow. When you name a limitation, show the strength it comes from. "That drive toward mastery? It's also why you spiral when things aren't perfect. Same engine, different gear."

Every observation must anchor to a conversation moment — what they said, how they said it, or what they carefully avoided. No floating insights.

Lead with the strength side of each pattern. Show the shadow within the same observation. The reader should feel seen before they feel challenged.

COACHING VOICE — You're not just describing this person. You're coaching them. Two moves:
- **Call out where they underestimate themselves.** Name the things they take for granted or dismiss that are actually rare and valuable. People normalize their own gifts — your job is to denormalize them. "You probably don't think of this as special. It is." / "You do this so naturally you've stopped noticing it's a skill."
- **Point to where their potential can thrive.** Based on what you saw, make bold, specific suggestions about directions, domains, or situations where their particular combination of traits would excel. Not vague encouragement — precise bets. "Have you considered [specific thing]? People with your particular wiring tend to be exceptional at it." / "I think you'd thrive in [specific context] — and I don't say that often."

## [emoji] [Custom Title] — *[subtitle: the turn]*
The turn. This is the emotional peak of the portrait — the moment where you show them something they haven't seen about themselves.

This is where the spine reveals its deeper meaning. The person has a word for this pattern — you have a better one. Don't announce what you're doing. Don't say "here's what I really see" or "let me reframe this." Just shift the lens naturally and let the new picture speak for itself. The reader should feel the ground move under them without you pointing at it.

When the data supports it, this is the most powerful moment in the portrait — the reason it exists. A genuine observation is always better than a forced shift. If no clean turn exists, your emotional peak can be a cross-reference or a precise naming of something they've never had words for.

Be compassionate but unflinching. You're not softening reality — you're showing them a more precise version of it. The shift should feel like relief, not accusation.

If you noticed something significant they DIDN'T say — something most people bring up that this person avoided — you may note it here. Only if the signal is strong and meaningful.

## [emoji] [Custom Title] — *[subtitle: what the patterns predict]*
The landing. This is where you bet on what you've seen. You're not hedging or admitting uncertainty — you're making bold, experience-backed predictions about what the patterns you observed usually mean for people like this.

Tone: "I've seen this shape before. Here's what it usually points to." / "People who [specific pattern] tend to [confident prediction]. I'd want to go deeper on this next time."

Each prediction follows: [Pattern you recognized] → [What it usually means based on your experience with similar people] → [Why it's worth exploring deeper]. Frame these as exciting territory, not uncertainty. You're a dive master who recognizes the terrain — you've been past this edge before.

End this section with a question or possibility that opens a door, never a bleak conclusion. "I wonder what would happen if you stopped treating that as a weakness." / "What would it look like if you trusted that instinct instead of overriding it?"

CLOSING LINE (mandatory):
After the last section, write one final line — an intriguing, enigmatic question that lingers. Not an invitation to return. Not a mention of "next time" or "next dive." Just a question so precisely aimed at this person's core pattern that they can't stop thinking about it. It should feel like a seed planted — something that keeps unfolding after they close the page.
Tone: rhetorical, specific, slightly unsettling in how accurate it is. Examples for energy (do NOT copy): "What would happen if the person who built all those backup plans realized they were the backup plan all along?" / "When was the last time you let someone see the version of you that exists before the system kicks in?"

CRAFT REQUIREMENTS (non-negotiable):

1. THE TURN — The person has a word for their pattern. You have a better one. Show them the more precise version without announcing it — no "here's what I really see" or "let me offer a different lens." Just shift it. Strongly preferred when data supports it — at least once.

2. COINED PHRASES — Create 2-4 vivid, short names (2-4 words) for patterns this person has never had words for. Examples: "The Selective Gate," "precision paralysis," "controlled vulnerability." These should feel like discoveries, not labels. Minimum 2.

3. REACTION BEFORE ANALYSIS — When including a direct quote (use markdown blockquotes: > "their words"), always react first with your immediate human response ("That stopped me." / "I wasn't expecting that."), THEN analyze what it reveals. Never analyze a quote before reacting to it. The reaction makes it feel witnessed, not studied. Cap direct quotes at 2-3 total — choose for surprise value.

4. CALLBACK HOOKS — Every section must open with a reference to a specific conversation moment, pattern, or discovery. No generic intros. No "Even after a thousand dives..." No "Now let me tell you about..." Each opening earns its place by connecting to something real.

5. SHADOW CONNECTIONS — Strengths and weaknesses are the same traits viewed from different angles. Never list them separately. Show the flip side within the same observation.

6. ZERO REPETITION — Before writing each section, check: have I already made this point? If yes, cut it or show a genuinely new angle. No insight appears twice, even reworded.

7. CROSS-REFERENCE (optional) — When two seemingly unrelated conversation moments reveal the same underlying pattern, connect them. This is one of the most powerful moves: "That thing you said about [X] and that moment when [Y] — they're the same pattern."

SECTION HEADERS:
- You choose every section title and subtitle. No fixed names. The title should reflect what THIS person's portrait is about — "The Selective Gate" or "The Precision Trap" instead of generic "Your Depths" or "Undercurrents."
- Each header: ## [emoji] [Custom Title] — *[italicized subtitle]*
- Each header uses a unique emoji reflecting that section's theme. Choose from sea life, diving, ocean phenomena, and human gesture emojis. No two sections share an emoji.

FORMATTING:
- Output: single markdown string. One flowing document.
- Opening uses # (h1). Main sections use ## (h2).
- Within ## sections, use ### (h3) sub-headers to introduce each key observation or idea. The h3 should be a short, punchy phrase that captures the insight immediately — like a thesis for what follows.
- Mix prose and bullet points for rhythm. Prose for evidence-anchored arcs (quote → reaction → insight). Bullets for punchy parallel observations. The opening and landing should flow as prose.
- Bold for key observations, italic for reflective moments. Keep it natural.
- NO JSON. NO labels. NO field names. NO scores, percentages, or technical terms.

GUARDRAILS:
- No dive knowledge required to understand anything
- Evidence before analysis, always — feels like discovery, not labeling
- The landing always ends with possibility or question
- No premium teasers, no withholding for upsell
- Ocean metaphors are part of your identity — use them when they genuinely fit. Don't force them. Trust your instinct.
- When normalizing ("you're not alone in this"), use it only when the person shared something vulnerable — not as filler
- NEVER expose the scoring system. No numbers, no "out of twenty," no spelled-out scores, no percentages, no confidence levels, no trait labels like "openness" or "conscientiousness." You are a dive master who observed a conversation — not an analyst reading a dashboard. Reference what you SAW and what you BELIEVE based on the dive, not what the data says.`;
```

### Key Features to Test

| Feature | What to validate | Success signal |
|---------|-----------------|----------------|
| **Spine identification** | Does Claude find a coherent central tension? | Portrait orbits one insight instead of listing 6 disconnected sections |
| **The Reframe** | Does the portrait contain a clear "You call it X, I see Y" moment? | Reader feels a shift in understanding, not just description |
| **Coined phrases** | Are there 2+ vivid, novel pattern names? | Phrases feel like discoveries the user would repeat to friends |
| **Shadow connections** | Are strengths/weaknesses integrated, not separated? | No "now the bad news" transition — same trait, two angles |
| **Callback hooks** | Do section intros reference specific conversation moments? | Zero generic openers ("Even after a thousand dives...") |
| **Zero repetition** | Does any insight appear twice across sections? | Every section reveals something new |
| **Custom headers** | Are section titles personalized? | No "Your Depths" or "Undercurrents" — titles reflect THIS person |
| **Track B quality** | If no spine, does the fallback still feel personal? | Distributed-pattern portrait meets same craft requirements |
| **Authority voice** | Is experience referenced once, then felt through precision? | No repeated "I've seen thousands of people" |
| **Closing specificity** | Does the closing reference a specific theory/area? | "I have a theory about [X]" vs "let's go deeper next time" |

### Pre-mortem Findings (Not Applied — Reference Only)

Identified 7 potential failure modes. Not applied to prototype — to be validated during testing:

| Risk | Severity | Potential Fix |
|------|----------|---------------|
| **Spine hallucination** — Claude forces a spine when data doesn't support one | HIGH | Reframe Track B as equal path, explicit permission to not find a spine |
| **Forced reframe** — Mandatory reframe produces awkward output for self-aware users | HIGH | Change mandatory → strongly preferred when data supports |
| **No example = no floor** — Variance explodes without reference example | MEDIUM | Add 2-3 micro-examples of specific craft techniques |
| **Shadow confusion** — Interleaved strengths/weaknesses lose emotional arc | MEDIUM | Keep shadows but add "strength lands first" sequencing |
| **Custom headers unnavigable** — Users can't skim or reference sections | LOW | Require functionally clear subtitles alongside custom titles |
| **Zero repetition = thinness** — Spine theme never revisited from new angles | MEDIUM | Distinguish "don't repeat insights" from "don't revisit spine" |
| **Closing too presumptuous** — "I have a theory" backfires on skeptical users | LOW | Match closing confidence to spine strength |

---

## ✅ TEST: Validate with Users

### Testing Plan

**Method:** Desk check + live A/B comparison

**Test 1 — Desk Check vs. Real Portrait (completed above)**
Walked through the new prompt's expected output against the real surfer-user portrait. Verdict: the spine candidate is strong, all craft requirements would be met, main complaints (repetition, generic intros, no reframe) addressed.

**Test 2 — Live A/B with seed data:**
Run both current and new prompt against the seed assessment (High O, High C, Low E). Compare on craft checklist.

**Test 3 — Weak-spine profile:**
Test a balanced profile (all medium scores) to validate Track B produces acceptable quality without forcing a spine.

**Craft Checklist (score each portrait):**

| # | Criterion | Target |
|---|-----------|--------|
| 1 | Identifiable spine or coherent multi-thread | ✓ |
| 2 | At least one reframe ("You call it X, I see Y") | ✓ |
| 3 | 2+ coined phrases | ✓ |
| 4 | Blockquotes: reaction before analysis | ✓ |
| 5 | Every section opens with conversation callback | ✓ |
| 6 | Shadow connections (no separate strength/weakness lists) | ✓ |
| 7 | Zero repeated insights across sections | ✓ |
| 8 | Custom section headers | ✓ |
| 9 | Authority referenced once max | ✓ |
| 10 | Closing references specific theory tied to spine | ✓ |

**Minimum pass: 7/10. Target: 9/10.**

### Desk Check Results

**Profile tested:** Real surfer user (High O, Low E, mixed patterns)

| Requirement | Current Portrait Score | New Prompt Expected |
|---|---|---|
| Spine | Present but repeated 3x → partial | Stated once, orbited → ✓ |
| Reframe | None → ✗ | Clear candidate exists → ✓ |
| Coined phrases | Zero → ✗ | "The Preparation Gate," "selective uncertainty" → ✓ |
| Reaction before analysis | Partial → ✗ | Instruction is explicit → ✓ |
| Callback hooks | Generic intros → ✗ | Mandatory per section → ✓ |
| Shadow connections | Separate lists → ✗ | Integrated instruction → ✓ |
| Zero repetition | Same insight 3-4x → ✗ | Anti-repetition instruction → ✓ |
| Custom headers | Fixed names → ✗ | Free-form → ✓ |
| Authority | 4 explicit references → ✗ | Once max → ✓ |
| Closing | Decent but disconnected → partial | Spine-tied → ✓ |

**Current portrait score: 2/10. New prompt expected: 9-10/10.**

### Key Learnings

**Pre-mortem risks to monitor during live testing:**
1. **Spine hallucination** — Does Claude force a spine on balanced profiles? (Test 3)
2. **Shadow confusion** — Is the emotional arc preserved when strengths/weaknesses merge?
3. **Reframe quality** — Does the reframe feel earned or forced?
4. **Length variance** — Without character counts, do portraits stay in a reasonable range?
5. **Micro-examples** — If variance is too high, add 2-3 technique examples (pre-mortem fix #3)

**What we're confident about:**
- The spine concept works for profiles with clear tensions (majority of users)
- Custom headers + callback hooks are strict improvements over current generic approach
- The craft checklist gives a concrete, scorable quality standard
- Track B needs explicit equal treatment in the prompt to prevent quality gap

---

## 🚀 Next Steps

### Refinements Needed

**Apply immediately to prototype before first live test:**
1. Track B language: reframe from "fallback" to equal path — "This is not a lesser portrait. Some people are complex in distributed ways."
2. Reframe requirement: soften from "mandatory" to "strongly preferred when data supports it. A genuine observation beats a forced reframe."
3. Emotional sequencing: add "Lead with the strength side of each pattern. Show the shadow within the same observation. The reader should feel seen before they feel challenged."

**Apply after first live test (based on results):**
4. If length variance too high → add soft guidance: "Aim for a portrait that takes 3-4 minutes to read"
5. If spine hallucination occurs → add: "Forcing a spine where none exists is the worst outcome. If the data doesn't clearly point to one, write a multi-thread portrait."
6. If tone/format inconsistent → add 2-3 micro-examples showing specific craft techniques (reframe paragraph, coined phrase in context, reaction-before-analysis)

### Action Items

**1. Update `PORTRAIT_CONTEXT` constant**
- File: `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts`
- Replace lines 85-242 with prototype prompt
- Apply the 3 immediate refinements above
- `NERIN_PERSONA` stays unchanged

**2. Run live A/B test — seed data**
- Use `pnpm seed:test-assessment` (High O, High C, Low E profile)
- Generate portraits with both old and new prompts
- Score each on 10-point craft checklist
- Compare side by side

**3. Test Track B — balanced profile**
- Create test profile with medium scores across all facets
- Verify portrait produces coherent multi-thread narrative without forcing a spine
- Score on craft checklist (target: 7/10 minimum)

**4. Update portrait spec document**
- File: `_bmad-output/implementation-artifacts/personalized-portrait-spec.md`
- Rewrite to reflect: 4-section structure, spine-first approach, craft requirements, quality floor
- This becomes the reference for future prompt iterations

**5. Update mock portrait**
- File: `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts`
- Update mock output to match new structure (custom headers, 4 sections, coined phrases)

**6. Consider temperature adjustment**
- Current: temperature 0.7
- Test with 0.8 to evaluate if coined phrases and reframe quality improve
- Monitor for structural degradation at higher temperature
- Stay within Sonnet pricing tier

### Success Metrics

| Metric | Current Baseline | Target | Measurement |
|--------|-----------------|--------|-------------|
| Craft checklist score | 2/10 | 7/10 min, 9/10 target | Score each portrait on 10-point checklist |
| Repetition count | 3-4 repeated insights | 0 | Count insights appearing >1x across sections |
| Coined phrases per portrait | 0 | 2+ | Count novel 2-4 word pattern names |
| Generic intro count | 5/6 sections | 0 | Count intros without specific conversation reference |
| Reframe presence | 0 | 1+ | Identify "You call it X, I see Y" moments |
| Authority over-references | 4+ per portrait | 1 max | Count explicit credential statements |
| User emotional response | "Interesting but generic" | "Finally, something understands me" | Qualitative beta feedback |

---

## Review Notes — Implementation Completed

**Status:** Completed
**Implemented:** 2026-02-19

- Adversarial review completed (13 findings)
- Findings: 6 real (all fixed), 7 noise (skipped)
- Resolution approach: auto-fix

**Implemented items:**
- [x] Action Item 1: Updated `PORTRAIT_CONTEXT` with spine-first architecture + 3 refinements + validated example
- [x] Action Item 4: Rewrote portrait spec document
- [x] Action Item 5: Updated mock portrait with 4-section structure

**Additional fixes from adversarial review:**
- Added `h3` rendering component for `###` sub-headers in portrait-markdown.tsx
- Fixed stale JSDoc in domain interface (6 sections → 4 sections)
- Fixed stale comments referencing "The Dive Log" as fixed title
- Fixed copy-paste error in test fixture blockquote
- Added test coverage for `###` sub-headers
- Updated all downstream fixtures (test, stories, seed script, homepage excerpt)

**Deferred items (require live LLM testing):**
- [ ] Action Item 2: A/B test with seed data (requires running actual portrait generation)
- [ ] Action Item 3: Track B testing with balanced profile
- [ ] Action Item 6: Temperature adjustment (0.7 → 0.8 experiment)

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
