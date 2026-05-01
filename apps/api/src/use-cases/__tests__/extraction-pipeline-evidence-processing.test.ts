/**
 * Extraction Pipeline & Evidence Processing Tests (Story 31-8)
 *
 * Consolidation tests that verify all acceptance criteria from Epic Story 2.8 (FR14):
 * - AC1: Sequential execution + dual extraction output
 * - AC2: Three-tier retry (covered by three-tier-extraction.test.ts)
 * - AC3: Exchange row persistence with 1-indexed turns
 * - AC4: Dual-facet extraction prompt instructions
 * - AC5: Extraction tier stored on exchange (energy/telling removed in Story 43-1)
 * - AC6: Fail-open on complete failure (covered by nerin-pipeline.test.ts)
 *
 * Tests here focus on gaps not already covered by existing test suites.
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
	hasEvidenceForExchange: vi.fn(),
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
		"Observation: They mentioned solving puzzles. Question: Ask about challenges at work. Warm, medium length.",
	tokenUsage: { input: 500, output: 80 },
};

const mockActorResponse = {
	response: "Tell me about how you approach challenges at work.",
	tokenCount: { input: 100, output: 50, total: 150 },
};

/** ConversAnalyzer evidence extraction output */
const mockConversanalyzerEvidenceOutput = {
	evidence: [
		{
			bigfiveFacet: "imagination" as const,
			deviation: 2,
			polarity: "high" as const,
			strength: "strong" as const,
			confidence: "high" as const,
			domain: "work" as const,
			note: "Creative problem-solving approach",
		},
		{
			bigfiveFacet: "anxiety" as const,
			deviation: -1,
			polarity: "low" as const,
			strength: "moderate" as const,
			confidence: "medium" as const,
			domain: "work" as const,
			note: "Below-average worry about career uncertainty",
		},
	],
	tokenUsage: { input: 200, output: 50 },
};

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

const turn1Messages = [
	{
		id: "msg_1",
		sessionId: "session_test_123",
		role: "assistant" as const,
		content: "Hi! I'm Nerin.",
		createdAt: new Date(),
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
	assessmentTurnCount: 15,
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
	mockSessionRepo.getSession.mockReturnValue(
		Effect.succeed({
			id: "session_test_123",
			userId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			status: "active",
			finalizationProgress: null,
			messageCount: 0,
		}),
	);
	mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(1));
	mockSessionRepo.updateSession.mockReturnValue(Effect.succeed({}));

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
			evidence: mockConversanalyzerEvidenceOutput.evidence,
			tokenUsage: { input: 100, output: 25 },
		}),
	);
	mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
		Effect.succeed({
			evidence: mockConversanalyzerEvidenceOutput.evidence,
			tokenUsage: { input: 100, output: 25 },
		}),
	);

	mockEvidenceRepo.save.mockReturnValue(Effect.succeed(undefined));
	mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed([]));
	mockEvidenceRepo.findByUserId.mockReturnValue(Effect.succeed([]));
	mockEvidenceRepo.hasEvidenceForExchange.mockReturnValue(Effect.succeed(false));

	mockCostGuardRepo.checkDailyBudget.mockReturnValue(Effect.void);
	mockCostGuardRepo.incrementDailyCost.mockReturnValue(Effect.succeed(1));
	mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(Effect.void);
	mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(Effect.void);
	mockCostGuardRepo.incrementSessionCost.mockReturnValue(Effect.succeed(1));
	mockCostGuardRepo.getSessionCost.mockReturnValue(Effect.succeed(0));
	mockCostGuardRepo.checkSessionBudget.mockReturnValue(Effect.void);
}

// ---- Tests ----

