/**
 * Generate weekly summary letters for all qualifying users (Story 5.1).
 *
 * Eligibility: ≥3 daily check-ins in the ISO week window.
 * Idempotent: skips users who already have generated content for that week.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import {
	AppConfig,
	AssessmentResultError,
	AssessmentResultRepository,
	ConversationRepository,
	computeTraitResults,
	DailyCheckInRepository,
	DatabaseError,
	type FacetName,
	type FacetScoresMap,
	generateOceanCode,
	LoggerRepository,
	lookupArchetype,
	PushNotificationQueueRepository,
	PushSubscriptionRepository,
	ResendEmailRepository,
	resolveIsoWeekBounds,
	TRAIT_NAMES,
	Unauthorized,
	UserAccountRepository,
	WebPushRepository,
	WeeklySummaryGeneratorRepository,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect, Redacted, Schedule } from "effect";
import { sendWeeklyLetterReadyNotification } from "./send-weekly-letter-ready-notification.use-case";

const MIN_CHECK_INS = 3;
/** Parallel LLM + DB work per user; keeps cron HTTP from serializing unbounded wall time. */
const USER_PIPELINE_CONCURRENCY = 3;

/** Compare secrets without leaking length via early-exit string compare. */
const constantTimeSecretEqual = (a: string, b: string): boolean => {
	const ha = createHash("sha256").update(a, "utf8").digest();
	const hb = createHash("sha256").update(b, "utf8").digest();
	return timingSafeEqual(ha, hb);
};

export interface GenerateWeeklySummariesForWeekInput {
	readonly weekId: string;
	/** `x-cron-secret` header value when present; must match `CRON_SECRET` when that env is set. */
	readonly cronSecretHeader?: string | undefined;
}

export interface GenerateWeeklySummariesForWeekOutput {
	readonly processed: number;
	readonly skipped: number;
	readonly failed: number;
}

export const generateWeeklySummariesForWeek = (
	input: GenerateWeeklySummariesForWeekInput,
): Effect.Effect<
	GenerateWeeklySummariesForWeekOutput,
	DatabaseError | AssessmentResultError | Unauthorized,
	| AppConfig
	| WeeklySummaryRepository
	| DailyCheckInRepository
	| ConversationRepository
	| AssessmentResultRepository
	| WeeklySummaryGeneratorRepository
	| LoggerRepository
	| UserAccountRepository
	| ResendEmailRepository
	| PushSubscriptionRepository
	| PushNotificationQueueRepository
	| WebPushRepository
