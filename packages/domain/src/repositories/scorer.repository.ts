import type { DatabaseError } from "@workspace/domain";
import { Context, type Effect } from "effect";
import type { FacetScoresMap, TraitScoresMap } from "../types/facet-evidence";

/**
 * Domain errors for Scorer operations
 */

/**
 * Insufficient evidence error (422)
 * Not enough data to compute reliable scores
 */
export class InsufficientEvidenceError extends Error {
	readonly _tag = "InsufficientEvidenceError";
	constructor(
		public readonly sessionId: string,
		public readonly facetName: string,
		public readonly sampleSize: number,
		public readonly message: string,
	) {
		super(message);
		this.name = "InsufficientEvidenceError";
	}
}

/**
 * Scorer error (500)
 * Generic error for score aggregation failures
 */
export class ScorerError extends Error {
	readonly _tag = "ScorerError";
	constructor(
		public readonly sessionId: string,
		public readonly message: string,
		public readonly cause?: string,
	) {
		super(message);
		this.name = "ScorerError";
	}
}

/**
 * Scorer Repository Service Tag
 *
 * Service interface for aggregating facet evidence into scores and deriving trait scores.
 * Follows hexagonal architecture pattern - this is the port (interface) that adapters implement.
 *
 * Implementation approaches:
 * - Production: ScorerDrizzleRepositoryLive (uses Drizzle for database queries)
 * - Testing: createTestScorerRepository() (returns mock scores for deterministic tests)
 *
 * Aggregation Strategy:
 * - Weighted averaging: confidence × recency (recent messages weighted higher)
 * - Contradiction detection via variance analysis
 * - Confidence adjustment: -0.3 for high variance, +0.2 for large sample
 *
 * @see packages/infrastructure/src/repositories/scorer.drizzle.repository.ts
 */
export class ScorerRepository extends Context.Tag("ScorerRepository")<
	ScorerRepository,
	{
		/**
		 * Aggregate facet evidence into facet scores
		 *
		 * Groups all evidence by facet name and computes weighted average scores.
		 * Uses recency weighting (recent = higher weight) and variance analysis.
		 *
		 * Algorithm:
		 * 1. Group evidence by facetName
		 * 2. For each facet, calculate weighted average:
		 *    - Weight = confidence × (1 + position × 0.1)
		 *    - Recent messages get 10% boost per position
		 * 3. Detect contradictions via variance
		 *    - High variance (>15) → -0.3 confidence penalty
		 * 4. Sample size bonus:
		 *    - Large sample (>10) → +0.2 confidence bonus
		 *
		 * @param sessionId - Session identifier to aggregate evidence for
		 * @returns Effect with map of facet scores (Record<FacetName, FacetScore>)
		 * @throws DatabaseError - Database query failure
		 * @throws ScorerError - Aggregation computation failure
		 *
		 * @example
		 * ```typescript
		 * const scorer = yield* ScorerRepository;
		 * const facetScores = yield* scorer.aggregateFacetScores("session_123");
		 * // Returns: { imagination: { score: 16, confidence: 0.85, ... }, ... }
		 * ```
		 */
		readonly aggregateFacetScores: (
			sessionId: string,
		) => Effect.Effect<FacetScoresMap, DatabaseError | ScorerError, never>;

		/**
		 * Derive trait scores from aggregated facet scores
		 *
		 * Computes trait scores by averaging the 6 facets for each trait.
		 * Trait confidence is the minimum confidence across its 6 facets (conservative).
		 *
		 * Algorithm:
		 * 1. For each of 5 traits, get its 6 related facets using TRAIT_TO_FACETS
		 * 2. Trait score = mean of 6 facet scores
		 * 3. Trait confidence = min confidence across 6 facets
		 *
		 * Example:
		 * - Openness = mean(imagination, artistic_interests, emotionality, adventurousness, intellect, liberalism)
		 * - Openness confidence = min(confidence of those 6 facets)
		 *
		 * @param facetScores - Map of facet scores from aggregateFacetScores()
		 * @returns Effect with map of trait scores (Record<TraitName, TraitScore>)
		 * @throws ScorerError - Trait derivation computation failure
		 *
		 * @example
		 * ```typescript
		 * const scorer = yield* ScorerRepository;
		 * const facetScores = yield* scorer.aggregateFacetScores("session_123");
		 * const traitScores = yield* scorer.deriveTraitScores(facetScores);
		 * // Returns: { openness: { score: 15.2, confidence: 0.8, ... }, ... }
		 * ```
		 */
		readonly deriveTraitScores: (
			facetScores: FacetScoresMap,
		) => Effect.Effect<TraitScoresMap, ScorerError, never>;
	}
>() {}
