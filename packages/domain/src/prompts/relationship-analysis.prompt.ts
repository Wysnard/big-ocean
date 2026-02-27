/**
 * Relationship Analysis Prompt (Story 14.4)
 *
 * Sonnet prompt that takes both users' facet data and finalization evidence
 * to generate a personality comparison analysis.
 */

import { FACET_TO_TRAIT, TRAIT_NAMES } from "../constants/big-five";
import type { FacetName, FacetScoresMap, SavedFacetEvidence } from "../types/facet-evidence";

const SYSTEM_PROMPT = `You are Nerin, a perceptive personality analyst who has observed two people through deep conversations. You're writing a relationship comparison that reveals how two personalities interact, complement, and challenge each other.

Your analysis should:
- Be warm, insightful, and specific to these two people
- Highlight complementary strengths and potential friction points
- Use concrete examples from the evidence when available
- Never expose raw scores, percentages, or trait/facet labels
- Focus on behavioral patterns and dynamics, not abstract traits
- Be written as a flowing narrative, not a list of comparisons

Structure your analysis as markdown with these sections:
# The Dynamic Between You

An overview of the core relationship dynamic — the central pattern that defines how these two personalities interact.

## Where You Meet

Shared patterns, values, or approaches where both people align. Focus on the specific texture of the alignment, not just "you're both high in X."

## Where You Complement

Differences that create balance — where one person's strength fills the other's gap. Show how these differences play out in real situations.

## Where You Might Clash

Honest assessment of friction points. Frame as understanding, not warnings. "This is what happens when these two patterns collide."

## What Makes This Pairing Rare

The unique combination — what emerges from these two specific people together that wouldn't exist with different partners. End with a forward-looking observation.

Keep the total analysis between 800-1200 words. Write in second person, addressing both people ("You and [name]" or "One of you... the other...").`;

function formatUserProfile(
	label: string,
	facetScoresMap: FacetScoresMap,
	evidence: ReadonlyArray<SavedFacetEvidence>,
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
		.map((e) => `- [${e.facetName}] "${e.quote}" (score: ${e.score}, confidence: ${e.confidence})`)
		.join("\n");

	return `=== ${label} ===
FACET SCORES:
${traitSummaries.join("\n\n")}

KEY EVIDENCE:
${evidenceLines || "(no evidence available)"}`;
}

export interface RelationshipAnalysisPromptInput {
	readonly userAFacetScores: FacetScoresMap;
	readonly userAEvidence: ReadonlyArray<SavedFacetEvidence>;
	readonly userAName: string;
	readonly userBFacetScores: FacetScoresMap;
	readonly userBEvidence: ReadonlyArray<SavedFacetEvidence>;
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

Write a relationship analysis that reveals the dynamic between these two people. Be specific, perceptive, and honest. Reference their evidence when relevant.`;

	return {
		systemPrompt: SYSTEM_PROMPT,
		userPrompt,
	};
}
