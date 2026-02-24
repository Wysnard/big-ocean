# Implementation Blueprint: Public Profile Redesign (Story 15-1)

**Date:** 2026-02-24
**UX Spec:** `public-profile-redesign-ux-spec.md`
**Design Direction:** D+B Hybrid — "The Story Scroll" with poster-scale radar

---

## Patterns and Conventions Found

**Route loader pattern:** `createServerFn` with `getRequestHeader("cookie")` for SSR auth checks (see `apps/front/src/routes/results/$assessmentSessionId.tsx:32-44`). The `beforeLoad` runs a server function, returns `{ isAuthenticated }` into context, and the `loader` uses `context`.

**Data transformation helpers:** `deriveTraitData()` and `toFacetData()` already live in the public profile route (`public-profile.$publicProfileId.tsx:70-103`) — they stay, refined to a shared utility.

**Hero component:** `ArchetypeHeroSection` already accepts `displayName` and has geometric shape decorations. Needs: `subtitle` prop (to override the hardcoded subtitle text), `showScrollIndicator` boolean.

**Radar chart:** `PersonalityRadarChart` uses `ChartContainer` with `max-h-[280px]` constraint. Needs: `width`/`height` props to break free of card container, `showExternalLabels` boolean.

**Facet rendering:** Inline in `TraitCard` (lines 158-179). Extract as `FacetScoreBar` without the mini confidence display.

**Data-slot convention:** All component roots get `data-slot="component-name"`. Use `data-slot` for structural identification, never for state.

**OCEAN trait colors:** `getTraitColor(traitName)` from `@workspace/domain` — used everywhere.

**Assessment status check:** `GET /api/assessment/sessions` returns `ListSessionsResponse` with sessions array. If any session has `status: "completed"`, visitor has a completed assessment. No new backend endpoint needed.

**OG image:** New backend endpoint `GET /api/og/public-profile/:publicProfileId`. Registered outside the Effect HttpApi layer (custom content-type).

---

## Architecture Decision

The route becomes a server-rendered page that resolves three pieces of data in parallel during `loader`:
1. Public profile data (unauthenticated fetch)
2. Auth session check (via `createServerFn`)
3. Assessment completion check (only if authenticated)

The `loader` passes `{ profile, authState }` to the component. The component is pure rendering — no conditional fetching inside it. All data flows top-down.

The OG image endpoint is added to the API as a standalone handler returning `image/svg+xml` — zero new dependencies required.

---

## Complete File List

### Files to Create

| # | File | Purpose |
|---|---|---|
| 1 | `apps/front/src/components/results/FacetScoreBar.tsx` | Extracted shared facet bar (name + score + bar) |
| 2 | `apps/front/src/components/results/TraitBand.tsx` | Full-width horizontal trait+facets band for strata section |
| 3 | `apps/front/src/components/results/PsychedelicBackground.tsx` | CSS-only decorative concentric shapes with rotation |
| 4 | `apps/front/src/components/results/ArchetypeDescriptionSection.tsx` | Editorial description block with gradient bg and quote accents |
| 5 | `apps/front/src/components/results/PublicProfileCTA.tsx` | 3-state conditional CTA (unauth / no-assessment / assessed) |
| 6 | `apps/api/src/handlers/og.ts` | SVG-based OG image generation for social sharing |

### Files to Modify

| # | File | Changes |
|---|---|---|
| 7 | `apps/front/src/components/results/ArchetypeHeroSection.tsx` | Add `subtitle` and `showScrollIndicator` props |
| 8 | `apps/front/src/components/results/PersonalityRadarChart.tsx` | Add `width`/`height`/`showExternalLabels`/`standalone` props |
| 9 | `apps/front/src/components/results/TraitCard.tsx` | Replace inline facet grid with `<FacetScoreBar>` |
| 10 | `apps/front/src/routes/public-profile.$publicProfileId.tsx` | Complete rewrite — new loader, auth state, 5-section layout |
| 11 | `apps/api/src/index.ts` | Register OG image route |

---

## Component Designs with Full Props Interfaces

### 1. `FacetScoreBar.tsx` (new — extracted)

