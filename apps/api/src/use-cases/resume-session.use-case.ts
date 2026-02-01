/**
 * Resume Session Use Case
 *
 * Business logic for resuming an existing assessment session.
 * Returns session data with message history.
 */

import { Effect } from "effect";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { AssessmentMessageEntity } from "@workspace/domain/entities/message.entity";

export interface ResumeSessionInput {
  readonly sessionId: string;
}

export interface ResumeSessionOutput {
  readonly precision: {
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
 * Returns: Session precision scores and message history
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

    return {
      precision: session.precision,
      messages,
    };
  });
