/**
 * ConversAnalyzer Prompt Content Tests (Story 31-8, AC4; Story 40-2; Story 42-2; Story 42-3; Story 43-6)
 *
 * Verifies that the ConversAnalyzer evidence prompt includes expected content:
 * - Evidence prompt (v3): per-facet conversational anchors, polarity-based output,
 *   dual-polarity check, polarity balance audit, domain definitions
 *
 * User-state prompt tests removed in Story 43-6 (Director reads energy/telling natively).
 */

import { describe, expect, it } from "vitest";
import { buildEvidencePrompt } from "../conversanalyzer.anthropic.repository";

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

describe("Evidence Prompt v3 (buildEvidencePrompt)", () => {
	const prompt = buildEvidencePrompt(testInput);

	describe("Per-Facet Conversational Anchors (Story 42-3, AC1)", () => {
		it("includes anchors for all 5 Big Five trait sections", () => {
			expect(prompt).toContain("### OPENNESS TO EXPERIENCE");
			expect(prompt).toContain("### CONSCIENTIOUSNESS");
			expect(prompt).toContain("### EXTRAVERSION");
			expect(prompt).toContain("### AGREEABLENESS");
			expect(prompt).toContain("### NEUROTICISM");
		});

		it("includes HIGH and LOW anchors for representative openness facets", () => {
			// imagination
			expect(prompt).toContain("**imagination**");
			expect(prompt).toContain("I spend hours daydreaming about scenarios");
			expect(prompt).toContain("I don't really daydream");

			// artistic_interests
			expect(prompt).toContain("**artistic_interests**");
			expect(prompt).toContain("I stood in front of that painting");
			expect(prompt).toContain("Museums bore me");
		});

		it("includes HIGH and LOW anchors for representative conscientiousness facets", () => {
			// self_discipline
			expect(prompt).toContain("**self_discipline**");
			expect(prompt).toContain("I finish things even when they're boring");
			expect(prompt).toContain("I can't focus on anything that doesn't interest me");

			// cautiousness
			expect(prompt).toContain("**cautiousness**");
			expect(prompt).toContain("I make pro/con lists");
			expect(prompt).toContain("I decide fast and course-correct later");
		});

		it("includes HIGH and LOW anchors for representative extraversion facets", () => {
			// gregariousness
			expect(prompt).toContain("**gregariousness**");
			expect(prompt).toContain("I hate being alone");
			expect(prompt).toContain("I go weeks without seeing anyone");
		});

		it("includes HIGH and LOW anchors for representative agreeableness facets", () => {
			// trust
			expect(prompt).toContain("**trust**");
			expect(prompt).toContain("benefit of the doubt");
			expect(prompt).toContain("I always look for the angle");
		});

		it("includes HIGH and LOW anchors for representative neuroticism facets", () => {
			// anxiety
			expect(prompt).toContain("**anxiety**");
			expect(prompt).toContain("I lose sleep worrying");
			expect(prompt).toContain("I genuinely don't worry much");

			// vulnerability
			expect(prompt).toContain("**vulnerability**");
			expect(prompt).toContain("I shut down");
			expect(prompt).toContain("I work well under pressure");
		});

		it("includes all 30 facet names as anchored sections", () => {
			const allFacets = [
				"imagination",
				"artistic_interests",
				"emotionality",
				"adventurousness",
				"intellect",
				"liberalism",
				"self_efficacy",
				"orderliness",
				"dutifulness",
				"achievement_striving",
				"self_discipline",
				"cautiousness",
				"friendliness",
				"gregariousness",
				"assertiveness",
				"activity_level",
				"excitement_seeking",
				"cheerfulness",
				"trust",
				"morality",
				"altruism",
				"cooperation",
				"modesty",
				"sympathy",
				"anxiety",
				"anger",
				"depression",
				"self_consciousness",
				"immoderation",
				"vulnerability",
			];
			for (const facet of allFacets) {
				expect(prompt).toContain(`**${facet}**`);
			}
		});
	});

	describe("Polarity-Based Output Instructions (Story 42-3, AC1 + AC6)", () => {
		it("instructs LLM to output polarity (high/low)", () => {
			expect(prompt).toContain("**polarity**: HIGH or LOW expression?");
		});

		it("instructs LLM to output strength", () => {
			expect(prompt).toContain("**strength**: How diagnostic is this signal?");
		});

		it("does NOT instruct LLM to output deviation", () => {
			// The v3 prompt should not contain deviation instructions
			expect(prompt).not.toContain("deviation: integer from -3 to +3");
			expect(prompt).not.toContain("**deviation**");
		});
	});

	describe("Dual-Polarity Check (Story 42-3, AC2)", () => {
		it("includes mandatory dual-polarity check instruction", () => {
			expect(prompt).toContain("Dual-Polarity Check (MANDATORY)");
		});

		it("includes 5 dual-polarity examples from spec", () => {
			expect(prompt).toContain("HIGH self_discipline + LOW gregariousness");
			expect(prompt).toContain("HIGH assertiveness + LOW morality");
			expect(prompt).toContain("HIGH intellect + LOW friendliness");
			expect(prompt).toContain("HIGH activity_level + LOW vulnerability");
			expect(prompt).toContain("HIGH cooperation + LOW assertiveness");
		});

		it("instructs extracting BOTH signals", () => {
			expect(prompt).toContain("Extract BOTH signals when applicable");
		});
	});

	describe("Polarity Balance Audit (Story 42-3, AC3)", () => {
		it("includes mandatory polarity balance audit", () => {
			expect(prompt).toContain("Polarity Balance Audit (MANDATORY)");
		});

		it("specifies 35% LOW threshold", () => {
			expect(prompt).toContain("fewer than 35% are LOW");
		});

		it("includes re-read instructions for absences and avoidances", () => {
			expect(prompt).toContain("ABSENCES");
			expect(prompt).toContain("AVOIDANCES");
			expect(prompt).toContain("PREFERENCES AGAINST");
		});
	});

	describe("Domain Definitions (Story 42-3, AC4)", () => {
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

	describe("Domain Distribution Context (Story 42-3, AC5)", () => {
		it("includes current evidence distribution", () => {
			expect(prompt).toContain("Current Evidence Distribution");
			expect(prompt).toContain("work: 2");
			expect(prompt).toContain("relationships: 1");
			expect(prompt).toContain("family: 0");
		});
	});

	describe("Conversation Context", () => {
		it("includes recent messages as context", () => {
			expect(prompt).toContain("[assistant]: Tell me about your work.");
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
