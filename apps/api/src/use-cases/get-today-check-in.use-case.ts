import { DailyCheckInRepository } from "@workspace/domain";
import { Effect } from "effect";

export const getTodayCheckIn = (userId: string, localDate: string) =>
	Effect.gen(function* () {
		const repository = yield* DailyCheckInRepository;
		return yield* repository.getByDate(userId, localDate);
	});
