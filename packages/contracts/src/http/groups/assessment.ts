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

/**
 * Start Assessment Request Schema
 */
export const StartAssessmentRequestSchema = S.Struct({
	userId: S.optional(S.String),
});

/**
 * Start Assessment Response Schema
 */
export const StartAssessmentResponseSchema = S.Struct({
	sessionId: S.String,
	createdAt: S.DateTimeUtc,
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
 */
export const SendMessageResponseSchema = S.Struct({
	response: S.String,
	confidence: S.Struct({
		openness: S.Number,
		conscientiousness: S.Number,
		extraversion: S.Number,
		agreeableness: S.Number,
		neuroticism: S.Number,
	}),
});

/**
 * Get Results Response Schema
 */
export const GetResultsResponseSchema = S.Struct({
	oceanCode: S.String,
	archetypeName: S.String,
	traits: S.Struct({
		openness: S.Number,
		conscientiousness: S.Number,
		extraversion: S.Number,
		agreeableness: S.Number,
		neuroticism: S.Number,
	}),
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
			.addSuccess(GetResultsResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("resumeSession", "/:sessionId/resume")
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
