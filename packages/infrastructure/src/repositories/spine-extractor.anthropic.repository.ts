/**
 * Spine Extractor — Anthropic Messages API (ADR-51 Stage A).
 * Direct @anthropic-ai/sdk with extended thinking on the extractor model.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	AppConfig,
	buildSpineExtractorUserPrompt,
	PortraitGenerationError,
	type PortraitUserSummaryInput,
	type SpineExtractorInput,
	SpineExtractorRepository,
} from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { SpineBrief } from "@workspace/domain/types/spine-brief";
import { Effect, Layer, Redacted } from "effect";
import { formatTraitSummary } from "./portrait-prompt.utils";
import { parseSpineBriefJson, unwrapJsonFence } from "./portrait-spine-json";

function formatUserSummaryBlock(input: PortraitUserSummaryInput): string {
	const themes = input.themes.map((t) => `- ${t.theme}: ${t.description}`).join("\n");
	const quotes = input.quoteBank.map((q) => `- ${q.quote}`).join("\n");
	return `${input.summaryText}\n\nTHEMES:\n${themes}\n\nQUOTE BANK:\n${quotes}`;
}

export const SpineExtractorAnthropicRepositoryLive = Layer.effect(
	SpineExtractorRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		return SpineExtractorRepository.of({
			extractSpineBrief: (input: SpineExtractorInput) =>
				Effect.gen(function* () {
					const userSummaryBlock = formatUserSummaryBlock(input.userSummary);
					const facetTraitBlock = formatTraitSummary(input.facetScoresMap, input.traitScoresMap);
					const userPrompt = buildSpineExtractorUserPrompt({
						userSummaryBlock,
						facetTraitBlock,
						gapFeedbackBlock: input.gapFeedback,
					});

					const client = new Anthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

					logger.info("Portrait pipeline: spine extraction started", {
						sessionId: input.sessionId,
						model: config.portraitSpineExtractorModelId,
					});

					const raw = yield* Effect.tryPromise({
						try: async () => {
							const response = await client.messages.create({
								model: config.portraitSpineExtractorModelId,
								max_tokens: config.portraitMaxTokens,
								system:
									"You are Stage A (Spine Extractor). Reply with ONLY valid JSON — no markdown, no commentary.",
								messages: [{ role: "user", content: userPrompt }],
								thinking: {
									type: "enabled",
									budget_tokens: config.portraitSpineThinkingBudgetTokens,
								},
							});
							return unwrapJsonFence(
								response.content.map((b) => (b.type === "text" ? b.text : "")).join(""),
							);
						},
						catch: (e) =>
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Spine extraction failed",
								cause: e instanceof Error ? e.message : String(e),
								stage: "extract",
							}),
					});

					let brief: SpineBrief;
					try {
						brief = parseSpineBriefJson(raw, input.sessionId);
					} catch (e) {
						return yield* Effect.fail(
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: e instanceof Error ? e.message : "SpineBrief validation failed",
								stage: "extract",
							}),
						);
					}

					logger.info("Portrait pipeline: spine extraction completed", {
						sessionId: input.sessionId,
					});

					return brief;
				}),
		});
	}),
);
