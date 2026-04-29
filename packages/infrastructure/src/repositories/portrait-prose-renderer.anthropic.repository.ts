/**
 * Portrait Prose Renderer — Anthropic Messages API (ADR-51 Stage C).
 * Brief-only input: SpineBrief JSON + NERIN_PERSONA + PORTRAIT_CONTEXT.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	AppConfig,
	buildPortraitProseUserPrompt,
	NERIN_PERSONA,
	PORTRAIT_CONTEXT,
	PortraitGenerationError,
	type PortraitProseRendererInput,
	PortraitProseRendererRepository,
} from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Effect, Layer, Redacted } from "effect";

export const PortraitProseRendererAnthropicRepositoryLive = Layer.effect(
	PortraitProseRendererRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		const systemPrompt = `${NERIN_PERSONA}\n\n${PORTRAIT_CONTEXT}`;

		return PortraitProseRendererRepository.of({
			renderPortraitProse: (input: PortraitProseRendererInput) =>
				Effect.gen(function* () {
					const briefJson = JSON.stringify(input.brief, null, 2);
					const userPrompt = buildPortraitProseUserPrompt(briefJson);
					const client = new Anthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

					logger.info("Portrait pipeline: prose rendering started", {
						sessionId: input.sessionId,
						model: config.portraitProseRendererModelId,
					});

					const result = yield* Effect.tryPromise({
						try: async () => {
							const response = await client.messages.create({
								model: config.portraitProseRendererModelId,
								max_tokens: config.portraitMaxTokens,
								temperature: config.portraitProseRendererTemperature,
								system: systemPrompt,
								messages: [{ role: "user", content: userPrompt }],
							});
							return response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
						},
						catch: (e) =>
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Portrait prose rendering failed",
								cause: e instanceof Error ? e.message : String(e),
								stage: "prose",
							}),
					});

					if (!result.trim()) {
						return yield* Effect.fail(
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Portrait prose rendering returned empty content",
								stage: "prose",
							}),
						);
					}

					logger.info("Portrait pipeline: prose rendering completed", {
						sessionId: input.sessionId,
						portraitLength: result.length,
					});

					return result;
				}),
		});
	}),
);
