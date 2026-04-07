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
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
	AppConfig,
	buildDirectorUserMessage,
	calculateCost,
	LoggerRepository,
	NerinDirectorError,
	type NerinDirectorInput,
	type NerinDirectorOutput,
	NerinDirectorRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

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
	// Assistant prefill anchors the model into the structured brief format,
	// preventing drift into Nerin's first-person voice under context pressure.
	const DIRECTOR_PREFILL = "BRIEF FOR NERIN:\n\nAcknowledge beat:\n";

	const messages = [
		new SystemMessage({ content: input.systemPrompt }),
		new HumanMessage({ content: userMessage }),
		new AIMessage({ content: DIRECTOR_PREFILL }),
	];

	const response = await model.invoke(messages);

	const usageMeta = response.usage_metadata;
	const tokenUsage = {
		input: usageMeta?.input_tokens ?? 0,
		output: usageMeta?.output_tokens ?? 0,
	};

	const rawBrief =
		typeof response.content === "string"
			? response.content
			: ((response.content[0] as { text: string })?.text ?? "");

	// Prepend the prefill so the stored brief is complete
	const brief = DIRECTOR_PREFILL + rawBrief;

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
						const cost = calculateCost(
							result.tokenUsage.input,
							result.tokenUsage.output,
							config.nerinDirectorModelId,
						);
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

					const cost = calculateCost(
						attempt2.tokenUsage.input,
						attempt2.tokenUsage.output,
						config.nerinDirectorModelId,
					);
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
