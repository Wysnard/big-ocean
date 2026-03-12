/**
 * Nerin Pipeline Tests -- Territory-Based 8-Step Orchestration (Story 21-7)
 *
 * Tests the full pipeline: territory steering -> Nerin -> ConversAnalyzer -> save.
 * Uses vi.fn() mock pattern from send-message.fixtures.ts.
 *
 * Story 23-3: Updated to use AssessmentExchangeRepository for pipeline state.
 * Messages no longer carry territoryId/observedEnergyLevel.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	AppConfig,
	AssessmentExchangeRepository,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	ConversanalyzerError,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	CostGuardRepository,
	LoggerRepository,
	NerinAgentRepository,
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
};

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

const mockExchangeRepo = {
	create: vi.fn(),
	update: vi.fn(),
	findBySession: vi.fn(),
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
	analyzeLenient: vi.fn(),
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

// ---- Test Data ----

const mockNerinResponse = {
	response: "I help you explore your personality through conversation.",
	tokenCount: { input: 150, output: 80, total: 230 },
};

const mockConversanalyzerOutput = {
	userState: {
		energyBand: "steady" as const,
		tellingBand: "mixed" as const,
		energyReason: "Engaged with moderate self-reflection",
		tellingReason: "Follows prompts with some self-direction",
		withinMessageShift: false,
	},
	evidence: [
		{
			bigfiveFacet: "imagination" as const,
			deviation: 2,
			strength: "strong" as const,
			confidence: "high" as const,
			domain: "work" as const,
			note: "Creative thinking",
		},
		{
			bigfiveFacet: "trust" as const,
			deviation: 1,
			strength: "moderate" as const,
			confidence: "medium" as const,
			domain: "relationships" as const,
			note: "Trusting nature",
		},
	],
	tokenUsage: { input: 200, output: 50 },
};

const mockExchangeRecord = {
	id: "exchange_1",
	sessionId: "session_test_123",
	turnNumber: 1,
	energy: null,
	energyBand: null,
	telling: null,
	tellingBand: null,
	withinMessageShift: null,
	stateNotes: null,
	extractionTier: null,
	smoothedEnergy: null,
	comfort: null,
	drain: null,
	drainCeiling: null,
	eTarget: null,
	scorerOutput: null,
	selectedTerritory: null,
	selectionRule: null,
	governorOutput: null,
	governorDebug: null,
	sessionPhase: null,
	transitionType: null,
	createdAt: new Date(),
};

/** Cold-start messages: 2 assistant greetings + 1 user reply (userMessageCount = 1, < threshold 3) */
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

/** Post-cold-start messages: 3+ user messages (no territory/energy metadata on messages) */
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

/** Post-cold-start exchange records with territory/energy data */
const postColdStartExchanges = [
	{
		...mockExchangeRecord,
		id: "ex_1",
		turnNumber: 1,
		selectedTerritory: "daily-routines",
		energyBand: "light",
	},
	{
		...mockExchangeRecord,
		id: "ex_2",
		turnNumber: 2,
		selectedTerritory: "daily-routines",
		energyBand: "medium",
	},
	{
		...mockExchangeRecord,
		id: "ex_3",
		turnNumber: 3,
		selectedTerritory: "creative-pursuits",
		energyBand: "light",
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
	teaserModelId: "claude-haiku-4-5-20251001",
	globalDailyAssessmentLimit: 100,
	minEvidenceWeight: 0.36,
	// DRS config
	drsBreadthWeight: 0.55,
	drsEngagementWeight: 0.45,
	drsBreadthOffset: 10,
	drsBreadthRange: 15,
	drsWordCountThreshold: 120,
	drsEvidenceThreshold: 6,
	drsEngagementWordWeight: 0.55,
	drsEngagementEvidenceWeight: 0.45,
	drsRecencyWeights: [1.0, 0.6, 0.3],
	drsEnergyWeightLight: 0,
	drsEnergyWeightMedium: 1,
	drsEnergyWeightHeavy: 2,
	drsLightFitCenter: 0.55,
	drsLightFitRange: 0.35,
	drsMediumFitCenter: 0.55,
	drsMediumFitRange: 0.35,
	drsHeavyFitCenter: 0.65,
	drsHeavyFitRange: 0.25,
	// Territory scoring config
	territoryMinEvidenceThreshold: 3,
	territoryMaxVisits: 2,
	territoryFreshnessRate: 0.05,
	territoryFreshnessMin: 0.8,
	territoryFreshnessMax: 1.2,
	// Cold-start threshold
	territoryColdStartThreshold: 3,
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AppConfig, mockConfig),
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
		Layer.succeed(AssessmentExchangeRepository, mockExchangeRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(NerinAgentRepository, mockNerinRepo),
		Layer.succeed(ConversanalyzerRepository, mockConversanalyzerRepo),
		Layer.succeed(ConversationEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
	);

function setupDefaultMocks() {
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
	mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

	mockExchangeRepo.create.mockReturnValue(Effect.succeed(mockExchangeRecord));
	mockExchangeRepo.update.mockReturnValue(Effect.succeed(mockExchangeRecord));
	mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed([]));

	mockLoggerRepo.info.mockImplementation(() => {});
	mockLoggerRepo.error.mockImplementation(() => {});
	mockLoggerRepo.warn.mockImplementation(() => {});
	mockLoggerRepo.debug.mockImplementation(() => {});

	mockNerinRepo.invoke.mockReturnValue(Effect.succeed(mockNerinResponse));

	mockConversanalyzerRepo.analyze.mockReturnValue(Effect.succeed(mockConversanalyzerOutput));
	mockConversanalyzerRepo.analyzeLenient.mockReturnValue(Effect.succeed(mockConversanalyzerOutput));

	mockEvidenceRepo.save.mockReturnValue(Effect.succeed(undefined));
	mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed([]));
	mockEvidenceRepo.countByMessage.mockReturnValue(Effect.succeed(0));

	mockCostGuardRepo.checkDailyBudget.mockReturnValue(Effect.void);
	mockCostGuardRepo.incrementDailyCost.mockReturnValue(Effect.succeed(1));
	mockCostGuardRepo.checkMessageRateLimit.mockReturnValue(Effect.void);
}

