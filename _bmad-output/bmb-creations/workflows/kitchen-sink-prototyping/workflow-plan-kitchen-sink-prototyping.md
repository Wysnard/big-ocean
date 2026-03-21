---
stepsCompleted: ['step-01-discovery', 'step-02-classification', 'step-03-requirements', 'step-04-tools', 'step-05-plan-review', 'step-06-design', 'step-07-foundation', 'step-08-build-step-01', 'step-09-build-steps', 'step-10-confirmation', 'validation']
created: 2026-03-21
status: COMPLETE
completedDate: 2026-03-21
validationStatus: PASS
approvedDate: 2026-03-21
---

# Workflow Creation Plan

## Discovery Notes

**User's Vision:**
A guided UX prototyping workflow where Sally (UX Designer) helps anyone — developer, designer, or PM — redesign or improve any UI/UX element by building real, working prototypes in a dev-only kitchen sink route. The workflow is both diagnostic (reproduce and diagnose what exists) and generative (brainstorm ideas, explore new directions). Every idea gets realized in actual code with real components so you can see it immediately in the app context, not just imagine it.

**Who It's For:**
Anyone on the team — developers, designers, PMs — working with Sally (UX Designer agent) to improve UI/UX elements.

**What It Produces:**
- Real, running prototypes in dev-only kitchen sink routes using actual project components and mock data
- Either ships changes directly into the codebase, or produces a UX redesign document for planning

**Key Insights:**
- Core value is speed to visual truth — real code prototypes over abstract design discussions
- Workflow is both diagnostic (identify pain points) and generative (brainstorm and explore ideas)
- Iteration is fast: try, look, tweak, repeat within a session
- Also supports multi-session continuity — pick up a prototype days later and keep evolving
- Dev routes are gated behind `import.meta.env.DEV` so prototypes never ship to production
- The project already has a kitchen sink at `/dev/components` with all design tokens and real components
- A living document builds up throughout the workflow, tracking decisions, pain points, and iterations — serves as implementation docs if shipped directly, or as UX redesign spec if sent to planning

## Classification Decisions

**Workflow Name:** ux-prototype
**Target Path:** `_bmad/bmm/workflows/ux-prototype/`

**4 Key Decisions:**
1. **Document Output:** true — living document that tracks the entire prototyping journey, usable as either implementation docs or planning spec
2. **Module Affiliation:** BMM (Software development workflows)
3. **Session Type:** Continuable — can span multiple sessions, supports both quick sprints and multi-day iteration
4. **Lifecycle Support:** Create-only — `steps-c/` only, lean and focused

**Structure Implications:**
- Needs `step-01b-continue.md` for session resumption
- `stepsCompleted` tracking in output document frontmatter
- Single `steps-c/` folder (no edit/validate modes)
- Output document appended progressively through each step

## Requirements

**Flow Structure:**
- Pattern: Linear with multiple loop points
- Loops: Diagnose ↔ Hierarchy (rethink based on findings), Build ↔ Compare & Iterate (main iteration loop), Sketch → Diagnose (if sketching reveals new pain points)
- Branch: Early branch on existing element vs new feature (existing → reproduce first, new → skip to brainstorm/sketch)
- Phases: Target identification → Reproduce (if existing) → Diagnose → Define Hierarchy → Sketch → Build Prototype → Compare & Iterate → Deliver
- Estimated steps: 7-8

**User Interaction:**
- Style: Mixed — collaborative for creative/analytical steps (brainstorming, diagnosing, sketching), autonomous for structural steps (reproduction, building prototypes)
- Decision points:
  - After Diagnose: which pain points to prioritize
  - After Sketch: which direction to pursue
  - After Compare: iterate more or move to delivery
  - Delivery: Ship directly vs Document for planning
- Checkpoint frequency: After each major phase

**Inputs Required:**
- Required: Target specification (page, section, component, or interaction) and whether it's an existing element to improve or a new feature to prototype
- Optional: Design brief, user feedback, analytics data — helpful context but not blocking
- Prerequisites: None beyond the existing project setup

**Code Isolation Rules:**
- **Reproduce (Phase 2):** Import and reuse existing components from the codebase — no new files outside the dev route
- **Build Prototype (Phase 5):** All new components, layouts, and visual artifacts are created inside the prototype route folder (`/dev/{target}-v2/`) — self-contained, no pollution of the main codebase
- **Ship (Phase 7, option S):** Migrate artifacts from prototype folder into the real codebase
- Route folder structure:
  ```
  apps/front/src/routes/dev/
  ├── {target}-current.tsx      # Reproduction (imports only)
  └── {target}-v2/
      ├── route.tsx             # Prototype route
      ├── components/           # New/modified components
      └── ...                   # Any visual artifacts
  ```

