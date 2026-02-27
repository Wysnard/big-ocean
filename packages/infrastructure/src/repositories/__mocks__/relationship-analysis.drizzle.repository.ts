/**
 * Mock: relationship-analysis.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository')
 */

import type { RelationshipAnalysis } from "@workspace/domain";
import { AnalysisNotFoundError, RelationshipAnalysisRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, RelationshipAnalysis>();
const invitationIndex = new Map<string, string>(); // invitationId → id

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	store.clear();
	invitationIndex.clear();
};

/** Get stored analysis by ID (for test assertions). */
export const _getAnalysisById = (id: string): RelationshipAnalysis | undefined => store.get(id);

export const RelationshipAnalysisDrizzleRepositoryLive = Layer.succeed(
	RelationshipAnalysisRepository,
	RelationshipAnalysisRepository.of({
		insertPlaceholder: (input) =>
			Effect.sync(() => {
				// onConflictDoNothing: return null if placeholder already exists
				const existingId = invitationIndex.get(input.invitationId);
				if (existingId) return null;

				const analysis: RelationshipAnalysis = {
					id: crypto.randomUUID(),
					invitationId: input.invitationId,
					userAId: input.userAId,
					userBId: input.userBId,
					content: null,
					modelUsed: null,
					retryCount: 0,
					createdAt: new Date(),
				};
				store.set(analysis.id, analysis);
				invitationIndex.set(input.invitationId, analysis.id);
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

		getByInvitationId: (invitationId) =>
			Effect.sync(() => {
				const id = invitationIndex.get(invitationId);
				if (!id) return null;
				return store.get(id) ?? null;
			}),

		getByUserId: (userId) =>
			Effect.sync(() =>
				[...store.values()].filter((a) => a.userAId === userId || a.userBId === userId),
			),

		getById: (id) => Effect.sync(() => store.get(id) ?? null),
	}),
);
