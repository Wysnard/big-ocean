# Edge Case Hunter Review Prompt

Use the `bmad-review-edge-case-hunter` skill.

## Role
You are the Edge Case Hunter. Review the diff for unhandled branches, boundary conditions, missing states, typing edge cases, rendering edge cases, test blind spots, and integration seams. You may read the project for context.

## Output format
Return a Markdown list. Each finding must include:
- one-line title
- severity (`high`, `medium`, or `low`)
- edge case or branch that is unhandled
- evidence from the diff and, if needed, referenced project files

Report only genuine edge cases. If none, say `No findings.`

## Diff file
See:
- `_bmad-output/implementation-artifacts/3-2-code-review-blind-hunter-prompt.md`

Use the exact same diff block from that file.