/**
 * RPC Client - Simplified HTTP-based implementation
 *
 * For now, uses basic HTTP fetch since Effect RPC HTTP protocol is complex.
 * Will be properly integrated with @effect/rpc in a future iteration.
 */

/**
 * Simplified RPC call function
 *
 * Makes HTTP requests to the backend RPC endpoint.
 * Returns mock data for demonstration until backend RPC is fully implemented.
 *
 * @example
 * ```typescript
 * import { callRpc } from "./rpc-client";
 * import { StartAssessmentRpc } from "@workspace/contracts";
 *
 * const result = await callRpc(StartAssessmentRpc, { userId: "123" });
 * ```
 */
export const callRpc = async (rpc: any, payload: any): Promise<any> => {
  // For now, return mock data based on RPC procedure name
  // This allows the frontend to work while backend RPC is being finalized

  const rpcName = rpc.name || rpc.toString();

  // Mock implementations for each RPC procedure
  if (rpcName.includes("StartAssessment")) {
    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
    };
  }

  if (rpcName.includes("SendMessage")) {
    const mockResponses = [
      "That's fascinating! Tell me more about what draws you to that. Is this something you've been exploring for a long time?",
      "Interesting perspective. How do you think that shapes your daily life and interactions with others?",
      "I can see that's important to you. Have you noticed this quality affecting your career or relationships?",
      "That resonates with many people. How do you typically handle situations where that value is challenged?",
      "I appreciate you sharing that. What would you say is the core value behind what you just told me?",
    ];

    const index = (payload.message?.length || 0) % mockResponses.length;
    return {
      response: mockResponses[index] || mockResponses[0],
      precision: {
        openness: 0.5 + Math.random() * 0.3,
        conscientiousness: 0.4 + Math.random() * 0.3,
        extraversion: 0.55 + Math.random() * 0.2,
        agreeableness: 0.6 + Math.random() * 0.2,
        neuroticism: 0.3 + Math.random() * 0.2,
      },
    };
  }

  if (rpcName.includes("GetResults")) {
    return {
      oceanCode4Letter: "PPAM",
      precision: 72,
      archetypeName: "The Grounded Thinker",
      traitScores: {
        openness: 0.15,
        conscientiousness: 0.12,
        extraversion: 0.08,
        agreeableness: 0.16,
        neuroticism: 0.06,
      },
    };
  }

  if (rpcName.includes("ResumeSession")) {
    return {
      messages: [
        {
          id: "msg_1",
          sessionId: payload.sessionId,
          role: "assistant" as const,
          content: "Hi! I'm Nerin, your AI personality guide. What are you currently passionate about?",
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
      ],
      precision: 0.45,
      oceanCode4Letter: undefined,
    };
  }

  // Default fallback
  return {};
};
