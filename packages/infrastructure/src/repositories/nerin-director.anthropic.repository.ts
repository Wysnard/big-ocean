/**
 * Nerin Director Anthropic Repository Implementation (Story 43-3)
 *
 * LangChain/Anthropic implementation of the Nerin Director LLM call.
 * The Director reads the full conversation and produces a creative director brief
 * for Nerin Actor.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 *
 * Retry strategy (ADR-DM-4): retry once with different temperature, then throw.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
	AppConfig,
	buildDirectorUserMessage,
	LoggerRepository,
	NerinDirectorError,
	type NerinDirectorInput,
	type NerinDirectorOutput,
	NerinDirectorRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * Pricing constants for Claude Sonnet (default Director model)
 * Per 1 million tokens
 */
const INPUT_PRICE_PER_MILLION = 0.003;
const OUTPUT_PRICE_PER_MILLION = 0.015;

function calculateCost(tokenUsage: { input: number; output: number }) {
	const inputCost = (tokenUsage.input / 1_000_000) * INPUT_PRICE_PER_MILLION;
	const outputCost = (tokenUsage.output / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
	return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function createModel(config: { modelId: string; maxTokens: number; temperature: number }) {
	return new ChatAnthropic({
		model: config.modelId,
		maxTokens: config.maxTokens,
		temperature: config.temperature,
	});
}

/**
 * Invoke the Director model and extract text + token usage.
 */
async function invokeDirector(
	model: ChatAnthropic,
	input: NerinDirectorInput,
	userMessage: string,
): Promise<NerinDirectorOutput> {
	const messages = [
		new SystemMessage({ content: input.systemPrompt }),
		new HumanMessage({ content: userMessage }),
	];

	const response = await model.invoke(messages);

	const usageMeta = response.usage_metadata;
	const tokenUsage = {
		input: usageMeta?.input_tokens ?? 0,
		output: usageMeta?.output_tokens ?? 0,
	};

	const brief =
		typeof response.content === "string"
			? response.content
			: ((response.content[0] as { text: string })?.text ?? "");

	return { brief, tokenUsage };
}

/**
 * Nerin Director Repository Layer
 *
 * Layer type: Layer<NerinDirectorRepository, never, LoggerRepository | AppConfig>
 *
 * Implements ADR-DM-4 retry strategy:
 * - First attempt with configured temperature
 * - On failure: retry with different temperature
 * - On second failure: throw NerinDirectorError
 */
export const NerinDirectorAnthropicRepositoryLive = Layer.effect(
	NerinDirectorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const primaryModel = createModel({
			modelId: config.nerinDirectorModelId,
			maxTokens: config.nerinDirectorMaxTokens,
			temperature: config.nerinDirectorTemperature,
		});

		const retryModel = createModel({
			modelId: config.nerinDirectorModelId,
			maxTokens: config.nerinDirectorMaxTokens,
			temperature: config.nerinDirectorRetryTemperature,
		});

		logger.info("Nerin Director model configured", {
			model: config.nerinDirectorModelId,
			temperature: config.nerinDirectorTemperature,
			retryTemperature: config.nerinDirectorRetryTemperature,
		});

		return NerinDirectorRepository.of({
			generateBrief: (input: NerinDirectorInput) =>
				Effect.gen(function* () {
					// Build the user message from coverage targets + conversation
					const userMessage = buildDirectorUserMessage(input.coverageTargets, input.messages);

					// Attempt 1: primary temperature
					const attempt1 = yield* Effect.tryPromise({
						try: () => invokeDirector(primaryModel, input, userMessage),
						catch: (error) => error,
					}).pipe(Effect.either);

					if (attempt1._tag === "Right") {
						const result = attempt1.right;
						const cost = calculateCost(result.tokenUsage);
						logger.info("Nerin Director brief generated", {
							sessionId: input.sessionId,
							brief: result.brief,
							briefLength: result.brief.length,
							tokenUsage: result.tokenUsage,
							cost: cost.totalCost,
							attempt: 1,
						});
						return result;
					}

					// Attempt 2: retry temperature (ADR-DM-4)
					logger.warn("Nerin Director attempt 1 failed, retrying with different temperature", {
						sessionId: input.sessionId,
						error: attempt1.left instanceof Error ? attempt1.left.message : String(attempt1.left),
					});

					const attempt2 = yield* Effect.tryPromise({
						try: () => invokeDirector(retryModel, input, userMessage),
						catch: (error) =>
							new NerinDirectorError({
								message: `Nerin Director failed after 2 attempts: ${error instanceof Error ? error.message : String(error)}`,
								sessionId: input.sessionId,
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					const cost = calculateCost(attempt2.tokenUsage);
					logger.info("Nerin Director brief generated (retry)", {
						sessionId: input.sessionId,
						brief: attempt2.brief,
						briefLength: attempt2.brief.length,
						tokenUsage: attempt2.tokenUsage,
						cost: cost.totalCost,
						attempt: 2,
					});

					return attempt2;
				}),
		});
	}),
);
