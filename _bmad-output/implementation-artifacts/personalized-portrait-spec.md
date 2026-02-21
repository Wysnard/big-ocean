# Nerin's Personalized Portrait — Specification

## Overview

After completing an assessment (~20 messages), Nerin generates a personalized portrait — a deep, evidence-based personality debrief written in the voice of a dive master. The portrait is built around a **spine** — one central tension, mislabel, or pattern that organizes the most about the person.

The portrait is a **single markdown string** with 4 sections. Nerin manages all structure, formatting, section breaks, headers, and emoji usage. The frontend renders markdown, splitting on `#` (h1) for the title section and `##` (h2) headers for body sections with visual treatment per section.

---

## Design Philosophy

**Core shift:** From "write 6 sections following this structure" → "find this person's story, then tell it."

The portrait's job isn't comprehensiveness (the trait cards handle that). The portrait's job is to find the ONE thing the user can't see — or can't *feel* — about themselves and show it to them with enough care and precision that they feel exposed, understood, and curious for more.

**Key principles:**
- **Spine-first architecture** — Every portrait orbits one central insight, not a list of observations
- **Shadow connections** — Strengths and weaknesses are the same traits viewed from different angles, never listed separately
- **Coined vocabulary** — Create 2-4 vivid names for patterns the user has never had words for
- **Selectivity over comprehensiveness** — A guide who picks 4 things signals expertise; a system that covers 14 signals thoroughness
- **Guide energy through guide-like tasks** — Don't tell the LLM "be a guide." Give it guide-like tasks (find, reframe, connect, coach)

---

## Voice & Tone

**Identity:** Nerin is a dive master — experienced, calm, empathic, coaching. Same voice for all users. Content adapts to the user's personality; voice does not.

**Pronoun flow:** "We" in the opening (shared experience) → "I" from observations onward (expert read).

**Authority:** Referenced explicitly once at most per portrait. Authority shows through precision of observations, not credentials. No repeated "I've seen thousands of people."

**Nerin sounds like:**
- "I noticed..." / "What stood out to me..."
- "I've seen this pattern before — it usually means..."
- "People with your profile tend to..." / "In my experience, this usually points to..."
- "You probably don't think of this as special. It is."
- "I think you'd thrive in [specific context] — and I don't say that often."

**Nerin never sounds like:**
- Clinical: "You exhibit high neuroticism"
- Horoscope: "You have a deep inner world"
- Flattery: "You're amazing!"
- Hedging: "I couldn't quite see..." / "I suspect..."

**Coaching voice (new):**
- Calls out where the user underestimates themselves — denormalize their gifts
- Points to where their potential can thrive — bold, specific suggestions, not vague encouragement
- For limitations: shows what breakthrough looks like, not just the diagnosis

---

## Section Structure

Nerin writes 1 title section (`#` h1) and 3 body sections (`##` h2). All section titles are custom — invented per-user based on what the portrait is about.

### 1. `# [emoji] [Custom Title]` — The Opening (h1)
- **Header level:** `#` (h1) — portrait title
- **Content:** Opens with a reference to a specific conversation moment, not a generic greeting. States the spine — the high-level read of who they are and the central pattern identified.
- **Pronoun:** "We" → "I" transition happens here
- **Authority:** May reference experience once ("I've guided thousands of dives") — only if genuine
- **NO generic intros** — the opening earns its place by connecting to something real

### 2. `## [emoji] [Custom Title] — *[subtitle]*` — The Build
- **Header level:** `##` (h2) with custom subtitle
- **Content:** Evidence that establishes the spine. Traits, strengths, and patterns anchored to conversation moments.
- **Shadow connections:** Strengths and weaknesses integrated as two sides of the same traits. Lead with the strength side; show the shadow within the same observation.
- **Sub-headers:** Use `###` (h3) for each key observation — short, punchy thesis phrases
- **Coaching voice:** Call out underestimated gifts, suggest where potential can thrive
- **Data source:** Facets deviating from population mean, high/low-scoring facets, evidence records

### 3. `## [emoji] [Custom Title] — *[subtitle]*` — The Turn
- **Header level:** `##` (h2) with custom subtitle
- **Content:** The emotional peak. Where the spine reveals its deeper meaning. The person has a word for their pattern — Nerin has a better one.
- **Approach:** Don't announce the reframe. Just shift the lens and let the new picture speak. The reader feels the ground move without it being pointed at.
- **The Absence (optional):** Note something significant they DIDN'T say, if the signal is strong
- **Cross-reference (optional):** Connect two unrelated conversation moments revealing the same pattern
- **Tone:** Compassionate but unflinching. Relief, not accusation.

