/**
 * Relationship Presenters (HTTP Handlers) — Story 14.2, extended Story 14.4
 *
 * Two handler groups:
 * - RelationshipGroupLive: Authenticated — invitations, state, analysis
 * - RelationshipPublicGroupLive: Public — get invitation by token
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi, InviteTokenSecurity } from "@workspace/contracts";
import { InvitationNotFoundError } from "@workspace/contracts/errors";
import type { RelationshipInvitation } from "@workspace/domain";
import { AuthenticatedUser } from "@workspace/domain";
import { DateTime, Effect } from "effect";
import { acceptInvitation } from "../use-cases/accept-invitation.use-case";
import { createInvitation } from "../use-cases/create-invitation.use-case";
import { getInvitationByToken } from "../use-cases/get-invitation-by-token.use-case";
import { getRelationshipAnalysis } from "../use-cases/get-relationship-analysis.use-case";
import { getRelationshipState } from "../use-cases/get-relationship-state.use-case";
import { listInvitations } from "../use-cases/list-invitations.use-case";
import { refuseInvitation } from "../use-cases/refuse-invitation.use-case";

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
			)
			.handle("acceptInvitation", ({ path }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* acceptInvitation({ token: path.token, inviteeUserId: userId });
					return { invitation: toApiInvitation(result.invitation) };
				}),
			)
			.handle("refuseInvitation", ({ path }) =>
				Effect.gen(function* () {
					yield* AuthenticatedUser;
					const result = yield* refuseInvitation(path.token);
					return { invitation: toApiInvitation(result.invitation) };
				}),
			)
			.handle("getRelationshipState", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* getRelationshipState(userId);
				}),
			)
			.handle("getRelationshipAnalysis", ({ path }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* getRelationshipAnalysis({
						analysisId: path.analysisId,
						userId,
					});
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
			return handlers
				.handle("getInvitationByToken", ({ path }) =>
					Effect.gen(function* () {
						const result = yield* getInvitationByToken(path.token);
						return {
							invitation: toApiInvitation(result.invitation),
							inviterDisplayName: result.inviterDisplayName,
						};
					}),
				)
				.handle("claimInvitation", ({ path }) =>
					Effect.gen(function* () {
						// Validate token exists and is pending/not expired
						const result = yield* getInvitationByToken(path.token);
						const inv = result.invitation;
						if (inv.status !== "pending") {
							return yield* Effect.fail(
								new InvitationNotFoundError({
									message:
										inv.status === "expired"
											? "Invitation has expired"
											: `Invitation has already been ${inv.status}`,
								}),
							);
						}

						// Compute remaining seconds until expiry
						const remainingMs = inv.expiresAt.getTime() - Date.now();
						const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

						yield* HttpApiBuilder.securitySetCookie(InviteTokenSecurity, path.token, {
							httpOnly: true,
							secure: true,
							sameSite: "lax",
							path: "/",
							maxAge: `${remainingSeconds} seconds`,
						});

						return { ok: true as const };
					}),
				);
		}),
);
