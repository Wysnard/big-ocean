/**
 * Nerin Pipeline Tests — Director Model Pipeline (Story 43-5)
 *
 * Tests the 4-step Director model pipeline:
 * 1. Evidence extraction (three-tier fail-open)
 * 2. Coverage analysis (pure function)
 * 3. Nerin Director (LLM — generates brief)
 * 4. Nerin Actor (LLM — voices brief as Nerin)
 *
 * Uses vi.fn() mock pattern.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	AppConfig,
	ConversanalyzerError,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	ConversationRepository,
	CostGuardRepository,
	ExchangeRepository,
	LoggerRepository,
	MessageRepository,
	NerinActorRepository,
	NerinDirectorError,
	NerinDirectorRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { runNerinPipeline } from "../nerin-pipeline";

// ---- Mock Repos ----

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
	findDropOffSessions: vi.fn(),
	markDropOffEmailSent: vi.fn(),
	createExtensionSession: vi.fn(),
	findCompletedSessionWithoutChild: vi.fn(),
	hasExtensionSession: vi.fn(),
	findExtensionSession: vi.fn(),
};

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessagesByUserId: vi.fn(),
	getMessageCount: vi.fn(),
	updateExchangeId: vi.fn(),
};

const mockExchangeRepo = {
	create: vi.fn(),
	update: vi.fn(),
	findBySession: vi.fn(),
	findByUserId: vi.fn(),
};

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockDirectorRepo = {
	generateBrief: vi.fn(),
};

const mockActorRepo = {
	invoke: vi.fn(),
};

const mockConversanalyzerRepo = {
	analyzeEvidence: vi.fn(),
	analyzeEvidenceLenient: vi.fn(),
};

const mockEvidenceRepo = {
	save: vi.fn(),
	findBySession: vi.fn(),
	findByUserId: vi.fn(),
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
	checkAndRecordGlobalAssessmentStart: vi.fn(),
	incrementSessionCost: vi.fn(),
	getSessionCost: vi.fn(),
	checkSessionBudget: vi.fn(),
};

// ---- Test Data ----

const mockDirectorResponse = {
	brief:
		"Observation: They mentioned getting lost in problems. Connection: That absorption pattern. Question: Ask about losing track of time with another person. Warm, medium length.",
	tokenUsage: { input: 500, output: 80 },
};

const mockActorResponse = {
	response:
		"That thing you said about getting lost in problems... I notice that too, in the way currents pull you somewhere before you realize.",
	tokenCount: { input: 100, output: 50, total: 150 },
};

const mockConversanalyzerOutput = {
	evidence: [
		{
			bigfiveFacet: "imagination" as const,
			deviation: 2,
			polarity: "high" as const,
			strength: "strong" as const,
			confidence: "high" as const,
			domain: "work" as const,
			note: "Creative thinking",
		},
		{
			bigfiveFacet: "trust" as const,
			deviation: 1,
			polarity: "high" as const,
			strength: "moderate" as const,
			confidence: "medium" as const,
			domain: "relationships" as const,
			note: "Trusting nature",
		},
	],
	tokenUsage: { input: 200, output: 50 },
};

/** Opener exchange (turn 0) — created by start-assessment */
const openerExchangeRecord = {
	id: "exchange_opener",
	sessionId: "session_test_123",
	turnNumber: 0,
	extractionTier: null,
	directorOutput: null,
	coverageTargets: null,
	createdAt: new Date(),
};

const mockExchangeRecord = {
	id: "exchange_1",
	sessionId: "session_test_123",
	turnNumber: 1,
	extractionTier: null,
	directorOutput: null,
	coverageTargets: null,
	createdAt: new Date(),
};

/** Turn 1 messages: just the greeting, no prior user messages */
const turn1Messages = [
	{
		id: "msg_1",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Hi! I'm Nerin.",
		createdAt: new Date(),
	},
];

