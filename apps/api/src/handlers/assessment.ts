/**
 * Assessment Handlers (Placeholder Implementation)
 *
 * These are stub handlers for Story 1.3 infrastructure setup.
 * Real business logic will be implemented in Epic 2 with LangGraph integration.
 */

import { Effect } from "effect";
import { AssessmentRpcs } from "@workspace/contracts";
import { getLogger } from "@workspace/infrastructure";

/**
 * Assessment RPC Handlers Layer
 *
 * Exports a Layer that provides all assessment RPC handlers.
 * Follows the official @effect/rpc pattern.
 */
export const AssessmentRpcHandlersLive = AssessmentRpcs.toLayer({
  /**
   * Start a new assessment session (placeholder)
   */
  StartAssessment: ({ userId }: { userId?: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;

      // Generate placeholder session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const createdAt = new Date();

      logger.info("Assessment session started (placeholder)", { sessionId, userId });

      return {
        sessionId,
        createdAt: createdAt.toISOString(),
      };
    }),

  /**
   * Send a message to Nerin (mock data for demonstration)
   */
  SendMessage: ({ sessionId, message }: { sessionId: string; message: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;

      logger.info("Message received (mock demonstration)", {
        sessionId,
        messageLength: message.length,
      });

      // Mock responses for demonstration
      const mockResponses = [
        "That's fascinating! Tell me more about what draws you to that. Is this something you've been exploring for a long time?",
        "Interesting perspective. How do you think that shapes your daily life and interactions with others?",
        "I can see that's important to you. Have you noticed this quality affecting your career or relationships?",
        "That resonates with many people. How do you typically handle situations where that value is challenged?",
        "I appreciate you sharing that. What would you say is the core value behind what you just told me?",
      ];

      // Select response based on message length (deterministic)
      const responseIndex = (message.length + sessionId.length) % mockResponses.length;
      const selectedResponse = mockResponses[responseIndex] ?? mockResponses[0];

      // Mock precision scores - increment towards 1.0
      const baseScore = 0.4;
      const increment = 0.08;

      return {
        response: selectedResponse,
        precision: {
          openness: Math.min(baseScore + increment * 2, 1),
          conscientiousness: Math.min(baseScore + increment * 1, 1),
          extraversion: Math.min(baseScore + increment * 1.5, 1),
          agreeableness: Math.min(baseScore + increment * 2.2, 1),
          neuroticism: Math.min(baseScore + increment * 0.5, 1),
        },
      } as const;
    }),

  /**
   * Get assessment results (placeholder)
   */
  GetResults: ({ sessionId }: { sessionId: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;

      logger.info("Results requested (placeholder)", { sessionId });

      // Placeholder results
      return {
        oceanCode4Letter: "PPAM",
        precision: 72,
        archetypeName: "The Grounded Thinker",
        traitScores: {
          openness: 15,
          conscientiousness: 12,
          extraversion: 8,
          agreeableness: 16,
          neuroticism: 6,
        },
      };
    }),

  /**
   * Resume assessment session (mock data for demonstration)
   */
  ResumeSession: ({ sessionId }: { sessionId: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;

      logger.info("Session resumed (mock demonstration)", { sessionId });

      // Mock conversation history for demonstration
      return {
        messages: [
          {
            id: "msg_1",
            sessionId,
            role: "assistant" as const,
            content:
              "Hi! I'm Nerin, your AI personality guide. I'd like to understand you better. Let's start with something simple: What are you currently passionate about?",
            createdAt: new Date(Date.now() - 300000).toISOString(),
          },
          {
            id: "msg_2",
            sessionId,
            role: "user" as const,
            content: "I love hiking and exploring new places.",
            createdAt: new Date(Date.now() - 270000).toISOString(),
          },
          {
            id: "msg_3",
            sessionId,
            role: "assistant" as const,
            content:
              "That's wonderful! Exploration seems important to you. When you discover a new trail or destination, what excites you most — the physical challenge, the natural beauty, or the sense of adventure?",
            createdAt: new Date(Date.now() - 240000).toISOString(),
          },
          {
            id: "msg_4",
            sessionId,
            role: "user" as const,
            content: "Probably the sense of adventure and discovering something new.",
            createdAt: new Date(Date.now() - 210000).toISOString(),
          },
          {
            id: "msg_5",
            sessionId,
            role: "assistant" as const,
            content:
              "I hear that! The thrill of discovery. Do you bring that same adventurous spirit into other areas of your life — career, relationships, hobbies?",
            createdAt: new Date(Date.now() - 180000).toISOString(),
          },
        ],
        precision: 0.45,
        oceanCode4Letter: undefined,
      };
    }),
});
