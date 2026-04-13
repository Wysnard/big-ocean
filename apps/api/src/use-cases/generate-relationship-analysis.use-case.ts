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
	ConversationEvidenceRepository,
	ConversationRepository,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import type { ConversationEvidenceRecord } from "@workspace/domain/repositories/conversation-evidence.repository";
import { Effect, Schedule } from "effect";
import { sendRelationshipAnalysisNotification } from "./send-relationship-analysis-notification.use-case";

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
		const sessionRepo = yield* ConversationRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const conversationEvidenceRepo = yield* ConversationEvidenceRepository;

		const session = yield* sessionRepo.findSessionByUserId(userId);
		if (!session) return null;

		const result = yield* resultsRepo.getBySessionId(session.id);
		if (!result) return null;

		// Load conversation evidence (authoritative source — Story 18-6)
		const evidence: ConversationEvidenceRecord[] = yield* conversationEvidenceRepo.findBySession(
			session.id,
		);

		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
				facetScoresMap[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		return { facetScoresMap, evidence };
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
		let contentWasWritten = true;
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
					contentWasWritten = false;
					return Effect.succeed(undefined);
				}),
			);

		logger.info("Relationship analysis generation completed", {
			analysisId: input.analysisId,
			contentLength: result.content.length,
		});

		// 5. Send relationship-letter ready notifications to both participants (fail-open)
		if (contentWasWritten) {
			yield* sendRelationshipAnalysisNotification({
				analysisId: input.analysisId,
			}).pipe(
				Effect.catchAll((err) => {
					logger.error("Failed to send relationship letter notification (fail-open)", {
						analysisId: input.analysisId,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.void;
				}),
			);
		}

		return { success: true };
	});
