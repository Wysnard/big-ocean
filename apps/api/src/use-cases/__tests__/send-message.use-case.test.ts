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
	ConcurrentMessageError,
	ConversanalyzerError,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	CostGuardRepository,
	CostLimitExceeded,
	LoggerRepository,
	MessageRateLimitError,
	NerinAgentRepository,
	RedisOperationError,
} from "@workspace/domain";
import { Cause, DateTime, Effect, Layer, Option, Redacted } from "effect";
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
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
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

const mockCostGuardRepo = {
	incrementDailyCost: vi.fn(),
	getDailyCost: vi.fn(),
	incrementAssessmentCount: vi.fn(),
	getAssessmentCount: vi.fn(),
	canStartAssessment: vi.fn(),
	recordAssessmentStart: vi.fn(),
	checkDailyBudget: vi.fn(),
	checkMessageRateLimit: vi.fn(),
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
		targetDomain: "relationships" as const,
		targetBigfiveFacet: "gregariousness" as const,
		createdAt: new Date(),
	},
	{
		id: "msg_2",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "What brings you here?",
		targetDomain: "relationships" as const,
		targetBigfiveFacet: "gregariousness" as const,
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
		targetDomain: "leisure" as const,
		targetBigfiveFacet: "imagination" as const,
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
		targetDomain: "work" as const,
		targetBigfiveFacet: "orderliness" as const,
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
const FREE_TIER_MESSAGE_THRESHOLD = 25;

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
	conversanalyzerModelId: "claude-haiku-4-5-20251001",
	finanalyzerModelId: "claude-sonnet-4-20250514",
	portraitGeneratorModelId: "claude-sonnet-4-20250514",
};

