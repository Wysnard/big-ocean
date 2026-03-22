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
	RelationshipAnalysisRepository,
	ResendEmailRepository,
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
	freeTierMessageThreshold: 0,
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

const ANALYSIS_ID = "analysis-123";

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(ResendEmailRepository, mockEmailRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AppConfig, mockConfig),
	);

describe("sendRelationshipAnalysisNotification (Story 35-5)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

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

	it.effect("should send email to both participants", () =>
		Effect.gen(function* () {
			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockEmailRepo.sendEmail).toHaveBeenCalledTimes(2);

			// First call — User A receives email with partner name "Bob"
			const firstCall = mockEmailRepo.sendEmail.mock.calls[0][0];
			expect(firstCall.to).toBe("alice@example.com");
			expect(firstCall.subject).toBe("Your relationship analysis is ready");
			expect(firstCall.html).toContain("Alice");
			expect(firstCall.html).toContain("Bob");
			expect(firstCall.html).toContain(`https://bigocean.dev/relationship/${ANALYSIS_ID}`);

			// Second call — User B receives email with partner name "Alice"
			const secondCall = mockEmailRepo.sendEmail.mock.calls[1][0];
			expect(secondCall.to).toBe("bob@example.com");
			expect(secondCall.html).toContain("Bob");
			expect(secondCall.html).toContain("Alice");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should handle missing participant data gracefully", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getParticipantEmails.mockReturnValue(Effect.succeed(null));

			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockEmailRepo.sendEmail).not.toHaveBeenCalled();
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Cannot send notification: participant data not found",
				expect.objectContaining({ analysisId: ANALYSIS_ID }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should swallow email send errors (fire-and-forget)", () =>
		Effect.gen(function* () {
			mockEmailRepo.sendEmail.mockReturnValue(Effect.fail(new EmailError("SMTP failure")));

			// Should not throw
			yield* sendRelationshipAnalysisNotification({ analysisId: ANALYSIS_ID });

			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to send relationship analysis notification (fail-open)",
				expect.objectContaining({ analysisId: ANALYSIS_ID }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should not expose personality data in email", () =>
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
