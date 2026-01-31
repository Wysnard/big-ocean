/**
 * Assessment HTTP Contract
 *
 * HTTP routes for personality assessment operations.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/groups/*.ts
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema as S } from "effect"

/**
 * Response Schemas
 */
export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.DateTimeUtc,
})

export const SendMessageResponseSchema = S.Struct({
  response: S.String,
  precision: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number,
  }),
})

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
})

export const ResumeSessionResponseSchema = S.Struct({
  messages: S.Array(
    S.Struct({
      id: S.String,
      role: S.Literal("user", "assistant"),
      content: S.String,
      createdAt: S.DateTimeUtc,
    })
  ),
  precision: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number,
  }),
})

/**
 * Request Schemas
 */
export const StartAssessmentRequestSchema = S.Struct({
  userId: S.optional(S.String),
})

export const SendMessageRequestSchema = S.Struct({
  sessionId: S.String,
  message: S.String,
})

/**
 * Assessment HTTP API Group
 */
export const AssessmentGroup = HttpApiGroup.make("assessment")
  .add(
    HttpApiEndpoint.post("start", "/start")
      .addSuccess(StartAssessmentResponseSchema)
      .setPayload(StartAssessmentRequestSchema)
  )
  .add(
    HttpApiEndpoint.post("sendMessage", "/message")
      .addSuccess(SendMessageResponseSchema)
      .setPayload(SendMessageRequestSchema)
  )
  .add(
    HttpApiEndpoint.get("getResults", "/:sessionId/results").addSuccess(
      GetResultsResponseSchema
    )
  )
  .add(
    HttpApiEndpoint.get("resumeSession", "/:sessionId/resume").addSuccess(
      ResumeSessionResponseSchema
    )
  )
  .prefix("/assessment")
