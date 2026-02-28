import { describe, expect, it } from "vitest";
import { deriveTraitSummary } from "../derive-trait-summary";

describe("deriveTraitSummary", () => {
	it("maps a 5-letter OCEAN code to correct trait-level record", () => {
		const result = deriveTraitSummary("HHMHM");
		expect(result).toEqual({
			openness: "H",
			conscientiousness: "H",
			extraversion: "M",
			agreeableness: "H",
			neuroticism: "M",
		});
	});

	it("maps all-high code to all H values", () => {
		const result = deriveTraitSummary("HHHHH");
		expect(result).toEqual({
			openness: "H",
			conscientiousness: "H",
			extraversion: "H",
			agreeableness: "H",
			neuroticism: "H",
		});
	});

	it("maps all-low code to all L values", () => {
		const result = deriveTraitSummary("LLLLL");
		expect(result).toEqual({
			openness: "L",
			conscientiousness: "L",
			extraversion: "L",
			agreeableness: "L",
			neuroticism: "L",
		});
	});
});
