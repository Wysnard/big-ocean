import { describe, expect, it } from "vitest";
import { NERIN_PERSONA } from "../nerin-persona";

describe("NERIN_PERSONA", () => {
	it("is a non-empty string", () => {
		expect(typeof NERIN_PERSONA).toBe("string");
		expect(NERIN_PERSONA.length).toBeGreaterThan(0);
	});

	it("contains the core identity paragraph with Big Ocean grounding", () => {
		expect(NERIN_PERSONA).toContain("You are Nerin, a personality dive master at Big Ocean");
		expect(NERIN_PERSONA).toContain("Vincent's dive shop");
		expect(NERIN_PERSONA).toContain("guided thousands of people");
	});

	it("contains ADR-DM-3 positioning rewrites", () => {
		// "your edge" → "your comfort in the deep"
		expect(NERIN_PERSONA).toContain("comfort is in the deep");
		expect(NERIN_PERSONA).not.toContain("That's your edge");
		// "you see patterns other people miss" → "paying attention long enough to notice things"
		expect(NERIN_PERSONA).toContain("paying attention long enough to notice things");
		expect(NERIN_PERSONA).not.toContain("you see things beneath the surface that others miss");
		// Genuine fascination reframe
		expect(NERIN_PERSONA).toContain("genuinely fascinated");
	});

	it("contains VOICE section with renamed header", () => {
		expect(NERIN_PERSONA).toContain("VOICE:");
		expect(NERIN_PERSONA).toContain("Speak from experience grounded in science");
		expect(NERIN_PERSONA).toContain("Confident without arrogant");
		expect(NERIN_PERSONA).toContain("Concise. Every sentence earns its place");
	});

	it("does not contain old VOICE PRINCIPLES header", () => {
		expect(NERIN_PERSONA).not.toContain("VOICE PRINCIPLES:");
	});

	it("contains universal anti-pattern section with 4 patterns", () => {
		expect(NERIN_PERSONA).toContain("YOU NEVER SOUND LIKE:");
		expect(NERIN_PERSONA).toContain("Clinical:");
		expect(NERIN_PERSONA).toContain("Horoscope:");
		expect(NERIN_PERSONA).toContain("flattery:");
		expect(NERIN_PERSONA).toContain("Hedging:");
	});

	it("does not contain removed anti-patterns (moved to CHAT_CONTEXT)", () => {
		expect(NERIN_PERSONA).not.toContain("Passive mirroring:");
		expect(NERIN_PERSONA).not.toContain("Instructional:");
	});

	it("does not contain empathy model section (moved to CHAT_CONTEXT)", () => {
		expect(NERIN_PERSONA).not.toContain("EMPATHY MODEL:");
		expect(NERIN_PERSONA).not.toContain("Normalize through experience");
		expect(NERIN_PERSONA).not.toContain("Positive reframing");
		expect(NERIN_PERSONA).not.toContain("Surface contradictions as threads");
		expect(NERIN_PERSONA).not.toContain("Build before you challenge");
		expect(NERIN_PERSONA).not.toContain("Reassure in deep water");
	});

	it("does not contain metaphor & language section (moved to CHAT_CONTEXT)", () => {
		expect(NERIN_PERSONA).not.toContain("METAPHOR & LANGUAGE:");
		expect(NERIN_PERSONA).not.toContain("Markdown: use **bold**");
	});

	it("contains ocean metaphor identity one-liner", () => {
		expect(NERIN_PERSONA).toContain(
			"Ocean and diving metaphors are part of your identity, not decoration",
		);
	});
});
