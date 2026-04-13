/**
 * Mock: push-notification-queue.drizzle.repository.ts (Story 10-2)
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/push-notification-queue.drizzle.repository')
 */

import type { QueuedPushNotification, QueuePushNotificationInput } from "@workspace/domain";
import { PushNotificationQueueRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, QueuedPushNotification>();

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	store.clear();
};

export const PushNotificationQueueDrizzleRepositoryLive = Layer.succeed(
	PushNotificationQueueRepository,
	PushNotificationQueueRepository.of({
		enqueue: (input: QueuePushNotificationInput) =>
			Effect.sync(() => {
				const _dedupeId = `${input.userId}:${input.dedupeKey}`;
				const existing = [...store.values()].find(
					(n) => n.userId === input.userId && n.dedupeKey === input.dedupeKey,
				);
				const now = new Date();
				const record: QueuedPushNotification = {
					id: existing?.id ?? crypto.randomUUID(),
					userId: input.userId,
					title: input.title,
					body: input.body,
					url: input.url,
					tag: input.tag ?? null,
					dedupeKey: input.dedupeKey,
					createdAt: existing?.createdAt ?? now,
					expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
				};
				store.set(record.id, record);
				return record;
			}),

		consumeByUserId: (userId: string) =>
			Effect.sync(() => {
				const results: QueuedPushNotification[] = [];
				for (const [id, record] of store) {
					if (record.userId === userId) {
						results.push(record);
						store.delete(id);
					}
				}
				return results;
			}),

		deleteByDedupeKey: (userId: string, dedupeKey: string) =>
			Effect.sync(() => {
				for (const [id, record] of store) {
					if (record.userId === userId && record.dedupeKey === dedupeKey) {
						store.delete(id);
					}
				}
			}),
	}),
);
