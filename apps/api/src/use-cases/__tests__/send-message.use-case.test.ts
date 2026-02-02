/**
 * Send Message Use Case Tests
 *
 * Tests for the sendMessage business logic.
 * Uses mock repositories to test:
 * - Session validation
 * - Message persistence
 * - Nerin agent invocation
 * - Precision score handling
 * - Error handling
 */

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	NerinAgentRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
// @biome-ignore lint/style/useImportType: vitest imports needed at runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "../send-message.use-case";

// Mock data factories
const mockSession = {
	sessionId: "session_test_123",
	userId: "user_456",
	createdAt: new Date("2026-02-01"),
	precision: {
		openness: 50,
		conscientiousness: 50,
		extraversion: 50,
		agreeableness: 50,
		neuroticism: 50,
	},
};

const mockMessages = [
	{
		id: "msg_1",
		sessionId: "session_test_123",
		role: "user",
		content: "Tell me about yourself",
		createdAt: new Date(),
	},
	{
		id: "msg_2",
		sessionId: "session_test_123",
		role: "assistant",
		content: "Hi! I'm Nerin, nice to meet you.",
		createdAt: new Date(),
	},
	{
		id: "msg_3",
		sessionId: "session_test_123",
		role: "user",
		content: "What do you do?",
		createdAt: new Date(),
	},
];

const mockNerinResponse = {
	response: "I help you explore your personality through conversation.",
	tokenCount: {
		input: 150,
		output: 80,
		total: 230,
	},
};

describe("sendMessage Use Case", () => {
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockSessionRepo: any;
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockMessageRepo: any;
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockLogger: any;
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockNerinAgent: any;

	beforeEach(() => {
		// Session Repository mock
		mockSessionRepo = {
			getSession: vi.fn().mockReturnValue(Effect.succeed(mockSession)),
			updateSession: vi.fn().mockReturnValue(Effect.succeed(mockSession)),
			createSession: vi.fn(),
			resumeSession: vi.fn(),
		};

		// Message Repository mock
		mockMessageRepo = {
			saveMessage: vi.fn().mockReturnValue(Effect.succeed(undefined)),
			getMessages: vi.fn().mockReturnValue(Effect.succeed(mockMessages)),
		};

		// Logger Repository mock
		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		};

		// Nerin Agent Repository mock
		mockNerinAgent = {
			invoke: vi.fn().mockReturnValue(Effect.succeed(mockNerinResponse)),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success scenarios", () => {
		it("should send a message and get Nerin response", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "What do you do?",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result).toEqual({
				response: mockNerinResponse.response,
				precision: mockSession.precision,
			});
		});

		it("should save user message to repository", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Tell me something interesting",
				userId: "user_456",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"user",
				"Tell me something interesting",
				"user_456",
			);
		});

		it("should save assistant response to repository", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "What's your purpose?",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"assistant",
				mockNerinResponse.response,
			);
		});

		it("should convert message history to LangChain format", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Another message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Verify Nerin agent was called with properly formatted messages
			expect(mockNerinAgent.invoke).toHaveBeenCalled();
			const callArg = mockNerinAgent.invoke.mock.calls[0][0];

			expect(callArg.sessionId).toBe("session_test_123");
			expect(callArg.messages).toHaveLength(mockMessages.length);
			expect(callArg.messages[0]).toBeInstanceOf(HumanMessage);
			expect(callArg.messages[1]).toBeInstanceOf(AIMessage);
			expect(callArg.precision).toEqual(mockSession.precision);
		});

		it("should update session with precision scores", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockSessionRepo.updateSession).toHaveBeenCalledWith("session_test_123", {
				precision: mockSession.precision,
			});
		});

		it("should include precision in response", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Message content",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.precision).toEqual({
				openness: 50,
				conscientiousness: 50,
				extraversion: 50,
				agreeableness: 50,
				neuroticism: 50,
			});
		});

		it("should log message received and processed events", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockLogger.info).toHaveBeenCalledWith("Message received", {
				sessionId: "session_test_123",
				messageLength: 12,
			});

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Message processed",
				expect.objectContaining({
					sessionId: "session_test_123",
					responseLength: mockNerinResponse.response.length,
					tokenCount: mockNerinResponse.tokenCount,
				}),
			);
		});
	});

	describe("Error handling", () => {
		it("should fail when session not found", async () => {
			const sessionNotFoundError = new Error("Session not found");
			mockSessionRepo.getSession.mockReturnValue(Effect.fail(sessionNotFoundError));

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "nonexistent_session",
				message: "Test",
			};

			await expect(
				Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer))),
			).rejects.toThrow("Session not found");
		});

		it("should handle Nerin agent failure gracefully", async () => {
			const agentError = new Error("Nerin agent failed");
			mockNerinAgent.invoke.mockReturnValue(Effect.fail(agentError));

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			await expect(
				Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer))),
			).rejects.toThrow("Nerin agent failed");

			// Should log the error
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it("should handle message save failure", async () => {
			const saveError = new Error("Database error");
			mockMessageRepo.saveMessage.mockReturnValue(Effect.fail(saveError));

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			await expect(
				Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer))),
			).rejects.toThrow("Database error");
		});
	});

	describe("Edge cases", () => {
		it("should handle empty message history", async () => {
			mockMessageRepo.getMessages.mockReturnValue(Effect.succeed([]));

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "First message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBe(mockNerinResponse.response);
			expect(mockNerinAgent.invoke).toHaveBeenCalled();
			const callArg = mockNerinAgent.invoke.mock.calls[0][0];
			expect(callArg.messages).toEqual([]);
			expect(callArg.sessionId).toBe("session_test_123");
		});

		it("should handle very long messages", async () => {
			const longMessage = "a".repeat(5000);

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: longMessage,
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBe(mockNerinResponse.response);
			expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"user",
				longMessage,
				undefined,
			);
		});

		it("should handle precision scores with null values", async () => {
			const sessionWithoutPrecision = {
				...mockSession,
				precision: undefined,
			};
			mockSessionRepo.getSession.mockReturnValue(Effect.succeed(sessionWithoutPrecision));

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_123",
				message: "Test",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.precision).toBeUndefined();
		});
	});
});
