/**
 * List Invitations Use-Case (Story 14.2)
 *
 * Returns all invitations sent by the authenticated user.
 */

import { RelationshipInvitationRepository } from "@workspace/domain";
import { Effect } from "effect";

export const listInvitations = (userId: string) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		return yield* repo.listByInviter(userId);
	});
