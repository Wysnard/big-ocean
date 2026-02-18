# Sprint Change Proposal — Homepage Narrative Rewrite

Date: 2026-02-19
Workflow: correct-course
Mode: Incremental
Trigger: Storytelling workshop produced new homepage narrative (`_bmad-output/story-2026-02-19.md`)

## Section 1: Issue Summary

**Problem Statement:** The current homepage conversation flow (Story 7.8, status: done) uses a feature-focused narrative — showcasing OCEAN codes, radar charts, facet bars, and share cards through a simulated Q&A with Nerin. While technically polished, the copy reads as a product demo rather than an emotionally compelling conversion journey.

**Discovery Context:** A storytelling workshop (2026-02-19) with the BMAD Storyteller agent (Sophia) produced a fundamentally reimagined homepage narrative using a hybrid framework: Pitch Narrative x Empathy Story x Origin Story. The workshop included two rounds of party-mode collaboration and extensive iteration on emotional arc, voice, and beat ordering.

**Evidence:** Complete story document at `_bmad-output/story-2026-02-19.md` with:
- 14-beat narrative (vs current 10 beats)
- Three distinct voices: Nerin (dive master), Skeptic (hurt by psychometry), Vincent (founder)
- Three emotional peaks: Awe (portrait), Trust (founder reveal), Desire (conversion)
- Horoscope vs Portrait comparison as the climactic proof moment
- Privacy messaging integrated organically through skeptic's fear response
- "Texture not taxonomy" as guiding principle for discussing facets

---

## Section 2: Impact Analysis

### Epic Impact
- **Epic 7 (UI Theme & Visual Identity):** Status is `done`. This change adds a new story (7.17) within Epic 7 for the homepage narrative rewrite. Epic status reverts to `in-progress`.
- **Epics 1-6, 8:** No impact.

### Story Impact
- **Story 7.8 (done):** Remains as-is — it delivered the component infrastructure (DepthScrollProvider, ConversationFlow, ChatBubble, MessageGroup, TraitStackEmbed, ComparisonCard, DepthMeter, ChatInputBar, etc.). No rollback.
- **New Story 7.17:** Homepage Narrative Rewrite — rewrites conversation copy, adds 2 new components, removes unused embeds, updates hero section.
- No other stories require changes.

### Artifact Conflicts
- **Epic 7 file:** Add Story 7.17 section to `epic-7-ui-theme-visual-identity.md`
- **Sprint status:** Add `7-17-homepage-narrative-rewrite` entry, revert Epic 7 to `in-progress`
- **Story 7.8 implementation file:** No changes (remains `done`)
- **PRD:** No conflict — new narrative better serves conversion goals
- **Architecture:** No impact — purely frontend component and copy changes
- **UX Design Spec:** Optional update to homepage section to reflect new emotional arc

### Technical Impact
- **2 new components to create:**
  1. `HoroscopeVsPortraitComparison.tsx` — Side-by-side horoscope vs portrait comparison
  2. Vincent bubble variant in `ChatBubble.tsx` — Third speaker type with distinct visual identity
- **Components removed from page:** OceanCodePreview, RadarChartPreview, FacetBarsPreview, ShareCardPreview (files remain, just removed from index.tsx)
- **Components kept and repositioned:** ComparisonCard (moved earlier), TraitStackEmbed (reframed copy), ComparisonTeaserPreview (remove "Coming soon" badge)
- **Hero section copy updated** (HeroSection.tsx)
- **Route file rewritten** (index.tsx conversation content)
- **No backend, API, database, or deployment changes**
- **No new npm packages**

---

## Section 3: Recommended Approach

**Selected: Direct Adjustment** — Add Story 7.17 to Epic 7.

**Rationale:**
- The existing component infrastructure from Story 7.8 is fully reusable (DepthScrollProvider, ConversationFlow, ChatBubble, MessageGroup, DepthMeter, ChatInputBar, etc.)
- Changes are primarily copy (hardcoded conversation text) + 2 new components + hero section update
- No architectural changes, no backend changes, no new dependencies
- Low risk — visual and copy changes only, existing test suite unaffected
- Effort estimate: **Medium** (primarily copy work + 2 new components + hero update)
- Risk level: **Low**

---

## Section 4: Detailed Change Proposals

### Change 1: Hero Section Copy Update

**File:** `apps/front/src/components/home/HeroSection.tsx`

**OLD (lines 21-37):**
```tsx
<h1 className="...">
  What if the most{" "}
  <span className="...">interesting person</span>{" "}
  in the room is you?
</h1>

<p className="...">
  A personality deep dive guided by AI, grounded in science, revealed
  through conversation. Not a quiz. A real exploration of the 30 facets
  that make you, you.
</p>

<div className="...">
  30 MIN &middot; FREE &middot; NO ACCOUNT NEEDED
</div>
```

