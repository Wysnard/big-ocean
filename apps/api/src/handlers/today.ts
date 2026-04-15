import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AuthenticatedUser } from "@workspace/domain";
import { Effect } from "effect";
import {
	getCalendarMonth,
	getTodayCheckIn,
	getTodayWeekGrid,
	getWeeklyLetterForUser,
	hasDailyCheckIns,
	submitDailyCheckIn,
} from "../use-cases/index";

const toCheckInResponse = (checkIn: {
	id: string;
	localDate: string;
	mood: "great" | "good" | "okay" | "uneasy" | "rough";
	note: string | null;
	visibility: "private" | "inner_circle" | "public_pulse";
}) => ({
	id: checkIn.id,
	localDate: checkIn.localDate,
	mood: checkIn.mood,
	note: checkIn.note,
	visibility: checkIn.visibility,
});

export const TodayGroupLive = HttpApiBuilder.group(BigOceanApi, "today", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("submitCheckIn", ({ payload }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const checkIn = yield* submitDailyCheckIn({
						userId,
						localDate: payload.localDate,
						mood: payload.mood,
						note: payload.note,
						visibility: payload.visibility,
					});

					return toCheckInResponse(checkIn);
				}),
			)
			.handle("getCheckIn", ({ urlParams }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const checkIn = yield* getTodayCheckIn(userId, urlParams.localDate);

					if (!checkIn) {
						return { found: false as const };
					}

					return toCheckInResponse(checkIn);
				}),
			)
			.handle("getWeeklyLetter", ({ path }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* getWeeklyLetterForUser({ userId, weekId: path.weekId });
				}),
			)
			.handle("getWeekGrid", ({ urlParams }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const weekGrid = yield* getTodayWeekGrid(userId, urlParams.weekId);

					return {
						weekId: weekGrid.weekId,
						days: weekGrid.days.map((day) => ({
							localDate: day.localDate,
							checkIn: day.checkIn ? toCheckInResponse(day.checkIn) : null,
						})),
					};
				}),
			)
			.handle("getCalendarMonth", ({ urlParams }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const calendarMonth = yield* getCalendarMonth(userId, urlParams.month);

					return {
						yearMonth: calendarMonth.yearMonth,
						days: calendarMonth.days.map((day) => ({
							localDate: day.localDate,
							checkIn: day.checkIn ? toCheckInResponse(day.checkIn) : null,
						})),
					};
				}),
			)
			.handle("getHasCheckIns", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* hasDailyCheckIns(userId);
				}),
			);
	}),
);
