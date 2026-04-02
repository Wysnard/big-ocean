/**
 * ConversAnalyzer Prompt Content Tests (Story 31-8, AC4; Story 40-2; Story 42-2)
 *
 * Verifies that the split ConversAnalyzer prompts include expected content:
 * - User state prompt: energy/telling bands, guardrails, conversation context
 * - Evidence prompt: facet definitions, deviation calibration, dual-facet check, polarity balance
 */

import { describe, expect, it } from "vitest";
import { buildEvidencePrompt, buildUserStatePrompt } from "../conversanalyzer.anthropic.repository";

const testInput = {
	message: "I work in tech and enjoy solving complex problems",
	recentMessages: [
		{ id: "msg_1", role: "assistant" as const, content: "Tell me about your work." },
		{
			id: "msg_2",
			role: "user" as const,
			content: "I work in tech and enjoy solving complex problems",
		},
	],
	domainDistribution: {
		work: 2,
		relationships: 1,
		family: 0,
		leisure: 0,
		health: 0,
		other: 0,
	},
};

describe("User State Prompt (buildUserStatePrompt)", () => {
	const prompt = buildUserStatePrompt(testInput);

	describe("Energy Band Classification", () => {
		it("includes all five energy bands", () => {
			expect(prompt).toContain("minimal");
			expect(prompt).toContain("low");
			expect(prompt).toContain("steady");
			expect(prompt).toContain("high");
			expect(prompt).toContain("very_high");
		});

		it("includes six load-bearing guardrails", () => {
			expect(prompt).toContain("SIX LOAD-BEARING GUARDRAILS");
			expect(prompt).toContain("Eloquence is not energy");
			expect(prompt).toContain("Sophistication is not cognitive investment");
			expect(prompt).toContain("Peak dimension, not average");
			expect(prompt).toContain("Understated styles are not low energy");
			expect(prompt).toContain("Long detailed answer is not high telling");
			expect(prompt).toContain("Diagonal examples are mandatory");
		});
	});

	describe("Telling Band Classification", () => {
		it("includes all five telling bands", () => {
			expect(prompt).toContain("fully_compliant");
			expect(prompt).toContain("mostly_compliant");
			expect(prompt).toContain("mixed");
			expect(prompt).toContain("mostly_self_propelled");
			expect(prompt).toContain("strongly_self_propelled");
		});
	});

	describe("Conversation Context", () => {
		it("includes recent messages as context", () => {
			expect(prompt).toContain("[assistant]: Tell me about your work.");
		});

		it("includes latest user message separately", () => {
			expect(prompt).toContain("Latest User Message (analyze THIS)");
			expect(prompt).toContain("I work in tech and enjoy solving complex problems");
		});
	});
});

describe("Evidence Prompt (buildEvidencePrompt)", () => {
	const prompt = buildEvidencePrompt(testInput);

	describe("Dual-Facet Extraction Check", () => {
		it("includes mandatory dual-facet check instruction", () => {
			expect(prompt).toContain("Dual-Facet Check (MANDATORY)");
		});

		it("instructs finding NEGATIVE deviation for DIFFERENT facet", () => {
			expect(prompt).toContain("DIFFERENT facet");
			expect(prompt).toContain("NEGATIVE deviation");
		});
	});

	describe("Polarity Balance Target", () => {
		it("includes polarity balance target of at least 30%", () => {
			expect(prompt).toContain("Polarity Balance Target");
			expect(prompt).toContain("30%");
			expect(prompt).toContain("negative deviations");
		});
	});

	describe("Deviation Calibration", () => {
		it("includes deviation range -3 to +3", () => {
			expect(prompt).toContain("-3 to +3");
		});

		it("warns against defaulting to positive deviations", () => {
			expect(prompt).toContain("Do NOT default to positive deviations");
		});

		it("includes negative deviation examples", () => {
			expect(prompt).toContain("gregariousness -3");
			expect(prompt).toContain("anxiety -3");
		});
	});

	describe("Conversation Context", () => {
		it("includes recent messages as context", () => {
			expect(prompt).toContain("[assistant]: Tell me about your work.");
		});

		it("includes latest user message separately", () => {
			expect(prompt).toContain("Latest User Message (analyze THIS)");
			expect(prompt).toContain("I work in tech and enjoy solving complex problems");
		});
	});

	describe("Domain Definitions (Story 40-2)", () => {
		it("includes all 6 active domains in the Life Domains section", () => {
			expect(prompt).toContain("- work:");
			expect(prompt).toContain("- relationships:");
			expect(prompt).toContain("- family:");
			expect(prompt).toContain("- leisure:");
			expect(prompt).toContain("- health:");
			expect(prompt).toContain("- other:");
		});

		it("does NOT include solo in the Life Domains section", () => {
			expect(prompt).not.toContain("- solo:");
		});

		it("leisure definition includes introspection and daydreaming", () => {
			expect(prompt).toContain("introspection");
			expect(prompt).toContain("daydreaming");
		});

		it("health definition includes Exercise and stress management", () => {
			expect(prompt).toContain("Exercise");
			expect(prompt).toContain("stress management");
		});

		it("work definition includes education and studying", () => {
			expect(prompt).toContain("education");
			expect(prompt).toContain("studying");
		});

		it("other definition includes Target <5%", () => {
			expect(prompt).toContain("Target <5%");
		});
	});

	describe("No user state content in evidence prompt", () => {
		it("does not contain energy band classification", () => {
			expect(prompt).not.toContain("Energy Band");
			expect(prompt).not.toContain("energyBand");
		});

		it("does not contain telling band classification", () => {
			expect(prompt).not.toContain("Telling Band");
			expect(prompt).not.toContain("tellingBand");
		});

		it("does not contain guardrails", () => {
			expect(prompt).not.toContain("LOAD-BEARING GUARDRAILS");
		});
	});
});
