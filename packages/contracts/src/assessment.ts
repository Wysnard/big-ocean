/**
 * Assessment Service RPC Contract
 *
 * Type-safe contracts for personality assessment operations.
 * Uses Effect Schema for runtime validation and @effect/rpc for procedure definitions.
 */

import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema as S } from "effect";

/**
 * Response Schemas
 */
export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.String,
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
 * RPC Procedures
 */
export const StartAssessmentRpc = Rpc.make("StartAssessment", {
  success: StartAssessmentResponseSchema,
  payload: {
    userId: S.optional(S.String),
  },
});

export const SendMessageRpc = Rpc.make("SendMessage", {
  success: SendMessageResponseSchema,
  payload: {
    sessionId: S.String,
    message: S.String,
  },
});

export const GetResultsRpc = Rpc.make("GetResults", {
  success: GetResultsResponseSchema,
  payload: {
    sessionId: S.String,
  },
});

export const ResumeSessionRpc = Rpc.make("ResumeSession", {
  success: ResumeSessionResponseSchema,
  payload: {
    sessionId: S.String,
  },
});

/**
 * Assessment RPC Group
 *
 * All assessment-related procedures.
 */
export const AssessmentRpcs = RpcGroup.make(
  StartAssessmentRpc,
  SendMessageRpc,
  GetResultsRpc,
  ResumeSessionRpc
);
