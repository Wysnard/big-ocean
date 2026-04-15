/**
 * Mock: daily-check-in.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/daily-check-in.drizzle.repository')
 */

import {
	type DailyCheckIn,
	DailyCheckInRepository,
	type UpsertDailyCheckIn,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const checkIns = new Map<string, DailyCheckIn>();

const toKey = (userId: string, localDate: string) => `${userId}:${localDate}`;

const sortByLocalDate = (entries: DailyCheckIn[]) =>
	[...entries].sort((a, b) => a.localDate.localeCompare(b.localDate));

export const _resetMockState = () => {
	checkIns.clear();
};

export const DailyCheckInDrizzleRepositoryLive = Layer.succeed(
	DailyCheckInRepository,
	DailyCheckInRepository.of({
		upsert: (input: UpsertDailyCheckIn) =>
			Effect.sync(() => {
				const key = toKey(input.userId, input.localDate);
				const existing = checkIns.get(key);
				const record: DailyCheckIn = existing
					? {
							...existing,
							mood: input.mood,
							note: input.note ?? null,
							visibility: input.visibility,
						}
					: {
							id: crypto.randomUUID(),
							userId: input.userId,
							localDate: input.localDate,
							mood: input.mood,
							note: input.note ?? null,
							visibility: input.visibility,
							createdAt: new Date(),
						};

				checkIns.set(key, record);
				return record;
			}),

		getByDate: (userId: string, localDate: string) =>
			Effect.sync(() => checkIns.get(toKey(userId, localDate)) ?? null),

		listForWeek: (userId: string, weekStartLocal: string, weekEndLocal: string) =>
			Effect.sync(() =>
				sortByLocalDate(
					[...checkIns.values()].filter(
						(checkIn) =>
							checkIn.userId === userId &&
							checkIn.localDate >= weekStartLocal &&
							checkIn.localDate <= weekEndLocal,
					),
				),
			),

		listForMonth: (userId: string, monthStartLocal: string, monthEndLocal: string) =>
			Effect.sync(() =>
				sortByLocalDate(
					[...checkIns.values()].filter(
						(checkIn) =>
							checkIn.userId === userId &&
							checkIn.localDate >= monthStartLocal &&
							checkIn.localDate <= monthEndLocal,
					),
				),
			),

		hasAnyForUser: (userId: string) =>
			Effect.sync(() => [...checkIns.values()].some((checkIn) => checkIn.userId === userId)),

		listUserIdsWithAtLeastNCheckInsInRange: (minCount, weekStartLocal, weekEndLocal) =>
			Effect.sync(() => {
				const counts = new Map<string, number>();
				for (const checkIn of checkIns.values()) {
					if (checkIn.localDate >= weekStartLocal && checkIn.localDate <= weekEndLocal) {
						counts.set(checkIn.userId, (counts.get(checkIn.userId) ?? 0) + 1);
					}
				}
				return [...counts.entries()].filter(([, n]) => n >= minCount).map(([userId]) => userId);
			}),
	}),
);
