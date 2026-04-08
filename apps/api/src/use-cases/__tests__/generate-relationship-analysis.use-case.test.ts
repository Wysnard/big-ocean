/**
 * Generate Relationship Analysis Use Case Tests (Story 18-6, updated Story 35-2, 35-5)
 *
 * Tests:
 * - Successful generation updates placeholder
 * - Retry when inviter data not found
 * - Retry when invitee data not found
 * - Idempotent update (already has content)
 * - Uses ConversationEvidenceRepository (not FinalizationEvidenceRepository)
 * - Email notification sent after successful generation (Story 35-5)
 * - Email notification NOT sent on idempotent skip (Story 35-5)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AnalysisNotFoundError,
	AppConfig,
	AssessmentResultRepository,
	ConversationEvidenceRepository,
	ConversationRepository,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { vi } from "vitest";
import { generateRelationshipAnalysis } from "../generate-relationship-analysis.use-case";

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
	getByIdWithParticipantNames: vi.fn(),
	getParticipantEmails: vi.fn(),
};

const mockEmailRepo = {
	sendEmail: vi.fn(),
};

const mockConfig = {
	frontendUrl: "https://bigocean.dev",
	databaseUrl: "",
	redisUrl: "",
	anthropicApiKey: Redacted.make("test"),
	betterAuthSecret: Redacted.make("test"),
	betterAuthUrl: "",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "",
	analyzerMaxTokens: 0,
	analyzerTemperature: 0,
	portraitModelId: "",
	portraitMaxTokens: 0,
	portraitTemperature: 0,
	nerinModelId: "",
	nerinMaxTokens: 0,
	nerinTemperature: 0,
	dailyCostLimit: 0,
	assessmentTurnCount: 0,
	portraitWaitMinMs: 0,
	shareMinConfidence: 0,
	conversanalyzerModelId: "",
	portraitGeneratorModelId: "",
	messageRateLimit: 0,
	polarAccessToken: Redacted.make("test"),
	polarWebhookSecret: Redacted.make("test"),
	polarProductPortraitUnlock: "",
	polarProductRelationshipSingle: "",
	polarProductRelationship5Pack: "",
	polarProductExtendedConversation: "",
	globalDailyAssessmentLimit: 0,
	minEvidenceWeight: 0,
	resendApiKey: Redacted.make("test"),
	emailFromAddress: "noreply@bigocean.dev",
	dropOffThresholdHours: 24,
	checkInThresholdDays: 14,
	recaptureThresholdDays: 3,
	sessionCostLimitCents: 2000,
};

const mockAnalysisGen = {
	generateAnalysis: vi.fn(),
};

const mockSessionRepo = {
	create: vi.fn(),
	getById: vi.fn(),
	updateStatus: vi.fn(),
	updateMessageCount: vi.fn(),
	updateUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	getByAnonymousToken: vi.fn(),
	updateOceanCodeAndArchetype: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
};

const mockConversationEvidenceRepo = {
	save: vi.fn(),
	findBySession: vi.fn(),
	countByMessage: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(RelationshipAnalysisGeneratorRepository, mockAnalysisGen),
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(ConversationEvidenceRepository, mockConversationEvidenceRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(ResendEmailRepository, mockEmailRepo),
		Layer.succeed(AppConfig, mockConfig),
	);

const INVITER_ID = "inviter-user-1";
const INVITEE_ID = "invitee-user-2";
const ANALYSIS_ID = "analysis-123";

const mockSession = (userId: string) => ({
	id: `session-${userId}`,
	createdAt: new Date(),
	updatedAt: new Date(),
	status: "completed",
	messageCount: 12,
	oceanCode5: "HHMHM",
	archetypeName: "The Explorer",
});

const mockResult = (sessionId: string) => ({
	id: `result-${sessionId}`,
	sessionId,
	userId: "user",
	facets: {
		imagination: { score: 15, confidence: 0.8 },
		artistic_interests: { score: 12, confidence: 0.7 },
	},
	createdAt: new Date(),
	updatedAt: new Date(),
});

const mockConversationEvidence = [
	{
		id: "ev_1",
		sessionId: "session-inviter-user-1",
		messageId: "msg_1",
		bigfiveFacet: "imagination",
		deviation: 2,
		strength: "strong",
		confidence: "high",
		domain: "work",
		note: "Shows vivid creative thinking",
		createdAt: new Date(),
	},
];

describe("generateRelationshipAnalysis Use Case (Story 18-6)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default successful mocks for both users
		mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
			Effect.succeed(mockSession(userId)),
		);
		mockResultsRepo.getBySessionId.mockImplementation((sessionId: string) =>
			Effect.succeed(mockResult(sessionId)),
		);
		mockConversationEvidenceRepo.findBySession.mockReturnValue(
			Effect.succeed(mockConversationEvidence),
		);
		mockAnalysisGen.generateAnalysis.mockReturnValue(
			Effect.succeed({
				content: JSON.stringify([
					{
						emoji: "\u{1F30A}",
						title: "The Dynamic Between You",
						paragraphs: ["Your dynamic is fascinating."],
					},
				]),
				modelUsed: "claude-sonnet",
			}),
		);
		mockAnalysisRepo.updateContent.mockReturnValue(Effect.succeed(undefined));
		mockAnalysisRepo.incrementRetryCount.mockReturnValue(Effect.succeed(undefined));
		mockAnalysisRepo.getParticipantEmails.mockReturnValue(
			Effect.succeed({
				userAEmail: "alice@example.com",
				userAName: "Alice",
				userBEmail: "bob@example.com",
				userBName: "Bob",
			}),
		);
		mockEmailRepo.sendEmail.mockReturnValue(Effect.void);
	});

	it.effect("should generate analysis and update placeholder on success", () =>
		Effect.gen(function* () {
			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(true);

			expect(mockAnalysisGen.generateAnalysis).toHaveBeenCalledWith(
				expect.objectContaining({
					userAName: "Person A",
					userBName: "Person B",
				}),
			);

			expect(mockAnalysisRepo.updateContent).toHaveBeenCalledWith({
				id: ANALYSIS_ID,
				content: expect.stringContaining("The Dynamic Between You"),
				modelUsed: "claude-sonnet",
			});
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should increment retry count when inviter session not found", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
				Effect.succeed(userId === INVITER_ID ? null : mockSession(userId)),
			);

			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(false);
			expect(mockAnalysisRepo.incrementRetryCount).toHaveBeenCalledWith(ANALYSIS_ID);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should increment retry count when invitee session not found", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
				Effect.succeed(userId === INVITEE_ID ? null : mockSession(userId)),
			);

			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(false);
			expect(mockAnalysisRepo.incrementRetryCount).toHaveBeenCalledWith(ANALYSIS_ID);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should handle idempotent update gracefully", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.updateContent.mockReturnValue(
				Effect.fail(new AnalysisNotFoundError({ analysisId: ANALYSIS_ID })),
			);

			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(true);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Analysis already has content, skipping update",
				expect.objectContaining({ analysisId: ANALYSIS_ID }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should send email notification after successful generation (Story 35-5)", () =>
		Effect.gen(function* () {
			yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			// Email sent to both users
			expect(mockEmailRepo.sendEmail).toHaveBeenCalledTimes(2);
			expect(mockAnalysisRepo.getParticipantEmails).toHaveBeenCalledWith(ANALYSIS_ID);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should NOT send email notification on idempotent skip (Story 35-5)", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.updateContent.mockReturnValue(
				Effect.fail(new AnalysisNotFoundError({ analysisId: ANALYSIS_ID })),
			);

			yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			// No emails sent because content was already present
			expect(mockEmailRepo.sendEmail).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should load conversation evidence by session for both users", () =>
		Effect.gen(function* () {
			yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			// Both users' sessions queried
			expect(mockSessionRepo.findSessionByUserId).toHaveBeenCalledWith(INVITER_ID);
			expect(mockSessionRepo.findSessionByUserId).toHaveBeenCalledWith(INVITEE_ID);

			// Results loaded for both sessions
			expect(mockResultsRepo.getBySessionId).toHaveBeenCalledTimes(2);

			// Conversation evidence loaded by session for both users
			expect(mockConversationEvidenceRepo.findBySession).toHaveBeenCalledTimes(2);
		}).pipe(Effect.provide(createTestLayer())),
	);
});
