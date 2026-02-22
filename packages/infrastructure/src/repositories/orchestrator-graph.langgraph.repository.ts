/**
 * Orchestrator Graph LangGraph Repository Implementation
 *
 * Pure Effect DI implementation of the OrchestratorGraphRepository.
 * Node functions are defined as Effects with yield* for DI.
 * Graph nodes use runNodeEffect() which encodes domain errors into state
 * rather than throwing through Effect.runPromise.
 *
 * Graph Flow:
 * ```
 * START -> router -> (error check) -> nerin -> END
 *                         |
 *                         +-> END  (if state.error is set)
 * ```
 *
 * Error-in-State Pattern:
 * - Graph nodes catch domain errors and encode them as SerializableGraphError in state
 * - Conditional edge after router skips nerin when error is present
 * - invoke() checks state.error and deserializes back to domain errors via Effect.fail
 * - No more `instanceof` checks in catch blocks
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 * @see Story 2-9: Evidence-sourced scoring (pure functions, no score tables)
 */

import { END, START, StateGraph } from "@langchain/langgraph";
import {
	AppConfig,
	aggregateFacetScores,
	BudgetPausedError,
	ConfidenceGapError,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	FacetEvidenceRepository,
	type GraphInput,
	type GraphOutput,
	LoggerRepository,
	NerinAgentRepository,
	OrchestrationError,
	OrchestratorGraphRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { CheckpointerRepository } from "./checkpointer.repository";
import {
	calculateCostFromTokens,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
} from "./orchestrator.nodes";
import {
	type OrchestratorState,
	OrchestratorStateAnnotation,
	type SerializableGraphError,
} from "./orchestrator.state";

// ============================================
// Error Serialization (Error-in-State Pattern)
// ============================================

/**
 * Serialize a domain error into a JSON-safe format for graph state.
 *
 * LangGraph checkpointers require state to be JSON-serializable.
 * Domain errors extend Error (not serializable), so we encode them
 * as discriminated unions with plain data fields.
 */
function serializeError(error: unknown): SerializableGraphError {
	if (error instanceof BudgetPausedError) {
		return {
			_tag: "BudgetPausedError",
			sessionId: error.sessionId,
			message: error.message,
			resumeAfter: error.resumeAfter.toISOString(),
			currentConfidence: error.currentConfidence,
		};
	}
	if (error instanceof ConfidenceGapError) {
		return {
			_tag: "ConfidenceGapError",
			sessionId: error.sessionId,
			message: error.message,
			cause: error.cause,
		};
	}
	// Default: wrap as OrchestrationError
	if (error instanceof OrchestrationError) {
		return {
			_tag: "OrchestrationError",
			sessionId: error.sessionId,
			message: error.message,
			cause: error.cause,
		};
	}
	return {
		_tag: "OrchestrationError",
		sessionId: "unknown",
		message: error instanceof Error ? error.message : String(error),
		cause: error instanceof Error ? error.stack : undefined,
	};
}

/**
 * Deserialize a SerializableGraphError back into a domain error instance.
 *
 * Reconstructs the original domain error class from the serialized data,
 * preserving _tag for Effect's typed error channel.
 */
function deserializeError(error: SerializableGraphError): BudgetPausedError | OrchestrationError {
	switch (error._tag) {
		case "BudgetPausedError":
			return new BudgetPausedError(
				error.sessionId,
				error.message,
				new Date(error.resumeAfter),
				error.currentConfidence,
			);
		case "ConfidenceGapError":
			return new OrchestrationError(error.sessionId, error.message, error.cause);
		case "OrchestrationError":
			return new OrchestrationError(error.sessionId, error.message, error.cause);
	}
}

/**
 * Run a node Effect and encode any domain error into the state's error field.
 *
 * Instead of letting Effect.runPromise throw domain errors (which requires
 * fragile `instanceof` catch blocks), this helper:
 * 1. Runs the node effect with provided services
 * 2. On success: returns the partial state update
 * 3. On failure: serializes the error into `{ error: SerializableGraphError }`
 *
 * The graph's conditional edge then checks `state.error` to skip downstream nodes.
 */
function runNodeEffect<R>(
	effect: Effect.Effect<Partial<OrchestratorState>, unknown, R>,
	layer: Layer.Layer<R>,
): Promise<Partial<OrchestratorState>> {
	return Effect.runPromise(
		effect.pipe(
			Effect.provide(layer),
			Effect.catchAll((err) => Effect.succeed({ error: serializeError(err) })),
		),
	);
}

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
			targetFacet: state.steeringTarget,
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

// ============================================
// Production Layer
// ============================================

/**
 * Production Layer for OrchestratorGraphRepository.
 *
 * Node functions are pure Effects with yield* DI.
 * Graph nodes use runNodeEffect() which catches errors into state.
 *
 * Dependencies:
 * - LoggerRepository: Structured logging
 * - NerinAgentRepository: Conversational agent
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
		const evidenceRepo = yield* FacetEvidenceRepository;
		const { checkpointer } = yield* CheckpointerRepository;

		logger.info("Initializing OrchestratorGraphRepository with pure Effect DI");

		// Create service provision layer for node effects
		const nodeServicesLayer = Layer.mergeAll(
			Layer.succeed(LoggerRepository, logger),
			Layer.succeed(AppConfig, config),
			Layer.succeed(NerinAgentRepository, nerinAgent),
			Layer.succeed(FacetEvidenceRepository, evidenceRepo),
		);

		// ============================================
		// Build Conversation Graph: router → (error?) → nerin → END
		// Story 2.11: Analyzer/scorer removed from graph, run as separate pipeline
		// Error-in-State: Conditional edge skips nerin when router sets error
		// ============================================

		const workflow = new StateGraph(OrchestratorStateAnnotation)
			.addNode("router", (state) => runNodeEffect(routerNodeEffect(state), nodeServicesLayer))
			.addNode("nerin", (state) => runNodeEffect(nerinNodeEffect(state), nodeServicesLayer))
			.addEdge(START, "router")
			.addConditionalEdges("router", (state) => (state.error ? "end" : "nerin"), {
				nerin: "nerin",
				end: END,
			})
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
				Effect.gen(function* () {
					const result = yield* Effect.tryPromise({
						try: () =>
							graph.invoke(
								{
									sessionId: input.sessionId,
									userMessage: input.userMessage,
									messages: input.messages,
									messageCount: input.messageCount,
									dailyCostUsed: input.dailyCostUsed,
								},
								{ configurable: { thread_id: threadId } },
							),
						catch: (error) => {
							logger.error("Graph invocation error", {
								error: error instanceof Error ? error.message : String(error),
							});
							return new OrchestrationError(
								input.sessionId,
								"Graph invocation failed",
								error instanceof Error ? error.message : String(error),
							);
						},
					});

					// Error-in-State: check if a node encoded an error into state
					if (result.error) {
						return yield* Effect.fail(deserializeError(result.error));
					}

					const output: GraphOutput = {
						nerinResponse: result.nerinResponse ?? "",
						tokenUsage: result.tokenUsage ?? { input: 0, output: 0, total: 0 },
						costIncurred: result.costIncurred ?? 0,
						steeringTarget: result.steeringTarget,
						steeringHint: result.steeringHint,
					};

					return output;
				}),
		});
	}),
);