describe("Nerin Pipeline - Territory-Based Orchestration (Story 21-7, updated 23-3)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Cold-start path", () => {
		it.effect("selects from COLD_START_TERRITORIES for early messages", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				expect(result.response).toBeDefined();

				// Nerin should be invoked with territory prompt
				expect(mockNerinRepo.invoke).toHaveBeenCalledTimes(1);
				const invokeArgs = mockNerinRepo.invoke.mock.calls[0]?.[0];
				expect(invokeArgs?.territoryPrompt).toBeDefined();
				expect(invokeArgs?.territoryPrompt?.opener).toBeDefined();
				expect(invokeArgs?.territoryPrompt?.energyGuidanceLevel).toBeDefined();
				expect(invokeArgs?.territoryPrompt?.domains).toBeDefined();

				// ConversAnalyzer should NOT be called during cold start
				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("creates exchange and saves messages with exchange_id", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				// Exchange should be created
				expect(mockExchangeRepo.create).toHaveBeenCalledTimes(1);
				expect(mockExchangeRepo.create).toHaveBeenCalledWith("session_test_123", 1);

				// Exchange should be updated with territory selection
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(1);

				// saveMessage is called twice: once for user, once for assistant
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledTimes(2);

				// Both messages should be linked to exchange
				const userSaveCall = mockMessageRepo.saveMessage.mock.calls[0];
				expect(userSaveCall?.[1]).toBe("user");
				expect(userSaveCall?.[3]).toBe("exchange_1"); // exchangeId

				const assistantSaveCall = mockMessageRepo.saveMessage.mock.calls[1];
				expect(assistantSaveCall?.[1]).toBe("assistant");
				expect(assistantSaveCall?.[3]).toBe("exchange_1"); // exchangeId
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Post-cold-start path (full 8-step orchestration)", () => {
		it.effect("runs full territory steering + ConversAnalyzer", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "ev1",
							sessionId: "session_test_123",
							messageId: "msg_2",
							bigfiveFacet: "imagination",
							deviation: 1,
							strength: "moderate",
							confidence: "medium",
							domain: "work",
							note: "test",
							createdAt: new Date(),
						},
					]),
				);

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				expect(result.response).toBeDefined();

				// Nerin should be called with territory prompt
				expect(mockNerinRepo.invoke).toHaveBeenCalledTimes(1);
				const invokeArgs = mockNerinRepo.invoke.mock.calls[0]?.[0];
				expect(invokeArgs?.territoryPrompt).toBeDefined();

				// ConversAnalyzer should be called (post-cold-start)
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);

				// Evidence should be saved
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);

				// Exchange should be created and updated
				expect(mockExchangeRepo.create).toHaveBeenCalledTimes(1);
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Observability logging (NFR5)", () => {
		it.effect("logs DRS, territory selected, and evidence count for post-cold-start", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Check that "Territory steering computed" was logged
				const steeringLogCall = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Territory steering computed",
				);
				expect(steeringLogCall).toBeDefined();
				const steeringData = steeringLogCall?.[1];
				expect(steeringData).toHaveProperty("drs");
				expect(steeringData).toHaveProperty("selectedTerritory");
				expect(steeringData).toHaveProperty("coveredFacets");

				// Check "Message processed" log includes territory info
				const processedLogCall = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Message processed",
				);
				expect(processedLogCall).toBeDefined();
				const processedData = processedLogCall?.[1];
				expect(processedData).toHaveProperty("selectedTerritory");
				expect(processedData).toHaveProperty("observedEnergyLevel");
				expect(processedData).toHaveProperty("drs");
				expect(processedData).toHaveProperty("evidenceCount");
				expect(processedData).toHaveProperty("exchangeId");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Fail-open resilience", () => {
		it.effect("handles ConversAnalyzer failure non-fatally", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
				);

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Pipeline should still succeed
				expect(result.response).toBeDefined();

				// Nerin should have been called
				expect(mockNerinRepo.invoke).toHaveBeenCalledTimes(1);

				// Evidence should NOT be saved (no evidence extracted)
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Backward compatibility (NFR1)", () => {
		it.effect("preserves existing evidence extraction unchanged", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I like helping people",
				});

				// ConversAnalyzer receives the same input shape as before
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
				const analyzerInput = mockConversanalyzerRepo.analyze.mock.calls[0]?.[0];
				expect(analyzerInput).toHaveProperty("message");
				expect(analyzerInput).toHaveProperty("recentMessages");
				expect(analyzerInput).toHaveProperty("domainDistribution");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
