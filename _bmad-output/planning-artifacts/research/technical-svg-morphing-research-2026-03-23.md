---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Modern SVG morphing and manipulation for React/Vite stack'
research_goals: 'Replace flubber with an ESM-native, elegant SVG morphing solution that works cleanly in TanStack Start + Vite + React 19'
user_name: 'Vincentlay'
date: '2026-03-23'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical

**Date:** 2026-03-23
**Author:** Vincentlay
**Research Type:** Technical — SVG Morphing & Manipulation

---

## Research Overview

Comprehensive technical research into modern SVG path morphing solutions for big-ocean's React 19 / Vite 7 / TanStack Start stack. Evaluated 6 libraries, native browser APIs, and 3 integration architectures. Research conducted via multi-source web verification against current (2025-2026) data.

---

## Technical Research Scope Confirmation

**Research Topic:** Modern SVG morphing and manipulation for React/Vite stack
**Research Goals:** Replace flubber with an ESM-native, elegant SVG morphing solution that works cleanly in TanStack Start + Vite + React 19

**Technical Research Scope:**

- Architecture Analysis — SVG path morphing approaches (point interpolation, path normalization, CSS vs JS vs hybrid)
- Implementation Approaches — ESM-native libraries, native browser APIs (Web Animations API, CSS `d` transitions), hand-rolled solutions
- Technology Stack — Motion, GSAP MorphSVG, d3-interpolate-path, svg-path-morph, Lottie, emerging options. ESM support, bundle size, React compat, SSR safety
- Integration Patterns — Monorepo fit, Vite module resolution, SSR with TanStack Start, Docker builds
- Performance Considerations — Frame budget, path complexity, GPU acceleration, prefers-reduced-motion

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-03-23

## Technology Stack Analysis

### SVG Morphing Libraries — The Landscape

#### 1. GSAP MorphSVG (Recommended — Now Free)

**Game changer:** As of April 30, 2025, Webflow acquired GSAP and made ALL plugins completely free, including MorphSVG which was previously paid-only (Club GSAP membership). This fundamentally changes the landscape.

- **What it does:** Smoothly morphs between ANY SVG paths, even with different point counts. Converts everything to cubic beziers, auto-subdivides, and intelligently maps anchor points.
- **ESM support:** Full ESM via npm `gsap`. Tree-shakeable.
- **React compat:** Works with refs + `useEffect`/`useLayoutEffect`. No React-specific wrapper needed — just `gsap.to(pathRef.current, { morphSVG: targetPath })`.
- **SSR safe:** Pure animation library, no DOM on import. Only runs when you call it.
- **Bundle size:** ~23KB core + ~8KB MorphSVG plugin (gzipped).
- **License:** Free for commercial use. Only restriction: can't build a no-code visual animation tool that competes with Webflow.

