/**
 * Assessment HTTP API Group
 *
 * Defines assessment endpoints for personality evaluation.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/groups/*.ts
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { FacetResultSchema, TraitResultSchema } from "@workspace/domain";
import { Schema as S } from "effect";
import {
	AgentInvocationError,
	AssessmentAlreadyExists,
	DatabaseError,
	FreeTierLimitReached,
	RateLimitExceeded,
	SessionNotFound,
	Unauthorized,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";
import { OceanCode4Schema, OceanCode5Schema } from "../../schemas/ocean-code";

/**
 * Start Assessment Request Schema
 */
export const StartAssessmentRequestSchema = S.Struct({
	userId: S.optional(S.String),
});

/**
 * Start Assessment Response Schema
 *
 * Returns session metadata plus the 3 persisted Nerin greeting messages.
 */
export const StartAssessmentResponseSchema = S.Struct({
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
	message: S.String,
});

/**
 * Send Message Response Schema
 *
 * Story 2.11: Lean response — confidence removed. Confidence is still
 * returned by the resume-session endpoint for returning users.
 */
export const SendMessageResponseSchema = S.Struct({
	response: S.String,
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
	personalDescription: S.NullOr(S.String),
	messageCount: S.Number,
	publicProfileId: S.NullOr(S.String),
	shareableUrl: S.NullOr(S.String),
	isPublic: S.NullOr(S.Boolean),
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
	freeTierMessageThreshold: S.Number,
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
	status: S.Literal("active", "paused", "completed", "archived"),
	messageCount: S.Number,
	oceanCode5: S.NullOr(S.String),
	archetypeName: S.NullOr(S.String),
});

/**
 * List Sessions Response Schema (Story 7.13)
 */
export const ListSessionsResponseSchema = S.Struct({
	sessions: S.Array(SessionSummarySchema),
	freeTierMessageThreshold: S.Number,
});

/**
 * Assessment API Group
 *
 * Routes:
 * - POST /api/assessment/start - Start new assessment session
 * - POST /api/assessment/message - Send message to assessment agent
 * - GET /api/assessment/:sessionId/results - Get assessment results
 * - GET /api/assessment/:sessionId/resume - Resume existing session
 * - GET /api/assessment/sessions - List user's assessment sessions (Story 7.13)
 */
export const AssessmentGroup = HttpApiGroup.make("assessment")
	.add(
		HttpApiEndpoint.post("start", "/start")
			.addSuccess(StartAssessmentResponseSchema)
			.setPayload(StartAssessmentRequestSchema)
			.addError(AssessmentAlreadyExists, { status: 409 })
			.addError(RateLimitExceeded, { status: 429 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("sendMessage", "/message")
			.addSuccess(SendMessageResponseSchema)
			.setPayload(SendMessageRequestSchema)
			.addError(FreeTierLimitReached, { status: 403 })
			.addError(SessionNotFound, { status: 404 })
			.addError(DatabaseError, { status: 500 })
			.addError(AgentInvocationError, { status: 503 }),
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
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("resumeSession", "/:sessionId/resume")
			.setPath(GetResultsPathSchema)
			.addSuccess(ResumeSessionResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/assessment");

// Export TypeScript types for frontend use
export type StartAssessmentRequest = typeof StartAssessmentRequestSchema.Type;
export type StartAssessmentResponse = typeof StartAssessmentResponseSchema.Type;
export type SendMessageRequest = typeof SendMessageRequestSchema.Type;
export type SendMessageResponse = typeof SendMessageResponseSchema.Type;
export type GetResultsResponse = typeof GetResultsResponseSchema.Type;
export type ResumeSessionResponse = typeof ResumeSessionResponseSchema.Type;
export type SessionSummary = typeof SessionSummarySchema.Type;
export type ListSessionsResponse = typeof ListSessionsResponseSchema.Type;
