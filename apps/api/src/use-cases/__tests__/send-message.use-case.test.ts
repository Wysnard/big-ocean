/**
 * Send Message Use Case Tests
 *
 * Story 9.2: Base pipeline tests.
 * Story 10.2: Conversanalyzer integration — cold start skip, evidence pipeline,
 *             non-fatal error handling, evidence cap, zero evidence.
 *
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	AgentInvocationError,
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	ConversanalyzerError,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
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

const mockConversanalyzerRepo = {
	analyze: vi.fn(),
};

const mockEvidenceRepo = {
	save: vi.fn(),
	findBySession: vi.fn(),
	countByMessage: vi.fn(),
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

/** Messages simulating cold start (2 assistant greetings + 1 user reply) */
const coldStartMessages = [
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
		content: "What brings you here?",
		createdAt: new Date(),
	},
	{
		id: "msg_3",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "Hello",
		createdAt: new Date(),
	},
];

/** Messages simulating post-cold-start (3+ user messages) */
const postColdStartMessages = [
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
		content: "What brings you here?",
		createdAt: new Date(),
	},
	{
		id: "msg_3",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "Hello",
		createdAt: new Date(),
	},
	{
		id: "msg_4",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Tell me more",
		createdAt: new Date(),
	},
	{
		id: "msg_5",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "I like art",
		createdAt: new Date(),
	},
	{
		id: "msg_6",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Interesting!",
		createdAt: new Date(),
	},
	{
		id: "msg_7",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "I work in tech",
		createdAt: new Date(),
	},
];

const mockNerinResponse = {
	response: "I help you explore your personality through conversation.",
	tokenCount: { input: 150, output: 80, total: 230 },
};

const mockConversanalyzerOutput = {
	evidence: [
		{ bigfiveFacet: "imagination" as const, score: 14, confidence: 0.6, domain: "work" as const },
		{ bigfiveFacet: "trust" as const, score: 12, confidence: 0.5, domain: "relationships" as const },
	],
	tokenUsage: { input: 200, output: 50 },
};

/** Matches production default in app-config.live.ts */
const MESSAGE_THRESHOLD = 25;

const mockConfig = {
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
};