/** Post-cold-start messages: multiple exchanges already happened */
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
		role: "user" as const,
		content: "Hello there",
		createdAt: new Date(),
	},
	{
		id: "msg_3",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Tell me more about your mornings.",
		createdAt: new Date(),
	},
	{
		id: "msg_4",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "I usually wake up early and go for a run before work",
		createdAt: new Date(),
	},
	{
		id: "msg_5",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "That sounds like a solid routine.",
		createdAt: new Date(),
	},
	{
		id: "msg_6",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "I also like painting on weekends",
		createdAt: new Date(),
	},
	{
		id: "msg_7",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Creative expression is fascinating.",
		createdAt: new Date(),
	},
	{
		id: "msg_8",
		sessionId: "session_test_123",
		role: "user" as const,
		content: "I work in tech and enjoy solving complex problems",
		createdAt: new Date(),
	},
];

/** Post-cold-start exchange records (includes opener at turn 0) */
const postColdStartExchanges = [
	{ ...openerExchangeRecord },
	{
		...mockExchangeRecord,
		id: "ex_1",
		turnNumber: 1,
		extractionTier: 1,
		directorOutput: "Explore daily routines",
		coverageTargets: {
			primaryFacet: "imagination",
			candidateDomains: ["work", "relationships", "leisure"],
		},
	},
	{
		...mockExchangeRecord,
		id: "ex_2",
		turnNumber: 2,
		extractionTier: 1,
		directorOutput: "Continue exploring daily routines",
		coverageTargets: {
			primaryFacet: "orderliness",
			candidateDomains: ["work", "health", "family"],
		},
	},
	{
		...mockExchangeRecord,
		id: "ex_3",
		turnNumber: 3,
		extractionTier: 1,
		directorOutput: "Explore creative pursuits",
		coverageTargets: {
			primaryFacet: "imagination",
			candidateDomains: ["leisure", "relationships", "health"],
		},
	},
];

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
	portraitGeneratorModelId: "claude-sonnet-4-20250514",
	messageRateLimit: 2,
	polarAccessToken: Redacted.make("test-polar-access-token"),
	polarWebhookSecret: Redacted.make("test-polar-webhook-secret"),
	polarProductPortraitUnlock: "polar_product_portrait",
	polarProductRelationshipSingle: "polar_product_single",
	polarProductRelationship5Pack: "polar_product_5pack",
	polarProductExtendedConversation: "polar_product_extended",
	globalDailyAssessmentLimit: 100,
	minEvidenceWeight: 0.36,
	// Cost Guard (Story 31-6)
	sessionCostLimitCents: 2000,
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AppConfig, mockConfig),
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(MessageRepository, mockMessageRepo),
		Layer.succeed(ExchangeRepository, mockExchangeRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(NerinDirectorRepository, mockDirectorRepo),
		Layer.succeed(NerinActorRepository, mockActorRepo),
		Layer.succeed(ConversanalyzerRepository, mockConversanalyzerRepo),
		Layer.succeed(ConversationEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
	);

function setupDefaultMocks() {
	mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(1));
	mockSessionRepo.updateSession.mockReturnValue(Effect.succeed({}));
	// Default: non-extension session (no parentSessionId)
	mockSessionRepo.getSession.mockReturnValue(
		Effect.succeed({
			id: "session_test_123",
			userId: null,
			sessionToken: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			status: "active",
			finalizationProgress: null,
			messageCount: 0,
		}),
	);

	mockMessageRepo.saveMessage.mockReturnValue(
		Effect.succeed({
			id: "saved_msg_id",
			sessionId: "session_test_123",
			role: "user",
			content: "test",
			createdAt: new Date(),
		}),
	);
	mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(turn1Messages));

	mockMessageRepo.getMessagesByUserId.mockReturnValue(Effect.succeed(turn1Messages));
	mockMessageRepo.updateExchangeId.mockReturnValue(Effect.succeed(undefined));

	mockExchangeRepo.create.mockReturnValue(Effect.succeed(mockExchangeRecord));
	mockExchangeRepo.update.mockReturnValue(Effect.succeed(mockExchangeRecord));
	// Default: opener exchange exists (created by start-assessment)
	mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed([openerExchangeRecord]));
	mockExchangeRepo.findByUserId.mockReturnValue(Effect.succeed([openerExchangeRecord]));

	mockLoggerRepo.info.mockImplementation(() => {});
	mockLoggerRepo.error.mockImplementation(() => {});
	mockLoggerRepo.warn.mockImplementation(() => {});
	mockLoggerRepo.debug.mockImplementation(() => {});

	mockDirectorRepo.generateBrief.mockReturnValue(Effect.succeed(mockDirectorResponse));
	mockActorRepo.invoke.mockReturnValue(Effect.succeed(mockActorResponse));

	mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
		Effect.succeed({
			evidence: mockConversanalyzerOutput.evidence,
			tokenUsage: { input: 100, output: 25 },
		}),
	);
	mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
		Effect.succeed({
			evidence: mockConversanalyzerOutput.evidence,
			tokenUsage: { input: 100, output: 25 },
		}),
	);

	mockEvidenceRepo.save.mockReturnValue(Effect.succeed(undefined));
	mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed([]));
	mockEvidenceRepo.findByUserId.mockReturnValue(Effect.succeed([]));
	mockEvidenceRepo.countByMessage.mockReturnValue(Effect.succeed(0));

	mockCostGuardRepo.checkDailyBudget.mockReturnValue(Effect.void);
	mockCostGuardRepo.incrementDailyCost.mockReturnValue(Effect.succeed(1));
	mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(Effect.void);
	mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(Effect.void);
	mockCostGuardRepo.incrementSessionCost.mockReturnValue(Effect.succeed(1));
	mockCostGuardRepo.getSessionCost.mockReturnValue(Effect.succeed(0));
	mockCostGuardRepo.checkSessionBudget.mockReturnValue(Effect.void);
}

