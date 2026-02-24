/**
 * Purchase Event Repository Interface (Story 13.1, extended Story 13.3)
 *
 * Append-only — no UPDATE or DELETE methods.
 * Capabilities derived from events, not mutable counters.
 *
 * Story 13.3 adds:
 * - getByCheckoutId: Idempotency check for duplicate webhooks
 * - insertEventWithPortraitPlaceholder: Transaction with portrait row
 */

import { Context, Effect } from "effect";
import { DatabaseError, DuplicateCheckoutError } from "../errors/http.errors";
import type { PurchaseEvent, PurchaseEventType, UserCapabilities } from "../types/purchase.types";
import type { InsertPortraitPlaceholder, Portrait } from "./portrait.repository";

export interface InsertPurchaseEvent {
	readonly userId: string;
	readonly eventType: PurchaseEventType;
	readonly polarCheckoutId?: string | null;
	readonly polarProductId?: string | null;
	readonly amountCents?: number | null;
	readonly currency?: string | null;
	readonly metadata?: unknown;
}

export interface InsertEventWithPortraitResult {
	readonly purchaseEvent: PurchaseEvent;
	readonly portrait: Portrait | null;
}

export class PurchaseEventRepository extends Context.Tag("PurchaseEventRepository")<
	PurchaseEventRepository,
	{
		readonly insertEvent: (
			event: InsertPurchaseEvent,
		) => Effect.Effect<PurchaseEvent, DuplicateCheckoutError | DatabaseError, never>;

		readonly getEventsByUserId: (
			userId: string,
		) => Effect.Effect<PurchaseEvent[], DatabaseError, never>;

		readonly getCapabilities: (
			userId: string,
		) => Effect.Effect<UserCapabilities, DatabaseError, never>;

		/**
		 * Get purchase event by Polar checkout ID.
		 * Returns null if not found. Used for idempotency check on duplicate webhooks.
		 */
		readonly getByCheckoutId: (
			checkoutId: string,
		) => Effect.Effect<PurchaseEvent | null, DatabaseError, never>;

		/**
		 * Insert purchase event with optional portrait placeholder in single transaction.
		 * Portrait placeholder uses onConflictDoNothing for idempotency.
		 */
		readonly insertEventWithPortraitPlaceholder: (
			event: InsertPurchaseEvent,
			portraitPlaceholder: InsertPortraitPlaceholder | null,
		) => Effect.Effect<InsertEventWithPortraitResult, DuplicateCheckoutError | DatabaseError, never>;
	}
>() {}
