# 9-1 Blind Hunter Prompt

Use the `bmad-review-adversarial-general` skill.

Review target: Story `9-1-split-layout-architecture-and-sticky-auth-panel`.

Rules:
- Use only the diff in [9-1-code-review-diff.patch](/Users/vincentlay/.21st/worktrees/big-ocean/nuclear-meadow/_bmad-output/implementation-artifacts/9-1-code-review-diff.patch).
- Do not inspect the repository, spec, or any other project files.
- Produce only a Markdown list of findings.
- Prioritize concrete bugs, regressions, incorrect assumptions, and misleading tests.
- If you find fewer than 10 issues, re-check the diff until you are confident there are no more material issues.

Also consider:
- SSR/hydration mismatches
- Router/link misuse
- auth-state correctness
- mobile vs desktop behavioral gaps
- tests that assert implementation details but miss real behavior
