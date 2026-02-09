/**
 * Create Shareable Profile Use Case
 *
 * Generates a public profile link from a completed assessment session.
 * Validates that all 30 facets have confidence >= 70 before allowing share.
 * Idempotent: same sessionId always returns the same profile.
 */

import { ProfileError } from "@workspace/contracts/errors";
import {
	ALL_FACETS,
	AppConfig,
	AssessmentSessionRepository,
	extract4LetterCode,
	type FacetScoresMap,
	generateOceanCode,
	LoggerRepository,
	lookupArchetype,
	PublicProfileRepository,
	ScorerRepository,
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

const REQUIRED_FACET_COUNT = 30;
const MIN_CONFIDENCE_THRESHOLD = 70;

/**
 * Create Shareable Profile Use Case
 *
 * Dependencies: AssessmentSessionRepository, PublicProfileRepository, ScorerRepository, LoggerRepository, AppConfig
 */
export const createShareableProfile = (input: CreateShareableProfileInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const profileRepo = yield* PublicProfileRepository;
		const scorer = yield* ScorerRepository;
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

		// 3. Aggregate facet scores from evidence
		const facetScores: FacetScoresMap = yield* scorer.aggregateFacetScores(input.sessionId);

		// 4. Confidence validation (AC #5): ALL 30 facets must have confidence >= 70
		const facetsWithData = ALL_FACETS.filter(
			(facetName) =>
				facetScores[facetName] && facetScores[facetName].confidence >= MIN_CONFIDENCE_THRESHOLD,
		);

		if (facetsWithData.length < REQUIRED_FACET_COUNT) {
			const lowConfidenceFacets = ALL_FACETS.filter(
				(facetName) =>
					!facetScores[facetName] || facetScores[facetName].confidence < MIN_CONFIDENCE_THRESHOLD,
			);
			logger.warn("Profile share blocked: insufficient confidence", {
				sessionId: input.sessionId,
				qualifiedFacets: facetsWithData.length,
				requiredFacets: REQUIRED_FACET_COUNT,
				lowConfidenceFacets: lowConfidenceFacets.slice(0, 5),
			});
			return yield* Effect.fail(
				new ProfileError({
					message: "Complete more of the assessment before sharing.",
				}),
			);
		}

		// 5. Generate OCEAN code from facet scores
		const oceanCode5 = generateOceanCode(facetScores);
		const oceanCode4 = extract4LetterCode(oceanCode5);

		// 6. Get session to extract userId
		const session = yield* sessionRepo.getSession(input.sessionId);

		// 7. Create profile (archetype fields derived at read-time)
		const profile = yield* profileRepo.createProfile({
			sessionId: input.sessionId,
			userId: session.userId ?? null,
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
