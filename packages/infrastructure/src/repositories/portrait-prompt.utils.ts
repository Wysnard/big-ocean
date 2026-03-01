/**
 * Shared Portrait Prompt Utilities
 *
 * Formatting helpers used by both the full portrait generator and the teaser
 * portrait generator to build LLM prompts from personality data.
 *
 * Extracted to avoid duplication between:
 * - portrait-generator.claude.repository.ts (full portrait)
 * - teaser-portrait.anthropic.repository.ts (Opening section)
 */

import {
	FACET_PROMPT_DEFINITIONS,
	FACET_TO_TRAIT,
	type FacetName,
	type FacetScoresMap,
	TRAIT_LETTER_MAP,
	TRAIT_LEVEL_LABELS,
	type TraitScoresMap,
} from "@workspace/domain";

/**
 * Static glossary of facet definitions for the portrait prompt.
 * Built once — no per-request computation needed.
 */
export const FACET_GLOSSARY = Object.entries(FACET_PROMPT_DEFINITIONS)
	.map(([name, def]) => `- ${name}: ${def}`)
	.join("\n");

/**
 * Build a trait summary with per-facet confidence for the prompt.
 *
 * Accepts pre-computed trait scores (from persisted results) and facet scores
 * for per-facet detail lines.
 */
export function formatTraitSummary(
	facetScoresMap: FacetScoresMap,
	traitScores: TraitScoresMap,
): string {
	const lines: string[] = [];

	for (const [traitName, traitScore] of Object.entries(traitScores)) {
		const letters = TRAIT_LETTER_MAP[traitName as keyof typeof TRAIT_LETTER_MAP];
		let levelIndex: 0 | 1 | 2;
		if (traitScore.score <= 40) levelIndex = 0;
		else if (traitScore.score <= 80) levelIndex = 1;
		else levelIndex = 2;
		const letter = letters[levelIndex];
		const traitLabel = TRAIT_LEVEL_LABELS[letter] ?? letter;

		const facetDetails: string[] = [];
		for (const [facetName, facetScore] of Object.entries(facetScoresMap)) {
			if (FACET_TO_TRAIT[facetName as FacetName] === traitName) {
				facetDetails.push(
					`    ${facetName}: ${facetScore.score}/20 (confidence: ${facetScore.confidence}%)`,
				);
			}
		}

		lines.push(
			`${traitName}: ${traitScore.score}/120 (${traitLabel}, confidence: ${traitScore.confidence}%)`,
		);
		lines.push(...facetDetails);
	}

	return lines.join("\n");
}

/**
 * Format evidence for the prompt, including confidence levels.
 *
 * Accepts any array of objects with the common evidence shape
 * (works with both SavedFacetEvidence and FinalizationEvidenceRecord).
 */
export function formatEvidence(
	evidence: ReadonlyArray<{
		readonly facetName?: string;
		readonly bigfiveFacet?: string;
		readonly score: number;
		readonly confidence: number;
		readonly quote: string;
	}>,
): string {
	return evidence
		.map((e, i) => {
			const facet = e.facetName ?? e.bigfiveFacet ?? "Unknown";
			const trait = FACET_TO_TRAIT[facet as FacetName] ?? "Unknown";
			return `${i + 1}. [${trait} → ${facet}, score: ${e.score}/20, confidence: ${e.confidence}%] "${e.quote}"`;
		})
		.join("\n");
}

/**
 * Compute evidence density signal for depth adaptation.
 * RICH (8+ high-confidence), MODERATE (4-7), THIN (<4).
 */
export function computeDepthSignal(
	evidence: ReadonlyArray<{ readonly confidence: number }>,
): string {
	const strongCount = evidence.filter((e) => e.confidence > 60).length;
	const total = evidence.length;
	if (strongCount >= 8)
		return `EVIDENCE DENSITY: RICH (${total} records, ${strongCount} high-confidence)`;
	if (strongCount >= 4)
		return `EVIDENCE DENSITY: MODERATE (${total} records, ${strongCount} high-confidence)`;
	return `EVIDENCE DENSITY: THIN (${total} records, ${strongCount} high-confidence) — scale ambition to evidence`;
}
