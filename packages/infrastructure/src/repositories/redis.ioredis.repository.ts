/**
 * Redis Repository Implementation using ioredis
 *
 * Provides Redis operations for cost tracking and rate limiting.
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for async implementation
 */

import { RedisConnectionError, RedisOperationError, RedisRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import Redis from "ioredis";

/**
 * Create Redis client from environment
 */
const createRedisClient = (): Redis => {
	const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
	return new Redis(redisUrl, {
		retryStrategy: (times: number) => {
			// Retry with exponential backoff, max 3 seconds
			const delay = Math.min(times * 100, 3000);
			return delay;
		},
		maxRetriesPerRequest: 3,
		enableReadyCheck: true,
		lazyConnect: false, // Connect immediately
	});
};

/**
 * Redis Repository Layer - Creates ioredis client instance
 *
 * Layer type: Layer<RedisRepository, RedisConnectionError, never>
 */
export const RedisIoRedisRepositoryLive = Layer.effect(
	RedisRepository,
	Effect.gen(function* () {
		const redis = createRedisClient();

		// Test connection on startup
		yield* Effect.tryPromise({
			try: () => redis.ping(),
			catch: (error) =>
				new RedisConnectionError(
					`Failed to connect to Redis: ${error instanceof Error ? error.message : String(error)}`,
				),
		});

		return RedisRepository.of({
			incrby: (key: string, value: number) =>
				Effect.tryPromise({
					try: () => redis.incrby(key, value),
					catch: (error) =>
						new RedisOperationError(
							`INCRBY failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
						),
				}),

			incr: (key: string) =>
				Effect.tryPromise({
					try: () => redis.incr(key),
					catch: (error) =>
						new RedisOperationError(
							`INCR failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
						),
				}),

			get: (key: string) =>
				Effect.tryPromise({
					try: () => redis.get(key),
					catch: (error) =>
						new RedisOperationError(
							`GET failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
						),
				}),

			expire: (key: string, seconds: number) =>
				Effect.tryPromise({
					try: () => redis.expire(key, seconds),
					catch: (error) =>
						new RedisOperationError(
							`EXPIRE failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
						),
				}),

			ttl: (key: string) =>
				Effect.tryPromise({
					try: () => redis.ttl(key),
					catch: (error) =>
						new RedisOperationError(
							`TTL failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
						),
				}),

			ping: () =>
				Effect.tryPromise({
					try: async () => {
						const result = await redis.ping();
						return result === "PONG";
					},
					catch: (error) =>
						new RedisConnectionError(
							`Redis ping failed: ${error instanceof Error ? error.message : String(error)}`,
						),
				}),

			disconnect: () =>
				Effect.promise(async () => {
					await redis.quit();
				}),
		});
	}),
);

/**
 * Test Redis Repository - In-memory implementation for testing
 *
 * Stores data in a Map, simulates Redis operations.
 */
export const createTestRedisRepository = () => {
	const store = new Map<string, string>();
	const ttls = new Map<string, number>();

	return RedisRepository.of({
		incrby: (key: string, value: number) =>
			Effect.sync(() => {
				const current = parseInt(store.get(key) || "0", 10);
				const newValue = current + value;
				store.set(key, String(newValue));
				return newValue;
			}),

		incr: (key: string) =>
			Effect.sync(() => {
				const current = parseInt(store.get(key) || "0", 10);
				const newValue = current + 1;
				store.set(key, String(newValue));
				return newValue;
			}),

		get: (key: string) => Effect.sync(() => store.get(key) || null),

		expire: (key: string, seconds: number) =>
			Effect.sync(() => {
				if (store.has(key)) {
					ttls.set(key, seconds);
					return 1;
				}
				return 0;
			}),

		ttl: (key: string) =>
			Effect.sync(() => {
				if (!store.has(key)) {
					return -2; // Key doesn't exist
				}
				return ttls.get(key) ?? -1; // -1 if no expiration
			}),

		ping: () => Effect.succeed(true),

		disconnect: () => Effect.sync(() => {}),
	});
};

/**
 * Test Redis Repository Layer
 */
export const RedisTestRepositoryLive = Layer.succeed(RedisRepository, createTestRedisRepository());
