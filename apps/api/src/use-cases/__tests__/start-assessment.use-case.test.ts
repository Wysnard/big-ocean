/**
 * Start Assessment Use Case Tests
 *
 * Tests for the startAssessment business logic.
 * Uses inline spy layers (Layer.succeed with vi.fn()) for per-test control:
 * - Session creation
 * - User ID handling
 * - Logging
 * - Response format
 * - Rate limiting
 */

import {
	AssessmentSessionRepository,
	CostGuardRepository,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAssessment } from "../start-assessment.use-case";

// Define mock repo objects locally with vi.fn() for spy access
const mockAssessmentSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
};

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockCostGuardRepo = {
	incrementDailyCost: vi.fn(),
	getDailyCost: vi.fn(),
	incrementAssessmentCount: vi.fn(),
	getAssessmentCount: vi.fn(),
	canStartAssessment: vi.fn(),
	recordAssessmentStart: vi.fn(),
};

describe("startAssessment Use Case", () => {
	beforeEach(() => {
		// Reset mocks to default behavior before each test
		mockAssessmentSessionRepo.createSession.mockImplementation((userId?: string) =>
			Effect.succeed({
				sessionId: "session_new_789",
				userId,
				createdAt: new Date("2026-02-01T10:00:00Z"),
				precision: {
					openness: 50,
					conscientiousness: 50,
					extraversion: 50,
					agreeableness: 50,
					neuroticism: 50,
				},
			}),
		);
		mockAssessmentSessionRepo.getSession.mockImplementation(() => Effect.succeed(undefined));
		mockAssessmentSessionRepo.updateSession.mockImplementation(() => Effect.succeed(undefined));

		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});

		mockCostGuardRepo.canStartAssessment.mockImplementation(() => Effect.succeed(true));
		mockCostGuardRepo.recordAssessmentStart.mockImplementation(() => Effect.succeed(undefined));
		mockCostGuardRepo.incrementDailyCost.mockImplementation(() => Effect.succeed(0));
		mockCostGuardRepo.getDailyCost.mockImplementation(() => Effect.succeed(0));
		mockCostGuardRepo.incrementAssessmentCount.mockImplementation(() => Effect.succeed(0));
		mockCostGuardRepo.getAssessmentCount.mockImplementation(() => Effect.succeed(0));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const createTestLayer = () =>
		Layer.mergeAll(
			Layer.succeed(AssessmentSessionRepository, mockAssessmentSessionRepo),
			Layer.succeed(LoggerRepository, mockLoggerRepo),
			Layer.succeed(CostGuardRepository, mockCostGuardRepo),
		);

	describe("Success scenarios", () => {
		it("should create a new assessment session", async () => {
			const testLayer = createTestLayer();
			const input = {};

			const result = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(result.sessionId).toBe("session_new_789");
			expect(result.createdAt).toBeInstanceOf(Date);
		});

		it("should create session with user ID when provided", async () => {
			const testLayer = createTestLayer();
			const input = { userId: "user_123" };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith("user_123");
		});

		it("should create session without user ID when not provided", async () => {
			const testLayer = createTestLayer();
			const input = {};

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith(undefined);
		});

		it("should log session creation event", async () => {
			const testLayer = createTestLayer();
			const input = { userId: "user_456" };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Assessment session started", {
				sessionId: "session_new_789",
				userId: "user_456",
			});
		});

		it("should return session ID and creation timestamp", async () => {
			const testLayer = createTestLayer();
			const beforeTime = new Date();
			const input = {};

			const result = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			const afterTime = new Date();

			expect(result).toHaveProperty("sessionId");
			expect(result).toHaveProperty("createdAt");
			expect(result.sessionId).toBe("session_new_789");
			expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		});

		it("should handle multiple session creations independently", async () => {
			const testLayer = createTestLayer();
			const input1 = { userId: "user_1" };
			const input2 = { userId: "user_2" };

			await Effect.runPromise(startAssessment(input1).pipe(Effect.provide(testLayer)));
			await Effect.runPromise(startAssessment(input2).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledTimes(2);
			expect(mockAssessmentSessionRepo.createSession).toHaveBeenNthCalledWith(1, "user_1");
			expect(mockAssessmentSessionRepo.createSession).toHaveBeenNthCalledWith(2, "user_2");
		});
	});

	describe("Error handling", () => {
		it("should fail when session creation fails", async () => {
			const creationError = new Error("Database connection failed");
			mockAssessmentSessionRepo.createSession.mockReturnValue(Effect.fail(creationError));

			const testLayer = createTestLayer();
			const input = {};

			await expect(
				Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer))),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle repository errors gracefully", async () => {
			const repoError = new Error("Repository unavailable");
			mockAssessmentSessionRepo.createSession.mockReturnValue(Effect.fail(repoError));

			const testLayer = createTestLayer();
			const input = { userId: "user_test" };

			await expect(
				Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer))),
			).rejects.toThrow("Repository unavailable");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty user ID string", async () => {
			const testLayer = createTestLayer();
			const input = { userId: "" };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith("");
		});

		it("should handle special characters in user ID", async () => {
			const specialUserId = "user+test@example.com";
			const testLayer = createTestLayer();
			const input = { userId: specialUserId };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith(specialUserId);
		});

		it("should handle very long user ID", async () => {
			const longUserId = "a".repeat(1000);
			const testLayer = createTestLayer();
			const input = { userId: longUserId };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith(longUserId);
		});

		it("should return current time, not repository creation time", async () => {
			const repositoryTime = new Date("2025-01-01T00:00:00Z");
			mockAssessmentSessionRepo.createSession.mockReturnValue(
				Effect.succeed({
					sessionId: "session_test_old",
					userId: undefined,
					createdAt: repositoryTime,
					precision: {
						openness: 50,
						conscientiousness: 50,
						extraversion: 50,
						agreeableness: 50,
						neuroticism: 50,
					},
				}),
			);

			const testLayer = createTestLayer();
			const beforeTime = new Date();
			const input = {};

			const result = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			const afterTime = new Date();

			expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		});
	});

	describe("Integration scenarios", () => {
		it("should create session for anonymous user", async () => {
			const testLayer = createTestLayer();
			const input = { userId: undefined };

			const result = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(result).toHaveProperty("sessionId");
			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Assessment session started", {
				sessionId: "session_new_789",
				userId: undefined,
			});
		});

		it("should be idempotent - each call creates new session", async () => {
			let callCount = 0;
			mockAssessmentSessionRepo.createSession.mockImplementation(() => {
				callCount++;
				return Effect.succeed({
					sessionId: `session_${callCount}`,
					userId: "user_test",
					createdAt: new Date(),
					precision: {
						openness: 50,
						conscientiousness: 50,
						extraversion: 50,
						agreeableness: 50,
						neuroticism: 50,
					},
				});
			});

			const testLayer = createTestLayer();
			const input = { userId: "user_test" };

			const result1 = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));
			const result2 = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(result1.sessionId).toBe("session_1");
			expect(result2.sessionId).toBe("session_2");
			expect(result1.sessionId).not.toBe(result2.sessionId);
		});
	});

	describe("Rate limiting", () => {
		it("should check rate limit before creating session for authenticated users", async () => {
			const testLayer = createTestLayer();
			const input = { userId: "user_ratelimit" };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockCostGuardRepo.canStartAssessment).toHaveBeenCalledWith("user_ratelimit");
			expect(mockCostGuardRepo.recordAssessmentStart).toHaveBeenCalledWith("user_ratelimit");
		});

		it("should fail with RateLimitExceeded when user already started assessment today", async () => {
			mockCostGuardRepo.canStartAssessment.mockReturnValue(Effect.succeed(false));

			const testLayer = createTestLayer();
			const input = { userId: "user_blocked" };

			try {
				await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));
				expect.fail("Expected RateLimitExceeded to be thrown");
			} catch (error) {
				expect(error).toHaveProperty("message", "You can start a new assessment tomorrow");
				expect(error).toHaveProperty("name");
				// biome-ignore lint/suspicious/noExplicitAny: error type narrowing in test
				expect((error as any).name).toContain("RateLimitExceeded");
			}

			expect(mockAssessmentSessionRepo.createSession).not.toHaveBeenCalled();
			expect(mockLoggerRepo.warn).toHaveBeenCalledWith("Rate limit exceeded for assessment start", {
				userId: "user_blocked",
			});
		});

		it("should skip rate limiting for anonymous users", async () => {
			const testLayer = createTestLayer();
			const input = { userId: undefined };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.recordAssessmentStart).not.toHaveBeenCalled();
			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalled();
		});

		it("should record assessment start after session created", async () => {
			const callOrder: string[] = [];

			mockAssessmentSessionRepo.createSession.mockImplementation(() => {
				callOrder.push("createSession");
				return Effect.succeed({
					sessionId: "session_order",
					userId: "user_order",
					createdAt: new Date(),
					precision: {
						openness: 50,
						conscientiousness: 50,
						extraversion: 50,
						agreeableness: 50,
						neuroticism: 50,
					},
				});
			});

			mockCostGuardRepo.recordAssessmentStart.mockImplementation(() => {
				callOrder.push("recordAssessmentStart");
				return Effect.succeed(undefined);
			});

			const testLayer = createTestLayer();
			const input = { userId: "user_order" };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(callOrder).toEqual(["createSession", "recordAssessmentStart"]);
		});
	});
});
