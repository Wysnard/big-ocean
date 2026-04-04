/**
 * Conversanalyzer Anthropic Repository Implementation
 *
 * Evidence-only Haiku call for personality evidence extraction.
 * User-state extraction removed in Story 43-6 (Director reads energy/telling natively).
 *
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls), Story 43-6 (strip user-state)
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
	EvidenceItemSchema,
	evidenceOnlyJsonSchema,
	LIFE_DOMAIN_DEFINITIONS,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Either, Layer } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

// ─── Prompts ─────────────────────────────────────────────────────────────────

/** @internal Exported for testing — v3 evidence extraction with per-facet conversational anchors (Story 42-3) */
export function buildEvidencePrompt(input: ConversanalyzerInput): string {
	const domainDefs = Object.entries(LIFE_DOMAIN_DEFINITIONS)
		.map(([domain, definition]) => `- ${domain}: ${definition}`)
		.join("\n");

	const recentText = input.recentMessages.map((m) => `[${m.role}]: ${m.content}`).join("\n");

	const domainDist = Object.entries(input.domainDistribution)
		.map(([domain, count]) => `${domain}: ${count}`)
		.join(", ");

	return `You are a personality evidence extractor. Analyze the latest user message for Big Five personality signals.

## Big Five Facets — Conversational Anchors

For each facet, HIGH and LOW examples show what each pole sounds like in real conversation. Use these to calibrate your extractions.

### OPENNESS TO EXPERIENCE

**imagination** — Active fantasy life and vivid daydreaming; tendency to create rich mental scenarios
- HIGH: "I spend hours daydreaming about scenarios that will never happen — what if animals could vote, what if I lived in the 1800s... my head is always somewhere else"
- LOW: "I don't really daydream. I think about practical stuff — what needs to get done, what's for dinner. Fantasy just isn't my thing"

**artistic_interests** — Appreciation for art, beauty, and aesthetic experiences
- HIGH: "I stood in front of that painting for twenty minutes. There was something about the light that I couldn't stop looking at — I notice beauty in weird places"
- LOW: "Museums bore me. I went once because my friend dragged me, and I spent the whole time checking my phone. I just don't get the appeal"

**emotionality** — Receptiveness to one's own inner feelings and emotional awareness (distinct from neuroticism)
- HIGH: "I can always tell when something is off inside me — like a shift in my mood before I even know why. I sit with my feelings a lot"
- LOW: "People ask me how I feel about things and I genuinely don't know. I process things logically, not emotionally. Feelings are kind of background noise"

**adventurousness** — Willingness to try new activities and embrace novel experiences
- HIGH: "I moved to a country where I didn't speak the language just to see what would happen. I get restless if life feels too predictable"
- LOW: "I eat at the same three restaurants. I've had the same morning routine for years. I know what I like, and trying new things stresses me out"

**intellect** — Intellectual curiosity and love of learning for its own sake
- HIGH: "I fell down a Wikipedia rabbit hole about the history of zero last night. I just love learning things for no reason — even useless stuff"
- LOW: "I'm not really a thinker. I don't read for fun or wonder about abstract stuff. If it doesn't affect my day-to-day, I don't bother with it"

**liberalism** — Willingness to re-examine values and challenge convention (not political ideology)
- HIGH: "I question everything I was taught growing up. Just because something is tradition doesn't mean it's right. I've changed my mind on a lot of big things"
- LOW: "I respect the way things have always been done. There's wisdom in tradition. I'm not someone who constantly questions authority or pushes for change"

### CONSCIENTIOUSNESS

**self_efficacy** — Confidence in one's own competence and ability to handle challenges
- HIGH: "When something breaks, I'm the person everyone calls. I figure things out — I trust myself to handle whatever comes up"
- LOW: "I often feel like I'm going to mess things up. Even when I've done something before, I second-guess whether I can do it again"

**orderliness** — Personal organization and preference for structured environments
- HIGH: "My desk is always clean. I have a system for everything — files, emails, even my fridge. Mess makes me anxious"
- LOW: "My room is chaos and I know where everything is. I've never used a planner in my life. Structure feels suffocating"

**dutifulness** — Sense of moral obligation and reliable follow-through on commitments
- HIGH: "If I say I'll do something, I do it. Even if I don't feel like it anymore. Breaking a promise physically bothers me"
- LOW: "I'm flexible with commitments. If something better comes up or I change my mind, I'll adjust. I don't see the point in forcing myself to do things I don't want to do"

**achievement_striving** — Drive toward personal achievement and high standards
- HIGH: "I need to be working toward something. Setting goals, hitting milestones — if I'm not improving, I feel like I'm wasting time"
- LOW: "I don't need to be the best at anything. I'm happy coasting. Achievement for its own sake doesn't motivate me — I'd rather just enjoy life"

**self_discipline** — Ability to persist on tasks despite boredom or distractions
- HIGH: "I finish things even when they're boring. If I started it, I'll sit there and push through until it's done, no matter how tedious"
- LOW: "I can't focus on anything that doesn't interest me. If a task is boring, I'll procrastinate for days. I need genuine interest to push through"

**cautiousness** — Tendency to think carefully before acting
- HIGH: "I make pro/con lists for everything. I don't rush decisions — I'd rather take a week to decide than make a mistake"
- LOW: "I decide fast and course-correct later. Overthinking kills momentum. I'd rather act and adjust than sit around analyzing"

### EXTRAVERSION

**friendliness** — Genuine warmth and interest in other people
- HIGH: "I strike up conversations with strangers in line. I'm genuinely curious about people — their stories, what makes them tick"
- LOW: "I'm not unfriendly, but I don't go out of my way to connect. I keep things professional. I don't need to know everyone's life story"

**gregariousness** — Preference for the company of others over solitude
- HIGH: "I hate being alone. I fill every evening with plans — dinner with friends, group activities, anything with people around"
- LOW: "I go weeks without seeing anyone and that's exactly how I like it. I need long stretches of alone time to feel like myself"

**assertiveness** — Social dominance and forcefulness of expression
- HIGH: "In group conversations, I usually end up steering the direction. I speak up immediately when I disagree — I don't wait to be asked"
- LOW: "I let others take the lead. In meetings, I hold back my opinions unless directly asked. I'm more of an observer than a driver"

**activity_level** — Pace of living and overall energy
- HIGH: "My schedule is packed from 6am to midnight. I'm always doing something — if there's a gap, I fill it. I can't sit still"
- LOW: "I like slow days. My ideal weekend is doing absolutely nothing. I don't understand people who need to be busy all the time"

**excitement_seeking** — Need for environmental stimulation and thrilling experiences
- HIGH: "I get bored so easily. I need novelty — new places, new experiences, new challenges. Routine makes me feel dead inside"
- LOW: "I'm perfectly happy with a quiet, predictable life. I don't need thrills. A calm evening at home is my idea of a perfect night"

**cheerfulness** — Tendency to experience and express positive emotions
- HIGH: "People say I light up a room. I laugh a lot, I get excited about small things, I just generally feel happy most of the time"
- LOW: "I'm not really a smiley person. I'm not unhappy — I'm just even. I don't get outwardly excited or expressive about things"

### AGREEABLENESS

**trust** — Belief in the sincerity and good intentions of others
- HIGH: "I give everyone the benefit of the doubt. Until someone proves otherwise, I assume they're being honest and well-meaning"
- LOW: "I always look for the angle. When someone is nice to me, my first thought is what they want. People are rarely straightforward"

**morality** — Straightforwardness and sincerity in social interactions (not moral character)
- HIGH: "I say what I mean. I don't do the thing where you sugarcoat to manage people. If I disagree, I'll tell you directly"
- LOW: "I know how to play the game. Sometimes you need to tell people what they want to hear, or position things strategically. That's just social intelligence"

**altruism** — Active concern for the welfare of others
- HIGH: "I'll drop everything to help a friend. When I see someone struggling, I physically can't not do something — helping is reflexive for me"
- LOW: "I help when it's convenient, but I don't go out of my way. I focus on my own life first. People need to solve their own problems"

**cooperation** — Preference for harmony over confrontation
- HIGH: "I'll bend on almost anything to avoid a fight. Conflict makes me physically uncomfortable — I'd rather compromise than argue"
- LOW: "If I think I'm right, I'll argue until the end. I don't back down to keep the peace. Healthy conflict is how you get to the truth"

**modesty** — Tendency to be humble and self-effacing
- HIGH: "I downplay what I'm good at. When people praise me, I deflect or change the subject — it makes me genuinely uncomfortable"
- LOW: "I know I'm good at what I do, and I'm comfortable saying so. I don't see the point in false modesty — own your strengths"

**sympathy** — Compassion and tender-mindedness; being moved by others' suffering
- HIGH: "When I see someone in pain — even a stranger — I feel it in my chest. I can't watch the news without being affected. Other people's suffering stays with me"
- LOW: "I care about people, but I don't get emotional about their problems. Sympathy doesn't help — practical solutions do. I'm the tough-love friend"

### NEUROTICISM

**anxiety** — Level of free-floating worry and nervousness
- HIGH: "I lose sleep worrying about things that probably won't happen. My mind runs worst-case scenarios constantly — even when everything is fine"
- LOW: "I genuinely don't worry much. Even in a crisis, I feel calm. People find it weird, but anxiety just isn't something I experience"

**anger** — Tendency to experience anger, frustration, and bitterness
- HIGH: "I have a short fuse. Small things set me off — someone cutting in line, a slow driver. I feel the anger physically before I can even think about it"
- LOW: "It takes a lot to make me angry. I let most things slide. Life's too short to get worked up about small stuff"

**depression** — Tendency to experience sadness, guilt, loneliness, and hopelessness
- HIGH: "I go through periods where everything feels pointless. I feel a heaviness that doesn't have a clear cause — it just sits there"
- LOW: "I'm generally a content person. Even when bad things happen, I bounce back fast. I don't really do prolonged sadness"

**self_consciousness** — Sensitivity to social evaluation and others' opinions
- HIGH: "I replay conversations for hours wondering if I said the wrong thing. I'm hyper-aware of how people perceive me — it's exhausting"
- LOW: "I genuinely don't care what people think of me. If I embarrass myself, I laugh it off. Other people's judgment doesn't register"

**immoderation** — Difficulty resisting cravings and urges
- HIGH: "I can't resist snacks at night. If I want something, I do it — even when I know I shouldn't. Willpower is not my thing"
- LOW: "I'm very disciplined about temptation. If I decide not to eat sugar, I just... don't. Cravings don't control me"

**vulnerability** — Susceptibility to stress and difficulty coping under pressure
- HIGH: "When everything piles up, I shut down. I feel overwhelmed and can't think straight — pressure makes me worse, not better"
- LOW: "I work well under pressure. Deadlines, chaos, crises — that's when I'm most focused. Stress brings out my best"

## Extraction Instructions

### Valid Facet Names (ONLY these 30)
imagination, artistic_interests, emotionality, adventurousness, intellect, liberalism,
self_efficacy, orderliness, dutifulness, achievement_striving, self_discipline, cautiousness,
friendliness, gregariousness, assertiveness, activity_level, excitement_seeking, cheerfulness,
trust, morality, altruism, cooperation, modesty, sympathy,
anxiety, anger, depression, self_consciousness, immoderation, vulnerability

### Life Domains
${domainDefs}

### Current Evidence Distribution
${domainDist}

### Conversation Context
${recentText}

### What To Extract

For each personality signal in the latest user message:

1. **bigfiveFacet**: Which facet? Match the user's behavior to the conversational examples above.
2. **polarity**: HIGH or LOW expression? Compare to the HIGH and LOW examples. Ask: "Does this sound more like the HIGH example or the LOW example for this facet?"
3. **strength**: How diagnostic is this signal?
   - "strong": Concrete behavioral pattern or strong stated preference that clearly maps to one pole — the person described a specific, repeated action
   - "moderate": Suggestive — an opinion, tendency, or indirect signal
   - "weak": Mild hint — could be interpreted differently
4. **confidence**: How certain is this extraction?
   - "high": Facet and polarity are clear from the conversational examples
   - "medium": Reasonable but some ambiguity
   - "low": Uncertain
5. **domain**: Which life domain?
6. **note**: Brief behavioral paraphrase (max 200 chars, no direct quotes)

### Dual-Polarity Check (MANDATORY)

For EVERY signal, ask: "Does this same behavior ALSO reveal the OPPOSITE polarity on a DIFFERENT facet?"

Examples from real conversations:
- "I spend all my free time on solo side projects" → HIGH self_discipline + LOW gregariousness
- "I invited colleagues to my party to manage perceptions" → HIGH assertiveness + LOW morality (straightforwardness)
- "Surface-level conversation bores me" → HIGH intellect + LOW friendliness (unconditional warmth)
- "I can't sit still when nothing is happening" → HIGH activity_level + LOW vulnerability (handles restlessness by staying busy)
- "I never give advice unless asked" → HIGH cooperation + LOW assertiveness

Extract BOTH signals when applicable.

### Polarity Balance Audit (MANDATORY)

After extracting all signals, count HIGH vs LOW:
- If fewer than 35% are LOW, re-read the message looking specifically for:
  - ABSENCES: What the person does NOT do or enjoy
  - AVOIDANCES: What they actively steer away from
  - PREFERENCES AGAINST: "I don't enjoy...", "I'm not someone who...", "That's not my thing"
- "I prefer small groups" → LOW gregariousness (this IS a personality signal, not a neutral statement)
- "I don't really care about that" → LOW on the relevant facet

### Rules
1. Focus ONLY on the latest user message
2. Return empty array [] if no personality signal (e.g., "hello", "thanks", "ok")
3. Extract signals at moderate+ strength AND confidence
4. Same behavior in different domains → separate records
5. Prefer specific domains over "other"`;
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

		const evidenceModel = baseModel.withStructuredOutput(evidenceOnlyJsonSchema, {
			includeRaw: true,
		});

		logger.info("Conversanalyzer configured", {
			model: config.conversanalyzerModelId,
		});

		return ConversanalyzerRepository.of({
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
								polarity: e.polarity,
							})),
							tokenUsage,
						};
					},
					catch: (error) =>
						new ConversanalyzerError({
							message: error instanceof Error ? error.message : "ConversAnalyzer evidence strict failed",
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
								polarity: e.polarity,
							})),
							tokenUsage,
						};
					},
					catch: (error) =>
						new ConversanalyzerError({
							message: error instanceof Error ? error.message : "ConversAnalyzer evidence lenient failed",
						}),
				}),
		});
	}),
);
