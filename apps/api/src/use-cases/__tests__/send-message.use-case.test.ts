/**
 * Send Message Use Case Tests
 *
 * Tests for the sendMessage business logic.
 * Uses inline spy layers (Layer.succeed with vi.fn()) for per-test control:
 * - Session validation
 * - Message persistence
 * - Orchestrator invocation (Nerin + optional Analyzer/Scorer)
 * - Confidence score handling (computed from evidence)
 * - Cost tracking
 * - Error handling
 *
 * Story 2.4: Tests updated to use OrchestratorRepository instead of NerinAgentRepository.
 * Story 2.9: Confidence computed on-demand from FacetEvidenceRepository.
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	type BudgetPausedError,
	CostGuardRepository,
	FacetEvidenceRepository,
	LoggerRepository,
	OrchestratorRepository,
	type ProcessMessageOutput,
	type SavedFacetEvidence,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
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
};

const mockCostGuardRepo = {
	incrementDailyCost: vi.fn(),
	getDailyCost: vi.fn(),
	incrementAssessmentCount: vi.fn(),
	getAssessmentCount: vi.fn(),
	canStartAssessment: vi.fn(),
	recordAssessmentStart: vi.fn(),
};

const mockFacetEvidenceRepo = {
	saveEvidence: vi.fn(),
	getEvidenceByMessage: vi.fn(),
	getEvidenceByFacet: vi.fn(),
	getEvidenceBySession: vi.fn(),
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
	// These are optional fields - partial records are intentional for test data
	facetScores: {
		imagination: { score: 16.5, confidence: 85 },
		orderliness: { score: 15.2, confidence: 80 },
	} as ProcessMessageOutput["facetScores"],
	traitScores: {
		openness: { score: 15.8, confidence: 82 },
		conscientiousness: { score: 14.5, confidence: 78 },
	} as ProcessMessageOutput["traitScores"],
	steeringTarget: "orderliness",
	steeringHint: "Explore how they organize their space, time, or belongings",
};

// Helper to create mock evidence that produces specific confidence levels
function createMockEvidence(facetName: string, confidence: number): SavedFacetEvidence {
	return {
		id: `evidence_${facetName}`,
		assessmentMessageId: "msg_3",
		facetName: facetName as SavedFacetEvidence["facetName"],
		score: 15,
		confidence,
		quote: "Test quote",
		highlightRange: { start: 0, end: 10 },
		createdAt: new Date(),
	};
}

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

		// CostGuard Repository mock
		mockCostGuardRepo.getDailyCost.mockReturnValue(Effect.succeed(1000)); // 1000 cents = $10
		mockCostGuardRepo.incrementDailyCost.mockReturnValue(Effect.succeed(1043));
		mockCostGuardRepo.incrementAssessmentCount.mockReturnValue(Effect.succeed(1));
		mockCostGuardRepo.getAssessmentCount.mockReturnValue(Effect.succeed(1));

		// FacetEvidence Repository mock - returns empty by default (no evidence)
		mockFacetEvidenceRepo.getEvidenceBySession.mockReturnValue(Effect.succeed([]));
		mockFacetEvidenceRepo.saveEvidence.mockReturnValue(Effect.succeed([]));
		mockFacetEvidenceRepo.getEvidenceByMessage.mockReturnValue(Effect.succeed([]));
		mockFacetEvidenceRepo.getEvidenceByFacet.mockReturnValue(Effect.succeed([]));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const createTestLayer = () =>
		Layer.mergeAll(
			Layer.succeed(AssessmentSessionRepository, mockAssessmentSessionRepo),
			Layer.succeed(AssessmentMessageRepository, mockAssessmentMessageRepo),
			Layer.succeed(LoggerRepository, mockLoggerRepo),
			Layer.succeed(OrchestratorRepository, mockOrchestratorRepo),
			Layer.succeed(CostGuardRepository, mockCostGuardRepo),
			Layer.succeed(FacetEvidenceRepository, mockFacetEvidenceRepo),
		);

	describe("Success scenarios", () => {
		it("should send a message and get orchestrator response", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "What do you do?",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Response returns trait confidence computed from facet confidence
			// No evidence → all facets have confidence=0 (from DEFAULT_FACET_SCORE)
			// The merge spreads { ...defaults(50), ...facetConfidence(0) } = 0 for all
			expect(result).toEqual({
				response: mockOrchestratorResponse.nerinResponse,
				confidence: {
					openness: 0,
					conscientiousness: 0,
					extraversion: 0,
					agreeableness: 0,
					neuroticism: 0,
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
			expect(callArg.messageCount).toBe(3);
			expect(callArg.facetScores).toBeDefined(); // Map of facet scores with confidence
			expect(callArg.dailyCostUsed).toBe(10); // 1000 cents = $10
		});

		it("should include confidence in response", async () => {
			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Message content",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// No evidence → confidence defaults to 0 for all traits
			expect(result.confidence).toEqual({
				openness: 0,
				conscientiousness: 0,
				extraversion: 0,
				agreeableness: 0,
				neuroticism: 0,
			});
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
		it("should return valid confidence values on batch message", async () => {
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

			// Verify confidence values are valid numbers between 0-100
			expect(typeof result.confidence.openness).toBe("number");
			expect(typeof result.confidence.conscientiousness).toBe("number");
			expect(typeof result.confidence.extraversion).toBe("number");
			expect(typeof result.confidence.agreeableness).toBe("number");
			expect(typeof result.confidence.neuroticism).toBe("number");

			expect(result.confidence.openness).toBeGreaterThanOrEqual(0);
			expect(result.confidence.openness).toBeLessThanOrEqual(100);
			expect(result.confidence.conscientiousness).toBeGreaterThanOrEqual(0);
			expect(result.confidence.conscientiousness).toBeLessThanOrEqual(100);
		});

		it("should compute confidence from evidence after batch processing", async () => {
			mockOrchestratorRepo.processMessage.mockReturnValue(
				Effect.succeed(mockOrchestratorBatchResponse),
			);
			mockAssessmentMessageRepo.getMessageCount.mockReturnValue(Effect.succeed(3));

			// Mock evidence that would be returned after orchestrator saves new evidence
			// The use case calls getEvidenceBySession twice: before and after orchestrator
			const mockEvidence: SavedFacetEvidence[] = [
				createMockEvidence("imagination", 85),
				createMockEvidence("orderliness", 80),
			];

			// First call returns empty (before orchestrator), second call returns evidence (after)
			mockFacetEvidenceRepo.getEvidenceBySession
				.mockReturnValueOnce(Effect.succeed([]))
				.mockReturnValueOnce(Effect.succeed(mockEvidence));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Batch message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Evidence was fetched twice (before and after orchestrator)
			expect(mockFacetEvidenceRepo.getEvidenceBySession).toHaveBeenCalledTimes(2);
			expect(mockFacetEvidenceRepo.getEvidenceBySession).toHaveBeenCalledWith("session_test_123");

			// Confidence should be computed from evidence
			// With imagination=85 and orderliness=80, other facets default to 50
			expect(result.confidence.openness).toBeDefined();
			expect(result.confidence.conscientiousness).toBeDefined();
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
					isBatchMessage: true,
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

		it("should return default confidence when no evidence exists", async () => {
			// Ensure no evidence is returned (default mock behavior)
			mockFacetEvidenceRepo.getEvidenceBySession.mockReturnValue(Effect.succeed([]));

			const testLayer = createTestLayer();

			const input = {
				sessionId: "session_test_123",
				message: "Test",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// When there's no evidence, confidence defaults to 0 for all traits
			// (DEFAULT_FACET_SCORE has confidence=0, which overrides the 50 defaults)
			expect(result.confidence).toEqual({
				openness: 0,
				conscientiousness: 0,
				extraversion: 0,
				agreeableness: 0,
				neuroticism: 0,
			});
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
});
