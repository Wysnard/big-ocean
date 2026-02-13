import { describe, expect, it } from "vitest";
import { ALL_FACETS, type TraitName } from "../../constants/big-five";
import { getFacetColor, getTraitColor, getTraitGradient } from "../trait-colors";

const TRAITS: TraitName[] = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
];

describe("trait color utilities", () => {
	it("resolves all 5 trait colors to CSS variable references", () => {
		for (const trait of TRAITS) {
			expect(getTraitColor(trait)).toBe(`var(--trait-${trait})`);
		}
	});

	it("resolves all 30 facet colors to CSS variable references", () => {
		expect(ALL_FACETS).toHaveLength(30);
		for (const facet of ALL_FACETS) {
			expect(getFacetColor(facet)).toBe(`var(--facet-${facet})`);
		}
	});

	it("resolves all 5 trait gradients to CSS variable references", () => {
		for (const trait of TRAITS) {
			expect(getTraitGradient(trait)).toBe(`var(--gradient-trait-${trait})`);
		}
	});

	it("is deterministic across repeated calls", () => {
		expect(getTraitColor("openness")).toBe(getTraitColor("openness"));
		expect(getFacetColor("imagination")).toBe(getFacetColor("imagination"));
		expect(getTraitGradient("agreeableness")).toBe(getTraitGradient("agreeableness"));
	});
});
