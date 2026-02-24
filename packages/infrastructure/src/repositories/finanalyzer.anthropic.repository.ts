/**
 * FinAnalyzer Anthropic Repository Implementation
 *
 * Calls Claude Sonnet via Anthropic SDK tool use to extract comprehensive
 * Big Five personality evidence from ALL conversation messages at finalization.
 * Uses Effect Schema as single source of truth for tool JSON schema + validation.
 *
 * Story 11.2
 */

import Anthropic from "@anthropic-ai/sdk";
import type { FinanalyzerMessage, FinanalyzerOutput } from "@workspace/domain";
import {
	ALL_FACETS,
	AppConfig,
	CONFIDENCE_MAX,
	CONFIDENCE_MIN,
	FACET_PROMPT_DEFINITIONS,
	FinanalyzerError,
	FinanalyzerRepository,
	LIFE_DOMAINS,
	LoggerRepository,
	SCORE_MAX,
	SCORE_MIN,
} from "@workspace/domain";
import { Effect, JSONSchema, Layer, Redacted } from "effect";
import * as S from "effect/Schema";

// ─── Effect Schema: Single source of truth for tool definition + validation ───

const FinalizationEvidenceItemSchema = S.Struct({
	messageId: S.String,
	bigfiveFacet: S.Literal(...ALL_FACETS),
	score: S.Int.pipe(S.between(SCORE_MIN, SCORE_MAX)),
	confidence: S.Number.pipe(S.between(CONFIDENCE_MIN, CONFIDENCE_MAX)),
	domain: S.Literal(...LIFE_DOMAINS),
	rawDomain: S.String,
	quote: S.String,
});

const FinalizationExtractionSchema = S.Struct({
	evidence: S.Array(FinalizationEvidenceItemSchema),
});

/** JSON Schema for Anthropic tool input_schema */
const finalizationToolJsonSchema = JSONSchema.make(FinalizationExtractionSchema);

/** Validate LLM output against the same schema */
const decodeFinalizationExtraction = S.decodeUnknownSync(FinalizationExtractionSchema);

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildFinanalyzerPrompt(messages: readonly FinanalyzerMessage[]): string {
	const facetDefs = Object.entries(FACET_PROMPT_DEFINITIONS)
		.map(([facet, def]) => `  - ${facet}: ${def}`)
		.join("\n");

	const formattedMessages = messages.map((m) => `[${m.id}] ${m.role}: ${m.content}`).join("\n\n");

	return `You are a personality evidence extractor performing a COMPREHENSIVE final analysis. You are re-analyzing an ENTIRE conversation with full context to extract ALL personality signals — quality is non-negotiable.

## Big Five Facets (30 total)
${facetDefs}

## Life Domains
- work: Professional activities, career, job tasks, colleagues, workplace dynamics
- relationships: Romantic partners, close friendships, social connections
- family: Parents, siblings, children, extended family, household dynamics
- leisure: Hobbies, entertainment, sports, travel, group activities
- solo: Personal habits, self-care, alone time, individual routines, introspection
- other: ONLY when the message truly doesn't fit any above domain. Target <15% of all evidence in "other".

## Domain Classification: User Emphasis Rule
Classify the domain based on what the USER emphasizes in their message, not objective categorization. If someone talks about "my boss at work" but the emphasis is on their emotional reaction (vulnerability, anxiety), the domain is still "work" because that's the context they're describing. If they talk about "hanging out with friends" but the emphasis is on their need for alone time afterward, consider "solo" as the domain.

## Full Conversation
${formattedMessages}

## Instructions
1. Re-analyze ALL messages with the FULL conversation as context — this is a final, comprehensive pass
2. Extract personality-relevant signals from USER messages — behavioral patterns, preferences, values, emotional responses, decision-making styles
3. For each evidence record, provide:
   - messageId: The UUID from the [uuid] prefix of the message containing the evidence
   - bigfiveFacet: One of the 30 facets listed above
   - score: 0-20 where 10=average for the general population
   - confidence: 0.0-1.0 reflecting how clearly the message reveals this trait
   - domain: One of the 6 life domains
   - rawDomain: Free-text domain description (e.g., "software engineering at startup", "parenting toddler")
   - quote: VERBATIM text from the user message — copy exactly, prefer longer unique substrings
4. There is NO cap on evidence count — extract EVERYTHING meaningful. A 25-message conversation typically yields 30-60 evidence records
5. The same quote can appear in multiple records with different facets if it reveals multiple personality dimensions
6. Prefer specific domains over "other" — most messages fit work, relationships, family, leisure, or solo
7. Be thoughtful with confidence: 0.3-0.5 for indirect signals, 0.6-0.8 for clear behavioral evidence, 0.8-1.0 for explicit self-description with behavioral examples
8. CRITICAL: The "quote" field must be an EXACT substring from the user's message — do not paraphrase, summarize, or modify. Prefer longer, unique substrings that are unlikely to appear multiple times in the same message`;
}

