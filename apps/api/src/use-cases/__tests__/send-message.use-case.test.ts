/**
 * Send Message Use Case Tests
 *
 * Tests for the sendMessage business logic.
 * Uses mock repositories to test:
 * - Session validation
 * - Message persistence
 * - Orchestrator invocation (Nerin + optional Analyzer/Scorer)
 * - Precision score handling
 * - Cost tracking
 * - Error handling
 *
 * Story 2.4: Tests updated to use OrchestratorRepository instead of NerinAgentRepository.
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	type BudgetPausedError,
	CostGuardRepository,
	type FacetConfidenceScores,
	initializeFacetConfidence,
	LoggerRepository,
	OrchestratorRepository,
	type ProcessMessageOutput,
} from "@workspace/domain";
import { Cause, Effect, Exit, Layer, Option } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "../send-message.use-case";

// Helper to create facet confidence with all facets at a given value
const createMockFacetConfidence = (value: number = 50): FacetConfidenceScores =>
	initializeFacetConfidence(value);

// Mock data factories
const mockSession = {
	sessionId: "session_test_123",
	userId: "user_456",
	createdAt: new Date("2026-02-01"),
	confidence: createMockFacetConfidence(50), // 50% confidence on all facets
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

// Facet confidence map with specific updates for batch processing test
// imagination: 85 (openness facet), orderliness: 80 (conscientiousness facet)
// All other facets remain at 50 (default from session)
const mockBatchFacetConfidence = createMockFacetConfidence(50);
mockBatchFacetConfidence.imagination = 85; // Will make openness = (85 + 5*50)/6 ≈ 56%
mockBatchFacetConfidence.orderliness = 80; // Will make conscientiousness = (80 + 5*50)/6 = 55%

const mockOrchestratorBatchResponse: ProcessMessageOutput = {
	nerinResponse: "Interesting! Tell me more about that.",
	tokenUsage: {
		input: 180,
		output: 90,
		total: 270,
	},
	costIncurred: 0.0047,
	facetEvidence: [
		{
			assessmentMessageId: "msg_3",
			facetName: "imagination",
			score: 16,
			confidence: 85,
			quote: "I like to organize",
			highlightRange: { start: 0, end: 18 },
		},
	],
	facetScores: {
		imagination: { score: 16.5, confidence: 85 },
		orderliness: { score: 15.2, confidence: 80 },
	},
	traitScores: {
		openness: { score: 15.8, confidence: 82 },
		conscientiousness: { score: 14.5, confidence: 78 },
	},
	steeringTarget: "orderliness",
	steeringHint: "Explore how they organize their space, time, or belongings",
};

describe("sendMessage Use Case", () => {
	// biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockSessionRepo: any;
	// biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockMessageRepo: any;
	// biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockLogger: any;
	// biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockOrchestrator: any;
	// biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockCostGuard: any;

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
			getMessageCount: vi.fn().mockReturnValue(Effect.succeed(3)),
		};

		// Logger Repository mock
		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		};

		// Orchestrator Repository mock
		mockOrchestrator = {
			processMessage: vi.fn().mockReturnValue(Effect.succeed(mockOrchestratorResponse)),
		};

		// CostGuard Repository mock
		mockCostGuard = {
			getDailyCost: vi.fn().mockReturnValue(Effect.succeed(1000)), // 1000 cents = $10
			incrementDailyCost: vi.fn().mockReturnValue(Effect.succeed(1043)),
			incrementAssessmentCount: vi.fn().mockReturnValue(Effect.succeed(1)),
			getAssessmentCount: vi.fn().mockReturnValue(Effect.succeed(1)),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const createTestLayer = () =>
		Layer.mergeAll(
			Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
			Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
			Layer.succeed(LoggerRepository, mockLogger),
			Layer.succeed(OrchestratorRepository, mockOrchestrator),
			Layer.succeed(CostGuardRepository, mockCostGuard),
		);

	describe("Success scenarios", () => {
		it("should send a message and get orchestrator response", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "What do you do?",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Response returns trait precision computed from facet precision
			// All facets at 0.5 -> all traits at 50
			expect(result).toEqual({
				response: mockOrchestratorResponse.nerinResponse,
				precision: {
					openness: 50,
					conscientiousness: 50,
					extraversion: 50,
					agreeableness: 50,
					neuroticism: 50,
				},
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

			expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
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

			expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
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

			expect(mockOrchestrator.processMessage).toHaveBeenCalled();
			const callArg = mockOrchestrator.processMessage.mock.calls[0][0];

			expect(callArg.sessionId).toBe("session_test_123");
			expect(callArg.userMessage).toBe("Another message");
			expect(callArg.messageCount).toBe(3);
			expect(callArg.facetScores).toBeDefined(); // Map of facet scores with confidence
			expect(callArg.dailyCostUsed).toBe(10); // 1000 cents = $10
		});

		it("should update session with precision scores", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockSessionRepo.updateSession).toHaveBeenCalledWith("session_test_123", {
				confidence: mockSession.confidence,
			});
		});

		it("should include precision in response", async () => {
			const testLayer = createTestLayer();

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
			const testLayer = createTestLayer();

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
					responseLength: mockOrchestratorResponse.nerinResponse.length,
				}),
			);
		});

		it("should update cost tracking", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Track my cost",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Cost should be incremented (0.0043 dollars = 0.43 cents, rounded)
			expect(mockCostGuard.incrementDailyCost).toHaveBeenCalledWith("user_456", expect.any(Number));
		});
	});

	describe("Batch processing (every 3rd message)", () => {
		it("should update precision from facet scores on batch message", async () => {
			mockOrchestrator.processMessage.mockReturnValue(Effect.succeed(mockOrchestratorBatchResponse));
			mockMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(3)); // Batch trigger

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Batch message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Precision is computed from facet confidence:
			// - imagination (openness) updated to 0.85, other 5 openness facets at 0.5
			//   openness = (0.85 + 5*0.5) / 6 = 0.558 -> 56%
			// - orderliness (conscientiousness) updated to 0.8, other 5 conscientiousness facets at 0.5
			//   conscientiousness = (0.8 + 5*0.5) / 6 = 0.55 -> 55%
			// - Other traits keep all facets at 0.5 -> 50%
			expect(result.precision.openness).toBe(56);
			expect(result.precision.conscientiousness).toBe(55);
			expect(result.precision.extraversion).toBe(50);
			expect(result.precision.agreeableness).toBe(50);
			expect(result.precision.neuroticism).toBe(50);
		});

		it("should log batch processing info", async () => {
			mockOrchestrator.processMessage.mockReturnValue(Effect.succeed(mockOrchestratorBatchResponse));
			mockMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(3));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Batch message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Message processed",
				expect.objectContaining({
					isBatchMessage: true,
					steeringTarget: "orderliness",
				}),
			);
		});
	});

	describe("Error handling", () => {
		it("should fail when session not found", async () => {
			const sessionNotFoundError = new Error("Session not found");
			mockSessionRepo.getSession.mockReturnValue(Effect.fail(sessionNotFoundError));

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
			mockOrchestrator.processMessage.mockReturnValue(Effect.fail(orchestratorError));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			// Use Effect.exit to capture the failure and check error properties
			const exit = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.exit),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const errorOption = Cause.failureOption(exit.cause);
				expect(Option.isSome(errorOption)).toBe(true);
				if (Option.isSome(errorOption)) {
					expect(errorOption.value._tag).toBe("OrchestrationError");
				}
			}

			// Should log the error
			expect(mockLogger.error).toHaveBeenCalled();
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
			mockOrchestrator.processMessage.mockReturnValue(Effect.fail(budgetError));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test message",
			};

			// Use Effect.exit to capture the failure and check error properties
			const exit = await Effect.runPromise(
				sendMessage(input).pipe(Effect.provide(testLayer), Effect.exit),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const errorOption = Cause.failureOption(exit.cause);
				expect(Option.isSome(errorOption)).toBe(true);
				if (Option.isSome(errorOption)) {
					expect(errorOption.value._tag).toBe("BudgetPausedError");
					expect((errorOption.value as BudgetPausedError).sessionId).toBe("session_test_123");
				}
			}
		});

		it("should handle message save failure", async () => {
			const saveError = new Error("Database error");
			mockMessageRepo.saveMessage.mockReturnValue(Effect.fail(saveError));

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
			mockMessageRepo.getMessages.mockReturnValue(Effect.succeed([]));
			mockMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(1));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "First message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			expect(result.response).toBe(mockOrchestratorResponse.nerinResponse);
			expect(mockOrchestrator.processMessage).toHaveBeenCalled();
			const callArg = mockOrchestrator.processMessage.mock.calls[0][0];
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
			expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
				"session_test_123",
				"user",
				longMessage,
				undefined,
			);
		});

		it("should handle precision scores with null values by using defaults", async () => {
			const sessionWithoutPrecision = {
				...mockSession,
				precision: undefined,
			};
			mockSessionRepo.getSession.mockReturnValue(Effect.succeed(sessionWithoutPrecision));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// When session has no precision, defaults to 50 for all traits
			expect(result.precision).toEqual({
				openness: 50,
				conscientiousness: 50,
				extraversion: 50,
				agreeableness: 50,
				neuroticism: 50,
			});
		});

		it("should handle anonymous user for cost tracking", async () => {
			const sessionWithoutUser = {
				...mockSession,
				userId: undefined,
			};
			mockSessionRepo.getSession.mockReturnValue(Effect.succeed(sessionWithoutUser));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Anonymous message",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Should use "anonymous" as userId for cost tracking
			expect(mockCostGuard.getDailyCost).toHaveBeenCalledWith("anonymous");
			expect(mockCostGuard.incrementDailyCost).toHaveBeenCalledWith("anonymous", expect.any(Number));
		});
	});
});
