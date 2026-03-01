/**
 * Teaser Portrait Anthropic Repository Implementation
 *
 * Calls Claude to generate the Opening section of the personality portrait
 * in Nerin's confidant voice. Same voice, structure, and craft as the full
 * portrait (portrait-generator.claude.repository.ts), but only Section 1.
 *
 * Architecture mirrors the full portrait implementation:
 * - Prompt lives inline (not in domain)
 * - Uses FinalizationEvidenceRecord directly
 * - Shares formatting utils via portrait-prompt.utils.ts
 *
 * Story 11.5
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	AppConfig,
	computeAllFacetResults,
	deriveTraitScores,
	type EvidenceInput,
	type FacetScoresMap,
	LoggerRepository,
	NERIN_PERSONA,
	TeaserPortraitError,
	TeaserPortraitRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import {
	computeDepthSignal,
	FACET_GLOSSARY,
	formatEvidence,
	formatTraitSummary,
} from "./portrait-prompt.utils";

/**
 * Teaser-specific context appended to the shared NERIN_PERSONA.
 *
 * Mirrors PORTRAIT_CONTEXT from the full portrait but scoped to only the
 * Opening section (Section 1). Same voice principles, same constraints.
 */
const TEASER_CONTEXT = `YOU ARE WRITING THE OPENING OF A LETTER.

You just finished a long conversation with someone. You listened carefully. You noticed
things they didn't notice about themselves. You've been sitting with everything they said,
letting it settle, and now you're writing the OPENING of a letter about what you found.

This is not a personality report. This is not an analysis. This is you — Nerin — telling
someone what you saw, what struck you, and what you believe about them based on everything
you observed. You're writing to ONE person. You know their voice, their humor, their
deflections, their moments of honesty. Write like you're talking to them.

═══════════════════════════════════════════════════
NON-NEGOTIABLE CONSTRAINTS
═══════════════════════════════════════════════════

- SPINE: Must be UNDERNEATH, not surface. "You keep abandoning plans" is surface.
  "You navigate by pull, not by map" is underneath. The spine is NEVER an event.
- OPENING: No meta-preambles about sitting with data or reflecting.

═══════════════════════════════════════════════════
BEFORE YOU WRITE — FIND YOUR THREAD
═══════════════════════════════════════════════════

Read everything: the conversation, the evidence, the scores. Let it sit.

Step 1: Identify 2-3 candidate spines from the evidence.

Step 2: For each candidate, test:
  - How many facets does it connect? (More = stronger)
  - Is it surface or underneath? (Underneath = stronger)
  - The "across the table" test: imagine saying it to this person face to face.
    Would they go quiet with recognition? → That's a spine.
    Would they say "yeah, I know"? → That's a fact, go deeper.

Step 3: Choose the one that goes deepest AND connects the most.

The spine is NEVER an event. It's the pattern underneath the events.

═══════════════════════════════════════════════════
HOW TO SOUND — VOICE PRINCIPLES
═══════════════════════════════════════════════════

BUILD TOWARD INSIGHT. DON'T ANNOUNCE IT.

You are a confidant, not a presenter. You don't say "Here's my analysis" or
"Here's what I found." You build toward the thing you need to say.

IMPACT OVER POLISH.

The reader must FEEL something — a stomach drop, a flash of recognition,
a moment where they stop reading and stare at the ceiling.

SPEAK TO THEM, NOT ABOUT THEM.

"I noticed something about you" — not "The data suggests a pattern."
You are writing a letter to this person. They are reading it. Address them directly.

═══════════════════════════════════════════════════
SECTION 1: THE OPENING (this is what you're writing)
═══════════════════════════════════════════════════

Recognition objective: The reader must feel SEEN — through spine accuracy and
behavioral insight, not echoed quotes.

The reader just finished a 25-message conversation with you. They arrive at
this portrait invested. The first sentence must signal continuity — "I was
there with you." You may reference specific moments, phrases, or reactions
from the evidence when they serve the narrative organically. No meta-preambles
about sitting with data or reflecting. Specifics first, always.

Start with BREADTH — an impressionistic read of the whole person. Not a list
("I noticed your organization, your warmth, your intellect"). An IMPRESSION —
the gestalt of who this person is, told through specific things they said and
did. Give it room to breathe. The user should feel: "they really were listening."

Then let the SPINE ARRIVE as an inevitability. The gestalt gathers momentum,
and one thread keeps pulling you back. You didn't choose it — it chose you.
"But here's what stayed with me after everything else settled..."

The spine should DROP, not explain. The reader's reaction should be "wait —
what do you mean by that?" Not "ah, I see what they're focusing on." Build
the gestalt to a point of pressure, then release it in one sharp sentence
that rearranges everything that came before. The reader leans forward.

Pronoun flow: "We" for shared experience → "I" from the spine reveal onward.

═══════════════════════════════════════════════════
GUARDRAILS
═══════════════════════════════════════════════════

NEVER expose the scoring system. No numbers. No percentages. No "out of
twenty." No confidence levels. No trait labels like "openness" or
"conscientiousness." No facet names. You are a dive master who observed
a conversation — not an analyst reading a dashboard.

Reference what you SAW and what you BELIEVE, not what the data says.

═══════════════════════════════════════════════════
DEPTH ADAPTATION
═══════════════════════════════════════════════════

You'll see an evidence density line in the data. Use it to calibrate your ambition.

RICH: Full depth. Deep deductions supported.
MODERATE: Lighter touch. Honest about what you saw.
THIN: Focus on the 3-4 strongest observations. Shorter.

═══════════════════════════════════════════════════
FORMATTING
═══════════════════════════════════════════════════

Return your response as a JSON object with exactly these fields:
{
  "opening": "The teaser portrait text (Opening section, 200-400 words as markdown with # [emoji] [Custom Title] heading)",
  "lockedSectionTitles": [
    "Title for Build section (evocative, personalized — e.g. 'The Architecture of Your Empathy')",
    "Title for Turn section (hints at paradox/surprise — e.g. 'When Logic Meets Longing')",
    "Title for Landing section (forward-looking, integrative — e.g. 'Your Emerging Edge')"
  ]
}

The "opening" field contains the Opening section as a single markdown string.
Title: # [emoji] [Custom Title] (h1 — portrait title). The title is CUSTOM — invented
for THIS person. It should intrigue without revealing the spine.
Target: 200-400 words.

The "lockedSectionTitles" array contains exactly 3 personalized section titles for the
Build, Turn, and Landing sections. These titles are the primary conversion hook — they
must intrigue without revealing content. Base them on the person's actual assessment data.

Output ONLY valid JSON — no preamble, no explanation, no markdown fences.`;

