/**
 * Domain Package - Core business types and errors
 */

// Session types
export type {
  SessionStatus,
  MessageRole,
  Session,
} from "./types/session.js";

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

// Precision calculation service
export {
  calculateTraitPrecision,
  calculateWeightedAverage,
  initializeFacetPrecision,
  updateFacetPrecision,
  mergePrecisionScores,
} from "./services/precision-calculator.service.js";

// Repository interfaces (ports in hexagonal architecture)
export {
  AssessmentSessionRepository,
} from "./repositories/assessment-session.repository.js";
export {
  AssessmentMessageRepository,
} from "./repositories/assessment-message.repository.js";
export {
  LoggerRepository,
} from "./repositories/logger.repository.js";
export {
  NerinAgentRepository,
} from "./repositories/nerin-agent.repository.js";

// Convenience re-exports of contract errors
export {
  SessionNotFound,
  DatabaseError,
} from "@workspace/contracts";
