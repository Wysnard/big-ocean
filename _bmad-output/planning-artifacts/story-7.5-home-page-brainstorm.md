> **SUPERSEDED (2026-02-14):** This brainstorm was superseded by the Combined Direction
> prototype developed through UX exploration. See
> `_bmad-output/ux-explorations/homepage-directions/direction-combined.html` for the
> final design. Story 7.8 has been rewritten to reflect the conversation-driven homepage.

# Story 7.5: Home Page Redesign - Deep Analysis & Brainstorm

**Date:** 2026-02-11
**Status:** Brainstorming / Refinement
**Author:** Claude + Vincentlay

---

## Part 1: Current State Audit

### What Exists Today

```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🌊 Wave Icon                                        │   │
│  │  "Big Ocean" (gradient text)                        │   │
│  │  "Discover Your Personality With AI"                │   │
│  │  [Start Assessment Now]                             │   │
│  │  "Takes about 10-15 minutes · No account needed"    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  WHAT IS BIG FIVE SECTION                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Card with explanation text                          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  FIVE DIMENSIONS SECTION                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │  O  │ │  C  │ │  E  │ │  A  │ │  N  │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────────────────────────┤
│  CTA SECTION                                                │
│  "Ready to Understand Yourself Better?"                     │
│  [Start Your Assessment]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Technical Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Hard-coded dark theme only | 🔴 High | `bg-slate-900`, `text-white` everywhere |
| Hard-coded gradient colors | 🔴 High | `from-blue-500 to-purple-500` |
| Trait icons use wrong colors | 🟡 Medium | `text-amber-400` for Openness (should be purple) |
| No semantic variables | 🔴 High | No `bg-primary`, `text-foreground` usage |
| Static, no animations | 🟡 Medium | No entrance animations or micro-interactions |
| Generic gradient | 🟡 Medium | Blue-purple doesn't reinforce "ocean" brand |

### Content Issues

| Issue | Impact |
|-------|--------|
| "AI-powered therapist" phrasing | May feel clinical; "Nerin" name not introduced |
| No social proof | No testimonials, user count, or credibility signals |
| No preview of results | Users don't know what they'll get |
| Missing differentiation | Doesn't explain why this is better than 16Personalities |
| CTA repeated twice | Redundant without added value |

### UX Issues

| Issue | Impact |
|-------|--------|
| No visual preview of assessment | Users don't know what to expect |
| Trait descriptions are generic | Could be from any Big Five site |
| No indication of "conversational" difference | Key differentiator not shown |
| Mobile: 5 columns compressed | May not be readable |

---

## Part 2: Brand Identity Deep Dive

### The "Ocean" Metaphor

The name "Big Ocean" connects to both the psychology concept (OCEAN = acronym for Big Five) and powerful ocean imagery.

**Ocean Associations:**
- 🌊 **Depth** — personality has hidden depths, like the ocean
- 🌊 **Vastness** — the full spectrum of human personality
- 🌊 **Waves** — emotions, moods, the dynamic nature of personality
- 🌊 **Exploration** — discovering what's beneath the surface
- 🌊 **Calm & Storm** — the range of human experience
- 🌊 **Flow** — the conversational, natural assessment experience

**Visual Language Opportunities:**
- Wave patterns (SVG, CSS animations)
- Gradient depths (light surface → deep blue)
- Fluid shapes (blob morphs, liquid transitions)
- Particle effects (bubbles, light rays)
- Horizontal flow (left-to-right journey)

### Color Palette Direction

**Primary Ocean Palette:**
```
Surface (light):     oklch(0.92 0.03 220)  — Pale sky blue
Shallow:             oklch(0.75 0.10 210)  — Light aqua
Mid-depth:           oklch(0.55 0.15 230)  — Ocean blue (PRIMARY)
Deep:                oklch(0.35 0.12 240)  — Deep navy
Abyss:               oklch(0.20 0.08 250)  — Near-black blue
```

**Accent Colors:**
```
Seafoam:             oklch(0.70 0.12 175)  — Teal accent
Coral:               oklch(0.70 0.18 25)   — Warm contrast
Bioluminescence:     oklch(0.80 0.15 195)  — Glowing cyan
```

### Emotional Tone

| Attribute | Expression |
|-----------|------------|
| **Trustworthy** | Clean typography, ample whitespace, professional layout |
| **Scientific** | Data visualizations, precision language, Big Five credibility |
| **Personal** | Warm gradients, friendly copy, Nerin personality |
| **Inviting** | Clear CTA, low-friction start, welcoming hero |
| **Premium** | Subtle animations, polished details, quality feel |

---

## Part 3: Design Concepts

### Concept A: "Dive Deep" — Vertical Journey

**Theme:** The page is a vertical descent into the ocean depths.

```
┌─────────────────────────────────────────────────────────────┐
│  🌅 SURFACE (Hero)                                          │
│  Light gradient (sky → water surface)                       │
│  "Big Ocean" wordmark with wave animation                   │
│  "Discover the depths of your personality"                  │
│  [Begin Your Journey ↓]                                     │
│  Animated wave line separating sections                     │
├─────────────────────────────────────────────────────────────┤
│  🌊 SHALLOW WATERS (What is this?)                          │
│  Slightly deeper blue gradient                              │
│  "30 minutes. One conversation. True understanding."        │
│  3-step visual: Chat → Discover → Share                     │
│  Floating bubbles animation                                 │
├─────────────────────────────────────────────────────────────┤
│  🐠 MID-DEPTH (The Five Dimensions)                         │
│  Medium blue, trait cards with glow effects                 │
│  Each trait card has depth/parallax on scroll               │
│  Trait colors create a "reef" of personality                │
├─────────────────────────────────────────────────────────────┤
│  🦑 THE DEEP (Social Proof)                                 │
│  Darker blue, testimonials floating like fish               │
│  "Join 10,000+ explorers"                                   │
│  Bioluminescent accent glows                                │
├─────────────────────────────────────────────────────────────┤
│  💎 TREASURE (CTA)                                          │
│  Deepest blue with glowing CTA                              │
│  "Ready to discover what's beneath?"                        │
│  [Start Your Assessment] — glowing button                   │
└─────────────────────────────────────────────────────────────┘
```

**Pros:** Strong narrative, memorable, brand-reinforcing
**Cons:** Complex to implement, may feel heavy

---

### Concept B: "Calm Waters" — Minimal & Clean

**Theme:** Serene, professional, confidence-inspiring.

```
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Clean white/light background                        │   │
│  │  Subtle radial gradient (ocean blue center glow)    │   │
│  │                                                      │   │
│  │  "Big Ocean"                                         │   │
│  │  Personality assessment that actually understands    │   │
│  │  you.                                                │   │
│  │                                                      │   │
│  │  [Start Free Assessment]  [See how it works →]      │   │
│  │                                                      │   │
│  │  ★★★★★ "Finally, a test that got me right" — User   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  HOW IT WORKS (3 Steps)                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │ 💬 Chat │ →  │ 🎯 Score│ →  │ 🌟 Share│                 │
│  │ 30 min  │    │ 30 facet│    │ Archetype                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
├─────────────────────────────────────────────────────────────┤
│  WHY BIG OCEAN (Differentiation)                            │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Traditional Tests │  │ Big Ocean        │                │
│  │ ❌ 50 questions   │  │ ✅ Conversation   │                │
│  │ ❌ Binary choices │  │ ✅ Nuanced        │                │
│  │ ❌ Generic        │  │ ✅ Personal       │                │
│  └──────────────────┘  └──────────────────┘                │
├─────────────────────────────────────────────────────────────┤
│  THE FIVE DIMENSIONS                                        │
│  Horizontal scroll cards with trait colors                  │
├─────────────────────────────────────────────────────────────┤
│  FINAL CTA                                                  │
│  Ocean gradient background                                  │
│  [Discover Your Personality →]                              │
└─────────────────────────────────────────────────────────────┘
```

**Pros:** Clean, professional, light/dark mode friendly
**Cons:** Less distinctive, may feel generic

---

### Concept C: "Living Ocean" — Interactive & Animated

**Theme:** The page feels alive, like the ocean itself.

```
┌─────────────────────────────────────────────────────────────┐
│  HERO (Full viewport)                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Animated gradient background (slowly shifting)      │   │
│  │  Particle effect (floating light particles)          │   │
│  │                                                      │   │
│  │  🌊 (Animated wave logo)                             │   │
│  │  "Big Ocean"                                         │   │
│  │                                                      │   │
│  │  A personality assessment as unique as you are.      │   │
│  │                                                      │   │
│  │  [Meet Nerin & Begin ↓]                             │   │
│  │                                                      │   │
│  │  ↓ Scroll indicator (animated)                      │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  MEET NERIN (Interactive preview)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Mockup of chat interface                           │   │
│  │  Nerin: "Hi! I'm curious about what makes you tick" │   │
│  │  [Type a response...] ← Interactive demo            │   │
│  │                                                      │   │
│  │  "This isn't a quiz. It's a conversation."          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  TRAIT VISUALIZATION (Interactive)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Radar chart that animates on scroll                │   │
│  │  Hover on each axis to reveal trait details         │   │
│  │  "30 facets. 5 dimensions. Your complete portrait." │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ARCHETYPE REVEAL (Teaser)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Blurred archetype card                             │   │
│  │  "Discover your archetype"                          │   │
│  │  [Thoughtful Explorer] ← Revealed on hover          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  CTA                                                        │
│  Wave animation at bottom                                   │
│  [Start Your Assessment]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Pros:** Highly engaging, shows the product, memorable
**Cons:** Performance concerns, complex implementation

