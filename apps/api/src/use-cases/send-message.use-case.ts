/**
 * Send Message Use Case
 *
 * Story 9.2: Rewritten as simple sequential Effect pipeline.
 * Replaces old orchestrator-based flow with direct Nerin invocation.
 *
 * Pipeline: validate session → save user message → get messages → call Nerin
 *           → save assistant message → increment message_count → return response
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	type DomainMessage,
	LoggerRepository,
	NerinAgentRepository,
	SessionCompletedError,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";

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
 *               LoggerRepository, NerinAgentRepository, AppConfig
 *
 * @throws SessionNotFound - Invalid session or access denied
 * @throws SessionCompletedError - Session is finalizing or completed
 * @throws AgentInvocationError - Nerin LLM call failure
 * @throws DatabaseError - DB operation failure
 */
export const sendMessage = (input: SendMessageInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;
		const nerin = yield* NerinAgentRepository;

		// 1. Resolve session
		const session = yield* sessionRepo.getSession(input.sessionId);

		// 2. Ownership guard — linked sessions are private to their owner
		if (session.userId != null && session.userId !== input.userId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 3. Session status guard — reject if not active
		if (session.status !== "active") {
			return yield* Effect.fail(
				new SessionCompletedError({
					sessionId: input.sessionId,
					status: session.status,
					message: `Session is ${session.status} — cannot send messages`,
				}),
			);
		}

		logger.info("Message received", {
			sessionId: input.sessionId,
			messageLength: input.message.length,
		});

		// 4. Save user message
		yield* messageRepo.saveMessage(input.sessionId, "user", input.message, input.userId);

		// 5. Get all messages for context
		const previousMessages = yield* messageRepo.getMessages(input.sessionId);

		// 6. Map DB entities to domain messages
		const domainMessages: DomainMessage[] = previousMessages.map((msg) => ({
			id: msg.id,
			role: msg.role,
			content: msg.content,
		}));

		// 7. Call Nerin (cold start — no steering in this story)
		const result = yield* nerin
			.invoke({
				sessionId: input.sessionId,
				messages: domainMessages,
			})
			.pipe(
				Effect.tapError((error) =>
					Effect.sync(() =>
						logger.error("Nerin invocation failed", {
							errorTag: error._tag,
							sessionId: input.sessionId,
							message: error.message,
						}),
					),
				),
			);

		// 8. Save assistant message (targetDomain/targetBigfiveFacet = undefined for cold start)
		yield* messageRepo.saveMessage(input.sessionId, "assistant", result.response);

		// 9. Increment message_count atomically and get new count
		const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

		// 10. Compute isFinalTurn
		const isFinalTurn = messageCount >= config.messageThreshold;

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: result.response.length,
			tokenCount: result.tokenCount,
			messageCount,
			isFinalTurn,
		});

		return {
			response: result.response,
			isFinalTurn,
		};
	});
