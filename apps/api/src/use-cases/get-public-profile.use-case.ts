/**
 * Get Public Profile Use Case
 *
 * Retrieves a public personality profile by its ID.
 * Returns 403 if profile is private, 404 if not found.
 * Increments view count as fire-and-forget (never fails the GET).
 *
 * Archetype fields (name, description, color) and traitSummary are
 * derived at read-time from the stored OCEAN codes.
 */

import { ProfileNotFound, ProfilePrivate } from "@workspace/contracts/errors";
import {
	AssessmentResultRepository,
	deriveTraitSummary,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	lookupArchetype,
	type OceanCode5,
	OceanCode5Schema,
	ProfileAccessLogRepository,
	PublicProfileRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GetPublicProfileInput {
	readonly publicProfileId: string;
}

export interface GetPublicProfileOutput {
	readonly archetypeName: string;
	readonly oceanCode: OceanCode5;
	readonly description: string;
	readonly color: string;
	readonly displayName: string | null;
	readonly traitSummary: Record<string, string>;
	readonly facets: FacetScoresMap;
	readonly isPublic: boolean;
}

/**
 * Get Public Profile Use Case
 *
 * Dependencies: PublicProfileRepository, AssessmentResultRepository, LoggerRepository
 */
export const getPublicProfile = (input: GetPublicProfileInput) =>
	Effect.gen(function* () {
		const profileRepo = yield* PublicProfileRepository;
		const resultRepo = yield* AssessmentResultRepository;
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

		// 3. Private check
		if (!profile.isPublic) {
			return yield* Effect.fail(
				new ProfilePrivate({
					publicProfileId: input.publicProfileId,
					message: "This profile is private",
				}),
			);
		}

		// 4a. Fire-and-forget audit log — never fail the GET
		const accessLogRepo = yield* ProfileAccessLogRepository;
		yield* accessLogRepo
			.logAccess({
				profileId: profile.id,
				action: "profile_view",
			})
			.pipe(Effect.fork);

		// 4b. Fire-and-forget view count increment — never fail the GET
		yield* profileRepo.incrementViewCount(profile.id).pipe(
			Effect.catchAll((error) => {
				logger.warn("Failed to increment view count (non-blocking)", {
					profileId: profile.id,
					error: error instanceof Error ? error.message : String(error),
				});
				return Effect.void;
			}),
			Effect.fork,
		);

		// 5. Derive archetype fields at read-time
		const archetype = lookupArchetype(profile.oceanCode4);
		const traitSummary = deriveTraitSummary(profile.oceanCode5);

		// 6. Read persisted facet scores from assessment_results
		const result = yield* resultRepo.getBySessionId(profile.sessionId);
		const facets: FacetScoresMap = {} as FacetScoresMap;
		if (result && Object.keys(result.facets).length > 0) {
			for (const [facetName, data] of Object.entries(result.facets)) {
				facets[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		logger.info("Public profile viewed", {
			profileId: profile.id,
			archetypeName: archetype.name,
		});

		return {
			archetypeName: archetype.name,
			oceanCode: OceanCode5Schema.make(profile.oceanCode5),
			description: archetype.description,
			color: archetype.color,
			displayName: profile.displayName,
			traitSummary,
			facets,
			isPublic: profile.isPublic,
		};
	});
