/**
 * Tagged Error Schemas for Effect-ts RPC
 *
 * These schemas define type-safe error types that can be discriminated
 * by their `_tag` field, enabling precise error handling in both backend
 * and frontend code.
 */

import { Schema as S } from "effect";

/**
 * Session-related errors (404, 410)
 */
export const SessionNotFoundError = S.Struct({
  _tag: S.Literal("SessionNotFound"),
  sessionId: S.String,
  message: S.String,
});

export const SessionExpiredError = S.Struct({
  _tag: S.Literal("SessionExpired"),
  sessionId: S.String,
  expiredAt: S.Date,
  message: S.String,
});

export const SessionError = S.Union(SessionNotFoundError, SessionExpiredError);

/**
 * Rate limit error (429)
 */
export const RateLimitError = S.Struct({
  _tag: S.Literal("RateLimitExceeded"),
  userId: S.String,
  resetAt: S.Date, // When limit resets
  message: S.String,
});

/**
 * Cost limit error (503)
 */
export const CostLimitError = S.Struct({
  _tag: S.Literal("CostLimitExceeded"),
  dailySpend: S.Number,
  limit: S.Number,
  message: S.String,
});

/**
 * Profile not found error (404)
 */
export const ProfileNotFoundError = S.Struct({
  _tag: S.Literal("ProfileNotFound"),
  publicProfileId: S.String,
  message: S.String,
});

/**
 * General profile error (500)
 */
export const ProfileError = S.Struct({
  _tag: S.Literal("ProfileError"),
  message: S.String,
});

/**
 * Auth-related errors
 */

/**
 * Invalid credentials error (401)
 */
export const InvalidCredentialsError = S.Struct({
  _tag: S.Literal("InvalidCredentials"),
  message: S.String,
});

/**
 * User already exists error (409)
 */
export const UserAlreadyExistsError = S.Struct({
  _tag: S.Literal("UserAlreadyExists"),
  email: S.String,
  message: S.String,
});

/**
 * Unauthorized error (401)
 */
export const UnauthorizedError = S.Struct({
  _tag: S.Literal("Unauthorized"),
  message: S.String,
});

/**
 * Auth error union
 */
export const AuthError = S.Union(
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UnauthorizedError
);

// Type exports for TypeScript
export type SessionNotFoundError = S.Schema.Type<typeof SessionNotFoundError>;
export type SessionExpiredError = S.Schema.Type<typeof SessionExpiredError>;
export type SessionError = S.Schema.Type<typeof SessionError>;
export type RateLimitError = S.Schema.Type<typeof RateLimitError>;
export type CostLimitError = S.Schema.Type<typeof CostLimitError>;
export type ProfileNotFoundError = S.Schema.Type<typeof ProfileNotFoundError>;
export type ProfileError = S.Schema.Type<typeof ProfileError>;
export type InvalidCredentialsError = S.Schema.Type<typeof InvalidCredentialsError>;
export type UserAlreadyExistsError = S.Schema.Type<typeof UserAlreadyExistsError>;
export type UnauthorizedError = S.Schema.Type<typeof UnauthorizedError>;
export type AuthError = S.Schema.Type<typeof AuthError>;
