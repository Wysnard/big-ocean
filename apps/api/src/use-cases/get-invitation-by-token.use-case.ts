/**
 * Get Invitation By Token Use-Case (Story 14.2)
 *
 * Returns invitation details for a given token. Unauthenticated —
 * used by the /invite/:token landing page (Story 14-3).
 */

import { RelationshipInvitationRepository } from "@workspace/domain";
import { Effect } from "effect";

export const getInvitationByToken = (token: string) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		const { invitation, inviterDisplayName } = yield* repo.getByTokenWithInviterName(token);
		return { invitation, inviterDisplayName };
	});