```typescript
import type { FacetResult } from "@workspace/domain";
import { getTraitColor, toFacetDisplayName } from "@workspace/domain";

interface FacetScoreBarProps {
  facet: FacetResult;
  /** Bar height variant: 'compact' (h-1, used in TraitCard) | 'standard' (h-1.5, used in TraitBand) */
  size?: "compact" | "standard";
  /** Whether to show the numeric score */
  showScore?: boolean;
}

export function FacetScoreBar({
  facet,
  size = "compact",
  showScore = true,
}: FacetScoreBarProps) {
  const traitColor = getTraitColor(facet.traitName);
  const facetPct = Math.round((facet.score / 20) * 100);

  return (
    <div data-slot="facet-score-bar" className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate">
          {toFacetDisplayName(facet.name)}
        </span>
        {showScore && (
          <span
            className="text-sm font-data ml-2 shrink-0"
            style={{ color: traitColor }}
          >
            {facet.score}
          </span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full" style={{ height: size === "compact" ? "4px" : "6px" }}>
        <div
          className="rounded-full motion-safe:transition-all motion-safe:duration-500"
          style={{
            width: `${facetPct}%`,
            backgroundColor: traitColor,
            opacity: 0.7,
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
```

**Note:** `size="compact"` renders at `text-[10px]` to match the current `TraitCard` display. `size="standard"` renders at `text-sm` (14px) matching the TraitBand spec.

---

### 2. `TraitBand.tsx` (new)

```typescript
import type { ReactNode } from "react";
import type { FacetResult, TraitName, TraitResult } from "@workspace/domain";
import { getTraitColor } from "@workspace/domain";
import { useEffect, useRef, useState } from "react";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";
import { FacetScoreBar } from "./FacetScoreBar";

const TRAIT_SHAPE: Record<TraitName, (props: { size?: number; color?: string }) => ReactNode> = {
  openness: OceanCircle,
  conscientiousness: OceanHalfCircle,
  extraversion: OceanRectangle,
  agreeableness: OceanTriangle,
  neuroticism: OceanDiamond,
};

const TRAIT_LABELS: Record<TraitName, string> = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Neuroticism",
};

const MAX_TRAIT_SCORE = 120;

interface TraitBandProps {
  trait: TraitResult;
  facets: readonly FacetResult[];
}

export function TraitBand({ trait, facets }: TraitBandProps) {
  const traitColor = getTraitColor(trait.name);
  const scorePercent = Math.round((trait.score / MAX_TRAIT_SCORE) * 100);
  const ShapeComponent = TRAIT_SHAPE[trait.name];

  // Scroll-in animation
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-slot="trait-band"
      data-trait={trait.name}
      className="p-6 motion-safe:transition-all motion-safe:duration-500"
      style={{
        borderLeft: `4px solid ${traitColor}`,
        backgroundColor: `color-mix(in oklch, ${traitColor} 5%, transparent)`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-2">
        <ShapeComponent size={24} color={traitColor} />
        <h2 className="font-display text-xl font-semibold text-foreground flex-1">
          {TRAIT_LABELS[trait.name]}
        </h2>
        <span className="font-data text-2xl font-bold" style={{ color: traitColor }}>
          {trait.score}
          <span className="text-sm text-muted-foreground font-normal">/120</span>
        </span>
      </div>

      {/* Trait score bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-5">
        <div
          className="h-2 rounded-full motion-safe:transition-all motion-safe:duration-700"
          style={{ width: `${scorePercent}%`, backgroundColor: traitColor }}
        />
      </div>

      {/* Facet grid: 3-col desktop / 2-col tablet / 1-col mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
        {facets.map((facet) => (
          <FacetScoreBar key={facet.name} facet={facet} size="standard" />
        ))}
      </div>
    </div>
  );
}
```

---

### 3. `PsychedelicBackground.tsx` (new)

