/**
 * Get Credits Use Case (Story 14.1)
 *
 * Returns the authenticated user's available relationship credits
 * and whether they have a completed assessment.
 *
 * Dependencies: PurchaseEventRepository, AssessmentSessionRepository
 */

import { AssessmentSessionRepository, PurchaseEventRepository } from "@workspace/domain";
import { Effect } from "effect";

export const getCredits = (userId: string) =>
	Effect.gen(function* () {
		const purchaseRepo = yield* PurchaseEventRepository;
		const sessionRepo = yield* AssessmentSessionRepository;

		const capabilities = yield* purchaseRepo.getCapabilities(userId);

		const sessions = yield* sessionRepo.getSessionsByUserId(userId);
		const hasCompletedAssessment = sessions.some((s) => s.status === "completed");

		return {
			availableCredits: capabilities.availableCredits,
			hasCompletedAssessment,
		};
	});
