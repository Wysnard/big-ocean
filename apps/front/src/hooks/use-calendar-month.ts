import { useQuery } from "@tanstack/react-query";
import type { CalendarMonthResponse } from "@workspace/contracts";
import { Effect } from "effect";
import { makeApiClient } from "@/lib/api-client";

const pad = (value: number) => String(value).padStart(2, "0");

export const getCurrentYearMonth = (date = new Date()) =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

/** Shift `YYYY-MM` by whole months using the same local calendar rules as {@link getCurrentYearMonth}. */
export const shiftYearMonth = (yearMonth: string, deltaMonths: number) => {
	const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
	if (!match) {
		throw new Error(`Invalid yearMonth: ${yearMonth}`);
	}

	const year = Number(match[1]);
	const monthIndex = Number(match[2]) - 1;
	const next = new Date(year, monthIndex + deltaMonths, 1);
	return `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
};

export const todayCalendarMonthQueryKey = (yearMonth: string) =>
	["today", "calendar-month", yearMonth] as const;

export function useCalendarMonth(yearMonth: string) {
	return useQuery({
		queryKey: todayCalendarMonthQueryKey(yearMonth),
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.today.getCalendarMonth({
					urlParams: { month: yearMonth },
				});
			}).pipe(Effect.runPromise),
	});
}

export const getCalendarDay = (
	calendarMonth: CalendarMonthResponse | undefined,
	localDate: string,
) => calendarMonth?.days.find((day) => day.localDate === localDate) ?? null;