describe("Extraction Pipeline & Evidence Processing (Story 31-8)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("AC1: Dual Extraction Output Shape", () => {
		it.effect("extraction produces both userState and evidence fields", () =>
			Effect.gen(function* () {
				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I love solving complex puzzles at work",
				});

				// ConversAnalyzer evidence extraction should have been called
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);

				// Story 43-1: energy/telling fields removed from exchange table.
				// Only extractionTier is persisted on the exchange now.
				const extractionUpdate = mockExchangeRepo.update.mock.calls[0]?.[1];
				expect(extractionUpdate).toBeDefined();

				// evidence was saved separately
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedEvidence = mockEvidenceRepo.save.mock.calls[0]?.[0];
				expect(savedEvidence).toHaveLength(2);

				// Verify evidence items have required fields
				const firstEvidence = savedEvidence[0];
				expect(firstEvidence).toHaveProperty("bigfiveFacet", "imagination");
				expect(firstEvidence).toHaveProperty("deviation", 2);
				expect(firstEvidence).toHaveProperty("strength", "strong");
				expect(firstEvidence).toHaveProperty("confidence", "high");
				expect(firstEvidence).toHaveProperty("domain", "work");
				expect(firstEvidence).toHaveProperty("note");
				expect(firstEvidence).toHaveProperty("sessionId", "session_test_123");
				expect(firstEvidence).toHaveProperty("messageId", "saved_msg_id");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("dual extraction includes negative deviation evidence", () =>
			Effect.gen(function* () {
				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I handle uncertainty well",
				});

				const savedEvidence = mockEvidenceRepo.save.mock.calls[0]?.[0];
				// Second evidence item has negative deviation (anxiety -1)
				const negativeDeviation = savedEvidence?.find((e: { deviation: number }) => e.deviation < 0);
				expect(negativeDeviation).toBeDefined();
				expect(negativeDeviation?.bigfiveFacet).toBe("anxiety");
				expect(negativeDeviation?.deviation).toBe(-1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("AC3: Exchange Row Persistence — 1-Indexed Turns", () => {
		it.effect("creates exchange with turnNumber starting at 1 (not 0)", () =>
			Effect.gen(function* () {
				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				// Exchange create should be called with turnNumber = 1
				expect(mockExchangeRepo.create).toHaveBeenCalledTimes(1);
				expect(mockExchangeRepo.create).toHaveBeenCalledWith("session_test_123", 1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("increments turnNumber for subsequent exchanges", () =>
			Effect.gen(function* () {
				// Simulate 3 previous exchanges (opener + 2 pipeline turns)
				const previousExchanges = [
					openerExchangeRecord,
					{ ...mockExchangeRecord, id: "ex_1", turnNumber: 1 },
					{ ...mockExchangeRecord, id: "ex_2", turnNumber: 2 },
				];
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(previousExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I enjoy creative work",
				});

				// Should create exchange at turnNumber 3
				expect(mockExchangeRepo.create).toHaveBeenCalledWith("session_test_123", 3);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("stores extractionTier on exchange row", () =>
			Effect.gen(function* () {
				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// First update: extraction data on previous exchange (opener)
				const extractionUpdate = mockExchangeRepo.update.mock.calls[0];
				expect(extractionUpdate?.[0]).toBe("exchange_opener");
				expect(extractionUpdate?.[1]).toHaveProperty("extractionTier");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("stores Director model data on new exchange (Story 43-5)", () =>
			Effect.gen(function* () {
				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I love helping others",
				});

				// Story 43-5: Two update calls:
				// 1. Extraction tier on previous exchange
				// 2. Director output + coverage targets on new exchange
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(2);

				// Second update: director data on new exchange
				const directorUpdate = mockExchangeRepo.update.mock.calls[1]?.[1];
				expect(directorUpdate).toHaveProperty("directorOutput");
				expect(directorUpdate).toHaveProperty("coverageTargets");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("AC5: Extraction tier stored on exchange (Story 43-1: energy/telling no longer persisted)", () => {
		it.effect("extraction tier is persisted on previous exchange", () =>
			Effect.gen(function* () {
				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I feel really passionate about this topic",
				});

				const extractionUpdate = mockExchangeRepo.update.mock.calls[0]?.[1];
				// Story 43-1: energy/telling fields removed from exchange table
				// Only extraction tier is persisted
				expect(extractionUpdate).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("AC6: Fail-Open on Complete Failure", () => {
		it.effect("no evidence saved when extraction falls to Tier 3 neutral defaults", () =>
			Effect.gen(function* () {
				const llmError = Effect.fail(new ConversanalyzerError({ message: "LLM timeout" }));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(llmError);
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(llmError);

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				// Pipeline succeeds (fail-open)
				expect(result.response).toBeDefined();
				expect(result.isFinalTurn).toBe(false);

				// No evidence saved
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();

				// Story 43-1: energy/telling fields removed from exchange table
				// Extraction update still happens (for extraction tier)
				expect(mockExchangeRepo.update).toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("structured failure event is logged (NFR28)", () =>
			Effect.gen(function* () {
				const llmError = Effect.fail(new ConversanalyzerError({ message: "LLM timeout" }));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(llmError);
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(llmError);

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				// Tier 3 warning is logged with structured data (split extraction logs per-call)
				expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
					expect.stringContaining("failed at all tiers"),
					expect.objectContaining({
						sessionId: "session_test_123",
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
