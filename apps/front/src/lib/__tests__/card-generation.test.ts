import { describe, expect, it } from "vitest";
import { deriveTraitScores, getDominantColor, TRAIT_COLORS } from "../card-generation";

describe("card-generation utilities", () => {
	describe("deriveTraitScores", () => {
		it("sums 6 facets per trait into a trait score", () => {
			const facets = {
				imagination: { score: 10, confidence: 0.8 },
				artisticInterests: { score: 15, confidence: 0.7 },
				emotionality: { score: 12, confidence: 0.6 },
				adventurousness: { score: 8, confidence: 0.5 },
				intellect: { score: 18, confidence: 0.9 },
				liberalism: { score: 7, confidence: 0.4 },
			};

			const scores = deriveTraitScores(facets);
			expect(scores.openness).toBe(70); // 10+15+12+8+18+7
		});

		it("returns 0 for traits with no facet data", () => {
			const scores = deriveTraitScores({});
			expect(scores.openness).toBe(0);
			expect(scores.conscientiousness).toBe(0);
			expect(scores.extraversion).toBe(0);
			expect(scores.agreeableness).toBe(0);
			expect(scores.neuroticism).toBe(0);
		});

		it("handles partial facet data gracefully", () => {
			const facets = {
				imagination: { score: 20, confidence: 0.8 },
				// Only 1 of 6 openness facets
			};

			const scores = deriveTraitScores(facets);
			expect(scores.openness).toBe(20);
		});

		it("returns scores for all 5 traits", () => {
			const scores = deriveTraitScores({});
			expect(Object.keys(scores)).toHaveLength(5);
			expect(scores).toHaveProperty("openness");
			expect(scores).toHaveProperty("conscientiousness");
			expect(scores).toHaveProperty("extraversion");
			expect(scores).toHaveProperty("agreeableness");
			expect(scores).toHaveProperty("neuroticism");
		});
	});

	describe("getDominantColor", () => {
		it("returns color of highest-scoring trait", () => {
			const scores = {
				openness: 50,
				conscientiousness: 90,
				extraversion: 30,
				agreeableness: 60,
				neuroticism: 40,
			};

			expect(getDominantColor(scores)).toBe(TRAIT_COLORS.conscientiousness);
		});

		it("returns openness color as default for empty scores", () => {
			expect(getDominantColor({})).toBe(TRAIT_COLORS.openness);
		});

		it("returns correct color when openness is dominant", () => {
			const scores = {
				openness: 100,
				conscientiousness: 50,
				extraversion: 50,
				agreeableness: 50,
				neuroticism: 50,
			};

			expect(getDominantColor(scores)).toBe(TRAIT_COLORS.openness);
		});
	});
});