describe("Nerin Pipeline - Director Model (Story 43-5)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("4-step sequential pipeline", () => {
		it.effect("runs evidence -> coverage -> Director -> Actor on a normal turn", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(turn1Messages));

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				expect(result.response).toBeDefined();
				expect(result.response).toBe(mockActorResponse.response);

				// Evidence extraction happened
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);

				// Director was called
				expect(mockDirectorRepo.generateBrief).toHaveBeenCalledTimes(1);
				const directorCall = mockDirectorRepo.generateBrief.mock.calls[0]?.[0];
				expect(directorCall?.sessionId).toBe("session_test_123");
				expect(directorCall?.systemPrompt).toBeDefined();
				expect(directorCall?.messages).toBeDefined();
				expect(directorCall?.coverageTargets).toBeDefined();
				expect(directorCall?.coverageTargets.primaryFacet).toBeDefined();
				expect(directorCall?.coverageTargets.candidateDomains).toBeDefined();

				// Actor was called with the Director's brief
				expect(mockActorRepo.invoke).toHaveBeenCalledTimes(1);
				const actorCall = mockActorRepo.invoke.mock.calls[0]?.[0];
				expect(actorCall?.sessionId).toBe("session_test_123");
				expect(actorCall?.actorPrompt).toBeDefined();
				expect(actorCall?.directorBrief).toBe(mockDirectorResponse.brief);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("creates exchange and saves messages with correct exchange linking", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(turn1Messages));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				// New exchange should be created for turn 1
				expect(mockExchangeRepo.create).toHaveBeenCalledTimes(1);
				expect(mockExchangeRepo.create).toHaveBeenCalledWith("session_test_123", 1);

				// Exchange updated with director_output, coverage_targets, and extraction_tier
				expect(mockExchangeRepo.update).toHaveBeenCalled();

				// saveMessage is called twice: once for user, once for assistant
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledTimes(2);

				// User message linked to previous (opener) exchange
				const userSaveCall = mockMessageRepo.saveMessage.mock.calls[0];
				expect(userSaveCall?.[1]).toBe("user");
				expect(userSaveCall?.[3]).toBe("exchange_opener"); // opener exchangeId

				// Assistant message linked to new exchange
				const assistantSaveCall = mockMessageRepo.saveMessage.mock.calls[1];
				expect(assistantSaveCall?.[1]).toBe("assistant");
				expect(assistantSaveCall?.[3]).toBe("exchange_1"); // new exchangeId
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("saves director_output and coverage_targets on the exchange", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Find the update call that contains directorOutput
				const updateCalls = mockExchangeRepo.update.mock.calls;
				const directorUpdateCall = updateCalls.find(
					(call: unknown[]) =>
						call[1] && typeof (call[1] as Record<string, unknown>).directorOutput === "string",
				);
				expect(directorUpdateCall).toBeDefined();
				const updateData = directorUpdateCall?.[1] as Record<string, unknown>;
				expect(updateData.directorOutput).toBe(mockDirectorResponse.brief);
				expect(updateData.coverageTargets).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Closing turn", () => {
		it.effect("uses closing Director prompt and appends farewell on final turn", () =>
			Effect.gen(function* () {
				// Set up final turn: messageCount returns threshold AND turnNumber >= totalTurns
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(25));
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));

				// Create 25 prior exchanges (opener + 24 pipeline turns) so turnNumber = 25
				const finalTurnExchanges = [
					openerExchangeRecord,
					...Array.from({ length: 24 }, (_, i) => ({
						...mockExchangeRecord,
						id: `ex_${i + 1}`,
						turnNumber: i + 1,
						extractionTier: 1,
						directorOutput: `Brief for turn ${i + 1}`,
						coverageTargets: {
							primaryFacet: "imagination",
							candidateDomains: ["work", "relationships", "leisure"],
						},
					})),
				];
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(finalTurnExchanges));

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Final message",
				});

				expect(result.isFinalTurn).toBe(true);

				// Director should have been called with closing prompt
				const directorCall = mockDirectorRepo.generateBrief.mock.calls[0]?.[0];
				expect(directorCall?.systemPrompt).toContain("final exchange");

				// Farewell message should be present
				expect(result.surfacingMessage).toBeDefined();
				expect(typeof result.surfacingMessage).toBe("string");

				// Farewell message should be saved to DB
				// saveMessage called 3 times: user + actor response + farewell
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledTimes(3);

				// Session transitioned to "finalizing"
				expect(mockSessionRepo.updateSession).toHaveBeenCalledWith("session_test_123", {
					status: "finalizing",
				});
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Fail-open resilience", () => {
		it.effect("handles ConversAnalyzer failure non-fatally — falls back to Tier 2 (Story 24-2)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));
				// Fail strict calls — lenient methods succeed from default setup
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
					Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
				);

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Pipeline should still succeed
				expect(result.response).toBeDefined();

				// Director and Actor should have been called
				expect(mockDirectorRepo.generateBrief).toHaveBeenCalledTimes(1);
				expect(mockActorRepo.invoke).toHaveBeenCalledTimes(1);

				// Tier 2 warning was logged
				expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
					expect.stringContaining("fell back to Tier 2"),
					expect.objectContaining({ sessionId: "session_test_123" }),
				);

				// Evidence IS saved from Tier 2 lenient fallback (evidence above weight threshold)
				expect(mockEvidenceRepo.save).toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"handles all ConversAnalyzer tiers failing — Tier 3 neutral defaults, pipeline continues",
			() =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
					mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));
					const llmError = Effect.fail(new ConversanalyzerError({ message: "LLM timeout" }));
					mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(llmError);
					mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(llmError);

					const result = yield* runNerinPipeline({
						sessionId: "session_test_123",
						userMessage: "I work in tech",
					});

					// Pipeline should still succeed — Director and Actor still called
					expect(result.response).toBeDefined();
					expect(mockDirectorRepo.generateBrief).toHaveBeenCalledTimes(1);
					expect(mockActorRepo.invoke).toHaveBeenCalledTimes(1);

					// Tier 3 warning was logged
					expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
						expect.stringContaining("failed at all tiers"),
						expect.objectContaining({ sessionId: "session_test_123" }),
					);

					// Evidence should NOT be saved (neutral defaults have empty evidence)
					expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("propagates Director failure to the caller", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				mockDirectorRepo.generateBrief.mockReturnValue(
					Effect.fail(
						new NerinDirectorError({
							message: "Director LLM call failed after retry",
							sessionId: "session_test_123",
						}),
					),
				);

				const exit = yield* Effect.exit(
					runNerinPipeline({
						sessionId: "session_test_123",
						userMessage: "I work in tech",
					}),
				);

				// Should have failed
				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Evidence idempotency on retry (AC-2)", () => {
		it.effect("skips extraction if evidence already exists for this exchange", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				// Evidence already exists for the previous exchange (retry scenario)
				mockEvidenceRepo.countByMessage.mockReturnValue(Effect.succeed(2));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Extraction should be skipped (no ConversAnalyzer calls)
				expect(mockConversanalyzerRepo.analyzeEvidence).not.toHaveBeenCalled();

				// Director and Actor should still be called
				expect(mockDirectorRepo.generateBrief).toHaveBeenCalledTimes(1);
				expect(mockActorRepo.invoke).toHaveBeenCalledTimes(1);

				// Evidence should NOT be saved again
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Cost tracking (AC-8)", () => {
		it.effect("tracks cost from evidence extraction + Director + Actor", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Cost should be tracked (incrementDailyCost called)
				expect(mockCostGuardRepo.incrementDailyCost).toHaveBeenCalled();
				expect(mockCostGuardRepo.incrementSessionCost).toHaveBeenCalled();

				// Cost logged includes Director info
				const costLog = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Cost tracked",
				);
				expect(costLog).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Polarity passthrough", () => {
		it.effect("saves evidence with polarity field when present", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I like helping people",
				});

				// Evidence should be saved
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);

				// Verify polarity is included in saved evidence
				const savedEvidence = mockEvidenceRepo.save.mock.calls[0]?.[0];
				expect(savedEvidence).toBeDefined();
				expect(savedEvidence.length).toBeGreaterThan(0);
				for (const record of savedEvidence) {
					expect(record).toHaveProperty("polarity");
					expect(["high", "low"]).toContain(record.polarity);
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Observability logging", () => {
		it.effect("logs Director model pipeline state", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Check that pipeline state was logged
				const pipelineLog = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Director pipeline computed",
				);
				expect(pipelineLog).toBeDefined();
				const pipelineData = pipelineLog?.[1];
				expect(pipelineData).toHaveProperty("turnNumber");
				expect(pipelineData).toHaveProperty("primaryFacet");
				expect(pipelineData).toHaveProperty("candidateDomains");

				// Check "Message processed" log
				const processedLogCall = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Message processed",
				);
				expect(processedLogCall).toBeDefined();
				const processedData = processedLogCall?.[1];
				expect(processedData).toHaveProperty("evidenceCount");
				expect(processedData).toHaveProperty("exchangeId");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Split extraction compatibility (Story 42-2)", () => {
		it.effect("split extraction calls receive the same input shape as before", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I like helping people",
				});

				// Evidence extraction receives the correct input shape
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
				const evidenceInput = mockConversanalyzerRepo.analyzeEvidence.mock.calls[0]?.[0];
				expect(evidenceInput).toHaveProperty("message");
				expect(evidenceInput).toHaveProperty("recentMessages");
				expect(evidenceInput).toHaveProperty("domainDistribution");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});

