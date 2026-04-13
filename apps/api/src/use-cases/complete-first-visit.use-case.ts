import { AccountNotFound, LoggerRepository, UserAccountRepository } from "@workspace/domain";
import { Effect } from "effect";

export const completeFirstVisit = (userId: string) =>
	Effect.gen(function* () {
		const accountRepo = yield* UserAccountRepository;
		const logger = yield* LoggerRepository;

		logger.info("First visit completion requested", { userId });

		const wasUpdated = yield* accountRepo.markFirstVisitCompleted(userId);

		if (!wasUpdated) {
			return yield* Effect.fail(
				new AccountNotFound({
					userId,
					message: "Account not found",
				}),
			);
		}

		logger.info("account.first_visit_completed", {
			userId,
			event: "account.first_visit_completed",
		});

		return {
			firstVisitCompleted: true,
		} as const;
	});
