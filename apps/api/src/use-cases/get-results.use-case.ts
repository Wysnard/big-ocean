/**
 * Get Assessment Results Use Case
 *
 * Business logic for retrieving final assessment results.
 * Read-only after Story 11.1 — no lazy finalization. If session is not
 * "completed", returns SessionNotCompleted error.
 *
 * Fetches evidence, computes scores on-demand via pure domain functions,
 * generates OCEAN code, looks up archetype, and computes overall confidence.
 *
 * Dependencies: AssessmentSessionRepository, FacetEvidenceRepository, LoggerRepository
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateFacetScores,
	BIG_FIVE_TRAITS,
	calculateConfidenceFromFacetScores,
	deriveTraitScores,
	extract4LetterCode,
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	FacetEvidenceRepository,
	type FacetName,
	type FacetResult,
	generateOceanCode,
	getFacetLevel,
	LoggerRepository,
	lookupArchetype,
	PublicProfileRepository,
	SessionNotCompleted,
	SessionNotFound,
	TRAIT_LETTER_MAP,
	type TraitResult,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GetResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId?: string;
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
	readonly personalDescription: string | null;
	readonly messageCount: number;
	readonly publicProfileId: string | null;
	readonly shareableUrl: string | null;
	readonly isPublic: boolean | null;
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
 * Get Assessment Results Use Case (read-only after Story 11.1)
 *
 * 1. Validates session exists and is completed
 * 2. Fetches evidence via FacetEvidenceRepository
 * 3. Computes facet/trait scores on-demand via pure domain functions
 * 4. Generates OCEAN codes, looks up archetype
 * 5. Computes overall confidence (mean of all facet confidences)
 */
export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const profileRepo = yield* PublicProfileRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// 1. Validate session exists
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Ownership guard
		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 2. Guard: session must be completed (Story 11.1 — no lazy finalization)
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

		// 4. Fetch evidence and compute scores on-demand
		const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
		const facetScoresMap = aggregateFacetScores(evidence);
		const traitScoresMap = deriveTraitScores(facetScoresMap);

		// 5. Generate OCEAN codes
		const oceanCode5 = generateOceanCode(facetScoresMap);
		const oceanCode4 = extract4LetterCode(oceanCode5);

		// 6. Lookup archetype
		const archetype = lookupArchetype(oceanCode4);

		// 7. Compute overall confidence (mean of all 30 facet confidences)
		const overallConfidence = calculateConfidenceFromFacetScores(facetScoresMap);

		// 8. Build trait results array
		const traits: TraitResult[] = BIG_FIVE_TRAITS.map((traitName) => {
			const traitScore = traitScoresMap[traitName];
			return {
				name: traitName,
				score: traitScore.score,
				level: mapScoreToLevel(traitName, traitScore.score),
				confidence: traitScore.confidence,
			};
		});

		// 9. Build facet results array with level fields (Story 11.4)
		const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => {
			const facetData = facetScoresMap[facetName];
			const level = getFacetLevel(facetName, facetData.score);
			const levelLabel = FACET_LEVEL_LABELS[level];
			const levelDescription = FACET_DESCRIPTIONS[facetName].levels[level];
			// Type guard: getFacetLevel guarantees valid level code for this facet
			if (levelDescription === undefined) {
				throw new Error(`Missing facet description for ${facetName}:${level}`);
			}
			return {
				name: facetName,
				traitName: FACET_TO_TRAIT[facetName],
				score: facetData.score,
				confidence: facetData.confidence,
				level,
				levelLabel,
				levelDescription,
			};
		});

		// 10. Read stored portrait description
		const personalDescription = session.personalDescription?.trim()
			? session.personalDescription
			: null;

		// 11. Ensure public profile exists for authenticated users (private by default)
		let existingProfile = yield* profileRepo
			.getProfileBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));

		if (existingProfile === null && input.authenticatedUserId != null) {
			existingProfile = yield* profileRepo
				.createProfile({
					sessionId: input.sessionId,
					userId: input.authenticatedUserId,
					oceanCode5,
					oceanCode4,
				})
				.pipe(Effect.catchAll(() => Effect.succeed(null)));
		}

		logger.info("Assessment results retrieved", {
			sessionId: input.sessionId,
			evidenceCount: evidence.length,
			oceanCode5,
			oceanCode4,
			archetypeName: archetype.name,
			overallConfidence,
			hasPortrait: personalDescription !== null,
		});

		return {
			oceanCode5,
			oceanCode4,
			archetypeName: archetype.name,
			archetypeDescription: archetype.description,
			archetypeColor: archetype.color,
			isCurated: archetype.isCurated,
			traits,
			facets,
			overallConfidence,
			personalDescription,
			messageCount: messages.length,
			publicProfileId: existingProfile?.id ?? null,
			shareableUrl: existingProfile
				? `${config.frontendUrl}/public-profile/${existingProfile.id}`
				: null,
			isPublic: existingProfile?.isPublic ?? null,
		} satisfies GetResultsOutput;
	});
