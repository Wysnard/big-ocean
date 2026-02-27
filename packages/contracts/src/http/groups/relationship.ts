/**
 * Relationship HTTP API Groups (Story 14.2, extended Story 14.4)
 *
 * Split into two groups:
 * - RelationshipGroup: Authenticated invitation + analysis endpoints
 * - RelationshipPublicGroup: Unauthenticated token lookup (for invitee landing page)
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import {
	DatabaseError,
	InsufficientCreditsError,
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisUnauthorizedError,
	SelfInvitationError,
} from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

// ─── Schemas ──────────────────────────────────────────────────────────────

const InvitationStatusSchema = S.Literal("pending", "accepted", "refused", "expired");

const InvitationSchema = S.Struct({
	id: S.String,
	invitationToken: S.String,
	inviteeUserId: S.NullOr(S.String),
	personalMessage: S.NullOr(S.String),
	status: InvitationStatusSchema,
	expiresAt: S.DateTimeUtc,
	createdAt: S.DateTimeUtc,
});

const CreateInvitationPayloadSchema = S.Struct({
	personalMessage: S.optional(S.String.pipe(S.maxLength(500))),
});

const CreateInvitationResponseSchema = S.Struct({
	invitation: InvitationSchema,
	shareUrl: S.String,
});

const ListInvitationsResponseSchema = S.Struct({
	invitations: S.Array(InvitationSchema),
});

const InvitationDetailResponseSchema = S.Struct({
	invitation: InvitationSchema,
	inviterDisplayName: S.optional(S.String),
});

const AcceptInvitationResponseSchema = S.Struct({
	invitation: InvitationSchema,
});

const RefuseInvitationResponseSchema = S.Struct({
	invitation: InvitationSchema,
});

// ─── Relationship Card State (Story 14.4) ─────────────────────────────────

export const RelationshipCardStateSchema = S.Union(
	S.Struct({ _tag: S.Literal("invite-prompt"), availableCredits: S.Number }),
	S.Struct({ _tag: S.Literal("pending-sent"), inviteeName: S.String }),
	S.Struct({ _tag: S.Literal("pending-received"), inviterName: S.String, invitationId: S.String }),
	S.Struct({ _tag: S.Literal("generating") }),
	S.Struct({ _tag: S.Literal("ready"), analysisId: S.String, partnerName: S.String }),
	S.Struct({ _tag: S.Literal("declined"), inviteeName: S.String }),
	S.Struct({ _tag: S.Literal("no-credits") }),
);

export type RelationshipCardState = typeof RelationshipCardStateSchema.Type;

const RelationshipAnalysisResponseSchema = S.Struct({
	analysisId: S.String,
	content: S.String,
});

export type RelationshipAnalysisResponse = typeof RelationshipAnalysisResponseSchema.Type;

// ─── Authenticated Group ──────────────────────────────────────────────────

export const RelationshipGroup = HttpApiGroup.make("relationship")
	.add(
		HttpApiEndpoint.post("createInvitation", "/invitations")
			.addSuccess(CreateInvitationResponseSchema)
			.setPayload(CreateInvitationPayloadSchema)
			.addError(InsufficientCreditsError, { status: 402 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("listInvitations", "/invitations")
			.addSuccess(ListInvitationsResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("acceptInvitation", "/invitations/:token/accept")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(AcceptInvitationResponseSchema)
			.addError(InvitationNotFoundError, { status: 404 })
			.addError(InvitationAlreadyRespondedError, { status: 409 })
			.addError(SelfInvitationError, { status: 400 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("refuseInvitation", "/invitations/:token/refuse")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(RefuseInvitationResponseSchema)
			.addError(InvitationNotFoundError, { status: 404 })
			.addError(InvitationAlreadyRespondedError, { status: 409 })
			.addError(DatabaseError, { status: 500 }),
	)
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
	.middleware(AuthMiddleware)
	.prefix("/relationship");

// ─── Public Group (no auth — invitee may not be logged in) ────────────────

export const RelationshipPublicGroup = HttpApiGroup.make("relationshipPublic")
	.add(
		HttpApiEndpoint.get("getInvitationByToken", "/invitations/:token")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(InvitationDetailResponseSchema)
			.addError(InvitationNotFoundError, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("claimInvitation", "/invitations/:token/claim")
			.setPath(S.Struct({ token: S.String }))
			.addSuccess(S.Struct({ ok: S.Literal(true) }))
			.addError(InvitationNotFoundError, { status: 404 })
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/relationship/public");

// Export TypeScript types for frontend use
export type CreateInvitationPayload = typeof CreateInvitationPayloadSchema.Type;
export type CreateInvitationResponse = typeof CreateInvitationResponseSchema.Type;
export type ListInvitationsResponse = typeof ListInvitationsResponseSchema.Type;
export type InvitationDetailResponse = typeof InvitationDetailResponseSchema.Type;
export type AcceptInvitationResponse = typeof AcceptInvitationResponseSchema.Type;
export type RefuseInvitationResponse = typeof RefuseInvitationResponseSchema.Type;
