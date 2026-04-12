/**
 * Generate Full Portrait Use Case (Story 13.3, refactored for queue-based generation)
 *
 * Background generation of full personality portrait after purchase.
 * Called by the portrait generation worker fiber.
 *
 * Flow:
 * 1. Load assessment result, evidence, messages
 * 2. Call LLM with Effect.retry (3 total attempts, exponential backoff)
 * 3. On success: insert portrait row with content
 * 4. On failure: insert portrait row with failedAt
 */

import {
	AppConfig,
	AssessmentResultRepository,
	ConversationEvidenceRepository,
	computeTraitResults,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	MessageRepository,
	PortraitGeneratorRepository,
	PortraitRepository,
} from "@workspace/domain";
import type { EvidenceInput } from "@workspace/domain/types/evidence";
import { Effect, Schedule } from "effect";

export interface GenerateFullPortraitInput {
	readonly sessionId: string;
}

/**
 * Generate full portrait for a completed assessment.
 *
 * Runs in a background worker fiber. Inserts a portrait row on completion:
 * - Success: row with content + modelUsed
 * - Failure: row with failedAt timestamp
 */
export const generateFullPortrait = (input: GenerateFullPortraitInput) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;
		const portraitGen = yield* PortraitGeneratorRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const conversationEvidenceRepo = yield* ConversationEvidenceRepository;
		const messageRepo = yield* MessageRepository;
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		logger.info("Starting full portrait generation", {
			sessionId: input.sessionId,
		});

		// 1. Load assessment result
		const result = yield* resultsRepo.getBySessionId(input.sessionId);
		if (!result) {
			logger.error("Assessment result not found for portrait generation", {
				sessionId: input.sessionId,
			});
			yield* portraitRepo.insertFailed({
				assessmentResultId: "unknown",
				tier: "full",
				failedAt: new Date(),
			});
			return;
		}

		// 2. Load conversation evidence (authoritative source — Story 18-6)
		const conversationEvidence = yield* conversationEvidenceRepo.findBySession(input.sessionId);

		// 3. Load messages for portrait context
		const messages = yield* messageRepo.getMessages(input.sessionId);

		// 4. Build facet scores map from result
		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
				facetScoresMap[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		// 5. Derive trait scores from facets (derive-at-read pattern)
		const traitScoresMap = computeTraitResults(facetScoresMap);

		// 6. Map conversation evidence to EvidenceInput for depth signal
		const scoringEvidence: EvidenceInput[] = conversationEvidence.map((ev) => ({
			bigfiveFacet: ev.bigfiveFacet,
			deviation: ev.deviation as -3 | -2 | -1 | 0 | 1 | 2 | 3,
			strength: ev.strength,
			confidence: ev.confidence,
			domain: ev.domain,
		}));

		// 7. Generate portrait with retry (3 total LLM attempts, exponential backoff)
		const contentResult = yield* portraitGen
			.generatePortrait({
				sessionId: input.sessionId,
				facetScoresMap,
				traitScoresMap,
				allEvidence: conversationEvidence,
				scoringEvidence,
				messages: messages.map((m) => ({
					id: m.id,
					role: m.role,
					content: m.content,
				})),
			})
			.pipe(
				Effect.retry({
					times: 2,
					schedule: Schedule.exponential("5 seconds"),
				}),
				Effect.map((content) => ({ _tag: "success" as const, content })),
				Effect.catchAll((error) =>
					Effect.sync(() => {
						logger.error("Portrait generation failed after retries", {
							sessionId: input.sessionId,
							error: error._tag,
						});
						return { _tag: "failure" as const, error };
					}),
				),
			);

		// 9. Insert portrait row based on outcome
		if (contentResult._tag === "success") {
			yield* portraitRepo.insertWithContent({
				assessmentResultId: result.id,
				tier: "full",
				content: contentResult.content,
				modelUsed: config.portraitModelId,
			});

			logger.info("Full portrait generation completed", {
				sessionId: input.sessionId,
				contentLength: contentResult.content.length,
			});
		} else {
			yield* portraitRepo.insertFailed({
				assessmentResultId: result.id,
				tier: "full",
				failedAt: new Date(),
			});

			logger.error("Portrait generation failed, inserted failure record", {
				sessionId: input.sessionId,
			});
		}
	});
