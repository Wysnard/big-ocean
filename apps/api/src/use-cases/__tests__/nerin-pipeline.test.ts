/**
 * Nerin Pipeline Tests -- Pacing Pipeline Integration (Story 27-3)
 *
 * Tests the full pipeline: E_target -> V2 scorer -> V2 selector -> Move Governor ->
 * Prompt Builder -> Nerin -> ConversAnalyzer -> save.
 *
 * Uses vi.fn() mock pattern.
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

const mockNerinRepo = {
	invoke: vi.fn(),
};

const mockConversanalyzerRepo = {
	analyzeUserState: vi.fn(),
	analyzeUserStateLenient: vi.fn(),
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
	energy: null,
	energyBand: null,
	telling: null,
	tellingBand: null,
	withinMessageShift: null,
	stateNotes: null,
	extractionTier: null,
	smoothedEnergy: null,
	sessionTrust: null,
	drain: null,
	trustCap: null,
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
	sessionTrust: null,
	drain: null,
	trustCap: null,
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

/** Post-cold-start exchange records with pacing state (includes opener at turn 0) */
const postColdStartExchanges = [
	{ ...openerExchangeRecord },
	{
		...mockExchangeRecord,
		id: "ex_1",
		turnNumber: 1,
		selectedTerritory: "daily-routines",
		energy: 0.3,
		energyBand: "low",
		telling: 0.5,
		tellingBand: "mixed",
		smoothedEnergy: 0.4,
		sessionTrust: 0.4,
		eTarget: 0.5,
		selectionRule: "cold_start",
		governorOutput: { intent: "open", territory: "daily-routines" },
	},
	{
		...mockExchangeRecord,
		id: "ex_2",
		turnNumber: 2,
		selectedTerritory: "daily-routines",
		energy: 0.5,
		energyBand: "steady",
		telling: 0.5,
		tellingBand: "mixed",
		smoothedEnergy: 0.45,
		sessionTrust: 0.45,
		eTarget: 0.5,
		selectionRule: "argmax",
		governorOutput: {
			intent: "explore",
			territory: "daily-routines",
			observationFocus: { type: "relate" },
		},
	},
	{
		...mockExchangeRecord,
		id: "ex_3",
		turnNumber: 3,
		selectedTerritory: "creative-pursuits",
		energy: 0.3,
		energyBand: "low",
		telling: 0.25,
		tellingBand: "mostly_compliant",
		smoothedEnergy: 0.4,
		sessionTrust: 0.4,
		eTarget: 0.48,
		selectionRule: "argmax",
		governorOutput: {
			intent: "explore",
			territory: "creative-pursuits",
			observationFocus: { type: "relate" },
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

	mockNerinRepo.invoke.mockReturnValue(Effect.succeed(mockNerinResponse));

	mockConversanalyzerRepo.analyzeUserState.mockReturnValue(
		Effect.succeed({
			userState: mockConversanalyzerOutput.userState,
			tokenUsage: { input: 100, output: 25 },
		}),
	);
	mockConversanalyzerRepo.analyzeUserStateLenient.mockReturnValue(
		Effect.succeed({
			userState: mockConversanalyzerOutput.userState,
			tokenUsage: { input: 100, output: 25 },
		}),
	);
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

describe("Nerin Pipeline - Pacing Pipeline Integration (Story 27-3)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Turn 1 (cold-start-perimeter path)", () => {
		it.effect("selects territory via V2 selector with cold-start-perimeter rule", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(turn1Messages));

				const result = yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "Hello",
				});

				expect(result.response).toBeDefined();

				// Nerin should be invoked with a system prompt string (not territoryPrompt)
				expect(mockNerinRepo.invoke).toHaveBeenCalledTimes(1);
				const invokeArgs = mockNerinRepo.invoke.mock.calls[0]?.[0];
				expect(invokeArgs?.systemPrompt).toBeDefined();
				expect(typeof invokeArgs?.systemPrompt).toBe("string");
				expect(invokeArgs?.systemPrompt.length).toBeGreaterThan(0);

				// Exchange update called twice: once for opener extraction, once for new exchange steering
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(2);
				// Second update (new exchange) should store cold_start selection rule
				const steeringUpdate = mockExchangeRepo.update.mock.calls[1]?.[1];
				expect(steeringUpdate?.selectionRule).toBe("cold_start");
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

				// Exchange update called twice: opener extraction + new exchange steering
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(2);

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
	});

	describe("Post-cold-start path (full pacing pipeline)", () => {
		it.effect("runs E_target -> V2 scorer -> selector -> governor -> prompt builder", () =>
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

				// Nerin should be called with system prompt (not territoryPrompt)
				expect(mockNerinRepo.invoke).toHaveBeenCalledTimes(1);
				const invokeArgs = mockNerinRepo.invoke.mock.calls[0]?.[0];
				expect(invokeArgs?.systemPrompt).toBeDefined();
				expect(typeof invokeArgs?.systemPrompt).toBe("string");

				// ConversAnalyzer split methods should be called
				expect(mockConversanalyzerRepo.analyzeUserState).toHaveBeenCalledTimes(1);
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);

				// Evidence should be saved
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);

				// Exchange should be created and updated (2 updates: previous extraction + new steering)
				expect(mockExchangeRepo.create).toHaveBeenCalledTimes(1);
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(2);

				// First update: extraction data on previous exchange
				const extractionUpdate = mockExchangeRepo.update.mock.calls[0]?.[1];
				expect(extractionUpdate?.energy).toBeDefined();
				expect(extractionUpdate?.energyBand).toBeDefined();
				expect(extractionUpdate?.telling).toBeDefined();
				expect(extractionUpdate?.tellingBand).toBeDefined();

				// Second update: steering data on new exchange
				const steeringUpdate = mockExchangeRepo.update.mock.calls[1]?.[1];
				// Verify pacing state stored
				expect(steeringUpdate?.eTarget).toBeDefined();
				expect(typeof steeringUpdate?.eTarget).toBe("number");
				expect(steeringUpdate?.smoothedEnergy).toBeDefined();
				expect(steeringUpdate?.sessionTrust).toBeDefined();
				// Verify selection state
				expect(steeringUpdate?.selectedTerritory).toBeDefined();
				expect(steeringUpdate?.selectionRule).toBe("argmax");
				// Verify governor state
				expect(steeringUpdate?.governorOutput).toBeDefined();
				expect(steeringUpdate?.governorDebug).toBeDefined();
				// Verify session state
				expect(steeringUpdate?.sessionPhase).toBeDefined();
				expect(steeringUpdate?.transitionType).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Observability logging (NFR5)", () => {
		it.effect("logs pacing pipeline state including E_target and governor intent", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I work in tech",
				});

				// Check that "Pacing pipeline computed" was logged
				const pacingLogCall = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Pacing pipeline computed",
				);
				expect(pacingLogCall).toBeDefined();
				const pacingData = pacingLogCall?.[1];
				expect(pacingData).toHaveProperty("eTarget");
				expect(pacingData).toHaveProperty("selectedTerritory");
				expect(pacingData).toHaveProperty("governorIntent");
				expect(pacingData).toHaveProperty("entryPressure");
				expect(pacingData).toHaveProperty("observationFocus");
				expect(pacingData).toHaveProperty("turnNumber");

				// Check "Message processed" log includes territory info
				const processedLogCall = mockLoggerRepo.info.mock.calls.find(
					(call: unknown[]) => call[0] === "Message processed",
				);
				expect(processedLogCall).toBeDefined();
				const processedData = processedLogCall?.[1];
				expect(processedData).toHaveProperty("selectedTerritory");
				expect(processedData).toHaveProperty("eTarget");
				expect(processedData).toHaveProperty("governorIntent");
				expect(processedData).toHaveProperty("evidenceCount");
				expect(processedData).toHaveProperty("exchangeId");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Fail-open resilience", () => {
		it.effect(
			"handles ConversAnalyzer failure non-fatally -- falls back to Tier 2 (Story 24-2)",
			() =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
					mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));
					// Fail strict calls — lenient methods succeed from default setup
					mockConversanalyzerRepo.analyzeUserState.mockReturnValue(
						Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
					);
					mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
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
			"handles both ConversAnalyzer tiers failing -- uses Tier 3 neutral defaults (Story 24-2)",
			() =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
					mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));
					const llmError = Effect.fail(new ConversanalyzerError({ message: "LLM timeout" }));
					mockConversanalyzerRepo.analyzeUserState.mockReturnValue(llmError);
					mockConversanalyzerRepo.analyzeUserStateLenient.mockReturnValue(llmError);
					mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(llmError);
					mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(llmError);

					const result = yield* runNerinPipeline({
						sessionId: "session_test_123",
						userMessage: "I work in tech",
					});

					// Pipeline should still succeed
					expect(result.response).toBeDefined();

					// Nerin should have been called
					expect(mockNerinRepo.invoke).toHaveBeenCalledTimes(1);

					// Tier 3 warning was logged (split extraction logs per-call)
					expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
						expect.stringContaining("failed at all tiers"),
						expect.objectContaining({ sessionId: "session_test_123" }),
					);

					// Evidence should NOT be saved (neutral defaults have empty evidence)
					expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
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

				// Both split methods receive the same input shape
				expect(mockConversanalyzerRepo.analyzeUserState).toHaveBeenCalledTimes(1);
				const userStateInput = mockConversanalyzerRepo.analyzeUserState.mock.calls[0]?.[0];
				expect(userStateInput).toHaveProperty("message");
				expect(userStateInput).toHaveProperty("recentMessages");
				expect(userStateInput).toHaveProperty("domainDistribution");

				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
				const evidenceInput = mockConversanalyzerRepo.analyzeEvidence.mock.calls[0]?.[0];
				expect(evidenceInput).toHaveProperty("message");
				expect(evidenceInput).toHaveProperty("recentMessages");
				expect(evidenceInput).toHaveProperty("domainDistribution");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Polarity passthrough (Story 42-4)", () => {
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

	describe("Pipeline state on exchange (AC6)", () => {
		it.effect("stores extraction on previous exchange and steering on new exchange", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed(postColdStartExchanges));

				yield* runNerinPipeline({
					sessionId: "session_test_123",
					userMessage: "I enjoy creative work",
				});

				// Two updates: extraction on previous, steering on new
				expect(mockExchangeRepo.update).toHaveBeenCalledTimes(2);

				// First update: extraction data on previous exchange
				const extractionData = mockExchangeRepo.update.mock.calls[0]?.[1];
				expect(extractionData).toHaveProperty("energy");
				expect(extractionData).toHaveProperty("energyBand");
				expect(extractionData).toHaveProperty("telling");
				expect(extractionData).toHaveProperty("tellingBand");

				// Second update: steering data on new exchange
				const steeringData = mockExchangeRepo.update.mock.calls[1]?.[1];
				expect(steeringData).toHaveProperty("smoothedEnergy");
				expect(steeringData).toHaveProperty("sessionTrust");
				expect(steeringData).toHaveProperty("eTarget");
				expect(steeringData).toHaveProperty("scorerOutput");
				expect(steeringData).toHaveProperty("selectedTerritory");
				expect(steeringData).toHaveProperty("selectionRule");
				expect(steeringData).toHaveProperty("governorOutput");
				expect(steeringData).toHaveProperty("governorDebug");
				expect(steeringData).toHaveProperty("sessionPhase");
				expect(steeringData).toHaveProperty("transitionType");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});

