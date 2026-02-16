/**
 * Profile HTTP API Group
 *
 * Defines profile sharing endpoints for personality archetypes.
 * Follows the same pattern as AssessmentGroup.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import {
	DatabaseError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	SessionNotFound,
	Unauthorized,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";
import { OceanCode5Schema } from "../../schemas/ocean-code";

/**
 * Share Profile Request Schema
 */
export const ShareProfileRequestSchema = S.Struct({
	sessionId: S.String,
});

/**
 * Share Profile Response Schema
 */
export const ShareProfileResponseSchema = S.Struct({
	publicProfileId: S.String,
	shareableUrl: S.String,
	isPublic: S.Boolean,
});

/**
 * Facet Score Schema for Public Profiles
 */
export const FacetScoreSchema = S.Struct({
	score: S.Number,
	confidence: S.Number,
});

/**
 * Get Public Profile Response Schema
 */
export const GetPublicProfileResponseSchema = S.Struct({
	archetypeName: S.String,
	oceanCode: OceanCode5Schema,
	description: S.String,
	color: S.String,
	displayName: S.NullOr(S.String),
	traitSummary: S.Record({ key: S.String, value: S.String }),
	facets: S.Record({ key: S.String, value: FacetScoreSchema }),
	isPublic: S.Boolean,
});

/**
 * Toggle Visibility Request Schema
 */
export const ToggleVisibilityRequestSchema = S.Struct({
	isPublic: S.Boolean,
});

/**
 * Toggle Visibility Response Schema
 */
export const ToggleVisibilityResponseSchema = S.Struct({
	isPublic: S.Boolean,
});

/**
 * Profile API Group
 *
 * Routes:
 * - POST /api/public-profile/share - Create shareable profile
 * - GET /api/public-profile/:publicProfileId - View public profile
 * - PATCH /api/public-profile/:publicProfileId/visibility - Toggle privacy
 */
export const ProfileGroup = HttpApiGroup.make("profile")
	.add(
		HttpApiEndpoint.post("shareProfile", "/share")
			.addSuccess(ShareProfileResponseSchema)
			.setPayload(ShareProfileRequestSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(ProfileError, { status: 422 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getProfile", "/:publicProfileId")
			.addSuccess(GetPublicProfileResponseSchema)
			.addError(ProfileNotFound, { status: 404 })
			.addError(ProfilePrivate, { status: 403 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.patch("toggleVisibility", "/:publicProfileId/visibility")
			.addSuccess(ToggleVisibilityResponseSchema)
			.setPayload(ToggleVisibilityRequestSchema)
			.addError(ProfileNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/public-profile");

// Export TypeScript types for frontend use
export type ShareProfileRequest = typeof ShareProfileRequestSchema.Type;
export type ShareProfileResponse = typeof ShareProfileResponseSchema.Type;
export type GetPublicProfileResponse = typeof GetPublicProfileResponseSchema.Type;
export type ToggleVisibilityRequest = typeof ToggleVisibilityRequestSchema.Type;
export type ToggleVisibilityResponse = typeof ToggleVisibilityResponseSchema.Type;
