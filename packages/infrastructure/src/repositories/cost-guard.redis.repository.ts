/**
 * CostGuard Repository Implementation using Redis
 *
 * Provides cost tracking and rate limiting operations.
 * Uses Redis for atomic operations and automatic expiration.
 *
 * Key formats:
 * - Cost: cost:{userId}:{YYYY-MM-DD}
 * - Assessments: assessments:{userId}:{YYYY-MM-DD}
 *
 * TTL: 48 hours (auto-cleanup after day expires)
 */

import {
	CostGuardRepository,
	getNextDayMidnightUTC,
	getUTCDateKey,
	LoggerRepository,
	RedisOperationError,
	RedisRepository,
} from "@workspace/domain";
import {
	CostLimitExceeded,
	MessageRateLimitError,
	RateLimitExceeded,
} from "@workspace/domain/errors/http.errors";
import { DateTime, Effect, Layer } from "effect";

/**
 * TTL in seconds: 48 hours
 * Ensures keys persist long enough for timezone edge cases
 */
const TTL_SECONDS = 48 * 60 * 60;

/**
 * Daily assessment limit per user.
 * Users can start 1 new assessment per day (can resume existing).
 */
const DAILY_ASSESSMENT_LIMIT = 1;

/**
 * Per-user message rate limit: 2 messages per minute (fixed-window)
 */
const MESSAGE_RATE_LIMIT = 2;

/**
 * CostGuard Repository Layer - Uses Redis for storage
 *
 * Layer type: Layer<CostGuardRepository, never, RedisRepository | LoggerRepository>
 */
export const CostGuardRedisRepositoryLive = Layer.effect(
	CostGuardRepository,
	Effect.gen(function* () {
		const redis = yield* RedisRepository;
		const logger = yield* LoggerRepository;

		return CostGuardRepository.of({
			incrementDailyCost: (userId: string, costCents: number) =>
				Effect.gen(function* () {
					if (!userId || userId.trim() === "") {
						return yield* Effect.fail(
							new RedisOperationError("userId is required for incrementDailyCost"),
						);
					}

					const dateKey = getUTCDateKey();
					const key = `cost:${userId}:${dateKey}`;
					const newValue = yield* redis.incrby(key, costCents);

					// Only set TTL if key is new (TTL returns -1 for no expiration)
					const existingTTL = yield* redis.ttl(key);
					if (existingTTL === -1) {
						yield* redis.expire(key, TTL_SECONDS);
					}

					logger.info("Cost incremented", {
						userId,
						costCents,
						newDailyTotal: newValue,
						dateKey,
					});

					return newValue;
				}),

			getDailyCost: (userId: string) =>
				Effect.gen(function* () {
					if (!userId || userId.trim() === "") {
						return yield* Effect.fail(new RedisOperationError("userId is required for getDailyCost"));
					}

					const dateKey = getUTCDateKey();
					const key = `cost:${userId}:${dateKey}`;
					const value = yield* redis.get(key);
					const cost = value ? parseInt(value, 10) : 0;

					logger.debug("Daily cost retrieved", {
						userId,
						cost,
						dateKey,
					});

					return cost;
				}),

			incrementAssessmentCount: (userId: string) =>
				Effect.gen(function* () {
					if (!userId || userId.trim() === "") {
						return yield* Effect.fail(
							new RedisOperationError("userId is required for incrementAssessmentCount"),
						);
					}

					const dateKey = getUTCDateKey();
					const key = `assessments:${userId}:${dateKey}`;
					const newValue = yield* redis.incr(key);

					// Only set TTL if key is new (TTL returns -1 for no expiration)
					const existingTTL = yield* redis.ttl(key);
					if (existingTTL === -1) {
						yield* redis.expire(key, TTL_SECONDS);
					}

					logger.debug("Assessment count incremented", {
						userId,
						newCount: newValue,
						dateKey,
					});

					return newValue;
				}),

			getAssessmentCount: (userId: string) =>
				Effect.gen(function* () {
					if (!userId || userId.trim() === "") {
						return yield* Effect.fail(
							new RedisOperationError("userId is required for getAssessmentCount"),
						);
					}

					const dateKey = getUTCDateKey();
					const key = `assessments:${userId}:${dateKey}`;
					const value = yield* redis.get(key);
					const count = value ? parseInt(value, 10) : 0;

					logger.debug("Assessment count retrieved", {
						userId,
						count,
						dateKey,
					});

					return count;
				}),

			canStartAssessment: (userId: string) =>
				Effect.gen(function* () {
					if (!userId || userId.trim() === "") {
						return yield* Effect.fail(
							new RedisOperationError("userId is required for canStartAssessment"),
						);
					}

					const dateKey = getUTCDateKey();
					const key = `assessments:${userId}:${dateKey}`;
					const value = yield* redis.get(key);
					const count = value ? parseInt(value, 10) : 0;
					const canStart = count < DAILY_ASSESSMENT_LIMIT;

					logger.debug("Rate limit check", {
						userId,
						currentCount: count,
						limit: DAILY_ASSESSMENT_LIMIT,
						canStart,
						dateKey,
					});

					return canStart;
				}),

			recordAssessmentStart: (userId: string) =>
				Effect.gen(function* () {
					if (!userId || userId.trim() === "") {
						return yield* Effect.fail(
							new RedisOperationError("userId is required for recordAssessmentStart"),
						);
					}

					const dateKey = getUTCDateKey();
					const key = `assessments:${userId}:${dateKey}`;

					// Atomic increment
					const newCount = yield* redis.incr(key);

					// Check overflow (should never happen if canStartAssessment called first)
					if (newCount > DAILY_ASSESSMENT_LIMIT) {
						logger.warn("Rate limit exceeded - assessment start blocked", {
							userId,
							currentCount: newCount,
							limit: DAILY_ASSESSMENT_LIMIT,
							resetAt: getNextDayMidnightUTC().toISOString(),
							dateKey,
						});

						return yield* Effect.fail(
							new RateLimitExceeded({
								userId,
								message: "You can start a new assessment tomorrow",
								resetAt: DateTime.unsafeMake(getNextDayMidnightUTC().getTime()),
							}),
						);
					}

					// Set TTL on new key (TTL returns -1 for no expiration)
					const existingTTL = yield* redis.ttl(key);
					if (existingTTL === -1) {
						yield* redis.expire(key, TTL_SECONDS);
					}

					logger.info("Assessment start recorded", {
						userId,
						count: newCount,
						dateKey,
					});
				}),

			checkDailyBudget: (key: string, limitCents: number) =>
				Effect.gen(function* () {
					if (!key || key.trim() === "") {
						return yield* Effect.fail(new RedisOperationError("key is required for checkDailyBudget"));
					}

					const dateKey = getUTCDateKey();
					const redisKey = `cost:${key}:${dateKey}`;
					const value = yield* redis.get(redisKey);
					const dailyCostCents = value ? parseInt(value, 10) : 0;

					if (dailyCostCents >= limitCents) {
						return yield* Effect.fail(
							new CostLimitExceeded({
								dailySpend: dailyCostCents,
								limit: limitCents,
								resumeAfter: DateTime.unsafeFromDate(getNextDayMidnightUTC()),
								message: "Daily cost limit exceeded",
							}),
						);
					}
				}),

			checkMessageRateLimit: (key: string) =>
				Effect.gen(function* () {
					const bucket = Math.floor(Date.now() / 60000);
					const redisKey = `msgrate:${key}:${bucket}`;
					const count = yield* redis.incr(redisKey);

					// Set TTL on first increment (2min safety margin)
					if (count === 1) {
						yield* redis.expire(redisKey, 120);
					}

					if (count > MESSAGE_RATE_LIMIT) {
						const secondsUntilExpiry = 60 - (Math.floor(Date.now() / 1000) % 60);

						logger.warn("Message rate limit exceeded", {
							key,
							event: "message_rate_limited",
							count,
							limit: MESSAGE_RATE_LIMIT,
						});

						return yield* Effect.fail(
							new MessageRateLimitError({
								retryAfter: secondsUntilExpiry,
								message: "Rate limit exceeded: maximum 2 messages per minute",
							}),
						);
					}
				}),
		});
	}),
);

