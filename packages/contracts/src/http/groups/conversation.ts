/**
 * Conversation HTTP API Group
 *
 * Defines conversation endpoints for personality evaluation.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/groups/*.ts
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
	AssessmentResultError,
	FacetResultSchema,
	MessageContentSchema,
	TraitResultSchema,
	UserSummaryGenerationError,
} from "@workspace/domain";
import { Schema as S } from "effect";
import {
	AgentInvocationError,
	ConcurrentMessageError,
	ConversationAlreadyExists,
	ConversationEvidenceError,
	CostLimitExceeded,
	DatabaseError,
	GlobalAssessmentLimitReached,
	MessageRateLimitError,
	RateLimitExceeded,
	SessionCompletedError,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
	SubscriptionRequired,
	Unauthorized,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";
import { OceanCode4Schema, OceanCode5Schema } from "../../schemas/ocean-code";

/**
 * Start Conversation Request Schema
 */
export const StartConversationRequestSchema = S.Struct({});

/**
 * Start Conversation Response Schema
 *
 * Returns session metadata plus the 3 persisted Nerin greeting messages.
 */
export const StartConversationResponseSchema = S.Struct({
	sessionId: S.String,
	createdAt: S.DateTimeUtc,
	messages: S.Array(
		S.Struct({
			role: S.Literal("user", "assistant"),
			content: S.String,
			timestamp: S.DateTimeUtc,
		}),
	),
});

/**
 * Send Message Request Schema
 */
export const SendMessageRequestSchema = S.Struct({
	sessionId: S.String,
	message: MessageContentSchema,
});

/**
 * Send Message Response Schema
 *
 * Story 9.2: Simplified response — response + isFinalTurn only.
 * Farewell and portrait fields removed (obsolete with two-tier architecture).
 */
export const SendMessageResponseSchema = S.Struct({
	response: S.String,
	isFinalTurn: S.Boolean,
	surfacingMessage: S.optional(S.String),
});

/**
 * Get Results Request Path Parameter
 */
export const GetResultsPathSchema = S.Struct({
	sessionId: S.String,
});

// TraitResultSchema and FacetResultSchema imported from @workspace/domain

/**
 * Get Results Response Schema (AC-5)
 *
 * Full assessment results including archetype, traits, facets, and confidence.
 */
export const GetResultsResponseSchema = S.Struct({
	oceanCode5: OceanCode5Schema,
	oceanCode4: OceanCode4Schema,
	archetypeName: S.String,
	archetypeDescription: S.String,
	archetypeColor: S.String,
	isCurated: S.Boolean,
	traits: S.Array(TraitResultSchema),
	facets: S.Array(FacetResultSchema),
	overallConfidence: S.Number,
	messageCount: S.Number,
	publicProfileId: S.NullOr(S.String),
	shareableUrl: S.NullOr(S.String),
	isPublic: S.NullOr(S.Boolean),
	/** Whether this result is the user's latest version (Story 36-3) */
	isLatestVersion: S.Boolean,
});

/**
 * Resume Session Response Schema
 */
export const ResumeSessionResponseSchema = S.Struct({
	messages: S.Array(
		S.Struct({
			role: S.Literal("user", "assistant"),
			content: S.String,
			timestamp: S.DateTimeUtc,
		}),
	),
	confidence: S.Struct({
		openness: S.Number,
		conscientiousness: S.Number,
		extraversion: S.Number,
		agreeableness: S.Number,
		neuroticism: S.Number,
	}),
	assessmentTurnCount: S.Number,
	status: S.Literal("active", "paused", "finalizing", "completed"),
});

/**
 * Session Summary Schema (Story 7.13)
 *
 * Represents a single assessment session in the user's history.
 * messageCount is computed from assessment_message table (not stored on session).
 * oceanCode5/archetypeName are optional — populated via public_profile join for sessions that have one.
 */
export const SessionSummarySchema = S.Struct({
	id: S.String,
	createdAt: S.DateTimeUtc,
	updatedAt: S.DateTimeUtc,
	status: S.Literal("active", "paused", "finalizing", "completed", "archived"),
	messageCount: S.Number,
	oceanCode5: S.NullOr(S.String),
	archetypeName: S.NullOr(S.String),
});

/**
 * List Sessions Response Schema (Story 7.13)
 */
export const ListSessionsResponseSchema = S.Struct({
	sessions: S.Array(SessionSummarySchema),
	assessmentTurnCount: S.Number,
});

/**
 * Generate Results Response Schema (Story 11.1)
 */
export const GenerateResultsResponseSchema = S.Struct({
	status: S.Literal("analyzing", "generating_portrait", "completed"),
});

/**
 * Generate Results Path Schema (Story 11.1)
 */
export const GenerateResultsPathSchema = S.Struct({
	sessionId: S.String,
});

/**
 * Finalization Status Response Schema (Story 11.1)
 */
export const FinalizationStatusResponseSchema = S.Struct({
	status: S.Literal("analyzing", "generating_portrait", "completed"),
	progress: S.Number,
});

