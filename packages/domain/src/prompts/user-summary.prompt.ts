/**
 * UserSummary generation prompts (Story 7.1).
 * Pure builders — no I/O.
 */

import type { ConversationEvidenceRecord } from "../repositories/conversation-evidence.repository";
import type { UserSummaryPreviousSnapshot } from "../repositories/user-summary.repository";

export interface BuildUserSummaryPromptInput {
	readonly sessionId: string;
	readonly facets: Readonly<Record<string, { score: number; confidence: number }>>;
	readonly evidence: readonly ConversationEvidenceRecord[];
	readonly previousSummary?: UserSummaryPreviousSnapshot | null;
}

const jsonShapeInstructions = `Return a single JSON object with exactly these keys (snake_case):
- "themes": array of objects, each with "theme" (short label), "description" (1-3 sentences). Optional: "themeAge" (number), "lastCorroborated" (ISO date string).
- "quote_bank": array of at most 50 objects with "quote" (verbatim user words from the conversation, under 40 words each). Optional: "themeTag", "context".
- "summary_text": one cohesive narrative (2-5 paragraphs) compressing personality patterns for downstream Nerin letters.

Rules:
- Ground every theme in the facet scores and evidence; do not invent facts.
- Prefer vivid, specific quotes from user messages in evidence notes/messages.
- No markdown fences — raw JSON only.`;

const rollingRegenInstructions = `You are REFRESHING an existing UserSummary using NEW evidence plus the prior summary below.

Rules for refresh:
- STRENGTHEN themes when new evidence supports them; FADE themes that lack recent support.
- REPLACE quotes with more vivid or recent verbatim lines when the new evidence offers them.
- Keep "summary_text" coherent as one narrative; do not paste the old summary wholesale unless nothing changed.
- Preserve the JSON shape exactly as specified.`;

export const buildUserSummaryPrompt = (
	input: BuildUserSummaryPromptInput,
): { readonly systemPrompt: string; readonly userPrompt: string } => {
	const facetLines = Object.entries(input.facets).map(([name, v]) => {
		const score = Number.isFinite(v.score) ? v.score.toFixed(2) : "0.00";
		const confidence = Number.isFinite(v.confidence) ? v.confidence.toFixed(3) : "0.000";
		return `${name}: score=${score}, confidence=${confidence}`;
	});

	const evidenceLines = input.evidence.map((ev, i) => {
		const note = ev.note.replace(/\s+/g, " ").trim();
		return `${i + 1}. facet=${ev.bigfiveFacet} domain=${ev.domain} strength=${ev.strength} confidence=${ev.confidence} polarity=${ev.polarity} note=${JSON.stringify(note)}`;
	});

	const priorBlock =
		input.previousSummary != null
			? `PRIOR USER SUMMARY (memory — revise, do not ignore):
Themes: ${JSON.stringify(input.previousSummary.themes)}
Quote bank: ${JSON.stringify(input.previousSummary.quoteBank)}
Narrative:
${input.previousSummary.summaryText}

${rollingRegenInstructions}

`
			: "";

	const userPrompt = `Session id: ${input.sessionId}

${priorBlock}Facet scores:
${facetLines.join("\n")}

Conversation evidence (use verbatim user language from notes when building quote_bank):
${evidenceLines.join("\n")}

${jsonShapeInstructions}`;

	const systemPrompt = `You are a clinical personality summarization assistant for the Big Five assessment product.
Output only valid JSON as specified. Be precise and conservative; if evidence is thin, use fewer themes and shorter summary_text.`;

	return { systemPrompt, userPrompt };
};
