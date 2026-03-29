/**
 * Steering Utilities
 *
 * Pure functions for conversation steering computations.
 */
// Pacing Territory Scorer (Story 25-2)

// E_target Pacing Formula (Story 25-1)
export {
	computeETarget as computeETargetV2,
	type ETargetInput,
	type ETargetOutput,
	PACING_CONFIG,
	type PacingConfig,
} from "./e-target";
// Move Governor (Story 26-3)
export {
	computeEntryPressure,
	computeGovernorOutput,
	deriveIntent,
	ENTRY_PRESSURE_LARGE_GAP,
	ENTRY_PRESSURE_MODERATE_GAP,
	type MoveGovernorInput,
	type MoveGovernorResult,
} from "./move-governor";
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
// Observation Gating & Competition (Story 26-2)
export {
	evaluateObservationGating,
	OBSERVATION_GATING_CONSTANTS,
	type ObservationGatingInput,
	type ObservationGatingMode,
	type ObservationGatingResult,
} from "./observation-gating";
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
// Prompt Builder (Story 27-2, rewritten Story 28-4)
export {
	buildPortraitPrompt,
	buildPrompt,
	buildSurfacingPrompt,
	type PromptBuilderOutput,
} from "./prompt-builder";
// Territory Prompt Builder (Story 21-5, evolved Story 23-2)
export {
	buildTerritoryPrompt,
	buildTerritorySystemPromptSection,
	deriveEnergyGuidanceLevel,
	type EnergyGuidanceLevel,
	type TerritoryPromptContent,
} from "./territory-prompt-builder";
// Territory Selector (Story 25-3)
export {
	COLD_START_PERIMETER,
	deriveSessionPhase,
	deriveTransitionType,
	type SelectorSessionPhase,
	type SelectorTransitionType,
	selectTerritoryV2,
} from "./territory-selector";
