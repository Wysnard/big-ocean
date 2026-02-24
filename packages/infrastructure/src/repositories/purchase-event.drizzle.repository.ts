/**
 * Purchase Event Repository Implementation (Story 13.1, extended Story 13.3)
 *
 * Append-only — only insertEvent mutates data.
 * getCapabilities calls getEventsByUserId then deriveCapabilities.
 *
 * Story 13.3 additions:
 * - getByCheckoutId: Idempotency check
 * - insertEventWithPortraitPlaceholder: Transaction with portrait row
 */

import { DatabaseError, DuplicateCheckoutError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type {
	InsertPortraitPlaceholder,
	Portrait,
	PortraitTier,
} from "@workspace/domain/repositories/portrait.repository";
import type { InsertPurchaseEvent } from "@workspace/domain/repositories/purchase-event.repository";
import { PurchaseEventRepository } from "@workspace/domain/repositories/purchase-event.repository";
import type { PurchaseEvent, PurchaseEventType } from "@workspace/domain/types/purchase.types";
import { deriveCapabilities } from "@workspace/domain/utils/derive-capabilities";
import { Database } from "@workspace/infrastructure/context/database";
import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { portraits, purchaseEvents } from "../db/drizzle/schema";

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

		const mapPortraitRow = (row: typeof portraits.$inferSelect): Portrait => ({
			id: row.id,
			assessmentResultId: row.assessmentResultId,
			tier: row.tier as PortraitTier,
			content: row.content,
			lockedSectionTitles: row.lockedSectionTitles as ReadonlyArray<string> | null,
			modelUsed: row.modelUsed,
			retryCount: row.retryCount,
			createdAt: row.createdAt,
		});

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

			getByCheckoutId: (checkoutId: string) =>
				db
					.select()
					.from(purchaseEvents)
					.where(eq(purchaseEvents.polarCheckoutId, checkoutId))
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getByCheckoutId",
								checkoutId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to get purchase event by checkout ID" });
						}),
					),

			insertEventWithPortraitPlaceholder: (
				event: InsertPurchaseEvent,
				portraitPlaceholder: InsertPortraitPlaceholder | null,
			) =>
				Effect.gen(function* () {
					// Use Drizzle transaction for atomicity
					const result = yield* Effect.tryPromise({
						try: async () => {
							return await db.drizzle.transaction(async (tx) => {
								// 1. Insert purchase event
								const [purchaseEventRow] = await tx
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
									.returning();

								// 2. Insert portrait placeholder if provided (idempotent with onConflictDoNothing)
								let portraitRow: typeof portraits.$inferSelect | null = null;
								if (portraitPlaceholder) {
									const [inserted] = await tx
										.insert(portraits)
										.values({
											assessmentResultId: portraitPlaceholder.assessmentResultId,
											tier: portraitPlaceholder.tier,
											modelUsed: portraitPlaceholder.modelUsed,
										})
										.onConflictDoNothing()
										.returning();
									portraitRow = inserted ?? null;
								}

								return { purchaseEventRow, portraitRow };
							});
						},
						catch: (error) => {
							const message = error instanceof Error ? error.message : String(error);
							// Check for duplicate checkout error
							if (message.includes("purchase_events_polar_checkout_id_unique")) {
								return new DuplicateCheckoutError({
									polarCheckoutId: event.polarCheckoutId ?? "",
									message: `Duplicate checkout: ${event.polarCheckoutId}`,
								});
							}
							logger.error("Database transaction failed", {
								operation: "insertEventWithPortraitPlaceholder",
								error: message,
							});
							return new DatabaseError({ message: "Failed to insert purchase event with portrait" });
						},
					});

					if (!result.purchaseEventRow) {
						return yield* Effect.fail(
							new DatabaseError({ message: "Transaction returned no purchase event" }),
						);
					}

					return {
						purchaseEvent: mapRow(result.purchaseEventRow),
						portrait: result.portraitRow ? mapPortraitRow(result.portraitRow) : null,
					};
				}),
		});
	}),
);
