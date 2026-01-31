/**
 * Domain Package - Core business types and errors
 */

// Session types
export type {
  PrecisionScores,
  SessionStatus,
  MessageRole,
  Session,
  Message,
  SessionData,
} from "./types/session.js"

// Session errors
export { SessionNotFoundError, InvalidSessionStateError } from "./errors/session.js"
export type { SessionError } from "./errors/session.js"
