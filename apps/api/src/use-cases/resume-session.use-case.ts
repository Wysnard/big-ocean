/**
 * Resume Session Use Case
 *
 * Business logic for resuming an existing assessment session.
 * Returns session data with message history and confidence computed from
 * persisted results (completed sessions) or evidence (in-progress sessions).
 */

import {
	ALL_FACETS,
	AppConfig,
	AssessmentResultRepository,
	ConversationRepository,
	calculateTraitConfidence,
	DEFAULT_FACET_SCORE,
	type FacetConfidenceScores,
	FacetEvidenceRepository,
	type FacetName,
	initializeFacetConfidence,
	LoggerRepository,
	MessageRepository,
	SessionNotFound,
} from "@workspace/domain";
import type { MessageEntity } from "@workspace/domain/entities/message.entity";
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
	readonly messages: readonly MessageEntity[];
	readonly freeTierMessageThreshold: number;
	readonly status: string;
}

/**
 * Resume Session Use Case
 *
 * Dependencies: ConversationRepository, MessageRepository,
 *               AssessmentResultRepository, FacetEvidenceRepository, LoggerRepository
 * Returns: Session confidence scores and message history
 */
export const resumeSession = (input: ResumeSessionInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const sessionRepo = yield* ConversationRepository;
		const messageRepo = yield* MessageRepository;
		const resultRepo = yield* AssessmentResultRepository;
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

		// Try persisted results first (completed sessions); fall back to evidence for in-progress
		const persistedResult = yield* resultRepo.getBySessionId(input.sessionId);

		let traitConfidence: ReturnType<typeof calculateTraitConfidence>;

		if (persistedResult && Object.keys(persistedResult.facets).length > 0) {
			// Completed session: read from persisted results
			const facetConfidence: Partial<FacetConfidenceScores> = {};
			for (const [facetName, data] of Object.entries(persistedResult.facets)) {
				facetConfidence[facetName as keyof FacetConfidenceScores] = data.confidence;
			}

			const defaultFacetConfidence = initializeFacetConfidence(50);
			const mergedFacetConfidence: FacetConfidenceScores = {
				...defaultFacetConfidence,
				...facetConfidence,
			};

			traitConfidence = calculateTraitConfidence(mergedFacetConfidence);
		} else {
			// In-progress session: fall back to evidence-based confidence extraction
			const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);

			// Group evidence by facet and use the max confidence per facet as a simple approximation
			const confidenceByFacet = new Map<FacetName, number>();
			for (const ev of evidence) {
				const current = confidenceByFacet.get(ev.facetName) ?? 0;
				if (ev.confidence > current) {
					confidenceByFacet.set(ev.facetName, ev.confidence);
				}
			}

			const facetConfidence: Partial<FacetConfidenceScores> = {};
			for (const facet of ALL_FACETS) {
				facetConfidence[facet as keyof FacetConfidenceScores] =
					confidenceByFacet.get(facet) ?? DEFAULT_FACET_SCORE.confidence;
			}

			const defaultFacetConfidence = initializeFacetConfidence(50);
			const mergedFacetConfidence: FacetConfidenceScores = {
				...defaultFacetConfidence,
				...facetConfidence,
			};

			traitConfidence = calculateTraitConfidence(mergedFacetConfidence);
		}

		logger.info("Session resumed", {
			sessionId: input.sessionId,
			messageCount: messages.length,
		});

		return {
			confidence: traitConfidence,
			messages,
			freeTierMessageThreshold: config.freeTierMessageThreshold,
			status: session.status,
		};
	});
