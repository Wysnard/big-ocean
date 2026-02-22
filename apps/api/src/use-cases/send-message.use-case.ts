/**
 * Send Message Use Case
 *
 * Business logic for sending a message in an assessment conversation.
 * Saves user message, orchestrates AI response via Nerin conversational agent,
 * and returns lean response (response only, no confidence).
 *
 * Story 2.4: Replaces direct Nerin calls with Orchestrator for multi-agent coordination.
 * Story 2.9: Scores computed on-demand from evidence instead of materialized tables.
 * Story 2.11: Lean response — confidence removed from send-message. Evidence reads
 *             moved to router node (offset steering). Analyzer fires as background daemon.
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	type DomainMessage,
	FreeTierLimitReached,
	LoggerRepository,
	OrchestratorRepository,
	pickFarewellMessage,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";

export interface SendMessageInput {
	readonly sessionId: string;
	readonly message: string;
	readonly authenticatedUserId?: string;
	readonly userId?: string;
}

export interface SendMessageOutput {
	readonly response: string;
	readonly isFinalTurn: boolean;
	readonly farewellMessage?: string;
	readonly portraitWaitMinMs?: number;
}

/**
 * Send Message Use Case
 *
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository,
 *               LoggerRepository, OrchestratorRepository, CostGuardRepository
 * Returns: AI response string (lean response, no confidence)
 *
 * @throws BudgetPausedError - Daily cost limit reached, assessment paused
 * @throws OrchestrationError - Generic routing/pipeline failure
 */
export const sendMessage = (input: SendMessageInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;
		const orchestrator = yield* OrchestratorRepository;
		const costGuard = yield* CostGuardRepository;

		// Verify session exists
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Linked sessions are private to their owner.
		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		logger.info("Message received", {
			sessionId: input.sessionId,
			messageLength: input.message.length,
		});

		// Save user message
		yield* messageRepo.saveMessage(input.sessionId, "user", input.message, input.userId);

		// Get all previous messages for context
		const previousMessages = yield* messageRepo.getMessages(input.sessionId);

		// Message cadence is based on user messages only (assistant greetings should not count)
		const messageCount = previousMessages.filter((msg) => msg.role === "user").length;

		// Block past threshold (26th+ message)
		if (messageCount > config.freeTierMessageThreshold) {
			return yield* Effect.fail(
				new FreeTierLimitReached({
					sessionId: input.sessionId,
					limit: config.freeTierMessageThreshold,
					message: "You've reached the message limit for this assessment. View your results!",
				}),
			);
		}

		// Story 7.18: Final turn — skip LLM call, use farewell from pool
		const isFinalTurn = messageCount >= config.freeTierMessageThreshold;

		if (isFinalTurn) {
			const farewellMessage = pickFarewellMessage();

			// Save farewell as assistant message
			yield* messageRepo.saveMessage(input.sessionId, "assistant", farewellMessage);

			logger.info("Final turn - farewell sent", {
				sessionId: input.sessionId,
				messageCount,
			});

			return {
				response: farewellMessage,
				isFinalTurn: true,
				farewellMessage,
				portraitWaitMinMs: config.portraitWaitMinMs,
			};
		}

		// Map DB entities to domain messages (preserving IDs for downstream analysis)
		const domainMessages: DomainMessage[] = previousMessages.map((msg) => ({
			id: msg.id,
			role: msg.role,
			content: msg.content,
		}));

		// Get current daily cost for budget check
		const dailyCostCents = yield* costGuard.getDailyCost(session.userId ?? "anonymous");
		const dailyCostUsed = dailyCostCents / 100; // Convert cents to dollars

		// Invoke Orchestrator (routes to Nerin; router handles evidence reads internally on STEER messages)
		const result = yield* orchestrator
			.processMessage({
				sessionId: input.sessionId,
				userMessage: input.message,
				messages: domainMessages,
				messageCount,
				dailyCostUsed,
			})
			.pipe(
				Effect.tapError((error) =>
					Effect.sync(() =>
						logger.error("Orchestrator invocation failed", {
							errorTag: error._tag,
							sessionId: input.sessionId,
							message: error.message,
						}),
					),
				),
			);

		// Save AI message
		yield* messageRepo.saveMessage(input.sessionId, "assistant", result.nerinResponse);

		// Update cost tracking (convert dollars to cents)
		yield* costGuard.incrementDailyCost(
			session.userId ?? "anonymous",
			Math.round(result.costIncurred * 100),
		);

		// Fire-and-forget background analysis on batch messages (every 3rd message)
		if (messageCount % 3 === 0) {
			yield* Effect.forkDaemon(
				orchestrator
					.processAnalysis({
						sessionId: input.sessionId,
						messages: domainMessages,
						messageCount,
					})
					.pipe(
						Effect.catchAll((error) =>
							Effect.sync(() =>
								logger.error("Background analysis failed", {
									sessionId: input.sessionId,
									error: String(error),
								}),
							),
						),
					),
			);
		}

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: result.nerinResponse.length,
			tokenCount: result.tokenUsage,
			messageCount,
			steeringTarget: result.steeringTarget,
		});

		return {
			response: result.nerinResponse,
			isFinalTurn: false,
		};
	});
