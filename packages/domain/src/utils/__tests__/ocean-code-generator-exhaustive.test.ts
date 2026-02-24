import { describe, expect, it } from "vitest";
import { generateOceanCode } from "../ocean-code-generator";
import {
	createFacetScoresForTraitLevels,
	expectedCode,
	type InternalLevel,
} from "./__fixtures__/ocean-code-generator.fixtures";

describe("generateOceanCode", () => {
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
});
