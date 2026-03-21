# Kitchen Sink Prototyping — Workflow Brief

**For use with:** `/bmad_bmb_create_workflow` → Select `[F]rom scratch` → Paste this brief when Wendy asks.

---

## Workflow Name
Kitchen Sink Prototyping

## Purpose
A guided UX prototyping workflow where Sally (UX Designer) helps the user redesign or improve any UI/UX element — a page, a section, a component, or an interaction pattern — by reproducing it in a dev-only kitchen sink route using real components and mock data, then iterating on improvements.

## Agent
Sally (UX Designer) — `ux-designer`

## Module
`bmm`

## Key Context
- The project has a kitchen sink at `/dev/components` with all design tokens, primitives, identity components, chat, results, charts, and modals.
- Prototyping happens in real code using actual project components, not Figma.
- Dev route prototypes are gated behind `import.meta.env.DEV` so they never ship to production.
- The target of prototyping can be anything UI/UX related: a full page, a page section, a single component, or an interaction pattern.

## Steps

### Step 1: Reproduce
Recreate the current state of the targeted UI element (page, section, or component) in a dev-only kitchen sink route (`/dev/{target-name}-current`) using real components and mock data. The goal is to have an accurate, isolated reproduction of what exists today so the diagnosis is clear, visual, and unambiguous.

### Step 2: Diagnose
With the reproduction in front of us, identify concrete pain points. For each pain point, classify it as:
- **Layout** — things in the wrong place, poor hierarchy, wasted space
- **Visual** — doesn't match the design identity, inconsistent styling, poor contrast
- **Content** — wrong information hierarchy, missing or redundant content
- **Interaction** — confusing flows, missing feedback, accessibility gaps

Produce a clear numbered list of pain points with their classification. This becomes the redesign brief.

### Step 3: Define Information Hierarchy
Rank every piece of information/component in the target by importance for the intended audience. Define what the user should see first, second, third. This drives the layout decisions.

### Step 4: Sketch
Paper sketch 2-3 different layout/design options (10 min). Focus on:
- Mobile-first scroll story
- Above-the-fold content
- The "share moment" — if someone screenshots this, is it compelling?

### Step 5: Build Prototype
Create a `/dev/{target-name}-v2` route importing real components with mock data. Implement the chosen sketch direction using actual project components from the kitchen sink.

### Step 6: Compare & Iterate
Side-by-side comparison of current reproduction (Step 1) vs prototype (Step 5):
- Toggle light/dark theme
- Resize to mobile width
- Check each pain point from Step 2 — is it resolved?
- If pain points remain, loop back to Step 5.

### Step 7: Deliver
Once satisfied, the user chooses one of two output modes:

**[S] Ship directly** — Migrate the prototype layout/changes directly into the real route/component in the codebase.

**[D] Document for planning** — Produce a UX redesign document that includes:
- Before/after description with pain points addressed
- Information hierarchy decisions
- Component composition and layout specification
- Recommended changes to the authoritative UX design doc
- Ready to feed into epic/story creation (`/bmad-bmm-create-epics-and-stories`)
