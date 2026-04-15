import { DailyCheckInRepository, InvalidYearMonthError } from "@workspace/domain";
import { Effect } from "effect";

const formatUtcDate = (value: Date) => value.toISOString().slice(0, 10);

const resolveCalendarMonthBounds = (yearMonth: string) => {
	const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const monthIndex = Number(match[2]) - 1;
	if (
		!Number.isInteger(year) ||
		!Number.isInteger(monthIndex) ||
		monthIndex < 0 ||
		monthIndex > 11
	) {
		return null;
	}

	const monthStart = new Date(Date.UTC(year, monthIndex, 1));
	if (monthStart.getUTCFullYear() !== year || monthStart.getUTCMonth() !== monthIndex) {
		return null;
	}

	const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
	return {
		monthStart,
		monthEnd,
		monthStartLocal: formatUtcDate(monthStart),
		monthEndLocal: formatUtcDate(monthEnd),
		daysInMonth: monthEnd.getUTCDate(),
	};
};

export const getCalendarMonth = (userId: string, yearMonth: string) =>
	Effect.gen(function* () {
		const repository = yield* DailyCheckInRepository;
		const bounds = resolveCalendarMonthBounds(yearMonth);

		if (!bounds) {
			return yield* Effect.fail(
				new InvalidYearMonthError({
					yearMonth,
					message: `Invalid month: ${yearMonth}`,
				}),
			);
		}

		const checkIns = yield* repository.listForMonth(
			userId,
			bounds.monthStartLocal,
			bounds.monthEndLocal,
		);
		const checkInByDate = new Map(checkIns.map((checkIn) => [checkIn.localDate, checkIn]));

		return {
			yearMonth,
			days: Array.from({ length: bounds.daysInMonth }, (_, index) => {
				const localDate = formatUtcDate(
					new Date(
						Date.UTC(bounds.monthStart.getUTCFullYear(), bounds.monthStart.getUTCMonth(), index + 1),
					),
				);
				return {
					localDate,
					checkIn: checkInByDate.get(localDate) ?? null,
				};
			}),
		};
	});
