import { describe, expect, it } from "vitest";
import { ALL_FACETS, FACET_TO_TRAIT } from "../../constants/big-five";
import { FACET_LETTER_MAP, FACET_LEVEL_LABELS } from "../../types/facet-levels";
import { FACET_DESCRIPTIONS } from "../facet-descriptions";

describe("FACET_DESCRIPTIONS", () => {
	it("should have entries for all 30 facets", () => {
		expect(Object.keys(FACET_DESCRIPTIONS)).toHaveLength(30);
		for (const facet of ALL_FACETS) {
			expect(FACET_DESCRIPTIONS[facet]).toBeDefined();
		}
	});

	it.each([
		...ALL_FACETS,
	])("should have 2 level descriptions for %s keyed by two-letter codes", (facet) => {
		const [low, high] = FACET_LETTER_MAP[facet];
		for (const level of [low, high]) {
			const desc = FACET_DESCRIPTIONS[facet].levels[level];
			expect(desc).toBeDefined();
			expect(desc.length).toBeGreaterThanOrEqual(50);
			expect(desc.length).toBeLessThanOrEqual(200);
		}
	});
});

describe("FACET_LETTER_MAP", () => {
	it("should have entries for all 30 facets with 2-character codes", () => {
		for (const facet of ALL_FACETS) {
			expect(FACET_LETTER_MAP[facet]).toBeDefined();
			expect(FACET_LETTER_MAP[facet]).toHaveLength(2);
			const [low, high] = FACET_LETTER_MAP[facet];
			expect(low).toHaveLength(2);
			expect(high).toHaveLength(2);
		}
	});

	it("should have unique codes within each facet", () => {
		for (const facet of ALL_FACETS) {
			const [low, high] = FACET_LETTER_MAP[facet];
			expect(low).not.toBe(high);
		}
	});

	it("should use correct OCEAN trait prefix for each facet", () => {
		const TRAIT_PREFIX: Record<string, string> = {
			openness: "O",
			conscientiousness: "C",
			extraversion: "E",
			agreeableness: "A",
			neuroticism: "N",
		};
		for (const facet of ALL_FACETS) {
			const [low, high] = FACET_LETTER_MAP[facet];
			const trait = FACET_TO_TRAIT[facet];
			const prefix = TRAIT_PREFIX[trait];
			expect(low[0]).toBe(prefix);
			expect(high[0]).toBe(prefix);
		}
	});

	it("should have globally unique codes across all facets", () => {
		const allCodes = new Set<string>();
		for (const facet of ALL_FACETS) {
			const [low, high] = FACET_LETTER_MAP[facet];
			expect(allCodes.has(low)).toBe(false);
			expect(allCodes.has(high)).toBe(false);
			allCodes.add(low);
			allCodes.add(high);
		}
		expect(allCodes.size).toBe(60);
	});
});

describe("FACET_LEVEL_LABELS", () => {
	it("should have a label for every code in FACET_LETTER_MAP", () => {
		for (const facet of ALL_FACETS) {
			const [low, high] = FACET_LETTER_MAP[facet];
			expect(FACET_LEVEL_LABELS[low]).toBeDefined();
			expect(FACET_LEVEL_LABELS[high]).toBeDefined();
			expect(FACET_LEVEL_LABELS[low].length).toBeGreaterThan(2);
			expect(FACET_LEVEL_LABELS[high].length).toBeGreaterThan(2);
		}
	});

	it("should have no duplicate codes", () => {
		const allCodes = new Set<string>();
		for (const facet of ALL_FACETS) {
			const [low, high] = FACET_LETTER_MAP[facet];
			allCodes.add(low);
			allCodes.add(high);
		}
		expect(allCodes.size).toBe(60);
	});
});
