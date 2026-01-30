/**
 * Shared Schemas for RPC Contracts
 *
 * Common data structures used across multiple RPC services.
 */

import * as S from "@effect/schema/Schema";

/**
 * Message schema for conversation history
 */
export const MessageSchema = S.Struct({
  id: S.String,
  sessionId: S.String,
  role: S.Union(S.Literal("user"), S.Literal("assistant")),
  content: S.String,
  createdAt: S.Date,
});

/**
 * Trait precision/confidence scores (0-1 scale)
 */
export const TraitPrecisionSchema = S.Struct({
  openness: S.Number,
  conscientiousness: S.Number,
  extraversion: S.Number,
  agreeableness: S.Number,
  neuroticism: S.Number,
});

/**
 * Trait scores (0-20 scale, Big Five standard)
 */
export const TraitScoresSchema = S.Struct({
  openness: S.Number, // 0-20
  conscientiousness: S.Number,
  extraversion: S.Number,
  agreeableness: S.Number,
  neuroticism: S.Number,
});

/**
 * Trait summary levels for public profiles
 */
export const TraitSummarySchema = S.Struct({
  openness: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
  conscientiousness: S.Union(
    S.Literal("Low"),
    S.Literal("Mid"),
    S.Literal("High")
  ),
  extraversion: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
  agreeableness: S.Union(
    S.Literal("Low"),
    S.Literal("Mid"),
    S.Literal("High")
  ),
  neuroticism: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
});

// Type exports
export type Message = S.Schema.Type<typeof MessageSchema>;
export type TraitPrecision = S.Schema.Type<typeof TraitPrecisionSchema>;
export type TraitScores = S.Schema.Type<typeof TraitScoresSchema>;
export type TraitSummary = S.Schema.Type<typeof TraitSummarySchema>;
