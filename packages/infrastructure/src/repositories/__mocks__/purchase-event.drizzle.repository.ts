/**
 * Mock: purchase-event.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/purchase-event.drizzle.repository')
 */

import type { InsertPurchaseEvent, PurchaseEvent } from "@workspace/domain";
import {
	DuplicateCheckoutError,
	deriveCapabilities,
	PurchaseEventRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const eventStore = new Map<string, PurchaseEvent[]>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => eventStore.clear();

export const PurchaseEventDrizzleRepositoryLive = Layer.succeed(
	PurchaseEventRepository,
	PurchaseEventRepository.of({
		insertEvent: (event: InsertPurchaseEvent) =>
			Effect.gen(function* () {
				// Check duplicate polar_checkout_id across all events
				if (event.polarCheckoutId) {
					for (const events of eventStore.values()) {
						for (const existing of events) {
							if (existing.polarCheckoutId === event.polarCheckoutId) {
								return yield* Effect.fail(
									new DuplicateCheckoutError({
										polarCheckoutId: event.polarCheckoutId,
										message: `Duplicate checkout: ${event.polarCheckoutId}`,
									}),
								);
							}
						}
					}
				}

				const newEvent: PurchaseEvent = {
					id: crypto.randomUUID(),
					userId: event.userId,
					eventType: event.eventType,
					polarCheckoutId: event.polarCheckoutId ?? null,
					polarProductId: event.polarProductId ?? null,
					amountCents: event.amountCents ?? null,
					currency: event.currency ?? null,
					metadata: event.metadata ?? null,
					createdAt: new Date(),
				};

				const existing = eventStore.get(event.userId) ?? [];
				existing.push(newEvent);
				eventStore.set(event.userId, existing);

				return newEvent;
			}),

		getEventsByUserId: (userId: string) =>
			Effect.sync(() =>
				[...(eventStore.get(userId) ?? [])].sort(
					(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
				),
			),

		getCapabilities: (userId: string) =>
			Effect.sync(() => {
				const events = [...(eventStore.get(userId) ?? [])].sort(
					(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
				);
				return deriveCapabilities(events);
			}),
	}),
);
