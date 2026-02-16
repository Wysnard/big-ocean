import { describe, expect, it } from "vitest";
import { FACET_LETTER_MAP } from "../../types/facet-levels";
import { getFacetLevel } from "../facet-level";

describe("getFacetLevel", () => {
	it("should return low code for scores 0-10", () => {
		const [low] = FACET_LETTER_MAP.imagination;
		expect(getFacetLevel("imagination", 0)).toBe(low);
		expect(getFacetLevel("imagination", 5)).toBe(low);
		expect(getFacetLevel("imagination", 10)).toBe(low);
	});

	it("should return high code for scores 11-20", () => {
		const [, high] = FACET_LETTER_MAP.imagination;
		expect(getFacetLevel("imagination", 11)).toBe(high);
		expect(getFacetLevel("imagination", 15)).toBe(high);
		expect(getFacetLevel("imagination", 20)).toBe(high);
	});

	it("should handle float scores at boundary", () => {
		const [low, high] = FACET_LETTER_MAP.orderliness;
		expect(getFacetLevel("orderliness", 10.0)).toBe(low);
		expect(getFacetLevel("orderliness", 10.5)).toBe(high);
	});

	it("should return correct facet-specific codes for different facets", () => {
		const [iLow] = FACET_LETTER_MAP.imagination;
		const [oLow] = FACET_LETTER_MAP.orderliness;
		expect(getFacetLevel("imagination", 5)).toBe(iLow);
		expect(getFacetLevel("orderliness", 5)).toBe(oLow);
		// Verify they have different OCEAN prefixes
		expect(iLow[0]).toBe("O"); // Openness
		expect(oLow[0]).toBe("C"); // Conscientiousness
	});
});
