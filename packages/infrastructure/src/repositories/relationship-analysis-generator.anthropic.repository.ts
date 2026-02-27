/**
 * Relationship Analysis Generator Repository Implementation (Story 14.4)
 *
 * Claude Sonnet-based implementation for generating relationship personality
 * comparison analyses.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import {
	AppConfig,
	buildRelationshipAnalysisPrompt,
	LoggerRepository,
	RelationshipAnalysisGenerationError,
	type RelationshipAnalysisGenerationInput,
	RelationshipAnalysisGeneratorRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";

function extractTextContent(content: unknown): string {
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

export const RelationshipAnalysisGeneratorAnthropicRepositoryLive = Layer.effect(
	RelationshipAnalysisGeneratorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const model = new ChatAnthropic({
			model: config.portraitModelId,
			maxTokens: 4096,
			apiKey: Redacted.value(config.anthropicApiKey),
		});

		logger.info("Relationship analysis generator initialized", {
			model: config.portraitModelId,
		});

		return RelationshipAnalysisGeneratorRepository.of({
			generateAnalysis: (input: RelationshipAnalysisGenerationInput) =>
				Effect.gen(function* () {
					const startTime = Date.now();
					logger.info("Relationship analysis generation started");

					const { systemPrompt, userPrompt } = buildRelationshipAnalysisPrompt(input);

					const result = yield* Effect.tryPromise({
						try: async () => {
							const response = await model.invoke([
								{ role: "system", content: systemPrompt },
								{ role: "user", content: userPrompt },
							]);
							return extractTextContent(response.content);
						},
						catch: (error) =>
							new RelationshipAnalysisGenerationError({
								message: "Failed to generate relationship analysis via Claude API",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					if (!result.trim()) {
						return yield* Effect.fail(
							new RelationshipAnalysisGenerationError({
								message: "Relationship analysis generation returned empty content",
							}),
						);
					}

					const duration = Date.now() - startTime;
					logger.info("Relationship analysis generation completed", {
						durationMs: duration,
						contentLength: result.length,
					});

					return {
						content: result,
						modelUsed: config.portraitModelId,
					};
				}),
		});
	}),
);
