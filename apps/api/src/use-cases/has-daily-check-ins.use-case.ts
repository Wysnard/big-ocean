import { DailyCheckInRepository } from "@workspace/domain";
import { Effect } from "effect";

export const hasDailyCheckIns = (userId: string) =>
	Effect.gen(function* () {
		const repository = yield* DailyCheckInRepository;
		const hasCheckIns = yield* repository.hasAnyForUser(userId);

		return { hasCheckIns };
	});
