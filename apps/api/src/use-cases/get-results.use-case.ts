/**
 * Get Assessment Results Use Case
 *
 * Business logic for retrieving final assessment results.
 * Read-only after Story 11.1 — no lazy finalization. If session is not
 * "completed", returns SessionNotCompleted error.
 *
 * Reads persisted scores from assessment_results, generates OCEAN code,
 * looks up archetype, and computes overall confidence.
 *
 * Dependencies: ConversationRepository, AssessmentResultRepository, LoggerRepository
 */

import {
	AppConfig,
	AssessmentResultError,
	AssessmentResultRepository,
	BIG_FIVE_TRAITS,
	buildFacetScoresMap,
	ConversationRepository,
	calculateConfidenceFromFacetScores,
	computeTraitResults,
	deriveAssessmentSurfaceFromFacetScores,
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetName,
	type FacetResult,
	type FacetScoresMap,
	getFacetLevel,
	isLatestVersion,
	LoggerRepository,
	MessageRepository,
	PublicProfileRepository,
	SessionNotCompleted,
	SessionNotFound,
	TRAIT_LETTER_MAP,
	type TraitResult,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GetResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
}

export interface GetResultsOutput {
	readonly oceanCode5: string;
	readonly oceanCode4: string;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly archetypeColor: string;
	readonly isCurated: boolean;
	readonly traits: readonly TraitResult[];
	readonly facets: readonly FacetResult[];
	readonly overallConfidence: number;
	readonly messageCount: number;
	readonly publicProfileId: string | null;
	readonly shareableUrl: string | null;
	readonly isPublic: boolean | null;
	readonly isLatestVersion: boolean;
}

/**
 * Map trait score (0-120) to trait-specific level letter
 */
const mapScoreToLevel = (traitName: string, score: number): string => {
	const letters = TRAIT_LETTER_MAP[traitName as keyof typeof TRAIT_LETTER_MAP];
	if (score < 40) return letters[0];
	if (score < 80) return letters[1];
	return letters[2];
};

/**
 * Get Assessment Results Use Case
 *
 * 1. Validates session exists and is completed
 * 2. Reads persisted facet/trait scores from AssessmentResultRepository
 * 3. Generates OCEAN codes, looks up archetype
 * 4. Computes overall confidence (mean of all facet confidences)
 */
export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const messageRepo = yield* MessageRepository;
		const profileRepo = yield* PublicProfileRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// 1. Validate session exists
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Ownership guard
		if (session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		if (session.status !== "completed") {
			return yield* Effect.fail(
				new SessionNotCompleted({
					sessionId: input.sessionId,
					currentStatus: session.status,
					message: `Session is '${session.status}', results are not ready yet`,
				}),
			);
		}

		// 3. Fetch messages for count
		const messages = yield* messageRepo.getMessages(input.sessionId);

		// 4. Read persisted scores from assessment_results
		const result = yield* resultRepo.getBySessionId(input.sessionId);
		if (!result || Object.keys(result.facets).length === 0) {
			return yield* Effect.fail(
				new AssessmentResultError({
					message: `Assessment results not found for completed session '${input.sessionId}'`,
				}),
			);
		}

		// Extract FacetScoresMap (score + confidence)
		const facetScoresMap: FacetScoresMap = buildFacetScoresMap(result.facets);

		// Recompute trait scores from facets (single source of truth)
		const computedTraits = computeTraitResults(facetScoresMap);

		// 5. Derive OCEAN codes + archetype
		const projection = deriveAssessmentSurfaceFromFacetScores(facetScoresMap);

		// 7. Compute overall confidence (mean of all 30 facet confidences, 0-1 scale)
		const overallConfidence =
			Math.round(calculateConfidenceFromFacetScores(facetScoresMap) * 100) / 100;

		// 8. Build trait results array
		const traits: TraitResult[] = BIG_FIVE_TRAITS.map((traitName) => {
			const traitScore = computedTraits[traitName];
			return {
				name: traitName,
				score: Math.round(traitScore.score),
				level: mapScoreToLevel(traitName, traitScore.score),
				confidence: traitScore.confidence,
			};
		});

		// 9. Build facet results array with level fields (Story 11.4)
		const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => {
			const facetData = facetScoresMap[facetName];
			const level = getFacetLevel(facetName, facetData.score);
			const levelLabel = FACET_LEVEL_LABELS[level];
			// Cast needed: TS can't narrow level to specific facet's valid codes
			const levelDescription =
				FACET_DESCRIPTIONS[facetName].levels[
					level as keyof (typeof FACET_DESCRIPTIONS)[typeof facetName]["levels"]
				];
			// Type guard: getFacetLevel guarantees valid level code for this facet
			if (levelDescription === undefined) {
				throw new Error(`Missing facet description for ${facetName}:${level}`);
			}
			return {
				name: facetName,
				traitName: FACET_TO_TRAIT[facetName],
				score: Math.round(facetData.score),
				confidence: facetData.confidence,
				level,
				levelLabel,
				levelDescription,
			};
		});

		// 10. Determine version status (Story 36-3, fail-open: default to latest on error)
		let latestVersion = true;
		const latestResult = yield* resultRepo
			.getLatestByUserId(input.authenticatedUserId)
			.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null)));
		latestVersion = isLatestVersion(result.id, latestResult?.id ?? null);

		// 11. Ensure public profile exists for authenticated users (private by default)
		let existingProfile = yield* profileRepo
			.getProfileBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));

		if (existingProfile === null) {
			existingProfile = yield* profileRepo
				.createProfile({
					sessionId: input.sessionId,
					userId: input.authenticatedUserId,
				})
				.pipe(Effect.catchAll(() => Effect.succeed(null)));
		}

		logger.info("Assessment results retrieved", {
			sessionId: input.sessionId,
			oceanCode5: projection.oceanCode5,
			oceanCode4: projection.oceanCode4,
			archetypeName: projection.archetype.name,
			overallConfidence,
		});

		return {
			oceanCode5: projection.oceanCode5,
			oceanCode4: projection.oceanCode4,
			archetypeName: projection.archetype.name,
			archetypeDescription: projection.archetype.description,
			archetypeColor: projection.archetype.color,
			isCurated: projection.archetype.isCurated,
			traits,
			facets,
			overallConfidence,
			messageCount: messages.length,
			publicProfileId: existingProfile?.id ?? null,
			shareableUrl: existingProfile
				? `${config.frontendUrl}/public-profile/${existingProfile.id}`
				: null,
			isPublic: existingProfile?.isPublic ?? null,
			isLatestVersion: latestVersion,
		} satisfies GetResultsOutput;
	});
