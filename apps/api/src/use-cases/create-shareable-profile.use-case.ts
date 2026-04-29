/**
 * Create Shareable Profile Use Case
 *
 * Generates a public profile link from a completed assessment session.
 * Idempotent: same sessionId always returns the same profile.
 */

import { ProfileError } from "@workspace/contracts/errors";
import {
	AppConfig,
	AssessmentResultRepository,
	buildFacetScoresMap,
	ConversationRepository,
	deriveAssessmentSurfaceFromFacetScores,
	LoggerRepository,
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
 * Dependencies: ConversationRepository, PublicProfileRepository,
 *               AssessmentResultRepository, LoggerRepository, AppConfig
 */
export const createShareableProfile = (input: CreateShareableProfileInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const profileRepo = yield* PublicProfileRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// 1. Get session to validate it exists and extract userId
		const session = yield* sessionRepo.getSession(input.sessionId);

		// 2. Check if profile already exists (idempotent)
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

		// 3. Read persisted facet scores from assessment_results
		const result = yield* resultRepo.getBySessionId(input.sessionId);
		if (!result || Object.keys(result.facets).length === 0) {
			return yield* Effect.fail(
				new ProfileError({ message: "Assessment results not found for this session" }),
			);
		}
		const projection = deriveAssessmentSurfaceFromFacetScores(buildFacetScoresMap(result.facets));

		// 5. Validate session has userId
		if (!session.userId) {
			return yield* Effect.fail(
				new ProfileError({ message: "Cannot create a public profile for an unowned session" }),
			);
		}

		// 6. Create profile (archetype fields derived at read-time)
		const profile = yield* profileRepo.createProfile({
			sessionId: input.sessionId,
			userId: session.userId,
		});
		logger.info("Public profile created", {
			sessionId: input.sessionId,
			profileId: profile.id,
			oceanCode5: projection.oceanCode5,
			archetypeName: projection.archetype.name,
		});

		return {
			publicProfileId: profile.id,
			shareableUrl: `${config.frontendUrl}/public-profile/${profile.id}`,
			isPublic: profile.isPublic,
		};
	});
