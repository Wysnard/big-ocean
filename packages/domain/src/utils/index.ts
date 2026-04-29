/**
 * Domain Utilities
 *
 * Pure utility functions for domain calculations and map initialization.
 */

export { extract4LetterCode, lookupArchetype } from "./archetype-lookup";
export {
	type AssessmentResultsView,
	buildAssessmentResultsViewFromPersistedFacets,
} from "./assessment-results-view";
export {
	type AssessmentSurfaceProjection,
	buildFacetScoresMap,
	deriveAssessmentSurfaceFromFacetScores,
	type PersistedFacetScoresFragment,
	projectAssessmentSurfaceFromPersistedFacets,
} from "./assessment-surface-projection";
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
export {
	deriveCapabilities,
	getSubscribedSinceForCurrentSubscription,
	getSubscriptionStatus,
	hasPortraitForResult,
	isEntitledTo,
} from "./derive-capabilities";
export { deriveTraitSummary } from "./derive-trait-summary";
export { toFacetDisplayName } from "./display-name";
export { getFacetLevel } from "./facet-level";
export { type IsoWeekBounds, resolveIsoWeekBounds } from "./iso-week";
export { generateOceanCode } from "./ocean-code-generator";
export { buildPortraitPrompt } from "./portrait-prompt-builder";
export {
	getFacetColor,
	getTraitAccentColor,
	getTraitColor,
	getTraitGradient,
} from "./trait-colors";
export { getTribeGroup, type TribeGroup } from "./tribe-group";
