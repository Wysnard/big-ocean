/**
 * Orchestrator Graph LangGraph Repository Implementation
 *
 * Pure Effect DI implementation of the OrchestratorGraphRepository.
 * Node functions are defined as Effects with yield* for DI.
 * Graph nodes use Effect.runPromise with provided services.
 *
 * Graph Flow:
 * ```
 * START -> router (budget check, steering calculation)
 *   -> nerin (always runs)
 *   -> analyzer (if batch: messageCount % 3 === 0)
 *   -> scorer (after analyzer)
 *   -> END
 * ```
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 * @see Story 2-9: Evidence-sourced scoring (pure functions, no score tables)
 */

import { HumanMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";
import {
	AnalyzerRepository,
	AppConfig,
	aggregateFacetScores,
	BudgetPausedError,
	CheckpointerRepository,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	deriveTraitScores,
	FacetEvidenceRepository,
	type GraphInput,
	type GraphOutput,
	LoggerRepository,
	NerinAgentRepository,
	OrchestrationError,
	OrchestratorGraphRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import {
	calculateCostFromTokens,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
} from "./orchestrator.nodes";
import { type OrchestratorState, OrchestratorStateAnnotation } from "./orchestrator.state";

// ============================================
// Node Effects (pure Effect with yield* DI)
// ============================================

/**
 * Router Node Effect - Budget check, batch decision, and offset steering.
 *
 * Story 2.11: Offset steering — reads evidence from DB only on STEER messages.
 *
 * Message cadence (3-message cycle, offset by 1):
 * - COLD START (msgs 1-3): No steering, no evidence read
 * - STEER (msgs 4, 7, 10...): Read evidence from DB, compute fresh steering
 * - COAST (msgs 5, 8, 11...): Use cached steering from state
 * - BATCH (msgs 3, 6, 9...): Use cached steering, triggers async analysis
 */
const routerNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;
		const { sessionId, messageCount, dailyCostUsed, facetScores } = state;

		logger.debug("Router node executing", {
			sessionId,
			messageCount,
			dailyCostUsed,
		});

		// 1. BUDGET CHECK - throws BudgetPausedError if exceeded
		if (dailyCostUsed + MESSAGE_COST_ESTIMATE > config.dailyCostLimit) {
			logger.warn("Budget limit reached, pausing assessment", {
				sessionId,
				dailyCostUsed,
				limit: config.dailyCostLimit,
			});

			const overallConfidence = facetScores ? calculateConfidenceFromFacetScores(facetScores) : 50;

			return yield* Effect.fail(
				new BudgetPausedError(
					sessionId,
					"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
					getNextDayMidnightUTC(),
					overallConfidence,
				),
			);
		}

		// 2. OFFSET STEERING
		const isColdStart = messageCount <= 3;
		const isSteeringMessage = messageCount % 3 === 1 && messageCount > 3;

		if (isColdStart) {
			// No steering, no evidence read — Nerin uses default exploration
			logger.debug("Router: cold start — no steering", {
				sessionId,
				messageCount,
			});
			return {
				budgetOk: true,
				facetScores: createInitialFacetScoresMap(),
			};
		}

		if (isSteeringMessage) {
			// FRESH steering — read evidence from DB
			const evidenceRepo = yield* FacetEvidenceRepository;
			const evidence = yield* evidenceRepo.getEvidenceBySession(sessionId);
			const freshFacetScores = aggregateFacetScores(evidence);
			const steeringTarget = getSteeringTarget(freshFacetScores);
			const steeringHint = getSteeringHint(steeringTarget);

			logger.debug("Router: STEER message — fresh evidence read", {
				sessionId,
				messageCount,
				evidenceCount: evidence.length,
				steeringTarget,
			});

			return {
				budgetOk: true,
				facetScores: freshFacetScores,
				steeringTarget: steeringTarget ?? undefined,
				steeringHint,
			};
		}

		// CACHED steering — reuse facetScores/steeringHint from checkpointer state
		const normalizedFacetScores = createInitialFacetScoresMap(facetScores);
		const steeringTarget = getSteeringTarget(normalizedFacetScores);
		const steeringHint = getSteeringHint(steeringTarget);

		logger.debug("Router: cached steering", {
			sessionId,
			messageCount,
			steeringTarget,
			type: messageCount % 3 === 0 ? "BATCH" : "COAST",
		});

		return {
			budgetOk: true,
			steeringTarget: steeringTarget ?? undefined,
			steeringHint,
		};
	});

