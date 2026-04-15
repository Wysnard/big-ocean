import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/daily-check-in.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { DailyCheckInRepository, InvalidYearMonthError } from "@workspace/domain";
import {
	_resetMockState,
	DailyCheckInDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/daily-check-in.drizzle.repository";
import { Cause, Effect, Exit, Layer } from "effect";
import { getCalendarMonth, hasDailyCheckIns } from "../index";

const TestLayer = Layer.mergeAll(DailyCheckInDrizzleRepositoryLive);

describe("getCalendarMonth", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("expands a full month and only includes check-ins inside that month", () =>
		Effect.gen(function* () {
			const repository = yield* DailyCheckInRepository;
			yield* repository.upsert({
				userId: "user-123",
				localDate: "2026-04-01",
				mood: "good",
				note: "Month started steady",
				visibility: "private",
			});
			yield* repository.upsert({
				userId: "user-123",
				localDate: "2026-04-30",
				mood: "great",
				note: "Strong finish",
				visibility: "private",
			});
			yield* repository.upsert({
				userId: "user-123",
				localDate: "2026-03-31",
				mood: "rough",
				note: "Previous month",
				visibility: "private",
			});

			const result = yield* getCalendarMonth("user-123", "2026-04");

			expect(result.yearMonth).toBe("2026-04");
			expect(result.days).toHaveLength(30);
			expect(result.days[0]?.localDate).toBe("2026-04-01");
			expect(result.days[0]?.checkIn?.note).toBe("Month started steady");
			expect(result.days[29]?.localDate).toBe("2026-04-30");
			expect(result.days[29]?.checkIn?.note).toBe("Strong finish");
			expect(result.days.some((day) => day.localDate === "2026-03-31")).toBe(false);
			expect(result.days[1]?.checkIn).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails on an invalid year-month", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(getCalendarMonth("user-123", "2026-13"));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = Cause.failureOption(exit.cause);
				expect(error._tag).toBe("Some");
				const failed = (error as { value: InvalidYearMonthError }).value;
				expect(failed._tag).toBe("InvalidYearMonthError");
				expect(failed.yearMonth).toBe("2026-13");
				expect(failed.message).toContain("Invalid month");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});

describe("hasDailyCheckIns", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("returns false when the user has never checked in and true once one exists", () =>
		Effect.gen(function* () {
			expect(yield* hasDailyCheckIns("user-123")).toEqual({ hasCheckIns: false });

			const repository = yield* DailyCheckInRepository;
			yield* repository.upsert({
				userId: "user-123",
				localDate: "2026-04-14",
				mood: "okay",
				note: null,
				visibility: "private",
			});

			expect(yield* hasDailyCheckIns("user-123")).toEqual({ hasCheckIns: true });
		}).pipe(Effect.provide(TestLayer)),
	);
});
