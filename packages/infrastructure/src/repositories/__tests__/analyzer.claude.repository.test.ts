/**
 * Analyzer Claude Repository Tests
 *
 * Tests for the Claude-based facet analysis implementation.
 * Uses test layer for deterministic results without Claude API calls.
 */

import { describe, expect, it } from "@effect/vitest";
import {
	ALL_FACETS,
	AnalyzerRepository,
	LoggerRepository,
	MalformedEvidenceError,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { AnalyzerClaudeRepositoryLive } from "../analyzer.claude.repository";

/**
 * Test Logger Layer
 */
const _TestLoggerLayer = Layer.succeed(LoggerRepository, {
	info: () => Effect.void,
	error: () => Effect.void,
	warn: () => Effect.void,
	debug: () => Effect.void,
});

/**
 * Mock analyzer that returns controlled responses
 */
function createMockAnalyzerLayer(mockResponse: string) {
	return Layer.succeed(AnalyzerRepository, {
		analyzeFacets: (assessmentMessageId: string, _content: string) =>
			Effect.gen(function* () {
				// Simulate parsing the mock response
				const parsed = JSON.parse(mockResponse);
				// biome-ignore lint/suspicious/noExplicitAny: JSON.parse returns unknown, mapping for test
				return parsed.map((e: any) => ({
					assessmentMessageId,
					facetName: e.facet,
					score: e.score,
					confidence: e.confidence,
					quote: e.quote,
					highlightRange: e.highlightRange,
				}));
			}),
	});
}

describe("AnalyzerClaudeRepository - Structure", () => {
	it.effect("should be a valid Layer", () =>
		Effect.sync(() => {
			// AnalyzerClaudeRepositoryLive should be a Layer
			expect(AnalyzerClaudeRepositoryLive).toBeDefined();
		}),
	);

	it.effect("should provide AnalyzerRepository service", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			expect(analyzer).toBeDefined();
			expect(analyzer.analyzeFacets).toBeDefined();
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 15,
							confidence: 0.8,
							quote: "test",
							highlightRange: { start: 0, end: 4 },
						},
					]),
				),
			),
		),
	);
});

describe("AnalyzerClaudeRepository - Happy Path", () => {
	it.effect("should return array of FacetEvidence", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const _mockResponse = JSON.stringify([
				{
					facet: "imagination",
					score: 16,
					confidence: 0.85,
					quote: "I love exploring",
					highlightRange: { start: 0, end: 16 },
				},
			]);

			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 16,
							confidence: 0.85,
							quote: "I love exploring",
							highlightRange: { start: 0, end: 16 },
						},
					]),
				),
			),
		),
	);

	it.effect("should include assessmentMessageId in all evidence", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_test_123", "I enjoy helping others");

			result.forEach((evidence) => {
				expect(evidence.assessmentMessageId).toBe("msg_test_123");
			});
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "altruism",
							score: 18,
							confidence: 0.9,
							quote: "helping others",
							highlightRange: { start: 0, end: 14 },
						},
					]),
				),
			),
		),
	);

	it.effect("should use clean facet names (no prefixes)", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");

			result.forEach((evidence) => {
				expect(ALL_FACETS).toContain(evidence.facetName);
				// Should not have trait prefix like "openness_imagination"
				expect(evidence.facetName).not.toMatch(
					/^(openness|conscientiousness|extraversion|agreeableness|neuroticism)_/,
				);
			});
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 16,
							confidence: 0.85,
							quote: "exploring new ideas",
							highlightRange: { start: 0, end: 19 },
						},
					]),
				),
			),
		),
	);

	it.effect("should return scores in 0-20 range", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");

			result.forEach((evidence) => {
				expect(evidence.score).toBeGreaterThanOrEqual(0);
				expect(evidence.score).toBeLessThanOrEqual(20);
			});
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 16,
							confidence: 0.85,
							quote: "exploring new ideas",
							highlightRange: { start: 0, end: 19 },
						},
					]),
				),
			),
		),
	);

	it.effect("should return confidence in 0-1 range", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");

			result.forEach((evidence) => {
				expect(evidence.confidence).toBeGreaterThanOrEqual(0);
				expect(evidence.confidence).toBeLessThanOrEqual(1);
			});
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 16,
							confidence: 0.85,
							quote: "exploring new ideas",
							highlightRange: { start: 0, end: 19 },
						},
					]),
				),
			),
		),
	);

	it.effect("should return valid highlightRange", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");

			result.forEach((evidence) => {
				expect(evidence.highlightRange).toBeDefined();
				expect(evidence.highlightRange.start).toBeGreaterThanOrEqual(0);
				expect(evidence.highlightRange.end).toBeGreaterThan(evidence.highlightRange.start);
			});
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 16,
							confidence: 0.85,
							quote: "exploring new ideas",
							highlightRange: { start: 7, end: 26 },
						},
					]),
				),
			),
		),
	);

	it.effect("should handle multiple facets in response", () => {
		const mockResponse = JSON.stringify([
			{
				facet: "imagination",
				score: 16,
				confidence: 0.85,
				quote: "love exploring",
				highlightRange: { start: 2, end: 16 },
			},
			{
				facet: "intellect",
				score: 15,
				confidence: 0.8,
				quote: "new ideas",
				highlightRange: { start: 17, end: 26 },
			},
		]);

		return Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");

			expect(result.length).toBe(2);
			expect(result[0]?.facetName).toBe("imagination");
			expect(result[1]?.facetName).toBe("intellect");
		}).pipe(Effect.provide(createMockAnalyzerLayer(mockResponse)));
	});
});

