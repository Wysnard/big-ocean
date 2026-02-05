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
 * Build dynamic system prompt based on facet scores and steering hint
 *
 * @param facetScores - Current facet assessment scores (optional)
 * @param steeringHint - Natural language hint for conversation direction (optional)
 * @returns System prompt for Nerin agent
 */
function buildSystemPrompt(facetScores?: FacetScoresMap, steeringHint?: string): string {
	let prompt = `You are Nerin, a warm and curious conversational partner helping users explore their personality through natural dialogue.

Key behaviors:
- Begin with a warm greeting when starting a new conversation
- Ask open-ended questions that invite genuine sharing
- Maintain a non-judgmental, supportive tone throughout
- Reference earlier parts of the conversation to show you're listening
- Avoid repetitive questions or making it feel forced or clinical
- Keep responses concise but engaging (2-4 sentences typically)

You MUST respond in the following JSON format:
{
  "message": "Your conversational response here",
  "emotionalTone": "warm" | "curious" | "supportive" | "encouraging",
  "followUpIntent": true | false,
  "suggestedTopics": ["topic1", "topic2"]
}

Guidelines for JSON fields:
- message: Your natural, conversational response (required)
- emotionalTone: Choose based on the conversation context (required)
- followUpIntent: true if you're asking a question to continue conversation (required)
- suggestedTopics: Optional future conversation topics (can be empty array)`;

	// Add steering hint if provided (facet-level guidance from orchestrator)
	if (steeringHint) {
		prompt += `

Current conversation focus:
${steeringHint}
Naturally guide the conversation to explore this area while keeping the dialogue comfortable and authentic.`;
	}

	// Add assessment progress context if facet scores available
	if (facetScores) {
		const assessedCount = Object.keys(facetScores).length;
		if (assessedCount > 0) {
			prompt += `

Assessment progress: ${assessedCount} personality facets have been explored so far.`;
		}
	}

	return prompt;
}

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
function createModel() {
	const baseModel = new ChatAnthropic({
		model: process.env.NERIN_MODEL_ID || "claude-sonnet-4-20250514",
		maxTokens: Number(process.env.NERIN_MAX_TOKENS) || 1024,
		temperature: Number(process.env.NERIN_TEMPERATURE) || 0.7,
	});

	// Use structured output with JSON Schema from Effect Schema
	return baseModel.withStructuredOutput(NerinResponseJsonSchema);
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

		// Create the model
		const model = createModel();

		// Build the LangGraph workflow with typed state
		const workflow = new StateGraph(NerinStateAnnotation)
			.addNode("nerin", async (state: NerinGraphState) => {
				// Build system prompt with facet scores and steering hint
				const systemPrompt = buildSystemPrompt(state.facetScores, state.steeringHint);

				// Prepare messages with system prompt
				const allMessages = [new SystemMessage({ content: systemPrompt }), ...state.messages];

				// Track token usage via callback
				let tokenUsage: TokenUsage = { input: 0, output: 0, total: 0 };

				// Invoke model with structured output and token tracking
				const response = await model.invoke(allMessages, {
					callbacks: [
						{
							handleLLMEnd: (output) => {
								const usage = output.llmOutput?.tokenUsage;
								if (usage) {
									tokenUsage = {
										input: usage.promptTokens || 0,
										output: usage.completionTokens || 0,
										total: usage.totalTokens || 0,
									};
								}
							},
						},
					],
				});

				// Validate response against schema
				const validationResult = validateNerinResponse(response);

				if (Either.isLeft(validationResult)) {
					// Log validation error but continue with raw response
					logger.warn("Nerin response validation failed, using raw response", {
						sessionId: state.sessionId,
						error: String(validationResult.left),
					});
					// Use raw response when validation fails
					const rawResponse = response as NerinResponse;
					return {
						messages: [new AIMessage({ content: rawResponse.message })],
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
