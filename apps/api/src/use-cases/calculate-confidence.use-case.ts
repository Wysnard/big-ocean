/**
 * Calculate Confidence Use Case
 *
 * Calculates overall assessment confidence from facet confidence scores.
 * Confidence = mean of all facet confidences (0-100 integers).
 *
 * Formula: sum of facet confidences / facet count
 *
 * This provides a single metric representing how confident the system
 * is in the overall personality assessment.
 */

import { type FacetScoresMap, LoggerRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface CalculateConfidenceInput {
	readonly facetScores: FacetScoresMap;
}

export interface CalculateConfidenceOutput {
	/** Overall confidence percentage (0-100) */
	readonly confidence: number;
	/** Number of facets used in calculation */
	readonly facetCount: number;
}

/**
 * Calculate Confidence from Facet Scores
 *
 * Computes overall confidence as the mean of all facet confidences.
 * Confidence values are 0-100 integers.
 *
 * Dependencies: LoggerRepository
 * Returns: Confidence percentage and facet count
 *
 * @example
 * ```typescript
 * const result = yield* calculateConfidenceFromFacets({
 *   facetScores: {
 *     imagination: { score: 16, confidence: 85 },
 *     altruism: { score: 18, confidence: 90 }
 *   }
 * })
 * console.log(result.confidence) // 87.5
 * console.log(result.facetCount) // 2
 * ```
 */
export const calculateConfidenceFromFacets = (
	input: CalculateConfidenceInput,
): Effect.Effect<CalculateConfidenceOutput, never, LoggerRepository> =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		const facetEntries = Object.entries(input.facetScores);
		const facetCount = facetEntries.length;

		// Handle empty facet scores
		if (facetCount === 0) {
			logger.debug("No facets available for confidence calculation");
			return { confidence: 0, facetCount: 0 };
		}

		// Sum all confidence values (already 0-100 integers)
		const confidenceSum = facetEntries.reduce((sum, [_, score]) => sum + score.confidence, 0);

		// Calculate mean confidence (already in 0-100 range)
		const confidence = Math.round((confidenceSum / facetCount) * 100) / 100; // Round to 2 decimal places

		logger.info("Confidence calculated", {
			facetCount,
			confidenceSum,
			confidence,
		});

		return {
			confidence,
			facetCount,
		};
	});
