/**
 * Portrait Rating Mock Repository (Story 19-2)
 *
 * In-memory implementation for testing.
 */

import type {
	InsertPortraitRating,
	PortraitRatingRepository as PortraitRatingRepoType,
} from "@workspace/domain/repositories/portrait-rating.repository";
import { PortraitRatingRepository } from "@workspace/domain/repositories/portrait-rating.repository";
import type { PortraitRatingRecord } from "@workspace/domain/types/portrait-rating.types";
import { Effect, Layer } from "effect";
import { randomUUID } from "node:crypto";

const ratings: PortraitRatingRecord[] = [];

export const _resetMockState = () => {
	ratings.length = 0;
};

export const _getRatings = () => [...ratings];

export const PortraitRatingDrizzleRepositoryLive = Layer.succeed(PortraitRatingRepository, {
	insertRating: (input: InsertPortraitRating) =>
		Effect.sync(() => {
			const record: PortraitRatingRecord = {
				id: randomUUID(),
				userId: input.userId,
				assessmentSessionId: input.assessmentSessionId,
				portraitType: input.portraitType,
				rating: input.rating,
				depthSignal: input.depthSignal,
				evidenceCount: input.evidenceCount,
				createdAt: new Date(),
			};
			ratings.push(record);
			return record;
		}),
} satisfies PortraitRatingRepoType.Type);
