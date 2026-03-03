/**
 * Send Message Use Case
 *
 * Story 9.2: Rewritten as simple sequential Effect pipeline.
 * Story 10.2: Added conversanalyzer pipeline (post-cold-start).
 * Story 10.4: Integrated steering — computeFacetMetrics + computeSteeringTarget on every message.
 * Story 10.5: Advisory lock for concurrent message prevention, threshold consolidation.
 *
 * Pipeline: acquire advisory lock → validate session (inside lock) → save user msg
 *           → runNerinPipeline (ConversAnalyzer → evidence → steering → Nerin → save assistant msg → increment count)
 *           → release lock → return
 */

import {
	AppConfig,
	AssessmentSessionRepository,
	CostGuardRepository,
	LoggerRepository,
	SessionCompletedError,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";
import { runNerinPipeline } from "./nerin-pipeline";

export { PER_MESSAGE_EVIDENCE_CAP, SESSION_EVIDENCE_CAP } from "./nerin-pipeline";

export interface SendMessageInput {
	readonly sessionId: string;
	readonly message: string;
	readonly userId?: string;
}

export interface SendMessageOutput {
	readonly response: string;
	readonly isFinalTurn: boolean;
}

/**
 * Send Message Use Case
 *
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository,
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
		const config = yield* AppConfig;
		const sessionRepo = yield* AssessmentSessionRepository;
		const logger = yield* LoggerRepository;
		const costGuard = yield* CostGuardRepository;

		// 1. Acquire advisory lock FIRST — prevents concurrent messages and TOCTOU races (Story 10.5)
		const lockResource = Effect.acquireRelease(sessionRepo.acquireSessionLock(input.sessionId), () =>
			sessionRepo.releaseSessionLock(input.sessionId).pipe(Effect.orDie),
		);

		return yield* Effect.scoped(
			Effect.gen(function* () {
				yield* lockResource;

				// 2. Resolve session (inside lock to prevent TOCTOU race on status)
				const session = yield* sessionRepo.getSession(input.sessionId);

				// 3. Ownership guard — linked sessions are private to their owner
				if (session.userId != null && session.userId !== input.userId) {
					return yield* Effect.fail(
						new SessionNotFound({
							sessionId: input.sessionId,
							message: `Session '${input.sessionId}' not found`,
						}),
					);
				}

				// 4. Session status guard — reject if not active
				if (session.status !== "active") {
					return yield* Effect.fail(
						new SessionCompletedError({
							sessionId: input.sessionId,
							status: session.status,
							message: `Session is ${session.status} — cannot send messages`,
						}),
					);
				}

				// 4a. Cost key: userId if authenticated, sessionId for anonymous
				const costKey = input.userId ?? input.sessionId;

				// 4b. Budget check — fail-open if Redis is down (Story 10.6)
				yield* costGuard.checkDailyBudget(costKey, config.dailyCostLimit * 100).pipe(
					Effect.catchTag("RedisOperationError", (err) =>
						Effect.sync(() => {
							logger.error("Redis unavailable for budget check, allowing message", {
								error: err.message,
								sessionId: input.sessionId,
							});
						}),
					),
				);

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

				// 5. Run the shared Nerin pipeline (ConversAnalyzer → steering → Nerin → atomic save both messages → increment)
				return yield* runNerinPipeline({
					sessionId: input.sessionId,
					userId: input.userId,
					userMessage: input.message,
				});
			}),
		);
	});
