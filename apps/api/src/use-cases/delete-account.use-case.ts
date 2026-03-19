/**
 * Delete Account Use Case (Story 30-2)
 *
 * Permanently deletes a user's account and all associated data.
 * Delegates cascade deletion to UserAccountRepository.
 *
 * Dependencies: UserAccountRepository, LoggerRepository
 */

import { DatabaseError } from "@workspace/contracts/errors";
import { LoggerRepository, UserAccountRepository } from "@workspace/domain";
import { Effect } from "effect";

/**
 * Delete a user's account and all associated data.
 *
 * @param userId - The authenticated user's ID
 * @returns { success: boolean } - true if account was deleted
 */
export const deleteAccount = (userId: string) =>
	Effect.gen(function* () {
		const accountRepo = yield* UserAccountRepository;
		const logger = yield* LoggerRepository;

		logger.info("Account deletion requested", { userId });

		const wasDeleted = yield* accountRepo.deleteAccount(userId).pipe(
			Effect.mapError(
				(error) =>
					new DatabaseError({
						message: `Account deletion failed: ${error.message}`,
					}),
			),
		);

		if (!wasDeleted) {
			logger.warn("Account deletion: user not found", { userId });
		}

		return { success: wasDeleted };
	});
