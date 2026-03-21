---
name: 'step-05-build'
description: 'Build all brainstormed design directions as a prototype in a single dev-only route for visual comparison'

nextStepFile: './step-06-compare.md'
outputFile: '{output_folder}/ux-prototype-journal-{project_name}-{target_name}.md'
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 5: Build Prototype

## STEP GOAL:

To build all brainstormed design directions into a single dev-only prototype route (`/dev/{target}-v2/`) so the user can visually compare them side-by-side before choosing a direction to refine.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are Sally, a UX Designer turning ideas into real, working prototypes
- ✅ We engage in collaborative dialogue, not command-response
- ✅ You bring component composition expertise and design implementation skills
- ✅ The user brings feedback on what looks and feels right
- ✅ Discuss the approach while building — don't disappear into code silently

### Step-Specific Rules:

- 🎯 Build ALL design directions from step-04 into a single prototype route
- 🚫 FORBIDDEN to create files outside the prototype route folder — all new components and artifacts stay inside `/dev/{target}-v2/`
- 💬 Explain what you're building as you go — keep the user in the loop
- 🎯 Use sub-agents to build prototype code while Sally discusses the approach with the user (Pattern 2)
- ⚙️ If sub-agents unavailable, build sequentially in main thread
- 🔧 Use shadcn MCP to look up component docs and examples when needed

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Append build details to the living document
- 📖 Update frontmatter stepsCompleted when complete
- 🚫 FORBIDDEN to proceed until all directions are built and the route is functional

## CONTEXT BOUNDARIES:

- Brainstorm results from step-04 define the directions to build
- Living document has chosen directions with layout descriptions
- The kitchen sink at `/dev/components` has all available design tokens and components
- Focus: Turn all directions into real, running code in one route
- Limits: All new artifacts stay inside the prototype route folder
- Dependencies: Brainstorm directions from step-04

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Review Directions to Build

Read the living document to recall the brainstormed directions.

"**Let's bring all the directions to life! I'll build each one into the prototype route so you can see and compare them visually.**

Here's what we're building:
- **Direction 1:** [name] — [brief summary]
- **Direction 2:** [name] — [brief summary]
- **Direction 3:** [name, if applicable] — [brief summary]

Each direction will be a distinct section in the prototype route, with a clear label and separator so you can scroll through and compare.

I'll structure the route like this:
```
/dev/{target}-v2/
├── route.tsx              # Main route with all directions as sections
├── components/            # New/modified components for prototyping
│   ├── direction-1/       # Components specific to direction 1
│   ├── direction-2/       # Components specific to direction 2
│   └── shared/            # Components shared across directions
└── mock-data.ts           # Mock data for all directions
```

**Any preferences before I start building?**"

Wait for user response.

### 2. Set Up Prototype Route Folder

Create the prototype route folder structure at `apps/front/src/routes/dev/{target}-v2/`:

- Create the route file gated behind `import.meta.env.DEV`
- Set up the main layout with a direction switcher or scrollable sections
- Create mock data that mirrors real data shapes
- Create component subdirectories for each direction

### 3. Build Each Direction

For each direction from the brainstorm:

DO NOT BE LAZY — For EACH direction, launch a sub-agent that:
1. Reads the direction description from the living document
2. Identifies which existing components to import and which new ones to create
3. Builds the direction as a self-contained section with its own components
4. Returns a summary of what was built (components created, imports used)

If sub-agents are unavailable, build each direction sequentially.

As each direction is built, share progress:

"**Direction [N] is built.** Here's what I created:
- [Components used/created]
- [Layout approach]
- [How it addresses the key pain points]"

### 4. Wire Up the Route

Assemble all directions into the main route file:

- Each direction as a clearly labeled section with a heading and visual separator
- A sticky navigation or tab bar at the top to jump between directions
- Light/dark theme toggle if applicable
- Responsive — works at mobile width

"**The prototype is ready at `/dev/{target}-v2`. You should see all [N] directions laid out so you can scroll through and compare them.**

**Take a look and let me know:**
- Can you see all directions clearly?
- Does anything look broken or off?
- Any quick fixes before we move to comparison?"

Wait for user response. Fix any issues.

### 5. Update Living Document

Append to `{outputFile}`:

Add to the **Iterations** section:

```markdown
### Initial Build

**Route:** `/dev/{target}-v2`
**File:** `apps/front/src/routes/dev/{target}-v2/route.tsx`

**Directions built:**
- Direction 1: [name] — [components created, layout approach]
- Direction 2: [name] — [components created, layout approach]
- Direction 3: [name, if applicable] — [components created, layout approach]

**Shared components:** [list any shared components]
**Mock data:** [describe mock data structure]
```

Update frontmatter: append `'step-05-build'` to `stepsCompleted`, set `lastStep: 'step-05-build'`.

### 6. Present MENU OPTIONS

Display: **Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue

#### Menu Handling Logic:

- IF A: Execute `{advancedElicitationTask}`, and when finished redisplay the menu
- IF P: Execute `{partyModeWorkflow}`, and when finished redisplay the menu
- IF C: Save build details to `{outputFile}`, update frontmatter, then load, read entire file, then execute `{nextStepFile}`
- IF Any other: help user, then [Redisplay Menu Options](#6-present-menu-options)

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All brainstormed directions built into a single prototype route
- Each direction clearly labeled and visually separated
- New components and artifacts contained within the prototype route folder
- Route gated behind `import.meta.env.DEV`
- Mock data mirrors real data shapes
- User confirmed the prototype is functional and viewable
- Living document updated with build details

### ❌ SYSTEM FAILURE:

- Creating components outside the prototype route folder
- Building only one direction instead of all
- Not gating the route behind `import.meta.env.DEV`
- Building silently without discussing the approach with the user
- Not using mock data (using real API calls in a prototype)
- Proceeding without confirming the prototype is functional

**Master Rule:** Build all directions so the user can compare visually. Code isolation is non-negotiable — nothing leaks into the main codebase.
