/**
 * Send Message Use Case
 *
 * Story 9.2: Rewritten as simple sequential Effect pipeline.
 * Story 10.2: Added conversanalyzer pipeline (post-cold-start).
 * Story 10.4: Integrated analysis pipeline on every message.
 * Story 10.5: Advisory lock for concurrent message prevention, threshold consolidation.
 *
 * Pipeline: acquire advisory lock → validate session (inside lock) → save user msg
 *           → runNerinPipeline (ConversAnalyzer → evidence → Director targeting → Nerin → save assistant msg → increment count)
 *           → release lock → return
 */

import { ConversationRepository, CostGuardRepository, LoggerRepository } from "@workspace/domain";
import { Effect } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";
import { runNerinPipeline } from "./nerin-pipeline";

export interface SendMessageInput {
	readonly sessionId: string;
	readonly message: string;
	readonly userId: string;
}

export interface SendMessageOutput {
	readonly response: string;
	readonly isFinalTurn: boolean;
	/** Beat 2 surfacing message — only present on the final turn */
	readonly surfacingMessage?: string;
}

/**
 * Send Message Use Case
 *
 * Dependencies: ConversationRepository, MessageRepository,
 *               LoggerRepository, NerinAgentRepository, AppConfig,
 *               ConversanalyzerRepository, ConversationEvidenceRepository
 *
 * @throws SessionNotFound - Invalid session or access denied
 * @throws SessionCompletedError - Session is finalizing or completed
 * @throws ConcurrentMessageError - Another message is being processed for this session (409)
 * @throws AgentInvocationError - Nerin LLM call failure
 * @throws DatabaseError - DB operation failure
 */
export const sendMessage = (input: SendMessageInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const logger = yield* LoggerRepository;
		const costGuard = yield* CostGuardRepository;

		// 1. Acquire advisory lock FIRST — prevents concurrent messages and TOCTOU races (Story 10.5)
		const lockResource = Effect.acquireRelease(sessionRepo.acquireSessionLock(input.sessionId), () =>
			sessionRepo.releaseSessionLock(input.sessionId).pipe(Effect.orDie),
		);

		return yield* Effect.scoped(
			Effect.gen(function* () {
				yield* lockResource;

				// 2. Resolve session and policy inside lock to prevent TOCTOU races.
				const conversation = yield* requireAuthenticatedConversation({
					sessionId: input.sessionId,
					authenticatedUserId: input.userId,
					policy: "active-message",
				});

				const costKey = input.userId;

				// 4b. Budget check removed from send-message (Story 31-6)
				// Per FR56/NFR18, cost guard never blocks mid-session.
				// Budget enforcement now happens at session boundaries only (start-conversation).

				// 4c. Message rate limit — fail-open if Redis is down
				yield* costGuard.checkMessageRateLimit(costKey).pipe(
					Effect.catchTag("RedisOperationError", (err) =>
						Effect.sync(() => {
							logger.error("Redis unavailable for rate limit check, allowing message", {
								error: err.message,
								sessionId: input.sessionId,
							});
						}),
					),
				);

				logger.info("Message received", {
					sessionId: input.sessionId,
					messageLength: input.message.length,
				});

				// 5. Run the shared Nerin pipeline (ConversAnalyzer → Director targeting → Nerin → atomic save both messages → increment)
				return yield* runNerinPipeline({
					sessionId: input.sessionId,
					userId: input.userId,
					userMessage: input.message,
					conversation,
				});
			}),
		);
	});
