/**
 * HTTP Contracts Schema Validation Tests
 *
 * Tests Effect Schema validation for HTTP request/response contracts.
 */

import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";
import {
	GetResultsResponseSchema,
	ResumeSessionResponseSchema,
	SendMessageRequestSchema,
	SendMessageResponseSchema,
	StartAssessmentRequestSchema,
	StartAssessmentResponseSchema,
} from "../http/groups/assessment";
import { HealthCheckResponseSchema } from "../http/groups/health";

describe("Health Check Contracts", () => {
	it("should validate health check response schema", () => {
		const validResponse = {
			status: "ok" as const,
			timestamp: new Date().toISOString(), // DateTimeUtc expects ISO string
		};

		const result = S.decodeUnknownSync(HealthCheckResponseSchema)(validResponse);
		expect(result.status).toBe("ok");
		expect(result.timestamp).toBeDefined(); // DateTimeUtc decodes to DateTime.Utc, not Date
	});

	it("should reject invalid health check status", () => {
		const invalidResponse = {
			status: "error", // Invalid - only "ok" allowed
			timestamp: new Date().toISOString(),
		};

		expect(() => S.decodeUnknownSync(HealthCheckResponseSchema)(invalidResponse)).toThrow();
	});
});

describe("Assessment Contracts", () => {
	describe("StartAssessment", () => {
		it("should validate start assessment request with userId", () => {
			const validRequest = {
				userId: "user_123",
			};

			const result = S.decodeUnknownSync(StartAssessmentRequestSchema)(validRequest);
			expect(result.userId).toBe("user_123");
		});

		it("should validate start assessment request without userId", () => {
			const validRequest = {};

			const result = S.decodeUnknownSync(StartAssessmentRequestSchema)(validRequest);
			expect(result.userId).toBeUndefined();
		});

		it("should validate start assessment response schema", () => {
			const validResponse = {
				sessionId: "session_123",
				createdAt: new Date().toISOString(),
			};

			const result = S.decodeUnknownSync(StartAssessmentResponseSchema)(validResponse);
			expect(result.sessionId).toBe("session_123");
			expect(result.createdAt).toBeDefined(); // DateTimeUtc decodes to DateTime.Utc
		});

		it("should reject start assessment response with missing sessionId", () => {
			const invalidResponse = {
				createdAt: new Date().toISOString(),
			};

			expect(() => S.decodeUnknownSync(StartAssessmentResponseSchema)(invalidResponse)).toThrow();
		});
	});

	describe("SendMessage", () => {
		it("should validate send message request schema", () => {
			const validRequest = {
				sessionId: "session_123",
				message: "I enjoy outdoor activities and meeting new people.",
			};

			const result = S.decodeUnknownSync(SendMessageRequestSchema)(validRequest);
			expect(result.sessionId).toBe("session_123");
			expect(result.message).toBe("I enjoy outdoor activities and meeting new people.");
		});

		it("should reject send message request with missing fields", () => {
			const invalidRequest = {
				sessionId: "session_123",
				// message missing
			};

			expect(() => S.decodeUnknownSync(SendMessageRequestSchema)(invalidRequest)).toThrow();
		});

		it("should validate send message response schema", () => {
			const validResponse = {
				response: "That's interesting! Tell me more about what draws you to outdoor activities.",
				confidence: {
					openness: 0.75,
					conscientiousness: 0.5,
					extraversion: 0.8,
					agreeableness: 0.6,
					neuroticism: 0.3,
				},
			};

			const result = S.decodeUnknownSync(SendMessageResponseSchema)(validResponse);
			expect(result.response).toBeTruthy();
			expect(result.confidence.extraversion).toBe(0.8);
		});

		it("should reject send message response with invalid confidence values", () => {
			const invalidResponse = {
				response: "Response text",
				confidence: {
					openness: "invalid", // Should be number
					conscientiousness: 0.5,
					extraversion: 0.8,
					agreeableness: 0.6,
					neuroticism: 0.3,
				},
			};

			expect(() => S.decodeUnknownSync(SendMessageResponseSchema)(invalidResponse)).toThrow();
		});
	});

	describe("GetResults", () => {
		it("should validate get results response schema", () => {
			const validResponse = {
				oceanCode5: "ODEWR",
				oceanCode4: "ODEW",
				archetypeName: "The Adventurous Leader",
				archetypeDescription: "A bold explorer who combines curiosity with determination.",
				archetypeColor: "#6B5CE7",
				isCurated: true,
				traits: [
					{ name: "openness", score: 90, level: "H" as const, confidence: 85 },
					{ name: "conscientiousness", score: 30, level: "L" as const, confidence: 70 },
					{ name: "extraversion", score: 60, level: "M" as const, confidence: 60 },
					{ name: "agreeableness", score: 90, level: "H" as const, confidence: 75 },
					{ name: "neuroticism", score: 18, level: "L" as const, confidence: 50 },
				],
				facets: [{ name: "Imagination", traitName: "openness", score: 15, confidence: 85 }],
				overallConfidence: 68,
				personalDescription: null,
				messageCount: 24,
			};

			const result = S.decodeUnknownSync(GetResultsResponseSchema)(validResponse);
			expect(result.oceanCode5).toBe("ODEWR");
			expect(result.oceanCode4).toBe("ODEW");
			expect(result.archetypeName).toBe("The Adventurous Leader");
			expect(result.traits).toHaveLength(5);
			expect(result.traits[0]?.level).toBe("H");
			expect(result.facets).toHaveLength(1);
			expect(result.overallConfidence).toBe(68);
		});

		it("should validate get results response with non-null personalDescription", () => {
			const validResponse = {
				oceanCode5: "ODEWR",
				oceanCode4: "ODEW",
				archetypeName: "The Adventurous Leader",
				archetypeDescription: "A bold explorer who combines curiosity with determination.",
				archetypeColor: "#6B5CE7",
				isCurated: true,
				traits: [
					{ name: "openness", score: 90, level: "H" as const, confidence: 85 },
					{ name: "conscientiousness", score: 30, level: "L" as const, confidence: 70 },
					{ name: "extraversion", score: 60, level: "M" as const, confidence: 60 },
					{ name: "agreeableness", score: 90, level: "H" as const, confidence: 75 },
					{ name: "neuroticism", score: 18, level: "L" as const, confidence: 50 },
				],
				facets: [{ name: "Imagination", traitName: "openness", score: 15, confidence: 85 }],
				overallConfidence: 68,
				personalDescription:
					"You bring a rare combination of intellectual depth and curiosity to everything you do.",
				messageCount: 18,
			};

			const result = S.decodeUnknownSync(GetResultsResponseSchema)(validResponse);
			expect(result.personalDescription).toBe(
				"You bring a rare combination of intellectual depth and curiosity to everything you do.",
			);
		});

		it("should reject get results response with invalid trait level", () => {
			const invalidResponse = {
				oceanCode5: "ODEWR",
				oceanCode4: "ODEW",
				archetypeName: "Test",
				archetypeDescription: "Test",
				archetypeColor: "#000000",
				isCurated: false,
				traits: [
					{ name: "openness", score: 90, level: "X", confidence: 85 }, // Invalid level
				],
				facets: [],
				overallConfidence: 50,
				personalDescription: null,
				messageCount: 10,
			};

			expect(() => S.decodeUnknownSync(GetResultsResponseSchema)(invalidResponse)).toThrow();
		});
	});

	describe("ResumeSession", () => {
		it("should validate resume session response schema", () => {
			const validResponse = {
				messages: [
					{
						role: "user" as const,
						content: "Hello",
						timestamp: new Date().toISOString(),
					},
					{
						role: "assistant" as const,
						content: "Hi there!",
						timestamp: new Date().toISOString(),
					},
				],
				confidence: {
					openness: 0.5,
					conscientiousness: 0.5,
					extraversion: 0.5,
					agreeableness: 0.5,
					neuroticism: 0.5,
				},
			};

			const result = S.decodeUnknownSync(ResumeSessionResponseSchema)(validResponse);
			expect(result.messages).toHaveLength(2);
			expect(result.messages[0]?.role).toBe("user");
			expect(result.confidence.openness).toBe(0.5);
		});

		it("should reject resume session response with invalid message role", () => {
			const invalidResponse = {
				messages: [
					{
						role: "invalid_role", // Should be "user" or "assistant"
						content: "Hello",
						timestamp: new Date(),
					},
				],
				confidence: {
					openness: 0.5,
					conscientiousness: 0.5,
					extraversion: 0.5,
					agreeableness: 0.5,
					neuroticism: 0.5,
				},
			};

			expect(() => S.decodeUnknownSync(ResumeSessionResponseSchema)(invalidResponse)).toThrow();
		});
	});
});
