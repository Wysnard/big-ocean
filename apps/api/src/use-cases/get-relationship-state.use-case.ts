/**
 * Get Relationship State Use-Case (Story 14.4, updated Story 34-1)
 *
 * Resolves the correct RelationshipCardState for a user's results page.
 * Updated: uses QR tokens instead of invitations.
 */

import type { RelationshipCardState } from "@workspace/contracts/http/groups/relationship";
import {
	PurchaseEventRepository,
	QrTokenRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export const getRelationshipState = (userId: string) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const purchaseRepo = yield* PurchaseEventRepository;

		// 1. Check for existing analyses
		const analyses = yield* analysisRepo.getByUserId(userId);

		// Prioritize states: ready > generating
		for (const analysis of analyses) {
			if (analysis.content !== null) {
				return {
					_tag: "ready",
					analysisId: analysis.id,
					partnerName: "Your partner",
				} satisfies RelationshipCardState;
			}
		}

		for (const analysis of analyses) {
			if (analysis.content === null) {
				return { _tag: "generating" } satisfies RelationshipCardState;
			}
		}

		// 2. Check for active QR token
		const activeToken = yield* qrTokenRepo.getActiveByUserId(userId);
		if (activeToken) {
			return {
				_tag: "qr-active",
				token: activeToken.token,
			} satisfies RelationshipCardState;
		}

		// 3. Check credits
		const capabilities = yield* purchaseRepo.getCapabilities(userId);
		if (capabilities.availableCredits > 0) {
			return {
				_tag: "invite-prompt",
				availableCredits: capabilities.availableCredits,
			} satisfies RelationshipCardState;
		}

		return { _tag: "no-credits" } satisfies RelationshipCardState;
	});
