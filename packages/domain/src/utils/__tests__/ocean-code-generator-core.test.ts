import { describe, expect, it } from "vitest";
import { ALL_FACETS, FACET_TO_TRAIT } from "../../constants/big-five";
import type { FacetName, FacetScore, TraitName } from "../../types/facet-evidence";
import { generateOceanCode } from "../ocean-code-generator";
import {
	createAllFacetsAtScore,
	createFacetScoresForTraitLevels,
	createScoresForTraitSum,
} from "./__fixtures__/ocean-code-generator.fixtures";

describe("generateOceanCode", () => {
	// === Task 1: Pure function interface tests ===
	describe("function interface", () => {
		it("returns a string", () => {
			const scores = createAllFacetsAtScore(10);
			const result = generateOceanCode(scores);
			expect(typeof result).toBe("string");
		});

		it("accepts Record<FacetName, FacetScore> and returns string", () => {
			const scores = createFacetScoresForTraitLevels({
				O: "M",
				C: "M",
				E: "M",
				A: "M",
				N: "M",
			});
			const code: string = generateOceanCode(scores);
			expect(code).toBeDefined();
		});
	});

	// === Task 2: Trait sum calculation tests ===
	describe("trait sum calculation", () => {
		it("all facets at 10 → trait sum = 60 (midpoint) → all mid letters", () => {
			const scores = createAllFacetsAtScore(10);
			expect(generateOceanCode(scores)).toBe("MSBPT");
		});

		it("all facets at 0 → trait sum = 0 (minimum → Low) → all low letters", () => {
			const scores = createAllFacetsAtScore(0);
			expect(generateOceanCode(scores)).toBe("TFRDR");
		});

		it("all facets at 20 → trait sum = 120 (maximum → High) → all high letters", () => {
			const scores = createAllFacetsAtScore(20);
			expect(generateOceanCode(scores)).toBe("OCEAN");
		});

		it("mixed facets sum correctly (e.g., [18,18,18,18,18,18] = 108 → H)", () => {
			const scores = createAllFacetsAtScore(18);
			// 18 * 6 = 108 per trait → all High
			expect(generateOceanCode(scores)).toBe("OCEAN");
		});
	});

	// === Task 3: Trait-to-level mapping boundary tests ===
	describe("threshold boundaries", () => {
		it("maps trait sum 0 to Low (T for openness)", () => {
			const scores = createScoresForTraitSum("openness", 0);
			expect(generateOceanCode(scores)[0]).toBe("T");
		});

		it("maps trait sum 39 to Low", () => {
			const scores = createScoresForTraitSum("openness", 39);
			expect(generateOceanCode(scores)[0]).toBe("T");
		});

		it("maps trait sum 40 to Mid (M for openness)", () => {
			const scores = createScoresForTraitSum("openness", 40);
			expect(generateOceanCode(scores)[0]).toBe("M");
		});

		it("maps trait sum 79 to Mid", () => {
			const scores = createScoresForTraitSum("openness", 79);
			expect(generateOceanCode(scores)[0]).toBe("M");
		});

		it("maps trait sum 80 to High (O for openness)", () => {
			const scores = createScoresForTraitSum("openness", 80);
			expect(generateOceanCode(scores)[0]).toBe("O");
		});

		it("maps trait sum 120 to High", () => {
			const scores = createScoresForTraitSum("openness", 120);
			expect(generateOceanCode(scores)[0]).toBe("O");
		});

		it("boundary at 39.9 → Low (< 40)", () => {
			const scores = createScoresForTraitSum("openness", 39.9);
			expect(generateOceanCode(scores)[0]).toBe("T");
		});

		it("boundary at 40.1 → Mid (>= 40)", () => {
			const scores = createScoresForTraitSum("openness", 40.1);
			expect(generateOceanCode(scores)[0]).toBe("M");
		});

		it("boundary at 79.9 → Mid (< 80)", () => {
			const scores = createScoresForTraitSum("openness", 79.9);
			expect(generateOceanCode(scores)[0]).toBe("M");
		});

		it("boundary at 80.1 → High (>= 80)", () => {
			const scores = createScoresForTraitSum("openness", 80.1);
			expect(generateOceanCode(scores)[0]).toBe("O");
		});
	});

	// === Task 4: Code generation format tests ===
	describe("code format", () => {
		it("output is exactly 5 characters", () => {
			const scores = createAllFacetsAtScore(10);
			expect(generateOceanCode(scores)).toHaveLength(5);
		});

		it("output is uppercase letters only", () => {
			const scores = createAllFacetsAtScore(10);
			expect(generateOceanCode(scores)).toMatch(/^[A-Z]+$/);
		});

		it("output matches valid OCEAN code pattern", () => {
			const scores = createAllFacetsAtScore(10);
			expect(generateOceanCode(scores)).toMatch(/^[TMO][FSC][RBE][DPA][RTN]$/);
		});

		it("OCEAN order is correct (O first, N last)", () => {
			// O=High, C=Low, E=Mid, A=High, N=Low
			const scores = createFacetScoresForTraitLevels({
				O: "H",
				C: "L",
				E: "M",
				A: "H",
				N: "L",
			});
			expect(generateOceanCode(scores)).toBe("OFBAR");
		});
	});

	// === Task 5: Edge case tests ===
	describe("edge cases", () => {
		it("returns MSBPT for all facets at 10 (all mid)", () => {
			const scores = createAllFacetsAtScore(10);
			expect(generateOceanCode(scores)).toBe("MSBPT");
		});

		it("is deterministic — same input called 100 times → same output", () => {
			const scores = createFacetScoresForTraitLevels({
				O: "H",
				C: "M",
				E: "L",
				A: "H",
				N: "M",
			});
			const results = Array.from({ length: 100 }, () => generateOceanCode(scores));
			expect(new Set(results).size).toBe(1);
		});

		it("returns TFRDR for all facets at 0 (all low)", () => {
			const scores = createAllFacetsAtScore(0);
			expect(generateOceanCode(scores)).toBe("TFRDR");
		});

		it("returns OCEAN for all facets at 20 (all high)", () => {
			const scores = createAllFacetsAtScore(20);
			expect(generateOceanCode(scores)).toBe("OCEAN");
		});

		it("example: facets yielding O=108(H) C=84(H) E=60(M) A=96(H) N=72(M)", () => {
			// O=108(H→O), C=84(H→C), E=60(M→B), A=96(H→A), N=72(M→T)
			const traitToFacetScore: Record<TraitName, number> = {
				openness: 18, // 18*6=108 → H → O
				conscientiousness: 14, // 14*6=84 → H → C
				extraversion: 10, // 10*6=60 → M → B
				agreeableness: 16, // 16*6=96 → H → A
				neuroticism: 12, // 12*6=72 → M → T
			};
			const scores = {} as Record<FacetName, FacetScore>;
			for (const facet of ALL_FACETS) {
				scores[facet] = {
					score: traitToFacetScore[FACET_TO_TRAIT[facet]],
					confidence: 80,
				};
			}
			expect(generateOceanCode(scores)).toBe("OCBAT");
		});
	});
});
