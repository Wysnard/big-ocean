/**
 * Portrait HTTP API Group (Story 13.3)
 *
 * Endpoints for portrait status polling and retrieval.
 * Used by frontend to poll for async portrait generation completion.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError } from "../../errors";

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
 * Get Portrait Status Response Schema
 */
export const GetPortraitStatusResponseSchema = S.Struct({
	status: PortraitStatusSchema,
	portrait: S.NullOr(PortraitSchema),
});

/**
 * Path schema for portrait status endpoint
 */
const PortraitStatusPathSchema = S.Struct({
	sessionId: S.String,
});

/**
 * Portrait API Group
 *
 * Routes:
 * - GET /api/portrait/:sessionId/status - Get portrait generation status
 *
 * No auth middleware required — session ownership checked in use-case.
 */
export const PortraitGroup = HttpApiGroup.make("portrait")
	.add(
		HttpApiEndpoint.get("getPortraitStatus", "/:sessionId/status")
			.setPath(PortraitStatusPathSchema)
			.addSuccess(GetPortraitStatusResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/portrait");

// Export TypeScript types for frontend use
export type PortraitStatus = typeof PortraitStatusSchema.Type;
export type Portrait = typeof PortraitSchema.Type;
export type GetPortraitStatusResponse = typeof GetPortraitStatusResponseSchema.Type;
