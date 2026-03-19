/**
 * User Account Repository Mock (Story 30-2)
 *
 * In-memory mock for testing account deletion.
 */

import { UserAccountRepository } from "@workspace/domain/repositories/user-account.repository";
import { Effect, Layer } from "effect";

/** Set of user IDs that "exist" in the mock */
const existingUsers = new Set<string>();

/** Track deleted users for test assertions */
const deletedUsers = new Set<string>();

export const addMockUser = (userId: string) => {
	existingUsers.add(userId);
};

export const wasMockUserDeleted = (userId: string) => deletedUsers.has(userId);

export const resetMockUsers = () => {
	existingUsers.clear();
	deletedUsers.clear();
};

export const UserAccountDrizzleRepositoryLive = Layer.succeed(
	UserAccountRepository,
	UserAccountRepository.of({
		deleteAccount: (userId: string) =>
			Effect.sync(() => {
				if (existingUsers.has(userId)) {
					existingUsers.delete(userId);
					deletedUsers.add(userId);
					return true;
				}
				return false;
			}),
	}),
);
