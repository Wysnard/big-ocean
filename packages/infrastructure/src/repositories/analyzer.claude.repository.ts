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

import { Layer, Effect, Schema as S } from "effect";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  AnalyzerRepository,
  type FacetEvidence,
  LoggerRepository,
  AnalyzerError,
  InvalidFacetNameError,
  MalformedEvidenceError,
  ALL_FACETS,
} from "@workspace/domain";

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
 * Effect Schema for FacetEvidence validation
 *
 * Validates JSON response from Claude matches expected structure.
 */
const HighlightRangeSchema = S.Struct({
  start: S.Number.pipe(S.int(), S.greaterThanOrEqualTo(0)),
  end: S.Number.pipe(S.int(), S.greaterThan(0)),
});

const FacetEvidenceSchema = S.Struct({
  facet: S.String,
  score: S.Number.pipe(S.int(), S.between(0, 20)),
  confidence: S.Number.pipe(S.between(0, 1)),
  quote: S.String,
  highlightRange: HighlightRangeSchema,
});

const FacetEvidenceArraySchema = S.Array(FacetEvidenceSchema);

/**
 * Validate facet name against the 30 Big Five facets
 */
function validateFacetName(
  facetName: string
): Effect.Effect<void, InvalidFacetNameError> {
  return (ALL_FACETS as readonly string[]).includes(facetName)
    ? Effect.void
    : Effect.fail(
        new InvalidFacetNameError({
          facetName,
          validFacets: ALL_FACETS,
          message: `Invalid facet name: ${facetName}. Must be one of the 30 Big Five facets.`,
        })
      );
}

/**
 * Parse and validate Claude response
 */
function parseResponse(
  rawOutput: string,
  messageId: string
): Effect.Effect<
  FacetEvidence[],
  MalformedEvidenceError | InvalidFacetNameError
> {
  return Effect.gen(function* () {
    // Strip markdown code blocks if present
    const cleaned = rawOutput.trim().replace(/^```(?:json)?\n?|\n?```$/g, "");

    // Parse JSON
    const parsed = yield* Effect.try({
      try: () => JSON.parse(cleaned),
      catch: (error) =>
        new MalformedEvidenceError({
          messageId,
          rawOutput: rawOutput.substring(0, 500), // Truncate for logging
          parseError: error instanceof Error ? error.message : String(error),
          message: "Failed to parse analyzer JSON response",
        }),
    });

    // Validate schema
    const validated = yield* S.decodeUnknown(FacetEvidenceArraySchema)(
      parsed
    ).pipe(
      Effect.mapError(
        (error) =>
          new MalformedEvidenceError({
            messageId,
            rawOutput: rawOutput.substring(0, 500),
            parseError: String(error),
            message: "Response structure validation failed",
          })
      )
    );

    // Validate facet names
    for (const evidence of validated) {
      yield* validateFacetName(evidence.facet);
    }

    // Convert to FacetEvidence with messageId
    return validated.map((e) => ({
      messageId,
      facetName: e.facet as any, // Type is safe because validateFacetName already verified it
      score: e.score,
      confidence: e.confidence,
      quote: e.quote,
      highlightRange: e.highlightRange,
    }));
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
      analyzeFacets: (messageId: string, content: string) =>
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
                messageId,
                message: "Failed to invoke Claude for facet analysis",
                cause: error instanceof Error ? error.message : String(error),
              }),
          });

          // Parse and validate response
          const evidence = yield* parseResponse(response, messageId);

          const duration = Date.now() - startTime;

          logger.info("Facet analysis completed", {
            messageId,
            evidenceCount: evidence.length,
            durationMs: duration,
            facets: evidence.map((e) => e.facetName),
          });

          return evidence;
        }),
    });
  })
);
