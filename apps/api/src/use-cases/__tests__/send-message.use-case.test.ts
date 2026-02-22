/**
 * Send Message Use Case Tests
 *
 * Tests for the sendMessage business logic.
 * Uses inline spy layers (Layer.succeed with vi.fn()) for per-test control:
 * - Session validation
 * - Message persistence
 * - Orchestrator invocation (Nerin conversational agent)
 * - Cost tracking
 * - Error handling
 *
 * Story 2.4: Tests updated to use OrchestratorRepository instead of NerinAgentRepository.
 * Story 2.9: Confidence computed on-demand from FacetEvidenceRepository.
 * Story 2.11: Lean response — confidence removed from send-message output.
 *             Evidence reads moved to router node (offset steering).
 * Story 7.18: Final turn detection — farewell message at threshold, isFinalTurn flag.
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	type BudgetPausedError,
	CostGuardRepository,
	LoggerRepository,
	NERIN_FAREWELL_MESSAGES,
	OrchestratorRepository,
	type ProcessMessageOutput,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "../send-message.use-case";

// Define mock repo objects locally with vi.fn() for spy access
const mockAssessmentSessionRepo = {
	createSession: vi.fn(),
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

const mockOrchestratorRepo = {
	processMessage: vi.fn(),
	processAnalysis: vi.fn(),
};

const mockCostGuardRepo = {
	incrementDailyCost: vi.fn(),
	getDailyCost: vi.fn(),
	incrementAssessmentCount: vi.fn(),
	getAssessmentCount: vi.fn(),
	canStartAssessment: vi.fn(),
	recordAssessmentStart: vi.fn(),
};

// Mock data factories
const mockSession = {
	sessionId: "session_test_123",
	userId: undefined,
	createdAt: new Date("2026-02-01"),
};

const mockMessages = [
	{
		id: "msg_1",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "Tell me about yourself",
		createdAt: new Date(),
	},
	{
		id: "msg_2",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Hi! I'm Nerin, nice to meet you.",
		createdAt: new Date(),
	},
	{
		id: "msg_3",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "What do you do?",
		createdAt: new Date(),
	},
];

const mockOrchestratorResponse: ProcessMessageOutput = {
	nerinResponse: "I help you explore your personality through conversation.",
	tokenUsage: {
		input: 150,
		output: 80,
		total: 230,
	},
	costIncurred: 0.0043,
};

const mockOrchestratorBatchResponse: ProcessMessageOutput = {
	nerinResponse: "Interesting! Tell me more about that.",
	tokenUsage: {
		input: 180,
		output: 90,
		total: 270,
	},
	costIncurred: 0.0047,
	steeringTarget: "orderliness",
	steeringHint: "Explore how they organize their space, time, or belongings",
};

describe("sendMessage Use Case", () => {
	beforeEach(() => {
		// Session Repository mock
		mockAssessmentSessionRepo.getSession.mockReturnValue(Effect.succeed(mockSession));
		mockAssessmentSessionRepo.updateSession.mockReturnValue(Effect.succeed(mockSession));
		mockAssessmentSessionRepo.createSession.mockImplementation(() => Effect.succeed(undefined));

		// Message Repository mock
		mockAssessmentMessageRepo.saveMessage.mockReturnValue(Effect.succeed(undefined));
		mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(mockMessages));
		mockAssessmentMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(3));

		// Logger Repository mock
		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});

		// Orchestrator Repository mock
		mockOrchestratorRepo.processMessage.mockReturnValue(Effect.succeed(mockOrchestratorResponse));
		mockOrchestratorRepo.processAnalysis.mockReturnValue(Effect.void);

		// CostGuard Repository mock
		mockCostGuardRepo.getDailyCost.mockReturnValue(Effect.succeed(1000)); // 1000 cents = $10
		mockCostGuardRepo.incrementDailyCost.mockReturnValue(Effect.succeed(1043));
		mockCostGuardRepo.incrementAssessmentCount.mockReturnValue(Effect.succeed(1));
		mockCostGuardRepo.getAssessmentCount.mockReturnValue(Effect.succeed(1));
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
				nerinModelId: "claude-haiku-4-5-20251001",
				nerinMaxTokens: 1024,
				nerinTemperature: 0.7,
				dailyCostLimit: 75,
				freeTierMessageThreshold: 25,
				portraitWaitMinMs: 2000,
				shareMinConfidence: 70,
			}),
			Layer.succeed(AssessmentSessionRepository, mockAssessmentSessionRepo),
			Layer.succeed(AssessmentMessageRepository, mockAssessmentMessageRepo),
			Layer.succeed(LoggerRepository, mockLoggerRepo),
			Layer.succeed(OrchestratorRepository, mockOrchestratorRepo),
			Layer.succeed(CostGuardRepository, mockCostGuardRepo),
		);

	describe("Success scenarios", () => {
		it("should send a message and get orchestrator response", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "What do you do?",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Story 7.18: includes isFinalTurn flag
			expect(result).toEqual({
				response: mockOrchestratorResponse.nerinResponse,
				isFinalTurn: false,
			});
		});

		it("should save user message to repository", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Tell me something interesting",
				userId: "user_456",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"user",
				"Tell me something interesting",
				"user_456",
			);
		});

		it("should save assistant response to repository", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "What's your purpose?",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"assistant",
				mockOrchestratorResponse.nerinResponse,
			);
		});

		it("should invoke orchestrator with correct parameters", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Another message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockOrchestratorRepo.processMessage).toHaveBeenCalled();
			const callArg = mockOrchestratorRepo.processMessage.mock.calls[0]?.[0];

			expect(callArg.sessionId).toBe("session_test_123");
			expect(callArg.userMessage).toBe("Another message");
			// Message cadence is based on user messages only
			expect(callArg.messageCount).toBe(2);
			expect(callArg.dailyCostUsed).toBe(10); // 1000 cents = $10
		});

		it("should return lean response without confidence", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Message content",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Story 2.11: Lean response — only response string, no confidence
			expect(result.response).toBeDefined();
			expect((result as Record<string, unknown>).confidence).toBeUndefined();
		});

		it("should log message received and processed events", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Message received", {
				sessionId: "session_test_123",
				messageLength: 12,
			});

			expect(mockLoggerRepo.info).toHaveBeenCalledWith(
				"Message processed",
				expect.objectContaining({
					sessionId: "session_test_123",
					responseLength: mockOrchestratorResponse.nerinResponse.length,
				}),
			);
		});

		it("should update cost tracking", async () => {
			const linkedSession = {
				...mockSession,
				userId: "user_456",
			};
			mockAssessmentSessionRepo.getSession.mockReturnValue(Effect.succeed(linkedSession));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Track my cost",
				authenticatedUserId: "user_456",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Cost should be incremented (0.0043 dollars = 0.43 cents, rounded)
			expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
				"user_456",
				expect.any(Number),
			);
		});
	});

	describe("Ownership guard", () => {
		it("allows linked session owner to send messages", async () => {
			mockAssessmentSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					...mockSession,
					userId: "owner_user",
				}),
			);

			const testLayer = createTestLayer();
			const input = {
				sessionId: "session_test_123",
				message: "Owner message",
				authenticatedUserId: "owner_user",
				userId: "owner_user",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBeDefined();
			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalled();
			expect(mockOrchestratorRepo.processMessage).toHaveBeenCalled();
		});

		it("denies linked session access for non-owner before side effects", async () => {
			mockAssessmentSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					...mockSession,
					userId: "owner_user",
				}),
			);

			const testLayer = createTestLayer();
			const input = {
				sessionId: "session_test_123",
				message: "Unauthorized message",
				authenticatedUserId: "different_user",
			};

			const error = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.flip),
			);

			expect(error._tag).toBe("SessionNotFound");
			expect(mockAssessmentMessageRepo.saveMessage).not.toHaveBeenCalled();
			expect(mockAssessmentMessageRepo.getMessageCount).not.toHaveBeenCalled();
			expect(mockAssessmentMessageRepo.getMessages).not.toHaveBeenCalled();
			expect(mockOrchestratorRepo.processMessage).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.getDailyCost).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.incrementDailyCost).not.toHaveBeenCalled();
		});

		it("denies linked session access for unauthenticated requests", async () => {
			mockAssessmentSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					...mockSession,
					userId: "owner_user",
				}),
			);

			const testLayer = createTestLayer();
			const input = {
				sessionId: "session_test_123",
				message: "Unauthenticated message",
			};

			const error = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.flip),
			);

			expect(error._tag).toBe("SessionNotFound");
			expect(mockAssessmentMessageRepo.saveMessage).not.toHaveBeenCalled();
			expect(mockOrchestratorRepo.processMessage).not.toHaveBeenCalled();
		});

		it("keeps anonymous pre-link sessions accessible", async () => {
			mockAssessmentSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					...mockSession,
					userId: null,
				}),
			);

			const testLayer = createTestLayer();
			const input = {
				sessionId: "session_test_123",
				message: "Anonymous access message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBeDefined();
			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalled();
			expect(mockOrchestratorRepo.processMessage).toHaveBeenCalled();
		});
	});

	describe("Batch processing (every 3rd message)", () => {
		it("should return lean response on batch message", async () => {
			mockOrchestratorRepo.processMessage.mockReturnValue(
				Effect.succeed(mockOrchestratorBatchResponse),
			);
			mockAssessmentMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(3)); // Batch trigger

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Batch message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Story 2.11: Lean response — only response string, no confidence
			expect(result.response).toBe(mockOrchestratorBatchResponse.nerinResponse);
			expect((result as Record<string, unknown>).confidence).toBeUndefined();
		});

		it("should log batch processing info", async () => {
			mockOrchestratorRepo.processMessage.mockReturnValue(
				Effect.succeed(mockOrchestratorBatchResponse),
			);
			mockAssessmentMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(3));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Batch message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith(
				"Message processed",
				expect.objectContaining({
					steeringTarget: "orderliness",
				}),
			);
		});
	});

	describe("Error handling", () => {
		it("should fail when session not found", async () => {
			const sessionNotFoundError = new Error("Session not found");
			mockAssessmentSessionRepo.getSession.mockReturnValue(Effect.fail(sessionNotFoundError));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "nonexistent_session",
				message: "Test",
			};

			await expect(
				Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer))),
			).rejects.toThrow("Session not found");
		});

		it("should handle orchestrator failure gracefully", async () => {
			const orchestratorError = {
				_tag: "OrchestrationError" as const,
				sessionId: "session_test_123",
				message: "Orchestrator pipeline failed",
			};
			mockOrchestratorRepo.processMessage.mockReturnValue(Effect.fail(orchestratorError));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			// Use Effect.flip to capture the error directly
			const error = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.flip),
			);

			expect(error._tag).toBe("OrchestrationError");

			// Should log the error
			expect(mockLoggerRepo.error).toHaveBeenCalled();
		});

		it("should handle BudgetPausedError", async () => {
			const budgetError: BudgetPausedError = {
				_tag: "BudgetPausedError",
				name: "BudgetPausedError",
				sessionId: "session_test_123",
				message: "Your assessment is saved! Come back tomorrow.",
				resumeAfter: new Date("2026-02-04T00:00:00Z"),
				currentConfidence: 50,
			};
			mockOrchestratorRepo.processMessage.mockReturnValue(Effect.fail(budgetError));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			// Use Effect.flip to capture the error directly
			const error = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.flip),
			);

			expect(error._tag).toBe("BudgetPausedError");
			expect((error as BudgetPausedError).sessionId).toBe("session_test_123");
		});

		it("should handle message save failure", async () => {
			const saveError = new Error("Database error");
			mockAssessmentMessageRepo.saveMessage.mockReturnValue(Effect.fail(saveError));

			const testLayer = createTestLayer();

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
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed([]));
			mockAssessmentMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(1));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "First message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBe(mockOrchestratorResponse.nerinResponse);
			expect(mockOrchestratorRepo.processMessage).toHaveBeenCalled();
			const callArg = mockOrchestratorRepo.processMessage.mock.calls[0]?.[0];
			expect(callArg.messages).toEqual([]);
			expect(callArg.sessionId).toBe("session_test_123");
		});

		it("should handle very long messages", async () => {
			const longMessage = "a".repeat(5000);

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: longMessage,
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBe(mockOrchestratorResponse.nerinResponse);
			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"user",
				longMessage,
				undefined,
			);
		});

		it("should return lean response without confidence", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Story 2.11: Lean response — no confidence in output
			expect(result.response).toBe(mockOrchestratorResponse.nerinResponse);
			expect((result as Record<string, unknown>).confidence).toBeUndefined();
		});

		it("should handle anonymous user for cost tracking", async () => {
			const sessionWithoutUser = {
				...mockSession,
				userId: undefined,
			};
			mockAssessmentSessionRepo.getSession.mockReturnValue(Effect.succeed(sessionWithoutUser));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Anonymous message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Should use "anonymous" as userId for cost tracking
			expect(mockCostGuardRepo.getDailyCost).toHaveBeenCalledWith("anonymous");
			expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
				"anonymous",
				expect.any(Number),
			);
		});
	});

	describe("Final turn detection (Story 7.18)", () => {
		/**
		 * Helper: create N user messages + some assistant messages to simulate
		 * a conversation with exactly `userCount` user messages.
		 */
		const createMessagesWithUserCount = (userCount: number) => {
			const messages = [];
			for (let i = 0; i < userCount; i++) {
				messages.push({
					id: `msg_user_${i}`,
					sessionId: "session_test_123",
					role: "user" as const,
					content: `User message ${i + 1}`,
					createdAt: new Date(),
				});
				messages.push({
					id: `msg_assistant_${i}`,
					sessionId: "session_test_123",
					role: "assistant" as const,
					content: `Nerin response ${i + 1}`,
					createdAt: new Date(),
				});
			}
			return messages;
		};

		it("should return isFinalTurn: true when messageCount equals threshold", async () => {
			// 25 user messages = threshold
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.isFinalTurn).toBe(true);
		});

		it("should include farewellMessage from the pool at threshold", async () => {
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.farewellMessage).toBeDefined();
			expect(NERIN_FAREWELL_MESSAGES).toContain(result.farewellMessage);
			// response should also be the farewell
			expect(result.response).toBe(result.farewellMessage);
		});

		it("should include portraitWaitMinMs from config at threshold", async () => {
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.portraitWaitMinMs).toBe(2000);
		});

		it("should NOT call orchestrator on final turn (no LLM cost)", async () => {
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockOrchestratorRepo.processMessage).not.toHaveBeenCalled();
		});

		it("should save farewell as assistant message on final turn", async () => {
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Should save farewell as second saveMessage call (first is user message)
			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledTimes(2);
			expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"assistant",
				result.farewellMessage,
			);
		});

		it("should return isFinalTurn: false for messages before threshold", async () => {
			// 2 user messages (from default mockMessages) — well below threshold
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Normal message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.isFinalTurn).toBe(false);
			expect(result.farewellMessage).toBeUndefined();
			expect(result.portraitWaitMinMs).toBeUndefined();
		});

		it("should throw FreeTierLimitReached for messages past threshold", async () => {
			// 26 user messages = past threshold
			const pastThresholdMessages = createMessagesWithUserCount(26);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(
				Effect.succeed(pastThresholdMessages),
			);

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Past limit message",
			};

			const error = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.flip),
			);

			expect(error._tag).toBe("FreeTierLimitReached");
		});

		it("should NOT increment cost tracking on final turn", async () => {
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockCostGuardRepo.incrementDailyCost).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.getDailyCost).not.toHaveBeenCalled();
		});

		it("should log final turn event", async () => {
			const thresholdMessages = createMessagesWithUserCount(25);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(Effect.succeed(thresholdMessages));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Final message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Final turn - farewell sent", {
				sessionId: "session_test_123",
				messageCount: 25,
			});
		});
	});
});
