/**
 * Send Message Use Case Tests
 *
 * Story 9.2: Rewritten test suite for the new sequential Effect pipeline.
 * Tests direct Nerin invocation, dual auth, isFinalTurn threshold,
 * session status guard, and message_count increment.
 *
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	AgentInvocationError,
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	NerinAgentRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { sendMessage } from "../send-message.use-case";

// Mock repo objects with vi.fn() for spy access
const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	findByToken: vi.fn(),
	assignUserId: vi.fn(),
	rotateToken: vi.fn(),
	incrementMessageCount: vi.fn(),
};

const mockMessageRepo = {
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

const mockNerinRepo = {
	invoke: vi.fn(),
};

// Mock data
const mockActiveSession = {
	id: "session_test_123",
	userId: null,
	sessionToken: "mock_token",
	createdAt: new Date("2026-02-01"),
	updatedAt: new Date("2026-02-01"),
	status: "active",
	messageCount: 0,
	finalizationProgress: null,
	personalDescription: null,
};

const mockMessages = [
	{
		id: "msg_1",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Hi! I'm Nerin.",
		createdAt: new Date(),
	},
	{
		id: "msg_2",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "What brings you here today?",
		createdAt: new Date(),
	},
	{
		id: "msg_3",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "Tell me about yourself",
		createdAt: new Date(),
	},
];

const mockNerinResponse = {
	response: "I help you explore your personality through conversation.",
	tokenCount: { input: 150, output: 80, total: 230 },
};

/** Matches production default in app-config.live.ts */
const MESSAGE_THRESHOLD = 25;