describe("sendMessage Use Case", () => {
	beforeEach(() => {
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockActiveSession));
		mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(1));
		mockSessionRepo.acquireSessionLock.mockReturnValue(Effect.void);
		mockSessionRepo.releaseSessionLock.mockReturnValue(Effect.void);

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

		mockCostGuardRepo.checkDailyBudget.mockReturnValue(Effect.void);
		mockCostGuardRepo.incrementDailyCost.mockReturnValue(Effect.succeed(1));
		mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(Effect.void);
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
			Layer.succeed(CostGuardRepository, mockCostGuardRepo),
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

		it.effect("should save assistant message with response content and steering targets", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				// Cold start: greeting seed → "relationships" / "gregariousness" (index 1 from GREETING_MESSAGES.length)
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"assistant",
					mockNerinResponse.response,
					undefined,
					"relationships",
					"gregariousness",
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should invoke Nerin with correct message history and steering", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockNerinRepo.invoke).toHaveBeenCalledWith({
					sessionId: "session_test_123",
					messages: coldStartMessages.map((m) => ({
						id: m.id,
						role: m.role,
						content: m.content,
					})),
					targetDomain: "relationships",
					targetFacet: "gregariousness",
					nearingEnd: false,
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
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(FREE_TIER_MESSAGE_THRESHOLD),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Threshold msg",
				});

				expect(result.isFinalTurn).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return isFinalTurn: false below threshold", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(FREE_TIER_MESSAGE_THRESHOLD - 1),
				);

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

	describe("Steering integration (Story 10.4)", () => {
		it.effect("should pass steering target to Nerin in post-cold-start messages (AC: #1)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				// findBySession is called twice: once for domainDistribution, once after save for metrics
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
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.targetDomain).toBeDefined();
				expect(nerinCall.targetFacet).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should use greeting seed during cold start (AC: #2)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Hello",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				// GREETING_MESSAGES.length = 1 → pool index 1 → "relationships" / "gregariousness"
				expect(nerinCall.targetDomain).toBe("relationships");
				expect(nerinCall.targetFacet).toBe("gregariousness");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should extract previousDomain from message history (AC: #4)", () =>
			Effect.gen(function* () {
				const messagesWithSteering = [
					...postColdStartMessages.slice(0, 3),
					{
						id: "msg_4",
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: "Tell me more",
						targetDomain: "leisure" as const,
						targetBigfiveFacet: "imagination" as const,
						createdAt: new Date(),
					},
					...postColdStartMessages.slice(4),
				];
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(messagesWithSteering));
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "leisure",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Verify steering was called (Nerin received steering targets)
				expect(mockNerinRepo.invoke).toHaveBeenCalled();
				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.targetDomain).toBeDefined();
				expect(nerinCall.targetFacet).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save assistant message with targetDomain and targetBigfiveFacet (AC: #3)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
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
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Last call to saveMessage should be the assistant message with steering
				const saveMessageCalls = mockMessageRepo.saveMessage.mock.calls;
				const assistantSaveCall = saveMessageCalls.find((call: unknown[]) => call[1] === "assistant");
				expect(assistantSaveCall).toBeDefined();
				expect(assistantSaveCall?.[4]).toBeDefined(); // targetDomain
				expect(assistantSaveCall?.[5]).toBeDefined(); // targetBigfiveFacet
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should still steer on stale evidence when conversanalyzer fails (AC: #5)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
				);
				// Stale evidence exists in DB
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_3",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "work",
							createdAt: new Date(),
						},
					]),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Nerin still gets steering even though conversanalyzer failed
				expect(result.response).toBe(mockNerinResponse.response);
				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.targetDomain).toBeDefined();
				expect(nerinCall.targetFacet).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"should compute valid steering for transition message — first post-cold-start with minimal evidence (AC: transition)",
			() =>
				Effect.gen(function* () {
					// Transition: exactly COLD_START_USER_MSG_THRESHOLD + 1 = 3 user messages
					const transitionMessages = [
						...coldStartMessages,
						{
							id: "msg_4",
							sessionId: "session_test_123",
							role: "assistant" as const,
							content: "That's great!",
							createdAt: new Date(),
						},
						{
							id: "msg_5",
							sessionId: "session_test_123",
							role: "user" as const,
							content: "I enjoy music",
							createdAt: new Date(),
						},
						{
							id: "msg_6",
							sessionId: "session_test_123",
							role: "assistant" as const,
							content: "Tell me more",
							createdAt: new Date(),
						},
						{
							id: "msg_7",
							sessionId: "session_test_123",
							role: "user" as const,
							content: "I play guitar",
							createdAt: new Date(),
						},
					];
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(transitionMessages));
					// First conversanalyzer run yields minimal evidence
					mockEvidenceRepo.findBySession.mockReturnValue(
						Effect.succeed([
							{
								id: "e1",
								sessionId: "session_test_123",
								messageId: "msg_5",
								bigfiveFacet: "imagination",
								score: 14,
								confidence: 0.6,
								domain: "leisure",
								createdAt: new Date(),
							},
						]),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "I play guitar",
					});

					expect(result.response).toBeDefined();
					const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
					expect(nerinCall.targetDomain).toBeDefined();
					expect(nerinCall.targetFacet).toBeDefined();
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

	describe("Advisory lock — unit tests with mock repos (Story 10.5)", () => {
		it.effect("should acquire and release advisory lock on successful pipeline", () =>
			Effect.gen(function* () {
				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				});

				expect(mockSessionRepo.acquireSessionLock).toHaveBeenCalledWith("session_test_123");
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_test_123");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return ConcurrentMessageError when lock is contended", () =>
			Effect.gen(function* () {
				mockSessionRepo.acquireSessionLock.mockReturnValue(
					Effect.fail(
						new ConcurrentMessageError({
							sessionId: "session_test_123",
							message: "Another message is being processed",
						}),
					),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("ConcurrentMessageError");
				}
				// No side effects should have occurred
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should release lock even when pipeline fails (Nerin error)", () =>
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

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(mockSessionRepo.acquireSessionLock).toHaveBeenCalledWith("session_test_123");
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_test_123");
				// Verify acquire happens before release (ordering guarantee)
				const acquireOrder = mockSessionRepo.acquireSessionLock.mock.invocationCallOrder[0] ?? 0;
				const releaseOrder = mockSessionRepo.releaseSessionLock.mock.invocationCallOrder[0] ?? 0;
				expect(acquireOrder).toBeLessThan(releaseOrder);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Cost tracking & rate limiting (Story 10.6)", () => {
		describe("Budget enforcement (AC #2)", () => {
			it.effect("should proceed when daily budget check passes", () =>
				Effect.gen(function* () {
					// checkDailyBudget returns void (passes) by default in beforeEach

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Budget check pass",
						userId: "user_456",
					});

					expect(result.response).toBe(mockNerinResponse.response);
					expect(mockCostGuardRepo.checkDailyBudget).toHaveBeenCalledWith("user_456", 7500);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should fail with CostLimitExceeded when daily cost at limit", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkDailyBudget.mockReturnValue(
						Effect.fail(
							new CostLimitExceeded({
								dailySpend: 7500,
								limit: 7500,
								resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-24T00:00:00Z")),
								message: "Daily cost limit exceeded",
							}),
						),
					);

					const exit = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Over budget",
						userId: "user_456",
					}).pipe(Effect.exit);

					expect(exit._tag).toBe("Failure");
					if (exit._tag === "Failure") {
						expect(String(exit.cause)).toContain("CostLimitExceeded");
					}
					// No side effects after budget check failure
					expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should fail with CostLimitExceeded including correct resumeAfter", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkDailyBudget.mockReturnValue(
						Effect.fail(
							new CostLimitExceeded({
								dailySpend: 7500,
								limit: 7500,
								resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-24T00:00:00Z")),
								message: "Daily cost limit exceeded",
							}),
						),
					);

					const exit = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Over budget",
						userId: "user_456",
					}).pipe(Effect.exit);

					expect(exit._tag).toBe("Failure");
					if (exit._tag === "Failure") {
						const failure = Cause.failureOption(exit.cause);
						expect(Option.isSome(failure)).toBe(true);
						if (Option.isSome(failure)) {
							const error = failure.value as CostLimitExceeded;
							expect(error.resumeAfter).toBeDefined();
						}
					}
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Cost tracking (AC #1)", () => {
			it.effect("should track Nerin + conversanalyzer cost after successful message", () =>
				Effect.gen(function* () {
					// Post-cold-start: both Nerin and conversanalyzer run
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));

					yield* sendMessage({
						sessionId: "session_test_123",
						message: "I work in tech",
						userId: "user_456",
					});

					// incrementDailyCost called with combined cost from Nerin + conversanalyzer
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"user_456",
						expect.any(Number),
					);
					const costArg = mockCostGuardRepo.incrementDailyCost.mock.calls[0][1];
					expect(costArg).toBeGreaterThan(0);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should track only Nerin cost during cold start", () =>
				Effect.gen(function* () {
					// Cold start: no conversanalyzer
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Hello",
						userId: "user_456",
					});

					// Only Nerin cost tracked (no conversanalyzer during cold start)
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"user_456",
						expect.any(Number),
					);
					const costArg = mockCostGuardRepo.incrementDailyCost.mock.calls[0][1];
					expect(costArg).toBeGreaterThan(0);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Message rate limiting (AC #3)", () => {
			it.effect("should fail with MessageRateLimitError when rate limit exceeded", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(
						Effect.fail(new MessageRateLimitError({ retryAfter: 45, message: "Too many messages" })),
					);

					const exit = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Rate limited",
						userId: "user_456",
					}).pipe(Effect.exit);

					expect(exit._tag).toBe("Failure");
					if (exit._tag === "Failure") {
						expect(String(exit.cause)).toContain("MessageRateLimitError");
					}
					expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Anonymous cost key (AC #6)", () => {
			it.effect("should use sessionId as cost key when userId is undefined", () =>
				Effect.gen(function* () {
					yield* sendMessage({
						sessionId: "session_test_123",
						message: "Anonymous message",
						// No userId — anonymous
					});

					// Should use sessionId as cost key for anonymous users
					expect(mockCostGuardRepo.checkDailyBudget).toHaveBeenCalledWith("session_test_123", 7500);
					expect(mockCostGuardRepo.checkMessageRateLimit).toHaveBeenCalledWith("session_test_123");
					expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalledWith(
						"session_test_123",
						expect.any(Number),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});

		describe("Fail-open resilience (AC #2, #4)", () => {
			it.effect("should proceed when Redis budget check fails", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkDailyBudget.mockReturnValue(
						Effect.fail(new RedisOperationError("Connection refused")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis down",
						userId: "user_456",
					});

					// Fail-open: message should still proceed
					expect(result.response).toBe(mockNerinResponse.response);
					expect(mockLoggerRepo.error).toHaveBeenCalledWith(
						expect.stringContaining("Redis"),
						expect.any(Object),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should proceed when Redis rate limit check fails", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(
						Effect.fail(new RedisOperationError("Connection refused")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis rate limit down",
						userId: "user_456",
					});

					// Fail-open: message should still proceed
					expect(result.response).toBe(mockNerinResponse.response);
					expect(mockLoggerRepo.error).toHaveBeenCalledWith(
						expect.stringContaining("Redis"),
						expect.any(Object),
					);
				}).pipe(Effect.provide(createTestLayer())),
			);

			it.effect("should proceed when Redis cost increment fails", () =>
				Effect.gen(function* () {
					mockCostGuardRepo.incrementDailyCost.mockReturnValue(
						Effect.fail(new RedisOperationError("Write timeout")),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "Redis write fail",
						userId: "user_456",
					});

					// Fail-open: message should still succeed
					expect(result.response).toBe(mockNerinResponse.response);
				}).pipe(Effect.provide(createTestLayer())),
			);
		});
	});

	describe("Farewell winding-down (Story 10.5)", () => {
		it.effect("should pass nearingEnd to Nerin when user messages >= threshold - 3", () =>
			Effect.gen(function* () {
				// Simulate many user messages (threshold - 3 = 22 user messages)
				const manyUserMessages = Array.from({ length: FREE_TIER_MESSAGE_THRESHOLD - 3 }, (_, i) => [
					{
						id: `msg_a_${i}`,
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: `Response ${i}`,
						createdAt: new Date(),
					},
					{
						id: `msg_u_${i}`,
						sessionId: "session_test_123",
						role: "user" as const,
						content: `Message ${i}`,
						createdAt: new Date(),
					},
				]).flat();
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(manyUserMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Late message",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.nearingEnd).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should NOT pass nearingEnd when user messages < threshold - 3", () =>
			Effect.gen(function* () {
				// Cold start: 1 user message — well below threshold - 3
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Early message",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.nearingEnd).toBe(false);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
