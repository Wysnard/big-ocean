# 9-1 Acceptance Auditor Prompt

Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

Inputs:
- Diff: [9-1-code-review-diff.patch](/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow/_bmad-output/implementation-artifacts/9-1-code-review-diff.patch)
- Spec: [9-1-split-layout-architecture-and-sticky-auth-panel.md](/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow/_bmad-output/implementation-artifacts/9-1-split-layout-architecture-and-sticky-auth-panel.md)
- Context: [CLAUDE.md](/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow/CLAUDE.md)

Focus especially on:
- AC 1: desktop split layout and sticky auth panel behavior
- AC 2: required auth-panel contents
- AC 3: Better Auth signup flow and success redirect to `/verify-email`
- AC 4: mobile stacked layout with sticky bottom CTA
- AC 5: authenticated CTA state on homepage
- AC 6: SSR homepage and meta tags preserved
- frontend rules called out in CLAUDE.md for forms, navigation, and auth
