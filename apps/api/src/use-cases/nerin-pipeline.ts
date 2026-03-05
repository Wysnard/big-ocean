/**
 * Nerin Pipeline — shared ConversAnalyzer → evidence → steering → Nerin → save assistant msg → increment count
 *
 * Extracted from send-message.use-case.ts to allow reuse from resume-session (orphan user message retry).
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateDomainDistribution,
	type ConversanalyzerOutput,
	ConversanalyzerRepository,
	ConversationEvidenceRepository,
	CostGuardRepository,
	calculateCost,
	computeDomainStreak,
	computeFacetMetrics,
	computeFinalWeight,
	computeSteeringTarget,
	type DomainMessage,
	type EvidenceInput,
	type FacetName,
	GREETING_MESSAGES,
	getUTCDateKey,
	type IntentType,
	type LifeDomain,
	LoggerRepository,
	type MicroIntent,
	NerinAgentRepository,
	realizeMicroIntent,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

/** Max user messages that count as cold start: 1 greeting + 1 opening question = 2 assistant msgs before user replies */
const COLD_START_USER_MSG_THRESHOLD = GREETING_MESSAGES.length + 1;

export interface NerinPipelineInput {
	readonly sessionId: string;
	readonly userId?: string;
	readonly userMessage: string;
}

export interface NerinPipelineOutput {
	readonly response: string;
	readonly isFinalTurn: boolean;
}

/**
 * Runs the full Nerin pipeline: ConversAnalyzer → evidence → steering → Nerin → atomically save both messages → increment count.
 *
 * Atomic write: user message + assistant message are persisted together only after the LLM succeeds.
 * This eliminates orphan user messages when the LLM call fails.
 */
