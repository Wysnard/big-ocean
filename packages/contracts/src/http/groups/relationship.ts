/**
 * Relationship HTTP API Groups (Story 14.2)
 *
 * Split into two groups:
 * - RelationshipGroup: Authenticated invitation endpoints
 * - RelationshipPublicGroup: Unauthenticated token lookup (for invitee landing page)
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, InsufficientCreditsError, InvitationNotFoundError } from "../../errors";
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
	.prefix("/relationship/public");

// Export TypeScript types for frontend use
export type CreateInvitationPayload = typeof CreateInvitationPayloadSchema.Type;
export type CreateInvitationResponse = typeof CreateInvitationResponseSchema.Type;
export type ListInvitationsResponse = typeof ListInvitationsResponseSchema.Type;
export type InvitationDetailResponse = typeof InvitationDetailResponseSchema.Type;