```typescript
import { cn } from "@workspace/ui/lib/utils";

interface PsychedelicBackgroundProps {
  /** Controls opacity range of decorative shapes */
  intensity?: "subtle" | "medium";
  className?: string;
}

export function PsychedelicBackground({
  intensity = "subtle",
  className,
}: PsychedelicBackgroundProps) {
  const baseOpacity = intensity === "subtle" ? 0.035 : 0.06;

  return (
    <div
      data-slot="psychedelic-background"
      aria-hidden="true"
      role="presentation"
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      <style>{`
        @keyframes psychedelic-rotate {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .psychedelic-shape { animation: psychedelic-rotate 60s linear infinite; }
          .psychedelic-shape-reverse { animation: psychedelic-rotate 80s linear infinite reverse; }
        }
      `}</style>

      {/* Openness — large circle */}
      <div
        className="psychedelic-shape absolute top-1/2 left-1/2 rounded-full will-change-transform"
        style={{
          width: "70vmin",
          height: "70vmin",
          backgroundColor: "var(--trait-openness)",
          opacity: baseOpacity,
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Conscientiousness — diamond (rotated square) */}
      <div
        className="psychedelic-shape-reverse absolute top-1/2 left-1/2 will-change-transform"
        style={{
          width: "55vmin",
          height: "55vmin",
          backgroundColor: "var(--trait-conscientiousness)",
          opacity: baseOpacity * 1.2,
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
      />
      {/* Extraversion — rectangle */}
      <div
        className="psychedelic-shape absolute top-1/2 left-1/2 will-change-transform"
        style={{
          width: "80vmin",
          height: "40vmin",
          backgroundColor: "var(--trait-extraversion)",
          opacity: baseOpacity,
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Agreeableness — triangle via clip-path */}
      <div
        className="psychedelic-shape-reverse absolute top-1/2 left-1/2 will-change-transform"
        style={{
          width: "60vmin",
          height: "60vmin",
          backgroundColor: "var(--trait-agreeableness)",
          opacity: baseOpacity * 1.1,
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Neuroticism — concentric ring */}
      <div
        className="psychedelic-shape absolute top-1/2 left-1/2 rounded-full will-change-transform"
        style={{
          width: "45vmin",
          height: "45vmin",
          border: "8vmin solid var(--trait-neuroticism)",
          opacity: baseOpacity,
          transform: "translate(-50%, -50%)",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}
```

**Note:** CSS variable names (`var(--trait-openness)`, etc.) must be confirmed against the actual global CSS. If `getTraitColor()` returns inline oklch values instead, pass `traits` as a prop and call `getTraitColor()` per shape.

---

### 4. `ArchetypeDescriptionSection.tsx` (new)

```typescript
import type { TraitName } from "@workspace/domain";
import { getTraitColor } from "@workspace/domain";
import { GeometricSignature } from "../ocean-shapes/GeometricSignature";

interface ArchetypeDescriptionSectionProps {
  archetypeName: string;
  description: string;
  oceanCode: string;
  dominantTrait: TraitName;
  secondaryTrait: TraitName;
}

export function ArchetypeDescriptionSection({
  archetypeName,
  description,
  oceanCode,
  dominantTrait,
  secondaryTrait,
}: ArchetypeDescriptionSectionProps) {
  const dominantColor = getTraitColor(dominantTrait);
  const secondaryColor = getTraitColor(secondaryTrait);

  return (
    <section
      data-slot="archetype-description-section"
      className="relative py-20 md:py-32"
      style={{
        background: `linear-gradient(180deg, color-mix(in oklch, ${dominantColor} 8%, transparent) 0%, transparent 40%, transparent 60%, color-mix(in oklch, ${secondaryColor} 5%, transparent) 100%)`,
      }}
    >
      <div className="relative mx-auto max-w-[720px] px-6 text-center">
        {/* GeometricSignature as visual divider */}
        <div className="mb-8 opacity-40" aria-hidden="true">
          <GeometricSignature oceanCode={oceanCode} baseSize={24} />
        </div>

        {/* Section title */}
        <h2 className="font-display text-2xl text-muted-foreground mb-8">
          About The {archetypeName}
        </h2>

        {/* Description block with decorative quotes */}
        <div className="relative">
          <span
            className="absolute -top-8 -left-4 font-display text-8xl leading-none select-none"
            aria-hidden="true"
            style={{ color: dominantColor, opacity: 0.2 }}
          >
            &ldquo;
          </span>

          <p className="font-body text-lg md:text-xl leading-relaxed text-foreground">
            {description}
          </p>

          <span
            className="absolute -bottom-12 -right-4 font-display text-8xl leading-none select-none"
            aria-hidden="true"
            style={{ color: dominantColor, opacity: 0.2 }}
          >
            &rdquo;
          </span>
        </div>

        {/* Desktop-only margin accents — stacked OCEAN shapes at 15% opacity */}
        {/* Implementation: OceanCircle/OceanHalfCircle/etc with opacity style */}
      </div>
    </section>
  );
}
```

