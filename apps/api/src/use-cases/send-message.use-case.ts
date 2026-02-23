/**
 * Send Message Use Case
 *
 * Story 9.2: Rewritten as simple sequential Effect pipeline.
 * Story 10.2: Added conversanalyzer pipeline (post-cold-start).
 *
 * Pipeline: validate session → save user msg (capture messageId) → get messages
 *           → query evidence → compute domain distribution
 *           → [cold start check: user msg count ≤ greeting count]
 *           → if post-cold-start: conversanalyzer → cap 3 → save evidence
 *           → call Nerin (no steering yet) → save assistant msg → increment count → return
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateDomainDistribution,
	type ConversanalyzerOutput,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	type DomainMessage,
	GREETING_MESSAGES,
	LoggerRepository,
	NerinAgentRepository,
	SessionCompletedError,
	SessionNotFound,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

/** Cold start threshold: greeting messages + 1 opening question = 2 assistant greetings */
const COLD_START_GREETING_COUNT = GREETING_MESSAGES.length + 1;

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
		const conversanalyzer = yield* ConversanalyzerRepository;
		const evidenceRepo = yield* ConversationEvidenceRepository;

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

		// 4. Save user message (capture messageId for evidence FK)
		const savedUserMessage = yield* messageRepo.saveMessage(
			input.sessionId,
			"user",
			input.message,
			input.userId,
		);
		const messageId = savedUserMessage.id;

		// 5. Get all messages for context (includes the just-saved user message)
		const previousMessages = yield* messageRepo.getMessages(input.sessionId);

		// 6. Map DB entities to domain messages
		const domainMessages: DomainMessage[] = previousMessages.map((msg) => ({
			id: msg.id,
			role: msg.role,
			content: msg.content,
		}));

		// 7. Conversanalyzer pipeline (post-cold-start only)
		const userMessageCount = previousMessages.filter((m) => m.role === "user").length;

		if (userMessageCount > COLD_START_GREETING_COUNT) {
			// Query existing evidence for domain distribution
			const existingEvidence = yield* evidenceRepo.findBySession(input.sessionId);
			const domainDistribution = aggregateDomainDistribution(existingEvidence);

			// Build recent messages (last 6)
			const recentMessages: DomainMessage[] = domainMessages.slice(-6);

			// Conversanalyzer call — non-fatal (retry once, then skip per AC #6)
			const evidenceResult = yield* conversanalyzer
				.analyze({
					message: input.message,
					recentMessages,
					domainDistribution,
				})
				.pipe(
					Effect.retry(Schedule.once),
					Effect.catchAll((error) =>
						Effect.sync(() => {
							logger.error("Conversanalyzer failed, skipping", {
								error: error.message,
								sessionId: input.sessionId,
							});
							return { evidence: [], tokenUsage: { input: 0, output: 0 } } as ConversanalyzerOutput;
						}),
					),
				);

			// Cap evidence to 3 records (business rule)
			const cappedEvidence = evidenceResult.evidence.slice(0, 3);

			// Save evidence if non-empty
			if (cappedEvidence.length > 0) {
				yield* evidenceRepo.save(
					cappedEvidence.map((e) => ({
						...e,
						sessionId: input.sessionId,
						messageId,
					})),
				);
			}

			if (cappedEvidence.length > 0) {
				logger.info("Conversanalyzer complete", {
					sessionId: input.sessionId,
					evidenceCount: cappedEvidence.length,
					tokenUsage: evidenceResult.tokenUsage,
				});
			}
		}

		// 8. Call Nerin (no steering yet — Story 10.4)
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

		// 9. Save assistant message
		yield* messageRepo.saveMessage(input.sessionId, "assistant", result.response);

		// 10. Increment message_count atomically and get new count
		const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

		// 11. Compute isFinalTurn
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
