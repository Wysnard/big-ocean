/**
 * Orchestrator Repository Integration Tests
 *
 * Tests for the LangGraph orchestration pipeline.
 * Uses mock repositories to test:
 * - Routing to Nerin on every message
 * - Steering fields present in response
 * - Cost-aware budget pausing
 * - Deterministic routing behavior
 *
 * Story 2.11: Lean response — no facetEvidence/facetScores/traitScores in output.
 * Batch decision computed by caller from messageCount. facetScores removed from input.
 * Steering is calculated internally by the router (reads evidence from DB).
 */

import { describe, expect, it } from "@effect/vitest";
import {
	BudgetPausedError,
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
	});

	describe("Steering logic", () => {
		it.effect("includes steering fields in response", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Story 2.11: Steering is calculated internally by the router.
				// The mock uses default facet scores (no outliers), so steering is undefined.
				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "I prefer working alone.",
					messageCount: 6,
					dailyCostUsed: 20,
				});

				// Verify steering fields exist in response structure
				expect("steeringTarget" in result).toBe(true);
				expect("steeringHint" in result).toBe(true);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("returns undefined steering with default facet scores", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Mock uses default facet scores (all zero confidence) — no outliers
				const result = yield* orchestrator.processMessage({
					sessionId: "test-session",
					userMessage: "First message with no prior scores.",
					messageCount: 1,
					dailyCostUsed: 0,
				});

				expect(result.steeringTarget).toBeUndefined();
				expect(result.steeringHint).toBeUndefined();
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Cost-aware budget pausing", () => {
		it.effect("pauses assessment when approaching budget limit", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Daily cost is at 75.00, which means any new message cost will exceed budget
				// MESSAGE_COST_ESTIMATE = 0.0043, so 75 + 0.0043 = 75.0043 >= 75 triggers pause
				const error = yield* orchestrator
					.processMessage({
						sessionId: "test-session",
						userMessage: "I enjoy creative activities.",
						messageCount: 3,
						dailyCostUsed: 75.0, // Exactly at limit means next message exceeds
					})
					.pipe(Effect.flip);

				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
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
				};

				const result1 = yield* orchestrator.processMessage(input);
				const result2 = yield* orchestrator.processMessage(input);

				// Both should have same routing decisions
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

		it.effect("preserves session state after BudgetPausedError", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				// Try to process message when budget exceeded
				const error = yield* orchestrator
					.processMessage({
						sessionId: "test-session",
						userMessage: "This should fail.",
						messageCount: 3,
						dailyCostUsed: 75, // At limit
					})
					.pipe(Effect.flip);

				// Verify we got BudgetPausedError
				expect(error._tag).toBe("BudgetPausedError");
				const budgetError = error as BudgetPausedError;
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
				expect(budgetError.currentConfidence).toBeGreaterThanOrEqual(0);
				expect(budgetError.currentConfidence).toBeLessThanOrEqual(100);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("processAnalysis", () => {
		it.effect("completes without error", () =>
			Effect.gen(function* () {
				const orchestrator = yield* OrchestratorRepository;

				yield* orchestrator.processAnalysis({
					sessionId: "test-session",
					messages: [],
					messageCount: 3,
				});
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