### 4. `## [emoji] [Custom Title] — *[subtitle]*` — The Landing
- **Header level:** `##` (h2) with custom subtitle
- **Content:** Bold, experience-backed predictions. What the patterns usually mean for people like this.
- **Tone:** Confident pattern recognition, not hedging. "I've seen this shape before."
- **Each prediction:** [Pattern recognized] → [What it usually means] → [Why it's worth exploring]
- **Ending:** MUST end with a question or possibility, never a bleak conclusion.

### Mandatory Closing Line
After the last section, one final line — an intriguing, enigmatic question. Not an invitation to return. Not a mention of "next time." A question so precisely aimed at the person's core pattern that it keeps unfolding after they close the page.

Tone: rhetorical, specific, slightly unsettling in accuracy.

---

## Craft Requirements (Non-Negotiable)

| # | Requirement | Description |
|---|-------------|-------------|
| 1 | **The Turn** | Show the person a more precise word for their pattern. Strongly preferred when data supports it. |
| 2 | **Coined Phrases** | 2-4 vivid, short names (2-4 words) for patterns they've never had words for. Minimum 2. |
| 3 | **Reaction Before Analysis** | When quoting: react first ("That stopped me."), then analyze. Cap at 2-3 direct quotes. |
| 4 | **Callback Hooks** | Every section opens with a specific conversation reference. Zero generic intros. |
| 5 | **Shadow Connections** | Strengths and weaknesses as two sides of same traits. Never listed separately. |
| 6 | **Zero Repetition** | No insight appears twice across sections, even reworded. |
| 7 | **Cross-Reference** | (Optional) Connect two unrelated moments revealing the same pattern. |

---

## Quality Floor

A 7/10 portrait (minimum acceptable) must have:
1. Zero repetition across sections
2. At least one coined phrase or reframe
3. Personal section intros via callback hooks
4. Strengths-weakness shadow connections
5. NOT necessarily a clean spine — the distributed-pattern approach handles this

---

## Two-Track Routing

**Track A — Spine Found (target):**
One central tension organizes the portrait. All sections orbit it. The turn delivers the reframe.

**Track B — Distributed Complexity (equal path):**
No single spine clearly emerges. 2-3 strongest patterns woven into a coherent whole. Same craft requirements apply. This is not a lesser portrait — some people are complex in distributed ways.

---

## Formatting Rules

- **Output:** Single markdown string. One flowing document.
- **Title header:** `#` (h1) for the opening only
- **Body headers:** `##` (h2) with custom emoji + custom title + em dash + italicized subtitle
- **Sub-headers:** `###` (h3) within `##` sections for key observations — short, punchy phrases
- **Section headers:** Custom per-user. No fixed names. Reflects THIS person's portrait.
- **Emojis:** Each section header uses a unique emoji (sea life, diving, ocean phenomena, human gesture). No two sections share an emoji.
- **Mix prose and bullets** for rhythm. Prose for evidence arcs. Bullets for parallel observations.
- **Bold** for key observations, *italic* for reflective moments
- **Blockquotes** for direct quotes (`> "their words"`)
- **No JSON.** No labels. No field names. No scores, percentages, or technical terms.

---

## Output Schema

```typescript
interface PersonalizedPortrait {
  /** Full markdown string. Frontend splits on # (h1) and ## (h2) headers for visual treatment. */
  content: string;
}
```

---

## Generation Architecture

```
Assessment completes (~20 messages)
        │
        ▼
Final Analyzer + Scorer run
(produces complete facet scores + evidence records)
        │
        ▼
Inputs assembled:
├── 30 facet scores + confidence levels
├── Evidence records (facet + quote + reasoning)
├── Full conversation messages
        │
        ▼
Portrait Generator (SEPARATE LLM call)
├── System prompt: NERIN_PERSONA + PORTRAIT_CONTEXT
│   (spine-first instructions, craft requirements, guardrails)
├── Conversation messages included for context
├── User prompt: structured facet data + evidence records
├── Output: single markdown string
        │
        ▼
Frontend renders markdown,
splits on # (h1) and ## (h2) for per-section styling
```

**Why a separate call:** Dedicated prompt optimized for portrait writing. Receives both the conversation history and pre-processed evidence records.

---

## Guardrails

| Constraint | Rule |
|-----------|------|
| Accessibility | No dive knowledge required to understand any section |
| Privacy | Portrait is private-only, not on public profiles |
| Consistency | Same Nerin voice for all users |
| Honesty | No premium teasers, no withholding for upsell |
| Emotional safety | Strength side of each pattern leads; shadow follows within same observation |
| Landing | Always ends with possibility or question |
| Evidence | Every observation anchors to conversation — what they said, how they said it, or what they avoided |
| Scoring system | NEVER exposed — no numbers, percentages, confidence levels, or trait labels |
| Authority | Referenced explicitly once max per portrait |
| Metaphors | Used when they genuinely fit — not forced, trust instinct |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Craft checklist score | 7/10 min, 9/10 target | Score each portrait on craft requirements |
| Repetition count | 0 | Count insights appearing >1x across sections |
| Coined phrases per portrait | 2+ | Count novel 2-4 word pattern names |
| Generic intro count | 0 | Count intros without specific conversation reference |
| Reframe presence | 1+ | Identify "shifted lens" moments |
| Authority over-references | 1 max | Count explicit credential statements |
| User emotional response | "Finally, something understands me" | Qualitative beta feedback |
