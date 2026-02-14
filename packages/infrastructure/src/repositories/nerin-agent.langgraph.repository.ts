/**
 * Nerin Agent Repository Implementation
 *
 * LangGraph-based implementation of the Nerin conversational agent.
 * Uses PostgresSaver for state persistence across API calls.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, type BaseMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { AgentInvocationError } from "@workspace/contracts/errors";
import type { FacetScoresMap } from "@workspace/domain";
import {
	AppConfig,
	buildSystemPrompt,
	LoggerRepository,
	type NerinResponse,
	NerinResponseJsonSchema,
	validateNerinResponse,
} from "@workspace/domain";
import {
	NerinAgentRepository,
	type NerinInvokeInput,
	type TokenUsage,
} from "@workspace/domain/repositories/nerin-agent.repository";
import { Effect, Either, Layer } from "effect";

/**
 * Pricing constants for Claude Sonnet 4.5
 * Per 1 million tokens
 */
const INPUT_PRICE_PER_MILLION = 0.003;
const OUTPUT_PRICE_PER_MILLION = 0.015;

/**
 * Calculate cost from token usage
 */
function calculateCost(usage: TokenUsage): {
	inputCost: number;
	outputCost: number;
	totalCost: number;
} {
	const inputCost = (usage.input / 1_000_000) * INPUT_PRICE_PER_MILLION;
	const outputCost = (usage.output / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
	return {
		inputCost,
		outputCost,
		totalCost: inputCost + outputCost,
	};
}

/**
 * State Annotation for LangGraph
 * Uses Annotation.Root for proper TypeScript typing
 *
 * Nerin operates at facet-level granularity with optional steering hints
 * calculated by the orchestrator based on outlier detection.
 */
const NerinStateAnnotation = Annotation.Root({
	sessionId: Annotation<string>,
	messages: Annotation<BaseMessage[]>({
		reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
		default: () => [] as BaseMessage[],
	}),
	facetScores: Annotation<FacetScoresMap | undefined>,
	steeringHint: Annotation<string | undefined>,
	tokenCount: Annotation<TokenUsage | undefined>,
});

type NerinGraphState = typeof NerinStateAnnotation.State;

/**
 * Create the ChatAnthropic model instance with structured output
 */
function createModel(config: { modelId: string; maxTokens: number; temperature: number }) {
	const baseModel = new ChatAnthropic({
		model: config.modelId,
		maxTokens: config.maxTokens,
		temperature: config.temperature,
	});

	// Use structured output with includeRaw to preserve AIMessage token metadata
	return baseModel.withStructuredOutput(NerinResponseJsonSchema, { includeRaw: true });
}

/**
 * Nerin Agent Repository Layer
 *
 * Layer type: Layer<NerinAgentRepository, never, LoggerRepository>
 * Initializes LangGraph and PostgresSaver during layer construction.
 */
export const NerinAgentLangGraphRepositoryLive = Layer.effect(
	NerinAgentRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// Initialize PostgresSaver if DATABASE_URL is available
		const dbUri = process.env.DATABASE_URL;
		let checkpointer: PostgresSaver | undefined;

		if (dbUri) {
			const saver = PostgresSaver.fromConnString(dbUri);
			checkpointer = saver;
			// Setup checkpointer tables (using Effect.promise for async)
			yield* Effect.tryPromise({
				try: () => saver.setup(),
				catch: (error) => {
					logger.error("Failed to initialize PostgresSaver", {
						error: error instanceof Error ? error.message : String(error),
					});
					// Return undefined to continue without checkpointer
					return undefined;
				},
			}).pipe(
				Effect.tap(() => Effect.sync(() => logger.info("PostgresSaver checkpointer initialized"))),
				Effect.catchAll(() => Effect.succeed(undefined)),
			);
		} else {
			logger.warn("DATABASE_URL not set - Nerin agent state will not persist");
		}

		// Create the model from config
		const model = createModel({
			modelId: config.nerinModelId,
			maxTokens: config.nerinMaxTokens,
			temperature: config.nerinTemperature,
		});

		logger.info("Nerin agent model configured", {
			model: config.nerinModelId,
		});

		// Build the LangGraph workflow with typed state
		const workflow = new StateGraph(NerinStateAnnotation)
			.addNode("nerin", async (state: NerinGraphState) => {
				// Build system prompt with facet scores and steering hint
				const systemPrompt = buildSystemPrompt(state.facetScores, state.steeringHint);

				// Prepare messages with system prompt
				const allMessages = [new SystemMessage({ content: systemPrompt }), ...state.messages];

				// Invoke model with structured output (includeRaw: true returns { raw, parsed })
				const response = await model.invoke(allMessages);

				// Extract token usage from raw AIMessage metadata
				const usageMeta = (response.raw as AIMessage)?.usage_metadata;
				const tokenUsage: TokenUsage = {
					input: usageMeta?.input_tokens ?? 0,
					output: usageMeta?.output_tokens ?? 0,
					total: (usageMeta?.input_tokens ?? 0) + (usageMeta?.output_tokens ?? 0),
				};

				// Validate the parsed structured response
				const validationResult = validateNerinResponse(response.parsed);

				if (Either.isLeft(validationResult)) {
					// Log validation error but continue with raw response
					logger.warn("Nerin response validation failed, using raw response", {
						sessionId: state.sessionId,
						error: String(validationResult.left),
					});
					// Use parsed response when validation fails
					const rawParsed = response.parsed as NerinResponse;
					return {
						messages: [new AIMessage({ content: rawParsed.message })],
						tokenCount: tokenUsage,
					};
				}

				// Use validated response
				const structuredResponse = validationResult.right;

				return {
					messages: [new AIMessage({ content: structuredResponse.message })],
					tokenCount: tokenUsage,
				};
			})
			.addEdge(START, "nerin")
			.addEdge("nerin", END);

		// Compile the graph with checkpointer
		const graph = workflow.compile({
			checkpointer: checkpointer,
		});

		logger.info("Nerin agent graph compiled successfully");

		// Return service implementation
		return NerinAgentRepository.of({
			invoke: (input: NerinInvokeInput) =>
				Effect.tryPromise({
					try: async () => {
						const result = await graph.invoke(
							{
								sessionId: input.sessionId,
								messages: [...input.messages],
								facetScores: input.facetScores,
								steeringHint: input.steeringHint,
							},
							{
								configurable: { thread_id: input.sessionId },
							},
						);

						// Extract response from last message
						const lastMessage = result.messages.at(-1);
						const response = lastMessage ? String(lastMessage.content) : "";

						// Get token count with defaults
						const tokenCount: TokenUsage = result.tokenCount ?? {
							input: 0,
							output: 0,
							total: 0,
						};

						// Log cost
						const cost = calculateCost(tokenCount);
						logger.info("Nerin response generated", {
							sessionId: input.sessionId,
							responseLength: response.length,
							tokenCount,
							cost: cost.totalCost,
							steeringHint: input.steeringHint,
							facetCount: Object.keys(input.facetScores ?? {}).length,
						});

						return {
							response,
							tokenCount,
						};
					},
					catch: (error) =>
						new AgentInvocationError({
							agentName: "Nerin",
							sessionId: input.sessionId,
							message: error instanceof Error ? error.message : "Unknown agent error",
						}),
				}),
		});
	}),
);
