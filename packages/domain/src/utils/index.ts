/**
 * Domain Utilities
 *
 * Pure utility functions for domain calculations and map initialization.
 */

export { extract4LetterCode, lookupArchetype } from "./archetype-lookup";
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
export { deriveTraitSummary } from "./derive-trait-summary";
export { generateOceanCode } from "./ocean-code-generator";
export { aggregateFacetScores, deriveTraitScores } from "./scoring";
export { getFacetColor, getTraitColor, getTraitGradient } from "./trait-colors";
