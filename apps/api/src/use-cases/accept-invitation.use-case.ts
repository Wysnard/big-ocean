/**
 * Accept Invitation Use-Case (Story 14.3, extended Story 14.4)
 *
 * Accepts a relationship invitation for the authenticated user.
 * Self-invitation guard, status check, and expiry are all enforced
 * atomically in the repository's WHERE clause.
 *
 * After acceptance, inserts a placeholder analysis row and forks
 * a daemon to generate the relationship analysis in the background.
 */

import {
	RelationshipAnalysisRepository,
	RelationshipInvitationRepository,
} from "@workspace/domain";
import { Effect } from "effect";
import { generateRelationshipAnalysis } from "./generate-relationship-analysis.use-case";

export const acceptInvitation = (input: { token: string; inviteeUserId: string }) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		const analysisRepo = yield* RelationshipAnalysisRepository;

		const updated = yield* repo.acceptInvitation({
			token: input.token,
			inviteeUserId: input.inviteeUserId,
		});

		// Canonical user ordering: userAId = MIN, userBId = MAX
		const inviterUserId = updated.inviterUserId;
		const inviteeUserId = updated.inviteeUserId!;
		const userAId = inviterUserId < inviteeUserId ? inviterUserId : inviteeUserId;
		const userBId = inviterUserId < inviteeUserId ? inviteeUserId : inviterUserId;

		// Insert placeholder — returns null if already exists (onConflictDoNothing on invitation_id unique constraint)
		const analysis = yield* analysisRepo.insertPlaceholder({
			invitationId: updated.id,
			userAId,
			userBId,
		});

		// Fork daemon to generate analysis in the background
		if (analysis) {
			yield* Effect.forkDaemon(
				generateRelationshipAnalysis({
					analysisId: analysis.id,
					inviterUserId,
					inviteeUserId,
				}),
			);
		}

		return { invitation: updated };
	});
