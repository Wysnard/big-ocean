/**
 * Mock: push-subscription.drizzle.repository.ts (Story 10-2)
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/push-subscription.drizzle.repository')
 */

import type { PushSubscriptionInput, PushSubscriptionRecord } from "@workspace/domain";
import { PushSubscriptionRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, PushSubscriptionRecord>();

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	store.clear();
};

export const PushSubscriptionDrizzleRepositoryLive = Layer.succeed(
	PushSubscriptionRepository,
	PushSubscriptionRepository.of({
		upsert: (input: PushSubscriptionInput) =>
			Effect.sync(() => {
				const existing = [...store.values()].find((s) => s.endpoint === input.endpoint);
				if (existing && existing.userId !== input.userId) {
					return existing;
				}
				const record: PushSubscriptionRecord = {
					id: existing?.id ?? crypto.randomUUID(),
					userId: input.userId,
					endpoint: input.endpoint,
					keys: input.keys,
					createdAt: existing?.createdAt ?? new Date(),
					updatedAt: new Date(),
				};
				store.set(record.id, record);
				return record;
			}),

		listByUserId: (userId: string) =>
			Effect.sync(() => [...store.values()].filter((s) => s.userId === userId)),

		deleteByEndpoint: (endpoint: string, userId: string) =>
			Effect.sync(() => {
				for (const [id, record] of store) {
					if (record.endpoint === endpoint && record.userId === userId) {
						store.delete(id);
					}
				}
			}),

		deleteByUserId: (userId: string) =>
			Effect.sync(() => {
				for (const [id, record] of store) {
					if (record.userId === userId) {
						store.delete(id);
					}
				}
			}),
	}),
);
