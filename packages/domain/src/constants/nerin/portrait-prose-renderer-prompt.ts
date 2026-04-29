/**
 * Prose Renderer (Stage C) — brief-only letter rendering (ADR-51).
 * System prompt is NERIN_PERSONA + trimmed PORTRAIT_CONTEXT (see portrait-prompt-builder).
 */

export function buildPortraitProseUserPrompt(briefJson: string): string {
	return `You receive ONLY a SpineBrief JSON — your sole job is to render Nerin's letter in markdown.

Constraints:
- Follow PORTRAIT_CONTEXT craft rules from the system prompt.
- Do NOT ask follow-up questions (letter register).
- Render approximately six movements matching arc keys (titles must be specific to this person, not meta labels).
- Echo verbatim anchors where appropriate.

SPINE BRIEF JSON:
${briefJson}`;
}
