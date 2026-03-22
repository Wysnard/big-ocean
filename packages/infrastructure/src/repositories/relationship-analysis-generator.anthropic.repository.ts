/**
 * Relationship Analysis Generator Repository Implementation (Story 14.4, updated Story 35-2)
 *
 * Claude Sonnet-based implementation for generating relationship personality
 * comparison analyses in spine-format JSON.
 *
 * Story 35-2: LLM output is parsed as JSON spine format and validated before returning.
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

/**
 * Validate and clean spine-format JSON from LLM output.
 * Strips markdown code fences if present, parses JSON, validates structure.
 */
function parseSpineContent(raw: string): string {
	// Strip markdown code fences if the LLM wrapped the output
	let cleaned = raw.trim();
	if (cleaned.startsWith("```")) {
		cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
	}

	// Parse JSON
	const parsed: unknown = JSON.parse(cleaned);

	// Validate structure: must be array of spine sections
	if (!Array.isArray(parsed)) {
		throw new Error("Spine content must be a JSON array");
	}

	for (let i = 0; i < parsed.length; i++) {
		const section = parsed[i];
		if (typeof section !== "object" || section === null) {
			throw new Error(`Spine section ${i} must be an object`);
		}
		const s = section as Record<string, unknown>;
		if (typeof s.emoji !== "string") {
			throw new Error(`Spine section ${i} missing 'emoji' string`);
		}
		if (typeof s.title !== "string") {
			throw new Error(`Spine section ${i} missing 'title' string`);
		}
		if (!Array.isArray(s.paragraphs)) {
			throw new Error(`Spine section ${i} missing 'paragraphs' array`);
		}
		for (let j = 0; j < s.paragraphs.length; j++) {
			if (typeof s.paragraphs[j] !== "string") {
				throw new Error(`Spine section ${i}, paragraph ${j} must be a string`);
			}
		}
	}

	// Return the validated JSON string (re-stringified for consistency)
	return JSON.stringify(parsed);
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

					const rawContent = yield* Effect.tryPromise({
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

					if (!rawContent.trim()) {
						return yield* Effect.fail(
							new RelationshipAnalysisGenerationError({
								message: "Relationship analysis generation returned empty content",
							}),
						);
					}

					// Parse and validate spine-format JSON
					const content = yield* Effect.try({
						try: () => parseSpineContent(rawContent),
						catch: (error) =>
							new RelationshipAnalysisGenerationError({
								message: "Relationship analysis output is not valid spine-format JSON",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					const duration = Date.now() - startTime;
					logger.info("Relationship analysis generation completed", {
						durationMs: duration,
						contentLength: content.length,
					});

					return {
						content,
						modelUsed: config.portraitModelId,
					};
				}),
		});
	}),
);
