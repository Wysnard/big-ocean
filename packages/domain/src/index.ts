/**
 * Domain Package - Core business types and errors
 */

// Convenience re-exports of contract errors
export {
	AnalyzerError,
	DatabaseError,
	InvalidFacetNameError,
	MalformedEvidenceError,
	SessionNotFound,
} from "@workspace/contracts";
// Configuration service interface (implementation in @workspace/infrastructure)
export { AppConfig, type AppConfigService } from "./config/index";
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
// Evidence errors
export {
	EvidenceValidationError,
	FacetEvidencePersistenceError,
} from "./errors/evidence.errors";
export { AnalyzerRepository } from "./repositories/analyzer.repository";
export { AssessmentMessageRepository } from "./repositories/assessment-message.repository";
// Repository interfaces (ports in hexagonal architecture)
export { AssessmentSessionRepository } from "./repositories/assessment-session.repository";
export { CostGuardRepository } from "./repositories/cost-guard.repository";
export { FacetEvidenceRepository } from "./repositories/facet-evidence.repository";
export { LoggerRepository } from "./repositories/logger.repository";
export { NerinAgentRepository } from "./repositories/nerin-agent.repository";
export {
	RedisConnectionError,
	RedisOperationError,
	RedisRepository,
} from "./repositories/redis.repository";
export {
	InsufficientEvidenceError,
	ScorerError,
	ScorerRepository,
} from "./repositories/scorer.repository";
// Cost calculation service
export {
	type CostResult,
	calculateCost,
	PRICING,
} from "./services/cost-calculator.service";
// Precision calculation service
export {
	calculateTraitPrecision,
	calculateWeightedAverage,
	initializeFacetPrecision,
	mergePrecisionScores,
	updateFacetPrecision,
} from "./services/precision-calculator.service";
// Facet types
export type {
	AgreeableFacet,
	BigFiveFacet,
	ConscientiousnessFacet,
	ExtravertFacet,
	FacetPrecisionScores,
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
export type { BigFiveTrait, TraitPrecisionScores } from "./types/trait";
export { BIG_FIVE_TRAITS } from "./types/trait";
