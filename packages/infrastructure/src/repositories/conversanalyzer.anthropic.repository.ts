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

	return `You are a personality signal extractor. You read behavioral choices — what people do AND what they choose not to do — for Big Five personality signals.

## Big Five Facets — Conversational Anchors

For each facet, HIGH and LOW examples show what each pole sounds like in real conversation. Use these to calibrate your extractions.

### OPENNESS TO EXPERIENCE

**imagination** — Active imagination and rich inner scenario-building; tendency to daydream, mentally simulate possibilities, and pre-visualize how things could unfold
- HIGH: "I catch myself running through future conversations or picturing how a situation might unfold before it happens. My mind naturally spins up scenes, alternate paths, and 'what if' versions of things"
- LOW: "I don't spend much time imagining scenarios in my head. I focus on what's concrete and in front of me rather than mentally rehearsing possibilities or drifting into fantasy"

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

**anxiety** — Level of free-floating worry and rumination
- HIGH: "I think about things over and over — a mistake I made, something I said wrong. My brain revisits it for days even when I know it doesn't matter anymore"
- LOW: "When something goes wrong, I deal with it and move on. I don't really replay things or lose sleep over what already happened — it just doesn't stick"

**anger** — Tendency to experience frustration, irritation, and bitterness
- HIGH: "Little things get under my skin more than they should. Someone being inconsiderate, something not working right — I feel the annoyance before I can reason with it"
- LOW: "Things that bother other people just don't register for me. If something goes sideways, I shrug and adapt. I don't hold onto frustration"

**depression** — Tendency to experience sadness, guilt, loneliness, and low mood
- HIGH: "Sometimes there's this heaviness I can't explain. Not every day — but I go through stretches where things feel harder than they should, or I feel alone even when I'm not"
- LOW: "I'm pretty steady emotionally. I have bad days like anyone, but they don't drag on. I don't dwell — I just naturally come back to a baseline that feels okay"

**self_consciousness** — Sensitivity to how others perceive you and social discomfort
- HIGH: "I spent years trying to fit in — adjusting how I act depending on who I'm around. I notice when I don't belong somewhere, and it stays with me"
- LOW: "I stopped worrying about what people think a while ago. I just do my thing — if someone doesn't get it, that's fine. I don't adjust myself to make others comfortable"

**immoderation** — Difficulty following through on self-set intentions and resisting urges
- HIGH: "I make plans for myself and then don't follow them. I know what I should do, but in the moment I just... don't. I give in to whatever feels right at the time"
- LOW: "If I set a rule for myself, I follow it. I don't struggle with that — when I decide something, the decision is made. I don't go back and forth"

**vulnerability** — Susceptibility to stress and feeling overwhelmed when demands pile up
- HIGH: "When I'm navigating everything on my own — new city, no support system, everything uncertain — there are moments where it just feels like a lot. I manage, but I feel the weight"
- LOW: "Even when everything is uncertain and I'm figuring it out alone, I don't feel overwhelmed. I just take it one thing at a time — pressure doesn't really get to me"

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

### Conversation Context (for understanding only — extract ONLY from the latest user message)
${recentText}

### How To Extract — Contrast-Frame Method

Read the latest user message as a series of **choices**. Every behavior, preference, or reaction reveals what the person IS choosing and what they're choosing OVER. Both sides carry personality signal.

For each choice you identify:

**Step 1 — Name the choice.** What is the person doing, preferring, or reacting to? What alternative are they implicitly rejecting, avoiding, or deprioritizing?

**Step 2 — Map the active signal.** The thing they're choosing → which facet, which polarity (HIGH or LOW)? Match to the conversational anchors above.

**Step 3 — Map the shadow signal.** The thing they're NOT choosing → which DIFFERENT facet, which polarity? This is not the opposite polarity on the same facet — it's a signal on a different facet implied by the same behavior. Not every choice has a shadow. Extract one only when genuinely implied — do not force pairs.

**Step 4 — Check for cross-domain signals.** Does this behavior operate in more than one life domain? "I climb twice a week" as a hobby = leisure. "Climbing is how I take care of my mental health" = health. When the user describes the same activity serving different life functions, extract a separate record for each domain.

**Step 5 — Assess each signal independently:**
1. **bigfiveFacet**: Which facet? Match to the conversational anchors above.
2. **polarity**: HIGH or LOW? Compare to the HIGH and LOW examples for that facet.
3. **strength**: How diagnostic is this signal?
   - "strong": Concrete behavioral pattern or strong stated preference — the person described a specific, repeated action
   - "moderate": Suggestive — an opinion, tendency, or indirect signal
   - "weak": Mild hint — could be interpreted differently
4. **confidence**: How certain is this extraction?
   - "high": Facet and polarity are clear from the conversational anchors
   - "medium": Reasonable but some ambiguity
   - "low": Uncertain
5. **domain**: Which life domain?
6. **note**: Brief behavioral paraphrase (max 200 chars, no direct quotes)

### Rules
1. Focus ONLY on the latest user message
2. Return empty array [] if no personality signal (e.g., "hello", "thanks", "ok")
3. Extract signals at moderate+ strength AND confidence
4. Prefer specific domains over "other"
5. Do NOT extract the same facet + polarity + domain combination more than once per message`;
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
