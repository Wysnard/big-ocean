/**
 * Accept Invitation Use-Case (Story 14.3)
 *
 * Accepts a relationship invitation for the authenticated user.
 * Self-invitation guard, status check, and expiry are all enforced
 * atomically in the repository's WHERE clause.
 */

import { RelationshipInvitationRepository } from "@workspace/domain";
import { Effect } from "effect";

export const acceptInvitation = (input: { token: string; inviteeUserId: string }) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		const updated = yield* repo.acceptInvitation({
			token: input.token,
			inviteeUserId: input.inviteeUserId,
		});
		return { invitation: updated };
	});
