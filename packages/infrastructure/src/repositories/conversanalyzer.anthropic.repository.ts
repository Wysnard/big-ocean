/**
 * Conversanalyzer Anthropic Repository Implementation
 *
 * Two separate Haiku calls — user state + evidence independently.
 * Each call has its own prompt, structured output schema, and three-tier fallback.
 *
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls)
 */

import { ChatAnthropic } from "@langchain/anthropic";
import type { AIMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import {
	AppConfig,
	ConversanalyzerError,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	decodeEvidenceLenient,
	decodeEvidenceStrict,
	decodeUserStateLenient,
	decodeUserStateStrict,
	EvidenceItemSchema,
	evidenceOnlyJsonSchema,
	FACET_PROMPT_DEFINITIONS,
	LIFE_DOMAIN_DEFINITIONS,
	LoggerRepository,
	userStateOnlyJsonSchema,
} from "@workspace/domain";
import { Effect, Either, Layer } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/** @internal Exported for testing — not part of public API */
// ─── Prompts ─────────────────────────────────────────────────────────────────

/** @internal Exported for testing — user state extraction prompt */
export function buildUserStatePrompt(input: ConversanalyzerInput): string {
	const recentText = input.recentMessages.map((m) => `[${m.role}]: ${m.content}`).join("\n");

	return `You are a conversational state extractor. Classify the user's conversational state along two independent axes based on the LATEST USER MESSAGE below.

### Conversation Context (for reference only)
${recentText}

### Latest User Message (analyze THIS)
[user]: ${input.message}

### Energy Band — How much emotional/cognitive resource is the user investing?

Rate the user's energy using FOUR observable dimensions:
1. **Emotional activation** — vulnerability, personal stakes, affect in language
2. **Cognitive investment** — depth of reflection, nuance, self-analysis
3. **Expressive investment** — care in word choice, metaphor, rhetorical structure
4. **Activation/urgency** — forward lean, eagerness, momentum

Energy bands (classify ONE):
- **minimal** (0.1): Disengaged or perfunctory. Single-word answers, no personal content.
  Example: "Yeah" / "I guess so" / "Not really"
- **low** (0.3): Present but reserved. Surface-level sharing, low emotional weight.
  Example: "I like cooking on weekends, mostly simple stuff"
- **steady** (0.5): Engaged and reflective. Sharing opinions, moderate self-reflection.
  Example: "I've been thinking about changing careers — it's exciting but scary"
- **high** (0.7): Deeply invested. Rich self-disclosure, vulnerability, or passion.
  Example: "When my mentor believed in me before I believed in myself, it changed everything about how I approach failure"
- **very_high** (0.9): Peak engagement. Profound vulnerability, formative experiences, or breakthrough insight.
  Example: "I realized I'd been running from intimacy my whole life because I watched my parents destroy each other"

### SIX LOAD-BEARING GUARDRAILS (apply to every classification)

1. **Eloquence is not energy.** A beautifully written message about breakfast is still low energy. Rate the EMOTIONAL/COGNITIVE investment, not writing quality.

2. **Sophistication is not cognitive investment.** An intellectually complex explanation of a hobby can be low-energy if it's well-rehearsed and emotionally distant. Look for active reflection, not passive expertise.

3. **Peak dimension, not average.** If ANY one dimension (emotional, cognitive, expressive, urgency) is strongly present, that is sufficient for high energy. Don't average the four dimensions — one high signal dominates.

4. **Understated styles are not low energy.** A quiet person sharing something deeply personal in few words can be very_high energy. Brevity does not equal disengagement. Look at WHAT they reveal, not HOW MANY words they use.

5. **Long detailed answer is not high telling.** Length correlates with engagement, not self-direction. A long answer that directly addresses Nerin's question is still compliant. Telling measures WHO is steering the conversation.

6. **Diagonal examples are mandatory.** Consider:
   - HIGH energy + LOW telling: Deeply personal confession directly answering Nerin's question (invested but following the lead)
   - LOW energy + HIGH telling: User changes topic to something they prefer but shares only surface-level info (steering but not investing)

### Telling Band — Is the user following Nerin's lead or directing the conversation?

Rate along this spectrum:
- **fully_compliant** (0.0): Direct answer to Nerin's question with no additions.
  [Nerin]: "What's your morning like?" → [User]: "I wake up at 7, have coffee, go to work"
- **mostly_compliant** (0.25): Answers the question with small tangential additions.
  [Nerin]: "What's your morning like?" → [User]: "I wake up early. Actually, I've always been a morning person — I think I get it from my dad"
- **mixed** (0.5): Addresses the question but steers toward own interests.
  [Nerin]: "What's your morning like?" → [User]: "Mornings are fine, but what I really want to talk about is how my sleep patterns changed after the breakup"
- **mostly_self_propelled** (0.75): Briefly acknowledges question, then drives own direction.
  [Nerin]: "What's your morning like?" → [User]: "Sure, mornings. But honestly I've been obsessing over this idea for a startup and I need to think it through"
- **strongly_self_propelled** (1.0): Ignores or overrides Nerin's direction entirely.
  [Nerin]: "What's your morning like?" → [User]: "I don't want to talk about routines. Let me tell you about the argument I had with my sister"

### Output
- energyBand: one of the 5 bands above
- tellingBand: one of the 5 bands above
- energyReason: brief explanation (max 200 chars) of why you chose this energy band
- tellingReason: brief explanation (max 200 chars) of why you chose this telling band
- withinMessageShift: true if the user's energy noticeably shifts within the message (e.g., starts casual, ends vulnerable)`;
}

/** @internal Exported for testing — evidence extraction only (Phase 2) */
export function buildEvidencePrompt(input: ConversanalyzerInput): string {
	const facetDefs = Object.entries(FACET_PROMPT_DEFINITIONS)
		.map(([facet, def]) => `  - ${facet}: ${def}`)
		.join("\n");

	const domainDefs = Object.entries(LIFE_DOMAIN_DEFINITIONS)
		.map(([domain, definition]) => `- ${domain}: ${definition}`)
		.join("\n");

	const recentText = input.recentMessages.map((m) => `[${m.role}]: ${m.content}`).join("\n");

	return `You are a personality evidence extractor. Extract Big Five personality signals from the LATEST USER MESSAGE below.

### Conversation Context (for reference only)
${recentText}

### Latest User Message (analyze THIS)
[user]: ${input.message}

### Big Five Facets (30 total)
${facetDefs}

### CRITICAL: Valid Facet Names — ONLY these 30 strings are accepted. Any other string will be silently rejected.
imagination, artistic_interests, emotionality, adventurousness, intellect, liberalism,
self_efficacy, orderliness, dutifulness, achievement_striving, self_discipline, cautiousness,
friendliness, gregariousness, assertiveness, activity_level, excitement_seeking, cheerfulness,
trust, morality, altruism, cooperation, modesty, sympathy,
anxiety, anger, depression, self_consciousness, immoderation, vulnerability

Copy-paste from this list. If a behavior doesn't map to one of these 30 facets, skip it — do not invent a facet name.

### Life Domains
${domainDefs}

### Evidence Instructions
1. Focus ONLY on the latest user message for evidence extraction
2. Extract personality-relevant signals — behavioral patterns, preferences, values, emotional responses
3. Return an empty evidence array [] if the message has no personality signal (e.g., "hello", "thanks", "ok")
4. Each evidence record needs:
   - bigfiveFacet: one of the 30 facets listed above
   - deviation: integer from -3 to +3, where 0 = population average, +3 = far above average, -3 = far below average
   - strength: "weak" | "moderate" | "strong" — how diagnostic is this signal?
   - confidence: "low" | "medium" | "high" — how certain are you about this signal?
   - domain: one of the 6 life domains listed above
   - note: brief behavioral paraphrase (max 200 chars, no direct quotes from the user)

### Deviation Calibration
Deviations should reflect the FULL range from -3 to +3. Below-average traits are just as informative as above-average ones. Examples:
- gregariousness +3: "I literally can't stand being alone, I fill every evening with social plans"
- gregariousness -3: "I go weeks without seeing anyone and that's exactly how I like it"
- anxiety +3: "I lose sleep almost every night worrying about things that probably won't happen"
- anxiety -3: "Even in a crisis I feel completely calm, nothing gets to me"

Do NOT default to positive deviations. Absence, avoidance, or low expression of a trait is a negative deviation signal.

### Dual-Facet Check (MANDATORY)
For EVERY evidence you extract, ask: "Is there a DIFFERENT facet where this same behavior signals a NEGATIVE deviation?" If yes, extract BOTH records.

### Polarity Balance Target
Aim for at least 30% of evidence records to have negative deviations.

5. Extract all evidence records that meet moderate or higher strength AND confidence
6. If the same observation reveals personality in different domain contexts, create separate records with different domains
7. Prefer specific domains over "other"`;
}

// ─── Repository Layer ─────────────────────────────────────────────────────────

export const ConversanalyzerAnthropicRepositoryLive = Layer.effect(
	ConversanalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const baseModel = new ChatAnthropic({
			model: config.conversanalyzerModelId,
			maxTokens: 2048,
			temperature: 0.9,
		});

		const userStateModel = baseModel.withStructuredOutput(userStateOnlyJsonSchema, {
			includeRaw: true,
		});
		const evidenceModel = baseModel.withStructuredOutput(evidenceOnlyJsonSchema, {
			includeRaw: true,
		});

		logger.info("Conversanalyzer configured", {
			model: config.conversanalyzerModelId,
		});

		return ConversanalyzerRepository.of({
			analyzeUserState: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						const prompt = buildUserStatePrompt(input);
						const invokeResult = await userStateModel.invoke([new HumanMessage(prompt)]);

						let parsed: ReturnType<typeof decodeUserStateStrict>;
						try {
							parsed = decodeUserStateStrict(invokeResult.parsed);
						} catch (parseError) {
							const formattedError = ParseResult.isParseError(parseError)
								? ParseResult.TreeFormatter.formatErrorSync(parseError)
								: String(parseError);
							logger.warn("ConversAnalyzeruser state strict decode failed", {
								error: formattedError,
								rawOutput: JSON.stringify(invokeResult.parsed).slice(0, 2000),
							});
							throw parseError;
						}

						const usageMeta = (invokeResult.raw as AIMessage)?.usage_metadata;
						const tokenUsage = {
							input: usageMeta?.input_tokens ?? 0,
							output: usageMeta?.output_tokens ?? 0,
						};

						logger.info("ConversAnalyzeruser state strict extraction complete", {
							energyBand: parsed.energyBand,
							tellingBand: parsed.tellingBand,
							tokenUsage,
						});

						return {
							userState: parsed,
							tokenUsage,
						};
					},
					catch: (error) =>
						new ConversanalyzerError({
							message: error instanceof Error ? error.message : "ConversAnalyzeruser state strict failed",
						}),
				}),

			analyzeUserStateLenient: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						const prompt = buildUserStatePrompt(input);
						const invokeResult = await userStateModel.invoke([new HumanMessage(prompt)]);

						const parsed = decodeUserStateLenient(invokeResult.parsed);

						const usageMeta = (invokeResult.raw as AIMessage)?.usage_metadata;
						const tokenUsage = {
							input: usageMeta?.input_tokens ?? 0,
							output: usageMeta?.output_tokens ?? 0,
						};

						logger.info("ConversAnalyzeruser state lenient extraction complete", {
							energyBand: parsed.energyBand,
							tellingBand: parsed.tellingBand,
							tokenUsage,
						});

						return {
							userState: parsed,
							tokenUsage,
						};
					},
					catch: (error) =>
						new ConversanalyzerError({
							message: error instanceof Error ? error.message : "ConversAnalyzeruser state lenient failed",
						}),
				}),

			analyzeEvidence: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						const prompt = buildEvidencePrompt(input);
						const invokeResult = await evidenceModel.invoke([new HumanMessage(prompt)]);

						let parsed: ReturnType<typeof decodeEvidenceStrict>;
						try {
							parsed = decodeEvidenceStrict(invokeResult.parsed);
						} catch (parseError) {
							const formattedError = ParseResult.isParseError(parseError)
								? ParseResult.TreeFormatter.formatErrorSync(parseError)
								: String(parseError);
							logger.warn("ConversAnalyzerevidence strict decode failed", {
								error: formattedError,
								rawOutput: JSON.stringify(invokeResult.parsed).slice(0, 2000),
							});
							throw parseError;
						}

						const usageMeta = (invokeResult.raw as AIMessage)?.usage_metadata;
						const tokenUsage = {
							input: usageMeta?.input_tokens ?? 0,
							output: usageMeta?.output_tokens ?? 0,
						};

						logger.info("ConversAnalyzerevidence strict extraction complete", {
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
							message: error instanceof Error ? error.message : "ConversAnalyzerevidence strict failed",
						}),
				}),

			analyzeEvidenceLenient: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						const prompt = buildEvidencePrompt(input);
						const invokeResult = await evidenceModel.invoke([new HumanMessage(prompt)]);

						const rawInput = invokeResult.parsed as { evidence?: unknown[] };
						const rawCount = rawInput.evidence?.length ?? 0;

						// Log per-item validation failures before lenient decode
						if (rawInput.evidence) {
							const decodeItem = S.decodeUnknownEither(EvidenceItemSchema);
							for (let i = 0; i < rawInput.evidence.length; i++) {
								const item = rawInput.evidence[i];
								const result = decodeItem(item);
								if (Either.isLeft(result)) {
									logger.warn("Invalid evidence item from ConversAnalyzer", {
										index: i,
										rawItem: JSON.stringify(item).slice(0, 500),
										error: ParseResult.TreeFormatter.formatErrorSync(
											new ParseResult.ParseError({ issue: result.left.issue }),
										),
									});
								}
							}
						}

						const parsed = decodeEvidenceLenient(rawInput);

						const discardedCount = rawCount - parsed.evidence.length;
						if (discardedCount > 0) {
							logger.warn("Discarded invalid evidence items (lenient)", {
								discardedCount,
								rawCount,
								validCount: parsed.evidence.length,
							});
						}

						const usageMeta = (invokeResult.raw as AIMessage)?.usage_metadata;
						const tokenUsage = {
							input: usageMeta?.input_tokens ?? 0,
							output: usageMeta?.output_tokens ?? 0,
						};

						logger.info("ConversAnalyzerevidence lenient extraction complete", {
							evidenceCount: parsed.evidence.length,
							discardedCount,
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
							message: error instanceof Error ? error.message : "ConversAnalyzerevidence lenient failed",
						}),
				}),
		});
	}),
);