**Output Specifications:**
- Type: Document (living record of prototyping journey)
- Format: Semi-structured
- Core sections:
  - Target — what we're prototyping (existing or new), context
  - Diagnosis — pain points with classifications (if existing element)
  - Information Hierarchy — priority ranking of content/components
  - Iterations — each sketch/prototype attempt with rationale and outcome
  - Delivery — ship or document decision, summary of changes
- Frequency: Single document per prototyping session, appended progressively

**Success Criteria:**
- User can see the prototype running in the browser with real components
- Pain points from diagnosis are visibly addressed (if improving existing UI)
- Living document clearly captures the why behind every decision
- Output is actionable — either ready to ship or ready to feed into planning

**Instruction Style:**
- Overall: Mixed
- Intent-based: Creative steps (brainstorming, sketching ideas, exploring directions)
- Prescriptive: Structural steps (reproducing current UI, classifying pain points, delivery choice)

## Workflow Structure Preview

**Phase 1: Initialization** — Gather target, determine mode (existing vs new), collect optional context
**Phase 2: Reproduce** *(existing only)* — Build `/dev/{target}-current` route, confirm with user, loop until accurate
**Phase 3: Diagnose & Define Hierarchy** — Identify/classify pain points, rank information priority, ↔ loop between diagnosis and hierarchy
**Phase 4: Brainstorm & Sketch** — Explore 2-3 directions, focus on mobile-first and "share moment"
**Phase 5: Build Prototype** — Create `/dev/{target}-v2` route implementing chosen direction
**Phase 6: Compare & Iterate** — Side-by-side comparison, check themes/responsive/pain points, ↔ loop back to Build
**Phase 7: Deliver** — Ship directly or Document for planning, finalize living document

## Tools Configuration

**Core BMAD Tools:**
- **Party Mode:** included — Integration point: Phase 4 (Brainstorm & Sketch) for generating multiple design perspectives and debating layout approaches
- **Advanced Elicitation:** included — Integration point: Phase 3 (Diagnose & Define Hierarchy) for deep UX investigation and challenging assumptions
- **Brainstorming:** included — Integration point: Phase 6 (Compare & Iterate) for generating fresh ideas when the prototype needs rethinking

**LLM Features:**
- **Web-Browsing:** included — Use case: Design inspiration, UI pattern research, accessibility guidelines lookup
- **File I/O:** included — Operations: Read existing components/routes, write dev-only routes, read/update living document, read kitchen sink components
- **Sub-Agents:** included — Use case: Parallel work — agents reading/building code while Sally focuses on conversation
- **Sub-Processes:** excluded — Not needed for this conversational, iterative workflow

**Memory:**
- Type: Continuable
- Tracking: stepsCompleted, lastStep, living document as primary state
- Resume via step-01b-continue.md reading the living document

**External Integrations:**
- **shadcn MCP:** Component docs, examples, and registry lookups during prototype building

**Installation Requirements:**
- None — all tools are built-in or already configured in the project

## Workflow Design

### Step Sequence

| Step | Name | Type | Menu | Goal |
|------|------|------|------|------|
| 01 | `step-01-init` | Init (Continuable) | Auto-proceed | Check for existing session, gather target (what + existing vs new), collect optional context, create living doc |
| 01b | `step-01b-continue` | Continuation | Auto-proceed | Resume from previous session |
| 02 | `step-02-reproduce` | Middle (Simple) | C only | *(Existing only)* Build `/dev/{target}-current` route, confirm accuracy with user, loop until right |
| 03 | `step-03-diagnose` | Middle (Standard) | A/P/C | Identify pain points, classify, define information hierarchy. ↔ Loop between diagnosis and hierarchy |
| 04 | `step-04-brainstorm` | Middle (Standard) | A/P/C | Explore 2-3 design directions. Party Mode integration. Mobile-first, "share moment" focus |
| 05 | `step-05-build` | Middle (Standard) | A/P/C | Create `/dev/{target}-v2/` route with self-contained components. Sub-agents write code |
| 06 | `step-06-compare` | Middle (Standard) | Built-in loop or proceed | Side-by-side comparison. Brainstorming tool. ↔ Natural loop back to step-05 if needed |
| 07 | `step-07-deliver` | Final | Custom (S/D) | Ship directly or Document for planning. Production validation before shipping. Finalize living doc |

### Flow Diagram

