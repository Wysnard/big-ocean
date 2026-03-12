/**
 * Conversanalyzer Anthropic Repository Implementation (v2)
 *
 * Calls Claude Haiku via Anthropic SDK tool use for dual extraction:
 * 1. User state (energy band + telling band) — positioned FIRST for attention priority
 * 2. Big Five facet evidence — positioned SECOND (battle-tested, tolerates being second)
 *
 * v2 includes six load-bearing guardrails against systematic extraction bias.
 *
 * Story 10.2 (v1), Story 24-1 (v2 evolution)
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	AppConfig,
	ConversanalyzerError,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
	conversanalyzerV2JsonSchema,
	decodeConversanalyzerV2Lenient,
	decodeConversanalyzerV2Strict,
	FACET_PROMPT_DEFINITIONS,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";

// ─── v2 Prompt ───────────────────────────────────────────────────────────────

function buildV2Prompt(input: ConversanalyzerInput): string {
	const facetDefs = Object.entries(FACET_PROMPT_DEFINITIONS)
		.map(([facet, def]) => `  - ${facet}: ${def}`)
		.join("\n");

	const domainDist = Object.entries(input.domainDistribution)
		.map(([d, n]) => `${d}=${n}`)
		.join(", ");

	const recentText = input.recentMessages.map((m) => `[${m.role}]: ${m.content}`).join("\n");

	return `You are a dual-purpose conversational state extractor and personality evidence extractor. You will analyze the latest user message in two phases:

## PHASE 1: USER STATE EXTRACTION (energy + telling)

Classify the user's conversational state along two independent axes.

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

### ⚠️ SIX LOAD-BEARING GUARDRAILS (apply to every classification)

1. **Eloquence is not energy.** A beautifully written message about breakfast is still low energy. Rate the EMOTIONAL/COGNITIVE investment, not writing quality.

2. **Sophistication is not cognitive investment.** An intellectually complex explanation of a hobby can be low-energy if it's well-rehearsed and emotionally distant. Look for active reflection, not passive expertise.

3. **Peak dimension, not average.** If ANY one dimension (emotional, cognitive, expressive, urgency) is strongly present, that is sufficient for high energy. Don't average the four dimensions — one high signal dominates.

4. **Understated styles are not low energy.** A quiet person sharing something deeply personal in few words can be very_high energy. Brevity ≠ disengagement. Look at WHAT they reveal, not HOW MANY words they use.

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

### State Output
- energyBand: one of the 5 bands above
- tellingBand: one of the 5 bands above
- energyReason: brief explanation (max 200 chars) of why you chose this energy band
- tellingReason: brief explanation (max 200 chars) of why you chose this telling band
- withinMessageShift: true if the user's energy noticeably shifts within the message (e.g., starts casual, ends vulnerable)

---

## PHASE 2: PERSONALITY EVIDENCE EXTRACTION

Extract Big Five personality signals from the latest user message.

### Big Five Facets (30 total)
${facetDefs}

### IMPORTANT: Valid Facet Names (use EXACTLY these values)
imagination, artistic_interests, emotionality, adventurousness, intellect, liberalism,
self_efficacy, orderliness, dutifulness, achievement_striving, self_discipline, cautiousness,
friendliness, gregariousness, assertiveness, activity_level, excitement_seeking, cheerfulness,
trust, morality, altruism, cooperation, modesty, sympathy,
anxiety, anger, depression, self_consciousness, immoderation, vulnerability

Do NOT invent facet names. If a behavior doesn't map to one of these 30 facets, skip it.

### Life Domains
- work: Professional activities, career, job tasks, colleagues, workplace dynamics
- relationships: Romantic partners, close friendships, social connections
- family: Parents, siblings, children, extended family, household dynamics
- leisure: Hobbies, entertainment, sports, travel, group activities
- solo: Personal habits, self-care, alone time, individual routines, introspection
- other: ONLY when the message truly doesn't fit any above domain. Target <15% of all evidence in "other".

### Current Evidence Distribution
${domainDist}
(Use this to be aware of domain drift. If one domain dominates, still tag accurately — but consider whether the message reveals personality in an under-represented domain.)

### Conversation Context (last messages)
${recentText}

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

// ─── MOCK_LLM fallback for Docker integration tests ──────────────────────────

function mockAnalyzeV2(): ConversanalyzerV2Output {
	return {
		userState: {
			energyBand: "steady",
			tellingBand: "mixed",
			energyReason: "Engaged with moderate self-reflection",
			tellingReason: "Follows prompts with some self-direction",
			withinMessageShift: false,
		},
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

// ─── Shared extraction logic ─────────────────────────────────────────────────

async function callAnthropic(
	client: Anthropic,
	modelId: string,
	prompt: string,
): Promise<Anthropic.Message> {
	return client.messages.create({
		model: modelId,
		max_tokens: 1024,
		temperature: 0.9,
		messages: [{ role: "user", content: prompt }],
		tools: [
			{
				name: "extract_state_and_evidence",
				description:
					"Extract user conversational state (energy + telling) and Big Five personality evidence from the user message",
				input_schema: conversanalyzerV2JsonSchema as Anthropic.Tool["input_schema"],
			},
		],
		tool_choice: { type: "tool", name: "extract_state_and_evidence" },
	});
}

function extractToolInput(response: Anthropic.Message): unknown {
	const toolUseBlock = response.content.find((b) => b.type === "tool_use");
	if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
		throw new Error("No tool_use block in Haiku response");
	}
	return toolUseBlock.input;
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

		logger.info("Conversanalyzer v2 configured", {
			model: config.conversanalyzerModelId,
			mocked: isMocked,
		});

		return ConversanalyzerRepository.of({
			analyze: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						if (isMocked || !client) {
							return mockAnalyzeV2();
						}

						const prompt = buildV2Prompt(input);
						const response = await callAnthropic(client, config.conversanalyzerModelId, prompt);
						const rawInput = extractToolInput(response);

						// Strict decode — all-or-nothing
						const parsed = decodeConversanalyzerV2Strict(rawInput);

						const tokenUsage = {
							input: response.usage.input_tokens,
							output: response.usage.output_tokens,
						};

						logger.info("ConversAnalyzer v2 strict extraction complete", {
							energyBand: parsed.userState.energyBand,
							tellingBand: parsed.userState.tellingBand,
							evidenceCount: parsed.evidence.length,
							tokenUsage,
						});

						return {
							userState: parsed.userState,
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
							message: error instanceof Error ? error.message : "ConversAnalyzer v2 strict failed",
						}),
				}),

			analyzeLenient: (input: ConversanalyzerInput) =>
				Effect.tryPromise({
					try: async () => {
						if (isMocked || !client) {
							return mockAnalyzeV2();
						}

						const prompt = buildV2Prompt(input);
						const response = await callAnthropic(client, config.conversanalyzerModelId, prompt);
						const rawInput = extractToolInput(response) as {
							evidence?: unknown[];
							userState?: unknown;
						};

						// Count raw evidence for discard logging
						const rawCount = rawInput.evidence?.length ?? 0;

						// Lenient decode — independent field parsing with defaults
						const parsed = decodeConversanalyzerV2Lenient(rawInput);

						const discardedCount = rawCount - parsed.evidence.length;
						if (discardedCount > 0) {
							logger.warn("Discarded invalid evidence items (lenient)", {
								discardedCount,
								rawCount,
								validCount: parsed.evidence.length,
							});
						}

						const tokenUsage = {
							input: response.usage.input_tokens,
							output: response.usage.output_tokens,
						};

						logger.info("ConversAnalyzer v2 lenient extraction complete", {
							energyBand: parsed.userState.energyBand,
							tellingBand: parsed.userState.tellingBand,
							evidenceCount: parsed.evidence.length,
							discardedCount,
							tokenUsage,
						});

						return {
							userState: parsed.userState,
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
							message: error instanceof Error ? error.message : "ConversAnalyzer v2 lenient failed",
						}),
				}),
		});
	}),
);