**NEW:**
```tsx
<h1 className="...">
  Not a personality quiz.{" "}
  <span className="...">A conversation.</span>
</h1>

<p className="...">
  A portrait of who you are that no test has ever given you.
</p>

<div className="...">
  30 MIN &middot; NO ACCOUNT &middot; JUST TALKING
</div>
```

**Rationale:** The new headline communicates the core differentiator in 5 seconds. Removing "FREE" avoids signaling "there's a catch." "JUST TALKING" reinforces the conversational nature. Removing facet count avoids the "30 smaller boxes" problem identified in the storytelling workshop.

---

### Change 2: Rewrite Conversation Flow in index.tsx

**File:** `apps/front/src/routes/index.tsx`

**OLD:** 10 beats — feature-focused Q&A showcasing OCEAN codes, radar charts, facet bars, share cards

**NEW:** 14 beats — emotion-focused narrative with skeptic arc, three peaks, founder reveal

Complete new conversation content (replacing everything between `<ConversationFlow>` and `</ConversationFlow>`):

```
Beat 1  [Nerin]   Hook — "You know that thing where a test tells you you're 'introverted' and you think yeah, but I'm the loudest person at dinner with my friends?"
Beat 2  [User]    Wound — "I've done a few of these. They never really got it right."
Beat 3  [Nerin]   Acknowledges — "That's Not a Bug. That's the Problem." (scales, averages, types)
Beat 4  [Nerin]   ComparisonCard (existing) — method proof: traditional vs conversational
Beat 5  [User]    Bridge — "that's just how you ask the questions"
Beat 6  [Nerin]   TraitStackEmbed (existing, reframed) — "What I'm Actually Listening For"
Beat 7  [User]    Challenge — "personality descriptions always end up saying the same thing"
Beat 8  [Nerin]   HoroscopeVsPortraitComparison (NEW) — output proof, climax
Beat 9  [User]    Reacts — "That right side doesn't read like a test result"
Beat 10 [Nerin+Vincent] The reveal — founder's portrait + personal share (Vincent bubble NEW)
Beat 11 [User]    Vulnerable — "I'd be scared to read mine"
Beat 11b[Nerin]   Privacy — "Your Portrait. Your Rules."
Beat 12 [Nerin]   ComparisonTeaserPreview (existing, remove "Coming soon") — social comparison
Beat 13 [User]    Converting — "I wonder what mine would say"
Beat 14 [Nerin]   CTA close — "Just a Conversation"
```

**Components removed from page:**
- `OceanCodePreview` (was in ResultPreviewEmbed)
- `RadarChartPreview` (was in ResultPreviewEmbed)
- `FacetBarsPreview` (was in ResultPreviewEmbed)
- `ShareCardPreview`

**Components kept:**
- `ComparisonCard` — moved to Beat 4 (method proof)
- `TraitStackEmbed` — Beat 6 (reframed copy: "What I'm Actually Listening For")
- `ComparisonTeaserPreview` — Beat 12 (remove "Coming soon" badge)

**Rationale:** The current flow demonstrates features. The new flow converts visitors through an emotional arc: recognition → vulnerability → proof → awe → trust → desire. The three peaks (portrait, founder, conversion) build on each other.

---

### Change 3: New Component — HoroscopeVsPortraitComparison

**File:** `apps/front/src/components/home/HoroscopeVsPortraitComparison.tsx` (NEW)

**Purpose:** Side-by-side comparison showing a generic horoscope description vs a real portrait excerpt. This is the emotional climax of the page (Beat 8 — Peak 1: Awe).

**Design:**
- Two columns (stack on mobile)
- Left: Horoscope aesthetic (pastel background, softer typography) with generic text
- Right: big-ocean style (bold, geometric) with specific portrait excerpt
- Bottom: "Which one feels like someone was actually paying attention?"

**Left side content (horoscope):**
> "You are a deeply intuitive person who values security and emotional connection. You can be guarded at first but open up deeply to those you trust. Creative and nurturing, you sometimes struggle with letting go."