```
┌─────────────┐
│ step-01-init│ Gather target, existing vs new, optional context
└──────┬──────┘ Create living doc from template
       │
       ├── existing ──► step-02-reproduce ──► step-03-diagnose ──► step-04-brainstorm
       │                (build current,       (pain points,         (explore directions,
       │                 confirm loop)         hierarchy, A/E)       Party Mode)
       │                                          ↕ loop
       └── new ─────────────────────────────► step-04-brainstorm
                                                     │
                                              step-05-build
                                              (prototype route,
                                               sub-agents)
                                                     │
                                              step-06-compare
                                              (side-by-side,
                                               ↔ loop to 05)
                                                     │
                                              step-07-deliver
                                              (Ship or Document,
                                               production validation)
```

### Branching Logic

- **step-01-init:** If target is existing element → proceed to step-02-reproduce. If new feature → skip to step-04-brainstorm.
- **step-06-compare:** Built into the flow — if pain points remain or user wants changes, naturally loop back to step-05-build. When satisfied, proceed to step-07-deliver.

### Data Flow

| Step | Reads | Produces | State Update |
|------|-------|----------|-------------|
| 01-init | Nothing (or existing output doc for continuation check) | Living document with Target section, dev route folder | `stepsCompleted: ['step-01-init']` |
| 01b-continue | Living document (stepsCompleted, lastStep) | Routes to correct step | No change |
| 02-reproduce | Existing codebase components | `/dev/{target}-current.tsx` route, Reproduction notes in living doc | `+ 'step-02-reproduce'` |
| 03-diagnose | Reproduction route, existing codebase | Pain points + hierarchy in living doc | `+ 'step-03-diagnose'` |
| 04-brainstorm | Living doc (pain points, hierarchy) | Design directions in living doc, user's chosen direction | `+ 'step-04-brainstorm'` |
| 05-build | Living doc (chosen direction), kitchen sink components | `/dev/{target}-v2/` route + components folder | `+ 'step-05-build'` |
| 06-compare | Both dev routes, living doc (pain points) | Iteration notes in living doc. Loop → 05 or proceed | `+ 'step-06-compare'` |
| 07-deliver | Living doc, prototype route | Either migrated code (Ship) or finalized UX spec (Document) | `+ 'step-07-deliver'`, status: COMPLETE |

### File Structure

```
_bmad/bmm/workflows/ux-prototype/
├── workflow.md                    # Entry point, agent role, architecture rules
├── data/
│   └── pain-point-categories.md   # Layout/Visual/Content/Interaction classification reference
├── templates/
│   └── prototype-journal.md       # Living document template (semi-structured)
└── steps-c/
    ├── step-01-init.md            # Continuable init, gather target, create living doc
    ├── step-01b-continue.md       # Resume from previous session
    ├── step-02-reproduce.md       # Build current-state route (existing only)
    ├── step-03-diagnose.md        # Pain points + information hierarchy
    ├── step-04-brainstorm.md      # Explore directions, Party Mode
    ├── step-05-build.md           # Build prototype route
    ├── step-06-compare.md         # Compare, iterate loop
    └── step-07-deliver.md         # Ship or Document
```

### Tools Integration Points

| Tool | Step(s) | Purpose |
|------|---------|---------|
| Advanced Elicitation | step-03 | Deep UX investigation, challenging assumptions |
| Party Mode | step-04 | Multiple design perspectives, creative exploration |
| Brainstorming | step-06 | Fresh ideas during iteration when prototype needs rethinking |
| Sub-agents | steps 02, 05, 07 | Read/build code while Sally converses; production validation scan |
| shadcn MCP | steps 02, 05 | Component docs and registry lookups |
| Web-browsing | step-04 | Design inspiration, UI patterns, accessibility guidelines |

### Subprocess Optimization

| Step | Pattern | What | Fallback |
|------|---------|------|----------|
| 02-reproduce | Pattern 2 (per-file) | Sub-agent reads existing component files to understand current implementation | Sally reads files in main thread |
| 05-build | Pattern 2 (per-file) | Sub-agent builds prototype route and components while Sally discusses approach | Sally builds sequentially |
| 07-deliver (Ship) | Pattern 1 (grep) | Sub-agent scans prototype folder for production-readiness issues (hardcoded data, missing types, a11y) | Sally reviews manually |

### Role and Persona

- **Agent:** Sally (UX Designer) — `ux-designer`
- **Expertise:** UX design, information architecture, visual hierarchy, component composition, mobile-first design
- **Tone:** Collaborative, creative, opinionated but open — shares design opinions but defers to user's vision
- **Communication:** Visual thinker — describes layouts spatially, references design principles, thinks in user journeys and "share moments"

### Validation and Error Handling

- **Target doesn't exist:** Sally helps user clarify, doesn't fail silently
- **Reproduction inaccurate:** Confirm/loop built into step-02
- **Existing prototype route:** Sally asks — overwrite, version up (`-v3`), or resume iterating
- **Ship validation:** Sally checks production-readiness before migrating (proper types, accessibility, no hardcoded mock data)
