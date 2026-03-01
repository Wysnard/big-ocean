/**
 * Portrait HTTP API Group (Story 13.3)
 *
 * Endpoints for portrait status polling and retrieval.
 * Used by frontend to poll for async portrait generation completion.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, SessionNotFound, Unauthorized } from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

/**
 * Portrait Status Enum
 * - none: No portrait exists for this session
 * - generating: Portrait placeholder exists, content being generated
 * - ready: Portrait has content
 * - failed: Portrait generation failed after max retries
 */
export const PortraitStatusSchema = S.Literal("none", "generating", "ready", "failed");

/**
 * Portrait Data Schema
 * Contains the full portrait record when status is "ready"
 */
export const PortraitSchema = S.Struct({
	id: S.String,
	assessmentResultId: S.String,
	tier: S.Literal("teaser", "full"),
	content: S.NullOr(S.String),
	lockedSectionTitles: S.NullOr(S.Array(S.String)),
	modelUsed: S.String,
	retryCount: S.Number,
	createdAt: S.DateTimeUtc,
});

/**
 * Teaser Portrait Data Schema (Story 12.3)
 */
export const TeaserPortraitDataSchema = S.Struct({
	content: S.String,
	lockedSectionTitles: S.Array(S.String),
});

/**
 * Get Portrait Status Response Schema
 */
export const GetPortraitStatusResponseSchema = S.Struct({
	status: PortraitStatusSchema,
	portrait: S.NullOr(PortraitSchema),
	teaser: S.NullOr(TeaserPortraitDataSchema),
});

/**
 * Path schema for portrait status endpoint
 */
const PortraitStatusPathSchema = S.Struct({
	sessionId: S.String,
});

/**
 * Rate Portrait Request Schema (Story 19-2)
 */
export const RatePortraitPayloadSchema = S.Struct({
	assessmentSessionId: S.String,
	portraitType: S.Literal("teaser", "full"),
	rating: S.Literal("up", "down"),
	depthSignal: S.Literal("rich", "moderate", "thin"),
	evidenceCount: S.Number.pipe(S.int(), S.nonNegative()),
});

/**
 * Rate Portrait Response Schema (Story 19-2)
 */
export const RatePortraitResponseSchema = S.Struct({
	id: S.String,
	createdAt: S.DateTimeUtc,
});

/**
 * Portrait API Group
 *
 * Routes:
 * - GET /api/portrait/:sessionId/status - Get portrait generation status
 * - POST /api/portrait/rate - Submit portrait quality rating (auth required)
 */
export const PortraitGroup = HttpApiGroup.make("portrait")
	.add(
		HttpApiEndpoint.get("getPortraitStatus", "/:sessionId/status")
			.setPath(PortraitStatusPathSchema)
			.addSuccess(GetPortraitStatusResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("ratePortrait", "/rate")
			.setPayload(RatePortraitPayloadSchema)
			.addSuccess(RatePortraitResponseSchema)
			.addError(SessionNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 })
			.middleware(AuthMiddleware),
	)
	.prefix("/portrait");

// Export TypeScript types for frontend use
export type PortraitStatus = typeof PortraitStatusSchema.Type;
export type Portrait = typeof PortraitSchema.Type;
export type GetPortraitStatusResponse = typeof GetPortraitStatusResponseSchema.Type;
export type RatePortraitPayload = typeof RatePortraitPayloadSchema.Type;
export type RatePortraitResponse = typeof RatePortraitResponseSchema.Type;
