import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/daily-check-in.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { DailyCheckInRepository } from "@workspace/domain";
import {
	_resetMockState,
	DailyCheckInDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/daily-check-in.drizzle.repository";
import { Effect, Layer } from "effect";
import { submitDailyCheckIn } from "../submit-daily-check-in.use-case";

const TestLayer = Layer.mergeAll(DailyCheckInDrizzleRepositoryLive);

describe("submitDailyCheckIn", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("creates a new check-in for a user and date", () =>
		Effect.gen(function* () {
			const result = yield* submitDailyCheckIn({
				userId: "user-123",
				localDate: "2026-04-13",
				mood: "good",
				note: "Felt steady",
			});

			expect(result.userId).toBe("user-123");
			expect(result.localDate).toBe("2026-04-13");
			expect(result.mood).toBe("good");
			expect(result.note).toBe("Felt steady");
			expect(result.visibility).toBe("private");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("overwrites the existing check-in for the same user and date", () =>
		Effect.gen(function* () {
			const repository = yield* DailyCheckInRepository;

			const first = yield* submitDailyCheckIn({
				userId: "user-456",
				localDate: "2026-04-14",
				mood: "okay",
				note: "Morning entry",
				visibility: "inner_circle",
			});

			const second = yield* submitDailyCheckIn({
				userId: "user-456",
				localDate: "2026-04-14",
				mood: "great",
				note: "Updated after a better afternoon",
				visibility: "public_pulse",
			});

			const stored = yield* repository.getByDate("user-456", "2026-04-14");
			const week = yield* repository.listForWeek("user-456", "2026-04-14", "2026-04-20");

			expect(second.id).toBe(first.id);
			expect(stored?.mood).toBe("great");
			expect(stored?.note).toBe("Updated after a better afternoon");
			expect(stored?.visibility).toBe("public_pulse");
			expect(week).toHaveLength(1);
			expect(week[0]?.id).toBe(first.id);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("keeps check-ins isolated per user and local date", () =>
		Effect.gen(function* () {
			const repository = yield* DailyCheckInRepository;

			yield* submitDailyCheckIn({
				userId: "user-a",
				localDate: "2026-04-15",
				mood: "rough",
			});
			yield* submitDailyCheckIn({
				userId: "user-b",
				localDate: "2026-04-15",
				mood: "great",
			});
			yield* submitDailyCheckIn({
				userId: "user-a",
				localDate: "2026-04-16",
				mood: "good",
			});

			const userAWeek = yield* repository.listForWeek("user-a", "2026-04-14", "2026-04-20");
			const userBWeek = yield* repository.listForWeek("user-b", "2026-04-14", "2026-04-20");

			expect(userAWeek).toHaveLength(2);
			expect(userBWeek).toHaveLength(1);
			expect(userAWeek.map((entry) => entry.localDate)).toEqual(["2026-04-15", "2026-04-16"]);
		}).pipe(Effect.provide(TestLayer)),
	);
});
