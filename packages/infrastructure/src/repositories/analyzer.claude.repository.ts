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
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
	ALL_FACETS,
	type AnalysisTarget,
	AnalyzerError,
	AnalyzerRepository,
	AnalyzerResponseJsonSchema,
	AppConfig,
	BatchAnalyzerResponseJsonSchema,
	type ConversationMessage,
	FACET_PROMPT_DEFINITIONS,
	type FacetEvidence,
	LoggerRepository,
	TRAIT_TO_FACETS,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * LangChain-specific message types used only within this file.
 * Moved from domain to keep @langchain/core out of the domain package.
 */

/** HumanMessage subclass that preserves message ID for batch analysis */
class IdentifiedHumanMessage extends HumanMessage {
	declare id?: string;
}

/** Union type for messages sent to the analyzer LLM */
type AnalyzerMessage = SystemMessage | AIMessage | IdentifiedHumanMessage;

/** Trait display names for prompt formatting */
const TRAIT_DISPLAY_NAMES: Record<string, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

/**
 * Build the facet definitions block for the analyzer prompt from
 * the shared FACET_PROMPT_DEFINITIONS constant.
 */
function buildFacetDefinitionsBlock(): string {
	const sections: string[] = [];

	for (const [traitName, facets] of Object.entries(TRAIT_TO_FACETS)) {
		const displayName = TRAIT_DISPLAY_NAMES[traitName] ?? traitName;
		const facetLines = facets.map((f) => `- ${f}: ${FACET_PROMPT_DEFINITIONS[f]}`).join("\n");
		sections.push(`**${displayName} (6 facets):**\n${facetLines}`);
	}

	return sections.join("\n\n");
}

/**
 * System prompt for facet analysis
 *
 * Instructs Claude to return structured JSON with evidence for all 30 Big Five facets.
 * Uses clean facet names (no trait prefixes) for consistency.
 * Facet definitions are sourced from the shared FACET_PROMPT_DEFINITIONS constant.
 */
const ANALYZER_SYSTEM_PROMPT = `You are a personality assessment analyzer using the Big Five framework.

For each user message, identify signals for all 30 facets across 5 traits:

${buildFacetDefinitionsBlock()}

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
 * Additional instructions appended to the system prompt for batch analysis mode.
 * Instructs the LLM to tag extractions with the source message ID.
 */
const BATCH_ANALYZER_INSTRUCTIONS = `

**BATCH ANALYSIS MODE:**
You are analyzing multiple user messages in a single call.
User messages in the conversation history are annotated with their ID in the format [id: <message_id>].
- Tag every extraction with the \`message_id\` of the source user message
- Analyze each target message INDEPENDENTLY — do not combine signals across messages
- \`highlightRange\` uses 0-based character indices relative to that message's original text (not including the [id: ...] prefix)
- Return approximately the same number of extractions per message as you would individually
- Only analyze user messages whose IDs are listed in the final instruction`;

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
			temperature: config.analyzerTemperature,
		});

		// Use structured output with includeRaw to preserve AIMessage token metadata
		const model = baseModel.withStructuredOutput(AnalyzerResponseJsonSchema, { includeRaw: true });
		const batchModel = baseModel.withStructuredOutput(BatchAnalyzerResponseJsonSchema, {
			includeRaw: true,
		});

		logger.info("Analyzer Claude repository initialized", {
			model: config.analyzerModelId,
		});

		// Return service implementation
		return AnalyzerRepository.of({
			analyzeFacets: (
				assessmentMessageId: string,
				content: string,
				conversationHistory?: ReadonlyArray<ConversationMessage>,
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
					const usageMeta = (invokeResult.raw as AIMessage)?.usage_metadata;
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
						logger.debug("No personality signals found in message", {
							assessmentMessageId,
						});
						return [];
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

			analyzeFacetsBatch: (
				targets: ReadonlyArray<AnalysisTarget>,
				conversationHistory?: ReadonlyArray<ConversationMessage>,
			) =>
				Effect.gen(function* () {
					const startTime = Date.now();
					const targetIds = targets.map((t) => t.assessmentMessageId);

					// Build LangChain message array with IDs on user messages
					const langchainMessages: AnalyzerMessage[] = [
						new SystemMessage(ANALYZER_SYSTEM_PROMPT + BATCH_ANALYZER_INSTRUCTIONS),
					];

					if (conversationHistory?.length) {
						for (const msg of conversationHistory) {
							if (msg.role === "user") {
								langchainMessages.push(
									new IdentifiedHumanMessage({ content: `[id: ${msg.id}] ${msg.content}`, id: msg.id }),
								);
							} else {
								langchainMessages.push(new AIMessage(msg.content));
							}
						}
					}

					// Final instruction: trigger the batch analysis
					langchainMessages.push(
						new IdentifiedHumanMessage({
							content: `Analyze the user messages marked with the following IDs for personality facet signals:\n${targetIds.map((id) => `- ${id}`).join("\n")}`,
							id: "batch-instruction",
						}),
					);

					// Single LLM call for all targets
					const invokeResult = yield* Effect.tryPromise({
						try: () => batchModel.invoke(langchainMessages),
						catch: (error) =>
							new AnalyzerError({
								assessmentMessageId: targetIds.join(","),
								message: "Failed to invoke Claude for batch facet analysis",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					// Extract token usage
					const usageMeta = (invokeResult.raw as AIMessage)?.usage_metadata;
					const batchTokens = {
						input: usageMeta?.input_tokens ?? 0,
						output: usageMeta?.output_tokens ?? 0,
						total: (usageMeta?.input_tokens ?? 0) + (usageMeta?.output_tokens ?? 0),
					};

					const rawResponse = invokeResult.parsed;
					const unwrapped = (rawResponse as { extractions?: unknown }).extractions ?? rawResponse;
					const items = Array.isArray(unwrapped) ? unwrapped : [];

					if (items.length === 0) {
						logger.debug("No personality signals found in batch", {
							targetCount: targets.length,
							targetIds,
						});
						const emptyMap = new Map<string, FacetEvidence[]>();
						for (const id of targetIds) {
							emptyMap.set(id, []);
						}
						return emptyMap;
					}

					// Group extractions by message_id
					const validFacetSet = new Set<string>(ALL_FACETS);
					const targetIdSet = new Set(targetIds);
					const evidenceMap = new Map<string, FacetEvidence[]>();
					for (const id of targetIds) {
						evidenceMap.set(id, []);
					}

					let skippedCount = 0;
					for (const item of items) {
						if (!item || typeof item.facet !== "string" || !validFacetSet.has(item.facet)) {
							skippedCount++;
							continue;
						}
						const messageId = item.message_id as string;
						if (!messageId || !targetIdSet.has(messageId)) {
							skippedCount++;
							logger.warn("Skipping extraction with unknown message_id", {
								messageId,
								facet: item.facet,
							});
							continue;
						}

						const bucket = evidenceMap.get(messageId);
						if (!bucket) continue;
						bucket.push({
							assessmentMessageId: messageId,
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
						logger.warn("Some batch extractions were invalid", {
							skippedCount,
							validCount: items.length - skippedCount,
							totalCount: items.length,
						});
					}

					const totalEvidence = [...evidenceMap.values()].reduce((sum, arr) => sum + arr.length, 0);
					const duration = Date.now() - startTime;

					logger.info("Batch facet analysis completed", {
						targetCount: targets.length,
						totalEvidence,
						durationMs: duration,
						tokenUsage: batchTokens,
					});

					return evidenceMap;
				}),
		});
	}),
);
