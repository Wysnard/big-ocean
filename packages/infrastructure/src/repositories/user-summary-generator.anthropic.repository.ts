/**
 * UserSummary generator — Claude Haiku (Story 7.1).
 */

import { ChatAnthropic } from "@langchain/anthropic";
import {
	AppConfig,
	buildUserSummaryPrompt,
	decodeUserSummaryLlmPayload,
	LoggerRepository,
	UserSummaryGenerationError,
	type UserSummaryGenerationInput,
	UserSummaryGeneratorRepository,
} from "@workspace/domain";
import { Effect, Either, Layer, Redacted } from "effect";

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

export const UserSummaryGeneratorAnthropicRepositoryLive = Layer.effect(
	UserSummaryGeneratorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const model = new ChatAnthropic({
			model: config.conversanalyzerModelId,
			maxTokens: 8192,
			temperature: 0.35,
			apiKey: Redacted.value(config.anthropicApiKey),
		});

		logger.info("User summary generator initialized", {
			model: config.conversanalyzerModelId,
		});

		return UserSummaryGeneratorRepository.of({
			generate: (input: UserSummaryGenerationInput) =>
				Effect.gen(function* () {
					const startTime = Date.now();
					logger.info("User summary generation started", { sessionId: input.sessionId });

					const { systemPrompt, userPrompt } = buildUserSummaryPrompt({
						sessionId: input.sessionId,
						facets: input.facets,
						evidence: input.evidence,
					});

					const rawContent = yield* Effect.tryPromise({
						try: async () => {
							const response = await model.invoke([
								{ role: "system", content: systemPrompt },
								{ role: "user", content: userPrompt },
							]);
							return extractTextContent(response.content);
						},
						catch: (error) =>
							new UserSummaryGenerationError({
								message: "Failed to generate user summary via Claude API",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					const trimmed = rawContent.trim();
					if (!trimmed) {
						return yield* Effect.fail(
							new UserSummaryGenerationError({
								message: "User summary generation returned empty content",
							}),
						);
					}

					const parsed = decodeUserSummaryLlmPayload(trimmed);
					if (Either.isLeft(parsed)) {
						return yield* Effect.fail(
							new UserSummaryGenerationError({
								message: parsed.left,
							}),
						);
					}

					const duration = Date.now() - startTime;
					logger.info("User summary generation completed", {
						sessionId: input.sessionId,
						durationMs: duration,
						themeCount: parsed.right.themes.length,
						quoteCount: parsed.right.quoteBank.length,
					});

					return {
						themes: parsed.right.themes,
						quoteBank: parsed.right.quoteBank,
						summaryText: parsed.right.summaryText,
						modelUsed: config.conversanalyzerModelId,
					};
				}),
		});
	}),
);