---

### Concept D: "Bento Ocean" — Modern Grid Layout

**Theme:** 2026 bento grid trend with ocean theming.

```
┌─────────────────────────────────────────────────────────────┐
│  HERO (Bento Grid)                                          │
│  ┌───────────────────────┬─────────────────────────────┐   │
│  │                       │  "Big Ocean"                 │   │
│  │   🌊 Animated Logo    │  Personality assessment      │   │
│  │                       │  that truly understands you  │   │
│  │                       │                              │   │
│  │                       │  [Start Assessment]          │   │
│  ├───────────────────────┼──────────────┬──────────────┤   │
│  │  ⏱️ 30 minutes        │  💬 AI Chat  │  🎯 30 facets│   │
│  │  "Worth every second" │  Not a quiz  │  Not 5       │   │
│  └───────────────────────┴──────────────┴──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  TRAITS (Bento Cards)                                       │
│  ┌─────────────┬─────────────┬─────────────────────────┐   │
│  │   OPENNESS  │ CONSCIEN.   │                         │   │
│  │   Purple    │ Blue        │    EXTRAVERSION         │   │
│  │   gradient  │ gradient    │    Orange gradient      │   │
│  ├─────────────┴─────────────┤    Large card           │   │
│  │   AGREEABLENESS           │                         │   │
│  │   Green gradient          ├─────────────────────────┤   │
│  │                           │   NEUROTICISM           │   │
│  │                           │   Coral gradient        │   │
│  └───────────────────────────┴─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  SOCIAL PROOF + CTA                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "Join 10,000+ who discovered their true selves"    │   │
│  │  [Start Your Assessment →]                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Pros:** Trendy, scannable, works great on mobile, supports trait gradients
**Cons:** May feel less narrative-driven

---

## Part 4: Recommended Direction

### Hybrid Approach: "Bento Ocean with Depth"

Combine the best elements:

1. **From Concept D (Bento):** Grid layout for scannability and mobile
2. **From Concept A (Dive Deep):** Subtle depth progression in background
3. **From Concept C (Living):** Light animations, interactive preview
4. **From Concept B (Calm):** Clean typography, professional feel

### Proposed Section Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  1. HERO                                                    │
│     - Full viewport                                         │
│     - Radial ocean gradient (light mode) / deep blue (dark) │
│     - Animated wave logo                                    │
│     - Clear value prop + single CTA                         │
│     - Micro social proof (star rating)                      │
├─────────────────────────────────────────────────────────────┤
│  2. VALUE PROPS (Bento Grid - 3 cards)                      │
│     - "Conversation, not quiz"                              │
│     - "30 facets, not 5 traits"                             │
│     - "AI that adapts to you"                               │
├─────────────────────────────────────────────────────────────┤
│  3. MEET NERIN (Interactive preview)                        │
│     - Chat mockup with sample conversation                  │
│     - Optional: type your own message demo                  │
├─────────────────────────────────────────────────────────────┤
│  4. THE FIVE DIMENSIONS (Trait cards with gradients)        │
│     - Bento layout with trait colors                        │
│     - Each card uses --gradient-trait-*                     │
│     - Hover reveals facet breakdown                         │
├─────────────────────────────────────────────────────────────┤
│  5. WHAT YOU'LL DISCOVER (Result preview)                   │
│     - Sample archetype card (blurred/teaser)                │
│     - "Your unique archetype awaits"                        │
├─────────────────────────────────────────────────────────────┤
│  6. SOCIAL PROOF                                            │
│     - Testimonial cards                                     │
│     - User count / credibility badges                       │
├─────────────────────────────────────────────────────────────┤
│  7. FINAL CTA                                               │
│     - Ocean gradient background                             │
│     - Strong call to action                                 │
│     - "Takes 30 min · Free · No account needed"             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 5: Component Specifications

### 5.1 Hero Section

**Layout:**
```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  {/* Background gradient */}
  <div className="absolute inset-0 bg-[image:var(--gradient-ocean-radial)]" />

  {/* Animated particles (optional) */}
  <OceanParticles />

  {/* Content */}
  <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
    <WaveLogoAnimated className="w-24 h-24 mx-auto mb-6" />

    <h1 className="text-6xl md:text-7xl font-black tracking-tight">
      <span className="bg-[image:var(--gradient-ocean)] bg-clip-text text-transparent">
        Big Ocean
      </span>
    </h1>

    <p className="text-xl md:text-2xl text-muted-foreground mt-4 mb-8">
      Personality assessment that actually understands you.
    </p>

    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg" className="bg-[image:var(--gradient-ocean)]">
        Start Free Assessment
      </Button>
      <Button variant="outline" size="lg">
        See How It Works
      </Button>
    </div>

    <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <StarRating value={4.9} />
      <span>"Finally, a test that got me right"</span>
    </div>
  </div>

  {/* Scroll indicator */}
  <ScrollIndicator className="absolute bottom-8" />
