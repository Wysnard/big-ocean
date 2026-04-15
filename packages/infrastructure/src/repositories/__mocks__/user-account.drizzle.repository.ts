/**
 * User Account Repository Mock (Story 30-2)
 *
 * In-memory mock for testing account deletion.
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import type { ScheduleFirstDailyPromptOutcome } from "@workspace/domain/repositories/user-account.repository";
import { UserAccountRepository } from "@workspace/domain/repositories/user-account.repository";
import { Effect, Layer } from "effect";

interface MockUserRecord {
	email?: string;
	name?: string;
	firstVisitCompleted: boolean;
	firstDailyPromptScheduledFor: Date | null;
}

/** In-memory users keyed by id */
const existingUsers = new Map<string, MockUserRecord>();

/** Track deleted users for test assertions */
const deletedUsers = new Set<string>();

/** When true, deleteAccount fails with DatabaseError */
let shouldFailWithDbError = false;

export const addMockUser = (userId: string, contact?: { email: string; name: string }) => {
	existingUsers.set(userId, {
		email: contact?.email,
		name: contact?.name,
		firstVisitCompleted: false,
		firstDailyPromptScheduledFor: null,
	});
};

export const setMockFirstVisitCompleted = (userId: string, firstVisitCompleted: boolean) => {
	const existing = existingUsers.get(userId);
	if (!existing) {
		existingUsers.set(userId, { firstVisitCompleted, firstDailyPromptScheduledFor: null });
		return;
	}

	existingUsers.set(userId, { ...existing, firstVisitCompleted });
};

export const getMockFirstVisitCompleted = (userId: string) =>
	existingUsers.get(userId)?.firstVisitCompleted ?? false;

export const getMockFirstDailyPromptScheduledFor = (userId: string) =>
	existingUsers.get(userId)?.firstDailyPromptScheduledFor ?? null;

export const wasMockFirstVisitMarked = (userId: string) =>
	existingUsers.get(userId)?.firstVisitCompleted ?? false;

export const wasMockUserDeleted = (userId: string) => deletedUsers.has(userId);

export const setMockDbError = (fail: boolean) => {
	shouldFailWithDbError = fail;
};

export const resetMockUsers = () => {
	existingUsers.clear();
	deletedUsers.clear();
	shouldFailWithDbError = false;
};

export const UserAccountDrizzleRepositoryLive = Layer.succeed(
	UserAccountRepository,
	UserAccountRepository.of({
		getEmailAndNameForUser: (userId: string) => {
			if (shouldFailWithDbError) {
				return Effect.fail(new DatabaseError({ message: "mock database error" }));
			}
			return Effect.sync(() => {
				const row = existingUsers.get(userId);
				if (!row) {
					return null;
				}
				return { email: row.email ?? "", name: row.name ?? "there" };
			});
		},
		getFirstVisitCompleted: (userId: string) => {
			if (shouldFailWithDbError) {
				return Effect.fail(new DatabaseError({ message: "mock database error" }));
			}
			return Effect.sync(() => existingUsers.get(userId)?.firstVisitCompleted ?? false);
		},
		markFirstVisitCompleted: (userId: string) => {
			if (shouldFailWithDbError) {
				return Effect.fail(new DatabaseError({ message: "mock database error" }));
			}
			return Effect.sync(() => {
				const existing = existingUsers.get(userId);
				if (!existing) {
					return false;
				}

				existingUsers.set(userId, { ...existing, firstVisitCompleted: true });
				return true;
			});
		},
		scheduleFirstDailyPrompt: (userId: string, scheduledFor: Date) => {
			if (shouldFailWithDbError) {
				return Effect.fail(new DatabaseError({ message: "mock database error" }));
			}
			return Effect.sync((): ScheduleFirstDailyPromptOutcome => {
				const existing = existingUsers.get(userId);
				if (!existing) {
					return { kind: "user_not_found" };
				}

				if (existing.firstDailyPromptScheduledFor !== null) {
					return {
						kind: "already_scheduled",
						scheduledFor: existing.firstDailyPromptScheduledFor,
					};
				}

				existingUsers.set(userId, {
					...existing,
					firstDailyPromptScheduledFor: scheduledFor,
				});
				return { kind: "inserted" };
			});
		},
		deleteAccount: (userId: string) => {
			if (shouldFailWithDbError) {
				return Effect.fail(new DatabaseError({ message: "mock database error" }));
			}
			return Effect.sync(() => {
				if (existingUsers.has(userId)) {
					existingUsers.delete(userId);
					deletedUsers.add(userId);
					return true;
				}
				return false;
			});
		},
	}),
);
