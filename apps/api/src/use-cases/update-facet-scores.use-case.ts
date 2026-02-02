/**
 * Update Facet Scores Use Case
 *
 * Business logic for aggregating facet evidence into scores and deriving trait scores.
 * Triggered every 3 messages (batch processing).
 *
 * Integration: ScorerRepository via dependency injection (hexagonal architecture).
 *
 * @see packages/domain/src/repositories/scorer.repository.ts
 */

import { Effect } from "effect";
import {
  ScorerRepository,
  LoggerRepository,
  DatabaseError,
  ScorerError,
  type FacetScoresMap,
  type TraitScoresMap,
} from "@workspace/domain";

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
 * Aggregates facet evidence into scores using weighted averaging
 * with recency bias and contradiction detection, then derives
 * trait scores from the aggregated facet scores.
 *
 * Dependencies: ScorerRepository, LoggerRepository
 * Returns: Aggregated facet scores and derived trait scores
 *
 * Algorithm (from Tree of Thoughts analysis):
 * 1. Group evidence by facetName
 * 2. Calculate weighted average: confidence × (1 + position × 0.1) for recency bias
 * 3. Detect contradictions via variance analysis
 * 4. Adjust confidence: -0.3 for high variance, +0.2 for large sample size
 * 5. Derive trait scores as mean of 6 related facets
 * 6. Set trait confidence as minimum confidence across facets
 *
 * @example
 * ```typescript
 * const result = yield* updateFacetScores({
 *   sessionId: "session_123"
 * })
 * console.log(result.facetScores.imagination) // { score: 16.5, confidence: 0.85 }
 * console.log(result.traitScores.openness)    // { score: 15.8, confidence: 0.78 }
 * ```
 */
export const updateFacetScores = (
  input: UpdateFacetScoresInput
): Effect.Effect<
  UpdateFacetScoresOutput,
  DatabaseError | ScorerError,
  ScorerRepository | LoggerRepository
> =>
  Effect.gen(function* () {
    const scorer = yield* ScorerRepository;
    const logger = yield* LoggerRepository;

    yield* logger.info("Updating facet scores", {
      sessionId: input.sessionId,
    });

    // Aggregate facet scores from evidence
    const facetScores = yield* scorer.aggregateFacetScores(input.sessionId);

    const facetCount = Object.keys(facetScores).length;
    yield* logger.info("Facet scores aggregated", {
      sessionId: input.sessionId,
      facetCount,
      facetNames: Object.keys(facetScores),
    });

    // Derive trait scores from facet scores
    const traitScores = yield* scorer.deriveTraitScores(facetScores);

    const traitCount = Object.keys(traitScores).length;
    yield* logger.info("Trait scores derived", {
      sessionId: input.sessionId,
      traitCount,
      traitNames: Object.keys(traitScores),
    });

    const updatedAt = new Date();

    yield* logger.info("Facet scores update complete", {
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
