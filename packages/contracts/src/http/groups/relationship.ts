/**
 * Relationship HTTP API Groups (Story 14.4, updated Story 34-1, Story 35-2)
 *
 * Simplified: Invitation endpoints removed (replaced by QR token endpoints in qr-token.ts).
 * Remaining: Authenticated analysis + state + retry endpoints.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import {
	DatabaseError,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisUnauthorizedError,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

// ─── Schemas ──────────────────────────────────────────────────────────────

// ─── Relationship Card State (Story 14.4, updated Story 34-1) ──────────

export const RelationshipCardStateSchema = S.Union(
	S.Struct({ _tag: S.Literal("invite-prompt"), availableCredits: S.Number }),
	S.Struct({ _tag: S.Literal("qr-active"), token: S.String }),
	S.Struct({ _tag: S.Literal("generating") }),
	S.Struct({ _tag: S.Literal("ready"), analysisId: S.String, partnerName: S.String }),
	S.Struct({ _tag: S.Literal("no-credits") }),
);

export type RelationshipCardState = typeof RelationshipCardStateSchema.Type;

const RelationshipAnalysisResponseSchema = S.Struct({
	analysisId: S.String,
	content: S.NullOr(S.String),
	/** Whether this analysis is based on both users' latest results (Story 36-3) */
	isLatestVersion: S.Boolean,
	userAName: S.String,
	userBName: S.String,
});

export type RelationshipAnalysisResponse = typeof RelationshipAnalysisResponseSchema.Type;

/**
 * Response for retry endpoint (Story 35-2).
 * status: "generating" if retry was triggered, "ready" if already complete.
 */
const RetryRelationshipAnalysisResponseSchema = S.Struct({
	status: S.Union(S.Literal("generating"), S.Literal("ready")),
});

// ─── Authenticated Group ──────────────────────────────────────────────────

export const RelationshipGroup = HttpApiGroup.make("relationship")
	.add(
		HttpApiEndpoint.get("getRelationshipState", "/state")
			.addSuccess(RelationshipCardStateSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getRelationshipAnalysis", "/analysis/:analysisId")
			.setPath(S.Struct({ analysisId: S.String }))
			.addSuccess(RelationshipAnalysisResponseSchema)
			.addError(RelationshipAnalysisNotFoundError, { status: 404 })
			.addError(RelationshipAnalysisUnauthorizedError, { status: 403 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("retryRelationshipAnalysis", "/analysis/:analysisId/retry")
			.setPath(S.Struct({ analysisId: S.String }))
			.addSuccess(RetryRelationshipAnalysisResponseSchema)
			.addError(RelationshipAnalysisNotFoundError, { status: 404 })
			.addError(RelationshipAnalysisUnauthorizedError, { status: 403 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/relationship");
