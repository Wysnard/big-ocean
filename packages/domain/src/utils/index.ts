/**
 * Domain Utilities
 *
 * Pure utility functions for domain calculations and map initialization.
 */

export { extract4LetterCode, lookupArchetype } from "./archetype-lookup";
export { mapEnergyBand, mapTellingBand } from "./band-mapping";
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
export { deriveCapabilities } from "./derive-capabilities";
export { deriveTraitSummary } from "./derive-trait-summary";
export { toFacetDisplayName } from "./display-name";
export { getFacetLevel } from "./facet-level";
export { buildChatSystemPrompt, type ChatSystemPromptParams } from "./nerin-system-prompt";
export { generateOceanCode } from "./ocean-code-generator";
export {
	getFacetColor,
	getTraitAccentColor,
	getTraitColor,
	getTraitGradient,
} from "./trait-colors";
export { getTribeGroup, type TribeGroup } from "./tribe-group";
