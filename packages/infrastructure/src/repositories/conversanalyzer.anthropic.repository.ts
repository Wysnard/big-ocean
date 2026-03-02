/**
 * Conversanalyzer Anthropic Repository Implementation
 *
 * Calls Claude Haiku via Anthropic SDK tool use to extract Big Five facet evidence
 * from user messages. Uses Effect Schema as single source of truth for:
 * 1. Anthropic tool JSON schema (via JSONSchema.make)
 * 2. LLM output validation (via S.decodeUnknownSync)
 *
 * Story 10.2
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	ALL_FACETS,
	AppConfig,
	ConversanalyzerError,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	FACET_PROMPT_DEFINITIONS,
	LIFE_DOMAINS,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, JSONSchema, Layer, Redacted } from "effect";
import * as S from "effect/Schema";

// ─── Effect Schema: Single source of truth for tool definition + validation ───

const EvidenceItemSchema = S.Struct({
	bigfiveFacet: S.Literal(...ALL_FACETS),
	deviation: S.Int.pipe(S.between(-3, 3)),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(200)),
});

const EvidenceExtractionSchema = S.Struct({
	evidence: S.Array(EvidenceItemSchema),
});

/** JSON Schema for Anthropic tool input_schema */
const evidenceToolJsonSchema = JSONSchema.make(EvidenceExtractionSchema);

/** Validate LLM output against the same schema */
const decodeEvidenceExtraction = S.decodeUnknownSync(EvidenceExtractionSchema);

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(input: ConversanalyzerInput): string {
	const facetDefs = Object.entries(FACET_PROMPT_DEFINITIONS)
		.map(([facet, def]) => `  - ${facet}: ${def}`)
		.join("\n");

	const domainDist = Object.entries(input.domainDistribution)
		.map(([d, n]) => `${d}=${n}`)
		.join(", ");

	const recentText = input.recentMessages.map((m) => `[${m.role}]: ${m.content}`).join("\n");

	return `You are a personality evidence extractor. Analyze the latest user message in a conversation for Big Five personality signals.

## Big Five Facets (30 total)
${facetDefs}

## Life Domains
- work: Professional activities, career, job tasks, colleagues, workplace dynamics
- relationships: Romantic partners, close friendships, social connections
- family: Parents, siblings, children, extended family, household dynamics
- leisure: Hobbies, entertainment, sports, travel, group activities
- solo: Personal habits, self-care, alone time, individual routines, introspection
- other: ONLY when the message truly doesn't fit any above domain. Target <15% of all evidence in "other".

## Current Evidence Distribution
${domainDist}
(Use this to be aware of domain drift. If one domain dominates, still tag accurately — but consider whether the message reveals personality in an under-represented domain.)

## Conversation Context (last messages)
${recentText}

## Instructions
1. Focus ONLY on the latest user message for evidence extraction
2. Extract personality-relevant signals — behavioral patterns, preferences, values, emotional responses
3. Return an empty evidence array [] if the message has no personality signal (e.g., "hello", "thanks", "ok")
4. Each evidence record needs:
   - bigfiveFacet: one of the 30 facets listed above
   - deviation: integer from -3 to +3, where 0 = population average, +3 = far above average, -3 = far below average
   - strength: "weak" | "moderate" | "strong" — how diagnostic is this signal? (weak = passing mention, moderate = clear behavioral pattern, strong = deeply revealing)
   - confidence: "low" | "medium" | "high" — how certain are you about this signal? (low = ambiguous, medium = likely, high = unambiguous)
   - domain: one of the 6 life domains listed above
   - note: brief behavioral paraphrase (max 200 chars, no direct quotes from the user)
5. You may extract up to 5 evidence records per message
6. If the same observation reveals personality in different domain contexts, create separate records with different domains
7. Prefer specific domains over "other" — most messages fit work, relationships, family, leisure, or solo`;
}

// ─── MOCK_LLM fallback for Docker integration tests ──────────────────────────

function mockAnalyze(): {
	evidence: Array<{
		bigfiveFacet: string;
		deviation: number;
		strength: string;
		confidence: string;
		domain: string;
		note: string;
	}>;
	tokenUsage: { input: number; output: number };
} {
	return {
		evidence: [
			{
				bigfiveFacet: "imagination",
				deviation: 1,
				strength: "moderate",
				confidence: "medium",
				domain: "work",
				note: "Shows creative thinking in professional context",
			},
			{
				bigfiveFacet: "trust",
				deviation: 1,
				strength: "weak",
				confidence: "medium",
				domain: "relationships",
				note: "Indicates baseline trust in social interactions",
			},
		],
		tokenUsage: { input: 0, output: 0 },
	};
}

// ─── Repository Layer ─────────────────────────────────────────────────────────

export const ConversanalyzerAnthropicRepositoryLive = Layer.effect(
	ConversanalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const isMocked = config.nodeEnv === "test" || process.env.MOCK_LLM === "true";

		const client = isMocked
			? null
			: new Anthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

		logger.info("Conversanalyzer configured", {
			model: config.conversanalyzerModelId,
			mocked: isMocked,
		});

		return ConversanalyzerRepository.of({
			analyze: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						// MOCK_LLM path for integration tests
						if (isMocked || !client) {
							const mock = mockAnalyze();
							return {
								evidence: mock.evidence.map((e) => ({
									bigfiveFacet: e.bigfiveFacet as (typeof ALL_FACETS)[number],
									deviation: e.deviation,
									strength: e.strength as "weak" | "moderate" | "strong",
									confidence: e.confidence as "low" | "medium" | "high",
									domain: e.domain as (typeof LIFE_DOMAINS)[number],
									note: e.note,
								})),
								tokenUsage: mock.tokenUsage,
							};
						}

						const prompt = buildPrompt(input);

						const response = await client.messages.create({
							model: config.conversanalyzerModelId,
							max_tokens: 1024,
							messages: [{ role: "user", content: prompt }],
							tools: [
								{
									name: "extract_evidence",
									description: "Extract Big Five personality evidence from the user message",
									input_schema: evidenceToolJsonSchema as Anthropic.Tool["input_schema"],
								},
							],
							tool_choice: { type: "tool", name: "extract_evidence" },
						});

						// Extract tool_use block
						const toolUseBlock = response.content.find((b) => b.type === "tool_use");
						if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
							throw new Error("No tool_use block in Haiku response");
						}

						// Validate against Effect Schema
						const parsed = decodeEvidenceExtraction(toolUseBlock.input);

						const tokenUsage = {
							input: response.usage.input_tokens,
							output: response.usage.output_tokens,
						};

						logger.info("Conversanalyzer extraction complete", {
							evidenceCount: parsed.evidence.length,
							tokenUsage,
						});

						return {
							evidence: parsed.evidence.map((e) => ({
								bigfiveFacet: e.bigfiveFacet,
								deviation: e.deviation,
								strength: e.strength,
								confidence: e.confidence,
								domain: e.domain,
								note: e.note,
							})),
							tokenUsage,
						};
					},
					catch: (error) =>
						new ConversanalyzerError({
							message: error instanceof Error ? error.message : "Conversanalyzer failed",
						}),
				}),
		});
	}),
);
