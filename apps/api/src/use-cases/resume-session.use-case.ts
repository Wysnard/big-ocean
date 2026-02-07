/**
 * Resume Session Use Case
 *
 * Business logic for resuming an existing assessment session.
 * Returns session data with message history.
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	calculateTraitConfidence,
	LoggerRepository,
} from "@workspace/domain";
import type { AssessmentMessageEntity } from "@workspace/domain/entities/message.entity";
import { Effect } from "effect";

export interface ResumeSessionInput {
	readonly sessionId: string;
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
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository, LoggerRepository
 * Returns: Session confidence scores and message history
 */
export const resumeSession = (input: ResumeSessionInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;

		// Get session
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Get all messages
		const messages = yield* messageRepo.getMessages(input.sessionId);

		logger.info("Session resumed", {
			sessionId: input.sessionId,
			messageCount: messages.length,
		});

		// Calculate trait confidence from facet confidence (session stores facet-level)
		const traitConfidence = calculateTraitConfidence(session.confidence);

		return {
			confidence: traitConfidence,
			messages,
		};
	});
