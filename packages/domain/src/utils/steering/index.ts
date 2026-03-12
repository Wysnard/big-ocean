/**
 * Steering Utilities
 *
 * Pure functions for conversation steering computations.
 */
// Cold-Start (Story 21-4)
export { selectColdStartTerritory, selectTerritoryWithColdStart } from "./cold-start";
// DRS (Story 21-2)
export {
	computeBreadth,
	computeDRS,
	computeEnergyFit,
	computeEnergyMultiplier,
	computeEngagement,
	type DRSConfig,
	type DRSInput,
	extractDRSConfig,
} from "./drs";
// Pacing Territory Scorer (Story 25-2)
export {
	computeAdjacency,
	computeConversationSkew,
	computeCoverageGainV2,
	computeEnergyMalus,
	computeFacetPriority,
	computeFreshnessPenaltyV2,
	PACING_SCORER_DEFAULTS,
	type PacingScorerConfig,
	type PacingVisitHistory,
	type ScoreAllTerritoriesV2Input,
	scoreAllTerritoriesV2,
} from "./pacing-territory-scorer";
// Territory Prompt Builder (Story 21-5, evolved Story 23-2)
export {
	buildTerritoryPrompt,
	buildTerritorySystemPromptSection,
	deriveEnergyGuidanceLevel,
	type EnergyGuidanceLevel,
	type TerritoryPromptContent,
} from "./territory-prompt-builder";
// E_target Pacing Formula (Story 25-1)
export {
	computeETarget as computeETargetV2,
	PACING_CONFIG,
	type ETargetInput,
	type ETargetOutput,
	type PacingConfig,
} from "./e-target";
// Territory Scoring (Story 21-3)
export {
	buildFacetEvidenceCounts,
	computeCoverageValue,
	computeFreshnessBonus,
	extractTerritoryScorerConfig,
	type ScoredTerritory,
	scoreAllTerritories,
	scoreTerritory,
	selectTerritory,
	type TerritoryScorerConfig,
	type TerritoryVisitHistory,
} from "./territory-scorer";
// Observation Focus Strength (Story 26-1)
export {
	computeContradictionStrength,
	computeConvergenceStrength,
	computeNoticingStrength,
	computePerDomainConfidence,
	computeRelateStrength,
	computeSmoothedClarity,
	OBSERVATION_FOCUS_CONSTANTS,
} from "./observation-focus";
