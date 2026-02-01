/**
 * Send Message Use Case
 *
 * Business logic for sending a message in an assessment conversation.
 * Saves user message, generates AI response using Nerin agent,
 * and updates precision scores.
 *
 * Integration: Nerin agent via repository injection (hexagonal architecture).
 */

import { Effect } from "effect";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { NerinAgentRepository } from "@workspace/domain/repositories/nerin-agent.repository";

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
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository, LoggerRepository, NerinAgentRepository
 * Returns: AI response and updated precision scores
 */
export const sendMessage = (input: SendMessageInput) =>
  Effect.gen(function* () {
    const sessionRepo = yield* AssessmentSessionRepository;
    const messageRepo = yield* AssessmentMessageRepository;
    const logger = yield* LoggerRepository;
    const nerinAgent = yield* NerinAgentRepository;

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
      input.userId
    );

    // Get all previous messages for context
    const previousMessages = yield* messageRepo.getMessages(input.sessionId);

    // Convert to LangChain message format
    const langchainMessages = previousMessages.map((msg) =>
      msg.role === "user"
        ? new HumanMessage({ content: msg.content })
        : new AIMessage({ content: msg.content })
    );

    // Invoke Nerin agent via repository
    const result = yield* nerinAgent
      .invoke({
        sessionId: input.sessionId,
        messages: langchainMessages,
        precision: session.precision,
      })
      .pipe(
        Effect.tapError((error) =>
          Effect.sync(() =>
            logger.error("Nerin agent invocation failed", {
              agentName: error.agentName,
              sessionId: error.sessionId,
              message: error.message,
            })
          )
        )
      );

    // Save AI message
    yield* messageRepo.saveMessage(
      input.sessionId,
      "assistant",
      result.response
    );

    // Return current session precision
    // (Precision updates will come in Story 2.4 with Analyzer/Scorer agents)
    const updatedPrecision = session.precision;

    // Update session with new precision scores
    yield* sessionRepo.updateSession(input.sessionId, {
      precision: updatedPrecision,
    });

    logger.info("Message processed", {
      sessionId: input.sessionId,
      responseLength: result.response.length,
      tokenCount: result.tokenCount,
    });

    return {
      response: result.response,
      precision: updatedPrecision,
    };
  });
