/**
 * Mock: trait-score.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/trait-score.drizzle.repository')
 */
import {
	createInitialTraitScoresMap,
	type TraitName,
	TraitScoreRepository,
	type TraitScoresMap,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, TraitScoresMap>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => store.clear();

/** Seed trait scores for a session in the mock store */
export const _seedTraitScores = (
	sessionId: string,
	scores: Partial<Record<TraitName, { score: number; confidence: number }>>,
) => {
	store.set(sessionId, createInitialTraitScoresMap(scores));
};

export const TraitScoreDrizzleRepositoryLive = Layer.succeed(
	TraitScoreRepository,
	TraitScoreRepository.of({
		getBySession: (sessionId: string) =>
			Effect.sync(() => {
				const stored = store.get(sessionId);
				if (stored) return stored;
				return createInitialTraitScoresMap();
			}),
	}),
);