// ─── Extension Session Tests (Story 36-2) ───────────────────────────

/** Parent session's final exchange with populated Director model state */
const parentFinalExchange = {
	...mockExchangeRecord,
	id: "parent_ex_final",
	sessionId: "parent_session_id",
	turnNumber: 25,
	extractionTier: 1,
	directorOutput: "Final turn brief: bold observation about user patterns",
	coverageTargets: {
		primaryFacet: "imagination",
		candidateDomains: ["work", "relationships", "leisure"],
	},
};

const parentExchangeHistory = [
	{ ...openerExchangeRecord, sessionId: "parent_session_id" },
	{
		...mockExchangeRecord,
		id: "parent_ex_1",
		sessionId: "parent_session_id",
		turnNumber: 1,
		extractionTier: 1,
		directorOutput: "Explore daily routines",
		coverageTargets: {
			primaryFacet: "imagination",
			candidateDomains: ["work", "relationships", "leisure"],
		},
	},
	{
		...mockExchangeRecord,
		id: "parent_ex_2",
		sessionId: "parent_session_id",
		turnNumber: 2,
		extractionTier: 1,
		directorOutput: "Explore creative pursuits",
		coverageTargets: {
			primaryFacet: "orderliness",
			candidateDomains: ["work", "health", "family"],
		},
	},
	parentFinalExchange,
];

