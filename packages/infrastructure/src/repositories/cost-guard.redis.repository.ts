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

import { Effect, Layer } from "effect";
import { CostGuardRepository, RedisRepository } from "@workspace/domain";

/**
 * TTL in seconds: 48 hours
 * Ensures keys persist long enough for timezone edge cases
 */
const TTL_SECONDS = 48 * 60 * 60;

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
const getDateKey = (): string => {
  return new Date().toISOString().split("T")[0];
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
          yield* redis.expire(key, TTL_SECONDS);
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
          yield* redis.expire(key, TTL_SECONDS);
          return newValue;
        }),

      getAssessmentCount: (userId: string) =>
        Effect.gen(function* () {
          const key = `assessments:${userId}:${getDateKey()}`;
          const value = yield* redis.get(key);
          return value ? parseInt(value, 10) : 0;
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

  const getDateKey = (): string => new Date().toISOString().split("T")[0];

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
  });
};

/**
 * Test CostGuard Repository Layer
 */
export const CostGuardTestRepositoryLive = Layer.succeed(
  CostGuardRepository,
  createTestCostGuardRepository(),
);
