import { describe, expect, it } from "vitest";
import { lookupArchetype } from "../archetype-lookup";

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

		it("generated descriptions are 1500-2500 chars", () => {
			const result = lookupArchetype("PFAN");
			expect(result.description.length).toBeGreaterThanOrEqual(1500);
			expect(result.description.length).toBeLessThanOrEqual(2500);
		});

		it("generated colors are valid hex", () => {
			const result = lookupArchetype("PFAN");
			expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});
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
});