describe("sendMessage Use Case (Story 9.2)", () => {
	beforeEach(() => {
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockActiveSession));
		mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(1));

		mockMessageRepo.saveMessage.mockReturnValue(Effect.succeed(undefined));
		mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(mockMessages));

		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});

		mockNerinRepo.invoke.mockReturnValue(Effect.succeed(mockNerinResponse));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const createTestLayer = () =>
		Layer.mergeAll(
			Layer.succeed(AppConfig, {
				databaseUrl: "postgres://test:test@localhost:5432/test",
				redisUrl: "redis://localhost:6379",
				anthropicApiKey: Redacted.make("test-key"),
				betterAuthSecret: Redacted.make("test-secret"),
				betterAuthUrl: "http://localhost:4000",
				frontendUrl: "http://localhost:3000",
				port: 4000,
				nodeEnv: "test",
				analyzerModelId: "claude-sonnet-4-20250514",
				analyzerMaxTokens: 2048,
				analyzerTemperature: 0.3,
				portraitModelId: "claude-sonnet-4-20250514",
				portraitMaxTokens: 4096,
				portraitTemperature: 0.5,
				nerinModelId: "claude-haiku-4-5-20251001",
				nerinMaxTokens: 1024,
				nerinTemperature: 0.7,
				dailyCostLimit: 75,
				freeTierMessageThreshold: 25,
				portraitWaitMinMs: 2000,
				shareMinConfidence: 70,
				messageThreshold: MESSAGE_THRESHOLD,
				conversanalyzerModelId: "claude-haiku-4-5-20251001",
				finanalyzerModelId: "claude-sonnet-4-20250514",
				portraitGeneratorModelId: "claude-sonnet-4-20250514",
			}),
			Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
			Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
			Layer.succeed(LoggerRepository, mockLoggerRepo),
			Layer.succeed(NerinAgentRepository, mockNerinRepo),
		);

	describe("Success scenarios (AC: #1, #2, #3)", () => {
		it.effect("should send a message and get Nerin response", () =>
			Effect.gen(function* () {
				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "What do you do?",
				});

				expect(result).toEqual({
					response: mockNerinResponse.response,
					isFinalTurn: false,
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save user message to repository", () =>
			Effect.gen(function* () {
				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Tell me something",
					userId: "user_456",
				});

				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"user",
					"Tell me something",
					"user_456",
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save assistant message with response content (AC: #1)", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"assistant",
					mockNerinResponse.response,
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should invoke Nerin with correct message history (AC: #2)", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockNerinRepo.invoke).toHaveBeenCalledWith({
					sessionId: "session_test_123",
					messages: mockMessages.map((m) => ({
						id: m.id,
						role: m.role,
						content: m.content,
					})),
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should increment message_count atomically (AC: #1)", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockSessionRepo.incrementMessageCount).toHaveBeenCalledWith("session_test_123");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should log message received and processed events", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test message" });

				expect(mockLoggerRepo.info).toHaveBeenCalledWith("Message received", {
					sessionId: "session_test_123",
					messageLength: 12,
				});

				expect(mockLoggerRepo.info).toHaveBeenCalledWith(
					"Message processed",
					expect.objectContaining({
						sessionId: "session_test_123",
						responseLength: mockNerinResponse.response.length,
						isFinalTurn: false,
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Anonymous session access (AC: #4)", () => {
		it.effect("should allow anonymous session access (no userId on session)", () =>
			Effect.gen(function* () {
				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Anonymous",
				});

				expect(result.response).toBeDefined();
				expect(mockNerinRepo.invoke).toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Ownership guard (AC: #5)", () => {
		it.effect("should allow linked session owner to send messages", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, userId: "owner_user" }),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Owner message",
					userId: "owner_user",
				});

				expect(result.response).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should deny non-owner access before side effects", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, userId: "owner_user" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Unauthorized",
					userId: "different_user",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					const error = exit.cause;
					expect(String(error)).toContain("SessionNotFound");
				}
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should deny unauthenticated access to linked sessions", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, userId: "owner_user" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "No user",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Session status guard", () => {
		it.effect("should reject messages to completed sessions", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, status: "completed" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionCompletedError");
				}
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should reject messages to finalizing sessions", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, status: "finalizing" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionCompletedError");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("isFinalTurn threshold (AC: #3, #6)", () => {
		it.effect("should return isFinalTurn: true when message_count >= MESSAGE_THRESHOLD", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(MESSAGE_THRESHOLD));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Message at threshold",
				});

				expect(result.isFinalTurn).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return isFinalTurn: false when below threshold", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(MESSAGE_THRESHOLD - 1));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Normal message",
				});

				expect(result.isFinalTurn).toBe(false);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should still call Nerin on final turn (soft threshold)", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(MESSAGE_THRESHOLD));

				yield* sendMessage({ sessionId: "session_test_123", message: "Final msg" });

				expect(mockNerinRepo.invoke).toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return isFinalTurn: true when above threshold (can still continue)", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(MESSAGE_THRESHOLD + 5));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Past threshold",
				});

				expect(result.isFinalTurn).toBe(true);
				expect(result.response).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Error handling", () => {
		it.effect("should fail when session not found", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.fail({
						_tag: "SessionNotFound",
						sessionId: "nonexistent",
						message: "Session 'nonexistent' not found",
					}),
				);

				const exit = yield* sendMessage({
					sessionId: "nonexistent",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should handle Nerin invocation failure", () =>
			Effect.gen(function* () {
				mockNerinRepo.invoke.mockReturnValue(
					Effect.fail(
						new AgentInvocationError({
							agentName: "Nerin",
							sessionId: "session_test_123",
							message: "Claude API error",
						}),
					),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("AgentInvocationError");
				}
				expect(mockLoggerRepo.error).toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should handle message save failure", () =>
			Effect.gen(function* () {
				mockMessageRepo.saveMessage.mockReturnValue(
					Effect.fail({ _tag: "DatabaseError", message: "DB write failed" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("DatabaseError");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Edge cases", () => {
		it.effect("should handle empty message history", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed([]));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "First message",
				});

				expect(result.response).toBeDefined();
				expect(mockNerinRepo.invoke).toHaveBeenCalledWith({
					sessionId: "session_test_123",
					messages: [],
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should handle very long messages", () =>
			Effect.gen(function* () {
				const longMessage = "a".repeat(5000);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: longMessage,
				});

				expect(result.response).toBeDefined();
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"user",
					longMessage,
					undefined,
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