// ─── MOCK_LLM fallback for Docker integration tests ──────────────────────────

function mockAnalyze(): FinanalyzerOutput {
	return {
		evidence: [
			{
				messageId: "mock-msg-1",
				bigfiveFacet: "imagination",
				score: 14,
				confidence: 0.6,
				domain: "work",
				rawDomain: "creative work",
				quote: "mock evidence quote",
			},
			{
				messageId: "mock-msg-1",
				bigfiveFacet: "trust",
				score: 12,
				confidence: 0.5,
				domain: "relationships",
				rawDomain: "friendships",
				quote: "mock trust quote",
			},
		],
		tokenUsage: { input: 0, output: 0 },
	};
}

// ─── Repository Layer ─────────────────────────────────────────────────────────

export const FinanalyzerAnthropicRepositoryLive = Layer.effect(
	FinanalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const isMocked = config.nodeEnv === "test" || process.env.MOCK_LLM === "true";

		const client = isMocked
			? null
			: new Anthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

		logger.info("FinAnalyzer configured", {
			model: config.finanalyzerModelId,
			mocked: isMocked,
		});

		return FinanalyzerRepository.of({
			analyze: (params: { readonly messages: readonly FinanalyzerMessage[] }) =>
				Effect.tryPromise({
					try: async () => {
						// MOCK_LLM path for integration tests
						if (isMocked || !client) {
							return mockAnalyze();
						}

						const prompt = buildFinanalyzerPrompt(params.messages);

						const response = await client.messages.create({
							model: config.finanalyzerModelId,
							max_tokens: 16384,
							messages: [{ role: "user", content: prompt }],
							tools: [
								{
									name: "extract_finalization_evidence",
									description:
										"Extract comprehensive Big Five personality evidence from the full conversation",
									// JSONSchema.make returns a generic JSON Schema object; Anthropic SDK expects its own shape
									input_schema: finalizationToolJsonSchema as Anthropic.Tool["input_schema"],
								},
							],
							tool_choice: { type: "tool", name: "extract_finalization_evidence" },
						});

						// Extract tool_use block
						const toolUseBlock = response.content.find((b) => b.type === "tool_use");
						if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
							throw new Error("No tool_use block in Sonnet response");
						}

						// Validate against Effect Schema
						const parsed = decodeFinalizationExtraction(toolUseBlock.input);

						const tokenUsage = {
							input: response.usage.input_tokens,
							output: response.usage.output_tokens,
						};

						logger.info("FinAnalyzer extraction complete", {
							evidenceCount: parsed.evidence.length,
							tokenUsage,
						});

						return {
							evidence: parsed.evidence.map((e) => ({
								messageId: e.messageId,
								bigfiveFacet: e.bigfiveFacet,
								score: e.score,
								confidence: e.confidence,
								domain: e.domain,
								rawDomain: e.rawDomain,
								quote: e.quote,
							})),
							tokenUsage,
						};
					},
					catch: (error) =>
						new FinanalyzerError({
							message: error instanceof Error ? error.message : String(error),
						}),
				}),
		});
	}),
);
