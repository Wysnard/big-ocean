/**
 * Domain Utilities
 *
 * Pure utility functions for domain calculations and map initialization.
 */

export {
	calculateConfidenceFromFacetScores,
	calculateOverallConfidence,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	DEFAULT_FACET_CONFIDENCE,
	DEFAULT_FACET_SCORE,
	DEFAULT_TRAIT_SCORE,
	type TraitConfidence,
} from "./confidence";
export { generateOceanCode } from "./ocean-code-generator";
