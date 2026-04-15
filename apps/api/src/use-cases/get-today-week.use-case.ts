import type { WeeklyLetterMeta } from "@workspace/contracts";
import {
	type DailyCheckIn,
	DailyCheckInRepository,
	DatabaseError,
	resolveIsoWeekBounds,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect } from "effect";

interface WeekGridDay {
	readonly localDate: string;
	readonly checkIn: DailyCheckIn | null;
}

export interface TodayWeekGrid {
	readonly weekId: string;
	readonly days: readonly WeekGridDay[];
	readonly weeklyLetter: WeeklyLetterMeta;
}

const formatUtcDate = (value: Date) => value.toISOString().slice(0, 10);

const addDays = (value: Date, days: number) => {
	const next = new Date(value);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
};

export const getTodayWeekGrid = (userId: string, weekId: string) =>
	Effect.gen(function* () {
		const repository = yield* DailyCheckInRepository;
		const weeklyRepo = yield* WeeklySummaryRepository;
		const parsedWeek = resolveIsoWeekBounds(weekId);

		if (!parsedWeek) {
			return yield* Effect.fail(
				new DatabaseError({
					message: `Invalid weekId: ${weekId}`,
				}),
			);
		}

		const weekStartLocal = parsedWeek.weekStartLocal;
		const weekEndLocal = parsedWeek.weekEndLocal;
		const checkIns = yield* repository.listForWeek(userId, weekStartLocal, weekEndLocal);
		const checkInByDate = new Map(checkIns.map((checkIn) => [checkIn.localDate, checkIn]));

		const summary = yield* weeklyRepo.getByWeekId(userId, weekId);
		const weeklyLetter =
			summary?.content && summary.generatedAt
				? {
						status: "ready" as const,
						generatedAt: summary.generatedAt.toISOString(),
					}
				: { status: "none" as const };

		return {
			weekId,
			days: Array.from({ length: 7 }, (_, index) => {
				const localDate = formatUtcDate(addDays(parsedWeek.weekStart, index));
				return {
					localDate,
					checkIn: checkInByDate.get(localDate) ?? null,
				};
			}),
			weeklyLetter,
		};
	});
