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

// Convenience re-exports of contract errors
export {
  SessionNotFound,
  DatabaseError,
} from "@workspace/contracts/errors";
