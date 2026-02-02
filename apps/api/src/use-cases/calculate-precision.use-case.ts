/**
 * Calculate Precision Use Case
 *
 * Calculates overall assessment precision from facet confidence scores.
 * Precision = mean of all facet confidences (0-100%).
 *
 * Formula: (sum of facet confidences / facet count) * 100
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
 * Computes overall precision as the mean of all facet confidences,
 * converted to a percentage (0-100%).
 *
 * Dependencies: LoggerRepository
 * Returns: Precision percentage and facet count
 *
 * @example
 * ```typescript
 * const result = yield* calculatePrecisionFromFacets({
 *   facetScores: {
 *     imagination: { score: 16, confidence: 0.85 },
 *     altruism: { score: 18, confidence: 0.9 }
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

		// Sum all confidence values
		const confidenceSum = facetEntries.reduce((sum, [_, score]) => sum + score.confidence, 0);

		// Calculate mean confidence and convert to percentage
		const meanConfidence = confidenceSum / facetCount;
		const precision = Math.round(meanConfidence * 10000) / 100; // Round to 2 decimal places

		logger.info("Precision calculated", {
			facetCount,
			confidenceSum: Math.round(confidenceSum * 100) / 100,
			precision,
		});

		return {
			precision,
			facetCount,
		};
	});
