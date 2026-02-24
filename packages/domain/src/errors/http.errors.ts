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
export class SessionNotFound extends S.TaggedError<SessionNotFound>()("SessionNotFound", {
	sessionId: S.String,
	message: S.String,
}) {}

export class SessionExpired extends S.TaggedError<SessionExpired>()("SessionExpired", {
	sessionId: S.String,
	expiredAt: S.DateTimeUtc,
	message: S.String,
}) {}

/**
 * Database error (500)
 * Generic error for database operations that don't expose internal details
 */
export class DatabaseError extends S.TaggedError<DatabaseError>()("DatabaseError", {
	message: S.String,
}) {}

/**
 * Rate limit error (429)
 */
export class RateLimitExceeded extends S.TaggedError<RateLimitExceeded>()("RateLimitExceeded", {
	userId: S.String,
	resetAt: S.DateTimeUtc,
	message: S.String,
}) {}

/**
 * Assessment already exists error (409)
 * User already has an assessment and cannot create another one
 */
export class AssessmentAlreadyExists extends S.TaggedError<AssessmentAlreadyExists>()(
	"AssessmentAlreadyExists",
	{
		userId: S.String,
		existingSessionId: S.String,
		message: S.String,
	},
) {}

/**
 * Cost limit error (503)
 */
export class CostLimitExceeded extends S.TaggedError<CostLimitExceeded>()("CostLimitExceeded", {
	dailySpend: S.Number,
	limit: S.Number,
	resumeAfter: S.DateTimeUtc,
	message: S.String,
}) {}

/**
 * Message rate limit error (429)
 * Per-user message rate limit exceeded (2 messages/minute)
 */
export class MessageRateLimitError extends S.TaggedError<MessageRateLimitError>()(
	"MessageRateLimitError",
	{
		retryAfter: S.Number,
		message: S.String,
	},
) {}

/**
 * Profile not found error (404)
 */
export class ProfileNotFound extends S.TaggedError<ProfileNotFound>()("ProfileNotFound", {
	publicProfileId: S.String,
	message: S.String,
}) {}

/**
 * General profile error (500)
 */
export class ProfileError extends S.TaggedError<ProfileError>()("ProfileError", {
	message: S.String,
}) {}

/**
 * Profile private error (403)
 */
export class ProfilePrivate extends S.TaggedError<ProfilePrivate>()("ProfilePrivate", {
	publicProfileId: S.String,
	message: S.String,
}) {}

/**
 * Auth-related errors
 */

/**
 * Invalid credentials error (401)
 */
export class InvalidCredentials extends S.TaggedError<InvalidCredentials>()("InvalidCredentials", {
	message: S.String,
}) {}

/**
 * User already exists error (409)
 */
export class UserAlreadyExists extends S.TaggedError<UserAlreadyExists>()("UserAlreadyExists", {
	email: S.String,
	message: S.String,
}) {}

/**
 * Unauthorized error (401)
 */
export class Unauthorized extends S.TaggedError<Unauthorized>()("Unauthorized", {
	message: S.String,
}) {}

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
	},
) {}

/**
 * Analyzer error (500)
 * Generic error for personality facet analysis operations
 */
export class AnalyzerError extends S.TaggedError<AnalyzerError>()("AnalyzerError", {
	assessmentMessageId: S.String,
	message: S.String,
	cause: S.optional(S.String),
}) {}

/**
 * Invalid facet name error (422)
 * Validation failure for facet name not in the 30 Big Five facets
 */
export class InvalidFacetNameError extends S.TaggedError<InvalidFacetNameError>()(
	"InvalidFacetNameError",
	{
		facetName: S.String,
		validFacets: S.Array(S.String),
		message: S.String,
	},
) {}

/**
 * Free tier limit reached error (403)
 * User has sent the maximum number of messages allowed in the free tier
 */
export class FreeTierLimitReached extends S.TaggedError<FreeTierLimitReached>()(
	"FreeTierLimitReached",
	{
		sessionId: S.String,
		limit: S.Number,
		message: S.String,
	},
) {}

/**
 * Session completed error (409)
 * Attempt to send a message to a session that is finalizing or completed
 */
export class SessionCompletedError extends S.TaggedError<SessionCompletedError>()(
	"SessionCompletedError",
	{
		sessionId: S.String,
		status: S.String,
		message: S.String,
	},
) {}

/**
 * Nerin error (503)
 * LLM call failure when invoking the Nerin agent
 */
export class NerinError extends S.TaggedError<NerinError>()("NerinError", {
	sessionId: S.String,
	message: S.String,
}) {}

/**
 * Conversation evidence error (500)
 * Database operation failure when reading/writing conversation evidence
 */
export class ConversationEvidenceError extends S.TaggedError<ConversationEvidenceError>()(
	"ConversationEvidenceError",
	{ message: S.String },
) {}

/**
 * Concurrent message error (409)
 * Another message is already being processed for this session
 */
export class ConcurrentMessageError extends S.TaggedError<ConcurrentMessageError>()(
	"ConcurrentMessageError",
	{
		sessionId: S.String,
		message: S.String,
	},
) {}

/**
 * Finalization in progress error (409)
 * Assessment finalization is already running for this session
 */
export class FinalizationInProgressError extends S.TaggedError<FinalizationInProgressError>()(
	"FinalizationInProgressError",
	{
		sessionId: S.String,
		message: S.String,
	},
) {}

/**
 * Session not finalizing error (409)
 * generate-results called on a session not in "finalizing" or "completed" status
 */
export class SessionNotFinalizing extends S.TaggedError<SessionNotFinalizing>()(
	"SessionNotFinalizing",
	{
		sessionId: S.String,
		currentStatus: S.String,
		message: S.String,
	},
) {}

/**
 * Session not completed error (409)
 * get-results called on a session that hasn't completed finalization
 */
export class SessionNotCompleted extends S.TaggedError<SessionNotCompleted>()(
	"SessionNotCompleted",
	{
		sessionId: S.String,
		currentStatus: S.String,
		message: S.String,
	},
) {}

/**
 * Malformed evidence error (422)
 * JSON parsing or structure validation failure for analyzer output
 */
export class MalformedEvidenceError extends S.TaggedError<MalformedEvidenceError>()(
	"MalformedEvidenceError",
	{
		assessmentMessageId: S.String,
		rawOutput: S.String,
		parseError: S.String,
		message: S.String,
	},
) {}

/**
 * Duplicate checkout error (409)
 * Webhook delivered a polar_checkout_id that already exists in purchase_events
 */
export class DuplicateCheckoutError extends S.TaggedError<DuplicateCheckoutError>()(
	"DuplicateCheckoutError",
	{
		polarCheckoutId: S.String,
		message: S.String,
	},
) {}

/**
 * Unknown product error (422)
 * Polar webhook received a product ID that doesn't match any configured product
 */
export class UnknownProductError extends S.TaggedError<UnknownProductError>()(
	"UnknownProductError",
	{
		productId: S.String,
		message: S.String,
	},
) {}

/**
 * Webhook verification error (400)
 * HMAC signature verification failed for incoming webhook payload
 */
export class WebhookVerificationError extends S.TaggedError<WebhookVerificationError>()(
	"WebhookVerificationError",
	{
		message: S.String,
	},
) {}
