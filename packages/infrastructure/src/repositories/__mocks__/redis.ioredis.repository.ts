/**
 * Mock: redis.ioredis.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/redis.ioredis.repository')
 *
 * In-memory Redis implementation for testing.
 */
import { RedisRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, string>();
const ttls = new Map<string, number>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	store.clear();
	ttls.clear();
};

export const RedisIoRedisRepositoryLive = Layer.succeed(
	RedisRepository,
	RedisRepository.of({
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

		decr: (key: string) =>
			Effect.sync(() => {
				const current = parseInt(store.get(key) || "0", 10);
				const newValue = current - 1;
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
				if (!store.has(key)) return -2;
				return ttls.get(key) ?? -1;
			}),

		ping: () => Effect.succeed(true),

		disconnect: () => Effect.sync(() => {}),
	}),
);
