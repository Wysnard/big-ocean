/**
 * Mock: purchase-event.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/purchase-event.drizzle.repository')
 */

import type { InsertPurchaseEvent, PurchaseEvent } from "@workspace/domain";
import {
	DuplicateCheckoutError,
	deriveCapabilities,
	getSubscriptionStatus,
	isEntitledTo,
	PurchaseEventRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const eventStore = new Map<string, PurchaseEvent[]>();
const checkoutIdIndex = new Map<string, PurchaseEvent>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	eventStore.clear();
	checkoutIdIndex.clear();
};

const findByCheckoutId = (checkoutId: string): PurchaseEvent | null =>
	checkoutIdIndex.get(checkoutId) ?? null;

const storeEvent = (event: PurchaseEvent): void => {
	const existing = eventStore.get(event.userId ?? "") ?? [];
	existing.push(event);
	eventStore.set(event.userId ?? "", existing);
	if (event.polarCheckoutId) {
		checkoutIdIndex.set(event.polarCheckoutId, event);
	}
};

export const PurchaseEventDrizzleRepositoryLive = Layer.succeed(
	PurchaseEventRepository,
	PurchaseEventRepository.of({
		insertEvent: (event: InsertPurchaseEvent) =>
			Effect.gen(function* () {
				if (event.polarCheckoutId && findByCheckoutId(event.polarCheckoutId)) {
					return yield* Effect.fail(
						new DuplicateCheckoutError({
							polarCheckoutId: event.polarCheckoutId,
							message: `Duplicate checkout: ${event.polarCheckoutId}`,
						}),
					);
				}

				const newEvent: PurchaseEvent = {
					id: crypto.randomUUID(),
					userId: event.userId,
					eventType: event.eventType,
					polarCheckoutId: event.polarCheckoutId ?? null,
					polarSubscriptionId: event.polarSubscriptionId ?? null,
					polarProductId: event.polarProductId ?? null,
					amountCents: event.amountCents ?? null,
					currency: event.currency ?? null,
					metadata: event.metadata ?? null,
					assessmentResultId: event.assessmentResultId ?? null,
					createdAt: new Date(),
				};

				storeEvent(newEvent);
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

		getSubscriptionStatus: (userId: string) =>
			Effect.sync(() => {
				const events = [...(eventStore.get(userId) ?? [])].sort(
					(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
				);
				return getSubscriptionStatus(events);
			}),

		isEntitledTo: (userId: string, feature) =>
			Effect.sync(() => {
				const events = [...(eventStore.get(userId) ?? [])].sort(
					(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
				);
				return isEntitledTo(events, feature);
			}),

		getByCheckoutId: (checkoutId: string) => Effect.sync(() => findByCheckoutId(checkoutId)),
	}),
);