/**
 * Create a test CostGuard repository with in-memory storage
 */
export const createTestCostGuardRepository = () => {
	const costs = new Map<string, number>();
	const assessments = new Map<string, number>();

	return CostGuardRepository.of({
		incrementDailyCost: (userId: string, costCents: number) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${getUTCDateKey()}`;
				const current = costs.get(key) || 0;
				const newValue = current + costCents;
				costs.set(key, newValue);
				return newValue;
			}),

		getDailyCost: (userId: string) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${getUTCDateKey()}`;
				return costs.get(key) || 0;
			}),

		incrementAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				const current = assessments.get(key) || 0;
				const newValue = current + 1;
				assessments.set(key, newValue);
				return newValue;
			}),

		getAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				return assessments.get(key) || 0;
			}),

		canStartAssessment: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getUTCDateKey()}`;
				const count = assessments.get(key) || 0;
				return count < DAILY_ASSESSMENT_LIMIT;
			}),

		recordAssessmentStart: (userId: string) =>
			Effect.gen(function* () {
				const key = `assessments:${userId}:${getUTCDateKey()}`;

				// Atomic increment simulation
				const current = assessments.get(key) || 0;
				const newCount = current + 1;
				assessments.set(key, newCount);

				// Check overflow
				if (newCount > DAILY_ASSESSMENT_LIMIT) {
					return yield* Effect.fail(
						new RateLimitExceeded({
							userId,
							message: "You can start a new assessment tomorrow",
							resetAt: DateTime.unsafeMake(getNextDayMidnightUTC().getTime()),
						}),
					);
				}
			}),

		checkDailyBudget: (_key: string, _limitCents: number) => Effect.void,

		checkMessageRateLimit: (_key: string) => Effect.void,
	});
};

/**
 * Test CostGuard Repository Layer
 */
export const CostGuardTestRepositoryLive = Layer.succeed(
	CostGuardRepository,
	createTestCostGuardRepository(),
);
