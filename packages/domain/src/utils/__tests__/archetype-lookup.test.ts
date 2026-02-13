import { describe, expect, it } from "vitest";
import { extract4LetterCode, lookupArchetype } from "../archetype-lookup";

describe("lookupArchetype", () => {
	describe("hand-curated archetypes", () => {
		it("returns curated name for ODEW (was HHHH)", () => {
			const result = lookupArchetype("ODEW");
			expect(result.name).toBe("The Idealist");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for ODEC (was HHHL)", () => {
			const result = lookupArchetype("ODEC");
			expect(result.name).toBe("The Visionary Planner");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for ODAW (was HHMH)", () => {
			const result = lookupArchetype("ODAW");
			expect(result.name).toBe("The Creative Diplomat");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for ODIW (was HHLH)", () => {
			const result = lookupArchetype("ODIW");
			expect(result.name).toBe("The Thoughtful Collaborator");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for OBEW (was HMHH)", () => {
			const result = lookupArchetype("OBEW");
			expect(result.name).toBe("The Curious Leader");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for OBAN (was HMMM)", () => {
			const result = lookupArchetype("OBAN");
			expect(result.name).toBe("The Balanced Explorer");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for OFEW (was HLHH)", () => {
			const result = lookupArchetype("OFEW");
			expect(result.name).toBe("The Free Spirit");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for GDEW (was MHHH)", () => {
			const result = lookupArchetype("GDEW");
			expect(result.name).toBe("The Steady Organizer");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for GBEW (was MMHH)", () => {
			const result = lookupArchetype("GBEW");
			expect(result.name).toBe("The Social Connector");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for GBAN (was MMMM)", () => {
			const result = lookupArchetype("GBAN");
			expect(result.name).toBe("The Centered Moderate");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for GBIW (was MMLH)", () => {
			const result = lookupArchetype("GBIW");
			expect(result.name).toBe("The Quiet Helper");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for PDEW (was LHHH)", () => {
			const result = lookupArchetype("PDEW");
			expect(result.name).toBe("The Traditional Leader");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for PDIW (was LHLH)", () => {
			const result = lookupArchetype("PDIW");
			expect(result.name).toBe("The Dependable Supporter");
			expect(result.isCurated).toBe(true);
		});

		it("returns curated name for PFIC (was LLLL)", () => {
			const result = lookupArchetype("PFIC");
			expect(result.name).toBe("The Reserved Pragmatist");
			expect(result.isCurated).toBe(true);
		});

		it("isCurated is true for all hand-curated entries", () => {
			const curatedCodes = [
				"ODEW",
				"ODEC",
				"ODAW",
				"ODIW",
				"OBEW",
				"OBAN",
				"OFEW",
				"GDEW",
				"GBEW",
				"GBAN",
				"GBIW",
				"PDEW",
				"PDIW",
				"PBEW",
				"PFEW",
				"PFIC",
				"OFIW",
				"OFEC",
				"PDEC",
				"PDIC",
				"GDIW",
				"OBIC",
				"ODIC",
				"PBAC",
				"ODAN",
			];
			for (const code of curatedCodes) {
				const result = lookupArchetype(code);
				expect(result.isCurated).toBe(true);
			}
		});

		it("all curated entries have non-empty names", () => {
			const curatedCodes = [
				"ODEW",
				"ODEC",
				"ODAW",
				"ODIW",
				"OBEW",
				"OBAN",
				"OFEW",
				"GDEW",
				"GBEW",
				"GBAN",
				"GBIW",
				"PDEW",
				"PDIW",
				"PBEW",
				"PFEW",
				"PFIC",
				"OFIW",
				"OFEC",
				"PDEC",
				"PDIC",
				"GDIW",
				"OBIC",
				"ODIC",
				"PBAC",
				"ODAN",
			];
			for (const code of curatedCodes) {
				const result = lookupArchetype(code);
				expect(result.name.length).toBeGreaterThan(0);
			}
		});

		it("all curated entries have non-empty descriptions", () => {
			const curatedCodes = [
				"ODEW",
				"ODEC",
				"ODAW",
				"ODIW",
				"OBEW",
				"OBAN",
				"OFEW",
				"GDEW",
				"GBEW",
				"GBAN",
				"GBIW",
				"PDEW",
				"PDIW",
				"PBEW",
				"PFEW",
				"PFIC",
				"OFIW",
				"OFEC",
				"PDEC",
				"PDIC",
				"GDIW",
				"OBIC",
				"ODIC",
				"PBAC",
				"ODAN",
			];
			for (const code of curatedCodes) {
				const result = lookupArchetype(code);
				expect(result.description.length).toBeGreaterThan(20);
			}
		});
	});

	describe("fallback-generated archetypes", () => {
		it("isCurated is false for generated entries", () => {
			// PFAN = Practical, Flexible, Ambivert, Negotiator (not curated)
			const result = lookupArchetype("PFAN");
			expect(result.isCurated).toBe(false);
		});

		it("generated names are non-empty", () => {
			const result = lookupArchetype("PFAN");
			expect(result.name.length).toBeGreaterThan(0);
		});

		it("generated descriptions are non-empty (50-300 chars)", () => {
			const result = lookupArchetype("PFAN");
			expect(result.description.length).toBeGreaterThanOrEqual(50);
			expect(result.description.length).toBeLessThanOrEqual(300);
		});

		it("generated colors are valid hex", () => {
			const result = lookupArchetype("PFAN");
			expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});
	});

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
			const first = lookupArchetype("ODAW");
			for (let i = 0; i < 100; i++) {
				const result = lookupArchetype("ODAW");
				expect(result).toEqual(first);
			}
		});

		it("generated archetype is deterministic", () => {
			const first = lookupArchetype("PFAN");
			for (let i = 0; i < 100; i++) {
				const result = lookupArchetype("PFAN");
				expect(result).toEqual(first);
			}
		});
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
