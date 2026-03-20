/**
 * User Account Repository Implementation (Story 30-2)
 *
 * Handles account deletion by deleting the user row.
 * All child data is removed automatically via PostgreSQL FK cascades.
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { UserAccountRepository } from "@workspace/domain/repositories/user-account.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { user } from "../db/drizzle/schema";

export const UserAccountDrizzleRepositoryLive = Layer.effect(
	UserAccountRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return UserAccountRepository.of({
			deleteAccount: (userId: string) =>
				Effect.gen(function* () {
					// Single DELETE — all child rows removed via FK cascades
					const deleted = yield* db
						.delete(user)
						.where(eq(user.id, userId))
						.returning({ id: user.id })
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to delete user: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const wasDeleted = deleted.length > 0;

					if (wasDeleted) {
						logger.info("Account deleted successfully", { userId });
					} else {
						logger.warn("Account deletion: user not found", { userId });
					}

					return wasDeleted;
				}),
		});
	}),
);
