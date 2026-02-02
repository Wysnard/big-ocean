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
	type FacetEvidence,
	LoggerRepository,
	MalformedEvidenceError,
} from "@workspace/domain";
import { Effect, Layer, Schema as S } from "effect";

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
5. Confidence 0.0-1.0: Higher = more certain interpretation
6. Quote exact substring from user message (preserve formatting)
7. highlightRange uses 0-based character indices

**Output Format (JSON only, no markdown):**
[
  {
    "facet": "imagination",
    "score": 16,
    "confidence": 0.8,
    "quote": "I love daydreaming about...",
    "highlightRange": { "start": 0, "end": 25 }
  }
]`;

/**
 * Effect Schema for FacetEvidence validation and transformation
 *
 * Validates JSON response from Claude and transforms to FacetEvidence.
 * Follows Effect Schema naming convention: AFromB (output from input).
 */

// Highlight range schema for character positions
const HighlightRange = S.Struct({
	start: S.Number.pipe(S.int(), S.greaterThanOrEqualTo(0)),
	end: S.Number.pipe(S.int(), S.greaterThan(0)),
});

// Literal union of all valid Big Five facet names
const FacetName = S.Literal(...(ALL_FACETS as readonly [string, ...string[]]));

// Input schema: Claude's JSON response with assessmentMessageId added
const ClaudeResponseWithMessageId = S.Struct({
	assessmentMessageId: S.String,
	facet: FacetName,
	score: S.Number.pipe(S.int(), S.between(0, 20)),
	confidence: S.Number.pipe(S.between(0, 1)),
	quote: S.String,
	highlightRange: HighlightRange,
});

// Output schema: Domain FacetEvidence structure
const FacetEvidenceSchema = S.mutable(
	S.Struct({
		assessmentMessageId: S.String,
		facetName: FacetName,
		score: S.Number,
		confidence: S.Number,
		quote: S.String,
		highlightRange: S.mutable(HighlightRange),
	}),
);

/**
 * FacetEvidenceFromClaudeResponse
 *
 * Schema transformation: ClaudeResponseWithMessageId → FacetEvidence
 * Follows Effect Schema naming convention (OutputFromInput).
 *
 * Transforms Claude's response (with assessmentMessageId added) to domain FacetEvidence.
 * Renames 'facet' to 'facetName' to match domain model.
 */
const FacetEvidenceFromClaudeResponse = S.transform(
	ClaudeResponseWithMessageId,
	FacetEvidenceSchema,
	{
		strict: true,
		decode: (response): FacetEvidence => ({
			assessmentMessageId: response.assessmentMessageId,
			facetName: response.facet as FacetEvidence["facetName"],
			score: response.score,
			confidence: response.confidence,
			quote: response.quote,
			highlightRange: {
				start: response.highlightRange.start,
				end: response.highlightRange.end,
			},
		}),
		encode: (evidence) => ({
			assessmentMessageId: evidence.assessmentMessageId,
			facet: evidence.facetName,
			score: evidence.score,
			confidence: evidence.confidence,
			quote: evidence.quote,
			highlightRange: evidence.highlightRange,
		}),
	},
);

// Array transformation schema
const FacetEvidenceArrayFromClaudeResponse = S.mutable(S.Array(FacetEvidenceFromClaudeResponse));

/**
 * Parse and validate Claude response using Effect Schema transformations
 *
 * Uses Effect Schema for declarative JSON parsing, validation, and transformation.
 * Automatically validates facet names against the 30 Big Five facets via literal union.
 * Transforms Claude's response structure to FacetEvidence using schema transformations.
 */
function parseResponse(
	rawOutput: string,
	assessmentMessageId: string,
): Effect.Effect<
	S.Schema.Type<typeof FacetEvidenceArrayFromClaudeResponse>,
	MalformedEvidenceError
> {
	return Effect.gen(function* () {
		// Strip markdown code blocks if present (Claude sometimes wraps JSON in code blocks)
		const cleaned = rawOutput.trim().replace(/^```(?:json)?\n?|\n?```$/g, "");

		// Parse JSON string
		const parsed = yield* Effect.try({
			try: () => JSON.parse(cleaned) as unknown,
			catch: (error) =>
				new MalformedEvidenceError({
					assessmentMessageId,
					rawOutput: rawOutput.substring(0, 500),
					parseError: error instanceof Error ? error.message : String(error),
					message: "Failed to parse JSON",
				}),
		});

		// Inject assessmentMessageId into each parsed item
		const parsedWithMessageId = yield* Effect.try({
			try: () => {
				if (!Array.isArray(parsed)) {
					throw new Error("Expected array from Claude response");
				}
				return parsed.map((item) => ({
					...item,
					assessmentMessageId,
				}));
			},
			catch: (error) =>
				new MalformedEvidenceError({
					assessmentMessageId,
					rawOutput: rawOutput.substring(0, 500),
					parseError: error instanceof Error ? error.message : String(error),
					message: "Failed to add assessmentMessageId to parsed data",
				}),
		});

		// Validate and transform using Effect Schema
		return yield* S.decodeUnknown(FacetEvidenceArrayFromClaudeResponse)(parsedWithMessageId).pipe(
			Effect.mapError(
				(error) =>
					new MalformedEvidenceError({
						assessmentMessageId,
						rawOutput: rawOutput.substring(0, 500),
						parseError: String(error),
						message: "Schema validation failed - invalid structure or facet name",
					}),
			),
		);
	});
}

/**
 * Analyzer Repository Layer (Production)
 *
 * Uses Claude Sonnet 4.5 via ChatAnthropic for facet analysis.
 * Requires ANTHROPIC_API_KEY environment variable.
 *
 * Layer type: Layer<AnalyzerRepository, never, LoggerRepository>
 */
export const AnalyzerClaudeRepositoryLive = Layer.effect(
	AnalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		// Create ChatAnthropic model
		const model = new ChatAnthropic({
			model: process.env.ANALYZER_MODEL_ID || "claude-sonnet-4-20250514",
			maxTokens: Number(process.env.ANALYZER_MAX_TOKENS) || 2048,
			temperature: Number(process.env.ANALYZER_TEMPERATURE) || 0.3, // Lower temperature for structured output
		});

		logger.info("Analyzer Claude repository initialized", {
			model: process.env.ANALYZER_MODEL_ID || "claude-sonnet-4-20250514",
		});

		// Return service implementation
		return AnalyzerRepository.of({
			analyzeFacets: (assessmentMessageId: string, content: string) =>
				Effect.gen(function* () {
					const startTime = Date.now();

					// Call Claude with system prompt and user message
					const response = yield* Effect.tryPromise({
						try: async () => {
							const result = await model.invoke([
								{
									role: "system" as const,
									content: ANALYZER_SYSTEM_PROMPT,
								},
								{
									role: "user" as const,
									content: `Analyze this message for personality facet signals:\n\n${content}`,
								},
							]);

							return String(result.content);
						},
						catch: (error) =>
							new AnalyzerError({
								assessmentMessageId,
								message: "Failed to invoke Claude for facet analysis",
								cause: error instanceof Error ? error.message : String(error),
							}),
					});

					// Parse and validate response
					// Cast to FacetEvidence[] since schema output is structurally compatible
					const evidence = (yield* parseResponse(response, assessmentMessageId)) as FacetEvidence[];

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
