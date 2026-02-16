/**
 * Portrait Generator Repository Implementation
 *
 * Claude-based implementation for generating personalized personality portraits.
 * Uses ChatAnthropic (Sonnet) for warm, insightful personality narratives.
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
	deriveTraitScores,
	FACET_TO_TRAIT,
	type FacetName,
	LoggerRepository,
	PortraitGenerationError,
	type PortraitGenerationInput,
	PortraitGeneratorRepository,
	TRAIT_LETTER_MAP,
	TRAIT_LEVEL_LABELS,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";

/**
 * Build a human-readable trait summary from facet scores.
 */
function formatTraitSummary(input: PortraitGenerationInput): string {
	const traitScores = deriveTraitScores(input.facetScoresMap);
	const lines: string[] = [];

	for (const [traitName, traitScore] of Object.entries(traitScores)) {
		const letters = TRAIT_LETTER_MAP[traitName as keyof typeof TRAIT_LETTER_MAP];
		let levelIndex: 0 | 1 | 2;
		if (traitScore.score <= 40) levelIndex = 0;
		else if (traitScore.score <= 80) levelIndex = 1;
		else levelIndex = 2;
		const letter = letters[levelIndex];
		const traitLabel = TRAIT_LEVEL_LABELS[letter] ?? letter;
		lines.push(`${traitName}: ${traitScore.score}/120 (${traitLabel})`);
	}

	return lines.join("\n");
}

/**
 * Format top evidence for the prompt.
 * Only includes quote and facetName — no highlight indices.
 */
function formatEvidence(input: PortraitGenerationInput): string {
	return input.topEvidence
		.map((e) => {
			const trait = FACET_TO_TRAIT[e.facetName as FacetName] ?? "Unknown";
			return `- [${trait} → ${e.facetName}] "${e.quote}"`;
		})
		.join("\n");
}

/**
 * System prompt for portrait generation.
 */
const PORTRAIT_SYSTEM_PROMPT = `You are writing a personalized personality portrait for someone who just completed a Big Five personality assessment through conversation. Write 6-10 sentences that feel warm, insightful, and personally relevant.

RULES:
- Use second person ("you")
- Reference specific patterns from their conversation using the evidence quotes
- Be warm and affirming, not clinical
- Each sentence should reveal something specific about them
- Do NOT use generic personality psychology language
- Do NOT repeat the archetype description verbatim
- Do NOT use bullet points or lists — write flowing prose
- Do NOT start with "Based on your assessment" or similar meta-references`;

/**
 * Portrait Generator Repository Layer (Production)
 *
 * Uses Claude Sonnet via ChatAnthropic for portrait generation.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export const PortraitGeneratorClaudeRepositoryLive = Layer.effect(
	PortraitGeneratorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const model = new ChatAnthropic({
			model: config.analyzerModelId,
			maxTokens: 1024,
			temperature: 0.7,
			apiKey: Redacted.value(config.anthropicApiKey),
		});

		logger.info("Portrait generator Claude repository initialized", {
			model: config.analyzerModelId,
		});

		return PortraitGeneratorRepository.of({
			generatePortrait: (input: PortraitGenerationInput) =>
				Effect.gen(function* () {
					const startTime = Date.now();

					const traitSummary = formatTraitSummary(input);
					const evidenceFormatted = formatEvidence(input);

					const userPrompt = `PERSONALITY DATA:
Archetype: ${input.archetypeName}
OCEAN Code: ${input.oceanCode5}
Archetype Description: ${input.archetypeDescription}

Trait Scores:
${traitSummary}

KEY EVIDENCE FROM CONVERSATION:
${evidenceFormatted}

Write a personalized portrait (6-10 sentences, flowing prose):`;

					const result = yield* Effect.tryPromise({
						try: async () => {
							const response = await model.invoke([
								{ role: "system", content: PORTRAIT_SYSTEM_PROMPT },
								{ role: "user", content: userPrompt },
							]);
							return response.content as string;
						},
						catch: (error) =>
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Failed to generate portrait via Claude API",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

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
