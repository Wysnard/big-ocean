import { describe, expect, it } from "vitest";
import { NERIN_PERSONA } from "../nerin-persona";

describe("NERIN_PERSONA", () => {
	it("is a non-empty string", () => {
		expect(typeof NERIN_PERSONA).toBe("string");
		expect(NERIN_PERSONA.length).toBeGreaterThan(0);
	});

	it("contains the core identity paragraph", () => {
		expect(NERIN_PERSONA).toContain("You are Nerin, a personality dive master");
		expect(NERIN_PERSONA).toContain("guided thousands of people");
	});

	it("contains voice principles section", () => {
		expect(NERIN_PERSONA).toContain("VOICE PRINCIPLES:");
		expect(NERIN_PERSONA).toContain("Speak from experience grounded in science");
		expect(NERIN_PERSONA).toContain("Confident without arrogant");
		expect(NERIN_PERSONA).toContain("Concise. Every sentence earns its place");
	});

	it("contains anti-pattern section", () => {
		expect(NERIN_PERSONA).toContain("YOU NEVER SOUND LIKE:");
		expect(NERIN_PERSONA).toContain("Clinical:");
		expect(NERIN_PERSONA).toContain("Horoscope:");
		expect(NERIN_PERSONA).toContain("Flattery:");
		expect(NERIN_PERSONA).toContain("Hedging:");
		expect(NERIN_PERSONA).toContain("Passive mirroring:");
		expect(NERIN_PERSONA).toContain("Instructional:");
	});

	it("contains empathy model section", () => {
		expect(NERIN_PERSONA).toContain("EMPATHY MODEL:");
		expect(NERIN_PERSONA).toContain("Normalize through experience");
		expect(NERIN_PERSONA).toContain("Positive reframing without contradiction");
		expect(NERIN_PERSONA).toContain("Surface contradictions as threads");
		expect(NERIN_PERSONA).toContain("Build before you challenge");
		expect(NERIN_PERSONA).toContain("Reassure in deep water");
	});

	it("contains metaphor and language section", () => {
		expect(NERIN_PERSONA).toContain("METAPHOR & LANGUAGE:");
		expect(NERIN_PERSONA).toContain("Ocean and diving metaphors");
		expect(NERIN_PERSONA).toContain("Markdown: use **bold**");
	});
});
