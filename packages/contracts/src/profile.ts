/**
 * Profile Service Schemas
 *
 * Shared type definitions for profile operations.
 * Used for validation and type safety across frontend/backend.
 */

import { Schema as S } from "effect";

/**
 * Request/Response Schemas for Profile Endpoints
 */

// GET /api/profile/:publicProfileId
export const GetProfileResponseSchema = S.Struct({
  archetypeName: S.String,
  oceanCode4Letter: S.String,
  traitSummary: S.Struct({
    openness: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
    conscientiousness: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
    extraversion: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
    agreeableness: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
    neuroticism: S.Union(S.Literal("Low"), S.Literal("Mid"), S.Literal("High")),
  }),
  description: S.String,
  archetypeColor: S.String,
});

// POST /api/profile/share
export const ShareProfileRequestSchema = S.Struct({
  sessionId: S.String,
});

export const ShareProfileResponseSchema = S.Struct({
  publicProfileId: S.String,
  shareableUrl: S.String,
});

/**
 * TypeScript Types (inferred from schemas)
 */
export type GetProfileResponse = S.Schema.Type<typeof GetProfileResponseSchema>;
export type ShareProfileRequest = S.Schema.Type<typeof ShareProfileRequestSchema>;
export type ShareProfileResponse = S.Schema.Type<typeof ShareProfileResponseSchema>;
