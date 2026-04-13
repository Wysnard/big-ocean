import { describe, expect, it } from "vitest";
import { deriveTraitSummary } from "../derive-trait-summary";

describe("deriveTraitSummary", () => {
	it("maps a valid 5-letter OCEAN code to the correct trait-letter record", () => {
		const result = deriveTraitSummary("MSBPV");
		expect(result).toEqual({
			openness: "M",
			conscientiousness: "S",
			extraversion: "B",
			agreeableness: "P",
			neuroticism: "V",
		});
	});

	it("maps the all-high code OCEAN correctly", () => {
		const result = deriveTraitSummary("OCEAN");
		expect(result).toEqual({
			openness: "O",
			conscientiousness: "C",
			extraversion: "E",
			agreeableness: "A",
			neuroticism: "N",
		});
	});

	it("maps the all-low code TFIDR correctly", () => {
		const result = deriveTraitSummary("TFIDR");
		expect(result).toEqual({
			openness: "T",
			conscientiousness: "F",
			extraversion: "I",
			agreeableness: "D",
			neuroticism: "R",
		});
	});
});
