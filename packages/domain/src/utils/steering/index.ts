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
// Territory Prompt Builder (Story 21-5, evolved Story 23-2)
export {
	buildTerritoryPrompt,
	buildTerritorySystemPromptSection,
	deriveEnergyGuidanceLevel,
	type EnergyGuidanceLevel,
	type TerritoryPromptContent,
} from "./territory-prompt-builder";
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
