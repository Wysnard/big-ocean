/**
 * Start Assessment Use Case
 *
 * Business logic for starting a new assessment session.
 * Creates a new session with baseline precision scores.
 */

import { RateLimitExceeded } from "@workspace/contracts";
import {
	AssessmentSessionRepository,
	CostGuardRepository,
	getNextDayMidnightUTC,
	LoggerRepository,
} from "@workspace/domain";
import { DateTime, Effect } from "effect";

export interface StartAssessmentInput {
	readonly userId?: string;
}

export interface StartAssessmentOutput {
	readonly sessionId: string;
	readonly createdAt: Date;
}

/**
 * Start Assessment Use Case
 *
 * Dependencies: AssessmentSessionRepository, CostGuardRepository, LoggerRepository
 * Returns: Session ID and creation timestamp
 * Throws: RateLimitExceeded if user already started assessment today
 */
export const startAssessment = (input: StartAssessmentInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
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

		logger.info("Assessment session started", {
			sessionId: result.sessionId,
			userId: input.userId,
		});

		return {
			sessionId: result.sessionId,
			createdAt: new Date(),
		};
	});
