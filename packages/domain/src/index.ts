/**
 * Domain Package - Core business types and errors
 */

// Convenience re-exports of contract errors
export {
	AnalyzerError,
	DatabaseError,
	InvalidFacetNameError,
	MalformedEvidenceError,
	RateLimitExceeded,
	SessionNotFound,
} from "@workspace/contracts";
// Configuration service interface (implementation in @workspace/infrastructure)
export { AppConfig, type AppConfigService } from "./config/index";
// Archetype constants (Story 3.2)
export { CURATED_ARCHETYPES } from "./constants/archetypes";
// Big Five constants and types (Story 2.3)
export {
	AGREEABLENESS_FACETS,
	ALL_FACETS,
	CONSCIENTIOUSNESS_FACETS,
	EXTRAVERSION_FACETS,
	FACET_TO_TRAIT,
	type FacetName,
	isFacetName,
	isTraitName,
	NEUROTICISM_FACETS,
	OPENNESS_FACETS,
	TRAIT_TO_FACETS,
	type TraitName,
} from "./constants/big-five";
// Nerin greeting constants (Story 7.10)
export {
	GREETING_MESSAGES,
	OPENING_QUESTIONS,
	pickOpeningQuestion,
} from "./constants/nerin-greeting";
// Evidence errors
export {
	EvidenceValidationError,
	FacetEvidencePersistenceError,
} from "./errors/evidence.errors";
export { AnalyzerRepository } from "./repositories/analyzer.repository";
export { AssessmentMessageRepository } from "./repositories/assessment-message.repository";
// Repository interfaces (ports in hexagonal architecture)
export { AssessmentSessionRepository } from "./repositories/assessment-session.repository";
export { CheckpointerRepository } from "./repositories/checkpointer.repository";
export { CostGuardRepository } from "./repositories/cost-guard.repository";
export { FacetEvidenceRepository } from "./repositories/facet-evidence.repository";
export {
	type LoggerMethods,
	LoggerRepository,
} from "./repositories/logger.repository";
export {
	NerinAgentRepository,
	type NerinInvokeInput,
	type NerinInvokeOutput,
} from "./repositories/nerin-agent.repository";
export {
	BudgetPausedError,
	ConfidenceGapError,
	OrchestrationError,
	OrchestratorRepository,
	PrecisionGapError,
	type ProcessMessageInput,
	type ProcessMessageOutput,
} from "./repositories/orchestrator.repository";
export {
	type GraphInput,
	type GraphOutput,
	OrchestratorGraphRepository,
} from "./repositories/orchestrator-graph.repository";
export {
	type CreatePublicProfileInput,
	type PublicProfileData,
	PublicProfileRepository,
} from "./repositories/public-profile.repository";
export {
	RedisConnectionError,
	RedisOperationError,
	RedisRepository,
} from "./repositories/redis.repository";
// Agent response schemas for structured LLM output (Story 2.4, Task 13)
export {
	type AnalyzerResponse,
	AnalyzerResponseJsonSchema,
	AnalyzerResponseSchema,
	EmotionalTone,
	FacetExtractionSchema,
	HighlightRangeSchema,
	type NerinResponse,
	NerinResponseJsonSchema,
	NerinResponseSchema,
	validateAnalyzerResponse,
	validateNerinResponse,
} from "./schemas/agent-schemas";
// Confidence calculation service
export {
	calculateTraitConfidence,
	calculateWeightedAverage,
	initializeFacetConfidence,
	mergeConfidenceScores,
	updateFacetConfidence,
} from "./services/confidence-calculator.service";
// Cost calculation service
export {
	type CostResult,
	calculateCost,
	PRICING,
} from "./services/cost-calculator.service";
// Archetype types (Story 3.2)
export type {
	AgreeablenessLevel,
	Archetype,
	ConscientiousnessLevel,
	ExtraversionLevel,
	NeuroticismLevel,
	OceanCode4,
	OceanCode5,
	OpennessLevel,
	TraitLevel,
} from "./types/archetype";
export { TRAIT_LETTER_MAP, TRAIT_LEVEL_LABELS } from "./types/archetype";
// Facet types
export type {
	AgreeableFacet,
	BigFiveFacet,
	ConscientiousnessFacet,
	ExtravertFacet,
	FacetConfidenceScores,
	NeuroticismFacet,
	OpennessFacet,
} from "./types/facet";
export { FACETS_BY_TRAIT } from "./types/facet";
// Facet evidence and scoring types (Story 2.3)
export type {
	FacetEvidence,
	FacetScore,
	FacetScoresMap,
	HighlightRange,
	SavedFacetEvidence,
	TraitScore,
	TraitScoresMap,
} from "./types/facet-evidence";
// Session types
export type { MessageRole, Session, SessionStatus } from "./types/session";
// Trait types (Big Five)
export type { BigFiveTrait, TraitConfidenceScores } from "./types/trait";
export { BIG_FIVE_TRAITS } from "./types/trait";
// Date utilities for cost tracking and rate limiting
export { getNextDayMidnightUTC, getUTCDateKey } from "./utils/date.utils";
// Utility functions
export {
	aggregateFacetScores,
	calculateConfidenceFromFacetScores,
	calculateOverallConfidence,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	DEFAULT_FACET_CONFIDENCE,
	DEFAULT_FACET_SCORE,
	DEFAULT_TRAIT_SCORE,
	deriveTraitScores,
	deriveTraitSummary,
	extract4LetterCode,
	generateOceanCode,
	getFacetColor,
	getTraitColor,
	getTraitGradient,
	lookupArchetype,
	type TraitConfidence,
} from "./utils/index";
