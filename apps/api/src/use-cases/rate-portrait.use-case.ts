/**
 * Rate Portrait Use Case (Story 19-2)
 *
 * Accepts a portrait quality rating and persists it.
 * Validates that the assessment session exists and belongs to the user.
 */

import {
	ConversationRepository,
	type DepthSignalLevel,
	type PortraitRating,
	PortraitRatingRepository,
	type PortraitType,
	Unauthorized,
} from "@workspace/domain";
import { Effect } from "effect";

export interface RatePortraitInput {
	readonly userId: string;
	readonly assessmentSessionId: string;
	readonly portraitType: PortraitType;
	readonly rating: PortraitRating;
	readonly depthSignal: DepthSignalLevel;
	readonly evidenceCount: number;
}

export const ratePortrait = (input: RatePortraitInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const ratingRepo = yield* PortraitRatingRepository;

		// Validate session exists (throws SessionNotFound if not)
		const session = yield* sessionRepo.getSession(input.assessmentSessionId);

		// Validate session ownership
		if (session.userId !== input.userId) {
			return yield* Effect.fail(new Unauthorized({ message: "Session does not belong to this user" }));
		}

		// Persist rating
		const record = yield* ratingRepo.insertRating({
			userId: input.userId,
			assessmentSessionId: input.assessmentSessionId,
			portraitType: input.portraitType,
			rating: input.rating,
			depthSignal: input.depthSignal,
			evidenceCount: input.evidenceCount,
		});

		return record;
	});
