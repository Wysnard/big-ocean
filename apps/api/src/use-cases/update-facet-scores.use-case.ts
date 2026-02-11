/**
 * Update Facet Scores Use Case
 *
 * Business logic for computing facet and trait scores from evidence.
 * Triggered every 3 messages (batch processing).
 * Compute-only: fetches evidence, aggregates scores in-memory, returns results.
 *
 * @see packages/domain/src/utils/scoring.ts
 */

import {
	aggregateFacetScores,
	deriveTraitScores,
	type FacetEvidencePersistenceError,
	FacetEvidenceRepository,
	type FacetScoresMap,
	LoggerRepository,
	type TraitScoresMap,
} from "@workspace/domain";
import { Effect } from "effect";

export interface UpdateFacetScoresInput {
	readonly sessionId: string;
}

export interface UpdateFacetScoresOutput {
	readonly facetScores: FacetScoresMap;
	readonly traitScores: TraitScoresMap;
	readonly updatedAt: Date;
}

/**
 * Determines if scoring should be triggered based on message count.
 *
 * Scoring is triggered every 3 messages to batch process evidence
 * and reduce computation overhead.
 *
 * @param messageCount - Current message count in the session
 * @returns true if scoring should be triggered
 *
 * @example
 * ```typescript
 * shouldTriggerScoring(3)  // true (3rd message)
 * shouldTriggerScoring(4)  // false
 * shouldTriggerScoring(6)  // true (6th message)
 * ```
 */
export const shouldTriggerScoring = (messageCount: number): boolean => {
	return messageCount > 0 && messageCount % 3 === 0;
};

/**
 * Update Facet Scores Use Case
 *
 * Fetches evidence from the database and computes scores on-demand
 * using pure domain functions. No score tables are written.
 *
 * Dependencies: FacetEvidenceRepository, LoggerRepository
 * Returns: Aggregated facet scores and derived trait scores
 *
 * @example
 * ```typescript
 * const result = yield* updateFacetScores({
 *   sessionId: "session_123"
 * })
 * console.log(result.facetScores.imagination) // { score: 16.5, confidence: 85 }
 * console.log(result.traitScores.openness)    // { score: 90.5, confidence: 72 }
 * ```
 */
export const updateFacetScores = (
	input: UpdateFacetScoresInput,
): Effect.Effect<
	UpdateFacetScoresOutput,
	FacetEvidencePersistenceError,
	FacetEvidenceRepository | LoggerRepository
> =>
	Effect.gen(function* () {
		const evidenceRepo = yield* FacetEvidenceRepository;
		const logger = yield* LoggerRepository;

		logger.info("Computing facet scores from evidence", {
			sessionId: input.sessionId,
		});

		// Fetch all evidence for this session
		const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);

		// Aggregate facet scores from evidence (pure function)
		const facetScores = aggregateFacetScores(evidence);

		const facetCount = Object.keys(facetScores).length;
		logger.info("Facet scores computed", {
			sessionId: input.sessionId,
			facetCount,
			evidenceCount: evidence.length,
		});

		// Derive trait scores from facet scores (pure function)
		const traitScores = deriveTraitScores(facetScores);

		const traitCount = Object.keys(traitScores).length;
		logger.info("Trait scores derived", {
			sessionId: input.sessionId,
			traitCount,
		});

		const updatedAt = new Date();

		logger.info("Facet scores computation complete", {
			sessionId: input.sessionId,
			facetCount,
			traitCount,
			updatedAt: updatedAt.toISOString(),
		});

		return {
			facetScores,
			traitScores,
			updatedAt,
		};
	});