describe("sendMessage Use Case", () => {
	beforeEach(() => {
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockActiveSession));
		mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(1));

		mockMessageRepo.saveMessage.mockReturnValue(
			Effect.succeed({
				id: "saved_msg_id",
				sessionId: "session_test_123",
				role: "user",
				content: "test",
				createdAt: new Date(),
			}),
		);
		mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});

		mockNerinRepo.invoke.mockReturnValue(Effect.succeed(mockNerinResponse));

		mockConversanalyzerRepo.analyze.mockReturnValue(Effect.succeed(mockConversanalyzerOutput));

		mockEvidenceRepo.save.mockReturnValue(Effect.succeed(undefined));
		mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed([]));
		mockEvidenceRepo.countByMessage.mockReturnValue(Effect.succeed(0));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const createTestLayer = () =>
		Layer.mergeAll(
			Layer.succeed(AppConfig, mockConfig),
			Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
			Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
			Layer.succeed(LoggerRepository, mockLoggerRepo),
			Layer.succeed(NerinAgentRepository, mockNerinRepo),
			Layer.succeed(ConversanalyzerRepository, mockConversanalyzerRepo),
			Layer.succeed(ConversationEvidenceRepository, mockEvidenceRepo),
		);

	describe("Base pipeline (Story 9.2)", () => {
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

		it.effect("should save user message and capture messageId", () =>
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

		it.effect("should save assistant message with response content", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"assistant",
					mockNerinResponse.response,
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should invoke Nerin with correct message history", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockNerinRepo.invoke).toHaveBeenCalledWith({
					sessionId: "session_test_123",
					messages: coldStartMessages.map((m) => ({
						id: m.id,
						role: m.role,
						content: m.content,
					})),
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should increment message_count atomically", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockSessionRepo.incrementMessageCount).toHaveBeenCalledWith("session_test_123");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Ownership guard", () => {
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
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
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
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("isFinalTurn threshold", () => {
		it.effect("should return isFinalTurn: true at threshold", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(MESSAGE_THRESHOLD));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Threshold msg",
				});

				expect(result.isFinalTurn).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return isFinalTurn: false below threshold", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(MESSAGE_THRESHOLD - 1));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Normal message",
				});

				expect(result.isFinalTurn).toBe(false);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Conversanalyzer integration (Story 10.2)", () => {
		it.effect("should trigger conversanalyzer for post-cold-start messages (AC: #1)", () =>
			Effect.gen(function* () {
				// Post-cold-start: 3 user messages (> greeting count of 2)
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				expect(result.response).toBeDefined();
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip conversanalyzer during cold start (AC: #7)", () =>
			Effect.gen(function* () {
				// Cold start: only 1 user message (≤ greeting count of 2)
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Hello",
				});

				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip conversanalyzer at exactly greeting count (boundary)", () =>
			Effect.gen(function* () {
				// Exactly 2 user messages = greeting count → still cold start
				const twoUserMessages = [
					...coldStartMessages,
					{
						id: "msg_4",
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: "Cool",
						createdAt: new Date(),
					},
					{
						id: "msg_5",
						sessionId: "session_test_123",
						role: "user" as const,
						content: "More",
						createdAt: new Date(),
					},
				];
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(twoUserMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "More",
				});

				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should handle non-fatal conversanalyzer error — Nerin still responds (AC: #6)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Nerin should still respond normally despite conversanalyzer failure
				expect(result.response).toBe(mockNerinResponse.response);
				expect(mockNerinRepo.invoke).toHaveBeenCalled();
				// Error was logged (after retry exhausted per AC #6)
				expect(mockLoggerRepo.error).toHaveBeenCalledWith(
					"Conversanalyzer failed, skipping",
					expect.objectContaining({ sessionId: "session_test_123" }),
				);
				// Evidence not saved
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should cap evidence to 3 records (AC: #9)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						evidence: [
							{ bigfiveFacet: "imagination", score: 14, confidence: 0.6, domain: "work" },
							{ bigfiveFacet: "trust", score: 12, confidence: 0.5, domain: "relationships" },
							{ bigfiveFacet: "orderliness", score: 16, confidence: 0.7, domain: "work" },
							{ bigfiveFacet: "cheerfulness", score: 18, confidence: 0.8, domain: "leisure" },
							{ bigfiveFacet: "anxiety", score: 5, confidence: 0.4, domain: "solo" },
						],
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Only 3 records saved (capped from 5)
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(3);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip save when conversanalyzer returns empty evidence (AC: #3)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({ evidence: [], tokenUsage: { input: 100, output: 20 } }),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "ok thanks",
				});

				expect(result.response).toBeDefined();
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should pass correct domain distribution to conversanalyzer (AC: #4)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				// Existing evidence in session
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "work",
							createdAt: new Date(),
						},
						{
							id: "e2",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "trust",
							score: 12,
							confidence: 0.5,
							domain: "work",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const analyzeCall = mockConversanalyzerRepo.analyze.mock.calls[0][0];
				expect(analyzeCall.domainDistribution).toEqual({
					work: 2,
					relationships: 0,
					family: 0,
					leisure: 0,
					solo: 0,
					other: 0,
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save evidence with correct sessionId and messageId", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockMessageRepo.saveMessage.mockReturnValue(
					Effect.succeed({
						id: "new_msg_id",
						sessionId: "session_test_123",
						role: "user",
						content: "test",
						createdAt: new Date(),
					}),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				for (const record of savedRecords) {
					expect(record.sessionId).toBe("session_test_123");
					expect(record.messageId).toBe("new_msg_id");
				}
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
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
