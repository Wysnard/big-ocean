/**
 * Weekly letter ready notifications (Story 5.3)
 */

import { describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	LoggerRepository,
	PushNotificationQueueRepository,
	PushSubscriptionRepository,
	ResendEmailRepository,
	UserAccountRepository,
	WebPushRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { vi } from "vitest";
import { sendWeeklyLetterReadyNotification } from "../send-weekly-letter-ready-notification.use-case";

const mockAccount = {
	getEmailAndNameForUser: vi.fn(),
};

const mockEmail = {
	sendEmail: vi.fn(),
};

const mockPushSub = {
	listByUserId: vi.fn(),
	deleteByEndpoint: vi.fn(),
};

const mockPushQueue = {
	enqueue: vi.fn(),
	deleteByDedupeKey: vi.fn(),
	consumeByUserId: vi.fn(),
};

const mockWebPush = {
	sendNotification: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

const mockConfig = {
	frontendUrl: "https://bigocean.test",
	databaseUrl: "",
	redisUrl: "",
	anthropicApiKey: Redacted.make("x"),
	betterAuthSecret: Redacted.make("x"),
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
	polarAccessToken: Redacted.make("x"),
	polarWebhookSecret: Redacted.make("x"),
	polarProductPortraitUnlock: "",
	polarProductRelationshipSingle: "",
	polarProductRelationship5Pack: "",
	polarProductExtendedConversation: "",
	globalDailyAssessmentLimit: 0,
	minEvidenceWeight: 0,
	resendApiKey: Redacted.make("x"),
	emailFromAddress: "noreply@bigocean.test",
	dropOffThresholdHours: 24,
	checkInThresholdDays: 14,
	subscriptionNudgeThresholdDays: 21,
	recaptureThresholdDays: 3,
	sessionCostLimitCents: 2000,
	pushVapidPublicKey: undefined,
	pushVapidPrivateKey: undefined,
	pushVapidSubject: undefined,
	nerinDirectorModelId: "",
	nerinDirectorMaxTokens: 0,
	nerinDirectorTemperature: 0,
	nerinDirectorRetryTemperature: 0,
	cronSecret: Redacted.make(""),
};

const createLayer = () =>
	Layer.mergeAll(
		Layer.succeed(UserAccountRepository, mockAccount),
		Layer.succeed(ResendEmailRepository, mockEmail),
		Layer.succeed(PushSubscriptionRepository, mockPushSub),
		Layer.succeed(PushNotificationQueueRepository, mockPushQueue),
		Layer.succeed(WebPushRepository, mockWebPush),
		Layer.succeed(AppConfig, mockConfig),
		Layer.succeed(LoggerRepository, mockLogger),
	);

describe("sendWeeklyLetterReadyNotification", () => {
	it.effect("sends email when user has no push subscriptions", () =>
		Effect.gen(function* () {
			vi.clearAllMocks();
			mockAccount.getEmailAndNameForUser.mockReturnValue(
				Effect.succeed({ email: "user@example.com", name: "Alex" }),
			);
			mockPushSub.listByUserId.mockReturnValue(Effect.succeed([]));
			mockEmail.sendEmail.mockReturnValue(Effect.succeed(undefined));

			yield* sendWeeklyLetterReadyNotification({ userId: "u1", weekId: "2026-W15" }).pipe(
				Effect.provide(createLayer()),
			);

			expect(mockEmail.sendEmail).toHaveBeenCalledTimes(1);
			expect(mockEmail.sendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: "user@example.com",
					html: expect.stringContaining("Read your letter") as string,
				}),
			);
		}),
	);

	it.effect("enqueues push with correct dedupeKey and deep-link url", () =>
		Effect.gen(function* () {
			vi.clearAllMocks();
			const fakeSubscription = {
				endpoint: "https://push.example.com/sub1",
				userId: "u1",
				keys: { p256dh: "key", auth: "auth" },
			};
			mockAccount.getEmailAndNameForUser.mockReturnValue(
				Effect.succeed({ email: "user@example.com", name: "Alex" }),
			);
			mockPushSub.listByUserId.mockReturnValue(Effect.succeed([fakeSubscription]));
			mockPushQueue.enqueue.mockReturnValue(Effect.succeed(undefined));
			mockWebPush.sendNotification.mockReturnValue(Effect.succeed(undefined));

			yield* sendWeeklyLetterReadyNotification({ userId: "u1", weekId: "2026-W15" }).pipe(
				Effect.provide(createLayer()),
			);

			expect(mockPushQueue.enqueue).toHaveBeenCalledWith(
				expect.objectContaining({
					dedupeKey: "weekly-letter-ready:2026-W15:u1",
					url: "https://bigocean.test/today/week/2026-W15",
				}),
			);
			expect(mockEmail.sendEmail).not.toHaveBeenCalled();
		}),
	);
});
