/**
 * Get Assessment Results Use Case
 *
 * Business logic for retrieving final assessment results.
 * Fetches persisted facet/trait scores, generates OCEAN code,
 * looks up archetype, and computes overall confidence.
 *
 * Dependencies: AssessmentSessionRepository, FacetScoreRepository,
 *               TraitScoreRepository, LoggerRepository
 */

import {
	AssessmentSessionRepository,
	BIG_FIVE_TRAITS,
	calculateConfidenceFromFacetScores,
	extract4LetterCode,
	FACET_TO_TRAIT,
	type FacetName,
	FacetScoreRepository,
	generateOceanCode,
	LoggerRepository,
	lookupArchetype,
	type TraitLevel,
	TraitScoreRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GetResultsInput {
	readonly sessionId: string;
}

export interface TraitResult {
	readonly name: string;
	readonly score: number;
	readonly level: TraitLevel;
	readonly confidence: number;
}

export interface FacetResult {
	readonly name: string;
	readonly traitName: string;
	readonly score: number;
	readonly confidence: number;
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
}

/**
 * Map trait score (0-120) to level classification
 */
const mapScoreToLevel = (score: number): TraitLevel => {
	if (score < 40) return "L";
	if (score < 80) return "M";
	return "H";
};

/**
 * Convert snake_case facet name to display name
 * e.g., "artistic_interests" → "Artistic Interests"
 */
const toDisplayName = (name: string): string =>
	name
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

/**
 * Get Assessment Results Use Case
 *
 * 1. Validates session exists
 * 2. Fetches persisted facet scores (30 facets)
 * 3. Fetches persisted trait scores (5 traits)
 * 4. Generates 5-letter OCEAN code from facet scores
 * 5. Extracts 4-letter code, looks up archetype
 * 6. Computes overall confidence (mean of all facet confidences)
 */
export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const facetScoreRepo = yield* FacetScoreRepository;
		const traitScoreRepo = yield* TraitScoreRepository;
		const logger = yield* LoggerRepository;

		// 1. Validate session exists (throws SessionNotFound if missing)
		yield* sessionRepo.getSession(input.sessionId);

		// 2. Fetch persisted scores
		const facetScoresMap = yield* facetScoreRepo.getBySession(input.sessionId);
		const traitScoresMap = yield* traitScoreRepo.getBySession(input.sessionId);

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
				level: mapScoreToLevel(traitScore.score),
				confidence: traitScore.confidence,
			};
		});

		// 7. Build facet results array
		const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => ({
			name: toDisplayName(facetName),
			traitName: FACET_TO_TRAIT[facetName],
			score: facetScoresMap[facetName].score,
			confidence: facetScoresMap[facetName].confidence,
		}));

		logger.info("Assessment results generated", {
			sessionId: input.sessionId,
			oceanCode5,
			oceanCode4,
			archetypeName: archetype.name,
			overallConfidence,
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
		} satisfies GetResultsOutput;
	});