const parentEvidence = [
	{
		id: "ev_parent_1",
		sessionId: "parent_session_id",
		messageId: "msg_parent_1",
		exchangeId: "parent_ex_1",
		bigfiveFacet: "imagination" as const,
		deviation: 2,
		strength: "strong" as const,
		confidence: "high" as const,
		domain: "work" as const,
		note: "Creative thinking",
		createdAt: new Date(),
	},
	{
		id: "ev_parent_2",
		sessionId: "parent_session_id",
		messageId: "msg_parent_2",
		exchangeId: "parent_ex_2",
		bigfiveFacet: "orderliness" as const,
		deviation: -1,
		strength: "moderate" as const,
		confidence: "medium" as const,
		domain: "work" as const,
		note: "Flexible approach",
		createdAt: new Date(),
	},
];

describe("Extension Session Pipeline (Story 36-2)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it.effect("uses user-level queries for extension sessions with userId", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					id: "extension_session_id",
					userId: "user_123",
					status: "active",
					messageCount: 0,
					parentSessionId: "parent_session_id",
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			);

			// All user exchanges (parent + extension)
			mockExchangeRepo.findByUserId.mockReturnValue(
				Effect.succeed([...parentExchangeHistory, openerExchangeRecord]),
			);
			mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed([openerExchangeRecord]));

			// All user evidence
			mockEvidenceRepo.findByUserId.mockReturnValue(Effect.succeed(parentEvidence));

			// All user messages
			mockMessageRepo.getMessagesByUserId.mockReturnValue(
				Effect.succeed([
					...turn1Messages,
					{
						id: "ext_msg",
						sessionId: "extension_session_id",
						role: "assistant" as const,
						content: "Welcome back!",
						createdAt: new Date(),
					},
				]),
			);

			const result = yield* runNerinPipeline({
				sessionId: "extension_session_id",
				userId: "user_123",
				userMessage: "Hello again",
			});

			expect(result.response).toBeDefined();

			// Verify user-level queries were used
			expect(mockMessageRepo.getMessagesByUserId).toHaveBeenCalledWith("user_123");
			expect(mockEvidenceRepo.findByUserId).toHaveBeenCalledWith("user_123");
			expect(mockExchangeRepo.findByUserId).toHaveBeenCalledWith("user_123");

			// Verify extension context was logged
			const extensionLog = mockLoggerRepo.info.mock.calls.find(
				(call: unknown[]) => call[0] === "Extension session context loaded",
			);
			expect(extensionLog).toBeDefined();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("handles missing parent session data gracefully via user-level fallback", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					id: "extension_session_id",
					userId: "user_123",
					status: "active",
					messageCount: 0,
					parentSessionId: "deleted_parent_id",
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			);

			// User-level queries succeed (even if parent session is gone)
			mockExchangeRepo.findByUserId.mockReturnValue(Effect.succeed([openerExchangeRecord]));
			mockEvidenceRepo.findByUserId.mockReturnValue(Effect.succeed([]));
			mockMessageRepo.getMessagesByUserId.mockReturnValue(Effect.succeed(turn1Messages));

			const result = yield* runNerinPipeline({
				sessionId: "extension_session_id",
				userId: "user_123",
				userMessage: "Hello",
			});

			expect(result.response).toBeDefined();
		}).pipe(Effect.provide(createTestLayer())),
	);
});

