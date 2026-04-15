import { AccountNotFound, LoggerRepository, UserAccountRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface ScheduleFirstDailyPromptInput {
	readonly userId: string;
	readonly scheduledFor: Date;
}

export const scheduleFirstDailyPrompt = (input: ScheduleFirstDailyPromptInput) =>
	Effect.gen(function* () {
		const accountRepo = yield* UserAccountRepository;
		const logger = yield* LoggerRepository;

		logger.info("First daily prompt scheduling requested", {
			userId: input.userId,
			scheduledFor: input.scheduledFor.toISOString(),
		});

		const outcome = yield* accountRepo.scheduleFirstDailyPrompt(input.userId, input.scheduledFor);

		if (outcome.kind === "user_not_found") {
			return yield* Effect.fail(
				new AccountNotFound({
					userId: input.userId,
					message: "Account not found",
				}),
			);
		}

		const scheduledFor = outcome.kind === "inserted" ? input.scheduledFor : outcome.scheduledFor;

		logger.info("account.first_daily_prompt_scheduled", {
			userId: input.userId,
			event: "account.first_daily_prompt_scheduled",
			scheduledFor: scheduledFor.toISOString(),
			idempotent: outcome.kind === "already_scheduled",
		});

		return {
			success: true as const,
			scheduledFor,
		};
	});