**Right side content (portrait excerpt from Vincent's actual portrait):**
> "You have this selective relationship with uncertainty that I don't see often. Most people either love unpredictability or they don't. But you? You actively seek it in some areas and freeze up in others. That's not contradictory — it's strategic. You've learned where uncertainty serves you and where it doesn't."

**Technical notes:**
- Uses existing depth scroll CSS tokens (`bg-[var(--embed-bg)]`, etc.)
- Left side mimics pastel astrology-app aesthetic to contrast with big-ocean's bold style
- Responsive: two columns > 640px, stacked on mobile
- `data-slot="horoscope-portrait-comparison"`
- `prefers-reduced-motion` respected

---

### Change 4: New ChatBubble Variant — Vincent (Founder)

**File:** `apps/front/src/components/home/ChatBubble.tsx` (MODIFY)

**Current variants:** `nerin` | `user`

**Add variant:** `vincent`

**Visual identity (per story design notes):**
- Distinct background color/treatment (different from both Nerin and user bubbles)
- Photo or initial with different styling
- Subtle border or accent to make it stand out as a special/third voice
- Left-aligned like Nerin but with different avatar treatment

**Vincent's content (Beat 10):**
> I'd taken every test out there. MBTI, Enneagram, even a few I'm embarrassed to admit. They'd tell me things that were true on the surface but never felt complete. When I first read what Nerin wrote about me, I sat with it for a long time. Not because it told me something I didn't know — but because it named things I'd been carrying without words for them.
>
> That's why I built this.

**Technical notes:**
- Add `variant="vincent"` to ChatBubble component
- Avatar: "V" initial or photo placeholder with distinct background (e.g., a warm gradient different from Nerin's teal→pink)
- Bubble styling: slightly different background/border to signal "this is a real person, not the AI"
- Name label: "Vincent" displayed above or beside the bubble

---

### Change 5: Remove "Coming Soon" Badge from ComparisonTeaserPreview

**File:** `apps/front/src/components/home/ComparisonTeaserPreview.tsx` (MODIFY)

**OLD:** "Coming soon" badge in top-right corner
**NEW:** Remove the badge entirely

**Rationale:** The story specifies that the comparison feature should be "presented as LIVE (not 'coming soon')." The anecdote about the couple fighting about vacations positions this as an existing capability.

---

### Change 6: Update ComparisonCard Copy (Optional)

**File:** `apps/front/src/components/home/ComparisonCard.tsx` (OPTIONAL MODIFY)

The story specifies a tagline: "One gives you a dot on a scale. The other hears your story."

If the current ComparisonCard doesn't have this tagline, add it below the comparison.

---

## Section 5: Implementation Handoff

### Change Scope: **Minor-to-Moderate**

This is primarily a copy rewrite with 2 new components. The existing component infrastructure handles all the heavy lifting (scroll behavior, depth transitions, animations, responsive layout).

**Handoff: Development team for direct implementation.**

### New Story Definition

**Story 7.17: Homepage Narrative Rewrite**

As a **new visitor discovering big-ocean for the first time**,
I want **the home page to tell a compelling emotional story through a conversation between a skeptic and Nerin, culminating in real proof of portrait quality and a founder's personal testimony**,
So that **I'm emotionally convinced that big-ocean is fundamentally different from personality quizzes I've tried before, and I want to discover my own portrait**.

**Dependencies:** Story 7.8 (existing component infrastructure)

**Acceptance Criteria:**

1. **Hero section** displays: "Not a personality quiz. A conversation." headline, "A portrait of who you are that no test has ever given you." subtitle, "30 MIN · NO ACCOUNT · JUST TALKING" micro-text
2. **14-beat conversation** renders with correct copy from `_bmad-output/story-2026-02-19.md`
3. **Three speaker types** visually distinct: Nerin (AI guide), User (skeptic), Vincent (founder)
4. **HoroscopeVsPortraitComparison** component renders side-by-side comparison at Beat 8 with horoscope text on left and portrait excerpt on right
5. **Vincent bubble** (Beat 10) has distinct visual treatment from Nerin and User bubbles
6. **TraitStackEmbed** appears at Beat 6 with "What I'm Actually Listening For" framing
7. **ComparisonCard** appears at Beat 4 with "Same question. Two approaches." intro
8. **ComparisonTeaserPreview** appears at Beat 12 without "Coming soon" badge
9. **Removed from page:** OceanCodePreview, RadarChartPreview, FacetBarsPreview, ShareCardPreview
10. **Existing infrastructure** preserved: DepthScrollProvider, ConversationFlow, MessageGroup, DepthMeter, ChatInputBar, depth scroll transitions
11. Mobile responsive, dark mode compatible, `prefers-reduced-motion` respected
12. `pnpm build` — 0 errors, `pnpm lint` — no new warnings, `pnpm test:run` — no regressions

**Tasks:**
1. Update HeroSection.tsx with new copy
2. Create HoroscopeVsPortraitComparison.tsx component
3. Add `vincent` variant to ChatBubble.tsx
4. Remove "Coming soon" badge from ComparisonTeaserPreview.tsx
5. Rewrite index.tsx conversation content (14 beats)
6. Build verification (build, lint, test)

### Success Criteria
- Home page tells a coherent emotional story following the beat map in `story-2026-02-19.md`
- Three emotional peaks are clearly felt: Awe (portrait comparison), Trust (founder reveal), Desire (conversion line)
- No regression in scroll behavior, depth transitions, or responsive layout
- Copy follows "texture not taxonomy" principle — never frames facets as smaller boxes

### Artifacts to Update After Approval
1. `_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md` — Add Story 7.17
2. `_bmad-output/implementation-artifacts/sprint-status.yaml` — Add 7.17, revert Epic 7 to `in-progress`
3. `_bmad-output/implementation-artifacts/7-17-homepage-narrative-rewrite.md` — Create story implementation file

---

_Generated by Correct Course workflow (2026-02-19)_
