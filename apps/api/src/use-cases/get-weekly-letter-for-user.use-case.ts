/**
 * Get weekly letter for the authenticated user (Story 5.2)
 */

import {
	resolveIsoWeekBounds,
	WeeklyLetterNotFound,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GetWeeklyLetterForUserOutput {
	readonly weekId: string;
	readonly content: string;
	readonly generatedAt: string;
}

export const getWeeklyLetterForUser = (input: {
	readonly userId: string;
	readonly weekId: string;
}) =>
	Effect.gen(function* () {
		if (!resolveIsoWeekBounds(input.weekId)) {
			return yield* Effect.fail(
				new WeeklyLetterNotFound({
					weekId: input.weekId,
					message: "Letter not available for this week.",
				}),
			);
		}

		const repo = yield* WeeklySummaryRepository;
		const row = yield* repo.getByWeekId(input.userId, input.weekId);

		if (!row?.content || row.generatedAt == null) {
			return yield* Effect.fail(
				new WeeklyLetterNotFound({
					weekId: input.weekId,
					message: "Letter not available for this week.",
				}),
			);
		}

		return {
			weekId: input.weekId,
			content: row.content,
			generatedAt: row.generatedAt.toISOString(),
		} satisfies GetWeeklyLetterForUserOutput;
	});
