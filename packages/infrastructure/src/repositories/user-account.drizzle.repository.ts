/**
 * User Account Repository Implementation (Story 30-2)
 *
 * Handles account deletion with explicit cascade cleanup.
 * Deletion order avoids FK violations:
 * 1. relationship_analyses (user_a_id OR user_b_id)
 * 2. relationship_invitations (inviter OR invitee)
 * 3. purchase_events (user_id — has onDelete: "restrict")
 * 4. assessment_sessions (user_id — has onDelete: "set null", must delete explicitly)
 * 5. user row (cascades to Better Auth sessions, accounts, portrait_ratings)
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { UserAccountRepository } from "@workspace/domain/repositories/user-account.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { eq, or } from "drizzle-orm";
import { Effect, Layer } from "effect";
import {
	assessmentSession,
	purchaseEvents,
	relationshipAnalyses,
	relationshipInvitations,
	user,
} from "../db/drizzle/schema";

export const UserAccountDrizzleRepositoryLive = Layer.effect(
	UserAccountRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return UserAccountRepository.of({
			deleteAccount: (userId: string) =>
				Effect.gen(function* () {
					// 1. Delete relationship analyses where user is participant
					yield* db
						.delete(relationshipAnalyses)
						.where(or(eq(relationshipAnalyses.userAId, userId), eq(relationshipAnalyses.userBId, userId)))
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to delete relationship analyses: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					// 2. Delete relationship invitations where user is inviter or invitee
					yield* db
						.delete(relationshipInvitations)
						.where(
							or(
								eq(relationshipInvitations.inviterUserId, userId),
								eq(relationshipInvitations.inviteeUserId, userId),
							),
						)
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to delete relationship invitations: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					// 3. Delete purchase events (has onDelete: "restrict", must delete explicitly)
					yield* db
						.delete(purchaseEvents)
						.where(eq(purchaseEvents.userId, userId))
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to delete purchase events: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					// 4. Delete assessment sessions (has onDelete: "set null" on user_id,
					//    cascades to messages, evidence, exchanges, results, portraits, public profiles)
					yield* db
						.delete(assessmentSession)
						.where(eq(assessmentSession.userId, userId))
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to delete assessment sessions: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					// 5. Delete user row (cascades to Better Auth sessions, accounts, portrait_ratings)
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
