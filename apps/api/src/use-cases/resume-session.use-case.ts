/**
 * Resume Session Use Case
 *
 * Business logic for resuming an existing assessment session.
 * Returns session data with message history and confidence computed from evidence.
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateFacetScores,
	calculateTraitConfidence,
	type FacetConfidenceScores,
	FacetEvidenceRepository,
	initializeFacetConfidence,
	LoggerRepository,
	SessionNotFound,
} from "@workspace/domain";
import type { AssessmentMessageEntity } from "@workspace/domain/entities/message.entity";
import { Effect } from "effect";

export interface ResumeSessionInput {
	readonly sessionId: string;
	readonly authenticatedUserId?: string;
}

export interface ResumeSessionOutput {
	readonly confidence: {
		readonly openness: number;
		readonly conscientiousness: number;
		readonly extraversion: number;
		readonly agreeableness: number;
		readonly neuroticism: number;
	};
	readonly messages: readonly AssessmentMessageEntity[];
}

/**
 * Resume Session Use Case
 *
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository,
 *               FacetEvidenceRepository, LoggerRepository
 * Returns: Session confidence scores (computed from evidence) and message history
 */
export const resumeSession = (input: ResumeSessionInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
		const logger = yield* LoggerRepository;

		// Get session (validates it exists)
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

		// Get all messages
		const messages = yield* messageRepo.getMessages(input.sessionId);

		// Compute facet scores from evidence (on-demand)
		const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
		const facetScores = aggregateFacetScores(evidence);

		// Convert facet scores to facet confidence for trait calculation
		const facetConfidence: Partial<FacetConfidenceScores> = {};
		for (const [facetName, facetScore] of Object.entries(facetScores)) {
			facetConfidence[facetName as keyof FacetConfidenceScores] = facetScore.confidence;
		}

		const defaultFacetConfidence = initializeFacetConfidence(50);
		const mergedFacetConfidence: FacetConfidenceScores = {
			...defaultFacetConfidence,
			...facetConfidence,
		};

		const traitConfidence = calculateTraitConfidence(mergedFacetConfidence);

		logger.info("Session resumed", {
			sessionId: input.sessionId,
			messageCount: messages.length,
		});

		return {
			confidence: traitConfidence,
			messages,
		};
	});
