/**
 * Orchestrator Repository Integration Tests
 *
 * Tests for the LangGraph orchestration pipeline.
 * Uses mock repositories to test:
 * - Routing to Nerin on every message
 * - Batch trigger on every 3rd message (Analyzer + Scorer)
 * - Single-target steering via outlier detection
 * - Cost-aware budget pausing
 * - Deterministic routing behavior
 */

import { describe, expect, it } from "@effect/vitest";
import {
	BudgetPausedError,
	createInitialFacetScoresMap,
	OrchestratorRepository,
	type ProcessMessageInput,
} from "@workspace/domain";
import { Effect } from "effect";
import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/orchestrator.langgraph.repository");

import { OrchestratorLangGraphRepositoryLive } from "@workspace/infrastructure/repositories/orchestrator.langgraph.repository";

const TestLayer = OrchestratorLangGraphRepositoryLive;

describe("OrchestratorRepository", () => {
	describe("Routing behavior", () => {
		it.effect("always routes to Nerin on every message", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Hello, tell me about yourself.",
					messageCount: 1,
					dailyCostUsed: 10,
				});

				expect(result.nerinResponse).toBeDefined();
				expect(result.nerinResponse.length).toBeGreaterThan(0);
				expect(result.tokenUsage).toBeDefined();
				expect(result.tokenUsage.total).toBeGreaterThan(0);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("triggers Analyzer + Scorer on every 3rd message", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Message 3 should trigger batch processing
				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "I like to organize my day carefully.",
					messageCount: 3,
					dailyCostUsed: 10,
				});

				expect(result.nerinResponse).toBeDefined();
				// On batch message (3rd), facet evidence and scores should be returned
				expect(result.facetEvidence).toBeDefined();
				expect(result.facetScores).toBeDefined();
				expect(result.traitScores).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("does NOT trigger Analyzer on non-batch messages", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Message 2 is not a batch message (only 3, 6, 9, ... trigger batch)
				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "I enjoy reading books.",
					messageCount: 2,
					dailyCostUsed: 10,
				});

				expect(result.nerinResponse).toBeDefined();
				// Non-batch message should NOT have scoring data
				expect(result.facetEvidence).toBeUndefined();
				expect(result.facetScores).toBeUndefined();
				expect(result.traitScores).toBeUndefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("triggers batch on message 6, 9, 12...", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const input: ProcessMessageInput = {
					sessionId: "test-session",
					userMessage: "Testing batch trigger.",
					messageCount: 6,
					dailyCostUsed: 10,
				};

				const result = yield* orchestrator.processMessage(input);

				// Message 6 should trigger batch
				expect(result.facetEvidence).toBeDefined();
				expect(result.facetScores).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Steering logic (outlier detection)", () => {
		it.effect("calculates steering target via outlier detection", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Provide facet scores with clear outlier
				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "I prefer working alone.",
					messageCount: 6,
					dailyCostUsed: 20,
					facetScores: createInitialFacetScoresMap({
						imagination: { score: 14, confidence: 70 },
						orderliness: { score: 8, confidence: 20 }, // outlier (low confidence)
						altruism: { score: 13, confidence: 65 },
					}),
				});

				// orderliness has lowest confidence (0.2) and should be outlier
				expect(result.steeringTarget).toBe("orderliness");
				expect(result.steeringHint).toBeDefined();
				expect(result.steeringHint).toContain("organize");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("returns null steering when no facets assessed", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "First message with no prior scores.",
					messageCount: 1,
					dailyCostUsed: 0,
					facetScores: createInitialFacetScoresMap(), // default - no facets assessed yet
				});

				expect(result.steeringTarget).toBeUndefined();
				expect(result.steeringHint).toBeUndefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("returns null steering when facets are tightly clustered", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// All facets have IDENTICAL confidence - truly no outliers possible
				// mean = 0.60, stddev = 0, threshold = 0.60, no values below threshold
				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Balanced conversation.",
					messageCount: 3,
					dailyCostUsed: 10,
					facetScores: createInitialFacetScoresMap({
						imagination: { score: 12, confidence: 60 },
						orderliness: { score: 14, confidence: 60 },
						altruism: { score: 11, confidence: 60 },
					}),
				});

				// No outliers when all confidences are identical (stddev = 0)
				expect(result.steeringTarget).toBeUndefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("returns weakest outlier when multiple outliers exist", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Multiple weak areas.",
					messageCount: 9,
					dailyCostUsed: 15,
					facetScores: createInitialFacetScoresMap({
						imagination: { score: 16, confidence: 80 },
						orderliness: { score: 6, confidence: 15 }, // weakest outlier
						altruism: { score: 8, confidence: 25 }, // also outlier
						trust: { score: 15, confidence: 75 },
					}),
				});

				// Should return orderliness (0.15) as it's the weakest
				expect(result.steeringTarget).toBe("orderliness");
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Cost-aware budget pausing", () => {
		it.effect("pauses assessment when approaching budget limit", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Daily cost is at 75.00, which means any new message cost will exceed budget
				// MESSAGE_COST_ESTIMATE = 0.0043, so 75 + 0.0043 = 75.0043 >= 75 triggers pause
				// Create facet scores with 40 confidence (0-100 integer)
				const facetScores40 = createInitialFacetScoresMap();
				for (const key of Object.keys(facetScores40)) {
					facetScores40[key as keyof typeof facetScores40] = { score: 10, confidence: 40 };
				}
				const error = yield* orchestrator
					.processMessage({
						sessionId: "test-session",
						userMessage: "I enjoy creative activities.",
						messageCount: 3,
						dailyCostUsed: 75.0, // Exactly at limit means next message exceeds
						facetScores: facetScores40,
					})
					.pipe(Effect.flip);

				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
				expect(budgetError.currentConfidence).toBe(40); // Average of all 40 values
				expect(budgetError.sessionId).toBe("test-session");
				expect(budgetError.resumeAfter).toBeDefined();
				expect(budgetError.message).toContain("saved");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("processes normally when budget available", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Budget is available.",
					messageCount: 1,
					dailyCostUsed: 10, // Well under $75 limit
				});

				expect(result.nerinResponse).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("BudgetPausedError has resumeAfter as next day midnight UTC", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Use dailyCostUsed = 75.0 so that 75.0 + 0.0043 > 75 triggers budget pause
				const error = yield* orchestrator
					.processMessage({
						sessionId: "test-session",
						userMessage: "Check resume timestamp.",
						messageCount: 1,
						dailyCostUsed: 75.0,
					})
					.pipe(Effect.flip);

				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
				const resumeDate = budgetError.resumeAfter;

				// Should be next day
				const now = new Date();
				expect(resumeDate.getUTCDate()).toBeGreaterThanOrEqual(now.getUTCDate());

				// Should be midnight UTC
				expect(resumeDate.getUTCHours()).toBe(0);
				expect(resumeDate.getUTCMinutes()).toBe(0);
				expect(resumeDate.getUTCSeconds()).toBe(0);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Deterministic behavior", () => {
		it.effect("is deterministic (same input produces same routing)", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const input: ProcessMessageInput = {
					sessionId: "test-session",
					userMessage: "I prefer working alone.",
					messageCount: 6,
					dailyCostUsed: 20,
					facetScores: createInitialFacetScoresMap({
						imagination: { score: 14, confidence: 70 },
						orderliness: { score: 8, confidence: 20 },
					}),
				};

				const result1 = yield* orchestrator.processMessage(input);
				const result2 = yield* orchestrator.processMessage(input);

				// Both should have same routing decisions
				expect(!!result1.facetEvidence).toBe(!!result2.facetEvidence);
				expect(result1.steeringTarget).toBe(result2.steeringTarget);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("State persistence", () => {
		it.effect("returns cost incurred for tracking", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Track my cost.",
					messageCount: 1,
					dailyCostUsed: 10,
				});

				expect(result.costIncurred).toBeDefined();
				expect(result.costIncurred).toBeGreaterThan(0);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("returns updated confidence after batch scoring", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Batch message with scoring.",
					messageCount: 3, // Batch trigger
					dailyCostUsed: 10,
				});

				// After batch scoring, facet scores should be updated
				// (test layer should return a value)
				expect(result.facetScores).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("preserves session state after BudgetPausedError", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Set up initial state with scoring data - all facets at confidence 50
				const initialFacetScores = createInitialFacetScoresMap();
				for (const key of Object.keys(initialFacetScores)) {
					initialFacetScores[key as keyof typeof initialFacetScores] = { score: 10, confidence: 50 };
				}

				// Try to process message when budget exceeded
				const error = yield* orchestrator
					.processMessage({
						sessionId: "test-session",
						userMessage: "This should fail.",
						messageCount: 3,
						dailyCostUsed: 75, // At limit
						facetScores: initialFacetScores,
					})
					.pipe(Effect.flip);

				// Verify we got BudgetPausedError
				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
				// State should be preserved - confidence passed back in error
				expect(budgetError.currentConfidence).toBe(50); // Average of all 50 values
				expect(budgetError.sessionId).toBe("test-session");
				// Resume timestamp should be set
				expect(budgetError.resumeAfter).toBeInstanceOf(Date);
			}).pipe(Effect.provide(TestLayer)),
		);

		/**
		 * Note: Full state persistence across multiple invocations requires
		 * PostgresSaver integration (real database). This test verifies the
		 * mock layer returns consistent data structure for chained calls.
		 *
		 * For real DB persistence tests, see: apps/api/tests/integration/
		 */
		it.effect("returns consistent state structure across multiple calls (mock layer)", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// First message (non-batch)
				const result1 = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "First message.",
					messageCount: 1,
					dailyCostUsed: 0,
				});

				// Second message (non-batch)
				const result2 = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Second message.",
					messageCount: 2,
					dailyCostUsed: result1.costIncurred,
				});

				// Third message (batch trigger)
				const result3 = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "Third message.",
					messageCount: 3,
					dailyCostUsed: result1.costIncurred + result2.costIncurred,
				});

				// All should have Nerin response
				expect(result1.nerinResponse).toBeDefined();
				expect(result2.nerinResponse).toBeDefined();
				expect(result3.nerinResponse).toBeDefined();

				// Only third (batch) should have scoring data
				expect(result1.facetEvidence).toBeUndefined();
				expect(result2.facetEvidence).toBeUndefined();
				expect(result3.facetEvidence).toBeDefined();
				expect(result3.traitScores).toBeDefined();

				// Cost should be consistent
				expect(result1.costIncurred).toBeGreaterThan(0);
				expect(result2.costIncurred).toBeGreaterThan(0);
				expect(result3.costIncurred).toBeGreaterThan(0);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Error handling", () => {
		it.effect("propagates BudgetPausedError through Effect.fail chain", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Set dailyCostUsed to just under limit
				const error = yield* orchestrator
					.processMessage({
						sessionId: "budget-test-session",
						userMessage: "This should trigger budget pause",
						messageCount: 1,
						dailyCostUsed: 74.998, // Just over limit after MESSAGE_COST_ESTIMATE
					})
					.pipe(Effect.flip);

				// Should fail with BudgetPausedError
				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
				expect(budgetError.sessionId).toBe("budget-test-session");
				expect(budgetError.currentConfidence).toBeDefined();
				expect(budgetError.resumeAfter).toBeInstanceOf(Date);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("handles orchestration failure gracefully", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Test with invalid input that might cause graph invocation failure
				// Note: Current mock implementation doesn't simulate failures,
				// but this test documents expected behavior for production errors
				const result = yield* orchestrator.processMessage({
					sessionId: "error-test-session",
					userMessage: "", // Empty message
					messageCount: 1,
					dailyCostUsed: 0,
				});

				// Should succeed with mock implementation
				// In production, empty messages would be handled by validation
				expect(result.nerinResponse).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("maintains state consistency after BudgetPausedError", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// First message succeeds
				const result1 = yield* orchestrator.processMessage({
					sessionId: "consistency-test",
					userMessage: "First message",
					messageCount: 1,
					dailyCostUsed: 10,
				});

				expect(result1.nerinResponse).toBeDefined();

				// Second message triggers budget pause
				const error = yield* orchestrator
					.processMessage({
						sessionId: "consistency-test",
						userMessage: "Second message",
						messageCount: 2,
						dailyCostUsed: 74.998, // Over limit
					})
					.pipe(Effect.flip);

				// Should fail with budget error
				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
				// Precision should be preserved in error
				expect(budgetError.currentConfidence).toBeGreaterThanOrEqual(0);
				expect(budgetError.currentConfidence).toBeLessThanOrEqual(100);
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
