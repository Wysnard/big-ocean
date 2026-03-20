/**
 * Delete Account Use Case (Story 30-2)
 *
 * Permanently deletes a user's account and all associated data.
 * Delegates cascade deletion to UserAccountRepository.
 *
 * Dependencies: UserAccountRepository, LoggerRepository
 */

import { AccountNotFound, LoggerRepository, UserAccountRepository } from "@workspace/domain";
import { Effect } from "effect";

/**
 * Delete a user's account and all associated data.
 *
 * Error propagation: AccountNotFound (404) when user doesn't exist,
 * DatabaseError from repo passes through without remapping
 * (per ARCHITECTURE.md: use-cases must NOT remap errors).
 *
 * @param userId - The authenticated user's ID
 * @returns { success: true } on successful deletion
 */
export const deleteAccount = (userId: string) =>
	Effect.gen(function* () {
		const accountRepo = yield* UserAccountRepository;
		const logger = yield* LoggerRepository;

		logger.info("Account deletion requested", { userId });

		const wasDeleted = yield* accountRepo.deleteAccount(userId);

		if (!wasDeleted) {
			return yield* Effect.fail(
				new AccountNotFound({
					userId,
					message: "Account not found",
				}),
			);
		}

		// Domain event: structured log for future event bus subscribers (AC3)
		logger.info("account.deleted", { userId, event: "account.deleted" });

		return { success: true as const };
	});
