/**
 * Relationship Analysis Prompt (Story 14.4, Story 35-2, Epic 7 Story 7.2)
 *
 * Sonnet prompt: both users' facet score maps (internal calibration) plus
 * **UserSummaries** (ADR-55) — no raw per-message evidence or transcripts.
 *
 * Story 35-2: spine-format JSON output + safety guardrails (FR32, NFR13).
 */

import { FACET_TO_TRAIT, TRAIT_NAMES } from "../constants/big-five";
import type { UserSummaryRecord } from "../repositories/user-summary.repository";
import type { FacetName, FacetScoresMap } from "../types/facet-evidence";

/** Cap quote bank lines included in the prompt (UserSummary allows up to 50). */
const MAX_QUOTES_IN_PROMPT = 24;
/** Avoid single quotes blowing up context. */
const MAX_QUOTE_CHARS = 240;

const SYSTEM_PROMPT = `You are Nerin, a perceptive personality analyst who has observed two people through deep conversations. You're writing a relationship comparison that reveals how two personalities interact, complement, and challenge each other.

Your analysis should:
- Be warm, insightful, and specific to these two people
- Highlight complementary strengths and dynamics — frame differences as what emerges between two people, not as individual weaknesses
- Use concrete behavioral patterns from each person's UserSummary narrative, themes, and curated quote excerpts when available
- Never expose raw scores, percentages, or trait/facet labels in your JSON output to readers
- Focus on relational dynamics, not abstract traits
- Be written as a flowing narrative, not a list of comparisons

SAFETY GUARDRAILS (MANDATORY):
- Never use blame language or characterize either person negatively
- Never invent or paraphrase full private conversation transcripts — only use the structured inputs provided (facet score maps for internal calibration, UserSummary narrative, themes, and the curated quote bank excerpt list)
- Never include raw assessment transcript content beyond what appears in the curated quote excerpts supplied below
- Frame friction points as understanding ("This is what happens when these patterns meet"), never as warnings or blame
- Focus on what emerges between these two people together, not on individual weaknesses or deficits

OUTPUT FORMAT:
You MUST output valid JSON — an array of spine sections. Each section has this structure:
{
  "emoji": "single emoji character",
  "title": "section title",
  "subtitle": "optional short subtitle",
  "paragraphs": ["paragraph 1 text", "paragraph 2 text"]
}

Output EXACTLY this array of 5 sections (no markdown, no code fences, just raw JSON):
[
  { "emoji": "...", "title": "The Dynamic Between You", "paragraphs": [...] },
  { "emoji": "...", "title": "Where You Meet", "paragraphs": [...] },
  { "emoji": "...", "title": "Where You Complement", "paragraphs": [...] },
  { "emoji": "...", "title": "Where You Might Clash", "paragraphs": [...] },
  { "emoji": "...", "title": "What Makes This Pairing Rare", "paragraphs": [...] }
]

Section guidelines:
- "The Dynamic Between You": Overview of the core relationship dynamic — the central pattern that defines how these two personalities interact. 2-3 paragraphs.
- "Where You Meet": Shared patterns, values, or approaches where both people align. Focus on the specific texture of the alignment. 2-3 paragraphs.
- "Where You Complement": Differences that create balance — where one person's strength fills the other's gap. Show how these differences play out. 2-3 paragraphs.
- "Where You Might Clash": Honest assessment of friction points. Frame as understanding, not warnings. 1-2 paragraphs.
- "What Makes This Pairing Rare": The unique combination — what emerges from these two specific people together. End with a forward-looking observation. 1-2 paragraphs.

Keep the total analysis between 800-1200 words across all sections. Write in second person, addressing both people ("You and [name]" or "One of you... the other...").`;

function formatFacetTraitBlock(facetScoresMap: FacetScoresMap): string {
	const traitSummaries: string[] = [];

	for (const trait of TRAIT_NAMES) {
		const facetEntries = Object.entries(facetScoresMap)
			.filter(([facet]) => FACET_TO_TRAIT[facet as FacetName] === trait)
			.map(([facet, data]) => `  ${facet}: score=${data.score}, confidence=${data.confidence}`);

		if (facetEntries.length > 0) {
			traitSummaries.push(`${trait}:\n${facetEntries.join("\n")}`);
		}
	}

	return traitSummaries.join("\n\n");
}

function formatUserSummaryBlock(userSummary: UserSummaryRecord): string {
	const themesLines =
		userSummary.themes.length > 0
			? userSummary.themes.map((t) => `- **${t.theme}**: ${t.description}`).join("\n")
			: "(no themes)";

	const quoteLines = userSummary.quoteBank
		.slice(0, MAX_QUOTES_IN_PROMPT)
		.map((q) => {
			const excerpt =
				q.quote.length > MAX_QUOTE_CHARS ? `${q.quote.slice(0, MAX_QUOTE_CHARS)}…` : q.quote;
			const tag = q.themeTag ? ` [tag: ${q.themeTag}]` : "";
			return `- ${JSON.stringify(excerpt)}${tag}`;
		})
		.join("\n");

	return `USER SUMMARY (compressed personality state — use for relational insight; not a full transcript):
NARRATIVE:
${userSummary.summaryText}

THEMES:
${themesLines}

CURATED QUOTE EXCERPTS (short verbatim lines; bounded list):
${quoteLines || "(none)"}`;
}

function formatParticipantProfile(
	label: string,
	facetScoresMap: FacetScoresMap,
	userSummary: UserSummaryRecord,
): string {
	const facetBlock = formatFacetTraitBlock(facetScoresMap);
	const summaryBlock = formatUserSummaryBlock(userSummary);

	return `=== ${label} ===
FACET SCORES (internal calibration — do not mention numerically in the final JSON output):
${facetBlock}

${summaryBlock}`;
}

export interface RelationshipAnalysisPromptInput {
	readonly userAFacetScores: FacetScoresMap;
	readonly userAUserSummary: UserSummaryRecord;
	readonly userAName: string;
	readonly userBFacetScores: FacetScoresMap;
	readonly userBUserSummary: UserSummaryRecord;
	readonly userBName: string;
}

export function buildRelationshipAnalysisPrompt(input: RelationshipAnalysisPromptInput): {
	systemPrompt: string;
	userPrompt: string;
} {
	const userAProfile = formatParticipantProfile(
		input.userAName || "Person A",
		input.userAFacetScores,
		input.userAUserSummary,
	);
	const userBProfile = formatParticipantProfile(
		input.userBName || "Person B",
		input.userBFacetScores,
		input.userBUserSummary,
	);

	const userPrompt = `Generate a relationship personality comparison analysis for these two people.

${userAProfile}

${userBProfile}

Write a relationship analysis that reveals the dynamic between these two people. Be specific, perceptive, and honest. Draw on their UserSummary narratives, themes, and curated quotes when relevant. Output ONLY valid JSON in the spine format described in your instructions.`;

	return {
		systemPrompt: SYSTEM_PROMPT,
		userPrompt,
	};
}
