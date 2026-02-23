import { describe, expect, it } from "vitest";
import { NERIN_PERSONA } from "../../constants/nerin-persona";
import { buildChatSystemPrompt } from "../nerin-system-prompt";

describe("buildChatSystemPrompt — persona and structure", () => {
	it("contains NERIN_PERSONA content (trimmed version)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("You are Nerin, a personality dive master");
		expect(prompt).toContain("VOICE:");
		expect(prompt).toContain("YOU NEVER SOUND LIKE:");
		// Trimmed persona should NOT contain these sections
		expect(prompt).not.toContain("EMPATHY MODEL:");
		expect(prompt).not.toContain("METAPHOR & LANGUAGE:");
	});

	it("contains CHAT_CONTEXT section headers", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("CONVERSATION MODE:");
		expect(prompt).toContain("HOW TO BEHAVE — BELIEFS IN ACTION");
		expect(prompt).toContain("OBSERVATION + QUESTION FORMAT");
		expect(prompt).toContain("THREADING");
		expect(prompt).toContain("NATURAL WORLD MIRRORS");
		expect(prompt).toContain("EXPLORING BREADTH");
		expect(prompt).toContain("QUESTIONING STYLE:");
		expect(prompt).toContain("RESPONSE FORMAT");
		expect(prompt).toContain("CONVERSATION AWARENESS");
		expect(prompt).toContain("DEPTH PROGRESSION");
		expect(prompt).toContain("HUMOR");
		expect(prompt).toContain("WHAT STAYS INTERNAL");
	});

	it("includes the full NERIN_PERSONA constant", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain(NERIN_PERSONA);
	});

	it("does not contain JSON format requirement", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("JSON format");
		expect(prompt).not.toContain('"message"');
		expect(prompt).not.toContain('"emotionalTone"');
		expect(prompt).not.toContain('"followUpIntent"');
		expect(prompt).not.toContain('"suggestedTopics"');
	});

	it("does not contain old generic prompt text", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("warm and curious conversational partner");
		expect(prompt).not.toContain("Paragraph 1:");
		expect(prompt).not.toContain("Paragraph 2:");
	});

	it("contains anti-analysis instructions in WHAT STAYS INTERNAL", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain('No "You seem like someone who..."');
		expect(prompt).toContain('"I think you tend to..."');
		expect(prompt).toContain("Save your reads for the portrait");
	});

	it("contains breadth-first exploration instructions", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("Explore breadth through connected threads");
		expect(prompt).toContain("Don't exhaust a topic");
	});

	it("contains mirror library reference (AC3)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("MIRROR REFERENCE");
		expect(prompt).toContain("Hermit Crab");
		expect(prompt).toContain("Ghost Net");
		expect(prompt).toContain("Pilot Fish");
		expect(prompt).toContain("Tide Pool");
		expect(prompt).toContain("Mimic Octopus");
		expect(prompt).toContain("Clownfish");
		expect(prompt).toContain("Coral Reef");
		expect(prompt).toContain("Mola Mola");
		expect(prompt).toContain("Sea Urchin");
	});

	it("contains beliefs in action (AC2)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("CONTRADICTIONS ARE FEATURES, NOT BUGS");
		expect(prompt).toContain("THE MOST INTERESTING THING IS USUALLY WHAT THEY THINK IS ORDINARY");
		expect(prompt).toContain("PEOPLE ARE MORE READY FOR TRUTH THAN THEY THINK");
		expect(prompt).toContain("EVERY DIVE TEACHES YOU SOMETHING");
	});

	it("contains threading instructions (AC2)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("THREADING");
		expect(prompt).toContain("FLAG it and LEAVE it");
		expect(prompt).toContain("PARK explicitly and PICK ONE");
	});

	it("contains emoji palette (AC5 — moved from persona)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("🐢 🐠 🐙 🦈 🐚 🪸");
	});
});
