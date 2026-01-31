/**
 * Assessment Service Schemas
 *
 * Shared type definitions for personality assessment operations.
 * Used for validation and type safety across frontend/backend.
 */

import { Schema as S } from "effect";

/**
 * Request/Response Schemas for Assessment Endpoints
 */

// POST /api/assessment/start
export const StartAssessmentRequestSchema = S.Struct({
  userId: S.optional(S.String),
});

export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.String,
});

// POST /api/assessment/message
export const SendMessageRequestSchema = S.Struct({
  sessionId: S.String,
  message: S.String,
});

export const SendMessageResponseSchema = S.Struct({
  response: S.String,
  precision: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number,
  }),
});

// GET /api/assessment/:sessionId/results
export const GetResultsResponseSchema = S.Struct({
  oceanCode4Letter: S.String,
  precision: S.Number,
  archetypeName: S.String,
  traitScores: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number,
  }),
});

// GET /api/assessment/:sessionId/resume
export const ResumeSessionResponseSchema = S.Struct({
  messages: S.Array(
    S.Struct({
      id: S.String,
      sessionId: S.String,
      role: S.Union(S.Literal("user"), S.Literal("assistant")),
      content: S.String,
      createdAt: S.String,
    })
  ),
  precision: S.Number,
  oceanCode4Letter: S.optional(S.String),
});

/**
 * TypeScript Types (inferred from schemas)
 */
export type StartAssessmentRequest = S.Schema.Type<typeof StartAssessmentRequestSchema>;
export type StartAssessmentResponse = S.Schema.Type<typeof StartAssessmentResponseSchema>;
export type SendMessageRequest = S.Schema.Type<typeof SendMessageRequestSchema>;
export type SendMessageResponse = S.Schema.Type<typeof SendMessageResponseSchema>;
export type GetResultsResponse = S.Schema.Type<typeof GetResultsResponseSchema>;
export type ResumeSessionResponse = S.Schema.Type<typeof ResumeSessionResponseSchema>;