---

### 5. `PublicProfileCTA.tsx` (new)

```typescript
import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

export type AuthState =
  | "unauthenticated"
  | "authenticated-no-assessment"
  | "authenticated-assessed";

interface PublicProfileCTAProps {
  displayName: string;
  publicProfileId: string;
  authState: AuthState;
}

const CTA_CONTENT: Record<
  AuthState,
  { heading: string; subtext: string; buttonLabel: string; buttonIcon: string }
> = {
  unauthenticated: {
    heading: "Curious about your own personality?",
    subtext: "Discover your archetype through a 10-minute conversation with our AI.",
    buttonLabel: "Discover Your Personality",
    buttonIcon: "🌊",
  },
  "authenticated-no-assessment": {
    heading: "Want to compare personalities?",
    subtext: "Complete your own assessment first, then unlock relationship analysis.",
    buttonLabel: "Start Your Assessment",
    buttonIcon: "🌊",
  },
  "authenticated-assessed": {
    heading: "", // dynamic — uses displayName
    subtext: "Explore where you align and where you differ across all personality traits.",
    buttonLabel: "Start Relationship Analysis",
    buttonIcon: "🔗",
  },
};

export function PublicProfileCTA({
  displayName,
  publicProfileId,
  authState,
}: PublicProfileCTAProps) {
  const content = CTA_CONTENT[authState];
  const heading =
    authState === "authenticated-assessed"
      ? `See how you compare with ${displayName}`
      : content.heading;

  const href =
    authState === "unauthenticated"
      ? "/signup"
      : authState === "authenticated-no-assessment"
        ? "/chat"
        : `/relationship-analysis?with=${publicProfileId}`;

  return (
    <section
      data-slot="public-profile-cta"
      data-auth-state={authState}
      className="py-16 md:py-24"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.67 0.13 181 / 0.08), oklch(0.55 0.24 293 / 0.06))",
      }}
    >
      <div className="mx-auto max-w-[600px] px-6 text-center">
        <h2 className="font-display text-2xl text-foreground mb-3">{heading}</h2>
        <p className="text-muted-foreground mb-8">{content.subtext}</p>

        <Link to={href}>
          <Button
            data-slot="cta-button"
            data-testid="public-profile-cta-button"
            className="bg-primary text-primary-foreground text-lg py-4 px-8 rounded-xl font-semibold min-h-[44px] w-full max-w-[400px]"
          >
            {content.buttonIcon} {content.buttonLabel}
          </Button>
        </Link>

        <p className="text-sm text-muted-foreground mt-8">── big-ocean ──</p>
      </div>
    </section>
  );
}
```

---

## Modified Components

### 6. `ArchetypeHeroSection.tsx` — New Props

Add to existing interface:

```typescript
interface ArchetypeHeroSectionProps {
  // ... existing props ...
  /** Override the subtitle text. Defaults to "{name}'s Personality Archetype" or "Your Personality Archetype" */
  subtitle?: string;
  /** Show animated scroll indicator chevron at bottom. Fades on first scroll. */
  showScrollIndicator?: boolean;
}
```

Changes inside the component:

```typescript
// Replace the subtitle <p>:
<p className="text-sm tracking-wider uppercase font-heading text-foreground/70 mb-4">
  {subtitle ?? (displayName ? `${displayName}'s Personality Archetype` : "Your Personality Archetype")}
</p>

// Add min-height for public profile usage:
// className: add "min-h-[70vh] flex items-center" when showScrollIndicator is true

