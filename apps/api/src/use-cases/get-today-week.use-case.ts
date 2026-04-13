import { type DailyCheckIn, DailyCheckInRepository, DatabaseError } from "@workspace/domain";
import { Effect } from "effect";

interface WeekGridDay {
	readonly localDate: string;
	readonly checkIn: DailyCheckIn | null;
}

interface TodayWeekGrid {
	readonly weekId: string;
	readonly days: readonly WeekGridDay[];
}

const formatUtcDate = (value: Date) => value.toISOString().slice(0, 10);

const addDays = (value: Date, days: number) => {
	const next = new Date(value);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
};

const hasIsoWeek53 = (year: number): boolean => {
	const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay();
	const dec31Day = new Date(Date.UTC(year, 11, 31)).getUTCDay();
	return jan1Day === 4 || dec31Day === 4;
};

const parseIsoWeekId = (weekId: string) => {
	const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const week = Number(match[2]);
	const maxWeek = hasIsoWeek53(year) ? 53 : 52;
	if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > maxWeek) {
		return null;
	}

	const jan4 = new Date(Date.UTC(year, 0, 4));
	const jan4Weekday = jan4.getUTCDay() || 7;
	const weekOneMonday = addDays(jan4, 1 - jan4Weekday);
	const weekStart = addDays(weekOneMonday, (week - 1) * 7);
	const weekEnd = addDays(weekStart, 6);

	return {
		weekStart,
		weekEnd,
	};
};

export const getTodayWeekGrid = (userId: string, weekId: string) =>
	Effect.gen(function* () {
		const repository = yield* DailyCheckInRepository;
		const parsedWeek = parseIsoWeekId(weekId);

		if (!parsedWeek) {
			return yield* Effect.fail(
				new DatabaseError({
					message: `Invalid weekId: ${weekId}`,
				}),
			);
		}

		const weekStartLocal = formatUtcDate(parsedWeek.weekStart);
		const weekEndLocal = formatUtcDate(parsedWeek.weekEnd);
		const checkIns = yield* repository.listForWeek(userId, weekStartLocal, weekEndLocal);
		const checkInByDate = new Map(checkIns.map((checkIn) => [checkIn.localDate, checkIn]));

		return {
			weekId,
			days: Array.from({ length: 7 }, (_, index) => {
				const localDate = formatUtcDate(addDays(parsedWeek.weekStart, index));
				return {
					localDate,
					checkIn: checkInByDate.get(localDate) ?? null,
				};
			}),
		};
	});
