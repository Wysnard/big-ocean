/**
 * Send Message Use Case
 *
 * Story 9.2: Rewritten as simple sequential Effect pipeline.
 * Story 10.2: Added conversanalyzer pipeline (post-cold-start).
 * Story 10.4: Integrated steering — computeFacetMetrics + computeSteeringTarget on every message.
 * Story 10.5: Advisory lock for concurrent message prevention, threshold consolidation, nearingEnd flag.
 *
 * Pipeline: acquire advisory lock → validate session (inside lock) → save user msg → get messages → extract previousDomain
 *           → [cold start?] compute steering from greeting seed or evidence metrics
 *           → [post-cold-start] conversanalyzer → save evidence → re-fetch evidence → compute metrics → compute steering
 *           → call Nerin with targetDomain + targetFacet + nearingEnd → save assistant msg with steering → increment count → release lock → return
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateDomainDistribution,
	type ConversanalyzerOutput,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	computeFacetMetrics,
	computeSteeringTarget,
	type DomainMessage,
	type FacetName,
	GREETING_MESSAGES,
	type LifeDomain,
	LoggerRepository,
	NerinAgentRepository,
	SessionCompletedError,
	SessionNotFound,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

/** Max user messages that count as cold start: 1 greeting + 1 opening question = 2 assistant msgs before user replies */
const COLD_START_USER_MSG_THRESHOLD = GREETING_MESSAGES.length + 1;

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
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;
		const nerin = yield* NerinAgentRepository;
		const conversanalyzer = yield* ConversanalyzerRepository;
		const evidenceRepo = yield* ConversationEvidenceRepository;

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

				logger.info("Message received", {
					sessionId: input.sessionId,
					messageLength: input.message.length,
				});

				// 5. Save user message (capture messageId for evidence FK)
				const savedUserMessage = yield* messageRepo.saveMessage(
					input.sessionId,
					"user",
					input.message,
					input.userId,
				);
				const messageId = savedUserMessage.id;

				// 6. Get all messages for context (includes the just-saved user message)
				const previousMessages = yield* messageRepo.getMessages(input.sessionId);

				// 7. Map DB entities to domain messages
				const domainMessages: DomainMessage[] = previousMessages.map((msg) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
				}));

				// 8. Extract previousDomain from raw DB entities (before mapping to DomainMessage)
				const userMessageCount = previousMessages.filter((m) => m.role === "user").length;
				let previousDomain: LifeDomain | null = null;
				for (let i = previousMessages.length - 1; i >= 0; i--) {
					const msg = previousMessages[i];
					if (msg !== undefined && msg.role === "assistant" && msg.targetDomain != null) {
						previousDomain = msg.targetDomain;
						break;
					}
				}

				// 9. Steering computation — runs on every message (cold start + post-cold-start)
				let targetDomain: LifeDomain;
				let targetFacet: FacetName;

				if (userMessageCount > COLD_START_USER_MSG_THRESHOLD) {
					// Post-cold-start: conversanalyzer → save evidence → re-fetch → compute metrics → steering

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

					// Re-fetch ALL evidence only when new evidence was saved; else reuse existing
					let allEvidence = existingEvidence;
					if (cappedEvidence.length > 0) {
						yield* evidenceRepo.save(
							cappedEvidence.map((e) => ({
								...e,
								sessionId: input.sessionId,
								messageId,
							})),
						);

						logger.info("Conversanalyzer complete", {
							sessionId: input.sessionId,
							evidenceCount: cappedEvidence.length,
							tokenUsage: evidenceResult.tokenUsage,
						});

						allEvidence = yield* evidenceRepo.findBySession(input.sessionId);
					}

					const metrics = computeFacetMetrics(allEvidence);
					const steering = computeSteeringTarget(metrics, previousDomain);
					targetDomain = steering.targetDomain;
					targetFacet = steering.targetFacet;
				} else {
					// Cold start: greeting seed from pool
					const steering = computeSteeringTarget(new Map(), null, undefined, GREETING_MESSAGES.length);
					targetDomain = steering.targetDomain;
					targetFacet = steering.targetFacet;
				}

				logger.info("Steering computed", {
					sessionId: input.sessionId,
					targetFacet,
					targetDomain,
					previousDomain,
					userMessageCount,
				});

				// 10. Compute nearingEnd for farewell winding-down (Story 10.5)
				const nearingEnd = userMessageCount >= config.freeTierMessageThreshold - 3;

				// 11. Call Nerin with steering + nearingEnd
				const result = yield* nerin
					.invoke({
						sessionId: input.sessionId,
						messages: domainMessages,
						targetDomain,
						targetFacet,
						nearingEnd,
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

				// 12. Save assistant message with steering targets
				yield* messageRepo.saveMessage(
					input.sessionId,
					"assistant",
					result.response,
					undefined,
					targetDomain,
					targetFacet,
				);

				// 13. Increment message_count atomically and get new count
				const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

				// 14. Compute isFinalTurn using freeTierMessageThreshold (single source of truth)
				const isFinalTurn = messageCount >= config.freeTierMessageThreshold;

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
			}),
		);
	});
