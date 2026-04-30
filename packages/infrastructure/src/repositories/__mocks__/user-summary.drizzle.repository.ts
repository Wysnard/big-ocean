/**
 * Mock: user-summary.drizzle.repository.ts (ADR-55)
 */

import {
	type UserSummaryRecord,
	UserSummaryRepository,
	type UserSummarySaveVersionInput,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const rows: UserSummaryRecord[] = [];

export const _resetUserSummaryMockState = () => {
	rows.length = 0;
};

export const _getUserSummaryByResultId = (assessmentResultId: string) =>
	rows.find((r) => r.assessmentResultId === assessmentResultId) ?? null;

export const UserSummaryDrizzleRepositoryLive = Layer.succeed(
	UserSummaryRepository,
	UserSummaryRepository.of({
		saveVersion: (input: UserSummarySaveVersionInput) =>
			Effect.sync(() => {
				const maxV = rows
					.filter((r) => r.userId === input.userId)
					.reduce((m, r) => Math.max(m, r.version), 0);
				const nextVersion = maxV + 1;
				const now = new Date();
				const row: UserSummaryRecord = {
					id: crypto.randomUUID(),
					userId: input.userId,
					assessmentResultId: input.assessmentResultId,
					themes: input.themes,
					quoteBank: input.quoteBank,
					summaryText: input.summaryText,
					version: nextVersion,
					refreshSource: input.refreshSource,
					generatedAt: now,
				};
				rows.push(row);
				return row;
			}),

		getForAssessmentResult: (assessmentResultId) =>
			Effect.sync(() => rows.find((r) => r.assessmentResultId === assessmentResultId) ?? null),

		getCurrentForUser: (userId) =>
			Effect.sync(() => {
				let best: UserSummaryRecord | null = null;
				for (const r of rows) {
					if (r.userId !== userId) continue;
					if (!best || r.version > best.version) best = r;
				}
				return best;
			}),
	}),
);
