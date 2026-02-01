/**
 * Domain Package - Core business types and errors
 */

// Session types
export type {
  PrecisionScores,
  SessionStatus,
  MessageRole,
  Session,
} from "./types/session.js";

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
