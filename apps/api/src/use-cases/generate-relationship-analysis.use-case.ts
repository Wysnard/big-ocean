/**
 * Generate Relationship Analysis Use Case (Story 14.4)
 *
 * Background daemon that generates a personality comparison analysis
 * for two users. Called by forkDaemon from accept-invitation use-case.
 *
 * Follows generate-full-portrait.use-case.ts pattern exactly.
 */

import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	type FacetName,
	type FacetScoresMap,
	FinalizationEvidenceRepository,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

export interface GenerateRelationshipAnalysisInput {
	readonly analysisId: string;
	readonly inviterUserId: string;
	readonly inviteeUserId: string;
}

export interface GenerateRelationshipAnalysisOutput {
	readonly success: boolean;
}

/**
 * Load a user's assessment data: facet scores and evidence.
 * Returns null if the user has no completed assessment.
 */
const loadUserAssessmentData = (userId: string) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const evidenceRepo = yield* FinalizationEvidenceRepository;

		const session = yield* sessionRepo.findSessionByUserId(userId);
		if (!session) return null;

		const result = yield* resultsRepo.getBySessionId(session.id);
		if (!result) return null;

		const evidenceRecords = yield* evidenceRepo.getByResultId(result.id);

		const allEvidence: SavedFacetEvidence[] = evidenceRecords.map((e) => ({
			id: e.id,
			assessmentMessageId: e.assessmentMessageId,
			facetName: e.bigfiveFacet,
			score: e.score,
			confidence: e.confidence,
			quote: e.quote,
			highlightRange:
				e.highlightStart !== null && e.highlightEnd !== null
					? { start: e.highlightStart, end: e.highlightEnd }
					: { start: 0, end: e.quote.length },
			createdAt: e.createdAt,
		}));

		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
				facetScoresMap[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		return { facetScoresMap, evidence: allEvidence };
	});

export const generateRelationshipAnalysis = (input: GenerateRelationshipAnalysisInput) =>
	Effect.gen(function* () {
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const analysisGen = yield* RelationshipAnalysisGeneratorRepository;
		const logger = yield* LoggerRepository;

		logger.info("Starting relationship analysis generation", {
			analysisId: input.analysisId,
			inviterUserId: input.inviterUserId,
			inviteeUserId: input.inviteeUserId,
		});

		// 1. Load inviter's assessment data
		const inviterData = yield* loadUserAssessmentData(input.inviterUserId);
		if (!inviterData) {
			logger.error("Inviter assessment data not found", { userId: input.inviterUserId });
			yield* analysisRepo.incrementRetryCount(input.analysisId);
			return { success: false };
		}

		// 2. Load invitee's assessment data — may not exist yet (invitee still assessing)
		const inviteeData = yield* loadUserAssessmentData(input.inviteeUserId);
		if (!inviteeData) {
			logger.info("Invitee assessment data not found yet, will retry", {
				userId: input.inviteeUserId,
			});
			yield* analysisRepo.incrementRetryCount(input.analysisId);
			return { success: false };
		}

		// 3. Call LLM with retry (3 total attempts)
		const result = yield* analysisGen
			.generateAnalysis({
				userAFacetScores: inviterData.facetScoresMap,
				userAEvidence: inviterData.evidence,
				userAName: "Person A",
				userBFacetScores: inviteeData.facetScoresMap,
				userBEvidence: inviteeData.evidence,
				userBName: "Person B",
			})
			.pipe(
				Effect.retry({
					times: 2,
					schedule: Schedule.exponential("2 seconds"),
				}),
				Effect.catchAll((error) =>
					Effect.gen(function* () {
						logger.error("Relationship analysis generation failed after retries", {
							analysisId: input.analysisId,
							error: error._tag,
						});
						yield* analysisRepo.incrementRetryCount(input.analysisId);
						return yield* Effect.fail(error);
					}),
				),
			);

		// 4. Update placeholder with generated content (idempotent)
		yield* analysisRepo
			.updateContent({
				id: input.analysisId,
				content: result.content,
				modelUsed: result.modelUsed,
			})
			.pipe(
				Effect.catchTag("AnalysisNotFoundError", () => {
					logger.info("Analysis already has content, skipping update", {
						analysisId: input.analysisId,
					});
					return Effect.succeed(undefined);
				}),
			);

		logger.info("Relationship analysis generation completed", {
			analysisId: input.analysisId,
			contentLength: result.content.length,
		});

		return { success: true };
	});