/**
 * Nerin Node Effect - Conversational response generation.
 * Uses yield* for DI of NerinAgentRepository and LoggerRepository.
 *
 * Passes facet-level data (facetScores) and steering guidance (steeringHint)
 * calculated by the router node based on outlier detection.
 */
const nerinNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const nerinAgent = yield* NerinAgentRepository;

		logger.debug("Nerin node executing", {
			sessionId: state.sessionId,
			steeringHint: state.steeringHint,
			facetCount: Object.keys(state.facetScores ?? {}).length,
		});

		const result = yield* nerinAgent.invoke({
			sessionId: state.sessionId,
			messages: state.messages,
			facetScores: state.facetScores,
			steeringHint: state.steeringHint,
		});

		const costIncurred = calculateCostFromTokens(result.tokenCount);

		logger.debug("Nerin response generated", {
			sessionId: state.sessionId,
			responseLength: result.response.length,
			tokenUsage: result.tokenCount,
			costIncurred,
			steeringApplied: !!state.steeringHint,
		});

		return {
			nerinResponse: result.response,
			tokenUsage: result.tokenCount,
			costIncurred,
		};
	});

/**
 * Analyzer Node Effect - Facet evidence extraction.
 * Uses yield* for DI of AnalyzerRepository and LoggerRepository.
 *
 * Analyzes only unanalyzed user messages to avoid duplicate processing.
 * Tracks which messages have been analyzed via analyzedMessageIndices.
 */
const _analyzerNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const analyzer = yield* AnalyzerRepository;

		logger.debug("Analyzer node executing", {
			sessionId: state.sessionId,
			messageCount: state.messageCount,
		});

		// Collect unanalyzed user messages
		const analyzedSet = new Set(state.analyzedMessageIndices ?? []);
		const unanalyzed: { index: number; messageId: string; content: string }[] = [];

		for (let i = 0; i < state.messages.length; i++) {
			const message = state.messages[i];
			if (!message) continue;

			if (message instanceof HumanMessage && !analyzedSet.has(i)) {
				unanalyzed.push({
					index: i,
					messageId: `msg_${state.sessionId}_${i + 1}`,
					content:
						typeof message.content === "string" ? message.content : JSON.stringify(message.content),
				});
			}
		}

		// Build conversation history for analyzer context
		const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = state.messages
			.filter((msg) => msg !== undefined)
			.map((msg) => ({
				role: (msg instanceof HumanMessage ? "user" : "assistant") as "user" | "assistant",
				content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
			}));

		// Analyze all unanalyzed messages in parallel, passing full history for context
		const results = yield* Effect.all(
			unanalyzed.map(({ messageId, content, index }) =>
				analyzer.analyzeFacets(messageId, content, conversationHistory).pipe(
					Effect.map((evidence) => ({ evidence, index })),
					Effect.tap(({ evidence }) =>
						Effect.sync(() =>
							logger.debug("Analyzed message", {
								messageIndex: index,
								messageId,
								evidenceCount: evidence.length,
							}),
						),
					),
				),
			),
			{ concurrency: 3 },
		);

		const allEvidence = results.flatMap((r) => r.evidence);
		const newlyAnalyzedIndices = results.map((r) => r.index);

		logger.debug("Analyzer evidence extraction complete", {
			sessionId: state.sessionId,
			totalEvidence: allEvidence.length,
			newlyAnalyzedCount: newlyAnalyzedIndices.length,
		});

		return {
			facetEvidence: allEvidence,
			analyzedMessageIndices: newlyAnalyzedIndices,
		};
	});

/**
 * Scorer Node Effect - Score aggregation from evidence.
 * Uses FacetEvidenceRepository + pure domain functions (no score tables).
 */
