/**
 * HTTP API Error Classes using Schema.TaggedError
 *
 * These error classes define type-safe, JSON-serializable errors for HTTP API contracts.
 * They integrate with Effect/Platform HttpApi via .addError() declarations.
 *
 * Pattern: Schema.TaggedError<T>()("TagName", { fields }) creates classes that:
 * - Automatically include a `_tag` discriminator
 * - Are JSON-serializable (unlike Data.TaggedError which may contain Error objects)
 * - Integrate with HttpApiEndpoint.addError() for automatic status code mapping
 * - Provide type-safe error handling in both backend and frontend
 */

import { Schema as S } from "effect";

/**
 * Session-related errors (404, 410)
 */
export class SessionNotFound extends S.TaggedError<SessionNotFound>()(
  "SessionNotFound",
  {
    sessionId: S.String,
    message: S.String,
  }
) {}

export class SessionExpired extends S.TaggedError<SessionExpired>()(
  "SessionExpired",
  {
    sessionId: S.String,
    expiredAt: S.DateTimeUtc,
    message: S.String,
  }
) {}

/**
 * Database error (500)
 * Generic error for database operations that don't expose internal details
 */
export class DatabaseError extends S.TaggedError<DatabaseError>()(
  "DatabaseError",
  {
    message: S.String,
  }
) {}

/**
 * Rate limit error (429)
 */
export class RateLimitExceeded extends S.TaggedError<RateLimitExceeded>()(
  "RateLimitExceeded",
  {
    userId: S.String,
    resetAt: S.DateTimeUtc,
    message: S.String,
  }
) {}

/**
 * Cost limit error (503)
 */
export class CostLimitExceeded extends S.TaggedError<CostLimitExceeded>()(
  "CostLimitExceeded",
  {
    dailySpend: S.Number,
    limit: S.Number,
    message: S.String,
  }
) {}

/**
 * Profile not found error (404)
 */
export class ProfileNotFound extends S.TaggedError<ProfileNotFound>()(
  "ProfileNotFound",
  {
    publicProfileId: S.String,
    message: S.String,
  }
) {}

/**
 * General profile error (500)
 */
export class ProfileError extends S.TaggedError<ProfileError>()(
  "ProfileError",
  {
    message: S.String,
  }
) {}

/**
 * Auth-related errors
 */

/**
 * Invalid credentials error (401)
 */
export class InvalidCredentials extends S.TaggedError<InvalidCredentials>()(
  "InvalidCredentials",
  {
    message: S.String,
  }
) {}

/**
 * User already exists error (409)
 */
export class UserAlreadyExists extends S.TaggedError<UserAlreadyExists>()(
  "UserAlreadyExists",
  {
    email: S.String,
    message: S.String,
  }
) {}

/**
 * Unauthorized error (401)
 */
export class Unauthorized extends S.TaggedError<Unauthorized>()(
  "Unauthorized",
  {
    message: S.String,
  }
) {}

/**
 * Agent invocation error (503)
 * Represents failure to generate a response from an AI agent (Nerin, Analyzer, etc.)
 */
export class AgentInvocationError extends S.TaggedError<AgentInvocationError>()(
  "AgentInvocationError",
  {
    agentName: S.String,
    sessionId: S.String,
    message: S.String,
  }
) {}
