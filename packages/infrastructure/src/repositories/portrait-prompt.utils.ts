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
	getTraitLevelLabel,
	TRAIT_LETTER_MAP,
	type TraitName,
	type TraitScoresMap,
} from "@workspace/domain";
import type { EvidenceConfidence, EvidenceStrength } from "@workspace/domain/types/evidence";
import { computeFinalWeight } from "@workspace/domain/utils/formula";

/** Evidence shape for v2 depth signal computation */
export type DepthSignalEvidence = {
	readonly strength: EvidenceStrength;
	readonly confidence: EvidenceConfidence;
};

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
		const traitLabel = getTraitLevelLabel(traitName as TraitName, letter);

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
 * Format conversation evidence (v2) for the portrait prompt.
 * Uses deviation/strength/confidence enums instead of legacy score/confidence/quote.
 */
export function formatEvidence(
	evidence: ReadonlyArray<{
		readonly bigfiveFacet: string;
		readonly deviation: number;
		readonly strength: string;
		readonly confidence: string;
		readonly note: string;
	}>,
): string {
	return evidence
		.map((e, i) => {
			const trait = FACET_TO_TRAIT[e.bigfiveFacet as FacetName] ?? "Unknown";
			return `${i + 1}. [${trait} → ${e.bigfiveFacet}, deviation: ${e.deviation}, strength: ${e.strength}, confidence: ${e.confidence}] "${e.note}"`;
		})
		.join("\n");
}

/**
 * Compute evidence density signal for depth adaptation.
 * RICH (8+ high-quality), MODERATE (4-7), THIN (<4).
 * Uses finalWeight (strength × confidence) >= 0.36 as the quality threshold.
 */
export function computeDepthSignal(evidence: ReadonlyArray<DepthSignalEvidence>): string {
	const hqCount = evidence.filter(
		(e) => computeFinalWeight(e.strength, e.confidence) >= 0.36,
	).length;
	const total = evidence.length;
	if (hqCount >= 8) return `EVIDENCE DENSITY: RICH (${total} records, ${hqCount} high-confidence)`;
	if (hqCount >= 4)
		return `EVIDENCE DENSITY: MODERATE (${total} records, ${hqCount} high-confidence)`;
	return `EVIDENCE DENSITY: THIN (${total} records, ${hqCount} high-confidence) — scale ambition to evidence`;
}
