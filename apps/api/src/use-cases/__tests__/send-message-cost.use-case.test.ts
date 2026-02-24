/**
 * Send Message Use Case Tests — Cost tracking & rate limiting
 *
 * Story 10.6: Cost tracking, rate limiting, and budget enforcement.
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { CostLimitExceeded, MessageRateLimitError, RedisOperationError } from "@workspace/domain";
import { Cause, DateTime, Effect, Option } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	coldStartMessages,
	createTestLayer,
	mockCostGuardRepo,
	mockLoggerRepo,
	mockMessageRepo,
	mockNerinRepo,
	mockNerinResponse,
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

	describe("Cost tracking & rate limiting (Story 10.6)", () => {
		describe("Budget enforcement (AC #2)", () => {
			it.effect("should proceed when daily budget check passes", () =>
				Effect.gen(function* () {
					// checkDailyBudget returns void (passes) by default in beforeEach

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Budget check pass",
						userId: "user_456",
					});

					expect(result.response).toBe(mockNerinResponse.response);
					expect(mockCostGuardRepo.checkDailyBudget).toHaveBeenCalledWith("user_456", 7500);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should fail with CostLimitExceeded when daily cost at limit", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkDailyBudget.mockReturnValue(
						Effect.fail(
							new CostLimitExceeded({
								dailySpend: 7500,
								limit: 7500,
								resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-24T00:00:00Z")),
								message: "Daily cost limit exceeded",
							}),
						),
					);

					const exit = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Over budget",
						userId: "user_456",
					}).pipe(Effect.exit);

					expect(exit._tag).toBe("Failure");
					if (exit._tag === "Failure") {
						expect(String(exit.cause)).toContain("CostLimitExceeded");
					}
					// No side effects after budget check failure
					expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should fail with CostLimitExceeded including correct resumeAfter", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkDailyBudget.mockReturnValue(
						Effect.fail(
							new CostLimitExceeded({
								dailySpend: 7500,
								limit: 7500,
								resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-24T00:00:00Z")),
								message: "Daily cost limit exceeded",
							}),
						),
					);

					const exit = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Over budget",
						userId: "user_456",
					}).pipe(Effect.exit);

					expect(exit._tag).toBe("Failure");
					if (exit._tag === "Failure") {
						const failure = Cause.failureOption(exit.cause);
						expect(Option.isSome(failure)).toBe(true);
						if (Option.isSome(failure)) {
							const error = failure.value as CostLimitExceeded;
							expect(error.resumeAfter).toBeDefined();
						}
					}
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
					expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Anonymous cost key (AC #6)", () => {
			it.effect("should use sessionId as cost key when userId is undefined", () =>
				Effect.gen(function* () {
					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Anonymous message",
						// No userId — anonymous
					});

					// Should use sessionId as cost key for anonymous users
					expect(mockCostGuardRepo.checkDailyBudget).toHaveBeenCalledWith("session_test_123", 7500);
					expect(mockCostGuardRepo.checkMessageRateLimit).toHaveBeenCalledWith("session_test_123");
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"session_test_123",
						expect.any(Number),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Fail-open resilience (AC #2, #4)", () => {
			it.effect("should proceed when Redis budget check fails", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkDailyBudget.mockReturnValue(
						Effect.fail(new RedisOperationError("Connection refused")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis down",
						userId: "user_456",
					});

					// Fail-open: message should still proceed
					expect(result.response).toBe(mockNerinResponse.response);
					expect(mockLoggerRepo.error).toHaveBeenCalledWith(
						expect.stringContaining("Redis"),
						expect.any(Object),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);

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
					expect(result.response).toBe(mockNerinResponse.response);
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
					expect(result.response).toBe(mockNerinResponse.response);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});
	});
});
