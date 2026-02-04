/**
 * Precision Calculator Service Tests
 *
 * Tests for facet-level to trait-level precision score calculation.
 * Validates:
 * - Trait precision aggregation from facets
 * - Weighted average calculations
 * - Facet precision initialization
 * - Score merging and updating
 */

import { describe, expect, it } from "vitest";
import type { FacetConfidenceScores } from "../../types/facet";
import {
	calculateTraitConfidence,
	calculateWeightedAverage,
	initializeFacetConfidence,
	mergeConfidenceScores,
	updateFacetConfidence,
} from "../confidence-calculator.service";

describe("Precision Calculator Service", () => {
	describe("calculateTraitConfidence", () => {
		it("should calculate trait precision from facet scores", () => {
			// All facets at 0.6
			const facetConfidence: FacetConfidenceScores = {
				// Openness
				imagination: 0.6,
				artistic_interests: 0.6,
				emotionality: 0.6,
				adventurousness: 0.6,
				intellect: 0.6,
				liberalism: 0.6,
				// Conscientiousness
				self_efficacy: 0.4,
				orderliness: 0.4,
				dutifulness: 0.4,
				achievement_striving: 0.4,
				self_discipline: 0.4,
				cautiousness: 0.4,
				// Extraversion
				friendliness: 0.7,
				gregariousness: 0.7,
				assertiveness: 0.7,
				activity_level: 0.7,
				excitement_seeking: 0.7,
				cheerfulness: 0.7,
				// Agreeableness
				trust: 0.5,
				morality: 0.5,
				altruism: 0.5,
				cooperation: 0.5,
				modesty: 0.5,
				sympathy: 0.5,
				// Neuroticism
				anxiety: 0.3,
				anger: 0.3,
				depressiveness: 0.3,
				self_consciousness: 0.3,
				immoderation: 0.3,
				vulnerability: 0.3,
			};

			const result = calculateTraitConfidence(facetConfidence);

			expect(result.openness).toBeCloseTo(0.6, 5);
			expect(result.conscientiousness).toBeCloseTo(0.4, 5);
			expect(result.extraversion).toBeCloseTo(0.7, 5);
			expect(result.agreeableness).toBeCloseTo(0.5, 5);
			expect(result.neuroticism).toBeCloseTo(0.3, 5);
		});

		it("should handle mixed facet scores within a trait", () => {
			const facetConfidence: FacetConfidenceScores = {
				// Openness: 0.2, 0.4, 0.6, 0.8, 1.0, 0.0 = average 0.5
				imagination: 0.2,
				artistic_interests: 0.4,
				emotionality: 0.6,
				adventurousness: 0.8,
				intellect: 1.0,
				liberalism: 0.0,
				// Conscientiousness (all 0.5)
				self_efficacy: 0.5,
				orderliness: 0.5,
				dutifulness: 0.5,
				achievement_striving: 0.5,
				self_discipline: 0.5,
				cautiousness: 0.5,
				// Extraversion (all 0.5)
				friendliness: 0.5,
				gregariousness: 0.5,
				assertiveness: 0.5,
				activity_level: 0.5,
				excitement_seeking: 0.5,
				cheerfulness: 0.5,
				// Agreeableness (all 0.5)
				trust: 0.5,
				morality: 0.5,
				altruism: 0.5,
				cooperation: 0.5,
				modesty: 0.5,
				sympathy: 0.5,
				// Neuroticism (all 0.5)
				anxiety: 0.5,
				anger: 0.5,
				depressiveness: 0.5,
				self_consciousness: 0.5,
				immoderation: 0.5,
				vulnerability: 0.5,
			};

			const result = calculateTraitConfidence(facetConfidence);

			// (0.2 + 0.4 + 0.6 + 0.8 + 1.0 + 0.0) / 6 = 3.0 / 6 = 0.5
			expect(result.openness).toBe(0.5);
			expect(result.conscientiousness).toBe(0.5);
			expect(result.extraversion).toBe(0.5);
		});

		it("should handle extreme values", () => {
			const facetConfidence: FacetConfidenceScores = {
				// Openness: all 1.0
				imagination: 1.0,
				artistic_interests: 1.0,
				emotionality: 1.0,
				adventurousness: 1.0,
				intellect: 1.0,
				liberalism: 1.0,
				// Conscientiousness: all 0.0
				self_efficacy: 0.0,
				orderliness: 0.0,
				dutifulness: 0.0,
				achievement_striving: 0.0,
				self_discipline: 0.0,
				cautiousness: 0.0,
				// Other traits: all 0.5
				friendliness: 0.5,
				gregariousness: 0.5,
				assertiveness: 0.5,
				activity_level: 0.5,
				excitement_seeking: 0.5,
				cheerfulness: 0.5,
				trust: 0.5,
				morality: 0.5,
				altruism: 0.5,
				cooperation: 0.5,
				modesty: 0.5,
				sympathy: 0.5,
				anxiety: 0.5,
				anger: 0.5,
				depressiveness: 0.5,
				self_consciousness: 0.5,
				immoderation: 0.5,
				vulnerability: 0.5,
			};

			const result = calculateTraitConfidence(facetConfidence);

			expect(result.openness).toBe(1.0);
			expect(result.conscientiousness).toBe(0.0);
			expect(result.extraversion).toBe(0.5);
		});

		it("should produce valid output for all Big Five traits", () => {
			const facetConfidence = initializeFacetConfidence(0.5);
			const result = calculateTraitConfidence(facetConfidence);

			expect(result).toHaveProperty("openness");
			expect(result).toHaveProperty("conscientiousness");
			expect(result).toHaveProperty("extraversion");
			expect(result).toHaveProperty("agreeableness");
			expect(result).toHaveProperty("neuroticism");

			// All should be 0.5 since all facets are 0.5
			expect(result.openness).toBe(0.5);
			expect(result.conscientiousness).toBe(0.5);
			expect(result.extraversion).toBe(0.5);
			expect(result.agreeableness).toBe(0.5);
			expect(result.neuroticism).toBe(0.5);
		});
	});

	describe("calculateWeightedAverage", () => {
		it("should calculate simple average with equal weights", () => {
			const scores = [0.2, 0.4, 0.6, 0.8];
			const result = calculateWeightedAverage(scores);

			// (0.2 + 0.4 + 0.6 + 0.8) / 4 = 2.0 / 4 = 0.5
			expect(result).toBe(0.5);
		});

		it("should calculate weighted average with custom weights", () => {
			const scores = [0.2, 0.8];
			const weights = [1, 1]; // Equal weight
			const result = calculateWeightedAverage(scores, weights);

			expect(result).toBe(0.5);
		});

		it("should handle non-normalized weights", () => {
			const scores = [0.2, 0.8];
			const weights = [2, 2]; // Will be normalized to [0.5, 0.5]
			const result = calculateWeightedAverage(scores, weights);

			expect(result).toBe(0.5);
		});

		it("should apply weights correctly", () => {
			const scores = [0.0, 1.0];
			const weights = [1, 3]; // 25% first score, 75% second score
			const result = calculateWeightedAverage(scores, weights);

			// (0.0 * 0.25) + (1.0 * 0.75) = 0.75
			expect(result).toBeCloseTo(0.75);
		});

		it("should handle empty array", () => {
			const result = calculateWeightedAverage([]);
			expect(result).toBe(0);
		});

		it("should handle single element", () => {
			const result = calculateWeightedAverage([0.7]);
			expect(result).toBe(0.7);
		});
	});

	describe("initializeFacetConfidence", () => {
		it("should initialize all facets with default baseline", () => {
			const result = initializeFacetConfidence();

			// Should have 30 facets total
			const facetCount = Object.keys(result).length;
			expect(facetCount).toBe(30);

			// All should be 0.5
			Object.values(result).forEach((value) => {
				expect(value).toBe(0.5);
			});
		});

		it("should initialize all facets with custom baseline", () => {
			const result = initializeFacetConfidence(0.7);

			Object.values(result).forEach((value) => {
				expect(value).toBe(0.7);
			});
		});

		it("should initialize with extreme baseline values", () => {
			const resultHigh = initializeFacetConfidence(1.0);
			Object.values(resultHigh).forEach((value) => {
				expect(value).toBe(1.0);
			});

			const resultLow = initializeFacetConfidence(0.0);
			Object.values(resultLow).forEach((value) => {
				expect(value).toBe(0.0);
			});
		});

		it("should have all expected facet properties", () => {
			const result = initializeFacetConfidence();

			// Openness
			expect(result).toHaveProperty("imagination");
			expect(result).toHaveProperty("artistic_interests");
			expect(result).toHaveProperty("emotionality");
			expect(result).toHaveProperty("adventurousness");
			expect(result).toHaveProperty("intellect");
			expect(result).toHaveProperty("liberalism");

			// Conscientiousness
			expect(result).toHaveProperty("self_efficacy");
			expect(result).toHaveProperty("orderliness");
			expect(result).toHaveProperty("dutifulness");
			expect(result).toHaveProperty("achievement_striving");
			expect(result).toHaveProperty("self_discipline");
			expect(result).toHaveProperty("cautiousness");

			// Extraversion
			expect(result).toHaveProperty("friendliness");
			expect(result).toHaveProperty("gregariousness");
			expect(result).toHaveProperty("assertiveness");
			expect(result).toHaveProperty("activity_level");
			expect(result).toHaveProperty("excitement_seeking");
			expect(result).toHaveProperty("cheerfulness");

			// Agreeableness
			expect(result).toHaveProperty("trust");
			expect(result).toHaveProperty("morality");
			expect(result).toHaveProperty("altruism");
			expect(result).toHaveProperty("cooperation");
			expect(result).toHaveProperty("modesty");
			expect(result).toHaveProperty("sympathy");

			// Neuroticism
			expect(result).toHaveProperty("anxiety");
			expect(result).toHaveProperty("anger");
			expect(result).toHaveProperty("depressiveness");
			expect(result).toHaveProperty("self_consciousness");
			expect(result).toHaveProperty("immoderation");
			expect(result).toHaveProperty("vulnerability");
		});
	});

	describe("updateFacetConfidence", () => {
		it("should update a single facet precision", () => {
			const initial = initializeFacetConfidence(0.5);
			const updated = updateFacetConfidence(initial, "imagination", 0.8);

			expect(updated.imagination).toBe(0.8);
			expect(updated.artistic_interests).toBe(0.5); // Unchanged
		});

		it("should clamp values to [0, 1]", () => {
			const initial = initializeFacetConfidence(0.5);

			const tooHigh = updateFacetConfidence(initial, "imagination", 1.5);
			expect(tooHigh.imagination).toBe(1.0);

			const tooLow = updateFacetConfidence(initial, "imagination", -0.5);
			expect(tooLow.imagination).toBe(0.0);
		});

		it("should preserve all other facets", () => {
			const initial = initializeFacetConfidence(0.3);
			const updated = updateFacetConfidence(initial, "anxiety", 0.9);

			// Check that all other facets are unchanged
			expect(updated.imagination).toBe(0.3);
			expect(updated.artistic_interests).toBe(0.3);
			expect(updated.anger).toBe(0.3);
			// Only anxiety changed
			expect(updated.anxiety).toBe(0.9);
		});
	});

	describe("mergeConfidenceScores", () => {
		it("should merge with default 50/50 weight", () => {
			const current = initializeFacetConfidence(0.2);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 0.8,
				artistic_interests: 0.8,
			};

			const result = mergeConfidenceScores(current, update);

			// (0.2 * 0.5) + (0.8 * 0.5) = 0.1 + 0.4 = 0.5
			expect(result.imagination).toBe(0.5);
			expect(result.artistic_interests).toBe(0.5);
			// Other facets unchanged
			expect(result.anxiety).toBe(0.2);
		});

		it("should apply custom weight correctly", () => {
			const current = initializeFacetConfidence(0.0);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 1.0,
			};

			const result = mergeConfidenceScores(current, update, 0.75);

			// (0.0 * 0.25) + (1.0 * 0.75) = 0.75
			expect(result.imagination).toBeCloseTo(0.75);
		});

		it("should clamp weight to [0, 1]", () => {
			const current = initializeFacetConfidence(0.0);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 1.0,
			};

			// Weight > 1 should be clamped to 1
			const resultHigh = mergeConfidenceScores(current, update, 1.5);
			expect(resultHigh.imagination).toBe(1.0);

			// Weight < 0 should be clamped to 0
			const resultLow = mergeConfidenceScores(current, update, -0.5);
			expect(resultLow.imagination).toBe(0.0);
		});

		it("should only update facets in the update object", () => {
			const current = initializeFacetConfidence(0.5);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 0.9,
			};

			const result = mergeConfidenceScores(current, update, 0.5);

			// Updated facet
			expect(result.imagination).toBe(0.7); // (0.5 * 0.5) + (0.9 * 0.5) = 0.7

			// Unchanged facets should stay the same
			expect(result.artistic_interests).toBe(0.5);
			expect(result.anxiety).toBe(0.5);
		});

		it("should handle weight of 0 (no update)", () => {
			const current = initializeFacetConfidence(0.3);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 0.9,
			};

			const result = mergeConfidenceScores(current, update, 0);

			// Should keep current value (no weight on update)
			expect(result.imagination).toBe(0.3);
		});

		it("should handle weight of 1 (full update)", () => {
			const current = initializeFacetConfidence(0.1);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 0.9,
			};

			const result = mergeConfidenceScores(current, update, 1);

			// Should take update value (full weight on update)
			expect(result.imagination).toBe(0.9);
		});
	});
});
