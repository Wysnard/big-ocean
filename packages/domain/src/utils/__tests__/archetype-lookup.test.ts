import { describe, expect, it } from "vitest";
import { extract4LetterCode, lookupArchetype } from "../archetype-lookup";

describe("lookupArchetype", () => {
	describe("hand-curated archetypes", () => {
		it("returns curated name for HHHH", () => {
			const result = lookupArchetype("HHHH");
			expect(result.name).toBe("The Idealist");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for HHHL", () => {
			const result = lookupArchetype("HHHL");
			expect(result.name).toBe("The Visionary Planner");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for HHMH", () => {
			const result = lookupArchetype("HHMH");
			expect(result.name).toBe("The Creative Diplomat");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for HHLH", () => {
			const result = lookupArchetype("HHLH");
			expect(result.name).toBe("The Thoughtful Collaborator");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for HMHH", () => {
			const result = lookupArchetype("HMHH");
			expect(result.name).toBe("The Curious Leader");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for HMMM", () => {
			const result = lookupArchetype("HMMM");
			expect(result.name).toBe("The Balanced Explorer");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for HLHH", () => {
			const result = lookupArchetype("HLHH");
			expect(result.name).toBe("The Free Spirit");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for MHHH", () => {
			const result = lookupArchetype("MHHH");
			expect(result.name).toBe("The Steady Organizer");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for MMHH", () => {
			const result = lookupArchetype("MMHH");
			expect(result.name).toBe("The Social Connector");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for MMMM", () => {
			const result = lookupArchetype("MMMM");
			expect(result.name).toBe("The Centered Moderate");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for MMLH", () => {
			const result = lookupArchetype("MMLH");
			expect(result.name).toBe("The Quiet Helper");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for LHHH", () => {
			const result = lookupArchetype("LHHH");
			expect(result.name).toBe("The Traditional Leader");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for LHLH", () => {
			const result = lookupArchetype("LHLH");
			expect(result.name).toBe("The Dependable Supporter");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for LLLL", () => {
			const result = lookupArchetype("LLLL");
			expect(result.name).toBe("The Reserved Pragmatist");
			expect(result.isCurated).toBe(true);
		});

		it("isCurated is true for all hand-curated entries", () => {
			const curatedCodes = [
				"HHHH",
				"HHHL",
				"HHMH",
				"HHLH",
				"HMHH",
				"HMMM",
				"HLHH",
				"MHHH",
				"MMHH",
				"MMMM",
				"MMLH",
				"LHHH",
				"LHLH",
				"LMHH",
				"LLHH",
				"LLLL",
				"HLLH",
				"HLHL",
				"LHHL",
				"LHLL",
				"MHLH",
				"HMLL",
				"HHLL",
				"LMML",
				"HHMM",
			];
			for (const code of curatedCodes) {
				const result = lookupArchetype(code);
				expect(result.isCurated).toBe(true);
			}
		});

		it("all curated entries have non-empty names", () => {
			const curatedCodes = [
				"HHHH",
				"HHHL",
				"HHMH",
				"HHLH",
				"HMHH",
				"HMMM",
				"HLHH",
				"MHHH",
				"MMHH",
				"MMMM",
				"MMLH",
				"LHHH",
				"LHLH",
				"LMHH",
				"LLHH",
				"LLLL",
				"HLLH",
				"HLHL",
				"LHHL",
				"LHLL",
				"MHLH",
				"HMLL",
				"HHLL",
				"LMML",
				"HHMM",
			];
			for (const code of curatedCodes) {
				const result = lookupArchetype(code);
				expect(result.name.length).toBeGreaterThan(0);
			}
		});

		it("all curated entries have non-empty descriptions", () => {
			const curatedCodes = [
				"HHHH",
				"HHHL",
				"HHMH",
				"HHLH",
				"HMHH",
				"HMMM",
				"HLHH",
				"MHHH",
				"MMHH",
				"MMMM",
				"MMLH",
				"LHHH",
				"LHLH",
				"LMHH",
				"LLHH",
				"LLLL",
				"HLLH",
				"HLHL",
				"LHHL",
				"LHLL",
				"MHLH",
				"HMLL",
				"HHLL",
				"LMML",
				"HHMM",
			];
			for (const code of curatedCodes) {
				const result = lookupArchetype(code);
				expect(result.description.length).toBeGreaterThan(20);
			}
		});
	});

	describe("fallback-generated archetypes", () => {
		it("isCurated is false for generated entries", () => {
			// Pick codes that are NOT in the curated list
			const _uncuratedCodes = ["LLM", "MLM", "HLM"].map((prefix) => `${prefix}M`);
			// Use one guaranteed uncurated code
			const result = lookupArchetype("LLML");
			expect(result.isCurated).toBe(false);
		});

		it("generated names are non-empty", () => {
			const result = lookupArchetype("LLML");
			expect(result.name.length).toBeGreaterThan(0);
		});

		it("generated descriptions are non-empty (50-300 chars)", () => {
			const result = lookupArchetype("LLML");
			expect(result.description.length).toBeGreaterThanOrEqual(50);
			expect(result.description.length).toBeLessThanOrEqual(300);
		});

		it("generated colors are valid hex", () => {
			const result = lookupArchetype("LLML");
			expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});
	});

	describe("all 81 combinations", () => {
		const levels = ["L", "M", "H"] as const;

		for (const O of levels) {
			for (const C of levels) {
				for (const E of levels) {
					for (const A of levels) {
						const code4 = `${O}${C}${E}${A}`;
						it(`lookupArchetype("${code4}") returns valid archetype`, () => {
							const result = lookupArchetype(code4);
							expect(result.code4).toBe(code4);
							expect(result.name).toBeTruthy();
							expect(result.description.length).toBeGreaterThan(20);
							expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
							expect(typeof result.isCurated).toBe("boolean");
						});
					}
				}
			}
		}
	});

	describe("determinism", () => {
		it("same code returns identical result across 100 calls", () => {
			const first = lookupArchetype("HHMH");
			for (let i = 0; i < 100; i++) {
				const result = lookupArchetype("HHMH");
				expect(result).toEqual(first);
			}
		});

		it("generated archetype is deterministic", () => {
			const first = lookupArchetype("LLML");
			for (let i = 0; i < 100; i++) {
				const result = lookupArchetype("LLML");
				expect(result).toEqual(first);
			}
		});
	});

	describe("input validation", () => {
		it("throws on code with 3 characters", () => {
			expect(() => lookupArchetype("HHH")).toThrow();
		});

		it("throws on code with 5 characters", () => {
			expect(() => lookupArchetype("HHHHH")).toThrow();
		});

		it("throws on empty string", () => {
			expect(() => lookupArchetype("")).toThrow();
		});

		it("throws on invalid characters", () => {
			expect(() => lookupArchetype("XXXX")).toThrow();
		});

		it("throws on lowercase valid chars", () => {
			expect(() => lookupArchetype("hhmh")).toThrow();
		});

		it("throws on mixed invalid chars", () => {
			expect(() => lookupArchetype("HH1H")).toThrow();
		});
	});
});

describe("extract4LetterCode", () => {
	it('extracts "HHMH" from "HHMHM"', () => {
		expect(extract4LetterCode("HHMHM")).toBe("HHMH");
	});

	it('extracts "LLLL" from "LLLLL"', () => {
		expect(extract4LetterCode("LLLLL")).toBe("LLLL");
	});

	it('extracts "MMMM" from "MMMMM"', () => {
		expect(extract4LetterCode("MMMMM")).toBe("MMMM");
	});

	it("throws on 4-letter code", () => {
		expect(() => extract4LetterCode("HHMH")).toThrow();
	});

	it("throws on 6-letter code", () => {
		expect(() => extract4LetterCode("HHMHMM")).toThrow();
	});

	it("throws on empty string", () => {
		expect(() => extract4LetterCode("")).toThrow();
	});
});
