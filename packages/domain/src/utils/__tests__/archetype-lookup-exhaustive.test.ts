import { describe, expect, it } from "vitest";
import { extract4LetterCode, lookupArchetype } from "../archetype-lookup";

describe("lookupArchetype", () => {
	describe("all 81 combinations", () => {
		const oLevels = ["P", "G", "O"] as const;
		const cLevels = ["F", "B", "D"] as const;
		const eLevels = ["I", "A", "E"] as const;
		const aLevels = ["C", "N", "W"] as const;

		for (const O of oLevels) {
			for (const C of cLevels) {
				for (const E of eLevels) {
					for (const A of aLevels) {
						const code4 = `${O}${C}${E}${A}`;
						it(`lookupArchetype("${code4}") returns valid archetype`, () => {
							const result = lookupArchetype(code4);
							expect(result.code4).toBe(code4);
							expect(result.name).toBeTruthy();
							expect(result.description.length).toBeGreaterThanOrEqual(1500);
							expect(result.description.length).toBeLessThanOrEqual(2500);
							expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
							expect(typeof result.isCurated).toBe("boolean");
						});
					}
				}
			}
		}
	});

	describe("input validation", () => {
		it("throws on code with 3 characters", () => {
			expect(() => lookupArchetype("ODE")).toThrow();
		});

		it("throws on code with 5 characters", () => {
			expect(() => lookupArchetype("ODEWR")).toThrow();
		});

		it("throws on empty string", () => {
			expect(() => lookupArchetype("")).toThrow();
		});

		it("throws on invalid characters (old L/M/H format)", () => {
			expect(() => lookupArchetype("HHMH")).toThrow();
		});

		it("throws on lowercase valid chars", () => {
			expect(() => lookupArchetype("odaw")).toThrow();
		});

		it("throws on mixed invalid chars", () => {
			expect(() => lookupArchetype("OD1W")).toThrow();
		});
	});
});

describe("extract4LetterCode", () => {
	it('extracts "ODAW" from "ODAWT"', () => {
		expect(extract4LetterCode("ODAWT")).toBe("ODAW");
	});

	it('extracts "PFIC" from "PFICR"', () => {
		expect(extract4LetterCode("PFICR")).toBe("PFIC");
	});

	it('extracts "GBAN" from "GBANT"', () => {
		expect(extract4LetterCode("GBANT")).toBe("GBAN");
	});

	it("throws on 4-letter code", () => {
		expect(() => extract4LetterCode("ODAW")).toThrow();
	});

	it("throws on 6-letter code", () => {
		expect(() => extract4LetterCode("ODAWTS")).toThrow();
	});

	it("throws on empty string", () => {
		expect(() => extract4LetterCode("")).toThrow();
	});
});
