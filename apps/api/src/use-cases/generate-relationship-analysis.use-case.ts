/**
 * Generate Relationship Analysis Use Case (Story 14.4, Epic 7 Story 7.2)
 *
 * Background daemon that generates a personality comparison analysis
 * for two users. Called by forkDaemon from accept-invitation use-case.
 *
 * Loads **current UserSummary** per user (ADR-55 `getCurrentForUser`) — not raw conversation evidence.
 * Facet scores still come from each user’s latest completed assessment result session.
 */

import {
	AssessmentResultRepository,
	ConversationRepository,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
	UserSummaryRepository,
} from "@workspace/domain";
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
 * Load a user's assessment data: facet scores from their latest completed session's result
 * plus **current** UserSummary (living cross-cutting asset, ADR-55).
 * Returns null if the user has no completed assessment, no result, or no UserSummary version.
 */
const loadUserAssessmentData = (userId: string) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const userSummaryRepo = yield* UserSummaryRepository;
		const logger = yield* LoggerRepository;

		const session = yield* sessionRepo.findSessionByUserId(userId);
		if (!session) return null;

		const result = yield* resultsRepo.getBySessionId(session.id);
		if (!result) return null;

		const userSummary = yield* userSummaryRepo.getCurrentForUser(userId);
		if (!userSummary) {
			logger.warn("UserSummary missing for user — cannot generate relationship letter", {
				userId,
			});
			return null;
		}

		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
				facetScoresMap[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		return { facetScoresMap, userSummary };
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

		const inviterData = yield* loadUserAssessmentData(input.inviterUserId);
		if (!inviterData) {
			logger.error("Inviter relationship inputs incomplete (session, result, or user summary)", {
				userId: input.inviterUserId,
			});
			yield* analysisRepo.incrementRetryCount(input.analysisId);
			return { success: false };
		}

		const inviteeData = yield* loadUserAssessmentData(input.inviteeUserId);
		if (!inviteeData) {
			logger.info("Invitee relationship inputs not ready yet, will retry", {
				userId: input.inviteeUserId,
			});
			yield* analysisRepo.incrementRetryCount(input.analysisId);
			return { success: false };
		}

		const result = yield* analysisGen
			.generateAnalysis({
				userAFacetScores: inviterData.facetScoresMap,
				userAUserSummary: inviterData.userSummary,
				userAName: "Person A",
				userBFacetScores: inviteeData.facetScoresMap,
				userBUserSummary: inviteeData.userSummary,
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
