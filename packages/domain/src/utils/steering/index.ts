/**
 * Steering Utilities
 *
 * Pure functions for conversation steering computations.
 */
// Cold-Start (Story 21-4)
export { selectColdStartTerritory, selectTerritoryWithColdStart } from "./cold-start";
export { computeDomainStreak } from "./compute-domain-streak";
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
export {
	INTENT_TYPES,
	type IntentType,
	type MicroIntent,
	type RealizeMicroIntentInput,
	realizeMicroIntent,
} from "./realize-micro-intent";
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
