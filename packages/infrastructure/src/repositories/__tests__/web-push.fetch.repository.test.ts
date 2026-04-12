import crypto from "node:crypto";
import {
	AppConfig,
	type PushSubscriptionRecord,
	PushUnavailableError,
	WebPushRepository,
} from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Effect, Layer, Redacted } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebPushFetchRepositoryLive } from "../web-push.fetch.repository";

const subscription: PushSubscriptionRecord = {
	id: "sub-1",
	userId: "user-1",
	endpoint: "https://push.example/send/123",
	keys: {
		p256dh: "p256dh",
		auth: "auth",
	},
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

describe("WebPushFetchRepositoryLive", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("fails with PushUnavailableError when VAPID config is missing", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* WebPushRepository;
			return yield* repo.sendNotification(subscription);
		}).pipe(
			Effect.provide(
				Layer.mergeAll(
					WebPushFetchRepositoryLive,
					Layer.succeed(LoggerRepository, mockLogger),
					Layer.succeed(AppConfig, {
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
						pushVapidPublicKey: undefined,
						pushVapidPrivateKey: undefined,
						pushVapidSubject: undefined,
						sessionCostLimitCents: 2000,
						nerinDirectorModelId: "",
						nerinDirectorMaxTokens: 0,
						nerinDirectorTemperature: 0,
						nerinDirectorRetryTemperature: 0,
					}),
				),
			),
		);

		await expect(Effect.runPromise(program)).rejects.toMatchObject({
			_tag: "PushUnavailableError",
		} satisfies Partial<PushUnavailableError>);
	});

	it("sends a VAPID-authenticated wake-up request", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 201,
			text: async () => "",
		});
		vi.stubGlobal("fetch", fetchMock);

		const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
		const privateKeyPem = privateKey.export({ format: "pem", type: "pkcs8" }).toString();

		const program = Effect.gen(function* () {
			const repo = yield* WebPushRepository;
			yield* repo.sendNotification(subscription);
		}).pipe(
			Effect.provide(
				Layer.mergeAll(
					WebPushFetchRepositoryLive,
					Layer.succeed(LoggerRepository, mockLogger),
					Layer.succeed(AppConfig, {
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
						pushVapidPublicKey: "PUBLIC_KEY",
						pushVapidPrivateKey: Redacted.make(privateKeyPem),
						pushVapidSubject: "mailto:nerin@bigocean.dev",
						sessionCostLimitCents: 2000,
						nerinDirectorModelId: "",
						nerinDirectorMaxTokens: 0,
						nerinDirectorTemperature: 0,
						nerinDirectorRetryTemperature: 0,
					}),
				),
			),
		);

		await Effect.runPromise(program);

		expect(fetchMock).toHaveBeenCalledWith(
			subscription.endpoint,
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: expect.stringContaining("vapid t="),
					"Crypto-Key": "p256ecdsa=PUBLIC_KEY",
					TTL: "300",
				}),
			}),
		);
	});
});
