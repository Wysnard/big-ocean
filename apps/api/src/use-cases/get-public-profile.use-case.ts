/**
 * Get Public Profile Use Case
 *
 * Retrieves a public personality profile by its ID.
 * Returns 403 if profile is private and the viewer is not the owner, 404 if not found.
 * Increments view count and audit log only for **public** profile views (not owner preview of a private profile).
 *
 * Archetype fields (name, description, color) and traitSummary are
 * derived at read-time from the stored OCEAN codes.
 */

import { ProfileNotFound, ProfilePrivate } from "@workspace/contracts/errors";
import {
	AssessmentResultRepository,
	deriveTraitSummary,
	extract4LetterCode,
	type FacetName,
	type FacetScoresMap,
	generateOceanCode,
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
	/** When set to the profile owner's user id, private profiles can be read (e.g. card preview on /me). */
	readonly viewerUserId: string | null;
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
	readonly userId: string | null;
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

		const isOwner =
			input.viewerUserId !== null &&
			profile.userId !== null &&
			input.viewerUserId === profile.userId;

		// 3. Private check — anonymous or non-owners cannot read private profiles
		if (!profile.isPublic && !isOwner) {
			return yield* Effect.fail(
				new ProfilePrivate({
					publicProfileId: input.publicProfileId,
					message: "This profile is private",
				}),
			);
		}

		// 4. Audit log + view count only for public profile visits (not owner previewing private)
		if (profile.isPublic) {
			const accessLogRepo = yield* ProfileAccessLogRepository;
			yield* accessLogRepo
				.logAccess({
					profileId: profile.id,
					action: "profile_view",
				})
				.pipe(Effect.fork);

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
		}

		// 5. Read persisted facet scores from assessment_results
		const result = yield* resultRepo.getBySessionId(profile.sessionId);
		if (!result || Object.keys(result.facets).length === 0) {
			return yield* Effect.fail(
				new ProfileNotFound({
					publicProfileId: input.publicProfileId,
					message: "Assessment results not found for this profile",
				}),
			);
		}
		const facets: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			facets[facetName as FacetName] = {
				score: data.score,
				confidence: data.confidence,
			};
		}

		// 6. Derive ocean codes from facet scores (single source of truth)
		const oceanCode5 = generateOceanCode(facets);
		const oceanCode4 = extract4LetterCode(oceanCode5);
		const archetype = lookupArchetype(oceanCode4);
		const traitSummary = deriveTraitSummary(oceanCode5);

		logger.info(profile.isPublic ? "Public profile viewed" : "Private profile viewed by owner", {
			profileId: profile.id,
			archetypeName: archetype.name,
		});

		return {
			archetypeName: archetype.name,
			oceanCode: OceanCode5Schema.make(oceanCode5),
			description: archetype.description,
			color: archetype.color,
			displayName: profile.displayName,
			traitSummary,
			facets,
			isPublic: profile.isPublic,
			userId: profile.userId,
		};
	});
