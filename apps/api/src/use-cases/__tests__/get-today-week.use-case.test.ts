/**
 * Today week grid + weekly letter meta (Story 5.3)
 */

import { describe, expect, it } from "@effect/vitest";
import { DailyCheckInRepository, WeeklySummaryRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { getTodayWeekGrid } from "../get-today-week.use-case";

const mockDailyRepo = {
	listForWeek: vi.fn(),
};

const mockWeeklyRepo = {
	getByWeekId: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(DailyCheckInRepository, mockDailyRepo),
		Layer.succeed(WeeklySummaryRepository, mockWeeklyRepo),
	);

describe("getTodayWeekGrid", () => {
	it.effect("returns weeklyLetter none when no summary row", () =>
		Effect.gen(function* () {
			mockDailyRepo.listForWeek.mockReturnValue(Effect.succeed([]));
			mockWeeklyRepo.getByWeekId.mockReturnValue(Effect.succeed(null));

			const grid = yield* getTodayWeekGrid("user-1", "2026-W15");

			expect(grid.weeklyLetter.status).toBe("none");
			expect(grid.days).toHaveLength(7);
			expect(grid.weekId).toBe("2026-W15");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns weeklyLetter ready when summary has content", () =>
		Effect.gen(function* () {
			mockDailyRepo.listForWeek.mockReturnValue(Effect.succeed([]));
			mockWeeklyRepo.getByWeekId.mockReturnValue(
				Effect.succeed({
					id: "ws-1",
					userId: "user-1",
					weekStartDate: "2026-04-06",
					weekEndDate: "2026-04-12",
					content: "# Letter",
					generatedAt: new Date("2026-04-12T18:00:00.000Z"),
					failedAt: null,
					retryCount: 0,
					createdAt: new Date(),
				}),
			);

			const grid = yield* getTodayWeekGrid("user-1", "2026-W15");

			expect(grid.weeklyLetter.status).toBe("ready");
			if (grid.weeklyLetter.status === "ready") {
				expect(grid.weeklyLetter.generatedAt).toBe("2026-04-12T18:00:00.000Z");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);
});
