/**
 * Mock: facet-score.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/facet-score.drizzle.repository')
 */
import {
	createInitialFacetScoresMap,
	type FacetName,
	FacetScoreRepository,
	type FacetScoresMap,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, FacetScoresMap>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => store.clear();

/** Seed facet scores for a session in the mock store */
export const _seedFacetScores = (
	sessionId: string,
	scores: Partial<Record<FacetName, { score: number; confidence: number }>>,
) => {
	store.set(sessionId, createInitialFacetScoresMap(scores));
};

export const FacetScoreDrizzleRepositoryLive = Layer.succeed(
	FacetScoreRepository,
	FacetScoreRepository.of({
		getBySession: (sessionId: string) =>
			Effect.sync(() => {
				const stored = store.get(sessionId);
				if (stored) return stored;
				return createInitialFacetScoresMap();
			}),
	}),
);
