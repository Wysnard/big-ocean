/**
 * Relationship HTTP API Groups (Story 14.4, updated Story 34-1, Story 35-2, Story 35-4)
 *
 * Simplified: Invitation endpoints removed (replaced by QR token endpoints in qr-token.ts).
 * Remaining: Authenticated analysis + state + retry + list endpoints.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import {
	DatabaseError,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisUnauthorizedError,
	RelationshipSharedNoteValidationError,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";
import { FacetScoreSchema } from "./profile";

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

// FacetScoreSchema matches profile facet scores — same `{ score, confidence }` for trait/facet maps.
const ScoreMapSchema = S.Record({ key: S.String, value: FacetScoreSchema });

const RelationshipAnalysisResponseSchema = S.Struct({
	analysisId: S.String,
	content: S.NullOr(S.String),
	/** Whether this analysis is based on both users' latest results (Story 36-3) */
	isLatestVersion: S.Boolean,
	userAName: S.String,
	userBName: S.String,
	/** Locked-result facet scores for Section B (Story 7.3) */
	userAFacets: ScoreMapSchema,
	userBFacets: ScoreMapSchema,
	/** Locked-result trait aggregates for Section B (Story 7.3) */
	userATraits: ScoreMapSchema,
	userBTraits: ScoreMapSchema,
	/** When letter content finished generating (ISO 8601), null if still generating */
	contentCompletedAt: S.NullOr(S.String),
	/** When this relationship analysis row was created (ISO 8601) */
	createdAt: S.String,
});

export type RelationshipAnalysisResponse = typeof RelationshipAnalysisResponseSchema.Type;

/**
 * Response for retry endpoint (Story 35-2).
 * status: "generating" if retry was triggered, "ready" if already complete.
 */
const RetryRelationshipAnalysisResponseSchema = S.Struct({
	status: S.Union(S.Literal("generating"), S.Literal("ready")),
});

/**
 * Response item for list analyses endpoint (Story 35-4).
 * Version detection is derive-at-read: isLatestVersion = false means
 * newer assessment results exist for at least one participant.
 */
const RelationshipAnalysisListItemSchema = S.Struct({
	/** UUID of the relationship analysis */
	analysisId: S.String,
	/** Display name of user A (canonical MIN user) */
	userAName: S.String,
	/** Display name of user B (canonical MAX user) */
	userBName: S.String,
	/** Display name of the other participant from the current user's perspective */
	partnerName: S.String,
	/** Partner archetype derived from the partner's locked assessment result */
	partnerArchetypeName: S.String,
	/** Partner OCEAN code derived from the partner's locked assessment result */
	partnerOceanCode: S.String,
	/**
	 * Whether this analysis is based on both users' latest results.
	 * false = "previous version" — newer assessment results exist for at least one user.
	 */
	isLatestVersion: S.Boolean,
	/** Whether the analysis content has been generated (true) or is still generating (false) */
	hasContent: S.Boolean,
	/** When the relationship analysis content was first generated (ISO 8601 string) */
	contentCompletedAt: S.NullOr(S.String),
	/** When this analysis was created (ISO 8601 string) */
	createdAt: S.String,
});

export type RelationshipAnalysisListItem = typeof RelationshipAnalysisListItemSchema.Type;

const RelationshipAnalysisListResponseSchema = S.Array(RelationshipAnalysisListItemSchema);

const RelationshipSharedNoteItemSchema = S.Struct({
	id: S.String,
	authorDisplayName: S.String,
	body: S.String,
	createdAt: S.String,
});

export type RelationshipSharedNoteItem = typeof RelationshipSharedNoteItemSchema.Type;

const ListRelationshipSharedNotesResponseSchema = S.Array(RelationshipSharedNoteItemSchema);

const CreateRelationshipSharedNoteRequestSchema = S.Struct({
	body: S.String,
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
	.add(
		HttpApiEndpoint.get("listRelationshipAnalyses", "/analyses")
			.addSuccess(RelationshipAnalysisListResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("listRelationshipSharedNotes", "/analysis/:analysisId/notes")
			.setPath(S.Struct({ analysisId: S.String }))
			.addSuccess(ListRelationshipSharedNotesResponseSchema)
			.addError(RelationshipAnalysisNotFoundError, { status: 404 })
			.addError(RelationshipAnalysisUnauthorizedError, { status: 403 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("createRelationshipSharedNote", "/analysis/:analysisId/notes")
			.setPath(S.Struct({ analysisId: S.String }))
			.setPayload(CreateRelationshipSharedNoteRequestSchema)
			.addSuccess(RelationshipSharedNoteItemSchema)
			.addError(RelationshipSharedNoteValidationError, { status: 400 })
			.addError(RelationshipAnalysisNotFoundError, { status: 404 })
			.addError(RelationshipAnalysisUnauthorizedError, { status: 403 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/relationship");