// Add scroll indicator before closing </section>:
{showScrollIndicator && <ScrollIndicator />}
```

`ScrollIndicator` — local function component:

```typescript
function ScrollIndicator() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 50) setVisible(false); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:hidden"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <ChevronDown className="w-6 h-6 text-muted-foreground motion-safe:animate-bounce" />
    </div>
  );
}
```

---

### 7. `PersonalityRadarChart.tsx` — New Props

Add to existing interface:

```typescript
interface PersonalityRadarChartProps {
  traits: readonly TraitResult[];
  /** Override chart dimensions. Default uses ChartContainer's responsive sizing. */
  width?: number;
  height?: number;
  /** Show large external score labels at each vertex. Default false. */
  showExternalLabels?: boolean;
  /** When true, renders without Card wrapper (for embedded use). Default false. */
  standalone?: boolean;
}
```

Changes:

- When `standalone=true`, skip the `Card`/`CardHeader`/`CardContent` wrapper
- When `width`/`height` provided, apply `style={{ width, height }}` on `ChartContainer` and override `aspect-square max-h-[280px]` classes
- When `showExternalLabels=true`, the `renderTick` callback renders larger colored text:

```typescript
// External label rendering:
<text
  textAnchor="middle"
  className="font-data text-xl font-bold"
  style={{ fill: traitColor, fontSize: "20px" }}
  dy={-8}
>
  {traitInitial}: {score}
</text>
```

---

### 8. `TraitCard.tsx` — Use `FacetScoreBar`

Replace the inline facet grid (lines 158-179) with:

```typescript
import { FacetScoreBar } from "./FacetScoreBar";

<div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
  {facets.map((facet) => (
    <FacetScoreBar key={facet.name} facet={facet} size="compact" showScore={true} />
  ))}
</div>
```

---

## Route Redesign: `public-profile.$publicProfileId.tsx`

### Data Flow

```
Route.loader (server-side)
  ├─ fetchPublicProfile(publicProfileId)      → profile data
  ├─ checkAuthSession() [createServerFn]       → { isAuthenticated, userId }
  └─ if (isAuthenticated) → fetchListSessions() → hasCompletedAssessment
        ↓
  Returns: { profile, authState: AuthState }
        ↓
ProfilePage component (pure rendering)
  ├─ derives: traits = deriveTraitData(profile.facets, profile.traitSummary)
  ├─ derives: facets = toFacetData(profile.facets)
  ├─ derives: dominantTrait = getDominantTrait(traits)
  ├─ derives: secondaryTrait = getSecondaryTrait(traits)
  └─ renders 5-section Story Scroll layout
```

### Server Functions

```typescript
// 1. Auth check (same pattern as results route)
const checkPublicProfileAuth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cookie = getRequestHeader("cookie") ?? "";
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { "Content-Type": "application/json", cookie },
    });
    if (!response.ok) return { isAuthenticated: false as const, userId: null };
    const session = await response.json();
    return {
      isAuthenticated: !!session?.session?.id,
      userId: (session?.user?.id ?? null) as string | null,
    };
  } catch {
    return { isAuthenticated: false as const, userId: null };
  }
});