// ─── Extension Session Tests (Story 36-2) ───────────────────────────

/** Parent session's final exchange with populated pacing state */
const parentFinalExchange = {
	...mockExchangeRecord,
	id: "parent_ex_final",
	sessionId: "parent_session_id",
	turnNumber: 25,
	selectedTerritory: "daily-routines",
	energy: 0.6,
	energyBand: "high",
	telling: 0.75,
	tellingBand: "mostly_self_propelled",
	smoothedEnergy: 0.55,
	sessionTrust: 0.6,
	eTarget: 0.52,
	selectionRule: "argmax",
	governorOutput: {
		intent: "close",
		territory: "daily-routines",
		entryPressure: "direct",
		observationFocus: { type: "relate" },
	},
};

const parentExchangeHistory = [
	{ ...openerExchangeRecord, sessionId: "parent_session_id" },
	{
		...mockExchangeRecord,
		id: "parent_ex_1",
		sessionId: "parent_session_id",
		turnNumber: 1,
		selectedTerritory: "daily-routines",
		energy: 0.3,
		energyBand: "low",
		telling: 0.5,
		tellingBand: "mixed",
		smoothedEnergy: 0.4,
		sessionTrust: 0.4,
	},
	{
		...mockExchangeRecord,
		id: "parent_ex_2",
		sessionId: "parent_session_id",
		turnNumber: 2,
		selectedTerritory: "creative-pursuits",
		energy: 0.5,
		energyBand: "steady",
		telling: 0.5,
		tellingBand: "mixed",
		smoothedEnergy: 0.45,
		sessionTrust: 0.45,
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

	it.effect("seeds E_target from most recent exchange across all user sessions", () =>
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

			// Extension session has only opener (turn 0)
			mockExchangeRepo.findBySession.mockReturnValue(Effect.succeed([openerExchangeRecord]));
			// All user exchanges include parent's pipeline exchanges
			mockExchangeRepo.findByUserId.mockReturnValue(
				Effect.succeed([...parentExchangeHistory, openerExchangeRecord]),
			);
			mockEvidenceRepo.findByUserId.mockReturnValue(Effect.succeed(parentEvidence));
			mockMessageRepo.getMessagesByUserId.mockReturnValue(Effect.succeed(turn1Messages));

			const result = yield* runNerinPipeline({
				sessionId: "extension_session_id",
				userId: "user_123",
				userMessage: "Hello again",
			});

			expect(result.response).toBeDefined();

			// Verify pacing pipeline used parent exchange data via allExchanges
			const pacingLog = mockLoggerRepo.info.mock.calls.find(
				(call: unknown[]) => call[0] === "Pacing pipeline computed",
			);
			expect(pacingLog).toBeDefined();
			const pacingData = pacingLog?.[1] as Record<string, unknown>;
			expect(pacingData?.isExtensionSession).toBe(true);
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

			// User-level queries succeed (even if parent session is gone, the user's
			// other sessions may still have data)
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

			// Verify Nerin received all messages (parent + extension + current)
			const nerinCall = mockNerinRepo.invoke.mock.calls[0]?.[0];
			expect(nerinCall?.messages).toHaveLength(5); // 3 parent + 1 extension + 1 current
			expect(nerinCall?.messages[0]?.content).toBe("Hi! I'm Nerin.");
			expect(nerinCall?.messages[1]?.content).toBe("I love painting on weekends");
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
