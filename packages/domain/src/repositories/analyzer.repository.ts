import { Context, Effect } from "effect";
import type { FacetEvidence } from "../types/facet-evidence.js";
import {
  AnalyzerError,
  InvalidFacetNameError,
  MalformedEvidenceError,
} from "@workspace/contracts";

/**
 * Analyzer Repository Service Tag
 *
 * Service interface for analyzing user messages and extracting personality facet evidence.
 * Follows hexagonal architecture pattern - this is the port (interface) that adapters implement.
 *
 * Implementation approaches:
 * - Production: AnalyzerClaudeRepositoryLive (uses Claude Sonnet 4.5 with structured JSON)
 * - Testing: createTestAnalyzerRepository() (returns mock evidence for deterministic tests)
 *
 * @see packages/infrastructure/src/repositories/analyzer.claude.repository.ts
 */
export class AnalyzerRepository extends Context.Tag("AnalyzerRepository")<
  AnalyzerRepository,
  {
    /**
     * Analyze a user message and extract facet evidence
     *
     * Uses LLM to identify signals for all 30 Big Five facets across 5 traits.
     * Returns structured evidence with scores, confidence, quotes, and highlight ranges.
     *
     * Algorithm: Single JSON call with Claude Sonnet 4.5 (Path 2 from Tree of Thoughts)
     * - Cost: ~$0.003 per message
     * - Latency: 1-2 seconds
     * - Output: Array of FacetEvidence with messageId, facet, score (0-20), confidence (0-1), quote, highlightRange
     *
     * @param messageId - ID of the message being analyzed (for evidence linkage)
     * @param content - User message text to analyze for personality signals
     * @returns Effect with array of facet evidence (typically 3-10 facets per message)
     * @throws AnalyzerError - Generic LLM invocation failure
     * @throws MalformedEvidenceError - JSON parsing or structure validation failure
     * @throws InvalidFacetNameError - Facet name not in the 30 Big Five facets
     *
     * @example
     * ```typescript
     * const analyzer = yield* AnalyzerRepository;
     * const evidence = yield* analyzer.analyzeFacets(
     *   "msg_123",
     *   "I love exploring new ideas and thinking creatively."
     * );
     * // Returns: [
     * //   { facet: "imagination", score: 18, confidence: 0.9, quote: "love exploring new ideas", ... },
     * //   { facet: "intellect", score: 16, confidence: 0.8, quote: "thinking creatively", ... }
     * // ]
     * ```
     */
    readonly analyzeFacets: (
      messageId: string,
      content: string,
    ) => Effect.Effect<
      FacetEvidence[],
      AnalyzerError | MalformedEvidenceError | InvalidFacetNameError,
      never
    >;
  }
>() {}
