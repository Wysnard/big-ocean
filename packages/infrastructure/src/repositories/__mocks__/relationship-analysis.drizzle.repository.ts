/**
 * Mock: relationship-analysis.drizzle.repository.ts (updated Story 34-1)
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository')
 */

import type { RelationshipAnalysis } from "@workspace/domain";
import { AnalysisNotFoundError, RelationshipAnalysisRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, RelationshipAnalysis>();

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	store.clear();
};

/** Get stored analysis by ID (for test assertions). */
export const _getAnalysisById = (id: string): RelationshipAnalysis | undefined => store.get(id);

export const RelationshipAnalysisDrizzleRepositoryLive = Layer.succeed(
	RelationshipAnalysisRepository,
	RelationshipAnalysisRepository.of({
		insertPlaceholder: (input) =>
			Effect.sync(() => {
				const analysis: RelationshipAnalysis = {
					id: crypto.randomUUID(),
					userAId: input.userAId,
					userBId: input.userBId,
					userAResultId: input.userAResultId,
					userBResultId: input.userBResultId,
					content: null,
					modelUsed: null,
					retryCount: 0,
					createdAt: new Date(),
				};
				store.set(analysis.id, analysis);
				return analysis;
			}),

		updateContent: (input) =>
			Effect.gen(function* () {
				const existing = store.get(input.id);
				if (!existing || existing.content !== null) {
					return yield* Effect.fail(new AnalysisNotFoundError({ analysisId: input.id }));
				}
				const updated: RelationshipAnalysis = {
					...existing,
					content: input.content,
					modelUsed: input.modelUsed,
				};
				store.set(input.id, updated);
				return updated;
			}),

		incrementRetryCount: (id) =>
			Effect.gen(function* () {
				const existing = store.get(id);
				if (!existing) {
					return yield* Effect.fail(new AnalysisNotFoundError({ analysisId: id }));
				}
				const updated: RelationshipAnalysis = {
					...existing,
					retryCount: existing.retryCount + 1,
				};
				store.set(id, updated);
				return updated;
			}),

		getByUserId: (userId) =>
			Effect.sync(() =>
				[...store.values()].filter((a) => a.userAId === userId || a.userBId === userId),
			),

		getById: (id) => Effect.sync(() => store.get(id) ?? null),

		getByIdWithParticipantNames: (id) =>
			Effect.sync(() => {
				const analysis = store.get(id);
				if (!analysis) return null;
				return {
					...analysis,
					userAName: "User A",
					userBName: "User B",
				};
			}),
	}),
);