/**
 * Get Conversation Transcript Response Schema (Story 12.2)
 *
 * Returns all messages with IDs for evidence linking in the transcript panel.
 */
export const GetTranscriptResponseSchema = S.Struct({
	messages: S.Array(
		S.Struct({
			id: S.String,
			role: S.Literal("user", "assistant"),
			content: S.String,
			timestamp: S.DateTimeUtc,
		}),
	),
});

/**
 * Activate Extension Request Schema (Story 36-1)
 */
export const ActivateExtensionResponseSchema = S.Struct({
	sessionId: S.String,
	parentConversationId: S.String,
	createdAt: S.DateTimeUtc,
	messages: S.Array(
		S.Struct({
			role: S.Literal("user", "assistant"),
			content: S.String,
			timestamp: S.DateTimeUtc,
		}),
	),
});

/**
 * Conversation API Group
 *
 * Routes:
 * - POST /api/conversation/start - Start new conversation session
 * - POST /api/conversation/message - Send message to conversation agent
 * - GET /api/conversation/:sessionId/results - Get conversation results
 * - GET /api/conversation/:sessionId/resume - Resume existing session
 * - GET /api/conversation/:sessionId/transcript - Get conversation transcript (Story 12.2)
 * - GET /api/conversation/sessions - List user's conversation sessions (Story 7.13)
 * - POST /api/conversation/activate-extension - Activate conversation extension (Story 36-1)
 */
export const ConversationGroup = HttpApiGroup.make("conversation")
	.add(
		HttpApiEndpoint.post("start", "/start")
			.addSuccess(StartConversationResponseSchema)
			.setPayload(StartConversationRequestSchema)
			.addError(ConversationAlreadyExists, { status: 409 })
			.addError(RateLimitExceeded, { status: 429 })
			.addError(DatabaseError, { status: 500 })
			.addError(GlobalAssessmentLimitReached, { status: 503 })
			.addError(CostLimitExceeded, { status: 503 }),
	)
	.add(
		HttpApiEndpoint.post("sendMessage", "/message")
			.addSuccess(SendMessageResponseSchema)
			.setPayload(SendMessageRequestSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(ConcurrentMessageError, { status: 409 })
			.addError(SessionCompletedError, { status: 409 })
			.addError(ConversationEvidenceError, { status: 500 })
			.addError(DatabaseError, { status: 500 })
			.addError(AgentInvocationError, { status: 503 })
			.addError(CostLimitExceeded, { status: 503 })
			.addError(MessageRateLimitError, { status: 429 }),
	)
	.add(
		HttpApiEndpoint.get("listSessions", "/sessions")
			.addSuccess(ListSessionsResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getResults", "/:sessionId/results")
			.setPath(GetResultsPathSchema)
			.addSuccess(GetResultsResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(SessionNotCompleted, { status: 409 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("resumeSession", "/:sessionId/resume")
			.setPath(GetResultsPathSchema)
			.addSuccess(ResumeSessionResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("generateResults", "/:sessionId/generate-results")
			.setPath(GenerateResultsPathSchema)
			.addSuccess(GenerateResultsResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(SessionNotFinalizing, { status: 409 })
			.addError(ConcurrentMessageError, { status: 409 })
			.addError(AssessmentResultError, { status: 500 })
			.addError(ConversationEvidenceError, { status: 500 })
			.addError(DatabaseError, { status: 500 })
			.addError(UserSummaryGenerationError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getTranscript", "/:sessionId/transcript")
			.setPath(GetResultsPathSchema)
			.addSuccess(GetTranscriptResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(SessionNotCompleted, { status: 409 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getFinalizationStatus", "/:sessionId/finalization-status")
			.setPath(GenerateResultsPathSchema)
			.addSuccess(FinalizationStatusResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("activateExtension", "/activate-extension")
			.addSuccess(ActivateExtensionResponseSchema)
			.addError(SubscriptionRequired, { status: 403 })
			.addError(SessionNotFound, { status: 404 })
			.addError(ConcurrentMessageError, { status: 409 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/conversation");

// Export TypeScript types for frontend use
export type StartConversationRequest = typeof StartConversationRequestSchema.Type;
export type StartConversationResponse = typeof StartConversationResponseSchema.Type;
export type SendMessageRequest = typeof SendMessageRequestSchema.Type;
export type SendMessageResponse = typeof SendMessageResponseSchema.Type;
export type GetResultsResponse = typeof GetResultsResponseSchema.Type;
export type ResumeSessionResponse = typeof ResumeSessionResponseSchema.Type;
export type SessionSummary = typeof SessionSummarySchema.Type;
export type ListSessionsResponse = typeof ListSessionsResponseSchema.Type;
export type GenerateResultsResponse = typeof GenerateResultsResponseSchema.Type;
export type FinalizationStatusResponse = typeof FinalizationStatusResponseSchema.Type;
export type GetTranscriptResponse = typeof GetTranscriptResponseSchema.Type;
export type ActivateExtensionResponse = typeof ActivateExtensionResponseSchema.Type;
