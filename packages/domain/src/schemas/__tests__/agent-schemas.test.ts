/**
 * Agent Schema Tests
 *
 * Tests for Effect Schema validation of agent responses.
 * Ensures structured output schemas work correctly for both
 * validation and JSON Schema generation.
 */

import { JSONSchema } from "@effect/schema";
import {
	AnalyzerResponseSchema,
	NerinResponseSchema,
	validateAnalyzerResponse,
	validateNerinResponse,
} from "@workspace/domain";
import { describe, expect, it } from "vitest";

describe("NerinResponseSchema", () => {
	it("validates a correct Nerin response", () => {
		const validResponse = {
			message: "That sounds fascinating! Tell me more about what inspired you.",
			emotionalTone: "curious" as const,
			followUpIntent: true,
			suggestedTopics: ["inspiration", "creativity"],
		};

		const result = validateNerinResponse(validResponse);
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.message).toBe(validResponse.message);
			expect(result.right.emotionalTone).toBe("curious");
			expect(result.right.followUpIntent).toBe(true);
		}
	});

	it("fails validation with missing required field", () => {
		const invalidResponse = {
			message: "Hello there",
			// missing emotionalTone
			followUpIntent: false,
			suggestedTopics: [],
		};

		const result = validateNerinResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("fails validation with invalid emotional tone", () => {
		const invalidResponse = {
			message: "Hello there",
			emotionalTone: "angry" as const, // Invalid tone
			followUpIntent: false,
			suggestedTopics: [],
		};

		const result = validateNerinResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("fails validation with empty message", () => {
		const invalidResponse = {
			message: "", // Empty message (minLength: 1)
			emotionalTone: "warm" as const,
			followUpIntent: false,
			suggestedTopics: [],
		};

		const result = validateNerinResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("accepts all valid emotional tones", () => {
		const tones = ["warm", "curious", "supportive", "encouraging"] as const;

		for (const tone of tones) {
			const response = {
				message: "Test message",
				emotionalTone: tone,
				followUpIntent: false,
				suggestedTopics: [],
			};

			const result = validateNerinResponse(response);
			expect(result._tag).toBe("Right");
			if (result._tag === "Right") {
				expect(result.right.emotionalTone).toBe(tone);
			}
		}
	});
});

describe("AnalyzerResponseSchema", () => {
	it("validates a correct analyzer response", () => {
		const validResponse = [
			{
				facet: "imagination" as const,
				evidence: "I often daydream about faraway places",
				score: 15,
				confidence: 80,
				highlightRange: { start: 10, end: 40 },
			},
		];

		const result = validateAnalyzerResponse(validResponse);
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.length).toBe(1);
			expect(result.right[0]?.facet).toBe("imagination");
			expect(result.right[0]?.score).toBe(15);
			expect(result.right[0]?.confidence).toBe(80);
		}
	});

	it("validates response with multiple facets", () => {
		const validResponse = [
			{
				facet: "imagination" as const,
				evidence: "I often daydream",
				score: 12,
				confidence: 80,
				highlightRange: { start: 0, end: 15 },
			},
			{
				facet: "orderliness" as const,
				evidence: "I keep my desk organized",
				score: 18,
				confidence: 70,
				highlightRange: { start: 20, end: 35 },
			},
		];

		const result = validateAnalyzerResponse(validResponse);
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.length).toBe(2);
		}
	});

	it("fails validation with invalid facet name", () => {
		const invalidResponse = [
			{
				facet: "invalid_facet_name" as const,
				evidence: "Test evidence",
				score: 10,
				confidence: 50,
				highlightRange: { start: 0, end: 10 },
			},
		];

		const result = validateAnalyzerResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("fails validation with confidence out of range", () => {
		const invalidResponse = [
			{
				facet: "imagination" as const,
				evidence: "Test evidence",
				score: 10,
				confidence: 150, // Should be 0-100
				highlightRange: { start: 0, end: 10 },
			},
		];

		const result = validateAnalyzerResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("fails validation with score out of range", () => {
		const invalidResponse = [
			{
				facet: "imagination" as const,
				evidence: "Test evidence",
				score: 25, // Should be 0-20
				confidence: 50,
				highlightRange: { start: 0, end: 10 },
			},
		];

		const result = validateAnalyzerResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("fails validation with invalid highlight range", () => {
		const invalidResponse = [
			{
				facet: "imagination" as const,
				evidence: "Test evidence",
				score: 10,
				confidence: 50,
				highlightRange: { start: -1, end: 10 }, // Negative start
			},
		];

		const result = validateAnalyzerResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("fails validation with end <= 0", () => {
		const invalidResponse = [
			{
				facet: "imagination" as const,
				evidence: "Test evidence",
				score: 10,
				confidence: 50,
				highlightRange: { start: 0, end: 0 }, // End must be > 0
			},
		];

		const result = validateAnalyzerResponse(invalidResponse);
		expect(result._tag).toBe("Left");
	});

	it("accepts all 30 valid facet names", () => {
		const validFacets = [
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
		] as const;

		for (const facet of validFacets) {
			const response = [
				{
					facet,
					evidence: "Test evidence",
					score: 10,
					confidence: 50,
					highlightRange: { start: 0, end: 10 },
				},
			];

			const result = validateAnalyzerResponse(response);
			expect(result._tag).toBe("Right");
		}
	});
});

describe("JSON Schema Generation", () => {
	it("generates valid JSON Schema for NerinResponse", () => {
		const jsonSchema = JSONSchema.make(NerinResponseSchema) as {
			type: string;
			properties: Record<string, unknown>;
		};

		// Verify it's a valid JSON Schema structure
		expect(jsonSchema).toBeDefined();
		expect(jsonSchema.type).toBe("object");
		expect(jsonSchema.properties).toBeDefined();
		expect(jsonSchema.properties.message).toBeDefined();
		expect(jsonSchema.properties.emotionalTone).toBeDefined();
	});

	it("generates valid JSON Schema for AnalyzerResponse", () => {
		const jsonSchema = JSONSchema.make(AnalyzerResponseSchema) as {
			type: string;
			items: unknown;
		};

		// Verify it's a valid JSON Schema structure
		expect(jsonSchema).toBeDefined();
		expect(jsonSchema.type).toBe("array");
		expect(jsonSchema.items).toBeDefined();
	});
});