_Source: [GSAP MorphSVG Docs](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/), [GSAP Free Announcement](https://hostilab.com/2025/05/06/gsap-is-now-completely-free-even-for-commercial-use/), [Codrops MorphSVG Demos](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)_

#### 2. Motion (formerly Framer Motion)

- **What it does:** Animate SVG `d` attribute natively via `<motion.path animate={{ d: "..." }} />`. Works out of the box for paths with **same number and type of path instructions**. For dissimilar paths, Motion recommends pairing with flubber.
- **ESM support:** Native ESM. First-class React library.
- **React compat:** Excellent — `motion.path`, `motion.circle`, etc. Declarative API.
- **SSR safe:** Yes, designed for Next.js/SSR frameworks.
- **Limitation:** Cannot morph between paths with different structures natively — still needs a path mixer (flubber, d3-interpolate-path) for complex morphs.
- **Bundle size:** ~18KB (gzipped, tree-shaken).

_Source: [Motion SVG Animation Docs](https://motion.dev/docs/react-svg-animation), [Motion Path Morphing Tutorial](https://motion.dev/tutorials/react-path-morphing), [Motion SVG Morphing Example](https://examples.motion.dev/js/svg-path-morphing)_

#### 3. d3-interpolate-path

- **What it does:** Zero-dependency interpolator for SVG `<path>` elements. Extends paths to have same number of points when they differ. Returns an interpolation function `(t) => pathString`.
- **ESM support:** Full ESM via npm. Zero dependencies (no longer requires d3 core).
- **React compat:** Framework-agnostic — returns strings. Use with `requestAnimationFrame` or any animation driver.
- **SSR safe:** Pure math, no DOM.
- **Bundle size:** ~5KB (gzipped). Very lightweight.
- **Trade-off:** No animation engine — you drive the timing yourself. Pairs well with Motion's `useMotionValue` or raw rAF.

_Source: [d3-interpolate-path npm](https://www.npmjs.com/package/d3-interpolate-path), [GitHub](https://github.com/pbeshai/d3-interpolate-path)_

#### 4. svg-path-morph

- **What it does:** Tiny library for morphing between SVG path variations. Simple API: give it two paths, get interpolated path at `t`.
- **ESM support:** Available on npm.
- **Limitation:** Works best when paths have the **same commands but different values**. Not suited for morphing completely different shapes (circle → star).
- **Bundle size:** Very small (~2KB).

_Source: [svg-path-morph npm](https://www.npmjs.com/package/svg-path-morph), [GitHub](https://github.com/Minibrams/svg-path-morph)_

#### 5. Flubber (Current — Problematic)

- **What it does:** SVG path interpolation for arbitrary shapes. Handles different point counts.
- **ESM support:** ❌ CJS only. Requires dynamic import hacks for Vite SSR/client compat.
- **Last updated:** 2017. Unmaintained.
- **Bundle size:** ~14KB (gzipped).
- **Verdict:** Works but painful in modern ESM stacks. The CJS interop issues you're experiencing are inherent.

_Source: [Flubber + Motion tutorial](https://blog.olivierlarose.com/tutorials/svg-morph)_

#### 6. KUTE.js SVG Morph

- **What it does:** Animation library with SVG morph component for animating the `d` attribute.
- **ESM support:** Yes, modern build.
- **Bundle size:** ~17KB core + SVG plugin.
- **Trade-off:** Less popular, smaller community. Full animation engine when you may only need morphing.

_Source: [KUTE.js SVG Morph](https://thednp.github.io/kute.js/svgMorph.html)_

### Native Browser APIs

#### CSS `d` Property Animation

Chrome and Edge support animating the SVG `d` presentation attribute via CSS animations and `path('...')` keyframes. However:
- ❌ **Not supported in Firefox or Safari** as of early 2026
- Only works when paths have matching structure
- Not production-ready for cross-browser use

_Source: [CSS-Tricks: Animate SVG Path Changes](https://css-tricks.com/animate-svg-path-changes-in-css/), [CSS-Tricks: SVG Shape Morphing](https://css-tricks.com/svg-shape-morphing-works/)_

#### SMIL `<animate>`

Native SVG animation via `<animate>` elements. Functional across browsers but:
- Declarative (hard to control programmatically from React)
- Deprecated in Chrome (still works but discouraged)
- Not suited for dynamic, data-driven morphing

_Source: [CSS-Tricks: Guide to SVG Animations (SMIL)](https://css-tricks.com/guide-svg-animations-smil/)_

### Technology Adoption Trends

- **GSAP going free** is the biggest shift in the SVG animation landscape in 2025. MorphSVG was the main reason teams chose paid alternatives — that barrier is gone.
- **Motion (Framer Motion)** is the dominant React animation library but explicitly defers to third-party mixers for complex path morphing.
- **d3-interpolate-path** is a hidden gem — zero dependencies, ESM-native, does exactly one thing well. Ideal for "bring your own animation driver" setups.
- **CSS-native morphing** is coming but not cross-browser ready. Worth watching for 2027+.
- **Flubber** is effectively abandoned (last commit 2017) and its CJS format is increasingly hostile to modern tooling.

### Comparison Matrix

| Library | ESM | Arbitrary Shapes | SSR Safe | Bundle | React API | Free |
|---------|-----|-------------------|----------|--------|-----------|------|
| **GSAP MorphSVG** | ✅ | ✅ Best-in-class | ✅ | ~31KB | Imperative (refs) | ✅ (2025) |
| **Motion + mixer** | ✅ | ✅ (with mixer) | ✅ | ~18KB + mixer | Declarative | ✅ |
| **d3-interpolate-path** | ✅ | ✅ Good | ✅ | ~5KB | BYO | ✅ |
| **svg-path-morph** | ✅ | ⚠️ Same cmds only | ✅ | ~2KB | BYO | ✅ |
| **Flubber** | ❌ CJS | ✅ Good | ⚠️ Hacks | ~14KB | BYO | ✅ |
| **KUTE.js** | ✅ | ✅ | ✅ | ~17KB | BYO | ✅ |
| **CSS native** | N/A | ⚠️ Same structure | ✅ | 0KB | CSS | ✅ |

## Integration Patterns Analysis

### Your Stack Constraints

| Layer | Technology | Integration Concern |
|-------|-----------|-------------------|
| Framework | TanStack Start (React 19) | SSR — modules evaluated on server |
| Bundler | Vite 7 | CJS interop, dep optimization, tree shaking |
| Package Manager | pnpm 10 (strict) | Deps only visible to declaring package |
| Monorepo | Turbo + workspaces | `packages/ui` consumed by `apps/front` |
| Deployment | Docker | Container rebuild needed for new deps |
| Animation home | `packages/ui` | Must be SSR-safe, framework-agnostic enough for the shared lib |

### Option A: GSAP MorphSVG — Integration Blueprint

**Install:**
```bash
pnpm add gsap @gsap/react --filter=@workspace/ui
```

**React Integration Pattern:**
GSAP provides `@gsap/react` with a `useGSAP()` hook — a drop-in replacement for `useLayoutEffect` with automatic cleanup via `gsap.context()`. On unmount, all GSAP animations, ScrollTriggers, and instances are reverted automatically. It uses `useIsomorphicLayoutEffect` internally — prefers `useLayoutEffect` but falls back to `useEffect` when `window` is undefined (SSR-safe).

```tsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

function OceanSpinner({ code = "OCEAN" }) {
  const pathRef = useRef(null);

  useGSAP(() => {
    // GSAP handles the morphing timeline
    const tl = gsap.timeline({ repeat: -1 });
    letters.forEach((letter, i) => {
      tl.to(pathRef.current, {
        morphSVG: getPath(letters, (i + 1) % letters.length),
        duration: 1,
        ease: "power2.inOut",
      });
    });
  }, { scope: pathRef });

  return <svg><path ref={pathRef} d={getPath(letters, 0)} /></svg>;
}
```

**Vite/ESM Compat:** GSAP is distributed as ESM on npm. `import gsap from "gsap"` works natively. Plugins must be registered with `gsap.registerPlugin()` to survive tree-shaking. No CJS interop issues.

**SSR Safety:** `useGSAP` handles SSR natively. GSAP itself doesn't touch DOM on import — only when you call animation methods. No `typeof window` guards needed.

**Monorepo:** Install in `packages/ui`. Since GSAP is ESM and `packages/ui` exports raw `.tsx` files (not compiled), Vite treats it as source code and resolves GSAP from `packages/ui/node_modules` correctly via pnpm's symlinks.

**Docker:** Just needs `pnpm install` in the container — no special config.

**Trade-offs:**
- ✅ Eliminates ALL morphing code — GSAP handles point matching, timing, easing
- ✅ `useGSAP` is the cleanest React integration of any animation library
- ✅ No manual `requestAnimationFrame` loop
- ⚠️ Pulls in GSAP core (~23KB) even if you only need morphing
- ⚠️ Imperative API (refs + timelines) vs declarative React patterns

_Source: [GSAP React Guide](https://gsap.com/resources/React/), [@gsap/react npm](https://www.npmjs.com/package/@gsap/react), [GSAP Installation](https://gsap.com/docs/v3/Installation/)_

### Option B: d3-interpolate-path — Integration Blueprint

**Install:**
```bash
pnpm add d3-interpolate-path --filter=@workspace/ui
```

**React Integration Pattern:**
d3-interpolate-path is framework-agnostic — it returns an interpolation function. You drive animation yourself via `requestAnimationFrame` (which you already do in the current OceanSpinner).

```tsx
import { interpolatePath } from "d3-interpolate-path";

// Inside your rAF loop:
const interp = interpolatePath(fromPath, toPath);
pathEl.setAttribute("d", interp(easedT));
```

Drop-in replacement for flubber's `interpolate()` with nearly identical API.

**Vite/ESM Compat:** ✅ Native ESM. Zero dependencies. No CJS interop issues whatsoever. `import { interpolatePath } from "d3-interpolate-path"` just works.

**SSR Safety:** ✅ Pure math — no DOM, no `window`. Safe to import at module level on server.

**Monorepo:** Trivial — single ESM package, no special config.

**Docker:** Nothing special.

**Trade-offs:**
- ✅ Smallest bundle (~5KB)
- ✅ Drop-in replacement for flubber's interpolator API
- ✅ You keep full control over animation timing (your existing rAF loop stays)
- ✅ Zero migration risk — swap one function call
- ⚠️ You still own the animation loop, breathe pulse, color transitions
- ⚠️ Path interpolation quality may differ from flubber (different algorithm)

_Source: [d3-interpolate-path npm](https://www.npmjs.com/package/d3-interpolate-path), [GitHub](https://github.com/pbeshai/d3-interpolate-path), [Chris Henrick: Animating SVG with D3 + React Hooks](https://clhenrick.io/blog/animating-svg-d3-react-hooks/)_

### Option C: Motion Native `d` Animation — Integration Blueprint

**Already in your stack?** Check if `motion` (Framer Motion) is installed. If so, this is zero new dependencies.

**React Integration Pattern:**
```tsx
<motion.path
  d={currentPath}
  animate={{ d: targetPath }}
  transition={{ duration: 1, ease: "easeInOut" }}
/>
```

**Critical Limitation:** Paths must have the **same number and type of SVG commands**. Your 15 hieroglyphs use different primitives (circles, rects, polygons, paths) — even after normalization to paths, they have different command structures. This means Motion native morphing **won't work** without re-authoring all 15 shapes to have uniform path structures (same number of cubic bezier commands).

**Verdict:** Elegant if feasible, but requires significant hieroglyph data rework. Could be a future optimization if you normalize all shapes to a common point count.

_Source: [Motion SVG Animation Docs](https://motion.dev/docs/react-svg-animation), [Motion Path Morphing Tutorial](https://motion.dev/tutorials/react-path-morphing)_

### Recommendation Matrix for big-ocean

| Factor | GSAP MorphSVG | d3-interpolate-path | Motion native |
|--------|--------------|--------------------|----|
| Migration effort | Medium (rewrite animation loop) | **Minimal (swap interpolator)** | High (re-author all shapes) |
| Bundle impact | +31KB | **+5KB** | 0KB (if already using Motion) |
| Code simplification | **Best (GSAP owns the loop)** | Same complexity as now | Best (declarative) |
| ESM/SSR compat | ✅ Clean | **✅ Cleanest** | ✅ Clean |
| Morph quality | **Best** | Good | N/A for different shapes |
| Future flexibility | **Best (full animation toolkit)** | Morphing only | Declarative animations |

### Integration Verdict

**Quick win → d3-interpolate-path.** Swap `flubber.interpolate` for `interpolatePath`. Your existing animation loop, breathe pulse, color transitions all stay. One line change, zero CJS headaches.

**Strategic investment → GSAP MorphSVG.** If you want to level up the animation quality across the whole app (not just the spinner), GSAP is now free and gives you the best morphing algorithm plus a complete animation toolkit. The `useGSAP` hook is the cleanest React integration available.

**Not yet → Motion native `d`.** Requires re-authoring all hieroglyphs. Worth revisiting if you standardize path structures later.

## Architectural Patterns and Design

### Current Architecture (What You Have)

```
Domain Layer (pure data)
├── ocean-hieroglyphs.ts        → 15 shape defs (mixed SVG primitives)
├── ocean-hieroglyph-paths.ts   → 15 normalized path strings (manual conversion)
└── types/ocean-hieroglyph.ts   → HieroglyphDef, HieroglyphElement types

UI Layer (React components)
├── OceanHieroglyph             → Renders single glyph (mixed primitives via createElement)
├── OceanHieroglyphCode         → 5-glyph row with staggered reveal
├── OceanHieroglyphSet          → 5 "high" glyphs for branding
├── OceanSpinner                → Morph cycle (flubber + manual rAF loop)
└── OceanSkeleton               → Progressive reveal with dismiss animation
```

**Pain points in current architecture:**
1. `ocean-hieroglyph-paths.ts` is a **manual duplicate** of `ocean-hieroglyphs.ts` — hand-converted to path strings for flubber. Two sources of truth for the same 15 shapes.
2. The OceanSpinner has a complex rAF loop with manual phase management (hold/morph), breathe pulse, color transitions — all hand-rolled.
3. Flubber's CJS format requires dynamic import hacks and `typeof window` guards.

### Architecture with d3-interpolate-path (Minimal Change)

```
Domain Layer — NO CHANGE
├── ocean-hieroglyphs.ts        → kept as-is
├── ocean-hieroglyph-paths.ts   → kept as-is (still needed)

UI Layer
├── OceanSpinner                → Same rAF loop, swap interpolator function
│   └── flubber.interpolate → interpolatePath (one line)
```

**What changes:** One import, one function call. Everything else stays.
**What doesn't improve:** Still two data sources, still manual rAF, still all the hand-rolled animation logic.

### Architecture with GSAP MorphSVG (Strategic Redesign)

```
Domain Layer
├── ocean-hieroglyphs.ts        → kept as-is (rendering)
├── ocean-hieroglyph-paths.ts   → DELETE — GSAP convertToPath handles this

UI Layer
├── OceanHieroglyph             → unchanged
├── OceanSpinner                → REWRITE: useGSAP + GSAP timeline
│   └── No manual rAF, no phase state, no breathe math
│   └── GSAP handles: morphing, easing, timing, looping
│   └── MorphSVGPlugin.convertToPath() at init converts primitives
└── OceanSkeleton               → Could use gsap.from() for reveal/dismiss
```

**Key architectural insight: `MorphSVGPlugin.convertToPath()`**

This GSAP utility converts `<circle>`, `<rect>`, `<ellipse>`, `<polygon>`, `<polyline>`, and `<line>` into equivalent `<path>` elements **in the DOM**. It preserves all attributes (id, fill, class).

This means you could:
1. **Delete `ocean-hieroglyph-paths.ts` entirely** — no more manual path normalization
2. Render hieroglyphs normally via `OceanHieroglyph` (mixed primitives)
3. Call `MorphSVGPlugin.convertToPath()` on mount to normalize them to paths
4. Then morph between them via GSAP timeline

**Single source of truth restored.** The 15 shape definitions in `ocean-hieroglyphs.ts` are the only data source.

### Design Principles Applied

#### Separation of Concerns

| Concern | d3-interpolate-path | GSAP MorphSVG |
|---------|-------------------|---------------|
| Shape data | Domain layer | Domain layer |
| Path normalization | Manual (`ocean-hieroglyph-paths.ts`) | GSAP auto (`convertToPath`) |
| Interpolation | d3-interpolate-path | GSAP MorphSVG |
| Animation timing | Manual rAF loop | GSAP timeline |
| Easing | Manual `easeInOutCubic` | GSAP built-in easings |
| Lifecycle cleanup | Manual `cancelAnimationFrame` | `useGSAP` auto-cleanup |
| Color transitions | Manual inline style | Could use GSAP color tween |

#### Custom Hook Architecture (GSAP path)

```tsx
// Reusable hook for any morphing animation in the design system
function useOceanMorph(pathRef: RefObject<SVGPathElement>, paths: string[], options?: {
  interval?: number;
  ease?: string;
  mono?: boolean;
}) {
  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1 });
    paths.forEach((targetPath, i) => {
      tl.to(pathRef.current, {
        morphSVG: paths[(i + 1) % paths.length],
        duration: options?.interval ?? 1,
        ease: options?.ease ?? "power2.inOut",
      });
    });
  }, { scope: pathRef, dependencies: [paths] });
}
```

This hook could power not just OceanSpinner but any future morphing animation in the app.

### Scalability Considerations

**Future animation needs in big-ocean:**
- Results page reveal choreography (trait cards, archetype hero)
- Relationship ritual screen transitions
- Share card generation animations
- Onboarding/assessment flow transitions

With GSAP in the stack, all of these become timeline compositions using the same toolkit. With d3-interpolate-path, you only solve morphing — every other animation remains ad-hoc CSS or manual JS.

### Performance Architecture

Both options are performant for the OceanSpinner use case (5 morphs in a loop). Key considerations:

- **GSAP** uses its own internal ticker (not rAF directly) which batches multiple animations. More efficient when multiple GSAP animations run simultaneously.
- **d3-interpolate-path** + manual rAF is fine for a single spinner but doesn't scale to orchestrated multi-element animations.
- Both produce ~60fps for simple path morphs on modern hardware.
- `prefers-reduced-motion`: GSAP has `gsap.matchMedia()` for responsive animation; d3 requires manual media query handling (which you already have).

_Source: [GSAP MorphSVG convertToPath](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/), [GSAP convertToPath CodePen](https://codepen.io/GreenSock/pen/gagNeR), [React Design Patterns 2025](https://www.telerik.com/blogs/react-design-patterns-best-practices)_

## Implementation Approaches and Migration

### Migration Path A: d3-interpolate-path (Quick Fix)

**Effort:** ~30 minutes. **Risk:** Near zero.

#### Step 1: Swap dependency
```bash
pnpm remove flubber @types/flubber --filter=@workspace/ui
pnpm add d3-interpolate-path --filter=@workspace/ui
```

#### Step 2: Change one import + one call in `ocean-spinner.tsx`
```diff
- import("flubber").then((m) => { ... })
+ import { interpolatePath } from "d3-interpolate-path";
```

```diff
- cachedInterp = _interpolate(fromPathD, toPathD, { maxSegmentLength: 5 });
+ cachedInterp = interpolatePath(fromPathD, toPathD);
```

#### Step 3: Delete dynamic import boilerplate
Remove the `_interpolate`, `flubberReady`, `typeof window` guard, `ready` state, and the `useEffect` that loads flubber. The import is static ESM — works everywhere.

#### Step 4: Rebuild Docker
```bash
docker compose build frontend && docker compose up -d --force-recreate frontend
```

**What you keep:** `ocean-hieroglyph-paths.ts`, manual rAF loop, breathe pulse logic, color transitions, all hand-rolled.
**What you fix:** CJS/ESM compat issues. That's it.

---

### Migration Path B: GSAP MorphSVG (Strategic Upgrade)

**Effort:** ~2-3 hours. **Risk:** Low (well-documented API, huge community).

#### Step 1: Install GSAP
```bash
pnpm remove flubber @types/flubber --filter=@workspace/ui
pnpm add gsap @gsap/react --filter=@workspace/ui
```

#### Step 2: Register MorphSVG plugin (once, at app level or component level)
```tsx
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(MorphSVGPlugin);
```

#### Step 3: Rewrite OceanSpinner
Replace the entire rAF loop with a GSAP timeline. GSAP can morph directly to raw path data strings — no DOM element target needed for the destination shape.

```tsx
export function OceanSpinner({ code = "OCEAN", size = 32, interval = 1.2, mono = false, ... }) {
  const letters = code.split("") as TraitLevel[];
  const containerRef = useRef<HTMLOutputElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const path = pathRef.current;
    if (!path || letters.length < 2) return;

    const tl = gsap.timeline({ repeat: -1 });

    letters.forEach((_, i) => {
      const nextIndex = (i + 1) % letters.length;
      const nextPath = getPath(letters, nextIndex);

      // Morph to next shape
      tl.to(path, {
        morphSVG: nextPath,
        duration: interval * 0.6,
        ease: "power2.inOut",
      });

      // Hold with breathe pulse
      tl.to(path, {
        scale: 1.05,
        transformOrigin: "50% 50%",
        duration: interval * 0.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
      }, `>-0.1`);

      // Color transition (if not mono)
      if (!mono) {
        tl.to(path, {
          color: traitColorVar(nextIndex),
          duration: interval * 0.3,
        }, `<`);
      }
    });
  }, { scope: containerRef, dependencies: [letters, interval, mono] });

  return (
    <output ref={containerRef} aria-label="Loading" className={cn("inline-flex items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ width: size, height: size }}>
        <path ref={pathRef} d={getPath(letters, 0)} />
      </svg>
    </output>
  );
}
```

**What disappears:**
- ❌ `ocean-hieroglyph-paths.ts` — can delete if using `convertToPath()`, OR keep as simple path lookup (still useful for initial `d` attribute)
- ❌ Manual `requestAnimationFrame` loop
- ❌ `easeInOutCubic` function
- ❌ Phase state management (`hold` / `morph`)
- ❌ Cached interpolator logic
- ❌ `prefersReducedMotion` manual handling — use `gsap.matchMedia()` instead
- ❌ Dynamic import / `typeof window` / `ready` state boilerplate

**What you gain:**
- ✅ ~50% less code in OceanSpinner
- ✅ Better morph quality (GSAP's algorithm is superior)
- ✅ Built-in easing library (50+ options)
- ✅ `useGSAP` handles cleanup, SSR, and lifecycle automatically
- ✅ GSAP available for future animations across the app

#### Step 4: Optionally upgrade OceanSkeleton
The staggered reveal/dismiss could use GSAP stagger:
```tsx
gsap.from(".glyph-slot", {
  scale: 0, opacity: 0,
  stagger: 0.1,
  ease: "back.out(1.7)",
});
```

#### Step 5: Update kitchen sink, rebuild Docker

#### Step 6: Consider deleting `ocean-hieroglyph-paths.ts`
If you still need path strings for the initial `d` attribute on the `<path>` element, keep the file. But if you switch to rendering via `OceanHieroglyph` + `convertToPath()` on mount, you can delete it entirely.

**Practical note:** Keeping `ocean-hieroglyph-paths.ts` for the initial `d` attribute is simpler than running `convertToPath()` on mount. The file is small and stable. Delete it later if/when you refactor the hieroglyph rendering layer.

---

### Risk Assessment

| Risk | d3-interpolate-path | GSAP MorphSVG |
|------|-------------------|---------------|
| Breaking existing animations | None | Low (full rewrite, but isolated to spinner) |
| Bundle size regression | -9KB (flubber→d3) | +17KB net (flubber→gsap+morphsvg) |
| SSR issues | None (static ESM) | None (useGSAP handles it) |
| Learning curve | None (same API shape) | Low (well-documented, huge community) |
| Future maintenance | Same as now | Better (GSAP actively maintained, Webflow-backed) |
| Docker rebuild | Yes (new dep) | Yes (new dep) |

### Testing Strategy

For either migration:
1. Visual regression — compare morph quality in kitchen sink (`/dev/components`)
2. SSR smoke test — ensure no hydration errors on page load
3. `prefers-reduced-motion` — verify fallback behavior
4. Performance — confirm 60fps morph cycle in Chrome DevTools Performance tab
5. Docker — rebuild and verify container runs clean

### Recommendation

**If you want to fix the immediate pain and move on:** d3-interpolate-path. 30 minutes, done.

**If you want to invest in the animation layer for big-ocean's future:** GSAP MorphSVG. 2-3 hours, and you'll never reach for flubber, manual rAF loops, or hand-rolled easing again.

Both are solid choices. The question is: **fix the leak or upgrade the plumbing?**

_Source: [GSAP MorphSVG Docs](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/), [GSAP MorphSVG raw path data](https://gsap.com/community/forums/topic/28990-morphsvg-raw-path-data-vs-href/)_

## Technical Research Recommendations

### Implementation Roadmap

**Phase 1 (Now):** Replace flubber with chosen solution. Fix the CJS/ESM pain.
**Phase 2 (If GSAP):** Explore GSAP for OceanSkeleton reveal/dismiss animations.
**Phase 3 (Future):** Consider GSAP for results page choreography, ritual transitions, and other animated experiences across big-ocean.

### Success Metrics

- Zero CJS/ESM interop errors in Docker + Vite + SSR
- Morph animation runs at 60fps
- No hydration mismatches
- Bundle size delta within acceptable range
- `prefers-reduced-motion` respected

---

## Research Synthesis

### Executive Summary

This research evaluated modern alternatives to flubber for SVG path morphing in big-ocean's React/Vite/TanStack Start stack. The key finding: **GSAP went completely free in April 2025** (Webflow acquisition), making its industry-leading MorphSVG plugin available at no cost. This eliminates the primary reason flubber existed as a lightweight alternative.

**Three viable options were evaluated:**

| Option | Effort | Risk | Benefit |
|--------|--------|------|---------|
| **d3-interpolate-path** | 30 min | Near zero | Fixes CJS/ESM issue, nothing else |
| **GSAP MorphSVG** | 2-3 hrs | Low | Better morphs, less code, future animation toolkit |
| Motion native `d` | High | Medium | Requires re-authoring all 15 hieroglyphs |

### Final Recommendation

**GSAP MorphSVG** is the recommended path for big-ocean.

**Why:**
1. **Eliminates the root cause** — GSAP is native ESM, no CJS interop hacks needed
2. **Less code** — GSAP timeline replaces the manual rAF loop, phase management, easing function, and cleanup logic (~50% reduction)
3. **Better morph quality** — GSAP's point-matching algorithm is the best in class, avoiding the twisting artifacts that simpler interpolators produce
4. **`convertToPath()` utility** — can eliminate the manually-maintained `ocean-hieroglyph-paths.ts` duplicate data source
5. **`useGSAP` hook** — handles React lifecycle cleanup, SSR safety, and scoping automatically via `@gsap/react`
6. **Future-proof** — GSAP becomes the animation toolkit for results reveals, ritual transitions, page choreography, and any future animated experience in big-ocean
7. **Free forever** — Webflow-backed, no licensing friction, massive community

**When d3-interpolate-path makes sense instead:**
- If you want the absolute minimum change right now and plan to revisit animation architecture later
- If bundle size is a critical constraint (~5KB vs ~31KB)

### Key Technical Facts Verified

| Claim | Verified | Source |
|-------|----------|--------|
| GSAP is free including MorphSVG | ✅ April 2025 | [gsap.com/pricing](https://gsap.com/pricing/) |
| GSAP is ESM on npm | ✅ | [gsap npm](https://www.npmjs.com/package/gsap) |
| `useGSAP` handles SSR | ✅ Falls back to useEffect | [@gsap/react](https://www.npmjs.com/package/@gsap/react) |
| `convertToPath()` converts circle/rect/etc | ✅ | [GSAP MorphSVG docs](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/) |
| d3-interpolate-path is zero-dependency ESM | ✅ | [npm](https://www.npmjs.com/package/d3-interpolate-path) |
| CSS `d` animation is Chrome/Edge only | ✅ | [CSS-Tricks](https://css-tricks.com/animate-svg-path-changes-in-css/) |
| Flubber last updated 2017, CJS only | ✅ | [GitHub](https://github.com/veltman/flubber) |

### Implementation Next Steps

1. **Install:** `pnpm add gsap @gsap/react --filter=@workspace/ui`
2. **Remove:** `pnpm remove flubber @types/flubber --filter=@workspace/ui`
3. **Rewrite OceanSpinner** using GSAP timeline + `useGSAP` (see Implementation section for code)
4. **Optionally upgrade OceanSkeleton** reveal/dismiss with GSAP stagger
5. **Consider deleting** `ocean-hieroglyph-paths.ts` if using `convertToPath()`
6. **Rebuild Docker**, verify in kitchen sink
7. **Add GSAP to CLAUDE.md** as the standard animation library

### All Sources

- [GSAP MorphSVG Documentation](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/)
- [GSAP React Guide](https://gsap.com/resources/React/)
- [@gsap/react npm](https://www.npmjs.com/package/@gsap/react)
- [GSAP Installation](https://gsap.com/docs/v3/Installation/)
- [GSAP Free Announcement](https://hostilab.com/2025/05/06/gsap-is-now-completely-free-even-for-commercial-use/)
- [GSAP Pricing](https://gsap.com/pricing/)
- [GSAP convertToPath CodePen](https://codepen.io/GreenSock/pen/gagNeR)
- [Codrops MorphSVG Demos](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)
- [d3-interpolate-path npm](https://www.npmjs.com/package/d3-interpolate-path)
- [d3-interpolate-path GitHub](https://github.com/pbeshai/d3-interpolate-path)
- [Motion SVG Animation Docs](https://motion.dev/docs/react-svg-animation)
- [Motion Path Morphing Tutorial](https://motion.dev/tutorials/react-path-morphing)
- [svg-path-morph npm](https://www.npmjs.com/package/svg-path-morph)
- [KUTE.js SVG Morph](https://thednp.github.io/kute.js/svgMorph.html)
- [CSS-Tricks: Animate SVG Path Changes](https://css-tricks.com/animate-svg-path-changes-in-css/)
- [CSS-Tricks: SVG Shape Morphing](https://css-tricks.com/svg-shape-morphing-works/)
- [Animating SVG with D3 + React Hooks](https://clhenrick.io/blog/animating-svg-d3-react-hooks/)

---

**Technical Research Completed:** 2026-03-23
**Confidence Level:** High — all critical claims verified against current sources
**Document:** `_bmad-output/planning-artifacts/research/technical-svg-morphing-research-2026-03-23.md`
