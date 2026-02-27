/**
 * Get Relationship State Use-Case (Story 14.4)
 *
 * Implements Decision Tree 1 from Dev Notes to resolve the correct
 * RelationshipCardState for a user's results page.
 */

import type { RelationshipCardState } from "@workspace/contracts/http/groups/relationship";
import {
	PurchaseEventRepository,
	RelationshipAnalysisRepository,
	RelationshipInvitationRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export const getRelationshipState = (userId: string) =>
	Effect.gen(function* () {
		const invitationRepo = yield* RelationshipInvitationRepository;
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const purchaseRepo = yield* PurchaseEventRepository;

		// 1. Check invitations where user is the invitee (pending-received takes priority)
		const inviteeInvitations = yield* invitationRepo.listByInvitee(userId);
		for (const inv of inviteeInvitations) {
			if (inv.status === "pending") {
				return {
					_tag: "pending-received",
					inviterName: "Someone",
					invitationId: inv.id,
				} satisfies RelationshipCardState;
			}
		}

		// 2. Check invitee-side accepted invitations via analyses
		const analyses = yield* analysisRepo.getByUserId(userId);

		// 3. Check inviter-side invitations
		const inviterInvitations = yield* invitationRepo.listByInviter(userId);

		// Prioritize states: ready > generating > pending-sent > declined
		// First pass: check for ready/generating across both sides
		for (const analysis of analyses) {
			if (analysis.content !== null) {
				return {
					_tag: "ready",
					analysisId: analysis.id,
					partnerName: "Your partner",
				} satisfies RelationshipCardState;
			}
		}

		for (const inv of inviterInvitations) {
			if (inv.status === "accepted") {
				const analysis = yield* analysisRepo.getByInvitationId(inv.id);
				if (analysis && analysis.content !== null) {
					return {
						_tag: "ready",
						analysisId: analysis.id,
						partnerName: "Your partner",
					} satisfies RelationshipCardState;
				}
			}
		}

		// Check for generating state (either side)
		for (const analysis of analyses) {
			if (analysis.content === null) {
				return { _tag: "generating" } satisfies RelationshipCardState;
			}
		}

		for (const inv of inviterInvitations) {
			if (inv.status === "accepted") {
				const analysis = yield* analysisRepo.getByInvitationId(inv.id);
				if (analysis && analysis.content === null) {
					return { _tag: "generating" } satisfies RelationshipCardState;
				}
				// Accepted but no analysis row yet = still generating
				if (!analysis) {
					return { _tag: "generating" } satisfies RelationshipCardState;
				}
			}
		}

		// Check for pending-sent
		for (const inv of inviterInvitations) {
			if (inv.status === "pending") {
				return {
					_tag: "pending-sent",
					inviteeName: "Someone",
				} satisfies RelationshipCardState;
			}
		}

		// Check for declined
		for (const inv of inviterInvitations) {
			if (inv.status === "refused") {
				return {
					_tag: "declined",
					inviteeName: "Someone",
				} satisfies RelationshipCardState;
			}
		}

		// 4. No invitations — check credits
		const capabilities = yield* purchaseRepo.getCapabilities(userId);
		if (capabilities.availableCredits > 0) {
			return {
				_tag: "invite-prompt",
				availableCredits: capabilities.availableCredits,
			} satisfies RelationshipCardState;
		}

		return { _tag: "no-credits" } satisfies RelationshipCardState;
	});
