/**
 * Start Assessment Use Case Tests
 *
 * Tests for startAuthenticatedAssessment, startAnonymousAssessment, and
 * the backward-compat startAssessment wrapper.
 * Uses inline spy layers (Layer.succeed with vi.fn()) for per-test control.
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
import {
	startAnonymousAssessment,
	startAssessment,
	startAuthenticatedAssessment,
} from "../start-assessment.use-case";

// Define mock repo objects locally with vi.fn() for spy access
const mockAssessmentSessionRepo = {
	createSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	findByToken: vi.fn(),
	assignUserId: vi.fn(),
	rotateToken: vi.fn(),
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

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockAssessmentSessionRepo),
		Layer.succeed(AssessmentMessageRepository, mockAssessmentMessageRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
	);

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
		mockAssessmentSessionRepo.getSessionsByUserId.mockImplementation(() => Effect.succeed([]));
		mockAssessmentSessionRepo.findSessionByUserId.mockImplementation(() => Effect.succeed(null));
		mockAssessmentSessionRepo.getSession.mockImplementation(() => Effect.succeed(undefined));
		mockAssessmentSessionRepo.updateSession.mockImplementation(() => Effect.succeed(undefined));
		mockAssessmentSessionRepo.createAnonymousSession.mockImplementation(() =>
			Effect.succeed({
				sessionId: "session_anon_123",
				sessionToken: "mock_token_abc123def456",
			}),
		);
		mockAssessmentSessionRepo.findByToken.mockImplementation(() => Effect.succeed(null));
		mockAssessmentSessionRepo.assignUserId.mockImplementation(() => Effect.succeed(undefined));
		mockAssessmentSessionRepo.rotateToken.mockImplementation(() =>
			Effect.succeed({ sessionToken: "new_token" }),
		);

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

	describe("startAuthenticatedAssessment", () => {
		it("should create a new assessment session with userId", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_123" }).pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_new_789");
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith("user_123");
		});

		it("should log session creation event with greeting count", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_456" }).pipe(Effect.provide(testLayer)),
			);

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Assessment session started", {
				sessionId: "session_new_789",
				userId: "user_456",
				greetingCount: 2,
			});
		});

		it("should return session ID, creation timestamp, and messages", async () => {
			const testLayer = createTestLayer();
			const beforeTime = new Date();

			const result = await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_test" }).pipe(Effect.provide(testLayer)),
			);

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

			await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_1" }).pipe(Effect.provide(testLayer)),
			);
			await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_2" }).pipe(Effect.provide(testLayer)),
			);

			expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledTimes(2);
			expect(mockAssessmentSessionRepo.createSession).toHaveBeenNthCalledWith(1, "user_1");
			expect(mockAssessmentSessionRepo.createSession).toHaveBeenNthCalledWith(2, "user_2");
		});

		describe("Existing session handling", () => {
			it("should return existing active session instead of creating new one", async () => {
				mockAssessmentSessionRepo.findSessionByUserId.mockReturnValue(
					Effect.succeed({
						id: "session_active",
						createdAt: new Date("2026-02-01T10:00:00Z"),
						updatedAt: new Date("2026-02-01T10:00:00Z"),
						status: "active",
						messageCount: 3,
						oceanCode5: null,
						archetypeName: null,
					}),
				);

				mockAssessmentMessageRepo.getMessages.mockReturnValue(
					Effect.succeed([
						{
							id: "msg-1",
							sessionId: "session_active",
							role: "assistant",
							content: "Hello!",
							createdAt: new Date("2026-02-01T10:00:00Z"),
						},
					]),
				);

				const testLayer = createTestLayer();

				const result = await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_resuming" }).pipe(Effect.provide(testLayer)),
				);

				expect(result.sessionId).toBe("session_active");
				expect(result.messages).toHaveLength(1);
				expect(mockAssessmentSessionRepo.createSession).not.toHaveBeenCalled();
			});

			it("should block new assessment when user has a finalizing session (Story 11.1)", async () => {
				mockAssessmentSessionRepo.findSessionByUserId.mockReturnValue(
					Effect.succeed({
						id: "session_finalizing",
						createdAt: new Date("2026-02-01T10:00:00Z"),
						updatedAt: new Date("2026-02-01T10:00:00Z"),
						status: "finalizing",
						messageCount: 25,
						oceanCode5: null,
						archetypeName: null,
					}),
				);

				const testLayer = createTestLayer();

				try {
					await Effect.runPromise(
						startAuthenticatedAssessment({ userId: "user_finalizing" }).pipe(Effect.provide(testLayer)),
					);
					expect.fail("Expected AssessmentAlreadyExists to be thrown");
				} catch (error) {
					expect(error).toHaveProperty(
						"message",
						"You already have an assessment. Only one assessment per account is allowed.",
					);
					// biome-ignore lint/suspicious/noExplicitAny: error type narrowing in test
					expect((error as any).name).toContain("AssessmentAlreadyExists");
				}

				expect(mockAssessmentSessionRepo.createSession).not.toHaveBeenCalled();
			});

			it("should block new assessment when user has a completed session", async () => {
				mockAssessmentSessionRepo.findSessionByUserId.mockReturnValue(
					Effect.succeed({
						id: "session_completed",
						createdAt: new Date("2026-02-01T10:00:00Z"),
						updatedAt: new Date("2026-02-01T10:00:00Z"),
						status: "completed",
						messageCount: 12,
						oceanCode5: "ODANT",
						archetypeName: null,
					}),
				);

				const testLayer = createTestLayer();

				try {
					await Effect.runPromise(
						startAuthenticatedAssessment({ userId: "user_with_assessment" }).pipe(
							Effect.provide(testLayer),
						),
					);
					expect.fail("Expected AssessmentAlreadyExists to be thrown");
				} catch (error) {
					expect(error).toHaveProperty(
						"message",
						"You already have an assessment. Only one assessment per account is allowed.",
					);
					// biome-ignore lint/suspicious/noExplicitAny: error type narrowing in test
					expect((error as any).name).toContain("AssessmentAlreadyExists");
				}

				expect(mockAssessmentSessionRepo.createSession).not.toHaveBeenCalled();
			});
		});

		describe("Rate limiting", () => {
			it("should check rate limit before creating session", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_ratelimit" }).pipe(Effect.provide(testLayer)),
				);

				expect(mockCostGuardRepo.canStartAssessment).toHaveBeenCalledWith("user_ratelimit");
				expect(mockCostGuardRepo.recordAssessmentStart).toHaveBeenCalledWith("user_ratelimit");
			});

			it("should fail with RateLimitExceeded when user already started assessment today", async () => {
				mockCostGuardRepo.canStartAssessment.mockReturnValue(Effect.succeed(false));

				const testLayer = createTestLayer();

				try {
					await Effect.runPromise(
						startAuthenticatedAssessment({ userId: "user_blocked" }).pipe(Effect.provide(testLayer)),
					);
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

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_order" }).pipe(Effect.provide(testLayer)),
				);

				expect(callOrder).toEqual(["createSession", "recordAssessmentStart"]);
			});
		});

		describe("Greeting message persistence", () => {
			it("should save exactly 2 greeting messages to the database", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_greet" }).pipe(Effect.provide(testLayer)),
				);

				expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledTimes(2);
			});

			it("should save messages with role 'assistant' and correct session ID", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_msg" }).pipe(Effect.provide(testLayer)),
				);

				for (let i = 1; i <= 2; i++) {
					const call = mockAssessmentMessageRepo.saveMessage.mock.calls[i - 1];
					expect(call[0]).toBe("session_new_789"); // sessionId
					expect(call[1]).toBe("assistant"); // role
					expect(typeof call[2]).toBe("string"); // content
				}
			});

			it("should save the fixed greeting message and opening question in order", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_fixed" }).pipe(Effect.provide(testLayer)),
				);

				const firstCall = mockAssessmentMessageRepo.saveMessage.mock.calls[0];
				const secondCall = mockAssessmentMessageRepo.saveMessage.mock.calls[1];

				expect(firstCall[2]).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(secondCall[2]);
			});

			it("should return 2 messages with role and content in the response", async () => {
				const testLayer = createTestLayer();

				const result = await Effect.runPromise(
					startAuthenticatedAssessment({ userId: "user_resp" }).pipe(Effect.provide(testLayer)),
				);

				expect(result.messages).toHaveLength(2);
				for (const msg of result.messages) {
					expect(msg.role).toBe("assistant");
					expect(typeof msg.content).toBe("string");
					expect(msg.createdAt).toBeInstanceOf(Date);
				}
			});
		});

		describe("Error handling", () => {
			it("should fail when session creation fails", async () => {
				const creationError = new Error("Database connection failed");
				mockAssessmentSessionRepo.createSession.mockReturnValue(Effect.fail(creationError));

				const testLayer = createTestLayer();

				await expect(
					Effect.runPromise(
						startAuthenticatedAssessment({ userId: "user_err" }).pipe(Effect.provide(testLayer)),
					),
				).rejects.toThrow("Database connection failed");
			});

			it("should handle repository errors gracefully", async () => {
				const repoError = new Error("Repository unavailable");
				mockAssessmentSessionRepo.createSession.mockReturnValue(Effect.fail(repoError));

				const testLayer = createTestLayer();

				await expect(
					Effect.runPromise(
						startAuthenticatedAssessment({ userId: "user_test" }).pipe(Effect.provide(testLayer)),
					),
				).rejects.toThrow("Repository unavailable");
			});
		});

		describe("Edge cases", () => {
			it("should handle special characters in user ID", async () => {
				const specialUserId = "user+test@example.com";
				const testLayer = createTestLayer();

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: specialUserId }).pipe(Effect.provide(testLayer)),
				);

				expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith(specialUserId);
			});

			it("should handle very long user ID", async () => {
				const longUserId = "a".repeat(1000);
				const testLayer = createTestLayer();

				await Effect.runPromise(
					startAuthenticatedAssessment({ userId: longUserId }).pipe(Effect.provide(testLayer)),
				);

				expect(mockAssessmentSessionRepo.createSession).toHaveBeenCalledWith(longUserId);
			});
		});
	});

	describe("startAnonymousAssessment", () => {
		it("should create an anonymous session with token", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAnonymousAssessment().pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_anon_123");
			expect(result.sessionToken).toBe("mock_token_abc123def456");
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(mockAssessmentSessionRepo.createAnonymousSession).toHaveBeenCalled();
		});

		it("should not call CostGuard at all", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.recordAssessmentStart).not.toHaveBeenCalled();
		});

		it("should not check for existing sessions", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.findSessionByUserId).not.toHaveBeenCalled();
		});

		it("should log anonymous session creation", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Anonymous assessment started", {
				sessionId: "session_anon_123",
				greetingCount: 2,
			});
		});

		describe("Greeting message persistence", () => {
			it("should save exactly 2 greeting messages to the database", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

				expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledTimes(2);
			});

			it("should save the fixed greeting message and opening question in order", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

				const firstCall = mockAssessmentMessageRepo.saveMessage.mock.calls[0];
				const secondCall = mockAssessmentMessageRepo.saveMessage.mock.calls[1];

				expect(firstCall[2]).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(secondCall[2]);
			});

			it("should return 2 messages with role and content in the response", async () => {
				const testLayer = createTestLayer();

				const result = await Effect.runPromise(
					startAnonymousAssessment().pipe(Effect.provide(testLayer)),
				);

				expect(result.messages).toHaveLength(2);
				for (const msg of result.messages) {
					expect(msg.role).toBe("assistant");
					expect(typeof msg.content).toBe("string");
					expect(msg.createdAt).toBeInstanceOf(Date);
				}
			});

			it("should return messages with content matching what was saved", async () => {
				const testLayer = createTestLayer();

				const result = await Effect.runPromise(
					startAnonymousAssessment().pipe(Effect.provide(testLayer)),
				);

				expect(result.messages[0].content).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(result.messages[1].content);
			});
		});

		describe("Error handling", () => {
			it("should fail when anonymous session creation fails", async () => {
				const creationError = new Error("Database connection failed");
				mockAssessmentSessionRepo.createAnonymousSession.mockReturnValue(Effect.fail(creationError));

				const testLayer = createTestLayer();

				await expect(
					Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer))),
				).rejects.toThrow("Database connection failed");
			});
		});
	});

	describe("startAssessment wrapper", () => {
		it("should dispatch to authenticated path when userId is provided", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAssessment({ userId: "user_wrapper" }).pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_new_789");
			expect(mockAssessmentSessionRepo.findSessionByUserId).toHaveBeenCalledWith("user_wrapper");
			expect(mockCostGuardRepo.canStartAssessment).toHaveBeenCalledWith("user_wrapper");
		});

		it("should dispatch to anonymous path when userId is undefined", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAssessment({ userId: undefined }).pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_anon_123");
			expect(mockAssessmentSessionRepo.findSessionByUserId).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
		});

		it("should dispatch to anonymous path when no userId key", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			expect(result.sessionId).toBe("session_anon_123");
			expect(mockAssessmentSessionRepo.findSessionByUserId).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
		});

		it("should return current time, not repository creation time", async () => {
			const testLayer = createTestLayer();
			const beforeTime = new Date();

			const result = await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			const afterTime = new Date();

			expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		});
	});
});
