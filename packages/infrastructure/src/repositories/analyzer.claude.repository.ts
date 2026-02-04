/**
 * Analyzer Repository Implementation
 *
 * Claude-based implementation for extracting personality facet evidence from messages.
 * Uses single JSON call with Claude Sonnet 4.5 (Path 2 from Tree of Thoughts).
 *
 * Architecture:
 * - Production: Uses @langchain/anthropic ChatAnthropic
 * - Testing: Mock implementation via createTestAnalyzerLayer()
 *
 * Algorithm: Single LLM call with structured JSON output
 * - Cost: ~$0.003 per message
 * - Latency: 1-2 seconds
 * - Accuracy: 4/5 stars (good balance for MVP)
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies: LoggerRepository
 */

import { ChatAnthropic } from "@langchain/anthropic";
import {
	AnalyzerError,
	AnalyzerRepository,
	AnalyzerResponseJsonSchema,
	type FacetEvidence,
	LoggerRepository,
	MalformedEvidenceError,
	validateAnalyzerResponse,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * System prompt for facet analysis
 *
 * Instructs Claude to return structured JSON with evidence for all 30 Big Five facets.
 * Uses clean facet names (no trait prefixes) for consistency.
 */
const ANALYZER_SYSTEM_PROMPT = `You are a personality assessment analyzer using the Big Five framework.

For each user message, identify signals for all 30 facets across 5 traits:

**Openness (6 facets):**
- imagination: Fantasy, daydreaming, creative thinking
- artistic_interests: Appreciation for art, beauty, poetry
- emotionality: Experiencing emotions deeply
- adventurousness: Willingness to try new activities
- intellect: Intellectual curiosity, love of learning
- liberalism: Challenge authority, embrace unconventional values

**Conscientiousness (6 facets):**
- self_efficacy: Confidence in one's ability to accomplish things
- orderliness: Personal organization, tidiness
- dutifulness: Governed by conscience, adherence to principles
- achievement_striving: Need for achievement
- self_discipline: Ability to motivate oneself
- cautiousness: Tendency to think through before acting

**Extraversion (6 facets):**
- friendliness: Genuine liking for others
- gregariousness: Preference for company of others
- assertiveness: Tendency to speak up, take charge
- activity_level: Pace of living, energy level
- excitement_seeking: Need for stimulation
- cheerfulness: Positive emotions, optimism

**Agreeableness (6 facets):**
- trust: Assume best intentions of others
- morality: Straightforwardness, sincerity
- altruism: Active concern for others' welfare
- cooperation: Dislike confrontations, prefer compromise
- modesty: Humble, self-effacing
- sympathy: Compassion, tender-mindedness

**Neuroticism (6 facets):**
- anxiety: Worry, fear, nervousness
- anger: Tendency to feel angry, frustrated
- depression: Tendency toward guilt, sadness, hopelessness
- self_consciousness: Sensitive to what others think
- immoderation: Inability to resist cravings, urges
- vulnerability: Difficulty coping with stress

**CRITICAL RULES:**
1. Use clean facet names (e.g., "imagination" NOT "openness_imagination")
2. Only include facets with clear evidence (typically 3-10 per message)
3. Return valid JSON array only, no markdown formatting or code blocks
4. Score 0-20: Higher = stronger signal for that facet
5. Confidence 0-100: Higher = more certain interpretation
6. Quote exact substring from user message (preserve formatting)
7. highlightRange uses 0-based character indices

**Output Format (JSON array):**
Each item in the array must have:
- facet: One of the 30 facet names listed above
- evidence: Quote from the user's message showing the signal
- confidence: Number between 0.0 and 1.0
- highlightRange: Object with start and end character indices`;

/**
 * Effect Schema for FacetEvidence validation and transformation
 *
 * Validates JSON response from Claude and transforms to FacetEvidence.
 * Follows Effect Schema naming convention: AFromB (output from input).
 */

/**
 * Analyzer Repository Layer (Production)
 *
 * Uses Claude Sonnet 4.5 via ChatAnthropic for facet analysis with structured output.
 * Requires ANTHROPIC_API_KEY environment variable.
 *
 * Layer type: Layer<AnalyzerRepository, never, LoggerRepository>
 */
export const AnalyzerClaudeRepositoryLive = Layer.effect(
	AnalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		// Create ChatAnthropic model with structured output
		const baseModel = new ChatAnthropic({
			model: process.env.ANALYZER_MODEL_ID || "claude-sonnet-4-20250514",
			maxTokens: Number(process.env.ANALYZER_MAX_TOKENS) || 2048,
			temperature: Number(process.env.ANALYZER_TEMPERATURE) || 0.3, // Lower temperature for structured output
		});

		// Use structured output with JSON Schema from Effect Schema
		const model = baseModel.withStructuredOutput(AnalyzerResponseJsonSchema);

		logger.info("Analyzer Claude repository initialized", {
			model: process.env.ANALYZER_MODEL_ID || "claude-sonnet-4-20250514",
		});

		// Return service implementation
		return AnalyzerRepository.of({
			analyzeFacets: (assessmentMessageId: string, content: string) =>
				Effect.gen(function* () {
					const startTime = Date.now();

					// Call Claude with system prompt and user message
					const rawResponse = yield* Effect.tryPromise({
						try: async () => {
							return await model.invoke([
								{
									role: "system" as const,
									content: ANALYZER_SYSTEM_PROMPT,
								},
								{
									role: "user" as const,
									content: `Analyze this message for personality facet signals:\n\n${content}`,
								},
							]);
						},
						catch: (error) =>
							new AnalyzerError({
								assessmentMessageId,
								message: "Failed to invoke Claude for facet analysis",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					// Validate structured response
					const validationResult = validateAnalyzerResponse(rawResponse);

					if (validationResult._tag === "Left") {
						logger.warn("Analyzer response validation failed", {
							assessmentMessageId,
							error: String(validationResult.left),
						});
						return yield* Effect.fail(
							new MalformedEvidenceError({
								assessmentMessageId,
								rawOutput: JSON.stringify(rawResponse).substring(0, 500),
								parseError: String(validationResult.left),
								message: "Schema validation failed - invalid analyzer response",
							}),
						);
					}

					// Use validated response
					const structuredResponse = validationResult.right;

					// Transform validated response to FacetEvidence format
					const evidence: FacetEvidence[] = structuredResponse.map((item) => ({
						assessmentMessageId,
						facetName: item.facet as FacetEvidence["facetName"],
						score: item.score, // Use score from analyzer (0-20)
						confidence: item.confidence, // Already 0-100 from schema
						quote: item.evidence,
						highlightRange: {
							start: item.highlightRange.start,
							end: item.highlightRange.end,
						},
					}));

					const duration = Date.now() - startTime;

					logger.info("Facet analysis completed", {
						assessmentMessageId,
						evidenceCount: evidence.length,
						durationMs: duration,
						facets: evidence.map((e) => e.facetName),
					});

					return evidence;
				}),
		});
	}),
);
