/**
 * Weekly summary letter generator — Claude Sonnet (Story 5.1)
 */

import { ChatAnthropic } from "@langchain/anthropic";
import {
	AppConfig,
	buildWeeklySummaryPrompt,
	LoggerRepository,
	WeeklySummaryGenerationError,
	type WeeklySummaryGenerationInput,
	WeeklySummaryGeneratorRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";

function extractTextContent(content: unknown): string {
	if (content == null) return "";
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.filter(
				(block): block is { type: "text"; text: string } =>
					typeof block === "object" &&
					block !== null &&
					"type" in block &&
					block.type === "text" &&
					"text" in block &&
					typeof block.text === "string",
			)
			.map((block) => block.text)
			.join("");
	}
	return String(content);
}

export const WeeklySummaryGeneratorAnthropicRepositoryLive = Layer.effect(
	WeeklySummaryGeneratorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const model = new ChatAnthropic({
			model: config.portraitGeneratorModelId,
			maxTokens: 4096,
			temperature: 0.65,
			apiKey: Redacted.value(config.anthropicApiKey),
		});

		logger.info("Weekly summary generator initialized", {
			model: config.portraitGeneratorModelId,
		});

		return WeeklySummaryGeneratorRepository.of({
			generateLetter: (input: WeeklySummaryGenerationInput) =>
				Effect.gen(function* () {
					const startTime = Date.now();
					logger.info("Weekly summary generation started", { weekId: input.weekId });

					const { systemPrompt, userPrompt } = buildWeeklySummaryPrompt(input);

					const rawContent = yield* Effect.tryPromise({
						try: async () => {
							const response = await model.invoke([
								{ role: "system", content: systemPrompt },
								{ role: "user", content: userPrompt },
							]);
							return extractTextContent(response.content);
						},
						catch: (error) =>
							new WeeklySummaryGenerationError({
								message: "Failed to generate weekly summary via Claude API",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					if (!rawContent.trim()) {
						return yield* Effect.fail(
							new WeeklySummaryGenerationError({
								message: "Weekly summary generation returned empty content",
							}),
						);
					}

					const duration = Date.now() - startTime;
					logger.info("Weekly summary generation completed", {
						durationMs: duration,
						contentLength: rawContent.length,
					});

					return {
						content: rawContent.trim(),
						modelUsed: config.portraitGeneratorModelId,
					};
				}),
		});
	}),
);
