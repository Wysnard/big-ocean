/**
 * Nerin Agent Repository Implementation
 *
 * Direct Claude invocation implementation of the Nerin conversational agent.
 * Uses ChatAnthropic.withStructuredOutput for typed responses.
 *
 * Fix 1: Flattened from StateGraph to plain model.invoke() — the graph had
 * a single node (START → nerin → END) with no routing benefit, and its
 * checkpointer was redundant since the orchestrator already passes full
 * message history.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentInvocationError } from "@workspace/contracts/errors";
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
 * Convert DomainMessage[] to LangChain BaseMessage[] for model invocation.
 */
function domainToLangChain(messages: NerinInvokeInput["messages"]) {
	return messages.map((msg) =>
		msg.role === "user"
			? new HumanMessage({ content: msg.content, id: msg.id })
			: new AIMessage({ content: msg.content, id: msg.id }),
	);
}

/**
 * Nerin Agent Repository Layer
 *
 * Layer type: Layer<NerinAgentRepository, never, LoggerRepository>
 * Direct model invocation — no graph overhead.
 */
export const NerinAgentLangGraphRepositoryLive = Layer.effect(
	NerinAgentRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// Create the model from config
		const model = createModel({
			modelId: config.nerinModelId,
			maxTokens: config.nerinMaxTokens,
			temperature: config.nerinTemperature,
		});

		logger.info("Nerin agent model configured", {
			model: config.nerinModelId,
		});

		// Return service implementation
		return NerinAgentRepository.of({
			invoke: (input: NerinInvokeInput) =>
				Effect.tryPromise({
					try: async () => {
						// Build system prompt with facet scores and steering hint
						const systemPrompt = buildSystemPrompt(input.facetScores, input.steeringHint);

						// Convert domain messages to LangChain format and prepend system prompt
						const langchainMessages = domainToLangChain(input.messages);
						const allMessages = [new SystemMessage({ content: systemPrompt }), ...langchainMessages];

						// Invoke model with structured output (includeRaw: true returns { raw, parsed })
						const response = await model.invoke(allMessages);

						// Extract token usage from raw AIMessage metadata
						const usageMeta = (response.raw as AIMessage)?.usage_metadata;
						const tokenCount: TokenUsage = {
							input: usageMeta?.input_tokens ?? 0,
							output: usageMeta?.output_tokens ?? 0,
							total: (usageMeta?.input_tokens ?? 0) + (usageMeta?.output_tokens ?? 0),
						};

						// Validate the parsed structured response
						const validationResult = validateNerinResponse(response.parsed);

						let responseText: string;
						if (Either.isLeft(validationResult)) {
							// Log validation error but continue with raw response
							logger.warn("Nerin response validation failed, using raw response", {
								sessionId: input.sessionId,
								error: String(validationResult.left),
							});
							const rawParsed = response.parsed as NerinResponse;
							responseText = rawParsed.message;
						} else {
							responseText = validationResult.right.message;
						}

						// Log cost
						const cost = calculateCost(tokenCount);
						logger.info("Nerin response generated", {
							sessionId: input.sessionId,
							responseLength: responseText.length,
							tokenCount,
							cost: cost.totalCost,
							steeringHint: input.steeringHint,
							facetCount: Object.keys(input.facetScores ?? {}).length,
						});

						return {
							response: responseText,
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
