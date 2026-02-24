/**
 * Purchase Event Repository Implementation (Story 13.1)
 *
 * Append-only — only insertEvent mutates data.
 * getCapabilities calls getEventsByUserId then deriveCapabilities.
 */

import { DatabaseError, DuplicateCheckoutError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { InsertPurchaseEvent } from "@workspace/domain/repositories/purchase-event.repository";
import { PurchaseEventRepository } from "@workspace/domain/repositories/purchase-event.repository";
import type { PurchaseEvent, PurchaseEventType } from "@workspace/domain/types/purchase.types";
import { deriveCapabilities } from "@workspace/domain/utils/derive-capabilities";
import { Database } from "@workspace/infrastructure/context/database";
import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { purchaseEvents } from "../db/drizzle/schema";

export const PurchaseEventDrizzleRepositoryLive = Layer.effect(
	PurchaseEventRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		const mapRow = (row: typeof purchaseEvents.$inferSelect): PurchaseEvent => ({
			id: row.id,
			userId: row.userId,
			eventType: row.eventType as PurchaseEventType,
			polarCheckoutId: row.polarCheckoutId,
			polarProductId: row.polarProductId,
			amountCents: row.amountCents,
			currency: row.currency,
			metadata: row.metadata,
			createdAt: row.createdAt,
		});

		const getEventsByUserId = (userId: string) =>
			db
				.select()
				.from(purchaseEvents)
				.where(eq(purchaseEvents.userId, userId))
				.orderBy(asc(purchaseEvents.createdAt))
				.pipe(
					Effect.map((rows) => rows.map(mapRow)),
					Effect.mapError((error) => {
						logger.error("Database operation failed", {
							operation: "getEventsByUserId",
							userId,
							error: error instanceof Error ? error.message : String(error),
						});
						return new DatabaseError({ message: "Failed to get purchase events" });
					}),
				);

		return PurchaseEventRepository.of({
			insertEvent: (event: InsertPurchaseEvent) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(purchaseEvents)
						.values({
							userId: event.userId,
							eventType: event.eventType,
							polarCheckoutId: event.polarCheckoutId ?? null,
							polarProductId: event.polarProductId ?? null,
							amountCents: event.amountCents ?? null,
							currency: event.currency ?? null,
							metadata: event.metadata ?? null,
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								const message = error instanceof Error ? error.message : String(error);
								// Catch unique constraint violation on polar_checkout_id
								if (message.includes("purchase_events_polar_checkout_id_unique")) {
									return new DuplicateCheckoutError({
										polarCheckoutId: event.polarCheckoutId ?? "",
										message: `Duplicate checkout: ${event.polarCheckoutId}`,
									});
								}
								logger.error("Database operation failed", {
									operation: "insertEvent",
									error: message,
								});
								return new DatabaseError({ message: "Failed to insert purchase event" });
							}),
						);
					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Insert returned no rows" }));
					}
					return mapRow(row);
				}),

			getEventsByUserId,

			getCapabilities: (userId: string) =>
				Effect.gen(function* () {
					const events = yield* getEventsByUserId(userId);
					return deriveCapabilities(events);
				}),
		});
	}),
);
