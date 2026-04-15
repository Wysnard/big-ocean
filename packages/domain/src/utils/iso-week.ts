/**
 * ISO week (Mon–Sun) helpers aligned with `GET /api/today/week?weekId=YYYY-Www`.
 *
 * Week boundaries use UTC calendar dates (same as daily check-in `local_date` strings).
 */

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

export interface IsoWeekBounds {
	readonly weekStart: Date;
	readonly weekEnd: Date;
	readonly weekStartLocal: string;
	readonly weekEndLocal: string;
}

/**
 * Parse `YYYY-Www` into Monday–Sunday UTC date bounds.
 * Returns `null` if the week id is invalid or out of range for the year.
 */
export const resolveIsoWeekBounds = (weekId: string): IsoWeekBounds | null => {
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
		weekStartLocal: formatUtcDate(weekStart),
		weekEndLocal: formatUtcDate(weekEnd),
	};
};
