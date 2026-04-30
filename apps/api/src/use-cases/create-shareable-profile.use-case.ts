/**
 * Create Shareable Profile Use Case
 *
 * Returns the shareable link for an existing **Public profile row (shareable)**.
 * The row is provisioned only during **Assessment Finalization** (`ensurePublicProfileForSession`
 * in `generate-results`); this Module does not create rows.
 *
 * Idempotent: same sessionId always returns the same profile when it exists.
 */

import { ProfileError } from "@workspace/contracts/errors";
import {
	AppConfig,
	ConversationRepository,
	LoggerRepository,
	PublicProfileNotProvisioned,
	PublicProfileRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface CreateShareableProfileInput {
	readonly sessionId: string;
}

export interface CreateShareableProfileOutput {
	readonly publicProfileId: string;
	readonly shareableUrl: string;
	readonly isPublic: boolean;
}

/**
 * Create Shareable Profile Use Case
 *
 * Dependencies: ConversationRepository, PublicProfileRepository, LoggerRepository, AppConfig
 */
export const createShareableProfile = (input: CreateShareableProfileInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const profileRepo = yield* PublicProfileRepository;
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const session = yield* sessionRepo.getSession(input.sessionId);

		const existingProfile = yield* profileRepo.getProfileBySessionId(input.sessionId);
		if (existingProfile) {
			logger.info("Returning existing profile for session", {
				sessionId: input.sessionId,
				profileId: existingProfile.id,
			});
			return {
				publicProfileId: existingProfile.id,
				shareableUrl: `${config.frontendUrl}/public-profile/${existingProfile.id}`,
				isPublic: existingProfile.isPublic,
			};
		}

		if (!session.userId) {
			return yield* Effect.fail(
				new ProfileError({ message: "Cannot share a public profile for an unowned session" }),
			);
		}

		return yield* Effect.fail(
			new PublicProfileNotProvisioned({
				sessionId: input.sessionId,
				message: "Public profile row missing — complete Assessment Finalization before sharing",
			}),
		);
	});