// 2. Assessment completion check (reuses existing endpoint)
const checkHasCompletedAssessment = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cookie = getRequestHeader("cookie") ?? "";
    const response = await fetch(`${API_URL}/api/assessment/sessions`, {
      headers: { "Content-Type": "application/json", cookie },
    });
    if (!response.ok) return { hasCompleted: false };
    const data = await response.json();
    const hasCompleted = (data.sessions ?? []).some(
      (s: { status: string }) => s.status === "completed"
    );
    return { hasCompleted };
  } catch {
    return { hasCompleted: false };
  }
});
```

### Route Definition

```typescript
export const Route = createFileRoute("/public-profile/$publicProfileId")({
  loader: async ({ params }) => {
    // 1. Fetch public profile (no auth needed)
    let profile: GetPublicProfileResponse | null = null;
    try {
      const response = await fetch(
        `${API_URL}/api/public-profile/${params.publicProfileId}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.ok) {
        profile = await response.json();
      }
    } catch { /* profile stays null */ }

    // 2. Auth check
    const authResult = await checkPublicProfileAuth().catch(() => ({
      isAuthenticated: false,
      userId: null,
    }));

    // 3. Assessment completion (only if authenticated)
    let authState: AuthState = "unauthenticated";
    if (authResult.isAuthenticated) {
      const completionResult = await checkHasCompletedAssessment().catch(() => ({
        hasCompleted: false,
      }));
      authState = completionResult.hasCompleted
        ? "authenticated-assessed"
        : "authenticated-no-assessment";
    }

    return { profile, authState };
  },

  head: ({ loaderData, params }) => {
    const profile = loaderData?.profile;
    const title = profile ? `${profile.archetypeName} | big-ocean` : FALLBACK_TITLE;
    const description = profile?.description || FALLBACK_DESCRIPTION;
    const canonicalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/public-profile/${params.publicProfileId}`;
    const ogImageUrl = `${API_URL}/api/og/public-profile/${params.publicProfileId}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "profile" },
        { property: "og:site_name", content: "big-ocean" },
        { property: "og:image", content: ogImageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImageUrl },
      ],
    };
  },

  component: ProfilePage,
});
```

### ProfilePage Component

```typescript
function ProfilePage() {
  const { publicProfileId } = Route.useParams();
  const { profile, authState } = Route.useLoaderData();

  // Client-side fallback for CSR hydration
  const { data: hookProfile } = useGetPublicProfile(publicProfileId, !profile);
  const resolvedProfile = profile ?? hookProfile;

  if (!resolvedProfile) return <ProfileErrorState publicProfileId={publicProfileId} />;

  const traits = deriveTraitData(resolvedProfile.facets, resolvedProfile.traitSummary);
  const facets = toFacetData(resolvedProfile.facets);
  const dominantTrait = getDominantTrait(traits);
  const secondaryTrait = getSecondaryTrait(traits);
  const displayName = resolvedProfile.displayName ?? "This person";

  return (
    <div data-slot="public-profile" className="min-h-screen bg-depth-surface">

      {/* Section 1: Archetype Hero */}
      <ArchetypeHeroSection
        archetypeName={resolvedProfile.archetypeName}
        oceanCode5={resolvedProfile.oceanCode}
        dominantTrait={dominantTrait}
        displayName={displayName}
        subtitle={`${displayName}'s Personality`}
        showScrollIndicator
      />

      {/* Section 2: The Shape */}
      <section
        data-slot="personality-shape"
        className="relative min-h-[80vh] sm:min-h-[70vh] flex flex-col items-center justify-center py-12"
      >
        <PsychedelicBackground intensity="subtle" />
        <div className="relative z-10 text-center w-full">
          <h2 className="font-display text-2xl text-muted-foreground mb-8">
            Personality Shape
          </h2>
          <PersonalityRadarChart
            traits={traits}
            width={400}
            height={400}
            showExternalLabels
            standalone
          />
          <TraitLegendRow traits={traits} />
        </div>
      </section>

      {/* Section 3: Trait Strata */}
      <section
        data-slot="trait-strata"
        className="max-w-[1120px] mx-auto px-5 py-10 flex flex-col gap-[1px]"
      >
        {BIG_FIVE_TRAITS.map((traitName) => {
          const traitData = traits.find((t) => t.name === traitName);
          if (!traitData) return null;
          const traitFacets = facets.filter((f) => f.traitName === traitName);
          return <TraitBand key={traitName} trait={traitData} facets={traitFacets} />;
        })}
      </section>

      {/* Section 4: Archetype Description */}
      <ArchetypeDescriptionSection
        archetypeName={resolvedProfile.archetypeName}
        description={resolvedProfile.description}
        oceanCode={resolvedProfile.oceanCode}
        dominantTrait={dominantTrait}
        secondaryTrait={secondaryTrait}
      />

      {/* Section 5: CTA */}
      <PublicProfileCTA
        displayName={displayName}
        publicProfileId={publicProfileId}
        authState={authState}
      />

    </div>
  );
}
```

### Inline Helpers

```typescript
/** Derive secondary trait (second-highest score) */
function getSecondaryTrait(traits: TraitResult[]): TraitName {
  if (traits.length < 2) return "conscientiousness";
  const sorted = [...traits].sort((a, b) => b.score - a.score);
  return sorted[1].name;
}

/** Legend row below radar chart */
function TraitLegendRow({ traits }: { traits: readonly TraitResult[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6" aria-hidden="true">
      {BIG_FIVE_TRAITS.map((traitName) => {
        const color = getTraitColor(traitName);
        const ShapeComponent = TRAIT_SHAPE[traitName];
        return (
          <div key={traitName} className="flex items-center gap-1.5 text-sm" style={{ color }}>
            <ShapeComponent size={14} color={color} />
            <span>{TRAIT_LABELS[traitName]}</span>
          </div>
        );
      })}
    </div>
  );
}
```

---

## OG Image Generation (Backend)

### `apps/api/src/handlers/og.ts`

```typescript
/**
 * OG Image Handler
 *
 * Generates dynamic Open Graph images for public profiles.
 * Returns SVG (accepted by most social platforms for OG previews).
 * Route: GET /api/og/public-profile/:publicProfileId
 */

import type { IncomingMessage, ServerResponse } from "node:http";

const API_URL_INTERNAL = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

const TRAIT_COLORS: Record<string, string> = {
  openness: "oklch(0.55 0.24 293)",
  conscientiousness: "oklch(0.6 0.19 250)",
  extraversion: "oklch(0.65 0.2 40)",
  agreeableness: "oklch(0.67 0.13 181)",
  neuroticism: "oklch(0.6 0.22 20)",
};

type ProfileData = {
  archetypeName: string;
  oceanCode: string;
  displayName: string | null;
  traitSummary: Record<string, string>;
  facets: Record<string, { score: number; confidence: number }>;
};

function deriveTraitScores(facets: ProfileData["facets"]): Record<string, number> {
  const TRAIT_FACETS: Record<string, string[]> = {
    openness: ["imagination","artisticInterests","emotionality","adventurousness","intellect","liberalism"],
    conscientiousness: ["selfEfficacy","orderliness","dutifulness","achievementStriving","selfDiscipline","cautiousness"],
    extraversion: ["friendliness","gregariousness","assertiveness","activityLevel","excitementSeeking","positivity"],
    agreeableness: ["trust","morality","altruism","cooperation","modesty","sympathy"],
    neuroticism: ["anxiety","anger","depression","selfConsciousness","immoderation","vulnerability"],
  };
  const scores: Record<string, number> = {};
  for (const [trait, facetNames] of Object.entries(TRAIT_FACETS)) {
    scores[trait] = facetNames.reduce((sum, f) => sum + (facets[f]?.score ?? 0), 0);
  }
  return scores;
}

function generateOgSvg(profile: ProfileData): string {
  const traitScores = deriveTraitScores(profile.facets);
  const dominantTrait = Object.entries(traitScores).sort(([,a],[,b]) => b-a)[0]?.[0] ?? "openness";
  const dominantColor = TRAIT_COLORS[dominantTrait] ?? TRAIT_COLORS.openness;

  const traitOrder = ["openness","conscientiousness","extraversion","agreeableness","neuroticism"];
  const oceanLetters = profile.oceanCode.split("").map((letter, i) => ({
    letter,
    color: TRAIT_COLORS[traitOrder[i]] ?? "#ffffff",
    x: 100 + i * 80,
  }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&amp;family=Space+Mono&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0a0a0f"/>

  <!-- Dominant trait decorative shapes -->
  <circle cx="1050" cy="120" r="280" fill="${dominantColor}" opacity="0.18"/>
  <circle cx="150" cy="520" r="180" fill="${dominantColor}" opacity="0.1"/>

  <!-- Profile label -->
  <text x="100" y="140" font-family="Space Grotesk, sans-serif" font-size="18"
    font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="4">
    ${profile.displayName ? `${profile.displayName.toUpperCase()}'S PERSONALITY` : "PERSONALITY ARCHETYPE"}
  </text>

  <!-- Archetype name -->
  <text x="100" y="240" font-family="Space Grotesk, sans-serif" font-size="72"
    font-weight="700" fill="white" dominant-baseline="auto">
    ${profile.archetypeName}
  </text>

  <!-- OCEAN code — each letter in trait color -->
  ${oceanLetters.map(({ letter, color, x }) =>
    `<text x="${x}" y="340" font-family="Space Mono, monospace" font-size="48"
      font-weight="700" fill="${color}" letter-spacing="8">${letter}</text>`
  ).join("\n  ")}

  <!-- big-ocean wordmark -->
  <text x="100" y="580" font-family="Space Grotesk, sans-serif" font-size="16"
    fill="rgba(255,255,255,0.4)" letter-spacing="2">big-ocean</text>
</svg>`;
}

export async function handleOgImage(
  req: IncomingMessage,
  res: ServerResponse,
  publicProfileId: string
): Promise<void> {
  try {
    const profileRes = await fetch(
      `${API_URL_INTERNAL}/api/public-profile/${publicProfileId}`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!profileRes.ok) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Profile not found");
      return;
    }

    const profile = await profileRes.json() as ProfileData;
    const svg = generateOgSvg(profile);

    res.writeHead(200, {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    });
    res.end(svg);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Failed to generate OG image");
  }
}
```

### Registration in `apps/api/src/index.ts`

Register the OG image route BEFORE the Effect API middleware:

```typescript
import { handleOgImage } from "./handlers/og";

// Register OG route before Effect handler
server.use("/api/og/public-profile/:publicProfileId", async (req, res) => {
  const publicProfileId = req.params.publicProfileId;
  await handleOgImage(req, res, publicProfileId);
});
```

**Note:** The exact registration syntax depends on the server setup in `index.ts`. Verify before implementation.

---

## Build Sequence

### Phase 1: Component Extraction (no visible change, safe)

- [ ] Create `FacetScoreBar.tsx` with `compact` and `standard` sizes
- [ ] Update `TraitCard.tsx` to use `<FacetScoreBar size="compact" />` — verify visually identical
- [ ] Add `subtitle` prop to `ArchetypeHeroSection` — backward compatible
- [ ] Add `showScrollIndicator` prop to `ArchetypeHeroSection` — off by default
- [ ] Add `standalone`, `width`, `height`, `showExternalLabels` to `PersonalityRadarChart` — additive

### Phase 2: New Display Components

- [ ] Create `PsychedelicBackground.tsx` — verify CSS animation 60fps, reduced-motion static
- [ ] Create `TraitBand.tsx` — test with sample data, verify IntersectionObserver animation
- [ ] Create `ArchetypeDescriptionSection.tsx` — verify gradient, check contrast on dark/light
- [ ] Create `PublicProfileCTA.tsx` — test all 3 `authState` variants

### Phase 3: Route Rewrite

- [ ] Add `checkPublicProfileAuth` server function
- [ ] Add `checkHasCompletedAssessment` server function
- [ ] Update `loader` to resolve `authState`
- [ ] Replace `ProfilePage` component with new 5-section layout
- [ ] Update `head()` to add `og:image` meta tags
- [ ] Add `getSecondaryTrait` and `TraitLegendRow` helpers
- [ ] Move error states to `ProfileErrorState` component

### Phase 4: OG Image Backend

- [ ] Create `apps/api/src/handlers/og.ts` with SVG generation
- [ ] Register route in `apps/api/src/index.ts`
- [ ] Verify `Content-Type: image/svg+xml` and caching headers
- [ ] Test with Meta Sharing Debugger

### Phase 5: Polish and Testing

- [ ] Test `prefers-reduced-motion`: animations stop, bands appear immediately
- [ ] Test all 3 CTA states
- [ ] Verify OCEAN letter colors match trait palette
- [ ] Verify facet grid responsiveness: 3-col lg / 2-col sm / 1-col mobile
- [ ] Accessibility audit: `aria-hidden` on decoratives, heading hierarchy, touch targets

---

## Critical Details

### CSS Variable Alignment

The `getTraitColor()` function from `@workspace/domain` returns computed oklch values. Verify whether `var(--trait-openness)` etc. exist in the global CSS. If not, pass traits to `PsychedelicBackground` and call `getTraitColor()` per shape inline.

### OCEAN Letter Coloring in Hero

The current `ArchetypeHeroSection` renders the OCEAN code as a single `<p>`. To color each letter by trait, split into individual `<span>` elements. Map each letter index positionally to `BIG_FIVE_TRAITS[index]` and apply `getTraitColor()`.

### Auth State Fetch Performance

`checkHasCompletedAssessment` only runs when `isAuthenticated === true`. For unauthenticated visitors (majority of traffic), only 2 fetches: profile + auth check.

### `ChartContainer` Size Override

When `standalone=true` with explicit dimensions, override `aspect-square max-h-[280px]` classes via `cn()` utility.

### Error States

Move private/not-found/error states to a `ProfileErrorState` function component in the same route file. Loading state can use `pendingComponent` TanStack Router hook.
