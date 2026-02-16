/**
 * Get Assessment Results Use Case
 *
 * Business logic for retrieving final assessment results.
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
	FACET_TO_TRAIT,
	FacetEvidenceRepository,
	type FacetName,
	type FacetResult,
	generateOceanCode,
	LoggerRepository,
	lookupArchetype,
	PortraitGeneratorRepository,
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
 * 1. Validates session exists
 * 2. Fetches evidence via FacetEvidenceRepository
 * 3. Computes facet scores on-demand via pure aggregateFacetScores()
 * 4. Derives trait scores via pure deriveTraitScores()
 * 5. Generates 5-letter OCEAN code from facet scores
 * 6. Extracts 4-letter code, looks up archetype
 * 7. Computes overall confidence (mean of all facet confidences)
 */
export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const portraitGenerator = yield* PortraitGeneratorRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// 1. Validate session exists (throws SessionNotFound if missing)
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Linked sessions are private to their owner.
		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 2. Fetch evidence and compute scores on-demand
		const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
		const facetScoresMap = aggregateFacetScores(evidence);
		const traitScoresMap = deriveTraitScores(facetScoresMap);

		// 3. Generate OCEAN codes
		const oceanCode5 = generateOceanCode(facetScoresMap);
		const oceanCode4 = extract4LetterCode(oceanCode5);

		// 4. Lookup archetype
		const archetype = lookupArchetype(oceanCode4);

		// 5. Compute overall confidence (mean of all 30 facet confidences)
		const overallConfidence = calculateConfidenceFromFacetScores(facetScoresMap);

		// 6. Build trait results array
		const traits: TraitResult[] = BIG_FIVE_TRAITS.map((traitName) => {
			const traitScore = traitScoresMap[traitName];
			return {
				name: traitName,
				score: traitScore.score,
				level: mapScoreToLevel(traitName, traitScore.score),
				confidence: traitScore.confidence,
			};
		});

		// 7. Build facet results array
		const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => ({
			name: facetName,
			traitName: FACET_TO_TRAIT[facetName],
			score: facetScoresMap[facetName].score,
			confidence: facetScoresMap[facetName].confidence,
		}));

		// 8. Portrait generation — lazy, one-time per session
		const messages = yield* messageRepo.getMessages(input.sessionId);
		const userMessageCount = messages.filter((m) => m.role === "user").length;

		let personalDescription: string | null = session.personalDescription ?? null;

		if (personalDescription === null && userMessageCount >= config.freeTierMessageThreshold) {
			const topEvidence = [...evidence].sort((a, b) => b.confidence - a.confidence).slice(0, 10);

			personalDescription = yield* portraitGenerator
				.generatePortrait({
					sessionId: input.sessionId,
					facetScoresMap,
					topEvidence,
					archetypeName: archetype.name,
					archetypeDescription: archetype.description,
					oceanCode5,
				})
				.pipe(
					Effect.tap((portrait) =>
						sessionRepo.updateSession(input.sessionId, { personalDescription: portrait }),
					),
					Effect.catchAll((err) => {
						logger.error("Portrait generation failed", {
							sessionId: input.sessionId,
							error: String(err),
						});
						return Effect.succeed(null);
					}),
				);
		}

		logger.info("Assessment results generated", {
			sessionId: input.sessionId,
			evidenceCount: evidence.length,
			oceanCode5,
			oceanCode4,
			archetypeName: archetype.name,
			overallConfidence,
			hasPortrait: personalDescription !== null,
			traitScores: Object.fromEntries(
				BIG_FIVE_TRAITS.map((t) => [
					t,
					{ score: traitScoresMap[t].score, confidence: traitScoresMap[t].confidence },
				]),
			),
			facetScores: Object.fromEntries(
				(Object.keys(facetScoresMap) as FacetName[])
					.filter((f) => facetScoresMap[f].confidence > 0)
					.map((f) => [f, { score: facetScoresMap[f].score, confidence: facetScoresMap[f].confidence }]),
			),
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
		} satisfies GetResultsOutput;
	});