export const runNerinPipeline = (input: NerinPipelineInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;
		const nerin = yield* NerinAgentRepository;
		const conversanalyzer = yield* ConversanalyzerRepository;
		const evidenceRepo = yield* ConversationEvidenceRepository;
		const costGuard = yield* CostGuardRepository;

		const costKey = input.userId ?? input.sessionId;

		// 1. Get all messages for context (does NOT include current user message)
		const previousMessages = yield* messageRepo.getMessages(input.sessionId);

		// 2. Map DB entities to domain messages + append current user message in-memory
		const domainMessages: DomainMessage[] = [
			...previousMessages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
			})),
			{ id: `pending-${Date.now()}`, role: "user" as const, content: input.userMessage },
		];

		// 3. Extract previousDomain + userMessageCount (from DB history; current user message not yet saved)
		const userMessageCount = previousMessages.filter((m) => m.role === "user").length;
		let previousDomain: LifeDomain | null = null;
		for (let i = previousMessages.length - 1; i >= 0; i--) {
			const msg = previousMessages[i];
			if (msg !== undefined && msg.role === "assistant" && msg.targetDomain != null) {
				previousDomain = msg.targetDomain;
				break;
			}
		}

		// 3a. Compute domain streak from assistant messages
		const assistantMessages = previousMessages
			.filter((m) => m.role === "assistant")
			.map((m) => ({ targetDomain: m.targetDomain ?? null }));
		const domainStreak = computeDomainStreak(assistantMessages);

		// 4. Steering computation
		let targetDomain: LifeDomain;
		let targetFacet: FacetName;
		let bestPriority = 0;
		let coveredFacets = "0/30";
		let metricsMapSize = 0;
		let analyzerTokenUsage: { input: number; output: number } | null = null;

		// Collected evidence to save atomically after LLM success
		let pendingEvidence: ConversanalyzerOutput["evidence"] = [];

		if (userMessageCount >= COLD_START_USER_MSG_THRESHOLD) {
			const existingEvidence = yield* evidenceRepo.findBySession(input.sessionId);

			let allEvidence: EvidenceInput[] = existingEvidence;
			{
				const domainDistribution = aggregateDomainDistribution(existingEvidence);
				const recentMessages: DomainMessage[] = domainMessages.slice(-6);

				const evidenceResult = yield* conversanalyzer
					.analyze({
						message: input.userMessage,
						recentMessages,
						domainDistribution,
					})
					.pipe(
						Effect.retry(Schedule.recurs(2)),
						Effect.catchAll((error) =>
							Effect.sync(() => {
								logger.warn("ConversAnalyzer failed after 3 attempts, skipping", {
									error: error.message,
									sessionId: input.sessionId,
									messageId: input.sessionId,
								});
								return {
									evidence: [],
									observedEnergyLevel: "medium",
									tokenUsage: { input: 0, output: 0 },
								} as ConversanalyzerOutput;
							}),
						),
					);

				analyzerTokenUsage = evidenceResult.tokenUsage;

				const filteredEvidence = evidenceResult.evidence.filter(
					(e) => computeFinalWeight(e.strength, e.confidence) >= config.minEvidenceWeight,
				);

				logger.info("Evidence weights computed", {
					sessionId: input.sessionId,
					messageId: input.sessionId,
					rawCount: evidenceResult.evidence.length,
					filteredCount: filteredEvidence.length,
					evidence: filteredEvidence.map((e) => ({
						facet: e.bigfiveFacet,
						deviation: e.deviation,
						strength: e.strength,
						confidence: e.confidence,
						domain: e.domain,
						finalWeight: +computeFinalWeight(e.strength, e.confidence).toFixed(3),
					})),
				});

				if (filteredEvidence.length > 0) {
					// Defer evidence save until after LLM success (atomic write)
					pendingEvidence = filteredEvidence;

					logger.info("Conversanalyzer complete", {
						sessionId: input.sessionId,
						evidenceCount: filteredEvidence.length,
						tokenUsage: evidenceResult.tokenUsage,
					});

					// Include pending evidence in metrics computation
					allEvidence = [...existingEvidence, ...filteredEvidence];
				}
			}

			const metrics = computeFacetMetrics(allEvidence);

			logger.info("Facet metrics computed", {
				sessionId: input.sessionId,
				facetMetrics: Object.fromEntries(
					[...metrics.entries()].map(([facet, m]) => [
						facet,
						{
							score: +m.score.toFixed(2),
							confidence: +m.confidence.toFixed(3),
							signalPower: +m.signalPower.toFixed(3),
							domains: Object.fromEntries(m.domainWeights),
						},
					]),
				),
			});

			const steering = computeSteeringTarget(metrics, previousDomain);
			targetDomain = steering.targetDomain;
			targetFacet = steering.targetFacet;
			bestPriority = steering.bestPriority;
			metricsMapSize = metrics.size;
			let coveredCount = 0;
			for (const [, m] of metrics) {
				if (m.confidence > 0.3) coveredCount++;
			}
			coveredFacets = `${coveredCount}/30`;
		} else {
			const steering = computeSteeringTarget(new Map(), null, undefined, GREETING_MESSAGES.length);
			targetDomain = steering.targetDomain;
			targetFacet = steering.targetFacet;
		}

		// 5. Extract recent intent types from last 3 assistant messages
		const recentIntentTypes: IntentType[] = [];
		for (let i = previousMessages.length - 1; i >= 0 && recentIntentTypes.length < 3; i--) {
			const msg = previousMessages[i];
			if (
				msg !== undefined &&
				msg.role === "assistant" &&
				"intentType" in msg &&
				msg.intentType != null
			) {
				recentIntentTypes.unshift(msg.intentType as IntentType);
			}
		}

		// 5b. Realize micro-intent
		const microIntent: MicroIntent = realizeMicroIntent({
			targetFacet,
			targetDomain,
			previousDomain,
			domainStreak,
			turnIndex: userMessageCount,
			recentIntentTypes,
		});

		// Compute topicTransitionsPerFiveTurns
		const recentDomains: LifeDomain[] = [];
		for (const msg of previousMessages) {
			if (msg.role === "assistant" && msg.targetDomain != null) {
				recentDomains.push(msg.targetDomain);
			}
		}
		const lastFiveDomains = recentDomains.slice(-5);
		let topicTransitionsPerFiveTurns = 0;
		for (let i = 1; i < lastFiveDomains.length; i++) {
			if (lastFiveDomains[i] !== lastFiveDomains[i - 1]) {
				topicTransitionsPerFiveTurns++;
			}
		}

		logger.info("Steering computed", {
			sessionId: input.sessionId,
			targetFacet,
			targetDomain,
			previousDomain,
			userMessageCount,
			coveredFacets,
			metricsMapSize,
			bestPriority,
			domainStreak,
			intentType: microIntent.intent,
			topicTransitionsPerFiveTurns,
			questionsPerAssistantTurn: 1,
		});

		// 6. Call Nerin
		const result = yield* nerin
			.invoke({
				sessionId: input.sessionId,
				messages: domainMessages,
				targetDomain,
				targetFacet,
				microIntent,
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

		// 6a. Cost tracking
		const nerinCost = calculateCost(result.tokenCount.input, result.tokenCount.output);
		const analyzerCost = analyzerTokenUsage
			? calculateCost(analyzerTokenUsage.input, analyzerTokenUsage.output)
			: { totalCents: 0 };
		const totalCostCents = nerinCost.totalCents + analyzerCost.totalCents;

		if (totalCostCents > 0) {
			yield* costGuard.incrementDailyCost(costKey, totalCostCents).pipe(
				Effect.catchAll((err) =>
					Effect.sync(() => {
						logger.error("Failed to increment daily cost (non-fatal)", {
							error: err.message,
							sessionId: input.sessionId,
							totalCostCents,
						});
					}),
				),
			);
		}

		logger.info("Cost tracked", {
			sessionId: input.sessionId,
			costKey,
			nerinCostCents: nerinCost.totalCents,
			analyzerCostCents: analyzerCost.totalCents,
			totalCostCents,
			dateKey: getUTCDateKey(),
		});

		// 7. Atomic persist: save user message first (to get ID for evidence FK)
		const savedUserMessage = yield* messageRepo.saveMessage(
			input.sessionId,
			"user",
			input.userMessage,
			input.userId,
		);

		// 7a. Save evidence with real user message ID (if any was collected)
		if (pendingEvidence.length > 0) {
			yield* evidenceRepo.save(
				pendingEvidence.map((e) => ({
					...e,
					sessionId: input.sessionId,
					messageId: savedUserMessage.id,
				})),
			);
		}

		// 7b. Save assistant message with steering targets + intentType
		yield* messageRepo.saveMessage(
			input.sessionId,
			"assistant",
			result.response,
			undefined,
			targetDomain,
			targetFacet,
			microIntent.intent,
		);

		// 8. Increment message_count atomically
		const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

		// 9. Compute isFinalTurn
		const isFinalTurn = messageCount >= config.freeTierMessageThreshold;

		// 10. Transition session to "finalizing" on final turn
		if (isFinalTurn) {
			yield* sessionRepo.updateSession(input.sessionId, { status: "finalizing" });
		}

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
		} satisfies NerinPipelineOutput;
	});
