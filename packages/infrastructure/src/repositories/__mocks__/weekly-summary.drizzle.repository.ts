/**
 * Mock: weekly-summary.drizzle.repository.ts
 */

import {
	DatabaseError,
	resolveIsoWeekBounds,
	type WeeklySummary,
	WeeklySummaryRepository,
	type WeeklySummarySaveInput,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const rows = new Map<string, WeeklySummary>();

const keyOf = (userId: string, weekStartDate: string) => `${userId}:${weekStartDate}`;

export const _resetWeeklySummaryMockState = () => {
	rows.clear();
};

export const WeeklySummaryDrizzleRepositoryLive = Layer.succeed(
	WeeklySummaryRepository,
	WeeklySummaryRepository.of({
		save: (input: WeeklySummarySaveInput) =>
			Effect.sync(() => {
				const weekStartDate = input.weekStartDate;
				const k = keyOf(input.userId, weekStartDate);
				const existing = rows.get(k);

				if (input.outcome === "generated") {
					const next: WeeklySummary = {
						id: existing?.id ?? crypto.randomUUID(),
						userId: input.userId,
						weekStartDate: input.weekStartDate,
						weekEndDate: input.weekEndDate,
						content: input.content,
						generatedAt: input.generatedAt,
						failedAt: null,
						retryCount: 0,
						createdAt: existing?.createdAt ?? new Date(),
					};
					rows.set(k, next);
					return next;
				}

				const next: WeeklySummary = {
					id: existing?.id ?? crypto.randomUUID(),
					userId: input.userId,
					weekStartDate: input.weekStartDate,
					weekEndDate: input.weekEndDate,
					content: existing?.content ?? null,
					generatedAt: existing?.generatedAt ?? null,
					failedAt: input.failedAt,
					retryCount: (existing?.retryCount ?? 0) + 1,
					createdAt: existing?.createdAt ?? new Date(),
				};
				rows.set(k, next);
				return next;
			}),

		getByUserAndWeekStart: (userId, weekStartDate) =>
			Effect.sync(() => rows.get(keyOf(userId, weekStartDate)) ?? null),

		getByWeekId: (userId, weekId) =>
			Effect.gen(function* () {
				const bounds = resolveIsoWeekBounds(weekId);
				if (!bounds) {
					return yield* Effect.fail(
						new DatabaseError({ message: `Invalid weekId for weekly summary: ${weekId}` }),
					);
				}
				return rows.get(keyOf(userId, bounds.weekStartLocal)) ?? null;
			}),

		getByUserId: (userId) =>
			Effect.sync(() =>
				[...rows.values()]
					.filter((r) => r.userId === userId)
					.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)),
			),

		getLatestForUser: (userId) =>
			Effect.sync(() => {
				const list = [...rows.values()]
					.filter((r) => r.userId === userId)
					.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
				return list[0] ?? null;
			}),
	}),
);