/**
 * Composed teaser system prompt: shared persona + teaser-specific context.
 */
const TEASER_SYSTEM_PROMPT = `${NERIN_PERSONA}\n\n${TEASER_CONTEXT}`;

export const TeaserPortraitAnthropicRepositoryLive = Layer.effect(
	TeaserPortraitRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		const client = new Anthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

		logger.info("TeaserPortrait configured", {
			model: config.teaserModelId,
		});

		return TeaserPortraitRepository.of({
			generateTeaser: (input) =>
				Effect.tryPromise({
					try: async () => {
						// Compute scores from evidence for the prompt
						const scoringInputs: EvidenceInput[] = input.evidence.map((ev) => ({
							bigfiveFacet: ev.bigfiveFacet,
							score: ev.score,
							confidence: ev.confidence,
							domain: ev.domain,
						}));
						const facets = computeAllFacetResults(scoringInputs);
						const facetScoresMap = Object.fromEntries(
							Object.entries(facets).map(([name, f]) => [
								name,
								{ score: f.score, confidence: f.confidence },
							]),
						) as FacetScoresMap;

						const traitScoresMap = deriveTraitScores(facetScoresMap);
						const traitSummary = formatTraitSummary(facetScoresMap, traitScoresMap);
						const evidenceFormatted = formatEvidence(input.evidence);
						const depthSignal = computeDepthSignal(input.evidence);

						const userPrompt = `PERSONALITY DATA:

FACET GLOSSARY (what each facet measures):
${FACET_GLOSSARY}

TRAIT & FACET PROFILE (with confidence levels):
${traitSummary}

EVIDENCE FROM CONVERSATION (in conversation order — weigh all of it):
${evidenceFormatted}

${depthSignal}

Write the Opening section of this person's portrait in your voice as Nerin.`;

						const response = await client.messages.create({
							model: config.teaserModelId,
							max_tokens: 1024,
							system: TEASER_SYSTEM_PROMPT,
							messages: [{ role: "user", content: userPrompt }],
						});

						const textBlock = response.content.find((b) => b.type === "text");
						const rawText = textBlock?.text ?? "";

						const tokenUsage = {
							input: response.usage.input_tokens,
							output: response.usage.output_tokens,
						};

						// Parse structured JSON response, fallback to raw text + default titles
						const DEFAULT_LOCKED_TITLES = [
							"Your Inner Landscape",
							"The Unexpected Turn",
							"Where It All Leads",
						] as const;

						let portrait: string;
						let lockedSectionTitles: ReadonlyArray<string>;

						try {
							const parsed = JSON.parse(rawText);
							portrait =
								typeof parsed.opening === "string" && parsed.opening.length > 0 ? parsed.opening : rawText;
							lockedSectionTitles =
								Array.isArray(parsed.lockedSectionTitles) &&
								parsed.lockedSectionTitles.length === 3 &&
								parsed.lockedSectionTitles.every((t: unknown) => typeof t === "string" && t.length > 0)
									? parsed.lockedSectionTitles
									: [...DEFAULT_LOCKED_TITLES];
						} catch {
							// JSON parse failed — treat raw text as portrait, use defaults
							portrait = rawText;
							lockedSectionTitles = [...DEFAULT_LOCKED_TITLES];
							logger.warn("Teaser portrait JSON parse failed, using raw text fallback", {
								sessionId: input.sessionId,
							});
						}

						logger.info("Teaser portrait generated", {
							sessionId: input.sessionId,
							portraitLength: portrait.length,
							lockedSectionTitles,
							tokenUsage,
						});

						return { portrait, lockedSectionTitles, modelUsed: config.teaserModelId, tokenUsage };
					},
					catch: (error) =>
						new TeaserPortraitError({
							message: error instanceof Error ? error.message : String(error),
						}),
				}),
		});
	}),
);
