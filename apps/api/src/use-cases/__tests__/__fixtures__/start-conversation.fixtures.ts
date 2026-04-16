/**
 * Shared fixtures for start-conversation use-case tests.
 *
 * Extracted from start-conversation-auth.use-case.test.ts — no logic changes.
 */

import {
	AppConfig,
	ConversationRepository,
	CostGuardRepository,
	ExchangeRepository,
	LoggerRepository,
	MessageRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { vi } from "vitest";

// Define mock repo objects locally with vi.fn() for spy access
export const mockConversationRepo = {
	createSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
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

export const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

export const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

export const mockExchangeRepo = {
	create: vi.fn(),
	update: vi.fn(),
	findBySession: vi.fn(),
};

export const mockCostGuardRepo = {
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
	getFreeTierLlmPaused: vi.fn(),
	setFreeTierLlmPaused: vi.fn(),
};

export const mockPurchaseEventRepo = {
	getEventsByUserId: vi.fn(),
};

export let saveMessageCallCount = 0;

export function resetSaveMessageCallCount() {
	saveMessageCallCount = 0;
}

export const mockAppConfig = {
	dailyCostLimit: 75,
	sessionCostLimitCents: 2000,
	messageRateLimit: 2,
	globalDailyAssessmentLimit: 100,
	assessmentTurnCount: 15,
	databaseUrl: "postgresql://test:test@localhost:5432/test",
	redisUrl: "redis://localhost:6379",
	anthropicApiKey: Redacted.make("test-api-key"),
	betterAuthSecret: Redacted.make("test-secret"),
	betterAuthUrl: "http://localhost:4000",
	frontendUrl: "http://localhost:3000",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "test-model",
	analyzerMaxTokens: 2048,
	analyzerTemperature: 0.3,
	portraitModelId: "test-model",
	portraitMaxTokens: 16000,
	portraitTemperature: 0.7,
	nerinModelId: "test-model",
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	shareMinConfidence: 70,
	portraitWaitMinMs: 2000,
	conversanalyzerModelId: "test-model",
	portraitGeneratorModelId: "test-model",
	polarAccessToken: Redacted.make("test-token"),
	polarWebhookSecret: Redacted.make("test-secret"),
	polarProductPortraitUnlock: "test-product",
	polarProductRelationshipSingle: "test-product",
	polarProductRelationship5Pack: "test-product",
	polarProductExtendedConversation: "test-product",
	minEvidenceWeight: 0.36,
	drsBreadthWeight: 0.55,
	drsEngagementWeight: 0.45,
	drsBreadthOffset: 10,
	drsBreadthRange: 15,
	drsWordCountThreshold: 120,
	drsEvidenceThreshold: 6,
	drsEngagementWordWeight: 0.55,
	drsEngagementEvidenceWeight: 0.45,
	drsRecencyWeights: [1.0, 0.6, 0.3] as readonly number[],
	drsEnergyWeightLight: 0,
	drsEnergyWeightMedium: 1,
	drsEnergyWeightHeavy: 2,
	drsLightFitCenter: 0.55,
	drsLightFitRange: 0.35,
	drsMediumFitCenter: 0.55,
	drsMediumFitRange: 0.35,
	drsHeavyFitCenter: 0.65,
	drsHeavyFitRange: 0.25,
	territoryMinEvidenceThreshold: 3,
	territoryMaxVisits: 2,
	territoryFreshnessRate: 0.05,
	territoryFreshnessMin: 0.8,
	territoryFreshnessMax: 1.2,
	territoryColdStartThreshold: 3,
	resendApiKey: Redacted.make("test-resend-api-key"),
	emailFromAddress: "noreply@test.bigocean.dev",
	dropOffThresholdHours: 24,
	costGuardRetryAfterSeconds: 900,
	weeklyLetterExpectedCostCents: 4,
	costCeilingActiveUsersEstimate: 500,
	costCircuitBreakerMultiplier: 3,
	polarProductSubscription: "test-sub",
	pushVapidPublicKey: undefined,
	pushVapidPrivateKey: undefined,
	pushVapidSubject: undefined,
	cronSecret: Redacted.make(""),
	nerinDirectorModelId: "test",
	nerinDirectorMaxTokens: 1024,
	nerinDirectorTemperature: 0.7,
	nerinDirectorRetryTemperature: 0.9,
	checkInThresholdDays: 14,
	subscriptionNudgeThresholdDays: 21,
	recaptureThresholdDays: 3,
};

export const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(ConversationRepository, mockConversationRepo),
		Layer.succeed(MessageRepository, mockMessageRepo),
		Layer.succeed(ExchangeRepository, mockExchangeRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
		Layer.succeed(PurchaseEventRepository, mockPurchaseEventRepo),
		Layer.succeed(AppConfig, mockAppConfig as never),
	);

/**
 * Set up default mock behaviors. Call in beforeEach().
 */
export function setupDefaultMocks() {
	saveMessageCallCount = 0;

	mockConversationRepo.createSession.mockImplementation((userId?: string) =>
		Effect.succeed({
			sessionId: "session_new_789",
			userId,
			createdAt: new Date("2026-02-01T10:00:00Z"),
		}),
	);
	mockConversationRepo.getActiveSessionByUserId.mockImplementation(() => Effect.succeed(null));
	mockConversationRepo.getSessionsByUserId.mockImplementation(() => Effect.succeed([]));
	mockConversationRepo.findSessionByUserId.mockImplementation(() => Effect.succeed(null));
	mockConversationRepo.getSession.mockImplementation(() => Effect.succeed(undefined));
	mockConversationRepo.updateSession.mockImplementation(() => Effect.succeed(undefined));
	mockConversationRepo.createAnonymousSession.mockImplementation(() =>
		Effect.succeed({
			sessionId: "session_anon_123",
			sessionToken: "mock_token_abc123def456",
		}),
	);
	mockConversationRepo.findByToken.mockImplementation(() => Effect.succeed(null));
	mockConversationRepo.assignUserId.mockImplementation(() => Effect.succeed(undefined));
	mockConversationRepo.rotateToken.mockImplementation(() =>
		Effect.succeed({ sessionToken: "new_token" }),
	);
	mockConversationRepo.incrementMessageCount.mockImplementation(() => Effect.succeed(1));
	mockConversationRepo.acquireSessionLock.mockImplementation(() => Effect.succeed(undefined));
	mockConversationRepo.releaseSessionLock.mockImplementation(() => Effect.succeed(undefined));

	mockExchangeRepo.create.mockImplementation((_sessionId: string, _turnNumber: number) =>
		Effect.succeed({
			id: "exchange_opener_0",
			sessionId: _sessionId,
			turnNumber: _turnNumber,
			extractionTier: null,
			directorOutput: null,
			coverageTargets: null,
			createdAt: new Date("2026-02-01T10:00:00Z"),
		}),
	);
	mockExchangeRepo.update.mockImplementation(() => Effect.succeed({}));
	mockExchangeRepo.findBySession.mockImplementation(() => Effect.succeed([]));

	mockMessageRepo.saveMessage.mockImplementation(
		(sessionId: string, role: string, content: string) => {
			saveMessageCallCount++;
			return Effect.succeed({
				id: `msg-${saveMessageCallCount}`,
				sessionId,
				role,
				content,
				createdAt: new Date("2026-02-01T10:00:00Z"),
			});
		},
	);
	mockMessageRepo.getMessages.mockImplementation(() => Effect.succeed([]));
	mockMessageRepo.getMessageCount.mockImplementation(() => Effect.succeed(0));

	mockLoggerRepo.info.mockImplementation(() => {});
	mockLoggerRepo.error.mockImplementation(() => {});
	mockLoggerRepo.warn.mockImplementation(() => {});
	mockLoggerRepo.debug.mockImplementation(() => {});

	mockCostGuardRepo.canStartAssessment.mockImplementation(() => Effect.succeed(true));
	mockCostGuardRepo.recordAssessmentStart.mockImplementation(() => Effect.succeed(undefined));
	mockCostGuardRepo.incrementDailyCost.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.getDailyCost.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.incrementAssessmentCount.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.getAssessmentCount.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.checkDailyBudget.mockImplementation(() => Effect.succeed(undefined));
	mockCostGuardRepo.checkMessageRateLimit.mockImplementation(() => Effect.succeed(undefined));
	mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockImplementation(() =>
		Effect.succeed(undefined),
	);
	mockCostGuardRepo.incrementSessionCost.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.getSessionCost.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.checkSessionBudget.mockImplementation(() => Effect.succeed(undefined));
	mockCostGuardRepo.getFreeTierLlmPaused.mockImplementation(() => Effect.succeed(false));
	mockCostGuardRepo.setFreeTierLlmPaused.mockImplementation(() => Effect.void);

	mockPurchaseEventRepo.getEventsByUserId.mockImplementation(() => Effect.succeed([]));
}
