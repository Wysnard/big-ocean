/**
 * Mock: scorer.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/scorer.drizzle.repository')
 */
import {
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	ScorerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

export const ScorerDrizzleRepositoryLive = Layer.succeed(
	ScorerRepository,
	ScorerRepository.of({
		aggregateFacetScores: () => Effect.succeed(createInitialFacetScoresMap()),

		deriveTraitScores: () => Effect.succeed(createInitialTraitScoresMap()),
	}),
);
