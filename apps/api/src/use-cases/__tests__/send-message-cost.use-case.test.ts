/**
 * Send Message Use Case Tests — Cost tracking & rate limiting
 *
 * Story 10.6: Cost tracking, rate limiting, and budget enforcement.
 * Story 31-6: Per-session cost tracking, budget check moved to session boundary.
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { MessageRateLimitError, RedisOperationError } from "@workspace/domain";
import { Effect } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	coldStartMessages,
	createTestLayer,
	mockActorRepo,
	mockActorResponse,
	mockCostGuardRepo,
	mockLoggerRepo,
	mockMessageRepo,
	postColdStartMessages,
	setupDefaultMocks,
} from "./__fixtures__/send-message.fixtures";

describe("sendMessage Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Cost tracking & rate limiting (Story 10.6, Story 31-6)", () => {
		describe("Budget enforcement moved to session boundary (Story 31-6)", () => {
			it.effect("should NOT call checkDailyBudget during send-message (FR56/NFR18)", () =>
				Effect.gen(function* () {
					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Budget check should not happen here",
						userId: "user_456",
					});

					// Budget check no longer happens mid-session (Story 31-6)
					expect(mockCostGuardRepo.checkDailyBudget).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Cost tracking (AC #1)", () => {
			it.effect("should track Nerin + conversanalyzer cost after successful message", () =>
				Effect.gen(function* () {
					// Post-cold-start: both Nerin and conversanalyzer run
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));

					yield* sendMessage({
						sessionId: "session_test_123",
						message: "I work in tech",
						userId: "user_456",
					});

					// incrementDailyCost called with combined cost from Nerin + conversanalyzer
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"user_456",
						expect.any(Number),
					);
					const costArg = mockCostGuardRepo.incrementDailyCost.mock.calls[0][1];
					expect(costArg).toBeGreaterThan(0);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should track only Nerin cost during cold start", () =>
				Effect.gen(function* () {
					// Cold start: no conversanalyzer
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Hello",
						userId: "user_456",
					});

					// Only Nerin cost tracked (no conversanalyzer during cold start)
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"user_456",
						expect.any(Number),
					);
					const costArg = mockCostGuardRepo.incrementDailyCost.mock.calls[0][1];
					expect(costArg).toBeGreaterThan(0);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should track per-session cost via incrementSessionCost (Story 31-6)", () =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));

					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Track session cost",
						userId: "user_456",
					});

					// Per-session cost should be tracked
					expect(mockCostGuardRepo.incrementSessionCost).toHaveBeenCalledWith(
						"session_test_123",
						expect.any(Number),
					);
					const costArg = mockCostGuardRepo.incrementSessionCost.mock.calls[0][1];
					expect(costArg).toBeGreaterThan(0);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Message rate limiting (AC #3)", () => {
			it.effect("should fail with MessageRateLimitError when rate limit exceeded", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(
						Effect.fail(new MessageRateLimitError({ retryAfter: 45, message: "Too many messages" })),
					);

					const exit = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Rate limited",
						userId: "user_456",
					}).pipe(Effect.exit);

					expect(exit._tag).toBe("Failure");
					if (exit._tag === "Failure") {
						expect(String(exit.cause)).toContain("MessageRateLimitError");
					}
					expect(mockActorRepo.invoke).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Authenticated cost key", () => {
			it.effect("should use userId as cost key", () =>
				Effect.gen(function* () {
					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Authenticated message",
						userId: "user_456",
					});

					expect(mockCostGuardRepo.checkMessageRateLimit).toHaveBeenCalledWith("user_456");
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"user_456",
						expect.any(Number),
					);
					// Per-session cost always uses sessionId
					expect(mockCostGuardRepo.incrementSessionCost).toHaveBeenCalledWith(
						"session_test_123",
						expect.any(Number),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Fail-open resilience (AC #2, #4)", () => {
			it.effect("should proceed when Redis rate limit check fails", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(
						Effect.fail(new RedisOperationError("Connection refused")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis rate limit down",
						userId: "user_456",
					});

					// Fail-open: message should still proceed
					expect(result.response).toBe(mockActorResponse.response);
					expect(mockLoggerRepo.error).toHaveBeenCalledWith(
						expect.stringContaining("Redis"),
						expect.any(Object),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should proceed when Redis cost increment fails", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.incrementDailyCost.mockReturnValue(
						Effect.fail(new RedisOperationError("Write timeout")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis write fail",
						userId: "user_456",
					});

					// Fail-open: message should still succeed
					expect(result.response).toBe(mockActorResponse.response);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should proceed when Redis session cost increment fails (Story 31-6)", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.incrementSessionCost.mockReturnValue(
						Effect.fail(new RedisOperationError("Write timeout")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis session cost fail",
						userId: "user_456",
					});

					// Fail-open: message should still succeed
					expect(result.response).toBe(mockActorResponse.response);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});
	});
});
