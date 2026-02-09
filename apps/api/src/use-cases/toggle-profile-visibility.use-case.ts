/**
 * Toggle Profile Visibility Use Case
 *
 * Toggles the public/private visibility of a profile.
 * Only the profile owner can toggle visibility.
 */

import { ProfileNotFound, Unauthorized } from "@workspace/contracts/errors";
import { LoggerRepository, PublicProfileRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface ToggleProfileVisibilityInput {
	readonly publicProfileId: string;
	readonly isPublic: boolean;
	readonly authenticatedUserId: string;
}

export interface ToggleProfileVisibilityOutput {
	readonly isPublic: boolean;
}

/**
 * Toggle Profile Visibility Use Case
 *
 * Dependencies: PublicProfileRepository, LoggerRepository
 */
export const toggleProfileVisibility = (input: ToggleProfileVisibilityInput) =>
	Effect.gen(function* () {
		const profileRepo = yield* PublicProfileRepository;
		const logger = yield* LoggerRepository;

		// 1. Get profile
		const profile = yield* profileRepo.getProfile(input.publicProfileId);

		// 2. Not found
		if (!profile) {
			return yield* Effect.fail(
				new ProfileNotFound({
					publicProfileId: input.publicProfileId,
					message: `Profile '${input.publicProfileId}' not found`,
				}),
			);
		}

		// 3. Ownership check
		if (profile.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new Unauthorized({
					message: "You are not authorized to modify this profile",
				}),
			);
		}

		// 4. Toggle visibility
		yield* profileRepo.toggleVisibility(input.publicProfileId, input.isPublic);

		logger.info("Profile visibility toggled", {
			profileId: input.publicProfileId,
			isPublic: input.isPublic,
			userId: input.authenticatedUserId,
		});

		return {
			isPublic: input.isPublic,
		};
	});
