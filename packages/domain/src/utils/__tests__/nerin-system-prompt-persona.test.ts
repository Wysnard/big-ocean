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
		expect(prompt).toContain("RELATE > REFLECT");
		expect(prompt).toContain("STORY-PULLING");
		expect(prompt).toContain("OBSERVATION + QUESTION");
		expect(prompt).toContain("THREADING");
		expect(prompt).toContain("NATURAL WORLD MIRRORS");
		expect(prompt).toContain("QUESTIONING STYLE:");
		expect(prompt).toContain("RESPONSE FORMAT");
		expect(prompt).toContain("CONVERSATION AWARENESS");
		expect(prompt).toContain("HUMOR");
		expect(prompt).toContain("WHAT STAYS INTERNAL");
	});

	it("does not contain DEPTH PROGRESSION section (Story 22-1: steering removed from character)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("DEPTH PROGRESSION");
		expect(prompt).not.toContain("LATE-CONVERSATION DEPTH");
		expect(prompt).not.toContain("messages ~14-18");
	});

	it("retains vulnerability response and depth celebration as personality patterns", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("MEET VULNERABILITY FIRST");
		expect(prompt).toContain("CELEBRATE NEW DEPTH");
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

	it("contains conversation awareness instructions (depth progression removed)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("CONVERSATION AWARENESS");
		expect(prompt).not.toContain("DEPTH PROGRESSION");
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

	it("contains beliefs in action (AC2, updated Story 22-3: contradiction-surfacing removed)", () => {
		const prompt = buildChatSystemPrompt();
		// Story 22-3: contradiction-surfacing migrated to portrait generator
		expect(prompt).not.toContain("CONTRADICTIONS ARE FEATURES, NOT BUGS");
		expect(prompt).toContain("THE MOST INTERESTING THING IS USUALLY WHAT THEY THINK IS ORDINARY");
		expect(prompt).toContain("PEOPLE DISCOVER MORE WHEN THEY FEEL SAFE TO EXPLORE");
		expect(prompt).not.toContain("PEOPLE ARE MORE READY FOR TRUTH THAN THEY THINK");
		expect(prompt).toContain("EVERY DIVE TEACHES YOU SOMETHING");
	});

	it("contains threading instructions (AC2)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("THREADING");
		expect(prompt).toContain("FLAG it and LEAVE it");
		expect(prompt).toContain("PARK explicitly and PICK ONE");
	});

	it("does not contain contradiction-surfacing (Story 22-3: migrated to portrait generator)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("CONTRADICTIONS ARE FEATURES, NOT BUGS");
		expect(prompt).not.toContain("Surface them as threads");
	});

	it("contains emoji palette (AC5 — moved from persona)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("🐢 🐠 🐙 🦈 🐚 🪸");
	});

	// Story 22-2: Relate > Reflect & Story-Pulling Patterns
	describe("Story 22-2 — relate > reflect & story-pulling", () => {
		it("contains relate > reflect as primary interaction pattern (AC1)", () => {
			const prompt = buildChatSystemPrompt();
			expect(prompt).toContain("RELATE > REFLECT");
			expect(prompt).toContain("primary interaction pattern");
		});

		it("contains at least 5 relate > reflect patterns with AI-truthful framing (AC1)", () => {
			const prompt = buildChatSystemPrompt();
			// AI-truthful framing markers
			const truthfulMarkers = [
				"In conversations I've had",
				"Something I notice",
				"What often comes up",
				"I've found that",
				"One thing that keeps surfacing",
			];
			let matchCount = 0;
			for (const marker of truthfulMarkers) {
				if (prompt.includes(marker)) matchCount++;
			}
			expect(matchCount).toBeGreaterThanOrEqual(5);
		});

		it("explicitly prohibits hallucination-adjacent language (AC1)", () => {
			const prompt = buildChatSystemPrompt();
			// The prompt should contain NEVER-use instructions warning against these phrases
			expect(prompt).toContain('NEVER use: "I\'ve seen people who..."');
			expect(prompt).toContain('"People I know..."');
		});

		it("contains story-pulling as primary question type (AC2)", () => {
			const prompt = buildChatSystemPrompt();
			expect(prompt).toContain("STORY-PULLING");
			expect(prompt).toContain("primary question type");
		});

		it("contains at least 5 story-pulling patterns (AC2)", () => {
			const prompt = buildChatSystemPrompt();
			const storyPullingPatterns = [
				"Tell me about a time",
				"Walk me through",
				"What was it like when",
				"Can you think of a moment",
				"How did that actually play out",
			];
			let matchCount = 0;
			for (const pattern of storyPullingPatterns) {
				if (prompt.includes(pattern)) matchCount++;
			}
			expect(matchCount).toBeGreaterThanOrEqual(5);
		});

		it("repositions observation + question as secondary tool (AC3)", () => {
			const prompt = buildChatSystemPrompt();
			// Should NOT be called "Your core move" anymore
			expect(prompt).not.toContain("Your core move");
			// Should contain language indicating it's a secondary/supplementary tool
			expect(prompt).toContain("OBSERVATION + QUESTION");
		});

		it("includes territory bridges in natural world mirrors (AC4)", () => {
			const prompt = buildChatSystemPrompt();
			expect(prompt).toContain("TERRITORY BRIDGES");
		});

		it("includes 'it's okay to not know' normalization (AC5)", () => {
			const prompt = buildChatSystemPrompt();
			expect(prompt).toContain("IT'S OKAY TO NOT KNOW");
		});
	});
});
