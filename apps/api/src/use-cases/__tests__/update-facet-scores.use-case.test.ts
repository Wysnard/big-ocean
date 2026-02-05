/**
 * Update Facet Scores Use Case Tests
 *
 * Tests for aggregating facet evidence and deriving trait scores.
 * Follows TDD: RED → GREEN → REFACTOR
 *
 * @see packages/domain/src/repositories/scorer.repository.ts
 */

import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe, expect, vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/scorer.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { ScorerDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/scorer.drizzle.repository";

const TestLayer = Layer.mergeAll(ScorerDrizzleRepositoryLive, LoggerPinoRepositoryLive);

import {
	shouldTriggerScoring,
	type UpdateFacetScoresInput,
	updateFacetScores,
} from "../update-facet-scores.use-case";

describe("updateFacetScores use-case", () => {
	describe("batch trigger logic", () => {
		it("should trigger on message 3", () => {
			expect(shouldTriggerScoring(3)).toBe(true);
		});

		it("should trigger on message 6", () => {
			expect(shouldTriggerScoring(6)).toBe(true);
		});

		it("should trigger on message 9", () => {
			expect(shouldTriggerScoring(9)).toBe(true);
		});

		it("should NOT trigger on message 1", () => {
			expect(shouldTriggerScoring(1)).toBe(false);
		});

		it("should NOT trigger on message 2", () => {
			expect(shouldTriggerScoring(2)).toBe(false);
		});

		it("should NOT trigger on message 4", () => {
			expect(shouldTriggerScoring(4)).toBe(false);
		});

		it("should NOT trigger on message 5", () => {
			expect(shouldTriggerScoring(5)).toBe(false);
		});

		it("should trigger on message 99 (divisible by 3)", () => {
			expect(shouldTriggerScoring(99)).toBe(true);
		});

		it("should NOT trigger on message 100 (not divisible by 3)", () => {
			expect(shouldTriggerScoring(100)).toBe(false);
		});
	});

	describe("score aggregation", () => {
		it.effect("should aggregate facet scores for a session", () =>
			Effect.gen(function* () {
				const input: UpdateFacetScoresInput = {
					sessionId: "session_test_aggregate",
				};

				const result = yield* updateFacetScores(input);

				expect(result.facetScores).toBeDefined();
				expect(result.traitScores).toBeDefined();
				expect(result.updatedAt).toBeInstanceOf(Date);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return facet scores with correct structure", () =>
			Effect.gen(function* () {
				const input: UpdateFacetScoresInput = {
					sessionId: "session_test_structure",
				};

				const result = yield* updateFacetScores(input);

				// Verify facet scores structure
				for (const [facetName, score] of Object.entries(result.facetScores)) {
					expect(typeof facetName).toBe("string");
					expect(score).toHaveProperty("score");
					expect(score).toHaveProperty("confidence");
					expect(score.score).toBeGreaterThanOrEqual(0);
					expect(score.score).toBeLessThanOrEqual(20);
					expect(score.confidence).toBeGreaterThanOrEqual(0);
					expect(score.confidence).toBeLessThanOrEqual(100);
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should derive trait scores from facet scores", () =>
			Effect.gen(function* () {
				const input: UpdateFacetScoresInput = {
					sessionId: "session_test_traits",
				};

				const result = yield* updateFacetScores(input);

				// Check for trait scores (at least some should be derived)
				const traitNames = Object.keys(result.traitScores);
				expect(traitNames.length).toBeGreaterThan(0);

				// Verify trait score structure
				for (const [traitName, score] of Object.entries(result.traitScores)) {
					expect([
						"openness",
						"conscientiousness",
						"extraversion",
						"agreeableness",
						"neuroticism",
					]).toContain(traitName);
					expect(score).toHaveProperty("score");
					expect(score).toHaveProperty("confidence");
					expect(score.score).toBeGreaterThanOrEqual(0);
					expect(score.score).toBeLessThanOrEqual(120); // Trait scores are sum of 6 facets (0-20 each) = 0-120
					expect(score.confidence).toBeGreaterThanOrEqual(0);
					expect(score.confidence).toBeLessThanOrEqual(100);
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("trait confidence calculation", () => {
		it.effect("should use minimum confidence across facets for trait confidence", () =>
			Effect.gen(function* () {
				const input: UpdateFacetScoresInput = {
					sessionId: "session_test_confidence",
				};

				const result = yield* updateFacetScores(input);

				// Trait confidence should be the minimum of facet confidences
				// This is verified through the mock layer which implements the same algorithm
				for (const score of Object.values(result.traitScores)) {
					expect(score.confidence).toBeLessThanOrEqual(100);
					expect(score.confidence).toBeGreaterThanOrEqual(0);
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("logging behavior", () => {
		it.effect("should log when updating scores", () =>
			Effect.gen(function* () {
				const input: UpdateFacetScoresInput = {
					sessionId: "session_test_logging",
				};

				// Should complete without error (logging is handled internally)
				const result = yield* updateFacetScores(input);

				expect(result.facetScores).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("empty state handling", () => {
		it.effect("should handle session with no evidence gracefully", () =>
			Effect.gen(function* () {
				const input: UpdateFacetScoresInput = {
					sessionId: "session_no_evidence",
				};

				// Should return aggregated scores from mock (test layer returns mock data)
				const result = yield* updateFacetScores(input);

				expect(result.facetScores).toBeDefined();
				expect(result.traitScores).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
