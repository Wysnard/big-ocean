/**
 * Start Assessment Use Case Tests — startAuthenticatedAssessment
 *
 * Tests for authenticated assessment creation, existing session handling,
 * rate limiting, greeting persistence, error handling, and edge cases.
 * Uses inline spy layers (Layer.succeed with vi.fn()) for per-test control.
 */

import { GREETING_MESSAGES, OPENING_QUESTIONS } from "@workspace/domain";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAuthenticatedAssessment } from "../start-assessment.use-case";
import {
	createTestLayer,
	mockAssessmentMessageRepo,
	mockAssessmentSessionRepo,
	mockCostGuardRepo,
	mockLoggerRepo,
	setupDefaultMocks,
} from "./__fixtures__/start-assessment.fixtures";

describe("startAssessment Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
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
});
