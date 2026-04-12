# 9-1 Edge Case Hunter Prompt

Use the `bmad-review-edge-case-hunter` skill.

Review target: Story `9-1-split-layout-architecture-and-sticky-auth-panel`.

Inputs:
- Scoped diff: [9-1-code-review-diff.patch](/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow/_bmad-output/implementation-artifacts/9-1-code-review-diff.patch)
- Project root: [/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow](/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow)

Rules:
- Follow the edge-case-hunter skill exactly.
- Primary scope is the diff. Read surrounding project files only when the diff explicitly references them.
- Return only the required JSON array.

Also consider:
- authenticated vs unauthenticated homepage states
- SSR vs client-only behavior on the `/` route
- viewport-specific behavior hidden behind CSS classes
- navigation/search param correctness on mocked links vs real router behavior
- validation state paths that require blur/touch semantics
