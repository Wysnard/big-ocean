/**
 * Purchase Event Repository Interface (Story 13.1)
 *
 * Append-only — no UPDATE or DELETE methods.
 * Capabilities derived from events, not mutable counters.
 */

import { Context, Effect } from "effect";
import { DatabaseError, DuplicateCheckoutError } from "../errors/http.errors";
import type { PurchaseEvent, PurchaseEventType, UserCapabilities } from "../types/purchase.types";

export interface InsertPurchaseEvent {
	readonly userId: string;
	readonly eventType: PurchaseEventType;
	readonly polarCheckoutId?: string | null;
	readonly polarProductId?: string | null;
	readonly amountCents?: number | null;
	readonly currency?: string | null;
	readonly metadata?: unknown;
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
	}
>() {}
