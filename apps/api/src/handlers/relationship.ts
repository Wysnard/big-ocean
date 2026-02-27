/**
 * Relationship Presenters (HTTP Handlers) — Story 14.2
 *
 * Two handler groups:
 * - RelationshipGroupLive: Authenticated — create invitation, list invitations
 * - RelationshipPublicGroupLive: Public — get invitation by token
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import type { RelationshipInvitation } from "@workspace/domain";
import { AuthenticatedUser } from "@workspace/domain";
import { DateTime, Effect } from "effect";
import { createInvitation } from "../use-cases/create-invitation.use-case";
import { getInvitationByToken } from "../use-cases/get-invitation-by-token.use-case";
import { listInvitations } from "../use-cases/list-invitations.use-case";

/** Convert domain invitation dates to DateTimeUtc for schema serialization */
const toApiInvitation = (inv: RelationshipInvitation) => ({
	id: inv.id,
	invitationToken: inv.invitationToken,
	inviteeUserId: inv.inviteeUserId,
	personalMessage: inv.personalMessage,
	status: inv.status,
	expiresAt: DateTime.unsafeMake(inv.expiresAt.getTime()),
	createdAt: DateTime.unsafeMake(inv.createdAt.getTime()),
});

/**
 * Relationship Handler Group (authenticated)
 */
export const RelationshipGroupLive = HttpApiBuilder.group(BigOceanApi, "relationship", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("createInvitation", ({ payload }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* createInvitation({
						userId,
						personalMessage: payload.personalMessage,
					});
					return {
						invitation: toApiInvitation(result.invitation),
						shareUrl: result.shareUrl,
					};
				}),
			)
			.handle("listInvitations", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const invitations = yield* listInvitations(userId);
					return {
						invitations: invitations.map(toApiInvitation),
					};
				}),
			);
	}),
);

/**
 * Relationship Public Handler Group (unauthenticated)
 */
export const RelationshipPublicGroupLive = HttpApiBuilder.group(
	BigOceanApi,
	"relationshipPublic",
	(handlers) =>
		Effect.gen(function* () {
			return handlers.handle("getInvitationByToken", ({ path }) =>
				Effect.gen(function* () {
					const result = yield* getInvitationByToken(path.token);
					return {
						invitation: toApiInvitation(result.invitation),
					};
				}),
			);
		}),
);