</section>
```

**Animations:**
- Logo: Gentle wave motion (CSS `@keyframes`)
- Gradient: Slow color shift (15s loop)
- Particles: Floating upward (like bubbles)
- Scroll indicator: Bounce animation

**Gradient Definition:**
```css
--gradient-hero-light: radial-gradient(
  ellipse 80% 50% at 50% 100%,
  oklch(0.75 0.12 210 / 0.3) 0%,
  oklch(0.92 0.03 220 / 0.1) 50%,
  transparent 100%
);

--gradient-hero-dark: radial-gradient(
  ellipse 80% 50% at 50% 100%,
  oklch(0.35 0.12 240 / 0.5) 0%,
  oklch(0.15 0.05 240 / 0.3) 50%,
  transparent 100%
);
```

---

### 5.2 Value Props Section

**Layout:** 3-column bento grid

```tsx
<section className="py-20 px-6">
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    <ValueCard
      icon={<MessageCircle />}
      title="Conversation, Not Quiz"
      description="Chat naturally with Nerin, our AI. No checkboxes. No forced choices."
      gradient="--gradient-ocean-subtle"
    />
    <ValueCard
      icon={<Layers />}
      title="30 Facets, Not 5"
      description="We measure all 30 personality facets, not just the big picture."
      gradient="--gradient-ocean-subtle"
    />
    <ValueCard
      icon={<Sparkles />}
      title="AI That Adapts"
      description="Nerin follows your story. The assessment adapts to you."
      gradient="--gradient-ocean-subtle"
    />
  </div>
