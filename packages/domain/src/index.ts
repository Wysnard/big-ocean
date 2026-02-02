/**
 * Domain Package - Core business types and errors
 */

// Configuration service interface (implementation in @workspace/infrastructure)
export { AppConfig, type AppConfigService } from "./config/index.js";

// Session types
export type { SessionStatus, MessageRole, Session } from "./types/session.js";

// Trait types (Big Five)
export type { BigFiveTrait, TraitPrecisionScores } from "./types/trait.js";
export { BIG_FIVE_TRAITS } from "./types/trait.js";

// Facet types
export type {
  OpennessFacet,
  ConscientiousnessFacet,
  ExtravertFacet,
  AgreeableFacet,
  NeuroticismFacet,
  BigFiveFacet,
  FacetPrecisionScores,
} from "./types/facet.js";
export { FACETS_BY_TRAIT } from "./types/facet.js";

// Big Five constants and types (Story 2.3)
export {
	ALL_FACETS,
	OPENNESS_FACETS,
	CONSCIENTIOUSNESS_FACETS,
	EXTRAVERSION_FACETS,
	AGREEABLENESS_FACETS,
	NEUROTICISM_FACETS,
	FACET_TO_TRAIT,
	TRAIT_TO_FACETS,
	isFacetName,
	isTraitName,
	type FacetName,
	type TraitName,
} from "./constants/big-five.js";

// Facet evidence and scoring types (Story 2.3)
export type {
	FacetEvidence,
	FacetScore,
	TraitScore,
	HighlightRange,
	FacetScoresMap,
	TraitScoresMap,
} from "./types/facet-evidence.js";

// Precision calculation service
export {
  calculateTraitPrecision,
  calculateWeightedAverage,
  initializeFacetPrecision,
  updateFacetPrecision,
  mergePrecisionScores,
} from "./services/precision-calculator.service.js";

// Cost calculation service
export {
  calculateCost,
  PRICING,
  type CostResult,
} from "./services/cost-calculator.service.js";

// Repository interfaces (ports in hexagonal architecture)
export { AssessmentSessionRepository } from "./repositories/assessment-session.repository.js";
export { AssessmentMessageRepository } from "./repositories/assessment-message.repository.js";
export { LoggerRepository } from "./repositories/logger.repository.js";
export { NerinAgentRepository } from "./repositories/nerin-agent.repository.js";
export {
  RedisRepository,
  RedisConnectionError,
  RedisOperationError,
} from "./repositories/redis.repository.js";
export { CostGuardRepository } from "./repositories/cost-guard.repository.js";
export { AnalyzerRepository } from "./repositories/analyzer.repository.js";
export {
  ScorerRepository,
  InsufficientEvidenceError,
  ScorerError,
} from "./repositories/scorer.repository.js";
export {
  FacetEvidenceRepository,
  type SavedFacetEvidence,
} from "./repositories/facet-evidence.repository.js";

// Evidence errors
export {
  FacetEvidencePersistenceError,
  EvidenceValidationError,
} from "./errors/evidence.errors.js";

// Convenience re-exports of contract errors
export {
  SessionNotFound,
  DatabaseError,
  AnalyzerError,
  InvalidFacetNameError,
  MalformedEvidenceError,
} from "@workspace/contracts";
