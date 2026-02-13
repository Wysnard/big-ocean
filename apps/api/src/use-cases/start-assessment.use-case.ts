/**
 * Start Assessment Use Case
 *
 * Business logic for starting a new assessment session.
 * Creates a new session with baseline confidence scores and
 * persists 3 Nerin greeting messages (the 3rd randomly picked from a pool).
 */

import { RateLimitExceeded } from "@workspace/contracts";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	GREETING_MESSAGES,
	getNextDayMidnightUTC,
	LoggerRepository,
	pickOpeningQuestion,
} from "@workspace/domain";
import { DateTime, Effect } from "effect";

export interface StartAssessmentInput {
	readonly userId?: string;
}

export interface GreetingMessage {
	readonly role: "assistant";
	readonly content: string;
	readonly createdAt: Date;
}

export interface StartAssessmentOutput {
	readonly sessionId: string;
	readonly createdAt: Date;
	readonly messages: GreetingMessage[];
}

/**
 * Start Assessment Use Case
 *
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository, CostGuardRepository, LoggerRepository
 * Returns: Session ID, creation timestamp, and 3 persisted greeting messages
 * Throws: RateLimitExceeded if user already started assessment today
 */
export const startAssessment = (input: StartAssessmentInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const costGuard = yield* CostGuardRepository;
		const logger = yield* LoggerRepository;

		const { userId } = input;

		// Skip rate limiting for anonymous users (no userId)
		if (userId) {
			// Check rate limit
			const canStart = yield* costGuard.canStartAssessment(userId);
			if (!canStart) {
				logger.warn("Rate limit exceeded for assessment start", { userId });

				return yield* Effect.fail(
					new RateLimitExceeded({
						userId,
						message: "You can start a new assessment tomorrow",
						resetAt: DateTime.unsafeMake(getNextDayMidnightUTC().getTime()),
					}),
				);
			}
		}

		// Create new session
		const result = yield* sessionRepo.createSession(input.userId);

		// Record assessment start for rate limiting (only for authenticated users)
		if (userId) {
			yield* costGuard.recordAssessmentStart(userId);
		}

		// Build the 3 greeting messages (2 fixed + 1 random opening question)
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		// Persist greeting messages to DB so Nerin has full conversation context
		const savedMessages: GreetingMessage[] = [];
		for (const content of greetingContents) {
			const saved = yield* messageRepo.saveMessage(result.sessionId, "assistant", content);
			savedMessages.push({
				role: "assistant",
				content: saved.content,
				createdAt: saved.createdAt,
			});
		}

		logger.info("Assessment session started", {
			sessionId: result.sessionId,
			userId: input.userId,
			greetingCount: savedMessages.length,
		});

		return {
			sessionId: result.sessionId,
			createdAt: new Date(),
			messages: savedMessages,
		};
	});
