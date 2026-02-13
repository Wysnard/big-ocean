/**
 * Nerin Agent buildSystemPrompt Tests
 *
 * Tests for the system prompt construction function.
 * Verifies empathy patterns (appreciation, reframing, reconciliation)
 * and existing behaviors are present in the generated prompt.
 */

import { buildSystemPrompt } from "@workspace/domain";
import { describe, expect, it } from "vitest";

describe("buildSystemPrompt", () => {
	describe("Empathy Patterns", () => {
		it("includes appreciation pattern instructions", () => {
			const prompt = buildSystemPrompt();
			expect(prompt.toLowerCase()).toContain("appreciation");
			expect(prompt).toContain("honest");
			expect(prompt).toContain("self-awareness");
		});

		it("includes positive reframing instructions", () => {
			const prompt = buildSystemPrompt();
			expect(prompt.toLowerCase()).toContain("reframing");
			expect(prompt).toContain("generous interpretation");
		});

		it("includes contradiction reconciliation instructions", () => {
			const prompt = buildSystemPrompt();
			expect(prompt.toLowerCase()).toContain("contradiction");
			expect(prompt).toContain("coherent");
		});
	});

	describe("Existing Behaviors", () => {
		it("preserves existing key behaviors", () => {
			const prompt = buildSystemPrompt();
			expect(prompt).toContain("warm and curious");
			expect(prompt).toContain("non-judgmental");
			expect(prompt).toContain("open-ended questions");
		});

		it("preserves JSON format instructions", () => {
			const prompt = buildSystemPrompt();
			expect(prompt).toContain("emotionalTone");
			expect(prompt).toContain("followUpIntent");
			expect(prompt).toContain("suggestedTopics");
		});

		it("preserves persona introduction", () => {
			const prompt = buildSystemPrompt();
			expect(prompt).toContain("You are Nerin");
		});
	});

	describe("Steering Hint Integration", () => {
		it("appends steering hint after empathy patterns", () => {
			const prompt = buildSystemPrompt(undefined, "Explore how they organize their space");
			expect(prompt).toContain("Explore how they organize their space");
		});

		it("includes empathy patterns when steering hint is provided", () => {
			const prompt = buildSystemPrompt(undefined, "Test hint");
			expect(prompt.toLowerCase()).toContain("appreciation");
			expect(prompt.toLowerCase()).toContain("reframing");
			expect(prompt.toLowerCase()).toContain("contradiction");
		});
	});

	describe("Assessment Progress", () => {
		it("includes assessment progress when facet scores provided", () => {
			const facetScores = { imagination: { score: 15, confidence: 0.8 } };
			const prompt = buildSystemPrompt(facetScores);
			expect(prompt).toContain("1 personality facets");
		});

		it("omits assessment progress when no facet scores", () => {
			const prompt = buildSystemPrompt();
			expect(prompt).not.toContain("Assessment progress");
		});
	});
});
