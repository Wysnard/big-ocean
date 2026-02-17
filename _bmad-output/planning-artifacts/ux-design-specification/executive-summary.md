# Executive Summary

## Project Vision

**big-ocean** is a conversational Big Five personality assessment platform that replaces static questionnaires with dynamic, LLM-powered dialogues. Users engage with "Nerin" (Claude-based AI) for 30+ minute assessments that feel like authentic conversations, not robotic questionnaires.

The core differentiation: **Conversational depth** captures the complexity and nuance that predefined questionnaire boxes cannot. Rather than forcing users into binary choices, Nerin explores context, contradictions, and subtleties—resulting in personality profiles that feel genuinely personal and understood.

## Target Users

**Core Audience:** Anyone authenticity-seeking who is tired of oversimplified personality assessments
- Professionals frustrated by MBTI/16Personalities limitations
- Thoughtful individuals seeking genuine self-understanding
- People willing to invest 30 minutes for accuracy vs. 10-minute quick quizzes
- Primary: Age 25-45, digitally native, value authenticity and complexity
- Secondary: Naturally attracts professionals once established, but positioning is inclusive

**User Pain Point:** Existing personality tests oversimplify through predefined boxes. Users feel misunderstood or put into rigid categories that don't capture their actual complexity. big-ocean solves this through conversational exploration instead of forced categorization.

## Key Design Challenges

1. **Engagement vs. Length Risk:** 30-minute conversations risk 50% dropout. UX must make long sessions feel fast, rewarding, and valuable (progress feedback, dynamic pacing, micro-motivation).

2. **Privacy Model Complexity:** Three distinct tiers (private profile / public archetype / shareable link) create UI/UX design tension. Users must clearly understand what they're sharing before they share it.

3. **Data Complexity vs. UI Simplicity:** 30 facets + Big Five traits = complex data structure. UI must make this readable and intuitive without losing nuance or feeling overwhelming.

4. **Nerin Authenticity vs. Assessment Rigor:** Nerin must feel like a genuine conversation partner (not robotic) while systematically assessing all personality dimensions. The assessment machinery should be invisible.

5. **Trust & Privacy Signals:** Users sharing personality data = high-trust requirement. Beautiful design + clear privacy controls must work together to build confidence in data safety.

## Design Opportunities

1. **Progress as Motivation:** Visual progress indicator during assessment reduces "how much longer?" anxiety and increases completion rate beyond 50%.

2. **Dual Identity System — Archetype-First Reveal, Code-First Social:** The archetype name (e.g., "The Idealist") is the emotional anchor at the reveal moment — the h1, the first thing users connect with. The 5-letter OCEAN code (e.g., "ODEWR") is the primary *social* identity — what users say in conversation, share on social media, and compare with friends (like MBTI's "INTP"). In the hero, the code is displayed as a strong monochrome secondary (typographic, no per-letter colors — premium feel). Full-color exploration lives in the OceanCodeStrand card below. Codes enable **partial-match tribalism** ("we're both OD!") that isolated archetype names cannot achieve. Each letter is semantic and self-explaining (O=Open-minded).

3. **Privacy Clarity Through Design:** Obvious visual distinction between "My Private Profile" (detailed, personal) and "Share OCEAN Code" (broad, public) builds user confidence in privacy model.

4. **Guided Sharing Experience:** Simple 3-step share flow: (1) preview what shareable link shows, (2) confirm before generating, (3) easy copy/send. Reassurance reduces sharing anxiety.

5. **Responsive Mobile-First Design:** Optimizing for phone-first use unlocks broader sharing behavior (easier to send links from mobile, fits 30-min session in commute/break time).

---
