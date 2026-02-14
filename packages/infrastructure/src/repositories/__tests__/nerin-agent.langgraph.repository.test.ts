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
			// Verify the section header
			expect(prompt.toLowerCase()).toContain("appreciation");
			// Verify the core behavioral directive
			expect(prompt).toContain("actively acknowledge");
			expect(prompt).toContain("vulnerable or honest");
			// Verify the variation requirement
			expect(prompt).toContain("Vary your phrasing");
			expect(prompt).toContain("never repeat the same appreciation twice");
			// Verify example phrases are present
			expect(prompt).toContain("That's really honest of you");
			expect(prompt).toContain("self-awareness");
		});

		it("includes positive reframing instructions", () => {
			const prompt = buildSystemPrompt();
			// Verify the section header
			expect(prompt.toLowerCase()).toContain("reframing");
			// Verify the core behavioral directive
			expect(prompt).toContain("generous interpretation");
			expect(prompt).toContain("doesn't contradict their experience");
			// Verify the "never invalidate" rule
			expect(prompt).toContain('Never say "you\'re not [negative thing]"');
			// Verify examples are present
			expect(prompt).toContain("I'm indecisive");
			expect(prompt).toContain("You weigh options carefully");
		});

		it("includes contradiction reconciliation instructions", () => {
			const prompt = buildSystemPrompt();
			// Verify the section header
			expect(prompt.toLowerCase()).toContain("contradiction");
			// Verify the core behavioral directive
			expect(prompt).toContain("conflicting signals");
			expect(prompt).toContain("coherent deeper truth");
			expect(prompt).toContain("don't ignore them");
			// Verify example is present
			expect(prompt).toContain("organized at work but messy at home");
		});
	});

	describe("Response Structure", () => {
		it("includes two-paragraph response format instructions", () => {
			const prompt = buildSystemPrompt();
			// Verify the section exists
			expect(prompt).toContain("Response structure");
			expect(prompt).toContain("follow this format for every message");
			// Verify paragraph 1 instruction
			expect(prompt).toContain("Paragraph 1");
			expect(prompt).toContain("empathy patterns");
			expect(prompt).toContain("Acknowledge, reframe, or reconcile");
			// Verify paragraph 2 instruction
			expect(prompt).toContain("Paragraph 2");
			expect(prompt).toContain("natural follow-up question");
		});

		it("includes example response demonstrating structure", () => {
			const prompt = buildSystemPrompt();
			// Verify example header
			expect(prompt).toContain("Example response:");
			// Verify example content shows empathy + question pattern
			expect(prompt).toContain("That's really insightful");
			expect(prompt).toContain("What helps you decide");
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
