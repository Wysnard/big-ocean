/**
 * Generate weekly summaries use case (Story 5.1)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	ALL_FACETS,
	AppConfig,
	AssessmentResultRepository,
	ConversationRepository,
	DailyCheckInRepository,
	type FacetName,
	LoggerRepository,
	WeeklySummaryGenerationError,
	WeeklySummaryGeneratorRepository,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect, Fiber, Layer, Redacted, TestClock, TestContext } from "effect";
import { vi } from "vitest";
import { generateWeeklySummariesForWeek } from "../generate-weekly-summary.use-case";

const mockDailyRepo = {
	upsert: vi.fn(),
	getByDate: vi.fn(),
	listForWeek: vi.fn(),
	listForMonth: vi.fn(),
	listUserIdsWithAtLeastNCheckInsInRange: vi.fn(),
};

const mockWeeklyRepo = {
	save: vi.fn(),
	getByUserAndWeekStart: vi.fn(),
	getByWeekId: vi.fn(),
	getByUserId: vi.fn(),
	getLatestForUser: vi.fn(),
};

const mockSessionRepo = {
	findSessionByUserId: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
};

const mockGenerator = {
	generateLetter: vi.fn(),
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
	portraitGeneratorModelId: "claude-sonnet-test",
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
	recaptureThresholdDays: 3,
	sessionCostLimitCents: 2000,
	pushVapidPublicKey: undefined,
	pushVapidPrivateKey: undefined,
	pushVapidSubject: undefined,
	nerinDirectorModelId: "claude-haiku-4-5-20251001",
	nerinDirectorMaxTokens: 1024,
	nerinDirectorTemperature: 0.7,
	nerinDirectorRetryTemperature: 0.9,
	cronSecret: Redacted.make(""),
};

const facetsRecord = Object.fromEntries(
	ALL_FACETS.map((f) => [f, { score: 10, confidence: 0.8 }]),
) as Record<FacetName, { score: number; confidence: number }>;

const mockAssessmentResult = (sessionId: string) => ({
	id: `result-${sessionId}`,
	assessmentSessionId: sessionId,
	facets: facetsRecord,
	traits: {},
	domainCoverage: {},
	portrait: "",
	stage: "completed" as const,
	createdAt: new Date(),
});

const threeCheckIns = (userId: string) => [
	{
		id: "1",
		userId,
		localDate: "2026-04-06",
		mood: "good" as const,
		note: null,
		visibility: "private" as const,
		createdAt: new Date(),
	},
	{
		id: "2",
		userId,
		localDate: "2026-04-07",
		mood: "okay" as const,
		note: "busy",
		visibility: "private" as const,
		createdAt: new Date(),
	},
	{
		id: "3",
		userId,
		localDate: "2026-04-08",
		mood: "great" as const,
		note: null,
		visibility: "private" as const,
		createdAt: new Date(),
	},
];

const savedRow = {
	id: "ws-1",
	userId: "user-1",
	weekStartDate: "2026-04-06",
	weekEndDate: "2026-04-12",
	content: "# Letter",
	generatedAt: new Date(),
	failedAt: null,
	retryCount: 0,
	createdAt: new Date(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(DailyCheckInRepository, mockDailyRepo),
		Layer.succeed(WeeklySummaryRepository, mockWeeklyRepo),
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(WeeklySummaryGeneratorRepository, mockGenerator),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AppConfig, mockConfig),
	);

const WEEK_ID = "2026-W15";

describe("generateWeeklySummariesForWeek (Story 5.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockDailyRepo.listUserIdsWithAtLeastNCheckInsInRange.mockReturnValue(Effect.succeed([]));
		mockDailyRepo.listForWeek.mockReturnValue(Effect.succeed([]));
		mockWeeklyRepo.getByUserAndWeekStart.mockReturnValue(Effect.succeed(null));
		mockWeeklyRepo.save.mockReturnValue(Effect.succeed(savedRow));
		mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(null));
		mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(null));
		mockGenerator.generateLetter.mockReturnValue(
			Effect.succeed({ content: "# Hello week", modelUsed: "claude-sonnet-test" }),
		);
	});

	it.effect("fails with DatabaseError when weekId is invalid", () =>
		generateWeeklySummariesForWeek({ weekId: "not-a-week" }).pipe(
			Effect.provide(createTestLayer()),
			Effect.flip,
			Effect.tap((err) =>
				Effect.sync(() => {
					expect(err._tag).toBe("DatabaseError");
				}),
			),
			Effect.asVoid,
		),
	);

	it.effect("fails with Unauthorized when CRON_SECRET is set and header mismatches", () =>
		Effect.gen(function* () {
			const layer = Layer.mergeAll(
				createTestLayer(),
				Layer.succeed(AppConfig, {
					...mockConfig,
					cronSecret: Redacted.make("expected-secret"),
				}),
			);
			const err = yield* generateWeeklySummariesForWeek({
				weekId: WEEK_ID,
				cronSecretHeader: "wrong",
			}).pipe(Effect.provide(layer), Effect.flip);
			expect(err._tag).toBe("Unauthorized");
		}),
	);

	it.effect("returns zeros when no eligible users", () =>
		Effect.gen(function* () {
			const out = yield* generateWeeklySummariesForWeek({ weekId: WEEK_ID }).pipe(
				Effect.provide(createTestLayer()),
			);
			expect(out).toEqual({ processed: 0, skipped: 0, failed: 0 });
			expect(mockGenerator.generateLetter).not.toHaveBeenCalled();
		}),
	);

	it.effect("skips user when weekly summary already generated", () =>
		Effect.gen(function* () {
			mockDailyRepo.listUserIdsWithAtLeastNCheckInsInRange.mockReturnValue(Effect.succeed(["user-1"]));
			mockWeeklyRepo.getByUserAndWeekStart.mockReturnValue(
				Effect.succeed({
					...savedRow,
					content: "existing",
					generatedAt: new Date(),
				}),
			);

			const out = yield* generateWeeklySummariesForWeek({ weekId: WEEK_ID }).pipe(
				Effect.provide(createTestLayer()),
			);

			expect(out).toEqual({ processed: 0, skipped: 1, failed: 0 });
			expect(mockGenerator.generateLetter).not.toHaveBeenCalled();
		}),
	);

	it.effect("generates and saves when user qualifies and has assessment", () =>
		Effect.gen(function* () {
			const userId = "user-1";
			mockDailyRepo.listUserIdsWithAtLeastNCheckInsInRange.mockReturnValue(Effect.succeed([userId]));
			mockSessionRepo.findSessionByUserId.mockReturnValue(
				Effect.succeed({
					id: "session-1",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed" as const,
					messageCount: 10,
					oceanCode5: "OCBAV",
					archetypeName: "The Tapestry",
				}),
			);
			mockResultsRepo.getBySessionId.mockReturnValue(
				Effect.succeed(mockAssessmentResult("session-1")),
			);
			mockDailyRepo.listForWeek.mockReturnValue(Effect.succeed(threeCheckIns(userId)));

			const out = yield* generateWeeklySummariesForWeek({ weekId: WEEK_ID }).pipe(
				Effect.provide(createTestLayer()),
			);

			expect(out.processed).toBe(1);
			expect(out.failed).toBe(0);
			expect(mockWeeklyRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					outcome: "generated",
					userId,
					content: "# Hello week",
				}),
			);
		}),
	);

	it.scoped("records failure after LLM errors exhaust retries", () =>
		Effect.gen(function* () {
			const userId = "user-1";
			mockDailyRepo.listUserIdsWithAtLeastNCheckInsInRange.mockReturnValue(Effect.succeed([userId]));
			mockSessionRepo.findSessionByUserId.mockReturnValue(
				Effect.succeed({
					id: "session-1",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
					messageCount: 10,
					oceanCode5: "OCBAV",
					archetypeName: "The Tapestry",
				}),
			);
			mockResultsRepo.getBySessionId.mockReturnValue(
				Effect.succeed(mockAssessmentResult("session-1")),
			);
			mockDailyRepo.listForWeek.mockReturnValue(Effect.succeed(threeCheckIns(userId)));

			mockGenerator.generateLetter.mockReturnValue(
				Effect.fail(
					new WeeklySummaryGenerationError({
						message: "LLM down",
					}),
				),
			);

			const fiber = yield* Effect.fork(
				generateWeeklySummariesForWeek({ weekId: WEEK_ID }).pipe(Effect.provide(createTestLayer())),
			);
			yield* TestClock.adjust("20 seconds");
			const out = yield* Fiber.join(fiber);

			expect(out.processed).toBe(0);
			expect(out.failed).toBe(1);
			expect(mockWeeklyRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					outcome: "failed",
					userId,
				}),
			);
		}).pipe(Effect.provide(Layer.mergeAll(createTestLayer(), TestContext.TestContext))),
	);
});
