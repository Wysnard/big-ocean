import { LoggerRepository, UserAccountRepository } from "@workspace/domain";
import { Effect } from "effect";

export const getFirstVisitState = (userId: string) =>
	Effect.gen(function* () {
		const accountRepo = yield* UserAccountRepository;
		const logger = yield* LoggerRepository;

		logger.info("First visit state requested", { userId });

		const firstVisitCompleted = yield* accountRepo.getFirstVisitCompleted(userId);

		return {
			firstVisitCompleted,
		} as const;
	});