const _scorerNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;

		logger.debug("Scorer node executing", {
			sessionId: state.sessionId,
		});

		// Fetch evidence and compute scores on-demand (pure functions)
		const evidence = yield* evidenceRepo.getEvidenceBySession(state.sessionId);
		const facetScores = aggregateFacetScores(evidence);
		const traitScores = deriveTraitScores(facetScores);

		// Calculate overall confidence from facet scores
		const overallConfidence = calculateConfidenceFromFacetScores(facetScores);

		logger.debug("Scorer aggregation complete", {
			sessionId: state.sessionId,
			facetCount: Object.keys(facetScores ?? {}).length,
			traitCount: Object.keys(traitScores ?? {}).length,
			overallConfidence,
		});

		return {
			facetScores,
			traitScores,
		};
	});

// ============================================
// Production Layer
// ============================================

/**
 * Production Layer for OrchestratorGraphRepository.
 *
 * Node functions are pure Effects with yield* DI.
 * Graph nodes use Effect.runPromise with provided services.
 *
 * Dependencies:
 * - LoggerRepository: Structured logging
 * - NerinAgentRepository: Conversational agent
 * - AnalyzerRepository: Facet evidence extraction
 * - FacetEvidenceRepository: Evidence data access for scoring
 * - CheckpointerRepository: State persistence
 */
export const OrchestratorGraphLangGraphRepositoryLive = Layer.effect(
	OrchestratorGraphRepository,
	Effect.gen(function* () {
		// DI all dependencies
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;
		const nerinAgent = yield* NerinAgentRepository;
		const analyzer = yield* AnalyzerRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
		const { checkpointer } = yield* CheckpointerRepository;

		logger.info("Initializing OrchestratorGraphRepository with pure Effect DI");

		// Create service provision layer for node effects
		const nodeServicesLayer = Layer.mergeAll(
			Layer.succeed(LoggerRepository, logger),
			Layer.succeed(AppConfig, config),
			Layer.succeed(NerinAgentRepository, nerinAgent),
			Layer.succeed(AnalyzerRepository, analyzer),
			Layer.succeed(FacetEvidenceRepository, evidenceRepo),
		);

		// ============================================
		// Build Conversation Graph: router → nerin → END
		// Story 2.11: Analyzer/scorer removed from graph, run as separate pipeline
		// ============================================

		const workflow = new StateGraph(OrchestratorStateAnnotation)
			.addNode("router", (state) =>
				Effect.runPromise(routerNodeEffect(state).pipe(Effect.provide(nodeServicesLayer))),
			)
			.addNode("nerin", (state) =>
				Effect.runPromise(nerinNodeEffect(state).pipe(Effect.provide(nodeServicesLayer))),
			)
			.addEdge(START, "router")
			.addEdge("router", "nerin")
			.addEdge("nerin", END);

		// Compile with checkpointer
		const graph = workflow.compile({
			checkpointer,
		});

		logger.info("OrchestratorGraphRepository initialized", {
			hasCheckpointer: !!checkpointer,
		});

		// ============================================
		// Return Repository Interface
		// ============================================

		return OrchestratorGraphRepository.of({
			invoke: (input: GraphInput, threadId: string) =>
				Effect.tryPromise({
					try: async () => {
						const result = await graph.invoke(
							{
								sessionId: input.sessionId,
								userMessage: input.userMessage,
								messages: input.messages,
								messageCount: input.messageCount,
								dailyCostUsed: input.dailyCostUsed,
							},
							{ configurable: { thread_id: threadId } },
						);

						const output: GraphOutput = {
							nerinResponse: result.nerinResponse ?? "",
							tokenUsage: result.tokenUsage ?? { input: 0, output: 0, total: 0 },
							costIncurred: result.costIncurred ?? 0,
							steeringTarget: result.steeringTarget,
							steeringHint: result.steeringHint,
						};

						return output;
					},
					catch: (error) => {
						// Re-throw domain errors (like BudgetPausedError)
						if (error instanceof BudgetPausedError) {
							throw error;
						}
						logger.error("Graph invocation error", {
							error: error instanceof Error ? error.message : String(error),
						});
						return new OrchestrationError(
							input.sessionId,
							"Graph invocation failed",
							error instanceof Error ? error.message : String(error),
						);
					},
				}),
		});
	}),
);
