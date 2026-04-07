/**
 * Nerin Agent Repository Implementation
 *
 * Direct Claude invocation implementation of the Nerin conversational agent.
 * Returns plain text/markdown responses (no structured output).
 *
 * Fix 1: Flattened from StateGraph to plain model.invoke() — the graph had
 * a single node (START → nerin → END) with no routing benefit, and its
 * checkpointer was redundant since the orchestrator already passes full
 * message history.
 *
 * Story 2.12: Removed withStructuredOutput() — Nerin now returns natural
 * text/markdown to support rich rendering in chat UI.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentInvocationError } from "@workspace/contracts/errors";
import { AppConfig, calculateCost, LoggerRepository } from "@workspace/domain";
import {
	NerinAgentRepository,
	type NerinInvokeInput,
	type TokenUsage,
} from "@workspace/domain/repositories/nerin-agent.repository";
import { Effect, Layer } from "effect";

/**
 * Create the ChatAnthropic model instance (plain text output, no structured output)
 */
function createModel(config: { modelId: string; maxTokens: number; temperature: number }) {
	return new ChatAnthropic({
		model: config.modelId,
		maxTokens: config.maxTokens,
		temperature: config.temperature,
	});
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
export const NerinAgentAnthropicRepositoryLive = Layer.effect(
	NerinAgentRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// Create the model from config (plain text, no structured output)
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
						// Story 27-3: Use the pre-composed system prompt from the pipeline
						const systemPrompt = input.systemPrompt ?? "";

						// Convert domain messages to LangChain format and prepend system prompt
						const langchainMessages = domainToLangChain(input.messages);
						const allMessages = [new SystemMessage({ content: systemPrompt }), ...langchainMessages];

						// Invoke model — returns AIMessage with plain text content
						const response = await model.invoke(allMessages);

						// Extract token usage from AIMessage metadata
						const usageMeta = response.usage_metadata;
						const tokenCount: TokenUsage = {
							input: usageMeta?.input_tokens ?? 0,
							output: usageMeta?.output_tokens ?? 0,
							total: (usageMeta?.input_tokens ?? 0) + (usageMeta?.output_tokens ?? 0),
						};

						// Extract plain text content from response
						const responseText =
							typeof response.content === "string"
								? response.content
								: ((response.content[0] as { text: string })?.text ?? "");

						// Log cost
						const cost = calculateCost(tokenCount.input, tokenCount.output, config.nerinModelId);
						logger.info("Nerin response generated", {
							sessionId: input.sessionId,
							responseLength: responseText.length,
							tokenCount,
							cost: cost.totalCost,
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
