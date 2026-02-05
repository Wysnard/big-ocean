/**
 * Calculate Precision Use Case
 *
 * Calculates overall assessment precision from facet confidence scores.
 * Precision = mean of all facet confidences (0-100 integers).
 *
 * Formula: sum of facet confidences / facet count
 *
 * This provides a single metric representing how confident the system
 * is in the overall personality assessment.
 */

import { type FacetScoresMap, LoggerRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface CalculatePrecisionInput {
	readonly facetScores: FacetScoresMap;
}

export interface CalculatePrecisionOutput {
	/** Overall precision percentage (0-100) */
	readonly precision: number;
	/** Number of facets used in calculation */
	readonly facetCount: number;
}

/**
 * Calculate Precision from Facet Scores
 *
 * Computes overall precision as the mean of all facet confidences.
 * Confidence values are 0-100 integers.
 *
 * Dependencies: LoggerRepository
 * Returns: Precision percentage and facet count
 *
 * @example
 * ```typescript
 * const result = yield* calculatePrecisionFromFacets({
 *   facetScores: {
 *     imagination: { score: 16, confidence: 85 },
 *     altruism: { score: 18, confidence: 90 }
 *   }
 * })
 * console.log(result.precision) // 87.5
 * console.log(result.facetCount) // 2
 * ```
 */
export const calculatePrecisionFromFacets = (
	input: CalculatePrecisionInput,
): Effect.Effect<CalculatePrecisionOutput, never, LoggerRepository> =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		const facetEntries = Object.entries(input.facetScores);
		const facetCount = facetEntries.length;

		// Handle empty facet scores
		if (facetCount === 0) {
			logger.debug("No facets available for precision calculation");
			return { precision: 0, facetCount: 0 };
		}

		// Sum all confidence values (already 0-100 integers)
		const confidenceSum = facetEntries.reduce((sum, [_, score]) => sum + score.confidence, 0);

		// Calculate mean confidence (already in 0-100 range)
		const precision = Math.round((confidenceSum / facetCount) * 100) / 100; // Round to 2 decimal places

		logger.info("Precision calculated", {
			facetCount,
			confidenceSum,
			precision,
		});

		return {
			precision,
			facetCount,
		};
	});
