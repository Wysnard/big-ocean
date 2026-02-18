import { describe, expect, it } from "vitest";
import { NERIN_PERSONA } from "../../constants/nerin-persona";
import { buildChatSystemPrompt } from "../nerin-system-prompt";

describe("buildChatSystemPrompt", () => {
	it("contains NERIN_PERSONA content", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("You are Nerin, a personality dive master");
		expect(prompt).toContain("VOICE PRINCIPLES:");
		expect(prompt).toContain("YOU NEVER SOUND LIKE:");
		expect(prompt).toContain("EMPATHY MODEL:");
		expect(prompt).toContain("METAPHOR & LANGUAGE:");
	});

	it("contains CHAT_CONTEXT content", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("CONVERSATION MODE:");
		expect(prompt).toContain("QUESTIONING STYLE:");
		expect(prompt).toContain("RESPONSE FORMAT:");
		expect(prompt).toContain("CONVERSATION AWARENESS:");
		expect(prompt).toContain("DEPTH PROGRESSION:");
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

	it("contains anti-analysis instructions (AC8)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain('No "You seem like someone who..."');
		expect(prompt).toContain('"I think you tend to..."');
		expect(prompt).toContain("Save your reads for the portrait");
	});

	it("contains breadth-first exploration instructions (AC9)", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).toContain("Explore breadth through connected threads");
		expect(prompt).toContain("Don't exhaust a topic");
	});

	it("appends steering hint with strengthened priority text when provided", () => {
		const prompt = buildChatSystemPrompt("Explore how they handle conflict");
		expect(prompt).toContain("STEERING PRIORITY:");
		expect(prompt).toContain("Explore how they handle conflict");
		expect(prompt).toContain("This is your next exploration target");
		expect(prompt).toContain("Transition to this territory within your next 1-2 responses");
	});

	it("does not contain old steering text format", () => {
		const prompt = buildChatSystemPrompt("Explore empathy patterns");
		expect(prompt).not.toContain("Current conversation focus:");
		expect(prompt).not.toContain("Naturally guide the conversation");
	});

	it("does not include steering section when no hint provided", () => {
		const prompt = buildChatSystemPrompt();
		expect(prompt).not.toContain("STEERING PRIORITY:");
	});

	it("combines persona, chat context, and steering hint when provided", () => {
		const prompt = buildChatSystemPrompt("Explore orderliness");
		expect(prompt).toContain(NERIN_PERSONA);
		expect(prompt).toContain("CONVERSATION MODE:");
		expect(prompt).toContain("STEERING PRIORITY:");
		expect(prompt).toContain("Explore orderliness");
	});
});
