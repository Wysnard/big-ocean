/**
 * Mock: user-summary.drizzle.repository.ts (Story 7.1)
 */

import {
	type UserSummaryRecord,
	UserSummaryRepository,
	type UserSummaryUpsertInput,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const byResultId = new Map<string, UserSummaryRecord>();

export const _resetUserSummaryMockState = () => {
	byResultId.clear();
};

export const _getUserSummaryByResultId = (assessmentResultId: string) =>
	byResultId.get(assessmentResultId) ?? null;

export const UserSummaryDrizzleRepositoryLive = Layer.succeed(
	UserSummaryRepository,
	UserSummaryRepository.of({
		upsertForAssessmentResult: (input: UserSummaryUpsertInput) =>
			Effect.sync(() => {
				const existing = byResultId.get(input.assessmentResultId);
				const now = new Date();
				const row: UserSummaryRecord = {
					id: existing?.id ?? crypto.randomUUID(),
					userId: input.userId,
					assessmentResultId: input.assessmentResultId,
					themes: input.themes,
					quoteBank: input.quoteBank,
					summaryText: input.summaryText,
					version: input.version,
					createdAt: existing?.createdAt ?? now,
					updatedAt: now,
				};
				byResultId.set(input.assessmentResultId, row);
				return row;
			}),

		getByAssessmentResultId: (assessmentResultId) =>
			Effect.sync(() => byResultId.get(assessmentResultId) ?? null),

		getLatestForUser: (userId) =>
			Effect.sync(() => {
				let best: UserSummaryRecord | null = null;
				for (const row of byResultId.values()) {
					if (row.userId !== userId) continue;
					if (!best || row.updatedAt.getTime() > best.updatedAt.getTime()) {
						best = row;
					}
				}
				return best;
			}),
	}),
);
