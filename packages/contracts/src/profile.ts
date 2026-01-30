/**
 * Profile Service RPC Contract
 *
 * Type-safe contracts for profile operations.
 * Uses Effect Schema for runtime validation and @effect/rpc for procedure definitions.
 */

import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema as S } from "effect";

/**
 * Response Schemas
 */
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

export const ShareProfileResponseSchema = S.Struct({
  publicProfileId: S.String,
  shareableUrl: S.String,
});

/**
 * RPC Procedures
 */
export const GetProfileRpc = Rpc.make("GetProfile", {
  success: GetProfileResponseSchema,
  payload: {
    publicProfileId: S.String,
  },
});

export const ShareProfileRpc = Rpc.make("ShareProfile", {
  success: ShareProfileResponseSchema,
  payload: {
    sessionId: S.String,
  },
});

/**
 * Profile RPC Group
 *
 * All profile-related procedures.
 */
export const ProfileRpcs = RpcGroup.make(GetProfileRpc, ShareProfileRpc);