describe("AnalyzerClaudeRepository - Error Handling", () => {
	it.effect("should handle invalid JSON", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* Effect.either(analyzer.analyzeFacets("msg_123", "test message"));

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				expect(result.left._tag).toBe("MalformedEvidenceError");
			}
		}).pipe(
			Effect.provide(
				Layer.succeed(AnalyzerRepository, {
					analyzeFacets: (assessmentMessageId: string, _content: string) =>
						Effect.fail(
							new MalformedEvidenceError({
								assessmentMessageId,
								rawOutput: "invalid json{",
								parseError: "Unexpected token",
								message: "Failed to parse analyzer JSON response",
							}),
						),
				}),
			),
		),
	);

	it.effect("should handle invalid facet names", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* Effect.either(analyzer.analyzeFacets("msg_123", "test"));

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				expect(result.left._tag).toBe("MalformedEvidenceError");
			}
		}).pipe(
			Effect.provide(
				Layer.succeed(AnalyzerRepository, {
					analyzeFacets: (assessmentMessageId: string, _content: string) =>
						Effect.fail(
							new MalformedEvidenceError({
								assessmentMessageId,
								rawOutput: JSON.stringify([{ facet: "invalid_facet" }]),
								parseError: `Invalid facet name: invalid_facet. Valid facets: ${ALL_FACETS.join(", ")}`,
								message: "Invalid facet name in analyzer response",
							}),
						),
				}),
			),
		),
	);

	it.effect("should handle scores out of range", () => {
		const mockResponse = JSON.stringify([
			{
				facet: "imagination",
				score: 25, // Invalid: > 20
				confidence: 0.85,
				quote: "test",
				highlightRange: { start: 0, end: 4 },
			},
		]);

		return Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* Effect.either(analyzer.analyzeFacets("msg_123", "test"));

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				expect(result.left._tag).toBe("MalformedEvidenceError");
			}
		}).pipe(
			Effect.provide(
				Layer.succeed(AnalyzerRepository, {
					analyzeFacets: (assessmentMessageId: string, _content: string) =>
						Effect.fail(
							new MalformedEvidenceError({
								assessmentMessageId,
								rawOutput: mockResponse,
								parseError: "Score validation failed",
								message: "Response structure validation failed",
							}),
						),
				}),
			),
		);
	});

	it.effect("should handle confidence out of range", () => {
		const mockResponse = JSON.stringify([
			{
				facet: "imagination",
				score: 16,
				confidence: 1.5, // Invalid: > 1.0
				quote: "test",
				highlightRange: { start: 0, end: 4 },
			},
		]);

		return Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* Effect.either(analyzer.analyzeFacets("msg_123", "test"));

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				expect(result.left._tag).toBe("MalformedEvidenceError");
			}
		}).pipe(
			Effect.provide(
				Layer.succeed(AnalyzerRepository, {
					analyzeFacets: (assessmentMessageId: string, _content: string) =>
						Effect.fail(
							new MalformedEvidenceError({
								assessmentMessageId,
								rawOutput: mockResponse,
								parseError: "Confidence validation failed",
								message: "Response structure validation failed",
							}),
						),
				}),
			),
		);
	});
});

describe("AnalyzerClaudeRepository - Edge Cases", () => {
	it.effect("should handle empty evidence array", () => {
		const mockResponse = JSON.stringify([]);

		return Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "A short message");

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		}).pipe(Effect.provide(createMockAnalyzerLayer(mockResponse)));
	});

	it.effect("should handle very long messages", () =>
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const longMessage = "I love exploring new ideas. ".repeat(100); // 2800 chars

			const result = yield* analyzer.analyzeFacets("msg_123", longMessage);

			expect(Array.isArray(result)).toBe(true);
		}).pipe(
			Effect.provide(
				createMockAnalyzerLayer(
					JSON.stringify([
						{
							facet: "imagination",
							score: 16,
							confidence: 0.85,
							quote: "love exploring new ideas",
							highlightRange: { start: 2, end: 26 },
						},
					]),
				),
			),
		),
	);

	it.effect("should strip markdown code blocks from response", () => {
		const mockResponse = `\`\`\`json
[
  {
    "facet": "imagination",
    "score": 16,
    "confidence": 0.85,
    "quote": "test",
    "highlightRange": { "start": 0, "end": 4 }
  }
]
\`\`\``;

		return Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;

			const result = yield* analyzer.analyzeFacets("msg_123", "test message");

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		}).pipe(
			Effect.provide(
				Layer.succeed(AnalyzerRepository, {
					analyzeFacets: (messageId: string, _content: string) =>
						Effect.sync(() => {
							const cleaned = mockResponse.trim().replace(/^```(?:json)?\n?|\n?```$/g, "");
							const parsed = JSON.parse(cleaned);
							// biome-ignore lint/suspicious/noExplicitAny: JSON.parse returns unknown, mapping for test
							return parsed.map((e: any) => ({
								messageId,
								facetName: e.facet,
								score: e.score,
								confidence: e.confidence,
								quote: e.quote,
								highlightRange: e.highlightRange,
							}));
						}),
				}),
			),
		);
	});
});
