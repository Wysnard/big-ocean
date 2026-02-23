import { describe, expect, it } from "vitest";
import { ALL_FACETS, TRAIT_TO_FACETS } from "../../constants/big-five";
import type { FacetName, SavedFacetEvidence, TraitName } from "../../types/facet-evidence";
import { DEFAULT_FACET_SCORE, DEFAULT_TRAIT_SCORE } from "../confidence";
import { aggregateFacetScores, deriveTraitScores } from "../scoring";
import { createEvidence } from "./__fixtures__/scoring.fixtures";

// ---------------------------------------------------------------------------
// deriveTraitScores tests
// ---------------------------------------------------------------------------

describe("deriveTraitScores", () => {
	describe("default scores", () => {
		it("returns all 5 traits with defaults when given default facet scores", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { ...DEFAULT_FACET_SCORE };
			}

			const result = deriveTraitScores(facetScores);

			expect(Object.keys(result)).toHaveLength(5);
			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				// Default: 6 facets * 10 = 60
				expect(result[trait]).toEqual(DEFAULT_TRAIT_SCORE);
			}
		});
	});

	describe("sum calculation", () => {
		it("trait score is sum of 6 facet scores (0-120 scale)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 80 };
			}

			// Set openness facets to 15 each → sum = 90
			for (const facet of TRAIT_TO_FACETS.openness) {
				facetScores[facet] = { score: 15, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			expect(result.openness.score).toBe(90);
		});

		it("handles maximum trait score (120 = 6 * 20)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 20, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].score).toBe(120);
			}
		});

		it("handles minimum trait score (0 = 6 * 0)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 0, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].score).toBe(0);
			}
		});
	});

	describe("confidence calculation", () => {
		it("trait confidence is mean of assessed facet confidences (unchanged by saturation curve)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 70 };
			}

			// Set one openness facet to low confidence
			facetScores.imagination = { score: 10, confidence: 30 };

			const result = deriveTraitScores(facetScores);

			// Mean of [30, 70, 70, 70, 70, 70] = 63 (rounded)
			expect(result.openness.confidence).toBe(63);
			// Other traits unaffected
			expect(result.conscientiousness.confidence).toBe(70);
		});

		it("excludes unassessed facets (confidence 0) from mean", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 0 };
			}

			// Only 2 of 6 openness facets have evidence
			facetScores.imagination = { score: 15, confidence: 80 };
			facetScores.artistic_interests = { score: 12, confidence: 60 };

			const result = deriveTraitScores(facetScores);

			// Mean of assessed only: (80 + 60) / 2 = 70
			expect(result.openness.confidence).toBe(70);
			// Traits with no assessed facets remain at 0
			expect(result.conscientiousness.confidence).toBe(0);
		});

		it("returns zero confidence when all facets are unassessed", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 0 };
			}

			const result = deriveTraitScores(facetScores);

			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].confidence).toBe(0);
			}
		});
	});

	describe("trait-facet mapping", () => {
		it("each trait uses exactly its 6 facets", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			// Set all to neutral
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 50 };
			}

			// Set openness facets to 15
			for (const facet of TRAIT_TO_FACETS.openness) {
				facetScores[facet] = { score: 15, confidence: 50 };
			}

			const result = deriveTraitScores(facetScores);

			// Openness should be 90 (6 * 15), others should be 60 (6 * 10)
			expect(result.openness.score).toBe(90);
			expect(result.conscientiousness.score).toBe(60);
			expect(result.extraversion.score).toBe(60);
			expect(result.agreeableness.score).toBe(60);
			expect(result.neuroticism.score).toBe(60);
		});
	});

	describe("rounding", () => {
		it("rounds trait scores to 1 decimal place", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10.15, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			// 6 * 10.15 = 60.9
			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].score).toBe(60.9);
			}
		});
	});

	describe("integration with aggregateFacetScores", () => {
		it("aggregated facet scores can be passed directly to deriveTraitScores", () => {
			// Create evidence for a few facets
			const evidence: SavedFacetEvidence[] = [
				createEvidence("imagination", 18, 90),
				createEvidence("artistic_interests", 15, 85),
				createEvidence("altruism", 12, 70),
			];

			const facetScores = aggregateFacetScores(evidence);
			const traitScores = deriveTraitScores(facetScores);

			expect(Object.keys(traitScores)).toHaveLength(5);
			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(traitScores[trait].score).toBeGreaterThanOrEqual(0);
				expect(traitScores[trait].score).toBeLessThanOrEqual(120);
				expect(traitScores[trait].confidence).toBeGreaterThanOrEqual(0);
				expect(traitScores[trait].confidence).toBeLessThanOrEqual(100);
			}
		});
	});
});
