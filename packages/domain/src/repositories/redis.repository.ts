/**
 * Redis Repository Interface
 *
 * Provides Redis operations for cost tracking and rate limiting.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */

import { Context, Effect } from "effect";

/**
 * Redis connection error
 */
export class RedisConnectionError extends Error {
	readonly _tag = "RedisConnectionError";
	constructor(message: string) {
		super(message);
		this.name = "RedisConnectionError";
	}
}

/**
 * Redis operation error
 */
export class RedisOperationError extends Error {
	readonly _tag = "RedisOperationError";
	constructor(message: string) {
		super(message);
		this.name = "RedisOperationError";
	}
}

/**
 * Redis Repository Methods Interface
 */
export interface RedisRepositoryMethods {
	/**
	 * Increment a key by a value atomically
	 * @param key - Redis key
	 * @param value - Value to increment by
	 * @returns New value after increment
	 */
	readonly incrby: (key: string, value: number) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Increment a key by 1 atomically
	 * @param key - Redis key
	 * @returns New value after increment
	 */
	readonly incr: (key: string) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Get a string value
	 * @param key - Redis key
	 * @returns Value or null if not exists
	 */
	readonly get: (key: string) => Effect.Effect<string | null, RedisOperationError>;

	/**
	 * Set expiration time on a key
	 * @param key - Redis key
	 * @param seconds - TTL in seconds
	 * @returns 1 if set, 0 if key doesn't exist
	 */
	readonly expire: (key: string, seconds: number) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Get time to live for a key
	 * @param key - Redis key
	 * @returns TTL in seconds, -1 if no expiration, -2 if key doesn't exist
	 */
	readonly ttl: (key: string) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Check if Redis is healthy
	 * @returns true if Redis responds to ping
	 */
	readonly ping: () => Effect.Effect<boolean, RedisConnectionError>;

	/**
	 * Disconnect from Redis (for cleanup)
	 */
	readonly disconnect: () => Effect.Effect<void, never>;
}

/**
 * Redis Repository Tag
 *
 * Service interface for Redis operations.
 */
export class RedisRepository extends Context.Tag("RedisRepository")<
	RedisRepository,
	RedisRepositoryMethods
>() {}
