/**
 * Shared fixtures for send-message use-case tests.
 *
 * Extracted from send-message.use-case.test.ts — no logic changes.
 */

import {
	AppConfig,
	AssessmentExchangeRepository,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	CostGuardRepository,
	LoggerRepository,
	NerinActorRepository,
	NerinDirectorRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { vi } from "vitest";

// Mock repo objects with vi.fn() for spy access
export const mockSessionRepo = {
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

export const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessagesByUserId: vi.fn(),
	getMessageCount: vi.fn(),
	updateExchangeId: vi.fn(),
};

export const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

export const mockDirectorRepo = {
	generateBrief: vi.fn(),
};

export const mockActorRepo = {
	invoke: vi.fn(),
};

export const mockConversanalyzerRepo = {
	analyzeEvidence: vi.fn(),
	analyzeEvidenceLenient: vi.fn(),
};

export const mockEvidenceRepo = {
	save: vi.fn(),
	findBySession: vi.fn(),
	findByUserId: vi.fn(),
	countByMessage: vi.fn(),
};

export const mockExchangeRepo = {
	create: vi.fn(),
	update: vi.fn(),
	findBySession: vi.fn(),
	findByUserId: vi.fn(),
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
};

// Mock data
export const mockActiveSession = {
	id: "session_test_123",
	userId: null,
	sessionToken: "mock_token",
	createdAt: new Date("2026-02-01"),
	updatedAt: new Date("2026-02-01"),
	status: "active",
	messageCount: 0,
	finalizationProgress: null,
};

/** Messages simulating cold start (2 assistant greetings + 1 user reply) */
export const coldStartMessages = [
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
export const postColdStartMessages = [
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

export const mockDirectorResponse = {
	brief:
		"Observation: They mentioned exploring. Question: Ask about what drives their curiosity. Warm, medium length.",
	tokenUsage: { input: 500, output: 80 },
};

export const mockActorResponse = {
	response: "I help you explore your personality through conversation.",
	tokenCount: { input: 100, output: 50, total: 150 },
};

export const mockConversanalyzerOutput = {
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

/** Matches production default in app-config.live.ts */
export const FREE_TIER_MESSAGE_THRESHOLD = 25;

export const mockConfig = {
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

/** Opener exchange (turn 0) — created by start-assessment */
export const openerExchangeRecord = {
	id: "exchange_opener",
	sessionId: "session_test_123",
	turnNumber: 0,
	extractionTier: null,
	directorOutput: null,
	coverageTargets: null,
	createdAt: new Date(),
};

export const mockExchangeRecord = {
	id: "exchange_1",
	sessionId: "session_test_123",
	turnNumber: 1,
	extractionTier: null,
	directorOutput: null,
	coverageTargets: null,
	createdAt: new Date(),
};

export const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AppConfig, mockConfig),
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
		Layer.succeed(AssessmentExchangeRepository, mockExchangeRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(NerinDirectorRepository, mockDirectorRepo),
		Layer.succeed(NerinActorRepository, mockActorRepo),
		Layer.succeed(ConversanalyzerRepository, mockConversanalyzerRepo),
		Layer.succeed(ConversationEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
	);

/**
 * Set up default mock behaviors. Call in beforeEach().
 */
export function setupDefaultMocks() {
	mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockActiveSession));
	mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(1));
	mockSessionRepo.updateSession.mockReturnValue(Effect.succeed(mockActiveSession));
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
	mockMessageRepo.getMessagesByUserId.mockReturnValue(Effect.succeed(coldStartMessages));
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
