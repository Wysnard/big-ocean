/**
 * Send Relationship Analysis Notification Use Case Tests (Story 35-5)
 *
 * Tests:
 * - Sends email to both participants on success
 * - Handles missing participant data gracefully
 * - Email failures are swallowed (fire-and-forget)
 */

import { describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	EmailError,
	LoggerRepository,
	PushNotificationQueueRepository,
	PushSubscriptionRepository,
	RelationshipAnalysisRepository,
	ResendEmailRepository,
	WebPushRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { beforeEach, vi } from "vitest";
import { sendRelationshipAnalysisNotification } from "../send-relationship-analysis-notification.use-case";

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

const mockPushSubscriptionRepo = {
	upsert: vi.fn(),
	listByUserId: vi.fn(),
	deleteByEndpoint: vi.fn(),
	deleteByUserId: vi.fn(),
};

const mockPushQueueRepo = {
	enqueue: vi.fn(),
	consumeByUserId: vi.fn(),
	deleteByDedupeKey: vi.fn(),
};

const mockWebPushRepo = {
	sendNotification: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
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
	subscriptionNudgeThresholdDays: 21,
	sessionCostLimitCents: 2000,
	pushVapidPublicKey: undefined,
	pushVapidPrivateKey: undefined,
	pushVapidSubject: undefined,
	nerinDirectorModelId: "claude-haiku-4-5-20251001",
	nerinDirectorMaxTokens: 1024,
	nerinDirectorTemperature: 0.7,
	nerinDirectorRetryTemperature: 0.9,
};

const ANALYSIS_ID = "analysis-123";

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(ResendEmailRepository, mockEmailRepo),
		Layer.succeed(PushSubscriptionRepository, mockPushSubscriptionRepo),
		Layer.succeed(PushNotificationQueueRepository, mockPushQueueRepo),
		Layer.succeed(WebPushRepository, mockWebPushRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AppConfig, mockConfig),
	);

describe("sendRelationshipAnalysisNotification (Story 35-5)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockAnalysisRepo.getParticipantEmails.mockReturnValue(
			Effect.succeed({
				userAId: "user-a",
				userAEmail: "alice@example.com",
				userAName: "Alice",
				userBId: "user-b",
				userBEmail: "bob@example.com",
				userBName: "Bob",
			}),
		);
		mockEmailRepo.sendEmail.mockReturnValue(Effect.void);
		mockPushSubscriptionRepo.listByUserId.mockReturnValue(Effect.succeed([]));
		mockPushSubscriptionRepo.deleteByEndpoint.mockReturnValue(Effect.void);
		mockPushQueueRepo.enqueue.mockImplementation(({ userId, title, body, url, tag, dedupeKey }) =>
			Effect.succeed({
				id: `queue-${userId}`,
				userId,
				title,
				body,
				url,
				tag,
				dedupeKey,
				createdAt: new Date(),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			}),
		);
		mockPushQueueRepo.deleteByDedupeKey.mockReturnValue(Effect.void);
		mockWebPushRepo.sendNotification.mockReturnValue(Effect.void);
	});

	it.effect("should attempt push first and skip email when subscriptions exist", () =>
		Effect.gen(function* () {
			mockPushSubscriptionRepo.listByUserId.mockImplementation((userId: string) =>
				Effect.succeed([
					{
						id: `sub-${userId}`,
						userId,
						endpoint: `https://push.example/${userId}`,
						keys: { p256dh: "p256dh", auth: "auth" },
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
			);

			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockWebPushRepo.sendNotification).toHaveBeenCalledTimes(2);
			expect(mockPushQueueRepo.enqueue).toHaveBeenCalledTimes(2);
			expect(mockEmailRepo.sendEmail).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should fall back to email when no push subscription exists", () =>
		Effect.gen(function* () {
			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockEmailRepo.sendEmail).toHaveBeenCalledTimes(2);
			const firstCall = mockEmailRepo.sendEmail.mock.calls[0][0];
			expect(firstCall.subject).toBe("Bob and you - Nerin has something to share");
			expect(firstCall.html).toContain("relationship letter");
			expect(firstCall.html).toContain(`https://bigocean.dev/relationship/${ANALYSIS_ID}`);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should handle missing participant data gracefully", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getParticipantEmails.mockReturnValue(Effect.succeed(null));

			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockEmailRepo.sendEmail).not.toHaveBeenCalled();
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Cannot send relationship letter notification: participant data not found",
				expect.objectContaining({ analysisId: ANALYSIS_ID }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should fall back to email when push delivery fails", () =>
		Effect.gen(function* () {
			mockPushSubscriptionRepo.listByUserId.mockImplementation((userId: string) =>
				Effect.succeed([
					{
						id: `sub-${userId}`,
						userId,
						endpoint: `https://push.example/${userId}`,
						keys: { p256dh: "p256dh", auth: "auth" },
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]),
			);
			mockWebPushRepo.sendNotification.mockReturnValue(
				Effect.fail({
					_tag: "PushDeliveryError",
					endpoint: "https://push.example/user-a",
					reason: "gateway timeout",
				}),
			);

			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockEmailRepo.sendEmail).toHaveBeenCalledTimes(2);
			expect(mockPushQueueRepo.deleteByDedupeKey).toHaveBeenCalledTimes(2);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Relationship letter push delivery failed",
				expect.objectContaining({ analysisId: ANALYSIS_ID }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should isolate one participant failure and continue the other leg", () =>
		Effect.gen(function* () {
			mockPushSubscriptionRepo.listByUserId.mockImplementation((userId: string) =>
				Effect.succeed(userId === "user-a" ? [] : []),
			);
			mockEmailRepo.sendEmail
				.mockReturnValueOnce(Effect.fail(new EmailError("SMTP failure")))
				.mockReturnValueOnce(Effect.void);

			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockEmailRepo.sendEmail).toHaveBeenCalledTimes(2);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Relationship letter notification leg failed (fail-open)",
				expect.objectContaining({
					analysisId: ANALYSIS_ID,
					participantRole: "user-a",
				}),
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Relationship letter notification delivered via email fallback",
				expect.objectContaining({
					analysisId: ANALYSIS_ID,
					participantRole: "user-b",
				}),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should not expose personality data in fallback email", () =>
		Effect.gen(function* () {
			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			const firstCall = mockEmailRepo.sendEmail.mock.calls[0][0];
			expect(firstCall.html).not.toContain("OCEAN");
			expect(firstCall.html).not.toContain("trait");
			expect(firstCall.html).not.toContain("facet");
			expect(firstCall.html).not.toContain("score");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
