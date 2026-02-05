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

import { RateLimitExceeded } from "@workspace/contracts";
import { CostGuardRepository, RedisRepository } from "@workspace/domain";
import { DateTime, Effect, Layer } from "effect";

/**
 * TTL in seconds: 48 hours
 * Ensures keys persist long enough for timezone edge cases
 */
const TTL_SECONDS = 48 * 60 * 60;

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
const getDateKey = (): string => {
	// biome-ignore lint/style/noNonNullAssertion: ISO 8601 format guarantees T separator
	return new Date().toISOString().split("T")[0]!;
};

/**
 * Get next day midnight UTC for rate limit reset
 */
const getNextDayMidnightUTC = (): Date => {
	const tomorrow = new Date();
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	tomorrow.setUTCHours(0, 0, 0, 0);
	return tomorrow;
};

/**
 * CostGuard Repository Layer - Uses Redis for storage
 *
 * Layer type: Layer<CostGuardRepository, never, RedisRepository>
 */
export const CostGuardRedisRepositoryLive = Layer.effect(
	CostGuardRepository,
	Effect.gen(function* () {
		const redis = yield* RedisRepository;

		return CostGuardRepository.of({
			incrementDailyCost: (userId: string, costCents: number) =>
				Effect.gen(function* () {
					const key = `cost:${userId}:${getDateKey()}`;
					const newValue = yield* redis.incrby(key, costCents);

					// Only set TTL if key is new (TTL returns -1 for no expiration)
					const existingTTL = yield* redis.ttl(key);
					if (existingTTL === -1) {
						yield* redis.expire(key, TTL_SECONDS);
					}

					return newValue;
				}),

			getDailyCost: (userId: string) =>
				Effect.gen(function* () {
					const key = `cost:${userId}:${getDateKey()}`;
					const value = yield* redis.get(key);
					return value ? parseInt(value, 10) : 0;
				}),

			incrementAssessmentCount: (userId: string) =>
				Effect.gen(function* () {
					const key = `assessments:${userId}:${getDateKey()}`;
					const newValue = yield* redis.incr(key);

					// Only set TTL if key is new (TTL returns -1 for no expiration)
					const existingTTL = yield* redis.ttl(key);
					if (existingTTL === -1) {
						yield* redis.expire(key, TTL_SECONDS);
					}

					return newValue;
				}),

			getAssessmentCount: (userId: string) =>
				Effect.gen(function* () {
					const key = `assessments:${userId}:${getDateKey()}`;
					const value = yield* redis.get(key);
					return value ? parseInt(value, 10) : 0;
				}),

			canStartAssessment: (userId: string) =>
				Effect.gen(function* () {
					const key = `assessments:${userId}:${getDateKey()}`;
					const value = yield* redis.get(key);
					const count = value ? parseInt(value, 10) : 0;
					return count < 1; // Allow if count is 0
				}),

			recordAssessmentStart: (userId: string) =>
				Effect.gen(function* () {
					const key = `assessments:${userId}:${getDateKey()}`;

					// Atomic increment
					const newCount = yield* redis.incr(key);

					// Check overflow (should never happen if canStartAssessment called first)
					if (newCount > 1) {
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

	// biome-ignore lint/style/noNonNullAssertion: ISO 8601 format guarantees T separator
	const getDateKey = (): string => new Date().toISOString().split("T")[0]!;

	return CostGuardRepository.of({
		incrementDailyCost: (userId: string, costCents: number) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${getDateKey()}`;
				const current = costs.get(key) || 0;
				const newValue = current + costCents;
				costs.set(key, newValue);
				return newValue;
			}),

		getDailyCost: (userId: string) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${getDateKey()}`;
				return costs.get(key) || 0;
			}),

		incrementAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getDateKey()}`;
				const current = assessments.get(key) || 0;
				const newValue = current + 1;
				assessments.set(key, newValue);
				return newValue;
			}),

		getAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getDateKey()}`;
				return assessments.get(key) || 0;
			}),

		canStartAssessment: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${getDateKey()}`;
				const count = assessments.get(key) || 0;
				return count < 1; // Allow if count is 0
			}),

		recordAssessmentStart: (userId: string) =>
			Effect.gen(function* () {
				const key = `assessments:${userId}:${getDateKey()}`;

				// Atomic increment simulation
				const current = assessments.get(key) || 0;
				const newCount = current + 1;
				assessments.set(key, newCount);

				// Check overflow
				if (newCount > 1) {
					return yield* Effect.fail(
						new RateLimitExceeded({
							userId,
							message: "You can start a new assessment tomorrow",
							resetAt: DateTime.unsafeMake(getNextDayMidnightUTC().getTime()),
						}),
					);
				}
			}),
	});
};

/**
 * Test CostGuard Repository Layer
 */
export const CostGuardTestRepositoryLive = Layer.succeed(
	CostGuardRepository,
	createTestCostGuardRepository(),
);