describe("User-level context loading (Story 36-2 refactor)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const parentMessages = [
		{
			id: "parent_msg_1",
			sessionId: "parent_session",
			role: "assistant" as const,
			content: "Hi! I'm Nerin.",
			createdAt: new Date("2026-03-01T10:00:00Z"),
		},
		{
			id: "parent_msg_2",
			sessionId: "parent_session",
			role: "user" as const,
			content: "I love painting on weekends",
			createdAt: new Date("2026-03-01T10:01:00Z"),
		},
		{
			id: "parent_msg_3",
			sessionId: "parent_session",
			role: "assistant" as const,
			content: "That sounds wonderful.",
			createdAt: new Date("2026-03-01T10:02:00Z"),
		},
	];

	const extensionMessages = [
		{
			id: "ext_msg_1",
			sessionId: "extension_session",
			role: "assistant" as const,
			content: "Welcome back!",
			createdAt: new Date("2026-03-15T10:00:00Z"),
		},
	];

	it.effect("loads all user messages across sessions for authenticated users", () =>
		Effect.gen(function* () {
			const allMessages = [...parentMessages, ...extensionMessages];
			mockMessageRepo.getMessagesByUserId.mockReturnValue(Effect.succeed(allMessages));
			mockExchangeRepo.findByUserId.mockReturnValue(Effect.succeed([openerExchangeRecord]));
			mockEvidenceRepo.findByUserId.mockReturnValue(Effect.succeed([]));

			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					id: "extension_session",
					userId: "user_123",
					parentSessionId: "parent_session",
					status: "active",
					messageCount: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			);

			const result = yield* runNerinPipeline({
				sessionId: "extension_session",
				userId: "user_123",
				userMessage: "Tell me more about creativity",
			});

			expect(result.response).toBeDefined();

			// Verify getMessagesByUserId was called with userId
			expect(mockMessageRepo.getMessagesByUserId).toHaveBeenCalledWith("user_123");
			// Verify findByUserId was called for evidence and exchanges
			expect(mockEvidenceRepo.findByUserId).toHaveBeenCalledWith("user_123");
			expect(mockExchangeRepo.findByUserId).toHaveBeenCalledWith("user_123");

			// Verify Director received all messages (parent + extension + current)
			const directorCall = mockDirectorRepo.generateBrief.mock.calls[0]?.[0];
			expect(directorCall?.messages).toHaveLength(5); // 3 parent + 1 extension + 1 current
			expect(directorCall?.messages[0]?.content).toBe("Hi! I'm Nerin.");
			expect(directorCall?.messages[1]?.content).toBe("I love painting on weekends");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("falls back to session-scoped queries for anonymous users", () =>
		Effect.gen(function* () {
			// No userId — should use session-scoped queries
			const result = yield* runNerinPipeline({
				sessionId: "session_test_123",
				userMessage: "Hello",
			});

			expect(result.response).toBeDefined();

			// Verify session-scoped queries were used (not user-level)
			expect(mockMessageRepo.getMessagesByUserId).not.toHaveBeenCalled();
			expect(mockMessageRepo.getMessages).toHaveBeenCalledWith("session_test_123");
			expect(mockEvidenceRepo.findByUserId).not.toHaveBeenCalled();
			expect(mockEvidenceRepo.findBySession).toHaveBeenCalledWith("session_test_123");
			expect(mockExchangeRepo.findByUserId).not.toHaveBeenCalled();
			expect(mockExchangeRepo.findBySession).toHaveBeenCalledWith("session_test_123");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("falls back to session-scoped if user-level queries fail", () =>
		Effect.gen(function* () {
			// Make user-level queries fail
			mockMessageRepo.getMessagesByUserId.mockReturnValue(
				Effect.fail({ _tag: "DatabaseError", message: "Query failed" }),
			);
			mockEvidenceRepo.findByUserId.mockReturnValue(
				Effect.fail({ _tag: "ConversationEvidenceError", message: "Query failed" }),
			);
			mockExchangeRepo.findByUserId.mockReturnValue(
				Effect.fail({ _tag: "DatabaseError", message: "Query failed" }),
			);

			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({
					id: "session_test_123",
					userId: "user_123",
					status: "active",
					messageCount: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			);

			const result = yield* runNerinPipeline({
				sessionId: "session_test_123",
				userId: "user_123",
				userMessage: "Hello",
			});

			expect(result.response).toBeDefined();

			// User-level was attempted but failed, session-level should have been used as fallback
			expect(mockMessageRepo.getMessagesByUserId).toHaveBeenCalledWith("user_123");
			expect(mockMessageRepo.getMessages).toHaveBeenCalledWith("session_test_123");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