> =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const configuredCron = Redacted.value(config.cronSecret);
		if (configuredCron.length > 0) {
			const header = input.cronSecretHeader ?? "";
			if (!constantTimeSecretEqual(header, configuredCron)) {
				return yield* Effect.fail(new Unauthorized({ message: "Invalid or missing x-cron-secret" }));
			}
		}

		const bounds = resolveIsoWeekBounds(input.weekId);
		if (!bounds) {
			return yield* Effect.fail(new DatabaseError({ message: `Invalid weekId: ${input.weekId}` }));
		}

		const weekStartLocal = bounds.weekStartLocal;
		const weekEndLocal = bounds.weekEndLocal;

		const dailyRepo = yield* DailyCheckInRepository;
		const weeklyRepo = yield* WeeklySummaryRepository;
		const sessionRepo = yield* ConversationRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const generator = yield* WeeklySummaryGeneratorRepository;
		const logger = yield* LoggerRepository;

		const eligibleUserIds = yield* dailyRepo.listUserIdsWithAtLeastNCheckInsInRange(
			MIN_CHECK_INS,
			weekStartLocal,
			weekEndLocal,
		);

		const runForOneUser = (userId: string) =>
			Effect.gen(function* () {
				const existing = yield* weeklyRepo.getByUserAndWeekStart(userId, weekStartLocal);
				if (existing?.generatedAt && existing.content) {
					return { processed: 0, skipped: 1, failed: 0 };
				}

				const session = yield* sessionRepo.findSessionByUserId(userId);
				if (!session) {
					logger.info("Weekly summary: skip user without conversation session", { userId });
					return { processed: 0, skipped: 1, failed: 0 };
				}

				const result = yield* resultsRepo.getBySessionId(session.id);
				if (!result) {
					logger.info("Weekly summary: skip user without assessment result", { userId });
					return { processed: 0, skipped: 1, failed: 0 };
				}

				const checkIns = yield* dailyRepo.listForWeek(userId, weekStartLocal, weekEndLocal);
				if (checkIns.length < MIN_CHECK_INS) {
					return { processed: 0, skipped: 1, failed: 0 };
				}

				const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
				for (const [facetName, data] of Object.entries(result.facets)) {
					if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
						facetScoresMap[facetName as FacetName] = {
							score: data.score,
							confidence: data.confidence,
						};
					}
				}

				if (Object.keys(facetScoresMap).length === 0) {
					logger.info("Weekly summary: skip user with empty facet scores", { userId });
					return { processed: 0, skipped: 1, failed: 0 };
				}

				const traitScoresMap = computeTraitResults(facetScoresMap);
				const oceanCode = generateOceanCode(facetScoresMap);
				const archetype = lookupArchetype(oceanCode.slice(0, 4));
				const traitLines = TRAIT_NAMES.map((trait) => {
					const t = traitScoresMap[trait];
					return `- ${trait}: score=${t.score}, confidence=${Math.round(t.confidence)}`;
				});

				const genResult = yield* generator
					.generateLetter({
						weekId: input.weekId,
						weekStartDate: weekStartLocal,
						weekEndDate: weekEndLocal,
						checkIns: checkIns.map((c) => ({
							localDate: c.localDate,
							mood: c.mood,
							note: c.note,
						})),
						oceanCode,
						archetypeName: archetype.name,
						archetypeDescription: archetype.description,
						traitLines,
					})
					.pipe(
						Effect.retry({
							times: 2,
							schedule: Schedule.exponential("5 seconds"),
						}),
						Effect.map((out) => ({ _tag: "success" as const, out })),
						Effect.catchTag("WeeklySummaryGenerationError", (error) =>
							Effect.succeed({ _tag: "failure" as const, error }),
						),
					);

				if (genResult._tag === "success") {
					yield* weeklyRepo.save({
						outcome: "generated",
						userId,
						weekStartDate: weekStartLocal,
						weekEndDate: weekEndLocal,
						content: genResult.out.content,
						generatedAt: new Date(),
					});
					logger.info("Weekly summary saved", { userId, weekId: input.weekId });

					yield* sendWeeklyLetterReadyNotification({ userId, weekId: input.weekId }).pipe(
						Effect.catchAll((error) =>
							Effect.sync(() => {
								const tag =
									error !== null && typeof error === "object" && "_tag" in error
										? String((error as { _tag: string })._tag)
										: "unknown";
								const message =
									error !== null && typeof error === "object" && "message" in error
										? String((error as { message: unknown }).message)
										: String(error);
								logger.warn("Weekly letter ready notification failed (fail-open)", {
									userId,
									weekId: input.weekId,
									errorTag: tag,
									message,
								});
							}),
						),
					);

					return { processed: 1, skipped: 0, failed: 0 };
				}

				yield* weeklyRepo.save({
					outcome: "failed",
					userId,
					weekStartDate: weekStartLocal,
					weekEndDate: weekEndLocal,
					failedAt: new Date(),
				});
				logger.error("Weekly summary generation failed after retries", {
					userId,
					weekId: input.weekId,
					error: genResult.error._tag,
					message: genResult.error.message,
					...(genResult.error.cause !== undefined ? { cause: genResult.error.cause } : {}),
				});
				return { processed: 0, skipped: 0, failed: 1 };
			});

		const outcomes = yield* Effect.forEach(
			eligibleUserIds,
			(userId) =>
				runForOneUser(userId).pipe(
					Effect.catchAll((error) =>
						Effect.sync(() => {
							logger.error("Weekly summary: per-user pipeline error", {
								userId,
								errorTag:
									error !== null && typeof error === "object" && "_tag" in error
										? String((error as { _tag: string })._tag)
										: "unknown",
								message: error instanceof Error ? error.message : String(error),
							});
							return { processed: 0, skipped: 0, failed: 1 };
						}),
					),
				),
			{ concurrency: USER_PIPELINE_CONCURRENCY },
		);

		return {
			processed: outcomes.reduce((a, o) => a + o.processed, 0),
			skipped: outcomes.reduce((a, o) => a + o.skipped, 0),
			failed: outcomes.reduce((a, o) => a + o.failed, 0),
		};
	});
