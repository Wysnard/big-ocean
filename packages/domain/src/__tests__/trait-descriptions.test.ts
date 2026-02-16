import { describe, expect, it } from "vitest";
import type { TraitName } from "../constants/big-five";
import { TRAIT_DESCRIPTIONS } from "../constants/trait-descriptions";
import { TRAIT_LETTER_MAP } from "../types/archetype";

describe("TRAIT_DESCRIPTIONS", () => {
	const TRAITS: TraitName[] = [
		"openness",
		"conscientiousness",
		"extraversion",
		"agreeableness",
		"neuroticism",
	];

	it("should have entries for all 5 traits", () => {
		for (const trait of TRAITS) {
			expect(TRAIT_DESCRIPTIONS[trait]).toBeDefined();
		}
	});

	it("should have taglines under 80 characters", () => {
		for (const trait of TRAITS) {
			expect(TRAIT_DESCRIPTIONS[trait].tagline.length).toBeLessThan(80);
			expect(TRAIT_DESCRIPTIONS[trait].tagline.length).toBeGreaterThan(10);
		}
	});

	it.each(
		TRAITS,
	)("should have 3 level descriptions for %s keyed by trait-specific letters", (trait) => {
		const [low, mid, high] = TRAIT_LETTER_MAP[trait];
		for (const level of [low, mid, high]) {
			const desc = (
				TRAIT_DESCRIPTIONS[trait] as {
					tagline: string;
					levels: Record<string, string>;
				}
			).levels[level];
			expect(desc).toBeDefined();
			expect(desc.length).toBeGreaterThan(50);
			expect(desc.length).toBeLessThan(200);
		}
	});

	it("should have exactly 15 level descriptions total", () => {
		let count = 0;
		for (const trait of TRAITS) {
			const levels = (
				TRAIT_DESCRIPTIONS[trait] as {
					tagline: string;
					levels: Record<string, string>;
				}
			).levels;
			count += Object.keys(levels).length;
		}
		expect(count).toBe(15);
	});
});
