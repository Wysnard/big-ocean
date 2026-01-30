/**
 * Profile Handlers (Placeholder Implementation)
 *
 * These are stub handlers for Story 1.3 infrastructure setup.
 * Real business logic will be implemented in Epic 5.
 */

import { Effect } from "effect";
import { ProfileRpcs } from "@workspace/contracts";
import { getLogger } from "@workspace/infrastructure";

/**
 * Profile RPC Handlers Layer
 *
 * Exports a Layer that provides all profile RPC handlers.
 * Follows the official @effect/rpc pattern.
 */
export const ProfileRpcHandlersLive = ProfileRpcs.toLayer({
  /**
   * Get public profile (placeholder)
   */
  GetProfile: ({ publicProfileId }: { publicProfileId: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;

      logger.info("Profile requested (placeholder)", { publicProfileId });

      // Placeholder profile data
      return {
        archetypeName: "The Grounded Thinker",
        oceanCode4Letter: "PPAM",
        traitSummary: {
          openness: "High" as const,
          conscientiousness: "Mid" as const,
          extraversion: "Low" as const,
          agreeableness: "High" as const,
          neuroticism: "Low" as const,
        },
        description:
          "A thoughtful and analytical individual who values deep understanding. Grounded in practicality while maintaining strong interpersonal connections.",
        archetypeColor: "#4A90E2",
      };
    }),

  /**
   * Share profile (create public link) (placeholder)
   */
  ShareProfile: ({ sessionId }: { sessionId: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;

      logger.info("Profile share requested (placeholder)", { sessionId });

      // Generate placeholder public profile ID
      const publicProfileId = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const shareableUrl = `https://big-ocean.app/profile/${publicProfileId}`;

      return {
        publicProfileId,
        shareableUrl,
      };
    }),
});
