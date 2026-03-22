/**
 * Relationship Analysis Prompt (Story 14.4, updated Story 35-2)
 *
 * Sonnet prompt that takes both users' facet data and conversation evidence
 * to generate a personality comparison analysis in spine format.
 *
 * Story 35-2 changes:
 * - Output format changed from markdown to spine-format JSON
 * - Added safety guardrails: no blame language, no vulnerability data, no transcripts (FR32, NFR13)
 */

import { FACET_TO_TRAIT, TRAIT_NAMES } from "../constants/big-five";
import type { ConversationEvidenceRecord } from "../repositories/conversation-evidence.repository";
import type { FacetName, FacetScoresMap } from "../types/facet-evidence";

const SYSTEM_PROMPT = `You are Nerin, a perceptive personality analyst who has observed two people through deep conversations. You're writing a relationship comparison that reveals how two personalities interact, complement, and challenge each other.

Your analysis should:
- Be warm, insightful, and specific to these two people
- Highlight complementary strengths and dynamics — frame differences as what emerges between two people, not as individual weaknesses
- Use concrete behavioral patterns from the evidence when available
- Never expose raw scores, percentages, or trait/facet labels
- Focus on relational dynamics, not abstract traits
- Be written as a flowing narrative, not a list of comparisons

SAFETY GUARDRAILS (MANDATORY):
- Never use blame language or characterize either person negatively
- Never expose individual vulnerability data — do not reveal raw scores, specific evidence quotes, or behavioral patterns that one person shared in confidence during their private conversation
- Never include raw conversation transcript content from either person's assessment
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

function formatUserProfile(
	label: string,
	facetScoresMap: FacetScoresMap,
	evidence: ReadonlyArray<ConversationEvidenceRecord>,
): string {
	const traitSummaries: string[] = [];

	for (const trait of TRAIT_NAMES) {
		const facetEntries = Object.entries(facetScoresMap)
			.filter(([facet]) => FACET_TO_TRAIT[facet as FacetName] === trait)
			.map(([facet, data]) => `  ${facet}: score=${data.score}, confidence=${data.confidence}`);

		if (facetEntries.length > 0) {
			traitSummaries.push(`${trait}:\n${facetEntries.join("\n")}`);
		}
	}

	const evidenceLines = evidence
		.slice(0, 20) // Cap evidence to avoid prompt bloat
		.map(
			(e) =>
				`- [${e.bigfiveFacet}] "${e.note}" (deviation: ${e.deviation}, strength: ${e.strength}, confidence: ${e.confidence})`,
		)
		.join("\n");

	return `=== ${label} ===
FACET SCORES:
${traitSummaries.join("\n\n")}

KEY EVIDENCE:
${evidenceLines || "(no evidence available)"}`;
}

export interface RelationshipAnalysisPromptInput {
	readonly userAFacetScores: FacetScoresMap;
	readonly userAEvidence: ReadonlyArray<ConversationEvidenceRecord>;
	readonly userAName: string;
	readonly userBFacetScores: FacetScoresMap;
	readonly userBEvidence: ReadonlyArray<ConversationEvidenceRecord>;
	readonly userBName: string;
}

export function buildRelationshipAnalysisPrompt(input: RelationshipAnalysisPromptInput): {
	systemPrompt: string;
	userPrompt: string;
} {
	const userAProfile = formatUserProfile(
		input.userAName || "Person A",
		input.userAFacetScores,
		input.userAEvidence,
	);
	const userBProfile = formatUserProfile(
		input.userBName || "Person B",
		input.userBFacetScores,
		input.userBEvidence,
	);

	const userPrompt = `Generate a relationship personality comparison analysis for these two people.

${userAProfile}

${userBProfile}

Write a relationship analysis that reveals the dynamic between these two people. Be specific, perceptive, and honest. Reference their evidence when relevant. Output ONLY valid JSON in the spine format described in your instructions.`;

	return {
		systemPrompt: SYSTEM_PROMPT,
		userPrompt,
	};
}
