/**
 * Get weekly letter for user (Story 5.2)
 */

import { describe, expect, it } from "@effect/vitest";
import type { DatabaseError, WeeklySummary } from "@workspace/domain";
import {
	resolveIsoWeekBounds,
	WeeklyLetterNotFound,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { getWeeklyLetterForUser } from "../get-weekly-letter-for-user.use-case";

type GetByWeekIdFn = (
	userId: string,
	weekId: string,
) => Effect.Effect<WeeklySummary | null, DatabaseError>;

const makeWeeklyRepo = (getByWeekId: GetByWeekIdFn) =>
	WeeklySummaryRepository.of({
		save: () => Effect.die("unimplemented"),
		getByUserAndWeekStart: () => Effect.die("unimplemented"),
		getByWeekId,
		getByUserId: () => Effect.die("unimplemented"),
		getLatestForUser: () => Effect.die("unimplemented"),
	});

describe("getWeeklyLetterForUser", () => {
	it.effect("returns letter when summary exists with content", () =>
		Effect.gen(function* () {
			const bounds = resolveIsoWeekBounds("2026-W15");
			if (!bounds) {
				return yield* Effect.die("test week id invalid");
			}

			const getByWeekId = () =>
				Effect.succeed({
					id: "w1",
					userId: "u1",
					weekStartDate: bounds.weekStartLocal,
					weekEndDate: bounds.weekEndLocal,
					content: "# Hello\n\nBody",
					generatedAt: new Date("2026-04-12T18:00:00.000Z"),
					failedAt: null,
					retryCount: 0,
					createdAt: new Date("2026-04-12T17:00:00.000Z"),
				});

			const layer = Layer.succeed(WeeklySummaryRepository, makeWeeklyRepo(getByWeekId));

			const out = yield* getWeeklyLetterForUser({ userId: "u1", weekId: "2026-W15" }).pipe(
				Effect.provide(layer),
			);

			expect(out.weekId).toBe("2026-W15");
			expect(out.content).toContain("Hello");
			expect(out.generatedAt).toMatch(/^2026-04-12/);
		}),
	);

	it.effect("fails WeeklyLetterNotFound when no row", () =>
		Effect.gen(function* () {
			const getByWeekId = () => Effect.succeed(null);
			const layer = Layer.succeed(WeeklySummaryRepository, makeWeeklyRepo(getByWeekId));

			const result = yield* getWeeklyLetterForUser({ userId: "u1", weekId: "2026-W15" }).pipe(
				Effect.provide(layer),
				Effect.flip,
			);

			expect(result).toBeInstanceOf(WeeklyLetterNotFound);
		}),
	);

	it.effect("fails WeeklyLetterNotFound when content is null", () =>
		Effect.gen(function* () {
			const bounds = resolveIsoWeekBounds("2026-W15");
			if (!bounds) {
				return yield* Effect.die("test week id invalid");
			}

			const getByWeekId = () =>
				Effect.succeed({
					id: "w1",
					userId: "u1",
					weekStartDate: bounds.weekStartLocal,
					weekEndDate: bounds.weekEndLocal,
					content: null,
					generatedAt: null,
					failedAt: new Date(),
					retryCount: 1,
					createdAt: new Date(),
				});

			const layer = Layer.succeed(WeeklySummaryRepository, makeWeeklyRepo(getByWeekId));

			const result = yield* getWeeklyLetterForUser({ userId: "u1", weekId: "2026-W15" }).pipe(
				Effect.provide(layer),
				Effect.flip,
			);

			expect(result).toBeInstanceOf(WeeklyLetterNotFound);
		}),
	);

	it.effect("fails WeeklyLetterNotFound for invalid week id", () =>
		Effect.gen(function* () {
			const getByWeekId = () => Effect.die("should not be called");
			const layer = Layer.succeed(WeeklySummaryRepository, makeWeeklyRepo(getByWeekId));

			const result = yield* getWeeklyLetterForUser({ userId: "u1", weekId: "not-a-week" }).pipe(
				Effect.provide(layer),
				Effect.flip,
			);

			expect(result).toBeInstanceOf(WeeklyLetterNotFound);
		}),
	);
});
