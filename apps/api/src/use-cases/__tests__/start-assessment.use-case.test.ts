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
 * - Greeting message persistence
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	GREETING_MESSAGES,
	LoggerRepository,
	OPENING_QUESTIONS,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAssessment } from "../start-assessment.use-case";

// Define mock repo objects locally with vi.fn() for spy access
const mockAssessmentSessionRepo = {
	createSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
};

const mockAssessmentMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
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

let saveMessageCallCount = 0;

describe("startAssessment Use Case", () => {
	beforeEach(() => {
		saveMessageCallCount = 0;

		// Reset mocks to default behavior before each test
		mockAssessmentSessionRepo.createSession.mockImplementation((userId?: string) =>
			Effect.succeed({
				sessionId: "session_new_789",
				userId,
				createdAt: new Date("2026-02-01T10:00:00Z"),
			}),
		);
		mockAssessmentSessionRepo.getActiveSessionByUserId.mockImplementation(() => Effect.succeed(null));
		mockAssessmentSessionRepo.getSession.mockImplementation(() => Effect.succeed(undefined));
		mockAssessmentSessionRepo.updateSession.mockImplementation(() => Effect.succeed(undefined));

		mockAssessmentMessageRepo.saveMessage.mockImplementation(
			(sessionId: string, role: string, content: string) => {
				saveMessageCallCount++;
				return Effect.succeed({
					id: `msg-${saveMessageCallCount}`,
					sessionId,
					role,
					content,
					createdAt: new Date("2026-02-01T10:00:00Z"),
				});
			},
		);
		mockAssessmentMessageRepo.getMessages.mockImplementation(() => Effect.succeed([]));
		mockAssessmentMessageRepo.getMessageCount.mockImplementation(() => Effect.succeed(0));

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
			Layer.succeed(AssessmentMessageRepository, mockAssessmentMessageRepo),
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

		it("should log session creation event with greeting count", async () => {
			const testLayer = createTestLayer();
			const input = { userId: "user_456" };

			await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Assessment session started", {
				sessionId: "session_new_789",
				userId: "user_456",
				greetingCount: 3,
			});
		});

		it("should return session ID, creation timestamp, and messages", async () => {
			const testLayer = createTestLayer();
			const beforeTime = new Date();
			const input = {};

			const result = await Effect.runPromise(startAssessment(input).pipe(Effect.provide(testLayer)));

			const afterTime = new Date();

			expect(result).toHaveProperty("sessionId");
			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("messages");
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

	describe("Greeting message persistence", () => {
		it("should save exactly 3 greeting messages to the database", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledTimes(3);
		});

		it("should save messages with role 'assistant' and correct session ID", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			for (let i = 1; i <= 3; i++) {
				const call = mockAssessmentMessageRepo.saveMessage.mock.calls[i - 1];
				expect(call[0]).toBe("session_new_789"); // sessionId
				expect(call[1]).toBe("assistant"); // role
				expect(typeof call[2]).toBe("string"); // content
			}
		});

		it("should save the 2 fixed greeting messages in order", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			const firstCall = mockAssessmentMessageRepo.saveMessage.mock.calls[0];
			const secondCall = mockAssessmentMessageRepo.saveMessage.mock.calls[1];

			expect(firstCall[2]).toBe(GREETING_MESSAGES[0]);
			expect(secondCall[2]).toBe(GREETING_MESSAGES[1]);
		});

		it("should save a 3rd message from the OPENING_QUESTIONS pool", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			const thirdCall = mockAssessmentMessageRepo.saveMessage.mock.calls[2];
			const thirdContent = thirdCall[2] as string;

			expect(OPENING_QUESTIONS).toContain(thirdContent);
		});

		it("should return 3 messages with role and content in the response", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			expect(result.messages).toHaveLength(3);
			for (const msg of result.messages) {
				expect(msg.role).toBe("assistant");
				expect(typeof msg.content).toBe("string");
				expect(msg.createdAt).toBeInstanceOf(Date);
			}
		});

		it("should return messages with content matching what was saved", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			expect(result.messages[0].content).toBe(GREETING_MESSAGES[0]);
			expect(result.messages[1].content).toBe(GREETING_MESSAGES[1]);
			expect(OPENING_QUESTIONS).toContain(result.messages[2].content);
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
				greetingCount: 3,
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
