/**
 * Session Error Types
 *
 * Tagged errors for session management using Effect-ts pattern
 */

import { Data } from "effect"

/**
 * Error thrown when a session is not found by ID
 */
export class SessionNotFoundError extends Data.TaggedError("SessionNotFoundError")<{
  readonly sessionId: string
}> {}

/**
 * Error thrown when a session is in an invalid state for the requested operation
 * Example: Trying to send a message to a "completed" session
 */
export class InvalidSessionStateError extends Data.TaggedError("InvalidSessionStateError")<{
  readonly sessionId: string
  readonly currentStatus: string
}> {}

/**
 * Union type of all session-related errors
 */
export type SessionError = SessionNotFoundError | InvalidSessionStateError
