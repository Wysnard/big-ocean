import { describe, expect, it } from "vitest";
import { extract4LetterCode, lookupArchetype } from "../archetype-lookup";

describe("lookupArchetype", () => {
	describe("all 81 combinations", () => {
		const oLevels = ["T", "M", "O"] as const;
		const cLevels = ["F", "S", "C"] as const;
		const eLevels = ["R", "B", "E"] as const;
		const aLevels = ["D", "P", "A"] as const;

		for (const O of oLevels) {
			for (const C of cLevels) {
				for (const E of eLevels) {
					for (const A of aLevels) {
						const code4 = `${O}${C}${E}${A}`;
						it(`lookupArchetype("${code4}") returns valid curated archetype`, () => {
							const result = lookupArchetype(code4);
							expect(result.code4).toBe(code4);
							expect(result.name).toBeTruthy();
							expect(result.description.length).toBeGreaterThanOrEqual(1500);
							expect(result.description.length).toBeLessThanOrEqual(2500);
							expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
							expect(result.isCurated).toBe(true);
						});
					}
				}
			}
		}
	});

	describe("input validation", () => {
		it("throws on code with 3 characters", () => {
			expect(() => lookupArchetype("OCE")).toThrow();
		});

		it("throws on code with 5 characters", () => {
			expect(() => lookupArchetype("OCEAR")).toThrow();
		});

		it("throws on empty string", () => {
			expect(() => lookupArchetype("")).toThrow();
		});

		it("throws on invalid characters (old L/M/H format)", () => {
			expect(() => lookupArchetype("HHMH")).toThrow();
		});

		it("throws on lowercase valid chars", () => {
			expect(() => lookupArchetype("ocba")).toThrow();
		});

		it("throws on mixed invalid chars", () => {
			expect(() => lookupArchetype("OC1A")).toThrow();
		});
	});
});

describe("archetype lookup performance (NFR9 - Story 11.4)", () => {
	it("should complete all 81 lookups in < 100ms", () => {
		const oLevels = ["T", "M", "O"] as const;
		const cLevels = ["F", "S", "C"] as const;
		const eLevels = ["R", "B", "E"] as const;
		const aLevels = ["D", "P", "A"] as const;

		// Warmup: JIT compile the function before timing
		lookupArchetype("MSBP");

		const startTime = performance.now();

		for (const O of oLevels) {
			for (const C of cLevels) {
				for (const E of eLevels) {
					for (const A of aLevels) {
						const code4 = `${O}${C}${E}${A}`;
						lookupArchetype(code4);
					}
				}
			}
		}

		const endTime = performance.now();
		const totalTime = endTime - startTime;

		// NFR9: Archetype lookup should complete in < 100ms for all 81 codes
		// Using 100ms threshold; actual execution is typically < 5ms
		expect(totalTime).toBeLessThan(100);
	});
});

describe("extract4LetterCode", () => {
	it('extracts "OCBA" from "OCBAT"', () => {
		expect(extract4LetterCode("OCBAT")).toBe("OCBA");
	});

	it('extracts "TFRD" from "TFRDR"', () => {
		expect(extract4LetterCode("TFRDR")).toBe("TFRD");
	});

	it('extracts "MSBP" from "MSBPT"', () => {
		expect(extract4LetterCode("MSBPT")).toBe("MSBP");
	});

	it("throws on 4-letter code", () => {
		expect(() => extract4LetterCode("OCBA")).toThrow();
	});

	it("throws on 6-letter code", () => {
		expect(() => extract4LetterCode("OCBATS")).toThrow();
	});

	it("throws on empty string", () => {
		expect(() => extract4LetterCode("")).toThrow();
	});
});
