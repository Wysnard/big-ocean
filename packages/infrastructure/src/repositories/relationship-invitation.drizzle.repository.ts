/**
 * Relationship Invitation Repository Implementation (Story 14.2)
 *
 * Handles invitation CRUD with atomic credit consumption.
 * createWithCreditConsumption: single db.transaction() for credit_consumed + invitation INSERT.
 * Expiry derived at query time — no background cron.
 */

import {
	DatabaseError,
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	SelfInvitationError,
} from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { RelationshipInvitationRepository } from "@workspace/domain/repositories/relationship-invitation.repository";
import type { RelationshipInvitation } from "@workspace/domain/types/relationship.types";
import { Database } from "@workspace/infrastructure/context/database";
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { purchaseEvents, relationshipInvitations, user } from "../db/drizzle/schema";

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

			listByInvitee: (userId) =>
				db
					.select()
					.from(relationshipInvitations)
					.where(eq(relationshipInvitations.inviteeUserId, userId))
					.orderBy(desc(relationshipInvitations.createdAt))
					.pipe(
						Effect.map((rows) =>
							rows.map((row) => {
								const mapped = mapRow(row);
								if (mapped.status === "pending" && mapped.expiresAt < new Date()) {
									return { ...mapped, status: "expired" as const };
								}
								return mapped;
							}),
						),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "listByInvitee",
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to list invitations by invitee" });
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

			acceptInvitation: (input) =>
				Effect.gen(function* () {
					// Atomic UPDATE: status=pending, not expired, not self-invitation
					const rows = yield* db
						.update(relationshipInvitations)
						.set({
							inviteeUserId: input.inviteeUserId,
							status: "accepted",
							updatedAt: new Date(),
						})
						.where(
							and(
								eq(relationshipInvitations.invitationToken, input.token),
								eq(relationshipInvitations.status, "pending"),
								gt(relationshipInvitations.expiresAt, sql`NOW()`),
								ne(relationshipInvitations.inviterUserId, input.inviteeUserId),
							),
						)
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "acceptInvitation",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to accept invitation" });
							}),
						);

					if (rows[0]) {
						return mapRow(rows[0]);
					}

					// Diagnostic SELECT to determine the correct error
					const existing = yield* db
						.select()
						.from(relationshipInvitations)
						.where(eq(relationshipInvitations.invitationToken, input.token))
						.pipe(
							Effect.mapError(() => new DatabaseError({ message: "Failed to diagnose accept failure" })),
						);

					const row = existing[0];
					if (!row || row.expiresAt < new Date()) {
						return yield* Effect.fail(
							new InvitationNotFoundError({ message: "Invitation not found or expired" }),
						);
					}
					if (row.inviterUserId === input.inviteeUserId) {
						return yield* Effect.fail(
							new SelfInvitationError({ message: "You cannot accept your own invitation" }),
						);
					}
					// status !== 'pending'
					return yield* Effect.fail(
						new InvitationAlreadyRespondedError({
							message: `Invitation has already been ${row.status}`,
						}),
					);
				}),

			refuseInvitation: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(relationshipInvitations)
						.set({ status: "refused", updatedAt: new Date() })
						.where(
							and(
								eq(relationshipInvitations.invitationToken, input.token),
								eq(relationshipInvitations.status, "pending"),
								gt(relationshipInvitations.expiresAt, sql`NOW()`),
							),
						)
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "refuseInvitation",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to refuse invitation" });
							}),
						);

					if (rows[0]) {
						return mapRow(rows[0]);
					}

					// Diagnostic SELECT
					const existing = yield* db
						.select()
						.from(relationshipInvitations)
						.where(eq(relationshipInvitations.invitationToken, input.token))
						.pipe(
							Effect.mapError(() => new DatabaseError({ message: "Failed to diagnose refuse failure" })),
						);

					const row = existing[0];
					if (!row || row.expiresAt < new Date()) {
						return yield* Effect.fail(
							new InvitationNotFoundError({ message: "Invitation not found or expired" }),
						);
					}
					return yield* Effect.fail(
						new InvitationAlreadyRespondedError({
							message: `Invitation has already been ${row.status}`,
						}),
					);
				}),

			getByTokenWithInviterName: (token) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({
							invitation: relationshipInvitations,
							inviterName: user.name,
						})
						.from(relationshipInvitations)
						.leftJoin(user, eq(relationshipInvitations.inviterUserId, user.id))
						.where(eq(relationshipInvitations.invitationToken, token))
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "getByTokenWithInviterName",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to get invitation with inviter name" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new InvitationNotFoundError({ message: `Invitation not found: ${token}` }),
						);
					}

					const mapped = mapRow(row.invitation);
					const invitation =
						mapped.status === "pending" && mapped.expiresAt < new Date()
							? { ...mapped, status: "expired" as const }
							: mapped;

					return {
						invitation,
						inviterDisplayName: row.inviterName ?? undefined,
					};
				}),
		});
	}),
);
