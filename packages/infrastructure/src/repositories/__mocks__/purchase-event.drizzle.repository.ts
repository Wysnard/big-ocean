/**
 * Mock: purchase-event.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/purchase-event.drizzle.repository')
 *
 * Story 13.3 extends with:
 * - getByCheckoutId: Lookup by polar_checkout_id
 * - insertEventWithPortraitPlaceholder: Transaction simulation
 */

import type {
	InsertPortraitPlaceholder,
	InsertPurchaseEvent,
	Portrait,
	PortraitTier,
	PurchaseEvent,
} from "@workspace/domain";
import {
	DuplicateCheckoutError,
	deriveCapabilities,
	PurchaseEventRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const eventStore = new Map<string, PurchaseEvent[]>();
const checkoutIdIndex = new Map<string, PurchaseEvent>();

// Shared portrait storage (simulates transaction with portrait mock)
const portraitStore = new Map<string, Portrait>();
const portraitResultTierIndex = new Map<string, Portrait>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	eventStore.clear();
	checkoutIdIndex.clear();
	portraitStore.clear();
	portraitResultTierIndex.clear();
};

/** Get portrait for test assertions */
export const _getPortraitByResultIdAndTier = (
	assessmentResultId: string,
	tier: PortraitTier,
): Portrait | undefined => portraitResultTierIndex.get(`${assessmentResultId}:${tier}`);

const findByCheckoutId = (checkoutId: string): PurchaseEvent | null =>
	checkoutIdIndex.get(checkoutId) ?? null;

const storeEvent = (event: PurchaseEvent): void => {
	const existing = eventStore.get(event.userId) ?? [];
	existing.push(event);
	eventStore.set(event.userId, existing);
	if (event.polarCheckoutId) {
		checkoutIdIndex.set(event.polarCheckoutId, event);
	}
};

export const PurchaseEventDrizzleRepositoryLive = Layer.succeed(
	PurchaseEventRepository,
	PurchaseEventRepository.of({
		insertEvent: (event: InsertPurchaseEvent) =>
			Effect.gen(function* () {
				// Check duplicate polar_checkout_id
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
					polarProductId: event.polarProductId ?? null,
					amountCents: event.amountCents ?? null,
					currency: event.currency ?? null,
					metadata: event.metadata ?? null,
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

		getByCheckoutId: (checkoutId: string) => Effect.sync(() => findByCheckoutId(checkoutId)),

		insertEventWithPortraitPlaceholder: (
			event: InsertPurchaseEvent,
			portraitPlaceholder: InsertPortraitPlaceholder | null,
		) =>
			Effect.gen(function* () {
				// Check duplicate polar_checkout_id
				if (event.polarCheckoutId && findByCheckoutId(event.polarCheckoutId)) {
					return yield* Effect.fail(
						new DuplicateCheckoutError({
							polarCheckoutId: event.polarCheckoutId,
							message: `Duplicate checkout: ${event.polarCheckoutId}`,
						}),
					);
				}

				// Insert purchase event
				const purchaseEvent: PurchaseEvent = {
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
				storeEvent(purchaseEvent);

				// Insert portrait placeholder if provided (onConflictDoNothing simulation)
				let portrait: Portrait | null = null;
				if (portraitPlaceholder) {
					const indexKey = `${portraitPlaceholder.assessmentResultId}:${portraitPlaceholder.tier}`;
					// Only insert if not exists (onConflictDoNothing)
					if (!portraitResultTierIndex.has(indexKey)) {
						portrait = {
							id: crypto.randomUUID(),
							assessmentResultId: portraitPlaceholder.assessmentResultId,
							tier: portraitPlaceholder.tier,
							content: null,
							lockedSectionTitles: null,
							modelUsed: portraitPlaceholder.modelUsed,
							retryCount: 0,
							createdAt: new Date(),
						};
						portraitStore.set(portrait.id, portrait);
						portraitResultTierIndex.set(indexKey, portrait);
					}
				}

				return { purchaseEvent, portrait };
			}),
	}),
);
