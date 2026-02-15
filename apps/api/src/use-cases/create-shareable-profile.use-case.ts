/**
 * Create Shareable Profile Use Case
 *
 * Generates a public profile link from a completed assessment session.
 * Idempotent: same sessionId always returns the same profile.
 */

import { ProfileError } from "@workspace/contracts/errors";
import {
	AppConfig,
	AssessmentSessionRepository,
	aggregateFacetScores,
	extract4LetterCode,
	FacetEvidenceRepository,
	generateOceanCode,
	LoggerRepository,
	lookupArchetype,
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
 * Dependencies: AssessmentSessionRepository, PublicProfileRepository,
 *               FacetEvidenceRepository, LoggerRepository, AppConfig
 */
export const createShareableProfile = (input: CreateShareableProfileInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const profileRepo = yield* PublicProfileRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// 1. Get session to validate it exists
		yield* sessionRepo.getSession(input.sessionId);

		// 2. Check if profile already exists (idempotent)
		const existingProfile = yield* profileRepo.getProfileBySessionId(input.sessionId);
		if (existingProfile) {
			logger.info("Returning existing profile for session", {
				sessionId: input.sessionId,
				profileId: existingProfile.id,
			});
			return {
				publicProfileId: existingProfile.id,
				shareableUrl: `${config.frontendUrl}/profile/${existingProfile.id}`,
				isPublic: existingProfile.isPublic,
			};
		}

		// 3. Compute facet scores from evidence (on-demand)
		const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
		const facetScores = aggregateFacetScores(evidence);

		// 4. Generate OCEAN code from facet scores
		const oceanCode5 = generateOceanCode(facetScores);
		const oceanCode4 = extract4LetterCode(oceanCode5);

		// 5. Get session to extract userId
		const session = yield* sessionRepo.getSession(input.sessionId);

		if (!session.userId) {
			return yield* Effect.fail(
				new ProfileError({ message: "Cannot create a public profile for an anonymous session" }),
			);
		}

		// 6. Create profile (archetype fields derived at read-time)
		const profile = yield* profileRepo.createProfile({
			sessionId: input.sessionId,
			userId: session.userId,
			oceanCode5,
			oceanCode4,
		});

		const archetype = lookupArchetype(oceanCode4);
		logger.info("Public profile created", {
			sessionId: input.sessionId,
			profileId: profile.id,
			oceanCode5,
			archetypeName: archetype.name,
		});

		return {
			publicProfileId: profile.id,
			shareableUrl: `${config.frontendUrl}/profile/${profile.id}`,
			isPublic: profile.isPublic,
		};
	});
