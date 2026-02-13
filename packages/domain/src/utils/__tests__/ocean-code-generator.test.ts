import { describe, expect, it } from "vitest";
import { ALL_FACETS, FACET_TO_TRAIT } from "../../constants/big-five";
import type { FacetName, FacetScore, TraitName } from "../../types/facet-evidence";
import { generateOceanCode } from "../ocean-code-generator";

// ---------------------------------------------------------------------------
// New trait-specific letter mapping (mirrors TRAIT_LETTER_MAP)
// ---------------------------------------------------------------------------

/**
 * Trait level identifier: L=Low, M=Mid, H=High (internal test helper only)
 */
type InternalLevel = "L" | "M" | "H";

/**
 * Maps each trait to its [Low, Mid, High] letters for test assertions.
 */
const TRAIT_LETTERS: Record<TraitName, [string, string, string]> = {
	openness: ["P", "G", "O"],
	conscientiousness: ["F", "B", "D"],
	extraversion: ["I", "A", "E"],
	agreeableness: ["C", "N", "W"],
	neuroticism: ["R", "T", "S"],
};

const LEVEL_INDEX: Record<InternalLevel, number> = { L: 0, M: 1, H: 2 };

/**
 * Get the expected letter for a trait at a given level.
 */
const expectedLetter = (trait: TraitName, level: InternalLevel): string =>
	TRAIT_LETTERS[trait][LEVEL_INDEX[level]];

/**
 * Build expected 5-letter code from internal L/M/H levels.
 */
const expectedCode = (levels: {
	O: InternalLevel;
	C: InternalLevel;
	E: InternalLevel;
	A: InternalLevel;
	N: InternalLevel;
}): string =>
	[
		expectedLetter("openness", levels.O),
		expectedLetter("conscientiousness", levels.C),
		expectedLetter("extraversion", levels.E),
		expectedLetter("agreeableness", levels.A),
		expectedLetter("neuroticism", levels.N),
	].join("");

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a full 30-facet score map where each trait's 6 facets
 * are set to produce the desired trait level.
 *
 * L → per-facet score 3  (sum = 18, < 40)
 * M → per-facet score 10 (sum = 60, 40-80)
 * H → per-facet score 17 (sum = 102, > 80)
 */
const createFacetScoresForTraitLevels = (levels: {
	O: InternalLevel;
	C: InternalLevel;
	E: InternalLevel;
	A: InternalLevel;
	N: InternalLevel;
}): Record<FacetName, FacetScore> => {
	const levelToPerFacetScore: Record<InternalLevel, number> = {
		L: 3,
		M: 10,
		H: 17,
	};

	const traitLevelMap: Record<TraitName, InternalLevel> = {
		openness: levels.O,
		conscientiousness: levels.C,
		extraversion: levels.E,
		agreeableness: levels.A,
		neuroticism: levels.N,
	};

	const result = {} as Record<FacetName, FacetScore>;
	for (const facet of ALL_FACETS) {
		const trait = FACET_TO_TRAIT[facet];
		const level = traitLevelMap[trait];
		result[facet] = {
			score: levelToPerFacetScore[level],
			confidence: 80,
		};
	}
	return result;
};

/**
 * Creates facet scores where all facets have the same score value.
 */
const createAllFacetsAtScore = (score: number): Record<FacetName, FacetScore> => {
	const result = {} as Record<FacetName, FacetScore>;
	for (const facet of ALL_FACETS) {
		result[facet] = { score, confidence: 80 };
	}
	return result;
};

/**
 * Creates facet scores for a specific trait sum while keeping other traits at mid.
 * Sets the specified trait's 6 facets to equal portions of the target sum.
 */
