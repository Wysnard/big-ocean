import { describe, expect, it } from "vitest";
import { OCEAN_HIEROGLYPHS } from "../ocean-hieroglyphs";

describe("OCEAN_HIEROGLYPHS", () => {
	const ALL_LETTERS = [
		"T",
		"M",
		"O",
		"F",
		"S",
		"C",
		"I",
		"B",
		"E",
		"D",
		"P",
		"A",
		"R",
		"V",
		"N",
	] as const;

	it("contains all 15 TraitLevel keys", () => {
		for (const letter of ALL_LETTERS) {
			expect(OCEAN_HIEROGLYPHS[letter]).toBeDefined();
		}
	});

	it("each definition has viewBox '0 0 24 24'", () => {
		for (const letter of ALL_LETTERS) {
			expect(OCEAN_HIEROGLYPHS[letter].viewBox).toBe("0 0 24 24");
		}
	});

	it("each definition has non-empty elements array", () => {
		for (const letter of ALL_LETTERS) {
			expect(OCEAN_HIEROGLYPHS[letter].elements.length).toBeGreaterThan(0);
		}
	});

	it("no element contains color-related attributes", () => {
		const COLOR_ATTRS = ["fill", "stroke", "color"];
		for (const letter of ALL_LETTERS) {
			for (const el of OCEAN_HIEROGLYPHS[letter].elements) {
				for (const attr of COLOR_ATTRS) {
					expect(el.attrs).not.toHaveProperty(attr);
				}
			}
		}
	});
});
