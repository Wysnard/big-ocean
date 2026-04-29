/**
 * Portrait Generator Repository Implementation
 *
 * Claude-based implementation for generating personalized personality portraits
 * in Nerin's confidant voice. Uses letter-framing architecture with depth
 * adaptation (RICH/MODERATE/THIN) based on evidence density.
 *
 * Architecture:
 * - Production: Uses @langchain/anthropic ChatAnthropic
 * - Testing: Mock implementation via __mocks__/ sibling
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies: LoggerRepository, AppConfig
 */

import { ChatAnthropic } from "@langchain/anthropic";
import {
	AppConfig,
	buildPortraitPrompt,
	LoggerRepository,
	PortraitGenerationError,
	type PortraitGenerationInput,
	PortraitGeneratorRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import {
	computeDepthSignal,
	FACET_GLOSSARY,
	formatEvidence,
	formatTraitSummary,
} from "./portrait-prompt.utils";

/**
 * Extract text content from a ChatAnthropic response.
 *
 * With extended thinking enabled, response.content is an array of content blocks
 * (e.g. [{ type: "thinking", ... }, { type: "text", text: "..." }]).
 * Without thinking, it may be a plain string.
 */
function extractTextContent(content: string | Array<{ type: string; text?: string }>): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.filter(
				(block): block is { type: "text"; text: string } =>
					block.type === "text" && typeof block.text === "string",
			)
			.map((block) => block.text)
			.join("");
	}
	return String(content);
}

/**
 * Portrait Generator Repository Layer (Production)
 *
 * Uses Claude Sonnet 4.6 with adaptive extended thinking via ChatAnthropic.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export const PortraitGeneratorClaudeRepositoryLive = Layer.effect(
	PortraitGeneratorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const model = new ChatAnthropic({
			model: config.portraitModelId,
			maxTokens: config.portraitMaxTokens,
			apiKey: Redacted.value(config.anthropicApiKey),
		});

		logger.info("Portrait generator Claude repository initialized", {
			model: config.portraitModelId,
			maxTokens: config.portraitMaxTokens,
		});

		return PortraitGeneratorRepository.of({
			generatePortrait: (input: PortraitGenerationInput) =>
				Effect.gen(function* () {
					const startTime = Date.now();
					logger.info("Portrait generation started", {
						sessionId: input.sessionId,
					});

					const traitSummary = formatTraitSummary(input.facetScoresMap, input.traitScoresMap);
					const evidenceFormatted = formatEvidence(input.allEvidence);
					const depthSignal = computeDepthSignal(input.scoringEvidence);

					const userSummaryBlock =
						input.userSummary !== undefined
							? `USER SUMMARY (canonical compressed user-state — prioritize themes and verbatim quotes for voice and specificity):\n\n${input.userSummary.summaryText}\n\nTHEMES:\n${input.userSummary.themes.map((t) => `- ${t.theme}: ${t.description}`).join("\n")}\n\nQUOTE BANK (verbatim user language):\n${input.userSummary.quoteBank.map((q) => `- ${q.quote}`).join("\n")}\n\n---\n\n`
							: "";

					const userPrompt = `${userSummaryBlock}PERSONALITY DATA:

FACET GLOSSARY (what each facet measures):
${FACET_GLOSSARY}

TRAIT & FACET PROFILE (with confidence levels):
${traitSummary}

EVIDENCE FROM CONVERSATION (in conversation order — weigh all of it, the most important pattern may connect early and late moments):
Uniqueness values indicate how exceptional a trait is: most people have balanced personalities, so high or low scores mean this person is uncommon in that dimension — not that something is wrong. Treat uniqueness as what makes them distinctive.
${evidenceFormatted}

${depthSignal}

Write this person's personalized portrait in your voice as Nerin.`;

					const result = yield* Effect.tryPromise({
						try: async () => {
							const response = await model.invoke([
								{ role: "system", content: buildPortraitPrompt() },
								...input.messages,
								{ role: "user", content: userPrompt },
							]);
							return extractTextContent(
								response.content as string | Array<{ type: string; text?: string }>,
							);
						},
						catch: (error) =>
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Failed to generate portrait via Claude API",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					// Guard: adaptive thinking can consume entire token budget,
					// producing only thinking blocks with no text output → empty string.
					// Treat as failure so the use-case returns null and portrait re-triggers next visit.
					if (!result.trim()) {
						return yield* Effect.fail(
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Portrait generation returned empty content (likely thinking-only response)",
							}),
						);
					}

					const duration = Date.now() - startTime;

					logger.info("Portrait generation completed", {
						sessionId: input.sessionId,
						durationMs: duration,
						portraitLength: result.length,
					});

					return result;
				}),
		});
	}),
);
