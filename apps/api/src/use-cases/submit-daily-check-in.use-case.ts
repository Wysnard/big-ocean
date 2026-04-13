import {
	type DailyCheckInMood,
	DailyCheckInRepository,
	type DailyCheckInVisibility,
} from "@workspace/domain";
import { Effect } from "effect";

export interface SubmitDailyCheckInInput {
	readonly userId: string;
	readonly localDate: string;
	readonly mood: DailyCheckInMood;
	readonly note?: string | null;
	readonly visibility?: DailyCheckInVisibility;
}

export const submitDailyCheckIn = (input: SubmitDailyCheckInInput) =>
	Effect.gen(function* () {
		const repository = yield* DailyCheckInRepository;

		return yield* repository.upsert({
			userId: input.userId,
			localDate: input.localDate,
			mood: input.mood,
			note: input.note ?? null,
			visibility: input.visibility ?? "private",
		});
	});