</section>
```

**Card Design:**
```tsx
function ValueCard({ icon, title, description, gradient }) {
  return (
    <Card className="relative overflow-hidden group">
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `var(${gradient})` }}
      />

      <CardContent className="relative z-10 p-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
```

---

### 5.3 Trait Cards Section

**Layout:** Asymmetric bento grid with trait gradients

```tsx
<section className="py-20 px-6 bg-muted/30">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-12">
      The Five Dimensions of You
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Large card - Openness */}
      <TraitCard
        trait="openness"
        className="col-span-2 row-span-2"
        size="large"
      />

      {/* Medium cards */}
      <TraitCard trait="conscientiousness" />
      <TraitCard trait="extraversion" />
      <TraitCard trait="agreeableness" />
      <TraitCard trait="neuroticism" />
    </div>
  </div>
</section>
```

**TraitCard Component:**
```tsx
function TraitCard({ trait, size = "default", className }) {
  const config = TRAIT_CONFIG[trait];

  return (
    <Card
      className={cn(
        "relative overflow-hidden group cursor-pointer",
        "hover:scale-[1.02] transition-transform",
        className
      )}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: `var(--gradient-trait-${trait})` }}
      />

      <CardContent className="relative z-10 p-6 h-full flex flex-col">
        <config.icon
          className="w-10 h-10 mb-4"
          style={{ color: `var(--trait-${trait})` }}
        />

        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: `var(--trait-${trait})` }}
        >
          {config.title}
        </h3>

        {size === "large" && (
          <p className="text-muted-foreground text-sm flex-1">
            {config.description}
          </p>
        )}

        {/* Facet preview on hover */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-muted-foreground">
            6 facets including: {config.sampleFacets.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 5.4 Chat Preview Section

**Interactive Demo:**
```tsx
<section className="py-20 px-6">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-4">
      Meet Nerin
    </h2>
    <p className="text-center text-muted-foreground mb-12">
      Your AI conversation partner for personality discovery
    </p>

    <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
      {/* Chat header */}
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-3">
        <Avatar className="bg-primary">
          <span>N</span>
        </Avatar>
        <div>
          <p className="font-medium">Nerin</p>
          <p className="text-xs text-muted-foreground">AI Personality Guide</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-6 space-y-4 min-h-[300px]">
        <ChatBubble variant="ai">
          Hi! I'm Nerin. I'm curious about what makes you tick.
          Unlike typical personality tests, we're going to have a real conversation.
        </ChatBubble>

        <ChatBubble variant="ai">
          Let's start simple: What's something you've been thinking about lately?
        </ChatBubble>

        <ChatBubble variant="user">
          I've been trying to decide whether to take on a new project at work...
        </ChatBubble>

        <ChatBubble variant="ai">
          That sounds like a meaningful decision. What's making it difficult to choose?
        </ChatBubble>
      </div>

      {/* Fake input */}
      <div className="px-6 py-4 border-t bg-muted/10">
        <div className="flex gap-2">
          <Input
            placeholder="Try typing a response..."
            className="flex-1"
            disabled
          />
          <Button disabled>Send</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Start your real assessment to continue the conversation
        </p>
      </div>
    </div>
  </div>
</section>
```

---

### 5.5 Results Teaser Section

```tsx
<section className="py-20 px-6 bg-muted/30">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="text-3xl font-bold mb-4">
      Discover Your Archetype
    </h2>
    <p className="text-muted-foreground mb-12">
      Every personality is unique. Yours has a name.
    </p>

    {/* Blurred archetype card teaser */}
    <div className="relative inline-block">
      <Card className="w-72 p-6 blur-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Thoughtful Explorer</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Creative, curious, and always seeking deeper understanding...
        </p>
      </Card>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Button size="lg" className="bg-[image:var(--gradient-ocean)]">
          Reveal Your Archetype
        </Button>
      </div>
    </div>
  </div>
</section>
```

---

## Part 6: Animation Specifications

### 6.1 Entrance Animations

```css
/* Fade up on scroll */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* Stagger children */
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
/* ... */
```

### 6.2 Wave Logo Animation

```css
@keyframes wave {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-3px) rotate(2deg);
  }
  75% {
    transform: translateY(3px) rotate(-2deg);
  }
}

.wave-logo {
  animation: wave 4s ease-in-out infinite;
}
```

### 6.3 Gradient Shift Animation

```css
@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animated-gradient {
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
}
```

### 6.4 Scroll Indicator

```css
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.scroll-indicator {
  animation: bounce 2s infinite;
}
```

---

## Part 7: Copy & Messaging

### Hero Headlines (Options)

| Option | Headline | Subhead |
|--------|----------|---------|
| A | "Big Ocean" | Personality assessment that actually understands you. |
| B | "Big Ocean" | Discover the depths of your personality. |
| C | "Big Ocean" | Not a quiz. A conversation about who you are. |
| D | "Big Ocean" | 30 minutes. One conversation. True understanding. |

**Recommended:** Option A — clear, benefit-focused, professional.

### CTA Button Copy (Options)

| Context | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Primary | Start Free Assessment | Begin Your Journey | Meet Nerin & Start |
| Secondary | See How It Works | Watch Demo | Learn More |
| Final | Discover Your Personality | Start Your Assessment | Dive In |

### Trust Signals

- "Takes 30 minutes · Free · No account required"
- "Based on the Big Five — the gold standard in personality science"
- "4.9/5 from 10,000+ users"
- "Your data stays private. Always."

---

## Part 8: Technical Implementation

### Component File Structure

```
apps/front/src/
├── routes/index.tsx                    # Home page (orchestrator)
├── components/
│   └── home/
│       ├── HeroSection.tsx             # Hero with gradient + animations
│       ├── ValuePropsSection.tsx       # 3-column bento
│       ├── TraitsSection.tsx           # Trait cards grid
│       ├── TraitCard.tsx               # Individual trait card
│       ├── ChatPreviewSection.tsx      # Nerin demo
│       ├── ChatBubble.tsx              # Chat message component
│       ├── ResultsTeaserSection.tsx    # Blurred archetype
│       ├── SocialProofSection.tsx      # Testimonials
│       ├── FinalCTASection.tsx         # Bottom CTA
│       ├── WaveLogoAnimated.tsx        # Animated logo
│       ├── OceanParticles.tsx          # Optional particle effect
│       └── ScrollIndicator.tsx         # Bounce arrow
```

### CSS Variables Required

```css
/* Add to globals.css */

/* Hero gradients */
--gradient-hero: radial-gradient(ellipse 80% 50% at 50% 100%, var(--primary) / 0.2, transparent);

/* Animated gradient */
--gradient-ocean-animated: linear-gradient(
  135deg,
  oklch(0.55 0.18 240),
  oklch(0.65 0.15 195),
  oklch(0.55 0.18 240)
);
```

### Performance Considerations

- **Particles:** Use CSS-only or limit to 20-30 elements
- **Gradients:** CSS gradients are GPU-accelerated, prefer over images
- **Animations:** Use `transform` and `opacity` only (composited)
- **Lazy load:** Below-fold sections use `loading="lazy"`
- **Reduce motion:** Respect `prefers-reduced-motion`

---

## Part 9: Mobile Considerations

### Responsive Breakpoints

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Hero | Full viewport | Full viewport | Full viewport, smaller text |
| Value Props | 3 columns | 3 columns | 1 column stack |
| Traits | 4-column bento | 2-column grid | 1 column stack |
| Chat Preview | Full width | Full width | Full width, smaller padding |
| CTA | Centered | Centered | Full-width button |

### Touch Targets

- All buttons: minimum 44x44px
- Card tap areas: full card clickable
- Navigation: hamburger menu on mobile

---

## Part 10: Success Metrics

### What to Measure

| Metric | Target | How |
|--------|--------|-----|
| Scroll depth | >70% reach CTA | Analytics |
| CTA click rate | >15% | Analytics |
| Time on page | >45 seconds | Analytics |
| Bounce rate | <40% | Analytics |
| Assessment starts | >10% of visitors | Conversion tracking |

---

## Summary: Recommended Implementation

1. **Start with Concept D (Bento)** as the foundation
2. **Add Concept A depth** with subtle background gradient progression
3. **Include Concept C interactivity** with chat preview
4. **Use all semantic theme variables** — no hard-coded colors
5. **Implement trait gradients** for visual consistency with results page
6. **Add subtle animations** for polish (respect reduced motion)
7. **Mobile-first responsive design**

---

## Sources

- [SaaSFrame: 10 SaaS Landing Page Trends for 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [LandingPageFlow: Best Gradient Backgrounds](https://www.landingpageflow.com/post/best-gradient-background-for-modern-landing-pages)
- [Thrive Themes: Hero Section Examples](https://thrivethemes.com/hero-section-examples/)
- [Landing Rabbit: SaaS Hero Section Guide](https://landingrabbit.com/blog/saas-website-hero-section)
