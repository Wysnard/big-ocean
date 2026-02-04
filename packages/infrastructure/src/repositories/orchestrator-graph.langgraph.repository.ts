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
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import {
	AnalyzerRepository,
	BudgetPausedError,
	CheckpointerRepository,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	type GraphInput,
	type GraphOutput,
	LoggerRepository,
	NerinAgentRepository,
	OrchestrationError,
	OrchestratorGraphRepository,
	ScorerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import {
	calculateCostFromTokens,
	DAILY_COST_LIMIT,
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
 * Router Node Effect - Pure function for budget check and steering.
 * Synchronous logic, but wrapped in Effect for consistency.
 */
const routerNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const { sessionId, messageCount, dailyCostUsed, facetScores } = state;

		logger.debug("Router node executing", {
			sessionId,
			messageCount,
			dailyCostUsed,
		});

		// 1. BUDGET CHECK - throws BudgetPausedError if exceeded
		if (dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
			logger.warn("Budget limit reached, pausing assessment", {
				sessionId,
				dailyCostUsed,
				limit: DAILY_COST_LIMIT,
			});

			// Calculate overall confidence from facetScores
			const overallConfidence = facetScores ? calculateConfidenceFromFacetScores(facetScores) : 50; // Default if no scores yet

			return yield* Effect.fail(
				new BudgetPausedError(
					sessionId,
					"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
					getNextDayMidnightUTC(),
					overallConfidence,
				),
			);
		}

		// 2. BATCH DECISION
		const isBatchMessage = messageCount % 3 === 0;

		// 3. STEERING CALCULATION
		const normalizedFacetScores = createInitialFacetScoresMap(facetScores);
		const steeringTarget = getSteeringTarget(normalizedFacetScores);
		const steeringHint = getSteeringHint(steeringTarget);

		logger.debug("Router decisions", {
			sessionId,
			budgetOk: true,
			isBatchMessage,
			steeringTarget,
		});

		return {
			budgetOk: true,
			isBatchMessage,
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
 */
const analyzerNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const analyzer = yield* AnalyzerRepository;

		logger.debug("Analyzer node executing", {
			sessionId: state.sessionId,
			messageCount: state.messageCount,
		});

		const messageId = `msg_${state.sessionId}_${state.messageCount}`;
		const facetEvidence = yield* analyzer.analyzeFacets(messageId, state.userMessage);

		logger.debug("Analyzer evidence extracted", {
			sessionId: state.sessionId,
			evidenceCount: facetEvidence.length,
		});

		return {
			facetEvidence,
		};
	});

/**
 * Scorer Node Effect - Score aggregation.
 * Uses yield* for DI of ScorerRepository and LoggerRepository.
 */
const scorerNodeEffect = (state: OrchestratorState) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const scorer = yield* ScorerRepository;

		logger.debug("Scorer node executing", {
			sessionId: state.sessionId,
		});

		const facetScores = yield* scorer.aggregateFacetScores(state.sessionId);
		const traitScores = yield* scorer.deriveTraitScores(facetScores);

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
 * - ScorerRepository: Score aggregation
 * - CheckpointerRepository: State persistence
 */
export const OrchestratorGraphLangGraphRepositoryLive = Layer.effect(
	OrchestratorGraphRepository,
	Effect.gen(function* () {
		// DI all dependencies
		const logger = yield* LoggerRepository;
		const nerinAgent = yield* NerinAgentRepository;
		const analyzer = yield* AnalyzerRepository;
		const scorer = yield* ScorerRepository;
		const { checkpointer } = yield* CheckpointerRepository;

		logger.info("Initializing OrchestratorGraphRepository with pure Effect DI");

		// Create service provision layer for node effects
		const nodeServicesLayer = Layer.mergeAll(
			Layer.succeed(LoggerRepository, logger),
			Layer.succeed(NerinAgentRepository, nerinAgent),
			Layer.succeed(AnalyzerRepository, analyzer),
			Layer.succeed(ScorerRepository, scorer),
		);

		/**
		 * Conditional edge function - routes to analyzer on batch messages, else ends.
		 *
		 * Determines the next node after Nerin completes:
		 * - If batch message (every 3rd): route to "analyzer" for evidence extraction
		 * - Otherwise: route to "end" (skip batch processing)
		 *
		 * @param state - Current orchestrator state with isBatchMessage flag set by router
		 * @returns Next node name: "analyzer" or "end"
		 */
		const routeAfterNerin = (state: OrchestratorState): "analyzer" | "end" => {
			return state.isBatchMessage ? "analyzer" : "end";
		};

		// ============================================
		// Build StateGraph with Effect.runPromise nodes
		// ============================================

		const workflow = new StateGraph(OrchestratorStateAnnotation)
			.addNode("router", (state) =>
				Effect.runPromise(routerNodeEffect(state).pipe(Effect.provide(nodeServicesLayer))),
			)
			.addNode("nerin", (state) =>
				Effect.runPromise(nerinNodeEffect(state).pipe(Effect.provide(nodeServicesLayer))),
			)
			.addNode("analyzer", (state) =>
				Effect.runPromise(analyzerNodeEffect(state).pipe(Effect.provide(nodeServicesLayer))),
			)
			.addNode("scorer", (state) =>
				Effect.runPromise(scorerNodeEffect(state).pipe(Effect.provide(nodeServicesLayer))),
			)
			.addEdge(START, "router")
			.addEdge("router", "nerin")
			.addConditionalEdges("nerin", routeAfterNerin, {
				analyzer: "analyzer",
				end: END,
			})
			.addEdge("analyzer", "scorer")
			.addEdge("scorer", END);

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
								facetScores: input.facetScores,
							},
							{ configurable: { thread_id: threadId } },
						);

						const output: GraphOutput = {
							nerinResponse: result.nerinResponse ?? "",
							tokenUsage: result.tokenUsage ?? { input: 0, output: 0, total: 0 },
							costIncurred: result.costIncurred ?? 0,
							isBatchMessage: result.isBatchMessage ?? false,
							facetEvidence: result.facetEvidence,
							facetScores: result.facetScores,
							traitScores: result.traitScores,
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
