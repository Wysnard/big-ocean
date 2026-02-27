/**
 * Refuse Invitation Use-Case (Story 14.3)
 *
 * Refuses a relationship invitation. No self-invitation guard needed —
 * refusing your own invitation is a no-op edge case, not a security concern.
 */

import { RelationshipInvitationRepository } from "@workspace/domain";
import { Effect } from "effect";

export const refuseInvitation = (token: string) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		const updated = yield* repo.refuseInvitation({ token });
		return { invitation: updated };
	});
