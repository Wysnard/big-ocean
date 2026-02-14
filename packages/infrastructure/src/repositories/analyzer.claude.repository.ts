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
	ALL_FACETS,
	AnalyzerError,
	AnalyzerRepository,
	AnalyzerResponseJsonSchema,
	AppConfig,
	type FacetEvidence,
	LoggerRepository,
	MalformedEvidenceError,
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
3. Return a JSON object with an "extractions" key containing an array of facet evidence
4. Score 0-20: Higher = stronger signal for that facet
5. Confidence 0-100: Higher = more certain interpretation
6. Quote exact substring from user message (preserve formatting)
7. highlightRange uses 0-based character indices

**Output Format (JSON object with "extractions" array):**
Return: { "extractions": [ ... ] }
Each item in the extractions array must have:
- facet: One of the 30 facet names listed above
- evidence: Quote from the user's message showing the signal
- score: Number between 0 and 20 (strength of signal for that facet)
- confidence: Number between 0 and 100 (certainty of interpretation)
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
 * Layer type: Layer<AnalyzerRepository, never, LoggerRepository | AppConfig>
 */
export const AnalyzerClaudeRepositoryLive = Layer.effect(
	AnalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		// Create ChatAnthropic model with structured output
		const baseModel = new ChatAnthropic({
			model: config.analyzerModelId,
			maxTokens: config.analyzerMaxTokens,
			temperature: config.analyzerTemperature, // Lower temperature for structured output
		});

		// Use structured output with includeRaw to preserve AIMessage token metadata
		const model = baseModel.withStructuredOutput(AnalyzerResponseJsonSchema, { includeRaw: true });

		logger.info("Analyzer Claude repository initialized", {
			model: config.analyzerModelId,
		});

		// Return service implementation
		return AnalyzerRepository.of({
			analyzeFacets: (
				assessmentMessageId: string,
				content: string,
				conversationHistory?: ReadonlyArray<{ role: "user" | "assistant"; content: string }>,
			) =>
				Effect.gen(function* () {
					const startTime = Date.now();

					// Build messages array: system prompt + optional history + target message
					const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
						{
							role: "system" as const,
							content: ANALYZER_SYSTEM_PROMPT,
						},
					];

					// Include conversation history for richer context if provided
					if (conversationHistory && conversationHistory.length > 0) {
						for (const msg of conversationHistory) {
							messages.push({
								role: msg.role,
								content: msg.content,
							});
						}
					}

					// Add the target message to analyze
					messages.push({
						role: "user" as const,
						content: `Analyze this message for personality facet signals:\n\n${content}`,
					});

					// Call Claude with system prompt, history, and user message
					const invokeResult = yield* Effect.tryPromise({
						try: async () => {
							return await model.invoke(messages);
						},
						catch: (error) =>
							new AnalyzerError({
								assessmentMessageId,
								message: "Failed to invoke Claude for facet analysis",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					// Extract token usage from raw AIMessage metadata
					const usageMeta = invokeResult.raw?.usage_metadata;
					const analyzerTokens = {
						input: usageMeta?.input_tokens ?? 0,
						output: usageMeta?.output_tokens ?? 0,
						total: (usageMeta?.input_tokens ?? 0) + (usageMeta?.output_tokens ?? 0),
					};

					// Use the parsed structured output
					const rawResponse = invokeResult.parsed;

					// Unwrap .extractions from wrapped response (Anthropic tool use requires object root)
					const unwrapped = (rawResponse as { extractions?: unknown }).extractions ?? rawResponse;

					// Validate per-item: filter out invalid entries instead of rejecting the whole response
					const validFacetSet = new Set<string>(ALL_FACETS);
					const items = Array.isArray(unwrapped) ? unwrapped : [];

					if (items.length === 0) {
						return yield* Effect.fail(
							new MalformedEvidenceError({
								assessmentMessageId,
								rawOutput: JSON.stringify(rawResponse).substring(0, 500),
								parseError: "Empty or non-array response from analyzer",
								message: "Schema validation failed - no extractions returned",
							}),
						);
					}

					const evidence: FacetEvidence[] = [];
					let skippedCount = 0;

					for (const item of items) {
						// Skip entries with invalid facet names (e.g. trait names like "openness")
						if (!item || typeof item.facet !== "string" || !validFacetSet.has(item.facet)) {
							skippedCount++;
							logger.warn("Skipping invalid facet extraction", {
								assessmentMessageId,
								facet: item?.facet,
								reason: "unrecognized facet name",
							});
							continue;
						}

						evidence.push({
							assessmentMessageId,
							facetName: item.facet as FacetEvidence["facetName"],
							score: Math.max(0, Math.min(20, Number(item.score) || 0)),
							confidence: Math.max(0, Math.min(100, Number(item.confidence) || 0)),
							quote: String(item.evidence || ""),
							highlightRange: {
								start: Math.max(0, Number(item.highlightRange?.start) || 0),
								end: Math.max(1, Number(item.highlightRange?.end) || 1),
							},
						});
					}

					if (skippedCount > 0) {
						logger.warn("Some facet extractions were invalid", {
							assessmentMessageId,
							skippedCount,
							validCount: evidence.length,
							totalCount: items.length,
						});
					}

					const duration = Date.now() - startTime;

					logger.info("Facet analysis completed", {
						assessmentMessageId,
						evidenceCount: evidence.length,
						durationMs: duration,
						facets: evidence.map((e) => e.facetName),
						tokenUsage: analyzerTokens,
					});

					return evidence;
				}),
		});
	}),
);