const createScoresForTraitSum = (
	trait: string,
	targetSum: number,
): Record<FacetName, FacetScore> => {
	const perFacetScore = targetSum / 6;
	const result = {} as Record<FacetName, FacetScore>;
	for (const facet of ALL_FACETS) {
		const facetTrait = FACET_TO_TRAIT[facet];
		result[facet] = {
			score: facetTrait === trait ? perFacetScore : 10,
			confidence: 80,
		};
	}
	return result;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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
			expect(generateOceanCode(scores)).toBe("GBANT");
		});

		it("all facets at 0 → trait sum = 0 (minimum → Low) → all low letters", () => {
			const scores = createAllFacetsAtScore(0);
			expect(generateOceanCode(scores)).toBe("PFICR");
		});

		it("all facets at 20 → trait sum = 120 (maximum → High) → all high letters", () => {
			const scores = createAllFacetsAtScore(20);
			expect(generateOceanCode(scores)).toBe("ODEWS");
		});

		it("mixed facets sum correctly (e.g., [18,18,18,18,18,18] = 108 → H)", () => {
			const scores = createAllFacetsAtScore(18);
			// 18 * 6 = 108 per trait → all High
			expect(generateOceanCode(scores)).toBe("ODEWS");
		});
	});

	// === Task 3: Trait-to-level mapping boundary tests ===
	describe("threshold boundaries", () => {
		it("maps trait sum 0 to Low (P for openness)", () => {
			const scores = createScoresForTraitSum("openness", 0);
			expect(generateOceanCode(scores)[0]).toBe("P");
		});

		it("maps trait sum 39 to Low", () => {
			const scores = createScoresForTraitSum("openness", 39);
			expect(generateOceanCode(scores)[0]).toBe("P");
		});

		it("maps trait sum 40 to Mid (G for openness)", () => {
			const scores = createScoresForTraitSum("openness", 40);
			expect(generateOceanCode(scores)[0]).toBe("G");
		});

		it("maps trait sum 79 to Mid", () => {
			const scores = createScoresForTraitSum("openness", 79);
			expect(generateOceanCode(scores)[0]).toBe("G");
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
			expect(generateOceanCode(scores)[0]).toBe("P");
		});

		it("boundary at 40.1 → Mid (>= 40)", () => {
			const scores = createScoresForTraitSum("openness", 40.1);
			expect(generateOceanCode(scores)[0]).toBe("G");
		});

		it("boundary at 79.9 → Mid (< 80)", () => {
			const scores = createScoresForTraitSum("openness", 79.9);
			expect(generateOceanCode(scores)[0]).toBe("G");
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
			expect(generateOceanCode(scores)).toMatch(/^[PGO][FBD][IAE][CNW][RTS]$/);
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
			expect(generateOceanCode(scores)).toBe("OFAWR");
		});
	});

	// === Task 5: All 243 combinations ===
	describe("all 243 OCEAN code combinations", () => {
		const levels: InternalLevel[] = ["L", "M", "H"];

		for (const O of levels) {
			for (const C of levels) {
				for (const E of levels) {
					for (const A of levels) {
						for (const N of levels) {
							const expected = expectedCode({ O, C, E, A, N });
							it(`generates ${expected} for O=${O} C=${C} E=${E} A=${A} N=${N}`, () => {
								const facetScores = createFacetScoresForTraitLevels({
									O,
									C,
									E,
									A,
									N,
								});
								const code = generateOceanCode(facetScores);
								expect(code).toBe(expected);
							});
						}
					}
				}
			}
		}
	});

	// === Task 5: Edge case tests ===
	describe("edge cases", () => {
		it("returns GBANT for all facets at 10 (all mid)", () => {
			const scores = createAllFacetsAtScore(10);
			expect(generateOceanCode(scores)).toBe("GBANT");
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

		it("returns PFICR for all facets at 0 (all low)", () => {
			const scores = createAllFacetsAtScore(0);
			expect(generateOceanCode(scores)).toBe("PFICR");
		});

		it("returns ODEWS for all facets at 20 (all high)", () => {
			const scores = createAllFacetsAtScore(20);
			expect(generateOceanCode(scores)).toBe("ODEWS");
		});

		it("example: facets yielding O=108(H) C=84(H) E=60(M) A=96(H) N=72(M)", () => {
			// O=108(H→O), C=84(H→D), E=60(M→A), A=96(H→W), N=72(M→T)
			const traitToFacetScore: Record<TraitName, number> = {
				openness: 18, // 18*6=108 → H → O
				conscientiousness: 14, // 14*6=84 → H → D
				extraversion: 10, // 10*6=60 → M → A
				agreeableness: 16, // 16*6=96 → H → W
				neuroticism: 12, // 12*6=72 → M → T
			};
			const scores = {} as Record<FacetName, FacetScore>;
			for (const facet of ALL_FACETS) {
				scores[facet] = {
					score: traitToFacetScore[FACET_TO_TRAIT[facet]],
					confidence: 80,
				};
			}
			expect(generateOceanCode(scores)).toBe("ODAWT");
		});
	});
});
