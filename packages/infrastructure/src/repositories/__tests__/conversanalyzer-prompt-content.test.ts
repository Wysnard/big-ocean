/**
 * ConversAnalyzer v2 Prompt Content Tests (Story 31-8, AC4; Story 40-2)
 *
 * Verifies that the ConversAnalyzer v2 prompt includes:
 * - Dual-facet extraction check (mandatory)
 * - Polarity balance target (>=30% negative deviations)
 * - Energy band classification with guardrails
 * - Telling band classification
 * - Deviation calibration with negative examples
 * - Updated domain definitions (Story 40-2: health added, solo removed)
 */

import { describe, expect, it } from "vitest";
import { buildV2Prompt } from "../conversanalyzer.anthropic.repository";

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

describe("ConversAnalyzer v2 Prompt Content (Story 31-8, AC4)", () => {
	const prompt = buildV2Prompt(testInput);

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

	describe("Deviation Calibration", () => {
		it("includes deviation range -3 to +3", () => {
			expect(prompt).toContain("-3 to +3");
		});

		it("warns against defaulting to positive deviations", () => {
			expect(prompt).toContain("Do NOT default to positive deviations");
		});

		it("includes negative deviation examples", () => {
			// Prompt should include examples with negative deviations like gregariousness -3, anxiety -3
			expect(prompt).toContain("gregariousness -3");
			expect(prompt).toContain("anxiety -3");
		});
	});

	describe("Two-Phase Structure", () => {
		it("positions state extraction FIRST (PHASE 1)", () => {
			const phase1Index = prompt.indexOf("PHASE 1: USER STATE EXTRACTION");
			const phase2Index = prompt.indexOf("PHASE 2: PERSONALITY EVIDENCE EXTRACTION");
			expect(phase1Index).toBeGreaterThan(-1);
			expect(phase2Index).toBeGreaterThan(-1);
			expect(phase1Index).toBeLessThan(phase2Index);
		});
	});

	describe("Domain Distribution", () => {
		it("includes current evidence distribution from input", () => {
			expect(prompt).toContain("work=2");
			expect(prompt).toContain("relationships=1");
		});
	});

	describe("Conversation Context", () => {
		it("includes recent messages in prompt", () => {
			expect(prompt).toContain("[assistant]: Tell me about your work.");
			expect(prompt).toContain("[user]: I work in tech and enjoy solving complex problems");
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
});
