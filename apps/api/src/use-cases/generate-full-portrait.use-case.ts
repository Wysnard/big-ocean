/**
 * Generate Full Portrait Use Case (Story 13.3)
 *
 * Background generation of full personality portrait after purchase.
 * Called by forkDaemon from process-purchase use-case.
 *
 * Uses existing PortraitGeneratorRepository (Sonnet) with Spine prompt.
 * Updates portrait placeholder row on success, increments retry_count on failure.
 */

import {
	AssessmentMessageRepository,
	AssessmentResultRepository,
	extract4LetterCode,
	type FacetName,
	type FacetScoresMap,
	FinalizationEvidenceRepository,
	generateOceanCode,
	LoggerRepository,
	lookupArchetype,
	PortraitGeneratorRepository,
	PortraitRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

export interface GenerateFullPortraitInput {
	readonly portraitId: string;
	readonly sessionId: string;
}

export interface GenerateFullPortraitOutput {
	readonly success: boolean;
}

/**
 * Generate full portrait for a completed assessment.
 *
 * This runs in a background daemon fiber. It:
 * 1. Loads all required data (result, evidence, messages)
 * 2. Calls PortraitGeneratorRepository.generatePortrait with retry
 * 3. Updates placeholder row with content on success
 * 4. Increments retry_count on failure
 */
export const generateFullPortrait = (input: GenerateFullPortraitInput) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;
		const portraitGen = yield* PortraitGeneratorRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const evidenceRepo = yield* FinalizationEvidenceRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;

		logger.info("Starting full portrait generation", {
			portraitId: input.portraitId,
			sessionId: input.sessionId,
		});

		// 1. Load assessment result
		const result = yield* resultsRepo.getBySessionId(input.sessionId);
		if (!result) {
			logger.error("Assessment result not found for portrait generation", {
				sessionId: input.sessionId,
			});
			yield* portraitRepo.incrementRetryCount(input.portraitId);
			return { success: false };
		}

		// 2. Load finalization evidence
		const evidenceRecords = yield* evidenceRepo.getByResultId(result.id);

		// 3. Load messages for portrait context
		const messages = yield* messageRepo.getMessages(input.sessionId);

		// 4. Convert evidence records to SavedFacetEvidence format
		const allEvidence: SavedFacetEvidence[] = evidenceRecords.map((e) => ({
			id: e.id,
			bigfiveFacet: e.bigfiveFacet,
			score: e.score,
			confidence: e.confidence,
			domain: e.domain,
			rawDomain: e.rawDomain,
			quote: e.quote,
			highlightRange:
				e.highlightStart !== null && e.highlightEnd !== null
					? { start: e.highlightStart, end: e.highlightEnd }
					: null,
		}));

		// 5. Build facet scores map from result
		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
				facetScoresMap[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		// 6. Generate OCEAN code and lookup archetype
		const oceanCode5 = generateOceanCode(facetScoresMap);
		const oceanCode4 = extract4LetterCode(oceanCode5);
		const archetype = lookupArchetype(oceanCode4);

		// 7. Generate portrait with retry (3 total LLM attempts)
		const content = yield* portraitGen
			.generatePortrait({
				sessionId: input.sessionId,
				facetScoresMap,
				allEvidence,
				archetypeName: archetype.name,
				archetypeDescription: archetype.description,
				oceanCode5,
				messages: messages.map((m) => ({
					role: m.role,
					content: m.content,
				})),
			})
			.pipe(
				Effect.retry({
					times: 2, // 3 total attempts
					schedule: Schedule.exponential("2 seconds"),
				}),
				Effect.catchAll((error) =>
					Effect.gen(function* () {
						// Log error and increment retry count for daemon invocation
						logger.error("Portrait generation failed after retries", {
							portraitId: input.portraitId,
							sessionId: input.sessionId,
							error: error._tag,
						});
						yield* portraitRepo.incrementRetryCount(input.portraitId);
						return yield* Effect.fail(error);
					}),
				),
			);

		// 8. Update placeholder with generated content (idempotent)
		yield* portraitRepo.updateContent(input.portraitId, content).pipe(
			Effect.catchTag("PortraitNotFoundError", () => {
				// Portrait already has content (idempotent) — log and succeed
				logger.info("Portrait already has content, skipping update", {
					portraitId: input.portraitId,
				});
				return Effect.succeed(undefined);
			}),
		);

		logger.info("Full portrait generation completed", {
			portraitId: input.portraitId,
			sessionId: input.sessionId,
			contentLength: content.length,
		});

		return { success: true };
	});
