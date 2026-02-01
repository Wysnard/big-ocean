/**
 * Send Message Use Case
 *
 * Business logic for sending a message in an assessment conversation.
 * Saves user message, generates AI response, updates precision scores.
 */

import { Effect } from "effect";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { SessionNotFound, DatabaseError } from "@workspace/contracts/errors";

export interface SendMessageInput {
  readonly sessionId: string;
  readonly message: string;
  readonly userId?: string;
}

export interface SendMessageOutput {
  readonly response: string;
  readonly precision: {
    readonly openness: number;
    readonly conscientiousness: number;
    readonly extraversion: number;
    readonly agreeableness: number;
    readonly neuroticism: number;
  };
}

/**
 * Send Message Use Case
 *
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository, LoggerRepository
 * Returns: AI response and updated precision scores
 */
export const sendMessage = (
  input: SendMessageInput,
): Effect.Effect<
  SendMessageOutput,
  DatabaseError | SessionNotFound,
  | AssessmentSessionRepository
  | AssessmentMessageRepository
  | LoggerRepository
> =>
  Effect.gen(function* () {
    const sessionRepo = yield* AssessmentSessionRepository;
    const messageRepo = yield* AssessmentMessageRepository;
    const logger = yield* LoggerRepository;

    // Verify session exists
    const session = yield* sessionRepo.getSession(input.sessionId);

    logger.info("Message received", {
      sessionId: input.sessionId,
      messageLength: input.message.length,
    });

    // Save user message
    yield* messageRepo.saveMessage(
      input.sessionId,
      "user",
      input.message,
      input.userId,
    );

    // TODO: Generate AI response using LangGraph/Nerin agent
    // For now, return placeholder response
    const aiResponse = "Thank you for sharing that. Can you tell me more?";

    // Save AI message
    yield* messageRepo.saveMessage(input.sessionId, "assistant", aiResponse);

    // TODO: Calculate precision scores using Analyzer agent
    // For now, return current session precision
    const updatedPrecision = session.precision;

    // Update session with new precision scores
    yield* sessionRepo.updateSession(input.sessionId, {
      precision: updatedPrecision,
    });

    logger.info("Message processed", {
      sessionId: input.sessionId,
      responseLength: aiResponse.length,
    });

    return {
      response: aiResponse,
      precision: updatedPrecision,
    };
  });
