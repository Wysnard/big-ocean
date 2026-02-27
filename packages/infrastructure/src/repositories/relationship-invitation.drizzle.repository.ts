/**
 * Relationship Invitation Repository Implementation (Story 14.2)
 *
 * Handles invitation CRUD with atomic credit consumption.
 * createWithCreditConsumption: single db.transaction() for credit_consumed + invitation INSERT.
 * Expiry derived at query time — no background cron.
 */

import { DatabaseError, InvitationNotFoundError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { RelationshipInvitationRepository } from "@workspace/domain/repositories/relationship-invitation.repository";
import type { RelationshipInvitation } from "@workspace/domain/types/relationship.types";
import { Database } from "@workspace/infrastructure/context/database";
import { desc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { purchaseEvents, relationshipInvitations } from "../db/drizzle/schema";

const mapRow = (row: typeof relationshipInvitations.$inferSelect): RelationshipInvitation => ({
	id: row.id,
	inviterUserId: row.inviterUserId,
	inviteeUserId: row.inviteeUserId,
	invitationToken: row.invitationToken,
	personalMessage: row.personalMessage,
	status: row.status,
	expiresAt: row.expiresAt,
	updatedAt: row.updatedAt,
	createdAt: row.createdAt,
});

export const RelationshipInvitationDrizzleRepositoryLive = Layer.effect(
	RelationshipInvitationRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return RelationshipInvitationRepository.of({
			createWithCreditConsumption: (input) =>
				Effect.gen(function* () {
					const result = yield* db
						.transaction((tx) =>
							Effect.gen(function* () {
								// 1. Insert credit_consumed event
								yield* tx.insert(purchaseEvents).values({
									userId: input.inviterUserId,
									eventType: "credit_consumed",
									polarCheckoutId: `credit-consumed-${input.invitationToken}`,
									metadata: { invitationId: input.invitationToken },
								});

								// 2. Insert invitation
								const rows = yield* tx
									.insert(relationshipInvitations)
									.values({
										inviterUserId: input.inviterUserId,
										invitationToken: input.invitationToken,
										personalMessage: input.personalMessage,
										status: "pending",
										expiresAt: input.expiresAt,
									})
									.returning();

								return rows[0];
							}),
						)
						.pipe(
							Effect.mapError((error) => {
								const message = error instanceof Error ? error.message : String(error);
								logger.error("Transaction failed: createWithCreditConsumption", {
									error: message,
									inviterUserId: input.inviterUserId,
								});
								return new DatabaseError({
									message: "Failed to create invitation with credit consumption",
								});
							}),
						);

					if (!result) {
						return yield* Effect.fail(new DatabaseError({ message: "Transaction returned no rows" }));
					}

					return mapRow(result);
				}),

			getByToken: (token) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(relationshipInvitations)
						.where(eq(relationshipInvitations.invitationToken, token))
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "getByToken",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to get invitation by token" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new InvitationNotFoundError({ message: `Invitation not found: ${token}` }),
						);
					}

					// Derive expired status at application level (same as listByInviter)
					const mapped = mapRow(row);
					if (mapped.status === "pending" && mapped.expiresAt < new Date()) {
						return { ...mapped, status: "expired" as const };
					}
					return mapped;
				}),

			listByInviter: (userId) =>
				db
					.select()
					.from(relationshipInvitations)
					.where(eq(relationshipInvitations.inviterUserId, userId))
					.orderBy(desc(relationshipInvitations.createdAt))
					.pipe(
						Effect.map((rows) =>
							rows.map((row) => {
								const mapped = mapRow(row);
								// Derive expired status at application level (Anti-Pattern #7)
								if (mapped.status === "pending" && mapped.expiresAt < new Date()) {
									return { ...mapped, status: "expired" as const };
								}
								return mapped;
							}),
						),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "listByInviter",
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to list invitations" });
						}),
					),

			updateStatus: (id, status) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(relationshipInvitations)
						.set({ status, updatedAt: new Date() })
						.where(eq(relationshipInvitations.id, id))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "updateStatus",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to update invitation status" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new InvitationNotFoundError({ message: `Invitation not found: ${id}` }),
						);
					}

					return mapRow(row);
				}),
		});
	}),
);
