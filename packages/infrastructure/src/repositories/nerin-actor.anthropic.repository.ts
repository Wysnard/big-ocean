/**
 * Nerin Actor Repository Implementation — ADR-DM-3
 *
 * Voices Director briefs as Nerin's character via Claude invocation.
 * Actor receives only the static actor prompt (system message) and the
 * Director's brief (user message). No conversation history.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentInvocationError } from "@workspace/contracts/errors";
import { AppConfig, calculateCost, LoggerRepository } from "@workspace/domain";
import {
	type NerinActorInvokeInput,
	NerinActorRepository,
	type TokenUsage,
} from "@workspace/domain/repositories/nerin-actor.repository";
import { Effect, Layer } from "effect";

/**
 * Create the ChatAnthropic model instance (plain text output)
 */
function createModel(config: { modelId: string; maxTokens: number; temperature: number }) {
	return new ChatAnthropic({
		model: config.modelId,
		maxTokens: config.maxTokens,
		temperature: config.temperature,
	});
}

/**
 * Nerin Actor Repository Layer — ADR-DM-3
 *
 * Layer type: Layer<NerinActorRepository, never, LoggerRepository>
 * Direct model invocation — actor prompt as system message, director brief as user message.
 */
export const NerinActorAnthropicRepositoryLive = Layer.effect(
	NerinActorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// Create the model from config (plain text, no structured output)
		const model = createModel({
			modelId: config.nerinModelId,
			maxTokens: config.nerinMaxTokens,
			temperature: config.nerinTemperature,
		});

		logger.info("Nerin Actor model configured", {
			model: config.nerinModelId,
		});

		// Return service implementation
		return NerinActorRepository.of({
			invoke: (input: NerinActorInvokeInput) =>
				Effect.tryPromise({
					try: async () => {
						// Actor receives: system prompt (actor prompt) + user message (director brief)
						const allMessages = [
							new SystemMessage({ content: input.actorPrompt }),
							new HumanMessage({ content: input.directorBrief }),
						];

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
						logger.info("Nerin Actor response generated", {
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
							agentName: "NerinActor",
							sessionId: input.sessionId,
							message: error instanceof Error ? error.message : "Unknown agent error",
						}),
				}),
		});
	}),
);
