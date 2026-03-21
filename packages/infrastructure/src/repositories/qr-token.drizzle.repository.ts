/**
 * QR Token Repository Implementation (Story 34-1)
 *
 * Drizzle-based implementation of QrTokenRepository.
 * Tokens have 6h TTL. Expiry derived at query time.
 * Accept uses atomic UPDATE WHERE clause for race-safety.
 */

import {
	DatabaseError,
	QrTokenAlreadyAcceptedError,
	QrTokenExpiredError,
	QrTokenNotFoundError,
	SelfInvitationError,
} from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { QrTokenRepository } from "@workspace/domain/repositories/qr-token.repository";
import { QR_TOKEN_TTL_HOURS } from "@workspace/domain/types/relationship.types";
import type { QrToken } from "@workspace/domain/types/relationship.types";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq, gt, ne, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { relationshipQrTokens } from "../db/drizzle/schema";

const mapRow = (row: typeof relationshipQrTokens.$inferSelect): QrToken => {
	const token: QrToken = {
		id: row.id,
		userId: row.userId,
		token: row.token,
		expiresAt: row.expiresAt,
		status: row.status,
		acceptedByUserId: row.acceptedByUserId,
		createdAt: row.createdAt,
	};
	// Derive expired status at application level
	if (token.status === "active" && token.expiresAt < new Date()) {
		return { ...token, status: "expired" };
	}
	return token;
};

export const QrTokenDrizzleRepositoryLive = Layer.effect(
	QrTokenRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return QrTokenRepository.of({
			generate: (userId) =>
				Effect.gen(function* () {
					const token = crypto.randomUUID();
					const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_HOURS * 60 * 60 * 1000);

					const rows = yield* db
						.insert(relationshipQrTokens)
						.values({
							userId,
							token,
							expiresAt,
							status: "active",
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "generate",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to generate QR token" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new DatabaseError({ message: "Generate returned no rows" }),
						);
					}

					return mapRow(row);
				}),

			getByToken: (token) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(relationshipQrTokens)
						.where(eq(relationshipQrTokens.token, token))
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "getByToken",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to get QR token" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
						);
					}

					return mapRow(row);
				}),

			getStatus: (token) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({
							status: relationshipQrTokens.status,
							expiresAt: relationshipQrTokens.expiresAt,
						})
						.from(relationshipQrTokens)
						.where(eq(relationshipQrTokens.token, token))
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "getStatus",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to get QR token status" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new QrTokenNotFoundError({ message: `QR token not found: ${token}` }),
						);
					}

					if (row.status === "accepted") return "accepted" as const;
					if (row.status === "expired" || row.expiresAt < new Date()) return "expired" as const;
					return "valid" as const;
				}),

			accept: (input) =>
				Effect.gen(function* () {
					// Atomic UPDATE: status=active, not expired, not self
					const rows = yield* db
						.update(relationshipQrTokens)
						.set({
							acceptedByUserId: input.acceptedByUserId,
							status: "accepted",
						})
						.where(
							and(
								eq(relationshipQrTokens.token, input.token),
								eq(relationshipQrTokens.status, "active"),
								gt(relationshipQrTokens.expiresAt, sql`NOW()`),
								ne(relationshipQrTokens.userId, input.acceptedByUserId),
							),
						)
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "accept",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to accept QR token" });
							}),
						);

					if (rows[0]) {
						return mapRow(rows[0]);
					}

					// Diagnostic SELECT to determine the correct error
					const existing = yield* db
						.select()
						.from(relationshipQrTokens)
						.where(eq(relationshipQrTokens.token, input.token))
						.pipe(
							Effect.mapError(() =>
								new DatabaseError({ message: "Failed to diagnose accept failure" }),
							),
						);

					const row = existing[0];
					if (!row) {
						return yield* Effect.fail(
							new QrTokenNotFoundError({ message: "QR token not found" }),
						);
					}
					if (row.userId === input.acceptedByUserId) {
						return yield* Effect.fail(
							new SelfInvitationError({
								message: "You cannot accept your own QR token",
							}),
						);
					}
					if (row.status === "accepted") {
						return yield* Effect.fail(
							new QrTokenAlreadyAcceptedError({
								message: "QR token has already been accepted",
							}),
						);
					}
					// expired (either status or time-based)
					return yield* Effect.fail(
						new QrTokenExpiredError({ message: "QR token has expired" }),
					);
				}),

			expireToken: (token) =>
				db
					.update(relationshipQrTokens)
					.set({ status: "expired" })
					.where(eq(relationshipQrTokens.token, token))
					.pipe(
						Effect.map(() => undefined),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "expireToken",
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to expire QR token" });
						}),
					),

			getActiveByUserId: (userId) =>
				db
					.select()
					.from(relationshipQrTokens)
					.where(
						and(
							eq(relationshipQrTokens.userId, userId),
							eq(relationshipQrTokens.status, "active"),
							gt(relationshipQrTokens.expiresAt, sql`NOW()`),
						),
					)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getActiveByUserId",
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({
								message: "Failed to get active QR token by user",
							});
						}),
					),
		});
	}),
);
