/**
 * Start Assessment Use Case
 *
 * Business logic for starting a new assessment session.
 * Creates a new session with baseline precision scores.
 */

import { Effect } from "effect";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";

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
 * Dependencies: AssessmentSessionRepository, LoggerRepository
 * Returns: Session ID and creation timestamp
 */
export const startAssessment = (input: StartAssessmentInput) =>
  Effect.gen(function* () {
    const sessionRepo = yield* AssessmentSessionRepository;
    const logger = yield* LoggerRepository;

    // Create new session
    const result = yield* sessionRepo.createSession(input.userId);

    logger.info("Assessment session started", {
      sessionId: result.sessionId,
      userId: input.userId,
    });

    return {
      sessionId: result.sessionId,
      createdAt: new Date(),
    };
  });
