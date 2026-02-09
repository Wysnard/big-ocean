/**
 * Precision Calculator Service Tests
 *
 * Tests for facet-level to trait-level precision score calculation.
 * All confidence values use 0-100 integer scale.
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
			const facetConfidence: FacetConfidenceScores = {
				// Openness
				imagination: 60,
				artistic_interests: 60,
				emotionality: 60,
				adventurousness: 60,
				intellect: 60,
				liberalism: 60,
				// Conscientiousness
				self_efficacy: 40,
				orderliness: 40,
				dutifulness: 40,
				achievement_striving: 40,
				self_discipline: 40,
				cautiousness: 40,
				// Extraversion
				friendliness: 70,
				gregariousness: 70,
				assertiveness: 70,
				activity_level: 70,
				excitement_seeking: 70,
				cheerfulness: 70,
				// Agreeableness
				trust: 50,
				morality: 50,
				altruism: 50,
				cooperation: 50,
				modesty: 50,
				sympathy: 50,
				// Neuroticism
				anxiety: 30,
				anger: 30,
				depression: 30,
				self_consciousness: 30,
				immoderation: 30,
				vulnerability: 30,
			};

			const result = calculateTraitConfidence(facetConfidence);

			expect(result.openness).toBe(60);
			expect(result.conscientiousness).toBe(40);
			expect(result.extraversion).toBe(70);
			expect(result.agreeableness).toBe(50);
			expect(result.neuroticism).toBe(30);
		});

		it("should handle mixed facet scores within a trait", () => {
			const facetConfidence: FacetConfidenceScores = {
				// Openness: 20, 40, 60, 80, 100, 0 = average 50
				imagination: 20,
				artistic_interests: 40,
				emotionality: 60,
				adventurousness: 80,
				intellect: 100,
				liberalism: 0,
				// Conscientiousness (all 50)
				self_efficacy: 50,
				orderliness: 50,
				dutifulness: 50,
				achievement_striving: 50,
				self_discipline: 50,
				cautiousness: 50,
				// Extraversion (all 50)
				friendliness: 50,
				gregariousness: 50,
				assertiveness: 50,
				activity_level: 50,
				excitement_seeking: 50,
				cheerfulness: 50,
				// Agreeableness (all 50)
				trust: 50,
				morality: 50,
				altruism: 50,
				cooperation: 50,
				modesty: 50,
				sympathy: 50,
				// Neuroticism (all 50)
				anxiety: 50,
				anger: 50,
				depression: 50,
				self_consciousness: 50,
				immoderation: 50,
				vulnerability: 50,
			};

			const result = calculateTraitConfidence(facetConfidence);

			// (20 + 40 + 60 + 80 + 100 + 0) / 6 = 300 / 6 = 50
			expect(result.openness).toBe(50);
			expect(result.conscientiousness).toBe(50);
			expect(result.extraversion).toBe(50);
		});

		it("should handle extreme values", () => {
			const facetConfidence: FacetConfidenceScores = {
				// Openness: all 100
				imagination: 100,
				artistic_interests: 100,
				emotionality: 100,
				adventurousness: 100,
				intellect: 100,
				liberalism: 100,
				// Conscientiousness: all 0
				self_efficacy: 0,
				orderliness: 0,
				dutifulness: 0,
				achievement_striving: 0,
				self_discipline: 0,
				cautiousness: 0,
				// Other traits: all 50
				friendliness: 50,
				gregariousness: 50,
				assertiveness: 50,
				activity_level: 50,
				excitement_seeking: 50,
				cheerfulness: 50,
				trust: 50,
				morality: 50,
				altruism: 50,
				cooperation: 50,
				modesty: 50,
				sympathy: 50,
				anxiety: 50,
				anger: 50,
				depression: 50,
				self_consciousness: 50,
				immoderation: 50,
				vulnerability: 50,
			};

			const result = calculateTraitConfidence(facetConfidence);

			expect(result.openness).toBe(100);
			expect(result.conscientiousness).toBe(0);
			expect(result.extraversion).toBe(50);
		});

		it("should produce valid output for all Big Five traits", () => {
			const facetConfidence = initializeFacetConfidence(50);
			const result = calculateTraitConfidence(facetConfidence);

			expect(result).toHaveProperty("openness");
			expect(result).toHaveProperty("conscientiousness");
			expect(result).toHaveProperty("extraversion");
			expect(result).toHaveProperty("agreeableness");
			expect(result).toHaveProperty("neuroticism");

			// All should be 50 since all facets are 50
			expect(result.openness).toBe(50);
			expect(result.conscientiousness).toBe(50);
			expect(result.extraversion).toBe(50);
			expect(result.agreeableness).toBe(50);
			expect(result.neuroticism).toBe(50);
		});
	});

	describe("calculateWeightedAverage", () => {
		it("should calculate simple average with equal weights", () => {
			const scores = [20, 40, 60, 80];
			const result = calculateWeightedAverage(scores);

			// (20 + 40 + 60 + 80) / 4 = 200 / 4 = 50
			expect(result).toBe(50);
		});

		it("should calculate weighted average with custom weights", () => {
			const scores = [20, 80];
			const weights = [1, 1]; // Equal weight
			const result = calculateWeightedAverage(scores, weights);

			expect(result).toBe(50);
		});

		it("should handle non-normalized weights", () => {
			const scores = [20, 80];
			const weights = [2, 2]; // Will be normalized to [0.5, 0.5]
			const result = calculateWeightedAverage(scores, weights);

			expect(result).toBe(50);
		});

		it("should apply weights correctly", () => {
			const scores = [0, 100];
			const weights = [1, 3]; // 25% first score, 75% second score
			const result = calculateWeightedAverage(scores, weights);

			// (0 * 0.25) + (100 * 0.75) = 75
			expect(result).toBe(75);
		});

		it("should handle empty array", () => {
			const result = calculateWeightedAverage([]);
			expect(result).toBe(0);
		});

		it("should handle single element", () => {
			const result = calculateWeightedAverage([70]);
			expect(result).toBe(70);
		});
	});

	describe("initializeFacetConfidence", () => {
		it("should initialize all facets with default baseline", () => {
			const result = initializeFacetConfidence();

			// Should have 30 facets total
			const facetCount = Object.keys(result).length;
			expect(facetCount).toBe(30);

			// All should be 50 (default)
			Object.values(result).forEach((value) => {
				expect(value).toBe(50);
			});
		});

		it("should initialize all facets with custom baseline", () => {
			const result = initializeFacetConfidence(70);

			Object.values(result).forEach((value) => {
				expect(value).toBe(70);
			});
		});

		it("should initialize with extreme baseline values", () => {
			const resultHigh = initializeFacetConfidence(100);
			Object.values(resultHigh).forEach((value) => {
				expect(value).toBe(100);
			});

			const resultLow = initializeFacetConfidence(0);
			Object.values(resultLow).forEach((value) => {
				expect(value).toBe(0);
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
			expect(result).toHaveProperty("depression");
			expect(result).toHaveProperty("self_consciousness");
			expect(result).toHaveProperty("immoderation");
			expect(result).toHaveProperty("vulnerability");
		});
	});

	describe("updateFacetConfidence", () => {
		it("should update a single facet precision", () => {
			const initial = initializeFacetConfidence(50);
			const updated = updateFacetConfidence(initial, "imagination", 80);

			expect(updated.imagination).toBe(80);
			expect(updated.artistic_interests).toBe(50); // Unchanged
		});

		it("should clamp values to [0, 100]", () => {
			const initial = initializeFacetConfidence(50);

			const tooHigh = updateFacetConfidence(initial, "imagination", 150);
			expect(tooHigh.imagination).toBe(100);

			const tooLow = updateFacetConfidence(initial, "imagination", -50);
			expect(tooLow.imagination).toBe(0);
		});

		it("should preserve all other facets", () => {
			const initial = initializeFacetConfidence(30);
			const updated = updateFacetConfidence(initial, "anxiety", 90);

			// Check that all other facets are unchanged
			expect(updated.imagination).toBe(30);
			expect(updated.artistic_interests).toBe(30);
			expect(updated.anger).toBe(30);
			// Only anxiety changed
			expect(updated.anxiety).toBe(90);
		});
	});

	describe("mergeConfidenceScores", () => {
		it("should merge with default 50/50 weight", () => {
			const current = initializeFacetConfidence(20);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 80,
				artistic_interests: 80,
			};

			const result = mergeConfidenceScores(current, update);

			// (20 * 0.5) + (80 * 0.5) = 10 + 40 = 50
			expect(result.imagination).toBe(50);
			expect(result.artistic_interests).toBe(50);
			// Other facets unchanged
			expect(result.anxiety).toBe(20);
		});

		it("should apply custom weight correctly", () => {
			const current = initializeFacetConfidence(0);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 100,
			};

			const result = mergeConfidenceScores(current, update, 0.75);

			// (0 * 0.25) + (100 * 0.75) = 75
			expect(result.imagination).toBe(75);
		});

		it("should clamp weight to [0, 1]", () => {
			const current = initializeFacetConfidence(0);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 100,
			};

			// Weight > 1 should be clamped to 1
			const resultHigh = mergeConfidenceScores(current, update, 1.5);
			expect(resultHigh.imagination).toBe(100);

			// Weight < 0 should be clamped to 0
			const resultLow = mergeConfidenceScores(current, update, -0.5);
			expect(resultLow.imagination).toBe(0);
		});

		it("should only update facets in the update object", () => {
			const current = initializeFacetConfidence(50);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 90,
			};

			const result = mergeConfidenceScores(current, update, 0.5);

			// Updated facet: (50 * 0.5) + (90 * 0.5) = 25 + 45 = 70
			expect(result.imagination).toBe(70);

			// Unchanged facets should stay the same
			expect(result.artistic_interests).toBe(50);
			expect(result.anxiety).toBe(50);
		});

		it("should handle weight of 0 (no update)", () => {
			const current = initializeFacetConfidence(30);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 90,
			};

			const result = mergeConfidenceScores(current, update, 0);

			// Should keep current value (no weight on update)
			expect(result.imagination).toBe(30);
		});

		it("should handle weight of 1 (full update)", () => {
			const current = initializeFacetConfidence(10);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 90,
			};

			const result = mergeConfidenceScores(current, update, 1);

			// Should take update value (full weight on update)
			expect(result.imagination).toBe(90);
		});
	});
});
