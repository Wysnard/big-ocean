/**
 * User Account Repository Implementation (Story 30-2)
 *
 * Handles account deletion by deleting the user row.
 * All child data is removed automatically via PostgreSQL FK cascades.
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { ScheduleFirstDailyPromptOutcome } from "@workspace/domain/repositories/user-account.repository";
import { UserAccountRepository } from "@workspace/domain/repositories/user-account.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq, isNull } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { user } from "../db/drizzle/schema";

export const UserAccountDrizzleRepositoryLive = Layer.effect(
	UserAccountRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return UserAccountRepository.of({
			getEmailAndNameForUser: (userId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({ email: user.email, name: user.name })
						.from(user)
						.where(eq(user.id, userId))
						.limit(1)
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to read user contact: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) {
						return null;
					}

					return { email: row.email, name: row.name };
				}),
			getFirstVisitCompleted: (userId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({ firstVisitCompleted: user.firstVisitCompleted })
						.from(user)
						.where(eq(user.id, userId))
						.limit(1)
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to read first visit state: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					return rows[0]?.firstVisitCompleted ?? false;
				}),
			markFirstVisitCompleted: (userId: string) =>
				Effect.gen(function* () {
					const updated = yield* db
						.update(user)
						.set({ firstVisitCompleted: true })
						.where(eq(user.id, userId))
						.returning({ id: user.id })
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to update first visit state: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const wasUpdated = updated.length > 0;

					if (wasUpdated) {
						logger.info("First visit marked complete", { userId });
					} else {
						logger.warn("First visit update: user not found", { userId });
					}

					return wasUpdated;
				}),
			scheduleFirstDailyPrompt: (userId: string, scheduledFor: Date) =>
				Effect.gen(function* () {
					const updated = yield* db
						.update(user)
						.set({ firstDailyPromptScheduledFor: scheduledFor })
						.where(and(eq(user.id, userId), isNull(user.firstDailyPromptScheduledFor)))
						.returning({ id: user.id })
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to schedule first daily prompt: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					if (updated.length > 0) {
						logger.info("First daily prompt scheduled", {
							userId,
							scheduledFor: scheduledFor.toISOString(),
						});
						return { kind: "inserted" } satisfies ScheduleFirstDailyPromptOutcome;
					}

					const rows = yield* db
						.select({ firstDailyPromptScheduledFor: user.firstDailyPromptScheduledFor })
						.from(user)
						.where(eq(user.id, userId))
						.limit(1)
						.pipe(
							Effect.mapError(
								(error) =>
									new DatabaseError({
										message: `Failed to read first daily prompt schedule: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) {
						logger.warn("First daily prompt scheduling: user not found", { userId });
						return { kind: "user_not_found" } satisfies ScheduleFirstDailyPromptOutcome;
					}

					const existing = row.firstDailyPromptScheduledFor;
					if (existing !== null) {
						logger.info("First daily prompt schedule already set (idempotent)", {
							userId,
							scheduledFor: existing.toISOString(),
						});
						return {
							kind: "already_scheduled",
							scheduledFor: existing,
						} satisfies ScheduleFirstDailyPromptOutcome;
					}

					logger.warn("First daily prompt scheduling: no row updated and schedule still null", {
						userId,
					});
					return { kind: "user_not_found" } satisfies ScheduleFirstDailyPromptOutcome;
				}),
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
