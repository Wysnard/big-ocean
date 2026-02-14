/**
 * Assessment HTTP API Group
 *
 * Defines assessment endpoints for personality evaluation.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/groups/*.ts
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import {
	AgentInvocationError,
	DatabaseError,
	RateLimitExceeded,
	SessionNotFound,
} from "../../errors";
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

/**
 * Trait Result Schema
 * Each of the 5 Big Five traits with score (0-120), level (H/M/L), confidence (0-100)
 */
export const TraitResultSchema = S.Struct({
	name: S.String,
	score: S.Number,
	level: S.String,
	confidence: S.Number,
});

/**
 * Facet Result Schema
 * Each of the 30 facets with score (0-20), confidence (0-100), and parent trait
 */
export const FacetResultSchema = S.Struct({
	name: S.String,
	traitName: S.String,
	score: S.Number,
	confidence: S.Number,
});

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
	messageReadyThreshold: S.Number,
});

/**
 * Assessment API Group
 *
 * Routes:
 * - POST /api/assessment/start - Start new assessment session
 * - POST /api/assessment/message - Send message to assessment agent
 * - GET /api/assessment/:sessionId/results - Get assessment results
 * - GET /api/assessment/:sessionId/resume - Resume existing session
 */
export const AssessmentGroup = HttpApiGroup.make("assessment")
	.add(
		HttpApiEndpoint.post("start", "/start")
			.addSuccess(StartAssessmentResponseSchema)
			.setPayload(StartAssessmentRequestSchema)
			.addError(RateLimitExceeded, { status: 429 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("sendMessage", "/message")
			.addSuccess(SendMessageResponseSchema)
			.setPayload(SendMessageRequestSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(DatabaseError, { status: 500 })
			.addError(AgentInvocationError, { status: 503 }),
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
	.prefix("/assessment");

// Export TypeScript types for frontend use
export type StartAssessmentRequest = typeof StartAssessmentRequestSchema.Type;
export type StartAssessmentResponse = typeof StartAssessmentResponseSchema.Type;
export type SendMessageRequest = typeof SendMessageRequestSchema.Type;
export type SendMessageResponse = typeof SendMessageResponseSchema.Type;
export type GetResultsResponse = typeof GetResultsResponseSchema.Type;
export type ResumeSessionResponse = typeof ResumeSessionResponseSchema.Type;
